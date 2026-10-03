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
 * The fingerprint's heaviest signal is the engine's own scene serializer,
 * historyManager.captureSnapshot() — the one undo and saved projects use, pure
 * with respect to the scene. Its JSON stays IN THE PAGE between the two
 * probes; only the verdict crosses the wire. Volatile content in a snapshot
 * can only make a no-op look changed (a miss), never the reverse.
 */

/** In-page fingerprint, shared by both probes. */
const FINGERPRINT_JS = `function __ppFingerprint() {
  const o = {};
  try { const h = app.historyManager; if (h && typeof h.captureSnapshot === 'function') o.scene = JSON.stringify(h.captureSnapshot()); } catch (e) { /* not available */ }
  try { const cs = app.getCanvasSize && app.getCanvasSize(); if (cs) o.canvas = cs.width + 'x' + cs.height + (cs.unbounded ? ':unbounded' : ''); } catch (e) {}
  try {
    const reg = app.itemRegistry && app.itemRegistry.getAll ? app.itemRegistry.getAll() : null;
    if (reg) {
      o.items = reg.length + ':' + reg.map(function (e) { return e.id || e.itemId; }).join(',');
      o.keyframes = reg.reduce(function (n, e) { const d = e.item && e.item.data; return n + (d && Array.isArray(d.keyframes) ? d.keyframes.length : 0); }, 0);
    }
  } catch (e) {}
  try { const v = app.view || (typeof paper !== 'undefined' && paper.view); if (v && v.center) o.view = Math.round(v.zoom * 1000) + '@' + Math.round(v.center.x) + ',' + Math.round(v.center.y); } catch (e) {}
  try { if (app.mapSystem && app.mapSystem.getRegionOverrideCount) o.mapColours = app.mapSystem.getRegionOverrideCount(); } catch (e) {}
  try { if (app._initialized && app._initialized.has('synthSounds')) o.sounds = app.synthSounds.list().length; } catch (e) {}
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
