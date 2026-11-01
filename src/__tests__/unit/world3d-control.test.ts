/**
 * pinepaper_world3d create { control: true }: the engine's keyboard control of the character (FxTool #232), which
 * also binds the `controls` relation. The result reports what the world says, not what was asked.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { World3DInputSchema } from '../../types/schemas.js';

async function run(code: string, app: Record<string, unknown>) {
  return await new Function('app', `return ${code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')}`)(app);
}
function studio(controlEnabled: boolean) {
  const calls: unknown[][] = [];
  const app: Record<string, unknown> = {
    createWorld3D: async (spec: unknown, opts: Record<string, unknown>) => { calls.push([spec, opts]); app._world3d = { controlEnabled: controlEnabled && opts.control === true }; },
    describeWorld3D: async () => ({ params: [] }),
  };
  return { app, calls };
}

describe('world3d create: control', () => {
  it('passes control to the engine and reports it on', async () => {
    const { app, calls } = studio(true);
    const r = await run(codeGenerator.generateWorld3D({ action: 'create', control: true } as never), app);
    expect((calls[0][1] as Record<string, unknown>).control).toBe(true);
    expect(r.control).toBe(true);
    expect(r.warning).toBeUndefined();
  });

  it('says so when the studio did not turn it on', async () => {
    const { app } = studio(false);
    const r = await run(codeGenerator.generateWorld3D({ action: 'create', control: true } as never), app);
    expect(r.control).toBe(false);
    expect(String(r.warning)).toContain('did not turn it on');
  });

  it('is refused with character: false, by name, before anything is made', async () => {
    const { app, calls } = studio(true);
    const r = await run(codeGenerator.generateWorld3D({ action: 'create', control: true, character: false } as never), app);
    expect(r.success).toBe(false);
    expect(String(r.error)).toContain('character: false');
    expect(calls).toEqual([]);
  });

  it('without control, nothing changes', async () => {
    const { app, calls } = studio(true);
    const r = await run(codeGenerator.generateWorld3D({ action: 'create' } as never), app);
    expect(calls[0][1]).toEqual({});
    expect('control' in r).toBe(false);
  });

  it('the schema takes it', () => {
    expect(World3DInputSchema.parse({ action: 'create', control: true }).control).toBe(true);
  });
});
