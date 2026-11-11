/**
 * #45: an idle server froze nothing, and the live preview of a 400-item scene used 1.49 cores with nobody watching.
 * The page is frozen after PINEPAPER_IDLE_PAUSE_SECONDS with no tool call in progress, and thawed (with focus
 * emulation, or animation frames stay off) when the next call begins.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

function rig() {
  const sent: string[] = [];
  const page = {
    createCDPSession: async () => ({
      send: async (m: string, p?: { state?: string; enabled?: boolean }) => {
        if (p?.state !== undefined) sent.push(`${m}:${p.state}`);
        else if (p?.enabled !== undefined) sent.push(`${m}:${p.enabled}`);
        else sent.push(m);
      },
    }),
  };
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

  it('freezes repeatedly across multiple idle/thaw cycles by clearing focus emulation before each freeze', async () => {
    process.env.PINEPAPER_IDLE_PAUSE_SECONDS = '0.04';
    const { c, sent } = rig();
    await c.beginActivity();
    c.endActivity();
    await wait(100);
    expect(c.isIdlePaused).toBe(true);
    expect(sent).toEqual([
      'Emulation.setFocusEmulationEnabled:false',
      'Page.setWebLifecycleState:frozen',
    ]);

    // First thaw enables focus emulation so rAF resumes
    await c.beginActivity();
    expect(c.isIdlePaused).toBe(false);
    expect(sent.slice(2)).toEqual([
      'Page.setWebLifecycleState:active',
      'Emulation.setFocusEmulationEnabled:true',
    ]);
    c.endActivity();

    // Second idle cycle MUST disable focus emulation again before freezing
    await wait(100);
    expect(c.isIdlePaused).toBe(true);
    expect(sent.slice(4)).toEqual([
      'Emulation.setFocusEmulationEnabled:false',
      'Page.setWebLifecycleState:frozen',
    ]);
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
    expect(sent).toEqual([
      'Emulation.setFocusEmulationEnabled:false',
      'Page.setWebLifecycleState:frozen',
    ]);
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
