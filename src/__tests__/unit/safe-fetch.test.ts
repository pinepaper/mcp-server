/**
 * Server-side fetches refuse private addresses (CWE-918); local reads stay
 * inside the allowed folders (CWE-22).
 *
 * Every refusal here was a success before: the server fetched whatever URL a
 * tool call named, including the machine's own loopback services and a cloud
 * host's metadata endpoint, and read any image- or media-named file on disk.
 *
 * A real HTTP server on 127.0.0.1 stands in for "something only this machine
 * can reach". DNS for public-looking names is mocked through safeFetchDeps.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { handleToolCall, resolveImageSource, resolveMediaSource } from '../../tools/handlers.js';
import { safeFetch, safeFetchDeps, classifyAddress, UnsafeUrlError } from '../../utils/safe-fetch.js';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
const WAV = Buffer.from('RIFF0000WAVE', 'ascii');

let server: Server;
let base = '';
const hits: string[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    hits.push(req.url ?? '');
    if (req.url === '/img.png') { res.writeHead(200, { 'content-type': 'image/png' }); res.end(PNG_1PX); return; }
    if (req.url === '/beat.wav') { res.writeHead(200, { 'content-type': 'audio/wav' }); res.end(WAV); return; }
    if (req.url === '/hop') { res.writeHead(302, { location: '/img.png' }); res.end(); return; }
    res.writeHead(404); res.end();
  });
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
});
afterAll(() => { server.close(); });

const savedDeps = { ...safeFetchDeps };
afterEach(() => {
  Object.assign(safeFetchDeps, savedDeps);
  delete process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK;
  delete process.env.PINEPAPER_ASSET_DIRS;
  hits.length = 0;
});

/**
 * "https://cdn.public.test/…" resolves to a public address, and answers with a
 * 302 to `target`. Every other host goes through the real transport.
 */
function publicNameRedirectingTo(target: string): void {
  safeFetchDeps.lookup = async (host) => (host === 'cdn.public.test'
    ? [{ address: '93.184.216.34', family: 4 }]
    : savedDeps.lookup(host));
  safeFetchDeps.request = async (url, addresses, init) => (url.hostname === 'cdn.public.test'
    ? new Response(null, { status: 302, headers: { location: target } })
    : savedDeps.request(url, addresses, init));
}

const code = { executionMode: 'code' as const, executeInBrowser: false };
const text = (r: { content?: Array<{ type: string; text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');

describe('pinepaper_import_image refuses private addresses', () => {
  it('refuses a loopback URL, without connecting', async () => {
    const r = await handleToolCall('pinepaper_import_image', { url: `${base}/img.png` }, code);
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('127.0.0.1, a private address');
    expect(text(r)).toContain('PINEPAPER_ALLOW_PRIVATE_NETWORK=1');
    expect(hits).toEqual([]);
  });

  it('refuses a public name that redirects to loopback', async () => {
    publicNameRedirectingTo(`${base}/img.png`);
    const r = await handleToolCall('pinepaper_import_image', { url: 'https://cdn.public.test/a.png' }, code);
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('private address');
    expect(hits).toEqual([]);
  });

  it('refuses a name that RESOLVES to loopback', async () => {
    safeFetchDeps.lookup = async () => [{ address: '127.0.0.1', family: 4 }];
    const got = await resolveImageSource('http://rebind.public.test/a.png');
    expect('error' in got && got.error).toContain('private address');
  });

  it('allows both with PINEPAPER_ALLOW_PRIVATE_NETWORK=1', async () => {
    process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK = '1';
    const direct = await resolveImageSource(`${base}/img.png`);
    expect('src' in direct && Buffer.from(direct.src.split(',')[1], 'base64')).toEqual(PNG_1PX);
    publicNameRedirectingTo(`${base}/img.png`);
    const viaRedirect = await resolveImageSource('https://cdn.public.test/a.png');
    expect('src' in viaRedirect).toBe(true);
    // A relative Location is resolved against the hop that sent it.
    const relative = await resolveImageSource(`${base}/hop`);
    expect('src' in relative).toBe(true);
  });

  it('still refuses cloud metadata with the opt-in, in every spelling', async () => {
    process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK = '1';
    for (const url of [
      'http://169.254.169.254/latest/meta-data/',
      'http://[::ffff:169.254.169.254]/latest/meta-data/',
      'http://[fd00:ec2::254]/',
    ]) {
      const got = await resolveImageSource(url);
      expect('error' in got && got.error).toContain('cloud metadata address');
    }
    publicNameRedirectingTo('http://169.254.169.254/latest/meta-data/');
    const got = await resolveImageSource('https://cdn.public.test/a.png');
    expect('error' in got && got.error).toContain('cloud metadata address');
  });

  it('stops after five redirects', async () => {
    safeFetchDeps.lookup = async () => [{ address: '93.184.216.34', family: 4 }];
    safeFetchDeps.request = async (url) => new Response(null, { status: 302, headers: { location: `${url.href}x` } });
    await expect(safeFetch('https://loop.public.test/')).rejects.toBeInstanceOf(UnsafeUrlError);
  });

  it('refuses non-http schemes', async () => {
    await expect(safeFetch('ftp://example.com/a.png')).rejects.toBeInstanceOf(UnsafeUrlError);
  });
});

describe('address classes', () => {
  it('blocks loopback, private, link-local, CGNAT, reserved and their IPv6 forms', () => {
    for (const a of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '192.168.1.1', '169.254.1.1', '100.64.0.1', '0.0.0.0',
      '224.0.0.1', '255.255.255.255', '::1', '::', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1', '::ffff:7f00:1',
      '64:ff9b::7f00:1', '64:ff9b:1::808:808', '2002:7f00:1::1', '::ffff:10.0.0.1']) {
      expect([a, classifyAddress(a)]).toEqual([a, 'private']);
    }
  });

  it('passes public addresses', () => {
    for (const a of ['93.184.216.34', '8.8.8.8', '2606:4700::1111', '::ffff:8.8.8.8', '64:ff9b::808:808']) {
      expect([a, classifyAddress(a)]).toEqual([a, null]);
    }
  });
});

describe('pinepaper_import_svg drops an <image> that points at a private address', () => {
  it('removes it and says why', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><image href="${base}/img.png" width="10" height="10"/><rect width="5" height="5"/></svg>`;
    const r = await handleToolCall('pinepaper_import_svg', { svgString: svg }, code);
    const t = text(r);
    // The document the page receives has no <image> left, and was never fed the bytes.
    const doc = t.match(/let svgString = `([^`]*)`/)?.[1] ?? '';
    expect(doc).toContain('<rect');
    expect(doc).not.toContain('<image');
    expect(t).not.toContain(PNG_1PX.toString('base64'));
    expect(t).toContain('private address');
    expect(hits).toEqual([]);
  });

  it('refuses an svg url on a private address', async () => {
    const r = await handleToolCall('pinepaper_import_svg', { url: `${base}/x.svg` }, code);
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('private address');
  });
});

describe('media sources follow the same rules', () => {
  it('refuses loopback directly and through a redirect', async () => {
    const direct = await resolveMediaSource(`${base}/beat.wav`);
    expect('error' in direct && direct.error).toContain('private address');
    publicNameRedirectingTo(`${base}/beat.wav`);
    const viaRedirect = await resolveMediaSource('https://cdn.public.test/beat.wav');
    expect('error' in viaRedirect && viaRedirect.error).toContain('private address');
    expect(hits).toEqual([]);
  });

  it('allows them with the opt-in', async () => {
    process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK = '1';
    expect(await resolveMediaSource(`${base}/beat.wav`)).toEqual({ src: `data:audio/wav;base64,${WAV.toString('base64')}` });
  });
});

describe('local reads stay inside cwd, the export folder and PINEPAPER_ASSET_DIRS', () => {
  let outside = '';
  let marker = '';
  beforeAll(() => {
    outside = mkdtempSync(join(tmpdir(), 'pp-outside-'));
    marker = join(outside, 'marker.png');
    writeFileSync(marker, PNG_1PX);
    writeFileSync(join(outside, 'marker.wav'), WAV);
  });
  afterAll(() => { rmSync(outside, { recursive: true, force: true }); });

  it('refuses a file outside, as a path and as a file:// URL', async () => {
    for (const p of [marker, pathToFileURL(marker).href]) {
      const got = await resolveImageSource(p);
      expect('error' in got && got.error).toContain('outside the allowed folders');
      expect('error' in got && got.error).toContain('PINEPAPER_ASSET_DIRS');
    }
    const media = await resolveMediaSource(join(outside, 'marker.wav'));
    expect('error' in media && media.error).toContain('outside the allowed folders');
  });

  it('answers the same for a missing file outside, so it cannot probe the disk', async () => {
    const got = await resolveImageSource(join(outside, 'not-there.png'));
    expect('error' in got && got.error).toContain('outside the allowed folders');
    expect('error' in got && got.error).not.toContain('ENOENT');
  });

  it('allows it once its folder is in PINEPAPER_ASSET_DIRS', async () => {
    process.env.PINEPAPER_ASSET_DIRS = ['/nonexistent-pp-dir', outside].join(process.platform === 'win32' ? ';' : ':');
    const got = await resolveImageSource(marker);
    expect('src' in got).toBe(true);
    expect('src' in (await resolveMediaSource(join(outside, 'marker.wav')))).toBe(true);
  });

  it('refuses a symlink inside cwd that points outside', async () => {
    const inside = mkdtempSync(join(tmpdir(), 'pp-cwd-'));
    const link = join(inside, 'innocent.png');
    symlinkSync(marker, link);
    const cwd = process.cwd();
    process.chdir(inside);
    try {
      const got = await resolveImageSource('innocent.png');
      expect('error' in got && got.error).toContain('outside the allowed folders');
      // A real file in the same cwd is fine.
      writeFileSync(join(inside, 'real.png'), PNG_1PX);
      expect('src' in (await resolveImageSource('real.png'))).toBe(true);
    } finally {
      process.chdir(cwd);
      rmSync(inside, { recursive: true, force: true });
    }
  });

  it('pinepaper_import_scene: refuses outside, answers the same whether the file exists, restores from the export folder', async () => {
    const doc = JSON.stringify({ kind: 'pinepaper.project', formatVersion: '1', items: [] });
    const big = join(outside, 'scene.json');
    writeFileSync(big, doc);
    const msg = async (path: string) => text(await handleToolCall('pinepaper_import_scene', { path }, code));
    const present = await msg(big);
    const absent = await msg(join(outside, 'no-such-scene.json'));
    for (const t of [present, absent]) {
      expect(t).toContain('outside the allowed folders');
      expect(t).not.toMatch(/ENOENT|MB, over/);
    }
    expect(await msg(pathToFileURL(big).href)).toContain('outside the allowed folders');

    // export_scene writes to the export folder and hands back a restore call for it.
    const exportDir = mkdtempSync(join(tmpdir(), 'pp-exports-'));
    const saved = process.env.PINEPAPER_EXPORT_DIR;
    process.env.PINEPAPER_EXPORT_DIR = exportDir;
    try {
      writeFileSync(join(exportDir, 'project.json'), doc);
      const r = await handleToolCall('pinepaper_import_scene', { path: join(exportDir, 'project.json') }, code);
      expect(r.isError).toBeFalsy();
    } finally {
      if (saved === undefined) delete process.env.PINEPAPER_EXPORT_DIR; else process.env.PINEPAPER_EXPORT_DIR = saved;
      rmSync(exportDir, { recursive: true, force: true });
    }
    process.env.PINEPAPER_ASSET_DIRS = outside;
    expect((await handleToolCall('pinepaper_import_scene', { path: big }, code)).isError).toBeFalsy();
  });

  it('a sibling folder sharing a prefix is not inside', async () => {
    const parent = mkdtempSync(join(tmpdir(), 'pp-prefix-'));
    const allowed = join(parent, 'assets');
    const sibling = join(parent, 'assets-evil');
    for (const d of [allowed, sibling]) mkdirSync(d);
    writeFileSync(join(sibling, 'x.png'), PNG_1PX);
    process.env.PINEPAPER_ASSET_DIRS = allowed;
    try {
      const got = await resolveImageSource(join(sibling, 'x.png'));
      expect('error' in got && got.error).toContain('outside the allowed folders');
    } finally {
      rmSync(parent, { recursive: true, force: true });
    }
  });
});

/**
 * Pinning can only be shown under node: bun's undici shim ignores
 * connect.lookup. "pinned.invalid" resolves nowhere in real DNS, so reaching
 * the local server proves the socket went to the address that was CHECKED,
 * not to a second lookup an attacker's DNS could answer differently.
 */
describe('the connection is pinned to the checked address (node)', () => {
  const node = spawnSync('node', ['-e', 'process.stdout.write(process.versions.node)'], { encoding: 'utf8' });
  const major = Number((node.stdout || '0').split('.')[0]);
  it.skipIf(node.status !== 0 || major < 22)('connects to the address the lookup returned', () => {
    const port = (server.address() as { port: number }).port;
    const mod = pathToFileURL(resolve(__dirname, '../../utils/safe-fetch.ts')).href;
    const script = `
      const { safeFetch, safeFetchDeps } = await import(${JSON.stringify(mod)});
      safeFetchDeps.lookup = async () => [{ address: '127.0.0.1', family: 4 }];
      process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK = '1';
      const res = await safeFetch('http://pinned.invalid:${port}/img.png');
      process.stdout.write(String(res.status) + ' ' + (await res.arrayBuffer()).byteLength);
    `;
    // The server runs in this process; let it answer while node waits.
    const run = Bun.spawn(['node', '--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', script], { stdout: 'pipe', stderr: 'pipe' });
    return Promise.all([new Response(run.stdout).text(), new Response(run.stderr).text(), run.exited]).then(([out, err]) => {
      expect(err).toBe('');
      expect(out).toBe(`200 ${PNG_1PX.length}`);
    });
  });
});

/**
 * The transport is node:http itself (1.6.29, undici removed): a POST body and its headers go out, response headers
 * come back (repeated ones kept), and a redirect is followed and re-checked. Run under node, like the pinning test.
 */
describe('the node transport carries bodies, headers and redirects (node)', () => {
  const node = spawnSync('node', ['-e', 'process.stdout.write(process.versions.node)'], { encoding: 'utf8' });
  const major = Number((node.stdout || '0').split('.')[0]);
  let echo: Server;
  beforeAll(async () => {
    echo = createServer((req, res) => {
      if (req.url === '/hop') { res.writeHead(302, { location: '/echo' }); res.end(); return; }
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        res.setHeader('set-cookie', ['a=1', 'b=2']);
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ method: req.method, auth: req.headers.authorization ?? null, body: Buffer.concat(chunks).toString() }));
      });
    });
    await new Promise<void>((r) => echo.listen(0, '127.0.0.1', () => r()));
  });
  afterAll(() => { echo.close(); });
  it.skipIf(node.status !== 0 || major < 22)('POSTs, reads headers back, and follows a redirect (safeFetch and trustedFetch)', () => {
    const port = (echo.address() as { port: number }).port;
    const mod = pathToFileURL(resolve(__dirname, '../../utils/safe-fetch.ts')).href;
    const script = `
      const { safeFetch, trustedFetch, safeFetchDeps } = await import(${JSON.stringify(mod)});
      safeFetchDeps.lookup = async () => [{ address: '127.0.0.1', family: 4 }];
      process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK = '1';
      const a = await trustedFetch('http://127.0.0.1:${port}/echo', { method: 'POST', headers: { Authorization: 'Bearer k', 'content-type': 'application/json' }, body: JSON.stringify({ x: 1 }) });
      const b = await safeFetch('http://pinned.invalid:${port}/hop');
      const out = { a: await a.json(), cookies: a.headers.get('set-cookie'), b: b.status, bBody: await b.json() };
      process.stdout.write(JSON.stringify(out));
    `;
    const run = Bun.spawn(['node', '--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', script], { stdout: 'pipe', stderr: 'pipe' });
    return Promise.all([new Response(run.stdout).text(), new Response(run.stderr).text(), run.exited]).then(([out, err]) => {
      expect(err).toBe('');
      const r = JSON.parse(out);
      expect(r.a).toEqual({ method: 'POST', auth: 'Bearer k', body: '{"x":1}' });
      expect(r.cookies).toBe('a=1, b=2');
      expect(r.b).toBe(200);
      expect(r.bBody.method).toBe('GET');
    });
  });
});
