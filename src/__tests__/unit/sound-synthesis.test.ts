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
    // The id is read into _sid first now, so a placement can be applied to it
    // in the same call — see the startTime test below.
    expect(code).toContain('const _sid = item.data && item.data.id');
    expect(code).toContain('itemId: _sid');
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

describe('a cue is one call, not two', () => {
  it('applies visual.startTime at create instead of needing set_placement', () => {
    // startTime and duration were stripped from `visual`, so every cue took a
    // create AND a set_placement — a pilot made 160 calls where 80 would do.
    const code = gen({ action: 'create', spec: { partials: [{ h: 1, amp: 1 }] }, visual: { width: 400, startTime: 2.5, duration: 0.4 } });
    expect(code).toContain('app.setSoundPlacement');
    expect(code).toContain('"startTime":2.5');
    expect(code).toContain('"duration":0.4');
    // The timing must not leak into the waveform's own geometry options.
    const create = code.slice(code.indexOf('app.createSound('), code.indexOf('if (!item)'));
    expect(create).not.toContain('startTime');
    expect(create).toContain('"width":400');
  });

  it('does not place anything when no timing was given', () => {
    // Comments stripped: the emitted code explains WHY placement exists and
    // names setSoundPlacement in prose, which would satisfy a naive search.
    const code = gen({ action: 'create', spec: { partials: [{ h: 1, amp: 1 }] }, visual: { width: 400 } })
      .split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    expect(code).not.toContain('setSoundPlacement');
  });
});

/**
 * A whole music bed in one call.
 *
 * Every cue was create + set_placement, so a 112-cue bed cost 112 round trips
 * once visual.startTime landed, and 224 before it. Nothing about the work needs
 * a trip each: the cues are independent, differ only in time and spec, and the
 * page can loop.
 */
describe('sequence places a whole bed in one call', () => {
  const seq = (cues: unknown[]): string => gen({ action: 'sequence', cues } as never);

  it('loops the cues in the page instead of one call each', () => {
    const code = seq([{ t: 0, spec: { partials: [{ h: 1, amp: 1 }] } }, { t: 1.5, preset: 'kick' }]);
    expect(code).toContain('for (let i = 0');
    expect(code).toContain('app.createSound');
    expect(code).toContain('app.setSoundPlacement');
  });

  it('places each cue at its own time', () => {
    const code = seq([{ t: 2.25, preset: 'snare' }]);
    expect(code).toContain('"t":2.25');
    expect(code).toContain('startTime: c.t');
  });

  it('accepts a preset instead of a spec', () => {
    expect(seq([{ t: 0, preset: 'kick', note: 'A2' }])).toContain('"preset":"kick"');
  });

  it('reports WHICH cues failed, not just that some did', () => {
    // A bed where three of 112 failed is neither a success nor a failure; the
    // caller needs the indices to fix it.
    const code = seq([{ t: 0, preset: 'kick' }]);
    expect(code).toContain('failed.push({ index: i');
    expect(code).toContain('see failed[] for which');
  });

  it('refuses a cue with neither spec nor preset rather than skipping it quietly', () => {
    expect(seq([{ t: 0 }])).toContain('neither spec nor preset');
  });

  it('emits valid JavaScript', () => {
    const code = seq([{ t: 0, preset: 'kick' }, { t: 1, spec: { partials: [{ h: 2, amp: 0.5 }] } }]);
    expect(() => new Function(`return (function(app){ ${code} });`)).not.toThrow();
  });
});
