/**
 * design_medium apply with ink / charcoal (gate D32). FxTool #75 restyles an
 * EXISTING path or text in place: the same item, its leaves marked with
 * data.brushStyle. The fake copies that contract. The tool reads the mark
 * back, so an item the engine passed over fails rather than succeeds.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { DesignMediumInputSchema } from '../../types/schemas.js';

function fakeApp(marks: boolean) {
  const leaf: Record<string, any> = { data: {} };
  const group: Record<string, any> = { data: { registryId: 'item_3' }, children: [leaf] };
  return {
    itemRegistry: { get: (id: string) => (id === 'item_3' ? { item: group } : null) },
    applyMedium: async (id: string, medium: string) => {
      if (marks) leaf.data.brushStyle = { medium };
      return { ok: true, medium, fidelity: 'native', item: group, id };
    },
  };
}

async function run(medium: string, app: Record<string, any>) {
  const input = DesignMediumInputSchema.parse({ action: 'apply', itemId: 'item_3', medium });
  const body = codeGenerator.generateDesignMedium(input).replace(/^(\s*\/\/.*\n)+/, '');
  return (await new Function('app', `return ${body}`)(app)) as Record<string, any>;
}

describe('design_medium apply ink / charcoal (D32)', () => {
  it('reports the same item, restyled in place', async () => {
    const r = await run('ink', fakeApp(true));
    expect(r).toMatchObject({ success: true, medium: 'ink', itemId: 'item_3', inPlace: true, styled: 1 });
  });
  it('fails when no leaf carries the brush', async () => {
    const r = await run('charcoal', fakeApp(false));
    expect(r.success).toBe(false);
    expect(r.error).toContain('carries it');
  });
  it('refuses an unknown medium, and apply without itemId or medium', () => {
    expect(() => DesignMediumInputSchema.parse({ action: 'apply', itemId: 'item_3', medium: 'pastel' })).toThrow(/unknown medium/);
    expect(() => DesignMediumInputSchema.parse({ action: 'apply', medium: 'ink' })).toThrow(/needs itemId and medium/);
  });
});
