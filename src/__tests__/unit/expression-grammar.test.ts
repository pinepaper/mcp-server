import { describe, it, expect } from 'bun:test';
import { EXPRESSION_FUNCTION_ARITY } from '../../tools/engine-lists.js';
import { EXPRESSION_ARG_ORDER, expressionGrammarText } from '../../tools/expression-grammar.js';

describe('time_expression grammar text', () => {
  it('every multi-argument function the engine has states its argument order', () => {
    const multi = Object.entries(EXPRESSION_FUNCTION_ARITY).filter(([, a]) => a > 1).map(([n]) => n);
    expect(multi.filter((n) => !(n in EXPRESSION_ARG_ORDER))).toEqual([]);
    for (const n of multi) expect((EXPRESSION_ARG_ORDER[n].match(/,/g) || []).length + 1 >= EXPRESSION_FUNCTION_ARITY[n], n).toBe(true);
  });
  it('remap says x comes last', () => {
    expect(expressionGrammarText()).toContain('remap(inLo, inHi, outLo, outHi, x) (x last)');
  });
});
