/**
 * pinepaper_crop_image / pinepaper_chroma_key — one-shot image ops calling
 * the FxTool facades app.cropImage / app.applyChromaKey (Track A parity).
 * Also pins the pinepaper_image_filter emitter to the REAL engine entry
 * points (app.applyImageFilter / applyImageFilterChain) — the old emitter
 * called app.imageTools.applyFilter, which never existed.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { CropImageInputSchema, ChromaKeyInputSchema, EffectTypeSchema } from '../../types/schemas.js';

describe('CropImageInputSchema validation', () => {
  it('requires itemId + a positive-size rect', () => {
    expect(CropImageInputSchema.safeParse({ itemId: 'item_1' }).success).toBe(false);
    expect(CropImageInputSchema.safeParse({ itemId: 'item_1', rect: { x: 0, y: 0, width: -5, height: 10 } }).success).toBe(false);
    expect(CropImageInputSchema.safeParse({ itemId: 'item_1', rect: { x: 10, y: 20, width: 100, height: 50 } }).success).toBe(true);
  });
  it('accepts only known aspect ratios', () => {
    expect(CropImageInputSchema.safeParse({ itemId: 'i', rect: { x: 0, y: 0, width: 10, height: 10 }, aspectRatio: '16:9' }).success).toBe(true);
    expect(CropImageInputSchema.safeParse({ itemId: 'i', rect: { x: 0, y: 0, width: 10, height: 10 }, aspectRatio: '21:9' }).success).toBe(false);
  });
});

describe('ChromaKeyInputSchema validation', () => {
  it('requires itemId; threshold/smoothing bounded', () => {
    expect(ChromaKeyInputSchema.safeParse({}).success).toBe(false);
    expect(ChromaKeyInputSchema.safeParse({ itemId: 'i' }).success).toBe(true);
    expect(ChromaKeyInputSchema.safeParse({ itemId: 'i', threshold: 300 }).success).toBe(false);
    expect(ChromaKeyInputSchema.safeParse({ itemId: 'i', color: 'green', threshold: 60, smoothing: 12 }).success).toBe(true);
  });
});

describe('generateCropImage codegen', () => {
  it('awaits app.cropImage with the rect and guards availability', () => {
    const code = codeGenerator.generateCropImage({ itemId: 'item_3', rect: { x: 10, y: 20, width: 100, height: 50 } });
    expect(code).toContain('await app.cropImage("item_3"');
    expect(code).toContain('"width":100');
    expect(code).toContain('app.cropImage unavailable');
    expect(code).toContain('async function');
  });
  it('passes aspectRatio through as options', () => {
    const code = codeGenerator.generateCropImage({ itemId: 'i', rect: { x: 0, y: 0, width: 10, height: 10 }, aspectRatio: '1:1' });
    expect(code).toContain('"aspectRatio":"1:1"');
  });
});

describe('generateChromaKey codegen', () => {
  it('awaits app.applyChromaKey with options and guards availability', () => {
    const code = codeGenerator.generateChromaKey({ itemId: 'item_5', color: 'green', threshold: 60, smoothing: 10 });
    expect(code).toContain('await app.applyChromaKey("item_5"');
    expect(code).toContain('"color":"green"');
    expect(code).toContain('"threshold":60');
    expect(code).toContain('app.applyChromaKey unavailable');
  });
  it('omits unset options so the engine auto-estimates', () => {
    const code = codeGenerator.generateChromaKey({ itemId: 'i' });
    expect(code).not.toContain('threshold');
    expect(code).not.toContain('smoothing');
  });
});

describe('generateImageFilter uses the real engine entry points', () => {
  it('apply → app.applyImageFilter on a resolved raster (never app.imageTools.applyFilter)', () => {
    const code = codeGenerator.generateImageFilter({ action: 'apply', itemId: 'item_2', filterName: 'halftoneDots', params: { size: 8 } });
    expect(code).toContain('app.applyImageFilter(item, "halftoneDots"');
    expect(code).toContain('_resolveRaster');
    expect(code).not.toContain('imageTools.applyFilter');
  });
  it('chain → app.applyImageFilterChain', () => {
    const code = codeGenerator.generateImageFilter({ action: 'chain', itemId: 'item_2', filters: [{ name: 'grayscale', params: {} }] });
    expect(code).toContain('app.applyImageFilterChain(item, filters)');
    expect(code).not.toContain('imageTools.applyFilterChain');
  });
});

describe('EffectTypeSchema includes shader auras', () => {
  it('accepts the three aura names', () => {
    for (const aura of ['heatmap', 'liquid_metal', 'gem_smoke']) {
      expect(EffectTypeSchema.safeParse(aura).success).toBe(true);
    }
  });
});
