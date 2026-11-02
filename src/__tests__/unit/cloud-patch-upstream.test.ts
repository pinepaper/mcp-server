/**
 * The fixes mcp-cloud carried as a local patch on 1.6.24, upstreamed in 1.6.29 so the hosted server needs no patch.
 * Each was re-checked against FxTool main (c7d337c1) first: ADDANIM-UNSORTED (keyframe order) is fixed in the engine
 * and was dropped; the others are still the engine's behaviour, so the server works around or says them.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';
import { DesignMediumInputSchema, MorphSequenceInputSchema, ImageFilterInputSchema, LookInputSchema } from '../../types/schemas.js';

describe('CROWMOON: scale at create', () => {
  function run(code: string, calls: unknown[]) {
    const item = { data: { registryId: 'item_1' }, scaling: { x: 1, y: 1 }, bringToFront() {} };
    const app = {
      create: () => item,
      historyManager: { saveState() {} },
      modifyItem: (id: string, ch: { scaleX?: number; scaleY?: number }) => { calls.push([id, ch]); item.scaling = { x: ch.scaleX ?? 1, y: ch.scaleY ?? 1 }; },
    };
    return new Function('app', `${code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`)}`)(app) as Record<string, any>;
  }

  it('applies scaleX / scaleY through app.modifyItem, absolutely, and does not call them ignored', () => {
    const calls: unknown[] = [];
    const r = run(gen.generateCreateItem({ itemType: 'circle', position: { x: 100, y: 100 }, properties: { radius: 40, scaleX: 1, scaleY: 0.4 } } as never), calls);
    expect(calls).toEqual([['item_1', { scaleX: 1, scaleY: 0.4 }]]);
    expect(r.scale).toEqual({ applied: true, x: 1, y: 0.4 });
    expect(r.ignoredProperties).toBeUndefined();
  });

  it('scale sets both axes; scaleX / scaleY override it', () => {
    const calls: unknown[] = [];
    run(gen.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties: { radius: 10, scale: 2, scaleY: 0.5 } } as never), calls);
    expect(calls).toEqual([['item_1', { scaleX: 2, scaleY: 0.5 }]]);
  });

  it('no scale given: nothing extra is emitted', () => {
    expect(gen.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties: { radius: 10 } } as never)).not.toContain('__scale');
  });
});

describe('SHEARKEY / SIZEKEY-PAIR: keyframe warnings', () => {
  const runKf = (input: Record<string, unknown>, animatable: string[]) => {
    const item = { data: { keyframes: [] as unknown[] } };
    const app = {
      getItemById: () => item,
      addAnimation: (_id: string, keys: unknown[]) => { item.data.keyframes = keys; },
      listAnimatableProperties: () => ({ properties: animatable.map((name) => ({ name })) }),
    };
    const code = gen.generateKeyframeAnimate(input as never);
    return new Function('app', code.replace(/^(\s*\/\/.*\n)+/, '').replace(/\((async )?function\(\)/, (m) => `return ${m}`))(app) as Record<string, any>;
  };

  it('skew keys the studio does not list are named', () => {
    const r = runKf({ itemId: 'a', keyframes: [{ time: 0, properties: { skewX: 0 } }, { time: 1, properties: { skewX: 20 } }] }, ['x', 'rotation']);
    expect(r.ignoredProperties).toEqual(['skewX']);
    expect(r.warning).toContain('transform matrix');
  });

  it('x beside fontSize on one item is warned (SIZEKEY-PAIR); either alone is not', () => {
    const both = runKf({ itemId: 'a', keyframes: [{ time: 0, properties: { x: 0, fontSize: 20 } }, { time: 1, properties: { x: 100, fontSize: 40 } }] }, ['x', 'fontSize']);
    expect(both.sizekeyPairWarning).toContain('SIZEKEY-PAIR');
    const one = runKf({ itemId: 'a', keyframes: [{ time: 0, properties: { fontSize: 20 } }, { time: 1, properties: { fontSize: 40 } }] }, ['fontSize']);
    expect(one.sizekeyPairWarning).toBeUndefined();
  });
});

describe('BLOOMCLIP / LOOKRESTORE: said in the result', () => {
  it('a bloom filter says its halo stops at the image edge; other filters do not', () => {
    expect(gen.generateImageFilter(ImageFilterInputSchema.parse({ action: 'apply', itemId: 'img', filterName: 'bloom' }) as never)).toContain('BLOOMCLIP');
    expect(gen.generateImageFilter(ImageFilterInputSchema.parse({ action: 'apply', itemId: 'img', filterName: 'blur' }) as never)).not.toContain('BLOOMCLIP');
  });

  it('removing a look notes that geometry is not restored', () => {
    const code = gen.generateLook(LookInputSchema.parse({ action: 'remove' }) as never);
    expect(code).toContain('LOOKRESTORE');
  });
});

describe('HIDETARGET: morph_sequence passes hideTarget to morphs_to', () => {
  const run = (input: unknown) => {
    const rels: Array<Record<string, unknown>> = [];
    const items: Record<string, unknown> = { item_1: { bounds: { width: 10, height: 10, center: { x: 0, y: 0 } } }, ref: { bounds: { width: 10, height: 10, center: { x: 0, y: 0 } } } };
    const app = { getItemById: (id: string) => items[id] || null, addRelation: (_s: string, _t: string, _r: string, p: Record<string, unknown>) => { rels.push(p); return true; }, getCanvasSize: () => ({ width: 100, height: 100 }) };
    new Function('app', `return ${gen.generateMorphSequence(MorphSequenceInputSchema.parse(input) as never).replace(/^(\s*\/\/.*\n)+/, '')}`)(app);
    return rels.map((p) => p.hideTarget);
  };
  it('defaults to hidden; false per state or for the call keeps it visible', () => {
    expect(run({ itemId: 'item_1', states: [{ at: 0, to: 'ref' }] })).toEqual([true]);
    expect(run({ itemId: 'item_1', hideTarget: false, states: [{ at: 0, to: 'ref' }] })).toEqual([false]);
    expect(run({ itemId: 'item_1', hideTarget: false, states: [{ at: 0, to: 'ref', hideTarget: true }] })).toEqual([true]);
  });
});

describe('INKCOLOR: ink with keepColor and no color takes the item colour for its marks', () => {
  it('passes the item stroke colour as color', async () => {
    let got: Record<string, unknown> | null = null;
    const item = { strokeColor: { toCSS: () => '#2e86de' }, fillColor: null };
    const app = {
      itemRegistry: { get: () => ({ item }) },
      applyMedium: async (_id: string, _m: string, o: Record<string, unknown>) => { got = o; return { ok: true, id: 'leaf' }; },
    };
    const code = gen.generateDesignMedium(DesignMediumInputSchema.parse({ action: 'apply', itemId: 'leaf', medium: 'ink', options: { keepColor: true } }) as never);
    await new Function('app', code.replace(/^(\s*\/\/.*\n)+/, '').replace(/\((async )?function\(\)/, (m) => `return ${m}`))(app);
    expect(got).toEqual({ keepColor: true, color: '#2e86de' });
  });
  it('an explicit color, or no keepColor, is passed through untouched', () => {
    const code = gen.generateDesignMedium(DesignMediumInputSchema.parse({ action: 'apply', itemId: 'leaf', medium: 'ink', options: { keepColor: true, color: '#000' } }) as never);
    expect(code).not.toContain('__mopts');
  });
});
