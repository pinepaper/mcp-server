/**
 * Pixel art needs nearest-neighbour rasters (round 6 U, 5.39).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

describe('raster smoothing', () => {
  it("import_image {smoothing:'off'} sets it on the placed raster", () => {
    const code = codeGenerator.generateImportImage({ url: 'https://x/p.png', smoothing: 'off' });
    expect(code).toContain("raster.smoothing = \"off\"");
    expect(codeGenerator.generateImportImage({ url: 'https://x/p.png' })).not.toContain('raster.smoothing');
  });

  it('modify_item {smoothing} reaches a raster, or the raster an image group holds', () => {
    const raster = { className: 'Raster', smoothing: 'low' };
    const group = { className: 'Group', getItem: () => raster };
    for (const item of [raster, group]) {
      raster.smoothing = 'low';
      const app = { modifyItem: () => true, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } };
      const r = new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { smoothing: 'off' } })}`)(app, {});
      expect(r.success).toBe(true);
      expect(raster.smoothing).toBe('off');
    }
  });
});
