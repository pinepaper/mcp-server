/**
 * Browser connection: what a navigation waits for, and what "ready" means.
 *
 * Four failures, all in the same place and all silent in their own way:
 *
 *  - Every goto/reload waited for `networkidle2` — two-or-fewer connections
 *    held for half a second. Studio does not clear that bar behind a proxy, or
 *    with analytics and polling sockets open, so connect() burned its whole
 *    timeout against a page that had been usable for seconds.
 *  - The 30s timeout was not reachable from the outside at all.
 *  - There was no way to put Chrome behind an intercepting proxy, which is what
 *    an origin that rejects headless-Chrome TLS fingerprints needs.
 *  - Readiness tested `app || pinepaper || paper` for existence, copied into
 *    four places. `window.paper` is Paper.js and attaches as soon as the canvas
 *    script loads, so "ready" could mean a page that throws on the first call.
 *
 * The last one is the interesting test: a false ready is worse than a slow one,
 * because the failure surfaces later and somewhere else.
 */

import { describe, expect, test, afterEach, beforeEach } from 'bun:test';
import {
  PAGE_WAIT_UNTIL,
  PinePaperBrowserController,
  getBrowserController,
  pinePaperIsReady,
  resetBrowserControllerSync,
} from '../../browser/puppeteer-controller.js';

const ENV_KEYS = [
  'PINEPAPER_WAIT_UNTIL',
  'PINEPAPER_TIMEOUT',
  'PINEPAPER_PROXY',
  'PINEPAPER_GOVERNOR',
  'PINEPAPER_HEADLESS',
] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  resetBrowserControllerSync();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k] as string;
  }
  resetBrowserControllerSync();
});

// =============================================================================
// READINESS
// =============================================================================

describe('pinePaperIsReady', () => {
  const withWindow = (globals: Record<string, unknown>, run: () => void) => {
    const had = Object.prototype.hasOwnProperty.call(globalThis, 'window');
    const previous = (globalThis as { window?: unknown }).window;
    (globalThis as { window?: unknown }).window = globals;
    try {
      run();
    } finally {
      if (had) (globalThis as { window?: unknown }).window = previous;
      else delete (globalThis as { window?: unknown }).window;
    }
  };

  test('Paper.js alone is NOT ready — this is the false-ready signal', () => {
    withWindow({ paper: { project: {} } }, () => {
      expect(pinePaperIsReady()).toBe(false);
    });
  });

  const ready = { create: () => {}, itemRegistry: {} };

  test('an app object without create() is not ready either', () => {
    withWindow({ app: {} }, () => {
      expect(pinePaperIsReady()).toBe(false);
    });
  });

  test('create() without the registry behind it is not ready — FxTool polls for both', () => {
    withWindow({ app: { create: () => {} } }, () => {
      expect(pinePaperIsReady()).toBe(false);
    });
  });

  test('app.create makes it ready', () => {
    withWindow({ app: ready, paper: {} }, () => {
      expect(pinePaperIsReady()).toBe(true);
    });
  });

  test('PinePaper.create makes it ready — the name executeCode falls back to', () => {
    withWindow({ PinePaper: ready }, () => {
      expect(pinePaperIsReady()).toBe(true);
    });
  });

  test('the lowercase alias still counts', () => {
    withWindow({ pinepaper: ready }, () => {
      expect(pinePaperIsReady()).toBe(true);
    });
  });

  /**
   * The discriminating case. `window.PinePaper` is assigned the CLASS at module
   * load, and `window.app` is whatever editor.html put there — so a truthy
   * first candidate that fails the test must not decide the answer for the
   * others, or a ready page waits out the whole timeout.
   */
  test('a failing earlier global does not mask a ready later one', () => {
    withWindow({ app: {}, PinePaper: ready }, () => {
      expect(pinePaperIsReady()).toBe(true);
    });
    withWindow({ app: { create: () => {} }, PinePaper: ready }, () => {
      expect(pinePaperIsReady()).toBe(true);
    });
  });

  test('an empty page is not ready', () => {
    withWindow({}, () => {
      expect(pinePaperIsReady()).toBe(false);
    });
  });

  test('it closes over nothing — page.evaluate ships the source, not the scope', () => {
    // Anything captured from module scope arrives undefined in the page. The
    // cheap proof is that its source names no import.
    const source = pinePaperIsReady.toString();
    for (const name of ['PAGE_WAIT_UNTIL', 'PinePaperBrowserController', 'require', 'import']) {
      expect(source.includes(name)).toBe(false);
    }
  });
});

// =============================================================================
// RESOLVED SETTINGS
// =============================================================================

describe('connection settings', () => {
  test('defaults: domcontentloaded, 30s, no proxy, governor on', () => {
    const c = new PinePaperBrowserController();
    const s = c.connectionSettings;
    expect(s.waitUntil).toBe('domcontentloaded');
    expect(s.timeout).toBe(30000);
    expect(s.proxy).toBe('');
    expect(s.governor).toBe(true);
  });

  test('PINEPAPER_WAIT_UNTIL restores the old networkidle2 behaviour', () => {
    process.env.PINEPAPER_WAIT_UNTIL = 'networkidle2';
    expect(getBrowserController().connectionSettings.waitUntil).toBe('networkidle2');
  });

  test('every documented waitUntil value is accepted', () => {
    for (const value of PAGE_WAIT_UNTIL) {
      resetBrowserControllerSync();
      process.env.PINEPAPER_WAIT_UNTIL = value;
      expect(getBrowserController().connectionSettings.waitUntil).toBe(value);
    }
  });

  test('a bogus waitUntil falls back to the default rather than reaching puppeteer', () => {
    process.env.PINEPAPER_WAIT_UNTIL = 'networkidle3';
    expect(getBrowserController().connectionSettings.waitUntil).toBe('domcontentloaded');
  });

  test('PINEPAPER_TIMEOUT overrides the 30s default', () => {
    process.env.PINEPAPER_TIMEOUT = '120000';
    expect(getBrowserController().connectionSettings.timeout).toBe(120000);
  });

  test('a non-numeric or non-positive timeout is ignored, not passed through as NaN', () => {
    process.env.PINEPAPER_TIMEOUT = 'soon';
    expect(getBrowserController().connectionSettings.timeout).toBe(30000);
    resetBrowserControllerSync();
    process.env.PINEPAPER_TIMEOUT = '0';
    expect(getBrowserController().connectionSettings.timeout).toBe(30000);
  });

  test('PINEPAPER_GOVERNOR=off turns the governor off, and only that spelling does', () => {
    process.env.PINEPAPER_GOVERNOR = 'off';
    expect(getBrowserController().connectionSettings.governor).toBe(false);
    resetBrowserControllerSync();
    process.env.PINEPAPER_GOVERNOR = 'on';
    expect(getBrowserController().connectionSettings.governor).toBe(true);
  });

  test('explicit config beats the environment', () => {
    process.env.PINEPAPER_WAIT_UNTIL = 'networkidle2';
    process.env.PINEPAPER_TIMEOUT = '120000';
    const c = getBrowserController({ waitUntil: 'load', timeout: 5000 });
    expect(c.connectionSettings.waitUntil).toBe('load');
    expect(c.connectionSettings.timeout).toBe(5000);
  });
});

// =============================================================================
// CHROME FLAGS
// =============================================================================

describe('chrome flags', () => {
  test('no proxy configured: certificate checking is left alone', () => {
    const args = new PinePaperBrowserController().chromeArgs();
    expect(args.some((a) => a.startsWith('--proxy-server'))).toBe(false);
    expect(args).not.toContain('--ignore-certificate-errors');
  });

  test('PINEPAPER_PROXY passes the proxy through, with the certificate relaxation it requires', () => {
    process.env.PINEPAPER_PROXY = 'http://127.0.0.1:8080';
    const args = getBrowserController().chromeArgs();
    expect(args).toContain('--proxy-server=http://127.0.0.1:8080');
    // An intercepting proxy presents its own certificate; without this Chrome
    // refuses every origin and the proxy flag is useless on its own.
    expect(args).toContain('--ignore-certificate-errors');
  });

  test('the proxy flags ride alongside the agent-mode flags, not instead of them', () => {
    process.env.PINEPAPER_PROXY = 'http://127.0.0.1:8080';
    const args = getBrowserController().chromeArgs();
    expect(args).toContain('--no-sandbox');
    expect(args.some((a) => a.startsWith('--window-size='))).toBe(true);
  });
});
