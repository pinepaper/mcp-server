/**
 * T-8 (HYPERFRAMES_SCORECARD_PLAN): a fresh model, given ONLY the agent lane (PINEPAPER_TOOLKIT=lane) and no lessons
 * file, builds T1 first try. Proven by behaviour: a real model drives the real MCP server against a real local
 * PinePaper Studio, and the MP4 it exports is checked frame by frame. Nothing here is mocked.
 *
 * MODES
 *   model (default)  LANE_MODEL=<model id> ANTHROPIC_API_KEY=… bun scripts/acceptance/agent-lane-t1.ts --studio-dist <FxTool dist> [--runs 3]
 *   --scripted       a fixed, correct call list instead of a model: proves the route (server + studio + export +
 *                    verifier) works on this machine. It is a harness check, never a model result.
 *   --scripted-naive the same build WITHOUT the anchor lesson: the title is centred at (200, 130) and clips. The
 *                    verifier must FAIL it; if it passes, the verifier proves nothing.
 *   --verify <mp4>   only run the T1 checks on a file.
 *
 * STUDIO: --studio-dist <dir> serves a built FxTool (npm run build → dist/) on 127.0.0.1; or set PINEPAPER_STUDIO_URL.
 * BROWSER: PUPPETEER_EXECUTABLE_PATH, if puppeteer's own download cannot run here, is passed through.
 * MODEL: LANE_MODEL names the model; there is deliberately no default. ANTHROPIC_BASE_URL is honoured.
 * OUTPUT: --out <dir> (default a new dir under the OS temp dir): one transcript JSON per run and summary.json.
 *
 * "First try" is strict: the FIRST mp4 the run exported passes every T1 check AND no tool call before it failed.
 * Both halves are reported separately, with the run's tokens, so a pass that needed a retry is visible as one.
 *
 * T1 below is the tier study's low tier as this repo can state it: the study's own T1 prompt is not in either
 * repository, so this one keeps its canvas, clock, palette and title (1920×1080, 30 fps, 8.000 s, navy, "SIGNAL /
 * NOISE" at (200, 130)) and adds one keyed move. T1_PROMPT_FILE replaces the prompt; the checks then still apply,
 * so a replacement must ask for the same picture.
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { serveStudio } from './serve-studio.js';

const REPO = resolve(import.meta.dir, '..', '..');

export const T1_PROMPT = `Make this video with PinePaper and give me the path of the MP4.

- 1920×1080, 30 fps, exactly 8 seconds, MP4.
- Background: dark navy #0b1026.
- A white title "SIGNAL / NOISE", 72 px, with its top-left corner at (200, 130). It fades in from fully transparent to fully opaque between 0 s and 1 s, then stays.
- A cyan (#22d3ee) circle of radius 40, centred at (300, 600). It stays there until 1 s, moves to (1620, 600) between 1 s and 7 s with an ease-in-out, and stays there to the end.`;

// ---------------------------------------------------------------------------
// The checks, on the file (ffprobe + decoded frames).
// ---------------------------------------------------------------------------

const W = 1920, H = 1080;
export interface Check { name: string; ok: boolean; detail: string }

function frameAt(file: string, t: number): Buffer {
  return execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ss', String(t), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: W * H * 3 + 1024 });
}
function scan(buf: Buffer, pick: (r: number, g: number, b: number) => boolean, y0 = 0, y1 = H) {
  let n = 0, sx = 0, sy = 0, minX = W, maxX = -1;
  for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    if (pick(buf[i], buf[i + 1], buf[i + 2])) { n++; sx += x; sy += y; if (x < minX) minX = x; if (x > maxX) maxX = x; }
  }
  return { n, cx: n ? sx / n : NaN, cy: n ? sy / n : NaN, minX, maxX };
}
const white = (r: number, g: number, b: number) => r > 170 && g > 170 && b > 170;
const cyan = (r: number, g: number, b: number) => r < 120 && g > 150 && b > 180;
const near = (v: number, want: number, tol: number) => Number.isFinite(v) && Math.abs(v - want) <= tol;

export function verifyT1(file: string): Check[] {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
  if (!existsSync(file)) return [{ name: 'file exists', ok: false, detail: file }];
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate,nb_frames,codec_name',
    '-show_entries', 'format=duration', '-of', 'json', file], { encoding: 'utf8' }));
  const s = probe.streams?.[0] ?? {};
  const dur = Number(probe.format?.duration);
  add('ffprobe 1920×1080', s.width === W && s.height === H, `${s.width}×${s.height} ${s.codec_name}`);
  add('ffprobe 30 fps', s.r_frame_rate === '30/1', String(s.r_frame_rate));
  add('ffprobe 8.000 s', near(dur, 8, 0.05) || Number(s.nb_frames) === 240, `duration ${dur}, ${s.nb_frames} frames`);
  try { execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); add('decodes clean', true, ''); }
  catch (e) { add('decodes clean', false, String((e as Error).message).slice(0, 200)); }

  const f0 = frameAt(file, 0.1), f05 = frameAt(file, 0.5), f4 = frameAt(file, 4), f75 = frameAt(file, 7.5);
  const bg = [(1800 + 1000 * W) * 3, (40 + 1040 * W) * 3].map((i) => [f4[i], f4[i + 1], f4[i + 2]]);
  add('background navy #0b1026', bg.every(([r, g, b]) => near(r, 11, 14) && near(g, 16, 14) && near(b, 38, 14)), JSON.stringify(bg));

  const title4 = scan(f4, white, 90, 270), title0 = scan(f0, white, 90, 270);
  add('title drawn at 4 s', title4.n > 3000, `${title4.n} white px in rows 90–270`);
  add('title not clipped: left edge at x≈200', title4.minX >= 185 && title4.minX <= 240, `leftmost white px x=${title4.minX} (a centre-anchored title at (200,130) starts left of 0)`);
  add('title inside the frame on the right', title4.maxX > 0 && title4.maxX < W - 5, `rightmost white px x=${title4.maxX}`);
  add('title faded in (nearly invisible at 0.1 s)', title0.n < Math.max(50, title4.n * 0.05), `${title0.n} white px at 0.1 s vs ${title4.n} at 4 s`);

  const d05 = scan(f05, cyan), d4 = scan(f4, cyan), d75 = scan(f75, cyan);
  const area = Math.PI * 40 * 40;
  add('circle radius 40', d05.n > area * 0.7 && d05.n < area * 1.3, `${d05.n} cyan px (π·40² = ${Math.round(area)})`);
  add('circle at (300, 600) before 1 s', near(d05.cx, 300, 20) && near(d05.cy, 600, 20), `0.5 s centroid (${d05.cx.toFixed(0)}, ${d05.cy.toFixed(0)})`);
  add('circle mid-move at 4 s (ease-in-out midpoint ≈ 960)', near(d4.cx, 960, 60) && near(d4.cy, 600, 20), `4 s centroid (${d4.cx.toFixed(0)}, ${d4.cy.toFixed(0)})`);
  add('circle at (1620, 600) after 7 s', near(d75.cx, 1620, 20) && near(d75.cy, 600, 20), `7.5 s centroid (${d75.cx.toFixed(0)}, ${d75.cy.toFixed(0)})`);
  return checks;
}

// ---------------------------------------------------------------------------
// The server, one fresh process (and so one fresh studio page) per run.
// ---------------------------------------------------------------------------

async function startLane(studioUrl: string, log: string): Promise<Client> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined && k !== 'ANTHROPIC_API_KEY') env[k] = v;
  Object.assign(env, { PINEPAPER_TOOLKIT: 'lane', PINEPAPER_STUDIO_URL: studioUrl, PINEPAPER_HEADLESS: 'true' });
  const transport = new StdioClientTransport({ command: 'bun', args: [join(REPO, 'src', 'index.ts')], cwd: REPO, env, stderr: 'pipe' });
  const chunks: string[] = [];
  transport.stderr?.on('data', (d) => chunks.push(String(d)));
  const client = new Client({ name: 'agent-lane-t1', version: '1' });
  await client.connect(transport);
  (client as unknown as { __stderr: string[]; __log: string }).__stderr = chunks;
  (client as unknown as { __log: string }).__log = log;
  return client;
}

type McpContent = { type: string; text?: string; data?: string; mimeType?: string };
interface CallRecord { name: string; input: unknown; isError: boolean; ms: number; text: string }

async function callTool(client: Client, name: string, input: unknown, calls: CallRecord[]) {
  const t0 = Date.now();
  const r = await client.callTool({ name, arguments: input as Record<string, unknown> }, undefined, { timeout: 900_000, resetTimeoutOnProgress: true });
  const content = (r.content ?? []) as McpContent[];
  const text = content.filter((c) => c.type === 'text').map((c) => c.text).join('\n');
  // A batch that ran and failed is a failed call even when the transport said ok.
  const isError = !!r.isError || /"success":\s*false/.test(text.slice(0, 400));
  calls.push({ name, input, isError, ms: Date.now() - t0, text });
  if (/Browser Connection Failed/.test(text)) throw new Error(`HARNESS: the server fell back to code mode — the studio browser did not start: ${text.slice(0, 400)}`);
  return { content, isError, text };
}

const exportPath = (text: string) => /File:\s*(\S+\.mp4)/.exec(text)?.[1];

// ---------------------------------------------------------------------------
// The model loop: Messages API with the lane's tools, nothing else.
// ---------------------------------------------------------------------------

interface RunResult {
  run: number; mode: string; model?: string; firstExport?: string; verified: boolean; clean: boolean; firstTry: boolean;
  checks: Check[]; toolCalls: number; toolErrors: number; turns: number;
  usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens: number; cache_read_input_tokens: number };
  wallMs: number; transcript: string; stopReason?: string; error?: string;
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
  let turns = 0, stopReason = '';
  while (turns < 30) {
    turns++;
    const res = await fetch(`${base}/v1/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: 8000, system, tools: apiTools, messages }),
    });
    const body = await res.json() as { content?: Array<Record<string, unknown>>; stop_reason?: string; usage?: Record<string, number>; error?: unknown };
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
      const blocks = r.content.map((c) => c.type === 'image' && c.data
        ? { type: 'image', source: { type: 'base64', media_type: c.mimeType || 'image/png', data: c.data } }
        : { type: 'text', text: c.text ?? '' });
      results.push({ type: 'tool_result', tool_use_id: u.id, content: blocks, ...(r.isError ? { is_error: true } : {}) });
      transcript.push({ tool: u.name, input: u.input, isError: r.isError, result: r.text });
    }
    messages.push({ role: 'user', content: results });
  }
  return { usage, turns, stopReason };
}

/** The reference build, as a correct agent would send it (and, naive, as the lessons file used to prevent). */
function scriptedCalls(naive: boolean): Array<[string, unknown]> {
  const title: Record<string, unknown> = { content: 'SIGNAL / NOISE', fontSize: 72, color: '#ffffff', name: 'title' };
  if (!naive) title.anchor = 'top-left';
  return [
    ['pinepaper_agent_batch_execute', { operations: [
      { type: 'set_canvas_size', width: 1920, height: 1080 },
      { type: 'set_background', backgroundColor: '#0b1026' },
      { type: 'create', itemType: 'text', position: { x: 200, y: 130 }, properties: title },
      { type: 'create', itemType: 'circle', position: { x: 300, y: 600 }, properties: { radius: 40, color: '#22d3ee', name: 'dot' } },
      { type: 'keyframe_animate', itemId: '$0', keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 1, properties: { opacity: 1 } }] },
      { type: 'keyframe_animate', itemId: '$1', keyframes: [{ time: 1, properties: { x: 300 } }, { time: 7, properties: { x: 1620 }, easing: 'easeInOut' }] },
    ] }],
    ['pinepaper_lint_scene', {}],
    ['pinepaper_agent_export', { format: 'mp4', duration: 8, fps: 30 }],
  ];
}

async function oneRun(run: number, mode: string, studioUrl: string, outDir: string, prompt: string, model?: string): Promise<RunResult> {
  const t0 = Date.now();
  const calls: CallRecord[] = [];
  const transcript: unknown[] = [];
  const tpath = join(outDir, `run-${run}-${mode}.json`);
  let usage = { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 };
  let turns = 0, stopReason: string | undefined, error: string | undefined;
  const client = await startLane(studioUrl, tpath);
  try {
    const { tools } = await client.listTools();
    if (tools.length !== 5) throw new Error(`HARNESS: the lane listed ${tools.length} tools, not 5: ${tools.map((t) => t.name).join(', ')}`);
    if (mode === 'model') {
      ({ usage, turns, stopReason } = await runModel(client, model as string, prompt, calls, transcript));
    } else {
      for (const [name, input] of scriptedCalls(mode === 'scripted-naive')) {
        const r = await callTool(client, name, input, calls);
        transcript.push({ tool: name, input, isError: r.isError, result: r.text });
      }
    }
  } catch (e) {
    error = (e as Error).message;
  } finally {
    await client.close().catch(() => {});
  }
  const firstIdx = calls.findIndex((c) => c.name === 'pinepaper_agent_export' && exportPath(c.text));
  const firstExport = firstIdx >= 0 ? exportPath(calls[firstIdx].text) : undefined;
  const checks = firstExport ? verifyT1(firstExport) : [{ name: 'an mp4 was exported', ok: false, detail: error ?? 'no export call returned a file' }];
  const verified = checks.every((c) => c.ok);
  const before = firstIdx >= 0 ? calls.slice(0, firstIdx + 1) : calls;
  const clean = before.every((c) => !c.isError);
  const result: RunResult = {
    run, mode, model, firstExport, verified, clean, firstTry: verified && clean, checks,
    toolCalls: calls.length, toolErrors: calls.filter((c) => c.isError).length, turns, usage,
    wallMs: Date.now() - t0, transcript: tpath, stopReason, error,
  };
  writeFileSync(tpath, JSON.stringify({ result, calls, transcript }, null, 2));
  return result;
}

// ---------------------------------------------------------------------------

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name: string) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : undefined; };
  const verifyOnly = opt('--verify');
  if (verifyOnly) {
    const checks = verifyT1(verifyOnly);
    for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
    process.exit(checks.every((c) => c.ok) ? 0 : 1);
  }
  const mode = argv.includes('--scripted-naive') ? 'scripted-naive' : argv.includes('--scripted') ? 'scripted' : 'model';
  const runs = Number(opt('--runs') ?? (mode === 'model' ? 3 : 1));
  const outDir = opt('--out') ?? join(tmpdir(), `pinepaper-lane-t1-${Date.now()}`);
  mkdirSync(outDir, { recursive: true });
  const prompt = process.env.T1_PROMPT_FILE ? readFileSync(process.env.T1_PROMPT_FILE, 'utf8') : T1_PROMPT;

  const model = process.env.LANE_MODEL?.trim();
  console.log(`ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'set' : 'unset'}; LANE_MODEL: ${model || 'unset'}; mode: ${mode}`);
  if (mode === 'model' && (!process.env.ANTHROPIC_API_KEY || !model)) {
    console.error('BLOCKED: model mode needs ANTHROPIC_API_KEY and LANE_MODEL (no default model is assumed). --scripted checks the route without a model.');
    process.exit(2);
  }

  const dist = opt('--studio-dist');
  const served = dist ? serveStudio(resolve(dist)) : null;
  const studioUrl = served?.url ?? process.env.PINEPAPER_STUDIO_URL;
  if (!studioUrl) { console.error('BLOCKED: pass --studio-dist <FxTool dist> or set PINEPAPER_STUDIO_URL.'); process.exit(2); }
  console.log(`studio: ${studioUrl}  out: ${outDir}`);

  const results: RunResult[] = [];
  try {
    for (let i = 1; i <= runs; i++) {
      const r = await oneRun(i, mode, studioUrl, outDir, prompt, model);
      results.push(r);
      console.log(`\nrun ${i} [${mode}${model ? ' ' + model : ''}]: ${r.firstTry ? 'FIRST-TRY PASS' : 'FAIL'} (verified=${r.verified}, clean=${r.clean}; ${r.toolCalls} tool calls, ${r.toolErrors} errors, ${r.turns} turns; in ${r.usage.input_tokens} / out ${r.usage.output_tokens} tok; ${(r.wallMs / 1000).toFixed(0)} s)`);
      if (r.error) console.log(`  error: ${r.error}`);
      for (const c of r.checks) console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  ${c.name}  ${c.detail}`);
      console.log(`  file: ${r.firstExport ?? '-'}\n  transcript: ${r.transcript}`);
    }
  } finally {
    served?.stop();
  }
  writeFileSync(join(outDir, 'summary.json'), JSON.stringify({ mode, model, prompt, results }, null, 2));
  const passed = results.filter((r) => r.firstTry).length;
  console.log(`\n${passed}/${results.length} first-try passes. summary: ${join(outDir, 'summary.json')}`);
  // scripted-naive is the negative control: it is EXPECTED to fail the checks.
  const ok = mode === 'scripted-naive' ? results.every((r) => !r.verified && r.firstExport) : passed === results.length;
  process.exit(ok ? 0 : 1);
}

if (import.meta.main) await main();
