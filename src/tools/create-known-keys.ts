/**
 * Every `properties` key create_item can act on: what the engine's create()
 * and normalizeParams() read (generated — see shape-params.ts), plus the keys
 * generateCreateItemCode consumes itself before the engine sees them.
 *
 * One set, read by the create emitter (which reports the rest as ignored) and
 * by the batch typo preflight (which must not call a key it acts on a typo:
 * `ttl` on a line was "did you mean to?", issue #29 O8).
 */
import { ACCEPTED_CREATE_PARAMS, NORMALIZE_PARAM_READS } from './shape-params.js';

export const CREATE_KNOWN_KEYS: ReadonlySet<string> = new Set([
  ...ACCEPTED_CREATE_PARAMS,
  ...NORMALIZE_PARAM_READS,
  // withRadiusAxes, gradients / shadow / blend / opacity emitted here, and
  // setDynamicContent for text.
  'radiusX', 'radiusY', 'contentType', 'contentFormat', 'countdownTarget', 'countdownEndText',
  // Lifetimes, on ANY item: this generator applies them through app.setLifetime
  // (emitLifetime), whatever create() itself reads.
  'bornAt', 'ttl',
  // A solid fill's own alpha (FxTool 12 STROKEFILL); confirmed per call by
  // emitFillOpacityCheck, since an older studio ignores it.
  'fillOpacity',
]);
