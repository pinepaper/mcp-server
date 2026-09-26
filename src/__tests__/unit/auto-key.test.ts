/**
 * Agent auto-key (plan C5a): modify_item {atTime} writes keys, not a static
 * edit, and keeps the rest of the track whole. query_mutations reads it back.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator, generateQueryMutationsCode } from '../../types/code-generator.js';

type Key = { time: number; properties: Record<string, unknown>; easing?: string };
function studio(track: Key[] = [], merges = true, statics: Record<string, unknown> = {}) {
  const item: Record<string, any> = { data: { keyframes: track.map((k) => ({ ...k, properties: { ...k.properties } })) }, position: { x: 100, y: 50 }, opacity: 1, fillColor: { toCSS: () => '#3366ff' }, ...statics };
  const app = {
    getItemById: (id: string) => (id === 'item_1' ? item : null),
    historyManager: { saveState() {} },
    // The engine's merge: same-time keys merge properties, the new values win.
    addAnimation: (_id: string, keys: Key[], o: { mode?: string }) => {
      if (merges && o.mode === 'merge' && item.data.keyframes.length) {
        const by = new Map<number, Key>(item.data.keyframes.map((k: Key) => [k.time, { ...k, properties: { ...k.properties } }]));
        for (const k of keys) { const e = by.get(k.time); by.set(k.time, e ? { ...e, ...k, properties: { ...e.properties, ...k.properties } } : k); }
        item.data.keyframes = [...by.values()].sort((a, b) => a.time - b.time);
      } else item.data.keyframes = keys;
    },
    // Linear, per property, over the keys that carry it.
    getInterpolatedState: (it: any, t: number) => {
      const out: Record<string, unknown> = {};
      const props = new Set<string>(it.data.keyframes.flatMap((k: Key) => Object.keys(k.properties)));
      for (const p of props) {
        const ks = it.data.keyframes.filter((k: Key) => p in k.properties);
        const a = [...ks].reverse().find((k: Key) => k.time <= t) ?? ks[0], b = ks.find((k: Key) => k.time >= t) ?? ks[ks.length - 1];
        const va = a.properties[p], vb = b.properties[p];
        out[p] = typeof va === 'number' && typeof vb === 'number' && b.time !== a.time ? va + (vb - va) * (t - a.time) / (b.time - a.time) : (t >= b.time ? vb : va);
      }
      return out;
    },
  };
  return { app, item };
}
const autoKey = (app: object, properties: Record<string, unknown>, atTime: number) =>
  new Function('app', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties, atTime } as never).replace(/^\/\/[^\n]*\n/, '')}`)(app);

describe('modify_item atTime (auto-key)', () => {
  it('a property with no track eases in from its value before t', () => {
    const s = studio();
    const r = autoKey(s.app, { x: 300 }, 2);
    expect(s.item.data.keyframes).toEqual([{ time: 0, properties: { x: 100 } }, { time: 2, properties: { x: 300 } }]);
    expect(r.changes[0]).toMatchObject({ property: 'x', before: 100, after: 300 });
  });

  it('a new property joins an animated track without breaking the others', () => {
    const s = studio([{ time: 0, properties: { opacity: 0 } }, { time: 2, properties: { opacity: 1 } }]);
    autoKey(s.app, { fillColor: 'orange' }, 4);
    const ks: Key[] = s.item.data.keyframes;
    expect(ks.map((k) => k.time)).toEqual([0, 2, 4]);
    // Every key carries both properties: no gaps.
    expect(ks.every((k) => 'opacity' in k.properties && 'fillColor' in k.properties)).toBe(true);
    expect(ks[0].properties.fillColor).toBe('#3366ff');              // its old value before t
    expect(ks[2].properties).toEqual({ opacity: 1, fillColor: 'orange' }); // the other property as it is at t
  });

  it('keying an animated property mid-track keeps the other keys, carrying others at t', () => {
    const s = studio([{ time: 0, properties: { x: 0, opacity: 0 } }, { time: 4, properties: { x: 400, opacity: 1 } }]);
    autoKey(s.app, { x: 100 }, 2);
    expect(s.item.data.keyframes).toEqual([
      { time: 0, properties: { x: 0, opacity: 0 } },
      { time: 2, properties: { x: 100, opacity: 0.5 } },
      { time: 4, properties: { x: 400, opacity: 1 } },
    ]);
  });

  it('a studio without merge is reported, not claimed', () => {
    const s = studio([{ time: 0, properties: { opacity: 0 } }, { time: 2, properties: { opacity: 1 } }], false);
    const r = autoKey(s.app, { opacity: 0.2 }, 3);
    expect(r.success).toBe(false);
    expect(r.error).toContain('replaced the track');
  });
});

describe('query_mutations', () => {
  it('returns each property\'s series, filtered by property and range', () => {
    const s = studio([{ time: 0, properties: { x: 0, opacity: 0 } }, { time: 2, properties: { x: 100 }, easing: 'easeOut' }, { time: 4, properties: { x: 400, opacity: 1 } }]);
    const run = (p?: string, r?: [number, number]) => new Function('app', `return ${generateQueryMutationsCode('item_1', p, r, 24).replace(/^\/\/[^\n]*\n/, '')}`)(s.app);
    expect(run('x').series.x).toEqual([{ t: 0, frame: 0, value: 0, easing: null }, { t: 2, frame: 48, value: 100, easing: 'easeOut' }, { t: 4, frame: 96, value: 400, easing: null }]);
    expect(Object.keys(run(undefined, [1, 3]).series)).toEqual(['x']);
    expect(run().source).toBe('keyframes');
  });
});
