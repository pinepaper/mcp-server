/**
 * pinepaper_agent_export motionBlur (motion-course G2, FxTool #55): passed
 * to the engine on mp4/webm, refused on anything else, and included in the
 * estimateOnly preflight so it reports the subframes× render cost.
 */
import { describe, it, expect } from 'bun:test';
import { AgentExportInputSchema } from '../../types/schemas.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator();
const emit = (input: Record<string, unknown>) => gen.generateAgentExport(AgentExportInputSchema.parse(input) as never);

describe('agent_export motionBlur', () => {
  it('is a video setting: mp4 or webm only', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', motionBlur: { subframes: 8 } }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'webm', motionBlur: {} }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'png', motionBlur: { subframes: 8 } }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', motionBlur: { subframes: 64 } }).success).toBe(false);
  });

  it('reaches the engine export, and reports what the exporter applied', () => {
    const code = emit({ format: 'mp4', duration: 1, motionBlur: { subframes: 8, shutter: 0.5 } });
    expect(code).toContain('"motionBlur":{"subframes":8,"shutter":0.5}');
    expect(code).toContain('__vx.lastMotionBlur');
    expect(code).toContain('motion_blur_not_applied');
  });

  it('the estimate is asked with motionBlur, so it can report renders and renderCost', () => {
    const code = emit({ format: 'mp4', duration: 1, estimateOnly: true, motionBlur: { subframes: 8 } });
    expect(code).toMatch(/estimateExportSize\(\{[\s\S]*motionBlur: \{"subframes":8\}/);
  });

  it('without it, nothing changes', () => {
    expect(emit({ format: 'mp4', duration: 1 })).not.toContain('motionBlur');
  });
});
