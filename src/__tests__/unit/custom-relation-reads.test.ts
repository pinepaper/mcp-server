/**
 * A custom relation's options are checked against what it reads (RELWARN27: a bogus option on a built-in relation was
 * named, the same option on a custom one was stored in silence). Measured live on 1c2e17f0 after the change:
 * { amp, freq, ampp } on a relation that declares amp and reads freq → "bobble does not read ampp".
 */
import { describe, it, expect } from 'bun:test';
import { customRelationReads, codeGenerator as gen } from '../../types/code-generator.js';

describe('customRelationReads', () => {
  it('declared params, every params.X the source reads, and the name-pattern keys', () => {
    expect(customRelationReads({ amp: { type: 'number' } }, 'return { y: params.amp * Math.sin(time * params.freq) };', 'item.position.y = computed.y + params?.offset;'))
      .toEqual(['amp', 'count', 'freq', 'index', 'offset']);
  });

  it('a comment mentioning params is not a read', () => {
    expect(customRelationReads({}, '// uses params loosely\nreturn params.r;', '')).toEqual(['count', 'index', 'r']);
  });

  it('params used any other way gives no list, so nothing is wrongly named', () => {
    for (const src of ['return params[key];', 'const { r } = params; return r;', 'return helper(params);', 'return { ...params };']) {
      expect(customRelationReads({}, src, '')).toBeNull();
    }
  });
});

describe('the check runs where a custom relation is bound', () => {
  it('batch relation op and add_relation carry it; a built-in type does not', () => {
    const batch = gen.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'a', relationType: 'bobble', relationOptions: { amp: 1, ampp: 2 } }] } as never);
    expect(batch).toContain("window.__ppCustomRelations[\"bobble\"]");
    const add = gen.generateAddRelation({ sourceId: 'a', targetId: 'b', relationType: 'bobble', params: { amp: 1 } } as never, true);
    expect(add).toContain('__ppCustomRelations');
    const builtin = gen.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'a', targetId: 'b', relationType: 'orbits', relationOptions: { radius: 1 } }] } as never);
    expect(builtin).not.toContain("__ppCustomRelations[\"orbits\"]");
  });

  it('registration stores the read list', () => {
    const reg = gen.generateRegisterCustomRelation({ name: 'bobble', params: { amp: { type: 'number' } }, computeFunction: 'return { y: params.amp };', applyFunction: 'item.position.y = computed.y;' } as never);
    expect(reg).toContain('"reads":["amp","count","index"]');
  });
});
