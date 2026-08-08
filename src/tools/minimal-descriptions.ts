/**
 * Minimal tool descriptions for maximum context savings.
 *
 * Activated via PINEPAPER_VERBOSITY=minimal env var.
 * Each tool gets a single-line summary (~40-100 chars).
 * Full descriptions available on-demand via pinepaper_tool_guide.
 *
 * Vocabulary enumerations (item/relation/shape/generator types) are derived
 * from the ontology + Zod schemas at module load, so the descriptions here
 * stay in sync with what the server actually validates.
 */

import { ItemTypeSchema, RelationTypeSchema } from '../types/schemas.js';
import { DIAGRAM_SHAPE_MAP } from '../ontology/vocabulary.js';

/** Joins a vocabulary list; truncates to `maxShown` with a pointer to the ontology query tool. */
function shortList(items: readonly string[], maxShown: number): string {
  if (items.length <= maxShown) return items.join('|');
  return `${items.slice(0, maxShown).join('|')}…(${items.length} total via pinepaper_query_ontology)`;
}

const ITEM_TYPES = shortList(ItemTypeSchema.options, ItemTypeSchema.options.length);
const RELATION_TYPES = shortList(RelationTypeSchema.options, 8);
const DIAGRAM_SHAPES = shortList(Object.keys(DIAGRAM_SHAPE_MAP), 12);

export const MINIMAL_DESCRIPTIONS: Record<string, string> = {
  // --- Canvas ---
  pinepaper_set_background_color: 'Set background. color: hex string (e.g. "#0f172a").',
  pinepaper_set_canvas_size: 'Set canvas size. width+height OR preset: instagram|youtube|tiktok|twitter|a4|letter.',
  pinepaper_get_canvas_size: 'Get current canvas width and height.',
  pinepaper_clear_canvas: 'Remove all items from canvas.',
  pinepaper_refresh_page: 'Reload the PinePaper browser page.',

  // --- Item CRUD ---
  pinepaper_create_item: `Create item. itemType: ${ITEM_TYPES}. position: {x,y}. properties: {color, radius, ...}.`,
  pinepaper_modify_item: 'Modify item. itemId, properties: {color, opacity, x, y, scaleX, scaleY, rotation, ...}. Letter-collage non-destructive: palette, collageStyle, bgColor, textColor.',
  pinepaper_delete_item: 'Remove item by itemId.',
  pinepaper_create_glossy_sphere: 'Create a 3D-looking glossy sphere with lighting.',
  pinepaper_create_diagonal_stripes: 'Create a diagonal stripe pattern.',
  pinepaper_import_svg: "Import SVG markup or a URL. source:'figma' normalises Figma Copy-as-SVG first (root fill=none makes everything invisible; missing viewBox; global ids like clip0 collide across imports).",
  pinepaper_import_mermaid: 'Import a Mermaid diagram (flowchart|graph|stateDiagram|sequenceDiagram|erDiagram|classDiagram). mermaidText, autoLayout, clearExisting.',
  pinepaper_import_image: 'Import a raster image (PNG/JPG/WebP) onto the canvas.',
  pinepaper_search_assets: 'Search 850k+ SVG icons from SVGRepo, Iconify, FontAwesome, OpenClipart.',
  pinepaper_import_asset: 'Place a search result asset onto the canvas.',
  pinepaper_batch_create: 'Create multiple items in one call with single history save.',
  pinepaper_batch_modify: 'Modify multiple items in one call with single history save.',
  pinepaper_create_grid: 'Create a grid of lines on canvas.',
  pinepaper_geometry: 'Exact geometry construction (polygon vertices, intersections, circumcircle, tangents); optionally creates an item from the result. {operation, args, createAs?}',
  pinepaper_equation_path: 'Path item from a math equation (deterministic). kind: function|parametric|fourier|preset (spiral/rose/lissajous/astroid/heart/spirograph). {expr|xExpr/yExpr|harmonics|preset, min, max, samples}',
  pinepaper_event: "Event channel for scene chains (S11). action:'create' {name}→eventId, or 'pulse' {eventId}. Wire beats with on_event_fire_after/add_relation/set_color relations (event as sourceId).",
  pinepaper_construction_sequence: 'Reveal a figure step by step on the timeline (build/play/clear/list). {action, steps?, stepDuration?}',
  pinepaper_group: 'Group a composite object\'s parts into ONE entity, ungroup, or break_apart an imported SVG into movable parts. {action: group|ungroup|break_apart, itemIds?, itemId?, groupName?, groupId?}',
  pinepaper_camera_director: 'Cinematic camera walkthrough from a shot list (auto: one shot per item, or explicit shots). Compiles to one camera_animates track. {action: auto|shots, shots?, order?, establishing?, loop?}',
  pinepaper_detect_objects: 'On-device image detection: DETR 80-class, or queries:[…] open-vocabulary (OWL-ViT). asNodes:true → image-anchored design nodes. {itemId?, threshold?, asNodes?, queries?}',
  pinepaper_extract_object: 'Detect + crop the best-matching object out of an imported image into a new item. {label?, itemId?, x?, y?, threshold?}',
  pinepaper_arrange: 'Change an item\'s z-order (stacking). {itemId, action: front|back|forward|backward}',
  pinepaper_validate_scene: 'Audit the live canvas (dangling refs, unknown types/props, keyframes, cycles) → structured diagnostics. Optional ops[] to pre-validate proposed mutations.',
  pinepaper_capture_frames: 'Deterministic frame capture at given times (seeded random). Returns per-frame hashes (or data URLs) to verify reproducibility/motion. {times, seed?, includeDataUrls?}',
  pinepaper_instantiate_ontology: 'Compile a pp: JSON-LD graph (typed nodes + structural edges like on_top_of) into a scene — roots placed, rest positioned by relations. {doc, canvas?, defaultGeometry?} → {itemIds, diagnostics}.',
  pinepaper_lint_scene: 'Read-only relational-density audit of the live scene → {density, suggestions}. Flags coordinate-driven scenes and proposes structural relations for unrelated items already in position. {eps?, cap?}',
  pinepaper_media: "Video/audio + editing. action: upload_video|upload_audio|list|remove|set_playback_rate|set_clip|set_time_remap|speed_ramp|match_cut|apply_track_matte|stop_live_matte.",
  pinepaper_game: "Game logic: pathfind (A* world-coords waypoints for moves_along_path)|create_tilemap (board data + grid + merged collision rects). Pure data, draws nothing.",
  pinepaper_shatter_image: "Split a raster into a grid of tiles (inert until animated). Group adopts the original id. {itemId, pieces?|rows?+cols?, keepSource?}",
  pinepaper_import_layered_character: "Import decomposer output (layer manifest + images) as role-bound parts; blink/smile work immediately. CHECK rolesWired>0. {info, images}",
  pinepaper_text_style: "Display text styles + variable fonts. action: apply_style (stacked-layer title, adopts the text id)|set_font_axes (weight/width/slant, animatable)|list_styles.",
  pinepaper_crop_image: 'One-shot crop of an image item to a canvas-coords rect (clamped; keeps the registry id). {itemId, rect: {x,y,width,height}, aspectRatio?}',
  pinepaper_chroma_key: "One-shot green-screen background removal on an image item (keeps the registry id). Omit threshold/smoothing to auto-estimate. {itemId, color?, threshold?, smoothing?}",
  pinepaper_rigging: "Skeletal rigging + animation. action: create_skeleton, add_bone, attach_item, create_ik_chain, add_pose_keyframe (S12 breakdown controls), set_target_path, save_pose, save_shape_key.",

  // --- Relations ---
  pinepaper_add_relation: `Add relation. sourceId, targetId, type: ${RELATION_TYPES}. params: {speed, ...}.`,
  pinepaper_remove_relation: 'Remove relation. sourceId, targetId, type.',
  pinepaper_query_relations: 'Query relations for itemId.',
  pinepaper_register_custom_relation: 'Register a custom relation type with JavaScript update function.',

  // --- Custom code ---
  pinepaper_execute_custom_code: 'Execute arbitrary JavaScript in the PinePaper browser context.',

  // --- Animation ---
  pinepaper_animate: 'Animate item. itemId, type: pulse|rotate|bounce|fade|wobble|slide|typewriter. speed, amplitude optional.',
  pinepaper_keyframe_animate: 'Keyframe animate. itemId, keyframes: [{time, properties:{opacity,scale,x,y,rotation,...}, easing}], duration. Clip window: timeOffset, clipInPoint, clipOutPoint.',
  pinepaper_play_timeline: 'Control playback. action: play|pause|stop|seek. position (seconds) for seek.',

  // --- Masks ---
  pinepaper_apply_animated_mask: 'Apply mask. itemId, preset: wipeLeft|wipeRight|iris|irisOut|star|heart|curtainH|curtainV|cinematic|diagonalWipe|revealUp|revealDown.',
  pinepaper_apply_custom_mask: 'Apply a custom mask shape to an item.',
  pinepaper_remove_mask: 'Remove mask from an item.',
  pinepaper_get_mask_types: 'List available mask types.',
  pinepaper_get_mask_animations: 'List available mask animation presets.',

  // --- Animation info ---
  pinepaper_get_animatable_properties: 'List animatable properties for an item type.',
  pinepaper_get_available_easings: 'List available easing functions.',

  // --- Camera ---
  pinepaper_camera_animate: 'Camera keyframes. Per-kf: zoom, focus ([x,y]|id|{item,offset}), pitch, yaw, easing; curved via pathOut/pathIn or pathMode:arc+pivot / custom+path.',
  pinepaper_camera: 'Camera control. action: zoom|pan|move_to|reset|stop|state|fit_view. zoom: direction in|out, level. pan: direction or {x,y}, amount. move_to: {x,y,zoom}. duration default 0.5s.',

  // --- Scenes & Templates ---
  pinepaper_create_scene: 'Create scene. items: [{name, itemType, position, properties}], relations: [{source, target, type}], animations: [{target, type}].',
  pinepaper_manage_scenes: 'Scene CRUD. action: save|load|list|delete|rename|duplicate|reorder|info|export|import. name, sceneId, transition: none|fade|zoom-in|zoom-out.',
  pinepaper_scene_playback: 'Scene chain playback. action: create_chain|play|pause|resume|stop|toggle_loop|jump. sceneIds, defaultDuration (secs), loop.',
  pinepaper_apply_template: 'Apply pre-built template (templateId), or list available (listOnly:true). 13 categories. DESTRUCTIVE: replaces canvas.',

  // --- Diagrams ---
  pinepaper_create_diagram_shape: `Create diagram shape. shapeType: ${DIAGRAM_SHAPES}. position: {x,y}. text: string.`,
  pinepaper_connect: 'Connect items. sourceId, targetId. style: arrow|line. routing: orthogonal|straight|curved.',
  pinepaper_connect_ports: 'Connect specific ports on items.',
  pinepaper_add_ports: 'Add connection ports to an existing item.',
  pinepaper_auto_layout: 'Auto-layout diagrams. algorithm: hierarchical|force|radial|grid. direction: TB|BT|LR|RL.',
  pinepaper_get_diagram_shapes: 'List available diagram shape types.',
  pinepaper_update_connector: 'Update connector style, label, or routing.',
  pinepaper_remove_connector: 'Remove a connector.',
  pinepaper_diagram_mode: 'Toggle diagram editing mode.',

  // --- Maps ---
  pinepaper_map: 'Map load + viewport. action: load|pan|zoom|export_config|import_custom. mapId: usa|world|worldHighRes|<custom>.',
  pinepaper_map_regions: 'Map region styling/selection. action: highlight|unhighlight|apply_colors|add_marker|add_labels|get_at_point|select|deselect|get_highlighted.',
  pinepaper_map_animation: 'Map region animation. action: animate_regions|animate_wave|stop|get_animated. duration, loop.',
  pinepaper_map_data: 'Map import/export. action: export_csv|import_csv|export_geojson|export_original_geojson|source_info.',
  pinepaper_globe: 'Globe mode + world tour. action: enable|rotate_to|spin|world_tour|stop_tour|pin_item|tour_item. world_tour needs regions or coords.',

  // --- Fonts ---
  pinepaper_font: 'Font Studio. action: show_studio|set_name|create_glyph|create_space|remove_glyph|set_metrics|export|cleanup_path|… (16 actions; see pinepaper_tool_guide).',

  // --- Letter Collage ---
  pinepaper_create_letter_collage: 'Create stylized text with per-letter customization (Wordle, magazine, gradient).',
  pinepaper_animate_letter_collage: 'Animate letter collage with staggered effects.',

  // --- Generators ---
  pinepaper_execute_generator: 'Run generator. name: drawBokeh|drawGrid|drawWaves|drawSunburst|drawFunctionPlot|drawSimulation|draw3DSurface|... params: {colors, interactive}.',
  pinepaper_list_generators: 'List available background generators with parameters.',

  // --- Effects & Filters ---
  pinepaper_apply_effect: 'Apply visual effect. effectType: sparkle|blast|smoke|fire|rain|snow|confetti|ripple|glow|electric|bubbles|dust|fireflies|shockwave|trail. params: {color, speed, ...}.',
  pinepaper_add_filter: 'Add SVG filter to canvas (blur, glow, shadow, etc.).',

  // --- Query ---
  pinepaper_get_items: 'Get all items on canvas with positions and properties.',
  pinepaper_get_relation_stats: 'Get relation statistics and counts.',

  // --- Export ---
  pinepaper_export_svg: 'Export canvas as animated SVG.',
  pinepaper_export_training_data: 'Export instruction/code pairs for LLM training.',
  pinepaper_export_scene: 'Export scene definition as JSON.',

  // --- Browser ---
  pinepaper_browser_connect: 'Connect to PinePaper Studio browser instance.',
  pinepaper_browser_disconnect: 'Disconnect from browser.',
  pinepaper_browser_screenshot: 'Take screenshot of the canvas.',
  pinepaper_browser_status: 'Check browser connection status.',

  // --- Performance ---
  pinepaper_get_performance_metrics: 'Get execution timing and performance statistics.',
  pinepaper_diagnostic_report: 'Generate diagnostic report with token budget analysis.',

  // --- Agent Flow ---
  pinepaper_agent_start_job: 'Start job. description: user prompt (gets design tips). clearCanvas: true, canvasPreset: instagram|youtube|tiktok. Returns canvasSize.',
  pinepaper_agent_end_job: 'End job and get summary with screenshot.',
  pinepaper_agent_reset: 'Quick canvas reset without page refresh.',
  pinepaper_agent_batch_execute: 'ALL ops in one call. Pattern: set_canvas_size → set_background/execute_generator → create → animate/keyframe_animate EACH item ("$0","$1") → play_timeline (REQUIRED).',
  pinepaper_agent_export: 'Export. format: svg|png|gif|mp4|webm|pdf. "video"→mp4. platform: instagram|tiktok|youtube|twitter. framing: canvas|camera (video only). Do NOT retry on fail.',
  pinepaper_agent_analyze: 'Analyze canvas content for export recommendations.',

  // --- Misc ---
  pinepaper_p5_draw: 'Execute p5.js-style drawing code on canvas.',
  pinepaper_register_item: 'Register an existing Paper.js item in the PinePaper registry.',

  // --- Ontology ---
  pinepaper_get_canvas_ontology: 'Capture live canvas as compact pp: triples + item summary. Prefer over get_items for composition reasoning. maxItems, maxChildren, includeViewport.',
  pinepaper_analyze_design: 'Analyze template definition → typed graph, patterns, math functions, semantics, fingerprint, JSON-LD.',
  pinepaper_validate_design: 'Validate + score template definition. 5-dimension quality scoring: completeness, animation, semantics, composition, structure.',
  pinepaper_validate: "Semantic validation of the live scene/op → structured diagnostics {code, severity, message, fix}. mode:'scene'|'op'. Catches missing targets (+did-you-mean), bad params, cycles.",
  pinepaper_query_ontology: 'Query design knowledge graph. query: list_types|list_edges|list_generators|list_effects|type_hierarchy|type_properties|animatable_properties|is_subtype|node_type|edge_type.',

  // --- Selection, Transform & History ---
  pinepaper_selection: 'Manage selection. action: select|select_all|deselect_all|get|delete_selected. itemIds, mode: replace|add|remove.',
  // The "call this after uploading a video" hint lives in the full and compact
  // tiers; minimal is for token-starved clients and has a hard 200-char cap.
  pinepaper_transform: 'Transform items. action: fit|nudge|flip|reorder. fit: mode contain|cover, scales+centres to the export frame. dx,dy. direction: horizontal|vertical. order: bringToFront|sendToBack|moveUp|moveDown.',
  pinepaper_history: 'Undo/redo. action: undo|redo|get_state.',
  // "Wires relations, not coordinates" earns its place even at this tier: it is
  // what stops a model positioning the images itself and getting a dead layout.
  pinepaper_compose: 'Named collage layout + camera. action: list_patterns (call first — fixed slot counts) | apply {pattern, itemIds in slot order} | list_treatments | set_treatment. Wires relations, not coordinates.',
  pinepaper_brand_kit: 'Apply brand colours by role. action: plan (dry run + contrast audit)|apply. kit: {name, colors:{primary,secondary?,accent?,background?,text?}, fonts?}. Only name+colors.primary required.',
  pinepaper_component: 'Reusable master + instances, per-instance overrides. action: define|list|instantiate|set_override|sync|update_from_instance|detach. {itemIds?, componentId?, instanceId?, componentKey?, prop?, value?}',
  pinepaper_artboard: 'Resize the artboard and control reflow. action: list_presets|set|set_constraints. {preset? | width+height, itemId?, horizontal?, vertical?}',
  pinepaper_comment: 'Notes pinned to an item, a point and/or a time. action: add|list|resolve|delete. add needs text + at least one anchor. {text?, itemId?, x?, y?, time?, id?}',
  pinepaper_provenance: 'Where an item came from, what depends on it. action: get|lineage|dependents|record. {itemId, kind?, sourceRef?}',
  pinepaper_audio_beats: 'Beat detection + bake to keyframes. action: analyze {source} | animate_to_beat {itemId, source|beats[], grid?, property?, base?, accent?, decay?}.',
  pinepaper_template_params: 'Templates with typed inputs. action: get {templateId} (discover params) | apply {templateId, params}. Values are coerced + range-checked.',
  pinepaper_scene_diff: 'What changed between two scene states. action: history {indexA,indexB}|version {versionId}. Use it to verify a batch produced the scene you intended.',

  // --- Image Processing ---
  pinepaper_image_filter: 'GPU image filters. action: apply|chain. itemId, filterName, params, filters[].',
  pinepaper_lasso: 'Lasso selection. action: activate|apply. itemId.',
  pinepaper_cutout_style: 'Style cutouts. action: apply|list. itemId, preset, options.',

  // --- Composition & View ---
  pinepaper_precomp: 'Nested compositions. action: create|add|remove. itemIds, name, precompId, itemId.',
  pinepaper_background: 'Background. action: set|clear|get. mode: color|pattern|generator.',

  // --- Canvas Query ---
  pinepaper_query: 'Canvas queries. action: get_by_id|hit_test|is_empty. itemId, x, y, tolerance.',

  // --- Deformation, Sprite Sheets, Interaction ---
  pinepaper_deform: 'Vertex deformation. action: apply|trigger|remove. itemId, preset: fold|squeeze|squash|twist|ripple|wave|breathe|wobble..., phase, amplitude.',
  pinepaper_sprite_sheet: 'Sprite sheets. action: generate|play|export. skeletonId, spriteSheetId, poses, animations, format.',
  pinepaper_interaction: 'Physics behaviors. action: add_behavior|remove_behavior|trigger_action|get_state. behaviorType: repel|attract|follow|orbit|slingshot.',

  // --- Widget Export ---
  pinepaper_export_widget: 'Export scene as pp:PinePaper ontology JSON. download, filename, includeInteractions, minify.',
  pinepaper_export_widget_html: 'Export scene as self-contained HTML with tree-shaken runtime. title, download.',

  // --- Data Visualization, Magic, Physics, Measurement ---
  pinepaper_create_chart: 'Charts. action: create|update|reconfigure|remove. chartType: bar|line|scatter|area. data, options, chartId. Bar opts: orient:"horizontal", labelArrangement: auto|slanted|vertical|truncate|wrap.',
  pinepaper_magic: 'Auto-animation. action: animate|remix. mood: calm|professional|energetic|dramatic|whimsical. selectionOnly.',
  pinepaper_physics: 'Rigid body sim. action: init|add_body|remove_body|apply_force|apply_impulse|set_velocity|get_state|create_ground|create_joint. gravity, bodyType, mass, friction.',
  pinepaper_measurement: 'Rulers/grid. action: set_rulers|set_grid|get_dimensions|set_snap. enabled, itemId.',

  // --- Guide & runtime config ---
  pinepaper_tool_guide: 'Get detailed guidance for any tool, category, or the full AI Agent Guide.',
  pinepaper_set_toolkit: 'Switch toolkit (full|agent|diagram|map|font|minimal) and/or verbosity (verbose|compact|minimal) at runtime.',
};
