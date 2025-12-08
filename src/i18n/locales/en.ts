/**
 * English Translations (Default)
 */

import { TranslationKeys } from '../types.js';

export const en: TranslationKeys = {
  tools: {
    pinepaper_create_item: {
      name: 'Create Item',
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
- arc: Curved arc through three points

EXAMPLES:
- "Create red text saying HELLO" → type: text, content: "HELLO", color: "#ef4444"
- "Add a blue circle" → type: circle, radius: 50, color: "#3b82f6"
- "Create a 5-pointed gold star" → type: star, radius1: 60, radius2: 30, color: "#fbbf24"`,
      params: {
        itemType: 'Type of item to create',
        position: 'Position on canvas',
        properties: 'Type-specific properties (content, radius, color, fontSize, etc.)',
      },
    },
    pinepaper_modify_item: {
      name: 'Modify Item',
      description: `Modify an existing item's properties.

USE WHEN:
- Changing color, size, position of an existing item
- Updating text content
- Adjusting styling properties

MODIFIABLE PROPERTIES:
- position: {x, y} or separate x, y
- color/fillColor: Fill color
- strokeColor: Outline color
- strokeWidth: Outline thickness
- fontSize: Text size
- content: Text content
- opacity: Transparency (0-1)
- rotation: Rotation in degrees
- scale: Size multiplier`,
      params: {
        itemId: 'Registry ID of the item (e.g., "item_1")',
        properties: 'Properties to update',
      },
    },
    pinepaper_delete_item: {
      name: 'Delete Item',
      description: `Delete an item from the canvas.

USE WHEN:
- Removing unwanted items
- Clearing specific elements
- Cleaning up the scene`,
      params: {
        itemId: 'Registry ID of the item to delete',
      },
    },
    pinepaper_add_relation: {
      name: 'Add Relation',
      description: `Create a behavior relationship between two items. Relations are the PRIMARY way to add animation in PinePaper - they describe HOW items should behave relative to each other.

USE WHEN:
- "moon orbits earth" → relationType: orbits
- "label follows player" → relationType: follows
- "hat attached to character" → relationType: attached_to
- "keep satellite 200px from station" → relationType: maintains_distance
- "arrow points at target" → relationType: points_at
- "reflection mirrors original" → relationType: mirrors
- "background moves with parallax" → relationType: parallax
- "player stays in arena" → relationType: bounds_to

RELATION TYPES:
- orbits: Circular motion around target (params: radius, speed, direction)
- follows: Move toward target with smoothing (params: offset, smoothing, delay)
- attached_to: Fixed offset from target (params: offset, inherit_rotation)
- maintains_distance: Stay fixed distance from target (params: distance, strength)
- points_at: Rotate to face target (params: offset_angle, smoothing)
- mirrors: Mirror position across axis (params: axis, center)
- parallax: Move relative by depth (params: depth, origin)
- bounds_to: Stay within bounds (params: padding, bounce)

Relations are COMPOSITIONAL - an item can have multiple relations that work together!`,
      params: {
        sourceId: 'Registry ID of the source item (the item that will be affected)',
        targetId: 'Registry ID of the target item (the item being related to)',
        relationType: 'Type of relationship',
        params: 'Relation-specific parameters',
      },
    },
    pinepaper_remove_relation: {
      name: 'Remove Relation',
      description: `Remove a relationship between items.

USE WHEN:
- Stopping an orbital animation
- Detaching items from each other
- Removing behavioral connections`,
      params: {
        sourceId: 'Source item ID',
        targetId: 'Target item ID',
        relationType: 'Specific relation type to remove (optional - removes all if not specified)',
      },
    },
    pinepaper_query_relations: {
      name: 'Query Relations',
      description: `Query relationships for an item.

USE WHEN:
- Finding what items orbit a central object
- Checking existing relations before adding new ones
- Debugging animation behaviors`,
      params: {
        itemId: 'Item to query relations for',
        relationType: 'Filter by relation type (optional)',
        direction: 'outgoing = relations FROM item, incoming = relations TO item',
      },
    },
    pinepaper_animate: {
      name: 'Animate',
      description: `Apply a simple LOOP animation to an item. These are continuous animations that repeat infinitely.

USE WHEN:
- "make it pulse" → animationType: pulse
- "rotating logo" → animationType: rotate
- "bouncing text" → animationType: bounce
- "fading effect" → animationType: fade
- "wobbling button" → animationType: wobble
- "sliding header" → animationType: slide
- "typewriter effect" → animationType: typewriter (text only)

DO NOT USE WHEN:
- User specifies exact timing ("fade in over 3 seconds") → Use keyframe animation
- User wants sequential animations ("first fade, then rotate") → Use keyframe animation
- User describes relationships ("orbit around") → Use relations`,
      params: {
        itemId: 'Registry ID of the item',
        animationType: 'Type of animation',
        speed: 'Animation speed multiplier (default: 1.0)',
      },
    },
    pinepaper_keyframe_animate: {
      name: 'Keyframe Animation',
      description: `Apply keyframe-based animation with precise timing and property control.

USE WHEN:
- "fade in over 3 seconds"
- "move from left to right in 2 seconds"
- "change color from red to blue"
- "first fade in, then rotate, then fade out"
- Any animation with specific timing or sequential stages`,
      params: {
        itemId: 'Registry ID of the item',
        keyframes: 'Array of keyframes with time, properties, and easing',
        duration: 'Total animation duration in seconds',
        loop: 'Whether to loop the animation',
      },
    },
    pinepaper_play_timeline: {
      name: 'Play Timeline',
      description: `Control keyframe animation playback.

USE WHEN:
- Starting/stopping timeline playback
- Seeking to specific time
- Controlling animation state`,
      params: {
        action: 'Playback action (play, stop, seek)',
        duration: 'Duration for play action',
        loop: 'Whether to loop',
        time: 'Time to seek to (for seek action)',
      },
    },
    pinepaper_execute_generator: {
      name: 'Execute Generator',
      description: `Execute a background generator to create procedural patterns.

USE WHEN:
- "add a sunburst background"
- "create wave pattern"
- "grid background"
- "circuit board pattern"
- Creating dynamic procedural backgrounds`,
      params: {
        generatorName: 'Generator name',
        params: 'Generator-specific parameters',
      },
    },
    pinepaper_list_generators: {
      name: 'List Generators',
      description: `Get a list of all available background generators with their parameters.

USE WHEN:
- User asks "what backgrounds are available?"
- Need to show generator options
- Discovering generator capabilities`,
    },
    pinepaper_apply_effect: {
      name: 'Apply Effect',
      description: `Apply a visual effect to an item.

USE WHEN:
- Adding sparkle/glitter effects
- Creating burst/explosion effects
- Enhancing visual impact`,
      params: {
        itemId: 'Registry ID of the item',
        effectType: 'Type of effect (sparkle, blast)',
        params: 'Effect parameters',
      },
    },
    pinepaper_get_items: {
      name: 'Get Items',
      description: `Get all or filtered items from the canvas.

USE WHEN:
- Listing what's on the canvas
- Finding items by type
- Checking animated items
- Scene inspection`,
      params: {
        filter: 'Optional filter criteria',
      },
    },
    pinepaper_get_relation_stats: {
      name: 'Get Relation Stats',
      description: `Get statistics about active relations in the scene.

USE WHEN:
- Debugging relation system
- Understanding scene complexity
- Analytics and reporting`,
    },
    pinepaper_set_background_color: {
      name: 'Set Background Color',
      description: `Set the canvas background color.

USE WHEN:
- Changing scene background
- Setting up canvas before adding items`,
      params: {
        color: 'Background color (hex, rgb, or named)',
      },
    },
    pinepaper_set_canvas_size: {
      name: 'Set Canvas Size',
      description: `Change the canvas dimensions.

USE WHEN:
- Setting up for specific format (Instagram, YouTube, etc.)
- Custom canvas size requirements

COMMON PRESETS:
- instagram-square: 1080x1080
- instagram-story: 1080x1920
- youtube-thumbnail: 1280x720
- twitter-post: 1200x675`,
      params: {
        width: 'Canvas width',
        height: 'Canvas height',
        preset: 'Optional preset name',
      },
    },
    pinepaper_export_svg: {
      name: 'Export SVG',
      description: `Export the scene as animated SVG.

USE WHEN:
- Saving work as SVG file
- Generating shareable graphics
- Final export`,
      params: {
        animated: 'Include CSS animations (default: true)',
      },
    },
    pinepaper_export_training_data: {
      name: 'Export Training Data',
      description: `Export relation data as training pairs for LLM fine-tuning.

USE WHEN:
- Generating training data for fine-tuning
- Creating examples from current scene
- Building custom animation model training sets`,
      params: {
        format: 'Output format (json or jsonl)',
        includeMetadata: 'Include relation metadata',
      },
    },
  },

  errors: {
    itemNotFound: 'Item not found: {{itemId}}',
    invalidRelation: 'Invalid relation: {{relationType}}',
    invalidParams: 'Invalid parameters: {{details}}',
    generatorNotFound: 'Generator not found: {{generatorName}}',
    exportFailed: 'Export failed: {{reason}}',
    executionError: 'Execution error: {{message}}',
    validationError: 'Validation error: {{message}}',
    unknownTool: 'Unknown tool: {{toolName}}',
    apiKeyRequired: 'API key required',
    apiKeyInvalid: 'Invalid API key',
    apiKeyExpired: 'API key expired',
    rateLimitExceeded: 'Rate limit exceeded. Try again in {{seconds}} seconds.',
  },

  success: {
    itemCreated: 'Created {{itemType}} at position ({{x}}, {{y}})',
    itemModified: 'Modified item {{itemId}}',
    itemDeleted: 'Deleted item {{itemId}}',
    relationAdded: 'Added {{relationType}} relation: {{sourceId}} → {{targetId}}',
    relationRemoved: 'Removed relation between {{sourceId}} and {{targetId}}',
    animationApplied: 'Applied {{animationType}} animation to {{itemId}}',
    generatorExecuted: 'Executed {{generatorName}} generator',
    effectApplied: 'Applied {{effectType}} effect to {{itemId}}',
    backgroundSet: 'Set background color to {{color}}',
    canvasSizeSet: 'Set canvas size to {{width}}×{{height}}',
    exported: 'Exported {{format}} successfully',
  },

  itemTypes: {
    text: 'Text',
    circle: 'Circle',
    star: 'Star',
    rectangle: 'Rectangle',
    triangle: 'Triangle',
    polygon: 'Polygon',
    ellipse: 'Ellipse',
    path: 'Path',
    line: 'Line',
    arc: 'Arc',
  },

  relationTypes: {
    orbits: 'Orbits',
    follows: 'Follows',
    attached_to: 'Attached to',
    maintains_distance: 'Maintains distance',
    points_at: 'Points at',
    mirrors: 'Mirrors',
    parallax: 'Parallax',
    bounds_to: 'Bounds to',
  },

  animationTypes: {
    pulse: 'Pulse',
    rotate: 'Rotate',
    bounce: 'Bounce',
    fade: 'Fade',
    wobble: 'Wobble',
    slide: 'Slide',
    typewriter: 'Typewriter',
  },

  generators: {
    drawSunburst: 'Sunburst',
    drawSunsetScene: 'Sunset Scene',
    drawGrid: 'Grid',
    drawStackedCircles: 'Stacked Circles',
    drawCircuit: 'Circuit Board',
    drawWaves: 'Waves',
    drawPattern: 'Pattern',
  },

  common: {
    at: 'at',
    with: 'with',
    to: 'to',
    from: 'from',
    position: 'position',
    radius: 'radius',
    color: 'color',
    speed: 'speed',
    duration: 'duration',
  },
};
