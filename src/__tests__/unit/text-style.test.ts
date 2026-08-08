/**
 * pinepaper_text_style — display styles + variable-font axes via the
 * PinePaper facades (applyTextStyle / setFontAxes / listTextStyles).
 *
 * The contract points that matter: the styled group ADOPTS the text's registry
 * id (callers' handles keep working — say so in the result), and set_font_axes
 * must surface `rejected` (an axis silently ignored is the exact failure the
 * FxTool facade was built to prevent; hiding it here would reintroduce it).
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { TextStyleInputSchema } from '../../types/schemas.js';

describe('TextStyleInputSchema validation', () => {
  it('apply_style requires itemId and styleKey', () => {
    expect(TextStyleInputSchema.safeParse({ action: 'apply_style' }).success).toBe(false);
    expect(TextStyleInputSchema.safeParse({ action: 'apply_style', itemId: 't1' }).success).toBe(false);
    expect(TextStyleInputSchema.safeParse({ action: 'apply_style', itemId: 't1', styleKey: 'arcade' }).success).toBe(true);
  });

  it('set_font_axes requires at least one axis — {} is a no-op pretending to work', () => {
    expect(TextStyleInputSchema.safeParse({ action: 'set_font_axes', itemId: 't1' }).success).toBe(false);
    expect(TextStyleInputSchema.safeParse({ action: 'set_font_axes', itemId: 't1', axes: {} }).success).toBe(false);
    expect(TextStyleInputSchema.safeParse({ action: 'set_font_axes', itemId: 't1', axes: { weight: 700 } }).success).toBe(true);
  });

  it('list_styles needs nothing', () => {
    expect(TextStyleInputSchema.safeParse({ action: 'list_styles' }).success).toBe(true);
  });

  it('palette accepts a named colourway or an explicit array', () => {
    expect(TextStyleInputSchema.safeParse({ action: 'apply_style', itemId: 't1', styleKey: 's', palette: 'sunset' }).success).toBe(true);
    expect(TextStyleInputSchema.safeParse({ action: 'apply_style', itemId: 't1', styleKey: 's', palette: ['#f00', '#00f'] }).success).toBe(true);
  });
});

describe('generateTextStyle codegen', () => {
  it('apply_style forwards options and reports the ADOPTED id', () => {
    const c = codeGenerator.generateTextStyle(TextStyleInputSchema.parse({
      action: 'apply_style', itemId: 't1', styleKey: 'arcade', fontFamily: 'suggested', variant: 2,
    }));
    expect(c).toContain('app.applyTextStyle("t1", "arcade"');
    expect(c).toContain('"fontFamily":"suggested"');
    expect(c).toContain('"variant":2');
    // r.id IS the caller's id (the group adopts it) — the result must carry it
    // so the caller learns their handle still works.
    expect(c).toContain('id: r.id');
    expect(c).toContain('app.applyTextStyle unavailable');
  });

  it('set_font_axes surfaces rejected axes, not just applied ones', () => {
    const c = codeGenerator.generateTextStyle(TextStyleInputSchema.parse({
      action: 'set_font_axes', itemId: 't1', axes: { weight: 700, slant: -8 },
    }));
    expect(c).toContain('app.setFontAxes("t1", {"weight":700,"slant":-8})');
    expect(c).toContain('applied: r.applied');
    expect(c).toContain('rejected: r.rejected');
  });

  it('list_styles degrades per-facade — palettes/axes may be older builds', () => {
    const c = codeGenerator.generateTextStyle(TextStyleInputSchema.parse({ action: 'list_styles' }));
    expect(c).toContain('app.listTextStyles()');
    expect(c).toContain("typeof app.listTextPalettes === 'function'");
    expect(c).toContain("typeof app.listFontAxes === 'function'");
  });

  it('every action emits parseable code with no history double-snapshot', () => {
    for (const input of [
      { action: 'apply_style' as const, itemId: 't1', styleKey: 's' },
      { action: 'set_font_axes' as const, itemId: 't1', axes: { weight: 500 } },
      { action: 'list_styles' as const },
    ]) {
      const c = codeGenerator.generateTextStyle(TextStyleInputSchema.parse(input));
      expect(() => new Function(c)).not.toThrow();
      expect(c).not.toContain('historyManager.saveState');
    }
  });
});
