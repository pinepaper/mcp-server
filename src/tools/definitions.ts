/**
 * PinePaper MCP Tool Definitions
 *
 * This file contains all the tool definitions for the MCP server.
 * Each tool has a name, description, and JSON schema for inputs.
 *
 * Note: Tool descriptions remain in English for optimal AI/LLM understanding.
 * User-facing messages (errors, success) are translated via i18n.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { I18nManager } from '../i18n/index.js';

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const PINEPAPER_TOOLS: Tool[] = [
  // ---------------------------------------------------------------------------
  // ITEM TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_item',
    description: `Create an item on the PinePaper canvas. Returns an itemId (e.g., "item_1") that you MUST save to reference this item later.

USE WHEN:
- User wants to add text, shapes, or graphics to the canvas
- Creating new visual elements (circles, stars, rectangles, etc.)
- Starting a new scene or composition

IMPORTANT:
- Save the returned itemId! You need it for pinepaper_add_relation, pinepaper_modify_item, pinepaper_delete_item, etc.
- If there's a welcome template on the canvas, use pinepaper_clear_canvas first
- Position defaults to canvas center (400, 300). Use position: {x, y} to place elsewhere.

ITEM TYPES:
- text: Text content with font styling (properties: content, fontSize, color, fontFamily)
- circle: Circular shape (properties: radius, color, strokeColor, strokeWidth)
- star: Star shape (properties: radius1, radius2, points, color)
- rectangle: Rectangle (properties: width, height, color, cornerRadius)
- triangle: Triangular shape (properties: color)
- polygon: Regular polygon with N sides (properties: sides, radius, color)
- ellipse: Oval shape (properties: color)
- path: Custom path with segments or SVG data (properties: segments, pathData, strokeColor)
- line: Line between two points (properties: from, to, strokeColor, strokeWidth)
- arc: Curved arc through three points (properties: from, through, to, strokeColor)

EXAMPLES:
- "Create red text saying HELLO" → itemType: "text", properties: {content: "HELLO", color: "#ef4444", fontSize: 48}
- "Add a blue circle" → itemType: "circle", properties: {radius: 50, color: "#3b82f6"}
- "Create a 5-pointed gold star" → itemType: "star", properties: {radius1: 60, radius2: 30, points: 5, color: "#fbbf24"}

WORKFLOW TIP:
After creating items, use pinepaper_add_relation to animate them (e.g., orbits, follows, attached_to).`,
    inputSchema: {
      type: 'object',
      properties: {
        itemType: {
          type: 'string',
          enum: ['text', 'circle', 'star', 'rectangle', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc'],
          description: 'Type of item to create',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (default: 400)' },
            y: { type: 'number', description: 'Y coordinate (default: 300)' },
          },
          description: 'Position on canvas',
        },
        properties: {
          type: 'object',
          description: 'Type-specific properties (content, radius, color, fontSize, etc.)',
          additionalProperties: true,
        },
      },
      required: ['itemType'],
    },
  },

  {
    name: 'pinepaper_modify_item',
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
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Registry ID of the item (e.g., "item_1")',
        },
        properties: {
          type: 'object',
          description: 'Properties to update',
          additionalProperties: true,
        },
      },
      required: ['itemId', 'properties'],
    },
  },

  {
    name: 'pinepaper_delete_item',
    description: `Delete a single item from the canvas by its registry ID.

USE WHEN:
- Removing a specific unwanted item
- Cleaning up individual elements
- Undoing a creation mistake

HOW TO FIND ITEM IDs:
1. The itemId is returned when you create an item (e.g., "item_1", "item_2")
2. Use pinepaper_get_items to list all items and their IDs
3. Items are typically named sequentially: item_1, item_2, item_3, etc.

IF DELETION FAILS:
- Verify the itemId exists with pinepaper_get_items first
- If the item is part of the welcome template, use pinepaper_clear_canvas instead
- For stubborn items, try pinepaper_refresh_page to reset the entire canvas

TO DELETE ALL ITEMS:
Use pinepaper_clear_canvas instead of deleting items one by one.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Registry ID of the item to delete (e.g., "item_1")',
        },
      },
      required: ['itemId'],
    },
  },

  // ---------------------------------------------------------------------------
  // RELATION TOOLS (KEY FOR ANIMATION)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_add_relation',
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
- Creating physics-based or behavioral animations

RELATION TYPES:
- orbits: Circular motion around target (params: radius, speed, direction, phase)
- follows: Move toward target with smoothing (params: offset, smoothing, delay)
- attached_to: Fixed offset from target (params: offset, inherit_rotation)
- maintains_distance: Stay fixed distance from target (params: distance, strength)
- points_at: Rotate to face target (params: offset_angle, smoothing)
- mirrors: Mirror position across axis (params: axis, center)
- parallax: Move relative by depth (params: depth, origin)
- bounds_to: Stay within bounds (params: padding, bounce)

VERIFYING ANIMATION WORKS:
After adding a relation, verify the animation is running:
1. Use pinepaper_browser_screenshot to see the canvas
2. Wait 1-2 seconds and take another screenshot - items should have moved
3. Use pinepaper_query_relations to confirm the relation was added

Relations are COMPOSITIONAL - an item can have multiple relations that work together!`,
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description: 'Registry ID of the source item (the item that will be affected)',
        },
        targetId: {
          type: 'string',
          description: 'Registry ID of the target item (the item being related to)',
        },
        relationType: {
          type: 'string',
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to'],
          description: 'Type of relationship',
        },
        params: {
          type: 'object',
          description: 'Relation-specific parameters',
          additionalProperties: true,
        },
      },
      required: ['sourceId', 'targetId', 'relationType'],
    },
  },

  {
    name: 'pinepaper_remove_relation',
    description: `Remove a relationship between items.

USE WHEN:
- Stopping an orbital animation
- Detaching items from each other
- Removing behavioral connections`,
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: { type: 'string', description: 'Source item ID' },
        targetId: { type: 'string', description: 'Target item ID' },
        relationType: {
          type: 'string',
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to'],
          description: 'Specific relation type to remove (optional - removes all if not specified)',
        },
      },
      required: ['sourceId', 'targetId'],
    },
  },

  {
    name: 'pinepaper_query_relations',
    description: `Query relationships for an item.

USE WHEN:
- Finding what items orbit a central object
- Checking existing relations before adding new ones
- Debugging animation behaviors`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Item to query relations for' },
        relationType: {
          type: 'string',
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to'],
          description: 'Filter by relation type (optional)',
        },
        direction: {
          type: 'string',
          enum: ['outgoing', 'incoming'],
          description: 'outgoing = relations FROM item, incoming = relations TO item',
        },
      },
      required: ['itemId'],
    },
  },

  // ---------------------------------------------------------------------------
  // ANIMATION TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_animate',
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
- User describes relationships ("orbit around") → Use relations

ANIMATION TYPES:
- pulse: Scale up/down rhythmically
- rotate: Continuous rotation
- bounce: Vertical bouncing motion
- fade: Opacity cycling
- wobble: Side-to-side wobbling
- slide: Horizontal sliding
- typewriter: Character-by-character reveal`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item' },
        animationType: {
          type: 'string',
          enum: ['pulse', 'rotate', 'bounce', 'fade', 'wobble', 'slide', 'typewriter'],
          description: 'Type of animation',
        },
        speed: {
          type: 'number',
          description: 'Animation speed multiplier (default: 1.0)',
        },
      },
      required: ['itemId', 'animationType'],
    },
  },

  {
    name: 'pinepaper_keyframe_animate',
    description: `Apply keyframe-based animation with precise timing and property control.

USE WHEN:
- "fade in over 3 seconds"
- "move from left to right in 2 seconds"
- "change color from red to blue"
- "first fade in, then rotate, then fade out"
- Any animation with specific timing or sequential stages

ANIMATABLE PROPERTIES:
- position: [x, y] array
- x, y: Individual coordinates
- scale: Uniform scale
- scaleX, scaleY: Axis scaling
- rotation: Degrees
- opacity: 0-1
- fillColor: Color string
- strokeColor: Color string
- fontSize: Number

EASING OPTIONS:
- linear: Constant speed
- easeIn: Slow start
- easeOut: Slow end
- easeInOut: Slow start and end
- bounce: Bounce effect
- elastic: Elastic overshoot`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item' },
        keyframes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number', description: 'Time in seconds' },
              properties: {
                type: 'object',
                description: 'Property values at this keyframe',
                additionalProperties: true,
              },
              easing: {
                type: 'string',
                enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'],
              },
            },
            required: ['time', 'properties'],
          },
          description: 'Array of keyframes',
        },
        duration: {
          type: 'number',
          description: 'Total animation duration in seconds',
        },
        loop: {
          type: 'boolean',
          description: 'Whether to loop the animation',
        },
      },
      required: ['itemId', 'keyframes'],
    },
  },

  {
    name: 'pinepaper_play_timeline',
    description: `Control keyframe animation playback.

USE WHEN:
- Starting/stopping timeline playback
- Seeking to specific time
- Controlling animation state`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'stop', 'seek'],
          description: 'Playback action',
        },
        duration: {
          type: 'number',
          description: 'Duration for play action',
        },
        loop: {
          type: 'boolean',
          description: 'Whether to loop',
        },
        time: {
          type: 'number',
          description: 'Time to seek to (for seek action)',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // GENERATOR TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_execute_generator',
    description: `Execute a background generator to create procedural patterns.

USE WHEN:
- "add a sunburst background"
- "create wave pattern"
- "grid background"
- "circuit board pattern"
- Creating dynamic procedural backgrounds

GENERATORS:
- drawSunburst: Radial rays from center (rayCount, colors, bgColor)
- drawSunsetScene: Animated sunset with clouds (sunColor, skyColors, cloudCount)
- drawGrid: Lines, dots, or squares (gridType, spacing, lineColor)
- drawStackedCircles: Overlapping circles (count, colors, distribution)
- drawCircuit: Tech circuit board (lineColor, nodeColor, density)
- drawWaves: Layered wave pattern (waveCount, colors, amplitude)
- drawPattern: Geometric shapes in orbit`,
    inputSchema: {
      type: 'object',
      properties: {
        generatorName: {
          type: 'string',
          enum: ['drawSunburst', 'drawSunsetScene', 'drawGrid', 'drawStackedCircles', 'drawCircuit', 'drawWaves', 'drawPattern'],
          description: 'Generator name',
        },
        params: {
          type: 'object',
          description: 'Generator-specific parameters',
          additionalProperties: true,
        },
      },
      required: ['generatorName'],
    },
  },

  {
    name: 'pinepaper_list_generators',
    description: `Get a list of all available background generators with their parameters.

USE WHEN:
- User asks "what backgrounds are available?"
- Need to show generator options
- Discovering generator capabilities`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // EFFECT TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_apply_effect',
    description: `Apply a visual effect to an item.

USE WHEN:
- Adding sparkle/glitter effects
- Creating burst/explosion effects
- Enhancing visual impact

EFFECTS:
- sparkle: Glitter/sparkle particles (color, speed, size)
- blast: Explosion burst effect (color, radius, count)`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item' },
        effectType: {
          type: 'string',
          enum: ['sparkle', 'blast'],
          description: 'Type of effect',
        },
        params: {
          type: 'object',
          description: 'Effect parameters',
          additionalProperties: true,
        },
      },
      required: ['itemId', 'effectType'],
    },
  },

  // ---------------------------------------------------------------------------
  // QUERY TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_get_items',
    description: `Get all or filtered items from the canvas.

USE WHEN:
- Listing what's on the canvas
- Finding items by type
- Checking animated items
- Scene inspection`,
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['text', 'circle', 'star', 'rectangle', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc'],
              description: 'Filter by item type',
            },
            source: {
              type: 'string',
              enum: ['user', 'generator', 'import'],
              description: 'Filter by item source',
            },
            hasAnimation: {
              type: 'boolean',
              description: 'Filter by animation status',
            },
            hasRelation: {
              type: 'boolean',
              description: 'Filter by relation status',
            },
          },
        },
      },
    },
  },

  {
    name: 'pinepaper_get_relation_stats',
    description: `Get statistics about active relations in the scene.

USE WHEN:
- Debugging relation system
- Understanding scene complexity
- Analytics and reporting`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // CANVAS TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_set_background_color',
    description: `Set the canvas background color.

USE WHEN:
- Changing scene background
- Setting up canvas before adding items`,
    inputSchema: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'Background color (hex, rgb, or named)',
        },
      },
      required: ['color'],
    },
  },

  {
    name: 'pinepaper_set_canvas_size',
    description: `Change the canvas dimensions.

IMPORTANT: Call this BEFORE creating items if you need a specific canvas size. The default canvas is 800x600 which may be too small for complex designs.

USE WHEN:
- Starting a new design - SET SIZE FIRST before adding items
- Setting up for specific format (Instagram, YouTube, etc.)
- Custom canvas size requirements
- Design elements extend beyond current canvas bounds

COMMON PRESETS:
- instagram-square: 1080x1080
- instagram-story: 1080x1920
- youtube-thumbnail: 1280x720
- twitter-post: 1200x675
- hd-landscape: 1920x1080
- hd-portrait: 1080x1920

For wedding invitations, event cards, or detailed designs, use at least 1080x1080 or larger.`,
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Canvas width in pixels' },
        height: { type: 'number', description: 'Canvas height in pixels' },
        preset: {
          type: 'string',
          description: 'Optional preset name',
        },
      },
      required: ['width', 'height'],
    },
  },

  {
    name: 'pinepaper_get_canvas_size',
    description: `Get the current canvas dimensions.

USE WHEN:
- Need to know current canvas size before positioning items
- Checking if canvas needs to be resized
- Calculating positions relative to canvas bounds`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_clear_canvas',
    description: `Clear all items from the canvas, removing everything including any welcome template items.

USE WHEN:
- User wants to start fresh with an empty canvas
- Need to remove all existing items before creating new ones
- Clearing the welcome template that appears for first-time visitors
- User says "clear everything", "start over", "reset canvas", "remove all items"

IMPORTANT NOTES:
- This removes ALL items from the canvas permanently
- The welcome template (shown to first-time visitors) will be cleared
- After clearing, use pinepaper_get_items to verify the canvas is empty
- If items persist after clearing, try pinepaper_refresh_page instead`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_refresh_page',
    description: `Refresh the PinePaper Studio page in the browser. This is the most reliable way to get a completely clean canvas.

USE WHEN:
- pinepaper_clear_canvas didn't fully remove all items
- Need a guaranteed clean slate
- Want to remove the welcome template completely
- Troubleshooting issues with the canvas state
- User explicitly asks to "refresh" or "reload"

IMPORTANT NOTES:
- This reloads the entire page, which resets everything
- The welcome template will NOT appear after refresh (only shows for first-time visitors)
- After refresh, the canvas will be completely empty
- All unsaved work will be lost
- You may need to wait a moment after refresh before executing other commands`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // EXPORT TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_export_svg',
    description: `Export the scene as animated SVG.

USE WHEN:
- Saving work as SVG file
- Generating shareable graphics
- Final export`,
    inputSchema: {
      type: 'object',
      properties: {
        animated: {
          type: 'boolean',
          description: 'Include CSS animations (default: true)',
        },
      },
    },
  },

  {
    name: 'pinepaper_export_training_data',
    description: `Export relation data as training pairs for LLM fine-tuning. This generates instruction/code pairs from the current scene's relations.

USE WHEN:
- Generating training data for fine-tuning
- Creating examples from current scene
- Building custom animation model training sets

OUTPUT FORMAT:
- json: Array of {instruction, code, relation, params}
- jsonl: JSONL format with messages array for chat fine-tuning`,
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['json', 'jsonl'],
          description: 'Output format (default: json)',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include relation metadata (default: true)',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // BROWSER CONTROL TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_browser_connect',
    description: `Connect to PinePaper Studio Editor in a browser. This launches a browser window and navigates to the PinePaper Editor.

USE WHEN:
- Starting a new PinePaper session
- Need to execute commands in the actual application
- User wants to see changes live in the browser

IMPORTANT: Call this FIRST before using any other pinepaper tools. Without connecting, tools only generate code but don't execute it.

The browser will open and navigate to https://pinepaper.studio/editor where the code console and JavaScript API are available.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Custom PinePaper Studio URL (default: https://pinepaper.studio/editor)',
        },
        headless: {
          type: 'boolean',
          description: 'Run browser in headless mode - no visible window (default: false)',
        },
      },
    },
  },

  {
    name: 'pinepaper_browser_disconnect',
    description: `Disconnect from the browser and close PinePaper Studio.

USE WHEN:
- Done working with PinePaper
- Need to clean up browser resources
- Switching to a different project`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_browser_screenshot',
    description: `Take a screenshot of the current PinePaper canvas.

USE WHEN:
- User wants to see the current state
- Verifying that changes were applied correctly
- Debugging visual issues

Returns a base64-encoded PNG image of the canvas.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_browser_status',
    description: `Check the current browser connection status.

USE WHEN:
- Need to verify if connected to PinePaper
- Debugging connection issues
- Before executing commands`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Get a tool definition by name
 */
export function getToolByName(name: string): Tool | undefined {
  return PINEPAPER_TOOLS.find((t) => t.name === name);
}

/**
 * Get all tool names
 */
export function getToolNames(): string[] {
  return PINEPAPER_TOOLS.map((t) => t.name);
}

/**
 * Get tools with localized descriptions from i18n manager
 * Tool descriptions remain in English for AI, but names can be localized for UI
 */
export function getLocalizedTools(i18n: I18nManager): Tool[] {
  return PINEPAPER_TOOLS.map((tool) => ({
    ...tool,
    // Tool descriptions intentionally kept in English for AI understanding
    // The i18n manager provides translated tool names for UI purposes
    description: i18n.getToolDescription(tool.name) || tool.description,
  }));
}
