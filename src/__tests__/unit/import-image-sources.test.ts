/**
 * "Failed to load image from URL" — and nothing else.
 *
 * A tester with ten downloaded photographs could not get one onto the canvas.
 * Two separate problems wore the same unhelpful face:
 *
 *  - A LOCAL PATH was rejected outright. A browser page cannot open file://, so
 *    the tool took URLs only and named no alternative — leaving an agent that
 *    had just downloaded its images with nothing to try. The SERVER can read
 *    the file, so it does, and hands the page data instead.
 *  - A REMOTE failure reported no reason. `uploadFromURL` sets img.src, and an
 *    <img> onerror genuinely carries no cause — that message is the browser's
 *    limit, not the engine's sloppiness. fetch() knows the cause, so the
 *    emitted code fetches first and reports the status, the refusal or the
 *    wrong content type.
 */
import { describe, it, expect } from 'bun:test';
import { writeFile, rm, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveImageSource } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('resolveImageSource', () => {
  it('passes a data URL straight through', async () => {
    expect(await resolveImageSource('data:image/png;base64,AAAA')).toEqual({ src: 'data:image/png;base64,AAAA' });
  });

  it('no longer hands an http URL to the page to fetch', async () => {
    // This test used to assert the opposite, on the reasoning that "the page
    // fetches these itself and reports its own reasons". It cannot:
    // pinepaper.studio's connect-src forbids a third-party fetch, so the page
    // reported only failure. Resolved in this process instead — see
    // node-side-image-fetch.test.ts for the fetch behaviour itself.
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async () => ({
      ok: true, status: 200, statusText: 'OK',
      headers: { get: () => 'image/png' },
      arrayBuffer: async () => new TextEncoder().encode('PNG').buffer,
    })) as never;
    try {
      const got = await resolveImageSource('https://example.test/a.png') as { src: string };
      expect(got.src).toStartWith('data:image/png;base64,');
      expect(got.src).not.toContain('example.test');
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it('reads a local file and hands back a data URL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pp-img-'));
    const file = join(dir, 'photo.png');
    await writeFile(file, PNG_1PX);
    try {
      const got = await resolveImageSource(file);
      expect('src' in got).toBe(true);
      if ('src' in got) {
        expect(got.src.startsWith('data:image/png;base64,')).toBe(true);
        // The bytes, not a description of them.
        expect(Buffer.from(got.src.split(',')[1], 'base64')).toEqual(PNG_1PX);
      }
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('accepts a file:// URL for the same file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'pp-img-'));
    const file = join(dir, 'photo.png');
    await writeFile(file, PNG_1PX);
    try {
      expect('src' in (await resolveImageSource(`file://${file}`))).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('names the actual reason a path did not work', async () => {
    const missing = await resolveImageSource('/tmp/definitely-not-here-9f2c.png');
    expect('error' in missing).toBe(true);
    if ('error' in missing) {
      // The OS reason, not a generic failure, plus the resolution rule.
      expect(missing.error).toContain('ENOENT');
      expect(missing.error).toContain('absolute path');
    }
  });

  it('refuses a non-image by listing what it does take', async () => {
    const wrong = await resolveImageSource('/tmp/notes.txt');
    expect('error' in wrong).toBe(true);
    if ('error' in wrong) expect(wrong.error).toContain('.png');
  });
});

describe('the emitted import reports WHY a remote image failed', () => {
  const code = () => codeGenerator.generateImportImage({ url: 'https://example.test/a.png' });

  it('fetches before handing the bytes to the engine', () => {
    expect(code()).toContain('await fetch(');
    // …and passes them on as data, so an <img> CORS refusal cannot bite twice.
    expect(code()).toContain('readAsDataURL');
  });

  it('distinguishes a refused connection, a bad status and a wrong type', () => {
    const c = code();
    expect(c).toContain('could not reach');
    expect(c).toContain('HTTP ');
    expect(c).toContain('res.status');
    expect(c).toContain('not an image');
  });

  it('does not re-fetch a data URL', () => {
    const c = codeGenerator.generateImportImage({ url: 'data:image/png;base64,AAAA' });
    expect(c).toContain("startsWith('data:')");
  });
});
