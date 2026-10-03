/**
 * import_mermaid gives back CANVAS ids (gate D45). The engine's nodeIds are
 * the mermaid ids (A, B…), which resolve to nothing on the canvas, so a model
 * that passed them to auto_layout laid out nothing. Newer engines (FxTool
 * #87) return nodeItemIds / nodeIdMap / edgeIds; older ones are read off the
 * registered nodes.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function run(code: string, result: Record<string, unknown>) {
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return new Function('app', `return ${body}`)({ importMermaid: () => result }) as Record<string, any>;
}
const node = (rid: string, id: string) => ({ id, label: id, item: { data: { registryId: rid }, bounds: { x: 0, y: 0, width: 10, height: 10 } } });
const code = () => codeGenerator.generateImportMermaid('flowchart TD\n A --> B');

describe('import_mermaid canvas ids (D45)', () => {
  it('older engine: nodeItemIds read off the registered nodes', () => {
    const r = run(code(), { success: true, nodeIds: ['A', 'B'], nodes: [node('item_3', 'A'), node('item_4', 'B')], edges: [{ from: 'A', to: 'B' }], edgeIds: [] });
    expect(r.nodeItemIds).toEqual(['item_3', 'item_4']);
    expect(r.edgeIds).toBeUndefined();
  });
  it('newer engine: its nodeItemIds, nodeIdMap and edgeIds pass through', () => {
    const r = run(code(), { success: true, nodeIds: ['A', 'B'], nodeItemIds: ['item_3', 'item_4'], nodeIdMap: { A: 'item_3', B: 'item_4' }, edgeIds: ['item_5'],
      nodes: [node('item_3', 'A'), node('item_4', 'B')], edges: [{ from: 'A', to: 'B' }] });
    expect(r).toMatchObject({ nodeItemIds: ['item_3', 'item_4'], nodeIdMap: { A: 'item_3', B: 'item_4' }, edgeIds: ['item_5'] });
  });
});
