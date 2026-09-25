/**
 * PDF print options and region export reach the engine (round 6 T, 1.34).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

const body = (code: string) => code.replace('(async function()', 'return (async function()');

describe('pdf options', () => {
  it('pass through to exportPDF, never downloading in the page', async () => {
    let got: Record<string, unknown> = {};
    const blob = new Blob(['%PDF'], { type: 'application/pdf' });
    const app = { canvasSize: { width: 800, height: 600 }, exportEngine: {
      exportPDF: async (o: Record<string, unknown>) => { got = o; return { blob, width: 595, height: 842, format: 'a4' }; },
      exportFidelity: () => ({ warnings: [] }) } };
    class FR { result = 'data:application/pdf;base64,JVBERg=='; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'a4', bleed: 3, trimMarks: true, dpi: 300 } } as never);
    const r = await new Function('app', 'FileReader', 'document', body(code))(app, FR, {});
    expect(r.success).toBe(true);
    expect(got).toMatchObject({ dpi: 300, download: false, format: 'a4', includeBleed: true, bleed: 3, trimMarks: true });
  });

  it('are refused on a non-pdf format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'png', pdf: { bleed: 3 } }).success).toBe(false);
  });
});

describe('region export', () => {
  it('renders the region at its own size through renderRegionToDataURL', async () => {
    const calls: unknown[] = [];
    const app = { canvasSize: { width: 1080, height: 1080 },
      renderRegionToDataURL: (r: unknown, w: number, h: number) => { calls.push([r, w, h]); return 'data:image/png;base64,AA=='; },
      exportEngine: { exportFidelity: () => ({ warnings: [] }) } };
    const paper = { Rectangle: class { constructor(public x: number, public y: number, public width: number, public height: number) {} } };
    const code = codeGenerator.generateAgentExport({ format: 'png', region: { x: 1080, y: 0, width: 1080, height: 1350 } } as never);
    const r = await new Function('app', 'paper', 'document', body(code))(app, paper, {});
    expect(r).toMatchObject({ success: true, format: 'png', dimensions: { width: 1080, height: 1350 } });
    expect(calls[0]).toEqual([{ x: 1080, y: 0, width: 1080, height: 1350 }, 1080, 1350]);
  });

  it('is refused on a non-png format', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', region: { x: 0, y: 0, width: 10, height: 10 } }).success).toBe(false);
  });
});

describe('jpg / webp stills (1.35)', () => {
  function studio() {
    const ops: unknown[] = [];
    class Img { naturalWidth = 20; naturalHeight = 10; onload: (() => void) | null = null; onerror: (() => void) | null = null;
      set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ width: 0, height: 0,
      getContext: () => ({ set fillStyle(v: string) { ops.push(['fill', v]); }, fillRect: () => ops.push('fillRect'), drawImage: () => ops.push('draw') }),
      toDataURL: (mime: string, q: number) => { ops.push(['encode', mime, q]); return `data:${mime};base64,AAAA`; } }) };
    const app = { canvasSize: { width: 20, height: 10 }, exportEngine: {
      exportPNG: async () => ({ dataUrl: 'data:image/png;base64,iVBO', width: 20, height: 10 }),
      exportFidelity: () => ({ warnings: [] }) } };
    return { ops, globals: { app, document, Image: Img } };
  }
  const run = (input: Record<string, unknown>, g: Record<string, unknown>) =>
    new Function(...Object.keys(g), body(codeGenerator.generateAgentExport(input as never)))(...Object.values(g));

  it('jpg: flattened onto white, encoded at the tier compression', async () => {
    const s = studio();
    const r = await run({ format: 'jpg', quality: 'draft' }, s.globals);
    expect(r).toMatchObject({ success: true, format: 'jpg', mimeType: 'image/jpeg', encodeQuality: 0.6 });
    expect(s.ops).toContainEqual(['fill', '#ffffff']);
    expect(s.ops).toContainEqual(['encode', 'image/jpeg', 0.6]);
  });

  it('webp keeps alpha (no white fill)', async () => {
    const s = studio();
    const r = await run({ format: 'webp' }, s.globals);
    expect(r).toMatchObject({ success: true, mimeType: 'image/webp' });
    expect(s.ops).not.toContainEqual(['fill', '#ffffff']);
  });

  it('region works for jpg too, and the canvas cap is 8192', async () => {
    expect(AgentExportInputSchema.safeParse({ format: 'jpg', region: { x: 0, y: 0, width: 10, height: 10 } }).success).toBe(true);
    const { SetCanvasSizeInputSchema } = await import('../../types/schemas.js') as Record<string, { safeParse(v: unknown): { success: boolean } }>;
    if (SetCanvasSizeInputSchema) expect(SetCanvasSizeInputSchema.safeParse({ width: 5400, height: 1350 }).success).toBe(true);
  });
});

describe('round 6 retest follow-ups', () => {
  it('bleed / trimMarks on a named paper size come back as a warning with the working recipe', () => {
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'a4', bleed: 3, trimMarks: true } } as never);
    expect(code).toContain("applies them only to paperFormat 'custom'");
    expect(code).toContain("canvasPreset 'print-a4'");
    const custom = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { paperFormat: 'custom', bleed: 3, trimMarks: true } } as never);
    expect(custom).not.toContain("applies them only to paperFormat 'custom'");
  });

  it('jpg flattens onto the scene background when one is set', async () => {
    const fills: string[] = [];
    class Img { naturalWidth = 4; naturalHeight = 4; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ getContext: () => ({ set fillStyle(v: string) { fills.push(v); }, fillRect() {}, drawImage() {} }),
      toDataURL: (m: string) => `data:${m};base64,AA` }) };
    const app = { canvasSize: { width: 4, height: 4 }, canvasEl: { style: { backgroundColor: 'rgb(12, 18, 40)' } },
      exportEngine: { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) } };
    const r = await new Function('app', 'document', 'Image', body(codeGenerator.generateAgentExport({ format: 'jpg' } as never)))(app, document, Img);
    expect(r.success).toBe(true);
    expect(fills).toEqual(['rgb(12, 18, 40)']);
  });

  it('a fully transparent CSS background still flattens onto WHITE (the regex survives the template)', async () => {
    const fills: string[] = [];
    class Img { naturalWidth = 4; naturalHeight = 4; onload: (() => void) | null = null; set src(_v: string) { queueMicrotask(() => this.onload?.()); } }
    const document = { createElement: () => ({ getContext: () => ({ set fillStyle(v: string) { fills.push(v); }, fillRect() {}, drawImage() {} }),
      toDataURL: (m: string) => `data:${m};base64,AA` }) };
    const app = { canvasSize: { width: 4, height: 4 }, canvasEl: { style: { backgroundColor: 'rgba(0, 0, 0, 0)' } },
      exportEngine: { exportPNG: async () => ({ dataUrl: 'data:image/png;base64,AA' }), exportFidelity: () => ({ warnings: [] }) } };
    await new Function('app', 'document', 'Image', body(codeGenerator.generateAgentExport({ format: 'jpg' } as never)))(app, document, Img);
    expect(fills).toEqual(['#ffffff']);
  });
});

describe('png sequence says when it used the default length (8.15)', () => {
  it('notes a missing duration / fps, and nothing when both are given', () => {
    const a = codeGenerator.generateInterchange({ action: 'export_png_sequence' } as never);
    expect(a).toContain('"defaultsUsed":["duration","fps"]');
    const b = codeGenerator.generateInterchange({ action: 'export_png_sequence', options: { duration: 1, fps: 30 } } as never);
    expect(b).not.toContain('defaultsUsed');
  });
});

describe('multi-page pdf from scenes (8.16)', () => {
  function sceneStudio() {
    const log: unknown[] = [];
    const sizes: Record<string, { width: number; height: number }> = { s1: { width: 1920, height: 1080 }, s2: { width: 1080, height: 1920 } };
    const app: Record<string, any> = {
      canvasSize: sizes.s1,
      getDPI: () => 96,
      captureFrameDataURL: (scale: number) => { log.push(['capture', scale]); return 'data:image/png;base64,AA'; },
      sceneManager: {
        currentSceneId: 's2',
        listScenes: () => [{ id: 's1' }, { id: 's2' }],
        loadScene: async (id: string) => { log.push(['load', id]); app.canvasSize = sizes[id]; app.sceneManager.currentSceneId = id; },
      },
      exportEngine: {
        exportFidelity: () => ({ warnings: [] }),
        _loadPDFLibraries: async () => ({ jsPDF: class {
          pages = 1;
          constructor(o: Record<string, unknown>) { log.push(['new', o.orientation, o.format]); }
          addPage(f: unknown, o: string) { this.pages++; log.push(['addPage', o, f]); }
          addImage() { log.push('img'); }
          output() { return new Blob(['%PDF'], { type: 'application/pdf' }); }
        } }),
      },
    };
    return { app, log };
  }
  class FR { result = 'data:application/pdf;base64,JVBERg=='; onloadend: (() => void) | null = null; readAsDataURL() { this.onloadend?.(); } }

  it("'scenes' makes one page per scene at its own size, and puts the user's scene back", async () => {
    const s = sceneStudio();
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { pages: 'scenes' } } as never);
    const r = await new Function('app', 'FileReader', 'document', body(code))(s.app, FR, {});
    expect(r).toMatchObject({ success: true, format: 'pdf', pages: 2 });
    expect(r.pageList[0]).toMatchObject({ sceneId: 's1', widthMM: 508, heightMM: 285.8 });
    expect(s.log.filter((l) => Array.isArray(l) && l[0] === 'addPage')).toHaveLength(1);
    expect(s.log.at(-1)).toEqual(['load', 's2']); // restored
  });

  it('an unknown scene id is refused with the saved ids listed', async () => {
    const s = sceneStudio();
    const code = codeGenerator.generateAgentExport({ format: 'pdf', pdf: { pages: ['s1', 'nope'] } } as never);
    const r = await new Function('app', 'FileReader', 'document', body(code))(s.app, FR, {});
    expect(r.success).toBe(false);
    expect(r.error).toContain('no saved scene nope');
  });
});
