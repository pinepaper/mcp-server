/**
 * Public T2 + N1–N4 acceptance verification script for PinePaper Studio (`PINEPAPER_TOOLKIT=lane`).
 *
 * MODES
 *   model (default)  LANE_MODEL=<model id> ANTHROPIC_API_KEY=... bun scripts/acceptance/agent-lane-t2.ts --studio-dist <FxTool dist> [--runs 3]
 *   --scripted       deterministic T2 build -> lint -> export -> verifyT2 -> N1->N2->N3->N4 -> export -> verifyT2AfterDeltas
 *   --scripted-naive negative control omitting top-left/bottom-left anchors; MUST fail verifyT2
 *   --verify <mp4>   only run verifyT2 on an existing MP4 file
 *   --verify-delta <mp4>  only run verifyT2AfterDeltas on an existing post-N4 MP4 file
 */
import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { LANE_TOOL_NAMES, STARTER_TOOL_NAMES } from '../../src/tools/lane.js';
import { serveStudio } from './serve-studio.js';
import {
  buildN1ToN4Deltas,
  buildT2Batch,
  type CallRecord,
  callTool,
  type CheckResult,
  exportPathFromText,
  ffmpegDecodeClean,
  ffprobeVideo,
  FRAME_H,
  FRAME_W,
  frameAt,
  isAmber,
  isCyan,
  isNavyBg,
  isPurple,
  isSkyBlue,
  isWhite,
  measureBytesAndTokens,
  near,
  scanPixels,
  startMcpSession,
} from './verify-helpers.js';

export const T2_PROMPT = `Make this animated infographic video with PinePaper Studio and return the MP4 file path:

- 1920x1080, 30 fps, 8 seconds, MP4, background #0b1026.
- White title "SIGNAL / NOISE", 72 px, top-left corner at (200, 130), fading in over 0..0.8 s.
- Five sky-blue (#38bdf8) vertical bars (width 120) anchored bottom-left along baseline y=900 at x=[260, 560, 860, 1160, 1460] with heights [280, 455, 364, 560, 497] and labels ['40','65','52','80','71'] anchored bottom at (320+i*300, 940), growing from scaleY 0->1 starting at 2.8 s (stagger 0.15 s).
- Amber (#fbbf24) hub circle (r=18) at (960, 430), surrounded by 24 cyan (#22d3ee) dots (r=6) driven by a ring pattern (id 'ring1', radius 260, period 6 s).
- Purple (#a855f7) 9-point sine wave path drawing on via trimEnd 0->1 from 4 s to 7 s.`;

export const T2_MAX_BYTES = 3500;
export const T2_MAX_TOKENS = 875;
export const DELTA_MAX_TOKENS = 149; // strictly < 150 tok

function ringAnnulusDiff(bufA: Buffer, bufB: Buffer, cx: number, cy: number, rMin: number, rMax: number): number {
  let diffPx = 0;
  const x0 = Math.max(0, Math.floor(cx - rMax));
  const x1 = Math.min(FRAME_W, Math.ceil(cx + rMax));
  const y0 = Math.max(0, Math.floor(cy - rMax));
  const y1 = Math.min(FRAME_H, Math.ceil(cy + rMax));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < rMin || dist > rMax) continue;
      const i = (y * FRAME_W + x) * 3;
      const delta = Math.abs(bufA[i] - bufB[i]) + Math.abs(bufA[i + 1] - bufB[i + 1]) + Math.abs(bufA[i + 2] - bufB[i + 2]);
      if (delta > 60) diffPx++;
    }
  }
  return diffPx;
}

function countCyanInAnnulus(buf: Buffer, cx: number, cy: number, rMin: number, rMax: number): number {
  let count = 0;
  const x0 = Math.max(0, Math.floor(cx - rMax));
  const x1 = Math.min(FRAME_W, Math.ceil(cx + rMax));
  const y0 = Math.max(0, Math.floor(cy - rMax));
  const y1 = Math.min(FRAME_H, Math.ceil(cy + rMax));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < rMin || dist > rMax) continue;
      const i = (y * FRAME_W + x) * 3;
      if (isCyan(buf[i], buf[i + 1], buf[i + 2])) count++;
    }
  }
  return count;
}

export function verifyT2(file: string): CheckResult[] {
  const checks: CheckResult[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
  if (!existsSync(file)) return [{ name: 'file exists', ok: false, detail: file }];

  const probe = ffprobeVideo(file);
  add('ffprobe 1920x1080', probe.width === FRAME_W && probe.height === FRAME_H, `${probe.width}x${probe.height} ${probe.codecName}`);
  add('ffprobe 30 fps', probe.rFrameRate === '30/1', probe.rFrameRate);
  add('ffprobe 8.000 s (240 frames)', near(probe.duration, 8, 0.05) || probe.nbFrames === 240, `duration ${probe.duration}, ${probe.nbFrames} frames`);
  const dec = ffmpegDecodeClean(file);
  add('decodes clean', dec.ok, dec.detail);

  const f005 = frameAt(file, 0.05);
  const f1 = frameAt(file, 1.0);
  const f1125 = frameAt(file, 1.125);
  const f15 = frameAt(file, 1.5);
  const f42 = frameAt(file, 4.2);
  const f45 = frameAt(file, 4.5);
  const f75 = frameAt(file, 7.5);

  // Background #0b1026
  const bgSamples = [(1800 + 1000 * FRAME_W) * 3, (40 + 1040 * FRAME_W) * 3].map((idx) => [
    f45[idx],
    f45[idx + 1],
    f45[idx + 2],
  ]);
  add(
    'background navy #0b1026',
    bgSamples.every(([r, g, b]) => isNavyBg(r, g, b)),
    JSON.stringify(bgSamples),
  );

  // Title top-left at (200, 130)
  const title15 = scanPixels(f15, FRAME_W, FRAME_H, isWhite, 90, 270);
  const title005 = scanPixels(f005, FRAME_W, FRAME_H, isWhite, 90, 270);
  add('title drawn at 1.5 s', title15.n > 3000, `${title15.n} white px in rows 90-270`);
  add(
    'title top-left aligned at x~200',
    title15.minX >= 185 && title15.minX <= 240,
    `leftmost white px x=${title15.minX}`,
  );
  add('title inside right frame', title15.maxX > 0 && title15.maxX < FRAME_W - 5, `rightmost white px x=${title15.maxX}`);
  add(
    'title faded in from 0.05 s to 1.5 s',
    title005.n < Math.max(200, title15.n * 0.2),
    `${title005.n} white px at 0.05 s vs ${title15.n} at 1.5 s`,
  );

  // Bars bottom-left pinned at baseline y=900 (region y=320..920, excluding ring area by x columns)
  const barEarly = scanPixels(f15, FRAME_W, FRAME_H, isSkyBlue, 520, 915, 240, 1600);
  const bar0 = scanPixels(f45, FRAME_W, FRAME_H, isSkyBlue, 320, 930, 250, 390);
  const bar3 = scanPixels(f45, FRAME_W, FRAME_H, isSkyBlue, 320, 930, 1150, 1290);
  add('bars un-grown before 2.8 s', barEarly.n < 400, `${barEarly.n} sky-blue px at 1.5 s`);
  add('bars drawn by 4.5 s', bar0.n > 15000 && bar3.n > 30000, `bar-0 ${bar0.n} px, bar-3 ${bar3.n} px`);
  add(
    'bars pinned at baseline y=900 (bottom-left anchor)',
    near(bar0.maxY, 900, 15) && near(bar3.maxY, 900, 15),
    `bar-0 maxY=${bar0.maxY}, bar-3 maxY=${bar3.maxY}`,
  );
  add(
    'bar-3 taller than bar-0 (top edges ~340 vs ~620)',
    bar3.minY < bar0.minY - 200 && near(bar3.minY, 340, 25) && near(bar0.minY, 620, 25),
    `bar-0 minY=${bar0.minY}, bar-3 minY=${bar3.minY}`,
  );

  // Amber hub at (960, 430)
  const hub = scanPixels(f45, FRAME_W, FRAME_H, isAmber, 395, 465, 925, 995);
  add('amber hub at (960, 430)', hub.n > 200 && near(hub.cx, 960, 12) && near(hub.cy, 430, 12), `${hub.n} amber px (${hub.cx.toFixed(0)}, ${hub.cy.toFixed(0)})`);

  // Ring1 24 cyan dots at radius 260 around (960, 430)
  const ringCount = countCyanInAnnulus(f1, 960, 430, 230, 290);
  const ringDiff = ringAnnulusDiff(f1, f1125, 960, 430, 230, 290);
  add('ring1 cyan dots on radius 260', ringCount > 500, `${ringCount} cyan px in r=[230, 290]`);
  add('ring1 dots rotate between 1.0 s and 1.125 s', ringDiff > 400, `${ringDiff} changed px in r=[230, 290]`);

  // Purple wave trimEnd draw (4.0 s -> 7.0 s)
  const waveEarly = scanPixels(f42, FRAME_W, FRAME_H, isPurple, 355, 505, 250, 1600);
  const waveLate = scanPixels(f75, FRAME_W, FRAME_H, isPurple, 355, 505, 250, 1600);
  add(
    'purple wave draws on via trimEnd (4.2 s -> 7.5 s)',
    waveLate.n > 400 && waveLate.n > waveEarly.n * 2,
    `${waveEarly.n} purple px at 4.2 s vs ${waveLate.n} at 7.5 s`,
  );

  return checks;
}

export function verifyT2AfterDeltas(file: string): CheckResult[] {
  const checks: CheckResult[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
  if (!existsSync(file)) return [{ name: 'delta file exists', ok: false, detail: file }];

  const probe = ffprobeVideo(file);
  add('delta ffprobe 1920x1080', probe.width === FRAME_W && probe.height === FRAME_H, `${probe.width}x${probe.height}`);
  add('delta ffprobe 30 fps', probe.rFrameRate === '30/1', probe.rFrameRate);
  add('delta ffprobe 8.000 s', near(probe.duration, 8, 0.05) || probe.nbFrames === 240, `duration ${probe.duration}`);
  const dec = ffmpegDecodeClean(file);
  add('delta decodes clean', dec.ok, dec.detail);

  const f45 = frameAt(file, 4.5);
  const extBars = scanPixels(f45, FRAME_W, FRAME_H, isSkyBlue, 450, 920, 1600, 1890);
  add('N2 extended bars present (x >= 1600)', extBars.n > 8000, `${extBars.n} sky-blue px in x=1600..1890`);

  const innerRing = countCyanInAnnulus(f45, 960, 430, 230, 285);
  const outerRing = countCyanInAnnulus(f45, 960, 430, 330, 390);
  add(
    'N3/N4 ring expanded from r=260 to r=360 (32 dots)',
    outerRing > 700 && outerRing > innerRing * 2,
    `outer r=[330,390]: ${outerRing} cyan px vs inner r=[230,285]: ${innerRing} cyan px`,
  );

  return checks;
}

interface T2RunResult {
  run: number;
  mode: string;
  model?: string;
  t2PayloadBytes: number;
  t2PayloadTokens: number;
  firstExport?: string;
  deltaExport?: string;
  verified: boolean;
  deltaVerified: boolean;
  clean: boolean;
  firstTry: boolean;
  checks: CheckResult[];
  deltaChecks: CheckResult[];
  deltaMetrics: Array<{ id: string; bytes: number; tokens: number }>;
  toolCalls: number;
  toolErrors: number;
  turns: number;
  usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens: number; cache_read_input_tokens: number };
  wallMs: number;
  transcript: string;
  stopReason?: string;
  error?: string;
}

async function runModel(client: Client, model: string, prompt: string, calls: CallRecord[], transcript: unknown[]) {
  const key = process.env.ANTHROPIC_API_KEY as string;
  const base = (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '');
  const { tools } = await client.listTools();
  const system = client.getInstructions() ?? '';
  const apiTools = tools.map((t) => ({ name: t.name, description: t.description, input_schema: t.inputSchema }));
  transcript.push({ system, tools: apiTools.map((t) => t.name), prompt });
  const messages: Array<{ role: string; content: unknown }> = [{ role: 'user', content: prompt }];
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  let turns = 0;
  let stopReason = '';

  while (turns < 30) {
    turns++;
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 8000, system, tools: apiTools, messages }),
    });
    const body = (await res.json()) as {
      content?: Array<Record<string, unknown>>;
      stop_reason?: string;
      usage?: Record<string, number>;
      error?: unknown;
    };
    if (!res.ok) throw new Error(`Messages API ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 400)}`);
    for (const k of Object.keys(usage) as Array<keyof typeof usage>) usage[k] += body.usage?.[k] ?? 0;
    transcript.push({ turn: turns, assistant: body.content, stop_reason: body.stop_reason, usage: body.usage });
    messages.push({ role: 'assistant', content: body.content });
    stopReason = body.stop_reason ?? '';
    const uses = (body.content ?? []).filter((b) => b.type === 'tool_use');
    if (!uses.length) break;
    const results = [];
    for (const u of uses) {
      const r = await callTool(client, String(u.name), u.input, calls);
      const blocks = r.content.map((c) =>
        c.type === 'image' && c.data
          ? { type: 'image', source: { type: 'base64', media_type: c.mimeType || 'image/png', data: c.data } }
          : { type: 'text', text: c.text ?? '' },
      );
      results.push({ type: 'tool_result', tool_use_id: u.id, content: blocks, ...(r.isError ? { is_error: true } : {}) });
      transcript.push({ tool: u.name, input: u.input, isError: r.isError, result: r.text });
    }
    messages.push({ role: 'user', content: results });
  }
  return { usage, turns, stopReason };
}

async function oneRun(
  run: number,
  mode: 'model' | 'scripted' | 'scripted-naive',
  studioUrl: string,
  outDir: string,
  prompt: string,
  toolkit: 'lane' | 'starter',
  model?: string,
): Promise<T2RunResult> {
  const t0 = Date.now();
  const calls: CallRecord[] = [];
  const transcript: unknown[] = [];
  const tpath = join(outDir, `run-${run}-${mode}.json`);
  const usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  let turns = 0;
  let stopReason: string | undefined;
  let error: string | undefined;
  const deltaMetrics: Array<{ id: string; bytes: number; tokens: number }> = [];

  const t2Batch = buildT2Batch({ naive: mode === 'scripted-naive' });
  const t2Metric = measureBytesAndTokens(t2Batch);

  const expectedCount = toolkit === 'starter' ? STARTER_TOOL_NAMES.length : LANE_TOOL_NAMES.length;
  const session = await startMcpSession({ toolkit, studioUrl, clientName: 'agent-lane-t2' });
  let firstExport: string | undefined;
  let deltaExport: string | undefined;

  try {
    const { tools } = await session.client.listTools();
    if (tools.length !== expectedCount) {
      throw new Error(`HARNESS: the ${toolkit} profile listed ${tools.length} tools, not ${expectedCount}: ${tools.map((t) => t.name).join(', ')}`);
    }

    if (mode === 'model') {
      const modelRes = await runModel(session.client, model as string, prompt, calls, transcript);
      Object.assign(usage, modelRes.usage);
      turns = modelRes.turns;
      stopReason = modelRes.stopReason;
      const firstIdx = calls.findIndex((c) => c.name === 'pinepaper_agent_export' && exportPathFromText(c.text));
      firstExport = firstIdx >= 0 ? exportPathFromText(calls[firstIdx].text) : undefined;
    } else {
      if (mode === 'scripted' && (t2Metric.bytes > T2_MAX_BYTES || t2Metric.tokens > T2_MAX_TOKENS)) {
        throw new Error(`HARNESS: T2 payload exceeded budget (${t2Metric.bytes} B / ${t2Metric.tokens} tok > ${T2_MAX_BYTES} B / ${T2_MAX_TOKENS} tok)`);
      }

      const rBatch = await callTool(session.client, 'pinepaper_agent_batch_execute', t2Batch, calls);
      transcript.push({ tool: 'pinepaper_agent_batch_execute', input: t2Batch, isError: rBatch.isError, result: rBatch.text });

      const rLint = await callTool(session.client, 'pinepaper_lint_scene', {}, calls);
      transcript.push({ tool: 'pinepaper_lint_scene', input: {}, isError: rLint.isError, result: rLint.text });

      const rExp1 = await callTool(session.client, 'pinepaper_agent_export', { format: 'mp4', duration: 8, fps: 30 }, calls);
      transcript.push({ tool: 'pinepaper_agent_export', input: { format: 'mp4', duration: 8, fps: 30 }, isError: rExp1.isError, result: rExp1.text });
      firstExport = exportPathFromText(rExp1.text);

      if (mode === 'scripted') {
        for (const d of buildN1ToN4Deltas()) {
          const m = measureBytesAndTokens(d.args);
          deltaMetrics.push({ id: d.id, ...m });
          if (m.tokens > DELTA_MAX_TOKENS) {
            throw new Error(`HARNESS: ${d.id} delta exceeded <150 tok budget: ${m.bytes} B (${m.tokens} tok)`);
          }
          const rd = await callTool(session.client, d.tool, d.args, calls);
          transcript.push({ delta: d.id, tool: d.tool, input: d.args, isError: rd.isError, result: rd.text });
        }

        const rExp2 = await callTool(session.client, 'pinepaper_agent_export', { format: 'mp4', duration: 8, fps: 30 }, calls);
        transcript.push({ tool: 'pinepaper_agent_export', phase: 'post-N1-N4', isError: rExp2.isError, result: rExp2.text });
        deltaExport = exportPathFromText(rExp2.text);
      }
    }
  } catch (e) {
    error = (e as Error).message;
  } finally {
    await session.close();
  }

  const checks = firstExport
    ? verifyT2(firstExport)
    : [{ name: 'T2 mp4 was exported', ok: false, detail: error ?? 'no export call returned a file' }];
  const deltaChecks =
    mode === 'scripted'
      ? deltaExport
        ? verifyT2AfterDeltas(deltaExport)
        : [{ name: 'N1-N4 mp4 was exported', ok: false, detail: error ?? 'no post-delta export file' }]
      : [];

  const verified = checks.every((c) => c.ok);
  const deltaVerified = deltaChecks.length === 0 ? true : deltaChecks.every((c) => c.ok);
  const clean = calls.every((c) => !c.isError);
  const result: T2RunResult = {
    run,
    mode,
    model,
    t2PayloadBytes: t2Metric.bytes,
    t2PayloadTokens: t2Metric.tokens,
    firstExport,
    deltaExport,
    verified,
    deltaVerified,
    clean,
    firstTry: verified && deltaVerified && clean,
    checks,
    deltaChecks,
    deltaMetrics,
    toolCalls: calls.length,
    toolErrors: calls.filter((c) => c.isError).length,
    turns,
    usage,
    wallMs: Date.now() - t0,
    transcript: tpath,
    stopReason,
    error,
  };
  writeFileSync(tpath, JSON.stringify({ result, calls, transcript }, null, 2));
  return result;
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };

  const verifyOnly = opt('--verify');
  if (verifyOnly) {
    const checks = verifyT2(verifyOnly);
    for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
    process.exit(checks.every((c) => c.ok) ? 0 : 1);
  }

  const verifyDeltaOnly = opt('--verify-delta');
  if (verifyDeltaOnly) {
    const checks = verifyT2AfterDeltas(verifyDeltaOnly);
    for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
    process.exit(checks.every((c) => c.ok) ? 0 : 1);
  }

  const mode: 'model' | 'scripted' | 'scripted-naive' = argv.includes('--scripted-naive')
    ? 'scripted-naive'
    : argv.includes('--scripted')
      ? 'scripted'
      : 'model';
  const toolkit = (opt('--toolkit') ?? 'lane') as 'lane' | 'starter';
  if (toolkit !== 'lane' && toolkit !== 'starter') {
    console.error(`BLOCKED: --toolkit must be "lane" or "starter" (got "${toolkit}").`);
    process.exit(2);
  }
  const runs = Number(opt('--runs') ?? (mode === 'model' ? 3 : 1));
  const outDir = opt('--out') ?? join(tmpdir(), `pinepaper-lane-t2-${Date.now()}`);
  mkdirSync(outDir, { recursive: true });
  const prompt = process.env.T2_PROMPT_FILE ? readFileSync(process.env.T2_PROMPT_FILE, 'utf8') : T2_PROMPT;

  const model = process.env.LANE_MODEL?.trim();
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'unset'}; LANE_MODEL: ${model || 'unset'}; mode: ${mode}; toolkit: ${toolkit}`);
  if (mode === 'model' && (!process.env.ANTHROPIC_API_KEY || !model)) {
    console.error('BLOCKED: model mode needs ANTHROPIC_API_KEY and LANE_MODEL. Use --scripted to verify the harness without a model.');
    process.exit(2);
  }

  const dist = opt('--studio-dist');
  const served = dist ? serveStudio(resolve(dist)) : null;
  const studioUrl = served?.url ?? process.env.PINEPAPER_STUDIO_URL;
  if (!studioUrl) {
    console.error('BLOCKED: pass --studio-dist <FxTool dist> or set PINEPAPER_STUDIO_URL.');
    process.exit(2);
  }
  console.log(`studio: ${studioUrl}  out: ${outDir}`);

  const results: T2RunResult[] = [];
  try {
    for (let i = 1; i <= runs; i++) {
      const r = await oneRun(i, mode, studioUrl, outDir, prompt, toolkit, model);
      results.push(r);
      console.log(
        `\nrun ${i} [${mode}${model ? ' ' + model : ''}]: ${r.firstTry ? 'PASS' : 'FAIL'} (T2=${r.t2PayloadBytes} B / ~${r.t2PayloadTokens} tok; verified=${r.verified}, deltaVerified=${r.deltaVerified}, clean=${r.clean}; ${r.toolCalls} calls, ${r.toolErrors} errors, ${(r.wallMs / 1000).toFixed(0)} s)`,
      );
      if (r.error) console.log(`  error: ${r.error}`);
      for (const c of r.checks) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
      for (const d of r.deltaMetrics) console.log(`  DELTA ${d.id}: ${d.bytes} B (~${d.tokens} tok < 150)`);
      for (const c of r.deltaChecks) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
      console.log(`  t2File: ${r.firstExport ?? '-'}\n  deltaFile: ${r.deltaExport ?? '-'}\n  transcript: ${r.transcript}`);
    }
  } finally {
    served?.stop();
  }

  writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ mode, toolkit, model, prompt, results }, null, 2));
  const passed = results.filter((r) => r.firstTry).length;
  console.log(`\n${passed}/${results.length} passes. summary: ${join(outDir, 'summary.json')}`);
  const ok = mode === 'scripted-naive' ? results.every((r) => !r.verified && r.firstExport) : passed === results.length;
  process.exit(ok ? 0 : 1);
}

if (import.meta.main) await main();
