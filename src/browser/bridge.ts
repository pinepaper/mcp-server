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
 * Message handler for PinePaper Studio side
 *
 * Install this in PinePaper Studio to handle incoming bridge messages.
 */
export class PinePaperStudioHandler {
  private allowedOrigins: string[];
  private messageHandler: (event: MessageEvent) => void;

  constructor(allowedOrigins: string[] = ['*']) {
    this.allowedOrigins = allowedOrigins;
    this.messageHandler = this.handleMessage.bind(this);
    window.addEventListener('message', this.messageHandler);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    // Validate origin
    if (
      !this.allowedOrigins.includes('*') &&
      !this.allowedOrigins.includes(event.origin)
    ) {
      return;
    }

    const message = event.data as BridgeMessage;
    if (!message || !message.type || message.source !== 'mcp-bridge') {
      return;
    }

    switch (message.type) {
      case 'ping':
        this.handlePing(event.source as Window, event.origin);
        break;

      case 'execute-code':
        this.handleExecuteCode(message, event.source as Window, event.origin);
        break;

      case 'mcp-request':
        this.handleMCPRequest(message, event.source as Window, event.origin);
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
   * Handle code execution request
   */
  private async handleExecuteCode(
    message: BridgeMessage,
    source: Window,
    origin: string
  ): Promise<void> {
    const { code } = message.payload as { code: string };

    try {
      // Execute the code in PinePaper context
      // eslint-disable-next-line no-eval
      const result = await eval(`(async () => { ${code} })()`);

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
 * Create a handler for PinePaper Studio side
 */
export function createStudioHandler(allowedOrigins?: string[]): PinePaperStudioHandler {
  return new PinePaperStudioHandler(allowedOrigins);
}
