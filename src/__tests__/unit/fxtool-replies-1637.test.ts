/**
 * FxTool's asks of mcp-server after its 1.6.37 batches (2026-11-17): imageStart on import with the playback read back,
 * playback in get_items, the studio's keyframe_property_not_animated passed on, strokePosition a checked text key.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { ImportImageInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

describe('IMAGESTART37: import sends imageStart and says what was stored', () => {
  it('is in the schema and the docs, and is sent to placeImage', () => {
    expect(ImportImageInputSchema.parse({ url: 'https://x/a.gif', imageStart: 1 }).imageStart).toBe(1);
    expect(() => ImportImageInputSchema.parse({ url: 'https://x/a.gif', imageStart: -1 })).toThrow();
    expect(JSON.stringify(PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_import_image'))).toContain('imageStart');
    const code = codeGenerator.generateImportImage({ url: 'https://x/a.gif', imageStart: 1.5 } as never);
    expect(code).toContain('imageStart: 1.5');
    expect(code).toContain('app.getImagePlayback(itemId)');
    expect(code).toContain('imageStart was not applied: asked 1.5 s');
    expect(code).toContain('playback: __playback');
  });
  it('emits nothing new without loop or imageStart', () => {
    expect(codeGenerator.generateImportImage({ url: 'https://x/a.png' } as never)).not.toContain('__playback');
  });
});

describe('get_items reads an image playback', () => {
  it('asks getImagePlayback for images', () => {
    expect(codeGenerator.generateGetItems({} as never)).toContain('app.getImagePlayback(it)');
  });
});

describe('FILTKEY35 / STROKEPOSKEY37: the studio dead-key receipt reaches the reply', () => {
  it('keyframe_animate and the batch op read keyframe_property_not_animated', () => {
    const one = codeGenerator.generateKeyframeAnimate({ itemId: 'i', keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 1, properties: { opacity: 1 } }] } as never);
    expect(one).toContain("w.code === 'keyframe_property_not_animated'");
    expect(one).toContain('...(__deadKeys || {})');
  });
  it('strokePosition on text is checked against the animatable list', () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'i', keyframes: [{ time: 0, properties: { strokePosition: 'outside' } }, { time: 1, properties: { strokePosition: 'center' } }] } as never);
    expect(code).toContain('"key":"strokePosition"');
  });
});

describe('EMITEND37 docs', () => {
  it('names colorEnd and opacityEnd', () => {
    const d = JSON.stringify(PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_emitter'));
    expect(d).toContain('colorEnd');
    expect(d).toContain('opacityEnd');
  });
});

describe('FILTKEY35: a studio that reports its own dead keys judges filter settings', () => {
  it('the list check stands down where app._reportUnanimatedKeys exists', () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'i', keyframes: [{ time: 0, properties: { brightness: 0 } }, { time: 1, properties: { brightness: 1 } }] } as never);
    expect(code).toContain("if (typeof app._reportUnanimatedKeys === 'function') return [];");
  });
});

describe('paletteMap swatches must be pairs', () => {
  it('refuses a plain colour list on apply and chain, accepts pairs', async () => {
    const { ImageFilterInputSchema } = await import('../../types/schemas.js');
    expect(() => ImageFilterInputSchema.parse({ action: 'apply', itemId: 'i', filterName: 'paletteMap', params: { swatches: ['#f00', '#00f'] } })).toThrow(/from, to\} pairs/);
    expect(() => ImageFilterInputSchema.parse({ action: 'chain', itemId: 'i', filters: [{ name: 'paletteMap', params: { swatches: ['#f00'] } }] })).toThrow(/from, to\} pairs/);
    expect(ImageFilterInputSchema.parse({ action: 'apply', itemId: 'i', filterName: 'paletteMap', params: { swatches: [{ from: '#f00', to: '#0f0' }] } })).toBeTruthy();
    expect(ImageFilterInputSchema.parse({ action: 'apply', itemId: 'i', filterName: 'brightness', params: { value: 10 } })).toBeTruthy();
  });
});
