/**
 * jsLiteral: the literal evaluates to the value JSON.stringify's did, and carries no character that ends a
 * <script> element or (before ES2019) a line.
 */
import { describe, it, expect } from 'bun:test';
import { jsLiteral } from '../../utils/js-literal.js';

const evalLiteral = (src: string) => new Function(`return (${src});`)();

describe('jsLiteral', () => {
  const values: unknown[] = ['</script><script>alert(1)</script>', 'a\u2028b\u2029c', 'plain', 'quote " and \\ backslash', { a: '<b>', n: [1, '>'] }, ['x', null, true, 3.5], null];

  it('evaluates to the same value', () => {
    for (const v of values) expect(evalLiteral(jsLiteral(v))).toEqual(v);
  });

  it('has no <, > or line separators in its text', () => {
    for (const v of values) expect(jsLiteral(v)).not.toMatch(/[<>\u2028\u2029]/);
  });

  it('indents like JSON.stringify when asked', () => {
    expect(jsLiteral({ a: 1 }, 2)).toBe(JSON.stringify({ a: 1 }, null, 2));
  });

  it('undefined is the undefined literal', () => {
    expect(jsLiteral(undefined)).toBe('undefined');
  });
});
