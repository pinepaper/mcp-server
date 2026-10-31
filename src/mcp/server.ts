/**
 * The MCP server: JSON-RPC dispatch over one transport (see types.ts for why
 * this is not @modelcontextprotocol/sdk any more).
 *
 * The behaviour is the SDK's (1.32.1), copied rule for rule, because clients
 * were built against it; mcp-wire-golden.test.ts holds the frames to recordings
 * made from the SDK server:
 *   - initialize answers the client's protocolVersion when it is supported, the
 *     latest otherwise; initialization is not enforced (ping before it works);
 *   - a request is parsed with its schema; a failure answers -32603 with zod's
 *     message, an McpError answers its own code, an unknown method -32601;
 *   - notifications/cancelled aborts that request's signal, and a cancelled
 *     request sends no response at all;
 *   - tools/call results are normalised by CallToolResultSchema (a result that
 *     does not fit answers -32602 "Invalid tools/call result");
 *   - logging/setLevel drops messages below the level; none set sends all.
 *
 * The method names match the SDK Server's (setRequestHandler, oninitialized,
 * getClientVersion, sendToolListChanged, sendLoggingMessage, connect), and
 * connect() takes any transport of the SDK's shape, so a caller that passes the
 * SDK's own StdioServerTransport still works.
 */
import { z } from 'zod';
import {
  CallToolRequestSchema, CallToolResultSchema, CancelledNotificationSchema, ErrorCode, InitializeRequestSchema,
  JSONRPCNotificationSchema, JSONRPCRequestSchema, JSONRPC_VERSION, LATEST_PROTOCOL_VERSION, LoggingLevelSchema, McpError,
  PingRequestSchema, SetLevelRequestSchema, SUPPORTED_PROTOCOL_VERSIONS,
  type Implementation, type JSONRPCMessage, type JSONRPCNotification, type JSONRPCRequest, type LoggingLevel,
  type RequestId, type RequestSchema, type ServerCapabilities,
} from './types.js';

/** A message transport of the SDK's shape (start/send/close and the three callbacks). */
export interface Transport {
  start(): Promise<void>;
  send(message: JSONRPCMessage): Promise<void>;
  close(): Promise<void>;
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;
  sessionId?: string;
}

export interface Notification { method: string; params?: Record<string, unknown> }

/** What a request handler gets beside the request. */
export interface RequestHandlerExtra {
  signal: AbortSignal;
  requestId: RequestId;
  sessionId?: string;
  _meta?: Record<string, unknown>;
  /** A notification tied to this request; dropped once the request is cancelled. */
  sendNotification: (notification: Notification) => Promise<void>;
}

type Handler = (request: JSONRPCRequest, extra: RequestHandlerExtra) => Promise<unknown>;

export interface ServerOptions {
  capabilities?: ServerCapabilities;
  instructions?: string;
}

const LOG_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));

export class Server {
  private transport?: Transport;
  // _requestHandlers and _capabilities keep the SDK Server's field names: server-spec.test.ts reads them, and kept
  // unchanged, those tests check this server the way they checked the SDK's.
  private readonly _requestHandlers = new Map<string, Handler>();
  private readonly inFlight = new Map<RequestId, AbortController>();
  private clientVersion?: Implementation;
  private clientCapabilities?: Record<string, unknown>;
  private logLevel?: LoggingLevel;
  private readonly _capabilities: ServerCapabilities;
  private readonly instructions?: string;

  /** Called once the client sends notifications/initialized. */
  oninitialized?: () => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  constructor(private readonly serverInfo: Implementation & Record<string, unknown>, options: ServerOptions = {}) {
    this._capabilities = options.capabilities ?? {};
    this.instructions = options.instructions;
    this.setRequestHandler(InitializeRequestSchema, (request) => this.initialize(request));
    this.setRequestHandler(PingRequestSchema, () => ({}));
    if (this._capabilities.logging) {
      this.setRequestHandler(SetLevelRequestSchema, (request) => { this.logLevel = request.params.level; return {}; });
    }
  }

  /** Answer `schema`'s method. The request is parsed with the schema first; tools/call results are normalised. */
  setRequestHandler<S extends RequestSchema>(schema: S, handler: (request: z.infer<S>, extra: RequestHandlerExtra) => unknown | Promise<unknown>): void {
    const method = schema.shape.method.value;
    // The order is the SDK's: the method's own schema first (a failure is zod's error, -32603), then, for tools/call,
    // the call schema and the result normalisation (-32602).
    this._requestHandlers.set(method, async (request, extra) => {
      const parsed = schema.parse(request) as z.infer<S>;
      if (method !== 'tools/call') return handler(parsed, extra);
      const valid = CallToolRequestSchema.safeParse(request);
      if (!valid.success) throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call request: ${valid.error.message}`);
      const result = CallToolResultSchema.safeParse(await handler(parsed, extra));
      if (!result.success) throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call result: ${result.error.message}`);
      return result.data;
    });
  }

  getClientVersion(): Implementation | undefined { return this.clientVersion; }
  getClientCapabilities(): Record<string, unknown> | undefined { return this.clientCapabilities; }

  async connect(transport: Transport): Promise<void> {
    this.transport = transport;
    transport.onclose = () => this.closed();
    transport.onerror = (error) => this.onerror?.(error);
    transport.onmessage = (message) => this.receive(message);
    await transport.start();
  }

  async close(): Promise<void> { await this.transport?.close(); }

  async sendToolListChanged(): Promise<void> {
    await this.notification({ method: 'notifications/tools/list_changed' });
  }

  async sendLoggingMessage(params: { level: LoggingLevel; logger?: string; data: unknown }): Promise<void> {
    if (!this._capabilities.logging) return;
    if (this.logLevel && (LOG_SEVERITY.get(params.level) ?? 0) < (LOG_SEVERITY.get(this.logLevel) ?? 0)) return;
    await this.notification({ method: 'notifications/message', params });
  }

  async notification(notification: Notification): Promise<void> {
    if (!this.transport) throw new Error('Not connected');
    await this.transport.send({ jsonrpc: JSONRPC_VERSION, ...notification } as JSONRPCMessage);
  }

  private initialize(request: z.infer<typeof InitializeRequestSchema>) {
    const requested = request.params.protocolVersion;
    this.clientCapabilities = request.params.capabilities;
    this.clientVersion = request.params.clientInfo;
    return {
      protocolVersion: SUPPORTED_PROTOCOL_VERSIONS.includes(requested) ? requested : LATEST_PROTOCOL_VERSION,
      capabilities: this._capabilities,
      serverInfo: this.serverInfo,
      ...(this.instructions && { instructions: this.instructions }),
    };
  }

  private receive(message: JSONRPCMessage): void {
    const asRequest = JSONRPCRequestSchema.safeParse(message);
    if (asRequest.success) { this.request(asRequest.data); return; }
    const asNotification = JSONRPCNotificationSchema.safeParse(message);
    if (asNotification.success) { this.notified(asNotification.data); return; }
    // A response: this server sends no requests, so there is nothing waiting for one.
  }

  private notified(notification: JSONRPCNotification): void {
    if (notification.method === 'notifications/initialized') { this.oninitialized?.(); return; }
    if (notification.method === 'notifications/cancelled') {
      const parsed = CancelledNotificationSchema.safeParse(notification);
      const id = parsed.success ? parsed.data.params.requestId : undefined;
      if (id !== undefined) this.inFlight.get(id)?.abort(parsed.success ? parsed.data.params.reason : undefined);
    }
    // Any other notification needs nothing from this server.
  }

  private request(request: JSONRPCRequest): void {
    const transport = this.transport;
    const handler = this._requestHandlers.get(request.method);
    if (!handler) {
      transport?.send({ jsonrpc: JSONRPC_VERSION, id: request.id, error: { code: ErrorCode.MethodNotFound, message: 'Method not found' } })
        .catch((error) => this.onerror?.(new Error(`Failed to send an error response: ${error}`)));
      return;
    }
    const controller = new AbortController();
    this.inFlight.set(request.id, controller);
    const extra: RequestHandlerExtra = {
      signal: controller.signal,
      requestId: request.id,
      sessionId: transport?.sessionId,
      _meta: request.params?._meta as Record<string, unknown> | undefined,
      sendNotification: async (notification) => { if (!controller.signal.aborted) await this.notification(notification); },
    };
    Promise.resolve()
      .then(() => handler(request, extra))
      .then(
        async (result) => {
          if (controller.signal.aborted) return;
          await transport?.send({ result, jsonrpc: JSONRPC_VERSION, id: request.id } as JSONRPCMessage);
        },
        async (error: unknown) => {
          if (controller.signal.aborted) return;
          const e = error as { code?: unknown; message?: string; data?: unknown };
          await transport?.send({
            jsonrpc: JSONRPC_VERSION,
            id: request.id,
            error: {
              code: Number.isSafeInteger(e?.code) ? (e.code as number) : ErrorCode.InternalError,
              message: e?.message ?? 'Internal error',
              ...(e?.data !== undefined && { data: e.data }),
            },
          } as JSONRPCMessage);
        },
      )
      .catch((error) => this.onerror?.(new Error(`Failed to send response: ${error}`)))
      .finally(() => { if (this.inFlight.get(request.id) === controller) this.inFlight.delete(request.id); });
  }

  private closed(): void {
    for (const controller of this.inFlight.values()) controller.abort(new McpError(ErrorCode.ConnectionClosed, 'Connection closed'));
    this.inFlight.clear();
    this.transport = undefined;
    this.onclose?.();
  }
}
