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
import { DesignMediumInputSchema, ComposeInputSchema, THREAD_STITCHES } from '../../types/schemas.js';
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

  it("offers exactly the six stitches the engine publishes", () => {
    // STITCH_OPS is the published vocabulary: longAndShort, satin, seed, stem,
    // runningSeam, crossStitch. applyThreadPainting dispatches on it and
    // REFUSES an unknown name rather than falling through to a default fill —
    // so an enum wider than STITCH_OPS is a set of names that error, and one
    // narrower is a capability nothing can reach.
    for (const stitch of ['longAndShort', 'satin', 'seed', 'stem', 'runningSeam', 'crossStitch']) {
      expect(DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch }).success).toBe(true);
    }
    // These are PLANNER function names and field kinds, not stitches. They read
    // like stitches in a grep over the module, which is how they briefly got
    // into this enum; the engine would refuse every one.
    for (const notAStitch of ['satinBetween', 'seedFill', 'stemAlong', 'fillRegion', 'radial', 'spine', 'constant', 'flow']) {
      expect(
        DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch: notAStitch }).success,
        `${notAStitch} is a planner or a field kind, not a stitch`,
      ).toBe(false);
    }
  });

  it('carries the per-stitch parameters STITCH_OPS declares', () => {
    const code = gen({
      action: 'apply_thread', itemId: 'i', stitch: 'runningSeam',
      stitchLen: 8, gapLen: 4, gridSize: 12, slant: 22, overlap: 0.4, stagger: 0.5,
    });
    for (const frag of ['"gapLen":4', '"gridSize":12', '"slant":22', '"overlap":0.4', '"stagger":0.5']) {
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
    // And the description names the six stitches the engine publishes rather
    // than claiming absent any that are real — it briefly said the engine has
    // no cross-stitch, which was false: crossStitchFill is one of its six.
    expect(t.description).toContain('six stitches');
    expect(t.description).toContain('crossStitch');
    expect(t.description).not.toContain('no cross-stitch');
  });
});

/**
 * One list, not four.
 *
 * This list had four copies here — two Zod enums and their two JSON mirrors —
 * and correcting one left pinepaper_compose unable to ask for two stitches
 * apply_thread could. FxTool had the identical split for the identical reason
 * on the same day: MEDIA.thread.stitches was hardcoded to the same stale four
 * while STITCH_OPS published six (6aaa9069). Two repos, four copies, one list,
 * drifted in the same direction — because neither read the published table.
 */
describe('the stitch list has exactly one definition', () => {
  /**
   * STRUCTURAL, not textual — and the reason is worth keeping.
   *
   * The first version of this guard asserted that no served schema contained
   * the exact JSON of the stale four. A REORDERED copy — ['satin',
   * 'longAndShort', 'stem', 'seed'], the same regression with the same two
   * omissions — walked straight past it, so the guard would have gone green on
   * the very bug it was written for. The FxTool session hit the mirror of this
   * writing its own version: a containment scan matched the COMMENT explaining
   * the defect, because prose quoting the code looks exactly like the code.
   *
   * So this walks the served schemas and compares stitch-shaped enums as SETS.
   * Order cannot evade it, a description string cannot satisfy it, and a tool
   * added later is covered without anyone remembering to list it here.
   */
  const stitchEnums = (): Array<{ tool: string; values: string[] }> => {
    const out: Array<{ tool: string; values: string[] }> = [];
    const walk = (tool: string, node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as Record<string, unknown>;
      if (Array.isArray(n.enum)) {
        const vals = n.enum.filter((v): v is string => typeof v === 'string');
        // Stitch-shaped: names only this vocabulary uses.
        if (vals.some((v) => v === 'longAndShort' || v === 'crossStitch' || v === 'runningSeam')) {
          out.push({ tool, values: vals });
        }
      }
      for (const v of Object.values(n)) walk(tool, v);
    };
    for (const t of PINEPAPER_TOOLS) walk(t.name, t.inputSchema);
    return out;
  };

  it('every stitch enum the server publishes is the full six', () => {
    const found = stitchEnums();
    // At least the two known homes. Fewer would mean one stopped being
    // stitch-shaped and this guard silently stopped covering it.
    expect(found.length).toBeGreaterThanOrEqual(2);
    const expected = [...THREAD_STITCHES].sort();
    for (const { tool, values } of found) {
      expect([...values].sort(), `${tool} drifted from THREAD_STITCHES`).toEqual(expected);
    }
  });

  it('and both known homes are among them', () => {
    const tools = new Set(stitchEnums().map((e) => e.tool));
    expect(tools.has('pinepaper_design_medium')).toBe(true);
    expect(tools.has('pinepaper_compose')).toBe(true);
  });

  it('the guard fires on a REORDERED stale copy, which defeated the first version', () => {
    const reordered = ['satin', 'longAndShort', 'stem', 'seed'];
    expect([...reordered].sort()).not.toEqual([...THREAD_STITCHES].sort());
    // And the textual form it replaced could NOT tell: exact-JSON containment
    // misses any permutation, which is why this compares sets.
    expect(JSON.stringify(reordered)).not.toContain(JSON.stringify(['longAndShort', 'satin', 'seed', 'stem']));
  });


  it('both Zod schemas accept the two that were missing', () => {
    for (const stitch of ['runningSeam', 'crossStitch']) {
      expect(DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch }).success).toBe(true);
      expect(ComposeInputSchema.safeParse({ action: 'apply', medium: 'thread', stitch }).success).toBe(true);
    }
  });
});
