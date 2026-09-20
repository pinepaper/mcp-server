/**
 * The response was mostly the request, read back.
 *
 * A cost study measured tool calls at 3.6x to 33.7x the tokens of an equivalent
 * JavaScript loop, and found the largest single component was not the request
 * at all — it was the response. 46 KB echoed for 50 creates, ~86% of that
 * path's cost.
 *
 * Measured here: a successful 50-item batch returned 8,740 characters of
 * echoed source against 983 characters of result. The agent wrote the request;
 * reading it back to them is a token tax that grows linearly with how much
 * structure they had to spell out, which is exactly the cost curve that makes
 * enumerating below intent level irrational.
 *
 * The code is still returned where it is the DELIVERABLE ('code' mode) and
 * where it is the EVIDENCE (every error path carries it in details).
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import type { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

const items = Array.from({ length: 50 }, (_, i) => ({
  type: 'star' as const,
  params: { x: 100 + i * 20, y: 200, radius1: 30, radius2: 15, points: 5, color: '#f0a' },
}));

function fakeController() {
  return {
    connected: true,
    connect: async () => undefined,
    executeCode: async () => ({
      success: true,
      result: { success: true, itemIds: items.map((_, i) => `item_${i + 1}`), count: 50 },
    }),
  } as unknown as PinePaperBrowserController;
}

const textOf = (r: { content: unknown[] }) =>
  (r.content as Array<{ type: string; text?: string }>).filter((c) => c.type === 'text').map((c) => c.text ?? '').join('\n');

afterEach(() => { delete process.env.PINEPAPER_ECHO_CODE; });

describe('a successful run does not read the request back', () => {
  it('omits the generated source, and stays small next to the code it ran', async () => {
    const r = await handleToolCall('pinepaper_batch_create', { items },
      { executeInBrowser: true, browserController: fakeController(), executionMode: 'puppeteer' });

    const text = textOf(r);
    const code = codeGenerator.generateBatchCreate({ items });

    // The source is genuinely long — this is the thing that was being echoed.
    expect(code.length).toBeGreaterThan(5000);
    expect(text).not.toContain('Generated code:');
    // …and the response is a small fraction of it rather than a copy plus a bit.
    expect(text.length).toBeLessThan(code.length / 2);
  });

  it('still says what happened — the ids and the count survive', async () => {
    const r = await handleToolCall('pinepaper_batch_create', { items },
      { executeInBrowser: true, browserController: fakeController(), executionMode: 'puppeteer' });
    const text = textOf(r);
    expect(text).toContain('item_1');
    expect(text).toContain('item_50');
    expect(text).toContain('50');
  });

  it('PINEPAPER_ECHO_CODE=1 brings it back for anyone debugging a generator', async () => {
    process.env.PINEPAPER_ECHO_CODE = '1';
    const r = await handleToolCall('pinepaper_batch_create', { items },
      { executeInBrowser: true, browserController: fakeController(), executionMode: 'puppeteer' });
    expect(textOf(r)).toContain('Generated code:');
  });

  it('code mode still returns the code, because there it IS the deliverable', async () => {
    const r = await handleToolCall('pinepaper_batch_create', { items },
      { executeInBrowser: false, executionMode: 'code' });
    expect(textOf(r)).toContain('Generated Code');
  });
});
