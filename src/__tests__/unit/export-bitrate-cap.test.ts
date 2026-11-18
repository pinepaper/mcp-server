/**
 * agent_export { enforceBitrate: true }: bitrate as a hard cap, by re-encoding with ffmpeg, when asked.
 *
 * Unit tests run against a scripted ffmpeg runner (the repo's setFfmpegRunner seam). The last block runs the real
 * ffmpeg and ffprobe, and is skipped when they are not on PATH.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setFfmpegRunner, currentFfmpegRunner, sha256OfFile } from '../../tools/export-file-receipt.js';
import {
  enforceBitrateCap, reencodeArgs, relabelForReencode, bitrateCapFields, bitrateCapLine, bitrateCapNoFile,
  MIN_CAP_BPS, MAX_CAP_BPS, SSIM_WARN_BELOW,
} from '../../tools/export-bitrate-cap.js';
import { AgentExportInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';
import type { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

let prior: ReturnType<typeof currentFfmpegRunner>;
beforeAll(() => { prior = currentFfmpegRunner(); });
afterEach(() => setFfmpegRunner(prior));
afterAll(() => setFfmpegRunner(prior));

const dirs: string[] = [];
const tmpFile = (name = 'out.mp4', bytes = 'BROWSER-ENCODE-BYTES'): string => {
  const d = mkdtempSync(join(tmpdir(), 'bitrate-cap-'));
  dirs.push(d);
  const f = join(d, name);
  writeFileSync(f, bytes);
  return f;
};
afterAll(() => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });

type Facts = { size: number; duration: number; fps?: string; frames?: number; vcodec?: string; vbps?: number | null; audio?: string[] };
const probeJson = (f: Facts) => JSON.stringify({
  format: { duration: String(f.duration), size: String(f.size), bit_rate: String(Math.round((f.size * 8) / f.duration)) },
  streams: [
    { codec_type: 'video', codec_name: f.vcodec ?? 'h264', r_frame_rate: f.fps ?? '30/1', ...(f.frames !== undefined ? { nb_frames: String(f.frames) } : {}), ...(f.vbps === null ? {} : { bit_rate: String(f.vbps ?? Math.round((f.size * 8) / f.duration)) }) },
    ...(f.audio ?? ['aac']).map((c) => ({ codec_type: 'audio', codec_name: c })),
  ],
});

interface Script {
  calls: Array<{ cmd: string; args: string[]; timeout?: number }>;
  original: Facts;
  result?: Facts;
  encode?: 'ok' | 'fail';
  noFfmpeg?: boolean;
  ssim?: string;
}
function install(s: Script): Script {
  setFfmpegRunner(async (cmd, args, timeout) => {
    s.calls.push({ cmd, args, timeout });
    if (args[0] === '-version') return s.noFfmpeg ? { ok: false, stdout: '', stderr: 'not found' } : { ok: true, stdout: 'ffmpeg', stderr: '' };
    if (cmd === 'ffprobe') {
      const path = args[args.length - 1];
      const f = path.endsWith('.bitrate-cap.mp4') ? s.result : s.original;
      return f ? { ok: true, stdout: probeJson(f), stderr: '' } : { ok: false, stdout: '', stderr: 'no such file' };
    }
    if (args.includes('libx264')) {
      if (s.encode === 'fail') return { ok: false, stdout: '', stderr: 'Error: x264 exploded\nencoder crashed' };
      writeFileSync(args[args.length - 1], 'CAPPED-BYTES');
      return { ok: true, stdout: '', stderr: '' };
    }
    if (args.includes('-lavfi')) return { ok: true, stdout: '', stderr: s.ssim ?? '[Parsed_ssim_0 @ 0x1] SSIM Y:0.9 U:0.9 V:0.9 All:0.912345 (10.5)\n' };
    return { ok: false, stdout: '', stderr: 'unexpected call' };
  });
  return s;
}
const over: Facts = { size: 54_000_000, duration: 10, frames: 300, vbps: 43_000_000, audio: ['aac'] };
const capped: Facts = { size: 7_900_000, duration: 10, frames: 300, vbps: 6_300_000, audio: ['aac'] };

describe('the argument: validated, opt-in, never a failure', () => {
  it('is an optional boolean in the schema and the tool schema, and is not rejected beside other settings', () => {
    expect(AgentExportInputSchema.parse({ platform: 'web', format: 'mp4', bitrate: 6_000_000, enforceBitrate: true }).enforceBitrate).toBe(true);
    expect(AgentExportInputSchema.safeParse({ platform: 'web', format: 'mp4', enforceBitrate: 'yes' }).success).toBe(false);
    // asked without a bitrate, or on a still: accepted here; the delivery says why nothing was capped
    expect(AgentExportInputSchema.safeParse({ platform: 'web', format: 'mp4', enforceBitrate: true }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ platform: 'web', format: 'png', enforceBitrate: true }).success).toBe(true);
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_agent_export')!;
    const props = (tool.inputSchema as { properties: Record<string, { type?: string }> }).properties;
    expect(props.enforceBitrate.type).toBe('boolean');
    expect(tool.description).toContain('enforceBitrate: true makes bitrate a hard cap');
    expect(tool.description).toContain('quantizer is not available for H.264');
  });
  it('reencodeArgs refuses a cap that is not an integer in range', () => {
    for (const bad of [Number.NaN, 1.5, MIN_CAP_BPS - 1, MAX_CAP_BPS + 1, Infinity, '6000000' as unknown as number]) {
      expect(() => reencodeArgs('/a.mp4', '/b.mp4', bad, true)).toThrow();
    }
    expect(() => reencodeArgs('/a.mp4', '/b.mp4', 6_000_000, true)).not.toThrow();
  });
  it('a file name with spaces, quotes and shell characters is one argument and nothing else carries user text', () => {
    const nasty = '/tmp/my "clip"; rm -rf $(whoami) `id` & -i.mp4';
    const args = reencodeArgs(nasty, '/tmp/out.bitrate-cap.mp4', 6_000_000, true);
    expect(args.filter((a) => a.includes('rm -rf'))).toEqual([nasty]);
    expect(args[args.indexOf('-i') + 1]).toBe(nasty);
    expect(args.every((a) => typeof a === 'string')).toBe(true);
    // every other element is a fixed flag, a fixed value or an integer
    const rest = args.filter((a) => a !== nasty && a !== '/tmp/out.bitrate-cap.mp4');
    expect(rest.every((a) => /^(-{1,2}[a-z0-9:_]+|[a-z0-9:.+]+|\d+)$/i.test(a))).toBe(true);
    // a relative path is made absolute, so it can never be read as an option
    expect(reencodeArgs('-evil.mp4', 'o.mp4', 6_000_000, false).find((a) => a.endsWith('-evil.mp4'))!.startsWith('/')).toBe(true);
  });
});

describe('not asked for: nothing changes', () => {
  it('returns null, starts no process, adds no field and no line', async () => {
    const s = install({ calls: [], original: over });
    const f = tmpFile();
    for (const req of [{}, { bitrate: 6_000_000 }, { enforceBitrate: false, bitrate: 6_000_000 }]) {
      expect(await enforceBitrateCap(f, 'mp4', req)).toBeNull();
    }
    expect(s.calls).toEqual([]);
    expect(readFileSync(f, 'utf8')).toBe('BROWSER-ENCODE-BYTES');
    expect(bitrateCapFields(null)).toEqual({});
    expect(bitrateCapLine(null)).toBe('');
    const result = { video: { bitExact: true, achievedBitrate: 43e6, frameHashes: { digest: 'd' } }, warnings: ['bitrate_exceeded: x'] };
    const before = JSON.stringify(result);
    relabelForReencode(result, { sha256: 'aa', frameDigest: 'd' }, null);
    expect(JSON.stringify(result)).toBe(before);
  });
});

describe('asked, and why nothing was capped (the export is never failed)', () => {
  it('no bitrate', async () => {
    const s = install({ calls: [], original: over });
    const o = await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true });
    expect(o).toMatchObject({ action: 'skipped', code: 'no_bitrate' });
    expect(o!.note).toContain('needs a bitrate');
    expect(s.calls).toEqual([]);
    expect(await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true, bitrate: 50 })).toMatchObject({ code: 'no_bitrate' });
  });
  it('another format', async () => {
    const s = install({ calls: [], original: over });
    expect(await enforceBitrateCap(tmpFile('a.webm'), 'webm', { enforceBitrate: true, bitrate: 6_000_000 })).toMatchObject({ action: 'skipped', code: 'format_unsupported' });
    expect(bitrateCapNoFile('png')).toMatchObject({ code: 'format_unsupported' });
    expect(s.calls).toEqual([]);
  });
  it('no runner at all (the npm package): says it starts no process', async () => {
    setFfmpegRunner(null);
    const f = tmpFile();
    const o = await enforceBitrateCap(f, 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(o).toMatchObject({ action: 'skipped', code: 'ffmpeg_unavailable' });
    expect(o!.note).toContain('npm package does not run');
    expect(readFileSync(f, 'utf8')).toBe('BROWSER-ENCODE-BYTES');
  });
  it('a runner whose ffmpeg is not on PATH', async () => {
    install({ calls: [], original: over, noFfmpeg: true });
    const o = await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(o).toMatchObject({ code: 'ffmpeg_unavailable' });
    expect(o!.note).toContain('not on PATH');
  });
});

describe('asked, and the file is within the cap', () => {
  it('held, no re-encode: the only calls are the availability check and a read of the file', async () => {
    const s = install({ calls: [], original: { size: 3_000_000, duration: 10, frames: 300, vbps: 2_400_000 } });
    const f = tmpFile();
    const o = await enforceBitrateCap(f, 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(o).toMatchObject({ action: 'held', code: 'held_no_reencode', capBitsPerSecond: 6_000_000 });
    expect(o!.note).toContain('held, no re-encode');
    expect(s.calls.some((c) => c.args.includes('libx264'))).toBe(false);
    expect(readFileSync(f, 'utf8')).toBe('BROWSER-ENCODE-BYTES');
    expect(readdirSync(join(f, '..'))).toEqual(['out.mp4']);
  });
});

describe('asked, and the file is over the cap', () => {
  it('a failed transcode keeps the original, removes the temp file and says so', async () => {
    const s = install({ calls: [], original: over, encode: 'fail' });
    const f = tmpFile();
    const o = await enforceBitrateCap(f, 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(o).toMatchObject({ action: 'kept-original', code: 'reencode_failed' });
    expect(o!.note).toContain('encoder crashed');
    expect(o!.note).toContain('over the cap');
    expect(readFileSync(f, 'utf8')).toBe('BROWSER-ENCODE-BYTES');
    expect(readdirSync(join(f, '..'))).toEqual(['out.mp4']);
    expect(s.calls.filter((c) => c.args.includes('libx264')).length).toBe(1);
  });
  it('a result that is not what it should be is discarded: wrong length, wrong frames, no smaller, other audio, not H.264', async () => {
    const cases: Array<[Facts, string]> = [
      [{ ...capped, duration: 9.5 }, 'its length'],
      [{ ...capped, frames: 299 }, 'frames'],
      [{ ...capped, size: 60_000_000 }, 'not smaller'],
      [{ ...capped, audio: ['opus'] }, 'audio streams'],
      [{ ...capped, audio: [] }, 'audio streams'],
      [{ ...capped, vcodec: 'hevc' }, 'not H.264'],
    ];
    for (const [result, why] of cases) {
      install({ calls: [], original: over, result });
      const f = tmpFile();
      const o = await enforceBitrateCap(f, 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
      expect(o).toMatchObject({ action: 'kept-original', code: 'reencode_rejected' });
      expect(o!.note).toContain(why);
      expect(readFileSync(f, 'utf8')).toBe('BROWSER-ENCODE-BYTES');
      expect(readdirSync(join(f, '..'))).toEqual(['out.mp4']);
    }
  });
  it('a result one frame shorter is within the tolerance', async () => {
    install({ calls: [], original: over, result: { ...capped, duration: 10 - 1 / 30 } });
    expect(await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true, bitrate: 6_000_000 })).toMatchObject({ action: 'reencoded' });
  });
  it('success replaces the file and reports encoder, bitrate before and after, time, settings and a quality figure', async () => {
    const s = install({ calls: [], original: over, result: capped });
    const f = tmpFile();
    const before = await sha256OfFile(f);
    const o = await enforceBitrateCap(f, 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(readFileSync(f, 'utf8')).toBe('CAPPED-BYTES');
    expect(readdirSync(join(f, '..'))).toEqual(['out.mp4']);
    expect(o).toMatchObject({
      action: 'reencoded', code: 'reencoded', encoder: 'libx264', capBitsPerSecond: 6_000_000,
      before: { bitsPerSecond: 43_000_000, basis: 'video-stream', sha256: before.sha256 },
      after: { bitsPerSecond: 6_300_000, heldCap: false, overCapPercent: 5 },
      settings: { maxrate: 6_000_000, pixelFormat: 'yuv420p', faststart: true, audio: 'copied' },
      quality: { ssim: 0.912 },
    });
    expect(o!.quality!.caution).toContain('14%');
    expect(typeof o!.elapsedMs).toBe('number');
    expect(o!.note).toContain('Re-encoded with ffmpeg');
    expect(o!.note).toContain('Audio was copied untouched');
    expect(o!.note).toContain('video.browserEncode');
    const enc = s.calls.find((c) => c.args.includes('libx264'))!;
    expect(enc.args).toContain('-maxrate');
    expect(enc.args[enc.args.indexOf('-maxrate') + 1]).toBe('6000000');
    expect(enc.args[enc.args.indexOf('-c:a') + 1]).toBe('copy');
    expect(enc.args[enc.args.indexOf('-pix_fmt') + 1]).toBe('yuv420p');
    expect(enc.args).toContain('+faststart');
    expect(enc.timeout).toBeGreaterThanOrEqual(120_000);
    // the quality sample is bounded
    const ssim = s.calls.find((c) => c.args.includes('-lavfi'))!;
    expect(ssim.args.filter((a) => a === '-t').length).toBe(2);
    expect(ssim.timeout).toBeLessThanOrEqual(90_000);
  });
  it('a low SSIM, or a cap under half of what the browser made, is a caution; an unmeasurable SSIM falls back to the ratio', async () => {
    install({ calls: [], original: over, result: capped, ssim: 'SSIM Y:0.8 U:0.8 V:0.8 All:0.810000 (7.2)\n' });
    const low = await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(low!.quality!.ssim).toBe(0.81);
    expect(low!.quality!.caution).toContain('SSIM against the browser\'s file is 0.81');
    expect(low!.quality!.caution).toContain('14%');
    expect(0.81).toBeLessThan(SSIM_WARN_BELOW);
    install({ calls: [], original: over, result: capped, ssim: 'garbage' });
    const none = await enforceBitrateCap(tmpFile(), 'mp4', { enforceBitrate: true, bitrate: 6_000_000 });
    expect(none!.quality!.ssim).toBeNull();
    expect(none!.quality!.ssimUnavailable).toContain('no SSIM figure');
    expect(none!.quality!.caution).toContain('far below what this content needed');
  });
});

describe('the browser encode\'s claims are not presented as the delivered file\'s', () => {
  it('moves hashes, bitExact, determinism and achieved bitrate under video.browserEncode and relabels the warnings', () => {
    const result: Record<string, any> = {
      video: { bitrate: 6e6, achievedBitrate: 43e6, bitrateCeilingHeld: false, bitExact: true, determinism: { cause: 'x' }, frameHashes: { digest: 'abc', count: 300, hashes: ['h'] }, encoderRan: { codec: 'avc1' }, warnings: [{ code: 'bitrate_exceeded', message: 'over' }] },
      warnings: ['bitrate_exceeded: the 6.00 Mbps target was not held'],
      fidelity: { warnings: [{ code: 'determinism_not_pinned', message: 'will not repeat' }, { code: 'other', message: 'keep' }] },
    };
    const receipt: Record<string, any> = { sha256: 'new', bytes: 10, frameDigest: 'abc', frames: 300 };
    const outcome = { action: 'reencoded', code: 'reencoded', note: 'NOTE', before: { bitsPerSecond: 43e6, bytes: 99, basis: 'video-stream', sha256: 'old' } } as never;
    relabelForReencode(result, receipt, outcome);
    expect(result.video.bitExact).toBeUndefined();
    expect(result.video.frameHashes).toBeUndefined();
    expect(result.video.achievedBitrate).toBeUndefined();
    expect(result.video.bitrate).toBe(6e6);
    expect(result.video.browserEncode).toMatchObject({ bitExact: true, achievedBitrate: 43e6, bitrateCeilingHeld: false, frameHashes: { digest: 'abc' }, determinism: { cause: 'x' } });
    expect(result.warnings[0]).toStartWith("(about the browser's file, before the ffmpeg re-encode) bitrate_exceeded");
    expect(result.video.warnings[0].message).toStartWith("(about the browser's file");
    expect(result.fidelity.warnings[0].message).toStartWith("(about the browser's file");
    expect(result.fidelity.warnings[1].message).toBe('keep');
    expect(result.fidelity.warnings.at(-1)).toEqual({ code: 'reencoded_by_ffmpeg', message: 'NOTE' });
    expect(receipt.sha256).toBe('new');
    expect(receipt.frameDigest).toBeUndefined();
    expect(receipt.browserEncode).toMatchObject({ sha256: 'old', bytes: 99, frameDigest: 'abc', frames: 300 });
    // idempotent: a second pass does not stack the label
    relabelForReencode(result, receipt, outcome);
    expect(result.warnings[0].match(/about the browser's file/g)!.length).toBe(1);
  });
  it('a held or skipped outcome leaves every engine claim as it was', () => {
    const result = { video: { bitExact: true, achievedBitrate: 1 } };
    relabelForReencode(result, null, { action: 'held', code: 'held_no_reencode', note: 'n' });
    expect(result.video).toEqual({ bitExact: true, achievedBitrate: 1 });
  });
});

// ---------------------------------------------------------------------------
// Through the handler, with a fake studio that holds a REAL file when ffmpeg is present
// ---------------------------------------------------------------------------

const haveFfmpeg = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
const real = haveFfmpeg ? describe : describe.skip;

const PROVENANCE = '{"schema":"pinepaper.provenance/1","generator":"PinePaper Studio"}';

function makeNoisyMp4(dir: string, name = 'noisy.mp4', withAudio = true): string {
  const out = join(dir, name);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc2=s=640x360:r=30:d=2',
    ...(withAudio ? ['-f', 'lavfi', '-i', 'sine=frequency=440:d=2'] : []),
    '-vf', 'noise=alls=60:allf=t+u', '-c:v', 'libx264', '-crf', '8', '-pix_fmt', 'yuv420p',
    ...(withAudio ? ['-c:a', 'aac', '-b:a', '96k'] : []), '-metadata', `comment=${PROVENANCE}`, out]);
  return out;
}
function ffprobeJson(file: string): { format: { duration: string; size: string; tags?: Record<string, string> }; streams: Array<Record<string, string>> } {
  return JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,size:format_tags=comment:stream=codec_type,codec_name,bit_rate,nb_frames,sample_rate,channels', '-of', 'json', file]).toString());
}

real('the real ffmpeg: a noisy 2 s MP4 with sound, capped', () => {
  it('holds a low cap, keeps duration, frame count and the audio stream as it was, and carries the comment tag', async () => {
    const d = mkdtempSync(join(tmpdir(), 'bitrate-cap-real-'));
    dirs.push(d);
    const src = makeNoisyMp4(d, 'noisy clip "x"; $(id).mp4');
    const before = ffprobeJson(src);
    const beforeVideoBps = Number(before.streams.find((s) => s.codec_type === 'video')!.bit_rate);
    const cap = 1_500_000;
    expect(beforeVideoBps).toBeGreaterThan(cap * 3);
    const o = await enforceBitrateCap(src, 'mp4', { enforceBitrate: true, bitrate: cap });
    expect(o).toMatchObject({ action: 'reencoded', encoder: 'libx264', settings: { audio: 'copied' } });
    const after = ffprobeJson(src);
    const v = after.streams.find((s) => s.codec_type === 'video')!;
    const a = after.streams.find((s) => s.codec_type === 'audio')!;
    expect(v.codec_name).toBe('h264');
    expect(Number(v.bit_rate)).toBeLessThan(cap * 1.1);
    expect(o!.after!.bitsPerSecond).toBeLessThan(cap * 1.1);
    expect(Math.abs(Number(after.format.duration) - Number(before.format.duration))).toBeLessThanOrEqual(1 / 30 + 0.001);
    expect(v.nb_frames).toBe(before.streams.find((s) => s.codec_type === 'video')!.nb_frames);
    const aBefore = before.streams.find((s) => s.codec_type === 'audio')!;
    expect(a.codec_name).toBe(aBefore.codec_name);
    expect(a.sample_rate).toBe(aBefore.sample_rate);
    expect(a.channels).toBe(aBefore.channels);
    expect(Number(after.format.size)).toBeLessThan(Number(before.format.size));
    // the provenance carrier (a comment tag in the iTunes-style metadata) survives ffmpeg's default metadata copy
    expect(after.format.tags?.comment).toBe(PROVENANCE);
    expect(typeof o!.quality!.ssim).toBe('number');
    expect(readdirSync(d)).toEqual(['noisy clip "x"; $(id).mp4']);
  }, 120_000);

  it('a file within the cap is left byte for byte alone', async () => {
    const d = mkdtempSync(join(tmpdir(), 'bitrate-cap-real-'));
    dirs.push(d);
    const src = makeNoisyMp4(d);
    const sha = (await sha256OfFile(src)).sha256;
    const o = await enforceBitrateCap(src, 'mp4', { enforceBitrate: true, bitrate: 150_000_000 > MAX_CAP_BPS ? MAX_CAP_BPS : 150_000_000 });
    expect(o).toMatchObject({ action: 'held', code: 'held_no_reencode' });
    expect((await sha256OfFile(src)).sha256).toBe(sha);
  }, 60_000);

  it('a video-only file is capped and stays video-only', async () => {
    const d = mkdtempSync(join(tmpdir(), 'bitrate-cap-real-'));
    dirs.push(d);
    const src = makeNoisyMp4(d, 'silent.mp4', false);
    const o = await enforceBitrateCap(src, 'mp4', { enforceBitrate: true, bitrate: 1_500_000 });
    expect(o).toMatchObject({ action: 'reencoded', settings: { audio: 'none' } });
    expect(ffprobeJson(src).streams.some((s) => s.codec_type === 'audio')).toBe(false);
  }, 120_000);

  it('through the handler: off is byte-identical to today, on re-encodes, and the reply carries the new fields and relabels the engine\'s', async () => {
    const d = mkdtempSync(join(tmpdir(), 'bitrate-cap-real-'));
    dirs.push(d);
    const src = readFileSync(makeNoisyMp4(d));
    const run = async (extra: Record<string, unknown>) => {
      const controller = {
        connected: true,
        connect: async () => undefined,
        executeCode: async (code: string) => {
          if (code.includes('exportToStore')) {
            return { success: true, result: {
              success: true, platform: 'web', format: 'mp4', retained: true, exportId: 'pp-export-1.mp4', size: src.length, chunkBytes: 1 << 20,
              warnings: ['bitrate_exceeded: the 1.50 Mbps target was not held'],
              video: { bitrate: 1_500_000, achievedBitrate: 9e6, bitrateCeilingHeld: false, bitExact: true, frameHashes: { digest: 'abc', count: 60, hashes: [] },
                encode: { container: 'mp4', codec: 'avc1.64001f', width: 640, height: 360, fps: 30, durationS: 2, frames: 60 }, audioCodec: 'aac' },
            } };
          }
          if (code.includes('readExport')) {
            const offset = Number(/"offset":(\d+)/.exec(code)?.[1] ?? 0);
            const length = Number(/"length":(\d+)/.exec(code)?.[1] ?? src.length);
            const slice = src.subarray(offset, offset + length);
            return { success: true, result: { ok: true, id: 'pp-export-1.mp4', offset, length: slice.length, size: src.length, eof: offset + slice.length >= src.length, data: slice.toString('base64') } };
          }
          return { success: true, result: { ok: true } };
        },
      } as unknown as PinePaperBrowserController;
      const r = await handleToolCall('pinepaper_agent_export', { platform: 'web', format: 'mp4', bitrate: 1_500_000, ...extra },
        { executeInBrowser: true, browserController: controller, executionMode: 'puppeteer' });
      expect(r.isError).toBeFalsy();
      const sc = r.structuredContent as Record<string, any>;
      return { sc, text: (r.content[0] as { text: string }).text, file: String(sc.filePath) };
    };

    const off = await run({});
    expect(readFileSync(off.file).equals(src)).toBe(true);
    expect('bitrateCap' in off.sc).toBe(false);
    expect(off.text).not.toContain('Bitrate cap');
    expect(off.sc.video.bitExact).toBe(true);
    expect(off.sc.video.frameHashes.digest).toBe('abc');
    expect(off.sc.video.browserEncode).toBeUndefined();
    expect(off.sc.file.frameDigest).toBe('abc');
    rmSync(off.file, { force: true });

    const on = await run({ enforceBitrate: true });
    expect(on.sc.bitrateCap).toMatchObject({ requested: true, action: 'reencoded', encoder: 'libx264' });
    expect(on.text).toContain('Bitrate cap: Re-encoded with ffmpeg');
    const delivered = readFileSync(on.file);
    expect(delivered.length).toBeLessThan(src.length);
    expect(on.sc.fileSize).toBe(delivered.length);
    expect(on.sc.file.sha256).toBe((await sha256OfFile(on.file)).sha256);
    expect(on.sc.file.sha256).not.toBe(on.sc.file.browserEncode.sha256);
    expect(on.sc.file.browserEncode.frameDigest).toBe('abc');
    expect(on.sc.video.bitExact).toBeUndefined();
    expect(on.sc.video.browserEncode).toMatchObject({ bitExact: true, achievedBitrate: 9e6, bitrateCeilingHeld: false });
    expect(on.sc.warnings[0]).toContain("(about the browser's file, before the ffmpeg re-encode)");
    expect(on.sc.fidelity.warnings.some((w: { code: string }) => w.code === 'reencoded_by_ffmpeg')).toBe(true);
    expect(on.sc.file.probeCheck.ok).toBe(true);
    rmSync(on.file, { force: true });

    const noBitrate = await run({ enforceBitrate: true, bitrate: undefined });
    expect(noBitrate.sc.bitrateCap).toMatchObject({ action: 'skipped', code: 'no_bitrate' });
    expect(readFileSync(noBitrate.file).equals(src)).toBe(true);
    rmSync(noBitrate.file, { force: true });
  }, 180_000);
});
