/**
 * The D5 engine facades through MCP (FxTool #79): relight, the SDF brush and
 * the shader graph. The fakes copy #79's return shapes. Each tool refuses by
 * name on a studio without the facade, and never reports a success the
 * engine did not give.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { RelightInputSchema, ShaderGraphInputSchema, DesignMediumInputSchema } from '../../types/schemas.js';

async function run(code: string, app: Record<string, any>) {
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return (await new Function('app', `return ${body}`)(app)) as Record<string, any>;
}
const relight = (a: unknown) => codeGenerator.generateRelight(RelightInputSchema.parse(a));
const graph = (a: unknown) => codeGenerator.generateShaderGraph(ShaderGraphInputSchema.parse(a));
const medium = (a: unknown) => codeGenerator.generateDesignMedium(DesignMediumInputSchema.parse(a));
const LIGHT = { type: 'point', x: 100, y: 100 };
const CHAIN = { nodes: [{ id: 'in', type: 'SourceInput' }, { id: 'out', type: 'OutputCompositor' }], edges: [{ from: 'in', to: 'out' }] };

describe('relight', () => {
  it('set reports the rig, the per-frame cost, and that it is not saved', async () => {
    const app = { setRelight: () => ({ ok: true, active: true, relight: { enabled: true, lights: [LIGHT] } }),
      exportFrameRect: () => ({ width: 1920, height: 1080 }) };
    const r = await run(relight({ action: 'set', lights: [LIGHT] }), app);
    expect(r).toMatchObject({ success: true, active: true, cost: { msPerFrame: 418 } });
    expect(r.note).toContain('NOT saved');
  });
  it('set passes on the engine errors', async () => {
    const r = await run(relight({ action: 'set', lights: [LIGHT] }), { setRelight: () => ({ ok: false, errors: ['lights[0].x must be a number'] }) });
    expect(r).toMatchObject({ success: false, error: 'lights[0].x must be a number' });
  });
  it('set without a world warns it is not active', async () => {
    const r = await run(relight({ action: 'set', lights: [LIGHT] }), { setRelight: () => ({ ok: true, active: false, reason: 'no world' }) });
    expect(r.warning).toContain('pinepaper_world3d');
  });
  it('refuses on a studio without the facade', async () => {
    expect((await run(relight({ action: 'set', lights: [LIGHT] }), {})).success).toBe(false);
  });
  it('schema: at most 8 lights, and set needs one', () => {
    expect(() => RelightInputSchema.parse({ action: 'set', lights: Array(9).fill(LIGHT) })).toThrow();
    expect(() => RelightInputSchema.parse({ action: 'set' })).toThrow(/at least one light/);
  });
});

describe('sdf_stroke', () => {
  it('returns the item id the engine made', async () => {
    const r = await run(medium({ action: 'sdf_stroke', points: [[0, 0, 1], { x: 50, y: 20 }] }),
      { sdfBrushStroke: () => ({ ok: true, id: 'item_9', bounds: { x: 0, y: 0, width: 58, height: 28 }, pixelSize: [116, 56], backend: 'cpu' }) });
    expect(r).toMatchObject({ success: true, itemId: 'item_9' });
  });
  it('fails with the engine errors, and without the facade', async () => {
    expect((await run(medium({ action: 'sdf_stroke', points: [[0, 0]] }), { sdfBrushStroke: () => ({ ok: false, errors: ['over budget'] }) })).error).toBe('over budget');
    expect((await run(medium({ action: 'sdf_stroke', points: [[0, 0]] }), {})).success).toBe(false);
  });
});

describe('shader graph', () => {
  const sg = (over: Record<string, any> = {}) => ({ shaderGraph: { create: () => ({ ok: true, id: 'sg_1', order: ['in', 'out'], nodes: 2 }), ...over } });
  it('create returns the graph id', async () => {
    expect(await run(graph({ action: 'create', graph: CHAIN }), sg())).toMatchObject({ success: true, graphId: 'sg_1' });
  });
  it('validate passes on the named errors', async () => {
    const r = await run(graph({ action: 'validate', graph: CHAIN }), sg({ validate: () => ({ ok: false, errors: ['graph has a cycle through: a, b'] }) }));
    expect(r).toMatchObject({ success: false, errors: ['graph has a cycle through: a, b'] });
  });
  it('apply to an item returns the NEW item and the hidden source', async () => {
    const app = { ...sg(), applyShaderGraph: async () => ({ ok: true, target: 'item', id: 'item_12', sourceId: 'item_4', sourceHidden: true, graphId: 'sg_1', width: 10, height: 10 }) };
    expect(await run(graph({ action: 'apply', target: 'item_4', graphId: 'sg_1' }), app)).toMatchObject({ success: true, itemId: 'item_12', sourceId: 'item_4', sourceHidden: true });
  });
  it('apply to the scene returns the frame', async () => {
    const app = { ...sg(), applyShaderGraph: async () => ({ ok: true, target: 'scene', dataURL: 'data:image/png;base64,AA', width: 4, height: 4 }) };
    expect(await run(graph({ action: 'apply', target: 'scene', graph: CHAIN }), app)).toMatchObject({ success: true, target: 'scene', data: 'data:image/png;base64,AA' });
  });
  it('refuses without the facade, and apply needs a target', async () => {
    expect((await run(graph({ action: 'list' }), {})).success).toBe(false);
    expect(() => ShaderGraphInputSchema.parse({ action: 'apply', graphId: 'sg_1' })).toThrow(/requires target/);
  });
});
