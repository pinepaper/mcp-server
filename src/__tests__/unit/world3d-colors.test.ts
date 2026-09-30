/**
 * World3D colours and refusals, as reported from a 3D Halloween frame on prod
 * (2026-09-29):
 *
 * W1 `configure {env:{zenith:"#03050c"}}` came back "configure failed" and
 *    nothing else. Two faults: the hex converter only touched keys named
 *    `color` (none of the world's eleven colour fields is), and the emitter
 *    read `r.error` where the engine answers `errors: string[]`, so the
 *    validator's reason never reached the agent.
 * W2 `add_material {color:"#e9e4d8"}` was refused by OUR schema.
 * W3 `ground_height {x, z}` was refused for a missing y it never reads.
 *
 * The colour paths are FxTool WORLD_SCHEMA's kind:'color' entries
 * (js/world3d/worlds.js on origin/main); refresh the fixture when it changes.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PinePaperCodeGenerator, WORLD3D_COLOR_PATHS, world3dSpecColors } from '../../types/code-generator.js';
import { World3DInputSchema } from '../../types/schemas.js';

const ENGINE = readFileSync(join(import.meta.dir, '..', 'fixtures', 'engine-world3d-color-paths.txt'), 'utf-8')
  .split('\n').map((l) => l.trim()).filter(Boolean);

const gen = new PinePaperCodeGenerator();
const emit = (input: Record<string, unknown>) => gen.generateWorld3D(World3DInputSchema.parse(input) as never);

describe('world3d colour fields', () => {
  it('the colour paths are exactly the engine schema\'s', () => {
    expect([...WORLD3D_COLOR_PATHS].sort()).toEqual([...ENGINE].sort());
  });

  it('configure converts a hex env colour to [r, g, b] in 0..1', () => {
    const out = world3dSpecColors({ env: { zenith: '#03050c', fogRange: [20, 120] }, seed: 3 }) as any;
    expect(out.env.zenith.map((n: number) => +n.toFixed(4))).toEqual([0.0118, 0.0196, 0.0471]);
    expect(out.env.fogRange).toEqual([20, 120]);
    expect(out.seed).toBe(3);
    expect(emit({ action: 'configure', patch: { env: { zenith: '#03050c' } } })).not.toContain('#03050c');
  });

  it('an array colour is left alone (no /255 on values the engine meant)', () => {
    const out = world3dSpecColors({ env: { sunColor: [1.4, 1.2, 1] } }) as any;
    expect(out.env.sunColor).toEqual([1.4, 1.2, 1]);
  });

  it('materials and lights take hex; a light array may exceed 1', () => {
    const mat = emit({ action: 'add_material', material: { color: '#e9e4d8', emissive: '#000000', sheenColor: '#ffffff' } });
    expect(mat).not.toContain('#e9e4d8');
    expect(mat).toContain('"sheenColor":[1,1,1]');
    const light = emit({ action: 'add_light', light: { color: [2, 1.7, 1.2] } });
    expect(light).toContain('"color":[2,1.7,1.2]');
    expect(emit({ action: 'add_light', light: { color: '#ffdca0' } })).not.toContain('#ffdca0');
  });
});

describe('world3d refusals say why', () => {
  it('every refusal reads error, errors[] or reason — not error alone', () => {
    for (const code of [
      emit({ action: 'configure', patch: { env: {} } }),
      emit({ action: 'add_light', light: {} }),
      emit({ action: 'add_material', material: {} }),
      emit({ action: 'extrude_path', pathId: 'p1' }),
    ]) {
      expect(code).toContain("r.errors.join('; ')");
      expect(code).not.toMatch(/error: \(r && r\.error\) \|\|/);
    }
  });
});

describe('world3d points', () => {
  it('ground_height takes {x, z}', () => {
    expect(World3DInputSchema.safeParse({ action: 'ground_height', point: { x: 0, z: 0 } }).success).toBe(true);
    expect(emit({ action: 'ground_height', point: { x: 5, z: 7 } })).toContain('groundHeightAt(p.x, p.z !== undefined ? p.z : p.y)');
  });

  it('canvas_to_ground still needs y; ground_height needs y or z', () => {
    expect(World3DInputSchema.safeParse({ action: 'canvas_to_ground', point: { x: 0 } }).success).toBe(false);
    expect(World3DInputSchema.safeParse({ action: 'ground_height', point: { x: 0 } }).success).toBe(false);
  });

  it('create lists configurable keys by path, not by array index', () => {
    const code = emit({ action: 'create', spec: 'forest' });
    expect(code).toContain('d.params.map(function (e) { return e && e.path; })');
  });
});
