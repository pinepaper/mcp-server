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
🎮 EXECUTION MODES:

The MCP server supports two execution modes (set via --mode flag or PINEPAPER_EXECUTION_MODE env):

1. PUPPETEER MODE (default):
   - Opens a browser window with PinePaper Studio
   - Executes code automatically - you watch the magic happen
   - Can take screenshots to see results
   - User can take control anytime - click buttons, make manual edits
   - Uses your default browser session (existing cookies/login persist)
   - Best for: Interactive sessions, live demos, when you want visual feedback

2. CODE GENERATION MODE (--mode code):
   - No browser window opened
   - Generates JavaScript code for each tool call
   - User manually copies code and pastes into PinePaper Studio console
   - User has full control over execution timing
   - Best for: Testing code, learning the API, environments where Puppeteer is problematic
   - Helpful for: Debugging, understanding what code is generated, batch operations

When to use which:
- "I want to watch AI create graphics live" → Puppeteer mode
- "I want to test and verify code before running" → Code mode
- "Multiple browser windows keep opening" → Code mode (avoids the issue)
- "I want to learn the PinePaper API" → Code mode (see generated code)

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
    annotations: {
      title: 'Create Item',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Modify Item',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Delete Item',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Create Glossy Sphere',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Create Diagonal Stripes',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Create Scene',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Batch Create Items',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Batch Modify Items',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Create Grid',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Add Relation',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Remove Relation',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Query Relations',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Animate Item',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Keyframe Animation',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Play Timeline',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Execute Generator',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'List Generators',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Apply Effect',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Get Items',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Get Relation Stats',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Set Background Color',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Set Canvas Size',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Get Canvas Size',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Clear Canvas',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Refresh Page',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'Import SVG',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'Add Filter',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Export SVG',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Export Training Data',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Connect to Browser',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
    description: `Connect to PinePaper Studio Editor in a browser (PUPPETEER MODE ONLY).

This launches a browser window and navigates to the PinePaper Editor for live code execution.

USE WHEN:
- Running in Puppeteer mode (default)
- Starting a new PinePaper session
- User wants to see changes live in the browser
- Need automatic code execution

NOT NEEDED WHEN:
- Running in Code Generation mode (--mode code)
- User prefers to copy/paste code manually

IMPORTANT:
- Call this FIRST before using any other pinepaper tools in Puppeteer mode
- Without connecting, tools only generate code but don't execute it
- Uses a fresh Chromium browser session (not your default browser profile)
- User can take control of the browser window at any time to click buttons or make manual edits

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
    annotations: {
      title: 'Disconnect from Browser',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'Take Screenshot',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'Browser Status',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'Get Performance Metrics',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
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
    annotations: {
      title: 'Search Assets',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
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
- Import caches downloaded SVGs for reuse
- When includeSvgContent is true, search takes longer as each SVG must be fetched

SVG CONTENT RETRIEVAL:
- Set includeSvgContent: true to fetch and include actual SVG strings
- Each result will include an 'svgContent' field with the SVG markup
- Useful for AI to display, describe, or analyze the icons before importing
- Increases response time proportionally to the number of results
- Consider using a lower limit when includeSvgContent is true`,
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
        includeSvgContent: {
          type: 'boolean',
          description: 'Include actual SVG content for each result (default: false). When true, fetches and returns the SVG string for each asset.',
        },
      },
      required: ['query'],
    },
  },

  {
    name: 'pinepaper_import_asset',
    annotations: {
      title: 'Import Asset',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
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
    annotations: {
      title: 'p5.js Draw',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Execute p5.js-style drawing code on the PinePaper canvas.

AI assistants can use familiar p5.js syntax - the code is translated to Paper.js automatically.
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

  // ---------------------------------------------------------------------------
  // DIAGRAM TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_diagram_shape',
    annotations: {
      title: 'Create Diagram Shape',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create a diagram shape on the canvas. Diagram shapes are specialized shapes for flowcharts, UML diagrams, network diagrams, and similar technical drawings.

USE WHEN:
- Creating flowcharts, process diagrams, or workflows
- Building UML class diagrams, use case diagrams, or sequence diagrams
- Designing network topology diagrams
- Making organizational charts or decision trees
- Any technical or architectural diagram

SHAPE TYPES:

Flowchart shapes:
- process: Rectangle for process steps (default: 120x60)
- decision: Diamond for yes/no decisions (default: 100x100)
- terminal: Rounded rectangle for start/end (default: 120x40)
- data: Parallelogram for data I/O (default: 120x60)
- document: Wavy-bottom rectangle for documents (default: 100x80)
- database: Cylinder for database/storage (default: 80x100)
- preparation: Hexagon for preparation steps (default: 120x60)

UML shapes:
- uml-class: Class box with name/attributes/methods sections (default: 150x120)
- uml-usecase: Ellipse for use case (default: 140x80)
- uml-actor: Stick figure for actor (default: 60x100)

Network shapes:
- cloud: Cloud shape for cloud services (default: 140x90)
- server: Server rack shape (default: 80x100)

Basic shapes (same as pinepaper_create_item but diagram-optimized):
- rectangle, circle, triangle, star

All shapes:
- Have connection ports for connectors
- Support labels inside the shape
- Can be connected using pinepaper_connect or pinepaper_connect_ports

EXAMPLES:
- Flowchart start: {shapeType: "terminal", label: "Start", position: {x: 400, y: 100}}
- Decision node: {shapeType: "decision", label: "Is valid?", position: {x: 400, y: 200}}
- Database: {shapeType: "database", label: "Users DB", position: {x: 600, y: 200}}
- UML Class: {shapeType: "uml-class", label: "User", width: 180, height: 150}

WORKFLOW TIP:
After creating shapes, use pinepaper_connect to draw connectors between them.
Use pinepaper_auto_layout to automatically arrange shapes in a clean layout.`,
    inputSchema: {
      type: 'object',
      properties: {
        shapeType: {
          type: 'string',
          enum: ['process', 'decision', 'terminal', 'data', 'document', 'database', 'preparation', 'uml-class', 'uml-usecase', 'uml-actor', 'cloud', 'server', 'rectangle', 'circle', 'triangle', 'star'],
          description: 'Type of diagram shape to create',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate (default: 400)' },
            y: { type: 'number', description: 'Y coordinate (default: 300)' },
          },
          description: 'Position on canvas',
        },
        width: {
          type: 'number',
          description: 'Shape width in pixels (uses type-specific default if not specified)',
        },
        height: {
          type: 'number',
          description: 'Shape height in pixels (uses type-specific default if not specified)',
        },
        label: {
          type: 'string',
          description: 'Text label inside the shape',
        },
        style: {
          type: 'object',
          properties: {
            fillColor: { type: 'string', description: 'Fill color' },
            strokeColor: { type: 'string', description: 'Stroke color' },
            strokeWidth: { type: 'number', description: 'Stroke width' },
          },
          description: 'Visual styling options',
        },
      },
      required: ['shapeType'],
    },
  },

  {
    name: 'pinepaper_connect',
    annotations: {
      title: 'Connect Items',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Connect two items with a smart connector. This is the primary way to draw lines/arrows between diagram shapes.

USE WHEN:
- Drawing arrows between flowchart steps
- Connecting UML classes with associations
- Creating network connections between nodes
- Any diagram that needs lines/arrows between elements

CONNECTOR FEATURES:
- Automatic port selection (finds nearest ports)
- Smart routing to avoid overlapping shapes
- Animated "bolt" effect for data flow visualization
- Arrow heads on either or both ends
- Labels on connectors

ROUTING TYPES:
- orthogonal: Right-angle turns only (default, best for flowcharts)
- direct: Straight line between points
- curved: Bezier curve with adjustable curvature

ARROW STYLES:
- classic: Standard filled arrow (default for head)
- stealth: Narrow sharp arrow
- sharp: Simple pointed arrow
- open: Outline arrow (not filled)
- diamond: Diamond shape (for UML aggregation)
- circle: Circle (for UML composition)
- none: No arrowhead (default for tail)

LINE STYLES:
- solid: Continuous line (default)
- dashed: Dashed line (for optional relationships)
- dotted: Dotted line (for dependencies)

ANIMATED BOLT:
Enable boltEnabled: true to show an animated particle traveling along the connector.
Useful for showing data flow, process direction, or network traffic.

EXAMPLES:
- Simple arrow: {sourceItemId: "shape_1", targetItemId: "shape_2"}
- Curved line: {sourceItemId: "a", targetItemId: "b", routing: "curved", curvature: 0.7}
- Dashed dependency: {sourceItemId: "a", targetItemId: "b", lineStyle: "dashed", headStyle: "open"}
- Two-way arrow: {sourceItemId: "a", targetItemId: "b", headStyle: "classic", tailStyle: "classic"}
- Labeled connection: {sourceItemId: "a", targetItemId: "b", label: "1..*"}

RETURNS:
- connectorId: ID of the connector (use for updates/removal)
- sourceItemId, targetItemId: Connected items`,
    inputSchema: {
      type: 'object',
      properties: {
        sourceItemId: {
          type: 'string',
          description: 'Registry ID of the source item (where arrow starts)',
        },
        targetItemId: {
          type: 'string',
          description: 'Registry ID of the target item (where arrow points)',
        },
        routing: {
          type: 'string',
          enum: ['direct', 'orthogonal', 'curved'],
          description: 'Connector routing style (default: orthogonal)',
        },
        lineColor: {
          type: 'string',
          description: 'Line color (default: #4B5563)',
        },
        lineWidth: {
          type: 'number',
          description: 'Line width in pixels (default: 2)',
        },
        lineStyle: {
          type: 'string',
          enum: ['solid', 'dashed', 'dotted'],
          description: 'Line style (default: solid)',
        },
        headStyle: {
          type: 'string',
          enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'],
          description: 'Arrow head style at target (default: classic)',
        },
        tailStyle: {
          type: 'string',
          enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'],
          description: 'Arrow style at source (default: none)',
        },
        label: {
          type: 'string',
          description: 'Text label on the connector',
        },
        curvature: {
          type: 'number',
          description: 'Curve intensity for curved routing (0.1-1.0, default: 0.5)',
        },
        boltEnabled: {
          type: 'boolean',
          description: 'Enable animated bolt effect (default: true)',
        },
        boltColor: {
          type: 'string',
          description: 'Bolt animation color (default: #fbbf24)',
        },
      },
      required: ['sourceItemId', 'targetItemId'],
    },
  },

  {
    name: 'pinepaper_connect_ports',
    annotations: {
      title: 'Connect Specific Ports',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Connect two specific ports on items. Use this when you need precise control over which ports the connector attaches to.

USE WHEN:
- Need connector to attach to specific side of shape
- Creating complex diagrams where automatic port selection isn't ideal
- Building circuit-like diagrams with specific entry/exit points
- Connecting specific input/output ports

PORT POSITIONS:
Standard positions:
- top, bottom, left, right: Center of each edge
- top-left, top-right, bottom-left, bottom-right: Corners
- center: Center of the shape

Line/path specific:
- start: Beginning of path
- end: End of path

EXAMPLES:
- Top to bottom: {sourceItemId: "a", sourcePort: "bottom", targetItemId: "b", targetPort: "top"}
- Left to right: {sourceItemId: "a", sourcePort: "right", targetItemId: "b", targetPort: "left"}
- Corner connection: {sourceItemId: "a", sourcePort: "bottom-right", targetItemId: "b", targetPort: "top-left"}

CONFIG OPTIONS:
Same as pinepaper_connect: routing, lineColor, lineWidth, lineStyle, headStyle, tailStyle, label, curvature, boltEnabled, boltColor`,
    inputSchema: {
      type: 'object',
      properties: {
        sourceItemId: {
          type: 'string',
          description: 'Registry ID of the source item',
        },
        sourcePort: {
          type: 'string',
          enum: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'start', 'end'],
          description: 'Port position on source item',
        },
        targetItemId: {
          type: 'string',
          description: 'Registry ID of the target item',
        },
        targetPort: {
          type: 'string',
          enum: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'start', 'end'],
          description: 'Port position on target item',
        },
        config: {
          type: 'object',
          properties: {
            routing: { type: 'string', enum: ['direct', 'orthogonal', 'curved'] },
            lineColor: { type: 'string' },
            lineWidth: { type: 'number' },
            lineStyle: { type: 'string', enum: ['solid', 'dashed', 'dotted'] },
            headStyle: { type: 'string', enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'] },
            tailStyle: { type: 'string', enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'] },
            label: { type: 'string' },
            curvature: { type: 'number' },
            boltEnabled: { type: 'boolean' },
            boltColor: { type: 'string' },
          },
          description: 'Connector configuration options',
        },
      },
      required: ['sourceItemId', 'sourcePort', 'targetItemId', 'targetPort'],
    },
  },

  {
    name: 'pinepaper_add_ports',
    annotations: {
      title: 'Add Ports to Item',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Add connection ports to an existing item. Ports are anchor points where connectors can attach.

USE WHEN:
- Adding custom port positions to shapes
- Enabling connections on items that don't have ports
- Creating specialized connection points for complex diagrams

PORT TYPES:
- standard: Standard 4 ports (top, bottom, left, right)
- line: 2 ports (start, end) for line-like items
- path: N ports distributed along a path
- custom: User-defined port positions

CUSTOM PORTS:
Define specific ports with position and type:
- position: where on the item (top, bottom, left, right, corners)
- type: input (accept incoming), output (start outgoing), or both

EXAMPLES:
- Standard 4 ports: {itemId: "shape_1", portType: "standard"}
- Line endpoints: {itemId: "line_1", portType: "line"}
- Path with 5 ports: {itemId: "path_1", portType: "path", count: 5}
- Custom ports: {itemId: "shape_1", portType: "custom", ports: [{position: "top", type: "input"}, {position: "bottom", type: "output"}]}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Registry ID of the item to add ports to',
        },
        portType: {
          type: 'string',
          enum: ['standard', 'line', 'path', 'custom'],
          description: 'Type of port configuration (default: standard)',
        },
        ports: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: {
                type: 'string',
                enum: ['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'start', 'end'],
              },
              type: {
                type: 'string',
                enum: ['input', 'output', 'both'],
              },
            },
          },
          description: 'Custom port definitions (for portType: "custom")',
        },
        count: {
          type: 'number',
          description: 'Number of ports for path type',
        },
      },
      required: ['itemId'],
    },
  },

  {
    name: 'pinepaper_auto_layout',
    annotations: {
      title: 'Auto Layout',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Automatically arrange diagram items using a layout algorithm. This reorganizes items for cleaner, more readable diagrams.

USE WHEN:
- Diagram items are messy or overlapping
- Want to create a professional-looking layout automatically
- After adding many items, need to organize them
- Creating hierarchical structures (org charts, trees)

LAYOUT TYPES:

hierarchical:
- Best for: flowcharts, org charts, dependency graphs
- Arranges items in levels from top to bottom (or other directions)
- Respects connector direction for parent-child relationships
- Options: direction (TB/BT/LR/RL), levelSpacing, nodeSpacing

force-directed:
- Best for: network diagrams, relationship graphs
- Uses physics simulation (attraction/repulsion)
- Good for showing clusters and relationships
- Options: iterations, attraction, repulsion

tree:
- Best for: hierarchies, file systems, family trees
- Similar to hierarchical but optimized for tree structures
- Options: direction, levelSpacing, nodeSpacing

radial:
- Best for: mind maps, hub-and-spoke diagrams
- Places items in concentric circles around a center
- Options: centerX, centerY, startRadius, radiusStep

grid:
- Best for: equal-importance items, component libraries
- Arranges items in rows and columns
- Options: columns, cellWidth, cellHeight

ANIMATION:
By default, items animate smoothly to their new positions.
Set animate: false for instant repositioning.

EXAMPLES:
- Flowchart layout: {layoutType: "hierarchical", options: {direction: "TB", levelSpacing: 100}}
- Network diagram: {layoutType: "force-directed", options: {iterations: 200, repulsion: 2000}}
- Mind map: {layoutType: "radial", options: {centerX: 400, centerY: 300}}
- Grid of icons: {layoutType: "grid", options: {columns: 4, cellWidth: 120}}

PARTIAL LAYOUT:
Pass itemIds array to only layout specific items, leaving others in place.`,
    inputSchema: {
      type: 'object',
      properties: {
        layoutType: {
          type: 'string',
          enum: ['hierarchical', 'force-directed', 'tree', 'radial', 'grid'],
          description: 'Layout algorithm to use',
        },
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific items to layout (default: all diagram items)',
        },
        options: {
          type: 'object',
          properties: {
            direction: {
              type: 'string',
              enum: ['TB', 'BT', 'LR', 'RL'],
              description: 'Layout direction (TB=top-to-bottom, LR=left-to-right, etc.)',
            },
            levelSpacing: {
              type: 'number',
              description: 'Vertical spacing between levels (default: 100)',
            },
            nodeSpacing: {
              type: 'number',
              description: 'Horizontal spacing between nodes (default: 80)',
            },
            iterations: {
              type: 'number',
              description: 'Iterations for force-directed layout (default: 100)',
            },
            attraction: {
              type: 'number',
              description: 'Attraction force for connected nodes (default: 0.01)',
            },
            repulsion: {
              type: 'number',
              description: 'Repulsion force between all nodes (default: 1000)',
            },
            columns: {
              type: 'number',
              description: 'Number of columns for grid layout',
            },
            cellWidth: {
              type: 'number',
              description: 'Cell width for grid layout (default: 150)',
            },
            cellHeight: {
              type: 'number',
              description: 'Cell height for grid layout (default: 100)',
            },
            centerX: {
              type: 'number',
              description: 'Center X for radial layout',
            },
            centerY: {
              type: 'number',
              description: 'Center Y for radial layout',
            },
            startRadius: {
              type: 'number',
              description: 'Starting radius for radial layout (default: 100)',
            },
            radiusStep: {
              type: 'number',
              description: 'Radius increment per level for radial layout (default: 80)',
            },
            animate: {
              type: 'boolean',
              description: 'Animate transition to new positions (default: true)',
            },
            animationDuration: {
              type: 'number',
              description: 'Animation duration in ms (default: 300)',
            },
          },
          description: 'Layout-specific options',
        },
      },
      required: ['layoutType'],
    },
  },

  {
    name: 'pinepaper_get_diagram_shapes',
    annotations: {
      title: 'Get Diagram Shapes',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get a list of available diagram shapes with their properties.

USE WHEN:
- Need to see what diagram shapes are available
- Want to know default sizes and styling for shapes
- Building dynamic UI that shows shape options

CATEGORIES:
- flowchart: process, decision, terminal, data, document, database, preparation
- uml: uml-class, uml-usecase, uml-actor
- network: cloud, server
- basic: rectangle, circle, triangle, star

RETURNS:
Array of shape definitions including:
- name: Shape identifier
- category: Category it belongs to
- defaultWidth, defaultHeight: Default dimensions
- defaultStyle: Default colors and stroke
- description: What the shape represents`,
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['flowchart', 'uml', 'network', 'basic'],
          description: 'Filter by category (optional - returns all if not specified)',
        },
      },
    },
  },

  {
    name: 'pinepaper_update_connector',
    annotations: {
      title: 'Update Connector',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Update the style or label of an existing connector.

USE WHEN:
- Changing connector appearance after creation
- Updating connector labels
- Changing arrow styles or colors

UPDATABLE PROPERTIES:
- style: lineColor, lineWidth, headStyle, tailStyle, routing, lineStyle
- label: Text label on the connector
- labelPosition: Position along path (0-1, where 0.5 is middle)

EXAMPLES:
- Change color: {connectorId: "conn_1", style: {lineColor: "#ef4444"}}
- Add label: {connectorId: "conn_1", label: "data flow"}
- Change to dashed: {connectorId: "conn_1", style: {lineStyle: "dashed"}}
- Move label: {connectorId: "conn_1", labelPosition: 0.25}`,
    inputSchema: {
      type: 'object',
      properties: {
        connectorId: {
          type: 'string',
          description: 'ID of the connector to update',
        },
        style: {
          type: 'object',
          properties: {
            lineColor: { type: 'string' },
            lineWidth: { type: 'number' },
            headStyle: { type: 'string', enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'] },
            tailStyle: { type: 'string', enum: ['classic', 'stealth', 'sharp', 'open', 'diamond', 'circle', 'none'] },
            routing: { type: 'string', enum: ['direct', 'orthogonal', 'curved'] },
            lineStyle: { type: 'string', enum: ['solid', 'dashed', 'dotted'] },
          },
          description: 'Style properties to update',
        },
        label: {
          type: 'string',
          description: 'New label text',
        },
        labelPosition: {
          type: 'number',
          description: 'Label position along path (0-1)',
        },
      },
      required: ['connectorId'],
    },
  },

  {
    name: 'pinepaper_remove_connector',
    annotations: {
      title: 'Remove Connector',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove a connector from the canvas.

USE WHEN:
- Deleting a connection between items
- Removing incorrect links
- Restructuring diagram connections`,
    inputSchema: {
      type: 'object',
      properties: {
        connectorId: {
          type: 'string',
          description: 'ID of the connector to remove',
        },
      },
      required: ['connectorId'],
    },
  },

  {
    name: 'pinepaper_diagram_mode',
    annotations: {
      title: 'Diagram Mode',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Control the diagram mode for interactive editing.

USE WHEN:
- Switching between drawing and selection modes
- Enabling/disabling diagram-specific UI
- Setting up the canvas for diagram creation

ACTIONS:
- activate: Enable diagram mode (shows grid, snap, port indicators)
- deactivate: Return to normal canvas mode
- toggle: Switch between diagram and normal mode
- setMode: Set specific tool mode (select, connect, shape, pan)

TOOL MODES (for setMode action):
- select: Selection and moving items
- connect: Drawing connectors between items
- shape: Drawing new shapes (optionally specify shapeType)
- pan: Panning the canvas

EXAMPLES:
- Enter diagram mode: {action: "activate"}
- Exit diagram mode: {action: "deactivate"}
- Set to connect mode: {action: "setMode", mode: "connect"}
- Set to draw rectangles: {action: "setMode", mode: "shape", shapeType: "process"}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['activate', 'deactivate', 'toggle', 'setMode'],
          description: 'Action to perform',
        },
        mode: {
          type: 'string',
          enum: ['select', 'connect', 'shape', 'pan'],
          description: 'Tool mode (for setMode action)',
        },
        shapeType: {
          type: 'string',
          enum: ['process', 'decision', 'terminal', 'data', 'document', 'database', 'preparation', 'uml-class', 'uml-usecase', 'uml-actor', 'cloud', 'server', 'rectangle', 'circle', 'triangle', 'star'],
          description: 'Shape type for shape mode',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // AGENT FLOW MODE TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_agent_start_job',
    annotations: {
      title: 'Start Agent Job',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Start a new agent job/session for optimized batch workflows. Enables agent mode with reduced overhead.

USE WHEN:
- Beginning a content automation pipeline
- Starting a batch creation workflow (create → animate → export)
- Need to track multiple operations as a single job
- Want to optimize performance with batched execution

AGENT MODE BENEFITS:
- Batched code execution (multiple operations in single browser call)
- Automatic item/relation tracking
- Smart screenshot policy (on_complete, on_error, or never)
- Fast canvas reset without browser refresh
- Job-level performance metrics

SCREENSHOT POLICIES:
- on_complete: Single screenshot at job end (recommended for automation)
- on_error: Screenshot only when errors occur (debugging)
- never: No automatic screenshots (fastest)
- on_request: Manual screenshots only

CANVAS PRESETS:
- instagram: 1080x1080 (1:1 square)
- instagram-story: 1080x1920 (9:16 vertical)
- tiktok: 1080x1920 (9:16 vertical, 60fps)
- youtube: 1920x1080 (16:9 horizontal)
- youtube-thumbnail: 1280x720 (16:9 thumbnail)
- twitter: 1200x675 (16:9 Twitter card)
- linkedin: 1200x627 (LinkedIn standard)
- web: Flexible dimensions
- print-a4: 2480x3508 (A4 at 300dpi)
- print-letter: 2550x3300 (Letter at 300dpi)

EXAMPLES:
- Quick social media content: {name: "Instagram Post", screenshotPolicy: "on_complete", canvasPreset: "instagram"}
- High-volume automation: {screenshotPolicy: "never"}
- Debug workflow: {name: "Debug Session", screenshotPolicy: "on_error"}

WORKFLOW:
1. pinepaper_agent_start_job → Start job
2. Multiple create/animate/relation operations
3. pinepaper_agent_end_job → End job, get summary`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Optional job name for tracking',
        },
        screenshotPolicy: {
          type: 'string',
          enum: ['on_complete', 'on_error', 'never', 'on_request'],
          description: 'When to take screenshots (default: on_complete)',
        },
        canvasPreset: {
          type: 'string',
          enum: ['instagram', 'instagram-story', 'tiktok', 'youtube', 'youtube-thumbnail', 'twitter', 'linkedin', 'web', 'print-a4', 'print-letter'],
          description: 'Set canvas size to platform preset',
        },
        clearCanvas: {
          type: 'boolean',
          description: 'Clear canvas when starting job (default: true)',
        },
      },
    },
  },

  {
    name: 'pinepaper_agent_end_job',
    annotations: {
      title: 'End Agent Job',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `End the current agent job and get a comprehensive summary with export recommendations.

USE WHEN:
- Finishing a content automation pipeline
- Need job summary with items created
- Want export format recommendations
- Getting performance metrics for the job

RETURNS:
- jobId: Unique job identifier
- duration: Total job time in milliseconds
- itemsCreated: Array of all item IDs created
- relationsCreated: Array of all relation IDs created
- screenshot: Base64 screenshot (if policy was on_complete)
- recommendations: Smart export recommendations based on content

EXPORT RECOMMENDATIONS:
The system analyzes your content and suggests optimal formats:
- Static content with simple colors → SVG (scalable, small file)
- Static with gradients/images → PNG (high quality)
- Animated content → WebM/MP4 for video, GIF for social
- Print-ready content → PDF with high DPI

EXAMPLE RESPONSE:
{
  "jobId": "job_1704067200_abc123",
  "duration": 2500,
  "itemsCreated": ["item_1", "item_2", "item_3"],
  "relationsCreated": ["relation_1"],
  "recommendations": [
    {"platform": "instagram", "format": "mp4", "confidence": 0.9, "reason": "Animated content works well as video"}
  ]
}`,
    inputSchema: {
      type: 'object',
      properties: {
        includeScreenshot: {
          type: 'boolean',
          description: 'Force include screenshot in response (default: based on policy)',
        },
        analyzeContent: {
          type: 'boolean',
          description: 'Analyze content and provide export recommendations (default: true)',
        },
      },
    },
  },

  {
    name: 'pinepaper_agent_reset',
    annotations: {
      title: 'Agent Reset Canvas',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Fast canvas reset without browser refresh. Much faster than pinepaper_refresh_page.

USE WHEN:
- Starting a new scene in a batch workflow
- Clearing canvas between job iterations
- Need fast reset during automation pipelines
- Preserving browser state while clearing content

PERFORMANCE:
- pinepaper_agent_reset: ~200ms (recommended)
- pinepaper_refresh_page: ~3000ms (browser refresh)

OPTIONS:
- canvasPreset: Set canvas to platform dimensions
- backgroundColor: Set background color after reset
- preserveBackground: Keep existing background (don't reset)

EXAMPLES:
- Quick reset: {} (just clears canvas)
- Reset for Instagram: {canvasPreset: "instagram", backgroundColor: "#ffffff"}
- Reset preserving background: {preserveBackground: true}`,
    inputSchema: {
      type: 'object',
      properties: {
        canvasPreset: {
          type: 'string',
          enum: ['instagram', 'instagram-story', 'tiktok', 'youtube', 'youtube-thumbnail', 'twitter', 'linkedin', 'web', 'print-a4', 'print-letter'],
          description: 'Set canvas size to platform preset after reset',
        },
        backgroundColor: {
          type: 'string',
          description: 'Set background color after reset (e.g., "#ffffff")',
        },
        preserveBackground: {
          type: 'boolean',
          description: 'Keep existing background generator/color',
        },
      },
    },
  },

  {
    name: 'pinepaper_agent_batch_execute',
    annotations: {
      title: 'Batch Execute Operations',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Execute multiple operations in a single browser call. Dramatically faster than individual tool calls.

USE WHEN:
- Creating multiple items in one step
- Applying animations to many items
- Need maximum performance
- Building complex scenes efficiently

PERFORMANCE COMPARISON:
- 10 individual pinepaper_create_item calls: ~1450ms (10 browser round trips)
- pinepaper_agent_batch_execute with 10 creates: ~300ms (1 browser round trip)

OPERATION TYPES:
- create: Create an item (itemType, position, properties)
- modify: Modify an item (itemId, properties)
- animate: Animate an item (itemId, animationType, animationOptions)
- relation: Add a relation (sourceId, targetId, relationType, relationOptions)
- delete: Delete an item (itemId)

ATOMIC MODE:
When atomic: true (default), all operations succeed or all fail.
When atomic: false, operations execute independently (partial success possible).

EXAMPLES:
- Create 3 circles:
  {operations: [
    {type: "create", itemType: "circle", position: {x: 200, y: 300}, properties: {radius: 30, color: "#ef4444"}},
    {type: "create", itemType: "circle", position: {x: 400, y: 300}, properties: {radius: 30, color: "#22c55e"}},
    {type: "create", itemType: "circle", position: {x: 600, y: 300}, properties: {radius: 30, color: "#3b82f6"}}
  ]}

- Create and animate:
  {operations: [
    {type: "create", itemType: "star", position: {x: 400, y: 300}, properties: {radius1: 50, radius2: 25, points: 5, color: "#fbbf24"}},
    {type: "animate", itemId: "$0", animationType: "spin", animationOptions: {speed: 2}}
  ], atomic: true}

VARIABLE REFERENCES:
Use "$0", "$1", etc. to reference items created in earlier operations within the same batch.`,
    inputSchema: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['create', 'modify', 'animate', 'relation', 'delete'],
                description: 'Operation type',
              },
              itemType: {
                type: 'string',
                description: 'For create: type of item to create',
              },
              itemId: {
                type: 'string',
                description: 'For modify/animate/delete: target item ID or $N reference',
              },
              position: {
                type: 'object',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                },
                description: 'Position for create operations',
              },
              properties: {
                type: 'object',
                description: 'Properties for create/modify operations',
              },
              animationType: {
                type: 'string',
                description: 'For animate: animation type',
              },
              animationOptions: {
                type: 'object',
                description: 'For animate: animation options',
              },
              sourceId: {
                type: 'string',
                description: 'For relation: source item ID',
              },
              targetId: {
                type: 'string',
                description: 'For relation: target item ID',
              },
              relationType: {
                type: 'string',
                description: 'For relation: relation type',
              },
              relationOptions: {
                type: 'object',
                description: 'For relation: relation options',
              },
            },
            required: ['type'],
          },
          description: 'Array of operations to execute',
        },
        atomic: {
          type: 'boolean',
          description: 'If true, all operations succeed or all fail (default: true)',
        },
      },
      required: ['operations'],
    },
  },

  {
    name: 'pinepaper_agent_export',
    annotations: {
      title: 'Smart Export',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Smart export with automatic format detection and platform optimization.

USE WHEN:
- Exporting content for a specific social media platform
- Need optimal format automatically selected
- Want platform-specific dimensions and quality
- Exporting for print or web

PLATFORMS & OPTIMAL FORMATS:
| Platform        | Dimensions | Static | Animated |
|-----------------|------------|--------|----------|
| instagram       | 1080x1080  | PNG    | MP4      |
| instagram-story | 1080x1920  | PNG    | MP4      |
| tiktok          | 1080x1920  | PNG    | MP4@60fps|
| youtube         | 1920x1080  | PNG    | MP4      |
| youtube-thumbnail| 1280x720  | PNG    | PNG      |
| twitter         | 1200x675   | PNG    | GIF      |
| linkedin        | 1200x627   | PNG    | GIF      |
| web             | flexible   | SVG    | SVG      |
| print-a4        | 2480x3508  | PDF    | PDF      |
| print-letter    | 2550x3300  | PDF    | PDF      |

FORMAT OVERRIDE:
You can specify a format to override auto-detection:
- svg: Scalable vector (best for web, smallest file)
- png: High quality raster (best for static social media)
- gif: Animated (limited to 256 colors)
- mp4: Video (best quality animations)
- webm: Video (smaller file, modern browsers)
- pdf: Print-ready document

QUALITY LEVELS:
- draft: Fast export, lower quality (good for previews)
- standard: Balanced quality and file size (default)
- high: Maximum quality (best for final export)

EXAMPLES:
- Auto-export for Instagram: {platform: "instagram"}
- Force SVG export: {platform: "web", format: "svg"}
- High-quality print: {platform: "print-a4", quality: "high"}`,
    inputSchema: {
      type: 'object',
      properties: {
        platform: {
          type: 'string',
          enum: ['instagram', 'instagram-story', 'tiktok', 'youtube', 'youtube-thumbnail', 'twitter', 'linkedin', 'web', 'print-a4', 'print-letter'],
          description: 'Target platform for export',
        },
        format: {
          type: 'string',
          enum: ['svg', 'png', 'gif', 'mp4', 'webm', 'pdf'],
          description: 'Override format (auto-detected if not specified)',
        },
        quality: {
          type: 'string',
          enum: ['draft', 'standard', 'high'],
          description: 'Export quality level (default: standard)',
        },
      },
      required: ['platform'],
    },
  },

  {
    name: 'pinepaper_agent_analyze',
    annotations: {
      title: 'Analyze Content',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Analyze canvas content to get export recommendations and content insights.

USE WHEN:
- Need to know what formats work best for current content
- Want to understand content complexity
- Checking if content has animations
- Getting platform recommendations

ANALYSIS INCLUDES:
- hasAnimations: Whether content has animations
- animationTypes: Types of animations used
- colorComplexity: simple | gradient | complex
- itemCount: Number of items on canvas
- canvasSize: Current canvas dimensions
- hasRelations: Whether items have relationships
- relationTypes: Types of relations used
- hasGradients: Whether gradients are used
- hasShadows: Whether shadows are used
- hasText: Whether text items exist
- hasImages: Whether raster images exist

RECOMMENDATIONS:
Based on analysis, returns optimal:
- platform: Best target platforms
- format: Recommended export formats
- warnings: Any potential issues

EXAMPLE RESPONSE:
{
  "analysis": {
    "hasAnimations": true,
    "animationTypes": ["orbit", "pulse"],
    "colorComplexity": "gradient",
    "itemCount": 8,
    "canvasSize": {"width": 1080, "height": 1080}
  },
  "recommendations": [
    {"platform": "instagram", "format": "mp4", "confidence": 0.9},
    {"platform": "web", "format": "webm", "confidence": 0.85}
  ]
}`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // INTERACTIVE TRIGGER TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_add_trigger',
    annotations: {
      title: 'Add Trigger',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Add an interactive trigger to an item. Triggers execute actions when events occur.

USE WHEN:
- Making items clickable
- Adding hover effects
- Creating drag interactions
- Building interactive tutorials/quizzes
- Timeline-based triggers

TRIGGER EVENTS:
- click: When item is clicked
- hover_enter: When mouse enters item
- hover_exit: When mouse leaves item
- drag_start: When item drag begins
- drag_move: While item is being dragged
- drag_end: When item drag ends
- timeline: At specific time in animation
- scene_enter: When scene becomes active
- scene_exit: When scene deactivates
- animation_end: When item's animation completes
- quiz_answer: When quiz answer is submitted

ACTION TYPES:
- show: Make target item visible
- hide: Hide target item
- toggle_visibility: Toggle target visibility
- play_animation: Start animation on target
- stop_animation: Stop animation on target
- navigate: Navigate to scene or URL
- update_property: Change item property
- set_variable: Set a scene variable
- submit_answer: Submit quiz answer
- increment_score: Add to quiz score
- reset_quiz: Reset quiz state

EXAMPLES:
- Click to show: {itemId: "button_1", event: "click", actions: [{type: "show", targetItemId: "panel_1"}]}
- Hover to animate: {itemId: "star_1", event: "hover_enter", actions: [{type: "play_animation", targetItemId: "star_1", animationType: "pulse"}]}
- Click to navigate: {itemId: "next_btn", event: "click", actions: [{type: "navigate", url: "#scene2"}]}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Item to attach trigger to',
        },
        event: {
          type: 'string',
          enum: ['click', 'hover_enter', 'hover_exit', 'drag_start', 'drag_move', 'drag_end', 'timeline', 'scene_enter', 'scene_exit', 'animation_end', 'quiz_answer'],
          description: 'Event that fires the trigger',
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['show', 'hide', 'toggle_visibility', 'play_animation', 'stop_animation', 'navigate', 'update_property', 'set_variable', 'submit_answer', 'increment_score', 'reset_quiz'],
                description: 'Action type',
              },
              targetItemId: {
                type: 'string',
                description: 'Target item for the action',
              },
              animationType: {
                type: 'string',
                description: 'Animation type for play_animation',
              },
              property: {
                type: 'string',
                description: 'Property name for update_property',
              },
              value: {
                description: 'Value for update_property or set_variable',
              },
              variableName: {
                type: 'string',
                description: 'Variable name for set_variable',
              },
              url: {
                type: 'string',
                description: 'URL or scene ID for navigate',
              },
              points: {
                type: 'number',
                description: 'Points for increment_score',
              },
            },
            required: ['type'],
          },
          description: 'Actions to execute when triggered',
        },
        condition: {
          type: 'string',
          description: 'Optional condition expression (e.g., "$score > 10")',
        },
        timelineOffset: {
          type: 'number',
          description: 'Time offset in ms for timeline triggers',
        },
      },
      required: ['itemId', 'event', 'actions'],
    },
  },

  {
    name: 'pinepaper_remove_trigger',
    annotations: {
      title: 'Remove Trigger',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove triggers from an item.

USE WHEN:
- Disabling interactivity on an item
- Cleaning up triggers before adding new ones
- Removing specific event handlers

OPTIONS:
- Remove specific event: {itemId: "button_1", event: "click"}
- Remove all triggers: {itemId: "button_1", removeAll: true}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Item to remove triggers from',
        },
        event: {
          type: 'string',
          enum: ['click', 'hover_enter', 'hover_exit', 'drag_start', 'drag_move', 'drag_end', 'timeline', 'scene_enter', 'scene_exit', 'animation_end', 'quiz_answer'],
          description: 'Specific event to remove (optional)',
        },
        removeAll: {
          type: 'boolean',
          description: 'Remove all triggers from item',
        },
      },
      required: ['itemId'],
    },
  },

  {
    name: 'pinepaper_query_triggers',
    annotations: {
      title: 'Query Triggers',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `List all triggers on the canvas or for a specific item.

USE WHEN:
- Inspecting existing interactivity
- Debugging trigger behavior
- Understanding scene's interactive elements

EXAMPLES:
- All triggers: {}
- Triggers on specific item: {itemId: "button_1"}
- Filter by event type: {event: "click"}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Filter triggers by item ID',
        },
        event: {
          type: 'string',
          enum: ['click', 'hover_enter', 'hover_exit', 'drag_start', 'drag_move', 'drag_end', 'timeline', 'scene_enter', 'scene_exit', 'animation_end', 'quiz_answer'],
          description: 'Filter by event type',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // QUIZ/LMS TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_quiz',
    annotations: {
      title: 'Create Quiz',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create an interactive quiz with questions, answers, and scoring.

USE WHEN:
- Building educational content
- Creating assessments
- Adding gamification elements
- Making interactive learning modules

QUESTION TYPES:
- multiple-choice: Single correct answer from options
- multiple-select: Multiple correct answers
- drag-drop: Drag items to correct zones
- matching: Match pairs of items
- sequencing: Put items in correct order
- hotspot: Click correct area on image
- true-false: True or false question

FEEDBACK:
Each question can have:
- correctFeedback: Message shown on correct answer
- incorrectFeedback: Message shown on wrong answer
- partialFeedback: Message for partially correct (multi-select)

SCORING:
- Each question has a points value
- passingScore: Minimum score to pass
- showScore: Display score during quiz
- allowRetry: Allow retrying incorrect answers

EXAMPLE:
{
  "title": "Geography Quiz",
  "questions": [
    {
      "type": "multiple-choice",
      "prompt": "What is the capital of France?",
      "options": [
        {"id": "a", "label": "London"},
        {"id": "b", "label": "Paris", "isCorrect": true},
        {"id": "c", "label": "Berlin"}
      ],
      "points": 10,
      "correctFeedback": "Correct! Paris is the capital.",
      "incorrectFeedback": "Sorry, the correct answer is Paris."
    }
  ],
  "passingScore": 70,
  "showScore": true
}`,
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Quiz title',
        },
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['multiple-choice', 'multiple-select', 'drag-drop', 'matching', 'sequencing', 'hotspot', 'true-false'],
                description: 'Question type',
              },
              prompt: {
                type: 'string',
                description: 'Question text',
              },
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    label: { type: 'string' },
                    isCorrect: { type: 'boolean' },
                  },
                },
                description: 'Answer options',
              },
              points: {
                type: 'number',
                description: 'Points for correct answer',
              },
              correctFeedback: {
                type: 'string',
                description: 'Feedback for correct answer',
              },
              incorrectFeedback: {
                type: 'string',
                description: 'Feedback for incorrect answer',
              },
              draggableItems: {
                type: 'array',
                items: { type: 'string' },
                description: 'Item IDs that can be dragged (for drag-drop)',
              },
              dropZones: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    correctItems: { type: 'array', items: { type: 'string' } },
                  },
                },
                description: 'Drop zones with correct items (for drag-drop)',
              },
            },
            required: ['type', 'prompt', 'points'],
          },
          description: 'Quiz questions',
        },
        passingScore: {
          type: 'number',
          description: 'Minimum percentage to pass (0-100)',
        },
        showScore: {
          type: 'boolean',
          description: 'Display score during quiz',
        },
        allowRetry: {
          type: 'boolean',
          description: 'Allow retrying incorrect answers',
        },
        shuffleQuestions: {
          type: 'boolean',
          description: 'Randomize question order',
        },
        shuffleOptions: {
          type: 'boolean',
          description: 'Randomize answer options',
        },
      },
      required: ['questions'],
    },
  },

  {
    name: 'pinepaper_get_quiz_state',
    annotations: {
      title: 'Get Quiz State',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get the current state of an active quiz.

USE WHEN:
- Checking quiz progress
- Getting current score
- Reviewing answered questions
- Debugging quiz behavior

RETURNS:
- quizId: Quiz identifier
- currentQuestion: Current question index
- totalQuestions: Total number of questions
- score: Current score
- maxScore: Maximum possible score
- answers: Array of submitted answers
- passed: Whether passing score achieved (if complete)
- complete: Whether quiz is finished`,
    inputSchema: {
      type: 'object',
      properties: {
        quizId: {
          type: 'string',
          description: 'Quiz ID (optional, uses active quiz if not specified)',
        },
      },
    },
  },

  {
    name: 'pinepaper_reset_quiz',
    annotations: {
      title: 'Reset Quiz',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Reset a quiz to its initial state.

USE WHEN:
- Restarting a quiz
- Clearing quiz progress
- Allowing user to retake quiz`,
    inputSchema: {
      type: 'object',
      properties: {
        quizId: {
          type: 'string',
          description: 'Quiz ID (optional, uses active quiz if not specified)',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // WIDGET EXPORT TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_export_widget',
    annotations: {
      title: 'Export Widget',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the current canvas as an embeddable widget (pinewidget).

USE WHEN:
- Creating embeddable content for websites
- Exporting for LMS integration
- Building web components
- Generating embed codes

EXPORT FORMATS:
- web-component: <pinepaper-widget> custom element
- standalone-html: Complete HTML file with bundled runtime
- iframe-embed: Iframe embed code for any website
- react-component: React wrapper component
- vue-component: Vue wrapper component

SIZING OPTIONS:
- fixed: Exact pixel dimensions
- responsive: Scales to container width
- fluid: Fills container completely

INTERACTIVITY LEVELS:
- none: Static display only
- view: Can zoom/pan but not edit
- full: All interactions enabled

LMS FEATURES:
When lmsEnabled is true:
- Tracks quiz completion
- Reports scores to LMS
- Supports SCORM/xAPI

EXAMPLES:
- Simple embed: {format: "iframe-embed"}
- React component: {format: "react-component", sizing: "responsive"}
- LMS quiz: {format: "standalone-html", interactivity: "full", lmsEnabled: true}

OUTPUT:
Returns object with:
- code: Main export code
- embedCode: Copy-paste snippet
- sceneData: Serialized scene JSON
- metadata: Size, interactivity info`,
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['web-component', 'standalone-html', 'iframe-embed', 'react-component', 'vue-component'],
          description: 'Export format',
        },
        sizing: {
          type: 'string',
          enum: ['fixed', 'responsive', 'fluid'],
          description: 'Widget sizing mode (default: responsive)',
        },
        interactivity: {
          type: 'string',
          enum: ['none', 'view', 'full'],
          description: 'Interactivity level (default: view)',
        },
        autoplay: {
          type: 'boolean',
          description: 'Auto-play animations on load (default: true)',
        },
        loop: {
          type: 'boolean',
          description: 'Loop animations (default: true)',
        },
        lmsEnabled: {
          type: 'boolean',
          description: 'Enable LMS tracking (SCORM/xAPI)',
        },
        width: {
          type: 'number',
          description: 'Fixed width in pixels (for fixed sizing)',
        },
        height: {
          type: 'number',
          description: 'Fixed height in pixels (for fixed sizing)',
        },
      },
      required: ['format'],
    },
  },

  // ---------------------------------------------------------------------------
  // LETTER COLLAGE TOOLS (Text Design)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_letter_collage',
    annotations: {
      title: 'Create Letter Collage',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create stylized text with per-letter customization. Perfect for word games, ransom notes, gradient text, and creative typography.

USE WHEN:
- Creating Wordle-style word displays
- Making magazine cutout/ransom note text
- Designing gradient-filled text
- Building creative typography effects
- Creating paper craft style lettering

STYLE TYPES:
- tile: Wordle/Scrabble colored backgrounds (use with tile palettes)
- magazine: Mixed fonts/colors like cutouts
- paperCut: Shadow/depth like cut paper
- fold: Origami-style folded letters
- gradient: Each letter with gradient fill (use with gradient palettes)
- image: Letters filled with image

TILE PALETTES:
- Game: wordle, scrabble
- Vibrant: candy, neon, rainbow
- Soft: pastel, cotton
- Natural: earth, ocean, forest, sunset
- Professional: corporate, minimal, slate
- Seasonal: christmas, halloween, spring
- Magazine: magazine, newspaper, vintage
- Paper Craft: paperCraft, origami, craftPaper

GRADIENT PALETTES:
rainbow, sunset, ocean, fire, gold, rose, ice, cyberpunk, neonGlow, purplePink

EXAMPLES:
- Wordle style: {text: "HELLO", style: "tile", palette: "wordle"}
- Ransom note: {text: "SECRET", style: "magazine", palette: "newspaper"}
- Gradient text: {text: "RAINBOW", style: "gradient", gradientPalette: "rainbow"}
- Neon style: {text: "GLOW", style: "tile", palette: "neon"}`,
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'The text to stylize',
        },
        style: {
          type: 'string',
          enum: ['tile', 'magazine', 'paperCut', 'fold', 'gradient', 'image'],
          description: 'Style type (default: tile)',
        },
        palette: {
          type: 'string',
          enum: [
            'wordle', 'scrabble',
            'candy', 'neon', 'rainbow',
            'pastel', 'cotton',
            'earth', 'ocean', 'forest', 'sunset',
            'corporate', 'minimal', 'slate',
            'christmas', 'halloween', 'spring',
            'magazine', 'newspaper', 'vintage',
            'paperCraft', 'origami', 'craftPaper',
          ],
          description: 'Color palette for tile/magazine styles',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
          },
          description: 'Position on canvas (defaults to center)',
        },
        fontSize: {
          type: 'number',
          description: 'Base font size in pixels (default: 48)',
        },
        fontFamily: {
          type: 'string',
          description: 'Font family (default: Inter, sans-serif)',
        },
        spacing: {
          type: 'number',
          description: 'Letter spacing multiplier (default: 1.1)',
        },
        gradientPalette: {
          type: 'string',
          enum: ['rainbow', 'sunset', 'ocean', 'fire', 'gold', 'rose', 'ice', 'cyberpunk', 'neonGlow', 'purplePink'],
          description: 'Gradient palette (for style="gradient")',
        },
        gradientDirection: {
          type: 'string',
          enum: ['vertical', 'horizontal', 'diagonal', 'radial'],
          description: 'Gradient direction (default: vertical)',
        },
        cornerRadius: {
          type: 'number',
          description: 'Corner radius for tile backgrounds (default: 4)',
        },
        shadowEnabled: {
          type: 'boolean',
          description: 'Enable drop shadows (default: true)',
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'pinepaper_animate_letter_collage',
    annotations: {
      title: 'Animate Letter Collage',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Apply animation to all letters in a collage with staggered timing.

USE WHEN:
- Adding entrance animations to text
- Creating typewriter-style reveals
- Making text bounce or pulse
- Adding dynamic effects to lettering

ANIMATION TYPES:
- pulse: Scale up and down rhythmically
- bounce: Bouncing motion
- fade: Fade in/out
- wobble: Side-to-side wobble
- rotate: Spinning rotation

STAGGER EFFECT:
Use staggerDelay to create wave-like animations where each letter starts slightly after the previous one. 0.1s is a good default for smooth wave effects.

EXAMPLES:
- Wave entrance: {collageId: "collage_1", animationType: "bounce", staggerDelay: 0.1}
- Pulsing text: {collageId: "collage_1", animationType: "pulse", staggerDelay: 0.05}
- Fast typewriter: {collageId: "collage_1", animationType: "fade", staggerDelay: 0.15}`,
    inputSchema: {
      type: 'object',
      properties: {
        collageId: {
          type: 'string',
          description: 'Collage ID from create_letter_collage',
        },
        animationType: {
          type: 'string',
          enum: ['pulse', 'bounce', 'fade', 'wobble', 'rotate'],
          description: 'Animation type to apply',
        },
        staggerDelay: {
          type: 'number',
          description: 'Delay between each letter animation start in seconds (default: 0.1)',
        },
        animationSpeed: {
          type: 'number',
          description: 'Animation speed multiplier (default: 1)',
        },
      },
      required: ['collageId', 'animationType'],
    },
  },
  {
    name: 'pinepaper_get_letter_collage_options',
    annotations: {
      title: 'Get Letter Collage Options',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get available styles, palettes, and gradient options for letter collages.

USE WHEN:
- Learning available letter collage styles
- Discovering palette options
- Exploring gradient possibilities
- Building UI for collage creation

RETURNS:
- styles: All available style types
- tilePalettes: Grouped by category (game, vibrant, soft, natural, etc.)
- gradientPalettes: Available gradient color schemes
- gradientDirections: Direction options for gradients`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // CANVAS PRESETS TOOL
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_get_canvas_presets',
    annotations: {
      title: 'Get Canvas Presets',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `List all available canvas presets with their dimensions.

USE WHEN:
- Setting up canvas for specific platforms (YouTube, Instagram, TikTok, etc.)
- Discovering available size presets
- Planning content dimensions
- Building UI for size selection

PRESETS BY CATEGORY:
- Video: youtube-thumbnail, youtube-short, tiktok, hd-720p, full-hd-1080p
- Social: instagram-story, instagram-post, facebook-post, twitter-post, linkedin-post, pinterest-pin
- Presentation: presentation-16x9, presentation-4x3

RETURNS:
Array of presets with: key, name, width, height, aspectRatio, category`,
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
