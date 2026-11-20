/**
 * Shared CLI output formatting, JSON envelopes, and project/scene file loading.
 */

import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CallToolResult } from '../mcp/index.js';
import { SERVER_BUILD, SERVER_VERSION } from '../version.js';

export type CheckStatus = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface ProjectConfig {
  name?: string;
  entry?: string;
  canvas?: {
    width?: number;
    height?: number;
    preset?: string;
    backgroundColor?: string;
  };
  export?: {
    format?: string;
    fps?: number;
    duration?: number;
    quality?: string;
    platform?: string;
    output?: string;
    deterministic?: boolean;
    audioCodec?: 'any' | 'aac';
  };
}

export interface ResolvedSceneInput {
  kind: 'project' | 'batch';
  filePath: string;
  dir: string;
  rawText: string;
  parsed: unknown;
  projectConfig?: ProjectConfig;
}

export interface ExtractedToolResult {
  ok: boolean;
  text: string;
  data: unknown;
  images: Array<{ data: string; mimeType: string }>;
}

const HERE = dirname(fileURLToPath(import.meta.url));
/** Root folder of the installed @pinepaper.studio/mcp-server package. */
export const PACKAGE_ROOT = resolve(HERE, '..', '..');

export function cliMeta(command: string): Record<string, unknown> {
  return {
    package: '@pinepaper.studio/mcp-server',
    version: SERVER_VERSION,
    ...(SERVER_BUILD ? { build: SERVER_BUILD } : {}),
    command,
  };
}

/** Write structured JSON output to stdout with a versioned _meta envelope. */
export function emitJson(command: string, payload: Record<string, unknown>): void {
  console.log(JSON.stringify({ _meta: cliMeta(command), ...payload }, null, 2));
}

/**
 * Report a failure in the form the caller asked for and return the exit code: one line on stderr, or with `--json`
 * a `{ ok: false, error }` envelope on stdout. Every error path goes through here so `--json` is honoured everywhere.
 */
export function failWith(
  json: boolean,
  command: string,
  message: string,
  code = 1,
  extra: Record<string, unknown> = {},
): number {
  if (json) emitJson(command, { ok: false, error: message, ...extra });
  else console.error(`pinepaper-mcp ${command}: ${message}`);
  return code;
}

export { redactUrl } from '../utils/redact-url.js';

/** Format a single status line for terminal diagnostics. */
export function formatCheckLine(status: CheckStatus, label: string, detail: string, fix?: string): string {
  const tag = `[${status}]`.padEnd(6);
  const head = `${tag} ${label.padEnd(18)} ${detail}`;
  return fix ? `${head}\n         fix: ${fix}` : head;
}

function readJsonFile(filePath: string, what: string): { rawText: string; parsed: unknown } {
  let rawText: string;
  try {
    rawText = readFileSync(filePath, 'utf-8');
  } catch (e) {
    throw new Error(`Could not read ${what} at ${filePath}: ${e instanceof Error ? e.message : String(e)}`);
  }
  try {
    return { rawText, parsed: JSON.parse(rawText) };
  } catch (e) {
    throw new Error(`Invalid JSON in ${filePath}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

function resolveFromDirectory(dir: string): { entryPath: string; projectConfig?: ProjectConfig } {
  const manifestPath = join(dir, 'pinepaper.json');
  if (existsSync(manifestPath)) {
    const { parsed } = readJsonFile(manifestPath, 'pinepaper.json');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${manifestPath} must contain a JSON object.`);
    }
    const cfg = parsed as ProjectConfig;
    const entryRel = typeof cfg.entry === 'string' && cfg.entry.trim() ? cfg.entry.trim() : 'scene.batch.json';
    const entryPath = resolve(dir, entryRel);
    if (!existsSync(entryPath)) {
      throw new Error(`Project entry file "${entryRel}" listed in ${manifestPath} does not exist (${entryPath}).`);
    }
    return { entryPath, projectConfig: cfg };
  }
  for (const candidate of ['scene.batch.json', 'scene.pinepaper.json']) {
    const full = join(dir, candidate);
    if (existsSync(full)) return { entryPath: full };
  }
  throw new Error(
    `No PinePaper project or scene found in ${dir}. Expected pinepaper.json, scene.batch.json, or scene.pinepaper.json (run \`pinepaper-mcp init\` to create one).`,
  );
}

/** Resolve a file path or project directory into a typed scene or batch input. */
export function resolveSceneInput(targetPath = '.'): ResolvedSceneInput {
  const abs = resolve(targetPath);
  if (!existsSync(abs)) {
    throw new Error(`Path not found: ${abs}`);
  }
  let entryPath = abs;
  let projectConfig: ProjectConfig | undefined;
  const st = statSync(abs);
  if (st.isDirectory()) {
    ({ entryPath, projectConfig } = resolveFromDirectory(abs));
  } else if (abs.endsWith('pinepaper.json')) {
    const dir = dirname(abs);
    ({ entryPath, projectConfig } = resolveFromDirectory(dir));
  } else {
    const siblingCfg = join(dirname(abs), 'pinepaper.json');
    if (existsSync(siblingCfg)) {
      try {
        const { parsed } = readJsonFile(siblingCfg, 'pinepaper.json');
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          projectConfig = parsed as ProjectConfig;
        }
      } catch {
        // Ignore optional sibling config error when caller pointed directly at a scene file
      }
    }
  }

  const { rawText, parsed } = readJsonFile(entryPath, 'scene file');
  const dir = dirname(entryPath);

  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>;
    if (obj.kind === 'pinepaper.project') {
      return { kind: 'project', filePath: entryPath, dir, rawText, parsed, projectConfig };
    }
    if (Array.isArray(obj.operations)) {
      return { kind: 'batch', filePath: entryPath, dir, rawText, parsed, projectConfig };
    }
  }
  if (Array.isArray(parsed)) {
    return { kind: 'batch', filePath: entryPath, dir, rawText, parsed, projectConfig };
  }
  throw new Error(
    `${entryPath} is neither a PinePaper batch spec ({ "operations": [...] } or [...]) nor a saved scene document ("kind": "pinepaper.project").`,
  );
}

function tryParseTrailingJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
  }
  for (const marker of ['\nResult: {', '\n\n{']) {
    const idx = text.lastIndexOf(marker);
    if (idx !== -1) {
      const start = text.indexOf('{', idx);
      try { return JSON.parse(text.slice(start)); } catch { /* try next */ }
    }
  }
  return null;
}

/** Extract structured data, text, and images from an MCP CallToolResult. */
export function extractToolJson(result: CallToolResult): ExtractedToolResult {
  const textParts: string[] = [];
  const images: Array<{ data: string; mimeType: string }> = [];
  for (const item of result.content ?? []) {
    if (item.type === 'text' && typeof item.text === 'string') {
      textParts.push(item.text);
    } else if (item.type === 'image' && typeof item.data === 'string') {
      images.push({ data: item.data, mimeType: typeof item.mimeType === 'string' ? item.mimeType : 'image/png' });
    }
  }
  const text = textParts.join('\n\n');
  let data: unknown = (result as { structuredContent?: unknown }).structuredContent;
  if (data === undefined && textParts.length > 0) {
    data = tryParseTrailingJson(textParts[0]);
  }
  return {
    ok: !result.isError,
    text,
    data,
    images,
  };
}
