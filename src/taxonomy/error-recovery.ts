/**
 * Rich Error Recovery with Taxonomy Suggestions
 *
 * Provides intelligent error messages with suggestions based on
 * the semantic taxonomy. Helps users and AI understand how to
 * fix mistakes and find the right tools.
 */

import type { SupportedLocale } from '../i18n/types.js';
import type { TaxonomyError, TaxonomyErrorCode, TaxonomyMatch } from './types.js';
import { getTaxonomyMatcher } from './matcher.js';
import { ANIMATION_TAXONOMY, getTaxonomyNode } from './registry.js';

/**
 * Error recovery context with rich suggestions
 */
export interface ErrorRecoveryContext {
  /** The original error */
  error: string;
  /** Error code for programmatic handling */
  code: TaxonomyErrorCode | string;
  /** Human-readable hint */
  hint?: string;
  /** Suggested alternative tools or actions */
  suggestions?: string[];
  /** Available items that might be relevant */
  availableItems?: Array<{ id: string; type: string }>;
  /** Similar concepts from taxonomy */
  similarConcepts?: TaxonomyMatch[];
  /** Did you mean this item? */
  didYouMean?: string;
  /** Example of correct usage */
  example?: string;
}

/**
 * Build rich error recovery context for common errors
 */
export function buildErrorRecovery(
  errorType: string,
  context: {
    failedId?: string;
    availableItems?: Array<{ id: string; type: string }>;
    userInput?: string;
    toolName?: string;
    locale?: SupportedLocale;
  },
): ErrorRecoveryContext {
  const { failedId, availableItems = [], userInput, toolName, locale } = context;

  switch (errorType) {
    case 'ITEM_NOT_FOUND': {
      const similar = findSimilarItemId(failedId || '', availableItems);
      return {
        error: `Item "${failedId}" not found`,
        code: 'ITEM_NOT_FOUND',
        hint: similar
          ? `Did you mean "${similar}"?`
          : 'Use pinepaper_get_items to list all available items',
        suggestions: ['pinepaper_get_items'],
        availableItems: availableItems.slice(0, 5),
        didYouMean: similar,
        example: `pinepaper_modify_item({ itemId: "${similar || 'item_1'}", properties: {...} })`,
      };
    }

    case 'INVALID_RELATION': {
      return {
        error: 'Invalid relation type or missing target',
        code: 'INVALID_RELATION',
        hint: 'Relations require both sourceId and targetId to exist',
        suggestions: ['pinepaper_get_items', 'pinepaper_query_relations'],
        availableItems: availableItems.slice(0, 5),
        example: `pinepaper_add_relation({ sourceId: "item_1", targetId: "item_2", relationType: "orbits" })`,
      };
    }

    case 'GENERATOR_NOT_FOUND': {
      const generators = [
        'drawSunburst',
        'drawWaves',
        'drawGrid',
        'drawCircuit',
        'drawSunsetScene',
        'drawStackedCircles',
        'drawPattern',
      ];
      return {
        error: 'Generator not found',
        code: 'GENERATOR_NOT_FOUND',
        hint: 'Available generators: ' + generators.join(', '),
        suggestions: ['pinepaper_list_generators'],
        example: `pinepaper_execute_generator({ generatorName: "drawSunburst" })`,
      };
    }

    case 'TOOL_MISMATCH': {
      // Use taxonomy to suggest better tool
      const taxonomyMatcher = getTaxonomyMatcher();
      let similarConcepts: TaxonomyMatch[] = [];

      if (userInput) {
        // This is synchronous lookup from already-built index
        taxonomyMatcher.findMatches(userInput, locale).then((matches) => {
          similarConcepts = matches.slice(0, 3);
        });
      }

      return {
        error: `Tool "${toolName}" may not be the best choice for this request`,
        code: 'TOOL_MISMATCH',
        hint: similarConcepts.length > 0
          ? `Consider using "${similarConcepts[0]?.node.tool.tool}" instead`
          : 'Use pinepaper_recommend_approach for tool suggestions',
        suggestions: similarConcepts.map((m) => m.node.tool.tool),
        similarConcepts,
      };
    }

    case 'VALIDATION_ERROR': {
      return {
        error: 'Invalid parameters provided',
        code: 'VALIDATION_ERROR',
        hint: 'Check the tool documentation for required and optional parameters',
        suggestions: ['Check tool inputSchema for required fields'],
        example: getToolExample(toolName || ''),
      };
    }

    default:
      return {
        error: errorType,
        code: 'UNKNOWN_ERROR',
        hint: 'Check the MCP server logs for more details',
        suggestions: ['pinepaper_get_items', 'pinepaper_browser_status'],
      };
  }
}

/**
 * Find a similar item ID using Levenshtein distance
 */
function findSimilarItemId(
  failedId: string,
  availableItems: Array<{ id: string; type: string }>,
): string | undefined {
  if (!failedId || availableItems.length === 0) return undefined;

  let bestMatch: string | undefined;
  let bestDistance = Infinity;

  for (const item of availableItems) {
    const distance = levenshteinDistance(failedId.toLowerCase(), item.id.toLowerCase());
    if (distance < bestDistance && distance <= 3) {
      // Allow up to 3 edits
      bestDistance = distance;
      bestMatch = item.id;
    }
  }

  return bestMatch;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1,
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Get an example usage for a tool
 */
function getToolExample(toolName: string): string {
  const examples: Record<string, string> = {
    pinepaper_create_item: `pinepaper_create_item({ itemType: "circle", position: {x: 400, y: 300}, properties: {radius: 50, color: "#3b82f6"} })`,
    pinepaper_modify_item: `pinepaper_modify_item({ itemId: "item_1", properties: {color: "#ef4444"} })`,
    pinepaper_delete_item: `pinepaper_delete_item({ itemId: "item_1" })`,
    pinepaper_add_relation: `pinepaper_add_relation({ sourceId: "item_1", targetId: "item_2", relationType: "orbits", params: {radius: 100, speed: 0.5} })`,
    pinepaper_animate: `pinepaper_animate({ itemId: "item_1", animationType: "pulse", speed: 0.5 })`,
    pinepaper_execute_generator: `pinepaper_execute_generator({ generatorName: "drawSunburst" })`,
    pinepaper_create_scene: `pinepaper_create_scene({ items: [{name: "sun", itemType: "circle", properties: {radius: 50, color: "#fbbf24"}}], animations: [{target: "sun", type: "pulse"}] })`,
  };

  return examples[toolName] || `${toolName}({ /* see tool definition */ })`;
}

/**
 * Format error context for MCP response
 */
export function formatRichError(context: ErrorRecoveryContext): string {
  const parts: string[] = [];

  parts.push(`Error: ${context.error}`);

  if (context.hint) {
    parts.push(`Hint: ${context.hint}`);
  }

  if (context.didYouMean) {
    parts.push(`Did you mean: "${context.didYouMean}"`);
  }

  if (context.availableItems && context.availableItems.length > 0) {
    const itemList = context.availableItems.map((i) => `${i.id} (${i.type})`).join(', ');
    parts.push(`Available items: ${itemList}`);
  }

  if (context.suggestions && context.suggestions.length > 0) {
    parts.push(`Suggestions: ${context.suggestions.join(', ')}`);
  }

  if (context.example) {
    parts.push(`Example: ${context.example}`);
  }

  return parts.join('\n');
}

/**
 * Build taxonomy-aware error for tool validation
 */
export async function validateToolWithTaxonomy(
  toolName: string,
  userInput: string,
  locale?: SupportedLocale,
): Promise<ErrorRecoveryContext | null> {
  const matcher = getTaxonomyMatcher();
  await matcher.initialize();

  const matches = await matcher.findMatches(userInput, locale);

  if (matches.length === 0) {
    return null; // Can't validate without matches
  }

  const topMatch = matches[0];

  // Check if the selected tool matches the taxonomy recommendation
  if (topMatch.node.tool.tool !== toolName && topMatch.similarity > 0.8) {
    return {
      error: `Tool "${toolName}" may not be optimal for this request`,
      code: 'TOOL_MISMATCH',
      hint: `The taxonomy suggests "${topMatch.node.tool.tool}" based on "${topMatch.matchedTerm}"`,
      suggestions: [topMatch.node.tool.tool],
      similarConcepts: matches.slice(0, 3),
      example: getToolExample(topMatch.node.tool.tool),
    };
  }

  return null;
}
