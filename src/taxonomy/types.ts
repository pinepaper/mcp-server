/**
 * Semantic Taxonomy Types
 *
 * Defines the type system for multilingual semantic tool selection.
 * This enables understanding user intent across 41+ languages without
 * relying on fragile keyword matching.
 */

import type { SupportedLocale } from '../i18n/types.js';

/**
 * Maps concept terms to supported locales
 * Each concept has terms in multiple languages that semantically map to it
 */
export type MultilingualTerms = Partial<Record<SupportedLocale, string[]>>;

/**
 * Categories for organizing taxonomy concepts
 */
export type TaxonomyCategory =
  | 'motion'           // Movement-related concepts
  | 'transformation'   // Scale, rotation, visibility changes
  | 'timing'           // Duration, looping, sequencing modifiers
  | 'item'             // Shape and object creation
  | 'background'       // Canvas backgrounds and generators
  | 'effect'           // Visual effects
  | 'relation'         // Item-to-item relationships
  | 'query'            // Information retrieval
  | 'export'           // Export operations
  | 'browser';         // Browser control

/**
 * Defines how a taxonomy concept maps to an MCP tool
 */
export interface ToolMapping {
  /** The MCP tool name to invoke */
  tool: string;
  /** Default parameters to apply */
  defaultParams?: Record<string, unknown>;
  /** Parameter extractors for parsing values from user input */
  parameterExtractors?: ParameterExtractor[];
}

/**
 * Extracts parameter values from user input using locale-specific patterns
 */
export interface ParameterExtractor {
  /** The parameter name to extract */
  param: string;
  /** Regex patterns per locale (* matches numbers) */
  patterns: Partial<Record<SupportedLocale, RegExp[]>>;
  /** Transform the matched value */
  transform?: (match: string) => unknown;
}

/**
 * Schema.org reference for semantic web compatibility
 * @see https://schema.org/
 */
export interface SchemaOrgReference {
  /** The Schema.org type (e.g., "Action", "Thing", "CreativeWork") */
  '@type': string;
  /** Canonical URL to the schema.org definition */
  '@id': string;
  /** Additional schema.org properties */
  properties?: Record<string, string>;
  /** Related schema.org concepts */
  sameAs?: string[];
}

/**
 * A node in the semantic taxonomy tree
 */
export interface TaxonomyNode {
  /** Unique identifier for this concept */
  id: string;
  /** Parent concept ID (for hierarchy) */
  parent?: string;
  /** Category this concept belongs to */
  category: TaxonomyCategory;
  /** Tool mapping for this concept */
  tool: ToolMapping;
  /** Terms in multiple languages that map to this concept */
  terms: MultilingualTerms;
  /** Schema.org reference for semantic web compatibility */
  schema?: SchemaOrgReference;
  /** Pre-computed embedding vector (optional, for semantic search) */
  embedding?: number[];
  /** Modifiers that can be combined with this concept */
  modifiers?: string[];
  /** Priority weight for disambiguation (higher = preferred) */
  priority?: number;
  /** Aliases - other concept IDs that are equivalent */
  aliases?: string[];
}

/**
 * A modifier node that adjusts how a concept is interpreted
 * Modifiers don't map to tools directly but change tool parameters
 */
export interface ModifierNode {
  /** Unique identifier for this modifier */
  id: string;
  /** Category: timing modifiers affect animation parameters */
  category: 'timing' | 'style' | 'behavior';
  /** The parameter modifications to apply */
  modifications: Record<string, unknown>;
  /** Terms that trigger this modifier */
  terms: MultilingualTerms;
}

/**
 * Result of classifying user intent
 */
export interface ClassificationResult {
  /** How the classification was determined */
  method: 'keyword' | 'semantic' | 'pattern' | 'unknown';
  /** Confidence score (0-1) */
  confidence: number;
  /** The matched taxonomy node (if found) */
  node?: TaxonomyNode;
  /** Detected modifiers */
  modifiers?: ModifierNode[];
  /** Extracted parameter values */
  extractedParams?: Record<string, unknown>;
  /** Suggested alternatives if unknown */
  suggestions?: string[];
  /** The detected language */
  detectedLocale?: SupportedLocale;
}

/**
 * A match result from the taxonomy lookup
 */
export interface TaxonomyMatch {
  /** The matched node ID */
  nodeId: string;
  /** Similarity score (0-1) */
  similarity: number;
  /** The full taxonomy node */
  node: TaxonomyNode;
  /** Which term matched */
  matchedTerm?: string;
  /** Which locale the match was in */
  matchedLocale?: SupportedLocale;
}

/**
 * Entity extracted from user input
 */
export interface ExtractedEntity {
  /** Type of entity */
  type: 'item' | 'color' | 'number' | 'position' | 'name';
  /** The raw value */
  value: string;
  /** Parsed/normalized value */
  normalized?: unknown;
  /** Position in the original text */
  position?: { start: number; end: number };
}

/**
 * Complete analysis of user intent
 */
export interface IntentAnalysis {
  /** Primary classification result */
  classification: ClassificationResult;
  /** Extracted entities (items, colors, numbers, etc.) */
  entities: ExtractedEntity[];
  /** The recommended tool call */
  recommendedTool?: {
    name: string;
    params: Record<string, unknown>;
  };
  /** Alternative interpretations ranked by confidence */
  alternatives?: ClassificationResult[];
  /** Whether this requires clarification */
  needsClarification?: boolean;
  /** Clarification question if needed */
  clarificationPrompt?: string;
}

/**
 * Configuration for the taxonomy system
 */
export interface TaxonomyConfig {
  /** Minimum confidence threshold for matches */
  minConfidence: number;
  /** Whether to use semantic embeddings (requires model) */
  useSemanticSearch: boolean;
  /** Maximum number of suggestions to return */
  maxSuggestions: number;
  /** Default locale for fallback */
  defaultLocale: SupportedLocale;
  /** Enable debug logging */
  debug: boolean;
}

/**
 * Default taxonomy configuration
 */
export const DEFAULT_TAXONOMY_CONFIG: TaxonomyConfig = {
  minConfidence: 0.6,
  useSemanticSearch: false, // Start with keyword matching, upgrade later
  maxSuggestions: 3,
  defaultLocale: 'en',
  debug: false,
};

/**
 * Error codes specific to taxonomy operations
 */
export enum TaxonomyErrorCode {
  NO_MATCH = 'TAXONOMY_NO_MATCH',
  LOW_CONFIDENCE = 'TAXONOMY_LOW_CONFIDENCE',
  AMBIGUOUS = 'TAXONOMY_AMBIGUOUS',
  MISSING_PARAM = 'TAXONOMY_MISSING_PARAM',
  INVALID_LOCALE = 'TAXONOMY_INVALID_LOCALE',
}

/**
 * Rich error with recovery hints
 */
export interface TaxonomyError {
  code: TaxonomyErrorCode;
  message: string;
  /** Suggestions for recovery */
  suggestions?: string[];
  /** Available items if relevant */
  availableItems?: string[];
  /** Similar concepts that might match */
  similarConcepts?: TaxonomyMatch[];
  /** Hint for the user/AI */
  hint?: string;
}
