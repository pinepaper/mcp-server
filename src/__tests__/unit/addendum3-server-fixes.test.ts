/**
 * Tester addendum #3 (2026-11-20), the server-side items:
 *  - COLORBAD37 background route: "#notacolor" set as a background returned success and drew black.
 *  - DEFORMWARN40: a deform that rendered was reported NO CHANGE (its state lives in the engine's deform registry).
 *  - EASESTART40: easing on the first keyframe does nothing by default; it was said only in a note, not a warning.
 *  - IMPURL40: a public name resolving into 198.18.0.0/15 (a fake-IP DNS proxy) was refused with advice that does
 *    not help there.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import {
  BackgroundInputSchema,
  AgentBatchExecuteInputSchema,
  AgentStartJobInputSchema,
  AgentResetInputSchema,
  CreateSceneInputSchema,
} from '../../types/schemas.js';
import { EFFECT_BEFORE_JS } from '../../tools/effect-check.js';
import { PinePaperCodeGenerator, firstKeyEasingNoEffect } from '../../types/code-generator.js';
import { safeFetch, safeFetchDeps, UnsafeUrlError } from '../../utils/safe-fetch.js';

describe('COLORBAD37 background routes refuse a string that is not a colour', () => {
  it('pinepaper_background set', () => {
    expect(BackgroundInputSchema.safeParse({ action: 'set', mode: 'color', color: '#notacolor' }).success).toBe(false);
    expect(BackgroundInputSchema.safeParse({ action: 'set', mode: 'color', color: '#0b1020' }).success).toBe(true);
    expect(BackgroundInputSchema.safeParse({ action: 'get' }).success).toBe(true);
  });
  it('start_job, reset and create_scene backgroundColor', () => {
    expect(AgentStartJobInputSchema.safeParse({ backgroundColor: '#notacolor' }).success).toBe(false);
    expect(AgentStartJobInputSchema.safeParse({ backgroundColor: 'navy' }).success).toBe(true);
    expect(AgentResetInputSchema.safeParse({ backgroundColor: 'notacolor' }).success).toBe(false);
    const scene = CreateSceneInputSchema.safeParse({ backgroundColor: '#zzz', items: [] });
    expect(scene.success).toBe(false);
    expect(JSON.stringify(scene.error?.issues)).toContain('is not a colour');
  });
  it('a batch set_background, by backgroundColor or by its color alias; color on other ops is not judged here', () => {
    const ops = (op: Record<string, unknown>) => AgentBatchExecuteInputSchema.safeParse({ operations: [op] });
    expect(ops({ type: 'set_background', backgroundColor: '#notacolor' }).success).toBe(false);
    const alias = ops({ type: 'set_background', color: '#notacolor' });
    expect(alias.success).toBe(false);
    expect(JSON.stringify(alias.error?.issues)).toContain('is not a colour');
    expect(ops({ type: 'set_background', color: 'rgb(11, 16, 32)' }).success).toBe(true);
  });
});

describe('DEFORMWARN40 the no-change fingerprint sees deformations', () => {
  const run = (deformPresets: unknown, initialized: string[]) => {
    const app = { _initialized: new Set(initialized), deformPresets };
    const window: Record<string, unknown> = {};
    new Function('app', 'window', EFFECT_BEFORE_JS)(app, window);
    return window.__ppEffectBefore as Record<string, string>;
  };
  it('a deform applied changes the fingerprint', () => {
    const active = new Map();
    const before = run({ _active: active }, ['deformPresets']).deforms;
    active.set('item_3', { presetName: 'wave', params: { amplitude: 1 }, item: { circular: null }, snapshot: {} });
    const after = run({ _active: active }, ['deformPresets']).deforms;
    expect(before).not.toBe(after);
    expect(after).toContain('wave');
  });
  it('the lazy deform system is not built just to fingerprint', () => {
    let built = false;
    const app = { _initialized: new Set<string>() } as Record<string, unknown>;
    Object.defineProperty(app, 'deformPresets', { get: () => { built = true; return { _active: new Map() }; } });
    new Function('app', 'window', EFFECT_BEFORE_JS)(app, {});
    expect(built).toBe(false);
  });
});

describe('EASESTART40 first-key easing is a warning, not only a note', () => {
  const kf = (e0?: string, e1?: string) => [
    { time: 0, properties: { x: 100 }, ...(e0 ? { easing: e0 } : {}) },
    { time: 1, properties: { x: 1100 }, ...(e1 ? { easing: e1 } : {}) },
  ];
  it('says it for an easing on the first key only', () => {
    expect(firstKeyEasingNoEffect(kf('easeInOut') as never)).toContain('no effect');
    expect(firstKeyEasingNoEffect(kf(undefined, 'easeInOut') as never)).toBeNull();
    expect(firstKeyEasingNoEffect(kf('linear') as never)).toBeNull();
    expect(firstKeyEasingNoEffect(kf('easeInOut') as never, { easingAt: 'departure' })).toBeNull();
    expect(firstKeyEasingNoEffect(kf('easeInOut') as never, { append: true })).toBeNull();
  });
  it('the generated code pushes it into the warning', () => {
    const code = new PinePaperCodeGenerator().generateKeyframeAnimate({ itemId: 'item_1', keyframes: kf('easeInOut') } as never);
    expect(code).toMatch(/__warn\.push\("easing 'easeInOut' is on the first keyframe/);
  });
});

describe('IMPURL40 a fake-IP DNS answer is named as one', () => {
  const saved = { ...safeFetchDeps };
  afterEach(() => { Object.assign(safeFetchDeps, saved); delete process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK; });
  it('refuses with the local-path route, not only the opt-in', async () => {
    safeFetchDeps.lookup = async () => [{ address: '198.18.0.42', family: 4 }];
    const err = await safeFetch('https://images.example.com/a.png').then(() => null, (e) => e);
    expect(err).toBeInstanceOf(UnsafeUrlError);
    expect(String(err.message)).toContain('fake-IP DNS proxy');
    expect(String(err.message)).toContain('local path');
  });
  it('an ordinary private answer keeps the old message', async () => {
    safeFetchDeps.lookup = async () => [{ address: '10.0.0.5', family: 4 }];
    const err = await safeFetch('https://intranet.example.com/a.png').then(() => null, (e) => e);
    expect(String(err.message)).toContain('a private address');
    expect(String(err.message)).not.toContain('fake-IP');
  });
});

describe('EASELAST170 easing on the last key under departure', () => {
  const kf = (first?: string, last?: string) => [{ time: 0.5, properties: { x: 200 }, ...(first ? { easing: first } : {}) }, { time: 2.5, properties: { x: 1400 }, ...(last ? { easing: last } : {}) }];
  it('is said: nothing leaves the last key', () => {
    expect(firstKeyEasingNoEffect(kf(undefined, 'easeInOut') as never, { easingAt: 'departure' })).toContain('on the last keyframe');
  });
  it('is not said on the first key, on a loop, or for an arrival reading', () => {
    expect(firstKeyEasingNoEffect(kf('easeInOut') as never, { easingAt: 'departure' })).toBeNull();
    expect(firstKeyEasingNoEffect(kf(undefined, 'easeInOut') as never, { easingAt: 'departure', loop: true })).toBeNull();
    expect(firstKeyEasingNoEffect(kf(undefined, 'easeInOut') as never)).toBeNull();
    expect(firstKeyEasingNoEffect(kf(undefined, 'hold') as never, { easingAt: 'departure' })).toBeNull();
  });
});
