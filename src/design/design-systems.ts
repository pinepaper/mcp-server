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
import type { DesignStyle } from '../vendor/design/design-style.js';

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

/** Every style the union declares, whether or not it can compose. */
export const ALL_STYLES: DesignStyle[] = [
  'minimal', 'editorial', 'playful', 'cinematic', 'energetic', 'scrapbook',
  'swiss_typographic', 'neumorphic_glass', 'risograph_print', 'cyberpunk_neon',
  'bauhaus_geometric', 'art_deco_geometric', 'memphis_group', 'brutalist_raw',
  'de_stijl_neoplasticism', 'pop_art_expression', 'vaporwave_retro',
  'corporate_memphis', 'y2k_frutiger_aero', 'mid_century_upa', 'comic_benday',
  'pixel_art_8bit', 'isometric_lowpoly', 'hand_drawn_sketch', 'claymorphism',
  'constructivism_suprematism', 'art_nouveau', 'op_art_psychedelic',
  'print_monochrome_crisp', 'print_early_learner', 'print_stem_technical',
];

export function listStyles(): Array<{ style: string; composable: boolean }> {
  return ALL_STYLES.map((style) => ({ style, composable: !!COMPOSERS[style] }));
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
 * Every generator returns absolutely-positioned elements with hex fills, which
 * is already what `app.create` wants — so this is a rename, not a layout pass.
 * Text keeps its content and size; everything else becomes a rectangle at the
 * element's bounds, because a style's "fan_motif" is a named shape upstream
 * and a filled box here rather than a silently dropped element.
 */
export function sceneToOps(scene: ComposedScene): Array<Record<string, unknown>> {
  const ops: Array<Record<string, unknown>> = [];
  for (const el of scene.elements) {
    const common: Record<string, unknown> = {
      x: el.x, y: el.y,
      fillColor: el.fillHex,
      ...(el.strokeHex ? { strokeColor: el.strokeHex } : {}),
      ...(el.strokeWidthPx !== undefined ? { strokeWidth: el.strokeWidthPx } : {}),
    };

    if (el.content !== undefined && el.content !== '') {
      ops.push({
        type: 'text', name: el.id, ...common, content: el.content,
        ...(el.fontSize !== undefined ? { fontSize: el.fontSize } : {}),
        ...(el.fontFamily ? { fontFamily: el.fontFamily } : {}),
        ...(el.fontWeight !== undefined ? { fontWeight: el.fontWeight } : {}),
      });
    } else if (el.type === 'circle' || el.radius !== undefined) {
      ops.push({ type: 'circle', name: el.id, ...common, radius: el.radius ?? (el.width ?? 0) / 2 });
    } else {
      ops.push({
        type: 'rectangle', name: el.id, ...common,
        width: el.width ?? 0, height: el.height ?? 0,
        // The upstream type is kept as a note rather than dropped: a caller
        // re-reading the scene can tell a frame from a fan motif even though
        // both arrive as rectangles.
        note: el.type,
      });
    }
  }
  return ops;
}
