/**
 * on_event_step_active without a target is refused only on a studio that would drop it.
 *
 * The studio runs an event reaction only when its target exists (only on_event_play_sound is exempt), and
 * on_event_step_active acts on its GROUP, not its target. A target-less one bound, reported success and never
 * stepped (beta STEPACT30; reproduced live: three pulses, nothing active). With any member as the target, the same
 * pulses walk the group and wrap. FxTool #281 runs it target-less and lists it in TARGETLESS_EVENT_RELATIONS
 * (verified live on 1c2e17f0: 100 → 010 → 001 → 100 with no target), so the refusal is decided in the page.
 */
import { describe, it, expect } from 'bun:test';
import { relationSpecProblem, targetlessStepProblem, STEP_ACTIVE_TARGETLESS_JS, codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const STEP = { groupName: 'cards', delta: 1 };
const marker = (app: unknown) => new Function('app', `return ${STEP_ACTIVE_TARGETLESS_JS};`)(app) as boolean;

describe('a target-less on_event_step_active', () => {
  it('names the problem only with no target', () => {
    for (const t of [undefined, null, '']) expect(targetlessStepProblem('on_event_step_active', t)).toContain('needs a targetId on this studio');
    expect(targetlessStepProblem('on_event_step_active', 'item_2')).toBeNull();
    expect(targetlessStepProblem('on_event_set_active', null)).toBeNull();
  });

  it('the page check reads the studio\'s own marker', () => {
    expect(marker({ TARGETLESS_EVENT_RELATIONS: new Set(['on_event_play_sound', 'on_event_step_active']) })).toBe(true);
    expect(marker({ TARGETLESS_EVENT_RELATIONS: new Set(['on_event_play_sound']) })).toBe(false);
    expect(marker({})).toBe(false);
  });

  it('is not refused while the code is generated, except where there is no page to ask (create_scene)', () => {
    expect(relationSpecProblem('on_event_step_active', STEP, null)).toBeNull();
    expect(relationSpecProblem('on_event_step_active', STEP, null, 'no-page')).toContain('needs a targetId');
  });

  it('batch and add_relation refuse it in the page, on an older studio only', () => {
    const batch = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'event_1', relationType: 'on_event_step_active', relationOptions: STEP }] } as never);
    expect(batch).toContain(STEP_ACTIVE_TARGETLESS_JS);
    expect(batch).toContain('needs a targetId on this studio');
    const withTarget = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'event_1', targetId: 'item_2', relationType: 'on_event_step_active', relationOptions: STEP }] } as never);
    expect(withTarget).not.toContain(STEP_ACTIVE_TARGETLESS_JS);
    const add = codeGenerator.generateAddRelation({ sourceId: 'event_1', relationType: 'on_event_step_active', params: STEP } as never);
    expect(add).toContain(STEP_ACTIVE_TARGETLESS_JS);
    expect(() => new Function('app', `return ${add}`)).not.toThrow();
  });
});

describe('the relation docs say how a stepper is built', () => {
  const docs = PINEPAPER_TOOLS.map((t) => t.description ?? '').join('\n');
  it('membership is pairwise, active has no look of its own, step needs a target, items only orders', () => {
    expect(docs).toContain('MEMBERSHIP is pairwise');
    expect(docs).toContain('NO LOOK OF ITS OWN');
    expect(docs).toMatch(/on_event_step_active[^\n]*an older one needs a targetId/);
    expect(docs).toContain('only sets the step order of items already in the group');
    expect(docs).toContain("relationOptions.initial: '<itemId>' picks another, 'none' starts with none");
  });
});
