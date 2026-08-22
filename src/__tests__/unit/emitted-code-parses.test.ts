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
import { RiggingInputSchema, DesignMediumInputSchema } from '../../types/schemas.js';

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
