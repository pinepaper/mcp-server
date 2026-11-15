/**
 * RISO-RESIZE (tester, 1.6.36; owner 2026-11-14: keep the canvas). An unsized compose laid out at the style's own
 * default size (1280x720 for most) and resized the canvas to it. Where the studio is reachable, it now lays out at the
 * current canvas size.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';

function studio(size: { width: number; height: number } | null) {
  const codes: string[] = [];
  return {
    codes,
    controller: {
      connected: true, connect: async () => undefined,
      executeCode: async (code: string) => {
        codes.push(code);
        if (code.includes('app.getCanvasSize')) return { success: true, result: size };
        return { success: true, result: { success: true } };
      },
    },
  };
}
const compose = (s: ReturnType<typeof studio>, args: Record<string, unknown>) =>
  handleToolCall('pinepaper_design_system', { action: 'compose', style: 'bauhaus_geometric', title: 'Hello', ...args },
    { executeInBrowser: true, browserController: s.controller as never, executionMode: 'puppeteer' });

describe('compose keeps your canvas', () => {
  it('no size given: lays out at the current canvas size', async () => {
    const s = studio({ width: 1080, height: 1920 });
    await compose(s, {});
    const drawn = s.codes.find((c) => c.includes('setCanvasSize'))!;
    expect(drawn).toContain('"width":1080,"height":1920');
  });

  it('an explicit size still wins, and nothing reads the canvas', async () => {
    const s = studio({ width: 1080, height: 1920 });
    await compose(s, { width: 800, height: 800 });
    expect(s.codes.some((c) => c.startsWith('(function () { const s = app.getCanvasSize'))).toBe(false);
    expect(s.codes.find((c) => c.includes('setCanvasSize'))).toContain('"width":800,"height":800');
  });

  it('a style with a fixed layout size keeps the canvas and is fitted into it', async () => {
    const s = studio({ width: 1080, height: 1920 });
    await compose(s, { style: 'risograph_print' });
    const drawn = s.codes.find((c) => c.includes('Design: compose'))!;
    expect(drawn).not.toContain('app.setCanvasSize({');
    expect(drawn).toContain('const __fit = {"width":1080,"height":1920}');
    expect(drawn).toContain('fittedToCanvas: __fitReport');
  });

  it('the fit scales and centres every item, and says so', () => {
    const { codeGenerator } = require('../../types/code-generator.js');
    const code = codeGenerator.generateDesignCompose({ width: 1280, height: 720 }, [{ type: 'circle', name: 'c', x: 0, y: 0 }], 'risograph_print', 'w', {}, { width: 1080, height: 1920 });
    const calls: unknown[][] = [];
    const item = { data: { id: 'i1' }, scale: (...a: unknown[]) => calls.push(['scale', ...a]), translate: (...a: unknown[]) => calls.push(['translate', ...a]) };
    const paper = { Point: function (this: any, x: number, y: number) { this.x = x; this.y = y; }, view: { draw() {} } };
    const app = { create: () => item, getItemById: () => item, getCanvasSize: () => ({ width: 1080, height: 1920 }) };
    const body = code.split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n');
    const r = new Function('app', 'paper', `return ${body.trim().replace(/;\s*$/, '')}`)(app, paper);
    expect(r.fittedToCanvas).toMatchObject({ canvas: '1080x1920', layout: '1280x720', scale: 0.844, itemsFitted: 1 });
    expect(r.canvasResized).toBeUndefined();
    expect(r.warning).toBeUndefined();
    expect(calls[0]![1]).toBeCloseTo(0.84375);
    expect((calls[1]![1] as { x: number; y: number }).y).toBeCloseTo((1920 - 720 * 0.84375) / 2);
  });

  it('a canvas that cannot be read falls back to the style size', async () => {
    const s = studio(null);
    await compose(s, {});
    expect(s.codes.find((c) => c.includes('setCanvasSize'))).toBeDefined();
  });
});
