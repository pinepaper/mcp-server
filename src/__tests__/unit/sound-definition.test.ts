/**
 * Defining an instrument, and rendering the soundtrack.
 *
 * FxTool gained five audio facade methods after this server's sound tool was
 * written — registerInstrument / registerPercussion / registerSfx, exportAudio
 * and renderSoundtrackWav. The tool could list and play the seventeen built-in
 * sounds and nothing else, so "a rhodes" or "a taiko" was unreachable even
 * though the engine's own comment says the tables are "a curated starting set,
 * not a claim that music contains six instruments".
 *
 * Two silent refusals come with the render path and both are handled here:
 * renderSoundtrackWav returns bare `null` for a scene with no placed sounds,
 * and returns a perfectly valid WAV when some sounds were dropped from the mix.
 * The second is the harder one — it is a success that is quietly incomplete,
 * the same shape as an item list capped below its own itemCount.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { SoundInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = new PinePaperCodeGenerator();

const CATALOGUE = readFileSync(join(import.meta.dir, '..', 'fixtures', 'engine-sound-catalogue.txt'), 'utf-8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [kind, name] = l.split(/\s+/); return { kind: kind!, name: name! }; });

/** Execute emitted browser code against a stub engine. */
function run(code: string, app: Record<string, unknown>): any {
  // eval, not `'return ' + code`: every emitter opens with a // comment and
  // ASI would end the statement, returning undefined for every case.
  const out = new Function('app', 'btoa', 'return eval(' + JSON.stringify(code) + ');')(
    app, (s: string) => Buffer.from(s, 'binary').toString('base64'));
  if (out === undefined) throw new Error('emitted code returned nothing — the harness is broken');
  return out;
}

const emit = (input: Record<string, unknown>) => gen.generateSound(SoundInputSchema.parse(input) as any);

describe('defining a sound at runtime', () => {
  it('the fixture holds the engine built-ins', () => {
    expect(CATALOGUE.filter((c) => c.kind === 'instrument').length).toBe(6);
    expect(CATALOGUE.filter((c) => c.kind === 'percussion').length).toBe(5);
    expect(CATALOGUE.filter((c) => c.kind === 'sfx').length).toBe(6);
  });

  it('reaches registerInstrument with the spec assembled from flat fields', () => {
    const calls: unknown[][] = [];
    const out = run(emit({
      action: 'define_instrument', name: 'rhodes',
      partials: [{ h: 1, amp: 1 }, { h: 2, amp: 0.4 }],
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.6, release: 0.8 },
      gain: 0.7, aliases: ['electric piano'],
    }), {
      registerInstrument: (...a: unknown[]) => { calls.push(a); return 'rhodes'; },
      listInstruments: () => [{ name: 'rhodes', label: 'Rhodes' }],
    });
    expect(calls[0]![0]).toBe('rhodes');
    const spec = calls[0]![1] as any;
    expect(spec.partials).toEqual([{ h: 1, amp: 1 }, { h: 2, amp: 0.4 }]);
    expect(spec.envelope.sustain).toBe(0.6);
    expect(spec.aliases).toEqual(['electric piano']);
    expect(out.success).toBe(true);
  });

  it('returns the CANONICAL name, because that is the one that plays', () => {
    // The engine lowercases and normalises. A model that registers 'Rhodes'
    // and then plays 'Rhodes' is naming something that does not exist.
    const out = run(emit({ action: 'define_instrument', name: 'Rhodes', partials: [{ h: 1, amp: 1 }] }), {
      registerInstrument: () => 'rhodes',
      listInstruments: () => [{ name: 'rhodes' }],
    });
    expect(out.canonicalName).toBe('rhodes');
    expect(out.requestedName).toBe('Rhodes');
    expect(out.normalised).toBe(true);
    expect(out.listed).toBe(true);
  });

  it('carries the pitch glide, which is what makes a kick a kick', () => {
    // The engine's own note: "The pitch glide IS the drum -- dropping it turns
    // a kick into a beep." It is the parameter most likely to be cut by reflex.
    const calls: unknown[][] = [];
    run(emit({
      action: 'define_percussion', name: 'taiko', noise: 0.2,
      pitch: { from: 120, tau: 0.08 }, hz: 60,
    }), {
      registerPercussion: (...a: unknown[]) => { calls.push(a); return 'taiko'; },
      listPercussion: () => [{ name: 'taiko' }],
    });
    expect((calls[0]![1] as any).pitch).toEqual({ from: 120, tau: 0.08 });
    expect((calls[0]![1] as any).hz).toBe(60);
  });

  it("surfaces the engine's own refusal instead of a bare bridge error", () => {
    const out = run(emit({ action: 'define_sfx', name: 'ghost', noise: 0.5 }), {
      registerSfx: () => { throw new Error("registerSfx('ghost'): needs a partial table or noise > 0"); },
      listSfx: () => [],
    });
    expect(out.success).toBe(false);
    expect(out.error).toContain('needs a partial table or noise');
  });

  it('reports whether the defined sound is actually listed', () => {
    // Defined but unlistable would be a capability nobody can name. The engine
    // reads the live table so it should always be true — asserted rather than
    // assumed, because it is one lookup and the alternative is invisible.
    const out = run(emit({ action: 'define_sfx', name: 'clang', noise: 0.6 }), {
      registerSfx: () => 'clang',
      listSfx: () => [{ name: 'beep' }],
    });
    expect(out.listed).toBe(false);
  });
});

describe('rendering the soundtrack', () => {
  const WAV = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4]);

  it('returns base64 bytes and the mix report', () => {
    const out = run(emit({ action: 'render_soundtrack', sampleRate: 44100, bitDepth: 16 }), {
      renderSoundtrackWav: () => ({ wav: WAV, duration: 4, sampleRate: 44100, sounds: 3, placed: 3, dropped: 0 }),
    });
    expect(out.success).toBe(true);
    expect(Buffer.from(out.wavBase64, 'base64')).toEqual(Buffer.from(WAV));
    expect(out.byteLength).toBe(8);
    expect(out.placed).toBe(3);
  });

  it('names the empty scene instead of reporting a failed export', () => {
    // renderSoundtrackWav returns bare null when nothing is placed. "The export
    // produced nothing" sends someone to debug the exporter; the real answer
    // sends them to place a sound.
    const out = run(emit({ action: 'render_soundtrack' }), { renderSoundtrackWav: () => null });
    expect(out.success).toBe(false);
    expect(out.error).toContain('no sounds are placed');
    expect(out.error).toMatch(/create|set_placement/);
  });

  it('marks a mix that dropped sounds — a valid WAV that is quietly incomplete', () => {
    const out = run(emit({ action: 'render_soundtrack' }), {
      renderSoundtrackWav: () => ({ wav: WAV, duration: 4, sampleRate: 48000, sounds: 5, placed: 3, dropped: 2 }),
    });
    expect(out.success).toBe(true);
    expect(out.dropped).toBe(2);
    expect(out.incomplete).toContain('2 could not be rendered');
  });

  it('stays silent when nothing was dropped', () => {
    // A marker that is always present is noise, and a model that learns to
    // ignore it is worse off than before.
    const out = run(emit({ action: 'render_soundtrack' }), {
      renderSoundtrackWav: () => ({ wav: WAV, duration: 1, sampleRate: 48000, sounds: 1, placed: 1, dropped: 0 }),
    });
    expect(out.dropped).toBeUndefined();
    expect(out.incomplete).toBeUndefined();
  });

  it('refuses a missing facade by name rather than throwing', () => {
    const out = run(emit({ action: 'render_soundtrack' }), {});
    expect(out.success).toBe(false);
    expect(out.error).toContain('renderSoundtrackWav');
  });
});

describe('the schema mirrors the engine rules rather than tightening them', () => {
  it('an instrument without partials is refused — it would render silence', () => {
    expect(() => SoundInputSchema.parse({ action: 'define_instrument', name: 'x' })).toThrow();
  });

  it('but percussion may be PURE NOISE, because a hat is', () => {
    // Tightening this to "partials always" would refuse the sound the
    // relaxation exists for.
    expect(() => SoundInputSchema.parse({ action: 'define_percussion', name: 'hat2', noise: 0.9 })).not.toThrow();
    expect(() => SoundInputSchema.parse({ action: 'define_sfx', name: 'gust', noise: 0.5 })).not.toThrow();
    expect(() => SoundInputSchema.parse({ action: 'define_percussion', name: 'dead' })).toThrow();
  });

  it('defining requires a name', () => {
    expect(() => SoundInputSchema.parse({ action: 'define_sfx', noise: 0.5 })).toThrow();
  });

  it('the served enum and the Zod enum agree', () => {
    const served = (PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_sound')
      ?.inputSchema as any)?.properties?.action?.enum as string[];
    // Walk the ZodEffects wrappers the refinements add — seven of them here,
    // so any fixed-depth lookup finds nothing and the test would skip itself.
    let node: any = SoundInputSchema;
    for (let i = 0; i < 16 && node && !node.shape; i++) node = node._def?.schema ?? node._def?.innerType;
    expect(node?.shape?.action, 'could not reach the action enum').toBeTruthy();
    expect([...served].sort()).toEqual([...node.shape.action._def.values].sort());
    for (const a of ['define_instrument', 'define_percussion', 'define_sfx', 'render_soundtrack']) {
      expect(served).toContain(a);
    }
  });
});
