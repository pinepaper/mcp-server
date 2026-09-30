/**
 * pinepaper_capture_frames `sheet` (G3): one tiled image of the film, saved to
 * a file, plus the rubric the agent scores it against. Verified live against
 * pinepaper.studio (sized capture, FxTool #42): a 15 s scene at every: 1 is
 * one 15-tile JPEG of 66 KB, and the tool result is ~1.7k characters.
 */

import { describe, it, expect } from 'bun:test';
import { sheetTimes, SHEET_MAX_TILES, SHEET_RUBRIC, PinePaperCodeGenerator } from '../../types/code-generator.js';
import { CaptureFramesInputSchema, CaptureSheetSchema } from '../../types/schemas.js';

const sheet = (s: Record<string, unknown>) => CaptureSheetSchema.parse(s);

describe('contact sheet times', () => {
  it('every N seconds over the duration', () => {
    expect(sheetTimes(undefined, sheet({ every: 1, duration: 15 })).times).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });

  it('a strip is consecutive frames centred on the moment, clamped at 0', () => {
    expect(sheetTimes(undefined, sheet({ strip: { at: 2, count: 4, step: 0.5 } })).times).toEqual([1, 1.5, 2, 2.5]);
    expect(sheetTimes(undefined, sheet({ strip: { at: 0, count: 4, step: 0.5 } })).times[0]).toBe(0);
  });

  it('the loop seam is the frame before the wrap, then the first', () => {
    const r = sheetTimes(undefined, sheet({ loopSeam: true, duration: 6 }));
    expect(r.times).toEqual([5.967, 0]);
    expect(r.labels).toEqual(['end 5.97s', 'start 0.00s']);
  });

  it('explicit times win, and nothing passes the tile cap', () => {
    expect(sheetTimes([0.5, 1.25], sheet({ every: 1, duration: 10 })).times).toEqual([0.5, 1.25]);
    expect(sheetTimes(undefined, sheet({ every: 0.1, duration: 60 })).times.length).toBe(SHEET_MAX_TILES);
  });
});

describe('contact sheet input', () => {
  it('times are optional with a sheet mode, required without', () => {
    expect(CaptureFramesInputSchema.safeParse({ sheet: { every: 1, duration: 15 } }).success).toBe(true);
    expect(CaptureFramesInputSchema.safeParse({}).success).toBe(false);
    expect(CaptureFramesInputSchema.safeParse({ sheet: { every: 1 } }).success).toBe(false);
  });

  it('defaults to phone-width JPEG tiles', () => {
    const s = sheet({});
    expect(s.tileWidth).toBe(360);
    expect(s.format).toBe('jpeg');
  });
});

describe('contact sheet emitter', () => {
  const code = new PinePaperCodeGenerator().generateCaptureSheet(CaptureFramesInputSchema.parse({ sheet: { every: 1, duration: 4 } }));
  it('asks the engine for sized frames where it can, and scales full frames where it cannot', () => {
    expect(code).toContain("typeof app._frameCapture === 'function'");
    expect(code).toContain('width: tileW');
    expect(code).toContain('captureFrameDataURL');
  });
  it('the rubric carries the criteria and the checklist', () => {
    expect(SHEET_RUBRIC.criteria.length).toBe(7);
    expect(SHEET_RUBRIC.checklist.some((c) => c.includes('loop'))).toBe(true);
  });
});
