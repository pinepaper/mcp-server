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
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
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
   * A DETECTOR, TESTED ON FIXTURES — and then pointed at the live schemas.
   *
   * Three versions of this guard, each broken in a way only planting the defect
   * revealed:
   *
   * 1. Exact-JSON containment. A REORDERED copy walked past it, so it would
   *    have gone green on the very bug it was written for.
   * 2. A set comparison plus "at least two stitch enums must exist". The
   *    FxTool session took that assertion, applied it to a healthy tree, and it
   *    FAILED — because on their side every hardcoded copy had been removed, so
   *    finding zero was the success state. Asserting offenders exist makes a
   *    guard depend on the defect persisting. It happens to hold here because
   *    these enums ARE the product — JSON Schema needs literal arrays, so the
   *    served schemas always carry them — but the day one becomes a $ref or a
   *    tool is retired, that assertion fails and reads as a regression.
   * 3. This. The detector is tested against fixtures, so it cannot pass by
   *    covering nothing and does not require the tree to stay broken; then it
   *    is run over what the server actually serves.
   */
  type Found = { path: string; values: string[] };

  /** Every stitch-shaped enum anywhere in a schema, however deeply nested. */
  const detect = (node: unknown, path = '$'): Found[] => {
    if (!node || typeof node !== 'object') return [];
    const n = node as Record<string, unknown>;
    const out: Found[] = [];
    if (Array.isArray(n.enum)) {
      const values = n.enum.filter((v): v is string => typeof v === 'string');
      // STITCH-SHAPED: at least TWO values, and every one a stitch.
      //
      // The threshold came back after a wider measurement reversed the last
      // one. Scoped to served enums, no single-valued stitch enum exists and the
      // filter looked free. Scanning every array literal in src/ instead found
      // the reason to keep it: `seed` is a stitch AND a live motion knob
      // (code-generator.ts:8394, ['speed','intensity','waveform','origin',
      // 'seed']), and `stem` is a stitch and a word this vocabulary uses
      // elsewhere. So a lone ['seed'] is far more likely a knob list than a
      // one-entry stale stitch enum, and `>= 1` would false-positive on it.
      //
      // FxTool reached the same conclusion from a different collision — 'stem'
      // is also their STEM education tag — which is the transferable lesson:
      // the METHOD carries (ask what the filter protects against, require a
      // count), the NUMBER does not. I ran their measurement, got the opposite
      // answer, and had to run my own at a wider scope to find that out.
      //
      // The cost is real and accepted: a single-name stale copy is not caught.
      // A stale copy truncated to one of six names is far less likely than a
      // legitimate one-value enum containing a colliding word.
      //
      // PURITY is what disqualifies, and it is load-bearing rather than
      // decorative — one foreign value and it is not a stitch list, which is
      // exactly what keeps the motion-knob array below from matching.
      //
      // Read off enum VALUES only, so a description quoting the names never
      // registers.
      const allStitches = values.length >= 2
        && values.every((v) => (THREAD_STITCHES as readonly string[]).includes(v));
      if (allStitches) out.push({ path, values });
    }
    for (const [k, v] of Object.entries(n)) out.push(...detect(v, `${path}.${k}`));
    return out;
  };

  const complete = [...THREAD_STITCHES];
  const isComplete = (f: Found) => JSON.stringify([...f.values].sort()) === JSON.stringify([...complete].sort());

  describe('the detector itself', () => {
    it('flags a stale copy', () => {
      const found = detect({ properties: { stitch: { enum: ['longAndShort', 'satin', 'seed', 'stem'] } } });
      expect(found).toHaveLength(1);
      expect(isComplete(found[0]!)).toBe(false);
    });

    it('flags a REORDERED stale copy — the shape that defeated version 1', () => {
      const found = detect({ properties: { stitch: { enum: ['satin', 'longAndShort', 'stem', 'seed'] } } });
      expect(found).toHaveLength(1);
      expect(isComplete(found[0]!)).toBe(false);
    });

    it('flags one nested deeper than a top-level property', () => {
      // My analogue of FxTool's line-by-line layout hole: a copy the walk does
      // not reach is covered by nothing at all.
      // And note WHICH names: satin, seed and stem are stale-copy material that
      // contains none of the sentinels the first detector keyed on.
      const found = detect({ properties: { batch: { items: { anyOf: [{ enum: ['satin', 'seed', 'stem'] }] } } } });
      expect(found).toHaveLength(1);
      expect(isComplete(found[0]!)).toBe(false);
    });

    it('does NOT flag a single colliding name — the real reason for the threshold', () => {
      // `seed` is a stitch and a motion knob. A lone ['seed'] is a knob list,
      // not a one-entry stale stitch enum, so flagging it would be a false
      // positive on live vocabulary.
      expect(detect({ properties: { x: { enum: ['seed'] } } })).toHaveLength(0);
      expect(detect({ properties: { x: { enum: ['stem'] } } })).toHaveLength(0);
    });

    it('does NOT flag a REAL mixed array from this repo', () => {
      // Was ['satin','seed','stem','banana'] — invented, and therefore unable
      // to tell whether purity is load-bearing or decorative. This is the
      // actual motion-knob list from code-generator.ts:8394, which contains a
      // stitch name and must not match.
      expect(detect({ properties: { x: { enum: ['speed', 'intensity', 'waveform', 'origin', 'seed'] } } })).toHaveLength(0);
    });

    it('and that collision is REAL, so the fixture above is not fiction', () => {
      // A fixture drawn from the tree can rot: if `seed` ever leaves the motion
      // knobs, the case above stops proving anything and purity starts looking
      // like over-engineering with nothing to point at.
      const src = readFileSync(join(import.meta.dir, '..', '..', 'types', 'code-generator.ts'), 'utf-8');
      expect(src).toContain("['speed', 'intensity', 'waveform', 'origin', 'seed']");
      expect((THREAD_STITCHES as readonly string[])).toContain('seed');
    });

    it('does NOT flag an unrelated enum', () => {
      expect(detect({ properties: { x: { enum: ['red', 'green', 'blue'] } } })).toHaveLength(0);
      expect(detect({ properties: { x: { enum: ['history', 'version'] } } })).toHaveLength(0);
    });

    it('does NOT flag a complete copy', () => {
      const found = detect({ properties: { stitch: { enum: [...THREAD_STITCHES] } } });
      expect(found).toHaveLength(1);
      expect(isComplete(found[0]!)).toBe(true);
    });

    it('does NOT flag prose that merely quotes the names', () => {
      // The evasion I claimed was impossible two messages ago and had not
      // tested. A description is a string, and the detector reads enum VALUES.
      const found = detect({
        properties: {
          stitch: {
            enum: [...THREAD_STITCHES],
            description: 'was ["longAndShort","satin","seed","stem"] before runningSeam and crossStitch',
          },
          other: { description: 'satin, longAndShort, seed, stem — the old four' },
        },
      });
      expect(found).toHaveLength(1);
      expect(isComplete(found[0]!)).toBe(true);
    });

    it('finds nothing in a schema with no stitch enum, and says so', () => {
      // The zero case is a legitimate answer, not a broken scan — which is
      // exactly why the old "at least two must exist" assertion was wrong.
      expect(detect({ properties: { color: { type: 'string' } } })).toHaveLength(0);
    });
  });

  it('every stitch enum the server serves is complete', () => {
    const offenders: string[] = [];
    for (const tool of PINEPAPER_TOOLS) {
      for (const f of detect(tool.inputSchema, tool.name)) {
        if (!isComplete(f)) offenders.push(`${f.path}: ${JSON.stringify(f.values)}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('both Zod schemas accept the two that were missing', () => {
    for (const stitch of ['runningSeam', 'crossStitch']) {
      expect(DesignMediumInputSchema.safeParse({ action: 'apply_thread', itemId: 'i', stitch }).success).toBe(true);
      expect(ComposeInputSchema.safeParse({ action: 'apply', medium: 'thread', stitch }).success).toBe(true);
    }
  });
});

/**
 * THE SOURCE-LEVEL SCAN, and why its scope is what it is.
 *
 * The detector above reads SERVED schemas. That is a scope choice, and an
 * unstated scope choice is indistinguishable in a diff from the hand-listed
 * file set that was this guard's original hole — so the reason has to be
 * written down or it is not there at all (FxTool's point, and they had to make
 * the same argument for their js/-only walk).
 *
 * The gap it leaves is real: this repo mirrors every Zod schema into a JSON
 * `inputSchema` by hand, so a stale `z.enum(['satin','seed','stem'])` never
 * reaches the served surface the detector walks, and would be covered only by
 * the two hand-named positive tests below — which is the hand-listed hole
 * wearing a different hat.
 *
 * So this scans SOURCE for pure stitch array literals and asserts there is
 * exactly one: THREAD_STITCHES' own declaration. It covers the Zod side, the
 * JSON side, and any surface added later.
 *
 * Two directories are excluded, both for a measured reason rather than by
 * habit:
 *  - `__tests__`, because the fixtures above deliberately CONTAIN stale copies.
 *    Including it would make the suite flag itself.
 *  - `vendor`, because it is generated from mcp-cloud and guarded by its own
 *    provenance check; a literal there is upstream's to fix, not ours to edit.
 */
describe('the source-level scan', () => {
  const SRC = join(import.meta.dir, '..', '..');

  const tsFiles = (dir: string): string[] => {
    const out: string[] = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (e.name === '__tests__' || e.name === 'vendor' || e.name === 'node_modules') continue;
        out.push(...tsFiles(join(dir, e.name)));
      } else if (e.name.endsWith('.ts')) out.push(join(dir, e.name));
    }
    return out;
  };

  /** Pure stitch array literals in source, comments stripped. */
  const pureStitchArrays = (): Array<{ file: string; values: string[] }> => {
    const found: Array<{ file: string; values: string[] }> = [];
    const set = new Set<string>(THREAD_STITCHES as readonly string[]);
    for (const f of tsFiles(SRC)) {
      // Comments stripped, because prose quoting the list looks exactly like
      // the list — the evasion that bit FxTool four times in a month.
      const src = readFileSync(f, 'utf-8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const m of src.matchAll(/\[[^[\]]{0,400}?\]/g)) {
        const values = [...m[0].matchAll(/'([^']+)'|"([^"]+)"/g)].map((x) => x[1] ?? x[2]!);
        if (values.length >= 2 && values.every((v) => set.has(v))) {
          found.push({ file: f.replace(SRC, 'src'), values });
        }
      }
    }
    return found;
  };

  it('the stitch list is written out exactly once in source', () => {
    const found = pureStitchArrays();
    // One declaration: THREAD_STITCHES itself. Everything else spreads it.
    expect(found).toHaveLength(1);
    expect(found[0]!.file).toContain('schemas.ts');
    expect([...found[0]!.values].sort()).toEqual([...THREAD_STITCHES].sort());
  });

  it('and that one declaration is complete', () => {
    // The single surviving literal IS the constant, so if it is ever trimmed
    // the whole surface trims with it silently — every other site spreads it.
    // This is the only place that can notice.
    const only = pureStitchArrays()[0]!;
    expect(only.values).toHaveLength(THREAD_STITCHES.length);
  });
});
