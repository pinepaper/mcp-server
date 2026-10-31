/* VENDORED from mcp-cloud/src/services/path-bbox.ts.
 * sha256: ab22b612e8355355552c2db1f07e48b11c17ab6c1bb44bf66c51d973c201d585
 * Generator: scripts/sync-character-modules.mjs
 *
 * Do NOT edit here — change it in mcp-cloud and re-run the generator, or the
 * two implementations drift and a figure performs differently depending on
 * which surface a caller reached. Guarded by character.test.ts.
 */
/**
 * THE TRUE BOUNDING BOX OF AN SVG PATH.
 *
 * Written for one reason: `x`/`y` is supposed to BE an item's centre — that is
 * what `itemCenter()` states and what every other shape does — and a `path`
 * was the exception nobody had noticed. The two renderers place a path by its
 * ORIGIN and agree, then disagree the moment a keyframe touches it, because
 * the engine's keyframe sets `item.position` (the centre) while the Worker
 * animates a translate delta from `it.x` (the origin). The gap is exactly this
 * box's centre. See docs/PATH_CENTRE_DIVERGENCE.md.
 *
 * CONTROL POINTS ARE NOT THE BOX. A cubic lies inside the hull of its control
 * points and generally nowhere near its edges, so min/max over the numbers in
 * the `d` string overshoots — for the measurement that sized this bug it
 * overshot by design, and using it to FIX the bug would move every path by a
 * wrong amount, in both renderers instead of one. So curves are solved:
 *
 *   cubic      B'(t) = 0 is a quadratic in t; take the real roots in (0,1)
 *   quadratic  B'(t) = 0 is linear; one root
 *   arc        the ellipse's own extrema, from the centre parameterisation,
 *              kept only where they fall inside the swept angle
 *
 * The grammar is the whole of SVG 1.1 path data: M L H V C S Q T A Z, absolute
 * and relative, with implicit repetition (`M 0 0 10 10` is a moveto and a
 * lineto) and S/T reflecting the previous control point. A model writes these
 * strings, so the parser has to accept what a model writes, not a subset.
 */

export interface Box { minX: number; minY: number; maxX: number; maxY: number }

/** Numbers, including exponent and the `.5.5` run SVG allows. */
function* tokens(d: string): Generator<string> {
  const re = /[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:[eE][-+]?\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) yield m[0];
}

const isCmd = (t: string) => /^[MmLlHhVvCcSsQqTtAaZz]$/.test(t);

/** Real roots of at² + bt + c in the open interval (0,1). */
function rootsIn01(a: number, b: number, c: number): number[] {
  const out: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) out.push(-c / b);
  } else {
    const disc = b * b - 4 * a * c;
    if (disc < 0) return out;
    const s = Math.sqrt(disc);
    out.push((-b + s) / (2 * a), (-b - s) / (2 * a));
  }
  return out.filter((t) => t > 0 && t < 1);
}

const cubicAt = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
const quadAt = (p0: number, p1: number, p2: number, t: number) => {
  const u = 1 - t;
  return u * u * p0 + 2 * u * t * p1 + t * t * p2;
};

/** Extrema of one cubic axis, endpoints included by the caller. */
function cubicExtrema(p0: number, p1: number, p2: number, p3: number): number[] {
  // B'(t) = 3[(-p0+3p1-3p2+p3)t² + 2(p0-2p1+p2)t + (p1-p0)]
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  return rootsIn01(a, b, c).map((t) => cubicAt(p0, p1, p2, p3, t));
}

function quadExtrema(p0: number, p1: number, p2: number): number[] {
  // B'(t) = 2[(p0-2p1+p2)t + (p1-p0)]
  const a = p0 - 2 * p1 + p2;
  const b = p1 - p0;
  if (Math.abs(a) < 1e-12) return [];
  const t = -b / a;
  return t > 0 && t < 1 ? [quadAt(p0, p1, p2, t)] : [];
}

/**
 * Extrema of an elliptical arc, solved rather than sampled.
 *
 * Endpoint parameterisation in, centre parameterisation out (SVG F.6.5), then
 * the four axis extrema of the rotated ellipse — dx/dθ = 0 gives
 * tan θ = -(ry/rx)·tan φ, and dy/dθ = 0 gives tan θ = (ry/rx)·cot φ — each
 * kept only if it lies inside the swept angle.
 */
function arcExtrema(
  x0: number, y0: number, rxIn: number, ryIn: number, rotDeg: number,
  largeArc: boolean, sweep: boolean, x1: number, y1: number,
): Array<[number, number]> {
  let rx = Math.abs(rxIn), ry = Math.abs(ryIn);
  if (rx < 1e-12 || ry < 1e-12) return [[x1, y1]]; // degenerates to a line
  const phi = (rotDeg * Math.PI) / 180;
  const cosP = Math.cos(phi), sinP = Math.sin(phi);
  const dx2 = (x0 - x1) / 2, dy2 = (y0 - y1) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;
  // Scale radii up if they cannot span the chord (SVG F.6.6).
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) { const s = Math.sqrt(lam); rx *= s; ry *= s; }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cosP * cxp - sinP * cyp + (x0 + x1) / 2;
  const cy = sinP * cxp + cosP * cyp + (y0 + y1) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number) => {
    const d = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    const a = Math.acos(Math.min(1, Math.max(-1, d)));
    return ux * vy - uy * vx < 0 ? -a : a;
  };
  const theta0 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const at = (t: number): [number, number] => [
    cx + rx * Math.cos(t) * cosP - ry * Math.sin(t) * sinP,
    cy + rx * Math.cos(t) * sinP + ry * Math.sin(t) * cosP,
  ];
  const inSweep = (t: number) => {
    let k = (t - theta0) / (delta || 1);
    // Normalise the candidate into the sweep's own parameter space.
    for (let n = -2; n <= 2; n++) {
      k = (t + n * 2 * Math.PI - theta0) / (delta || 1);
      if (k >= 0 && k <= 1) return true;
    }
    return false;
  };
  const cands: number[] = [];
  const tx = Math.atan2(-ry * sinP, rx * cosP);
  const ty = Math.atan2(ry * cosP, rx * sinP);
  for (const base of [tx, ty]) for (const k of [0, Math.PI]) cands.push(base + k);
  const out: Array<[number, number]> = [at(theta0), [x1, y1]];
  for (const t of cands) if (inSweep(t)) out.push(at(t));
  return out;
}

/**
 * The bounding box of a path's own coordinate space, or null if it has none
 * (empty string, no drawable command, non-finite numbers).
 */
export function pathBBox(d: string): Box | null {
  if (typeof d !== "string" || !d.trim()) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const hit = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  };

  const ts = [...tokens(d)];
  let i = 0, cmd = "", cx = 0, cy = 0, sx = 0, sy = 0;
  // Previous curve control point, for S/T reflection.
  let px: number | null = null, py: number | null = null, pq = false;
  const num = () => Number(ts[i++]);

  while (i < ts.length) {
    if (isCmd(ts[i]!)) { cmd = ts[i]!; i++; if (cmd === "Z" || cmd === "z") { cx = sx; cy = sy; continue; } }
    else if (!cmd) { i++; continue; }
    // Implicit repetition: a moveto's extra pairs are linetos.
    else if (cmd === "M") cmd = "L";
    else if (cmd === "m") cmd = "l";
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? cx : 0, oy = rel ? cy : 0;

    switch (cmd.toUpperCase()) {
      case "M": { cx = num() + ox; cy = num() + oy; sx = cx; sy = cy; hit(cx, cy); px = py = null; break; }
      case "L": { cx = num() + ox; cy = num() + oy; hit(cx, cy); px = py = null; break; }
      case "H": { cx = num() + ox; hit(cx, cy); px = py = null; break; }
      case "V": { cy = num() + oy; hit(cx, cy); px = py = null; break; }
      case "C": {
        const x1 = num() + ox, y1 = num() + oy, x2 = num() + ox, y2 = num() + oy, x = num() + ox, y = num() + oy;
        hit(cx, cy); hit(x, y);
        for (const v of cubicExtrema(cx, x1, x2, x)) hit(v, cy);
        for (const v of cubicExtrema(cy, y1, y2, y)) hit(cx, v);
        px = x2; py = y2; pq = false; cx = x; cy = y; break;
      }
      case "S": {
        const rx = pq || px === null ? cx : 2 * cx - px, ry = pq || py === null ? cy : 2 * cy - py;
        const x2 = num() + ox, y2 = num() + oy, x = num() + ox, y = num() + oy;
        hit(cx, cy); hit(x, y);
        for (const v of cubicExtrema(cx, rx, x2, x)) hit(v, cy);
        for (const v of cubicExtrema(cy, ry, y2, y)) hit(cx, v);
        px = x2; py = y2; pq = false; cx = x; cy = y; break;
      }
      case "Q": {
        const x1 = num() + ox, y1 = num() + oy, x = num() + ox, y = num() + oy;
        hit(cx, cy); hit(x, y);
        for (const v of quadExtrema(cx, x1, x)) hit(v, cy);
        for (const v of quadExtrema(cy, y1, y)) hit(cx, v);
        px = x1; py = y1; pq = true; cx = x; cy = y; break;
      }
      case "T": {
        const rqx: number = !pq || px === null ? cx : 2 * cx - px;
        const rqy: number = !pq || py === null ? cy : 2 * cy - py;
        const x = num() + ox, y = num() + oy;
        hit(cx, cy); hit(x, y);
        for (const v of quadExtrema(cx, rqx, x)) hit(v, cy);
        for (const v of quadExtrema(cy, rqy, y)) hit(cx, v);
        px = rqx; py = rqy; pq = true; cx = x; cy = y; break;
      }
      case "A": {
        const rx = num(), ry = num(), rot = num(), la = num() !== 0, sw = num() !== 0;
        const x = num() + ox, y = num() + oy;
        for (const [ax, ay] of arcExtrema(cx, cy, rx, ry, rot, la, sw, x, y)) hit(ax, ay);
        px = py = null; cx = x; cy = y; break;
      }
      default: i++; break; // unknown letter: skip rather than loop forever
    }
  }
  if (!Number.isFinite(minX) || !Number.isFinite(minY)) return null;
  return { minX, minY, maxX, maxY };
}

/** The centre of `pathBBox`, or null. */
export function pathCentre(d: string): { cx: number; cy: number } | null {
  const b = pathBBox(d);
  return b ? { cx: (b.minX + b.maxX) / 2, cy: (b.minY + b.maxY) / 2 } : null;
}

/**
 * Rewrite `d` so its own bounding box is centred on the origin, and report how
 * far it moved. Feeding that offset back into the item's x/y leaves the drawn
 * result IDENTICAL — it is a pure change of coordinates — while making `x,y`
 * mean the centre for a path, as it already does for every other shape.
 */
export function recentrePath(d: string): { path: string; dx: number; dy: number } | null {
  const c = pathCentre(d);
  if (!c || (c.cx === 0 && c.cy === 0)) return null;
  // shiftPath, not a blind numeric replace: an arc's radii, rotation and flags
  // are not coordinates, and shifting a sweep flag turns the arc inside out.
  return { path: shiftPath(d, -c.cx, -c.cy), dx: c.cx, dy: c.cy };
}

/**
 * Translate every COORDINATE in `d` by (dx,dy), leaving relative commands,
 * arc radii, rotation and flags alone. Relative commands describe deltas, so
 * they are already translation-invariant; only absolute ones move.
 */
export function shiftPath(d: string, dx: number, dy: number): string {
  const ts = [...tokens(d)];
  const out: string[] = [];
  let cmd = "", i = 0;
  // The first moveto anchors the path. A leading `m` is relative to the
  // implicit origin — i.e. absolute — so it shifts like an `M`; a later `m` is
  // a genuine delta and must not. Missing this left relative paths uncentred.
  let seenMove = false;
  const r = (v: number) => String(Math.round(v * 1e4) / 1e4);
  while (i < ts.length) {
    const t = ts[i]!;
    if (isCmd(t)) { cmd = t; out.push(t); i++; continue; }
    if (!cmd) { out.push(t); i++; continue; }
    const U = cmd.toUpperCase();
    const leadingMove = U === "M" && !seenMove;
    const rel = cmd === cmd.toLowerCase() && !leadingMove;
    if (U === "M") seenMove = true;
    const take = (n: number, shift: Array<0 | 1 | null>) => {
      for (let k = 0; k < n && i < ts.length; k++) {
        const v = Number(ts[i++]);
        const s = shift[k];
        out.push(rel || s === null ? String(v) : r(v + (s === 0 ? dx : dy)));
      }
    };
    switch (U) {
      // A LEADING `m` IS ABSOLUTE; ITS IMPLICIT LINETOS ARE NOT.
      //
      // The follow-on command was taken from `rel`, which had just been forced
      // false to make the leading moveto shift — so `m x y a b` continued as an
      // ABSOLUTE `L` and the implicit lineto was shifted like a coordinate. It
      // is a delta. Measured on an Open Peeps face: `m182.2 226 .7-.2` shifted
      // by (315,248) became `m 497.2 474 315.7 247.8` — a 0.7-unit detail
      // turned into a 300-unit line drawn across the frame, and every optimised
      // SVG in the world starts exactly like that.
      //
      // The command's own case is the answer, not the leading-move exception.
      case "M": case "L": case "T": take(2, [0, 1]); if (U === "M") cmd = cmd === "m" ? "l" : "L"; break;
      case "H": take(1, [0]); break;
      case "V": take(1, [1]); break;
      case "C": take(6, [0, 1, 0, 1, 0, 1]); break;
      case "S": case "Q": take(4, [0, 1, 0, 1]); break;
      // rx ry rot large sweep x y — only the endpoint is a coordinate.
      case "A": take(7, [null, null, null, null, null, 0, 1]); break;
      case "Z": break;
      default: out.push(ts[i++]!); break;
    }
  }
  // Re-join with the spacing SVG readers expect; commands keep their letters.
  return out.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Scale every LENGTH in `d` by (sx,sy) about the origin.
 *
 * The sibling of shiftPath, and the difference between them is the whole
 * subtlety: a translation leaves relative commands alone because a delta is
 * translation-invariant, and a scale does NOT — a delta is a length, and
 * lengths scale. Getting that backwards leaves a figure whose absolute
 * anchors move and whose curves keep their original size, which reads as the
 * drawing coming apart rather than as a wrong scale.
 *
 * An arc's radii scale; its x-axis rotation and its two flags are not lengths
 * and must be left exactly as they are. Written for baking external artwork
 * into the design graph — a corpus asset arrives in its own coordinate space
 * and has to be placed in the frame's.
 *
 * NON-UNIFORM SCALING OF AN ARC IS APPROXIMATE: an ellipse under an unequal
 * scale needs its rotation adjusted too, which is a longer computation than it
 * is worth here. Stated rather than hidden; every caller so far scales
 * uniformly, and the corpus paths carry no arcs.
 */
export function scalePath(d: string, sx: number, sy = sx): string {
  const ts = [...tokens(d)];
  const out: string[] = [];
  let cmd = "", i = 0;
  const r = (v: number) => String(Math.round(v * 1e4) / 1e4);
  while (i < ts.length) {
    const t = ts[i]!;
    if (isCmd(t)) { cmd = t; out.push(t); i++; continue; }
    if (!cmd) { out.push(t); i++; continue; }
    const U = cmd.toUpperCase();
    // `axis` is 0 for an x length, 1 for a y length, null for something that is
    // not a length at all.
    const take = (n: number, axis: Array<0 | 1 | null>) => {
      for (let k = 0; k < n && i < ts.length; k++) {
        const v = Number(ts[i++]);
        const a = axis[k];
        out.push(a === null ? String(v) : r(v * (a === 0 ? sx : sy)));
      }
    };
    switch (U) {
      case "M": case "L": case "T": take(2, [0, 1]); if (U === "M") cmd = cmd === "m" ? "l" : "L"; break;
      case "H": take(1, [0]); break;
      case "V": take(1, [1]); break;
      case "C": take(6, [0, 1, 0, 1, 0, 1]); break;
      case "S": case "Q": take(4, [0, 1, 0, 1]); break;
      // rx ry rot large sweep x y — the radii and the endpoint are lengths;
      // the rotation and the two flags are not.
      case "A": take(7, [0, 1, null, null, null, 0, 1]); break;
      case "Z": break;
      default: out.push(ts[i++]!); break;
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}
