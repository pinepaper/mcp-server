/**
 * Tests for the PinePaper CLI subcommand layer (Phases 1 & 2),
 * browser environment probes, argument parsing, and backwards-compatible entrypoint.
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectInstalledBrowsers, probeBrowserEnvironment } from '../../browser/puppeteer-controller.js';
import { parseArgs, suggestCommand } from '../../cli/args.js';
import { runCliCommand } from '../../cli/index.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { SERVER_VERSION } from '../../version.js';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pinepaper-cli-test-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length) {
    const dir = tempDirs.pop()!;
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
  }
});

async function captureCli(argv: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
  console.error = (...a: unknown[]) => { err.push(a.map(String).join(' ')); };
  try {
    const code = await runCliCommand(argv);
    return { code, stdout: out.join('\n'), stderr: err.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
}

describe('CLI arg parser & command suggestions', () => {
  it('parses flags, short aliases, inline values, and boolean negation', () => {
    const res = parseArgs(
      ['./proj', '-f', 'mp4', '--fps=60', '--no-watch', '--deterministic', '-o', 'out.mp4', '--', '--literal'],
      {
        format: { type: 'string', short: 'f' },
        fps: { type: 'number' },
        watch: { type: 'boolean' },
        deterministic: { type: 'boolean' },
        output: { type: 'string', short: 'o' },
      },
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.data.positionals).toEqual(['./proj', '--literal']);
    expect(res.data.flags.format).toBe('mp4');
    expect(res.data.flags.fps).toBe(60);
    expect(res.data.flags.watch).toBe(false);
    expect(res.data.flags.deterministic).toBe(true);
    expect(res.data.flags.output).toBe('out.mp4');
  });

  it('rejects unknown flags and invalid numbers cleanly', () => {
    expect(parseArgs(['--bogus']).ok).toBe(false);
    expect(parseArgs(['--fps', 'notanumber'], { fps: { type: 'number' } }).ok).toBe(false);
    expect(parseArgs(['--fps'], { fps: { type: 'number' } }).ok).toBe(false);
  });

  it('suggests the closest subcommand for typos', () => {
    const cmds = ['doctor', 'info', 'browser', 'docs', 'tools', 'setup', 'init', 'check', 'render', 'snapshot', 'preview', 'benchmark', 'call'];
    expect(suggestCommand('doctr', cmds)).toBe('doctor');
    expect(suggestCommand('rendr', cmds)).toBe('render');
    expect(suggestCommand('completely_unrelated_xyz', cmds)).toBeNull();
  });
});

describe('Browser environment probe', () => {
  it('returns structured driver and binary metadata without throwing', async () => {
    const probe = await probeBrowserEnvironment();
    expect(probe.minMajor).toBe(22);
    expect(Array.isArray(probe.detectedBrowsers)).toBe(true);
    expect(Array.isArray(detectInstalledBrowsers())).toBe(true);
    if (probe.chromePathEnv) {
      expect(typeof probe.chromePathExists).toBe('boolean');
    } else {
      expect(probe.chromePathExists).toBeNull();
    }
  });
});

describe('Phase 1 CLI commands', () => {
  it('info --json emits version, build, and tool counts', async () => {
    const r = await captureCli(['info', '--json']);
    expect(r.code).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data._meta.package).toBe('@pinepaper.studio/mcp-server');
    expect(data._meta.version).toBe(SERVER_VERSION);
    expect(data._meta.command).toBe('info');
    expect(data.tools.total).toBe(PINEPAPER_TOOLS.length);
    expect(typeof data.tools.toolkits.core).toBe('number');
  });

  it('doctor --offline --json reports core health checks', async () => {
    const r = await captureCli(['doctor', '--offline', '--json']);
    expect(r.code).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.ok).toBe(true);
    const ids = (data.checks as Array<{ id: string }>).map((c) => c.id);
    expect(ids).toEqual(['node', 'driver', 'browser', 'studio', 'exportDir', 'ffmpeg']);
  });

  it('browser --json outputs probe details and install options', async () => {
    const r = await captureCli(['browser', '--json']);
    expect(r.code).toBe(0);
    const data = JSON.parse(r.stdout);
    expect(data.action).toBe('status');
    expect(data.probe.minMajor).toBe(22);
    expect(data.install.npx).toContain('puppeteer');
  });

  it('docs lists built-in guides, reads getting-started, resolves URLs, and suggests on typo', async () => {
    const list = await captureCli(['docs', '--list', '--json']);
    expect(list.code).toBe(0);
    const listJson = JSON.parse(list.stdout);
    expect(listJson.topics.some((t: { slug: string }) => t.slug === 'getting-started')).toBe(true);

    const doc = await captureCli(['docs', 'getting-started', '--json']);
    expect(doc.code).toBe(0);
    expect(JSON.parse(doc.stdout).content).toContain('PinePaper');

    const url = await captureCli(['docs', '--url', 'skills']);
    expect(url.code).toBe(0);
    expect(url.stdout.trim()).toBe('https://pinepaper.studio/api/guides/skills');

    const bad = await captureCli(['docs', 'relationz']);
    expect(bad.code).toBe(1);
    expect(bad.stderr).toContain('relations');
  });

  it('tools searches and shows schemas accurately', async () => {
    const search = await captureCli(['tools', 'search', 'morph', '--json']);
    expect(search.code).toBe(0);
    const searchJson = JSON.parse(search.stdout);
    expect(searchJson.tools.some((t: { name: string }) => t.name === 'pinepaper_morph_sequence')).toBe(true);

    const show = await captureCli(['tools', 'show', 'pinepaper_agent_export', '--json']);
    expect(show.code).toBe(0);
    const showJson = JSON.parse(show.stdout);
    expect(showJson.tool.name).toBe('pinepaper_agent_export');
    expect(showJson.tool.inputSchema.properties.format).toBeDefined();

    const bad = await captureCli(['tools', 'show', 'pinepaper_nonexistent_xyz']);
    expect(bad.code).toBe(1);
  });

  it('setup prints ready-to-paste client configs and marketplace instructions', async () => {
    for (const target of ['claude-code', 'claude-desktop', 'cursor', 'codex', 'vscode', 'skills']) {
      const r = await captureCli(['setup', target, '--json']);
      expect(r.code).toBe(0);
      const d = JSON.parse(r.stdout);
      expect(d.target).toBe(target);
      expect(typeof d.snippet).toBe('string');
    }
    const cc = JSON.parse((await captureCli(['setup', 'claude-code', '--json'])).stdout);
    expect(cc.snippet).toContain('pinepaper/pinepaper-claude-marketplace');
  });
});

describe('Phase 2 CLI commands (init, check, call, help)', () => {
  for (const template of ['minimal', 'social-post', 'chart', 'diagram', 'solar-system']) {
    it(`init (${template}) creates valid files that pass check --offline`, async () => {
      const dir = makeTempDir();
      const initRes = await captureCli(['init', dir, '--template', template, '--json']);
      expect(initRes.code).toBe(0);
      expect(existsSync(join(dir, 'pinepaper.json'))).toBe(true);
      expect(existsSync(join(dir, 'scene.batch.json'))).toBe(true);

      const cfg = JSON.parse(readFileSync(join(dir, 'pinepaper.json'), 'utf-8'));
      expect(cfg.entry).toBe('scene.batch.json');

      const chkRes = await captureCli(['check', dir, '--offline', '--json']);
      expect(chkRes.code).toBe(0);
      const chkJson = JSON.parse(chkRes.stdout);
      expect(chkJson.ok).toBe(true);
      expect(chkJson.errorCount).toBe(0);
    });
  }

  it('check --offline catches schema, macro, and ontology typos with exit code 1', async () => {
    const dir = makeTempDir();
    const badPath = join(dir, 'bad.batch.json');
    writeFileSync(badPath, JSON.stringify({
      operations: [{ type: 'create', itemType: 'circel', position: { x: 100, y: 100 } }],
    }), 'utf-8');

    const res = await captureCli(['check', badPath, '--offline', '--json']);
    expect(res.code).toBe(1);
    const data = JSON.parse(res.stdout);
    expect(data.ok).toBe(false);
    expect(data.errorCount).toBeGreaterThan(0);
    expect(JSON.stringify(data.findings)).toContain('circle');
  });

  it('validate and lint aliases route to check', async () => {
    const dir = makeTempDir();
    await captureCli(['init', dir, '--template', 'minimal']);
    expect((await captureCli(['validate', dir, '--offline', '--json'])).code).toBe(0);
    expect((await captureCli(['lint', dir, '--offline', '--json'])).code).toBe(0);
  });

  it('call invokes tools in --mode code cleanly', async () => {
    const res = await captureCli(['call', 'pinepaper_query_capabilities', '{"action":"list"}', '--mode', 'code', '--json']);
    expect(res.code).toBe(0);
    const data = JSON.parse(res.stdout);
    expect(data.tool).toBe('pinepaper_query_capabilities');
    expect(data.ok).toBe(true);
  });

  it('handles help and unknown subcommands with suggestions and exit code 2', async () => {
    expect((await captureCli(['help', 'doctor'])).code).toBe(0);
    const bad = await captureCli(['doctr']);
    expect(bad.code).toBe(2);
    expect(bad.stderr).toContain('Did you mean "doctor"?');
  });
});

describe('Real CLI binary entrypoint (src/cli.ts)', () => {
  it('prints version on --version and unified help on --help', () => {
    const v = spawnSync('bun', ['src/cli.ts', '--version'], { cwd: REPO_ROOT, encoding: 'utf-8' });
    expect(v.status).toBe(0);
    expect(v.stdout.trim()).toBe(SERVER_VERSION);

    const h = spawnSync('bun', ['src/cli.ts', '--help'], { cwd: REPO_ROOT, encoding: 'utf-8' });
    expect(h.status).toBe(0);
    expect(h.stdout).toContain('COMMANDS:');
    expect(h.stdout).toContain('doctor');
    expect(h.stdout).toContain('render');
    expect(h.stdout).toContain('serve (default)');

    const info = spawnSync('bun', ['src/cli.ts', 'info', '--json'], { cwd: REPO_ROOT, encoding: 'utf-8' });
    expect(info.status).toBe(0);
    const parsed = JSON.parse(info.stdout);
    expect(parsed._meta.version).toBe(SERVER_VERSION);
  });
});
