/**
 * NO SILENT SUCCESS, the classification half (tracker: handler-layer sweep).
 *
 * Every tool, and every action of an action-dispatched tool, is one of:
 * - 'mutates'     it exists to change the scene. A success that changed
 *                 nothing measurable is flagged (the runtime half).
 * - 'read-only'   it reads; it must not change the scene.
 * - 'side-effect' its effect is outside the scene: a file, playback, a sound
 *                 heard now, UI state (selection, rulers, modes), the server.
 * - 'unchecked'   it changes state the scene fingerprint cannot see (the 3D
 *                 world, physics bodies, the font studio, rig internals,
 *                 registries of definitions), or it only sometimes changes the
 *                 scene. Named here as a blind spot rather than guessed at,
 *                 because a false "nothing changed" teaches a model to ignore
 *                 the flag.
 *
 * The class behind D59, D37, D62 and the audioTracks drop: a handler that
 * reported success for work the engine did not do.
 */

export type EffectClass = 'mutates' | 'read-only' | 'side-effect' | 'unchecked';

/** Tools with no action enum and no readOnlyHint: each is named, so a new one fails the test until it is. */
export const TOOL_CLASS: Readonly<Record<string, EffectClass>> = Object.freeze({
  pinepaper_set_background_color: 'mutates',
  pinepaper_set_canvas_size: 'mutates',
  pinepaper_clear_canvas: 'mutates',
  pinepaper_refresh_page: 'side-effect',
  pinepaper_create_item: 'mutates',
  pinepaper_modify_item: 'mutates',
  pinepaper_delete_item: 'mutates',
  pinepaper_create_glossy_sphere: 'mutates',
  pinepaper_create_diagonal_stripes: 'mutates',
  pinepaper_import_motion_capture: 'unchecked',   // rig internals
  pinepaper_import_svg: 'mutates',
  pinepaper_import_mermaid: 'mutates',
  pinepaper_import_image: 'mutates',
  pinepaper_import_asset: 'mutates',
  pinepaper_batch_create: 'mutates',
  pinepaper_batch_modify: 'mutates',
  pinepaper_create_grid: 'mutates',
  pinepaper_geometry: 'unchecked',                // creates an item only when asked
  pinepaper_equation_path: 'mutates',
  pinepaper_beat_cuts: 'unchecked',               // splits a clip only when asked
  pinepaper_generate: 'unchecked',                // cloud job; places when it finishes
  pinepaper_generate_status: 'unchecked',
  pinepaper_render_batch: 'side-effect',          // exports per row
  pinepaper_detect_objects: 'unchecked',          // nodes only with asNodes
  pinepaper_extract_object: 'mutates',
  pinepaper_capture_frames: 'side-effect',
  pinepaper_crop_image: 'mutates',
  pinepaper_chroma_key: 'mutates',
  pinepaper_shatter_image: 'mutates',
  pinepaper_import_layered_character: 'mutates',
  pinepaper_character: 'mutates',
  pinepaper_instantiate_ontology: 'mutates',
  pinepaper_add_relation: 'mutates',
  pinepaper_remove_relation: 'mutates',
  pinepaper_register_custom_relation: 'unchecked', // a definition, not the scene
  pinepaper_execute_custom_code: 'unchecked',     // may only read; has its own rollback
  pinepaper_animate: 'mutates',
  pinepaper_keyframe_animate: 'mutates',
  pinepaper_apply_animated_mask: 'mutates',
  pinepaper_apply_custom_mask: 'mutates',
  pinepaper_remove_mask: 'mutates',
  pinepaper_camera_animate: 'mutates',
  pinepaper_create_scene: 'mutates',
  pinepaper_apply_template: 'mutates',
  pinepaper_create_diagram_shape: 'mutates',
  pinepaper_connect: 'mutates',
  pinepaper_connect_ports: 'mutates',
  pinepaper_add_ports: 'mutates',
  pinepaper_auto_layout: 'mutates',
  pinepaper_update_connector: 'mutates',
  pinepaper_remove_connector: 'mutates',
  pinepaper_create_letter_collage: 'mutates',
  pinepaper_animate_letter_collage: 'mutates',
  pinepaper_execute_generator: 'mutates',
  pinepaper_apply_effect: 'mutates',
  pinepaper_add_filter: 'mutates',
  pinepaper_styled_scene: 'mutates',
  pinepaper_choreograph: 'mutates',
  pinepaper_place_on_surface: 'mutates',
  pinepaper_import_scene: 'mutates',
  pinepaper_browser_connect: 'side-effect',
  pinepaper_browser_disconnect: 'side-effect',
  pinepaper_agent_start_job: 'side-effect',       // clearing an empty canvas changes nothing, rightly
  pinepaper_agent_end_job: 'side-effect',
  pinepaper_agent_reset: 'side-effect',
  pinepaper_agent_batch_execute: 'mutates',
  pinepaper_p5_draw: 'mutates',
  pinepaper_register_item: 'mutates',
  pinepaper_set_toolkit: 'side-effect',
});

/** Whole action-dispatched tools whose state the fingerprint cannot see. */
export const UNCHECKED_TOOLS: ReadonlySet<string> = new Set([
  'pinepaper_world3d', 'pinepaper_rigging', 'pinepaper_globe', 'pinepaper_physics',
  'pinepaper_font', 'pinepaper_interaction', 'pinepaper_sprite_sheet', 'pinepaper_game',
  'pinepaper_relight', 'pinepaper_shader_graph', 'pinepaper_component', 'pinepaper_comment',
  'pinepaper_template_params', 'pinepaper_design_system', 'pinepaper_motion', 'pinepaper_magic',
]);

/** Whole action-dispatched tools that only touch UI or session state. */
export const SIDE_EFFECT_TOOLS: ReadonlySet<string> = new Set([
  'pinepaper_selection', 'pinepaper_measurement', 'pinepaper_diagram_mode', 'pinepaper_play_timeline',
  'pinepaper_scene_playback', 'pinepaper_export_store',
]);

/** Per-action exceptions to the prefix rules, `tool:action`. */
export const ACTION_CLASS: Readonly<Record<string, EffectClass>> = Object.freeze({
  'pinepaper_provenance:record': 'unchecked',
  'pinepaper_event:pulse': 'side-effect',
  'pinepaper_lasso:activate': 'side-effect',
  'pinepaper_sound:define_instrument': 'unchecked',
  'pinepaper_sound:define_percussion': 'unchecked',
  'pinepaper_sound:define_sfx': 'unchecked',
  'pinepaper_story:distill': 'read-only',
  'pinepaper_story:plan_book': 'read-only',
  'pinepaper_brand_kit:plan': 'read-only',
  'pinepaper_brand_kit:from_url': 'read-only',
  'pinepaper_audio_beats:analyze': 'read-only',
  'pinepaper_compose:apply': 'mutates',
  'pinepaper_camera:state': 'read-only',
  'pinepaper_camera:fit_view': 'side-effect',
  'pinepaper_camera:stop': 'side-effect',
  'pinepaper_media:upload_video': 'mutates',
  'pinepaper_manage_scenes:save': 'side-effect',
  'pinepaper_manage_scenes:rename': 'side-effect',
  'pinepaper_manage_scenes:duplicate': 'side-effect',
  'pinepaper_manage_scenes:reorder': 'side-effect',
  'pinepaper_manage_scenes:delete': 'side-effect',
  'pinepaper_manage_scenes:import': 'side-effect',
  'pinepaper_history:get_state': 'read-only',
  'pinepaper_artboard:list_presets': 'read-only',
  'pinepaper_image_filter:analyze_palette': 'read-only',
  'pinepaper_map_regions:get_at_point': 'read-only',
  'pinepaper_map_regions:get_highlighted': 'read-only',
  'pinepaper_map_regions:select': 'side-effect',
  'pinepaper_map_regions:deselect': 'side-effect',
  'pinepaper_construction_sequence:clear': 'mutates',
  'pinepaper_flip:record': 'side-effect',          // snapshots the before-state only
  'pinepaper_path:set_locked': 'unchecked',        // a lock flag the fingerprint does not read
  'pinepaper_path:unlock_all': 'unchecked',
});

const READ_ONLY_ACTION = /^(list|get|describe|query|analyze|validate|check|resolve|catalogue|status|state|info|preview|estimate|lint|coverage|find|choose|node_types|from_text|chord_frequencies|timbre_from_path|lineage|dependents|history|version|hit_test|is_empty|source_info)(_|$)/;
const SIDE_EFFECT_ACTION = /^(play|stop|pause|resume|seek|export|render|download|show_studio|toggle_loop|jump|set_time_scale|set_progress|bind_scroll|unbind_scroll)(_|$)/;

/** The class of one call. `readOnlyHint` comes from the tool's annotations. */
export function effectClass(tool: string, action: string | undefined, readOnlyHint: boolean | undefined): EffectClass {
  if (action !== undefined) {
    const exact = ACTION_CLASS[`${tool}:${action}`];
    if (exact) return exact;
  }
  if (readOnlyHint) return 'read-only';
  if (TOOL_CLASS[tool]) return TOOL_CLASS[tool];
  if (UNCHECKED_TOOLS.has(tool)) return 'unchecked';
  if (SIDE_EFFECT_TOOLS.has(tool)) return 'side-effect';
  if (action === undefined) return 'unchecked';
  if (READ_ONLY_ACTION.test(action)) return 'read-only';
  if (SIDE_EFFECT_ACTION.test(action)) return 'side-effect';
  return 'mutates';
}
