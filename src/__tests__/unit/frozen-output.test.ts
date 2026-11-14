/**
 * LONGKEY36 / GRIEF: a 120 s export, success, 3,600 clean frames, frozen from t = 0.5 s. The delivered frames are now
 * checked against the scene's keyframe tracks.
 */
import { describe, it, expect } from 'bun:test';
import { frozenOutputCheck, SCENE_MOTION_PROBE_JS } from '../../tools/frozen-output.js';
import { noteFrozenOutput } from '../../tools/handlers.js';

/** Frame hashes at `fps` that change every frame up to `stopAt` seconds, then repeat. */
const film = (seconds: number, fps: number, stopAt: number) => ({
  video: { encode: { fps }, frameHashes: { hashes: Array.from({ length: seconds * fps }, (_, i) => Math.min(i, Math.round(stopAt * fps))) } },
});

describe('the delivered frames are checked against the scene motion', () => {
  it('GRIEF: frozen at 0.5 s while a track changes until 120 s', () => {
    const f = frozenOutputCheck(film(120, 30, 0.5), { tracks: [{ id: 'item_7', until: 120 }] });
    expect(f).not.toBeNull();
    expect(f!.frozenAt).toBe(0.5);
    expect(f!.warning).toContain("frozen_output: the picture stops changing at 0.5 s of this 120 s export, but item_7's keyframe track changes until 120 s.");
  });

  it('a film that moves as long as its tracks says nothing', () => {
    expect(frozenOutputCheck(film(10, 30, 8), { tracks: [{ id: 'a', until: 8 }] })).toBeNull();
    // a still tail after the last key is normal
    expect(frozenOutputCheck(film(10, 30, 4), { tracks: [{ id: 'a', until: 4 }] })).toBeNull();
  });

  it('a looping track that stops moving is named as looping', () => {
    const f = frozenOutputCheck(film(10, 30, 2), { tracks: [{ id: 'spin', until: 1e9 }] });
    expect(f!.warning).toContain("spin's keyframe track loops");
  });

  it('no verdict without the facts: no tracks, no hashes, or an unread frame', () => {
    expect(frozenOutputCheck(film(10, 30, 1), { tracks: [] })).toBeNull();
    expect(frozenOutputCheck({ video: {} }, { tracks: [{ id: 'a', until: 9 }] })).toBeNull();
    const unread = film(10, 30, 1); (unread.video.frameHashes.hashes as unknown[])[5] = null;
    expect(frozenOutputCheck(unread, { tracks: [{ id: 'a', until: 9 }] })).toBeNull();
    expect(frozenOutputCheck(film(10, 30, 1), null)).toBeNull();
  });

  it('the finding reaches the warning line and the result', () => {
    const r: any = { ...film(20, 10, 1), warning: 'earlier' };
    noteFrozenOutput(r, { tracks: [{ id: 'item_2', until: 20 }] });
    expect(r.warning).toStartWith('earlier frozen_output:');
    expect(r.frozenOutput).toMatchObject({ frozenAt: 1, itemId: 'item_2', trackUntil: 20 });
    expect(r.warnings[0]).toContain('frozen_output');
  });

  it('the probe reads visible changing tracks, their offset, loop and clip end', () => {
    const items = [
      { id: 'a', item: { visible: true, data: { timeOffset: 10, keyframes: [{ time: 0, properties: { x: 0 } }, { time: 5, properties: { x: 9 } }, { time: 8, properties: { x: 9 } }] } } },
      { id: 'hidden', item: { visible: false, data: { keyframes: [{ time: 0, properties: { x: 0 } }, { time: 50, properties: { x: 9 } }] } } },
      { id: 'clear', item: { opacity: 0, data: { keyframes: [{ time: 0, properties: { x: 0 } }, { time: 40, properties: { x: 9 } }] } } },
      { id: 'fadein', item: { opacity: 0, data: { keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 2, properties: { opacity: 1 } }] } } },
      { id: 'flat', item: { data: { keyframes: [{ time: 0, properties: { x: 1 } }, { time: 50, properties: { x: 1 } }] } } },
      { id: 'loop', item: { data: { keyframeLoop: true, keyframes: [{ time: 0, properties: { r: 0 } }, { time: 1, properties: { r: 90 } }] } } },
      { id: 'clipped', item: { data: { clipOutPoint: 3, keyframes: [{ time: 0, properties: { x: 0 } }, { time: 30, properties: { x: 1 } }] } } },
    ];
    const r = new Function('app', `return ${SCENE_MOTION_PROBE_JS}`)({ itemRegistry: { getAll: () => items } });
    expect(r.tracks).toEqual([{ id: 'loop', until: 1e9 }, { id: 'a', until: 15 }, { id: 'clipped', until: 3 }, { id: 'fadein', until: 2 }]);
  });
});
