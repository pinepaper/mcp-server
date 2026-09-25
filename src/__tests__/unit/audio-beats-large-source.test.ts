/**
 * Gap 5.5: audio_beats with a large data: URL answered success with no
 * result (the source was inlined into the generated code), and a local path
 * failed to decode. Large sources are staged; paths are read by the server.
 */
import { describe, it, expect } from 'bun:test';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { handleToolCall } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';

function fake() {
  const runs: Array<{ code: string; stage?: Record<string, string> }> = [];
  const controller = {
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string, _s?: boolean, o?: { stage?: Record<string, string> }) => {
      runs.push({ code, stage: o?.stage });
      return { success: true, result: { success: true, ok: true, bpm: 120 } };
    },
  };
  return { controller, runs };
}
const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });

describe('audio_beats source handling', () => {
  it('a large data: URL travels beside the code, not inside it', async () => {
    const f = fake();
    const big = 'data:audio/wav;base64,' + 'A'.repeat(900_000);
    await handleToolCall('pinepaper_audio_beats', { action: 'analyze', source: big }, opts(f.controller));
    expect(f.runs[0].code.length).toBeLessThan(20_000);
    expect(f.runs[0].code).toContain('__ppStage:');
    expect(Object.values(f.runs[0].stage ?? {})[0]).toBe(big);
  });

  it('a local file path is read by the server', async () => {
    const f = fake();
    const dir = mkdtempSync(join(tmpdir(), 'pp-beats-'));
    const path = join(dir, 'beat.wav');
    writeFileSync(path, Buffer.alloc(80_000, 1));
    await handleToolCall('pinepaper_audio_beats', { action: 'analyze', source: path }, opts(f.controller));
    const staged = Object.values(f.runs[0].stage ?? {})[0];
    expect(staged && staged.startsWith('data:audio/wav;base64,')).toBe(true);
  });

  it('an upload id passes through untouched', async () => {
    const f = fake();
    await handleToolCall('pinepaper_audio_beats', { action: 'analyze', source: 'media_abc' }, opts(f.controller));
    expect(f.runs[0].code).toContain('"media_abc"');
    expect(f.runs[0].stage).toBeUndefined();
  });

  it('an engine that returns nothing is an error, not an empty success', async () => {
    const code = codeGenerator.generateAudioBeats({ action: 'analyze', source: 'x' } as never);
    const r = await new Function('app', 'window', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)({ analyzeAudio: async () => undefined }, {});
    expect(r.success).toBe(false);
    expect(r.error).toContain('upload_audio');
  });

  it('the staged source is read back in the page', async () => {
    const code = codeGenerator.generateAudioBeats({ action: 'analyze', source: '__ppStage:k1' } as never);
    let got = '';
    await new Function('app', 'window', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)({ analyzeAudio: async (s: string) => { got = s; return { ok: true, bpm: 120 }; } }, { __ppStage: { k1: 'data:audio/wav;base64,QQ==' } });
    expect(got).toBe('data:audio/wav;base64,QQ==');
  });
});
