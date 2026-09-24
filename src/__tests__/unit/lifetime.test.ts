/**
 * bornAt / ttl become hard-cut opacity keyframes (round 6 U, 1.40).
 *
 * The engine has no lifetime: create() and modifyItem() never read them, so a
 * 36-frame boil showed every frame at once. Run against a stub engine whose
 * addKeyframe behaves like the real one (appends to item.data.keyframes).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function engine(withKeyframes = true) {
  const item: { opacity: number; data: Record<string, any>; bringToFront(): void } = {
    opacity: 1, data: { registryId: 'item_1' }, bringToFront() {},
  };
  const app: Record<string, any> = {
    create: () => item,
    historyManager: { saveState() {} },
    itemRegistry: { get: () => ({ type: 'rectangle', item }) },
    modifyItem: () => true,
  };
  if (withKeyframes) {
    app.addKeyframe = (it: typeof item, time: number, properties: object) => {
      (it.data.keyframes ||= []).push({ time, properties });
    };
  }
  return { item, app };
}

const runCreate = (app: object, properties: Record<string, unknown>) => {
  const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 0, y: 0 }, properties });
  return new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
};
const runModify = (app: object, properties: Record<string, unknown>) =>
  new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties })}`)(app, {});
const opacityAt = (kfs: Array<{ time: number; properties: { opacity: number } }>) =>
  kfs.map((k) => [k.time, k.properties.opacity]);

describe('lifetimes are cuts, not ignored', () => {
  it('create: absent before bornAt, present for ttl, absent after', () => {
    const { app, item } = engine();
    const r = runCreate(app, { width: 10, height: 10, bornAt: 2, ttl: 1 });
    expect(r.lifetime).toEqual({ bornAt: 2, ttl: 1, applied: true });
    expect(opacityAt(item.data.keyframes)).toEqual([[0, 0], [1.999, 0], [2, 1], [2.999, 1], [3, 0]]);
    expect(item.data).toMatchObject({ bornAt: 2, ttl: 1 });
    expect(r.ignoredProperties).toBeUndefined();
  });

  it("the 'on' level is the item's own opacity", () => {
    const { app, item } = engine();
    runCreate(app, { opacity: 0.4, bornAt: 1 });
    expect(opacityAt(item.data.keyframes)).toContainEqual([1, 0.4]);
  });

  it('modify re-times an item: the old cuts are replaced, not stacked', () => {
    const { app, item } = engine();
    runCreate(app, { bornAt: 2, ttl: 1 });
    const r = runModify(app, { bornAt: 5, ttl: 2 });
    expect(r.lifetime).toEqual({ bornAt: 5, ttl: 2, applied: true });
    expect(opacityAt(item.data.keyframes)).toEqual([[0, 0], [4.999, 0], [5, 1], [6.999, 1], [7, 0]]);
  });

  it('back-to-back lifetimes never both show on the boundary frame (half-open)', () => {
    const a = engine(); runCreate(a.app, { bornAt: 0, ttl: 1 / 12 });
    const b = engine(); runCreate(b.app, { bornAt: 1 / 12, ttl: 1 / 12 });
    // Step-sample each track at the boundary, as a frame at t = 1/12 would.
    const at = (kfs: Array<{ time: number; properties: { opacity: number } }>, t: number) =>
      kfs.filter((k) => k.time <= t + 1e-12).at(-1)?.properties.opacity ?? 0;
    expect(at(a.item.data.keyframes, 1 / 12)).toBe(0);
    expect(at(b.item.data.keyframes, 1 / 12)).toBe(1);
  });

  it('a studio with no keyframe API says so instead of claiming it', () => {
    const { app } = engine(false);
    const r = runCreate(app, { bornAt: 2, ttl: 1 });
    expect(r.lifetime.applied).toBe(false);
    expect(r.lifetime.note).toContain('whole local render');
  });
});
