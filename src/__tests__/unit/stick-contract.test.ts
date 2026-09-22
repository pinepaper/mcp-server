/**
 * The stick tool spread its whole input at the engine and agreed with it about
 * almost nothing.
 *
 * `generateStick` does `const { action, ...rest }` and passes everything to
 * app.stickFigure. That made every field look CONSUMED — a spread is a read,
 * and schema-fields-are-consumed says so correctly — while four of them meant
 * something the engine does not:
 *
 *   propSide   schema 'left' | 'right'      engine compares against 'L' | 'R'
 *   expressions  [{at, name}]               engine filters on b.expression
 *   walk       true | {…}                   engine iterates it as an array
 *   travel     {…}                          engine needs an array of >= 2
 *
 * None of them threw. The prop went to the left hand whichever side you asked
 * for, the expression beats were filtered out to the last one, and `walk: true`
 * — the form the schema itself called "the default" — walked nowhere. A guard
 * that asks "is this name read" cannot see any of it, which is why these are
 * pinned by behaviour instead.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { StickInputSchema } from '../../types/schemas.js';


/** The opts object literal the emitter hands to app.stickFigure / app.stickSet. */
function emittedOpts(input: unknown): Record<string, unknown> {
  const code = codeGenerator.generateStick(StickInputSchema.parse(input));
  const m = /app\.stick(?:Figure|Set)\((\{[\s\S]*?\})\);/.exec(code);
  if (!m) throw new Error(`no engine call in:\n${code}`);
  return JSON.parse(m[1]) as Record<string, unknown>;
}

describe('the stick tool speaks the engine contract', () => {
  it('normalises propSide to the L/R the engine tests against', () => {
    // `str(opts.propSide, 'L').toUpperCase() === 'R' ? 'R' : 'L'` — 'RIGHT'
    // equals neither, so the long spelling silently meant left.
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'right' }).propSide).toBe('R');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'left' }).propSide).toBe('L');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'R' }).propSide).toBe('R');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'L' }).propSide).toBe('L');
  });

  it('turns walk: true into a cycle the engine will iterate', () => {
    expect(emittedOpts({ action: 'figure', walk: true }).walk).toEqual([{ seconds: 1.2, from: 0 }]);
  });

  it('drops walk: false rather than sending a value the engine cannot read', () => {
    expect(emittedOpts({ action: 'figure', walk: false })).not.toHaveProperty('walk');
  });

  it('passes an explicit walk array through untouched', () => {
    const walk = [{ seconds: 2, from: 0 }, { seconds: 2, from: 4 }];
    expect(emittedOpts({ action: 'figure', walk }).walk).toEqual(walk);
  });

  it('refuses facing on a figure by name instead of dropping it', () => {
    const code = codeGenerator.generateStick(StickInputSchema.parse({ action: 'figure', facing: 'left' }));
    expect(code).not.toContain('await app.stickFigure(');
    expect(code).toContain('success: false');
    expect(code).toContain('never reads it');
    // The message names quoted values; emitting it unescaped was a syntax error.
    expect(() => new Function(`return ${code}`)).not.toThrow();
  });

  it('still takes facing on a set, where a chair reads it', () => {
    expect(emittedOpts({ action: 'set', kind: 'chair', facing: 'left' }).facing).toBe('left');
  });
});

describe('the stick schema types match what the engine coerces', () => {
  it('names expression beats the way the engine filters them', () => {
    // `opts.expressions.filter(b => EXPRESSIONS[b.expression])` — a beat keyed
    // `name` filtered to nothing, so expressions-over-time did nothing at all.
    const beats = [{ at: 0, expression: 'happy' }, { at: 2, expression: 'sad' }];
    expect(emittedOpts({ action: 'figure', expressions: beats }).expressions).toEqual(beats);
    expect(() => StickInputSchema.parse({ action: 'figure', expressions: [{ at: 0, name: 'happy' }] })).toThrow();
  });

  it('requires travel to be two or more waypoints', () => {
    // `Array.isArray(opts.travel) && opts.travel.length >= 2` — an object, or
    // a single point, was accepted by the schema and ignored by the engine.
    const travel = [{ t: 0, x: 0, y: 0 }, { t: 3, x: 400, y: 0 }];
    expect(emittedOpts({ action: 'figure', travel }).travel).toEqual(travel);
    expect(() => StickInputSchema.parse({ action: 'figure', travel: [{ t: 0, x: 0, y: 0 }] })).toThrow();
    expect(() => StickInputSchema.parse({ action: 'figure', travel: { to: 'right' } })).toThrow();
  });

  it('types the set fields as the engine reads them', () => {
    // items is num(opts.items, 3), object/floor/wall are str(...) — every one
    // of these was declared as a boolean or a spec object, so every one was
    // coerced away to nothing.
    expect(emittedOpts({ action: 'set', kind: 'shelf', items: 5 }).items).toBe(5);
    expect(emittedOpts({ action: 'set', kind: 'tabletop', object: 'cup' }).object).toBe('cup');
    expect(emittedOpts({ action: 'set', kind: 'room', floor: '#333', wall: '#eee' })).toMatchObject({
      floor: '#333',
      wall: '#eee',
    });
    expect(() => StickInputSchema.parse({ action: 'set', kind: 'room', floor: true })).toThrow();
    expect(() => StickInputSchema.parse({ action: 'set', kind: 'shelf', items: [{ a: 1 }] })).toThrow();
  });
});
