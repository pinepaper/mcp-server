/**
 * Accessibility checks on a scene: text contrast (WCAG 2.x 1.4.3) and flashing
 * (WCAG 2.3.1, general flash threshold). The studio measures; this decides.
 *
 * Both are HEURISTICS and say so in their results. Contrast compares a text's
 * fill with the solid colour found behind it, not the rendered pixels, so a
 * photo or gradient behind text is not judged. Flash detection samples
 * luminance on a 3 x 3 grid — each cell about 11% of the frame, close to the
 * WCAG area of 341 x 256 px on a 1024 x 768 screen — and counts opposing
 * luminance changes; the red-flash threshold is not checked.
 */

export interface Rgba { r: number; g: number; b: number; a?: number } // 0-255, alpha 0-1

/** sRGB channel 0-255 → linear 0-1 (WCAG 2.x formula). */
function linear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(c: Rgba): number {
  return 0.2126 * linear(c.r) + 0.7152 * linear(c.g) + 0.0722 * linear(c.b);
}

export function contrastRatio(a: Rgba, b: Rgba): number {
  const la = relativeLuminance(a), lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** A colour with alpha over an opaque one. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg.a ?? 1;
  return { r: fg.r * a + bg.r * (1 - a), g: fg.g * a + bg.g * (1 - a), b: fg.b * a + bg.b * (1 - a), a: 1 };
}

/** 'rgb(1, 2, 3)', 'rgba(…)', '#abc', '#aabbcc' → Rgba, or null. */
export function parseCssColor(s: string | null | undefined): Rgba | null {
  if (!s) return null;
  const t = s.trim().toLowerCase();
  const m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/.exec(t);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 };
  const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t);
  if (h) {
    const x = h[1].length === 3 ? h[1].split('').map((c) => c + c).join('') : h[1];
    return { r: parseInt(x.slice(0, 2), 16), g: parseInt(x.slice(2, 4), 16), b: parseInt(x.slice(4, 6), 16), a: 1 };
  }
  return null;
}

export interface TextSample {
  id: string;
  content: string;
  fill: Rgba | null;           // null: gradient or none — not judged
  fontSize: number;
  bold: boolean;
  behind: Rgba | null;         // solid fill of the topmost item under the text's centre
  behindId?: string;
}

export interface ContrastFinding { id: string; content: string; ratio: number; required: number; large: boolean; against: string }

/**
 * WCAG AA: 4.5:1, or 3:1 for large text (>= 18 pt = 24 px, or >= 14 pt = 18.66 px bold).
 */
export function checkContrast(texts: TextSample[], page: Rgba | null): { failing: ContrastFinding[]; checked: number; skipped: Array<{ id: string; reason: string }>; pageAssumed: boolean } {
  const failing: ContrastFinding[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  const base = page && (page.a ?? 1) > 0 ? { ...page, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };
  let checked = 0;
  for (const t of texts) {
    if (!t.fill) { skipped.push({ id: t.id, reason: 'gradient or no fill' }); continue; }
    const bg = t.behind ? over(t.behind, base) : base;
    const ratio = contrastRatio(over(t.fill, bg), bg);
    const large = t.fontSize >= 24 || (t.bold && t.fontSize >= 18.66);
    const required = large ? 3 : 4.5;
    checked++;
    if (ratio < required) {
      failing.push({ id: t.id, content: t.content.slice(0, 40), ratio: Math.round(ratio * 100) / 100, required, large, against: t.behindId ? `item ${t.behindId}` : 'the page background' });
    }
  }
  return { failing, checked, skipped, pageAssumed: !page || (page.a ?? 1) === 0 };
}

export interface FlashFinding { region: number; flashesPerSecond: number; atSeconds: number }

/**
 * `series[f][cell]` = mean relative luminance of that grid cell at frame f.
 * A flash is a pair of opposing changes of >= 0.1 where the darker state is
 * below 0.8; more than three in any one-second window fails 2.3.1.
 */
export function checkFlashes(series: number[][], fps: number): { maxFlashesPerSecond: number; failing: FlashFinding[] } {
  if (series.length < 3) return { maxFlashesPerSecond: 0, failing: [] };
  const cells = series[0].length;
  const failing: FlashFinding[] = [];
  let worst = 0;
  const win = Math.max(1, Math.round(fps));
  for (let c = 0; c < cells; c++) {
    // Turning points of this cell's luminance, then the qualifying changes between them.
    const l = series.map((f) => f[c]);
    const turns: Array<{ i: number; v: number }> = [{ i: 0, v: l[0] }];
    for (let i = 1; i < l.length - 1; i++) {
      if ((l[i] - l[i - 1]) * (l[i + 1] - l[i]) < 0) turns.push({ i, v: l[i] });
    }
    turns.push({ i: l.length - 1, v: l[l.length - 1] });
    const changes: number[] = []; // frame index at which each qualifying change ends
    for (let k = 1; k < turns.length; k++) {
      const a = turns[k - 1].v, b = turns[k].v;
      if (Math.abs(a - b) >= 0.1 && Math.min(a, b) < 0.8) changes.push(turns[k].i);
    }
    let cellWorst = 0, at = 0;
    for (let s = 0; s < changes.length; s++) {
      let e = s;
      while (e + 1 < changes.length && changes[e + 1] - changes[s] < win) e++;
      const flashes = Math.floor((e - s + 1) / 2);
      if (flashes > cellWorst) { cellWorst = flashes; at = changes[s] / fps; }
    }
    worst = Math.max(worst, cellWorst);
    if (cellWorst > 3) failing.push({ region: c, flashesPerSecond: cellWorst, atSeconds: Math.round(at * 100) / 100 });
  }
  return { maxFlashesPerSecond: worst, failing };
}
