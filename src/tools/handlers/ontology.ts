/**
 * Ontology tool handlers — extracted from src/tools/handlers.ts.
 *
 * Three tools form the public ontology surface:
 *   pinepaper_analyze_design   — extract a graph from a template definition
 *                                + emit JSON-LD
 *   pinepaper_validate_design  — schema validation + 5-dim quality scoring
 *   pinepaper_query_ontology   — 14 read-only queries over the vocabulary
 *                                (list_types/edges/generators/effects/patterns/
 *                                math_functions, type hierarchy, subtype check,
 *                                edge/node lookup, etc.)
 *
 * All ontology code is loaded via dynamic imports — same behavior as the
 * pre-extraction switch — so the cost only hits when a query lands.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { errorResult, type HandlerOptions } from '../handlers.js';
import {
  AnalyzeDesignInputSchema,
  ValidateDesignInputSchema,
  QueryOntologyInputSchema,
  ErrorCodes,
} from '../../types/schemas.js';

export type OntologyHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const ontologyHandlers: Record<string, OntologyHandler> = {
  pinepaper_analyze_design: async (args, _options) => {
    const input = AnalyzeDesignInputSchema.parse(args);
    const { DesignGraph } = await import('../../ontology/index.js');
    const dg = new DesignGraph();
    const graph = dg.extractFromDefinition(input.definition as any);
    const jsonLd = dg.toJsonLd(graph);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          templateId: graph.templateId,
          templateName: graph.templateName,
          category: graph.category,
          dimensions: graph.dimensions,
          duration: graph.duration,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          nodeTypes: Object.fromEntries(
            Object.entries(graph.fingerprint?.nodeTypeCounts || {}).sort((a, b) => b[1] - a[1]),
          ),
          edgeTypes: Object.fromEntries(
            Object.entries(graph.fingerprint?.edgeTypeCounts || {}).sort((a, b) => b[1] - a[1]),
          ),
          patterns: graph.patterns,
          mathFunctions: graph.mathFunctions,
          generator: graph.generator,
          semantics: graph.semantics,
          fingerprint: graph.fingerprint,
          jsonLd,
        }, null, 2),
      }],
    };
  },

  pinepaper_validate_design: async (args, _options) => {
    const input = ValidateDesignInputSchema.parse(args);
    const { DesignGraph, KnowledgeGraphValidator } = await import('../../ontology/index.js');
    const dg = new DesignGraph();
    const validator = new KnowledgeGraphValidator();
    const definition = input.definition as any;
    const validation = validator.validateTemplate(definition);
    let quality = null;
    if (validation.valid) {
      const graph = dg.extractFromDefinition(definition);
      quality = validator.scoreQuality(definition, graph);
    }
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ validation, quality }, null, 2),
      }],
    };
  },

  pinepaper_query_ontology: async (args, _options) => {
    const input = QueryOntologyInputSchema.parse(args);
    const { PP_VOCABULARY, RELATION_TYPE_MAP } = await import('../../ontology/vocabulary.js');
    const { DesignGraph } = await import('../../ontology/design-graph.js');
    const dg = new DesignGraph();

    let result: unknown;
    switch (input.query) {
      case 'list_types': {
        const entries = Object.entries(PP_VOCABULARY.types);
        const filtered = entries.filter(([_key, def]) => {
          if (input.category && (def as any).category !== input.category) return false;
          if (!input.includeAbstract && (def as any).abstract) return false;
          return true;
        });
        result = Object.fromEntries(filtered);
        break;
      }
      case 'list_edges': {
        const entries = Object.entries(PP_VOCABULARY.edges);
        const filtered = input.category
          ? entries.filter(([, def]) => (def as any).category === input.category)
          : entries;
        result = Object.fromEntries(filtered);
        break;
      }
      case 'list_generators': {
        const entries = Object.entries(PP_VOCABULARY.generators);
        const filtered = input.category
          ? entries.filter(([, def]) => (def as any).category === input.category)
          : entries;
        result = Object.fromEntries(filtered);
        break;
      }
      case 'list_effects': {
        result = ['sparkle', 'blast', 'smoke', 'fire', 'rain', 'snow', 'confetti', 'ripple', 'glow', 'electric'];
        break;
      }
      case 'list_patterns': {
        result = PP_VOCABULARY.patterns;
        break;
      }
      case 'list_math_functions': {
        result = PP_VOCABULARY.mathFunctions;
        break;
      }
      case 'type_hierarchy': {
        if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_hierarchy');
        result = dg.getTypeHierarchy(input.ppType);
        break;
      }
      case 'type_children': {
        if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_children');
        result = dg.getTypeChildren(input.ppType);
        break;
      }
      case 'type_properties': {
        if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_properties');
        result = dg.getPropertiesFor(input.ppType);
        break;
      }
      case 'animatable_properties': {
        if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for animatable_properties');
        result = dg.getAnimatableProperties(input.ppType);
        break;
      }
      case 'is_subtype': {
        if (!input.typeA || !input.typeB) return errorResult(ErrorCodes.INVALID_INPUT, 'typeA and typeB are required for is_subtype');
        result = { isSubtype: dg.isSubtypeOf(input.typeA, input.typeB) };
        break;
      }
      case 'edge_info': {
        const edgeName = input.relationName || input.ppType;
        if (!edgeName) return errorResult(ErrorCodes.INVALID_INPUT, 'relationName or ppType is required for edge_info');
        const ppEdge = PP_VOCABULARY.edges[edgeName] || PP_VOCABULARY.edges[RELATION_TYPE_MAP[edgeName] || ''];
        result = ppEdge || { error: `Unknown edge: ${edgeName}` };
        break;
      }
      case 'node_type': {
        if (!input.itemType) return errorResult(ErrorCodes.INVALID_INPUT, 'itemType is required for node_type');
        result = { ppType: dg.getNodeType(input.itemType) };
        break;
      }
      case 'edge_type': {
        if (!input.relationName) return errorResult(ErrorCodes.INVALID_INPUT, 'relationName is required for edge_type');
        result = { ppEdge: dg.getEdgeType(input.relationName) };
        break;
      }
      default:
        return errorResult(ErrorCodes.INVALID_INPUT, `Unknown query: ${input.query}`);
    }

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      }],
    };
  },
};
