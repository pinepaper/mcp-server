/**
 * pinepaper_media — video/audio via window.PinePaperAgent (URL-based). Emitted
 * code must match FxTool's AgentMode method contract exactly.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MediaInputSchema } from '../../types/schemas.js';

describe('MediaInputSchema validation', () => {
  it('requires url for uploads', () => {
    expect(MediaInputSchema.safeParse({ action: 'upload_video' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'upload_video', url: 'https://x/y.mp4' }).success).toBe(true);
  });
  it('requires id for remove, id+rate for set_playback_rate', () => {
    expect(MediaInputSchema.safeParse({ action: 'remove' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'remove', id: 'v1' }).success).toBe(true);
    expect(MediaInputSchema.safeParse({ action: 'set_playback_rate', id: 'v1' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_playback_rate', id: 'v1', rate: 2 }).success).toBe(true);
  });
  it('clamps rate to 0.25–4', () => {
    expect(MediaInputSchema.safeParse({ action: 'set_playback_rate', id: 'v1', rate: 8 }).success).toBe(false);
  });
  it('set_clip requires id + inPoint + outPoint with outPoint > inPoint', () => {
    expect(MediaInputSchema.safeParse({ action: 'set_clip', id: 'v1' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_clip', id: 'v1', inPoint: 1 }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_clip', id: 'v1', inPoint: 3, outPoint: 1 }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_clip', inPoint: 1, outPoint: 3 }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_clip', id: 'v1', inPoint: 1, outPoint: 3 }).success).toBe(true);
  });
});

describe('generateMedia codegen', () => {
  const guarded = (code: string) => expect(code).toContain('window.PinePaperAgent media API unavailable');
  const trailingExpr = (code: string) => expect(/\)\s*;?\s*$/.test(code.trim())).toBe(true);

  it('upload_video → awaited A.uploadVideo with placement opts', () => {
    const code = codeGenerator.generateMedia({ action: 'upload_video', url: 'https://x/y.mp4', scale: 0.5, timeOffset: 1 });
    expect(code).toContain('await A.uploadVideo("https://x/y.mp4"');
    expect(code).toContain('"scale":0.5');
    expect(code).toContain('"timeOffset":1');
    expect(code).toContain('async function');
    guarded(code); trailingExpr(code);
  });

  it('upload_audio → awaited A.uploadAudio with audio opts', () => {
    const code = codeGenerator.generateMedia({ action: 'upload_audio', url: 'https://x/a.mp3', volume: 0.3, loop: false });
    expect(code).toContain('await A.uploadAudio("https://x/a.mp3"');
    expect(code).toContain('"volume":0.3');
    expect(code).toContain('"loop":false');
    guarded(code); trailingExpr(code);
  });

  it('list / remove / set_playback_rate emit the right calls', () => {
    expect(codeGenerator.generateMedia({ action: 'list' })).toContain('A.listMedia()');
    expect(codeGenerator.generateMedia({ action: 'remove', id: 'v1' })).toContain('A.removeMedia("v1")');
    const rate = codeGenerator.generateMedia({ action: 'set_playback_rate', id: 'v1', rate: 2 });
    expect(rate).toContain('A.setMediaPlaybackRate("v1", 2)');
  });

  it('set_clip → A.setMediaClip with in/out points and its own availability guard', () => {
    const code = codeGenerator.generateMedia({ action: 'set_clip', id: 'v1', inPoint: 1.5, outPoint: 6 });
    expect(code).toContain('A.setMediaClip("v1", 1.5, 6)');
    expect(code).toContain('setMediaClip unavailable');
    guarded(code); trailingExpr(code);
  });
});

describe('video-editing actions (v1.6.4)', () => {
  // These call `app.*` PinePaper facades, not the PinePaperAgent media API —
  // asserting the exact facade name catches the guard drifting from the call.

  it('set_time_remap validates: id + a track (or explicit null to clear)', () => {
    expect(MediaInputSchema.safeParse({ action: 'set_time_remap', id: 'v1' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_time_remap', remapTrack: null }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'set_time_remap', id: 'v1', remapTrack: null }).success).toBe(true);
    expect(MediaInputSchema.safeParse({ action: 'set_time_remap', id: 'v1', remapTrack: [{ time: 0, value: 0 }, { time: 2, value: 1 }] }).success).toBe(true);
  });

  it('set_time_remap with null emits null — the documented clear, not []', () => {
    // JSON.stringify(undefined ?? null) — an emitter that dropped the null would
    // silently turn "clear my remap" into "invalid remap".
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({ action: 'set_time_remap', id: 'v1', remapTrack: null }));
    expect(c).toContain('app.setTimeRemap("v1", null)');
  });

  it('set_time_remap forwards the track with easing intact', () => {
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({
      action: 'set_time_remap', id: 'v1',
      remapTrack: [{ time: 0, value: 0 }, { time: 1, value: 3, easing: 'easeOut' }],
    }));
    expect(c).toContain('"easing":"easeOut"');
    expect(c).toContain('app.setTimeRemap unavailable');
  });

  it('speed_ramp requires non-empty segments and emits app.speedRamp', () => {
    expect(MediaInputSchema.safeParse({ action: 'speed_ramp', id: 'v1', segments: [] }).success).toBe(false);
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({
      action: 'speed_ramp', id: 'v1', segments: [{ duration: 1, speed: 1 }, { duration: 0.5, speed: 0 }],
    }));
    expect(c).toContain('app.speedRamp("v1"');
    expect(c).toContain('"speed":0'); // freeze frames are a legal segment
  });

  it('match_cut needs both shots; consent flows through', () => {
    expect(MediaInputSchema.safeParse({ action: 'match_cut', fromItemId: 'a' }).success).toBe(false);
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({
      action: 'match_cut', fromItemId: 'a', toItemId: 'b', label: 'person', consent: true, fade: 0,
    }));
    expect(c).toContain('await app.matchCut("a", "b"');
    expect(c).toContain('"consent":true');
    expect(c).toContain('"fade":0'); // 0 is a hard cut, not a missing value
  });

  it('match_cut surfaces needsConsent as an actionable failure, not success', () => {
    // The facade returns {needsConsent, cost} on first use — reporting that as
    // success would tell the agent a cut happened when nothing did.
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({ action: 'match_cut', fromItemId: 'a', toItemId: 'b' }));
    expect(c).toContain('needsConsent');
    expect(c).toContain('re-call with consent: true');
  });

  it('apply_track_matte forwards channel/live and catches the facade THROW', () => {
    // applyTrackMatte throws on a missing raster/matte rather than returning
    // {ok:false} — an emitter without try/catch turns that into an unhandled
    // rejection with no result at all.
    expect(MediaInputSchema.safeParse({ action: 'apply_track_matte', id: 'v1' }).success).toBe(false);
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({
      action: 'apply_track_matte', id: 'v1', matteItemId: 'title', channel: 'alpha', live: true,
    }));
    expect(c).toContain('await app.applyTrackMatte("v1", "title"');
    expect(c).toContain('"channel":"alpha"');
    expect(c).toContain('"live":true');
    expect(c).toContain('catch');
  });

  it('stop_live_matte emits the stop facade', () => {
    const c = codeGenerator.generateMedia(MediaInputSchema.parse({ action: 'stop_live_matte', id: 'v1' }));
    expect(c).toContain('app.stopLiveMatte("v1")');
  });

  it('none of the five double-snapshot history — the facades save state themselves', () => {
    for (const input of [
      { action: 'set_time_remap' as const, id: 'v1', remapTrack: [{ time: 0, value: 0 }, { time: 1, value: 1 }] },
      { action: 'speed_ramp' as const, id: 'v1', segments: [{ duration: 1, speed: 2 }] },
      { action: 'match_cut' as const, fromItemId: 'a', toItemId: 'b' },
      { action: 'apply_track_matte' as const, id: 'v1', matteItemId: 'm' },
      { action: 'stop_live_matte' as const, id: 'v1' },
    ]) {
      const c = codeGenerator.generateMedia(MediaInputSchema.parse(input));
      expect(c).not.toContain('historyManager.saveState');
      expect(() => new Function(c)).not.toThrow(); // and each parses
    }
  });
});
