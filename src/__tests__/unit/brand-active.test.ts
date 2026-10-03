/**
 * The active brand (D69): set once, inherited by every item made afterwards
 * wherever the call names nothing. Lives in the page, never in the server.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { BrandKitInputSchema } from '../../types/schemas.js';

const KIT = { name: 'castr', colors: { primary: '#1d4ed8', text: '#fdf6e3' }, fonts: { heading: 'Anton', body: 'Inter' } };
function run(code: string, win: Record<string, unknown>) {
  const mods: Array<[string, Record<string, unknown>]> = [];
  const item = { data: { registryId: 'item_1' }, bringToFront() {} };
  const app = { create: () => item, modifyItem: (id: string, p: Record<string, unknown>) => { mods.push([id, p]); return true; }, historyManager: { saveState() {} } };
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  const fn = new Function('app', 'window', 'paper', `${body.split('\n').slice(0, -1).join('\n')}\nreturn ${body.split('\n').at(-1)}`);
  return { out: fn(app, win, {}), mods };
}

describe('active brand', () => {
  it('a shape with no colour takes primary; text takes the text colour and the heading font', () => {
    const win = { __ppActiveBrand: KIT };
    const shape = run(codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: {} } as never), win);
    expect(shape.mods).toEqual([['item_1', { color: '#1d4ed8' }]]);
    const title = run(codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'NOW CASTING', fontSize: 72 } } as never), win);
    expect(title.mods).toEqual([['item_1', { color: '#fdf6e3', fontFamily: 'Anton' }]]);
  });
  it('names the caller gave win, noBrand opts out, and no active brand changes nothing', () => {
    const win = { __ppActiveBrand: KIT };
    expect(run(codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: { color: '#ff0000' } } as never), win).mods).toEqual([]);
    expect(run(codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: { noBrand: true } } as never), win).mods).toEqual([]);
    expect(run(codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: {} } as never), {}).mods).toEqual([]);
  });
  it('small text takes the body font', () => {
    const r = run(codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'fine print', fontSize: 14 } } as never), { __ppActiveBrand: KIT });
    expect(r.mods[0][1].fontFamily).toBe('Inter');
  });
  it('set requires a kit; get and clear do not', () => {
    expect(() => BrandKitInputSchema.parse({ action: 'set' })).toThrow();
    expect(BrandKitInputSchema.parse({ action: 'get' }).action).toBe('get');
  });
});
