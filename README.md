# PinePaper MCP Server

> Create animated graphics with AI using the Model Context Protocol

[![npm version](https://badge.fury.io/js/%40pinepaper.studio%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

PinePaper MCP Server enables AI assistants to create and animate graphics in [PinePaper Studio](https://pinepaper.studio) via the Model Context Protocol (MCP). Works with any AI that supports MCP tool calling (Claude, GPT, Gemini, local models, etc.).

The server exposes **114 tools** across drawing, animation, diagrams, maps, typography, physics, data visualization, and export. Using natural language, you can:

- Create text, shapes, geometry, and complex graphics
- Animate items with behavior-driven **relations** rather than keyframes
- Build long scenes as **event-driven chains** that stay scrub- and replay-stable
- Generate procedural backgrounds and parametric/equation-driven paths
- Author diagrams, maps, charts, and letter collages
- Export animated SVG, video frames, embeddable widgets, and LLM training data

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

## Toolkits & Token Budget

114 tools is a lot of context. The server ships a **toolkit** system that serves only the tools a given client needs, plus a **verbosity** system that controls how long each tool description is.

**Toolkit profiles** (`PINEPAPER_TOOLKIT`):

| Profile | Contents |
|---------|----------|
| `full` | Every tool, no filtering (default) |
| `agent` | Broad authoring surface, minus niche/low-level groups |
| `diagram` | Canvas + diagram + query/export |
| `map` | Canvas + map + query/export |
| `font` | Canvas + font + letter collage + export |
| `minimal` | Agent, browser, canvas, and guide only |

**Verbosity tiers** (`PINEPAPER_VERBOSITY`): `verbose`, `compact` (default), `minimal`.

**Client auto-detection.** When neither env var is set explicitly, the server picks a profile from the MCP `initialize` handshake:

| Client | Toolkit | Verbosity |
|--------|---------|-----------|
| `claude-ai` | `minimal` | `compact` |
| `claude-desktop` | `full` | `compact` |
| `claude-code` | `agent` | `compact` |
| `cursor` | `full` | `compact` |
| `windsurf` | `full` | `compact` |

Explicit env vars always win. You can also hand-pick tools with `PINEPAPER_TOOLS` (comma-separated names), or switch profiles at runtime with the `pinepaper_set_toolkit` tool. Start with `pinepaper_tool_guide` to have the server explain its own surface.

## Features

### 🤖 Agent Flow Mode (enforced by default)

- **Auto-Connection**: Browser connects automatically on first tool call (headless mode)
- **Auto-Session**: Agent sessions start automatically — just start creating
- **Batch Operations**: Execute multiple operations in one call (~10x faster)
- **Smart Exports**: Auto-detect optimal format for Instagram, TikTok, YouTube, etc.

```
"Create a red pulsing text that says HELLO"  # Browser auto-connects
"Create 5 items in batch, then export for TikTok"
"Analyze the scene and recommend export format"
```

**No manual setup required** — just start making tool calls.

### 🔄 Relations (Behavior-Driven Animation)

The **key feature** — describe HOW items should behave, and the engine solves the motion every frame. 39 relation types are available via `pinepaper_add_relation`. Relations are compositional: one item can carry several at once.

**Spatial & motion**

| Relation | Description |
|----------|-------------|
| `orbits` | Circular motion around a target |
| `follows` | Move toward target (with offset) |
| `attached_to` | Fixed offset from target |
| `maintains_distance` | Hold a set distance |
| `points_at` | Rotate to face target |
| `mirrors` | Mirror target's position |
| `parallax` | Depth-scaled movement |
| `bounds_to` | Stay within an area |
| `wave_through` | Wave propagation across items |
| `moves_along_path` | Travel along a path or equation |

**Structural layout**

Static composition expressed as edges instead of hardcoded coordinates. Placement is derived from the target's bounds and re-derived each frame, so moving or resizing the target brings the dependent along — and the layout stays editable as graph data.

| Relation | Description |
|----------|-------------|
| `on_top_of` | Source's bottom edge rests on the target's top edge — stacking (`gap`, `align`, `overhang`) |
| `below` | Mirror of `on_top_of` — source's top edge on the target's bottom edge |
| `beside` | Flank the target left or right (`side`, `gap`, `align`) |
| `inside` | Place within the target's bounds at a 9-way `anchor`, inset by `padding` |
| `centered_on` | Source center = target center + (`offsetX`, `offsetY`); concentric at zero |
| `aligned_with` | Match the target on one `axis` only, leaving the other free (`axis` is required) |

**Structure & construction**

| Relation | Description |
|----------|-------------|
| `is_midpoint_of` | Sit at the midpoint of two items |
| `lies_on_line` | Constrain onto a line |
| `is_centroid_of` | Sit at the centroid of a set |
| `is_circumcenter_of` | Sit at the circumcenter |
| `concentric_with` | Share a center |
| `circumscribes` | Enclose a target |
| `indicates` | Point out / annotate |
| `construction_reveal` | Staged geometric reveal |

**Animation & camera**

| Relation | Description |
|----------|-------------|
| `animates` | Drive a property over time |
| `grows_from` | Scale in from an origin |
| `staggered_with` | Offset timing across a set |
| `morphs_to` / `group_morphs_to` | Shape morphing |
| `camera_follows` / `camera_animates` | Camera behavior |

**Deterministic binding (Expression IR)**

| Relation | Description |
|----------|-------------|
| `driven_by` | Bind one property to another: `source.p = target.p * multiplier + offset`, optionally clamped. For `fillColor`/`strokeColor` the driven value interpolates `colorFrom`→`colorTo`, so a relation can drive color. |
| `time_expression` | Self-relation: drive a property by a math expression of `t` (scene time) and `v` (base value), e.g. `sin(t*2)*50 + v`. |

With `signal: true` these compile to a pure `f(t)` Expression IR, making them scrub-, loop-, and replay-stable. Expressions using `random()` or unknown symbols fall back to per-frame evaluation.

**Event-driven scene chains**

| Relation | Description |
|----------|-------------|
| `on_event_fire_after` | When source event fires, pulse the target event after a delay (chaining primitive) |
| `on_event_add_relation` | On fire, add a relation to an item — the scene evolves itself |
| `on_event_remove_relation` | On fire, tear a relation down |
| `on_event_set_color` | On fire, set fill/stroke color |
| `on_event_set_property` | On fire, set any item property |
| `on_event_set_visibility` | On fire, show/hide |

Create channels with `pinepaper_event` (`create` → `eventId`, `pulse` → fire it). Chain beats with `on_event_fire_after` on the `canvas` timeline to author a long scene as a graph of timed beats instead of a keyframe track.

**Extras**: relations can target the live pointer via the reserved `targetId` `'cursor'`, and any relation can carry `params.window = { start, end?, repeat? }` to gate when it is active (`repeat`: `once` | `loop` | `pingpong`).

### 🎨 Item Creation & Geometry

```
"Create a blue circle at position 200, 300 with radius 50"
"Create text saying 'Welcome' with font size 72"
"Draw the perpendicular bisector of AB"
```

Beyond basic shapes, `pinepaper_geometry` provides construction primitives, `pinepaper_group` handles group/ungroup/break-apart, and `pinepaper_arrange` controls z-order (bring forward/back/front/back).

### 🎬 Simple Animations

For quick looping effects: `pulse`, `rotate`, `bounce`, `fade`, `wobble`, `slide`, `typewriter`. For timed work use `pinepaper_keyframe_animate`; query the valid targets with `pinepaper_get_animatable_properties` and `pinepaper_get_available_easings`.

### 🖼️ Background Generators

31 procedural generators via `pinepaper_execute_generator` (list them with `pinepaper_list_generators`):

`drawBlobs`, `drawBokeh`, `drawCircuit`, `drawFluidFlow`, `drawFormulaArt`, `drawFunctionPlot`, `drawGeometricAbstract`, `drawGlobeWireframe`, `drawGradientMesh`, `drawGrid`, `drawHalftone`, `drawLowPoly`, `drawNoiseTexture`, `drawOrganicFlow`, `drawParametricCollection`, `drawParametricCurve`, `drawPattern`, `drawPeaks`, `drawRibbons`, `drawScatter`, `drawShaderArt`, `drawSimulation`, `drawSpectrumAnalyzer`, `drawStackedCircles`, `drawStackedWaves`, `drawSunburst`, `drawSunsetScene`, `drawTruchet`, `drawWaves`, `drawWindField`, `drawYeganehMountains`

### 📐 Diagram Tools

Create flowcharts, UML diagrams, network diagrams, and more:

```
"Create a flowchart for user login process"
"Make a UML class diagram for the User class"
"Design a network topology with 3 servers connected to a cloud"
```

- **Shape types** — Flowchart: process, decision, terminal, data, document, database, preparation · UML: uml-class, uml-usecase, uml-actor · Network: cloud, server · Basic: rectangle, circle, triangle, star
- **Connectors** — smart routing (orthogonal, direct, curved), arrow styles (classic, stealth, diamond, circle, none), animated bolt effect, labels
- **Auto-layout** — hierarchical, force-directed, tree, radial, grid
- **Mermaid** — import existing diagrams with `pinepaper_import_mermaid`

### 🗺️ Maps

Choropleths, region styling, and data-driven map animation via `pinepaper_map`, `pinepaper_map_regions`, `pinepaper_map_animation`, and `pinepaper_map_data`.

### 🔤 Typography

`pinepaper_font` covers font loading and text-to-path work; `pinepaper_create_letter_collage` and `pinepaper_animate_letter_collage` build and animate letterform collages.

### 🔍 Asset Search & Import

Search and import free SVG assets from multiple repositories:

- **SVGRepo**: 500,000+ icons with various licenses
- **OpenClipart**: 150,000+ public domain clipart (CC0)
- **Iconify**: 200,000+ icons from multiple icon sets
- **Font Awesome**: 2,000+ free icons (CC BY 4.0)

### 🖼️ Image Processing & Object Detection

Import images, then use `pinepaper_image_filter`, `pinepaper_lasso`, and `pinepaper_cutout_style` to process them. `pinepaper_detect_objects` runs object detection (with text queries) and can composite results as nodes; `pinepaper_extract_object` pulls a single object out.

### 🧠 Ontology & Validation

The server keeps a design graph of the canvas, so an AI can inspect and critique its own work: `pinepaper_get_canvas_ontology`, `pinepaper_query_ontology`, `pinepaper_analyze_design`, `pinepaper_validate_design`, `pinepaper_validate`, and `pinepaper_validate_scene`.

### 📊 Performance Metrics

Built-in performance tracking helps AI assistants optimize workflows:

- Automatic timing for all tool operations
- Phase breakdown (validation, code generation, execution, screenshots)
- Export formats: summary, detailed JSON, CSV
- Self-optimization through `pinepaper_get_performance_metrics`

### 📊 Training Data Export

Generate instruction/code pairs for LLM fine-tuning:

```json
{
  "instruction": "moon orbits earth at radius 100",
  "code": "app.addRelation('item_1', 'item_2', 'orbits', {radius: 100})"
}
```

## Tools Reference

All 114 tools, grouped by the tag used for toolkit filtering.

### Canvas (`canvas`)
| Tool | Description |
|------|-------------|
| `pinepaper_set_background_color` | Set background color |
| `pinepaper_set_canvas_size` | Set canvas dimensions |
| `pinepaper_get_canvas_size` | Read canvas dimensions |
| `pinepaper_clear_canvas` | Clear the canvas |
| `pinepaper_refresh_page` | Reload the studio page |
| `pinepaper_background` | Manage background layers |

### Item Creation (`core`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_item` | Create text, shapes, graphics |
| `pinepaper_modify_item` | Change item properties |
| `pinepaper_delete_item` | Remove an item |
| `pinepaper_create_grid` | Create items in a grid layout |
| `pinepaper_create_glossy_sphere` | Create 3D glossy sphere effect |
| `pinepaper_create_diagonal_stripes` | Create diagonal stripe pattern |
| `pinepaper_geometry` | Geometric construction primitives |
| `pinepaper_group` | Group / ungroup / break apart |
| `pinepaper_arrange` | Z-order: bring forward/back/front/back |

### Batch (`batch`)
| Tool | Description |
|------|-------------|
| `pinepaper_batch_create` | Create multiple items at once |
| `pinepaper_batch_modify` | Modify multiple items at once |

### Import (`import`)
| Tool | Description |
|------|-------------|
| `pinepaper_import_svg` | Import SVG markup |
| `pinepaper_import_image` | Import a raster image |
| `pinepaper_detect_objects` | Detect objects in an image (text queries, composite as nodes) |
| `pinepaper_extract_object` | Extract a detected object |

### Assets (`assets`)
| Tool | Description |
|------|-------------|
| `pinepaper_search_assets` | Search SVG assets across repositories |
| `pinepaper_import_asset` | Import asset from search results |

### Relations (`relations`)
| Tool | Description |
|------|-------------|
| `pinepaper_add_relation` | Create a behavioral relationship |
| `pinepaper_remove_relation` | Remove a relationship |
| `pinepaper_query_relations` | Find existing relations |
| `pinepaper_register_custom_relation` | Register a custom relation type |

### Animation (`animation`)
| Tool | Description |
|------|-------------|
| `pinepaper_animate` | Apply a simple loop animation |
| `pinepaper_keyframe_animate` | Timed keyframe animation |
| `pinepaper_play_timeline` | Control playback |
| `pinepaper_get_animatable_properties` | List animatable properties |
| `pinepaper_get_available_easings` | List easing functions |
| `pinepaper_construction_sequence` | Staged construction animation |

### Masks (`masks`)
| Tool | Description |
|------|-------------|
| `pinepaper_apply_animated_mask` | Apply an animated mask |
| `pinepaper_apply_custom_mask` | Apply a custom mask |
| `pinepaper_remove_mask` | Remove a mask |
| `pinepaper_get_mask_types` | List mask types |
| `pinepaper_get_mask_animations` | List mask animations |

### Camera (`camera`)
| Tool | Description |
|------|-------------|
| `pinepaper_camera` | Camera state control |
| `pinepaper_camera_animate` | Animate the camera |
| `pinepaper_camera_director` | Shot-level camera direction |

### Scene & Events (`scene`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_scene` | Create a scene |
| `pinepaper_manage_scenes` | Manage scenes |
| `pinepaper_scene_playback` | Scene playback control |
| `pinepaper_event` | Create / pulse event channels for scene chains |

### Generators, Effects & Filters
| Tool | Description |
|------|-------------|
| `pinepaper_execute_generator` | Run a background generator |
| `pinepaper_list_generators` | List available generators |
| `pinepaper_apply_effect` | Apply sparkle, blast, and other effects |
| `pinepaper_add_filter` | Add an image filter |

### Editing (`selection`, `transform`, `history`)
| Tool | Description |
|------|-------------|
| `pinepaper_selection` | Selection management |
| `pinepaper_transform` | Transform items |
| `pinepaper_history` | Undo / redo |

### Image Processing (`image_processing`)
| Tool | Description |
|------|-------------|
| `pinepaper_image_filter` | Apply image filters |
| `pinepaper_lasso` | Lasso selection on images |
| `pinepaper_cutout_style` | Cutout styling |

### Composition (`precomp`, `deform`, `sprite`, `interaction`)
| Tool | Description |
|------|-------------|
| `pinepaper_precomp` | Pre-composition management |
| `pinepaper_deform` | Deformation tools |
| `pinepaper_sprite_sheet` | Sprite sheet handling |
| `pinepaper_interaction` | Click, hover, and drag interactions |

### Data Visualization (`dataviz`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_chart` | Create a chart |
| `pinepaper_equation_path` | Function / parametric / Fourier equation paths |

### Diagram (`diagram`)
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
| `pinepaper_import_mermaid` | Import a Mermaid diagram |

### Map (`map`)
| Tool | Description |
|------|-------------|
| `pinepaper_map` | Create / configure a map |
| `pinepaper_map_regions` | Region styling and selection |
| `pinepaper_map_animation` | Animate a map |
| `pinepaper_map_data` | Bind data to a map |

### Typography (`font`, `letter_collage`)
| Tool | Description |
|------|-------------|
| `pinepaper_font` | Font loading and text-to-path |
| `pinepaper_create_letter_collage` | Create a letterform collage |
| `pinepaper_animate_letter_collage` | Animate a letterform collage |

### Simulation & Utilities (`magic`, `physics`, `measurement`, `template`)
| Tool | Description |
|------|-------------|
| `pinepaper_magic` | High-level "make it look good" helpers |
| `pinepaper_physics` | Physics simulation |
| `pinepaper_measurement` | Measurement and annotation |
| `pinepaper_apply_template` | Apply a scene template |

### Query (`query`)
| Tool | Description |
|------|-------------|
| `pinepaper_get_items` | Get canvas items |
| `pinepaper_get_relation_stats` | Relation statistics |
| `pinepaper_query` | General canvas query |

### Ontology (`ontology`)
| Tool | Description |
|------|-------------|
| `pinepaper_get_canvas_ontology` | Get the canvas design graph |
| `pinepaper_query_ontology` | Query the design graph |
| `pinepaper_analyze_design` | Analyze design quality |
| `pinepaper_validate_design` | Validate against design rules |
| `pinepaper_validate` | General validation |
| `pinepaper_validate_scene` | Validate scene integrity |

### Export (`export`)
| Tool | Description |
|------|-------------|
| `pinepaper_export_svg` | Export animated SVG |
| `pinepaper_export_scene` | Export the scene |
| `pinepaper_export_training_data` | Export LLM training pairs |
| `pinepaper_export_widget` | Export an embeddable widget |
| `pinepaper_export_widget_html` | Export widget HTML |
| `pinepaper_capture_frames` | Capture deterministic frames |

### Agent Flow (`agent`)
| Tool | Description |
|------|-------------|
| `pinepaper_agent_start_job` | Start a content creation job session |
| `pinepaper_agent_end_job` | End job with summary and recommendations |
| `pinepaper_agent_reset` | Quick canvas reset without page refresh |
| `pinepaper_agent_batch_execute` | Execute multiple operations in batch |
| `pinepaper_agent_export` | Smart export with platform auto-detection |
| `pinepaper_agent_analyze` | Analyze content for export recommendations |

### Browser (`browser`)
| Tool | Description |
|------|-------------|
| `pinepaper_browser_connect` | Connect to the studio |
| `pinepaper_browser_disconnect` | Disconnect |
| `pinepaper_browser_screenshot` | Take a screenshot |
| `pinepaper_browser_status` | Connection status |

### Guide & Diagnostics
| Tool | Description |
|------|-------------|
| `pinepaper_tool_guide` | Server-side guide to the tool surface |
| `pinepaper_set_toolkit` | Switch toolkit profile at runtime |
| `pinepaper_get_performance_metrics` | Get execution timing metrics |
| `pinepaper_diagnostic_report` | Diagnostic report |

### Escape Hatches (`custom_code`, `p5`, `register`)
| Tool | Description |
|------|-------------|
| `pinepaper_execute_custom_code` | Run custom code against the app |
| `pinepaper_p5_draw` | p5.js-style drawing |
| `pinepaper_register_item` | Register an externally created item |

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

### Event-Driven Scene Chain

```
1. Create events e0, e1, e2 (one per beat)
2. Chain them: on_event_fire_after e0 → e1 (delay 2000, timeline: canvas)
3. Chain: on_event_fire_after e1 → e2 (delay 2000, timeline: canvas)
4. Give beat 1 a reaction: on_event_add_relation e1 → planet (type: orbits)
5. Give beat 2 a reaction: on_event_set_color e2 → planet (color: #ff3300)
6. Pulse e0 to start — the whole chain is scrub- and replay-stable
```

### Flowchart Diagram

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

### Network Diagram

```
1. Create a cloud shape with label "Internet"
2. Create 3 server shapes with labels "Web", "API", "DB"
3. Connect Internet → Web (label: "HTTPS")
4. Connect Web → API (label: "REST")
5. Connect API → DB (label: "SQL")
6. Apply force-directed auto-layout
```

## Architecture

The server does not draw anything itself. It validates a tool call, generates JavaScript that calls PinePaper Studio's `app.*` API, and executes it in the browser — so the studio app stays the single source of truth for behavior.

```
┌─────────────────────────────────────────────────────────────┐
│                 AI Client (Claude, etc.)                    │
│                          │                                  │
│                    MCP Protocol                             │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  PinePaper MCP Server │                      │
│              │  ┌─────────────────┐  │                      │
│              │  │  Tool Handlers  │  │  validate + route    │
│              │  └────────┬────────┘  │                      │
│              │           │           │                      │
│              │  ┌────────▼────────┐  │                      │
│              │  │ Code Generator  │  │  emit app.* calls    │
│              │  └────────┬────────┘  │                      │
│              └───────────┼───────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   PinePaper Studio    │  execute in browser  │
│              │   (Browser/App)       │                      │
│              └───────────────────────┘                      │
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

Tests run on the Bun test runner.

```bash
bun test

# With coverage
bun test --coverage

# Typecheck
bun run typecheck
```

### Manifest Check

`manifest.json`'s `tools[]` must stay in sync with the served tool surface. This is enforced on publish (`prepublishOnly`), and you can run it directly:

```bash
bun run check:manifest   # verify
bun run fix:manifest     # rewrite manifest to match source
```

### Development Watch Mode

```bash
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

### Setting Language

Set the `PINEPAPER_LOCALE` environment variable:

```json
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

setLocale('fr');
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
| `PINEPAPER_STUDIO_URL` | PinePaper Studio URL to connect to (`/editor` is appended automatically) | `https://pinepaper.studio` |
| `PINEPAPER_HEADLESS` | Run the browser headless (set `false` to watch it work) | `true` |
| `PINEPAPER_EXECUTION_MODE` | `puppeteer` (execute in a real browser) or `code` (return generated code only) | `puppeteer` |
| `PINEPAPER_EXPORT_DIR` | Directory for exported files | `<tmpdir>/pinepaper-exports` |
| `PINEPAPER_LOCALE` | Language locale code | `en` |
| `PINEPAPER_TOOLKIT` | Toolkit profile (`full`/`agent`/`diagram`/`map`/`font`/`minimal`) | auto-detected |
| `PINEPAPER_TOOLS` | Explicit comma-separated tool allowlist | unset |
| `PINEPAPER_VERBOSITY` | Description verbosity (`verbose`/`compact`/`minimal`) | `compact` |
| `PINEPAPER_TOOL_VERBOSITY` | Deprecated alias for `PINEPAPER_VERBOSITY` | unset |
| `PINEPAPER_METRICS_ENABLED` | Enable performance metrics tracking | `true` |
| `PINEPAPER_METRICS_RETENTION` | Max metrics to retain in memory | `1000` |
| `PINEPAPER_SCREENSHOT_MODE` | Screenshot mode (`on_request`/`always`/`never`) | `on_request` |

### Performance Metrics

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

- **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** — Decision trees, multi-step patterns, performance optimization, and troubleshooting
- **[Performance Metrics](docs/PERFORMANCE_METRICS.md)** — In-memory metrics system for AI self-optimization
- **[Testing Guide](TESTING_GUIDE.md)** — Test layout and conventions
- **[PinePaper Reference](https://pinepaper.studio/api/)** — Complete PinePaper Studio API reference

### External Documentation

- [PinePaper API Docs](https://pinepaper.studio/api/)
- [MCP Tools Specification](https://pinepaper.studio/api/mcp/tools-spec)
- [MCP Server Installation](https://pinepaper.studio/api/mcp/installation)
- [User Guide](https://pinepaper.studio/guide/)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [PinePaper Studio](https://pinepaper.studio)
- [Documentation](https://pinepaper.studio/guide/)
- [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)
- [MCP Specification](https://modelcontextprotocol.io)

## Support

- 📧 Email: support@pinepaper.studio
- 🐛 Issues: [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)

---

Made with ❤️ by the PinePaper team
