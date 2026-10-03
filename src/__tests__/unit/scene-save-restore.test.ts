/**
 * pinepaper_export_scene full / pinepaper_import_scene (D28). The summary
 * returned success while dropping every keyframe track, under a description
 * that promised "later restoration". The restorable path is the engine's
 * project document (captureProjectDocument / loadProjectDocument), never
 * exportProjectJSON, which the engine documents as dropping relations,
 * rigging and scene chains.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { ExportSceneInputSchema, ImportSceneInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = new PinePaperCodeGenerator();

describe('scene save / restore', () => {
  it('the summary says, in its result, that it is not a backup', () => {
    expect(gen.generateExportScene()).toContain('cannot be restored');
  });

  it('a full save uses the project document, not the lossy Paper tree export', () => {
    const code = gen.generateCaptureProject('film');
    expect(code).toContain('app.captureProjectDocument({"name":"film"})');
    expect(code).not.toContain('exportProjectJSON');
    expect(code).toContain('__ppSceneCounts()');
  });

  it('import loads the staged document through the validating loader', () => {
    const code = gen.generateLoadProject(true);
    expect(code).toContain('window.__ppStage && window.__ppStage.projectDoc');
    expect(code).toContain('app.loadProjectDocument(__doc, { strict: true })');
    expect(code).toContain("__doc.kind !== 'pinepaper.project'");
    expect(code).not.toContain('importProjectJSON');
  });

  it('import is marked destructive (it replaces the scene); export stays read-only', () => {
    const imp = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_import_scene') as any;
    const exp = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_export_scene') as any;
    expect(imp.annotations.destructiveHint).toBe(true);
    expect(exp.annotations.readOnlyHint).toBe(true);
    expect(ImportSceneInputSchema.safeParse({}).success).toBe(false);
    expect(ExportSceneInputSchema.safeParse({ full: true }).success).toBe(true);
  });
});
