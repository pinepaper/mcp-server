/**
 * Upload media is fetched / read by the SERVER (round 6 retest, 1.45): the
 * page's CSP refuses fetch() of third-party hosts, so a working https audio
 * URL failed "Failed to fetch" on production.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { resolveMediaSource } from '../../tools/handlers.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function serve(body: Uint8Array, type: string | null, status = 200) {
  const seen: RequestInit[] = [];
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    seen.push(init);
    return new Response(body, { status, headers: type ? { 'content-type': type } : {} });
  }) as typeof fetch;
  return seen;
}

describe('resolveMediaSource', () => {
  it('fetches https audio into a data: URL, sending a User-Agent', async () => {
    const seen = serve(new Uint8Array([79, 103, 103, 83]), 'application/ogg');
    const r = await resolveMediaSource('https://upload.wikimedia.org/x/Example.ogg');
    expect(r).toEqual({ src: 'data:audio/ogg;base64,T2dnUw==' });
    expect((seen[0]!.headers as Record<string, string>)['User-Agent']).toContain('PinePaper');
  });

  it('a generic binary type is read from the extension', async () => {
    serve(new Uint8Array([1]), 'application/octet-stream');
    expect(await resolveMediaSource('https://cdn.x/bed.mp3')).toEqual({ src: 'data:audio/mpeg;base64,AQ==' });
  });

  it('an HTML page around the file is refused by name', async () => {
    serve(new Uint8Array([60]), 'text/html');
    const r = await resolveMediaSource('https://x/page');
    expect('error' in r && r.error).toContain('not audio or video');
  });

  it('an HTTP failure names the status', async () => {
    serve(new Uint8Array(), 'audio/mpeg', 403);
    const r = await resolveMediaSource('https://x/a.mp3');
    expect('error' in r && r.error).toContain('HTTP 403');
  });

  it('reads a local audio file, and passes data: through', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'ppm-'));
    const f = join(dir, 'vo.wav');
    writeFileSync(f, Buffer.from([82, 73, 70, 70]));
    expect(await resolveMediaSource(f)).toEqual({ src: 'data:audio/wav;base64,UklGRg==' });
    expect(await resolveMediaSource('data:audio/wav;base64,AA==')).toEqual({ src: 'data:audio/wav;base64,AA==' });
  });
});

describe('detect_objects names a blocked model download (1.36)', () => {
  it('translates "Failed to fetch (huggingface.co)" and leaves other errors alone', async () => {
    const { codeGenerator } = await import('../../types/code-generator.js');
    const code = codeGenerator.generateDetectObjects({ itemId: 'item_1' } as never);
    const run = (err: string) => new Function('app', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)(
      { detectObjects: async () => { throw new Error(err); } });
    const blocked = await run('Failed to fetch (huggingface.co)');
    expect(blocked.error).toContain('content-security policy');
    expect(blocked.error).toContain('retrying will not help');
    expect((await run('Item is not a raster')).error).toBe('Item is not a raster');
  });
});
