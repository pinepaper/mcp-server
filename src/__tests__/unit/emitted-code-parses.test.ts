/**
 * Every action must emit code that PARSES.
 *
 * Found by driving the tools cold: the auto_walk refusal message contained
 * "…libraryName 'humanoid'…" inside a single-quoted JavaScript literal, so the
 * emitter produced a program with a syntax error in it. The tool call did not
 * fail in any way a schema or a type could see — the string was a perfectly
 * good string right up until the browser tried to run it, and then every
 * auto_walk call in existence returned SyntaxError instead of a result.
 *
 * Prose is DATA. The moment an apostrophe, a backtick or a newline reaches a
 * quoted literal by interpolation, punctuation becomes syntax. This parses
 * everything the rigging and medium emitters can produce, including the error
 * branches — which are exactly the paths nobody exercises by hand.
 */

import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import {
  RiggingInputSchema,
  DesignMediumInputSchema,
  SequenceInputSchema,
  StaggerInputSchema,
  FlipInputSchema,
  SceneGraphInputSchema,
  QueryCapabilitiesInputSchema,
  PlayTimelineInputSchema,
} from '../../types/schemas.js';

const G = new PinePaperCodeGenerator();

const actionsOf = (schema: unknown): string[] => {
  let s = schema as { shape?: Record<string, unknown>; _def?: { schema?: unknown } };
  while (!s.shape && s._def?.schema) s = s._def.schema as typeof s;
  const field = s.shape?.action as { options?: unknown[]; _def?: { values?: unknown[] } };
  return (field?.options ?? field?._def?.values ?? []).map((v) => String(v));
};

/** Throws on a syntax error without running anything. */
const parses = (code: string) => {
  // eslint-disable-next-line no-new-func
  new Function(`return (function(app, paper){ ${code} });`);
};

describe('emitted rigging code is valid JavaScript', () => {
  const actions = actionsOf(RiggingInputSchema);

  it('parses for every action, with plausible arguments', () => {
    const args = {
      skeletonId: 'skeleton_1', boneId: 'bone_1', itemId: 'item_1', chainId: 'chain_1',
      name: "a rig with an apostrophe's name", poseId: 'pose_1', poseIdA: 'pose_1', poseIdB: 'pose_2',
      t: 0.5, libraryName: 'humanoid', boneMap: { hip: 'bone_1' }, transitionName: 'humanoid_walk',
      poseIdMap: { walk_00: 'pose_1' }, boneNames: ['tail_1', 'tail_2'],
      keyframes: [{ t: 0, x: 0, y: 0 }], shapeKeyId: 'sk_1', weight: 1,
      sequence: [{ t: 0, pose: 'pose_1' }], clips: [{ keys: [{ t: 0, pose: 'pose_1' }], duration: 1 }],
      time: 0, pose: 'pose_1', boneIds: ['bone_1', 'bone_2'], options: {},
      bvhText: "HIERARCHY\nROOT hips\n", spineJson: '{}',
    };
    // LIVENESS: an empty collection makes `expect(broken).toEqual([])` pass
    // while exercising nothing. FxTool's third guard-the-guard — an empty
    // derivation passes louder than a wrong one.
    expect(actions.length, 'nothing was exercised').toBeGreaterThan(0);
    const broken: string[] = [];
    for (const action of actions) {
      const code = G.generateRigging({ action, ...args } as never);
      try { parses(code); } catch (e) { broken.push(`${action}: ${(e as Error).message}`); }
    }
    expect(broken).toEqual([]);
  });

  it('parses when the optional arguments are absent', () => {
    // The refusal branches are built from prose, and prose is where quoting
    // goes wrong — so exercise the shape where most fields are missing.
    // LIVENESS: an empty collection makes `expect(broken).toEqual([])` pass
    // while exercising nothing. FxTool's third guard-the-guard — an empty
    // derivation passes louder than a wrong one.
    expect(actions.length, 'nothing was exercised').toBeGreaterThan(0);
    const broken: string[] = [];
    for (const action of actions) {
      const code = G.generateRigging({ action, skeletonId: 'skeleton_1' } as never);
      try { parses(code); } catch (e) { broken.push(`${action}: ${(e as Error).message}`); }
    }
    expect(broken).toEqual([]);
  });
});

describe('emitted medium code is valid JavaScript', () => {
  it('parses for every action', () => {
    // LIVENESS: an empty collection makes `expect(broken).toEqual([])` pass
    // while exercising nothing. FxTool's third guard-the-guard — an empty
    // derivation passes louder than a wrong one.
    expect(actionsOf(DesignMediumInputSchema).length, 'nothing was exercised').toBeGreaterThan(0);
    const broken: string[] = [];
    for (const action of actionsOf(DesignMediumInputSchema)) {
      for (const extra of [{}, { medium: "someone's medium", itemId: 'item_1', stitch: 'satin' }]) {
        const code = G.generateDesignMedium({ action, ...extra } as never);
        try { parses(code); } catch (e) { broken.push(`${action}: ${(e as Error).message}`); }
      }
    }
    expect(broken).toEqual([]);
  });
});

/**
 * The same guard over the newer emitters.
 *
 * Extended after a backtick inside a template literal broke two of these during
 * development — twice, and `tsc --noEmit` reported nothing either time. A
 * generator body IS a template literal, so every backtick and every `${` in a
 * comment or a message is punctuation that becomes syntax.
 */
describe('emitted sequence / stagger / flip code is valid JavaScript', () => {
  const cases: Array<[string, unknown, (a: never) => string]> = [
    ['sequence', SequenceInputSchema, (a) => G.generateSequence(a)],
    ['stagger', StaggerInputSchema, (a) => G.generateStagger(a)],
    ['flip', FlipInputSchema, (a) => G.generateFlip(a)],
    ['scene_graph', SceneGraphInputSchema, (a) => G.generateSceneGraph(a)],
    ['capabilities', QueryCapabilitiesInputSchema, (a) => G.generateQueryCapabilities(a)],
  ];

  // Prose with punctuation in it, threaded through every string-shaped field.
  const PROSE = "a clip's name — with `backticks`, a ${brace} and a \"quote\"";

  it('parses for every action, with punctuation in every string', () => {
    // LIVENESS: an empty collection makes `expect(broken).toEqual([])` pass
    // while exercising nothing. FxTool's third guard-the-guard — an empty
    // derivation passes louder than a wrong one.
    expect(cases.length, 'nothing was exercised').toBeGreaterThan(0);
    const broken: string[] = [];
    for (const [name, schema, gen] of cases) {
      for (const action of actionsOf(schema)) {
        const args = {
          action,
          clips: [{ id: PROSE, duration: 2, label: PROSE, position: '-=25%' }],
          position: '<25%',
          labels: { intro: 1 },
          itemIds: ['item_1', 'item_2'],
          count: 4,
          opts: { each: 0.1, from: 'center', grid: [2, 2] },
          easing: PROSE,
          enter: PROSE,
          key: PROSE,
          subject: PROSE,
          mood: 'triumphant',
          seed: PROSE,
          graph: { nodes: [{ id: 'a', kind: 'end', text: PROSE }] },
        };
        try {
          parses(gen(args as never));
        } catch (e) {
          broken.push(`${name}/${action}: ${(e as Error).message}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });
});

describe('emitted play_timeline code is valid JavaScript', () => {
  it('parses for every action, including the new rate/progress/scroll ones', () => {
    // LIVENESS: an empty collection makes `expect(broken).toEqual([])` pass
    // while exercising nothing. FxTool's third guard-the-guard — an empty
    // derivation passes louder than a wrong one.
    expect(actionsOf(PlayTimelineInputSchema).length, 'nothing was exercised').toBeGreaterThan(0);
    const broken: string[] = [];
    for (const action of actionsOf(PlayTimelineInputSchema)) {
      const code = G.generatePlayTimeline(action as never, 5, true, 2.5, true, {
        rate: -0.5,
        progress: 0.25,
        scroll: { elementId: 'main', start: 'top bottom', end: 'bottom top', scrub: 0.3, range: [0, 4] },
      });
      try { parses(code); } catch (e) { broken.push(`${action}: ${(e as Error).message}`); }
    }
    expect(broken).toEqual([]);
  });
});

/**
 * EVERY generator, not just the four that broke before.
 *
 * This file grew one describe-block per incident: rigging, medium, sequence,
 * play_timeline. Each was added after something shipped broken, and the next
 * one shipped broken anyway — `import_image` emitted
 *
 *     '. This is the browser\'s network stack: …'
 *
 * inside a template literal, where `\'` collapses to a bare `'` and closes the
 * single-quoted string early. Every URL import failed with a syntax error
 * before anything ran, in published 1.6.11 and 1.6.12, found by a session
 * driving production rather than by this suite.
 *
 * So the sweep is mechanical: call every generator with one permissive input
 * and require that whatever comes back is parseable JavaScript. It cannot
 * check that the code is CORRECT — only that it can run at all — which is
 * exactly the class that keeps escaping.
 */
describe('every generator emits parseable JavaScript', () => {
  // Enough keys to satisfy most generators' validation. A generator that
  // rejects it is skipped, not failed: this is a syntax net, and a wrong
  // argument shape is not evidence of a bug (generateP5Draw takes a bare
  // string, and handing it this object emitted a literal "[object Object]").
  const KITCHEN_SINK: Record<string, unknown> = {
    action: 'create', itemType: 'rectangle', id: 'item_1', itemId: 'item_1',
    itemIds: ['item_1', 'item_2'], name: 'thing', templateId: 'hero',
    url: 'https://example.com/a.png', text: 'hi', content: 'hi',
    position: { x: 10, y: 20 }, properties: { width: 10, height: 10 },
    width: 100, height: 50, format: 'png', platform: 'auto', duration: 5,
    seconds: 1, at: { x: 1, y: 2 }, regions: ['fr'], coords: [[0, 0], [1, 1]],
    mapId: 'world', operations: [], items: [], relationType: 'follows',
    sourceId: 'item_1', targetId: 'item_2', effectType: 'glow',
    generatorName: 'drawSunburst', shapeType: 'terminal', label: 'Start',
    code: 'app.create("circle",{})', color: '#fff', easing: 'linear',
    keyframes: [], exportId: 'exp_1', query: 'x', skeletonId: 'skeleton_1',
  };

  /** Generators whose signature is not an options object, so the sink misleads. */
  const NOT_AN_OPTIONS_BAG = new Set(['generateP5Draw']);

  const sweep = (): { produced: string[]; broken: string[] } => {
    const proto = Object.getPrototypeOf(G) as object;
    const names = Object.getOwnPropertyNames(proto).filter((n) => /^generate[A-Z]/.test(n));
    const produced: string[] = [];
    const broken: string[] = [];
    for (const n of names) {
      if (NOT_AN_OPTIONS_BAG.has(n)) continue;
      const fn = (G as unknown as Record<string, (a: unknown) => unknown>)[n];
      let code: unknown;
      try { code = fn.call(G, KITCHEN_SINK); } catch { continue; }
      if (typeof code !== 'string' || !code.trim()) continue;
      produced.push(n);
      try { parses(code); } catch (e) { broken.push(`${n}: ${(e as Error).message}`); }
    }
    return { produced, broken };
  };

  it('covers most of the surface, so a pass means something', () => {
    // Liveness. A sink that stopped satisfying anything would make the
    // assertion below vacuous — which is how a guard quietly stops guarding.
    const { produced } = sweep();
    expect(produced.length).toBeGreaterThan(100);
    expect(produced).toContain('generateImportImage');
    expect(produced).toContain('generateGetItems');
  });

  it('emits nothing that fails to parse', () => {
    expect(sweep().broken).toEqual([]);
  });

  it('catches the escape that collapses inside a template literal', () => {
    // The exact shape of the import_image bug, so a rewrite that reintroduces
    // it fails here rather than in production.
    expect(() => parses(`const e = 'the browser\'s network stack';`)).toThrow();
    expect(() => parses(`const e = 'the browser\\'s network stack';`)).not.toThrow();
  });

  it('import_image parses with every option it accepts', () => {
    const code = G.generateImportImage({
      url: 'https://picsum.photos/id/0/1320/880.jpg',
      position: { x: 556, y: 548 }, maxWidth: 660, maxHeight: 440,
    } as never);
    expect(() => parses(code)).not.toThrow();
  });

  it('get_items parses for a filter object that matches no known key', () => {
    // `entries.filter(entry => )` — a filter with keys but no recognised ones
    // produced an empty predicate, which is a syntax error rather than a wrong
    // answer: the whole call dies before it runs.
    for (const filter of [{}, { type: undefined }, { nope: 1 }, { hasRelation: true }] as never[]) {
      expect(() => parses(G.generateGetItems(filter)), JSON.stringify(filter)).not.toThrow();
    }
  });
});
