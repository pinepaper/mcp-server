/**
 * The time_expression formula grammar, said once from the engine's own tables (engine-lists, generated from FxTool
 * relations/expr-to-ir.js), for the tool docs and for the refusal that names it.
 */
import { EXPRESSION_FUNCTION_ARITY, EXPRESSION_CONSTANTS } from './engine-lists.js';

/**
 * Argument order for every function that takes more than one, read from FxTool relations/ExpressionIR.js and
 * expr-to-ir.js. The tables give counts, not orders, and an order is easy to guess wrong: remap takes x LAST, so
 * remap(0.5, 0, 1, 0, 10) is 20, not 5. Prose, written here; expression-grammar.test.ts fails when the engine adds a
 * multi-argument function this does not cover.
 */
export const EXPRESSION_ARG_ORDER: Readonly<Record<string, string>> = Object.freeze({
  pow: 'pow(base, exponent)',
  min: 'min(a, b)',
  max: 'max(a, b)',
  atan2: 'atan2(y, x)',
  hypot: 'hypot(x, y)',
  mod: 'mod(x, m) (floored: never negative for m > 0)',
  step: 'step(edge, x) (1 once x reaches edge)',
  pingpong: 'pingpong(t, length) (0 → length → 0)',
  clamp: 'clamp(x, lo, hi)',
  lerp: 'lerp(a, b, f)',
  smoothstep: 'smoothstep(edge0, edge1, x)',
  inverseLerp: 'inverseLerp(a, b, x)',
  remap: 'remap(inLo, inHi, outLo, outHi, x) (x last)',
});

/** The grammar in one line: variables, constants, operators and every function, with argument order where it has more than one. */
export function expressionGrammarText(): string {
  const one = Object.entries(EXPRESSION_FUNCTION_ARITY).filter(([, a]) => a === 1).map(([n]) => n);
  const more = Object.entries(EXPRESSION_FUNCTION_ARITY).filter(([, a]) => a > 1).map(([n, a]) => EXPRESSION_ARG_ORDER[n] ?? `${n} (${a} arguments)`);
  return `t (seconds), v (baseValue), ${EXPRESSION_CONSTANTS.join(', ')}, numbers, + - * / % and ^ (power), parentheses; one argument: ${one.join(', ')}; more: ${more.join(', ')}. Not JavaScript: no Math., no random()`;
}
