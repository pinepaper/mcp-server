/**
 * pinepaper_world3d cube_field / animate_mesh_instances: the instanced box field and its scene-clock driver, which
 * the studio's own tool spec had and this surface did not. Also: set_mesh_instances read the studio's { ok, error }
 * answer with `!!`, so a refusal (an object) was reported as success.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { World3DInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = (input: Record<string, unknown>) => codeGenerator.generateWorld3D(World3DInputSchema.parse(input));
// The generated code opens with a comment line; `return` before it would return nothing.
const run = (code: string, app: unknown) => new Function('app', `return (${code.replace(/^(\s*\/\/[^\n]*\n)+/, '').trim().replace(/;\s*$/, '')});`)(app);

function studio(world = true) {
  const calls: Array<[string, unknown[]]> = [];
  const app: any = {
    _world3d: world ? {} : null,
    createWorld3D: async (...a: unknown[]) => { calls.push(['createWorld3D', a]); app._world3d = {}; },
    addWorldBoxField: async (o: any) => {
      calls.push(['addWorldBoxField', [o]]);
      if (o.cols * o.rows > 10000) return { ok: false, reason: 'over the limit of 10000' };
      return { ok: true, id: o.id || 'mesh_1', count: o.cols * o.rows, cols: o.cols, rows: o.rows, spacing: 1.2, ...(o.motion ? { driver: 'motion' } : {}) };
    },
    setWorldMeshInstanceDriver: (id: string, spec: any) => {
      calls.push(['setWorldMeshInstanceDriver', [id, spec]]);
      if (id === 'nope') return { ok: false, error: 'no mesh "nope"' };
      return spec === null ? { ok: true, cleared: true } : { ok: true, mode: spec.motion ? 'motion' : 'keyframes', count: 4 };
    },
    setWorldMeshInstances: (id: string, inst: unknown[]) => (id === 'nope' ? { ok: false, error: 'no mesh "nope"' } : { ok: true, count: inst.length }),
  };
  return { app, calls };
}

describe('cube_field', () => {
  it('lays the grid, hands the motion over and answers with the mesh id', async () => {
    const { app, calls } = studio();
    const r = await run(gen({ action: 'cube_field', meshId: 'pins', cols: 12, rows: 12, height: 3, color: '#ff0000', motion: { y: '0.6*sin(d*1.5 - t*3)' } }), app);
    expect(r).toMatchObject({ success: true, action: 'cube_field', meshId: 'pins', count: 144, driver: 'motion' });
    expect(r.createdWorld).toBeUndefined();
    const sent = calls[0][1][0] as any;
    expect(sent).toMatchObject({ id: 'pins', cols: 12, rows: 12, height: 3, motion: { y: '0.6*sin(d*1.5 - t*3)' } });
    expect(sent.color).toEqual([1, 0, 0]);
  });

  it('gives the field an opacity of 1 where the studio left it unset, and leaves a set one alone', async () => {
    const a = studio(); const setA: unknown[][] = [];
    a.app.listWorldMeshes = () => [{ id: 'pins', uniforms: { diffuse: [1, 0, 0] } }];
    a.app.setWorldMesh = (...x: unknown[]) => { setA.push(x); return true; };
    await run(gen({ action: 'cube_field', meshId: 'pins', cols: 2, rows: 2 }), a.app);
    expect(setA).toEqual([['pins', { uniforms: { opacity: 1 } }]]);
    const b = studio(); const setB: unknown[][] = [];
    b.app.listWorldMeshes = () => [{ id: 'pins', uniforms: { diffuse: [1, 0, 0], opacity: 0.5 } }];
    b.app.setWorldMesh = (...x: unknown[]) => { setB.push(x); return true; };
    const r = await run(gen({ action: 'cube_field', meshId: 'pins', cols: 2, rows: 2 }), b.app);
    expect(setB).toEqual([]);
    expect(r.success).toBe(true);
  });

  it('makes a world when there is none, and says which', async () => {
    const { app, calls } = studio(false);
    const r = await run(gen({ action: 'cube_field', cols: 2, rows: 2 }), app);
    expect(calls[0]).toEqual(['createWorld3D', ['field']]);
    expect(r).toMatchObject({ success: true, createdWorld: 'field', count: 4 });
  });

  it('a spec it does not read is said: an object, or a name beside a world that already exists', async () => {
    const withWorld = await run(gen({ action: 'cube_field', cols: 2, rows: 2, spec: 'forest' }), studio(true).app);
    expect(withWorld.warning).toContain('a world already exists');
    const object = await run(gen({ action: 'cube_field', cols: 2, rows: 2, spec: { env: {} } }), studio(false).app);
    expect(object.warning).toContain('world NAME');
    expect(object.createdWorld).toBe('field');
    const named = await run(gen({ action: 'cube_field', cols: 2, rows: 2, spec: 'forest' }), studio(false).app);
    expect(named.createdWorld).toBe('forest');
    expect(named.warning).toBeUndefined();
  });

  it('a refusal from the studio is a failure with the studio reason', async () => {
    const r = await run(gen({ action: 'cube_field', cols: 200, rows: 200 }), studio().app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('over the limit');
  });

  it('a studio without box fields is named, not thrown', async () => {
    const r = await run(gen({ action: 'cube_field', cols: 2, rows: 2 }), { _world3d: {} });
    expect(r).toMatchObject({ success: false });
    expect(r.error).toContain('addWorldBoxField');
  });

  it('motion and keyframes together are refused before any code is made', () => {
    const r = World3DInputSchema.safeParse({ action: 'cube_field', cols: 2, rows: 2, motion: { y: 't' }, keyframes: [{ t: 0, instances: [[0, 0, 0, 1, 0, 0]] }] });
    expect(r.success).toBe(false);
  });

  it('a colour that is not a colour is refused here', () => {
    expect(() => gen({ action: 'cube_field', cols: 2, rows: 2, color: 'teal-ish' })).toThrow(/not a colour/);
  });
});

describe('animate_mesh_instances', () => {
  it('drives the copies, and with neither motion nor keyframes stops them', () => {
    const { app, calls } = studio();
    expect(run(gen({ action: 'animate_mesh_instances', meshId: 'pins', motion: { scale: '1 + 0.3*sin(t)' } }), app))
      .toMatchObject({ success: true, mode: 'motion', count: 4, cleared: false });
    expect(run(gen({ action: 'animate_mesh_instances', meshId: 'pins' }), app)).toMatchObject({ success: true, cleared: true });
    expect(calls[1][1]).toEqual(['pins', null]);
  });

  it('needs a mesh id, and a refusal is a failure', () => {
    expect(World3DInputSchema.safeParse({ action: 'animate_mesh_instances', motion: { y: 't' } }).success).toBe(false);
    const r = run(gen({ action: 'animate_mesh_instances', meshId: 'nope', motion: { y: 't' } }), studio().app);
    expect(r).toMatchObject({ success: false, error: 'no mesh "nope"' });
  });
});

describe('set_mesh_instances', () => {
  it('reads the studio answer: a refusal is not success', () => {
    const { app } = studio();
    expect(run(gen({ action: 'set_mesh_instances', meshId: 'nope', instances: [[0, 0, 0, 1, 0, 0]] }), app)).toMatchObject({ success: false, error: 'no mesh "nope"' });
    expect(run(gen({ action: 'set_mesh_instances', meshId: 'pins', instances: [[0, 0, 0, 1, 0, 0]] }), app)).toMatchObject({ success: true, count: 1 });
  });
});

describe('the published tool', () => {
  it('lists both actions and their options', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_world3d')!;
    const props = (tool.inputSchema as any).properties;
    expect(props.action.enum).toEqual(World3DInputSchema.shape.action.options);
    for (const k of ['cols', 'rows', 'spacing', 'size', 'color', 'y', 'motion', 'keyframes', 'loop']) expect(props[k]).toBeDefined();
    expect(tool.description).toContain('cube_field');
    expect(tool.description).toContain('animate_mesh_instances');
  });
});
