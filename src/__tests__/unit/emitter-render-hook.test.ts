/** D29: the emitter item and saved render hooks through MCP (FxTool #92). */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { EmitterInputSchema, RenderHookInputSchema } from '../../types/schemas.js';

const run = (code: string, app: Record<string, any>) => new Function('app', `return ${code.replace(/^(\s*\/\/.*\n)+/, '')}`)(app);

describe('pinepaper_emitter', () => {
  const spec = { bursts: [{ t: 2, x: 960, y: 400, count: 80 }], shape: 'confetti' };
  it('create returns the registered id', () => {
    const r = run(codeGenerator.generateEmitter(EmitterInputSchema.parse({ action: 'create', spec })), { setEmitter() {}, create: () => ({ data: { registryId: 'item_5' } }) });
    expect(r).toMatchObject({ success: true, itemId: 'item_5' });
  });
  it('a refused spec (create → null) fails, and an old studio refuses by name', () => {
    expect(run(codeGenerator.generateEmitter(EmitterInputSchema.parse({ action: 'create', spec })), { setEmitter() {}, create: () => null }).success).toBe(false);
    expect(run(codeGenerator.generateEmitter(EmitterInputSchema.parse({ action: 'create', spec })), {}).error).toContain('D29');
  });
  it('set passes on the engine error', () => {
    const r = run(codeGenerator.generateEmitter(EmitterInputSchema.parse({ action: 'set', itemId: 'item_5', spec: { shape: 'blob' } })),
      { setEmitter: () => ({ ok: false, error: 'emitter: unknown shape "blob" (known: circle, rect, dash, star, confetti)' }) });
    expect(r.error).toContain('unknown shape');
  });
});

describe('pinepaper_render_hook', () => {
  it('register returns the engine verdict; register needs source', () => {
    const r = run(codeGenerator.generateRenderHook(RenderHookInputSchema.parse({ action: 'register', id: 'scan', source: '(ctx)=>{}' })),
      { registerRenderHook: (s: any) => ({ ok: true, id: s.id, layer: 'above', deterministic: true, seed: 0 }) });
    expect(r).toMatchObject({ success: true, id: 'scan' });
    expect(() => RenderHookInputSchema.parse({ action: 'register', id: 'x' })).toThrow(/requires source/);
  });
  it('unregister of an unknown id fails', () => {
    const r = run(codeGenerator.generateRenderHook(RenderHookInputSchema.parse({ action: 'unregister', id: 'nope' })), { registerRenderHook() {}, unregisterRenderHook: () => false });
    expect(r.success).toBe(false);
  });
});

describe('full export names what will not travel', () => {
  it('returns doc.unserialized', () => {
    const r = run(codeGenerator.generateCaptureProject(), {
      captureProjectDocument: () => ({ kind: 'pinepaper.project', unserialized: [{ kind: 'renderHook', id: 'glow' }] }),
      itemRegistry: { getAll: () => [] }, relationRegistry: { getStats: () => ({}) },
    });
    expect(r.unserialized).toEqual([{ kind: 'renderHook', id: 'glow' }]);
  });
});
