/**
 * Base Translation Template
 *
 * This file contains the structure for all translations.
 * Each locale file should follow this structure.
 *
 * Tool descriptions are kept in English for AI/LLM processing,
 * but UI-facing strings (names, errors, success messages) are translated.
 */

import { TranslationKeys } from '../types.js';

/**
 * Creates a base translation with common tool descriptions.
 * Tool descriptions remain in English for optimal AI understanding,
 * while user-facing messages are translated.
 */
export function createBaseTranslation(overrides: Partial<TranslationKeys>): TranslationKeys {
  const base: TranslationKeys = {
    tools: {
      // Tool descriptions are intentionally kept in English
      // for optimal AI/LLM understanding and consistency
      pinepaper_create_item: {
        name: overrides.tools?.pinepaper_create_item?.name || 'Create Item',
        description: `Create an item on the PinePaper canvas.

USE WHEN:
- User wants to add text, shapes, or graphics to the canvas
- Creating new visual elements (circles, stars, rectangles, etc.)
- Starting a new scene or composition

ITEM TYPES:
- text: Text content with font styling
- circle: Circular shape with radius
- star: Star shape with inner/outer radius
- rectangle: Rectangle with width/height
- triangle: Triangular shape
- polygon: Regular polygon with N sides
- ellipse: Oval shape
- path: Custom path with segments or SVG data
- line: Line between two points
- arc: Curved arc through three points`,
      },
      pinepaper_modify_item: {
        name: overrides.tools?.pinepaper_modify_item?.name || 'Modify Item',
        description: `Modify an existing item's properties.

USE WHEN:
- Changing color, size, position of an existing item
- Updating text content
- Adjusting styling properties`,
      },
      pinepaper_delete_item: {
        name: overrides.tools?.pinepaper_delete_item?.name || 'Delete Item',
        description: `Delete an item from the canvas.

USE WHEN:
- Removing unwanted items
- Clearing specific elements
- Cleaning up the scene`,
      },
      pinepaper_add_relation: {
        name: overrides.tools?.pinepaper_add_relation?.name || 'Add Relation',
        description: `Create a behavior relationship between two items. Relations are the PRIMARY way to add animation in PinePaper.

RELATION TYPES:
- orbits: Circular motion around target
- follows: Move toward target with smoothing
- attached_to: Fixed offset from target
- maintains_distance: Stay fixed distance from target
- points_at: Rotate to face target
- mirrors: Mirror position across axis
- parallax: Move relative by depth
- bounds_to: Stay within bounds`,
      },
      pinepaper_remove_relation: {
        name: overrides.tools?.pinepaper_remove_relation?.name || 'Remove Relation',
        description: 'Remove a relationship between items.',
      },
      pinepaper_query_relations: {
        name: overrides.tools?.pinepaper_query_relations?.name || 'Query Relations',
        description: 'Query relationships for an item.',
      },
      pinepaper_animate: {
        name: overrides.tools?.pinepaper_animate?.name || 'Animate',
        description: `Apply a simple LOOP animation to an item.

ANIMATION TYPES: pulse, rotate, bounce, fade, wobble, slide, typewriter`,
      },
      pinepaper_keyframe_animate: {
        name: overrides.tools?.pinepaper_keyframe_animate?.name || 'Keyframe Animation',
        description: 'Apply keyframe-based animation with precise timing.',
      },
      pinepaper_play_timeline: {
        name: overrides.tools?.pinepaper_play_timeline?.name || 'Play Timeline',
        description: 'Control keyframe animation playback.',
      },
      pinepaper_execute_generator: {
        name: overrides.tools?.pinepaper_execute_generator?.name || 'Execute Generator',
        description: 'Execute a background generator to create procedural patterns.',
      },
      pinepaper_list_generators: {
        name: overrides.tools?.pinepaper_list_generators?.name || 'List Generators',
        description: 'Get a list of all available background generators.',
      },
      pinepaper_apply_effect: {
        name: overrides.tools?.pinepaper_apply_effect?.name || 'Apply Effect',
        description: 'Apply a visual effect to an item.',
      },
      pinepaper_get_items: {
        name: overrides.tools?.pinepaper_get_items?.name || 'Get Items',
        description: 'Get all or filtered items from the canvas.',
      },
      pinepaper_get_relation_stats: {
        name: overrides.tools?.pinepaper_get_relation_stats?.name || 'Get Relation Stats',
        description: 'Get statistics about active relations in the scene.',
      },
      pinepaper_set_background_color: {
        name: overrides.tools?.pinepaper_set_background_color?.name || 'Set Background Color',
        description: 'Set the canvas background color.',
      },
      pinepaper_set_canvas_size: {
        name: overrides.tools?.pinepaper_set_canvas_size?.name || 'Set Canvas Size',
        description: 'Change the canvas dimensions.',
      },
      pinepaper_export_svg: {
        name: overrides.tools?.pinepaper_export_svg?.name || 'Export SVG',
        description: 'Export the scene as animated SVG.',
      },
      pinepaper_export_training_data: {
        name: overrides.tools?.pinepaper_export_training_data?.name || 'Export Training Data',
        description: 'Export relation data as training pairs for LLM fine-tuning.',
      },

      // Diagram Tools
      pinepaper_create_diagram_shape: {
        name: overrides.tools?.pinepaper_create_diagram_shape?.name || 'Create Diagram Shape',
        description: `Create a diagram shape on the canvas. Shapes for flowcharts, UML, network diagrams.

SHAPE TYPES:
- Flowchart: process, decision, terminal, data, document, database, preparation
- UML: uml-class, uml-usecase, uml-actor
- Network: cloud, server
- Basic: rectangle, circle, triangle, star`,
      },
      pinepaper_connect: {
        name: overrides.tools?.pinepaper_connect?.name || 'Connect Items',
        description: `Connect two items with a smart connector. Draw lines/arrows between diagram shapes.

ROUTING: orthogonal (right-angle), direct (straight), curved`,
      },
      pinepaper_connect_ports: {
        name: overrides.tools?.pinepaper_connect_ports?.name || 'Connect Specific Ports',
        description: 'Connect two specific ports on items with precise control.',
      },
      pinepaper_add_ports: {
        name: overrides.tools?.pinepaper_add_ports?.name || 'Add Ports to Item',
        description: 'Add connection ports to an existing item. Ports are anchor points for connectors.',
      },
      pinepaper_auto_layout: {
        name: overrides.tools?.pinepaper_auto_layout?.name || 'Auto Layout',
        description: `Automatically arrange diagram items using a layout algorithm.

LAYOUTS: hierarchical, force-directed, tree, radial, grid`,
      },
      pinepaper_get_diagram_shapes: {
        name: overrides.tools?.pinepaper_get_diagram_shapes?.name || 'Get Diagram Shapes',
        description: 'Get a list of available diagram shapes with their properties.',
      },
      pinepaper_update_connector: {
        name: overrides.tools?.pinepaper_update_connector?.name || 'Update Connector',
        description: 'Update the style or label of an existing connector.',
      },
      pinepaper_remove_connector: {
        name: overrides.tools?.pinepaper_remove_connector?.name || 'Remove Connector',
        description: 'Remove a connector from the canvas.',
      },
      pinepaper_diagram_mode: {
        name: overrides.tools?.pinepaper_diagram_mode?.name || 'Diagram Mode',
        description: `Control the diagram mode for interactive editing.

ACTIONS: activate, deactivate, toggle, setMode`,
      },
    },

    errors: {
      itemNotFound: overrides.errors?.itemNotFound || 'Item not found: {{itemId}}',
      invalidRelation: overrides.errors?.invalidRelation || 'Invalid relation: {{relationType}}',
      invalidParams: overrides.errors?.invalidParams || 'Invalid parameters: {{details}}',
      generatorNotFound: overrides.errors?.generatorNotFound || 'Generator not found: {{generatorName}}',
      exportFailed: overrides.errors?.exportFailed || 'Export failed: {{reason}}',
      executionError: overrides.errors?.executionError || 'Execution error: {{message}}',
      validationError: overrides.errors?.validationError || 'Validation error: {{message}}',
      unknownTool: overrides.errors?.unknownTool || 'Unknown tool: {{toolName}}',
      apiKeyRequired: overrides.errors?.apiKeyRequired || 'API key required',
      apiKeyInvalid: overrides.errors?.apiKeyInvalid || 'Invalid API key',
      apiKeyExpired: overrides.errors?.apiKeyExpired || 'API key expired',
      rateLimitExceeded: overrides.errors?.rateLimitExceeded || 'Rate limit exceeded. Try again in {{seconds}} seconds.',
    },

    success: {
      itemCreated: overrides.success?.itemCreated || 'Created {{itemType}} at position ({{x}}, {{y}})',
      itemModified: overrides.success?.itemModified || 'Modified item {{itemId}}',
      itemDeleted: overrides.success?.itemDeleted || 'Deleted item {{itemId}}',
      relationAdded: overrides.success?.relationAdded || 'Added {{relationType}} relation: {{sourceId}} → {{targetId}}',
      relationRemoved: overrides.success?.relationRemoved || 'Removed relation between {{sourceId}} and {{targetId}}',
      animationApplied: overrides.success?.animationApplied || 'Applied {{animationType}} animation to {{itemId}}',
      generatorExecuted: overrides.success?.generatorExecuted || 'Executed {{generatorName}} generator',
      effectApplied: overrides.success?.effectApplied || 'Applied {{effectType}} effect to {{itemId}}',
      backgroundSet: overrides.success?.backgroundSet || 'Set background color to {{color}}',
      canvasSizeSet: overrides.success?.canvasSizeSet || 'Set canvas size to {{width}}×{{height}}',
      exported: overrides.success?.exported || 'Exported {{format}} successfully',
    },

    itemTypes: {
      text: overrides.itemTypes?.text || 'Text',
      circle: overrides.itemTypes?.circle || 'Circle',
      star: overrides.itemTypes?.star || 'Star',
      rectangle: overrides.itemTypes?.rectangle || 'Rectangle',
      triangle: overrides.itemTypes?.triangle || 'Triangle',
      polygon: overrides.itemTypes?.polygon || 'Polygon',
      ellipse: overrides.itemTypes?.ellipse || 'Ellipse',
      path: overrides.itemTypes?.path || 'Path',
      line: overrides.itemTypes?.line || 'Line',
      arc: overrides.itemTypes?.arc || 'Arc',
    },

    relationTypes: {
      orbits: overrides.relationTypes?.orbits || 'Orbits',
      follows: overrides.relationTypes?.follows || 'Follows',
      attached_to: overrides.relationTypes?.attached_to || 'Attached to',
      maintains_distance: overrides.relationTypes?.maintains_distance || 'Maintains distance',
      points_at: overrides.relationTypes?.points_at || 'Points at',
      mirrors: overrides.relationTypes?.mirrors || 'Mirrors',
      parallax: overrides.relationTypes?.parallax || 'Parallax',
      bounds_to: overrides.relationTypes?.bounds_to || 'Bounds to',
    },

    animationTypes: {
      pulse: overrides.animationTypes?.pulse || 'Pulse',
      rotate: overrides.animationTypes?.rotate || 'Rotate',
      bounce: overrides.animationTypes?.bounce || 'Bounce',
      fade: overrides.animationTypes?.fade || 'Fade',
      wobble: overrides.animationTypes?.wobble || 'Wobble',
      slide: overrides.animationTypes?.slide || 'Slide',
      typewriter: overrides.animationTypes?.typewriter || 'Typewriter',
    },

    generators: {
      drawSunburst: overrides.generators?.drawSunburst || 'Sunburst',
      drawSunsetScene: overrides.generators?.drawSunsetScene || 'Sunset Scene',
      drawGrid: overrides.generators?.drawGrid || 'Grid',
      drawStackedCircles: overrides.generators?.drawStackedCircles || 'Stacked Circles',
      drawCircuit: overrides.generators?.drawCircuit || 'Circuit Board',
      drawWaves: overrides.generators?.drawWaves || 'Waves',
      drawPattern: overrides.generators?.drawPattern || 'Pattern',
    },

    common: {
      at: overrides.common?.at || 'at',
      with: overrides.common?.with || 'with',
      to: overrides.common?.to || 'to',
      from: overrides.common?.from || 'from',
      position: overrides.common?.position || 'position',
      radius: overrides.common?.radius || 'radius',
      color: overrides.common?.color || 'color',
      speed: overrides.common?.speed || 'speed',
      duration: overrides.common?.duration || 'duration',
    },
  };

  return base;
}
