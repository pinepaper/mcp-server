/**
 * on_event_step_active without a target is refused, on every path that adds a relation.
 *
 * The studio runs an event reaction only when its target exists (only on_event_play_sound is exempt), and
 * on_event_step_active acts on its GROUP, not its target. A target-less one bound, reported success and never
 * stepped (beta STEPACT30; reproduced live: three pulses, nothing active). With any member as the target, the same
 * pulses walk the group and wrap.
 */
import { describe, it, expect } from 'bun:test';
import { relationSpecProblem, codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const STEP = { groupName: 'cards', delta: 1 };

describe('on_event_step_active needs a target', () => {
  it('is refused with no target, and names the fix', () => {
    for (const t of [undefined, null, '']) {
      const why = relationSpecProblem('on_event_step_active', STEP, t);
      expect(why).toContain('needs a targetId');
      expect(why).toContain('one member of the group');
    }
  });

  it('passes with a target', () => {
    expect(relationSpecProblem('on_event_step_active', STEP, 'item_2')).toBeNull();
  });

  it('a caller with no target slot is not refused (a nested relation, checked elsewhere)', () => {
    expect(relationSpecProblem('on_event_step_active', STEP)).toBeNull();
  });

  it('other reactions are unaffected', () => {
    expect(relationSpecProblem('on_event_set_active', {}, null)).toBeNull();
  });

  it('a batch relation op without a target throws before anything binds', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'event_1', relationType: 'on_event_step_active', relationOptions: STEP }] } as never);
    expect(code).toContain('needs a targetId');
    const ok = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'event_1', targetId: 'item_2', relationType: 'on_event_step_active', relationOptions: STEP }] } as never);
    expect(ok).not.toContain('needs a targetId');
  });
});

describe('the relation docs say how a stepper is built', () => {
  const docs = PINEPAPER_TOOLS.map((t) => t.description ?? '').join('\n');
  it('membership is pairwise, active has no look of its own, step needs a target, items only orders', () => {
    expect(docs).toContain('MEMBERSHIP is pairwise');
    expect(docs).toContain('NO LOOK OF ITS OWN');
    expect(docs).toMatch(/on_event_step_active[^\n]*needs a targetId/);
    expect(docs).toContain('only sets the step order of items already in the group');
  });
});
