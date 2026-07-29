/**
 * OntologyCompiler (S12-E3) — the reverse of DesignGraph.
 *
 * Ported from FxTool/js/ontology/OntologyCompiler.js to typed TypeScript. Compiles
 * a pp:-namespaced JSON-LD document (typed nodes + structural edges like pp:onTopOf)
 * into a scene document `{ items, relations }` plus an op list the MCP can emit as
 * app.create / app.addRelation calls — so "author an ontology, get a design" holds
 * without a FxTool round-trip. Only ROOT nodes get absolute coordinates; every other
 * node's position is DERIVED at runtime from its structural relations.
 *
 *   const { scene, ops, diagnostics } = new OntologyCompiler().compile(doc);
 *
 * Kept bit-faithful to FxTool's compiler (same root placement, same diagnostics)
 * so extract(compile(O)) round-trips O's typed structural edges.
 */

import { ITEM_TYPE_MAP, RELATION_TYPE_MAP } from './vocabulary.js';

const STRUCTURAL_RELATIONS = new Set(['on_top_of', 'below', 'beside', 'inside', 'centered_on', 'aligned_with']);

// Type → default geometry. Overridable via new OntologyCompiler({ defaultGeometry }).
const DEFAULT_GEOMETRY: Record<string, { width: number; height: number }> = {
  rectangle: { width: 100, height: 100 },
  circle: { width: 100, height: 100 },
  ellipse: { width: 100, height: 100 },
  triangle: { width: 100, height: 100 },
  star: { width: 100, height: 100 },
  polygon: { width: 100, height: 100 },
  line: { width: 100, height: 2 },
  text: { width: 200, height: 40 },
  image: { width: 200, height: 200 },
  group: { width: 100, height: 100 },
};
const FALLBACK_GEOMETRY = { width: 100, height: 100 };

// Inverse maps (pp:IRI → runtime). ITEM_TYPE_MAP is not injective; the FIRST runtime
// key for each IRI wins as the canonical inverse (matches FxTool).
const INV_ITEM_TYPE: Record<string, string> = {};
for (const [rt, pp] of Object.entries(ITEM_TYPE_MAP)) if (!(pp in INV_ITEM_TYPE)) INV_ITEM_TYPE[pp] = rt;
const INV_RELATION_TYPE: Record<string, string> = {};
for (const [rt, pp] of Object.entries(RELATION_TYPE_MAP)) INV_RELATION_TYPE[pp] = rt;

const stripNodePrefix = (iri: unknown): unknown => (typeof iri === 'string' ? iri.replace(/^pp:node\//, '') : iri);
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

export type CompileSeverity = 'info' | 'warning' | 'error';
export interface CompileDiagnostic {
  severity: CompileSeverity;
  code: string;
  message: string;
  node?: string;
}
export interface CompiledItem {
  id: string;
  type: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
}
export interface CompiledRelation {
  from: string;
  to: string | null;
  type: string;
  params: Record<string, unknown>;
}
export type CompiledOp =
  | ({ op: 'create' } & CompiledItem)
  | { op: 'addRelation'; from: string; to: string | null; relation: string; params: Record<string, unknown> };
export interface CompileResult {
  scene: { items: CompiledItem[]; relations: CompiledRelation[] };
  ops: CompiledOp[];
  diagnostics: CompileDiagnostic[];
}

interface ParsedNode {
  id: string;
  ppType: unknown;
  runtimeType: string;
  detected: boolean;
  geom: { width?: number; height?: number; x?: number; y?: number };
}

export interface OntologyCompilerOptions {
  canvas?: { width: number; height: number };
  defaultGeometry?: Record<string, { width: number; height: number }>;
}

export class OntologyCompiler {
  private canvas: { width: number; height: number };
  private defaultGeometry: Record<string, { width: number; height: number }>;

  constructor(opts: OntologyCompilerOptions = {}) {
    this.canvas = opts.canvas || { width: 1080, height: 1080 };
    this.defaultGeometry = { ...DEFAULT_GEOMETRY, ...(opts.defaultGeometry || {}) };
  }

  compile(doc: any): CompileResult {
    const diagnostics: CompileDiagnostic[] = [];
    const diag = (severity: CompileSeverity, code: string, message: string, extra?: { node?: string }) =>
      diagnostics.push({ severity, code, message, ...(extra || {}) });
    doc = doc || {};

    const nodes = this._readNodes(doc, diag);
    const edges = this._readEdges(doc, nodes, diag);
    const positions = this._placeRoots(nodes, edges, diag);

    const items: CompiledItem[] = [];
    for (const [id, n] of nodes) {
      const g = this.defaultGeometry[n.runtimeType] || FALLBACK_GEOMETRY;
      const item: CompiledItem = {
        id,
        type: n.runtimeType,
        width: n.geom.width != null ? n.geom.width : g.width,
        height: n.geom.height != null ? n.geom.height : g.height,
      };
      const pos = (n.geom.x != null && n.geom.y != null) ? { x: n.geom.x, y: n.geom.y } : positions.get(id);
      if (pos) { item.x = pos.x; item.y = pos.y; }
      items.push(item);
    }
    const relations: CompiledRelation[] = edges.map((e) => ({ from: e.from, to: e.to, type: e.type, params: e.params }));

    const ops: CompiledOp[] = [];
    for (const it of items) ops.push({ op: 'create', ...it });
    for (const r of relations) ops.push({ op: 'addRelation', from: r.from, to: r.to, relation: r.type, params: r.params });

    return { scene: { items, relations }, ops, diagnostics };
  }

  private _readNodes(doc: any, diag: (s: CompileSeverity, c: string, m: string, e?: { node?: string }) => void): Map<string, ParsedNode> {
    const raw = doc['pp:nodes'] || doc.nodes || (Array.isArray(doc['@graph']) ? doc['@graph'] : []);
    const nodes = new Map<string, ParsedNode>();
    for (const n of (raw || [])) {
      const id = stripNodePrefix(n['@id'] != null ? n['@id'] : n.id) as string | undefined;
      if (id == null) { diag('warning', 'NODE_NO_ID', 'node without @id/id skipped'); continue; }
      const ppType = n['@type'] || n.type;
      let runtimeType = INV_ITEM_TYPE[ppType];
      let detected = false;
      if (!runtimeType) {
        if (typeof ppType === 'string' && ppType.startsWith('pp:Detected')) {
          runtimeType = 'rectangle'; detected = true;
          diag('info', 'DETECTED_PLACEHOLDER', `detected class "${ppType}" → rectangle placeholder`, { node: id });
        } else {
          runtimeType = 'rectangle';
          diag('warning', 'UNKNOWN_TYPE', `unknown @type "${ppType}" for node "${id}" → rectangle`, { node: id });
        }
      }
      const geom: ParsedNode['geom'] = {};
      const w = num(n['pp:width'] != null ? n['pp:width'] : n.width);
      const h = num(n['pp:height'] != null ? n['pp:height'] : n.height);
      const x = num(n['pp:x'] != null ? n['pp:x'] : n.x);
      const y = num(n['pp:y'] != null ? n['pp:y'] : n.y);
      if (w != null) geom.width = w;
      if (h != null) geom.height = h;
      if (x != null) geom.x = x;
      if (y != null) geom.y = y;
      nodes.set(id, { id, ppType, runtimeType, detected, geom });
    }
    return nodes;
  }

  private _readEdges(doc: any, nodes: Map<string, ParsedNode>, diag: (s: CompileSeverity, c: string, m: string) => void): CompiledRelation[] {
    const edges: CompiledRelation[] = [];
    const seen = new Set<string>();
    const add = (from: string, to: string | null, type: string, params?: Record<string, unknown>) => {
      const k = `${from} ${to} ${type}`;
      if (seen.has(k)) return;
      seen.add(k);
      edges.push({ from, to, type, params: params || {} });
    };

    for (const e of (doc['pp:edges'] || doc.edges || [])) {
      const ppType = e['@type'] || e.type;
      let rel = INV_RELATION_TYPE[ppType];
      if (!rel && RELATION_TYPE_MAP[ppType]) rel = ppType; // tolerate a runtime name given directly
      if (!rel) { diag('warning', 'UNKNOWN_EDGE', `unknown edge type "${ppType}" skipped`); continue; }
      const from = stripNodePrefix(e['pp:source'] || e.source || e.from) as string;
      const to = stripNodePrefix(e['pp:target'] != null ? e['pp:target'] : (e.target != null ? e.target : e.to)) as string | null;
      if (!nodes.has(from)) { diag('warning', 'EDGE_BAD_SOURCE', `edge "${ppType}" source "${from}" is not a node; skipped`); continue; }
      if (to != null && !nodes.has(to)) { diag('warning', 'EDGE_BAD_TARGET', `edge "${ppType}" target "${to}" is not a node; skipped`); continue; }
      add(from, to, rel, e['pp:params'] || e.params || {});
    }

    // Inline: a node property whose key is a pp: relation IRI.
    for (const n of (doc['pp:nodes'] || doc.nodes || [])) {
      const from = stripNodePrefix(n['@id'] != null ? n['@id'] : n.id) as string;
      if (!nodes.has(from)) continue;
      for (const key of Object.keys(n)) {
        const rel = INV_RELATION_TYPE[key];
        if (!rel) continue;
        const vals = Array.isArray(n[key]) ? n[key] : [n[key]];
        for (const v of vals) {
          const to = stripNodePrefix(typeof v === 'string' ? v : (v && (v['@id'] || v.id || v.target))) as string | null;
          let params: Record<string, unknown> = {};
          if (v && typeof v === 'object') {
            params = v.params || v['pp:params'] ||
              Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('@') && k !== 'id' && k !== 'target'));
          }
          if (to != null && nodes.has(to)) add(from, to, rel, params);
          else diag('warning', 'EDGE_BAD_REF', `inline "${key}" ${from}→${to} skipped (target not a node)`);
        }
      }
    }
    return edges;
  }

  /**
   * Root placement: connected components over structural edges; a ROOT is a node
   * never the SOURCE of a structural relation. Components tile the canvas row-major;
   * each component's roots get its cell center. Non-roots get NO position (derived).
   */
  private _placeRoots(nodes: Map<string, ParsedNode>, edges: CompiledRelation[], diag: (s: CompileSeverity, c: string, m: string) => void): Map<string, { x: number; y: number }> {
    const placedSources = new Set(edges.filter((e) => STRUCTURAL_RELATIONS.has(e.type)).map((e) => e.from));
    const adj = new Map<string, Set<string>>();
    for (const id of nodes.keys()) adj.set(id, new Set());
    for (const e of edges) {
      if (!STRUCTURAL_RELATIONS.has(e.type) || e.to == null) continue;
      adj.get(e.from)!.add(e.to);
      adj.get(e.to)!.add(e.from);
    }
    const components: string[][] = [];
    const seen = new Set<string>();
    for (const id of nodes.keys()) {
      if (seen.has(id)) continue;
      const members: string[] = [];
      const stack = [id];
      while (stack.length) {
        const nId = stack.pop()!;
        if (seen.has(nId)) continue;
        seen.add(nId);
        members.push(nId);
        for (const m of adj.get(nId)!) if (!seen.has(m)) stack.push(m);
      }
      components.push(members);
    }

    const cols = Math.max(1, Math.ceil(Math.sqrt(components.length)));
    const rows = Math.max(1, Math.ceil(components.length / cols));
    const cellW = this.canvas.width / cols;
    const cellH = this.canvas.height / rows;
    const positions = new Map<string, { x: number; y: number }>();
    components.forEach((members, k) => {
      const col = k % cols;
      const row = Math.floor(k / cols);
      const cx = cellW * (col + 0.5);
      const cy = cellH * (row + 0.5);
      let roots = members.filter((m) => !placedSources.has(m));
      if (roots.length === 0) {
        roots = [members[0]]; // cyclic component — no natural root
        diag('warning', 'NO_ROOT', `component [${members.join(', ')}] has no root (cycle); "${members[0]}" pinned`);
      }
      roots.forEach((r, i) => {
        positions.set(r, { x: Math.round(cx + (i - (roots.length - 1) / 2) * 40), y: Math.round(cy) });
      });
    });
    return positions;
  }
}
