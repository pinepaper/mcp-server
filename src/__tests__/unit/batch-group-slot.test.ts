/**
 * O2 (mcp-server#29): in agent_batch_execute a `group` op made an item and took no "$N" slot, so the benchmark's
 * batch [create, create, group, keyframe_animate "$2"] failed with "$2 is the item number 2 THIS batch created, and
 * it has created 2 so far" — while the batch had made three items.
 *
 * The rule now: every op that MAKES an item takes the next $N slot, in op order: create (and the ring / grid / orbit
 * macros, which expand to creates) and group. Every place that numbers a batch's items holds the same rule: the
 * emitted batch, the macro expander, and the timeline compiler's name table.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { expandBatchMacros } from '../../tools/batch-macros.js';
import { batchCreatesBefore } from '../../tools/timeline.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { COMPACT_DESCRIPTIONS } from '../../tools/compact-descriptions.js';
import { LANE_TOOLS } from '../../tools/lane.js';

const REPRO = {
  operations: [
    { type: 'create', itemType: 'circle', position: [200, 200], properties: { radius: 10 } },
    { type: 'create', itemType: 'circle', position: [240, 200], properties: { radius: 10 } },
    { type: 'group', itemIds: ['$0', '$1'], groupName: 'g' },
    { type: 'keyframe_animate', itemId: '$2', keyframes: [{ time: 0, properties: { rotation: 0 } }, { time: 2, properties: { rotation: 90 } }] },
  ],
};

function stubStudio() {
  let next = 1;
  const items = new Map<string, Record<string, unknown>>();
  const animated: string[] = [];
  const P = (x: number, y: number) => ({ x, y, add: ([dx, dy]: number[]) => P(x + dx, y + dy) });
  const mint = () => { const id = `item_${next++}`; const it: Record<string, unknown> = { data: { registryId: id }, bringToFront() {}, position: P(0, 0) }; items.set(id, it); return it; };
  const app = {
    create: () => mint(),
    getItemById: (id: string) => items.get(id) ?? null,
    addAnimation: (id: string) => { animated.push(id); },
    groupManager: {
      createGroup: (name: string) => { const g = mint(); (g.data as Record<string, unknown>).groupName = name; return g; },
      addItemsToGroup() {},
    },
    historyManager: { saveState() {} },
  };
  return { app, animated };
}

async function run(input: unknown, app: unknown) {
  const code = codeGenerator.generateAgentBatchExecute(input as never);
  return new Function('app', 'paper', 'window', 'document', code.replace('(async function()', 'return (async function()'))(app, {}, {}, {});
}

describe('a group op takes the next $N slot (O2)', () => {
  it('the benchmark batch runs: $2 is the group, and the group is keyed', async () => {
    const s = stubStudio();
    const r = await run(REPRO, s.app);
    expect(r.success, JSON.stringify(r).slice(0, 400)).toBe(true);
    expect(r.itemIds).toEqual(['item_1', 'item_2', 'item_3']);
    expect(s.animated).toEqual(['item_3']);
  });

  it('a $N past what the batch made says which ops are numbered', async () => {
    const s = stubStudio();
    const r = await run({ operations: [REPRO.operations[0], { ...REPRO.operations[3], itemId: '$1' }] }, s.app);
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/create and group ops are numbered/);
    expect(r.error).toMatch(/it has made 1 so far/);
  });

  it('the macro expander numbers a group too: an orbit made after a group is $3', () => {
    const out = expandBatchMacros([
      ...REPRO.operations.slice(0, 3),
      { type: 'orbit', itemType: 'circle', targetId: '$2', radius: 50 },
    ] as never) as Array<Record<string, unknown>>;
    expect(out.find((o) => o.type === 'relation')!.sourceId).toBe('$3');
  });

  it('the timeline compiler numbers a group too, and knows it by its groupName', () => {
    const creates = batchCreatesBefore(REPRO.operations as never, 3);
    expect(creates.length).toBe(3);
    expect(creates[2].name).toBe('g');
  });

  it('every description of $N says a group is numbered', () => {
    const full = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_agent_batch_execute')!.description;
    for (const text of [full, COMPACT_DESCRIPTIONS.pinepaper_agent_batch_execute, LANE_TOOLS.pinepaper_agent_batch_execute.description]) {
      expect(text).toMatch(/create and group ops/);
      expect(text).not.toMatch(/only create ops count/);
    }
  });
});
