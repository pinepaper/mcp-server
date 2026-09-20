/**
 * The batch said everything worked while an op had reported it had not.
 *
 * Each operation was wrapped in try/catch, and NOT THROWING was taken as
 * succeeding. But most failures in this engine do not throw — a guard that
 * finds a facade missing, a preset the engine does not have, a precondition
 * unmet, all RETURN `{ success: false, error }`. So the per-op error was
 * perfectly good and the batch reported success over it.
 *
 * A tester hit it with applyAnimatedMask(item, 'star'): the mask preset did not
 * exist, the op said so, and the batch said the scene was built.
 *
 * Same family as executeOrGenerate's inner-failure check and the sync-IIFE
 * async drop — a layer reading whether the call RETURNED rather than what it
 * returned.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** Run an emitted batch against a fake studio, with op N returning a failure. */
async function runBatch(opts: { atomic: boolean; failAt?: number; failShape?: Record<string, unknown> }) {
  // apply_effect ops: they call the engine and now propagate its verdict.
  const code = codeGenerator.generateAgentBatchExecute({
    atomic: opts.atomic,
    operations: [
      { type: 'apply_effect', itemId: 'item_1', effectType: 'sparkle' },
      { type: 'apply_effect', itemId: 'item_2', effectType: 'glow' },
      { type: 'apply_effect', itemId: 'item_3', effectType: 'ripple' },
    ],
  } as never);

  let n = 0;
  const app = {
    getItemById: (id: string) => ({ data: { id } }),
    applyEffect: () => {
      n += 1;
      if (n === opts.failAt) return opts.failShape ?? { success: false, error: 'Unknown animation preset: star' };
      return { success: true };
    },
    getCanvasSize: () => ({ width: 800, height: 600 }),
    historyManager: { saveState() {} },
  };
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  return new Function('app', `return ${body}`)(app) as Promise<Record<string, unknown>>;
}

describe('a batch reports an op that failed without throwing', () => {
  it('all ops fine -> success', async () => {
    const r = await runBatch({ atomic: false });
    expect(r.success).toBe(true);
    expect(r.failedCount).toBe(0);
  });

  it('an op RETURNING failure makes the batch unsuccessful', async () => {
    const r = await runBatch({ atomic: false, failAt: 2 });
    expect(r.success).toBe(false);
    expect(r.failedCount).toBe(1);
  });

  it('and NAMES which op, with its reason', async () => {
    const r = await runBatch({ atomic: false, failAt: 2 });
    // A caller reading a failed 60-op batch should not have to scan 60 entries.
    expect(String(r.error)).toContain('op 1');
    expect(String(r.error)).toContain('Unknown animation preset: star');
  });

  it('the ok:false spelling counts too', async () => {
    const r = await runBatch({ atomic: false, failAt: 2, failShape: { ok: false, reason: 'no such skeleton' } });
    expect(r.success).toBe(false);
    expect(String(r.error)).toContain('no such skeleton');
  });

  it('atomic stops at the failure rather than carrying on', async () => {
    const r = await runBatch({ atomic: true, failAt: 2 });
    expect(r.success).toBe(false);
    // The third op never ran, so only two results were recorded.
    expect((r.results as unknown[]).length).toBe(2);
  });

  it('a bare value is NOT a failure', async () => {
    // Most ops return an id or a count. Reading a missing success field as
    // refusal would fail every one of them — the check stays narrow.
    const r = await runBatch({ atomic: false, failAt: 2, failShape: { applied: true } as never });
    expect(r.success).toBe(true);
    expect(r.failedCount).toBe(0);
  });
});
