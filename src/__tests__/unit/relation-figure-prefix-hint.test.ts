/**
 * SPRINGSTICK40 follow-up: a stick figure's id ("bob") is the prefix of its parts, not an item, so a relation to it
 * was refused as "not an item on the canvas" with no way forward. The refusal now names a part to relate to.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator();
const run = (targetId: string, known: string[]) => {
  const code = gen.generateAddRelation({ sourceId: 'item_1', targetId, relationType: 'follows', params: {} } as never);
  const app = { _isKnownRelationEndpoint: (id: string) => known.includes(id), _resolveRelationEndpoint: (id: string) => id };
  return new Function('app', `const __r =\n${code}\nreturn __r;`)(app);
};

describe('relation to a stick figure id', () => {
  it('names a part when the id is a figure prefix', () => {
    const r = run('bob', ['item_1', 'bob_torso', 'bob_head']);
    expect(r.success).toBe(false);
    expect(r.error).toContain('"bob" is not an item on the canvas');
    expect(r.error).toContain('"bob_torso"');
    expect(r.error).toContain('prefix');
  });
  it('an id that is simply wrong gets the plain refusal', () => {
    const r = run('nope', ['item_1', 'bob_torso']);
    expect(r.success).toBe(false);
    expect(r.error).not.toContain('prefix');
  });
});
