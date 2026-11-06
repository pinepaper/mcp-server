/**
 * pinepaper_event's rules, variables and bound text, and the private keys the other relation tools drop.
 *
 * The behaviour of the actions offered was checked in a browser against a studio built from FxTool; these pin what the
 * server emits and refuses.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { EventInputSchema } from '../../types/schemas.js';
import { dropPrivateRelationParams } from '../../tools/batch-op-names.js';

const run = (input: unknown, app: Record<string, unknown>): any => {
  const code = codeGenerator.generateEvent(EventInputSchema.parse(input));
  const body = code.split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n');
  return new Function('app', `return ${body}`)(app);
};

function studio() {
  const rules = new Map<string, any>();
  const vars = new Map<string, unknown>();
  const items: Record<string, any> = { t: { content: 'old' }, c: {} };
  return {
    rules, vars, items,
    addContraption: (c: any) => { const id = c.id ?? 'generated'; rules.set(id, c); return id; },
    removeContraption: (id: string) => rules.delete(id),
    listContraptions: () => [...rules.values()],
    setVariable: (k: string, v: unknown, s: string) => { vars.set(`${s}/${k}`, v); },
    getVariable: (k: string, f: unknown, s: string) => (vars.has(`${s}/${k}`) ? vars.get(`${s}/${k}`) : f),
    incrementVariable: (k: string, by: number, s: string) => { const n = Number(vars.get(`${s}/${k}`) ?? 0) + by; vars.set(`${s}/${k}`, n); return n; },
    bindTextToState: (id: string, tpl: string) => { items[id].content = tpl; },
    getItemById: (id: string) => items[id],
  };
}
const rule = (over: object = {}) => ({ action: 'add_contraption', sourceEvent: 'tap', actions: [{ type: 'incrementVariable', key: 'n' }], ...over });

describe('rules', () => {
  it('passes the rule to the studio and returns its id', () => {
    const app = studio();
    const out = run(rule({ contraptionId: 'r', condition: { key: 'n', op: '>=', value: 3 }, thenTrigger: { eventId: 'next', delay: 1 } }), app);
    expect(out).toMatchObject({ success: true, contraptionId: 'r' });
    expect(app.rules.get('r')).toEqual({ id: 'r', sourceEvent: 'tap', actions: [{ type: 'incrementVariable', key: 'n' }], condition: { key: 'n', op: '>=', value: 3 }, thenTrigger: { eventId: 'next', delay: 1 } });
  });

  it('says when a rule targets an item that does not exist', () => {
    const out = run(rule({ actions: [{ type: 'modifyItem', targetId: 'gone', properties: { visible: false } }, { type: 'modifyItem', targetId: 'c', properties: { opacity: 0 } }] }), studio());
    expect(out.warning).toContain('gone');
    expect(out.warning).not.toContain('c,');
    expect(out.note).toBeUndefined();
  });

  // A custom action needs a function, which JSON cannot carry.
  it('refuses the custom action', () => {
    expect(EventInputSchema.safeParse(rule({ actions: [{ type: 'custom', targetId: 'c' }] })).success).toBe(false);
  });

  it('accepts the actions the engine answers honestly for, and warns about any target that is missing', () => {
    const actions = [
      { type: 'toggleItemVisible', targetId: 'gone1' },
      { type: 'animateItem', targetId: 'gone2', animation: 'pulse', speed: 2 },
      { type: 'playSound', preset: 'pop', gain: 0.5 },
      { type: 'playTimeline', duration: 3, loop: true },
    ];
    const parsed = EventInputSchema.parse(rule({ actions }));
    expect(parsed.actions).toEqual(actions as never);
    const out = run(rule({ actions }), studio());
    expect(out.warning).toContain('gone1');
    expect(out.warning).toContain('gone2');
  });

  it('requires a target on the actions that act on an item', () => {
    for (const type of ['toggleItemVisible', 'animateItem']) {
      expect(EventInputSchema.safeParse(rule({ actions: [{ type }] })).success).toBe(false);
    }
  });

  it('clears rules and variables through the engine, and refuses on a studio without the methods', () => {
    let cleared = 0;
    const app = { ...studio(), clearContraptions: () => { cleared++; }, clearVariables: (scope: string) => (scope === 'game' ? 3 : 0) };
    expect(run({ action: 'clear_contraptions' }, app).success).toBe(true);
    expect(cleared).toBe(1);
    expect(run({ action: 'clear_variables', scope: 'game' }, app).removed).toBe(3);
    expect(run({ action: 'clear_contraptions' }, {}).error).toContain('clearContraptions');
    expect(run({ action: 'clear_variables' }, {}).error).toContain('clearVariables');
  });

  it('refuses a modifyItem property the studio would only file away in item.data', () => {
    expect(EventInputSchema.safeParse(rule({ actions: [{ type: 'modifyItem', targetId: 'c', properties: { x: 1 } }] })).success).toBe(false);
  });

  it('needs a source event and actions', () => {
    expect(EventInputSchema.safeParse({ action: 'add_contraption', actions: [{ type: 'toggleVariable', key: 'k' }] }).success).toBe(false);
    expect(EventInputSchema.safeParse({ action: 'add_contraption', sourceEvent: 'tap' }).success).toBe(false);
  });

  it('removing a rule that does not exist is a failure', () => {
    expect(run({ action: 'remove_contraption', contraptionId: 'nope' }, studio())).toMatchObject({ success: false, error: expect.stringContaining('nope') });
  });

  it('lists rules', () => {
    const app = studio();
    run(rule({ contraptionId: 'r' }), app);
    expect(run({ action: 'list_contraptions' }, app).contraptions.map((c: any) => c.id)).toEqual(['r']);
  });
});

describe('variables and bound text', () => {
  it('set, read back, increment, each in its scope', () => {
    const app = studio();
    expect(run({ action: 'set_variable', key: 'n', value: 0, scope: 'g' }, app).value).toBe(0);
    expect(run({ action: 'increment_variable', key: 'n', by: 2, scope: 'g' }, app).value).toBe(2);
    expect(run({ action: 'get_variable', key: 'n', scope: 'g' }, app).value).toBe(2);
    expect(run({ action: 'get_variable', key: 'n', fallback: 9 }, app).value).toBe(9);
  });

  it('set_variable takes a falsy value, and refuses none', () => {
    expect(EventInputSchema.safeParse({ action: 'set_variable', key: 'k', value: false }).success).toBe(true);
    expect(EventInputSchema.safeParse({ action: 'set_variable', key: 'k' }).success).toBe(false);
  });

  it('bind_text refuses a missing item and an item with no text', () => {
    expect(run({ action: 'bind_text', itemId: 'nope', template: '{a}' }, studio())).toMatchObject({ success: false });
    expect(run({ action: 'bind_text', itemId: 'c', template: '{a}' }, studio()).error).toContain('not a text item');
    expect(run({ action: 'bind_text', itemId: 't', template: 'S: {a}' }, studio())).toMatchObject({ success: true, text: 'S: {a}' });
  });
});

describe('a studio without the contraption engine', () => {
  const inputs = [rule(), { action: 'remove_contraption', contraptionId: 'r' }, { action: 'list_contraptions' }, { action: 'set_variable', key: 'k', value: 1 },
    { action: 'get_variable', key: 'k' }, { action: 'increment_variable', key: 'k' }, { action: 'bind_text', itemId: 't', template: 'x' }];
  for (const input of inputs) {
    it(`${input.action} is refused by name, not a TypeError`, () => {
      const out = run(input, {});
      expect(out.success).toBe(false);
      expect(out.error).toContain('contraption engine');
    });
  }
});

describe('clear_canvas', () => {
  const clear = (app: Record<string, unknown>) => {
    const body = codeGenerator.generateClearCanvas().split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n');
    const lines = body.trimEnd();
    const cut = lines.lastIndexOf('\n({ success');
    return new Function('app', 'window', `${lines.slice(0, cut)}\nreturn ${lines.slice(cut + 1)}`)(app, {});
  };
  it('removes the rules, which the studio keeps', () => {
    const app = studio();
    app.rules.set('a', { id: 'a' });
    app.rules.set('b', { id: 'b' });
    const out = clear({ ...app, clearCanvas: () => {} });
    expect(app.rules.size).toBe(0);
    expect(out.contraptionsRemoved).toBe(2);
  });
  it('says nothing on a studio with none', () => {
    expect(clear({ clearCanvas: () => {} }).contraptionsRemoved).toBeUndefined();
  });
});

describe('private keys in the other tools that take relation parameters', () => {
  it('pinepaper_add_relation', () => {
    const input = { sourceId: 'a', params: { radius: 3, _itemRegistry: {} } };
    const r = dropPrivateRelationParams('pinepaper_add_relation', input);
    expect(r.args.params).toEqual({ radius: 3 });
    expect(r.dropped).toEqual(['params._itemRegistry']);
    expect(input.params).toHaveProperty('_itemRegistry');
  });
  it('the relations of pinepaper_create_scene', () => {
    const r = dropPrivateRelationParams('pinepaper_create_scene', { relations: [{ source: 'a', params: { r: 1 } }, { source: 'b', params: { _startTime: 1, r: 2 } }] });
    expect(r.args.relations).toEqual([{ source: 'a', params: { r: 1 } }, { source: 'b', params: { r: 2 } }]);
    expect(r.dropped).toEqual(['relations[1].params._startTime']);
  });
  it('leaves other tools and clean params alone', () => {
    const input = { params: { _x: 1 } };
    expect(dropPrivateRelationParams('pinepaper_pattern', input)).toEqual({ args: input, dropped: [] });
    const clean = { params: { r: 1 } };
    expect(dropPrivateRelationParams('pinepaper_add_relation', clean)).toEqual({ args: clean, dropped: [] });
  });
});
