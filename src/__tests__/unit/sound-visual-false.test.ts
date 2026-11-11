import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

describe('pinepaper_sound accepts visual: false', () => {
  it('create with visual false builds the default chip and does not throw', () => {
    const code = gen.generateSound({ action: 'create', spec: { instrument: 'piano', note: 'A4' }, visual: false } as never);
    expect(code).toContain('app.createSound(');
    expect(code).toContain(', {});');
  });
});

describe('the sound schema takes visual: false', () => {
  it('parses at create and per cue', async () => {
    const { SoundInputSchema } = await import('../../types/schemas.js');
    expect(SoundInputSchema.safeParse({ action: 'create', visual: false }).success).toBe(true);
    expect(SoundInputSchema.safeParse({ action: 'sequence', cues: [{ t: 0, preset: 'piano', note: 'C4', visual: false }] }).success).toBe(true);
    expect(SoundInputSchema.safeParse({ action: 'create', visual: true }).success).toBe(false);
  });
});
