import { describe, it, expect } from 'bun:test';
import {
  CRAFT_TOOL_NAMES,
  craftToolDefinitions,
  generateDrawWeave,
  generateDrawKnots,
  generateDrawSashiko,
  generateDrawSubdivision,
  generateUiKit,
  uiKitCallProblems,
} from '../../tools/craft-tools.js';
import { UI_KIT_RUNTIME } from '../../vendor/design/ui-kit-runtime.js';
import {
  DrawWeaveInputSchema,
  DrawKnotsInputSchema,
  DrawSashikoInputSchema,
  DrawSubdivisionInputSchema,
  UiKitInputSchema,
} from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';

/** Code with the per-call id prefix blanked, so two generations compare on what the options did. */
const stable = (code: string) => code.replace(/_[0-9a-z]{8,}(?=["_])/g, '_ID');
const parses = (code: string) => expect(() => new Function(code)).not.toThrow();

describe('the cloud craft tools, shared', () => {
  it('all five are served, once each', () => {
    for (const name of CRAFT_TOOL_NAMES) {
      expect(PINEPAPER_TOOLS.filter((t) => t.name === name)).toHaveLength(1);
    }
  });

  it('their words are the local door\'s: no cloud canvas, price or render step', () => {
    const text = JSON.stringify(craftToolDefinitions());
    expect(text).not.toMatch(/\[Cost:|cloud canvas|Appends to canvas state|pinepaper_render|1280x720/);
  });

  it('every generated script parses', () => {
    parses(generateDrawWeave(DrawWeaveInputSchema.parse({ weave: 'herringbone' })));
    parses(generateDrawKnots(DrawKnotsInputSchema.parse({ points: [{ x: 10, y: 10 }] })));
    parses(generateDrawSashiko(DrawSashikoInputSchema.parse({ pattern: 'asanoha' })));
    parses(generateDrawSubdivision(DrawSubdivisionInputSchema.parse({ preset: 'swiss', seed: 3 })));
    parses(generateUiKit(UiKitInputSchema.parse({ action: 'phone_lock_screen', notifications: [{ app: 'Acme', title: 'Hi' }], prompt: { text: 'Plan my day' } }))!);
  });

  it('fill the studio canvas by default, and explicit bounds win', () => {
    const frame = { x: 0, y: 0, width: 1080, height: 1920 };
    expect(generateDrawWeave({}, frame)).toContain('x1 = 1080, y1 = 1920');
    expect(generateDrawWeave({ bounds: { width: 300 } }, frame)).toContain('x1 = 300, y1 = 1920');
  });

  it('each call registers under its own ids', () => {
    const a = generateDrawWeave({});
    const b = generateDrawWeave({});
    const prefix = (c: string) => /const id = "([^"]+)_warp_"/.exec(c)?.[1];
    expect(prefix(a)).toBeTruthy();
    expect(prefix(a)).not.toEqual(prefix(b));
  });

  it('a colour that is not a colour never reaches the script', () => {
    expect(() => DrawWeaveInputSchema.parse({ warpColor: '#fff"; alert(1); "' })).toThrow();
    expect(() => DrawSashikoInputSchema.parse({ groundColor: 'red);x(' })).toThrow();
    expect(DrawWeaveInputSchema.parse({ warpColor: 'rgba(1, 2, 3, 0.5)' }).warpColor).toBe('rgba(1, 2, 3, 0.5)');
  });

  // schema-fields-are-consumed.test.ts allowlists these as read inside the
  // vendored generators. This is the proof: each one moves the code.
  const moves: Array<[string, (v: Record<string, unknown>) => string, Record<string, unknown>, Record<string, unknown>]> = [
    ['weave.bundleGap', (v) => generateDrawWeave(v as never), { weave: 'basket' }, { bundleGap: 9 }],
    ['weave.bundleSize', (v) => generateDrawWeave(v as never), { weave: 'basket' }, { bundleSize: 5 }],
    ['weave.chevronWidth', (v) => generateDrawWeave(v as never), { weave: 'herringbone' }, { chevronWidth: 77 }],
    ['weave.floatRatio', (v) => generateDrawWeave(v as never), { weave: 'twill' }, { floatRatio: 3 }],
    ['weave.slubJitter', (v) => generateDrawWeave(v as never), {}, { slubJitter: 0.15 }],
    ['weave.threadThickness', (v) => generateDrawWeave(v as never), {}, { threadThickness: 4 }],
    ['weave.twillVariant', (v) => generateDrawWeave(v as never), { weave: 'twill' }, { twillVariant: 'herringbone' }],
    ['knots.defaultRadius', (v) => generateDrawKnots(v as never), { points: [{ x: 1, y: 1 }] }, { defaultRadius: 11 }],
    ['sashiko.concentricArcs', (v) => generateDrawSashiko(v as never), {}, { concentricArcs: 5 }],
    ['sashiko.gapLength', (v) => generateDrawSashiko(v as never), {}, { gapLength: 7 }],
    ['sashiko.stitchLength', (v) => generateDrawSashiko(v as never), {}, { stitchLength: 13 }],
    ['sashiko.threadWidth', (v) => generateDrawSashiko(v as never), {}, { threadWidth: 3 }],
    ['sashiko.vertexGap', (v) => generateDrawSashiko(v as never), { pattern: 'asanoha' }, { vertexGap: 9 }],
    ['subdivision.cellInset', (v) => generateDrawSubdivision(v as never), { seed: 1 }, { cellInset: 9 }],
    ['subdivision.colorProbability', (v) => generateDrawSubdivision(v as never), { seed: 1 }, { colorProbability: 0.95 }],
    ['subdivision.dividerWidth', (v) => generateDrawSubdivision(v as never), { seed: 1 }, { dividerWidth: 17 }],
    ['subdivision.minDepth', (v) => generateDrawSubdivision(v as never), { seed: 1, maxDepth: 6 }, { minDepth: 5 }],
    ['subdivision.nestedProbability', (v) => generateDrawSubdivision(v as never), { seed: 1, colorProbability: 1 }, { nestedProbability: 1 }],
    ['subdivision.splitBias', (v) => generateDrawSubdivision(v as never), { seed: 1 }, { splitBias: [0.1, 0.2] }],
  ];
  for (const [label, gen, base, change] of moves) {
    it(`${label} changes what is drawn`, () => {
      expect(stable(gen({ ...base, ...change }))).not.toEqual(stable(gen(base)));
    });
  }
});

describe('pinepaper_ui_kit locally', () => {
  it('the vendored kit still declares its default faces where the local font swap expects them', () => {
    expect(UI_KIT_RUNTIME).toContain("fonts: { heading: 'Geist', body: 'Geist', mono: 'Geist Mono' }");
  });

  it('loads Geist first, and falls back to Inter, the studio\'s face, when it cannot', () => {
    const code = generateUiKit({ action: 'toggle' } as never)!;
    expect(code).toContain('app.checkFont("Geist")');
    expect(code).toContain('app.checkFont("Geist Mono")');
    expect(code).toContain("? 'Inter' : 'Geist'");
    expect(code).toContain('heading: __kitFace');
    expect(code).not.toContain("heading: 'Geist'");
  });

  it('draws in the active brand kit unless the call brings its own brand', () => {
    expect(generateUiKit({ action: 'toggle' } as never)).toContain('UIKit.brand(window.__ppActiveBrand)');
    const own = generateUiKit({ action: 'toggle', brand: { primary: '#ff0000', headingFont: 'Anton' } } as never)!;
    expect(own).not.toContain('window.__ppActiveBrand)');
    expect(own).toContain('UIKit.brand({');
    expect(own).toContain('app.checkFont("Anton")');
  });

  it('refuses an action it does not have, before drawing', () => {
    expect(uiKitCallProblems({ action: 'smartwatch' } as never)[0]).toContain('action must be one of');
    expect(() => UiKitInputSchema.parse({ action: 'smartwatch' })).toThrow();
  });
});

describe('pinepaper_draw_knots', () => {
  it('refuses a call with no points instead of reporting success for nothing', async () => {
    const r = await handleToolCall('pinepaper_draw_knots', {}, {} as never);
    expect(r.isError).toBe(true);
    expect((r.content[0] as { text: string }).text).toContain('give points');
  });
});
