/**
 * KnowledgeGraphValidator — Schema validation and quality scoring for PinePaper templates
 *
 * Two responsibilities:
 * 1. **Schema validation** — Ensures templates conform to PP_VOCABULARY + PP_SEMANTIC_VOCABULARY.
 * 2. **Quality scoring** — Rates a template on its own merit using defined quality dimensions.
 *
 * Ported from FxTool/js/KnowledgeGraphValidator.js to typed TypeScript.
 *
 * @module ontology/validator
 * @version 0.4.0
 */

import { PP_VOCABULARY, ITEM_TYPE_MAP, RELATION_TYPE_MAP } from './vocabulary.js';
import { PP_SEMANTIC_VOCABULARY } from './semantic-vocabulary.js';
import { DesignGraph } from './design-graph.js';
import type {
  PinePaperVocabulary,
  PinePaperSemanticVocabulary,
  TemplateDefinition,
  TemplateGraph,
  ValidationResult,
  QualityScore,
  QualityDimensions,
  Fingerprint,
  SimilarityResult,
  SimilarityContext,
} from './types.js';


// =============================================================================
// QUALITY METRIC WEIGHTS
// =============================================================================

export const QUALITY_WEIGHTS: Record<keyof QualityDimensions, number> = {
  completeness:    0.20,
  animationDesign: 0.25,
  semanticRichness:0.20,
  compositionUse:  0.15,
  structuralDepth: 0.20,
};


// =============================================================================
// VALIDATOR + SCORER
// =============================================================================

export class KnowledgeGraphValidator {
  private vocab: PinePaperVocabulary;
  private semVocab: PinePaperSemanticVocabulary;

  constructor(vocabulary?: PinePaperVocabulary, semanticVocabulary?: PinePaperSemanticVocabulary) {
    this.vocab = vocabulary || PP_VOCABULARY;
    this.semVocab = semanticVocabulary || PP_SEMANTIC_VOCABULARY;
  }

  // ═══════════════════════════════════════════════════════════════════════
  // SCHEMA VALIDATION
  // ═══════════════════════════════════════════════════════════════════════

  /** Validate a template definition against the DesignGraph schema. */
  validateTemplate(templateDef: TemplateDefinition | null | undefined): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!templateDef) {
      return { valid: false, errors: ['Template definition is null or undefined'], warnings };
    }

    if (!templateDef.id || typeof templateDef.id !== 'string') {
      errors.push('Missing or invalid "id" (must be a non-empty string)');
    }
    if (!templateDef.name || typeof templateDef.name !== 'string') {
      errors.push('Missing or invalid "name" (must be a non-empty string)');
    }
    if (!templateDef.category || typeof templateDef.category !== 'string') {
      errors.push('Missing or invalid "category" (must be a non-empty string)');
    }
    if (!templateDef.data || typeof templateDef.data !== 'object') {
      errors.push('Missing or invalid "data" (must be an object)');
      return { valid: false, errors, warnings };
    }

    // Dimensions
    if (templateDef.dimensions) {
      if (typeof templateDef.dimensions !== 'object') {
        errors.push('"dimensions" must be an object with width and height');
      } else {
        if (typeof templateDef.dimensions.width !== 'number' || templateDef.dimensions.width <= 0) {
          warnings.push('"dimensions.width" should be a positive number');
        }
        if (typeof templateDef.dimensions.height !== 'number' || templateDef.dimensions.height <= 0) {
          warnings.push('"dimensions.height" should be a positive number');
        }
      }
    }

    // Duration
    if (templateDef.duration != null) {
      if (typeof templateDef.duration !== 'number' || templateDef.duration < 0) {
        warnings.push('"duration" should be a non-negative number');
      }
    }

    // Items
    const items = templateDef.data.items;
    if (items != null && !Array.isArray(items)) {
      errors.push('"data.items" must be an array');
    } else if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== 'object') {
          errors.push(`data.items[${i}]: must be an object`);
          continue;
        }
        if (!item.type) {
          errors.push(`data.items[${i}]: missing "type" field`);
        } else {
          const ppType = ITEM_TYPE_MAP[item.type];
          if (!ppType) {
            if (!this.vocab.types[item.type] && !item.type.startsWith('pp:')) {
              warnings.push(`data.items[${i}]: unknown type "${item.type}" (not in ITEM_TYPE_MAP or PP_VOCABULARY.types)`);
            }
          }
        }
        if (item.animationType === 'keyframe') {
          if (!Array.isArray(item.keyframes) || item.keyframes.length === 0) {
            warnings.push(`data.items[${i}]: animationType is "keyframe" but keyframes array is missing or empty`);
          } else {
            this._validateKeyframes(item.keyframes as unknown as Array<Record<string, unknown>>, `data.items[${i}]`, errors, warnings);
          }
        }
      }
    }

    // Relations
    const relations = templateDef.data.relations;
    if (relations != null && !Array.isArray(relations)) {
      errors.push('"data.relations" must be an array');
    } else if (Array.isArray(relations)) {
      for (let i = 0; i < relations.length; i++) {
        const rel = relations[i];
        if (!rel || typeof rel !== 'object') {
          errors.push(`data.relations[${i}]: must be an object`);
          continue;
        }
        if (!rel.type) {
          errors.push(`data.relations[${i}]: missing "type" field`);
        } else {
          const ppEdge = RELATION_TYPE_MAP[rel.type];
          if (!ppEdge) {
            if (!this.vocab.edges[rel.type] && !rel.type.startsWith('pp:')) {
              warnings.push(`data.relations[${i}]: unknown relation type "${rel.type}"`);
            }
          }
        }
      }
    }

    // Semantics
    if (templateDef.semantics) {
      this._validateSemantics(templateDef.semantics as Record<string, unknown>, errors, warnings);
    }

    // Background generator
    if (templateDef.data.backgroundGenerator) {
      const genName = templateDef.data.backgroundGenerator;
      if (!this.vocab.generators[genName]) {
        warnings.push(`Unknown background generator "${genName}"`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // QUALITY SCORING
  // ═══════════════════════════════════════════════════════════════════════

  /** Score a template's quality across multiple dimensions. */
  scoreQuality(templateDef: TemplateDefinition, graph: TemplateGraph): QualityScore {
    const dims: QualityDimensions = {
      completeness:     this._scoreCompleteness(templateDef),
      animationDesign:  this._scoreAnimationDesign(templateDef, graph),
      semanticRichness: this._scoreSemanticRichness(templateDef),
      compositionUse:   this._scoreCompositionUse(templateDef),
      structuralDepth:  this._scoreStructuralDepth(graph),
    };

    let score = 0;
    for (const [dim, weight] of Object.entries(QUALITY_WEIGHTS) as Array<[keyof QualityDimensions, number]>) {
      score += (dims[dim] || 0) * weight;
    }
    score = Math.round(score * 1000) / 1000;

    const tier = score >= 0.8 ? 'excellent' as const :
                 score >= 0.6 ? 'good' as const :
                 score >= 0.4 ? 'fair' as const : 'basic' as const;

    return { score, tier, dimensions: dims };
  }

  /** Compute similarity context for a template. */
  computeSimilarityContext(
    newFingerprint: Fingerprint,
    existingFingerprints: Fingerprint[],
    designGraph: DesignGraph,
    options: { topN?: number } = {},
  ): SimilarityContext {
    const topN = options.topN || 5;

    if (!newFingerprint || !Array.isArray(existingFingerprints) || existingFingerprints.length === 0) {
      return { similarTo: [], structuralFamily: null };
    }

    if (!designGraph || typeof designGraph._computeSimilarity !== 'function') {
      throw new Error('A DesignGraph instance is required for similarity computation');
    }

    const scored: SimilarityResult[] = [];
    for (const existing of existingFingerprints) {
      if (existing.templateId === newFingerprint.templateId) continue;
      const score = designGraph._computeSimilarity(newFingerprint, existing);
      scored.push({ templateId: existing.templateId || 'unknown', score: Math.round(score * 1000) / 1000 });
    }

    scored.sort((a, b) => b.score - a.score);
    const similarTo = scored.slice(0, topN);

    const structuralFamily = similarTo.length > 0 && similarTo[0].score > 0.7
      ? similarTo[0].templateId
      : null;

    return { similarTo, structuralFamily };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Quality Dimension Scorers (0-1 each)
  // ─────────────────────────────────────────────────────────────────────

  private _scoreCompleteness(templateDef: TemplateDefinition): number {
    let score = 0;
    const checks = 6;

    if (Array.isArray(templateDef.data?.items) && templateDef.data!.items!.length > 0) score++;
    if (templateDef.dimensions && templateDef.dimensions.width > 0 && templateDef.dimensions.height > 0) score++;
    if (templateDef.duration && templateDef.duration > 0) score++;
    if (templateDef.description && templateDef.description.length > 10) score++;
    if (Array.isArray(templateDef.tags) && templateDef.tags.length > 0) score++;
    if (templateDef.semantics && Object.keys(templateDef.semantics).length > 0) score++;

    return score / checks;
  }

  private _scoreAnimationDesign(templateDef: TemplateDefinition, graph: TemplateGraph): number {
    const items = templateDef.data?.items || [];
    if (items.length === 0) return 0;

    const animatedCount = items.filter(i => i.animationType === 'keyframe' || i.animationType).length;
    const animatedRatio = Math.min(animatedCount / items.length, 1);

    const allEasings = new Set<string>();
    for (const node of (graph?.nodes || [])) {
      if (node.properties?.easings) {
        for (const e of node.properties.easings) allEasings.add(e);
      }
    }
    const easingScore = Math.min(allEasings.size / 3, 1);

    const intervals: number[] = [];
    for (const item of items) {
      if (Array.isArray(item.keyframes) && item.keyframes.length >= 2) {
        const sorted = [...item.keyframes].sort((a, b) => (a.time || 0) - (b.time || 0));
        for (let i = 1; i < sorted.length; i++) {
          const dt = (sorted[i].time || 0) - (sorted[i - 1].time || 0);
          if (dt > 0) intervals.push(dt);
        }
      }
    }

    let rhythmScore = 0;
    if (intervals.length >= 2) {
      const mean = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const variance = intervals.reduce((s, v) => s + (v - mean) ** 2, 0) / intervals.length;
      const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
      rhythmScore = Math.max(0, 1 - cv);
    } else if (intervals.length === 1) {
      rhythmScore = 0.5;
    }

    return animatedRatio * 0.35 + easingScore * 0.35 + rhythmScore * 0.30;
  }

  private _scoreSemanticRichness(templateDef: TemplateDefinition): number {
    const sem = templateDef.semantics as Record<string, unknown> | undefined;
    if (!sem || typeof sem !== 'object') return 0;

    const dimensions = ['mood', 'visualStyle', 'colorScheme', 'audience',
                        'intent', 'animationComplexity', 'compositionStyle', 'contentType'];
    let filled = 0;
    for (const dim of dimensions) {
      const val = sem[dim];
      if (val != null) {
        if (Array.isArray(val) ? val.length > 0 : (typeof val === 'string' && val.length > 0)) {
          filled++;
        }
      }
    }
    return filled / dimensions.length;
  }

  private _scoreCompositionUse(templateDef: TemplateDefinition): number {
    const items = templateDef.data?.items || [];
    const dims = templateDef.dimensions || { width: 1080, height: 1080 };

    if (items.length === 0) return 0;
    if (items.length === 1) return 0.4;

    const positions: [number, number][] = [];
    for (const item of items) {
      let x: number | undefined, y: number | undefined;
      if (Array.isArray(item.position)) {
        [x, y] = item.position;
      } else if (item.x != null && item.y != null) {
        x = item.x;
        y = item.y;
      }
      if (x != null && y != null) positions.push([x, y]);
    }

    if (positions.length < 2) return 0.3;

    const xs = positions.map(p => p[0]);
    const ys = positions.map(p => p[1]);
    const xMean = xs.reduce((s, v) => s + v, 0) / xs.length;
    const yMean = ys.reduce((s, v) => s + v, 0) / ys.length;
    const xStd = Math.sqrt(xs.reduce((s, v) => s + (v - xMean) ** 2, 0) / xs.length);
    const yStd = Math.sqrt(ys.reduce((s, v) => s + (v - yMean) ** 2, 0) / ys.length);

    const xSpread = Math.min(xStd / (dims.width * 0.25), 1);
    const ySpread = Math.min(yStd / (dims.height * 0.25), 1);

    return (xSpread + ySpread) / 2;
  }

  private _scoreStructuralDepth(graph: TemplateGraph | null): number {
    if (!graph) return 0;

    const edgeTypes = new Set((graph.edges || []).map(e => e.type));
    const patterns = graph.patterns || [];
    const mathFns = graph.mathFunctions || [];

    const edgeScore = Math.min(edgeTypes.size / 3, 1);
    const patternScore = Math.min(patterns.length / 3, 1);
    const mathScore = Math.min(mathFns.length / 3, 1);

    return edgeScore * 0.35 + patternScore * 0.35 + mathScore * 0.30;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────

  private _validateSemantics(sem: Record<string, unknown>, errors: string[], warnings: string[]): void {
    if (typeof sem !== 'object') {
      errors.push('"semantics" must be an object');
      return;
    }

    const arrayFields: Record<string, string[]> = {
      mood: this.semVocab.moods,
      visualStyle: this.semVocab.visualStyles,
      audience: this.semVocab.audiences,
    };

    for (const [field, allowed] of Object.entries(arrayFields)) {
      if (sem[field] != null) {
        const values = Array.isArray(sem[field]) ? sem[field] as string[] : [sem[field] as string];
        for (const val of values) {
          if (!allowed.includes(val)) {
            const vocabField = field === 'mood' ? 'moods' : field === 'visualStyle' ? 'visualStyles' : 'audiences';
            warnings.push(`semantics.${field}: unknown value "${val}" (not in PP_SEMANTIC_VOCABULARY.${vocabField})`);
          }
        }
      }
    }

    const stringFields: Record<string, string[]> = {
      colorScheme: this.semVocab.colorSchemes,
      intent: this.semVocab.intents,
      animationComplexity: this.semVocab.animationComplexities,
      compositionStyle: this.semVocab.compositionStyles,
      contentType: this.semVocab.contentTypes,
    };

    for (const [field, allowed] of Object.entries(stringFields)) {
      if (sem[field] != null) {
        if (typeof sem[field] !== 'string') {
          warnings.push(`semantics.${field}: should be a string`);
        } else if (!allowed.includes(sem[field] as string)) {
          warnings.push(`semantics.${field}: unknown value "${sem[field]}"`);
        }
      }
    }

    if (sem.platforms != null) {
      if (!Array.isArray(sem.platforms)) {
        warnings.push('semantics.platforms: should be an array of strings');
      }
    }
  }

  private _validateKeyframes(
    keyframes: Array<Record<string, unknown>>,
    prefix: string,
    errors: string[],
    warnings: string[],
  ): void {
    for (let k = 0; k < keyframes.length; k++) {
      const kf = keyframes[k];
      if (!kf || typeof kf !== 'object') {
        warnings.push(`${prefix}.keyframes[${k}]: must be an object`);
        continue;
      }
      if (kf.time == null || typeof kf.time !== 'number') {
        warnings.push(`${prefix}.keyframes[${k}]: missing or invalid "time" (must be a number)`);
      }
      if (!kf.properties || typeof kf.properties !== 'object') {
        warnings.push(`${prefix}.keyframes[${k}]: missing "properties" object`);
      }
    }
  }
}
