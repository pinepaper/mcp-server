/**
 * Two silent failures from one report: an em-sized SVG imported as a ~5 px
 * speck with success: true, and render_soundtrack dropped a top-level duration.
 */
import { describe, it, expect } from 'bun:test';
import { normalizeSvgSize } from '../../utils/svg-size.js';
import { codeGenerator } from '../../types/code-generator.js';
import { SoundInputSchema } from '../../types/schemas.js';

const ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

describe('normalizeSvgSize', () => {
  it('sizes an em icon from its viewBox, scaled to a usable size', () => {
    const r = normalizeSvgSize(ICON);
    expect(r.fix?.to).toBe('200 x 200');
    expect(r.svg).toContain('<svg width="200" height="200"');
    expect(r.svg).not.toContain('1em');
  });
  it('keeps the aspect ratio and a large viewBox as-is', () => {
    expect(normalizeSvgSize('<svg width="100%" viewBox="0 0 12 6"></svg>').fix?.to).toBe('200 x 100');
    expect(normalizeSvgSize('<svg viewBox="0 0 800 600"></svg>').fix?.to).toBe('800 x 600');
  });
  it('leaves pixel sizes and viewBox-less roots alone', () => {
    const px = '<svg width="24" height="24" viewBox="0 0 24 24"></svg>';
    expect(normalizeSvgSize(px)).toEqual({ svg: px, fix: null });
    expect(normalizeSvgSize('<svg width="1em"></svg>').fix).toBeNull();
  });
  it('does not touch width attributes on child elements', () => {
    const r = normalizeSvgSize('<svg width="1em" height="1em" viewBox="0 0 24 24"><rect width="10" height="5"/></svg>');
    expect(r.svg).toContain('<rect width="10" height="5"/>');
  });
});

describe('import SVG code', () => {
  it('imports the normalised SVG, reports the fix and checks for a speck', () => {
    const code = codeGenerator.generateImportSVG(ICON);
    expect(code).toContain('width="200" height="200"');
    expect(code).toContain('sizeFix:');
    expect(code).toContain('too small to see');
    expect(() => new Function(`return async () => { ${code} }`)).not.toThrow();
  });
  it('checks a URL import for a speck too', () => {
    const code = codeGenerator.generateImportSVG(undefined, 'https://example.com/a.svg');
    expect(code).toContain('too small to see');
    expect(() => new Function(`return async () => { ${code} }`)).not.toThrow();
  });
});

describe('render_soundtrack duration', () => {
  it('keeps a top-level duration', () => {
    expect(SoundInputSchema.parse({ action: 'render_soundtrack', duration: 12 }).duration).toBe(12);
  });
  it('emits the top-level duration, and prefers it over options.duration', () => {
    const code = codeGenerator.generateSound(SoundInputSchema.parse({ action: 'render_soundtrack', duration: 12, options: { duration: 3 } }));
    expect(code).toMatch(/"duration":\s*12/);
    expect(code).not.toMatch(/"duration":\s*3\b/);
    const legacy = codeGenerator.generateSound(SoundInputSchema.parse({ action: 'render_soundtrack', options: { duration: 7 } }));
    expect(legacy).toMatch(/"duration":\s*7/);
  });
  it('holds a top-level duration to the video cap', () => {
    expect(SoundInputSchema.safeParse({ action: 'render_soundtrack', duration: 100000 }).success).toBe(false);
  });
});
