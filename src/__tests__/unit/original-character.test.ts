/** D66: original characters from a base rig + variant (FxTool #105). */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { OriginalCharacterInputSchema, RelationTypeSchema } from '../../types/schemas.js';

const run = async (input: unknown, app: unknown) => new Function('app', `return ${codeGenerator.generateOriginalCharacter(OriginalCharacterInputSchema.parse(input)).replace(/^(\s*\/\/.*\n)+/, '')}`)(app);

describe('original character', () => {
  it('create passes the feet position and returns the root id and parts', async () => {
    let spec: any = null;
    const r = await run({ action: 'create', base: 'person', at: { x: 480, y: 900 }, variant: { look: 'ink' } },
      { createCharacter: async (s: any) => { spec = s; return { ok: true, id: 'item_3', rigId: 'sk_1', parts: { head: 'item_4' }, name: 'Mira', base: 'person', look: 'ink' }; } });
    expect(spec).toMatchObject({ base: 'person', x: 480, y: 900, variant: { look: 'ink' } });
    expect(r).toMatchObject({ success: true, itemId: 'item_3', parts: { head: 'item_4' } });
  });
  it('a refused variant fails with the engine errors; an old studio refuses by name', async () => {
    const bad = await run({ action: 'create', base: 'person', variant: { features: { hair: 'mohawk9' } } },
      { createCharacter: async () => ({ ok: false, errors: ['features.hair: unknown "mohawk9" (valid: bob, bun, …)'] }) });
    expect(bad.error).toContain('mohawk9');
    expect((await run({ action: 'bases' }, {})).error).toContain('D66');
  });
  it('random returns the seeded variant', async () => {
    const r = await run({ action: 'random', base: 'robot', seed: 4, fixed: { look: 'pixel' } },
      { createCharacter() {}, randomCharacterVariant: (_b: string, seed: number, o: any) => ({ ok: true, variant: { seed, look: o.fixed.look } }) });
    expect(r.variant).toEqual({ seed: 4, look: 'pixel' });
  });
  it('the interaction relations are offered', () => {
    for (const r of ['looks_at', 'reacts_to', 'drag_to_turn']) expect(RelationTypeSchema.parse(r)).toBe(r);
  });
});
