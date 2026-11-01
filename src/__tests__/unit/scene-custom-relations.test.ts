/**
 * #37: custom relation definitions travel with a saved scene; on import they are registered only when asked, since
 * their compute and apply bodies are code that runs in the studio.
 */
import { describe, it, expect } from 'bun:test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { handleToolCall, getExportDir, CUSTOM_RELATION_NAMES } from '../../tools/handlers.js';

const doc = {
  kind: 'pinepaper.project', formatVersion: '1.0.0', items: [],
  mcpCustomRelations: [{ name: 'wave_t', params: {}, computeFunction: 'return {y: 1};', applyFunction: 'item.position.y = computed.y;' }],
};

function fileWith(d: unknown): string {
  const dir = getExportDir();
  mkdirSync(dir, { recursive: true });
  const p = join(dir, `scene-cr-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  writeFileSync(p, JSON.stringify(d));
  return p;
}
function controller() {
  const codes: string[] = [];
  return { codes, connected: true, connect: async () => undefined,
    executeCode: async (code: string) => { codes.push(code); return { success: true, result: { success: true } }; } };
}
const text = (r: { content?: Array<{ text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('');

describe('import_scene and custom relations', () => {
  it('without the flag: named, not registered, scene still loads', async () => {
    const c = controller();
    const r = await handleToolCall('pinepaper_import_scene', { path: fileWith(doc) }, { executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' });
    expect(text(r as never)).toContain('custom relation definitions (wave_t) that were NOT registered');
    expect(c.codes.some((x) => x.includes('registerRelationRule'))).toBe(false);
  });

  it('with registerCustomRelations: registered before the load, and known to the batch', async () => {
    const c = controller();
    const r = await handleToolCall('pinepaper_import_scene', { path: fileWith(doc), registerCustomRelations: true }, { executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' });
    expect(text(r as never)).toContain('custom relations registered first: wave_t');
    const reg = c.codes.findIndex((x) => x.includes('registerRelationRule("wave_t"'));
    expect(reg).toBeGreaterThanOrEqual(0);
    expect(reg).toBeLessThan(c.codes.length - 1);
    expect(CUSTOM_RELATION_NAMES.has('wave_t')).toBe(true);
  });
});
