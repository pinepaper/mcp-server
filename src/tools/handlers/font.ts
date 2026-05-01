/**
 * Font Studio tool handlers — extracted from src/tools/handlers.ts.
 * All handlers are pure string-interpolation delegations to app.fontStudio.*;
 * no Zod schemas or codeGenerator dependencies, which is why this is a
 * straightforward extraction.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeOrGenerate, type HandlerOptions } from '../handlers.js';

export type FontHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const fontHandlers: Record<string, FontHandler> = {
  pinepaper_font_show_studio: async (_args, options) => {
    const code = `app.fontStudio && app.fontStudio.show ? app.fontStudio.show() : null;`;
    return executeOrGenerate(code, 'Opens Font Studio UI', options, 'pinepaper_font_show_studio');
  },

  pinepaper_font_set_name: async (args, options) => {
    const { name } = args as { name: string };
    const code = `app.fontStudio.setName(${JSON.stringify(name)});`;
    return executeOrGenerate(code, `Set font name to "${name}"`, options, 'pinepaper_font_set_name');
  },

  pinepaper_font_get_required_chars: async (args, options) => {
    const { set } = args as { set?: string };
    const setArg = set ? JSON.stringify(set) : '"minimum"';
    const code = `app.fontStudio.getRequiredChars(${setArg});`;
    return executeOrGenerate(code, `Get required characters (${set || 'minimum'} set)`, options, 'pinepaper_font_get_required_chars');
  },

  pinepaper_font_get_status: async (_args, options) => {
    const code = `app.fontStudio.getStatus();`;
    return executeOrGenerate(code, 'Get font completion status', options, 'pinepaper_font_get_status');
  },

  pinepaper_font_create_glyph: async (args, options) => {
    const { character, pathId } = args as { character: string; pathId: string };
    const code = `app.fontStudio.createGlyph(${JSON.stringify(character)}, ${JSON.stringify(pathId)});`;
    return executeOrGenerate(code, `Create glyph for "${character}" from path ${pathId}`, options, 'pinepaper_font_create_glyph');
  },

  pinepaper_font_create_space: async (args, options) => {
    const { width } = args as { width?: number };
    const code = width !== undefined
      ? `app.fontStudio.createSpace(${width});`
      : `app.fontStudio.createSpace();`;
    return executeOrGenerate(code, `Create space glyph${width ? ` (width: ${width})` : ''}`, options, 'pinepaper_font_create_space');
  },

  pinepaper_font_remove_glyph: async (args, options) => {
    const { character } = args as { character: string };
    const code = `app.fontStudio.removeGlyph(${JSON.stringify(character)});`;
    return executeOrGenerate(code, `Remove glyph for "${character}"`, options, 'pinepaper_font_remove_glyph');
  },

  pinepaper_font_set_metrics: async (args, options) => {
    const metrics = args as { unitsPerEm?: number; ascender?: number; descender?: number; xHeight?: number; capHeight?: number };
    const code = `app.fontStudio.setMetrics(${JSON.stringify(metrics)});`;
    return executeOrGenerate(code, 'Set font metrics', options, 'pinepaper_font_set_metrics');
  },

  pinepaper_font_export: async (args, options) => {
    const { download } = args as { download?: boolean };
    const code = download === false
      ? `app.fontStudio.export({ download: false });`
      : `app.fontStudio.export();`;
    return executeOrGenerate(code, 'Export font as OTF', options, 'pinepaper_font_export');
  },

  pinepaper_font_load_into_document: async (_args, options) => {
    const code = `app.fontStudio.loadIntoDocument();`;
    return executeOrGenerate(code, 'Load font into document', options, 'pinepaper_font_load_into_document');
  },

  pinepaper_font_export_data: async (args, options) => {
    const { download } = args as { download?: boolean };
    const code = download === false
      ? `app.fontStudio.exportData({ download: false });`
      : `app.fontStudio.exportData();`;
    return executeOrGenerate(code, 'Export font data as JSON', options, 'pinepaper_font_export_data');
  },

  pinepaper_font_import_data: async (args, options) => {
    const { data } = args as { data: object };
    const code = `app.fontStudio.importData(${JSON.stringify(data)});`;
    return executeOrGenerate(code, 'Import font data from JSON', options, 'pinepaper_font_import_data');
  },

  pinepaper_font_clear: async (_args, options) => {
    const code = `app.fontStudio.clear();`;
    return executeOrGenerate(code, 'Clear all glyphs and reset font', options, 'pinepaper_font_clear');
  },

  pinepaper_font_remove_overlap: async (args, options) => {
    const { pathId } = args as { pathId: string };
    const code = `app.fontStudio.removeOverlap(${JSON.stringify(pathId)});`;
    return executeOrGenerate(code, `Remove overlaps from path ${pathId}`, options, 'pinepaper_font_remove_overlap');
  },

  pinepaper_font_correct_direction: async (args, options) => {
    const { pathId } = args as { pathId: string };
    const code = `app.fontStudio.correctDirection(${JSON.stringify(pathId)});`;
    return executeOrGenerate(code, `Correct path direction for ${pathId}`, options, 'pinepaper_font_correct_direction');
  },

  pinepaper_font_cleanup_path: async (args, options) => {
    const { pathId, removeOverlap, correctDirection, smooth, smoothTolerance } = args as {
      pathId: string;
      removeOverlap?: boolean;
      correctDirection?: boolean;
      smooth?: boolean;
      smoothTolerance?: number;
    };
    const optsObj: Record<string, unknown> = {};
    if (removeOverlap !== undefined) optsObj.removeOverlap = removeOverlap;
    if (correctDirection !== undefined) optsObj.correctDirection = correctDirection;
    if (smooth !== undefined) optsObj.smooth = smooth;
    if (smoothTolerance !== undefined) optsObj.smoothTolerance = smoothTolerance;
    const hasOpts = Object.keys(optsObj).length > 0;
    const code = hasOpts
      ? `app.fontStudio.cleanupPath(${JSON.stringify(pathId)}, ${JSON.stringify(optsObj)});`
      : `app.fontStudio.cleanupPath(${JSON.stringify(pathId)});`;
    return executeOrGenerate(code, `Cleanup path ${pathId}`, options, 'pinepaper_font_cleanup_path');
  },
};
