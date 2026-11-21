/**
 * Found live on pinepaper.studio (2026-11-21), with /build.json answered as a newer build: the STALE_BUILD refusal sent
 * the agent to pinepaper_clear_canvas; the first clear reloaded the tab, the page came back on the same old build, and
 * the studio then declined every further reload ("this tab already reloaded once ... a cache is still serving the old
 * build"). clear_canvas reported a plain success and the next export was refused with the same advice: a loop.
 */
import { describe, expect, it } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';
import { STALE_BUILD_PROBE, staleAfterDeclinedMessage, stillStaleNote } from '../../tools/stale-build-guard.js';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

const OLD = '0.5.4+aaaa111', LIVE = '0.5.4+bbbb222';
const REASON = 'this tab already reloaded once for 0.5.4+bbbb222 and came back on 0.5.4+aaaa111 — a cache is still serving the old build; not reloading again';
const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const, screenshotMode: 'never' as const });
const text = (r: { content?: Array<{ text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');
const msg = (r: unknown) => (r as { structuredContent: { error: { message: string; details: Record<string, unknown> } } }).structuredContent.error;

/** A fake controller whose page is stale; the studio's reloadIfStale answer is `studio`. Uses the REAL reloadIfStale. */
function stalePage(studio: Record<string, unknown>) {
  const c = Object.create(PinePaperBrowserController.prototype) as PinePaperBrowserController & Record<string, unknown>;
  Object.assign(c, {
    reloadDeclined: null,
    page: { evaluate: async () => studio },
    isConnected: true,
    waitForPinePaper: async () => undefined, rememberCanvasSize: async () => undefined, plantSessionToken: async () => undefined,
  });
  Object.defineProperty(c, 'connected', { get: () => true });
  c.executeCode = (async (code: string) => code === STALE_BUILD_PROBE
    ? { success: true, result: { state: 'stale', buildId: OLD, liveBuildId: LIVE } }
    : { success: true, result: { success: true, removedCount: 0, remainingItems: 0, svgString: '<svg/>' } }) as never;
  return c;
}
const DECLINED = { reloading: false, stale: true, fromBuild: OLD, toBuild: LIVE, buildId: OLD, liveBuildId: LIVE, reason: REASON };

describe('a reload the studio declines', () => {
  it('clear_canvas says the page is still stale, why, and that clearing again will not help', async () => {
    const c = stalePage(DECLINED);
    const t = text(await handleToolCall('pinepaper_clear_canvas', {}, opts(c)));
    expect(t).toContain(`still on build ${OLD} (live: ${LIVE}) and was not reloaded`);
    expect(t).toContain('a cache is still serving the old build');
    expect(t).toContain('will not change that');
    expect(t).toContain('allowStaleBuild: true');
    expect(t).not.toContain('was reloaded to the live build');
  });

  it('the next export refusal no longer sends the agent to clear_canvas', async () => {
    const c = stalePage(DECLINED);
    await handleToolCall('pinepaper_clear_canvas', {}, opts(c));
    const e = msg(await handleToolCall('pinepaper_export_svg', {}, opts(c)));
    expect(e.message).toContain('already tried and the studio declined it');
    expect(e.message).toContain('pinepaper_clear_canvas will not help');
    expect(e.message).not.toContain('(a) Rebuild the canvas');
    expect(e.details).toMatchObject({ code: 'STALE_BUILD', reloadDeclined: true, exported: false });
  });

  it('allowStaleBuild still exports from that page', async () => {
    const c = stalePage(DECLINED);
    await handleToolCall('pinepaper_clear_canvas', {}, opts(c));
    expect((await handleToolCall('pinepaper_export_svg', { allowStaleBuild: true }, opts(c))).isError).toBeFalsy();
  });

  it('a decline for another live build does not change the refusal: a newer deploy may reload', async () => {
    const c = stalePage({ ...DECLINED, liveBuildId: '0.5.4+cccc333', toBuild: '0.5.4+cccc333' });
    await handleToolCall('pinepaper_clear_canvas', {}, opts(c));
    expect(msg(await handleToolCall('pinepaper_export_svg', {}, opts(c))).message).toContain('(a) Rebuild the canvas');
  });

  it('a current page, or a reload that happens, leaves nothing declined', async () => {
    for (const studio of [{ reloading: false, stale: false, buildId: OLD, liveBuildId: OLD }, { reloading: true, stale: true, fromBuild: OLD, toBuild: LIVE, buildId: OLD, liveBuildId: LIVE }]) {
      const c = stalePage(studio);
      c.reloadDeclined = { buildId: OLD, liveBuildId: LIVE };
      await c.reloadIfStale();
      expect(c.reloadDeclined).toBeNull();
    }
  });

  it('the messages', () => {
    expect(stillStaleNote({ buildId: 'A', liveBuildId: 'B' })).toContain('still on build A (live: B)');
    expect(staleAfterDeclinedMessage('A', 'B', 'why')).toContain('declined it (why)');
  });
});
