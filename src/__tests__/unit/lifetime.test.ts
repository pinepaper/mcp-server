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

describe('the studio\'s own lifetime is used when it has one (FxTool bf1a656b)', () => {
  it('passes through to app.setLifetime and registers no callback', () => {
    const s = studio();
    const calls: unknown[] = [];
    s.app.setLifetime = (it: unknown, b: number, t: number | null) => { calls.push([b, t]); return { ok: true, bornAt: b, ttl: t, visible: false }; };
    const r = create(s.app, { bornAt: 2, ttl: 1 });
    expect(calls).toEqual([[2, 1]]);
    expect(r.lifetime).toMatchObject({ applied: true, via: 'engine', persists: true });
    expect(s.callbacks.size).toBe(0);
  });

  it('a refusal from the studio is reported, not claimed', () => {
    const s = studio();
    s.app.setLifetime = () => ({ ok: false, error: 'ttl must be positive' });
    const r = create(s.app, { bornAt: 2, ttl: 1 });
    expect(r.lifetime).toMatchObject({ applied: false, error: 'ttl must be positive' });
  });
});

describe('retest of 28a4a0e', () => {
  it('a lifetime applied after the callbacks were cleared (start_job clearCanvas) registers again', () => {
    const s = studio();
    create(s.app, { bornAt: 0, ttl: 1 });
    s.callbacks.clear(); // what clearCanvas does to frame callbacks
    create(s.app, { bornAt: 2, ttl: 1 });
    expect(s.callbacks.has('pp_lifetimes')).toBe(true);
    s.frame(2.5);
    expect(s.registry.get('item_2')!.item.visible).toBe(true);
  });

  it('a still export at time t shows what is alive at t, without a frame tick', async () => {
    const s = studio();
    create(s.app, { bornAt: 0.8, ttl: 1 });   // item_1: alive at 0.8
    create(s.app, { bornAt: 11, ttl: 1 });    // item_2: dead at 0.8
    s.registry.get('item_1')!.item.visible = false;
    s.registry.get('item_2')!.item.visible = true;
    s.app.canvasSize = { width: 10, height: 10 };
    s.app.setPlaybackTime = () => {};
    s.app.exportEngine = { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) };
    const code = codeGenerator.generateAgentExport({ format: 'png', time: 0.8 } as never);
    await new Function('app', 'document', code.replace('(async function()', 'return (async function()'))(s.app, {});
    expect(s.registry.get('item_1')!.item.visible).toBe(true);
    expect(s.registry.get('item_2')!.item.visible).toBe(false);
  });
});

describe('keyframe_animate append (FxTool 2475333b)', () => {
  // addAnimation as the engine's: replaces, or with mode 'merge' adds (same time: new wins).
  const withEngine = (merges: boolean) => {
    const s = studio();
    s.app.addAnimation = (id: string, kfs: Array<{ time: number }>, opts: { mode?: string }) => {
      const it = s.registry.get(id)!.item;
      if (merges && opts && opts.mode === 'merge' && Array.isArray(it.data.keyframes)) {
        const byT = new Map(it.data.keyframes.map((k: { time: number }) => [k.time, k]));
        for (const k of kfs) byT.set(k.time, k);
        it.data.keyframes = [...byT.values()].sort((a: any, b: any) => a.time - b.time);
      } else it.data.keyframes = kfs;
    };
    create(s.app, {});
    return s;
  };
  const kf = (app: object, keyframes: unknown[], append?: boolean) =>
    new Function('app', `return ${codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes, ...(append ? { append } : {}) } as never).replace(/^\/\/[^\n]*\n/, '')}`)(app);

  it('append adds to the track and says so', () => {
    const s = withEngine(true);
    kf(s.app, [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 100 } }]);
    const r = kf(s.app, [{ time: 2, properties: { scale: 1.2 } }], true);
    expect(s.registry.get('item_1')!.item.data.keyframes.map((k: { time: number }) => k.time)).toEqual([0, 1, 2]);
    expect(r.track).toEqual({ appended: true, previousKeys: 2, keys: 3 });
  });

  it('a studio without merge replaced the track: the result says so', () => {
    const s = withEngine(false);
    kf(s.app, [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 100 } }]);
    const r = kf(s.app, [{ time: 2, properties: { scale: 1.2 } }], true);
    expect(r.track).toMatchObject({ appended: false, replaced: true, previousKeys: 2 });
    expect(r.track.warning).toContain('no merge mode');
  });

  it('without append, replacing an existing track is noted; a first track has no note', () => {
    const s = withEngine(true);
    expect(kf(s.app, [{ time: 0, properties: { x: 0 } }]).track).toBeUndefined();
    expect(kf(s.app, [{ time: 1, properties: { x: 5 } }]).track).toMatchObject({ replaced: true, previousKeys: 1 });
  });
});
