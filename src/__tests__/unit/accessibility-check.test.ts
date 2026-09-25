/**
 * pinepaper_accessibility_check: WCAG 1.4.3 contrast and 2.3.1 flashing.
 * Reference values are the published ones, not the implementation's.
 */
import { describe, it, expect } from 'bun:test';
import { contrastRatio, parseCssColor, checkContrast, checkFlashes } from '../../utils/a11y.js';
import { codeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

const W = { r: 255, g: 255, b: 255 }, K = { r: 0, g: 0, b: 0 };

describe('contrast', () => {
  it('matches the published ratios', () => {
    expect(contrastRatio(K, W)).toBeCloseTo(21, 5);
    expect(contrastRatio({ r: 0x76, g: 0x76, b: 0x76 }, W)).toBeCloseTo(4.54, 2); // the lightest grey passing AA on white
    expect(contrastRatio({ r: 0x77, g: 0x77, b: 0x77 }, W)).toBeLessThan(4.5);
  });

  it('parses CSS colours', () => {
    expect(parseCssColor('rgb(10, 20, 30)')).toEqual({ r: 10, g: 20, b: 30, a: 1 });
    expect(parseCssColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseCssColor('rgba(0, 0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseCssColor('red')).toBeNull();
  });

  it('large text needs 3:1, body text 4.5:1; the item behind wins over the page', () => {
    const grey = { r: 0x77, g: 0x77, b: 0x77, a: 1 };
    const r = checkContrast([
      { id: 'small', content: 'fine print', fill: grey, fontSize: 14, bold: false, behind: null },
      { id: 'big', content: 'HEADLINE', fill: grey, fontSize: 48, bold: false, behind: null },
      { id: 'onBlack', content: 'white on a black box', fill: { ...W, a: 1 }, fontSize: 14, bold: false, behind: { ...K, a: 1 }, behindId: 'box' },
      { id: 'grad', content: 'gradient', fill: null, fontSize: 14, bold: false, behind: null },
    ], parseCssColor('#ffffff'));
    expect(r.failing.map((f) => f.id)).toEqual(['small']);
    expect(r.failing[0]).toMatchObject({ required: 4.5, large: false, against: 'the page background' });
    expect(r.skipped).toEqual([{ id: 'grad', reason: 'gradient or no fill' }]);
    expect(r.checked).toBe(3);
  });
});

describe('flash', () => {
  const series = (fn: (i: number) => number, n: number) => Array.from({ length: n }, (_, i) => Array.from({ length: 9 }, (_, c) => (c === 4 ? fn(i) : 0.5)));

  it('a full black / white strobe at 10 Hz fails, in the right region', () => {
    const r = checkFlashes(series((i) => (i % 2 ? 1 : 0), 40), 20);
    expect(r.maxFlashesPerSecond).toBeGreaterThan(3);
    expect(r.failing[0].region).toBe(4);
  });

  it('one blink a second passes; a small shimmer does not count', () => {
    expect(checkFlashes(series((i) => (i % 20 < 10 ? 0 : 1), 60), 20).failing).toEqual([]);
    expect(checkFlashes(series((i) => 0.4 + (i % 2) * 0.05, 60), 20).maxFlashesPerSecond).toBe(0);
  });

  it('changes that stay bright (darker state >= 0.8) are not flashes', () => {
    expect(checkFlashes(series((i) => (i % 2 ? 1 : 0.85), 40), 20).maxFlashesPerSecond).toBe(0);
  });
});

describe('the tool', () => {
  it('measures in the page and judges on the server', async () => {
    const controller = {
      connected: true,
      connect: async () => undefined,
      executeCode: async () => ({ success: true, result: { success: true, fps: 20, duration: 2, page: 'rgb(255, 255, 255)',
        texts: [{ id: 't1', content: 'pale', fill: { r: 200, g: 200, b: 200, a: 1 }, fontSize: 16, bold: false, behind: null }],
        series: Array.from({ length: 40 }, (_, i) => Array.from({ length: 9 }, () => (i % 2 ? 1 : 0))) } }),
    };
    const r = await handleToolCall('pinepaper_accessibility_check', {}, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' });
    const text = (r.content ?? []).map((c) => ('text' in c ? c.text : '')).join('');
    const out = JSON.parse(text.slice(text.indexOf('{')));
    expect(out.pass).toBe(false);
    expect(out.contrast.failing[0].id).toBe('t1');
    expect(out.flash.pass).toBe(false);
    expect(out.flash.failing[0].region).toBe('top-left');
  });

  it('the page code runs: grid luminance per frame through captureFramesAt', () => {
    const code = codeGenerator.generateAccessibilityCheck({ checks: ['flash'], duration: 0.2, fps: 10 });
    let frame = 0;
    const ctx = { fillStyle: '', fillRect() {}, clearRect() {}, drawImage() {},
      getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4).fill(frame++ % 2 ? 255 : 0) }) };
    const document = { createElement: () => ({ getContext: () => ctx }) };
    const app = { canvasEl: { style: { backgroundColor: '' } }, captureFramesAt: (times: number[], o: { capture: (c: unknown, t: number, i: number) => unknown }) => times.map((t, i) => o.capture({}, t, i)) };
    const r = new Function('app', 'document', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)(app, document);
    expect(r.series).toHaveLength(3);
    expect(r.series[0]).toHaveLength(9);
    expect(r.series[0][0]).toBe(0);
    expect(r.series[1][8]).toBeCloseTo(1, 5);
  });
});
