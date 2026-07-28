/**
 * OntologyValidator (ported from FxTool S3.4) — semantic diagnostics over a definition.
 */

import { describe, it, expect } from 'bun:test';
import {
  OntologyValidator,
  validateDefinitionSemantics,
  buildDefinitionValidatorContext,
} from '../../ontology/ontology-validator.js';

describe('OntologyValidator', () => {
  it('a clean definition validates with no errors', () => {
    const def = {
      data: {
        items: [
          { id: 'sun', type: 'circle' },
          { id: 'earth', type: 'circle' },
        ],
        relations: [{ source: 'earth', target: 'sun', type: 'orbits', params: { radius: 150 } }],
      },
    };
    const r = validateDefinitionSemantics(def);
    expect(r.ok).toBe(true);
    expect(r.diagnostics.filter((d) => d.severity === 'error')).toHaveLength(0);
    expect(r.validatorVersion).toBe('1.2.0');
  });

  it('flags a dangling relation target with a nearest-id suggestion', () => {
    const def = {
      data: {
        items: [
          { id: 'earth', type: 'circle' },
          { id: 'sun', type: 'circle' },
        ],
        relations: [{ source: 'earth', target: 'sunn', type: 'orbits' }],
      },
    };
    const r = validateDefinitionSemantics(def);
    const dangling = r.diagnostics.find((d) => d.code === 'DANGLING_ASSOCIATION');
    expect(dangling).toBeDefined();
    expect(dangling!.message).toContain('sun'); // nearest-id suggestion
  });

  it('flags an unknown item type', () => {
    const def = { data: { items: [{ id: 'a', type: 'sphereoid' }], relations: [] } };
    const r = validateDefinitionSemantics(def);
    expect(r.diagnostics.some((d) => d.code === 'UNKNOWN_ITEM_TYPE')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('flags an unknown relation type', () => {
    const def = {
      data: {
        items: [{ id: 'a', type: 'circle' }, { id: 'b', type: 'circle' }],
        relations: [{ source: 'a', target: 'b', type: 'orbts' }],
      },
    };
    const r = validateDefinitionSemantics(def);
    expect(r.diagnostics.some((d) => d.code === 'UNKNOWN_RELATION')).toBe(true);
  });

  it('detects a relation cycle', () => {
    const def = {
      data: {
        items: [{ id: 'a', type: 'circle' }, { id: 'b', type: 'circle' }],
        relations: [
          { source: 'a', target: 'b', type: 'follows' },
          { source: 'b', target: 'a', type: 'follows' },
        ],
      },
    };
    const r = validateDefinitionSemantics(def);
    expect(r.diagnostics.some((d) => d.code === 'RELATION_CYCLE')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('accepts the cursor/camera virtual targets without flagging', () => {
    const def = {
      data: {
        items: [{ id: 'a', type: 'circle' }],
        relations: [{ source: 'a', target: 'cursor', type: 'repels' }],
      },
    };
    const r = validateDefinitionSemantics(def);
    expect(r.diagnostics.some((d) => d.code === 'DANGLING_ASSOCIATION')).toBe(false);
  });

  it('the new construction relations are recognized (no UNKNOWN_RELATION)', () => {
    const def = {
      data: {
        items: [{ id: 'm', type: 'circle' }, { id: 'a', type: 'circle' }],
        relations: [{ source: 'm', target: 'a', type: 'is_midpoint_of', params: { other: 'a' } }],
      },
    };
    const r = validateDefinitionSemantics(def);
    expect(r.diagnostics.some((d) => d.code === 'UNKNOWN_RELATION')).toBe(false);
  });

  it('validateOps pre-validates a batch with forward references', () => {
    const ctx = buildDefinitionValidatorContext({ data: { items: [], relations: [] } });
    const v = new OntologyValidator(ctx);
    const r = v.validateOps([
      { kind: 'create', id: 'c1', type: 'circle' },
      { kind: 'addRelation', from: 'c1', to: 'missing', relation: 'orbits' },
    ]);
    // c1 is fine (created earlier in batch); 'missing' target is flagged
    expect(r.diagnostics.some((d) => d.code === 'TARGET_NOT_FOUND')).toBe(true);
    expect(r.diagnostics.some((d) => d.code === 'SOURCE_NOT_FOUND')).toBe(false);
  });

  // S12-E1 validator parity (v1.2.0)
  describe('structural layout diagnostics (1.2.0)', () => {
    const scene = () => buildDefinitionValidatorContext({
      data: {
        items: [{ id: 'a', type: 'circle' }, { id: 'b', type: 'circle' }, { id: 'c', type: 'circle' }],
        relations: [],
      },
    });

    it('flags MISSING_REQUIRED_PARAM when aligned_with has no axis', () => {
      const v = new OntologyValidator(scene());
      const r = v.validateOp({ kind: 'addRelation', from: 'a', to: 'b', relation: 'aligned_with', params: {} });
      const d = r.diagnostics.find((x) => x.code === 'MISSING_REQUIRED_PARAM');
      expect(d).toBeDefined();
      expect(d!.severity).toBe('error');
      expect(d!.target?.property).toBe('axis');
    });

    it('accepts aligned_with when axis is supplied', () => {
      const v = new OntologyValidator(scene());
      const r = v.validateOp({ kind: 'addRelation', from: 'a', to: 'b', relation: 'aligned_with', params: { axis: 'x' } });
      expect(r.diagnostics.some((x) => x.code === 'MISSING_REQUIRED_PARAM')).toBe(false);
    });

    it('warns STRUCTURAL_CONFLICT when two full-write relations share an axis', () => {
      const ctx = buildDefinitionValidatorContext({
        data: {
          items: [{ id: 'a', type: 'circle' }, { id: 'b', type: 'circle' }, { id: 'c', type: 'circle' }],
          relations: [{ source: 'a', target: 'b', type: 'on_top_of', params: {} }],
        },
      });
      const v = new OntologyValidator(ctx);
      const r = v.validateOp({ kind: 'addRelation', from: 'a', to: 'c', relation: 'centered_on', params: {} });
      const d = r.diagnostics.find((x) => x.code === 'STRUCTURAL_CONFLICT');
      expect(d).toBeDefined();
      expect(d!.severity).toBe('warning');
      expect(d!.context?.conflictsWith).toBe('on_top_of');
    });

    it('does NOT conflict when aligned_with uses a disjoint axis from an existing aligned_with', () => {
      const ctx = buildDefinitionValidatorContext({
        data: {
          items: [{ id: 'a', type: 'circle' }, { id: 'b', type: 'circle' }, { id: 'c', type: 'circle' }],
          relations: [{ source: 'a', target: 'b', type: 'aligned_with', params: { axis: 'x' } }],
        },
      });
      const v = new OntologyValidator(ctx);
      const r = v.validateOp({ kind: 'addRelation', from: 'a', to: 'c', relation: 'aligned_with', params: { axis: 'y' } });
      expect(r.diagnostics.some((x) => x.code === 'STRUCTURAL_CONFLICT')).toBe(false);
    });
  });
});
