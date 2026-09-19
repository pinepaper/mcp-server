/**
 * Every shape the engine registers must be nameable by some tool.
 *
 * FxTool's ShapeRegistry carries 34 shapes across five modules, and
 * PinePaper.create() delegates any of them — its own comment says "basic
 * shapes, comment/bubble shapes, etc." It even forwards `tailDirection` and
 * `tailSize`, parameters that exist only for bubbles.
 *
 * Eleven of the 34 appeared in no tool enum anywhere: three basic shapes and
 * the ENTIRE comment module — every speech bubble, thought bubble and callout.
 * The engine had been able to draw them the whole time. An agent asked for a
 * comic panel or an annotated diagram had to hand-build the outline, or say no,
 * and nothing anywhere indicated the capability existed.
 *
 * This is the same principle ItemTypeSchema already states for shader/field:
 * a capability nobody can name is a capability nobody has. The difference is
 * that those two were newly exposed, and these were quietly lost.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { ItemTypeSchema } from '../../types/schemas.js';

const REGISTRY = readFileSync(join(import.meta.dir, '..', 'fixtures', 'engine-shape-registry.txt'), 'utf-8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [id, mod] = l.split(/\s+/); return { id: id!, module: mod! }; });

/** Every enum value anywhere in the served tool surface. */
function servedEnumValues(): Set<string> {
  const out = new Set<string>();
  const walk = (n: unknown): void => {
    if (!n || typeof n !== 'object') return;
    const o = n as Record<string, unknown>;
    if (Array.isArray(o.enum)) for (const v of o.enum) if (typeof v === 'string') out.add(v);
    for (const v of Object.values(o)) walk(v);
  };
  for (const t of PINEPAPER_TOOLS) walk(t.inputSchema);
  return out;
}

describe('the engine shape registry is reachable', () => {
  it('the fixture is populated and covers all five modules', () => {
    // An empty fixture satisfies every "nothing missing" assertion below.
    expect(REGISTRY.length).toBe(34);
    expect(new Set(REGISTRY.map((r) => r.module))).toEqual(
      new Set(['basic', 'flowchart', 'uml', 'network', 'comment']));
  });

  it('every registered shape is nameable from some tool', () => {
    const served = servedEnumValues();
    expect(REGISTRY.map((r) => r.id).filter((id) => !served.has(id)),
      'shapes the engine draws that no tool enum offers').toEqual([]);
  });

  it('the comment module in particular — all eight bubbles', () => {
    // Named separately because losing a whole category is the failure that
    // happened, and a count over 34 would go green again with seven of eight.
    const served = servedEnumValues();
    const bubbles = REGISTRY.filter((r) => r.module === 'comment');
    expect(bubbles.length).toBe(8);
    expect(bubbles.map((b) => b.id).filter((id) => !served.has(id))).toEqual([]);
  });

  it('create_item names no shape the registry lacks', () => {
    // The other direction. `text`, `path`, `line` and `arc` are handled by
    // their own branches in PinePaper.create before the registry is consulted,
    // and shader/field never enter the scene tree at all — so they are
    // legitimately absent from the registry and excluded here BY NAME rather
    // than by a pattern that would also hide a typo.
    const NON_REGISTRY = new Set(['text', 'path', 'line', 'arc', 'shader', 'field']);
    const known = new Set(REGISTRY.map((r) => r.id));
    expect(ItemTypeSchema.options.filter((t) => !known.has(t) && !NON_REGISTRY.has(t)),
      'itemType offers a shape the engine cannot make').toEqual([]);
  });

  it('the two copies of the itemType enum agree', () => {
    // schemas.ts drives validation, definitions.ts is the JSON a model reads.
    // They are hand-maintained copies, which is how four stale stitch lists
    // happened in this same release.
    const served = (PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_item')
      ?.inputSchema as any)?.properties?.itemType?.enum as string[] | undefined;
    expect(served, 'create_item serves no itemType enum').toBeTruthy();
    expect([...served!].sort()).toEqual([...ItemTypeSchema.options].sort());
  });
});
