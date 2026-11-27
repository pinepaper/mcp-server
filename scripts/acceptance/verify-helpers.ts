/**
 * Shared, strictly competitor-free helpers for PinePaper Studio public acceptance
 * and verification scripts (`agent-lane-t1.ts`, `agent-lane-t2.ts`,
 * `public-verification-harness.ts`).
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const REPO_ROOT = resolve(import.meta.dir, '..', '..');
export const FRAME_W = 1920;
export const FRAME_H = 1080;

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

export interface ByteTokenMetric {
  bytes: number;
  tokens: number;
}

/** Measure UTF-8 byte size and ceiling bytes/4 token estimate. */
export function measureBytesAndTokens(payload: unknown): ByteTokenMetric {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const bytes = Buffer.byteLength(raw, 'utf8');
  return { bytes, tokens: Math.ceil(bytes / 4) };
}

export interface StartMcpSessionOpts {
  toolkit?: string;
  studioUrl?: string;
  executionMode?: 'code' | 'puppeteer';
  allowCode?: boolean;
  headless?: boolean;
  clientName?: string;
  env?: Record<string, string>;
}

export interface McpSession {
  client: Client;
  stderr: string[];
  close: () => Promise<void>;
}

/**
 * Spawn `bun src/index.ts` over StdioClientTransport with clean env isolation:
 * - strips `ANTHROPIC_API_KEY`
 * - explicitly omits `PINEPAPER_TOOLKIT` unless `opts.toolkit` is provided
 * - defaults `NODE_OPTIONS=--max-old-space-size=2048` when unset
 * - sets `PINEPAPER_HEADLESS=true` by default
 */
export async function startMcpSession(opts: StartMcpSessionOpts = {}): Promise<McpSession> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined && k !== 'ANTHROPIC_API_KEY' && k !== 'PINEPAPER_TOOLKIT') {
      env[k] = v;
    }
  }
  env.NODE_OPTIONS = env.NODE_OPTIONS || '--max-old-space-size=2048';
  env.PINEPAPER_HEADLESS = opts.headless === false ? 'false' : 'true';
  if (opts.toolkit !== undefined) env.PINEPAPER_TOOLKIT = opts.toolkit;
  if (opts.studioUrl !== undefined) env.PINEPAPER_STUDIO_URL = opts.studioUrl;
  if (opts.executionMode !== undefined) env.PINEPAPER_EXECUTION_MODE = opts.executionMode;
  if (opts.allowCode) env.PINEPAPER_ALLOW_CODE = '1';
  if (opts.env) Object.assign(env, opts.env);

  const transport = new StdioClientTransport({
    command: 'bun',
    args: [join(REPO_ROOT, 'src', 'index.ts')],
    cwd: REPO_ROOT,
    env,
    stderr: 'pipe',
  });
  const stderr: string[] = [];
  transport.stderr?.on('data', (d) => stderr.push(String(d)));
  const client = new Client({ name: opts.clientName ?? 'pinepaper-public-verifier', version: '1.0.0' });
  await client.connect(transport);
  return {
    client,
    stderr,
    close: async () => {
      await client.close().catch(() => {});
    },
  };
}

export type McpContent = { type: string; text?: string; data?: string; mimeType?: string };

export interface CallRecord {
  name: string;
  input: unknown;
  isError: boolean;
  ms: number;
  text: string;
}

export async function callTool(
  client: Client,
  name: string,
  input: unknown,
  calls?: CallRecord[],
): Promise<{ content: McpContent[]; isError: boolean; text: string }> {
  const t0 = Date.now();
  const r = await client.callTool(
    { name, arguments: (input ?? {}) as Record<string, unknown> },
    undefined,
    { timeout: 900_000, resetTimeoutOnProgress: true },
  );
  const content = (r.content ?? []) as McpContent[];
  const text = content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n');
  const isError = !!r.isError || /"success":\s*false/.test(text.slice(0, 400));
  calls?.push({ name, input, isError, ms: Date.now() - t0, text });
  if (/Browser Connection Failed/.test(text)) {
    throw new Error(`HARNESS: Studio browser did not connect — server fell back to code mode: ${text.slice(0, 400)}`);
  }
  return { content, isError, text };
}

export function exportPathFromText(text: string): string | undefined {
  return /File:\s*(\S+\.mp4)/.exec(text)?.[1];
}

export interface VideoProbe {
  width: number;
  height: number;
  rFrameRate: string;
  nbFrames: number;
  codecName: string;
  duration: number;
}

export function ffprobeVideo(file: string): VideoProbe {
  if (!existsSync(file)) throw new Error(`Video file does not exist: ${file}`);
  const probe = JSON.parse(
    execFileSync(
      'ffprobe',
      [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,nb_frames,codec_name',
        '-show_entries', 'format=duration',
        '-of', 'json',
        file,
      ],
      { encoding: 'utf8' },
    ),
  ) as {
    streams?: Array<{ width?: number; height?: number; r_frame_rate?: string; nb_frames?: string; codec_name?: string }>;
    format?: { duration?: string };
  };
  const s = probe.streams?.[0] ?? {};
  return {
    width: Number(s.width ?? 0),
    height: Number(s.height ?? 0),
    rFrameRate: String(s.r_frame_rate ?? ''),
    nbFrames: Number(s.nb_frames ?? 0),
    codecName: String(s.codec_name ?? ''),
    duration: Number(probe.format?.duration ?? 0),
  };
}

export function ffmpegDecodeClean(file: string): { ok: boolean; detail: string } {
  try {
    execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], {
      stdio: ['ignore', 'ignore', 'pipe'],
    });
    return { ok: true, detail: '' };
  } catch (e) {
    return { ok: false, detail: String((e as Error).message).slice(0, 200) };
  }
}

export function frameAt(file: string, t: number, width = FRAME_W, height = FRAME_H): Buffer {
  return execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-ss', String(t), '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
    { maxBuffer: width * height * 3 + 4096 },
  );
}

export type PixelPredicate = (r: number, g: number, b: number) => boolean;

export interface PixelScan {
  n: number;
  cx: number;
  cy: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export function scanPixels(
  buf: Buffer,
  width: number,
  height: number,
  pick: PixelPredicate,
  y0 = 0,
  y1 = height,
  x0 = 0,
  x1 = width,
): PixelScan {
  let n = 0;
  let sx = 0;
  let sy = 0;
  let minX = width;
  let maxX = -1;
  let minY = height;
  let maxY = -1;
  const startY = Math.max(0, y0);
  const endY = Math.min(height, y1);
  const startX = Math.max(0, x0);
  const endX = Math.min(width, x1);

  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      const i = (y * width + x) * 3;
      if (pick(buf[i], buf[i + 1], buf[i + 2])) {
        n++;
        sx += x;
        sy += y;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return {
    n,
    cx: n ? sx / n : NaN,
    cy: n ? sy / n : NaN,
    minX,
    maxX,
    minY,
    maxY,
  };
}

export const near = (v: number, want: number, tol: number): boolean =>
  Number.isFinite(v) && Math.abs(v - want) <= tol;

export const isWhite: PixelPredicate = (r, g, b) => r > 170 && g > 170 && b > 170;
export const isCyan: PixelPredicate = (r, g, b) => r < 110 && g > 170 && b > 190 && (b - g) < 36;
export const isSkyBlue: PixelPredicate = (r, g, b) => r > 25 && r < 120 && g > 140 && g < 215 && b > 205 && (b - g) >= 36;
export const isAmber: PixelPredicate = (r, g, b) => r > 200 && g > 140 && g < 235 && b < 110;
export const isPurple: PixelPredicate = (r, g, b) => r > 120 && r < 225 && g < 135 && b > 180;
export const isNavyBg: PixelPredicate = (r, g, b) => near(r, 11, 14) && near(g, 16, 14) && near(b, 38, 14);

/**
 * Canonical T2 scene batch payload (1920x1080, 30fps, 8.0s, 36 items, <= 3,500 B / <= 875 tok).
 * Matches `track1-efficiency-validation.test.ts` and FxTool `Patterns.js` / 9-way `anchor` specs.
 */
export function buildT2Batch(opts: { naive?: boolean } = {}): { operations: Array<Record<string, unknown>> } {
  const naive = opts.naive === true;
  const titleProps: Record<string, unknown> = {
    name: 'title',
    content: 'SIGNAL / NOISE',
    fontSize: 72,
    color: '#f8fafc',
    ...(naive ? {} : { anchor: 'top-left' }),
  };
  const barProps: Record<string, unknown> = {
    width: 120,
    color: '#38bdf8',
    ...(naive ? {} : { anchor: 'bottom-left' }),
  };
  const lblProps: Record<string, unknown> = {
    fontSize: 24,
    color: '#94a3b8',
    ...(naive ? {} : { anchor: 'bottom' }),
  };

  return {
    operations: [
      { type: 'set_canvas_size', width: 1920, height: 1080 },
      { type: 'set_background', backgroundColor: '#0b1026' },
      { type: 'create', itemType: 'text', position: [200, 130], properties: titleProps },
      {
        type: 'create_many',
        itemType: 'rectangle',
        name: 'bar',
        properties: barProps,
        items: [
          [260, 900, 280],
          [560, 900, 455],
          [860, 900, 364],
          [1160, 900, 560],
          [1460, 900, 497],
        ].map(([x, y, height]) => ({ x, y, height })),
      },
      {
        type: 'create_many',
        itemType: 'text',
        name: 'lbl',
        properties: lblProps,
        items: ['40', '65', '52', '80', '71'].map((content, i) => ({ x: 320 + i * 300, y: 940, content })),
      },
      { type: 'create', itemType: 'circle', position: [960, 430], properties: { name: 'hub', radius: 18, color: '#fbbf24' } },
      {
        type: 'create_many',
        itemType: 'circle',
        name: 'dot',
        properties: { radius: 6, color: '#22d3ee' },
        items: Array.from({ length: 24 }, () => [960, 430]),
      },
      {
        type: 'create',
        itemType: 'path',
        position: [960, 430],
        properties: {
          name: 'wave',
          strokeColor: '#a855f7',
          strokeWidth: 3,
          points: Array.from({ length: 9 }, (_, i) => [260 + i * 165, Math.round(430 + 60 * Math.sin(i * 0.9))]),
        },
      },
      {
        type: 'timeline',
        defaults: { ease: 'power2.out' },
        tweens: [
          { to: 'title', from: { opacity: 0 }, vars: { opacity: 1 }, duration: 0.8, at: 0 },
          { to: 'bar-*', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 0.9, at: 2.8, stagger: 0.15 },
          { to: 'lbl-*', from: { opacity: 0 }, vars: { opacity: 1 }, duration: 0.4, at: 3.4, stagger: 0.15 },
          { to: 'wave', from: { trimEnd: 0 }, vars: { trimEnd: 1 }, duration: 3, at: 4, ease: 'none' },
        ],
      },
      {
        type: 'pattern',
        action: 'create',
        id: 'ring1',
        kind: 'ring',
        members: { names: 'dot-*' },
        params: { center: [960, 430], radius: 260, period: 6 },
      },
    ],
  };
}

export interface DeltaEditCall {
  id: 'N1' | 'N2' | 'N3' | 'N4';
  tool: 'pinepaper_agent_batch_execute' | 'pinepaper_pattern';
  args: Record<string, unknown>;
}

/** N1–N4 incremental delta edits from T2 baseline, each strictly < 150 tok C_total. */
export function buildN1ToN4Deltas(): DeltaEditCall[] {
  return [
    {
      id: 'N1',
      tool: 'pinepaper_agent_batch_execute',
      args: {
        operations: [
          { type: 'modify', itemId: 'title', properties: { content: 'SIGNAL / PROOF' } },
          { type: 'modify', itemId: 'bar-2', properties: { height: 616 } },
          { type: 'modify', itemId: 'lbl-2', properties: { content: '88' } },
        ],
      },
    },
    {
      id: 'N2',
      tool: 'pinepaper_agent_batch_execute',
      args: {
        operations: [
          {
            type: 'create_many',
            itemType: 'rectangle',
            name: 'bar_ext',
            properties: { width: 100, color: '#38bdf8', anchor: 'bottom-left' },
            items: [
              { x: 1620, y: 900, height: 231 },
              { x: 1760, y: 900, height: 406 },
            ],
          },
          {
            type: 'create_many',
            itemType: 'text',
            name: 'lbl_ext',
            properties: { fontSize: 24, color: '#94a3b8', anchor: 'bottom' },
            items: [
              { x: 1670, y: 940, content: '33' },
              { x: 1810, y: 940, content: '58' },
            ],
          },
        ],
      },
    },
    {
      id: 'N3',
      tool: 'pinepaper_pattern',
      args: {
        action: 'modify',
        id: 'ring1',
        params: { radius: 360, period: 4 },
      },
    },
    {
      id: 'N4',
      tool: 'pinepaper_agent_batch_execute',
      args: {
        operations: [
          {
            type: 'create_many',
            itemType: 'circle',
            name: 'dot_extra',
            properties: { radius: 6, color: '#22d3ee' },
            items: Array.from({ length: 8 }, () => [960, 430]),
          },
          {
            type: 'pattern',
            action: 'modify',
            id: 'ring1',
            members: { names: ['dot-*', 'dot_extra-*'] },
          },
        ],
      },
    },
  ];
}

/** Scene fixtures designed to emit COLLAPSED_GROUP and UNINTENDED_OVERLAP in GroupingLinter / check. */
export const LINT_TEST_SCENES = {
  collapsedGroup: {
    atomic: true,
    operations: [
      { type: 'set_canvas_size', width: 1280, height: 720 },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 240, y: 240 },
        properties: { name: 'temp_member', width: 80, height: 80, color: '#38bdf8' },
      },
      { type: 'group', itemIds: ['$0'], groupName: 'collapsed_group' },
      { type: 'delete', itemId: '$0' },
    ],
  },
  unintendedOverlap: {
    atomic: true,
    operations: [
      { type: 'set_canvas_size', width: 1280, height: 720 },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 400, y: 360 },
        properties: { name: 'overlap_a', width: 160, height: 120, color: '#38bdf8' },
      },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 420, y: 370 },
        properties: { name: 'overlap_b', width: 160, height: 120, color: '#f472b6' },
      },
    ],
  },
} as const;
