/**
 * Font Studio handler — single action-dispatched tool replacing 16 thin
 * wrappers (per the v1.5.4 critical-review consolidation). Every action
 * is a one-liner against app.fontStudio.<method>(...) — bundling them
 * into one tool slot trims ~15 entries from the tool listing without
 * losing capability.
 */

import type { CallToolResult } from '../../mcp/index.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { errorResult, executeOrGenerate, getExecutionMode, type HandlerOptions } from '../handlers.js';
import { getBrowserController } from '../../browser/puppeteer-controller.js';
import { getExportDir, exportFileLink } from '../../utils/export-dir.js';
import { ErrorCodes } from '../../types/schemas.js';
import { emitEnsureFont } from '../../types/code-generator.js';
import { jsLiteral } from '../../utils/js-literal.js';

export type FontHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

/** The font as bytes the page can hand back: an ArrayBuffer does not survive the trip out of the page, base64 does. */
const FONT_OTF_CODE = `(function() {
  var fs = app.fontStudio;
  if (!fs || typeof fs.exportAsOTF !== 'function') return { success: false, error: 'app.fontStudio.exportAsOTF unavailable — update the studio.' };
  var buf = fs.exportAsOTF();
  var u8 = new Uint8Array(buf && buf.buffer ? buf.buffer : buf);
  if (!u8.length) return { success: false, error: 'the font compiled to no bytes — add glyphs with create_glyph first (see get_status).' };
  var bin = '';
  for (var i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { success: true, fontName: fs.fontName || 'font', glyphs: fs.glyphs && typeof fs.glyphs.size === 'number' ? fs.glyphs.size : null, bytes: u8.length, base64: btoa(bin) };
})();`;

const FONT_JSON_CODE = `(function() {
  var fs = app.fontStudio;
  if (!fs || typeof fs.exportData !== 'function') return { success: false, error: 'app.fontStudio.exportData unavailable — update the studio.' };
  var data = fs.exportData();
  return { success: true, fontName: fs.fontName || 'font', glyphs: data && data.glyphs ? Object.keys(data.glyphs).length : null, json: JSON.stringify(data) };
})();`;

/** Largest font returned inline as well as on disk when the caller passes download: false. */
const FONT_INLINE_MAX_BYTES = 256 * 1024;

/**
 * export / export_data (FACEEXPORT170). Both answered success with nothing in the reply: the generated code was a
 * bare statement, so its value was dropped, and the default branch asked the browser for a download, which a headless
 * studio sends nowhere. The font is now built in the page, carried out as text, and written to the export folder by
 * the server, so the reply names a file that exists. `download: false` also returns the content in the reply.
 */
async function exportFontFile(kind: 'otf' | 'json', args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const code = kind === 'otf' ? FONT_OTF_CODE : FONT_JSON_CODE;
  const label = kind === 'otf' ? 'Export font as OTF' : 'Export font data as JSON';
  if ((options.executionMode ?? getExecutionMode()) === 'code' || !options.executeInBrowser) {
    return executeOrGenerate(code, label, options, 'pinepaper_font');
  }
  const controller = options.browserController || getBrowserController();
  if (!controller.connected) {
    try { await controller.connect(); } catch (e) {
      return errorResult(ErrorCodes.BROWSER_NOT_CONNECTED, `could not start the browser: ${e instanceof Error ? e.message : String(e)}`, {}, { toolName: 'pinepaper_font' });
    }
  }
  const run = await controller.executeCode(code, false);
  const r = run.result as { success?: boolean; error?: string; fontName?: string; glyphs?: number | null; bytes?: number; base64?: string; json?: string } | undefined;
  if (!run.success || !r || r.success !== true) {
    return errorResult(ErrorCodes.EXECUTION_ERROR, `font ${kind === 'otf' ? 'export' : 'export_data'} failed: ${r?.error || run.error || 'the studio returned nothing'}`, {}, { toolName: 'pinepaper_font' });
  }
  const content = kind === 'otf' ? Buffer.from(r.base64 || '', 'base64') : Buffer.from(r.json || '', 'utf8');
  if (!content.length || (kind === 'otf' && content.length !== r.bytes)) {
    return errorResult(ErrorCodes.EXECUTION_ERROR, `font ${kind === 'otf' ? 'export' : 'export_data'} failed: ${content.length} bytes arrived from the studio${kind === 'otf' ? `, ${r.bytes} were built` : ''}. No file was written.`, {}, { toolName: 'pinepaper_font' });
  }
  const safe = String(r.fontName || 'font').replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^[._]+/, '').slice(0, 60) || 'font';
  const dir = getExportDir();
  await mkdir(dir, { recursive: true });
  const filePath = join(dir, `${safe}_${Date.now()}.${kind}`);
  await writeFile(filePath, content);
  const inline = args.download === false && content.length <= FONT_INLINE_MAX_BYTES;
  const result: Record<string, unknown> = {
    success: true,
    format: kind,
    fontName: r.fontName,
    ...(typeof r.glyphs === 'number' ? { glyphs: r.glyphs } : {}),
    filePath,
    fileSize: content.length,
    ...(kind === 'otf' ? { signature: content.subarray(0, 4).toString('latin1') } : {}),
    ...(inline ? (kind === 'otf' ? { base64: r.base64 } : { data: JSON.parse(r.json || 'null') }) : {}),
    ...(args.download === false && !inline ? { note: `the content is over ${FONT_INLINE_MAX_BYTES} bytes, so it is in the file only` } : {}),
  };
  return {
    structuredContent: result,
    content: [
      { type: 'text' as const, text: `${kind === 'otf' ? 'Font' : 'Font data'} saved to file:\n\nFile: ${filePath}\nFormat: ${kind}\nSize: ${content.length} bytes\n\nResult: ${JSON.stringify(result, null, 2)}` },
      exportFileLink(filePath, content.length),
    ],
  };
}

async function dispatchFontAction(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  // `family` / `fontFamily` are what create_item and CSS call it; `name` is
  // this tool's word. check and load said "requires { name }" to a caller who
  // had passed the family under its usual name (round 7 retest, 1.62).
  if (args.name === undefined && (typeof args.family === 'string' || typeof args.fontFamily === 'string')) {
    args = { ...args, name: (args.family ?? args.fontFamily) as string };
  }
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
  // LOADED, BUT DRAWS NONE OF THIS TEXT (CHECKCOVER37). The studio measures availability against the text given, so a
  // loaded family (Anton) checked against characters it has no glyphs for came back available: false, which this tool
  // calls "not loaded yet". Checked again without the text: if the family is loaded, that is what is said.
  if (r && r.available === false && ${text !== undefined ? 'true' : 'false'} && typeof r.covered === 'string' && r.covered === '') {
    const bare = app.checkFont(${JSON.stringify(name)});
    if (bare && bare.available === true) {
      r.available = true;
      r.drawsText = false;
      r.note = r.family + ' is loaded, but has no glyph for any of these characters (' + (r.missing || '') + '), so all of them render in the fallback face.';
      delete r.reason;
    }
  }
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
      // A face still downloading measures as a fallback, so this listed fonts
      // that were merely LOADING (round 8 DD, 1.69). Wait for the fonts in
      // flight first — bounded, so a stalled download cannot hang the call.
      const code = `(async function() {
  if (typeof app.fontFallbacks !== 'function') {
    return { success: false, error: 'app.fontFallbacks unavailable — update the studio.' };
  }
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await Promise.race([document.fonts.ready, new Promise(function(r) { setTimeout(r, 5000); })]);
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
      const code = `(function() { return app.fontStudio.setFontName(${jsLiteral(name)}); })();`;
      return executeOrGenerate(code, `Set font name to "${name}"`, options, 'pinepaper_font');
    }
    case 'get_required_chars': {
      const { set } = args as { set?: string };
      const setArg = set ? jsLiteral(set) : '"minimum"';
      const code = `(function() { return app.fontStudio.getRequiredCharacters(${setArg}); })();`;
      return executeOrGenerate(code, `Get required characters (${set || 'minimum'} set)`, options, 'pinepaper_font');
    }
    case 'get_status': {
      const code = `(function() { return app.fontStudio.getCompletionStatus(); })();`;
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
      const code = `(function() { return app.fontStudio.removeGlyph(${jsLiteral(character)}); })();`;
      return executeOrGenerate(code, `Remove glyph for "${character}"`, options, 'pinepaper_font');
    }
    case 'set_metrics': {
      const metrics = (args.metrics ?? args) as Record<string, unknown>;
      const cleanMetrics: Record<string, unknown> = {};
      for (const k of ['unitsPerEm', 'ascender', 'descender', 'xHeight', 'capHeight']) {
        if (metrics[k] !== undefined) cleanMetrics[k] = metrics[k];
      }
      const code = `(function() { return app.fontStudio.setMetrics(${jsLiteral(cleanMetrics)}); })();`;
      return executeOrGenerate(code, 'Set font metrics', options, 'pinepaper_font');
    }
    case 'export':
      return exportFontFile('otf', args, options);
    case 'load_into_document': {
      const code = `(function() { return app.fontStudio.loadIntoDocument(); })();`;
      return executeOrGenerate(code, 'Load font into document', options, 'pinepaper_font');
    }
    case 'export_data':
      return exportFontFile('json', args, options);
    case 'import_data': {
      const { data } = args as { data: object };
      if (!data || typeof data !== 'object') return errorResult(ErrorCodes.INVALID_INPUT, 'font import_data requires { data: object }');
      const code = `(function() { return app.fontStudio.importData(${jsLiteral(data)}); })();`;
      return executeOrGenerate(code, 'Import font data from JSON', options, 'pinepaper_font');
    }
    case 'clear': {
      const code = `(function() { return app.fontStudio.clear(); })();`;
      return executeOrGenerate(code, 'Clear all glyphs and reset font', options, 'pinepaper_font');
    }
    case 'remove_overlap': {
      const { pathId } = args as { pathId: string };
      if (typeof pathId !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font remove_overlap requires { pathId }');
      const code = `(function() { return app.fontStudio.removeOverlap(${jsLiteral(pathId)}); })();`;
      return executeOrGenerate(code, `Remove overlaps from path ${pathId}`, options, 'pinepaper_font');
    }
    case 'correct_direction': {
      const { pathId } = args as { pathId: string };
      if (typeof pathId !== 'string') return errorResult(ErrorCodes.INVALID_INPUT, 'font correct_direction requires { pathId }');
      const code = `(function() { return app.fontStudio.correctDirection(${jsLiteral(pathId)}); })();`;
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
