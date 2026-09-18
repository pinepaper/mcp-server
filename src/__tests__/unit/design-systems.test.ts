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
  listSystems, getSystem, listEasings, listStyles, compose, sceneToOps, ALL_STYLES,
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
