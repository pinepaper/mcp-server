/**
 * `color` on a path: closed → fill, open → stroke (round 6 U, 1.41).
 * The engine strokes a path's color whenever no fillColor is given.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const params = (properties: Record<string, unknown>) => {
  const code = codeGenerator.generateCreateItem({ itemType: 'path', position: { x: 0, y: 0 }, properties });
  return JSON.parse(/app\.create\('path', ([\s\S]*?)\);\n/.exec(code)![1]!);
};

describe('path color', () => {
  it('fills a closed path', () => {
    expect(params({ pathData: 'M0 0 L10 0 L10 10 Z', color: '#f00' }).fillColor).toBe('#f00');
    expect(params({ segments: [[0, 0], [10, 0], [10, 10]], closed: true, color: '#f00' }).fillColor).toBe('#f00');
  });

  it('keeps stroking an open path', () => {
    expect(params({ pathData: 'M0 0 L10 10', color: '#f00' }).fillColor).toBeUndefined();
  });

  it('an explicit fillColor or strokeColor is never second-guessed', () => {
    const p = params({ pathData: 'M0 0 L10 0 L10 10 Z', color: '#f00', strokeColor: '#000' });
    expect(p.fillColor).toBeUndefined();
    expect(p.strokeColor).toBe('#000');
  });
});
