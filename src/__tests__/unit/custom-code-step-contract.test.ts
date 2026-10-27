/**
 * execute_custom_code and agent_batch_execute: the scene lint after the code, and every failed step as
 * { step, itemId, reason }. Also the export probe summary, checked against
 * the file by ffprobe where it is on PATH.
 */
import { describe, it, expect } from 'bun:test';
import { mkdtempSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { codeGenerator } from '../../types/code-generator.js';
import { handleToolCall, stepFailures, unwrapLint, probeLines } from '../../tools/handlers.js';
import { probeFromResult, verifyWithFfprobe, exportFileReceipt } from '../../tools/export-file-receipt.js';
import type { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

const body = (code: string) => code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
const runCode = async (code: string, app: unknown) => new Function('app', `return ${body(code)}`)(app);
const LINT = [{ code: 'TEXT_CLIPS_FRAME', itemId: 'item_1', message: 'Text "SIGNAL" (item_1) runs 90 px past the left edge' }];

describe('execute_custom_code: the emitted wrapper', () => {
  it('returns the value exactly as before when the lint has nothing to say', async () => {
    const code = codeGenerator.generateExecuteCustomCode({ code: 'return { v: 42 };' });
    expect(await runCode(code, { lintScene: () => ({ warnings: [] }) })).toEqual({ v: 42 });
    expect(await runCode(code, {})).toEqual({ v: 42 });
  });
  it('carries the lint beside the value when there is something to say', async () => {
    const code = codeGenerator.generateExecuteCustomCode({ code: 'return 7;' });
    expect(await runCode(code, { lintScene: () => ({ warnings: LINT }) })).toEqual({ __ppValue: 7, __ppLint: LINT });
  });
  it('a throw is { step, itemId, reason }, and a thrown non-Error is not "undefined"', async () => {
    const thrown = await runCode(codeGenerator.generateExecuteCustomCode({ code: 'const e = new Error("no such item"); e.itemId = "item_9"; throw e;' }), {});
    expect(thrown).toMatchObject({ success: false, step: 'execute_custom_code', itemId: 'item_9', reason: 'no such item', error: 'no such item' });
    const bare = await runCode(codeGenerator.generateExecuteCustomCode({ code: 'throw undefined;' }), {});
    expect(bare.reason).toBe('the custom code threw with no message');
    expect(JSON.stringify(bare)).not.toContain('undefined');
  });
});

function controllerReturning(result: unknown): PinePaperBrowserController {
  return {
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string) => (code.includes('__pp_effect') || code.includes('EFFECT') ? { success: true, result: { ok: false } } : { success: true, result }),
  } as unknown as PinePaperBrowserController;
}
const call = (tool: string, args: Record<string, unknown>, result: unknown) =>
  handleToolCall(tool, args, { executeInBrowser: true, browserController: controllerReturning(result), executionMode: 'puppeteer' });
const parse = (r: { content?: Array<{ type: string; text?: string }> }) => JSON.parse((r.content?.[0] as { text: string }).text);

describe('execute_custom_code: the server', () => {
  it('unwraps the value and puts the lint beside it', async () => {
    const r = await call('pinepaper_execute_custom_code', { code: 'return 7;' }, { __ppValue: { made: 3 }, __ppLint: LINT });
    expect(r.isError).toBeFalsy();
    const j = parse(r);
    expect(j.result).toEqual({ made: 3 });
    expect(j.lintWarnings).toEqual(LINT);
  });
  it('a failed run carries failures: [{ step, itemId, reason }]', async () => {
    const r = await call('pinepaper_execute_custom_code', { code: 'x' }, { success: false, step: 'execute_custom_code', itemId: 'item_9', reason: 'no such item', error: 'no such item', __ppLint: LINT });
    expect(r.isError).toBe(true);
    const j = parse(r);
    expect(j.error.details.failures).toEqual([{ step: 'execute_custom_code', itemId: 'item_9', reason: 'no such item' }]);
    expect(j.error.details.lintWarnings).toEqual(LINT);
  });
  it('a value that reports failure with only a message still becomes a step', async () => {
    const r = await call('pinepaper_execute_custom_code', { code: 'x' }, { success: false, error: 'the glow preset is unknown' });
    expect(parse(r).error.details.failures).toEqual([{ step: 'pinepaper_execute_custom_code', itemId: null, reason: 'the glow preset is unknown' }]);
  });
});

describe('agent_batch_execute', () => {
  it('the emitted batch records each failed op as a step with its item and reason, and runs the lint', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'modify', itemId: 'item_3', properties: { opacity: 0.5 } }], atomic: false } as never);
    expect(code).toContain('step: "op 0 (modify)"');
    expect(code).toContain(': "item_3"');
    expect(code).toContain('failures: _failures()');
    expect(code).toContain('__ppLintNow()');
    expect(code).not.toContain('error: opError.message');
    expect(code).not.toContain('error: e.message');
  });
  it('the server hands the batch failures on as they are', async () => {
    const value = { success: false, error: 'op 0: Item not found', results: [], failures: [{ step: 'op 0 (modify)', itemId: 'item_3', reason: 'Item not found' }], __ppLint: LINT };
    const r = await call('pinepaper_agent_batch_execute', { operations: [{ type: 'modify', itemId: 'item_3', properties: { opacity: 0.5 } }], skipValidation: true }, value);
    expect(r.isError).toBe(true);
    const j = parse(r);
    expect(j.error.details.failures).toEqual([{ step: 'op 0 (modify)', itemId: 'item_3', reason: 'Item not found' }]);
    expect(j.error.details.lintWarnings).toEqual(LINT);
  });
});

describe('stepFailures / unwrapLint', () => {
  it('never a bare message', () => {
    expect(stepFailures('t', undefined, '')).toEqual([{ step: 't', itemId: null, reason: 't failed with no reason given' }]);
    expect(stepFailures('t', { failures: [{ step: 's', error: 'e' }] }, 'm')).toEqual([{ step: 's', itemId: null, reason: 'e' }]);
  });
  it('leaves a result with no lint alone', () => {
    const run = { result: { a: 1 } };
    expect(unwrapLint(run)).toEqual([]);
    expect(run.result).toEqual({ a: 1 });
  });
});

// ---------------------------------------------------------------------------
// probe
// ---------------------------------------------------------------------------

const enc = { container: 'mp4', codec: 'avc1.42001f', width: 320, height: 240, fps: 12, durationS: 1, frames: 12 };

describe('probeFromResult', () => {
  it('builds the summary from the studio video report', () => {
    expect(probeFromResult({ video: { encode: enc, audioCodec: 'aac' }, audio: { sampleRate: 48000, silent: true } }))
      .toEqual({ ...enc, audio: { codec: 'aac', sampleRate: 48000, silent: true } });
    expect(probeFromResult({ video: { encode: enc, audioCodec: 'none' } })?.audio).toBeNull();
  });
  it('prefers a probe the studio already made, and is null for a studio that reports no encode', () => {
    expect(probeFromResult({ probe: { ...enc, audio: null } })).toEqual({ ...enc, audio: null });
    expect(probeFromResult({ video: {} })).toBeNull();
    expect(probeFromResult(null)).toBeNull();
  });
});

let haveFfmpeg = false;
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); haveFfmpeg = true; } catch { /* skip */ }

describe.skipIf(!haveFfmpeg)('ffprobe reads the saved file back', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pp-probe-'));
  const file = join(dir, 'clip.mp4');
  execFileSync('ffmpeg', ['-v', 'error', '-f', 'lavfi', '-i', 'color=red:s=320x240:r=12:d=1', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', file]);

  it('agrees with a summary that matches the file', async () => {
    expect(existsSync(file)).toBe(true);
    const c = await verifyWithFfprobe(file, { ...enc, audio: null });
    expect(c).toMatchObject({ tool: 'ffprobe', ok: true });
  });
  it('names every field that disagrees', async () => {
    const c = await verifyWithFfprobe(file, { ...enc, width: 640, fps: 30, audio: { codec: 'aac' } });
    expect(c.ok).toBe(false);
    expect(c.mismatches?.map((m) => m.field).sort()).toEqual(['audio', 'fps', 'width']);
    const lines = probeLines({ probe: { ...enc, width: 640 }, probeCheck: c });
    expect(lines).toContain('PROBE MISMATCH: width — the studio encoded 640, ffprobe reads 320');
  });
  it('rides on the receipt', async () => {
    const r = await exportFileReceipt(file, { video: { encode: enc, audioCodec: 'none' } });
    expect(r.probe).toMatchObject({ width: 320, frames: 12 });
    expect(r.probeCheck).toMatchObject({ tool: 'ffprobe', ok: true });
  });
  it('can be turned off', async () => {
    process.env.PINEPAPER_FFPROBE = 'off';
    try { expect(await verifyWithFfprobe(file, { ...enc, audio: null })).toEqual({ tool: null, reason: 'PINEPAPER_FFPROBE=off' }); }
    finally { delete process.env.PINEPAPER_FFPROBE; }
  });
});
