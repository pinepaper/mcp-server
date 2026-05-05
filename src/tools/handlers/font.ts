/**
 * Font Studio handler — single action-dispatched tool replacing 16 thin
 * wrappers (per the v1.5.4 critical-review consolidation). Every action
 * is a one-liner against app.fontStudio.<method>(...) — bundling them
 * into one tool slot trims ~15 entries from the tool listing without
 * losing capability.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { errorResult, executeOrGenerate, type HandlerOptions } from '../handlers.js';
import { ErrorCodes } from '../../types/schemas.js';

export type FontHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

async function dispatchFontAction(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'show_studio': {
      const code = `app.fontStudio && app.fontStudio.show ? app.fontStudio.show() : null;`;
      return executeOrGenerate(code, 'Opens Font Studio UI', options, 'pinepaper_font');
    }
    case 'set_name': {
      const { name } = args as { name: string };
      if (typeof name !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font set_name requires { name: string }');
      const code = `app.fontStudio.setName(${JSON.stringify(name)});`;
      return executeOrGenerate(code, `Set font name to "${name}"`, options, 'pinepaper_font');
    }
    case 'get_required_chars': {
      const { set } = args as { set?: string };
      const setArg = set ? JSON.stringify(set) : '"minimum"';
      const code = `app.fontStudio.getRequiredChars(${setArg});`;
      return executeOrGenerate(code, `Get required characters (${set || 'minimum'} set)`, options, 'pinepaper_font');
    }
    case 'get_status': {
      const code = `app.fontStudio.getStatus();`;
      return executeOrGenerate(code, 'Get font completion status', options, 'pinepaper_font');
    }
    case 'create_glyph': {
      const { character, pathId } = args as { character: string; pathId: string };
      if (typeof character !== 'string' || typeof pathId !== 'string') {
        return errorResult(ErrorCodes.INVALID_INPUT, 'font create_glyph requires { character, pathId }');
      }
      const code = `app.fontStudio.createGlyph(${JSON.stringify(character)}, ${JSON.stringify(pathId)});`;
      return executeOrGenerate(code, `Create glyph for "${character}" from path ${pathId}`, options, 'pinepaper_font');
    }
    case 'create_space': {
      const { width } = args as { width?: number };
      const code = width !== undefined
        ? `app.fontStudio.createSpace(${width});`
        : `app.fontStudio.createSpace();`;
      return executeOrGenerate(code, `Create space glyph${width ? ` (width: ${width})` : ''}`, options, 'pinepaper_font');
    }
    case 'remove_glyph': {
      const { character } = args as { character: string };
      if (typeof character !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font remove_glyph requires { character }');
      const code = `app.fontStudio.removeGlyph(${JSON.stringify(character)});`;
      return executeOrGenerate(code, `Remove glyph for "${character}"`, options, 'pinepaper_font');
    }
    case 'set_metrics': {
      const metrics = (args.metrics ?? args) as Record<string, unknown>;
      const cleanMetrics: Record<string, unknown> = {};
      for (const k of ['unitsPerEm', 'ascender', 'descender', 'xHeight', 'capHeight']) {
        if (metrics[k] !== undefined) cleanMetrics[k] = metrics[k];
      }
      const code = `app.fontStudio.setMetrics(${JSON.stringify(cleanMetrics)});`;
      return executeOrGenerate(code, 'Set font metrics', options, 'pinepaper_font');
    }
    case 'export': {
      const { download } = args as { download?: boolean };
      const code = download === false
        ? `app.fontStudio.export({ download: false });`
        : `app.fontStudio.export();`;
      return executeOrGenerate(code, 'Export font as OTF', options, 'pinepaper_font');
    }
    case 'load_into_document': {
      const code = `app.fontStudio.loadIntoDocument();`;
      return executeOrGenerate(code, 'Load font into document', options, 'pinepaper_font');
    }
    case 'export_data': {
      const { download } = args as { download?: boolean };
      const code = download === false
        ? `app.fontStudio.exportData({ download: false });`
        : `app.fontStudio.exportData();`;
      return executeOrGenerate(code, 'Export font data as JSON', options, 'pinepaper_font');
    }
    case 'import_data': {
      const { data } = args as { data: object };
      if (!data || typeof data !== 'object') return errorResult(ErrorCodes.INVALID_INPUT, 'font import_data requires { data: object }');
      const code = `app.fontStudio.importData(${JSON.stringify(data)});`;
      return executeOrGenerate(code, 'Import font data from JSON', options, 'pinepaper_font');
    }
    case 'clear': {
      const code = `app.fontStudio.clear();`;
      return executeOrGenerate(code, 'Clear all glyphs and reset font', options, 'pinepaper_font');
    }
    case 'remove_overlap': {
      const { pathId } = args as { pathId: string };
      if (typeof pathId !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font remove_overlap requires { pathId }');
      const code = `app.fontStudio.removeOverlap(${JSON.stringify(pathId)});`;
      return executeOrGenerate(code, `Remove overlaps from path ${pathId}`, options, 'pinepaper_font');
    }
    case 'correct_direction': {
      const { pathId } = args as { pathId: string };
      if (typeof pathId !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font correct_direction requires { pathId }');
      const code = `app.fontStudio.correctDirection(${JSON.stringify(pathId)});`;
      return executeOrGenerate(code, `Correct path direction for ${pathId}`, options, 'pinepaper_font');
    }
    case 'cleanup_path': {
      const { pathId, removeOverlap, correctDirection, smooth, smoothTolerance } = args as {
        pathId: string;
        removeOverlap?: boolean;
        correctDirection?: boolean;
        smooth?: boolean;
        smoothTolerance?: number;
      };
      if (typeof pathId !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font cleanup_path requires { pathId }');
      const optsObj: Record<string, unknown> = {};
      if (removeOverlap !== undefined) optsObj.removeOverlap = removeOverlap;
      if (correctDirection !== undefined) optsObj.correctDirection = correctDirection;
      if (smooth !== undefined) optsObj.smooth = smooth;
      if (smoothTolerance !== undefined) optsObj.smoothTolerance = smoothTolerance;
      const hasOpts = Object.keys(optsObj).length > 0;
      const code = hasOpts
        ? `app.fontStudio.cleanupPath(${JSON.stringify(pathId)}, ${JSON.stringify(optsObj)});`
        : `app.fontStudio.cleanupPath(${JSON.stringify(pathId)});`;
      return executeOrGenerate(code, `Cleanup path ${pathId}`, options, 'pinepaper_font');
    }
    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown font action "${action}". Valid: show_studio, set_name, get_required_chars, get_status, create_glyph, create_space, remove_glyph, set_metrics, export, load_into_document, export_data, import_data, clear, remove_overlap, correct_direction, cleanup_path.`,
      );
  }
}

export const fontHandlers: Record<string, FontHandler> = {
  pinepaper_font: dispatchFontAction,
};
