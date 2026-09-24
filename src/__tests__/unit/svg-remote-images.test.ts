/**
 * A remote <image> inside an imported SVG taints the canvas, permanently.
 *
 * paper.importSVG draws a cross-origin raster straight onto the canvas, which
 * sets the origin-dirty flag. Every export AFTERWARDS throws "Tainted canvases
 * may not be exported" — not only the one holding the image — and nothing
 * clears it but a page reload. So one import poisons the whole session, and it
 * surfaces somewhere else entirely, long after the call that did it returned.
 *
 * Reported from production: import_svg with a picsum href answered
 * success/itemsCreated:0 and then killed every later export.
 *
 * Each remote href is therefore fetched and inlined as a data: URL before the
 * SVG reaches the importer. One that cannot be fetched has its ELEMENT REMOVED:
 * a missing picture is visible, local and recoverable; a tainted canvas is none
 * of those.
 */
import { describe, it, expect, beforeEach } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** Lift the emitted helper out of the generated code and run it for real. */
interface ImageNote { url: string; action: string; reason: string; message: string }

function inliner(code: string): (svg: string) => Promise<{ svg: string; notes: ImageNote[] }> {
  const start = code.indexOf('async function inlineRemoteImages');
  expect(start, 'emitted code no longer carries the inliner').toBeGreaterThan(-1);
  const end = code.indexOf('\n  }\n', start) + 4;
  const src = code.slice(start, end).replace('async function inlineRemoteImages', 'async function');
  return new Function(`return (${src})`)() as (svg: string) => Promise<{ svg: string; notes: ImageNote[] }>;
}

const SVG = '<svg xmlns="http://www.w3.org/2000/svg">'
  + '<image href="https://cdn.example/photo.jpg" x="0" y="0"/>'
  + '<image xlink:href="https://broken.example/x.png"/>'
  + '<rect width="10" height="10"/></svg>';

describe('an imported SVG cannot taint the canvas', () => {
  beforeEach(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    g.FileReader = class {
      result = 'data:image/png;base64,AAAA';
      onload: (() => void) | null = null;
      onerror: unknown;
      readAsDataURL(): void { setTimeout(() => this.onload?.(), 0); }
    };
    g.fetch = async (u: string) => (u.includes('broken') ? { ok: false } : { ok: true, blob: async () => ({}) });
  });

  it('inlines a fetchable image as a data URL', async () => {
    const out = await inliner(codeGenerator.generateImportSVG(SVG, undefined, { x: 0, y: 0 }, 1))(SVG);
    expect(out.svg).toContain('data:image/png;base64,AAAA');
    expect(out.svg).not.toContain('cdn.example');
  });

  it('REMOVES an image it cannot fetch, rather than letting it taint', async () => {
    const out = await inliner(codeGenerator.generateImportSVG(SVG, undefined, { x: 0, y: 0 }, 1))(SVG);
    expect(out.svg).not.toContain('broken.example');
    expect(out.notes).toHaveLength(1);
    // Structured, because fxtool-f2 is mirroring this shape for the console
    // and UI import routes — one vocabulary, not two.
    expect(out.notes[0]).toMatchObject({
      url: 'https://broken.example/x.png',
      action: 'removed',
      reason: 'unfetchable',
    });
    expect(out.notes[0].message).toContain('taints the canvas');
  });

  it('leaves the rest of the document alone', async () => {
    const out = await inliner(codeGenerator.generateImportSVG(SVG, undefined, { x: 0, y: 0 }, 1))(SVG);
    expect(out.svg).toContain('<rect width="10" height="10"/>');
    expect(out.svg).toContain('<svg');
  });

  it('says nothing and changes nothing when there is no remote image', async () => {
    const plain = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5"/></svg>';
    const out = await inliner(codeGenerator.generateImportSVG(plain, undefined, { x: 0, y: 0 }, 1))(plain);
    expect(out.svg).toBe(plain);
    expect(out.notes).toEqual([]);
  });

  it('runs on both routes into the importer', () => {
    // By URL and by string — the string branch is now an async IIFE for it.
    expect(codeGenerator.generateImportSVG(SVG, undefined, { x: 0, y: 0 }, 1)).toContain('inlineRemoteImages');
    expect(codeGenerator.generateImportSVG(undefined, 'https://e.example/a.svg', { x: 0, y: 0 }, 1))
      .toContain('inlineRemoteImages');
  });

  it('surfaces removals to the caller instead of swallowing them', () => {
    expect(codeGenerator.generateImportSVG(SVG, undefined, { x: 0, y: 0 }, 1)).toContain('imageWarnings');
  });
});
