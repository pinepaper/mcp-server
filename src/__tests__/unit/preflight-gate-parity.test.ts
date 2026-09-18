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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GeneratorNameSchema, EffectTypeSchema, RelationTypeSchema, ItemTypeSchema } from '../../types/schemas.js';

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

describe('effectType covers both dispatch paths', () => {
  it('has the EffectSystem cases and the shader auras', () => {
    const switchCases = ['blast', 'bubbles', 'confetti', 'dust', 'electric', 'fire', 'fireflies',
      'glow', 'rain', 'ripple', 'shockwave', 'smoke', 'snow', 'sparkle', 'trail'];
    const auras = ['heatmap', 'liquid_metal', 'gem_smoke', 'electric_arc', 'vortex', 'rain_veil', 'caustics'];
    for (const e of [...switchCases, ...auras]) {
      expect(EffectTypeSchema.safeParse(e).success, `${e} would be refused at preflight`).toBe(true);
    }
    // And nothing beyond those two paths, which would be a phantom.
    expect(EffectTypeSchema.options.length).toBe(switchCases.length + auras.length);
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
