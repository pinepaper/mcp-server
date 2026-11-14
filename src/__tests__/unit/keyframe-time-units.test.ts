/**
 * LONGKEY36 / GRIEF: a 120 s scene exported frozen at its end state from t = 0.5 s, reported as a success.
 *
 * With no unit given, the studio guesses (FxTool core/TimeUnits.js): if any keyframe time or the duration is over
 * 100, EVERY time is read as milliseconds and divided by 1000. A track with keys at 0..120 s ran in 0.12 s. The
 * tool documents seconds, so the server now always says seconds, and a track past 100 s gets a note naming the
 * unit, for a caller who meant milliseconds.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** Run the emitted keyframe call against a stub studio, returning the options addAnimation received and the reply. */
function run(code: string) {
  const seen: Array<Record<string, unknown>> = [];
  const item = { data: { keyframes: [] as unknown[] } };
  const app = {
    getItemById: () => item, itemRegistry: { get: () => ({ item }) },
    addAnimation: (_id: unknown, kfs: unknown[], opts: Record<string, unknown>) => { seen.push(opts); item.data.keyframes = kfs; },
  };
  const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  const out = new Function('app', `return ${body.trim().replace(/;\s*$/, '')}`)(app);
  return { opts: seen[0], out };
}

describe('keyframe times are seconds unless the caller says ms', () => {
  it('pinepaper_keyframe_animate passes timeUnits seconds, and says so past 100 s', () => {
    const { opts, out } = run(codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 120, properties: { x: 900 } }] } as never));
    expect(opts.timeUnits).toBe('seconds');
    expect(out.warning).toContain("times are read as seconds: the track ends at 120 s (2.0 min). If you meant milliseconds, pass timeUnits: 'ms'.");
  });

  it('a short track carries no note, and an explicit ms is passed through', () => {
    expect(run(codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 30, properties: { x: 9 } }] } as never)).out.warning ?? '').not.toContain('read as seconds');
    const ms = run(codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', timeUnits: 'ms', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 2000, properties: { x: 9 } }] } as never));
    expect(ms.opts.timeUnits).toBe('ms');
    expect(ms.out.warning ?? '').not.toContain('read as seconds');
  });

  it('a batch keyframe op does the same', () => {
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'keyframe_animate', itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 150, properties: { x: 1 } }] }] } as never);
    expect(code).toContain('timeUnits: "seconds"');
    expect(code).toContain('timeUnitsNote: "times are read as seconds: the track ends at 150 s (2.5 min).');
  });
});

/** A studio that rescales: any key over 100 divides every key by 1000, whatever timeUnits says (prod, 2026-11-14). */
function studio(rescales: boolean, prior: Array<{ time: number; properties: Record<string, number> }> = []) {
  const item: { data: { keyframes: Array<{ time: number }>; timeOffset?: number } } = { data: { keyframes: prior.slice() } };
  const calls: Array<Record<string, unknown>> = [];
  let cleared = false;
  const app = {
    getItemById: () => item, itemRegistry: { get: () => ({ item }) },
    clearKeyframes: () => { cleared = true; item.data.keyframes = []; },
    addAnimation: (_id: unknown, kfs: Array<{ time: number }>, opts: Record<string, unknown>) => {
      calls.push({ ...opts });
      const big = kfs.some((k) => k.time > 100);
      item.data.keyframes = kfs.map((k) => ({ ...k, time: rescales && big ? k.time / 1000 : k.time }));
      if (opts.timeOffset !== undefined) item.data.timeOffset = Number(opts.timeOffset);
    },
  };
  return { app, item, calls, wasCleared: () => cleared };
}
const exec = (code: string, app: unknown) => new Function('app', `return ${code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').trim().replace(/;\s*$/, '')}`)(app);
const kf = (times: number[]) => codeGenerator.generateKeyframeAnimate({ itemId: 'item_1', keyframes: times.map((t, i) => ({ time: t, properties: { x: i } })) } as never);

describe('the key times are read back after the write (LONGKEY36)', () => {
  it('a studio that keeps the times: success, nothing shifted', () => {
    const s = studio(false);
    const r = exec(kf([0, 60, 120]), s.app);
    expect(r.success).toBe(true);
    expect(r.shifted).toBeUndefined();
  });

  it('a rescaling studio and a track spanning more than 100 s: fails, names both times, removes the bad track', () => {
    const s = studio(true);
    const r = exec(kf([0, 60, 120]), s.app);
    expect(r.success).toBe(false);
    expect(r.code).toBe('keyframe_times_not_kept');
    expect(r.error).toContain('asked 0..120 s, it stored 0, 0.06, 0.12 s');
    expect(r.error).toContain('span more than 100 s');
    expect(s.wasCleared()).toBe(true);
  });

  it('the earlier track is put back, not removed', () => {
    const s = studio(true, [{ time: 0, properties: { x: 5 } }, { time: 3, properties: { x: 9 } }]);
    const r = exec(kf([0, 120]), s.app);
    expect(r.success).toBe(false);
    expect(r.error).toContain('The earlier track was put back.');
    expect(s.item.data.keyframes.map((k) => k.time)).toEqual([0, 3]);
  });

  it('a rescaling studio and a late track within 100 s: rewritten from 0 with timeOffset, and said', () => {
    const s = studio(true);
    const r = exec(kf([50, 90, 140]), s.app);
    expect(r.success).toBe(true);
    expect(r.shifted.by).toBe(50);
    expect(s.item.data.keyframes.map((k) => k.time)).toEqual([0, 40, 90]);
    expect(s.item.data.timeOffset).toBe(50);
  });

  it('a batch op is checked the same way', async () => {
    const s = studio(true);
    const code = codeGenerator.generateAgentBatchExecute({ atomic: false, operations: [{ type: 'keyframe_animate', itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 120, properties: { x: 1 } }] }] } as never);
    const r = await (new Function('app', `return ${code.split('\n').filter((l) => !l.startsWith('//')).join('\n')}`)({ ...s.app, getCanvasSize: () => ({ width: 1, height: 1 }), historyManager: { saveState() {} } }) as Promise<{ success: boolean; failures: Array<{ reason: string }> }>);
    expect(r.success).toBe(false);
    expect(r.failures[0].reason).toContain('the studio did not keep the key times');
  });
});
