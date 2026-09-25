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

describe('audio_beats analyses uploaded media (6.23)', () => {
  function beatStudio() {
    const seen: unknown[] = [];
    const A = { listMedia: () => [{ id: 'araster_1', registryId: 'item_3', kind: 'audio' }] };
    const app = {
      audioLayer: { audios: new Map([['araster_1', { url: 'blob:studio/abc' }]]) },
      analyzeAudio: async (src: unknown) => { seen.push(src); return { ok: true, onsets: [0.5], bpm: 120 }; },
      animateToBeat: async (_id: string, opts: { source?: unknown }) => { seen.push(opts.source); return { ok: true }; },
    };
    return { seen, globals: { window: { PinePaperAgent: A }, app } };
  }

  for (const id of ['item_3', 'araster_1']) {
    it(`analyze with ${id} reads the clip's own bytes`, async () => {
      const s = beatStudio();
      const r = await run(codeGenerator.generateAudioBeats({ action: 'analyze', source: id }), s.globals);
      expect(r).toMatchObject({ success: true, bpm: 120 });
      expect(s.seen).toEqual(['blob:studio/abc']);
    });
  }

  it('a URL or asset id passes through untouched', async () => {
    const s = beatStudio();
    await run(codeGenerator.generateAudioBeats({ action: 'analyze', source: 'https://x/a.mp3' }), s.globals);
    expect(s.seen).toEqual(['https://x/a.mp3']);
  });

  it('animate_to_beat resolves its source the same way', async () => {
    const s = beatStudio();
    await run(codeGenerator.generateAudioBeats({ action: 'animate_to_beat', itemId: 'item_9', source: 'item_3' }), s.globals);
    expect(s.seen).toEqual(['blob:studio/abc']);
  });
});

describe('keyframe easing on the first key is called out (1.37)', () => {
  it('notes it, and says nothing when easing is on a later key', () => {
    const on0 = codeGenerator.generateKeyframeAnimate({ itemId: 'item_4', keyframes: [
      { time: 0, properties: { scale: 1 }, easing: 'easeInOut' }, { time: 5, properties: { scale: 1.2 } },
    ] } as never);
    expect(on0).toContain("easing 'easeInOut' is on the first keyframe");
    const on1 = codeGenerator.generateKeyframeAnimate({ itemId: 'item_4', keyframes: [
      { time: 0, properties: { scale: 1 } }, { time: 5, properties: { scale: 1.2 }, easing: 'easeInOut' },
    ] } as never);
    expect(on1).not.toContain('first keyframe');
  });
});

describe('large data: uploads travel staged, not inline (1.43)', () => {
  it('upload_audio reads a staged key from window.__ppStage', async () => {
    const s = studio();
    let got: unknown;
    (s.A as Record<string, unknown>).uploadAudio = async (src: unknown) => { got = src; return { id: 'araster_1', registryId: 'item_3' }; };
    const bytes = new Uint8Array([82, 73, 70, 70, 0, 255, 128]);
    const big = 'data:audio/wav;base64,' + Buffer.from(bytes).toString('base64');
    const w = { PinePaperAgent: s.A, __ppStage: { media_k: big } };
    const r = await run(codeGenerator.generateMedia({ action: 'upload_audio', url: '__ppStage:media_k' } as never), { window: w, app: s.app });
    expect(r.success).toBe(true);
    // A File, not the data: URL — production's CSP refuses fetch() of data:.
    expect(got).toBeInstanceOf(File);
    const f = got as File;
    expect(f.type).toBe('audio/wav');
    expect(f.name).toBe('audio.wav');
    expect([...new Uint8Array(await f.arrayBuffer())]).toEqual([...bytes]);
  });

  it('a small inline data: URL is decoded too, and an https URL passes through', async () => {
    const s = studio();
    const seen: unknown[] = [];
    (s.A as Record<string, unknown>).uploadAudio = async (src: unknown) => { seen.push(src); return { id: 'a', registryId: 'item_3' }; };
    const g = { window: { PinePaperAgent: s.A }, app: s.app };
    await run(codeGenerator.generateMedia({ action: 'upload_audio', url: 'data:audio/mpeg;base64,AAAA' } as never), g);
    await run(codeGenerator.generateMedia({ action: 'upload_audio', url: 'https://x/bed.mp3' } as never), g);
    expect(seen[0]).toBeInstanceOf(File);
    expect(seen[1]).toBe('https://x/bed.mp3');
  });

  it('the decode uses no for/while loop (the governor budgets those per iteration)', () => {
    const code = codeGenerator.generateMedia({ action: 'upload_audio', url: 'data:audio/wav;base64,AAAA' } as never);
    const decode = code.slice(code.indexOf("indexOf('data:')"), code.indexOf('new File'));
    expect(decode).not.toMatch(/\bfor\s*\(|\bwhile\s*\(/);
  });

  it('the handler stages a >64KB data: URL instead of inlining it', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const big = 'data:audio/wav;base64,' + 'A'.repeat(70_000);
    const res = await handleToolCall('pinepaper_media', { action: 'upload_audio', url: big }, { executionMode: 'code' } as never);
    const text = JSON.stringify(res);
    expect(text).toContain('__ppStage:media_');
    expect(text.length).toBeLessThan(40_000);
  });
});
