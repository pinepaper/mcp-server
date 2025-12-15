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
// PLANNING GUIDE FOR AI AGENTS
// =============================================================================
/*
📋 DECISION TREE: Which Tool Should I Use?

1. USER WANTS TO ADD GRAPHICS TO CANVAS:
   ├─ Simple shapes (circle, star, rectangle, text)
   │  └─> pinepaper_create_item
   ├─ Multiple similar items (grid, batch)
   │  ├─ Positioned in a grid → pinepaper_create_grid
   │  └─ Custom positions → pinepaper_batch_create
   ├─ Complex illustrations (witch, cat, person)
   │  ├─ Search for pre-made asset → pinepaper_search_assets
   │  ├─ Import found asset → pinepaper_import_asset
   │  └─ Import from URL → pinepaper_import_svg
   ├─ Glossy 3D sphere
   │  └─> pinepaper_create_glossy_sphere
   └─ Diagonal stripes pattern
      └─> pinepaper_create_diagonal_stripes

2. USER WANTS ANIMATION/MOVEMENT:
   ├─ Simple looping animation (pulse, spin, bounce)
   │  └─> pinepaper_animate
   ├─ Behavior-based (orbit, follow, attach)
   │  └─> pinepaper_add_relation
   ├─ Timed keyframe animation
   │  └─> pinepaper_keyframe_animate
   └─ Control playback
      └─> pinepaper_play_timeline

3. USER WANTS BACKGROUND/DECORATIONS:
   ├─ Solid color background
   │  └─> pinepaper_set_background_color
   ├─ Procedural patterns (sunburst, waves, grid, circuit)
   │  └─> pinepaper_execute_generator
   └─ Particle effects (sparkle, blast)
      └─> pinepaper_apply_effect

4. USER WANTS TO MODIFY EXISTING ITEMS:
   ├─ Single item change → pinepaper_modify_item
   ├─ Multiple items at once → pinepaper_batch_modify
   └─ Delete items → pinepaper_delete_item

5. USER WANTS TO EXPORT:
   ├─ Animated SVG → pinepaper_export_svg
   ├─ Training data (LLM fine-tuning) → pinepaper_export_training_data
   └─ Screenshot → pinepaper_browser_screenshot

🎯 WORKFLOW PLANNING:

BEFORE STARTING ANY SCENE:
1. Check if canvas has welcome template → Call pinepaper_get_items
2. If items exist and user wants fresh start → Call pinepaper_clear_canvas
3. Plan your approach:
   - Complex character? → Search assets first (pinepaper_search_assets)
   - Many similar items? → Use batch operations or grid
   - Background needed? → Set background color or generator early

PERFORMANCE OPTIMIZATION:
1. Batch operations are ~10x faster:
   - Creating 10 items: pinepaper_batch_create (300ms) vs 10x pinepaper_create_item (1450ms)
   - Use pinepaper_create_grid for grid layouts (even faster)
2. Screenshot mode affects speed:
   - mode='on_request': Fast, screenshots only when explicitly requested
   - mode='always': Slower, captures after every operation
3. Query performance metrics to optimize:
   - Call pinepaper_get_performance_metrics after workflow
   - Identify bottlenecks and adjust approach

COMMON PATTERNS:

Pattern: Solar System
1. pinepaper_clear_canvas
2. pinepaper_set_background_color (black)
3. pinepaper_create_item (sun - yellow circle, center)
4. pinepaper_create_item (earth - blue circle)
5. pinepaper_create_item (moon - gray circle)
6. pinepaper_add_relation (earth orbits sun)
7. pinepaper_add_relation (moon orbits earth)
8. pinepaper_browser_screenshot

Pattern: Animated Logo
1. pinepaper_clear_canvas
2. pinepaper_execute_generator (sunburst background)
3. pinepaper_create_item (text - brand name)
4. pinepaper_animate (pulse animation)
5. pinepaper_apply_effect (sparkle)
6. pinepaper_export_svg

Pattern: Icon Search and Import
1. User: "Add a rocket icon"
2. pinepaper_search_assets (query: "rocket")
3. Review results, pick best match
4. pinepaper_import_asset (assetId from results)
5. pinepaper_modify_item (adjust size/position if needed)

Pattern: Grid of Items
1. pinepaper_create_grid (rows: 5, cols: 5, spacing: 80)
   → Creates 25 items instantly in grid layout
2. pinepaper_batch_modify (change colors/properties of all)

⚠️ COMMON MISTAKES TO AVOID:

1. DON'T take screenshots after every operation
   - Trust API success responses
   - Take ONE screenshot at the end

2. DON'T draw complex characters with paths
   - "Draw a witch" = 20+ path operations (slow, poor results)
   - Use pinepaper_search_assets instead

3. DON'T forget to save itemIds
   - Create operations return itemIds
   - You need these for relations, modifications, deletions

4. DON'T use individual creates for many items
   - 10+ similar items? Use pinepaper_batch_create or pinepaper_create_grid

5. DON'T assume canvas is empty
   - Always check with pinepaper_get_items first
   - Clear welcome template with pinepaper_clear_canvas if needed

📊 PERFORMANCE BASELINES:
- pinepaper_create_item: ~145ms
- pinepaper_batch_create (10 items): ~298ms (~30ms per item)
- pinepaper_create_grid (25 items): ~350ms (~14ms per item)
- pinepaper_add_relation: ~120ms
- pinepaper_modify_item: ~100ms
- pinepaper_browser_screenshot: ~200ms (only in 'always' mode)

Use pinepaper_get_performance_metrics to analyze your actual workflow performance.
*/

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
- DO NOT take screenshots after every create operation. Trust the API response - if it returns success, the item was created. Take ONE screenshot at the end to verify the final result.

⚠️ COMPLEX CHARACTERS/ILLUSTRATIONS:
For requests like "draw a witch", "draw a cat face", "draw a person", or any detailed characters:
- These are VERY time-consuming to draw with paths (10-20+ operations per character)
- Use pinepaper_import_svg instead - import pre-made SVG graphics
- Or compose from simple shapes (circle for head, triangle for hat, etc.)
- DO NOT attempt pixel-level character drawing with paths

ITEM TYPES:
- text: Text content with font styling (properties: content, fontSize, color, fontFamily)
- circle: Circular shape (properties: radius, color, strokeColor, strokeWidth)
- star: Star shape (properties: radius1, radius2, points, color)
- rectangle: Rectangle (properties: width, height, color, cornerRadius)
- triangle: Triangular shape (properties: color)
- polygon: Regular polygon with N sides (properties: sides, radius, color)
- ellipse: Oval shape (properties: color)
- path: Custom path with segments or SVG data (properties: segments, pathData, strokeColor, fillColor, closed, smooth)
- line: Line between two points (properties: from, to, strokeColor, strokeWidth)
- arc: Curved arc through three points (properties: from, through, to, strokeColor)

PATH FOR CUSTOM SHAPES:
Use itemType: "path" with either:
- segments: Array of [x,y] points for polygons, e.g. [[100,100], [200,50], [300,100]]
- pathData: SVG path string for curves, e.g. "M 100 100 C 150 50, 250 50, 300 100 Z"

ADVANCED STYLING (NEW):
All shapes support these additional properties:
- Gradients: color can be an object: {type: "linear"|"radial", stops: [{color: "#fff", offset: 0}, {color: "#000", offset: 1}], origin: [x,y], destination: [x,y]}
- Shadows: shadowColor, shadowBlur (pixels), shadowOffset: [x, y]
- Blend modes: blendMode: "multiply"|"screen"|"overlay"|"darken"|"lighten"|etc.
- Opacity: opacity (0-1)

EXAMPLES:
- "Create red text saying HELLO" → itemType: "text", properties: {content: "HELLO", color: "#ef4444", fontSize: 48}
- "Add a blue circle" → itemType: "circle", properties: {radius: 50, color: "#3b82f6"}
- "Create a 5-pointed gold star" → itemType: "star", properties: {radius1: 60, radius2: 30, points: 5, color: "#fbbf24"}
- "Draw a heart" → itemType: "path", properties: {pathData: "M 300 350 C 300 300, 250 250, 200 250 C 150 250, 100 300, 100 350 C 100 450, 300 550, 300 550 C 300 550, 500 450, 500 350 C 500 300, 450 250, 400 250 C 350 250, 300 300, 300 350 Z", fillColor: "#ef4444"}
- "Circle with radial gradient" → itemType: "circle", properties: {radius: 50, color: {type: "radial", stops: [{color: "#ff6b6b", offset: 0}, {color: "#c0392b", offset: 1}]}}
- "Rectangle with shadow" → itemType: "rectangle", properties: {width: 100, height: 50, color: "#3b82f6", shadowColor: "rgba(0,0,0,0.5)", shadowBlur: 10, shadowOffset: [5, 5]}

WORKFLOW TIP:
After creating items, use pinepaper_add_relation to animate them (e.g., orbits, follows, attached_to).
For glossy 3D spheres, use pinepaper_create_glossy_sphere instead. For diagonal stripes, use pinepaper_create_diagonal_stripes.`,
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
- Adding/changing gradients, shadows, or blend modes

MODIFIABLE PROPERTIES:
- position: {x, y} or separate x, y
- color/fillColor: Fill color (solid string OR gradient object)
- strokeColor: Outline color (solid string OR gradient object)
- strokeWidth: Outline thickness
- fontSize: Text size
- content: Text content
- opacity: Transparency (0-1)
- rotation: Rotation in degrees
- scale: Size multiplier
- shadowColor: Shadow color
- shadowBlur: Shadow blur radius
- shadowOffset: Shadow offset [x, y]
- blendMode: Blend mode (normal, multiply, screen, overlay, etc.)

GRADIENT OBJECT FORMAT:
{type: "linear"|"radial", stops: [{color: "#fff", offset: 0}, {color: "#000", offset: 1}], origin: [x,y], destination: [x,y]}`,
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
  // HIGH-LEVEL DESIGN TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_glossy_sphere',
    description: `Create a 3D-looking glossy sphere with realistic lighting effects. This is a HIGH-LEVEL tool that creates a complete glossy sphere with radial gradient, specular highlights, and optional shadow - all in one operation.

USE WHEN:
- User wants a "3D sphere", "glossy ball", "shiny orb"
- Creating realistic looking spheres/balls
- Need a sphere with lighting effects
- Making glass-like or metallic spheres

DO NOT USE for flat circles - use pinepaper_create_item with itemType: "circle" instead.

PARAMETERS:
- position: Center point of the sphere {x, y}
- radius: Sphere radius in pixels
- baseColor: Main color of the sphere (e.g., "#F97316" for orange)
- lightDirection: Where the light comes from (top-left, top-right, top, left, right, bottom-left, bottom-right, bottom)
- glossiness: Shininess level 0-1 (default 0.7)
- castShadow: Whether to show shadow underneath (default true)
- shadowIntensity: Shadow darkness 0-1 (default 0.3)

EXAMPLES:
- "Orange glossy sphere" → baseColor: "#F97316", radius: 60
- "Purple shiny ball with strong highlight" → baseColor: "#7C3AED", glossiness: 0.9
- "Matte red sphere" → baseColor: "#DC2626", glossiness: 0.3
- "Glass-like sphere" → baseColor: "#60A5FA", glossiness: 1.0, opacity via modify later`,
    inputSchema: {
      type: 'object',
      properties: {
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (default: 400)' },
            y: { type: 'number', description: 'Y coordinate (default: 300)' },
          },
          description: 'Center position of the sphere',
        },
        radius: {
          type: 'number',
          description: 'Sphere radius in pixels',
        },
        baseColor: {
          type: 'string',
          description: 'Main sphere color (hex, rgb, or named color)',
        },
        lightDirection: {
          type: 'string',
          enum: ['top-left', 'top-right', 'top', 'left', 'right', 'bottom-left', 'bottom-right', 'bottom'],
          description: 'Direction of light source (default: top-left)',
        },
        glossiness: {
          type: 'number',
          description: 'Shininess level 0-1 (default: 0.7)',
        },
        castShadow: {
          type: 'boolean',
          description: 'Show shadow underneath (default: true)',
        },
        shadowIntensity: {
          type: 'number',
          description: 'Shadow darkness 0-1 (default: 0.3)',
        },
      },
      required: ['radius', 'baseColor'],
    },
  },

  {
    name: 'pinepaper_create_diagonal_stripes',
    description: `Create a diagonal stripe pattern. This is a HIGH-LEVEL tool that creates multiple stripes at an angle with automatic clipping to a rectangular area.

USE WHEN:
- User wants "diagonal stripes", "angled lines", "striped background"
- Creating candy-cane or barber-pole style patterns
- Making geometric stripe designs
- Need alternating color bands at an angle

PARAMETERS:
- position: Center point of the stripe area {x, y}
- width: Total width of the stripe area
- height: Total height of the stripe area
- stripeWidth: Width of each stripe (default: 50)
- colors: Array of colors to alternate (minimum 2), e.g., ["#F97316", "#7C3AED"]
- angle: Rotation angle in degrees (default: -45, negative = top-right to bottom-left)
- gap: Space between stripes (default: 0)

EXAMPLES:
- "Orange and purple diagonal stripes" → colors: ["#F97316", "#7C3AED"], angle: -45
- "Candy cane stripes" → colors: ["#DC2626", "#FFFFFF"], stripeWidth: 30, angle: -45
- "Three-color stripes" → colors: ["#3B82F6", "#10B981", "#F59E0B"], stripeWidth: 40
- "Wide horizontal stripes" → colors: ["#000000", "#FFFFFF"], angle: 0, stripeWidth: 80`,
    inputSchema: {
      type: 'object',
      properties: {
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (default: 400)' },
            y: { type: 'number', description: 'Y coordinate (default: 300)' },
          },
          description: 'Center position of the stripe area',
        },
        width: {
          type: 'number',
          description: 'Total width of the stripe area',
        },
        height: {
          type: 'number',
          description: 'Total height of the stripe area',
        },
        stripeWidth: {
          type: 'number',
          description: 'Width of each stripe (default: 50)',
        },
        colors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of colors to alternate between (minimum 2)',
        },
        angle: {
          type: 'number',
          description: 'Rotation angle in degrees (default: -45)',
        },
        gap: {
          type: 'number',
          description: 'Gap between stripes in pixels (default: 0)',
        },
      },
      required: ['width', 'height', 'colors'],
    },
  },

  {
    name: 'pinepaper_create_scene',
    description: `Create a complete scene with multiple items, relations, and animations in a single operation. This is the MOST EFFICIENT way to create complex animated scenes.

USE WHEN:
- Creating a solar system, bouncing balls, or any multi-item animated scene
- User describes a scene with multiple related elements
- Performance is important (reduces 4+ tool calls to 1)
- Setting up multiple items that will interact with each other

ADVANTAGES:
- 4-8x faster than calling individual tools
- Single undo step for entire scene
- Automatic name-to-ID mapping for relations
- Cleaner, more atomic scene creation

HOW IT WORKS:
1. Define items with "name" references (e.g., "sun", "earth", "moon")
2. Define relations using those names (e.g., source: "earth", target: "sun")
3. Define animations using names (e.g., target: "sun", type: "pulse")
4. The server creates all items, then establishes relations and animations

EXAMPLE - Solar System:
{
  "backgroundColor": "#0a0a0a",
  "items": [
    { "name": "sun", "itemType": "circle", "position": {"x": 400, "y": 300}, "properties": {"radius": 50, "color": "#fbbf24"} },
    { "name": "earth", "itemType": "circle", "position": {"x": 550, "y": 300}, "properties": {"radius": 20, "color": "#3b82f6"} },
    { "name": "moon", "itemType": "circle", "position": {"x": 590, "y": 300}, "properties": {"radius": 8, "color": "#9ca3af"} }
  ],
  "relations": [
    { "source": "earth", "target": "sun", "type": "orbits", "params": {"radius": 150, "speed": 0.5} },
    { "source": "moon", "target": "earth", "type": "orbits", "params": {"radius": 40, "speed": 1.5} }
  ],
  "animations": [
    { "target": "sun", "type": "pulse", "speed": 0.3 }
  ]
}

EXAMPLE - Bouncing Balls:
{
  "backgroundColor": "#1e293b",
  "items": [
    { "name": "ball1", "itemType": "circle", "position": {"x": 200, "y": 300}, "properties": {"radius": 30, "color": "#ef4444"} },
    { "name": "ball2", "itemType": "circle", "position": {"x": 400, "y": 300}, "properties": {"radius": 30, "color": "#22c55e"} },
    { "name": "ball3", "itemType": "circle", "position": {"x": 600, "y": 300}, "properties": {"radius": 30, "color": "#3b82f6"} }
  ],
  "animations": [
    { "target": "ball1", "type": "bounce", "speed": 1.0 },
    { "target": "ball2", "type": "bounce", "speed": 0.8 },
    { "target": "ball3", "type": "bounce", "speed": 1.2 }
  ]
}

SUPPORTED ITEM TYPES: text, circle, star, rectangle, triangle, polygon, ellipse, path, line, arc
SUPPORTED RELATIONS: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to
SUPPORTED ANIMATIONS: pulse, rotate, bounce, fade, wobble, slide, typewriter`,
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Reference name for this item (used in relations/animations)',
              },
              itemType: {
                type: 'string',
                enum: ['text', 'circle', 'star', 'rectangle', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc'],
                description: 'Type of item to create',
              },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
                description: 'Position on canvas',
              },
              properties: {
                type: 'object',
                description: 'Item-specific properties (color, radius, content, etc.)',
                additionalProperties: true,
              },
            },
            required: ['name', 'itemType'],
          },
          description: 'Array of items to create with reference names',
        },
        relations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string', description: 'Name of source item' },
              target: { type: 'string', description: 'Name of target item' },
              type: {
                type: 'string',
                enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to'],
              },
              params: {
                type: 'object',
                description: 'Relation parameters (radius, speed, distance, etc.)',
                additionalProperties: true,
              },
            },
            required: ['source', 'target', 'type'],
          },
          description: 'Relations between items',
        },
        animations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Name of item to animate' },
              type: {
                type: 'string',
                enum: ['pulse', 'rotate', 'bounce', 'fade', 'wobble', 'slide', 'typewriter'],
              },
              speed: { type: 'number', description: 'Animation speed (default: 1.0)' },
              params: {
                type: 'object',
                description: 'Animation-specific parameters',
                additionalProperties: true,
              },
            },
            required: ['target', 'type'],
          },
          description: 'Animations to apply to items',
        },
        backgroundColor: {
          type: 'string',
          description: 'Background color for the scene (hex, rgb, or named)',
        },
        backgroundGenerator: {
          type: 'string',
          description: 'Name of generator to use for background (e.g., "drawSunburst")',
        },
        clearFirst: {
          type: 'boolean',
          description: 'Clear canvas before creating scene (default: true)',
        },
      },
      required: ['items'],
    },
  },

  // ---------------------------------------------------------------------------
  // BATCH OPERATION TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_batch_create',
    description: `Create multiple items at once with a single history save. This is more efficient than creating items one by one.

USE WHEN:
- Creating many items at once (stars, circles, grid elements, etc.)
- Setting up a scene with multiple shapes
- Performance-critical batch creation

ADVANTAGES:
- Single undo step for all items
- Better performance (one history save)
- Cleaner code for related items

EXAMPLE:
items: [
  { type: "circle", params: { x: 100, y: 100, radius: 30, color: "#ef4444" } },
  { type: "circle", params: { x: 200, y: 100, radius: 30, color: "#3b82f6" } },
  { type: "text", params: { content: "Hello", x: 150, y: 200, fontSize: 24 } }
]`,
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['text', 'circle', 'star', 'rectangle', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc'],
                description: 'Type of item to create',
              },
              params: {
                type: 'object',
                description: 'Item parameters including position (x, y) and properties',
                additionalProperties: true,
              },
            },
            required: ['type', 'params'],
          },
          description: 'Array of items to create',
        },
      },
      required: ['items'],
    },
  },

  {
    name: 'pinepaper_batch_modify',
    description: `Modify multiple items at once with a single history save. This is more efficient than modifying items one by one.

USE WHEN:
- Changing properties of many items (e.g., changing all colors, resizing multiple items)
- Applying the same or different changes to multiple items
- Performance-critical batch updates

ADVANTAGES:
- Single undo step for all modifications
- Better performance (one history save)
- Atomic operation (all or nothing)

EXAMPLE:
modifications: [
  { itemId: "item_1", params: { color: "#ef4444", scale: 1.5 } },
  { itemId: "item_2", params: { x: 200, y: 300 } },
  { itemId: "item_3", params: { rotation: 45, opacity: 0.8 } }
]`,
    inputSchema: {
      type: 'object',
      properties: {
        modifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              itemId: {
                type: 'string',
                description: 'Registry ID of the item to modify',
              },
              params: {
                type: 'object',
                description: 'Properties to update on this item',
                additionalProperties: true,
              },
            },
            required: ['itemId', 'params'],
          },
          description: 'Array of modifications to apply',
        },
      },
      required: ['modifications'],
    },
  },

  {
    name: 'pinepaper_create_grid',
    description: `Create a grid of lines on the canvas. This is a convenience method that handles all coordinate calculations automatically.

USE WHEN:
- User wants a grid background
- Creating graph paper style layouts
- Need evenly spaced lines across canvas

PARAMETERS:
- cols: Number of columns (default: 10)
- rows: Number of rows (default: 10)
- strokeColor: Line color (default: '#888888')
- strokeWidth: Line thickness (default: 1)
- animated: Enable wave animation (default: false)
- waveSpeed: Animation speed if animated (default: 2)
- waveAmplitude: Wave intensity in pixels (default: 2)

EXAMPLE:
{ cols: 30, rows: 30, strokeColor: "#444444", strokeWidth: 1, animated: true }`,
    inputSchema: {
      type: 'object',
      properties: {
        cols: {
          type: 'number',
          description: 'Number of columns (default: 10)',
        },
        rows: {
          type: 'number',
          description: 'Number of rows (default: 10)',
        },
        strokeColor: {
          type: 'string',
          description: 'Line color (default: #888888)',
        },
        strokeWidth: {
          type: 'number',
          description: 'Line thickness (default: 1)',
        },
        animated: {
          type: 'boolean',
          description: 'Enable wave animation (default: false)',
        },
        waveSpeed: {
          type: 'number',
          description: 'Animation speed (default: 2)',
        },
        waveAmplitude: {
          type: 'number',
          description: 'Wave intensity in pixels (default: 2)',
        },
      },
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
  // IMPORT TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_import_svg',
    description: `Import an SVG string or SVG from URL onto the canvas. Returns an itemId for the imported graphic.

USE WHEN:
- User requests complex illustrations (characters, icons, detailed graphics)
- Importing pre-made SVG assets
- Adding logos or vector graphics
- User mentions SVG files or vector graphics

⚠️ RECOMMENDED FOR COMPLEX CHARACTERS:
Instead of drawing "a witch" or "a cat" with many path operations, use SVG import:
1. Describe what you need and use a simple placeholder SVG
2. Or import from a URL if the user provides one

EXAMPLES:
- Import a simple star SVG: svgString: '<svg viewBox="0 0 100 100"><polygon points="50,5 61,40 98,40 68,62 79,96 50,75 21,96 32,62 2,40 39,40" fill="#fbbf24"/></svg>'
- Import from URL: url: "https://example.com/icon.svg"

POSITIONING:
- Use position to place the imported SVG at specific coordinates
- Use scale to resize (1.0 = original size)

Returns the itemId of the imported SVG group, which can be used with pinepaper_add_relation for animation.`,
    inputSchema: {
      type: 'object',
      properties: {
        svgString: {
          type: 'string',
          description: 'SVG markup string to import',
        },
        url: {
          type: 'string',
          description: 'URL to fetch SVG from (alternative to svgString)',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
          },
          description: 'Position to place the imported SVG',
        },
        scale: {
          type: 'number',
          description: 'Scale factor (1.0 = original size)',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // FILTER TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_add_filter',
    description: `Add a visual filter effect to the canvas. Filters are scene-wide effects that can be stacked.

USE WHEN:
- User wants visual effects like blur, grayscale, vintage look
- Creating mood or atmosphere (cinematic, dreamy, noir)
- Post-processing the entire scene
- User says "make it look vintage", "add blur", "black and white"

AVAILABLE FILTERS:
- grayscale: Convert to black and white (params: intensity 0-1)
- sepia: Warm vintage brownish tone (params: intensity 0-1)
- blur: Gaussian blur effect (params: radius 0-20)
- brightness: Adjust brightness (params: value -100 to 100)
- contrast: Adjust contrast (params: value -100 to 100)
- saturate: Adjust color saturation (params: value -100 to 100)
- invert: Invert colors (params: intensity 0-1)
- noise: Add film grain (params: intensity 0-100, monochrome: true/false)
- vignette: Darken edges (params: intensity 0-1, radius 0-1)
- vintage: Preset combining sepia, vignette, noise
- colorOverlay: Add color tint (params: color, intensity, blendMode)
- sharpen: Increase sharpness (params: intensity 0-100)
- posterize: Reduce color levels (params: levels 2-32)

EXAMPLES:
- "Make it black and white" → filterType: "grayscale"
- "Add vintage look" → filterType: "vintage", params: {intensity: 0.8}
- "Blur the background" → filterType: "blur", params: {radius: 5}
- "Increase contrast" → filterType: "contrast", params: {value: 30}

Filters can be stacked - call multiple times to combine effects.`,
    inputSchema: {
      type: 'object',
      properties: {
        filterType: {
          type: 'string',
          enum: ['grayscale', 'sepia', 'blur', 'brightness', 'contrast', 'saturate', 'invert', 'noise', 'vignette', 'vintage', 'colorOverlay', 'sharpen', 'posterize'],
          description: 'Type of filter to apply',
        },
        params: {
          type: 'object',
          description: 'Filter-specific parameters',
          additionalProperties: true,
        },
      },
      required: ['filterType'],
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
- User explicitly asks to "see" or "show" the canvas
- Final verification after completing a creative task
- Debugging visual issues or unexpected behavior
- Verifying animations are running (take 2 screenshots with delay)

⚠️ PERFORMANCE BEST PRACTICE:
Take ONE screenshot per creative task, NOT per operation!
- BAD: Create circle → screenshot → create text → screenshot → add relation → screenshot
- GOOD: Create circle → create text → add relation → screenshot (once at end)

Trust the API responses - if a tool returns success, the operation worked.
Only screenshot when you need visual confirmation of the FINAL result.

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

  // ---------------------------------------------------------------------------
  // PERFORMANCE TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_get_performance_metrics',
    description: `Get execution performance metrics to identify bottlenecks and optimize workflows.

USE WHEN:
- Analyzing tool performance
- Debugging slow operations
- Optimizing complex workflows
- Identifying performance regressions

RETURNS:
- Per-tool timing breakdown (validation, code gen, execution, screenshot)
- Aggregate statistics (avg, p50, p95, p99, min, max)
- Success rates and error counts
- Historical metrics (configurable retention)

METRICS TRACKED:
- Validation: Input parsing and validation time
- Code Generation: Time to generate PinePaper code
- Browser Execution: Time to execute code in browser via Puppeteer
- Screenshot: Time to capture and encode screenshots
- Total: End-to-end execution time

FORMAT OPTIONS:
- 'summary': Human-readable summary with slowest tools first
- 'detailed': Full JSON export of all metrics
- 'csv': CSV format for spreadsheet analysis

FILTER OPTIONS:
- toolName: Filter by specific tool (e.g., 'pinepaper_create_item')
- phase: Filter by execution phase
- since: Unix timestamp - metrics since this time
- limit: Maximum number of results

EXAMPLES:
- Get summary of all metrics: {}
- Get last 50 create_item operations: {toolName: 'pinepaper_create_item', limit: 50}
- Get recent slow operations: {since: <timestamp>, format: 'summary'}
- Export all metrics as CSV: {format: 'csv'}

PERFORMANCE OPTIMIZATION WORKFLOW:
1. Run your workflow normally
2. Call pinepaper_get_performance_metrics with format='summary'
3. Identify slowest operations (sorted by avg duration)
4. Check if batch operations can be used instead
5. Verify screenshot mode is 'on_request' for best performance
6. Re-run and compare metrics

TYPICAL PERFORMANCE BASELINES:
- Validation: 1-5ms (should be very fast)
- Code Generation: 5-20ms (depends on complexity)
- Browser Execution: 30-100ms (depends on operation)
- Screenshot: 100ms (only if mode='always' or explicit request)
- Total (without screenshot): 40-125ms
- Total (with screenshot): 140-225ms

If you see significantly higher numbers, investigate:
- Network latency (browser connection)
- Complex operations that could be batched
- Screenshot mode set to 'always' (change to 'on_request')`,
    inputSchema: {
      type: 'object',
      properties: {
        toolName: {
          type: 'string',
          description: 'Filter by tool name (optional)',
        },
        phase: {
          type: 'string',
          enum: ['validation', 'code_generation', 'browser_execution', 'screenshot', 'total'],
          description: 'Filter by execution phase (optional)',
        },
        since: {
          type: 'number',
          description: 'Unix timestamp - metrics since this time (optional)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 100)',
        },
        format: {
          type: 'string',
          enum: ['summary', 'detailed', 'csv'],
          description: 'Export format (default: summary)',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // ASSET TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_search_assets',
    description: `Search for free SVG assets from open repositories (SVGRepo, OpenClipart, Iconify, FontAwesome).

USE WHEN:
- User wants icons, illustrations, or clipart
- Need specific symbols (arrows, hearts, animals, rocket, etc.)
- Want to avoid manual SVG creation
- Building UI with standard icons
- Need graphics that are too complex to draw with paths

REPOSITORIES:
- SVGRepo: 500,000+ icons, various categories and licenses
- OpenClipart: 150,000+ public domain clipart
- Iconify: 200,000+ icon sets (various licenses)
- Font Awesome: 2,000+ free icons (CC BY 4.0)

WORKFLOW:
1. Search for assets: pinepaper_search_assets(query: "rocket")
2. Review results (you'll see assetIds, previews, licenses)
3. Import chosen asset: pinepaper_import_asset(assetId: "svgrepo_rocket_12345")

IMPORTANT NOTES:
- Always respect license terms (check license field in results)
- CC-BY licenses require attribution (metadata is tracked automatically)
- CC0 (Public Domain) assets have no restrictions
- Search queries work best with simple, specific terms
- Results include preview URLs (for user reference) and download URLs

EXAMPLES:
- "rocket icon" → Returns various rocket SVGs
- "user avatar" → Returns user/profile icons
- "arrow" → Returns arrow symbols in various styles
- "cat" → Returns cat illustrations
- "heart" → Returns heart shapes and icons

PERFORMANCE:
- Search is asynchronous and may take 1-2 seconds
- Results are not cached (fresh search each time)
- Import caches downloaded SVGs for reuse`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search term (e.g., "rocket", "heart", "user icon")',
        },
        repository: {
          type: 'string',
          enum: ['all', 'svgrepo', 'openclipart', 'iconify', 'fontawesome'],
          description: 'Which repository to search (default: all)',
        },
        limit: {
          type: 'number',
          description: 'Max results to return (default: 10, max: 50)',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'pinepaper_import_asset',
    description: `Import an SVG asset from search results or direct URL onto the canvas.

USE WHEN:
- After searching with pinepaper_search_assets, import the chosen asset
- User provides a direct URL to an SVG file
- Need to add pre-made graphics to the scene

WORKFLOW:
1. Search: pinepaper_search_assets(query: "rocket")
2. Choose: Review results, pick one with desired license
3. Import: pinepaper_import_asset(assetId: "svgrepo_rocket_12345", position: {x: 400, y: 300})
4. Modify: Use pinepaper_modify_item to adjust size, color, etc.
5. Animate: Use pinepaper_animate or pinepaper_add_relation for motion

PARAMETERS:
- assetId: From search results (e.g., "svgrepo_12345")
- url: Alternative to assetId - direct URL to SVG
- position: Where to place on canvas (default: center)
- scale: Size multiplier (default: 1.0)
- color: Override color for monochrome icons (optional)

LICENSE TRACKING:
- Asset metadata (including license) is automatically tracked
- CC-BY licenses will have attribution added to canvas metadata
- Public domain (CC0) assets have no attribution requirement
- Check license in search results before importing

CACHING:
- Downloaded SVGs are cached in memory
- Re-importing same asset is instant (uses cache)
- Cache persists for session duration
- No disk storage (memory only)

EXAMPLES:
- Import from search: {assetId: "svgrepo_rocket_001", position: {x: 400, y: 300}, scale: 2.0}
- Import from URL: {url: "https://example.com/icon.svg", position: {x: 500, y: 400}}
- Import with color override: {assetId: "svgrepo_heart_123", position: {x: 400, y: 300}, color: "#ef4444"}

RETURNS:
- itemId: ID of the imported SVG group (use for further modifications)
- metadata: Asset information including license`,
    inputSchema: {
      type: 'object',
      properties: {
        assetId: {
          type: 'string',
          description: 'Asset ID from search results (e.g., "svgrepo_12345")',
        },
        url: {
          type: 'string',
          description: 'Direct URL to SVG (alternative to assetId)',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          description: 'Position on canvas',
        },
        scale: {
          type: 'number',
          description: 'Scale factor (default: 1.0)',
        },
        color: {
          type: 'string',
          description: 'Override color for monochrome icons',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // P5.JS COMPATIBILITY
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_p5_draw',
    description: `Execute p5.js-style drawing code on the PinePaper canvas.

Claude can use familiar p5.js syntax - the code is translated to Paper.js automatically.
This is a SUBSET of p5.js functions optimized for static drawings.

AVAILABLE FUNCTIONS:

Shapes:
- circle(x, y, diameter) - Draw a circle (note: uses diameter, not radius)
- ellipse(x, y, width, [height]) - Draw an ellipse
- rect(x, y, width, height, [cornerRadius]) - Draw a rectangle
- line(x1, y1, x2, y2) - Draw a line between two points
- triangle(x1, y1, x2, y2, x3, y3) - Draw a triangle
- quad(x1, y1, x2, y2, x3, y3, x4, y4) - Draw a quadrilateral
- arc(x, y, width, height, startAngle, stopAngle) - Draw an arc (angles in radians)
- point(x, y) - Draw a single point

Style:
- fill(r, g, b) or fill(gray) or fill('#hex') - Set fill color for subsequent shapes
- noFill() - Disable fill for subsequent shapes
- stroke(r, g, b) or stroke('#hex') - Set stroke color
- noStroke() - Disable stroke
- strokeWeight(weight) - Set stroke width in pixels
- background(r, g, b) or background('#hex') - Set canvas background color

Math:
- random(min, max) or random(max) - Random number in range
- map(value, start1, stop1, start2, stop2) - Re-map a number from one range to another
- constrain(value, min, max) - Limit a value to a range
- dist(x1, y1, x2, y2) - Calculate distance between two points
- lerp(start, stop, amount) - Linear interpolation between two values
- radians(degrees) - Convert degrees to radians
- degrees(radians) - Convert radians to degrees

Canvas Properties:
- width - Canvas width in pixels
- height - Canvas height in pixels

Mode Functions:
- rectMode(CENTER|CORNER) - Set rectangle positioning mode
- ellipseMode(CENTER|CORNER) - Set ellipse positioning mode

Constants:
- PI, TWO_PI, HALF_PI, QUARTER_PI - Math constants
- CENTER, CORNER - Mode constants

NOT SUPPORTED (use native PinePaper tools instead):
- setup()/draw() animation loop - Use pinepaper_animate or pinepaper_add_relation
- noise() - Perlin noise not available
- text() - Use pinepaper_create_item with type: 'text'
- loadImage()/image() - Use pinepaper_import_svg
- push()/pop()/translate()/rotate()/scale() - Use pinepaper_modify_item
- beginShape()/vertex()/endShape() - Use pinepaper_create_item with type: 'path'

USAGE:
- Code runs directly - NO setup() or draw() wrapper needed
- Items created are automatically registered with PinePaper's ItemRegistry
- All items are selectable, animatable, and exportable
- State (fill, stroke) persists between calls within the same code block

EXAMPLE - Random Circles:
\`\`\`
background(30);
noStroke();
for (let i = 0; i < 20; i++) {
  fill(random(255), random(255), random(255));
  circle(random(width), random(height), random(20, 80));
}
\`\`\`

EXAMPLE - Gradient Grid:
\`\`\`
background(20);
noStroke();
const cols = 10;
const rows = 10;
const cellW = width / cols;
const cellH = height / rows;
for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const r = map(i, 0, cols, 50, 255);
    const b = map(j, 0, rows, 50, 255);
    fill(r, 100, b);
    rect(i * cellW, j * cellH, cellW - 2, cellH - 2);
  }
}
\`\`\`

EXAMPLE - Concentric Circles:
\`\`\`
background(240);
noFill();
strokeWeight(2);
const centerX = width / 2;
const centerY = height / 2;
for (let i = 10; i > 0; i--) {
  stroke(map(i, 0, 10, 0, 200), 50, map(i, 0, 10, 200, 50));
  circle(centerX, centerY, i * 50);
}
\`\`\``,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'p5.js-style drawing code to execute',
        },
      },
      required: ['code'],
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
