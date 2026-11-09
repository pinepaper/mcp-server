/**
 * The server's share of the tester's 1.6.34 list (2026-11-08), each item run through the code the server
 * generates against a stub studio, so the test pins what the studio is asked to do rather than the words.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator, regionCoverCrop, normalizeEmitterSpec } from '../../types/code-generator.js';
import { MorphSequenceInputSchema, AgentExportInputSchema } from '../../types/schemas.js';
import { handleToolCall } from '../../tools/handlers.js';

const body = (code: string) => code.replace('(async function()', 'return (async function()');
class FR { result = 'data:application/octet-stream;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
const blob = (size: number, type = 'image/gif') => ({ size, type, slice() { return this; } });
const exportCode = (args: Record<string, unknown>) => codeGenerator.generateAgentExport(AgentExportInputSchema.parse(args) as never);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runExport = (args: Record<string, unknown>, app: Record<string, unknown>): Promise<any> =>
  new Function('app', 'FileReader', 'document', 'paper', body(exportCode(args)))(app, FR, {}, {
    Rectangle: class { constructor(public x: number, public y: number, public width: number, public height: number) {} },
    view: { update() {} },
  });

describe('REGION34: a region with another output aspect is cropped, never grown past its edges', () => {
  it('crops about the centre to the output aspect', () => {
    // 960x540 into 480x480: the middle 540x540.
    expect(regionCoverCrop({ x: 0, y: 0, width: 960, height: 540, outputWidth: 480, outputHeight: 480 }))
      .toEqual({ x: 210, y: 0, width: 540, height: 540, cropped: true });
    // 400x400 into 800x200: the middle 400x100.
    expect(regionCoverCrop({ x: 10, y: 20, width: 400, height: 400, outputWidth: 800, outputHeight: 200 }))
      .toEqual({ x: 10, y: 170, width: 400, height: 100, cropped: true });
    // Same aspect, any scale: untouched.
    expect(regionCoverCrop({ x: 0, y: 0, width: 112, height: 112, outputWidth: 28, outputHeight: 28 }).cropped).toBe(false);
    expect(regionCoverCrop({ x: 0, y: 0, width: 1456, height: 180, outputWidth: 728, outputHeight: 90 }).cropped).toBe(false);
  });

  it('the studio is asked for the cropped rectangle, and the reply says so', async () => {
    const asked: number[][] = [];
    const app = {
      canvasSize: { width: 1920, height: 1080 }, canvasEl: { style: {} },
      exportEngine: { exportFidelity: () => ({ warnings: [] }) },
      renderRegionToDataURL: (r: { x: number; y: number; width: number; height: number }, w: number, h: number) => { asked.push([r.x, r.y, r.width, r.height, w, h]); return 'data:image/png;base64,AA'; },
    };
    const r = await runExport({ format: 'png', region: { x: 100, y: 100, width: 960, height: 540, outputWidth: 480, outputHeight: 480 } }, app);
    expect(asked[0]).toEqual([310, 100, 540, 540, 480, 480]);
    expect(r.croppedTo).toEqual({ x: 310, y: 100, width: 540, height: 540 });
    expect(r.region).toEqual({ x: 100, y: 100, width: 960, height: 540 });
    asked.length = 0;
    const same = await runExport({ format: 'png', region: { x: 0, y: 0, width: 960, height: 540, outputWidth: 480, outputHeight: 270 } }, app);
    expect(asked[0]).toEqual([0, 0, 960, 540, 480, 270]);
    expect(same.croppedTo).toBeUndefined();
  });
});

describe('PDFEXP34 (a): a PDF still holds the time it was asked for', () => {
  const pdfApp = (log: string[]) => {
    const app: Record<string, unknown> = {
      canvasSize: { width: 800, height: 600 }, canvasEl: { style: {} },
      isPlayingKeyframes: true, isAnimationPaused: false, playbackTime: 1.3,
      pauseKeyframeTimeline() { log.push('pause'); app.isAnimationPaused = true; },
      resumeKeyframeTimeline() { log.push('resume'); app.isAnimationPaused = false; },
      setPlaybackTime(t: number) { log.push(`seek ${t}`); app.playbackTime = t; },
      _restoreReactionJournal() { log.push('journal'); },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _evaluateStillAt(t: number) { log.push(`evaluate ${t}`); return t; },
        async exportPDF() { log.push(`pdf at ${app.playbackTime} paused=${app.isAnimationPaused}`); return blob(100, 'application/pdf'); },
      },
    };
    return app;
  };

  it('pauses, seeks and evaluates before the page, then puts everything back', async () => {
    const log: string[] = [];
    const r = await runExport({ format: 'pdf', time: 0.5 }, pdfApp(log));
    expect(r.success).toBe(true);
    expect(r.time).toBe(0.5);
    expect(log).toEqual(['pause', 'seek 0.5', 'evaluate 0.5', 'pdf at 0.5 paused=true', 'journal', 'seek 1.3', 'resume']);
  });

  it('a stopped timeline is not resumed', async () => {
    const log: string[] = [];
    const app = pdfApp(log);
    app.isPlayingKeyframes = false;
    await runExport({ format: 'pdf', time: 0.5 }, app);
    expect(log).not.toContain('pause');
    expect(log).not.toContain('resume');
    expect(log).toContain('evaluate 0.5');
  });
});

describe('AACCODEC: a coded refusal keeps its code', () => {
  it('the export store\'s code reaches the result, and the error names it as the cause', async () => {
    const app = {
      canvasSize: { width: 100, height: 100 }, canvasEl: { style: {} },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        exportToStore: async () => ({ ok: false, reason: 'export failed: no AAC encoder', code: 'audio_codec_unavailable' }),
        readExport: async () => null,
      },
    };
    const r = await runExport({ format: 'mp4', duration: 1, audioCodec: 'aac' }, app);
    expect(r).toMatchObject({ success: false, code: 'audio_codec_unavailable' });

    const controller = {
      connected: true, connect: async () => undefined,
      executeCode: async () => ({ success: true, result: { success: false, format: 'mp4', error: 'export failed: no AAC encoder', code: 'audio_codec_unavailable' } }),
      getCanvasState: async () => null,
    };
    const res = await handleToolCall('pinepaper_agent_export', { format: 'mp4', duration: 1, audioCodec: 'aac' }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' });
    expect(res.isError).toBe(true);
    const text = (res.content ?? []).map((c) => ('text' in c ? c.text : '')).join('');
    const err = (JSON.parse(text.slice(text.indexOf('{'))) as { error: { code: string; details: { cause?: string } } }).error;
    expect(err.code).toBe('EXPORT_FAILED');
    expect(err.details.cause).toBe('audio_codec_unavailable');
  });
});

describe('GIFMAX34: a GIF shrunk for maxBytes says its new size, met or not', () => {
  it('a missed budget still reports the dimensions of the file it delivers', async () => {
    const sizes = [80_000, 70_000, 60_000];
    const app = {
      canvasSize: { width: 400, height: 400 }, canvasEl: { style: {} },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _quickExportVideo: async () => ({ blob: blob(sizes.shift()!) }),
        videoExporter: { export: async () => blob(sizes.shift()!) },
      },
    };
    const r = await runExport({ format: 'gif', duration: 1, maxBytes: 20_000 }, app);
    expect(r.budget.met).toBe(false);
    expect(r.budget.attempts.length).toBe(3);
    expect(r.dimensions).toEqual({ width: r.budget.attempts[2].width, height: r.budget.attempts[2].height });
    expect(r.downscaled.to).toEqual(r.dimensions);
    expect(r.warning).toContain('over the 20000-byte budget');
  });
});

describe('GIFMAX34: sizes come from the GIF header, and a bigger retry never wins', () => {
  const gifBlob = (size: number, w: number, h: number) => ({
    size, type: 'image/gif',
    slice() { return { arrayBuffer: async () => new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, w & 255, w >> 8, h & 255, h >> 8]).buffer }; },
  });
  it('the first file is measured, retries shrink from it, and the smallest file is delivered', async () => {
    const asked: Array<[number, number]> = [];
    const app = {
      canvasSize: { width: 1920, height: 1080 }, canvasEl: { style: {} },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _quickExportVideo: async () => ({ blob: gifBlob(74_000, 480, 270) }),
        videoExporter: { export: async (o: { width: number; height: number }) => { asked.push([o.width, o.height]); return gifBlob(170_000, o.width, o.height); } },
      },
    };
    const r = await runExport({ format: 'gif', duration: 1, maxBytes: 20_000 }, app);
    expect(r.budget.attempts[0]).toEqual({ width: 480, height: 270, bytes: 74_000 });
    for (const [w, h] of asked) { expect(w).toBeLessThan(480); expect(h).toBeLessThan(270); }
    expect(r.size).toBe(74_000);
    expect(r.dimensions).toEqual({ width: 480, height: 270 });
    expect(r.downscaled).toMatchObject({ to: { width: 480, height: 270 }, reason: 'studio' });
    expect(r.warning).toContain('the smallest of 3 tries');
  });
});

describe('MORPHBACK32: morph_sequence takes the easings morphs_to renders', () => {
  it('accepts back and elastic easings, refuses a name the studio lacks', () => {
    const states = [{ at: 0, to: 'item_2' }];
    expect(MorphSequenceInputSchema.safeParse({ itemId: 'item_1', states, easing: 'easeOutBack' }).success).toBe(true);
    expect(MorphSequenceInputSchema.safeParse({ itemId: 'item_1', states, easing: 'easeInElastic' }).success).toBe(true);
    expect(MorphSequenceInputSchema.safeParse({ itemId: 'item_1', states, easing: 'wobbly' }).success).toBe(false);
  });
});

describe('EMITFADE34: an emitter fade word the studio does not read is named', () => {
  it("fade 'out' warns; 'none', 'linear' and { in, out } do not", () => {
    expect(normalizeEmitterSpec({ fade: 'out' }).warnings.join(' ')).toContain('spec.fade "out" is not a fade the studio reads');
    for (const fade of ['none', 'linear', { in: 0.1, out: 0.3 }, true]) {
      expect(normalizeEmitterSpec({ fade }).warnings.join(' ')).not.toContain('is not a fade');
    }
    expect(normalizeEmitterSpec({ bursts: [{ at: 0, fade: 'in' }] }).warnings.join(' ')).toContain('bursts[0].fade "in"');
  });
});

describe('PHASEWAVE32 / RINGFORM33: a collection relation over a name pattern is bound once over the set', () => {
  const gen = (op: Record<string, unknown>) => codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', ...op }] } as never);

  it('phase_wave, ring_forming and flock: one relation, the matches as members, no per-item index', () => {
    for (const relationType of ['phase_wave', 'ring_forming', 'flock']) {
      const code = gen({ sourceId: 'disc-*', relationType });
      expect(code).toContain("{ members: { ids: __ids } }");
      expect(code).toContain('app.addRelation(__src, target, ');
      expect(code).not.toContain('{ index: i, count: __members.length');
    }
  });

  it('ring_forming without a target or center is centred on the members as bound; with either it is not', () => {
    expect(gen({ sourceId: 'disc-*', relationType: 'ring_forming' })).toContain('__p.center = { x: __b.center.x, y: __b.center.y }');
    expect(gen({ sourceId: 'disc-*', relationType: 'ring_forming', relationOptions: { center: { x: 1, y: 2 } } })).not.toContain('__p.center =');
    expect(gen({ sourceId: 'disc-*', relationType: 'ring_forming', targetId: 'item_9' })).not.toContain('__p.center =');
  });

  it('members the caller sent are kept; other relations still bind per item', () => {
    expect(gen({ sourceId: 'disc-*', relationType: 'phase_wave', relationOptions: { members: { tag: 't' } } })).not.toContain('{ members: { ids: __ids } }');
    expect(gen({ sourceId: 'disc-*', relationType: 'orbits', targetId: 'item_1' })).toContain('{ index: i, count: __members.length');
  });

  it('a param the rule never reads is named (FLOCKDUR33: flock has no duration)', () => {
    expect(gen({ sourceId: 'bird-*', relationType: 'flock', relationOptions: { duration: 4 } })).toContain('duration');
    const code = gen({ sourceId: 'bird-*', relationType: 'flock', relationOptions: { duration: 4 } });
    expect(code).toMatch(/ignoredOptions[^;]*duration/);
  });
});

describe('the long-form relations have param lists, so unread params warn', () => {
  it('rules registered by reference are listed', async () => {
    const { RELATION_PARAM_KEYS } = await import('../../tools/engine-lists.js');
    for (const r of ['phase_wave', 'ring_forming', 'flock', 'on_complete', 'at_beat', 'camera_tracks', 'soundtrack_cue', 'then', 'after']) {
      expect(Object.keys(RELATION_PARAM_KEYS)).toContain(r);
    }
    expect((RELATION_PARAM_KEYS as Record<string, readonly string[]>).flock).not.toContain('duration');
  });
});

describe('DBLEXP33: a rule bound to an event\'s name is named, with the id to use', () => {
  const code = codeGenerator.generateEvent({ action: 'add_contraption', sourceEvent: 'hide', actions: [{ type: 'setVariable', key: 'k', value: 1 }] } as never);
  const run = (entries: unknown[], stored?: string) => new Function('app', body(code.replace(/^\(function\(\)/m, '(async function()')).replace(/^\s*\(async function\(\)/m, 'return (async function()'))({
    addContraption: () => 'c1', getItemById: () => ({}), itemRegistry: { getAll: () => entries },
    ...(stored ? { listContraptions: () => [{ id: 'c1', sourceEvent: stored }] } : {}),
  });

  it('a studio that resolved the name (FxTool #346) is believed: no warning, and the id it chose', async () => {
    const r = await run([{ id: 'item_3', item: { data: { isEvent: true, eventName: 'hide' } } }], 'item_3');
    expect(r.warning).toBeUndefined();
    expect(r.sourceEventResolvedTo).toBe('item_3');
  });

  it('a name two events share is ambiguous, and says so', async () => {
    const two = [{ id: 'item_3', item: { data: { isEvent: true, eventName: 'hide' } } }, { id: 'item_4', item: { data: { isEvent: true, eventName: 'hide' } } }];
    const r = await run(two, 'hide');
    expect(r.warning).toContain('2 events are named "hide"');
  });

  it('warns when sourceEvent is an event name, and names the id', async () => {
    const r = await run([{ id: 'item_3', item: { data: { isEvent: true, eventName: 'hide' } } }]);
    expect(r.success).toBe(true);
    expect(r.eventIdForName).toBe('item_3');
    expect(r.warning).toContain('Use sourceEvent "item_3"');
  });

  it('says nothing when no event has that name', async () => {
    const r = await run([{ id: 'item_3', item: { data: { isEvent: true, eventName: 'show' } } }]);
    expect(r.warning).toBeUndefined();
  });
});

describe('visible at create is applied, not reported ignored', () => {
  it('create_item and a batch create both hide the item', () => {
    const one = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 1, y: 1 }, properties: { width: 10, height: 10, visible: false } } as never);
    expect(one).toContain('if (item) item.visible = false;');
    expect(one).not.toMatch(/ignoredProperties[^\n]*"visible"/);
    const batch = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'create', itemType: 'circle', position: { x: 1, y: 1 }, properties: { radius: 5, visible: false } }] } as never);
    expect(batch).toContain('item.visible = false;');
  });
});

describe('ONCOMP34: on_complete / at_beat with an event\'s name pulses that event\'s id', () => {
  const ev = (id: string, name: string) => ({ id, item: { data: { isEvent: true, eventName: name } } });
  const studio = (entries: unknown[]) => {
    const bound: Array<Record<string, unknown>> = [];
    const app = {
      _isKnownRelationEndpoint: () => true, getItemById: (id: string) => (id.startsWith('item_') ? {} : null),
      itemRegistry: { getAll: () => entries }, historyManager: { saveState() {} },
      addRelation: (_s: unknown, _t: unknown, _r: unknown, p: Record<string, unknown>) => { bound.push(p); return true; },
    };
    return { app, bound };
  };
  const run = (relationType: string, params: Record<string, unknown>, entries: unknown[]) => {
    const { app, bound } = studio(entries);
    const code = codeGenerator.generateAddRelation({ sourceId: 'item_1', targetId: 'item_2', relationType, params } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r: any = new Function('app', 'return ' + code.replace(/^\/\/.*\n/, '').replace(/;\s*$/, ''))(app);
    return { r, bound };
  };

  it('a name one event holds is bound as that event\'s id, and the reply says so', () => {
    const { r, bound } = run('on_complete', { event: 'done' }, [ev('item_4', 'done')]);
    expect(bound[0].event).toBe('item_4');
    expect(r.eventResolvedTo).toBe('item_4');
    expect(r.eventResolvedFrom).toBe('done');
    expect(r.warning).toBeUndefined();
  });

  it('an id is left alone; so is a name no event holds', () => {
    expect(run('on_complete', { event: 'item_4' }, [ev('item_4', 'done')]).bound[0].event).toBe('item_4');
    expect(run('at_beat', { event: 'go', beat: 1 }, [ev('item_4', 'done')]).bound[0].event).toBe('go');
  });

  it('a name two events share is kept and named', () => {
    const { r, bound } = run('at_beat', { event: 'done', beat: 2 }, [ev('item_4', 'done'), ev('item_5', 'done')]);
    expect(bound[0].event).toBe('done');
    expect(r.warning).toContain('2 events are named "done"');
  });

  it('other relations are not touched', () => {
    const code = codeGenerator.generateAddRelation({ sourceId: 'item_1', targetId: 'item_2', relationType: 'on_event_set_visibility', params: { visible: false } } as never);
    expect(code).not.toContain('eventResolvedTo');
  });
});
