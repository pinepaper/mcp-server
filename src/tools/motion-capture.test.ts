import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../types/code-generator.js';
import { getToolNames } from './definitions.js';

describe('pinepaper_import_motion_capture', () => {
  it('is registered in the tool surface', () => {
    expect(getToolNames()).toContain('pinepaper_import_motion_capture');
  });
  it('import mode calls importBVH and returns skeleton info', () => {
    const code = codeGenerator.generateImportMotionCapture({ bvh: 'HIERARCHY\nROOT Hips\n', mode: 'import', fps: 15 } as any);
    expect(code).toContain('app.importBVH');
    expect(code).not.toContain('app.retargetBVH');
    expect(code).toContain('poses');
  });
  it('retarget mode drives the named rig, never creating one', () => {
    const code = codeGenerator.generateImportMotionCapture({ bvh: 'HIERARCHY\n', mode: 'retarget', skeletonId: 'rig1' } as any);
    expect(code).toContain('app.retargetBVH');
    expect(code).toContain('rig1');
    expect(code).not.toContain('app.importBVH');
  });
  it('retarget WITHOUT skeletonId is rejected, not silently turned into an import', () => {
    expect(() => codeGenerator.generateImportMotionCapture({ bvh: 'x', mode: 'retarget' } as any)).toThrow(/skeletonId/);
  });
  it('surfaces unmatched bones so boneMap can be built from the failure', () => {
    const code = codeGenerator.generateImportMotionCapture({ bvh: 'x', mode: 'retarget', skeletonId: 'r' } as any);
    expect(code).toContain('unmatchedSource');
    expect(code).toContain('unmatchedTarget');
  });
  it('escapes BVH text rather than interpolating it raw', () => {
    const code = codeGenerator.generateImportMotionCapture({ bvh: "a'b\"c\n</script>", mode: 'import' } as any);
    expect(code).not.toContain("a'b\"c\n");
    expect(code).toContain('\\n');
  });
});
