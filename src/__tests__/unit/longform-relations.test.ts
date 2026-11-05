/**
 * Tests for the 9 long-form relations introduced in FxTool #162 (PRs #309-#312):
 * - then, after (sequence relations with cascading re-timing)
 * - phase_wave, ring_forming, flock (collection relations with per-member phase)
 * - on_complete, at_beat (declared event triggers)
 * - camera_tracks, soundtrack_cue (shot and audio cue relations)
 */
import { describe, it, expect } from 'bun:test';
import { RelationTypeSchema } from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { RELATION_TYPE_MAP, PP_VOCABULARY } from '../../ontology/vocabulary.js';

describe('FxTool #162 long-form relations', () => {
  const NEW_RELATIONS = [
    'then',
    'after',
    'on_complete',
    'at_beat',
    'phase_wave',
    'ring_forming',
    'flock',
    'camera_tracks',
    'soundtrack_cue',
  ] as const;

  for (const rel of NEW_RELATIONS) {
    it(`RelationTypeSchema accepts "${rel}"`, () => {
      expect(RelationTypeSchema.parse(rel)).toBe(rel);
    });

    it(`RELATION_TYPE_MAP maps "${rel}" to an existing edge in PP_VOCABULARY`, () => {
      const edge = RELATION_TYPE_MAP[rel];
      expect(edge).toBeDefined();
      expect(PP_VOCABULARY.edges[edge]).toBeDefined();
    });

    it(`generateAddRelation generates code for "${rel}"`, () => {
      const code = codeGenerator.generateAddRelation({
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: rel,
        params: {},
      });
      expect(code).toContain(`app.addRelation("item_1", "item_2", "${rel}"`);
      expect(code).toContain(`relationType: "${rel}"`);
    });
  }
});
