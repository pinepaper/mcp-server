/**
 * A beat grid from detected onsets and a tempo, and cut points on it — the
 * server half of beat-snapped cuts (plan B2). The studio's analysis gives
 * onsets and a bpm, not a grid; the grid's phase is fitted to the onsets.
 */

export interface BeatGrid { bpm: number; period: number; phase: number; beats: number[] }

/**
 * The beat period is 60 / bpm; the phase is the circular mean of every
 * onset's offset within a period (circular, so offsets either side of the
 * beat — 0.49 and 0.01 of a 0.5 s beat — average to the beat, not to its
 * middle).
 */
export function beatGrid(onsets: number[], bpm: number, duration: number): BeatGrid {
  const period = 60 / bpm;
  const offs = onsets.filter((t) => Number.isFinite(t) && t >= 0).map((t) => ((t % period) + period) % period);
  let phase = 0;
  if (offs.length) {
    // Circular mean of the offsets, as angles on the beat circle.
    const ang = offs.map((o) => (o / period) * 2 * Math.PI);
    const mean = Math.atan2(ang.reduce((s, a) => s + Math.sin(a), 0), ang.reduce((s, a) => s + Math.cos(a), 0));
    phase = ((((mean / (2 * Math.PI)) * period) % period) + period) % period;
  }
  const beats: number[] = [];
  for (let t = phase; t <= duration + 1e-9; t += period) beats.push(Math.round(t * 1000) / 1000);
  return { bpm, period, phase: Math.round(phase * 1000) / 1000, beats };
}

/**
 * Cut points: every beat, every bar (beatsPerBar beats), or every N beats,
 * inside an optional range. Bars are counted on the WHOLE grid and then
 * filtered: counting from the range's start moved the downbeats (range [1, 6]
 * cut at 1, 3, 5 instead of 2, 4, 6).
 */
export function cutPoints(beats: number[], every: 'beat' | 'bar' | number, beatsPerBar = 4, range?: [number, number]): number[] {
  const step = every === 'beat' ? 1 : every === 'bar' ? beatsPerBar : Math.max(1, Math.round(every));
  return beats.filter((t, i) => i % step === 0 && (!range || (t >= range[0] - 1e-9 && t <= range[1] + 1e-9)));
}

export interface TempoCandidate { bpm: number; confidence: number; phase: number; weighted?: number }

/**
 * A tempo prior (Ellis-style): log-Gaussian around 120 bpm, one octave wide.
 * The fit score cannot choose between a tempo and its double — a real 120
 * track scored 0.24 at 240 and 0.18 at 120 — and people tap near 120, so the
 * ranking weights the score by this; 240 then ranks 0.15, 120 0.18.
 */
export function tempoPrior(bpm: number, centre = 120, octaves = 1): number {
  const x = Math.log2(bpm / centre) / octaves;
  return Math.exp(-0.5 * x * x);
}

/** Candidates ranked by fit x prior; the reported confidence stays the fit. */
export function rankCandidates(cs: TempoCandidate[]): TempoCandidate[] {
  return cs.map((c) => ({ ...c, weighted: Math.round(c.confidence * tempoPrior(c.bpm) * 100) / 100 }))
    .sort((a, b) => (b.weighted! - a.weighted!) || Math.abs(a.bpm - 120) - Math.abs(b.bpm - 120));
}

/**
 * How well a tempo explains the onsets, 0-1: precision x recall — the share of
 * onsets that land on a grid beat, times the share of grid beats that have an
 * onset. Either alone picks the wrong tempo: every onset of a 120 track sits
 * on a 240 grid (precision 1) but half of 240's beats are empty (recall 0.5);
 * every beat of a 60 grid has an onset (recall 1) but half the onsets miss it.
 * Phase coherence was tried and failed on off-beat hi-hats, which sit on the
 * double-time grid and pull the true tempo's coherence down.
 */
export function scoreTempo(onsets: number[], bpm: number, duration: number): TempoCandidate {
  const g = beatGrid(onsets, bpm, duration);
  const ok = onsets.filter((t) => Number.isFinite(t) && t >= 0);
  if (!ok.length || !g.beats.length) return { bpm, confidence: 0, phase: g.phase };
  const tol = Math.min(0.05, g.period * 0.12);
  const onGrid = ok.filter((t) => { const d = ((((t - g.phase) % g.period) + g.period) % g.period); return Math.min(d, g.period - d) <= tol; }).length / ok.length;
  // Recall over the span the onsets cover: a grid beat after the music's last
  // onset (or before its first) is not a miss, and counting it favoured a
  // slightly wrong tempo whose grid happened to end sooner.
  const lo = Math.min(...ok) - tol, hi = Math.max(...ok) + tol;
  const span = g.beats.filter((b) => b >= lo && b <= hi);
  const covered = span.length ? span.filter((b) => ok.some((t) => Math.abs(t - b) <= tol)).length / span.length : 0;
  return { bpm: Math.round(bpm * 10) / 10, confidence: Math.round(onGrid * covered * 100) / 100, phase: g.phase };
}

/**
 * The detected tempo and its usual confusions (double, half, 3:4, 4:3, 2:3,
 * 3:2), each scored against the onsets, best first. With a hint range, only
 * tempos inside it are kept (the detected one is folded into it by
 * doubling / halving when it lies outside).
 */
export function tempoCandidates(onsets: number[], detected: number, duration: number, hint?: [number, number]): TempoCandidate[] {
  const ratios = [1, 2, 0.5, 0.75, 4 / 3, 2 / 3, 1.5];
  let pool = ratios.map((r) => detected * r).filter((b) => b >= 40 && b <= 300);
  if (hint) {
    let f = detected;
    while (f > hint[1] && f / 2 >= 20) f /= 2;
    while (f < hint[0] && f * 2 <= 400) f *= 2;
    pool = [...pool, f].filter((b) => b >= hint[0] - 1e-9 && b <= hint[1] + 1e-9);
  }
  // A ratio of a mis-detected tempo is only near the true one (162.2 x 3/4
  // is 121.7, not 120 — a quarter-second drift over 20 s), so each is refined
  // by a fine search within +-3%.
  const refine = (b: number): TempoCandidate => {
    let best = scoreTempo(onsets, b, duration);
    for (let x = b * 0.97; x <= b * 1.03; x += 0.1) {
      if (hint && (x < hint[0] || x > hint[1])) continue;
      const c = scoreTempo(onsets, x, duration);
      if (c.confidence > best.confidence) best = c;
    }
    return best;
  };
  const seen = new Set<number>();
  return rankCandidates(pool.map(refine).filter((c) => (seen.has(c.bpm) ? false : (seen.add(c.bpm), true))));
}
