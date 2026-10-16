/**
 * The mcp-server half of three engine-queue items (FxTool claude/engine-core-queue,
 * tester queue 2026-10-14), run against fake studios:
 *   - B154 / 11 HOOKCLOCK3 and 8 ROLLSLIP: pinepaper_choreograph anchors a second
 *     call at app.poseAt(item, firstBeat), writes no t=0 hold key into a track the
 *     actor already has, and rolls on the drawn radius;
 *   - 22 ORBITDUR: moves_along_path with an equation keeps its duration;
 *   - 2 / 5 EASEPLACE: keyframe_animate's text properties and easingAt.
 */
import { describe, it, expect } from 'bun:test';
import { compileChoreography } from '../../tools/choreograph.js';
import { codeGenerator } from '../../types/code-generator.js';
import { ChoreographInputSchema, KeyframeAnimateInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const FRAME = { x: 0, y: 0, width: 1920, height: 1080 };

const runIIFE = (code: string, globals: Record<string, unknown>) =>
  new Function(...Object.keys(globals), code.replace(/^(\s*\/\/.*\n)+/, '').replace(/\((async )?function\(\)/, (m) => `return ${m}`))(...Object.values(globals));

describe('choreograph: the second call (B154 / HOOKCLOCK3, ROLLSLIP)', () => {
  const BALL = { x: 200, y: 300, w: 100, h: 100, sx: 1, sy: 1, rot: 0 };

  it('compiler: no t=0 hold key when merging into a track the actor has', () => {
    const fresh = compileChoreography(BALL, FRAME, [{ at: 1, verb: 'hop', to: [700, 300] }]);
    expect(fresh.keyframes![0].time).toBe(0);                 // B109 kept for a fresh actor
    const merged = compileChoreography({ ...BALL, hasTrack: true }, FRAME, [{ at: 1, verb: 'hop', to: [700, 300] }]);
    expect(merged.keyframes![0].time).toBe(1);
    expect(merged.keyframes!.some((k) => k.time === 0)).toBe(false);
  });

  it('compiler: a roll turns on rollRadius when one is given, the half-box otherwise', () => {
    const disc = { ...BALL, w: 220, h: 220, rollRadius: 100 };
    const r = compileChoreography(disc, FRAME, [{ at: 0, verb: 'roll', to: [200 + 2 * Math.PI * 100, 300] }]);
    expect(r.keyframes!.at(-1)!.properties.rotation).toBeCloseTo(360, 1);
    const box = compileChoreography({ ...disc, rollRadius: undefined }, FRAME, [{ at: 0, verb: 'roll', to: [200 + 2 * Math.PI * 100, 300] }]);
    expect(box.keyframes!.at(-1)!.properties.rotation).toBeCloseTo(327.273, 1);   // today's half-box roll
  });

  function studio(opts: { prev?: Array<Record<string, any>>; poseAt?: ((it: unknown, t: number) => any) | 'throws'; className?: string } = {}) {
    // The live transform is where the PLAYHEAD left the item: x 350, scaled 1.4.
    const item: Record<string, any> = { className: opts.className ?? 'Path', position: { x: 350, y: 300 }, bounds: { width: 140, height: 140 },
      scaling: { x: 1.4, y: 1.4 }, rotation: 0, data: { keyframes: (opts.prev ?? []).slice() } };
    const calls: Array<[unknown, number]> = [];
    const app: Record<string, any> = {
      item, calls,
      getItemById: (id: string) => (id === 'item_1' ? item : null),
      getCanvasSize: () => ({ width: 1920, height: 1080 }),
      addAnimation: (_id: string, keys: Array<Record<string, any>>) => { item.data.keyframes = item.data.keyframes.concat(keys); },
    };
    if (opts.poseAt === 'throws') app.poseAt = () => { throw new Error('boom'); };
    else if (opts.poseAt) app.poseAt = (it: unknown, t: number) => { calls.push([it, t]); return (opts.poseAt as any)(it, t); };
    return app;
  }
  const run = (input: unknown, app: Record<string, any>) =>
    runIIFE(codeGenerator.generateChoreograph(ChoreographInputSchema.parse(input)), { app }) as Record<string, any>;
  const FIRST_TRACK = [
    { time: 0, properties: { x: 200, y: 300, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 } },
    { time: 0.7, properties: { x: 500, y: 300, scaleX: 1, scaleY: 1, rotation: 0, opacity: 1 } },
  ];

  it('anchors at app.poseAt(item, first beat), not the live transform, and keeps the first track\'s key at 0', () => {
    const app = studio({ prev: FIRST_TRACK, poseAt: () => ({ x: 500, y: 300, scaleX: 1, scaleY: 1, rotation: 0, width: 100, height: 100 }) });
    const r = run({ itemId: 'item_1', beats: [{ at: 1.5, verb: 'hop', to: [800, 300] }, { at: 1, verb: 'squash' }] }, app);
    expect(r.success).toBe(true);
    expect(app.calls).toEqual([[app.item, 1]]);                       // the EARLIEST beat
    const added = app.item.data.keyframes.slice(FIRST_TRACK.length);
    expect(added[0].time).toBe(1);
    expect(added[0].properties).toMatchObject({ x: 500, scaleX: 1 });   // not 350, not ×1.4
    expect(added.some((k: any) => k.time === 0)).toBe(false);
    expect(r.warnings).toBeUndefined();
  });

  it('rolls on the drawn radius poseAt measures for a picture', () => {
    const app = studio({ className: 'Raster', poseAt: () => ({ x: 200, y: 300, scaleX: 1, scaleY: 1, rotation: 0, width: 220, height: 220, drawnWidth: 200, drawnHeight: 200 }) });
    run({ itemId: 'item_1', beats: [{ at: 0, verb: 'roll', to: [200 + 2 * Math.PI * 100, 300] }] }, app);
    expect(app.item.data.keyframes.at(-1).properties.rotation).toBeCloseTo(360, 1);
  });

  it('an older studio without poseAt keeps the live anchor and says so for a keyed actor', () => {
    const app = studio({ prev: FIRST_TRACK });
    const r = run({ itemId: 'item_1', beats: [{ at: 1, verb: 'hop', to: [800, 300] }] }, app);
    expect(r.success).toBe(true);
    const added = app.item.data.keyframes.slice(FIRST_TRACK.length);
    expect(added[0].properties.x).toBe(350);                           // today's behaviour
    expect(r.warnings.join(' ')).toContain('poseAt');
  });

  it('an older studio without poseAt says nothing about an actor with no track', () => {
    const r = run({ itemId: 'item_1', beats: [{ at: 0, verb: 'pop' }] }, studio());
    expect(r.success).toBe(true);
    expect(r.warnings).toBeUndefined();
  });

  it('an older studio rolling a picture says the roll used the box', () => {
    const r = run({ itemId: 'item_1', beats: [{ at: 0, verb: 'roll', to: [900, 300] }] }, studio({ className: 'Raster' }));
    expect(r.warnings.join(' ')).toMatch(/roll/);
  });

  it('a poseAt that throws never throws out of the call', () => {
    const app = studio({ prev: FIRST_TRACK, poseAt: 'throws' });
    const r = run({ itemId: 'item_1', beats: [{ at: 1, verb: 'hop', to: [800, 300] }] }, app);
    expect(r.success).toBe(true);
    expect(r.warnings.join(' ')).toContain('poseAt');
  });

  it('a track of other properties still gets the B109 hold key at 0', () => {
    const app = studio({ prev: [{ time: 0, properties: { fillColor: '#f00' } }, { time: 2, properties: { fillColor: '#00f' } }],
      poseAt: () => ({ x: 350, y: 300, scaleX: 1, scaleY: 1, rotation: 0, width: 100, height: 100 }) });
    run({ itemId: 'item_1', beats: [{ at: 1, verb: 'hop', to: [800, 300] }] }, app);
    const added = app.item.data.keyframes.slice(2);
    expect(added[0].time).toBe(0);
  });
});

describe('moves_along_path with an equation keeps its duration (ORBITDUR)', () => {
  const EQ = { kind: 'preset', preset: 'circle', cx: 400, cy: 300, scale: 100 };
  function studio(timedEquations: boolean) {
    const added: unknown[] = [];
    const rule = { params: {
      duration: { description: 'Seconds for one traversal' }, delay: {}, offset: {},
      equation: { description: timedEquations
        ? 'Equation source (S10 B5): traverse a math curve instead of a drawn path, with or without signal; duration, delay and speed time it as they time a points path.'
        : 'Equation source (S10 B5, signal mode): traverse a math curve instead of a drawn path.' },
    } };
    const app = {
      relationRegistry: { getRule: () => rule },
      itemRegistry: { get: () => null },
      addRelation: (...a: unknown[]) => { added.push(a); return true; },
      historyManager: { saveState() {} },
    };
    return { app, added };
  }
  const call = (params: Record<string, unknown>, timed: boolean) => {
    const s = studio(timed);
    const r = runIIFE(codeGenerator.generateAddRelation({ sourceId: 'dot', relationType: 'moves_along_path', params } as never), { app: s.app });
    return { r, params: (s.added[0] as any[])[3] as Record<string, unknown> };
  };

  it('passes duration (and delay on the same clock) through to a studio that times equations', () => {
    const { r, params } = call({ equation: EQ, duration: 4, delay: 1 }, true);
    expect(r.success).toBe(true);
    expect(params).toMatchObject({ equation: EQ, duration: 4, delay: 1 });
    expect(params.window).toBeUndefined();
    expect(r.warnings).toBeUndefined();
  });

  it('an older studio does not get a duration that would lose the curve, and is told', () => {
    const { r, params } = call({ equation: EQ, duration: 4, delay: 1, signal: true }, false);
    expect(r.success).toBe(true);
    expect(params.duration).toBeUndefined();
    expect(params.window).toEqual({ start: 1 });                      // today's delay handling
    expect(r.warnings.join(' ')).toContain('duration');
  });

  it('an equation without duration is unchanged on either studio', () => {
    for (const timed of [true, false]) {
      const { r, params } = call({ equation: EQ, delay: 1, signal: true }, timed);
      expect(params).toEqual({ equation: EQ, signal: true, window: { start: 1 } });
      expect(r.warnings).toBeUndefined();
    }
  });
});

describe('keyframe_animate: text keys and easingAt (2, 5 EASEPLACE)', () => {
  const def = PINEPAPER_TOOLS.find((t: { name: string }) => t.name === 'pinepaper_keyframe_animate')!;

  it('the description lists the text properties and easingAt', () => {
    for (const p of ['fontStyle', 'textAlign', 'lineHeight', 'letterSpacing']) expect(def.description).toContain(p);
    expect(def.description).toContain("easingAt: 'departure'");
    expect((def.inputSchema as any).properties.easingAt.enum).toEqual(['arrival', 'departure']);
    expect((def.inputSchema as any).properties.keyframes.items.properties.easing.description).toContain("easingAt: 'departure'");
    expect(def.description).not.toContain('Easing on the FIRST keyframe does nothing');
  });

  it('the schema takes easingAt and refuses anything else', () => {
    expect(KeyframeAnimateInputSchema.parse({ itemId: 'a', keyframes: [{ time: 0, properties: {} }], easingAt: 'departure' }).easingAt).toBe('departure');
    expect(() => KeyframeAnimateInputSchema.parse({ itemId: 'a', keyframes: [{ time: 0, properties: {} }], easingAt: 'leaving' })).toThrow();
  });

  function studio(opts: { consumesEasingAt: boolean; animatable?: string[] }) {
    const item: Record<string, any> = { data: { keyframes: [] } };
    const seen: Array<Record<string, unknown>> = [];
    const app: Record<string, any> = {
      seen,
      getItemById: () => item,
      addAnimation: (_id: string, keys: unknown[], o: Record<string, unknown>) => {
        seen.push({ ...o });
        if (opts.consumesEasingAt) delete o.easingAt;
        item.data.keyframes = keys;
      },
    };
    if (opts.animatable) app.listAnimatableProperties = () => ({ properties: opts.animatable!.map((name) => ({ name, appliesTo: 'text' })) });
    return app;
  }
  const KEYS = [{ time: 0, properties: { x: 0 }, easing: 'easeOut' }, { time: 1, properties: { x: 100 } }];
  const run = (input: Record<string, unknown>, app: Record<string, any>) =>
    runIIFE(codeGenerator.generateKeyframeAnimate(input as never), { app }) as Record<string, any>;

  it('easingAt reaches addAnimation; a studio that reads it is quiet, one that does not is named', () => {
    const now = studio({ consumesEasingAt: true });
    const r = run({ itemId: 'a', keyframes: KEYS, easingAt: 'departure' }, now);
    expect(now.seen[0].easingAt).toBe('departure');
    expect(r.note).toBeUndefined();                                   // no "first-key easing has no effect"
    expect(r.warning).toBeUndefined();
    const old = run({ itemId: 'a', keyframes: KEYS, easingAt: 'departure' }, studio({ consumesEasingAt: false }));
    expect(old.warning).toContain('easingAt');
  });

  it('without easingAt nothing new is passed, and the first-key note points at easingAt', () => {
    const app = studio({ consumesEasingAt: true });
    const r = run({ itemId: 'a', keyframes: KEYS }, app);
    expect('easingAt' in app.seen[0]).toBe(false);
    expect(r.note).toContain("easingAt: 'departure'");
  });

  it('letterSpacing (and the other text keys) are warned about only where the studio does not animate them', () => {
    const keys = [{ time: 0, properties: { letterSpacing: 0, lineHeight: 1.2 } }, { time: 1, properties: { letterSpacing: 8, lineHeight: 1.6 } }];
    const now = run({ itemId: 'a', keyframes: keys }, studio({ consumesEasingAt: true, animatable: ['letterSpacing', 'leading', 'x'] }));
    expect(now.ignoredProperties).toBeUndefined();
    expect(now.warning).toBeUndefined();
    const old = run({ itemId: 'a', keyframes: keys }, studio({ consumesEasingAt: false, animatable: ['x', 'fontSize'] }));
    expect(old.ignoredProperties).toEqual(['letterSpacing', 'lineHeight']);
    expect(old.warning).toContain('letterSpacing');
    const none = run({ itemId: 'a', keyframes: keys }, studio({ consumesEasingAt: false }));
    expect(none.ignoredProperties).toEqual(['letterSpacing', 'lineHeight']);
  });

  it('batch keyframe_animate checks the same way', async () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [
      { type: 'keyframe_animate', itemId: 'a', keyframes: [{ time: 0, properties: { letterSpacing: 0 } }, { time: 1, properties: { letterSpacing: 5 } }] },
    ] } as never);
    const run2 = (app: Record<string, any>) => new Function('app', 'paper', 'window', 'document', code.replace(/\((async )?function\(\)/, (m) => `return ${m}`))(app, {}, {}, {});
    const now = await run2(studio({ consumesEasingAt: true, animatable: ['letterSpacing'] }));
    const old = await run2(studio({ consumesEasingAt: false, animatable: ['x'] }));
    const flat = (r: any) => JSON.stringify(r);
    expect(flat(now)).not.toContain('ignoredProperties');
    expect(flat(old)).toContain('ignoredProperties');
  });
});
