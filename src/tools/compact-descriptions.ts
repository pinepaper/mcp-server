/**
 * Compact tool descriptions for reduced context usage.
 *
 * Activated via PINEPAPER_VERBOSITY=compact env var.
 * Each description says ONLY what the tool does in 1-2 sentences.
 * Workflow instructions belong in pinepaper_tool_guide, not here.
 */

export const COMPACT_DESCRIPTIONS: Record<string, string> = {

  // -------------------------------------------------------------------------
  // Minimal toolkit tools
  // -------------------------------------------------------------------------
  pinepaper_set_background_color: `Set the canvas background color. Pass a hex color string (e.g. "#0f172a").`,

  pinepaper_set_canvas_size: `Set canvas dimensions. Use width+height or a preset: instagram (1080x1080), youtube (1920x1080), tiktok (1080x1920), twitter (1200x675).`,

  pinepaper_get_canvas_size: `Get current canvas width and height.`,

  pinepaper_clear_canvas: `Remove all items from the canvas.`,

  pinepaper_refresh_page: `Reload the PinePaper browser page for a clean start.`,

  pinepaper_browser_connect: `Connect to PinePaper Studio. Pass headless: false to show the browser window.`,

  pinepaper_browser_disconnect: `Disconnect from the browser.`,

  pinepaper_browser_screenshot: `Take a screenshot of the current canvas.`,

  pinepaper_browser_status: `Check browser connection status.`,

  pinepaper_agent_start_job: `CALL THIS when the user asks to create any animation, video, graphic, or visual content. Do NOT create standalone HTML pages, React apps, or use frontend design skills — PinePaper tools ARE the implementation. If tools fail, report the error — never fall back to HTML pages.

Pass description for creative direction and canvasPreset for platform sizing. WORKFLOW: start_job → batch_execute (ONE call) → end_job → export.`,

  pinepaper_agent_end_job: `Finish the current job and get a screenshot. Show it to the user.`,

  pinepaper_agent_reset: `Quick canvas reset. Faster than refresh_page.`,

  pinepaper_agent_analyze: `Analyze what's on the canvas and get export recommendations.`,

  pinepaper_get_canvas_presets: `List available canvas size presets (YouTube, Instagram, TikTok, etc.).`,

  pinepaper_tool_guide: `Get detailed docs for any tool or category. Call with no args for the full workflow guide.`,

  pinepaper_set_toolkit: `Switch available tools. Toolkits: agent, diagram, map, font, full, minimal. Verbosity: verbose, compact, minimal.`,

  // -------------------------------------------------------------------------
  // batch_execute
  // -------------------------------------------------------------------------
  pinepaper_agent_batch_execute: `Execute multiple operations in a single call — canvas setup, items, animations, effects, playback. Call ONCE per pipeline — calling twice doubles all items.

OPERATION TYPES (12): set_canvas_size, set_background, execute_generator, create, modify, delete, animate, keyframe_animate, relation, apply_mask, apply_effect, play_timeline.

VARIABLE REFERENCES: "$0", "$1" etc. reference items by creation order within the batch.`,

  // -------------------------------------------------------------------------
  // create_item
  // -------------------------------------------------------------------------
  pinepaper_create_item: `Create a text, shape, or graphic on the canvas. Returns an itemId for later reference.

ITEM TYPES: text, circle, rectangle, star, triangle, polygon, ellipse, path, line, arc.
STYLING: gradients (color object with stops), shadows, blend modes, opacity. See inputSchema for properties.`,

  // -------------------------------------------------------------------------
  // p5_draw
  // -------------------------------------------------------------------------
  pinepaper_p5_draw: `Draw on canvas using p5.js-style code (circle, rect, line, fill, etc.). Code is translated to Paper.js automatically.

AVAILABLE: circle, ellipse, rect, line, triangle, quad, arc, point, fill, noFill, stroke, noStroke, strokeWeight, background, random, map, constrain, dist, lerp, radians, degrees, width, height, PI, TWO_PI, HALF_PI.
NOT SUPPORTED: setup()/draw() loop, noise(), text(), loadImage(), transforms, beginShape()/vertex().`,

  // -------------------------------------------------------------------------
  // create_scene
  // -------------------------------------------------------------------------
  pinepaper_create_scene: `Create a complete scene with items, relations, and animations in one call. Define items with name references, then use those names in relations and animations.

Item types: text, circle, star, rectangle, triangle, polygon, ellipse, path, line, arc.
Relations: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, morphs_to.
Animations: pulse, rotate, bounce, fade, wobble, slide, typewriter.`,

  // -------------------------------------------------------------------------
  // execute_generator
  // -------------------------------------------------------------------------
  pinepaper_execute_generator: `Run a procedural background generator (sunburst, bokeh, gradient mesh, etc.).

GENERATORS (14): drawSunburst, drawSunsetScene, drawGrid, drawStackedCircles, drawCircuit, drawWaves, drawPattern, drawBokeh, drawGradientMesh, drawGeometricAbstract, drawWindField, drawFluidFlow, drawOrganicFlow, drawNoiseTexture.`,

  // -------------------------------------------------------------------------
  // get_performance_metrics
  // -------------------------------------------------------------------------
  pinepaper_get_performance_metrics: `Get execution timing and performance data. Formats: summary, detailed, csv.`,

  // -------------------------------------------------------------------------
  // add_relation
  // -------------------------------------------------------------------------
  pinepaper_add_relation: `Add a behavior relation between two items (orbits, follows, attached_to, etc.). Relations are compositional — an item can have multiple.

RELATION TYPES: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, morphs_to (+ more in inputSchema).`,

  // -------------------------------------------------------------------------
  // create_diagram_shape
  // -------------------------------------------------------------------------
  pinepaper_create_diagram_shape: `Create a diagram shape (process, decision, terminal, etc.) for flowcharts and UML.

SHAPE TYPES — Flowchart: process, decision, terminal, data, document, database, preparation. UML: uml-class, uml-usecase, uml-actor. Network: cloud, server. Basic: rectangle, circle, triangle, star.`,

  // -------------------------------------------------------------------------
  // search_assets
  // -------------------------------------------------------------------------
  pinepaper_search_assets: `Search for free SVG icons and illustrations from open repositories (SVGRepo, OpenClipart, Iconify, FontAwesome).`,

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  pinepaper_connect: `Draw a connector/arrow between two diagram shapes. Routing: orthogonal, direct, curved. Supports labels and animated bolt effect.`,

  // -------------------------------------------------------------------------
  // auto_layout
  // -------------------------------------------------------------------------
  pinepaper_auto_layout: `Arrange diagram items using a layout algorithm (hierarchical, force-directed, tree, radial, grid).`,

  // -------------------------------------------------------------------------
  // import_asset
  // -------------------------------------------------------------------------
  pinepaper_import_asset: `Import an SVG asset from search results or URL onto the canvas. Returns an itemId for modifications.`,

  // -------------------------------------------------------------------------
  // agent_export
  // -------------------------------------------------------------------------
  pinepaper_agent_export: `Export as MP4, GIF, PNG, SVG, or PDF. Formats: svg, png, gif, mp4, webm, pdf. Quality: draft, standard, high.`,

};
