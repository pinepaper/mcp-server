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
 * - asked, and the file is over: video re-encoded with libx264 (maxrate = the cap, +faststart), audio copied
 *   untouched, container metadata carried over by ffmpeg's defaults. The colour range and tags of the browser's file
 *   are kept (a full-range yuvj420p file stays full-range yuvj420p; limited stays limited), read from ffprobe, never
 *   assumed. The result replaces the browser's file only when
 *   it is a smaller, readable H.264 file with the same length (within one frame), frame count and audio streams;
 *   otherwise the browser's file stays and the reply says why;
 * - asked, but no bitrate was given, the format is not MP4, or ffmpeg is not available (the npm package starts no
 *   process; only the Claude Desktop extension's runner does): the export is not failed. The browser's file is
 *   delivered and a coded note says why no cap was enforced.
 *
 * A re-encode makes the browser file's claims untrue of the delivered file: its sha256, per-frame hashes, bitExact,
 * determinism and achieved bitrate. `relabelForReencode` moves those under `video.browserEncode`, marks the
 * bitrate and determinism warnings (structured, plain and the singular `video.warning`) as being about the file before
 * the re-encode, describes the delivered file (probe, `size`, audio) from the ffprobe run on it, and keeps the
 * browser's `encode`, `size` and probe under `browserEncode`. The delivered file's sha256 is read from disk after
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
import { FFMPEG_OPT_IN, hasFfmpeg, hasFfmpegAddon, runFfmpegTool, sha256OfFile } from './export-file-receipt.js';

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
  settings?: { preset: string; maxrate: number; bufsize: number; pixelFormat: 'yuv420p' | 'yuvj420p'; colorRange: 'full' | 'limited'; colorTags?: ColourTags; faststart: true; audio: 'copied' | 'none' };
  /** The delivered file as ffprobe read it (the browser's summary no longer describes it). Present only after a re-encode. */
  delivered?: DeliveredSummary;
  elapsedMs?: number;
  quality?: {
    ssim: number | null;
    ssimBasis?: string;
    ssimUnavailable?: string;
    capVsBrowserFile?: number;
    caution: string | null;
  };
}

export interface ColourTags { space?: string; primaries?: string; transfer?: string }

/** The delivered file, from the ffprobe run on it after the re-encode. */
export interface DeliveredSummary {
  container: 'mp4';
  codec: 'h264';
  profile: string | null;
  level: number | null;
  pixelFormat: string | null;
  colorRange: string | null;
  colorTags?: ColourTags;
  width: number | null;
  height: number | null;
  fps: number | null;
  durationS: number | null;
  frames: number | null;
  bytes: number;
  audio: { codec: string; sampleRate: number | null; channels: number | null; durationS: number | null; startS: number | null } | null;
  source: 'ffprobe on the delivered file';
}

interface AudioFacts { codec: string | null; sampleRate: number | null; channels: number | null; durationS: number | null; startS: number | null }

interface Facts {
  bytes: number;
  durationS: number | null;
  fps: number | null;
  frames: number | null;
  videoCodec: string | null;
  audio: Array<string | null>;
  audioFacts: AudioFacts[];
  videoBps: number | null;
  totalBps: number | null;
  width: number | null;
  height: number | null;
  profile: string | null;
  level: number | null;
  pixFmt: string | null;
  colorRange: string | null;
  colorSpace: string | null;
  colorPrimaries: string | null;
  colorTransfer: string | null;
}

type Probe = { ok: true; facts: Facts } | { ok: false; reason: string };

const num = (x: unknown): number | null => { const n = typeof x === 'string' && x.trim() === '' ? NaN : Number(x); return Number.isFinite(n) ? n : null; };
/** An ffprobe colour field as a name, or null when ffprobe says it is unknown or unset. */
const tagName = (x: unknown): string | null => (typeof x === 'string' && x !== '' && x !== 'unknown' && x !== 'unspecified' ? x : null);

async function probeFile(filePath: string): Promise<Probe> {
  const r = await runFfmpegTool('ffprobe', ['-v', 'error', '-show_entries',
    'format=duration,size,bit_rate:stream=codec_type,codec_name,profile,level,width,height,pix_fmt,color_range,color_space,color_primaries,color_transfer,sample_rate,channels,duration,start_time,bit_rate,nb_frames,r_frame_rate',
    '-of', 'json', resolvePath(filePath)]);
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
      audioFacts: streams.filter((s) => s.codec_type === 'audio').map((s) => ({
        codec: typeof s.codec_name === 'string' ? s.codec_name : null, sampleRate: num(s.sample_rate), channels: num(s.channels), durationS: num(s.duration), startS: num(s.start_time),
      })),
      videoBps: num(v.bit_rate),
      totalBps: num(j.format?.bit_rate),
      width: num(v.width), height: num(v.height),
      profile: typeof v.profile === 'string' ? v.profile : null, level: num(v.level),
      pixFmt: typeof v.pix_fmt === 'string' ? v.pix_fmt : null,
      colorRange: tagName(v.color_range), colorSpace: tagName(v.color_space), colorPrimaries: tagName(v.color_primaries), colorTransfer: tagName(v.color_transfer),
    },
  };
}

function measure(f: Facts): BitrateMeasure | null {
  if (f.videoBps && f.videoBps > 0) return { bitsPerSecond: Math.round(f.videoBps), bytes: f.bytes, basis: 'video-stream' };
  const total = f.totalBps && f.totalBps > 0 ? f.totalBps : f.durationS && f.durationS > 0 && f.bytes > 0 ? (f.bytes * 8) / f.durationS : null;
  return total ? { bitsPerSecond: Math.round(total), bytes: f.bytes, basis: 'whole-file' } : null;
}

const mbps = (bps: number): string => `${(bps / 1e6).toFixed(bps < 1e7 ? 2 : 1)} Mbps`;

/** What the re-encode keeps of the browser file's colour: its range (full or limited), and its matrix, primaries and transfer when it names them. */
export interface ColourPlan {
  pixelFormat: 'yuv420p' | 'yuvj420p';
  colorRange: 'full' | 'limited';
  /** The -color_range value to pass: only when the input named one. */
  rangeTag: 'pc' | 'tv' | null;
  tags: ColourTags;
}
export const LIMITED_PLAN: ColourPlan = { pixelFormat: 'yuv420p', colorRange: 'limited', rangeTag: null, tags: {} };

/** A colour name that is safe as one ffmpeg argument value (ffprobe prints names like bt709, smpte170m, iec61966-2-1). */
const SAFE_TAG = /^[a-z0-9][a-z0-9._-]{0,31}$/;
const safeTag = (x: string | null): string | undefined => (x !== null && SAFE_TAG.test(x) ? x : undefined);

/**
 * The browser's file is full range (yuvj420p, color_range pc) when its encoder was told so, and forcing plain
 * yuv420p silently turns it into a limited-range file: ffmpeg rescales the levels, so a decoder that honours the
 * tag shows the same picture, but the file no longer is what the browser made, and a player that ignores the range
 * tag shows it differently from the original. The plan keeps the input's range and carries its colour tags.
 */
export function colourPlanFor(f: Pick<Facts, 'pixFmt' | 'colorRange' | 'colorSpace' | 'colorPrimaries' | 'colorTransfer'>): ColourPlan {
  const full = f.colorRange === 'pc' || (f.pixFmt?.startsWith('yuvj') ?? false);
  const tags: ColourTags = {};
  const space = safeTag(f.colorSpace), primaries = safeTag(f.colorPrimaries), transfer = safeTag(f.colorTransfer);
  if (space) tags.space = space;
  if (primaries) tags.primaries = primaries;
  if (transfer) tags.transfer = transfer;
  return { pixelFormat: full ? 'yuvj420p' : 'yuv420p', colorRange: full ? 'full' : 'limited', rangeTag: full ? 'pc' : f.colorRange === 'tv' ? 'tv' : null, tags };
}

/** The ffmpeg arguments, as an array. Every value is a path made absolute here, an integer checked by the caller, or a colour name that passed SAFE_TAG. */
export function reencodeArgs(input: string, output: string, capBps: number, hasAudio: boolean, colour: ColourPlan = LIMITED_PLAN): string[] {
  if (!Number.isInteger(capBps) || capBps < MIN_CAP_BPS || capBps > MAX_CAP_BPS) throw new Error(`bitrate cap out of range: ${String(capBps)}`);
  const k = String(capBps);
  return ['-v', 'error', '-nostdin', '-y', '-i', resolvePath(input),
    '-map', '0:v:0', ...(hasAudio ? ['-map', '0:a'] : []),
    '-c:v', 'libx264', '-preset', CAP_PRESET, '-b:v', k, '-maxrate', k, '-bufsize', k, '-pix_fmt', colour.pixelFormat,
    ...(colour.rangeTag ? ['-color_range', colour.rangeTag] : []),
    ...(colour.tags.space ? ['-colorspace', colour.tags.space] : []),
    ...(colour.tags.primaries ? ['-color_primaries', colour.tags.primaries] : []),
    ...(colour.tags.transfer ? ['-color_trc', colour.tags.transfer] : []),
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
        : `the re-encode needs ffmpeg, which the npm package does not run on its own (it starts no external programs); ${FFMPEG_OPT_IN}`);
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
    const plan = colourPlanFor(f);
    const enc = await runFfmpegTool('ffmpeg', reencodeArgs(filePath, tmp, cap, f.audio.length > 0, plan), timeout);
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
    const outFull = o.colorRange === 'pc' || (o.pixFmt?.startsWith('yuvj') ?? false);
    if (outFull !== (plan.colorRange === 'full')) return reject(`its colour range is ${outFull ? 'full' : 'limited'} (${o.pixFmt ?? 'pixel format unknown'}) against ${plan.colorRange} in the browser's file`);
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
    const ssimWords = sim.ssim !== null
      ? ` SSIM against the browser's file (${sim.basis}): ${sim.ssim}; it is a whole-frame average, so it can miss damage confined to a small area.`
      : ` SSIM could not be measured (${sim.reason ?? 'unknown'}).`;
    const colourWords = ` Colour range kept: ${plan.colorRange} (${plan.pixelFormat}).`;
    const note = `Re-encoded with ffmpeg (libx264, preset ${CAP_PRESET}, maxrate ${mbps(cap)}) because the browser's file was ${mbps(before.bitsPerSecond)}; the delivered file ${heldWords}, `
      + `${(f.bytes / 1e6).toFixed(1)} MB down to ${(o.bytes / 1e6).toFixed(1)} MB, in ${(elapsedMs / 1000).toFixed(1)} s. Audio ${f.audio.length ? 'was copied untouched' : 'is absent (the file has none)'}.${colourWords}${ssimWords}`
      + `${caution ? ' ' + caution : ''} The delivered file's sha256 is file.sha256; the browser encode's hashes, bitExact, determinism and bitrate are under video.browserEncode and describe the file before this re-encode.`;
    return { action: 'reencoded', code: 'reencoded', capBitsPerSecond: cap, before: withBefore, after: afterOut, encoder: 'libx264',
      settings: { preset: CAP_PRESET, maxrate: cap, bufsize: cap, pixelFormat: plan.pixelFormat, colorRange: plan.colorRange, ...(Object.keys(plan.tags).length ? { colorTags: plan.tags } : {}), faststart: true, audio: f.audio.length ? 'copied' : 'none' },
      delivered: deliveredSummary(o), elapsedMs, quality, note };
  } catch (e) {
    if (tmp) await unlink(tmp).catch(() => undefined);
    return { action: 'kept-original', code: 'reencode_failed', capBitsPerSecond: cap,
      note: `The re-encode could not run (${e instanceof Error ? e.message : String(e)}). The browser's file is delivered unchanged and may be over the cap.` };
  }
}

function deliveredSummary(o: Facts): DeliveredSummary {
  const a = o.audioFacts[0];
  const tags: ColourTags = {};
  if (o.colorSpace) tags.space = o.colorSpace;
  if (o.colorPrimaries) tags.primaries = o.colorPrimaries;
  if (o.colorTransfer) tags.transfer = o.colorTransfer;
  return {
    container: 'mp4', codec: 'h264', profile: o.profile, level: o.level, pixelFormat: o.pixFmt, colorRange: o.colorRange,
    ...(Object.keys(tags).length ? { colorTags: tags } : {}),
    width: o.width, height: o.height, fps: o.fps !== null ? Math.round(o.fps * 1000) / 1000 : null,
    durationS: o.durationS !== null ? Math.round(o.durationS * 1000) / 1000 : null, frames: o.frames, bytes: o.bytes,
    audio: a ? { codec: a.codec ?? 'unknown', sampleRate: a.sampleRate, channels: a.channels, durationS: a.durationS, startS: a.startS } : null,
    source: 'ffprobe on the delivered file',
  };
}

function validCap(b: unknown): b is number { return typeof b === 'number' && Number.isInteger(b) && b >= MIN_CAP_BPS && b <= MAX_CAP_BPS; }

const BROWSER_VIDEO_KEYS = ['bitExact', 'determinism', 'frameHashes', 'achievedBitrate', 'bitrateCeilingHeld', 'bitrateOverPercent', 'encoderRan', 'hardwareAcceleration'] as const;
const PRE_REENCODE_WARNINGS = new Set(['bitrate_exceeded', 'bitrate_not_honoured', 'bitrate_not_applied', 'bitrate_below_floor', 'determinism_not_pinned']);
const PRE_REENCODE_TAG = "(about the browser's file, before the ffmpeg re-encode) ";
/** A plain-text warning that is a claim about the browser's encode: a bitrate or determinism sentence, by code or by wording. */
const PRE_REENCODE_TEXT = /^(?:deterministic export\b|determinism\b|the [\d.]+ ?[kM]?bps target\b|the [\d.]+ Mbps target\b)|\bbitrate\b|\bMbps\b/i;

/**
 * After a re-encode, the browser file's claims are not claims about the delivered file. Moves them, unchanged, under
 * `video.browserEncode` (and the receipt's frame digest and probe under `file.browserEncode`), marks the bitrate and
 * determinism warnings, in whatever form they came (structured, plain text, the singular `video.warning`), as being
 * about the file before the re-encode, describes the delivered file (probe, size, audio) from the ffprobe run on it,
 * and adds one warning that says what happened. The original facts are kept, relabelled, not deleted. A no-op unless
 * the outcome is a re-encode.
 */
export function relabelForReencode(exportResult: unknown, receipt: Record<string, unknown> | null, outcome: BitrateCapOutcome | null): void {
  if (!outcome || outcome.action !== 'reencoded') return;
  const delivered = outcome.delivered ?? null;
  const r = exportResult as { video?: Record<string, unknown>; warnings?: unknown; warning?: unknown; fidelity?: { warnings?: unknown[] }; size?: unknown; audio?: Record<string, unknown>; probe?: unknown } | null;
  if (r && typeof r === 'object') {
    const v = r.video && typeof r.video === 'object' ? r.video : null;
    const moved: Record<string, unknown> = {};
    if (v) {
      for (const k of BROWSER_VIDEO_KEYS) if (k in v) { moved[k] = v[k]; delete v[k]; }
    }
    // The browser's own summary of its encode, its byte count and (for a studio that reports it) its top-level probe.
    if (v && 'encode' in v) { moved.encode = v.encode; if (delivered) v.encode = deliveredProbe(delivered, v.encode); }
    if ('probe' in r && r.probe !== undefined) { moved.probe = r.probe; if (delivered) r.probe = deliveredProbe(delivered, r.probe); }
    if (delivered && typeof r.size === 'number') { moved.size = r.size; r.size = delivered.bytes; }
    if (v) {
      v.browserEncode = { ...moved, note: "These describe the file the browser encoded, before the ffmpeg bitrate-cap re-encode. They are not facts about the delivered file: its sha256 is file.sha256, its size is size, its encode is video.encode, and its bitrate is bitrateCap.after." };
    }
    // The audio block was measured on the browser's mp4. The stream was copied, so the sound is the same; the container figures are not the delivered file's.
    if (r.audio && typeof r.audio === 'object') {
      const a = r.audio;
      a.measuredFromOutput = false;
      a.measuredOn = "the browser's file, before the ffmpeg re-encode";
      a.note = "The audio stream was copied untouched by ffmpeg, so the sound is the browser's; mediaDurationS, outputEditList and the other container figures here were measured on the browser's mp4, not on the delivered file. The delivered file's audio, as ffprobe read it, is in deliveredAudio.";
      if (delivered) a.deliveredAudio = delivered.audio;
    }
    const tag = (w: unknown): unknown => {
      if (typeof w === 'string') {
        if (w.startsWith(PRE_REENCODE_TAG)) return w;
        return [...PRE_REENCODE_WARNINGS].some((c) => w.startsWith(c)) || PRE_REENCODE_TEXT.test(w) ? PRE_REENCODE_TAG + w : w;
      }
      if (w && typeof w === 'object') {
        const o = w as { code?: unknown; message?: unknown };
        if (typeof o.code === 'string' && PRE_REENCODE_WARNINGS.has(o.code) && typeof o.message === 'string' && !o.message.includes(PRE_REENCODE_TAG)) o.message = PRE_REENCODE_TAG + o.message;
      }
      return w;
    };
    for (const holder of [r as { warnings?: unknown }, v as { warnings?: unknown } | null, r.fidelity as { warnings?: unknown } | undefined]) {
      if (holder && Array.isArray(holder.warnings)) holder.warnings = (holder.warnings as unknown[]).map(tag);
    }
    // The singular `warning` is the engine's own warnings joined into one string: all of it the browser encode's report.
    for (const holder of [r as { warning?: unknown }, v as { warning?: unknown } | null]) {
      if (holder && typeof holder.warning === 'string' && !holder.warning.startsWith(PRE_REENCODE_TAG)) holder.warning = PRE_REENCODE_TAG + holder.warning;
    }
    r.fidelity = r.fidelity && typeof r.fidelity === 'object' ? r.fidelity : { warnings: [] };
    r.fidelity.warnings = [...(Array.isArray(r.fidelity.warnings) ? r.fidelity.warnings : []), { code: 'reencoded_by_ffmpeg', message: outcome.note }];
  }
  if (receipt && typeof receipt.sha256 === 'string') {
    const moved: Record<string, unknown> = {};
    for (const k of ['frameDigest', 'frames', 'unreadFrames']) if (k in receipt) { moved[k] = receipt[k]; delete receipt[k]; }
    if (delivered) {
      moved.probe = receipt.probe;
      receipt.probe = deliveredProbe(delivered, receipt.probe);
      const pc = receipt.probeCheck as { comparedWith?: string } | undefined;
      if (pc && typeof pc === 'object') pc.comparedWith = "the browser's summary of its own file, before the re-encode";
    }
    receipt.browserEncode = { ...moved, sha256: outcome.before?.sha256, bytes: outcome.before?.bytes, note: "The browser's file before the re-encode: its sha256, its summary (probe) and the studio's hashes of the frames it fed its encoder. sha256, bytes and probe above are the delivered file." };
  }
}

/** The probe/encode summary of the DELIVERED file, in the shape the browser's summary has (plus what only ffprobe on this file knows). */
function deliveredProbe(d: DeliveredSummary, browser: unknown): Record<string, unknown> {
  const b = browser && typeof browser === 'object' ? (browser as { audio?: { silent?: boolean } | null }) : null;
  const silent = b?.audio && typeof b.audio === 'object' && b.audio.silent === true ? { silent: true } : {};
  return {
    container: d.container, codec: d.codec, profile: d.profile, level: d.level, pixelFormat: d.pixelFormat, colorRange: d.colorRange,
    ...(d.colorTags ? { colorTags: d.colorTags } : {}),
    width: d.width, height: d.height, fps: d.fps, durationS: d.durationS, frames: d.frames,
    audio: d.audio ? { codec: d.audio.codec, ...(d.audio.sampleRate !== null ? { sampleRate: d.audio.sampleRate } : {}), ...(d.audio.channels !== null ? { channels: d.audio.channels } : {}), ...silent } : null,
    source: d.source,
  };
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
