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

describe('the fingerprint is authored state, not the live frame (first live sweep)', async () => {
  const { effectAfterJs } = await import('../../tools/effect-check.js');
  const color = (hex: string) => ({ toCSS: () => hex });
  function studio() {
    const ball = { position: { x: 100, y: 100 }, scaling: { x: 1, y: 1 }, rotation: 0, fillColor: color('#ff0000'), opacity: 1,
      data: { id: 'item_1', keyframes: [{ time: 0, properties: { x: 100 } }, { time: 1, properties: { x: 500 } }], _renderTick: 1 } };
    const box = { position: { x: 10, y: 10 }, scaling: { x: 1, y: 1 }, rotation: 0, fillColor: color('#00ff00'), opacity: 1, data: { id: 'item_2' } };
    const app: Record<string, any> = {
      isPlayingKeyframes: true,
      view: { zoom: 1, center: { x: 960, y: 540 } },
      config: { currentBackgroundMode: 'color' },
      getCanvasSize: () => ({ width: 1920, height: 1080 }),
      itemRegistry: { getAll: () => [{ id: 'item_1', type: 'circle', item: ball }, { id: 'item_2', type: 'rectangle', item: box }] },
    };
    return { app, ball, box };
  }
  const probe = (code: string, app: unknown, win: Record<string, unknown>) => new Function('app', 'window', `return ${code}`)(app, win);
  const tick = (s: ReturnType<typeof studio>) => { s.ball.position.x += 37; s.ball.data._renderTick++; s.app.view.center.x += 5; };

  it('a no-op while the timeline plays reads unchanged', () => {
    const s = studio(); const win: Record<string, unknown> = {};
    probe(EFFECT_BEFORE_JS, s.app, win);
    tick(s);                                   // playback moves the animated ball and the camera
    s.box.fillColor = color('#00ff00');        // modify to the colour it already had
    const v = probe(effectAfterJs([]), s.app, win);
    expect(v.changed).toEqual([]);
  });

  it('a real change still reads changed during playback', () => {
    const s = studio(); const win: Record<string, unknown> = {};
    probe(EFFECT_BEFORE_JS, s.app, win);
    tick(s);
    s.box.fillColor = color('#0000ff');
    expect(probe(effectAfterJs([]), s.app, win).changed).toEqual(['items']);
  });

  it('scene filters and the camera track count as changes (sweep v2)', () => {
    const s = studio(); const win: Record<string, unknown> = {};
    const filters: unknown[] = []; const cam: unknown[] = [];
    s.app.filterSystem = { exportForSave: () => filters.slice() };
    s.app.getRelations = (id: string) => (id === 'camera' ? cam.slice() : []);
    probe(EFFECT_BEFORE_JS, s.app, win);
    filters.push({ type: 'grayscale', params: { intensity: 1 } });
    cam.push({ type: 'camera_animates', params: { keyframes: [{ time: 0, zoom: 1 }, { time: 2, zoom: 2 }] } });
    expect(probe(effectAfterJs([]), s.app, win).changed.sort()).toEqual(['camera', 'filters']);
  });
});
