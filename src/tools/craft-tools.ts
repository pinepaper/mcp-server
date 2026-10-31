/**
 * THE CLOUD'S CRAFT TOOLS, LOCALLY (1.6.21): pinepaper_draw_weave, _draw_knots,
 * _draw_sashiko, _draw_subdivision and pinepaper_ui_kit.
 *
 * mcp-cloud authors them and this package does not fork them: the generators,
 * the public JSON schemas and the UI kit runtime are vendored whole by
 * scripts/sync-design-systems.mjs (src/vendor/design/, check:design fails on a
 * drift). What lives here is only what differs between the two doors:
 *
 *   - THE WORDS. Upstream descriptions say the call is recorded on a cloud
 *     canvas, costs $0.001 and is drawn by pinepaper_render. Locally the call
 *     draws on the studio canvas at once and is free, so those clauses go.
 *   - THE FRAME. The generators default to a 1280x720 rectangle. The handler
 *     asks the studio for its canvas first and passes it as bounds.
 *   - THE IDS. The generators name items `${prefix}_warp_0`…; a second weave
 *     with the same prefix would re-register the first one's ids. Each call
 *     gets its own prefix.
 *   - THE TYPE. The kit sets type in Geist. The studio registers only Inter
 *     (prod probe 2026-10-13), so the call loads Geist and Geist Mono first, as
 *     brand_kit loads a brand's faces (emitEnsureFont: the studio, then Google
 *     Fonts). If that fails the kit draws in Inter, the studio's own face, and
 *     the result says which face it used.
 *   - THE BRAND. The engine's applyBrandKit recolours what is on the canvas and
 *     keeps nothing. pinepaper_brand_kit set leaves the active brand on
 *     window.__ppActiveBrand, and the UI kit draws in it when the call names no
 *     brand of its own — the cloud does the same from the scene's brand_kit op
 *     (ui-kit-attach.ts).
 */
import type { Tool } from '../mcp/index.js';
import { generateTextileCode } from '../vendor/design/textile-weave-generator.js';
import { generateRecursiveSubdivisionCode } from '../vendor/design/recursive-subdivision-generator.js';
import { textileTools } from '../vendor/design/textile-tool-schema.js';
import { subdivisionTools } from '../vendor/design/subdivision-tool-schema.js';
import { UI_KIT_RUNTIME } from '../vendor/design/ui-kit-runtime.js';
import { UI_KIT_ACTIONS, uiKitTools, uiKitProblems, generateUiKitCode } from '../vendor/design/ui-kit-tool-schema.js';
import { emitEnsureFont } from '../types/code-generator.js';
import type {
  DrawWeaveInput,
  DrawKnotsInput,
  DrawSashikoInput,
  DrawSubdivisionInput,
  UiKitInput,
} from '../types/schemas.js';

export const CRAFT_TOOL_NAMES = [
  'pinepaper_draw_weave',
  'pinepaper_draw_knots',
  'pinepaper_draw_sashiko',
  'pinepaper_draw_subdivision',
  'pinepaper_ui_kit',
] as const;

export interface CraftBounds { x: number; y: number; width: number; height: number }

/** Where the kit declares its default faces; replaced by the faces this studio actually loaded. */
const KIT_DEFAULT_FONTS = "fonts: { heading: 'Geist', body: 'Geist', mono: 'Geist Mono' }";
const KIT_LOADED_FONTS = 'fonts: { heading: __kitFace, body: __kitFace, mono: __kitMono }';

/** Cloud-only clauses in the upstream words, and what they say locally. */
function localWords(text: string): string {
  return text
    .replace(/\s*\[Cost: [^\]]*\]/g, '')
    .replace(/\s*Appends to canvas state[^.]*\./g, ' Draws on the canvas as ordinary items you can select and edit.')
    .replace(/\s*Recorded on your cloud canvas and drawn by pinepaper_render\./g, ' Draws on the canvas at once.')
    .replace(/\(default: full canvas 1280x720 or 1080x1350\)/g, '(default: the canvas)')
    .replace(/\(default Geist\)/g, '(default Inter)')
    .trim();
}

function localise<T>(value: T): T {
  if (typeof value === 'string') return localWords(value) as T;
  if (Array.isArray(value)) return value.map(localise) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = k === 'description' || typeof v === 'object' ? localise(v) : v;
    return out as T;
  }
  return value;
}

const TITLES: Record<string, string> = {
  pinepaper_draw_weave: 'Draw Weave',
  pinepaper_draw_knots: 'Draw Knots',
  pinepaper_draw_sashiko: 'Draw Sashiko',
  pinepaper_draw_subdivision: 'Draw Subdivision',
  pinepaper_ui_kit: 'UI Kit',
};

/** The five tool definitions: upstream schemas, local words. */
export function craftToolDefinitions(): Tool[] {
  return [...textileTools(), ...subdivisionTools(), ...uiKitTools()].map((t) => {
    const def = localise(t) as { name: string; description: string; inputSchema: Tool['inputSchema'] };
    if (def.name === 'pinepaper_draw_knots') {
      def.description += ' Needs points: the knots go exactly where you put them.';
    }
    if (def.name === 'pinepaper_ui_kit') {
      def.description += ` Actions: ${UI_KIT_ACTIONS.join(', ')}.`;
    }
    return {
      name: def.name,
      annotations: {
        title: TITLES[def.name] ?? def.name,
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      description: def.description,
      inputSchema: def.inputSchema,
    };
  });
}

/** JS that answers the canvas rectangle the craft tools fill by default. */
export const CRAFT_FRAME_JS =
  '(function(){ var c = app.getCanvasSize ? app.getCanvasSize() : null;' +
  ' return c && c.width > 0 && c.height > 0 ? { x: 0, y: 0, width: c.width, height: c.height } : null; })()';

/** A prefix no earlier call used: the generators register items by prefix + index. */
export function craftPrefix(base: string): string {
  return `${base}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** The generator's value is a Group; the result reports how many items the call registered instead. */
function reported(code: string, tool: string): string {
  return `var __before = app.itemRegistry ? app.itemRegistry.getAll().length : 0;
${code}
({ success: true, tool: ${JSON.stringify(tool)}, itemCount: app.itemRegistry ? app.itemRegistry.getAll().length - __before : null });`;
}

export function generateDrawWeave(input: DrawWeaveInput, frame?: CraftBounds): string {
  const bounds = input.bounds ? { ...frame, ...input.bounds } : frame;
  return reported(generateTextileCode({ ...input, type: input.weave ?? 'plain', bounds, idPrefix: craftPrefix(`${input.weave ?? 'plain'}_weave`) } as never), 'pinepaper_draw_weave');
}

export function generateDrawKnots(input: DrawKnotsInput): string {
  return reported(generateTextileCode({ ...input, type: 'knots', idPrefix: craftPrefix('embroidery_knot') } as never), 'pinepaper_draw_knots');
}

export function generateDrawSashiko(input: DrawSashikoInput, frame?: CraftBounds): string {
  const bounds = input.bounds ? { ...frame, ...input.bounds } : frame;
  return reported(generateTextileCode({ ...input, type: 'sashiko', bounds, idPrefix: craftPrefix(`sashiko_${input.pattern ?? 'seigaiha'}`) } as never), 'pinepaper_draw_sashiko');
}

export function generateDrawSubdivision(input: DrawSubdivisionInput, frame?: CraftBounds): string {
  const bounds = input.bounds ? { ...frame, ...input.bounds } : frame;
  return reported(generateRecursiveSubdivisionCode({ ...input, bounds, idPrefix: input.idPrefix ?? craftPrefix('subdiv') } as never), 'pinepaper_draw_subdivision');
}

/** Problems with a ui_kit call, in the kit's own words. Empty when it draws. */
export function uiKitCallProblems(input: UiKitInput): string[] {
  return uiKitProblems(input as Record<string, unknown>);
}

/**
 * The kit, its faces loaded, the canvas brand when the call names none, then the
 * call. Null when the call cannot draw (see uiKitCallProblems).
 */
export function generateUiKit(input: UiKitInput): string | null {
  const call = generateUiKitCode(input as Record<string, unknown>);
  if (!call) return null;
  if (!UI_KIT_RUNTIME.includes(KIT_DEFAULT_FONTS)) {
    // The kit's defaults moved upstream; craft-tools.test.ts fails on this too.
    throw new Error('ui_kit: the vendored kit no longer declares its default fonts where this package expects them');
  }
  const brand = (input as { brand?: { headingFont?: unknown; bodyFont?: unknown } }).brand;
  const brandFaces = [brand?.headingFont, brand?.bodyFont].filter((f): f is string => typeof f === 'string' && /^[\w \-]{1,60}$/.test(f.trim()));
  const ensure = (family: string, slot: string) =>
    `  ${slot} = await (async function() {${emitEnsureFont(family).replace(/\n/g, '\n  ')}\n    return __font;\n  })();\n  if (${slot}) __fonts.push(${slot});`;
  const runtime = UI_KIT_RUNTIME.replace(KIT_DEFAULT_FONTS, KIT_LOADED_FONTS);
  return `// UI kit: ${input.action}
(async function() {
  const __fonts = [];
  let __geist, __geistMono, __b;
${ensure('Geist', '__geist')}
${ensure('Geist Mono', '__geistMono')}
${[...new Set(brandFaces.map((f) => f.trim()))].map((f) => ensure(f, '__b')).join('\n')}
  // Geist is the kit's face; a studio that cannot load it draws in Inter, its own face, not a browser substitute.
  var __kitFace = (__geist && __geist.available === false) ? 'Inter' : 'Geist';
  var __kitMono = (__geistMono && __geistMono.available === false) ? 'monospace' : 'Geist Mono';
${runtime}
${brand ? '' : "  if (typeof window !== 'undefined' && window.__ppActiveBrand) UIKit.brand(window.__ppActiveBrand);\n"}  var __before = app.itemRegistry ? app.itemRegistry.getAll().length : 0;
${call}
  return { success: true, tool: 'pinepaper_ui_kit', action: ${JSON.stringify(input.action)},
    itemCount: app.itemRegistry ? app.itemRegistry.getAll().length - __before : null,
    face: __kitFace, brand: ${brand ? "'call'" : "(typeof window !== 'undefined' && window.__ppActiveBrand) ? 'active brand kit' : 'kit defaults'"},
    ...(__fonts.length ? { fonts: __fonts } : {}) };
})();`;
}
