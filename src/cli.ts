#!/usr/bin/env node
/**
 * PinePaper CLI & MCP Server
 *
 * Entry point for both the stdio MCP server (default / `serve`) and the
 * developer CLI subcommands (`doctor`, `info`, `browser`, `docs`, `tools`,
 * `setup`, `init`, `check`, `preview`, `snapshot`, `render`, `benchmark`, `call`).
 */

import { createServer, ServerOptions } from './index.js';
import { StdioServerTransport } from './mcp/index.js';
import { exitWhenClientGone } from './utils/exit-when-client-gone.js';
import { ExecutionMode } from './tools/handlers.js';
import { TOOLKIT_PROFILES_LIST } from './tools/toolkits.js';
import type { ToolkitProfile } from './tools/toolkits.js';
import type { ToolVerbosity } from './tools/definitions.js';
import { getToolsForToolkit, getToolsForVerbosity } from './tools/index.js';
import { SERVER_VERSION } from './version.js';
import { env } from './utils/env.js';
import { formatMainHelp, runCliCommand } from './cli/index.js';

const VERSION = SERVER_VERSION;
const VALID_VERBOSITIES: ToolVerbosity[] = ['verbose', 'compact', 'minimal'];

async function main(): Promise<void> {
  const rawArgs = process.argv.slice(2);
  const first = rawArgs[0];

  // Top-level version / help when not routing into a subcommand
  if (first === '--version' || first === '-v') {
    console.log(VERSION);
    process.exit(0);
  }
  if (first === '--help' || first === '-h') {
    console.log(formatMainHelp());
    process.exit(0);
  }

  // Dispatch CLI subcommands (everything except explicit `serve` and flag-only MCP startup)
  if (first && !first.startsWith('-') && first.toLowerCase() !== 'serve') {
    const code = await runCliCommand(rawArgs);
    process.exit(code);
  }

  const args = first?.toLowerCase() === 'serve' ? rawArgs.slice(1) : rawArgs;

  if (args.includes('--help') || args.includes('-h')) {
    console.log(formatMainHelp());
    process.exit(0);
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  // Parse --mode flag
  let executionMode: ExecutionMode | undefined;
  const modeIndex = args.indexOf('--mode');
  if (modeIndex !== -1 && args[modeIndex + 1]) {
    const modeArg = args[modeIndex + 1].toLowerCase();
    if (modeArg === 'puppeteer' || modeArg === 'code') {
      executionMode = modeArg;
    } else {
      console.error(`Invalid mode: ${modeArg}. Use 'puppeteer' or 'code'.`);
      process.exit(1);
    }
  }

  // Parse --toolkit flag
  let toolkit: ToolkitProfile | undefined;
  const toolkitIndex = args.indexOf('--toolkit');
  if (toolkitIndex !== -1 && args[toolkitIndex + 1]) {
    const toolkitArg = args[toolkitIndex + 1].toLowerCase();
    if (TOOLKIT_PROFILES_LIST.includes(toolkitArg as ToolkitProfile)) {
      toolkit = toolkitArg as ToolkitProfile;
    } else {
      console.error(`Invalid toolkit: ${toolkitArg}. Use one of: ${TOOLKIT_PROFILES_LIST.join(', ')}.`);
      process.exit(1);
    }
  }

  // Parse --verbosity flag
  let verbosity: ToolVerbosity | undefined;
  const verbosityIndex = args.indexOf('--verbosity');
  if (verbosityIndex !== -1 && args[verbosityIndex + 1]) {
    const verbosityArg = args[verbosityIndex + 1].toLowerCase();
    if (VALID_VERBOSITIES.includes(verbosityArg as ToolVerbosity)) {
      verbosity = verbosityArg as ToolVerbosity;
    } else {
      console.error(`Invalid verbosity: ${verbosityArg}. Use one of: ${VALID_VERBOSITIES.join(', ')}.`);
      process.exit(1);
    }
  }

  // Build server options
  const serverOptions: ServerOptions = {};
  if (executionMode) serverOptions.executionMode = executionMode;
  if (toolkit) serverOptions.toolkit = toolkit;
  if (verbosity) serverOptions.verbosity = verbosity;

  // Start the stdio MCP server
  try {
    const server = await createServer(serverOptions);
    const transport = new StdioServerTransport();

    const modeDisplay = executionMode || env('PINEPAPER_EXECUTION_MODE') || 'puppeteer';
    const toolkitDisplay = toolkit || env('PINEPAPER_TOOLKIT') || 'core';
    const verbosityDisplay = verbosity || env('PINEPAPER_VERBOSITY') || env('PINEPAPER_TOOL_VERBOSITY') || 'compact';
    const toolCount = getToolsForToolkit(getToolsForVerbosity(verbosityDisplay as ToolVerbosity), toolkitDisplay as ToolkitProfile).length;

    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║          PinePaper MCP Server v' + VERSION + '             ║');
    console.error('╠═══════════════════════════════════════════════════╣');
    console.error('║  Create animated graphics with AI                 ║');
    console.error('║  https://pinepaper.studio                         ║');
    console.error('╠═══════════════════════════════════════════════════╣');
    console.error(`║  Mode: ${modeDisplay.padEnd(42)}║`);
    console.error(`║  Toolkit: ${toolkitDisplay.padEnd(39)}║`);
    console.error(`║  Verbosity: ${verbosityDisplay.padEnd(37)}║`);
    console.error(`║  Tools: ${String(toolCount).padEnd(41)}║`);
    console.error('╚═══════════════════════════════════════════════════╝');
    console.error('');
    console.error('Server starting on stdio transport...');

    exitWhenClientGone(server);
    await server.connect(transport);

    console.error('Server connected and ready');
    console.error('');
    if (modeDisplay === 'code') {
      console.error('Code Generation Mode: Tools will output code for manual paste.');
      console.error('Open https://pinepaper.studio/editor and paste code in the console.');
    } else {
      console.error('Agent Mode (Enforced): Headless browser with optimized automation.');
      console.error('Sessions auto-start on first tool call for batch operations.');
    }
    console.error('');
    console.error('Waiting for tool calls...');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
