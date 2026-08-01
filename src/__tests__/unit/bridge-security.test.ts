/**
 * PinePaperStudioHandler security regression tests.
 *
 * Socket.dev flagged dist/browser/bridge.js (2026-08-01): the studio handler
 * defaulted to allowedOrigins=['*'], skipped origin validation whenever the
 * wildcard was present, then eval()'d the postMessage payload and posted the
 * result back — a cross-origin RCE primitive for any page holding a window
 * reference to the studio.
 *
 * Invariants locked here:
 *   1. No implicit/wildcard origin allowlist — construction must fail.
 *   2. The package ships NO evaluator: execute-code is refused unless the
 *      HOST injects an executor.
 *   3. Messages from non-allowlisted origins are ignored entirely.
 *   4. Tool dispatch is opt-in.
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

// --- Minimal window/postMessage harness -------------------------------------

type Listener = (event: unknown) => void;

let listeners: Listener[] = [];
let sentMessages: Array<{ message: any; origin: string }> = [];

const fakeSourceWindow = {
  postMessage(message: unknown, origin: string) {
    sentMessages.push({ message, origin });
  },
};

beforeEach(() => {
  listeners = [];
  sentMessages = [];
  (globalThis as any).window = {
    parent: fakeSourceWindow,
    addEventListener(type: string, fn: Listener) {
      if (type === 'message') listeners.push(fn);
    },
    removeEventListener(type: string, fn: Listener) {
      if (type === 'message') listeners = listeners.filter((l) => l !== fn);
    },
  };
});

afterEach(() => {
  delete (globalThis as any).window;
});

/** Deliver a message event to every installed listener. */
function deliver(opts: {
  origin: string;
  data: unknown;
  source?: unknown;
}): void {
  const event = {
    origin: opts.origin,
    data: opts.data,
    source: 'source' in opts ? opts.source : fakeSourceWindow,
  };
  for (const l of [...listeners]) l(event);
}

const ORIGIN = 'https://pinepaper.studio';

async function loadHandler() {
  const mod = await import('../../browser/bridge.js');
  return mod;
}

// --- 1. Origin allowlist is mandatory and exact ------------------------------

describe('PinePaperStudioHandler — origin allowlist', () => {
  test('refuses to construct with no origins', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    // @ts-expect-error — exercising the runtime guard
    expect(() => new PinePaperStudioHandler()).toThrow(/allowedOrigins.*required/i);
    expect(() => new PinePaperStudioHandler({ allowedOrigins: [] })).toThrow(
      /allowedOrigins.*required/i
    );
  });

  test('refuses a wildcard allowlist (the flagged default)', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    expect(() => new PinePaperStudioHandler(['*'])).toThrow(/wildcard/i);
    expect(
      () => new PinePaperStudioHandler({ allowedOrigins: ['https://ok.example', '*'] })
    ).toThrow(/wildcard/i);
    expect(() => new PinePaperStudioHandler({ allowedOrigins: ['https://*.evil.com'] })).toThrow(
      /wildcard/i
    );
  });

  test('ignores messages from a non-allowlisted origin', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    let executorCalls = 0;
    new PinePaperStudioHandler({
      allowedOrigins: [ORIGIN],
      executeCode: async () => {
        executorCalls++;
        return 'should-not-run';
      },
    });

    deliver({
      origin: 'https://evil.example',
      data: {
        type: 'execute-code',
        id: 'x1',
        source: 'mcp-bridge',
        payload: { code: 'return 1' },
      },
    });

    expect(executorCalls).toBe(0);
    expect(sentMessages).toHaveLength(0); // no reply — attacker learns nothing
  });
});

// --- 2. No evaluator ships with the package ---------------------------------

describe('PinePaperStudioHandler — code execution', () => {
  test('refuses execute-code when the host injected no executor', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    new PinePaperStudioHandler({ allowedOrigins: [ORIGIN] });

    deliver({
      origin: ORIGIN,
      data: {
        type: 'execute-code',
        id: 'x2',
        source: 'mcp-bridge',
        payload: { code: 'globalThis.__pwned = true; return 1' },
      },
    });

    await Promise.resolve();
    expect((globalThis as any).__pwned).toBeUndefined();
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].message.payload.success).toBe(false);
    expect(sentMessages[0].message.payload.error).toMatch(/not enabled/i);
  });

  test('runs code ONLY through the host-injected executor', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    const seen: string[] = [];
    new PinePaperStudioHandler({
      allowedOrigins: [ORIGIN],
      executeCode: async (code) => {
        seen.push(code);
        return { ok: true };
      },
    });

    deliver({
      origin: ORIGIN,
      data: {
        type: 'execute-code',
        id: 'x3',
        source: 'mcp-bridge',
        payload: { code: 'app.create("circle")' },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(seen).toEqual(['app.create("circle")']);
    expect(sentMessages[0].message.payload.success).toBe(true);
    // Reply is scoped to the sending origin, never '*'
    expect(sentMessages[0].origin).toBe(ORIGIN);
  });

  test('drops messages with no source window (nothing to reply to)', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    let calls = 0;
    new PinePaperStudioHandler({
      allowedOrigins: [ORIGIN],
      executeCode: async () => {
        calls++;
        return 1;
      },
    });

    deliver({
      origin: ORIGIN,
      source: null,
      data: { type: 'execute-code', id: 'x4', source: 'mcp-bridge', payload: { code: 'x' } },
    });

    expect(calls).toBe(0);
    expect(sentMessages).toHaveLength(0);
  });
});

// --- 3. Tool dispatch is opt-in ---------------------------------------------

describe('PinePaperStudioHandler — tool dispatch', () => {
  test('refuses mcp-request unless allowToolCalls is set', async () => {
    const { PinePaperStudioHandler } = await loadHandler();
    new PinePaperStudioHandler({ allowedOrigins: [ORIGIN] });

    deliver({
      origin: ORIGIN,
      data: {
        type: 'mcp-request',
        id: 'x5',
        source: 'mcp-bridge',
        payload: { tool: 'pinepaper_clear_canvas', arguments: {} },
      },
    });

    await new Promise((r) => setTimeout(r, 0));
    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0].message.payload.success).toBe(false);
    expect(sentMessages[0].message.payload.error).toMatch(/not enabled/i);
  });
});
