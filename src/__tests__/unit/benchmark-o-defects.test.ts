/**
 * Issue #29: the defects the clean-room benchmark hit on the local server (1.6.24). Each block failed before its fix.
 * O1, O2 and O10 have their own tests (clear-resets-item-ids, batch-group-slot, agent-lane). Engine-side items (O3,
 * O5) are not here: they were reported to the engine, with the probes that show them.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator, relationSpecProblem } from '../../types/code-generator.js';
import { detectBatchPropertyTypos } from '../../ontology/hints.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { LANE_TOOLS } from '../../tools/lane.js';

/** A snippet that ends in a (-led expression, run as a function returning it. */
function runSnippet(code: string, app: unknown, win: Record<string, unknown> = {}) {
  const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').trim();
  const lines = body.split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (l.startsWith('(')) at = i; });
  lines[at] = 'return ' + lines[at];
  return new Function('app', 'window', 'paper', lines.join('\n'))(app, win, {});
}

describe('O4: an event that shows or hides', () => {
  it('value without visible is refused on every visibility reaction, by name', () => {
    for (const t of ['on_event_set_visibility', 'on_enter_set_visibility', 'on_exit_set_visibility']) {
      const why = relationSpecProblem(t, { value: false });
      expect(why, t).toContain('visible');
    }
    expect(relationSpecProblem('on_event_add_relation', { type: 'on_event_set_visibility', params: { value: false } })).toContain('params.params.visible');
  });

  it('visible alone, or no params (show), is fine', () => {
    expect(relationSpecProblem('on_event_set_visibility', { visible: false })).toBeNull();
    expect(relationSpecProblem('on_event_set_visibility', {})).toBeNull();
    expect(relationSpecProblem('on_event_set_property', { property: 'opacity', value: 0 })).toBeNull();
  });

  it('the relation docs no longer offer value for visibility', () => {
    const rel = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_add_relation')!.description!;
    expect(rel).toMatch(/on_event_set_visibility[^\n]*params \{ visible \}/);
    expect(rel).not.toMatch(/params in common: property, value/);
  });
});

describe('O6: a still of a moving scene', () => {
  it('without time, a still of a playing scene is the first frame, said in the result', () => {
    const code = codeGenerator.generateAgentExport({ format: 'png' } as never);
    expect(code).toContain('__stillT');
    expect(code).toMatch(/exportPNG\(\{ scale: pngScale, \.\.\.\(__stillT !== null \? \{ time: __stillT \} : \{\}\) \}\)/);
    expect(code).toContain('stillTimeNote');
  });

  it('with time, that moment, passed to the engine still too', () => {
    const code = codeGenerator.generateAgentExport({ format: 'png', time: 2 } as never);
    expect(code).toContain('let __stillT = 2;');
    expect(code).not.toContain('requestAnimationFrame');
  });
});

describe('O7: a stroke-only shape', () => {
  function create(itemType: string, properties: Record<string, unknown>, win: Record<string, unknown> = {}) {
    const item: Record<string, unknown> = { data: { registryId: 'item_1' }, bringToFront() {}, fillColor: '#4a9eff' };
    const mods: Array<Record<string, unknown>> = [];
    const app = { create: () => item, modifyItem: (_: string, p: Record<string, unknown>) => { mods.push(p); Object.assign(item, p.color ? { fillColor: p.color } : {}); return true; }, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} } };
    const out = runSnippet(codeGenerator.generateCreateItem({ itemType, position: { x: 1, y: 1 }, properties } as never), app, win);
    return { item, out, mods };
  }

  it('a circle with a strokeColor and no fill is an outline', () => {
    const { item, out } = create('circle', { radius: 20, strokeColor: '#f00', strokeWidth: 3 });
    expect(item.fillColor).toBeNull();
    expect(String(out.fill)).toContain('outline');
  });

  it('an active brand does not fill it either', () => {
    const { item, mods } = create('rectangle', { width: 20, height: 20, strokeColor: '#f00' }, { __ppActiveBrand: { colors: { primary: '#123456' } } });
    expect(item.fillColor).toBeNull();
    expect(mods).toEqual([]);
  });

  it('a named fill, a color, or text keeps its fill', () => {
    expect(create('circle', { radius: 20, strokeColor: '#f00', fillColor: '#0f0' }).item.fillColor).not.toBeNull();
    expect(create('circle', { radius: 20, strokeColor: '#f00', color: '#0f0' }).item.fillColor).not.toBeNull();
    expect(create('text', { content: 'hi', strokeColor: '#f00' }).item.fillColor).not.toBeNull();
  });
});

describe('O8: three small ones', () => {
  it('ttl and bornAt on a line are not typos', () => {
    const ops = [{ type: 'create', itemType: 'line', properties: { from: [0, 0], to: [10, 0], ttl: 2, bornAt: 1 } }];
    expect(detectBatchPropertyTypos(ops)).toEqual([]);
    // A real typo is still caught.
    expect(detectBatchPropertyTypos([{ type: 'create', itemType: 'line', properties: { strokeWidht: 2 } }]).length).toBe(1);
  });

  it('a line with from given reports where it is, and says position did not move it', () => {
    const item = { data: { registryId: 'item_1' }, bringToFront() {}, position: { x: 100, y: 0 } };
    const app = { create: () => item, historyManager: { saveState() {} } };
    const out = runSnippet(codeGenerator.generateCreateItem({ itemType: 'line', position: { x: 400, y: 300 }, properties: { from: [0, 0], to: [200, 0] } } as never), app);
    expect(out.position).toEqual({ x: 100, y: 0 });
    expect(String(out.warning)).toContain('canvas coordinates');
  });

  it('a nudge goes through modifyItem, so the move is authored (and seen)', () => {
    const calls: Array<[string, Record<string, unknown>]> = [];
    const item = { position: { x: 100, y: 100 } };
    const app = {
      itemRegistry: { get: () => ({ item }) },
      modifyItem: (id: string, p: Record<string, number>) => { calls.push([id, p]); item.position = { x: p.x, y: p.y }; return true; },
    };
    const code = codeGenerator.generateTransform({ action: 'nudge', itemId: "a'b", dx: 50, dy: -10 } as never);
    const out = new Function('app', `return ${code.split('\n').filter((l) => !l.startsWith('//')).join('\n')}`)(app);
    expect(calls).toEqual([["a'b", { x: 150, y: 90 }]]);
    expect(out.position).toEqual({ x: 150, y: 90 });
  });
});

describe('O9: an id of your own', () => {
  it('create_item and the batch say properties.id is the item id', () => {
    const create = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_item')!.description!;
    expect(create).toMatch(/properties\.id/);
    expect(LANE_TOOLS.pinepaper_agent_batch_execute.description).toMatch(/properties\.id/);
  });
});
