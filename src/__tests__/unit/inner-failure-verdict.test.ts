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
