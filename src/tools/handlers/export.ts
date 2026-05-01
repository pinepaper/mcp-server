/**
 * Export tool handlers — extracted from src/tools/handlers.ts.
 *
 * Three formats: SVG, training-data JSON/JSONL, full scene snapshot. The
 * camera-framing video export lives on pinepaper_agent_export and is not
 * part of this module (agent-export still in the main switch).
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeOrGenerate, getLocalizedSuccessMessage, type HandlerOptions } from '../handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import { ExportTrainingDataInputSchema } from '../../types/schemas.js';

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

  pinepaper_export_scene: async (_args, options) => {
    const code = codeGenerator.generateExportScene();
    return executeOrGenerate(code, 'Exports complete scene state', options, 'pinepaper_export_scene');
  },
};
