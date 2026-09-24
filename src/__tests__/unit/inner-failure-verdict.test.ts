/**
 * `ok` is a DOMAIN verdict, not a transport one — when `success` disagrees.
 *
 * pinepaper_validate answers {success: true, ok: false, diagnostics: [...]}:
 * the call worked and the SCENE has problems, which is the entire point of the
 * tool. innerFailure treated ok:false as a failure, so it became "the studio
 * reported failure without naming a reason" and the diagnostics were dropped —
 * this guard, built to stop silent failures, silencing the one tool whose job
 * is to report them.
 *
 * Found by a QA pass that measured PinePaper's own validators catching 0 of 11
 * known silent failures. Some of that was this.
 */
import { describe, it, expect } from 'bun:test';
import { innerFailure } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';

describe('a validation verdict is not a tool failure', () => {
  it('trusts an explicit success:true over ok:false', () => {
    const r = innerFailure({ success: true, ok: false, diagnostics: [{ message: 'unknown itemType' }] });
    expect(r).toBeNull();
  });

  it('still catches a real failure', () => {
    expect(innerFailure({ success: false, error: 'boom' })).toBe('boom');
  });

  it('still catches ok:false when nothing else claims success', () => {
    expect(innerFailure({ ok: false, reason: 'refused' })).toBe('refused');
  });

  it('names the diagnostics instead of saying no reason was given', () => {
    // "failure without naming a reason" was literally false: the reason was in
    // the payload, one field over.
    const r = innerFailure({ ok: false, diagnostics: [{ message: 'bad relationType' }, { message: 'missing target' }] });
    expect(r).toContain('bad relationType');
    expect(r).toContain('missing target');
    expect(r).not.toContain('without naming a reason');
  });

  it('caps the list and says how many more there were', () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ message: `problem ${i}` }));
    const r = innerFailure({ ok: false, diagnostics: many })!;
    expect(r).toContain('7 problems');
    expect(r).toContain('+4 more');
  });

  it('falls back honestly when there really is nothing', () => {
    expect(innerFailure({ ok: false })).toContain('without naming a reason');
  });

  it('ignores anything that is not a failure at all', () => {
    expect(innerFailure({ success: true, itemId: 'item_1' })).toBeNull();
    expect(innerFailure(null)).toBeNull();
  });
});

/**
 * "No changes" and "could not read them" are different answers.
 *
 * diffHistoryStates passes raw history entries to diffScenes, and
 * HistoryManager stores them as JSON STRINGS. A string has no .items, so both
 * sides read as empty and the diff answers "no changes" for a scene that
 * plainly has items — a pilot added six items and six tracks and was told
 * nothing had changed.
 *
 * The engine owns the fix. This layer owns not repeating the claim.
 */
describe('scene_diff does not report an unreadable diff as no changes', () => {
  it('checks the live registry before believing an empty diff', () => {
    const code = codeGenerator.generateSceneDiff({ action: 'history', indexA: 0, indexB: 1 } as never);
    expect(code).toContain('app.itemRegistry');
    expect(code).toContain('saw === 0 && live > 0');
  });

  it('says which of the two answers it is, without asserting a cause it cannot know', () => {
    // The first version of this named a specific mechanism — "history entries
    // are stored as JSON strings and this build diffs them without parsing" —
    // and that was WRONG: SceneDiff's asObject() parses a string. The real
    // cause was a history entry never being written for changes that created
    // no items. The message now describes the SYMPTOM it can actually observe
    // and names the usual cause as usual, not as fact.
    const code = codeGenerator.generateSceneDiff({ action: 'history', indexA: 0, indexB: 1 } as never);
    expect(code).toContain('not the same as "nothing changed"');
    expect(code).toContain('no history entry was written');
    expect(code).not.toContain('stored as JSON strings');
  });

  it('names something that does work instead', () => {
    const code = codeGenerator.generateSceneDiff({ action: 'history', indexA: 0, indexB: 1 } as never);
    expect(code).toContain('pinepaper_get_items');
  });

  it('passes a real diff straight through', () => {
    const code = codeGenerator.generateSceneDiff({ action: 'history', indexA: 0, indexB: 1 } as never);
    expect(code).toContain('return { success: true, ...d }');
  });
});
