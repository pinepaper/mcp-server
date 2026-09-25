/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:stick-vocabulary`.
 *
 * The stick kit's own name lists, for DISCOVERY.
 *
 * The engine validates gait / pose / sequence against these and warns naming
 * the valid set on a miss, so being wrong here costs a caller a round trip
 * rather than a silent failure. They are generated anyway: fifty-odd names
 * across five lists is exactly the shape that drifts, and every enum this repo
 * hand-maintained against FxTool drifted silently.
 *
 * Source: FxTool origin/main 253a01a04c886713f610e619ac6205e59751dbb4
 *   js/vendor/stick/figure-rigged.js
 * sha256: bb2faa1ff5f0f83a
 */

/** 9 names — how a figure walks — gait. */
export const STICK_GAITS: readonly string[] = Object.freeze([
  'walk',
  'stroll',
  'march',
  'sneak',
  'run',
  'trudge',
  'strut',
  'skip',
  'tiptoe',
]);

/** 27 names — a single pose, and the entries of a `poses` track. */
export const STICK_POSES: readonly string[] = Object.freeze([
  'stand',
  'walkA',
  'walkB',
  'walkC',
  'wave',
  'reach',
  'sit',
  'lookL',
  'lookR',
  'nod',
  'point',
  'pointUp',
  'reachUp',
  'cheer',
  'shrug',
  'slump',
  'crouch',
  'kneel',
  'lie',
  'jump',
  'fall',
  'carry',
  'push',
  'pull',
  'offer',
  'hug',
  'holdHands',
]);

/** 14 names — a named pose track — sequence. */
export const STICK_SEQUENCES: readonly string[] = Object.freeze([
  'greet',
  'agree',
  'refuse',
  'celebrate',
  'despair',
  'collapse',
  'getUp',
  'reachAndFail',
  'offerAndWait',
  'pickUp',
  'pointOut',
  'startle',
  'embrace',
  'letGo',
]);

/** 17 names — a face — expression, and the entries of `expressions`. */
export const STICK_EXPRESSIONS: readonly string[] = Object.freeze([
  'neutral',
  'pleased',
  'happy',
  'angry',
  'smug',
  'sad',
  'surprised',
  'worried',
  'deadpan',
  'laughing',
  'confused',
  'tired',
  'brave',
  'scared',
  'mischievous',
  'curious',
  'panicked',
]);

/** 4 names — something held in hand — prop. */
export const STICK_PROPS: readonly string[] = Object.freeze([
  'tray',
  'box',
  'cup',
  'sign',
]);
