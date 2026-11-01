/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:engine-lists`.
 *
 * Name lists the engine owns and the tool surface must offer exactly. See
 * scripts/sync-engine-lists.mjs for why each is generated.
 *
 * Source: FxTool origin/main c7d337c1df99ba406db316161dab721fc2c9a0c0
 *   js/core/KeyframeInterpolator.js  sha256: c0062d98a83491e9
 *   js/world3d/worlds.js  sha256: 0e0973f7587c06e1
 *   js/core/DesignMedia.js  sha256: ab07f330e4060cb7
 *   js/FilterSystem.js  sha256: 2cf5c8ce2a737958
 *   js/core/Provenance.js  sha256: 27e4d8becfa382c8
 *   js/core/StyledScene.js  sha256: 53e4312eb2953d4f
 *   js/core/Patterns.js  sha256: a04fe3805f4e9d4f
 *   js/relations/expr-to-ir.js  sha256: 4d92d2f42b3356e9
 *   js/RelationRegistry.js  sha256: 9c06f9ddea662434
 *   js/core/AnimationDriver.js  sha256: 6741a73f5f489355
 */

/** 39 names: EASING_NAMES, the keys of the engine's easing table. Keyframes, masks, relations and the camera all resolve through it. */
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
  'hold',
  'step',
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
  ink: 'applyInkBrush',
  watercolor: 'applyWatercolorWash',
  hatch: 'applyHatching',
  cutPaper: 'applyCutPaper',
  charcoal: 'applyCharcoalBrush',
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
  noise: { intensity: [0, 100], grainSize: [1, 4], refresh: [0, 8], seed: [0, 99999] },
  vignette: { intensity: [0, 1], radius: [0, 1], falloff: [0.5, 4] },
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

/** 6 styles: STYLES, the looks a styled scene is drawn in. */
export const STYLED_SCENE_STYLES = [
  'cut',
  'ink',
  'watercolor',
  'dither',
  'flow',
  'ascii',
] as const;

/** One line per styled-scene style: the engine's STYLE_INFO. */
export const STYLED_SCENE_STYLE_INFO: Readonly<Record<string, string>> = Object.freeze({
  cut: "paper cut-out with soft drop shadows and paper grain",
  ink: "ink line and hatching, boiling on twos (12 fps)",
  watercolor: "translucent watercolour glazes on cold-press paper",
  dither: "1-bit ordered (Bayer) dither in two inks",
  flow: "contour streamlines on dark ground, animated along their length",
  ascii: "ASCII broadcast with scanlines and a timecode",
});

/** 4 kinds: Patterns.js KINDS, what pinepaper_pattern can create. */
export const PATTERN_KINDS = [
  'phase_wave',
  'stagger',
  'ring',
  'orbit',
] as const;

/** 39 functions a time_expression formula may call, each with its argument count (expr-to-ir.js FN1 = 1, FN2 = 2, COMPOSITE_ARITY, FNN). */
export const EXPRESSION_FUNCTION_ARITY: Readonly<Record<string, number>> = Object.freeze({
  sin: 1,
  cos: 1,
  tan: 1,
  abs: 1,
  floor: 1,
  ceil: 1,
  round: 1,
  trunc: 1,
  sign: 1,
  sqrt: 1,
  cbrt: 1,
  exp: 1,
  log: 1,
  log2: 1,
  log10: 1,
  asin: 1,
  acos: 1,
  atan: 1,
  sinh: 1,
  cosh: 1,
  tanh: 1,
  pow: 2,
  min: 2,
  max: 2,
  atan2: 2,
  hypot: 2,
  clamp: 3,
  mod: 2,
  lerp: 3,
  step: 2,
  smoothstep: 3,
  fract: 1,
  noise: 1,
  sec: 1,
  csc: 1,
  cot: 1,
  pingpong: 2,
  inverseLerp: 3,
  remap: 5,
});

/** 3 constants a time_expression formula may name (expr-to-ir.js CONSTS); t and v are its variables. */
export const EXPRESSION_CONSTANTS = [
  'PI',
  'E',
  'TAU',
] as const;

/** 51 relation rules: the params each declares or reads (RelationRegistry.js). A key outside its list is never read. */
export const RELATION_PARAM_KEYS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  aligned_with: ['axis', 'offset', 'signal'],
  anchored_in_world: ['hideWhenBehind', 'offsetY', 'scaleWithDistance', 'screenOffsetX', 'screenOffsetY', 'target', 'x', 'y', 'z'],
  animates: ['autoplay', 'duration', 'keyframes', 'loop', 'pingPong', 'signal'],
  attached_to: ['inherit_rotation', 'offset'],
  attached_to_tail: ['port'],
  attracts: ['force', 'maxDistance', 'maxSpeed', 'minDistance', 'returnSpeed'],
  below: ['align', 'gap', 'overhang', 'signal'],
  beside: ['align', 'gap', 'side', 'signal'],
  bounds_to: ['bounce', 'padding', 'signal'],
  camera_animates: ['delay', 'duration', 'fov', 'keyframes', 'loop', 'pitch', 'yaw'],
  camera_follows: ['bounds', 'deadzone', 'offset', 'smoothing', 'zoom'],
  centered_on: ['offsetX', 'offsetY', 'signal'],
  circumscribes: ['color', 'delay', 'duration', 'fadeOut', 'padding', 'shape', 'strokeWidth'],
  connects_to: ['label', 'sourcePort', 'targetPort', 'via'],
  construction_reveal: ['fadeIn', 'revealAt'],
  contained_in_place: ['bounce', 'padding', 'regionId', 'signal'],
  controls: ['keys', 'speed'],
  draws_figure: ['delay', 'duration', 'figure', 'loop'],
  driven_by: ['anchor', 'clamp', 'colorFrom', 'colorTo', 'multiplier', 'offset', 'signal', 'sourceProperty', 'targetProperty'],
  effect_: ['intensity', 'mode', 'offsetX', 'offsetY', 'padding', 'palette', 'radius', 'speed'],
  follows: ['delay', 'offset', 'signal', 'smoothing', 'startOnTarget'],
  geo_adjacent_to: ['offset', 'regionId', 'side', 'signal'],
  geo_centers_on: ['animate', 'duration', 'padding', 'regionId'],
  geo_highlights: ['active', 'highlightColor', 'regionId', 'strokeColor'],
  geo_travels_to: ['duration', 'easing', 'fromRegion', 'loop', 'pathStyle', 'signal', 'toRegion'],
  group_morphs_to: ['deformLines', 'duration', 'easing', 'hold', 'loop'],
  grows_from: ['delay', 'duration', 'easing', 'origin'],
  head_points_to: ['port'],
  indicates: ['color', 'delay', 'duration', 'repeat', 'scale'],
  inside: ['anchor', 'padding', 'signal'],
  is_centroid_of: ['others', 'signal'],
  is_circumcenter_of: ['other1', 'other2', 'signal'],
  is_midpoint_of: ['other', 'signal'],
  lies_on_line: ['other', 'signal', 't'],
  localizes_sound: ['axis', 'distanceGain', 'reference', 'smoothing', 'spread'],
  maintains_distance: ['distance', 'signal', 'strength'],
  mirrors: ['axis', 'center'],
  on_event_play_sound: ['gain', 'note', 'sound'],
  on_top_of: ['align', 'gap', 'overhang', 'signal'],
  orbits: ['direction', 'phase', 'phaseDegrees', 'radius', 'speed'],
  parallax: ['depth', 'origin'],
  points_at: ['offset_angle', 'signal', 'smoothing'],
  reacts_to_audio: ['attack', 'base', 'beatsPerBar', 'colorFrom', 'colorTo', 'decay', 'feature', 'gain', 'halfLife', 'inPoint', 'loop', 'onsets', 'outPoint', 'peak', 'property', 'source', 'start', 'threshold'],
  repels: ['force', 'maxDistance', 'minDistance', 'returnSpeed', 'signal'],
  staggered_with: ['amount', 'axis', 'count', 'delay', 'distributeEase', 'duration', 'effect', 'from', 'grid', 'index', 'stagger'],
  syncs_with: ['offset', 'speedRatio'],
  time_expression: ['baseValue', 'expression', 'property', 'signal'],
  tours: ['dwell', 'easing', 'loop', 'orient', 'stopEvent', 'travel', 'waypoints'],
  triggers_animation: ['atTime', 'delay', 'trigger'],
  wave_through: ['amplitude', 'delay', 'direction', 'duration', 'frequency', 'signal'],
  wiggle: ['amplitude', 'dimensions', 'frequency', 'octaves', 'property', 'seed', 'signal'],
});

/** Names the grammar refuses outright (expr-to-ir.js REJECT): not deterministic. */
export const EXPRESSION_REJECTED = [
  'random',
] as const;

/** 20 loop animations: AnimationDriver.js ANIMATION_TYPES, the types its switch draws. */
export const ANIMATION_TYPES = [
  'bounce',
  'breathe',
  'fade',
  'glow',
  'jelly',
  'path',
  'pulse',
  'ripple',
  'rotate',
  'scrollDown',
  'scrollLeft',
  'scrollRight',
  'scrollUp',
  'shake',
  'slideLeftRight',
  'slideUpDown',
  'swing',
  'typewriter',
  'undulate',
  'wobble',
] as const;

/** 6 cycle shapes a field motion (ripple, undulate) reads: ANIMATION_WAVEFORMS. */
export const ANIMATION_WAVEFORMS = [
  'sine',
  'triangle',
  'square',
  'sawtooth',
  'spike',
  'pulse',
] as const;

/** 9 points a field motion starts from on a group: ANIMATION_ORIGINS. */
export const ANIMATION_ORIGINS = [
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'topLeft',
  'topRight',
  'bottomLeft',
  'bottomRight',
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
  noise: "Add film grain effect — intensity 0..100, default 20; monochrome (boolean), default true; grainSize 1..4; refresh 0..8; seed 0..99999, default 0; blend add|multiply, default add",
  vignette: "Add vignette darkening — intensity 0..1, default 0.5; radius 0..1, default 0.5; color (color); falloff 0.5..4, default 2",
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
