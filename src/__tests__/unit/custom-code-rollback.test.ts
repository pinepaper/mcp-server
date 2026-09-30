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

describe('apply_thread spine points', () => {
  it('[x, y] pairs reach the engine as {x, y}, the only form its spine reader takes', () => {
    const i = DesignMediumInputSchema.parse({ action: 'apply_thread', itemId: 'a', field: { kind: 'spine', spine: [[400, 200], { x: 400, y: 520 }] } });
    expect(i.field?.spine).toEqual([{ x: 400, y: 200 }, { x: 400, y: 520 }]);
  });
});
