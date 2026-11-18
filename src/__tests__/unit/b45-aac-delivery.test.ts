import { describe, it, expect, afterEach, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { deliverAacIfOpus, isOpusMp4, setFfmpegRunner, currentFfmpegRunner } from '../../tools/export-file-receipt.js';

const opusResult = { video: { audioCodec: 'opus', encode: { container: 'mp4', codec: 'avc1', width: 640, height: 360, fps: 30, durationS: 2, frames: 60 } } };
const aacResult = { video: { audioCodec: 'aac', encode: { container: 'mp4', codec: 'avc1', width: 640, height: 360, fps: 30, durationS: 2, frames: 60 } } };
const file = () => { const d = mkdtempSync(join(tmpdir(), 'b45-')); const f = join(d, 'out.mp4'); writeFileSync(f, 'OPUS-BYTES'); return f; };
// Put back exactly the runner that was in place: the suites after this one read the real ffprobe through it.
let prior: ReturnType<typeof currentFfmpegRunner>;
beforeAll(() => { prior = currentFfmpegRunner(); });
afterEach(() => setFfmpegRunner(prior));
afterAll(() => setFfmpegRunner(prior));

describe('B45 option D: Opus-in-MP4 is re-encoded to AAC where ffmpeg runs, refused for share-ready where it does not', () => {
  it('detects Opus from the studio summary or the warning code', () => {
    expect(isOpusMp4('mp4', opusResult)).toBe(true);
    expect(isOpusMp4('mp4', { fidelity: { warnings: [{ code: 'audio_codec_opus' }] } })).toBe(true);
    expect(isOpusMp4('mp4', aacResult)).toBe(false);
    expect(isOpusMp4('webm', opusResult)).toBe(false);
  });
  it('AAC already: nothing to do', async () => {
    setFfmpegRunner(async () => ({ ok: true, stdout: '', stderr: '' }));
    expect((await deliverAacIfOpus(file(), 'mp4', aacResult, 'instagram')).action).toBe('none');
  });
  it('ffmpeg present: video copied, audio to AAC, the delivered file replaces the original, and the pre-remux hash is kept', async () => {
    const calls: string[][] = [];
    setFfmpegRunner(async (_cmd, args) => {
      calls.push(args);
      if (args[0] === '-version') return { ok: true, stdout: 'ffmpeg', stderr: '' };
      writeFileSync(args[args.length - 1], 'AAC-BYTES');
      return { ok: true, stdout: '', stderr: '' };
    });
    const f = file();
    const d = await deliverAacIfOpus(f, 'mp4', opusResult, 'web');
    expect(d.action).toBe('transcoded');
    if (d.action !== 'transcoded') return;
    expect(d.audio).toEqual({ codec: 'aac', transcodedFrom: 'opus', bitrate: '160k' });
    expect(d.preRemux.bytes).toBe(10);
    expect(readFileSync(f, 'utf8')).toBe('AAC-BYTES');
    const remux = calls.find((a) => a.includes('-c:a'))!;
    expect(remux).toContain('copy');
    expect(remux[remux.indexOf('-c:a') + 1]).toBe('aac');
  });
  it('no ffmpeg: a share-ready platform is refused by name; any other keeps the Opus file and says so', async () => {
    setFfmpegRunner(null);
    const r = await deliverAacIfOpus(file(), 'mp4', opusResult, 'instagram');
    expect(r.action).toBe('refuse');
    if (r.action === 'refuse') expect(r.message).toContain('no AAC encoder');
    const k = await deliverAacIfOpus(file(), 'mp4', opusResult, 'web');
    expect(k.action).toBe('kept-opus');
  });
  it('a failed re-encode leaves the original and, for share-ready, refuses', async () => {
    setFfmpegRunner(async (_c, args) => (args[0] === '-version' ? { ok: true, stdout: '', stderr: '' } : { ok: false, stdout: '', stderr: 'boom' }));
    const f = file();
    const r = await deliverAacIfOpus(f, 'mp4', opusResult, 'tiktok');
    expect(r.action).toBe('refuse');
    expect(readFileSync(f, 'utf8')).toBe('OPUS-BYTES');
    expect(existsSync(f.replace(/\.mp4$/, '.aac-remux.mp4'))).toBe(false);
  });
});
