/**
 * PinePaper Browser Bridge
 *
 * postMessage interface for communication between PinePaper Studio (iframe/window)
 * and the MCP server or external clients.
 *
 * This bridge enables:
 * 1. Direct browser-to-PinePaper communication (no MCP required)
 * 2. MCP server to PinePaper communication via postMessage relay
 * 3. Cross-origin iframe communication for embedded PinePaper
 */

// =============================================================================
// TYPES
// =============================================================================

export interface BridgeMessage {
  type: 'mcp-request' | 'mcp-response' | 'execute-code' | 'code-result' | 'ping' | 'pong';
  id: string;
  payload: unknown;
  source: 'mcp-bridge' | 'pinepaper-studio';
}

export interface BridgeConfig {
  targetOrigin: string;
  targetWindow?: Window;
  timeout?: number;
  onReady?: () => void;
  onError?: (error: Error) => void;
}

export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

// =============================================================================
// BROWSER BRIDGE CLASS
// =============================================================================

/**
 * PinePaper Browser Bridge
 *
 * Provides a postMessage-based interface for communicating with PinePaper Studio.
 * Can be used standalone in the browser or integrated with an MCP server.
 */
export class PinePaperBridge {
  private config: Required<BridgeConfig>;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private isReady = false;
  private readyPromise: Promise<void>;
  private readyResolve!: () => void;
  private messageHandler: (event: MessageEvent) => void;

  constructor(config: BridgeConfig) {
    this.config = {
      targetWindow: window.parent,
      timeout: 30000,
      onReady: () => {},
      onError: () => {},
      ...config,
    };

    this.readyPromise = new Promise((resolve) => {
      this.readyResolve = resolve;
    });

    // Bind message handler
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);

    // Send initial ping
    this.ping();
  }

  /**
   * Wait for the bridge to be ready
   */
  async waitForReady(): Promise<void> {
    return this.readyPromise;
  }

  /**
   * Check if bridge is connected
   */
  get connected(): boolean {
    return this.isReady;
  }

  /**
   * Send a ping to establish connection
   */
  private ping(): void {
    this.postMessage({
      type: 'ping',
      id: this.generateId(),
      payload: { timestamp: Date.now() },
      source: 'mcp-bridge',
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    // Validate origin
    if (this.config.targetOrigin !== '*' && event.origin !== this.config.targetOrigin) {
      return;
    }

    const message = event.data as BridgeMessage;
    if (!message || !message.type || message.source === 'mcp-bridge') {
      return;
    }

    switch (message.type) {
      case 'pong':
        this.handlePong();
        break;

      case 'mcp-response':
      case 'code-result':
        this.handleResponse(message);
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }

  /**
   * Handle pong response (connection established)
   */
  private handlePong(): void {
    if (!this.isReady) {
      this.isReady = true;
      this.readyResolve();
      this.config.onReady();
    }
  }

  /**
   * Handle response messages
   */
  private handleResponse(message: BridgeMessage): void {
    const pending = this.pendingRequests.get(message.id);
    if (!pending) {
      return;
    }

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(message.id);

    const payload = message.payload as { success?: boolean; error?: string; result?: unknown };
    if (payload.error) {
      pending.reject(new Error(payload.error));
    } else {
      pending.resolve(payload.result);
    }
  }

  /**
   * Send a message to PinePaper Studio
   */
  private postMessage(message: BridgeMessage): void {
    this.config.targetWindow.postMessage(message, this.config.targetOrigin);
  }

  /**
   * Generate unique message ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Execute code in PinePaper Studio
   */
  async executeCode(code: string): Promise<unknown> {
    if (!this.isReady) {
      await this.waitForReady();
    }

    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.postMessage({
        type: 'execute-code',
        id,
        payload: { code },
        source: 'mcp-bridge',
      });
    });
  }

  /**
   * Send an MCP tool request to PinePaper Studio
   */
  async sendToolRequest(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    if (!this.isReady) {
      await this.waitForReady();
    }

    const id = this.generateId();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('Request timeout'));
      }, this.config.timeout);

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.postMessage({
        type: 'mcp-request',
        id,
        payload: { tool: toolName, arguments: args },
        source: 'mcp-bridge',
      });
    });
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('message', this.messageHandler);

    // Cancel all pending requests
    for (const [id, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Bridge destroyed'));
      this.pendingRequests.delete(id);
    }
  }
}

// =============================================================================
// PINEPAPER STUDIO HANDLER (runs inside PinePaper)
// =============================================================================

/**
 * Configuration for the studio-side message handler.
 */
export interface StudioHandlerConfig {
  /**
   * REQUIRED. Exact origins permitted to drive this studio window.
   * Wildcards are rejected: a `'*'` allowlist on a handler that can run
   * code means any page holding a window reference (opener, embedder,
   * `window.open` result) gets code execution in this origin.
   */
  allowedOrigins: string[];

  /**
   * Optional host-supplied executor for `execute-code` requests.
   *
   * This package deliberately ships NO code evaluator. If the host does
   * not inject one, `execute-code` is refused. Hosts that want it wire
   * their own sandbox/governor here and own that decision explicitly.
   */
  executeCode?: (code: string) => Promise<unknown>;

  /**
   * Allow `mcp-request` messages to dispatch MCP tool calls. Off by
   * default — tool dispatch mutates the host document.
   */
  allowToolCalls?: boolean;
}

/**
 * Message handler for PinePaper Studio side
 *
 * Install this in PinePaper Studio to handle incoming bridge messages.
 *
 * SECURITY: this handler is a remote-control surface for the window it is
 * installed in. It therefore requires an explicit origin allowlist, ships
 * no code evaluator (see `StudioHandlerConfig.executeCode`), and keeps
 * tool dispatch opt-in.
 */
export class PinePaperStudioHandler {
  private allowedOrigins: string[];
  private executeCodeFn?: (code: string) => Promise<unknown>;
  private allowToolCalls: boolean;
  private messageHandler: (event: MessageEvent) => void;

  constructor(config: StudioHandlerConfig | string[]) {
    const cfg: StudioHandlerConfig = Array.isArray(config)
      ? { allowedOrigins: config }
      : config;

    const origins = cfg?.allowedOrigins;
    if (!Array.isArray(origins) || origins.length === 0) {
      throw new Error(
        'PinePaperStudioHandler: `allowedOrigins` is required — pass the exact ' +
          "origins allowed to drive this window, e.g. ['https://pinepaper.studio']."
      );
    }
    if (origins.some((o) => typeof o !== 'string' || o.trim() === '' || o.includes('*'))) {
      throw new Error(
        'PinePaperStudioHandler: wildcard/empty origins are not allowed. ' +
          'List exact origins — a wildcard lets any page that holds a window ' +
          'reference drive this studio.'
      );
    }

    this.allowedOrigins = [...origins];
    this.executeCodeFn = cfg.executeCode;
    this.allowToolCalls = cfg.allowToolCalls === true;
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    // Validate origin — exact match only, no wildcard escape hatch.
    if (!this.allowedOrigins.includes(event.origin)) {
      return;
    }

    // Replies go back to the sending window; without one there is nothing
    // to answer and no way to scope the response.
    const source = event.source as Window | null;
    if (!source) {
      return;
    }

    const message = event.data as BridgeMessage;
    if (!message || !message.type || message.source !== 'mcp-bridge') {
      return;
    }

    switch (message.type) {
      case 'ping':
        this.handlePing(source, event.origin);
        break;

      case 'execute-code':
        this.handleExecuteCode(message, source, event.origin);
        break;

      case 'mcp-request':
        this.handleMCPRequest(message, source, event.origin);
        break;
    }
  }

  /**
   * Handle ping message
   */
  private handlePing(source: Window, origin: string): void {
    source.postMessage(
      {
        type: 'pong',
        id: `pong_${Date.now()}`,
        payload: { timestamp: Date.now() },
        source: 'pinepaper-studio',
      } as BridgeMessage,
      origin
    );
  }

  /**
   * Handle code execution request.
   *
   * This package ships no evaluator. Code runs only through an executor the
   * HOST injected via `StudioHandlerConfig.executeCode`; otherwise the
   * request is refused. Historically this path dynamically evaluated the
   * message payload, which — combined with the old wildcard origin default —
   * let any page holding a window reference run arbitrary code in the studio
   * origin and read the result back over postMessage (CVE-class: cross-origin
   * remote code execution; reported by Socket.dev 2026-08-01).
   */
  private async handleExecuteCode(
    message: BridgeMessage,
    source: Window,
    origin: string
  ): Promise<void> {
    const { code } = message.payload as { code: string };

    if (!this.executeCodeFn) {
      source.postMessage(
        {
          type: 'code-result',
          id: message.id,
          payload: {
            success: false,
            error:
              'Code execution is not enabled on this bridge. The host must ' +
              'supply StudioHandlerConfig.executeCode to opt in.',
          },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
      return;
    }

    try {
      const result = await this.executeCodeFn(code);

      source.postMessage(
        {
          type: 'code-result',
          id: message.id,
          payload: { success: true, result },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
    } catch (error) {
      source.postMessage(
        {
          type: 'code-result',
          id: message.id,
          payload: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
    }
  }

  /**
   * Handle MCP tool request
   */
  private async handleMCPRequest(
    message: BridgeMessage,
    source: Window,
    origin: string
  ): Promise<void> {
    const { tool, arguments: args } = message.payload as {
      tool: string;
      arguments: Record<string, unknown>;
    };

    // Tool dispatch mutates the host document — opt-in only.
    if (!this.allowToolCalls) {
      source.postMessage(
        {
          type: 'mcp-response',
          id: message.id,
          payload: {
            success: false,
            error:
              'Tool calls are not enabled on this bridge. Set ' +
              'StudioHandlerConfig.allowToolCalls to opt in.',
          },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
      return;
    }

    try {
      // Import and use the handler
      const { handleToolCall } = await import('../tools/handlers.js');
      const result = await handleToolCall(tool, args);

      source.postMessage(
        {
          type: 'mcp-response',
          id: message.id,
          payload: { success: true, result },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
    } catch (error) {
      source.postMessage(
        {
          type: 'mcp-response',
          id: message.id,
          payload: {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          source: 'pinepaper-studio',
        } as BridgeMessage,
        origin
      );
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('message', this.messageHandler);
  }
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Create a bridge to communicate with PinePaper Studio
 */
export function createBridge(config: BridgeConfig): PinePaperBridge {
  return new PinePaperBridge(config);
}

/**
 * Create a handler for PinePaper Studio side.
 *
 * `config.allowedOrigins` is REQUIRED and must list exact origins — there is
 * deliberately no default. This handler remote-controls the window it is
 * installed in; a permissive default is a cross-origin foothold.
 */
export function createStudioHandler(
  config: StudioHandlerConfig | string[]
): PinePaperStudioHandler {
  return new PinePaperStudioHandler(config);
}
