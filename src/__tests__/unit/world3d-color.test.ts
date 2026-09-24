/**
 * A hex colour in the 3D world poisons every later export.
 *
 * addWorldObject hands `color` to a WebGL uniform — the engine's own example is
 * `color: [0.9, 0.3, 0.2]`, three floats in 0..1. Give it '#ef4444' and
 * uniform3fv throws "cannot be converted to a sequence": the object is reported
 * as ADDED, and then every subsequent MP4 export fails, because the broken
 * uniform stays in the scene. Same shape as the tainted canvas — one bad value,
 * success reported, damage surfacing somewhere else entirely.
 *
 * A caller writing '#ef4444' is not wrong; it is the colour spelling every
 * other tool here takes. The emitter absorbs the difference.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const objOf = (code: string): Record<string, unknown> => {
  const m = /addWorldObject\(([\s\S]*?)\);/.exec(code);
  if (!m) throw new Error(`no addWorldObject in:\n${code}`);
  return JSON.parse(m[1]) as Record<string, unknown>;
};

const add = (object: Record<string, unknown>): string =>
  codeGenerator.generateWorld3D({ action: 'add_object', object } as never);

describe('a world3d colour reaches the uniform as floats', () => {
  it('converts a hex string to three 0..1 floats', () => {
    expect(objOf(add({ x: 1, color: '#ef4444' })).color).toEqual([239 / 255, 68 / 255, 68 / 255]);
  });

  it('accepts shorthand hex', () => {
    expect(objOf(add({ color: '#f00' })).color).toEqual([1, 0, 0]);
  });

  it('leaves a correct float triple alone', () => {
    expect(objOf(add({ color: [0.9, 0.3, 0.2] })).color).toEqual([0.9, 0.3, 0.2]);
  });

  it('normalises a 0-255 triple, the other common form', () => {
    expect(objOf(add({ color: [255, 0, 0] })).color).toEqual([1, 0, 0]);
  });

  it('never emits a string where the uniform is read', () => {
    const c = objOf(add({ color: '#123456' })).color;
    expect(typeof c).not.toBe('string');
    expect(Array.isArray(c)).toBe(true);
  });

  it('leaves a value it cannot parse untouched rather than guessing', () => {
    // 'red' is not a hex triple; converting it to a wrong colour silently
    // would be worse than passing it on and letting the engine speak.
    expect(objOf(add({ color: 'red' })).color).toBe('red');
  });

  it('reaches nested colours too', () => {
    const o = objOf(add({ material: { color: '#00ff00' }, x: 2 }));
    expect((o.material as Record<string, unknown>).color).toEqual([0, 1, 0]);
  });

  it('touches nothing else', () => {
    expect(objOf(add({ x: 10, z: -4, height: 6, color: '#fff' }))).toMatchObject({ x: 10, z: -4, height: 6 });
  });
});
