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
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

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

describe('the widened shapes actually reach the engine', () => {
  /**
   * EXECUTED, NOT INFERRED.
   *
   * I widened the enum after reading generateCreateItemCode and seeing
   * `...baseProperties` spread into params. That is the "grep correct,
   * inference wrong" shape that has cost this repo twice already: the function
   * has type-specific branches — shader and field never call create at all —
   * and reading one of them tells you nothing about the default path. If the
   * emitter dropped the type or emitted a refusal, widening the enum would
   * have shipped a dead door, which is a worse version of the bug it fixed.
   *
   * So the emitted code RUNS against a stub that records what create() was
   * handed.
   */
  const emit = (itemType: string, properties: Record<string, unknown>) => {
    const calls: unknown[][] = [];
    const app = {
      create: (...a: unknown[]) => { calls.push(a); return { id: 'i1', data: {} }; },
      historyManager: { saveState: () => {} },
      getItems: () => [],
      updateLayersList: () => {},
    };
    const code = new PinePaperCodeGenerator().generateCreateItem({
      itemType, position: { x: 100, y: 100 }, properties,
    } as any);
    try { new Function('app', 'return eval(' + JSON.stringify(code) + ');')(app); } catch { /* the stub is partial; the call is what matters */ }
    return calls[0] as [string, Record<string, unknown>] | undefined;
  };

  it('a bubble reaches create with its tail parameters intact', () => {
    const call = emit('speech-bubble', { tailDirection: 'right', tailSize: 0.5, color: '#f00' });
    expect(call, 'create was never called for speech-bubble').toBeTruthy();
    expect(call![0]).toBe('speech-bubble');
    // tailDirection/tailSize exist ONLY for bubbles and the engine reads them
    // off the same config object. Dropped here, every bubble silently takes
    // the default tail and the parameter looks broken rather than unsupported.
    expect(call![1].tailDirection).toBe('right');
    expect(call![1].tailSize).toBe(0.5);
  });

  it('double-bubble carries secondaryColor, its one distinctive property', () => {
    const call = emit('double-bubble', { secondaryColor: '#00f' });
    expect(call![0]).toBe('double-bubble');
    expect(call![1].secondaryColor).toBe('#00f');
  });

  it('a newly exposed basic shape reaches create under its own name', () => {
    for (const t of ['disk', 'circle-outline', 'arrow-right']) {
      const call = emit(t, { radius: 40, color: '#0f0' });
      expect(call?.[0], `${t} never reached app.create`).toBe(t);
    }
  });
});
