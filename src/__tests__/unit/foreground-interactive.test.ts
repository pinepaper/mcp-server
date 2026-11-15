/**
 * Owner 2026-11-14: foreground generators (the studio's ui, infographics and captions categories) default to
 * interactive: true, so their parts are editable items and pinepaper_group ungroup can release them. The caller's
 * own interactive wins, and background generators are untouched.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

async function run(name: string, params: Record<string, unknown>, category: string | undefined) {
  const seen: Array<Record<string, unknown>> = [];
  const app = {
    generatorRegistry: { get: () => (category ? { category } : undefined) },
    executeGenerator: async (_n: string, p: Record<string, unknown>) => { seen.push({ ...p }); },
  };
  const code = codeGenerator.generateExecuteGenerator({ generatorName: name, params } as never);
  const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const r = await new Function('app', `return ${body.trim().replace(/;\s*$/, '')}`)(app);
  return { params: seen[0]!, r };
}

describe('foreground generators default to interactive', () => {
  for (const cat of ['ui', 'infographics', 'captions']) {
    it(`a ${cat} generator runs with interactive: true, and says so`, async () => {
      const { params, r } = await run('drawPhoneFrame', {}, cat);
      expect(params.interactive).toBe(true);
      expect(r.interactive).toBe(true);
      expect(r.interactiveNote).toContain('Pass params.interactive: false');
    });
  }

  it("the caller's false wins", async () => {
    const { params, r } = await run('drawPhoneFrame', { interactive: false }, 'ui');
    expect(params.interactive).toBe(false);
    expect(r.interactiveNote).toBeUndefined();
  });

  it('a background generator is untouched', async () => {
    const { params, r } = await run('drawBokeh', {}, 'backgrounds');
    expect(params.interactive).toBeUndefined();
    expect(r.interactive).toBeUndefined();
  });
});
