/**
 * AR-1 R2, part 2: the engine's receipts (FxTool js/core/Receipt.js, report.receipts from app.runGenerated) reach the
 * tool result, and agent_export reads the run's report like every other tool.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall, engineReceipts, withEngineReport, RECEIPTS_META_KEY } from '../../tools/handlers.js';

// The runner's real shape (GeneratedCodeRunner.js): calls, byDoor, and only the receipts that say something.
const note = { door: 'create', target: { id: 'item_1' }, transformed: [{ path: 'textAlign', rule: 'out-of-vocab-fallback', from: 'justify', to: 'center' }] };
const report = { warnings: [], items: { created: 1 }, receipts: { calls: 2, byDoor: { create: 2 }, notes: [note] } };
const browser = (result: unknown, rep: unknown = report) => ({
  connected: true, connect: async () => undefined,
  executeCode: async () => ({ success: true, result, report: rep }),
});
const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });

describe('engine receipts on the tool result (AR-1 R2)', () => {
  it('a run whose calls said something carries them as receipts', async () => {
    const r = await handleToolCall('pinepaper_execute_custom_code', { code: "app.create('text', { textAlign: 'justify' })" }, opts(browser({ ok: true })));
    const body = JSON.parse((r.content![0] as { text: string }).text);
    expect(body.receipts).toEqual({ calls: 2, byDoor: { create: 2 }, notes: [note] });
  });

  it('a run whose calls all applied as asked adds nothing', async () => {
    const clean = { ...report, receipts: { calls: 2, byDoor: { create: 2 }, notes: [] } };
    const r = await handleToolCall('pinepaper_execute_custom_code', { code: "app.create('circle', {})" }, opts(browser({ ok: true }, clean)));
    expect(JSON.parse((r.content![0] as { text: string }).text).receipts).toBeUndefined();
    expect(engineReceipts(clean)).toBeNull();
  });

  it('agent_export reads the run report: a small inline export carries the receipts', async () => {
    const r = await handleToolCall('pinepaper_agent_export', { format: 'png' },
      opts(browser({ success: true, format: 'png', data: 'data:image/png;base64,AAAA' })));
    const text = (r.content ?? []).map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    expect(text).toContain('"receipts"');
    expect(text).toContain('out-of-vocab-fallback');
  });

  it('withEngineReport adds a line and _meta, and leaves an error or an empty report alone', () => {
    const ok = { content: [{ type: 'text' as const, text: 'saved' }] };
    const out = withEngineReport(ok, report);
    expect((out.content![1] as { text: string }).text).toStartWith('ENGINE RECEIPTS: ');
    expect(out._meta?.[RECEIPTS_META_KEY]).toEqual({ receipts: report.receipts });
    expect(withEngineReport({ ...ok, isError: true }, report)).toEqual({ ...ok, isError: true });
    expect(withEngineReport(ok, { receipts: { calls: 1, byDoor: {}, notes: [] } })).toBe(ok);
  });
});
