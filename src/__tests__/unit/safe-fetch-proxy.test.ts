/**
 * A name known only to a fake-IP DNS proxy is fetched through the operator's proxy, by name (IMPURL40).
 * Everything else the guard refuses stays refused with a proxy set.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { createServer, request, type Server } from 'node:http';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkUrl, proxyFor, safeFetch, safeFetchDeps, UnsafeUrlError } from '../../utils/safe-fetch.js';

const VARS = ['HTTPS_PROXY', 'https_proxy', 'HTTP_PROXY', 'http_proxy', 'ALL_PROXY', 'all_proxy', 'NO_PROXY', 'no_proxy', 'PINEPAPER_ALLOW_PRIVATE_NETWORK'];
const savedEnv: Record<string, string | undefined> = {};
const savedDeps = { ...safeFetchDeps };
beforeEach(() => { for (const k of VARS) { savedEnv[k] = process.env[k]; delete process.env[k]; } });
afterEach(() => {
  for (const k of VARS) { if (savedEnv[k] === undefined) delete process.env[k]; else process.env[k] = savedEnv[k]; }
  Object.assign(safeFetchDeps, savedDeps);
});
const fakeIp = async () => [{ address: '198.18.0.42', family: 4 as const }];

describe('proxyFor', () => {
  it('is null with nothing set', () => {
    expect(proxyFor(new URL('https://images.example.com/a.png'))).toBeNull();
  });
  it('reads HTTPS_PROXY for https and HTTP_PROXY for http, either case, ALL_PROXY last', () => {
    process.env.https_proxy = 'http://127.0.0.1:7890';
    process.env.ALL_PROXY = 'http://all:1';
    expect(proxyFor(new URL('https://a.example.com/'))?.host).toBe('127.0.0.1:7890');
    expect(proxyFor(new URL('http://a.example.com/'))?.host).toBe('all:1');
    process.env.HTTP_PROXY = 'proxy.corp:3128';
    expect(proxyFor(new URL('http://a.example.com/'))?.href).toBe('http://proxy.corp:3128/');
  });
  it('honours NO_PROXY: exact host, domain suffix, and *', () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    process.env.NO_PROXY = 'localhost, .internal.example.com ,other.test:8443';
    expect(proxyFor(new URL('https://a.internal.example.com/'))).toBeNull();
    expect(proxyFor(new URL('https://internal.example.com/'))).toBeNull();
    expect(proxyFor(new URL('https://other.test:8443/'))).toBeNull();
    expect(proxyFor(new URL('https://notinternal.example.com/'))?.port).toBe('7890');
    process.env.NO_PROXY = '*';
    expect(proxyFor(new URL('https://notinternal.example.com/'))).toBeNull();
  });
  it('does not use a proxy it cannot speak to (socks, https)', () => {
    process.env.HTTPS_PROXY = 'socks5://127.0.0.1:1080';
    expect(proxyFor(new URL('https://a.example.com/'))).toBeNull();
    process.env.HTTPS_PROXY = 'https://secure-proxy.example:443';
    expect(proxyFor(new URL('https://a.example.com/'))).toBeNull();
  });
});

describe('checkUrl with a proxy set', () => {
  it('a fake-IP name is allowed and marked for the proxy', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    safeFetchDeps.lookup = fakeIp;
    const checked = await checkUrl('https://images.example.com/a.png');
    expect(checked.viaProxy?.host).toBe('127.0.0.1:7890');
  });
  it('without a proxy the refusal names the variable to set', async () => {
    safeFetchDeps.lookup = fakeIp;
    const err = await checkUrl('https://images.example.com/a.png').then(() => null, (e) => e);
    expect(err).toBeInstanceOf(UnsafeUrlError);
    expect(String(err.message)).toContain('fake-IP DNS proxy');
    expect(String(err.message)).toContain('HTTPS_PROXY');
    expect(String(err.message)).not.toContain('does not use HTTPS_PROXY');
  });
  it('a NO_PROXY host is refused as before', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    process.env.NO_PROXY = 'example.com';
    safeFetchDeps.lookup = fakeIp;
    expect(await checkUrl('https://images.example.com/a.png').then(() => null, (e) => e)).toBeInstanceOf(UnsafeUrlError);
  });
  it('still refuses loopback, LAN and metadata names, and address literals', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    process.env.HTTP_PROXY = 'http://127.0.0.1:7890';
    for (const address of ['127.0.0.1', '10.0.0.5', '192.168.1.9', '169.254.169.254']) {
      safeFetchDeps.lookup = async () => [{ address, family: 4 }];
      expect(await checkUrl('https://name.example.com/').then(() => null, (e) => e)).toBeInstanceOf(UnsafeUrlError);
    }
    for (const literal of ['https://198.18.0.42/a.png', 'http://127.0.0.1/a.png', 'http://169.254.169.254/latest/']) {
      expect(await checkUrl(literal).then(() => null, (e) => e)).toBeInstanceOf(UnsafeUrlError);
    }
  });
  it('a name with one loopback address beside a fake-IP one is refused', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    safeFetchDeps.lookup = async () => [{ address: '198.18.0.42', family: 4 }, { address: '127.0.0.1', family: 4 }];
    expect(await checkUrl('https://mixed.example.com/').then(() => null, (e) => e)).toBeInstanceOf(UnsafeUrlError);
  });
  it('a public name is not sent to the proxy', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    safeFetchDeps.lookup = async () => [{ address: '93.184.216.34', family: 4 }];
    expect((await checkUrl('https://public.example.com/')).viaProxy).toBeUndefined();
  });
  it('a redirect from a proxied host to a loopback literal is refused', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:7890';
    safeFetchDeps.lookup = fakeIp;
    safeFetchDeps.request = async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1:8080/admin' } });
    const err = await safeFetch('https://images.example.com/a.png').then(() => null, (e) => e);
    expect(err).toBeInstanceOf(UnsafeUrlError);
    expect(String(err.message)).toContain('127.0.0.1');
  });
});

describe('the proxied transport (node)', () => {
  const node = spawnSync('node', ['-e', 'process.stdout.write(process.versions.node)'], { encoding: 'utf8' });
  const major = Number((node.stdout || '0').split('.')[0]);
  let origin: Server;
  let proxy: Server;
  const seen: string[] = [];
  beforeAll(async () => {
    origin = createServer((req, res) => { res.setHeader('x-host', String(req.headers.host)); res.end(`ORIGIN:${req.url}`); });
    await new Promise<void>((r) => origin.listen(0, '127.0.0.1', () => r()));
    proxy = createServer((req, res) => {
      seen.push(`${req.method} ${req.url}`);
      const u = new URL(String(req.url));
      const up = request({ host: '127.0.0.1', port: (origin.address() as { port: number }).port, path: u.pathname + u.search, headers: { host: String(req.headers.host) } }, (x) => { res.writeHead(x.statusCode || 502, x.headers); x.pipe(res); });
      up.end();
    });
    proxy.on('connect', (req, socket) => { seen.push(`CONNECT ${req.url}`); socket.end('HTTP/1.1 403 Forbidden\r\n\r\n'); });
    await new Promise<void>((r) => proxy.listen(0, '127.0.0.1', () => r()));
  });
  afterAll(() => { origin.close(); proxy.close(); });

  it.skipIf(node.status !== 0 || major < 22)('http goes to the proxy as an absolute URL; https asks for a CONNECT tunnel by name and reports a refusal', () => {
    const mod = pathToFileURL(resolve(__dirname, '../../utils/safe-fetch.ts')).href;
    const p = `http://127.0.0.1:${(proxy.address() as { port: number }).port}`;
    const script = `
      const { safeFetch, safeFetchDeps } = await import(${JSON.stringify(mod)});
      safeFetchDeps.lookup = async () => [{ address: '198.18.0.7', family: 4 }];
      process.env.HTTP_PROXY = ${JSON.stringify(p)}; process.env.HTTPS_PROXY = ${JSON.stringify(p)};
      delete process.env.NO_PROXY; delete process.env.no_proxy;
      const a = await safeFetch('http://img.example.test/p.png?x=1');
      const b = await safeFetch('https://img.example.test/a.png').then(() => 'fetched', (e) => String(e.message));
      process.stdout.write(JSON.stringify({ status: a.status, body: await a.text(), host: a.headers.get('x-host'), b }));
    `;
    const run = Bun.spawn(['node', '--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', script], { stdout: 'pipe', stderr: 'pipe' });
    return Promise.all([new Response(run.stdout).text(), new Response(run.stderr).text(), run.exited]).then(([out, err]) => {
      expect(err).toBe('');
      const r = JSON.parse(out);
      expect(r).toMatchObject({ status: 200, body: 'ORIGIN:/p.png?x=1', host: 'img.example.test' });
      expect(r.b).toContain('refused a tunnel to img.example.test:443 (403 Forbidden)');
      expect(seen).toEqual(['GET http://img.example.test/p.png?x=1', 'CONNECT img.example.test:443']);
    });
  });
});
