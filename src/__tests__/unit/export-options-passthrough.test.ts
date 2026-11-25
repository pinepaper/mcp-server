import { describe, it, expect } from 'bun:test';
import { AgentExportInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

describe('pinepaper_agent_export forwards PR #455 options and enforceBitrate (#669 / wave1)', () => {
  it('publishes boundedEffects and prerollDraw alongside startTime and enforceBitrate', () => {
    const tool = (PINEPAPER_TOOLS as any[]).find((t) => t.name === 'pinepaper_agent_export');
    expect(tool).toBeDefined();
    const props = tool.inputSchema.properties;
    expect(props.boundedEffects).toBeDefined();
    expect(props.prerollDraw).toBeDefined();
    expect(props.prerollDraw.enum).toEqual(['auto', 'always']);
    expect(String(props.startTime.description)).toContain('prerollDraw');
  });

  it('validates boundedEffects and prerollDraw on mp4/webm/auto and refuses non-video formats', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', boundedEffects: true }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'webm', boundedEffects: 'decompose' }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'auto', boundedEffects: 'decompose', startTime: 2, prerollDraw: 'always' }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', startTime: 1, prerollDraw: 'auto' }).success).toBe(true);

    const onPng = AgentExportInputSchema.safeParse({ format: 'png', boundedEffects: true });
    expect(onPng.success).toBe(false);
    const onWav = AgentExportInputSchema.safeParse({ format: 'wav', prerollDraw: 'always' });
    expect(onWav.success).toBe(false);
  });

  it('emits boundedEffects, prerollDraw, and enforceBitrate in generated videoEncodeOpts', () => {
    const gen = new PinePaperCodeGenerator();
    const code = gen.generateAgentExport({
      format: 'mp4',
      duration: 5,
      startTime: 2,
      prerollDraw: 'always',
      boundedEffects: 'decompose',
      bitrate: 4_000_000,
      enforceBitrate: true,
    } as any);
    expect(code).toContain('"startTime":2');
    expect(code).toContain('"prerollDraw":"always"');
    expect(code).toContain('"boundedEffects":"decompose"');
    expect(code).toContain('"enforceBitrate":true');

    const boolCode = gen.generateAgentExport({
      format: 'webm',
      boundedEffects: true,
    } as any);
    expect(boolCode).toContain('"boundedEffects":true');
    expect(boolCode).not.toContain('"enforceBitrate"');
  });
});

// A studio that predates boundedEffects ignores the option without a word (frames identical to a plain export,
// measured on production 2026-11-25). The reply says so from the studio's own report, on any studio.
describe('boundedEffects is confirmed from the studio report, not assumed', () => {
  const gen = new PinePaperCodeGenerator();
  const tail = (code: string) => {
    const a = code.indexOf('// BOUNDED EFFECTS are confirmed');
    expect(a).toBeGreaterThan(-1);
    const b = code.indexOf('\n  }', code.indexOf('bounded_effects_not_applied'));
    return code.slice(a, b + 4);
  };
  const run = (vr: unknown) => {
    const code = gen.generateAgentExport({ format: 'mp4', boundedEffects: true } as any);
    const result: any = { success: true, fidelity: { warnings: [], note: 'x' } };
    new Function('result', '__vr', tail(code))(result, vr);
    return result;
  };
  it('warns when the studio wrote no boundedEffects record', () => {
    const r = run({ frames: { fed: 120 } });
    expect(r.fidelity.warnings.map((w: any) => w.code)).toEqual(['bounded_effects_not_applied']);
    expect(r.fidelity.note).toBeUndefined();
    expect(run(null).fidelity.warnings.length).toBe(1);
  });
  it('says nothing when the studio reports it on', () => {
    const r = run({ boundedEffects: { on: true, mode: 'bounded' } });
    expect(r.fidelity.warnings).toEqual([]);
  });
  it('is not emitted when the option was not asked for, or asked false', () => {
    expect(gen.generateAgentExport({ format: 'mp4' } as any)).not.toContain('bounded_effects_not_applied');
    expect(gen.generateAgentExport({ format: 'mp4', boundedEffects: false } as any)).not.toContain('bounded_effects_not_applied');
  });
});
