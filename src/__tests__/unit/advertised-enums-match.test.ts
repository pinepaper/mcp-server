/**
 * The JSON inputSchema is a SECOND description of the contract, and it is the
 * one a model actually reads.
 *
 * Zod validates; the JSON schema advertises. When they disagree the model is
 * steered by the advert and judged by the validator. Found three copies of one
 * vocabulary: GeneratorNameSchema had 74 names, the standalone tool advertised
 * about 45, and the batch tool advertised 15 — so 59 working generators were
 * invisible to anyone reading the batch tool, which is the only place most
 * generator calls are made.
 *
 * The same split shipped the stick tool advertising `[{at, name}]` expression
 * beats after the Zod side was corrected to `expression`.
 *
 * Fixed at the source — the advert now spreads the validator's own options —
 * and pinned here so a future hand-written list fails instead of drifting.
 */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { GeneratorNameSchema, ItemTypeSchema } from '../../types/schemas.js';

type JsonSchema = { properties?: Record<string, unknown> };

/** Every `enum` under a property of this name, anywhere in any tool schema. */
function advertisedEnums(field: string): Array<{ tool: string; values: string[] }> {
  const found: Array<{ tool: string; values: string[] }> = [];
  const walk = (node: unknown, tool: string): void => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      if (k === field && v && typeof v === 'object') {
        const e = (v as { enum?: unknown }).enum;
        if (Array.isArray(e)) found.push({ tool, values: e as string[] });
      }
      walk(v, tool);
    }
  };
  for (const t of PINEPAPER_TOOLS) walk(t.inputSchema as JsonSchema, t.name);
  return found;
}

describe('what a tool advertises is what it validates', () => {
  it('finds the enums it claims to check', () => {
    expect(advertisedEnums('generatorName').length).toBeGreaterThan(1);
    expect(advertisedEnums('itemType').length).toBeGreaterThan(0);
  });

  it('every advertised generatorName list is the canonical one', () => {
    const canonical = [...GeneratorNameSchema.options].sort();
    for (const { tool, values } of advertisedEnums('generatorName')) {
      expect([...values].sort(), `${tool} advertises a different generator list`).toEqual(canonical);
    }
  });

  /**
   * create_scene validates against its OWN narrower enum (SceneItemSchema),
   * so its advert and its validator agree — it is a smaller schema, not a
   * stale copy. The invariant is therefore per-tool: never advertise a name
   * the canonical vocabulary does not contain, and where a tool means the
   * whole vocabulary, advertise the whole vocabulary.
   */
  const NARROWER_BY_DESIGN = new Set(['pinepaper_create_scene']);

  it('no tool advertises an item type that does not exist', () => {
    const canonical = new Set<string>(ItemTypeSchema.options);
    for (const { tool, values } of advertisedEnums('itemType')) {
      const invented = values.filter((v) => !canonical.has(v));
      expect(invented, `${tool} advertises item types nothing accepts`).toEqual([]);
    }
  });

  it('a tool that means the whole item vocabulary advertises all of it', () => {
    const canonical = [...ItemTypeSchema.options].sort();
    const full = advertisedEnums('itemType').filter((e) => !NARROWER_BY_DESIGN.has(e.tool));
    expect(full.length).toBeGreaterThan(1);
    for (const { tool, values } of full) {
      expect([...values].sort(), `${tool} hides item types it accepts`).toEqual(canonical);
    }
  });

  it('the canonical lists are not trivially small', () => {
    // Liveness: an empty or stubbed schema would satisfy the checks above.
    expect(GeneratorNameSchema.options.length).toBeGreaterThan(50);
    expect(ItemTypeSchema.options.length).toBeGreaterThan(20);
  });
});
