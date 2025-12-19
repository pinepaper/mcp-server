# MCP Server Installation

Install the PinePaper MCP Server to create animated graphics with AI assistants like Claude Desktop.

[![npm version](https://badge.fury.io/js/%40pinepaper.studio%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)

## Quick Start

### 1. Install

```bash
# Using npm
npm install -g @pinepaper.studio/mcp-server

# Using npx (no installation required)
npx @pinepaper.studio/mcp-server
```

### 2. Configure Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"]
    }
  }
}
```

### 3. Restart Claude Desktop

Restart Claude Desktop to load the MCP server.

### 4. Start Creating

Try these prompts in Claude Desktop:

- *"Create a red pulsing text that says HELLO"*
- *"Create a sun and earth, make earth orbit the sun"*
- *"Add a sunburst background with blue and purple colors"*
- *"Create an animated logo with sparkle effect"*

## Alternative Installation Methods

### Global Installation

For frequent use, install globally:

```bash
npm install -g @pinepaper.studio/mcp-server
```

Then use in config:

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "pinepaper-mcp"
    }
  }
}
```

### Local Development

Clone and run locally:

```bash
git clone https://github.com/pinepaper/mcp-server.git
cd mcp-server

# Using npm
npm install
npm run build

# Using bun
bun install
bun run build
```

Then configure with absolute path:

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "node",
      "args": ["/full/path/to/mcp-server/dist/cli.js"]
    }
  }
}
```

## Verify Installation

After configuring, ask Claude:

> "What PinePaper tools do you have available?"

Claude should respond with a list of available tools including:
- `pinepaper_create_item`
- `pinepaper_add_relation`
- `pinepaper_animate`
- And more...

## Available Tools

| Category | Tools |
|----------|-------|
| **Canvas** | `set_canvas_size`, `get_canvas_size`, `set_background_color`, `clear_canvas` |
| **Items** | `create_item`, `modify_item`, `delete_item` |
| **Relations** | `add_relation`, `remove_relation`, `query_relations` |
| **Animation** | `animate`, `keyframe_animate`, `play_timeline` |
| **Generators** | `execute_generator`, `list_generators` |
| **Effects** | `apply_effect` |
| **Query** | `get_items`, `get_relation_stats` |
| **Export** | `export_svg`, `export_training_data` |

See [Tools Specification](mcp/tools-spec.md) for detailed documentation.

## Troubleshooting

### Server Not Loading

1. Check config file syntax (valid JSON)
2. Verify Node.js is installed: `node --version`
3. Check Claude Desktop logs for errors

### Tools Not Available

1. Restart Claude Desktop after config changes
2. Ensure npx is in your PATH
3. Try global installation instead of npx

### Connection Issues

If PinePaper Studio isn't connecting:

1. Open [PinePaper Studio](https://pinepaper.studio/editor) in browser
2. Check browser console for errors
3. Ensure no browser extensions block WebSocket connections

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PINEPAPER_DEBUG` | Enable debug logging | `false` |
| `PINEPAPER_LOG_LEVEL` | Log level (error/warn/info/debug) | `info` |

## Links

- [npm Package](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)
- [GitHub Repository](https://github.com/pinepaper/mcp-server)
- [MCP Specification](https://modelcontextprotocol.io)
- [PinePaper Studio](https://pinepaper.studio)
