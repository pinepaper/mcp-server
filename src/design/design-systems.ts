/**
 * The design vocabulary, answered in this server.
 *
 * Everything here is a pure function over vendored data — no browser, no
 * engine call. That is the point of where it lives: a design system's tokens
 * and a style's composition are decisions, and a decision does not need the
 * canvas to be open. `compose` is the only one that produces anything to draw,
 * and even that returns items the caller may inspect instead.
 *
 * The data itself is vendored from mcp-cloud by scripts/sync-design-systems.mjs
 * and must not be edited here — see src/vendor/design/.
 */

import {
  OPEN_DESIGN_SYSTEMS,
  getDTCGDesignSystem,
  tokenToCubicBezier,
  type DTCGDesignSystem,
  type DTCGToken,
  type DTCGTokenType,
} from '../vendor/design/design-systems-dtcg.js';
import { DESIGN_STYLES, type DesignStyle } from '../vendor/design/design-style.js';

import { generateArtDecoPoster } from '../vendor/design/art-deco-generator.js';
import { generateArtNouveauPoster } from '../vendor/design/art-nouveau-generator.js';
import { generateBauhausPoster } from '../vendor/design/bauhaus-generator.js';
import { generateBrutalistPoster } from '../vendor/design/brutalist-generator.js';
import { generateClaymorphismPoster } from '../vendor/design/claymorphism-generator.js';
import { generateCorporateMemphisPoster } from '../vendor/design/corporate-memphis-generator.js';
import { generateCyberpunkPoster } from '../vendor/design/cyberpunk-generator.js';
import { generateDeStijlPoster } from '../vendor/design/de-stijl-generator.js';
import { generateFrutigerAeroPoster } from '../vendor/design/frutiger-aero-generator.js';
import { generateMemphisPoster } from '../vendor/design/memphis-generator.js';
import { generateMidCenturyUpaPoster } from '../vendor/design/mid-century-upa-generator.js';
import { generateNeumorphicDashboard } from '../vendor/design/neumorphic-generator.js';
import { generateOpArtPoster } from '../vendor/design/op-art-generator.js';
import { generatePixelArtPoster } from '../vendor/design/pixel-art-generator.js';
import { generatePopArtPoster } from '../vendor/design/pop-art-generator.js';
import { generateRisographArt } from '../vendor/design/risograph-generator.js';
import { generateSwissPoster } from '../vendor/design/swiss-style-generator.js';
import { generateVaporwavePoster } from '../vendor/design/vaporwave-generator.js';

/**
 * TWO UPSTREAM SHAPES, normalised here.
 *
 * Seven generators return a DesignScene — `{ width, height, backgroundHex,
 * elements[] }` with `fillHex` on each element. Eleven return a LayoutResult —
 * `{ canvas: {width, height}, items[], palette[] }` with `fill` and `text`.
 * Same idea, different vocabulary, and nothing upstream reconciles them.
 *
 * Reading only the first shape is what a hurried mirror does: it works for
 * seven styles and silently returns an empty scene for the other eleven, which
 * is the failure this whole surface exists to stop making. Both are read, and
 * `composedFrom` records which, so an upstream change that alters a shape is
 * visible rather than quietly halving the output.
 */
export interface ComposedElement {
  id: string;
  /** The upstream element type, kept verbatim — 'fan_motif' stays 'fan_motif'. */
  type: string;
  content?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  fillHex: string;
  strokeHex?: string;
  strokeWidthPx?: number;
  radius?: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  textAlign?: string;
  /** The upstream `shapeType` ('circle', 'square', 'pill', …) under a generic `type: 'shape'`. */
  shape?: string;
  /** A CSS `clip-path: polygon(...)` the element is cut to (cyberpunk's angular HUD frame). */
  clipPath?: string;
  /** A neon glow colour (`neonGlowHex`). */
  glowHex?: string;
  /** A CSS text-shadow (`textShadow`), e.g. '0 0 12px #00f0ff, 0 0 24px #00f0ff'. */
  textShadow?: string;
}

export interface ComposedScene {
  style: string;
  width: number;
  height: number;
  backgroundHex?: string;
  palette?: string[];
  elements: ComposedElement[];
  /** Which upstream shape this came from: 'scene' or 'layout'. */
  composedFrom: 'scene' | 'layout';
}

type RawScene = {
  style?: string;
  width?: number; height?: number;
  canvas?: { width: number; height: number };
  backgroundHex?: string;
  palette?: string[];
  elements?: Array<Record<string, unknown>>;
  items?: Array<Record<string, unknown>>;
};

const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** Fold either upstream shape into one. Throws rather than returning empty. */
function normalise(style: string, raw: unknown): ComposedScene {
  const r = (raw ?? {}) as RawScene;
  const fromScene = Array.isArray(r.elements);
  const rows = (fromScene ? r.elements : r.items) ?? [];

  if (!Array.isArray(rows) || rows.length === 0) {
    // An empty composition is never a correct answer here — every generator
    // lays out at least a title. Say so instead of handing back a blank canvas
    // that looks like the style simply being minimal.
    throw new Error(
      `the ${style} generator returned no elements — its upstream shape may have changed ` +
      '(expected `elements[]` or `items[]`); re-run bun run sync:design and check the vendored source'
    );
  }

  const width = num(r.width) ?? r.canvas?.width;
  const height = num(r.height) ?? r.canvas?.height;
  if (width === undefined || height === undefined) {
    throw new Error(`the ${style} generator returned no canvas size (expected width/height or canvas{})`);
  }

  const elements: ComposedElement[] = rows.map((row, i) => {
    const e = row as Record<string, unknown>;
    return {
      id: str(e.id) ?? `${style}_${i}`,
      type: str(e.type) ?? 'rect',
      // 'content' in the scene shape, 'text' in the layout shape.
      content: str(e.content) ?? str(e.text),
      fontSize: num(e.fontSize),
      fontWeight: (typeof e.fontWeight === 'string' || typeof e.fontWeight === 'number') ? e.fontWeight : undefined,
      fontFamily: str(e.fontFamily),
      // 'fillHex' in the scene shape, 'fill' in the layout shape.
      fillHex: str(e.fillHex) ?? str(e.fill) ?? '#000000',
      strokeHex: str(e.strokeHex) ?? str(e.stroke),
      strokeWidthPx: num(e.strokeWidthPx) ?? num(e.strokeWidth),
      radius: num(e.radius),
      x: num(e.x) ?? 0,
      y: num(e.y) ?? 0,
      width: num(e.width),
      height: num(e.height),
      textAlign: str(e.textAlign),
      // Kept rather than dropped (CYBER-HUDFRAME, BAUHAUS-CIRCLE): a bauhaus
      // circle is `type: 'shape', shapeType: 'circle'`, and a cyberpunk frame's
      // angled corners and glow live in these keys. Absent keys stay absent.
      ...(str(e.shapeType) ? { shape: str(e.shapeType) } : {}),
      ...(str(e.clipPathAngle) ? { clipPath: str(e.clipPathAngle) } : {}),
      ...(str(e.neonGlowHex) ? { glowHex: str(e.neonGlowHex) } : {}),
      ...(str(e.textShadow) ? { textShadow: str(e.textShadow) } : {}),
    };
  });

  return {
    style: str(r.style) ?? style,
    width, height,
    backgroundHex: str(r.backgroundHex),
    palette: Array.isArray(r.palette) ? (r.palette as string[]) : undefined,
    elements,
    composedFrom: fromScene ? 'scene' : 'layout',
  };
}

export interface ComposeOptions {
  title: string;
  subtitle?: string;
  body?: string;
  width?: number;
  height?: number;
  variant?: string;
}

/**
 * Which style each generator answers to.
 *
 * Keyed on the upstream DesignStyle union, so a caller names the same style
 * here that the cloud's recipes name. Styles in the union with no entry are
 * describable but not composable, and `listStyles` says which is which rather
 * than letting a caller discover it by getting nothing back.
 */
const COMPOSERS: Partial<Record<DesignStyle, (o: ComposeOptions) => unknown>> = {
  art_deco_geometric: (o) => generateArtDecoPoster({
    title: o.title, subtitle: o.subtitle ?? '', body: o.body,
    width: o.width, height: o.height, emeraldVariant: o.variant === 'emerald',
  }),
  art_nouveau: (o) => generateArtNouveauPoster(o as never),
  bauhaus_geometric: (o) => generateBauhausPoster(o as never),
  brutalist_raw: (o) => generateBrutalistPoster(o as never),
  claymorphism: (o) => generateClaymorphismPoster(o as never),
  corporate_memphis: (o) => generateCorporateMemphisPoster(o as never),
  cyberpunk_neon: (o) => generateCyberpunkPoster(o as never),
  de_stijl_neoplasticism: (o) => generateDeStijlPoster(o as never),
  y2k_frutiger_aero: (o) => generateFrutigerAeroPoster(o as never),
  memphis_group: (o) => generateMemphisPoster(o as never),
  mid_century_upa: (o) => generateMidCenturyUpaPoster(o as never),
  neumorphic_glass: (o) => generateNeumorphicDashboard(o as never),
  op_art_psychedelic: (o) => generateOpArtPoster(o as never),
  pixel_art_8bit: (o) => generatePixelArtPoster(o as never),
  pop_art_expression: (o) => generatePopArtPoster(o as never),
  risograph_print: (o) => generateRisographArt(o as never),
  swiss_typographic: (o) => generateSwissPoster(o as never),
  vaporwave_retro: (o) => generateVaporwavePoster(o as never),
};

/** How many styles `compose` can draw — the count the tool descriptions quote. */
export const COMPOSABLE_STYLE_COUNT = Object.keys(COMPOSERS).length;

/**
 * Every style the union declares, whether or not it can compose.
 *
 * DERIVED, not listed. This was a hand-written array, and when the upstream
 * union gained embroidery_tapestry and woven_textile it did not — so two styles
 * the vocabulary declares were invisible to list_styles, and no test could
 * catch it, because a TypeScript union cannot be compared to a runtime array.
 * The sync script now emits the members as data beside the type, from the same
 * slice, so the two cannot disagree.
 */
export const ALL_STYLES: readonly DesignStyle[] = DESIGN_STYLES;

/**
 * Styles whose palette a named variant changes. Only art deco has one today,
 * and it is listed rather than inferred because `emeraldVariant` is a bespoke
 * boolean on that one generator, not a shape the others share.
 */
const STYLE_VARIANTS: Partial<Record<DesignStyle, string[]>> = {
  art_deco_geometric: ['emerald'],
};

export interface StyleTokens {
  style: string;
  composable: boolean;
  /** Distinct fills and strokes the generator actually emits, most-used first. */
  palette: string[];
  /** The ground it paints, when it paints one. */
  background?: string;
  /** Font stacks verbatim, as the generator writes them — a CSS stack, not one family. */
  fonts: string[];
  /** Type sizes in use, ascending. */
  fontSizes: number[];
  /** Named variants that change the palette; compose with `variant`. */
  variants?: string[];
}

/**
 * A style's palette and type, DERIVED by composing it — never transcribed.
 *
 * The data was always one layer below the API: every generator holds its colours
 * in a `*_PALETTE` constant and its type in per-element `fontFamily` strings,
 * and `listStyles` published neither. The only way to build an authentic
 * bauhaus or memphis scene by hand was to read this server's own source, which
 * is the report that prompted this.
 *
 * Reading the 18 `*_PALETTE` constants would have been the obvious fix and the
 * wrong one: they are 18 different shapes under 18 different names, so a
 * hand-written map is a second copy that drifts the first time `sync:design`
 * pulls an upstream change — the exact failure this repo keeps paying to
 * remove. Composing a throwaway poster and reading what comes out cannot drift:
 * it reports what the generator will actually draw.
 *
 * Safe to do eagerly because no generator is procedural — there is no
 * `Math.random` in any vendored file, so one run is the whole palette for that
 * variant, and a style with variants says so rather than pretending its first
 * variant is all of it.
 */
export function styleTokens(style: string): StyleTokens | null {
  if (!ALL_STYLES.includes(style as DesignStyle)) return null;
  const composable = !!COMPOSERS[style as DesignStyle];
  const variants = STYLE_VARIANTS[style as DesignStyle];
  if (!composable) {
    // Describable but not composable: there is no generator to ask, and an
    // invented palette would be worse than an empty one.
    return { style, composable, palette: [], fonts: [], fontSizes: [] };
  }

  let scene: ComposedScene | null = null;
  try {
    scene = compose(style, { title: 'Title', subtitle: 'Subtitle', body: 'Body' });
  } catch {
    // normalise() throws when an upstream shape changed. That is a real signal
    // and design-systems.test.ts asserts on it through compose(); here it only
    // means the tokens are unavailable, and losing the whole listing to one
    // broken generator would be the worse trade.
    return { style, composable, palette: [], fonts: [], fontSizes: [], ...(variants ? { variants } : {}) };
  }
  if (!scene) return { style, composable, palette: [], fonts: [], fontSizes: [] };

  const uses = new Map<string, number>();
  const count = (hex?: string) => {
    if (!hex || hex === 'transparent' || hex === 'none') return;
    uses.set(hex, (uses.get(hex) ?? 0) + 1);
  };
  const fonts = new Set<string>();
  const sizes = new Set<number>();
  for (const el of scene.elements) {
    count(el.fillHex);
    count(el.strokeHex);
    if (el.fontFamily) fonts.add(el.fontFamily);
    if (el.fontSize !== undefined) sizes.add(el.fontSize);
  }

  // A declared palette leads, in its own order: the eleven layout-shape
  // generators publish one, and the author's ordering carries intent that a
  // frequency count does not. Observed colours follow, so a hue used once in a
  // motif is still reachable.
  const declared = (scene.palette ?? []).filter((c) => c && c !== 'transparent');
  const observed = [...uses.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  const palette = [...new Set([...declared, ...observed])];

  return {
    style, composable, palette,
    ...(scene.backgroundHex ? { background: scene.backgroundHex } : {}),
    fonts: [...fonts],
    fontSizes: [...sizes].sort((a, b) => a - b),
    ...(variants ? { variants } : {}),
  };
}

/**
 * Every style, with its tokens.
 *
 * The tokens ride along rather than sitting behind a second call: an agent that
 * did not know palettes existed here will not go looking for the action that
 * reveals them, and undiscoverability is the complaint this answers.
 */
export function listStyles(): StyleTokens[] {
  return ALL_STYLES.map((style) => styleTokens(style)!);
}

export function listSystems(): Array<{
  id: string; name: string; vendor: string; license: string;
  version: string; category: string; tokenCount: number;
}> {
  return Object.values(OPEN_DESIGN_SYSTEMS).map((s: DTCGDesignSystem) => ({
    id: s.id, name: s.name, vendor: s.vendor, license: s.license,
    version: s.version, category: s.category,
    tokenCount: Object.keys(s.tokens ?? {}).length,
  }));
}

export function getSystem(systemId: string, tokenType?: DTCGTokenType) {
  const sys = getDTCGDesignSystem(systemId);
  if (!sys) return null;
  if (!tokenType) return sys;
  const tokens: Record<string, DTCGToken> = {};
  for (const [k, t] of Object.entries(sys.tokens ?? {})) {
    if (t.$type === tokenType) tokens[k] = t;
  }

  // AN EMPTY RESULT USED TO LOOK LIKE AN EMPTY SYSTEM.
  //
  // These systems were captured for their MOTION ladders, spacing grids and
  // type scales; none of them carries colour. Asking material_3 for
  // tokenType 'color' returned `{tokens: {}}`, which reads as "this system has
  // no colours" rather than "this tool does not carry them" — and the caller
  // had no way to tell those apart or learn where colours do live.
  if (Object.keys(tokens).length === 0) {
    const available = [...new Set(
      Object.values(sys.tokens ?? {}).map((t) => t.$type).filter((t): t is DTCGTokenType => !!t),
    )].sort();
    return {
      ...sys,
      tokens,
      requested: tokenType,
      available,
      note: available.includes(tokenType)
        ? `${sys.id} declares no ${tokenType} tokens, though other systems here do.`
        : `no design system here carries ${tokenType} tokens — these were captured for ${available.join(', ')}. `
          + 'For palettes, use pinepaper_design_system {action: "list_styles"} — every aesthetic style there carries its palette tokens.',
    };
  }
  return { ...sys, tokens };
}

export interface NamedEasing {
  /** Stable name: system id + token path, so two systems' "standard" cannot collide. */
  name: string;
  system: string;
  systemName: string;
  token: string;
  cubicBezier: string;
  values: number[];
  description?: string;
  license: string;
  /** True when PinePaper filled a gap the published system does not specify. */
  authored: boolean;
}

/**
 * Every cubicBezier token across every system, as a named easing.
 *
 * The provenance flag is the part that matters. A vendor's published curve and
 * one we had to invent because the system does not specify motion are both
 * usable, and they are not the same claim — so `authored` rides along instead
 * of the two being flattened into one list of equally-official numbers.
 */
export interface NamedDuration {
  /** Stable name: system id + token path, matching a NamedEasing's. */
  name: string;
  system: string;
  systemName: string;
  token: string;
  /** Milliseconds, parsed from the DTCG string. */
  ms: number;
  /** Seconds — what every animation tool on this surface actually takes. */
  seconds: number;
  description?: string;
  license: string;
  authored: boolean;
}

/**
 * A duration token in milliseconds. DTCG writes them as strings.
 *
 * Every value in the vendored systems is `<n>ms` today, and `<n>s` is parsed
 * too rather than silently returning null on an upstream change — a dropped
 * token would thin the listing without anything saying so.
 */
function tokenToMilliseconds(token: DTCGToken): number | null {
  if (token.$type !== 'duration') return null;
  const raw = String(token.$value).trim();
  const ms = /^(\d+(?:\.\d+)?)ms$/.exec(raw);
  if (ms) return Number(ms[1]);
  const s = /^(\d+(?:\.\d+)?)s$/.exec(raw);
  if (s) return Number(s[1]) * 1000;
  return null;
}

/**
 * The other half of a motion token, which this surface was not publishing.
 *
 * `listEasings` exposed the 27 cubicBezier tokens and nothing read the 47
 * duration tokens sitting beside them in the same store — so an agent could
 * match a system's CURVE and had to invent its TIMING, which is half a motion
 * vocabulary and the half that is easy to get wrong. A curve is a shape; a
 * motion is a shape over a length.
 *
 * These are the licensed SYSTEMS' motion scales — Material's duration ladder,
 * Carbon's, and so on. They are NOT per-aesthetic-style motion: a style like
 * bauhaus_geometric has no upstream motion data at all, and manufacturing some
 * would be inventing a fact about someone else's design system.
 */
export function listDurations(authoredOnly?: boolean): NamedDuration[] {
  const out: NamedDuration[] = [];
  for (const sys of Object.values(OPEN_DESIGN_SYSTEMS) as DTCGDesignSystem[]) {
    for (const [path, token] of Object.entries(sys.tokens ?? {})) {
      const ms = tokenToMilliseconds(token);
      if (ms === null) continue;
      const authored = token.$extensions?.['pinepaper:authored'] === true;
      if (authoredOnly !== undefined && authored !== authoredOnly) continue;
      out.push({
        name: `${sys.id}.${path}`,
        system: sys.id,
        systemName: sys.name,
        token: path,
        ms,
        // Every animation tool here takes seconds. Publishing only the DTCG
        // unit would make each caller do the same division, and one of them
        // would do it wrong.
        seconds: Math.round((ms / 1000) * 1000) / 1000,
        description: token.$description,
        license: sys.license,
        authored,
      });
    }
  }
  return out;
}

export function listEasings(authoredOnly?: boolean): NamedEasing[] {
  const out: NamedEasing[] = [];
  for (const sys of Object.values(OPEN_DESIGN_SYSTEMS) as DTCGDesignSystem[]) {
    for (const [path, token] of Object.entries(sys.tokens ?? {})) {
      const css = tokenToCubicBezier(token);
      if (!css) continue;
      const authored = token.$extensions?.['pinepaper:authored'] === true;
      if (authoredOnly !== undefined && authored !== authoredOnly) continue;
      out.push({
        name: `${sys.id}.${path}`,
        system: sys.id,
        systemName: sys.name,
        token: path,
        cubicBezier: css,
        values: token.$value as number[],
        description: token.$description,
        license: sys.license,
        authored,
      });
    }
  }
  return out;
}

/**
 * Compose a scene in a style. Returns null when the style cannot compose.
 *
 * `subtitle` and `body` are filled with empty strings before the call. Six
 * generators — art deco, brutalist, de stijl, cyberpunk, pop art, vaporwave —
 * declare both optional and then dereference them (`options.subtitle
 * .toUpperCase()`), so a title-only compose throws a TypeError from inside
 * vendored code. Defaulting here is the smallest honest adaptation: it is one
 * rule applied to every generator rather than a patch to a generated file,
 * which the provenance test would fail on anyway. The nullability gap is
 * upstream's to close.
 */
export function compose(style: string, options: ComposeOptions): ComposedScene | null {
  const fn = COMPOSERS[style as DesignStyle];
  if (!fn) return null;
  return normalise(style, fn({ ...options, subtitle: options.subtitle ?? '', body: options.body ?? '' }));
}

/**
 * A composed scene as create-item ops.
 *
 * Every generator returns absolutely-positioned elements with hex fills. Text
 * keeps its content and size; everything else becomes a rectangle at the
 * element's bounds, because a style's "fan_motif" is a named shape upstream and
 * a filled box here rather than a silently dropped element.
 *
 * IT IS NOT A RENAME, which is what this used to claim while passing `x`/`y`
 * straight through. The generators author CSS-shaped layout — a TOP-LEFT box —
 * and `app.create` is CENTRE-anchored: js/shapes/basic.js builds a rectangle at
 * `point: position - size/2` and a circle at `center: position`. So every
 * composed scene rendered half a box up and to the left of where the generator
 * put it, and a left-aligned headline was worse than that: bauhaus authors its
 * title at x = 0.1 × width, which on a 1080 canvas is 108, and a 600px-wide
 * string centred on 108 starts at -192. That is the "title half off-canvas"
 * this surface was reported with, and why composing was abandoned for
 * hand-built primitives.
 *
 * Three conventions, resolved per element, because one blanket shift breaks two
 * of them:
 *
 *  - **A box** (`width`/`height`, no radius) → the centre is (x + w/2, y + h/2).
 *  - **An explicit `radius`** → x/y is ALREADY the centre. art-nouveau's halo
 *    and op-art's concentric rings are authored from a ring centre, so shifting
 *    them by a radius would break the styles that are currently *correct*.
 *  - **Text** → PinePaper reads `alignment` ('left' makes x the LEFT edge,
 *    'right' the right edge, y the bounds centre either way). That accommodation
 *    exists in the engine specifically for scene authors, and this function was
 *    dropping `textAlign` on the floor — so every left-aligned string centred on
 *    its anchor even once the boxes were right.
 *
 * The one place this stops short of certain: the layout-shape generators author
 * text as x/y/fontSize with no box at all, and nothing upstream says whether
 * that y is the top or the baseline. Where there is a box, y moves by half of
 * it; where there is not, y is left alone rather than shifted by a guess. The
 * horizontal fix — the one that put titles off-canvas — applies either way.
 */
export interface LayoutCollision {
  /** The text element that runs onto a shape. */
  text: string;
  /** The shape it runs onto. */
  shape: string;
}

/**
 * Text the generator laid PARTLY over a shape (BAUHAUS-SUBTITLE).
 *
 * The vendored layouts scale some sizes with the width and some positions with
 * the height, so at an aspect they were not drawn for, a line of text can land
 * half on a shape: bauhaus at 1920x1080 puts its subtitle across the red circle.
 * The layout is upstream's to fix (it is vendored and not edited here); this
 * says so instead of drawing it as if it were intended. Text wholly inside a
 * shape (a label on a card, a title in a frame) is a design, not a collision,
 * and so is anything over a full-canvas ground.
 */
export function layoutCollisions(scene: ComposedScene): LayoutCollision[] {
  const out: LayoutCollision[] = [];
  const canvasArea = scene.width * scene.height;
  const texts = scene.elements.filter((e) => e.content && e.width && e.height);
  for (const t of texts) {
    const tx0 = t.x, ty0 = t.y, tx1 = t.x + t.width!, ty1 = t.y + t.height!;
    for (const s of scene.elements) {
      if (s === t || (s.content !== undefined && s.content !== '')) continue;
      if (s.radius !== undefined) continue; // centre-authored rings and halos: decorative by design
      const w = s.width ?? 0, h = s.height ?? 0;
      if (!(w > 0 && h > 0) || w * h >= 0.9 * canvasArea) continue;
      const round = s.type === 'circle' || s.shape === 'circle';
      if (round) {
        const cx = s.x + w / 2, cy = s.y + h / 2, rx = w / 2, ry = h / 2;
        const inside = (px: number, py: number) => ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 <= 1;
        // Nearest point of the text box to the centre decides whether they meet.
        const nx = Math.max(tx0, Math.min(cx, tx1)), ny = Math.max(ty0, Math.min(cy, ty1));
        const meets = inside(nx, ny);
        const contained = inside(tx0, ty0) && inside(tx1, ty0) && inside(tx0, ty1) && inside(tx1, ty1);
        if (meets && !contained) out.push({ text: t.id, shape: s.id });
      } else {
        const meets = tx0 < s.x + w && tx1 > s.x && ty0 < s.y + h && ty1 > s.y;
        const contained = tx0 >= s.x && tx1 <= s.x + w && ty0 >= s.y && ty1 <= s.y + h;
        if (meets && !contained) out.push({ text: t.id, shape: s.id });
      }
    }
  }
  return out;
}

/**
 * Collisions the requested SIZE made: pairs that collide in `scene` but not in
 * the same composition at the generator's own default size. A text-over-shape
 * the generator draws at its default (vaporwave's kanji over the sun) is the
 * design; one that appears only when the layout is stretched to another aspect
 * is the defect. Empty when no size was asked for.
 */
export function scalingCollisions(style: string, options: ComposeOptions, scene: ComposedScene): LayoutCollision[] {
  if (options.width === undefined && options.height === undefined) return [];
  let reference: ComposedScene | null = null;
  try {
    reference = compose(style, { ...options, width: undefined, height: undefined });
  } catch {
    return [];
  }
  if (!reference) return [];
  const designed = new Set(layoutCollisions(reference).map((c) => `${c.text}|${c.shape}`));
  return layoutCollisions(scene).filter((c) => !designed.has(`${c.text}|${c.shape}`));
}

/** The neon glow of an element as shadow properties: its text-shadow when it has one, else its glow colour. */
function glowOf(el: ComposedElement): Record<string, unknown> {
  const ts = el.textShadow ? parseTextShadow(el.textShadow) : null;
  if (ts) return { shadowColor: ts.color, shadowBlur: ts.blur, shadowOffset: [ts.dx, ts.dy] };
  // A glow colour with no shadow geometry upstream. 12 px is the blur the same
  // generator gives its own glowing title (`0 0 12px`), so the frame matches it.
  if (el.glowHex) return { shadowColor: el.glowHex, shadowBlur: 12, shadowOffset: [0, 0] };
  return {};
}

/** The first layer of a CSS text-shadow: `<dx> <dy> [<blur>] <colour>`. Null when it cannot be read. */
export function parseTextShadow(css: string): { dx: number; dy: number; blur: number; color: string } | null {
  const first = splitTopLevel(css, ',')[0]?.trim();
  if (!first) return null;
  const parts = splitTopLevel(first, ' ').filter(Boolean);
  const lengths: number[] = [];
  let color: string | undefined;
  for (const p of parts) {
    const m = /^(-?\d+(?:\.\d+)?)(px)?$/.exec(p);
    if (m) lengths.push(Number(m[1]));
    else color = p;
  }
  if (!color || lengths.length < 2) return null;
  return { dx: lengths[0], dy: lengths[1], blur: lengths[2] ?? 0, color };
}

/** Split on a separator that is not inside parentheses. */
function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === sep && depth === 0) { out.push(cur); cur = ''; } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** A CSS length against a reference size: `12px`, `12`, `50%`, `calc(100% - 32px)`. Null when unreadable. */
function cssLength(token: string, size: number): number | null {
  const t = token.trim();
  const calc = /^calc\((.*)\)$/.exec(t);
  if (calc) {
    // Terms joined by + and -, each a length; CSS requires spaces around them.
    const terms = calc[1].trim().split(/\s+([+-])\s+/);
    let total = cssLength(terms[0], size);
    for (let i = 1; total !== null && i < terms.length; i += 2) {
      const v = cssLength(terms[i + 1] ?? '', size);
      total = v === null ? null : terms[i] === '+' ? total + v : total - v;
    }
    return total;
  }
  const m = /^(-?\d+(?:\.\d+)?)(px|%)?$/.exec(t);
  if (!m) return null;
  return m[2] === '%' ? (Number(m[1]) / 100) * size : Number(m[1]);
}

const round2 = (v: number) => Math.round(v * 100) / 100;

/** A CSS `polygon(...)` clip path over a box, as closed SVG path data in canvas coordinates. */
export function clipPolygon(css: string, x: number, y: number, w: number, h: number):
  { pathData: string; centreX: number; centreY: number } | null {
  const m = /^\s*polygon\((.*)\)\s*$/.exec(css);
  if (!m) return null;
  const pts: Array<[number, number]> = [];
  for (const pair of splitTopLevel(m[1], ',')) {
    const xy = splitTopLevel(pair.trim(), ' ').filter(Boolean);
    if (xy.length !== 2) return null;
    const px = cssLength(xy[0], w);
    const py = cssLength(xy[1], h);
    if (px === null || py === null) return null;
    pts.push([round2(x + px), round2(y + py)]);
  }
  if (pts.length < 3) return null;
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    pathData: 'M' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L') + ' Z',
    // The engine places path data by its bounds centre.
    centreX: (Math.min(...xs) + Math.max(...xs)) / 2,
    centreY: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

/** Scanline period and line weight, in px: a 2 px bar every 4 px. */
export const SCANLINE_PITCH = 4;
export const SCANLINE_WEIGHT = 2;

/** Horizontal bars over a box, as one compound path's data, centred in the box. */
function scanlinePath(x: number, y: number, w: number, h: number): string {
  const n = Math.max(1, Math.floor((h - SCANLINE_WEIGHT) / SCANLINE_PITCH) + 1);
  // Centred, so the bars' bounds centre IS the box centre — the point the
  // engine places path data by — and the overlay sits where the box was.
  const top = y + Math.max(0, (h - ((n - 1) * SCANLINE_PITCH + SCANLINE_WEIGHT)) / 2);
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    parts.push(`M${round2(x)} ${round2(top + i * SCANLINE_PITCH)} h${round2(w)} v${SCANLINE_WEIGHT} h${round2(-w)} Z`);
  }
  return parts.join(' ');
}

export function sceneToOps(scene: ComposedScene): Array<Record<string, unknown>> {
  const ops: Array<Record<string, unknown>> = [];
  for (const el of scene.elements) {
    const isText = el.content !== undefined && el.content !== '';
    const authorsOwnCentre = el.radius !== undefined;
    const w = el.width ?? 0;
    const h = el.height ?? 0;

    // 'center' is the engine's default and the only other value it reads.
    const alignment = el.textAlign === 'left' || el.textAlign === 'right' ? el.textAlign : 'center';

    let x = el.x;
    let y = el.y;
    if (isText) {
      if (alignment === 'center') x = el.x + w / 2;
      else if (alignment === 'right') x = el.x + w;
      // 'left': x is the left edge, which is what the engine wants for it.
      if (el.height !== undefined) y = el.y + h / 2;
    } else if (!authorsOwnCentre) {
      x = el.x + w / 2;
      y = el.y + h / 2;
    }

    const common: Record<string, unknown> = {
      x, y,
      fillColor: el.fillHex,
      ...(el.strokeHex ? { strokeColor: el.strokeHex } : {}),
      ...(el.strokeWidthPx !== undefined ? { strokeWidth: el.strokeWidthPx } : {}),
      ...glowOf(el),
    };

    // A SCANLINE OVERLAY IS LINES (CYBER-SCANLINES). It was a rectangle at the
    // overlay's bounds in the overlay's colour — a flat 25% black veil over the
    // whole poster, which is a dimmer, not scanlines. One compound path of
    // thin horizontal bars, in that colour, over the same box.
    if (el.type === 'scanline_overlay' && w > 0 && h > 0) {
      ops.push({
        type: 'path', name: el.id, pathData: scanlinePath(el.x, el.y, w, h),
        x: el.x + w / 2, y: el.y + h / 2,
        fillColor: el.fillHex,
        note: el.type,
      });
      continue;
    }

    // AN ANGLED FRAME IS ITS POLYGON (CYBER-HUDFRAME). clipPathAngle carries
    // the cut corners; a rectangle at the bounds drew them square. A polygon
    // this cannot read keeps the rectangle rather than guessing.
    if (!isText && el.clipPath && w > 0 && h > 0) {
      const poly = clipPolygon(el.clipPath, el.x, el.y, w, h);
      if (poly) {
        ops.push({
          type: 'path', name: el.id, ...common,
          x: poly.centreX, y: poly.centreY, pathData: poly.pathData, closed: true,
          note: el.type,
        });
        continue;
      }
    }

    if (isText) {
      ops.push({
        type: 'text', name: el.id, ...common, content: el.content,
        ...(el.fontSize !== undefined ? { fontSize: el.fontSize } : {}),
        ...(el.fontFamily ? { fontFamily: el.fontFamily } : {}),
        ...(el.fontWeight !== undefined ? { fontWeight: el.fontWeight } : {}),
        alignment,
      });
    } else if (el.type === 'circle' || authorsOwnCentre) {
      ops.push({ type: 'circle', name: el.id, ...common, radius: el.radius ?? w / 2 });
    } else if (el.shape === 'circle' && w > 0 && h > 0) {
      // BAUHAUS-CIRCLE: `type: 'shape', shapeType: 'circle'` in a box. It went
      // to the rectangle branch and the red circle rendered as a square. The
      // box is the circle's bounds, so its centre is the box centre (above).
      ops.push(w === h
        ? { type: 'circle', name: el.id, ...common, radius: w / 2, note: el.shape }
        : { type: 'ellipse', name: el.id, ...common, width: w, height: h, note: el.shape });
    } else {
      ops.push({
        type: 'rectangle', name: el.id, ...common,
        width: w, height: h,
        // The upstream type is kept as a note rather than dropped: a caller
        // re-reading the scene can tell a frame from a fan motif even though
        // both arrive as rectangles.
        note: el.type,
      });
    }
  }
  return ops;
}
