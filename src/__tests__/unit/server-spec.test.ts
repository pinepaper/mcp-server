/**
 * MCP spec gaps from the MCPA review (mcp-cloud docs/BACKLOG.md, 2026-09-27):
 * logging, the resource-not-found code, bounded structuredContent, progress
 * while a tool runs, and cancellation.
 */
import { describe, it, expect } from 'bun:test';
import { createServer } from '../../index.js';
import { startProgress } from '../../utils/progress.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

describe('MCP Spec Gaps (MCPA Domains)', () => {
  it('declares logging capability in server capabilities', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const capabilities = (server as any)._capabilities;
    expect(capabilities.logging).toBeDefined();
  });

  it('an unknown resource URI is the spec\'s resource-not-found error (-32002)', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const readHandler = (server as any)._requestHandlers.get('resources/read');
    expect(readHandler).toBeDefined();

    try {
      await readHandler({
        method: 'resources/read',
        params: { uri: 'pinepaper://docs/non-existent' },
      });
      expect(true).toBe(false); // Should not reach here
    } catch (err: any) {
      expect(err).toBeInstanceOf(McpError);
      expect(err.code).toBe(-32002);
      expect(err.message).toContain('Resource not found');
    }
  });

  it('populates structuredContent on tool call results when JSON is returned', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const callHandler = (server as any)._requestHandlers.get('tools/call');
    expect(callHandler).toBeDefined();

    const result = await callHandler({
      method: 'tools/call',
      params: {
        name: 'pinepaper_design_system',
        arguments: { action: 'list_styles' },
      },
    });

    expect(result).toBeDefined();
    expect(result.structuredContent).toBeDefined();
    expect(typeof result.structuredContent).toBe('object');
    expect((result.structuredContent as any).styles).toBeDefined();
  });

  it('progress is reported WHILE a call runs, always increasing, with the export percent when there is one', async () => {
    const sent: Array<{ progress: number; message: string }> = [];
    let t = 0;
    let exporting: { percent: number } | null = null;
    const stop = startProgress({
      progressToken: 'tok',
      send: async (n) => { sent.push(n.params); },
      intervalMs: 5,
      label: 'pinepaper_agent_export',
      status: async () => exporting,
      now: () => t,
    });
    await new Promise((r) => setTimeout(r, 18));
    exporting = { percent: 42.4 };
    t = 7000;
    await new Promise((r) => setTimeout(r, 18));
    stop();
    const count = sent.length;
    await new Promise((r) => setTimeout(r, 15));
    expect(sent.length).toBe(count); // nothing after stop
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < sent.length; i++) expect(sent[i].progress).toBeGreaterThan(sent[i - 1].progress);
    expect(sent[0].message).toContain('working');
    expect(sent[sent.length - 1].message).toBe('exporting: 42%');
  });

  it('a large JSON result is not repeated as structuredContent', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const callHandler = (server as any)._requestHandlers.get('tools/call');
    const result = await callHandler({ method: 'tools/call', params: { name: 'pinepaper_get_available_easings', arguments: {} } }, {});
    const text = result.content[0].text as string;
    if (text.length > 16_384) expect(result.structuredContent).toBeUndefined();
  });

  it('rejects tool call when request is aborted via signal', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const callHandler = (server as any)._requestHandlers.get('tools/call');
    expect(callHandler).toBeDefined();

    const controller = new AbortController();
    controller.abort();

    try {
      await callHandler(
        {
          method: 'tools/call',
          params: {
            name: 'pinepaper_design_system',
            arguments: { action: 'list_styles' },
          },
        },
        { signal: controller.signal }
      );
      expect(true).toBe(false);
    } catch (err: any) {
      expect(err).toBeInstanceOf(McpError);
      expect(err.code).toBe(ErrorCode.RequestTimeout);
      expect(err.message).toContain('cancelled');
    }
  });

  it('every result carries where its time went, in _meta, not in the text (O1)', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code' });
    const callHandler = (server as any)._requestHandlers.get('tools/call');
    const result = await callHandler({ method: 'tools/call', params: { name: 'pinepaper_design_system', arguments: { action: 'list_styles' } } }, {});
    const t = result._meta?.['pinepaper.studio/timing'];
    expect(typeof t?.toolMs).toBe('number');
    expect(t.toolMs).toBeGreaterThanOrEqual(0);
    expect(JSON.stringify(result.content)).not.toContain('pinepaper.studio/timing');
  });
});
