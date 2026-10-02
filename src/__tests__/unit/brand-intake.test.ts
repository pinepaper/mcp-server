/**
 * pinepaper_brand_kit from_url (G4 brand half): the role choice is pure.
 * Verified live against pinepaper.studio: 3 screenshots, the logo (its SVG
 * icon), Inter for heading and body, slate background, and the indigo that
 * fills the call-to-action buttons as primary.
 */

import { describe, it, expect } from 'bun:test';
import { chooseKit, firstRealFont, type PageMeasure, type SeenColor } from '../../tools/handlers/brand-intake.js';
import { BrandKitInputSchema } from '../../types/schemas.js';

const c = (hex: string, rgb: [number, number, number], weight: number, roles: Record<string, number>): SeenColor => ({ hex, rgb, weight, roles });
const page = (colors: SeenColor[], over: Partial<PageMeasure> = {}): PageMeasure => ({
  title: 'Acme', background: [15, 23, 42], text: [203, 213, 225], colors,
  headingFont: 'Inter, "Inter Fallback", system-ui, sans-serif', bodyFont: 'Inter, sans-serif',
  logo: null, icons: [], ogImage: null, pageHeight: 3000, ...over,
});

describe('chooseKit', () => {
  it('the colour filling buttons is primary, even when a text tint covers more of the page', () => {
    const kit = chooseKit(page([
      c('#a5b4fc', [165, 180, 252], 90000, { text: 60000, heading: 30000 }),
      c('#4f46e5', [79, 70, 229], 12000, { 'action-bg': 12000 }),
      c('#eab308', [234, 179, 8], 3000, { bg: 3000 }),
    ]));
    expect(kit.colors.primary).toBe('#4f46e5');
    expect(kit.colors.secondary).toBe('#a5b4fc');
    expect(kit.colors.accent).toBe('#eab308');
    expect(kit.colors.background).toBe('#0f172a');
  });

  it('greys and the page\'s own background/text are never brand colours', () => {
    const kit = chooseKit(page([
      c('#1e293b', [30, 41, 59], 900000, { bg: 900000 }),
      c('#9fadc0', [159, 173, 192], 500000, { text: 500000 }),
      c('#e11d48', [225, 29, 72], 4000, { action: 4000 }),
    ]));
    expect(kit.colors.primary).toBe('#e11d48');
  });

  it('a monochrome site keeps its text colour as primary', () => {
    const kit = chooseKit(page([c('#222222', [34, 34, 34], 1000, { text: 1000 })], { background: [255, 255, 255], text: [17, 17, 17] }));
    expect(kit.colors.primary).toBe('#111111');
  });

  it('fonts skip fallbacks and generics; the kit has the shape apply takes', () => {
    expect(firstRealFont('"Inter Fallback", system-ui')).toBe('Inter Fallback');
    expect(firstRealFont('system-ui, -apple-system, sans-serif')).toBeUndefined();
    const kit = chooseKit(page([]));
    expect(kit.fonts).toEqual({ heading: 'Inter', body: 'Inter' });
    expect(BrandKitInputSchema.safeParse({ action: 'apply', kit }).success).toBe(true);
  });
});

describe('from_url input', () => {
  it('needs an http(s) url; plan and apply still need a kit', () => {
    expect(BrandKitInputSchema.safeParse({ action: 'from_url', url: 'https://pinepaper.studio' }).success).toBe(true);
    expect(BrandKitInputSchema.safeParse({ action: 'from_url' }).success).toBe(false);
    expect(BrandKitInputSchema.safeParse({ action: 'from_url', url: 'file:///etc/passwd' }).success).toBe(false);
    expect(BrandKitInputSchema.safeParse({ action: 'apply' }).success).toBe(false);
  });
});
