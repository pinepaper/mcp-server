import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { PenFigureInputSchema } from '../../types/schemas.js';

// Run the generated script against a stub app and read its result.
const run = (code: string, app: Record<string, unknown>) =>
  new Function('app', 'window', `return (\n${code.trim().replace(/;$/, '')}\n)`)(app, {});

const catalogue = [{ id: 'lorenz', title: 'Lorenz attractor', kind: 'ode' }, { id: 'hilbert', title: 'Hilbert curve', kind: 'turtle' }];

describe('pinepaper_pen_figure', () => {
  it('create forwards only the options given and returns both registry ids', () => {
    const calls: unknown[][] = [];
    const code = codeGenerator.generatePenFigure(PenFigureInputSchema.parse({ figure: 'lorenz', duration: 8 }));
    const out = run(code, {
      listFigures: () => catalogue,
      createFigure: (...a: unknown[]) => { calls.push(a); return { ink: 'item_1', pen: 'item_2', title: 'Lorenz attractor', strokes: 1 }; },
    });
    expect(calls[0]).toEqual(['lorenz', { duration: 8 }]);
    expect(out).toMatchObject({ success: true, inkId: 'item_1', penId: 'item_2', duration: 8 });
  });

  it('an unknown figure is refused naming the catalogue (the engine only console.warns)', () => {
    const code = codeGenerator.generatePenFigure({ figure: 'lorentz' });
    const out = run(code, { listFigures: () => catalogue, createFigure: () => null });
    expect(out.success).toBe(false);
    expect(out.error).toContain('lorenz, hilbert');
    expect(out.error).toContain('Nothing was drawn');
  });

  it('pen: false says the ink is drawn with no animation', () => {
    const code = codeGenerator.generatePenFigure({ figure: 'hilbert', pen: false });
    const out = run(code, { listFigures: () => catalogue, createFigure: () => ({ ink: 'item_1', pen: null, title: 'Hilbert curve', strokes: 1 }) });
    expect(out).toMatchObject({ success: true, penId: null });
    expect(out.note).toContain('no animation');
  });

  it('list returns the engine catalogue', () => {
    const out = run(codeGenerator.generatePenFigure({ action: 'list' }), { listFigures: () => catalogue, createFigure: () => null });
    expect(out).toMatchObject({ success: true, count: 2, figures: catalogue });
  });

  it('create without a figure, or on a studio without figures, is refused', () => {
    expect(run(codeGenerator.generatePenFigure({}), {}).success).toBe(false);
    expect(run(codeGenerator.generatePenFigure({ figure: 'lorenz' }), {}).success).toBe(false);
  });
});

describe('create_item lifetime alias', () => {
  it('a numeric lifetime is the ttl, so bornAt beside it does not reset it to "until the end"', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 10, y: 10 }, properties: { radius: 5, bornAt: 2, lifetime: 3 } } as never);
    expect(code).toContain('app.setLifetime(it, 2, 3)');
  });

  it('ttl wins over lifetime when both are given', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 10, y: 10 }, properties: { radius: 5, ttl: 4, lifetime: 3 } } as never);
    expect(code).toContain('app.setLifetime(it, 0, 4)');
  });
});
