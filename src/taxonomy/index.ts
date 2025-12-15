/**
 * Semantic Taxonomy System
 *
 * Provides multilingual semantic tool selection for the PinePaper MCP server.
 * This module exports all taxonomy-related functionality.
 *
 * @example
 * import { getIntentClassifier, getTaxonomyMatcher } from './taxonomy/index.js';
 *
 * const classifier = getIntentClassifier();
 * await classifier.initialize();
 *
 * // Classify user intent in any language
 * const analysis = await classifier.classify("faire tourner la lune autour de la terre");
 * console.log(analysis.recommendedTool); // { name: 'pinepaper_add_relation', params: {...} }
 */

// Type definitions
export type {
  TaxonomyNode,
  ModifierNode,
  TaxonomyCategory,
  MultilingualTerms,
  ToolMapping,
  ParameterExtractor,
  SchemaOrgReference,
  ClassificationResult,
  TaxonomyMatch,
  ExtractedEntity,
  IntentAnalysis,
  TaxonomyConfig,
  TaxonomyError,
  TaxonomyErrorCode,
} from './types.js';

export { DEFAULT_TAXONOMY_CONFIG } from './types.js';

// Registry exports
export {
  ANIMATION_TAXONOMY,
  MOTION_TAXONOMY,
  TRANSFORMATION_TAXONOMY,
  ITEM_TAXONOMY,
  BACKGROUND_TAXONOMY,
  MODIFIER_NODES,
  getTaxonomyNode,
  getNodesByCategory,
  getModifier,
} from './registry.js';

// Matcher exports
export {
  TaxonomyMatcher,
  getTaxonomyMatcher,
  resetTaxonomyMatcher,
} from './matcher.js';

// Classifier exports
export {
  IntentClassifier,
  getIntentClassifier,
  resetIntentClassifier,
} from './classifier.js';

// Error recovery exports
export type { ErrorRecoveryContext } from './error-recovery.js';
export {
  buildErrorRecovery,
  formatRichError,
  validateToolWithTaxonomy,
} from './error-recovery.js';
