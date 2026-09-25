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
import { emitEnsureFont } from '../../types/code-generator.js';

export type FontHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

async function dispatchFontAction(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'check': {
      const { name, text } = args as { name?: string; text?: string };
      if (typeof name !== 'string' || !name) {
        return errorResult(ErrorCodes.INVALID_INPUT, 'font check requires { name } — the font family to test.');
      }
      // INSTALLED and CAN-DRAW-MY-STRING are different answers, and the second
      // is the one that decides the pixels. A font with four glyphs is present
      // and will still render most text in the fallback face — which is the
      // shape Font Studio produces, and the shape a naive probe gets wrong.
      const code = `(async function() {
  if (typeof app.checkFont !== 'function') {
    return { success: false, error: 'app.checkFont unavailable — update the studio. document.fonts.check() is not a substitute: it returns true for a family that does not exist.' };
  }
  const r = app.checkFont(${JSON.stringify(name)}${text !== undefined ? `, ${JSON.stringify(text)}` : ''});
  // "Unavailable" read as "cannot be used" — while create_item then loaded and
  // drew the same family (Caveat). Unavailable here means NOT LOADED YET; say
  // whether this studio can load it, and how.
  if (r && r.available === false) {
    r.loadable = 'unknown until tried';
    if (typeof app.listFonts === 'function') {
      try {
        const l = await app.listFonts({});
        const fam = ${JSON.stringify(name.split(',')[0].trim().replace(/^['"]|['"]$/g, ''))}.toLowerCase();
        const hit = l && Array.isArray(l.families) && l.families.find(function(f) { return String(f.name || f.family || '').toLowerCase() === fam; });
        if (hit) r.loadable = 'yes — in the studio catalogue';
      } catch (_) { /* keep unknown */ }
    }
    r.hint = 'not loaded yet. create_item / modify_item load a family on first use, or call pinepaper_font {action:"load", name} to load it now (studio catalogue first, then Google Fonts).';
  }
  return { success: true, ...r };
})();`;
      return executeOrGenerate(code, `Check font "${name}"${text ? ' against the given text' : ''}`, options, 'pinepaper_font');
    }
    case 'load': {
      // A way to LOAD a family, not just ask about it (round 7 X): the check
      // said "load it first" and there was no action that could. Same loader
      // create_item uses — studio catalogue, then Google Fonts.
      const { name } = args as { name?: string };
      if (typeof name !== 'string' || !name.trim()) {
        return errorResult(ErrorCodes.INVALID_INPUT, 'font load requires { name } — the font family to load.');
      }
      const code = `(async function() {
  if (typeof app.checkFont !== 'function') {
    return { success: false, error: 'app.checkFont unavailable — update the studio.' };
  }${emitEnsureFont(name)}
  if (__font && __font.available === false) return { success: false, action: 'load', ...__font, error: __font.warning };
  return { success: true, action: 'load', family: ${JSON.stringify(name)}, available: true, ...(__font || { alreadyLoaded: true }) };
})();`;
      return executeOrGenerate(code, `Load font "${name}"`, options, 'pinepaper_font');
    }
    case 'fallbacks': {
      // Which text items are SILENTLY drawing in something other than what
      // they asked for — the failure nobody notices until the export.
      const code = `(function() {
  if (typeof app.fontFallbacks !== 'function') {
    return { success: false, error: 'app.fontFallbacks unavailable — update the studio.' };
  }
  const items = app.fontFallbacks();
  return { success: true, fallingBack: items, count: Array.isArray(items) ? items.length : 0 };
})();`;
      return executeOrGenerate(code, 'Find text items rendering in a fallback font', options, 'pinepaper_font');
    }
    case 'list_available': {
      const { category, loadedOnly } = args as { category?: string; loadedOnly?: boolean };
      const opts: Record<string, unknown> = {};
      if (category) opts.category = category;
      if (loadedOnly) opts.loadedOnly = true;
      // Guarded: listFonts is newer than some studios. Everything else in this
      // tool authors a font; this is the one action that answers "what can I
      // already use", which previously had no answer short of reading source.
      const code = `(async function() {
  if (typeof app.listFonts !== 'function') {
    return { success: false, error: 'app.listFonts unavailable — update the studio. Font families can still be SET by name on a text item; this action only lists them.' };
  }
  const r = await app.listFonts(${JSON.stringify(opts)});
  return { success: true, ...r };
})();`;
      return executeOrGenerate(code, 'List available font families', options, 'pinepaper_font');
    }
    case 'show_studio': {
      // FontStudio has no `show`. The panel is FontStudioUI's, and nothing on
      // the app facade opens it — the old call resolved to null and reported
      // success, so an agent believed it had opened a UI that never appeared.
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        'show_studio cannot be driven from here: opening the Font Studio panel is a UI action with no engine entry point. '
        + 'Every other font action works headlessly — create_glyph, set_name, get_status, export — so build the font through those '
        + 'and open the panel by hand in the studio if you want to look at it.',
      );
    }
    case 'set_name': {
      const { name } = args as { name: string };
      if (typeof name !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font set_name requires { name: string }');
      const code = `app.fontStudio.setFontName(${JSON.stringify(name)});`;
      return executeOrGenerate(code, `Set font name to "${name}"`, options, 'pinepaper_font');
    }
    case 'get_required_chars': {
      const { set } = args as { set?: string };
      const setArg = set ? JSON.stringify(set) : '"minimum"';
      const code = `app.fontStudio.getRequiredCharacters(${setArg});`;
      return executeOrGenerate(code, `Get required characters (${set || 'minimum'} set)`, options, 'pinepaper_font');
    }
    case 'get_status': {
      const code = `app.fontStudio.getCompletionStatus();`;
      return executeOrGenerate(code, 'Get font completion status', options, 'pinepaper_font');
    }
    case 'create_glyph': {
      const { character, pathId } = args as { character: string; pathId: string };
      if (typeof character !== 'string' || typeof pathId !== 'string') {
        return errorResult(ErrorCodes.INVALID_INPUT, 'font create_glyph requires { character, pathId }');
      }
      // createGlyph(char, paperPath) wants the PAPER PATH — it clones it and
      // reads .bounds and .curves. This passed the registry id string, so the
      // engine read .curves off a string and built a glyph from nothing.
      const code = `(function() {
  const _item = app.getItemById(${JSON.stringify(pathId)});
  if (!_item) { return { success: false, error: 'no item ${pathId} — create_glyph needs the id of a PATH already on the canvas' }; }
  if (typeof _item.clone !== 'function' || !_item.curves) {
    return { success: false, error: 'item ${pathId} is a ' + (_item.className || 'non-path') + '; create_glyph needs a path. Convert it first, or break a group apart and pass one of its paths.' };
  }
  return app.fontStudio.createGlyph(${JSON.stringify(character)}, _item);
})();`;
      return executeOrGenerate(code, `Create glyph for "${character}" from path ${pathId}`, options, 'pinepaper_font');
    }
    case 'create_space': {
      const { width } = args as { width?: number };
      const code = width !== undefined
        ? `app.fontStudio.createSpaceGlyph(${width});`
        : `app.fontStudio.createSpaceGlyph();`;
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
      // Two methods, not one with a flag: exportAsOTF() builds and RETURNS the
      // font, downloadFont() builds and hands it to the browser. `export()` has
      // never existed on FontStudio, so every export action failed with
      // "Cannot read properties of undefined".
      const code = download === false
        ? `app.fontStudio.exportAsOTF();`
        : `app.fontStudio.downloadFont('otf');`;
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
        `Unknown font action "${action}". Valid: check, load, fallbacks, list_available, show_studio, set_name, get_required_chars, get_status, create_glyph, create_space, remove_glyph, set_metrics, export, load_into_document, export_data, import_data, clear, remove_overlap, correct_direction, cleanup_path.`,
      );
  }
}

export const fontHandlers: Record<string, FontHandler> = {
  pinepaper_font: dispatchFontAction,
};
