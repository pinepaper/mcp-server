/**
 * The preflight is a HARD GATE, so a narrow vocabulary blocks working calls.
 *
 * `validateBatchVocabulary` rejects an operation whose itemType, relationType,
 * generatorName or effectType is not in the local enum, before the browser
 * sees it. That is the right design — it catches a typo in one round trip
 * instead of a silent no-op — and it makes each of those four enums a place
 * where being narrower than the engine is not a documentation gap but a
 * refusal.
 *
 * This has now happened twice. `relationType` offered 39 of 134 relations, and
 * the missing set was essentially the whole interactive vocabulary.
 * `generatorName` offered 64 of the engine's 74, and the ten it rejected
 * included every GPU field generator — so `create_item`'s `field` type,
 * `design_medium`'s flow fields and the design graph's own recipe example all
 * name `drawGPUTunnel`, and a captured scene recording it could not be
 * replayed through the tool that exists to replay it.
 *
 * WHAT THIS FILE CAN AND CANNOT PROVE, stated because an unstated scope is
 * indistinguishable from an accident:
 *  - relationType and generatorName have fixtures of the engine's own
 *    registered sets, so drift fails here.
 *  - effectType is verified by reasoning rather than a fixture: the enum's 22
 *    names are the engine's 15 EffectSystem cases plus 7 shader auras, which
 *    reach the aura system instead of that switch. Nothing is missing, and a
 *    fixture would have to cover two dispatch paths.
 *  - itemType is NOT verified. The engine's accepted set is assembled at
 *    runtime from five shape modules and answered by `shapeRegistry.getAll()`,
 *    so a static fixture would be a guess about a dynamic list. The honest
 *    guard for it is asking the studio, not asserting here.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { GeneratorNameSchema, EffectTypeSchema, RelationTypeSchema, ItemTypeSchema, THREAD_STITCHES } from '../../types/schemas.js';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dir, '..', 'fixtures', name), 'utf-8')
    .split('\n').map((l) => l.trim()).filter(Boolean);

describe('generatorName ↔ the engine registry', () => {
  const engine = fixture('engine-generators.txt');

  it('every registered generator is callable', () => {
    const missing = engine.filter((g) => !GeneratorNameSchema.options.includes(g as never));
    // A name missing here is a REFUSAL, not a doc gap: preflight rejects it.
    expect(missing).toEqual([]);
  });

  it('offers no generator the engine does not register', () => {
    // The other direction matters too — a published name with nothing behind it
    // is the phantom this repo keeps finding.
    const phantom = GeneratorNameSchema.options.filter((g) => !engine.includes(g));
    expect(phantom).toEqual([]);
  });

  it('the GPU field generators specifically, since the recipes name them', () => {
    for (const g of ['drawGPUTunnel', 'drawGPUCaustics', 'drawGPUClouds', 'drawGPUOcean',
      'drawGPUPlasma', 'drawGPUStarfield', 'drawGPUVoronoi']) {
      expect(GeneratorNameSchema.safeParse(g).success, `${g} would be refused at preflight`).toBe(true);
    }
  });

  it('a captured recipe can be replayed', () => {
    // The design graph records `generator: 'drawGPUTunnel'` as its documented
    // example. Recording something the gate rejects is a round trip to nowhere.
    const example = 'drawGPUTunnel';
    expect(readFileSync(join(import.meta.dir, '..', '..', 'ontology', 'types.ts'), 'utf-8')).toContain(example);
    expect(GeneratorNameSchema.safeParse(example).success).toBe(true);
  });
});

describe('effectType ↔ the engine, from a fixture rather than my own typing', () => {
  /**
   * THIS GUARD USED TO AGREE WITH ITSELF.
   *
   * The first version typed the engine's fifteen EffectSystem cases and seven
   * shader auras INTO THIS FILE and compared the enum against them, including
   * an assertion that the enum's length equalled the two lists added together.
   * Both sides were my own typing, so it proved the enum matched what I had
   * written down — and would have passed for a sixteenth engine effect it had
   * never seen.
   *
   * It did worse than fail to catch drift: it CONCEALED a live gap. The engine
   * has eight auras, not seven, and `ink_bleed` was being rejected by the
   * preflight the whole time. Typing seven into the test made the count add up.
   *
   * (FxTool's session hit the same shape the same day — an ontology test
   * comparing a vocabulary against a hardcoded list in the test file, which
   * would have passed for a seventh preset. Two repos, one mistake, neither
   * visible by inspection.)
   */
  const engine = fixture('engine-effects.txt');

  it('every effect the engine can apply is callable', () => {
    const missing = engine.filter((e) => !EffectTypeSchema.options.includes(e as never));
    expect(missing).toEqual([]);
  });

  it('offers no effect the engine cannot apply', () => {
    const phantom = EffectTypeSchema.options.filter((e) => !engine.includes(e));
    expect(phantom).toEqual([]);
  });

  it('ink_bleed specifically, because the engine comment argues against it', () => {
    // "has shipped unroutable through applyEffect since it was added" is past
    // tense describing a bug the engine then fixed — _publishNames() publishes
    // every aura and applyEffect warms the subsystem before routing. Trusting
    // the prose would have kept a working effect gated out. A doc claiming a
    // mechanism is worth zero; the mechanism is worth everything.
    expect(EffectTypeSchema.safeParse('ink_bleed').success).toBe(true);
    expect(engine).toContain('ink_bleed');
  });

  it('THE GUARD, GUARDED — a planted extra engine effect must fail it', () => {
    // The only reason to believe the three tests above. If the comparison can
    // be satisfied by a list that disagrees with the fixture, it proves nothing.
    const planted = [...engine, 'effect_that_does_not_exist_here'];
    const missing = planted.filter((e) => !EffectTypeSchema.options.includes(e as never));
    expect(missing).toEqual(['effect_that_does_not_exist_here']);
  });
});

describe('THREAD_STITCHES ↔ STITCH_OPS, which only a comment claimed', () => {
  /**
   * The constant's own doc says "Mirrors FxTool's STITCH_OPS in
   * js/core/ThreadPainting.js". Nothing checked that. Six commits of guards
   * were built around a constant whose parity with the engine existed only as
   * prose — verified by hand once, days ago, and never again.
   *
   * FxTool found the same class today: a function whose comment said it
   * mirrored another function's condition, and it did not. "The doc says it
   * mirrors X" is worth zero as evidence.
   */
  const engine = fixture('engine-stitches.txt');

  it('is exactly the engine-published table', () => {
    expect([...THREAD_STITCHES].sort()).toEqual([...engine].sort());
  });

  it('THE GUARD, GUARDED — a planted seventh stitch must fail it', () => {
    const planted = [...engine, 'chainStitch'];
    expect([...THREAD_STITCHES].sort()).not.toEqual([...planted].sort());
  });
});

describe('the gates that guard, and the one that is not verified here', () => {
  it('relationType still matches its engine fixture', () => {
    const engine = fixture('engine-relations.txt');
    // relation-parity.test.ts owns the exclusion reasoning; this only asserts
    // the fixture has not been emptied, which would make that test vacuous.
    expect(engine.length).toBeGreaterThan(100);
    expect(RelationTypeSchema.options.length).toBeGreaterThan(70);
  });

  it('itemType is gated without a fixture, and that is recorded', () => {
    // Not an assertion about correctness — an assertion that the gap is known.
    // The engine assembles this at runtime from five shape modules, so the
    // honest check is asking a studio, not a static list here.
    expect(ItemTypeSchema.options.length).toBeGreaterThan(10);
    const doc = readFileSync(join(import.meta.dir, 'preflight-gate-parity.test.ts'), 'utf-8');
    expect(doc).toContain('itemType is NOT verified');
  });
});

/**
 * A parity claim must cite the test that enforces it, and the citation must be true.
 *
 * FxTool's rule, from sweeping their own tree: `WorkerPool` says "Math ops
 * mirror ExpressionIR.MATH exactly" and NAMES its guard,
 * `__tests__/WorkerIRParity.test.js`, which exists and is green — checkable in
 * one command. `MagicSystem` has three "Mirrors TemplateManager._doLoadTemplate
 * lines 1274-1432" references whose line numbers cannot survive an edit and
 * which nothing verifies.
 *
 * Every engine-parity claim in this repo's schemas was the second kind until
 * now: five engine fixtures existed and not one source comment named the test
 * reading them. THREAD_STITCHES' claim to mirror STITCH_OPS was a memory of
 * someone having checked once, for six commits of guards built on top of it.
 */
describe('parity claims cite a guard that exists', () => {
  const SCHEMAS = readFileSync(join(import.meta.dir, '..', '..', 'types', 'schemas.ts'), 'utf-8');

  it('every ENFORCED BY citation names a test file that is on disk', () => {
    // `[\s*]+`, not `\s+`: a citation that wraps across a JSDoc line has a
    // ` * ` continuation marker between the words, and the first version of
    // this regex could not cross it — so it saw three of four citations and
    // called the fourth missing. FxTool's LAYOUT hole, in the assertion rather
    // than the source. The liveness floor below is what caught it.
    const cited = [...SCHEMAS.matchAll(/ENFORCED BY[\s*]+src\/__tests__\/unit\/([a-z0-9-]+\.test\.ts)/g)]
      .map((m) => m[1]!);
    // Every ENFORCED BY must resolve to a path: one that does not is a citation
    // to nothing, which is worse than no citation at all.
    expect(cited.length, 'an ENFORCED BY citation names no test path').toBe((SCHEMAS.match(/ENFORCED BY/g) ?? []).length);
    // Liveness: no citations means the convention was dropped, not satisfied.
    expect(cited.length, 'no parity claim cites a guard').toBeGreaterThanOrEqual(4);
    for (const file of new Set(cited)) {
      expect(existsSync(join(import.meta.dir, file)), `${file} is cited but does not exist`).toBe(true);
    }
  });

  it('every cited fixture is on disk and non-empty', () => {
    const fixtures = [...SCHEMAS.matchAll(/fixture[s]?:\s+(engine-[a-z-]+\.txt)/g)].map((m) => m[1]!);
    expect(fixtures.length).toBeGreaterThanOrEqual(3);
    for (const f of new Set(fixtures)) {
      const rows = fixture(f);
      // An emptied fixture makes every parity test that reads it vacuous.
      expect(rows.length, `${f} is empty — parity against it proves nothing`).toBeGreaterThan(0);
    }
  });

  it('the four gated enums all carry a citation', () => {
    for (const marker of ['STITCH_OPS', 'RelationTypeSchema', 'EffectTypeSchema', 'GeneratorNameSchema']) {
      const idx = SCHEMAS.indexOf(marker);
      expect(idx, `${marker} not found`).toBeGreaterThan(-1);
      // The citation must be NEAR the claim, not anywhere in a 5000-line file —
      // a citation two hundred lines away is the line-number problem again.
      const window = SCHEMAS.slice(Math.max(0, idx - 800), idx + 200);
      expect(window, `${marker} has no nearby ENFORCED BY citation`).toContain('ENFORCED BY');
    }
  });
});

/**
 * No citation may point at a line number in another file.
 *
 * FxTool swept their tree for this after the citation rule landed and found
 * four rotted claims — three line ranges naming a method that had moved by a
 * hundred lines, one of them landing on a bare return, another inside an HTML
 * template string, and two sitting entirely before the function they named.
 * They banned the shape rather than correcting it, because correcting a line
 * range only resets a clock: it rots again on the next edit above it, in a file
 * neither author is looking at.
 *
 * This repo had one, and it had already rotted — a citation into FxTool's
 * exporter that pointed at DPI and canvas-size code rather than the
 * camera-framing block it claimed to mirror. Cite the method; a name survives
 * an edit.
 *
 * The comment above deliberately DESCRIBES the banned shape without writing an
 * example of one. FxTool tripped their own guard twice by quoting the artefact
 * they were explaining, which is the fourth instance of that collision in their
 * session; describing rather than reproducing is the rule that avoids it.
 */
describe('citations name methods, not line numbers', () => {
  const sourceFiles = (dir: string): string[] => {
    const out: string[] = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        // TESTS ARE IN SCOPE HERE, and excluding them was a reflex.
        //
        // The stitch scan excludes __tests__ for a measured reason: its
        // fixtures deliberately contain stale copies, so including it would
        // make the suite flag itself. I carried that exclusion to this rule
        // without asking whether the reason transferred. It does not — a
        // citation in a test comment rots exactly like one in source, and
        // measuring found FOUR here, two of them mine, two pointing into
        // FxTool at coordinates that had already decayed to a comment about
        // `.content` and to `analysis.totalItems++`.
        //
        // `vendor` stays out: it is generated, and a citation there is
        // upstream's to fix.
        if (e.name === 'vendor' || e.name === 'node_modules') continue;
        out.push(...sourceFiles(join(dir, e.name)));
      } else if (e.name.endsWith('.ts')) out.push(join(dir, e.name));
    }
    return out;
  };

  /**
   * A reference to another file that carries a line locator.
   *
   * Held as a SOURCE string and compiled per use, because a shared `/g` regex
   * carries `lastIndex` between calls: the second assertion below starts
   * scanning where the first stopped and fails on a string it should match.
   * The guard-the-guard caught that before this shipped, which is the whole
   * argument for writing the both-directions test first.
   */
  const CROSS_FILE_LINE_SRC = [
    // a filename followed by a coordinate separator and digits
    String.raw`[A-Za-z][A-Za-z0-9_]*\.(?:ts|js|mjs)` + '[:#]' + String.raw`\d{2,5}`,
    // a named symbol or file followed by the word line(s) and digits — the same
    // defect in prose form, which a single-syntax pattern would miss
    String.raw`[A-Za-z][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*\s+(?:at\s+)?lines?\s+\d{2,5}`,
    String.raw`[A-Za-z][A-Za-z0-9_]*\.(?:ts|js|mjs)\s+(?:at\s+)?lines?\s+\d{2,5}`,
  ].join('|');
  const crossFileLine = (flags = '') => new RegExp(CROSS_FILE_LINE_SRC, flags);

  it('the pattern matches a known-bad sample and not innocent prose', () => {
    // Guard-the-guard, both directions: a rule that succeeds by finding nothing
    // is satisfied just as well by a pattern that can no longer match.
    expect('see ExportEngine.js' + ':466').toMatch(crossFileLine());
    expect('see Renderer.ts' + '#1200').toMatch(crossFileLine());
    // The prose form, which a single-syntax pattern misses. FxTool's criterion:
    // rotting requires a TARGET plus coordinates that the target's file is free
    // to change. Both forms have both; the syntax is incidental.
    // Split, like the two above: this file is IN SCOPE for its own rule, so a
    // literal sample here would be an offence the scan reports. Splitting keeps
    // the file clean without exempting it — and an exemption for the file that
    // DEFINES the rule is the self-agreeing hole in its purest form.
    expect('TemplateManager._doLoadTemplate lines ' + '1274-1432').toMatch(crossFileLine());
    expect('ExportEngine.js line ' + '892').toMatch(crossFileLine());
    // A description points nowhere and cannot rot.
    expect('see ExportEngine.js, the framing block').not.toMatch(crossFileLine());
    expect('line 466 of the exporter').not.toMatch(crossFileLine());
    expect('the method at the top of the file').not.toMatch(crossFileLine());
  });

  it('no source file cites another file by line', () => {
    const SRC = join(import.meta.dir, '..', '..');
    const files = sourceFiles(SRC);
    // Liveness: zero files scanned would satisfy the assertion below while
    // proving nothing. This repo has hundreds of source modules.
    expect(files.length, 'the source walk found no files — it is broken').toBeGreaterThan(20);

    const offenders: string[] = [];
    for (const f of files) {
      const hits = readFileSync(f, 'utf-8').match(crossFileLine('g'));
      if (hits) offenders.push(`${f.replace(SRC, 'src')}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });
});
