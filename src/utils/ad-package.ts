/**
 * Wrap the studio's standalone widget page as an ad.
 *
 * The page itself is the engine's (exportWidgetHTML: tree-shaken, no runtime
 * dependencies). What an ad network adds on top is small and fixed, so it is
 * done here, on the server, as plain string work that can be tested:
 *
 * - html5-ad (display networks: Google Ads, DV360 / CM360 and most DSPs): the
 *   `ad.size` meta, a `clickTag` variable, and a click target that opens it —
 *   the whole ad, or just a CTA's box. Uploaded as a zip.
 * - playable (MRAID 2.0/3.0 networks): `mraid.js`, a start that waits for
 *   MRAID to be ready, and a CTA that goes through `mraid.open`. A single HTML
 *   file, which is what playable networks take. A playable is interactive, so
 *   only the CTA is a click-through — a full-area link would swallow the play.
 */

export interface CtaBox { left: number; top: number; width: number; height: number } // percent of the canvas

export interface AdOptions {
  width: number;
  height: number;
  clickUrl?: string;
  cta?: CtaBox | null;
  /** The scene's background colour, pinned over the page's own (which can be stale). */
  background?: string | null;
}

/** A CSS colour we will write into a stylesheet: rgb()/rgba()/hex/a plain name only. */
const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d.,\s%]+\)|[a-z]+)$/i;

function backgroundStyle(bg: string | null | undefined): string {
  if (!bg || !SAFE_COLOR.test(bg.trim())) return '';
  return `\n<style>html,body,#w{background:${bg.trim()} !important}</style>`;
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** A string as a JS literal inside a <script> — JSON, with "</" broken so it cannot close the tag. */
const jsString = (v: string) => JSON.stringify(v).replace(/<\//g, '<\\/');

function injectHead(html: string, fragment: string): string {
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => `${m}\n${fragment}`);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${fragment}\n</head>`);
  return `<head>\n${fragment}\n</head>\n${html}`;
}

function injectBodyEnd(html: string, fragment: string): string {
  if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${fragment}\n</body>`);
  return `${html}\n${fragment}`;
}

function clickTarget(id: string, href: string, cta: CtaBox | null | undefined, label: string, position: 'absolute' | 'fixed'): string {
  const box = cta
    ? `left:${cta.left.toFixed(3)}%;top:${cta.top.toFixed(3)}%;width:${cta.width.toFixed(3)}%;height:${cta.height.toFixed(3)}%`
    : 'left:0;top:0;width:100%;height:100%';
  return `<a id="${id}" href="${href}" aria-label="${esc(label)}" style="position:${position};${box};z-index:2147483647;display:block;cursor:pointer;background:transparent"></a>`;
}

/**
 * Place the click target in the widget's own box. The page centres div#w at
 * the scene's aspect ratio (position: relative) and letterboxes it on any
 * other screen shape, so a CTA box in VIEWPORT percent lands off the button
 * on a phone that is not the ad's shape. Inside #w, absolute percentages are
 * of the canvas. (The widget appends its canvas to #w and never clears it.)
 * A page without #w gets a viewport-fixed target.
 */
function placeTarget(html: string, make: (position: 'absolute' | 'fixed') => string): string {
  const open = /<div id="w"[^>]*>/i;
  if (open.test(html)) return html.replace(open, (m) => `${m}\n${make('absolute')}`);
  return injectBodyEnd(html, make('fixed'));
}

export function buildHtml5Ad(html: string, o: AdOptions): string {
  const head = [
    `<meta name="ad.size" content="width=${Math.round(o.width)},height=${Math.round(o.height)}">`,
    // The network replaces clickTag at serve time; the value here is the
    // landing page for a test, or empty.
    `<script>var clickTag = ${jsString(o.clickUrl ?? '')};</script>`,
  ].join('\n') + backgroundStyle(o.background);
  // The pattern the display networks document: an anchor that opens
  // window.clickTag in a new window.
  return placeTarget(injectHead(html, head), (pos) => clickTarget('pp-clicktag', 'javascript:window.open(window.clickTag)', o.cta, 'Open the advertiser page', pos));
}

export function buildPlayable(html: string, o: AdOptions): string {
  const head = `<script src="mraid.js"></script>` + backgroundStyle(o.background);
  const script = `<script>
(function () {
  var url = ${jsString(o.clickUrl ?? '')};
  function openStore(e) {
    if (e) e.preventDefault();
    if (window.mraid && typeof mraid.open === 'function') mraid.open(url); else window.open(url);
  }
  function wire() {
    var a = document.getElementById('pp-cta');
    if (a) a.addEventListener('click', openStore);
  }
  if (window.mraid && typeof mraid.getState === 'function' && mraid.getState() === 'loading') {
    mraid.addEventListener('ready', wire);
  } else {
    wire();
  }
})();
</script>`;
  return injectBodyEnd(placeTarget(injectHead(html, head), (pos) => clickTarget('pp-cta', '#', o.cta, 'Install', pos)), script);
}

/** Every absolute URL the page would fetch: src / href attributes and CSS url() / @import. */
export function externalRequests(html: string): string[] {
  const out = new Set<string>();
  const patterns = [
    /\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi,
    /url\(\s*["']?(https?:\/\/[^"')\s]+)/gi,
    /@import\s+["'](https?:\/\/[^"']+)["']/gi,
  ];
  for (const re of patterns) for (const m of html.matchAll(re)) out.add(m[1]);
  return [...out];
}
