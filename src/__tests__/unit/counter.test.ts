/** D70: a text item that counts on the scene clock, through app.setCounter. */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { CounterSchema } from '../../types/schemas.js';

async function run(code: string, app: Record<string, any>) {
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return (await new Function('app', 'paper', `return ${body}`)(app, {})) as Record<string, any>;
}
function studio(withCounter = true) {
  const calls: unknown[] = []; let created = 0;
  const app: Record<string, any> = {
    create: () => { created++; return { data: { registryId: 'item_1' } }; },
    modifyItem: () => true, historyManager: { saveState() {} },
    get created() { return created; }, calls,
  };
  if (withCounter) app.setCounter = (id: string, spec: any) => { calls.push([id, spec]); return { ok: true, counter: { ...spec, decimals: 2 }, text: '1.67%' }; };
  return app;
}
const KPI = { from: 1.67, to: 5.58, start: 0.2, duration: 1.2, suffix: '%' };

describe('counter', () => {
  it('create_item text with a counter calls setCounter on the new item', async () => {
    const app = studio();
    const r = await run(codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: '0' }, counter: KPI } as never), app);
    expect(app.calls).toEqual([['item_1', KPI]]);
    expect(r).toMatchObject({ success: true, counter: { decimals: 2 }, counterText: '1.67%' });
  });
  it('properties.counter is lifted out, and a studio without counters refuses before creating', async () => {
    expect(codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: '0', counter: KPI } } as never)).not.toContain('"counter"');
    const app = studio(false);
    const r = await run(codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: {}, counter: KPI } as never), app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('D70');
    expect(app.created).toBe(0);
  });
  it('modify can remove a counter with null', async () => {
    const app = studio();
    await run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: {}, counter: null } as never), app);
    expect(app.calls).toEqual([['item_1', null]]);
  });
  it('the schema takes a year counter and refuses unknown keys', () => {
    expect(CounterSchema.parse({ from: -30000, to: 2026, duration: 90, grouping: false })).toBeTruthy();
    expect(() => CounterSchema.parse({ from: 0, to: 1, color: 'red' })).toThrow();
  });
});
