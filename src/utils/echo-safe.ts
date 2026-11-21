/**
 * WHAT A TOOL ANSWER MAY ECHO OF WHAT A CALLER SENT (field report 2026-11-21, #2), and what is RECORDED of it.
 *
 * An SVG fetched from the web can carry text nobody draws (`<title>`, `<desc>`, `<metadata>`, comments, processing
 * instructions, a DOCTYPE's internal subset, `<script>`), and a model that reads it reads it as if the user had said it.
 *
 * TWO LEVELS, ONE LINEAR SCANNER (no regex passes: the old ones were quadratic, 140 KB of `<title ` took 2.5 s):
 *  - RECORD (`stripSvgForRecord`): only pure-text nodes go (those five, in any namespace prefix). Attributes, `<style>`,
 *    `<foreignObject>`, `<text>` and CDATA are untouched, so what is DRAWN is byte-for-byte what the caller sent (a `[data-x]`
 *    selector, an `aria-` selector, a `<text>` that says "onion=bad" all still draw; services/echo-safe.test.ts renders both).
 *  - ECHO (`stripSvgForEcho`): what the model is shown. Also removes `<foreignObject>`, elements in another namespace
 *    (sodipodi:, inkscape:, rdf:…), event-handler / data-* / aria-* / other-namespace attributes (real attributes of real
 *    tags only), CSS comments, and replaces an attribute value over 80 characters (and a `d` or `points` that is not numbers)
 *    with a placeholder. TEXT THAT IS DRAWN (a `<text>` node, an `id` or `class` value) is part of the picture and is returned
 *    as DATA: it is not an instruction and nothing here says it is safe to obey.
 * The engine's own importSVG sanitises what it draws (DOMPurify svg profile, no foreignObject, no script).
 * The same rule is in mcp-cloud (mcp-cloud/src/services/echo-safe.ts).
 */

/** The largest SVG text a tool call may carry (bytes of UTF-16 units). One bound for the door, the library and the package. */
export const MAX_SVG_TEXT = 512 * 1024;
/** The largest Mermaid source a call may carry. */
export const MAX_MERMAID_TEXT = 128 * 1024;

type Mode = "record" | "echo";
const PURE_TEXT = new Set(["title", "desc", "metadata", "script"]);
const isNameChar = (c: number) => (c >= 48 && c <= 58) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95 || c === 45 || c === 46;
const isWs = (c: number) => c === 32 || c === 9 || c === 10 || c === 13 || c === 12;

interface Attr { name: string; raw: string; value: string }
/** Attributes of a tag body (after the name), scanned once, left to right. */
function readAttrs(body: string): Attr[] {
  const out: Attr[] = [];
  let i = 0;
  const n = body.length;
  while (i < n) {
    while (i < n && (isWs(body.charCodeAt(i)) || body[i] === "/")) i++;
    if (i >= n) break;
    const s = i;
    while (i < n && !isWs(body.charCodeAt(i)) && body[i] !== "=" && body[i] !== "/" ) i++;
    const name = body.slice(s, i);
    let j = i;
    while (j < n && isWs(body.charCodeAt(j))) j++;
    let value = "";
    let end = i;
    if (body[j] === "=") {
      j++;
      while (j < n && isWs(body.charCodeAt(j))) j++;
      if (body[j] === '"' || body[j] === "'") {
        const q = body[j]!;
        const e = body.indexOf(q, j + 1);
        value = body.slice(j + 1, e < 0 ? n : e);
        end = e < 0 ? n : e + 1;
      } else {
        const v = j;
        while (j < n && !isWs(body.charCodeAt(j))) j++;
        value = body.slice(v, j);
        end = j;
      }
    }
    if (name) out.push({ name, raw: body.slice(s, end), value });
    i = Math.max(end, i + 1);
  }
  return out;
}

const NUMERIC_GEOMETRY = /^[-+0-9.eE,\sMmLlHhVvCcSsQqTtAaZz]*$/;

function echoAttrs(attrs: Attr[], budget: { left: number }): string {
  const keep: string[] = [];
  for (const a of attrs) {
    const lower = a.name.toLowerCase();
    if (lower.startsWith("on")) continue;
    if (lower.startsWith("data-") || lower.startsWith("aria-")) continue;
    const colon = lower.indexOf(":");
    if (colon > 0 && !/^(xlink|xml|xmlns)$/.test(lower.slice(0, colon))) continue;
    if (lower === "xmlns" || lower.startsWith("xmlns:")) { keep.push(a.raw); continue; }
    if ((lower === "d" || lower === "points") && !NUMERIC_GEOMETRY.test(a.value)) { keep.push(`${a.name}="[not geometry: ${a.value.length} chars omitted]"`); continue; }
    if (lower !== "d" && lower !== "points" && a.value.length > 80) { keep.push(`${a.name}="[${a.value.length} chars omitted]"`); continue; }
    if (lower !== "d" && lower !== "points" && lower !== "xmlns") {
      if (budget.left <= 0) { keep.push(`${a.name}="[omitted]"`); continue; }
      budget.left -= a.value.length + a.name.length;
    }
    keep.push(a.raw);
  }
  return keep.length ? " " + keep.join(" ") : "";
}

function stripCssComments(css: string): string {
  let out = "";
  let i = 0;
  for (;;) {
    const a = css.indexOf("/*", i);
    if (a < 0) { out += css.slice(i); break; }
    out += css.slice(i, a);
    const b = css.indexOf("*/", a + 2);
    if (b < 0) break;
    i = b + 2;
  }
  return out;
}

/** What a model is shown of one text node or style body: a bounded head. The RECORDED copy keeps it whole. */
const MAX_ECHO_TEXT = 200;
function capText(t: string): string { return t.length > MAX_ECHO_TEXT ? `${t.slice(0, MAX_ECHO_TEXT)}[${t.length - MAX_ECHO_TEXT} chars omitted]` : t; }
/** The most attribute-value characters one echoed SVG carries (many short values must not add up to a payload). */
const ECHO_ATTR_BUDGET = 4000;

function strip(src: string, mode: Mode): string {
  const budget = { left: ECHO_ATTR_BUDGET };
  const out: string[] = [];
  const n = src.length;
  let i = 0;
  let skip: string | null = null;      // local name of the element being skipped
  let depth = 0;
  let inStyle = false;
  let textDepth = 0;                    // open <text>/<tspan>/<textPath>/<style> around the current text
  let textStart = 0;
  const flushText = (end: number) => {
    if (end <= textStart) return;
    const t = src.slice(textStart, end);
    if (skip) return;
    // Text that no element draws (between shapes, after the root, left over from a broken comment) is not part of a picture.
    if (mode === "echo" && textDepth === 0 && !inStyle && t.trim() !== "") return;
    out.push(mode === "echo" ? capText(inStyle ? stripCssComments(t) : t) : t);
  };
  while (i < n) {
    const lt = src.indexOf("<", i);
    if (lt < 0) { flushText(n); textStart = n; break; }
    const c1 = src.charCodeAt(lt + 1);
    const isTag = (c1 >= 65 && c1 <= 90) || (c1 >= 97 && c1 <= 122);
    const isClose = c1 === 47;
    const bang = c1 === 33, pi = c1 === 63;
    if (!isTag && !isClose && !bang && !pi) { i = lt + 1; continue; }     // a bare "<" in text
    flushText(lt);
    if (bang && src.startsWith("<!--", lt)) {
      const e = src.indexOf("-->", lt + 4);
      i = e < 0 ? n : e + 3; textStart = i; continue;                      // unterminated: the rest is comment
    }
    if (bang && src.startsWith("<![CDATA[", lt)) {
      const e = src.indexOf("]]>", lt + 9);
      const end = e < 0 ? n : e + 3;
      // CDATA is drawn only inside <text>/<tspan>/<textPath> and read only inside <style>; anywhere else it is not part of a picture.
      if (!skip && (textDepth > 0 || inStyle)) out.push(mode === "echo" ? capText(src.slice(lt, end)) : src.slice(lt, end));
      i = end; textStart = i; continue;
    }
    if (pi) { const e = src.indexOf("?>", lt + 2); i = e < 0 ? n : e + 2; textStart = i; continue; }
    if (bang) {                                                              // <!DOCTYPE …>: an internal subset holds entities
      let j = lt + 2, br = 0;
      while (j < n && !(src[j] === ">" && br === 0)) { if (src[j] === "[") br++; else if (src[j] === "]") br--; j++; }
      const end = Math.min(n, j + 1);
      if (!skip && !src.slice(lt, end).includes("[")) out.push(src.slice(lt, end));
      i = end; textStart = i; continue;
    }
    // A tag: scan to its ">" outside quotes, once.
    let j = lt + 1;
    let q = "";
    while (j < n) {
      const ch = src[j]!;
      if (q) { if (ch === q) q = ""; } else if (ch === '"' || ch === "'") q = ch; else if (ch === ">") break;
      j++;
    }
    if (j >= n) { i = n; textStart = n; break; }                            // unterminated tag: the rest is dropped
    const raw = src.slice(lt, j + 1);
    i = j + 1; textStart = i;
    let k = isClose ? 2 : 1;
    const ns = k;
    while (k < raw.length && isNameChar(raw.charCodeAt(k)) ) k++;
    const qname = raw.slice(ns, k);
    const colon = qname.indexOf(":");
    const prefix = colon > 0 ? qname.slice(0, colon).toLowerCase() : "";
    const local = (colon > 0 ? qname.slice(colon + 1) : qname).toLowerCase();
    const selfClosing = raw.endsWith("/>");
    if (skip) {
      if (local === skip) { if (isClose) { depth--; if (depth === 0) skip = null; } else if (!selfClosing) depth++; }
      continue;
    }
    const foreignNs = prefix !== "" && prefix !== "svg";
    const removable = PURE_TEXT.has(local) || (mode === "echo" && (local === "foreignobject" || foreignNs));
    if (removable) {
      if (!isClose && !selfClosing) { skip = local; depth = 1; }
      continue;
    }
    const bears = local === "text" || local === "tspan" || local === "textpath";
    if (isClose) { if (local === "style") inStyle = false; if (bears && textDepth > 0) textDepth--; out.push(raw); continue; }
    if (local === "style" && !selfClosing) inStyle = true;
    if (bears && !selfClosing) textDepth++;
    if (mode === "record") { out.push(raw); continue; }
    out.push(`<${qname}${echoAttrs(readAttrs(raw.slice(k, selfClosing ? -2 : -1)), budget)}${selfClosing ? "/>" : ">"}`);
  }
  return out.join("");
}

/** SVG text as it is RECORDED: pure-text nodes removed, nothing that draws touched. Linear; never throws. */
export function stripSvgForRecord(input: unknown): string { return typeof input === "string" ? strip(input, "record") : ""; }
/** SVG text as it is ECHOED to a model. Linear; never throws. */
export function stripSvgForEcho(input: unknown): string { return typeof input === "string" ? strip(input, "echo") : ""; }
/** @deprecated the echo level; kept for callers that predate the two. */
export const stripNonRenderedSvg = stripSvgForEcho;

