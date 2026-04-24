/**
 * Ontology Module Tests
 *
 * Tests vocabulary data integrity, DesignGraph analysis, and KnowledgeGraphValidator scoring.
 */

import { describe, it, expect } from 'bun:test';
import {
  PP_VOCABULARY,
  ITEM_TYPE_MAP,
  RELATION_TYPE_MAP,
  DIAGRAM_SHAPE_MAP,
  CONNECTOR_STYLE_MAP,
  EASING_TO_MATH,
} from '../../ontology/vocabulary.js';
import { PP_SEMANTIC_VOCABULARY } from '../../ontology/semantic-vocabulary.js';
import { DesignGraph } from '../../ontology/design-graph.js';
import { KnowledgeGraphValidator, QUALITY_WEIGHTS } from '../../ontology/validator.js';
import type { TemplateDefinition, Fingerprint } from '../../ontology/types.js';

// =============================================================================
// VOCABULARY DATA INTEGRITY
// =============================================================================

describe('PP_VOCABULARY', () => {
  it('has types, edges, generators, patterns, properties, valueTypes, mathFunctions sections', () => {
    expect(PP_VOCABULARY.types).toBeDefined();
    expect(PP_VOCABULARY.edges).toBeDefined();
    expect(PP_VOCABULARY.generators).toBeDefined();
    expect(PP_VOCABULARY.patterns).toBeDefined();
    expect(PP_VOCABULARY.properties).toBeDefined();
    expect(PP_VOCABULARY.valueTypes).toBeDefined();
    expect(PP_VOCABULARY.mathFunctions).toBeDefined();
  });

  it('has expected number of types (49+)', () => {
    expect(Object.keys(PP_VOCABULARY.types).length).toBeGreaterThanOrEqual(49);
  });

  it('has expected number of edges (37+)', () => {
    expect(Object.keys(PP_VOCABULARY.edges).length).toBeGreaterThanOrEqual(37);
  });

  it('has expected number of generators (26)', () => {
    expect(Object.keys(PP_VOCABULARY.generators).length).toBe(26);
  });

  it('has expected number of math functions (38+)', () => {
    expect(Object.keys(PP_VOCABULARY.mathFunctions).length).toBeGreaterThanOrEqual(38);
  });

  it('all types with parentType reference valid types', () => {
    for (const [key, typeDef] of Object.entries(PP_VOCABULARY.types)) {
      if (typeDef.parentType) {
        expect(PP_VOCABULARY.types[typeDef.parentType]).toBeDefined();
      }
    }
  });

  it('all edges with parentType reference valid edges', () => {
    for (const [key, edgeDef] of Object.entries(PP_VOCABULARY.edges)) {
      if (edgeDef.parentType) {
        expect(PP_VOCABULARY.edges[edgeDef.parentType]).toBeDefined();
      }
    }
  });

  it('all generators with parentType reference valid generators', () => {
    for (const [key, genDef] of Object.entries(PP_VOCABULARY.generators)) {
      if (genDef.parentType) {
        expect(PP_VOCABULARY.generators[genDef.parentType]).toBeDefined();
      }
    }
  });

  it('all edge mathFunctions reference valid math function keys', () => {
    for (const [key, edgeDef] of Object.entries(PP_VOCABULARY.edges)) {
      if (edgeDef.mathFunctions) {
        for (const fn of edgeDef.mathFunctions) {
          expect(PP_VOCABULARY.mathFunctions[fn]).toBeDefined();
        }
      }
    }
  });

  it('all generator mathFunctions reference valid math function keys', () => {
    for (const [key, genDef] of Object.entries(PP_VOCABULARY.generators)) {
      if (genDef.mathFunctions) {
        for (const fn of genDef.mathFunctions) {
          expect(PP_VOCABULARY.mathFunctions[fn]).toBeDefined();
        }
      }
    }
  });

  it('all pattern requiredEdges reference valid edge keys', () => {
    for (const [key, patternDef] of Object.entries(PP_VOCABULARY.patterns)) {
      if (patternDef.requiredEdges) {
        for (const edge of patternDef.requiredEdges) {
          expect(PP_VOCABULARY.edges[edge]).toBeDefined();
        }
      }
    }
  });

  it('all pattern nodeTypes reference valid type keys', () => {
    for (const [key, patternDef] of Object.entries(PP_VOCABULARY.patterns)) {
      if (patternDef.nodeTypes) {
        for (const nt of patternDef.nodeTypes) {
          expect(PP_VOCABULARY.types[nt]).toBeDefined();
        }
      }
    }
  });

  it('all pattern mathFunctions reference valid math function keys', () => {
    for (const [key, patternDef] of Object.entries(PP_VOCABULARY.patterns)) {
      if (patternDef.mathFunctions) {
        for (const fn of patternDef.mathFunctions) {
          expect(PP_VOCABULARY.mathFunctions[fn]).toBeDefined();
        }
      }
    }
  });

  it('all property appliesTo reference valid type keys', () => {
    for (const [key, propDef] of Object.entries(PP_VOCABULARY.properties)) {
      for (const target of propDef.appliesTo) {
        expect(PP_VOCABULARY.types[target]).toBeDefined();
      }
    }
  });
});

describe('Mapping Tables', () => {
  it('ITEM_TYPE_MAP values exist in PP_VOCABULARY.types', () => {
    for (const [key, ppType] of Object.entries(ITEM_TYPE_MAP)) {
      expect(PP_VOCABULARY.types[ppType]).toBeDefined();
    }
  });

  it('RELATION_TYPE_MAP values exist in PP_VOCABULARY.edges', () => {
    for (const [key, ppEdge] of Object.entries(RELATION_TYPE_MAP)) {
      expect(PP_VOCABULARY.edges[ppEdge]).toBeDefined();
    }
  });

  it('DIAGRAM_SHAPE_MAP values exist in PP_VOCABULARY.types', () => {
    for (const [key, ppType] of Object.entries(DIAGRAM_SHAPE_MAP)) {
      expect(PP_VOCABULARY.types[ppType]).toBeDefined();
    }
  });

  it('CONNECTOR_STYLE_MAP values exist in PP_VOCABULARY.types', () => {
    for (const [key, ppType] of Object.entries(CONNECTOR_STYLE_MAP)) {
      expect(PP_VOCABULARY.types[ppType]).toBeDefined();
    }
  });

  it('EASING_TO_MATH values exist in PP_VOCABULARY.mathFunctions (except null)', () => {
    for (const [key, fn] of Object.entries(EASING_TO_MATH)) {
      if (fn !== null) {
        expect(PP_VOCABULARY.mathFunctions[fn]).toBeDefined();
      }
    }
  });

  it('ITEM_TYPE_MAP has 24 entries', () => {
    expect(Object.keys(ITEM_TYPE_MAP).length).toBe(24);
  });

  it('RELATION_TYPE_MAP has 24 entries', () => {
    expect(Object.keys(RELATION_TYPE_MAP).length).toBe(24);
  });
});

describe('PP_SEMANTIC_VOCABULARY', () => {
  it('has all 9 categories', () => {
    expect(PP_SEMANTIC_VOCABULARY.moods).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.visualStyles).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.colorSchemes).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.audiences).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.intents).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.animationComplexities).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.compositionStyles).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.contentTypes).toBeDefined();
    expect(PP_SEMANTIC_VOCABULARY.designIntents).toBeDefined();
  });

  it('has expected term counts', () => {
    expect(PP_SEMANTIC_VOCABULARY.moods.length).toBe(18);
    expect(PP_SEMANTIC_VOCABULARY.visualStyles.length).toBe(18);
    expect(PP_SEMANTIC_VOCABULARY.colorSchemes.length).toBe(11);
    expect(PP_SEMANTIC_VOCABULARY.audiences.length).toBe(9);
    expect(PP_SEMANTIC_VOCABULARY.intents.length).toBe(9);
    expect(PP_SEMANTIC_VOCABULARY.animationComplexities.length).toBe(5);
    expect(PP_SEMANTIC_VOCABULARY.compositionStyles.length).toBe(8);
    expect(PP_SEMANTIC_VOCABULARY.contentTypes.length).toBe(8);
    expect(PP_SEMANTIC_VOCABULARY.designIntents.length).toBe(4);
  });
});

// =============================================================================
// DESIGN GRAPH
// =============================================================================

const sampleTemplate: TemplateDefinition = {
  id: 'test-template',
  name: 'Test Template',
  category: 'creative',
  dimensions: { width: 1080, height: 1080 },
  duration: 5,
  data: {
    items: [
      { id: 'title', type: 'text', content: 'Hello', x: 540, y: 300, fontSize: 72, animationType: 'keyframe', keyframes: [
        { time: 0, properties: { opacity: 0 }, easing: 'easeOut' },
        { time: 1, properties: { opacity: 1 }, easing: 'easeInOut' },
      ]},
      { id: 'bg-circle', type: 'circle', x: 540, y: 540 },
      { id: 'orbiting', type: 'star', x: 200, y: 200, animationType: 'rotate' },
    ],
    relations: [
      { type: 'orbits', source: 'orbiting', target: 'bg-circle' },
    ],
    backgroundGenerator: 'drawBokeh',
  },
};

describe('DesignGraph', () => {
  const dg = new DesignGraph();

  describe('getNodeType', () => {
    it('maps known item types', () => {
      expect(dg.getNodeType('text')).toBe('pp:Text');
      expect(dg.getNodeType('circle')).toBe('pp:Circle');
      expect(dg.getNodeType('rectangle')).toBe('pp:Rectangle');
    });

    it('returns pp:Group for unknown/undefined types', () => {
      expect(dg.getNodeType(undefined)).toBe('pp:Group');
      expect(dg.getNodeType('unknown-thing')).toBe('pp:Group');
    });

    it('is case-insensitive', () => {
      expect(dg.getNodeType('TEXT')).toBe('pp:Text');
      expect(dg.getNodeType('Circle')).toBe('pp:Circle');
    });
  });

  describe('getEdgeType', () => {
    it('maps known relation types', () => {
      expect(dg.getEdgeType('orbits')).toBe('pp:orbits');
      expect(dg.getEdgeType('attached_to')).toBe('pp:attachedTo');
      expect(dg.getEdgeType('wiggle')).toBe('pp:wiggle');
    });

    it('returns null for unknown/undefined relation types', () => {
      expect(dg.getEdgeType(undefined)).toBeNull();
      expect(dg.getEdgeType('nonexistent')).toBeNull();
    });
  });

  describe('hierarchy traversal', () => {
    it('getTypeHierarchy returns correct ancestry', () => {
      const hierarchy = dg.getTypeHierarchy('pp:Circle');
      expect(hierarchy).toEqual(['pp:Circle', 'pp:CanvasShape', 'pp:CanvasElement']);
    });

    it('getTypeHierarchy returns single element for root types', () => {
      const hierarchy = dg.getTypeHierarchy('pp:CanvasElement');
      expect(hierarchy).toEqual(['pp:CanvasElement']);
    });

    it('getTypeChildren returns direct subtypes', () => {
      const children = dg.getTypeChildren('pp:CanvasShape');
      expect(children).toContain('pp:Circle');
      expect(children).toContain('pp:Rectangle');
      expect(children).toContain('pp:Path');
      expect(children).not.toContain('pp:Text'); // pp:Text → pp:CanvasText
    });

    it('isSubtypeOf works correctly', () => {
      expect(dg.isSubtypeOf('pp:Circle', 'pp:CanvasShape')).toBe(true);
      expect(dg.isSubtypeOf('pp:Circle', 'pp:CanvasElement')).toBe(true);
      expect(dg.isSubtypeOf('pp:Circle', 'pp:Circle')).toBe(true);
      expect(dg.isSubtypeOf('pp:Circle', 'pp:Text')).toBe(false);
      expect(dg.isSubtypeOf('pp:ProcessShape', 'pp:DiagramShape')).toBe(true);
    });

    it('getEdgeHierarchy works for edges', () => {
      const hierarchy = dg.getEdgeHierarchy('pp:orbits');
      expect(hierarchy).toContain('pp:orbits');
      expect(hierarchy).toContain('pp:SpatialRelation');
      expect(hierarchy).toContain('pp:Relation');
    });

    it('getGeneratorHierarchy works', () => {
      const hierarchy = dg.getGeneratorHierarchy('drawBokeh');
      expect(hierarchy).toContain('drawBokeh');
      expect(hierarchy).toContain('pp:ParticleGenerator');
      expect(hierarchy).toContain('pp:ProceduralGenerator');
    });
  });

  describe('getPropertiesFor', () => {
    it('returns inherited properties', () => {
      const props = dg.getPropertiesFor('pp:Circle');
      const propNames = props.map(p => p.name);
      // From pp:CanvasElement
      expect(propNames).toContain('pp:x');
      expect(propNames).toContain('pp:opacity');
      // From pp:CanvasShape
      expect(propNames).toContain('pp:fillColor');
      expect(propNames).toContain('pp:strokeWidth');
      // Direct
      expect(propNames).toContain('pp:radius');
    });

    it('getAnimatableProperties returns only animatable ones', () => {
      const animatable = dg.getAnimatableProperties('pp:Circle');
      expect(animatable).toContain('pp:x');
      expect(animatable).toContain('pp:opacity');
      expect(animatable).toContain('pp:fillColor');
      expect(animatable).not.toContain('pp:radius'); // radius is not animatable
    });
  });

  describe('extractFromDefinition', () => {
    it('extracts nodes from items', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.nodes.length).toBe(3);
      expect(graph.nodes[0].type).toBe('pp:Text');
      expect(graph.nodes[1].type).toBe('pp:Circle');
      expect(graph.nodes[2].type).toBe('pp:Star');
    });

    it('extracts edges from relations', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const orbitsEdge = graph.edges.find(e => e.type === 'pp:orbits');
      expect(orbitsEdge).toBeDefined();
      expect(orbitsEdge!.source).toBe('orbiting');
      expect(orbitsEdge!.target).toBe('bg-circle');
    });

    it('extracts generator info', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.generator).toBeDefined();
      expect(graph.generator!.name).toBe('drawBokeh');
      expect(graph.generator!.mathFunctions).toContain('parametricCircle');
    });

    it('detects math functions', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.mathFunctions).toContain('keyframeLerp');
      expect(graph.mathFunctions).toContain('lerp');
      expect(graph.mathFunctions).toContain('easeOut');
      expect(graph.mathFunctions).toContain('easeInOut');
      // From orbits edge
      expect(graph.mathFunctions).toContain('parametricCircle');
      expect(graph.mathFunctions).toContain('sinCos');
      // From drawBokeh generator
      // (parametricCircle already counted)
    });

    it('detects patterns', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.patterns).toContain('orbitalComposition');
      expect(graph.patterns).toContain('keyframeAnimation');
      expect(graph.patterns).toContain('proceduralBackground');
    });

    it('computes fingerprint', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.fingerprint).toBeDefined();
      expect(graph.fingerprint!.totalNodes).toBe(3);
      expect(graph.fingerprint!.totalEdges).toBe(1);
      expect(graph.fingerprint!.hasGenerator).toBe(true);
      expect(graph.fingerprint!.generatorType).toBe('drawBokeh');
      expect(graph.fingerprint!.nodeTypeCounts['pp:Text']).toBe(1);
      expect(graph.fingerprint!.nodeTypeCounts['pp:Circle']).toBe(1);
      expect(graph.fingerprint!.nodeTypeCounts['pp:Star']).toBe(1);
    });

    it('infers semantics', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      expect(graph.semantics).toBeDefined();
      expect(graph.semantics!.animationComplexity).toBe('moderate');
      // Dominant type is pp:Text (title is text, there's also circle and star — text is first)
      expect(['mixed', 'text-focused']).toContain(graph.semantics!.contentType);
    });

    it('extracts mask edges from items with mask property', () => {
      const tmpl: TemplateDefinition = {
        id: 'mask-test', name: 'Mask Test', category: 'masking',
        data: {
          items: [
            { id: 'img1', type: 'rectangle', mask: { type: 'circle', animated: true } },
          ],
        },
      };
      const graph = dg.extractFromDefinition(tmpl);
      const maskEdge = graph.edges.find(e => e.type === 'pp:maskedBy');
      expect(maskEdge).toBeDefined();
      expect(maskEdge!.source).toBe('img1');
      // Node type should be updated to MaskedItem
      expect(graph.nodes[0].type).toBe('pp:MaskedItem');
    });

    it('refines path types based on closed property', () => {
      const tmpl: TemplateDefinition = {
        id: 'path-test', name: 'Path Test', category: 'creative',
        data: {
          items: [
            { id: 'p1', type: 'path', closed: true },
            { id: 'p2', type: 'path', closed: false },
          ],
        },
      };
      const graph = dg.extractFromDefinition(tmpl);
      expect(graph.nodes[0].type).toBe('pp:ClosedPath');
      expect(graph.nodes[1].type).toBe('pp:OpenPath');
    });

    it('throws on null template', () => {
      expect(() => dg.extractFromDefinition(null as any)).toThrow('Template is required');
    });
  });

  describe('fingerprint determinism', () => {
    it('produces identical fingerprints for same input', () => {
      const fp1 = dg.extractFromDefinition(sampleTemplate).fingerprint;
      const fp2 = dg.extractFromDefinition(sampleTemplate).fingerprint;
      expect(fp1).toEqual(fp2);
    });
  });

  describe('toJsonLd', () => {
    it('produces valid JSON-LD structure', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const jsonLd = dg.toJsonLd(graph);
      expect(jsonLd['@context']).toBeDefined();
      expect(jsonLd['@type']).toBe('pp:Template');
      expect(jsonLd['@id']).toBe('pp:template/test-template');
      expect(jsonLd['schema:name']).toBe('Test Template');
      expect(jsonLd['pp:nodes']).toBeDefined();
      expect(jsonLd['pp:edges']).toBeDefined();
      expect(Array.isArray(jsonLd['pp:nodes'])).toBe(true);
    });

    it('includes duration as ISO 8601', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const jsonLd = dg.toJsonLd(graph);
      expect(jsonLd['pp:duration']).toBeDefined();
      const dur = jsonLd['pp:duration'] as Record<string, string>;
      expect(dur['@value']).toBe('PT5S');
    });
  });

  describe('findSimilar', () => {
    it('identical fingerprints → score 1.0', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const fp = { ...graph.fingerprint!, templateId: 'template-a' };
      const candidate = { ...graph.fingerprint!, templateId: 'template-b' };
      const results = dg.findSimilar(fp, [candidate]);
      expect(results.length).toBe(1);
      expect(results[0].score).toBeCloseTo(1.0, 1);
    });

    it('completely different fingerprints → low score', () => {
      const fpA: Fingerprint = {
        nodeTypeCounts: { 'pp:Circle': 5 },
        edgeTypeCounts: { 'pp:orbits': 3 },
        mathFunctions: ['sinCos', 'parametricCircle'],
        patterns: ['orbitalComposition'],
        totalNodes: 5,
        totalEdges: 3,
        hasGenerator: true,
        generatorType: 'drawBokeh',
        semantics: null,
        templateId: 'a',
      };
      const fpB: Fingerprint = {
        nodeTypeCounts: { 'pp:DiagramShape': 10 },
        edgeTypeCounts: { 'pp:connectsTo': 8 },
        mathFunctions: [],
        patterns: ['diagramFlow'],
        totalNodes: 10,
        totalEdges: 8,
        hasGenerator: false,
        generatorType: null,
        semantics: null,
        templateId: 'b',
      };
      const results = dg.findSimilar(fpA, [fpB]);
      // Both have null semantics → semantic dimensions score 1.0 (no penalty)
      // Structural dimensions are very different → overall score is moderate
      expect(results[0].score).toBeLessThan(0.5);
    });

    it('skips candidate with same templateId', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const fp = { ...graph.fingerprint!, templateId: 'same-id' };
      const candidate = { ...graph.fingerprint!, templateId: 'same-id' };
      const results = dg.findSimilar(fp, [candidate]);
      expect(results.length).toBe(0);
    });
  });

  describe('validateTemplateSchema (static)', () => {
    it('valid template passes', () => {
      const result = DesignGraph.validateTemplateSchema(sampleTemplate);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('null template fails', () => {
      const result = DesignGraph.validateTemplateSchema(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('missing id produces error', () => {
      const result = DesignGraph.validateTemplateSchema({ name: 'Test', category: 'test', data: {} } as any);
      expect(result.errors).toContain('Missing or invalid "id" (must be a non-empty string)');
    });

    it('unknown item type produces warning', () => {
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: { items: [{ type: 'alien-shape' }] },
      };
      const result = DesignGraph.validateTemplateSchema(tmpl);
      expect(result.warnings.some(w => w.includes('unknown type "alien-shape"'))).toBe(true);
    });
  });
});

// =============================================================================
// KNOWLEDGE GRAPH VALIDATOR
// =============================================================================

describe('KnowledgeGraphValidator', () => {
  const validator = new KnowledgeGraphValidator();
  const dg = new DesignGraph();

  describe('validateTemplate', () => {
    it('valid template passes', () => {
      const result = validator.validateTemplate(sampleTemplate);
      expect(result.valid).toBe(true);
    });

    it('null template fails', () => {
      const result = validator.validateTemplate(null);
      expect(result.valid).toBe(false);
    });

    it('missing required fields produce errors', () => {
      const result = validator.validateTemplate({ data: {} } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid "id" (must be a non-empty string)');
      expect(result.errors).toContain('Missing or invalid "name" (must be a non-empty string)');
      expect(result.errors).toContain('Missing or invalid "category" (must be a non-empty string)');
    });

    it('unknown item types produce warnings', () => {
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: { items: [{ type: 'custom-widget' }] },
      };
      const result = validator.validateTemplate(tmpl);
      expect(result.valid).toBe(true); // warnings don't fail validation
      expect(result.warnings.some(w => w.includes('unknown type'))).toBe(true);
    });

    it('unknown relation types produce warnings', () => {
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: { items: [], relations: [{ type: 'teleports_to' }] },
      };
      const result = validator.validateTemplate(tmpl);
      expect(result.warnings.some(w => w.includes('unknown relation type'))).toBe(true);
    });

    it('validates keyframe structure', () => {
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: {
          items: [{
            type: 'text',
            animationType: 'keyframe',
            keyframes: [{ /* missing time and properties */ }] as any,
          }],
        },
      };
      const result = validator.validateTemplate(tmpl);
      expect(result.warnings.some(w => w.includes('missing or invalid "time"'))).toBe(true);
    });

    it('validates unknown generator warning', () => {
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: { items: [], backgroundGenerator: 'drawMagicUnicorn' },
      };
      const result = validator.validateTemplate(tmpl);
      expect(result.warnings.some(w => w.includes('Unknown background generator'))).toBe(true);
    });
  });

  describe('scoreQuality', () => {
    it('empty template → low score', () => {
      const tmpl: TemplateDefinition = {
        id: 'empty', name: 'Empty', category: 'test',
        data: { items: [] },
      };
      const graph = dg.extractFromDefinition(tmpl);
      const quality = validator.scoreQuality(tmpl, graph);
      expect(quality.score).toBeLessThan(0.2);
      expect(quality.tier).toBe('basic');
    });

    it('rich template → higher score', () => {
      const richTemplate: TemplateDefinition = {
        id: 'rich', name: 'Rich Template', category: 'creative',
        dimensions: { width: 1080, height: 1080 },
        duration: 10,
        description: 'A rich template with many features for testing quality scoring.',
        tags: ['animated', 'creative', 'warm'],
        semantics: {
          mood: ['energetic', 'bold'],
          visualStyle: ['radial-background', 'bold-typography'],
          colorScheme: 'vibrant',
          audience: ['creators'],
          intent: 'inspire',
          animationComplexity: 'complex',
          compositionStyle: 'centered',
          contentType: 'mixed',
        },
        data: {
          items: [
            { id: 'title', type: 'text', content: 'Hero', x: 540, y: 300, fontSize: 72,
              animationType: 'keyframe', keyframes: [
                { time: 0, properties: { opacity: 0, scale: 0.5 }, easing: 'easeOut' },
                { time: 1, properties: { opacity: 1, scale: 1 }, easing: 'easeInOut' },
                { time: 3, properties: { opacity: 1, scale: 1.1 }, easing: 'bounce' },
              ]},
            { id: 'subtitle', type: 'text', content: 'World', x: 540, y: 600, fontSize: 36,
              animationType: 'keyframe', keyframes: [
                { time: 0.5, properties: { opacity: 0 }, easing: 'easeOut' },
                { time: 1.5, properties: { opacity: 1 }, easing: 'easeInOut' },
              ]},
            { id: 'circle1', type: 'circle', x: 200, y: 200 },
            { id: 'circle2', type: 'circle', x: 800, y: 800 },
            { id: 'star1', type: 'star', x: 100, y: 900 },
          ],
          relations: [
            { type: 'orbits', source: 'circle1', target: 'circle2' },
            { type: 'staggered_with', source: 'title', target: 'subtitle' },
          ],
          backgroundGenerator: 'drawBokeh',
        },
      };
      const graph = dg.extractFromDefinition(richTemplate);
      const quality = validator.scoreQuality(richTemplate, graph);
      expect(quality.score).toBeGreaterThan(0.5);
      expect(['good', 'excellent']).toContain(quality.tier);
      expect(quality.dimensions.completeness).toBeGreaterThan(0.5);
    });

    it('quality weights sum to 1.0', () => {
      const sum = Object.values(QUALITY_WEIGHTS).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 5);
    });

    it('tier thresholds are correct', () => {
      // basic < 0.4, fair >= 0.4, good >= 0.6, excellent >= 0.8
      const tmpl: TemplateDefinition = {
        id: 'x', name: 'X', category: 'test',
        data: { items: [] },
      };
      const graph = dg.extractFromDefinition(tmpl);
      const quality = validator.scoreQuality(tmpl, graph);
      if (quality.score < 0.4) expect(quality.tier).toBe('basic');
      else if (quality.score < 0.6) expect(quality.tier).toBe('fair');
      else if (quality.score < 0.8) expect(quality.tier).toBe('good');
      else expect(quality.tier).toBe('excellent');
    });
  });

  describe('computeSimilarityContext', () => {
    it('returns empty for no candidates', () => {
      const fp: Fingerprint = {
        nodeTypeCounts: {}, edgeTypeCounts: {},
        mathFunctions: [], patterns: [],
        totalNodes: 0, totalEdges: 0,
        hasGenerator: false, generatorType: null,
        semantics: null, templateId: 'x',
      };
      const result = validator.computeSimilarityContext(fp, [], dg);
      expect(result.similarTo.length).toBe(0);
      expect(result.structuralFamily).toBeNull();
    });

    it('identifies structural family for high similarity', () => {
      const graph = dg.extractFromDefinition(sampleTemplate);
      const fpNew = { ...graph.fingerprint!, templateId: 'new-template' };
      const fpExisting = { ...graph.fingerprint!, templateId: 'existing-template' };
      const result = validator.computeSimilarityContext(fpNew, [fpExisting], dg);
      expect(result.similarTo.length).toBe(1);
      expect(result.structuralFamily).toBe('existing-template');
    });
  });
});

// =============================================================================
// TOOL INTEGRATION
// =============================================================================

describe('Ontology MCP tools', () => {
  it('pinepaper_analyze_design, pinepaper_validate_design, and pinepaper_query_ontology exist in definitions', async () => {
    const { PINEPAPER_TOOLS } = await import('../../tools/definitions.js');
    const analyzeToolDef = PINEPAPER_TOOLS.find((t: any) => t.name === 'pinepaper_analyze_design');
    const validateToolDef = PINEPAPER_TOOLS.find((t: any) => t.name === 'pinepaper_validate_design');
    const queryToolDef = PINEPAPER_TOOLS.find((t: any) => t.name === 'pinepaper_query_ontology');
    expect(analyzeToolDef).toBeDefined();
    expect(validateToolDef).toBeDefined();
    expect(queryToolDef).toBeDefined();
  });

  it('ontology tag group exists in TOOL_TAGS', async () => {
    const { TOOL_TAGS, TOOLKIT_PROFILES } = await import('../../tools/toolkits.js');
    expect(TOOL_TAGS.ontology).toBeDefined();
    expect(TOOL_TAGS.ontology).toContain('pinepaper_analyze_design');
    expect(TOOL_TAGS.ontology).toContain('pinepaper_validate_design');
    expect(TOOL_TAGS.ontology).toContain('pinepaper_query_ontology');
    // Included in agent profile
    expect(TOOLKIT_PROFILES.agent).toContain('ontology');
  });

  it('minimal descriptions exist for ontology tools', async () => {
    const { MINIMAL_DESCRIPTIONS } = await import('../../tools/minimal-descriptions.js');
    expect(MINIMAL_DESCRIPTIONS.pinepaper_analyze_design).toBeDefined();
    expect(MINIMAL_DESCRIPTIONS.pinepaper_validate_design).toBeDefined();
    expect(MINIMAL_DESCRIPTIONS.pinepaper_query_ontology).toBeDefined();
  });
});

// =============================================================================
// QUERY ONTOLOGY HANDLER
// =============================================================================

describe('pinepaper_query_ontology handler', () => {
  const dg = new DesignGraph();

  it('list_types returns types object', () => {
    const types = PP_VOCABULARY.types;
    expect(Object.keys(types).length).toBeGreaterThanOrEqual(49);
  });

  it('list_generators returns all generators including drawGlobeWireframe', () => {
    const generators = PP_VOCABULARY.generators;
    expect(generators['drawGlobeWireframe']).toBeDefined();
    expect(generators['drawGlobeWireframe'].category).toBe('tech');
  });

  it('type_hierarchy returns correct ancestry for pp:Circle', () => {
    const hierarchy = dg.getTypeHierarchy('pp:Circle');
    expect(hierarchy).toEqual(['pp:Circle', 'pp:CanvasShape', 'pp:CanvasElement']);
  });

  it('type_properties returns inherited properties for pp:Circle', () => {
    const props = dg.getPropertiesFor('pp:Circle');
    const propNames = props.map(p => p.name);
    expect(propNames).toContain('pp:x');
    expect(propNames).toContain('pp:opacity');
    expect(propNames).toContain('pp:fillColor');
    expect(propNames).toContain('pp:radius');
  });

  it('animatable_properties returns only animatable ones', () => {
    const animatable = dg.getAnimatableProperties('pp:Circle');
    expect(animatable).toContain('pp:x');
    expect(animatable).toContain('pp:opacity');
    expect(animatable).not.toContain('pp:radius');
  });

  it('node_type maps item types correctly', () => {
    expect(dg.getNodeType('circle')).toBe('pp:Circle');
    expect(dg.getNodeType('text')).toBe('pp:Text');
  });

  it('edge_type maps relation types correctly', () => {
    expect(dg.getEdgeType('orbits')).toBe('pp:orbits');
    expect(dg.getEdgeType('attached_to')).toBe('pp:attachedTo');
  });

  it('is_subtype checks work correctly', () => {
    expect(dg.isSubtypeOf('pp:Circle', 'pp:CanvasShape')).toBe(true);
    expect(dg.isSubtypeOf('pp:Circle', 'pp:Text')).toBe(false);
  });
});
