/**
 * A catalogue font is loaded before text is created with it (round 6 T/U, 1.33).
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function studio(opts: { loadable: boolean; availableAtStart?: boolean }) {
  const order: string[] = [];
  let available = !!opts.availableAtStart;
  const item = { className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} };
  const app = {
    checkFont: () => { order.push('check'); return { available, reason: available ? '' : 'not installed' }; },
    ensureFontsLoaded: async () => { order.push('ensure'); if (opts.loadable) available = true; return { ok: true }; },
    create: () => { order.push('create'); return item; },
    modifyItem: () => { order.push('modify'); return true; },
    itemRegistry: { get: () => ({ item }) },
    historyManager: { saveState() {} },
  };
  const document = { fonts: { load: async () => { order.push('fonts.load'); } } };
  return { app, document, order };
}

const run = (code: string, s: ReturnType<typeof studio>) =>
  new Function('app', 'document', 'window', `return ${code}`)(s.app, s.document, {});

const create = (fontFamily: string) =>
  codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'Hi', fontFamily } });

describe('fonts load before the text is measured', () => {
  it('loads a missing catalogue font, then creates, and says it did', async () => {
    const s = studio({ loadable: true });
    const r = await run(create("'Anton', sans-serif"), s);
    expect(s.order).toEqual(['check', 'ensure', 'fonts.load', 'check', 'create']);
    expect(r).toMatchObject({ itemId: 'item_1', font: { family: 'Anton', available: true, loadedNow: true } });
  });

  it('a font that cannot load is named in the result, not only in a console', async () => {
    const s = studio({ loadable: false });
    const r = await run(create('NoSuchFace'), s);
    expect(r.itemId).toBe('item_1');
    expect(r.font.available).toBe(false);
    expect(r.font.warning).toContain('NoSuchFace could not be loaded');
  });

  it('an available font adds nothing and loads nothing', async () => {
    const s = studio({ loadable: true, availableAtStart: true });
    const r = await run(create('Georgia'), s);
    expect(s.order).toEqual(['check', 'create']);
    expect(r.font).toBeUndefined();
  });

  it('modify_item loads before modifyItem re-measures', async () => {
    const s = studio({ loadable: true });
    const r = await run(codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fontFamily: 'Playfair Display' } }), s);
    expect(s.order.indexOf('ensure')).toBeLessThan(s.order.indexOf('modify'));
    expect(r).toMatchObject({ success: true, font: { family: 'Playfair Display', available: true } });
  });
});

describe('brand_kit apply loads the kit fonts first', () => {
  it('loads before applyBrandKit and reports it', async () => {
    const s = studio({ loadable: true });
    const order = s.order;
    (s.app as Record<string, unknown>).applyBrandKit = async () => { order.push('apply'); return { ok: true, changed: 3 }; };
    const code = codeGenerator.generateBrandKit({ action: 'apply', kit: { name: 'k', colors: { primary: '#000' }, fonts: { heading: 'Anton', body: 'Anton' } } } as never);
    const r = await new Function('app', 'document', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)(s.app, s.document);
    expect(order).toEqual(['check', 'ensure', 'fonts.load', 'check', 'apply']);
    expect(r).toMatchObject({ success: true, changed: 3, fonts: [{ family: 'Anton', available: true }] });
  });

  it('plan never loads anything', () => {
    const code = codeGenerator.generateBrandKit({ action: 'plan', kit: { name: 'k', colors: { primary: '#000' }, fonts: { heading: 'Anton' } } } as never);
    expect(code).not.toContain('ensureFontsLoaded');
  });
});

describe('fonts outside the studio sheets come from Google Fonts (1.59)', () => {
  it('injects the family stylesheet when the studio load does not make it available', async () => {
    const order: string[] = [];
    let available = false;
    const head = { appendChild: (l: { href: string; onload: () => void }) => { order.push('link:' + l.href); available = true; l.onload(); } };
    const document = { head, getElementById: () => null, createElement: () => ({}), fonts: { load: async () => { order.push('fonts.load'); } } };
    const app = {
      checkFont: () => ({ available, reason: 'not installed' }),
      ensureFontsLoaded: async () => { order.push('ensure'); return { ok: true }; },
      create: () => ({ className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} }),
      historyManager: { saveState() {} },
    };
    const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'NEON', fontFamily: 'Monoton' } });
    const r = await new Function('app', 'document', 'window', `return ${code}`)(app, document, {});
    expect(order.some((o) => o.startsWith('link:https://fonts.googleapis.com/css2?family=Monoton'))).toBe(true);
    expect(r.font).toMatchObject({ family: 'Monoton', available: true, via: 'google-fonts' });
  });
});

describe('font check / load (1.51, X#12)', () => {
  it('check explains "not loaded yet"; load exists and uses the shared loader', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const check = JSON.stringify(await handleToolCall('pinepaper_font', { action: 'check', name: 'Caveat' }, { executionMode: 'code' } as never));
    expect(check).toContain('not loaded yet');
    const load = JSON.stringify(await handleToolCall('pinepaper_font', { action: 'load', name: 'Monoton' }, { executionMode: 'code' } as never));
    expect(load).toContain('ensureFontsLoaded');
    expect(load).toContain('fonts.googleapis.com');
  });
});
