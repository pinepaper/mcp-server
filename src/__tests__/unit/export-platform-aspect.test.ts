/**
 * A named platform preset is a size, not permission to stretch (round 5 Q, 1.32).
 *
 * agent_export {platform:'instagram'} on a 1080x1350 canvas came out 1080x1080,
 * squashed to 0.8 vertically. The emitted sizing block is run here against a
 * stub canvas and checked for what it hands the exporter.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function sizeFor(platform: string, canvas: { width: number; height: number } | null, scale?: number) {
  const code = codeGenerator.generateAgentExport({ platform, format: 'mp4', ...(scale ? { scale } : {}) } as never);
  const block = /const __presetBox[\s\S]*?(?=\n\s*\/\/ WHAT THIS SCENE LOSES)/.exec(code)?.[0];
  expect(block).toBeDefined();
  return new Function('app', 'platform', `${block}; return { dimensions, fit: __fit };`)(
    { canvasSize: canvas }, platform,
  ) as { dimensions: { width: number; height: number }; fit: null | { used: string; preset: string } };
}

describe('agent_export keeps the canvas aspect under a platform preset', () => {
  it('4:5 on instagram is 1080x1350, not a squashed 1080x1080', () => {
    const r = sizeFor('instagram', { width: 1080, height: 1350 });
    expect(r.dimensions).toEqual({ width: 1080, height: 1350 });
    expect(r.fit?.preset).toBe('1080x1080');
  });

  it('a square canvas on youtube is 1080x1080', () => {
    expect(sizeFor('youtube', { width: 800, height: 800 }).dimensions).toEqual({ width: 1080, height: 1080 });
  });

  it('a matching aspect uses the preset exactly and reports nothing', () => {
    const r = sizeFor('youtube', { width: 960, height: 540 });
    expect(r.dimensions).toEqual({ width: 1920, height: 1080 });
    expect(r.fit).toBeNull();
  });

  it('scale still applies, and a studio with no canvas size keeps the preset', () => {
    expect(sizeFor('instagram', { width: 1080, height: 1350 }, 0.5).dimensions).toEqual({ width: 540, height: 676 });
    expect(sizeFor('instagram', null).dimensions).toEqual({ width: 1080, height: 1080 });
  });

  it('the adjustment reaches the result', () => {
    const code = codeGenerator.generateAgentExport({ platform: 'instagram', format: 'mp4' } as never);
    expect(code).toContain('result.platformFit = __fit');
  });
});
