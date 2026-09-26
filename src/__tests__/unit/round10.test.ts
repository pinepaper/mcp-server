/**
 * Round 10 (showcase HUD kit + motion-graphics stress test): 10.11, 10.12,
 * 10.13, 10.7.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MediaInputSchema } from '../../types/schemas.js';

const strip = (code: string) => code.replace(/^\/\/[^\n]*\n/, '');

describe('10.11 precomp create returns the registry id', () => {
  it('not Paper\'s numeric id', () => {
    const item = { data: { registryId: 'item_1' } };
    const app = { getItemById: () => item, createPrecomp: () => ({ id: 49, data: { id: 'item_3', isPrecomp: true } }) };
    const r = new Function('app', `return ${strip(codeGenerator.generatePrecomp({ action: 'create', itemIds: ['item_1'] } as never))}`)(app);
    expect(r.precompId).toBe('item_3');
  });
});

describe('10.12 media id works for the app-level media actions', () => {
  it('set_time_remap with the vraster_ id reaches the engine as the registry id', async () => {
    let got = '';
    const app = { setTimeRemap: (id: string) => { got = id; return { ok: true, points: 2 }; }, _resolveId: (x: string) => x, getItemById: () => ({}) };
    const window = { PinePaperAgent: { listMedia: () => [{ id: 'vraster_7', registryId: 'item_12' }] } };
    const code = codeGenerator.generateMedia(MediaInputSchema.parse({ action: 'set_time_remap', id: 'vraster_7', remapTrack: [{ time: 0, value: 0 }, { time: 1, value: 2 }] }));
    await new Function('app', 'window', `return ${strip(code)}`)(app, window);
    expect(got).toBe('item_12');
  });
  it('a registry id passes through unchanged', async () => {
    let got = '';
    const app = { stopLiveMatte: (id: string) => { got = id; return true; } };
    const window = { PinePaperAgent: { listMedia: () => [] } };
    await new Function('app', 'window', `return ${strip(codeGenerator.generateMedia(MediaInputSchema.parse({ action: 'stop_live_matte', id: 'item_4' })))}`)(app, window);
    expect(got).toBe('item_4');
  });
});

describe('10.13 editing keyframed text content warns', () => {
  const run = (keyframes: unknown) => {
    const item = { className: 'PointText', data: { keyframes } };
    const app = { modifyItem: () => true, getItemById: () => item, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } };
    return new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { content: 'NEW' } })}`)(app, {});
  };
  it('names the track and the fix', () => {
    const r = run([{ time: 0, properties: { content: 'A' } }, { time: 1, properties: { content: 'B' } }]);
    expect(r.contentTrackWarning).toContain("text's content is keyframed (2 key(s))");
  });
  it('no content track, no warning', () => {
    expect(run([{ time: 0, properties: { opacity: 0 } }]).contentTrackWarning).toBeUndefined();
  });
});

describe('10.7 a landscape canvas for a portrait platform is a fidelity warning', () => {
  const body = (code: string) => code.replace('(async function()', 'return (async function()');
  class FR { result = 'data:video/mp4;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  const run = async (canvas: { width: number; height: number }, platform: string) => {
    const vx = { export: async () => ({ size: 10, slice() { return this; } }) };
    const app = { canvasSize: canvas, canvasEl: { style: { backgroundColor: '#000' } }, exportEngine: { exportFidelity: () => ({ warnings: [] }), videoExporter: vx } };
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', platform, duration: 1 } as never)))(app, FR, {});
    return (r.fidelity?.warnings ?? []).map((w: { code: string; message: string }) => w);
  };
  it('tiktok on 16:9 warns and names the fix', async () => {
    const w = (await run({ width: 1920, height: 1080 }, 'tiktok')).find((x: { code: string }) => x.code === 'platform_orientation_mismatch');
    expect(w.message).toContain('portrait');
    expect(w.message).toContain('pinepaper_set_canvas_size');
  });
  it('4:5 on square instagram is only a note, not this warning', async () => {
    expect((await run({ width: 1080, height: 1350 }, 'instagram')).map((x: { code: string }) => x.code)).not.toContain('platform_orientation_mismatch');
  });
});
