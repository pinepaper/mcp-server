/**
 * Stitchcraft: the tool that was removed, and where its capability went.
 *
 * `pinepaper_create_stitchcraft` was built on `app.applyStitchcraftToItem`,
 * which does not exist anywhere in the engine — zero hits on FxTool's
 * origin/main. Every real call fell through to a fallback that forwarded
 * colour, width and count and dropped preset, roughness, bowing, sheen and
 * seed, then reported success with the preset it had not rendered. It also
 * advertised `roughness` and `bowing`, and the engine has no such option
 * anywhere; four of its six presets were renames of stitches
 * `pinepaper_design_medium` already offered through the method that does exist.
 *
 * A tool whose primary path calls a phantom is the same defect as a tool
 * nothing dispatches, one layer down — so it is gone, and the one genuinely new
 * idea in it (hand wobble, applied to the group after the engine lays the
 * stitches) moved to `apply_thread`, where the rest of the thread vocabulary
 * already lives.
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { codeGenerator } from '../../types/code-generator.js';
import { DesignMediumInputSchema } from '../../types/schemas.js';
import { PP_VOCABULARY } from '../../ontology/vocabulary.js';

describe('the phantom tool is gone, everywhere', () => {
  it('is not served', () => {
    expect(PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_stitchcraft')).toBeUndefined();
  });

  it('leaves no emitter behind', () => {
    expect((codeGenerator as unknown as Record<string, unknown>).generateStitchcraft).toBeUndefined();
  });

  it('and nothing emits the method that never existed', () => {
    // applyStitchcraftToItem: zero hits in the engine, so any reference here
    // is a call into nothing.
    const gen = codeGenerator as unknown as Record<string, unknown>;
    for (const key of Object.keys(Object.getPrototypeOf(gen) as object)) {
      if (typeof (gen as Record<string, unknown>)[key] !== 'function') continue;
    }
    expect(JSON.stringify(PINEPAPER_TOOLS)).not.toContain('applyStitchcraftToItem');
  });
});

describe('the capability lives in apply_thread, with more of the engine than before', () => {
  const gen = (input: Record<string, unknown>) =>
    codeGenerator.generateDesignMedium(DesignMediumInputSchema.parse(input) as never);

  it('offers the engine\'s real stitch set, not an embroidery rename of part of it', () => {
    // ThreadPainting ships satin, satinBetween, seed, seedFill, stem,
    // stemAlong, flow, radial, fillRegion, spine, constant.
    for (const stitch of ['satin', 'satinBetween', 'seed', 'seedFill', 'stem', 'stemAlong', 'flow', 'radial', 'fillRegion', 'spine', 'constant', 'longAndShort']) {
      expect(DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch }).success).toBe(true);
    }
    // The two embroidery names the engine has no mark for stay refused rather
    // than silently mapping onto something else.
    for (const absent of ['cross_stitch', 'running_seam']) {
      expect(DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch: absent }).success).toBe(false);
    }
  });

  it('forwards the eight options that existed and were unreachable', () => {
    const code = gen({
      action: 'apply_thread', itemId: 'i',
      slant: 30, inset: 4, maxLen: 40, overlap: 0.3, pinch: 0.5, stagger: 0.5,
      stitchLen: 12, variance: 0.2,
    });
    for (const frag of ['"slant":30', '"inset":4', '"maxLen":40', '"overlap":0.3', '"pinch":0.5', '"stagger":0.5']) {
      expect(code).toContain(frag);
    }
  });

  it('applies hand wobble here, since the engine has no such option', () => {
    const code = gen({ action: 'apply_thread', itemId: 'i', roughness: 0.6, seed: 4 });
    expect(code).toContain('const rough = 0.6');
    // Every point of every stitch, each with its own phase off the seed — not
    // the first two points of whatever length the contour happens to be.
    expect(code).toContain('for (let j = 0; j < line.segments.length; j++)');
    expect(code).toContain('roughness: rough');
    expect(() => new Function(code)).not.toThrow();
  });

  it('roughness is NOT sent to the engine, which would ignore it', () => {
    const code = gen({ action: 'apply_thread', itemId: 'i', roughness: 0.6 });
    const call = code.slice(code.indexOf('app.applyThreadPainting'), code.indexOf('app.applyThreadPainting') + 200);
    expect(call).not.toContain('roughness');
  });

  it('zero roughness leaves the stitches exactly as the engine laid them', () => {
    const code = gen({ action: 'apply_thread', itemId: 'i' });
    expect(code).toContain('const rough = 0');
    expect(code).toContain('if (rough > 0');
  });
});

describe('the ontology points at the tool that can do it', () => {
  it('pp:Stitchcraft names design_medium, not the removed tool', () => {
    const t = (PP_VOCABULARY.types as Record<string, { mcpTool?: string; description: string }>)['pp:Stitchcraft'];
    expect(t).toBeTruthy();
    expect(t.mcpTool).toBe('pinepaper_design_medium');
    // And the description no longer promises a cross-stitch the engine lacks.
    expect(t.description).toContain('no cross-stitch');
  });
});
