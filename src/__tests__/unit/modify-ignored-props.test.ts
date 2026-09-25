/**
 * modify_item names the properties it could not act on (round 6 retest):
 * {scaling: 8} answered success and left the raster 16 px.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MODIFY_CHANGE_READS } from '../../tools/shape-params.js';

const modify = (properties: Record<string, unknown>) => codeGenerator.generateModifyItem({ itemId: 'item_1', properties });

describe('modify_item reports unread properties', () => {
  it('flags scaling and points at scale', () => {
    const code = modify({ scaling: 8 });
    expect(code).toContain('ignoredProperties: ["scaling"]');
    expect(code).toContain('Did you mean scale (not scaling)?');
  });

  it('says nothing for keys the engine or this emitter reads', () => {
    for (const k of ['scale', 'fill', 'bornAt', 'smoothing', 'leading', 'volume', 'contentType', 'x']) {
      expect(modify({ [k]: 1 })).not.toContain('ignoredProperties');
    }
  });

  it('the generated modify reads are wired in', () => {
    expect(MODIFY_CHANGE_READS).toContain('scale');
    const all = Object.fromEntries(MODIFY_CHANGE_READS.map((k) => [k, 1]));
    expect(modify(all)).not.toContain('ignoredProperties');
  });
});
