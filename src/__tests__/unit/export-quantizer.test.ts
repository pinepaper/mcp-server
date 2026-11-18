/**
 * HOOKSTALL37: faint 1 px lines held between frames at the deterministic default quantizer (23). FxTool's check asks for
 * a re-export at quantizer 18, which pinepaper_agent_export could not ask for.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

describe('agent export quantizer', () => {
  it('sends a fixed quality to the studio', () => {
    const code = codeGenerator.generateAgentExport({ format: 'mp4', duration: 3, quantizer: 18 } as never);
    expect(code).toMatch(/"bitrateMode":\s*"quantizer"/);
    expect(code).toMatch(/"quantizer":\s*18/);
  });
  it('is refused beside a bitrate setting, and on a non-video format', () => {
    expect(() => AgentExportInputSchema.parse({ format: 'mp4', quantizer: 18, bitrate: 5_000_000 })).toThrow(/fixed quality/);
    expect(() => AgentExportInputSchema.parse({ format: 'mp4', quantizer: 18, bitrateMode: 'variable' })).toThrow(/fixed quality/);
    expect(() => AgentExportInputSchema.parse({ format: 'gif', quantizer: 18 })).toThrow(/video setting/);
    expect(AgentExportInputSchema.parse({ format: 'webm', quantizer: 30 }).quantizer).toBe(30);
  });
});
