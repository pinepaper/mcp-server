/**
 * pinepaper_beat_cuts (plan B2): music → audio_beats analysis → a beat grid →
 * cut points on beats or bars, and optionally a clip split at each one.
 *
 * Orchestrated here through the real tools (audio_beats analyze, media
 * split), so their checks apply: large sources are staged, ids resolve,
 * a refused split is named.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { errorResult, getExecutionMode, handleToolCall, type HandlerOptions } from '../handlers.js';
import { ErrorCodes } from '../../types/schemas.js';
import { beatGrid, cutPoints, tempoCandidates } from '../../utils/beats.js';

export const BeatCutsArgsSchema = z.object({
  source: z.string().min(1).optional(),
  beats: z.array(z.number().min(0)).optional(),
  bpm: z.number().positive().max(400).optional(),
  bpmHint: z.tuple([z.number().positive(), z.number().positive()]).optional(),
  every: z.union([z.enum(['beat', 'bar']), z.number().int().min(1).max(64)]).optional(),
  beatsPerBar: z.number().int().min(1).max(16).optional(),
  range: z.tuple([z.number().min(0), z.number().min(0)]).optional(),
  clipId: z.string().min(1).optional(),
}).refine((v) => !!(v.source || v.beats), { message: 'give source (music to analyse) or beats (times you already have)' });

const firstJson = (r: CallToolResult): any => {
  const c = r.content?.[0];
  try { return c && 'text' in c ? JSON.parse(c.text) : null; } catch { return null; }
};

export const beatHandlers: Record<string, (args: Record<string, unknown>, options: HandlerOptions) => Promise<CallToolResult>> = {
  'pinepaper_beat_cuts': async (args, options) => {
    const a = BeatCutsArgsSchema.parse(args);
    let beats = a.beats ? [...a.beats].sort((x, y) => x - y) : null;
    let bpm = a.bpm ?? null;
    let grid: Record<string, unknown> | null = null;

    if (!beats) {
      if ((options.executionMode ?? getExecutionMode()) === 'code' || !options.executeInBrowser) {
        return errorResult(ErrorCodes.VALIDATION_ERROR, 'beat_cuts analyses the music in the studio, so it needs a live studio — or pass beats (times in seconds) you already have.');
      }
      const analysed = await handleToolCall('pinepaper_audio_beats', { action: 'analyze', source: a.source }, options);
      const body = firstJson(analysed);
      const r = body?.result ?? body;
      if (analysed.isError || !r || r.success === false || !Array.isArray(r.onsets) || !(r.bpm > 0)) {
        return errorResult(ErrorCodes.EXECUTION_ERROR, `the music could not be analysed: ${(r && r.error) || JSON.stringify(body).slice(0, 300)}`);
      }
      const duration = Number(r.duration) || Math.max(...r.onsets, 0);
      // The studio's tempo can lock onto a related one (a 120 track read as
      // 162 = 4:3). Its usual confusions are scored against the onsets and
      // the best is used — or the caller's bpm, or the best inside bpmHint.
      const candidates = tempoCandidates(r.onsets, r.bpm, duration, a.bpmHint as [number, number] | undefined);
      const chosen = a.bpm ?? candidates[0]?.bpm ?? r.bpm;
      const g = beatGrid(r.onsets, chosen, duration);
      beats = g.beats; bpm = g.bpm;
      const conf = candidates.find((c) => c.bpm === Math.round(chosen * 10) / 10)?.confidence ?? null;
      grid = { bpm: g.bpm, phase: g.phase, period: Math.round(g.period * 1000) / 1000, confidence: conf, detected: { bpm: r.bpm, confidence: r.confidence }, duration: r.duration,
        candidates: candidates.slice(0, 4), ...(a.bpm ? { bpmFrom: 'caller' } : a.bpmHint ? { bpmFrom: 'bpmHint' } : { bpmFrom: 'best candidate' }) };
      if (!a.bpm && (conf === null || conf < 0.4)) {
        grid.lowConfidence = true;
        grid.warning = `the tempo is uncertain (confidence ${conf ?? 'unknown'} at ${g.bpm} bpm; the studio detected ${r.bpm} at ${r.confidence}). If you know it, pass bpm (or bpmHint: [min, max]); the candidates above are the likely alternatives.`;
      }
    }

    const cuts = cutPoints(beats, a.every ?? 'beat', a.beatsPerBar ?? 4, a.range as [number, number] | undefined);
    const out: Record<string, unknown> = { success: true, every: a.every ?? 'beat', ...(bpm ? { bpm } : {}), ...(grid ? { grid } : {}), cuts, count: cuts.length };

    // Split a clip at each cut, in order: each split leaves the rest of the clip
    // on the right-hand piece, which is where the next cut falls.
    if (a.clipId && cuts.length) {
      const pieces: string[] = [a.clipId];
      let current = a.clipId;
      const refused: Array<{ at: number; reason: string }> = [];
      for (const at of cuts) {
        const r = await handleToolCall('pinepaper_media', { action: 'split', id: current, at }, options);
        const body = firstJson(r);
        const res = body?.result ?? body;
        if (r.isError || !res || res.success === false) {
          const e = res?.error;
          refused.push({ at, reason: typeof e === 'string' ? e : (e?.message ?? JSON.stringify(e ?? 'refused')) });
          continue;
        }
        current = res.rightId ?? current;
        pieces.push(current);
      }
      out.split = { clipId: a.clipId, pieces, made: pieces.length - 1, ...(refused.length ? { skipped: refused, note: 'cuts outside the clip (before its start or after its end) are skipped.' } : {}) };
    }
    return { content: [{ type: 'text' as const, text: JSON.stringify(out, null, 2) }] };
  },
};
