/**
 * mcp-server#36: a relation registered with register_custom_relation is a valid relationType in a batch, as it already
 * was in add_relation; a relation op with no targetId binds the item alone (the engine takes a null target).
 */
import { describe, it, expect } from 'bun:test';
import { validateBatchVocabulary } from '../../ontology/hints.js';
import { codeGenerator } from '../../types/code-generator.js';

describe('batch: custom relations', () => {
  const ops = [{ type: 'relation', sourceId: '$1', targetId: '$0', relationType: 'bobs' }];

  it('a name registered this session passes the preflight', () => {
    expect(validateBatchVocabulary(ops, { relationType: new Set(['bobs']) })).toEqual([]);
  });

  it('an unregistered name, or a typo of a registered one, is still refused', () => {
    expect(validateBatchVocabulary(ops).length).toBe(1);
    expect(validateBatchVocabulary([{ ...ops[0], relationType: 'bobz' }], { relationType: new Set(['bobs']) }).length).toBe(1);
  });

  it('no targetId binds the item alone: a null target, no target lookup', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', sourceId: 'item_1', relationType: 'bobs' }] } as never);
    expect(code).toContain('const targetId = null;');
    expect(code).not.toContain("Target not found: ' + targetId");
  });

  it('with a targetId, the target is still looked up and checked', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: ops } as never);
    expect(code).toContain("Target not found: ' + targetId");
  });
});

describe('mcp-server#37: name patterns, update, read-back', () => {
  const gen = (op: Record<string, unknown>) => codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'relation', relationType: 'wave', ...op }] } as never);

  it('a name pattern binds every item named like it, in name order, with index and count', () => {
    const code = gen({ sourceId: 'dot-*' });
    expect(code).toContain('new RegExp("^dot-.*$")');
    expect(code).toContain("localeCompare(b.name, undefined, { numeric: true })");
    expect(code).toContain('{ index: i, count: __members.length, pattern: "dot-*" }');
  });

  it('a pattern re-sent after adding members changes the bound ones instead of binding them twice', () => {
    expect(gen({ sourceId: 'dot-*' })).toContain('app.relationRegistry.getAssociations(m.id, "wave")');
  });

  it('update changes the params of the relation already bound, and says when there is none', () => {
    const code = gen({ sourceId: 'item_1', update: true, relationOptions: { amp: 90 } });
    expect(code).toContain('app.modifyRelationParams(m.id, targetId, "wave", __p)');
    expect(code).not.toContain('app.addRelation(');
    expect(code).toContain('to change: bind it first');
  });

  it('a pattern with regex characters matches them literally', () => {
    expect(gen({ sourceId: 'a.b(1)-*' })).toContain('new RegExp("^a\\\\.b\\\\(1\\\\)-.*$")');
  });

  it('lint_scene reads back the relations and the custom definitions', () => {
    const code = codeGenerator.generateLintScene({} as never);
    expect(code).toContain('queryActive()');
    expect(code).toContain('customRelations: __custom');
    expect(codeGenerator.generateRegisterCustomRelation({ name: 'wave', computeFunction: 'return {};', applyFunction: '' } as never)).toContain('window.__ppCustomRelations["wave"] = ');
  });
});

describe('time_expression formulas outside the grammar are refused (#39)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { relationSpecProblem } = require('../../types/code-generator.js');
  const why = (e: string) => relationSpecProblem('time_expression', { property: 'y', expression: e });

  it('Math.sin is refused with what to write instead', () => {
    expect(why('360 + 100*Math.sin(Math.PI*t)')).toContain('Write sin(…) without Math');
  });
  it('an unknown name, a wrong case, random(), a wrong argument count', () => {
    expect(why('foo(t)')).toContain('names foo');
    expect(why('Sin(t)')).toContain('Did you mean sin?');
    expect(why('random()')).toContain('refuses');
    expect(why('min(1, 2, 3)')).toContain('takes 2');
  });
  it('the grammar itself passes: constants, ^, %, nested calls, exponents', () => {
    for (const e of ['360 + 100*sin(PI*t)', '2^t % 3', 'clamp(t, 0, 1)*remap(t, 0, 1, 0, 10)', 'pow(2, sin(t*2))', '1e3*t + v', 'noise(t) * TAU']) expect(why(e), e).toBeNull();
  });
});

describe('unknown relation options are said, not accepted silently', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { relationOptionWarning } = require('../../types/code-generator.js');
  it('a key the rule never reads is named, with a suggestion when it is close', () => {
    const w = relationOptionWarning('orbits', { radius: 100, sped: 0.5, phase_degrees: 90 });
    expect(w).toContain('does not read sped, phase_degrees');
    expect(w).toContain('sped → speed?');
    expect(w).toContain('phase_degrees → phaseDegrees?');
  });
  it('known keys, custom relations and injected pattern keys are quiet', () => {
    expect(relationOptionWarning('orbits', { radius: 1, speed: 1, direction: 1, phaseDegrees: 0 })).toBeNull();
    expect(relationOptionWarning('bobs', { anything: 1 })).toBeNull();
    expect(relationOptionWarning('orbits', { radius: 1, index: 0, count: 3 }, ['index', 'count'])).toBeNull();
  });
});

describe('#43: lint_scene says how to change what it lists', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { codeGenerator } = require('../../types/code-generator.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getToolsForToolkit } = require('../../tools/toolkits.js');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PINEPAPER_TOOLS } = require('../../tools/definitions.js');

  function lint(rels: Array<Record<string, unknown>>, custom: unknown[] = [], input: Record<string, unknown> = {}) {
    const code = codeGenerator.generateLintScene(input as never);
    const types: Record<string, string> = {};
    rels.forEach((r) => { types[String(r.from)] = 'circle'; });
    const app = {
      lintScene: () => ({ density: {}, suggestions: [] }),
      relationRegistry: { queryActive: () => rels.map((r) => ({ itemId: r.from, item: { data: { name: r.name } }, associations: [{ relation: r.type, target: r.to, params: r.params }] })) },
      itemRegistry: { get: (id: string) => ({ type: types[id] }) },
    };
    const win = { __ppCustomRelations: Object.fromEntries((custom as Array<{ name: string }>).map((d) => [d.name, d])) };
    const body = code.split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n');
    return new Function('app', 'window', `return ${body}`)(app, win);
  }

  it('a pattern group comes once, with the op that changes it and the ops that add and remove a member', () => {
    const rels = [1, 2, 3].map((i) => ({ from: `item_${i}`, name: `dot-${i}`, type: 'wave', to: null, params: { amp: 40, index: i - 1, count: 3, pattern: 'dot-*' } }));
    const out = lint(rels, [{ name: 'wave', computeFunction: 'return {};', applyFunction: '' }]);
    const g = out.edit.groups[0];
    expect(g).toMatchObject({ pattern: 'dot-*', members: 3, first: 'dot-1', last: 'dot-3', relationOptions: { amp: 40 } });
    expect(g.change).toEqual({ type: 'relation', sourceId: 'dot-*', relationType: 'wave', relationOptions: { amp: 40 }, update: true });
    expect(g.addMember[0]).toMatchObject({ type: 'create', itemType: 'circle', properties: { name: 'dot-4' } });
    expect(g.removeMember[0]).toEqual({ type: 'delete', itemId: 'dot-3' });
    expect(lint(rels, [{ name: 'wave', computeFunction: 'return {};', applyFunction: '' }], { withSource: true }).edit.customRelations[0].change.tool).toBe('pinepaper_register_custom_relation');
    expect(out.edit.hint).toContain('ONE pinepaper_agent_batch_execute');
  });

  it('a single relation comes with its update op', () => {
    const out = lint([{ from: 'item_1', name: 'moon', type: 'orbits', to: 'item_2', params: { radius: 50, speed: 1 } }]);
    expect(out.edit.relations[0].change).toEqual({ type: 'relation', sourceId: 'moon', targetId: 'item_2', relationType: 'orbits', update: true, relationOptions: { radius: 50, speed: 1 } });
  });

  describe('the read-back an edit agent needs, and no more (#43)', () => {
    const group = [1, 2, 3].map((i) => ({ from: `item_${i}`, name: `dot-${i}`, type: 'wave', to: null, params: { amp: 40, index: i - 1, count: 3, pattern: 'dot-*' } }));
    const defs = [{ name: 'wave', params: { amp: { type: 'number' } }, computeFunction: 'return { y: params.amp };', applyFunction: 'item.position.y = computed.y;' },
      { name: 'old_motion', computeFunction: 'return {};', applyFunction: '' }];

    it('a group is listed once (in edit.groups), not once per member in relations', () => {
      const out = lint([...group, { from: 'item_9', name: 'moon', type: 'orbits', to: 'item_2', params: { radius: 50 } }], defs);
      expect(out.relations.map((r: { from: string }) => r.from)).toEqual(['item_9']);
      expect(out.groupedRelations).toBe(3);
      expect(out.edit.groups).toHaveLength(1);
    });

    it('custom relation source only with withSource; unused registrations are named, not listed', () => {
      const out = lint(group, defs);
      expect(out.customRelations).toEqual([{ name: 'wave', params: { amp: { type: 'number' } } }]);
      expect(out.registeredUnused).toEqual(['old_motion']);
      // Without its source the register call would be refused, so it is not offered as an op to send.
      expect(out.edit.customRelations[0].change).toBeUndefined();
      expect(out.edit.customRelations[0].params).toEqual({ amp: { type: 'number' } });
      expect(out.edit.customHint).toContain('withSource: true');
      const full = lint(group, defs, { withSource: true });
      expect(full.customRelations[0].computeFunction).toBe('return { y: params.amp };');
    });

    describe('what the studio keeps in a live relation stays in the studio', () => {
      // The engine writes its registry into the stored params on the first frame (RelationRegistry: _itemRegistry), and
      // rules cache live items and timers there. A registry reaches the page, so it is cyclic and holds functions.
      const live = () => {
        const registry: Record<string, unknown> = { nextId: 15, get: () => null };
        registry.app = { registry, canvasEl: {}, _heavy: {} };
        return registry;
      };
      const bound = () => [1, 2].map((i) => ({ from: `item_${i}`, name: `dot-${i}`, type: 'orbits', to: 'hub',
        params: { radius: 80, index: i - 1, count: 2, pattern: 'dot-*', _itemRegistry: live(), _initialized: true, _startTime: 3, _keyOff: () => {}, onTick: () => {} } }));
      const single = () => [{ from: 'item_9', name: 'solo', type: 'bob', to: null, params: { amp: 5, _itemRegistry: live(), _affectedItems: [{}] } }];
      const underscoreKeys = (v: unknown, at = ''): string[] => (v && typeof v === 'object')
        ? Object.entries(v as object).flatMap(([k, c]) => [...(k.startsWith('_') ? [`${at}.${k}`] : []), ...underscoreKeys(c, `${at}.${k}`)]) : [];

      it('a group, its change op and its add-member op carry only the parameters given', () => {
        const g = lint(bound(), [], { only: 'edit' }).edit.groups[0];
        for (const opts of [g.relationOptions, g.change.relationOptions, g.addMember[1].relationOptions]) expect(opts).toEqual({ radius: 80 });
      });

      it('a single relation\'s change op sends back only its parameters', () => {
        expect(lint(single(), [], { only: 'edit' }).edit.relations[0].change.relationOptions).toEqual({ amp: 5 });
      });

      it('the full reply has none of it, in relations or edit', () => {
        const out = lint([...bound(), ...single()]);
        expect(underscoreKeys(out)).toEqual([]);
        expect(out.relations[0].params).toEqual({ amp: 5 });
      });

      // The predicate that matters: structuredClone is what the page bridge attempts. A reply it refuses goes through
      // the walker instead, which is how an internal in one relation truncated another relation's definition to "[deep]".
      it('the reply crosses the bridge whole, so a custom definition arrives as it was given', () => {
        const def = { name: 'bob', params: { amp: { type: 'number', default: 20, min: 0 } }, reads: ['amp'], computeFunction: 'return {};', applyFunction: '' };
        const out = lint(single().map((r) => ({ ...r, type: 'bob' })), [def], { only: 'edit', withSource: true });
        expect(() => structuredClone(out)).not.toThrow();
        expect(JSON.stringify(out)).not.toContain('[deep]');
        expect(out.edit.customRelations[0].change.args.params).toEqual(def.params);
      });

      it('the redefining call is one the tool accepts, as given', () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { RegisterCustomRelationInputSchema } = require('../../types/schemas.js');
        const def = { name: 'bob', params: { amp: { type: 'number', default: 20 } }, reads: ['amp'], computeFunction: 'return {};', applyFunction: '' };
        const { args, tool } = lint(single().map((r) => ({ ...r, type: 'bob' })), [def], { only: 'edit', withSource: true }).edit.customRelations[0].change;
        expect(tool).toBe('pinepaper_register_custom_relation');
        expect(RegisterCustomRelationInputSchema.safeParse(args).success).toBe(true);
        // reads is worked out by the server from the source: not an argument of the call, which would be reported as ignored.
        expect(Object.keys(RegisterCustomRelationInputSchema.shape)).toEqual(expect.arrayContaining(Object.keys(args)));
      });

      it('leaves the live relation as it found it', () => {
        const rels = single();
        lint(rels, [], { only: 'edit' });
        expect(Object.keys(rels[0].params).sort()).toEqual(['_affectedItems', '_itemRegistry', 'amp']);
      });

      it('query_relations reads back the same way, in both directions', () => {
        const params = { amp: 5, _itemRegistry: live(), onTick: () => {} };
        const run = (direction: string) => {
          const r = codeGenerator.generateQueryRelations({ itemId: 'a', direction });
          const app = { getRelations: () => [{ relation: 'bob', target: 'b', params }], queryByRelationTarget: () => [{ itemId: 'c', relation: 'bob', params }] };
          return new Function('app', `${r.split('\n').filter((l: string) => !l.trim().startsWith('//')).join('\n').replace(/\(\{ relations(: formatted)? \}\);\s*$/, (m: string) => `return ${m}`)}`)(app);
        };
        for (const d of ['outgoing', 'incoming']) expect(run(d).relations[0].params).toEqual({ amp: 5 });
      });
    });

    it("only: 'edit' returns the edit section alone", () => {
      const out = lint(group, defs, { only: 'edit' });
      expect(Object.keys(out).sort()).toEqual(['edit', 'registeredUnused', 'success']);
      expect(out.edit.groups[0].change.update).toBe(true);
    });
  });

  it('the edit profile is lint, batch, custom relations and export', () => {
    expect(getToolsForToolkit(PINEPAPER_TOOLS, 'edit').map((t: { name: string }) => t.name)).toEqual(['pinepaper_lint_scene', 'pinepaper_agent_batch_execute', 'pinepaper_register_custom_relation', 'pinepaper_agent_export']);
  });
});
