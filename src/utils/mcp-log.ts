/**
 * MCP logging (notifications/message): events the agent's HOST should see
 * but that belong in no single tool result, such as a browser session lost
 * and relaunched between calls.
 *
 * Before this, the server declared no logging capability and every such event
 * went to console.error, which an MCP client never shows. The server registers
 * itself here at start; the SDK applies the client's logging/setLevel filter.
 * With no server registered (tests, CLI), this is a no-op.
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

type Level = 'debug' | 'info' | 'notice' | 'warning' | 'error';

let server: Server | null = null;

export function setLogServer(s: Server | null): void {
  server = s;
}

export function mcpLog(level: Level, data: string | Record<string, unknown>): void {
  if (!server) return;
  server.sendLoggingMessage({ level, logger: 'pinepaper', data }).catch(() => { /* client gone or not initialised */ });
}
