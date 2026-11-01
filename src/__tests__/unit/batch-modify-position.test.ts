/** #42: a batch modify with a top-level position moved nothing and said modified:true. */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const gen = (op: Record<string, unknown>) => codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'modify', itemId: 'b', ...op }] } as never);

describe('batch modify: top-level position', () => {
  it('{x, y} and [x, y] become properties.x / y', () => {
    expect(gen({ position: { x: 900, y: 200 } })).toMatch(/"x": 900[\s\S]*"y": 200|x: 900[\s\S]*y: 200/);
    expect(gen({ position: [600, 250] })).toMatch(/"x": 600[\s\S]*"y": 250|x: 600[\s\S]*y: 250/);
  });
  it('properties.x wins over a top-level position', () => {
    const code = gen({ position: [600, 250], properties: { x: 10 } });
    expect(code).not.toMatch(/"x": 600/);
  });
  it('a modify with nothing to change is refused, not reported modified', () => {
    expect(gen({})).toContain('modify changes nothing');
  });
});
