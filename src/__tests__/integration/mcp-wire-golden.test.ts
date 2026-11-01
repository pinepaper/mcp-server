/**
 * THE WIRE, RECORDED. Each session below drives the real CLI over stdin/stdout
 * and compares every frame it writes with a recording.
 *
 * The recordings were made from the @modelcontextprotocol/sdk server (1.32.1)
 * before the server's own protocol layer replaced it (1.6.25), except
 * load-on-demand, which is new and says so, so they are what
 * "behaves like the SDK" means here: version negotiation, ping, setLevel, the
 * error codes, a malformed line dropped without a reply, tools/list_changed
 * after a load. UPDATE_MCP_GOLDEN=1 re-records; do that only
 * when a difference is intended, and say why in the commit. Tool, prompt and
 * resource NAMES are recorded, so adding one is a re-record; editing one is not.
 */
import { describe, it, expect } from 'bun:test';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..', '..');
const FIXTURES = join(import.meta.dir, '..', 'fixtures', 'mcp-wire');
const UPDATE = process.env.UPDATE_MCP_GOLDEN === '1';
const PKG_VERSION: string = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

type Frame = Record<string, unknown>;
/** A step: a message (or a raw line) to send, and whether to wait for a reply with its id. */
type Step = { send: Frame | string; await?: boolean; settleMs?: number };

const init = (protocolVersion: string, name = 'golden') => ({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion, capabilities: {}, clientInfo: { name, version: '1.0.0' } },
});
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };

/** Strip what legitimately differs run to run: the build id and timings, and our own version (so a bump re-records nothing). */
function normalize(f: Frame): Frame {
  return JSON.parse(JSON.stringify(f, (k, v) => {
    if (k === 'version' && typeof v === 'string' && /^\d+\.\d+\.\d+/.test(v)) return v.replace(/\+.*$/, '+BUILD').replace(PKG_VERSION, 'PKG_VERSION');
    if (k === 'pinepaper.studio/timing') return 'TIMING';
    return v;
  }));
}
/**
 * The recording pins the PROTOCOL, not the catalogue: a list keeps its member names, and text a tool returns, the
 * instructions and the descriptions are replaced by a marker, so editing a description does not need a re-record.
 */
function compact(f: Frame): Frame {
  const r = f.result as Record<string, unknown> | undefined;
  if (!r) return f;
  const out: Record<string, unknown> = { ...r };
  if (Array.isArray(r.tools)) out.tools = (r.tools as Array<{ name: string }>).map((t) => t.name);
  if (Array.isArray(r.prompts)) out.prompts = (r.prompts as Array<{ name: string }>).map((p) => p.name);
  if (Array.isArray(r.resources)) out.resources = (r.resources as Array<{ uri: string }>).map((x) => x.uri);
  if (typeof r.instructions === 'string') out.instructions = '<instructions>';
  if (r.serverInfo && typeof r.serverInfo === 'object') out.serverInfo = { ...(r.serverInfo as object), description: '<description>' };
  if (Array.isArray(r.content)) out.content = (r.content as Array<{ type: string }>).map((c) => ({ ...c, ...('text' in c ? { text: '<text>' } : {}) }));
  if (r.structuredContent !== undefined) out.structuredContent = '<structured>';
  return { ...f, result: out };
}

async function session(steps: Step[], env: Record<string, string> = {}): Promise<Frame[]> {
  const child = spawn('bun', ['src/cli.ts'], { cwd: ROOT, env: { ...process.env, PINEPAPER_TOOLKIT: '', PINEPAPER_VERBOSITY: '', ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
  const frames: Frame[] = [];
  let buf = '';
  const waiters = new Map<unknown, () => void>();
  child.stdout.on('data', (d: Buffer) => {
    buf += d.toString('utf8');
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const f = JSON.parse(line) as Frame;
      frames.push(compact(normalize(f)));
      if ('id' in f && waiters.has(f.id)) { waiters.get(f.id)!(); waiters.delete(f.id); }
    }
  });
  child.stderr.on('data', () => {});
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  try {
    for (const step of steps) {
      const line = typeof step.send === 'string' ? step.send : JSON.stringify(step.send);
      const id = typeof step.send === 'string' ? undefined : step.send.id;
      const got = step.await && id !== undefined ? new Promise<void>((r) => waiters.set(id, r)) : null;
      child.stdin.write(line + '\n');
      if (got) await Promise.race([got, sleep(15000).then(() => { throw new Error(`no reply to id ${String(id)}`); })]);
      await sleep(step.settleMs ?? 150);
    }
  } finally {
    child.stdin.end();
    child.kill();
  }
  return frames;
}

const SESSIONS: Record<string, { steps: Step[]; env?: Record<string, string> }> = {
  // Version negotiation: each supported version is echoed; an unknown one gets the latest.
  ...Object.fromEntries(['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07', '1999-01-01'].map((v) => [
    `initialize-${v}`, { steps: [{ send: init(v), await: true }] },
  ])),
  'lifecycle-basics': {
    env: { PINEPAPER_TOOLKIT: 'lane' },
    steps: [
      { send: init('2025-06-18'), await: true },
      { send: initialized },
      { send: { jsonrpc: '2.0', id: 2, method: 'ping' }, await: true },
      { send: { jsonrpc: '2.0', id: 3, method: 'tools/list' }, await: true },
      { send: { jsonrpc: '2.0', id: 4, method: 'prompts/list' }, await: true },
      { send: { jsonrpc: '2.0', id: 5, method: 'resources/list' }, await: true },
      { send: { jsonrpc: '2.0', id: 6, method: 'logging/setLevel', params: { level: 'warning' } }, await: true },
    ],
  },
  'errors': {
    env: { PINEPAPER_TOOLKIT: 'lane' },
    steps: [
      { send: init('2025-06-18'), await: true },
      { send: initialized },
      { send: { jsonrpc: '2.0', id: 2, method: 'no/such/method' }, await: true },
      { send: '{this is not json', settleMs: 400 },
      { send: { jsonrpc: '2.0', id: 3, method: 'ping' }, await: true },
      { send: { jsonrpc: '2.0', id: 4, method: 'resources/read', params: { uri: 'pinepaper://nope' } }, await: true },
      { send: { jsonrpc: '2.0', id: 5, method: 'tools/call', params: {} }, await: true },
      { send: { jsonrpc: '2.0', id: 6, method: 'prompts/get', params: { name: 'no-such-prompt' } }, await: true },
      { send: { jsonrpc: '2.0', id: 7, method: 'logging/setLevel', params: { level: 'loud' } }, await: true },
    ],
  },
  'tool-call-without-browser': {
    steps: [
      { send: init('2025-06-18'), await: true },
      { send: initialized },
      { send: { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'pinepaper_design_styles', arguments: {}, _meta: { progressToken: 'p1' } } }, await: true },
      { send: { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'pinepaper_no_such_tool', arguments: {} } }, await: true },
    ],
  },
  // LOAD ON DEMAND (1.6.25, recorded from this server: the SDK server had no such call). A client starts on core,
  // loads a group, is told the list changed, and the next tools/list carries it. Every client starts on core, so
  // a claude-ai initialize no longer changes the list by itself (it was profiled to `minimal` before).
  'load-on-demand': {
    steps: [
      { send: init('2025-06-18', 'claude-ai'), await: true },
      { send: initialized, settleMs: 300 },
      { send: { jsonrpc: '2.0', id: 2, method: 'tools/list' }, await: true },
      { send: { jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'pinepaper_set_toolkit', arguments: { load: ['map'] } } }, await: true, settleMs: 300 },
      { send: { jsonrpc: '2.0', id: 4, method: 'tools/list' }, await: true },
      { send: { jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'pinepaper_set_toolkit', arguments: { load: ['no_such_group'] } } }, await: true },
    ],
  },
  'before-initialize': {
    steps: [
      { send: { jsonrpc: '2.0', id: 1, method: 'ping' }, await: true },
      { send: { jsonrpc: '2.0', id: 2, method: 'prompts/list' }, await: true },
    ],
  },
};

describe('MCP wire, against the recordings', () => {
  for (const [name, s] of Object.entries(SESSIONS)) {
    it(name, async () => {
      const frames = await session(s.steps, s.env);
      const file = join(FIXTURES, `${name}.json`);
      if (UPDATE || !existsSync(file)) {
        mkdirSync(FIXTURES, { recursive: true });
        writeFileSync(file, JSON.stringify(frames, null, 2) + '\n');
        return;
      }
      expect(frames).toEqual(JSON.parse(readFileSync(file, 'utf8')));
    }, 60000);
  }
});
