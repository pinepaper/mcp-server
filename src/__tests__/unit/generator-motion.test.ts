/**
 * pinepaper_motion — the generators' Animation knob, pointed at anything.
 *
 * The motion engine behind every generator's own animation was reachable from
 * the code console and from custom generators, and from no tool. The field
 * motions in particular have no equivalent anywhere else on this surface:
 * pinepaper_animate applies a loop preset to ONE item, and nothing could sweep
 * a crest through a group's children.
 *
 * Verified against FxTool origin/main (animateItems, listGeneratorMotions).
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MotionInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = (input: Record<string, unknown>) =>
  codeGenerator.generateMotion(MotionInputSchema.parse(input));

describe('list', () => {
  it('asks the engine for its own catalogue rather than restating one', () => {
    // The names come from the engine. An enum here would be a second copy of a
    // list that moves, which is the drift this repo keeps paying for.
    const code = gen({ action: 'list' });
    expect(code).toContain('app.listGeneratorMotions()');
    expect(code).toContain('update FxTool');
    expect(() => new Function(code)).not.toThrow();
  });
});

describe('apply', () => {
  it('sends a single item straight through', () => {
    const code = gen({ action: 'apply', itemId: 'g1', motion: 'ripple' });
    expect(code).toContain('app.animateItems("g1", {"animation":"ripple"})');
  });

  it('sends several items as an array — the engine groups them itself', () => {
    // The members keep their own identity and ids; the group is only the
    // motion's host.
    const code = gen({ action: 'apply', itemIds: ['a', 'b', 'c'], motion: 'breathe' });
    expect(code).toContain('app.animateItems(["a","b","c"]');
  });

  it('passes every knob under the name the engine reads', () => {
    const code = gen({
      action: 'apply', itemId: 'g1', motion: 'ripple',
      speed: 1.2, intensity: 0.3, waveform: 'spike', origin: 'roam', seed: 7,
    });
    for (const frag of ['"animation":"ripple"', '"speed":1.2', '"intensity":0.3', '"waveform":"spike"', '"origin":"roam"', '"seed":7']) {
      expect(code).toContain(frag);
    }
  });

  it('omits knobs that were not asked for, rather than sending defaults', () => {
    // Sending an explicit undefined-equivalent would override the engine's own
    // default with ours, which is how two sources of truth start.
    const code = gen({ action: 'apply', itemId: 'g1', motion: 'drift' });
    for (const absent of ['speed', 'intensity', 'waveform', 'origin', 'seed']) {
      expect(code).not.toContain(`"${absent}"`);
    }
  });

  it('reads the engine\'s `error` key, and carries the known list back with it', () => {
    // animateItems returns {error, motions} — NOT {ok:false, reason} like the
    // path facades. Reading the wrong key turns 'Unknown motion "wobbel".
    // Known: …' into undefined, and drops the list that lets a caller correct
    // itself without a second round trip.
    const code = gen({ action: 'apply', itemId: 'g1', motion: 'drift' });
    expect(code).toContain('r.error');
    expect(code).toContain('motions: r && r.motions');
    expect(code).not.toContain('r.reason');
  });
});

describe('the enums match the engine', () => {
  it('offers the five waveforms, and not the retired name as a choice', () => {
    // WAVEFORMS is sine/triangle/square/sawtooth/spike, and WAVEFORM_NAMES
    // filters 'pulse' out: one word was naming both a waveform and an
    // animation. Saved scenes still carry 'pulse' and the engine still accepts
    // it on the way in — but it is not offered, because one name per shape.
    for (const w of ['sine', 'triangle', 'square', 'sawtooth', 'spike']) {
      expect(MotionInputSchema.safeParse({ action: 'apply', itemId: 'a', motion: 'ripple', waveform: w }).success).toBe(true);
    }
    expect(MotionInputSchema.safeParse({ action: 'apply', itemId: 'a', motion: 'ripple', waveform: 'pulse' }).success).toBe(false);
  });

  it('offers every origin the engine has, including the two that are not places', () => {
    const origins = ['center', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight', 'left', 'right', 'top', 'bottom', 'random', 'roam'];
    for (const o of origins) {
      expect(MotionInputSchema.safeParse({ action: 'apply', itemId: 'a', motion: 'ripple', origin: o }).success).toBe(true);
    }
    expect(MotionInputSchema.safeParse({ action: 'apply', itemId: 'a', motion: 'ripple', origin: 'middle' }).success).toBe(false);
  });

  it('leaves `motion` a free string — the catalogue is the engine\'s', () => {
    // Deliberately NOT an enum. Pinning motion names here is exactly how the
    // relation enum came to list 39 of 134.
    expect(MotionInputSchema.safeParse({ action: 'apply', itemId: 'a', motion: 'something_new' }).success).toBe(true);
  });
});

describe('the schema refuses an incomplete call', () => {
  it('apply needs a target and a motion', () => {
    const noTarget = MotionInputSchema.safeParse({ action: 'apply', motion: 'ripple' });
    expect(noTarget.success).toBe(false);

    const noMotion = MotionInputSchema.safeParse({ action: 'apply', itemId: 'a' });
    expect(noMotion.success).toBe(false);
    if (!noMotion.success) expect(JSON.stringify(noMotion.error.issues)).toContain("action 'list'");

    expect(MotionInputSchema.safeParse({ action: 'list' }).success).toBe(true);
  });
});

describe('the tool distinguishes itself from pinepaper_animate', () => {
  it('says which one moves a group and which moves an item', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_motion')!;
    expect(tool.description).toContain('GROUP motions');
    expect(tool.description).toContain('FIELD motions');
    expect(tool.description).toContain('not pinepaper_animate');
  });
});
