/**
 * The relation vocabulary must match the engine's.
 *
 * This has now failed in BOTH directions, in both repos. FxTool's own reference
 * carried 75 of its registry's 117 relations because the doc was generated from
 * a map nothing checked. On this side it was worse: the tool enum listed 39 of
 * 134, and the enum is a HARD GATE — `pinepaper_add_relation` rejects at
 * validation, so 95 live relations could not be named at all. The missing set
 * was not a random 95: it was essentially the entire INTERACTIVE vocabulary,
 * every event-channel relation included, which meant the whole
 * state-machine-via-relations capability was undiscoverable and unusable.
 * `pinepaper_scene_graph` was emitting `on_click_fire` and `on_event_set_active`
 * that an agent could not then create, inspect or recreate by hand.
 *
 * Nothing was broken at runtime, which is exactly why it survived: the engine
 * could do it and nothing could NAME it. For a model those are the same
 * condition.
 *
 * The fixture is the engine's own RELATION_TYPE_MAP, copied from
 * FxTool js/ontology/Vocabulary.js. Refresh it when the engine adds relations;
 * this test then says precisely what the tool surface still has to learn.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { RelationTypeSchema } from '../../types/schemas.js';
import { RELATION_TYPE_MAP } from '../../ontology/vocabulary.js';

const ENGINE = new Set(
  readFileSync(join(import.meta.dir, '..', 'fixtures', 'engine-relations.txt'), 'utf-8')
    .split('\n').map((l) => l.trim()).filter(Boolean),
);

/**
 * Relations a DEDICATED TOOL emits.
 *
 * These are deliberately absent from the enum: the agent authors them through
 * that tool, and a second name in `add_relation` would be a worse way to do the
 * same thing. The criterion is "who creates it" — not "is it useful".
 *
 * Written down because the alternative is re-litigating all 95 at every engine
 * diff. If a family moves from tool-emitted to hand-authored, move it here.
 */
const EMITTED_BY_A_TOOL: Record<string, RegExp | string[]> = {
  pinepaper_deform: /^deform_/,
  pinepaper_apply_effect: /^effect_/,
  'map tools': /^geo_/,
  // `expresses` is NOT here, though it is registered by the rigging system:
  // the engine documents it as a hand-authored call —
  // `app.addRelation(rootId, null, 'expresses', { expression: 'blink' })` — and
  // pinepaper_import_layered_character promises blink/smile "work immediately",
  // which is false if an agent cannot name it. Registered-by is not the test;
  // authored-by is.
  pinepaper_rigging: ['bone_attached', 'bone_skinned', 'ik_target', 'locomotion', 'pose_layer'],
  'blending system': /^blend_/,
  pinepaper_component: ['composed_as', 'fills_slot'],
  'text tools': ['glyph_of', 'has_text_effect'],
  pinepaper_camera_director: ['has_camera_treatment'],
  'map tools (place containment)': ['contained_in_place'],
  '(not a relation — the escape hatch for an unrecognised edge)': ['unknown'],
};

const isExcluded = (name: string) =>
  Object.values(EMITTED_BY_A_TOOL).some((rule) =>
    rule instanceof RegExp ? rule.test(name) : rule.includes(name));

const EXPOSED = [...ENGINE].filter((r) => !isExcluded(r)).sort();

/** Every JSON-Schema copy of the enum in the tool definitions. */
function enumCopies(): Array<{ tool: string; prop: string; values: string[] }> {
  const out: Array<{ tool: string; prop: string; values: string[] }> = [];
  const walk = (tool: string, node: unknown, prop: string) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (Array.isArray(n.enum) && (n.enum as string[]).includes('orbits')) {
      out.push({ tool, prop, values: n.enum as string[] });
    }
    for (const [k, v] of Object.entries(n)) walk(tool, v, k === 'properties' || k === 'items' ? prop : k);
  };
  for (const t of PINEPAPER_TOOLS as { name: string; inputSchema: unknown }[]) walk(t.name, t.inputSchema, '');
  return out;
}

describe('relation vocabulary ↔ engine', () => {
  it('every engine relation an agent authors is CALLABLE', () => {
    const zod = new Set(RelationTypeSchema.options as string[]);
    const missing = EXPOSED.filter((r) => !zod.has(r));
    // A name missing here is not a documentation gap — it is a hard reject.
    expect(missing).toEqual([]);
  });

  it('nothing is offered that the engine cannot run', () => {
    const invented = (RelationTypeSchema.options as string[]).filter((r) => !ENGINE.has(r));
    // The mirror-image failure: a name resolves to nothing, so the row is
    // silently dropped downstream and the count quietly disagrees.
    expect(invented).toEqual([]);
  });

  it('the exclusion list covers exactly what is left out, and nothing more', () => {
    const zod = new Set(RelationTypeSchema.options as string[]);
    const notCallable = [...ENGINE].filter((r) => !zod.has(r)).sort();
    const excluded = [...ENGINE].filter(isExcluded).sort();
    // The done-condition: what is uncallable IS the written exclusion list.
    // Any drift shows up here as a name nobody decided about.
    expect(notCallable).toEqual(excluded);
  });

  it('every exclusion names a real engine relation', () => {
    // A stale exclusion silently re-hides a relation if the engine renames it.
    const stale = Object.values(EMITTED_BY_A_TOOL)
      .flatMap((rule) => (rule instanceof RegExp ? [] : rule))
      .filter((r) => !ENGINE.has(r));
    expect(stale).toEqual([]);
  });
});

describe('the enum is duplicated — the copies must agree', () => {
  const copies = enumCopies();

  it('finds every copy (they live in five tool schemas)', () => {
    expect(copies.length).toBeGreaterThanOrEqual(5);
  });

  it('every JSON-Schema copy matches the zod enum EXACTLY', () => {
    // They had already drifted in ORDER before this test existed, which is how
    // a string-match patch silently skipped one of them.
    const zod = RelationTypeSchema.options as string[];
    for (const c of copies) {
      expect({ tool: c.tool, values: c.values }).toEqual({ tool: c.tool, values: zod });
    }
  });

  it('every callable relation resolves to a pp: edge for the validator', () => {
    // RELATION_TYPE_MAP gates isKnownRelationType(): a relation callable but
    // unmapped makes the validator report a perfectly valid scene as using an
    // unknown relation. Same bug, third layer.
    const unmapped = (RelationTypeSchema.options as string[]).filter((r) => !RELATION_TYPE_MAP[r]);
    expect(unmapped).toEqual([]);
  });
});
