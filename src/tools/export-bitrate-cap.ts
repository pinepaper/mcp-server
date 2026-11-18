/**
 * agent_export { enforceBitrate: true }: make `bitrate` a hard cap for an MP4, with ffmpeg, when the caller asks.
 *
 * The headless browser's H.264 encoder treats the bitrate as a hint. A dense scene (a swarm of 100,000 marks) came
 * out at 43 Mbps whether it was given nothing or 6 Mbps. Re-encoding the file with libx264 under `-maxrate` does hold
 * a cap, at a visible cost on that kind of picture (measured SSIM 0.81 at 6 Mbps, 0.85 at 12), so it is opt-in and
 * says what it did:
 *
 * - not asked for: nothing here runs and the reply is exactly what it was;
 * - asked, and the file is within the cap: nothing is re-encoded, and the reply says so;
 * - asked, and the file is over: video re-encoded with libx264 (maxrate = the cap, yuv420p, +faststart), audio copied
 *   untouched, container metadata carried over by ffmpeg's defaults. The result replaces the browser's file only when
 *   it is a smaller, readable H.264 file with the same length (within one frame), frame count and audio streams;
 *   otherwise the browser's file stays and the reply says why;
 * - asked, but no bitrate was given, the format is not MP4, or ffmpeg is not available (the npm package starts no
 *   process; only the Claude Desktop extension's runner does): the export is not failed. The browser's file is
 *   delivered and a coded note says why no cap was enforced.
 *
 * A re-encode makes the browser file's claims untrue of the delivered file: its sha256, per-frame hashes, bitExact,
 * determinism and achieved bitrate. `relabelForReencode` moves those under `video.browserEncode` and marks the
 * bitrate warnings as being about the file before the re-encode. The delivered file's sha256 is read from disk after
 * this step, as for every export. The provenance record (a ©cmt comment in moov/udta/meta/ilst) is carried over by
 * ffmpeg's default metadata copy, byte for byte; it still names the browser's encode and does not say a re-encode
 * happened, which the reply does.
 *
 * ffmpeg runs through the same runner as the other ffmpeg features (export-file-receipt.ts `runFfmpegTool`): execFile
 * with an argument array, absolute paths, a timeout. No user string is placed in an argument: the only values are
 * paths this server made absolute, and integers checked here.
 */
import { rename, unlink } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve as resolvePath } from 'node:path';
import { hasFfmpeg, hasFfmpegAddon, runFfmpegTool, sha256OfFile } from './export-file-receipt.js';

export const MIN_CAP_BPS = 100_000;
export const MAX_CAP_BPS = 200_000_000;
/** x264 preset for the re-encode: the speed/size trade the ffmpeg CLI itself defaults to. */
export const CAP_PRESET = 'medium';
/** SSIM is measured on at most this many seconds from the start, so it cannot double the time of a long film. */
export const SSIM_SAMPLE_SECONDS = 10;
export const SSIM_TIMEOUT_MS = 90_000;
/** Below this SSIM the reply warns that fine detail was lost. */
export const SSIM_WARN_BELOW = 0.9;
const MIN_ENCODE_TIMEOUT_MS = 120_000;
const MAX_ENCODE_TIMEOUT_MS = 1_800_000;

export type BitrateCapCode =
  | 'reencoded'
  | 'held_no_reencode'
  | 'no_bitrate'
  | 'format_unsupported'
  | 'ffmpeg_unavailable'
  | 'file_unreadable'
  | 'reencode_failed'
  | 'reencode_timeout'
  | 'reencode_rejected';

export interface BitrateMeasure { bitsPerSecond: number; bytes: number; basis: 'video-stream' | 'whole-file'; }

export interface BitrateCapOutcome {
  /** reencoded: the file was replaced. held: within the cap, untouched. skipped: not attempted. kept-original: attempted, the browser's file stays. */
  action: 'reencoded' | 'held' | 'skipped' | 'kept-original';
  code: BitrateCapCode;
  /** One plain-words paragraph for the reader of the reply. */
  note: string;
  capBitsPerSecond?: number;
  before?: BitrateMeasure & { sha256?: string };
  after?: BitrateMeasure & { heldCap: boolean; overCapPercent: number };
  encoder?: 'libx264';
  settings?: { preset: string; maxrate: number; bufsize: number; pixelFormat: 'yuv420p'; faststart: true; audio: 'copied' | 'none' };
  elapsedMs?: number;
  quality?: {
    ssim: number | null;
    ssimBasis?: string;
    ssimUnavailable?: string;
    capVsBrowserFile?: number;
    caution: string | null;
  };
}

interface Facts {
  bytes: number;
  durationS: number | null;
  fps: number | null;
  frames: number | null;
  videoCodec: string | null;
  audio: Array<string | null>;
  videoBps: number | null;
  totalBps: number | null;
}

type Probe = { ok: true; facts: Facts } | { ok: false; reason: string };

const num = (x: unknown): number | null => { const n = typeof x === 'string' && x.trim() === '' ? NaN : Number(x); return Number.isFinite(n) ? n : null; };

async function probeFile(filePath: string): Promise<Probe> {
  const r = await runFfmpegTool('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration,size,bit_rate:stream=codec_type,codec_name,bit_rate,nb_frames,r_frame_rate', '-of', 'json', resolvePath(filePath)]);
  if (!r.ok) return { ok: false, reason: r.stderr.trim() || 'ffprobe could not read the file' };
  let j: { format?: { duration?: string; size?: string; bit_rate?: string }; streams?: Array<Record<string, unknown>> };
  try { j = JSON.parse(r.stdout); } catch { return { ok: false, reason: 'ffprobe printed something that is not JSON' }; }
  const streams = j.streams ?? [];
  const v = streams.find((s) => s.codec_type === 'video');
  if (!v) return { ok: false, reason: 'the file has no video stream' };
  const [n, d] = String(v.r_frame_rate ?? '0/1').split('/').map(Number);
  const fps = d ? n / d : null;
  return {
    ok: true,
    facts: {
      bytes: num(j.format?.size) ?? 0,
      durationS: num(j.format?.duration),
      fps: fps !== null && Number.isFinite(fps) && fps > 0 ? fps : null,
      frames: num(v.nb_frames),
      videoCodec: typeof v.codec_name === 'string' ? v.codec_name : null,
      audio: streams.filter((s) => s.codec_type === 'audio').map((s) => (typeof s.codec_name === 'string' ? s.codec_name : null)),
      videoBps: num(v.bit_rate),
      totalBps: num(j.format?.bit_rate),
    },
  };
}

function measure(f: Facts): BitrateMeasure | null {
  if (f.videoBps && f.videoBps > 0) return { bitsPerSecond: Math.round(f.videoBps), bytes: f.bytes, basis: 'video-stream' };
  const total = f.totalBps && f.totalBps > 0 ? f.totalBps : f.durationS && f.durationS > 0 && f.bytes > 0 ? (f.bytes * 8) / f.durationS : null;
  return total ? { bitsPerSecond: Math.round(total), bytes: f.bytes, basis: 'whole-file' } : null;
}

const mbps = (bps: number): string => `${(bps / 1e6).toFixed(bps < 1e7 ? 2 : 1)} Mbps`;

/** The ffmpeg arguments, as an array. Every value is a path made absolute here or an integer checked by the caller. */
export function reencodeArgs(input: string, output: string, capBps: number, hasAudio: boolean): string[] {
  if (!Number.isInteger(capBps) || capBps < MIN_CAP_BPS || capBps > MAX_CAP_BPS) throw new Error(`bitrate cap out of range: ${String(capBps)}`);
  const k = String(capBps);
  return ['-v', 'error', '-nostdin', '-y', '-i', resolvePath(input),
    '-map', '0:v:0', ...(hasAudio ? ['-map', '0:a'] : []),
    '-c:v', 'libx264', '-preset', CAP_PRESET, '-b:v', k, '-maxrate', k, '-bufsize', k, '-pix_fmt', 'yuv420p',
    ...(hasAudio ? ['-c:a', 'copy'] : ['-an']),
    '-movflags', '+faststart', resolvePath(output)];
}

/** ffmpeg's ssim filter over the first seconds of both files (the browser's file first). Null with a reason when it could not be measured. */
async function measureSsim(original: string, reencoded: string, durationS: number | null): Promise<{ ssim: number | null; basis: string; reason?: string }> {
  const sample = durationS && durationS > 0 ? Math.min(durationS, SSIM_SAMPLE_SECONDS) : SSIM_SAMPLE_SECONDS;
  const basis = durationS !== null && durationS <= SSIM_SAMPLE_SECONDS ? 'the whole clip' : `the first ${SSIM_SAMPLE_SECONDS} s`;
  const t = String(Math.round(sample * 1000) / 1000);
  const r = await runFfmpegTool('ffmpeg', ['-v', 'info', '-nostdin', '-nostats', '-t', t, '-i', resolvePath(original), '-t', t, '-i', resolvePath(reencoded),
    '-an', '-lavfi', '[0:v:0][1:v:0]ssim', '-f', 'null', '-'], SSIM_TIMEOUT_MS);
  if (!r.ok) return { ssim: null, basis, reason: `ffmpeg's ssim filter did not finish (${r.stderr.trim().split('\n').pop() || 'no reason given'})` };
  const all = [...r.stderr.matchAll(/SSIM[^\n]*?\bAll:\s*([0-9.]+)/g)];
  const last = all.length ? Number(all[all.length - 1][1]) : NaN;
  return Number.isFinite(last) ? { ssim: Math.round(last * 1000) / 1000, basis } : { ssim: null, basis, reason: 'ffmpeg printed no SSIM figure' };
}

export interface BitrateCapRequest { enforceBitrate?: boolean; bitrate?: number }

/**
 * Apply the cap to a saved export. Returns null when it was not asked for (nothing is touched, nothing is said).
 * Never throws: any failure keeps the browser's file and is the outcome's `note`.
 */
export async function enforceBitrateCap(filePath: string, format: string, req: BitrateCapRequest): Promise<BitrateCapOutcome | null> {
  if (req.enforceBitrate !== true) return null;
  const skipped = (code: BitrateCapCode, note: string): BitrateCapOutcome => ({ action: 'skipped', code, note: `No bitrate cap was enforced: ${note}. The browser's file is delivered as it came out.`, ...(validCap(req.bitrate) ? { capBitsPerSecond: req.bitrate } : {}) });
  if (format !== 'mp4') return skipped('format_unsupported', `enforceBitrate re-encodes MP4 only, and this export is ${format}`);
  if (!validCap(req.bitrate)) return skipped('no_bitrate', 'enforceBitrate needs a bitrate (an integer from 100000 to 200000000 bits per second) to hold the file to');
  const cap = req.bitrate;
  let tmp: string | null = null;
  try {
    if (!(await hasFfmpeg())) {
      return skipped('ffmpeg_unavailable', (await hasFfmpegAddon())
        ? 'ffmpeg is not on PATH, and the re-encode needs it'
        : "the re-encode needs ffmpeg, which the npm package does not run (it starts no external programs); the Claude Desktop extension runs it when ffmpeg is on PATH");
    }
    const probed = await probeFile(filePath);
    if (!probed.ok) return skipped('file_unreadable', `ffprobe could not read the file (${probed.reason}), so it could not be measured against the cap`);
    const f = probed.facts;
    const before = measure(f);
    if (!before) return skipped('file_unreadable', 'the file\'s bitrate could not be measured');
    if (before.bitsPerSecond <= cap) {
      return { action: 'held', code: 'held_no_reencode', capBitsPerSecond: cap, before,
        note: `The ${mbps(before.bitsPerSecond)} file is within the ${mbps(cap)} cap: held, no re-encode.` };
    }
    const sha = await sha256OfFile(filePath);
    const withBefore = { ...before, sha256: sha.sha256 };
    const dir = dirname(resolvePath(filePath));
    tmp = join(dir, `${basename(filePath, extname(filePath))}.bitrate-cap.mp4`);
    const timeout = Math.min(MAX_ENCODE_TIMEOUT_MS, Math.max(MIN_ENCODE_TIMEOUT_MS, MIN_ENCODE_TIMEOUT_MS + Math.round((f.durationS ?? 0) * 5000)));
    const started = Date.now();
    const enc = await runFfmpegTool('ffmpeg', reencodeArgs(filePath, tmp, cap, f.audio.length > 0), timeout);
    const elapsedMs = Date.now() - started;
    const keep = (code: BitrateCapCode, why: string): BitrateCapOutcome => ({ action: 'kept-original', code, capBitsPerSecond: cap, before: withBefore, elapsedMs,
      note: `The file was ${mbps(before.bitsPerSecond)} against the ${mbps(cap)} cap, and ffmpeg's re-encode ${why}. The browser's file is delivered unchanged and is over the cap.` });
    if (!enc.ok) {
      await unlink(tmp).catch(() => undefined);
      const timedOut = elapsedMs >= timeout * 0.98;
      return keep(timedOut ? 'reencode_timeout' : 'reencode_failed', timedOut ? `did not finish within ${Math.round(timeout / 1000)} s` : `failed (${enc.stderr.trim().split('\n').pop() || 'no reason given'})`);
    }
    const out = await probeFile(tmp);
    const reject = async (why: string): Promise<BitrateCapOutcome> => { await unlink(tmp as string).catch(() => undefined); return keep('reencode_rejected', `was discarded: ${why}`); };
    if (!out.ok) return reject(`the result could not be read back (${out.reason})`);
    const o = out.facts;
    const frameS = f.fps ? 1 / f.fps : 1 / 30;
    if (o.videoCodec !== 'h264') return reject(`the result's video is ${o.videoCodec ?? 'unknown'}, not H.264`);
    if (f.durationS !== null && o.durationS !== null && Math.abs(o.durationS - f.durationS) > frameS + 0.001) return reject(`its length is ${o.durationS.toFixed(3)} s against ${f.durationS.toFixed(3)} s`);
    if (f.frames !== null && o.frames !== null && f.frames !== o.frames) return reject(`it has ${o.frames} frames against ${f.frames}`);
    if (o.audio.length !== f.audio.length || o.audio.some((c, i) => c !== f.audio[i])) return reject(`its audio streams are [${o.audio.join(', ')}] against [${f.audio.join(', ')}]`);
    if (!(o.bytes > 0) || o.bytes >= f.bytes) return reject(`it is not smaller (${o.bytes} bytes against ${f.bytes})`);
    const after = measure(o);
    if (!after) return reject('its bitrate could not be measured');
    // The quality indicator is read BEFORE the replacement, while the browser's file is still the one on disk.
    const sim = await measureSsim(filePath, tmp, f.durationS).catch((e) => ({ ssim: null, basis: 'none', reason: e instanceof Error ? e.message : String(e) }));
    await rename(tmp, filePath);
    tmp = null;
    const afterOut = { ...after, heldCap: after.bitsPerSecond <= cap, overCapPercent: Math.max(0, Math.round((after.bitsPerSecond / cap - 1) * 1000) / 10) };
    const ratio = Math.round((cap / before.bitsPerSecond) * 1000) / 1000;
    const cautions: string[] = [];
    if (sim.ssim !== null && sim.ssim < SSIM_WARN_BELOW) cautions.push(`SSIM against the browser's file is ${sim.ssim} (1 is identical; below ${SSIM_WARN_BELOW} the loss is usually visible), so fine detail has smeared`);
    if (ratio < 0.5) cautions.push(`the cap is ${Math.round(ratio * 100)}% of what the browser produced, which is far below what this content needed`);
    const caution = cautions.length ? `Quality caution: ${cautions.join('; ')}.` : null;
    const quality = { ssim: sim.ssim, ssimBasis: sim.basis, ...(sim.reason ? { ssimUnavailable: sim.reason } : {}), capVsBrowserFile: ratio, caution };
    const heldWords = afterOut.heldCap ? `held the cap (${mbps(after.bitsPerSecond)})` : `came out ${mbps(after.bitsPerSecond)}, ${afterOut.overCapPercent}% over the cap (x264 holds a cap closely, not exactly)`;
    const ssimWords = sim.ssim !== null ? ` SSIM against the browser's file (${sim.basis}): ${sim.ssim}.` : ` SSIM could not be measured (${sim.reason ?? 'unknown'}).`;
    const note = `Re-encoded with ffmpeg (libx264, preset ${CAP_PRESET}, maxrate ${mbps(cap)}) because the browser's file was ${mbps(before.bitsPerSecond)}; the delivered file ${heldWords}, `
      + `${(f.bytes / 1e6).toFixed(1)} MB down to ${(o.bytes / 1e6).toFixed(1)} MB, in ${(elapsedMs / 1000).toFixed(1)} s. Audio ${f.audio.length ? 'was copied untouched' : 'is absent (the file has none)'}.${ssimWords}`
      + `${caution ? ' ' + caution : ''} The delivered file's sha256 is file.sha256; the browser encode's hashes, bitExact, determinism and bitrate are under video.browserEncode and describe the file before this re-encode.`;
    return { action: 'reencoded', code: 'reencoded', capBitsPerSecond: cap, before: withBefore, after: afterOut, encoder: 'libx264',
      settings: { preset: CAP_PRESET, maxrate: cap, bufsize: cap, pixelFormat: 'yuv420p', faststart: true, audio: f.audio.length ? 'copied' : 'none' }, elapsedMs, quality, note };
  } catch (e) {
    if (tmp) await unlink(tmp).catch(() => undefined);
    return { action: 'kept-original', code: 'reencode_failed', capBitsPerSecond: cap,
      note: `The re-encode could not run (${e instanceof Error ? e.message : String(e)}). The browser's file is delivered unchanged and may be over the cap.` };
  }
}

function validCap(b: unknown): b is number { return typeof b === 'number' && Number.isInteger(b) && b >= MIN_CAP_BPS && b <= MAX_CAP_BPS; }

const BROWSER_VIDEO_KEYS = ['bitExact', 'determinism', 'frameHashes', 'achievedBitrate', 'bitrateCeilingHeld', 'bitrateOverPercent', 'encoderRan', 'hardwareAcceleration'] as const;
const PRE_REENCODE_WARNINGS = new Set(['bitrate_exceeded', 'bitrate_not_honoured', 'bitrate_not_applied', 'bitrate_below_floor', 'determinism_not_pinned']);
const PRE_REENCODE_TAG = "(about the browser's file, before the ffmpeg re-encode) ";

/**
 * After a re-encode, the browser file's claims are not claims about the delivered file. Moves them, unchanged, under
 * `video.browserEncode` (and the receipt's frame digest under `file.browserEncode`), marks the bitrate and
 * determinism warnings as being about the file before the re-encode, and adds one warning that says what happened.
 * The original facts are kept, relabelled, not deleted. A no-op unless the outcome is a re-encode.
 */
export function relabelForReencode(exportResult: unknown, receipt: Record<string, unknown> | null, outcome: BitrateCapOutcome | null): void {
  if (!outcome || outcome.action !== 'reencoded') return;
  const r = exportResult as { video?: Record<string, unknown>; warnings?: unknown; fidelity?: { warnings?: unknown[] } } | null;
  if (r && typeof r === 'object') {
    const v = r.video && typeof r.video === 'object' ? r.video : null;
    const moved: Record<string, unknown> = {};
    if (v) {
      for (const k of BROWSER_VIDEO_KEYS) if (k in v) { moved[k] = v[k]; delete v[k]; }
      v.browserEncode = { ...moved, note: "These describe the file the browser encoded, before the ffmpeg bitrate-cap re-encode. They are not facts about the delivered file: its sha256 is file.sha256, and its bitrate is bitrateCap.after." };
    }
    const tag = (w: unknown): unknown => {
      if (typeof w === 'string') return [...PRE_REENCODE_WARNINGS].some((c) => w.startsWith(c)) && !w.includes(PRE_REENCODE_TAG) ? PRE_REENCODE_TAG + w : w;
      if (w && typeof w === 'object') {
        const o = w as { code?: unknown; message?: unknown };
        if (typeof o.code === 'string' && PRE_REENCODE_WARNINGS.has(o.code) && typeof o.message === 'string' && !o.message.includes(PRE_REENCODE_TAG)) o.message = PRE_REENCODE_TAG + o.message;
      }
      return w;
    };
    for (const holder of [r as { warnings?: unknown }, v as { warnings?: unknown } | null, r.fidelity as { warnings?: unknown } | undefined]) {
      if (holder && Array.isArray(holder.warnings)) holder.warnings = (holder.warnings as unknown[]).map(tag);
    }
    r.fidelity = r.fidelity && typeof r.fidelity === 'object' ? r.fidelity : { warnings: [] };
    r.fidelity.warnings = [...(Array.isArray(r.fidelity.warnings) ? r.fidelity.warnings : []), { code: 'reencoded_by_ffmpeg', message: outcome.note }];
  }
  if (receipt && typeof receipt.sha256 === 'string') {
    const moved: Record<string, unknown> = {};
    for (const k of ['frameDigest', 'frames', 'unreadFrames']) if (k in receipt) { moved[k] = receipt[k]; delete receipt[k]; }
    receipt.browserEncode = { ...moved, sha256: outcome.before?.sha256, bytes: outcome.before?.bytes, note: "The browser's file before the re-encode: its sha256, and the studio's hashes of the frames it fed its encoder. sha256 and bytes above are the delivered file." };
  }
}

/** The reply's structured field: absent when the cap was not asked for, so an ordinary export's reply is unchanged. */
export function bitrateCapFields(outcome: BitrateCapOutcome | null): Record<string, unknown> {
  return outcome ? { bitrateCap: { requested: true, ...outcome } } : {};
}

/** The line a reader of the words gets. */
export function bitrateCapLine(outcome: BitrateCapOutcome | null): string {
  return outcome ? `Bitrate cap: ${outcome.note}\n` : '';
}

/** enforceBitrate on an export that saved no MP4 file (a still, an estimate): not an error, and it says why nothing was capped. */
export function bitrateCapNoFile(format: string): BitrateCapOutcome {
  return { action: 'skipped', code: 'format_unsupported', note: `No bitrate cap was enforced: enforceBitrate re-encodes a saved MP4 file only, and this export (${format}) saved none.` };
}
