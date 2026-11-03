/**
 * get_items reads back what create applied: the name, and scale / rotation / opacity when not the default.
 *
 * CROWSCALE30: a create-time scale rendered exactly and get_items did not show it. PATCHIMG29: an import's name (the
 * key a patch addresses it by) was not shown either. Measured live on 1c2e17f0 after the change: scale {x: 2, y: 2}
 * and the names read back.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

const run = (code: string, entries: unknown[]) =>
  new Function('app', `return (function(){ ${code.replace(/\n\(\{ items, count: items\.length \}\);\s*$/, '\nreturn { items, count: items.length };')} })();`)({
    itemRegistry: { getAll: () => entries },
    getRelations: () => [],
  }) as { items: Array<Record<string, unknown>> };

const item = (o: Record<string, unknown>) => ({ position: { x: 1, y: 2 }, scaling: { x: 1, y: 1 }, rotation: 0, opacity: 1, data: {}, ...o });

describe('get_items readback', () => {
  for (const [label, code] of [['all', gen.generateGetItems()], ['filtered', gen.generateGetItems({ type: 'rectangle' } as never)]] as const) {
    it(`${label}: name and non-default scale / rotation / opacity are read back; defaults are left out`, () => {
      const { items } = run(code, [
        { id: 'item_1', type: 'rectangle', item: item({ name: 'box', scaling: { x: 2, y: 2 }, rotation: 15, opacity: 0.5 }) },
        { id: 'item_2', type: 'rectangle', item: item({}) },
      ]);
      expect(items[0]).toMatchObject({ id: 'item_1', name: 'box', scale: { x: 2, y: 2 }, rotation: 15, opacity: 0.5 });
      expect(Object.keys(items[1]).sort()).toEqual(['hasAnimation', 'id', 'position', 'relations', 'type']);
    });
  }
});
