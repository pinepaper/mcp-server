import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const run = async (input: Record<string, unknown>, ret: unknown = { ok: true, id: 'item_9', rigId: 'skeleton_1', parts: { head: 'item_10' }, base: 'bird' }) => {
  const calls: unknown[] = [];
  const app = { createCharacter: async (spec: unknown) => { calls.push(spec); return ret; }, historyManager: { saveState() {} } };
  const r = await new Function('app', 'return ' + codeGenerator.generateCreateCharacter(input as never).replace(/^\/\/.*\n/, '').replace(/;\s*$/, ''))(app);
  return { r, calls };
};

describe('create_character with no drawable concept makes a RIGGED character, never a placeholder circle', () => {
  it('a bird concept becomes base bird, and the reply says it was mapped', async () => {
    const { r, calls } = await run({ concept: 'pigeon', x: 100, y: 400 });
    expect(calls).toEqual([{ base: 'bird', x: 100, y: 400 }]);
    expect(r.success).toBe(true);
    expect(r.rigId).toBe('skeleton_1');
    expect(r.baseFrom).toEqual({ from: 'pigeon', to: 'bird' });
  });
  it('nothing named: a person', async () => {
    expect((await run({})).calls).toEqual([{ base: 'person' }]);
  });
  it('a concept no rigged base fits is refused with the five, and nothing is created', async () => {
    const { r, calls } = await run({ concept: 'dog' });
    expect(calls).toEqual([]);
    expect(r.success).toBe(false);
    expect(r.error).toContain('person, robot, cat, bird and blob');
  });
  it('an explicit base goes to the studio as written', async () => {
    expect((await run({ base: 'stickman' })).calls).toEqual([{ base: 'stickman' }]);
  });
  it('drawn but not rigged says it cannot move', async () => {
    const { r } = await run({ concept: 'robot' }, { ok: true, id: 'item_2', rigId: null, parts: {} });
    expect(r.warning).toContain('cannot walk');
  });
});
