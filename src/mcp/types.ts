/**
 * MCP types and wire schemas — the part of the protocol this server speaks.
 *
 * WHY THIS EXISTS (1.6.25): the server used @modelcontextprotocol/sdk for its
 * Server, its stdio transport and these types. That one dependency was ~75 of
 * the package's 78 runtime packages (an HTTP server stack this stdio server
 * never runs), and it set the ceiling on the package's supply-chain score. This
 * server answers eight methods over stdio, so it now carries exactly that.
 *
 * The SCHEMAS below are copies of SDK 1.32.1's, kept to what this server reads
 * and sends, because they decide bytes on the wire: a request is parsed with
 * them (a failure answers -32603 with zod's issue list, as the SDK did), and a
 * tools/call result is normalised by CallToolResultSchema (unknown keys on a
 * content block are stripped, a missing content becomes []). The SDK stays a
 * devDependency, and mcp-sdk-parity.test.ts holds these to its own schemas and
 * protocol-version list, so a copy that drifts fails a test rather than a client.
 */
import { z } from 'zod';

// ── Protocol versions ───────────────────────────────────────────────────────

export const LATEST_PROTOCOL_VERSION = '2025-11-25';
export const SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07'];
export const JSONRPC_VERSION = '2.0';

// ── Errors ──────────────────────────────────────────────────────────────────

export enum ErrorCode {
  ConnectionClosed = -32000,
  RequestTimeout = -32001,
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
}

/** An error with a JSON-RPC code. Its message carries the code, as the SDK's did ("MCP error -32002: …"). */
export class McpError extends Error {
  constructor(public readonly code: number, message: string, public readonly data?: unknown) {
    super(`MCP error ${code}: ${message}`);
    this.name = 'McpError';
  }
}

// ── Shared pieces ───────────────────────────────────────────────────────────

const ProgressTokenSchema = z.union([z.string(), z.number().int()]);
export const RequestIdSchema = z.union([z.string(), z.number().int()]);
export type RequestId = z.infer<typeof RequestIdSchema>;

const RequestMetaSchema = z.looseObject({
  progressToken: ProgressTokenSchema.optional(),
  'io.modelcontextprotocol/related-task': z.object({ taskId: z.string() }).optional(),
});
const BaseRequestParamsSchema = z.object({ _meta: RequestMetaSchema.optional() });

export const LoggingLevelSchema = z.enum(['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency']);
export type LoggingLevel = z.infer<typeof LoggingLevelSchema>;

// ── JSON-RPC envelopes (an inbound line that is none of these is dropped) ────

const RequestShape = { method: z.string(), params: BaseRequestParamsSchema.loose().optional() };
const NotificationShape = { method: z.string(), params: z.object({ _meta: RequestMetaSchema.optional() }).loose().optional() };
const ResultSchema = z.looseObject({ _meta: RequestMetaSchema.optional() });

export const JSONRPCRequestSchema = z.object({ jsonrpc: z.literal(JSONRPC_VERSION), id: RequestIdSchema, ...RequestShape }).strict();
export const JSONRPCNotificationSchema = z.object({ jsonrpc: z.literal(JSONRPC_VERSION), ...NotificationShape }).strict();
const JSONRPCResultResponseSchema = z.object({ jsonrpc: z.literal(JSONRPC_VERSION), id: RequestIdSchema, result: ResultSchema }).strict();
const JSONRPCErrorResponseSchema = z.object({
  jsonrpc: z.literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: z.object({ code: z.number().int(), message: z.string(), data: z.unknown().optional() }),
}).strict();
export const JSONRPCMessageSchema = z.union([JSONRPCRequestSchema, JSONRPCNotificationSchema, JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);

export type JSONRPCRequest = z.infer<typeof JSONRPCRequestSchema>;
export type JSONRPCNotification = z.infer<typeof JSONRPCNotificationSchema>;
export type JSONRPCMessage = z.infer<typeof JSONRPCMessageSchema>;

// ── Requests this server answers ────────────────────────────────────────────

const ImplementationSchema = z.looseObject({ name: z.string(), version: z.string(), title: z.string().optional() });
export type Implementation = z.infer<typeof ImplementationSchema>;

const request = <M extends string, P extends z.ZodTypeAny>(method: M, params: P) => z.object({ method: z.literal(method), params });
const paginated = <M extends string>(method: M) => request(method, BaseRequestParamsSchema.extend({ cursor: z.string().optional() }).optional());

export const InitializeRequestSchema = request('initialize', BaseRequestParamsSchema.extend({
  protocolVersion: z.string(),
  capabilities: z.looseObject({}),
  clientInfo: ImplementationSchema,
}));
export const PingRequestSchema = request('ping', BaseRequestParamsSchema.loose().optional());
export const SetLevelRequestSchema = request('logging/setLevel', BaseRequestParamsSchema.extend({ level: LoggingLevelSchema }));
export const ListToolsRequestSchema = paginated('tools/list');
export const CallToolRequestSchema = request('tools/call', BaseRequestParamsSchema.extend({
  name: z.string(),
  arguments: z.record(z.string(), z.unknown()).optional(),
  task: z.object({ ttl: z.number().optional() }).optional(),
}));
export const ListResourcesRequestSchema = paginated('resources/list');
export const ReadResourceRequestSchema = request('resources/read', BaseRequestParamsSchema.extend({ uri: z.string() }));
export const ListPromptsRequestSchema = paginated('prompts/list');
export const GetPromptRequestSchema = request('prompts/get', BaseRequestParamsSchema.extend({
  name: z.string(),
  arguments: z.record(z.string(), z.string()).optional(),
}));

export const CancelledNotificationSchema = z.object({
  method: z.literal('notifications/cancelled'),
  params: z.object({ requestId: RequestIdSchema.optional(), reason: z.string().optional() }).loose(),
});

/** A request schema this server can register: an object with a literal `method`. */
export type RequestSchema = z.ZodObject<{ method: z.ZodLiteral<string>; params: z.ZodTypeAny }>;

// ── Content and the tools/call result (normalised before it is sent) ────────

const Base64Schema = z.string().refine((val) => {
  try { atob(val); return true; } catch { return false; }
}, { message: 'Invalid Base64 string' });
const AnnotationsSchema = z.object({
  audience: z.array(z.enum(['user', 'assistant'])).optional(),
  priority: z.number().min(0).max(1).optional(),
  lastModified: z.iso.datetime({ offset: true }).optional(),
});
const MetaSchema = z.record(z.string(), z.unknown());
const IconSchema = z.object({ src: z.string(), mimeType: z.string().optional(), sizes: z.array(z.string()).optional(), theme: z.enum(['light', 'dark']).optional() });

export const TextContentSchema = z.object({ type: z.literal('text'), text: z.string(), annotations: AnnotationsSchema.optional(), _meta: MetaSchema.optional() });
export const ImageContentSchema = z.object({ type: z.literal('image'), data: Base64Schema, mimeType: z.string(), annotations: AnnotationsSchema.optional(), _meta: MetaSchema.optional() });
export const AudioContentSchema = z.object({ type: z.literal('audio'), data: Base64Schema, mimeType: z.string(), annotations: AnnotationsSchema.optional(), _meta: MetaSchema.optional() });
const ResourceContentsSchema = z.object({ uri: z.string(), mimeType: z.optional(z.string()), _meta: MetaSchema.optional() });
export const EmbeddedResourceSchema = z.object({
  type: z.literal('resource'),
  resource: z.union([ResourceContentsSchema.extend({ text: z.string() }), ResourceContentsSchema.extend({ blob: Base64Schema })]),
  annotations: AnnotationsSchema.optional(),
  _meta: MetaSchema.optional(),
});
export const ResourceLinkSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  icons: z.array(IconSchema).optional(),
  uri: z.string(),
  description: z.optional(z.string()),
  mimeType: z.optional(z.string()),
  size: z.optional(z.number()),
  annotations: AnnotationsSchema.optional(),
  _meta: z.optional(z.looseObject({})),
  type: z.literal('resource_link'),
});
export const ContentBlockSchema = z.union([TextContentSchema, ImageContentSchema, AudioContentSchema, ResourceLinkSchema, EmbeddedResourceSchema]);

export const CallToolResultSchema = ResultSchema.extend({
  content: z.array(ContentBlockSchema).default([]),
  structuredContent: z.record(z.string(), z.unknown()).optional(),
  isError: z.boolean().optional(),
});

export type TextContent = z.infer<typeof TextContentSchema>;
export type ImageContent = z.infer<typeof ImageContentSchema>;
export type AudioContent = z.infer<typeof AudioContentSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type CallToolResult = z.infer<typeof CallToolResultSchema>;

// ── Tool definitions (what tools/list returns) ──────────────────────────────

export interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
}

export interface Tool {
  name: string;
  title?: string;
  description?: string;
  inputSchema: { type: 'object'; properties?: Record<string, object>; required?: string[]; [key: string]: unknown };
  outputSchema?: { type: 'object'; properties?: Record<string, object>; required?: string[]; [key: string]: unknown };
  annotations?: ToolAnnotations;
  icons?: Array<z.infer<typeof IconSchema>>;
  execution?: Record<string, unknown>;
  _meta?: Record<string, unknown>;
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, never>;
  [key: string]: unknown;
}
