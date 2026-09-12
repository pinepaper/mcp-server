/**
 * OntologyCompiler (S12-E3) — ported from FxTool. Compiles a pp: JSON-LD design
 * graph into a scene doc + op list. Root placement, structural-edge parsing, and
 * diagnostics must match FxTool's compiler.
 */

import { describe, it, expect } from 'bun:test';
import { OntologyCompiler } from '../../ontology/ontology-compiler.js';
import { codeGenerator } from '../../types/code-generator.js';

describe('OntologyCompiler.compile', () => {
  it('places a root and derives its dependent from a structural edge', () => {
    const doc = {
      nodes: [
        { id: 'bar', type: 'pp:Rectangle', width: 300, height: 40 },
        { id: 'glass', type: 'pp:Circle', width: 60, height: 60 },
      ],
      edges: [{ type: 'on_top_of', source: 'glass', target: 'bar', params: { gap: 2 } }],
    };
    const { scene, ops } = new OntologyCompiler().compile(doc);

    const bar = scene.items.find((i) => i.id === 'bar')!;
    const glass = scene.items.find((i) => i.id === 'glass')!;
    // bar is a root (never a structural source) → placed; glass is the source of
    // on_top_of → positioned at runtime, no coordinates.
    expect(bar.x).toBeDefined();
    expect(bar.y).toBeDefined();
    expect(glass.x).toBeUndefined();
    expect(glass.y).toBeUndefined();

    expect(scene.relations).toEqual([{ from: 'glass', to: 'bar', type: 'on_top_of', params: { gap: 2 } }]);
    // ops: creates first, then relations
    expect(ops[0].op).toBe('create');
    expect(ops.some((o) => o.op === 'addRelation' && (o as any).relation === 'on_top_of')).toBe(true);
  });

  it('accepts the DesignGraph.toJsonLd shape (pp:nodes / pp:edges, pp:IRIs)', () => {
    const doc = {
      'pp:nodes': [
        { '@id': 'pp:node/a', '@type': 'pp:Circle' },
        { '@id': 'pp:node/b', '@type': 'pp:Circle' },
      ],
      'pp:edges': [{ '@type': 'pp:centeredOn', 'pp:source': 'pp:node/a', 'pp:target': 'pp:node/b' }],
    };
    const { scene } = new OntologyCompiler().compile(doc);
    expect(scene.items.map((i) => i.id).sort()).toEqual(['a', 'b']);
    expect(scene.relations[0]).toMatchObject({ from: 'a', to: 'b', type: 'centered_on' });
  });

  it('falls back unknown @types to rectangle with a diagnostic (never hard-fails)', () => {
    const { scene, diagnostics } = new OntologyCompiler().compile({
      nodes: [{ id: 'x', type: 'pp:Nonsense' }],
    });
    expect(scene.items[0].type).toBe('rectangle');
    expect(diagnostics.some((d) => d.code === 'UNKNOWN_TYPE')).toBe(true);
  });

  it('pins a node in a cyclic component and reports NO_ROOT', () => {
    const doc = {
      nodes: [{ id: 'a', type: 'pp:Circle' }, { id: 'b', type: 'pp:Circle' }],
      edges: [
        { type: 'on_top_of', source: 'a', target: 'b' },
        { type: 'on_top_of', source: 'b', target: 'a' },
      ],
    };
    const { scene, diagnostics } = new OntologyCompiler().compile(doc);
    expect(diagnostics.some((d) => d.code === 'NO_ROOT')).toBe(true);
    // exactly one of the two gets pinned coordinates
    const placed = scene.items.filter((i) => i.x !== undefined);
    expect(placed.length).toBe(1);
  });

  it('honors explicit node coordinates over derived root placement', () => {
    const { scene } = new OntologyCompiler().compile({
      nodes: [{ id: 'a', type: 'pp:Circle', x: 123, y: 456 }],
    });
    expect(scene.items[0]).toMatchObject({ x: 123, y: 456 });
  });
});

describe('generateInstantiateOntology codegen', () => {
  it('emits guarded create/addRelation ops and bakes in diagnostics', () => {
    const code = codeGenerator.generateInstantiateOntology({
      doc: {
        nodes: [{ id: 'bar', type: 'pp:Rectangle' }, { id: 'glass', type: 'pp:Circle' }],
        edges: [{ type: 'on_top_of', source: 'glass', target: 'bar' }],
      },
    });
    expect(code).toContain('app.create(op.type');
    expect(code).toContain('app.addRelation(op.from, op.to, op.relation');
    expect(code).toContain("typeof app.create !== 'function'"); // guard
    expect(code).toContain('"on_top_of"'); // relation baked into ops
    expect(code).toContain('diagnostics');
    // ends in a (-led trailing expression → governor can capture its value
    expect(/\)\s*;?\s*$/.test(code.trim())).toBe(true);
  });

  it('prefers the studio engine door (app.instantiateOntology) with the raw doc, and keeps the box loop as the fallback', () => {
    const doc = {
      nodes: [{ id: 'hero', type: 'pp:Disk', 'pp:radius': 40, 'pp:fillColor': '#ff0000', 'pp:keyframeCount': 2 }],
      edges: [],
    };
    const code = codeGenerator.generateInstantiateOntology({ doc, canvas: { width: 800, height: 600 } });
    // the raw document rides to the engine, facets and all — the server never rewrites it
    expect(code).toContain("typeof app.instantiateOntology === 'function'");
    // awaitImages: the studio decorates rasters on their 'load' event; the call
    // returns once the last one has landed, so the screenshot after it is whole.
    expect(code).toContain('await app.instantiateOntology(doc, {"canvas":{"width":800,"height":600},"awaitImages":true})');
    expect(code).toContain('"pp:fillColor":"#ff0000"');
    expect(code).toContain('"pp:radius":40');
    // the fallback still exists for older studios and says what it lost
    expect(code).toContain('app.create(op.type');
    expect(code).toContain("engine: 'server-box'");
    expect(code).toMatch(/^\(async function\(\)/m);
  });

  it('reports every count the engine returns, and a failed image is not a success', () => {
    const code = codeGenerator.generateInstantiateOntology({
      doc: { nodes: [{ id: 'hero', type: 'pp:Disk', 'pp:radius': 40 }], edges: [] },
      canvas: { width: 800, height: 600 },
    });
    // OntologyCompiler.instantiate returns { itemIds, diagnostics, ...counts,
    // settled }. Surfacing a chosen three of the counts is how a scene that
    // looks built and is not becomes invisible over MCP.
    for (const key of [
      'keyframesApplied', 'masksApplied', 'deferred', 'relationsApplied',
      'connectorsApplied', 'interactionsApplied', 'effectsApplied',
      'groupsCreated', 'nested', 'imagesFailed', 'backgroundApplied', 'duration',
    ]) {
      expect(code).toContain(`${key}: r.${key}`);
    }
    // A raster that never decoded must not report success, even when the
    // compiler logged no error-level diagnostic for it.
    expect(code).toContain('&& !r.imagesFailed');
  });
});

describe('generateLintScene codegen', () => {
  it('emits a guarded app.lintScene call and forwards opts', () => {
    const code = codeGenerator.generateLintScene({ eps: 6, cap: 10 });
    expect(code).toContain('app.lintScene(');
    expect(code).toContain('"eps":6');
    expect(code).toContain('"cap":10');
    expect(code).toContain("typeof app.lintScene !== 'function'"); // guard
    expect(/\)\s*;?\s*$/.test(code.trim())).toBe(true);
  });

  it('omits opts when none supplied (FxTool defaults apply)', () => {
    const code = codeGenerator.generateLintScene({});
    expect(code).toContain('app.lintScene({})');
  });
});
