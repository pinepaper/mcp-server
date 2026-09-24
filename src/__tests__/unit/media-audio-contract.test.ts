/**
 * Audio/video media: which id, and which level key (round 5 S 1.29, round 6 V
 * 6.20 / 6.22). Each snippet is run against a stub studio.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** Run an emitted snippet (IIFE, sync or async) with the given globals. */
async function run(code: string, globals: Record<string, unknown>) {
  const body = code.replace(/\((async )?function\(\)/, (m) => `return ${m}`);
  return new Function(...Object.keys(globals), body)(...Object.values(globals));
}

function studio() {
  const calls: Array<[string, unknown[]]> = [];
  const registry = new Map<string, { type: string; properties: Record<string, unknown> }>([
    ['item_3', { type: 'audio', properties: { gain: 1 } }],
    ['item_4', { type: 'rectangle', properties: {} }],
  ]);
  const A = {
    uploadVideo() {},
    uploadAudio: async () => ({ id: 'araster_1', registryId: 'item_3', duration: 8 }),
    listMedia: () => [{ id: 'araster_1', registryId: 'item_3', kind: 'audio' }],
    setMediaPlaybackRate: (id: string, rate: number) => { calls.push(['rate', [id, rate]]); return id === 'araster_1'; },
    setMediaClip: (id: string) => id === 'araster_1',
    removeMedia: (id: string) => id === 'araster_1',
  };
  const app = {
    itemRegistry: { get: (id: string) => registry.get(id) },
    getItemById: (id: string) => registry.has(id),
    modifyItem: () => true,
    historyManager: { saveState() {} },
    audioLayer: { setVolume: (v: number, id: string) => calls.push(['volume', [v, id]]) },
    addAnimation: (...a: unknown[]) => calls.push(['anim', a]),
  };
  return { A, app, registry, calls, window: { PinePaperAgent: A } };
}

describe('media actions accept the registryId callers hold (1.29)', () => {
  it('set_playback_rate with item_3 reaches the media id', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateMedia({ action: 'set_playback_rate', id: 'item_3', rate: 1.5 } as never), { window: s.window, app: s.app });
    expect(r).toMatchObject({ success: true, id: 'araster_1', registryId: 'item_3' });
    expect(s.calls).toContainEqual(['rate', ['araster_1', 1.5]]);
  });

  it('still takes the media id itself', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateMedia({ action: 'set_clip', id: 'araster_1', inPoint: 0, outPoint: 2 } as never), { window: s.window, app: s.app });
    expect(r.success).toBe(true);
  });

  it('an unknown id is refused by name, not with a bare false', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateMedia({ action: 'remove', id: 'item_99' } as never), { window: s.window, app: s.app });
    expect(r.success).toBe(false);
    expect(r.error).toContain('"item_99"');
  });
});

describe('an audio level reaches the key the exporter reads (6.20)', () => {
  it('upload volume is written to audioGain', async () => {
    const s = studio();
    await run(codeGenerator.generateMedia({ action: 'upload_audio', url: 'https://x/bed.mp3', volume: 0.25 } as never), { window: s.window, app: s.app });
    expect(s.registry.get('item_3')!.properties.audioGain).toBe(0.25);
  });

  it('modify_item {volume} on an audio item sets audioGain, gain and the live player', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateModifyItem({ itemId: 'item_3', properties: { volume: 0.18 } }), { window: s.window, app: s.app });
    expect(r.success).toBe(true);
    expect(s.registry.get('item_3')!.properties).toMatchObject({ audioGain: 0.18, gain: 0.18 });
    expect(s.calls).toContainEqual(['volume', [0.18, 'araster_1']]);
  });

  it('leaves a non-audio item with a volume key alone', async () => {
    const s = studio();
    await run(codeGenerator.generateModifyItem({ itemId: 'item_4', properties: { volume: 0.5 } }), { window: s.window, app: s.app });
    expect(s.registry.get('item_4')!.properties.audioGain).toBeUndefined();
  });
});

describe('gain keyframes on audio items are refused, not ignored (6.22)', () => {
  const kf = [{ time: 0, properties: { audioGain: 0 } }, { time: 1, properties: { audioGain: 1 } }];

  it('refuses on an audio item and adds nothing', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateKeyframeAnimate({ itemId: 'item_3', keyframes: kf } as never), { window: s.window, app: s.app });
    expect(r.success).toBe(false);
    expect(r.error).toContain('audioGain cannot be keyframed on an audio item');
    expect(s.calls.find((c) => c[0] === 'anim')).toBeUndefined();
  });

  it('does not refuse the same keys on a non-audio item', async () => {
    const s = studio();
    const r = await run(codeGenerator.generateKeyframeAnimate({ itemId: 'item_4', keyframes: kf } as never), { window: s.window, app: s.app });
    expect(r.success).toBe(true);
  });
});
