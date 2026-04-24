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
import { suggestTypo, vocabularyHintForPath, VOCABULARY_FIELD_NAMES } from '../../ontology/hints.js';
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
