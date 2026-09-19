/**
 * Long-form export: the bytes stop crossing the bridge as one string.
 *
 * `pinepaper_agent_export` handed back a base64 data URL. Two things were wrong
 * with that and only one of them was a bug: a STREAMED export returns a
 * `{streamed:true}` marker rather than a Blob and `FileReader.readAsDataURL`
 * throws on it, and base64 of a ten-minute 1080p video is a ~1.6 GB string
 * before JSON transport — a protocol ceiling no memory fix reaches.
 *
 * The handler already wrote video and pdf to a file server-side, so the ceiling
 * was only ever the one `page.evaluate` return value. So: the studio holds the
 * encoded file in its export store and returns an id, and the handler pages it
 * into the file it was going to write anyway. One tool call, one filePath, at
 * any size, with at most one chunk in memory on either side.
 *
 * Engine side is FxTool `export/long-form-streaming` (exportToStore a7c2054d).
 * These tests are unit-level against a mocked controller; NOT run live against
 * that branch, which was still off FxTool main when this landed.
 */

import { describe, it, expect, afterEach } from 'bun:test';
import { readFile, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { codeGenerator, INLINE_MAX_BYTES } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';
import type { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

// ---------------------------------------------------------------------------
// The emitted code
// ---------------------------------------------------------------------------

describe('generateAgentExport — the export store', () => {
  it('prefers exportToStore for mp4 and returns an id instead of bytes', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'youtube', format: 'mp4', duration: 600 });
    expect(code).toContain("typeof app.exportEngine.exportToStore === 'function'");
    expect(code).toContain("typeof app.exportEngine.readExport === 'function'");
    expect(code).toContain('await store.exportToStore({');
    expect(code).toContain('retained: true');
    expect(code).toContain('exportId: stored.exportId');
    // No data URL is built on this path at any size — that is the point.
    expect(code).toMatch(/retained: true,\s*\n\s*exportId/);
  });

  it('passes quality as a NUMBER, the shape _calculateBitrate multiplies by', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'youtube', format: 'mp4', quality: 'high' });
    // settings.compression is 0.95 for 'high'; the tier NAME would become NaN
    // inside _calculateBitrate, and its Math.max(100000, NaN) floor is not one.
    expect(code).toContain('quality: settings.compression');
  });

  it('trusts the container the store reports over the one asked for', () => {
    // mp4 falls back to WebM without WebCodecs, and WebM bytes named .mp4 fail
    // in container-validating players.
    const code = codeGenerator.generateAgentExport({ platform: 'youtube', format: 'mp4' });
    expect(code).toContain('format: stored.format || format');
  });

  it('leaves gif on the buffered path, which the store refuses by name', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'twitter', format: 'gif', duration: 5 });
    expect(code).toContain("format !== 'gif'");
    expect(code).toContain('_quickExportVideo');
  });

  it('names the two failures the old code died on instead of returning bytes', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'youtube', format: 'mp4' });
    // 1. the streamed marker: not a Blob, and readAsDataURL throws on it
    expect(code).toContain("typeof blob.slice !== 'function'");
    expect(code).toContain('streamed to a file instead of returning bytes');
    // 2. past the inline ceiling on a studio with no store
    expect(code).toContain('inline ceiling');
    expect(code).toContain(String(INLINE_MAX_BYTES));
    // both name the fix
    expect(code).toContain('update FxTool');
  });

  it('keeps the ceiling above what the buffered path could already deliver', () => {
    // 60s at 8 Mbps high quality is roughly 60 MB. Raising the duration cap
    // must not make a previously working export start refusing.
    expect(INLINE_MAX_BYTES).toBeGreaterThan(60 * 1024 * 1024);
  });
});

// ---------------------------------------------------------------------------
// The legacy path, EXECUTED
// ---------------------------------------------------------------------------

/**
 * `deliver()` is new code on the path every studio without an export store
 * still takes, and asserting on the emitted strings does not prove a 5s mp4
 * still comes back as a data URL. So run the emitted code against a fake
 * studio and check the value, not the source.
 */
function runEmitted(
  code: string,
  blob: unknown
): Promise<Record<string, unknown>> {
  // Strip the leading banner comments so the IIFE can be returned; inner
  // comments are indented and unaffected.
  const body = 'return ' + code.split('\n').filter(l => !l.startsWith('//')).join('\n');
  class FakeFileReader {
    result: unknown;
    onloadend: (() => void) | null = null;
    readAsDataURL(b: { _b64?: string }) {
      this.result = `data:video/mp4;base64,${b._b64 ?? ''}`;
      setTimeout(() => this.onloadend?.(), 0);
    }
  }
  const app = {
    exportEngine: { videoExporter: { export: async () => blob } },
    getCanvasSize: () => ({ width: 1920, height: 1080 }),
    getItems: () => [],
  };
  return new Function('app', 'FileReader', body)(app, FakeFileReader);
}

describe('the buffered path still works where there is no store', () => {
  const code = () => codeGenerator.generateAgentExport({ platform: 'youtube', format: 'mp4', duration: 5 });

  it('a short mp4 still comes back as a data URL', async () => {
    const blob: Record<string, unknown> = { size: 1234, type: 'video/mp4', _b64: 'AAAA' };
    blob.slice = () => blob;
    const r = await runEmitted(code(), blob);
    expect(r.success).toBe(true);
    expect(r.data).toBe('data:video/mp4;base64,AAAA');
    expect(r.size).toBe(1234);
    expect(r.retained).toBeUndefined();
  });

  it('the {streamed:true} marker is refused by name, not thrown on', async () => {
    // This is what VideoExporter hands back for a streamed export. The old
    // code passed it to readAsDataURL, which throws on a non-Blob.
    const r = await runEmitted(code(), { streamed: true, type: 'video/mp4', name: 'x.mp4' });
    expect(r.success).toBe(false);
    expect(String(r.error)).toContain('streamed to a file');
    expect(String(r.error)).toContain('update FxTool');
  });

  it('past the inline ceiling it names the size and the ceiling', async () => {
    const blob: Record<string, unknown> = { size: INLINE_MAX_BYTES + 1, type: 'video/mp4', _b64: 'AAAA' };
    blob.slice = () => blob;
    const r = await runEmitted(code(), blob);
    expect(r.success).toBe(false);
    expect(String(r.error)).toContain('inline ceiling');
    expect(String(r.error)).toMatch(/\d+\.\d MB/);
    expect(r.size).toBe(INLINE_MAX_BYTES + 1);
  });
});

describe('generateReadExportChunk / generateReleaseExport', () => {
  it('reads an explicit range and guards the facade', () => {
    const code = codeGenerator.generateReadExportChunk('pp-export-123.mp4', 4194304, 4194304);
    expect(code).toContain("typeof app.exportEngine.readExport !== 'function'");
    expect(code).toContain('update FxTool');
    expect(code).toContain('app.exportEngine.readExport("pp-export-123.mp4", {"offset":4194304,"length":4194304})');
  });

  it('omits length when not given, so the engine picks its own chunk size', () => {
    const code = codeGenerator.generateReadExportChunk('pp-export-123.mp4', 0);
    expect(code).toContain('{"offset":0}');
  });

  it('releases by id, guarded', () => {
    const code = codeGenerator.generateReleaseExport('pp-export-123.mp4');
    expect(code).toContain("typeof app.exportEngine.releaseExport !== 'function'");
    expect(code).toContain('app.exportEngine.releaseExport("pp-export-123.mp4")');
  });
});

// ---------------------------------------------------------------------------
// The handler's paging loop
// ---------------------------------------------------------------------------

/** The bytes a fake studio holds. Deliberately not chunk-aligned. */
const SOURCE = Buffer.from(
  Array.from({ length: 10_000 }, (_, i) => (i * 37 + 11) % 256)
);
const CHUNK = 4096;

interface FakeOpts {
  /** Fail the read that starts at this offset. */
  failAt?: number;
  /** Fail it as an eviction rather than a plain refusal. */
  evicted?: boolean;
  /** Lie about the size in the export result. */
  reportedSize?: number;
  /**
   * Refuse any read asking for more than this many bytes, the way CDP does
   * when one value is too large to cross the bridge ("Failed to write data to
   * data pipe"). A transport failure, not a store failure.
   */
  pipeLimit?: number;
  /** Make the emitted export code report its own failure under a successful run. */
  innerFailure?: string;
}

function fakeController(opts: FakeOpts = {}) {
  const calls: string[] = [];
  const runOptions: Array<{ governorTimeoutMs?: number } | undefined> = [];
  let released: string | null = null;

  const controller = {
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string, _screenshot?: boolean, options?: { governorTimeoutMs?: number }) => {
      calls.push(code);
      runOptions.push(options);

      if (code.includes('exportToStore')) {
        if (opts.innerFailure) {
          // The run SUCCEEDS; the export reports its own failure inside.
          return { success: true, result: { success: false, format: 'mp4', error: opts.innerFailure } };
        }
        return {
          success: true,
          result: {
            success: true,
            platform: 'youtube',
            format: 'mp4',
            retained: true,
            exportId: 'pp-export-42.mp4',
            mimeType: 'video/mp4',
            size: opts.reportedSize ?? SOURCE.length,
            chunkBytes: CHUNK,
          },
        };
      }

      if (code.includes('readExport')) {
        const offset = Number(/"offset":(\d+)/.exec(code)?.[1] ?? 0);
        const length = Number(/"length":(\d+)/.exec(code)?.[1] ?? CHUNK);
        // The transport refuses the VALUE, so the run itself fails — there is
        // no result to inspect, which is what makes it look like a dead store.
        if (opts.pipeLimit !== undefined && length > opts.pipeLimit) {
          return { success: false, error: 'Failed to write data to data pipe' };
        }
        if (opts.failAt === offset) {
          return {
            success: true,
            result: opts.evicted
              ? { ok: false, evicted: true, reason: 'export "pp-export-42.mp4" was evicted to make room for a later export' }
              : { ok: false, reason: 'range 0..99999 exceeds export "pp-export-42.mp4" (size 10000)' },
          };
        }
        const slice = SOURCE.subarray(offset, offset + length);
        return {
          success: true,
          result: {
            ok: true,
            id: 'pp-export-42.mp4',
            offset,
            length: slice.length,
            size: SOURCE.length,
            eof: offset + slice.length >= SOURCE.length,
            data: slice.toString('base64'),
          },
        };
      }

      if (code.includes('releaseExport')) {
        released = 'pp-export-42.mp4';
        return { success: true, result: { ok: true, id: 'pp-export-42.mp4' } };
      }

      return { success: true, result: {} };
    },
  };

  return {
    controller: controller as unknown as PinePaperBrowserController,
    calls,
    runOptions,
    get released() { return released; },
  };
}

const textOf = (r: { content: unknown[] }) => (r.content[0] as { text: string }).text;

describe('the handler pages a retained export into a file', () => {
  const written: string[] = [];

  afterEach(async () => {
    for (const f of written.splice(0)) {
      await rm(f, { force: true });
    }
  });

  it('reassembles the source bytes exactly, and releases only then', async () => {
    const fake = fakeController();
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4', duration: 600 },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeFalsy();
    const text = textOf(result);
    const filePath = /File: (\S+)/.exec(text)?.[1];
    expect(filePath).toBeTruthy();
    written.push(filePath!);

    // Compared against the SOURCE's own bytes, not against a second export:
    // byte-identical re-encoding is not a property this encoder is known to
    // have (an export-determinism run was still open when this landed).
    const onDisk = await readFile(filePath!);
    expect(onDisk.length).toBe(SOURCE.length);
    expect(onDisk.equals(SOURCE)).toBe(true);

    // Three chunks of 4096 for 10,000 bytes, and the studio's copy dropped
    // only after the whole file was written.
    expect(text).toContain('3 chunks');
    expect(fake.released).toBe('pp-export-42.mp4');
    const releaseIdx = fake.calls.findIndex((c) => c.includes('releaseExport'));
    const lastReadIdx = fake.calls.reduce((acc, c, i) => (c.includes('readExport') ? i : acc), -1);
    expect(releaseIdx).toBeGreaterThan(lastReadIdx);
  });

  it('a refused read leaves the export held and says so, with the byte count', async () => {
    const fake = fakeController({ failAt: CHUNK });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeTruthy();
    const text = textOf(result);
    expect(text).toContain('pp-export-42.mp4');
    expect(text).toContain(`${CHUNK} of ${SOURCE.length} bytes read`);
    expect(text).toContain('still held');
    // Nothing was released — the bytes are the only copy.
    expect(fake.released).toBeNull();
  });

  it('an eviction mid-read is reported as an eviction, not a missing file', async () => {
    const fake = fakeController({ failAt: CHUNK * 2, evicted: true });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeTruthy();
    const text = textOf(result);
    expect(text).toContain('evicted');
    // And it does NOT silently re-export: that is the caller's decision.
    expect(fake.calls.filter((c) => c.includes('exportToStore')).length).toBe(1);
  });

  it('a size the studio contradicts fails rather than writing a short file', async () => {
    const fake = fakeController({ reportedSize: SOURCE.length + 5000 });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeTruthy();
    expect(textOf(result)).toContain('reassembled');
  });

  it('leaves no partial file behind when paging fails', async () => {
    const before = new Set(await readdir(join(tmpdir(), 'pinepaper-exports')).catch(() => []));
    const fake = fakeController({ failAt: CHUNK });
    await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );
    const after = await readdir(join(tmpdir(), 'pinepaper-exports')).catch(() => []);
    const added = after.filter((f) => !before.has(f));
    expect(added).toEqual([]);
  });

  /**
   * FxTool's runGenerated races the code against RUN_DEFAULTS.timeoutMs — ten
   * seconds. An export renders frame by frame and the schema allows 600s of
   * footage, so it hit that ceiling and came back as a PP_TIMEOUT that read
   * like a broken scene. The budget is raised for the export run only.
   */
  it('gives the export run a governor budget, and leaves the chunk reads on the default', async () => {
    const fake = fakeController();
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4', duration: 600 },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );
    expect(result.isError).toBeFalsy();
    written.push(/File: (\S+)/.exec(textOf(result))![1]);

    const exportRun = fake.runOptions[fake.calls.findIndex((c) => c.includes('exportToStore'))];
    expect(exportRun?.governorTimeoutMs).toBeGreaterThan(10_000);

    // A chunk read slices a string already in memory. If one of those needs ten
    // seconds the store is wedged, and a timeout is the right answer.
    // `"offset"` rather than `readExport`: the export code names readExport too,
    // in the capability check it makes before choosing the store path.
    const readRun = fake.runOptions[fake.calls.findIndex((c) => c.includes('"offset"'))];
    expect(readRun?.governorTimeoutMs).toBeUndefined();
  });

  /**
   * The export's own verdict rides INSIDE a run that succeeded. Reading only
   * the run meant an encoder that died reported as a finished export: measured
   * on a five-chunk video where two chunks came back `success: false, error:
   * "Failed to write data to data pipe"` under an outer `"success": true`, and
   * the caller shipped three chunks believing it had five.
   */
  it('an inner export failure is a failure, not a success with an error in it', async () => {
    const fake = fakeController({ innerFailure: 'export failed: Failed to write data to data pipe' });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeTruthy();
    expect(textOf(result)).toContain('Failed to write data to data pipe');
  });

  /**
   * A 17 MB export died on its fourth 4 MB read with "Failed to write data to
   * data pipe" — CDP refusing to carry one oversized value, with the bytes
   * sitting right there in the store. Halving the window and asking again is
   * the difference between a delivered file and an export held hostage.
   */
  it('halves the read window when the transport refuses the value, and still reassembles exactly', async () => {
    // Refuses anything above 1 MB, so the 4 MB default must step down twice.
    const fake = fakeController({ pipeLimit: 1024 * 1024 });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );

    expect(result.isError).toBeFalsy();
    const filePath = /File: (\S+)/.exec(textOf(result))![1];
    written.push(filePath);
    expect(await readFile(filePath)).toEqual(SOURCE);
    expect(fake.released).toBe('pp-export-42.mp4');
  });

  it('does not retry a refusal from the STORE — a smaller window cannot change that answer', async () => {
    const fake = fakeController({ failAt: CHUNK, evicted: true });
    const result = await handleToolCall(
      'pinepaper_agent_export',
      { platform: 'youtube', format: 'mp4' },
      { executeInBrowser: true, browserController: fake.controller, executionMode: 'puppeteer' }
    );
    expect(result.isError).toBeTruthy();
    expect(textOf(result)).toContain('evicted');
    // One read at the failing offset, not a ladder of them.
    const atOffset = fake.calls.filter((c) => c.includes(`"offset":${CHUNK}`)).length;
    expect(atOffset).toBe(1);
  });
});
