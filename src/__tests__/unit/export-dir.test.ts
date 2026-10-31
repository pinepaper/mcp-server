/**
 * Exports land where a Desktop user can find them, come back as resource_links,
 * and resources/read serves them from the export folder only (utils/export-dir.ts).
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { mkdtempSync, writeFileSync, symlinkSync, mkdirSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getExportDir, exportFileLink, readExportFile, EXPORT_READ_MAX_BYTES } from '../../utils/export-dir.js';
import { allowedAssetRoots } from '../../utils/asset-paths.js';

let saved: string | undefined;
let dir: string;
beforeEach(() => {
  saved = process.env.PINEPAPER_EXPORT_DIR;
  dir = mkdtempSync(join(tmpdir(), 'pp-export-dir-'));
  process.env.PINEPAPER_EXPORT_DIR = dir;
});
afterEach(() => { if (saved === undefined) delete process.env.PINEPAPER_EXPORT_DIR; else process.env.PINEPAPER_EXPORT_DIR = saved; });

describe('the export folder', () => {
  it('PINEPAPER_EXPORT_DIR wins', () => {
    expect(getExportDir()).toBe(dir);
  });

  it('defaults to ~/Downloads/PinePaper, or the temp folder without a Downloads folder', () => {
    delete process.env.PINEPAPER_EXPORT_DIR;
    const d = getExportDir();
    expect([join(homedir(), 'Downloads', 'PinePaper'), join(tmpdir(), 'pinepaper-exports')]).toContain(d);
  });

  it('is the folder path confinement allows, from the same function', async () => {
    const roots = await allowedAssetRoots();
    const { realpathSync } = await import('node:fs');
    expect(roots).toContain(realpathSync(dir));
  });
});

describe('exportFileLink', () => {
  it('is a resource_link with a file URL, the name, the type and the size', () => {
    const p = join(dir, 'my film.mp4');
    expect(exportFileLink(p, 1234)).toEqual({ type: 'resource_link', uri: pathToFileURL(p).href, name: 'my film.mp4', mimeType: 'video/mp4', size: 1234 });
    expect(exportFileLink(p, 1).uri).toContain('my%20film.mp4');
  });
});

describe('readExportFile', () => {
  it('serves a file in the export folder: text formats as text, the rest as base64', async () => {
    writeFileSync(join(dir, 'a.svg'), '<svg/>');
    writeFileSync(join(dir, 'b.png'), Buffer.from([1, 2, 3]));
    const svg = await readExportFile(pathToFileURL(join(dir, 'a.svg')).href);
    const png = await readExportFile(pathToFileURL(join(dir, 'b.png')).href);
    expect(svg).toEqual({ ok: true, contents: { uri: pathToFileURL(join(dir, 'a.svg')).href, mimeType: 'image/svg+xml', text: '<svg/>' } });
    expect(png.ok && png.contents.blob).toBe(Buffer.from([1, 2, 3]).toString('base64'));
  });

  it('refuses a file outside the export folder, including through a symlink', async () => {
    const outside = mkdtempSync(join(tmpdir(), 'pp-outside-'));
    writeFileSync(join(outside, 'secret.txt'), 'x');
    expect((await readExportFile(pathToFileURL(join(outside, 'secret.txt')).href)).ok).toBe(false);
    mkdirSync(join(dir, 'sub'));
    symlinkSync(join(outside, 'secret.txt'), join(dir, 'sub', 'link.txt'));
    const viaLink = await readExportFile(pathToFileURL(join(dir, 'sub', 'link.txt')).href);
    expect(viaLink.ok).toBe(false);
    expect(!viaLink.ok && viaLink.reason).toContain('only files in the export folder');
  });

  it('names a file too big to send instead of sending it', async () => {
    writeFileSync(join(dir, 'big.mp4'), Buffer.alloc(EXPORT_READ_MAX_BYTES + 1));
    const r = await readExportFile(pathToFileURL(join(dir, 'big.mp4')).href);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toContain('open it at');
  });

  it('a missing file or a non-file URL is refused with the reason', async () => {
    expect(await readExportFile(pathToFileURL(join(dir, 'nope.mp4')).href)).toMatchObject({ ok: false, reason: 'no such file' });
    expect(await readExportFile('https://example.com/x')).toMatchObject({ ok: false, reason: 'not a file URL' });
  });
});
