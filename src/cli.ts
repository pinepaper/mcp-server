#!/usr/bin/env node
/**
 * PinePaper MCP Server CLI
 *
 * Entry point for running the MCP server from command line.
 */

import { createServer, ServerOptions } from './index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ExecutionMode } from './tools/handlers.js';
import { TOOLKIT_PROFILES_LIST } from './tools/toolkits.js';
import type { ToolkitProfile } from './tools/toolkits.js';
import type { ToolVerbosity } from './tools/definitions.js';
import { getToolsForToolkit, getToolsForVerbosity } from './tools/index.js';

const VERSION = '1.5.1';
const VALID_VERBOSITIES: ToolVerbosity[] = ['verbose', 'compact', 'minimal'];

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // Handle help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
PinePaper MCP Server v${VERSION}

Create animated graphics with AI using the Model Context Protocol.

USAGE:
  pinepaper-mcp [options]

OPTIONS:
  --help, -h              Show this help message
  --version, -v           Show version number
  --mode <mode>           Execution mode: 'puppeteer' or 'code'
                          - puppeteer: Open browser and execute code (default)
                          - code: Generate code only for manual paste
  --toolkit <profile>     Tool visibility profile (default: agent)
                          - full: All ${TOOLKIT_PROFILES_LIST.length > 0 ? '120+' : ''} tools
                          - agent: Core creative tools (~50 tools)
                          - diagram: Diagram/flowchart tools
                          - map: Map/choropleth tools
                          - font: Font creation tools
                          - minimal: Bare essentials
  --verbosity <level>     Tool description detail level (default: compact)
                          - verbose: Full descriptions (~42K tokens)
                          - compact: Shorter descriptions (~37K tokens)
                          - minimal: 1-line summaries (~22K tokens)

ENVIRONMENT VARIABLES:
  PINEPAPER_TOOLKIT           Tool visibility profile (same values as --toolkit)
  PINEPAPER_VERBOSITY         Description verbosity (same values as --verbosity)
  PINEPAPER_EXECUTION_MODE    Execution mode ('puppeteer' or 'code')
  PINEPAPER_SCREENSHOT_MODE   Screenshot behavior ('on_request', 'always', 'never')
  PINEPAPER_LOCALE            UI locale (e.g., 'en', 'ja', 'zh-CN')

  Legacy: PINEPAPER_TOOL_VERBOSITY (use PINEPAPER_VERBOSITY instead)

DOCUMENTATION:
  https://pinepaper.studio/docs/mcp

SUPPORT:
  https://github.com/pinepaper/mcp-server/issues
`);
    process.exit(0);
  }

  // Handle version flag
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

  // Start the server
  try {
    const server = await createServer(serverOptions);
    const transport = new StdioServerTransport();

    const modeDisplay = executionMode || process.env.PINEPAPER_EXECUTION_MODE || 'puppeteer';
    const toolkitDisplay = toolkit || process.env.PINEPAPER_TOOLKIT || 'agent';
    const verbosityDisplay = verbosity || process.env.PINEPAPER_VERBOSITY || process.env.PINEPAPER_TOOL_VERBOSITY || 'compact';
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
