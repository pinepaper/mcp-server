/** D85: sounds on events — the play_sound reaction, timed events, and a sound at every scene cut. */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { EventInputSchema, ScenePlaybackInputSchema, RelationTypeSchema } from '../../types/schemas.js';

const run = (code: string, app: unknown) => new Function('app', `return ${code.replace(/^(\s*\/\/.*\n)+/, '')}`)(app);

describe('event sounds', () => {
  it('on_event_play_sound is an offered relation', () => {
    expect(RelationTypeSchema.parse('on_event_play_sound')).toBe('on_event_play_sound');
  });
  it('event create passes at through for a timed trigger', () => {
    let opts: any = null;
    const r = run(codeGenerator.generateEvent(EventInputSchema.parse({ action: 'create', name: 'pop', at: [2.5, 4] })),
      { createEvent: (_n: string, o: any) => { opts = o; return 'item_9'; }, historyManager: { saveState() {} } });
    expect(opts.at).toEqual([2.5, 4]);
    expect(r).toMatchObject({ success: true, eventId: 'item_9', at: [2.5, 4] });
  });
  it('a chain cutSound is passed, an unknown one is refused with the reason, and the cuts come back', () => {
    const input = ScenePlaybackInputSchema.parse({ action: 'create_chain', sceneIds: ['a', 'b'], cutSound: 'whoosh' });
    let got: any = null;
    const ok = run(codeGenerator.generateScenePlayback(input), { sceneManager: { createChain: (_i: any, o: any) => { got = o; return { ok: true, cuts: [{ index: 0, time: 3 }] }; } } });
    expect(got.cutSound).toBe('whoosh');
    expect(ok.cuts).toEqual([{ index: 0, time: 3 }]);
    const bad = run(codeGenerator.generateScenePlayback(input), { sceneManager: { createChain: () => ({ ok: false, reason: 'unknown sound "boing"' }) } });
    expect(bad).toMatchObject({ success: false, error: 'unknown sound "boing"' });
    const old = run(codeGenerator.generateScenePlayback(input), { sceneManager: { createChain: () => undefined } });
    expect(old.warning).toContain('D85');
  });
});

describe('a target-less relation reports no target', () => {
  it('targetId is null in the reply, not the source', async () => {
    const { AddRelationInputSchema } = await import('../../types/schemas.js');
    const code = codeGenerator.generateAddRelation(AddRelationInputSchema.parse({ sourceId: 'item_2', relationType: 'on_event_play_sound', params: { sound: 'pop' } }) as never);
    const r = run(code, { addRelation: () => true, _isKnownRelationEndpoint: () => true, historyManager: { saveState() {} } });
    expect(r).toMatchObject({ success: true, sourceId: 'item_2', targetId: null });
  });
});
