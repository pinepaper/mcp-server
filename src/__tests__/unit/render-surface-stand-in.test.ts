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
