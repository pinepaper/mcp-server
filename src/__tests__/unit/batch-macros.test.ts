/**
 * Batch macros, run against an engine with the real signatures.
 *
 * The first version of ring / grid called app.create(type, {x, y}, props). The
 * engine is create(type, params), so the props were dropped, the animations
 * found no item, and the macro reported success with ids it had made up. Its
 * tests only string-matched the emitted code, so none of that showed. These run
 * the generated batch against a stub studio that takes exactly what the engine
 * takes, and read back what was made.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';
import { expandBatchMacros, BatchMacroError } from '../../tools/batch-macros.js';
import { handleToolCall } from '../../tools/handlers.js';

type Item = { data: Record<string, unknown>; params: Record<string, unknown>; type: string; bringToFront(): void };

function studio() {
  const items = new Map<string, Item>();
  const anims: Array<{ id: string; keyframes: unknown[]; opts: Record<string, unknown> }> = [];
  const relations: Array<{ source: string; target: string; type: string; opts: Record<string, unknown> }> = [];
  const modified: Array<{ id: string; changes: Record<string, unknown> }> = [];
  let n = 0;
  const byName = (name: string) => [...items.values()].filter((i) => i.data.name === name);
  const app = {
    // The engine's arity. A third argument is the bug this file exists for.
    create(type: string, params: Record<string, unknown>, ...extra: unknown[]) {
      if (extra.length) throw new Error(`create takes (type, params); got ${2 + extra.length} arguments`);
      const id = `item_${++n}`;
      const item: Item = { type, params, data: { id, registryId: id, ...(typeof params.name === 'string' ? { name: params.name } : {}) }, bringToFront() {} };
      items.set(id, item);
      return item;
    },
    itemRegistry: { getItem: (id: string) => items.get(id), get: (id: string) => (items.get(id) ? { item: items.get(id) } : undefined) },
    getItemById: (id: string) => items.get(id) ?? byName(id)[0] ?? null,
    getItemsByName: byName,
    addAnimation(id: string, keyframes: unknown[], opts: Record<string, unknown>) { anims.push({ id, keyframes, opts }); return true; },
    addRelation(source: Item, target: Item, type: string, opts: Record<string, unknown>) {
      relations.push({ source: String(source.data.id), target: String(target.data.id), type, opts });
      return `rel_${relations.length}`;
    },
    modifyItem(id: string, changes: Record<string, unknown>) { modified.push({ id, changes }); return true; },
    historyManager: { saveState() {} },
    getCanvasSize: () => ({ width: 800, height: 600 }),
  };
  return { app, items, anims, relations, modified };
}

async function runBatch(input: Record<string, unknown>) {
  const s = studio();
  const code = gen.generateAgentBatchExecute(input as never);
  const result = await new Function('app', 'window', 'paper', `return (\n${code.trim().replace(/;\s*$/, '')}\n);`)(s.app, {}, undefined);
  return { ...s, result: result as { success: boolean; itemIds: string[]; error?: string; failures?: Array<{ step: string; reason: string }> } };
}

describe('ring', () => {
  it('makes each item through create(type, params) with its properties, position and name', async () => {
    const r = await runBatch({ operations: [{ type: 'ring', count: 4, center: { x: 400, y: 300 }, radius: 100, itemType: 'circle', name: 'dot', properties: { radius: 12, fillColor: '#f00' } }] });
    expect(r.result.success).toBe(true);
    expect(r.result.itemIds).toEqual(['item_1', 'item_2', 'item_3', 'item_4']);
    const made = [...r.items.values()];
    expect(made.map((i) => i.data.name)).toEqual(['dot_0', 'dot_1', 'dot_2', 'dot_3']);
    for (const i of made) {
      expect(i.type).toBe('circle');
      expect(i.params.radius).toBe(12);
      expect(i.params.fillColor).toBe('#f00');
    }
    // First item at the top (startAngle -90), then clockwise.
    expect([made[0].params.x, made[0].params.y]).toEqual([400, 200]);
    expect([made[1].params.x, made[1].params.y]).toEqual([500, 300]);
  });

  it('animates each item it made, offset by the stagger, and its items fill $N in order', async () => {
    const r = await runBatch({ operations: [
      { type: 'ring', count: 3, radius: 50, keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 1, properties: { opacity: 1 } }], stagger: 0.2, duration: 1 },
      { type: 'modify', itemId: '$2', properties: { opacity: 0.5 } },
    ] });
    expect(r.result.success).toBe(true);
    expect(r.anims.map((a) => a.id)).toEqual(['item_1', 'item_2', 'item_3']);
    expect(r.anims.map((a) => a.opts.timeOffset)).toEqual([0, 0.2, 0.4]);
    expect(r.anims.every((a) => a.opts.loop === true && a.opts.duration === 1)).toBe(true);
    expect(r.modified.map((m) => m.id)).toEqual(['item_3']);
  });

  it('refuses a count it cannot make, before anything runs', () => {
    expect(() => expandBatchMacros([{ type: 'ring', count: 0 }])).toThrow(BatchMacroError);
    expect(() => expandBatchMacros([{ type: 'ring', count: 500 }])).toThrow(/1 to 200/);
  });
});

describe('grid', () => {
  it('lays out rows × cols from the origin by spacing, named name_row_col', async () => {
    const r = await runBatch({ operations: [{ type: 'grid', rows: 2, cols: 3, origin: { x: 10, y: 20 }, spacing: [30, 40], name: 'cell', properties: { width: 20, height: 20 } }] });
    expect(r.result.success).toBe(true);
    const made = [...r.items.values()];
    expect(made).toHaveLength(6);
    expect(made.map((i) => [i.params.x, i.params.y])).toEqual([[10, 20], [40, 20], [70, 20], [10, 60], [40, 60], [70, 60]]);
    expect(made[5].data.name).toBe('cell_1_2');
    expect(made.every((i) => i.type === 'rectangle' && i.params.width === 20)).toBe(true);
  });
});

describe('orbit', () => {
  it('makes the orbiting item and binds an orbits relation with phaseDegrees, never phase', async () => {
    const r = await runBatch({ operations: [
      { type: 'create', itemType: 'circle', position: { x: 400, y: 300 }, properties: { radius: 40, name: 'sun' } },
      { type: 'orbit', targetId: 'sun', itemType: 'circle', properties: { radius: 8 }, radius: 120, phaseDegrees: 90 },
    ] });
    expect(r.result.success).toBe(true);
    expect(r.relations).toEqual([{ source: 'item_2', target: 'item_1', type: 'orbits', opts: { radius: 120, phaseDegrees: 90 } }]);
  });

  it('a target that does not exist fails the batch, it does not report a null relation as success', async () => {
    const r = await runBatch({ operations: [{ type: 'orbit', targetId: 'nowhere', sourceId: 'also_nowhere' }] });
    expect(r.result.success).toBe(false);
    expect(r.result.failures?.[0].step).toContain('orbit');
  });
});

describe('stagger', () => {
  it('plays the same keyframes on each item, one stagger apart', async () => {
    const r = await runBatch({ operations: [
      { type: 'create', itemType: 'circle', position: { x: 1, y: 1 } },
      { type: 'create', itemType: 'circle', position: { x: 2, y: 2 } },
      { type: 'stagger', itemIds: ['$0', '$1'], keyframes: [{ time: 0, properties: { scale: 0 } }, { time: 0.5, properties: { scale: 1 } }], stagger: 0.25 },
    ] });
    expect(r.result.success).toBe(true);
    expect(r.anims.map((a) => [a.id, a.opts.timeOffset])).toEqual([['item_1', 0], ['item_2', 0.25]]);
  });
});

describe('patch (modify by name)', () => {
  it('changes the one item with that name', async () => {
    const r = await runBatch({ operations: [
      { type: 'create', itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'hi', name: 'title' } },
      { type: 'patch', name: 'title', properties: { content: 'hello' } },
    ] });
    expect(r.result.success).toBe(true);
    expect(r.modified.map((m) => m.id)).toEqual(['title']);
  });

  it('refuses a name two items hold, and names both', async () => {
    const r = await runBatch({ operations: [
      { type: 'create', itemType: 'circle', position: { x: 1, y: 1 }, properties: { name: 'dup' } },
      { type: 'create', itemType: 'circle', position: { x: 2, y: 2 }, properties: { name: 'dup' } },
      { type: 'patch', name: 'dup', properties: { opacity: 0 } },
    ] });
    expect(r.result.success).toBe(false);
    expect(r.result.error).toContain('2 items are named "dup" (item_1, item_2)');
    expect(r.modified).toEqual([]);
  });
});

describe('a failed op addressed by $N', () => {
  it('names the item the batch made, not "$0"', async () => {
    const r = await runBatch({ operations: [
      { type: 'create', itemType: 'circle', position: { x: 1, y: 1 } },
      // The stub studio has no animate(), so this op throws.
      { type: 'animate', itemId: '$0', animationType: 'pulse' },
    ] });
    expect(r.result.success).toBe(false);
    expect(r.result.failures?.[0]).toMatchObject({ step: 'op 1 (animate)' });
    expect((r.result.failures?.[0] as { itemId?: string }).itemId).toBe('item_1');
  });

  it('keeps the ref as written when the batch never made that item', async () => {
    const r = await runBatch({ operations: [{ type: 'modify', itemId: '$3', properties: { opacity: 0 } }] });
    expect(r.result.success).toBe(false);
    expect((r.result.failures?.[0] as { itemId?: string }).itemId).toBe('$3');
  });
});

describe('through the tool', () => {
  const code = { executionMode: 'code' as const, executeInBrowser: false };
  it('a malformed macro is a validation error naming the op', async () => {
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations: [{ type: 'stagger', itemIds: [] }] }, code);
    expect(r.isError).toBe(true);
    expect(JSON.stringify(r.content)).toContain('op 0 (stagger): itemIds lists the items to stagger');
  });

  it('a misspelled itemType on a ring is caught by the same preflight a create gets', async () => {
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations: [{ type: 'ring', itemType: 'circel' }] }, code);
    expect(r.isError).toBe(true);
    expect(JSON.stringify(r.content)).toContain('circle');
  });
});

describe('the per-call scene lint', () => {
  it('asks the studio for warnings only, and carries them out', async () => {
    const s = studio();
    const calls: unknown[] = [];
    Object.assign(s.app, { lintScene: (o: unknown) => { calls.push(o); return { density: null, suggestions: [], warnings: [{ code: 'TEXT_CLIPS_FRAME' }] }; } });
    const code = gen.generateAgentBatchExecute({ operations: [{ type: 'create', itemType: 'circle', position: { x: 1, y: 1 } }] } as never);
    const r = await new Function('app', 'window', 'paper', `return (\n${code.trim().replace(/;\s*$/, '')}\n);`)(s.app, {}, undefined);
    expect(calls).toEqual([{ warningsOnly: true }]);
    expect(r.__ppLint).toEqual([{ code: 'TEXT_CLIPS_FRAME' }]);
  });
});
