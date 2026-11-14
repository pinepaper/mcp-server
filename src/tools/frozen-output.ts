/**
 * A FILM THAT STOPS WHILE ITS SCENE STILL MOVES (LONGKEY36 / GRIEF).
 *
 * A 120 s export reported success: 3,600 frames, a clean decode, no warnings. Its picture was frozen from t = 0.5 s
 * because the studio had rescaled the keyframe tracks. The key-time read-back (keyTimeGuard) catches that cause at
 * write time; this catches the symptom on the delivered file, whatever the cause.
 *
 * Before a video export the server reads when each visible keyframe track last changes a value (SCENE_MOTION_PROBE_JS).
 * After it, the studio's own per-frame hashes (video.frameHashes.hashes) say when the picture last changed. A track
 * that should still be changing well after the picture stopped is named in a warning on the result. It is a warning,
 * not a failure: a keyed change can be invisible for good reasons (an item behind another, a move off the canvas).
 */

export interface SceneTrack { id: string; until: number }
export interface SceneMotion { tracks: SceneTrack[] }
export interface FrozenOutput { frozenAt: number; exportEnd: number; track: SceneTrack; warning: string }

/**
 * Visible items with a keyframe track whose values change, and the scene time of the last change: timeOffset plus the
 * last key that differs from the key before it, capped at the clip's out point. A looping track changes for ever.
 */
export const SCENE_MOTION_PROBE_JS: string = `(function () {
  const all = app.itemRegistry && app.itemRegistry.getAll ? app.itemRegistry.getAll() : [];
  const tracks = [];
  for (const e of all) {
    const it = e && (e.item || e);
    const kfs = it && it.data && it.data.keyframes;
    if (!Array.isArray(kfs) || kfs.length < 2 || it.visible === false) continue;
    // A transparent item that never keys its opacity cannot change the picture.
    if (it.opacity === 0 && !kfs.some(function (k) { return k && k.properties && 'opacity' in k.properties; })) continue;
    let last = null;
    for (let i = 1; i < kfs.length; i++) {
      if (JSON.stringify((kfs[i] && kfs[i].properties) || {}) !== JSON.stringify((kfs[i - 1] && kfs[i - 1].properties) || {})) last = Number(kfs[i].time);
    }
    if (last === null || !isFinite(last)) continue;
    let until = it.data.keyframeLoop === true ? 1e9 : (Number(it.data.timeOffset) || 0) + last;
    const out = Number(it.data.clipOutPoint);
    if (isFinite(out) && out > 0) until = Math.min(until, out);
    tracks.push({ id: String(e.id || (it.data && (it.data.registryId || it.data.id)) || '?'), until: until });
  }
  tracks.sort(function (a, b) { return b.until - a.until; });
  return { tracks: tracks.slice(0, 5) };
})()`;

/** Compare the delivered frames with the scene's motion. Null when the check cannot run or finds nothing. */
export function frozenOutputCheck(exportResult: unknown, motion: unknown): FrozenOutput | null {
  const m = motion as SceneMotion | null;
  const tracks = m && Array.isArray(m.tracks) ? m.tracks.filter((t) => t && typeof t.until === 'number') : [];
  if (!tracks.length) return null;
  const v = (exportResult as { video?: { frameHashes?: { hashes?: unknown }; encode?: { fps?: unknown }; range?: { fps?: unknown; startTime?: unknown } } } | null)?.video;
  const hashes = v && v.frameHashes && Array.isArray(v.frameHashes.hashes) ? v.frameHashes.hashes as unknown[] : null;
  const fps = Number(v?.range?.fps ?? v?.encode?.fps);
  // A frame that could not be read back says nothing about whether the picture moved: no verdict.
  if (!hashes || hashes.length < 2 || !(fps > 0) || hashes.some((h) => h == null)) return null;
  const start = Number(v?.range?.startTime) || 0;
  let lastChange = 0;
  for (let i = 1; i < hashes.length; i++) if (hashes[i] !== hashes[i - 1]) lastChange = i;
  const frozenAt = start + lastChange / fps;
  const exportEnd = start + hashes.length / fps;
  const slack = Math.max(0.5, 3 / fps);
  // The still tail must be real, and a track must still be changing well inside it.
  if (exportEnd - frozenAt < slack * 2) return null;
  const track = tracks.find((t) => Math.min(t.until, exportEnd) > frozenAt + slack);
  if (!track) return null;
  const r1 = (x: number) => Math.round(x * 100) / 100;
  const runs = track.until >= 1e8 ? 'loops' : `changes until ${r1(track.until)} s`;
  return {
    frozenAt: r1(frozenAt), exportEnd: r1(exportEnd), track,
    warning: `frozen_output: the picture stops changing at ${r1(frozenAt)} s of this ${r1(exportEnd - start)} s export, but ${track.id}'s keyframe track ${runs}. `
      + 'Check the frames: the motion after that point may be missing (a track the studio stored with the wrong times, or an item hidden or off the canvas).',
  };
}
