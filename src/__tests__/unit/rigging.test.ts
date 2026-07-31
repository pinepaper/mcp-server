/**
 * pinepaper_rigging — skeletons/bones/IK/breakdown-pose keyframes via
 * app.riggingSystem. Emitted code must match FxTool's RiggingSystem contract.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { RiggingInputSchema } from '../../types/schemas.js';
import { PP_VOCABULARY } from '../../ontology/vocabulary.js';

describe('RiggingInputSchema validation', () => {
  it('create_skeleton needs no skeletonId; others do', () => {
    expect(RiggingInputSchema.safeParse({ action: 'create_skeleton' }).success).toBe(true);
    expect(RiggingInputSchema.safeParse({ action: 'add_bone' }).success).toBe(false);
    expect(RiggingInputSchema.safeParse({ action: 'add_bone', skeletonId: 's1' }).success).toBe(true);
  });
  it('attach_item needs boneId+itemId; ik chain needs ≥2 boneIds', () => {
    expect(RiggingInputSchema.safeParse({ action: 'attach_item', skeletonId: 's1', boneId: 'b1' }).success).toBe(false);
    expect(RiggingInputSchema.safeParse({ action: 'attach_item', skeletonId: 's1', boneId: 'b1', itemId: 'i1' }).success).toBe(true);
    expect(RiggingInputSchema.safeParse({ action: 'create_ik_chain', skeletonId: 's1', boneIds: ['b1'] }).success).toBe(false);
    expect(RiggingInputSchema.safeParse({ action: 'create_ik_chain', skeletonId: 's1', boneIds: ['b1', 'b2'] }).success).toBe(true);
  });
  it('add_pose_keyframe needs time+pose', () => {
    expect(RiggingInputSchema.safeParse({ action: 'add_pose_keyframe', skeletonId: 's1', time: 0 }).success).toBe(false);
    expect(RiggingInputSchema.safeParse({ action: 'add_pose_keyframe', skeletonId: 's1', time: 0, pose: { b1: 45 } }).success).toBe(true);
  });
});

describe('generateRigging codegen', () => {
  const guarded = (c: string) => expect(c).toContain('app.riggingSystem unavailable');
  const trailing = (c: string) => expect(/\)\s*;?\s*$/.test(c.trim())).toBe(true);

  it('create_skeleton → R.createSkeleton(name, rootPosition)', () => {
    const c = codeGenerator.generateRigging({ action: 'create_skeleton', name: 'hero', rootPosition: { x: 100, y: 200 } });
    expect(c).toContain('R.createSkeleton("hero", {"x":100,"y":200})');
    guarded(c); trailing(c);
  });

  it('add_bone forwards config fields', () => {
    const c = codeGenerator.generateRigging({ action: 'add_bone', skeletonId: 's1', parentBoneId: 'b0', length: 60, angle: 30 });
    expect(c).toContain('R.addBone("s1"');
    expect(c).toContain('"parentBoneId":"b0"');
    expect(c).toContain('"length":60');
  });

  it('add_pose_keyframe passes the S12 breakdown options', () => {
    const c = codeGenerator.generateRigging({
      action: 'add_pose_keyframe', skeletonId: 's1', time: 1.5, pose: { b1: 45 },
      easing: 'easeInOut', favor: -0.3, breakdown: true, boneOffsets: { b1: 0.2 }, movingHold: true,
    });
    expect(c).toContain('R.addPoseKeyframe("s1", 1.5, {"b1":45}, "easeInOut"');
    expect(c).toContain('"favor":-0.3');
    expect(c).toContain('"breakdown":true');
    expect(c).toContain('"boneOffsets":{"b1":0.2}');
    expect(c).toContain('"movingHold":true');
  });

  it('accepts a saved-pose id string for pose', () => {
    const c = codeGenerator.generateRigging({ action: 'add_pose_keyframe', skeletonId: 's1', time: 0, pose: 'pose_1' });
    expect(c).toContain('R.addPoseKeyframe("s1", 0, "pose_1"');
  });

  it('set_target_path forwards waypoints + duration/loop', () => {
    const c = codeGenerator.generateRigging({
      action: 'set_target_path', skeletonId: 's1', chainId: 'c1',
      waypoints: [{ x: 0, y: 0 }, { x: 50, y: 50 }], duration: 2, loop: true,
    });
    expect(c).toContain('R.setTargetPath("s1", "c1"');
    expect(c).toContain('"duration":2');
    expect(c).toContain('"loop":true');
  });

  it('save_pose / save_shape_key / create_ik_chain emit their calls', () => {
    expect(codeGenerator.generateRigging({ action: 'save_pose', skeletonId: 's1', name: 'idle' })).toContain('R.savePose("s1", "idle")');
    expect(codeGenerator.generateRigging({ action: 'save_shape_key', skeletonId: 's1' })).toContain('R.saveShapeKey("s1", null)');
    expect(codeGenerator.generateRigging({ action: 'create_ik_chain', skeletonId: 's1', boneIds: ['b1', 'b2'], solverType: 'ccd' })).toContain('R.createIKChain("s1"');
  });
});

describe('rigging vocabulary reconciliation', () => {
  it('adds the S12 breakdown-pose + base rigging types', () => {
    for (const t of ['pp:Pose', 'pp:BreakdownPose', 'pp:TimingCurve', 'pp:PoseOverlap', 'pp:MovingHold', 'pp:IKTargetPath', 'pp:ShapeKey', 'pp:IKChain', 'pp:Glyph']) {
      expect(PP_VOCABULARY.types[t]).toBeDefined();
    }
    expect(PP_VOCABULARY.types['pp:BreakdownPose'].parentType).toBe('pp:Pose');
  });

  it('points rigging mcpTool refs at pinepaper_rigging (no dangling create_skeleton/attach refs)', () => {
    expect(PP_VOCABULARY.types['pp:Skeleton'].mcpTool).toBe('pinepaper_rigging');
    expect(PP_VOCABULARY.types['pp:Bone'].mcpTool).toBe('pinepaper_rigging');
    expect((PP_VOCABULARY.edges['pp:boneAttached'] as any).mcpToolRef).toBe('pinepaper_rigging');
  });
});
