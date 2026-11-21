/**
 * WHAT A TOOL ANSWER MAY ECHO OF WHAT A CALLER SENT (field report 2026-11-21, #2).
 *
 * The cloud's answer to `pinepaper_import_svg` carried a "Generated PinePaper code" block that held the caller's
 * `svgString` verbatim. An SVG fetched from the web can carry text nobody draws — `<title>`, `<desc>`, `<metadata>`, an
 * XML comment, a processing instruction, a DOCTYPE entity, a `data-*` attribute, a `<script>` or `<foreignObject>` — and
 * a model reading the answer reads it as if the user had said it. That is prompt injection with a free delivery route.
 *
 * So what is ECHOED is stripped of everything that is not drawn. What is DRAWN is untouched: the canvas records the
 * caller's original arguments (appendCanvasOperation), and the engine's own importSVG sanitises what it draws (DOMPurify
 * svg profile, no foreignObject, no script). Nothing here changes a pixel; it only changes what the model is shown.
 * Text that IS drawn (a `<text>` node) stays: it is in the picture whatever the answer says.
 *
 * The same rule is in mcp-cloud (mcp-cloud/src/services/echo-safe.ts): its code-mode answer carried the whole file.
 */

const NS_TAG = /<([A-Za-z_][\w.-]*):([A-Za-z_][\w.-]*)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1:\2\s*>)/g;

/** SVG markup with every node that is not drawn removed. Idempotent; never throws; a non-string comes back as "". */
export function stripNonRenderedSvg(input: unknown): string {
  if (typeof input !== "string") return "";
  let s = input;
  for (let pass = 0; pass < 6; pass++) {
    const before = s;
    s = s.replace(/<!--[\s\S]*?-->/g, "").replace(/<!--[\s\S]*$/, "");                 // comments (an unterminated one takes the rest)
    s = s.replace(/<\?[\s\S]*?\?>/g, "").replace(/<\?[\s\S]*$/, "");                    // xml declaration, processing instructions
    s = s.replace(/<!DOCTYPE\b[^\[>]*(?:\[[\s\S]*?\])?\s*>/gi, "");                     // DOCTYPE with an internal subset (entities hold text)
    for (const tag of ["title", "desc", "metadata", "script", "foreignObject"]) {
      s = s.replace(new RegExp(`<${tag}\\b[^>]*?/>`, "gi"), "");
      s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?</${tag}\\s*>`, "gi"), "");
      s = s.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*$`, "gi"), "");                // opened and never closed: the rest is inside it
    }
    s = s.replace(NS_TAG, (m, prefix: string) => (prefix.toLowerCase() === "svg" ? m : ""));  // sodipodi:, inkscape:, rdf:, cc:, dc: …
    s = s.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");               // event handlers
    s = s.replace(/\s+(?:data-[\w.:-]+|aria-[\w-]+)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    s = s.replace(/\s+(?!xlink:|xml:|xmlns)[A-Za-z_][\w.-]*:[\w.-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/g, "");   // other namespaces' attributes
    s = s.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_m, a: string, body: string, z: string) => `${a}${body.replace(/\/\*[\s\S]*?\*\//g, "")}${z}`);
    if (s === before) break;
  }
  return s;
}

/**
 * Mermaid source without its comment lines. `%%{ … }%%` directives (init, config) shape the drawing and stay; a `%%` line
 * that is only a comment is not drawn.
 */
export function stripMermaidComments(input: unknown): string {
  if (typeof input !== "string") return "";
  return input.split(/\r?\n/).filter((line) => !/^\s*%%(?!\{)/.test(line)).map((line) => line.replace(/\s%%(?!\{).*$/, "")).join("\n");
}

