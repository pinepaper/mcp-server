/**
 * WRAPROT170 / FONTFAMROT170: a text created with rotation and maxWidth wrapped against the wrong width. The
 * studio's wrapText (and fitText) measure a line by the item's bounds, which on a rotated item is the upright
 * box round the slanted line: at 45 degrees a 280 px limit let a 316 px line through, and at 90 nothing wrapped.
 * The wrap and the fit are now done with the text upright and the angle put back afterwards.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator, emitTextWrap, emitTextFit } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator();
const SENT = 'PACK MY BOX WITH FIVE DOZEN LIQUOR JUGS';
const CH = 14, LH = 31; // px a character, px a line

// A stand-in PointText: an upright block of lines turned about its centre; bounds is the upright box round it.
const makeItem = (rotation: number) => {
  const item: Record<string, any> = { content: SENT, justification: 'center', data: {}, rotation, _c: { x: 195, y: 400 } };
  const size = () => { const ls = String(item.content).split('\n'); return { w: Math.max(...ls.map((l) => l.length)) * CH, h: ls.length * LH }; };
  Object.defineProperty(item, 'bounds', { get: () => {
    const { w, h } = size(); const a = item.rotation * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    const W = w * c + h * s, H = w * s + h * c, left = item._c.x - W / 2, top = item._c.y - H / 2;
    return { x: left, y: top, left, top, width: W, height: H, right: left + W, bottom: top + H, center: { x: item._c.x, y: item._c.y } };
  } });
  Object.defineProperty(item, 'position', {
    get: () => ({ add: ([dx, dy]: number[]) => ({ x: item._c.x + dx, y: item._c.y + dy }) }),
    set: (p: { x: number; y: number }) => { item._c = { x: p.x, y: p.y }; },
  });
  item.rotate = (deg: number, about?: { x: number; y: number }) => {
    const p = about || item._c, a = deg * Math.PI / 180, dx = item._c.x - p.x, dy = item._c.y - p.y;
    item._c = { x: p.x + dx * Math.cos(a) - dy * Math.sin(a), y: p.y + dx * Math.sin(a) + dy * Math.cos(a) };
    item.rotation += deg;
  };
  item.upright = size;
  return item;
};
// The studio's measure: set the candidate line, read bounds.width.
const wrapLines = (item: any, maxWidth: number) => {
  const words = String(item.data._wrapSource ?? item.content).split(' '); const lines: string[] = []; let cur = '';
  const measure = (s: string) => { item.content = s; return item.bounds.width; };
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (measure(t) > maxWidth && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur); return lines;
};
const app = {
  wrapText(item: any, maxWidth: number) {
    const src = item.content; const lines = wrapLines(item, maxWidth);
    item.data._wrapSource = src; item.content = lines.join('\n');
    return { ok: true, lines: lines.length, overflow: false };
  },
  fitText(item: any, box: { maxWidth: number }) { const r = app.wrapText(item, box.maxWidth); return { ok: true, lines: r.lines, fits: true }; },
};
const wrap = (item: any) => new Function('app', 'item', `${emitTextWrap('item', 280, undefined)}\nreturn __textWrap;`)(app, item);

describe('WRAPROT170 wrap of a rotated text', () => {
  const upright = makeItem(0); wrap(upright);
  for (const deg of [30, 45, -45, 60, 90, 180]) {
    it(`rotation ${deg}: same lines as upright, within maxWidth, same centre, angle kept`, () => {
      const item = makeItem(deg);
      const r = wrap(item);
      expect(r.applied).toBe(true);
      expect(item.content).toBe(upright.content);
      expect(r.lines).toBe(3);
      expect(item.upright().w).toBeLessThanOrEqual(280);
      expect(item.rotation).toBeCloseTo(deg, 9);
      expect(item.bounds.center.x).toBeCloseTo(195, 6);
      expect(item.bounds.center.y).toBeCloseTo(400, 6);
      expect(r.bounds.width).toBeCloseTo(Math.round(item.bounds.width * 10) / 10, 6); // the drawn (turned) box, as before
    });
  }
  it('the angle is put back when the studio refuses the wrap', () => {
    const item = makeItem(45);
    const r = new Function('app', 'item', `${emitTextWrap('item', 280, undefined)}\nreturn __textWrap;`)({ wrapText: () => ({ ok: false, error: 'no' }) }, item);
    expect(r.applied).toBe(false);
    expect(item.rotation).toBeCloseTo(45, 9);
  });
});

describe('WRAPROT170 create_item and modify_item', () => {
  it('fit on a rotated text fits the upright block, and modify_item reaches it', () => {
    const item = makeItem(45);
    const r = new Function('app', 'item', `let __textFit = null;${emitTextFit('item', { maxWidth: 280 })}\nreturn __textFit;`)(app, item);
    expect(r.applied).toBe(true);
    expect(item.content.split('\n').length).toBe(3);
    expect(item.upright().w).toBeLessThanOrEqual(280);
    expect(item.rotation).toBeCloseTo(45, 9);
    const code = gen.generateModifyItem({ itemId: 'item_1', properties: { fit: { maxWidth: 280 } } } as never);
    expect(code).toContain('__fi.rotate(-__ur, __fi.bounds.center)');
  });
  it('create with rotation and maxWidth emits the upright wrap', () => {
    const code = gen.generateCreateItem({ itemType: 'text', position: { x: 195, y: 400 }, properties: { content: SENT, fontSize: 26, maxWidth: 280, rotation: 45 } } as never);
    expect(() => new Function(code)).not.toThrow();
    expect(code).toContain('app.wrapText(__wi, 280)');
    expect(code).toMatch(/"rotation":\s*45/);
  });
});

// modify_item {content} on a wrapped text: the studio's modify writes the new words and the wrap source but does
// not wrap again, so the text came back as one line with its wrap width still recorded (measured live 2026-11-24).
describe('modify_item content keeps a maxWidth wrap', () => {
  const NEW = 'THE QUICK BROWN FOX JUMPS OVER A LAZY DOG TODAY';
  const setup = (deg: number, extra: Record<string, unknown> = {}) => {
    const item = makeItem(deg);
    wrap(item); item.data.wrapWidth = 280; Object.assign(item.data, extra);
    const studio = { ...app, historyManager: { saveState() {}, saveStateDebounced() {} }, getItemById: () => item, itemRegistry: { get: () => ({ item }) },
      modifyItem: (_id: string, ch: any) => { if (ch.content !== undefined) { item.content = ch.content; if (item.data._wrapSource !== undefined) item.data._wrapSource = ch.content; } return true; } };
    return { item, studio };
  };
  const modify = (props: Record<string, unknown>) => gen.generateModifyItem({ itemId: 'item_1', properties: props } as never);
  const exec = (code: string, studio: unknown) => new Function('app', `return ${code.trim().startsWith('(') ? code : `(function(){${code}})()`}`)(studio);
  for (const deg of [0, 45]) {
    it(`rotation ${deg}: new words are wrapped to the recorded width, centre held`, () => {
      const { item, studio } = setup(deg);
      const r = exec(modify({ content: NEW }), studio);
      expect(r.success).toBe(true);
      expect(item.content.split('\n').length).toBeGreaterThan(1);
      expect(item.upright().w).toBeLessThanOrEqual(280);
      expect(item.content.replace(/\n/g, ' ')).toBe(NEW);
      expect(item.rotation).toBeCloseTo(deg, 9);
      expect(item.bounds.center.x).toBeCloseTo(195, 6);
      expect(item.bounds.center.y).toBeCloseTo(400, 6);
      expect(r.textWrap.applied).toBe(true);
      expect(r.textWrap.maxWidth).toBe(280);
    });
  }
  it('a text that was never wrapped, or has a fit box, is left to the studio', () => {
    const a = setup(0); a.item.content = SENT; delete a.item.data._wrapSource; delete a.item.data.wrapWidth;
    const ra = exec(modify({ content: NEW }), a.studio);
    expect(a.item.content).toBe(NEW);
    expect(ra.textWrap).toBeUndefined();
    const b = setup(0, { fitBox: { maxWidth: 280 } });
    exec(modify({ content: NEW }), b.studio);
    expect(b.item.content).toBe(NEW);
  });
  it('a modify without content emits no re-wrap', () => {
    expect(modify({ opacity: 0.5 })).not.toContain('__rw');
  });
});
