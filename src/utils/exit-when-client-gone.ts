/**
 * The process ends when its session does. The browser is what would keep it alive, and what would be left running.
 *
 * Bounded, because a page frozen for idleness or a browser that has stopped answering must not hold the process. If the
 * limit is hit, Puppeteer's own exit handler still kills the Chrome it launched.
 */
import process from 'node:process';
import { resetBrowserController } from '../browser/puppeteer-controller.js';

interface Options {
  closeBrowser?: () => Promise<unknown>;
  exit?: (code: number) => void;
  timeoutMs?: number;
}

export function exitWhenClientGone(server: { onclose?: () => void }, options: Options = {}): void {
  const { closeBrowser = resetBrowserController, exit = process.exit, timeoutMs = 5_000 } = options;
  let leaving = false;
  server.onclose = () => {
    if (leaving) return;
    leaving = true;
    console.error('[PinePaper] The client has gone: closing the browser and exiting.');
    const limit = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    void Promise.race([Promise.resolve().then(closeBrowser).catch(() => undefined), limit]).then(() => exit(0));
  };
}
