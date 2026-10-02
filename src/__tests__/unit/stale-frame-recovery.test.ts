/**
 * Stale-frame recovery — regression tests.
 *
 * Before this, a detached frame (tab reloaded / main frame swapped) hard-failed
 * executeCode and left isConnected=true, so every subsequent call returned the
 * same error until the caller manually disconnected — and disconnect+connect
 * relaunches the browser, throwing away the canvas. Found while rebuilding the
 * ICML GAUGE reproduction poster twice for exactly this reason (2026-07-31).
 */

import { describe, it, expect } from 'bun:test';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';

// isStaleFrameError / reacquirePage are private; exercise them through the
// instance without widening the public surface.
type Internals = {
  isStaleFrameError(e: unknown): boolean;
  reacquirePage(): Promise<boolean>;
  recoverSession(): Promise<false | { kind: string; canvasSizeRestored?: { width: number; height: number } }>;
  lastCanvasSize: { width: number; height: number } | null;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  browser: unknown;
  page: unknown;
  isConnected: boolean;
};
const internals = (c: PinePaperBrowserController) => c as unknown as Internals;
const statics = PinePaperBrowserController as unknown as { isStaleFrameError(e: unknown): boolean };

describe('stale-frame recovery', () => {
  describe('isStaleFrameError', () => {
    it('matches the Puppeteer stale-handle error family', () => {
      const staleErrors = [
        new Error("Attempted to use detached Frame '94AB9FC8C673E42C51A2D3F96194198D'."),
        new Error('Protocol error: Target closed.'),
        new Error('Session closed. Most likely the page has been closed.'),
        new Error('Execution context was destroyed, most likely because of a navigation.'),
        new Error('Requesting main frame too early!'),
      ];
      for (const e of staleErrors) {
        expect(statics.isStaleFrameError(e)).toBe(true);
      }
    });

    it('does NOT match ordinary execution failures', () => {
      // Recovering from these would retry a genuinely broken batch and could
      // double-apply canvas mutations.
      const realErrors = [
        new Error('app is not defined'),
        new Error('PP_ITEM_BUDGET: too many items'),
        new Error("Cannot read properties of undefined (reading 'position')"),
        new Error('Validation error: Invalid input parameters'),
      ];
      for (const e of realErrors) {
        expect(statics.isStaleFrameError(e)).toBe(false);
      }
    });

    it('handles non-Error throwables', () => {
      expect(statics.isStaleFrameError('Attempted to use detached Frame')).toBe(true);
      expect(statics.isStaleFrameError(undefined)).toBe(false);
    });
  });

  describe('reacquirePage', () => {
    const controller = () => new PinePaperBrowserController({ studioUrl: 'http://localhost:3100' });

    it('rebinds to the editor page without relaunching the browser', async () => {
      const c = controller();
      const editorPage = { url: () => 'http://localhost:3100/editor.html?agent=1', evaluate: async () => true };
      const otherPage = { url: () => 'about:blank', evaluate: async () => true };
      let closed = false;
      internals(c).browser = {
        pages: async () => [otherPage, editorPage],
        close: async () => { closed = true; },
      };

      expect(await internals(c).reacquirePage()).toBe(true);
      expect(internals(c).page).toBe(editorPage as never);
      expect(internals(c).isConnected).toBe(true);
      // The whole point: the browser survives, so the session/scene can too.
      expect(closed).toBe(false);
    });

    it('falls back to the first page when no editor tab matches', async () => {
      const c = controller();
      const only = { url: () => 'about:blank', evaluate: async () => true };
      internals(c).browser = { pages: async () => [only] };

      expect(await internals(c).reacquirePage()).toBe(true);
      expect(internals(c).page).toBe(only as never);
    });

    it('fails cleanly when the candidate page is also dead', async () => {
      const c = controller();
      const dead = {
        url: () => 'http://localhost:3100/editor.html',
        evaluate: async () => { throw new Error('Attempted to use detached Frame'); },
      };
      internals(c).browser = { pages: async () => [dead] };

      expect(await internals(c).reacquirePage()).toBe(false);
    });

    it('fails cleanly when there is no browser or no pages', async () => {
      const noBrowser = controller();
      internals(noBrowser).browser = null;
      expect(await internals(noBrowser).reacquirePage()).toBe(false);

      const noPages = controller();
      internals(noPages).browser = { pages: async () => [] };
      expect(await internals(noPages).reacquirePage()).toBe(false);
    });
  });

  // M6 (2026-10-02): after ~2 days idle EVERY frame was detached, so there was
  // no live tab to re-bind; every tool, refresh_page included, failed until a
  // manual disconnect + connect, which then came back at 800x600.
  describe('recoverSession / refreshPage (M6)', () => {
    const controller = () => new PinePaperBrowserController({ studioUrl: 'http://localhost:3100' });
    const deadBrowser = () => ({
      pages: async () => [{ url: () => 'http://localhost:3100/editor', evaluate: async () => { throw new Error('Attempted to use detached Frame'); } }],
      close: async () => {},
    });

    it('relaunches when no tab answers, and puts the last canvas size back', async () => {
      const c = controller();
      const calls: unknown[][] = [];
      const fresh = { url: () => 'http://localhost:3100/editor', evaluate: async (_fn: unknown, ...args: unknown[]) => { calls.push(args); return true; } };
      internals(c).browser = deadBrowser();
      internals(c).lastCanvasSize = { width: 1080, height: 1920 };
      internals(c).connect = async () => { internals(c).page = fresh; internals(c).isConnected = true; };
      const r = await internals(c).recoverSession();
      expect(r).toEqual({ kind: 'relaunched', canvasSizeRestored: { width: 1080, height: 1920 } });
      expect(calls).toContainEqual([1080, 1920]);
    });

    it('prefers re-binding a live tab, which keeps the scene', async () => {
      const c = controller();
      let relaunched = false;
      internals(c).browser = { pages: async () => [{ url: () => 'http://localhost:3100/editor', evaluate: async () => true }] };
      internals(c).connect = async () => { relaunched = true; };
      expect(await internals(c).recoverSession()).toEqual({ kind: 'reacquired' });
      expect(relaunched).toBe(false);
    });

    it('refresh_page recovers a detached frame instead of failing with it', async () => {
      const c = controller();
      internals(c).page = { reload: async () => { throw new Error('Attempted to use detached Frame 03F56A62'); } };
      internals(c).isConnected = true;
      internals(c).browser = deadBrowser();
      internals(c).lastCanvasSize = { width: 1280, height: 720 };
      internals(c).connect = async () => {
        internals(c).page = { url: () => 'x', evaluate: async () => true };
        internals(c).isConnected = true;
      };
      const r = await c.refreshPage();
      expect(r).toEqual({ relaunched: true, canvasSizeRestored: { width: 1280, height: 720 } });
    });

    it('when nothing works, says to call browser_connect', async () => {
      const c = controller();
      internals(c).page = { reload: async () => { throw new Error('Target closed'); } };
      internals(c).isConnected = true;
      internals(c).browser = deadBrowser();
      internals(c).connect = async () => { throw new Error('launch failed'); };
      await expect(c.refreshPage()).rejects.toThrow('pinepaper_browser_connect');
    });
  });
});
