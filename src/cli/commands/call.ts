/**
 * `pinepaper-mcp call <tool-name> [json|@file|-]` — Directly invoke any of
 * PinePaper's MCP tools from shell scripts, CI, or coding agents.
 */

import { readFileSync } from 'node:fs';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';
import { GUARDED_TOOLS } from '../../tools/stale-build-guard.js';
import { env } from '../../utils/env.js';
import { boolFlag, strFlag, suggestCommand } from '../args.js';
import { emitJson, extractToolJson, failWith } from '../output.js';
import { withCliBrowser, withScopedCapabilities } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Direct Tool Call

Invoke any PinePaper MCP tool directly from the terminal.

USAGE:
  pinepaper-mcp call <tool-name> [json-args | @args.json | -] [options]

OPTIONS:
  --mode <mode>         Execution mode: puppeteer (default) or code
  --allow-code          Enable PINEPAPER_ALLOW_CODE for this call
  --allow-local-files   Enable PINEPAPER_ALLOW_LOCAL_FILES for this call
  --allow-stale-build   For a rendering tool: export even if the studio page is on an old build (default: refused)
  --studio-url <url>    Override Studio URL
  --json                Emit machine-readable JSON output
  -h, --help            Show help

EXAMPLES:
  pinepaper-mcp call pinepaper_query_capabilities '{"action":"list"}' --mode code
  pinepaper-mcp call pinepaper_create_item '{"itemType":"circle","position":{"x":200,"y":200}}'`;

function resolveToolName(raw: string) {
  const exact = PINEPAPER_TOOLS.find((t) => t.name === raw);
  if (exact) return exact;
  if (!raw.startsWith('pinepaper_')) {
    return PINEPAPER_TOOLS.find((t) => t.name === `pinepaper_${raw}`) ?? null;
  }
  return null;
}

async function readStdinAll(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const c of process.stdin) chunks.push(c as Buffer);
  return Buffer.concat(chunks).toString('utf-8').trim();
}

async function parseCallArgs(rawArg?: string): Promise<Record<string, unknown>> {
  let raw = '';
  if (rawArg === '-' || rawArg === '@-') {
    raw = await readStdinAll();
  } else if (rawArg && rawArg.startsWith('@')) {
    raw = readFileSync(rawArg.slice(1), 'utf-8').trim();
  } else if (rawArg !== undefined) {
    raw = rawArg.trim();
  }
  if (!raw) return {};
  const val = JSON.parse(raw);
  if (!val || typeof val !== 'object' || Array.isArray(val)) {
    throw new Error('Tool arguments must be a JSON object.');
  }
  return val as Record<string, unknown>;
}

export const callCommand: CliCommand = {
  name: 'call',
  category: 'Quality & Rendering',
  summary: `Invoke any of the ${PINEPAPER_TOOLS.length} MCP tools directly with JSON arguments`,
  usage: 'pinepaper-mcp call <tool-name> [json|@file|-] [--mode puppeteer|code] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, callCommand, {
      mode: { type: 'string' },
      'allow-code': { type: 'boolean' },
      'allow-local-files': { type: 'boolean' },
      'allow-stale-build': { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const rawTool = parsed.parsed.positionals[0];
    if (!rawTool) {
      return failWith(parsed.json, 'call', 'Usage: pinepaper-mcp call <tool-name> [json-args|@file|-]', 2);
    }

    const tool = resolveToolName(rawTool);
    if (!tool) {
      const hint = suggestCommand(rawTool, PINEPAPER_TOOLS.map((t) => t.name));
      return failWith(parsed.json, 'call', `Unknown tool "${rawTool}".${hint ? ` Did you mean "${hint}"?` : ''}`, 1, { tool: rawTool });
    }

    let toolArgs: Record<string, unknown>;
    try {
      toolArgs = await parseCallArgs(parsed.parsed.positionals[1]);
    } catch (e) {
      return failWith(parsed.json, 'call', `Invalid tool arguments: ${e instanceof Error ? e.message : String(e)}`, 2, { tool: tool.name });
    }

    const mode = (strFlag(parsed.parsed.flags, 'mode') || env('PINEPAPER_EXECUTION_MODE') || 'puppeteer').toLowerCase();
    if (mode !== 'puppeteer' && mode !== 'code') {
      return failWith(parsed.json, 'call', `Invalid --mode "${mode}". Use "puppeteer" or "code".`, 2, { tool: tool.name });
    }
    const allowCode = boolFlag(parsed.parsed.flags, 'allow-code') === true;
    const allowLocalFiles = boolFlag(parsed.parsed.flags, 'allow-local-files') === true;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url');
    if (boolFlag(parsed.parsed.flags, 'allow-stale-build') === true && GUARDED_TOOLS.has(tool.name)) toolArgs = { ...toolArgs, allowStaleBuild: true };

    try {
      let res;
      if (mode === 'code') {
        res = await withScopedCapabilities({ code: allowCode, localFiles: allowLocalFiles }, () =>
          handleToolCall(tool.name, toolArgs, { executeInBrowser: false, executionMode: 'code' }),
        );
      } else {
        res = await withCliBrowser({ studioUrl, headless: true, allowCode, allowLocalFiles }, (_ctl, handlerOpts) =>
          handleToolCall(tool.name, toolArgs, handlerOpts),
        );
      }

      const ext = extractToolJson(res);
      if (parsed.json) {
        emitJson('call', {
          tool: tool.name,
          mode,
          ok: ext.ok,
          result: ext.data ?? ext.text,
          ...(ext.images.length ? { imageCount: ext.images.length } : {}),
        });
        return ext.ok ? 0 : 1;
      }

      if (ext.text) console.log(ext.text);
      else if (ext.data !== undefined) console.log(JSON.stringify(ext.data, null, 2));
      if (ext.images.length && !ext.text) console.log(`[${ext.images.length} image(s) returned]`);
      return ext.ok ? 0 : 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('call', { tool: tool.name, mode, ok: false, error: msg });
      else console.error(`pinepaper-mcp call: ${msg}`);
      return 1;
    }
  },
};
