/**
 * An export whose motion comes only from relations reported animated:false (the studio's check counts keyframe
 * tracks and simple animations). When the studio says false, the frames decide.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

describe('export: motion from relations counts as animated', () => {
  const code = codeGenerator.generateAgentExport({ format: 'mp4', duration: 2 } as never);

  it('asks the frames only when the studio said not animated, and only for a moving format', () => {
    expect(code).toContain("['mp4', 'webm', 'gif', 'apng'].indexOf(format) !== -1");
    expect(code).toContain('result.fidelity.checked.animated === false');
    expect(code).toMatch(/__mcap\(__mt,/);
  });

  it('samples at uneven times across the export, so a loop cannot land on whole periods', () => {
    expect(code).toContain('[0, 0.17, 0.43, 0.71].map((k) => Math.round(k * 2 * 1000) / 1000)');
  });

  it('runs after the export result exists, and before the frozen-output check that reads the flag', () => {
    const at = code.indexOf('result.fidelity.checked.animated = true');
    expect(at).toBeGreaterThan(code.indexOf('Object.assign(result, fidelity(format))'));
    expect(at).toBeLessThan(code.indexOf('result.fidelity.checked.animated && typeof result.size'));
  });
});
