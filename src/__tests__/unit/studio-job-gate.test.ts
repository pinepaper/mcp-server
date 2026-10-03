/** D92: a stale studio reloads at start_job (and only there), then the job opens on the new page. */
import { describe, it, expect } from 'bun:test';
import { studioJobGate } from '../../tools/handlers.js';

const noWait = async () => undefined;
function controller(script: Array<(code: string) => any>) {
  const seen: string[] = [];
  let i = 0;
  return {
    seen,
    connected: true,
    connect: async () => undefined,
    executeCode: async (code: string) => {
      seen.push(code.includes('waitForReady') ? 'ready' : 'start');
      const step = script[Math.min(i++, script.length - 1)];
      return step(code);
    },
  };
}
const opts = (c: unknown) => ({ executeInBrowser: true, browserController: c as never, executionMode: 'puppeteer' as const });

describe('studio job gate', () => {
  it('stale + clearing: waits through the reload, opens the job again, and says so', async () => {
    const c = controller([
      () => ({ success: true, result: { reloading: true, jobOpen: false, fromBuild: '0.5.4-beta+aaa', toBuild: '0.5.4-beta+bbb', stale: true } }),
      () => { throw new Error('Execution context was destroyed'); },          // mid-navigation
      () => ({ success: true, result: { ready: true } }),
      () => ({ success: true, result: { reloading: false, jobOpen: true, buildId: '0.5.4-beta+bbb', liveBuildId: '0.5.4-beta+bbb', stale: false } }),
    ]);
    const g = await studioJobGate({ name: 'x' }, opts(c), noWait);
    expect(c.seen).toEqual(['start', 'ready', 'ready', 'start']);
    expect(g.note).toBe('Studio was on build 0.5.4-beta+aaa, reloaded to 0.5.4-beta+bbb before this job.');
    expect(g.warning).toBeUndefined();
    expect(g.build).toMatchObject({ stale: false });
  });
  it('stale + clearCanvas:false: no reload, a warning to finish then start a new job', async () => {
    const c = controller([() => ({ success: true, result: { reloading: false, jobOpen: true, buildId: 'old', liveBuildId: 'new', stale: true } })]);
    const g = await studioJobGate({ clearCanvas: false }, opts(c), noWait);
    expect(c.seen).toEqual(['start']);
    expect(g.warning).toBe('studio is on old build old (live: new); finish, then start a new job to update.');
  });
  it('a studio without PinePaperAgent is left alone', async () => {
    const c = controller([() => ({ success: true, result: { legacy: true } })]);
    expect(await studioJobGate({}, opts(c), noWait)).toEqual({});
  });
});
