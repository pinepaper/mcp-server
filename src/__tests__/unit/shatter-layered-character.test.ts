/**
 * pinepaper_shatter_image + pinepaper_import_layered_character.
 *
 * Shatter's contract point: the tile group ADOPTS the original's registry id
 * and the result is inert by design. Layered character's contract point: the
 * importer takes a Map (it calls images.get) while the wire format is a plain
 * object — the emitter must rebuild the Map, and the result must surface
 * rolesWired, because a character with 0 wired roles renders perfectly and
 * silently refuses to animate (the documented cold-boot failure).
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { ShatterImageInputSchema, ImportLayeredCharacterInputSchema } from '../../types/schemas.js';

describe('pinepaper_shatter_image', () => {
  it('requires itemId; caps the grid', () => {
    expect(ShatterImageInputSchema.safeParse({}).success).toBe(false);
    expect(ShatterImageInputSchema.safeParse({ itemId: 'img_1' }).success).toBe(true);
    expect(ShatterImageInputSchema.safeParse({ itemId: 'img_1', pieces: 100000 }).success).toBe(false);
    expect(ShatterImageInputSchema.safeParse({ itemId: 'img_1', rows: 500 }).success).toBe(false);
  });

  it('emits the facade call and reports the ACTUAL grid, not the request', () => {
    // pieces:100 on a 3:2 photo becomes 12x8=96 — the caller needs the real
    // rows/cols to keyframe tiles by index.
    const c = codeGenerator.generateShatterImage(ShatterImageInputSchema.parse({ itemId: 'img_1', pieces: 100, keepSource: true }));
    expect(c).toContain('app.shatterImage("img_1"');
    expect(c).toContain('"keepSource":true');
    expect(c).toContain('tiles: r.tiles');
    expect(c).toContain('rows: r.rows');
    expect(c).toContain('groupId: r.groupId'); // = the adopted original id
    expect(() => new Function(c)).not.toThrow();
  });

  it('rows/cols pass through as an exact grid', () => {
    const c = codeGenerator.generateShatterImage(ShatterImageInputSchema.parse({ itemId: 'img_1', rows: 4, cols: 6 }));
    expect(c).toContain('"rows":4');
    expect(c).toContain('"cols":6');
  });
});

describe('pinepaper_import_layered_character', () => {
  const INFO = { frame_size: [800, 600], layers: [{ tag: 'eyel', xyxy: [10, 10, 50, 40], depth_median: 3 }] };
  const IMAGES = { eyel: 'data:image/png;base64,iVBORw0KGgo=' };

  it('requires info and a non-empty images object', () => {
    expect(ImportLayeredCharacterInputSchema.safeParse({ info: INFO }).success).toBe(false);
    expect(ImportLayeredCharacterInputSchema.safeParse({ info: INFO, images: {} }).success).toBe(false);
    expect(ImportLayeredCharacterInputSchema.safeParse({ info: INFO, images: IMAGES }).success).toBe(true);
  });

  it('rebuilds the Map the importer contract demands from the wire object', () => {
    // bundle.images must answer .get() — passing the plain object through would
    // throw 'bundle.images must be a Map' on every single call.
    const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({ info: INFO, images: IMAGES }));
    expect(c).toContain('new Map(Object.entries(');
    expect(c).toContain('await app.importLayeredCharacter(bundle');
  });

  it('surfaces rolesWired — 0 roles is a picture pretending to be a puppet', () => {
    const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({ info: INFO, images: IMAGES }));
    expect(c).toContain('rolesWired: Object.keys(r.roles || {}).length');
    expect(c).toContain('warnings: r.warnings');
  });

  it('forwards placement options and parses', () => {
    const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({
      info: INFO, images: IMAGES, position: { x: 400, y: 300 }, scale: 0.5, name: 'hero',
    }));
    expect(c).toContain('"position":{"x":400,"y":300}');
    expect(c).toContain('"scale":0.5');
    expect(() => new Function(c)).not.toThrow();
  });

  it('a data URL with base64 padding survives the round-trip into emitted code', () => {
    const tricky = { chr: 'data:image/png;base64,AA==' };
    const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({ info: INFO, images: tricky }));
    expect(c).toContain('AA==');
    expect(() => new Function(c)).not.toThrow();
  });
});
