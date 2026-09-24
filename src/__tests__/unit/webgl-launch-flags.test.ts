/**
 * `--disable-gpu` turned off WebGL, and with it a whole class of features.
 *
 * It was carried into agent mode as a headless convention, under a comment
 * calling it an "optimization flag", and the cost was never measured. Measured
 * now, on the same machine, same puppeteer, only the flags differing:
 *
 *   --disable-gpu              webgl1 false, webgl2 false, renderer null
 *   --enable-unsafe-swiftshader webgl1 true,  webgl2 true,
 *                               ANGLE Metal Renderer: Apple M3 Pro
 *
 * So world3d, drawShaderArt, drawFormulaArt and every shader aura
 * (liquid_metal, caustics, heatmap, gem_smoke, electric_arc, vortex) were dead
 * through this controller — and liquid_metal and drawFormulaArt answered
 * success:true while rendering nothing. One flag turned a feature class into
 * silent no-ops.
 *
 * `--enable-unsafe-swiftshader` covers the machines with no GPU: Chrome
 * stopped falling back to software GL silently, so without it a headless
 * server or container gets no WebGL at all rather than a slow one. "Unsafe"
 * means software rasterisation, not a security relaxation.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = readFileSync(join(import.meta.dir, '..', '..', 'browser', 'puppeteer-controller.ts'), 'utf8');

/** Flag strings actually passed, with comments stripped — prose is not a flag. */
const flags = (): string[] => {
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  return [...code.matchAll(/'(--[a-z0-9-]+(?:=[^']*)?)'/g)].map((m) => m[1]);
};

describe('the browser is launched with WebGL available', () => {
  it('reads real launch flags', () => {
    // Liveness: a regex that matched nothing would pass every check below.
    expect(flags()).toContain('--no-sandbox');
    expect(flags().length).toBeGreaterThan(3);
  });

  it('never passes --disable-gpu', () => {
    expect(flags(), '--disable-gpu makes webgl1 and webgl2 both false').not.toContain('--disable-gpu');
  });

  it('enables software GL so a machine without a GPU still has WebGL', () => {
    expect(flags()).toContain('--enable-unsafe-swiftshader');
  });

  it('still gates the certificate relaxation on a configured proxy', () => {
    // Unrelated to GL, and the distinction is the point: swiftshader is a
    // rendering fallback, --ignore-certificate-errors is a security downgrade
    // and stays behind an explicit operator flag.
    // Against the CODE, not the prose: the comment above explains the
    // distinction and names the flag, so a plain indexOf finds the sentence
    // rather than the push. Third time that has caught me today.
    const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
    const gate = code.indexOf('if (this.config.proxy)');
    expect(gate).toBeGreaterThan(-1);
    expect(code.indexOf('--ignore-certificate-errors')).toBeGreaterThan(gate);
  });
});
