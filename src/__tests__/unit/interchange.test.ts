/**
 * pinepaper_interchange — the formats other tools read and write.
 *
 * pinepaper_agent_export covers the platform formats. These are the
 * interchange ones, and they had no tool at all: a Lottie an app plays, a GLB
 * a 3D tool opens, a BVH a rig imports, a PNG sequence an editor ingests.
 *
 * The reason this needs care rather than a passthrough: exportGLB and
 * exportBVH refuse through console.warn and a falsy return, and the production
 * build strips the console. Over MCP that is a silent nothing.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { InterchangeInputSchema } from '../../types/schemas.js';

const gen = (input: Record<string, unknown>) =>
  codeGenerator.generateInterchange(InterchangeInputSchema.parse(input));

describe('each format reaches its own facade, guarded', () => {
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ action: 'export_lottie' }, 'app.exportLottie({})'],
    [{ action: 'export_dotlottie' }, 'app.exportDotLottie({})'],
    [{ action: 'import_lottie', data: '{"v":"5"}' }, 'app.importLottie('],
    [{ action: 'export_glb' }, 'app.exportGLB({})'],
    [{ action: 'export_bvh', skeletonId: 'sk1' }, 'app.exportBVH("sk1", {})'],
    [{ action: 'export_png_sequence' }, 'app.exportPNGSequence({})'],
  ];
  for (const [input, call] of cases) {
    it(`${input.action} → ${call.split('(')[0]}`, () => {
      const code = gen(input);
      expect(code).toContain(call);
      expect(code).toContain('update FxTool');
      expect(() => new Function(code)).not.toThrow();
    });
  }
});

describe('the preconditions the engine only writes to a stripped console', () => {
  it('GLB checks for perspective objects BEFORE calling, and names the fix', () => {
    const code = gen({ action: 'export_glb' });
    expect(code).toContain("has('threeD')");
    expect(code).toContain('no perspective objects to export');
    expect(code).toContain('createObject3D');
  });

  it('BVH checks for a rig BEFORE calling, and names the tool that makes one', () => {
    const code = gen({ action: 'export_bvh', skeletonId: 'sk1' });
    expect(code).toContain("has('riggingSystem')");
    expect(code).toContain('no rig to export');
    expect(code).toContain('pinepaper_rigging');
  });

  it('every export treats a falsy return as a failure, not an empty success', () => {
    // The shared failure mode: a stripped console.warn plus a falsy return
    // reads as "it worked and there was nothing to write".
    for (const input of [
      { action: 'export_lottie' }, { action: 'export_dotlottie' },
      { action: 'export_glb' }, { action: 'export_bvh', skeletonId: 's' },
      { action: 'export_png_sequence' }, { action: 'import_lottie', data: '{}' },
    ]) {
      expect(gen(input)).toContain('success: false');
    }
  });
});

describe('the schema refuses an incomplete call', () => {
  it('import needs data, and a BVH needs its skeleton', () => {
    expect(InterchangeInputSchema.safeParse({ action: 'import_lottie' }).success).toBe(false);
    const bvh = InterchangeInputSchema.safeParse({ action: 'export_bvh' });
    expect(bvh.success).toBe(false);
    if (!bvh.success) expect(JSON.stringify(bvh.error.issues)).toContain("one skeleton");
  });

  it('the plain exports need nothing', () => {
    for (const action of ['export_lottie', 'export_dotlottie', 'export_glb', 'export_png_sequence']) {
      expect(InterchangeInputSchema.safeParse({ action }).success).toBe(true);
    }
  });
});
