/**
 * Three tools reported a pixel count that came from the RENDERING SCALE rather
 * than from what the caller asked for.
 *
 *   analysis.canvasSize   2233x1472 for a 1920x1080 board (backing store)
 *   framing: 'camera'     2234x1472 for every board (backing store / zoom)
 *   format: 'png'         3000x1688 for every platform (board x dpi/96)
 *
 * All three read a number the browser chose. None of the ratios is the device
 * pixel ratio, so a caller cannot divide any of them back out — which is what
 * separates this from an ordinary off-by-a-preset and why it forced ffmpeg and
 * sips workarounds downstream.
 *
 * The rule these now share: the artboard is what the caller set, and it is
 * read through getCanvasSize() with app.canvasSize behind it. A resolved
 * export target is the last resort — wrong by a known frame at worst. The
 * canvas ELEMENT is never in the path.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const png = (input: Record<string, unknown>): string =>
  codeGenerator.generateAgentExport(input as never);

describe('an export is sized by the request, not by the renderer', () => {
  it('png scales the board to the resolved target instead of passing dpi', () => {
    const code = png({ format: 'png', platform: 'youtube-thumbnail' });
    expect(code).toContain('dimensions.width / pngBoard.width');
    expect(code).toContain('exportPNG({ scale: pngScale })');
    // dpi WAS the whole bug: it scaled the board and ignored the platform.
    expect(code).not.toContain('exportPNG({ dpi:');
  });

  it('png reads the artboard, never the canvas element', () => {
    const code = png({ format: 'png', platform: 'auto' });
    const branch = code.slice(code.indexOf("case 'png'"), code.indexOf("case 'gif'"));
    expect(branch).toContain('app.getCanvasSize');
    expect(branch).toContain('app.canvasSize');
    expect(branch).not.toContain('canvasEl.width');
  });

  it('png reports the dimensions it actually produced', () => {
    // The caller could not tell before: data.width said 3000 and nothing
    // explained why the platform had been ignored.
    expect(png({ format: 'png', platform: 'instagram' })).toContain('dimensions:');
  });

  it('camera framing divides the artboard, not the backing store', () => {
    const code = png({ format: 'mp4', framing: 'camera' });
    expect(code).toContain('camBase.width / firstZoom');
    expect(code).not.toContain('canvasEl ? canvasEl.width');
  });

  it('camera framing falls back to a known frame, never to the element', () => {
    const code = png({ format: 'mp4', framing: 'camera' });
    const block = code.slice(code.indexOf("framing === 'camera'"), code.indexOf('let result ='));
    expect(block).toContain('app.getCanvasSize');
    expect(block).toContain('dimensions.width');
    expect(block).not.toContain('document.querySelector');
  });
});
