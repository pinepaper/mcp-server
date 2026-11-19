/**
 * `pinepaper-mcp snapshot [file-or-dir]` (alias: `frames`) — Capture deterministic
 * keyframe PNGs or a tiled contact sheet from a PinePaper scene or batch.
 */

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { handleToolCall } from '../../tools/handlers.js';
import { boolFlag, numFlag, strFlag } from '../args.js';
import { emitJson, extractToolJson, resolveSceneInput, type ResolvedSceneInput } from '../output.js';
import { loadSceneIntoStudio, withCliBrowser } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Snapshot

Capture deterministic keyframe PNGs or a single contact sheet from a scene.
Alias: frames

USAGE:
  pinepaper-mcp snapshot [file-or-dir] [options]

OPTIONS:
  --times <t1,t2,...>   Comma-separated capture timestamps in seconds (e.g. 0,1,2,3)
  --count <n>           Number of evenly spaced frames when --times is omitted (default: 4)
  --duration <sec>      Timeline span for --count (default: project duration or 4s)
  --sheet               Render one tiled contact-sheet PNG instead of individual frame files
  -o, --output <path>   Output directory (for frames) or file path (for --sheet or single frame)
  --allow-code          Allow custom relations/hooks in loaded scene
  --studio-url <url>    Override Studio URL
  --json                Emit machine-readable JSON output
  -h, --help            Show help`;

function parseTimes(raw?: string, count = 4, duration = 4): number[] {
  if (raw) {
    const nums = raw.split(',').map((s) => Number(s.trim()));
    if (!nums.length || nums.some((n) => !Number.isFinite(n) || n < 0)) {
      throw new Error(`Invalid --times list "${raw}". Expected comma-separated non-negative numbers.`);
    }
    return nums;
  }
  const n = Math.max(1, Math.min(60, Math.trunc(count)));
  if (n === 1) return [0];
  return Array.from({ length: n }, (_, i) => Number(((i / (n - 1)) * duration).toFixed(3)));
}

function decodePngDataUrl(dataUrl: string): Buffer {
  const comma = dataUrl.indexOf(',');
  const b64 = comma !== -1 ? dataUrl.slice(comma + 1) : dataUrl;
  return Buffer.from(b64, 'base64');
}

export const snapshotCommand: CliCommand = {
  name: 'snapshot',
  aliases: ['frames'],
  category: 'Quality & Rendering',
  summary: 'Capture deterministic keyframe PNGs or a tiled contact sheet',
  usage: 'pinepaper-mcp snapshot [file-or-dir] [--times 0,1,2] [--sheet] [-o out]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, snapshotCommand, {
      times: { type: 'string' },
      count: { type: 'number' },
      duration: { type: 'number' },
      sheet: { type: 'boolean' },
      output: { type: 'string', short: 'o' },
      'allow-code': { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    let input: ResolvedSceneInput;
    try {
      input = resolveSceneInput(parsed.parsed.positionals[0] || '.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('snapshot', { ok: false, error: msg });
      else console.error(`pinepaper-mcp snapshot: ${msg}`);
      return 1;
    }

    const duration = numFlag(parsed.parsed.flags, 'duration') ?? input.projectConfig?.export?.duration ?? 4;
    const count = numFlag(parsed.parsed.flags, 'count') ?? 4;
    let times: number[];
    try {
      times = parseTimes(strFlag(parsed.parsed.flags, 'times'), count, duration);
    } catch (e) {
      console.error(e instanceof Error ? e.message : String(e));
      return 2;
    }

    const sheet = boolFlag(parsed.parsed.flags, 'sheet') === true;
    const explicitOut = strFlag(parsed.parsed.flags, 'output');
    const allowCode = boolFlag(parsed.parsed.flags, 'allow-code') === true;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url');

    try {
      const outcome = await withCliBrowser({ studioUrl, headless: true, allowCode }, async (_ctl, handlerOpts) => {
        const loaded = await loadSceneIntoStudio(input, handlerOpts, allowCode);
        if (!loaded.ok) return { ok: false as const, error: loaded.error || 'Scene load failed' };

        if (sheet) {
          const ext = extractToolJson(
            await handleToolCall('pinepaper_capture_frames', { times, sheet: { format: 'png' } }, handlerOpts),
          );
          const dataObj = (ext.data ?? {}) as { filePath?: string; fileSize?: number; tiles?: number };
          if (!ext.ok || !dataObj.filePath) {
            return { ok: false as const, error: ext.text || 'Contact sheet capture failed' };
          }
          let outPath = dataObj.filePath;
          if (explicitOut) {
            outPath = resolve(explicitOut);
            mkdirSync(dirname(outPath), { recursive: true });
            copyFileSync(dataObj.filePath, outPath);
          }
          return {
            ok: true as const,
            mode: 'sheet' as const,
            times,
            files: [{ path: outPath, time: null, tiles: dataObj.tiles }],
          };
        }

        const ext = extractToolJson(
          await handleToolCall('pinepaper_capture_frames', { times, includeDataUrls: true }, handlerOpts),
        );
        const cap = (ext.data as { result?: { frames?: Array<{ time: number; hash?: string; dataUrl?: string }> } } | null)?.result;
        if (!ext.ok || !Array.isArray(cap?.frames)) {
          return { ok: false as const, error: ext.text || 'Frame capture failed' };
        }

        const written: Array<{ path: string; time: number; hash?: string; bytes: number }> = [];
        const singleFileTarget = cap.frames.length === 1 && explicitOut && explicitOut.toLowerCase().endsWith('.png');
        const outDir = singleFileTarget ? dirname(resolve(explicitOut!)) : resolve(explicitOut || join(input.dir, 'renders', 'snapshots'));
        mkdirSync(outDir, { recursive: true });

        cap.frames.forEach((f, idx) => {
          if (typeof f.dataUrl !== 'string' || !f.dataUrl) return;
          const filePath = singleFileTarget ? resolve(explicitOut!) : join(outDir, `frame_${String(idx).padStart(3, '0')}.png`);
          const buf = decodePngDataUrl(f.dataUrl);
          writeFileSync(filePath, buf);
          written.push({ path: filePath, time: f.time, hash: f.hash, bytes: buf.length });
        });

        return { ok: true as const, mode: 'frames' as const, times, files: written };
      });

      if (!outcome.ok) {
        if (parsed.json) emitJson('snapshot', outcome);
        else console.error(`Snapshot failed: ${outcome.error}`);
        return 1;
      }

      if (parsed.json) {
        emitJson('snapshot', outcome);
        return 0;
      }

      console.log(`Captured ${outcome.files.length} ${outcome.mode === 'sheet' ? 'contact sheet' : 'frame(s)'}:`);
      for (const f of outcome.files) {
        console.log(`  ${f.path}${f.time !== null ? `  (t=${f.time}s)` : ''}`);
      }
      return 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('snapshot', { ok: false, error: msg });
      else console.error(`pinepaper-mcp snapshot: ${msg}`);
      return 1;
    }
  },
};
