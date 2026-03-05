/**
 * PP: SEMANTIC VOCABULARY — Controlled vocabularies for semantic annotation
 *
 * Ported from FxTool/js/ontology/SemanticVocabulary.js to typed TypeScript.
 * 90 terms across 9 categories.
 *
 * @module ontology/semantic-vocabulary
 * @version 0.4.0
 */

import type { PinePaperSemanticVocabulary } from './types.js';

export const PP_SEMANTIC_VOCABULARY: PinePaperSemanticVocabulary = {
  moods: ['energetic', 'calm', 'inspiring', 'playful', 'elegant', 'dramatic',
    'mysterious', 'professional', 'whimsical', 'nostalgic', 'futuristic',
    'warm', 'cool', 'festive', 'solemn', 'bold', 'minimal', 'organic'],
  visualStyles: ['bold-typography', 'radial-background', 'particle-effects', 'geometric',
    'organic-flow', 'cinematic', 'flat-design', 'gradient-mesh', 'circuit-board',
    'hand-drawn', 'collage', 'data-visualization', 'wave-patterns', 'neon-glow',
    'skeletal-animation', 'mask-reveal', 'text-reveal', 'letter-by-letter'],
  colorSchemes: ['vibrant', 'muted', 'monochrome', 'dark', 'light', 'neon', 'pastel', 'warm', 'cool', 'earth', 'contrast'],
  audiences: ['creators', 'general', 'business', 'students', 'developers', 'children', 'multilingual', 'indigenous', 'marketers'],
  intents: ['inspire', 'inform', 'sell', 'entertain', 'teach', 'celebrate', 'announce', 'demonstrate', 'brand'],
  animationComplexities: ['static', 'simple', 'moderate', 'complex', 'advanced'],
  compositionStyles: ['centered', 'asymmetric', 'grid', 'layered', 'radial', 'flowing', 'split', 'full-bleed'],
  contentTypes: ['text-focused', 'shape-focused', 'mixed', 'diagram', 'map', 'character', 'scene', 'data-driven'],
  designIntents: ['structural', 'decorative', 'temporal', 'interactive'],
};
