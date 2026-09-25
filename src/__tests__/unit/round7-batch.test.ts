/**
 * Round 7 (lanes X / Z / AA) MCP fixes, run against stub studios.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const runIIFE = (code: string, globals: Record<string, unknown>) =>
  new Function(...Object.keys(globals), code.replace(/\((async )?function\(\)/, (m) => `return ${m}`))(...Object.values(globals));

describe('template_params apply names undeclared params (1.52)', () => {
  const app = (declared: string[]) => ({
    getTemplateParams: async () => ({ ok: true, params: declared.map((name) => ({ name })) }),
    applyTemplateWithParams: () => true,
  });

  it('a template that declares nothing says the params changed nothing', async () => {
    const r = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 'sale-announcement', params: { headline: 'X', date: 'Y' } } as never), { app: app([]) });
    expect(r.success).toBe(true);
    expect(r.ignoredParams).toEqual(['headline', 'date']);
    expect(r.warning).toContain('declares no parameters');
  });

  it('names only the undeclared ones, and is quiet when all are declared', async () => {
    const some = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 't', params: { title: 'a', nope: 1 } } as never), { app: app(['title']) });
    expect(some.ignoredParams).toEqual(['nope']);
    const all = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 't', params: { title: 'a' } } as never), { app: app(['title']) });
    expect(all.ignoredParams).toBeUndefined();
  });
});

describe('lasso cut (1.55)', () => {
  function lassoStudio() {
    const P = (x: number, y: number) => ({ x, y, getDistance: (o: { x: number; y: number }) => Math.hypot(o.x - x, o.y - y) });
    const deleted: string[] = [];
    const clicks: Array<{ x: number; y: number }> = [];
    let drawn = false; let target: Record<string, any> | null = null;
    const original: Record<string, any> = { data: { registryId: 'item_1', id: 'item_1' }, clone() { return { data: { ...this.data }, parent: {}, remove() { this.parent = null; } }; } };
    // Like prod: the lasso remembers 'freehand', where clicks add no vertex.
    const L: Record<string, any> = {
      _forcedMode: 'freehand',
      setMode(m: string) { this._forcedMode = m; },
      activate: (t: Record<string, any>) => { target = t; },
      startStroke: () => {},
      endStroke(p: { x: number; y: number }) {
        if (this._forcedMode !== 'polygon') return;
        if (clicks.length >= 3 && p.getDistance(clicks[0]) < 12) drawn = true; else clicks.push(p);
      },
      isDrawn: () => drawn,
      cancel: () => {},
      applyLasso: async () => {
        const oid = target!.data.registryId || target!.data.id;
        if (oid) deleted.push(oid);
        return { data: { registryId: 'item_9' }, bounds: { x: 0, y: 0, width: 10, height: 10 } };
      },
    };
    const app = { lassoTool: L, itemRegistry: { get: (id: string) => (id === 'item_1' ? { item: original } : null) } };
    return { app, paper: { Point: class { constructor(x: number, y: number) { return P(x, y); } } }, deleted, clicks };
  }
  const pts = [[100, 100], [200, 100], [200, 200], [100, 200]];

  it('cuts along the polygon and keeps the original by default', async () => {
    const s = lassoStudio();
    const r = await runIIFE(codeGenerator.generateLasso({ action: 'cut', itemId: 'item_1', points: pts } as never), { app: s.app, paper: s.paper });
    expect(r).toMatchObject({ success: true, cutoutId: 'item_9', originalKept: true, vertices: 4 });
    expect(s.deleted).toEqual([]); // the clone had its ids stripped
    expect(s.app.lassoTool._forcedMode).toBe('freehand'); // the user's mode is back
  });

  it('keepOriginal:false consumes the source, and says so', async () => {
    const s = lassoStudio();
    const r = await runIIFE(codeGenerator.generateLasso({ action: 'cut', itemId: 'item_1', points: pts, keepOriginal: false } as never), { app: s.app, paper: s.paper });
    expect(r.originalKept).toBe(false);
    expect(s.deleted).toEqual(['item_1']);
  });

  it('refuses fewer than 3 points without touching the studio', () => {
    expect(codeGenerator.generateLasso({ action: 'cut', itemId: 'item_1', points: [[0, 0], [5, 5]] } as never)).toContain('at least 3 points');
  });
});

describe('no fill at create and modify (1.50)', () => {
  const create = (properties: Record<string, unknown>) => {
    const item: Record<string, any> = { fillColor: '#3b82f6', data: { registryId: 'item_1' }, bringToFront() {} };
    let params: Record<string, unknown> = {};
    const app = { create: (_t: string, p: Record<string, unknown>) => { params = p; return item; }, historyManager: { saveState() {} } };
    const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 0, y: 0 }, properties });
    new Function('app', code)(app);
    return { item, params };
  };

  for (const v of [null, 'transparent', 'none']) {
    it(`fillColor ${JSON.stringify(v)} gives no fill, and is never sent as a colour`, () => {
      const { item, params } = create({ width: 100, height: 50, fillColor: v, strokeColor: '#000', strokeWidth: 2 });
      expect(item.fillColor).toBeNull();
      expect(params.fillColor).toBeUndefined();
    });
  }

  it('a real colour is untouched', () => {
    expect(create({ fillColor: '#ff0000' }).params.fillColor).toBe('#ff0000');
  });

  it('modify_item {fillColor:"transparent"} clears the fill after modifyItem', () => {
    const item: Record<string, any> = { fillColor: '#3b82f6' };
    const app = { modifyItem: () => { item.fillColor = '#000000'; return true; }, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } };
    new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fillColor: 'transparent' } })}`)(app, {});
    expect(item.fillColor).toBeNull();
  });
});

describe('dashArray / strokeCap / strokeJoin on every shape (1.54)', () => {
  it('a dashed circle keeps its dashes', () => {
    const item: Record<string, any> = { data: { registryId: 'item_1' }, bringToFront() {} };
    const app = { create: () => item, historyManager: { saveState() {} } };
    new Function('app', codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 },
      properties: { radius: 40, strokeColor: '#0ff', strokeWidth: 3, dashArray: [8, 6], strokeCap: 'round' } }))(app);
    expect(item.dashArray).toEqual([8, 6]);
    expect(item.strokeCap).toBe('round');
  });
});

describe('moves_along_path from a path item (2.25)', () => {
  function relStudio(pathItem: Record<string, unknown> | null) {
    const added: unknown[] = [];
    const app = {
      itemRegistry: { get: (id: string) => (id === 'path_1' && pathItem ? { item: pathItem } : null) },
      addRelation: (...a: unknown[]) => { added.push(a); return true; },
      historyManager: { saveState() {} },
    };
    return { app, added };
  }
  const line = { className: 'Path', length: 300, closed: false, getPointAt: (o: number) => ({ x: o, y: 0 }) };

  it('samples the target path, maps duration to speed and delay to the window', () => {
    const s = relStudio(line);
    const r = runIIFE(codeGenerator.generateAddRelation({ sourceId: 'hand', targetId: 'path_1', relationType: 'moves_along_path',
      params: { duration: 4, delay: 1, easing: 'linear' } } as never), { app: s.app });
    expect(r.success).toBe(true);
    const [src, tgt, type, params] = s.added[0] as [string, string, string, Record<string, any>];
    expect([src, tgt, type]).toEqual(['hand', 'hand', 'moves_along_path']);
    expect(params.path[0]).toEqual([0, 0]);
    expect(params.path.at(-1)).toEqual([300, 0]);
    expect(params.speed).toBeCloseTo(300 / (150 * 4), 5);
    expect(params.closed).toBe(false);
    expect(params.window).toEqual({ start: 1 });
    expect(params.pathId).toBeUndefined();
  });

  it('refuses by name when there is no path at all', () => {
    const r = runIIFE(codeGenerator.generateAddRelation({ sourceId: 'hand', relationType: 'moves_along_path', params: { duration: 2 } } as never), { app: relStudio(null).app });
    expect(r.success).toBe(false);
    expect(r.error).toContain('needs a path');
  });

  it('explicit points pass straight through', () => {
    const s = relStudio(null);
    runIIFE(codeGenerator.generateAddRelation({ sourceId: 'hand', relationType: 'moves_along_path', params: { path: [[0, 0], [10, 0]], speed: 2 } } as never), { app: s.app });
    expect((s.added[0] as any[])[3]).toEqual({ path: [[0, 0], [10, 0]], speed: 2 });
  });
});

describe('stagger shifts keyframe tracks too (2.2)', () => {
  it('offsets keyframed items by their delay, and re-applying replaces the shift', () => {
    const items: Record<string, any> = {
      a: { data: { keyframes: [{ time: 0 }], timeOffset: 0.5 } },
      b: { data: { keyframes: [{ time: 0 }] } },
      c: { data: {} },
    };
    const app = {
      itemRegistry: { get: (id: string) => (items[id] ? { item: items[id] } : null) },
      staggerItems: (ids: string[]) => ({ ok: true, delays: ids.map((_, i) => i * 0.2), applied: ids.length, span: 0.4 }),
    };
    const code = codeGenerator.generateStagger({ action: 'apply', itemIds: ['a', 'b', 'c'], opts: {} } as never);
    const r1 = runIIFE(code, { app });
    expect(r1.shiftedKeyframeTracks).toBe(2);
    expect(items.a.data.timeOffset).toBeCloseTo(0.5);
    expect(items.b.data.timeOffset).toBeCloseTo(0.2);
    runIIFE(code, { app });
    expect(items.b.data.timeOffset).toBeCloseTo(0.2); // replaced, not stacked
    expect(items.c.data.timeOffset).toBeUndefined();
  });
});

describe('globe disable (2.8)', () => {
  it('calls disableGlobeMode and says how to get a flat map back', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_globe', { action: 'disable' }, { executionMode: 'code' } as never));
    expect(out).toContain('disableGlobeMode()');
    expect(out).toContain('load the map again');
  });
});
