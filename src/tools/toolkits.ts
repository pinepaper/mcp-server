/**
 * Toolkit Profiles — Workflow-based tool filtering
 *
 * Controls which tools are exposed via tools/list based on the PINEPAPER_TOOLKIT env var.
 * Reduces token usage for smaller-context models (e.g., Haiku) by only showing relevant tools.
 *
 * Profiles are composed from reusable tag groups (categories of tools).
 * Handler dispatch is NOT filtered — hidden tools still execute if called directly.
 */

export type ToolkitProfile = 'full' | 'agent' | 'diagram' | 'map' | 'font' | 'minimal';

export const TOOLKIT_PROFILES_LIST: ToolkitProfile[] = ['full', 'agent', 'diagram', 'map', 'font', 'minimal'];

// =============================================================================
// TAG GROUPS — each maps a category to its tool names
// =============================================================================

export const TOOL_TAGS: Record<string, string[]> = {
  // --- Core infrastructure (included in most profiles) ---
  agent: [
    'pinepaper_agent_start_job',
    'pinepaper_agent_end_job',
    'pinepaper_agent_reset',
    'pinepaper_agent_batch_execute',
    'pinepaper_agent_export',
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
    'pinepaper_get_canvas_presets',
  ],

  // --- Item creation & modification ---
  core: [
    'pinepaper_create_item',
    'pinepaper_modify_item',
    'pinepaper_delete_item',
    'pinepaper_create_glossy_sphere',
    'pinepaper_create_diagonal_stripes',
    'pinepaper_create_grid',
  ],
  import: [
    'pinepaper_import_svg',
    'pinepaper_import_image',
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
    'pinepaper_animate',
    'pinepaper_keyframe_animate',
    'pinepaper_play_timeline',
    'pinepaper_get_animatable_properties',
    'pinepaper_get_available_easings',
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
    'pinepaper_camera_zoom',
    'pinepaper_camera_pan',
    'pinepaper_camera_move_to',
    'pinepaper_camera_reset',
    'pinepaper_camera_stop',
    'pinepaper_camera_state',
  ],

  // --- Generators & effects ---
  generators: [
    'pinepaper_execute_generator',
    'pinepaper_list_generators',
  ],
  effects: [
    'pinepaper_apply_effect',
  ],
  filters: [
    'pinepaper_add_filter',
  ],

  // --- Compositions ---
  scene: [
    'pinepaper_create_scene',
  ],
  template: [
    'pinepaper_apply_template',
  ],

  // --- Query & export ---
  query: [
    'pinepaper_get_items',
    'pinepaper_get_relation_stats',
  ],
  export: [
    'pinepaper_export_svg',
    'pinepaper_export_training_data',
    'pinepaper_export_scene',
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
  ],

  // --- Domain: Maps ---
  map: [
    'pinepaper_load_map',
    'pinepaper_highlight_regions',
    'pinepaper_unhighlight_regions',
    'pinepaper_apply_data_colors',
    'pinepaper_add_marker',
    'pinepaper_add_map_labels',
    'pinepaper_pan_map',
    'pinepaper_zoom_map',
    'pinepaper_export_map',
    'pinepaper_import_custom_map',
    'pinepaper_get_region_at_point',
    'pinepaper_animate_map_regions',
    'pinepaper_animate_map_wave',
    'pinepaper_stop_map_animations',
    'pinepaper_get_animated_map_regions',
    'pinepaper_export_map_region_csv',
    'pinepaper_import_map_region_csv',
    'pinepaper_select_map_regions',
    'pinepaper_deselect_map_regions',
    'pinepaper_get_highlighted_map_regions',
    'pinepaper_export_map_geojson',
    'pinepaper_export_original_map_geojson',
    'pinepaper_get_map_source_info',
  ],

  // --- Domain: Fonts ---
  font: [
    'pinepaper_font_show_studio',
    'pinepaper_font_set_name',
    'pinepaper_font_get_required_chars',
    'pinepaper_font_get_status',
    'pinepaper_font_create_glyph',
    'pinepaper_font_create_space',
    'pinepaper_font_remove_glyph',
    'pinepaper_font_set_metrics',
    'pinepaper_font_export',
    'pinepaper_font_load_into_document',
    'pinepaper_font_export_data',
    'pinepaper_font_import_data',
    'pinepaper_font_clear',
    'pinepaper_font_remove_overlap',
    'pinepaper_font_correct_direction',
    'pinepaper_font_cleanup_path',
  ],

  // --- Domain: Letter Collage ---
  letter_collage: [
    'pinepaper_create_letter_collage',
    'pinepaper_animate_letter_collage',
    'pinepaper_get_letter_collage_options',
  ],

  // --- Domain: Interactive ---
  triggers: [
    'pinepaper_add_trigger',
    'pinepaper_remove_trigger',
    'pinepaper_query_triggers',
  ],
  quiz: [
    'pinepaper_create_quiz',
    'pinepaper_get_quiz_state',
    'pinepaper_reset_quiz',
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

  // --- On-demand guide & runtime config (included in ALL profiles) ---
  guide: [
    'pinepaper_tool_guide',
    'pinepaper_set_toolkit',
  ],
};

// =============================================================================
// PROFILES — each is a list of tag names to include
// =============================================================================

export const TOOLKIT_PROFILES: Record<ToolkitProfile, string[]> = {
  full: [], // Empty = no filtering, return all tools

  agent: [
    'agent', 'browser', 'canvas',
    'core', 'import', 'assets', 'batch',
    'relations', 'animation', 'masks',
    'generators', 'effects',
    'scene',
    'query', 'export',
    'p5', 'guide',
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
};

// =============================================================================
// FILTER FUNCTION
// =============================================================================

interface Tool {
  name: string;
  description?: string;
  inputSchema: unknown;
}

/**
 * Filter tools based on a toolkit profile.
 * Returns only the tools whose names appear in the selected profile's tag groups.
 * The 'full' profile returns all tools unchanged (no filtering).
 */
export function getToolsForToolkit<T extends Tool>(tools: T[], profile: ToolkitProfile): T[] {
  if (profile === 'full') {
    return tools;
  }

  const tags = TOOLKIT_PROFILES[profile];
  if (!tags) {
    return tools; // Unknown profile = no filtering
  }

  // Build set of allowed tool names from all tags in this profile
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

/**
 * Detect toolkit profile from PINEPAPER_TOOLKIT environment variable.
 * Returns 'agent' if not set or invalid.
 */
export function detectToolkitFromEnvironment(): ToolkitProfile {
  const value = process.env.PINEPAPER_TOOLKIT;
  if (value && TOOLKIT_PROFILES_LIST.includes(value as ToolkitProfile)) {
    return value as ToolkitProfile;
  }
  return 'agent';
}

/** Returns true if PINEPAPER_TOOLKIT was explicitly set in the environment. */
export function isToolkitExplicitlySet(): boolean {
  const value = process.env.PINEPAPER_TOOLKIT;
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
  const value = process.env.PINEPAPER_VERBOSITY || process.env.PINEPAPER_TOOL_VERBOSITY;
  if (value && VALID_VERBOSITIES.includes(value as ToolVerbosity)) {
    return value as ToolVerbosity;
  }
  return 'compact';
}

/** Returns true if PINEPAPER_VERBOSITY or PINEPAPER_TOOL_VERBOSITY was explicitly set. */
export function isVerbosityExplicitlySet(): boolean {
  const value = process.env.PINEPAPER_VERBOSITY || process.env.PINEPAPER_TOOL_VERBOSITY;
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
const CLIENT_PROFILES: Record<string, ClientProfile> = {
  'claude-ai': { toolkit: 'minimal', verbosity: 'compact' },
  'claude-desktop': { toolkit: 'full', verbosity: 'compact' },
  'claude-code': { toolkit: 'agent', verbosity: 'compact' },
  cursor: { toolkit: 'full', verbosity: 'compact' },
  windsurf: { toolkit: 'full', verbosity: 'compact' },
};

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
