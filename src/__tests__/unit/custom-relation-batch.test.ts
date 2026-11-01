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
