/**
 * pinepaper_render_batch: one export per data row, each row through the real
 * modify_item / template_params / agent_export handlers.
 */
import { describe, it, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { handleToolCall } from '../../tools/handlers.js';

function fakeStudio() {
  const calls: string[] = [];
  const controller = {
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string) => {
      if (code.includes('app.modifyItem(')) {
        calls.push('modify');
        if (code.includes("'missing'")) return { success: true, result: { success: false, error: 'no item missing — nothing was modified' } };
        return { success: true, result: { success: true, itemId: 'x', ...(code.includes('"colour"') ? { ignoredProperties: ['colour'] } : {}) } };
      }
      if (code.includes('exportPDF') || code.includes('Smart') || code.includes('platform')) {
        calls.push('export');
        return { success: true, result: { success: true, platform: 'auto', format: 'pdf', data: 'data:application/pdf;base64,JVBERi0xLjQK', mimeType: 'application/pdf', size: 9,
          fidelity: { warnings: calls.filter((c) => c === 'export').length === 2 ? [{ code: 'text_overflow', message: 'headline overflows' }] : [] } } };
      }
      calls.push('other');
      return { success: true, result: { success: true } };
    },
  };
  return { controller, calls };
}
const text = (r: { content?: Array<{ type: string; text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');
const json = (r: { content?: Array<{ type: string; text?: string }> }) => JSON.parse(text(r).slice(text(r).indexOf('{')));

describe('render_batch', () => {
  it('each row: modify its items, then export; failures by index, and the batch goes on', async () => {
    const s = fakeStudio();
    const r = await handleToolCall('pinepaper_render_batch', {
      rows: [
        { id: 'en', changes: { headline: { content: 'Summer Sale' } } },
        { id: 'de', changes: { headline: { content: 'Sommerschlussverkauf', colour: 'red' } } },
        { id: 'bad', changes: { missing: { content: 'x' } } },
      ],
      export: { format: 'pdf' },
    }, { executeInBrowser: true, browserController: s.controller as never, executionMode: 'puppeteer' });
    const out = json(r);
    expect(out).toMatchObject({ success: false, rendered: 2, failed: 1 });
    expect(out.rows[0]).toMatchObject({ index: 0, id: 'en', success: true });
    expect(existsSync(out.rows[0].files[0])).toBe(true);
    expect(out.rows[1].warnings).toEqual([{ code: 'text_overflow', message: 'headline overflows' }]);
    expect(out.rows[1].ignored).toEqual({ headline: ['colour'] });
    expect(out.rows[2]).toMatchObject({ index: 2, id: 'bad', success: false, stage: 'modify missing' });
    // The failed row did not export.
    expect(s.calls.filter((c) => c === 'export')).toHaveLength(2);
  });

  it('bad export options are refused before anything renders; estimateOnly renders nothing', async () => {
    const s = fakeStudio();
    const bad = await handleToolCall('pinepaper_render_batch', { rows: [{ changes: { a: { content: 'x' } } }], export: { format: 'bmp' } },
      { executeInBrowser: true, browserController: s.controller as never, executionMode: 'puppeteer' });
    expect(bad.isError).toBe(true);
    expect(text(bad)).toContain('format');
    const est = await handleToolCall('pinepaper_render_batch', { rows: [{ changes: { a: { content: 'x' } } }, { changes: { b: { content: 'y' } } }], export: { format: 'png' }, estimateOnly: true },
      { executeInBrowser: true, browserController: s.controller as never, executionMode: 'puppeteer' });
    expect(json(est)).toMatchObject({ rows: 2, itemsChanged: ['a', 'b'] });
    expect(s.calls).toEqual([]);
  });

  it('code-only mode is refused, and an empty row is invalid', async () => {
    const r = await handleToolCall('pinepaper_render_batch', { rows: [{ changes: { a: { content: 'x' } } }], export: { format: 'png' } }, { executionMode: 'code' });
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('live studio');
    const empty = await handleToolCall('pinepaper_render_batch', { rows: [{ id: 'x' }], export: { format: 'png' } }, { executionMode: 'code' });
    expect(empty.isError).toBe(true);
  });
});
