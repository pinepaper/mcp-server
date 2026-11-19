/**
 * `pinepaper-mcp benchmark [file-or-dir]` — Measure browser connect, scene build,
 * and render throughput/determinism using built-in presets or a user scene.
 */

import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sha256OfFile } from '../../tools/export-file-receipt.js';
import { handleToolCall, type HandlerOptions } from '../../tools/handlers.js';
import { numFlag, strFlag, suggestCommand } from '../args.js';
import { emitJson, extractToolJson, resolveSceneInput, type ResolvedSceneInput } from '../output.js';
import { loadSceneIntoStudio, withCliBrowser } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

interface BenchPreset {
  name: string;
  description: string;
  canvas: { width: number; height: number; backgroundColor: string };
  operations: Array<Record<string, unknown>>;
}

const PRESETS: Readonly<Record<string, BenchPreset>> = {
  wave: {
    name: 'wave',
    description: '12 staggered dots + headline (baseline UI/motion render)',
    canvas: { width: 1280, height: 720, backgroundColor: '#0f172a' },
    operations: [
      {
        type: 'create',
        itemType: 'text',
        position: { x: 640, y: 180 },
        properties: { name: 'bench_title', content: 'PinePaper Benchmark', fontSize: 48, fontWeight: 'bold', fillColor: '#f8fafc' },
      },
      {
        type: 'grid',
        rows: 1,
        cols: 12,
        origin: { x: 200, y: 380 },
        spacing: [80, 0],
        itemType: 'circle',
        name: 'wave_dot',
        properties: { radius: 18, fillColor: '#38bdf8' },
        stagger: 0.08,
        keys: { time: [0, 0.5, 1.0], y: [380, 310, 380], easing: 'easeInOut' },
      },
    ],
  },
  swarm: {
    name: 'swarm',
    description: '180 pulsing ring elements + core disc (many-item throughput)',
    canvas: { width: 1280, height: 720, backgroundColor: '#020617' },
    operations: [
      {
        type: 'create',
        itemType: 'circle',
        position: { x: 640, y: 360 },
        properties: { name: 'core', radius: 32, fillColor: '#fbbf24' },
      },
      {
        type: 'ring',
        count: 180,
        center: { x: 640, y: 360 },
        radius: 220,
        itemType: 'circle',
        name: 'orb',
        properties: { radius: 6, fillColor: '#60a5fa' },
        period: 2.0,
        keys: { time: [0, 0.5, 1.0], scale: [0.8, 1.4, 0.8] },
      },
    ],
  },
  typography: {
    name: 'typography',
    description: '24 animated text items in a 4x6 grid (text layout & fade/scale)',
    canvas: { width: 1280, height: 720, backgroundColor: '#18181b' },
    operations: [
      {
        type: 'grid',
        rows: 4,
        cols: 6,
        origin: { x: 240, y: 200 },
        spacing: [160, 100],
        itemType: 'text',
        name: 'word',
        properties: { content: 'MOTION', fontSize: 24, fontWeight: 'bold', fillColor: '#f4f4f5' },
        stagger: 0.06,
        keys: { time: [0, 0.4, 0.8], opacity: [0.2, 1, 0.2], scale: [0.9, 1.12, 0.9] },
      },
    ],
  },
};

const HELP = `PinePaper Benchmark

Measure browser startup, scene load, and deterministic render throughput.

USAGE:
  pinepaper-mcp benchmark [file-or-dir] [options]

OPTIONS:
  --preset <name>       Built-in preset when no file is given: wave (default), swarm, typography
  --runs <n>            Number of timed render runs (default: 1; >1 checks determinism)
  -f, --format <fmt>    Output format: mp4 (default), webm, svg
  --duration <sec>      Video duration in seconds (default: 3)
  --fps <n>             Video FPS (default: 30)
  --studio-url <url>    Override Studio URL
  --json                Emit machine-readable JSON output
  -h, --help            Show help`;

async function runSingleIteration(
  input: ResolvedSceneInput,
  handlerOpts: HandlerOptions,
  format: string,
  duration: number,
  fps: number,
): Promise<{ ok: boolean; buildMs: number; exportMs: number; totalMs: number; bytes?: number; sha256?: string; frameDigest?: string; bitrateKbps?: number; error?: string }> {
  const loaded = await loadSceneIntoStudio(input, handlerOpts, false);
  if (!loaded.ok) {
    return { ok: false, buildMs: loaded.loadMs, exportMs: 0, totalMs: loaded.loadMs, error: loaded.error };
  }
  const expStart = Date.now();
  if (format === 'svg') {
    const ext = extractToolJson(await handleToolCall('pinepaper_export_svg', {}, handlerOpts));
    const exportMs = Date.now() - expStart;
    const svg = (ext.data as { result?: { svgString?: string } } | null)?.result?.svgString;
    if (!ext.ok || typeof svg !== 'string') {
      return { ok: false, buildMs: loaded.loadMs, exportMs, totalMs: loaded.loadMs + exportMs, error: ext.text || 'SVG export failed' };
    }
    const tmpSvg = join(tmpdir(), `pinepaper-bench-${Date.now()}.svg`);
    writeFileSync(tmpSvg, svg, 'utf-8');
    const { sha256, bytes } = await sha256OfFile(tmpSvg);
    try { unlinkSync(tmpSvg); } catch { /* ignore */ }
    return { ok: true, buildMs: loaded.loadMs, exportMs, totalMs: loaded.loadMs + exportMs, bytes, sha256 };
  }

  const ext = extractToolJson(
    await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'auto', format, duration, fps, quality: 'standard', deterministic: true },
      { ...handlerOpts, saveToFile: true },
    ),
  );
  const exportMs = Date.now() - expStart;
  if (!ext.ok) {
    return { ok: false, buildMs: loaded.loadMs, exportMs, totalMs: loaded.loadMs + exportMs, error: ext.text || 'Export failed' };
  }
  const d = (ext.data ?? {}) as { filePath?: string; fileSize?: number; file?: { sha256?: string; frameDigest?: string; bytes?: number } };
  const bytes = d.file?.bytes ?? d.fileSize ?? 0;
  let sha256 = d.file?.sha256;
  if (!sha256 && d.filePath) {
    sha256 = (await sha256OfFile(d.filePath)).sha256;
  }
  if (d.filePath) {
    try { unlinkSync(d.filePath); } catch { /* ignore */ }
  }
  const bitrateKbps = bytes > 0 && duration > 0 ? Math.round((bytes * 8) / (duration * 1000)) : undefined;
  return {
    ok: true,
    buildMs: loaded.loadMs,
    exportMs,
    totalMs: loaded.loadMs + exportMs,
    bytes,
    sha256,
    frameDigest: d.file?.frameDigest,
    bitrateKbps,
  };
}

export const benchmarkCommand: CliCommand = {
  name: 'benchmark',
  category: 'Quality & Rendering',
  summary: 'Profile browser connect, scene build, and render throughput/determinism',
  usage: 'pinepaper-mcp benchmark [file-or-dir] [--preset wave|swarm|typography] [--runs 2]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, benchmarkCommand, {
      preset: { type: 'string' },
      runs: { type: 'number' },
      format: { type: 'string', short: 'f' },
      duration: { type: 'number' },
      fps: { type: 'number' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const format = (strFlag(parsed.parsed.flags, 'format') || 'mp4').toLowerCase();
    if (format !== 'mp4' && format !== 'webm' && format !== 'svg') {
      console.error(`Unsupported benchmark format "${format}". Use mp4, webm, or svg.`);
      return 2;
    }
    const runs = Math.max(1, Math.min(20, Math.trunc(numFlag(parsed.parsed.flags, 'runs') ?? 1)));
    const duration = numFlag(parsed.parsed.flags, 'duration') ?? 3;
    const fps = numFlag(parsed.parsed.flags, 'fps') ?? 30;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url');
    const targetPath = parsed.parsed.positionals[0];

    let input: ResolvedSceneInput;
    let label: string;
    if (targetPath) {
      try {
        input = resolveSceneInput(targetPath);
        label = input.filePath;
      } catch (e) {
        console.error(`pinepaper-mcp benchmark: ${e instanceof Error ? e.message : String(e)}`);
        return 1;
      }
    } else {
      const presetName = (strFlag(parsed.parsed.flags, 'preset') || 'wave').toLowerCase();
      const preset = PRESETS[presetName];
      if (!preset) {
        const hint = suggestCommand(presetName, Object.keys(PRESETS));
        console.error(`Unknown preset "${presetName}".${hint ? ` Did you mean "${hint}"?` : ''} Available: ${Object.keys(PRESETS).join(', ')}`);
        return 1;
      }
      const scratchDir = join(tmpdir(), 'pinepaper-benchmark');
      mkdirSync(scratchDir, { recursive: true });
      const rawText = JSON.stringify({ operations: preset.operations });
      input = {
        kind: 'batch',
        filePath: `<preset:${preset.name}>`,
        dir: scratchDir,
        rawText,
        parsed: { operations: preset.operations },
        projectConfig: { canvas: preset.canvas },
      };
      label = `preset:${preset.name} (${preset.description})`;
    }

    const connectStart = Date.now();
    let connectMs = 0;
    try {
      const results = await withCliBrowser({ studioUrl, headless: true }, async (_ctl, handlerOpts) => {
        connectMs = Date.now() - connectStart;
        const out = [];
        for (let i = 0; i < runs; i++) {
          out.push(await runSingleIteration(input, handlerOpts, format, duration, fps));
        }
        return out;
      });

      const ok = results.every((r) => r.ok);
      const digests = results.map((r) => r.frameDigest).filter((d): d is string => Boolean(d));
      const shas = results.map((r) => r.sha256).filter((s): s is string => Boolean(s));
      const deterministicFrames = digests.length > 1 ? new Set(digests).size === 1 : null;
      const bitExact = shas.length > 1 ? new Set(shas).size === 1 : null;

      if (parsed.json) {
        emitJson('benchmark', { ok, target: label, format, duration, fps, runs, connectMs, deterministicFrames, bitExact, results });
        return ok ? 0 : 1;
      }

      console.log(`PinePaper Benchmark: ${label}`);
      console.log(`  Format: ${format.toUpperCase()} (${duration}s @ ${fps} fps) | Connect: ${connectMs} ms\n`);
      results.forEach((r, idx) => {
        if (!r.ok) {
          console.log(`  Run ${idx + 1}: FAIL (${r.error})`);
          return;
        }
        const sizeKb = r.bytes !== undefined ? `${(r.bytes / 1024).toFixed(1)} KB` : '—';
        const rate = r.bitrateKbps ? ` | ${r.bitrateKbps} kbps` : '';
        const digest = r.frameDigest ? ` | digest ${r.frameDigest}` : '';
        console.log(`  Run ${idx + 1}: build ${r.buildMs} ms | export ${r.exportMs} ms | total ${r.totalMs} ms | ${sizeKb}${rate}${digest}`);
      });
      if (deterministicFrames !== null) {
        console.log(`\n  Determinism: frames=${deterministicFrames ? 'identical' : 'varied'}, fileBytes=${bitExact ? 'identical' : 'encoder-varied'}`);
      }
      return ok ? 0 : 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('benchmark', { ok: false, error: msg });
      else console.error(`pinepaper-mcp benchmark: ${msg}`);
      return 1;
    }
  },
};
