/**
 * Compact tool descriptions for reduced context usage.
 *
 * Activated via PINEPAPER_VERBOSITY=compact env var.
 * Cuts ~58% from the 13 largest tool descriptions while preserving
 * USE WHEN guidance, critical warnings, and resource doc references.
 */

export const COMPACT_DESCRIPTIONS: Record<string, string> = {

  // -------------------------------------------------------------------------
  // Minimal toolkit tools — outcome-focused descriptions
  // -------------------------------------------------------------------------
  pinepaper_set_background_color: `Set the canvas background color. Pass a hex color string (e.g. "#0f172a").`,

  pinepaper_set_canvas_size: `Set canvas dimensions. Use width+height or a preset: instagram (1080x1080), youtube (1920x1080), tiktok (1080x1920), twitter (1200x675). Call BEFORE creating items.`,

  pinepaper_get_canvas_size: `Get current canvas width and height.`,

  pinepaper_clear_canvas: `Remove all items from the canvas.`,

  pinepaper_refresh_page: `Reload the PinePaper browser page for a clean start.`,

  pinepaper_browser_connect: `Connect to PinePaper Studio. Usually NOT needed — auto-connects on first tool call.`,

  pinepaper_browser_disconnect: `Disconnect from the browser.`,

  pinepaper_browser_screenshot: `Take a screenshot of the current canvas to show the user.`,

  pinepaper_browser_status: `Check browser connection status.`,

  pinepaper_agent_start_job: `Begin creating an animation or graphic. Call this FIRST, then use batch_execute to build the scene, then end_job to finish.

Pass the user's request as "description" for creative direction tips. Use canvasPreset for platform sizing (instagram, youtube, tiktok, twitter).

WORKFLOW: start_job → batch_execute (ONE call with ALL operations) → end_job → show screenshot → export if requested.`,

  pinepaper_agent_end_job: `Finish the current animation job. Returns a screenshot — SHOW it to the user and ask if the design looks good.`,

  pinepaper_agent_reset: `Quick canvas reset. Faster than refresh_page.`,

  pinepaper_agent_analyze: `Analyze what's on the canvas and get export recommendations.`,

  pinepaper_get_canvas_presets: `List available canvas size presets (YouTube, Instagram, TikTok, etc.).`,

  pinepaper_tool_guide: `Get detailed docs for any tool or category. Call with no args for the full workflow guide. Call with tool name for that tool's full description.`,

  pinepaper_set_toolkit: `Switch available tools at runtime. Use when the user needs tools not currently visible.

Toolkits: agent (animations/graphics), diagram (flowcharts/UML), map (geographic maps), font (font creation), full (all 120+ tools), minimal (core only).
Verbosity: verbose (full docs), compact (shorter), minimal (1-line summaries).

Example: User asks for a map → call set_toolkit({toolkit: "map"}).`,

  // -------------------------------------------------------------------------
  // batch_execute — 4382 → ~1200 chars
  // -------------------------------------------------------------------------
  pinepaper_agent_batch_execute: `Create animated scenes in a single call — canvas setup, backgrounds, text, shapes, animations, masks, effects, and playback. This is how you build animations on PinePaper.

NOTE: For diagrams (flowcharts, UML), use pinepaper_create_diagram_shape + pinepaper_connect instead.

⚠️ EVERY operation executes LIVE on the canvas. Calling this twice DOUBLES all items. Call ONCE per pipeline.

WORKFLOW: pinepaper_agent_start_job → pinepaper_agent_batch_execute → pinepaper_agent_end_job

PATTERN — Always follow this order:
  1. set_canvas_size / set_background / execute_generator (canvas setup)
  2. create (items — text, shapes, etc.)
  3. animate or keyframe_animate for EACH created item ("$0", "$1", ...) — REQUIRED for animated content
  4. relation / apply_mask / apply_effect (optional enhancements)
  5. play_timeline (REQUIRED — starts playback, without this nothing moves)

OPERATION TYPES (12): set_canvas_size, set_background, execute_generator, create, modify, delete, animate, keyframe_animate, relation, apply_mask, apply_effect, play_timeline.

VARIABLE REFERENCES: "$0", "$1" etc. reference items by creation order within the batch.

⚠️ SIZING: All positions/sizes MUST fit within the canvas. start_job returns canvasSize — keep items within 5%-95% of canvas width/height. Max canvas: 4096x4096.

See inputSchema for per-operation params and enum values. See pinepaper://docs/getting-started for full workflow.`,

  // -------------------------------------------------------------------------
  // create_item — 4287 → ~1500 chars
  // -------------------------------------------------------------------------
  pinepaper_create_item: `Create an item on the PinePaper canvas. Returns an itemId (e.g., "item_1") that you MUST save to reference this item later.

USE WHEN: Adding text, shapes, or graphics to the canvas.

IMPORTANT:
- Save the returned itemId for later use with relations, modify, delete, etc.
- If there's a welcome template on the canvas, use pinepaper_clear_canvas first.
- Position defaults to canvas center (400, 300). Use position: {x, y} to place elsewhere.
- DO NOT take screenshots after every create. Trust the API response — take ONE screenshot at the end.

⚠️ COMPLEX CHARACTERS (witch, cat face, person): Use pinepaper_import_svg or compose from simple shapes. Do NOT attempt pixel-level path drawing.

ITEM TYPES: text, circle, rectangle, star, triangle, polygon, ellipse, path, line, arc.

PATH FOR CUSTOM SHAPES: Use itemType "path" with segments ([[x,y]...]) or pathData (SVG string).

STYLING: All shapes support gradients (color object with stops), shadows (shadowColor, shadowBlur, shadowOffset), blend modes, and opacity. See inputSchema for full properties per type.

EXAMPLE: {itemType: "text", properties: {content: "HELLO", color: "#ef4444", fontSize: 48}}

After creating items, use pinepaper_add_relation to animate them.`,

  // -------------------------------------------------------------------------
  // p5_draw — 3394 → ~1200 chars
  // -------------------------------------------------------------------------
  pinepaper_p5_draw: `Execute p5.js-style drawing code on the PinePaper canvas. Code is translated to Paper.js automatically. This is a SUBSET of p5.js for static drawings.

AVAILABLE: circle, ellipse, rect, line, triangle, quad, arc, point, fill, noFill, stroke, noStroke, strokeWeight, background, random, map, constrain, dist, lerp, radians, degrees, rectMode, ellipseMode, width, height, PI, TWO_PI, HALF_PI.

NOT SUPPORTED (use native PinePaper tools instead):
- setup()/draw() loop → pinepaper_animate / pinepaper_add_relation
- noise(), text(), loadImage(), push()/pop()/translate()/rotate()/scale(), beginShape()/vertex()/endShape()

Code runs directly — NO setup() or draw() wrapper. Items are auto-registered, selectable, animatable, and exportable.

EXAMPLE:
background(30);
noStroke();
for (let i = 0; i < 20; i++) {
  fill(random(255), random(255), random(255));
  circle(random(width), random(height), random(20, 80));
}`,

  // -------------------------------------------------------------------------
  // create_scene — 2754 → ~1500 chars
  // -------------------------------------------------------------------------
  pinepaper_create_scene: `Create a complete scene with multiple items, relations, and animations in a single operation. The MOST EFFICIENT way to create complex animated scenes.

USE WHEN: Creating multi-item animated scenes (solar systems, bouncing balls, etc.) where performance matters. Reduces 4+ tool calls to 1.

HOW IT WORKS:
1. Define items with "name" references (e.g., "sun", "earth", "moon")
2. Define relations using those names (e.g., source: "earth", target: "sun")
3. Define animations using names (e.g., target: "sun", type: "pulse")
4. Server creates all items, then establishes relations and animations

EXAMPLE — Solar System:
{backgroundColor: "#0a0a0a", items: [
  {name: "sun", itemType: "circle", position: {x: 400, y: 300}, properties: {radius: 50, color: "#fbbf24"}},
  {name: "earth", itemType: "circle", position: {x: 550, y: 300}, properties: {radius: 20, color: "#3b82f6"}}
], relations: [
  {source: "earth", target: "sun", type: "orbits", params: {radius: 150, speed: 0.5}}
], animations: [
  {target: "sun", type: "pulse", speed: 0.3}
]}

Item types: text, circle, star, rectangle, triangle, polygon, ellipse, path, line, arc.
Relations: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, morphs_to, + more (see inputSchema).
Animations: pulse, rotate, bounce, fade, wobble, slide, typewriter.`,

  // -------------------------------------------------------------------------
  // execute_generator — 2202 → ~900 chars
  // -------------------------------------------------------------------------
  pinepaper_execute_generator: `Execute a background generator to create procedural patterns.

USE WHEN: Creating dynamic procedural backgrounds — sunbursts, bokeh, gradients, waves, noise textures, etc.

GENERATORS (14):
Classic: drawSunburst, drawSunsetScene, drawGrid, drawStackedCircles, drawCircuit, drawWaves, drawPattern
Effects: drawBokeh
Organic: drawGradientMesh, drawFluidFlow, drawOrganicFlow
Geometric: drawGeometricAbstract
Particles: drawWindField
Textures: drawNoiseTexture

Each generator accepts generatorParams — see pinepaper://docs/generators for full parameter docs per generator, or use inputSchema for the param schema.`,

  // -------------------------------------------------------------------------
  // get_performance_metrics — 2176 → ~1000 chars
  // -------------------------------------------------------------------------
  pinepaper_get_performance_metrics: `[Utility] Get execution performance metrics to identify bottlenecks and optimize workflows.

USE WHEN: Analyzing tool performance, debugging slow operations, optimizing workflows.

RETURNS: Per-tool timing breakdown (validation, code gen, execution, screenshot), aggregate statistics (avg, p50, p95, p99), success rates, error counts.

FORMAT OPTIONS: 'summary' (human-readable, slowest first), 'detailed' (full JSON), 'csv' (spreadsheet export).

FILTER OPTIONS: toolName, phase, since (Unix timestamp), limit.

EXAMPLES:
- Summary of all: {}
- Last 50 create_item ops: {toolName: 'pinepaper_create_item', limit: 50}
- Export CSV: {format: 'csv'}`,

  // -------------------------------------------------------------------------
  // add_relation — 2025 → ~1200 chars
  // -------------------------------------------------------------------------
  pinepaper_add_relation: `Create a behavior relationship between two items. Relations are the PRIMARY way to add animation in PinePaper — they describe HOW items behave relative to each other.

USE WHEN:
- "moon orbits earth" → orbits
- "label follows player" → follows
- "hat attached to character" → attached_to
- "arrow points at target" → points_at
- "reflection mirrors original" → mirrors
- "background parallax" → parallax

RELATION TYPES: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, morphs_to (+ more in inputSchema, each with specific params).

COMPATIBILITY: Position-based relations (orbits, follows, attached_to, etc.) work with ALL item types including imported SVGs/images. morphs_to has type-specific behavior.

Relations are COMPOSITIONAL — an item can have multiple relations that work together.`,

  // -------------------------------------------------------------------------
  // create_diagram_shape — 1974 → ~1000 chars
  // -------------------------------------------------------------------------
  pinepaper_create_diagram_shape: `Create a diagram shape for flowcharts, UML, network diagrams, and technical drawings.

USE WHEN: Creating flowcharts, process diagrams, UML diagrams, network topologies, org charts, or decision trees.

SHAPE TYPES:
Flowchart: process, decision, terminal, data, document, database, preparation
UML: uml-class, uml-usecase, uml-actor
Network: cloud, server
Basic: rectangle, circle, triangle, star

All shapes have connection ports, support labels, and can be connected via pinepaper_connect.

EXAMPLE: {shapeType: "terminal", label: "Start", position: {x: 400, y: 100}}

WORKFLOW: Create shapes → pinepaper_connect to draw connectors → pinepaper_auto_layout to arrange. See pinepaper://docs/diagrams for detailed guide.`,

  // -------------------------------------------------------------------------
  // search_assets — 1939 → ~1000 chars
  // -------------------------------------------------------------------------
  pinepaper_search_assets: `Search for free SVG assets from open repositories (SVGRepo, OpenClipart, Iconify, FontAwesome).

USE WHEN: Need icons, illustrations, clipart, or graphics too complex to draw with paths.

WORKFLOW:
1. Search: pinepaper_search_assets(query: "rocket")
2. Review results (assetIds, previews, licenses)
3. Import: pinepaper_import_asset(assetId: "svgrepo_rocket_12345")

IMPORTANT: Always check license field. CC-BY requires attribution (tracked automatically). CC0 has no restrictions.

Set includeSvgContent: true to fetch SVG markup inline (slower, use lower limit). Search queries work best with simple, specific terms.

EXAMPLE: {query: "rocket", limit: 5}`,

  // -------------------------------------------------------------------------
  // connect — 1863 → ~1000 chars
  // -------------------------------------------------------------------------
  pinepaper_connect: `Connect two items with a smart connector — the primary way to draw lines/arrows between diagram shapes.

USE WHEN: Drawing arrows between flowchart steps, UML associations, network connections, or any diagram needing lines/arrows.

FEATURES: Auto port selection, smart routing, animated bolt effect, labels.

ROUTING: orthogonal (right-angle, default), direct (straight), curved (bezier).
ARROW STYLES: classic, stealth, sharp, open, diamond, circle, none — see inputSchema for head/tail options.
LINE STYLES: solid, dashed, dotted.

Enable boltEnabled: true for animated data flow particles.

EXAMPLES:
- Simple arrow: {sourceItemId: "shape_1", targetItemId: "shape_2"}
- Labeled: {sourceItemId: "a", targetItemId: "b", label: "1..*"}
- Dashed: {sourceItemId: "a", targetItemId: "b", lineStyle: "dashed", headStyle: "open"}`,

  // -------------------------------------------------------------------------
  // auto_layout — 1853 → ~1000 chars
  // -------------------------------------------------------------------------
  pinepaper_auto_layout: `Automatically arrange diagram items using a layout algorithm for cleaner, more readable diagrams.

USE WHEN: Items are messy/overlapping, need professional layout, or creating hierarchical structures.

LAYOUT TYPES:
- hierarchical: Flowcharts, org charts, dependency graphs (direction: TB/BT/LR/RL)
- force-directed: Network diagrams, relationship graphs (physics simulation)
- tree: Hierarchies, file systems (optimized tree structure)
- radial: Mind maps, hub-and-spoke (concentric circles)
- grid: Equal-importance items, component libraries (rows/columns)

Set animate: false for instant repositioning. Pass itemIds to layout only specific items.

EXAMPLES:
- Flowchart: {layoutType: "hierarchical", options: {direction: "TB", levelSpacing: 100}}
- Network: {layoutType: "force-directed", options: {iterations: 200}}
- Grid: {layoutType: "grid", options: {columns: 4}}`,

  // -------------------------------------------------------------------------
  // import_asset — 1714 → ~800 chars
  // -------------------------------------------------------------------------
  pinepaper_import_asset: `Import an SVG asset from search results or direct URL onto the canvas.

USE WHEN: After searching with pinepaper_search_assets, or importing from a direct SVG URL.

WORKFLOW: Search → Choose (check license) → Import → Modify/Animate as needed.

PARAMS: assetId (from search) OR url (direct SVG URL), position, scale, color (override for monochrome icons).

License metadata is tracked automatically. CC-BY attribution is added to canvas metadata. Downloaded SVGs are cached in memory for the session.

EXAMPLE: {assetId: "svgrepo_rocket_001", position: {x: 400, y: 300}, scale: 2.0}

RETURNS: itemId (for further modifications), metadata (including license).`,

  // -------------------------------------------------------------------------
  // agent_export — 1615 → ~900 chars
  // -------------------------------------------------------------------------
  pinepaper_agent_export: `Export your animation as MP4 video, GIF, PNG, SVG, or PDF. When user asks for "video" or "export", default to MP4.

PLATFORMS & FORMATS:
| Platform         | Size       | Static | Animated |
|------------------|------------|--------|----------|
| instagram        | 1080x1080  | PNG    | MP4      |
| tiktok           | 1080x1920  | PNG    | MP4      |
| youtube          | 1920x1080  | PNG    | MP4      |
| twitter          | 1200x675   | PNG    | GIF      |
| web              | flexible   | SVG    | SVG      |

DEFAULT: When user asks for "video" or "export", use format: "mp4". Only use svg/gif if user specifically requests them.
Formats: svg, png, gif, mp4, webm, pdf. Quality: draft, standard, high.
⚠️ If export fails, do NOT retry with different formats — report the error to the user.`,

};
