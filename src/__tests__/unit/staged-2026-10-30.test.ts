/**
 * The server halves of the Oct 30 staged findings.
 *
 * VELOC23 / VELOCMISMATCH23: the studio reads emitter velocities as [x, y]
 * pairs only, so [{x, y}] gave particles no velocity; and a burst takes
 * velocities[i % length], so a count that differs from the list silently
 * repeats or drops velocities. B108: create() and modifyItem() do not read
 * letterSpacing, which keyframes set on the item itself.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen, normalizeEmitterSpec } from '../../types/code-generator.js';

describe('emitter velocities', () => {
  it('point objects become the [x, y] pairs the studio reads, in the spec and in each burst', () => {
    const { spec } = normalizeEmitterSpec({ velocities: [{ x: 10, y: -20 }, [3, 4]], bursts: [{ t: 0, x: 0, y: 0, count: 2, offsets: [{ x: 1, y: 2 }, { x: 5 }] }] });
    expect(spec.velocities).toEqual([[10, -20], [3, 4]]);
    expect((spec.bursts as Array<Record<string, unknown>>)[0].offsets).toEqual([[1, 2], [5, 0]]);
    const code = gen.generateEmitter({ action: 'create', spec: { bursts: [{ t: 0, x: 0, y: 0, count: 1 }], velocities: [{ x: 7, y: 8 }], count: 1 } } as never);
    expect(code).toContain('"velocities":[[7,8]]');
  });

  it('a count that differs from the velocities is said, both ways, and an exact match is not', () => {
    const more = normalizeEmitterSpec({ bursts: [{ t: 0, x: 0, y: 0, count: 6, velocities: [[1, 0], [0, 1]] }] }).warnings;
    expect(more.join(' ')).toContain('bursts[0]: count 6 with 2 velocities');
    expect(more.join(' ')).toContain('4 particles repeat');
    const fewer = normalizeEmitterSpec({ count: 2, velocities: [[1, 0], [0, 1], [1, 1]], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings;
    expect(fewer).toEqual([expect.stringContaining('only the first 2 velocities are used')]);
    // The studio's default of 12 applies when a burst inherits no count.
    expect(normalizeEmitterSpec({ velocities: [[1, 0]], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings.join(' ')).toContain('count 12 with 1 velocities');
    expect(normalizeEmitterSpec({ count: 4, velocities: [[1, 0], [0, 1], [1, 1], [2, 2]], bursts: [{ t: 0, x: 0, y: 0 }] }).warnings).toEqual([]);
    // A set patch is only the keys changed: no count there is not the default.
    expect(normalizeEmitterSpec({ velocities: [[1, 0]] }, false).warnings).toEqual([]);
  });

  it('the warning reaches the reply', () => {
    const code = gen.generateEmitter({ action: 'create', spec: { bursts: [{ t: 0, x: 0, y: 0, count: 3, velocities: [[1, 0]] }] } } as never);
    const app = { setEmitter() {}, create: () => ({ data: { registryId: 'em_1' } }) };
    const r = new Function('app', `return (${code.trim().replace(/;\s*$/, '')});`)(app);
    expect(r.success).toBe(true);
    expect(r.warnings.join(' ')).toContain('count 3 with 1 velocities');
  });
});

describe('letterSpacing (B108)', () => {
  it('create sets it on the text item, as a CSS length, and does not call it ignored', () => {
    const code = gen.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'hi', letterSpacing: 4 } } as never);
    expect(code).toContain('it.letterSpacing = "4px";');
    expect(code).not.toContain('ignoredProperties');
    expect(gen.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'hi', letterSpacing: '0.1em' } } as never)).toContain('it.letterSpacing = "0.1em";');
  });

  it('a value the studio cannot draw, or a non-text item, is still reported', () => {
    expect(gen.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'hi', letterSpacing: 'wide' } } as never)).toContain('ignoredProperties: ["letterSpacing"]');
    expect(gen.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: { radius: 4, letterSpacing: 4 } } as never)).toContain('ignoredProperties: ["letterSpacing"]');
  });

  it('modify sets it too, without the false "not read" warning', () => {
    const code = gen.generateModifyItem({ itemId: 'item_1', properties: { letterSpacing: 2 } } as never);
    expect(code).toContain('it.letterSpacing = "2px";');
    expect(code).not.toContain('not read when modifying');
  });
});
