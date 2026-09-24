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

  it('camera framing asks for the artboard, not the backing store', () => {
    const code = png({ format: 'mp4', framing: 'camera' });
    expect(code).toContain('cameraDims = { width: camBase.width');
    expect(code).not.toContain('canvasEl ? canvasEl.width');
  });

  it('camera framing does not second-guess the zoom', () => {
    // VideoExporter._frameCropRect returns the WHOLE canvas whenever a camera
    // animation exists, so dividing by the first keyframe's zoom never
    // reframed anything — it only shrank the output, making a zoom-2 export a
    // half-size video of identical content. The frame is now exactly the one
    // the engine's _exportFrameSize() computes, so the two cannot disagree.
    const code = png({ format: 'mp4', framing: 'camera' });
    expect(code).not.toContain('firstZoom');
  });

  it('camera framing falls back to a known frame, never to the element', () => {
    const code = png({ format: 'mp4', framing: 'camera' });
    const block = code.slice(code.indexOf("framing === 'camera'"), code.indexOf('let result ='));
    expect(block).toContain('app.getCanvasSize');
    expect(block).toContain('dimensions.width');
    expect(block).not.toContain('document.querySelector');
  });
});

/**
 * An exporter answers a Blob OR a record around one.
 *
 * exportPDF resolves to {blob, width, height, format}, and this passed the
 * whole record to FileReader.readAsDataURL — "parameter 1 is not of type
 * 'Blob'", on every PDF export, with an error naming FileReader and nothing
 * about PDFs. The engine carries the same normaliser for the same reason
 * (AgentMode._asBlob), so this matches its behaviour rather than inventing a
 * second convention.
 */
describe('an export result is normalised before it is read', () => {
  const pdf = (): string => codeGenerator.generateAgentExport({ format: 'pdf', platform: 'auto' } as never);

  /** Run the emitted normaliser for real. */
  const normaliser = (code: string): ((r: unknown) => unknown) => {
    const start = code.indexOf('const asBlob = (r) =>');
    const end = code.indexOf('};', code.indexOf('return null;', start)) + 2;
    const src = code.slice(start, end).replace('const asBlob = ', '').replace(/;\s*$/, '');
    return new Function(`return (${src})`)() as (r: unknown) => unknown;
  };

  class FakeBlob { size = 42; type = 'application/pdf'; slice(): FakeBlob { return this; } }

  it('accepts both shapes the engine can answer with', () => {
    (globalThis as never as Record<string, unknown>).Blob = FakeBlob;
    const asBlob = normaliser(pdf());
    const b = new FakeBlob();
    expect(asBlob(b)).toBe(b);
    expect(asBlob({ blob: b, width: 595, height: 842, format: 'a4' })).toBe(b);
  });

  it('falls back to duck typing, for a Blob from another realm', () => {
    (globalThis as never as Record<string, unknown>).Blob = FakeBlob;
    const asBlob = normaliser(pdf());
    expect(asBlob({ size: 9, slice: () => null })).not.toBeNull();
  });

  it('returns null rather than guessing at something that is not a file', () => {
    (globalThis as never as Record<string, unknown>).Blob = FakeBlob;
    const asBlob = normaliser(pdf());
    expect(asBlob({ nope: 1 })).toBeNull();
    expect(asBlob(null)).toBeNull();
  });

  it('names the PDF and what came back, not FileReader', () => {
    // The old failure said "parameter 1 is not of type 'Blob'" — true, and it
    // names nothing a caller can act on.
    const code = pdf();
    expect(code).toContain('the PDF export did not produce a file');
    expect(code).toContain('an object with keys [');
  });

  it('carries the page geometry the record holds', () => {
    // width/height/format are only knowable from the record; dropping it lost
    // the one place a caller could learn the page size the engine chose.
    const code = pdf();
    expect(code).toContain('pdfOut.width');
    expect(code).toContain('paperFormat');
  });
});
