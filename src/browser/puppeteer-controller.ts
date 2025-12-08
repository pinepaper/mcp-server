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

  constructor(config: BrowserControllerConfig = {}) {
    // Ensure URL points to /editor where the code console and API are available
    let studioUrl = config.studioUrl || 'https://pinepaper.studio';
    if (!studioUrl.includes('/editor')) {
      studioUrl = studioUrl.replace(/\/$/, '') + '/editor';
    }

    this.config = {
      studioUrl,
      headless: config.headless ?? false, // Default to visible browser
      viewportWidth: config.viewportWidth || 1280,
      viewportHeight: config.viewportHeight || 800,
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Check if connected to browser
   */
  get connected(): boolean {
    return this.isConnected && this.page !== null;
  }

  /**
   * Get current studio URL
   */
  get studioUrl(): string {
    return this.config.studioUrl;
  }

  /**
   * Launch browser and navigate to PinePaper Studio
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      console.error('[PinePaper] Already connected');
      return;
    }

    try {
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

      this.page = await this.browser.newPage();
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
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let globalController: PinePaperBrowserController | null = null;

/**
 * Get or create the global browser controller instance
 */
export function getBrowserController(
  config?: BrowserControllerConfig
): PinePaperBrowserController {
  if (!globalController) {
    globalController = new PinePaperBrowserController(config);
  }
  return globalController;
}

/**
 * Reset the global controller (for testing)
 */
export function resetBrowserController(): void {
  if (globalController) {
    globalController.disconnect().catch(() => {});
    globalController = null;
  }
}
