/**
 * Every video export is deterministic unless the caller opts out (owner, 2026-11-07). The MCP path never reaches the
 * engine's own default (that is PinePaperAgent.quickExport), so without this a plain export ran no probe and its
 * receipt could not say whether the file repeats.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

const code = (input: Record<string, unknown>) => gen.generateAgentExport(input as never);

describe('deterministic by default', () => {
  for (const format of ['mp4', 'webm']) {
    it(`a plain ${format} asks for it and reports on it`, () => {
      const c = code({ format, duration: 1 });
      expect(c).toContain('"deterministic":true');
      expect(c).toContain('this file will not repeat byte for byte');
    });

    it(`a ${format} with deterministic: false opts out`, () => {
      const c = code({ format, duration: 1, deterministic: false });
      expect(c).not.toContain('"deterministic":true');
      expect(c).not.toContain('this file will not repeat byte for byte');
    });
  }

  it('deterministic: true generates what the default generates', () => {
    expect(code({ format: 'mp4', duration: 1 })).toBe(code({ format: 'mp4', duration: 1, deterministic: true }));
  });

  for (const format of ['gif', 'png', 'svg']) {
    it(`a ${format} is untouched`, () => {
      expect(code({ format, duration: 1 })).not.toContain('"deterministic":true');
    });
  }

  it('the warning does not claim the caller asked', () => {
    expect(code({ format: 'mp4', duration: 1 })).not.toContain('deterministic was asked for, but no encoder');
  });
});
