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
    'pinepaper_camera',
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
    'pinepaper_manage_scenes',
    'pinepaper_scene_playback',
  ],
  selection: [
    'pinepaper_selection',
  ],
  transform: [
    'pinepaper_transform',
  ],
  history: [
    'pinepaper_history',
  ],
  image_processing: [
    'pinepaper_image_filter',
    'pinepaper_lasso',
    'pinepaper_cutout_style',
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
  ],
  magic: [
    'pinepaper_magic',
  ],
  physics: [
    'pinepaper_physics',
  ],
  measurement: [
    'pinepaper_measurement',
  ],
  template: [
    'pinepaper_apply_template',
  ],

  // --- Query & export ---
  query: [
    'pinepaper_get_items',
    'pinepaper_get_relation_stats',
    'pinepaper_query',
  ],
  export: [
    'pinepaper_export_svg',
    'pinepaper_export_training_data',
    'pinepaper_export_scene',
    'pinepaper_export_widget',
    'pinepaper_export_widget_html',
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
  ],

  // --- Domain: Fonts ---
  font: [
    'pinepaper_font',
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
    'pinepaper_query_ontology',
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
    'selection', 'transform', 'history',
    'image_processing', 'precomp',
    'deform', 'sprite', 'interaction',
    'dataviz', 'magic', 'physics', 'measurement',
    'query', 'export',
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
