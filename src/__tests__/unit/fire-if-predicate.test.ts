/**
 * on_event_fire_if fails silently in the engine on a bad spec (1.6.24 probe:
 * predicate "1 > 0" never fired the true branch). A string predicate evaluates
 * to 0 without a warning, and the relation pulses params.event, never its
 * target. Both are refused before anything reaches the studio.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen, fireIfProblem } from '../../types/code-generator.js';

const score3 = { op: 'cmp', cmp: 'gte', a: { op: 'graph', read: 'data', item: 'item_3', property: 'score' }, b: { op: 'const', value: 3 } };

describe('on_event_fire_if spec check', () => {
  it('refuses a string predicate, naming the IR shape', () => {
    const why = fireIfProblem({ predicate: '1 > 0', event: 'evt_2' });
    expect(why).toContain('ExpressionIR node');
    expect(why).toContain('"1 > 0"');
  });

  it('refuses a spec with no event to fire', () => {
    expect(fireIfProblem({ predicate: score3 })).toContain('params.event is missing');
    expect(fireIfProblem({ predicate: score3, else: 'evt_9' })).toBeNull();
  });

  it('checks the predicate ops\' own fields, nested', () => {
    expect(fireIfProblem({ predicate: { op: 'logic', logic: 'xor', args: [score3] }, event: 'e' })).toContain('logic must be');
    expect(fireIfProblem({ predicate: { op: 'logic', logic: 'not', args: [{ op: 'graph', read: 'data', item: 'item_3' }] }, event: 'e' }))
      .toContain('params.predicate.args[0].property');
    expect(fireIfProblem({ predicate: { op: 'cmp', cmp: '>', a: score3, b: score3 }, event: 'e' })).toContain('cmp must be');
  });

  it('lets an op it does not check through, so a newer engine op is not refused', () => {
    expect(fireIfProblem({ predicate: { op: 'time' }, event: 'e' })).toBeNull();
  });

  it('add_relation returns the refusal instead of calling the studio', () => {
    const code = gen.generateAddRelation({ sourceId: 'evt_1', targetId: 'item_2', relationType: 'on_event_fire_if', params: { predicate: '1 > 0', event: 'evt_2' } } as never);
    expect(code).not.toContain('app.addRelation');
    expect(code).toContain('success: false');
  });

  it('add_relation passes a valid nested predicate through intact', () => {
    const params = { predicate: { op: 'logic', logic: 'and', args: [score3, { op: 'graph', read: 'active', item: 'item_4' }] }, event: 'evt_2', else: 'evt_3' };
    const code = gen.generateAddRelation({ sourceId: 'evt_1', targetId: 'item_2', relationType: 'on_event_fire_if', params } as never);
    expect(code).toContain('app.addRelation');
    expect(code).toContain(JSON.stringify(params, null, 2));
  });

  it('a batch relation op is refused the same way', () => {
    const code = gen.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'evt_1', targetId: 'item_2', relationType: 'on_event_fire_if', relationOptions: { predicate: score3 } }] } as never);
    expect(code).toContain('params.event is missing');
  });
});
