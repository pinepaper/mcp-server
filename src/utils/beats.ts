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

/** Cut points: every beat, every bar (beatsPerBar beats), or every N beats, inside an optional range. */
export function cutPoints(beats: number[], every: 'beat' | 'bar' | number, beatsPerBar = 4, range?: [number, number]): number[] {
  const step = every === 'beat' ? 1 : every === 'bar' ? beatsPerBar : Math.max(1, Math.round(every));
  const inRange = range ? beats.filter((t) => t >= range[0] && t <= range[1]) : beats;
  return inRange.filter((_, i) => i % step === 0);
}
