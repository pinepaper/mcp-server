/**
 * The ontology port carries the engine's vocabulary (round 8 EE, 1.72):
 * validate_design called an uploaded "audio" item an unknown type because the
 * hand port had fallen 41 map entries and 28 classes behind FxTool.
 */
import { describe, it, expect } from 'bun:test';
import { ITEM_TYPE_MAP, PP_VOCABULARY } from '../../ontology/vocabulary.js';
import { UPSTREAM_ITEM_TYPE_MAP, UPSTREAM_TYPES } from '../../ontology/upstream-vocabulary.js';

describe('engine vocabulary is merged into the port', () => {
  it('every engine item type maps the way the engine maps it', () => {
    for (const [k, v] of Object.entries(UPSTREAM_ITEM_TYPE_MAP)) expect([k, ITEM_TYPE_MAP[k]]).toEqual([k, v]);
  });

  it('every engine class exists here', () => {
    const missing = Object.keys(UPSTREAM_TYPES).filter((k) => !PP_VOCABULARY.types[k]);
    expect(missing).toEqual([]);
  });

  it('media items are known types, not "unknown"', () => {
    expect(ITEM_TYPE_MAP.audio).toBe('pp:AudioClip');
    expect(ITEM_TYPE_MAP.video).toBe('pp:VideoClip');
    expect(PP_VOCABULARY.types['pp:AudioClip']).toBeDefined();
  });
});
