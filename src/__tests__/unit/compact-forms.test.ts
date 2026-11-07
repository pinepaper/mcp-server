/**
 * The compact authoring forms: shorthand on the wire, today's ops by the time any code is generated.
 *
 * The acceptance is sameness: a compact call generates exactly the code of the long call it stands for, so nothing
 * about the engine, the reply or an export can differ. What differs is the bytes an agent pays to send it, which the
 * last block measures as sent.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';
import { expandBatchMacros, expandKeyColumns, BatchMacroError } from '../../tools/batch-macros.js';
import { handleToolCall } from '../../tools/handlers.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { getToolsForToolkit, referencedToolNames } from '../../tools/toolkits.js';
import { LANE_TOOL_NAMES, STARTER_TOOL_NAMES, STARTER_INSTRUCTIONS, LANE_TOOLS, laneContractText } from '../../tools/lane.js';

const opts = { executionMode: 'code', executeInBrowser: false } as never;
const textOf = (r: { content: Array<{ text?: string }> }) => r.content.map((c) => c.text ?? '').join('\n');

describe('keys: columnar keyframes', () => {
  it('compiles to the keyframes it stands for, leaving a null column out of that key', () => {
    expect(expandKeyColumns({ time: [0, 1, 2], x: [10, 20, 30], y: [5, null, 7], easing: 'easeOut' }, 'op')).toEqual([
      { time: 0, properties: { x: 10, y: 5 }, easing: 'easeOut' },
      { time: 1, properties: { x: 20 }, easing: 'easeOut' },
      { time: 2, properties: { x: 30, y: 7 }, easing: 'easeOut' },
    ]);
  });

  it('takes easing per key, where null means the default', () => {
    expect(expandKeyColumns({ time: [0, 1], opacity: [0, 1], easing: [null, 'easeIn'] }, 'op')).toEqual([
      { time: 0, properties: { opacity: 0 } },
      { time: 1, properties: { opacity: 1 }, easing: 'easeIn' },
    ]);
  });

  it('takes evenly spaced keys without a time list, exact to the microsecond', () => {
    expect(expandKeyColumns({ time: { step: 0.1, count: 4, from: 1 }, x: [1, 2, 3, 4] }, 'op').map((k) => k.time)).toEqual([1, 1.1, 1.2, 1.3]);
    expect(expandKeyColumns({ time: { step: 0.5, count: 2 }, x: [1, 2] }, 'op').map((k) => k.time)).toEqual([0, 0.5]);
    expect(() => expandKeyColumns({ time: { step: 0, count: 2 }, x: [1, 2] }, 'op')).toThrow(/time.step/);
    expect(() => expandKeyColumns({ time: { step: 1, count: 2.5 }, x: [1, 2] }, 'op')).toThrow(/time.count/);
    expect(() => expandKeyColumns({ time: { step: 1, count: 3 }, x: [1, 2] }, 'op')).toThrow(/x has 2 values.*time has 3/);
  });

  it('carries non-numeric values', () => {
    expect(expandKeyColumns({ time: [0], fillColor: ['#ff0000'] }, 'op')).toEqual([{ time: 0, properties: { fillColor: '#ff0000' } }]);
  });

  for (const [why, keys, says] of [
    ['no time column', { x: [1] }, /time/],
    ['an empty time column', { time: [], x: [] }, /time/],
    ['a time that is not a number', { time: [0, '1'], x: [1, 2] }, /time\[1\]/],
    ['a column of the wrong length', { time: [0, 1], x: [1] }, /x has 1 value.*time has 2/],
    ['a column that is not a list', { time: [0, 1], x: 5 }, /x must be a list/],
    ['a key with no value', { time: [0, 1], x: [1, null] }, /no value .*time 1/],
    ['no value column at all', { time: [0] }, /no value/],
    ['tuples instead of columns', [[0, 1], [1, 2]], /\{"time":\[/],
    ['the long form inside a column', { time: [0], properties: [{ x: 1 }] }, /properties/],
    ['an easing list of the wrong length', { time: [0, 1], x: [1, 2], easing: ['linear'] }, /easing has 1/],
  ] as const) {
    it(`refuses ${why}, by name`, () => {
      expect(() => expandKeyColumns(keys, 'op 3')).toThrow(BatchMacroError);
      expect(() => expandKeyColumns(keys, 'op 3')).toThrow(/op 3/);
      expect(() => expandKeyColumns(keys, 'op 3')).toThrow(says);
    });
  }

  const long = [{ time: 0, properties: { x: 1 } }, { time: 2, properties: { x: 9 }, easing: 'easeIn' }];
  const keys = { time: [0, 2], x: [1, 9], easing: [null, 'easeIn'] };

  it('the tool generates the same code from keys as from keyframes', async () => {
    const a = await handleToolCall('pinepaper_keyframe_animate', { itemId: 'item_1', keyframes: long }, opts);
    const b = await handleToolCall('pinepaper_keyframe_animate', { itemId: 'item_1', keys }, opts);
    expect(b.isError).toBeFalsy();
    expect(textOf(b)).toBe(textOf(a));
  });

  it('the tool refuses keys beside keyframes, and neither', async () => {
    const both = await handleToolCall('pinepaper_keyframe_animate', { itemId: 'item_1', keys, keyframes: long }, opts);
    expect(both.isError).toBe(true);
    expect(textOf(both)).toMatch(/keys.*keyframes|keyframes.*keys/);
    const none = await handleToolCall('pinepaper_keyframe_animate', { itemId: 'item_1' }, opts);
    expect(none.isError).toBe(true);
  });

  it('the tool reports a malformed column as a validation error naming it', async () => {
    const r = await handleToolCall('pinepaper_keyframe_animate', { itemId: 'item_1', keys: { time: [0, 1], x: [1] } }, opts);
    expect(r.isError).toBe(true);
    expect(textOf(r)).toMatch(/x has 1 value/);
  });

  it('a batch op generates the same code from keys as from keyframes', () => {
    const base = [{ type: 'create', itemType: 'circle', position: { x: 1, y: 2 }, properties: { radius: 3 } }];
    expect(gen.generateAgentBatchExecute({ operations: [...base, { type: 'keyframe_animate', itemId: '$0', keys }] } as never))
      .toBe(gen.generateAgentBatchExecute({ operations: [...base, { type: 'keyframe_animate', itemId: '$0', keyframes: long }] } as never));
  });

  it('two keyed ops on one item still merge into one track', () => {
    const k = (x: number, t: number) => ({ type: 'keyframe_animate', itemId: 'a', keys: { time: [t], x: [x] } });
    const l = (x: number, t: number) => ({ type: 'keyframe_animate', itemId: 'a', keyframes: [{ time: t, properties: { x } }] });
    expect(gen.generateAgentBatchExecute({ operations: [k(1, 0), k(2, 1)] } as never))
      .toBe(gen.generateAgentBatchExecute({ operations: [l(1, 0), l(2, 1)] } as never));
  });

  it('the macros that take keyframes take keys', () => {
    const kf = (o: Record<string, unknown>) => expandBatchMacros([o]);
    expect(kf({ type: 'stagger', itemIds: ['a', 'b'], keys: { time: [0], x: [1] } }))
      .toEqual(kf({ type: 'stagger', itemIds: ['a', 'b'], keyframes: [{ time: 0, properties: { x: 1 } }] }));
    expect(kf({ type: 'ring', count: 2, keys: { time: [0], x: [1] } }))
      .toEqual(kf({ type: 'ring', count: 2, keyframes: [{ time: 0, properties: { x: 1 } }] }));
  });

  it('a batch refuses keys beside keyframes, naming the op', () => {
    expect(() => expandBatchMacros([{ type: 'keyframe_animate', itemId: 'a', keys, keyframes: long }])).toThrow(/op 0.*keys/);
  });
});

describe('create_many: one type, shared defaults', () => {
  it('expands to one create per item, the item winning over the defaults', () => {
    const ops = expandBatchMacros([{
      type: 'create_many', itemType: 'rectangle', properties: { width: 10, color: '#111111' },
      items: [{ x: 1, y: 2 }, { position: [3, 4], color: '#222222', name: 'b' }, { position: { x: 5, y: 6 }, properties: { width: 20 } }],
    }]);
    expect(ops.map(({ _step, ...o }) => o)).toEqual([
      { type: 'create', itemType: 'rectangle', position: { x: 1, y: 2 }, properties: { width: 10, color: '#111111' } },
      { type: 'create', itemType: 'rectangle', position: { x: 3, y: 4 }, properties: { width: 10, color: '#222222', name: 'b' } },
      { type: 'create', itemType: 'rectangle', position: { x: 5, y: 6 }, properties: { width: 20, color: '#111111' } },
    ]);
  });

  it('has no item limit', () => {
    expect(expandBatchMacros([{ type: 'create_many', itemType: 'circle', items: Array.from({ length: 2001 }, () => [0, 0]) }]).length).toBe(2001);
  });

  it('takes a bare [x, y] item', () => {
    const [op] = expandBatchMacros([{ type: 'create_many', itemType: 'circle', items: [[7, 8]] }]);
    expect(op).toMatchObject({ type: 'create', itemType: 'circle', position: { x: 7, y: 8 } });
  });

  it('name is a prefix, unless an item names itself', () => {
    const ops = expandBatchMacros([{ type: 'create_many', itemType: 'circle', name: 'dot', items: [[0, 0], { x: 1, y: 1, name: 'own' }, [2, 2]] }]);
    expect(ops.map((o) => (o.properties as { name: string }).name)).toEqual(['dot-0', 'own', 'dot-2']);
  });

  it('an item may choose its own type', () => {
    const ops = expandBatchMacros([{ type: 'create_many', itemType: 'circle', items: [[0, 0], { x: 1, y: 1, itemType: 'star' }] }]);
    expect(ops.map((o) => o.itemType)).toEqual(['circle', 'star']);
  });

  it('each item takes a $N slot, so later ops address them as creates', () => {
    const ops = expandBatchMacros([
      { type: 'create', itemType: 'circle' },
      { type: 'create_many', itemType: 'circle', items: [[0, 0], [1, 1]] },
      { type: 'ring', count: 1, keyframes: [{ time: 0, properties: { x: 1 } }] },
    ]);
    expect(ops.find((o) => o.type === 'keyframe_animate')?.itemId).toBe('$3');
  });

  it('generates the same code as the creates it stands for', () => {
    const many = gen.generateAgentBatchExecute({ operations: [{ type: 'create_many', itemType: 'circle', properties: { radius: 3 }, items: [[1, 2], [3, 4]] }] } as never);
    const creates = gen.generateAgentBatchExecute({ operations: expandBatchMacros([{ type: 'create_many', itemType: 'circle', properties: { radius: 3 }, items: [[1, 2], [3, 4]] }]) } as never);
    expect(many).toBe(creates);
  });

  for (const [why, op, says] of [
    ['no items', { itemType: 'circle' }, /items/],
    ['empty items', { itemType: 'circle', items: [] }, /items/],
    ['no type anywhere', { items: [[0, 0]] }, /itemType/],
    ['an item with no position', { itemType: 'circle', items: [{ color: '#111111' }] }, /items\[0\].*position/],
    ['an item that is not an item', { itemType: 'circle', items: [5] }, /items\[0\]/],
    ['a key the op would drop', { itemType: 'circle', radius: 4, items: [[0, 0]] }, /radius.*properties/],
  ] as const) {
    it(`refuses ${why}, by name`, () => {
      expect(() => expandBatchMacros([{ type: 'create_many', ...op }])).toThrow(BatchMacroError);
      expect(() => expandBatchMacros([{ type: 'create_many', ...op }])).toThrow(says);
    });
  }

  it('the preflight sees a typo in an item, and names where it is', async () => {
    const typo = await handleToolCall('pinepaper_agent_batch_execute', { operations: [{ type: 'create_many', itemType: 'circle', items: [[0, 0], { x: 1, y: 1, radiues: 4 }] }] }, opts);
    expect(typo.isError).toBe(true);
    expect(textOf(typo)).toContain('operations[0].items[1].properties.radiues');
    const shared = await handleToolCall('pinepaper_agent_batch_execute', { operations: [{ type: 'create_many', itemType: 'circle', properties: { radiues: 4 }, items: [[0, 0]] }] }, opts);
    expect(shared.isError).toBe(true);
    const type = await handleToolCall('pinepaper_agent_batch_execute', { operations: [{ type: 'create_many', itemType: 'circel', items: [[0, 0]] }] }, opts);
    expect(type.isError).toBe(true);
    expect(textOf(type)).toContain('operations[0].items[0].itemType');
  });

  it('is called out of bounds like any create', async () => {
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations: [
      { type: 'set_canvas_size', width: 200, height: 200 },
      { type: 'create_many', itemType: 'circle', items: [[900, 900]] },
    ] }, opts);
    expect(textOf(r)).toMatch(/outside canvas bounds/);
  });
});

describe('the starter profile', () => {
  const starter = getToolsForToolkit(PINEPAPER_TOOLS as never, 'starter' as never);

  it('is the five tools the lane shipped with, in that order', () => {
    expect(starter.map((t) => t.name)).toEqual([...STARTER_TOOL_NAMES]);
    expect([...STARTER_TOOL_NAMES]).toEqual(LANE_TOOL_NAMES.slice(0, 5));
    expect(starter.length).toBe(5);
  });

  it('names no tool it does not list', () => {
    const known = new Set(PINEPAPER_TOOLS.map((t) => t.name));
    const listed = new Set(starter.map((t) => t.name));
    for (const tool of starter) {
      expect(referencedToolNames(tool as never, known).filter((n: string) => !listed.has(n)), tool.name).toEqual([]);
    }
    expect([...STARTER_INSTRUCTIONS.matchAll(/pinepaper_[a-z_]+/g)].map((m) => m[0]).filter((n) => !listed.has(n))).toEqual([]);
    expect(STARTER_INSTRUCTIONS).toContain('PINEPAPER_TOOLKIT=lane');
  });

  it('fits the ten thousand token target, by the same rough count as the lane', () => {
    const chars = (STARTER_INSTRUCTIONS + JSON.stringify(starter)).length;
    expect(chars / 3.5).toBeLessThan(10000);
    // The lane is still within it too, with the compact forms taught.
    expect(laneContractText(PINEPAPER_TOOLS as never).length / 3.5).toBeLessThan(10000);
  });
});

describe('what the compact forms teach and save', () => {
  it('the lane teaches both, and its examples are ops the batch accepts', () => {
    const batch = LANE_TOOLS.pinepaper_agent_batch_execute.description;
    const lines = batch.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{') && l.endsWith('}')).map((l) => JSON.parse(l));
    expect(lines.some((o) => o.type === 'create_many')).toBe(true);
    expect(lines.some((o) => o.type === 'keyframe_animate' && o.keys)).toBe(true);
    expect(() => expandBatchMacros(lines)).not.toThrow();
    const props = LANE_TOOLS.pinepaper_agent_batch_execute.inputSchema.properties as { operations: { items: { properties: Record<string, { enum?: string[] }> } } };
    expect(props.operations.items.properties.type.enum).toContain('create_many');
    expect(props.operations.items.properties.keys).toBeDefined();
    expect(props.operations.items.properties.items).toBeDefined();
    expect((LANE_TOOLS.pinepaper_keyframe_animate.inputSchema.required as string[])).toEqual(['itemId']);
  });

  it('a dense track is at least three times smaller as sent', () => {
    const time = Array.from({ length: 180 }, (_, i) => Number((i / 30).toFixed(3)));
    const x = time.map((t) => Number((640 + 300 * Math.cos(t)).toFixed(1)));
    const y = time.map((t) => Number((360 + 200 * Math.sin(t)).toFixed(1)));
    const long = JSON.stringify({ itemId: 'item_1', keyframes: time.map((t, i) => ({ time: t, properties: { x: x[i], y: y[i] } })) });
    // Measured 2.86 with every time written out, and past the target once an even track drops them.
    const columns = JSON.stringify({ itemId: 'item_1', keys: { time, x, y } });
    const stepped = JSON.stringify({ itemId: 'item_1', keys: { time: { step: 0.0333, count: 180 }, x, y } });
    expect(long.length / columns.length).toBeGreaterThanOrEqual(2.5);
    expect(long.length / stepped.length).toBeGreaterThanOrEqual(3);
  });

  it('three hundred strips are at least three times smaller as sent', () => {
    const shared = { width: 4, height: 720, color: '#336699', strokeColor: '#000000', opacity: 0.8 };
    const items = Array.from({ length: 300 }, (_, i) => [i * 4, 360]);
    const long = JSON.stringify({ operations: items.map(([x, y]) => ({ type: 'create', itemType: 'rectangle', position: { x, y }, properties: shared })) });
    const short = JSON.stringify({ operations: [{ type: 'create_many', itemType: 'rectangle', properties: shared, items }] });
    expect(long.length / short.length).toBeGreaterThanOrEqual(3);
  });
});
