/**
 * Generator regions: shapes (FxTool c68524a2) and regions away from the origin.
 *
 * The engine clips a region to a rounded rect, ellipse, circle, polygon, star
 * or an existing path. Its fallbacks are console.warn only (a missing item, a
 * non-path item → plain rectangle), and an older engine drops the shape, so
 * the item is checked here first and the result says whether shapes applied.
 *
 * c68524a2 also found that a region away from (0,0) NEVER worked: content was
 * drawn at the origin, outside its clip, so four regions side by side showed
 * one. That is an engine fix; the pin here is that four offset regions reach
 * executeGenerator with their own boxes, not a shared or zeroed one.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { ExecuteGeneratorInputSchema } from '../../types/schemas.js';

type Item = { className: string };
const studio = (items: Record<string, Item> = {}, shapes = true) => {
  const calls: unknown[][] = [];
  const app = {
    executeGenerator: async (...a: unknown[]) => { calls.push(a); },
    itemRegistry: { get: (id: string) => (items[id] ? { item: items[id] } : undefined) },
    generatorRegistry: shapes ? { _regionClipPath() {} } : {},
  };
  return { app, calls };
};
const run = (app: object, region: unknown, name = 'drawSunburst') =>
  new Function('app', `return ${codeGenerator.generateExecuteGenerator({ generatorName: name, params: {}, region } as never).replace(/^\/\/[^\n]*\n/, '')}`)(app);

describe('generator region shapes', () => {
  it('a shaped region reaches the engine whole', async () => {
    const s = studio();
    const region = { x: 10, y: 20, width: 300, height: 200, shape: 'star', points: 7, innerRatio: 0.4 };
    const r = await run(s.app, region);
    expect(s.calls[0][2]).toEqual({ region });
    expect(r).toMatchObject({ success: true, region });
    expect(r.regionShapeApplied).toBeUndefined();
  });

  it('{itemId} with no box is checked first, then passed on', async () => {
    const s = studio({ blob: { className: 'Path' } });
    const r = await run(s.app, { shape: { itemId: 'blob' } });
    expect(r.success).toBe(true);
    expect(s.calls[0][2]).toEqual({ region: { shape: { itemId: 'blob' } } });
  });

  it('a missing item or a non-path is refused by name, and nothing is drawn', async () => {
    const s = studio({ title: { className: 'PointText' } });
    const missing = await run(s.app, { shape: { itemId: 'nope' } });
    const text = await run(s.app, { shape: { itemId: 'title' } });
    expect(missing).toMatchObject({ success: false, error: expect.stringContaining('"nope"') });
    expect(text).toMatchObject({ success: false, error: expect.stringContaining('PointText') });
    expect(s.calls).toEqual([]);
  });

  it('a studio without region shapes says what it did instead', async () => {
    const star = await run(studio({}, false).app, { x: 0, y: 0, width: 100, height: 100, shape: 'star' });
    expect(star).toMatchObject({ regionShapeApplied: false, warning: expect.stringContaining('star was drawn as a rectangle') });
    const byItem = await run(studio({ p: { className: 'Path' } }, false).app, { shape: { itemId: 'p' } });
    expect(byItem.warning).toContain('whole canvas');
  });

  it('schema: box all-or-nothing, and shape parameters belong to their shape', () => {
    const ok = (region: unknown) => ExecuteGeneratorInputSchema.safeParse({ generatorName: 'drawSunburst', region }).success;
    expect(ok({ x: 0, y: 0, width: 10, height: 10 })).toBe(true);
    expect(ok({ shape: { itemId: 'p' } })).toBe(true);
    expect(ok({ x: 0, y: 0, width: 10 })).toBe(false);
    expect(ok({ shape: 'circle' })).toBe(false);
    expect(ok({ x: 0, y: 0, width: 10, height: 10, shape: 'circle', sides: 5 })).toBe(false);
    expect(ok({ x: 0, y: 0, width: 10, height: 10, shape: 'polygon', sides: 5 })).toBe(true);
  });
});

describe('regions away from the origin (c68524a2)', () => {
  it('four side-by-side regions each reach the engine with their own box', async () => {
    const s = studio();
    const boxes = [0, 1, 2, 3].map((i) => ({ x: 20 + i * 250, y: 40, width: 200, height: 200 }));
    for (const b of boxes) await run(s.app, b);
    expect(s.calls.map((c) => (c[2] as { region: unknown }).region)).toEqual(boxes);
  });

  it('an explicit instance id reaches the engine, from both tools', async () => {
    const s = studio();
    await run(s.app, { x: 0, y: 0, width: 100, height: 100, id: 'waves-left' });
    expect((s.calls[0][2] as { region: { id: string } }).region.id).toBe('waves-left');
    expect(ExecuteGeneratorInputSchema.safeParse({ generatorName: 'drawWaves', region: { id: 'a' } }).success).toBe(false); // an id is not a box
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'execute_generator', generatorName: 'drawWaves', generatorRegion: { x: 0, y: 0, width: 50, height: 50, id: 'w2' } }] } as never);
    expect(code).toContain('"id":"w2"');
  });

  it('the batch op carries the region, shape and checks alike', async () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'execute_generator', generatorName: 'drawSunburst', generatorRegion: { shape: { itemId: 'nope' } } }] } as never);
    expect(code).toContain('names no item');
  });
});
