/**
 * bornAt / ttl are a VISIBILITY WINDOW [bornAt, bornAt + ttl), set by one
 * frame callback — not keys in the item's opacity track.
 *
 * The first design (5bfc480) merged hard-cut opacity keys into the item's own
 * track and failed four ways alongside real keyframes (ads production, round
 * 9): 1.83 keyframe_animate replaced the track and lost the ttl cut; 1.84
 * opacity-only keys broke the position track (engine 2.30); 1.85 authored
 * opacity blended with the cuts; 1.86 exact-time hand-offs left a blank frame.
 * Each is a case below, against a stub engine that runs frame callbacks the
 * way the export does (sceneTime on the event).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function studio(withCallbacks = true) {
  const registry = new Map<string, { item: Record<string, any> }>();
  const callbacks = new Map<string, (ev: { sceneTime: number }) => void>();
  let n = 0;
  const app: Record<string, any> = {
    playbackTime: 0,
    create: () => {
      const id = `item_${++n}`;
      const item: Record<string, any> = { opacity: 1, visible: true, data: { registryId: id }, bringToFront() {} };
      registry.set(id, { item });
      return item;
    },
    itemRegistry: { get: (id: string) => registry.get(id) ?? null },
    modifyItem: () => true,
    getItemById: (id: string) => registry.get(id)?.item,
    historyManager: { saveState() {} },
    addAnimation: (id: string, kfs: unknown[]) => { registry.get(id)!.item.data.keyframes = kfs; },
  };
  if (withCallbacks) app.addOnFrameCallback = (id: string, fn: (ev: { sceneTime: number }) => void) => { callbacks.set(id, fn); return true; };
  const frame = (t: number) => callbacks.forEach((fn) => fn({ sceneTime: t }));
  return { app, registry, callbacks, frame };
}

const create = (app: object, properties: Record<string, unknown>) => {
  const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 0, y: 0 }, properties });
  return new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
};
const modify = (app: object, id: string, properties: Record<string, unknown>) =>
  new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: id, properties })}`)(app, {});
const keyframe = (app: object, id: string, keyframes: unknown[]) =>
  new Function('app', `return ${codeGenerator.generateKeyframeAnimate({ itemId: id, keyframes } as never).replace(/^\/\/[^\n]*\n/, '')}`)(app);

describe('lifetimes are a visibility window', () => {
  it('hidden before bornAt, shown for ttl, hidden after — by visible, with opacity untouched', () => {
    const s = studio();
    const r = create(s.app, { width: 10, height: 10, bornAt: 2, ttl: 1 });
    expect(r.lifetime).toMatchObject({ bornAt: 2, ttl: 1, applied: true, via: 'visibility' });
    const it = s.registry.get('item_1')!.item;
    const vis = (t: number) => { s.frame(t); return it.visible; };
    expect([vis(0), vis(1.99), vis(2), vis(2.5), vis(2.999), vis(3), vis(5)]).toEqual([false, false, true, true, true, false, false]);
    expect(it.opacity).toBe(1);
    expect(it.data.keyframes).toBeUndefined(); // no keys written
  });

  it('1.83: keyframe_animate after the lifetime keeps the window', () => {
    const s = studio();
    create(s.app, { bornAt: 0.5, ttl: 0.5 });
    keyframe(s.app, 'item_1', [{ time: 0, properties: { x: 0 } }, { time: 2, properties: { x: 100 } }]);
    s.frame(1.2);
    expect(s.registry.get('item_1')!.item.visible).toBe(false);
  });

  it('1.84 / 1.85: nothing is merged into the item\'s own track, so authored keys stay whole', () => {
    const s = studio();
    create(s.app, {});
    keyframe(s.app, 'item_1', [{ time: 0, properties: { y: 800, opacity: 0 } }, { time: 1, properties: { y: 600, opacity: 1 } }]);
    modify(s.app, 'item_1', { bornAt: 0, ttl: 3.3 });
    // (The keyframe schema adds easing: 'linear'; only time + properties matter here.)
    const kfs = s.registry.get('item_1')!.item.data.keyframes.map((k: { time: number; properties: object }) => ({ time: k.time, properties: k.properties }));
    expect(kfs).toEqual([{ time: 0, properties: { y: 800, opacity: 0 } }, { time: 1, properties: { y: 600, opacity: 1 } }]);
  });

  it('1.86: back-to-back lifetimes at an exact frame time show exactly one', () => {
    const s = studio();
    create(s.app, { bornAt: 0, ttl: 2.5 });
    create(s.app, { bornAt: 2.5, ttl: 2.5 });
    for (const t of [75 / 30, 2.5, 74 / 30, 76 / 30]) {
      s.frame(t);
      const shown = ['item_1', 'item_2'].filter((id) => s.registry.get(id)!.item.visible);
      expect([t, shown.length]).toEqual([t, 1]);
    }
  });

  it('one shared callback, however many items; re-timing replaces', () => {
    const s = studio();
    for (let i = 0; i < 12; i++) create(s.app, { bornAt: i / 12, ttl: 1 / 12 });
    expect(s.callbacks.size).toBe(1);
    modify(s.app, 'item_1', { bornAt: 5, ttl: 1 });
    s.frame(0.01);
    expect(s.registry.get('item_1')!.item.visible).toBe(false);
    s.frame(5.5);
    expect(s.registry.get('item_1')!.item.visible).toBe(true);
  });

  it('migrates a lifetime written the old way: its tagged opacity keys are removed', () => {
    const s = studio();
    create(s.app, {});
    const it = s.registry.get('item_1')!.item;
    it.data.keyframes = [{ time: 0, properties: { opacity: 0 }, _lifetime: true }, { time: 1, properties: { x: 5 } }];
    modify(s.app, 'item_1', { bornAt: 1, ttl: 1 });
    expect(it.data.keyframes).toEqual([{ time: 1, properties: { x: 5 } }]);
  });

  it('a studio without frame callbacks says so instead of claiming it', () => {
    const s = studio(false);
    const r = create(s.app, { bornAt: 2, ttl: 1 });
    expect(r.lifetime.applied).toBe(false);
    expect(r.lifetime.note).toContain('whole local render');
  });
});
