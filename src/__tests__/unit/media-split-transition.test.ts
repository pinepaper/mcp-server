/**
 * pinepaper_media split / add_transition / set_clip move / atPlayhead
 * (engine features verified on FxTool main). Each is feature-detected, and a
 * refusal from the engine is an error, never a success.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MediaInputSchema } from '../../types/schemas.js';

const run = async (input: Record<string, unknown>, A: Record<string, unknown>, app: Record<string, unknown> = {}) => {
  const code = codeGenerator.generateMedia(MediaInputSchema.parse(input));
  return new Function('app', 'window', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)(app, { PinePaperAgent: { uploadVideo() {}, ...A } });
};

describe('split', () => {
  it('passes id and canvas time, returns both halves', async () => {
    let args: unknown[] = [];
    const r = await run({ action: 'split', id: 'item_4', at: 2.5 }, { splitMedia: async (...a: unknown[]) => { args = a; return { ok: true, leftId: 'item_4', rightId: 'item_9', at: 2.5 }; } });
    expect(args).toEqual(['item_4', 2.5]);
    expect(r).toMatchObject({ success: true, action: 'split', leftId: 'item_4', rightId: 'item_9' });
  });
  it('an engine refusal is an error; an old studio says so', async () => {
    expect(await run({ action: 'split', id: 'x', at: 9 }, { splitMedia: async () => ({ ok: false, reason: 'at 9 is outside the clip' }) })).toMatchObject({ success: false, error: 'at 9 is outside the clip' });
    expect((await run({ action: 'split', id: 'x', at: 1 }, {})).error).toContain('too old');
  });
  it('schema: needs id and at', () => {
    expect(MediaInputSchema.safeParse({ action: 'split', id: 'x' }).success).toBe(false);
  });
});

describe('add_transition', () => {
  it('passes both clips and the options', async () => {
    let args: unknown[] = [];
    const r = await run({ action: 'add_transition', fromItemId: 'a', toItemId: 'b', transition: { type: 'dip', seconds: 0.5, color: '#000' } },
      { addTransition: (...a: unknown[]) => { args = a; return { ok: true, type: 'dip' }; } });
    expect(args).toEqual(['a', 'b', { type: 'dip', seconds: 0.5, color: '#000' }]);
    expect(r).toMatchObject({ success: true, action: 'add_transition' });
  });
  it('refusals and old studios are errors', async () => {
    expect((await run({ action: 'add_transition', fromItemId: 'a', toItemId: 'b' }, { addTransition: () => ({ ok: false, reason: 'the clips do not meet' }) })).error).toBe('the clips do not meet');
    expect((await run({ action: 'add_transition', fromItemId: 'a', toItemId: 'b' }, {})).error).toContain('too old');
  });
});

describe('set_clip moves a clip where the studio can', () => {
  const media = { listMedia: () => [{ id: 'vraster_1', registryId: 'item_2' }] };
  it('new studio: the start time is the 4th argument', async () => {
    let args: unknown[] = [];
    const r = await run({ action: 'set_clip', id: 'item_2', inPoint: 1, outPoint: 3, timeOffset: 5 },
      { ...media, setMediaClip: function (a: string, b: number, c: number, d: number) { args = [a, b, c, d]; return true; } });
    expect(args).toEqual(['vraster_1', 1, 3, 5]);
    expect(r).toMatchObject({ success: true, timeOffset: 5 });
  });
  it('old studio (3-argument setMediaClip): refused, not silently re-trimmed only', async () => {
    let called = false;
    const r = await run({ action: 'set_clip', id: 'item_2', inPoint: 1, outPoint: 3, timeOffset: 5 },
      { ...media, setMediaClip: function (_a: string, _b: number, _c: number) { called = true; return true; } });
    expect(called).toBe(false);
    expect(r.error).toContain('not move');
  });
});

describe('atPlayhead', () => {
  it('starts the upload at the playback time', async () => {
    let opts: Record<string, unknown> = {};
    await run({ action: 'upload_audio', url: 'https://x.test/a.mp3', atPlayhead: true },
      { uploadAudio: async (_s: unknown, o: Record<string, unknown>) => { opts = o; return { id: 'araster_1' }; } }, { playbackTime: 7.25 });
    expect(opts.timeOffset).toBe(7.25);
    expect(MediaInputSchema.safeParse({ action: 'upload_audio', url: 'x', atPlayhead: true, timeOffset: 1 }).success).toBe(false);
  });
});
