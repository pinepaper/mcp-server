/**
 * screenSpace (FxTool D20) and stepTiming / hold keys (D11) through MCP. They
 * go through their own engine calls, so an engine without them refuses BEFORE
 * anything is changed instead of ignoring an unknown param in silence.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

async function run(code: string, app: Record<string, any>) {
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return (await new Function('app', 'paper', `return ${body}`)(app, {})) as Record<string, any>;
}
function fakeApp(opts: { facades?: boolean; refuse?: string } = {}) {
  const calls: unknown[][] = [];
  let created = 0;
  const app: Record<string, any> = {
    create: () => { created++; return { data: { registryId: 'item_1' } }; },
    modifyItem: () => true,
    historyManager: { saveState() {} },
    get created() { return created; },
    calls,
  };
  if (opts.facades !== false) {
    app.setScreenSpace = (id: string, on: boolean) => { calls.push(['ss', id, on]); return opts.refuse ? { ok: false, reason: opts.refuse } : { ok: true, id, screenSpace: on }; };
    app.setStepTiming = (id: string, spec: unknown) => { calls.push(['st', id, spec]); return { ok: true, stepTiming: { every: 2, baseFps: 30 } }; };
  }
  return app;
}

describe('create_item / modify_item setters', () => {
  it('create with screenSpace + stepTiming runs both setters on the new item', async () => {
    const app = fakeApp();
    const r = await run(codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 10, y: 10 }, properties: {}, screenSpace: true, stepTiming: { every: 2 } } as never), app);
    expect(r).toMatchObject({ success: true, itemId: 'item_1', screenSpace: true, stepTiming: { every: 2, baseFps: 30 } });
    expect(app.calls).toEqual([['ss', 'item_1', true], ['st', 'item_1', { every: 2 }]]);
  });
  it('properties.hud / properties.stepTiming are lifted out, not sent as create params', async () => {
    const app = fakeApp();
    const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 1, y: 1 }, properties: { hud: true, stepTiming: 3 } } as never);
    expect(code).not.toContain('"hud"');
    expect((await run(code, app)).screenSpace).toBe(true);
  });
  it('a studio without the facade refuses before creating anything', async () => {
    const app = fakeApp({ facades: false });
    const r = await run(codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 1, y: 1 }, properties: {}, screenSpace: true } as never), app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('predates FxTool D20');
    expect(app.created).toBe(0);
  });
  it('an engine refusal comes back with its reason', async () => {
    const r = await run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: {}, screenSpace: true } as never), fakeApp({ refuse: 'only a top-level item can be screen-space (it is inside a group)' }));
    expect(r.success).toBe(false);
    expect(r.error).toContain('inside a group');
  });
  it('modify with only stepTiming calls the setter alone', async () => {
    const app = fakeApp();
    const r = await run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: {}, stepTiming: null } as never), app);
    expect(r.success).toBe(true);
    expect(app.calls).toEqual([['st', 'item_1', null]]);
  });
});

describe('hold keys', () => {
  it('are refused on a studio without them, before anything is written', async () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 1 }, interpolation: 'hold' }, { time: 1, properties: { x: 2 } }] } as never);
    const r = await run(code, { getItemById: () => { throw new Error('should not be reached'); } });
    expect(r.success).toBe(false);
    expect(r.error).toContain('hold keys');
  });
  it('pass interpolation through to the keyframes', () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 1 }, interpolation: 'hold' }, { time: 1, properties: { x: 2 } }] } as never);
    expect(code).toContain('"interpolation": "hold"');
  });
});
