/**
 * Owner 2026-11-16: every surface should be able to use Chrome's HTML-in-Canvas (Chrome 157+), and only where the
 * browser has it. browser_status measures it in the page: canvas content="drawable" reflected AND drawElementImage.
 */
import { describe, it, expect } from 'bun:test';
import { HTML_IN_CANVAS_PROBE_JS, handleToolCall } from '../../tools/handlers.js';

function probe(ua: string, drawable: boolean) {
  const document = { createElement: () => {
    const c: any = { setAttribute(k: string, v: string) { if (drawable && k === 'content') c.content = v; }, getContext: () => (drawable ? { drawElementImage() {} } : {}) };
    return c;
  } };
  return new Function('document', 'navigator', `return ${HTML_IN_CANVAS_PROBE_JS}`)(document, { userAgent: ua });
}

describe('HTML-in-Canvas detection', () => {
  it('Chrome 157 with the API: supported', () => {
    expect(probe('Mozilla/5.0 Chrome/157.0.0.0 Safari/537.36', true)).toEqual({ supported: true, chrome: 157, reason: null });
  });
  it('Chrome 156 without it: not supported, with the reason and the version', () => {
    const r = probe('Mozilla/5.0 Chrome/156.0.0.0 Safari/537.36', false);
    expect(r.supported).toBe(false);
    expect(r.chrome).toBe(156);
    expect(r.reason).toContain('it shipped in Chrome 157, and this is Chrome 156');
  });
  it('browser_status carries the verdict, and says so when not connected', async () => {
    const connected = { connected: true, actualUrl: 'x', agentMode: true, executeCode: async () => ({ success: true, result: { supported: false, chrome: 156, reason: 'r' } }) };
    const r1 = await handleToolCall('pinepaper_browser_status', {}, { browserController: connected as never });
    expect(JSON.parse((r1.content![0] as { text: string }).text).htmlInCanvas).toEqual({ supported: false, chrome: 156, reason: 'r' });
    const r2 = await handleToolCall('pinepaper_browser_status', {}, { browserController: { connected: false } as never });
    expect(JSON.parse((r2.content![0] as { text: string }).text).htmlInCanvas.supported).toBeNull();
  });
});
