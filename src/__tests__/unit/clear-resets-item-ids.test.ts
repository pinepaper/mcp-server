/**
 * O1 (mcp-server#29): the item-id counter survived clear_canvas. A batch that made one circle returned item_1; after
 * pinepaper_clear_canvas the same batch returned item_2, so a replay after a clear diverged.
 *
 * Why it happened: the studio's clearCanvas() keeps uploaded clips, so it calls
 * itemRegistry.clear(null, { preserveTypes: ['video', 'audio'] }), and that branch of ItemRegistry.clear never
 * resets nextId (only the no-argument clear does). The stub registry below copies that behaviour from FxTool's
 * js/ItemRegistry.js, so these tests fail against the old emitted code exactly as the live studio did.
 *
 * The rule the fix holds: after a clear, the next id is one past the highest item_N still on the canvas, and 1 when
 * the canvas is empty. It never goes below a live id, so a clip a clear kept cannot be collided with. (Undo of a
 * clear is safe as it was: a history restore runs rebuildFromCanvas, which sets nextId past every restored item.)
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

interface Entry { type: string; item: Record<string, unknown> }

/** FxTool's ItemRegistry, the parts the clear and create paths touch. */
function stubStudio() {
  const registry = {
    nextId: 1,
    items: new Map<string, Entry>(),
    register(type: string, item: Record<string, unknown>, claimedId?: string) {
      const id = claimedId || `item_${this.nextId++}`;
      this.items.set(id, { type, item });
      (item.data as Record<string, unknown>).registryId = id;
      return id;
    },
    getAll() { return [...this.items].map(([itemId, e]) => ({ itemId, item: e.item, type: e.type })); },
    get(id: string) { return this.items.get(id) ?? null; },
    // Copied from FxTool js/ItemRegistry.js clear(): the preserveTypes branch does not reset nextId.
    clear(source: string | null = null, opts: { preserveTypes?: string[] } = {}) {
      const preserve = opts.preserveTypes;
      if (preserve && preserve.length) {
        for (const [id, e] of [...this.items]) if (!preserve.includes(e.type)) this.items.delete(id);
      } else {
        this.items.clear();
        this.nextId = 1;
      }
    },
  };
  const P = (x: number, y: number) => ({ x, y, add: ([dx, dy]: number[]) => P(x + dx, y + dy) });
  const app = {
    itemRegistry: registry,
    historyManager: { saveState() {} },
    create(type: string) {
      const item: Record<string, unknown> = { data: {}, bringToFront() {}, position: P(0, 0) };
      registry.register(type, item);
      return item;
    },
    getItemById: (id: string) => registry.get(id)?.item ?? null,
    // FxTool PinePaper.clearCanvas: keeps uploaded clips.
    clearCanvas() { registry.clear(null, { preserveTypes: ['video', 'audio'] }); },
  };
  const window: Record<string, unknown> = {};
  return { app, registry, window };
}

const BATCH = { operations: [{ type: 'create', itemType: 'circle', position: { x: 200, y: 200 }, properties: { radius: 10 } }] };

async function runBatch(s: ReturnType<typeof stubStudio>) {
  const code = codeGenerator.generateAgentBatchExecute(BATCH as never);
  return new Function('app', 'paper', 'window', 'document', code.replace('(async function()', 'return (async function()'))(s.app, {}, s.window, {});
}

/** clear_canvas's code is statements ending in a result expression; return that expression. */
function runClear(s: ReturnType<typeof stubStudio>) {
  const code = codeGenerator.generateClearCanvas();
  return new Function('app', 'window', code.replace(/\(\{ success: true[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(s.app, s.window);
}

async function runIIFE(code: string, s: ReturnType<typeof stubStudio>) {
  return new Function('app', 'paper', 'window', 'document', code.replace('(async function()', 'return (async function()'))(s.app, {}, s.window, {});
}

describe('clearing the canvas resets the item-id counter (O1)', () => {
  it('a batch replayed after clear_canvas returns the same ids', async () => {
    const s = stubStudio();
    expect((await runBatch(s)).itemIds).toEqual(['item_1']);
    const cleared = runClear(s);
    expect(cleared.success).toBe(true);
    expect((await runBatch(s)).itemIds).toEqual(['item_1']);
  });

  it('never goes below an id a clear kept: a kept clip item_3 makes the next id item_4', async () => {
    const s = stubStudio();
    await runBatch(s); await runBatch(s);
    s.registry.register('audio', { data: {} }); // item_3, a clip clearCanvas keeps
    await runBatch(s); // item_4
    runClear(s);
    expect(s.registry.getAll().map((e) => e.itemId)).toEqual(['item_3']);
    expect((await runBatch(s)).itemIds).toEqual(['item_4']);
  });

  it('forgets the previous batch\'s $N ids, which named items the clear removed', async () => {
    const s = stubStudio();
    await runBatch(s);
    expect(s.window.__pinepaper_batch_item_ids).toEqual(['item_1']);
    runClear(s);
    expect(s.window.__pinepaper_batch_item_ids).toEqual([]);
  });

  it('agent_start_job (which clears by default) and agent_reset reset it too', async () => {
    for (const code of [codeGenerator.generateAgentStartJob({} as never), codeGenerator.generateAgentReset({} as never)]) {
      const s = stubStudio();
      await runBatch(s); await runBatch(s);
      await runIIFE(code, s).catch(() => undefined); // the rest of the job setup may touch what the stub lacks
      expect(s.registry.nextId).toBe(1);
    }
  });
});
