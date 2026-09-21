/**
 * Ratchet: a parameter the validator accepts must be one an agent can SEE.
 *
 * `fps` and `scale` were implemented, validated by AgentExportInputSchema,
 * honoured by the code generator, and described in the tool's own prose
 * ("Override either half directly - fps for frame rate, scale for resolution")
 * — and absent from the published inputSchema, which is the only thing a model
 * reads when deciding what it may pass. So a beta report landed saying "no fps
 * parameter exists" and "quality secretly bundles resolution + fps" (B29,
 * re-probed 2026-09-21). Both halves were true from where the agent stood.
 *
 * This is the same failure as reading a name-only enum for a capability that
 * self-describes: invisible, not missing.
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

function publishedProperties(toolName: string): Set<string> {
  const tool = (PINEPAPER_TOOLS as any[]).find((t) => t.name === toolName);
  if (!tool) throw new Error(`no tool definition named ${toolName}`);
  return new Set(Object.keys(tool.inputSchema?.properties ?? {}));
}

describe('pinepaper_agent_export publishes what it accepts', () => {
  // Fields the validator knows about but that are deliberately not offered to
  // an agent. Each one needs a reason, so that adding to this list is a
  // decision rather than an oversight.
  const INTENTIONALLY_UNPUBLISHED: Record<string, string> = {
    includeRecommendations: 'always on for agents; nothing useful to decide',
  };

  it('every validated field is either published or explicitly excused', () => {
    const accepted = Object.keys((AgentExportInputSchema as any)._def.schema?.shape
      ?? (AgentExportInputSchema as any).shape ?? {});
    expect(accepted.length).toBeGreaterThan(5);   // the shape was actually read

    const published = publishedProperties('pinepaper_agent_export');
    const missing = accepted.filter(
      (k) => !published.has(k) && !(k in INTENTIONALLY_UNPUBLISHED)
    );
    expect(missing).toEqual([]);
  });

  it('fps and scale are the two the beta report could not find', () => {
    const published = publishedProperties('pinepaper_agent_export');
    expect(published.has('fps')).toBe(true);
    expect(published.has('scale')).toBe(true);
  });

  it('quality no longer claims to be only about quality', () => {
    const tool = (PINEPAPER_TOOLS as any[]).find((t) => t.name === 'pinepaper_agent_export');
    const quality = tool.inputSchema.properties.quality.description as string;
    // The old text was exactly 'Export quality level (default: standard)',
    // which is what the report quoted back verbatim.
    expect(quality).not.toBe('Export quality level (default: standard)');
    expect(quality.toLowerCase()).toContain('fps');
  });
});

describe("platform 'auto' means the canvas, not a preset that happens to be first", () => {
  it('is offered, and is not required to be named', () => {
    const tool = (PINEPAPER_TOOLS as any[]).find((t) => t.name === 'pinepaper_agent_export');
    expect(tool.inputSchema.properties.platform.enum).toContain('auto');
    // Requiring a platform forced every caller to pick a preset, and a preset
    // silently REPLACES the dimensions they had already chosen.
    expect(tool.inputSchema.required ?? []).not.toContain('platform');
  });

  it('a named platform still emits its preset as a readable literal', async () => {
    const { PinePaperCodeGenerator } = await import('../../types/code-generator.js');
    const code = new PinePaperCodeGenerator().generateAgentExport({
      platform: 'youtube', format: 'mp4', duration: 5,
    } as any);
    expect(code).toContain('const dimensions = {"width":1920,"height":1080}');
    expect(code).not.toContain('__canvasDims');
  });

  it("'auto' reads the canvas size at runtime instead of baking 800x600", async () => {
    // The probe measured three exports of a 960x540 canvas all returning
    // 800x600 — the `web` preset, reached because 'auto' was not a key in the
    // preset table and the lookup fell through to it.
    const { PinePaperCodeGenerator } = await import('../../types/code-generator.js');
    const code = new PinePaperCodeGenerator().generateAgentExport({
      format: 'mp4', duration: 5,
    } as any);
    expect(code).toContain('app.canvasSize');
    expect(code).toContain('__presetDims');
    // The preset survives only as the fallback, never as the answer.
    expect(code).not.toContain('const dimensions = {"width":800,"height":600}');
  });

  it('scale still applies when the size comes from the canvas', async () => {
    const { PinePaperCodeGenerator } = await import('../../types/code-generator.js');
    const code = new PinePaperCodeGenerator().generateAgentExport({
      format: 'mp4', duration: 5, scale: 0.5,
    } as any);
    expect(code).toMatch(/__even = \(n\) => Math\.max\(2, Math\.round\(\(n \* 0\.5\)/);
  });
});
