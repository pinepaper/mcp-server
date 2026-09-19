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
  resetBrowserControllerSync,
  PAGE_WAIT_UNTIL,
  type BrowserControllerConfig,
  type ExecuteCodeOptions,
  type PageWaitUntil,
  type ExecuteResult,
  type AgentConnectOptions,
  type BatchExecuteResult,
} from './puppeteer-controller.js';
