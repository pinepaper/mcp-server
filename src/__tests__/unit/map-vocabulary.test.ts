/**
 * Three map tools published a vocabulary the engine does not speak.
 *
 *   apply_colors  colorScale: 'greens'   engine destructures ['#from', '#to']
 *                 minValue/maxValue      engine reads `domain`
 *                 showLegend             engine reads `legend`
 *   highlight     fillColor / color      engine reads style.fill
 *   load          options                stripped by the schema entirely
 *
 * The first is the worst of them: the engine indexed a STRING as an array, so
 * colorScale[0] of 'greens' is 'g' and every region came out near-black while
 * the call reported success.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const argsOf = (code: string, fn: string): unknown[] => {
  const m = new RegExp(`app\\.mapSystem\\.${fn}\\(([\\s\\S]*?)\\);`).exec(code);
  if (!m) throw new Error(`no ${fn} call in:\n${code}`);
  return JSON.parse(`[${m[1]}]`) as unknown[];
};

describe('the map tools speak the engine vocabulary', () => {
  it('turns a colour-scale NAME into the two-stop ramp the engine wants', () => {
    const code = codeGenerator.generateApplyDataColors({
      data: { FR: 1, DE: 9 }, options: { colorScale: 'greens' },
    } as never);
    const [, opts] = argsOf(code, 'applyDataColors') as [unknown, Record<string, unknown>];
    expect(Array.isArray(opts.colorScale)).toBe(true);
    expect((opts.colorScale as string[])[0]).toStartWith('#');
    expect((opts.colorScale as string[]).length).toBe(2);
  });

  it('maps minValue/maxValue to domain and showLegend to legend', () => {
    const code = codeGenerator.generateApplyDataColors({
      data: { FR: 1, DE: 9 }, options: { minValue: 0, maxValue: 10, showLegend: true },
    } as never);
    const [, opts] = argsOf(code, 'applyDataColors') as [unknown, Record<string, unknown>];
    expect(opts.domain).toEqual([0, 10]);
    expect(opts.legend).toBe(true);
    expect(opts).not.toHaveProperty('minValue');
    expect(opts).not.toHaveProperty('showLegend');
  });

  it('fills the domain from the data when only one end is given', () => {
    const code = codeGenerator.generateApplyDataColors({
      data: { FR: 3, DE: 7 }, options: { maxValue: 10 },
    } as never);
    const [, opts] = argsOf(code, 'applyDataColors') as [unknown, Record<string, unknown>];
    expect(opts.domain).toEqual([3, 10]);
  });

  it('highlight sends style.fill, whichever name the caller used', () => {
    for (const key of ['color', 'fillColor', 'fill']) {
      const code = codeGenerator.generateHighlightRegions({
        regionIds: ['FR'], options: { [key]: '#ef4444' },
      } as never);
      const [, style] = argsOf(code, 'highlightRegions') as [unknown, Record<string, unknown>];
      expect(style.fill, `${key} should reach style.fill`).toBe('#ef4444');
      expect(style).not.toHaveProperty('fillColor');
    }
  });

  it('highlight sends style.stroke, not strokeColor', () => {
    const code = codeGenerator.generateHighlightRegions({
      regionIds: ['FR'], options: { strokeColor: '#000', strokeWidth: 3 },
    } as never);
    const [, style] = argsOf(code, 'highlightRegions') as [unknown, Record<string, unknown>];
    expect(style).toMatchObject({ stroke: '#000', strokeWidth: 3 });
    expect(style).not.toHaveProperty('strokeColor');
  });

  it('load carries options through to the engine', () => {
    const code = codeGenerator.generateLoadMap({ mapId: 'world', options: { style: 'dark' } } as never);
    const m = /loadMap\('world',\s*(\{[\s\S]*?\})\)/.exec(code)!;
    expect(JSON.parse(m[1])).toMatchObject({ style: 'dark' });
  });

  it('a named field still wins over the same key inside options', () => {
    const code = codeGenerator.generateLoadMap({
      mapId: 'world', projection: 'mercator', options: { projection: 'naturalEarth' },
    } as never);
    const m = /loadMap\('world',\s*(\{[\s\S]*?\})\)/.exec(code)!;
    expect(JSON.parse(m[1]).projection).toBe('mercator');
  });
});

/**
 * An unknown itemId was a silent success, across a whole family of tools.
 *
 * `app.addAnimation('c0', …)` on an id that does not exist calls console.warn
 * and returns undefined. Production strips console.warn, so nothing is said at
 * all — and the emitter returned success because the call did not throw. A
 * pilot animated a connector id that was never registered and got success for
 * every keyframe, then found nothing moved.
 */
describe('an unknown itemId is refused, not reported as success', () => {
  const code = (): string => codeGenerator.generateKeyframeAnimate({
    itemId: 'c0', keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 1, properties: { opacity: 1 } }],
  } as never);

  it('resolves the id before animating', () => {
    expect(code()).toContain('app.getItemById');
    expect(code()).toContain('app.itemRegistry');
  });

  it('names the id it could not find', () => {
    const c = code();
    expect(c).toContain('is not on the canvas');
    expect(c).toContain('"c0"');
  });

  it('points at how to get a real id', () => {
    // "create returns the registry id, not the Paper id" is the actual trap —
    // app.create returns a numeric Paper id and the registry uses item_N.
    expect(code()).toContain('pinepaper_get_items');
  });

  it('still animates when the item resolves', () => {
    const c = code();
    expect(c).toContain('app.addAnimation');
    expect(c.indexOf('app.getItemById')).toBeLessThan(c.indexOf('app.addAnimation'));
  });

  it('emits valid JavaScript', () => {
    expect(() => new Function(`return (function(app, paper){ ${code()} });`)).not.toThrow();
  });
});
