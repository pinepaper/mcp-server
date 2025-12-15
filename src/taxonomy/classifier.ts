/**
 * Intent Classifier
 *
 * High-level classifier that combines taxonomy matching, modifier detection,
 * entity extraction, and parameter inference to understand user intent
 * and recommend the best MCP tool.
 */

import type { SupportedLocale } from '../i18n/types.js';
import type {
  ClassificationResult,
  IntentAnalysis,
  ExtractedEntity,
  TaxonomyNode,
  ModifierNode,
  TaxonomyError,
  TaxonomyErrorCode,
  TaxonomyConfig,
} from './types.js';
import { TaxonomyMatcher, getTaxonomyMatcher } from './matcher.js';
import { ANIMATION_TAXONOMY, MODIFIER_NODES, getTaxonomyNode } from './registry.js';

/**
 * Color name to hex mapping for common colors
 */
const COLOR_MAP: Record<string, string> = {
  // Basic colors
  red: '#ff0000',
  green: '#00ff00',
  blue: '#0000ff',
  yellow: '#ffff00',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  white: '#ffffff',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
  brown: '#a52a2a',
  cyan: '#00ffff',
  magenta: '#ff00ff',

  // Extended colors
  gold: '#ffd700',
  silver: '#c0c0c0',
  navy: '#000080',
  teal: '#008080',
  maroon: '#800000',
  olive: '#808000',
  lime: '#00ff00',
  aqua: '#00ffff',
  coral: '#ff7f50',
  salmon: '#fa8072',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  indigo: '#4b0082',
  crimson: '#dc143c',
  beige: '#f5f5dc',
  ivory: '#fffff0',
  lavender: '#e6e6fa',

  // Multilingual color names
  rojo: '#ff0000',
  verde: '#00ff00',
  azul: '#0000ff',
  amarillo: '#ffff00',
  naranja: '#ffa500',
  morado: '#800080',
  blanco: '#ffffff',
  negro: '#000000',
  rouge: '#ff0000',
  vert: '#00ff00',
  bleu: '#0000ff',
  jaune: '#ffff00',
  blanc: '#ffffff',
  noir: '#000000',
  rot: '#ff0000',
  grün: '#00ff00',
  blau: '#0000ff',
  gelb: '#ffff00',
  weiss: '#ffffff',
  schwarz: '#000000',
};

/**
 * Patterns for extracting entities from user input
 */
const ENTITY_PATTERNS = {
  // Hex color (#fff, #ffffff)
  hexColor: /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g,

  // RGB/RGBA
  rgbColor: /rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/gi,

  // Numbers with optional units
  number: /\b(\d+(?:\.\d+)?)\s*(px|%|deg|s|ms|seconds?)?\b/gi,

  // Position keywords
  position:
    /\b(center|top|bottom|left|right|top-left|top-right|bottom-left|bottom-right|middle)\b/gi,

  // Named items (quoted strings or specific patterns)
  quotedString: /"([^"]+)"|'([^']+)'/g,
};

/**
 * Intent Classifier
 *
 * Analyzes user input to determine intent and recommend appropriate MCP tools.
 */
export class IntentClassifier {
  private matcher: TaxonomyMatcher;
  private config: TaxonomyConfig;
  private initialized = false;

  constructor(config?: Partial<TaxonomyConfig>) {
    this.config = {
      minConfidence: 0.6,
      useSemanticSearch: false,
      maxSuggestions: 3,
      defaultLocale: 'en',
      debug: false,
      ...config,
    };
    this.matcher = getTaxonomyMatcher(config);
  }

  /**
   * Initialize the classifier
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.matcher.initialize();
    this.initialized = true;
  }

  /**
   * Classify user input and recommend tool
   */
  async classify(input: string, providedLocale?: SupportedLocale): Promise<IntentAnalysis> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 1. Detect language
    const detectedLocale = providedLocale || this.matcher.detectLocale(input);

    // 2. Find taxonomy matches
    const matches = await this.matcher.findMatches(input, detectedLocale);

    // 3. Detect modifiers
    const modifierMatches = this.matcher.detectModifiers(input, detectedLocale);
    const activeModifiers = modifierMatches.map((m) => m.modifier);

    // 4. Extract entities
    const entities = this.extractEntities(input);

    // 5. Build classification result
    let classification: ClassificationResult;

    if (matches.length === 0) {
      classification = {
        method: 'unknown',
        confidence: 0,
        suggestions: this.getSuggestions(input),
        detectedLocale,
      };
    } else {
      const bestMatch = matches[0];
      classification = {
        method: bestMatch.similarity > 0.85 ? 'keyword' : 'pattern',
        confidence: bestMatch.similarity,
        node: bestMatch.node,
        modifiers: activeModifiers,
        extractedParams: this.matcher.extractParameters(input, bestMatch.node, detectedLocale),
        detectedLocale,
      };
    }

    // 6. Build recommended tool call
    let recommendedTool: IntentAnalysis['recommendedTool'];

    if (classification.node) {
      const params = this.buildToolParams(classification.node, classification, entities, activeModifiers);

      recommendedTool = {
        name: classification.node.tool.tool,
        params,
      };
    }

    // 7. Check if clarification is needed
    const needsClarification = this.needsClarification(classification, matches);

    // 8. Build alternatives
    const alternatives =
      matches.length > 1
        ? matches.slice(1).map((m) => ({
            method: 'pattern' as const,
            confidence: m.similarity,
            node: m.node,
            detectedLocale,
          }))
        : undefined;

    return {
      classification,
      entities,
      recommendedTool,
      alternatives,
      needsClarification,
      clarificationPrompt: needsClarification ? this.buildClarificationPrompt(matches, input) : undefined,
    };
  }

  /**
   * Extract entities from user input
   */
  private extractEntities(input: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Extract hex colors
    const hexMatches = input.matchAll(ENTITY_PATTERNS.hexColor);
    for (const match of hexMatches) {
      entities.push({
        type: 'color',
        value: match[0],
        normalized: match[0].toLowerCase(),
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }

    // Extract RGB colors
    const rgbMatches = input.matchAll(ENTITY_PATTERNS.rgbColor);
    for (const match of rgbMatches) {
      const r = parseInt(match[1], 10);
      const g = parseInt(match[2], 10);
      const b = parseInt(match[3], 10);
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      entities.push({
        type: 'color',
        value: match[0],
        normalized: hex,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }

    // Extract named colors
    const lowerInput = input.toLowerCase();
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
      const index = lowerInput.indexOf(name);
      if (index !== -1) {
        // Check it's a word boundary
        const before = index > 0 ? lowerInput[index - 1] : ' ';
        const after = lowerInput[index + name.length] || ' ';
        if (/\s|^/.test(before) && /\s|$|[.,!?;:]/.test(after)) {
          entities.push({
            type: 'color',
            value: name,
            normalized: hex,
            position: { start: index, end: index + name.length },
          });
        }
      }
    }

    // Extract numbers
    const numberMatches = input.matchAll(ENTITY_PATTERNS.number);
    for (const match of numberMatches) {
      const value = parseFloat(match[1]);
      const unit = match[2]?.toLowerCase();

      entities.push({
        type: 'number',
        value: match[0],
        normalized: { value, unit },
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }

    // Extract positions
    const positionMatches = input.matchAll(ENTITY_PATTERNS.position);
    for (const match of positionMatches) {
      entities.push({
        type: 'position',
        value: match[0],
        normalized: match[0].toLowerCase(),
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }

    // Extract quoted strings (names, labels)
    const quotedMatches = input.matchAll(ENTITY_PATTERNS.quotedString);
    for (const match of quotedMatches) {
      const content = match[1] || match[2];
      entities.push({
        type: 'name',
        value: content,
        normalized: content,
        position: { start: match.index!, end: match.index! + match[0].length },
      });
    }

    return entities;
  }

  /**
   * Build tool parameters from classification and entities
   */
  private buildToolParams(
    node: TaxonomyNode,
    classification: ClassificationResult,
    entities: ExtractedEntity[],
    modifiers: ModifierNode[],
  ): Record<string, unknown> {
    const params: Record<string, unknown> = {
      ...node.tool.defaultParams,
      ...classification.extractedParams,
    };

    // Apply modifier modifications
    for (const modifier of modifiers) {
      Object.assign(params, modifier.modifications);
    }

    // Apply entities
    const colorEntity = entities.find((e) => e.type === 'color');
    if (colorEntity && !params.fillColor) {
      params.fillColor = colorEntity.normalized;
    }

    // Apply position if found
    const positionEntity = entities.find((e) => e.type === 'position');
    if (positionEntity && !params.position) {
      params.position = this.positionKeywordToCoordinates(positionEntity.normalized as string);
    }

    // Apply size/radius from numbers
    const numberEntities = entities.filter((e) => e.type === 'number');
    for (const numEntity of numberEntities) {
      const { value, unit } = numEntity.normalized as { value: number; unit?: string };

      if (unit === 'px' || unit === undefined) {
        // Could be radius or size
        if (!params.radius && node.id.includes('circle')) {
          params.radius = value;
        } else if (!params.size) {
          params.size = value;
        }
      } else if (unit === 's' || unit === 'seconds') {
        params.duration = value;
      } else if (unit === 'deg') {
        params.angle = value;
      }
    }

    // Apply name/content from quoted strings
    const nameEntity = entities.find((e) => e.type === 'name');
    if (nameEntity && node.id === 'create_text') {
      params.content = nameEntity.normalized;
    }

    return params;
  }

  /**
   * Convert position keyword to coordinates
   */
  private positionKeywordToCoordinates(keyword: string): { x: number; y: number } {
    // Default canvas size assumptions (can be made configurable)
    const width = 1920;
    const height = 1080;

    const positions: Record<string, { x: number; y: number }> = {
      center: { x: width / 2, y: height / 2 },
      middle: { x: width / 2, y: height / 2 },
      top: { x: width / 2, y: 100 },
      bottom: { x: width / 2, y: height - 100 },
      left: { x: 100, y: height / 2 },
      right: { x: width - 100, y: height / 2 },
      'top-left': { x: 100, y: 100 },
      'top-right': { x: width - 100, y: 100 },
      'bottom-left': { x: 100, y: height - 100 },
      'bottom-right': { x: width - 100, y: height - 100 },
    };

    return positions[keyword] || positions.center;
  }

  /**
   * Check if clarification is needed
   */
  private needsClarification(classification: ClassificationResult, matches: any[]): boolean {
    // Unknown classification
    if (classification.method === 'unknown') {
      return true;
    }

    // Low confidence
    if (classification.confidence < this.config.minConfidence) {
      return true;
    }

    // Multiple high-confidence matches (ambiguous)
    if (matches.length >= 2) {
      const secondBest = matches[1];
      if (secondBest.similarity > 0.7 && classification.confidence - secondBest.similarity < 0.1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Build clarification prompt
   */
  private buildClarificationPrompt(matches: any[], input: string): string {
    if (matches.length === 0) {
      return `I couldn't understand what you want to do with "${input}". Could you rephrase or be more specific?`;
    }

    if (matches.length === 1 && matches[0].similarity < this.config.minConfidence) {
      return `Did you mean "${matches[0].node.id.replace(/_/g, ' ')}"? (Confidence: ${Math.round(matches[0].similarity * 100)}%)`;
    }

    // Multiple ambiguous matches
    const options = matches
      .slice(0, 3)
      .map((m, i) => `${i + 1}. ${m.node.id.replace(/_/g, ' ')} (${Math.round(m.similarity * 100)}%)`)
      .join('\n');

    return `I found multiple possible interpretations:\n${options}\n\nWhich one did you mean?`;
  }

  /**
   * Get suggestions when no match is found
   */
  private getSuggestions(input: string): string[] {
    // Return common concepts as suggestions
    const commonConcepts = [
      'create_circle',
      'create_rectangle',
      'create_text',
      'rotation',
      'orbital_motion',
      'pulse',
      'fade',
    ];

    return commonConcepts.slice(0, this.config.maxSuggestions);
  }

  /**
   * Validate a tool selection against the taxonomy
   */
  async validateToolSelection(toolName: string, userInput: string): Promise<TaxonomyError | null> {
    // Find taxonomy node for this tool
    const matchingNode = ANIMATION_TAXONOMY.find((n) => n.tool.tool === toolName);

    if (!matchingNode) {
      // Tool not in taxonomy, can't validate
      return null;
    }

    // Check if user input aligns with this tool's concept
    const matches = await this.matcher.findMatches(userInput);
    const topMatch = matches[0];

    if (!topMatch) {
      return null; // Can't determine mismatch
    }

    if (topMatch.node.tool.tool !== toolName && topMatch.similarity > 0.8) {
      return {
        code: 'TAXONOMY_AMBIGUOUS' as TaxonomyErrorCode,
        message: `Tool "${toolName}" may not be the best choice for this request`,
        suggestions: [topMatch.node.tool.tool],
        hint: `Consider using "${topMatch.node.tool.tool}" instead (matched "${topMatch.matchedTerm}" with ${Math.round(topMatch.similarity * 100)}% confidence)`,
      };
    }

    return null;
  }

  /**
   * Get tool recommendation with rich context
   */
  async getRecommendation(input: string, locale?: SupportedLocale): Promise<{
    tool: string;
    params: Record<string, unknown>;
    confidence: number;
    explanation: string;
  } | null> {
    const analysis = await this.classify(input, locale);

    if (!analysis.recommendedTool) {
      return null;
    }

    const explanation = analysis.classification.node
      ? `Matched "${analysis.classification.node.id}" via ${analysis.classification.method} ` +
        `(${Math.round(analysis.classification.confidence * 100)}% confidence)`
      : 'No specific match found';

    return {
      tool: analysis.recommendedTool.name,
      params: analysis.recommendedTool.params,
      confidence: analysis.classification.confidence,
      explanation,
    };
  }
}

// Singleton instance
let classifierInstance: IntentClassifier | null = null;

/**
 * Get or create the singleton IntentClassifier instance
 */
export function getIntentClassifier(config?: Partial<TaxonomyConfig>): IntentClassifier {
  if (!classifierInstance) {
    classifierInstance = new IntentClassifier(config);
  }
  return classifierInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetIntentClassifier(): void {
  classifierInstance = null;
}
