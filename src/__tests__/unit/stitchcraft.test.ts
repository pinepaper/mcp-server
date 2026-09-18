import { describe, it, expect } from 'bun:test';
import {
  StitchcraftPresetSchema,
  StitchcraftInputSchema,
  STITCHCRAFT_PRESET_NAMES,
} from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';
import { I18nManager } from '../../i18n/index.js';

describe('Stitchcraft Procedural Rendering', () => {
  it('exposes all 6 canonical Stitchcraft presets', () => {
    expect(STITCHCRAFT_PRESET_NAMES).toEqual([
      'embroidery_satin',
      'running_seam',
      'cross_stitch',
      'needlepainting',
      'stem_outline',
      'seed_texture',
    ]);
  });

  it('validates canonical preset names', () => {
    for (const preset of STITCHCRAFT_PRESET_NAMES) {
      const parsed = StitchcraftPresetSchema.parse(preset);
      expect(parsed).toBe(preset);
    }
  });

  it('normalizes common aliases for open-source LLMs', () => {
    expect(StitchcraftPresetSchema.parse('satin')).toBe('embroidery_satin');
    expect(StitchcraftPresetSchema.parse('satin_stitch')).toBe('embroidery_satin');
    expect(StitchcraftPresetSchema.parse('running')).toBe('running_seam');
    expect(StitchcraftPresetSchema.parse('seam')).toBe('running_seam');
    expect(StitchcraftPresetSchema.parse('cross')).toBe('cross_stitch');
    expect(StitchcraftPresetSchema.parse('crossstitch')).toBe('cross_stitch');
    expect(StitchcraftPresetSchema.parse('cross-stitch')).toBe('cross_stitch');
    expect(StitchcraftPresetSchema.parse('stem')).toBe('stem_outline');
    expect(StitchcraftPresetSchema.parse('stem_stitch')).toBe('stem_outline');
    expect(StitchcraftPresetSchema.parse('seed')).toBe('seed_texture');
    expect(StitchcraftPresetSchema.parse('seed_stitch')).toBe('seed_texture');
    expect(StitchcraftPresetSchema.parse('needle')).toBe('needlepainting');
    expect(StitchcraftPresetSchema.parse('thread')).toBe('needlepainting');
    expect(StitchcraftPresetSchema.parse('thread_painting')).toBe('needlepainting');
  });

  it('coerces parameter aliases and string numbers gracefully', () => {
    const input = StitchcraftInputSchema.parse({
      preset: 'satin',
      itemId: 'rect_1',
      color: '#3b82f6',
      width: '2.5',
      density: '1.2',
      roughness: '1.5',
      bowing: '0.8',
      sheen: true,
      seed: 42,
    });

    expect(input.preset).toBe('embroidery_satin');
    expect(input.itemId).toBe('rect_1');
    expect(input.threadColor).toBe('#3b82f6');
    expect(input.strokeWidth).toBe(2.5);
    expect(input.density).toBe(1.2);
    expect(input.roughness).toBe(1.5);
    expect(input.bowing).toBe(0.8);
    expect(input.sheen).toBe(true);
    expect(input.seed).toBe(42);
  });

  it('generates executable browser JavaScript with text guard and fallback', () => {
    const code = codeGenerator.generateStitchcraft({
      preset: 'embroidery_satin',
      itemId: 'circle_1',
      threadColor: '#d97706',
      strokeWidth: 2,
      density: 1.5,
      roughness: 1,
      sheen: true,
    });

    expect(code).toContain('app.applyStitchcraftToItem');
    expect(code).toContain('window.applyStitchcraftToItem');
    expect(code).toContain('app.applyThreadPainting');
    expect(code).toContain('"embroidery_satin"');
    expect(code).toContain('"circle_1"');
    expect(code).toContain('#d97706');
    expect(code).toContain('A text item has no outline to stitch directly');
  });

  it('is registered in PINEPAPER_TOOLS definitions', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_stitchcraft');
    expect(tool).toBeDefined();
    expect(tool?.description).toContain('Create procedural embroidery');
    expect(tool?.inputSchema.required).toEqual(['preset']);
  });

  it('executes via handleToolCall in dry-run code generation mode', async () => {
    const i18n = new I18nManager();
    const result = await handleToolCall('pinepaper_create_stitchcraft', {
      preset: 'cross_stitch',
      threadColor: '#10b981',
      strokeWidth: 1.5,
    }, { i18n });

    expect(result.isError).toBeFalsy();
    const text = result.content[0].type === 'text' ? result.content[0].text : '';
    expect(text).toContain('cross_stitch');
  });
});
