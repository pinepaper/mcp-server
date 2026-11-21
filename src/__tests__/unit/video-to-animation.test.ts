/**
 * pinepaper_video_to_animation (1.7.1): the studio's compact retargeter (FxTool #434, live from build 95918847).
 * Everything runs in the page; nothing here loads WASM or reads a file. Faithful by default: `style` reaches the engine
 * only when sent.
 */
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { VideoToAnimationInputSchema, generateVideoToAnimationCode, v2aStagedPayload, V2A_STAGE_KEY } from '../../tools/video-to-animation.js';
import { handleToolCall } from '../../tools/handlers.js';

const frame = () => ({ t: 0, keypoints: Array.from({ length: 133 }, () => [0, 0, 1]), scores: Array(133).fill(1), blendshapes: Array(52).fill(0) });
const lm = () => ({ world: [Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 1 }))] });

/** Runs the generated code against a fake app, the way the page would. */
async function run(input: Record<string, unknown>, app: Record<string, unknown>) {
  const parsed = VideoToAnimationInputSchema.parse(input);
  const code = generateVideoToAnimationCode(parsed);
  const payload = v2aStagedPayload(parsed);
  const window = { __ppStage: payload !== undefined ? { [V2A_STAGE_KEY]: payload } : {} };
  return await new Function('app', 'window', `return ${code.replace(/^\/\/.*\n/, '')}`)(app, window);
}
function fakeApp(answer: Record<string, unknown> = { ok: true, retargeter: 'v2a', skeletonId: 'skeleton_1', mode: 'faithful', keyframesApplied: 11, warnings: [] }, skeletons = ['skeleton_1']) {
  const calls: Array<{ door: string; a: unknown; b?: unknown }> = [];
  const app = {
    riggingSystem: { skeletons: new Map(skeletons.map((s) => [s, {}])) },
    importPoseFromVideo: async (a: unknown, b: unknown) => { calls.push({ door: 'video', a, b }); return answer; },
    importPoseFromLandmarks: async (a: unknown, b: unknown) => { calls.push({ door: 'landmarks', a, b }); return answer; },
    applyVideoToAnimation: async (a: unknown) => { calls.push({ door: 'apply', a }); return answer; },
  };
  return { app, calls };
}

describe('the input', () => {
  it('takes exactly one source', () => {
    expect(VideoToAnimationInputSchema.safeParse({}).success).toBe(false);
    expect(VideoToAnimationInputSchema.safeParse({ video: 'm1', frames: [frame()] }).success).toBe(false);
    for (const src of [{ video: 'm1' }, { landmarks: lm() }, { frames: [frame()] }, { poseStreamBase64: 'AAAA' }]) {
      expect(VideoToAnimationInputSchema.safeParse(src).success).toBe(true);
    }
  });
  it('refuses options that do not apply to the source, and unknown keys', () => {
    expect(VideoToAnimationInputSchema.safeParse({ frames: [frame()], fps: 24 }).success).toBe(false);
    expect(VideoToAnimationInputSchema.safeParse({ poseStreamBase64: 'AAAA', mirror: true }).success).toBe(false);
    expect(VideoToAnimationInputSchema.safeParse({ video: 'm1', satire: {} }).success).toBe(false);
    expect(VideoToAnimationInputSchema.safeParse({ video: 'm1', style: { enforceStoryId: 'x' } }).success).toBe(false);
    expect(VideoToAnimationInputSchema.safeParse({ video: 'm1', trim: { startSec: 2, endSec: 1 } }).success).toBe(false);
  });
  it('a frame must be the compiler layout', () => {
    expect(VideoToAnimationInputSchema.safeParse({ frames: [{ ...frame(), scores: [1] }] }).success).toBe(false);
  });
});

describe('the page code', () => {
  it('a video goes through importPoseFromVideo with the v2a retargeter, faithful (no satire) by default', async () => {
    const { app, calls } = fakeApp();
    const r = await run({ video: 'media_1', trim: { startSec: 1, endSec: 3 }, fps: 12 }, app);
    expect(r.success).toBe(true);
    expect(calls[0]!.door).toBe('video');
    expect(calls[0]!.a).toBe('media_1');
    expect(calls[0]!.b).toMatchObject({ retargeter: 'v2a', skeletonId: 'skeleton_1', fps: 12, startS: 1, endS: 3, lockFootContacts: false, replaceExisting: false });
    expect((calls[0]!.b as Record<string, unknown>).satire).toBeUndefined();
  });
  it('style reaches the engine as its satire, unchanged', async () => {
    const { app, calls } = fakeApp();
    await run({ video: 'media_1', style: { stepTiming: 2, medium: 'ink' } }, app);
    expect((calls[0]!.b as Record<string, unknown>).satire).toEqual({ stepTiming: 2, medium: 'ink' });
  });
  it('landmarks and frames travel staged, and reach their doors intact', async () => {
    const a = fakeApp();
    await run({ landmarks: lm(), skeletonId: 'skeleton_1', mirror: true }, a.app);
    expect(a.calls[0]!.door).toBe('landmarks');
    expect((a.calls[0]!.a as { world: unknown[] }).world.length).toBe(1);
    expect(a.calls[0]!.b).toMatchObject({ retargeter: 'v2a', mirror: true });
    const b = fakeApp();
    await run({ frames: [frame(), frame()] }, b.app);
    expect(b.calls[0]!.door).toBe('apply');
    expect((b.calls[0]!.a as { frames: unknown[] }).frames.length).toBe(2);
    const c = fakeApp();
    await run({ poseStreamBase64: 'data:application/octet-stream;base64,QUJD', replaceExisting: true }, c.app);
    expect(c.calls[0]!.a).toMatchObject({ poseStreamBase64: 'QUJD', replaceExisting: true });
  });
  it('the payload is not inlined in the code', () => {
    const parsed = VideoToAnimationInputSchema.parse({ frames: [frame()] });
    expect(generateVideoToAnimationCode(parsed)).not.toContain('blendshapes');
  });
  it('several rigs and no skeletonId: names them; no rig: says to build one', async () => {
    expect((await run({ video: 'm' }, fakeApp(undefined, ['a', 'b']).app)).error).toContain('Rigs: a, b');
    expect((await run({ video: 'm' }, fakeApp(undefined, []).app)).error).toContain('no rigged character');
  });
  it("the engine's refusal comes back as a failure with its words", async () => {
    const { app } = fakeApp({ ok: false, code: 'would_replace_existing', error: '"P" already has 11 pose keys. Nothing was changed. Pass replaceExisting: true to replace them.' });
    const r = await run({ video: 'm' }, app);
    expect(r).toMatchObject({ success: false, code: 'would_replace_existing' });
    expect(r.error).toContain('replaceExisting: true');
  });
  it('a person seen in few of the frames is warned about, not refused', async () => {
    const few = await run({ video: 'm' }, fakeApp({ ok: true, retargeter: 'v2a', frames: 20, found: 1, warnings: [] }).app);
    expect(few.success).toBe(true);
    expect(few.warnings[0]).toContain('only 1 of 20 frames');
    const most = await run({ video: 'm' }, fakeApp({ ok: true, retargeter: 'v2a', frames: 20, found: 18, warnings: [] }).app);
    expect(most.warnings).toEqual([]);
  });
  it('a fall back to the standard retargeter is not reported as success', async () => {
    const { app } = fakeApp({ ok: true, retargeter: 'bvh', warnings: ['The compact retargeter is not available in this build; using the standard one.'] });
    const r = await run({ video: 'm' }, app);
    expect(r).toMatchObject({ success: false, code: 'v2a_unavailable' });
  });
  it('an older studio without the door says so', async () => {
    const r = await run({ video: 'm' }, { riggingSystem: { skeletons: new Map([['s', {}]]) } });
    expect(r.success).toBe(false);
    expect(r.error).toContain('no video-to-animation');
  });
});

describe('the package', () => {
  it('the module loads no WASM, reads no file and imports nothing dynamically', () => {
    const src = readFileSync(join(import.meta.dir, '../../tools/video-to-animation.ts'), 'utf8');
    expect(src).not.toMatch(/node:fs|from 'fs'|readFileSync|import\(|\.wasm|\/Users\//);
  });
  it('code mode returns the code with the payload staged beside it', async () => {
    const r = await handleToolCall('pinepaper_video_to_animation', { frames: [frame()] }, { executeInBrowser: false, executionMode: 'code' } as never);
    expect(r.isError).toBeFalsy();
  });
});
