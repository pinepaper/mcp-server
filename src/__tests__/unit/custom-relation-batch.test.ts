/**
 * mcp-server#36: a relation registered with register_custom_relation is a valid relationType in a batch, as it already
 * was in add_relation; a relation op with no targetId binds the item alone (the engine takes a null target).
 */
import { describe, it, expect } from 'bun:test';
import { validateBatchVocabulary } from '../../ontology/hints.js';
import { codeGenerator } from '../../types/code-generator.js';

describe('batch: custom relations', () => {
  const ops = [{ type: 'relation', sourceId: '$1', targetId: '$0', relationType: 'bobs' }];

  it('a name registered this session passes the preflight', () => {
    expect(validateBatchVocabulary(ops, { relationType: new Set(['bobs']) })).toEqual([]);
  });

  it('an unregistered name, or a typo of a registered one, is still refused', () => {
    expect(validateBatchVocabulary(ops).length).toBe(1);
    expect(validateBatchVocabulary([{ ...ops[0], relationType: 'bobz' }], { relationType: new Set(['bobs']) }).length).toBe(1);
  });

  it('no targetId binds the item alone: a null target, no target lookup', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'item_1', relationType: 'bobs' }] } as never);
    expect(code).toContain('const targetId = null;');
    expect(code).not.toContain("Target not found: ' + targetId");
  });

  it('with a targetId, the target is still looked up and checked', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: ops } as never);
    expect(code).toContain("Target not found: ' + targetId");
  });
});

describe('mcp-server#37: name patterns, update, read-back', () => {
  const gen = (op: Record<string, unknown>) => codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', relationType: 'wave', ...op }] } as never);

  it('a name pattern binds every item named like it, in name order, with index and count', () => {
    const code = gen({ sourceId: 'dot-*' });
    expect(code).toContain('new RegExp("^dot-.*$")');
    expect(code).toContain("localeCompare(b.name, undefined, { numeric: true })");
    expect(code).toContain('{ index: i, count: __members.length }');
  });

  it('a pattern re-sent after adding members changes the bound ones instead of binding them twice', () => {
    expect(gen({ sourceId: 'dot-*' })).toContain('app.relationRegistry.getAssociations(m.id, "wave")');
  });

  it('update changes the params of the relation already bound, and says when there is none', () => {
    const code = gen({ sourceId: 'item_1', update: true, relationOptions: { amp: 90 } });
    expect(code).toContain('app.modifyRelationParams(m.id, targetId, "wave", __p)');
    expect(code).not.toContain('app.addRelation(');
    expect(code).toContain('to change: bind it first');
  });

  it('a pattern with regex characters matches them literally', () => {
    expect(gen({ sourceId: 'a.b(1)-*' })).toContain('new RegExp("^a\\\\.b\\\\(1\\\\)-.*$")');
  });

  it('lint_scene reads back the relations and the custom definitions', () => {
    const code = codeGenerator.generateLintScene({} as never);
    expect(code).toContain('queryActive()');
    expect(code).toContain('customRelations: __custom');
    expect(codeGenerator.generateRegisterCustomRelation({ name: 'wave', computeFunction: 'return {};', applyFunction: '' } as never)).toContain('window.__ppCustomRelations["wave"] = ');
  });
});

describe('time_expression formulas outside the grammar are refused (#39)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { relationSpecProblem } = require('../../types/code-generator.js');
  const why = (e: string) => relationSpecProblem('time_expression', { property: 'y', expression: e });

  it('Math.sin is refused with what to write instead', () => {
    expect(why('360 + 100*Math.sin(Math.PI*t)')).toContain('Write sin(…) without Math');
  });
  it('an unknown name, a wrong case, random(), a wrong argument count', () => {
    expect(why('foo(t)')).toContain('names foo');
    expect(why('Sin(t)')).toContain('Did you mean sin?');
    expect(why('random()')).toContain('refuses');
    expect(why('min(1, 2, 3)')).toContain('takes 2');
  });
  it('the grammar itself passes: constants, ^, %, nested calls, exponents', () => {
    for (const e of ['360 + 100*sin(PI*t)', '2^t % 3', 'clamp(t, 0, 1)*remap(t, 0, 1, 0, 10)', 'pow(2, sin(t*2))', '1e3*t + v', 'noise(t) * TAU']) expect(why(e), e).toBeNull();
  });
});
