/**
 * Import-time scale multiplies the placed size (SCALEWIDTH170, SCALEMAX170); get_items shows an import's mask
 * (MASKMASK170); modify_item imageStart reads back what the studio stored (IMAGESTART37, modify route).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** A studio whose modifyItem sets a raster's scaling outright, as the engine does. */
function studio(fitScale: number) {
  const raster: any = {
    className: 'Raster', data: { id: 'item_1' }, opacity: 1, blendMode: 'normal',
    scaling: { x: fitScale, y: fitScale },
    get bounds() { return { x: 0, y: 0, width: 400 * this.scaling.x, height: 200 * this.scaling.y }; },
  };
  const modified: Record<string, unknown>[] = [];
  const app = {
    imageTools: {
      uploadFromURL: async () => ({ id: 'img_1', width: 400, height: 200, nativeWidth: 400, nativeHeight: 200 }),
      placeImage: () => raster,
    },
    modifyItem: (_id: string, props: Record<string, unknown>) => { modified.push(props); if (typeof props.scale === 'number') raster.scaling = { x: props.scale, y: props.scale }; return true; },
    historyManager: { saveState() {} },
  };
  return { app, raster, modified };
}
// The generated code opens with a comment line; `return` before it would return nothing.
const run = (code: string, app: unknown) => new Function('app', 'window', 'document', `return (${code.replace(/^(\s*\/\/[^\n]*\n)+/, '').trim().replace(/;\s*$/, '')});`)(app, {}, {});

describe('pinepaper_import_image scale', () => {
  it('multiplies the size maxWidth gave it: 400x200 at maxWidth 200, scale 2 is 400x200, not 800x400', async () => {
    const s = studio(0.5);
    const code = codeGenerator.generateImportImage({ url: 'data:image/png;base64,AAAA', maxWidth: 200, scale: 2 } as never);
    const r = await run(code, s.app);
    expect(s.modified[0].scale).toBe(1);
    expect(r.bounds).toMatchObject({ width: 400, height: 200 });
    expect(r.look).toMatchObject({ applied: true, scale: 2 });
  });
  it('an image placed at its own size is scaled as before', async () => {
    const s = studio(1);
    const r = await run(codeGenerator.generateImportImage({ url: 'data:image/png;base64,AAAA', scale: 2 } as never), s.app);
    expect(s.modified[0].scale).toBe(2);
    expect(r.bounds).toMatchObject({ width: 800, height: 400 });
  });
});

describe('pinepaper_get_items shows an import mask', () => {
  it('reads the mask type the studio recorded on the masked group', () => {
    const entries = [
      { id: 'item_1', type: 'image', item: { className: 'Group', data: { masked: true, maskType: 'rounded' } } },
      { id: 'item_2', type: 'image', item: { className: 'Raster', data: {} } },
    ];
    const app = { itemRegistry: { getAll: () => entries, get: (id: string) => entries.find((e) => e.id === id) }, getItems: () => entries, getRelations: () => [], getItemById: (id: string) => entries.find((e) => e.id === id)?.item };
    const code = codeGenerator.generateGetItems();
    expect(code).toContain('out.mask = it.data.maskType');
    const fn = new Function('entry', 'app', `return (${code.match(/entry => \{[\s\S]*?\n\}/)![0]})(entry);`);
    expect(fn(entries[0], app).mask).toBe('rounded');
    expect(fn(entries[1], app).mask).toBeUndefined();
  });
});

describe('pinepaper_modify_item imageStart', () => {
  const item = { data: {} };
  const app = (stored: number | null) => ({
    getItemById: () => item, modifyItem: () => true, historyManager: { saveState() {} },
    ...(stored === null ? {} : { getImagePlayback: () => ({ plays: 'loop', imageStart: stored }) }),
    itemRegistry: { get: () => ({ item }) },
  });
  const code = codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { imageStart: 1.5 } } as never);
  it('reads back what the studio stored', () => {
    expect(run(code, app(1.5)).playback).toMatchObject({ applied: true, imageStart: 1.5 });
  });
  it('says so when the studio stored another value', () => {
    const r = run(code, app(0));
    expect(r.playback.applied).toBe(false);
    expect(r.playback.warning).toContain('asked 1.5 s, the studio stored 0 s');
  });
  it('says so when playback cannot be read', () => {
    expect(run(code, app(null)).playback.warning).toContain('could not be confirmed');
  });
  it('a modify without imageStart has no playback field', () => {
    expect(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { opacity: 0.5 } } as never)).not.toContain('__mpb');
  });
});

describe('pinepaper_import_image of an SVG', () => {
  it('says it became pixels and names the vector door; a PNG gets no such note', async () => {
    const { app } = studio(1);
    const svg = await run(codeGenerator.generateImportImage({ url: 'data:image/svg+xml;base64,PHN2Zy8+' } as any), app);
    expect(svg.rasterized).toBe(true);
    expect(svg.svgNote).toContain('pinepaper_import_svg');
    const png = await run(codeGenerator.generateImportImage({ url: 'data:image/png;base64,AAAA' } as any), app);
    expect(png.rasterized).toBeUndefined();
    expect(png.svgNote).toBeUndefined();
  });
});
