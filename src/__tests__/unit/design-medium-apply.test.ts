/**
 * pinepaper_design_medium `apply` (M3, FxTool #54): one action for every
 * medium the engine can apply, through app.applyMedium. Verified live on
 * pinepaper.studio: watercolor, oil (stylised, with its note) and cutPaper
 * applied to stars; encaustic and charcoal refused with the engine's reasons.
 */
import { describe, it, expect } from 'bun:test';
import { DesignMediumInputSchema } from '../../types/schemas.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { DESIGN_MEDIA_APPLY } from '../../tools/engine-lists.js';

const gen = new PinePaperCodeGenerator();

describe('design_medium apply', () => {
  it('needs itemId and a medium the engine knows', () => {
    expect(DesignMediumInputSchema.safeParse({ action: 'apply', medium: 'watercolor' }).success).toBe(false);
    expect(DesignMediumInputSchema.safeParse({ action: 'apply', itemId: 'a', medium: 'crayon' }).success).toBe(false);
    expect(DesignMediumInputSchema.safeParse({ action: 'apply', itemId: 'a', medium: 'encaustic' }).success).toBe(true); // the engine refuses it, with its reason
  });

  it('goes through app.applyMedium with the options, and never returns the Paper item', () => {
    const code = gen.generateDesignMedium(DesignMediumInputSchema.parse({ action: 'apply', itemId: 'item_3', medium: 'cutPaper', options: { color: '#f39c12', shadow: true } }) as never);
    expect(code).toContain('app.applyMedium("item_3", "cutPaper", {"color":"#f39c12","shadow":true})');
    expect(code).toContain('itemId: r.id');
    expect(code).not.toMatch(/item: r\.item/);
  });

  it('the media apply works for come from the engine table', () => {
    expect(Object.keys(DESIGN_MEDIA_APPLY)).toEqual(expect.arrayContaining(['watercolor', 'oil', 'cutPaper']));
  });
});
