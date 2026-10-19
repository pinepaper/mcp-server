/**
 * The mcp-server half of the engine media queue (FxTool claude/engine-media-queue,
 * tester queue 2026-10-14). Each block fails on the branch before it.
 *
 *  - Emitter       jitter is ±jitter px from birth (jitterGrow keeps the ramp),
 *                  the burst cap is 10000 (2000 before), spin is clockwise,
 *                  a capped fade warns. The reply names the count the studio
 *                  actually drew, read back from the spec it stored.
 *  - 9 TABNUM      tabularFigures.applied comes from app.tabularFiguresReport,
 *                  never from the request flag; without it, 'unverified'.
 *  - 17 RADIALOFFSET  a radial gradient's origin and radius come from the
 *                  created item's bounds, not the requested x/y and 50 px.
 *  - 21 PLATFORMOVERRIDE  a named preset that sizes the file away from the
 *                  canvas is said; the canvas itself is never resized.
 *  - 12 fillOpacity / fillColor 'none' on text create and modify.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { CreateItemInputSchema, ModifyItemInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS as TOOL_DEFINITIONS } from '../../tools/definitions.js';

/** Run emitted code against a fake studio. Leading comment lines are dropped, as the governor does. */
function run<T = Record<string, any>>(code: string, app: Record<string, unknown>, extra: Record<string, unknown> = {}): T {
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  const names = Object.keys(extra);
  return new Function('app', 'window', ...names, `return ${body}`)(app, {}, ...names.map((n) => extra[n])) as T;
}

/** A create_item call's code, as a function returning its result object. */
function runCreate(input: Record<string, unknown>, app: Record<string, unknown>): Record<string, any> {
  const code = codeGenerator.generateCreateItem(CreateItemInputSchema.parse(input) as never);
  return new Function('app', 'window', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app, {});
}

const description = (name: string) => {
  const t = TOOL_DEFINITIONS.find((d) => d.name === name);
  if (!t) throw new Error(`no tool ${name}`);
  return t.description;
};

describe('pinepaper_emitter describes the current engine without lying about older studios', () => {
  const d = description('pinepaper_emitter');

  it('jitter is ±jitter px from birth; jitterGrow keeps the ramp; the old ±jitter/2 is named as older', () => {
    expect(d).toMatch(/jitter: PIXELS — on the current studio each particle is displaced up to ±jitter px on each axis from its path, at full size from birth/);
    expect(d).toMatch(/jitterGrow: true keeps the older ramp/);
    // The old wording, stated as the current behaviour, is gone.
    expect(d).not.toMatch(/jitter: PIXELS of total spread — each particle drifts up to ±jitter\/2/);
    expect(d).toMatch(/Older studios \(before jitterGrow\) displace up to ±jitter\/2/);
  });

  it('spin is degrees per second, clockwise; circles show none', () => {
    expect(d).toMatch(/spin: DEGREES PER SECOND, positive = clockwise/);
    expect(d).toMatch(/a circle has no orientation, so spin on circles shows nothing/);
  });

  it('fadeOut is capped at the lifetime, with a warning', () => {
    expect(d).toMatch(/fadeOut is capped at that particle's lifetime/);
    expect(d).toMatch(/the current studio warns when it caps one/);
  });

  it('the cap is 10000, and 2000 only for older studios', () => {
    expect(d).toMatch(/at most 10000 on the current studio \(2000 on older studios\)/);
    expect(d).not.toMatch(/at most 2000 —/);
  });
});

describe('emitter count warnings follow the cap the studio actually applied', () => {
  /** A studio whose create stores the normalised spec with counts clamped at `cap`. */
  const studio = (cap: number | null) => ({
    setEmitter: (_id: string, patch: Record<string, any>) => ({ ok: true, spec: cap === null ? undefined : clamp(patch, cap) }),
    create: (_t: string, spec: Record<string, any>) => ({ data: { id: 'item_9', ...(cap === null ? {} : { emitter: clamp(spec, cap) }) } }),
  });
  const clamp = (spec: Record<string, any>, cap: number) => ({
    ...spec,
    count: Math.min(cap, spec.count ?? 12),
    bursts: (spec.bursts ?? []).map((b: Record<string, any>) => (b.count === undefined ? b : { ...b, count: Math.min(cap, b.count) })),
  });
  const spec = { bursts: [{ t: 0, x: 0, y: 0, count: 2300 }, { t: 1, x: 0, y: 0, count: 12000 }, { t: 2, x: 0, y: 0, count: 1500 }] };

  it('the current studio (10000): 2300 is drawn as asked, 12000 is said with the number drawn', () => {
    const r = run(codeGenerator.generateEmitter({ action: 'create', spec } as never), studio(10000));
    expect(r.success).toBe(true);
    expect(r.warnings).toEqual([expect.stringContaining('bursts[1].count 12000 is over this studio\'s per-burst cap, so it draws 10000')]);
  });

  it('an older studio (2000): 2300 is said as drawn 2000', () => {
    const r = run(codeGenerator.generateEmitter({ action: 'create', spec } as never), studio(2000));
    expect(r.warnings).toEqual([
      expect.stringContaining('bursts[0].count 2300 is over this studio\'s per-burst cap, so it draws 2000'),
      expect.stringContaining('bursts[1].count 12000 is over this studio\'s per-burst cap, so it draws 2000'),
    ]);
  });

  it('nothing over any cap: no warnings key', () => {
    const r = run(codeGenerator.generateEmitter({ action: 'create', spec: { bursts: [{ t: 0, x: 0, y: 0, count: 2000 }] } } as never), studio(2000));
    expect(r.warnings).toBeUndefined();
  });

  it('set reads the merged spec the studio returns, including the spec-level count', () => {
    const r = run(codeGenerator.generateEmitter({ action: 'set', itemId: 'item_9', spec: { count: 5000 } } as never), studio(2000));
    expect(r.warnings).toEqual([expect.stringContaining('count 5000 is over this studio\'s per-burst cap, so it draws 2000')]);
    expect(run(codeGenerator.generateEmitter({ action: 'set', itemId: 'item_9', spec: { count: 5000 } } as never), studio(10000)).warnings).toBeUndefined();
  });

  it('a studio that stores nothing readable gets what is known without it, naming both caps', () => {
    const r = run(codeGenerator.generateEmitter({ action: 'create', spec } as never), studio(null));
    expect(r.warnings).toHaveLength(2);
    expect(r.warnings[0]).toContain('bursts[0].count 2300');
    expect(r.warnings[0]).toContain('on an older studio it draws 2000');
    expect(r.warnings[1]).toContain('bursts[1].count 12000 is over the 10000-particle cap per burst of the current studio');
  });
});

describe('9 TABNUM: tabularFigures.applied is the engine\'s measurement, not the request flag', () => {
  const studio = (opts: { records: boolean; report?: unknown; throws?: boolean }) => {
    const item: Record<string, any> = { className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} };
    const take = (p: Record<string, unknown>) => { if (opts.records && p.tabularFigures === true) item.data.tabularFigures = true; };
    const app: Record<string, unknown> = {
      create: (_t: string, p: Record<string, unknown>) => { take(p); return item; },
      modifyItem: (_id: string, ch: Record<string, unknown>) => { take(ch); return true; },
      getItemById: () => item, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} },
    };
    if ('report' in opts || opts.throws) {
      app.tabularFiguresReport = () => { if (opts.throws) throw new Error('no view'); return opts.report; };
    }
    return app;
  };
  const create = (app: Record<string, unknown>) => runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: '1111', tabularFigures: true } }, app);

  it('a font whose digits are already one width: applied false, with the engine\'s reason', () => {
    const r = create(studio({ records: true, report: { applied: false, steadyWidth: true, reason: 'font-digits-already-equal', note: 'DejaVu Sans\'s digits are already one width', spread: 0 } }));
    expect(r.tabularFigures).toMatchObject({ applied: false, steadyWidth: true, reason: 'font-digits-already-equal', digitSpread: 0 });
    expect(r.tabularFigures.note).toContain('already one width');
  });

  it('a measured change: applied true, and the widths come back', () => {
    const r = create(studio({ records: true, report: { applied: true, steadyWidth: true, spread: 14.36, width: { proportional: 97.62, tabular: 155.04 } } }));
    expect(r.tabularFigures).toEqual({ applied: true, steadyWidth: true, digitSpread: 14.36, width: { proportional: 97.62, tabular: 155.04 } });
  });

  it('the report decides even when the flag is set: rtl is not applied', () => {
    const r = create(studio({ records: true, report: { applied: false, steadyWidth: false, reason: 'rtl' } }));
    expect(r.tabularFigures.applied).toBe(false);
    expect(r.tabularFigures.reason).toBe('rtl');
  });

  it('a studio without tabularFiguresReport that recorded the flag: unverified, never true', () => {
    expect(create(studio({ records: true })).tabularFigures.applied).toBe('unverified');
  });

  it('a studio that neither records nor measures: false', () => {
    expect(create(studio({ records: false })).tabularFigures.applied).toBe(false);
  });

  it('a report that throws or returns nothing is unverified', () => {
    expect(create(studio({ records: true, throws: true })).tabularFigures.applied).toBe('unverified');
    expect(create(studio({ records: true, report: null })).tabularFigures.applied).toBe('unverified');
  });

  it('modify_item asks the engine too', () => {
    const app = studio({ records: true, report: { applied: true, steadyWidth: true } });
    const r = run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { tabularFigures: true } }), app);
    expect(r.tabularFigures).toMatchObject({ applied: true });
  });
});

describe('17 RADIALOFFSET: a radial gradient is centred on the created item, not the requested point', () => {
  const G = { type: 'radial', stops: [{ color: '#ff0000', offset: 0 }, { color: '#0000ff', offset: 1 }] };
  const studio = (bounds: Record<string, number> | null) => {
    const item: Record<string, any> = { data: { registryId: 'item_1' }, bounds, bringToFront() {} };
    return { item, app: { create: () => item, getItemById: () => item, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } } };
  };

  it('an item placed by its top-left corner gets its core at its own centre, radius = half its width', () => {
    const s = studio({ x: 100, y: 100, width: 300, height: 200 });
    runCreate({ itemType: 'rectangle', position: { x: 100, y: 100 }, properties: { width: 300, height: 200, anchor: 'top-left', fillColor: G } }, s.app);
    expect(s.item.fillColor.origin).toEqual([250, 200]);
    expect(s.item.fillColor.destination).toEqual([400, 200]);
    expect(s.item.fillColor.gradient.radial).toBe(true);
  });

  it('a 300 px circle gets a 150 px radius, not 50', () => {
    const s = studio({ x: 250, y: 150, width: 300, height: 300 });
    runCreate({ itemType: 'circle', position: { x: 400, y: 300 }, properties: { radius: 150, color: G } }, s.app);
    expect(s.item.fillColor.origin).toEqual([400, 300]);
    expect(s.item.fillColor.destination).toEqual([550, 300]);
  });

  it('a stroke gradient is measured the same way', () => {
    const s = studio({ x: 0, y: 0, width: 100, height: 100 });
    runCreate({ itemType: 'circle', position: { x: 0, y: 0 }, properties: { radius: 50, strokeColor: G } }, s.app);
    expect(s.item.strokeColor.origin).toEqual([50, 50]);
  });

  it('an origin the caller gave is kept; the radius still comes from the item', () => {
    const s = studio({ x: 0, y: 0, width: 200, height: 200 });
    runCreate({ itemType: 'circle', position: { x: 100, y: 100 }, properties: { radius: 100, fillColor: { ...G, origin: [80, 60] } } }, s.app);
    expect(s.item.fillColor.origin).toEqual([80, 60]);
    expect(s.item.fillColor.destination).toEqual([180, 60]);
  });

  it('an item with no bounds falls back to the requested point', () => {
    const s = studio(null);
    runCreate({ itemType: 'circle', position: { x: 500, y: 400 }, properties: { radius: 50, fillColor: G } }, s.app);
    expect(s.item.fillColor.origin).toEqual([500, 400]);
    expect(s.item.fillColor.destination).toEqual([550, 400]);
  });

  it('a linear gradient is unchanged', () => {
    const code = codeGenerator.generateCreateItem(CreateItemInputSchema.parse({ itemType: 'rectangle', position: { x: 200, y: 200 }, properties: { fillColor: { ...G, type: 'linear' } } }) as never);
    expect(code).toContain('origin: [150, 150]');
    expect(code).toContain('destination: [250, 250]');
  });
});

describe('21 PLATFORMOVERRIDE: a preset that sizes the file away from the canvas says so; the canvas is kept', () => {
  const body = (code: string) => code.replace('(async function()', 'return (async function()');
  const exportPng = async (canvas: { width: number; height: number; unbounded?: boolean }, platform: string) => {
    let resized = 0;
    const app: Record<string, any> = {
      canvasSize: { ...canvas }, canvasEl: { style: { backgroundColor: '#000' } },
      setCanvasSize: () => { resized++; return { ok: true }; },
      setPlaybackTime: () => {}, getCanvasSize: () => canvas,
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        exportPNG: async (o: { scale?: number }) => ({ dataUrl: 'data:image/png;base64,AA', width: Math.round(canvas.width * (o?.scale ?? 1)), height: Math.round(canvas.height * (o?.scale ?? 1)) }),
      },
      captureFrameDataURL: () => 'data:image/png;base64,AA',
    };
    const code = codeGenerator.generateAgentExport({ format: 'png', platform } as never);
    const r = await new Function('app', 'window', 'document', body(code))(app, {}, {});
    return { r, resized, app };
  };

  it('a 640x360 canvas under youtube: the file is 1920x1080 and that is said, the canvas untouched', async () => {
    const { r, resized, app } = await exportPng({ width: 640, height: 360 }, 'youtube');
    expect(r.success).toBe(true);
    expect(resized).toBe(0);
    expect(app.canvasSize).toEqual({ width: 640, height: 360 });
    expect(r.platformSize).toEqual({ preset: '1920x1080', canvas: '640x360', file: '1920x1080', scale: 3, canvasResized: false });
    const w = (r.fidelity?.warnings ?? []).find((x: { code: string }) => x.code === 'platform_size_differs_from_canvas');
    expect(w?.message).toContain('640x360');
    expect(w?.message).toContain("platform: 'auto'");
  });

  it('a canvas at the preset size says nothing', async () => {
    const { r } = await exportPng({ width: 1920, height: 1080 }, 'youtube');
    expect(r.success).toBe(true);
    expect(r.platformSize).toBeUndefined();
    expect((r.fidelity?.warnings ?? []).map((x: { code: string }) => x.code)).not.toContain('platform_size_differs_from_canvas');
  });

  const exportMp4 = async (canvas: { width: number; height: number }, platform: string, scale?: number) => {
    const asked: Array<Record<string, unknown>> = [];
    const app: Record<string, any> = {
      canvasSize: { ...canvas }, canvasEl: { style: { backgroundColor: '#000' } },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        exportToStore: async (o: Record<string, unknown>) => { asked.push(o); return { ok: true, exportId: 'x1', format: 'mp4', size: 1e6 }; },
        readExport: async () => null,
      },
    };
    const code = codeGenerator.generateAgentExport({ format: 'mp4', platform, duration: 1, ...(scale ? { scale } : {}) } as never);
    const r = await new Function('app', 'window', 'document', body(code))(app, {}, {});
    return { r, asked };
  };

  it('the video route says it too, and a scale the caller asked for is not blamed on the preset', async () => {
    const up = await exportMp4({ width: 640, height: 360 }, 'youtube');
    expect(up.r.success).toBe(true);
    expect(up.asked[0]).toMatchObject({ width: 1920, height: 1080 });
    expect(up.r.platformSize).toMatchObject({ canvas: '640x360', file: '1920x1080' });
    const own = await exportMp4({ width: 1920, height: 1080 }, 'youtube', 0.5);
    expect(own.r.success).toBe(true);
    expect(own.asked[0]).toMatchObject({ width: 960, height: 540 });
    expect(own.r.platformSize).toBeUndefined();
  });

  it('an unbounded canvas is left to its own crop warning', async () => {
    const { r } = await exportPng({ width: 640, height: 360, unbounded: true }, 'youtube');
    expect(r.platformSize).toBeUndefined();
  });

  it('platform auto exports the canvas size and says nothing', async () => {
    const { r } = await exportPng({ width: 640, height: 360 }, 'auto');
    expect(r.platformSize).toBeUndefined();
  });
});

describe('12: fillOpacity and fillColor: \'none\' on text create and modify', () => {
  const studio = (reads: boolean) => {
    const item: Record<string, any> = { className: 'PointText', data: { registryId: 'item_1' }, fillColor: { alpha: 1 }, bringToFront() {} };
    const seen: Array<Record<string, unknown>> = [];
    const take = (p: Record<string, unknown>) => {
      seen.push(p);
      if (reads && typeof p.fillOpacity === 'number') { item.data.fillOpacity = p.fillOpacity; if (item.fillColor) item.fillColor = { alpha: p.fillOpacity }; }
    };
    const app = {
      create: (_t: string, p: Record<string, unknown>) => { take(p); return item; },
      modifyItem: (_id: string, ch: Record<string, unknown>) => { take(ch); return true; },
      getItemById: () => item, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} },
    };
    return { app, seen, item };
  };

  it('the schemas keep both', () => {
    const c = CreateItemInputSchema.parse({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'A', fillColor: 'none', fillOpacity: 0.4 } });
    expect(c.properties).toMatchObject({ fillColor: 'none', fillOpacity: 0.4 });
    const m = ModifyItemInputSchema.parse({ itemId: 'item_1', properties: { fillColor: 'none', fillOpacity: 0.4 } });
    expect(m.properties).toMatchObject({ fillColor: 'none', fillOpacity: 0.4 });
  });

  it('create passes fillOpacity to the engine, does not call it ignored, and confirms it', () => {
    const s = studio(true);
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'A', fillColor: '#00ff00', strokeColor: '#ff0000', fillOpacity: 0.5 } }, s.app);
    expect(s.seen[0]).toMatchObject({ fillOpacity: 0.5 });
    expect(r.ignoredProperties).toBeUndefined();
    expect(r.fillOpacity).toEqual({ applied: true, value: 0.5 });
  });

  it('an older studio that ignores fillOpacity says so instead of claiming it', () => {
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'A', fillOpacity: 0.5 } }, studio(false).app);
    expect(r.ignoredProperties).toBeUndefined();
    expect(r.fillOpacity.applied).toBe(false);
    expect(r.fillOpacity.note).toContain('does not read fillOpacity');
  });

  it('modify takes it too', () => {
    const s = studio(true);
    const r = run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fillOpacity: 0 } }), s.app);
    expect(s.seen[0]).toEqual({ fillOpacity: 0 });
    expect(r.ignoredProperties).toBeUndefined();
    expect(r.fillOpacity).toEqual({ applied: true, value: 0 });
  });

  it('two creates with fillOpacity in one batch each report their own', async () => {
    const s = studio(true);
    const code = codeGenerator.generateAgentBatchExecute({ operations: [
      { type: 'create', itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'A', fillOpacity: 0.5 } },
      { type: 'create', itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'B', fillOpacity: 0.25 } },
    ] } as never);
    const r = await run(code, { ...s.app, getCanvasSize: () => ({ width: 800, height: 600 }) });
    expect(r.success).toBe(true);
    expect(s.seen.map((p) => p.fillOpacity)).toEqual([0.5, 0.25]);
  });

  it("fillColor: 'none' on text is no fill, on create and on modify, and is not reported ignored", () => {
    const s = studio(true);
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'A', fillColor: 'none', strokeColor: '#ff0000' } }, s.app);
    expect(r.ignoredProperties).toBeUndefined();
    expect(s.item.fillColor).toBeNull();
    const s2 = studio(true);
    const m = run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fillColor: 'none' } }), s2.app);
    expect(m.ignoredProperties).toBeUndefined();
    expect(s2.item.fillColor).toBeNull();
  });
});
