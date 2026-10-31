/**
 * A TIMELINE OP: animation written the way an agent already knows it from GSAP, compiled onto the engine's own
 * keyframe tracks.
 *
 * It is a JSON shape, never code: nothing here is evaluated. The compiler is pure (no studio, no I/O) and runs on the
 * server before anything is sent, so a tween it cannot honour is refused by name with the reason, before the canvas is
 * touched. What it produces is the same thing a keyframe_animate op produces: one track per item, written with
 * app.addAnimation, so a timeline call is exported, saved and edited exactly as hand-written keys are.
 *
 *   { "type": "timeline", "defaults": { "ease": "power2.out" }, "tweens": [
 *       { "to": "bar-*", "from": { "scaleY": 0 }, "vars": { "scaleY": 1 }, "duration": 0.8, "at": 0.5, "stagger": 0.15 },
 *       { "to": "ring", "vars": { "rotation": 480 }, "duration": 8, "ease": "none", "at": 0 } ] }
 *
 * SEMANTICS (GSAP's, where the engine can carry them):
 * - to + vars (end values), from (start values), both = fromTo. A value missing on one side is the value the item has
 *   at the tween's start: the end of the previous tween on that property, else the item's rest value, read in the studio.
 * - x and y are OFFSETS from where the item was created, as GSAP's x/y are offsets from layout (x: 0 is home).
 * - at: absolute seconds, "<" / ">" (start / end of the previous tween, optionally "<0.2", ">-0.1"), "+=0.2" / "-=0.2"
 *   (from the timeline's end), a label, or "label+=0.2". Omitted: the timeline's end. delay adds to it.
 * - stagger: seconds between targets, or { each | amount, from: start | end | center | edges | index }.
 * - repeat / yoyo / repeatDelay: a repeat that never ends on an item with nothing else is the engine's loop; anything
 *   else is expanded into keys (repeat -1 up to the timeline's duration).
 * - ease: GSAP names mapped onto the engine's easing table; a name with no equivalent is refused, never made linear.
 * - Every compiled track is as long as the timeline (its end, or `duration`), so no key can outrun its clip.
 *
 * KNOWN GAPS (the engine cannot carry them, so they are refused rather than approximated): a scale pivot left or right
 * of centre, a percentage x/y, stagger from "random" or a grid, eased parameters (back(3), elastic(1.2, 0.4)),
 * elastic/bounce inOut, steps(), callbacks, and two tweens on one property that overlap in time.
 */

import { ENGINE_EASING_NAMES } from './engine-lists.js';

// ---------------------------------------------------------------------------------------------------------------
// Types

/** What the batch knows about the items it creates, in create order: "$N" is creates[N]. */
export interface TimelineCreateInfo {
  name?: string;
  anchor?: string;
}

/** A value the studio fills in when the track is written: the item's rest value of `$rest`, plus offsets. */
export interface RestValue {
  $rest: string;
  add?: number;
  /**
   * Baseline pivot: +1 bottom, -1 top, 'anchor' = the item's own anchor (bottom-* / top-*), read in the studio.
   * y = rest + add + pivot * (h / 2) * (restScaleY - s), with s the scale at this key (or restScaleY + sAdd).
   */
  pivot?: 1 | -1 | 'anchor';
  s?: number;
  sAdd?: number;
}

export type KeyValue = number | string | number[] | RestValue;

export interface CompiledKeyframe {
  time: number;
  properties: Record<string, KeyValue>;
  easing: string;
}

export interface CompiledTrack {
  /** "$N" (an item this batch creates) or the ref as given, resolved by the studio (id, then name). */
  target: string;
  /** What the caller wrote. */
  ref: string;
  keyframes: CompiledKeyframe[];
  duration: number;
  loop: boolean;
}

export interface TweenReceipt {
  tween: number;
  compiledTo: 'track';
  targets: Array<{ ref: string; item: string; start: number; end: number | 'forever' }>;
  start: number;
  /** Seconds, or 'forever' for repeat -1. */
  end: number | 'forever';
  ease: { asked: string; engine: string };
  properties: Array<{ asked: string; engine: string; from: string; to: string }>;
  converted: string[];
  dropped: string[];
}

export interface TimelinePlan {
  tracks: CompiledTrack[];
  tweens: TweenReceipt[];
  /** The clip every non-looping track is given: the timeline's end, or its declared duration. */
  duration: number;
  notes: string[];
}

export interface TimelineError {
  path: string;
  message: string;
}

export type TimelineResult = { ok: true; plan: TimelinePlan } | { ok: false; errors: TimelineError[] };

// ---------------------------------------------------------------------------------------------------------------
// Eases

/** GSAP family → the engine's suffix. */
const EASE_FAMILY: Record<string, string> = {
  power1: 'Quad', quad: 'Quad',
  power2: 'Cubic', cubic: 'Cubic',
  power3: 'Quart', quart: 'Quart',
  power4: 'Quint', quint: 'Quint', strong: 'Quint',
  sine: 'Sine', expo: 'Expo', circ: 'Circ',
  back: 'Back', elastic: 'Elastic', bounce: 'Bounce',
};

/** GSAP's own default, used when neither the tween nor the timeline's defaults name one. */
export const GSAP_DEFAULT_EASE = 'power1.out';

/** The names this op accepts, for the refusal message. */
export const GSAP_EASE_NAMES = [
  'none', 'linear', 'power0',
  ...['power1', 'power2', 'power3', 'power4', 'sine', 'expo', 'circ', 'back'].flatMap((f) => [`${f}.in`, `${f}.out`, `${f}.inOut`]),
  'elastic.in', 'elastic.out', 'bounce.in', 'bounce.out',
] as const;

const ENGINE_EASES = new Set<string>(ENGINE_EASING_NAMES);

/** A GSAP ease name → the engine's, or the reason it has none. Also takes the engine's own names. */
export function mapGsapEase(name: string): { engine: string } | { error: string } {
  const raw = String(name).trim();
  if (ENGINE_EASES.has(raw)) return { engine: raw };
  const refuse = (why: string) => ({
    error: `ease "${raw}" ${why}. Accepted: ${GSAP_EASE_NAMES.join(', ')} (a family alone, e.g. "power2", is its .out), or an engine name: ${ENGINE_EASING_NAMES.join(', ')}.`,
  });
  // Old syntax too: Power2.easeOut, Linear.easeNone, Expo.easeInOut.
  const m = /^([a-z]+[0-4]?)(?:\.(in|out|inout|easein|easeout|easeinout|easenone))?\s*(?:\((.*)\))?$/i.exec(raw);
  if (!m) return refuse('is not an ease this op knows');
  const family = m[1].toLowerCase();
  const dir = (m[2] || 'out').toLowerCase().replace(/^ease/, '');
  const params = m[3] !== undefined ? m[3].split(',').map((s) => s.trim()).filter(Boolean).map(Number) : [];
  if (family === 'none' || family === 'linear' || family === 'power0' || dir === 'none') {
    return params.length ? refuse('takes no parameters') : { engine: 'linear' };
  }
  if (family === 'steps') return refuse('has no equivalent: the engine steps only as "hold" (one jump at the next key)');
  const suffix = EASE_FAMILY[family];
  if (!suffix) return refuse('has no equivalent in the engine');
  // A parameter changes the curve; the engine's curves are fixed. Only GSAP's own defaults are the same curve.
  if (params.length) {
    const same = (family === 'back' && params.length === 1 && Math.abs(params[0] - 1.70158) < 0.01)
      || (family === 'elastic' && Math.abs(params[0] - 1) < 1e-9 && (params.length === 1 || Math.abs(params[1] - 0.3) < 1e-9));
    if (!same) return refuse(`has parameters (${m[3]}) the engine's ${family} cannot take: its curve is fixed (back 1.70158, elastic 1, 0.3); drop them`);
  }
  if ((suffix === 'Elastic' || suffix === 'Bounce') && dir === 'inout') {
    return refuse(`has no equivalent: the engine has ${family}.in and ${family}.out only`);
  }
  const engine = dir === 'in' ? `easeIn${suffix}` : dir === 'inout' ? `easeInOut${suffix}` : `easeOut${suffix}`;
  return ENGINE_EASES.has(engine) ? { engine } : refuse('has no equivalent in the engine');
}

/** The ease of the same move played backwards (a yoyo's return), or null when the engine has none. */
function reverseEase(engine: string): string | null {
  if (engine === 'linear' || engine === 'hold' || engine === 'step' || engine.startsWith('easeInOut')) return engine;
  if (engine === 'bounce') return 'easeInBounce';
  if (engine === 'elastic') return 'easeInElastic';
  if (engine.startsWith('easeIn')) { const out = 'easeOut' + engine.slice(6); return ENGINE_EASES.has(out) ? out : null; }
  if (engine.startsWith('easeOut')) { const inn = 'easeIn' + engine.slice(7); return ENGINE_EASES.has(inn) ? inn : null; }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Properties

type Kind = 'offset' | 'number' | 'color' | 'draw' | 'dash';

/** GSAP property → [engine property, kind, how it was converted]. */
const PROPS: Record<string, { engine: string; kind: Kind; note?: string }> = {
  x: { engine: 'x', kind: 'offset' },
  y: { engine: 'y', kind: 'offset' },
  scale: { engine: 'scale', kind: 'number' },
  scaleX: { engine: 'scaleX', kind: 'number' },
  scaleY: { engine: 'scaleY', kind: 'number' },
  rotation: { engine: 'rotation', kind: 'number' },
  rotate: { engine: 'rotation', kind: 'number', note: 'rotate → rotation (degrees)' },
  opacity: { engine: 'opacity', kind: 'number' },
  autoAlpha: { engine: 'opacity', kind: 'number', note: 'autoAlpha → opacity (the item stays in the scene at 0; it is not hidden)' },
  fill: { engine: 'fillColor', kind: 'color', note: 'fill → fillColor' },
  color: { engine: 'fillColor', kind: 'color', note: 'color → fillColor' },
  fillColor: { engine: 'fillColor', kind: 'color' },
  backgroundColor: { engine: 'fillColor', kind: 'color', note: 'backgroundColor → fillColor (the item\'s own fill)' },
  stroke: { engine: 'strokeColor', kind: 'color', note: 'stroke → strokeColor' },
  strokeColor: { engine: 'strokeColor', kind: 'color' },
  strokeWidth: { engine: 'strokeWidth', kind: 'number' },
  width: { engine: 'width', kind: 'number' },
  height: { engine: 'height', kind: 'number' },
  radius: { engine: 'radius', kind: 'number' },
  fontSize: { engine: 'fontSize', kind: 'number' },
  drawSVG: { engine: 'trimEnd', kind: 'draw', note: 'drawSVG → trimStart/trimEnd (the engine\'s draw-on, 0..1 of the path)' },
  trimEnd: { engine: 'trimEnd', kind: 'number' },
  trimStart: { engine: 'trimStart', kind: 'number' },
  strokeDashoffset: { engine: 'dashOffset', kind: 'number', note: 'strokeDashoffset → dashOffset (px along the dash pattern; drawSVG is the length-free draw-on)' },
  strokeDasharray: { engine: 'dashArray', kind: 'dash', note: 'strokeDasharray → dashArray' },
};

/** GSAP's special keys, read from vars (or from) as well as the tween itself. */
const SPECIAL = ['duration', 'delay', 'ease', 'stagger', 'repeat', 'yoyo', 'repeatDelay', 'transformOrigin'] as const;
type SpecialKey = (typeof SPECIAL)[number];

/** Keys GSAP has that this op cannot carry, with the reason, so the refusal says more than "unknown". */
const REFUSED_KEYS: Record<string, string> = {
  xPercent: 'percentages of the item\'s size are not an engine property; give x in px',
  yPercent: 'percentages of the item\'s size are not an engine property; give y in px',
  rotationX: 'the canvas is 2D; 3D rotation is the camera director\'s',
  rotationY: 'the canvas is 2D; 3D rotation is the camera director\'s',
  skewX: 'skew is not keyable in the engine',
  skewY: 'skew is not keyable in the engine',
  onComplete: 'callbacks cannot cross a JSON call; nothing here runs code',
  onStart: 'callbacks cannot cross a JSON call; nothing here runs code',
  onUpdate: 'callbacks cannot cross a JSON call; nothing here runs code',
  onRepeat: 'callbacks cannot cross a JSON call; nothing here runs code',
  motionPath: 'a path to follow is a moves_along_path relation op, not a tween',
  morphSVG: 'a shape morph is a morphs_to relation op, not a tween',
  text: 'text content is discrete: key properties.content with keyframe_animate',
  immediateRender: 'the engine always shows a track\'s first key from the start (immediateRender true)',
  overwrite: 'overlapping tweens on one property are refused instead of overwritten',
  yoyoEase: 'the return of a yoyo uses the reverse of its ease; another ease is not supported',
};

const TWEEN_KEYS = new Set(['to', 'targets', 'target', 'vars', 'from', 'at', 'position', ...SPECIAL]);
const TIMELINE_KEYS = new Set(['type', 'defaults', 'tweens', 'duration', 'labels', 'repeat', 'yoyo']);

const EPS = 0.001;
const round = (t: number) => Math.round(t * 1e4) / 1e4;

// ---------------------------------------------------------------------------------------------------------------
// Values

/** A channel value as the compiler knows it: absolute, or relative to the item's rest value. */
type Val =
  | { k: 'abs'; v: number | string | number[] }
  | { k: 'rest'; add: number; pivot?: 1 | -1 | 'anchor'; s?: number; sAdd?: number };

const REST0: Val = { k: 'rest', add: 0 };

function sameVal(a: Val, b: Val): boolean {
  if (a.k !== b.k) return false;
  if (a.k === 'abs' && b.k === 'abs') return JSON.stringify(a.v) === JSON.stringify(b.v);
  const ra = a as Extract<Val, { k: 'rest' }>, rb = b as Extract<Val, { k: 'rest' }>;
  return ra.add === rb.add && ra.pivot === rb.pivot && ra.s === rb.s && ra.sAdd === rb.sAdd;
}

function describe(v: Val, prop: string): string {
  if (v.k === 'abs') return JSON.stringify(v.v);
  if (prop === 'x' || prop === 'y') {
    const base = v.add === 0 ? 'home' : `home${v.add > 0 ? '+' : ''}${v.add}`;
    return v.pivot ? `${base} (edge held at scale ${v.s ?? 'rest'})` : base;
  }
  return v.add === 0 ? 'its own value' : `its own value ${v.add > 0 ? '+' : ''}${v.add}`;
}

function toKeyValue(v: Val, engineProp: string): KeyValue {
  if (v.k === 'abs') return v.v;
  const out: RestValue = { $rest: engineProp };
  if (v.add) out.add = v.add;
  if (v.pivot) {
    out.pivot = v.pivot;
    if (v.s !== undefined) out.s = v.s;
    if (v.sAdd) out.sAdd = v.sAdd;
  }
  return out;
}

/** Parse one asked value for a property kind. `start` is what a relative "+=" is measured from. */
function parseValue(raw: unknown, kind: Kind, start: () => Val): { val: Val; note?: string } | { error: string } {
  if (kind === 'color') {
    if (typeof raw !== 'string' || !raw.trim()) return { error: 'a colour is a string such as "#22d3ee" or "rgba(0,0,0,0.5)"' };
    if (/^[+-]=/.test(raw)) return { error: 'a colour cannot be relative (+= / -=)' };
    return { val: { k: 'abs', v: raw.trim() } };
  }
  if (kind === 'dash') {
    if (typeof raw === 'number' && raw >= 0) return { val: { k: 'abs', v: [raw, raw] } };
    if (Array.isArray(raw) && raw.length >= 2 && raw.every((n) => typeof n === 'number')) return { val: { k: 'abs', v: raw as number[] } };
    if (typeof raw === 'string' && /^\s*[\d.]+(?:[\s,]+[\d.]+)+\s*$/.test(raw)) return { val: { k: 'abs', v: raw.trim().split(/[\s,]+/).map(Number) } };
    return { error: 'a dash array is a number, [dash, gap] or "dash gap" in px' };
  }
  let note: string | undefined;
  let n: number;
  let rel = 0;
  if (typeof raw === 'number') n = raw;
  else if (typeof raw === 'string') {
    const m = /^\s*([+-]=)?\s*(-?\d*\.?\d+(?:e-?\d+)?)\s*(px|deg)?\s*$/i.exec(raw);
    if (!m) {
      return { error: /%/.test(raw) ? 'a percentage is not an engine value here; give px (x, y) or a number' : `"${raw}" is not a number, "+=N" or "-=N"` };
    }
    n = Number(m[2]);
    if (m[1]) rel = m[1] === '+=' ? 1 : -1;
    if (m[3]) note = `"${raw}" → ${rel ? m[1] : ''}${n}`;
  } else return { error: 'expected a number, "+=N" or "-=N"' };
  if (!Number.isFinite(n)) return { error: 'not a finite number' };
  if (rel) {
    const s = start();
    if (s.k === 'abs') {
      if (typeof s.v !== 'number') return { error: 'a relative value needs a numeric start' };
      return { val: { k: 'abs', v: s.v + rel * n }, note };
    }
    return { val: { k: 'rest', add: s.add + rel * n }, note };
  }
  return { val: kind === 'offset' ? { k: 'rest', add: n } : { k: 'abs', v: n }, note };
}

/** drawSVG "a% b%" / "b%" / true / 0 → [trimStart, trimEnd] in 0..1. */
function parseDraw(raw: unknown): [number, number] | { error: string } {
  if (raw === true) return [0, 1];
  if (raw === 0 || raw === '0') return [0, 0];
  if (typeof raw === 'string') {
    const parts = raw.trim().split(/\s+/);
    const pct = parts.map((p) => /^(-?\d*\.?\d+)%$/.exec(p));
    if (pct.every(Boolean) && (parts.length === 1 || parts.length === 2)) {
      const nums = pct.map((m) => Number(m![1]) / 100);
      return parts.length === 1 ? [0, nums[0]] : [nums[0], nums[1]];
    }
  }
  return { error: 'drawSVG takes "N%" or "A% B%" (or true / 0); lengths in px need the path length, which this op does not know' };
}

// ---------------------------------------------------------------------------------------------------------------
// Positions and staggers

interface Cursor { end: number; prevStart: number; prevEnd: number; }

function resolveAt(at: unknown, cur: Cursor, labels: Record<string, number>): number | { error: string } {
  if (at === undefined || at === null) return cur.end;
  if (typeof at === 'number') return Number.isFinite(at) && at >= 0 ? at : { error: 'an absolute position is seconds ≥ 0' };
  if (typeof at !== 'string') return { error: 'at is seconds, "<", ">", "+=N", "-=N" or a label' };
  const s = at.trim();
  let m = /^([<>])\s*(?:([+-]=?)?\s*(\d*\.?\d+))?$/.exec(s);
  if (m) {
    const base = m[1] === '<' ? cur.prevStart : cur.prevEnd;
    const off = m[3] ? Number(m[3]) * (m[2] && m[2].startsWith('-') ? -1 : 1) : 0;
    return Math.max(0, base + off);
  }
  m = /^([+-])=\s*(\d*\.?\d+)$/.exec(s);
  if (m) return Math.max(0, cur.end + Number(m[2]) * (m[1] === '-' ? -1 : 1));
  m = /^([A-Za-z_][\w-]*)\s*(?:([+-])=\s*(\d*\.?\d+))?$/.exec(s);
  if (m) {
    if (!(m[1] in labels)) return { error: `no label "${m[1]}"; labels: ${Object.keys(labels).join(', ') || 'none (give the timeline labels: {"name": seconds})'}` };
    return Math.max(0, labels[m[1]] + (m[3] ? Number(m[3]) * (m[2] === '-' ? -1 : 1) : 0));
  }
  if (/%/.test(s)) return { error: `"${s}": percentage positions are not supported; give seconds` };
  return { error: `"${s}" is not a position: seconds, "<", ">", "<0.2", "+=0.2", "-=0.2", or a label` };
}

function staggerDelays(n: number, stagger: unknown): number[] | { error: string } {
  if (stagger === undefined || n <= 1) return new Array(n).fill(0);
  let each = 0, amount: number | undefined, from: unknown = 'start';
  if (typeof stagger === 'number') each = stagger;
  else if (stagger && typeof stagger === 'object' && !Array.isArray(stagger)) {
    const o = stagger as Record<string, unknown>;
    for (const k of Object.keys(o)) {
      if (!['each', 'amount', 'from'].includes(k)) {
        return { error: `stagger.${k} is not supported (${k === 'grid' || k === 'axis' ? 'a grid stagger needs a layout the op does not know' : k === 'ease' ? 'an eased stagger is not supported' : 'accepted: each, amount, from'})` };
      }
    }
    if (o.each !== undefined) each = Number(o.each);
    if (o.amount !== undefined) amount = Number(o.amount);
    if (o.from !== undefined) from = o.from;
  } else return { error: 'stagger is seconds, or { each | amount, from }' };
  if (!Number.isFinite(each) || (amount !== undefined && !Number.isFinite(amount))) return { error: 'stagger each / amount must be numbers' };
  const c = (n - 1) / 2;
  let d: number[];
  if (typeof from === 'number' && Number.isInteger(from) && from >= 0 && from < n) d = [...Array(n)].map((_, i) => Math.abs(i - from));
  else if (from === 'start') d = [...Array(n)].map((_, i) => i);
  else if (from === 'end') d = [...Array(n)].map((_, i) => n - 1 - i);
  else if (from === 'center') d = [...Array(n)].map((_, i) => Math.abs(i - c));
  else if (from === 'edges') d = [...Array(n)].map((_, i) => c - Math.abs(i - c));
  else return { error: `stagger.from ${JSON.stringify(from)} is not supported: start, end, center, edges, or an index 0..${n - 1}${from === 'random' ? ' (a random order would differ between renders)' : ''}` };
  const min = Math.min(...d), max = Math.max(...d);
  if (amount !== undefined) each = max > min ? amount / (max - min) : 0;
  return d.map((x) => (x - min) * each);
}

// ---------------------------------------------------------------------------------------------------------------
// The compiler

interface Segment {
  tween: number;
  target: string;
  prop: string;        // engine property
  t0: number;
  dur: number;
  from?: Val;
  to?: Val;
  ease: string;
  repeat: number;      // -1 = forever
  yoyo: boolean;
  repeatDelay: number;
  /** Baseline compensation: this y segment follows a scale channel. */
  pivotOf?: { scaleProp: string; pivot: 1 | -1 | 'anchor' };
}

/** The resolved [start, end] of each segment, filled while channels are walked (in time order). */
const resolvedEnds = new WeakMap<Segment, [Val, Val]>();

/** One segment's total length including its repeats (Infinity for repeat -1). */
const segLength = (s: Pick<Segment, 'dur' | 'repeat' | 'repeatDelay'>) =>
  s.repeat < 0 ? Infinity : s.dur * (s.repeat + 1) + s.repeatDelay * s.repeat;

function parseOrigin(raw: unknown): 1 | -1 | 0 | { error: string } {
  if (typeof raw !== 'string') return { error: 'transformOrigin is a string such as "50% 100%" or "center bottom"' };
  const words = raw.trim().toLowerCase().split(/\s+/);
  let h = 'center', v = 'center';
  const asH = (w: string) => (w === 'left' || w === '0%' ? 'left' : w === 'right' || w === '100%' ? 'right' : w === 'center' || w === '50%' ? 'center' : null);
  const asV = (w: string) => (w === 'top' || w === '0%' ? 'top' : w === 'bottom' || w === '100%' ? 'bottom' : w === 'center' || w === '50%' ? 'center' : null);
  if (words.length === 1) {
    const w = words[0];
    if (w === 'top' || w === 'bottom') v = w;
    else if (w === 'left' || w === 'right') h = w;
    else if (!(w === 'center' || w === '50%')) return { error: `transformOrigin "${raw}" is not understood` };
  } else if (words.length === 2) {
    // GSAP reads "x y", but keywords may come in either order ("bottom center").
    const [a, b] = words;
    if ((a === 'top' || a === 'bottom') && asH(b)) { v = a; h = asH(b)!; }
    else if (asH(a) && asV(b)) { h = asH(a)!; v = asV(b)!; }
    else return { error: `transformOrigin "${raw}" is not understood` };
  } else return { error: `transformOrigin "${raw}" is not understood (2D origins only)` };
  if (h !== 'center') return { error: `transformOrigin "${raw}": the engine scales x about the item's centre only; a ${h} pivot is not possible` };
  return v === 'bottom' ? 1 : v === 'top' ? -1 : 0;
}

/** Glob "bar-*" over names; "*" matches any run. */
function globToRegExp(glob: string): RegExp {
  return new RegExp('^' + glob.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$');
}

export function compileTimeline(op: Record<string, unknown>, ctx: { creates: TimelineCreateInfo[] } = { creates: [] }): TimelineResult {
  const errors: TimelineError[] = [];
  const err = (path: string, message: string) => { errors.push({ path, message }); };

  for (const k of Object.keys(op)) {
    if (!TIMELINE_KEYS.has(k)) err(k, `"${k}" is not a timeline field (accepted: ${[...TIMELINE_KEYS].filter((x) => x !== 'type').join(', ')})`);
  }
  const defaults = (op.defaults ?? {}) as Record<string, unknown>;
  if (typeof defaults !== 'object' || Array.isArray(defaults)) err('defaults', 'defaults is an object: { ease, duration }');
  else for (const k of Object.keys(defaults)) if (k !== 'ease' && k !== 'duration') err(`defaults.${k}`, `defaults takes ease and duration; put "${k}" on the tween`);
  const labels: Record<string, number> = {};
  if (op.labels !== undefined) {
    if (!op.labels || typeof op.labels !== 'object' || Array.isArray(op.labels)) err('labels', 'labels is { "name": seconds }');
    else for (const [k, v] of Object.entries(op.labels as Record<string, unknown>)) {
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) err(`labels.${k}`, 'a label is seconds ≥ 0');
      else labels[k] = v;
    }
  }
  const tlDuration = op.duration;
  if (tlDuration !== undefined && (typeof tlDuration !== 'number' || !(tlDuration > 0))) err('duration', 'the timeline duration is seconds > 0');
  const tlLoop = op.repeat === -1;
  if (op.repeat !== undefined && op.repeat !== -1 && op.repeat !== 0) err('repeat', 'a timeline repeats forever (-1, every track loops at the timeline\'s length) or not at all; repeat a tween instead');
  if (op.yoyo === true) err('yoyo', 'a whole-timeline yoyo is not supported; yoyo a tween instead');
  const tweens = op.tweens;
  if (!Array.isArray(tweens) || tweens.length === 0) {
    err('tweens', 'tweens is a non-empty array of { to, vars, from, duration, at, ... }');
    return { ok: false, errors };
  }

  const defEaseName = typeof defaults.ease === 'string' ? defaults.ease : undefined;
  const defDuration = typeof defaults.duration === 'number' ? defaults.duration : undefined;
  const notes: string[] = [];
  const segments: Segment[] = [];
  const receipts: TweenReceipt[] = [];
  const cur: Cursor = { end: 0, prevStart: 0, prevEnd: 0 };
  const pivotByTarget = new Map<string, { pivot: 1 | -1; tween: number }>();
  const userYByTarget = new Map<string, number>();
  const refByTarget = new Map<string, string>();

  const createByName = new Map<string, number[]>();
  ctx.creates.forEach((c, i) => { if (c.name) createByName.set(c.name, [...(createByName.get(c.name) || []), i]); });
  const anchorOf = (target: string): string | undefined => {
    const m = /^\$(\d+)$/.exec(target);
    return m ? ctx.creates[Number(m[1])]?.anchor : undefined;
  };

  tweens.forEach((rawTween, ti) => {
    const P = `tweens[${ti}]`;
    if (!rawTween || typeof rawTween !== 'object' || Array.isArray(rawTween)) { err(P, 'a tween is an object'); return; }
    const tw = rawTween as Record<string, unknown>;
    const before = errors.length;
    const converted: string[] = [];
    const dropped: string[] = [];
    for (const k of Object.keys(tw)) {
      if (!TWEEN_KEYS.has(k)) err(`${P}.${k}`, REFUSED_KEYS[k] ? `${k} is refused: ${REFUSED_KEYS[k]}` : `"${k}" is not a tween field (accepted: to, vars, from, duration, delay, at, stagger, repeat, yoyo, repeatDelay, ease)`);
    }
    const vars = { ...((tw.vars ?? {}) as Record<string, unknown>) };
    const fromVars = { ...((tw.from ?? {}) as Record<string, unknown>) };
    if (typeof vars !== 'object' || Array.isArray(tw.vars)) err(`${P}.vars`, 'vars is an object of end values');
    if (typeof fromVars !== 'object' || Array.isArray(tw.from)) err(`${P}.from`, 'from is an object of start values');

    // Special keys may sit on the tween or inside vars / from, as GSAP writes them.
    const special: Partial<Record<SpecialKey, unknown>> = {};
    for (const key of SPECIAL) {
      const places: Array<[string, unknown]> = [];
      if (tw[key] !== undefined) places.push([`${P}.${key}`, tw[key]]);
      if (vars[key] !== undefined) { places.push([`${P}.vars.${key}`, vars[key]]); delete vars[key]; }
      if (fromVars[key] !== undefined) { places.push([`${P}.from.${key}`, fromVars[key]]); delete fromVars[key]; }
      if (places.length > 1 && places.some(([, v]) => JSON.stringify(v) !== JSON.stringify(places[0][1]))) {
        err(places[1][0], `${key} is given twice with different values (${places.map(([p]) => p).join(', ')})`);
      }
      if (places.length) special[key] = places[0][1];
    }
    if (tw.at !== undefined && tw.position !== undefined) err(`${P}.position`, 'give at or position, not both');
    const at = tw.at ?? tw.position;

    // Targets.
    const rawTo = tw.to ?? tw.targets ?? tw.target;
    if ([tw.to, tw.targets, tw.target].filter((v) => v !== undefined).length > 1) err(`${P}.to`, 'name the targets once (to)');
    const refs = Array.isArray(rawTo) ? rawTo : rawTo === undefined ? [] : [rawTo];
    if (!refs.length) err(`${P}.to`, 'to names the item(s): a name, an id, "$N", or an array of them');
    const targets: Array<{ ref: string; target: string }> = [];
    refs.forEach((r, ri) => {
      if (typeof r !== 'string' || !r.trim()) { err(`${P}.to[${ri}]`, 'a target is a string'); return; }
      let ref = r.trim();
      if (ref.startsWith('.')) { err(`${P}.to`, `"${ref}" is a CSS class; items have names: use the name, or a name pattern like "bar-*"`); return; }
      if (ref.startsWith('#')) { converted.push(`target "${ref}" → name "${ref.slice(1)}"`); ref = ref.slice(1); }
      if (/^\$\d+$/.test(ref)) {
        if (Number(ref.slice(1)) >= ctx.creates.length) { err(`${P}.to`, `${ref} is an item this call creates, and it creates ${ctx.creates.length} before this op`); return; }
        targets.push({ ref, target: ref });
        return;
      }
      if (ref.includes('*')) {
        const re = globToRegExp(ref);
        const hits = ctx.creates.map((c, i) => (c.name && re.test(c.name) ? i : -1)).filter((i) => i >= 0);
        if (!hits.length) { err(`${P}.to`, `"${ref}" matches no item this call creates before the timeline (a name pattern is resolved against this batch's creates)`); return; }
        for (const i of hits) targets.push({ ref: ctx.creates[i].name!, target: `$${i}` });
        return;
      }
      const named = createByName.get(ref);
      if (named && named.length > 1) { err(`${P}.to`, `${named.length} items this call creates are named "${ref}"; give each its own name, or use "$N"`); return; }
      targets.push({ ref, target: named ? `$${named[0]}` : ref });
    });
    const seen = new Set<string>();
    for (const t of targets) {
      if (seen.has(t.target)) err(`${P}.to`, `"${t.ref}" is named twice in one tween`);
      seen.add(t.target);
    }

    // Timing.
    let dur = special.duration !== undefined ? special.duration : defDuration;
    if (dur === undefined) { dur = 0.5; converted.push('duration not given → 0.5 s (GSAP\'s default)'); }
    if (typeof dur !== 'number' || !Number.isFinite(dur) || dur < 0) { err(`${P}.duration`, 'duration is seconds ≥ 0'); dur = 0; }
    const delay = special.delay === undefined ? 0 : special.delay;
    if (typeof delay !== 'number' || !Number.isFinite(delay) || delay < 0) err(`${P}.delay`, 'delay is seconds ≥ 0');
    const repeat = special.repeat === undefined ? 0 : special.repeat;
    if (typeof repeat !== 'number' || !Number.isInteger(repeat) || repeat < -1) err(`${P}.repeat`, 'repeat is a whole number of extra plays, or -1 for forever');
    const yoyo = special.yoyo === true;
    if (special.yoyo !== undefined && typeof special.yoyo !== 'boolean') err(`${P}.yoyo`, 'yoyo is true or false');
    const repeatDelay = special.repeatDelay === undefined ? 0 : special.repeatDelay;
    if (typeof repeatDelay !== 'number' || repeatDelay < 0) err(`${P}.repeatDelay`, 'repeatDelay is seconds ≥ 0');
    const askedEase = typeof special.ease === 'string' ? special.ease : defEaseName ?? GSAP_DEFAULT_EASE;
    if (special.ease !== undefined && typeof special.ease !== 'string') err(`${P}.ease`, 'ease is a name such as "power2.out"');
    const mappedEase = mapGsapEase(askedEase);
    if ('error' in mappedEase) err(special.ease !== undefined ? `${P}.ease` : 'defaults.ease', mappedEase.error);
    const ease = 'engine' in mappedEase ? mappedEase.engine : 'linear';
    if (special.ease === undefined && defEaseName === undefined) converted.push(`ease not given → ${GSAP_DEFAULT_EASE} (GSAP's default) → ${ease}`);
    if (yoyo && repeat !== 0 && !reverseEase(ease)) err(`${P}.yoyo`, `ease ${ease} has no reverse in the engine, so a yoyo cannot play it back`);
    const delays = staggerDelays(targets.length, special.stagger);
    if (!Array.isArray(delays)) err(`${P}.stagger`, delays.error);
    const start = resolveAt(at, cur, labels);
    if (typeof start !== 'number') err(`${P}.at`, start.error);

    // Pivot for scale.
    let originPivot: 1 | -1 | 0 | undefined;
    if (special.transformOrigin !== undefined) {
      const o = parseOrigin(special.transformOrigin);
      if (typeof o === 'object') err(`${P}.vars.transformOrigin`, o.error);
      else originPivot = o;
    }

    // Properties.
    const propKeys = [...new Set([...Object.keys(vars), ...Object.keys(fromVars)])];
    if (!propKeys.length) err(P, 'the tween animates nothing: give vars (end values) and/or from (start values)');
    const accepted: Array<{ asked: string; spec: (typeof PROPS)[string] }> = [];
    for (const k of propKeys) {
      const spec = PROPS[k];
      if (!spec) {
        const where = k in vars ? 'vars' : 'from';
        err(`${P}.${where}.${k}`, REFUSED_KEYS[k] ? `${k} is refused: ${REFUSED_KEYS[k]}` : `"${k}" is not a property this op can animate. Accepted: ${Object.keys(PROPS).join(', ')}`);
        continue;
      }
      if (spec.note) converted.push(spec.note);
      accepted.push({ asked: k, spec });
    }
    const enginesUsed = new Map<string, string>();
    for (const a of accepted) {
      const engines = a.spec.kind === 'draw' ? ['trimStart', 'trimEnd'] : [a.spec.engine];
      for (const e of engines) {
        if (enginesUsed.has(e)) err(P, `${enginesUsed.get(e)} and ${a.asked} both animate the engine's ${e}; give one`);
        enginesUsed.set(e, a.asked);
      }
    }
    if (enginesUsed.has('scale') && (enginesUsed.has('scaleX') || enginesUsed.has('scaleY'))) err(P, 'scale and scaleX/scaleY in one tween: give one form');
    if (errors.length > before || typeof start !== 'number' || !Array.isArray(delays) || typeof dur !== 'number') return;

    const tStart = start + (delay as number);
    const one = segLength({ dur, repeat: repeat as number, repeatDelay: repeatDelay as number });
    const receiptProps: TweenReceipt['properties'] = [];
    const receiptTargets: TweenReceipt['targets'] = [];

    targets.forEach((t, i) => {
      refByTarget.set(t.target, t.ref);
      const t0 = round(tStart + delays[i]);
      const base = { tween: ti, target: t.target, t0, dur, ease, repeat: repeat as number, yoyo, repeatDelay: repeatDelay as number };
      for (const a of accepted) {
        const hasFrom = a.asked in fromVars, hasTo = a.asked in vars;
        if (a.spec.kind === 'draw') {
          const f = hasFrom ? parseDraw(fromVars[a.asked]) : undefined;
          const v = hasTo ? parseDraw(vars[a.asked]) : undefined;
          if (f && !Array.isArray(f)) { err(`${P}.from.${a.asked}`, f.error); continue; }
          if (v && !Array.isArray(v)) { err(`${P}.vars.${a.asked}`, v.error); continue; }
          const fa = f as [number, number] | undefined, va = v as [number, number] | undefined;
          const needsStart = (fa && fa[0] !== 0) || (va && va[0] !== 0);
          if (needsStart) segments.push({ ...base, prop: 'trimStart', from: fa ? { k: 'abs', v: fa[0] } : undefined, to: va ? { k: 'abs', v: va[0] } : undefined });
          segments.push({ ...base, prop: 'trimEnd', from: fa ? { k: 'abs', v: fa[1] } : undefined, to: va ? { k: 'abs', v: va[1] } : undefined });
          if (i === 0) receiptProps.push({ asked: a.asked, engine: needsStart ? 'trimStart, trimEnd' : 'trimEnd', from: fa ? JSON.stringify(fa) : 'its own value', to: va ? JSON.stringify(va) : 'its own value' });
          continue;
        }
        // A relative value is measured from the value the item has at the tween's start: resolved per channel below,
        // so it is parsed against a marker here and rebased later.
        const parse = (raw: unknown, where: string): Val | undefined => {
          const r = parseValue(raw, a.spec.kind, () => REST0);
          if ('error' in r) { err(`${P}.${where}.${a.asked}`, r.error); return undefined; }
          if (r.note && i === 0) converted.push(r.note);
          return r.val;
        };
        const relFrom = hasFrom && typeof fromVars[a.asked] === 'string' && /^\s*[+-]=/.test(fromVars[a.asked] as string);
        const relTo = hasTo && typeof vars[a.asked] === 'string' && /^\s*[+-]=/.test(vars[a.asked] as string);
        const from = hasFrom ? parse(fromVars[a.asked], 'from') : undefined;
        const to = hasTo ? parse(vars[a.asked], 'vars') : undefined;
        if ((hasFrom && !from) || (hasTo && !to)) continue;
        const seg: Segment & { relFrom?: boolean; relTo?: boolean } = { ...base, prop: a.spec.engine, from, to, relFrom, relTo };
        segments.push(seg);
        if (a.spec.engine === 'y') userYByTarget.set(t.target, ti);
        if (i === 0) receiptProps.push({ asked: a.asked, engine: a.spec.engine, from: '', to: '' });
      }
      // Baseline pivot: transformOrigin, else the item's create anchor (bottom-* / top-*), else its centre. An item this
      // batch does not create has its anchor read in the studio ('anchor').
      const scaleProp = enginesUsed.has('scaleY') ? 'scaleY' : enginesUsed.has('scale') ? 'scale' : null;
      if (scaleProp) {
        const created = /^\$\d+$/.test(t.target);
        const anchor = anchorOf(t.target);
        const pivot: 1 | -1 | 0 | 'anchor' = originPivot !== undefined ? originPivot
          : !created ? 'anchor'
            : anchor && /^bottom/.test(anchor) ? 1 : anchor && /^top/.test(anchor) ? -1 : 0;
        if (pivot === 'anchor') {
          if (i === 0) converted.push(`${scaleProp} holds the item's bottom or top edge when its anchor names one (read in the studio), with matching y keys; else it scales about the centre`);
          segments.push({ ...base, prop: 'y', pivotOf: { scaleProp, pivot } });
        } else if (pivot) {
          if (i === 0) converted.push(`${scaleProp} pivots on the item's ${pivot > 0 ? 'bottom' : 'top'} edge (${originPivot !== undefined ? 'transformOrigin' : `its anchor "${anchor}"`}): compiled as ${scaleProp} keys plus matching y keys that hold the edge`);
          pivotByTarget.set(t.target, { pivot, tween: ti });
          segments.push({ ...base, prop: 'y', pivotOf: { scaleProp, pivot } });
        }
      }
      receiptTargets.push({ ref: t.ref, item: t.target, start: t0, end: Number.isFinite(one) ? round(t0 + one) : 'forever' });
    });

    const tEnd = round(tStart + Math.max(0, ...delays) + one);
    receipts.push({
      tween: ti, compiledTo: 'track', targets: receiptTargets, start: round(tStart),
      end: Number.isFinite(tEnd) ? tEnd : 'forever', ease: { asked: askedEase, engine: ease }, properties: receiptProps,
      converted: [...new Set(converted)], dropped,
    });
    cur.prevStart = round(tStart);
    cur.prevEnd = Number.isFinite(tEnd) ? tEnd : round(tStart + dur);
    if (Number.isFinite(tEnd)) cur.end = Math.max(cur.end, tEnd);
  });

  for (const [target, { tween }] of pivotByTarget) {
    if (userYByTarget.has(target)) {
      err(`tweens[${userYByTarget.get(target)}].vars.y`, `"${refByTarget.get(target)}" scales from its edge (tween ${tween}) and also tweens y; the edge is held with y keys, so a y tween on the same item cannot be compiled. Move it with a parent group, or scale about its centre (transformOrigin "center").`);
    }
  }
  if (errors.length) return { ok: false, errors };
  // An item whose edge would be read in the studio, and that also tweens y: its y is the caller's, so it scales about
  // its centre (said in the notes).
  for (let i = segments.length - 1; i >= 0; i--) {
    const s = segments[i];
    if (s.pivotOf?.pivot === 'anchor' && userYByTarget.has(s.target)) {
      notes.push(`"${refByTarget.get(s.target)}" tweens y, so its ${s.pivotOf.scaleProp} scales about its centre whatever its anchor`);
      segments.splice(i, 1);
    }
  }

  // ---- channels: (target, prop) → ordered segments → keys
  const timelineEnd = round(cur.end);
  let clip = timelineEnd;
  if (typeof tlDuration === 'number') {
    if (tlDuration + 1e-9 < timelineEnd) {
      return { ok: false, errors: [{ path: 'duration', message: `the tweens run to ${timelineEnd} s, past the timeline's duration ${tlDuration} s; a key past its clip is never played. Make duration ≥ ${timelineEnd}, or leave it out.` }] };
    }
    clip = tlDuration;
  }

  const byChannel = new Map<string, Segment[]>();
  for (const s of segments) {
    const key = `${s.target}\u0000${s.prop}`;
    byChannel.set(key, [...(byChannel.get(key) || []), s]);
  }
  const segsByTarget = new Map<string, Segment[]>();
  for (const s of segments) segsByTarget.set(s.target, [...(segsByTarget.get(s.target) || []), s]);

  type CKey = { time: number; value: Val; ease: string | null };
  const channelKeys = new Map<string, CKey[]>();
  const loopTargets = new Map<string, number>(); // target → loop period

  // A forever-repeat is the engine's loop only when it is the item's whole story and starts at 0.
  for (const [target, segs] of segsByTarget) {
    const forever = segs.filter((s) => s.repeat < 0);
    if (!forever.length) continue;
    const tweensOn = new Set(segs.map((s) => s.tween));
    const f = forever[0];
    if (tweensOn.size === 1 && f.t0 === 0 && !tlLoop) {
      const period = f.yoyo ? 2 * (f.dur + f.repeatDelay) : f.dur + f.repeatDelay;
      if (period > 0) { loopTargets.set(target, round(period)); continue; }
    }
    if (typeof tlDuration !== 'number') {
      return { ok: false, errors: [{ path: `tweens[${f.tween}].repeat`, message: `repeat -1 on "${refByTarget.get(target)}", which ${tweensOn.size > 1 ? 'has other tweens' : 'does not start at 0'}: the engine loops a whole track, so this is expanded into keys, and that needs the timeline's duration to know where to stop. Give the timeline duration.` }] };
    }
  }

  const ordered = (a: Segment, b: Segment) => a.t0 - b.t0;
  for (const [key, segsRaw] of byChannel) {
    const segs = [...segsRaw].sort(ordered);
    const target = segs[0].target;
    const keys: CKey[] = [];
    let current: Val = REST0;
    const push = (time: number, value: Val, e: string | null) => {
      let t = round(time);
      const last = keys[keys.length - 1];
      if (last && t <= last.time + 1e-9) {
        if (sameVal(last.value, value)) return;
        t = round(last.time + EPS); // one property cannot take two values at one time: the jump lands 1 ms later
      }
      keys.push({ time: t, value, ease: e });
    };
    for (let si = 0; si < segs.length; si++) {
      const s = segs[si] as Segment & { relFrom?: boolean; relTo?: boolean };
      const prev = segs[si - 1];
      if (prev) {
        const prevEnd = prev.t0 + segLength(prev);
        if (s.t0 + 1e-9 < prevEnd) {
          return { ok: false, errors: [{ path: `tweens[${s.tween}]`, message: `on "${refByTarget.get(target)}", ${s.prop} is tweened by tween ${prev.tween} until ${round(prevEnd)} s and by tween ${s.tween} from ${s.t0} s; two tweens on one property cannot overlap (GSAP would let the later one fight the earlier). Start it at ">" or later.` }] };
        }
      }
      let a: Val, b: Val;
      if (s.pivotOf) {
        const scaleSeg = (byChannel.get(`${target}\u0000${s.pivotOf.scaleProp}`) || []).find((x) => x.tween === s.tween)!;
        const sa = resolvedEnds.get(scaleSeg);
        // The scale at each end: a number, or the item's rest scale (+ a relative offset), resolved in the studio.
        const at = (v: Val): Val | null => (v.k === 'abs'
          ? (typeof v.v === 'number' ? { k: 'rest', add: 0, pivot: s.pivotOf!.pivot, s: v.v } : null)
          : { k: 'rest', add: 0, pivot: s.pivotOf!.pivot, ...(v.add ? { sAdd: v.add } : {}) });
        const ea = sa && at(sa[0]), eb = sa && at(sa[1]);
        if (!ea || !eb) {
          return { ok: false, errors: [{ path: `tweens[${s.tween}]`, message: `"${refByTarget.get(target)}" scales from its edge, which needs ${s.pivotOf.scaleProp} as numbers` }] };
        }
        a = ea;
        b = eb;
      } else {
        const rebase = (v: Val | undefined, rel: boolean | undefined, base: Val): Val => {
          if (!v) return base;
          if (!rel) return v;
          // v was parsed relative to REST0: shift it onto the real base.
          const delta = v.k === 'rest' ? v.add : 0;
          if (base.k === 'abs' && typeof base.v === 'number') return { k: 'abs', v: base.v + delta };
          if (base.k === 'rest') return { k: 'rest', add: base.add + delta };
          return v;
        };
        // A side the tween leaves out is the value the property has when the tween starts (gsap.to / gsap.from).
        a = s.from ? rebase(s.from, s.relFrom, current) : current;
        b = s.to ? rebase(s.to, s.relTo, current) : current;
        resolvedEnds.set(s, [a, b]);
      }
      const jump = !sameVal(a, current) && keys.length > 0;
      if (!keys.length) push(s.t0, a, null);
      else push(s.t0, a, jump ? 'hold' : null);
      const back = s.yoyo ? reverseEase(s.ease)! : s.ease;
      const loops = loopTargets.has(target);
      let cycles = s.repeat < 0 ? (loops ? 1 : Infinity) : s.repeat + 1;
      if (s.repeat < 0 && loops && s.yoyo) cycles = 2;
      let t = s.t0;
      let from = a, to = b;
      for (let c = 0; c < cycles; c++) {
        if (c > 0) {
          if (s.yoyo) { [from, to] = [to, from]; }
          else push(t, a, 'hold');
        }
        if (!loops && s.repeat < 0 && t + s.dur > clip + 1e-9) {
          notes.push(`tween ${s.tween} (repeat -1) on "${refByTarget.get(target)}": ${c} cycle(s) fit before ${clip} s; it holds after the last whole one`);
          break;
        }
        t = round(t + s.dur);
        push(t, to, c > 0 && s.yoyo && c % 2 === 1 ? back : s.ease);
        if (s.repeatDelay > 0 && (c < cycles - 1 || loops)) { t = round(t + s.repeatDelay); push(t, to, null); }
      }
      current = to;
    }
    channelKeys.set(key, keys);
  }

  // ---- items: merge their channels into one track each
  const tracks: CompiledTrack[] = [];
  for (const [target] of segsByTarget) {
    const chans = [...channelKeys.entries()].filter(([k]) => k.startsWith(`${target}\u0000`)).map(([k, keys]) => [k.split('\u0000')[1], keys] as const);
    const firstAt = Math.min(...chans.map(([, keys]) => keys[0].time));
    const byTime = new Map<number, { props: Record<string, KeyValue>; ease: string | null }>();
    for (const [prop, keys0] of chans) {
      // Every property holds a key at the item's first key time, so the engine never tweens it from its rest value
      // across a span it was not asked to move in.
      const keys = keys0[0].time > firstAt ? [{ time: firstAt, value: keys0[0].value, ease: null }, ...keys0] : keys0;
      for (const k of keys) {
        let t = k.time;
        for (;;) {
          const slot = byTime.get(t);
          if (!slot) break;
          const free = slot.props[prop] === undefined;
          if (free && (k.ease === null || slot.ease === null || slot.ease === k.ease)) break;
          // One key carries one easing: a property arriving here on another ease lands 1 ms later.
          if (free) notes.push(`on "${refByTarget.get(target)}", ${prop} arrives at ${k.time} s on ${k.ease} while another property arrives there on ${slot.ease}; one key carries one ease, so ${prop}'s key is ${round(t + EPS - k.time) * 1000} ms later`);
          t = round(t + EPS);
        }
        const slot = byTime.get(t) || { props: {}, ease: null };
        slot.props[prop] = toKeyValue(k.value, prop);
        if (k.ease !== null) slot.ease = k.ease;
        byTime.set(t, slot);
      }
    }
    const keyframes = [...byTime.entries()].sort((a, b) => a[0] - b[0])
      .map(([time, s]) => ({ time, properties: s.props, easing: s.ease ?? 'linear' }));
    const last = keyframes[keyframes.length - 1].time;
    const period = loopTargets.get(target);
    const loop = period !== undefined || tlLoop;
    const duration = period !== undefined ? period : Math.max(clip, last);
    tracks.push({ target, ref: refByTarget.get(target) || target, keyframes, duration, loop });
  }

  // Fill in the receipt's from/to per property, now the channels are resolved.
  for (const r of receipts) {
    for (const p of r.properties) {
      if (p.from) continue;
      const seg = segments.find((s) => s.tween === r.tween && s.prop === p.engine && !s.pivotOf);
      const ends = seg && resolvedEnds.get(seg);
      if (ends) { p.from = describe(ends[0], p.engine); p.to = describe(ends[1], p.engine); }
    }
  }
  if (tlLoop) notes.push(`repeat -1: every track loops at ${clip} s`);
  return { ok: true, plan: { tracks, tweens: receipts, duration: clip, notes: [...new Set(notes)] } };
}

// ---------------------------------------------------------------------------------------------------------------
// Batch integration

/** What the batch creates, in create order, for name resolution and anchors. */
export function batchCreatesBefore(operations: ReadonlyArray<Record<string, unknown>>, index: number): TimelineCreateInfo[] {
  const out: TimelineCreateInfo[] = [];
  for (let i = 0; i < index; i++) {
    const op = operations[i];
    if (op.type !== 'create') continue;
    const p = (op.properties || {}) as Record<string, unknown>;
    const name = typeof p.name === 'string' ? p.name : typeof op.name === 'string' ? (op.name as string) : undefined;
    const anchor = p.anchor ?? p.origin ?? op.anchor;
    out.push({ name, anchor: typeof anchor === 'string' ? anchor.toLowerCase().replace(/[\s_]+/g, '-') : undefined });
  }
  return out;
}

/**
 * Compile every timeline op in a batch. Errors come back with batch paths (operations[i].tweens[j]…). Also refused: a
 * timeline track and a keyframe_animate op on the same item in one batch, or two timelines on one item — each writes
 * the item's whole track, so one would silently replace the other.
 */
export function compileBatchTimelines(operations: ReadonlyArray<Record<string, unknown>>): {
  plans: Map<number, TimelinePlan>;
  errors: TimelineError[];
} {
  const plans = new Map<number, TimelinePlan>();
  const errors: TimelineError[] = [];
  const owner = new Map<string, string>();
  operations.forEach((op, i) => {
    if (op.type !== 'timeline') return;
    const r = compileTimeline(op, { creates: batchCreatesBefore(operations, i) });
    if (!r.ok) { for (const e of r.errors) errors.push({ path: `operations[${i}].${e.path}`, message: e.message }); return; }
    for (const t of r.plan.tracks) {
      const was = owner.get(t.target);
      if (was) errors.push({ path: `operations[${i}]`, message: `"${t.ref}" is also animated by ${was}; one batch gives an item one timeline (put all its tweens in one)` });
      else owner.set(t.target, `operations[${i}] (timeline)`);
    }
    plans.set(i, r.plan);
  });
  operations.forEach((op, i) => {
    if (op.type !== 'keyframe_animate' || typeof op.itemId !== 'string') return;
    const was = owner.get(op.itemId);
    if (was) errors.push({ path: `operations[${i}].itemId`, message: `${op.itemId} is animated by ${was}, and a keyframe_animate op would replace that track (or be replaced by it). Put its keys in the timeline as tweens.` });
  });
  return { plans, errors };
}

// ---------------------------------------------------------------------------------------------------------------
// The emitted op

/**
 * The body of a batch op (a function body that returns the op's result) that writes a compiled timeline: one
 * app.addAnimation per item, the same call keyframe_animate makes. Values the compiler could not know (an item's rest
 * position, rotation, opacity, colour) are read from the item here, from its rest state when it has one.
 * `refExpr` turns a "$N" target into the batch's runtime reference.
 */
export function emitTimelineOpBody(plan: TimelinePlan, refExpr: (target: string) => string): string {
  const J = (v: unknown) => JSON.stringify(v);
  const tracks = plan.tracks.map((t) => `
  {
    const __tr = ${refExpr(t.target)};
    const __hit = (app.getItemById && app.getItemById(__tr))
      || (app.itemRegistry && app.itemRegistry.get && app.itemRegistry.get(__tr))
      || (typeof app.resolveRef === 'function' ? app.resolveRef(__tr) : null);
    if (!__hit) return { success: false, itemId: __tr, error: 'timeline: no item has the id or name ' + ${J(J(t.ref))} + (typeof app.resolveRef === 'function' ? '' : ' (this studio resolves ids only; it predates names)'), timeline: { tracks: __ppTl } };
    const __it = __hit.item || __hit;
    const __id = (__it.data && (__it.data.registryId || __it.data.id)) || __tr;
    const __prev = (__it.data && Array.isArray(__it.data.keyframes)) ? __it.data.keyframes.length : 0;
    const __kfs = __ppResolve(__it, ${J(t.keyframes)});
    app.addAnimation(__id, __kfs, { duration: ${t.duration}, loop: ${t.loop}, timeUnits: 'seconds' });
    __ppTl.push(Object.assign({ ref: ${J(t.ref)}, itemId: __id, keys: __kfs.length, duration: ${t.duration}, loop: ${t.loop} }, __prev ? { replaced: __prev } : {}));
  }`).join('');
  return `
if (typeof app.addAnimation !== 'function') return { success: false, error: 'timeline: app.addAnimation unavailable in this studio' };
const __ppNum = function (v) { return (typeof v === 'number' && isFinite(v)) ? v : undefined; };
const __ppFirst = function () { for (let i = 0; i < arguments.length; i++) if (arguments[i] !== undefined) return arguments[i]; return undefined; };
// An item's rest value: its authored state when it has a track, else what it is now.
const __ppRest = function (it, p) {
  const o = it.data && it.data.originalKeyframeState;
  const b = it.bounds;
  const css = function (c) { return c && typeof c.toCSS === 'function' ? c.toCSS(true) : undefined; };
  switch (p) {
    case 'x': return __ppFirst(__ppNum(o && o.position && o.position.x), __ppNum(it.position && it.position.x));
    case 'y': return __ppFirst(__ppNum(o && o.position && o.position.y), __ppNum(it.position && it.position.y));
    case 'scale': case 'scaleX': return __ppFirst(__ppNum(o && o.scaling && o.scaling.x), __ppNum(it.scaling && it.scaling.x), 1);
    case 'scaleY': return __ppFirst(__ppNum(o && o.scaling && o.scaling.y), __ppNum(it.scaling && it.scaling.y), 1);
    case 'rotation': return __ppFirst(__ppNum(o && o.rotation), __ppNum(it.rotation), 0);
    case 'opacity': return __ppFirst(__ppNum(o && o.opacity), __ppNum(it.opacity), 1);
    case 'fillColor': return css(it.fillColor);
    case 'strokeColor': return css(it.strokeColor);
    case 'strokeWidth': return __ppNum(it.strokeWidth);
    case 'width': return __ppNum(b && b.width);
    case 'height': return __ppNum(b && b.height);
    case 'radius': return b ? __ppNum(b.width / 2) : undefined;
    case 'fontSize': return __ppNum(it.fontSize);
    case 'trimStart': return __ppFirst(__ppNum(it.data && it.data.trimStart), 0);
    case 'trimEnd': return __ppFirst(__ppNum(it.data && it.data.trimEnd), 1);
    case 'dashOffset': return __ppFirst(__ppNum(it.dashOffset), 0);
    case 'dashArray': return Array.isArray(it.dashArray) && it.dashArray.length ? it.dashArray.slice() : undefined;
    default: return undefined;
  }
};
// The item's height at scale 1, for a scale that holds its bottom or top edge.
const __ppHeight = function (it) {
  const o = it.data && it.data.originalKeyframeState;
  const base = o && (o.localBounds || o.bounds);
  if (base && __ppNum(base.height) !== undefined) return base.height;
  return it.bounds ? it.bounds.height / (Math.abs(it.scaling ? it.scaling.y : 1) || 1) : 0;
};
const __ppResolve = function (it, kfs) {
  for (const k of kfs) {
    for (const p of Object.keys(k.properties)) {
      const v = k.properties[p];
      if (!v || typeof v !== 'object' || Array.isArray(v) || typeof v.$rest !== 'string') continue;
      let r = __ppRest(it, v.$rest);
      if (r === undefined || r === null) { delete k.properties[p]; continue; }
      if (typeof r === 'number') {
        r += v.add || 0;
        if (v.pivot) {
          // A bottom / top anchor is held by the engine itself (it moves y as scaleY changes): adding y keys too would
          // move the item twice. Any other bottom-* / top-* anchor, or a transformOrigin, is held here.
          const an = String((it.data && it.data.anchor) || it.anchor || '');
          let pv = v.pivot;
          if (an === 'bottom' || an === 'top') pv = 0;
          else if (pv === 'anchor') pv = /^bottom/.test(an) ? 1 : /^top/.test(an) ? -1 : 0;
          if (pv) {
            const s0 = __ppRest(it, 'scaleY');
            const s = typeof v.s === 'number' ? v.s : s0 + (v.sAdd || 0);
            r += pv * (__ppHeight(it) / 2) * (s0 - s);
          }
        }
      }
      k.properties[p] = r;
    }
  }
  return kfs.filter(function (k) { return Object.keys(k.properties).length > 0; });
};
const __ppTl = [];${tracks}
return { success: true, timeline: { duration: ${plan.duration}, tracks: __ppTl, tweens: ${J(plan.tweens)}${plan.notes.length ? `, notes: ${J(plan.notes)}` : ''} } };
`;
}
