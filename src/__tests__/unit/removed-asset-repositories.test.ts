/**
 * SVGRepo and OpenClipart were removed in 1.6.19: SVGRepo answered every
 * request 429 and OpenClipart's search/json endpoint stopped answering, so
 * both returned nothing. A caller who still names one is told why.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { AssetManager } from '../../assets/index.js';
import { getToolsForVerbosity } from '../../tools/index.js';

const text = (r: any) => r.content.map((c: any) => c.text ?? '').join('');

describe('removed asset repositories', () => {
  it('search refuses svgrepo / openclipart by name, with the reason', async () => {
    for (const repository of ['svgrepo', 'openclipart']) {
      const r = await handleToolCall('pinepaper_search_assets', { query: 'rocket', repository }, {} as never);
      expect(r.isError).toBe(true);
      expect(text(r)).toContain('removed in 1.6.19');
    }
  });

  it('importing one of their ids says why', async () => {
    await expect(new AssetManager({ enableCache: false }).download('svgrepo_rocket_12345')).rejects.toThrow(/removed in 1\.6\.19/);
  });

  it('no description at any level still offers them', () => {
    for (const level of ['verbose', 'compact', 'minimal'] as const) {
      for (const t of getToolsForVerbosity(level)) {
        expect(`${t.name}: ${t.description} ${JSON.stringify(t.inputSchema)}`).not.toMatch(/svgrepo|openclipart/i);
      }
    }
  });
});
