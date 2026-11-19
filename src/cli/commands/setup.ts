/**
 * `pinepaper-mcp setup [client]` — Generate copy-paste MCP client configs and
 * agent skills installation commands for major AI hosts.
 */

import { TOOLKIT_PROFILES_LIST, type ToolkitProfile } from '../../tools/toolkits.js';
import { boolFlag, strFlag, suggestCommand } from '../args.js';
import { emitJson } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const CLIENTS = ['claude-desktop', 'claude-code', 'cursor', 'codex', 'vscode', 'skills'] as const;
type ClientTarget = (typeof CLIENTS)[number];

const ALIASES: Readonly<Record<string, ClientTarget>> = {
  desktop: 'claude-desktop',
  claude: 'claude-code',
  'vs-code': 'vscode',
  plugin: 'skills',
};

const HELP = `PinePaper Client Setup

Print ready-to-paste MCP client configs and Claude plugin / Agent Skills commands.

USAGE:
  pinepaper-mcp setup [claude-desktop|claude-code|cursor|codex|vscode|skills] [options]

OPTIONS:
  --mode <mode>           Execution mode: puppeteer (default) or code
  --toolkit <profile>     Toolkit profile (${TOOLKIT_PROFILES_LIST.join('|')})
  --allow-code            Include PINEPAPER_ALLOW_CODE=1 in generated env
  --allow-local-files     Include PINEPAPER_ALLOW_LOCAL_FILES=1 in generated env
  --json                  Emit machine-readable JSON output
  -h, --help              Show help`;

interface SetupSpec {
  target: ClientTarget;
  title: string;
  location: string;
  snippet: string;
  notes: string[];
}

function buildNpxArgs(mode: string): string[] {
  return mode === 'code'
    ? ['-y', '@pinepaper.studio/mcp-server', '--mode', 'code']
    : ['-y', '-p', 'puppeteer', '-p', '@pinepaper.studio/mcp-server', 'pinepaper-mcp'];
}

function buildEnvBlock(opts: { mode: string; toolkit?: string; allowCode: boolean; allowLocalFiles: boolean }): Record<string, string> {
  const e: Record<string, string> = {};
  if (opts.mode === 'code') e.PINEPAPER_EXECUTION_MODE = 'code';
  if (opts.toolkit) e.PINEPAPER_TOOLKIT = opts.toolkit;
  if (opts.allowCode) e.PINEPAPER_ALLOW_CODE = '1';
  if (opts.allowLocalFiles) e.PINEPAPER_ALLOW_LOCAL_FILES = '1';
  return e;
}

function specFor(
  target: ClientTarget,
  opts: { mode: string; toolkit?: string; allowCode: boolean; allowLocalFiles: boolean },
): SetupSpec {
  const args = buildNpxArgs(opts.mode);
  const envMap = buildEnvBlock(opts);
  const mcpEntry = {
    command: 'npx',
    args,
    ...(Object.keys(envMap).length ? { env: envMap } : {}),
  };

  switch (target) {
    case 'claude-desktop':
      return {
        target,
        title: 'Claude Desktop',
        location: 'One-click .mcpb extension OR claude_desktop_config.json',
        snippet: JSON.stringify({ mcpServers: { pinepaper: mcpEntry } }, null, 2),
        notes: [
          'Recommended for Claude Desktop: download the signed .mcpb extension (includes Chrome & FFmpeg support):',
          '  https://github.com/pinepaper/mcp-server/releases/latest/download/pinepaper-mcp-server.mcpb',
          'Or paste the JSON above into ~/Library/Application Support/Claude/claude_desktop_config.json (macOS).',
        ],
      };

    case 'claude-code': {
      const envFlags = Object.entries(envMap).flatMap(([k, v]) => ['-e', `${k}=${v}`]);
      const addCmd = ['claude', 'mcp', 'add', 'pinepaper', ...envFlags, '--', 'npx', ...args].join(' ');
      return {
        target,
        title: 'Claude Code',
        location: 'CLI command + Plugin Marketplace',
        snippet: [
          '# 1. Install plugin + bundled MCP server + Agent Skills (recommended):',
          '/plugin marketplace add pinepaper/pinepaper-claude-marketplace',
          '/plugin install pinepaper',
          '',
          '# OR add the MCP server directly:',
          addCmd,
        ].join('\n'),
        notes: ['Plugin includes the pinepaper-studio skill and pp: design knowledge graph references.'],
      };
    }

    case 'cursor':
      return {
        target,
        title: 'Cursor',
        location: '.cursor/mcp.json (project) or ~/.cursor/mcp.json (global)',
        snippet: JSON.stringify({ mcpServers: { pinepaper: mcpEntry } }, null, 2),
        notes: ['Restart or reload Cursor MCP servers after saving.'],
      };

    case 'codex': {
      const envLines = Object.entries(envMap).map(([k, v]) => `${k} = "${v}"`);
      const toml = [
        '[mcp_servers.pinepaper]',
        'command = "npx"',
        `args = ${JSON.stringify(args)}`,
        ...(envLines.length ? ['', '[mcp_servers.pinepaper.env]', ...envLines] : []),
      ].join('\n');
      return {
        target,
        title: 'OpenAI Codex CLI',
        location: '~/.codex/config.toml',
        snippet: toml,
        notes: ['Append the block above to ~/.codex/config.toml.'],
      };
    }

    case 'vscode':
      return {
        target,
        title: 'VS Code (GitHub Copilot / MCP)',
        location: '.vscode/mcp.json',
        snippet: JSON.stringify({ servers: { pinepaper: mcpEntry } }, null, 2),
        notes: ['Open Command Palette -> "MCP: List Servers" to start PinePaper.'],
      };

    case 'skills':
      return {
        target,
        title: 'PinePaper Agent Skills & Marketplace',
        location: 'Claude Code / claude.ai / Agent Skills discovery',
        snippet: [
          '# Claude Code Plugin Marketplace:',
          '/plugin marketplace add pinepaper/pinepaper-claude-marketplace',
          '/plugin install pinepaper',
          '',
          '# Agent Skills discovery manifest (RFC .well-known):',
          'https://pinepaper.studio/.well-known/agent-skills/index.json',
        ].join('\n'),
        notes: [
          'Includes skills for Console API, Design Knowledge Graph (pp:), Diagrams, DataViz, Maps, Rigging, Fonts, and SVG paths.',
        ],
      };
  }
}

export const setupCommand: CliCommand = {
  name: 'setup',
  category: 'Setup & Diagnostics',
  summary: 'Print MCP client config snippets and Agent Skills install steps',
  usage: 'pinepaper-mcp setup [claude-desktop|claude-code|cursor|codex|vscode|skills]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, setupCommand, {
      mode: { type: 'string' },
      toolkit: { type: 'string', short: 't' },
      'allow-code': { type: 'boolean' },
      'allow-local-files': { type: 'boolean' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const mode = (strFlag(parsed.parsed.flags, 'mode') || 'puppeteer').toLowerCase();
    if (mode !== 'puppeteer' && mode !== 'code') {
      console.error(`Invalid --mode "${mode}". Use "puppeteer" or "code".`);
      return 2;
    }
    const toolkit = strFlag(parsed.parsed.flags, 'toolkit')?.toLowerCase();
    if (toolkit && !TOOLKIT_PROFILES_LIST.includes(toolkit as ToolkitProfile)) {
      console.error(`Invalid --toolkit "${toolkit}". Valid: ${TOOLKIT_PROFILES_LIST.join(', ')}.`);
      return 2;
    }
    const opts = {
      mode,
      toolkit,
      allowCode: boolFlag(parsed.parsed.flags, 'allow-code') === true,
      allowLocalFiles: boolFlag(parsed.parsed.flags, 'allow-local-files') === true,
    };

    const rawTarget = parsed.parsed.positionals[0]?.toLowerCase();
    if (!rawTarget) {
      const specs = CLIENTS.map((c) => specFor(c, opts));
      if (parsed.json) {
        emitJson('setup', { options: opts, targets: specs });
        return 0;
      }
      console.log('PinePaper Client Setup Targets\n');
      for (const s of specs) {
        console.log(`  ${s.target.padEnd(16)} ${s.title} — ${s.location}`);
      }
      console.log('\nPrint snippet for a host: `pinepaper-mcp setup <target>` (e.g. `pinepaper-mcp setup claude-code`)');
      return 0;
    }

    const resolved = (ALIASES[rawTarget] || rawTarget) as ClientTarget;
    if (!CLIENTS.includes(resolved)) {
      const hint = suggestCommand(rawTarget, CLIENTS);
      console.error(`Unknown setup target "${rawTarget}".${hint ? ` Did you mean "${hint}"?` : ''}`);
      console.error(`Available targets: ${CLIENTS.join(', ')}`);
      return 1;
    }

    const spec = specFor(resolved, opts);
    if (parsed.json) {
      emitJson('setup', { options: opts, ...spec });
      return 0;
    }
    console.log(`${spec.title} (${spec.location})\n`);
    console.log(spec.snippet);
    if (spec.notes.length) {
      console.log('\nNotes:\n' + spec.notes.map((n) => `  ${n}`).join('\n'));
    }
    return 0;
  },
};
