/**
 * A value as a JavaScript literal to splice into generated code.
 *
 * JSON.stringify alone is a correct JS literal, but `<`, `>`, U+2028 and U+2029
 * pass through it unescaped: "</script>" inside a string ends a script element
 * the code may be pasted into, and the two separators were line terminators in
 * JS before ES2019. Escaping them changes no value the literal evaluates to,
 * so the code is safe in any of those homes. Code scanning asks for exactly
 * this (js/bad-code-sanitization).
 */
const UNSAFE: Readonly<Record<string, string>> = {
  '<': '\\u003C',
  '>': '\\u003E',
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function escapeUnsafeChars(json: string): string {
  return json.replace(/[<>\u2028\u2029]/g, (c) => UNSAFE[c]);
}

/** JSON.stringify(value) with the unsafe characters escaped; `undefined` for a value JSON has no text for. */
export function jsLiteral(value: unknown): string {
  const json = JSON.stringify(value);
  return json === undefined ? 'undefined' : escapeUnsafeChars(json);
}
