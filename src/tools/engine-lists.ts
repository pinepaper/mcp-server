/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:engine-lists`.
 *
 * Name lists the engine owns and the tool surface must offer exactly. See
 * scripts/sync-engine-lists.mjs for why each is generated.
 *
 * Source: FxTool origin/main b2ddccfeabe97f6a2b42e6ad6b35f2451ece3620
 *   js/core/KeyframeInterpolator.js  sha256: 4c38752d86cae944
 *   js/world3d/worlds.js  sha256: 0e0973f7587c06e1
 *   js/core/DesignMedia.js  sha256: 46fae8ceafe54b11
 */

/** 37 names: EASING_NAMES, the keys of the engine's easing table. Keyframes, masks, relations and the camera all resolve through it. */
export const ENGINE_EASING_NAMES = [
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'easeInCubic',
  'easeOutCubic',
  'easeInOutCubic',
  'bounce',
  'easeOutBounce',
  'easeInBounce',
  'elastic',
  'easeOutElastic',
  'easeInElastic',
  'easeOutBack',
  'easeInBack',
  'easeInOutBack',
  'spring',
  'springSnappy',
  'springPlayful',
  'easeInQuad',
  'easeOutQuad',
  'easeInOutQuad',
  'easeInSine',
  'easeOutSine',
  'easeInOutSine',
  'easeInQuart',
  'easeOutQuart',
  'easeInOutQuart',
  'easeInQuint',
  'easeOutQuint',
  'easeInOutQuint',
  'easeInExpo',
  'easeOutExpo',
  'easeInOutExpo',
  'easeInCirc',
  'easeOutCirc',
  'easeInOutCirc',
] as const;

/** 11 paths: WORLD_SCHEMA entries of kind 'color' — the world spec's colour fields. */
export const WORLD3D_COLOR_PATHS = [
  'env.zenith',
  'env.horizon',
  'env.fogColor',
  'env.sunColor',
  'env.ambient',
  'env.lowColor',
  'env.midColor',
  'env.highColor',
  'env.rockColor',
  'env.propColorA',
  'env.propColorB',
] as const;

/** 9 media: the keys of DesignMedia MEDIA. */
export const DESIGN_MEDIA = [
  'vector',
  'thread',
  'ink',
  'watercolor',
  'hatch',
  'cutPaper',
  'charcoal',
  'oil',
  'encaustic',
] as const;

/** The engine method that applies each medium that has one (MEDIA[key].apply). The others are refused by the engine, by name. */
export const DESIGN_MEDIA_APPLY: Readonly<Record<string, string>> = Object.freeze({
  thread: 'applyThreadPainting',
  watercolor: 'applyWatercolorWash',
  hatch: 'applyHatching',
  cutPaper: 'applyCutPaper',
  oil: 'applyOilWash',
});
