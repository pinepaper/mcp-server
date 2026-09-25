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
    const L = {
      activate: (t: Record<string, any>) => { target = t; },
      startStroke: () => {},
      endStroke: (p: { x: number; y: number }) => { if (clicks.length >= 3 && p.getDistance(clicks[0]) < 12) drawn = true; else clicks.push(p); },
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
