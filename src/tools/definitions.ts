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
import { COMPACT_DESCRIPTIONS } from './compact-descriptions.js';
import { MINIMAL_DESCRIPTIONS } from './minimal-descriptions.js';
import {
  EffectTypeSchema,
  SimpleAnimationTypeSchema,
} from '../types/schemas.js';

/**
 * Vocabulary lists derived from Zod schemas so tool descriptions stay in
 * sync automatically. The description-schema-parity test
 * (src/__tests__/unit/description-schema-parity.test.ts) fails CI if any
 * tool description that names a vocabulary slot drops or invents values
 * relative to the source-of-truth schema.
 */
const EFFECT_TYPES_LIST = EffectTypeSchema.options.join(', ');
const SIMPLE_ANIMATION_TYPES_LIST = SimpleAnimationTypeSchema.options.join(', ');

// =============================================================================
// AI AGENT GUIDE (exported for pinepaper_tool_guide)
// =============================================================================

export const AI_AGENT_GUIDE = `⚠️ You are connected to PinePaper Studio via MCP tools. ALWAYS use these tools to create visual content.
NEVER create standalone HTML pages, React components, or web apps as a substitute. Do NOT use frontend design skills or CSS-only animations instead of PinePaper.
PinePaper tools ARE the implementation — they generate Paper.js/JavaScript code that runs on the canvas and produce Canvas 2D, SVG, MP4, GIF, PNG exports.
If a tool fails, report the error — do NOT fall back to generating HTML pages.
The generated code is shown in tool responses and can be copied into PinePaper's Code Console.

⚠️ KNOWN CONFLICT: The "frontend-design" plugin instructs agents to generate HTML/CSS pages for visual content. This conflicts with PinePaper. If you keep generating HTML instead of calling PinePaper tools, the user should disable the frontend-design plugin.

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
- EXCEPTION: Diagrams (flowcharts, UML) use pinepaper_create_diagram_shape + pinepaper_connect, NOT batch_execute
- Use generators for rich backgrounds — the built-in templates are limited, generators create much better visuals
- Use "$0", "$1" to reference items by creation order within the batch

─── BATCH OPERATIONS (12 types, in order) ───

CANVAS:  set_canvas_size (width/height or preset) → set_background (color) → execute_generator (procedural art)
ITEMS:   create (itemType, position, properties) → modify (itemId, properties) → delete (itemId)
ANIMATE: animate (loop presets) → keyframe_animate (timed reveals) → relation (behavioral links)
EFFECTS: apply_mask (reveal animations) → apply_effect (sparkle/blast/bubbles/fireflies/trail...)
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
  Dynamic text: set contentType on text items → clock (live time), timer (elapsed), countdown (from N seconds), stopwatch (pauseable)
All items: opacity, shadowColor, shadowBlur, blendMode, strokeColor, strokeWidth

SVG imports for recognizable objects (planes, cars, animals, buildings):
  pinepaper_search_assets → pinepaper_import_asset (850k+ SVG icons)

─── ANIMATION (all in batch) ───

Loop presets (animate): pulse, rotate, bounce, fade, wobble, slide, typewriter
Keyframe (keyframe_animate): [{time, properties, easing}] → opacity, scale, scaleX, scaleY, x, y, rotation, fillColor, strokeColor, fontSize
Relations (relation): orbits, follows, attached_to, points_at, mirrors, parallax, wave_through, morphs_to, group_morphs_to, moves_along_path (+ 9 more in batch_execute schema)
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

⚠️ SIZING — All positions and sizes MUST fit within the canvas:
  Default canvas is 800x600. For infographics/social media, SET A PRESET FIRST.
  start_job returns canvasSize — use it to calculate positions.
  Keep all items within 5%-95% of canvas width/height (leave margins).
  Font sizes relative to canvas: titles ≤ 5% of canvas width, body ≤ 3%.
  Example for 1080x1080: title fontSize ≤ 54, body ≤ 32, positions 54-1026.
  Example for 800x600: title fontSize ≤ 40, body ≤ 24, positions 40-760.

⚠️ TEXT OVERLAP — NEVER place multiple text items at the same position:
  Each text item MUST have a unique Y position. Stack vertically with spacing ≥ fontSize × 1.4.
  For N words stacked vertically: startY = centerY - (N-1) × spacing / 2, then increment Y by spacing.
  Example for 5 words at fontSize 48 on 800x600: spacing=67, startY=166, positions: 166, 233, 300, 367, 434.

─── DIAGRAMS (flowcharts, UML — do NOT use batch_execute) ───

Diagrams use their own tools, not batch_execute:
  pinepaper_create_diagram_shape → pinepaper_connect → pinepaper_auto_layout
Shapes: process (rect), decision (diamond), terminal (rounded), data, document, database, cloud, server
Workflow: create shapes with positions → connect with arrows → optional auto_layout
See pinepaper://docs/diagrams for full examples.

─── STANDALONE TOOLS (not batch — call directly) ───

Deformation: pinepaper_deform — vertex-level presets (fold, squeeze, twist, ripple, wave, breathe, wobble...)
  Phase-driven animation: sin, blink, pingpong, elastic, heartbeat, stepped
  Use for organic motion that keyframes can't achieve.

Sprite Sheets: pinepaper_sprite_sheet — generate from skeleton poses, play, export (PNG + atlas)
  For character animation and game sprite pipelines.

Interaction: pinepaper_interaction — continuous physics behaviors (repel, attract, follow, orbit, slingshot)
  For interactive storytelling, quizzes, games. trigger_action for state changes (incrementScore, navigate, showFeedback).

Data Viz: pinepaper_create_chart — create/update/reconfigure/remove charts (bar, line, scatter, area)
  Pass data as array of objects + options. Auto-animated with expression-driven oscillation.

Magic: pinepaper_magic — ontology-aware auto-animation + style remix
  One-click animate (mood: calm/professional/energetic/dramatic/whimsical) or remix (cycle colors/fonts).

Physics: pinepaper_physics — rigid body simulation (init, add_body, apply_force, create_joint)
  For interactive simulations, gravity, collisions. Based on Box2D/Planck.js.

Measurement: pinepaper_measurement — rulers, grid, snap-to-grid, get item dimensions
  For precise layouts and alignment.

─── CANVAS & EXPORT ───

Presets: instagram (1080x1080), youtube (1920x1080), tiktok (1080x1920), twitter (1200x675)
Export: pinepaper_agent_export (SVG/PNG/GIF/MP4/WebM/PDF), pinepaper_export_svg
Widget: pinepaper_export_widget (pp:PinePaper ontology JSON), pinepaper_export_widget_html (self-contained HTML with tree-shaken runtime)`;

/*
 * The AI_AGENT_GUIDE constant above is included as a comment in verbose/compact modes
 * and served on-demand via pinepaper_tool_guide in minimal mode.
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

Max canvas size: 4096x4096. For wedding invitations, event cards, or detailed designs, use at least 1080x1080 or larger.`,
    inputSchema: {
      type: 'object',
      properties: {
        width: { type: 'number', description: 'Canvas width in pixels (100-4096)' },
        height: { type: 'number', description: 'Canvas height in pixels (100-4096)' },
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
- Position defaults to canvas center (400, 300). Use position: {x, y} or [x, y] (both forms accepted) to place elsewhere.
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
          oneOf: [
            {
              type: 'object',
              properties: {
                x: { type: 'number', description: 'X coordinate (default: 400)' },
                y: { type: 'number', description: 'Y coordinate (default: 300)' },
              },
            },
            {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
              description: '[x, y] tuple — array shorthand for position',
            },
          ],
          description: 'Position on canvas. Either {x, y} object or [x, y] array.',
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
{type: "linear"|"radial", stops: [{color: "#fff", offset: 0}, {color: "#000", offset: 1}], origin: [x,y], destination: [x,y]}

LETTER-COLLAGE PROPS (non-destructive — registry ids, animations, relations, effects, deformations all preserved):
- palette (collage group): Swap palette name in-place. e.g. "wordle", "spring", "sunset", "magazine". Walks existing letters, rewrites tile + text fills. No geometry change.
- collageStyle (collage group): Swap visual style — "tile" | "magazine" | "paperCut" | "fold" | "gradient" | "image". Geometry rebuilds; every registryId is preserved via graft.
- palette + collageStyle (collage group): Combine in one call to apply both atomically.
- bgColor (single letter group, child of a collage): Tile/background fill for that one letter.
- textColor (single letter group): PointText fill for that one letter.
Use the collage group's id for palette/collageStyle; use a child letter's id for bgColor/textColor. Prefer this over destructive recreation.`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: {
          type: 'string',
          description: 'Registry ID of the item (e.g., "item_1")',
        },
        properties: {
          type: 'object',
          description: 'Properties to update: x, y, width, height, scale, scaleX, scaleY, rotation, opacity, color, strokeColor, strokeWidth, fontSize, content. Letter-collage non-destructive props (preserve ids/animations/relations): palette, collageStyle (collage group); bgColor, textColor (single letter). DO NOT pass animationType here — use pinepaper_animate or pinepaper_keyframe_animate instead.',
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
    name: 'pinepaper_import_mermaid',
    annotations: {
      title: 'Import Mermaid Diagram',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Import a Mermaid diagram source string and render it onto the canvas as native diagram shapes + connectors. Faster than building a flowchart shape-by-shape with pinepaper_create_diagram_shape + pinepaper_connect.

USE WHEN:
- User asks for a flowchart, sequence diagram, ER diagram, class diagram, or state machine
- You have Mermaid source from another tool / docs / the user's clipboard
- You want to author multi-node diagrams in one call instead of N create+connect operations

SUPPORTED DIAGRAM TYPES (auto-detected from the first non-blank line):
- flowchart / graph: shapes + edges + subgraphs + chained edges (TD, LR, RL, BT directions)
- stateDiagram(-v2): states, transitions, [*] start/end, stereotypes, nested states
- sequenceDiagram: participants, messages, activations / lifelines
- erDiagram: entities + relationships + attributes
- classDiagram: classes, fields, methods, visibility, inheritance / association

OPTIONS:
- autoLayout (default true): run hierarchical/force layout after import. Set false to keep coordinates exactly as parsed.
- clearExisting (default false): remove existing canvas items first. Default is additive — diagram is appended.

EXAMPLE (flowchart):
{
  "mermaidText": "flowchart TD\\n  A[Start] --> B{Decision}\\n  B -->|Yes| C[Action]\\n  B -->|No| D[End]"
}

EXAMPLE (sequenceDiagram):
{
  "mermaidText": "sequenceDiagram\\n  Alice->>Bob: Hello\\n  Bob-->>Alice: Hi back\\n  Note right of Bob: Thinking..."
}

Returns { success, nodeCount, edgeCount, nodes, edges, errors }. The created shapes participate in the relation/animation systems just like natively created items — you can grab their ids from \`nodes\` and feed them into pinepaper_add_relation, pinepaper_animate, etc.

NOTE: Import-only — there is no MCP equivalent of FxTool's exportMermaid. Mermaid lacks animation primitives, so a round-trip would silently drop animations.`,
    inputSchema: {
      type: 'object',
      properties: {
        mermaidText: {
          type: 'string',
          description: 'Mermaid diagram source. First line picks the type (flowchart, stateDiagram, sequenceDiagram, erDiagram, classDiagram).',
        },
        autoLayout: {
          type: 'boolean',
          description: 'Run auto-layout after import (default: true).',
        },
        clearExisting: {
          type: 'boolean',
          description: 'Clear existing canvas items first (default: false).',
        },
      },
      required: ['mermaidText'],
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
- group_morphs_to: pair-by-index morph between two paper.Groups (any two — graph vertices+edges, letter collages, dashboard clusters). Path.Line children deform via endpoints; other children translate; excess children fade. Params: duration, hold, loop, easing (linear|easeIn|easeOut|easeInOut), deformLines.
- moves_along_path: self-relation (targetId=null); item is driven along a custom-drawn path stored in params.path (array of {x,y} or [x,y]). Params: path, speed, closed, phase, easing (linear|easeIn|easeOut|easeInOut|sine|bounce|pingpong).

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
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to', 'group_morphs_to', 'moves_along_path'],
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
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to', 'group_morphs_to', 'moves_along_path'],
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
          enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to', 'group_morphs_to', 'moves_along_path'],
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
- position: [x, y] array (a { x, y } object is also accepted and normalized)
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
- elastic: Elastic overshoot

CLIP WINDOW (optional — Premiere/Canva-style clip behavior):
- timeOffset: Shift the whole clip in canvas time (seconds). The animation only runs while canvas time is in [timeOffset, timeOffset + (clipOutPoint - clipInPoint)].
- clipInPoint: Skip the first N seconds of keyframe data (head trim).
- clipOutPoint: Stop at N seconds into the keyframe data (tail trim). Default: lastKeyframeTime.
Outside the clip window the item is hidden via item.visible=false (opacity is left alone, so opacity-keyframes still work inside the window).

EXAMPLE — Reveal at 2s, skip first second of keyframe data, end at 4s of keyframe data:
{ itemId, timeOffset: 2, clipInPoint: 1, clipOutPoint: 4, keyframes: [...] }
// Item visible during canvas time 2..5s; keyframes shifted so kf time=1 plays at canvas 2s.`,
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
        timeOffset: {
          type: 'number',
          description: 'Shift the whole clip in canvas time (seconds). Item is hidden outside [timeOffset, timeOffset+window].',
        },
        clipInPoint: {
          type: 'number',
          description: 'Skip the first N seconds of keyframe data (head trim).',
        },
        clipOutPoint: {
          type: 'number',
          description: 'Stop at N seconds into the keyframe data (tail trim). Default: lastKeyframeTime.',
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
- Starting/stopping/pausing timeline playback
- Seeking to specific time
- Controlling animation state`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'stop', 'seek'],
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
    description: `Animate camera with keyframe-based zoom, pan, and 3D tilt sequence for cinematic effects.

USE WHEN:
- Creating cinematic camera movements
- Building presentation zoom sequences
- Making dramatic reveals with camera motion
- Tour animations showing different parts of canvas
- 3D perspective effects (pitch/yaw tilt via equirectangular projection)

The camera follows a keyframe sequence. For an orbit-style camera (revolving
around a subject), add 4-8 keyframes around the pivot using pathMode: "arc"
with pivot + arcDirection on each segment. There is no separate "orbit" mode
— it is expressible as keyframes + arc paths.

KEYFRAME PROPERTIES:
- time: Time in seconds
- zoom: Zoom level (1=normal, 2=2x zoom in, 0.5=zoom out)
- focus: Camera target, resolved live against the scene graph. Accepts:
    [x, y]                         literal position
    'item-id'                      itemRegistry lookup → item bounds center (tracks the item as it moves)
    { item: 'id', offset: [dx, dy] } item center + offset
- center: [x, y] — legacy alias, honored only when focus is absent
- pitch: 3D tilt in degrees (0=flat, positive=tilt forward). Uses equirectangular projection
- yaw: 3D rotation in degrees. Uses equirectangular projection
- easing: Timing function (linear, easeIn, easeOut, easeInOut, bounce, elastic)

CURVED INTER-KEYFRAME PATHS (optional; default is linear):
- pathOut: [dx, dy] — bezier tangent handle when LEAVING this keyframe
- pathIn:  [dx, dy] — bezier tangent handle when ARRIVING at this keyframe
    Either handle alone promotes the segment to a cubic bezier.
- pathMode: 'arc' — arc around a pivot. Requires pivot: [x, y]; optional arcDirection: 'ccw'|'cw'
- pathMode: 'custom' + path: 'M x y C ...' — sample any SVG path string (falls back to linear when Paper.js is unavailable)
Endpoints always match the resolved focus of each keyframe — handles only shape the curve between them.

EXAMPLE (with 3D tilt):
{
  "duration": 6,
  "loop": true,
  "fov": 60,
  "keyframes": [
    { "time": 0, "zoom": 1, "focus": [400, 300], "pitch": 0, "yaw": 0 },
    { "time": 2, "zoom": 2, "focus": "hero-character", "pitch": 12, "yaw": -5, "easing": "easeInOut" },
    { "time": 4, "zoom": 2, "focus": { "item": "villain", "offset": [0, -40] }, "pitch": 8, "yaw": 3, "easing": "easeOut" },
    { "time": 6, "zoom": 1, "focus": [400, 300], "pitch": 0, "yaw": 0, "easing": "easeInOut" }
  ]
}

EXAMPLE (curved arc between waypoints):
{
  "duration": 4,
  "keyframes": [
    { "time": 0, "zoom": 1, "focus": [200, 300], "pathOut": [120, -60] },
    { "time": 2, "zoom": 1.5, "focus": [800, 300], "pathIn": [-120, -60], "pathMode": "arc", "pivot": [500, 450], "arcDirection": "ccw" },
    { "time": 4, "zoom": 1, "focus": [200, 300] }
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
              focus: {
                description: 'Camera target, resolved live against the scene graph. Accepts [x, y], an item id string, or { item: "id", offset: [dx, dy] }. Takes precedence over center.',
              },
              center: {
                type: 'array',
                items: { type: 'number' },
                description: 'Legacy view center [x, y] — honored only when focus is absent',
              },
              pitch: { type: 'number', description: '3D tilt in degrees (0=flat, positive=forward tilt)' },
              yaw: { type: 'number', description: '3D rotation in degrees' },
              easing: {
                type: 'string',
                enum: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'],
              },
              pathOut: {
                type: 'array',
                items: { type: 'number' },
                description: 'Bezier tangent handle [dx, dy] when leaving this keyframe. Promotes segment to cubic bezier.',
              },
              pathIn: {
                type: 'array',
                items: { type: 'number' },
                description: 'Bezier tangent handle [dx, dy] when arriving at this keyframe. Promotes segment to cubic bezier.',
              },
              pathMode: {
                type: 'string',
                enum: ['arc', 'custom'],
                description: 'arc: curve around pivot (requires pivot). custom: sample an SVG path (requires path).',
              },
              pivot: {
                type: 'array',
                items: { type: 'number' },
                description: 'Arc center [x, y] when pathMode is "arc"',
              },
              arcDirection: {
                type: 'string',
                enum: ['ccw', 'cw'],
                description: 'Arc sweep direction when pathMode is "arc" (default: ccw)',
              },
              path: {
                type: 'string',
                description: 'SVG path string (e.g. "M 100 200 C 150 100 350 100 400 200") when pathMode is "custom"',
              },
            },
          },
        },
        duration: { type: 'number', description: 'Total animation duration in seconds' },
        loop: { type: 'boolean', description: 'Loop the animation' },
        delay: { type: 'number', description: 'Delay before animation starts' },
        fov: { type: 'number', description: 'Field of view in degrees for 3D perspective (default: 60)' },
      },
      required: ['keyframes', 'duration'],
    },
  },
  {
    name: 'pinepaper_camera',
    annotations: {
      title: 'Camera Control',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Camera control: zoom, pan, move, reset, stop, get state. Single action-dispatched tool replaces six thin wrappers. For keyframe walkthroughs / 3D pitch+yaw / curved paths, use pinepaper_camera_animate (a separate, richer tool).

ACTIONS:
- zoom    — { direction: "in"|"out", level?: number, duration?: number }
            level defaults to 2 (in) or 0.5 (out). duration default 0.5s.
- pan     — { direction?: "left"|"right"|"up"|"down", amount?: number, x?: number, y?: number, duration?: number }
            Either direction+amount (default 100px) OR x+y for panTo.
- move_to — { x, y, zoom, duration?: number }
            Combined zoom + pan in one motion.
- reset   — { duration?: number }
            Back to center + zoom 1.
- stop    — {}
            Cancel any active animation.
- state   — {}
            Returns { zoom, center, isAnimating }.
- fit_view — {}
            Fit canvas content to the viewport (calls app.fitView()).

EXAMPLES:
{ action: "zoom", direction: "in", level: 2.5 }
{ action: "pan", x: 200, y: 200, duration: 1 }
{ action: "move_to", x: 600, y: 400, zoom: 2 }
{ action: "reset" }
{ action: "state" }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['zoom', 'pan', 'move_to', 'reset', 'stop', 'state', 'fit_view'],
          description: 'Camera action to perform',
        },
        direction: {
          type: 'string',
          description: 'For zoom: "in"|"out". For pan: "left"|"right"|"up"|"down".',
        },
        level: { type: 'number', description: 'Zoom level (zoom action; default 2 for in, 0.5 for out)' },
        amount: { type: 'number', description: 'Pixels to pan (pan action with direction; default 100)' },
        x: { type: 'number', description: 'Target X coordinate (pan with x+y, or move_to)' },
        y: { type: 'number', description: 'Target Y coordinate (pan with x+y, or move_to)' },
        zoom: { type: 'number', description: 'Target zoom level (move_to)' },
        duration: { type: 'number', description: 'Animation duration in seconds (default 0.5)' },
      },
      required: ['action'],
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
SUPPORTED RELATIONS: orbits, follows, attached_to, maintains_distance, points_at, mirrors, parallax, bounds_to, animates, grows_from, staggered_with, indicates, circumscribes, wave_through, camera_follows, camera_animates, morphs_to, group_morphs_to, moves_along_path
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
                enum: ['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates', 'grows_from', 'staggered_with', 'indicates', 'circumscribes', 'wave_through', 'camera_follows', 'camera_animates', 'morphs_to', 'group_morphs_to', 'moves_along_path'],
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

  // --- Scene Management ---
  {
    name: 'pinepaper_manage_scenes',
    annotations: {
      title: 'Manage Scenes',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Manage multiple saved scenes (canvas snapshots). Save, load, organize, and transfer scenes for multi-scene storyboards and presentations.

ACTIONS:
- save: Save current canvas state as a named scene. Params: name (string)
- load: Load a saved scene onto canvas. Params: sceneId, transition (none|fade|zoom-in|zoom-out)
- list: List all saved scenes with metadata
- delete: Delete a scene. Params: sceneId
- rename: Rename a scene. Params: sceneId, name
- duplicate: Clone a scene. Params: sceneId
- reorder: Reorder scenes. Params: sceneIds (ordered array)
- info: Get scene details. Params: sceneId
- export: Export all scenes as JSON
- import: Import scenes from JSON. Params: scenesJson, merge (boolean)

WORKFLOW — Multi-Scene Storyboard:
1. Create your first scene → save(name: "Intro")
2. Clear canvas, create second scene → save(name: "Chapter 1")
3. Repeat for all scenes
4. Use pinepaper_scene_playback to play them as a slideshow`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['save', 'load', 'list', 'delete', 'rename', 'duplicate', 'reorder', 'info', 'export', 'import'],
          description: 'Scene management action',
        },
        name: { type: 'string', description: 'Scene name (for save, rename)' },
        sceneId: { type: 'string', description: 'Scene identifier (for load, delete, rename, duplicate, info)' },
        transition: {
          type: 'string',
          enum: ['none', 'fade', 'zoom-in', 'zoom-out'],
          description: 'Transition effect when loading a scene',
        },
        sceneIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ordered array of scene IDs (for reorder)',
        },
        scenesJson: { type: 'string', description: 'JSON string of scenes to import' },
        merge: { type: 'boolean', description: 'Merge with existing scenes on import (default: replace)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_scene_playback',
    annotations: {
      title: 'Scene Playback',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Control sequential scene chain playback — play saved scenes as a slideshow presentation.

ACTIONS:
- create_chain: Create a playback chain from scene IDs. Params: sceneIds (array), loop (bool), autoPlay (bool), defaultDuration (seconds), defaultTransition (none|fade|zoom-in|zoom-out), transitionDuration (seconds)
- play: Start playing the chain
- pause: Pause playback
- resume: Resume paused playback
- stop: Stop playback and reset
- toggle_loop: Enable/disable looping. Params: enabled (bool)
- jump: Jump to specific scene index. Params: index (0-based)

NOTE: defaultDuration and transitionDuration are in SECONDS (converted to ms internally).

EXAMPLE — Slideshow:
1. Save 3 scenes with pinepaper_manage_scenes
2. create_chain with sceneIds, defaultDuration: 5, loop: true
3. play`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create_chain', 'play', 'pause', 'resume', 'stop', 'toggle_loop', 'jump'],
          description: 'Playback control action',
        },
        sceneIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Scene IDs for the chain (create_chain)',
        },
        loop: { type: 'boolean', description: 'Loop the chain (create_chain)' },
        autoPlay: { type: 'boolean', description: 'Start playing immediately (create_chain)' },
        defaultDuration: { type: 'number', description: 'Duration per scene in seconds (create_chain)' },
        defaultTransition: {
          type: 'string',
          enum: ['none', 'fade', 'zoom-in', 'zoom-out'],
          description: 'Default transition between scenes',
        },
        transitionDuration: { type: 'number', description: 'Transition duration in seconds (create_chain)' },
        enabled: { type: 'boolean', description: 'Enable/disable loop (toggle_loop)' },
        index: { type: 'number', description: '0-based scene index (jump)' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 4 — COMPOSITIONS: SELECTION, TRANSFORM & HISTORY TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_selection',
    annotations: {
      title: 'Selection',
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Manage item selection on canvas.

ACTIONS:
- select: Select items by ID. Params: itemIds (string[]), mode (replace|add|remove)
- select_all: Select all items on canvas
- deselect_all: Clear selection
- get: Get currently selected items with bounds
- delete_selected: Delete all selected items`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['select', 'select_all', 'deselect_all', 'get', 'delete_selected'],
          description: 'Selection action',
        },
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Item IDs to select (for select action)',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'add', 'remove'],
          description: 'Selection mode: replace (default), add to, or remove from current selection',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_transform',
    annotations: {
      title: 'Transform',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Transform items: nudge position, flip, or change z-order.

ACTIONS:
- nudge: Move item by dx/dy offset. Params: itemId, dx, dy
- flip: Mirror item. Params: itemId, direction (horizontal|vertical)
- reorder: Change z-order. Params: itemId, order (bringToFront|sendToBack|moveUp|moveDown)`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['nudge', 'flip', 'reorder'],
          description: 'Transform action',
        },
        itemId: { type: 'string', description: 'Target item ID' },
        dx: { type: 'number', description: 'Horizontal offset (for nudge)' },
        dy: { type: 'number', description: 'Vertical offset (for nudge)' },
        direction: {
          type: 'string',
          enum: ['horizontal', 'vertical'],
          description: 'Flip direction',
        },
        order: {
          type: 'string',
          enum: ['bringToFront', 'sendToBack', 'moveUp', 'moveDown'],
          description: 'Z-order operation',
        },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_history',
    annotations: {
      title: 'History',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Undo/redo and history state inspection.

ACTIONS:
- undo: Undo last canvas action
- redo: Redo last undone action
- get_state: Get history stack state (canUndo, canRedo, count)`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['undo', 'redo', 'get_state'],
          description: 'History action',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 4 — COMPOSITIONS: IMAGE PROCESSING TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_image_filter',
    annotations: {
      title: 'Image Filter',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Apply GPU-accelerated image filters to raster items.

ACTIONS:
- apply: Apply a single filter. Params: itemId, filterName, params
- chain: Apply multiple filters in sequence. Params: itemId, filters (array of {name, params})

Available filters: blur, brightness, contrast, saturate, grayscale, sepia, invert, hue-rotate, sharpen, emboss, edge-detect.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['apply', 'chain'],
          description: 'Filter action',
        },
        itemId: { type: 'string', description: 'Target raster item ID' },
        filterName: { type: 'string', description: 'Filter name (for apply)' },
        params: {
          type: 'object',
          description: 'Filter parameters (e.g. {amount: 5} for blur)',
        },
        filters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              params: { type: 'object' },
            },
            required: ['name'],
          },
          description: 'Filter chain (for chain action)',
        },
      },
      required: ['action', 'itemId'],
    },
  },
  {
    name: 'pinepaper_lasso',
    annotations: {
      title: 'Lasso',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Freeform lasso selection for image items.

ACTIONS:
- activate: Start lasso mode on an image item. Params: itemId
- apply: Confirm and apply the lasso selection`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['activate', 'apply'],
          description: 'Lasso action',
        },
        itemId: { type: 'string', description: 'Target image item ID (for activate)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_cutout_style',
    annotations: {
      title: 'Cutout Style',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Apply decorative cutout styles to image items (sticker effects, torn edges, etc.).

ACTIONS:
- apply: Apply a cutout preset. Params: itemId, preset, options
- list: List available cutout style presets`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['apply', 'list'],
          description: 'Cutout style action',
        },
        itemId: { type: 'string', description: 'Target image item ID (for apply)' },
        preset: { type: 'string', description: 'Cutout style preset name' },
        options: { type: 'object', description: 'Additional style options' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 4 — COMPOSITIONS: PRECOMP, VIEW & BACKGROUND TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_precomp',
    annotations: {
      title: 'Precomp',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Nested compositions — group items into reusable animated precomps.

ACTIONS:
- create: Create precomp from items. Params: itemIds (string[]), name, loop (bool), duration (seconds)
- add: Add item to existing precomp. Params: precompId, itemId
- remove: Remove item from precomp. Params: precompId, itemId`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'add', 'remove'],
          description: 'Precomp action',
        },
        itemIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Item IDs to group (for create)',
        },
        name: { type: 'string', description: 'Precomp name' },
        loop: { type: 'boolean', description: 'Loop precomp animation' },
        duration: { type: 'number', description: 'Precomp duration in seconds' },
        precompId: { type: 'string', description: 'Target precomp ID (for add/remove)' },
        itemId: { type: 'string', description: 'Item to add/remove' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_background',
    annotations: {
      title: 'Background',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Set, clear, or query the canvas background.

ACTIONS:
- set: Set background. Params: mode (color|pattern|generator), color, pattern, generator, generatorParams
- clear: Remove background entirely
- get: Get current background settings`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['set', 'clear', 'get'],
          description: 'Background action',
        },
        mode: {
          type: 'string',
          enum: ['color', 'pattern', 'generator'],
          description: 'Background type (for set)',
        },
        color: { type: 'string', description: 'Hex color (for color mode)' },
        pattern: { type: 'string', description: 'Pattern name (for pattern mode)' },
        generator: { type: 'string', description: 'Generator name (for generator mode)' },
        generatorParams: { type: 'object', description: 'Generator parameters' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // LAYER 4 — COMPOSITIONS: CANVAS QUERY TOOLS
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_query',
    annotations: {
      title: 'Canvas Query',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Query canvas items and spatial information.

ACTIONS:
- get_by_id: Get detailed item info. Params: itemId
- hit_test: Find items at coordinates. Params: x, y, tolerance, all (bool)
- is_empty: Check if canvas has any items`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['get_by_id', 'hit_test', 'is_empty'],
          description: 'Query action',
        },
        itemId: { type: 'string', description: 'Item ID (for get_by_id)' },
        x: { type: 'number', description: 'X coordinate (for hit_test)' },
        y: { type: 'number', description: 'Y coordinate (for hit_test)' },
        all: { type: 'boolean', description: 'Return all hits (default: first only)' },
        tolerance: { type: 'number', description: 'Hit test tolerance in pixels (default: 5)' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // DEFORMATION, SPRITE SHEETS, INTERACTION
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_deform',
    annotations: {
      title: 'Deformation',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Apply vertex deformation presets to items for organic motion effects.

ACTIONS:
- apply: Apply looping deformation. Params: itemId, preset, frequency, amplitude (0-1), phase, loop, axis, turns, waves, maxDisplacement, speed, steps
- trigger: One-shot deformation (auto-removes). Params: itemId, preset, amplitude, speed
- remove: Restore original geometry. Params: itemId

PRESETS: fold, squeeze, squash, pinch, bulge, twist, ripple, wave, breathe, melt, shear, inflate, wobble

PHASES: sin, blink, linear, pingpong, once, elastic, heartbeat, stepped`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['apply', 'trigger', 'remove'],
          description: 'Deformation action',
        },
        itemId: { type: 'string', description: 'Target item ID' },
        preset: {
          type: 'string',
          enum: ['fold', 'squeeze', 'squash', 'pinch', 'bulge', 'twist', 'ripple', 'wave', 'breathe', 'melt', 'shear', 'inflate', 'wobble'],
          description: 'Deformation preset name',
        },
        frequency: { type: 'number', description: 'Oscillation speed (default: 1)' },
        amplitude: { type: 'number', description: 'Deformation strength 0-1 (default: 1)' },
        phase: {
          type: 'string',
          enum: ['sin', 'blink', 'linear', 'pingpong', 'once', 'elastic', 'heartbeat', 'stepped'],
          description: 'Phase driver for animation timing',
        },
        loop: { type: 'boolean', description: 'Loop the deformation (default: true)' },
        axis: { type: 'string', enum: ['horizontal', 'vertical'], description: 'Axis for fold/wave presets' },
        turns: { type: 'number', description: 'Rotation amount for twist preset' },
        waves: { type: 'number', description: 'Wave count for ripple/wave presets' },
        maxDisplacement: { type: 'number', description: 'Maximum displacement in pixels' },
        speed: { type: 'number', description: 'Animation speed multiplier' },
        steps: { type: 'number', description: 'Quantization levels for stepped phase' },
      },
      required: ['action'],
    },
  },

  {
    name: 'pinepaper_sprite_sheet',
    annotations: {
      title: 'Sprite Sheet',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Generate, play, and export sprite sheets from skeleton poses.

ACTIONS:
- generate: Create sprite sheet from skeleton. Params: skeletonId, poses, transition, bakedAnimation, animations, padding, name
- play: Play sprite animation on canvas. Params: spriteSheetId, x, y, animation, fps, scale
- export: Export sprite sheet as image + metadata. Params: spriteSheetId, format (png|webp)`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['generate', 'play', 'export'],
          description: 'Sprite sheet action',
        },
        skeletonId: { type: 'string', description: 'Skeleton ID (for generate)' },
        spriteSheetId: { type: 'string', description: 'Sprite sheet ID (for play/export)' },
        name: { type: 'string', description: 'Sheet name' },
        poses: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' }, poseId: { type: 'string' } }, required: ['name', 'poseId'] },
          description: 'Explicit pose list',
        },
        transition: {
          type: 'object',
          properties: { poseIdA: { type: 'string' }, poseIdB: { type: 'string' }, frameCount: { type: 'number' }, name: { type: 'string' } },
          description: 'Interpolate between two poses',
        },
        bakedAnimation: {
          type: 'object',
          properties: { duration: { type: 'number' }, fps: { type: 'number' }, name: { type: 'string' } },
          description: 'Bake timeline animation into frames',
        },
        animations: {
          type: 'object',
          additionalProperties: { type: 'object', properties: { frames: { type: 'array', items: { type: 'string' } }, fps: { type: 'number' }, loop: { type: 'boolean' } } },
          description: 'Animation definitions mapping name to frame sequences',
        },
        padding: { type: 'number', description: 'Padding between frames (default: 1)' },
        x: { type: 'number', description: 'X position for playback' },
        y: { type: 'number', description: 'Y position for playback' },
        animation: { type: 'string', description: 'Animation name to play' },
        fps: { type: 'number', description: 'Frame rate (default: 12)' },
        scale: { type: 'number', description: 'Scale factor (default: 1)' },
        format: { type: 'string', enum: ['png', 'webp'], description: 'Export format (default: png)' },
      },
      required: ['action'],
    },
  },

  {
    name: 'pinepaper_interaction',
    annotations: {
      title: 'Interaction',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Add continuous physics behaviors and trigger interaction actions.

ACTIONS:
- add_behavior: Attach a continuous behavior. Params: itemId, behaviorType, params
- remove_behavior: Remove a behavior. Params: itemId, behaviorId
- trigger_action: Fire an interaction action. Params: actionType, params
- get_state: Get interaction state (score, progress, step)

BEHAVIOR TYPES: repel, attract, follow, orbit, slingshot, physics_body, draggable_constrained

ACTION TYPES: navigate, show, hide, animate, stopAnimation, setState, incrementScore, playTimeline, pauseTimeline, seekTimeline, showFeedback, complete`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['add_behavior', 'remove_behavior', 'trigger_action', 'get_state'],
          description: 'Interaction action',
        },
        itemId: { type: 'string', description: 'Target item ID' },
        behaviorType: {
          type: 'string',
          enum: ['repel', 'attract', 'follow', 'orbit', 'slingshot', 'physics_body', 'draggable_constrained'],
          description: 'Continuous behavior type',
        },
        behaviorId: { type: 'string', description: 'Behavior ID (for remove_behavior)' },
        actionType: {
          type: 'string',
          enum: ['navigate', 'show', 'hide', 'animate', 'stopAnimation', 'setState', 'incrementScore', 'playTimeline', 'pauseTimeline', 'seekTimeline', 'showFeedback', 'complete'],
          description: 'Interaction action type (for trigger_action)',
        },
        params: {
          type: 'object',
          description: 'Action-specific or behavior-specific parameters',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // WIDGET EXPORT
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
    description: `Export current scene as a PineWidget (pp:PinePaper ontology JSON v0.4.3).

Returns portable scene data with items, relations, animations, masks, and interactions serialized in the pp:PinePaper semantic format. Includes embed code snippet for external sites.

Params: download (bool), filename, includeInteractions (bool, default true), minify (bool)`,
    inputSchema: {
      type: 'object',
      properties: {
        download: { type: 'boolean', description: 'Trigger browser download (default: false)' },
        filename: { type: 'string', description: 'Output filename (default: widget-scene.json)' },
        includeInteractions: { type: 'boolean', description: 'Include interaction triggers (default: true)' },
        minify: { type: 'boolean', description: 'Minify JSON output (default: false)' },
      },
    },
  },

  {
    name: 'pinepaper_export_widget_html',
    annotations: {
      title: 'Export Widget HTML',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Export current scene as a self-contained HTML page with tree-shaken PineWidget runtime.

Generates a single HTML file (<20KB typical) with inline scene data and only the JavaScript code needed for the specific items, relations, and features used. No external dependencies.

Params: title (page title), download (bool)`,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'HTML page title (default: PinePaper Widget)' },
        download: { type: 'boolean', description: 'Trigger browser download (default: false)' },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: TEMPLATE TOOL
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
- social-media, meme, business, education, creative, tech, global,
  indigenous, seasonal, masking, scenes, diagrams, maps

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
  // DOMAIN: MAP TOOLS — four action-dispatched tools replace 23 wrappers
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_map',
    annotations: {
      title: 'Map: Load + Viewport',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Load a map and control its viewport. Call action: "load" first to set up; subsequent calls control pan / zoom / config import-export.

ACTIONS:
- load           — { mapId: "usa"|"world"|"worldHighRes"|<custom>, projection?, options? }
- pan            — { lat, lon, duration? }
- zoom           — { level, duration? }
- export_config  — {}
- import_custom  — { url? | geojson?, projection? }

For region styling/selection use pinepaper_map_regions; for animations use pinepaper_map_animation; for CSV/GeoJSON/source-info use pinepaper_map_data.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['load', 'pan', 'zoom', 'export_config', 'import_custom'], description: 'Map action' },
        mapId: { type: 'string', description: 'Map identifier (load)' },
        projection: { type: 'string', description: 'Projection (load / import_custom)' },
        options: { type: 'object', description: 'Map options (load)', additionalProperties: true },
        lat: { type: 'number', description: 'Latitude (pan)' },
        lon: { type: 'number', description: 'Longitude (pan)' },
        level: { type: 'number', description: 'Zoom level (zoom)' },
        duration: { type: 'number', description: 'Animation duration (pan, zoom; default 0.5)' },
        url: { type: 'string', description: 'GeoJSON/TopoJSON URL (import_custom)' },
        geojson: { type: 'object', description: 'Inline GeoJSON (import_custom)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_map_regions',
    annotations: {
      title: 'Map: Region Styling + Selection',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Highlight, color, label, and select map regions. Requires a map loaded via pinepaper_map { action: "load" } first.

ACTIONS:
- highlight        — { regionIds: string[], color?, opacity? }
- unhighlight      — { regionIds?: string[] }              omit to clear all
- apply_colors     — { data: Record<regionId, value>, options? }   choropleth coloring
- add_marker       — { lat, lon, label?, color?, size? }
- add_labels       — { regions?: string[], style?, formatter? }
- get_at_point     — { x, y }                              region at canvas coords
- select           — { regionIds: string[] }
- deselect         — { regionIds?: string[] }              omit to deselect all
- get_highlighted  — {}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['highlight', 'unhighlight', 'apply_colors', 'add_marker', 'add_labels', 'get_at_point', 'select', 'deselect', 'get_highlighted'], description: 'Region action' },
        regionIds: { type: 'array', items: { type: 'string' } },
        color: { type: 'string' },
        opacity: { type: 'number' },
        data: { type: 'object', description: 'Region → value (apply_colors)', additionalProperties: true },
        options: { type: 'object', additionalProperties: true },
        lat: { type: 'number' },
        lon: { type: 'number' },
        label: { type: 'string' },
        size: { type: 'number' },
        regions: { type: 'array', items: { type: 'string' } },
        style: { type: 'object', additionalProperties: true },
        formatter: { type: 'string' },
        x: { type: 'number' },
        y: { type: 'number' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_map_animation',
    annotations: {
      title: 'Map: Region Animations',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Animate map regions with keyframes or wave effects.

ACTIONS:
- animate_regions  — { regions: Record<regionId, keyframes[]>, duration?, loop? }
- animate_wave     — { regions?: string[], waveDirection?, speed?, color?, duration?, loop? }
- stop             — { regionIds?: string[] }
- get_animated     — {}`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['animate_regions', 'animate_wave', 'stop', 'get_animated'], description: 'Animation action' },
        regions: { type: 'object', description: 'Keyframes per region (animate_regions) or list (animate_wave)', additionalProperties: true },
        regionIds: { type: 'array', items: { type: 'string' } },
        waveDirection: { type: 'string', enum: ['horizontal', 'vertical', 'radial'] },
        speed: { type: 'number' },
        color: { type: 'string' },
        duration: { type: 'number' },
        loop: { type: 'boolean' },
      },
      required: ['action'],
    },
  },
  {
    name: 'pinepaper_map_data',
    annotations: {
      title: 'Map: Data Import + Export',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `CSV / GeoJSON import-export and source-info introspection.

ACTIONS:
- export_csv               — { regionIds?, columns?, download?, filename? }
- import_csv               — { csv: string, mapping?: { region?, value?, color? } }
- export_geojson           — { includeStyles?, includeMetadata?, selectedOnly?, download?, filename? }
- export_original_geojson  — { download?, filename? }   source GeoJSON before styling
- source_info              — {}                          { source, projection, quality, regionCount, hasOriginalGeoJSON, isCustomImport }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['export_csv', 'import_csv', 'export_geojson', 'export_original_geojson', 'source_info'], description: 'Data action' },
        regionIds: { type: 'array', items: { type: 'string' } },
        columns: { type: 'array', items: { type: 'string' } },
        csv: { type: 'string' },
        mapping: { type: 'object', additionalProperties: true },
        includeStyles: { type: 'boolean' },
        includeMetadata: { type: 'boolean' },
        selectedOnly: { type: 'boolean' },
        download: { type: 'boolean' },
        filename: { type: 'string' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // DOMAIN: FONT TOOLS — single action-dispatched tool replaces 16 wrappers
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_font',
    annotations: {
      title: 'Font Studio',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Font Studio control — single action-dispatched tool covering the full Studio API. Sixteen previous thin wrappers collapse into this one entry to reduce the tool list footprint without losing capability.

ACTIONS:
- show_studio          — {}                          open the Font Studio UI
- set_name             — { name }                    name the in-progress font
- get_required_chars   — { set?: string }            list chars to draw (default: minimum)
- get_status           — {}                          completion status
- create_glyph         — { character, pathId }       attach a path as a glyph
- create_space         — { width? }                  create a space glyph
- remove_glyph         — { character }
- set_metrics          — { metrics: { unitsPerEm?, ascender?, descender?, xHeight?, capHeight? } } (or top-level keys)
- export               — { download?: boolean }      export as OTF
- load_into_document   — {}                          load the font for use in this canvas
- export_data          — { download?: boolean }      export as JSON
- import_data          — { data: object }            import from JSON
- clear                — {}                          reset everything
- remove_overlap       — { pathId }                  path cleanup
- correct_direction    — { pathId }                  path cleanup
- cleanup_path         — { pathId, removeOverlap?, correctDirection?, smooth?, smoothTolerance? }`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'show_studio', 'set_name', 'get_required_chars', 'get_status',
            'create_glyph', 'create_space', 'remove_glyph', 'set_metrics',
            'export', 'load_into_document', 'export_data', 'import_data',
            'clear', 'remove_overlap', 'correct_direction', 'cleanup_path',
          ],
          description: 'Font Studio action',
        },
        name: { type: 'string', description: 'Font name (set_name)' },
        set: { type: 'string', description: 'Character set name (get_required_chars; default "minimum")' },
        character: { type: 'string', description: 'Single-character glyph identifier (create_glyph, remove_glyph)' },
        pathId: { type: 'string', description: 'Item id of the path source (create_glyph, remove_overlap, correct_direction, cleanup_path)' },
        width: { type: 'number', description: 'Space-glyph width (create_space)' },
        download: { type: 'boolean', description: 'Trigger browser download (export, export_data); default true' },
        metrics: {
          type: 'object',
          description: 'Font metrics (set_metrics)',
          properties: {
            unitsPerEm: { type: 'number' },
            ascender: { type: 'number' },
            descender: { type: 'number' },
            xHeight: { type: 'number' },
            capHeight: { type: 'number' },
          },
        },
        data: { type: 'object', description: 'Font JSON payload (import_data)' },
        removeOverlap: { type: 'boolean', description: 'cleanup_path option' },
        correctDirection: { type: 'boolean', description: 'cleanup_path option' },
        smooth: { type: 'boolean', description: 'cleanup_path option (default true)' },
        smoothTolerance: { type: 'number', description: 'cleanup_path tolerance (default 2.5)' },
      },
      required: ['action'],
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

GENERATORS (15 total):

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
- drawNoiseTexture: Perlin/grain/stipple noise (noiseType: perlin|grain|stipple, colors, scale, density, animated)

New — Tech:
- drawGlobeWireframe: Vercel-style wireframe globe (bgColor, wireColor, glowColor, highlightColor, meridianCount, latitudeCount, globeRadius, nodeCount, nodeSize, animationEnabled, animationSpeed, strokeWidth, gridOpacity)

PineMath — Math/Science:
- drawFunctionPlot: Plot y=f(x) (expression, xMin, xMax, yMin, yMax, color, lineWidth, showAxes, showGrid, steps, animate: none|scroll-right|scroll-left|oscillate|bounce|wipe|custom)
- drawParametricCurve: Plot (x(t),y(t)) Lissajous/spirals/roses (xExpression, yExpression, tMin, tMax, color, steps, scale, animate: none|linear|slow|fast|wave|bounce, trailFade)
- drawSimulation: Dynamic systems with ODE solvers (preset: pendulum|springMass|lorenz|doublePendulum|vanderpol, solver: euler|rk4|rk45, timeScale, showTrail, trailLength, trailColor, objectColor)
- drawSpectrumAnalyzer: FFT signal visualization (waveform: sine|square|sawtooth|triangle|noise|composite, frequency, amplitude, sampleRate, window: none|hann|hamming|blackman, waveColor, spectrumColor)
- draw3DSurface: 3D surfaces from equations (preset: torus|sphere|wave|klein|mobius|custom, xExpr, yExpr, zExpr, uSteps, vSteps, scale, rotateSpeed)

COMMON PARAMS (all generators):
- bgColor: Background color ("none"/"transparent" for no background)
- interactive: Make generated items selectable/draggable (default false)
- clipToCanvas: Clip output to canvas bounds (default true, set false for overflow)`,
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
            'drawGlobeWireframe',
            'drawFunctionPlot', 'drawParametricCurve', 'drawSimulation',
            'drawSpectrumAnalyzer', 'draw3DSurface',
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
- Creating burst/explosion, fire, smoke effects
- Weather effects (rain, snow)
- Celebration effects (confetti)
- Enhancing visual impact (ripple, glow, electric)

EFFECTS (15 total):
- sparkle: Glitter/sparkle particles (color, speed, size)
- blast: Explosion burst effect (color, radius, count)
- smoke: Rising smoke plumes (color, speed, size, drift, height, growthRate)
- fire: Animated fire/flames (color, colors, speed, size, height, turbulence)
- rain: Falling rain drops (color, count, speed, angle, spread)
- snow: Falling snowflakes (color, count, speed, spread, particleLife)
- confetti: Celebration confetti (colors, count, radius, gravity, size, spread, interval, repeat)
- ripple: Expanding ring ripples (color, speed, maxRadius, ringCount, strokeWidth)
- glow: Pulsing glow aura (color drives the shadow halo; speed, intensity, size; optional fill — interior tint decoupled from color; fillOpacity 0..1 multiplies intensity opacity)
- electric: Lightning bolts (color, speed, boltCount, length, flickerRate)
- bubbles: Rising transparent bubbles (color drives the rim; count, speed, size, spread; optional fill — interior tint, default null = outlined-only; fillOpacity 0..1, default 0.25 when fill is set)
- dust: Ambient drifting motes (color, count, speed, size, spread)
- fireflies: Glowing wandering dots (color, count, speed, size, spread)
- shockwave: Expanding concentric rings — burst type (speed, maxRadius, count, thickness)
- trail: Fading afterimages following movement (speed, count, size, fadeRate)

EXAMPLE — bubbles with magenta interior over a blue rim:
{ effectType: "bubbles", params: { color: "#93c5fd", fill: "#ff00aa", fillOpacity: 0.4 } }`,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Registry ID of the item' },
        effectType: {
          type: 'string',
          enum: ['sparkle', 'blast', 'smoke', 'fire', 'rain', 'snow', 'confetti', 'ripple', 'glow', 'electric', 'bubbles', 'dust', 'fireflies', 'shockwave', 'trail'],
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
    description: `Connect to PinePaper Studio in a browser. Auto-connects headless on first tool call. Call with headless: false to show the browser window, or headless: true to hide it. Can be called mid-session to toggle visibility.`,
    inputSchema: {
      type: 'object',
      properties: {
        headless: {
          type: 'boolean',
          description: 'Run in headless mode (default: false when explicitly called)',
        },
        url: {
          type: 'string',
          description: 'Studio URL to connect to (e.g. "http://localhost:3000" for local dev). Must be http:// or https:// — file:/data:/javascript: are rejected. Overrides the PINEPAPER_STUDIO_URL env var and the prod default. "/editor" and agent-mode params are added automatically. Passing a URL with a different origin/pathname reconnects.',
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
          enum: ['validation', 'code_generation', 'browser_execution', 'screenshot', 'total', 'response_size'],
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
  // INFRASTRUCTURE: DIAGNOSTIC REPORT
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_diagnostic_report',
    annotations: {
      title: 'Generate Diagnostic Report',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `[Utility] Generate a diagnostic report for bug reporting. Collects server config, browser state, session history, canvas snapshot, performance metrics, and token usage estimates into a JSON file.

USE WHEN:
- User encounters an error or unexpected behavior
- Filing a bug report and need debugging context
- Troubleshooting performance or connection issues
- Checking token consumption per tool call to optimize costs

RETURNS:
- JSON file saved to disk with full diagnostic data
- Summary text with key state information
- Token usage breakdown: estimated response tokens per tool, top consumers, total payload size

PRIVACY: No screenshots, no tool call arguments, no user content — only structural/timing data.`,
    inputSchema: {
      type: 'object',
      properties: {
        includeMetrics: {
          type: 'boolean',
          description: 'Include performance metrics (default: true)',
        },
        includeCanvas: {
          type: 'boolean',
          description: 'Include canvas state snapshot (default: true)',
        },
        metricsLimit: {
          type: 'number',
          description: 'Max metrics entries to include (default: 100)',
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
      title: 'Create Animation/Video/Graphic — Start Here',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Start a new agent job for creating animations, videos, graphics, or any visual content. Do NOT generate HTML or React — use PinePaper tools instead.

⚠️ Call ONCE per pipeline. NEVER restart — creates duplicates.

WORKFLOW: start_job → batch_execute (everything in ONE call) → end_job (screenshot) → show user → iterate if needed.

RETURNS: canvasSize {width, height} — use this to position items within bounds. Also returns ontology: a pp: triples + item summary snapshot of the (typically empty) canvas. Reuse this baseline across the same agent turn instead of calling pinepaper_get_canvas_ontology unless you've mutated the canvas. When clearCanvas is false, the ontology captures whatever's already on the canvas.

CANVAS PRESETS: instagram (1080x1080), instagram-story (1080x1920), tiktok (1080x1920), youtube (1920x1080), youtube-thumbnail (1280x720), twitter (1200x675), linkedin (1200x627), web, print-a4, print-letter`,
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Optional job name for tracking',
        },
        description: {
          type: 'string',
          description: 'Pass the user\'s request/prompt here for creative direction',
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
        includeOntology: {
          type: 'boolean',
          description: 'Include canvas ontology snapshot in the result (default: true). Pre-bundles a pp: triples baseline so the agent can reason about composition without a follow-up pinepaper_get_canvas_ontology call.',
        },
      },
    },
  },

  {
    name: 'pinepaper_agent_end_job',
    annotations: {
      title: 'Finish & Show Screenshot to User',
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
      title: 'Build Scene — Items, Animations, Effects in One Call',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Execute ALL operations in a single call for building animated scenes — canvas setup, backgrounds, items, animations, masks, effects, and playback.

NOTE: For diagrams (flowcharts, UML), use pinepaper_create_diagram_shape + pinepaper_connect instead.

⚠️ EVERY operation executes LIVE on the canvas. Calling this twice DOUBLES all items. Call ONCE per pipeline.

⚠️ SIZING: All positions/sizes MUST fit within the canvas. start_job returns canvasSize. Keep items within 5%-95% of canvas width/height. Max canvas: 4096x4096.

ONTOLOGY PREFLIGHT: Before code generation, this tool validates itemType, relationType, effectType, and generatorName against the canonical PinePaper vocabulary. A typo (e.g. "circel") returns a structured VALIDATION_ERROR with the operation index, the offending field, the canonical valid list, and a suggested fix — fix and retry rather than guessing. Pass skipValidation: true to bypass when intentionally using experimental vocabulary.

WORKFLOW:
1. pinepaper_agent_start_job → 2. pinepaper_agent_batch_execute (everything) → 3. pinepaper_agent_end_job (screenshot for validation)
After validation: user reviews screenshot → feedback → modify/recreate as needed.

OPERATION TYPES (12) — use in this order:

CANVAS SETUP:
  set_canvas_size — {width, height} or {preset: "instagram"|"youtube"|"tiktok"|...}
  set_background — {backgroundColor: "#hex"}
  execute_generator — {generatorName, generatorParams} → fills canvas with procedural art
    Generators: drawBokeh, drawGradientMesh, drawWaves, drawSunburst, drawSunsetScene, drawGrid, drawCircuit, drawPattern, drawStackedCircles, drawGeometricAbstract, drawWindField, drawFluidFlow, drawOrganicFlow, drawNoiseTexture, drawGlobeWireframe
    PineMath: drawFunctionPlot (y=f(x) plots), drawParametricCurve (x(t),y(t)), drawSimulation (pendulum, Lorenz, spring-mass), drawSpectrumAnalyzer (FFT), draw3DSurface (torus, sphere, Klein bottle)

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
    animationType: ${SIMPLE_ANIMATION_TYPES_LIST}
  keyframe_animate — Timed animation: {itemId, keyframes: [{time, properties, easing}], duration, loop}
    Animatable properties: opacity, scale, scaleX, scaleY, x, y, rotation, fillColor, strokeColor, fontSize
    Easing: easeInOut, easeIn, easeOut, easeInCubic, easeOutCubic, easeOutBounce, linear
  relation — Behavioral link: {sourceId, targetId, relationType, relationOptions}
    relationType: orbits, follows, attached_to, points_at, mirrors, parallax, wave_through, morphs_to, group_morphs_to, moves_along_path (+ 9 more in schema)

EFFECTS:
  apply_mask — Reveal effect: {itemId, maskPreset, maskOptions}
    maskPreset: wipeLeft, wipeRight, wipeUp, wipeDown, iris, irisOut, star, heart, curtainHorizontal, curtainVertical, cinematic, diagonalWipe, revealUp, revealDown
  apply_effect — Visual effect: {itemId, effectType, effectParams}
    effectType: ${EFFECT_TYPES_LIST}

PLAYBACK:
  play_timeline — {action: "play"|"stop"|"seek", duration, loop}

VARIABLE REFERENCES: "$0", "$1" etc. reference items by creation order within the batch. Place ALL create ops before any ops that reference them so the indices stay stable.

ANIMATION NOTES:
- keyframe_animate position accepts [x, y] or { x, y } (normalized). fillColor/strokeColor accept rgba() for alpha. The create "opacity" and "blendMode" props are applied to the item.
- For MP4/GIF export the keyframe timeline is rendered once across the duration; author motion to fill the clip and use loop:false. Looping item-animations (loop:true) are not advanced by the exporter and render frozen.

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
              width: { type: 'number', description: 'Canvas width for set_canvas_size (100-4096)' },
              height: { type: 'number', description: 'Canvas height for set_canvas_size (100-4096)' },
              preset: { type: 'string', description: 'Canvas preset for set_canvas_size' },
              backgroundColor: { type: 'string', description: 'For set_background: hex color' },
              generatorName: {
                type: 'string',
                enum: ['drawSunburst', 'drawSunsetScene', 'drawGrid', 'drawWaves', 'drawCircuit', 'drawStackedCircles', 'drawPattern', 'drawBokeh', 'drawGradientMesh', 'drawGeometricAbstract', 'drawWindField', 'drawFluidFlow', 'drawOrganicFlow', 'drawNoiseTexture', 'drawGlobeWireframe'],
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
                enum: ['orbits', 'follows', 'attached_to', 'points_at', 'mirrors', 'parallax', 'animates', 'grows_from', 'staggered_with', 'wave_through', 'circumscribes', 'morphs_to', 'group_morphs_to', 'moves_along_path', 'maintains_distance', 'bounds_to', 'indicates', 'camera_follows', 'camera_animates'],
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
                enum: ['sparkle', 'blast', 'smoke', 'fire', 'rain', 'snow', 'confetti', 'ripple', 'glow', 'electric', 'bubbles', 'dust', 'fireflies', 'shockwave', 'trail'],
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
        skipValidation: {
          type: 'boolean',
          description: 'Skip the ontology preflight that catches vocabulary typos before browser execution (default: false). Only set true when knowingly using experimental values.',
        },
      },
      required: ['operations'],
    },
  },

  {
    name: 'pinepaper_agent_export',
    annotations: {
      title: 'Export as MP4 Video, GIF, PNG, SVG, or PDF',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Smart export with automatic format detection and platform optimization.

PLATFORMS & OPTIMAL FORMATS:
| Platform        | Dimensions | Static | Animated |
|-----------------|------------|--------|----------|
| instagram       | 1080x1080  | PNG    | MP4      |
| instagram-story | 1080x1920  | PNG    | MP4      |
| tiktok          | 1080x1920  | PNG    | MP4@60fps|
| youtube         | 1920x1080  | PNG    | MP4      |
| twitter         | 1200x675   | PNG    | GIF      |
| web             | flexible   | SVG    | SVG      |

FORMATS: svg, png, gif, mp4, webm, pdf.
QUALITY: draft, standard, high.
FRAMING: canvas (default, full canvas) | camera (camera_animates first-keyframe viewport — video formats only, requires a keyframe-mode walkthrough on the canvas; camera animation still drives motion within the fixed output frame).

⚠️ If export fails, do NOT retry with different formats — report the error to the user.
⚠️ When user asks for "video", always use format: "mp4".

EXAMPLES:
- {platform: "instagram"} — auto-selects best format
- {platform: "instagram", format: "mp4"} — force MP4
- {platform: "web", format: "svg"} — animated SVG
- {platform: "youtube", format: "mp4", framing: "camera"} — render only what the camera frames during the walkthrough`,
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
        framing: {
          type: 'string',
          enum: ['canvas', 'camera'],
          description: 'Output framing. "canvas" (default) renders the full canvas. "camera" renders only the first-keyframe viewport of a camera_animates walkthrough — video formats only.',
        },
        duration: {
          type: 'number',
          minimum: 0.5,
          maximum: 60,
          description: 'Video duration in seconds for mp4/webm/gif (default 5, max 60). Static formats ignore this. If you set play_timeline to N seconds, pass the same N here.',
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

  // ---------------------------------------------------------------------------
  // ONTOLOGY TOOLS (Design Knowledge Graph)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_get_canvas_ontology',
    annotations: {
      title: 'Get Canvas Ontology',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Capture the live canvas as compact pp: ontology triples + a structured item summary.

USE THIS instead of pinepaper_get_items when you need to REASON about composition (what's on the canvas, how items relate, what's animated). Typical scenes shrink 3-10× compared to a raw item dump while preserving relations, animations, effects, masks, and collage styling.

OUTPUT (a snapshot of FxTool's canvas state):
- canvasWidth, canvasHeight, canvasPreset
- itemCount, itemTypes ([unique]), hasAnimations, relationCount
- items: capped item summaries with positions, colors, group structure, collage metadata, keyframes, effects, deformations
- triples: a TripleLanguage-serialized pp: triple block (compact tokenized form). Read this for structural reasoning.
- viewport (when includeViewport: true): zoom + center + hasCameraAnimation flag

OPTIONS:
- maxItems (default 50): cap on item summaries. Larger scenes are truncated, not paginated — pinepaper_query_ontology and pinepaper_get_items remain available for full enumeration.
- maxChildren (default 10): cap on per-group child summaries.
- includeViewport (default false): include zoom/pan/camera-animation flag.

NOTE: Requires FxTool with the canvas-ontology promotion. Returns { success: false, error } with a clear hint when running against an older build.`,
    inputSchema: {
      type: 'object',
      properties: {
        maxItems: { type: 'number', description: 'Cap on item summaries (default 50, max 500).' },
        maxChildren: { type: 'number', description: 'Cap on per-group child summaries (default 10, max 50).' },
        includeViewport: { type: 'boolean', description: 'Include zoom/pan/camera-animation state (default false).' },
      },
    },
  },

  {
    name: 'pinepaper_analyze_design',
    annotations: {
      title: 'Analyze Design',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Analyze a template or scene definition using the PinePaper Design Knowledge Graph.

Extracts a typed graph with pp: namespace nodes, edges, patterns, math functions, semantic metadata, and a structural fingerprint. Also produces a JSON-LD export.

INPUT: A template definition object with { id, name, category, data: { items: [...], relations: [...] } }

RETURNS: Graph analysis including node/edge type counts, detected patterns (orbitalComposition, staggeredReveal, maskReveal, etc.), math functions used, semantic inference (mood, intent, audience, contentType), and JSON-LD.

USE WHEN:
- Understanding the structural composition of a design
- Comparing design complexity before/after changes
- Generating metadata for design catalogs`,
    inputSchema: {
      type: 'object',
      properties: {
        definition: {
          type: 'object',
          description: 'Template or scene definition object',
        },
      },
      required: ['definition'],
    },
  },
  {
    name: 'pinepaper_validate_design',
    annotations: {
      title: 'Validate Design',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Validate and score a template definition against the PinePaper ontology.

Two-phase analysis:
1. Schema validation — checks required fields, known item/relation types, keyframe structure, semantic vocabulary compliance
2. Quality scoring — rates across 5 dimensions: completeness (0.20), animationDesign (0.25), semanticRichness (0.20), compositionUse (0.15), structuralDepth (0.20)

Quality tiers: basic (<0.4), fair (0.4-0.6), good (0.6-0.8), excellent (>=0.8)

USE WHEN:
- Checking a template for structural issues before publishing
- Comparing quality scores between template variants
- Validating that all item/relation types are in the vocabulary`,
    inputSchema: {
      type: 'object',
      properties: {
        definition: {
          type: 'object',
          description: 'Template or scene definition object to validate',
        },
      },
      required: ['definition'],
    },
  },

  {
    name: 'pinepaper_query_ontology',
    annotations: {
      title: 'Query Ontology',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Query the PinePaper design knowledge graph — explore types, properties, edges, hierarchy, and patterns.

USE WHEN:
- Discovering available item types, relation types, or generators
- Checking what properties a type supports and which are animatable
- Navigating the type hierarchy (parent/child relationships)
- Understanding how types relate to each other

QUERIES (14):
Listing:
- list_types: All item types (filter by category, includeAbstract)
- list_edges: All relation/edge types (filter by category)
- list_generators: All background generators (filter by category)
- list_effects: All visual effect types
- list_patterns: All detected design patterns
- list_math_functions: All math functions used in animations

Hierarchy:
- type_hierarchy: Ancestry chain for a ppType (e.g. pp:Circle → pp:CanvasShape → pp:CanvasElement)
- type_children: Direct subtypes of a ppType
- is_subtype: Check if typeA is a subtype of typeB

Properties:
- type_properties: All properties for a ppType (inherited + direct)
- animatable_properties: Only animatable properties for a ppType

Lookup:
- node_type: Map an itemType string (e.g. "circle") to its pp: type
- edge_type: Map a relationName string (e.g. "orbits") to its pp: edge
- edge_info: Full metadata for an edge type`,
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          enum: [
            'list_types', 'list_edges', 'list_generators', 'list_effects',
            'list_patterns', 'list_math_functions',
            'type_hierarchy', 'type_children', 'type_properties', 'animatable_properties',
            'is_subtype', 'edge_info', 'node_type', 'edge_type',
          ],
          description: 'Query type',
        },
        ppType: { type: 'string', description: 'pp: namespaced type (e.g. "pp:Circle") — for hierarchy/property queries' },
        itemType: { type: 'string', description: 'PinePaper item type string (e.g. "circle") — for node_type lookup' },
        relationName: { type: 'string', description: 'Relation name (e.g. "orbits") — for edge_type/edge_info lookup' },
        typeA: { type: 'string', description: 'First type for is_subtype check' },
        typeB: { type: 'string', description: 'Second type (ancestor) for is_subtype check' },
        category: { type: 'string', description: 'Filter by category for list queries' },
        includeAbstract: { type: 'boolean', description: 'Include abstract types in list_types (default: false)' },
      },
      required: ['query'],
    },
  },

  // ---------------------------------------------------------------------------
  // ON-DEMAND TOOL GUIDE (RLM-inspired — query detailed docs in minimal mode)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_tool_guide',
    annotations: {
      title: 'Tool Guide',
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Get detailed guidance for PinePaper tools on demand.

USE WHEN: You need full parameter docs, examples, or workflow guidance — especially in minimal verbosity mode where tool descriptions are short summaries.

PREFER RESOURCES WHERE POSSIBLE: The full AI Agent Guide is also available via the MCP resources API at pinepaper://docs/agent-guide — clients that support resources should pull it that way rather than calling this tool. Per-domain references live at pinepaper://docs/{generators,relations,masks,diagrams,maps,effects-and-filters,fonts,custom-paths,paperjs-in-pinepaper,templates,customization,getting-started}. Use this tool when the client doesn't support resources or when you want a specific tool's verbose description.

MODES:
- No args → returns the full AI Agent Guide (same content as pinepaper://docs/agent-guide)
- tool: "pinepaper_agent_batch_execute" → returns that tool's full verbose description
- category: "animation" → returns all tools in that category with full descriptions

CATEGORIES: agent, browser, canvas, core, import, assets, batch, relations, animation, masks, camera, generators, effects, filters, scene, template, query, export, diagram, map, font, letter_collage, triggers, quiz, performance, custom_code, p5, register, guide`,
    inputSchema: {
      type: 'object',
      properties: {
        tool: {
          type: 'string',
          description: 'Tool name to get detailed description for (e.g., "pinepaper_agent_batch_execute")',
        },
        category: {
          type: 'string',
          description: 'Category/tag name to list all tools with descriptions (e.g., "animation", "map")',
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // RUNTIME TOOLKIT SWITCHING
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_set_toolkit',
    annotations: {
      title: 'Set Toolkit',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Switch the active toolkit profile and/or verbosity level at runtime. The tools/list updates immediately.

USE WHEN:
- You need diagram tools but are on the 'agent' profile → switch to 'diagram' or 'full'
- You need map tools → switch to 'map' or 'full'
- You want more/less detail in tool descriptions → switch verbosity

PROFILES:
- full: All 120+ tools
- agent: Core creative tools (~50 tools) — default
- diagram: Diagram/flowchart tools
- map: Map/choropleth tools
- font: Font creation tools
- minimal: Bare essentials (~15 tools)

VERBOSITY:
- verbose: Full descriptions
- compact: Shorter descriptions for 13 largest tools — default
- minimal: 1-line summaries (use pinepaper_tool_guide for details)`,
    inputSchema: {
      type: 'object',
      properties: {
        toolkit: {
          type: 'string',
          description: 'Toolkit profile: full, agent, diagram, map, font, minimal',
          enum: ['full', 'agent', 'diagram', 'map', 'font', 'minimal'],
        },
        verbosity: {
          type: 'string',
          description: 'Description verbosity: verbose, compact, minimal',
          enum: ['verbose', 'compact', 'minimal'],
        },
      },
    },
  },

  // ---------------------------------------------------------------------------
  // DATA VISUALIZATION (CHARTS)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_create_chart',
    annotations: {
      title: 'Create Chart',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Create and manage data visualizations on the canvas.

ACTIONS:
- create: Create a chart. Params: chartType, data (array of objects), options
- update: Update chart data. Params: chartId, data, options
- reconfigure: Change chart styling. Params: chartId, options
- remove: Delete a chart. Params: chartId

CHART TYPES: bar, line, scatter, area

DATA FORMAT: Array of objects, e.g. [{category: "A", value: 10}, {category: "B", value: 20}]

OPTIONS (vary by chart type):
- Common: title, width, height, x, y, colors, animation, axisColor, labelColor, labelFontSize
- Bar: barWidth, barGap, xLabel, yLabel
    orient: 'horizontal' flips bars to grow rightward from a left Y-axis — best for long category names
    labelArrangement: 'auto'|'horizontal'|'slanted'|'vertical'|'truncate'|'wrap'
      auto      — smart: measures widest label and picks horizontal → slanted (−45°) → vertical (−90°) by slot width
      slanted   — force −45° rotation
      vertical  — force −90° rotation
      truncate  — ellipsis when label exceeds slot (uses ctx.measureText; override char cap with labelTruncateMaxChars)
      wrap      — split on last space before midpoint, up to two lines
    Bottom-margin is capped at 25% (slanted) / 35% (vertical) of chart height, so changing labelFontSize shifts labels inside a stable budget rather than shrinking the bars.
- Line: lineColor, lineWidth, xLabel, yLabel
- Scatter: dotColor, dotRadius
- Area: fillColor, lineColor, lineWidth

Data field mapping: use xField/yField in options to specify which data keys to use for axes.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['create', 'update', 'reconfigure', 'remove'],
          description: 'Chart action',
        },
        chartType: {
          type: 'string',
          enum: ['bar', 'line', 'scatter', 'area'],
          description: 'Chart type (for create)',
        },
        chartId: { type: 'string', description: 'Chart ID (for update/reconfigure/remove)' },
        data: {
          type: 'array',
          items: { type: 'object' },
          description: 'Data array of objects (for create/update)',
        },
        options: {
          type: 'object',
          description: 'Chart options (colors, title, dimensions, field mapping, animation)',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // MAGIC SYSTEM
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_magic',
    annotations: {
      title: 'Magic',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Ontology-aware auto-animation and style remixing.

ACTIONS:
- animate: Apply mood-driven animations, effects, and deformations. Params: mood, selectionOnly
- remix: Non-destructive style cycling (colors, fonts, shadows). Params: selectionOnly

MOODS: calm, professional, energetic, dramatic, whimsical

The magic system analyzes canvas content via the design graph, selects type-appropriate treatments (animations for shapes, collage for text, filters for images), and tracks provenance.`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['animate', 'remix'],
          description: 'Magic action',
        },
        mood: {
          type: 'string',
          enum: ['calm', 'professional', 'energetic', 'dramatic', 'whimsical'],
          description: 'Energy/mood for animation selection',
        },
        selectionOnly: { type: 'boolean', description: 'Only affect selected items (default: false)' },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // PHYSICS (RIGID BODY SIMULATION)
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_physics',
    annotations: {
      title: 'Physics',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
    description: `Rigid body physics simulation (Box2D/Planck.js).

ACTIONS:
- init: Start physics world. Params: gravity ({x, y}, default {x:0, y:980})
- add_body: Register item as physics body. Params: itemId, bodyType (static|dynamic|kinematic), mass, friction, restitution, fixedRotation, shape (auto|circle|rect)
- remove_body: Remove from physics. Params: itemId
- apply_force: Continuous force in px/s². Params: itemId, force ({x, y})
- apply_impulse: Instant velocity change. Params: itemId, impulse ({x, y})
- set_velocity: Set linear velocity. Params: itemId, velocity ({x, y})
- get_state: Get body position/velocity/rotation. Params: itemId
- create_ground: Static floor plane. Params: y, width
- create_joint: Connect two bodies. Params: itemId, targetItemId, jointType (revolute|distance|weld|prismatic), jointParams`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['init', 'add_body', 'remove_body', 'apply_force', 'apply_impulse', 'set_velocity', 'get_state', 'create_ground', 'create_joint'],
          description: 'Physics action',
        },
        itemId: { type: 'string', description: 'Target item ID' },
        gravity: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Gravity vector (for init)',
        },
        bodyType: {
          type: 'string',
          enum: ['static', 'dynamic', 'kinematic'],
          description: 'Physics body type',
        },
        mass: { type: 'number', description: 'Body mass (default: 1)' },
        friction: { type: 'number', description: 'Surface friction (default: 0.3)' },
        restitution: { type: 'number', description: 'Bounciness 0-1 (default: 0.3)' },
        fixedRotation: { type: 'boolean', description: 'Prevent rotation' },
        shape: { type: 'string', enum: ['auto', 'circle', 'rect'], description: 'Collision shape (default: auto)' },
        force: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Force vector in px/s²',
        },
        impulse: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Impulse vector',
        },
        velocity: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Velocity vector',
        },
        y: { type: 'number', description: 'Ground Y position' },
        width: { type: 'number', description: 'Ground width' },
        targetItemId: { type: 'string', description: 'Second item for joint' },
        jointType: {
          type: 'string',
          enum: ['revolute', 'distance', 'weld', 'prismatic'],
          description: 'Joint type',
        },
        jointParams: {
          type: 'object',
          description: 'Joint-specific parameters (anchor, enableMotor, motorSpeed, etc.)',
        },
      },
      required: ['action'],
    },
  },

  // ---------------------------------------------------------------------------
  // MEASUREMENT SYSTEM
  // ---------------------------------------------------------------------------
  {
    name: 'pinepaper_measurement',
    annotations: {
      title: 'Measurement',
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    description: `Rulers, grid overlay, snap-to-grid, and dimension readout.

ACTIONS:
- set_rulers: Show/hide rulers. Params: enabled (bool)
- set_grid: Show/hide unit grid. Params: enabled (bool)
- get_dimensions: Get item bounds. Params: itemId → returns {x, y, width, height, rotation}
- set_snap: Enable/disable snap-to-grid. Params: enabled (bool)`,
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['set_rulers', 'set_grid', 'get_dimensions', 'set_snap'],
          description: 'Measurement action',
        },
        enabled: { type: 'boolean', description: 'Enable/disable (for set_rulers, set_grid, set_snap)' },
        itemId: { type: 'string', description: 'Item ID (for get_dimensions)' },
      },
      required: ['action'],
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

/**
 * Tool description verbosity level.
 * - 'verbose': Full descriptions (~42K tokens for full toolkit)
 * - 'compact': Trimmed descriptions for the 13 largest tools (~37K tokens)
 * - 'minimal': 1-line summaries for all tools (~22K tokens). Use pinepaper_tool_guide for details.
 */
export type ToolVerbosity = 'verbose' | 'compact' | 'minimal';

/**
 * Get tools with the specified verbosity level.
 * Compact mode swaps in shorter descriptions for the 13 largest tools.
 * Minimal mode swaps in 1-line summaries for ALL tools (on-demand guide available).
 */
export function getToolsForVerbosity(verbosity: ToolVerbosity): Tool[] {
  if (verbosity === 'verbose') return PINEPAPER_TOOLS;

  const descMap = verbosity === 'minimal' ? MINIMAL_DESCRIPTIONS : COMPACT_DESCRIPTIONS;
  return PINEPAPER_TOOLS.map(tool => {
    const replacement = descMap[tool.name];
    return replacement ? { ...tool, description: replacement } : tool;
  }) as Tool[];
}
