/**
 * PDF print options and region export reach the engine (round 6 T, 1.34).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

const body = (code: string) => code.replace('(async function()', 'return (async function()');

describe('pdf options', () => {
  it('pass through to exportPDF, never downloading in the page', async () => {
    let got: Record<string, unknown> = {};
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    const app = { canvasSize: { width: 800, height: 600 }, exportEngine: {
      exportPDF: async (o: Record<string, unknown>) => { got = o; return { blob, width: 595, height: 842, format: 'a4' }; },
      exportFidelity: () => ({ warnings: [] }) } };
    class FR { result = 'data:application/pdf;base64,JVBERg=='; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'a4', bleed: 3, trimMarks: true, dpi: 300 } } as never);
    const r = await new Function('app', 'FileReader', 'document', body(code))(app, FR, {});
    expect(r.success).toBe(true);
    expect(got).toMatchObject({ dpi: 300, download: false, format: 'a4', includeBleed: true, bleed: 3, trimMarks: true });
  });

  it('are refused on a non-pdf format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'png', pdf: { bleed: 3 } }).success).toBe(false);
  });
});

describe('region export', () => {
  it('renders the region at its own size through renderRegionToDataURL', async () => {
    const calls: unknown[] = [];
    const app = { canvasSize: { width: 1080, height: 1080 },
      renderRegionToDataURL: (r: unknown, w: number, h: number) => { calls.push([r, w, h]); return 'data:image/png;base64,AA=='; },
      exportEngine: { exportFidelity: () => ({ warnings: [] }) } };
    const paper = { Rectangle: class { constructor(public x: number, public y: number, public width: number, public height: number) {} } };
    const code = codeGenerator.generateAgentExport({ format: 'png', region: { x: 1080, y: 0, width: 1080, height: 1350 } } as never);
    const r = await new Function('app', 'paper', 'document', body(code))(app, paper, {});
    expect(r).toMatchObject({ success: true, format: 'png', dimensions: { width: 1080, height: 1350 } });
    expect(calls[0]).toEqual([{ x: 1080, y: 0, width: 1080, height: 1350 }, 1080, 1350]);
  });

  it('is refused on a non-png format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', region: { x: 0, y: 0, width: 10, height: 10 } }).success).toBe(false);
  });
});

describe('jpg / webp stills (1.35)', () => {
  function studio() {
    const ops: unknown[] = [];
    class Img { naturalWidth = 20; naturalHeight = 10; onload: (() => void) | null = null; onerror: (() => void) | null = null;
      set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ width: 0, height: 0,
      getContext: () => ({ set fillStyle(v: string) { ops.push(['fill', v]); }, fillRect: () => ops.push('fillRect'), drawImage: () => ops.push('draw') }),
      toDataURL: (mime: string, q: number) => { ops.push(['encode', mime, q]); return `data:${mime};base64,AAAA`; } }) };
    const app = { canvasSize: { width: 20, height: 10 }, exportEngine: {
      exportPNG: async () => ({ dataUrl: 'data:image/png;base64,iVBO', width: 20, height: 10 }),
      exportFidelity: () => ({ warnings: [] }) } };
    return { ops, globals: { app, document, Image: Img } };
  }
  const run = (input: Record<string, unknown>, g: Record<string, unknown>) =>
    new Function(...Object.keys(g), body(codeGenerator.generateAgentExport(input as never)))(...Object.values(g));

  it('jpg: flattened onto white, encoded at the tier compression', async () => {
    const s = studio();
    const r = await run({ format: 'jpg', quality: 'draft' }, s.globals);
    expect(r).toMatchObject({ success: true, format: 'jpg', mimeType: 'image/jpeg', encodeQuality: 0.6 });
    expect(s.ops).toContainEqual(['fill', '#ffffff']);
    expect(s.ops).toContainEqual(['encode', 'image/jpeg', 0.6]);
  });

  it('webp keeps alpha (no white fill)', async () => {
    const s = studio();
    const r = await run({ format: 'webp' }, s.globals);
    expect(r).toMatchObject({ success: true, mimeType: 'image/webp' });
    expect(s.ops).not.toContainEqual(['fill', '#ffffff']);
  });

  it('region works for jpg too, and the canvas cap is 8192', async () => {
    expect(AgentExportInputSchema.safeParse({ format: 'jpg', region: { x: 0, y: 0, width: 10, height: 10 } }).success).toBe(true);
    const { SetCanvasSizeInputSchema } = await import('../../types/schemas.js') as Record<string, { safeParse(v: unknown): { success: boolean } }>;
    if (SetCanvasSizeInputSchema) expect(SetCanvasSizeInputSchema.safeParse({ width: 5400, height: 1350 }).success).toBe(true);
  });
});

describe('round 6 retest follow-ups', () => {
  it('bleed / trimMarks on a named paper size come back as a warning with the working recipe', () => {
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'a4', bleed: 3, trimMarks: true } } as never);
    expect(code).toContain("applies them only to paperFormat 'custom'");
    expect(code).toContain("canvasPreset 'print-a4'");
    const custom = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'custom', bleed: 3, trimMarks: true } } as never);
    expect(custom).not.toContain("applies them only to paperFormat 'custom'");
  });

  it('jpg flattens onto the scene background when one is set', async () => {
    const fills: string[] = [];
    class Img { naturalWidth = 4; naturalHeight = 4; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ getContext: () => ({ set fillStyle(v: string) { fills.push(v); }, fillRect() {}, drawImage() {} }),
      toDataURL: (m: string) => `data:${m};base64,AA` }) };
    const app = { canvasSize: { width: 4, height: 4 }, canvasEl: { style: { backgroundColor: 'rgb(12, 18, 40)' } },
      exportEngine: { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) } };
    const r = await new Function('app', 'document', 'Image', body(codeGenerator.generateAgentExport({ format: 'jpg' } as never)))(app, document, Img);
    expect(r.success).toBe(true);
    expect(fills).toEqual(['rgb(12, 18, 40)']);
  });

  it('a fully transparent CSS background still flattens onto WHITE (the regex survives the template)', async () => {
    const fills: string[] = [];
    class Img { naturalWidth = 4; naturalHeight = 4; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ getContext: () => ({ set fillStyle(v: string) { fills.push(v); }, fillRect() {}, drawImage() {} }),
      toDataURL: (m: string) => `data:${m};base64,AA` }) };
    const app = { canvasSize: { width: 4, height: 4 }, canvasEl: { style: { backgroundColor: 'rgba(0, 0, 0, 0)' } },
      exportEngine: { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) } };
    await new Function('app', 'document', 'Image', body(codeGenerator.generateAgentExport({ format: 'jpg' } as never)))(app, document, Img);
    expect(fills).toEqual(['#ffffff']);
  });
});

describe('png sequence says when it used the default length (8.15)', () => {
  it('notes a missing duration / fps, and nothing when both are given', () => {
    const a = codeGenerator.generateInterchange({ action: 'export_png_sequence' } as never);
    expect(a).toContain('"defaultsUsed":["duration","fps"]');
    const b = codeGenerator.generateInterchange({ action: 'export_png_sequence', options: { duration: 1, fps: 30 } } as never);
    expect(b).not.toContain('defaultsUsed');
  });
});

describe('multi-page pdf from scenes (8.16)', () => {
  function sceneStudio() {
    const log: unknown[] = [];
    const sizes: Record<string, { width: number; height: number }> = { s1: { width: 1920, height: 1080 }, s2: { width: 1080, height: 1920 } };
    const app: Record<string, any> = {
      canvasSize: sizes.s1,
      getDPI: () => 96,
      captureFrameDataURL: (scale: number) => { log.push(['capture', scale]); return 'data:image/png;base64,AA'; },
      sceneManager: {
        currentSceneId: 's2',
        listScenes: () => [{ id: 's1' }, { id: 's2' }],
        loadScene: async (id: string) => { log.push(['load', id]); app.canvasSize = sizes[id]; app.sceneManager.currentSceneId = id; },
      },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _loadPDFLibraries: async () => ({ jsPDF: class {
          pages = 1;
          constructor(o: Record<string, unknown>) { log.push(['new', o.orientation, o.format]); }
          addPage(f: unknown, o: string) { this.pages++; log.push(['addPage', o, f]); }
          addImage() { log.push('img'); }
          output() { return new Blob(['%PDF'], { type: 'application/pdf' }); }
        } }),
      },
    };
    return { app, log };
  }
  class FR { result = 'data:application/pdf;base64,JVBERg=='; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  class Img { naturalWidth = 4; naturalHeight = 4; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
  const doc = { createElement: () => ({ getContext: () => ({ set fillStyle(_v: string) {}, fillRect() {}, drawImage() {} }), toDataURL: (m: string) => `data:${m};base64,AA` }) };
  const run = (s: ReturnType<typeof sceneStudio>, pages: unknown) =>
    new Function('app', 'FileReader', 'document', 'Image', body(codeGenerator.generateAgentExport({ format: 'pdf', pdf: { pages } } as never)))(s.app, FR, doc, Img);

  it("'scenes' makes one page per scene, puts the user's scene back, and warns that sizes are the current canvas", async () => {
    const s = sceneStudio();
    s.app.sceneManager.loadScene = async (id: string) => { s.log.push(['load', id]); }; // like prod: no resize
    const r = await run(s, 'scenes');
    expect(r).toMatchObject({ success: true, format: 'pdf', pages: 2 });
    expect(r.pageList[0]).toMatchObject({ sceneId: 's1', widthMM: 508, heightMM: 285.8 });
    expect(r.warning).toContain('do not record theirs');
    expect(s.log.filter((l) => Array.isArray(l) && l[0] === 'addPage')).toHaveLength(1);
    expect(s.log.at(-1)).toEqual(['load', 's2']); // restored
  });

  it('{sceneId, width, height} sizes each page, then restores the canvas size', async () => {
    const s = sceneStudio();
    s.app.sceneManager.loadScene = async (id: string) => { s.log.push(['load', id]); };
    s.app.canvasSize = { width: 1080, height: 1080 };
    s.app.setCanvasSize = (sz: { width: number; height: number }) => { s.app.canvasSize = sz; s.log.push(['size', sz.width, sz.height]); };
    const r = await run(s, [{ sceneId: 's1', width: 1920, height: 1080 }, { sceneId: 's2', width: 1080, height: 1080 }]);
    expect(r.pageList.map((p: { widthMM: number }) => p.widthMM)).toEqual([508, 285.8]);
    expect(r.warning).toBeUndefined();
    expect(s.log).toContainEqual(['size', 1080, 1080]); // restored at the end
  });

  it('an unknown scene id is refused with the saved ids listed', async () => {
    const s = sceneStudio();
    const r = await run(s, ['s1', 'nope']);
    expect(r.success).toBe(false);
    expect(r.error).toContain('no saved scene nope');
  });
});

describe('a still at a chosen time (1.57)', () => {
  it('seeks, renders, and puts the playhead back', async () => {
    const seeks: number[] = [];
    const app: Record<string, any> = { playbackTime: 2.5, canvasSize: { width: 10, height: 10 },
      setPlaybackTime: (t: number) => { seeks.push(t); app.playbackTime = t; },
      exportEngine: { exportPNG: async () => { seeks.push(-1); return { dataUrl: 'data:image/png;base64,AA' }; }, exportFidelity: () => ({ warnings: [] }) } };
    const r = await new Function('app', 'document', body(codeGenerator.generateAgentExport({ format: 'png', time: 1 } as never)))(app, {});
    expect(r).toMatchObject({ success: true, time: 1 });
    expect(seeks).toEqual([1, -1, 2.5]); // seek, render, restore
  });

  it('is refused on a video format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', time: 1 }).success).toBe(false);
  });
});

describe('caption export (8.19)', () => {
  const entries = [
    { item: { className: 'PointText', content: 'Second', data: { bornAt: 2.5, ttl: 1.25 } } },
    { item: { className: 'PointText', content: 'First', data: { bornAt: 0, ttl: 2 } } },
    { item: { className: 'PointText', content: 'Title (always on)', data: {} } },
    { item: { className: 'Path', data: { bornAt: 1 } } },
  ];
  const app = { itemRegistry: { getAll: () => entries } };
  const iife = (c: string) => c.replace('(function()', 'return (function()');
  const run = (format: string) => new Function('app', iife(codeGenerator.generateAgentExport({ format, duration: 5 } as never)))(app);

  it('srt: one numbered cue per timed text item, in start order', () => {
    const r = run('srt');
    expect(r).toMatchObject({ success: true, format: 'srt', cues: 2, untimedText: 1 });
    expect(r.data).toBe('1\n00:00:00,000 --> 00:00:02,000\nFirst\n\n2\n00:00:02,500 --> 00:00:03,750\nSecond\n');
  });

  it('vtt: WEBVTT header and dot milliseconds', () => {
    expect(run('vtt').data.startsWith('WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nFirst')).toBe(true);
  });

  it('no timed text is refused with the recipe', () => {
    const r = new Function('app', iife(codeGenerator.generateAgentExport({ format: 'srt' } as never)))({ itemRegistry: { getAll: () => [entries[2]] } });
    expect(r.success).toBe(false);
    expect(r.error).toContain('bornAt / ttl');
  });
});

describe('gif byte budget (8.31)', () => {
  it('re-encodes smaller through videoExporter until it fits, and reports the attempts', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const blobOf = (n: number) => ({ size: n, slice() { return this; } });
    const app = { canvasSize: { width: 800, height: 800 },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _quickExportVideo: async () => ({ blob: blobOf(4_000_000) }),
        videoExporter: { export: async (o: Record<string, unknown>) => { calls.push(o); return blobOf(Math.round((o.width as number) * (o.height as number) * 1.2)); } },
      } };
    class FR { result = 'data:image/gif;base64,R0lG'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
    const code = codeGenerator.generateAgentExport({ format: 'gif', maxBytes: 1_000_000, duration: 3 } as never);
    const r = await new Function('app', 'FileReader', 'document', body(code))(app, FR, {});
    expect(calls[0]).toMatchObject({ format: 'gif' });
    expect(calls[0].width).toBeLessThan(800);
    expect(r.budget.met).toBe(true);
    expect(r.budget.attempts.length).toBeGreaterThan(1);
  });

  it('maxBytes is refused on a non-gif format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', maxBytes: 1000 }).success).toBe(false);
  });
});

describe('NTSC frame rates (1.75)', () => {
  it('29.97, "30000/1001" and 23.976 parse to exact rationals; integers pass', () => {
    const fps = (v: unknown) => (AgentExportInputSchema.parse({ format: 'mp4', fps: v }) as { fps: number }).fps;
    expect(fps(29.97)).toBe(30000 / 1001);
    expect(fps('30000/1001')).toBe(30000 / 1001);
    expect(fps(23.976)).toBe(24000 / 1001);
    expect(fps(59.94)).toBe(60000 / 1001);
    expect(fps(30)).toBe(30);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', fps: 'fast' }).success).toBe(false);
  });
});

describe('NTSC duration overrun is reported (1.76)', () => {
  it('6 s at 29.97 is 180 frames = 6.006 s, and the fitting duration is named', () => {
    const code = codeGenerator.generateAgentExport({ format: 'mp4', fps: 29.97, duration: 6 } as never);
    expect(code).toContain('180 frames');
    expect(code).toContain('use duration 5.9726 (179 frames)');
    expect(codeGenerator.generateAgentExport({ format: 'mp4', fps: 30, duration: 6 } as never)).not.toContain('result.timing');
  });
});

describe('region export names items crossing its edge (1.78)', () => {
  it('flags overflow, ignores inside items and full-bleed backdrops', async () => {
    const entries = [
      { itemId: 'inside', item: { bounds: { x: 10, y: 10, width: 100, height: 50 } } },
      { itemId: 'spills', item: { bounds: { x: 1000, y: 100, width: 200, height: 40 } } },
      { itemId: 'backdrop', item: { bounds: { x: -10, y: -10, width: 5000, height: 5000 } } },
      { itemId: 'far', item: { bounds: { x: 3000, y: 3000, width: 10, height: 10 } } },
    ];
    const app = { canvasSize: { width: 2160, height: 1080 }, itemRegistry: { getAll: () => entries },
      renderRegionToDataURL: () => 'data:image/png;base64,AA', exportEngine: { exportFidelity: () => ({ warnings: [] }) } };
    const paper = { Rectangle: class { constructor(public x: number, public y: number, public width: number, public height: number) {} } };
    const code = codeGenerator.generateAgentExport({ format: 'png', region: { x: 0, y: 0, width: 1080, height: 1080 } } as never);
    const r = await new Function('app', 'paper', 'document', body(code))(app, paper, {});
    expect(r.crossingItems).toEqual(['spills']);
    expect(r.warning).toContain('overflowing its card');
  });
});

describe('gif loop count reaches the encoder (8.30)', () => {
  it('goes straight to videoExporter.export with loop, and is refused on video', async () => {
    const calls: Array<Record<string, unknown>> = [];
    const app = { canvasSize: { width: 100, height: 100 },
      exportEngine: { exportFidelity: () => ({ warnings: [] }), _quickExportVideo: async () => { throw new Error('should not be used'); },
        videoExporter: { export: async (o: Record<string, unknown>) => { calls.push(o); return { size: 10, slice() { return this; } }; } } } };
    class FR { result = 'data:image/gif;base64,R0lG'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'gif', loop: 3 } as never)))(app, FR, {});
    expect(r.success).toBe(true);
    expect(calls[0]).toMatchObject({ format: 'gif', loop: 3 });
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', loop: true }).success).toBe(false);
  });
});

describe('the audio track report is surfaced (6.27)', () => {
  const run = async (report: Record<string, unknown> | undefined) => {
    const vx: Record<string, unknown> = { lastAudioReport: { stale: true },
      export: async () => { if (report) vx.lastAudioReport = report; return { size: 10, slice() { return this; } }; } };
    const app = { canvasSize: { width: 100, height: 100 }, exportEngine: { exportFidelity: () => ({ warnings: [] }), videoExporter: vx } };
    class FR { result = 'data:video/mp4;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
    return new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 2 } as never)))(app, FR, {});
  };

  it('carries the report and turns its warning and an overlong track into fidelity warnings', async () => {
    const r = await run({ codec: 'aac', encoderDelaySamples: 2112, leadHadSound: true, audioDurationS: 2.05, videoDurationS: 2.0, warning: 'the first 44 ms of scene audio had sound' });
    expect(r.audio.codec).toBe('aac');
    // (The stub scene has no background, so alpha_dropped is also present.)
    expect(r.fidelity.warnings.map((w: { code: string }) => w.code).filter((c: string) => c.startsWith('audio_'))).toEqual(['audio_lead_trimmed', 'audio_longer_than_video']);
  });

  it('a stale report from an earlier export is never read as this one', async () => {
    const r = await run(undefined);
    expect(r.audio).toBeUndefined();
  });
});

describe('broadcast-safe mp4 and a bitrate (FxTool 16719759, 8.34-8.36)', () => {
  class FR { result = 'data:video/mp4;base64,AA'; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
  // videoExporter.export as the engine's: it records what it gave the encoder
  // (only for options it received) and what it measured.
  const run = async (args: Record<string, unknown>, opts: { reports?: boolean; achieved?: number } = {}) => {
    const calls: Array<Record<string, unknown>> = [];
    const vx: Record<string, unknown> = { lastVideoReport: { stale: true },
      export: async (o: Record<string, unknown>) => {
        calls.push(o);
        if (opts.reports !== false) {
          const floor = o.broadcast ? 8e6 : Number(o.minBitrate) || 0;
          const bitrate = Math.max(Number(o.bitrate) || 2e6, floor);
          const achieved = opts.achieved ?? bitrate;
          vx.lastVideoReport = { broadcast: o.broadcast === true, bitrate, achievedBitrate: achieved,
            ...(floor && achieved < floor * 0.95 ? { bitrateFloor: floor, warning: `achieved ${(achieved / 1e6).toFixed(2)} Mbps against a ${(floor / 1e6).toFixed(1)} Mbps floor` } : {}) };
        } else delete vx.lastVideoReport;
        return { size: 10, slice() { return this; } };
      } };
    const app = { canvasSize: { width: 1920, height: 1080 }, canvasEl: { style: { backgroundColor: '#000' } }, exportEngine: { exportFidelity: () => ({ warnings: [] }), videoExporter: vx } };
    const r = await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 2, ...args } as never)))(app, FR, {});
    return { r, calls, codes: (r.fidelity?.warnings ?? []).map((w: { code: string }) => w.code) as string[] };
  };

  it('reaches the encoder, and result.video is what it did', async () => {
    const { r, calls, codes } = await run({ broadcast: true, minBitrate: 8_000_000 });
    expect(calls[0]).toMatchObject({ broadcast: true, minBitrate: 8_000_000 });
    expect(r.video).toMatchObject({ broadcast: true, bitrate: 8e6 });
    expect(codes.filter((c) => /bitrate|broadcast|encode/.test(c))).toEqual([]);
  });

  it('a bitrate the encoder capped below the floor is a fidelity warning', async () => {
    const { r, codes } = await run({ broadcast: true }, { achieved: 1_840_000 });
    expect(r.video.achievedBitrate).toBe(1_840_000);
    expect(codes).toContain('bitrate_below_floor');
  });

  it('a studio that reports nothing is not claimed to have applied it', async () => {
    const { r, codes } = await run({ broadcast: true, bitrate: 10_000_000 }, { reports: false });
    expect(r.video).toBeUndefined();
    expect(codes).toContain('encode_options_not_applied');
  });

  it('no options asked, no new warnings — only the report', async () => {
    const { r, codes } = await run({});
    expect(r.video).toMatchObject({ broadcast: false });
    expect(codes.filter((c) => /bitrate|broadcast|encode/.test(c))).toEqual([]);
  });

  it('the store route is given the options too, and a route that drops them is named', async () => {
    const storeArgs: Array<Record<string, unknown>> = [];
    const app = { canvasSize: { width: 1920, height: 1080 }, exportEngine: {
      exportFidelity: () => ({ warnings: [] }), videoExporter: {},
      exportToStore: async (o: Record<string, unknown>) => { storeArgs.push(o); return { ok: false, reason: 'stub' }; }, readExport: async () => null } };
    await new Function('app', 'FileReader', 'document', body(codeGenerator.generateAgentExport({ format: 'mp4', duration: 2, broadcast: true, bitrate: 9_000_000 } as never)))(app, FR, {});
    expect(storeArgs[0]).toMatchObject({ broadcast: true, bitrate: 9_000_000 });
  });

  it('the schema keeps them to video, and survives the handler', async () => {
    expect(AgentExportInputSchema.safeParse({ format: 'webm', broadcast: true }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'gif', bitrate: 1_000_000 }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', bitrate: 4_000_000, minBitrate: 8_000_000 }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'webm', bitrate: 4_000_000, bitrateMode: 'constant' }).success).toBe(true);
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_agent_export', { format: 'mp4', broadcast: true, minBitrate: 8000000 }, { executionMode: 'code' } as never));
    expect(out).toContain('broadcast');
    expect(out).toContain('8000000');
  });
});
