/**
 * An emitted result that says it failed must not come back as a success.
 *
 * `executeCode`'s `success` says the CODE RAN. Almost every emitter in this
 * repo has its own verdict — `{ success: false, error }` when a guard finds a
 * subsystem missing, an engine call refuses, or a precondition is not met — and
 * nothing read it. Measured by a beta tester twice: two of five video chunks
 * silently lost under an outer `"success": true`, and a rigging session where
 * "app.riggingSystem unavailable" rode inside a success while the agent kept
 * building on a rig that did not exist.
 *
 * The check is deliberately NARROW, and these tests pin the narrowness as much
 * as the catch: most emitters return a bare value — an id, a count, a list —
 * and treating a missing `success` field as refusal would turn every one of
 * those into an error.
 */
import { describe, it, expect } from 'bun:test';
import { innerFailure } from '../../tools/handlers.js';

describe('innerFailure', () => {
  it('catches the shape the emitters actually use', () => {
    expect(innerFailure({ success: false, error: 'app.riggingSystem unavailable — update FxTool' }))
      .toBe('app.riggingSystem unavailable — update FxTool');
  });

  it('catches the export store\'s ok/reason shape too', () => {
    expect(innerFailure({ ok: false, reason: 'export was evicted to make room' }))
      .toBe('export was evicted to make room');
  });

  it('names the silence when a failure carries no reason', () => {
    expect(innerFailure({ success: false })).toContain('without naming a reason');
  });

  it('lets a declared success through', () => {
    expect(innerFailure({ success: true, itemId: 'item_1' })).toBeNull();
    expect(innerFailure({ ok: true })).toBeNull();
  });

  it('does NOT treat a bare value as a failure', () => {
    // The important half. These are ordinary successful results.
    expect(innerFailure({ itemId: 'item_1' })).toBeNull();
    expect(innerFailure({ count: 0 })).toBeNull();
    expect(innerFailure({ shapes: [], count: 0 })).toBeNull();
    expect(innerFailure([])).toBeNull();
    expect(innerFailure('item_1')).toBeNull();
    expect(innerFailure(0)).toBeNull();
    expect(innerFailure(null)).toBeNull();
    expect(innerFailure(undefined)).toBeNull();
  });

  it('does not read a falsy-but-not-false success as failure', () => {
    // `success: 0` and `success: ''` are not the emitters' vocabulary, and
    // guessing at them is how a narrow check becomes a broad one by accident.
    expect(innerFailure({ success: 0 })).toBeNull();
    expect(innerFailure({ success: '' })).toBeNull();
  });
  it('treats a bare { error } as a failure — the shape every emitter catch returns', () => {
    expect(innerFailure({ error: 'Failed to apply filter: Item is not a raster' }))
      .toBe('Failed to apply filter: Item is not a raster');
  });

  it('lets success:true win over a nested error, and ignores empty or non-string errors', () => {
    expect(innerFailure({ success: true, error: 'domain note' })).toBeNull();
    expect(innerFailure({ error: '' })).toBeNull();
    expect(innerFailure({ error: null, itemId: 'item_1' })).toBeNull();
  });
});
