/**
 * PinePaper Ontology — Barrel re-exports
 *
 * @module ontology
 */

// Types
export type {
  VocabularyType,
  VocabularyEdge,
  VocabularyGenerator,
  VocabularyPattern,
  VocabularyProperty,
  VocabularyMathFunction,
  VocabularyValueType,
  PinePaperVocabulary,
  PinePaperSemanticVocabulary,
  GraphNode,
  GraphEdge,
  GeneratorInfo,
  SemanticInfo,
  Fingerprint,
  TemplateGraph,
  TemplateDefinition,
  TemplateItem,
  TemplateKeyframe,
  TemplateRelation,
  ValidationResult,
  QualityDimensions,
  QualityScore,
  SimilarityResult,
  SimilarityContext,
  NodeProperties,
} from './types.js';

// Vocabulary data
export {
  PP_VOCABULARY,
  ITEM_TYPE_MAP,
  RELATION_TYPE_MAP,
  DIAGRAM_SHAPE_MAP,
  CONNECTOR_STYLE_MAP,
  EASING_TO_MATH,
} from './vocabulary.js';

// Semantic vocabulary data
export { PP_SEMANTIC_VOCABULARY } from './semantic-vocabulary.js';

// DesignGraph class
export { DesignGraph } from './design-graph.js';

// KnowledgeGraphValidator class + weights
export { KnowledgeGraphValidator, QUALITY_WEIGHTS } from './validator.js';
