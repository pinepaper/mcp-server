import { describe, expect, it } from 'bun:test';
import { boundedStructured, reportedIgnoredPaths } from '../../tools/reply-fields.js';
import { relationOptionWarning, codeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

const reply = (result: unknown) => ({ content: [{ type: 'text', text: JSON.stringify({ success: true, result }) }] });

describe('reportedIgnoredPaths: what the run reported, as argument paths', () => {
  it('names a relation option on add_relation', () => {
    expect(reportedIgnoredPaths('pinepaper_add_relation', { params: { sped: 2 } }, reply({ ignoredOptions: ['sped'] }))).toEqual(['params.sped']);
  });

  it('names batch options under the op that holds them', () => {
    const args = { operations: [{ type: 'relation' }, { type: 'animate' }] };
    const r = reply({ results: [{ index: 0, result: { ignoredOptions: ['sped'] } }, { index: 1, result: { ignoredOptions: ['x'] } }] });
    expect(reportedIgnoredPaths('pinepaper_agent_batch_execute', args, r)).toEqual(['operations[0].relationOptions.sped', 'operations[1].animationOptions.x']);
  });

  it('counts written ops, not the ops a macro expanded to', () => {
    const args = { operations: [{ type: 'ring' }, { type: 'relation' }] };
    const r = reply({ results: [{ index: 3, result: { ignoredOptions: ['sped'] } }] });
    const expanded = (op: Record<string, unknown>) => (op.type === 'ring' ? 3 : 1);
    expect(reportedIgnoredPaths('pinepaper_agent_batch_execute', args, r, expanded)).toEqual(['operations[1].relationOptions.sped']);
  });

  it('says where a property was written: flat or inside properties', () => {
    const r = reply({ results: [{ index: 0, result: { ignoredProperties: ['a'] } }, { index: 1, result: { ignoredProperties: ['b'] } }] });
    const args = { operations: [{ type: 'create', a: 1 }, { type: 'modify', properties: { b: 1 } }] };
    expect(reportedIgnoredPaths('pinepaper_agent_batch_execute', args, r)).toEqual(['operations[0].a', 'operations[1].properties.b']);
    expect(reportedIgnoredPaths('pinepaper_modify_item', { properties: { c: 1 } }, reply({ ignoredProperties: ['c'] }))).toEqual(['properties.c']);
  });

  it('reads each batch tool in its own reply shape', () => {
    expect(reportedIgnoredPaths('pinepaper_batch_create', {}, reply({ items: [{ index: 1, ignoredProperties: ['o'] }] }))).toEqual(['items[1].params.o']);
    const mods = { modifications: [{ itemId: 'a' }, { itemId: 'b' }] };
    expect(reportedIgnoredPaths('pinepaper_batch_modify', mods, reply({ ignoredProperties: [{ itemId: 'b', ignoredProperties: ['o'] }] }))).toEqual(['modifications[1].params.o']);
    expect(reportedIgnoredPaths('pinepaper_create_scene', {}, reply({ ignoredOptions: ['relations[1].params.sped'] }))).toEqual(['relations[1].params.sped']);
  });

  it('reports nothing from a reply that is not JSON', () => {
    expect(reportedIgnoredPaths('pinepaper_add_relation', {}, { content: [{ type: 'text', text: 'Export saved to file' }] })).toEqual([]);
  });
});

describe('a relation loop parameter is read on every relation', () => {
  it('does not call window and its relatives ignored', () => {
    expect(relationOptionWarning('points_at', { window: { start: 0 }, startTime: 0, endTime: 1, autoRemove: true, paramKeyframes: [] })).toBeNull();
  });

  it('still names a misspelt option', () => {
    expect(relationOptionWarning('points_at', { sped: 2 })).toContain('does not read sped');
  });

  it('create_scene reports a relation option by its index, as add_relation does', () => {
    const code = codeGenerator.generateCreateScene({
      items: [{ name: 'p', itemType: 'circle', position: { x: 0, y: 0 } }, { name: 'q', itemType: 'circle', position: { x: 9, y: 9 } }],
      relations: [{ source: 'p', target: 'q', type: 'points_at', params: { smoothing: 1 } }, { source: 'q', target: 'p', type: 'points_at', params: { sped: 2 } }],
    } as never);
    expect(code).toContain("'relations[1].params.' + k");
    expect(code).toContain('ignoredOptions: ["sped"]');
  });
});

describe('boundedStructured', () => {
  it('leaves a small object whole, without its undefined fields', () => {
    expect(boundedStructured({ a: 1, data: undefined })).toEqual({ a: 1 });
  });

  it('over the cap, keeps the fields and names the long string it left out', () => {
    expect(boundedStructured({ studioBuild: 'b', result: { html: 'x'.repeat(40_000), ok: true } })).toEqual({ studioBuild: 'b', result: { ok: true }, textOnly: ['result.html'] });
  });

  it('gives no structured copy when short values alone are over the cap', () => {
    expect(boundedStructured({ many: Array.from({ length: 5_000 }, (_, i) => `item-${i}`) })).toBeUndefined();
  });
});

describe('studioBuild on what renders', () => {
  const controller = (buildId: unknown) => {
    const calls: string[] = [];
    return { calls, connected: true, executeCode: async (code: string) => { calls.push(code); return code.includes('app.buildId ?') ? { success: true, result: buildId } : { success: true, result: { success: true, frameCount: 1 } }; } };
  };
  const run = (tool: string, c: unknown) => handleToolCall(tool, { times: [0] }, { executeInBrowser: true, executionMode: 'puppeteer', browserController: c } as never);

  it('is added to a reply the studio rendered', async () => {
    const r = await run('pinepaper_capture_frames', controller('0.5.4+abc'));
    expect(JSON.parse((r.content![0] as { text: string }).text).studioBuild).toBe('0.5.4+abc');
  });

  it('is left out on a studio with no build id', async () => {
    const r = await run('pinepaper_capture_frames', controller(null));
    expect(JSON.parse((r.content![0] as { text: string }).text).studioBuild).toBeUndefined();
  });

  it('is not asked for by a tool that renders nothing', async () => {
    const c = controller('b');
    await handleToolCall('pinepaper_get_items', {}, { executeInBrowser: true, executionMode: 'puppeteer', browserController: c } as never);
    expect(c.calls.some((x) => x.includes('app.buildId ?'))).toBe(false);
  });
});
