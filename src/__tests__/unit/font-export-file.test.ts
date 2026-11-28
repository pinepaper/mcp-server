/**
 * pinepaper_font export / export_data write a file and say where (FACEEXPORT170): both used to answer success with
 * no font bytes and no JSON in the reply.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { handleToolCall } from '../../tools/handlers.js';

const OTF = Buffer.concat([Buffer.from('OTTO', 'latin1'), Buffer.from([0, 1, 2, 3, 250, 251, 252, 253, 254, 255])]);
const DATA = { version: '1.1', fontName: 'Hook Face', metrics: { unitsPerEm: 1000 }, glyphs: { H: { advanceWidth: 447.83 } } };

/** A studio whose fontStudio really runs the generated code, so a dropped return value fails here. */
function controller(fontStudio: Record<string, unknown>) {
  const calls: string[] = [];
  return {
    calls,
    connected: true,
    async executeCode(code: string) {
      calls.push(code);
      try {
        const result = new Function('app', 'btoa', `return ${code}`)({ fontStudio }, (s: string) => Buffer.from(s, 'latin1').toString('base64'));
        return { success: true, result };
      } catch (e) {
        return { success: false, error: String(e) };
      }
    },
  };
}
const studio = () => controller({
  fontName: 'Hook Face',
  glyphs: new Map([['H', {}]]),
  exportAsOTF: () => OTF.buffer.slice(OTF.byteOffset, OTF.byteOffset + OTF.length),
  exportData: () => DATA,
  downloadFont: () => { throw new Error('a headless studio has nowhere to download to'); },
});
const call = (args: Record<string, unknown>, c: ReturnType<typeof controller>) =>
  handleToolCall('pinepaper_font', args, { executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' });
const structured = (r: Awaited<ReturnType<typeof call>>) => r.structuredContent as Record<string, any>;

let dir: string;
const before = process.env.PINEPAPER_EXPORT_DIR;
beforeAll(() => { dir = mkdtempSync(join(tmpdir(), 'pp-font-')); process.env.PINEPAPER_EXPORT_DIR = dir; });
afterAll(() => { if (before === undefined) delete process.env.PINEPAPER_EXPORT_DIR; else process.env.PINEPAPER_EXPORT_DIR = before; rmSync(dir, { recursive: true, force: true }); });

describe('pinepaper_font export', () => {
  it('with no download argument (the reported call) writes the OTF and names the file', async () => {
    const r = await call({ action: 'export' }, studio());
    expect(r.isError).toBeFalsy();
    const s = structured(r);
    expect(s).toMatchObject({ success: true, format: 'otf', fileSize: OTF.length, signature: 'OTTO', glyphs: 1 });
    expect(s.filePath.startsWith(dir)).toBe(true);
    expect(s.filePath).toMatch(/Hook_Face_\d+\.otf$/);
    expect(readFileSync(s.filePath).equals(OTF)).toBe(true);
    expect(s.base64).toBeUndefined();
    expect(r.content.some((c) => c.type === 'resource_link')).toBe(true);
  });

  it('download: false also returns the bytes in the reply', async () => {
    const s = structured(await call({ action: 'export', download: false }, studio()));
    expect(Buffer.from(s.base64, 'base64').equals(OTF)).toBe(true);
    expect(readFileSync(s.filePath).equals(OTF)).toBe(true);
  });

  it('a font with no bytes is an error, and no file is named', async () => {
    const c = controller({ fontName: 'Empty', glyphs: new Map(), exportAsOTF: () => new ArrayBuffer(0) });
    const r = await call({ action: 'export' }, c);
    expect(r.isError).toBe(true);
    expect(JSON.stringify(r.content)).toContain('no bytes');
  });

  it('a studio without Font Studio export says so', async () => {
    const r = await call({ action: 'export' }, controller({}));
    expect(r.isError).toBe(true);
    expect(JSON.stringify(r.content)).toContain('exportAsOTF unavailable');
  });
});

describe('pinepaper_font export_data', () => {
  it('writes the font data as JSON and names the file', async () => {
    const s = structured(await call({ action: 'export_data' }, studio()));
    expect(s).toMatchObject({ success: true, format: 'json', glyphs: 1 });
    expect(JSON.parse(readFileSync(s.filePath, 'utf8'))).toEqual(DATA);
    expect(s.data).toBeUndefined();
  });

  it('download: false also returns the data in the reply', async () => {
    const s = structured(await call({ action: 'export_data', download: false }, studio()));
    expect(s.data).toEqual(DATA);
  });
});
