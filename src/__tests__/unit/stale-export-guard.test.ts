/**
 * A rendering tool is refused while the studio page says it is on a stale build (owner's decision, 2026-11-20).
 *
 * The editor (FxTool BuildFreshness) never reloads itself in agent mode and stamps a stale export with a warning; this
 * server now refuses to START the export unless told otherwise. Only a positive `stale: true` with two different build
 * ids refuses: every "cannot tell" goes ahead as before.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { LANE_TOOLS } from '../../tools/lane.js';
import { RENDERING_TOOLS, GUARDED_TOOLS, STALE_BUILD_PROBE, staleBuildMessage } from '../../tools/stale-build-guard.js';
import { ENV_VARS } from '../../utils/env.js';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';
import { runCliCommand } from '../../cli/index.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

type Probe = { state: 'stale' | 'current' | 'unknown'; buildId?: string; liveBuildId?: string } | 'throw' | 'hang' | 'fail';

const STALE: Probe = { state: 'stale', buildId: '0.5.4+aaaa111', liveBuildId: '0.5.4+bbbb222' };

/** A fake studio page: answers the freshness probe as told, and records every other piece of code it is sent. */
function page(probe: Probe) {
  const probes: string[] = [];
  const other: string[] = [];
  const controller = {
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string) => {
      if (code === STALE_BUILD_PROBE) {
        probes.push(code);
        if (probe === 'throw') throw new Error('page gone');
        if (probe === 'hang') return new Promise<never>(() => { /* never settles */ });
        if (probe === 'fail') return { success: false, error: 'boom' };
        return { success: true, result: probe };
      }
      other.push(code);
      return { success: true, result: { success: true, svgString: '<svg/>' } };
    },
  };
  return { controller, probes, other };
}
const opts = (c: unknown, extra: Record<string, unknown> = {}) =>
  ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const, screenshotMode: 'never' as const, ...extra });
const text = (r: { content?: Array<{ type: string; text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');

let saved: string | undefined;
beforeEach(() => { saved = process.env.PINEPAPER_STALE_EXPORT; delete process.env.PINEPAPER_STALE_EXPORT; });
afterEach(() => { if (saved === undefined) delete process.env.PINEPAPER_STALE_EXPORT; else process.env.PINEPAPER_STALE_EXPORT = saved; });

describe('a stale page refuses the export', () => {
  it('names both builds and both ways forward, sends no export code, changes nothing', async () => {
    const p = page(STALE);
    const r = await handleToolCall('pinepaper_export_svg', {}, opts(p.controller));
    expect(r.isError).toBe(true);
    expect(p.other).toEqual([]);          // the export code was never sent
    expect(p.probes.length).toBe(1);      // one page round trip: the check itself
    const t = (r.structuredContent as { error: { message: string } }).error.message; // the message itself, not the details beside it
    expect(t).toContain('0.5.4+aaaa111');
    expect(t).toContain('0.5.4+bbbb222');
    expect(t).toContain('Nothing was exported and nothing was changed');
    expect(t).toContain('pinepaper_clear_canvas');
    expect(t).toContain('pinepaper_agent_start_job');
    expect(t).toContain('allowStaleBuild: true');
    expect(t).toContain('PINEPAPER_STALE_EXPORT=allow');
    const sc = r.structuredContent as { error: { code: string; details: Record<string, unknown> } };
    expect(sc.error.code).toBe('STALE_BUILD');
    expect(sc.error.details).toMatchObject({ code: 'STALE_BUILD', buildId: '0.5.4+aaaa111', liveBuildId: '0.5.4+bbbb222', exported: false, changed: false });
    expect(JSON.parse(text(r)).error.code).toBe('STALE_BUILD');
  });

  it('the message is the one the guard builds', () => {
    expect(staleBuildMessage('A', 'B')).toContain('on build A, and the live build is B');
  });

  it('the page is never reloaded by the refusal', async () => {
    const p = page(STALE);
    await handleToolCall('pinepaper_export_svg', {}, opts(p.controller));
    expect([...p.probes, ...p.other].some((c) => /reloadIfStale|location\.reload/.test(c))).toBe(false);
  });
});

describe('what lets the export go ahead', () => {
  it('allowStaleBuild: true exports, with no check', async () => {
    const p = page(STALE);
    const r = await handleToolCall('pinepaper_export_svg', { allowStaleBuild: true }, opts(p.controller));
    expect(r.isError).not.toBe(true);
    expect(p.other.length).toBeGreaterThan(0);
    expect(p.probes.length).toBe(0);
    expect(text(r)).not.toContain('IGNORED ARGUMENTS');
  });

  it('PINEPAPER_STALE_EXPORT=allow exports, with no check', async () => {
    process.env.PINEPAPER_STALE_EXPORT = 'allow';
    const p = page(STALE);
    const r = await handleToolCall('pinepaper_export_svg', {}, opts(p.controller));
    expect(r.isError).not.toBe(true);
    expect(p.other.length).toBeGreaterThan(0);
    expect(p.probes.length).toBe(0);
  });

  it('any other value of the variable still refuses', async () => {
    process.env.PINEPAPER_STALE_EXPORT = 'warn';
    const p = page(STALE);
    expect((await handleToolCall('pinepaper_export_svg', {}, opts(p.controller))).isError).toBe(true);
  });

  it('a fresh page exports, with exactly one extra page round trip', async () => {
    const p = page({ state: 'current' });
    const r = await handleToolCall('pinepaper_export_svg', {}, opts(p.controller));
    expect(r.isError).not.toBe(true);
    expect(p.probes.length).toBe(1);
    expect(p.other.length).toBeGreaterThan(0);
  });

  const cannotTell: Array<[string, Probe]> = [
    ['an older editor without checkBuild', { state: 'unknown' }],
    ['a check that threw', 'throw'],
    ['a probe the page could not run', 'fail'],
    ['a stale answer with the same build id twice', { state: 'stale', buildId: 'x', liveBuildId: 'x' }],
    ['a stale answer with no live id (unreachable /build.json)', { state: 'stale', buildId: 'x' }],
  ];
  for (const [name, probe] of cannotTell) {
    it(`cannot tell: ${name}`, async () => {
      const p = page(probe);
      const r = await handleToolCall('pinepaper_export_svg', {}, opts(p.controller));
      expect(r.isError).not.toBe(true);
      expect(p.other.length).toBeGreaterThan(0);
    });
  }

  it('cannot tell: the check hangs, so the export goes ahead after the bound', async () => {
    const p = page('hang');
    const t0 = Date.now();
    const r = await handleToolCall('pinepaper_export_svg', {}, opts(p.controller, { staleCheckTimeoutMs: 80 }));
    expect(r.isError).not.toBe(true);
    expect(p.other.length).toBeGreaterThan(0);
    expect(Date.now() - t0).toBeLessThan(3000);
  });

  it('the probe reads the editor\'s own fresh check and judges staleness only on a positive answer', () => {
    expect(STALE_BUILD_PROBE).toContain('checkBuild()');
    expect(STALE_BUILD_PROBE).toContain('s.stale === true');
    expect(STALE_BUILD_PROBE).toContain('s.buildId !== s.liveBuildId');
  });

  it('a page that evaluates the probe as the real editor would: no checkBuild, a throwing one, and a stale one', async () => {
    const run = async (appObj: unknown) => new Function('app', `return ${STALE_BUILD_PROBE}`)(appObj);
    expect(await run(undefined)).toEqual({ state: 'unknown' });
    expect(await run({})).toEqual({ state: 'unknown' });
    expect(await run({ checkBuild: async () => { throw new Error('x'); } })).toEqual({ state: 'unknown' });
    expect(await run({ checkBuild: async () => ({ buildId: 'a+1', liveBuildId: null, stale: false }) })).toEqual({ state: 'current' });
    expect(await run({ checkBuild: async () => ({ buildId: 'a+1', liveBuildId: 'a+2', stale: true }) })).toEqual({ state: 'stale', buildId: 'a+1', liveBuildId: 'a+2' });
  });

  it('estimateOnly makes no check', async () => {
    const p = page(STALE);
    await handleToolCall('pinepaper_render_batch', { rows: [{ id: 'a' }], export: { format: 'png' }, estimateOnly: true }, opts(p.controller));
    expect(p.probes.length).toBe(0);
  });

  it('code mode, a disconnected page and no browser make no check', async () => {
    const p = page(STALE);
    await handleToolCall('pinepaper_export_svg', {}, { ...opts(p.controller), executionMode: 'code' });
    await handleToolCall('pinepaper_export_svg', {}, { ...opts(p.controller), executeInBrowser: false });
    const off = page(STALE);
    (off.controller as { connected: boolean }).connected = false;
    await handleToolCall('pinepaper_export_svg', {}, opts(off.controller));
    expect(p.probes.length + off.probes.length).toBe(0);
  });

  it('a tool that is not a rendering tool makes no check', async () => {
    const p = page(STALE);
    await handleToolCall('pinepaper_clear_canvas', {}, opts(p.controller));
    expect(p.probes.length).toBe(0);
  });
});

describe('every rendering tool is guarded (table-driven over RENDERING_TOOLS itself)', () => {
  it('the set is what the code enumerates', () => {
    expect([...RENDERING_TOOLS].sort()).toEqual([
      'pinepaper_agent_export', 'pinepaper_capture_frames', 'pinepaper_export_scene', 'pinepaper_export_svg',
      'pinepaper_export_training_data', 'pinepaper_export_widget', 'pinepaper_export_widget_html', 'pinepaper_render_batch',
      'pinepaper_sprite_sheet',
    ]);
  });

  // A valid call for each tool: a call its own schema refuses has nothing to export and never touches the page.
  const VALID_ARGS: Record<string, Record<string, unknown>> = {
    pinepaper_agent_export: { format: 'png' },
    pinepaper_capture_frames: { times: [0] },
    pinepaper_export_scene: {},
    pinepaper_export_svg: {},
    pinepaper_export_training_data: {},
    pinepaper_export_widget: {},
    pinepaper_export_widget_html: {},
    pinepaper_render_batch: { rows: [{ changes: { item_1: { opacity: 1 } } }], export: { format: 'png' } },
    pinepaper_sprite_sheet: { action: 'generate' },
  };
  it('every member of RENDERING_TOOLS has a valid call in this table (add one for a new tool)', () => {
    expect(Object.keys(VALID_ARGS).sort()).toEqual([...RENDERING_TOOLS].sort());
  });

  for (const tool of RENDERING_TOOLS) {
    it(`${tool}: stale → refused, nothing but the check sent; allowStaleBuild is published`, async () => {
      const p = page(STALE);
      const r = await handleToolCall(tool, VALID_ARGS[tool], opts(p.controller));
      expect(r.isError).toBe(true);
      expect((r.structuredContent as { error: { code: string } }).error.code).toBe('STALE_BUILD');
      expect(JSON.parse(r.content![0].type === 'text' ? (r.content![0] as { text: string }).text : '{}').error.code).toBe('STALE_BUILD');
      expect(p.other).toEqual([]);
      expect(p.probes.length).toBe(1);
      const def = PINEPAPER_TOOLS.find((t) => t.name === tool);
      expect(def).toBeDefined();
      expect((def!.inputSchema as { properties: Record<string, { type: string }> }).properties.allowStaleBuild?.type).toBe('boolean');
    });
  }

  it('a call its own schema refuses touches no page, and says what is wrong', async () => {
    const p = page(STALE);
    const r = await handleToolCall('pinepaper_render_batch', { rows: [{ changes: { a: { content: 'x' } } }], export: { format: 'bmp' } }, opts(p.controller));
    expect(r.isError).toBe(true);
    expect(text(r)).not.toContain('STALE_BUILD');
    const q = await handleToolCall('pinepaper_agent_export', { format: 'not-a-format' }, opts(p.controller));
    expect(text(q)).not.toContain('STALE_BUILD');
    expect(p.probes.length + p.other.length).toBe(0);
  });

  it('pinepaper_interchange: the export_ actions are guarded, the import_ actions and bad actions are not, and it publishes the argument', async () => {
    for (const action of ['export_lottie', 'export_dotlottie', 'export_glb', 'export_bvh', 'export_png_sequence']) {
      const p = page(STALE);
      const r = await handleToolCall('pinepaper_interchange', { action, skeletonId: 'rig_1' }, opts(p.controller));
      expect((r.structuredContent as { error: { code: string } }).error.code).toBe('STALE_BUILD');
      expect(p.other).toEqual([]);
    }
    const q = page(STALE);
    await handleToolCall('pinepaper_interchange', { action: 'import_lottie' }, opts(q.controller));
    expect(q.probes.length).toBe(0);
    const ok = page(STALE);
    const r = await handleToolCall('pinepaper_interchange', { action: 'export_lottie', allowStaleBuild: true }, opts(ok.controller));
    expect(ok.probes.length).toBe(0);
    expect(r.isError === true && (r.structuredContent as { error?: { code?: string } } | undefined)?.error?.code === 'STALE_BUILD').toBe(false);
    expect(GUARDED_TOOLS.has('pinepaper_interchange')).toBe(true);
    const def = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_interchange')!;
    expect((def.inputSchema as { properties: Record<string, unknown> }).properties.allowStaleBuild).toBeDefined();
  });

  it('the agent lane\'s export publishes it too', () => {
    expect((LANE_TOOLS.pinepaper_agent_export.inputSchema as { properties: Record<string, unknown> }).properties.allowStaleBuild).toBeDefined();
  });

  it('a new tool that exports or renders from the page cannot be added without the guard', () => {
    // Tools whose names suggest an export but that render nothing from the page: they hand back held bytes, build a
    // file from data the caller sends, or act on a different document.
    const NOT_FROM_THE_PAGE = new Set([
      'pinepaper_export_store',            // pages out bytes an earlier export already made
      'pinepaper_browser_screenshot',      // looks at the page; exports nothing
      'pinepaper_import_motion_capture',   // imports
      'pinepaper_render_hook',             // registers per-frame drawing; renders nothing itself
    ]);
    const suspects = PINEPAPER_TOOLS.map((t) => t.name).filter((n) => /export|render|capture_frames|sprite_sheet|screenshot|interchange/.test(n) && !NOT_FROM_THE_PAGE.has(n));
    for (const n of suspects) expect(GUARDED_TOOLS.has(n)).toBe(true);
  });

  it('a batch row or per-scene segment is not checked again (one round trip per export)', async () => {
    // agent_export inside render_batch runs on the same page after the batch passed the guard once.
    const p = page({ state: 'current' });
    await handleToolCall('pinepaper_render_batch', { rows: [{ id: 'a', changes: { item_1: { opacity: 1 } } }, { id: 'b', changes: { item_1: { opacity: 0.5 } } }], export: { format: 'png' } }, opts(p.controller));
    expect(p.other.filter((c) => c.includes('exportEngine') || c.includes('quickExport') || c.includes('PinePaperAgent')).length).toBeGreaterThanOrEqual(2); // both rows really exported
    expect(p.probes.length).toBe(1);
  });
});

describe('the environment variable and the README', () => {
  it('is on the list of variables the server reads, and documented', () => {
    expect(ENV_VARS).toContain('PINEPAPER_STALE_EXPORT');
    const readme = readFileSync(join(import.meta.dir, '..', '..', '..', 'README.md'), 'utf8');
    expect(readme).toContain('PINEPAPER_STALE_EXPORT');
    expect(readme).toContain('allowStaleBuild');
  });
});

describe('the command line', () => {
  const saved = {
    connect: PinePaperBrowserController.prototype.connect,
    disconnect: PinePaperBrowserController.prototype.disconnect,
    executeCode: PinePaperBrowserController.prototype.executeCode,
    connected: Object.getOwnPropertyDescriptor(PinePaperBrowserController.prototype, 'connected')!,
  };
  let probes = 0;
  let others: string[] = [];
  let answer: Probe = STALE;
  beforeEach(() => {
    probes = 0; others = []; answer = STALE;
    const P = PinePaperBrowserController.prototype as unknown as Record<string, unknown>;
    P.connect = async () => undefined;
    P.disconnect = async () => undefined;
    P.executeCode = async (code: string) => {
      if (code === STALE_BUILD_PROBE) { probes++; return { success: true, result: answer }; }
      others.push(code);
      return { success: true, result: { success: true, svgString: '<svg/>' } };
    };
    Object.defineProperty(PinePaperBrowserController.prototype, 'connected', { get: () => true, configurable: true });
  });
  afterEach(() => {
    const P = PinePaperBrowserController.prototype as unknown as Record<string, unknown>;
    P.connect = saved.connect; P.disconnect = saved.disconnect; P.executeCode = saved.executeCode;
    Object.defineProperty(PinePaperBrowserController.prototype, 'connected', saved.connected);
  });
  async function cli(argv: string[]) {
    const out: string[] = [];
    const o = console.log, e = console.error;
    console.log = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
    console.error = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
    try { const code = await runCliCommand(argv); return { code, out: out.join('\n') }; } finally { console.log = o; console.error = e; }
  }

  it('call <export tool>: stale → refused (exit 1, STALE_BUILD, nothing exported)', async () => {
    const r = await cli(['call', 'pinepaper_export_svg', '{}', '--json']);
    expect(r.code).not.toBe(0);
    expect(r.out).toContain('STALE_BUILD');
    expect(others).toEqual([]);
    expect(probes).toBe(1);
  });

  it('call <export tool> --allow-stale-build exports', async () => {
    const r = await cli(['call', 'pinepaper_export_svg', '{}', '--allow-stale-build', '--json']);
    expect(r.code).toBe(0);
    expect(others.length).toBeGreaterThan(0);
    expect(probes).toBe(0);
  });

  it('the flag is not added to a tool that is not a rendering tool', async () => {
    const r = await cli(['call', 'pinepaper_clear_canvas', '{}', '--allow-stale-build', '--json']);
    expect(r.out).not.toContain('IGNORED ARGUMENTS');
  });

  /** A scene file the CLI can load into the fake studio. */
  function scene(): { dir: string; file: string } {
    const dir = mkdtempSync(join(tmpdir(), 'pp-stale-cli-'));
    const file = join(dir, 'a.batch.json');
    writeFileSync(file, JSON.stringify({ operations: [{ type: 'create', itemType: 'circle', position: { x: 10, y: 10 } }] }));
    return { dir, file };
  }
  for (const [name, argv] of [
    ['render', (f: string) => ['render', f, '-f', 'svg', '-o', join(tmpdir(), 'pp-stale-out.svg'), '--json']],
    ['snapshot', (f: string) => ['snapshot', f, '--times', '0', '--sheet', '--json']],
    ['benchmark', (f: string) => ['benchmark', f, '-f', 'svg', '--json']],
  ] as const) {
    it(`${name}: a stale page refuses the export, and --allow-stale-build lets it through`, async () => {
      const sc = scene();
      try {
        const before = others.length;
        const refused = await cli([...argv(sc.file)]);
        const sent = others.slice(before);
        expect(refused.code).not.toBe(0);
        expect(probes).toBeGreaterThanOrEqual(1);
        // Loading the scene runs code; the export itself must not have been sent.
        expect(sent.some((c) => /svgString|exportAnimatedSVG|capture/i.test(c) && !/agent_reset|clear/i.test(c))).toBe(false);
        probes = 0;
        const allowed = await cli([...argv(sc.file), '--allow-stale-build']);
        expect(probes).toBe(0);
        expect(allowed.out).not.toContain('STALE_BUILD');
      } finally { rmSync(sc.dir, { recursive: true, force: true }); }
    });
  }

  for (const cmd of ['render', 'snapshot', 'benchmark', 'call']) {
    it(`${cmd} --help lists --allow-stale-build`, async () => {
      const r = await cli([cmd, '--help']);
      expect(r.out).toContain('--allow-stale-build');
    });
  }
});
