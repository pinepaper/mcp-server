/**
 * Two emitter behaviours the docs did not state (tester, 1.6.36).
 *
 * EMSETBURST36: set merges the spec's top-level keys, so bursts: [one] REPLACES the emitter's bursts. The docs
 * said "merge a partial spec"; the reply now gives the counts before and after.
 * SPAWNAX36: spawn is a [width, height] box on the canvas axes, not a range and not turned to the burst's
 * angle. spawn [0, 200] with angle 0 drew a vertical column that flew right; said where the two meet.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator, normalizeEmitterSpec } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = new PinePaperCodeGenerator();
const run = (code: string, app: Record<string, unknown>) => new Function('app', `return (${code.trim().replace(/;\s*$/, '')});`)(app);

describe('emitter set with bursts', () => {
  it('says the bursts were replaced, with the counts before and after', () => {
    const stored = { bursts: [{ t: 0 }, { t: 1 }] };
    const app = {
      getItemById: () => ({ data: { emitter: stored } }),
      setEmitter: (_id: string, patch: Record<string, unknown>) => ({ ok: true, spec: { ...stored, ...patch } }),
    };
    const r = run(gen.generateEmitter({ action: 'set', itemId: 'em_1', spec: { bursts: [{ t: 2, x: 0, y: 0, count: 5 }] } } as never), app);
    expect(r.success).toBe(true);
    expect(r.burstsReplaced).toMatchObject({ before: 2, after: 1 });
    expect(r.burstsReplaced.note).toContain('pass the existing bursts');
  });

  it('a set that does not name bursts says nothing about them', () => {
    const app = { getItemById: () => null, setEmitter: () => ({ ok: true, spec: { gravity: 9 } }) };
    const r = run(gen.generateEmitter({ action: 'set', itemId: 'em_1', spec: { gravity: 9 } } as never), app);
    expect(r.burstsReplaced).toBeUndefined();
  });

  it('the docs say an array replaces, and what spawn is', () => {
    const d = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_emitter')!.description;
    expect(d).toContain('replaces the old array whole');
    expect(d).toContain('spawn: where particles start, as a box [width, height]');
  });
});

describe('spawn beside an aimed angle', () => {
  it('is said once, naming the box', () => {
    const w = normalizeEmitterSpec({ bursts: [{ t: 0, x: 0, y: 0, count: 10, angle: [0, 0], spawn: [0, 200] }] }).warnings;
    expect(w).toEqual([expect.stringContaining('bursts[0]: spawn is a box on the canvas axes centred on the burst point (here 0 wide and 200 tall)')]);
    expect(normalizeEmitterSpec({ spawn: 100, angle: 45, bursts: [{ t: 0, x: 0, y: 0 }] }).warnings.join(' ')).toContain('100 by 100');
  });

  it('is not said for a full-circle burst, or with no spawn', () => {
    expect(normalizeEmitterSpec({ spawn: [40, 40], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings).toEqual([]);
    expect(normalizeEmitterSpec({ spawn: [40, 40], angle: [0, 360], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings).toEqual([]);
    expect(normalizeEmitterSpec({ angle: [0, 10], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings).toEqual([]);
  });
});

describe('ink default colour', () => {
  it('the design_medium docs name the default and how to change it', () => {
    const d = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_design_medium')!.description;
    expect(d).toContain('#16141c');
    expect(d).toContain('options.keepColor: true');
  });
});
