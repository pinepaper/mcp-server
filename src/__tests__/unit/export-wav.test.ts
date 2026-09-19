/**
 * The soundtrack as its own export.
 *
 * `pinepaper_sound render_soundtrack` renders a WAV; this makes it reachable
 * from the tool agents already use to export, so "give me the audio" does not
 * require knowing that the sound tool also exports.
 *
 * It takes the OFFLINE renderer, not exportEngine.exportAudio. That one is
 * async, needs the videoExporter's Web Audio path, returns a Blob that cannot
 * cross page.evaluate, and downloads unless told not to. renderSoundtrackWav
 * is synchronous and returns bytes — the engine commit that added it is titled
 * "the soundtrack without Web Audio".
 *
 * The interesting case is the EMPTY one. The offline renderer bakes
 * synthesized sounds only, while the engine's sceneHasAudio() counts uploaded
 * audio files too. A scene carrying an uploaded track renders to nothing here,
 * and telling that caller "no audio" is false — they have audio, it just is not
 * the kind this path can bake.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { ALWAYS_SAVE_FORMATS, getFileExtension } from '../../tools/handlers.js';

const gen = new PinePaperCodeGenerator();
const emit = (input: Record<string, unknown>) => gen.generateAgentExport(input as any);

function run(code: string, app: Record<string, unknown>): any {
  const out = new Function('app', 'btoa', 'return eval(' + JSON.stringify(code) + ');')(
    app, (s: string) => Buffer.from(s, 'binary').toString('base64'));
  if (out === undefined) throw new Error('emitted code returned nothing — the harness is broken');
  return out;
}

const WAV = new Uint8Array([82, 73, 70, 70, 9, 9, 9, 9]);
const ok = { wav: WAV, duration: 5, sampleRate: 48000, sounds: 2, placed: 2, dropped: 0 };

describe('wav export', () => {
  it('routes through the offline renderer, not exportAudio', () => {
    const calls: unknown[][] = [];
    const out = run(emit({ format: 'wav', duration: 5 }), {
      renderSoundtrackWav: (...a: unknown[]) => { calls.push(a); return ok; },
      exportEngine: { exportAudio: () => { throw new Error('exportAudio must not be reached'); } },
    });
    expect(calls.length).toBe(1);
    expect(out.success).toBe(true);
    expect(out.format).toBe('wav');
    expect(out.data.startsWith('data:audio/wav;base64,')).toBe(true);
    expect(Buffer.from(out.data.split(',')[1], 'base64')).toEqual(Buffer.from(WAV));
  });

  it('passes duration, sampleRate and bitDepth through', () => {
    const calls: unknown[][] = [];
    run(emit({ format: 'wav', duration: 12, sampleRate: 44100, bitDepth: 32 }), {
      renderSoundtrackWav: (...a: unknown[]) => { calls.push(a); return ok; },
    });
    expect(calls[0]![0]).toEqual({ duration: 12, sampleRate: 44100, bitDepth: 32 });
  });

  it('is never what "auto" resolves to — it has to be asked for', () => {
    // No platform preset names wav, and a picture request must not silently
    // come back as audio.
    for (const platform of ['instagram', 'youtube', 'twitter', 'web', 'print-a4']) {
      const code = emit({ platform, format: 'auto' });
      expect(code, `${platform} auto-resolved to wav`).not.toContain('renderSoundtrackWav');
    }
  });

  it('says WHY it is empty — uploaded audio is not "no audio"', () => {
    const out = run(emit({ format: 'wav' }), {
      renderSoundtrackWav: () => null,
      exportEngine: { sceneHasAudio: () => true },
    });
    expect(out.success).toBe(false);
    expect(out.sceneHasAudio).toBe(true);
    expect(out.error).toContain('uploaded');
    // And it routes: the audio IS exportable, just not down this path.
    expect(out.error).toMatch(/mp4|webm/);
  });

  it('and gives the other answer when there is genuinely nothing', () => {
    const out = run(emit({ format: 'wav' }), {
      renderSoundtrackWav: () => null,
      exportEngine: { sceneHasAudio: () => false },
    });
    expect(out.success).toBe(false);
    expect(out.error).toContain('no synthesized sounds');
    expect(out.error).toMatch(/pinepaper_sound/);
  });

  it('falls back to the generic answer when the predicate is absent', () => {
    // An older studio with no sceneHasAudio must not be reported as either
    // case — unknown is not the same as empty.
    const out = run(emit({ format: 'wav' }), { renderSoundtrackWav: () => null, exportEngine: {} });
    expect(out.success).toBe(false);
    expect(out.sceneHasAudio).toBeNull();
    expect(out.error).not.toContain('uploaded');
  });

  it('marks a mix that dropped sounds, and stays quiet otherwise', () => {
    const dropped = run(emit({ format: 'wav' }), {
      renderSoundtrackWav: () => ({ ...ok, sounds: 5, placed: 3, dropped: 2 }),
    });
    expect(dropped.dropped).toBe(2);
    expect(dropped.incomplete).toContain('2 could not be rendered');

    const clean = run(emit({ format: 'wav' }), { renderSoundtrackWav: () => ok });
    expect(clean.dropped).toBeUndefined();
    expect(clean.incomplete).toBeUndefined();
  });

  it('refuses a studio without the renderer by name, and names the alternative', () => {
    const out = run(emit({ format: 'wav' }), {});
    expect(out.success).toBe(false);
    expect(out.error).toContain('renderSoundtrackWav');
    expect(out.error).toMatch(/mp4|webm/);
  });

  it('estimates EXACTLY, because PCM size is arithmetic', () => {
    const out = run(emit({ format: 'wav', duration: 10, sampleRate: 48000, bitDepth: 16, estimateOnly: true }), {
      renderSoundtrackWav: () => { throw new Error('estimate must render nothing'); },
    });
    expect(out.estimateOnly).toBe(true);
    expect(out.confidence).toBe('exact');
    // 44-byte header + 48000 * 2 bytes * 1 channel * 10s
    expect(out.bytes).toBe(44 + 48000 * 2 * 10);
  });
});

describe('wav rejects the knobs that do not apply to it', () => {
  it('framing: camera, because it renders no frames', () => {
    expect(() => AgentExportInputSchema.parse({ format: 'wav', framing: 'camera' })).toThrow();
    expect(() => AgentExportInputSchema.parse({ format: 'wav', framing: 'canvas' })).not.toThrow();
  });

  it('sampleRate / bitDepth on a visual format', () => {
    // Silently dropping them would leave a caller believing something about
    // the output that is not true.
    expect(() => AgentExportInputSchema.parse({ format: 'mp4', sampleRate: 44100 })).toThrow();
    expect(() => AgentExportInputSchema.parse({ format: 'png', bitDepth: 32 })).toThrow();
    expect(() => AgentExportInputSchema.parse({ format: 'wav', sampleRate: 44100, bitDepth: 32 })).not.toThrow();
  });

  it('but keeps the shared duration ceiling', () => {
    expect(() => AgentExportInputSchema.parse({ format: 'wav', duration: 600 })).not.toThrow();
    expect(() => AgentExportInputSchema.parse({ format: 'wav', duration: 601 })).toThrow();
  });

  it('the served enum and the Zod enum agree, and both carry wav', () => {
    const served = (PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_agent_export')
      ?.inputSchema as any)?.properties?.format?.enum as string[];
    expect(served).toContain('wav');
    let node: any = AgentExportInputSchema;
    for (let i = 0; i < 16 && node && !node.shape; i++) node = node._def?.schema ?? node._def?.innerType;
    expect(node?.shape?.format, 'could not reach the format union').toBeTruthy();
    // Walk .optional().default() rather than reaching a fixed depth: the
    // options live on the innermost union, and a hard-coded path breaks
    // silently the moment a modifier is added to the field.
    let field: any = node.shape.format;
    for (let i = 0; i < 8 && field && !field._def?.options; i++) field = field._def?.innerType;
    expect(field?._def?.options, 'could not reach the format union options').toBeTruthy();
    const zodVals = field._def.options.flatMap((o: any) => o._def.values ?? [o._def.value]);
    expect([...served].sort()).toEqual([...zodVals].filter((v: string) => v !== 'auto').sort());
  });
});

describe('wav reaches the file, not the response body', () => {
  it('is an ALWAYS-SAVE format', () => {
    // Nothing tested this set before, which is why planting a removal of wav
    // from it was the one defect the rest of this file missed. A minute of
    // 48kHz 16-bit is ~5.8 MB of base64; the ten minutes the schema allows is
    // ~77 MB. The size threshold would catch most of it, but "most" is the
    // wrong guarantee for a format that is never small.
    expect(ALWAYS_SAVE_FORMATS.has('wav')).toBe(true);
    // The formats that are never small, together — a removal from any of them
    // is the same bug.
    for (const f of ['mp4', 'webm', 'gif', 'pdf', 'wav']) {
      expect(ALWAYS_SAVE_FORMATS.has(f), `${f} would be returned inline`).toBe(true);
    }
    // And svg stays out: it is text, and small enough to read in place.
    expect(ALWAYS_SAVE_FORMATS.has('svg')).toBe(false);
  });

  it('gets a .wav extension rather than falling through to the raw format', () => {
    expect(getFileExtension('wav')).toBe('wav');
  });
});
