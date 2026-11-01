/**
 * Toolkit Profiles — Workflow-based tool filtering
 *
 * Controls which tools are exposed via tools/list based on the PINEPAPER_TOOLKIT env var.
 * Reduces token usage for smaller-context models (e.g., Haiku) by only showing relevant tools.
 *
 * Profiles are composed from reusable tag groups (categories of tools).
 * Handler dispatch is NOT filtered — hidden tools still execute if called directly.
 */

import { applyLane, EDIT_TOOL_NAMES } from './lane.js';
import { env } from '../utils/env.js';

export type ToolkitProfile = 'core' | 'full' | 'agent' | 'diagram' | 'map' | 'font' | 'minimal' | 'lane' | 'edit';

export const TOOLKIT_PROFILES_LIST: ToolkitProfile[] = ['core', 'full', 'agent', 'diagram', 'map', 'font', 'minimal', 'lane', 'edit'];

/** The profile a session starts on when nothing chooses one. */
export const DEFAULT_TOOLKIT: ToolkitProfile = 'core';

// =============================================================================
// TAG GROUPS — each maps a category to its tool names
// =============================================================================

/**
 * The craft tools the server instructions send a model to (CHOOSE_THE_DOOR in definitions.ts): the core profile's
 * seed beside its tag groups. Not a tag itself, since every tool already belongs to exactly one tag group.
 * toolkit-references-are-listed.test.ts holds this equal to the tools the door block names, so an instruction never
 * points at a tool the default list leaves out.
 */
export const CRAFT_TOOLS: readonly string[] = [
  'pinepaper_styled_scene', 'pinepaper_look', 'pinepaper_story', 'pinepaper_scene_playback',
  'pinepaper_original_character', 'pinepaper_character', 'pinepaper_stick', 'pinepaper_rigging', 'pinepaper_deform',
  'pinepaper_choreograph', 'pinepaper_morph_sequence', 'pinepaper_text_style', 'pinepaper_text_effect',
  'pinepaper_design_system', 'pinepaper_compose', 'pinepaper_design_medium', 'pinepaper_image_filter',
  'pinepaper_brand_kit', 'pinepaper_sound', 'pinepaper_audio_beats', 'pinepaper_beat_cuts', 'pinepaper_emitter',
  'pinepaper_render_hook', 'pinepaper_camera_director', 'pinepaper_world3d', 'pinepaper_relight',
  'pinepaper_agent_batch_execute', 'pinepaper_create_item',
];

export const TOOL_TAGS: Record<string, string[]> = {
  // --- Core infrastructure (included in most profiles) ---
  agent: [
    'pinepaper_agent_start_job',
    'pinepaper_agent_end_job',
    'pinepaper_agent_reset',
    'pinepaper_agent_batch_execute',
    'pinepaper_agent_export',
    'pinepaper_export_store',
    'pinepaper_interchange',
    'pinepaper_agent_analyze',
  ],
  browser: [
    'pinepaper_browser_connect',
    'pinepaper_browser_disconnect',
    'pinepaper_browser_screenshot',
    'pinepaper_browser_status',
  ],
  canvas: [
    'pinepaper_set_background_color',
    'pinepaper_set_canvas_size',
    'pinepaper_get_canvas_size',
    'pinepaper_clear_canvas',
    'pinepaper_refresh_page',
    'pinepaper_background',
  ],

  // --- Item creation & modification ---
  core: [
    'pinepaper_create_item',
    'pinepaper_modify_item',
    'pinepaper_delete_item',
    'pinepaper_create_glossy_sphere',
    'pinepaper_create_diagonal_stripes',
    'pinepaper_create_grid',
    'pinepaper_geometry',
    'pinepaper_group',
    'pinepaper_arrange',
    'pinepaper_path',
  ],
  import: [
    'pinepaper_import_svg',
    'pinepaper_import_image',
    'pinepaper_place_on_surface',
    'pinepaper_detect_objects',
    'pinepaper_extract_object',
  ],
  media: [
    'pinepaper_media',
    // Beat detection is a media question, and animate_to_beat is the reason
    // anyone uploads audio in the first place.
    'pinepaper_audio_beats',
  ],
  rigging: [
    'pinepaper_rigging',
    'pinepaper_import_layered_character',
    // Directing a figure is the same subject as rigging one — it is the layer
    // above it, where the bones and poses are already known and only the
    // performance is asked for.
    'pinepaper_character',
    'pinepaper_design_system',
    'pinepaper_stick',
    'pinepaper_story',
  ],
  assets: [
    'pinepaper_search_assets',
    'pinepaper_import_asset',
  ],
  batch: [
    'pinepaper_batch_create',
    'pinepaper_batch_modify',
  ],

  // --- Relations & animation ---
  relations: [
    'pinepaper_add_relation',
    'pinepaper_remove_relation',
    'pinepaper_query_relations',
    'pinepaper_register_custom_relation',
  ],
  animation: [
    'pinepaper_stagger',
    'pinepaper_pattern',
    'pinepaper_flip',
    'pinepaper_animate',
    'pinepaper_motion',
    'pinepaper_sound',
    'pinepaper_import_motion_capture',
    'pinepaper_keyframe_animate',
    'pinepaper_choreograph',
    'pinepaper_morph_sequence',
    'pinepaper_original_character',
    'pinepaper_look',
    'pinepaper_play_timeline',
    'pinepaper_get_animatable_properties',
    'pinepaper_get_available_easings',
    'pinepaper_construction_sequence',
    'pinepaper_query_mutations',
    'pinepaper_beat_cuts',
    'pinepaper_hand_drawn',
    'pinepaper_pen_figure',
  ],
  masks: [
    'pinepaper_apply_animated_mask',
    'pinepaper_apply_custom_mask',
    'pinepaper_remove_mask',
    'pinepaper_get_mask_types',
    'pinepaper_get_mask_animations',
  ],
  camera: [
    'pinepaper_camera_animate',
    'pinepaper_camera',
    'pinepaper_camera_director',
  ],

  // --- Generators & effects ---
  generators: [
    'pinepaper_execute_generator',
    'pinepaper_list_generators',
    'pinepaper_generate',
    'pinepaper_generate_estimate',
    'pinepaper_generate_status',
    'pinepaper_styled_scene',
    // Craft generators shared from the cloud (craft-tools.ts).
    'pinepaper_draw_weave',
    'pinepaper_draw_knots',
    'pinepaper_draw_sashiko',
    'pinepaper_draw_subdivision',
  ],
  effects: [
    'pinepaper_apply_effect',
    'pinepaper_emitter',
    'pinepaper_render_hook',
    'pinepaper_text_effect',
  ],
  filters: [
    'pinepaper_add_filter',
    'pinepaper_relight',
    'pinepaper_shader_graph',
  ],

  // --- Compositions ---
  scene: [
    'pinepaper_create_scene',
    'pinepaper_manage_scenes',
    'pinepaper_scene_playback',
    'pinepaper_scene_graph',
    'pinepaper_event',
    'pinepaper_sequence',
  ],
  selection: [
    'pinepaper_selection',
  ],
  transform: [
    'pinepaper_transform',
  ],
  history: [
    'pinepaper_history',
    // Diffing is a history question — "what changed between these two states".
    'pinepaper_scene_diff',
  ],
  // Design-system surface (1.6.4): reusable styling, reusable structure, and
  // retargeting a finished design to another frame.
  design_system: [
    'pinepaper_compose',
    'pinepaper_brand_kit',
    'pinepaper_component',
    'pinepaper_artboard',
    // The medium axis belongs with the design system, not with effects: it is
    // a choice about what makes the marks, alongside register and level.
    'pinepaper_design_medium',
    // Product UI drawn on brand: it reads the active brand kit.
    'pinepaper_ui_kit',
  ],
  // Review surface (1.6.4): anchored feedback, and where things came from.
  review: [
    'pinepaper_comment',
    'pinepaper_provenance',
  ],
  image_processing: [
    'pinepaper_shatter_image',
    'pinepaper_image_filter',
    'pinepaper_lasso',
    'pinepaper_cutout_style',
    'pinepaper_crop_image',
    'pinepaper_chroma_key',
  ],
  precomp: [
    'pinepaper_precomp',
  ],
  deform: [
    'pinepaper_deform',
  ],
  sprite: [
    'pinepaper_sprite_sheet',
  ],
  interaction: [
    'pinepaper_interaction',
  ],
  dataviz: [
    'pinepaper_create_chart',
    'pinepaper_equation_path',
  ],
  magic: [
    'pinepaper_magic',
  ],
  physics: [
    'pinepaper_game',
    'pinepaper_world3d',
    'pinepaper_physics',
  ],
  measurement: [
    'pinepaper_measurement',
  ],
  template: [
    'pinepaper_apply_template',
    'pinepaper_template_params',
    'pinepaper_render_batch',
  ],

  // --- Query & export ---
  query: [
    'pinepaper_get_items',
    'pinepaper_get_relation_stats',
    'pinepaper_query',
    'pinepaper_query_capabilities',
  ],
  export: [
    'pinepaper_export_svg',
    'pinepaper_export_training_data',
    'pinepaper_export_scene',
    'pinepaper_import_scene',
    'pinepaper_export_widget',
    'pinepaper_export_widget_html',
    'pinepaper_capture_frames',
  ],

  // --- Domain: Diagrams ---
  diagram: [
    'pinepaper_create_diagram_shape',
    'pinepaper_connect',
    'pinepaper_connect_ports',
    'pinepaper_add_ports',
    'pinepaper_auto_layout',
    'pinepaper_get_diagram_shapes',
    'pinepaper_update_connector',
    'pinepaper_remove_connector',
    'pinepaper_diagram_mode',
    'pinepaper_import_mermaid',
  ],

  // --- Domain: Maps ---
  map: [
    'pinepaper_map',
    'pinepaper_map_regions',
    'pinepaper_map_animation',
    'pinepaper_map_data',
    'pinepaper_globe',
  ],

  // --- Domain: Fonts ---
  font: [
    'pinepaper_font',
    'pinepaper_text_style',
  ],

  // --- Domain: Letter Collage ---
  letter_collage: [
    'pinepaper_create_letter_collage',
    'pinepaper_animate_letter_collage',
  ],

  // --- Advanced ---
  performance: [
    'pinepaper_get_performance_metrics',
    'pinepaper_diagnostic_report',
  ],
  custom_code: [
    'pinepaper_execute_custom_code',
  ],
  p5: [
    'pinepaper_p5_draw',
  ],
  register: [
    'pinepaper_register_item',
  ],

  // --- Ontology (Design Knowledge Graph) ---
  ontology: [
    'pinepaper_get_canvas_ontology',
    'pinepaper_analyze_design',
    'pinepaper_validate_design',
    'pinepaper_validate',
    'pinepaper_accessibility_check',
    'pinepaper_validate_scene',
    'pinepaper_instantiate_ontology',
    'pinepaper_lint_scene',
    'pinepaper_query_ontology',
  ],

  // --- On-demand guide & runtime config (included in every profile but lane) ---
  guide: [
    'pinepaper_tool_guide',
    'pinepaper_set_toolkit',
  ],
};

// =============================================================================
// PROFILES — each is a list of tag names to include
// =============================================================================

export const TOOLKIT_PROFILES: Record<ToolkitProfile, string[]> = {
  // THE DEFAULT (1.6.25). The seed below, then every tool a listed tool names, until nothing new is named
  // (getToolsForToolkit closes it over the tools it is given). About half the agent profile's tokens, and no
  // listed tool points at one the list leaves out. Domain tools load on demand: pinepaper_set_toolkit {load}.
  core: ['agent', 'browser', 'canvas', 'guide', 'query'], // + CRAFT_TOOLS

  full: [], // Empty = no filtering, return all tools

  agent: [
    'agent', 'browser', 'canvas',
    'core', 'import', 'media', 'assets', 'batch',
    'relations', 'animation', 'masks', 'camera',
    'generators', 'effects', 'filters', 'template',
    // font, custom_code and filters are here because LISTED tools point at
    // them. pinepaper_text_effect and pinepaper_design_medium tell an agent to
    // use pinepaper_text_style; keyframe_animate and execute_generator point at
    // pinepaper_execute_custom_code; image_filter points at pinepaper_add_filter.
    // All three were excluded from this profile, so an agent read an
    // instruction naming a tool it could not see or call — the whole 15-style
    // caption system was reachable only by someone who already knew the name.
    // toolkit-references-are-listed.test.ts fails if that happens again.
    'font', 'custom_code', 'letter_collage',
    'scene', 'diagram', 'map',
    'selection', 'transform', 'history',
    'image_processing', 'precomp',
    'deform', 'sprite', 'interaction', 'rigging',
    'dataviz', 'magic', 'physics', 'measurement',
    'query', 'export',
    'design_system', 'review',
    'p5', 'ontology', 'guide',
  ],

  diagram: [
    'agent', 'browser', 'canvas',
    'core',
    'diagram',
    'query', 'export',
    'guide',
  ],

  map: [
    'agent', 'browser', 'canvas',
    'map',
    'query', 'export',
    'guide',
  ],

  font: [
    'agent', 'browser', 'canvas',
    'core',
    'font', 'letter_collage',
    'export',
    'guide',
  ],

  minimal: [
    'agent', 'browser', 'canvas',
    'guide',
  ],

  // The agent lane is not a tag set: it is exactly LANE_TOOL_NAMES (src/tools/lane.ts), each
  // shown with its lane description and schema, and nothing else — not even the guide, whose
  // job (explaining a surface too big to read) the lane does not have. getToolsForToolkit
  // serves it through applyLane; the server instructions are the lane's own.
  lane: [],
  // Editing a scene that exists (#43): pinepaper_lint_scene's edit section names the op that changes each relation,
  // so the editor needs that, the batch, the custom-relation definer and the export, each with its lane description.
  edit: [],
};

// =============================================================================
// FILTER FUNCTION
// =============================================================================

interface Tool {
  name: string;
  description?: string;
  inputSchema: unknown;
}

const TOOL_NAME_TOKEN = /\bpinepaper_[a-z0-9_]+\b/g;

/**
 * The tool names a tool's definition mentions, as WHOLE names: `pinepaper_camera` is not a reference inside
 * `pinepaper_camera_director`. The one definition of "names", shared by the core closure and the test that holds
 * every profile to it.
 */
export function referencedToolNames(tool: Tool, known: ReadonlySet<string>): string[] {
  const out = new Set<string>();
  for (const m of JSON.stringify(tool).match(TOOL_NAME_TOKEN) ?? []) if (m !== tool.name && known.has(m)) out.add(m);
  return [...out];
}

/** Every tool reachable from `seed` by references, within `tools`. */
function closeOverReferences<T extends Tool>(tools: T[], seed: Iterable<string>): Set<string> {
  const byName = new Map(tools.map((t) => [t.name, t]));
  const known = new Set(byName.keys());
  const listed = new Set([...seed].filter((n) => known.has(n)));
  const queue = [...listed];
  while (queue.length) {
    const tool = byName.get(queue.pop()!)!;
    for (const ref of referencedToolNames(tool, known)) if (!listed.has(ref)) { listed.add(ref); queue.push(ref); }
  }
  return listed;
}

const closureCache = new WeakMap<object, Map<string, Set<string>>>();

/** The names a profile's tags (and any loaded groups or tools) put on the list, before the closure. */
function seedNames(profile: ToolkitProfile, load: readonly string[]): Set<string> {
  return loadedNames([...(TOOLKIT_PROFILES[profile] ?? []), ...(profile === 'core' ? CRAFT_TOOLS : []), ...load]);
}

/** The names `load` adds: each group's tools, or the tool itself. */
function loadedNames(load: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const n of load) (TOOL_TAGS[n] ?? [n]).forEach((x) => out.add(x));
  return out;
}

/** What `load` accepts: a tag group, or a tool's own name. Unknown entries come back to be refused by name. */
export function unknownLoadNames(load: readonly string[], allToolNames: ReadonlySet<string>): string[] {
  return load.filter((n) => !TOOL_TAGS[n] && !allToolNames.has(n));
}

/**
 * Filter tools based on a toolkit profile.
 * Returns only the tools whose names appear in the selected profile's tag groups.
 * The 'full' profile returns all tools unchanged (no filtering). The core profile, and any profile with groups or
 * tools loaded on top (pinepaper_set_toolkit {load}), is closed over references: a listed tool's named tools are
 * listed too. Cached per tools array, so a tools/list costs the closure once.
 */
export function getToolsForToolkit<T extends Tool>(tools: T[], profile: ToolkitProfile, load: readonly string[] = []): T[] {
  if (profile === 'full') {
    return tools;
  }

  if (profile === 'lane') {
    return applyLane(tools);
  }
  if (profile === 'edit') {
    return applyLane(tools, EDIT_TOOL_NAMES);
  }

  const tags = TOOLKIT_PROFILES[profile];
  if (!tags) {
    return tools; // Unknown profile = no filtering
  }

  if (profile === 'core' || load.length) {
    const key = `${profile}|${[...load].sort().join(',')}`;
    let byKey = closureCache.get(tools);
    if (!byKey) { byKey = new Map(); closureCache.set(tools, byKey); }
    let names = byKey.get(key);
    if (!names) {
      const seed = seedNames(profile, load);
      // A domain profile keeps its own narrowing; only what was loaded on top of it is closed over.
      names = profile === 'core'
        ? closeOverReferences(tools, seed)
        : new Set([...seedNames(profile, []), ...closeOverReferences(tools, loadedNames(load))]);
      byKey.set(key, names);
    }
    return tools.filter((tool) => names!.has(tool.name));
  }

  const allowed = new Set<string>();
  for (const tag of tags) {
    const toolNames = TOOL_TAGS[tag];
    if (toolNames) {
      for (const name of toolNames) {
        allowed.add(name);
      }
    }
  }

  return tools.filter(tool => allowed.has(tool.name));
}

export function detectToolkitFromEnvironment(): ToolkitProfile {
  const value = env('PINEPAPER_TOOLKIT');
  if (value && TOOLKIT_PROFILES_LIST.includes(value as ToolkitProfile)) {
    return value as ToolkitProfile;
  }
  return DEFAULT_TOOLKIT;
}

/** Returns true if PINEPAPER_TOOLKIT was explicitly set in the environment. */
export function isToolkitExplicitlySet(): boolean {
  const value = env('PINEPAPER_TOOLKIT');
  return !!value && TOOLKIT_PROFILES_LIST.includes(value as ToolkitProfile);
}

// =============================================================================
// VERBOSITY DETECTION
// =============================================================================

import type { ToolVerbosity } from './definitions.js';

const VALID_VERBOSITIES: ToolVerbosity[] = ['verbose', 'compact', 'minimal'];

/**
 * Detect tool description verbosity from environment.
 * Reads PINEPAPER_VERBOSITY first, falls back to PINEPAPER_TOOL_VERBOSITY for backward compat.
 * Returns 'compact' if not set or invalid.
 */
export function detectVerbosityFromEnvironment(): ToolVerbosity {
  const value = env('PINEPAPER_VERBOSITY') || env('PINEPAPER_TOOL_VERBOSITY');
  if (value && VALID_VERBOSITIES.includes(value as ToolVerbosity)) {
    return value as ToolVerbosity;
  }
  return 'compact';
}

/** Returns true if PINEPAPER_VERBOSITY or PINEPAPER_TOOL_VERBOSITY was explicitly set. */
export function isVerbosityExplicitlySet(): boolean {
  const value = env('PINEPAPER_VERBOSITY') || env('PINEPAPER_TOOL_VERBOSITY');
  return !!value && VALID_VERBOSITIES.includes(value as ToolVerbosity);
}

// =============================================================================
// CLIENT PROFILE AUTO-DETECTION
// =============================================================================

export interface ClientProfile {
  toolkit: ToolkitProfile;
  verbosity: ToolVerbosity;
}

/**
 * Known client profiles for auto-detection via MCP initialize handshake.
 * Applied only when env vars are NOT explicitly set.
 */
/**
 * A client that should START on another profile. Empty since 1.6.25: every client starts on core and loads what
 * it needs. It used to give Claude Desktop, Cursor and Windsurf `full` (178 tools, ~115k tokens of definitions
 * before the first message) and claude-ai `minimal`, which listed none of the craft tools the instructions name.
 * The client's name is logged at initialize either way, so an entry here can be made from a real connection.
 */
const CLIENT_PROFILES: Record<string, ClientProfile> = {};

/**
 * Get client profile by name. Exact match first, then prefix match, case-insensitive.
 * Returns null for unknown clients.
 */
export function getClientProfile(clientName: string): ClientProfile | null {
  const lower = clientName.toLowerCase();
  // Exact match
  if (CLIENT_PROFILES[lower]) return CLIENT_PROFILES[lower];
  // Prefix match
  for (const [key, profile] of Object.entries(CLIENT_PROFILES)) {
    if (lower.startsWith(key)) return profile;
  }
  return null;
}
