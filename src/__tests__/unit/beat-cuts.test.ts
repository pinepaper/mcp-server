/**
 * pinepaper_beat_cuts (plan B2): a beat grid fitted to detected onsets, cut
 * points on it, and a clip split at each.
 */
import { describe, it, expect } from 'bun:test';
import { beatGrid, cutPoints } from '../../utils/beats.js';
import { handleToolCall } from '../../tools/handlers.js';

describe('beat grid', () => {
  it('120 bpm with jittered onsets lands on the beat', () => {
    const onsets = [0.01, 0.49, 1.02, 1.5, 1.98, 2.51, 3.0];
    const g = beatGrid(onsets, 120, 4);
    expect(g.period).toBe(0.5);
    expect(Math.min(g.phase, 0.5 - g.phase)).toBeLessThan(0.02); // either side of the beat averages to it
    expect(g.beats.length).toBeGreaterThanOrEqual(8);
  });
  it('an offset grid keeps its phase', () => {
    const g = beatGrid([0.25, 0.75, 1.25, 1.75], 120, 2);
    expect(g.phase).toBeCloseTo(0.25, 2);
    expect(g.beats.slice(0, 3)).toEqual([0.25, 0.75, 1.25]);
  });
  it('cut points: every beat, bar, N, within a range', () => {
    const beats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];
    expect(cutPoints(beats, 'bar')).toEqual([0, 2, 4]);
    expect(cutPoints(beats, 3)).toEqual([0, 1.5, 3]);
    expect(cutPoints(beats, 'beat', 4, [1, 2])).toEqual([1, 1.5, 2]);
  });
});

describe('the tool', () => {
  const fake = (onsets?: number[]) => {
    const splits: Array<{ id: string; at: number }> = [];
    let n = 10;
    const controller = { connected: true, connect: async () => undefined,
      executeCode: async (code: string) => {
        if (code.includes('analyzeAudio')) return { success: true, result: { success: true, ok: true, onsets, bpm: 120, confidence: 0.9, duration: 4 } };
        const m = /splitMedia\("([^"]+)", ([0-9.]+)\)/.exec(code);
        if (m) {
          const at = Number(m[2]);
          splits.push({ id: m[1], at });
          if (at > 3) return { success: true, result: { success: false, action: 'split', error: 'at ' + at + ' is outside the clip' } };
          return { success: true, result: { success: true, action: 'split', leftId: m[1], rightId: 'item_' + (++n), at } };
        }
        return { success: true, result: { success: true } };
      } };
    return { controller, splits };
  };
  const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });
  const json = (r: { content?: Array<{ text?: string }> }) => JSON.parse(r.content![0].text!);

  it('given beats, returns bar cuts with no analysis', async () => {
    const o = json(await handleToolCall('pinepaper_beat_cuts', { beats: [0, 0.5, 1, 1.5, 2, 2.5], every: 'bar' }, { executionMode: 'code' }));
    expect(o.cuts).toEqual([0, 2]);
  });

  it('analyses the music, fits the grid, and splits a clip at each cut in turn', async () => {
    const f = fake([0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5]);
    const o = json(await handleToolCall('pinepaper_beat_cuts', { source: 'media_abc', every: 'bar', clipId: 'item_2' }, opts(f.controller)));
    expect(o.grid).toMatchObject({ bpm: 120, detected: { bpm: 120, confidence: 0.9 } });
    expect(o.cuts).toEqual([0, 2, 4]);
    // Each split is made on the right-hand piece of the previous one; a cut past the clip is skipped.
    expect(f.splits.map((s) => s.id)).toEqual(['item_2', 'item_11', 'item_12']);
    expect(o.split).toMatchObject({ made: 2, pieces: ['item_2', 'item_11', 'item_12'] });
    expect(o.split.skipped[0].at).toBe(4);
  });

  it('with no studio and no beats, it says what it needs', async () => {
    const r = await handleToolCall('pinepaper_beat_cuts', { source: 'song.mp3' }, { executionMode: 'code' });
    expect(r.isError).toBe(true);
  });
});

describe('retest of 65f01d4', () => {
  it('range keeps the whole-track bar grid', () => {
    const beats = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6];
    expect(cutPoints(beats, 'bar', 4, [1, 6])).toEqual([2, 4, 6]);
  });

  it('a 120 bpm track mis-detected at 162 is recovered from the onsets', async () => {
    const { tempoCandidates } = await import('../../utils/beats.js');
    // 20 s at 120 bpm, with an off-beat hat on some beats and a little jitter.
    const onsets: number[] = [];
    for (let i = 0; i < 40; i++) { onsets.push(i * 0.5 + ((i * 7) % 5 - 2) * 0.004); if (i % 3 === 0) onsets.push(i * 0.5 + 0.25); }
    const c = tempoCandidates(onsets, 162.2, 20);
    expect(Math.abs(c[0].bpm - 120)).toBeLessThan(1.5);
    expect(c.length).toBeGreaterThan(2);
    // Constrained by a hint, the best in range wins.
    expect(Math.abs(tempoCandidates(onsets, 162.2, 20, [80, 140])[0].bpm - 120)).toBeLessThan(1.5);
  });

  it('the tool warns when unsure, lists candidates, and a split refusal reads as text', async () => {
    const onsets = [0.3, 1.1, 1.7, 2.9, 3.2];      // no clear tempo
    const controller = { connected: true, connect: async () => undefined,
      executeCode: async (code: string) => code.includes('analyzeAudio')
        ? { success: true, result: { success: true, ok: true, onsets, bpm: 162.2, confidence: 0.14, duration: 4 } }
        : { success: true, result: { success: false, action: 'split', error: 'at 0 is outside the clip' } } };
    const r = await handleToolCall('pinepaper_beat_cuts', { source: 'song', every: 'bar', clipId: 'item_2' }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' });
    const o = JSON.parse((r.content![0] as { text: string }).text);
    expect(o.grid.lowConfidence).toBe(true);
    expect(o.grid.warning).toContain('pass bpm');
    expect(o.grid.candidates.length).toBeGreaterThan(1);
    expect(o.split.skipped[0].reason).toContain('at 0 is outside the clip');
    expect(o.split.skipped[0].reason).not.toContain('[object Object]');
  });
});
