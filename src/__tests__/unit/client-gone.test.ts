/**
 * The server ends when its client does.
 *
 * Stdin closing is how a stdio client says goodbye, and all a crashed one leaves behind. Nothing listened for it, so a
 * client that died left this process and its Chrome running with nobody to talk to: measured alive at 30 s, for good.
 *
 * A piped one-shot closes stdin straight after its request, so a call already running gets a bounded chance to answer.
 */
import { describe, it, expect } from 'bun:test';
import { PassThrough } from 'node:stream';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { Server, StdioServerTransport } from '../../mcp/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '../../mcp/index.js';
import { exitWhenClientGone } from '../../utils/exit-when-client-gone.js';

const ROOT = join(import.meta.dir, '..', '..', '..');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const rpc = (id: number, method: string, params: unknown = {}) => JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
const INIT = { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } };

function wired(drainMs: number, toolMs: number) {
  const stdin = new PassThrough(), stdout = new PassThrough();
  const server = new Server({ name: 't', version: '1' }, { capabilities: { tools: {} }, drainMs });
  const aborted: boolean[] = [];
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [] }));
  server.setRequestHandler(CallToolRequestSchema, async (_r, extra) => {
    await sleep(toolMs);
    aborted.push(extra.signal.aborted);
    return { content: [{ type: 'text', text: 'answered' }] };
  });
  let closed = 0;
  server.onclose = () => { closed++; };
  let out = '';
  stdout.on('data', (d) => { out += d; });
  return { stdin, stdout, server, aborted, closed: () => closed, out: () => out,
    start: () => server.connect(new StdioServerTransport(stdin, stdout)) };
}

describe('stdin closing ends the session', () => {
  it('with nothing running, closes at once', async () => {
    const w = wired(5000, 0);
    await w.start();
    w.stdin.end();
    await sleep(20);
    expect(w.closed()).toBe(1);
  });

  it('a call already running answers first', async () => {
    const w = wired(1000, 50);
    await w.start();
    w.stdin.write(rpc(1, 'tools/call', { name: 'x', arguments: {} }));
    await sleep(5);
    w.stdin.end();
    await sleep(10);
    expect(w.closed()).toBe(0);
    await sleep(80);
    expect(w.out()).toContain('answered');
    expect(w.closed()).toBe(1);
    expect(w.aborted).toEqual([false]);
  });

  it('a call that outlasts the wait is aborted, so an export stops rather than running for nobody', async () => {
    const w = wired(30, 120);
    await w.start();
    w.stdin.write(rpc(1, 'tools/call', { name: 'x', arguments: {} }));
    await sleep(5);
    w.stdin.end();
    await sleep(60);
    expect(w.closed()).toBe(1);
    await sleep(100);
    expect(w.aborted).toEqual([true]);
  });

  it('closes once when stdin both ends and closes', async () => {
    const w = wired(1000, 0);
    await w.start();
    w.stdin.end();
    w.stdin.destroy();
    await sleep(20);
    expect(w.closed()).toBe(1);
  });

  it('a stdout that has gone away is reported, not thrown', async () => {
    const w = wired(1000, 0);
    const errors: Error[] = [];
    w.server.onerror = (e: Error) => errors.push(e);
    await w.start();
    w.stdout.emit('error', Object.assign(new Error('EPIPE'), { code: 'EPIPE' }));
    expect(errors.map((e) => e.message)).toEqual(['EPIPE']);
  });
});

describe('exitWhenClientGone', () => {
  const run = (closeBrowser: () => Promise<unknown>) => {
    const server: { onclose?: () => void } = {};
    const exits: number[] = [];
    exitWhenClientGone(server, { closeBrowser, exit: ((c: number) => { exits.push(c); }) as never, timeoutMs: 40 });
    return { fire: () => server.onclose!(), exits };
  };

  it('closes the browser, then exits 0', async () => {
    const order: string[] = [];
    const r = run(async () => { await sleep(5); order.push('browser'); });
    r.fire();
    expect(r.exits).toEqual([]);
    await sleep(25);
    expect(order).toEqual(['browser']);
    expect(r.exits).toEqual([0]);
  });

  it('a browser that will not close does not hold the process', async () => {
    const r = run(() => new Promise(() => {}));
    r.fire();
    await sleep(70);
    expect(r.exits).toEqual([0]);
  });

  it('a browser that fails to close still exits', async () => {
    const r = run(() => Promise.reject(new Error('gone')));
    r.fire();
    await sleep(25);
    expect(r.exits).toEqual([0]);
  });

  it('exits once', async () => {
    const r = run(async () => {});
    r.fire(); r.fire();
    await sleep(70);
    expect(r.exits).toEqual([0]);
  });
});

describe('the real process', () => {
  const launch = (entry: string) => spawn('bun', [entry], { cwd: ROOT, env: { ...process.env, PINEPAPER_EXECUTION_MODE: 'code' }, stdio: ['pipe', 'pipe', 'ignore'] });
  const exited = (c: ReturnType<typeof spawn>, ms: number) => new Promise<number | null | 'still running'>((res) => {
    const t = setTimeout(() => { c.kill('SIGKILL'); res('still running'); }, ms);
    c.on('exit', (code) => { clearTimeout(t); res(code); });
  });

  for (const entry of ['src/cli.ts', 'src/index.ts']) {
    it(`${entry} exits when stdin closes`, async () => {
      const c = launch(entry);
      let out = '';
      c.stdout!.on('data', (d) => { out += d; });
      c.stdin!.write(rpc(1, 'initialize', INIT));
      for (let i = 0; i < 100 && !out.includes('"id":1'); i++) await sleep(50);
      expect(out).toContain('"id":1');
      c.stdin!.end();
      expect(await exited(c, 8000)).toBe(0);
    }, 20000);
  }

  it('a piped one-shot still gets its reply', async () => {
    const c = launch('src/cli.ts');
    let out = '';
    c.stdout!.on('data', (d) => { out += d; });
    c.stdin!.end(rpc(1, 'initialize', INIT) + rpc(2, 'tools/list'));
    expect(await exited(c, 10000)).toBe(0);
    expect(out).toContain('"id":2');
  }, 20000);
});
