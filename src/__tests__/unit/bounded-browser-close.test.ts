/**
 * After a PNG export, browser.close() never settled and `pinepaper-mcp render -f png` hung with the file already
 * written (2026-11-20). disconnect() now gives close a bounded time and then stops the browser process.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

describe('disconnect() with a browser that will not close', () => {
  it('returns after the timeout and kills the process', async () => {
    const saved = PinePaperBrowserController.CLOSE_TIMEOUT_MS;
    PinePaperBrowserController.CLOSE_TIMEOUT_MS = 50;
    try {
      const c = new PinePaperBrowserController({ headless: true });
      let killed: string | null = null;
      (c as unknown as { browser: unknown }).browser = {
        close: () => new Promise(() => { /* never settles */ }),
        process: () => ({ kill: (sig: string) => { killed = sig; } }),
      };
      const t0 = Date.now();
      await c.disconnect();
      expect(Date.now() - t0).toBeLessThan(1000);
      expect(killed).toBe('SIGKILL');
    } finally {
      PinePaperBrowserController.CLOSE_TIMEOUT_MS = saved;
    }
  });
  it('a browser that closes is not killed', async () => {
    const c = new PinePaperBrowserController({ headless: true });
    let killed = false;
    (c as unknown as { browser: unknown }).browser = { close: async () => {}, process: () => ({ kill: () => { killed = true; } }) };
    await c.disconnect();
    expect(killed).toBe(false);
  });
});
