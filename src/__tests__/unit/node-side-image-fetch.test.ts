/**
 * The page cannot fetch a third-party image. This process can.
 *
 * pinepaper.studio serves `connect-src 'self' https://cloud.pinepaper.studio`,
 * so an in-page fetch() of any other host fails outright. `img-src` still
 * allows https:, which is why the OLD path could load a remote image — and
 * tainted the canvas doing it. Replacing that load with a fetch made it safe
 * and, under this CSP, impossible: import by URL went from
 * broken-and-dangerous to simply unable to succeed.
 *
 * Fetching in the MCP server and handing the page a data: URL is the only
 * shape that both works and cannot taint.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { resolveImageSource, fetchImageAsDataUrl } from '../../tools/handlers.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const stub = (r: Partial<Response> & { body?: string }): void => {
  globalThis.fetch = (async () => ({
    ok: r.ok ?? true,
    status: r.status ?? 200,
    statusText: r.statusText ?? 'OK',
    headers: { get: (k: string) => (k.toLowerCase() === 'content-type' ? (r as never as Record<string, string>).ctype ?? 'image/png' : null) },
    arrayBuffer: async () => new TextEncoder().encode(r.body ?? 'PNGDATA').buffer,
  })) as never;
};

describe('a remote image is fetched server-side', () => {
  it('turns an http URL into a data: URL', async () => {
    stub({ body: 'PNGDATA' });
    const got = await resolveImageSource('https://cdn.example/a.png');
    expect(got).toHaveProperty('src');
    expect((got as { src: string }).src).toStartWith('data:image/png;base64,');
  });

  it('no longer hands the raw URL to the page', async () => {
    // The whole bug: this used to return the URL unchanged for the browser to
    // fetch, which CSP forbids.
    stub({ body: 'X' });
    const got = await resolveImageSource('https://cdn.example/a.png') as { src: string };
    expect(got.src).not.toContain('cdn.example');
  });

  it('leaves a data: URL alone', async () => {
    const d = 'data:image/png;base64,AAAA';
    expect(await resolveImageSource(d)).toEqual({ src: d });
  });

  it('refuses a URL that serves a page instead of an image', async () => {
    stub({ ctype: 'text/html' } as never);
    const got = await fetchImageAsDataUrl('https://example.com/photo');
    expect(got).toHaveProperty('error');
    expect((got as { error: string }).error).toContain('not an image');
  });

  it('names an HTTP refusal rather than returning a broken src', async () => {
    stub({ ok: false, status: 404, statusText: 'Not Found' });
    const got = await fetchImageAsDataUrl('https://cdn.example/missing.png');
    expect((got as { error: string }).error).toContain('404');
  });

  it('says the failure is not a CSP problem when the fetch itself dies', async () => {
    globalThis.fetch = (async () => { throw new Error('getaddrinfo ENOTFOUND'); }) as never;
    const got = await fetchImageAsDataUrl('https://nope.invalid/a.png');
    expect((got as { error: string }).error).toContain('not a CSP problem');
  });
});
