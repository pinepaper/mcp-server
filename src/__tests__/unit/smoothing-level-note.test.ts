import { describe, it, expect } from 'bun:test';
import { smoothingLevelField } from '../../tools/handlers.js';

describe('B136: smoothing medium / high is named in the reply', () => {
  it('names the level asked for, wherever it was written', () => {
    expect(smoothingLevelField({ url: 'x', smoothing: 'high' }).smoothingNote).toContain("'high'");
    expect(smoothingLevelField({ itemId: 'item_1', properties: { smoothing: 'medium' } }).smoothingNote).toContain("'medium'");
    expect(smoothingLevelField({ operations: [{ type: 'create', properties: { smoothing: 'high' } }] }).smoothingNote).toContain('Chromium');
  });
  it("says nothing for 'off', 'low', numbers, or no smoothing", () => {
    for (const a of [{ smoothing: 'off' }, { smoothing: 'low' }, { params: { smoothing: 0.2 } }, { smoothing: 12 }, {}]) {
      expect(smoothingLevelField(a)).toEqual({});
    }
  });
});
