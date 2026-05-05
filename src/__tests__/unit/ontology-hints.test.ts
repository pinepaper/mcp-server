/**
 * Tests for ontology-driven validation hints and description parity.
 *
 * Covers:
 * - suggestTypo: edit-distance suggestions for vocabulary typos
 * - vocabularyHintForPath: ontology-enriched hints for known enum fields
 * - MINIMAL/COMPACT descriptions stay in sync with Zod enums + ontology maps
 * - Zod enums are subsets of their ontology maps (catches future drift)
 */

import { describe, it, expect } from 'bun:test';
import { suggestTypo, vocabularyHintForPath, VOCABULARY_FIELD_NAMES, validateBatchVocabulary, detectBatchPropertyTypos } from '../../ontology/hints.js';
import {
  ItemTypeSchema,
  RelationTypeSchema,
  GeneratorNameSchema,
  EffectTypeSchema,
} from '../../types/schemas.js';
import { ITEM_TYPE_MAP, RELATION_TYPE_MAP, DIAGRAM_SHAPE_MAP } from '../../ontology/vocabulary.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';
import { COMPACT_DESCRIPTIONS } from '../../tools/compact-descriptions.js';

describe('suggestTypo', () => {
  it('returns null for empty input', () => {
    expect(suggestTypo('', ['orbits', 'follows'])).toBeNull();
  });

  it('returns exact match', () => {
    expect(suggestTypo('orbits', ['orbits', 'follows'])).toBe('orbits');
  });

  it('suggests close typo within edit distance 2', () => {
    expect(suggestTypo('orbit', RelationTypeSchema.options)).toBe('orbits');
    expect(suggestTypo('folows', RelationTypeSchema.options)).toBe('follows');
  });

  it('returns null for far-off strings', () => {
    expect(suggestTypo('xyzabc', RelationTypeSchema.options)).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(suggestTypo('CIRCLE', ItemTypeSchema.options)).toBe('circle');
  });

  it('picks the nearest among multiple close matches', () => {
    // 'start' is 1 edit from 'star', 2 edits from 'arc' — should pick 'star'
    const pick = suggestTypo('start', ItemTypeSchema.options);
    expect(pick).toBe('star');
  });
});

describe('vocabularyHintForPath', () => {
  it('returns null for unrecognized paths', () => {
    expect(vocabularyHintForPath('someRandomField', 'anything')).toBeNull();
  });

  it('hints on itemType path', () => {
    const hint = vocabularyHintForPath('itemType', 'circl');
    expect(hint).not.toBeNull();
    expect(hint!.field).toBe('itemType');
    expect(hint!.label).toBe('item type');
    expect(hint!.validValues).toEqual(ItemTypeSchema.options);
    expect(hint!.suggestion).toBe('circle');
    expect(hint!.ppType).toBe('pp:Circle');
    expect(hint!.reference).toContain('pinepaper_query_ontology');
  });

  it('hints on relationType path with pp: cross-ref', () => {
    const hint = vocabularyHintForPath('relationType', 'orbit');
    expect(hint!.field).toBe('relationType');
    expect(hint!.suggestion).toBe('orbits');
    expect(hint!.ppType).toBe('pp:orbits');
    expect(hint!.reference).toContain('list_edges');
  });

  it('hints on generatorName path (no ppMap)', () => {
    const hint = vocabularyHintForPath('generatorName', 'drawBokh');
    expect(hint!.field).toBe('generatorName');
    expect(hint!.suggestion).toBe('drawBokeh');
    expect(hint!.ppType).toBeUndefined();
    expect(hint!.reference).toContain('list_generators');
  });

  it('hints on effectType path', () => {
    const hint = vocabularyHintForPath('effectType', 'sparkl');
    expect(hint!.field).toBe('effectType');
    expect(hint!.suggestion).toBe('sparkle');
    expect(hint!.reference).toContain('list_effects');
  });

  it('hints on shapeType path with diagram pp: cross-ref', () => {
    const hint = vocabularyHintForPath('shapeType', 'proces');
    expect(hint!.field).toBe('shapeType');
    expect(hint!.suggestion).toBe('process');
    expect(hint!.ppType).toBe('pp:ProcessShape');
  });

  it('finds vocabulary field in nested paths', () => {
    // Batch operations nest: ops.0.relationType
    const hint = vocabularyHintForPath('ops.0.relationType', 'oribits');
    expect(hint).not.toBeNull();
    expect(hint!.field).toBe('relationType');
  });

  it('returns hint with null suggestion when value is unrecoverable', () => {
    const hint = vocabularyHintForPath('itemType', 'nothinglikeanytype');
    expect(hint).not.toBeNull();
    expect(hint!.suggestion).toBeNull();
    expect(hint!.validValues.length).toBeGreaterThan(0);
  });

  it('covers all documented vocabulary field names', () => {
    expect(VOCABULARY_FIELD_NAMES).toEqual([
      'itemType',
      'relationType',
      'generatorName',
      'effectType',
      'shapeType',
    ]);
  });
});

describe('Ontology-vs-Schema parity', () => {
  it('every ItemTypeSchema option maps to a pp: type in ITEM_TYPE_MAP', () => {
    for (const t of ItemTypeSchema.options) {
      expect(ITEM_TYPE_MAP[t]).toBeDefined();
      expect(ITEM_TYPE_MAP[t]).toMatch(/^pp:/);
    }
  });

  it('every RelationTypeSchema option maps to a pp: edge in RELATION_TYPE_MAP', () => {
    for (const r of RelationTypeSchema.options) {
      expect(RELATION_TYPE_MAP[r]).toBeDefined();
      expect(RELATION_TYPE_MAP[r]).toMatch(/^pp:/);
    }
  });

  it('every DIAGRAM_SHAPE_MAP key maps to a pp: diagram shape', () => {
    for (const [k, v] of Object.entries(DIAGRAM_SHAPE_MAP)) {
      expect(v).toMatch(/^pp:.*Shape$/);
    }
  });
});

describe('Descriptions derive from vocabulary (no drift)', () => {
  it('MINIMAL create_item lists every ItemTypeSchema option', () => {
    const desc = MINIMAL_DESCRIPTIONS['pinepaper_create_item'];
    for (const t of ItemTypeSchema.options) {
      expect(desc).toContain(t);
    }
  });

  it('MINIMAL add_relation lists first-N RelationTypeSchema options + ontology ref', () => {
    const desc = MINIMAL_DESCRIPTIONS['pinepaper_add_relation'];
    // First several options must appear
    for (const r of RelationTypeSchema.options.slice(0, 6)) {
      expect(desc).toContain(r);
    }
    // Truncation pointer for the remaining options
    expect(desc).toContain('pinepaper_query_ontology');
  });

  it('MINIMAL create_diagram_shape lists every DIAGRAM_SHAPE_MAP key', () => {
    const desc = MINIMAL_DESCRIPTIONS['pinepaper_create_diagram_shape'];
    for (const k of Object.keys(DIAGRAM_SHAPE_MAP)) {
      expect(desc).toContain(k);
    }
  });

  it('COMPACT create_item lists every ItemTypeSchema option', () => {
    const desc = COMPACT_DESCRIPTIONS['pinepaper_create_item'];
    for (const t of ItemTypeSchema.options) {
      expect(desc).toContain(t);
    }
  });

  it('COMPACT add_relation lists every RelationTypeSchema option (no truncation at compact tier)', () => {
    const desc = COMPACT_DESCRIPTIONS['pinepaper_add_relation'];
    for (const r of RelationTypeSchema.options) {
      expect(desc).toContain(r);
    }
  });

  it('COMPACT execute_generator shows every generator and the count', () => {
    const desc = COMPACT_DESCRIPTIONS['pinepaper_execute_generator'];
    expect(desc).toContain(`(${GeneratorNameSchema.options.length})`);
    for (const g of GeneratorNameSchema.options) {
      expect(desc).toContain(g);
    }
  });

  it('EffectTypeSchema options are a deduped non-empty set', () => {
    expect(EffectTypeSchema.options.length).toBeGreaterThan(0);
    expect(new Set(EffectTypeSchema.options).size).toBe(EffectTypeSchema.options.length);
  });
});

describe('validateBatchVocabulary (preflight for pinepaper_agent_batch_execute)', () => {
  it('returns no violations for an all-valid batch', () => {
    const violations = validateBatchVocabulary([
      { type: 'create', itemType: 'circle' },
      { type: 'create', itemType: 'text' },
      { type: 'relation', relationType: 'orbits' },
      { type: 'apply_effect', effectType: 'sparkle' },
      { type: 'execute_generator', generatorName: 'drawBokeh' },
    ]);
    expect(violations).toEqual([]);
  });

  it('flags a typo in itemType with op index, field, and a suggestion', () => {
    const violations = validateBatchVocabulary([
      { type: 'create', itemType: 'circle' },
      { type: 'create', itemType: 'circel' }, // typo
    ]);
    expect(violations.length).toBe(1);
    const v = violations[0];
    expect(v.opIndex).toBe(1);
    expect(v.opType).toBe('create');
    expect(v.field).toBe('itemType');
    expect(v.hint.suggestion).toBe('circle');
    expect(v.hint.ppType).toBe('pp:Circle');
  });

  it('flags relationType + effectType + generatorName independently', () => {
    const violations = validateBatchVocabulary([
      { type: 'relation', relationType: 'oribits' },
      { type: 'apply_effect', effectType: 'sparkl' },
      { type: 'execute_generator', generatorName: 'drawBokh' },
    ]);
    expect(violations.length).toBe(3);
    expect(violations.map((v) => v.field)).toEqual(['relationType', 'effectType', 'generatorName']);
    expect(violations.map((v) => v.hint.suggestion)).toEqual(['orbits', 'sparkle', 'drawBokeh']);
  });

  it('skips ops whose type is not a vocabulary-bearing type', () => {
    const violations = validateBatchVocabulary([
      { type: 'set_canvas_size', preset: 'totally-invalid-preset' }, // preset isn't vocab-checked here
      { type: 'play_timeline', action: 'maybe-typo' },
      { type: 'modify', itemId: '$0' },
    ]);
    expect(violations).toEqual([]);
  });

  it('ignores undefined/null vocab fields (op may legitimately omit them)', () => {
    const violations = validateBatchVocabulary([
      { type: 'create' }, // no itemType — caught by other validation, not this preflight
      { type: 'relation' },
    ]);
    expect(violations).toEqual([]);
  });

  it('case-sensitive: "Circle" is invalid, suggestion is "circle"', () => {
    const violations = validateBatchVocabulary([
      { type: 'create', itemType: 'Circle' },
    ]);
    expect(violations.length).toBe(1);
    expect(violations[0].hint.suggestion).toBe('circle');
  });

  it('preserves op index across mixed valid/invalid operations', () => {
    const violations = validateBatchVocabulary([
      { type: 'create', itemType: 'circle' },
      { type: 'create', itemType: 'rectangel' }, // op[1] typo
      { type: 'relation', relationType: 'follows' },
      { type: 'apply_effect', effectType: 'fier' },  // op[3] typo
    ]);
    expect(violations.map((v) => v.opIndex)).toEqual([1, 3]);
    expect(violations.map((v) => v.hint.suggestion)).toEqual(['rectangle', 'fire']);
  });
});

describe('detectBatchPropertyTypos (#4 — property-key preflight)', () => {
  it('returns no violations for an all-valid batch', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circle', properties: { radius: 50, color: '#ff0000' } },
      { type: 'create', itemType: 'rectangle', properties: { width: 100, height: 50, cornerRadius: 8 } },
      { type: 'create', itemType: 'text', properties: { content: 'hi', fontSize: 24 } },
    ]);
    expect(typos).toEqual([]);
  });

  it('flags a typo with op index, suggestion, and itemType', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circle', properties: { radiues: 50 } }, // typo
    ]);
    expect(typos.length).toBe(1);
    expect(typos[0].opIndex).toBe(0);
    expect(typos[0].itemType).toBe('circle');
    expect(typos[0].property).toBe('radiues');
    expect(typos[0].suggestion).toBe('radius');
    expect(typos[0].validKeys).toContain('radius');
  });

  it('catches multiple typos across operations', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'rectangle', properties: { corneRadius: 4 } }, // → cornerRadius
      { type: 'create', itemType: 'text', properties: { fontSiz: 12 } },         // → fontSize
    ]);
    expect(typos.length).toBe(2);
    expect(typos.map((t) => t.suggestion)).toEqual(['cornerRadius', 'fontSize']);
  });

  it('passes through legitimate extras (no Levenshtein-2 match)', () => {
    // gradient, _meta, customInternal — none close to any known key
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circle', properties: { radius: 50, gradient: { stops: [] }, _meta: 'foo', customInternal: true } },
    ]);
    expect(typos).toEqual([]);
  });

  it('skips ops that are not "create"', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'modify', itemId: '$0', properties: { radiues: 50 } }, // modify is not create
      { type: 'animate', itemId: '$0', animationType: 'pulse' },
    ]);
    expect(typos).toEqual([]);
  });

  it('skips create ops with unknown itemType (let vocab preflight handle it)', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circel', properties: { radiues: 50 } },
    ]);
    expect(typos).toEqual([]);
  });

  it('skips create ops with no properties object', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circle' },
      { type: 'create', itemType: 'circle', properties: null },
    ]);
    expect(typos).toEqual([]);
  });

  it('shadow/blendMode/opacity (BaseVisualProperties) are valid on shape items', () => {
    const typos = detectBatchPropertyTypos([
      { type: 'create', itemType: 'circle', properties: {
        radius: 50, shadowColor: '#000', shadowBlur: 4, blendMode: 'multiply', opacity: 0.8,
      }},
    ]);
    expect(typos).toEqual([]);
  });
});
