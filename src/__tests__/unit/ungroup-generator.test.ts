import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const run = (group: unknown, app: Record<string, unknown>) =>
  new Function('app', 'return ' + codeGenerator.generateGroup({ action: 'ungroup', groupId: 'item_1' } as never).replace(/^\/\/.*\n/, '').replace(/;\s*$/, ''))({ getItemById: () => group, historyManager: { saveState() {} }, ...app }) as any;

describe('ungroup releases a foreground generator composition through the studio', () => {
  it('a composition (generatorParts) goes to releaseParts, and the released ids come back', () => {
    const released: unknown[] = [];
    const r = run({ data: { generatorParts: true } }, {
      groupManager: { ungroupAll: () => { throw new Error('not for a composition'); } },
      generatorRegistry: { releaseParts: (g: unknown) => { released.push(g); return { ok: true, items: [{ data: { registryId: 'item_7' } }, { data: { registryId: 'item_8' } }] }; } },
    });
    expect(released.length).toBe(1);
    expect(r).toMatchObject({ success: true, generator: true, itemIds: ['item_7', 'item_8'], count: 2 });
  });
  it('a user group still goes to the group manager', () => {
    let used = '';
    run({ data: { isUserGroup: true } }, { groupManager: { ungroupAll: () => { used = 'groupManager'; } }, generatorRegistry: { releaseParts: () => { used = 'gen'; return { ok: true, items: [] }; } } });
    expect(used).toBe('groupManager');
  });
  it('a refused release fails with the studio reason', () => {
    const r = run({ data: { generatorParts: true } }, { groupManager: {}, generatorRegistry: { releaseParts: () => ({ ok: false, reason: 'Not a generator group.' }) } });
    expect(r).toMatchObject({ success: false, error: 'Not a generator group.' });
  });
});
