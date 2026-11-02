/**
 * #45: an idle server froze nothing, and the live preview of a 400-item scene used 1.49 cores with nobody watching.
 * The page is frozen after PINEPAPER_IDLE_PAUSE_SECONDS with no tool call in progress, and thawed (with focus
 * emulation, or animation frames stay off) when the next call begins.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

function rig() {
  const sent: string[] = [];
  const page = { createCDPSession: async () => ({ send: async (m: string, p?: { state?: string; enabled?: boolean }) => { sent.push(p?.state ? `${m}:${p.state}` : m); } }) };
  const c = new PinePaperBrowserController();
  Object.assign(c as unknown as Record<string, unknown>, { page, isConnected: true });
  return { c, sent };
}
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const saved = process.env.PINEPAPER_IDLE_PAUSE_SECONDS;
afterEach(() => { if (saved === undefined) delete process.env.PINEPAPER_IDLE_PAUSE_SECONDS; else process.env.PINEPAPER_IDLE_PAUSE_SECONDS = saved; });

describe('idle pause', () => {
  it('defaults to 30 s; 0 turns it off', () => {
    delete process.env.PINEPAPER_IDLE_PAUSE_SECONDS;
    expect(PinePaperBrowserController.idlePauseMs()).toBe(30_000);
    process.env.PINEPAPER_IDLE_PAUSE_SECONDS = '0';
    expect(PinePaperBrowserController.idlePauseMs()).toBe(0);
  });

  it('freezes after the idle time, and the next call thaws with focus emulation first', async () => {
    process.env.PINEPAPER_IDLE_PAUSE_SECONDS = '0.05';
    const { c, sent } = rig();
    await c.beginActivity();
    c.endActivity();
    await wait(120);
    expect(c.isIdlePaused).toBe(true);
    expect(sent).toEqual(['Page.setWebLifecycleState:frozen']);
    await c.beginActivity();
    expect(c.isIdlePaused).toBe(false);
    expect(sent.slice(1)).toEqual(['Page.setWebLifecycleState:active', 'Emulation.setFocusEmulationEnabled']);
    c.endActivity();
    await c.disconnect();
  });

  it('never freezes while a call is in progress', async () => {
    process.env.PINEPAPER_IDLE_PAUSE_SECONDS = '0.03';
    const { c, sent } = rig();
    await c.beginActivity();
    await c.beginActivity();
    c.endActivity(); // one still running
    await wait(100);
    expect(sent).toEqual([]);
    c.endActivity();
    await wait(100);
    expect(sent).toEqual(['Page.setWebLifecycleState:frozen']);
    await c.disconnect();
  });

  it('PINEPAPER_IDLE_PAUSE_SECONDS=0: never freezes', async () => {
    process.env.PINEPAPER_IDLE_PAUSE_SECONDS = '0';
    const { c, sent } = rig();
    await c.beginActivity();
    c.endActivity();
    await wait(80);
    expect(sent).toEqual([]);
  });
});
