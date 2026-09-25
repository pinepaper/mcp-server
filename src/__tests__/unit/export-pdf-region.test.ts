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
