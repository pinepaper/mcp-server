/**
 * Tests for the review findings on the CLI (PR #54): scaffolds that the Studio accepts, `$N` validation offline,
 * manifest paths that stay inside the project, a server that still starts for an unknown first word, and the
 * error paths that must be one line (or JSON), never a stack trace.
 */

import { afterEach, describe, expect, it } from 'bun:test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findBadItemRefs } from '../../cli/batch-refs.js';
import { guardedRun, routeFirstArg, runCliCommand } from '../../cli/index.js';
import { redactUrl } from '../../cli/output.js';
import { confineManifestPath } from '../../cli/safe-path.js';
import { cliCapabilities, withLocalFilesHint } from '../../cli/scene-runner.js';
import { collectLoadNotes } from '../../cli/commands/check.js';
import { parseTimes } from '../../cli/commands/snapshot.js';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const TEMPLATES = ['minimal', 'social-post', 'chart', 'diagram', 'solar-system'];
const tempDirs: string[] = [];

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pinepaper-cli-review-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (tempDirs.length) {
    try { rmSync(tempDirs.pop()!, { recursive: true, force: true }); } catch { /* ignore */ }
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

async function scaffold(template: string): Promise<{ dir: string; sceneFile: string; ops: Array<Record<string, unknown>> }> {
  const dir = makeTempDir();
  const r = await captureCli(['init', dir, '--template', template, '--json']);
  expect(r.code).toBe(0);
  const sceneFile = join(dir, 'scene.batch.json');
  return { dir, sceneFile, ops: JSON.parse(readFileSync(sceneFile, 'utf-8')).operations };
}

// What the Studio says `animationOptions` reads (its own warning lists these): anything else is ignored or rewritten.
const ANIMATION_OPTION_KEYS = new Set([
  'animationDelay', 'animationIntensity', 'animationOrigin', 'animationSpeed', 'animationType', 'animationWaveform',
  'duration', 'keyframes', 'staggerDelay', 'timeUnits', 'units',
]);

describe('scaffolds (items 1, 2, 3)', () => {
  it('minimal: the keyframe_animate op names the title, item $1 (only two items exist)', async () => {
    const { ops } = await scaffold('minimal');
    const kf = ops.find((o) => o.type === 'keyframe_animate')!;
    expect(kf.itemId).toBe('$1');
    expect(findBadItemRefs(ops)).toEqual([]);
  });

  for (const template of TEMPLATES) {
    it(`${template}: animate ops use only keys the Studio reads, and orbits name their phase`, async () => {
      const { ops } = await scaffold(template);
      for (const op of ops) {
        if (op.type === 'animate') {
          for (const key of Object.keys((op.animationOptions ?? {}) as object)) {
            expect(ANIMATION_OPTION_KEYS.has(key)).toBe(true);
          }
        }
        // The Studio stores an unset phaseDegrees as null, and its validator then fails the whole scene with
        // "orbits.phaseDegrees should be number, got object": every orbit says its phase.
        if (op.type === 'orbit') expect(typeof op.phaseDegrees).toBe('number');
      }
    });

    it(`${template}: passes check --offline, including $N references`, async () => {
      const { dir } = await scaffold(template);
      const r = await captureCli(['check', dir, '--offline', '--json']);
      expect(r.code).toBe(0);
      expect(JSON.parse(r.stdout).errorCount).toBe(0);
    });
  }
});

describe('live check surfaces what the Studio ignored or rewrote (item 1)', () => {
  it('turns ignoredOptions warnings and translatedArguments into notes', () => {
    const summary = {
      translatedArguments: ['operations[1].animationOptions.speed → animationOptions.animationSpeed'],
      result: { results: [{ index: 0, success: true, result: {} }, { index: 1, success: true, result: { warning: 'animationOptions does not read scale, so it was ignored.' } }] },
    };
    expect(collectLoadNotes(summary)).toEqual([
      'The Studio rewrote operations[1].animationOptions.speed → animationOptions.animationSpeed',
      'op 1: animationOptions does not read scale, so it was ignored.',
    ]);
    expect(collectLoadNotes({ result: { results: [] } })).toEqual([]);
    expect(collectLoadNotes(null)).toEqual([]);
  });
});

describe('offline $N reference validation (item 3)', () => {
  it('fails a scaffold that names an item before it exists, in the Studio\'s words', async () => {
    const { dir, sceneFile, ops } = await scaffold('minimal');
    const kf = ops.find((o) => o.type === 'keyframe_animate')!;
    kf.itemId = '$2';
    writeFileSync(sceneFile, JSON.stringify({ atomic: true, operations: ops }), 'utf-8');
    const r = await captureCli(['check', dir, '--offline', '--json']);
    expect(r.code).toBe(1);
    const data = JSON.parse(r.stdout);
    expect(data.ok).toBe(false);
    const f = data.findings.find((x: { path?: string }) => x.path === 'operations[3].itemId');
    expect(f.message).toContain('$2 is item number 2 THIS batch made');
    expect(f.message).toContain('it has made 2 so far');
  });

  it('numbers create, group, ring, grid, create_many and orbit-with-itemType; others take no slot', () => {
    const ops: Array<Record<string, unknown>> = [
      { type: 'ring', count: 3, itemType: 'circle' }, // $0..$2
      { type: 'group', itemIds: ['$0', '$1'], groupName: 'g' }, // $3
      { type: 'orbit', targetId: '$3', itemType: 'circle' }, // $4
      { type: 'animate', itemId: '$4', animationType: 'pulse' }, // takes no slot
      { type: 'create_many', itemType: 'circle', items: [[1, 1], [2, 2]] }, // $5, $6
      { type: 'grid', rows: 1, cols: 2, itemType: 'circle' }, // $7, $8
      { type: 'modify', itemId: '$8', properties: {} },
    ];
    expect(findBadItemRefs(ops)).toEqual([]);
    ops.push({ type: 'modify', itemId: '$9', properties: {} });
    const bad = findBadItemRefs(ops);
    expect(bad.map((b) => b.path)).toEqual(['operations[7].itemId']);
  });

  it('checks source, target and the itemIds list, and reports a reference before any item exists', () => {
    const bad = findBadItemRefs([
      { type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'follows' },
      { type: 'create', itemType: 'circle' },
      { type: 'group', itemIds: ['$0', '$5'], groupName: 'g' },
    ]);
    expect(bad.map((b) => b.path)).toEqual([
      'operations[0].sourceId', 'operations[0].targetId', 'operations[2].itemIds[1]',
    ]);
  });

  it('leaves names and ids alone', () => {
    expect(findBadItemRefs([{ type: 'modify', itemId: 'item_7', properties: {} }, { type: 'modify', itemId: 'title', properties: {} }])).toEqual([]);
  });
});

describe('manifest output stays inside the project (item 4)', () => {
  function project(output: string): { dir: string; outside: string } {
    const root = makeTempDir();
    const dir = join(root, 'proj');
    mkdirSync(dir);
    writeFileSync(join(dir, 'pinepaper.json'), JSON.stringify({ entry: 'scene.batch.json', export: { format: 'svg', output } }), 'utf-8');
    writeFileSync(join(dir, 'scene.batch.json'), JSON.stringify({ operations: [{ type: 'create', itemType: 'circle', position: { x: 1, y: 1 } }] }), 'utf-8');
    return { dir, outside: root };
  }

  it('confineManifestPath accepts renders/x.svg and refuses ../../x.svg, absolute paths and symlinked escapes', () => {
    const { dir, outside } = project('renders/x.svg');
    expect(confineManifestPath(dir, 'renders/x.svg')).toEqual({ ok: true, path: join(dir, 'renders', 'x.svg') });
    expect(confineManifestPath(dir, './a/../b.svg').ok).toBe(true);
    expect(confineManifestPath(dir, '../../x.svg').ok).toBe(false);
    expect(confineManifestPath(dir, '..').ok).toBe(false);
    expect(confineManifestPath(dir, join(outside, 'x.svg')).ok).toBe(false);
    expect(confineManifestPath(dir, '/etc/pinepaper-test.svg').ok).toBe(false);
    // A name that merely starts with two dots is inside.
    expect(confineManifestPath(dir, '..hidden/x.svg').ok).toBe(true);

    symlinkSync(outside, join(dir, 'link'));
    expect(confineManifestPath(dir, 'link/x.svg').ok).toBe(false);
    // A symlink that goes nowhere is refused too: writing through it would create its target.
    symlinkSync(join(outside, 'not-there', 'deeper'), join(dir, 'dangling'));
    expect(confineManifestPath(dir, 'dangling/x.svg').ok).toBe(false);
  });

  for (const [label, makeOutput] of [
    ['a ../../ path', () => '../../x.svg'],
    ['an absolute path', (outside: string) => join(outside, 'abs-x.svg')],
  ] as const) {
    it(`render refuses ${label}: one-line error, exit 1, nothing written`, async () => {
      const probe = project('placeholder');
      const output = makeOutput(probe.outside);
      writeFileSync(join(probe.dir, 'pinepaper.json'), JSON.stringify({ entry: 'scene.batch.json', export: { format: 'svg', output } }), 'utf-8');
      const before = readdirSync(probe.outside).sort();
      const r = await captureCli(['render', probe.dir]);
      expect(r.code).toBe(1);
      expect(r.stderr.trim().split('\n').length).toBe(1);
      expect(r.stderr).toContain('outside the project directory');
      expect(readdirSync(probe.outside).sort()).toEqual(before);
      expect(existsSync(join(probe.outside, 'x.svg'))).toBe(false);
      expect(existsSync(join(probe.dir, 'renders'))).toBe(false);
    });
  }

  it('render --json reports the refusal as JSON', async () => {
    const { dir } = project('../../x.svg');
    const r = await captureCli(['render', dir, '--json']);
    expect(r.code).toBe(1);
    expect(JSON.parse(r.stdout).error).toContain('outside the project directory');
  });

  it('render refuses a manifest path that leaves through a symlinked folder', async () => {
    const { dir, outside } = project('link/x.svg');
    symlinkSync(outside, join(dir, 'link'));
    const r = await captureCli(['render', dir, '--json']);
    expect(r.code).toBe(1);
    expect(existsSync(join(outside, 'x.svg'))).toBe(false);
  });
});

describe('local files default off (item 7)', () => {
  it('a CLI browser session turns local files on only when asked', () => {
    expect(cliCapabilities({})).toEqual({ localFiles: false, code: false });
    expect(cliCapabilities({ allowLocalFiles: false })).toEqual({ localFiles: false, code: false });
    expect(cliCapabilities({ allowLocalFiles: true, allowCode: true })).toEqual({ localFiles: true, code: true });
  });

  it('a refusal names the flag that turns local files on', () => {
    const msg = withLocalFilesHint('Importing "x.png" needs PINEPAPER_ALLOW_LOCAL_FILES=1.');
    expect(msg).toContain('--allow-local-files');
    expect(withLocalFilesHint('something else')).toBe('something else');
  });

  it('every command that loads a scene documents --allow-local-files', async () => {
    for (const cmd of ['check', 'render', 'snapshot', 'preview', 'benchmark']) {
      expect((await captureCli(['help', cmd])).stdout).toContain('--allow-local-files');
    }
  });
});

describe('error paths (item 8)', () => {
  it('guardedRun turns a throw into one line, or one JSON error, exit 1, and shows the stack only with debug', async () => {
    const boom = async (): Promise<number> => { throw new Error('boom'); };
    const err: string[] = [];
    const out: string[] = [];
    const origErr = console.error;
    const origLog = console.log;
    console.error = (...a: unknown[]) => { err.push(a.map(String).join(' ')); };
    console.log = (...a: unknown[]) => { out.push(a.map(String).join(' ')); };
    try {
      expect(await guardedRun('x', boom, false)).toBe(1);
      expect(err).toEqual(['pinepaper-mcp x: boom']);
      expect(await guardedRun('x', boom, true)).toBe(1);
      expect(JSON.parse(out.join('\n')).error).toBe('boom');
      err.length = 0;
      await guardedRun('x', boom, false, true);
      expect(err.length).toBe(2);
      expect(err[1]).toContain('at ');
    } finally {
      console.error = origErr;
      console.log = origLog;
    }
  });

  it('init into a path that is a file: one line, exit 1, JSON with --json', async () => {
    const dir = makeTempDir();
    const file = join(dir, 'afile');
    writeFileSync(file, 'x');
    const plain = await captureCli(['init', join(file, 'sub')]);
    expect(plain.code).toBe(1);
    expect(plain.stderr.trim().split('\n').length).toBe(1);
    expect(plain.stderr).toContain('Could not write the project');
    const json = await captureCli(['init', join(file, 'sub'), '--json']);
    expect(json.code).toBe(1);
    expect(JSON.parse(json.stdout).ok).toBe(false);
  });

  it('--json is honoured on unsupported --format, unknown tool, bad tool JSON and bad --times', async () => {
    const dir = makeTempDir();
    await captureCli(['init', dir, '--template', 'minimal']);

    const fmt = await captureCli(['render', dir, '--format', 'bogus', '--json']);
    expect(fmt.code).toBe(2);
    expect(JSON.parse(fmt.stdout).error).toContain('Unsupported format');

    const tool = await captureCli(['call', 'pinepaper_no_such_tool', '--json']);
    expect(tool.code).toBe(1);
    expect(JSON.parse(tool.stdout).error).toContain('Unknown tool');

    const badJson = await captureCli(['call', 'pinepaper_query_capabilities', '{not json', '--mode', 'code', '--json']);
    expect(badJson.code).toBe(2);
    expect(JSON.parse(badJson.stdout).error).toContain('Invalid tool arguments');

    const times = await captureCli(['snapshot', dir, '--times', 'abc', '--json']);
    expect(times.code).toBe(2);
    expect(JSON.parse(times.stdout).error).toContain('Invalid --times');
  });

  it('snapshot --times 1, is rejected, not read as time 0', async () => {
    expect(() => parseTimes('1,')).toThrow(/Invalid --times/);
    expect(() => parseTimes(',1')).toThrow(/Invalid --times/);
    expect(() => parseTimes('')).toThrow(/Invalid --times/);
    expect(parseTimes('0,1.5, 2')).toEqual([0, 1.5, 2]);
    const dir = makeTempDir();
    await captureCli(['init', dir, '--template', 'minimal']);
    const r = await captureCli(['snapshot', dir, '--times', '1,']);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('Invalid --times');
  });

  it('credentials in PINEPAPER_STUDIO_URL are never printed by info or doctor', async () => {
    const prev = process.env.PINEPAPER_STUDIO_URL;
    process.env.PINEPAPER_STUDIO_URL = 'https://alice:s3cr3t-token@studio.example.test';
    try {
      for (const argv of [['info', '--json'], ['info'], ['doctor', '--offline', '--json'], ['doctor', '--offline']]) {
        const r = await captureCli(argv);
        expect(r.stdout + r.stderr).not.toContain('s3cr3t-token');
        expect(r.stdout + r.stderr).not.toContain('alice');
        expect(r.stdout).toContain('https://studio.example.test');
      }
    } finally {
      if (prev === undefined) delete process.env.PINEPAPER_STUDIO_URL; else process.env.PINEPAPER_STUDIO_URL = prev;
    }
    expect(redactUrl('Could not reach https://u:p@h.test/build.json: bad https://x:y@z.test')).toBe('Could not reach https://h.test/build.json: bad https://z.test');
    expect(redactUrl('https://pinepaper.studio')).toBe('https://pinepaper.studio');

    // Same answers as the old regex on the edge cases, and linear on a long run of letters (CodeQL js/polynomial-redos).
    expect(redactUrl('see (https://a:b@h.test) and ftp://c@d.test')).toBe('see (https://h.test) and ftp://d.test');
    expect(redactUrl('https://a://b@h')).toBe('https://a://h');
    expect(redactUrl('no creds: https://h.test/x@y and 9://u@h')).toBe('no creds: https://h.test/x@y and 9://u@h');
    const long = 'a'.repeat(200_000);
    const t0 = Date.now();
    expect(redactUrl(long + '://u@h')).toBe(long + '://h');
    expect(redactUrl(long)).toBe(long);
    expect(Date.now() - t0).toBeLessThan(500);
  });

  it('info lists each local browser name once', async () => {
    const r = await captureCli(['info']);
    const line = r.stdout.split('\n').find((l) => l.startsWith('Local browsers:'))!;
    const names = line.replace('Local browsers:', '').split(',').map((s) => s.trim()).filter((s) => s && !s.startsWith('none'));
    expect(new Set(names).size).toBe(names.length);
  });

  it('benchmark leaves no scratch folder behind and uses no fixed name in the temp dir', async () => {
    const prevChrome = process.env.PINEPAPER_CHROME_PATH;
    const prevUrl = process.env.PINEPAPER_STUDIO_URL;
    const prevTimeout = process.env.PINEPAPER_TIMEOUT;
    process.env.PINEPAPER_CHROME_PATH = join(tmpdir(), 'definitely-not-a-browser');
    process.env.PINEPAPER_STUDIO_URL = 'http://127.0.0.1:9';
    process.env.PINEPAPER_TIMEOUT = '3000';
    const mine = () => readdirSync(tmpdir()).filter((n) => n.startsWith('pinepaper-benchmark'));
    const before = new Set(mine());
    try {
      const r = await captureCli(['benchmark', '--json']);
      expect(r.code).toBe(1);
    } finally {
      for (const [k, v] of [['PINEPAPER_CHROME_PATH', prevChrome], ['PINEPAPER_STUDIO_URL', prevUrl], ['PINEPAPER_TIMEOUT', prevTimeout]] as const) {
        if (v === undefined) delete process.env[k]; else process.env[k] = v;
      }
    }
    const added = mine().filter((n) => !before.has(n));
    expect(added).toEqual([]);
    expect(mine().includes('pinepaper-benchmark') && !before.has('pinepaper-benchmark')).toBe(false);
  }, 60000);
});

describe('first-word routing (item 5)', () => {
  it('no word, a flag and serve start the server; known words are commands', () => {
    expect(routeFirstArg(undefined, false)).toBe('serve');
    expect(routeFirstArg('--mode', true)).toBe('serve');
    expect(routeFirstArg('serve', false)).toBe('serve');
    expect(routeFirstArg('doctor', false)).toBe('command');
    expect(routeFirstArg('HELP', true)).toBe('command');
  });

  it('an unknown word exits 2 for a person at a terminal, and starts the server for a client', () => {
    expect(routeFirstArg('frobnicate', true)).toBe('unknown-command');
    expect(routeFirstArg('frobnicate', false)).toBe('unknown-serve');
  });

  it('a person at a terminal gets "Did you mean" and exit 2', async () => {
    const r = await captureCli(['doctr']);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain('Did you mean "doctor"?');
  });
});

// ---- the real binary (item 6) ------------------------------------------------------------------------------------

// The BUILT binary (dist/cli.js, what npm ships) when it is there; the source entry otherwise. `bun run build` first
// to test what ships; the prepublish gate builds before it tests.
const BUILT = join(REPO_ROOT, 'dist', 'cli.js');
const LAUNCH: [string, string[]] = existsSync(BUILT) ? ['node', [BUILT]] : ['bun', [join(REPO_ROOT, 'src', 'cli.ts')]];

const INITIALIZE = JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'spawn-test', version: '0' } },
}) + '\n';

/** Start the binary with piped stdin, send `initialize`, and return the first bytes on stdout and all of stderr. */
function startServer(args: string[]): Promise<{ firstChunk: string; firstLine: string; stderr: string }> {
  return new Promise((resolveRun, reject) => {
    const [bin, base] = LAUNCH;
    const child = spawn(bin, [...base, ...args], { cwd: REPO_ROOT, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    let firstChunk: string | null = null;
    let done = false;
    const finish = (err?: Error) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill();
      if (err) reject(err);
      else resolveRun({ firstChunk: firstChunk ?? '', firstLine: stdout.split('\n')[0], stderr });
    };
    const timer = setTimeout(() => finish(new Error(`no reply within 30 s; stdout=${JSON.stringify(stdout)} stderr=${stderr.slice(0, 300)}`)), 30000);
    child.stdout.on('data', (d: Buffer) => {
      const s = d.toString('utf-8');
      if (firstChunk === null) firstChunk = s;
      stdout += s;
      if (stdout.includes('\n')) finish();
    });
    child.stderr.on('data', (d: Buffer) => { stderr += d.toString('utf-8'); });
    child.on('error', (e) => finish(e));
    child.on('exit', () => finish());
    child.stdin.write(INITIALIZE);
  });
}

describe('the real binary starts the MCP server (item 6)', () => {
  for (const [label, args] of [
    ['no arguments', []],
    ['serve', ['serve']],
    ['an unknown first word with piped stdin', ['frobnicate']],
  ] as const) {
    it(`${label}: the first bytes on stdout are the JSON-RPC reply to initialize`, async () => {
      const r = await startServer([...args]);
      expect(r.firstChunk.startsWith('{"')).toBe(true);
      const reply = JSON.parse(r.firstLine);
      expect(reply.jsonrpc).toBe('2.0');
      expect(reply.id).toBe(1);
      expect(typeof reply.result.serverInfo.name).toBe('string');
      expect(typeof reply.result.protocolVersion).toBe('string');
      if (label.startsWith('an unknown')) {
        expect(r.stderr).toContain('ignoring unknown argument "frobnicate"');
        expect(r.stderr.split('\n').filter((l) => l.includes('ignoring unknown argument')).length).toBe(1);
      } else {
        expect(r.stderr).not.toContain('ignoring unknown argument');
      }
    }, 45000);
  }

  it('a known subcommand is still a command, not a server', () => {
    const [bin, base] = LAUNCH;
    const r = spawnSync(bin, [...base, 'docs', '--url', 'skills'], { cwd: REPO_ROOT, encoding: 'utf-8', input: '' });
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('https://pinepaper.studio/api/guides/skills');
  });
});
