/**
 * OntologyValidator — active semantic validator producing STRUCTURED diagnostics
 * ({code, severity, message, target, context, fix}) over scene state or a proposed op.
 *
 * Ported from FxTool/js/core/OntologyValidator.js to typed TypeScript (the S3.4
 * "one validator, two surfaces" shared library — the same checks FxTool and the Cloud
 * pre-render gate run). READ-ONLY: never mutates; `fix.apply` is a *proposed* op.
 *
 * The validator is ontology-agnostic: it takes a narrow read-only ctx (getters only).
 * buildDefinitionValidatorContext() wires it to a template definition so the server's
 * pinepaper_validate_design can run it Node-side without a browser round-trip.
 */

import { ITEM_TYPE_MAP, RELATION_TYPE_MAP, PP_VOCABULARY } from './vocabulary.js';

export const SEVERITY = { ERROR: 'error', WARNING: 'warning', HINT: 'hint' } as const;
const SEVERITY_RANK: Record<string, number> = { error: 0, warning: 1, hint: 2 };

// Semver the diagnostic-code catalog: bump on any code add/semantics change so
// benchmark runs are comparable across validator versions. Emitted in every result.
const VALIDATOR_VERSION = '1.2.0';

// Structural layout relations (S12-E1) that write BOTH position axes. aligned_with
// is handled separately (it writes one axis, chosen by params.axis). FxTool keeps
// this same hardcoded set in its validator's _structuralAxes; the MCP mirrors the
// fact here because it has no RelationRegistry to read a schema from.
const STRUCTURAL_FULL_WRITE = new Set(['on_top_of', 'below', 'beside', 'inside', 'centered_on']);

// Relation → required param names. FxTool reads `required` off each RelationRegistry
// rule; the MCP has no registry, so it mirrors the same fact as a static table.
// aligned_with.axis has no sensible default (FxTool's compute returns undefined
// without it, so the relation silently no-ops).
const RELATION_REQUIRED_PARAMS: Record<string, string[]> = {
  aligned_with: ['axis'],
};

// Easing names the engine understands (mirrors EASING_TO_MATH in the ontology).
const KNOWN_EASINGS = new Set([
  'linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInCubic', 'easeOutCubic', 'bounce', 'elastic', 'customCubicBezier',
]);

// Properties modify()/_applyChangesToItem actually applies. A change key outside this
// set is a silent no-op at the engine — the costliest agent failure (burns a render).
const KNOWN_MODIFY_PROPS = new Set([
  'animationIntensity', 'animationSpeed', 'animationType', 'animationDelay', 'bgColor', 'blendMode', 'collageStyle',
  'color', 'content', 'fillColor', 'fontSize', 'height', 'keyframes', 'label', 'opacity', 'palette',
  'position', 'relationBehavior', 'rotation', 'scale', 'scaleX', 'scaleY', 'shadowBlur', 'shadowColor',
  'shadowOffset', 'staggerDelay', 'strokeColor', 'strokeWidth', 'textColor', 'timeOffset',
  'trimEnd', 'trimOffset', 'trimStart', 'width', 'x', 'y',
]);

export interface ValidatorItemEntry {
  itemId: string;
  item: { data?: Record<string, any> | null };
  type?: string;
}

export interface ValidatorRule {
  params?: Record<string, { type?: string; options?: unknown[]; min?: number; max?: number; required?: boolean }>;
}

export interface ValidatorContext {
  getItem(id: string): unknown;
  getAllItems(): ValidatorItemEntry[];
  hasItemType(type: string): boolean;
  getRule(name: string): ValidatorRule | null;
}

export interface Diagnostic {
  code: string;
  severity: string;
  message: string;
  target?: Record<string, unknown>;
  context?: Record<string, unknown>;
  fix?: Record<string, unknown>;
}

export interface ValidatorResult {
  ok: boolean;
  diagnostics: Diagnostic[];
  validatorVersion: string;
}

export class OntologyValidator {
  private ctx: Partial<ValidatorContext>;
  private _batchPending: Set<string> | null = null;

  constructor(ctx: Partial<ValidatorContext> = {}) {
    this.ctx = ctx;
  }

  // ── public API ─────────────────────────────────────────────────────────────

  /** Audit the whole current scene. */
  validateScene(): ValidatorResult {
    const diagnostics: Diagnostic[] = [];
    const items = this._safe(() => this.ctx.getAllItems!(), [] as ValidatorItemEntry[]) || [];
    for (const entry of items) {
      if (!entry || !entry.item) continue;
      this._checkItemType(entry, diagnostics);
      this._checkAssociations(entry, diagnostics);
      this._checkKeyframes(entry.item.data && entry.item.data.keyframes, diagnostics, { kind: 'item', id: entry.itemId });
    }
    this._checkCycles(items, diagnostics);
    return this._result(diagnostics);
  }

  /** Validate a PROPOSED mutation before it is applied. */
  validateOp(op: any): ValidatorResult {
    const diagnostics: Diagnostic[] = [];
    if (!op || typeof op !== 'object') {
      diagnostics.push(this._diag('INVALID_OP', SEVERITY.ERROR, 'op must be an object'));
      return this._result(diagnostics);
    }
    switch (op.kind) {
      case 'addRelation': this._checkAddRelation(op, diagnostics); break;
      case 'create': this._checkCreate(op, diagnostics); break;
      case 'modify': this._checkModify(op, diagnostics); break;
      case 'delete': this._checkDelete(op, diagnostics); break;
      default:
        diagnostics.push(this._diag('UNKNOWN_OP', SEVERITY.WARNING, `unknown op kind: ${op.kind}`));
    }
    return this._result(diagnostics);
  }

  /** Validate a BATCH of proposed ops against a hypothetical scene (ids created earlier count as existing). */
  validateOps(ops: any[]): ValidatorResult {
    if (!Array.isArray(ops)) {
      return this._result([this._diag('INVALID_OP', SEVERITY.ERROR, 'ops must be an array')]);
    }
    const diagnostics: Diagnostic[] = [];
    this._batchPending = new Set();
    try {
      ops.forEach((op, i) => {
        const r = this.validateOp(op).diagnostics;
        for (const d of r) { d.context = Object.assign({}, d.context, { opIndex: i }); diagnostics.push(d); }
        if (op && op.kind === 'create') {
          const id = op.id || op.resultId;
          if (id != null) this._batchPending!.add(id);
        }
      });
    } finally {
      this._batchPending = null;
    }
    return this._result(diagnostics);
  }

  // ── checks ───────────────────────────────────────────────────────────────

  private _checkItemType(entry: ValidatorItemEntry, out: Diagnostic[]): void {
    const t = entry.type;
    if (t && !this._safe(() => this.ctx.hasItemType!(t), true)) {
      out.push(this._diag('UNKNOWN_ITEM_TYPE', SEVERITY.ERROR,
        `Item "${entry.itemId}" has unknown type "${t}".`,
        { target: { kind: 'item', id: entry.itemId }, context: { value: t } }));
    }
  }

  private _checkAssociations(entry: ValidatorItemEntry, out: Diagnostic[]): void {
    const assoc = entry.item.data && entry.item.data.associations;
    if (!assoc || typeof assoc !== 'object') return;
    for (const relation of Object.keys(assoc)) {
      const rule = this._safe(() => this.ctx.getRule!(relation), null);
      const list = Array.isArray(assoc[relation]) ? assoc[relation] : [];
      const seen = new Set<string>();
      for (const a of list) {
        if (!rule) {
          out.push(this._diag('UNKNOWN_RELATION', SEVERITY.ERROR,
            `Item "${entry.itemId}" uses unknown relation "${relation}".`,
            { target: { kind: 'relation', id: entry.itemId, relation } }));
          continue;
        }
        if (a.target != null && !this._refOk(a.target)) {
          out.push(this._refMissing('DANGLING_ASSOCIATION', a.target, entry.itemId, relation));
        }
        const key = String(a.target);
        if (seen.has(key)) {
          out.push(this._diag('DUPLICATE_RELATION', SEVERITY.HINT,
            `Item "${entry.itemId}" has a duplicate "${relation}" → "${a.target}".`,
            { target: { kind: 'relation', id: entry.itemId, relation } }));
        }
        seen.add(key);
        this._checkParams(rule, relation, entry.itemId, a.params || {}, out);
      }
    }
  }

  private _checkParams(rule: ValidatorRule, relation: string, _ownerId: string, params: Record<string, any>, out: Diagnostic[]): void {
    const schema = rule.params || {};
    for (const key of Object.keys(params)) {
      if (key.startsWith('_')) continue;
      const s = schema[key];
      if (!s) continue;
      const v = params[key];
      const t = { kind: 'param', relation, property: key };
      if (s.type && !this._typeMatches(v, s.type)) {
        if (s.type === 'number' && typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) {
          out.push(this._diag('PARAM_TYPE', SEVERITY.WARNING,
            `${relation}.${key} is the string "${v}" but should be a number — the engine coerces it; pass ${Number(v)}.`,
            { target: t, context: { value: v, expected: 'number', coercedTo: Number(v) },
              fix: { kind: 'replace', suggestion: `Use ${Number(v)}`, apply: { [key]: Number(v) } } }));
          continue;
        }
        out.push(this._diag('PARAM_TYPE', SEVERITY.ERROR,
          `${relation}.${key} should be ${s.type}, got ${Array.isArray(v) ? 'array' : typeof v}.`,
          { target: t, context: { value: v, expected: s.type } }));
        continue;
      }
      if (Array.isArray(s.options) && !s.options.includes(v)) {
        const near = this._nearest(String(v), s.options.map(String));
        out.push(this._diag('PARAM_ENUM', SEVERITY.WARNING,
          `${relation}.${key} = "${v}" is not one of: ${s.options.join(', ')}.`,
          { target: t, context: { value: v, expected: s.options },
            fix: near ? { kind: 'replace', suggestion: `Use "${near}"`, apply: { [key]: near } } : undefined }));
      }
      if (typeof v === 'number') {
        if (typeof s.min === 'number' && v < s.min) {
          out.push(this._diag('PARAM_RANGE', SEVERITY.WARNING,
            `${relation}.${key} = ${v} is below min ${s.min}.`,
            { target: t, context: { value: v, min: s.min }, fix: { kind: 'clamp', suggestion: `Clamp to ${s.min}`, apply: { [key]: s.min } } }));
        } else if (typeof s.max === 'number' && v > s.max) {
          out.push(this._diag('PARAM_RANGE', SEVERITY.WARNING,
            `${relation}.${key} = ${v} exceeds max ${s.max}.`,
            { target: t, context: { value: v, max: s.max }, fix: { kind: 'clamp', suggestion: `Clamp to ${s.max}`, apply: { [key]: s.max } } }));
        }
      }
    }
  }

  /** First reference cycle among relation edges (A→B→A), or none. */
  private _checkCycles(items: ValidatorItemEntry[], out: Diagnostic[]): void {
    const graph = new Map<string, Set<string>>();
    for (const entry of items) {
      const assoc = entry.item && entry.item.data && entry.item.data.associations;
      if (!assoc) continue;
      const deps = graph.get(entry.itemId) || new Set<string>();
      for (const relation of Object.keys(assoc)) {
        const list = Array.isArray(assoc[relation]) ? assoc[relation] : [];
        for (const a of list) if (a.target != null && a.target !== entry.itemId) deps.add(a.target);
      }
      graph.set(entry.itemId, deps);
    }
    const cycle = this._findCycle(graph);
    if (cycle) {
      out.push(this._diag('RELATION_CYCLE', SEVERITY.ERROR,
        `Relation cycle: ${cycle.join(' → ')}.`,
        { target: { kind: 'relation', id: cycle[0] }, context: { cyclePath: cycle } }));
    }
  }

  // ── op checks ──────────────────────────────────────────────────────────────

  private _checkAddRelation(op: any, out: Diagnostic[]): void {
    if (op.from == null || !this._refOk(op.from)) {
      out.push(this._refMissing('SOURCE_NOT_FOUND', op.from, null, op.relation));
    }
    if (op.to != null && !this._refOk(op.to)) {
      out.push(this._refMissing('TARGET_NOT_FOUND', op.to, op.from, op.relation));
    }
    const rule = this._safe(() => this.ctx.getRule!(op.relation), null);
    if (!rule) {
      out.push(this._diag('UNKNOWN_RELATION', SEVERITY.ERROR, `Unknown relation "${op.relation}".`,
        { target: { kind: 'relation', relation: op.relation } }));
      return;
    }
    // Required params (S12-E1): a param may be required with no sensible default
    // (aligned_with.axis). _checkParams only inspects supplied keys, so the
    // missing-required case is checked here. Sources: the rule's own `required`
    // flags (if a context supplies them) plus the static mirror table.
    const providedParams = op.params || {};
    const requiredKeys = new Set<string>(RELATION_REQUIRED_PARAMS[op.relation] || []);
    for (const pk of Object.keys(rule.params || {})) {
      if (rule.params![pk]?.required) requiredKeys.add(pk);
    }
    for (const pk of requiredKeys) {
      if (providedParams[pk] === undefined) {
        out.push(this._diag('MISSING_REQUIRED_PARAM', SEVERITY.ERROR,
          `${op.relation} requires param "${pk}".`,
          { target: { kind: 'param', relation: op.relation, property: pk } }));
      }
    }
    this._checkParams(rule, op.relation, op.from, op.params || {}, out);
    if (op.from != null && op.to != null && op.from !== op.to) {
      const path = this._reachPath(this._associationGraph(), op.to, op.from);
      if (path) {
        const cyclePath = [op.from, ...path];
        out.push(this._diag('RELATION_CYCLE', SEVERITY.ERROR,
          `Adding "${op.relation}" ${op.from} → ${op.to} would create a cycle: ${cyclePath.join(' → ')}.`,
          { target: { kind: 'relation', relation: op.relation }, context: { cyclePath } }));
      }
    }
    // Structural placement conflict (S12-E1): two structural relations writing the
    // SAME axis on one source fight — last-writer-wins at runtime, so this is
    // advisory (WARNING). aligned_with on a disjoint axis is legal.
    const newAxes = this._structuralAxes(op.relation, op.params || {});
    if (op.from != null && newAxes && newAxes.length) {
      const existing = this._structuralAxesOnSource(op.from);
      for (const [rel, axes] of existing) {
        const shared = newAxes.filter((ax) => axes.has(ax));
        if (shared.length) {
          out.push(this._diag('STRUCTURAL_CONFLICT', SEVERITY.WARNING,
            `${op.relation} and existing "${rel}" both write ${shared.join('/')} on ${op.from} — last-writer-wins.`,
            { target: { kind: 'relation', relation: op.relation }, context: { conflictsWith: rel, axes: shared } }));
          break;
        }
      }
    }
  }

  /**
   * Which position axes a structural placement relation writes: ['x','y'] for a
   * full write, one axis for aligned_with, [] for aligned_with with no valid axis,
   * or null if `relation` is not a structural placement relation.
   */
  private _structuralAxes(relation: string, params: any): string[] | null {
    if (STRUCTURAL_FULL_WRITE.has(relation)) return ['x', 'y'];
    if (relation === 'aligned_with') {
      const ax = params && params.axis;
      return (ax === 'x' || ax === 'y') ? [ax] : [];
    }
    return null;
  }

  /** Map<relation, Set<axis>> of structural placement relations already on a source. */
  private _structuralAxesOnSource(fromId: string): Map<string, Set<string>> {
    const byRel = new Map<string, Set<string>>();
    const items = this._safe(() => this.ctx.getAllItems!(), [] as ValidatorItemEntry[]) || [];
    const entry = items.find((e) => e.itemId === fromId);
    const assoc = entry && entry.item && entry.item.data && entry.item.data.associations;
    if (!assoc) return byRel;
    for (const rel of Object.keys(assoc)) {
      for (const a of (assoc[rel] || [])) {
        const axes = this._structuralAxes(rel, a.params || {});
        if (axes && axes.length) {
          const set = byRel.get(rel) || new Set<string>();
          axes.forEach((ax) => set.add(ax));
          byRel.set(rel, set);
        }
      }
    }
    return byRel;
  }

  private _associationGraph(): Map<string, Set<string>> {
    const graph = new Map<string, Set<string>>();
    const items = this._safe(() => this.ctx.getAllItems!(), [] as ValidatorItemEntry[]) || [];
    for (const entry of items) {
      const assoc = entry.item && entry.item.data && entry.item.data.associations;
      const deps = graph.get(entry.itemId) || new Set<string>();
      if (assoc) for (const r of Object.keys(assoc)) for (const a of (assoc[r] || [])) if (a.target != null && a.target !== entry.itemId) deps.add(a.target);
      graph.set(entry.itemId, deps);
    }
    return graph;
  }

  private _reachPath(graph: Map<string, Set<string>>, start: string, target: string): string[] | null {
    const seen = new Set<string>();
    const dfs = (n: string, path: string[]): string[] | null => {
      if (n === target) return path;
      if (seen.has(n)) return null;
      seen.add(n);
      for (const d of (graph.get(n) || [])) { const r = dfs(d, path.concat(d)); if (r) return r; }
      return null;
    };
    return dfs(start, [start]);
  }

  private _checkCreate(op: any, out: Diagnostic[]): void {
    if (op.type && !this._safe(() => this.ctx.hasItemType!(op.type), true)) {
      out.push(this._diag('UNKNOWN_ITEM_TYPE', SEVERITY.ERROR, `Unknown item type "${op.type}".`,
        { target: { kind: 'item' }, context: { value: op.type } }));
    }
    const p = op.params || {};
    if (p.keyframes) this._checkKeyframes(p.keyframes, out, { kind: 'item', id: op.id });
  }

  private _checkModify(op: any, out: Diagnostic[]): void {
    if (op.id == null || !this._refOk(op.id)) {
      out.push(this._refMissing('TARGET_NOT_FOUND', op.id, null, null));
      return;
    }
    const changes = op.changes || {};
    for (const key of Object.keys(changes)) {
      if (key.startsWith('_')) continue;
      if (!KNOWN_MODIFY_PROPS.has(key)) {
        out.push(this._diag('UNKNOWN_PROPERTY', SEVERITY.WARNING,
          `modify "${op.id}": property "${key}" is not applied by the engine (silent no-op).`,
          { target: { kind: 'item', id: op.id, property: key }, context: { property: key } }));
      }
    }
    if (changes.keyframes) this._checkKeyframes(changes.keyframes, out, { kind: 'item', id: op.id });
  }

  private _checkDelete(op: any, out: Diagnostic[]): void {
    if (op.id == null || !this._refOk(op.id)) {
      out.push(this._refMissing('TARGET_NOT_FOUND', op.id, null, null));
      return;
    }
    const items = this._safe(() => this.ctx.getAllItems!(), [] as ValidatorItemEntry[]) || [];
    for (const entry of items) {
      const assoc = entry.item && entry.item.data && entry.item.data.associations;
      if (!assoc) continue;
      for (const relation of Object.keys(assoc)) {
        for (const a of (assoc[relation] || [])) {
          if (a.target === op.id) {
            out.push(this._diag('WOULD_DANGLE', SEVERITY.WARNING,
              `Deleting "${op.id}" would dangle "${entry.itemId}"'s "${relation}" relation.`,
              { target: { kind: 'relation', id: entry.itemId, relation }, context: { deletes: op.id } }));
          }
        }
      }
    }
  }

  private _checkKeyframes(kfs: any, out: Diagnostic[], target: Record<string, unknown>): void {
    if (!Array.isArray(kfs)) return;
    let prev = -Infinity, ordered = true;
    for (const kf of kfs) {
      if (!kf || typeof kf !== 'object') continue;
      const t = kf.time;
      if (typeof t !== 'number' || Number.isNaN(t)) {
        out.push(this._diag('KEYFRAME_TIME', SEVERITY.ERROR, `Keyframe time must be a number, got ${typeof t}.`, { target, context: { time: t } }));
      } else if (t < 0) {
        out.push(this._diag('KEYFRAME_TIME', SEVERITY.ERROR, `Keyframe time ${t} is negative.`, { target, context: { time: t }, fix: { kind: 'clamp', suggestion: 'Use 0', apply: { time: 0 } } }));
      } else {
        if (t < prev) ordered = false;
        prev = t;
      }
      if (kf.easing != null && !KNOWN_EASINGS.has(kf.easing)) {
        const near = this._nearest(String(kf.easing), [...KNOWN_EASINGS]);
        out.push(this._diag('KEYFRAME_EASING', SEVERITY.WARNING, `Unknown easing "${kf.easing}".`,
          { target, context: { easing: kf.easing }, fix: near ? { kind: 'replace', suggestion: `Use "${near}"`, apply: { easing: near } } : undefined }));
      }
    }
    if (!ordered) {
      out.push(this._diag('KEYFRAME_ORDER', SEVERITY.WARNING, 'Keyframes are not in non-decreasing time order.',
        { target, fix: { kind: 'sort', suggestion: 'Sort keyframes by time' } }));
    }
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private _isVirtual(id: string): boolean { return id === 'camera' || id === 'cursor' || id === 'mouse' || id === 'pointer'; }

  private _refOk(id: any): boolean {
    if (id == null) return false;
    if (typeof id === 'string' && this._isVirtual(id)) return true;
    if (typeof id === 'string' && id.startsWith('cursor:')) return true; // collaborator cursor
    if (this._batchPending && this._batchPending.has(id)) return true;
    return !!this._safe(() => this.ctx.getItem!(id), null);
  }

  private _refMissing(code: string, missingId: any, ownerId: string | null, relation: string | null): Diagnostic {
    const ids = (this._safe(() => this.ctx.getAllItems!(), [] as ValidatorItemEntry[]) || []).map((e) => e.itemId).filter(Boolean);
    const near = this._nearest(String(missingId), ids);
    const dangling = code === 'DANGLING_ASSOCIATION';
    const noun = code === 'SOURCE_NOT_FOUND' ? 'Source' : 'Target';
    const message = dangling
      ? `Item "${ownerId}" has a "${relation}" to "${missingId}", which no longer exists${near ? ` — did you mean "${near}"?` : ''}.`
      : `${noun} "${missingId}" does not exist${near ? ` — did you mean "${near}"?` : ''}.`;
    return this._diag(code, dangling ? SEVERITY.WARNING : SEVERITY.ERROR, message,
      { target: dangling ? { kind: 'relation', id: ownerId, relation } : { kind: 'item', id: missingId, relation: relation || undefined },
        context: { missing: missingId },
        fix: near ? { kind: 'replace', suggestion: `Use "${near}"`, apply: { [dangling ? 'target' : 'id']: near } } : undefined });
  }

  private _typeMatches(v: any, type: string): boolean {
    switch (type) {
      case 'number': return typeof v === 'number' && !Number.isNaN(v);
      case 'string': return typeof v === 'string';
      case 'boolean': return typeof v === 'boolean';
      case 'array': return Array.isArray(v);
      case 'object': return v != null && typeof v === 'object' && !Array.isArray(v);
      default: return true;
    }
  }

  private _nearest(target: string, candidates: string[]): string | null {
    if (!target || !candidates || !candidates.length) return null;
    let best: string | null = null, bestD = Infinity;
    for (const c of candidates) {
      if (c === target) continue;
      const d = this._lev(target, c);
      if (d < bestD) { bestD = d; best = c; }
    }
    const threshold = Math.max(2, Math.floor(target.length * 0.34));
    return bestD <= threshold ? best : null;
  }

  private _lev(a: string, b: string): number {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  private _findCycle(graph: Map<string, Set<string>>): string[] | null {
    const visited = new Set<string>(), onStack = new Set<string>(), stack: string[] = [];
    const dfs = (n: string): string[] | null => {
      if (onStack.has(n)) return stack.slice(stack.indexOf(n)).concat(n);
      if (visited.has(n)) return null;
      visited.add(n); onStack.add(n); stack.push(n);
      for (const d of (graph.get(n) || [])) { const c = dfs(d); if (c) return c; }
      onStack.delete(n); stack.pop();
      return null;
    };
    for (const n of graph.keys()) { const c = dfs(n); if (c) return c; }
    return null;
  }

  private _diag(code: string, severity: string, message: string, extra: Partial<Diagnostic> = {}): Diagnostic {
    return { code, severity, message, ...extra };
  }

  private _result(diagnostics: Diagnostic[]): ValidatorResult {
    diagnostics.sort((a, b) => {
      const s = (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9);
      if (s) return s;
      if (a.code !== b.code) return a.code < b.code ? -1 : 1;
      const ta = (a.target && (a.target.id || a.target.relation)) || '';
      const tb = (b.target && (b.target.id || b.target.relation)) || '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });
    return {
      ok: diagnostics.every((d) => d.severity !== SEVERITY.ERROR),
      diagnostics,
      validatorVersion: VALIDATOR_VERSION,
    };
  }

  private _safe<T>(fn: () => T, fallback: T): T {
    try { return fn(); } catch { return fallback; }
  }
}

/** An item type is known if the ontology recognizes it (raw key or pp: type). */
function isKnownItemType(t: string): boolean {
  if (!t) return false;
  if ((ITEM_TYPE_MAP as Record<string, unknown>)[t]) return true;
  const types = PP_VOCABULARY.types as Record<string, unknown>;
  return !!types[t] || !!types[`pp:${t.charAt(0).toUpperCase()}${t.slice(1)}`];
}

/** A relation type is known if it's in the ontology's RELATION_TYPE_MAP. */
function isKnownRelationType(name: string): boolean {
  return !!name && !!(RELATION_TYPE_MAP as Record<string, unknown>)[name];
}

/**
 * Adapt a template DEFINITION ({ data: { items, relations } }) to a ValidatorContext,
 * so OntologyValidator.validateScene() runs Node-side over a static design — no browser.
 * Relations are folded into each source item's `data.associations`, mirroring how the
 * live engine stores them, so dangling-target / cycle / duplicate checks all apply.
 */
export function buildDefinitionValidatorContext(definition: any): ValidatorContext {
  const data = (definition && definition.data) || {};
  const items: any[] = Array.isArray(data.items) ? data.items : [];
  const relations: any[] = Array.isArray(data.relations) ? data.relations : [];

  const byId = new Map<string, ValidatorItemEntry>();
  const entries: ValidatorItemEntry[] = [];
  for (const item of items) {
    const itemId = item.id || item.name || null;
    if (itemId == null) continue;
    const entry: ValidatorItemEntry = {
      itemId: String(itemId),
      item: { data: { ...item, associations: {} as Record<string, any[]> } },
      type: item.type,
    };
    byId.set(entry.itemId, entry);
    entries.push(entry);
  }

  for (const rel of relations) {
    const source = rel.source ?? rel.from;
    const target = rel.target ?? rel.to ?? null;
    const relationType = rel.type;
    if (source == null || relationType == null) continue;
    const entry = byId.get(String(source));
    if (!entry) continue; // source not in items — surfaced separately by validateOps if needed
    const assoc = entry.item.data!.associations as Record<string, any[]>;
    (assoc[relationType] = assoc[relationType] || []).push({ target, params: rel.params || {} });
  }

  return {
    getItem: (id: string) => byId.get(id)?.item ?? null,
    getAllItems: () => entries,
    hasItemType: (t: string) => isKnownItemType(t),
    getRule: (name: string) => (isKnownRelationType(name) ? { params: {} } : null),
  };
}

/** Convenience: run the semantic validator over a template definition. */
export function validateDefinitionSemantics(definition: any): ValidatorResult {
  return new OntologyValidator(buildDefinitionValidatorContext(definition)).validateScene();
}
