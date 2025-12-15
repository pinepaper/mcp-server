/**
 * Semantic Taxonomy Matcher
 *
 * Provides fast keyword-based matching with fallback to pattern matching.
 * Uses a hybrid approach: keyword index for exact matches, pattern matching
 * for fuzzy matches, and can be extended with embeddings for semantic search.
 */

import type { SupportedLocale } from '../i18n/types.js';
import type {
  TaxonomyNode,
  ModifierNode,
  TaxonomyMatch,
  TaxonomyConfig,
  DEFAULT_TAXONOMY_CONFIG,
} from './types.js';
import { ANIMATION_TAXONOMY, MODIFIER_NODES } from './registry.js';

/**
 * Index entry for fast keyword lookup
 */
interface KeywordIndexEntry {
  term: string;
  locale: SupportedLocale;
  nodeId: string;
  node: TaxonomyNode;
  priority: number;
}

/**
 * Modifier match result
 */
interface ModifierMatch {
  modifier: ModifierNode;
  matched: boolean;
  extractedValue?: string | number;
}

/**
 * Semantic Taxonomy Matcher
 *
 * Provides fast, multilingual matching of user input to taxonomy concepts.
 */
export class TaxonomyMatcher {
  private keywordIndex: Map<string, KeywordIndexEntry[]> = new Map();
  private phraseIndex: Map<string, KeywordIndexEntry[]> = new Map();
  private config: TaxonomyConfig;
  private initialized = false;

  constructor(config: Partial<TaxonomyConfig> = {}) {
    this.config = {
      minConfidence: 0.6,
      useSemanticSearch: false,
      maxSuggestions: 3,
      defaultLocale: 'en',
      debug: false,
      ...config,
    };
  }

  /**
   * Initialize the matcher by building keyword indexes
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.buildKeywordIndex();
    this.buildPhraseIndex();
    this.initialized = true;

    if (this.config.debug) {
      console.log(`[TaxonomyMatcher] Initialized with ${this.keywordIndex.size} keywords`);
      console.log(`[TaxonomyMatcher] Phrase index has ${this.phraseIndex.size} phrases`);
    }
  }

  /**
   * Build the keyword index for fast lookups
   */
  private buildKeywordIndex(): void {
    for (const node of ANIMATION_TAXONOMY) {
      const locales = Object.keys(node.terms) as SupportedLocale[];

      for (const locale of locales) {
        const terms = node.terms[locale] || [];

        for (const term of terms) {
          // Index individual words
          const words = term.toLowerCase().split(/\s+/);
          for (const word of words) {
            if (word.length < 2) continue; // Skip very short words

            const entry: KeywordIndexEntry = {
              term,
              locale,
              nodeId: node.id,
              node,
              priority: node.priority || 5,
            };

            if (!this.keywordIndex.has(word)) {
              this.keywordIndex.set(word, []);
            }
            this.keywordIndex.get(word)!.push(entry);
          }
        }
      }
    }

    // Sort each keyword's entries by priority
    for (const entries of this.keywordIndex.values()) {
      entries.sort((a, b) => b.priority - a.priority);
    }
  }

  /**
   * Build the phrase index for multi-word matches
   */
  private buildPhraseIndex(): void {
    for (const node of ANIMATION_TAXONOMY) {
      const locales = Object.keys(node.terms) as SupportedLocale[];

      for (const locale of locales) {
        const terms = node.terms[locale] || [];

        for (const term of terms) {
          // Only index multi-word phrases
          if (term.includes(' ')) {
            const normalized = term.toLowerCase();
            const entry: KeywordIndexEntry = {
              term,
              locale,
              nodeId: node.id,
              node,
              priority: node.priority || 5,
            };

            if (!this.phraseIndex.has(normalized)) {
              this.phraseIndex.set(normalized, []);
            }
            this.phraseIndex.get(normalized)!.push(entry);
          }
        }
      }
    }
  }

  /**
   * Find the best matching taxonomy nodes for user input
   */
  async findMatches(input: string, preferredLocale?: SupportedLocale): Promise<TaxonomyMatch[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const normalizedInput = input.toLowerCase().trim();
    const matches: Map<string, TaxonomyMatch> = new Map();

    // 1. Try exact phrase matches first (highest confidence)
    this.findPhraseMatches(normalizedInput, matches, preferredLocale);

    // 2. Try keyword matches
    this.findKeywordMatches(normalizedInput, matches, preferredLocale);

    // 3. Try fuzzy/pattern matches
    this.findPatternMatches(normalizedInput, matches, preferredLocale);

    // Convert to array and sort by similarity
    const results = Array.from(matches.values());
    results.sort((a, b) => {
      // First by similarity
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      // Then by priority
      return (b.node.priority || 5) - (a.node.priority || 5);
    });

    return results.slice(0, this.config.maxSuggestions * 2);
  }

  /**
   * Find exact phrase matches
   */
  private findPhraseMatches(
    input: string,
    matches: Map<string, TaxonomyMatch>,
    preferredLocale?: SupportedLocale,
  ): void {
    // Check for exact phrase matches
    for (const [phrase, entries] of this.phraseIndex) {
      if (input.includes(phrase)) {
        for (const entry of entries) {
          const existingMatch = matches.get(entry.nodeId);
          const similarity = 0.95; // High confidence for phrase matches

          // Boost if locale matches preferred
          const localeBoost = preferredLocale === entry.locale ? 0.02 : 0;

          if (!existingMatch || existingMatch.similarity < similarity + localeBoost) {
            matches.set(entry.nodeId, {
              nodeId: entry.nodeId,
              similarity: similarity + localeBoost,
              node: entry.node,
              matchedTerm: entry.term,
              matchedLocale: entry.locale,
            });
          }
        }
      }
    }
  }

  /**
   * Find keyword matches
   */
  private findKeywordMatches(
    input: string,
    matches: Map<string, TaxonomyMatch>,
    preferredLocale?: SupportedLocale,
  ): void {
    const words = input.split(/\s+/);

    for (const word of words) {
      if (word.length < 2) continue;

      const entries = this.keywordIndex.get(word);
      if (!entries) continue;

      for (const entry of entries) {
        const existingMatch = matches.get(entry.nodeId);

        // Calculate similarity based on word match
        let similarity = 0.7; // Base confidence for keyword match

        // Boost for exact word match in the term
        const termWords = entry.term.toLowerCase().split(/\s+/);
        if (termWords.includes(word)) {
          similarity += 0.1;
        }

        // Boost for preferred locale
        if (preferredLocale === entry.locale) {
          similarity += 0.05;
        }

        // Boost for multiple word matches in same node
        const matchingWords = words.filter(
          (w) => entry.term.toLowerCase().includes(w) && w.length > 2,
        );
        similarity += Math.min(matchingWords.length * 0.05, 0.15);

        if (!existingMatch || existingMatch.similarity < similarity) {
          matches.set(entry.nodeId, {
            nodeId: entry.nodeId,
            similarity: Math.min(similarity, 0.95),
            node: entry.node,
            matchedTerm: entry.term,
            matchedLocale: entry.locale,
          });
        }
      }
    }
  }

  /**
   * Find pattern-based matches (fuzzy matching)
   */
  private findPatternMatches(
    input: string,
    matches: Map<string, TaxonomyMatch>,
    preferredLocale?: SupportedLocale,
  ): void {
    // Skip if we already have high-confidence matches
    const hasHighConfidence = Array.from(matches.values()).some((m) => m.similarity > 0.85);
    if (hasHighConfidence) return;

    for (const node of ANIMATION_TAXONOMY) {
      if (matches.has(node.id)) continue;

      const locales = Object.keys(node.terms) as SupportedLocale[];

      for (const locale of locales) {
        const terms = node.terms[locale] || [];

        for (const term of terms) {
          const similarity = this.calculateStringSimilarity(input, term.toLowerCase());

          if (similarity >= this.config.minConfidence) {
            const localeBoost = preferredLocale === locale ? 0.03 : 0;
            const existingMatch = matches.get(node.id);

            if (!existingMatch || existingMatch.similarity < similarity + localeBoost) {
              matches.set(node.id, {
                nodeId: node.id,
                similarity: similarity + localeBoost,
                node,
                matchedTerm: term,
                matchedLocale: locale,
              });
            }
          }
        }
      }
    }
  }

  /**
   * Calculate string similarity using a combination of techniques
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1.0;

    // Contains check
    if (str1.includes(str2) || str2.includes(str1)) {
      const ratio = Math.min(str1.length, str2.length) / Math.max(str1.length, str2.length);
      return 0.6 + ratio * 0.3;
    }

    // Word overlap
    const words1 = new Set(str1.split(/\s+/));
    const words2 = new Set(str2.split(/\s+/));
    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    if (intersection.size > 0) {
      return 0.5 + (intersection.size / union.size) * 0.4;
    }

    // Levenshtein-based similarity for short strings
    if (str1.length < 20 && str2.length < 20) {
      const distance = this.levenshteinDistance(str1, str2);
      const maxLen = Math.max(str1.length, str2.length);
      return Math.max(0, 1 - distance / maxLen) * 0.6;
    }

    return 0;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
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
            dp[i - 1][j] + 1, // deletion
            dp[i][j - 1] + 1, // insertion
            dp[i - 1][j - 1] + 1, // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Detect modifiers in user input
   */
  detectModifiers(input: string, locale?: SupportedLocale): ModifierMatch[] {
    const normalizedInput = input.toLowerCase();
    const results: ModifierMatch[] = [];

    for (const modifier of MODIFIER_NODES) {
      const locales: SupportedLocale[] = locale ? [locale, 'en' as SupportedLocale] : (Object.keys(modifier.terms) as SupportedLocale[]);

      let matched = false;
      let extractedValue: string | number | undefined;

      for (const loc of locales) {
        const patterns = (modifier.terms as Record<SupportedLocale, string[] | undefined>)[loc] || [];

        for (const pattern of patterns) {
          // Handle patterns with wildcards (*)
          if (pattern.includes('*')) {
            const regexPattern = pattern.replace(/\*/g, '(\\d+(?:\\.\\d+)?)');
            const regex = new RegExp(regexPattern, 'i');
            const match = normalizedInput.match(regex);

            if (match) {
              matched = true;
              if (match[1]) {
                extractedValue = parseFloat(match[1]);
              }
              break;
            }
          } else {
            // Simple substring match
            if (normalizedInput.includes(pattern.toLowerCase())) {
              matched = true;
              break;
            }
          }
        }

        if (matched) break;
      }

      results.push({
        modifier,
        matched,
        extractedValue,
      });
    }

    return results.filter((r) => r.matched);
  }

  /**
   * Extract parameter values from input using tool's extractors
   */
  extractParameters(
    input: string,
    node: TaxonomyNode,
    locale?: SupportedLocale,
  ): Record<string, unknown> {
    const params: Record<string, unknown> = { ...node.tool.defaultParams };
    const extractors = node.tool.parameterExtractors || [];

    for (const extractor of extractors) {
      const locales: SupportedLocale[] = locale ? [locale, 'en' as SupportedLocale] : (Object.keys(extractor.patterns) as SupportedLocale[]);

      for (const loc of locales) {
        const patterns = (extractor.patterns as Record<SupportedLocale, RegExp[] | undefined>)[loc] || [];

        for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match && match[1]) {
            params[extractor.param] = extractor.transform
              ? extractor.transform(match[1])
              : match[1];
            break;
          }
        }

        if (params[extractor.param] !== undefined) break;
      }
    }

    return params;
  }

  /**
   * Detect the language of the input
   * Simple heuristic based on character analysis
   */
  detectLocale(input: string): SupportedLocale {
    // Check for CJK characters
    if (/[\u4e00-\u9fff]/.test(input)) {
      // Check for simplified vs traditional Chinese markers
      if (/[\u7b80\u4f53]/.test(input)) return 'zh-CN';
      if (/[\u7e41\u9ad4]/.test(input)) return 'zh-TW';
      return 'zh-CN'; // Default to simplified
    }

    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(input)) return 'ja';
    if (/[\uac00-\ud7af]/.test(input)) return 'ko';
    if (/[\u0e00-\u0e7f]/.test(input)) return 'th';

    // Check for Arabic/Hebrew/Persian
    if (/[\u0600-\u06ff]/.test(input)) {
      if (/[\u0698\u067e\u0686\u06af]/.test(input)) return 'fa';
      return 'ar';
    }
    if (/[\u0590-\u05ff]/.test(input)) return 'he';

    // Check for Cyrillic
    if (/[\u0400-\u04ff]/.test(input)) {
      if (/[\u0456\u0457\u0491]/.test(input)) return 'uk';
      return 'ru';
    }

    // Check for Devanagari and other Indic scripts
    if (/[\u0900-\u097f]/.test(input)) return 'hi';
    if (/[\u0980-\u09ff]/.test(input)) return 'bn';
    if (/[\u0b80-\u0bff]/.test(input)) return 'ta';
    if (/[\u0c00-\u0c7f]/.test(input)) return 'te';

    // Check for specific European language patterns
    const lowerInput = input.toLowerCase();

    // Spanish markers
    if (/[áéíóúñ¿¡]/.test(input) || /\b(el|la|los|las|que|de|en|un|una)\b/.test(lowerInput)) {
      return 'es';
    }

    // French markers
    if (/[àâäéèêëîïôùûüÿç]/.test(input) || /\b(le|la|les|de|du|des|que|est|un|une)\b/.test(lowerInput)) {
      return 'fr';
    }

    // German markers
    if (/[äöüß]/.test(input) || /\b(der|die|das|und|ist|ein|eine|auf|mit)\b/.test(lowerInput)) {
      return 'de';
    }

    // Italian markers
    if (/\b(il|lo|la|i|gli|le|di|che|non|per)\b/.test(lowerInput)) {
      return 'it';
    }

    // Portuguese markers
    if (/[ãõç]/.test(input) || /\b(o|a|os|as|de|que|do|da|em|um|uma)\b/.test(lowerInput)) {
      return 'pt';
    }

    // Dutch markers
    if (/\b(de|het|een|van|en|in|is|op|te|dat)\b/.test(lowerInput)) {
      return 'nl';
    }

    // Default to English
    return 'en';
  }

  /**
   * Get the best single match
   */
  async findBestMatch(input: string, locale?: SupportedLocale): Promise<TaxonomyMatch | null> {
    const matches = await this.findMatches(input, locale);
    return matches.length > 0 ? matches[0] : null;
  }

  /**
   * Check if matcher is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get configuration
   */
  getConfig(): TaxonomyConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<TaxonomyConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let matcherInstance: TaxonomyMatcher | null = null;

/**
 * Get or create the singleton TaxonomyMatcher instance
 */
export function getTaxonomyMatcher(config?: Partial<TaxonomyConfig>): TaxonomyMatcher {
  if (!matcherInstance) {
    matcherInstance = new TaxonomyMatcher(config);
  }
  return matcherInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetTaxonomyMatcher(): void {
  matcherInstance = null;
}
