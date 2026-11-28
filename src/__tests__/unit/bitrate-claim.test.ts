/**
 * bitrateCeilingHeld: true on files 7% over the ceiling (tester, 1.6.36): the studio counts anything within 10% over
 * as held. The server sets the flag from the numbers beside it.
 */
import { describe, it, expect } from 'bun:test';
import { correctBitrateClaim } from '../../tools/handlers.js';

describe('a held-ceiling claim is checked against the achieved bitrate', () => {
  it('7% over: held becomes false, with the percentage and a warning', () => {
    const r: any = { video: { bitrate: 1_000_000, achievedBitrate: 1_077_502, bitrateCeilingHeld: true }, warnings: ['other'] };
    correctBitrateClaim(r);
    expect(r.video.bitrateCeilingHeld).toBe(false);
    expect(r.video.bitrateOverPercent).toBe(7.8);
    expect(r.warnings[1]).toContain('bitrate_exceeded: the 1.00 Mbps target was not held: the file is 1.08 Mbps (7.8% over)');
  });

  it('at or under the target, or with no claim, nothing changes', () => {
    const under: any = { video: { bitrate: 1_000_000, achievedBitrate: 990_000, bitrateCeilingHeld: true } };
    correctBitrateClaim(under);
    expect(under.video.bitrateCeilingHeld).toBe(true);
    expect(under.warnings).toBeUndefined();
    const none: any = { video: { bitrate: 1_000_000, achievedBitrate: 2_000_000 } };
    correctBitrateClaim(none);
    expect(none.video.bitrateCeilingHeld).toBeUndefined();
    correctBitrateClaim(null);
  });
});

describe('BITRATE34: the reply says which encoder made the file', () => {
  it('puts codec, hardware acceleration and bitrate mode together, and names them in bitrate_exceeded', async () => {
    const { noteEncoderRan } = await import('../../tools/handlers.js');
    const r: any = { video: { encode: { codec: 'avc1.640028' }, hardwareAcceleration: 'prefer-hardware', bitrateMode: 'variable', bitrateCeilingHeld: false,
      warnings: [{ code: 'bitrate_exceeded', message: 'the 1.00 Mbps target was exceeded.' }] }, warnings: ['bitrate_exceeded: over.'] };
    noteEncoderRan(r);
    expect(r.video.encoderRan).toEqual({ codec: 'avc1.640028', hardwareAcceleration: 'prefer-hardware', bitrateMode: 'variable' });
    expect(r.video.warnings[0].message).toContain('The encoder that ran: avc1.640028, hardwareAcceleration prefer-hardware');
    expect(r.warnings[0]).toContain('The encoder that ran');
  });
  it('leaves a result without encoder data alone', async () => {
    const { noteEncoderRan } = await import('../../tools/handlers.js');
    const r: any = { video: { bitrate: 1 } };
    noteEncoderRan(r);
    expect(r.video.encoderRan).toBeUndefined();
  });
});

describe('bitrate_exceeded advice is true of the encoder that ran (BITREC170)', () => {
  const engine = "the 1.00 Mbps target was exceeded: the file is 1.50 Mbps (50% over). This browser's avc1 encoder does not hold its target on content it cannot compress (noise, grain, fine moving detail). To land under it: pass a bitrate about 67% of this one, or bitrateMode: 'constant', which held VP9 closer; or bitrateMode: 'quantizer' with a higher quantizer; or enforceBitrate: true (with deterministic: false), which asks the exporter to try to hold the cap from a probe of the first frames; or re-encode (e.g. ffmpeg -b:v with -maxrate/-bufsize).";
  it("H.264: the studio's three prescriptions are replaced, once", async () => {
    const { noteEncoderRan } = await import('../../tools/handlers.js');
    const r: any = { video: { bitrateCeilingHeld: false, bitrateMode: 'variable', encode: { codec: 'avc1.640028' }, warnings: [{ code: 'bitrate_exceeded', message: engine }] } };
    noteEncoderRan(r);
    noteEncoderRan(r);
    const m: string = r.video.warnings[0].message;
    expect(m).toContain('the file is 1.50 Mbps (50% over)');
    expect(m).not.toContain('To land under it');
    expect(m).not.toContain("bitrateMode: 'quantizer'");
    expect(m).not.toContain('which held VP9 closer');
    expect(m.match(/On this browser's H\.264 encoder/g)).toHaveLength(1);
    expect(m).toContain('fewer pixels (scale)');
    expect(m.match(/The encoder that ran/g)).toHaveLength(1);
  });
  it('the server-made warning no longer recommends constant mode', async () => {
    const { correctBitrateClaim, noteEncoderRan } = await import('../../tools/handlers.js');
    const r: any = { video: { bitrate: 1_000_000, achievedBitrate: 1_078_000, bitrateCeilingHeld: true, encode: { codec: 'avc1.640028' } }, warnings: [] };
    correctBitrateClaim(r);
    noteEncoderRan(r);
    expect(r.warnings[0]).not.toContain('held closer in measurement');
    expect(r.warnings[0].match(/On this browser's H\.264 encoder/g)).toHaveLength(1);
  });
});
