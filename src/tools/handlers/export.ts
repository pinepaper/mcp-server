/**
 * Export tool handlers — extracted from src/tools/handlers.ts.
 *
 * Three formats: SVG, training-data JSON/JSONL, full scene snapshot. The
 * camera-framing video export lives on pinepaper_agent_export and is not
 * part of this module (agent-export still in the main switch).
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { executeOrGenerate, getLocalizedSuccessMessage, getExportDir, errorResult, type HandlerOptions } from '../handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import { ExportTrainingDataInputSchema, ExportSceneInputSchema, ImportSceneInputSchema, ErrorCodes } from '../../types/schemas.js';
import { getBrowserController } from '../../browser/puppeteer-controller.js';
import { getExecutionMode } from '../handlers.js';

/** A project document over this size is refused on import rather than staged. */
const MAX_PROJECT_BYTES = 200 * 1024 * 1024;

export type ExportHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const exportHandlers: Record<string, ExportHandler> = {
  pinepaper_export_svg: async (_args, options) => {
    const code = codeGenerator.generateExportSVG();
    const description = getLocalizedSuccessMessage(options.i18n, 'exported', { format: 'SVG' });
    return executeOrGenerate(code, description, options, 'pinepaper_export_svg');
  },

  pinepaper_export_training_data: async (args, options) => {
    const input = ExportTrainingDataInputSchema.parse(args);
    const code = codeGenerator.generateExportTrainingData(input.format, input.includeMetadata);
    const description = getLocalizedSuccessMessage(options.i18n, 'exported', {
      format: input.format?.toUpperCase() || 'JSON',
    });
    return executeOrGenerate(code, description, options, 'pinepaper_export_training_data');
  },

  pinepaper_export_scene: async (args, options) => {
    const input = ExportSceneInputSchema.parse(args ?? {});
    if (!input.full) {
      const code = codeGenerator.generateExportScene();
      return executeOrGenerate(code, 'Scene summary (for inspection; not restorable)', options, 'pinepaper_export_scene');
    }
    // A RESTORABLE SAVE (D28). The summary returned success while dropping
    // every keyframe track (238 animated items of 337 in a 15 s film), and
    // its description promised "later restoration". The engine's project
    // document is the format; it can be megabytes, so it goes to a file.
    const code = codeGenerator.generateCaptureProject(input.name);
    const mode = options.executionMode ?? getExecutionMode();
    if (mode === 'code' || !options.executeInBrowser) {
      return executeOrGenerate(code, 'Capture a project document', options, 'pinepaper_export_scene');
    }
    const controller = options.browserController || getBrowserController();
    if (!controller.connected) {
      try { await controller.connect(); } catch { return executeOrGenerate(code, 'Capture a project document', options, 'pinepaper_export_scene'); }
    }
    const run = await controller.executeCode(code, false, { governorTimeoutMs: 120_000 });
    const v = (run.result ?? {}) as { success?: boolean; error?: string; json?: string; counts?: Record<string, unknown> };
    if (!run.success || v.success === false || typeof v.json !== 'string') {
      return errorResult(ErrorCodes.EXECUTION_ERROR, run.error || v.error || 'the project document could not be captured', { code }, { toolName: 'pinepaper_export_scene' });
    }
    const dir = getExportDir();
    await mkdir(dir, { recursive: true });
    const filePath = join(dir, `pinepaper_project_${Date.now()}.json`);
    await writeFile(filePath, v.json, 'utf-8');
    const result = { success: true, filePath, bytes: Buffer.byteLength(v.json), counts: v.counts, restore: `pinepaper_import_scene { path: "${filePath}" }` };
    return { content: [{ type: 'text' as const, text: `Project saved: ${filePath}\n\n${JSON.stringify(result, null, 2)}` }] };
  },

  pinepaper_import_scene: async (args, options) => {
    const input = ImportSceneInputSchema.parse(args);
    const path = resolve(input.path.replace(/^file:\/\//, ''));
    let text: string;
    try {
      const st = await stat(path);
      if (st.size > MAX_PROJECT_BYTES) {
        return errorResult(ErrorCodes.EXECUTION_ERROR, `${path} is ${(st.size / 1048576).toFixed(0)} MB, over the ${MAX_PROJECT_BYTES / 1048576} MB import limit.`, {}, { toolName: 'pinepaper_import_scene' });
      }
      text = await readFile(path, 'utf-8');
    } catch (e) {
      return errorResult(ErrorCodes.EXECUTION_ERROR, `could not read ${path}: ${e instanceof Error ? e.message : String(e)}`, {}, { toolName: 'pinepaper_import_scene' });
    }
    // REFUSE A FOREIGN FILE BEFORE THE CANVAS IS TOUCHED (gate A2d, 1.6.19).
    // loadProjectDocument also accepts legacy shapes (a bare snapshot, raw
    // Paper JSON), so {"foo":1,"items":[]} passed its validation, loaded as an
    // empty scene and wiped the canvas with success:true. Only the document a
    // full export writes (kind "pinepaper.project") is restored here.
    let doc: { kind?: unknown; formatVersion?: unknown } | null = null;
    try { doc = JSON.parse(text); } catch {
      return errorResult(ErrorCodes.VALIDATION_ERROR, `${path} is not a PinePaper scene file (not JSON). Save one with pinepaper_export_scene { full: true }.`, {}, { toolName: 'pinepaper_import_scene' });
    }
    if (!doc || typeof doc !== 'object' || doc.kind !== 'pinepaper.project' || typeof doc.formatVersion !== 'string') {
      return errorResult(ErrorCodes.VALIDATION_ERROR, `${path} is not a PinePaper scene file (no "kind": "pinepaper.project" marker). Nothing was changed. Save one with pinepaper_export_scene { full: true }.`, {}, { toolName: 'pinepaper_import_scene' });
    }
    // Staged beside the code, never inlined: a megabyte document inside the
    // generated code is what makes the governor's transform bail.
    const code = codeGenerator.generateLoadProject(input.strict !== false);
    return executeOrGenerate(code, `Load project document ${path}`, options, 'pinepaper_import_scene', { projectDoc: text });
  },
};
