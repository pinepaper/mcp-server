/**
 * TypeScript interfaces for the PinePaper ontology system.
 *
 * Defines structural types for vocabulary entries, graph nodes/edges,
 * fingerprints, semantic metadata, validation results, and quality scores.
 *
 * @module ontology/types
 */

// =============================================================================
// VOCABULARY ENTRY TYPES
// =============================================================================

export interface VocabularyType {
  description: string;
  parentType?: string;
  anchor?: string | null;
  abstract?: boolean;
  mcpTool?: string;
  geometricSupertype?: string;
  defaultCurveType?: string;
  bpmnEquivalent?: string;
  i18nKey?: string;
}

export interface VocabularyEdge {
  description?: string;
  parentType?: string;
  category?: string;
  abstract?: boolean;
  behaviorType?: 'constraint' | 'trigger' | 'procedural' | null;
  directionality?: string;
  cardinality?: 'group';
  mcpToolRef?: string;
  mathFunctions?: string[];
  bpmnEquivalent?: string;
  i18nKey?: string;
}

export interface VocabularyGenerator {
  description?: string;
  parentType?: string;
  category?: string;
  abstract?: boolean;
  mathFunctions?: string[];
  i18nKey?: string;
}

export interface VocabularyPattern {
  description: string;
  requiredEdges?: string[];
  nodeTypes?: string[];
  mathFunctions?: string[];
  i18nKey?: string;
}

export interface VocabularyProperty {
  valueType: string;
  unit?: string | null;
  appliesTo: string[];
  animatable?: boolean;
  range?: [number, number];
  values?: string[];
  description?: string;
  i18nKey?: string;
}

export interface VocabularyMathFunction {
  category: string;
  formula?: string;
  i18nKey?: string;
}

export interface VocabularyValueType {
  anchor?: string | null;
  description: string;
  fields?: string[];
  i18nKey?: string;
}

// =============================================================================
// TOP-LEVEL VOCABULARY
// =============================================================================

export interface PinePaperVocabulary {
  types: Record<string, VocabularyType>;
  edges: Record<string, VocabularyEdge>;
  generators: Record<string, VocabularyGenerator>;
  patterns: Record<string, VocabularyPattern>;
  properties: Record<string, VocabularyProperty>;
  valueTypes: Record<string, VocabularyValueType>;
  mathFunctions: Record<string, VocabularyMathFunction>;
}

// =============================================================================
// SEMANTIC VOCABULARY
// =============================================================================

export interface PinePaperSemanticVocabulary {
  moods: string[];
  visualStyles: string[];
  colorSchemes: string[];
  audiences: string[];
  intents: string[];
  animationComplexities: string[];
  compositionStyles: string[];
  contentTypes: string[];
  designIntents: string[];
}

// =============================================================================
// GRAPH STRUCTURES
// =============================================================================

export interface GraphNode {
  id: string | null;
  type: string;
  label: string;
  properties: NodeProperties;
}

export interface NodeProperties {
  position: [number, number] | null;
  hasKeyframes: boolean;
  animationType: string | null;
  keyframeCount: number;
  easings: string[];
  trimPath: boolean;
  blendMode: string | null;
  masked: boolean;
  maskType: string | null;
  hasColorAnimation?: boolean;
  closed?: boolean;
  curveType?: string;
  segmentCount?: number;
}

export interface GraphEdge {
  source: string | null;
  target: string | null;
  type: string;
  params: Record<string, unknown>;
}

export interface GeneratorInfo {
  name: string;
  type: string;
  mathFunctions: string[];
}

export interface SemanticInfo {
  animationComplexity?: string;
  contentType?: string;
  platforms?: string[];
  hasLetterCollage?: boolean;
  hasRigging?: boolean;
  hasMasking?: boolean;
  mood?: string[];
  audience?: string[];
  intent?: string;
  visualStyle?: string[];
  colorScheme?: string;
  compositionStyle?: string;
}

export interface Fingerprint {
  nodeTypeCounts: Record<string, number>;
  edgeTypeCounts: Record<string, number>;
  mathFunctions: string[];
  patterns: string[];
  totalNodes: number;
  totalEdges: number;
  hasGenerator: boolean;
  generatorType: string | null;
  semantics: SemanticInfo | null;
  templateId?: string;
}

export interface TemplateGraph {
  templateId: string;
  templateName: string;
  category: string;
  dimensions: { width: number; height: number };
  duration: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
  mathFunctions: string[];
  patterns: string[];
  generator: GeneratorInfo | null;
  fingerprint: Fingerprint | null;
  semantics?: SemanticInfo;
}

// =============================================================================
// TEMPLATE DEFINITION (input to extractFromDefinition)
// =============================================================================

export interface TemplateDefinition {
  id?: string;
  name?: string;
  category?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
  description?: string;
  tags?: string[];
  semantics?: Record<string, unknown>;
  data?: {
    items?: TemplateItem[];
    relations?: TemplateRelation[];
    backgroundGenerator?: string;
  };
  onLoad?: unknown;
}

export interface TemplateItem {
  id?: string;
  name?: string;
  type?: string;
  content?: string;
  label?: string;
  position?: [number, number];
  x?: number;
  y?: number;
  animationType?: string;
  keyframes?: TemplateKeyframe[];
  mask?: { type?: string; animated?: boolean; animation?: unknown };
  blendMode?: string;
  trimStart?: number;
  trimEnd?: number;
  trimOffset?: number;
  shapeType?: string;
  lineStyle?: string;
  sourceId?: string;
  targetId?: string;
  routing?: string;
  headStyle?: string;
  collageId?: string;
  fontSize?: number;
  closed?: boolean;
  smooth?: boolean;
  segments?: unknown[];
  [key: string]: unknown;
}

export interface TemplateKeyframe {
  time?: number;
  easing?: string | number[];
  properties?: Record<string, unknown>;
  propertyEasings?: Record<string, string | number[]>;
}

export interface TemplateRelation {
  type?: string;
  source?: string;
  from?: string;
  target?: string;
  to?: string;
  params?: Record<string, unknown>;
}

// =============================================================================
// VALIDATION & QUALITY SCORING
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface QualityDimensions {
  completeness: number;
  animationDesign: number;
  semanticRichness: number;
  compositionUse: number;
  structuralDepth: number;
}

export interface QualityScore {
  score: number;
  tier: 'excellent' | 'good' | 'fair' | 'basic';
  dimensions: QualityDimensions;
}

export interface SimilarityResult {
  templateId: string;
  score: number;
}

export interface SimilarityContext {
  similarTo: SimilarityResult[];
  structuralFamily: string | null;
}
