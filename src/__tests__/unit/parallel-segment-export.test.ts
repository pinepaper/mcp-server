/**
 * Unit tests for agent_export { parallel: N } host-side parallel segment export
 * and AgentExportInputSchema.parallel validation.
 */
import { describe, it, expect } from 'bun:test';
import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentExportInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import {
  splitExportWindows,
  effectiveWorkerCount,
  formatConcatList,
  resolveEffectiveFps,
  exportParallelSegments,
  singlePassFrameCount,
  aggregateSegmentWarnings,
  describeSegmentFailure,
} from '../../tools/parallel-segment-export.js';

function textOf(r: { content?: Array<{ text?: string }> }): string {
  return (r.content ?? []).map((c) => c.text ?? '').join('\n');
}

describe('AgentExportInputSchema.parallel validation & publishing', () => {
  it('publishes parallel in pinepaper_agent_export schema and validates bounds', () => {
    const tool = (PINEPAPER_TOOLS as Array<{ name: string; inputSchema: { properties: Record<string, unknown> } }>)
      .find((t) => t.name === 'pinepaper_agent_export');
    expect(tool?.inputSchema.properties.parallel).toBeDefined();

    expect(AgentExportInputSchema.safeParse({ format: 'mp4', parallel: 3 }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'webm', parallel: 8 }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', parallel: 1 }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', parallel: 0 }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', parallel: 9 }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'png', parallel: 3 }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'wav', parallel: 2 }).success).toBe(false);
  });
});

describe('splitExportWindows & effectiveWorkerCount', () => {
  it('tiles even and odd frame counts cleanly without gaps or overlap', () => {
    const even = splitExportWindows({ duration: 6, fps: 30, parallel: 3, availableCores: 4 });
    expect(even.length).toBe(3);
    expect(even.map((w) => [w.startFrame, w.endFrame, w.frameCount])).toEqual([
      [0, 60, 60],
      [60, 120, 60],
      [120, 180, 60],
    ]);
    expect(even.map((w) => w.startTime)).toEqual([0, 2, 4]);

    const odd = splitExportWindows({ duration: 5, fps: 29, frames: 100, parallel: 3, startTime: 2, availableCores: 4 });
    expect(odd.reduce((acc, w) => acc + w.frameCount, 0)).toBe(100);
    expect(odd[0].startTime).toBe(2);
    expect(odd[1].startFrame).toBe(odd[0].endFrame);
    expect(odd[2].startFrame).toBe(odd[1].endFrame);
    expect(odd[2].endFrame).toBe(100);
  });

  it('clamps worker count by cores, total frames, and max workers', () => {
    expect(effectiveWorkerCount(6, 180, 4)).toBe(3);
    expect(effectiveWorkerCount(4, 180, 2)).toBe(2);
    expect(effectiveWorkerCount(4, 180, 1)).toBe(1);
    expect(effectiveWorkerCount(4, 2, 8)).toBe(2);
    expect(effectiveWorkerCount(16, 500, 16)).toBe(8);
  });

  it('resolves effective fps from explicit fps or quality tier', () => {
    expect(resolveEffectiveFps({ quality: 'draft' })).toBe(15);
    expect(resolveEffectiveFps({ quality: 'standard' })).toBe(30);
    expect(resolveEffectiveFps({ quality: 'high' })).toBe(60);
    expect(resolveEffectiveFps({ quality: 'high', fps: 24 })).toBe(24);
  });

  it('escapes concat list paths cleanly', () => {
    const out = formatConcatList(["/tmp/a'b/seg_00.mp4", '/tmp/seg_01.mp4']);
    expect(out).toBe("file '/tmp/a'\\''b/seg_00.mp4'\nfile '/tmp/seg_01.mp4'\n");
  });
});

describe('exportParallelSegments orchestration', () => {
  it('runs N isolated workers concurrently, joins segments, enforces bitrate, and cleans temp dir', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-unit-'));
    try {
      let inFlight = 0;
      let maxInFlight = 0;
      let concatCalledWith: { files: string[]; out: string; opts: Record<string, unknown> } | null = null;
      let capCalled = false;

      const res = await exportParallelSegments(
        { format: 'mp4', duration: 6, fps: 30, parallel: 3, boundedEffects: 'decompose', enforceBitrate: true, bitrate: 6_000_000 },
        'mp4',
        {
          exportDir: dir,
          availableCores: 4,
          governorTimeoutMs: 60_000,
          exec: async () => ({
            success: true,
            result: {
              ok: true,
              supportsTimeRange: true,
              programAudio: false,
              world3d: false,
              unserializedCount: 0,
              canvasSize: { width: 1920, height: 1080 },
              project: { kind: 'pinepaper-project', version: '1.0.0' },
            },
          }),
          runWorker: async (fn) => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await new Promise((r) => setTimeout(r, 10));
            try {
              return await fn({
                executeCode: async (code) => {
                  if (code.includes('loadProject')) return { success: true, result: { ok: true } };
                  return {
                    success: true,
                    result: {
                      success: true,
                      format: 'mp4',
                      data: 'data:video/mp4;base64,AAA=',
                      video: { encode: { container: 'mp4', codec: 'avc1.42E01E', width: 1920, height: 1080, fps: 30, durationS: 2, frames: 60, audio: null } },
                    },
                  };
                },
              });
            } finally {
              inFlight--;
            }
          },
          generateSegmentCode: (segArgs) => JSON.stringify(segArgs),
          exportOnce: async () => { throw new Error('fallback exportOnce should not be called'); },
          saveRetained: async () => { throw new Error('not retained'); },
          saveInline: async (_data, _fmt, _plat, filePath) => {
            writeFileSync(filePath, 'segment-bytes');
            return { filePath, fileSize: 13 };
          },
          ffmpeg: {
            available: async () => true,
            streams: async () => ({ ok: true, signature: '[["video","h264"]]' }),
            concat: async (files, _listFile, out, opts) => {
              concatCalledWith = { files, out, opts: opts as Record<string, unknown> };
              writeFileSync(out, 'joined-video-bytes');
              return { ok: true };
            },
          },
          enforceBitrateCap: async () => {
            capCalled = true;
            return { action: 'held', code: 'held_no_reencode', note: 'within cap' };
          },
          receipt: async (filePath) => ({
            sha256: 'deadbeef',
            bytes: 18,
            probe: { container: 'mp4', codec: 'avc1.42E01E', width: 1920, height: 1080, fps: 30, durationS: 6, frames: 180, audio: null },
            probeCheck: { tool: null, reason: 'mocked' },
          }),
        }
      );

      expect(res.isError).not.toBe(true);
      expect(maxInFlight).toBe(3);
      expect(capCalled).toBe(true);
      expect(concatCalledWith).not.toBeNull();
      expect(concatCalledWith!.files.length).toBe(3);

      const structured = res.structuredContent as Record<string, unknown>;
      expect(structured.frames).toBe(180);
      expect((structured.parallel as { workers: number }).workers).toBe(3);
      expect(existsSync(String(structured.filePath))).toBe(true);
      // Temp .parallel-* directory must be removed cleanly
      expect(readdirSync(dir).some((f) => f.startsWith('.parallel-'))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('falls back cleanly to single-page export when ffmpeg is unavailable or snapshot lacks supportsTimeRange', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-fallback-'));
    try {
      let fallbackCalls = 0;
      const noFf = await exportParallelSegments(
        { format: 'mp4', duration: 6, parallel: 3 },
        'mp4',
        {
          exportDir: dir,
          governorTimeoutMs: 60_000,
          exec: async () => ({ success: true }),
          runWorker: async () => { throw new Error('must not spawn worker'); },
          generateSegmentCode: () => '',
          exportOnce: async () => {
            fallbackCalls++;
            return { content: [{ type: 'text', text: 'fallback single' }] };
          },
          saveRetained: async () => { throw new Error('unused'); },
          saveInline: async () => { throw new Error('unused'); },
          ffmpeg: { available: async () => false, addonInstalled: async () => false, streams: async () => ({ ok: false }), concat: async () => ({ ok: false }) },
        }
      );
      expect(fallbackCalls).toBe(1);
      expect(textOf(noFf)).toContain('parallel was not used');

      const noRanges = await exportParallelSegments(
        { format: 'mp4', duration: 6, parallel: 3 },
        'mp4',
        {
          exportDir: dir,
          governorTimeoutMs: 60_000,
          exec: async () => ({ success: true, result: { ok: true, supportsTimeRange: false } }),
          runWorker: async () => { throw new Error('must not spawn worker'); },
          generateSegmentCode: () => '',
          exportOnce: async () => {
            fallbackCalls++;
            return { content: [{ type: 'text', text: 'fallback single' }] };
          },
          saveRetained: async () => { throw new Error('unused'); },
          saveInline: async () => { throw new Error('unused'); },
          ffmpeg: { available: async () => true, streams: async () => ({ ok: true }), concat: async () => ({ ok: true }) },
        }
      );
      expect(fallbackCalls).toBe(2);
      expect(textOf(noRanges)).toContain('supportsTimeRange');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a worker that throws is reported by segment and cause, and the temp dir is removed', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-err-'));
    try {
      const res = await exportParallelSegments(
        { format: 'mp4', duration: 6, parallel: 2 },
        'mp4',
        {
          exportDir: dir,
          availableCores: 4,
          governorTimeoutMs: 60_000,
          exec: async () => ({
            success: true,
            result: { ok: true, supportsTimeRange: true, project: { kind: 'pinepaper-project' } },
          }),
          runWorker: async () => { throw new Error('worker crashed'); },
          generateSegmentCode: () => '',
          exportOnce: async () => ({ content: [] }),
          saveRetained: async () => { throw new Error('unused'); },
          saveInline: async () => { throw new Error('unused'); },
          ffmpeg: { available: async () => true, streams: async () => ({ ok: true }), concat: async () => ({ ok: true }) },
        }
      );
      expect(res.isError).toBe(true);
      expect(textOf(res)).toMatch(/segment 1 of 2 failed: worker crashed/);
      expect(readdirSync(dir).some((f) => f.startsWith('.parallel-'))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  const okProbe = { success: true, result: { ok: true, supportsTimeRange: true, programAudio: false, world3d: false, unserializedCount: 0, canvasSize: { width: 64, height: 64 }, project: { kind: 'pinepaper-project' } } };
  const baseDeps = (dir: string) => ({
    exportDir: dir,
    availableCores: 4,
    governorTimeoutMs: 60_000,
    exec: async () => okProbe,
    generateSegmentCode: (a: Record<string, unknown>) => JSON.stringify(a),
    exportOnce: async () => { throw new Error('fallback exportOnce should not be called'); },
    saveRetained: async () => { throw new Error('not retained'); },
    saveInline: async (_d: string, _f: string, _p: string, filePath: string) => { writeFileSync(filePath, 'seg'); return { filePath, fileSize: 3 }; },
    ffmpeg: {
      available: async () => true,
      streams: async () => ({ ok: true, signature: '[["video","h264"]]' }),
      concat: async (_f: string[], _l: string, out: string) => { writeFileSync(out, 'joined'); return { ok: true }; },
    },
    enforceBitrateCap: async () => ({ action: 'held', code: 'held_no_reencode', note: 'ok' }) as never,
    receipt: async () => ({ sha256: 'x', bytes: 6, probe: {}, probeCheck: { tool: null, reason: 'mocked' } }) as never,
  });

  it('segment frames passed to workers sum to the single-pass count (ceil), not the rounded one', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-frames-'));
    try {
      const seen: number[] = [];
      const res = await exportParallelSegments({ format: 'mp4', duration: 7.91667, fps: 24, parallel: 3 }, 'mp4', {
        ...baseDeps(dir),
        runWorker: async (fn) => fn({
          executeCode: async (code) => code.includes('loadProject')
            ? { success: true, result: { ok: true } }
            : { success: true, result: { success: true, data: 'data:video/mp4;base64,AAA=' } },
        }),
        generateSegmentCode: (a) => { seen.push(a.frames as number); return JSON.stringify(a); },
      });
      expect(res.isError).not.toBe(true);
      expect(seen.reduce((x, y) => x + y, 0)).toBe(191); // ceil(7.91667 * 24); round gave 190
      expect((res.structuredContent as { frames: number }).frames).toBe(191);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('returns warnings from every segment once, tagged with the segments that raised them', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-warn-'));
    try {
      let n = 0;
      const res = await exportParallelSegments({ format: 'mp4', duration: 6, fps: 30, parallel: 3 }, 'mp4', {
        ...baseDeps(dir),
        runWorker: async (fn) => {
          const mine = n++;
          return fn({
            executeCode: async (code) => code.includes('loadProject')
              ? { success: true, result: { ok: true } }
              : { success: true, result: { success: true, data: 'data:video/mp4;base64,AAA=', warnings: ['font fallback', ...(mine === 1 ? ['only here'] : [])], video: { warnings: [{ code: 'bitrate_exceeded', message: 'over' }] } } },
          });
        },
      });
      const w = (res.structuredContent as { warnings: Array<{ message: string; segments: number[] }> }).warnings;
      expect(w.find((x) => x.message === 'font fallback')!.segments).toEqual([0, 1, 2]);
      expect(w.find((x) => x.message === 'only here')!.segments).toEqual([1]);
      expect(w.filter((x) => x.message.startsWith('bitrate_exceeded')).length).toBe(1);
      expect(textOf(res)).toContain('only here');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('when one segment fails the others are aborted, partial files removed, and the failing segment named', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-parallel-abort-'));
    try {
      let exportsStarted = 0;
      let slowFinishedExport = false;
      let n = 0;
      const res = await exportParallelSegments({ format: 'mp4', duration: 6, fps: 30, parallel: 3 }, 'mp4', {
        ...baseDeps(dir),
        runWorker: async (fn) => {
          const mine = n++;
          return fn({
            executeCode: async (code) => {
              if (code.includes('loadProject')) return { success: true, result: { ok: true } };
              exportsStarted++;
              if (mine === 1) return { success: false, error: 'GPU lost' };
              await new Promise((r) => setTimeout(r, 40));
              slowFinishedExport = true;
              return { success: true, result: { success: true, data: 'data:video/mp4;base64,AAA=' } };
            },
          });
        },
        saveInline: async (_d, _f, _p, filePath) => { writeFileSync(filePath, 'partial'); return { filePath, fileSize: 7 }; },
      });
      expect(res.isError).toBe(true);
      expect(textOf(res)).toMatch(/segment 2 of 3 failed: export script failed: GPU lost/);
      expect(exportsStarted).toBe(3);
      expect(slowFinishedExport).toBe(true);
      // nothing left behind: no temp dir, no partial segments, no joined file
      expect(readdirSync(dir)).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('segment plan = single-pass frame range (pure)', () => {
  const durations = [0.1, 0.5, 1, 1.01, 2.5, 3.3333, 5, 6, 7.91667, 10.04, 12.345, 29.97, 59.999, 60, 90.5, 600];
  const fpsList = [24, 25, 30, 60];
  const parallels = [1, 2, 3, 4, 5, 8];
  it('segments partition exactly ceil(duration*fps) frames, contiguously, for every combination', () => {
    let combos = 0;
    for (const duration of durations) for (const fps of fpsList) for (const parallel of parallels) {
      const total = Math.ceil(duration * fps);
      expect(singlePassFrameCount({ duration, fps })).toBe(Math.max(1, total));
      const ws = splitExportWindows({ duration, fps, parallel, availableCores: 16 });
      expect(ws.reduce((a, w) => a + w.frameCount, 0)).toBe(Math.max(1, total));
      expect(ws[0].startFrame).toBe(0);
      expect(ws[ws.length - 1].endFrame).toBe(Math.max(1, total));
      ws.forEach((w, i) => {
        expect(w.frameCount).toBeGreaterThan(0);
        expect(w.endFrame - w.startFrame).toBe(w.frameCount);
        if (i > 0) expect(w.startFrame).toBe(ws[i - 1].endFrame);
      });
      combos++;
    }
    expect(combos).toBe(durations.length * fpsList.length * parallels.length);
  });
  it('an explicit frame count is used as is', () => {
    const ws = splitExportWindows({ duration: 99, fps: 24, frames: 190, parallel: 3, availableCores: 8 });
    expect(ws.reduce((a, w) => a + w.frameCount, 0)).toBe(190);
  });
  it('7.91667 s at 24 fps is 191 frames, not 190', () => {
    expect(singlePassFrameCount({ duration: 7.91667, fps: 24 })).toBe(191);
  });
});

describe('aggregateSegmentWarnings & describeSegmentFailure (pure)', () => {
  it('dedupes by text, keeps strings and coded objects, tags segments', () => {
    const out = aggregateSegmentWarnings([
      { warnings: ['a', 'b'] },
      { warnings: ['a'], video: { warnings: [{ code: 'c', message: 'm' }] } },
      null,
      { warnings: [] },
    ]);
    expect(out).toEqual([
      { message: 'a', segments: [0, 1] },
      { message: 'b', segments: [0] },
      { message: 'c: m', segments: [1] },
    ]);
  });
  it('names the segment 1-based with its cause', () => {
    expect(describeSegmentFailure(1, 3, new Error('boom'))).toBe('segment 2 of 3 failed: boom');
    expect(describeSegmentFailure(0, 2, 'x')).toBe('segment 1 of 2 failed: x');
  });
});
