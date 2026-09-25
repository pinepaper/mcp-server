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

describe('top-level anchor on create_item (1.63)', () => {
  it('is carried into properties', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 10, y: 10 }, anchor: 'top-left', properties: { width: 615, height: 345 } } as never);
    expect(code).toContain('"anchor": "top-left"');
  });
});

describe('moves_along_path: native route, offset, start position (1.60 / 1.61)', () => {
  const line = { className: 'Path', length: 300, closed: false, getPointAt: (o: number) => ({ x: o, y: 0 }) };
  function studio(native: boolean) {
    const added: unknown[] = [];
    const hand = { position: { x: 999, y: 999 } };
    const app = {
      relationRegistry: { getRule: () => (native ? { params: { duration: {}, delay: {}, offset: {} } } : { params: { speed: {} } }) },
      itemRegistry: { get: (id: string) => (id === 'path_1' ? { item: line } : id === 'hand' ? { item: hand } : null) },
      addRelation: (...a: unknown[]) => { added.push(a); return true; },
      historyManager: { saveState() {} },
    };
    return { app, added, hand };
  }
  const input = { sourceId: 'hand', targetId: 'path_1', relationType: 'moves_along_path', params: { duration: 4, delay: 1, offset: [20, -10] } };

  it('on a build that rides paths natively, passes through with the path as target', () => {
    const s = studio(true);
    const r = runIIFE(codeGenerator.generateAddRelation(input as never), { app: s.app });
    expect(r.route).toBe('live-path');
    const [src, tgt, , params] = s.added[0] as [string, string, string, Record<string, unknown>];
    expect([src, tgt]).toEqual(['hand', 'path_1']);
    expect(params).toMatchObject({ duration: 4, delay: 1, offset: [20, -10] });
    expect(params.path).toBeUndefined();
  });

  it('otherwise samples, applies offset the engine way, and parks the item at the start', () => {
    const s = studio(false);
    const r = runIIFE(codeGenerator.generateAddRelation(input as never), { app: s.app });
    expect(r.route).toBe('sampled-points');
    const params = (s.added[0] as any[])[3];
    expect(params.path[0]).toEqual([20, -10]);
    expect(s.hand.position).toEqual({ x: 20, y: -10 });
  });
});

describe('batch create is create_item (1.67)', () => {
  it('keeps fontWeight and a countdown, and returns the created id', async () => {
    const calls: unknown[] = [];
    const item: Record<string, any> = { className: 'PointText', justification: 'center', fontSize: 40, data: { registryId: 'item_5' }, bringToFront() {},
      _pos: { x: 0, y: 0 } };
    const P = (x: number, y: number) => ({ x, y, add: ([dx, dy]: number[]) => P(x + dx, y + dy) });
    Object.defineProperty(item, 'position', { get: () => P(item._pos.x, item._pos.y), set: (p) => { item._pos = { x: p.x, y: p.y }; } });
    Object.defineProperty(item, 'bounds', { get: () => ({ left: item._pos.x - 50, right: item._pos.x + 50, center: { x: item._pos.x, y: item._pos.y } }) });
    const app = {
      create: () => item,
      setDynamicContent: (_i: unknown, type: string) => calls.push(['dynamic', type]),
      historyManager: { saveState() {} },
      getItemById: () => item,
    };
    const code = codeGenerator.generateAgentBatchExecute({ operations: [
      { type: 'create', itemType: 'text', position: { x: 100, y: 100 }, properties: { content: '00:10', fontWeight: 700, contentType: 'countdown', countdownTarget: 10 } },
    ] } as never);
    const r = await new Function('app', 'paper', 'window', 'document', code.replace('(async function()', 'return (async function()'))(app, {}, {}, {});
    expect(item.fontWeight).toBe('700');
    expect(calls).toContainEqual(['dynamic', 'countdown']);
    expect(r.itemIds).toEqual(['item_5']);
  });
});

describe('batch modify is modify_item (1.67)', () => {
  it('resolves $N at run time and applies modify_item-only fixes (no-fill)', async () => {
    const item: Record<string, any> = { fillColor: '#3b82f6', data: { registryId: 'item_7' }, bringToFront() {} };
    const app = {
      create: () => item,
      modifyItem: (id: string) => { item.lastModifiedId = id; return true; },
      itemRegistry: { get: (id: string) => (id === 'item_7' ? { item } : null) },
      getItemById: () => item,
      historyManager: { saveState() {} },
    };
    const code = codeGenerator.generateAgentBatchExecute({ operations: [
      { type: 'create', itemType: 'rectangle', properties: { width: 10, height: 10 } },
      { type: 'modify', itemId: '$0', properties: { fillColor: 'transparent', strokeColor: '#000' } },
    ] } as never);
    const r = await new Function('app', 'paper', 'window', 'document', code.replace('(async function()', 'return (async function()'))(app, {}, {}, {});
    expect(r.success).toBe(true);
    expect(item.lastModifiedId).toBe('item_7');
    expect(item.fillColor).toBeNull();
  });
});

describe('generator param aliases (5.56)', () => {
  it('drawWindField direction / speed reach windDirection / windSpeed', () => {
    const code = codeGenerator.generateExecuteGenerator({ generatorName: 'drawWindField', params: { direction: 135, speed: 2 } } as never);
    expect(code).toContain('"windDirection": 135');
    expect(code).toContain('"windSpeed": 2');
    expect(code).not.toContain('"direction"');
  });
});

describe('landscape print presets (8.18)', () => {
  it('map to the engine landscape presets and export at landscape print size', async () => {
    const { canvasPresetFor } = await import('../../types/code-generator.js');
    expect(canvasPresetFor('print-a4-landscape')).toBe('a4-landscape');
    expect(canvasPresetFor('print-letter-landscape')).toBe('letter-landscape');
    expect(codeGenerator.generateAgentExport({ platform: 'print-a4-landscape', format: 'pdf' } as never)).toContain('{"width":3508,"height":2480}');
  });
});

describe('small canvas refusal names the region recipe (1.48)', () => {
  it('says how to make a 728x90 banner', async () => {
    const { SetCanvasSizeInputSchema } = await import('../../types/schemas.js');
    const r = SetCanvasSizeInputSchema.safeParse({ width: 728, height: 90 });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error)).toContain('outputWidth:728');
    expect(JSON.stringify(r.error)).toContain('scale: 0.5');
  });
});

describe('clearing the canvas removes uploaded media (1.66)', () => {
  it('clear_canvas removes every uploaded clip through the media pipeline', () => {
    const removed: string[] = [];
    const window = { PinePaperAgent: { listMedia: () => [{ id: 'vraster_1' }, { id: 'araster_2' }], removeMedia: (id: string) => { removed.push(id); return true; } } };
    const app = { itemRegistry: { getAll: () => [] }, clearCanvas() {}, historyManager: { saveState() {} } };
    const code = codeGenerator.generateClearCanvas();
    const r = new Function('app', 'window', code.replace(/\(\{ success: true[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app, window);
    expect(removed).toEqual(['vraster_1', 'araster_2']);
    expect(r.mediaRemoved).toBe(2);
  });

  it('agent_start_job clearCanvas does the same', () => {
    expect(codeGenerator.generateAgentStartJob({} as never)).toContain('__PA.removeMedia(m.id)');
  });
});

describe('import_image with a mask returns the group that is drawn (4.10)', () => {
  function importStudio(maskResult: 'group' | 'null', rasterSize = 200) {
    const rebinds: unknown[] = [];
    const raster = { data: { id: 'item_3' }, bounds: { x: 0, y: 0, width: rasterSize, height: rasterSize } };
    const group = { data: { id: 'item_3', masked: true }, bounds: { x: 10, y: 10, width: 180, height: 180 } };
    const app = {
      imageTools: {
        uploadFromURL: async () => ({ id: 'img_1' }),
        uploadFromDataURL: async () => ({ id: 'img_1' }),
        placeImage: async () => raster,
        applyMask: () => (maskResult === 'group' ? group : null),
      },
      itemRegistry: { rebind: (id: string, it: unknown) => { rebinds.push([id, it]); return true; } },
    };
    return { app, rebinds, group };
  }
  const code = (mask?: string) => codeGenerator.generateImportImage({ url: 'data:image/png;base64,AA', ...(mask ? { mask } : {}) } as never);
  const run = (c: string, app: unknown) => new Function('app', 'window', 'fetch', c.replace('(async function()', 'return (async function()'))(app, {}, async () => ({}));

  it('rebinds the id to the clipping group and reports its bounds', async () => {
    const s = importStudio('group');
    const r = await run(code('circle'), s.app);
    expect(r).toMatchObject({ success: true, itemId: 'item_3', mask: 'circle', bounds: { width: 180 } });
    expect(s.rebinds).toEqual([['item_3', s.group]]);
  });

  it('a mask that does not apply is refused, not reported as success', async () => {
    const r = await run(code('circle'), importStudio('null').app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('mask was not applied');
  });

  it('an image with no size is refused', async () => {
    const r = await run(code(), importStudio('group', 0).app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('no size');
  });
});

describe('widget HTML lang / dir / alt (8.20)', () => {
  it('rewrites the html tag and labels the canvas', async () => {
    const html = '<!DOCTYPE html><html lang="en"><head><title>x</title></head><body><canvas id="c"></canvas></body></html>';
    const app = { exportEngine: { exportWidgetHTML: async () => ({ html, estimatedSize: 1, analysis: { itemTypes: new Set(), relationTypes: new Set() } }) } };
    const code = codeGenerator.generateExportWidgetHtml({ lang: 'ar', dir: 'rtl', alt: 'A "sale" banner <animated>' } as never);
    const r = await runIIFE(code, { app });
    expect(r.html).toContain('<html lang="ar" dir="rtl">');
    expect(r.html).toContain('<canvas role="img" aria-label="A &quot;sale&quot; banner &lt;animated>" id="c">');
    expect(r.a11y).toEqual(['html', 'canvas', 'meta']);
  });

  it("labels the engine's script-drawn widget: div#w aria-label and #w-desc", async () => {
    const html = '<html lang="en"><head></head><body><div id="w" role="img" aria-label="Auto: 3 shapes">\n  <div class="sr-only" id="w-desc">Auto: 3 shapes</div></div><script>/*canvas made here*/</script></body></html>';
    const app = { exportEngine: { exportWidgetHTML: async () => ({ html, estimatedSize: 1, analysis: { itemTypes: new Set(), relationTypes: new Set() } }) } };
    const r = await runIIFE(codeGenerator.generateExportWidgetHtml({ alt: 'Sale: 50% off' } as never), { app });
    expect(r.html).toContain('<div id="w" role="img" aria-label="Sale: 50% off">');
    expect(r.html).toContain('<div class="sr-only" id="w-desc">Sale: 50% off</div>');
    expect(r.a11y).toEqual(['widget-label', 'widget-desc', 'meta']);
  });
});

describe('add_relation refuses unknown endpoints (1.74)', () => {
  const app = (known: string[]) => ({
    _isKnownRelationEndpoint: (id: string) => known.includes(id),
    _resolveRelationEndpoint: (id: string) => id.replace(/^#/, ''),
    addRelation: () => true,
    historyManager: { saveState() {} },
  });
  const code = (t: string) => codeGenerator.generateAddRelation({ sourceId: 'item_1', targetId: t, relationType: 'orbits', params: {} } as never);

  it('refuses a target that is not on the canvas', () => {
    const r = runIIFE(code('item_404'), { app: app(['item_1']) });
    expect(r.success).toBe(false);
    expect(r.error).toContain('"item_404" is not an item');
  });

  it("accepts the engine's '#id' habit and real ids", () => {
    expect(runIIFE(code('#item_2'), { app: app(['item_1', 'item_2']) }).success).toBe(true);
  });
});

describe('export_widget embed fits the scene and names its dependencies (8.32)', () => {
  it('a 300x250 scene gets a 300/250 box and the runtime files are listed', async () => {
    const embed = '<div id="my-widget" style="width: 100%; max-width: 800px; aspect-ratio: 16/9;"></div>\n<script src="https://pinepaper.studio/js/PineWidget.js"></script>';
    const app = { getCanvasSize: () => ({ width: 300, height: 250 }),
      exportEngine: { exportWidget: async () => ({ json: '{}', filename: 'ad.json', embedCode: embed, data: {} }) } };
    const r = await runIIFE(codeGenerator.generateExportWidget({} as never), { app });
    expect(r.embedCode).toContain('aspect-ratio: 300/250');
    expect(r.embedCode).toContain('max-width: 300px');
    expect(r.dependencies.map((d: { kind: string }) => d.kind)).toEqual(['script', 'scene-json']);
    expect(r.note).toContain('export_widget_html');
  });
});

describe('batch_create is create_item for each item (1.79)', () => {
  it('keeps fontWeight, reports ignoredProperties, saves history once', async () => {
    let saves = 0;
    const made: Record<string, any>[] = [];
    const mk = (id: string) => {
      const it: Record<string, any> = { className: 'PointText', justification: 'center', fontSize: 30, data: { registryId: id }, bringToFront() {}, _pos: { x: 0, y: 0 } };
      const P = (x: number, y: number) => ({ x, y, add: ([dx, dy]: number[]) => P(x + dx, y + dy) });
      Object.defineProperty(it, 'position', { get: () => P(it._pos.x, it._pos.y), set: (p) => { it._pos = { x: p.x, y: p.y }; } });
      Object.defineProperty(it, 'bounds', { get: () => ({ left: it._pos.x - 5, right: it._pos.x + 5, center: { x: it._pos.x, y: it._pos.y } }) });
      return it;
    };
    const app = { create: () => { const it = mk('item_' + (made.length + 1)); made.push(it); return it; }, historyManager: { saveState() { saves++; } } };
    const code = codeGenerator.generateBatchCreate({ items: [
      { type: 'text', params: { x: 10, y: 20, content: 'A', fontWeight: 700 } },
      { type: 'text', params: { position: [30, 40], content: 'B', glow: 3 } },
    ] } as never);
    const r = await new Function('app', 'document', 'window', code.replace('(async function()', 'return (async function()'))(app, {}, {});
    expect(r.count).toBe(2);
    expect(made[0].fontWeight).toBe('700');
    expect(r.items[1].ignoredProperties).toEqual(['glow']);
    expect(saves).toBe(1);
  });
});

describe('batch_modify is modify_item for each item', () => {
  it('applies modify_item fixes, names skipped ids, saves once', async () => {
    let saves = 0;
    const items: Record<string, Record<string, any>> = { item_1: { fillColor: '#123' } };
    const app = {
      modifyItem: (id: string) => (items[id] ? true : false),
      itemRegistry: { get: (id: string) => (items[id] ? { item: items[id] } : null) },
      historyManager: { saveState() { saves++; } },
    };
    const code = codeGenerator.generateBatchModify({ modifications: [
      { itemId: 'item_1', params: { fillColor: 'none' } },
      { itemId: 'item_9', params: { opacity: 0.5 } },
    ] } as never);
    const r = await new Function('app', 'window', code.replace('(async function()', 'return (async function()'))(app, {});
    expect(items.item_1.fillColor).toBeNull();
    expect(r).toMatchObject({ success: false, count: 1, requested: 2 });
    expect(r.skipped[0].itemId).toBe('item_9');
    expect(saves).toBe(1);
  });
});

describe('component instantiate returns its id and the keys overrides use (1.80)', () => {
  it('parts list key, type and text; orphaned overrides are named', () => {
    const inst = { data: { id: 'item_12' }, children: [
      { className: 'PointText', content: 'HEADLINE', data: { componentKey: 'ck_1' } },
      { className: 'Path', data: { componentKey: 'ck_2' } },
    ] };
    const app = { instantiateComponent: () => ({ ok: true, item: inst, id: 'item_12', orphaned: [{ key: 'ck_9', props: ['content'] }] }) };
    const r = runIIFE(codeGenerator.generateComponent({ action: 'instantiate', componentId: 'comp_1', overrides: { ck_9: { content: 'x' } } } as never), { app });
    expect(r).toMatchObject({ success: true, instanceId: 'item_12', itemId: 'item_12' });
    expect(r.parts).toEqual([{ key: 'ck_1', type: 'PointText', content: 'HEADLINE' }, { key: 'ck_2', type: 'Path' }]);
    expect(r.warning).toContain('ck_9');
  });
});

describe('a pathData path keeps its coordinates without a position (1.81)', () => {
  const params = (input: Record<string, unknown>) =>
    JSON.parse(/app\.create\('path', ([\s\S]*?)\);\n/.exec(codeGenerator.generateCreateItem(input as never))![1]!);

  it('no position → no x / y sent', () => {
    const p = params({ itemType: 'path', properties: { pathData: 'M500 130 L700 130 L600 300 Z' } });
    expect(p.x).toBeUndefined();
    expect(p.y).toBeUndefined();
  });

  it('an explicit position is still honoured', () => {
    expect(params({ itemType: 'path', position: { x: 50, y: 60 }, properties: { pathData: 'M0 0 L10 10' } })).toMatchObject({ x: 50, y: 60 });
  });

  it('a shape without its own coordinates still gets the default', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'circle', properties: { radius: 5 } } as never);
    expect(code).toContain('"x": 400');
  });
});

describe('keyframe property gaps are named (2.30)', () => {
  it('lists which keys lack which properties', () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'item_4', keyframes: [
      { time: 0, properties: { x: 0, opacity: 0 } }, { time: 1, properties: { x: 100 } }, { time: 2, properties: { x: 200, opacity: 1 } },
    ] } as never);
    expect(code).toContain('propertyGaps: [{"time":1,"missing":["opacity"]}]');
    const full = codeGenerator.generateKeyframeAnimate({ itemId: 'item_4', keyframes: [
      { time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 1 } },
    ] } as never);
    expect(full).not.toContain('propertyGaps');
  });
});

describe('camera pitch / yaw note depends on the studio (3.6 / f116b6ad)', () => {
  const run = async (tilt: boolean, keyframes: unknown[]) => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = await handleToolCall('pinepaper_camera_animate', { keyframes, duration: 2 }, { executionMode: 'code' } as never);
    const code = JSON.parse(JSON.stringify(out)).content.map((c: { text: string }) => c.text).join('\n');
    const src = /\(function\(\) \{[\s\S]*\}\)\(\);/.exec(code)![0];
    const app = { addRelation: () => true, ...(tilt ? { relationRegistry: { cameraTilt: () => 0 } } : {}) };
    return new Function('app', `return ${src}`)(app);
  };
  const yawKeys = [{ time: 0, zoom: 1 }, { time: 2, zoom: 1, yaw: 25 }];

  it('notes a tilt only where the studio cannot render it', async () => {
    expect((await run(false, yawKeys)).note).toContain('NO visible effect');
    const ok = await run(true, yawKeys);
    expect(ok.note).toBeUndefined();
    expect(ok.tiltRenders).toBe(true);
  });

  it('says nothing without a tilt', async () => {
    expect((await run(false, [{ time: 0, zoom: 1 }, { time: 2, zoom: 2 }])).note).toBeUndefined();
  });
});

describe('extrude / lathe meshes take a colour (5.64)', () => {
  it('color becomes the diffuse uniform; no colour is light grey, not black', () => {
    const coloured = codeGenerator.generateWorld3D({ action: 'extrude_path', pathId: 'item_1', mesh: { depth: 20, color: '#ff0000', metalness: 0.2 } } as never);
    expect(coloured).toContain('"uniforms":{"diffuse":[1,0,0],"metalness":0.2,"roughness":0.6}');
    expect(coloured).not.toContain('"color"');
    const plain = codeGenerator.generateWorld3D({ action: 'lathe_path', pathId: 'item_1', mesh: {} } as never);
    expect(plain).toContain('"diffuse":[0.8,0.8,0.8]');
  });
});

describe('modify_item skew / matrix (round 9 HH)', () => {
  it('shears about the centre and applies a matrix, and is not reported ignored', () => {
    const ops: unknown[] = [];
    const item = { bounds: { center: 'C' }, shear: (h: number, v: number, c: unknown) => ops.push(['shear', +h.toFixed(4), +v.toFixed(4), c]), transform: (m: unknown) => ops.push(['matrix', m]) };
    const app = { modifyItem: () => true, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } };
    const paper = { Matrix: class { args: number[]; constructor(...a: number[]) { this.args = a; } } };
    const code = codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { skewX: 45, matrix: [1, 0, 0.2, 1, 0, 0] } });
    const r = new Function('app', 'paper', 'window', `return ${code}`)(app, paper, {});
    expect(ops[0]).toEqual(['shear', 1, 0, 'C']);
    expect((ops[1] as [string, { args: number[] }])[1].args).toEqual([1, 0, 0.2, 1, 0, 0]);
    expect(r.affine.note).toContain('compounds');
    expect(r.ignoredProperties).toBeUndefined();
  });
});

describe('gradient specs are checked (1.82)', () => {
  const make = (color: unknown) => codeGenerator.generateCreateItem({ itemType: 'rectangle', properties: { width: 10, height: 10, color } } as never);

  it('an unreadable hex is refused by name', () => {
    const code = make({ gradient: true, stops: ['#a', '#b'] });
    expect(code).toContain('success: false');
    expect(code).toContain('is not a colour');
  });

  it('bare string stops and a missing type are normalised to a linear gradient', () => {
    const code = make({ stops: ['#ff0000', '#0000ff'] });
    expect(code).not.toContain('success: false');
    expect(code).toContain("stops: [['#ff0000', 0], ['#0000ff', 1]]");
    expect(code).toContain('radial: false');
  });

  it('a single stop is refused', () => {
    expect(make({ type: 'radial', stops: [{ color: '#fff', offset: 0 }] })).toContain('at least 2 stops');
  });
});

describe('1.81 through the HANDLER, not just the generator', () => {
  it('a pathData path with no position gets no x / y via pinepaper_create_item', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_create_item',
      { itemType: 'path', properties: { pathData: 'M100 300 L400 300 L250 500 Z' } }, { executionMode: 'code' } as never));
    // out is JSON-stringified, so the emitted code's quotes appear escaped.
    expect(out).toContain('app.create(\'path\'');
    expect(out).not.toContain('\\"x\\": 400');
    const withPos = JSON.stringify(await handleToolCall('pinepaper_create_item',
      { itemType: 'path', position: { x: 50, y: 60 }, properties: { pathData: 'M0 0 L10 10' } }, { executionMode: 'code' } as never));
    expect(withPos).toContain('\\"x\\": 50');
  });
});

describe('camera_animate duration is optional (retest)', () => {
  it('runs to the last keyframe when omitted', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_camera_animate', { keyframes: [{ time: 0, zoom: 1 }, { time: 7.5, zoom: 2 }] }, { executionMode: 'code' } as never));
    expect(out).toContain('over 7.5s');
  });
});

describe('through the HANDLER: mesh colour and gif loop survive the schema', () => {
  it('world3d extrude_path mesh.color reaches the diffuse uniform (5.64)', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_world3d', { action: 'extrude_path', pathId: 'item_1', mesh: { depth: 10, color: '#f97316' } }, { executionMode: 'code' } as never));
    expect(out).toContain('\\"diffuse\\":[0.9764705882352941,0.45098039215686275,0.08627450980392157]');
  });

  it('agent_export gif loop is in the base settings every route builds from (8.30)', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const out = JSON.stringify(await handleToolCall('pinepaper_agent_export', { format: 'gif', loop: 1, duration: 2 }, { executionMode: 'code' } as never));
    // out is JSON-stringified: a line break is the two characters \n, so stop at a backslash.
    expect(out).toMatch(/const baseVideoSettings = \{[^\\]*loop: 1/);
  });
});

describe('text auto-fit and overflow report (FxTool 661224ef)', () => {
  it('create_item fit calls app.fitText after creation and reports it', () => {
    const calls: unknown[] = [];
    const item = { className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} };
    let createParams: Record<string, unknown> = {};
    const app = { create: (_t: string, p: Record<string, unknown>) => { createParams = p; return item; }, historyManager: { saveState() {} },
      fitText: (_i: unknown, box: unknown) => { calls.push(box); return { ok: true, fontSize: 79, lines: 2, fits: true }; } };
    const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'Sommerschlussverkauf', fontSize: 120, fit: { maxWidth: 880, maxHeight: 300 } } } as never);
    const r = new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
    expect(calls).toEqual([{ maxWidth: 880, maxHeight: 300 }]);
    expect(createParams.fit).toBeUndefined();
    expect(r.textFit).toMatchObject({ applied: true, fontSize: 79, lines: 2, fits: true });
    expect(r.ignoredProperties).toBeUndefined();
  });

  it('says so on a studio without fitText', () => {
    const app = { create: () => ({ className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} }), historyManager: { saveState() {} } };
    const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'x', fit: { maxWidth: 100 } } } as never);
    const r = new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
    expect(r.textFit).toMatchObject({ applied: false });
  });

  it('export fidelity lists text overflow', async () => {
    const app = { canvasSize: { width: 10, height: 10 }, canvasEl: { style: { backgroundColor: '#000' } },
      textOverflowReport: () => [{ id: 'item_4', content: 'A very long name', reason: 'overflows its fit box at the minimum size' }],
      exportEngine: { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) } };
    const code = codeGenerator.generateAgentExport({ format: 'png' } as never);
    const r = await new Function('app', 'document', code.replace('(async function()', 'return (async function()'))(app, {});
    expect(r.fidelity.warnings).toContainEqual(expect.objectContaining({ code: 'text_overflow', items: ['item_4'] }));
  });
});

describe('1.90: the fit holds the anchored edge', () => {
  const run = (props: Record<string, unknown>, fitData?: unknown) => {
    const boxes: Array<Record<string, unknown>> = [];
    const item = { className: 'PointText', data: { registryId: 'item_1', fitBox: fitData }, bringToFront() {} };
    const app = { create: () => item, historyManager: { saveState() {} }, itemRegistry: { get: () => ({ item }) }, modifyItem: () => true,
      fitText: (_i: unknown, box: Record<string, unknown>) => { boxes.push(box); return { ok: true, fontSize: 80, lines: 2, fits: true }; } };
    return { app, boxes };
  };
  const create = (app: object, properties: Record<string, unknown>) => {
    const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 0, y: 100 }, properties } as never);
    return new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
  };

  it('a top-* anchor fits holding the top; bottom-* the bottom; no anchor leaves the engine default', () => {
    for (const [anchor, hold] of [['top-left', 'top'], ['bottom-right', 'bottom'], [undefined, undefined]] as const) {
      const s = run({});
      create(s.app, { content: 'x', ...(anchor ? { anchor } : {}), fit: { maxWidth: 880 } });
      expect(s.boxes[0].hold).toBe(hold);
    }
  });

  it('an explicit hold wins over the anchor', () => {
    const s = run({});
    create(s.app, { content: 'x', anchor: 'top-left', fit: { maxWidth: 880, hold: 'center' } });
    expect(s.boxes[0].hold).toBe('center');
  });

  it('modify with a new box keeps the hold the old box had', () => {
    const s = run({}, { maxWidth: 500, hold: 'top' });
    new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fit: { maxWidth: 600 } } })}`)(s.app, {});
    expect(s.boxes[0].hold).toBe('top');
  });
});
