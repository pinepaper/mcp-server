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
});
