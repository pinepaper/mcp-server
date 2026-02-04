/**
 * PinePaper Puppeteer Controller
 *
 * Controls a real browser instance running PinePaper Studio.
 * Executes code directly via page.evaluate() and provides screenshots.
 */

import type { Browser, Page } from 'puppeteer';

// =============================================================================
// TYPES
// =============================================================================

export interface BrowserControllerConfig {
  /** PinePaper Studio URL (default: https://pinepaper.studio) */
  studioUrl?: string;
  /** Whether to run browser in headless mode (default: false for visibility) */
  headless?: boolean;
  /** Browser viewport width (default: 1280) */
  viewportWidth?: number;
  /** Browser viewport height (default: 800) */
  viewportHeight?: number;
  /** Timeout for page operations in ms (default: 30000) */
  timeout?: number;
  /** Enable agent mode with ?agent=1 URL parameter */
  agentMode?: boolean;
}

export interface AgentConnectOptions {
  /** Run browser in headless mode (default: true for agent workflows) */
  headless?: boolean;
  /** Canvas preset to apply (optional) */
  canvasPreset?: string;
  /** Custom viewport width */
  viewportWidth?: number;
  /** Custom viewport height */
  viewportHeight?: number;
}

export interface BatchExecuteResult {
  success: boolean;
  results: Array<{
    index: number;
    success: boolean;
    result?: unknown;
    itemId?: string;
    error?: string;
  }>;
  itemIds: string[];
  executionTime: number;
  error?: string;
  screenshot?: string;
}

export interface ExecuteResult {
  success: boolean;
  result?: unknown;
  error?: string;
  screenshot?: string; // base64 encoded
}

// =============================================================================
// BROWSER CONTROLLER CLASS
// =============================================================================

/**
 * Controls PinePaper Studio via Puppeteer.
 *
 * This controller:
 * 1. Launches a browser and navigates to PinePaper Studio
 * 2. Executes JavaScript code directly in the page context
 * 3. Captures screenshots to show results
 */
export class PinePaperBrowserController {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: Required<BrowserControllerConfig>;
  private isConnected = false;
  private isAgentMode = false;

  constructor(config: BrowserControllerConfig = {}) {
    // Ensure URL points to /editor where the code console and API are available
    let studioUrl = config.studioUrl || 'https://pinepaper.studio';
    const originalUrl = studioUrl;

    if (!studioUrl.includes('/editor')) {
      studioUrl = studioUrl.replace(/\/$/, '') + '/editor';
    }

    // MCP server ALWAYS uses agent mode - add agent parameter to URL
    // This is critical for proper PinePaper agent integration
    const url = new URL(studioUrl);
    url.searchParams.set('agent', '1');
    url.searchParams.set('mode', 'agent');
    studioUrl = url.toString();

    this.config = {
      studioUrl,
      headless: config.headless ?? true, // Default to headless for agent mode
      viewportWidth: config.viewportWidth || 1280,
      viewportHeight: config.viewportHeight || 800,
      timeout: config.timeout || 30000,
      agentMode: true, // MCP server always uses agent mode
    };

    console.error(`[PinePaper] Controller initialized:`);
    console.error(`[PinePaper]   Original URL: ${originalUrl}`);
    console.error(`[PinePaper]   Agent URL: ${studioUrl}`);
    console.error(`[PinePaper]   Headless: ${this.config.headless}`);
  }

  /**
   * Get URL with agent mode parameter
   */
  private getAgentUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('agent', '1');
    url.searchParams.set('mode', 'agent');
    return url.toString();
  }

  /**
   * Check if in agent mode
   */
  get agentMode(): boolean {
    return this.isAgentMode;
  }

  /**
   * Check if connected to browser
   */
  get connected(): boolean {
    return this.isConnected && this.page !== null;
  }

  /**
   * Get current studio URL (always includes agent parameters for MCP server)
   */
  get studioUrl(): string {
    return this.config.studioUrl;
  }

  /**
   * Get the actual URL being used (same as studioUrl since MCP always uses agent mode)
   */
  get actualUrl(): string {
    return this.config.studioUrl;
  }

  /**
   * Launch browser and navigate to PinePaper Studio.
   * When agentMode is enabled (default), this automatically uses connectAgent().
   */
  async connect(): Promise<void> {
    console.error(`[PinePaper] connect() called - agentMode=${this.config.agentMode}, headless=${this.config.headless}`);

    // If agent mode is configured, delegate to connectAgent()
    if (this.config.agentMode) {
      console.error('[PinePaper] Delegating to connectAgent()');
      return this.connectAgent({ headless: this.config.headless });
    }

    console.error('[PinePaper] Using standard connect (non-agent mode)');

    // Check if already connected and page is still valid
    if (this.isConnected && this.page) {
      try {
        // Verify the page is still responsive
        await this.page.evaluate(() => true);
        console.error('[PinePaper] Already connected');
        return;
      } catch {
        // Page is stale, need to reconnect
        console.error('[PinePaper] Existing connection stale, reconnecting...');
        this.isConnected = false;
      }
    }

    try {
      // Clean up any existing browser instance first to prevent multiple windows
      if (this.browser) {
        try {
          await this.browser.close();
        } catch {
          // Ignore close errors
        }
        this.browser = null;
        this.page = null;
      }

      // Dynamic import to avoid issues when puppeteer isn't installed
      const puppeteer = await import('puppeteer');

      console.error('[PinePaper] Launching browser...');
      this.browser = await puppeteer.default.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--window-size=${this.config.viewportWidth},${this.config.viewportHeight}`,
        ],
      });

      // Get existing pages first, reuse if available (avoid creating multiple tabs)
      const pages = await this.browser.pages();
      if (pages.length > 0) {
        this.page = pages[0];
        // Close any extra pages that might have been created
        for (let i = 1; i < pages.length; i++) {
          await pages[i].close();
        }
      } else {
        this.page = await this.browser.newPage();
      }

      await this.page.setViewport({
        width: this.config.viewportWidth,
        height: this.config.viewportHeight,
      });

      console.error(`[PinePaper] Navigating to ${this.config.studioUrl}...`);
      await this.page.goto(this.config.studioUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for PinePaper to be ready (check for app object)
      console.error('[PinePaper] Waiting for PinePaper Studio to initialize...');
      await this.page.waitForFunction(
        () => {
          // Check if PinePaper's global app or API is available
          return (
            typeof (window as any).app !== 'undefined' ||
            typeof (window as any).pinepaper !== 'undefined' ||
            typeof (window as any).paper !== 'undefined'
          );
        },
        { timeout: this.config.timeout }
      );

      this.isConnected = true;
      console.error('[PinePaper] Connected to PinePaper Studio');
    } catch (error) {
      await this.disconnect();
      throw new Error(
        `Failed to connect to PinePaper Studio: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Disconnect and close browser
   */
  async disconnect(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore errors during cleanup
      }
    }
    this.browser = null;
    this.page = null;
    this.isConnected = false;
    console.error('[PinePaper] Disconnected from browser');
  }

  /**
   * Execute JavaScript code in PinePaper Studio
   */
  async executeCode(code: string, takeScreenshot = true): Promise<ExecuteResult> {
    if (!this.page || !this.isConnected) {
      return {
        success: false,
        error: 'Not connected to PinePaper Studio. Call connect() first.',
      };
    }

    try {
      // Execute the code in page context
      const result = await this.page.evaluate((codeToRun: string) => {
        try {
          // eslint-disable-next-line no-eval
          const evalResult = eval(codeToRun);
          // Handle promises
          if (evalResult instanceof Promise) {
            return evalResult.then((r) => ({ success: true, result: r }));
          }
          return { success: true, result: evalResult };
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Execution error',
          };
        }
      }, code);

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (takeScreenshot && result.success) {
        screenshot = await this.takeScreenshot();
      }

      return {
        ...result,
        screenshot,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    }
  }

  /**
   * Take a screenshot of the current canvas
   */
  async takeScreenshot(): Promise<string | undefined> {
    if (!this.page) {
      return undefined;
    }

    try {
      // Try to capture just the canvas element, fallback to full page
      const canvasElement = await this.page.$('canvas');

      if (canvasElement) {
        const screenshot = await canvasElement.screenshot({
          encoding: 'base64',
          type: 'png',
        });
        return screenshot as string;
      }

      // Fallback to full page
      const screenshot = await this.page.screenshot({
        encoding: 'base64',
        type: 'png',
        fullPage: false,
      });
      return screenshot as string;
    } catch {
      return undefined;
    }
  }

  /**
   * Get the current page URL
   */
  async getCurrentUrl(): Promise<string | undefined> {
    return this.page?.url();
  }

  /**
   * Navigate to a different URL
   */
  async navigateTo(url: string): Promise<void> {
    if (!this.page) {
      throw new Error('Not connected to browser');
    }
    await this.page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: this.config.timeout,
    });
  }

  /**
   * Reload the page
   */
  async reload(): Promise<void> {
    if (!this.page) {
      throw new Error('Not connected to browser');
    }
    await this.page.reload({
      waitUntil: 'networkidle2',
      timeout: this.config.timeout,
    });
  }

  /**
   * Refresh the page and wait for PinePaper to be ready again.
   * This is the most reliable way to get a clean canvas.
   */
  async refreshPage(): Promise<void> {
    if (!this.page) {
      throw new Error('Not connected to browser');
    }

    console.error('[PinePaper] Refreshing page...');
    await this.page.reload({
      waitUntil: 'networkidle2',
      timeout: this.config.timeout,
    });

    // Wait for PinePaper to be ready again
    console.error('[PinePaper] Waiting for PinePaper Studio to reinitialize...');
    await this.page.waitForFunction(
      () => {
        return (
          typeof (window as any).app !== 'undefined' ||
          typeof (window as any).pinepaper !== 'undefined' ||
          typeof (window as any).paper !== 'undefined'
        );
      },
      { timeout: this.config.timeout }
    );

    console.error('[PinePaper] Page refreshed and ready');
  }

  /**
   * Check if PinePaper API is available
   */
  async checkPinePaperReady(): Promise<boolean> {
    if (!this.page) {
      return false;
    }

    try {
      return await this.page.evaluate(() => {
        return (
          typeof (window as any).app !== 'undefined' ||
          typeof (window as any).pinepaper !== 'undefined' ||
          typeof (window as any).paper !== 'undefined'
        );
      });
    } catch {
      return false;
    }
  }

  // =============================================================================
  // AGENT MODE METHODS
  // =============================================================================

  /**
   * Connect in agent mode with optimized settings for automation.
   * Uses headless mode by default and adds ?agent=1 URL parameter.
   */
  async connectAgent(options: AgentConnectOptions = {}): Promise<void> {
    // Check if already connected and page is still valid
    if (this.isConnected && this.page) {
      try {
        // Verify the page is still responsive
        await this.page.evaluate(() => true);

        // If already connected but not in agent mode, navigate to agent URL
        if (!this.isAgentMode) {
          const agentUrl = this.getAgentUrl(this.config.studioUrl);
          console.error(`[PinePaper] Switching to agent mode: ${agentUrl}`);
          await this.page.goto(agentUrl, {
            waitUntil: 'networkidle2',
            timeout: this.config.timeout,
          });
          await this.waitForPinePaper();
          this.isAgentMode = true;
        }
        console.error('[PinePaper] Already connected in agent mode');
        return;
      } catch {
        // Page is stale, need to reconnect
        console.error('[PinePaper] Existing connection stale, reconnecting...');
        this.isConnected = false;
      }
    }

    try {
      // Clean up any existing browser instance first to prevent multiple windows
      if (this.browser) {
        try {
          await this.browser.close();
        } catch {
          // Ignore close errors
        }
        this.browser = null;
        this.page = null;
      }

      // Dynamic import to avoid issues when puppeteer isn't installed
      const puppeteer = await import('puppeteer');

      // Agent mode defaults to headless
      const useHeadless = options.headless ?? true;
      const viewportWidth = options.viewportWidth ?? this.config.viewportWidth;
      const viewportHeight = options.viewportHeight ?? this.config.viewportHeight;

      console.error(`[PinePaper] Launching browser in agent mode (headless: ${useHeadless})...`);
      this.browser = await puppeteer.default.launch({
        headless: useHeadless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          `--window-size=${viewportWidth},${viewportHeight}`,
          // Additional optimization flags for agent mode
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-extensions',
        ],
      });

      // Get existing pages first, reuse if available (avoid creating multiple tabs)
      const pages = await this.browser.pages();

      // Use the first page (about:blank) and close ALL others
      if (pages.length > 0) {
        this.page = pages[0];
        // Close ALL extra pages
        for (let i = 1; i < pages.length; i++) {
          try {
            await pages[i].close();
          } catch {
            // Ignore close errors
          }
        }
      } else {
        this.page = await this.browser.newPage();
      }

      await this.page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
      });

      // Ensure URL has agent parameters (double-check)
      const targetUrl = this.config.studioUrl.includes('agent=')
        ? this.config.studioUrl
        : this.getAgentUrl(this.config.studioUrl);

      console.error(`[PinePaper] Navigating to agent URL: ${targetUrl}`);

      // Navigate the existing page to PinePaper (converts about:blank to PinePaper)
      await this.page.goto(targetUrl, {
        waitUntil: 'networkidle2',
        timeout: this.config.timeout,
      });

      // Wait for PinePaper to be ready
      await this.waitForPinePaper();

      this.isConnected = true;
      this.isAgentMode = true;
      console.error('[PinePaper] Connected to PinePaper Studio in agent mode');
    } catch (error) {
      await this.disconnect();
      throw new Error(
        `Failed to connect in agent mode: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Wait for PinePaper API to be available
   */
  private async waitForPinePaper(): Promise<void> {
    if (!this.page) return;

    console.error('[PinePaper] Waiting for PinePaper Studio to initialize...');
    await this.page.waitForFunction(
      () => {
        return (
          typeof (window as any).app !== 'undefined' ||
          typeof (window as any).pinepaper !== 'undefined' ||
          typeof (window as any).paper !== 'undefined'
        );
      },
      { timeout: this.config.timeout }
    );
  }

  /**
   * Execute multiple code blocks as a batch for optimal performance.
   * Combines all code into a single execution context.
   */
  async executeBatch(
    codes: string[],
    options: { takeScreenshot?: boolean; atomic?: boolean } = {}
  ): Promise<BatchExecuteResult> {
    const startTime = Date.now();

    if (!this.page || !this.isConnected) {
      return {
        success: false,
        results: [],
        itemIds: [],
        executionTime: 0,
        error: 'Not connected to PinePaper Studio',
      };
    }

    const atomic = options.atomic ?? true;

    // Wrap all codes in a single IIFE for batch execution
    const batchCode = `
(async function() {
  const _results = [];
  const _itemIds = [];

  try {
${codes.map((code, i) => `
    // === Operation ${i + 1} ===
    try {
      const _result${i} = await (async () => {
        ${code}
      })();
      _results.push({ index: ${i}, success: true, result: _result${i} });
      if (_result${i} && typeof _result${i} === 'object') {
        if (_result${i}.itemId) _itemIds.push(_result${i}.itemId);
        if (_result${i}.registryId) _itemIds.push(_result${i}.registryId);
      }
    } catch (e) {
      _results.push({ index: ${i}, success: false, error: e.message });
      ${atomic ? 'throw e; // Atomic mode: stop on first error' : '// Continue despite error'}
    }
`).join('\n')}

    // Save history once for all operations
    if (app.historyManager) {
      app.historyManager.saveState();
    }

    return { success: true, itemIds: _itemIds, results: _results };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      itemIds: _itemIds,
      results: _results
    };
  }
})();
    `.trim();

    try {
      const result = await this.page.evaluate((codeToRun: string) => {
        try {
          // eslint-disable-next-line no-eval
          const evalResult = eval(codeToRun);
          if (evalResult instanceof Promise) {
            return evalResult;
          }
          return evalResult;
        } catch (e) {
          return {
            success: false,
            error: e instanceof Error ? e.message : 'Batch execution error',
            results: [],
            itemIds: [],
          };
        }
      }, batchCode);

      const executionTime = Date.now() - startTime;

      // Take screenshot if requested
      let screenshot: string | undefined;
      if (options.takeScreenshot && result.success) {
        screenshot = await this.takeScreenshot();
      }

      return {
        success: result.success ?? false,
        results: result.results ?? [],
        itemIds: result.itemIds ?? [],
        executionTime,
        error: result.error,
        screenshot,
      };
    } catch (error) {
      return {
        success: false,
        results: [],
        itemIds: [],
        executionTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown batch error',
      };
    }
  }

  /**
   * Execute code with a timeout
   */
  async executeWithTimeout(
    code: string,
    timeoutMs: number,
    takeScreenshot = false
  ): Promise<ExecuteResult> {
    const timeoutPromise = new Promise<ExecuteResult>((_, reject) => {
      setTimeout(() => reject(new Error('Execution timeout')), timeoutMs);
    });

    const executePromise = this.executeCode(code, takeScreenshot);

    try {
      return await Promise.race([executePromise, timeoutPromise]);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Timeout error',
      };
    }
  }

  /**
   * Quick reset: Clear canvas without full page refresh
   */
  async quickReset(options: { preserveBackground?: boolean } = {}): Promise<ExecuteResult> {
    const resetCode = `
(function() {
  // Clear all items
  if (app.clearCanvas) {
    app.clearCanvas();
  } else {
    if (app.textItemGroup) app.textItemGroup.removeChildren();
    if (app.patternGroup) app.patternGroup.removeChildren();
    if (app.itemRegistry) app.itemRegistry.clear();
    if (app.relationRegistry) app.relationRegistry.clear();
  }

  ${!options.preserveBackground ? `
  // Reset background
  if (app.setBackgroundColor) {
    app.setBackgroundColor('#1a1a2e');
  }
  ` : ''}

  // Save state
  if (app.historyManager) {
    app.historyManager.saveState();
  }

  return { success: true, reset: true };
})();
    `.trim();

    return this.executeCode(resetCode, false);
  }

  /**
   * Set canvas size from platform preset
   */
  async setCanvasPreset(preset: string): Promise<ExecuteResult> {
    const code = `
(function() {
  if (app.setCanvasSize) {
    app.setCanvasSize('${preset}');
    return { success: true, preset: '${preset}' };
  }
  return { success: false, error: 'setCanvasSize not available' };
})();
    `.trim();

    return this.executeCode(code, false);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalController: PinePaperBrowserController | null = null;

/**
 * Get or create the global browser controller instance.
 *
 * IMPORTANT: This is a singleton - only ONE browser controller exists.
 * If a controller already exists, the config parameter is ignored.
 * Call resetBrowserController() first if you need to change config.
 *
 * NOTE: MCP server ALWAYS uses agent mode with ?agent=1&mode=agent URL parameters.
 * This uses headless browser by default for optimal performance.
 */
export function getBrowserController(
  config?: BrowserControllerConfig
): PinePaperBrowserController {
  if (!globalController) {
    // MCP server always uses headless by default
    const mcpConfig: BrowserControllerConfig = {
      ...config,
      headless: config?.headless ?? true,
    };
    globalController = new PinePaperBrowserController(mcpConfig);
  } else if (config) {
    // Log that config is being ignored since controller already exists
    console.error('[PinePaper] Browser controller already exists, config parameter ignored. Call resetBrowserController() to create a new controller with different config.');
  }
  return globalController;
}

/**
 * Reset the global controller (for testing or when config needs to change).
 * This will close any existing browser and clear the singleton.
 */
export async function resetBrowserController(): Promise<void> {
  if (globalController) {
    try {
      await globalController.disconnect();
    } catch {
      // Ignore disconnect errors during reset
    }
    globalController = null;
    console.error('[PinePaper] Browser controller reset');
  }
}

/**
 * Synchronous reset for testing (fire and forget)
 */
export function resetBrowserControllerSync(): void {
  if (globalController) {
    globalController.disconnect().catch(() => {});
    globalController = null;
  }
}
