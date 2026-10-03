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
    expect(c).toContain('const images = new Map();');
    expect(c).toContain('await app.importLayeredCharacter(bundle');
  });

  it('surfaces rolesWired — 0 roles is a picture pretending to be a puppet', () => {
    const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({ info: INFO, images: IMAGES }));
    expect(c).toContain('rolesWired: Object.keys(r.roles || {}).length');
    expect(c).toContain('...(r.warnings || [])');
  });

  // Gate 1.6.19: eye_left / eye_right were skipped as "no image found" while the
  // call reported success with rolesWired 2. Run the EMITTED code against a fake
  // importer that applies the engine's lookup rule (images.has(normalizePartTag))
  // and its taxonomy's suffix rule (role tokens are not tags: eyel is).
  it('keys reach the engine normalised + role tokens aliased; a dropped layer fails by name', async () => {
    const engineNorm = (t: string) => t.trim().toLowerCase().replace(/[_\-\s]+/g, ' ').trim();
    const seen: { images: string[]; parts: string[] } = { images: [], parts: [] };
    const fakeApp = {
      importLayeredCharacter: async (b: { info: { parts: Record<string, unknown> }; images: Map<string, string> }) => {
        seen.images = [...b.images.keys()];
        seen.parts = Object.keys(b.info.parts);
        const tags = seen.parts.filter((t) => b.images.has(engineNorm(t)));
        return { groupId: 'g1', parts: tags.map((tag) => ({ id: tag, role: tag, tag })), roles: Object.fromEntries(tags.map((t) => [t, t])), warnings: [] };
      },
    };
    const run = (info: unknown, images: Record<string, string>) => {
      const c = codeGenerator.generateImportLayeredCharacter(ImportLayeredCharacterInputSchema.parse({ info, images }));
      return new Function('app', 'return ' + c.replace(/^\/\/.*\n/, ''))(fakeApp);
    };
    const r = [0, 0, 10, 10];
    const ok = await run({ frame_size: [100, 100], parts: { eye_left: { xyxy: r }, pupil_right: { xyxy: r }, front_hair: { xyxy: r } } },
      { eye_left: 'data:,', pupil_right: 'data:,', 'front-hair': 'data:,' });
    expect(seen.images).toEqual(['eyel', 'iridesr', 'front hair']);
    expect(seen.parts).toEqual(['eyel', 'iridesr', 'front hair']);
    expect(ok.success).toBe(true);
    expect(ok.skipped).toEqual([]);

    const bad = await run({ frame_size: [100, 100], parts: { mouth: { xyxy: r } } }, { mouth: 'data:,', eye_left: 'data:,' });
    expect(bad.success).toBe(false);
    expect(bad.skipped).toEqual(['eye_left']);
    expect(bad.error).toContain('eye_left');
    expect(bad.groupId).toBe('g1');
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
