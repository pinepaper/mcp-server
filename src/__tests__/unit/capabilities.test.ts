/**
 * Running caller-written JavaScript and reading local files are OFF unless the server is started with
 * PINEPAPER_ALLOW_CODE=1 / PINEPAPER_ALLOW_LOCAL_FILES=1 (utils/capabilities.ts). The rest of the suite runs with
 * both on (helpers/test-env.ts); this file turns them off and checks that each door refuses, names its switch and
 * runs nothing, and that the export folder (the server's own results) stays readable.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleToolCall, getExportDir } from '../../tools/handlers.js';
import { setCapability, capabilityAllowed } from '../../utils/capabilities.js';
import { setFfmpegRunner, verifyWithFfprobe } from '../../tools/export-file-receipt.js';
import { run as ffmpegAddonRun } from '../../../packages/mcp-ffmpeg/index.js';

function controller() {
  const codes: string[] = [];
  return { codes, connected: true, connect: async () => undefined,
    executeCode: async (code: string) => { codes.push(code); return { success: true, result: { success: true } }; } };
}
const text = (r: { content?: Array<{ text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('');
const opts = (c: ReturnType<typeof controller>) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as never });

describe('capabilities are off by default', () => {
  beforeAll(() => { setCapability('code', undefined); setCapability('localFiles', undefined); });
  afterAll(() => { setCapability('code', true); setCapability('localFiles', true); });

  it('reads the switches from the environment, off when unset', () => {
    const before = process.env.PINEPAPER_ALLOW_CODE;
    delete process.env.PINEPAPER_ALLOW_CODE;
    expect(capabilityAllowed('code')).toBe(false);
    process.env.PINEPAPER_ALLOW_CODE = '1';
    expect(capabilityAllowed('code')).toBe(true);
    process.env.PINEPAPER_ALLOW_CODE = 'no';
    expect(capabilityAllowed('code')).toBe(false);
    if (before === undefined) delete process.env.PINEPAPER_ALLOW_CODE; else process.env.PINEPAPER_ALLOW_CODE = before;
  });

  const CODE_CALLS: Array<[string, Record<string, unknown>]> = [
    ['pinepaper_execute_custom_code', { code: 'return 1;' }],
    ['pinepaper_p5_draw', { code: 'circle(10, 10, 5);' }],
    ['pinepaper_render_hook', { action: 'register', id: 'h', source: '(ctx) => {}' }],
    ['pinepaper_register_custom_relation', { name: 'bob', computeFunction: 'return {};', applyFunction: '' }],
  ];
  for (const [tool, args] of CODE_CALLS) {
    it(`${tool} is refused, names PINEPAPER_ALLOW_CODE, and runs nothing`, async () => {
      const c = controller();
      const r = await handleToolCall(tool, args, opts(c)) as { isError?: boolean };
      expect(r.isError).toBe(true);
      expect(text(r as never)).toContain('PINEPAPER_ALLOW_CODE=1');
      expect(c.codes).toEqual([]);
    });
  }

  it('code the server wrote itself (place fitting a downloaded asset) still runs', async () => {
    const c = controller();
    const r = await handleToolCall('pinepaper_execute_custom_code', { code: 'return 1;' }, { ...opts(c), serverWrittenCode: true }) as { isError?: boolean };
    expect(r.isError).not.toBe(true);
    expect(c.codes.length).toBeGreaterThan(0);
  });

  it('render_hook list still works', async () => {
    const c = controller();
    const r = await handleToolCall('pinepaper_render_hook', { action: 'list' }, opts(c)) as { isError?: boolean };
    expect(r.isError).not.toBe(true);
  });

  it('import_scene loads the scene but does not register its custom relations', async () => {
    const dir = getExportDir();
    mkdirSync(dir, { recursive: true });
    const p = join(dir, `cap-scene-${Date.now()}.json`);
    writeFileSync(p, JSON.stringify({ kind: 'pinepaper.project', formatVersion: '1.0.0', items: [],
      mcpCustomRelations: [{ name: 'wave_c', params: {}, computeFunction: 'return {};', applyFunction: '' }] }));
    const c = controller();
    const r = await handleToolCall('pinepaper_import_scene', { path: p, registerCustomRelations: true }, opts(c));
    expect(text(r as never)).toContain('PINEPAPER_ALLOW_CODE=1');
    expect(c.codes.some((x) => x.includes('registerRelationRule'))).toBe(false);
  });

  it('a local file outside the export folder is refused, naming PINEPAPER_ALLOW_LOCAL_FILES', async () => {
    const dir = mkdtempSync(join(process.cwd(), '.cap-test-'));
    const p = join(dir, 'x.json');
    writeFileSync(p, '{}');
    try {
      const r = await handleToolCall('pinepaper_import_scene', { path: p }, opts(controller())) as { isError?: boolean };
      expect(r.isError).toBe(true);
      expect(text(r as never)).toContain('PINEPAPER_ALLOW_LOCAL_FILES=1');
    } finally {
      (await import('node:fs')).rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the export folder is read without the switch (save / restore keeps working)', async () => {
    const dir = getExportDir();
    mkdirSync(dir, { recursive: true });
    const p = join(dir, `cap-plain-${Date.now()}.json`);
    writeFileSync(p, JSON.stringify({ kind: 'pinepaper.project', formatVersion: '1.0.0', items: [] }));
    const r = await handleToolCall('pinepaper_import_scene', { path: p }, opts(controller()));
    expect(text(r as never)).not.toContain('PINEPAPER_ALLOW_LOCAL_FILES');
  });
});

describe('without the ffmpeg add-on', () => {
  afterAll(() => setFfmpegRunner(ffmpegAddonRun));
  it('the receipt says the file was not read back and names the add-on', async () => {
    setFfmpegRunner(null);
    const f = join(mkdtempSync(join(tmpdir(), 'pp-cap-')), 'v.mp4');
    writeFileSync(f, 'x');
    const r = await verifyWithFfprobe(f, { container: 'mp4', codec: 'avc1', width: 2, height: 2, fps: 30, durationS: 1, frames: 30, audio: null } as never);
    expect(r.tool).toBeNull();
    expect(r.reason).toContain('@pinepaper.studio/mcp-ffmpeg');
  });
});
