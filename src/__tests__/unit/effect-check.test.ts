/**
 * No silent success, the runtime half: a mutating call is fingerprinted before
 * and after; a success that changed nothing is flagged in the text the model
 * reads, and a result naming an item that is not on the canvas fails.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { EFFECT_BEFORE_JS, namedItemIds, idMayBeGone } from '../../tools/effect-check.js';

function controller(main: unknown, after: Record<string, unknown>) {
  const calls: string[] = [];
  return {
    calls,
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string) => {
      if (code === EFFECT_BEFORE_JS) { calls.push('before'); return { success: true, result: { ok: true } }; }
      if (code.includes('__ppEffectBefore = null')) { calls.push('after'); return { success: true, result: { ok: true, checked: ['scene', 'items'], ...after } }; }
      calls.push('main');
      return { success: true, result: main };
    },
  };
}
const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });
const text = (r: any) => (r.content ?? []).map((c: any) => c.text ?? '').join('\n');

describe('effect check', () => {
  it('a mutating success that changed nothing is flagged in the text', async () => {
    const c = controller({ success: true, highlighted: [] }, { changed: [], missing: [] });
    const r = await handleToolCall('pinepaper_map_regions', { action: 'highlight', regionIds: ['USA'] }, opts(c));
    expect(c.calls).toEqual(['before', 'main', 'after']);
    expect(r.isError).toBeFalsy();
    expect(text(r)).toContain('NO CHANGE');
    expect((r._meta as any)['pinepaper.studio/effect']).toMatchObject({ class: 'mutates', changed: false });
  });

  it('a call that changed something is not flagged', async () => {
    const c = controller({ success: true }, { changed: ['mapColours'], missing: [] });
    const r = await handleToolCall('pinepaper_map_regions', { action: 'highlight', regionIds: ['USA'] }, opts(c));
    expect(text(r)).not.toContain('NO CHANGE');
    expect((r._meta as any)['pinepaper.studio/effect']).toMatchObject({ changed: true, signals: ['mapColours'] });
  });

  it('a result naming an item that is not on the canvas fails', async () => {
    const c = controller({ success: true, itemId: 'item_42' }, { changed: ['scene'], missing: ['item_42'] });
    const r = await handleToolCall('pinepaper_create_item', { itemType: 'circle', position: { x: 1, y: 1 } }, opts(c));
    expect(r.isError).toBe(true);
    expect(text(r)).toContain('item_42');
  });

  it('read-only and side-effect calls are not probed', async () => {
    const c = controller({ success: true, played: true }, { changed: [], missing: [] });
    await handleToolCall('pinepaper_sound', { action: 'play_sfx', name: 'pop' }, opts(c));
    expect(c.calls).toEqual(['main']);
  });

  it('helpers', () => {
    expect(namedItemIds({ itemId: 'item_1', itemIds: ['item_2', 'x'], ids: ['item_1'] })).toEqual(['item_1', 'item_2']);
    expect(idMayBeGone('pinepaper_delete_item', undefined)).toBe(true);
    expect(idMayBeGone('pinepaper_map_regions', 'highlight')).toBe(false);
  });
});
