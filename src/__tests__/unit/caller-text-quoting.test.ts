/**
 * Caller text reaches generated code as a JS literal (jsLiteral), never spliced inside quotes the generator wrote.
 * A quote ended the literal, a line break ended a generated `//` comment and turned the rest of the text into code.
 * Each path below takes hostile text and must still parse, carrying the text intact.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { codeGenerator } from '../../types/code-generator.js';
import { jsLiteral } from '../../utils/js-literal.js';

const HOSTILE = "a'b\"c\n// x');alert(1)// <\/script>";

function parses(code: string) {
  expect(() => new Function(`return (async () => {\n${code}\n})`)).not.toThrow();
}

describe('caller text is a literal in generated code', () => {
  const cases: Array<[string, () => string]> = [
    ['add_relation ids', () => codeGenerator.generateAddRelation({ sourceId: HOSTILE, targetId: HOSTILE, relationType: 'orbits', params: {} } as never)],
    ['remove_relation ids', () => codeGenerator.generateRemoveRelation(HOSTILE, HOSTILE, 'orbits')],
    ['get_items filter', () => codeGenerator.generateGetItems({ type: HOSTILE, source: HOSTILE })],
    ['set_background_color', () => codeGenerator.generateSetBackgroundColor({ color: HOSTILE } as never)],
    ['create_scene names', () => codeGenerator.generateCreateScene({ items: [{ name: HOSTILE, itemType: 'circle', position: { x: 1, y: 1 }, properties: {} }], relations: [{ source: HOSTILE, target: HOSTILE, type: 'orbits' }], animations: [{ target: HOSTILE, type: 'pulse' }] } as never)],
    ['group comment', () => codeGenerator.generateGroup({ action: 'group', itemIds: ['item_1', 'item_2'], groupName: HOSTILE } as never)],
  ];
  for (const [name, gen] of cases) {
    it(name, () => {
      const code = gen();
      parses(code);
      expect(code).toContain(jsLiteral(HOSTILE));
    });
  }
});

describe('the raw quoted splice does not come back', () => {
  it("code-generator has no more '${…}' outside jsLiteral than the internal names it keeps", () => {
    const src = readFileSync(join(import.meta.dir, '..', '..', 'types', 'code-generator.ts'), 'utf8');
    // Internal names, enums and TypeScript-side message text (d.key, method, fn, kind, v.action, …). Shrink only.
    expect((src.match(/'\$\{(?!jsLiteral)/g) || []).length).toBeLessThanOrEqual(11);
  });
});
