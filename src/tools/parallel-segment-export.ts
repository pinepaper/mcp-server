/**
 * agent_export { parallel: N }: split a heavy or long mp4/webm export into N contiguous
 * whole-frame timeline segments rendered concurrently across isolated browser pages, then
 * join the segments with ffmpeg (`-c copy` video, seam-free audio).
 *
 * Pairs with FxTool PR #455 (`supportsTimeRange`, unpainted preroll, `boundedEffects: 'decompose'`).
 * When a prerequisite is missing (no ffmpeg addon/binary, studio lacks `supportsTimeRange`,
 * scene uses 3D world or unserialized JS callbacks, or `N` clamps to 1), falls back cleanly to a
 * single-page export and explains why.
 */
import { mkdtemp, mkdir, rename, rm, stat, copyFile, unlink } from 'node:fs/promises';
import { cpus } from 'node:os';
import { join } from 'node:path';
import type { CallToolResult } from '../mcp/index.js';
import {
  hasFfmpeg,
  hasFfmpegAddon,
  segmentStreams,
  concatSegments,
  muxAudio,
  muxSilence,
  exportFileReceiptOrReason,
  probeLines,
  receiptErrorLine,
  type ExportFileReceipt,
} from './export-file-receipt.js';
import {
  enforceBitrateCap,
  relabelForReencode,
  bitrateCapFields,
  bitrateCapLine,
  type BitrateCapOutcome,
} from './export-bitrate-cap.js';
import { boundedStructured } from './reply-fields.js';
import { exportFileLink } from '../utils/export-dir.js';

export const MAX_PARALLEL_WORKERS = 8;

const QUALITY_FPS: Record<string, number> = {
  draft: 15,
  standard: 30,
  high: 60,
};

export interface ParallelWindow {
  index: number;
  startFrame: number;
  endFrame: number;
  frameCount: number;
  startTime: number;
  duration: number;
}

export interface ParallelSegmentExecResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ParallelWorkerExecutor {
  executeCode: (
    code: string,
    takeScreenshot?: boolean,
    options?: { bypassGovernor?: boolean; governorTimeoutMs?: number; stage?: Record<string, string> }
  ) => Promise<ParallelSegmentExecResult>;
}

export interface ParallelSnapshotProbe {
  ok: boolean;
  reason?: string;
  supportsTimeRange?: boolean;
  programAudio?: boolean;
  world3d?: boolean;
  unserializedCount?: number;
  canvasSize?: { width: number; height: number } | null;
  project?: unknown;
}

export interface ParallelExportDeps {
  exec: ParallelWorkerExecutor['executeCode'];
  runWorker: <T>(fn: (worker: ParallelWorkerExecutor) => Promise<T>) => Promise<T>;
  generateSegmentCode: (segmentArgs: Record<string, unknown>) => string;
  exportOnce: (args: Record<string, unknown>) => Promise<CallToolResult>;
  saveRetained: (
    worker: ParallelWorkerExecutor,
    retained: { exportId: string; size: number; format: string; chunkBytes?: number },
    platform: string,
    filePath: string
  ) => Promise<{ filePath: string; fileSize: number; chunks: number }>;
  saveInline: (data: string, format: string, platform: string, filePath: string) => Promise<{ filePath: string; fileSize: number }>;
  exportDir: string;
  governorTimeoutMs: number;
  availableCores?: number;
  programAudio?: (seconds: number) => Promise<{ file: string } | { none: true } | { reason: string }>;
  enforceBitrateCap?: (filePath: string, format: string, opts: { enforceBitrate?: boolean; bitrate?: number }) => Promise<BitrateCapOutcome>;
  receipt?: (filePath: string, exportResult: unknown) => Promise<ExportFileReceipt | { receiptError: string }>;
  ffmpeg?: {
    available: () => Promise<boolean>;
    addonInstalled?: () => Promise<boolean>;
    streams: typeof segmentStreams;
    concat: typeof concatSegments;
    mux?: typeof muxAudio;
    silence?: typeof muxSilence;
  };
}

const READ_PARALLEL_SNAPSHOT = `(function () {
  var a = (typeof app !== 'undefined' && app) || window.PinePaper;
  if (!a || !a.exportEngine) return { ok: false, reason: 'studio has no exportEngine' };
  var E = a.exportEngine;
  var world3d = typeof E.sceneHasWorld3D === 'function' ? !!E.sceneHasWorld3D() : !!a._world3d;
  var unserialized = (a._onFrameCallbacks && a._onFrameCallbacks.size) ? a._onFrameCallbacks.size : 0;
  var project = typeof a.exportProject === 'function' ? a.exportProject({ name: 'parallel-segment' }) : null;
  var cs = typeof a.getCanvasSize === 'function' ? a.getCanvasSize() : (a.canvasSize || null);
  return {
    ok: true,
    supportsTimeRange: E.supportsTimeRange === true,
    programAudio: E.supportsProgramAudio === true,
    world3d: world3d,
    unserializedCount: unserialized,
    canvasSize: cs && cs.width > 0 && cs.height > 0 ? { width: cs.width, height: cs.height } : null,
    project: project,
  };
})();`;

const LOAD_PARALLEL_SNAPSHOT = `(function () {
  var a = (typeof app !== 'undefined' && app) || window.PinePaper;
  if (!a || typeof a.loadProject !== 'function') return { ok: false, error: 'worker studio lacks app.loadProject' };
  var raw = window.__ppStage && window.__ppStage.ppParallelDoc;
  if (!raw) return { ok: false, error: 'missing staged project snapshot' };
  var parsed = JSON.parse(raw);
  if (parsed.canvasSize && parsed.canvasSize.width > 0 && typeof a.setCanvasSize === 'function') {
    a.setCanvasSize(parsed.canvasSize.width, parsed.canvasSize.height);
  }
  var res = a.loadProject(parsed.project, { strict: false });
  if (!res || res.ok === false) {
    return { ok: false, error: (res && res.errors && res.errors.join('; ')) || 'loadProject failed' };
  }
  return { ok: true, warnings: res.warnings || [] };
})();`;

/** Effective frames per second derived from explicit `fps` or `quality` tier. */
export function resolveEffectiveFps(args: { fps?: unknown; quality?: unknown }): number {
  const fps = Number(args.fps);
  if (Number.isFinite(fps) && fps >= 1) return fps;
  return QUALITY_FPS[String(args.quality || 'standard')] ?? 30;
}

/**
 * Clamp requested parallel worker count to the useful capacity of this host and frame budget.
 * On 4 vCPU, 3 workers measured faster than 4 (FxTool/claude-docs/export-parallel-segments.md);
 * on 1–2 cores we allow up to the core count so dual-core machines can still split into 2.
 */
export function effectiveWorkerCount(requested: number, totalFrames: number, availableCores = cpus().length): number {
  const req = Number.isFinite(requested) ? Math.floor(requested) : 1;
  const cores = Math.max(1, Number.isFinite(availableCores) ? Math.floor(availableCores) : 1);
  const coreLimit = cores <= 2 ? cores : cores - 1;
  return Math.max(1, Math.min(req, coreLimit, Math.max(1, totalFrames), MAX_PARALLEL_WORKERS));
}

/**
 * Split `[startTime, startTime + totalDuration)` into contiguous whole-frame windows
 * with zero gaps and zero overlapping frames (`sum(frameCount) === totalFrames`).
 */
export function splitExportWindows(opts: {
  duration: number;
  fps: number;
  parallel: number;
  frames?: number;
  startTime?: number;
  availableCores?: number;
}): ParallelWindow[] {
  const fps = Math.max(1, opts.fps);
  const baseStart = typeof opts.startTime === 'number' && opts.startTime > 0 ? opts.startTime : 0;
  const totalFrames = typeof opts.frames === 'number' && opts.frames >= 1
    ? Math.max(1, Math.round(opts.frames))
    : Math.max(1, Math.round(Math.max(0.1, opts.duration) * fps));
  const workers = effectiveWorkerCount(opts.parallel, totalFrames, opts.availableCores);
  const windows: ParallelWindow[] = [];
  for (let i = 0; i < workers; i++) {
    const startFrame = Math.floor((i * totalFrames) / workers);
    const endFrame = Math.floor(((i + 1) * totalFrames) / workers);
    const frameCount = endFrame - startFrame;
    if (frameCount <= 0) continue;
    windows.push({
      index: windows.length,
      startFrame,
      endFrame,
      frameCount,
      startTime: baseStart + startFrame / fps,
      duration: frameCount / fps,
    });
  }
  return windows;
}

/** Format an `ffmpeg` concat demuxer file list with absolute-safe single-quote escaping. */
export function formatConcatList(files: string[]): string {
  return files.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n') + '\n';
}

export async function exportParallelSegments(
  args: Record<string, unknown>,
  format: string,
  deps: ParallelExportDeps
): Promise<CallToolResult> {
  const ff = deps.ffmpeg ?? {
    available: hasFfmpeg,
    addonInstalled: hasFfmpegAddon,
    streams: segmentStreams,
    concat: concatSegments,
    mux: muxAudio,
    silence: muxSilence,
  };
  const { parallel: rawParallel, ...baseArgs } = args;
  const requestedWorkers = Number(rawParallel ?? 1);

  const whole = async (why: string): Promise<CallToolResult> => {
    const r = await deps.exportOnce(baseArgs);
    const note = `parallel was not used: ${why}.`;
    return { ...r, content: [{ type: 'text' as const, text: note }, ...(r.content ?? [])] };
  };

  if (format !== 'mp4' && format !== 'webm') {
    return whole(`parallel exports split mp4 or webm video timelines, and "${format}" is not mp4 or webm`);
  }
  if (args.estimateOnly === true) {
    return whole('estimateOnly renders no frames');
  }
  if (args.motionBlur !== undefined) {
    return whole('motionBlur spans across pre-roll subframes and renders best on a single page');
  }
  if (!(await ff.available())) {
    const hasAddon = ff.addonInstalled ? await ff.addonInstalled() : await hasFfmpegAddon();
    return whole(
      hasAddon
        ? 'ffmpeg is not on PATH, and parallel segments are joined with it'
        : 'joining parallel segments requires ffmpeg (the npm package starts no external programs; use the Claude Desktop extension or single-page export)'
    );
  }

  const probeRes = await deps.exec(READ_PARALLEL_SNAPSHOT, false, { bypassGovernor: true });
  const probe = probeRes.result as ParallelSnapshotProbe | undefined;
  if (!probeRes.success || !probe || !probe.ok) {
    return whole(probe?.reason ?? probeRes.error ?? 'studio did not report its parallel export snapshot');
  }
  if (probe.supportsTimeRange !== true) {
    return whole('this studio build does not support time-range rendering (supportsTimeRange)');
  }
  if (probe.world3d) {
    return whole('the scene uses a 3D world layer, which requires drawing pre-roll frames continuously');
  }
  if ((probe.unserializedCount ?? 0) > 0) {
    return whole('the scene uses per-frame callbacks that do not serialize across worker pages');
  }
  if (!probe.project) {
    return whole('studio could not serialize the project snapshot (app.exportProject)');
  }

  const fps = resolveEffectiveFps(args);
  const duration = Number(args.duration ?? 5);
  const startTime = typeof args.startTime === 'number' ? args.startTime : 0;
  const explicitFrames = typeof args.frames === 'number' ? args.frames : undefined;
  const windows = splitExportWindows({
    duration,
    fps,
    frames: explicitFrames,
    parallel: requestedWorkers,
    startTime,
    availableCores: deps.availableCores,
  });
  if (windows.length <= 1) {
    return whole('only 1 worker window is available for this host core count or frame count');
  }

  const startedAt = Date.now();
  await mkdir(deps.exportDir, { recursive: true });
  const tempDir = await mkdtemp(join(deps.exportDir, '.parallel-'));
  const snapshotJson = JSON.stringify({ project: probe.project, canvasSize: probe.canvasSize });
  const platform = String(args.platform || 'auto');

  try {
    const segmentFiles = await Promise.all(
      windows.map(async (w) =>
        deps.runWorker(async (worker) => {
          const loadRes = await worker.executeCode(LOAD_PARALLEL_SNAPSHOT, false, {
            bypassGovernor: true,
            stage: { ppParallelDoc: snapshotJson },
          });
          const loadPayload = loadRes.result as { ok?: boolean; error?: string } | undefined;
          if (!loadRes.success || !loadPayload?.ok) {
            throw new Error(`worker ${w.index} failed to load scene: ${loadPayload?.error || loadRes.error || 'unknown error'}`);
          }

          const segArgs: Record<string, unknown> = {
            ...baseArgs,
            format,
            fps,
            startTime: w.startTime,
            frames: w.frameCount,
          };
          delete segArgs.duration;
          const exportCode = deps.generateSegmentCode(segArgs);
          const expRes = await worker.executeCode(exportCode, false, { governorTimeoutMs: deps.governorTimeoutMs });
          if (!expRes.success) {
            throw new Error(`worker ${w.index} export script failed: ${expRes.error || 'unknown error'}`);
          }
          const payload = expRes.result as { success?: boolean; error?: string; retained?: boolean; exportId?: string; size?: number; chunkBytes?: number; data?: string } | undefined;
          if (!payload || payload.success === false) {
            throw new Error(`worker ${w.index} export failed: ${payload?.error || 'studio refused export'}`);
          }
          const segPath = join(tempDir, `seg_${String(w.index).padStart(2, '0')}.${format}`);
          if (payload.retained === true && typeof payload.exportId === 'string') {
            await deps.saveRetained(
              worker,
              {
                exportId: payload.exportId,
                size: Number(payload.size) || 0,
                format,
                chunkBytes: Number(payload.chunkBytes) || undefined,
              },
              platform,
              segPath
            );
          } else if (typeof payload.data === 'string' && payload.data.length > 0) {
            await deps.saveInline(payload.data, format, platform, segPath);
          } else {
            throw new Error(`worker ${w.index} returned no export data`);
          }
          return { file: segPath, payload };
        })
      )
    );

    const files = segmentFiles.map((s) => s.file);
    const sigs = await Promise.all(files.map((f) => ff.streams(f)));
    const badIdx = sigs.findIndex((s) => !s.ok || s.signature !== sigs[0].signature);
    if (badIdx >= 0) {
      return whole(`segment ${badIdx + 1} stream layout differed from segment 1 (${sigs[badIdx].reason || 'mismatch'})`);
    }

    const totalFrames = windows.reduce((acc, w) => acc + w.frameCount, 0);
    const totalSeconds = Math.round((totalFrames / fps) * 1000) / 1000;
    const hasAudio = /"audio"/.test(sigs[0].signature ?? '');
    const useProgramAudio = probe.programAudio === true && !!deps.programAudio && !!ff.mux && hasAudio;
    const finalFile = join(deps.exportDir, `pinepaper_${platform}_parallel_${Date.now()}.${format}`);
    const listFile = join(tempDir, 'concat.txt');

    let audioNote: string | undefined;
    if (useProgramAudio) {
      const videoOnly = join(tempDir, `video_only.${format}`);
      const joined = await ff.concat(files, listFile, videoOnly, { format, videoOnly: true });
      if (!joined.ok) throw new Error(`ffmpeg concat failed: ${joined.reason || 'unknown error'}`);
      const wav = await deps.programAudio!(totalSeconds);
      if ('none' in wav) {
        const quiet = ff.silence ? await ff.silence(videoOnly, finalFile, { format, seconds: totalSeconds }) : { ok: false };
        if (!quiet.ok) await copyFile(videoOnly, finalFile);
        audioNote = 'the program has no sound';
      } else if ('reason' in wav) {
        return whole(`program audio could not be rendered: ${wav.reason}`);
      } else {
        try {
          const muxed = await ff.mux!(videoOnly, wav.file, finalFile, { format, seconds: totalSeconds });
          if (!muxed.ok) throw new Error(`ffmpeg audio mux failed: ${muxed.reason || 'unknown error'}`);
          audioNote = 'program audio rendered whole and muxed without seam gaps';
        } finally {
          await unlink(wav.file).catch(() => undefined);
        }
      }
    } else {
      const tempOut = join(tempDir, `joined.${format}`);
      const joined = await ff.concat(files, listFile, tempOut, { audio: hasAudio, format });
      if (!joined.ok) throw new Error(`ffmpeg concat failed: ${joined.reason || 'unknown error'}`);
      await rename(tempOut, finalFile).catch(async () => {
        await copyFile(tempOut, finalFile);
      });
      if (hasAudio) audioNote = 'audio re-encoded cleanly across segment boundaries';
    }

    const cap = await (deps.enforceBitrateCap ?? enforceBitrateCap)(finalFile, format, {
      enforceBitrate: args.enforceBitrate === true,
      bitrate: typeof args.bitrate === 'number' ? args.bitrate : undefined,
    });

    const firstMeta = (segmentFiles[0]?.payload as Record<string, unknown>) ?? {};
    const firstVideo = (firstMeta.video as Record<string, unknown> | undefined) ?? {};
    const firstEncode = (firstVideo.encode as Record<string, unknown> | undefined) ?? {};
    const syntheticMeta: Record<string, unknown> = {
      ...firstMeta,
      duration: totalSeconds,
      video: {
        ...firstVideo,
        encode: {
          ...firstEncode,
          durationS: totalSeconds,
          frames: totalFrames,
          fps,
        },
        frames: { fed: totalFrames },
      },
    };
    const receipt = await (deps.receipt ?? exportFileReceiptOrReason)(finalFile, syntheticMeta);
    relabelForReencode(syntheticMeta, receipt as Record<string, unknown>, cap);

    const fileSize = 'bytes' in receipt ? receipt.bytes : (await stat(finalFile)).size;
    const wallMs = Date.now() - startedAt;
    const cleanResult = {
      success: true,
      format,
      platform,
      filePath: finalFile,
      fileSize,
      duration: totalSeconds,
      fps,
      frames: totalFrames,
      file: receipt,
      ...(audioNote ? { audio: audioNote } : {}),
      ...bitrateCapFields(cap),
      parallel: {
        requested: requestedWorkers,
        workers: windows.length,
        wallMs,
        windows: windows.map((w) => ({
          index: w.index,
          startFrame: w.startFrame,
          endFrame: w.endFrame,
          frameCount: w.frameCount,
          startTime: w.startTime,
          duration: w.duration,
        })),
      },
    };
    return {
      structuredContent: boundedStructured(cleanResult),
      content: [
        {
          type: 'text' as const,
          text:
            `Export saved to file:\n\nFile: ${finalFile}\nFormat: ${format}\nSize: ${(fileSize / 1024).toFixed(1)} KB\nPlatform: ${platform}\n`
            + `Parallel workers: ${windows.length} (${totalFrames} frames joined in ${(wallMs / 1000).toFixed(2)}s)\n`
            + (audioNote ? `Audio: ${audioNote}\n` : '')
            + bitrateCapLine(cap)
            + receiptErrorLine(receipt)
            + ('receiptError' in receipt ? '' : probeLines(receipt))
            + `\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
        },
        exportFileLink(finalFile, fileSize),
      ],
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
