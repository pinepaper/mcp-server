/**
 * The time_expression formula grammar, said once from the engine's own tables (engine-lists, generated from FxTool
 * relations/expr-to-ir.js), for the tool docs and for the refusal that names it.
 */
import { EXPRESSION_FUNCTION_ARITY, EXPRESSION_CONSTANTS } from './engine-lists.js';

/** The grammar in one line: variables, constants, operators and every function with its argument count. */
export function expressionGrammarText(): string {
  const byArity = new Map<number, string[]>();
  for (const [n, a] of Object.entries(EXPRESSION_FUNCTION_ARITY)) byArity.set(a, [...(byArity.get(a) ?? []), n]);
  const fns = [...byArity.entries()].sort((a, b) => a[0] - b[0]).map(([a, ns]) => `${a} argument${a === 1 ? '' : 's'}: ${ns.join(', ')}`).join('; ');
  return `t (seconds), v (baseValue), ${EXPRESSION_CONSTANTS.join(', ')}, numbers, + - * / % and ^ (power), parentheses; functions (${fns}). Not JavaScript: no Math., no random()`;
}
