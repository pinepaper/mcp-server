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
});
