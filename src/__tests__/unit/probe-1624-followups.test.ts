/**
 * Follow-ups from the 1.6.24 probes.
 *   - Emitter keys the studio reads as ONE number turned a [min, max] range into
 *     the default without a word (gravity [100, 300] → 0, opacity [0.2, 1] → 1).
 *   - PATCHIMG24: an imported image had no name, so a batch patch (which
 *     addresses by name) could not reach it.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen, normalizeEmitterSpec } from '../../types/code-generator.js';

describe('emitter ranges on single-number keys', () => {
  it('says a range on gravity and opacity was not read', () => {
    const w = normalizeEmitterSpec({ gravity: [100, 300], opacity: [0.2, 1], count: 4, bursts: [{ t: 0, x: 0, y: 0 }] }).warnings.join('\n');
    expect(w).toContain('spec.gravity [100,300] was NOT read');
    expect(w).toContain('spec.opacity [0.2,1] was NOT read');
  });

  it('checks a burst\'s own keys too', () => {
    expect(normalizeEmitterSpec({ bursts: [{ t: 0, x: 0, y: 0, count: 3, drag: [1, 2] }] }).warnings.join(' ')).toContain('bursts[0].drag');
  });

  it('leaves the range keys and single numbers alone', () => {
    expect(normalizeEmitterSpec({ size: [2, 6], speed: [50, 90], lifetime: [1, 2], spin: [0, 90], gravity: 200, opacity: 0.6, count: 4, bursts: [{ t: 0, x: 0, y: 0 }] }).warnings).toEqual([]);
  });
});

describe('import_image name', () => {
  it('names the drawn item where the registry looks a name up, and says so', () => {
    const code = gen.generateImportImage({ url: 'https://example.com/a.png', name: 'hero' } as never);
    expect(code).toContain('placed.name = "hero"');
    expect(code).toContain('placed.data.name = "hero"');
    expect(code).toContain('name: "hero"');
  });

  it('sets no name when none is asked for', () => {
    expect(gen.generateImportImage({ url: 'https://example.com/a.png' } as never)).not.toContain('placed.name =');
  });
});
