/**
 * fontWeight / fontStyle / leading / lineHeight reach the PointText (round 6 U,
 * 1.39), and the text stays anchored where the engine put it.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** A PointText stand-in: bold is wider, and bounds follow position. */
function pointText(justification: 'left' | 'center' | 'right') {
  const t: Record<string, any> = {
    className: 'PointText', justification, fontSize: 40, fontWeight: 'normal', leading: 48,
    data: { registryId: 'item_1' }, bringToFront() {},
    _pos: { x: 100, y: 100 },
  };
  const P = (x: number, y: number) => ({ x, y, add: ([dx, dy]: number[]) => P(x + dx, y + dy) });
  Object.defineProperty(t, 'position', { get: () => P(t._pos.x, t._pos.y), set: (p) => { t._pos = { x: p.x, y: p.y }; } });
  Object.defineProperty(t, 'bounds', { get: () => {
    const w = /700|bold/.test(String(t.fontWeight)) ? 240 : 200;
    return { left: t._pos.x - w / 2, right: t._pos.x + w / 2, center: { x: t._pos.x, y: t._pos.y } };
  } });
  return t;
}

function create(t: object, properties: Record<string, unknown>) {
  const app = { create: () => t, historyManager: { saveState() {} } };
  const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 100, y: 100 }, properties });
  return new Function('app', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app);
}

describe('text style properties are applied, not dropped', () => {
  it('weight, italic and leading land on the PointText and are not reported ignored', () => {
    const t = pointText('center');
    const r = create(t, { content: 'Hi', fontWeight: 700, fontStyle: 'italic', leading: 60 });
    expect(t.fontWeight).toBe('italic 700');
    expect(t.leading).toBe(60);
    expect(r.ignoredProperties).toBeUndefined();
  });

  it('lineHeight <= 4 is a multiple of fontSize', () => {
    const t = pointText('center');
    create(t, { content: 'Hi', lineHeight: 1.2 });
    expect(t.leading).toBe(48);
  });

  it('left-justified text keeps its left edge when the weight widens it', () => {
    const t = pointText('left');
    const left0 = t.bounds.left;
    create(t, { content: 'Hi', fontWeight: 'bold' });
    expect(t.bounds.left).toBe(left0);
  });

  it('modify_item applies them too', () => {
    const t = pointText('right');
    const right0 = t.bounds.right;
    const app = { modifyItem: () => true, itemRegistry: { get: () => ({ item: t }) }, historyManager: { saveState() {} } };
    const r = new Function('app', 'window', `return ${codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { fontWeight: 700 } })}`)(app, {});
    expect(r.success).toBe(true);
    expect(t.fontWeight).toBe('700');
    expect(t.bounds.right).toBe(right0);
  });

  it('on a non-text item the same keys are still reported as ignored', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 0, y: 0 }, properties: { fontWeight: 700 } });
    expect(code).toContain('ignoredProperties: ["fontWeight"]');
  });
});

describe('text_style cursive returns an item id', () => {
  const run = (answer: unknown, registered = 'item_7') => {
    const code = codeGenerator.generateTextStyle({ action: 'cursive', text: 'hi' } as never);
    const app = { createCursiveText: () => answer, itemRegistry: { register: () => registered } };
    return new Function('app', `return ${code.replace(/^\/\/[^\n]*\n/, '')}`)(app);
  };
  it('reads the registered group', () => {
    expect(run({ items: [{}, {}], group: { data: { id: 'item_3' } }, totalWidth: 90 })).toMatchObject({ success: true, itemId: 'item_3', strokes: 2 });
  });
  it('registers an unregistered group', () => {
    expect(run({ items: [{}], group: { data: {} } }).itemId).toBe('item_7');
  });
  it('refuses when nothing was drawn', () => {
    expect(run({ items: [], group: null }).success).toBe(false);
  });
});
