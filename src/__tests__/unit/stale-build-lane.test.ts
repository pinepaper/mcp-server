/**
 * #40: a studio on an old build warned on every export to start a new job, which the lane does not have. Starting
 * over (clear_canvas) now loads the live build first, and the warning names a step every toolkit has.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';

function fakeController(stale: boolean) {
  const calls: string[] = [];
  return {
    calls,
    connected: true,
    async reloadIfStale() { calls.push('reloadIfStale'); return stale ? { fromBuild: 'old1', toBuild: 'new2' } : null; },
    async executeCode() { calls.push('executeCode'); return { success: true, result: { success: true } }; },
  };
}

describe('clear_canvas loads the live build when the studio is stale', () => {
  it('reloads before clearing and says so', async () => {
    const c = fakeController(true);
    const r = await handleToolCall('pinepaper_clear_canvas', {}, { executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' });
    const text = (r.content ?? []).map((x) => ('text' in x ? x.text : '')).join('');
    expect(c.calls[0]).toBe('reloadIfStale');
    expect(c.calls).toContain('executeCode');
    expect(text).toContain('reloaded to the live build new2');
  });

  it('on the live build, it only clears', async () => {
    const c = fakeController(false);
    const r = await handleToolCall('pinepaper_clear_canvas', {}, { executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' });
    const text = (r.content ?? []).map((x) => ('text' in x ? x.text : '')).join('');
    expect(text).not.toContain('reloaded');
  });

  it('the export warning names clear_canvas, not only start_job', () => {
    const code = codeGenerator.generateAgentExport({ format: 'mp4', duration: 1 } as never);
    expect(code).toContain('pinepaper_clear_canvas (or pinepaper_agent_start_job) loads the live build');
  });
});
