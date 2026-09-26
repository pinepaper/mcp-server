/**
 * Round 12 (DOOH / projection): 12.8 canvas cap, 12.7 substituted container,
 * 12.3 frozen output, 12.12 ProRes / HAP.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { SetCanvasSizeInputSchema } from '../../types/schemas.js';
import { handleToolCall } from '../../tools/handlers.js';

const body = (code: string) => code.replace('(async function()', 'return (async function()');

describe('12.8 the canvas cap is the engine\'s safe size', () => {
  it('12000 wide is accepted, 16385 is not; above 8192 the result warns about Safari', () => {
    expect(SetCanvasSizeInputSchema.safeParse({ width: 12000, height: 1080 }).success).toBe(true);
    expect(SetCanvasSizeInputSchema.safeParse({ width: 16385, height: 1080 }).success).toBe(false);
    const app = { setCanvasSize: () => ({ ok: true, width: 12000, height: 1080 }), historyManager: { saveState() {} } };
    const r = new Function('app', `return ${codeGenerator.generateSetCanvasSize({ width: 12000, height: 1080 } as never).replace(/^\/\/[^\n]*\n/, '')}`)(app);
    expect(r.note).toContain('Safari');
  });
});

describe('video delivery checks', () => {
  class FR { result = 'data:x;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  const run = async (args: Record<string, unknown>, blob: { size: number; type: string }, report: Record<string, unknown> | null = null, animated = true) => {
    const vx: Record<string, unknown> = { lastVideoReport: null, export: async () => { vx.lastVideoReport = report; return { ...blob, slice() { return this; } }; } };
    const app = { canvasSize: { width: 3552, height: 1080 }, canvasEl: { style: { backgroundColor: '#000' } },
      exportEngine: { exportFidelity: () => ({ warnings: [], checked: { animated, audio: false, keyframeItems: 1 } }), videoExporter: vx } };
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 20, fps: 30, ...args } as never)))(app, FR, {});
    return { r, codes: ((r.fidelity?.warnings ?? []) as Array<{ code: string }>).map((w) => w.code) };
  };

  it('12.7 an mp4 request that came back WebM is named by what it is, and said', async () => {
    const { r, codes } = await run({}, { size: 50_000_000, type: 'video/webm;codecs=vp9' });
    expect(r).toMatchObject({ format: 'webm', mimeType: 'video/webm' });
    expect(codes).toContain('format_substituted');
  });

  it('12.3 an animated scene in a near-empty file is flagged as possibly frozen', async () => {
    // 600 frames of 3552x1080 in 400 KB: ~0.0014 bits per pixel per frame.
    expect((await run({}, { size: 400_000, type: 'video/mp4' })).codes).toContain('possibly_frozen');
    // A normal-sized file, or a still scene, is not.
    expect((await run({}, { size: 30_000_000, type: 'video/mp4' })).codes).not.toContain('possibly_frozen');
    expect((await run({}, { size: 400_000, type: 'video/mp4' }, null, false)).codes).not.toContain('possibly_frozen');
  });

  it('12.3 the studio\'s distinct-frame count decides where it reports one', async () => {
    // Tiny file, but the studio fed 600 distinct frames (a minimal scene): not flagged.
    expect((await run({}, { size: 400_000, type: 'video/mp4' }, { frames: { distinct: 600 } })).codes).not.toContain('possibly_frozen');
    // A big file, but one distinct frame: flagged.
    expect((await run({}, { size: 30_000_000, type: 'video/mp4' }, { frames: { distinct: 1 } })).codes).toContain('possibly_frozen');
  });
});

describe('the studio\'s own video report', () => {
  class FR { result = 'data:x;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  const run = async (blobType: string, report: Record<string, unknown>) => {
    const vx: Record<string, unknown> = { lastVideoReport: null, export: async () => { vx.lastVideoReport = report; return { size: 30_000_000, type: blobType, slice() { return this; } }; } };
    const app = { canvasSize: { width: 12000, height: 1080 }, canvasEl: { style: { backgroundColor: '#000' } }, exportEngine: { exportFidelity: () => ({ warnings: [] }), videoExporter: vx } };
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 2 } as never)))(app, FR, {});
    return (r.fidelity?.warnings ?? []) as Array<{ code: string; message: string }>;
  };
  it('codecFallback.reason goes into the substitution warning', async () => {
    const w = await run('video/webm', { codecFallback: { asked: 'avc1', used: 'vp09', reason: 'H.264 level 6.2 caps width at 8192' } });
    expect(w.find((x) => x.code === 'format_substituted')!.message).toContain('H.264 level 6.2 caps width at 8192');
  });
  it('coded engine warnings pass through; plain strings and ones it raises itself do not', async () => {
    const w = await run('video/mp4', { warnings: ['achieved 1.8 Mbps against an 8.0 Mbps floor', { code: 'output_frozen', message: 'the encoder repeated frame 12 for 588 frames' }, { code: 'luma_out_of_range', message: 'dup' }] });
    expect(w.map((x) => x.code)).toContain('output_frozen');
    expect(w.filter((x) => x.code === 'luma_out_of_range')).toHaveLength(0);
    expect(w.some((x) => x.message.includes('Mbps floor'))).toBe(false);
  });
});

describe('12.12 ProRes / HAP', () => {
  it('named, with the png-sequence route, not a generic enum error', async () => {
    for (const format of ['prores', 'HAP', 'prores4444']) {
      const r = await handleToolCall('pinepaper_agent_export', { format }, { executionMode: 'code' });
      const text = (r.content ?? []).map((c) => ('text' in c ? c.text : '')).join('');
      expect(r.isError).toBe(true);
      expect(text).toContain('not supported');
      expect(text).toContain('export_png_sequence');
    }
  });
});
