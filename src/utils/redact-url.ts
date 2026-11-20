/**
 * Remove the `user:password@` part of any URL in a string, so a Studio URL that carries credentials is never printed.
 * Applies to every URL inside the text (a thrown message may quote one), not only to a bare URL.
 *
 * A scan, not a regex: an unanchored scheme pattern backtracks quadratically on long runs of letters (CodeQL
 * js/polynomial-redos). Each `://` is looked at once, so the cost is linear in the text.
 */
const SCHEME_CHAR = /[a-z0-9+.-]/i;
const USERINFO_END = new Set(['/', '?', '#', '@']);

export function redactUrl(text: string): string {
  let out = '';
  let from = 0;
  for (let sep = text.indexOf('://'); sep !== -1; sep = text.indexOf('://', sep + 3)) {
    let s = sep;
    while (s > 0 && SCHEME_CHAR.test(text[s - 1])) s--;
    while (s < sep && !/[a-z]/i.test(text[s])) s++; // a scheme starts with a letter
    if (s === sep) continue;
    const start = sep + 3;
    let e = start;
    while (e < text.length && !USERINFO_END.has(text[e]) && !/\s/.test(text[e])) e++;
    if (text[e] !== '@') continue;
    out += text.slice(from, start);
    from = e + 1;
  }
  return out + text.slice(from);
}
