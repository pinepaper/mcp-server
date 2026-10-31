/**
 * The server's own MCP layer against the SDK it replaced (the SDK stays a devDependency for exactly this).
 *
 * src/mcp/types.ts copies the SDK schemas that decide bytes on the wire. Two copies that drift agree with nobody, so
 * each is checked against the SDK's own on the same inputs: what is accepted, what comes out, and the error text.
 * The protocol-version list is held equal too, so a new spec version shows up here, not in a client.
 */
import { describe, it, expect } from 'bun:test';
import * as sdk from '@modelcontextprotocol/sdk/types.js';
import * as ours from '../../mcp/types.js';

const outcome = (schema: { safeParse: (v: unknown) => { success: boolean; data?: unknown; error?: { message: string } } }, v: unknown) => {
  const r = schema.safeParse(v);
  return r.success ? { ok: true, data: r.data } : { ok: false, message: r.error!.message };
};

describe('MCP layer parity with @modelcontextprotocol/sdk', () => {
  it('supports the same protocol versions, with the same latest', () => {
    expect(ours.SUPPORTED_PROTOCOL_VERSIONS).toEqual(sdk.SUPPORTED_PROTOCOL_VERSIONS);
    expect(ours.LATEST_PROTOCOL_VERSION).toBe(sdk.LATEST_PROTOCOL_VERSION);
  });

  it('uses the same error codes', () => {
    for (const k of ['ConnectionClosed', 'RequestTimeout', 'ParseError', 'InvalidRequest', 'MethodNotFound', 'InvalidParams', 'InternalError'] as const) {
      expect(ours.ErrorCode[k]).toBe(sdk.ErrorCode[k]);
    }
    expect(new ours.McpError(-32002, 'x', { a: 1 }).message).toBe(new sdk.McpError(-32002, 'x', { a: 1 }).message);
  });

  const results: unknown[] = [
    { content: [{ type: 'text', text: 'hi' }] },
    { content: [{ type: 'text', text: 'hi', extra: 'stripped', annotations: { priority: 0.5 } }], _meta: { 'pinepaper.studio/timing': { totalMs: 3 } }, custom: 1 },
    { content: [{ type: 'image', data: 'aGVsbG8=', mimeType: 'image/png' }, { type: 'text', text: 'x' }], isError: false },
    { content: [{ type: 'image', data: '***not base64***', mimeType: 'image/png' }] },
    { content: [{ type: 'audio', data: 'aGVsbG8=', mimeType: 'audio/wav' }] },
    { content: [{ type: 'resource_link', uri: 'file:///a.mp4', name: 'a.mp4', mimeType: 'video/mp4', size: 10 }] },
    { content: [{ type: 'resource', resource: { uri: 'x://y', text: 't' } }, { type: 'resource', resource: { uri: 'x://z', blob: 'aGk=' } }] },
    { structuredContent: { a: 1 } },
    { content: [{ type: 'text', text: 'x', annotations: { lastModified: 'not a date' } }] },
    { content: [{ type: 'video', data: 'x' }] },
    { content: 'not an array' },
    {},
  ];

  it('normalises tools/call results exactly as the SDK does (strip, default, refuse)', () => {
    for (const r of results) expect(outcome(ours.CallToolResultSchema, r)).toEqual(outcome(sdk.CallToolResultSchema, r));
  });

  const messages: unknown[] = [
    { jsonrpc: '2.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', id: 'a', method: 'tools/call', params: { name: 'x', arguments: { a: 1 }, _meta: { progressToken: 7 } } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 3, reason: 'r' } },
    { jsonrpc: '2.0', id: 1, result: {} },
    { jsonrpc: '2.0', id: 1, error: { code: -1, message: 'm' } },
    { jsonrpc: '2.0', id: 1.5, method: 'ping' },
    { jsonrpc: '1.0', id: 1, method: 'ping' },
    { jsonrpc: '2.0', id: 1, method: 'ping', extra: true },
    { id: 1, method: 'ping' },
    [{ jsonrpc: '2.0', id: 1, method: 'ping' }],
    'ping',
  ];

  it('accepts and refuses the same JSON-RPC messages', () => {
    for (const m of messages) expect(outcome(ours.JSONRPCMessageSchema, m)).toEqual(outcome(sdk.JSONRPCMessageSchema, m));
  });

  const requests: Array<[keyof typeof ours & keyof typeof sdk, unknown]> = [
    ['CallToolRequestSchema', { method: 'tools/call', params: {} }],
    ['CallToolRequestSchema', { method: 'tools/call' }],
    ['CallToolRequestSchema', { method: 'tools/call', params: { name: 'x', arguments: 'no' } }],
    ['CallToolRequestSchema', { method: 'tools/call', params: { name: 'x', arguments: { a: 1 }, _meta: { progressToken: 'p' } } }],
    ['ReadResourceRequestSchema', { method: 'resources/read', params: { uri: 5 } }],
    ['GetPromptRequestSchema', { method: 'prompts/get', params: { name: 'p', arguments: { a: 1 } } }],
    ['SetLevelRequestSchema', { method: 'logging/setLevel', params: { level: 'loud' } }],
    ['SetLevelRequestSchema', { method: 'logging/setLevel', params: { level: 'warning' } }],
    ['InitializeRequestSchema', { method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'c', version: '1' } } }],
    ['InitializeRequestSchema', { method: 'initialize', params: { protocolVersion: '2025-06-18' } }],
    ['ListToolsRequestSchema', { method: 'tools/list' }],
    ['ListToolsRequestSchema', { method: 'tools/list', params: { cursor: 3 } }],
  ];

  it('parses requests with the same result, and fails them with the same message', () => {
    for (const [name, req] of requests) {
      expect(outcome(ours[name] as never, req)).toEqual(outcome(sdk[name] as never, req));
    }
  });
});
