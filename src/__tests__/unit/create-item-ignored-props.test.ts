/**
 * create_item names the properties it could not act on.
 *
 * `properties` is free-form and the engine's create() returns an item whatever
 * it is given, so {blur, backdropBlur, backdropFilter} produced a crisp shape
 * and a successful call (round 5 R, 1.28). The allowlist is generated from the
 * engine; these tests pin both halves — the unknown is reported, and nothing
 * the engine or this emitter does read is reported as unknown.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';
import { ACCEPTED_CREATE_PARAMS, NORMALIZE_PARAM_READS } from '../../tools/shape-params.js';

/** Run the emitted snippet's final expression with a stub engine. */
function run(code: string): Record<string, unknown> {
  const item = { data: { registryId: 'item_1' }, bringToFront() {} };
  const app = { create: () => item, historyManager: { saveState() {} } };
  return new Function('app', `${code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`)}`)(app);
}

describe('create_item reports unread properties', () => {
  it('names blur / backdropBlur / backdropFilter instead of dropping them silently', () => {
    const code = gen.generateCreateItem({
      itemType: 'rectangle', position: { x: 100, y: 100 },
      properties: { width: 200, height: 100, color: '#fff', blur: 12, backdropBlur: 8, backdropFilter: 'blur(8px)' },
    });
    const r = run(code);
    expect(r.itemId).toBe('item_1');
    expect(r.ignoredProperties).toEqual(['blur', 'backdropBlur', 'backdropFilter']);
    expect(String(r.warning)).toContain('no effect');
  });

  it('says nothing when every property is read', () => {
    const code = gen.generateCreateItem({
      itemType: 'text', position: { x: 10, y: 10 },
      properties: { content: 'hi', fontSize: 32, fill: '#000', delay: 1, bornAt: 2, ttl: 3, contentType: 'clock' },
    });
    expect(code).not.toContain('ignoredProperties');
  });

  it('never flags a key the engine reads (generated allowlist is wired in)', () => {
    const properties: Record<string, unknown> = {};
    for (const k of [...ACCEPTED_CREATE_PARAMS, ...NORMALIZE_PARAM_READS]) {
      if (['anchor', 'origin', 'position'].includes(k)) continue; // validated / consumed separately
      properties[k] = 1;
    }
    const code = gen.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties });
    expect(code).not.toContain('ignoredProperties');
  });

  it('does not apply to shader / field, whose params travel to the renderer', () => {
    const code = gen.generateCreateItem({
      itemType: 'shader', position: { x: 0, y: 0 },
      properties: { shader: 'water', shaderPalette: 'ocean', behind: true, width: 800, height: 400 },
    });
    expect(code).not.toContain('ignoredProperties');
  });
});
