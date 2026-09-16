/**
 * pinepaper_sound — synthesis, and the drawing that is the same object.
 *
 * The engine carries a whole audio graph and nothing reached it.
 * pinepaper_audio_beats analyses audio that already exists; this makes audio.
 *
 * The part that earns the tool is the two-way bridge: `create` draws a sound
 * AS a waveform path, and `timbre_from_path` reads any drawn path back as
 * harmonic content. A curve someone drew by hand becomes the partials of a
 * note, and editing the path changes the sound — it is not a picture of the
 * sound, it is the sound.
 *
 * Verified against FxTool origin/main.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { SoundInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = (input: Record<string, unknown>) =>
  codeGenerator.generateSound(SoundInputSchema.parse(input));

describe('every action reaches its own facade, guarded', () => {
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ action: 'list_instruments' }, 'app.listInstruments()'],
    [{ action: 'list_percussion' }, 'app.listPercussion()'],
    [{ action: 'list_sfx' }, 'app.listSfx()'],
    [{ action: 'play_tone', note: 'A4' }, 'app.playTone("A4", {})'],
    [{ action: 'play_chord', root: 'C4', chord: 'maj7' }, 'app.playChord("C4", "maj7", {})'],
    [{ action: 'chord_frequencies', root: 'C4' }, 'app.chordFrequencies("C4", "major", {})'],
    [{ action: 'play_percussion', name: 'kick' }, 'app.playPercussion("kick", {})'],
    [{ action: 'play_sfx', name: 'whoosh' }, 'app.playSfx("whoosh", {})'],
    [{ action: 'play_spec', spec: { partials: [] } }, 'app.playSound({"partials":[]})'],
    [{ action: 'play_from_text', text: 'a soft bell' }, 'app.playSoundFromText("a soft bell")'],
    [{ action: 'from_text', text: 'a soft bell' }, 'app.buildSoundFromText("a soft bell")'],
    [{ action: 'create' }, 'app.createSound({}, {})'],
    [{ action: 'timbre_from_path', itemId: 'p1' }, 'app.timbreFromPath(item, 256)'],
    [{ action: 'set_placement', itemId: 's1', placement: { at: 2 } }, 'app.setSoundPlacement("s1", {"at":2})'],
    [{ action: 'remove', itemId: 's1' }, 'app.removeSound("s1")'],
    [{ action: 'stop_all' }, 'app.stopSounds()'],
  ];

  for (const [input, call] of cases) {
    it(`${input.action} → ${call.split('(')[0]}`, () => {
      const code = gen(input);
      expect(code).toContain(call);
      expect(code).toContain('update FxTool');
      expect(() => new Function(code)).not.toThrow();
    });
  }
});

describe('the two-way bridge between a sound and a path', () => {
  it('create returns the item id, because the item IS the sound', () => {
    const code = gen({ action: 'create', spec: { partials: [{ h: 1, amp: 1 }] }, visual: { width: 400 } });
    expect(code).toContain('"width":400');
    expect(code).toContain('itemId: item.data && item.data.id');
    // A spec that draws nothing is a failure, not an empty success.
    expect(code).toContain('produced no waveform path');
  });

  it('refuses a non-path BEFORE the call, because the engine cannot', () => {
    // timbreFromPath answers a flat {partials:[{h:1,amp:1}]} for anything that
    // is not a path with length. That is a legitimate timbre AND the refusal,
    // and they are indistinguishable once returned — so the check happens here.
    const code = gen({ action: 'timbre_from_path', itemId: 'p1' });
    expect(code).toContain("typeof item.getPointAt !== 'function'");
    expect(code).toContain('item.length > 0');
    expect(code).toContain('timbre needs a path with length');
    // And a missing item is its own, different message.
    expect(code).toContain('no such item');
  });

  it('honours an explicit sample count', () => {
    expect(gen({ action: 'timbre_from_path', itemId: 'p1', samples: 1024 })).toContain('app.timbreFromPath(item, 1024)');
  });
});

describe('reading without playing', () => {
  it('from_text resolves a description to a spec and does not play it', () => {
    const code = gen({ action: 'from_text', text: 'a soft warm bell on A4' });
    expect(code).toContain('app.buildSoundFromText');
    expect(code).not.toContain('playSoundFromText');
    // An unreadable description comes back empty rather than throwing; saying
    // so beats handing back a spec that plays silence.
    expect(code).toContain('could not resolve');
  });

  it('chord_frequencies returns Hz rather than making a sound', () => {
    const code = gen({ action: 'chord_frequencies', root: 'C4', chord: 'dim' });
    expect(code).toContain('frequencies:');
    expect(code).not.toContain('playChord');
  });
});

describe('the schema refuses an incomplete call by naming the field', () => {
  it('names what each action needs', () => {
    const bad: Array<[Record<string, unknown>, string]> = [
      [{ action: 'play_tone' }, 'note'],
      [{ action: 'play_chord' }, 'root'],
      [{ action: 'chord_frequencies' }, 'root'],
      [{ action: 'play_percussion' }, 'name'],
      [{ action: 'play_sfx' }, 'name'],
      [{ action: 'from_text' }, 'text'],
      [{ action: 'play_from_text' }, 'text'],
      [{ action: 'play_spec' }, 'spec'],
      [{ action: 'timbre_from_path' }, 'itemId'],
      [{ action: 'set_placement', itemId: 'a' }, 'placement'],
      [{ action: 'remove' }, 'itemId'],
    ];
    for (const [input, field] of bad) {
      const r = SoundInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
  });

  it('the catalogues and stop_all need nothing', () => {
    for (const action of ['list_instruments', 'list_percussion', 'list_sfx', 'stop_all', 'create']) {
      expect(SoundInputSchema.safeParse({ action }).success).toBe(true);
    }
  });

  it('a chord kind defaults rather than being guessed at by the caller', () => {
    const parsed = SoundInputSchema.parse({ action: 'play_chord', root: 'C4' });
    expect(parsed.chord).toBe('major');
  });
});

describe('the tool says what it is not', () => {
  it('distinguishes itself from audio_beats, which analyses rather than makes', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_sound')!;
    expect(tool.description).toContain('ANALYSES');
    expect(tool.description).toContain('MAKES audio');
    expect(tool.description).toContain('it is the sound');
  });
});
