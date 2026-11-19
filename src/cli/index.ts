/**
 * PinePaper CLI subcommand registry, help generator, and dispatcher.
 */

import { getToolsForToolkit, getToolsForVerbosity, PINEPAPER_TOOLS } from '../tools/index.js';
import type { ToolkitProfile } from '../tools/toolkits.js';
import { SERVER_VERSION } from '../version.js';
import { suggestCommand } from './args.js';
import { benchmarkCommand } from './commands/benchmark.js';
import { browserCommand } from './commands/browser.js';
import { callCommand } from './commands/call.js';
import { checkCommand } from './commands/check.js';
import { docsCommand } from './commands/docs.js';
import { doctorCommand } from './commands/doctor.js';
import { infoCommand } from './commands/info.js';
import { initCommand } from './commands/init.js';
import { previewCommand } from './commands/preview.js';
import { renderCommand } from './commands/render.js';
import { setupCommand } from './commands/setup.js';
import { snapshotCommand } from './commands/snapshot.js';
import { toolsCommand } from './commands/tools.js';
import type { CliCategory, CliCommand } from './types.js';

export const CLI_COMMANDS: readonly CliCommand[] = [
  doctorCommand,
  infoCommand,
  browserCommand,
  setupCommand,
  docsCommand,
  toolsCommand,
  initCommand,
  previewCommand,
  checkCommand,
  renderCommand,
  snapshotCommand,
  benchmarkCommand,
  callCommand,
];

const COMMAND_MAP = new Map<string, CliCommand>();
for (const cmd of CLI_COMMANDS) {
  COMMAND_MAP.set(cmd.name, cmd);
  for (const alias of cmd.aliases ?? []) {
    COMMAND_MAP.set(alias, cmd);
  }
}

const ALL_COMMAND_NAMES = [...COMMAND_MAP.keys(), 'serve', 'help'];

export function resolveSubcommand(name: string): CliCommand | null {
  return COMMAND_MAP.get(name.toLowerCase()) ?? null;
}

const CATEGORY_ORDER: readonly CliCategory[] = [
  'Setup & Diagnostics',
  'Docs & Discovery',
  'Authoring & Preview',
  'Quality & Rendering',
];

/** Format the unified CLI + MCP Server help message. */
export function formatMainHelp(): string {
  const compact = getToolsForVerbosity('compact');
  const countFor = (p: ToolkitProfile) => `${getToolsForToolkit(compact, p).length} tools`;

  const commandSections: string[] = [];
  for (const cat of CATEGORY_ORDER) {
    const items = CLI_COMMANDS.filter((c) => c.category === cat);
    if (!items.length) continue;
    commandSections.push(`  ${cat}:`);
    for (const c of items) {
      const label = c.aliases?.length ? `${c.name} (${c.aliases.join(', ')})` : c.name;
      commandSections.push(`    ${label.padEnd(26)} ${c.summary}`);
    }
  }
  commandSections.push('  MCP Server:');
  commandSections.push(`    ${'serve (default)'.padEnd(26)} Start the stdio MCP server (all ${PINEPAPER_TOOLS.length} tools)`);
  commandSections.push(`    ${'help [command]'.padEnd(26)} Show help for a CLI command`);

  return `
PinePaper CLI & MCP Server v${SERVER_VERSION}

Create, validate, preview, and render animated vector graphics & MP4/SVG videos with AI agents.

USAGE:
  pinepaper-mcp [options]                    Start stdio MCP server (default)
  pinepaper-mcp <command> [args] [options]   Run a CLI command
  pinepaper-mcp help <command>               Show help for a specific command

COMMANDS:
${commandSections.join('\n')}

MCP SERVER OPTIONS:
  --help, -h              Show this help message
  --version, -v           Show version number
  --mode <mode>           Execution mode: 'puppeteer' (default) or 'code'
  --toolkit <profile>     Tool visibility profile (default: core)
                          - core: Craft tools, agent workflow, canvas and query (${countFor('core')}); load more via pinepaper_set_toolkit
                          - full: Every tool (${countFor('full')})
                          - agent: Everything except diagnostics and register_item (${countFor('agent')})
                          - diagram | map | font | minimal | lane | edit | starter
  --verbosity <level>     Tool description detail: verbose | compact (default) | minimal

ENVIRONMENT VARIABLES:
  PINEPAPER_TOOLKIT           Tool visibility profile (same values as --toolkit)
  PINEPAPER_VERBOSITY         Description verbosity (same values as --verbosity)
  PINEPAPER_EXECUTION_MODE    Execution mode ('puppeteer' or 'code')
  PINEPAPER_STUDIO_URL        Studio URL (default: https://pinepaper.studio)
  PINEPAPER_EXPORT_DIR        Output folder (default: ~/Downloads/PinePaper)
  PINEPAPER_CHROME_PATH       Path to Chrome/Chromium/Edge/Brave executable
  PINEPAPER_PUPPETEER_FROM    Project folder to resolve puppeteer/puppeteer-core
  PINEPAPER_ALLOW_CODE        Allow agent/scene JavaScript ('1' turns it on; off by default)
  PINEPAPER_ALLOW_LOCAL_FILES Allow local file imports outside export dir ('1' turns it on)
  PINEPAPER_SCREENSHOT_MODE   Screenshot behavior ('on_request', 'always', 'never')
  PINEPAPER_LOCALE            UI locale (e.g., 'en', 'ja', 'zh-CN')
  PINEPAPER_WAIT_UNTIL        Navigation wait condition ('load', 'domcontentloaded', 'networkidle0', 'networkidle2')
  PINEPAPER_TIMEOUT           Navigation/readiness timeout in ms (default 30000)
  PINEPAPER_PROXY             Chrome --proxy-server value
  PINEPAPER_EXPORT_TIMEOUT    Governor budget for export runs in ms (default 300000)
  PINEPAPER_GOVERNOR          'off' bypasses the page governor

DOCUMENTATION:
  https://pinepaper.studio/docs/mcp

SUPPORT:
  https://github.com/pinepaper/mcp-server/issues
`;
}

/** Dispatch a non-server CLI invocation and return its process exit code. */
export async function runCliCommand(argv: readonly string[]): Promise<number> {
  if (!argv.length) {
    console.log(formatMainHelp());
    return 0;
  }

  const [sub, ...rest] = argv;
  const key = sub.toLowerCase();

  if (key === 'help') {
    if (!rest.length) {
      console.log(formatMainHelp());
      return 0;
    }
    const target = rest[0].toLowerCase();
    if (target === 'serve') {
      console.log('Usage: pinepaper-mcp [serve] [--mode puppeteer|code] [--toolkit <profile>] [--verbosity <level>]');
      return 0;
    }
    const found = resolveSubcommand(target);
    if (!found) {
      const hint = suggestCommand(target, ALL_COMMAND_NAMES);
      console.error(`Unknown command "${rest[0]}".${hint ? ` Did you mean "${hint}"?` : ''}`);
      console.error('Run `pinepaper-mcp --help` to list all commands.');
      return 2;
    }
    console.log(found.helpText);
    return 0;
  }

  const cmd = resolveSubcommand(key);
  if (!cmd) {
    const hint = suggestCommand(key, ALL_COMMAND_NAMES);
    console.error(`Unknown command "${sub}".${hint ? ` Did you mean "${hint}"?` : ''}`);
    console.error('Run `pinepaper-mcp --help` to list all commands.');
    return 2;
  }

  return cmd.run(rest);
}
