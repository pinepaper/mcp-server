/**
 * Vocabulary hints — ontology-aware suggestions for failed enum validations.
 *
 * Exposed to handlers.ts so that when Zod rejects an itemType / relationType /
 * generatorName / shapeType, the resulting error includes a typo suggestion and
 * the canonical valid list — making the next LLM call self-correcting without
 * needing a separate ontology query.
 */

import {
  ItemTypeSchema,
  RelationTypeSchema,
  GeneratorNameSchema,
  EffectTypeSchema,
  TextPropertiesSchema,
  CirclePropertiesSchema,
  StarPropertiesSchema,
  RectanglePropertiesSchema,
  PolygonPropertiesSchema,
  EllipsePropertiesSchema,
  PathPropertiesSchema,
  LinePropertiesSchema,
  ArcPropertiesSchema,
  BaseVisualPropertiesSchema,
} from '../types/schemas.js';
import { ITEM_TYPE_MAP, RELATION_TYPE_MAP, DIAGRAM_SHAPE_MAP } from './vocabulary.js';

/**
 * Known vocabulary field names → canonical valid-value list.
 * Path segments from Zod errors are matched against these keys.
 */
const VOCABULARY_FIELDS: Record<string, { values: readonly string[]; ppMap?: Record<string, string>; label: string }> = {
  itemType:      { values: ItemTypeSchema.options, ppMap: ITEM_TYPE_MAP, label: 'item type' },
  relationType:  { values: RelationTypeSchema.options, ppMap: RELATION_TYPE_MAP, label: 'relation type' },
  generatorName: { values: GeneratorNameSchema.options, label: 'generator name' },
  effectType:    { values: EffectTypeSchema.options, label: 'effect type' },
  shapeType:     { values: Object.keys(DIAGRAM_SHAPE_MAP), ppMap: DIAGRAM_SHAPE_MAP, label: 'diagram shape type' },
};

/** Classic Levenshtein edit distance. */
function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/** Case-insensitive nearest match within edit distance ≤ 2. */
export function suggestTypo(bad: string, candidates: readonly string[]): string | null {
  if (!bad || typeof bad !== 'string') return null;
  const lower = bad.toLowerCase();
  let best: { value: string; dist: number } | null = null;
  for (const c of candidates) {
    const d = editDistance(lower, c.toLowerCase());
    if (d <= 2 && (!best || d < best.dist)) best = { value: c, dist: d };
  }
  return best?.value ?? null;
}

/**
 * Returns an ontology-enriched hint for a failed enum validation, or null if
 * the path isn't a recognized vocabulary field.
 *
 * Keeps the shape machine-readable so LLM callers can parse it:
 *   {
 *     field: 'relationType',
 *     validValues: [...],     // authoritative list
 *     suggestion: 'orbits',   // best typo match, if any
 *     ppType: 'pp:orbits',    // canonical ontology key for the suggestion
 *     reference: 'pinepaper_query_ontology?query=list_edges for descriptions'
 *   }
 */
export interface VocabularyHint {
  field: string;
  label: string;
  validValues: readonly string[];
  received: unknown;
  suggestion: string | null;
  ppType?: string;
  reference: string;
}

export function vocabularyHintForPath(path: string, received: unknown): VocabularyHint | null {
  const segments = path.split('.');
  const field = segments.find((s) => s in VOCABULARY_FIELDS);
  if (!field) return null;
  const spec = VOCABULARY_FIELDS[field];
  const suggestion = typeof received === 'string' ? suggestTypo(received, spec.values) : null;
  const ppType = suggestion && spec.ppMap ? spec.ppMap[suggestion] : undefined;
  const queryKind = field === 'relationType' ? 'list_edges' : field === 'generatorName' ? 'list_generators' : field === 'effectType' ? 'list_effects' : 'list_types';
  return {
    field,
    label: spec.label,
    validValues: spec.values,
    received,
    suggestion,
    ppType,
    reference: `pinepaper_query_ontology { query: "${queryKind}" }`,
  };
}

/** Exposed for tests + description-parity checks. */
export const VOCABULARY_FIELD_NAMES = Object.keys(VOCABULARY_FIELDS);

/**
 * Per-operation-type → which vocabulary fields to validate.
 * Used by batch preflight (pinepaper_agent_batch_execute) so an LLM that
 * typoed `circel` instead of `circle` gets a structured hint back BEFORE
 * the batch crosses the browser boundary — rather than failing silently
 * or throwing inside the generated JS.
 */
const BATCH_OP_VOCABULARY_FIELDS: Record<string, readonly string[]> = {
  create: ['itemType'],
  relation: ['relationType'],
  apply_effect: ['effectType'],
  execute_generator: ['generatorName'],
};

export interface BatchVocabularyViolation {
  opIndex: number;
  opType: string;
  field: string;
  hint: VocabularyHint;
}

/**
 * Known property keys per itemType — derived from existing per-shape Zod
 * schemas at module load. Used for batch-preflight typo detection: a key
 * within Levenshtein-2 of a known key in the same itemType is flagged with
 * a suggestion. Keys that aren't close to any known key pass through, so
 * legitimate extras like `gradient`, `data`, custom internals don't false-
 * positive. Mirrors the suggestTypo / vocabularyHintForPath shape used for
 * top-level vocabulary fields.
 */
function shapeKeys(schema: unknown): string[] {
  const def = (schema as { _def?: { shape?: () => Record<string, unknown> } })._def;
  if (!def?.shape) return [];
  return Object.keys(def.shape());
}

const baseVisualKeys = shapeKeys(BaseVisualPropertiesSchema);
const KNOWN_PROPERTY_KEYS_BY_ITEM_TYPE: Record<string, readonly string[]> = {
  text: shapeKeys(TextPropertiesSchema),
  circle: [...shapeKeys(CirclePropertiesSchema), ...baseVisualKeys],
  star: [...shapeKeys(StarPropertiesSchema), ...baseVisualKeys],
  rectangle: [...shapeKeys(RectanglePropertiesSchema), ...baseVisualKeys],
  triangle: [...shapeKeys(PolygonPropertiesSchema), ...baseVisualKeys], // triangle uses polygon shape
  polygon: [...shapeKeys(PolygonPropertiesSchema), ...baseVisualKeys],
  ellipse: [...shapeKeys(EllipsePropertiesSchema), ...baseVisualKeys],
  path: [...shapeKeys(PathPropertiesSchema), ...baseVisualKeys],
  line: [...shapeKeys(LinePropertiesSchema), ...baseVisualKeys],
  arc: [...shapeKeys(ArcPropertiesSchema), ...baseVisualKeys],
};

export interface BatchPropertyTypoViolation {
  opIndex: number;
  opType: 'create';
  itemType: string;
  property: string;
  suggestion: string;
  validKeys: readonly string[];
}

/**
 * Detect clear property-key typos in batch_execute `create` operations.
 * Returns ONLY keys that are Levenshtein-≤2 from a known key for the
 * given itemType — legitimate extras (gradient, custom internals) won't
 * match anything close, so they pass through silently. This deliberately
 * narrow scope avoids false positives while still catching the typo class
 * (radiues vs radius, fontSiz vs fontSize, corneRadius vs cornerRadius).
 *
 * Empty itemType / unknown itemType → empty result (let the vocabulary
 * preflight handle the upstream type error first).
 */
export function detectBatchPropertyTypos(
  operations: ReadonlyArray<Record<string, unknown>>,
): BatchPropertyTypoViolation[] {
  const violations: BatchPropertyTypoViolation[] = [];
  operations.forEach((op, opIndex) => {
    if (op.type !== 'create') return;
    const itemType = typeof op.itemType === 'string' ? op.itemType : '';
    const knownKeys = KNOWN_PROPERTY_KEYS_BY_ITEM_TYPE[itemType];
    if (!knownKeys || knownKeys.length === 0) return;
    const props = op.properties;
    if (!props || typeof props !== 'object') return;
    for (const key of Object.keys(props)) {
      if (knownKeys.includes(key)) continue;
      const suggestion = suggestTypo(key, knownKeys);
      if (!suggestion) continue;
      violations.push({
        opIndex,
        opType: 'create',
        itemType,
        property: key,
        suggestion,
        validKeys: knownKeys,
      });
    }
  });
  return violations;
}

/**
 * Walk a batch operations array and return a vocabulary-violation list. Each
 * entry carries the op index, the op type, the offending field, and a
 * VocabularyHint with the canonical valid list and a typo suggestion.
 *
 * Operation shape kept loose (Record<string, unknown>) so the helper is
 * callable without depending on the generated Zod types.
 */
export function validateBatchVocabulary(
  operations: ReadonlyArray<Record<string, unknown>>,
): BatchVocabularyViolation[] {
  const violations: BatchVocabularyViolation[] = [];
  operations.forEach((op, opIndex) => {
    const opType = typeof op.type === 'string' ? op.type : '';
    const fields = BATCH_OP_VOCABULARY_FIELDS[opType];
    if (!fields) return;
    for (const field of fields) {
      const value = op[field];
      if (value === undefined || value === null) continue;
      if (typeof value !== 'string') continue;
      const hint = vocabularyHintForPath(field, value);
      if (!hint) continue;
      const isValid = (hint.validValues as readonly string[]).includes(value);
      if (!isValid) violations.push({ opIndex, opType, field, hint });
    }
  });
  return violations;
}
