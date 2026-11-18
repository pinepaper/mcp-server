/**
 * TXTWRAP40: a 44-character caption on a 390 px phone canvas stayed one line clipped off both edges, and
 * maxWidth / wordWrap / width did nothing (width silently). The studio wraps through app.wrapText; these keys
 * now reach it on create_item and modify_item, and width alone on text is reported with the spelling that works.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator, textWrapRequest, emitTextWrap } from '../../types/code-generator.js';
import { detectBatchPropertyTypos } from '../../ontology/hints.js';

const gen = new PinePaperCodeGenerator();
const SENT = 'Every caption here must fit a narrow phone.';
const create = (props: Record<string, unknown>, itemType = 'text') =>
  gen.generateCreateItem({ itemType, position: { x: 195, y: 400 }, properties: { content: SENT, fontSize: 28, ...props } } as never);
const ignoredOf = (code: string) => { const m = code.match(/ignoredProperties: (\[[^\]]*\])/); return m ? JSON.parse(m[1]) : []; };
const parses = (code: string) => { expect(() => new Function(code)).not.toThrow(); };

describe('TXTWRAP40 create_item text wrap keys', () => {
  it('maxWidth wraps through app.wrapText and is not sent to create()', () => {
    const code = create({ maxWidth: 330 });
    parses(code);
    expect(code).toContain('app.wrapText(__wi, 330)');
    expect(code).toContain('textWrap: __textWrap');
    expect(ignoredOf(code)).toEqual([]);
    expect(code).not.toMatch(/"maxWidth":\s*330/);
  });
  it('wrapWidth and wordWrap: true with width mean the same', () => {
    expect(create({ wrapWidth: 300 })).toContain('app.wrapText(__wi, 300)');
    const ww = create({ wordWrap: true, width: 310 });
    expect(ww).toContain('app.wrapText(__wi, 310)');
    expect(ignoredOf(ww)).toEqual([]);
    expect(ww).not.toMatch(/"width":\s*310/);
  });
  it('width alone on text is reported, with maxWidth named, instead of silently doing nothing', () => {
    const code = create({ width: 330 });
    parses(code);
    expect(ignoredOf(code)).toEqual(['width']);
    expect(code).toContain('pass maxWidth');
    expect(code).not.toContain('app.wrapText(');
    expect(code).toMatch(/"width":\s*330/); // still recorded on the item, as before
  });
  it('wordWrap: true without a width, or a bad maxWidth, is reported with the fix', () => {
    const a = create({ wordWrap: true });
    expect(ignoredOf(a)).toEqual(['wordWrap']);
    expect(a).toContain('needs a width');
    const b = create({ maxWidth: -5 });
    expect(ignoredOf(b)).toEqual(['maxWidth']);
    expect(b).toContain('positive number');
  });
  it('wordWrap: false is the default and is consumed quietly', () => {
    const code = create({ wordWrap: false });
    expect(ignoredOf(code)).toEqual([]);
    expect(code).not.toContain('app.wrapText(');
  });
  it('fit wins over maxWidth, and the reply says so', () => {
    const code = create({ maxWidth: 330, fit: { maxWidth: 300 } });
    parses(code);
    expect(code).toContain('app.fitText(');
    expect(code).not.toContain('app.wrapText(');
    expect(code).toContain('maxWidth was not applied separately');
  });
  it('on a shape, maxWidth / wordWrap are still reported ignored and width is still a shape width', () => {
    const code = gen.generateCreateItem({ itemType: 'rectangle', position: { x: 100, y: 100 }, properties: { width: 200, height: 50, maxWidth: 10, wordWrap: true } } as never);
    expect(ignoredOf(code).sort()).toEqual(['maxWidth', 'wordWrap']);
    expect(code).not.toContain('app.wrapText(');
  });
  it('the anchor picks the vertical edge held', () => {
    expect(create({ maxWidth: 330, anchor: 'top-left' })).toContain('const __hy = __b0.top');
    expect(create({ maxWidth: 330 })).toContain('const __hy = __b0.center.y');
  });
  it('the batch typo preflight does not call maxWidth / wordWrap on text a typo', () => {
    const v = detectBatchPropertyTypos([{ type: 'create', itemType: 'text', properties: { content: 'x', maxWidth: 300, wordWrap: true } }]);
    expect(v.filter((x) => ['maxWidth', 'wordWrap', 'wrapWidth'].includes(x.property))).toEqual([]);
  });
});

describe('TXTWRAP40 modify_item', () => {
  const modify = (props: Record<string, unknown>) => gen.generateModifyItem({ itemId: 'item_1', properties: props } as never);
  it('maxWidth wraps, null unwraps; neither goes to modifyItem nor is reported ignored', () => {
    const w = modify({ maxWidth: 280 });
    parses(w);
    expect(w).toContain('app.wrapText(__wi, 280)');
    expect(w).toContain('textWrap: __textWrap');
    expect(ignoredOf(w)).toEqual([]);
    const u = modify({ maxWidth: null });
    parses(u);
    expect(u).toContain('app.unwrapText(__wi)');
    expect(ignoredOf(u)).toEqual([]);
  });
  it('width on modify keeps its old meaning (it is a resize there), and wordWrap without maxWidth is reported', () => {
    const r = modify({ width: 300 });
    expect(r).not.toContain('app.wrapText(');
    const ww = modify({ wordWrap: true });
    expect(ignoredOf(ww)).toEqual(['wordWrap']);
    expect(ww).toContain('pass maxWidth');
  });
});

describe('TXTWRAP40 emitTextWrap at runtime', () => {
  // A stand-in text item whose bounds follow its content, as a PointText does: the first baseline stays put and
  // lines grow downward; width is the longest line at 12 px a character.
  const makeItem = (justification: string) => {
    const item: Record<string, any> = { content: SENT, justification, data: {}, _pos: { x: 195, y: 400 } };
    const bounds = () => {
      const lines = String(item.content).split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * 12, h = lines.length * 34;
      const left = justification === 'center' ? item._pos.x - w / 2 : justification === 'right' ? item._pos.x - w : item._pos.x;
      const top = item._pos.y - 17;
      return { x: left, y: top, left, top, width: w, height: h, right: left + w, bottom: top + h, center: { x: left + w / 2, y: top + h / 2 } };
    };
    Object.defineProperty(item, 'bounds', { get: bounds });
    Object.defineProperty(item, 'position', {
      get: () => ({ add: ([dx, dy]: number[]) => ({ x: item._pos.x + dx, y: item._pos.y + dy }) }),
      set: (p: { x: number; y: number }) => { item._pos = { x: p.x, y: p.y }; },
    });
    return item;
  };
  const app = {
    wrapText(item: any, maxWidth: number) {
      const words = String(item.content).split(' '); const lines: string[] = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (t.length * 12 > maxWidth && cur) { lines.push(cur); cur = w; } else cur = t; }
      lines.push(cur); item.data._wrapSource = item.content; item.content = lines.join('\n');
      return { ok: true, lines: lines.length, overflow: false };
    },
  };
  const run = (item: any, vHold?: 'top' | 'bottom') =>
    new Function('app', 'item', `${emitTextWrap('item', 330, vHold)}\nreturn __textWrap;`)(app, item);

  it('a centred caption wraps to two lines and keeps its centre where it was placed', () => {
    const item = makeItem('center');
    const c0 = item.bounds.center;
    const r = run(item);
    expect(r.applied).toBe(true);
    expect(r.lines).toBe(2);
    expect(item.bounds.width).toBeLessThanOrEqual(330);
    expect(item.bounds.center.x).toBeCloseTo(c0.x, 6);
    expect(item.bounds.center.y).toBeCloseTo(c0.y, 6);
    expect(r.bounds.width).toBe(item.bounds.width);
  });
  it('a top anchor keeps the top edge; a left-justified text keeps its left edge', () => {
    const item = makeItem('left');
    const b0 = item.bounds;
    run(item, 'top');
    expect(item.bounds.top).toBeCloseTo(b0.top, 6);
    expect(item.bounds.left).toBeCloseTo(b0.left, 6);
  });
  it('a studio without wrapText says so instead of claiming a wrap', () => {
    const r = new Function('app', 'item', `${emitTextWrap('item', 330, undefined)}\nreturn __textWrap;`)({}, makeItem('center'));
    expect(r.applied).toBe(false);
    expect(r.note).toContain('no app.wrapText');
  });
});

describe('textWrapRequest', () => {
  it('returns null when no wrap key is present', () => {
    expect(textWrapRequest({ content: 'x', fontSize: 20 })).toBeNull();
    expect(textWrapRequest({ width: 300 }, { modify: true })).toBeNull();
  });
});
