/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/content-recipes.ts (DesignStyle union only)
 * sha256:    de3358e9cc23a62d8ace2dcaebbd90a985d49ae1a3e7e5fa1d88321bf5fbac1d
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */

/** Every aesthetic style the generators speak. Sliced from the upstream union. */
export type DesignStyle =
  | "minimal"
  | "editorial"
  | "playful"
  | "cinematic"
  | "energetic"
  | "scrapbook"
  | "swiss_typographic"
  | "neumorphic_glass"
  | "risograph_print"
  | "cyberpunk_neon"
  | "bauhaus_geometric"
  | "art_deco_geometric"
  | "memphis_group"
  | "brutalist_raw"
  | "de_stijl_neoplasticism"
  | "pop_art_expression"
  | "vaporwave_retro"
  | "corporate_memphis"
  | "y2k_frutiger_aero"
  | "mid_century_upa"
  | "comic_benday"
  | "pixel_art_8bit"
  | "isometric_lowpoly"
  | "hand_drawn_sketch"
  | "claymorphism"
  | "constructivism_suprematism"
  | "art_nouveau"
  | "op_art_psychedelic"
  | "print_monochrome_crisp"
  | "print_early_learner"
  | "print_stem_technical"
  | "embroidery_tapestry"
  | "woven_textile"
  // #60: the design graph's looks that had no fast-path counterpart.
  | "explainer_ink"
  | "synthwave_outrun"
  | "sumi_e_ink"
  | "flat_design"
  | "blueprint_schematic"
  | "stick_figure"
  | "omni_flash_realism"
  | "hybrid_mixed_media";


/** The same 41 styles as DATA, so a runtime list cannot drift from the type. */
export const DESIGN_STYLES: readonly DesignStyle[] = Object.freeze([
  'minimal',
  'editorial',
  'playful',
  'cinematic',
  'energetic',
  'scrapbook',
  'swiss_typographic',
  'neumorphic_glass',
  'risograph_print',
  'cyberpunk_neon',
  'bauhaus_geometric',
  'art_deco_geometric',
  'memphis_group',
  'brutalist_raw',
  'de_stijl_neoplasticism',
  'pop_art_expression',
  'vaporwave_retro',
  'corporate_memphis',
  'y2k_frutiger_aero',
  'mid_century_upa',
  'comic_benday',
  'pixel_art_8bit',
  'isometric_lowpoly',
  'hand_drawn_sketch',
  'claymorphism',
  'constructivism_suprematism',
  'art_nouveau',
  'op_art_psychedelic',
  'print_monochrome_crisp',
  'print_early_learner',
  'print_stem_technical',
  'embroidery_tapestry',
  'woven_textile',
  'explainer_ink',
  'synthwave_outrun',
  'sumi_e_ink',
  'flat_design',
  'blueprint_schematic',
  'stick_figure',
  'omni_flash_realism',
  'hybrid_mixed_media',
]);
