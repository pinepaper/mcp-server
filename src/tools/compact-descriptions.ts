/**
 * Compact tool descriptions for reduced context usage.
 *
 * Activated via PINEPAPER_VERBOSITY=compact env var.
 * Each description says ONLY what the tool does in 1-2 sentences.
 * Workflow instructions belong in pinepaper_tool_guide, not here.
 *
 * Vocabulary enumerations are derived from the ontology + Zod schemas so the
 * lists below never drift from what the server actually validates.
 */

import { ItemTypeSchema, RelationTypeSchema, GeneratorNameSchema, AgentExportFormatSchema, AgentBatchOperationTypeSchema, SceneAnimationSchema } from '../types/schemas.js';
import { DIAGRAM_SHAPE_MAP } from '../ontology/vocabulary.js';
import { COMPOSABLE_STYLE_COUNT } from '../design/design-systems.js';

const ITEM_TYPES = ItemTypeSchema.options.join(', ');
const RELATION_TYPES = RelationTypeSchema.options.join(', ');
const DIAGRAM_SHAPES = Object.keys(DIAGRAM_SHAPE_MAP).join(', ');
const GENERATORS = GeneratorNameSchema.options.join(', ');

export const COMPACT_DESCRIPTIONS: Record<string, string> = {

  // -------------------------------------------------------------------------
  // Minimal toolkit tools
  // -------------------------------------------------------------------------
  pinepaper_set_background_color: `Set the canvas background color. Pass a hex color string (e.g. "#0f172a").`,

  pinepaper_set_canvas_size: `Set canvas dimensions: width+height, or a studio preset key alone — instagram-post (1080x1080), instagram-story / tiktok (1080x1920), youtube-thumbnail (1280x720), full-hd-1080p (1920x1080), twitter-post (1200x675). Platform names (instagram, youtube) are not preset keys; an unknown key is refused with the list.`,

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

  pinepaper_tool_guide: `Get detailed docs for any tool or category. Call with no args for the full workflow guide.`,

  pinepaper_set_toolkit: `Switch available tools. Toolkits: agent, diagram, map, font, full, minimal. Verbosity: verbose, compact, minimal.`,

  // -------------------------------------------------------------------------
  // batch_execute
  // -------------------------------------------------------------------------
  pinepaper_agent_batch_execute: `Execute multiple operations in a single call — canvas setup, items, animations, effects, playback. Call ONCE per pipeline — calling twice doubles all items.

OPERATION TYPES (${AgentBatchOperationTypeSchema.options.length}): ${AgentBatchOperationTypeSchema.options.join(', ')}. create takes position {x, y} or [x, y].

VARIABLE REFERENCES: "$0", "$1" etc. reference items by creation order within the batch.`,

  // -------------------------------------------------------------------------
  // create_item
  // -------------------------------------------------------------------------
  pinepaper_create_item: `Create a text, shape, or graphic on the canvas. Returns an itemId for later reference.

ITEM TYPES: ${ITEM_TYPES}.
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

Item types: ${ITEM_TYPES}.
Relations: ${RELATION_TYPES}.
Animations: ${SceneAnimationSchema.shape.type.options.join(', ')}.`,

  // -------------------------------------------------------------------------
  // execute_generator
  // -------------------------------------------------------------------------
  pinepaper_execute_generator: `Run a procedural background generator (sunburst, bokeh, gradient mesh, PineMath plots, etc.).

GENERATORS (${GeneratorNameSchema.options.length}): ${GENERATORS}.`,

  // -------------------------------------------------------------------------
  // get_performance_metrics
  // -------------------------------------------------------------------------
  pinepaper_get_performance_metrics: `Get execution timing and performance data. Formats: summary, detailed, csv.`,

  // -------------------------------------------------------------------------
  // add_relation
  // -------------------------------------------------------------------------
  pinepaper_add_relation: `Add a behavior relation between two items (orbits, follows, attached_to, etc.). Relations are compositional — an item can have multiple.

RELATION TYPES: ${RELATION_TYPES}. A name registered with pinepaper_register_custom_relation this session is accepted too.`,

  // -------------------------------------------------------------------------
  // create_diagram_shape
  // -------------------------------------------------------------------------
  pinepaper_create_diagram_shape: `Create a diagram shape (process, decision, terminal, etc.) for flowcharts and UML.

SHAPE TYPES: ${DIAGRAM_SHAPES}.`,

  // -------------------------------------------------------------------------
  // search_assets
  // -------------------------------------------------------------------------
  pinepaper_search_assets: `Search for free SVG icons and illustrations from open repositories (Iconify, Font Awesome). The result's sources says how each repository answered (ok | timeout | error); one that is down does not hold up the others, and a search that names one repository fails if it is down.`,

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  pinepaper_connect: `Draw a connector/arrow between two diagram shapes. Routing: orthogonal, direct, curved. Supports labels and animated bolt effect. Use the connectorId the result returns (a requested id may not be honoured). Style: lineColor, lineWidth, lineStyle (strokeColor / strokeWidth accepted).`,

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
  pinepaper_agent_export: `Export video, stills, animation, ads, captions or audio. Formats: ${AgentExportFormatSchema.options.join(', ')}. Quality: draft, standard, high — compression, and a default frame rate (15/30/60) that fps overrides. Video size control is scale 0.1-1, not a bitrate; scale 0.5 + quality draft is the fast preview. Framing: canvas (default) or camera (camera_animates viewport — video formats only).`,

  // -------------------------------------------------------------------------
  // design_system
  // -------------------------------------------------------------------------
  pinepaper_design_system: `Licensed design systems (Material 3, Carbon, Polaris, Fluent 2, USWDS, GOV.UK…) as W3C DTCG tokens, plus ${COMPOSABLE_STYLE_COUNT} aesthetic styles that compose a scene. list_systems | get_system | list_easings (named curves with licence + authored provenance) | list_motion (the curves plus the duration scale) | list_styles | compose (draw:false returns the scene as data; compose sets the canvas to the size it laid out for, and says so).`,

  // -------------------------------------------------------------------------
  // stick / story
  // -------------------------------------------------------------------------
  pinepaper_stick: `The vendored stick-figure kit. figure: pose, walk, travel, prop, garment, hair, expressions over time. set: kind room (floor + wall) | tabletop (object, surfaceY) | chair (facing) | table | counter | door | shelf (items) | window. Distinct from pinepaper_character, which places a figure from the design graph by concept.`,
  pinepaper_story: `Prose becomes a scene. distill (beats only, draws nothing), from_text (distill + assemble), apply_spec, plan_book.`,

  // -------------------------------------------------------------------------
  // interchange
  // -------------------------------------------------------------------------
  pinepaper_interchange: `Interchange formats the platform exporter does not cover: export_lottie, export_dotlottie, import_lottie, export_glb (needs perspective objects), export_bvh (needs a rig, skeletonId), export_png_sequence (pass duration and fps). Exports are written to a FILE; the result gives filePath. import_lottie takes the Lottie JSON itself (object or string), not a URL or path, and returns itemId.`,

  // -------------------------------------------------------------------------
  // sound
  // -------------------------------------------------------------------------
  pinepaper_sound: `Synthesis. Catalogues: list_instruments|list_percussion|list_sfx. Play: play_tone|play_chord|play_percussion|play_sfx|play_spec|play_from_text. Read: chord_frequencies|from_text|timbre_from_path. Canvas: create draws a sound AS an editable waveform path; sequence {cues: [{t, spec | preset + note}]} places a whole bed in one call; set_placement {itemId, placement: {startTime, duration}}; remove {itemId}; stop_all. timbre_from_path reads any drawn path back as harmonic content. Define: define_instrument {name, partials} | define_percussion / define_sfx {name, partials or noise}. render_soundtrack writes every placed sound to a WAV file. play_tone takes note ('A4'), not hz; a play with no voice fails.`,

  // -------------------------------------------------------------------------
  // motion
  // -------------------------------------------------------------------------
  pinepaper_motion: `The generators' motion engine for any group. list → the engine's catalogue. apply → a GROUP motion (driftX, driftY, swayX, swayY, rotate, pulse, wave, bounce) moves the target as one; a FIELD motion (ripple, breathe, undulate) sweeps a crest through its children from an origin, with a waveform.`,

  // -------------------------------------------------------------------------
  // path
  // -------------------------------------------------------------------------
  pinepaper_path: `Destructive path ops: boolean (unite|subtract|intersect|exclude|divide — CONSUMES its operands), simplify, outline_stroke (a stroked line becomes a filled shape), toggle_closed, pattern (concentric|radial|grid|extrude), get_geometry, set_locked, unlock_all. Results name the item as itemId.`,

};
