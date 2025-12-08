#!/usr/bin/env node
/**
 * PinePaper MCP Server CLI
 * 
 * Entry point for running the MCP server from command line.
 */

import { createServer } from './index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const VERSION = '1.0.0';

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
  --help, -h      Show this help message
  --version, -v   Show version number

CONFIGURATION:
  Add to your Claude Desktop config (claude_desktop_config.json):

  {
    "mcpServers": {
      "pinepaper": {
        "command": "npx",
        "args": ["-y", "@pinepaper/mcp-server"]
      }
    }
  }

TOOLS:
  Item Creation:
    - pinepaper_create_item    Create text, shapes, graphics
    - pinepaper_modify_item    Modify item properties
    - pinepaper_delete_item    Remove items

  Relations (Animation):
    - pinepaper_add_relation   Create behavior relationships
    - pinepaper_remove_relation Remove relationships
    - pinepaper_query_relations Query existing relations

  Animation:
    - pinepaper_animate        Simple loop animations
    - pinepaper_keyframe_animate Timed keyframe animations
    - pinepaper_play_timeline  Control playback

  Generators:
    - pinepaper_execute_generator Run background generators
    - pinepaper_list_generators   List available generators

  Effects:
    - pinepaper_apply_effect   Apply visual effects

  Query:
    - pinepaper_get_items      Get canvas items
    - pinepaper_get_relation_stats Get relation statistics

  Canvas:
    - pinepaper_set_background_color Set background
    - pinepaper_set_canvas_size      Set dimensions

  Export:
    - pinepaper_export_svg          Export as animated SVG
    - pinepaper_export_training_data Export LLM training pairs

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

  // Start the server
  try {
    const server = await createServer();
    const transport = new StdioServerTransport();

    console.error('╔═══════════════════════════════════════════════════╗');
    console.error('║          PinePaper MCP Server v' + VERSION + '             ║');
    console.error('╠═══════════════════════════════════════════════════╣');
    console.error('║  Create animated graphics with AI                 ║');
    console.error('║  https://pinepaper.studio                         ║');
    console.error('╚═══════════════════════════════════════════════════╝');
    console.error('');
    console.error('Server starting on stdio transport...');

    await server.connect(transport);

    console.error('✓ Server connected and ready');
    console.error('');
    console.error('Waiting for tool calls...');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();
