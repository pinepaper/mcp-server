/**
 * pinepaper_video_to_animation: a person's movement onto a rigged character, through the studio's compact retargeter.
 *
 * EVERYTHING RUNS IN THE STUDIO. The pose model, the Rust/WASM compiler and the apply are the editor's own
 * (`app.importPoseFromVideo`, `app.importPoseFromLandmarks`, `app.applyVideoToAnimation`, FxTool #434, live since build
 * 95918847). This package ships no WASM and reads no file: a video reaches the page through pinepaper_media
 * upload_video, which already takes a URL or a local path, and this tool names the clip by the id that returned.
 *
 * The engine is FAITHFUL BY DEFAULT (owner, 2026-11-20): with no `style` the rotations follow the source. Nothing is
 * defaulted here; `style` reaches the engine (as its `satire`) only when the caller sent one.
 *
 * ADDITIVE: the engine refuses a rig that already has pose keys, a root track or a step timing unless replaceExisting
 * is true. That refusal comes back as an error with the engine's own words.
 *
 * Held out of 1.7.0 (parked as backup/v2a-4425e6a: it loaded WASM from a sibling checkout or a home path, and its
 * stateless compile tool has no door in the studio, so it was dropped with the owner's agreement, 2026-11-21).
 */
import { z } from 'zod';

const FrameSchema = z.object({
  t: z.number().finite(),
  keypoints: z.array(z.array(z.number().finite()).length(3)).length(133),
  scores: z.array(z.number().finite()).length(133),
  blendshapes: z.array(z.number().finite()).length(52),
});

const LandmarkSchema = z.object({ x: z.number(), y: z.number(), z: z.number().optional(), visibility: z.number().optional() }).passthrough();
const LandmarkFrame = z.array(LandmarkSchema).length(33).nullable();

export const VideoToAnimationInputSchema = z.object({
  skeletonId: z.string().min(1).optional()
    .describe('The rig to drive (pinepaper_rigging list_skeletons). Optional when the scene has exactly one.'),
  video: z.string().min(1).optional()
    .describe('A clip already in the studio: the id or registryId that pinepaper_media upload_video returned.'),
  landmarks: z.object({
    world: z.array(LandmarkFrame).min(1),
    image: z.array(LandmarkFrame).optional(),
    fps: z.number().positive().optional(),
    aspect: z.number().positive().optional(),
  }).optional().describe('A pose found elsewhere: per frame, 33 MediaPipe BlazePose landmarks (null where no person).'),
  frames: z.array(FrameSchema).min(1).optional()
    .describe('Pre-extracted frames in the compiler\'s own layout: {t, keypoints[133][3], scores[133], blendshapes[52]}.'),
  poseStreamBase64: z.string().min(1).optional()
    .describe('The same frames as the studio\'s binary pose stream, base64.'),
  trim: z.object({ startSec: z.number().min(0), endSec: z.number().min(0) })
    .refine((t) => t.endSec > t.startSec, { message: 'endSec must be after startSec' }).optional()
    .describe('Use only this part of the source, in seconds.'),
  fps: z.number().positive().max(60).optional().describe('video: frames sampled per second (default 24).'),
  maxFrames: z.number().int().positive().max(3000).optional().describe('video: most frames sampled (default 600).'),
  mirror: z.boolean().optional().describe('video/landmarks: swap left and right (a selfie video).'),
  minVisibility: z.number().min(0).max(1).optional().describe('video/landmarks: landmarks less visible than this are ignored (default 0.5).'),
  smoothing: z.object({
    minCutoffHz: z.number().min(0.1).max(15).optional(),
    beta: z.number().min(0).max(1).optional(),
    rdpToleranceDeg: z.number().min(0.5).max(15).optional(),
  }).optional().describe('Jitter filter and key tolerance; the default is light and is reported in the result.'),
  style: z.object({
    caricatureGain: z.number().min(1).max(1.8).optional().describe('1 = as performed; up to 1.8 exaggerates each pose.'),
    stepTiming: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional().describe('2 = hold each pose for two frames (on twos), 3 = on threes.'),
    medium: z.enum(['vector', 'ink', 'cutPaper', 'watercolor']).optional().describe('A drawn look for the character\'s parts.'),
    lockFootContacts: z.boolean().optional().describe('Pin planted feet so they do not slide (default true once style is given).'),
    secondaryMotionChains: z.number().int().min(0).max(10).optional().describe('How many follow-through wiggles to add.'),
  }).strict().optional().describe('Stylise the motion. Leave out for a faithful copy of the performance.'),
  lockFootContacts: z.boolean().optional().describe('Pin planted feet without stylising anything else.'),
  replaceExisting: z.boolean().optional().describe('Replace the rig\'s own pose keys, root track and step timing (default: refuse and change nothing).'),
}).strict().superRefine((v, ctx) => {
  const sources = (['video', 'landmarks', 'frames', 'poseStreamBase64'] as const).filter((k) => v[k] !== undefined);
  if (sources.length !== 1) {
    ctx.addIssue({ code: 'custom', path: ['video'], message: `pass exactly one source: video, landmarks, frames or poseStreamBase64 (got ${sources.length ? sources.join(', ') : 'none'})` });
  }
  if (v.video === undefined) {
    for (const k of ['fps', 'maxFrames'] as const) {
      if (v[k] !== undefined) ctx.addIssue({ code: 'custom', path: [k], message: `${k} applies to a video source only` });
    }
  }
  if ((v.frames !== undefined || v.poseStreamBase64 !== undefined) && (v.mirror !== undefined || v.minVisibility !== undefined)) {
    ctx.addIssue({ code: 'custom', path: [v.mirror !== undefined ? 'mirror' : 'minVisibility'], message: 'mirror and minVisibility apply to a video or landmarks source' });
  }
});
export type VideoToAnimationInput = z.infer<typeof VideoToAnimationInputSchema>;

/** The stage key the pose payload travels under (window.__ppStage), beside the code rather than inside it. */
export const V2A_STAGE_KEY = 'v2a_payload';

/** What is staged: the source's bytes, which can be hundreds of KB (2,336 bytes a frame in the binary stream). */
export function v2aStagedPayload(input: VideoToAnimationInput): string | undefined {
  if (input.landmarks) return JSON.stringify(input.landmarks);
  if (input.frames) return JSON.stringify(input.frames);
  if (input.poseStreamBase64) return input.poseStreamBase64.replace(/^data:[^,]*,/, '');
  return undefined;
}

/** The page code. The payload is read from window.__ppStage[V2A_STAGE_KEY]; everything else is inline. */
export function generateVideoToAnimationCode(input: VideoToAnimationInput): string {
  const S = (v: unknown) => JSON.stringify(v ?? null);
  const satire = input.style ? S(input.style) : 'undefined';
  const smoothing = input.smoothing ? S(input.smoothing) : 'undefined';
  const source = input.video !== undefined ? 'video' : input.landmarks ? 'landmarks' : input.frames ? 'frames' : 'stream';
  return `
// Video to animation: the studio's compact retargeter drives a rig
(async function() {
  if (typeof app.applyVideoToAnimation !== 'function' || typeof app.importPoseFromLandmarks !== 'function') {
    return { success: false, error: 'this studio build has no video-to-animation (app.applyVideoToAnimation): it needs build 95918847 or later' };
  }
  const source = ${S(source)};
  let skeletonId = ${S(input.skeletonId)};
  if (!skeletonId && source !== 'frames' && source !== 'stream') {
    const R = app.riggingSystem;
    const all = R && R.skeletons ? Array.from(R.skeletons.keys()) : [];
    if (all.length !== 1) {
      return { success: false, error: all.length ? 'name the rig to drive: skeletonId. Rigs: ' + all.join(', ') : 'the scene has no rigged character: build one with pinepaper_rigging first', skeletons: all };
    }
    skeletonId = all[0];
  }
  const staged = window.__ppStage && window.__ppStage[${S(V2A_STAGE_KEY)}];
  const common = {
    satire: ${satire},
    smoothing: ${smoothing},
    lockFootContacts: ${input.lockFootContacts === true},
    replaceExisting: ${input.replaceExisting === true},
  };
  let r;
  if (source === 'video') {
    r = await app.importPoseFromVideo(${S(input.video)}, Object.assign({
      retargeter: 'v2a', skeletonId: skeletonId,
      fps: ${S(input.fps)} || undefined, maxFrames: ${S(input.maxFrames)} || undefined,
      startS: ${S(input.trim?.startSec)} ?? undefined, endS: ${S(input.trim?.endSec)} ?? undefined,
      mirror: ${input.mirror === true}, minVisibility: ${S(input.minVisibility)} ?? undefined,
    }, common));
  } else if (source === 'landmarks') {
    r = await app.importPoseFromLandmarks(JSON.parse(staged), Object.assign({
      retargeter: 'v2a', skeletonId: skeletonId, trim: ${S(input.trim)} || undefined,
      mirror: ${input.mirror === true}, minVisibility: ${S(input.minVisibility)} ?? undefined,
    }, common));
  } else {
    r = await app.applyVideoToAnimation(Object.assign({
      targetCharacterId: skeletonId || undefined, trim: ${S(input.trim)} || undefined,
    }, source === 'frames' ? { frames: JSON.parse(staged) } : { poseStreamBase64: staged }, common));
  }
  if (!r || r.ok === false) {
    return { success: false, code: r && r.code, error: (r && (r.error || r.reason)) || 'the studio did not apply the motion', skeletons: r && r.skeletons, skippedBones: r && r.skippedBones };
  }
  // The engine falls back to its standard retargeter when this build has no compact one; that is not what was asked.
  if (r.retargeter && r.retargeter !== 'v2a') {
    return { success: false, code: 'v2a_unavailable', error: 'the studio has no compact retargeter in this build and used the standard one instead: ' + ((r.warnings || [])[0] || ''), applied: { retargeter: r.retargeter, skeletonId: r.skeletonId } };
  }
  const warnings = (r.warnings || []).slice();
  // A detector can see a person in a frame or two of a clip that has none (prod, 2026-11-21: 1 of 20 frames of a clip
  // with nobody in it), and the motion is then built from that. Said, not refused: a short glimpse can be real.
  if (typeof r.frames === 'number' && typeof r.found === 'number' && r.frames > 0 && r.found < r.frames / 2) {
    warnings.unshift('A person was found in only ' + r.found + ' of ' + r.frames + ' frames, so the motion comes from those alone. Check the result before building on it; a clip with nobody in it can still produce a stray detection.');
  }
  return {
    success: true,
    skeletonId: r.skeletonId || skeletonId,
    mode: r.mode,
    keyframesApplied: r.keyframesApplied,
    frames: r.frames, found: r.found,
    footLock: r.footLock, stepTiming: r.stepTiming, mediumAppliedCount: r.mediumAppliedCount,
    smoothing: r.smoothing,
    skippedBones: r.skippedBones || [],
    replaced: r.replaced, kept: r.kept,
    facialActionCount: r.facialActionCount, facialApplied: r.facialApplied,
    adapter: r.adapter,
    warnings: warnings,
  };
})();`.trim();
}

export const VIDEO_TO_ANIMATION_DESCRIPTION: string = `Copy a person's movement onto a rigged character: from a video of them, or from pose data found elsewhere. The studio finds the pose on the device, turns it into a few curve-fitted pose keys per bone, and applies them to the rig as one undo step.

SOURCE (exactly one):
- video: a clip already in the studio. Upload it first with pinepaper_media upload_video (a URL or a local path) and pass the id it returns.
- landmarks: per frame, the 33 MediaPipe BlazePose landmarks, from another tool or a recorded session.
- frames / poseStreamBase64: pre-extracted frames in the compiler's own layout.

THE RIG: skeletonId names it (optional when the scene has one rig). It must have bones named spine, head, clavR, upperarmR, forearmR, handR, clavL, upperarmL, forearmL, handL, hipR, thighR, shinR, hipL, thighL, shinL (pinepaper_rigging add_bone with these names). Bones it lacks are skipped and listed.

FAITHFUL BY DEFAULT: without style the joints follow the performance, with only a light jitter filter. style asks for a drawn performance: caricatureGain exaggerates, stepTiming 2 holds each pose for two frames, medium gives the parts a drawn look, lockFootContacts pins planted feet. lockFootContacts alone pins the feet without stylising.

A rig that already has pose keys is refused and nothing changes; pass replaceExisting: true to replace them.

RESULT: skeletonId, mode (faithful | stylised), keyframesApplied, frames and found (frames with a person), skippedBones, what was replaced or kept, warnings. Facial movement is compiled but not drawn yet.

USE pinepaper_import_motion_capture for a .bvh file.`;

export const VIDEO_TO_ANIMATION_JSON_SCHEMA = {
  type: 'object',
  properties: {
    skeletonId: { type: 'string', description: 'The rig to drive (pinepaper_rigging list_skeletons). Optional when the scene has exactly one.' },
    video: { type: 'string', description: 'A clip already in the studio: the id or registryId pinepaper_media upload_video returned.' },
    landmarks: {
      type: 'object',
      description: 'A pose found elsewhere: world (per frame, 33 BlazePose landmarks {x,y,z,visibility} or null), optional image (same, normalised), fps, aspect.',
      properties: { world: { type: 'array' }, image: { type: 'array' }, fps: { type: 'number' }, aspect: { type: 'number' } },
      required: ['world'],
    },
    frames: { type: 'array', description: "Pre-extracted frames in the compiler's layout: {t, keypoints[133][3], scores[133], blendshapes[52]}." },
    poseStreamBase64: { type: 'string', description: "The same frames as the studio's binary pose stream, base64." },
    trim: { type: 'object', properties: { startSec: { type: 'number' }, endSec: { type: 'number' } }, required: ['startSec', 'endSec'], description: 'Use only this part of the source, in seconds.' },
    fps: { type: 'number', description: 'video: frames sampled per second (default 24).' },
    maxFrames: { type: 'number', description: 'video: most frames sampled (default 600).' },
    mirror: { type: 'boolean', description: 'video/landmarks: swap left and right (a selfie video).' },
    minVisibility: { type: 'number', description: 'video/landmarks: landmarks less visible than this are ignored (default 0.5).' },
    smoothing: {
      type: 'object',
      description: 'Jitter filter and key tolerance; the default is light and is reported in the result.',
      properties: { minCutoffHz: { type: 'number' }, beta: { type: 'number' }, rdpToleranceDeg: { type: 'number' } },
    },
    style: {
      type: 'object',
      description: 'Stylise the motion. Leave out for a faithful copy of the performance.',
      properties: {
        caricatureGain: { type: 'number', description: '1 = as performed; up to 1.8 exaggerates each pose.' },
        stepTiming: { type: 'number', enum: [1, 2, 3], description: '2 = on twos, 3 = on threes.' },
        medium: { type: 'string', enum: ['vector', 'ink', 'cutPaper', 'watercolor'] },
        lockFootContacts: { type: 'boolean', description: 'Pin planted feet (default true once style is given).' },
        secondaryMotionChains: { type: 'number', description: 'How many follow-through wiggles to add (0-10).' },
      },
    },
    lockFootContacts: { type: 'boolean', description: 'Pin planted feet without stylising anything else.' },
    replaceExisting: { type: 'boolean', description: "Replace the rig's own pose keys (default: refuse and change nothing)." },
  },
} as const;
