/**
 * The MCP layer's behaviours that the wire recordings cannot stage on a timer: a
 * cancelled request answers nothing, and logging/setLevel filters what is sent.
 * Both are the SDK's rules (see src/mcp/server.ts).
 */
import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { Server, type Transport } from '../../mcp/index.js';
import type { JSONRPCMessage } from '../../mcp/types.js';

function pair(server: Server) {
  const sent: JSONRPCMessage[] = [];
  const transport: Transport = { start: async () => {}, close: async () => {}, send: async (m) => { sent.push(m); } };
  return { sent, transport, deliver: (m: unknown) => transport.onmessage!(m as JSONRPCMessage) };
}
const tick = (ms = 10) => new Promise((r) => setTimeout(r, ms));
const SlowSchema = z.object({ method: z.literal('slow/thing'), params: z.object({}).loose().optional() });

describe('src/mcp Server', () => {
  it('a cancelled request sends no response, and its handler sees the abort', async () => {
    const server = new Server({ name: 't', version: '1' });
    let aborted = false;
    server.setRequestHandler(SlowSchema, async (_r, extra) => {
      await new Promise((r) => extra.signal.addEventListener('abort', r));
      aborted = true;
      return { done: true };
    });
    const { sent, transport, deliver } = pair(server);
    await server.connect(transport);
    deliver({ jsonrpc: '2.0', id: 9, method: 'slow/thing' });
    await tick();
    deliver({ jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 9, reason: 'user' } });
    await tick();
    expect(aborted).toBe(true);
    expect(sent).toEqual([]);
  });

  it('logging/setLevel drops messages below the level; with none set, all are sent', async () => {
    const server = new Server({ name: 't', version: '1' }, { capabilities: { logging: {} } });
    const { sent, transport, deliver } = pair(server);
    await server.connect(transport);
    await server.sendLoggingMessage({ level: 'debug', data: 'a' });
    deliver({ jsonrpc: '2.0', id: 1, method: 'logging/setLevel', params: { level: 'warning' } });
    await tick();
    await server.sendLoggingMessage({ level: 'info', data: 'b' });
    await server.sendLoggingMessage({ level: 'error', data: 'c' });
    expect(sent.map((m) => (m as { params?: { data?: string } }).params?.data ?? (m as { result?: unknown }).result)).toEqual(['a', {}, 'c']);
  });

  it('a server without the logging capability sends no log messages and does not answer setLevel', async () => {
    const server = new Server({ name: 't', version: '1' });
    const { sent, transport, deliver } = pair(server);
    await server.connect(transport);
    await server.sendLoggingMessage({ level: 'error', data: 'x' });
    deliver({ jsonrpc: '2.0', id: 1, method: 'logging/setLevel', params: { level: 'warning' } });
    await tick();
    expect(sent).toEqual([{ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'Method not found' } }]);
  });

  it('a tools/call result that does not fit is refused, not sent', async () => {
    const server = new Server({ name: 't', version: '1' });
    const { CallToolRequestSchema } = await import('../../mcp/types.js');
    server.setRequestHandler(CallToolRequestSchema, () => ({ content: 'nope' }));
    const { sent, transport, deliver } = pair(server);
    await server.connect(transport);
    deliver({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'x' } });
    await tick();
    const err = (sent[0] as { error: { code: number; message: string } }).error;
    expect(err.code).toBe(-32602);
    expect(err.message).toContain('Invalid tools/call result');
  });
});
