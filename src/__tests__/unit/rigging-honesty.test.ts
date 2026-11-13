import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const run = (code: string, app: unknown) => new Function('app', 'return ' + code.replace(/^\/\/.*\n/, '').replace(/;\s*$/, ''))(app);

describe('interpolate_poses applies the blend it computed (it was discarded)', () => {
  it('applies the angles to the pose skeleton and returns them', () => {
    const applied: unknown[] = [];
    const R = {
      poses: new Map([['a', { skeletonId: 'sk1' }]]),
      interpolatePoses: () => ({ upperArm_L: 0.5 }),
      applyBoneAngles: (sk: string, angles: unknown) => applied.push([sk, angles]),
    };
    const r: any = run(codeGenerator.generateRigging({ action: 'interpolate_poses', poseIdA: 'a', poseIdB: 'b', t: 0.5 } as never), { riggingSystem: R, historyManager: { saveState() {} } });
    expect(r.success).toBe(true);
    expect(applied).toEqual([['sk1', { upperArm_L: 0.5 }]]);
    expect(r.boneAngles).toEqual({ upperArm_L: 0.5 });
  });
  it('a missing pose is still refused', () => {
    const R = { poses: new Map(), interpolatePoses: () => null, applyBoneAngles() {} };
    expect((run(codeGenerator.generateRigging({ action: 'interpolate_poses', poseIdA: 'a', poseIdB: 'b' } as never), { riggingSystem: R }) as any).success).toBe(false);
  });
});

describe('deform apply surfaces the studio refusal', () => {
  const app = (ret: unknown, warnings: unknown[] = []) => ({
    deformPresets: { apply: () => ret }, itemRegistry: { get: () => ({ item: {} }) }, lastReceipt: { warnings },
  });
  it('a named refusal in the receipt fails the call with its code', () => {
    const r: any = run(codeGenerator.generateDeform({ action: 'apply', itemId: 'item_1', preset: 'wobble' } as never), app(undefined, [{ kind: 'deform-no-geometry', message: 'item_1 has no path to deform' }]));
    expect(r.success).toBe(false);
    expect(r.code).toBe('deform-no-geometry');
    expect(r.error).toContain('no path');
  });
  it('an ok:false return fails the call; a plain return succeeds', () => {
    expect((run(codeGenerator.generateDeform({ action: 'apply', itemId: 'item_1', preset: 'x' } as never), app({ ok: false, reason: 'deform-unknown-preset' })) as any).success).toBe(false);
    expect((run(codeGenerator.generateDeform({ action: 'apply', itemId: 'item_1', preset: 'wobble' } as never), app(undefined)) as any).success).toBe(true);
  });
});

describe('a character action says what it applied, and fails when nothing was', () => {
  const studio = (skeleton: boolean) => {
    const item = { id: 'item_1', data: { characterId: 'c1' } };
    return { getItemById: () => item, addRelation: () => true, animate() {},
      riggingSystem: { skeletons: new Map(skeleton ? [['character_c1', {}]] : []), applyBoneAngles() {}, solveFK() {} } };
  };
  it('no skeleton: a pose action with no animation fallback fails, naming why', () => {
    const r: any = run(codeGenerator.generateCharacterAction({ characterId: 'item_1', action: 'point' } as never), studio(false));
    expect(r.success).toBe(false);
    expect(r.error).toContain('no skeleton');
  });
  it('no skeleton: wave runs the whole-figure fallback and says so', () => {
    const r: any = run(codeGenerator.generateCharacterAction({ characterId: 'item_1', action: 'wave' } as never), studio(false));
    expect(r.success).toBe(true);
    expect(r.applied).toEqual(['whole-figure wobble']);
    expect(r.warning).toContain('no skeleton');
  });
  it('with a skeleton: bone angles are applied', () => {
    const r: any = run(codeGenerator.generateCharacterAction({ characterId: 'item_1', action: 'point' } as never), studio(true));
    expect(r.applied).toEqual(['bone angles']);
    expect(r.warning).toBeUndefined();
  });
});
