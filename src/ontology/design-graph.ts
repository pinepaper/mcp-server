/**
 * DesignGraph — Design Knowledge Graph for PinePaper templates
 *
 * Formalizes every template as a typed, annotated graph with a Schema.org-aligned
 * vocabulary (pp: namespace). Provides vocabulary definition, graph extraction from
 * template definitions, JSON-LD export, and structural similarity scoring.
 *
 * Ported from FxTool/js/DesignGraph.js to typed TypeScript.
 * extractFromCanvas() is omitted (requires live browser app instance).
 *
 * @module ontology/design-graph
 * @version 0.4.0
 */

import { PP_VOCABULARY, ITEM_TYPE_MAP, RELATION_TYPE_MAP, DIAGRAM_SHAPE_MAP, CONNECTOR_STYLE_MAP, EASING_TO_MATH } from './vocabulary.js';
import { PP_SEMANTIC_VOCABULARY } from './semantic-vocabulary.js';
import type {
  PinePaperVocabulary,
  GraphNode,
  GraphEdge,
  GeneratorInfo,
  SemanticInfo,
  Fingerprint,
  TemplateGraph,
  TemplateDefinition,
  TemplateItem,
  TemplateRelation,
  TemplateKeyframe,
  ValidationResult,
  VocabularyType,
  VocabularyEdge,
  VocabularyGenerator,
} from './types.js';


export class DesignGraph {
  // ─────────────────────────────────────────────────────────────────────
  // Vocabulary Access
  // ─────────────────────────────────────────────────────────────────────

  getVocabulary(): PinePaperVocabulary {
    return PP_VOCABULARY;
  }

  /** Map a PinePaper item type string to its pp: type. */
  getNodeType(itemType: string | undefined): string {
    if (!itemType) return 'pp:Group';
    const lower = itemType.toLowerCase();
    return ITEM_TYPE_MAP[lower] || 'pp:Group';
  }

  /** Map a PinePaper relation name to its pp: edge type. */
  getEdgeType(relationName: string | undefined): string | null {
    if (!relationName) return null;
    return RELATION_TYPE_MAP[relationName] || null;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Hierarchy Traversal
  // ─────────────────────────────────────────────────────────────────────

  /** Get ordered ancestry chain for a type: [type, parent, grandparent, ...] */
  getTypeHierarchy(ppType: string): string[] {
    return this._getHierarchy(ppType, PP_VOCABULARY.types);
  }

  /** Get direct children of a type. */
  getTypeChildren(ppType: string): string[] {
    return Object.keys(PP_VOCABULARY.types).filter(
      key => PP_VOCABULARY.types[key].parentType === ppType
    );
  }

  /** Get ordered ancestry chain for an edge type. */
  getEdgeHierarchy(ppEdge: string): string[] {
    return this._getHierarchy(ppEdge, PP_VOCABULARY.edges);
  }

  /** Get ordered ancestry chain for a generator. */
  getGeneratorHierarchy(genKey: string): string[] {
    return this._getHierarchy(genKey, PP_VOCABULARY.generators);
  }

  /** Get properties applicable to a type, including inherited from parents. */
  getPropertiesFor(ppType: string): Array<{ name: string; valueType: string; appliesTo: string[]; animatable?: boolean }> {
    const hierarchy = this.getTypeHierarchy(ppType);
    const result: Array<{ name: string; valueType: string; appliesTo: string[]; animatable?: boolean }> = [];
    const seen = new Set<string>();
    for (const [propName, propDef] of Object.entries(PP_VOCABULARY.properties)) {
      if (seen.has(propName)) continue;
      if (Array.isArray(propDef.appliesTo)) {
        for (const target of propDef.appliesTo) {
          if (hierarchy.includes(target)) {
            result.push({ name: propName, ...propDef });
            seen.add(propName);
            break;
          }
        }
      }
    }
    return result;
  }

  /** Get only animatable properties for a type. */
  getAnimatableProperties(ppType: string): string[] {
    return this.getPropertiesFor(ppType)
      .filter(p => p.animatable === true)
      .map(p => p.name);
  }

  /** Check if typeA is a subtype of typeB (walks ancestry). */
  isSubtypeOf(typeA: string, typeB: string): boolean {
    if (typeA === typeB) return true;
    const hierarchy = this.getTypeHierarchy(typeA);
    return hierarchy.includes(typeB);
  }

  /** Walk parentType chain in a vocabulary section. */
  private _getHierarchy(key: string, section: Record<string, { parentType?: string }>): string[] {
    const chain: string[] = [];
    let current: string | null = key;
    const visited = new Set<string>();
    while (current && section[current] && !visited.has(current)) {
      visited.add(current);
      chain.push(current);
      current = section[current].parentType || null;
    }
    return chain;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Static Analysis — from template definition object
  // ─────────────────────────────────────────────────────────────────────

  /** Extract a TemplateGraph from a template definition object (static analysis). */
  extractFromDefinition(template: TemplateDefinition): TemplateGraph {
    if (!template) throw new Error('Template is required');

    const graph: TemplateGraph = {
      templateId: template.id || 'unknown',
      templateName: template.name || 'Untitled',
      category: template.category || 'uncategorized',
      dimensions: template.dimensions || { width: 800, height: 600 },
      duration: template.duration || 0,
      nodes: [],
      edges: [],
      mathFunctions: [],
      patterns: [],
      generator: null,
      fingerprint: null,
    };

    const data = template.data || {};

    // --- Extract nodes from items ---
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        graph.nodes.push(this._itemToNode(item));
      }
    }

    // --- Extract edges from relations ---
    if (Array.isArray(data.relations)) {
      for (const rel of data.relations) {
        const edge = this._relationToEdge(rel);
        if (edge) graph.edges.push(edge);
      }
    }

    // --- Extract mask edges (inline mask definitions on items) ---
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.mask) {
          const itemId = item.id || item.name || null;
          graph.edges.push({
            source: itemId ?? null,
            target: null,
            type: 'pp:maskedBy',
            params: {
              maskType: item.mask.type || 'rectangle',
              animated: !!item.mask.animated,
              animation: item.mask.animation || null,
            },
          });
          // Update node type to MaskedItem
          const node = graph.nodes.find(n => n.id === itemId);
          if (node) node.type = 'pp:MaskedItem';
        }
      }
    }

    // --- Extract connector edges (sourceId/targetId on connector items) ---
    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.type === 'connector' && item.sourceId && item.targetId) {
          graph.edges.push({
            source: item.sourceId,
            target: item.targetId,
            type: 'pp:connectsTo',
            params: {
              routing: item.routing || null,
              lineStyle: item.lineStyle || null,
              headStyle: item.headStyle || null,
              label: item.label || null,
            },
          });
        }
      }
    }

    // --- Extract generator info ---
    if (data.backgroundGenerator) {
      const genName = data.backgroundGenerator;
      const genDef = PP_VOCABULARY.generators[genName];
      graph.generator = {
        name: genName,
        type: genDef ? genDef.category || 'unknown' : 'unknown',
        mathFunctions: genDef && genDef.mathFunctions ? genDef.mathFunctions : [],
      };
    }

    // --- Detect math functions ---
    graph.mathFunctions = this.detectMathFunctions(graph);

    // --- Detect patterns ---
    graph.patterns = this.detectPatterns(graph);

    // --- Semantic inference + merge ---
    graph.semantics = this._mergeSemantics(template, graph);

    // --- Compute fingerprint ---
    graph.fingerprint = this.computeFingerprint(graph);

    return graph;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Math Function Detection
  // ─────────────────────────────────────────────────────────────────────

  /** Analyze a TemplateGraph to identify which mathematical functions are used. */
  detectMathFunctions(graph: TemplateGraph): string[] {
    const funcs = new Set<string>();

    // 1. Detect from keyframe easings on nodes
    for (const node of graph.nodes) {
      if (node.properties && node.properties.hasKeyframes) {
        funcs.add('keyframeLerp');
        funcs.add('lerp');
        if (Array.isArray(node.properties.easings)) {
          for (const easing of node.properties.easings) {
            if (Array.isArray(easing)) {
              funcs.add('customCubicBezier');
            } else if (EASING_TO_MATH[easing]) {
              funcs.add(EASING_TO_MATH[easing]!);
            }
          }
        }
      }
      // Trim path
      if (node.properties && node.properties.trimPath) {
        funcs.add('trimPath');
      }
      // Color animation detection
      if (node.properties && node.properties.hasKeyframes && node.properties.hasColorAnimation) {
        funcs.add('colorLerp');
      }
    }

    // 2. Detect from edges (relations)
    for (const edge of graph.edges) {
      const edgeDef = PP_VOCABULARY.edges[edge.type];
      if (edgeDef && Array.isArray(edgeDef.mathFunctions)) {
        for (const f of edgeDef.mathFunctions) {
          funcs.add(f);
        }
      }
    }

    // 3. Detect from generator
    if (graph.generator && Array.isArray(graph.generator.mathFunctions)) {
      for (const f of graph.generator.mathFunctions) {
        funcs.add(f);
      }
    }

    return Array.from(funcs).sort();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Pattern Detection
  // ─────────────────────────────────────────────────────────────────────

  /** Match graph structure against known design patterns. */
  detectPatterns(graph: TemplateGraph): string[] {
    const detected: string[] = [];
    const edgeTypes = new Set(graph.edges.map(e => e.type));
    const nodeTypes = new Set(graph.nodes.map(n => n.type));
    const mathFuncs = new Set(graph.mathFunctions);

    for (const [patternKey, patternDef] of Object.entries(PP_VOCABULARY.patterns)) {
      let matched = false;

      // Check required edges
      if (Array.isArray(patternDef.requiredEdges)) {
        matched = patternDef.requiredEdges.some(e => edgeTypes.has(e));
      }

      // Check required node types (hierarchy-aware: subtypes match)
      if (!matched && Array.isArray(patternDef.nodeTypes)) {
        matched = patternDef.nodeTypes.some(requiredType =>
          nodeTypes.has(requiredType) ||
          Array.from(nodeTypes).some(nt => this.isSubtypeOf(nt, requiredType))
        );
      }

      // Check required math functions
      if (!matched && Array.isArray(patternDef.mathFunctions)) {
        matched = patternDef.mathFunctions.some(f => mathFuncs.has(f));
      }

      // Special case: proceduralBackground (detected by generator presence)
      if (patternKey === 'proceduralBackground' && graph.generator) {
        matched = true;
      }

      if (matched) detected.push(patternKey);
    }

    return detected.sort();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Fingerprint
  // ─────────────────────────────────────────────────────────────────────

  /** Compute a structural fingerprint for similarity comparison. */
  computeFingerprint(graph: TemplateGraph): Fingerprint {
    const nodeTypeCounts: Record<string, number> = {};
    for (const node of graph.nodes) {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    }

    const edgeTypeCounts: Record<string, number> = {};
    for (const edge of graph.edges) {
      edgeTypeCounts[edge.type] = (edgeTypeCounts[edge.type] || 0) + 1;
    }

    return {
      nodeTypeCounts,
      edgeTypeCounts,
      mathFunctions: graph.mathFunctions || [],
      patterns: graph.patterns || [],
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      hasGenerator: !!graph.generator,
      generatorType: graph.generator ? graph.generator.name : null,
      semantics: graph.semantics || null,
    };
  }

  // ─────────────────────────────────────────────────────────────────────
  // JSON-LD Export
  // ─────────────────────────────────────────────────────────────────────

  /** Produce a Schema.org + pp: annotated JSON-LD document from a TemplateGraph. */
  toJsonLd(graph: TemplateGraph): Record<string, unknown> {
    const duration = graph.duration || 0;
    const durationISO = duration > 0 ? `PT${duration}S` : null;

    const jsonLd: Record<string, unknown> = {
      '@context': {
        'schema': 'https://schema.org/',
        'pp': 'https://pinepaper.studio/ontology/',
        'rdfs': 'http://www.w3.org/2000/01/rdf-schema#',
        'skos': 'http://www.w3.org/2004/02/skos/core#',
        'owl': 'http://www.w3.org/2002/07/owl#',
        'bpmn': 'https://www.omg.org/spec/BPMN/20100524/MODEL/',
      },
      '@type': 'pp:Template',
      '@id': `pp:template/${graph.templateId}`,
      'schema:name': graph.templateName,
      'schema:artform': 'motion graphic',
      'schema:artMedium': 'digital',
      'pp:category': graph.category,
      'pp:dimensions': {
        'schema:width': graph.dimensions.width,
        'schema:height': graph.dimensions.height,
      },
    };

    if (durationISO) {
      jsonLd['pp:duration'] = { '@type': 'schema:Duration', '@value': durationISO };
    }

    // Nodes
    jsonLd['pp:nodes'] = graph.nodes.map(node => {
      const nodeDoc: Record<string, unknown> = {
        '@id': `pp:node/${node.id || 'anonymous'}`,
        '@type': node.type,
      };
      if (node.label) nodeDoc['schema:name'] = node.label;
      const typeDef = PP_VOCABULARY.types[node.type];
      if (typeDef && typeDef.parentType) {
        nodeDoc['rdfs:subClassOf'] = typeDef.parentType;
      }
      if (node.properties) {
        if (node.properties.hasKeyframes) nodeDoc['pp:hasKeyframes'] = true;
        if (node.properties.keyframeCount > 0) nodeDoc['pp:keyframeCount'] = node.properties.keyframeCount;
        if (node.properties.easings && node.properties.easings.length > 0) {
          nodeDoc['pp:easings'] = node.properties.easings.filter(e => typeof e === 'string');
        }
        if (node.properties.trimPath) nodeDoc['pp:trimPath'] = true;
        if (node.properties.blendMode) nodeDoc['pp:blendMode'] = node.properties.blendMode;
        if (node.properties.masked) nodeDoc['pp:masked'] = true;
        if (node.properties.maskType) nodeDoc['pp:maskType'] = node.properties.maskType;
        if (node.properties.animationType && node.properties.animationType !== 'keyframe') {
          nodeDoc['pp:animationType'] = node.properties.animationType;
        }
      }
      return nodeDoc;
    });

    // Edges
    jsonLd['pp:edges'] = graph.edges.map(edge => {
      const edgeDoc: Record<string, unknown> = {
        '@type': edge.type,
        'pp:source': edge.source ? `pp:node/${edge.source}` : null,
        'pp:target': edge.target ? `pp:node/${edge.target}` : null,
      };
      const edgeDef = PP_VOCABULARY.edges[edge.type];
      if (edgeDef && edgeDef.parentType) {
        edgeDoc['rdfs:subClassOf'] = edgeDef.parentType;
      }
      if (edge.params && Object.keys(edge.params).length > 0) {
        edgeDoc['pp:params'] = edge.params;
      }
      return edgeDoc;
    });

    // Math functions
    if (graph.mathFunctions.length > 0) {
      jsonLd['pp:mathFunctions'] = graph.mathFunctions;
    }

    // Patterns
    if (graph.patterns.length > 0) {
      jsonLd['pp:patterns'] = graph.patterns;
    }

    // Fingerprint
    if (graph.fingerprint) {
      jsonLd['pp:fingerprint'] = {
        'pp:totalNodes': graph.fingerprint.totalNodes,
        'pp:totalEdges': graph.fingerprint.totalEdges,
        'pp:nodeTypes': graph.fingerprint.nodeTypeCounts,
        'pp:edgeTypes': graph.fingerprint.edgeTypeCounts,
      };
    }

    // Generator
    if (graph.generator) {
      jsonLd['pp:generator'] = {
        'pp:name': graph.generator.name,
        'pp:generatorCategory': graph.generator.type,
        'pp:mathFunctions': graph.generator.mathFunctions,
      };
    }

    // Semantics
    if (graph.semantics) {
      const semDoc: Record<string, unknown> = {
        'pp:mood': graph.semantics.mood,
        'pp:visualStyle': graph.semantics.visualStyle,
        'pp:colorScheme': graph.semantics.colorScheme,
        'schema:audience': graph.semantics.audience,
        'pp:intent': graph.semantics.intent,
        'pp:animationComplexity': graph.semantics.animationComplexity,
        'pp:contentType': graph.semantics.contentType,
      };
      if (graph.semantics.platforms && graph.semantics.platforms.length > 0) {
        semDoc['pp:platforms'] = graph.semantics.platforms;
      }
      jsonLd['pp:semantics'] = semDoc;
    }

    return jsonLd;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Similarity
  // ─────────────────────────────────────────────────────────────────────

  /** Find similar templates by comparing fingerprints. */
  findSimilar(fingerprint: Fingerprint, candidates: Fingerprint[]): Array<{ templateId: string; score: number }> {
    if (!fingerprint || !Array.isArray(candidates)) return [];

    const results: Array<{ templateId: string; score: number }> = [];

    for (const candidate of candidates) {
      if (candidate.templateId === fingerprint.templateId) continue;
      const score = this._computeSimilarity(fingerprint, candidate);
      results.push({ templateId: candidate.templateId || 'unknown', score });
    }

    results.sort((a, b) => b.score - a.score);
    return results;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Static Validation
  // ─────────────────────────────────────────────────────────────────────

  /** Validate a template definition against the DesignGraph schema. */
  static validateTemplateSchema(
    template: TemplateDefinition | null | undefined,
    vocab?: PinePaperVocabulary,
    semVocab?: typeof PP_SEMANTIC_VOCABULARY,
  ): ValidationResult {
    const v = vocab || PP_VOCABULARY;
    const sv = semVocab || PP_SEMANTIC_VOCABULARY;

    const errors: string[] = [];
    const warnings: string[] = [];

    if (!template) {
      return { valid: false, errors: ['Template definition is null or undefined'], warnings };
    }

    // Required fields
    if (!template.id || typeof template.id !== 'string') {
      errors.push('Missing or invalid "id" (must be a non-empty string)');
    }
    if (!template.name || typeof template.name !== 'string') {
      errors.push('Missing or invalid "name" (must be a non-empty string)');
    }
    if (!template.category || typeof template.category !== 'string') {
      errors.push('Missing or invalid "category" (must be a non-empty string)');
    }
    if (!template.data || typeof template.data !== 'object') {
      errors.push('Missing or invalid "data" (must be an object)');
      return { valid: false, errors, warnings };
    }

    // Item type validation
    const items = template.data.items;
    if (Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || typeof item !== 'object') continue;
        if (item.type && !ITEM_TYPE_MAP[item.type] && !v.types[item.type]) {
          warnings.push(`data.items[${i}]: unknown type "${item.type}"`);
        }
      }
    }

    // Relation type validation
    const relations = template.data.relations;
    if (Array.isArray(relations)) {
      for (let i = 0; i < relations.length; i++) {
        const rel = relations[i];
        if (!rel || typeof rel !== 'object') continue;
        if (rel.type && !RELATION_TYPE_MAP[rel.type] && !v.edges[rel.type]) {
          warnings.push(`data.relations[${i}]: unknown relation type "${rel.type}"`);
        }
      }
    }

    // Semantics validation
    if (template.semantics) {
      const sem = template.semantics as Record<string, unknown>;
      const arrayChecks: Record<string, string[]> = {
        mood: sv.moods,
        visualStyle: sv.visualStyles,
        audience: sv.audiences,
      };
      for (const [field, allowed] of Object.entries(arrayChecks)) {
        if (sem[field]) {
          const vals = Array.isArray(sem[field]) ? sem[field] as string[] : [sem[field] as string];
          for (const val of vals) {
            if (!allowed.includes(val)) {
              warnings.push(`semantics.${field}: unknown value "${val}"`);
            }
          }
        }
      }
      const stringChecks: Record<string, string[]> = {
        colorScheme: sv.colorSchemes,
        intent: sv.intents,
        animationComplexity: sv.animationComplexities,
        compositionStyle: sv.compositionStyles,
        contentType: sv.contentTypes,
      };
      for (const [field, allowed] of Object.entries(stringChecks)) {
        if (sem[field] && !allowed.includes(sem[field] as string)) {
          warnings.push(`semantics.${field}: unknown value "${sem[field]}"`);
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ─────────────────────────────────────────────────────────────────────

  /** Convert a template item definition into a graph node. */
  private _itemToNode(item: TemplateItem): GraphNode {
    const itemId = item.id || item.name || null;
    let type = this.getNodeType(item.type);

    // Refine diagram shapes to specific subtypes
    if (type === 'pp:DiagramShape' && item.shapeType) {
      type = DIAGRAM_SHAPE_MAP[item.shapeType] || type;
    }
    // Refine connectors to specific subtypes
    if (type === 'pp:Connector') {
      type = CONNECTOR_STYLE_MAP[item.lineStyle || ''] || 'pp:SequenceConnector';
    }

    // Check for mask → MaskedItem
    if (item.mask) type = 'pp:MaskedItem';

    // Refine path types based on closed property from template definition
    let pathClosed: boolean | null = null;
    let pathCurveType: string | null = null;
    if (type === 'pp:Path') {
      pathClosed = item.closed != null ? !!item.closed : null;
      if (pathClosed === true) type = 'pp:ClosedPath';
      else if (pathClosed === false) type = 'pp:OpenPath';
      pathCurveType = this._detectCurveTypeFromDef(item);
    }

    const hasKeyframes = item.animationType === 'keyframe' && Array.isArray(item.keyframes);
    const easings = this._extractEasings(item.keyframes);
    const hasTrimPath = this._hasTrimPath(item);
    const hasColorAnimation = this._hasColorAnimation(item.keyframes);

    const properties = {
      position: item.position || (item.x != null && item.y != null ? [item.x, item.y] as [number, number] : null),
      hasKeyframes,
      animationType: item.animationType || null,
      keyframeCount: Array.isArray(item.keyframes) ? item.keyframes.length : 0,
      easings,
      trimPath: hasTrimPath,
      blendMode: item.blendMode && item.blendMode !== 'normal' ? item.blendMode : null,
      masked: !!item.mask,
      maskType: item.mask ? (item.mask.type || null) : null,
      hasColorAnimation,
      closed: pathClosed !== null ? pathClosed : undefined,
      curveType: pathCurveType || undefined,
      segmentCount: item.segments ? (Array.isArray(item.segments) ? item.segments.length : 0) : undefined,
    };

    return {
      id: itemId,
      type,
      label: item.content || item.label || itemId || item.type || 'item',
      properties,
    };
  }

  /** Convert a template relation definition into a graph edge. */
  private _relationToEdge(rel: TemplateRelation): GraphEdge | null {
    const relType = rel.type;
    const edgeType = this.getEdgeType(relType);
    if (!edgeType) return null;

    return {
      source: rel.source || rel.from || null,
      target: rel.target || rel.to || null,
      type: edgeType,
      params: rel.params || {},
    };
  }

  /** Extract unique easing function names from a keyframes array. */
  private _extractEasings(keyframes?: TemplateKeyframe[]): string[] {
    if (!Array.isArray(keyframes)) return [];
    const easings = new Set<string>();
    for (const kf of keyframes) {
      if (kf.easing) {
        if (Array.isArray(kf.easing)) {
          easings.add('customCubicBezier');
        } else {
          easings.add(kf.easing as string);
        }
      }
      if (kf.propertyEasings) {
        for (const val of Object.values(kf.propertyEasings)) {
          if (Array.isArray(val)) {
            easings.add('customCubicBezier');
          } else if (typeof val === 'string') {
            easings.add(val);
          }
        }
      }
    }
    return Array.from(easings);
  }

  /** Check if an item definition uses trim path properties. */
  private _hasTrimPath(item: TemplateItem): boolean {
    if (item.trimStart != null || item.trimEnd != null || item.trimOffset != null) return true;
    if (Array.isArray(item.keyframes)) {
      for (const kf of item.keyframes) {
        if (kf.properties) {
          const props = kf.properties as Record<string, unknown>;
          if (props.trimStart != null || props.trimEnd != null || props.trimOffset != null) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /** Check if keyframes contain color property animations. */
  private _hasColorAnimation(keyframes?: TemplateKeyframe[]): boolean {
    if (!Array.isArray(keyframes)) return false;
    for (const kf of keyframes) {
      if (kf.properties) {
        const props = kf.properties as Record<string, unknown>;
        if (props.fillColor || props.strokeColor || props.fontColor || props.color) {
          return true;
        }
      }
    }
    return false;
  }

  /** Detect curve type from a template item definition. */
  private _detectCurveTypeFromDef(item: TemplateItem): string | null {
    if (item.smooth) return 'cubicBezier';
    if (!item.segments || !Array.isArray(item.segments)) return null;
    let hasComplex = false;
    for (const seg of item.segments) {
      if (Array.isArray(seg) && (seg as unknown[]).length === 3 && Array.isArray((seg as unknown[])[0])) {
        hasComplex = true;
      } else if (seg && typeof seg === 'object' && !Array.isArray(seg)) {
        const s = seg as Record<string, unknown>;
        if (s.handleIn || s.handleOut) hasComplex = true;
      }
    }
    return hasComplex ? 'cubicBezier' : 'linear';
  }

  // ─────────────────────────────────────────────────────────────────────
  // Semantic Inference
  // ─────────────────────────────────────────────────────────────────────

  /** Infer semantic metadata from template structure. */
  private _inferSemantics(template: TemplateDefinition, graph: TemplateGraph): SemanticInfo {
    const sem: SemanticInfo = {};
    const data = template.data || {};
    const items = data.items || [];
    const nodeTypes = new Set(graph.nodes.map(n => n.type));
    const edgeTypes = new Set(graph.edges.map(e => e.type));

    // --- animationComplexity ---
    const hasKeyframes = graph.nodes.some(n => n.properties && n.properties.hasKeyframes);
    const hasRelations = graph.edges.some(e => e.type !== 'pp:contains' && e.type !== 'pp:maskedBy');
    const hasMasks = nodeTypes.has('pp:MaskedItem');
    const hasRigging = nodeTypes.has('pp:Skeleton') || nodeTypes.has('pp:Bone');
    const hasPrecomp = nodeTypes.has('pp:Precomp');
    const hasOnLoad = typeof template.onLoad === 'function';
    const hasSimpleAnim = items.some(i => i.animationType && i.animationType !== 'keyframe');

    if (hasRigging || hasPrecomp || (hasOnLoad && hasKeyframes && hasRelations)) {
      sem.animationComplexity = 'advanced';
    } else if (hasMasks && (hasRelations || hasKeyframes)) {
      sem.animationComplexity = 'complex';
    } else if (hasKeyframes || (hasRelations && items.length > 1)) {
      sem.animationComplexity = 'moderate';
    } else if (hasSimpleAnim || items.length > 0) {
      sem.animationComplexity = 'simple';
    } else {
      sem.animationComplexity = 'static';
    }

    // --- contentType ---
    const dominant = this._getDominantTypes(graph);
    const hasDiagram = Array.from(nodeTypes).some(nt =>
      this.isSubtypeOf(nt, 'pp:DiagramShape') || this.isSubtypeOf(nt, 'pp:Connector')
    );
    if (hasDiagram) {
      sem.contentType = 'diagram';
    } else if (nodeTypes.has('pp:MapRegion') || nodeTypes.has('pp:Marker')) {
      sem.contentType = 'map';
    } else if (hasRigging) {
      sem.contentType = 'character';
    } else if (dominant[0] === 'pp:Text' || dominant[0] === 'pp:LetterCollage') {
      sem.contentType = 'text-focused';
    } else if (dominant[0] && dominant[0] !== 'pp:Text' && !nodeTypes.has('pp:Text')) {
      sem.contentType = 'shape-focused';
    } else if (graph.generator && graph.nodes.length <= 1) {
      sem.contentType = 'scene';
    } else {
      sem.contentType = 'mixed';
    }

    // --- platforms (from dimensions) ---
    const dim = template.dimensions || { width: 0, height: 0 };
    const w = dim.width || 0;
    const h = dim.height || 0;
    sem.platforms = [];
    if (w === 1080 && h === 1920) sem.platforms = ['instagram-story', 'tiktok'];
    else if (w === 1080 && h === 1080) sem.platforms = ['instagram-post'];
    else if (w === 1920 && h === 1080) sem.platforms = ['youtube-thumbnail', 'presentation'];
    else if (w === 1200 && h === 628) sem.platforms = ['linkedin', 'twitter'];
    else if (w === 800 && h === 600) sem.platforms = ['general'];

    // --- Feature flags ---
    sem.hasLetterCollage = nodeTypes.has('pp:LetterCollage');
    sem.hasRigging = hasRigging;
    sem.hasMasking = hasMasks;

    // --- mood / audience / intent from category + tags ---
    const categoryDefaults: Record<string, { mood: string[]; audience: string[]; intent: string }> = {
      'social-media': { mood: ['energetic', 'bold'], audience: ['creators', 'marketers'], intent: 'sell' },
      'business':     { mood: ['professional', 'elegant'], audience: ['business'], intent: 'inform' },
      'education':    { mood: ['calm', 'inspiring'], audience: ['students'], intent: 'teach' },
      'creative':     { mood: ['inspiring', 'elegant'], audience: ['creators'], intent: 'inspire' },
      'tech':         { mood: ['futuristic', 'bold'], audience: ['developers'], intent: 'demonstrate' },
      'meme':         { mood: ['playful', 'energetic'], audience: ['general'], intent: 'entertain' },
      'global':       { mood: ['warm', 'festive'], audience: ['multilingual', 'general'], intent: 'celebrate' },
      'indigenous':   { mood: ['warm', 'solemn'], audience: ['indigenous', 'general'], intent: 'celebrate' },
      'seasonal':     { mood: ['festive', 'warm'], audience: ['general'], intent: 'celebrate' },
      'masking':      { mood: ['dramatic', 'elegant'], audience: ['creators'], intent: 'demonstrate' },
      'scenes':       { mood: ['dramatic', 'inspiring'], audience: ['creators'], intent: 'demonstrate' },
      'diagrams':     { mood: ['professional', 'calm'], audience: ['business', 'students'], intent: 'inform' },
      'maps':         { mood: ['professional', 'calm'], audience: ['business'], intent: 'inform' },
      'advanced':     { mood: ['futuristic', 'bold'], audience: ['developers', 'creators'], intent: 'demonstrate' },
    };
    const catDefaults = categoryDefaults[template.category || ''] || { mood: ['calm'], audience: ['general'], intent: 'inform' };
    sem.mood = catDefaults.mood;
    sem.audience = catDefaults.audience;
    sem.intent = catDefaults.intent;

    // --- visualStyle heuristic ---
    const styles: string[] = [];
    if (nodeTypes.has('pp:LetterCollage')) styles.push('letter-by-letter');
    if (hasMasks) styles.push('mask-reveal');
    if (hasRigging) styles.push('skeletal-animation');
    if (graph.generator) {
      const genName = graph.generator.name || '';
      if (genName.includes('Circuit')) styles.push('circuit-board');
      else if (genName.includes('Bokeh') || genName.includes('GradientMesh')) styles.push('gradient-mesh');
      else if (genName.includes('Wave') || genName.includes('OrganicFlow')) styles.push('wave-patterns');
      else if (genName.includes('Geometric')) styles.push('geometric');
      else if (genName.includes('Wind') || genName.includes('Fluid')) styles.push('particle-effects');
      else styles.push('radial-background');
    }
    if (graph.nodes.some(n => n.type === 'pp:Text' && n.properties && n.properties.hasKeyframes)) {
      styles.push('text-reveal');
    }
    if (items.some(i => i.fontSize && i.fontSize >= 48)) styles.push('bold-typography');
    sem.visualStyle = styles.length > 0 ? styles : ['flat-design'];

    // --- colorScheme heuristic ---
    sem.colorScheme = 'vibrant';
    const tags = template.tags || [];
    if (tags.includes('dark') || tags.includes('cyberpunk')) sem.colorScheme = 'dark';
    else if (tags.includes('minimal') || tags.includes('clean')) sem.colorScheme = 'monochrome';
    else if (tags.includes('neon') || tags.includes('glow')) sem.colorScheme = 'neon';
    else if (tags.includes('pastel') || tags.includes('soft')) sem.colorScheme = 'pastel';
    else if (tags.includes('warm') || tags.includes('sunset')) sem.colorScheme = 'warm';

    // --- compositionStyle heuristic ---
    if (hasDiagram) sem.compositionStyle = 'grid';
    else if (graph.generator) sem.compositionStyle = 'layered';
    else if (graph.nodes.length <= 2) sem.compositionStyle = 'centered';
    else sem.compositionStyle = 'centered';

    return sem;
  }

  /** Merge explicit template.semantics over auto-inferred values. */
  private _mergeSemantics(template: TemplateDefinition, graph: TemplateGraph): SemanticInfo {
    const inferred = this._inferSemantics(template, graph);
    if (!template.semantics) return inferred;
    return { ...inferred, ...template.semantics } as SemanticInfo;
  }

  /** Return top 3 node types by count from the graph. */
  private _getDominantTypes(graph: TemplateGraph): string[] {
    const counts: Record<string, number> = {};
    for (const node of graph.nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(e => e[0]);
  }

  /** Compute similarity score between two fingerprints. */
  _computeSimilarity(fpA: Fingerprint, fpB: Fingerprint): number {
    // Structural weight allocation (0.60 total)
    const W_NODE_TYPES = 0.15;
    const W_EDGE_TYPES = 0.12;
    const W_MATH_FUNCS = 0.12;
    const W_PATTERNS   = 0.12;
    const W_SIZE       = 0.05;
    const W_GENERATOR  = 0.04;
    // Semantic weight allocation (0.40 total)
    const W_MOOD       = 0.08;
    const W_VISUAL     = 0.08;
    const W_INTENT     = 0.06;
    const W_AUDIENCE   = 0.05;
    const W_COMPLEXITY = 0.05;
    const W_CONTENT    = 0.04;
    const W_PLATFORMS  = 0.04;

    const nodeTypesSim = this._jaccardKeys(fpA.nodeTypeCounts, fpB.nodeTypeCounts);
    const edgeTypesSim = this._jaccardKeys(fpA.edgeTypeCounts, fpB.edgeTypeCounts);
    const mathSim = this._jaccardArray(fpA.mathFunctions, fpB.mathFunctions);
    const patternSim = this._jaccardArray(fpA.patterns, fpB.patterns);

    // Size similarity
    const totalA = (fpA.totalNodes || 0) + (fpA.totalEdges || 0);
    const totalB = (fpB.totalNodes || 0) + (fpB.totalEdges || 0);
    const sizeSim = (totalA === 0 && totalB === 0) ? 1.0
      : Math.min(totalA, totalB) / Math.max(totalA, totalB);

    // Generator match
    let genSim = 0;
    if (fpA.generatorType && fpB.generatorType) {
      genSim = fpA.generatorType === fpB.generatorType ? 1.0 : 0.5;
    } else if (!fpA.hasGenerator && !fpB.hasGenerator) {
      genSim = 1.0;
    }

    // Semantic dimensions
    const semA = fpA.semantics || null;
    const semB = fpB.semantics || null;

    let moodSim = 0, visualSim = 0, intentSim = 0, audienceSim = 0;
    let complexitySim = 0, contentSim = 0, platformsSim = 0;

    if (semA && semB) {
      moodSim = this._jaccardArray(semA.mood, semB.mood);
      visualSim = this._jaccardArray(semA.visualStyle, semB.visualStyle);
      audienceSim = this._jaccardArray(semA.audience, semB.audience);
      platformsSim = this._jaccardArray(semA.platforms, semB.platforms);

      intentSim = (semA.intent && semA.intent === semB.intent) ? 1.0 : 0.0;
      contentSim = (semA.contentType && semA.contentType === semB.contentType) ? 1.0 : 0.0;

      const complexityOrder = ['static', 'simple', 'moderate', 'complex', 'advanced'];
      const idxA = complexityOrder.indexOf(semA.animationComplexity || '');
      const idxB = complexityOrder.indexOf(semB.animationComplexity || '');
      if (idxA >= 0 && idxB >= 0) {
        const diff = Math.abs(idxA - idxB);
        complexitySim = diff === 0 ? 1.0 : diff === 1 ? 0.5 : 0.0;
      }
    } else if (!semA && !semB) {
      moodSim = 1.0; visualSim = 1.0; intentSim = 1.0; audienceSim = 1.0;
      complexitySim = 1.0; contentSim = 1.0; platformsSim = 1.0;
    }

    return (
      W_NODE_TYPES * nodeTypesSim +
      W_EDGE_TYPES * edgeTypesSim +
      W_MATH_FUNCS * mathSim +
      W_PATTERNS   * patternSim +
      W_SIZE       * sizeSim +
      W_GENERATOR  * genSim +
      W_MOOD       * moodSim +
      W_VISUAL     * visualSim +
      W_INTENT     * intentSim +
      W_AUDIENCE   * audienceSim +
      W_COMPLEXITY * complexitySim +
      W_CONTENT    * contentSim +
      W_PLATFORMS  * platformsSim
    );
  }

  /** Jaccard similarity between the keys of two count objects. */
  private _jaccardKeys(objA?: Record<string, number>, objB?: Record<string, number>): number {
    const a = objA || {};
    const b = objB || {};
    const keysA = new Set(Object.keys(a));
    const keysB = new Set(Object.keys(b));
    const union = new Set([...keysA, ...keysB]);
    if (union.size === 0) return 1.0;
    let intersection = 0;
    for (const key of union) {
      if (keysA.has(key) && keysB.has(key)) intersection++;
    }
    return intersection / union.size;
  }

  /** Jaccard similarity between two string arrays. */
  private _jaccardArray(arrA?: string[], arrB?: string[]): number {
    const a = new Set(arrA || []);
    const b = new Set(arrB || []);
    const union = new Set([...a, ...b]);
    if (union.size === 0) return 1.0;
    let intersection = 0;
    for (const val of union) {
      if (a.has(val) && b.has(val)) intersection++;
    }
    return intersection / union.size;
  }
}
