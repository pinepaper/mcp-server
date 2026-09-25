/**
 * Two release-review items (1.6.14): import_asset with a url crashed after a
 * successful fetch, and a soundtrack render ran under the governor's 10 s
 * default instead of the export budget.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

describe('import_asset from a url', () => {
  it('imports the fetched SVG instead of throwing on missing catalogue metadata', async () => {
    globalThis.fetch = (async () => new Response('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>', { headers: { 'content-type': 'image/svg+xml' } })) as typeof fetch;
    const r = await handleToolCall('pinepaper_import_asset', { url: 'https://example.com/logo.svg' }, { executionMode: 'code' });
    const text = (r.content ?? []).map((c) => ('text' in c ? c.text : '')).join('\n');
    expect(r.isError).toBeFalsy();
    expect(text).not.toContain('Cannot read properties');
    expect(text).toContain('Imported SVG from https://example.com/logo.svg');
  });
});

describe('render_soundtrack gets the export budget', () => {
  it('passes the export governor timeout, not the default', async () => {
    const seen: Array<{ governorTimeoutMs?: number } | undefined> = [];
    const controller = {
      connected: true,
      connect: async () => undefined,
      executeCode: async (_code: string, _s?: boolean, o?: { governorTimeoutMs?: number }) => {
        seen.push(o);
        return { success: true, result: { success: true, wavBase64: 'UklGRiQAAABXQVZF', byteLength: 12, duration: 1 } };
      },
    };
    await handleToolCall('pinepaper_sound', { action: 'render_soundtrack', duration: 1 }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' });
    expect(seen[0]?.governorTimeoutMs).toBeGreaterThanOrEqual(300_000);
  });
});

describe('deterministic exports (B31)', () => {
  it('reaches the encoder on both routes, video formats only', async () => {
    const { codeGenerator } = await import('../../types/code-generator.js');
    const { AgentExportInputSchema } = await import('../../types/schemas.js');
    const code = codeGenerator.generateAgentExport({ format: 'mp4', duration: 1, deterministic: true } as never);
    // In the base video settings (direct route) and the export-store call.
    expect(code.match(/"deterministic":true/g)!.length).toBeGreaterThanOrEqual(2);
    expect(AgentExportInputSchema.safeParse({ format: 'webm', deterministic: true }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'png', deterministic: true }).success).toBe(false);
  });
});

describe('deterministic: pixels pinned only on the software encoder (FxTool e34ae03d)', () => {
  const body = (code: string) => code.replace('(async function()', 'return (async function()');
  class FR { result = 'data:video/mp4;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  const run = async (report: Record<string, unknown> | null) => {
    const { codeGenerator } = await import('../../types/code-generator.js');
    const vx: Record<string, unknown> = { lastVideoReport: null, export: async () => { vx.lastVideoReport = report; return { size: 10, slice() { return this; } }; } };
    const app = { canvasSize: { width: 100, height: 100 }, canvasEl: { style: { backgroundColor: '#fff' } }, exportEngine: { exportFidelity: () => ({ warnings: [] }), videoExporter: vx } };
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 1, deterministic: true } as never)))(app, FR, {});
    return { r, codes: ((r.fidelity?.warnings ?? []) as Array<{ code: string }>).map((w) => w.code) };
  };
  it('software encoder: no warning, and the backend is in result.video', async () => {
    const { r, codes } = await run({ bitrate: 2e6, hardwareAcceleration: 'prefer-software' });
    expect(r.video.hardwareAcceleration).toBe('prefer-software');
    expect(codes).not.toContain('determinism_not_pinned');
  });
  it('hardware, or an engine that does not say: the pixels are not promised', async () => {
    expect((await run({ bitrate: 2e6, hardwareAcceleration: 'prefer-hardware' })).codes).toContain('determinism_not_pinned');
    expect((await run({ bitrate: 2e6 })).codes).toContain('determinism_not_pinned');
  });
});
