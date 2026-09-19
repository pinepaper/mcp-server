/**
 * pinepaper_design_system — the design vocabulary as data, and 18 styles that
 * can build a scene.
 *
 * WHERE THIS LIVES AND WHY. The style generators and the DTCG token store are
 * knowledge an LLM uses to compose, not machinery the canvas needs to draw.
 * Putting them in FxTool would bulk up the editor with a vocabulary its users
 * never see. They belong on the tool surface — and because the hosted service
 * RUNS this server, the copy here is the copy the cloud ends up using, which
 * is what makes the cloud's own runtime copy redundant rather than a second
 * authority.
 *
 * The data is VENDORED from mcp-cloud by scripts/sync-design-systems.mjs, the
 * same shape as FxTool's sync-stick-modules.mjs: one authored copy upstream, a
 * mechanical mirror here, a sha256 in every header, and a provenance test.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  listSystems, getSystem, listEasings, listStyles, compose, sceneToOps, styleTokens, ALL_STYLES,
} from '../../design/design-systems.js';
import { DesignSystemInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';

const VENDOR_DIR = join(import.meta.dir, '..', '..', 'vendor', 'design');

describe('the vendored copy is generated, not authored', () => {
  it('every vendored file carries its provenance header and a sha256', () => {
    const files = readdirSync(VENDOR_DIR).filter((f) => f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(15);
    for (const f of files) {
      const head = readFileSync(join(VENDOR_DIR, f), 'utf-8').slice(0, 600);
      expect(head).toContain('GENERATED — DO NOT EDIT');
      expect(head).toContain('mcp-cloud/src/services/');
      expect(head).toMatch(/sha256:\s+[0-9a-f]{64}/);
      expect(head).toContain('sync-design-systems.mjs');
    }
  });

  it('nothing imports the cloud service layer — only the sliced union', () => {
    // The generators import DesignStyle from content-recipes, a 900-line module
    // of unrelated cloud concerns. Vendoring that whole file to satisfy one type
    // is how a mirror becomes a fork.
    for (const f of readdirSync(VENDOR_DIR).filter((x) => x.endsWith('.ts'))) {
      expect(readFileSync(join(VENDOR_DIR, f), 'utf-8')).not.toContain('from "./content-recipes"');
    }
  });
});

describe('design systems are not aesthetic styles', () => {
  it('lists real systems with vendor, licence and version', () => {
    const systems = listSystems();
    expect(systems.length).toBeGreaterThanOrEqual(15);
    const m3 = systems.find((s) => s.id === 'material_3')!;
    expect(m3.vendor).toBe('Google');
    expect(m3.license).toBe('Apache-2.0');
    expect(m3.tokenCount).toBeGreaterThan(0);
    // A licence on every one — that is the difference from a style.
    for (const s of systems) expect(s.license.length).toBeGreaterThan(0);
  });

  it('filters one system\'s tokens by DTCG type', () => {
    const all = getSystem('material_3')!;
    const beziers = getSystem('material_3', 'cubicBezier')!;
    expect(Object.keys(beziers.tokens).length).toBeGreaterThan(0);
    expect(Object.keys(beziers.tokens).length).toBeLessThan(Object.keys(all.tokens).length);
    for (const t of Object.values(beziers.tokens)) expect(t.$type).toBe('cubicBezier');
  });

  it('an unknown system is null, so the handler can name it', () => {
    expect(getSystem('material_4')).toBeNull();
  });
});

describe('named easings carry their provenance', () => {
  it('distinguishes a vendor\'s published curve from one authored here', () => {
    const all = listEasings();
    expect(all.length).toBeGreaterThan(15);
    const authored = listEasings(true);
    const vendor = listEasings(false);
    expect(authored.length).toBeGreaterThan(0);
    expect(vendor.length).toBeGreaterThan(0);
    expect(authored.length + vendor.length).toBe(all.length);
    // Both are usable and they are NOT the same claim.
    for (const e of authored) expect(e.authored).toBe(true);
    for (const e of vendor) expect(e.authored).toBe(false);
  });

  it('names are system-qualified, so two systems\' "standard" cannot collide', () => {
    const names = listEasings().map((e) => e.name);
    expect(new Set(names).size).toBe(names.length);
    for (const n of names) expect(n).toContain('.');
  });

  it('every easing is a usable cubic-bezier with its licence attached', () => {
    for (const e of listEasings()) {
      expect(e.cubicBezier).toMatch(/^cubic-bezier\([-0-9., ]+\)$/);
      expect(e.values).toHaveLength(4);
      expect(e.license.length).toBeGreaterThan(0);
    }
  });
});

describe('composing a scene', () => {
  const composable = listStyles().filter((s) => s.composable).map((s) => s.style);

  it('says which styles can compose rather than returning nothing', () => {
    expect(listStyles().length).toBe(ALL_STYLES.length);
    expect(composable.length).toBe(18);
    // A style that is named but cannot build is not a failure — it is a fact,
    // and the caller learns it from the list rather than from an empty result.
    expect(compose('comic_benday', { title: 'x' })).toBeNull();
  });

  it('EVERY composable style produces elements — both upstream shapes', () => {
    // Seven generators return {width, height, elements[]}; eleven return
    // {canvas:{}, items[]}. Reading only the first works for seven styles and
    // silently returns an empty scene for the rest.
    const shapes = new Set<string>();
    for (const style of composable) {
      const scene = compose(style, { title: 'Title', subtitle: 'Subtitle' })!;
      expect(scene, `${style} composed nothing`).toBeTruthy();
      expect(scene.elements.length, `${style} produced no elements`).toBeGreaterThan(0);
      expect(scene.width).toBeGreaterThan(0);
      expect(scene.height).toBeGreaterThan(0);
      shapes.add(scene.composedFrom);
    }
    // Both shapes are actually exercised, so neither branch can rot unnoticed.
    expect([...shapes].sort()).toEqual(['layout', 'scene']);
  });

  it('turns every element into an op, losing none of them', () => {
    for (const style of composable) {
      const scene = compose(style, { title: 'Title' })!;
      const ops = sceneToOps(scene);
      expect(ops.length, `${style} dropped elements`).toBe(scene.elements.length);
      for (const op of ops) {
        expect(op.type).toBeTruthy();
        expect(op.fillColor).toBeTruthy();
      }
    }
  });

  it('keeps the upstream element type as a note rather than dropping it', () => {
    const ops = sceneToOps(compose('art_deco_geometric', { title: 'T' })!);
    const noted = ops.filter((o) => typeof o.note === 'string');
    expect(noted.length).toBeGreaterThan(0);
  });

  it('text becomes text and keeps its content', () => {
    const ops = sceneToOps(compose('swiss_typographic', { title: 'HELLO' })!);
    const texts = ops.filter((o) => o.type === 'text');
    expect(texts.length).toBeGreaterThan(0);
    expect(JSON.stringify(texts)).toContain('HELLO');
  });
});

/**
 * The generators author a TOP-LEFT box; app.create is CENTRE-anchored
 * (js/shapes/basic.js: `point: position - size/2` for a rectangle,
 * `center: position` for a circle). Passing x/y through put every composed
 * scene half a box off, and left-aligned headlines far worse than that — which
 * is why composing was reported unusable and every style scene hand-built from
 * primitives instead.
 */
describe('sceneToOps anchors where the engine anchors', () => {
  const composable = listStyles().filter((s) => s.composable).map((s) => s.style);

  it('moves a box to its centre', () => {
    // bauhaus authors its colour block as a top-left box.
    const scene = compose('bauhaus_geometric', { title: 'T' })!;
    const el = scene.elements.find((e) => e.width && e.height && e.content === undefined)!;
    const op = sceneToOps(scene).find((o) => o.name === el.id)!;
    expect(op.x).toBe(el.x + el.width! / 2);
    expect(op.y).toBe(el.y + el.height! / 2);
  });

  it('leaves a radius-authored circle exactly where it is', () => {
    // art-nouveau's halo and op-art's rings are authored FROM a centre. A
    // blanket shift would break the styles that were already correct.
    const scene = compose('art_nouveau', { title: 'T' })!;
    const el = scene.elements.find((e) => e.radius !== undefined)!;
    const op = sceneToOps(scene).find((o) => o.name === el.id)!;
    expect(op.x).toBe(el.x);
    expect(op.y).toBe(el.y);
    expect(op.radius).toBe(el.radius);
  });

  it('carries textAlign through as alignment, which the engine reads', () => {
    // The engine's own comment: templates and scenes author `alignment`, and
    // reading only `justification` is what "silently centered on its anchor"
    // meant. Dropping it here had the same effect one layer up.
    const scene = compose('bauhaus_geometric', { title: 'HEADLINE' })!;
    const el = scene.elements.find((e) => e.content === 'HEADLINE')!;
    expect(el.textAlign).toBe('left');
    const op = sceneToOps(scene).find((o) => o.name === el.id)!;
    expect(op.alignment).toBe('left');
    // left-aligned: x IS the left edge, so it must not move…
    expect(op.x).toBe(el.x);
    // …and a 600px headline at x=108 must not start at -192.
    expect(op.x as number).toBeGreaterThan(0);
  });

  it('every op carries an alignment the engine understands', () => {
    for (const style of composable) {
      for (const op of sceneToOps(compose(style, { title: 'T', subtitle: 'S' })!)) {
        if (op.type !== 'text') continue;
        expect(['left', 'center', 'right'], `${style}`).toContain(op.alignment as string);
      }
    }
  });

  it('every box lands on its own centre, in every style', () => {
    // The general form of the first case. A radius-authored shape is exempt
    // because it already carries its centre; everything else is a top-left box.
    for (const style of composable) {
      const scene = compose(style, { title: 'Title', subtitle: 'Subtitle' })!;
      const ops = sceneToOps(scene);
      for (const el of scene.elements) {
        if (el.radius !== undefined || el.content) continue;
        const op = ops.find((o) => o.name === el.id)!;
        expect(op.x, `${style}/${el.id}`).toBe(el.x + (el.width ?? 0) / 2);
        expect(op.y, `${style}/${el.id}`).toBe(el.y + (el.height ?? 0) / 2);
      }
    }
  });

  it('no style anchors its TEXT off-canvas any more', () => {
    // Deliberately text-only. A decorative motif may be anchored outside the
    // frame on purpose — frutiger-aero's hill is a width*0.8 circle centred at
    // y = 1.3 x height, a horizon bleeding in from below — and an invariant
    // that failed on it would be measuring the wrong thing. Copy that never
    // should have left the canvas is what was reported, and what this pins.
    for (const style of composable) {
      const scene = compose(style, { title: 'Title', subtitle: 'Subtitle' })!;
      for (const op of sceneToOps(scene)) {
        if (op.type !== 'text') continue;
        const x = op.x as number;
        const y = op.y as number;
        expect(x, `${style}/${op.name} anchored off-canvas in x`).toBeGreaterThanOrEqual(0);
        expect(x, `${style}/${op.name} anchored off-canvas in x`).toBeLessThanOrEqual(scene.width);
        expect(y, `${style}/${op.name} anchored off-canvas in y`).toBeGreaterThanOrEqual(0);
        expect(y, `${style}/${op.name} anchored off-canvas in y`).toBeLessThanOrEqual(scene.height);
      }
    }
  });
});

/**
 * The palettes and type were always one layer below the API: every generator
 * holds them, `listStyles` published neither, and the only way to build in a
 * style by hand was to read this server's source. Derived by composing, never
 * transcribed — 18 hand-copied `*_PALETTE` constants would drift the first time
 * sync:design pulled an upstream change.
 */
describe('style tokens are discoverable from the tool surface', () => {
  it('a composable style reports a palette, fonts and type sizes', () => {
    const t = styleTokens('bauhaus_geometric')!;
    expect(t.composable).toBe(true);
    expect(t.palette.length).toBeGreaterThan(0);
    for (const c of t.palette) expect(c).toMatch(/^#|^rgb|^hsl/);
    expect(t.fonts.length).toBeGreaterThan(0);
    expect(t.fontSizes.length).toBeGreaterThan(0);
    expect([...t.fontSizes].sort((a, b) => a - b)).toEqual(t.fontSizes);
  });

  it('every composable style has tokens, and no describable-only style invents any', () => {
    for (const { style, composable, palette, fonts } of listStyles()) {
      if (composable) {
        expect(palette.length, `${style} has no palette`).toBeGreaterThan(0);
        expect(fonts.length, `${style} has no fonts`).toBeGreaterThan(0);
      } else {
        // No generator to ask. An invented palette would be worse than none.
        expect(palette, `${style} invented a palette`).toEqual([]);
        expect(fonts, `${style} invented fonts`).toEqual([]);
      }
    }
  });

  it('derives from the generator, so it cannot drift from what gets drawn', () => {
    const t = styleTokens('bauhaus_geometric')!;
    const scene = compose('bauhaus_geometric', { title: 'T' })!;
    const drawn = new Set(scene.elements.map((e) => e.fillHex));
    for (const hex of drawn) {
      if (hex === 'transparent') continue;
      expect(t.palette, `${hex} is drawn but not published`).toContain(hex);
    }
  });

  it('names the variants that change a palette rather than passing one off as all of it', () => {
    expect(styleTokens('art_deco_geometric')!.variants).toEqual(['emerald']);
    expect(styleTokens('bauhaus_geometric')!.variants).toBeUndefined();
  });

  it('an unknown style is null, not an empty token set', () => {
    expect(styleTokens('not_a_style')).toBeNull();
  });
});

describe('the schema and the tool surface', () => {
  it('refuses an incomplete call by naming the field', () => {
    for (const [input, field] of [
      [{ action: 'get_system' }, 'systemId'],
      [{ action: 'compose' }, 'style'],
      [{ action: 'compose', style: 'bauhaus_geometric' }, 'title'],
    ] as Array<[Record<string, unknown>, string]>) {
      const r = DesignSystemInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
    expect(DesignSystemInputSchema.safeParse({ action: 'list_systems' }).success).toBe(true);
  });

  it('draw defaults to true, and false is a real choice', () => {
    expect(DesignSystemInputSchema.parse({ action: 'compose', style: 'x', title: 'y' }).draw).toBe(true);
    expect(DesignSystemInputSchema.parse({ action: 'compose', style: 'x', title: 'y', draw: false }).draw).toBe(false);
  });

  it('the description keeps the two ideas apart', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_design_system')!;
    expect(tool.description).toContain('licensed, versioned product');
    expect(tool.description).toContain('AESTHETIC STYLE');
    expect(tool.description).toContain('pinepaper:authored');
  });

  it('recognizes 21 licensed design systems including the 6 added upstream', () => {
    const systems = listSystems();
    expect(systems).toHaveLength(21);
    const ids = systems.map((s) => s.id);
    expect(ids).toContain('radix_shadcn');
    expect(ids).toContain('salesforce_slds2');
    expect(ids).toContain('adobe_spectrum2');
    expect(ids).toContain('ant_design_mobile');
    expect(ids).toContain('tailwind_tokens');
    expect(ids).toContain('chakra_ui');
  });

  it('recognizes 31 styles in ALL_STYLES including the 3 print additions', () => {
    expect(ALL_STYLES).toHaveLength(31);
    expect(ALL_STYLES).toContain('print_monochrome_crisp');
    expect(ALL_STYLES).toContain('print_early_learner');
    expect(ALL_STYLES).toContain('print_stem_technical');
  });

  it('handles cloud tool aliases seamlessly', async () => {
    // pinepaper_design_systems with systemName="all"
    const listRes = await handleToolCall('pinepaper_design_systems', { systemName: 'all' });
    expect(listRes.isError).toBeFalsy();
    const listText = (listRes.content[0] as any).text;
    expect(listText).toContain('radix_shadcn');

    // pinepaper_design_systems with systemName="material3" (normalized to material_3)
    const getRes = await handleToolCall('pinepaper_design_systems', { systemName: 'material3' });
    expect(getRes.isError).toBeFalsy();
    const getText = (getRes.content[0] as any).text;
    expect(getText).toContain('Material Design 3');

    // pinepaper_design_styles
    const stylesRes = await handleToolCall('pinepaper_design_styles', {});
    expect(stylesRes.isError).toBeFalsy();
    const stylesText = (stylesRes.content[0] as any).text;
    expect(stylesText).toContain('swiss_typographic');

    // pinepaper_stick_figure
    const stickRes = await handleToolCall('pinepaper_stick_figure', { action: 'figure', style: 'plain' });
    expect(stickRes.isError).toBeFalsy();
  });
});
