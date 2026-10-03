/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:engine-lists`.
 *
 * Name lists the engine owns and the tool surface must offer exactly. See
 * scripts/sync-engine-lists.mjs for why each is generated.
 *
 * Source: FxTool origin/main 057c71c5a3b17274903d1dddc6542f5b4c1fafe6
 *   js/core/KeyframeInterpolator.js  sha256: 4c38752d86cae944
 *   js/world3d/worlds.js  sha256: 0e0973f7587c06e1
 *   js/core/DesignMedia.js  sha256: 46fae8ceafe54b11
 *   js/FilterSystem.js  sha256: f862237e73c93a34
 *   js/core/Provenance.js  sha256: 27e4d8becfa382c8
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

/** 20 filters: everything FilterSystem.js registers. */
export const FILTER_TYPES = [
  'grayscale',
  'sepia',
  'brightness',
  'contrast',
  'saturation',
  'invert',
  'blur',
  'noise',
  'vignette',
  'vintage',
  'colorOverlay',
  'sharpen',
  'emboss',
  'posterize',
  'hsl',
  'colorTint',
  'edgeDetect',
  'halftoneDots',
  'halftoneCMYK',
  'dither',
] as const;

/** Numeric parameter ranges per filter, [min, max], as the engine registers them. */
export const FILTER_PARAM_RANGES: Readonly<Record<string, Readonly<Record<string, readonly [number, number]>>>> = Object.freeze({
  grayscale: { intensity: [0, 1] },
  sepia: { intensity: [0, 1] },
  brightness: { value: [-100, 100] },
  contrast: { value: [-100, 100] },
  saturation: { value: [-100, 100] },
  invert: { intensity: [0, 1] },
  blur: { radius: [0, 20] },
  noise: { intensity: [0, 100] },
  vignette: { intensity: [0, 1], radius: [0, 1] },
  vintage: { intensity: [0, 1] },
  colorOverlay: { intensity: [0, 1] },
  sharpen: { intensity: [0, 100] },
  emboss: { intensity: [0, 1] },
  posterize: { levels: [2, 32] },
  hsl: { hue: [-180, 180], saturation: [-100, 100], lightness: [-100, 100] },
  colorTint: { intensity: [0, 1] },
  edgeDetect: { strength: [0, 4] },
  halftoneDots: { size: [2, 32], angle: [0, 3.14] },
  halftoneCMYK: { size: [2, 32] },
  dither: { levels: [2, 16] },
});

/** 5 kinds: LINEAGE_KINDS, what provenance record accepts. */
export const LINEAGE_KINDS = [
  'derivedFrom',
  'instanceOf',
  'placedFrom',
  'importedFrom',
  'copyOf',
] as const;

/** One line per filter: the engine's own description and parameter ranges. */
export const FILTER_DOCS: Readonly<Record<string, string>> = Object.freeze({
  grayscale: "Convert to black and white — intensity 0..1, default 1",
  sepia: "Apply warm sepia tone — intensity 0..1, default 1",
  brightness: "Adjust image brightness — value -100..100, default 0",
  contrast: "Adjust image contrast — value -100..100, default 0",
  saturation: "Adjust color saturation — value -100..100, default 0",
  invert: "Invert colors — intensity 0..1, default 1",
  blur: "Apply gaussian blur — radius 0..20, default 5",
  noise: "Add film grain effect — intensity 0..100, default 20; monochrome (boolean), default true",
  vignette: "Add vignette darkening — intensity 0..1, default 0.5; radius 0..1, default 0.5",
  vintage: "Retro vintage look — intensity 0..1, default 1",
  colorOverlay: "Add color tint — color (color), default #ff0000; intensity 0..1, default 0.3; blendMode multiply|overlay|screen, default overlay",
  sharpen: "Increase image sharpness — intensity 0..100, default 50",
  emboss: "3D emboss effect — intensity 0..1, default 1",
  posterize: "Reduce color levels — levels 2..32, default 4",
  hsl: "Shift hue, saturation, lightness — hue -180..180, default 0; saturation -100..100, default 0; lightness -100..100, default 0",
  colorTint: "Tint image toward a color — intensity 0..1, default 0.3; color (color), default #ff0000; blendMode multiply|screen|overlay, default overlay",
  edgeDetect: "Sobel edge detection — strength 0..4, default 1.0",
  halftoneDots: "Black-and-white halftone dot pattern — size 2..32, default 6; angle 0..3.14, default 0.4",
  halftoneCMYK: "CMYK halftone separations (newspaper rosette) — size 2..32, default 6",
  dither: "Ordered Bayer 4x4 dithering — levels 2..16, default 2",
});
