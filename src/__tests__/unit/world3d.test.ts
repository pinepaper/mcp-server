/**
 * pinepaper_world3d + the palette actions — the surfaces for the two newest
 * engine capabilities (js/world3d renderer; GPU palette analyze/recolor).
 *
 * World3D's design point: `describe` returns the ENGINE's parameter schema, so
 * the tool never restates it and cannot drift — the same reason benchmark
 * scaffolds are snapshots. Every world-touching action guards on the world
 * existing WITH the create hint in the error, because "undefined is not an
 * object" tells an agent nothing.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { World3DInputSchema, ImageFilterInputSchema } from '../../types/schemas.js';

describe('World3DInputSchema validation', () => {
  it('create/describe/list need nothing beyond the action', () => {
    for (const action of ['create', 'describe', 'list_actors', 'remove_world'] as const) {
      expect(World3DInputSchema.safeParse({ action }).success).toBe(true);
    }
  });

  it('configure requires a patch; pose/camera/object require their payloads', () => {
    expect(World3DInputSchema.safeParse({ action: 'configure' }).success).toBe(false);
    expect(World3DInputSchema.safeParse({ action: 'configure', patch: { env: { fogRange: [20, 120] } } }).success).toBe(true);
    expect(World3DInputSchema.safeParse({ action: 'set_actor_pose', actorId: 'hero' }).success).toBe(false);
    expect(World3DInputSchema.safeParse({ action: 'set_actor_pose', actorId: 'hero', pose: { x: 4 } }).success).toBe(true);
    expect(World3DInputSchema.safeParse({ action: 'set_camera' }).success).toBe(false);
    expect(World3DInputSchema.safeParse({ action: 'set_camera', camera: { mode: 'orbit', target: 'hero' } }).success).toBe(true);
  });
});

describe('generateWorld3D codegen', () => {
  it('create defaults to the forest preset and reports configurable keys', () => {
    const c = codeGenerator.generateWorld3D(World3DInputSchema.parse({ action: 'create' }));
    expect(c).toContain('await app.createWorld3D("forest"');
    expect(c).toContain('configurableKeys');
  });

  it('create forwards a full spec object untouched', () => {
    const c = codeGenerator.generateWorld3D(World3DInputSchema.parse({ action: 'create', spec: { world: 'snowMountain', seed: 7 }, character: true }));
    expect(c).toContain('{"world":"snowMountain","seed":7}');
    expect(c).toContain('"character":true');
  });

  it('every world-touching action carries the create hint in its guard', () => {
    // "no 3D world" without the fix is a dead end; with it, it is the next call.
    for (const input of [
      { action: 'configure' as const, patch: { seed: 1 } },
      { action: 'add_actor' as const },
      { action: 'list_actors' as const },
      { action: 'set_actor_pose' as const, actorId: 'a', pose: {} },
      { action: 'set_camera' as const, camera: { mode: 'fixed' } },
      { action: 'add_object' as const, object: { x: 0, z: 0 } },
    ]) {
      const c = codeGenerator.generateWorld3D(World3DInputSchema.parse(input));
      expect(c).toContain('call pinepaper_world3d create first');
      expect(() => new Function(c)).not.toThrow();
    }
  });

  it('add_object forwards PBR material fields (metalness, roughness, emissiveIntensity)', () => {
    const c = codeGenerator.generateWorld3D(World3DInputSchema.parse({
      action: 'add_object',
      object: { x: 10, z: -20, height: 5, color: '#3b82f6', metalness: 0.8, roughness: 0.2, emissiveIntensity: 0.5 },
    }));
    expect(c).toContain('"metalness":0.8');
    expect(c).toContain('"roughness":0.2');
    expect(c).toContain('"emissiveIntensity":0.5');
    expect(() => new Function(c)).not.toThrow();
  });

  it('add_actor forwards live sprites — the rigged-character path', () => {
    const c = codeGenerator.generateWorld3D(World3DInputSchema.parse({
      action: 'add_actor', actorId: 'hero', x: 4, z: -6, sprite: 'item_3', live: true, height: 3,
    }));
    expect(c).toContain('"sprite":"item_3"');
    expect(c).toContain('"live":true');
    expect(c).toContain('"id":"hero"');
  });

  it('configure forwards the validator error verbatim — it names the right key', () => {
    const c = codeGenerator.generateWorld3D(World3DInputSchema.parse({ action: 'configure', patch: { terain: {} } }));
    expect(c).toContain('(r && r.error)');
  });
});

describe('palette actions on pinepaper_image_filter', () => {
  it('analyze_palette validates and emits the facade with swatch cap', () => {
    const c = codeGenerator.generateImageFilter(ImageFilterInputSchema.parse({
      action: 'analyze_palette', itemId: 'img_1', maxSwatches: 6,
    }));
    expect(c).toContain('await app.analyzePalette("img_1", {"maxSwatches":6})');
    expect(c).toContain('swatches: r.swatches');
  });

  it('recolor_palette takes both mapping shapes', () => {
    for (const mapping of [
      [{ from: '#ff0000', to: '#00ff00' }],
      { '#ff0000': '#00ff00' },
    ]) {
      const p = ImageFilterInputSchema.safeParse({ action: 'recolor_palette', itemId: 'img_1', mapping });
      expect(p.success).toBe(true);
      const c = codeGenerator.generateImageFilter(p.success ? p.data : (null as any));
      expect(c).toContain('await app.recolorPalette("img_1"');
      expect(() => new Function(c)).not.toThrow();
    }
  });

  it('palette facades THROW on a bad item — the emitters catch and report', () => {
    for (const input of [
      { action: 'analyze_palette' as const, itemId: 'x' },
      { action: 'recolor_palette' as const, itemId: 'x', mapping: { '#000000': '#ffffff' } },
    ]) {
      const c = codeGenerator.generateImageFilter(ImageFilterInputSchema.parse(input));
      expect(c).toContain('catch');
    }
  });
});
