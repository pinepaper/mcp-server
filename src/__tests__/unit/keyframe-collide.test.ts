import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

describe('SQUASH35: an appended key that lands on an existing key and changes its easing is named', () => {
  const run = (prevEasing: string, newEasing: string | undefined) => {
    const item: any = { data: { keyframes: [{ time: 0, easing: 'linear', properties: { x: 0 } }, { time: 1, easing: prevEasing, properties: { x: 10 } }] } };
    const entry = { item, id: 'item_1' };
    const app: any = {
      getItemById: () => item, itemRegistry: { get: () => entry, getAll: () => [entry] }, historyManager: { saveState() {} },
      addAnimation: (_id: unknown, keys: any[]) => {
        // the studio's merge: a new key at an existing time replaces it
        const byTime = new Map(item.data.keyframes.map((k: any) => [k.time, k]));
        keys.forEach((k) => byTime.set(k.time, { ...k, easing: k.easing || 'linear' }));
        item.data.keyframes = [...byTime.values()].sort((a: any, b: any) => a.time - b.time);
      },
    };
    const code = codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', append: true, keyframes: [{ time: 1, properties: { x: 20 }, ...(newEasing ? { easing: newEasing } : {}) }, { time: 2, properties: { x: 30 } }] } as never);
    return new Function('app', 'return ' + code.replace(/^\/\/.*\n/, '').replace(/;\s*$/, ''))(app);
  };
  it('names the collision and both easings', () => {
    const r = run('easeOutBack', undefined);
    expect(r.warning).toContain('t=1 easeOutBack -> linear');
  });
  it('says nothing when the easing is the same', () => {
    const r = run('easeOutBack', 'easeOutBack');
    expect(String(r.warning ?? '')).not.toContain('replaced its easing');
  });
});
