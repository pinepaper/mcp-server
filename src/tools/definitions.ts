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
// AI AGENT GUIDE
// =============================================================================
/*
WORKFLOW — Create → Validate → Iterate:

1. pinepaper_agent_start_job (clearCanvas: true, canvasPreset)
2. pinepaper_agent_batch_execute — ONE call with ALL operations:
     set_canvas_size → set_background / execute_generator → create items → animate / keyframe_animate → relation → apply_mask → apply_effect → play_timeline
3. pinepaper_agent_end_job — returns screenshot
4. Show screenshot to user for validation
5. If user wants changes → modify specific items or start a new job

⚠️ CRITICAL — Every operation is LIVE on the canvas:
Every create, animate, relation, or generator call IMMEDIATELY executes on the connected browser canvas.
Calling the same operation twice creates DUPLICATE elements. There is no "preview" — it's all live.
If you restart the pipeline or re-call batch_execute, you DOUBLE every item on the canvas.
To fix mistakes: use modify/delete operations, or start a NEW job with clearCanvas: true.

RULES:
- NEVER restart the pipeline — one start_job, one batch_execute, one end_job
- ALL operations go in batch_execute — canvas, background, items, animation, masks, effects, playback
- Use generators for rich backgrounds — the built-in templates are limited, generators create much better visuals
- Use "$0", "$1" to reference items by creation order within the batch

─── BATCH OPERATIONS (12 types, in order) ───

CANVAS:  set_canvas_size (width/height or preset) → set_background (color) → execute_generator (procedural art)
ITEMS:   create (itemType, position, properties) → modify (itemId, properties) → delete (itemId)
ANIMATE: animate (loop presets) → keyframe_animate (timed reveals) → relation (behavioral links)
EFFECTS: apply_mask (reveal animations) → apply_effect (sparkle/blast)
PLAY:    play_timeline (start playback)

─── GENERATORS (prefer these for backgrounds) ───

Generators fill the canvas with procedural art — much richer than solid colors.
Choose based on mood:
  Dreamy/soft:  drawBokeh, drawGradientMesh, drawOrganicFlow
  Techy/modern: drawCircuit, drawGrid, drawWindField
  Nature/warm:  drawSunsetScene, drawSunburst, drawWaves
  Abstract:     drawGeometricAbstract, drawFluidFlow, drawNoiseTexture
  Decorative:   drawPattern, drawStackedCircles

─── ITEMS ───

Shapes: circle, rectangle, star, ellipse, triangle, polygon, line, arc, path
Text: text (content, fontSize, fontFamily, color, fontWeight)
All items: opacity, shadowColor, shadowBlur, blendMode, strokeColor, strokeWidth

SVG imports for recognizable objects (planes, cars, animals, buildings):
  pinepaper_search_assets → pinepaper_import_asset (850k+ SVG icons)

─── ANIMATION (all in batch) ───

Loop presets (animate): pulse, rotate, bounce, fade, wobble, slide, typewriter
Keyframe (keyframe_animate): [{time, properties, easing}] → opacity, scale, scaleX, scaleY, x, y, rotation, fillColor, strokeColor, fontSize
Relations (relation): orbits, follows, attached_to, points_at, mirrors, parallax, wave_through, morphs_to (+ 9 more in batch_execute schema)
Masks (apply_mask): wipeLeft, wipeRight, wipeUp, wipeDown, iris, irisOut, star, heart, curtainHorizontal, curtainVertical, cinematic, diagonalWipe, revealUp, revealDown
Effects (apply_effect): sparkle, blast

Composability: one item can have loop + keyframe + relation + mask simultaneously.

Timing templates (stagger reveals across duration):
  5s:  bg 0s → elements 1-2s → text 2.5-3.5s → final 4-5s
  10s: bg 0-1s → elements 1-4s → main 4-7s → details 7-9s → finale 9-10s

─── VISUAL COMPOSITION ───

Layer order: background → large shapes (low opacity) → main subjects → text on top
Color: dark bg (#0f172a) + bright accents (#f472b6, #818cf8, #fbbf24)
Scale: main subject 40-60% of canvas, supporting elements smaller
Spacing: distribute across canvas with breathing room, don't cluster

─── CANVAS & EXPORT ───

Presets: instagram (1080x1080), youtube (1920x1080), tiktok (1080x1920), twitter (1200x675)
Export: pinepaper_agent_export (SVG/PNG/GIF/MP4/WebM/PDF), pinepaper_export_svg
More: maps, diagrams, fonts, filters, triggers — see individual tool descriptions.
*/

// =============================================================================
// TOOL DEFINITIONS
// =============================================================================

export const PINEPAPER_TOOLS: Tool[] = [

  // ---------------------------------------------------------------------------
  // LAYER 1 — ATOMS: CANVAS TOOLS
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
    description: `[Utility] Get the current canvas dimensions.

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
  // LAYER 1 — ATOMS: ITEM TOOLS
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

ITEM PROVENANCE:
Items on the canvas can originate from multiple sources — all become first-class items with itemIds:
- pinepaper_create_item: Direct shape creation (this tool)
- pinepaper_import_svg: SVG file import → becomes a full item
- pinepaper_import_image: Raster image import → becomes a full item
- pinepaper_import_asset: Pre-made asset import → becomes a full item
All imported items participate in the relation and animation systems just like natively created items.

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
        data: {
          type: 'object',
          description: 'Item data flags for selection and behavior control',
          properties: {
            selectable: { type: 'boolean', description: 'Whether item can be selected (default: true for text layer items)' },
            isDraggable: { type: 'boolean', description: 'Whether item can be dragged (default: true for text layer items)' },
            isDecorative: { type: 'boolean', description: 'Mark as decorative/non-interactive (skipped by selection)' },
          },
        },
        animationType: {
          type: 'string',
          description: "Animation type to apply on creation (e.g., 'pulse', 'bounce', 'rotate', 'fade', 'wobble', 'slide', 'typewriter', 'keyframe')",
        },
        animationSpeed: {
          type: 'number',
          description: 'Animation speed multiplier (for simple animations, default: 1.0)',
        },
        keyframes: {
          type: 'array',
          description: "Keyframe array for inline keyframe animation (requires animationType: 'keyframe')",
          items: {
            type: 'object',
            properties: {
              time: { type: 'number', description: 'Time in seconds' },
              properties: { type: 'object', description: 'Animatable properties (x, y, scale, opacity, rotation, fillColor, etc.)' },
              easing: { type: 'string', description: 'Easing function: linear, easeIn, easeOut, easeInOut, bounce, elastic' },
            },
          },
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

DO NOT USE FOR ANIMATIONS:
- For looping animations → pinepaper_animate
- For keyframe/timed animations → pinepaper_keyframe_animate
- animationType passed here will be IGNORED

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
          description: 'Properties to update: x, y, width, height, scale, scaleX, scaleY, rotation, opacity, color, strokeColor, strokeWidth, fontSize, content. DO NOT pass animationType here — use pinepaper_animate or pinepaper_keyframe_animate instead.',
          additionalProperties: true,
        },
        data: {
          type: 'object',
          description: 'Update item data flags',
          properties: {
            selectable: { type: 'boolean', description: 'Whether item can be selected' },
            isDraggable: { type: 'boolean', description: 'Whether item can be dragged' },
            isDecorative: { type: 'boolean', description: 'Mark as decorative/non-interactive' },
          },
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
  // LAYER 1 — ATOMS: HIGH-LEVEL DESIGN TOOLS
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

  // ---------------------------------------------------------------------------
  // LAYER 1 — ATOMS: IMPORT TOOLS
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

  {
    name: 'pinepaper_import_image',
    annotations: {
      title: 'Import Image',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    description: `Import a raster image from a URL onto the canvas. Returns an itemId for the imported image.

USE WHEN:
- User wants to add a photo, PNG, JPG, or other raster image
- Importing images from URLs
- Adding backgrounds or reference images
- User provides an image URL

IMPORTANT - IMPORTED IMAGES ARE FULL ITEMS:
The imported image becomes a first-class item in PinePaper's registry. It gets an itemId and
can participate in the full relation and animation system — you can orbit it, attach things to it,
apply masks, animate it with keyframes, etc., just like any natively created shape.

OPTIONAL MASK:
Apply a mask shape during import to clip the image:
- circle: Circular crop
- rounded: Rounded rectangle crop
- hexagon: Hexagonal crop
- star: Star-shaped crop

SIZE CONSTRAINTS:
Use maxWidth/maxHeight to constrain the image dimensions while preserving aspect ratio.

EXAMPLES:
- Import photo: url: "https://example.com/photo.jpg"
- Import with mask: url: "https://example.com/avatar.png", mask: "circle"
- Import at position: url: "https://example.com/bg.jpg", position: {x: 400, y: 300}, maxWidth: 800`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL of the image to import',
        },
        position: {
          type: 'object',
          properties: {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
          },
          description: 'Position to place the imported image (defaults to center)',
        },
        maxWidth: {
          type: 'number',
          description: 'Maximum width constraint in pixels',
        },
        maxHeight: {
          type: 'number',
          description: 'Maximum height constraint in pixels',
        },
        mask: {
          type: 'string',
          enum: ['circle', 'rounded', 'hexagon', 'star'],
          description: 'Optional mask shape to apply to the image',
        },
      },
      required: ['url'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 1 — ATOMS: ASSET TOOLS
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
  // LAYER 1 — ATOMS: BATCH OPERATION TOOLS
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
  // LAYER 2 — RULES: RELATION TOOLS (KEY FOR ANIMATION)
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

RELATION COMPATIBILITY:
- Universal relations (position-based) work with ALL item types including imported SVGs/images:
  orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to
- morphs_to has type-specific behavior:
  Path→Path: point interpolation
  Circle→Circle: radius interpolation
  Text→Text: font blend
  Cross-type: particle denoising transition

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
          description: 'Registry ID of the target item (the item being related to, can be null for self-animations like animates)',
        },
        relationType: {
          type: 'string',
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to'],
          description: 'Type of relationship',
        },
        params: {
          type: 'object',
          description: 'Relation-specific parameters',
          additionalProperties: true,
        },
      },
      required: ['sourceId', 'relationType'],
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
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to'],
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
    description: `[Utility] Query relationships for an item.

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
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to'],
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

  {
    name: 'pinepaper_register_custom_relation',
    annotations: {
      title: 'Register Custom Relation',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Register a custom relation type with compute and apply functions.

USE WHEN:
- Creating physics-based behaviors (attraction, repulsion, collision)
- Building custom animation effects not covered by built-in relations
- Implementing game mechanics (health bars following characters, damage indicators)
- Creating procedural animations (wobble, shake, spring physics)

COMPUTE FUNCTION (runs in Web Worker - pure math only):
- Receives: ctx = { fromPosition: {x,y}, toPosition: {x,y}, params, delta, time }
- Must return: object with computed values (e.g., { x, y, rotation, scale, opacity })
- No DOM access, no Paper.js - pure JavaScript only
- Must be stateless

APPLY FUNCTION (runs on main thread - can use Paper.js):
- Receives: item (paper.Item), target (paper.Item), computed (from compute), params
- Updates actual Paper.js item properties
- Can access full Paper.js API

EXAMPLE - Repulsion:
computeFunction: \`
  const dx = fromPosition.x - toPosition.x;
  const dy = fromPosition.y - toPosition.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > params.maxDistance) return fromPosition;
  const force = (params.maxDistance - dist) / params.maxDistance * params.force;
  return { x: fromPosition.x + (dx/dist) * force * delta, y: fromPosition.y + (dy/dist) * force * delta };
\`
applyFunction: \`
  if (computed) { item.position.x = computed.x; item.position.y = computed.y; }
\``,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Unique name for the relation type (e.g., "repels", "attracts", "wobbles_with")' },
        description: { type: 'string', description: 'Human-readable description' },
        params: {
          type: 'object',
          description: 'Parameter schema with defaults. Keys are param names, values are { type, default, description }',
          additionalProperties: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['number', 'string', 'boolean', 'array', 'object'] },
              default: { description: 'Default value' },
              description: { type: 'string' },
              options: { type: 'array', items: { type: 'string' }, description: 'Valid options for string type' },
              min: { type: 'number', description: 'Minimum for number type' },
              max: { type: 'number', description: 'Maximum for number type' },
            },
          },
        },
        computeFunction: { type: 'string', description: 'Compute function body (pure JS). Context: fromPosition, toPosition, params, delta, time' },
        applyFunction: { type: 'string', description: 'Apply function body (Paper.js). Params: item, target, computed, params' },
        templates: { type: 'array', items: { type: 'string' }, description: 'Natural language templates (e.g., "{item} repels from {target}")' },
        continuous: { type: 'boolean', description: 'Update every frame (default: true)' },
        priority: { type: 'number', description: 'Execution order - lower runs first (default: 0)' },
      },
      required: ['name', 'computeFunction', 'applyFunction'],
    },
  },

  {
    name: 'pinepaper_execute_custom_code',
    annotations: {
      title: 'Execute Custom Code',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    description: `Execute arbitrary JavaScript code in the PinePaper context.

USE WHEN:
- Advanced Paper.js operations not covered by other tools
- Complex mathematical calculations
- Custom item registration
- Accessing PinePaper APIs directly
- Prototyping new features

AVAILABLE GLOBALS:
- app: PinePaper application instance
  - app.create(type, params): Create items
  - app.addRelation(sourceId, targetId, type, params): Add relations
  - app.registerRelationRule(name, definition): Register custom relations
  - app.itemRegistry: Access all registered items
  - app.relationRegistry: Access relation definitions
- paper: Full Paper.js library
  - paper.Path, paper.Shape, paper.PointText, etc.
  - paper.view: Current view/canvas
  - paper.project: Active project

EXAMPLE - Boolean operation:
code: \`
const outer = new paper.Path.Circle({ center: [400, 300], radius: 80 });
const inner = new paper.Path.Circle({ center: [400, 300], radius: 40 });
const ring = outer.subtract(inner);
ring.fillColor = '#8b5cf6';
const id = app.registerItem(ring, 'ring', { source: 'mcp' });
outer.remove();
inner.remove();
return { success: true, itemId: id };
\``,
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'JavaScript code to execute. Use return statement for results.' },
        description: { type: 'string', description: 'What the code does (for logging/debugging)' },
      },
      required: ['code'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 3 — PROPERTIES: ANIMATION TOOLS
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
  // LAYER 3 — PROPERTIES: MASK TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_apply_animated_mask',
    annotations: {
      title: 'Apply Animated Mask',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Apply an animated mask reveal to an item. Supports three usage modes:

MODE 1 - PRESET: Use built-in animation presets
- Quick and easy reveal effects
- Example: wipeLeft, iris, curtainHorizontal

MODE 2 - FULL CONTROL: Define exact keyframes
- Complete control over mask animation
- Specify maskType + keyframes array

MODE 3 - HYBRID: Preset with keyframe override
- Start from preset, customize timing
- Combine preset + keyframes

ANIMATION PRESETS:
- wipeLeft/wipeRight/wipeUp/wipeDown: Directional reveals
- iris/irisOut: Circle expands/shrinks from center
- star/heart: Shape scales up
- curtainHorizontal/curtainVertical: Opens from center
- cinematic: Letterbox bars animate
- diagonalWipe: Angled reveal from corner
- revealUp/revealDown: Text slides within mask

MASK TYPES: rectangle, circle, ellipse, star, triangle, hexagon, heart, rounded`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item to mask' },
        preset: {
          type: 'string',
          enum: ['wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown', 'iris', 'irisOut', 'star', 'heart', 'curtainHorizontal', 'curtainVertical', 'cinematic', 'diagonalWipe', 'revealUp', 'revealDown'],
          description: 'Animation preset name (Mode 1 & 3)',
        },
        maskType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'ellipse', 'star', 'triangle', 'hexagon', 'heart', 'rounded'],
          description: 'Mask shape type (Mode 2)',
        },
        keyframes: {
          type: 'array',
          description: 'Custom keyframes (Mode 2 & 3)',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number', description: 'Normalized time (0-1)' },
              properties: { type: 'object', description: 'Mask properties (x, y, width, height, radius, scale, rotation, opacity)' },
              easing: { type: 'string', enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'] },
            },
            required: ['time', 'properties'],
          },
        },
        options: {
          type: 'object',
          description: 'Animation options (Mode 1)',
          properties: {
            startTime: { type: 'number', description: 'Start time in seconds', default: 0 },
            duration: { type: 'number', description: 'Duration in seconds', default: 0.8 },
            easing: { type: 'string', enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce'], default: 'easeOut' },
            reversed: { type: 'boolean', description: 'Reverse animation (hide instead of reveal)', default: false },
            loop: { type: 'boolean', description: 'Loop the animation', default: false },
          },
        },
        maskOptions: {
          type: 'object',
          description: 'Mask shape options',
          properties: {
            points: { type: 'number', description: 'Number of points (star mask)' },
            innerRadius: { type: 'number', description: 'Inner radius ratio (star mask)' },
          },
        },
      },
      required: ['itemId'],
    },
  },

  {
    name: 'pinepaper_apply_custom_mask',
    annotations: {
      title: 'Apply Custom Mask',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Direct helper for applying custom keyframe-based masks.

USE WHEN:
- You need full control over mask animation
- Creating complex reveal sequences
- Building custom transitions

Requires maskType and keyframes array.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item to mask' },
        maskType: {
          type: 'string',
          enum: ['rectangle', 'circle', 'ellipse', 'star', 'triangle', 'hexagon', 'heart', 'rounded'],
          description: 'Mask shape type',
        },
        keyframes: {
          type: 'array',
          description: 'Keyframes defining the animation',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number' },
              properties: { type: 'object' },
              easing: { type: 'string' },
            },
          },
        },
        maskOptions: {
          type: 'object',
          properties: {
            points: { type: 'number' },
            innerRadius: { type: 'number' },
          },
        },
      },
      required: ['itemId', 'maskType', 'keyframes'],
    },
  },

  {
    name: 'pinepaper_remove_mask',
    annotations: {
      title: 'Remove Mask',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove mask from an item, restoring original appearance.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the masked item' },
      },
      required: ['itemId'],
    },
  },

  {
    name: 'pinepaper_get_animatable_properties',
    annotations: {
      title: 'Get Animatable Properties',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get animatable properties for each mask type. Useful for building custom keyframe animations.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_get_available_easings',
    annotations: {
      title: 'Get Available Easings',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get list of available easing functions for mask animations.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_get_mask_types',
    annotations: {
      title: 'Get Mask Types',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get available mask shape types.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'pinepaper_get_mask_animations',
    annotations: {
      title: 'Get Mask Animations',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get available mask animation presets.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 3 — PROPERTIES: CAMERA TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_camera_animate',
    annotations: {
      title: 'Camera Animate',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Animate camera with keyframe-based zoom and pan sequence for cinematic effects.

USE WHEN:
- Creating cinematic camera movements
- Building presentation zoom sequences
- Making dramatic reveals with camera motion
- Tour animations showing different parts of canvas

KEYFRAME PROPERTIES:
- time: Time in seconds
- zoom: Zoom level (1=normal, 2=2x zoom in, 0.5=zoom out)
- center: View center [x, y]
- easing: Timing function (linear, easeIn, easeOut, easeInOut, bounce, elastic)

EXAMPLE:
{
  "duration": 6,
  "loop": true,
  "keyframes": [
    { "time": 0, "zoom": 1, "center": [400, 300] },
    { "time": 2, "zoom": 2, "center": [400, 300], "easing": "easeInOut" },
    { "time": 4, "zoom": 2, "center": [600, 300], "easing": "easeOut" },
    { "time": 6, "zoom": 1, "center": [400, 300], "easing": "easeInOut" }
  ]
}`,
    inputSchema: {
      type: 'object',
      properties: {
        keyframes: {
          type: 'array',
          description: 'Array of camera keyframes',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number', description: 'Time in seconds' },
              zoom: { type: 'number', description: 'Zoom level (1=normal, 2=2x zoom in)' },
              center: {
                type: 'array',
                items: { type: 'number' },
                description: 'View center [x, y]',
              },
              easing: {
                type: 'string',
                enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'],
              },
            },
          },
        },
        duration: { type: 'number', description: 'Total animation duration in seconds' },
        loop: { type: 'boolean', description: 'Loop the animation' },
        delay: { type: 'number', description: 'Delay before animation starts' },
      },
      required: ['keyframes', 'duration'],
    },
  },
  {
    name: 'pinepaper_camera_zoom',
    annotations: {
      title: 'Camera Zoom',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Simple camera zoom animation.

USE WHEN:
- Quick zoom in to focus on something
- Zoom out to show full canvas
- Simple zoom effects without complex keyframes`,
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['in', 'out'],
          description: 'Zoom direction',
        },
        level: {
          type: 'number',
          description: 'Target zoom level (default: 2 for in, 0.5 for out)',
        },
        duration: {
          type: 'number',
          description: 'Animation duration in seconds (default: 0.5)',
        },
      },
      required: ['direction'],
    },
  },
  {
    name: 'pinepaper_camera_pan',
    annotations: {
      title: 'Camera Pan',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Pan camera in a direction or to specific coordinates.

USE WHEN:
- Moving view to different part of canvas
- Directional panning (left, right, up, down)
- Centering on specific coordinates

EXAMPLES:
// Pan left 200 pixels
{ "direction": "left", "amount": 200 }

// Pan to specific coordinates
{ "x": 200, "y": 200, "duration": 1 }`,
    inputSchema: {
      type: 'object',
      properties: {
        direction: {
          type: 'string',
          enum: ['left', 'right', 'up', 'down'],
          description: 'Pan direction (use with amount)',
        },
        amount: {
          type: 'number',
          description: 'Pixels to pan (default: 100)',
        },
        x: {
          type: 'number',
          description: 'Target X coordinate (use with y for panTo)',
        },
        y: {
          type: 'number',
          description: 'Target Y coordinate (use with x for panTo)',
        },
        duration: {
          type: 'number',
          description: 'Animation duration in seconds (default: 0.5)',
        },
      },
    },
  },
  {
    name: 'pinepaper_camera_move_to',
    annotations: {
      title: 'Camera Move To',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Combined camera zoom and pan to a specific location.

USE WHEN:
- Moving to and zooming on a specific point in one motion
- Focusing on an item with appropriate zoom level`,
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Target X coordinate' },
        y: { type: 'number', description: 'Target Y coordinate' },
        zoom: { type: 'number', description: 'Target zoom level' },
        duration: { type: 'number', description: 'Animation duration in seconds (default: 0.5)' },
      },
      required: ['x', 'y', 'zoom'],
    },
  },
  {
    name: 'pinepaper_camera_reset',
    annotations: {
      title: 'Camera Reset',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Reset camera to default state (center of canvas, zoom 1).

USE WHEN:
- Returning to default view after camera movements
- Resetting before starting new sequence`,
    inputSchema: {
      type: 'object',
      properties: {
        duration: { type: 'number', description: 'Animation duration in seconds (default: 0.5)' },
      },
    },
  },
  {
    name: 'pinepaper_camera_stop',
    annotations: {
      title: 'Camera Stop',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Stop current camera animation.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_camera_state',
    annotations: {
      title: 'Camera State',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get current camera state (zoom level, center position, animation status).`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 4 — COMPOSITIONS: SCENE TOOLS
  // ---------------------------------------------------------------------------
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
SUPPORTED RELATIONS: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, animates, grows_from, staggered_with, indicates, circumscribes, wave_through, camera_follows, camera_animates, morphs_to
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
                enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to'],
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
  // LAYER 5 — BLUEPRINTS: TEMPLATE TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_apply_template',
    annotations: {
      title: 'Apply Template',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Load a pre-built template design onto the canvas, or list available templates.

USE WHEN:
- User wants to start from a pre-made design
- User asks for a template, preset, or starter layout
- User wants to see what templates are available
- Need a quick starting point for social media, presentations, etc.

⚠️ DESTRUCTIVE: Loading a template replaces the current canvas content.

MODES:
1. LIST MODE: Set listOnly: true (or omit templateId) to browse available templates
   - Optionally filter by category
2. LOAD MODE: Provide a templateId to apply that template

TEMPLATE CATEGORIES (13):
- social-media: Social media post/story layouts
- meme: Meme templates and formats
- business: Business cards, letterheads, presentations
- education: Educational diagrams, worksheets
- creative: Artistic and creative compositions
- tech: Technology-themed designs
- global: International and multicultural designs
- indigenous: Indigenous art-inspired patterns
- seasonal: Holiday and seasonal themes
- masking: Mask reveal effect demonstrations
- scenes: Pre-built animated scenes
- diagrams: Flowchart and diagram starters
- maps: Geographic visualization templates

EXAMPLES:
- List all templates: { "listOnly": true }
- List by category: { "category": "social-media", "listOnly": true }
- Load template: { "templateId": "solar-system" }`,
    inputSchema: {
      type: 'object',
      properties: {
        templateId: {
          type: 'string',
          description: 'Template ID to load (omit to list templates)',
        },
        category: {
          type: 'string',
          enum: ['social-media', 'meme', 'business', 'education', 'creative', 'tech', 'global', 'indigenous', 'seasonal', 'masking', 'scenes', 'diagrams', 'maps'],
          description: 'Filter templates by category',
        },
        listOnly: {
          type: 'boolean',
          description: 'If true, only list available templates without loading (default: false)',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: DIAGRAM TOOLS
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
    description: `[Utility] Get a list of available diagram shapes with their properties.

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
  // DOMAIN: MAP TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_load_map',
    annotations: {
      title: 'Load Map',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Load a geographic map onto the canvas with specified projection and styling.

USE WHEN:
- Creating world maps or country visualizations
- Building choropleth data visualizations
- Making infographics with geographic data
- Creating animated map reveals

AVAILABLE MAPS:
- world: World countries (110m resolution, faster)
- worldHighRes: World countries (50m resolution, more detailed)
- usa: US states map

PROJECTIONS:
- naturalEarth: Natural Earth projection (recommended for world maps)
- mercator: Standard web mercator
- equalEarth: Equal-area projection
- orthographic: Globe/3D sphere view
- albers: Conic projection (good for USA)
- stereographic: Stereographic projection

QUALITY SETTINGS:
- fast: Aggressive simplification (prototyping)
- balanced: Moderate detail (most uses)
- professional: No simplification (publications)

EXAMPLES:
- World map: {mapId: "world", projection: "naturalEarth", quality: "balanced"}
- USA map: {mapId: "usa", projection: "albers", quality: "professional"}
- Globe view: {mapId: "worldHighRes", projection: "orthographic", rotate: [0, -30, 0]}

RETURNS:
- mapId: Reference ID for the loaded map
- group: Paper.js group containing all regions
- regions: Array of region info
- bounds: Map bounding box`,
    inputSchema: {
      type: 'object',
      properties: {
        mapId: {
          type: 'string',
          enum: ['world', 'worldHighRes', 'usa'],
          description: 'Map to load (world=110m, worldHighRes=50m professional quality, usa=US states)',
        },
        projection: {
          type: 'string',
          enum: ['mercator', 'equalEarth', 'naturalEarth', 'orthographic', 'albers', 'stereographic'],
          description: 'Map projection type',
        },
        quality: {
          type: 'string',
          enum: ['fast', 'balanced', 'professional'],
          description: 'Rendering quality (professional=no simplification)',
        },
        fillColor: { type: 'string', description: 'Default fill color for regions' },
        strokeColor: { type: 'string', description: 'Border/stroke color' },
        strokeWidth: { type: 'number', description: 'Border width in pixels' },
        scale: { type: 'number', description: 'Scale multiplier' },
        center: {
          type: 'array',
          items: { type: 'number' },
          description: 'Center coordinates [longitude, latitude]',
        },
        rotate: {
          type: 'array',
          items: { type: 'number' },
          description: 'Rotation angles [x, y, z]',
        },
        enableHover: { type: 'boolean', description: 'Enable hover effects on regions' },
        enableClick: { type: 'boolean', description: 'Enable click events on regions' },
        hoverFill: { type: 'string', description: 'Fill color on hover' },
        hoverStroke: { type: 'string', description: 'Stroke color on hover' },
      },
      required: ['mapId'],
    },
  },
  {
    name: 'pinepaper_highlight_regions',
    annotations: {
      title: 'Highlight Regions',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Highlight specific regions on a loaded map with custom styling.

USE WHEN:
- Emphasizing specific countries or states
- Creating interactive map highlights
- Building step-by-step map reveals
- Showing geographic data points

REGION ID FORMATS:
- World maps: Full country names ("United States of America", "France", "Japan")
- USA map: State codes ("CA", "TX", "NY", "FL")

STYLING OPTIONS:
- fillColor: Highlight fill color
- strokeColor: Highlight stroke color
- strokeWidth: Border width for highlighted regions
- animate: Whether to animate the highlight transition

EXAMPLES:
- Highlight countries: {regionIds: ["United States of America", "Canada", "Mexico"], options: {fillColor: "#3b82f6"}}
- Highlight US states: {regionIds: ["CA", "TX", "NY"], options: {fillColor: "#22c55e", animate: true}}
- Custom styling: {regionIds: ["Japan"], options: {fillColor: "#ef4444", strokeColor: "#dc2626", strokeWidth: 2}}`,
    inputSchema: {
      type: 'object',
      properties: {
        regionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of region IDs to highlight (country names or state codes)',
        },
        options: {
          type: 'object',
          properties: {
            fillColor: { type: 'string', description: 'Highlight fill color' },
            strokeColor: { type: 'string', description: 'Highlight stroke color' },
            strokeWidth: { type: 'number', description: 'Highlight stroke width' },
            animate: { type: 'boolean', description: 'Animate the highlight transition' },
          },
          description: 'Highlight styling options',
        },
      },
      required: ['regionIds'],
    },
  },
  {
    name: 'pinepaper_unhighlight_regions',
    annotations: {
      title: 'Unhighlight Regions',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove highlights from specific regions or all regions on the map.

USE WHEN:
- Resetting map to original state
- Removing specific region highlights
- Cycling through different highlight states

EXAMPLES:
- Remove all highlights: {regionIds: "all"}
- Remove specific: {regionIds: ["CA", "TX"]}`,
    inputSchema: {
      type: 'object',
      properties: {
        regionIds: {
          oneOf: [
            { type: 'array', items: { type: 'string' } },
            { type: 'string', enum: ['all'] },
          ],
          description: 'Region IDs to unhighlight, or "all" for all regions',
        },
      },
      required: ['regionIds'],
    },
  },
  {
    name: 'pinepaper_apply_data_colors',
    annotations: {
      title: 'Apply Data Colors',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Apply data-driven coloring to map regions (choropleth visualization).

USE WHEN:
- Visualizing statistics by region (population, GDP, etc.)
- Creating heat maps
- Showing data distribution across geography
- Building infographics with data overlays

COLOR SCALES:
- blues: Light to dark blue gradient
- greens: Light to dark green gradient
- reds: Light to dark red gradient
- oranges: Light to dark orange gradient
- purples: Light to dark purple gradient
- heat: Yellow to red heat map gradient

DATA FORMAT:
Keys must match region IDs exactly (country names for world maps, state codes for USA).

EXAMPLES:
- Population data: {data: {"California": 39538223, "Texas": 29145505, "New York": 20201249}, options: {colorScale: "blues", showLegend: true}}
- GDP heat map: {data: {"United States of America": 21000, "China": 15000, "Japan": 5000}, options: {colorScale: "heat"}}
- Custom range: {data: {"CA": 85, "TX": 72}, options: {colorScale: "greens", minValue: 0, maxValue: 100}}`,
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          additionalProperties: { type: 'number' },
          description: 'Object mapping region IDs to numeric values',
        },
        options: {
          type: 'object',
          properties: {
            colorScale: {
              type: 'string',
              enum: ['blues', 'greens', 'reds', 'oranges', 'purples', 'heat'],
              description: 'Color scale to use',
            },
            minValue: { type: 'number', description: 'Minimum value for scale' },
            maxValue: { type: 'number', description: 'Maximum value for scale' },
            showLegend: { type: 'boolean', description: 'Display color legend' },
            legendPosition: {
              type: 'string',
              enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
              description: 'Legend position',
            },
            legendTitle: { type: 'string', description: 'Title for the legend' },
          },
          description: 'Choropleth styling options',
        },
      },
      required: ['data'],
    },
  },
  {
    name: 'pinepaper_add_marker',
    annotations: {
      title: 'Add Map Marker',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Add a marker to the map at specified coordinates.

USE WHEN:
- Marking cities or points of interest
- Creating location-based visualizations
- Adding data points with geographic coordinates
- Building interactive map annotations

MARKER OPTIONS:
- lat, lon: Geographic coordinates (required)
- label: Text label for the marker
- color: Marker color
- size: Marker size in pixels
- pulse: Enable animated pulse effect
- shape: Marker shape (circle, pin, star)

EXAMPLES:
- City marker: {lat: 37.7749, lon: -122.4194, label: "San Francisco", color: "#ef4444", pulse: true}
- Simple point: {lat: 40.7128, lon: -74.0060, size: 8, color: "#3b82f6"}
- Pin marker: {lat: 51.5074, lon: -0.1278, label: "London", shape: "pin"}`,
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude' },
        lon: { type: 'number', description: 'Longitude' },
        label: { type: 'string', description: 'Marker label text' },
        color: { type: 'string', description: 'Marker color' },
        size: { type: 'number', description: 'Marker size in pixels' },
        pulse: { type: 'boolean', description: 'Enable pulse animation' },
        shape: {
          type: 'string',
          enum: ['circle', 'pin', 'star'],
          description: 'Marker shape',
        },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'pinepaper_add_map_labels',
    annotations: {
      title: 'Add Map Labels',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Add text labels to map regions.

USE WHEN:
- Labeling countries or states
- Adding region names to visualizations
- Creating annotated maps
- Showing data values on regions

LABEL TYPES:
- name: Full region name
- code: Region code (e.g., "CA" for California)
- value: Data value (if applyDataColors was used)

EXAMPLES:
- Label all visible: {options: {fontSize: 10, fontColor: "#374151"}}
- Label specific regions: {regions: ["California", "Texas"], options: {labelType: "code"}}
- Show data values: {options: {labelType: "value", fontSize: 12}}`,
    inputSchema: {
      type: 'object',
      properties: {
        regions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific regions to label (null for all visible)',
        },
        options: {
          type: 'object',
          properties: {
            fontSize: { type: 'number', description: 'Label font size' },
            fontColor: { type: 'string', description: 'Label text color' },
            labelType: {
              type: 'string',
              enum: ['name', 'code', 'value'],
              description: 'Type of label content',
            },
            backgroundColor: { type: 'string', description: 'Label background color' },
          },
          description: 'Label styling options',
        },
      },
    },
  },
  {
    name: 'pinepaper_pan_map',
    annotations: {
      title: 'Pan Map',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Pan the map view to center on specific coordinates.

USE WHEN:
- Navigating to a specific location
- Creating animated map transitions
- Focusing on a region of interest

EXAMPLES:
- Pan to New York: {lat: 40.7128, lon: -74.0060}
- Pan to Europe: {lat: 50, lon: 10}`,
    inputSchema: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Target latitude' },
        lon: { type: 'number', description: 'Target longitude' },
        animate: { type: 'boolean', description: 'Animate the pan transition' },
        duration: { type: 'number', description: 'Animation duration in seconds' },
      },
      required: ['lat', 'lon'],
    },
  },
  {
    name: 'pinepaper_zoom_map',
    annotations: {
      title: 'Zoom Map',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Set the map zoom level.

USE WHEN:
- Zooming in on specific areas
- Creating zoom animations
- Adjusting map scale

ZOOM LEVELS:
- 1: Full view (default)
- 2-5: Moderate zoom
- 5+: Close-up view

EXAMPLES:
- Zoom in: {level: 2}
- Animated zoom: {level: 3, animate: true, duration: 1}`,
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'number', description: 'Zoom level (1 = full view)' },
        animate: { type: 'boolean', description: 'Animate the zoom transition' },
        duration: { type: 'number', description: 'Animation duration in seconds' },
      },
      required: ['level'],
    },
  },
  {
    name: 'pinepaper_export_map',
    annotations: {
      title: 'Export Map',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the current map configuration and state.

USE WHEN:
- Saving map state for later restoration
- Exporting map data for external use
- Creating shareable map configurations

RETURNS:
- mapId: Current map identifier
- projection: Active projection
- regions: Region states and highlights
- markers: All added markers
- dataColors: Applied data coloring configuration`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_import_custom_map',
    annotations: {
      title: 'Import Custom Map',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
    description: `Import a custom GeoJSON or TopoJSON map.

USE WHEN:
- Loading custom geographic boundaries
- Using detailed country/region maps from GADM
- Importing custom shapes or territories
- Working with non-standard geographic data

SUPPORTED FORMATS:
- GeoJSON: Standard geographic JSON format
- TopoJSON: Compressed topology format

SOURCES:
- GADM: Detailed country subdivisions (gadm.org)
- Natural Earth: Public domain maps (naturalearthdata.com)
- Census: Official boundary files
- Custom: Your own GeoJSON files

EXAMPLES:
- Import from URL: {url: "https://example.com/custom.geojson", options: {projection: "mercator"}}
- Import GeoJSON object: {geoJson: {...}, options: {projection: "naturalEarth"}}`,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'URL to GeoJSON/TopoJSON file' },
        geoJson: {
          type: 'object',
          description: 'GeoJSON object to import directly',
        },
        options: {
          type: 'object',
          properties: {
            projection: {
              type: 'string',
              enum: ['mercator', 'equalEarth', 'naturalEarth', 'orthographic', 'albers', 'stereographic'],
              description: 'Projection to use for rendering',
            },
            fillColor: { type: 'string' },
            strokeColor: { type: 'string' },
            strokeWidth: { type: 'number' },
          },
          description: 'Import options',
        },
      },
    },
  },
  {
    name: 'pinepaper_get_region_at_point',
    annotations: {
      title: 'Get Region at Point',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get the region at a specific canvas point (hit testing).

USE WHEN:
- Implementing click interactions
- Finding which region is at a coordinate
- Building interactive map features

EXAMPLES:
- Check point: {x: 400, y: 300}

RETURNS:
- regionId: ID of the region at point (or null)
- regionName: Display name
- properties: Region properties from GeoJSON`,
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number', description: 'Canvas X coordinate' },
        y: { type: 'number', description: 'Canvas Y coordinate' },
      },
      required: ['x', 'y'],
    },
  },
  {
    name: 'pinepaper_animate_map_regions',
    annotations: {
      title: 'Animate Map Regions',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Animate specific map regions with timeline-integrated keyframe color animations.

USE WHEN:
- Creating animated choropleth transitions
- Showing data changes over time
- Building story-based map visualizations
- Adding visual emphasis to regions

KEYFRAME PROPERTIES:
- time: Time in seconds for this keyframe
- fillColor: Fill color at this keyframe (required)
- strokeColor: Optional stroke color
- opacity: Optional opacity (0-1)

EXAMPLES:
- Simple color transition: {duration: 5, loop: true, regions: {"USA": [{"time": 0, "fillColor": "#ef4444"}, {"time": 5, "fillColor": "#22c55e"}]}}
- Multi-region animation: {duration: 8, regions: {"USA": [...], "France": [...], "Japan": [...]}}`,
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Total animation duration in seconds (default: 5)',
        },
        loop: {
          type: 'boolean',
          description: 'Loop the animation (default: true)',
        },
        regions: {
          type: 'object',
          additionalProperties: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                time: { type: 'number', description: 'Time in seconds' },
                fillColor: { type: 'string', description: 'Fill color at this keyframe' },
                strokeColor: { type: 'string', description: 'Stroke color (optional)' },
                opacity: { type: 'number', description: 'Opacity 0-1 (optional)' },
              },
              required: ['time', 'fillColor'],
            },
          },
          description: 'Object mapping region IDs to arrays of keyframes',
        },
      },
      required: ['regions'],
    },
  },
  {
    name: 'pinepaper_animate_map_wave',
    annotations: {
      title: 'Animate Map Wave',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create a wave animation across all map regions based on geographic position.

USE WHEN:
- Creating dramatic visual effects
- Showing global spread patterns
- Adding ambient map animations
- Building attention-grabbing transitions

WAVE DIRECTIONS:
- horizontal: Wave sweeps left to right
- vertical: Wave sweeps top to bottom
- radial: Wave radiates from center outward

EXAMPLES:
- Rainbow wave: {duration: 10, colors: ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"], waveDirection: "horizontal"}
- Fast radial pulse: {duration: 3, colors: ["#ffffff", "#3b82f6"], waveDirection: "radial", loop: true}`,
    inputSchema: {
      type: 'object',
      properties: {
        duration: {
          type: 'number',
          description: 'Total wave duration in seconds (default: 10)',
        },
        loop: {
          type: 'boolean',
          description: 'Loop the animation (default: true)',
        },
        colors: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of colors for the wave (default: red, yellow, green, blue)',
        },
        waveDirection: {
          type: 'string',
          enum: ['horizontal', 'vertical', 'radial'],
          description: 'Direction of the wave effect (default: horizontal)',
        },
      },
    },
  },
  {
    name: 'pinepaper_stop_map_animations',
    annotations: {
      title: 'Stop Map Animations',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Stop all or specific map region animations.

USE WHEN:
- Ending animated sequences
- Resetting map to static state
- Pausing for user interaction
- Transitioning to different visualization

EXAMPLES:
- Stop all: {}
- Stop specific regions: {regions: ["USA", "France"]}
- Stop and reset colors: {resetColors: true}`,
    inputSchema: {
      type: 'object',
      properties: {
        regions: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific region IDs to stop (omit for all)',
        },
        resetColors: {
          type: 'boolean',
          description: 'Reset regions to default colors (default: true)',
        },
      },
    },
  },
  {
    name: 'pinepaper_get_animated_map_regions',
    annotations: {
      title: 'Get Animated Map Regions',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get list of currently animated map regions with their animation data.

USE WHEN:
- Debugging animations
- Checking animation state
- Building animation controls
- Inspecting current timeline

RETURNS:
- animatedRegions: Array of region animation info
- count: Total number of animated regions`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_export_map_region_csv',
    annotations: {
      title: 'Export Map Region CSV',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export map region data as CSV including colors, highlight, and selection status.

USE WHEN:
- Saving map state for later
- Creating data-driven workflows
- Integrating with spreadsheet tools
- Building export features

CSV COLUMNS:
- regionId: Region identifier
- name: Display name
- highlighted: 1 or 0
- selected: 1 or 0
- fillColor: Current fill color
- strokeColor: Current stroke color

EXAMPLES:
- Full export: {}
- Colors only: {includeHighlighted: false, includeSelected: false}
- Auto-download: {download: true, filename: "map-export.csv"}`,
    inputSchema: {
      type: 'object',
      properties: {
        includeHighlighted: {
          type: 'boolean',
          description: 'Include highlight status column (default: true)',
        },
        includeSelected: {
          type: 'boolean',
          description: 'Include selection status column (default: true)',
        },
        includeColors: {
          type: 'boolean',
          description: 'Include fill/stroke color columns (default: true)',
        },
        download: {
          type: 'boolean',
          description: 'Auto-download the CSV file (default: false)',
        },
        filename: {
          type: 'string',
          description: 'Filename for download (default: map-regions.csv)',
        },
      },
    },
  },
  {
    name: 'pinepaper_import_map_region_csv',
    annotations: {
      title: 'Import Map Region CSV',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Import CSV data to update map region states (colors, highlight, selection).

USE WHEN:
- Restoring saved map state
- Applying data from spreadsheets
- Batch updating region properties
- Building data-driven visualizations

CSV FORMAT:
Must have 'regionId' column. Optional columns:
- fillColor: Hex color for fill
- strokeColor: Hex color for stroke
- highlighted: 1 or 0
- selected: 1 or 0

EXAMPLES:
- Import full CSV: {csvText: "regionId,fillColor,highlighted\\nUSA,#22c55e,1\\nFrance,#3b82f6,0"}
- Colors only: {csvText: "...", applyHighlight: false, applySelection: false}`,
    inputSchema: {
      type: 'object',
      properties: {
        csvText: {
          type: 'string',
          description: 'CSV text content to import',
        },
        applyColors: {
          type: 'boolean',
          description: 'Apply fill/stroke colors from CSV (default: true)',
        },
        applyHighlight: {
          type: 'boolean',
          description: 'Update highlight status from CSV (default: true)',
        },
        applySelection: {
          type: 'boolean',
          description: 'Update selection status from CSV (default: true)',
        },
      },
      required: ['csvText'],
    },
  },
  {
    name: 'pinepaper_select_map_regions',
    annotations: {
      title: 'Select Map Regions',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Programmatically select map regions.

USE WHEN:
- Building interactive map features
- Responding to user input
- Creating selection-based workflows
- Highlighting user choices

EXAMPLES:
- Select countries: {regionIds: ["USA", "Canada", "Mexico"]}
- Select US states: {regionIds: ["CA", "TX", "NY"]}`,
    inputSchema: {
      type: 'object',
      properties: {
        regionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of region IDs to select',
        },
      },
      required: ['regionIds'],
    },
  },
  {
    name: 'pinepaper_deselect_map_regions',
    annotations: {
      title: 'Deselect Map Regions',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Programmatically deselect map regions.

USE WHEN:
- Clearing user selections
- Resetting map state
- Implementing toggle behavior
- Building selection management

EXAMPLES:
- Deselect specific: {regionIds: ["USA", "France"]}
- Deselect all: {} (omit regionIds)`,
    inputSchema: {
      type: 'object',
      properties: {
        regionIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of region IDs to deselect (omit for all)',
        },
      },
    },
  },
  {
    name: 'pinepaper_get_highlighted_map_regions',
    annotations: {
      title: 'Get Highlighted Map Regions',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get list of currently highlighted map regions.

USE WHEN:
- Checking current highlight state
- Building conditional logic
- Creating highlight summaries
- Debugging map state

RETURNS:
- highlighted: Array of highlighted region IDs
- count: Total number of highlighted regions`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_export_map_geojson',
    annotations: {
      title: 'Export Map GeoJSON',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the current map as GeoJSON (with current colors/modifications).

USE WHEN:
- Saving map state with custom styling
- Exporting for use in other mapping tools
- Creating styled GeoJSON for external applications
- Archiving map customizations

EXAMPLES:
- Export with styles: {includeStyles: true}
- Selected regions only: {selectedOnly: true}
- Auto-download: {download: true, filename: "my-map.geojson"}`,
    inputSchema: {
      type: 'object',
      properties: {
        includeStyles: {
          type: 'boolean',
          description: 'Include fill/stroke colors as properties (default: true)',
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Include region names and IDs (default: true)',
        },
        selectedOnly: {
          type: 'boolean',
          description: 'Only export selected regions (default: false)',
        },
        download: {
          type: 'boolean',
          description: 'Auto-download the file (default: false)',
        },
        filename: {
          type: 'string',
          description: 'Filename for download (default: "map-export.geojson")',
        },
      },
    },
  },
  {
    name: 'pinepaper_export_original_map_geojson',
    annotations: {
      title: 'Export Original Map GeoJSON',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the original source GeoJSON (unmodified boundaries). Returns the exact data used to load the map, allowing users to edit boundaries externally and re-import.

USE WHEN:
- Extracting original map data for external editing
- Getting clean boundaries without customizations
- Creating a baseline for map modifications
- Re-importing after external boundary edits

EXAMPLES:
- Get original data: {}
- Auto-download: {download: true, filename: "map-source.geojson"}`,
    inputSchema: {
      type: 'object',
      properties: {
        download: {
          type: 'boolean',
          description: 'Auto-download the file (default: false)',
        },
        filename: {
          type: 'string',
          description: 'Filename for download (default: "map-source.geojson")',
        },
      },
    },
  },
  {
    name: 'pinepaper_get_map_source_info',
    annotations: {
      title: 'Get Map Source Info',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Get information about the currently loaded map source.

USE WHEN:
- Checking what map is currently loaded
- Debugging map loading issues
- Getting map metadata
- Verifying map configuration

RETURNS:
- source: Map source identifier (e.g., "world", "worldHighRes", "usa", or custom)
- projection: Current projection type
- quality: Rendering quality setting
- regionCount: Total number of regions
- hasOriginalGeoJSON: Whether original GeoJSON is available
- isCustomImport: Whether this is a custom imported map`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: FONT TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_font_show_studio',
    annotations: {
      title: 'Font Show Studio',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Open the Font Studio UI for interactive font creation.

USE WHEN:
- Starting a custom font creation workflow
- Need the interactive Font Studio interface with guide lines
- Want to create a hand-drawn font from scratch

WORKFLOW:
1. Open Font Studio → pinepaper_font_show_studio
2. Set font name → pinepaper_font_set_name
3. Check required chars → pinepaper_font_get_required_chars
4. For each character: draw path, cleanup, create glyph
5. Check progress → pinepaper_font_get_status
6. Export when complete → pinepaper_font_export`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_font_set_name',
    annotations: {
      title: 'Font Set Name',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Set the font family name for the current font being created.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: "Font family name (e.g., 'MyHandwriting')",
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'pinepaper_font_get_required_chars',
    annotations: {
      title: 'Font Get Required Chars',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get the list of characters needed for a complete font.

CHARACTER SETS:
- minimum: A-Z, a-z, 0-9, space (63 chars) - enough for basic text
- standard: adds punctuation and symbols (90+ chars) - full typography`,
    inputSchema: {
      type: 'object',
      properties: {
        set: {
          type: 'string',
          enum: ['minimum', 'standard'],
          description: 'minimum: A-Z, a-z, 0-9, space (63 chars). standard: adds punctuation (90+ chars)',
        },
      },
    },
  },
  {
    name: 'pinepaper_font_get_status',
    annotations: {
      title: 'Font Get Status',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get font completion status including progress percentage, completed/pending characters.

USE WHEN:
- Checking progress during font creation
- Determining which characters still need to be drawn
- Verifying font is complete before export`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_font_create_glyph',
    annotations: {
      title: 'Font Create Glyph',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create a glyph from a Paper.js path. Converts a drawn path into an OpenType glyph with calculated advance width.

USE WHEN:
- Converting a drawn character path to a font glyph
- Adding a new character to the font

WORKFLOW:
1. Draw the character as a Paper.js path on the canvas
2. Optionally clean up the path (pinepaper_font_cleanup_path)
3. Use the path's registry ID to create the glyph`,
    inputSchema: {
      type: 'object',
      properties: {
        character: {
          type: 'string',
          description: "Single character (e.g., 'A', 'a', '1', ' ')",
        },
        pathId: {
          type: 'string',
          description: 'Registry ID of the Paper.js path to use as glyph shape',
        },
      },
      required: ['character', 'pathId'],
    },
  },
  {
    name: 'pinepaper_font_create_space',
    annotations: {
      title: 'Font Create Space',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Create the space glyph (no visible shape, just advance width).

USE WHEN:
- Adding the space character to the font
- Space needs no drawn path, only a width value`,
    inputSchema: {
      type: 'object',
      properties: {
        width: {
          type: 'number',
          description: 'Space width in font units (default: 250)',
        },
      },
    },
  },
  {
    name: 'pinepaper_font_remove_glyph',
    annotations: {
      title: 'Font Remove Glyph',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove a glyph from the font. Use when a character needs to be redrawn.`,
    inputSchema: {
      type: 'object',
      properties: {
        character: {
          type: 'string',
          description: 'Character to remove',
        },
      },
      required: ['character'],
    },
  },
  {
    name: 'pinepaper_font_set_metrics',
    annotations: {
      title: 'Font Set Metrics',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Set font metrics (advanced). Controls the coordinate grid and vertical measurements.

METRICS:
- unitsPerEm: Coordinate grid size (default: 1000)
- ascender: Height above baseline (default: 800)
- descender: Depth below baseline, negative (default: -200)
- xHeight: Lowercase letter height (default: 500)
- capHeight: Capital letter height (default: 700)`,
    inputSchema: {
      type: 'object',
      properties: {
        unitsPerEm: {
          type: 'number',
          description: 'Coordinate grid size (default: 1000)',
        },
        ascender: {
          type: 'number',
          description: 'Height above baseline (default: 800)',
        },
        descender: {
          type: 'number',
          description: 'Depth below baseline, negative (default: -200)',
        },
        xHeight: {
          type: 'number',
          description: 'Lowercase letter height (default: 500)',
        },
        capHeight: {
          type: 'number',
          description: 'Capital letter height (default: 700)',
        },
      },
    },
  },
  {
    name: 'pinepaper_font_export',
    annotations: {
      title: 'Font Export',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the font as an OTF file. Triggers browser download of the completed font.

USE WHEN:
- Font is complete and ready for download
- User wants to save the font as a file`,
    inputSchema: {
      type: 'object',
      properties: {
        download: {
          type: 'boolean',
          description: 'Trigger browser download (default: true)',
        },
      },
    },
  },
  {
    name: 'pinepaper_font_load_into_document',
    annotations: {
      title: 'Font Load Into Document',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Load the custom font into the document for immediate use in PinePaper text items.

USE WHEN:
- Want to use the created font immediately in the current document
- Testing how the font looks in actual text items`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_font_export_data',
    annotations: {
      title: 'Font Export Data',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export font data as JSON for saving progress. Use to save work-in-progress fonts.

USE WHEN:
- Saving font progress for later continuation
- Backing up font data`,
    inputSchema: {
      type: 'object',
      properties: {
        download: {
          type: 'boolean',
          description: 'Trigger browser download (default: true)',
        },
      },
    },
  },
  {
    name: 'pinepaper_font_import_data',
    annotations: {
      title: 'Font Import Data',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Import font data from previously saved JSON. Restores a font from exported data.

USE WHEN:
- Resuming work on a previously saved font
- Loading font data exported with pinepaper_font_export_data`,
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Font data object from pinepaper_font_export_data',
        },
      },
      required: ['data'],
    },
  },
  {
    name: 'pinepaper_font_clear',
    annotations: {
      title: 'Font Clear',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Clear all glyphs and reset the font. Removes all drawn characters.

WARNING: This is destructive - all glyph progress will be lost.`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'pinepaper_font_remove_overlap',
    annotations: {
      title: 'Font Remove Overlap',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Remove overlapping areas from a path (like FontForge's RemoveOverlap). Merges multiple overlapping paths into a single clean outline.

USE WHEN:
- Path has overlapping strokes that need merging
- Preparing a glyph path for clean font output`,
    inputSchema: {
      type: 'object',
      properties: {
        pathId: {
          type: 'string',
          description: 'Registry ID of the Paper.js path to process',
        },
      },
      required: ['pathId'],
    },
  },
  {
    name: 'pinepaper_font_correct_direction',
    annotations: {
      title: 'Font Correct Direction',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Correct path winding direction for proper fill rendering (like FontForge's CorrectDirection). Ensures outer contours are clockwise and inner holes are counter-clockwise.

USE WHEN:
- Glyph fills are rendering incorrectly (holes appear filled)
- Preparing paths for font export`,
    inputSchema: {
      type: 'object',
      properties: {
        pathId: {
          type: 'string',
          description: 'Registry ID of the Paper.js path to process',
        },
      },
      required: ['pathId'],
    },
  },
  {
    name: 'pinepaper_font_cleanup_path',
    annotations: {
      title: 'Font Cleanup Path',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Apply all path cleanup operations in the correct order: removeOverlap -> correctDirection -> smooth. Convenience tool that combines all path preparation steps.

USE WHEN:
- Preparing a drawn path before creating a glyph
- Quick one-step path cleanup instead of calling individual operations`,
    inputSchema: {
      type: 'object',
      properties: {
        pathId: {
          type: 'string',
          description: 'Registry ID of the Paper.js path to process',
        },
        removeOverlap: {
          type: 'boolean',
          description: 'Merge overlapping strokes (default: true)',
        },
        correctDirection: {
          type: 'boolean',
          description: 'Fix winding direction for fills (default: true)',
        },
        smooth: {
          type: 'boolean',
          description: 'Apply path smoothing (default: true)',
        },
        smoothTolerance: {
          type: 'number',
          description: 'Smoothing tolerance - higher = more simplification (default: 2.5)',
        },
      },
      required: ['pathId'],
    },
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: LETTER COLLAGE TOOLS (Text Design)
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
    description: `[Utility] Get available styles, palettes, and gradient options for letter collages.

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
  // DOMAIN: GENERATOR TOOLS
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
- "add a sunburst background", "bokeh effect", "gradient mesh"
- "create wave pattern", "wind field", "fluid flow"
- "grid background", "geometric abstract", "noise texture"
- Creating dynamic procedural backgrounds

GENERATORS (14 total):

Classic:
- drawSunburst: Radial rays from center (rayCount, colors, bgColor, opacity, rayGap, gradientRays)
- drawSunsetScene: Animated sunset with clouds (sunColor, skyColors, cloudCount, skyOpacity, starCount, starColor, reflectionEnabled, reflectionOpacity)
- drawGrid: Lines/dots/squares (gridType, spacing, lineColor, opacity, gap, randomRotation, colorMode: checkerboard|gradient|random|rows|columns, strokeColor, strokeWidth)
- drawStackedCircles: Overlapping circles (count, colors, distribution: random|poisson|golden, opacityMin, opacityMax, blendMode, strokeWidth, strokeColor, sizeGradient, animationType: pulse|float|none)
- drawCircuit: Tech circuit board (lineColor, nodeColor, density, traceOpacity, nodeOpacity, diagonalPaths, chipDensity: auto|none|low|medium|high)
- drawWaves: Layered wave pattern (waveCount, colors, amplitude, frequency, opacity, fill, fillOpacity, amplitudeVariation, blendMode)
- drawPattern: Geometric shapes in orbit (patternType, size, color, opacity, blendMode, layers: 1-5, layerScaleDecay)

New — Effects:
- drawBokeh: Soft-focus circles (count, colors, minRadius, maxRadius, shadowBlur, distribution: random|poisson, driftAnimation)

New — Organic:
- drawGradientMesh: Radial gradient blobs with screen blending (colors, blobCount, blendMode, drift)
- drawFluidFlow: Sinusoidal stream paths with depth (streamCount, colors, depthLayers, speed)
- drawOrganicFlow: Aurora/silk layers with fill-to-bottom (layerCount, colors, blendMode, fillToBottom)

New — Geometric:
- drawGeometricAbstract: Mixed translucent shapes (colors, shapeCount, blendMode, rotation)

New — Particles:
- drawWindField: Directional wind particles with noise turbulence (particleCount, colors, direction, turbulence, trailLength, speed)

New — Textures:
- drawNoiseTexture: Perlin/grain/stipple noise (noiseType: perlin|grain|stipple, colors, scale, density, animated)`,
    inputSchema: {
      type: 'object',
      properties: {
        generatorName: {
          type: 'string',
          enum: [
            'drawSunburst', 'drawSunsetScene', 'drawGrid', 'drawStackedCircles',
            'drawCircuit', 'drawWaves', 'drawPattern',
            'drawBokeh', 'drawGradientMesh', 'drawGeometricAbstract', 'drawWindField',
            'drawFluidFlow', 'drawOrganicFlow', 'drawNoiseTexture',
          ],
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
    description: `[Utility] Get a list of all available background generators with their parameters.

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
  // DOMAIN: EFFECT TOOLS
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
  // DOMAIN: FILTER TOOLS
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
  // DOMAIN: INTERACTIVE TRIGGER TOOLS
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
    description: `[Utility] List all triggers on the canvas or for a specific item.

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
  // DOMAIN: QUIZ/LMS TOOLS
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
    description: `[Utility] Get the current state of an active quiz.

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
  // INFRASTRUCTURE: QUERY TOOLS
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
    description: `[Utility] Get all or filtered items from the canvas.

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
    description: `[Utility] Get statistics about active relations in the scene.

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
  // INFRASTRUCTURE: EXPORT TOOLS
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

  {
    name: 'pinepaper_export_scene',
    annotations: {
      title: 'Export Scene',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export the complete scene state including all items, relations, and settings.

USE WHEN:
- Saving a complete scene for later restoration
- Creating scene backups
- Debugging scene composition
- Generating scene snapshots for version control

RETURNS:
- items: Array of all canvas items with properties
- relations: Array of active relations
- decorative: Array of decorative (non-interactive) items
- backgroundColor: Current background color
- canvasSize: Canvas dimensions`,
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ---------------------------------------------------------------------------
  // INFRASTRUCTURE: BROWSER CONTROL TOOLS
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
    description: `Connect to PinePaper Studio Editor in a browser.

⚠️ USUALLY NOT NEEDED — the browser auto-connects on the first tool call. Do NOT call this tool unless you need custom settings.

Call this ONLY when: you need a custom URL, or you need headless: false to see the browser window.
Call this AT MOST once — never call it again after connected.

For normal workflows, skip this tool and go directly to pinepaper_agent_start_job.`,
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Custom PinePaper Studio URL (default: https://pinepaper.studio/editor)',
        },
        headless: {
          type: 'boolean',
          description: 'Run browser in headless mode - no visible window (default: false - browser window is visible)',
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
  // INFRASTRUCTURE: PERFORMANCE TOOLS
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
    description: `[Utility] Get execution performance metrics to identify bottlenecks and optimize workflows.

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
  // INFRASTRUCTURE: AGENT FLOW MODE TOOLS
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
    description: `Start a new agent job. Then batch_execute ALL operations, then end_job to get a screenshot for user validation.

⚠️ Call ONCE per pipeline. NEVER restart — creates duplicates.

WORKFLOW: start_job → batch_execute (everything in ONE call) → end_job (screenshot) → show user → iterate if needed.

CANVAS PRESETS: instagram (1080x1080), instagram-story (1080x1920), tiktok (1080x1920), youtube (1920x1080), youtube-thumbnail (1280x720), twitter (1200x675), linkedin (1200x627), web, print-a4, print-letter`,
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
    description: `End the current agent job, get summary + screenshot for user validation.

After calling this, SHOW the screenshot to the user and ask if they want changes.
If user wants changes: modify specific items or start a new job.

USE WHEN:
- Finishing batch_execute — ready to show user the result
- Need screenshot to validate the design with user
- Want export format recommendations

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
    description: `Execute ALL operations in a single call. This is the ONLY tool needed for building scenes — canvas setup, backgrounds, items, animations, masks, effects, and playback all go here.

⚠️ EVERY operation executes LIVE on the canvas. Calling this twice DOUBLES all items. Call ONCE per pipeline.

WORKFLOW:
1. pinepaper_agent_start_job → 2. pinepaper_agent_batch_execute (everything) → 3. pinepaper_agent_end_job (screenshot for validation)
After validation: user reviews screenshot → feedback → modify/recreate as needed.

OPERATION TYPES (12) — use in this order:

CANVAS SETUP:
  set_canvas_size — {width, height} or {preset: "instagram"|"youtube"|"tiktok"|...}
  set_background — {backgroundColor: "#hex"}
  execute_generator — {generatorName, generatorParams} → fills canvas with procedural art
    Generators: drawBokeh, drawGradientMesh, drawWaves, drawSunburst, drawSunsetScene, drawGrid, drawCircuit, drawPattern, drawStackedCircles, drawGeometricAbstract, drawWindField, drawFluidFlow, drawOrganicFlow, drawNoiseTexture

ITEMS:
  create — {itemType, position: {x,y}, properties}
    itemType: text, circle, rectangle, star, triangle, polygon, ellipse, path, line, arc
    Properties per type:
      text: {content, fontSize, fontFamily, color, fontWeight}
      circle: {radius, color, strokeColor, strokeWidth}
      rectangle: {width, height, color, cornerRadius}
      star: {radius1, radius2, points, color}
      ellipse: {radiusX, radiusY, color}
      triangle/polygon: {width/sides, height/radius, color}
    All: opacity, shadowColor, shadowBlur, blendMode, strokeColor, strokeWidth
  modify — {itemId, properties}
  delete — {itemId}

ANIMATION:
  animate — Loop animation: {itemId, animationType, animationOptions}
    animationType: pulse, rotate, bounce, fade, wobble, slide, typewriter
  keyframe_animate — Timed animation: {itemId, keyframes: [{time, properties, easing}], duration, loop}
    Animatable properties: opacity, scale, scaleX, scaleY, x, y, rotation, fillColor, strokeColor, fontSize
    Easing: easeInOut, easeIn, easeOut, easeInCubic, easeOutCubic, easeOutBounce, linear
  relation — Behavioral link: {sourceId, targetId, relationType, relationOptions}
    relationType: orbits, follows, attached_to, points_at, mirrors, parallax, wave_through, morphs_to (+ 9 more in schema)

EFFECTS:
  apply_mask — Reveal effect: {itemId, maskPreset, maskOptions}
    maskPreset: wipeLeft, wipeRight, wipeUp, wipeDown, iris, irisOut, star, heart, curtainHorizontal, curtainVertical, cinematic, diagonalWipe, revealUp, revealDown
  apply_effect — Visual effect: {itemId, effectType, effectParams}
    effectType: sparkle, blast

PLAYBACK:
  play_timeline — {action: "play"|"stop"|"seek", duration, loop}

VARIABLE REFERENCES: "$0", "$1" etc. reference items by creation order within the batch.

EXAMPLE — Animated sky scene with timed reveals:
{operations: [
  {type: "set_canvas_size", preset: "youtube"},
  {type: "execute_generator", generatorName: "drawGradientMesh", generatorParams: {colors: ["#1e3a5f", "#87CEEB", "#fbbf24"], bgColor: "#0c1445", blobCount: 4}},
  {type: "create", itemType: "circle", position: {x: 1600, y: 150}, properties: {radius: 80, color: "#fbbf24", shadowColor: "#fbbf24", shadowBlur: 40}},
  {type: "create", itemType: "ellipse", position: {x: 400, y: 180}, properties: {radiusX: 100, radiusY: 35, color: "#ffffff", opacity: 0.8}},
  {type: "create", itemType: "ellipse", position: {x: 900, y: 120}, properties: {radiusX: 120, radiusY: 40, color: "#ffffff", opacity: 0.7}},
  {type: "create", itemType: "text", position: {x: 960, y: 500}, properties: {content: "Dream Big", fontSize: 96, color: "#ffffff", fontWeight: "bold"}},
  {type: "animate", itemId: "$0", animationType: "pulse", animationOptions: {speed: 0.3}},
  {type: "animate", itemId: "$1", animationType: "slide", animationOptions: {speed: 0.2, direction: "left"}},
  {type: "animate", itemId: "$2", animationType: "slide", animationOptions: {speed: 0.15, direction: "left"}},
  {type: "keyframe_animate", itemId: "$3", keyframes: [{time: 0, properties: {opacity: 0, scale: 0.8}}, {time: 2, properties: {opacity: 1, scale: 1}, easing: "easeOutBack"}], duration: 3},
  {type: "apply_mask", itemId: "$3", maskPreset: "wipeLeft"},
  {type: "play_timeline", action: "play", duration: 5, loop: true}
]}`,
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
                enum: ['set_canvas_size', 'set_background', 'execute_generator', 'create', 'modify', 'delete', 'animate', 'keyframe_animate', 'relation', 'apply_mask', 'apply_effect', 'play_timeline'],
                description: 'Operation type',
              },
              // Canvas setup
              width: { type: 'number', description: 'Canvas width for set_canvas_size' },
              height: { type: 'number', description: 'Canvas height for set_canvas_size' },
              preset: { type: 'string', description: 'Canvas preset for set_canvas_size' },
              backgroundColor: { type: 'string', description: 'For set_background: hex color' },
              generatorName: {
                type: 'string',
                enum: ['drawSunburst', 'drawSunsetScene', 'drawGrid', 'drawWaves', 'drawCircuit', 'drawStackedCircles', 'drawPattern', 'drawBokeh', 'drawGradientMesh', 'drawGeometricAbstract', 'drawWindField', 'drawFluidFlow', 'drawOrganicFlow', 'drawNoiseTexture'],
                description: 'For execute_generator: generator name',
              },
              generatorParams: { type: 'object', description: 'For execute_generator: parameters' },
              // Items
              itemType: {
                type: 'string',
                enum: ['text', 'circle', 'rectangle', 'star', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc'],
                description: 'For create: item type',
              },
              position: {
                type: 'object',
                properties: { x: { type: 'number' }, y: { type: 'number' } },
                description: 'For create: position {x, y}',
              },
              properties: { type: 'object', description: 'For create/modify: item properties' },
              itemId: { type: 'string', description: 'Target item ID or $N reference' },
              // Loop animation
              animationType: {
                type: 'string',
                enum: ['pulse', 'rotate', 'bounce', 'fade', 'wobble', 'slide', 'typewriter'],
                description: 'For animate: loop animation type',
              },
              animationOptions: { type: 'object', description: 'For animate: {speed, amplitude, direction}' },
              // Keyframe animation
              keyframes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    time: { type: 'number' },
                    properties: { type: 'object' },
                    easing: { type: 'string' },
                  },
                },
                description: 'For keyframe_animate: [{time, properties, easing}]',
              },
              duration: { type: 'number', description: 'Duration in seconds for keyframe_animate or play_timeline' },
              loop: { type: 'boolean', description: 'Loop for keyframe_animate or play_timeline' },
              // Relations
              sourceId: { type: 'string', description: 'For relation: source item ID or $N' },
              targetId: { type: 'string', description: 'For relation: target item ID or $N' },
              relationType: {
                type: 'string',
                enum: ['orbits', 'follows', 'attached_to', 'points_at', 'mirrors', 'parallax', 'animates', 'grows_from', 'staggered_with', 'wave_through', 'circumscribes', 'morphs_to', 'maintains_distance', 'bounds_to', 'indicates', 'camera_follows', 'camera_animates'],
                description: 'For relation: type',
              },
              relationOptions: { type: 'object', description: 'For relation: options' },
              // Masks
              maskPreset: {
                type: 'string',
                enum: ['wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown', 'iris', 'irisOut', 'star', 'heart', 'curtainHorizontal', 'curtainVertical', 'cinematic', 'diagonalWipe', 'revealUp', 'revealDown'],
                description: 'For apply_mask: preset',
              },
              maskType: { type: 'string', description: 'For apply_mask: mask shape' },
              maskOptions: { type: 'object', description: 'For apply_mask: options' },
              // Effects
              effectType: {
                type: 'string',
                enum: ['sparkle', 'blast'],
                description: 'For apply_effect: effect type',
              },
              effectParams: { type: 'object', description: 'For apply_effect: parameters' },
              // Timeline
              action: {
                type: 'string',
                enum: ['play', 'stop', 'seek'],
                description: 'For play_timeline: action',
              },
              time: { type: 'number', description: 'For play_timeline seek: time in seconds' },
            },
            required: ['type'],
          },
          description: 'Array of operations to execute in order',
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
  // LAYER 1 — ATOMS: CANVAS PRESETS TOOL
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
    description: `[Utility] List all available canvas presets with their dimensions.

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

  // ---------------------------------------------------------------------------
  // COMPATIBILITY: P5.JS TOOLS
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
  // ESCAPE HATCH: PAPER.JS DIRECT ACCESS TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_register_item',
    annotations: {
      title: 'Register Item',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Register a Paper.js item created externally. This allows items created via custom code or imported Paper.js JSON to be tracked in the registry for use with relations, animations, and other tools.

USE WHEN:
- Registering items created via pinepaper_execute_custom_code
- Importing Paper.js items from external sources
- Integrating programmatically created graphics
- Adding custom items to the registry for relation tracking

EXAMPLES:
- Register custom item: {itemJson: {...}, itemType: "custom-shape"}
- With properties: {itemJson: {...}, itemType: "logo", properties: {source: "external"}}`,
    inputSchema: {
      type: 'object',
      properties: {
        itemJson: {
          type: 'object',
          description: 'Paper.js item JSON (from item.exportJSON())',
        },
        itemType: {
          type: 'string',
          description: 'Type name for registry (e.g., "custom-shape", "logo")',
        },
        properties: {
          type: 'object',
          description: 'Custom properties to store with the item',
        },
      },
      required: ['itemJson', 'itemType'],
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
