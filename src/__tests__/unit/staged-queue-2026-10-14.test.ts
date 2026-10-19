/**
 * The tester's staged queue of 2026-10-14 (MCP server 1.6.20), the items that
 * are this server's to fix. Each block names the item and fails on 1.6.21.
 *
 *  - B147          the studio's warning says "Pass { mode: 'merge' }"; the tool
 *                  had no mode, zod stripped it, and the track was replaced.
 *  - UNITS         emitter spin / jitter / fadeOut documented without units.
 *  - IMPORTSHADOW  import_image stripped shadowColor / shadowBlur.
 *  - QUALITYBUNDLE "leave quality to mean compression" — on video it barely does.
 *  - CYBER-SCANLINES, CYBER-HUDFRAME, BAUHAUS-CIRCLE, BAUHAUS-SUBTITLE.
 *  - Owner rule 1  a refused relation (spring_follow "not loaded yet") reported
 *                  success: true with relationId: false.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentBatchOperationSchema, ImportImageInputSchema, KeyframeAnimateInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS as TOOL_DEFINITIONS } from '../../tools/definitions.js';
import { handleToolCall } from '../../tools/handlers.js';
import * as designSystems from '../../design/design-systems.js';

const { compose, sceneToOps } = designSystems;
// Read through the namespace so each case fails on its own on a build without it.
const scalingCollisions = (...a: Parameters<typeof designSystems.scalingCollisions>) => designSystems.scalingCollisions(...a);

const KEYS = [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 10 } }];

/** Run emitted code against a fake studio. Leading comment lines are dropped, as the governor does. */
function run<T = Record<string, unknown>>(code: string, app: Record<string, unknown>): Promise<T> {
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  return Promise.resolve(new Function('app', 'window', `return ${body}`)(app, {}) as T);
}

const tool = (name: string) => {
  const t = TOOL_DEFINITIONS.find((d) => d.name === name);
  if (!t) throw new Error(`no tool ${name}`);
  return t as { description: string; inputSchema: { properties: Record<string, { description?: string; enum?: string[] }> } };
};

describe("B147: mode: 'merge' — the studio's own advice — merges", () => {
  it('the schema keeps mode instead of stripping it', () => {
    const v = KeyframeAnimateInputSchema.parse({ itemId: 'item_1', keyframes: KEYS, mode: 'merge' });
    expect((v as { mode?: string }).mode).toBe('merge');
    expect(tool('pinepaper_keyframe_animate').inputSchema.properties.mode?.enum).toEqual(['replace', 'merge']);
  });

  it('pinepaper_keyframe_animate asks the engine to merge', () => {
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: KEYS, mode: 'merge' } as never);
    expect(code).toContain('"mode":"merge"');
  });

  it('a contradiction is refused, not resolved by guessing', () => {
    const r = KeyframeAnimateInputSchema.safeParse({ itemId: 'item_1', keyframes: KEYS, append: true, mode: 'replace' });
    expect(r.success).toBe(false);
    expect(KeyframeAnimateInputSchema.safeParse({ itemId: 'item_1', keyframes: KEYS, append: false, mode: 'merge' }).success).toBe(false);
    // Agreeing spellings are fine.
    expect(KeyframeAnimateInputSchema.safeParse({ itemId: 'item_1', keyframes: KEYS, append: true, mode: 'merge' }).success).toBe(true);
  });

  it('a batch keyframe_animate op with mode: merge reaches addAnimation as a merge', async () => {
    const seen: Array<Record<string, unknown>> = [];
    const op = AgentBatchOperationSchema.parse({ type: 'keyframe_animate', itemId: 'item_1', keyframes: KEYS, mode: 'merge' });
    const code = codeGenerator.generateAgentBatchExecute({ operations: [op] } as never);
    const r = await run(code, {
      getItemById: (id: string) => ({ data: { id, keyframes: [] } }),
      addAnimation: (_id: string, _k: unknown, opts: Record<string, unknown>) => { seen.push(opts); },
      getCanvasSize: () => ({ width: 800, height: 600 }),
      historyManager: { saveState() {} },
    });
    expect(r.success).toBe(true);
    expect(seen[0]?.mode).toBe('merge');
  });
});

describe('emitter units are documented (spin, jitter, fadeOut) and the per-burst cap is said', () => {
  const d = tool('pinepaper_emitter').description;

  it('names the unit of each', () => {
    expect(d).toMatch(/spin: DEGREES PER SECOND/);
    expect(d).toMatch(/jitter: PIXELS/);
    expect(d).toMatch(/fadeIn \/ fadeOut: SECONDS/);
    // The two behaviours the tester measured as defects: no default 0.5 s, a cap at the life.
    expect(d).toMatch(/fadeOut is capped at that particle's lifetime/);
    expect(d).toMatch(/a circle has no orientation/);
  });

  it('a burst over 2000 particles warns instead of clamping in silence', async () => {
    const code = codeGenerator.generateEmitter({ action: 'create', spec: { bursts: [{ t: 0, x: 0, y: 0, count: 2300 }, { t: 1, x: 0, y: 0, count: 1500 }] } } as never);
    const r = await run(code, {
      setEmitter: () => ({ ok: true }),
      create: () => ({ data: { id: 'item_9' } }),
    });
    expect(r.success).toBe(true);
    expect(r.warnings).toEqual([expect.stringContaining('bursts[0].count 2300')]);
  });
});

describe('IMPORTSHADOW: import_image applies the shadow it is given', () => {
  it('the schema keeps the shadow keys', () => {
    const v = ImportImageInputSchema.parse({ url: 'data:image/png;base64,AAAA', shadowColor: '#000000', shadowBlur: 20, shadowOffset: [4, 6] });
    expect(v).toMatchObject({ shadowColor: '#000000', shadowBlur: 20, shadowOffset: [4, 6] });
    expect(Object.keys(tool('pinepaper_import_image').inputSchema.properties)).toEqual(expect.arrayContaining(['shadowColor', 'shadowBlur', 'shadowOffset']));
  });

  it('the placed image gets it, and the reply says so', async () => {
    const modified: Array<[string, Record<string, unknown>]> = [];
    const raster: Record<string, unknown> = { data: { id: 'item_4' }, bounds: { x: 0, y: 0, width: 100, height: 80 } };
    const code = codeGenerator.generateImportImage(ImportImageInputSchema.parse({
      url: 'data:image/png;base64,AAAA', shadowColor: '#112233', shadowBlur: 18, shadowOffset: [3, 5],
    }));
    const r = await run(code, {
      imageTools: { uploadFromURL: async () => ({ id: 'img_1' }), placeImage: async () => raster },
      modifyItem: (id: string, ch: Record<string, unknown>) => { modified.push([id, ch]); Object.assign(raster, ch); return true; },
    });
    expect(r.success).toBe(true);
    expect(modified).toEqual([['item_4', { shadowColor: '#112233', shadowBlur: 18, shadowOffset: [3, 5] }]]);
    expect(r.shadow).toMatchObject({ applied: true, shadowBlur: 18 });
  });

  it('an import without shadow keys does not touch the item', async () => {
    let calls = 0;
    const code = codeGenerator.generateImportImage(ImportImageInputSchema.parse({ url: 'data:image/png;base64,AAAA' }));
    const r = await run(code, {
      imageTools: { uploadFromURL: async () => ({ id: 'img_1' }), placeImage: async () => ({ data: { id: 'item_4' }, bounds: { x: 0, y: 0, width: 1, height: 1 } }) },
      modifyItem: () => { calls++; return true; },
    });
    expect(r.success).toBe(true);
    expect(calls).toBe(0);
    expect(r.shadow).toBeUndefined();
  });
});

describe('QUALITYBUNDLE: the export docs say what compression does to a video', () => {
  const t = tool('pinepaper_agent_export');
  it('no longer promises quality means compression for video', () => {
    expect(t.description).not.toContain('leave quality to mean compression');
    expect(t.inputSchema.properties.quality.description).not.toContain('leave quality meaning compression');
  });
  it('says it is a ceiling, and names the controls that work', () => {
    expect(t.description).toMatch(/treats that target as a CEILING/);
    expect(t.inputSchema.properties.quality.description).toMatch(/use scale or bitrate/);
  });
});

describe('compose translations', () => {
  const cyber = compose('cyberpunk_neon', { title: 'Neon', subtitle: 'grid' })!;
  const cyberOps = sceneToOps(cyber);
  const byName = (ops: Array<Record<string, unknown>>, n: string) => ops.find((o) => o.name === n)!;

  it('CYBER-SCANLINES: the scanline overlay is lines, not a flat veil', () => {
    const el = cyber.elements.find((e) => e.type === 'scanline_overlay')!;
    const op = byName(cyberOps, el.id);
    expect(op.type).toBe('path');
    const bars = String(op.pathData).match(/M/g)!.length;
    // A 2 px bar every 4 px over the whole height.
    expect(bars).toBe(Math.floor((el.height! - 2) / 4) + 1);
    expect(op.fillColor).toBe(el.fillHex);
    // Centred on the box it replaces.
    expect([op.x, op.y]).toEqual([el.x + el.width! / 2, el.y + el.height! / 2]);
  });

  it('CYBER-HUDFRAME: the frame keeps its cut corners and its glow', () => {
    const el = cyber.elements.find((e) => e.type === 'hud_frame')!;
    const op = byName(cyberOps, el.id);
    expect(op.type).toBe('path');
    const x1 = el.x + el.width!, y1 = el.y + el.height!;
    // polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 32px 100%, 0 calc(100% - 32px))
    expect(op.pathData).toBe(`M${el.x} ${el.y} L${x1 - 32} ${el.y} L${x1} ${el.y + 32} L${x1} ${y1} L${el.x + 32} ${y1} L${el.x} ${y1 - 32} Z`);
    expect(op).toMatchObject({ strokeColor: '#00f0ff', shadowColor: '#00f0ff', shadowOffset: [0, 0] });
  });

  it('CYBER-HUDFRAME: a glowing title carries its text-shadow as a shadow', () => {
    const title = cyber.elements.find((e) => e.id === 'cyber_title')!;
    expect(byName(cyberOps, title.id)).toMatchObject({ shadowColor: '#00f0ff', shadowBlur: 12, shadowOffset: [0, 0] });
  });

  it('BAUHAUS-CIRCLE: the red circle is a circle', () => {
    const scene = compose('bauhaus_geometric', { title: 'Form', subtitle: 'Function' })!;
    const el = scene.elements.find((e) => e.id === 'bauhaus-red-circle')!;
    const op = byName(sceneToOps(scene), el.id);
    expect(op.type).toBe('circle');
    expect(op.radius).toBe(el.width! / 2);
    expect([op.x, op.y]).toEqual([el.x + el.width! / 2, el.y + el.height! / 2]);
  });

  it('BAUHAUS-SUBTITLE: the wide layouts clear the subtitle; where it still lands on the circle it is reported', async () => {
    // Upstream now sizes the circle from the shorter side (mcp-cloud, vendored
    // in 1363459), so 1920x1080 and 1280x720 no longer overlap at all.
    for (const [width, height] of [[1920, 1080], [1280, 720]]) {
      const o = { title: 'Form', subtitle: 'Function and form unite', width, height };
      expect(scalingCollisions('bauhaus_geometric', o, compose('bauhaus_geometric', o)!)).toEqual([]);
    }
    // A squarer landscape still puts the subtitle on the circle: reported, not drawn as intended.
    const opts = { title: 'Form', subtitle: 'Function and form unite', width: 800, height: 600 };
    const wide = compose('bauhaus_geometric', opts)!;
    expect(scalingCollisions('bauhaus_geometric', opts, wide)).toContainEqual({ text: 'bauhaus-subtitle-text', shape: 'bauhaus-red-circle' });
    const plain = { title: 'Form', subtitle: 'Function and form unite' };
    expect(scalingCollisions('bauhaus_geometric', plain, compose('bauhaus_geometric', plain)!)).toEqual([]);

    const out = await handleToolCall('pinepaper_design_system', { action: 'compose', style: 'bauhaus_geometric', draw: false, ...opts }, { executionMode: 'code' });
    const body = JSON.parse((out.content[0] as { text: string }).text);
    const payload = body.data ?? body;
    expect(payload.layoutCollisions).toContainEqual({ text: 'bauhaus-subtitle-text', shape: 'bauhaus-red-circle' });
    expect(payload.layoutWarning).toContain('bauhaus-subtitle-text over bauhaus-red-circle');
  });

  it('a designed overlap at the default size is not reported (vaporwave kanji over the sun)', () => {
    const o = { title: 'Title', subtitle: 'Sub', width: 1080, height: 1350 };
    expect(scalingCollisions('vaporwave_retro', o, compose('vaporwave_retro', o)!)).toEqual([]);
  });
});

describe('owner rule 1: a refused relation is not a success', () => {
  const reason = "relation 'spring_follow' is not loaded yet (its subsystem initialises on first use) — nothing was bound.";
  const refusingApp = () => ({
    getItemById: (id: string) => ({ data: { id } }),
    addRelation: () => false,
    _engineWarnings: [{ message: reason, relation: 'spring_follow', source: 'item_1' }],
    getCanvasSize: () => ({ width: 800, height: 600 }),
    historyManager: { saveState() {} },
  });

  it('a batch relation op refused by the studio fails, with the studio’s reason', async () => {
    const code = codeGenerator.generateAgentBatchExecute({
      operations: [{ type: 'relation', sourceId: 'item_1', targetId: 'item_2', relationType: 'spring_follow' }],
    } as never);
    const r = await run<{ success: boolean; error: string; results: Array<{ success: boolean }> }>(code, refusingApp());
    expect(r.success).toBe(false);
    expect(r.results[0].success).toBe(false);
    expect(r.error).toContain('not loaded yet');
  });

  it('a bound relation is still a success', async () => {
    const code = codeGenerator.generateAgentBatchExecute({
      operations: [{ type: 'relation', sourceId: 'item_1', targetId: 'item_2', relationType: 'follows' }],
    } as never);
    const r = await run<{ success: boolean }>(code, { ...refusingApp(), addRelation: () => 'rel_1' });
    expect(r.success).toBe(true);
  });

  it('pinepaper_add_relation names the studio’s reason', async () => {
    const code = codeGenerator.generateAddRelation({ sourceId: 'item_1', targetId: 'item_2', relationType: 'spring_follow' } as never);
    const r = await run(code, { ...refusingApp(), _isKnownRelationEndpoint: () => true });
    expect(r.success).toBe(false);
    expect(String(r.error)).toContain('not loaded yet');
  });

  it('pinepaper_create_scene does not list a refused relation as made', async () => {
    const code = codeGenerator.generateCreateScene({
      items: [{ name: 'a', itemType: 'circle' }, { name: 'b', itemType: 'circle' }],
      relations: [{ source: 'a', target: 'b', type: 'spring_follow' }],
      clearFirst: false,
    } as never);
    let n = 0;
    const r = await run<{ success?: boolean; relations: unknown[]; relationsRefused: unknown[]; error: string }>(code, {
      ...refusingApp(),
      create: () => ({ data: { id: `item_${++n}` }, bringToFront() {} }),
      registerItem: () => `item_${++n}`,
      generatorRegistry: { get: () => null },
    });
    expect(r.success).toBe(false);
    expect(r.relations).toEqual([]);
    expect(r.relationsRefused).toHaveLength(1);
    expect(r.error).toContain('spring_follow');
  });
});
