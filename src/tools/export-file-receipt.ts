/**
 * What an export wrote, as facts a caller checks instead of re-auditing frames (owner, 2026-10-26: "hash first").
 *
 * - `sha256` and `bytes` of the file ON DISK, read back after it was written: the agent compares two renders in one
 *   field, and a file that came out empty or truncated cannot report the size it was meant to have.
 * - `frameDigest`, `frames` and `unreadFrames` from the studio's own per-frame hashes (lastVideoReport.frameHashes): two
 *   H.264 files whose bytes differ still prove the same pictures when their frame digests agree.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { env } from '../utils/env.js';

/** What the file is, as the studio's encoder and muxer report it (FxTool AgentMode `probe`). */
export interface ProbeSummary {
  container: string;
  codec: string;
  width: number;
  height: number;
  fps: number | null;
  durationS: number;
  frames: number;
  audio: { codec: string; sampleRate?: number; silent?: boolean } | null;
}

/** The saved file read by ffprobe, compared field by field with the studio's summary. */
export interface ProbeCheck {
  tool: 'ffprobe' | null;
  ok?: boolean;
  mismatches?: Array<{ field: string; studio: unknown; file: unknown }>;
  file?: Record<string, unknown>;
  reason?: string;
}

export interface ExportFileReceipt {
  sha256: string;
  bytes: number;
  frameDigest?: string;
  frames?: number;
  unreadFrames?: number;
  probe?: ProbeSummary;
  probeCheck?: ProbeCheck;
}

/** Hash a written file (streamed: a long video is never held in memory twice). */
export async function sha256OfFile(filePath: string): Promise<{ sha256: string; bytes: number }> {
  const h = createHash('sha256');
  let bytes = 0;
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => { h.update(chunk as Buffer); bytes += (chunk as Buffer).length; })
      .on('end', () => resolve())
      .on('error', reject);
  });
  return { sha256: h.digest('hex'), bytes };
}

/**
 * The studio's summary of a video it encoded: the result's own `probe` (a studio exporting through
 * PinePaperAgent.quickExport), else built from `video.encode` and `video.audioCodec` / `audio` (the emitted agent
 * export reads lastVideoReport directly). Null for a studio that does not report its encode.
 */
export function probeFromResult(exportResult: unknown): ProbeSummary | null {
  const r = exportResult as { probe?: unknown; video?: Record<string, unknown>; audio?: Record<string, unknown> } | null;
  if (!r || typeof r !== 'object') return null;
  if (r.probe && typeof r.probe === 'object') return r.probe as ProbeSummary;
  const enc = r.video && (r.video.encode as Record<string, unknown> | undefined);
  if (!enc || typeof enc !== 'object' || typeof enc.width !== 'number') return null;
  const ac = r.video?.audioCodec;
  const ar = r.audio;
  const audio = typeof ac === 'string' && ac !== 'none'
    ? { codec: ac, ...(ar && typeof ar.sampleRate === 'number' ? { sampleRate: ar.sampleRate } : {}), ...(ar && ar.silent === true ? { silent: true } : {}) }
    : null;
  return {
    container: String(enc.container), codec: String(enc.codec), width: enc.width as number, height: Number(enc.height),
    fps: typeof enc.fps === 'number' ? enc.fps : null, durationS: Number(enc.durationS), frames: Number(enc.frames), audio,
  };
}

let ffprobeAvailable: boolean | null = null;
/**
 * ffprobe and ffmpeg run through the optional add-on @pinepaper.studio/mcp-ffmpeg, so this package starts no
 * process itself. The add-on runs only those two binaries, through execFile (no shell), with the arguments array
 * this file writes; file paths are made absolute first, so none can be read as an option (a leading `-`) or an
 * ffmpeg protocol (`concat:`, `http:`). Without the add-on both are simply unavailable: the receipt says the file
 * was not read back, and a per-scene export runs whole. Turn the read-back off with PINEPAPER_FFPROBE=off.
 *
 * The specifier is a variable so a bundler does not try to resolve a package that is not a dependency.
 */
export const FFMPEG_ADDON = '@pinepaper.studio/mcp-ffmpeg';
type Runner = (cmd: 'ffprobe' | 'ffmpeg', args: string[], timeout?: number) => Promise<{ ok: boolean; stdout: string; stderr: string }>;
let runner: Runner | null | undefined;
/** Tests replace the runner; undefined goes back to loading the add-on. */
export function setFfmpegRunner(r: Runner | null | undefined): void { runner = r; ffprobeAvailable = null; ffmpegAvailable = null; }
async function loadRunner(): Promise<Runner | null> {
  if (runner === undefined) {
    const spec = FFMPEG_ADDON;
    try {
      const mod = (await import(spec)) as { run?: unknown };
      runner = typeof mod.run === 'function' ? (mod.run as Runner) : null;
    } catch { runner = null; }
  }
  return runner;
}
/** Whether the add-on is installed (the binaries may still be missing from PATH). */
export async function hasFfmpegAddon(): Promise<boolean> { return (await loadRunner()) !== null; }
async function run(cmd: 'ffprobe' | 'ffmpeg', args: string[], timeout = 30_000): Promise<{ ok: boolean; stdout: string; stderr: string }> {
  const r = await loadRunner();
  if (!r) return { ok: false, stdout: '', stderr: `${cmd} runs through the optional ${FFMPEG_ADDON} add-on, which is not installed` };
  return r(cmd, args, timeout);
}

/** ffprobe's codec_name for a studio codec string (avc1.* is h264, vp09.* is vp9). */
function codecFamily(codec: string): string {
  const c = codec.toLowerCase();
  if (c.startsWith('avc1') || c.startsWith('avc3') || c === 'h264') return 'h264';
  if (c.startsWith('vp09') || c === 'vp9') return 'vp9';
  if (c.startsWith('vp8') || c === 'vp8') return 'vp8';
  if (c.startsWith('av01') || c === 'av1') return 'av1';
  if (c.startsWith('mp4a') || c === 'aac') return 'aac';
  return c;
}

/**
 * Read the saved file with ffprobe, when it is on PATH, and compare it with the studio's summary: container, video
 * codec, size, frame rate, length (within one frame and 50 ms) and whether there is an audio track. Never throws: no
 * ffprobe, or one that cannot read the file, is said in `reason`.
 */
export async function verifyWithFfprobe(filePath: string, probe: ProbeSummary): Promise<ProbeCheck> {
  if (env('PINEPAPER_FFPROBE') === 'off') return { tool: null, reason: 'PINEPAPER_FFPROBE=off' };
  if (ffprobeAvailable === null) ffprobeAvailable = (await run('ffprobe', ['-version'])).ok;
  if (!ffprobeAvailable) {
    return { tool: null, reason: (await hasFfmpegAddon())
      ? 'ffprobe is not on PATH, so the file was not read back; the summary is what the studio encoded'
      : `the file was not read back (that needs the optional ${FFMPEG_ADDON} add-on and ffprobe on PATH); the summary is what the studio encoded` };
  }
  const r = await run('ffprobe', ['-v', 'error', '-show_entries',
    'format=format_name,duration:stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames', '-of', 'json', resolvePath(filePath)]);
  if (!r.ok) return { tool: 'ffprobe', ok: false, reason: `ffprobe could not read the file: ${r.stderr.trim() || 'no reason given'}` };
  let j: { format?: { format_name?: string; duration?: string }; streams?: Array<Record<string, unknown>> };
  try { j = JSON.parse(r.stdout); } catch { return { tool: 'ffprobe', ok: false, reason: 'ffprobe printed something that is not JSON' }; }
  const v = (j.streams ?? []).find((x) => x.codec_type === 'video');
  const a = (j.streams ?? []).find((x) => x.codec_type === 'audio');
  const [num, den] = String(v?.r_frame_rate ?? '0/1').split('/').map(Number);
  const fileFps = den ? Math.round((num / den) * 1000) / 1000 : null;
  const fileDur = j.format?.duration !== undefined ? Number(j.format.duration) : null;
  const file = {
    container: j.format?.format_name ?? null, codec: v?.codec_name ?? null, width: v?.width ?? null, height: v?.height ?? null,
    fps: fileFps, durationS: fileDur, frames: v?.nb_frames !== undefined ? Number(v.nb_frames) : null,
    audio: a ? { codec: a.codec_name ?? null } : null,
  };
  const mismatches: Array<{ field: string; studio: unknown; file: unknown }> = [];
  const formats = String(file.container ?? '').split(',');
  const wantContainer = probe.container === 'webm' ? ['webm', 'matroska'] : [probe.container, 'mov'];
  if (!formats.some((f) => wantContainer.includes(f))) mismatches.push({ field: 'container', studio: probe.container, file: file.container });
  if (codecFamily(probe.codec) !== file.codec) mismatches.push({ field: 'codec', studio: probe.codec, file: file.codec });
  if (probe.width !== file.width) mismatches.push({ field: 'width', studio: probe.width, file: file.width });
  if (probe.height !== file.height) mismatches.push({ field: 'height', studio: probe.height, file: file.height });
  if (probe.fps && fileFps && Math.abs(probe.fps - fileFps) > 0.01) mismatches.push({ field: 'fps', studio: probe.fps, file: fileFps });
  const frameS = probe.fps ? 1 / probe.fps : 0;
  if (fileDur !== null && Number.isFinite(fileDur) && Math.abs(fileDur - probe.durationS) > frameS + 0.05) {
    mismatches.push({ field: 'durationS', studio: probe.durationS, file: fileDur });
  }
  if (file.frames !== null && Number.isFinite(file.frames) && file.frames !== probe.frames) mismatches.push({ field: 'frames', studio: probe.frames, file: file.frames });
  if (!!probe.audio !== !!a) mismatches.push({ field: 'audio', studio: probe.audio ? probe.audio.codec : null, file: a ? a.codec_name : null });
  else if (probe.audio && a && codecFamily(probe.audio.codec) !== a.codec_name) mismatches.push({ field: 'audio.codec', studio: probe.audio.codec, file: a.codec_name });
  return { tool: 'ffprobe', ok: mismatches.length === 0, ...(mismatches.length ? { mismatches } : {}), file };
}

/** The receipt for an export result: the file's hash, plus the studio's frame hashes when it reported them. */
export async function exportFileReceipt(filePath: string, exportResult: unknown): Promise<ExportFileReceipt> {
  const { sha256, bytes } = await sha256OfFile(filePath);
  const out: ExportFileReceipt = { sha256, bytes };
  // What the file is: the studio's summary, checked against the file itself where ffprobe is on PATH.
  const probe = probeFromResult(exportResult);
  if (probe) {
    out.probe = probe;
    if (probe.container !== 'png') out.probeCheck = await verifyWithFfprobe(filePath, probe);
  }
  const r = exportResult as { video?: { frameHashes?: { digest?: unknown; count?: unknown; unread?: unknown } } } | null;
  const fh = r && r.video && r.video.frameHashes;
  if (fh && typeof fh.digest === 'string') {
    out.frameDigest = fh.digest;
    if (typeof fh.count === 'number') out.frames = fh.count;
    if (typeof fh.unread === 'number') out.unreadFrames = fh.unread;
  }
  return out;
}

/**
 * The receipt for a file that IS saved. A throw here (the hash read, ffprobe) came after a good save, and the
 * callers' catch reported it as the save failing, telling the agent to redo an export that is on disk. The
 * receipt step fails on its own instead, and the result says the file was saved without it.
 */
export async function exportFileReceiptOrReason(filePath: string, exportResult: unknown): Promise<ExportFileReceipt | { receiptError: string }> {
  try {
    return await exportFileReceipt(filePath, exportResult);
  } catch (e) {
    return { receiptError: (e instanceof Error && e.message) || 'no reason given' };
  }
}

/** The line a result carries when the file was saved but its receipt could not be made. */
export function receiptErrorLine(receipt: ExportFileReceipt | { receiptError: string }): string {
  return 'receiptError' in receipt
    ? `RECEIPT: the file was saved, but it could not be hashed or read back (${receipt.receiptError}); it has no sha256 or probe.\n`
    : '';
}

let ffmpegAvailable: boolean | null = null;
/** Whether ffmpeg is on PATH (asked once). The per-scene export joins its segments with it. */
export async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailable === null) ffmpegAvailable = (await run('ffmpeg', ['-version'])).ok;
  return ffmpegAvailable;
}

/** The streams a segment carries, for the join's precondition: every segment must match the first. */
export async function segmentStreams(filePath: string): Promise<{ ok: boolean; signature?: string; reason?: string }> {
  const r = await run('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels', '-of', 'json', resolvePath(filePath)]);
  if (!r.ok) return { ok: false, reason: r.stderr.trim() || 'ffprobe could not read it' };
  try {
    const j = JSON.parse(r.stdout) as { streams?: Array<Record<string, unknown>> };
    return { ok: true, signature: JSON.stringify((j.streams ?? []).map((x) => [x.codec_type, x.codec_name, x.width, x.height, x.r_frame_rate, x.sample_rate, x.channels])) };
  } catch { return { ok: false, reason: 'ffprobe printed something that is not JSON' }; }
}

/**
 * Join video segments end to end (ffmpeg's concat demuxer). The video is stream-copied: same encoder settings,
 * every segment starting on a keyframe. The AUDIO is re-encoded, because a copy cannot honour each segment's AAC
 * priming edit list: copied, three 2 s segments came out 48 ms longer than the video, with timestamp warnings and up
 * to 90 ms of silence at each seam; decoded and re-encoded, the next scene's sound starts on the cut (measured). The
 * list file holds absolute paths, quoted for the demuxer; -safe 0 lets it read them.
 */
export async function concatSegments(segments: string[], listFile: string, outFile: string, opts: { audio?: boolean; format?: string; videoOnly?: boolean } = {}): Promise<{ ok: boolean; reason?: string }> {
  const { writeFile } = await import('node:fs/promises');
  const quote = (p: string) => `'${resolvePath(p).replace(/'/g, "'\\''")}'`;
  await writeFile(listFile, segments.map((p) => `file ${quote(p)}`).join('\n') + '\n', 'utf-8');
  const audio = opts.videoOnly ? ['-an'] : opts.audio ? (opts.format === 'webm' ? ['-c:a', 'libopus', '-b:a', '128k'] : ['-c:a', 'aac', '-b:a', '192k']) : [];
  const r = await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', resolvePath(listFile), '-c:v', 'copy', ...audio,
    ...(opts.format === 'webm' ? [] : ['-movflags', '+faststart']), resolvePath(outFile)], 300_000);
  return r.ok ? { ok: true } : { ok: false, reason: r.stderr.trim() || 'ffmpeg failed with no message' };
}

/**
 * Put one audio file under a video: the video stream copied, the audio encoded for the container, cut to the
 * video's length. The per-scene export's program audio (the studio's own full-export bake) goes on this way, so a
 * cached segment never carries a level that an edit elsewhere changed, and there is no seam to hear.
 */
export async function muxAudio(videoFile: string, audioFile: string, outFile: string, opts: { format?: string; seconds: number }): Promise<{ ok: boolean; reason?: string }> {
  const codec = opts.format === 'webm' ? ['-c:a', 'libopus', '-b:a', '128k'] : ['-c:a', 'aac', '-b:a', '192k'];
  const r = await run('ffmpeg', ['-v', 'error', '-y', '-i', resolvePath(videoFile), '-i', resolvePath(audioFile), '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', ...codec, '-t', String(opts.seconds), ...(opts.format === 'webm' ? [] : ['-movflags', '+faststart']), resolvePath(outFile)], 300_000);
  return r.ok ? { ok: true } : { ok: false, reason: r.stderr.trim() || 'ffmpeg failed with no message' };
}

/** A silent stereo track under a video (48 kHz, the rate every export muxes), so a file from a silent program carries an audio track as a whole export does. */
export async function muxSilence(videoFile: string, outFile: string, opts: { format?: string; seconds: number }): Promise<{ ok: boolean; reason?: string }> {
  const codec = opts.format === 'webm' ? ['-c:a', 'libopus', '-b:a', '64k'] : ['-c:a', 'aac', '-b:a', '64k'];
  const r = await run('ffmpeg', ['-v', 'error', '-y', '-i', resolvePath(videoFile), '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', ...codec, '-t', String(opts.seconds), ...(opts.format === 'webm' ? [] : ['-movflags', '+faststart']), resolvePath(outFile)], 300_000);
  return r.ok ? { ok: true } : { ok: false, reason: r.stderr.trim() || 'ffmpeg failed with no message' };
}
