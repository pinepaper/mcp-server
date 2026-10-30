/**
 * A failed execute_custom_code run is rolled back by identity, and says so.
 *
 * Reported from a Halloween look-frame session (2026-09-29): a watercolor fill
 * of ~40 strokes hit the governor's 4 s loop deadline after 42 items existed,
 * and they stayed on the canvas. The report's history entry cannot undo it:
 * raw `new paper.Path(...)` never announces itself (measured live, 30 paths
 * left, report.mutated false). Verified live against pinepaper.studio: 22
 * items (12 via app.create, 10 raw) removed, registry and path counts back to
 * where they were.
 */

import { describe, it, expect } from 'bun:test';
import { customCodeRollback } from '../../tools/handlers.js';
import { DesignMediumInputSchema } from '../../types/schemas.js';

const controller = (result: unknown, success = true) => ({
  calls: [] as string[],
  async executeCode(code: string) { this.calls.push(code); return { success, result }; },
});

describe('execute_custom_code rollback', () => {
  it('reports what it removed and that edits to existing items stay', async () => {
    const c = controller({ ok: true, removed: 42, left: 0 });
    const r = await customCodeRollback(c, 'Synchronous execution exceeded 4000ms — the page would freeze.');
    expect(r.rolledBack).toBe(true);
    expect(r.note).toContain('42 item(s)');
    expect(r.note).toContain('not reverted');
  });

  it('explains the loop guard as this tool\'s, per call, with a way through', async () => {
    const r = await customCodeRollback(controller({ ok: true, removed: 0, left: 0 }), 'Synchronous execution exceeded 4000ms');
    expect(r.note).toContain("execute_custom_code's per-call guard");
    expect(r.note).toContain('fresh budget');
    const plain = await customCodeRollback(controller({ ok: true, removed: 0, left: 0 }), 'x is not defined');
    expect(plain.note).not.toContain('per-call guard');
  });

  it('never claims a rollback it did not do', async () => {
    const partial = await customCodeRollback(controller({ ok: false, removed: 3, left: 2 }), 'boom');
    expect(partial.rolledBack).toBe(false);
    expect(partial.note).toContain('2 remain');
    const unmarked = await customCodeRollback(controller({ ok: false }), 'boom');
    expect(unmarked.rolledBack).toBe(false);
    const threw = await customCodeRollback({ async executeCode() { throw new Error('page gone'); } }, 'boom');
    expect(threw.rolledBack).toBe(false);
  });
});

describe('atomic batch rollback (the lane says a refused call can be sent again)', () => {
  // A fake studio: the mark and the sweep answer as the page does; the batch
  // itself fails at op 1 after op 0 made an item.
  const studio = () => {
    const calls: string[] = [];
    const controller = { connected: true, connect: async () => undefined,
      executeCode: async (code: string) => {
        if (code.includes('__ppPreRunIds = ids')) { calls.push('mark'); return { success: true, result: { ok: true } }; }
        if (code.includes('const pre = window.__ppPreRunIds')) { calls.push('sweep'); return { success: true, result: { ok: true, removed: 1, left: 0 } }; }
        if (code.includes('// Batch execute')) {
          calls.push('batch');
          return { success: true, result: { success: false, error: 'op 1: Item not found: nope', itemIds: ['item_1'], results: [] } };
        }
        return { success: true, result: { success: true } };
      } };
    return { controller, calls };
  };
  const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });
  const ops = [{ type: 'create', itemType: 'circle', position: { x: 10, y: 10 } }, { type: 'modify', itemId: 'nope', properties: { opacity: 0 } }];

  it('a failed atomic batch removes what it created, and says so', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const s = studio();
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations: ops }, opts(s.controller));
    expect(s.calls).toEqual(['mark', 'batch', 'sweep']);
    const text = (r.content ?? []).map((c) => ('text' in c ? c.text : '')).join('\n');
    expect(text).toContain('1 item(s) this call created before it stopped were removed');
  });

  it('atomic: false keeps what the ops before the failure made', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const s = studio();
    await handleToolCall('pinepaper_agent_batch_execute', { operations: ops, atomic: false }, opts(s.controller));
    expect(s.calls).not.toContain('mark');
    expect(s.calls).not.toContain('sweep');
  });
});

describe('apply_thread spine points', () => {
  it('[x, y] pairs reach the engine as {x, y}, the only form its spine reader takes', () => {
    const i = DesignMediumInputSchema.parse({ action: 'apply_thread', itemId: 'a', field: { kind: 'spine', spine: [[400, 200], { x: 400, y: 520 }] } });
    expect(i.field?.spine).toEqual([{ x: 400, y: 200 }, { x: 400, y: 520 }]);
  });
});
