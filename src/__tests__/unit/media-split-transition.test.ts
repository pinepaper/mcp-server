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

describe('sequence', () => {
  it('asks the studio with only what was given and returns the placement', async () => {
    let args: unknown[] = [];
    const placed = [{ id: 'a', start: 0, end: 4 }, { id: 'b', start: 4, end: 7 }];
    const A = { sequenceMedia: async (...a: unknown[]) => { args = a; return { ok: true, placed, duration: 7 }; } };
    expect(await run({ action: 'sequence' }, A)).toEqual({ success: true, action: 'sequence', placed, count: 2, duration: 7 });
    expect(args).toEqual([{}]);
    await run({ action: 'sequence', ids: ['b', 'a'], imageSeconds: 3 }, A);
    expect(args).toEqual([{ ids: ['b', 'a'], imageSeconds: 3 }]);
  });
  it('a refusal is an error with the studio\'s reason; an old studio says so', async () => {
    expect(await run({ action: 'sequence' }, { sequenceMedia: async () => ({ ok: false, reason: 'no video or image to place' }) })).toMatchObject({ success: false, action: 'sequence', error: 'no video or image to place' });
    expect((await run({ action: 'sequence' }, {})).error).toContain('too old');
  });
  it('an id with a quote stays data in the generated code', async () => {
    let args: unknown[] = [];
    await run({ action: 'sequence', ids: ["it's \"one\"`${x}"] }, { sequenceMedia: async (...a: unknown[]) => { args = a; return { ok: true, placed: [], duration: 0 }; } });
    expect(args).toEqual([{ ids: ["it's \"one\"`${x}"] }]);
  });
  it('schema: ids cannot be empty, imageSeconds is positive', () => {
    expect(MediaInputSchema.safeParse({ action: 'sequence', ids: [] }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'sequence', imageSeconds: 0 }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'sequence' }).success).toBe(true);
  });
});
