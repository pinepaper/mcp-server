/**
 * Minimal tool descriptions for maximum context savings.
 *
 * Activated via PINEPAPER_VERBOSITY=minimal env var.
 * Each tool gets a single-line summary (~40-100 chars).
 * Full descriptions available on-demand via pinepaper_tool_guide.
 */

export const MINIMAL_DESCRIPTIONS: Record<string, string> = {
  // --- Canvas ---
  pinepaper_set_background_color: 'Set background. color: hex string (e.g. "#0f172a").',
  pinepaper_set_canvas_size: 'Set canvas size. width+height OR preset: instagram|youtube|tiktok|twitter|a4|letter.',
  pinepaper_get_canvas_size: 'Get current canvas width and height.',
  pinepaper_clear_canvas: 'Remove all items from canvas.',
  pinepaper_refresh_page: 'Reload the PinePaper browser page.',

  // --- Item CRUD ---
  pinepaper_create_item: 'Create item. itemType: text|circle|rectangle|star|triangle|polygon|ellipse|path|line|arc. position: {x,y}. properties: {color, radius, ...}.',
  pinepaper_modify_item: 'Modify item. itemId: string. properties: {color, opacity, x, y, scaleX, scaleY, rotation, ...}.',
  pinepaper_delete_item: 'Remove item by itemId.',
  pinepaper_create_glossy_sphere: 'Create a 3D-looking glossy sphere with lighting.',
  pinepaper_create_diagonal_stripes: 'Create a diagonal stripe pattern.',
  pinepaper_import_svg: 'Import SVG markup onto the canvas.',
  pinepaper_import_image: 'Import a raster image (PNG/JPG/WebP) onto the canvas.',
  pinepaper_search_assets: 'Search 850k+ SVG icons from SVGRepo, Iconify, FontAwesome, OpenClipart.',
  pinepaper_import_asset: 'Place a search result asset onto the canvas.',
  pinepaper_batch_create: 'Create multiple items in one call with single history save.',
  pinepaper_batch_modify: 'Modify multiple items in one call with single history save.',
  pinepaper_create_grid: 'Create a grid of lines on canvas.',

  // --- Relations ---
  pinepaper_add_relation: 'Add relation. sourceId, targetId, type: orbits|follows|attached_to|points_at|mirrors|parallax|wave_through|morphs_to. params: {speed, ...}.',
  pinepaper_remove_relation: 'Remove relation. sourceId, targetId, type.',
  pinepaper_query_relations: 'Query relations for itemId.',
  pinepaper_register_custom_relation: 'Register a custom relation type with JavaScript update function.',

  // --- Custom code ---
  pinepaper_execute_custom_code: 'Execute arbitrary JavaScript in the PinePaper browser context.',

  // --- Animation ---
  pinepaper_animate: 'Animate item. itemId, type: pulse|rotate|bounce|fade|wobble|slide|typewriter. speed, amplitude optional.',
  pinepaper_keyframe_animate: 'Keyframe animate. itemId, keyframes: [{time, properties: {opacity,scale,x,y,rotation,...}, easing}], duration.',
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
  pinepaper_camera_animate: 'Animate camera with keyframes (zoom, pan, rotate).',
  pinepaper_camera_zoom: 'Set camera zoom level.',
  pinepaper_camera_pan: 'Pan camera to offset.',
  pinepaper_camera_move_to: 'Move camera to center on a point or item.',
  pinepaper_camera_reset: 'Reset camera to default view.',
  pinepaper_camera_stop: 'Stop camera animation.',
  pinepaper_camera_state: 'Get current camera position, zoom, and rotation.',

  // --- Scenes & Templates ---
  pinepaper_create_scene: 'Create scene. items: [{name, itemType, position, properties}], relations: [{source, target, type}], animations: [{target, type}].',
  pinepaper_manage_scenes: 'Scene CRUD. action: save|load|list|delete|rename|duplicate|reorder|info|export|import. name, sceneId, transition: none|fade|zoom-in|zoom-out.',
  pinepaper_scene_playback: 'Scene chain playback. action: create_chain|play|pause|resume|stop|toggle_loop|jump. sceneIds, defaultDuration (secs), loop.',
  pinepaper_apply_template: 'Apply a pre-built template to the canvas.',

  // --- Diagrams ---
  pinepaper_create_diagram_shape: 'Create diagram shape. shapeType: process|decision|terminal|data|document|database|cloud|server. position: {x,y}. text: string.',
  pinepaper_connect: 'Connect items. sourceId, targetId. style: arrow|line. routing: orthogonal|straight|curved.',
  pinepaper_connect_ports: 'Connect specific ports on items.',
  pinepaper_add_ports: 'Add connection ports to an existing item.',
  pinepaper_auto_layout: 'Auto-layout diagrams. algorithm: hierarchical|force|radial|grid. direction: TB|BT|LR|RL.',
  pinepaper_get_diagram_shapes: 'List available diagram shape types.',
  pinepaper_update_connector: 'Update connector style, label, or routing.',
  pinepaper_remove_connector: 'Remove a connector.',
  pinepaper_diagram_mode: 'Toggle diagram editing mode.',

  // --- Maps ---
  pinepaper_load_map: 'Load map. mapId: usa|world|worldHighRes. options: {projection: albers|mercator|...}.',
  pinepaper_highlight_regions: 'Highlight map regions with a color.',
  pinepaper_unhighlight_regions: 'Remove highlight from map regions.',
  pinepaper_apply_data_colors: 'Color regions. data: {"CA": 100, "TX": 80}. options: {colorScale: blues|reds|greens|...}.',
  pinepaper_add_marker: 'Add a point marker to the map.',
  pinepaper_add_map_labels: 'Add text labels to map regions.',
  pinepaper_pan_map: 'Pan the map view.',
  pinepaper_zoom_map: 'Zoom the map view.',
  pinepaper_export_map: 'Export map as SVG.',
  pinepaper_import_custom_map: 'Import GeoJSON/TopoJSON map data.',
  pinepaper_get_region_at_point: 'Get map region at canvas coordinates.',
  pinepaper_animate_map_regions: 'Animate map regions with keyframe colors/opacity.',
  pinepaper_animate_map_wave: 'Animate wave effect across map regions.',
  pinepaper_stop_map_animations: 'Stop all map animations.',
  pinepaper_get_animated_map_regions: 'List currently animated map regions.',
  pinepaper_export_map_region_csv: 'Export map region data as CSV.',
  pinepaper_import_map_region_csv: 'Import CSV data to color map regions.',
  pinepaper_select_map_regions: 'Programmatically select map regions.',
  pinepaper_deselect_map_regions: 'Deselect map regions.',
  pinepaper_get_highlighted_map_regions: 'List highlighted map regions and colors.',
  pinepaper_export_map_geojson: 'Export current map state as GeoJSON.',
  pinepaper_export_original_map_geojson: 'Export original unmodified map GeoJSON.',
  pinepaper_get_map_source_info: 'Get map source attribution and metadata.',

  // --- Fonts ---
  pinepaper_font_show_studio: 'Open Font Studio UI for glyph editing.',
  pinepaper_font_set_name: 'Set the font family name.',
  pinepaper_font_get_required_chars: 'Get list of required character glyphs.',
  pinepaper_font_get_status: 'Get font creation progress and glyph status.',
  pinepaper_font_create_glyph: 'Create or update a glyph from SVG path data.',
  pinepaper_font_create_space: 'Create the space character glyph.',
  pinepaper_font_remove_glyph: 'Remove a glyph from the font.',
  pinepaper_font_set_metrics: 'Set font metrics (ascent, descent, units per em).',
  pinepaper_font_export: 'Export font as OTF/TTF/WOFF2 file.',
  pinepaper_font_load_into_document: 'Load the custom font into the current document.',
  pinepaper_font_export_data: 'Export font project as JSON for backup.',
  pinepaper_font_import_data: 'Import font project from JSON backup.',
  pinepaper_font_clear: 'Clear all font data and start fresh.',
  pinepaper_font_remove_overlap: 'Clean up overlapping paths in a glyph.',
  pinepaper_font_correct_direction: 'Fix path winding direction for a glyph.',
  pinepaper_font_cleanup_path: 'Simplify and clean up glyph path data.',

  // --- Letter Collage ---
  pinepaper_create_letter_collage: 'Create stylized text with per-letter customization (Wordle, magazine, gradient).',
  pinepaper_animate_letter_collage: 'Animate letter collage with staggered effects.',
  pinepaper_get_letter_collage_options: 'List available collage styles, palettes, and options.',

  // --- Generators ---
  pinepaper_execute_generator: 'Run generator. name: drawBokeh|drawGrid|drawWaves|drawCircuit|drawSunburst|drawGradientMesh|drawPattern|drawGlobeWireframe|... params: {colors, ...}.',
  pinepaper_list_generators: 'List available background generators with parameters.',

  // --- Effects & Filters ---
  pinepaper_apply_effect: 'Apply visual effect. effectType: sparkle|blast|smoke|fire|rain|snow|confetti|ripple|glow|electric. params: {color, speed, ...}.',
  pinepaper_add_filter: 'Add SVG filter to canvas (blur, glow, shadow, etc.).',

  // --- Triggers ---
  pinepaper_add_trigger: 'Add interactive event trigger (click, hover, drag) to an item.',
  pinepaper_remove_trigger: 'Remove event triggers from an item.',
  pinepaper_query_triggers: 'Query existing triggers on canvas.',

  // --- Quiz ---
  pinepaper_create_quiz: 'Create interactive quiz with multiple question types.',
  pinepaper_get_quiz_state: 'Get quiz score, progress, and answers.',
  pinepaper_reset_quiz: 'Reset quiz to initial state.',

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
  pinepaper_agent_export: 'Export. format: svg|png|gif|mp4|webm|pdf. "video"→mp4. platform: instagram|tiktok|youtube|twitter. Do NOT retry on fail.',
  pinepaper_agent_analyze: 'Analyze canvas content for export recommendations.',

  // --- Misc ---
  pinepaper_get_canvas_presets: 'List canvas size presets (YouTube, Instagram, TikTok, etc.).',
  pinepaper_p5_draw: 'Execute p5.js-style drawing code on canvas.',
  pinepaper_register_item: 'Register an existing Paper.js item in the PinePaper registry.',

  // --- Ontology ---
  pinepaper_analyze_design: 'Analyze template definition → typed graph, patterns, math functions, semantics, fingerprint, JSON-LD.',
  pinepaper_validate_design: 'Validate + score template definition. 5-dimension quality scoring: completeness, animation, semantics, composition, structure.',
  pinepaper_query_ontology: 'Query design knowledge graph. query: list_types|list_edges|list_generators|list_effects|type_hierarchy|type_properties|animatable_properties|is_subtype|node_type|edge_type.',

  // --- Selection, Transform & History ---
  pinepaper_selection: 'Manage selection. action: select|select_all|deselect_all|get|delete_selected. itemIds, mode: replace|add|remove.',
  pinepaper_transform: 'Transform items. action: nudge|flip|reorder. dx,dy. direction: horizontal|vertical. order: bringToFront|sendToBack|moveUp|moveDown.',
  pinepaper_history: 'Undo/redo. action: undo|redo|get_state.',

  // --- Image Processing ---
  pinepaper_image_filter: 'GPU image filters. action: apply|chain. itemId, filterName, params, filters[].',
  pinepaper_lasso: 'Lasso selection. action: activate|apply. itemId.',
  pinepaper_cutout_style: 'Style cutouts. action: apply|list. itemId, preset, options.',

  // --- Composition & View ---
  pinepaper_precomp: 'Nested compositions. action: create|add|remove. itemIds, name, precompId, itemId.',
  pinepaper_view: 'View control. action: fit|get_state. mode: content|canvas, padding.',
  pinepaper_background: 'Background. action: set|clear|get. mode: color|pattern|generator.',

  // --- Canvas Query ---
  pinepaper_query: 'Canvas queries. action: get_by_id|hit_test|is_empty. itemId, x, y, tolerance.',

  // --- Guide & runtime config ---
  pinepaper_tool_guide: 'Get detailed guidance for any tool, category, or the full AI Agent Guide.',
  pinepaper_set_toolkit: 'Switch toolkit (full|agent|diagram|map|font|minimal) and/or verbosity (verbose|compact|minimal) at runtime.',
};
