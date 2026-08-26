/**
 * Relative timing, staggers, FLIP, playback rate and input-driven playback —
 * GSAP's vocabulary mirrored onto the engine's own methods.
 *
 * These pin the MCP side of the contract: that each tool DELEGATES to the
 * engine method rather than reimplementing its maths, that the diagnostics the
 * engine reports actually reach the caller, and that the two tools whose engine
 * values cannot cross the tool boundary — a flip record and a scroll unbind
 * FUNCTION — hand off through the page instead of being silently dropped.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import {
  SequenceInputSchema,
  StaggerInputSchema,
  FlipInputSchema,
} from '../../types/schemas.js';

/**
 * Make an emitted snippet return its own result. A leading comment between
 * `return` and the IIFE would be ended by ASI, so attach it to the IIFE itself.
 */
const runnable = (code: string) =>
  code.replace('(function()', 'return (function()').replace('(async function()', 'return (async function()');
const run = (code: string, app: unknown, win?: unknown) =>
  new Function('app', 'window', 'document', runnable(code))(app, win, undefined);

describe('pinepaper_sequence — a pure planner, delegated', () => {
  it('place calls placeSequence and never touches the canvas', () => {
    const code = codeGenerator.generateSequence(SequenceInputSchema.parse({
      action: 'place',
      clips: [{ id: 'title', duration: 2, label: 'intro' }, { id: 'sub', duration: 4, position: '-=25%' }],
    }));
    expect(code).toContain('app.placeSequence');
    expect(code).not.toContain('app.createItem');
    expect(() => new Function(code)).not.toThrow();
  });

  it("echoes the caller's clip ids back onto the placements", () => {
    const code = codeGenerator.generateSequence(SequenceInputSchema.parse({
      action: 'place',
      clips: [{ id: 'title', duration: 2 }, { id: 'sub', duration: 4, position: '-=25%' }],
    }));
    // placeSequence answers positionally; an agent that named its clips should
    // not have to re-zip two arrays by index.
    const res = run(code, {
      placeSequence: () => ({ placed: [{ start: 0, end: 2, duration: 2 }, { start: 1, end: 5, duration: 4 }], labels: {}, duration: 5 }),
    });
    expect(res.placed[0].id).toBe('title');
    expect(res.placed[1].id).toBe('sub');
    expect(res.duration).toBe(5);
  });

  it('resolve threads the context and labels the spec is measured against', () => {
    const code = codeGenerator.generateSequence(SequenceInputSchema.parse({
      action: 'resolve',
      position: 'intro+=0.5',
      context: { timelineEnd: 8, prevStart: 2, prevEnd: 6, insertDuration: 4 },
      labels: { intro: 1.5 },
    }));
    let seen: unknown = null;
    const res = run(code, {
      resolveTimelinePosition: (_spec: unknown, ctx: unknown) => { seen = ctx; return 2; },
    });
    expect(res.seconds).toBe(2);
    expect(seen).toMatchObject({ timelineEnd: 8, prevEnd: 6, insertDuration: 4, labels: { intro: 1.5 } });
  });

  it('the percentage-basis distinction is stated where an agent will read it', async () => {
    const { PINEPAPER_TOOLS } = await import('../../tools/definitions.js');
    const tool = (PINEPAPER_TOOLS as { name: string; description: string }[])
      .find((t) => t.name === 'pinepaper_sequence')!;
    // Getting this backwards yields timings that look almost right, which is
    // the worst kind of wrong to debug.
    expect(tool.description).toContain('BEING INSERTED');
    expect(tool.description).toContain('PREVIOUS');
  });

  it('a missing engine method reports rather than throwing', () => {
    const code = codeGenerator.generateSequence(SequenceInputSchema.parse({ action: 'list_forms' }));
    expect(run(code, {}).error).toContain('update FxTool');
  });
});

describe('pinepaper_stagger', () => {
  it('preview computes delays without touching items', () => {
    const code = codeGenerator.generateStagger(StaggerInputSchema.parse({
      action: 'preview', count: 9, opts: { each: 0.1, from: 'center', grid: [3, 3] },
    }));
    expect(code).toContain('app.staggerDelays');
    expect(code).not.toContain('app.staggerItems');
    const res = run(code, { staggerDelays: () => [0.1, 0.1, 0.1414, 0.1, 0, 0.1, 0.1414, 0.1, 0.1414] });
    expect(res.span).toBeCloseTo(0.1414, 4);
  });

  it('apply refuses an empty itemIds rather than staggering nothing', () => {
    const code = codeGenerator.generateStagger(StaggerInputSchema.parse({ action: 'apply', opts: { each: 0.1 } }));
    const res = run(code, { staggerItems: () => ({ ok: true, delays: [], span: 0, applied: 0 }) });
    expect(res.success).toBe(false);
    expect(res.error).toContain('itemIds');
  });

  it('reports requested vs applied — a partly-resolved run is a real failure', () => {
    const code = codeGenerator.generateStagger(StaggerInputSchema.parse({
      action: 'apply', itemIds: ['a', 'b', 'c'],
    }));
    // Ids that resolve to nothing are skipped by the engine; a stagger that
    // silently covered fewer items than asked for should be visible.
    const res = run(code, { staggerItems: () => ({ ok: true, delays: [0, 0.1], span: 0.1, applied: 2 }) });
    expect(res.requested).toBe(3);
    expect(res.applied).toBe(2);
  });

  it('accepts every form of `from` the engine takes', () => {
    for (const from of ['start', 'end', 'center', 'edges', 'random', 3, [0.5, 0.5]]) {
      expect(StaggerInputSchema.safeParse({ action: 'preview', count: 4, opts: { from } }).success).toBe(true);
    }
  });
});

describe('pinepaper_flip — the record hands off through the page', () => {
  it('record parks the snapshots on the page and returns only a summary', () => {
    const code = codeGenerator.generateFlip(FlipInputSchema.parse({ action: 'record' }));
    const win: Record<string, unknown> = {};
    const res = run(code, {
      recordFlipState: () => ({ snapshots: [{ id: 'a' }, { id: 'b' }], takenAt: 0 }),
    }, win);
    expect(res.recorded).toBe(2);
    expect(res.ids).toEqual(['a', 'b']);
    // The snapshots are raw geometry — useless to read, expensive to carry.
    expect(res.snapshots).toBeUndefined();
    expect((win.__ppFlipRecord as { snapshots: unknown[] }).snapshots).toHaveLength(2);
  });

  it('apply reads that record back', () => {
    const win: Record<string, unknown> = {};
    run(codeGenerator.generateFlip(FlipInputSchema.parse({ action: 'record' })), {
      recordFlipState: () => ({ snapshots: [{ id: 'a' }], takenAt: 0 }),
    }, win);

    const code = codeGenerator.generateFlip(FlipInputSchema.parse({ action: 'apply', duration: 0.6 }));
    let handed: unknown = null;
    const res = run(code, {
      flipItems: (rec: unknown) => { handed = rec; return { ok: true, moved: 1, entered: [], left: ['gone'], duration: 0.6 }; },
    }, win);
    expect((handed as { snapshots: unknown[] }).snapshots).toHaveLength(1);
    // Items that LEFT cannot be animated out — say so rather than dropping it.
    expect(res.left).toEqual(['gone']);
    expect(res.moved).toBe(1);
  });

  it('apply without a record explains the ORDER rather than failing blankly', () => {
    const code = codeGenerator.generateFlip(FlipInputSchema.parse({ action: 'apply' }));
    const res = run(code, { flipItems: () => ({ ok: true }) }, {});
    expect(res.success).toBe(false);
    expect(res.error).toContain('BEFORE the change');
  });
});

describe('pinepaper_play_timeline — rate, progress, scroll', () => {
  it('set_time_scale does not clamp: 0 freezes, negative reverses', () => {
    for (const rate of [0, -1, 0.5]) {
      const code = codeGenerator.generatePlayTimeline('set_time_scale', undefined, undefined, undefined, undefined, { rate });
      const res = run(code, { setTimeScale: (r: number) => r });
      expect(res.rate).toBe(rate);
    }
  });

  it('says export is unaffected, because that is the surprising part', () => {
    const code = codeGenerator.generatePlayTimeline('set_time_scale', undefined, undefined, undefined, undefined, { rate: 0.5 });
    expect(run(code, { setTimeScale: (r: number) => r }).affectsExport).toBe(false);
  });

  it('set_progress returns the seconds it landed on', () => {
    const code = codeGenerator.generatePlayTimeline('set_progress', undefined, undefined, undefined, undefined, { progress: 0.25 });
    const res = run(code, { setProgress: (p: number) => p * 8 });
    expect(res.time).toBe(2);
  });

  it('bind_scroll releases a previous binding before making a new one', () => {
    // The listener holds the scene alive: rebinding without unbinding leaks the
    // old binding AND leaves two of them scrubbing the same timeline.
    let released = 0;
    const win: Record<string, unknown> = { __ppScrubUnbind: () => { released++; } };
    const code = codeGenerator.generatePlayTimeline('bind_scroll', undefined, undefined, undefined, undefined, {
      scroll: { start: 'top bottom', end: 'bottom top', scrub: 0.3 },
    });
    const res = run(code, { bindTimelineToScroll: () => () => {} }, win);
    expect(released).toBe(1);
    expect(res.replaced).toBe(true);
    expect(typeof win.__ppScrubUnbind).toBe('function');
  });

  it('unbind_scroll on nothing bound is an answer, not an error', () => {
    const code = codeGenerator.generatePlayTimeline('unbind_scroll');
    const res = run(code, {}, {});
    expect(res.success).toBe(true);
    expect(res.bound).toBe(false);
  });

  it('unbind_scroll clears the stash so a second call is a no-op', () => {
    const win: Record<string, unknown> = { __ppScrubUnbind: () => {} };
    const code = codeGenerator.generatePlayTimeline('unbind_scroll');
    expect(run(code, {}, win).bound).toBe(true);
    expect(win.__ppScrubUnbind).toBeNull();
  });

  it('every new action emits valid JavaScript and guards on its method', () => {
    const actions = ['set_time_scale', 'get_time_scale', 'get_progress', 'set_progress',
      'bind_scroll', 'unbind_scroll', 'list_scrub_anchors'] as const;
    for (const action of actions) {
      const code = codeGenerator.generatePlayTimeline(action, undefined, undefined, undefined, undefined, {
        rate: 1, progress: 0.5, scroll: {},
      });
      expect(() => new Function(code)).not.toThrow();
      if (action !== 'unbind_scroll') expect(code).toContain('update FxTool');
    }
  });

  it('the original four actions are untouched', () => {
    expect(codeGenerator.generatePlayTimeline('play', 5, true)).toContain('playKeyframeTimeline');
    expect(codeGenerator.generatePlayTimeline('seek', undefined, undefined, 2.5)).toContain('setPlaybackTime(2.5)');
  });
});

describe('the orbits phase exception is documented where it is read', () => {
  it('names phaseDegrees as preferred and phase as the radians legacy', async () => {
    const { PINEPAPER_TOOLS } = await import('../../tools/definitions.js');
    const tool = (PINEPAPER_TOOLS as { name: string; description: string }[])
      .find((t) => t.name === 'pinepaper_add_relation')!;
    const line = tool.description.split('\n').find((l) => l.startsWith('- orbits:'))!;
    expect(line).toContain('phaseDegrees');
    expect(line).toContain('RADIANS');
  });
});
