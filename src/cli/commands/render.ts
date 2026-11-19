/**
 * `pinepaper-mcp render [file-or-dir]` — Compile and export a PinePaper scene or batch
 * into MP4, WebM, GIF, APNG, SVG, PNG, PDF, or standalone HTML.
 */

import { copyFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { sha256OfFile } from '../../tools/export-file-receipt.js';
import { handleToolCall } from '../../tools/handlers.js';
import { boolFlag, numFlag, strFlag } from '../args.js';
import { emitJson, extractToolJson, resolveSceneInput, type ResolvedSceneInput } from '../output.js';
import { loadSceneIntoStudio, withCliBrowser } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const SUPPORTED_FORMATS = new Set(['mp4', 'webm', 'gif', 'apng', 'svg', 'png', 'pdf', 'html']);

const HELP = `PinePaper Render

Build and export a PinePaper project folder, .batch.json, or .pinepaper.json file.

USAGE:
  pinepaper-mcp render [file-or-dir] [options]

OPTIONS:
  -o, --output <path>       Output file path (defaults to pinepaper.json export.output or renders/<name>.<ext>)
  -f, --format <fmt>        mp4 (default), webm, gif, apng, svg, png, pdf, html
  --platform <preset>       Target platform preset (auto, youtube, tiktok, instagram-post, etc.)
  --fps <n>                 Frame rate for video exports (e.g. 30, 60, 29.97)
  --duration <sec>          Video duration in seconds
  --quality <lvl>           draft (or low), standard (or medium), high
  --deterministic           Request deterministic frame timing & encode
  --audio-codec <any|aac>   Require AAC audio for MP4 (fails fast if unavailable)
  --allow-code              Allow custom relations/hooks in loaded scene
  --studio-url <url>        Override Studio URL
  --json                    Emit machine-readable JSON output
  -h, --help                Show help`;

function mapQuality(raw?: string): 'draft' | 'standard' | 'high' | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase();
  if (v === 'low' || v === 'draft') return 'draft';
  if (v === 'medium' || v === 'standard') return 'standard';
  if (v === 'high') return 'high';
  return undefined;
}

function defaultOutputPath(input: ResolvedSceneInput, format: string): string {
  const configured = input.projectConfig?.export?.output;
  if (configured && !strExtMismatch(configured, format)) {
    return resolve(input.dir, configured);
  }
  const base = basename(input.filePath).replace(/\.(batch|pinepaper)\.json$|\.json$/i, '') || 'output';
  return resolve(input.dir, 'renders', `${base}.${format}`);
}

function strExtMismatch(filePath: string, format: string): boolean {
  const lower = filePath.toLowerCase();
  return !lower.endsWith(`.${format}`);
}

export const renderCommand: CliCommand = {
  name: 'render',
  category: 'Quality & Rendering',
  summary: 'Export a PinePaper scene or batch to MP4, WebM, GIF, APNG, SVG, PNG, PDF, or HTML',
  usage: 'pinepaper-mcp render [file-or-dir] [-o out.mp4] [-f mp4|webm|svg|html] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, renderCommand, {
      output: { type: 'string', short: 'o' },
      format: { type: 'string', short: 'f' },
      platform: { type: 'string' },
      fps: { type: 'number' },
      duration: { type: 'number' },
      quality: { type: 'string' },
      deterministic: { type: 'boolean' },
      'audio-codec': { type: 'string' },
      'allow-code': { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    let input: ResolvedSceneInput;
    try {
      input = resolveSceneInput(parsed.parsed.positionals[0] || '.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('render', { ok: false, error: msg });
      else console.error(`pinepaper-mcp render: ${msg}`);
      return 1;
    }

    const cfg = input.projectConfig?.export || {};
    const format = (strFlag(parsed.parsed.flags, 'format') || cfg.format || 'mp4').toLowerCase();
    if (!SUPPORTED_FORMATS.has(format)) {
      console.error(`Unsupported format "${format}". Supported: ${[...SUPPORTED_FORMATS].join(', ')}.`);
      return 2;
    }

    const qualityRaw = strFlag(parsed.parsed.flags, 'quality') || cfg.quality;
    const quality = mapQuality(qualityRaw);
    if (qualityRaw && !quality) {
      console.error(`Invalid --quality "${qualityRaw}". Use draft (low), standard (medium), or high.`);
      return 2;
    }

    const explicitOut = strFlag(parsed.parsed.flags, 'output');
    const desiredOut = explicitOut ? resolve(explicitOut) : (cfg.output ? resolve(input.dir, cfg.output) : null);
    const allowCode = boolFlag(parsed.parsed.flags, 'allow-code') === true;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url');
    const platform = strFlag(parsed.parsed.flags, 'platform') || cfg.platform || 'auto';
    const fps = numFlag(parsed.parsed.flags, 'fps') ?? cfg.fps;
    const duration = numFlag(parsed.parsed.flags, 'duration') ?? cfg.duration;
    const deterministic = boolFlag(parsed.parsed.flags, 'deterministic') ?? cfg.deterministic;
    const audioCodec = strFlag(parsed.parsed.flags, 'audio-codec') || cfg.audioCodec;

    try {
      const result = await withCliBrowser({ studioUrl, headless: true, allowCode }, async (_ctl, handlerOpts) => {
        const loaded = await loadSceneIntoStudio(input, handlerOpts, allowCode);
        if (!loaded.ok) return { ok: false as const, error: loaded.error || 'Scene load failed', loadMs: loaded.loadMs };

        const expStart = Date.now();
        if (format === 'svg' || format === 'html') {
          const toolName = format === 'svg' ? 'pinepaper_export_svg' : 'pinepaper_export_widget_html';
          const extRes = extractToolJson(await handleToolCall(toolName, {}, handlerOpts));
          const payloadObj = (extRes.data as { result?: Record<string, unknown> } | null)?.result;
          const contentStr = format === 'svg' ? payloadObj?.svgString : payloadObj?.html;
          if (!extRes.ok || typeof contentStr !== 'string' || !contentStr.length) {
            return { ok: false as const, error: extRes.text || `${toolName} returned empty output`, loadMs: loaded.loadMs };
          }
          const outPath = desiredOut || defaultOutputPath(input, format);
          mkdirSync(dirname(outPath), { recursive: true });
          writeFileSync(outPath, contentStr, 'utf-8');
          const { sha256, bytes } = await sha256OfFile(outPath);
          return {
            ok: true as const,
            outputPath: outPath,
            format,
            bytes,
            sha256,
            loadMs: loaded.loadMs,
            exportMs: Date.now() - expStart,
          };
        }

        const exportArgs: Record<string, unknown> = {
          platform,
          format,
          ...(duration !== undefined ? { duration } : {}),
          ...(fps !== undefined ? { fps } : {}),
          ...(quality ? { quality } : {}),
          ...(deterministic !== undefined ? { deterministic } : {}),
          ...(audioCodec ? { audioCodec } : {}),
        };
        const callRes = await handleToolCall('pinepaper_agent_export', exportArgs, { ...handlerOpts, saveToFile: true });
        const ext = extractToolJson(callRes);
        const exportMs = Date.now() - expStart;
        if (!ext.ok) {
          return { ok: false as const, error: ext.text || 'Export failed', loadMs: loaded.loadMs, details: ext.data };
        }
        const dataObj = (ext.data ?? {}) as { filePath?: string; fileSize?: number; file?: Record<string, unknown>; warning?: string };
        if (typeof dataObj.filePath !== 'string' || !dataObj.filePath) {
          return { ok: false as const, error: 'Export succeeded but produced no filePath.', loadMs: loaded.loadMs, details: ext.data };
        }

        let finalPath = dataObj.filePath;
        if (desiredOut && resolve(desiredOut) !== resolve(dataObj.filePath)) {
          mkdirSync(dirname(desiredOut), { recursive: true });
          copyFileSync(dataObj.filePath, desiredOut);
          finalPath = desiredOut;
        }
        const st = statSync(finalPath);
        if (st.size === 0) {
          return { ok: false as const, error: `Rendered file is empty: ${finalPath}`, loadMs: loaded.loadMs };
        }
        const receipt = (dataObj.file ?? {}) as { sha256?: string; bytes?: number; frameDigest?: string; frames?: number };
        const sha = receipt.sha256 || (await sha256OfFile(finalPath)).sha256;
        return {
          ok: true as const,
          outputPath: finalPath,
          format,
          bytes: st.size,
          sha256: sha,
          frameDigest: receipt.frameDigest,
          frames: receipt.frames,
          warning: dataObj.warning,
          loadMs: loaded.loadMs,
          exportMs,
        };
      });

      if (!result.ok) {
        if (parsed.json) emitJson('render', { ...result, file: input.filePath, format });
        else console.error(`Render failed: ${result.error}`);
        return 1;
      }

      if (parsed.json) {
        emitJson('render', { source: input.filePath, ...result });
        return 0;
      }

      console.log(`Rendered ${format.toUpperCase()}: ${result.outputPath}`);
      console.log(`  Size:   ${(result.bytes / 1024).toFixed(1)} KB (${result.bytes} bytes)`);
      console.log(`  SHA256: ${result.sha256}`);
      if (result.frameDigest) console.log(`  Digest: ${result.frameDigest} (${result.frames ?? '?'} frames)`);
      console.log(`  Time:   load ${result.loadMs} ms, export ${result.exportMs} ms`);
      if (result.warning) console.log(`  Warn:   ${result.warning}`);
      return 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('render', { ok: false, error: msg });
      else console.error(`pinepaper-mcp render: ${msg}`);
      return 1;
    }
  },
};
