/**
 * pinepaper_place_on_surface (D22, FxTool #56). Verified live against
 * pinepaper.studio on a synthetic phone photo: explicit corners place the UI
 * with the thumb kept in front (matteCoverage 0.943); detection finds three
 * corners within ~1 px and pulls the occluded one in (the result's quad says so).
 */
import { describe, it, expect } from 'bun:test';
import { PlaceOnSurfaceInputSchema } from '../../types/schemas.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator();

describe('place_on_surface', () => {
  it('needs the photo and the UI; corners are four [x, y]', () => {
    expect(PlaceOnSurfaceInputSchema.safeParse({ photoId: 'p' }).success).toBe(false);
    expect(PlaceOnSurfaceInputSchema.safeParse({ photoId: 'p', sourceId: 'u', quad: [[0, 0], [1, 0], [1, 1]] }).success).toBe(false);
    expect(PlaceOnSurfaceInputSchema.safeParse({ photoId: 'p', sourceId: 'u', quad: [[0, 0], [1, 0], [1, 1], [0, 1]] }).success).toBe(true);
  });

  it('passes every option by name and awaits the engine', () => {
    const code = gen.generatePlaceOnSurface(PlaceOnSurfaceInputSchema.parse({ photoId: 'item_1', sourceId: 'item_2', glare: 0.2, slot: 'tv', hideSource: false }));
    expect(code).toContain('await app.placeOnSurface("item_1", "item_2", {"glare":0.2,"slot":"tv","hideSource":false})');
    expect(code).not.toContain('r.item');
  });
});
