/**
 * 'shader' and 'field' are drawn locally as a flat plate (round 5 R, 5.31).
 *
 * Two things were silent: create answered with the plate's renderParams and no
 * itemId, and a local export of the plate said nothing about it being a plate.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

function plateApp() {
  const item = { data: { registryId: 'item_9' } as Record<string, unknown> };
  return { item, app: { create: () => item } };
}

describe('shader / field create', () => {
  it('answers with an itemId and says it is a local stand-in', () => {
    const code = gen.generateCreateItem({ itemType: 'shader', position: { x: 10, y: 20 }, properties: { shader: 'water', width: 800, height: 400 } });
    const { app, item } = plateApp();
    // Same evaluation the browser controller uses: the snippet's completion value.
    // eslint-disable-next-line no-eval
    const r = (0, eval)(`(function(app){ return eval(${JSON.stringify(code)}); })`)(app);
    expect(r.itemId).toBe('item_9');
    expect(r.localStandIn).toBe(true);
    expect(item.data.renderAs).toBe('shader');
  });
});

describe('agent_export fidelity names stand-ins', () => {
  const code = gen.generateAgentExport({ platform: 'youtube', format: 'mp4' } as never);
  const src = /function standIns\(\) \{[\s\S]*?\n  \}\n/.exec(code)?.[0];

  it('emits a stand-in check that every fidelity branch includes', () => {
    expect(src).toBeDefined();
    expect(code).toContain('.concat(own)');
    expect((code.match(/own\.length \? \{ warnings: own \}/g) || []).length).toBe(3);
  });

  it('reports each shader / field plate by id, and nothing for ordinary items', () => {
    const standIns = new Function('app', `${src}; return standIns();`);
    const entries = [
      { itemId: 'a', item: { data: { renderAs: 'shader' } } },
      { itemId: 'b', item: { data: { renderAs: 'shader' } } },
      { itemId: 'c', item: { data: {} } },
      { itemId: 'd', item: { data: { renderAs: 'field' } } },
    ];
    const w = standIns({ itemRegistry: { getAll: () => entries } });
    expect(w).toHaveLength(2);
    expect(w[0]).toMatchObject({ code: 'render_time_surface_stand_in', items: ['a', 'b'] });
    expect(w[0].message).toContain('2 shader items are exported as the flat plate');
    expect(w[1].items).toEqual(['d']);
    expect(standIns({ itemRegistry: { getAll: () => [entries[2]] } })).toEqual([]);
  });
});

describe('fidelity names alpha a format drops (8.12)', () => {
  const code = gen.generateAgentExport({ platform: 'youtube', format: 'webm' } as never);
  const src = /function alphaLoss\(fmt\) \{[\s\S]*?\n  \}\n/.exec(code)?.[0];
  const alphaLoss = new Function('app', 'fmt', `${src}; return alphaLoss(fmt);`);

  it('warns for webm / mp4 / jpg on a transparent scene', () => {
    const app = { canvasEl: { style: { backgroundColor: '' } }, patternGroup: { children: [] } };
    expect(alphaLoss(app, 'webm')[0].code).toBe('alpha_dropped');
    expect(alphaLoss(app, 'mp4')[0].message).toContain('BLACK');
    expect(alphaLoss(app, 'jpg')[0].message).toContain('white');
    expect(alphaLoss(app, 'png')).toEqual([]);
  });

  it('is silent when there is a background colour or backdrop items', () => {
    expect(alphaLoss({ canvasEl: { style: { backgroundColor: 'rgb(0, 0, 0)' } } }, 'webm')).toEqual([]);
    expect(alphaLoss({ canvasEl: { style: {} }, patternGroup: { children: [{}] } }, 'webm')).toEqual([]);
    expect(alphaLoss({ canvasEl: { style: { backgroundColor: 'rgba(0, 0, 0, 0)' } }, patternGroup: { children: [] } }, 'webm')).toHaveLength(1);
  });
});
