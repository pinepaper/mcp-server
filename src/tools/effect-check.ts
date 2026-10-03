/**
 * NO SILENT SUCCESS, the runtime half. A call classed 'mutates'
 * (effect-class.ts) is fingerprinted before and after; a success that changed
 * nothing measurable is FLAGGED in the result text the model reads, and a
 * result that names an item not on the canvas FAILS.
 *
 * Flag, not fail: an idempotent call (a background set to the colour it
 * already is) rightly changes nothing, and refusing it would be the mirror of
 * the bug this hunts. A named item that does not exist is no such case — it
 * is a contradiction (add_marker's invented 'marker_added').
 *
 * The fingerprint is the AUTHORED scene — items' data, un-animated style and
 * placement, relations, background, canvas, map colours, placed sounds — kept
 * IN THE PAGE between the two probes; only the verdict crosses the wire. It
 * was the engine's full snapshot until the first live sweep: that carries the
 * playhead and live transforms, so during playback every no-op looked changed.
 */

/** In-page fingerprint, shared by both probes. */
const FINGERPRINT_JS = `function __ppFingerprint() {
  // AUTHORED state, not the live frame. The engine's full snapshot carries the
  // playhead and every item's CURRENT transform, so while the timeline plays
  // every call looked changed — the three misses of the first live sweep
  // (re-applied colour, same canvas size, a repeated highlight). Animated
  // values are left out; what a call can author is kept.
  const o = {};
  const playing = !!app.isPlayingKeyframes;
  const plain = function (k, v) {
    if (typeof k === 'string' && (k.charAt(0) === '_' || /^(selected|hovered|isHovered|cached|lastRender|renderTick|frame|playbackTime|time)$/.test(k))) return undefined;
    if (typeof v === 'function') return undefined;
    if (v && typeof v === 'object' && (v.data instanceof Uint8ClampedArray || (typeof ImageData !== 'undefined' && v instanceof ImageData))) return undefined;
    if (v && typeof v === 'object' && typeof v.toCSS === 'function') return v.toCSS(true);
    return v;
  };
  const S = function (v) { try { return JSON.stringify(v, plain); } catch (e) { return ''; } };
  try {
    const reg = app.itemRegistry && app.itemRegistry.getAll ? app.itemRegistry.getAll() : null;
    if (reg) {
      o.items = reg.map(function (e) {
        const it = e.item || {};
        const d = it.data || {};
        const keys = Array.isArray(d.keyframes) ? d.keyframes : [];
        const animated = {};
        keys.forEach(function (k) { Object.keys((k && k.properties) || {}).forEach(function (p) { animated[p] = 1; }); });
        const moves = keys.length || (d.animationType && d.animationType !== 'none');
        const style = {};
        ['fillColor', 'strokeColor', 'strokeWidth', 'opacity', 'fontSize', 'fontFamily', 'content', 'visible', 'blendMode'].forEach(function (p) {
          if (!animated[p] && !(p === 'fillColor' && animated.color) && it[p] !== undefined) style[p] = plain(p, it[p]);
        });
        if (!moves && it.position) style.at = [Math.round(it.position.x), Math.round(it.position.y)];
        if (!moves && it.scaling) style.scale = [Math.round(it.scaling.x * 1000), Math.round(it.scaling.y * 1000)];
        if (!moves && typeof it.rotation === 'number') style.rot = Math.round(it.rotation * 100);
        return (e.id || e.itemId) + '|' + (e.type || '') + '|' + S(d) + '|' + S(style);
      }).join('\\n');
    }
  } catch (e) {}
  try { const rr = app.relationRegistry; if (rr && rr.exportForSave) o.relations = S(rr.exportForSave()); } catch (e) {}
  try { if (app.listRenderHooks) o.renderHooks = S(app.listRenderHooks()); } catch (e) {}
  // SCENE-LEVEL STATE OUTSIDE ITEMS (sweep v2: add_filter and camera_animate
  // were real changes read as none). The camera's track is a relation on the
  // pseudo-source 'camera', which no registry item carries.
  try { if (app.filterSystem && app.filterSystem.exportForSave) o.filters = S(app.filterSystem.exportForSave()); } catch (e) {}
  try {
    // Camera keyframes live in relationRegistry._cameraAnimation.params (a
    // virtual item, no registry entry), read through getCameraAnimationParams.
    // getRelations('camera') looks in the associations and is always empty
    // for them (sweep v3: camera_animate still read as no change).
    const rr = app.relationRegistry;
    const cam = rr && rr.getCameraAnimationParams ? rr.getCameraAnimationParams() : null;
    const tilt = rr && rr.cameraTilt;
    o.camera = S([cam, tilt && tilt.serialize ? tilt.serialize() : null]);
  } catch (e) {}
  try { const c = app.config || {}; o.background = S([c.currentBackgroundMode, c.currentBackgroundGenerator, c.generatorParams, app.canvasEl && app.canvasEl.style && app.canvasEl.style.backgroundColor]); } catch (e) {}
  try { const cs = app.getCanvasSize && app.getCanvasSize(); if (cs) o.canvas = cs.width + 'x' + cs.height + (cs.unbounded ? ':unbounded' : ''); } catch (e) {}
  try {
    // The view moves on its own while a camera animation plays.
    const v = app.view || (typeof paper !== 'undefined' && paper.view);
    if (!playing && v && v.center) o.view = Math.round(v.zoom * 1000) + '@' + Math.round(v.center.x) + ',' + Math.round(v.center.y);
  } catch (e) {}
  try { if (app.mapSystem && app.mapSystem.getRegionOverrideCount) o.mapColours = app.mapSystem.getRegionOverrideCount() + ':' + S(app.mapSystem._regionColorOverrides ? Array.from(app.mapSystem._regionColorOverrides.entries()) : null); } catch (e) {}
  try { if (app._initialized && app._initialized.has('synthSounds')) o.sounds = S(app.synthSounds.list().map(function (x) { return [x.id, x.startTime, x.duration]; })); } catch (e) {}
  return o;
}`;

export const EFFECT_BEFORE_JS = `(function () {
  ${FINGERPRINT_JS}
  window.__ppEffectBefore = __ppFingerprint();
  return { ok: true };
})();`;

/** After-probe: compares against the before fingerprint; checks the named ids exist. */
export function effectAfterJs(ids: string[]): string {
  return `(function () {
  ${FINGERPRINT_JS}
  const a = window.__ppEffectBefore || null;
  const b = __ppFingerprint();
  window.__ppEffectBefore = null;
  const checked = Object.keys(b);
  const changed = a ? checked.filter(function (k) { return a[k] !== b[k]; }) : null;
  const ids = ${JSON.stringify(ids)};
  const missing = ids.filter(function (id) {
    try {
      if (app.getItemById && app.getItemById(id)) return false;
      if (app.itemRegistry && app.itemRegistry.get && app.itemRegistry.get(id)) return false;
    } catch (e) {}
    return true;
  });
  return { ok: !!a, checked: checked, changed: changed, missing: missing };
})();`;
}

/** The item ids a result names as made or touched (itemId, itemIds, ids). */
export function namedItemIds(result: unknown): string[] {
  if (!result || typeof result !== 'object') return [];
  const r = result as Record<string, unknown>;
  const out: string[] = [];
  const add = (v: unknown) => { if (typeof v === 'string' && /^item_\d+$/.test(v)) out.push(v); };
  add(r.itemId);
  for (const k of ['itemIds', 'ids']) if (Array.isArray(r[k])) (r[k] as unknown[]).forEach(add);
  return [...new Set(out)].slice(0, 50);
}

/** Calls whose returned id is legitimately gone afterwards. */
export function idMayBeGone(tool: string, action: string | undefined): boolean {
  return /delete|remove|clear|ungroup|break_apart|unhighlight/.test(`${tool}:${action ?? ''}`);
}

export const NO_CHANGE_NOTE = (checked: string[]) =>
  `⚠️ NO CHANGE: this call reported success, but nothing it could have changed did (checked: ${checked.join(', ')}). `
  + 'If you expected a change, it did not happen — check the ids and arguments before building on it. '
  + '(Re-applying a value an item already has is the one case where this is expected.)';
