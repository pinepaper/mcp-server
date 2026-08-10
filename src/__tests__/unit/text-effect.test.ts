/**
 * pinepaper_text_effect — the 37 character-level text effects via
 * app.applyTextEffect / app.listTextEffects.
 *
 * The contract points that matter, and why each is pinned here:
 *
 *  - The source text item is REMOVED and replaced by one item per character.
 *    Every other id-touching tool in this server PRESERVES the registry id
 *    (text_style adopts it, crop/chroma keep it), so this one inverts the
 *    house convention. If `sourceRemoved` or the ⚠️ warning ever drops out of
 *    the surface, callers lose relations silently — hence assertions on both.
 *  - `applyTextEffect` is ASYNC (it lazy-imports the effects chunk). A sync
 *    IIFE would hand the bridge a pending Promise, which reads as an empty
 *    success. The `async`/`await` pair is asserted, not assumed.
 *  - `r.items` are live Paper objects and must NOT be forwarded — they don't
 *    survive serialization across the bridge.
 *  - `options` spreads BEFORE the named fields, because the schema advertises
 *    that precedence.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { TextEffectInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { TOOL_TAGS, getToolsForToolkit } from '../../tools/toolkits.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';

describe('TextEffectInputSchema validation', () => {
  it('apply requires itemId and effect', () => {
    expect(TextEffectInputSchema.safeParse({ action: 'apply' }).success).toBe(false);
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1' }).success).toBe(false);
    expect(TextEffectInputSchema.safeParse({ action: 'apply', effect: 'matrix' }).success).toBe(false);
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'matrix' }).success).toBe(true);
  });

  it('list needs nothing', () => {
    expect(TextEffectInputSchema.safeParse({ action: 'list' }).success).toBe(true);
  });

  it('effect is a free string, NOT an enum — the engine owns the vocabulary', () => {
    // An enum here would pin the server to today's 37 and reject the 38th the
    // day FxTool adds it. The engine's own error names the valid keys.
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'some_future_effect' }).success).toBe(true);
  });

  it('rejects a non-positive duration and a non-integer seed', () => {
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'rain', duration: 0 }).success).toBe(false);
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'rain', duration: -2 }).success).toBe(false);
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'rain', seed: 1.5 }).success).toBe(false);
  });

  it('constrains gradientDirection to the engine GRADIENT_DIRECTIONS', () => {
    for (const dir of ['vertical', 'horizontal', 'radial', 'diagonal']) {
      expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'burn', gradientDirection: dir }).success).toBe(true);
    }
    expect(TextEffectInputSchema.safeParse({ action: 'apply', itemId: 't1', effect: 'burn', gradientDirection: 'sideways' }).success).toBe(false);
  });
});

describe('generateTextEffect codegen', () => {
  it('apply awaits the async facade — a sync wrapper would return a pending Promise', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'decrypt',
    }));
    expect(c).toContain('(async function()');
    expect(c).toContain('await app.applyTextEffect("t1", "decrypt"');
    expect(c).toContain('app.applyTextEffect unavailable');
  });

  it('forwards ids/count/duration and NEVER the live Paper items', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'matrix',
    }));
    expect(c).toContain('ids: r.ids');
    expect(c).toContain('count: r.count');
    expect(c).toContain('duration: r.duration');
    // r.items can't cross the bridge; forwarding it yields a broken payload.
    expect(c).not.toContain('items: r.items');
  });

  it('reports sourceRemoved so a destroyed id cannot go unnoticed', () => {
    const gone = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'burn',
    }));
    expect(gone).toContain('sourceRemoved: true');

    const kept = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'burn', keepSource: true,
    }));
    expect(kept).toContain('sourceRemoved: false');
    expect(kept).toContain('"keepSource":true');
  });

  it('spreads options FIRST so named fields win on collision', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'swarm',
      duration: 4, options: { duration: 99, spread: 12 },
    }));
    expect(c).toContain('"spread":12');
    expect(c).toContain('"duration":4');
    expect(c).not.toContain('"duration":99');
  });

  it('passes gradient controls through, including gradient:false', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'waves',
      gradient: false, gradientStops: ['#fff', '#000'], gradientDirection: 'radial', gradientSteps: 8, seed: 7,
    }));
    expect(c).toContain('"gradient":false');
    expect(c).toContain('"gradientStops":["#fff","#000"]');
    expect(c).toContain('"gradientDirection":"radial"');
    expect(c).toContain('"gradientSteps":8');
    expect(c).toContain('"seed":7');
  });

  it('omits unspecified options rather than sending undefined defaults', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({
      action: 'apply', itemId: 't1', effect: 'pour',
    }));
    // The engine owns the defaults (duration 2.5, seed 1). Emitting our own
    // would silently fork them the moment the engine's change.
    expect(c).toContain('app.applyTextEffect("t1", "pour", {})');
  });

  it('list awaits and reports a count', () => {
    const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse({ action: 'list' }));
    expect(c).toContain('(async function()');
    expect(c).toContain('await app.listTextEffects()');
    expect(c).toContain('count: effects.length');
    expect(c).toContain('app.listTextEffects unavailable');
  });

  it('every action emits balanced, parseable code', () => {
    for (const input of [
      { action: 'apply' as const, itemId: 't1', effect: 'rings' },
      { action: 'list' as const },
    ]) {
      const c = codeGenerator.generateTextEffect(TextEffectInputSchema.parse(input));
      expect(c.length).toBeGreaterThan(0);
      expect((c.match(/\(/g) || []).length).toBe((c.match(/\)/g) || []).length);
      expect((c.match(/\{/g) || []).length).toBe((c.match(/\}/g) || []).length);
    }
  });
});

describe('pinepaper_text_effect registration', () => {
  const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_text_effect');

  it('is registered with a minimal description', () => {
    expect(tool).toBeDefined();
    expect(MINIMAL_DESCRIPTIONS['pinepaper_text_effect']).toBeTruthy();
  });

  it('warns in the description that the text item is replaced', () => {
    // This is the whole reason the tool needs a loud description: it inverts
    // the id-preservation convention every neighbouring tool follows.
    expect(tool!.description).toContain('REPLACES THE TEXT ITEM');
    expect(tool!.description).toContain('keepSource');
    expect(tool!.annotations?.destructiveHint).toBe(true);
  });

  it('lists all 37 effect keys, so `list` is a convenience and not a prerequisite', () => {
    const keys = ['scattered', 'expand', 'spray', 'slice', 'bouncyballs', 'pour', 'slide', 'print',
      'randomsequence', 'wipe', 'sweep', 'highlight', 'middleout', 'fireworks', 'blackhole', 'unstable',
      'crumble', 'rings', 'swarm', 'orbittingvolley', 'overflow', 'decrypt', 'errorcorrect', 'matrix',
      'binarypath', 'rain', 'burn', 'smoke', 'thunderstorm', 'bubbles', 'waves', 'beams', 'laseretch',
      'spotlights', 'synthgrid', 'vhstape', 'colorshift'];
    expect(keys.length).toBe(37);
    for (const k of keys) expect(tool!.description).toContain(k);
  });

  it('is tagged exactly once and reachable from the default agent toolkit', () => {
    const tags = Object.entries(TOOL_TAGS).filter(([, names]) => names.includes('pinepaper_text_effect'));
    expect(tags.map(([t]) => t)).toEqual(['effects']);
    expect(getToolsForToolkit(PINEPAPER_TOOLS, 'agent').map((t) => t.name)).toContain('pinepaper_text_effect');
  });
});
