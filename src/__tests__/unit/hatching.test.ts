/**
 * Hatching — the p5.brush marks, as vector.
 *
 * The engine's `applyHatching` returns a paper Group or **null**, and every one
 * of its five distinct failures is a `console.warn` that production strips. So
 * an agent gets `null` and no way to tell "your spacing is wider than the
 * shape" from "text has no outline" from "that group holds nothing closed".
 *
 * These pin that the emitter turns each of those into a refusal that NAMES THE
 * FIX, and that a truncated group is reported as truncated rather than looking
 * complete.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { DesignMediumInputSchema } from '../../types/schemas.js';

const gen = (input: unknown) =>
  codeGenerator.generateDesignMedium(DesignMediumInputSchema.parse(input) as never);
const run = (code: string, app: unknown) =>
  new Function('app', code.replace('(function()', 'return (function()'))(app);

/** A registry holding one item. */
const registry = (item: unknown) => ({
  itemRegistry: { get: (id: string) => (id === 'item_1' ? { item } : undefined) },
});
const closedPath = (w = 150, h = 150) => ({
  getPointAt: () => ({}), closed: true, length: 400, bounds: { width: w, height: h },
});

describe('apply_hatch — refusals name the fix', () => {
  it('a missing item is named, not just falsy', () => {
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => null,
      itemRegistry: { get: () => undefined },
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('item_1');
  });

  it('text is told to convert to glyph paths, and the engine is never called', () => {
    let called = false;
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => { called = true; return null; },
      ...registry({ content: 'hello', bounds: { width: 100, height: 20 } }),
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('pinepaper_text_style');
    expect(called).toBe(false);
  });

  it('a group with nothing closed says so before calling', () => {
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => null,
      ...registry({ children: [{ getPointAt: () => ({}), closed: false, length: 10 }], bounds: { width: 90, height: 90 } }),
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('no closed paths');
  });

  it('a null result quotes the spacing against the real bounds', () => {
    // Spacing wider than the shape is the usual cause, and is otherwise a
    // silent no-op — the item just vanishes behind an empty group.
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1', distance: 400 }), {
      applyHatching: () => null,
      ...registry(closedPath(150, 150)),
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('400px');
    expect(res.error).toContain('150x150');
  });
});

describe('apply_hatch — the result carries what the engine knows', () => {
  const group = (lines: number, data: Record<string, unknown> = {}) => ({
    children: Array.from({ length: lines }, () => ({})),
    data: { id: 'item_9', angle: 45, spacing: 6, ...data },
  });

  it('forwards the ruling angle, spacing and line count', () => {
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1', distance: 6, angle: 45 }), {
      applyHatching: () => group(24),
      ...registry(closedPath()),
    });
    expect(res).toMatchObject({ success: true, groupId: 'item_9', lines: 24, angle: 45, spacing: 6 });
  });

  it('says the source is hidden and that re-hatching replaces', () => {
    // Both are surprising: the item appears to vanish, and trying spacings in
    // turn is safe — which is the flow the medium exists for.
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => group(10), ...registry(closedPath()),
    });
    expect(res.note).toContain('hidden');
    expect(res.note).toContain('replaces');
  });

  it('reports a truncated group instead of letting it look complete', () => {
    // The engine hatches the first 40 paths of a group and warns about the rest.
    const kids = Array.from({ length: 57 }, () => ({ getPointAt: () => ({}), closed: true, length: 40 }));
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => group(40, { parts: 40 }),
      ...registry({ children: kids, bounds: { width: 800, height: 600 } }),
    });
    expect(res.success).toBe(true);
    expect(res.truncated).toContain('first 40 of 57');
  });

  it('omits truncated when the group fits', () => {
    const kids = Array.from({ length: 5 }, () => ({ getPointAt: () => ({}), closed: true, length: 40 }));
    const res = run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: () => group(20, { parts: 5 }),
      ...registry({ children: kids, bounds: { width: 800, height: 600 } }),
    });
    expect(res.truncated).toBeUndefined();
    expect(res.parts).toBe(5);
  });
});

describe('apply_hatch — options reach the engine', () => {
  it('flowField is passed as the engine key `field`, distinct from the thread field', () => {
    // A thread `field` steers stitches around a form; a hatch flow field bends a
    // ruling line. Same word, different jobs — sharing a key would silently
    // apply one where the other was meant.
    let opts: Record<string, unknown> = {};
    run(gen({ action: 'apply_hatch', itemId: 'item_1', flowField: 'waves', rand: 0.2, continuous: true, gradient: 0.4, t: 2 }), {
      applyHatching: (_id: string, o: Record<string, unknown>) => { opts = o; return { children: [{}], data: {} }; },
      ...registry(closedPath()),
    });
    expect(opts).toMatchObject({ field: 'waves', rand: 0.2, continuous: true, gradient: 0.4, t: 2 });
    expect(opts.flowField).toBeUndefined();
  });

  it('an option the caller did not set is not sent, so engine defaults stand', () => {
    let opts: Record<string, unknown> = {};
    run(gen({ action: 'apply_hatch', itemId: 'item_1' }), {
      applyHatching: (_id: string, o: Record<string, unknown>) => { opts = o; return { children: [], data: {} }; },
      ...registry(closedPath()),
    });
    expect(Object.keys(opts)).toEqual([]);
  });

  it('itemId is required', () => {
    expect(DesignMediumInputSchema.safeParse({ action: 'apply_hatch' }).success).toBe(false);
    expect(DesignMediumInputSchema.safeParse({ action: 'apply_hatch', itemId: 'x' }).success).toBe(true);
  });
});

describe('the hatch listings', () => {
  it('list_flow_fields and list_hatch_options delegate and guard', () => {
    for (const [action, method] of [
      ['list_flow_fields', 'listFlowFields'],
      ['list_hatch_options', 'listHatchOptions'],
    ] as const) {
      const code = gen({ action });
      expect(code).toContain(`app.${method}`);
      expect(run(code, {}).error).toContain('update FxTool');
    }
  });

  it('list_flow_fields counts what it returns', () => {
    const res = run(gen({ action: 'list_flow_fields' }), {
      listFlowFields: () => [{ kind: 'hand' }, { kind: 'waves' }],
    });
    expect(res.count).toBe(2);
  });
});
