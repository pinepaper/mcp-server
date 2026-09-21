/**
 * The tool named "get animatable properties" could not tell you what an ITEM
 * could animate.
 *
 * It answered for mask TYPES only, and its name did not say so — an agent
 * asking the obvious question landed here and got a mask table. The item-side
 * answer existed nowhere on the surface, so the honest route was to read the
 * keyframe tool's prose.
 *
 * The engine now publishes the table, derived from the applier rather than
 * written beside it. The part that must survive the trip is `interpolates`:
 * `content` and `blendMode` are DISCRETE — they hold their value until the next
 * keyframe instead of blending toward it — and flattening that to "animatable"
 * is what makes every word in a cycler land half a beat early.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

const codeOf = async (args: Record<string, unknown>) => {
  const r = await handleToolCall('pinepaper_get_animatable_properties', args,
    { executeInBrowser: false, executionMode: 'code' });
  return (r.content[0] as { text: string }).text;
};

describe('get_animatable_properties answers for an item', () => {
  it('with an itemId, asks the engine about that item', async () => {
    const t = await codeOf({ itemId: 'item_1' });
    expect(t).toContain('app.listAnimatableProperties(');
    expect(t).toContain('item_1');
  });

  it('without one, it still answers the old mask question', async () => {
    // Existing callers pass {} and must keep getting what they got.
    const t = await codeOf({});
    expect(t).not.toContain('listAnimatableProperties');
  });

  it('passes the engine result through whole, so `interpolates` survives', () => {
    // Spreading rather than picking fields is what keeps `interpolates`,
    // `discrete`, `defaultEasing` and `easings` from being quietly dropped.
    const code = codeGenerator.generateListItemAnimatableProperties('item_1');
    expect(code).toContain('...r');
    expect(code).not.toMatch(/properties:\s*r\.properties/);
  });

  it('refuses by name on a studio without the table', () => {
    const code = codeGenerator.generateListItemAnimatableProperties('item_1');
    expect(code).toContain("typeof app.listAnimatableProperties !== 'function'");
    // …and names the fallback rather than just refusing.
    expect(code).toContain('keyframe tool');
  });

  it('a missing item is named, not answered for', () => {
    const code = codeGenerator.generateListItemAnimatableProperties('item_99');
    expect(code).toContain('no item item_99');
  });
});

describe('rotation is reported from the engine where it can be', () => {
  // create() bakes the angle into the path segments, so item.rotation reads
  // back 0 on an item that is visibly turned. Every site that REPORTS a
  // rotation must therefore report the sum, and three do.
  const sites: Array<[string, string]> = [
    ['query get_by_id', codeGenerator.generateQuery({ action: 'get_by_id', itemId: 'item_1' } as never)],
    ['measurement get_dimensions', codeGenerator.generateMeasurement({ action: 'get_dimensions', itemId: 'item_1' } as never)],
    ['export_scene', codeGenerator.generateExportScene()],
  ];

  for (const [label, code] of sites) {
    it(`${label} prefers authoredRotation, keeping the arithmetic as fallback`, () => {
      expect(code).toContain('app.authoredRotation');
      // The fallback matters: older studios do not publish it, and the sum is
      // still correct there.
      expect(code).toContain('_bakedRotation');
    });
  }
});
