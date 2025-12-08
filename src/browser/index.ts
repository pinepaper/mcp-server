/**
 * PinePaper Browser Module
 *
 * Exports for browser-side usage of PinePaper MCP tools.
 */

export {
  PinePaperBridge,
  PinePaperStudioHandler,
  createBridge,
  createStudioHandler,
  type BridgeMessage,
  type BridgeConfig,
} from './bridge.js';

export {
  PinePaperBrowserController,
  getBrowserController,
  resetBrowserController,
  type BrowserControllerConfig,
  type ExecuteResult,
} from './puppeteer-controller.js';
