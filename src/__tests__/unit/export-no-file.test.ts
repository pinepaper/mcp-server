/**
 * No export reports success without a file, and no error path says "undefined". Every path that says "saved" reads the file back; a
 * failure names its step (export / save / write), the path and the reason. The studio's scene-lint warnings ride on a
 * successful export.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, existsSync, statSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { ExportStepError, verifySavedFile, bytesForSave, errorText, writeStep } from '../../tools/export-file-check.js';
import { handleToolCall, lintLines } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import type { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

const dir = mkdtempSync(join(tmpdir(), 'pp-nofile-'));

describe('verifySavedFile', () => {
  it('passes a file that exists and holds what was written', async () => {
    const f = join(dir, 'ok.bin');
    writeFileSync(f, Buffer.from([1, 2, 3]));
    expect(await verifySavedFile(f, 3)).toEqual({ bytes: 3 });
  });
  it('a missing file is the write step, with the path', async () => {
    const f = join(dir, 'missing.bin');
    const e = await verifySavedFile(f).catch((x) => x);
    expect(e).toBeInstanceOf(ExportStepError);
    expect(e.toData()).toMatchObject({ step: 'write', path: f });
    expect(e.message).toContain('does not exist');
  });
  it('an empty file is not a saved file', async () => {
    const f = join(dir, 'empty.bin');
    writeFileSync(f, Buffer.alloc(0));
    const e = await verifySavedFile(f).catch((x) => x);
    expect(e.step).toBe('write');
    expect(e.reason).toContain('0 bytes');
  });
  it('a short file is named with both sizes', async () => {
    const f = join(dir, 'short.bin');
    writeFileSync(f, Buffer.from([1]));
    const e = await verifySavedFile(f, 10).catch((x) => x);
    expect(e.reason).toBe('the file is 1 bytes on disk, but 10 were written');
  });
});

describe('bytesForSave', () => {
  it('no data is the export step', () => {
    expect(() => bytesForSave(undefined)).toThrow(/export step: the export reported success but returned no file data \(no data field\)/);
    expect(() => bytesForSave('')).toThrow(/an empty string/);
    expect(() => bytesForSave(null)).toThrow(/a null/);
  });
  it('a data URL with no payload is the save step', () => {
    let e: unknown;
    try { bytesForSave('data:video/mp4;base64,', 'the mp4 export'); } catch (x) { e = x; }
    expect(e).toBeInstanceOf(ExportStepError);
    expect((e as ExportStepError).step).toBe('save');
    expect((e as ExportStepError).reason).toContain('video/mp4');
  });
  it('decodes base64 and percent-encoded data URLs, and writes text as UTF-8', () => {
    expect(bytesForSave('data:image/png;base64,AQID')).toEqual(Buffer.from([1, 2, 3]));
    expect(bytesForSave('data:image/svg+xml,%3Csvg%2F%3E').toString()).toBe('<svg/>');
    expect(bytesForSave('<svg/>').toString()).toBe('<svg/>');
  });
});

describe('errorText', () => {
  it('never "undefined"', () => {
    expect(errorText(undefined, 'step x failed')).toBe('step x failed');
    expect(errorText({ message: undefined }, 'f')).toBe('f');
    expect(errorText(new Error(''), 'f')).toBe('f');
    expect(errorText('refused', 'f')).toBe('refused');
    expect(errorText(new Error('disk full'), 'f')).toBe('disk full');
  });
  it('writeStep names the file system refusal at the write step', async () => {
    const e = await writeStep('/x', async () => { throw undefined; }).catch((x) => x);
    expect(e.message).toBe('export failed at the write step (/x): the file system refused the write with no reason given');
  });
});

// ---------------------------------------------------------------------------
// The handler: agent_export and the interchange file writer
// ---------------------------------------------------------------------------

function controllerReturning(result: unknown): PinePaperBrowserController {
  return {
    connected: true,
    connect: async () => undefined,
    executeCode: async () => ({ success: true, result }),
  } as unknown as PinePaperBrowserController;
}
const run = (tool: string, args: Record<string, unknown>, result: unknown) =>
  handleToolCall(tool, args, { executeInBrowser: true, browserController: controllerReturning(result), executionMode: 'puppeteer' });
const textOf = (r: { content?: Array<{ type: string; text?: string }> }) => (r.content?.[0] as { text: string }).text;

describe('pinepaper_agent_export: success means a file', () => {
  const prevDir = process.env.PINEPAPER_EXPORT_DIR;
  beforeAll(() => { process.env.PINEPAPER_EXPORT_DIR = join(dir, 'exports'); });
  afterAll(() => { if (prevDir === undefined) delete process.env.PINEPAPER_EXPORT_DIR; else process.env.PINEPAPER_EXPORT_DIR = prevDir; });

  it('a studio "success" with no data is an error at the export step', async () => {
    const r = await run('pinepaper_agent_export', { platform: 'web', format: 'png' }, { success: true, platform: 'web', format: 'png' });
    expect(r.isError).toBe(true);
    const t = textOf(r);
    expect(t).toContain('export failed at the export step');
    expect(t).toContain('no data field');
    expect(t).toContain('"step": "export"');
    expect(t).not.toContain('undefined');
  });

  it('an mp4 data URL with no payload is an error at the save step, with the path', async () => {
    const r = await run('pinepaper_agent_export', { platform: 'web', format: 'mp4' }, { success: true, format: 'mp4', data: 'data:video/mp4;base64,' });
    expect(r.isError).toBe(true);
    const t = textOf(r);
    expect(t).toContain('export failed at the save step');
    expect(t).toMatch(/"path": ".*pinepaper_web_\d+\.mp4"/);
    expect(t).not.toContain('undefined');
  });

  it('an export directory that cannot be made is an error at the write step, not a success', async () => {
    const blocker = join(dir, 'a-file');
    writeFileSync(blocker, 'x');
    process.env.PINEPAPER_EXPORT_DIR = join(blocker, 'sub');
    try {
      const r = await run('pinepaper_agent_export', { platform: 'web', format: 'png' }, { success: true, format: 'png', data: 'data:image/png;base64,AQID' });
      expect(r.isError).toBe(true);
      expect(textOf(r)).toContain('export failed at the write step');
      expect(textOf(r)).not.toContain('Export saved');
    } finally {
      process.env.PINEPAPER_EXPORT_DIR = join(dir, 'exports');
    }
  });

  it('a saved export names a file that exists and is not empty, and carries the scene lint', async () => {
    const lint = [{ code: 'TEXT_CLIPS_FRAME', itemId: 'item_1', message: 'Text "SIGNAL" (item_1) is centre-anchored and runs 90 px past the left edge' }];
    const r = await run('pinepaper_agent_export', { platform: 'web', format: 'png' }, { success: true, format: 'png', data: 'data:image/png;base64,AQIDBA==', lintWarnings: lint });
    expect(r.isError).toBeFalsy();
    const t = textOf(r);
    const file = /File: (\S+)/.exec(t)?.[1] as string;
    expect(existsSync(file)).toBe(true);
    expect(statSync(file).size).toBe(4);
    expect(t).toContain('LINT: Text "SIGNAL" (item_1) is centre-anchored');
    expect(t).toContain('"lintWarnings"');
  });

  it('an estimate is the one success that is not a file', async () => {
    const r = await run('pinepaper_agent_export', { platform: 'web', format: 'mp4', estimateOnly: true }, { success: true, estimateOnly: true, format: 'mp4', estimate: { bytes: 1 } });
    expect(r.isError).toBeFalsy();
  });
});

describe('pinepaper_interchange file exports', () => {
  it('a success with no data is an error at the export step', async () => {
    const r = await run('pinepaper_interchange', { action: 'export_glb' }, { success: true, format: 'glb' });
    expect(r.isError).toBe(true);
    expect(textOf(r)).toContain('export failed at the export step: the glb export reported success but returned no file data');
  });
  it('a result that says in fields it wrote no file (file: null, why) passes as it is', async () => {
    const r = await run('pinepaper_interchange', { action: 'export_png_sequence' }, { success: true, format: 'png-sequence', frames: 3, file: null, why: 'the frames stayed in the page' });
    expect(r.isError).toBeFalsy();
    expect(textOf(r)).toContain('"file": null');
    expect(textOf(r)).not.toContain('filePath');
  });
  it('a note alone no longer passes for "no file": it must say file: null and why', async () => {
    const r = await run('pinepaper_interchange', { action: 'export_png_sequence' }, { success: true, format: 'png-sequence', frames: 3, note: 'the frames stayed in the page' });
    expect(r.isError).toBe(true);
  });
  it('the emitted png-sequence code says file: null and why on both no-file branches', () => {
    const code = codeGenerator.generateInterchange({ action: 'export_png_sequence' } as never);
    expect(code.match(/file: null,/g)?.length).toBe(2);
    expect(code.match(/why: '/g)?.length).toBe(2);
  });
});

describe('the emitted export code', () => {
  it('agent_export runs the scene lint before the export and puts it on the result', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'web', format: 'png' });
    expect(code).toContain("typeof app.lintScene !== 'function'");
    expect(code).toContain('result.lintWarnings = __lint');
    expect(code.indexOf('const __lint')).toBeLessThan(code.indexOf('result.lintWarnings'));
  });
  it('an export that threw with no message names the format, not "undefined"', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'web', format: 'mp4' });
    expect(code).not.toContain('error: e.message,');
    expect(code).toContain("export threw with no message");
  });
  it('export_svg refuses an empty SVG at the export step', () => {
    const code = codeGenerator.generateExportSVG();
    expect(code).toContain("step: 'export'");
    expect(code).toContain('exportAnimatedSVG returned');
  });
});

describe('lintLines', () => {
  it('is empty without warnings and one line per warning with them', () => {
    expect(lintLines({})).toBe('');
    expect(lintLines(null)).toBe('');
    expect(lintLines({ lintWarnings: [{ message: 'a' }, { code: 'B' }] })).toBe('LINT: a\nLINT: B\n');
  });
});

afterAll(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* temp */ } });
