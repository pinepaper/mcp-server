/**
 * Round 7 (lanes X / Z / AA) MCP fixes, run against stub studios.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const runIIFE = (code: string, globals: Record<string, unknown>) =>
  new Function(...Object.keys(globals), code.replace(/\((async )?function\(\)/, (m) => `return ${m}`))(...Object.values(globals));

describe('template_params apply names undeclared params (1.52)', () => {
  const app = (declared: string[]) => ({
    getTemplateParams: async () => ({ ok: true, params: declared.map((name) => ({ name })) }),
    applyTemplateWithParams: () => true,
  });

  it('a template that declares nothing says the params changed nothing', async () => {
    const r = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 'sale-announcement', params: { headline: 'X', date: 'Y' } } as never), { app: app([]) });
    expect(r.success).toBe(true);
    expect(r.ignoredParams).toEqual(['headline', 'date']);
    expect(r.warning).toContain('declares no parameters');
  });

  it('names only the undeclared ones, and is quiet when all are declared', async () => {
    const some = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 't', params: { title: 'a', nope: 1 } } as never), { app: app(['title']) });
    expect(some.ignoredParams).toEqual(['nope']);
    const all = await runIIFE(codeGenerator.generateTemplateParams({ action: 'apply', templateId: 't', params: { title: 'a' } } as never), { app: app(['title']) });
    expect(all.ignoredParams).toBeUndefined();
  });
});
