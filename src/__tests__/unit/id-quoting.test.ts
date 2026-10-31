/**
 * An id is caller text. Spliced raw into generated code, an id with a quote ended the string and the whole call was
 * a syntax error ("Bob's hat" through modify_item). The paths below quote it; create refuses an id that the paths
 * still splicing raw could not address.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const NASTY = "Bob's \"hat\" \\ </script>";
const parses = (code: string) => { new Function('app', 'window', 'paper', `return (async () => { ${code} })`); };

describe('a quoted id', () => {
  const calls: Array<[string, () => string]> = [
    ['modify_item', () => codeGenerator.generateModifyItem({ itemId: NASTY, properties: { x: 1, opacity: 0.5, content: 'hi', bornAt: 1, smoothing: 'off' } } as never)],
    ['delete_item', () => codeGenerator.generateDeleteItem({ itemId: NASTY } as never)],
    ['animate', () => codeGenerator.generateAnimate({ itemId: NASTY, animationType: 'pulse' } as never)],
    ['keyframe_animate', () => codeGenerator.generateKeyframeAnimate({ itemId: NASTY, keyframes: [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 9 } }] } as never)],
    ['apply_effect', () => codeGenerator.generateApplyEffect({ itemId: NASTY, effectType: 'sparkle' } as never)],
    ['query_relations', () => codeGenerator.generateQueryRelations({ itemId: NASTY } as never)],
  ];
  for (const [name, gen] of calls) {
    it(`${name}: the code parses and names the id as a literal`, () => {
      const code = gen();
      expect(() => parses(code)).not.toThrow();
      expect(code).not.toContain("'Bob's");
    });
  }

  it("modify_item's id reaches the engine intact", async () => {
    const seen: string[] = [];
    const app = { modifyItem: (id: string) => { seen.push(id); return true; }, getItemById: () => ({}), itemRegistry: { get: () => ({ item: { data: {} } }) }, historyManager: { saveState() {} } };
    const code = codeGenerator.generateModifyItem({ itemId: NASTY, properties: { x: 1 } } as never);
    const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    await new Function('app', 'window', 'paper', `return (async () => { ${body} })`)(app, {}, {})();
    expect(seen[0]).toBe(NASTY);
  });
});

describe('create refuses an id later calls could not address', () => {
  it("refuses a quote, backslash or line break, by name, and makes nothing", () => {
    for (const id of ["Bob's hat", 'a"b', 'a\\b', 'a\nb', 'a`b']) {
      const code = codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: { id } } as never);
      expect(code).not.toContain('app.create(');
      expect(code).toContain('success: false');
    }
  });

  it('accepts letters, digits, spaces, - and _', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 1, y: 1 }, properties: { id: 'bobs hat-2_b' } } as never);
    expect(code).toContain('app.create(');
  });
});
