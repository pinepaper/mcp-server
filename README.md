# PinePaper MCP Server

> Create animated graphics with AI using the Model Context Protocol

[![npm version](https://badge.fury.io/js/%40pinepaper%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

PinePaper MCP Server enables AI assistants like Claude to create and animate graphics in [PinePaper Studio](https://pinepaper.studio). Using natural language, you can:

- Create text, shapes, and complex graphics
- Animate items with behavior-driven relations
- Generate procedural backgrounds
- Export animated SVG and training data

## Quick Start

### 1. Install

```bash
# Using npm
npm install -g @pinepaper/mcp-server

# Using bun
bun add -g @pinepaper/mcp-server
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
      "args": ["-y", "@pinepaper/mcp-server"]
    }
  }
}
```

### 3. Start Using

Open Claude Desktop and try:

> "Create a red pulsing text that says HELLO"

> "Create a sun and earth, make earth orbit the sun"

> "Add a sunburst background with blue and purple colors"

## Features

### 🎨 Item Creation

Create text, shapes, and custom graphics:

```
"Create a blue circle at position 200, 300 with radius 50"
"Add a gold star in the center"
"Create text saying 'Welcome' with font size 72"
```

### 🔄 Relations (Behavior-Driven Animation)

The **key feature** - describe HOW items should behave:

| Relation | Description | Example |
|----------|-------------|---------|
| `orbits` | Circular motion | "Moon orbits Earth" |
| `follows` | Move toward target | "Label follows player" |
| `attached_to` | Fixed offset | "Hat attached to character" |
| `maintains_distance` | Stay at distance | "Satellite 200px from station" |
| `points_at` | Face target | "Arrow points at target" |
| `mirrors` | Mirror position | "Reflection mirrors original" |
| `parallax` | Depth movement | "Background parallax scroll" |
| `bounds_to` | Stay within area | "Player stays in arena" |

### 🎬 Simple Animations

For quick looping effects:

- `pulse` - Scale up/down
- `rotate` - Continuous spin
- `bounce` - Vertical bounce
- `fade` - Opacity cycle
- `wobble` - Side-to-side
- `slide` - Horizontal slide
- `typewriter` - Character reveal

### 🖼️ Background Generators

Procedural patterns:

- `drawSunburst` - Radial rays
- `drawSunsetScene` - Animated sunset
- `drawGrid` - Lines, dots, squares
- `drawWaves` - Layered waves
- `drawCircuit` - Tech circuit board

### 📊 Training Data Export

Generate instruction/code pairs for LLM fine-tuning:

```
"Export training data from this scene"
```

Outputs pairs like:
```json
{
  "instruction": "moon orbits earth at radius 100",
  "code": "app.addRelation('item_1', 'item_2', 'orbits', {radius: 100})"
}
```

## Tools Reference

### Item Tools
| Tool | Description |
|------|-------------|
| `pinepaper_create_item` | Create text, shapes, graphics |
| `pinepaper_modify_item` | Change item properties |
| `pinepaper_delete_item` | Remove an item |

### Relation Tools
| Tool | Description |
|------|-------------|
| `pinepaper_add_relation` | Create behavioral relationship |
| `pinepaper_remove_relation` | Remove relationship |
| `pinepaper_query_relations` | Find existing relations |

### Animation Tools
| Tool | Description |
|------|-------------|
| `pinepaper_animate` | Apply simple loop animation |
| `pinepaper_keyframe_animate` | Timed keyframe animation |
| `pinepaper_play_timeline` | Control playback |

### Generator Tools
| Tool | Description |
|------|-------------|
| `pinepaper_execute_generator` | Run background generator |
| `pinepaper_list_generators` | List available generators |

### Effect Tools
| Tool | Description |
|------|-------------|
| `pinepaper_apply_effect` | Apply sparkle, blast effects |

### Query Tools
| Tool | Description |
|------|-------------|
| `pinepaper_get_items` | Get canvas items |
| `pinepaper_get_relation_stats` | Relation statistics |

### Canvas Tools
| Tool | Description |
|------|-------------|
| `pinepaper_set_background_color` | Set background |
| `pinepaper_set_canvas_size` | Set dimensions |

### Export Tools
| Tool | Description |
|------|-------------|
| `pinepaper_export_svg` | Export animated SVG |
| `pinepaper_export_training_data` | Export LLM training pairs |

## Examples

### Solar System

```
1. Create a yellow circle as the sun (radius 60) at center
2. Create a blue circle as Earth (radius 20)
3. Create a gray circle as the Moon (radius 8)
4. Add relation: Earth orbits Sun at radius 150, speed 0.3
5. Add relation: Moon orbits Earth at radius 40, speed 0.8
```

### Animated Logo

```
1. Create text "BRAND" with font size 96
2. Apply pulse animation with speed 0.5
3. Apply sparkle effect with gold color
4. Add sunburst background
```

### Following Labels

```
1. Create a circle as "player"
2. Create text "Player 1" as the label
3. Add relation: label follows player with offset [0, -50]
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Desktop                          │
│                          │                                  │
│                    MCP Protocol                             │
│                          │                                  │
│              ┌───────────▼───────────┐                     │
│              │  PinePaper MCP Server │                     │
│              │  ┌─────────────────┐  │                     │
│              │  │  Tool Handlers  │  │                     │
│              │  └────────┬────────┘  │                     │
│              │           │           │                     │
│              │  ┌────────▼────────┐  │                     │
│              │  │ Code Generator  │  │                     │
│              │  └────────┬────────┘  │                     │
│              └───────────┼───────────┘                     │
│                          │                                  │
│              ┌───────────▼───────────┐                     │
│              │   PinePaper Studio    │                     │
│              │   (Browser/App)       │                     │
│              └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Setup

```bash
git clone https://github.com/pinepaper/mcp-server.git
cd mcp-server

# Using npm
npm install
npm run build

# Using bun (recommended)
bun install
bun run build
```

### Test with Claude Desktop (Local)

1. Build the server:
   ```bash
   # Using npm
   npm run build

   # Using bun
   bun run build
   ```

2. Add to Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
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

3. Restart Claude Desktop

4. Test with: "What PinePaper tools do you have available?"

### Run Tests

```bash
# Using npm
npm test

# Using bun
bun test

# Run with coverage
bun test --coverage
```

### Development Watch Mode

```bash
# Using npm
npm run dev

# Using bun
bun run dev
```

## Internationalization (i18n)

PinePaper MCP Server supports 51 languages, providing localized tool descriptions and messages for AI agents.

### Supported Languages

| Category | Languages |
|----------|-----------|
| **European** | English, Spanish, French, German, Italian, Portuguese (+ Brazilian), Dutch, Polish, Russian, Ukrainian, Swedish, Danish, Norwegian, Finnish, Czech, Greek, Hungarian, Romanian, Turkish, Icelandic |
| **East Asian** | Chinese (Simplified & Traditional), Japanese, Korean |
| **Southeast Asian** | Thai, Vietnamese, Indonesian, Malay, Tagalog, Filipino |
| **South Asian** | Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu |
| **Middle Eastern** | Arabic, Hebrew, Persian (RTL support) |
| **Indigenous (Canada)** | Chipewyan, Cree, Michif, Inuktitut, Mi'kmaq, Mohawk, Ojibwe |

### How It Works

The i18n system provides localized:
- Tool names and descriptions
- Error messages
- Success messages
- UI labels for item types, relations, animations, and generators

### Setting Language

Set the `PINEPAPER_LOCALE` environment variable:

```bash
# In Claude Desktop config
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper/mcp-server"],
      "env": {
        "PINEPAPER_LOCALE": "ja"
      }
    }
  }
}
```

Or programmatically:

```typescript
import { setLocale, t } from '@pinepaper/mcp-server';

// Set locale
setLocale('fr');

// Get translated string
const description = t('tools.pinepaper_create_item.description');
```

### Adding New Languages

1. Create a new locale file in `src/i18n/locales/` (e.g., `xx.ts`)
2. Copy the structure from `en.ts`
3. Translate all strings
4. Export from `src/i18n/locales/index.ts`
5. Add to the `localeMap`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PINEPAPER_DEBUG` | Enable debug logging | `false` |
| `PINEPAPER_LOG_LEVEL` | Log level (error/warn/info/debug) | `info` |
| `PINEPAPER_LOCALE` | Language locale code | `en` |

## API Documentation

Full API documentation available at:
- [PinePaper API Docs](https://pinepaper.studio/docs/api)
- [MCP Tools Specification](https://pinepaper.studio/docs/mcp)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [PinePaper Studio](https://pinepaper.studio)
- [Documentation](https://pinepaper.studio/docs)
- [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)
- [MCP Specification](https://modelcontextprotocol.io)

## Support

- 📧 Email: support@pinepaper.studio
- 🐛 Issues: [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)

---

Made with ❤️ by the PinePaper team
