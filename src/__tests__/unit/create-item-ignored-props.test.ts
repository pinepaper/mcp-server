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
    // Text-only keys the engine reads (it gates them on PointText) are the one
    // exception on other types; they are checked on a text item instead.
    const TEXT_ONLY = ['fontWeight', 'fontStyle', 'leading', 'lineHeight', 'fit', 'textDirection', 'dir', 'tabularFigures', 'fontVariantNumeric', 'fontFeatures', 'strokePosition'];
    const all = [...ACCEPTED_CREATE_PARAMS, ...NORMALIZE_PARAM_READS].filter((k) => !['anchor', 'origin', 'position'].includes(k)); // validated / consumed separately
    const circleProps = Object.fromEntries(all.filter((k) => !TEXT_ONLY.includes(k)).map((k) => [k, 1]));
    expect(gen.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties: circleProps })).not.toContain('ignoredProperties');
    const textProps = Object.fromEntries(all.map((k) => [k, 1]));
    expect(gen.generateCreateItem({ itemType: 'text', position: { x: 0, y: 0 }, properties: textProps })).not.toContain('ignoredProperties');
  });

  it('text-only keys on another type are reported, whatever the engine reads', () => {
    const code = gen.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties: { fontWeight: 700, strokePosition: 'outside', direction: 'ccw' } });
    expect(code).toContain('ignoredProperties: ["fontWeight","strokePosition"]'); // direction is an arc / sweep key, not text-only
  });

  it('does not apply to shader / field, whose params travel to the renderer', () => {
    const code = gen.generateCreateItem({
      itemType: 'shader', position: { x: 0, y: 0 },
      properties: { shader: 'water', shaderPalette: 'ocean', behind: true, width: 800, height: 400 },
    });
    expect(code).not.toContain('ignoredProperties');
  });
});
