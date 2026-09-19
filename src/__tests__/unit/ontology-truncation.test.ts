/**
 * A partial scene read must SAY it is partial.
 *
 * FxTool's exportCanvasOntology returns `itemCount: allItems.length` — the true
 * total — beside `items: allItems.slice(0, maxItems)`, and `childCount` beside
 * a children array capped at maxChildren. Both caps are deliberate and correct;
 * what was missing is any marker distinguishing "the scene has 500 items" from
 * "the scene has 800 and you are seeing 500". A model reading the second as the
 * first reasons about a scene that does not exist — and reports success while
 * doing it, which is the silent-refusal class this repo keeps finding.
 *
 * The emitted code is EXECUTED here against a stub engine rather than pattern
 * matched. A test asserting the emitter's source contains the word 'truncated'
 * passes just as well when the field is emitted into an unreachable branch.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { GetCanvasOntologyInputSchema } from '../../types/schemas.js';

const gen = new PinePaperCodeGenerator();

/**
 * Run emitted browser code against a stub `app`.
 *
 * `eval` rather than `'return ' + code`: every emitter opens with a `//`
 * comment, so the naive form becomes `return // Capture canvas…` and ASI ends
 * the statement — the helper returned undefined for all five cases. It was
 * caught only because the assertions read `out.truncated` and threw. Written
 * as `out?.truncated` the whole file would have passed while executing
 * nothing, which is the shape of every vacuous guard in this repo.
 */
function run(code: string, ctx: Record<string, unknown>): any {
  const app = { exportCanvasOntology: () => ctx };
  const out = new Function('app', 'return eval(' + JSON.stringify(code) + ');')(app);
  if (out === undefined) throw new Error('emitted code returned nothing — the harness is broken, not the code');
  return out;
}

const item = (id: string, extra: Record<string, unknown> = {}) => ({ id, type: 'path', ...extra });

describe('scene reads report their own truncation', () => {
  it('marks a scene clipped by maxItems, naming both numbers', () => {
    const out = run(gen.generateGetCanvasOntology({ maxItems: 2 }), {
      canvasWidth: 1920, canvasHeight: 1080, itemCount: 800,
      items: [item('a'), item('b')], triples: [],
    });
    expect(out.success).toBe(true);
    expect(out.truncated).toContain('2 of 800');
    // The knob must be named, or the marker reports a dead end.
    expect(out.truncated).toMatch(/maxItems/);
  });

  it('marks groups whose children were clipped, per group', () => {
    const out = run(gen.generateGetCanvasOntology({ maxChildren: 1 }), {
      itemCount: 2,
      items: [
        item('g1', { childCount: 9, children: [item('c1')] }),
        item('g2', { childCount: 2, children: [item('c1'), item('c2')] }),
      ],
      triples: [],
    });
    expect(out.childrenTruncated).toEqual(['g1: 1 of 9 children']);
  });

  it('stays silent when nothing was clipped', () => {
    // THE OTHER DIRECTION. A marker that is always present is noise, and a
    // model that learns to ignore it is worse off than before.
    const out = run(gen.generateGetCanvasOntology({}), {
      itemCount: 2,
      items: [item('a'), item('b', { childCount: 2, children: [item('c1'), item('c2')] })],
      triples: [],
    });
    expect(out.truncated).toBeUndefined();
    expect(out.childrenTruncated).toBeUndefined();
    expect(out.success).toBe(true);
  });

  it('does not invent a gap when the engine omits itemCount', () => {
    // An older studio returning no itemCount must not be reported as truncated;
    // unknown is not the same as partial.
    const out = run(gen.generateGetCanvasOntology({}), { items: [item('a')], triples: [] });
    expect(out.truncated).toBeUndefined();
  });

  it('the cap the marker names is the cap the schema enforces', () => {
    // NOT CONDITIONAL. The first version wrapped this in `if (maxItems)` and
    // the branch never ran — five green tests, eight assertions, and this one
    // contributing zero. A guard that skips itself when it cannot find its
    // subject reports the same colour as a guard that passed.
    const advertised = /up to (\d+)/.exec(gen.generateGetCanvasOntology({ maxItems: 1 }))?.[1];
    expect(advertised, 'the truncation marker names no cap to raise').toBeTruthy();

    const shape = (GetCanvasOntologyInputSchema as any).shape;
    expect(shape?.maxItems, 'GetCanvasOntologyInputSchema has no maxItems').toBeTruthy();
    // Widening the schema past the number the marker repeats would leave the
    // advice quietly wrong, which is worse than no advice.
    // Unwrap .optional().default() rather than reaching for a fixed depth: the
    // checks live on the innermost ZodNumber, and a hard-coded path breaks
    // silently when a modifier is added to the field.
    let node: any = shape.maxItems;
    while (node?._def && !node._def.checks) node = node._def.innerType;
    const max = (node?._def?.checks ?? []).find((c: any) => c.kind === 'max');
    expect(max, 'maxItems has no upper bound to compare against').toBeTruthy();
    expect(String(max.value)).toBe(advertised);
  });
});
