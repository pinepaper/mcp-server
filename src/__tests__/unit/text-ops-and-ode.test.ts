/**
 * The last of the sweep: four text operations and the ODE solver.
 *
 * Worth recording what ISN'T here. createFoldedText, createGradientText,
 * createMagazineText, createPaperCutText and createTileText all read as gaps
 * in a method-name diff, and all five are one-line wrappers over
 * letterCollage.create(text, {style: X}) — every one of those styles is
 * already in pinepaper_create_letter_collage's enum. Same for plotFunction,
 * plotParametric and plotSurface, which wrap executeGenerator over three
 * generators the tool surface already exposes.
 *
 * Four things were genuinely unreachable, and they are these.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { TextStyleInputSchema, LetterCollageStyleSchema, EquationPathInputSchema } from '../../types/schemas.js';

const text = (i: Record<string, unknown>) => codeGenerator.generateTextStyle(TextStyleInputSchema.parse(i));

describe('text operations', () => {
  it('cursive writes a STROKED PATH, which is why it is not a font', () => {
    const code = text({ action: 'cursive', text: 'hello', cursiveOptions: { scale: 2, strokeColor: '#000' } });
    expect(code).toContain('app.createCursiveText("hello"');
    expect(code).toContain('"scale":2');
    // The answer is { items, group }, not an item — see text-style-props.test.ts.
    expect(code).toContain('const g = r && (r.group');
    // A path, not a glyph — so draw-on animation and outline_stroke apply.
    expect(code).toContain('STROKED handwriting');
  });

  it('wrap is reversible and unwrap passes the engine\'s own refusal through', () => {
    expect(text({ action: 'wrap', itemId: 't1', maxWidth: 300 })).toContain('app.wrapText("t1", 300)');
    const un = text({ action: 'unwrap', itemId: 't1' });
    expect(un).toContain('app.unwrapText("t1")');
    // "not wrapped" is more specific than anything this layer could infer.
    expect(un).toContain('r.error');
  });

  it('to_collage names the missing subsystem instead of a silent no-op', () => {
    // convertTextToCollage returns a bare null when letterCollage is absent,
    // which would read as "the conversion did nothing to your text".
    const code = text({ action: 'to_collage', itemId: 't1', collageOptions: { style: 'tile' } });
    expect(code).toContain('app.convertTextToCollage(item');
    expect(code).toContain('collage system is unavailable');
    expect(code).toContain('left as it was');
    expect(code).toContain('no such item');
  });

  it('every variant parses', () => {
    for (const i of [
      { action: 'cursive', text: 'x' }, { action: 'wrap', itemId: 't', maxWidth: 10 },
      { action: 'unwrap', itemId: 't' }, { action: 'to_collage', itemId: 't' },
    ]) expect(() => new Function(text(i))).not.toThrow();
  });
});

describe('what a method-name diff got wrong, pinned', () => {
  it('every create*Text style is already a letter-collage style', () => {
    // createFoldedText → style 'fold', createGradientText → 'gradient', and so
    // on. If one of these ever leaves the enum, the wrapper stops being
    // covered and this test says so.
    for (const style of ['tile', 'magazine', 'paperCut', 'fold', 'gradient']) {
      expect(LetterCollageStyleSchema.safeParse(style).success).toBe(true);
    }
  });
});

describe('the ODE solver', () => {
  const gen = (i: Record<string, unknown>) =>
    codeGenerator.generateEquationPath(EquationPathInputSchema.parse(i));

  it('integrates and returns the solution rather than drawing it', () => {
    const code = gen({ solveOde: { equations: ['v', '-9.8'], initialState: [0, 0], tEnd: 5, dt: 0.01 } });
    expect(code).toContain('app.solveODE(');
    expect(code).toContain('"equations":["v","-9.8"]');
    expect(code).toContain('solution: sol');
    expect(code).toContain('nothing is drawn');
    expect(() => new Function(code)).not.toThrow();
  });

  it('defaults to rk4 and takes euler when asked', () => {
    expect(gen({ solveOde: { equations: 'y', initialState: [1] } })).toContain('"rk4"');
    expect(gen({ solveOde: { equations: 'y', initialState: [1], method: 'euler' } })).toContain('"euler"');
  });

  it('a null solution is a failure that points at the likely cause', () => {
    const code = gen({ solveOde: { equations: 'y', initialState: [1] } });
    expect(code).toContain('check the equations and the initial state length');
  });

  it('leaves the ordinary plotting path alone', () => {
    // Without solveOde this is still the closed-form path — the branch must
    // not capture every equation call.
    const plain = gen({ expression: 'sin(t)' });
    expect(plain).not.toContain('app.solveODE');
  });
});
