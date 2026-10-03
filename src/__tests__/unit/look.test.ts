/** D64: restyle an item or the scene as a named look; fidelity is always said. */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { LookInputSchema } from '../../types/schemas.js';

const run = async (input: unknown, app: unknown) => new Function('app', `return ${codeGenerator.generateLook(LookInputSchema.parse(input)).replace(/^(\s*\/\/.*\n)+/, '')}`)(app);
const studio = (fidelity: string) => ({
  applyLook: async () => ({ ok: true, look: { id: 'woodcut' }, restyled: 12, texts: 2, approximations: ['no gouge texture'] }),
  describeLook: () => ({ ok: true, look: { id: 'woodcut', fidelity, approximations: ['no gouge texture'] } }),
});

describe('pinepaper_look', () => {
  it('an impression applies, and says to present it as an approximation', async () => {
    const r = await run({ action: 'apply', look: 'woodcut' }, studio('impression'));
    expect(r).toMatchObject({ success: true, fidelity: 'impression', restyled: 12 });
    expect(r.warning).toContain('approximation');
  });
  it('a faithful look lists its approximations as a note, not a warning; native says nothing', async () => {
    const f = await run({ action: 'apply', look: '8-bit', target: 'item_2' }, studio('faithful'));
    expect(f.warning).toBeUndefined();
    expect(f.note).toContain('no gouge texture');
    const n = await run({ action: 'apply', look: 'flat' }, studio('native'));
    expect(n.warning).toBeUndefined();
    expect(n.note).toBeUndefined();
  });
  it('an unknown look fails with the known ones; an old studio refuses by name', async () => {
    const r = await run({ action: 'apply', look: 'vaporwave2' }, { describeLook: () => ({ ok: false }), applyLook: async () => ({ ok: false, error: 'unknown look "vaporwave2"', known: ['8-bit', 'blueprint'] }) });
    expect(r).toMatchObject({ success: false, known: ['8-bit', 'blueprint'] });
    expect((await run({ action: 'list' }, {})).error).toContain('D64');
  });
});
