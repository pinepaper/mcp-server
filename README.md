# PinePaper MCP Server

> Create animated graphics with AI using the Model Context Protocol

[![npm version](https://badge.fury.io/js/%40pinepaper.studio%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

PinePaper MCP Server enables AI assistants to create and animate graphics in [PinePaper Studio](https://pinepaper.studio) via the Model Context Protocol (MCP). Works with any AI that supports MCP tool calling (Claude, GPT, Gemini, local models, etc.). Using natural language, you can:

- Create text, shapes, and complex graphics
- Animate items with behavior-driven relations
- Generate procedural backgrounds
- Export animated SVG and training data

## Quick Start

### 1. Install

```bash
# Using npm
npm install -g @pinepaper.studio/mcp-server

# Using bun
bun add -g @pinepaper.studio/mcp-server
```

### 2. Configure Your AI Client

Add to your MCP client configuration. Examples:

**Claude Desktop** (`claude_desktop_config.json`):
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

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

**Other MCP Clients**: Refer to your AI client's MCP configuration documentation.

### 3. Start Using

Open your AI client and try:

> "Create a red pulsing text that says HELLO"

> "Create a sun and earth, make earth orbit the sun"

> "Add a sunburst background with blue and purple colors"

## Features

### 📐 Diagram Tools (NEW in v1.4.3)

Create flowcharts, UML diagrams, network diagrams, and more:

```
"Create a flowchart for user login process"
"Make a UML class diagram for the User class"
"Design a network topology with 3 servers connected to a cloud"
```

**Shape Types:**
- **Flowchart**: process, decision, terminal, data, document, database, preparation
- **UML**: uml-class, uml-usecase, uml-actor
- **Network**: cloud, server
- **Basic**: rectangle, circle, triangle, star

**Connector Features:**
- Smart routing (orthogonal, direct, curved)
- Arrow styles (classic, stealth, diamond, circle, none)
- Animated bolt effect for data flow
- Labels on connectors

**Auto-Layout Algorithms:**
- Hierarchical (flowcharts, org charts)
- Force-directed (network diagrams)
- Tree (hierarchies)
- Radial (mind maps)
- Grid (component libraries)

**Tools:**
- `pinepaper_create_diagram_shape` - Create diagram shapes with ports
- `pinepaper_connect` - Connect items with smart connectors
- `pinepaper_connect_ports` - Connect specific ports
- `pinepaper_add_ports` - Add connection ports to items
- `pinepaper_auto_layout` - Automatically arrange items
- `pinepaper_get_diagram_shapes` - List available shapes
- `pinepaper_update_connector` - Update connector properties
- `pinepaper_remove_connector` - Remove a connector
- `pinepaper_diagram_mode` - Control diagram editing mode

### 🔍 Asset Search & Import (NEW in v1.3.0)

Search and import free SVG assets from multiple repositories:

```
"Search for a rocket icon"
"Import a cat illustration"
"Add a user avatar icon"
```

**Supported Repositories:**
- **SVGRepo**: 500,000+ icons with various licenses
- **OpenClipart**: 150,000+ public domain clipart (CC0)
- **Iconify**: 200,000+ icons from multiple icon sets
- **Font Awesome**: 2,000+ free icons (CC BY 4.0)

**Tools:**
- `pinepaper_search_assets` - Search across all repositories
- `pinepaper_import_asset` - Import and place on canvas

### 📊 Performance Metrics (NEW in v1.3.0)

Built-in performance tracking helps AI assistants optimize workflows:

- Automatic timing for all tool operations
- Phase breakdown (validation, code generation, execution, screenshots)
- Export formats: summary, detailed JSON, CSV
- Self-optimization through `pinepaper_get_performance_metrics`

**Example workflow:**
```
1. Run your scene creation workflow
2. Call pinepaper_get_performance_metrics
3. Identify bottlenecks (e.g., individual creates vs batch)
4. Adjust approach and re-run
```

### 🐛 Enhanced Error Messages (NEW in v1.3.0)

Errors now include canvas context for easier debugging:

- Total item count and types
- Active relations
- Recent items created
- Canvas state at time of error

Makes troubleshooting much faster and more precise.

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
| `pinepaper_batch_create` | Create multiple items at once |
| `pinepaper_batch_modify` | Modify multiple items at once |
| `pinepaper_create_grid` | Create items in a grid layout |
| `pinepaper_create_glossy_sphere` | Create 3D glossy sphere effect |
| `pinepaper_create_diagonal_stripes` | Create diagonal stripe pattern |

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

### Asset Tools (NEW)
| Tool | Description |
|------|-------------|
| `pinepaper_search_assets` | Search for SVG assets across repositories |
| `pinepaper_import_asset` | Import asset from search results |

### Query Tools
| Tool | Description |
|------|-------------|
| `pinepaper_get_items` | Get canvas items |
| `pinepaper_get_relation_stats` | Relation statistics |
| `pinepaper_get_performance_metrics` | Get execution timing metrics |

### Diagram Tools (NEW in v1.4.3)
| Tool | Description |
|------|-------------|
| `pinepaper_create_diagram_shape` | Create flowchart/UML/network shapes with ports |
| `pinepaper_connect` | Connect items with smart connectors |
| `pinepaper_connect_ports` | Connect specific ports on items |
| `pinepaper_add_ports` | Add connection ports to items |
| `pinepaper_auto_layout` | Auto-arrange items using layout algorithms |
| `pinepaper_get_diagram_shapes` | List available diagram shapes |
| `pinepaper_update_connector` | Update connector style/label |
| `pinepaper_remove_connector` | Remove a connector |
| `pinepaper_diagram_mode` | Control diagram editing mode |

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

### Flowchart Diagram (NEW)

```
1. Create a terminal shape with label "Start"
2. Create a process shape with label "Get Input"
3. Create a decision shape with label "Valid?"
4. Create a terminal shape with label "End"
5. Connect Start → Get Input
6. Connect Get Input → Valid?
7. Connect Valid? → End (label: "Yes")
8. Connect Valid? → Get Input (label: "No", routing: curved)
9. Apply hierarchical auto-layout
```

### Network Diagram (NEW)

```
1. Create a cloud shape with label "Internet"
2. Create 3 server shapes with labels "Web", "API", "DB"
3. Connect Internet → Web (label: "HTTPS")
4. Connect Web → API (label: "REST")
5. Connect API → DB (label: "SQL")
6. Apply force-directed auto-layout
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 AI Client (Claude, etc.)                    │
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

### Test with MCP Client (Local)

1. Build the server:
   ```bash
   # Using npm
   npm run build

   # Using bun
   bun run build
   ```

2. Add to your MCP client config (example for Claude Desktop on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):
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

3. Restart your MCP client

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
# In MCP client config (example for Claude Desktop)
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"],
      "env": {
        "PINEPAPER_LOCALE": "ja"
      }
    }
  }
}
```

Or programmatically:

```typescript
import { setLocale, t } from '@pinepaper.studio/mcp-server';

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
| `PINEPAPER_METRICS_ENABLED` | Enable performance metrics tracking | `true` |
| `PINEPAPER_METRICS_RETENTION` | Max metrics to retain in memory | `1000` |
| `PINEPAPER_SCREENSHOT_MODE` | Screenshot mode (on_request/always/never) | `on_request` |

### Performance Metrics

PinePaper MCP Server includes built-in performance tracking to help AI assistants optimize workflows by identifying bottlenecks and choosing faster alternatives.

**Key Features:**
- ⚡ Automatic timing for all tool operations
- 📊 Phase breakdown (validation, code generation, browser execution, screenshots)
- 🎯 Real-time query via `pinepaper_get_performance_metrics` tool
- 📈 Export formats: summary, JSON, CSV
- 💾 In-memory storage (resets on restart)
- 🚀 Minimal overhead (~1ms per operation)

**Quick Example:**

```
AI: "Let me check if batch operations are faster"
→ pinepaper_get_performance_metrics(format: 'summary')

Result:
  - pinepaper_create_item: avg 145ms
  - pinepaper_batch_create (10 items): avg 298ms (~30ms per item)

AI: "I'll use batch_create for the next 20 items"
```

**Configuration:**

```bash
# Disable metrics if not needed
export PINEPAPER_METRICS_ENABLED=false

# Increase retention for long sessions
export PINEPAPER_METRICS_RETENTION=5000
```

**Learn More:** See [docs/PERFORMANCE_METRICS.md](docs/PERFORMANCE_METRICS.md) for complete documentation.

## Documentation

### Guides

- **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** - Decision trees, multi-step patterns, performance optimization, and troubleshooting
- **[Performance Metrics](docs/PERFORMANCE_METRICS.md)** - In-memory metrics system for AI self-optimization
- **[PinePaper Reference](https://pinepaper.studio/docs/)** - Complete PinePaper Studio API reference

### External Documentation

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
