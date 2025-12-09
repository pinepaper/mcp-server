/**
 * PinePaper MCP Server
 *
 * Main server implementation that exposes PinePaper tools via the Model Context Protocol.
 *
 * This server can operate in two modes:
 * 1. Local (stdio): For Claude Desktop and local AI agents
 * 2. Cloud (SSE/HTTP): For cloud-hosted premium features (future)
 *
 * Supports i18n for 41 locales matching PinePaper Studio.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { PINEPAPER_TOOLS, getLocalizedTools } from './tools/definitions.js';
import { handleToolCall } from './tools/handlers.js';
import {
  I18nManager,
  initI18n,
  SupportedLocale,
  DEFAULT_LOCALE,
} from './i18n/index.js';

// =============================================================================
// SERVER INFO
// =============================================================================

const SERVER_INFO = {
  name: 'pinepaper-mcp',
  version: '1.0.0',
  description: 'MCP Server for PinePaper Studio - Create animated graphics with AI',
};

// =============================================================================
// RESOURCES (Documentation & Examples)
// =============================================================================

const RESOURCES = [
  {
    uri: 'pinepaper://docs/getting-started',
    name: 'Getting Started Guide',
    description: 'Introduction to PinePaper MCP tools',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/relations',
    name: 'Relations Guide',
    description: 'How to use relations for behavior-driven animation',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/generators',
    name: 'Background Generators',
    description: 'Available procedural background generators',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/custom-paths',
    name: 'Custom Paths Guide',
    description: 'Advanced path creation with SVG, Paper.js paths, and animations',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/mathematical-patterns',
    name: 'Mathematical Patterns',
    description: 'Create spirals, waves, fractals, geometric patterns, and physics simulations',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/effects-and-filters',
    name: 'Effects & Filters Guide',
    description: 'Complete reference for visual effects, filters, and post-processing',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/interactive-animations',
    name: 'Interactive Animations',
    description: 'Create game-like behaviors with follows, bounds, and dynamic interactions',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://docs/paperjs-in-pinepaper',
    name: 'Paper.js in PinePaper',
    description: 'Write Paper.js code directly in PinePaper - API reference and examples',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://examples/solar-system',
    name: 'Solar System Example',
    description: 'Create an animated solar system with custom paths, orbital rings, and planetary details',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://examples/logo-animation',
    name: 'Logo Animation Example',
    description: 'Animate a company logo with entrance effects and continuous motion',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://examples/data-visualization',
    name: 'Data Visualization Example',
    description: 'Create animated charts, graphs, and infographics',
    mimeType: 'text/markdown',
  },
  {
    uri: 'pinepaper://examples/particle-systems',
    name: 'Particle Systems Example',
    description: 'Build particle effects like fireworks, snow, and starfields',
    mimeType: 'text/markdown',
  },
];

const RESOURCE_CONTENTS: Record<string, string> = {
  'pinepaper://docs/getting-started': `# Getting Started with PinePaper MCP

## Overview

PinePaper is a canvas-based animation tool. This MCP server lets you create and animate graphics using natural language.

## Quick Start

1. **Connect to browser**: Use \`pinepaper_browser_connect\` to launch PinePaper Studio
2. **Clear the canvas**: Use \`pinepaper_clear_canvas\` or \`pinepaper_refresh_page\` to start fresh
3. **Create items**: Use \`pinepaper_create_item\` to add text, shapes, or graphics
4. **Add animation**: Use \`pinepaper_add_relation\` for behavior-based animation
5. **Verify**: Use \`pinepaper_browser_screenshot\` to see your work
6. **Export**: Use \`pinepaper_export_svg\` to save your work

## IMPORTANT: Welcome Template

First-time visitors to PinePaper Studio see a **welcome template** with example items on the canvas. Before creating your own content:

### To Clear the Welcome Template:
- **Option 1**: Use \`pinepaper_clear_canvas\` to remove all items
- **Option 2**: Use \`pinepaper_refresh_page\` to reload the page (most reliable)
- After clearing, verify with \`pinepaper_get_items\` that the canvas is empty

The welcome template only appears once. After refreshing or clearing, it won't appear again.

## Key Concepts

### Items
Everything on the canvas is an item with a registry ID (e.g., "item_1"). Use this ID to reference items in other operations.

**Creating Items:**
- Use \`pinepaper_create_item\` with \`itemType\` (text, circle, star, rectangle, etc.)
- Specify \`position\` as {x, y} coordinates
- Add \`properties\` for styling (color, fontSize, radius, etc.)

### Relations (Primary Animation Method)
Relations describe HOW items behave relative to each other. This is the **recommended way** to create animations:
- \`orbits\`: Circular motion around another item
- \`follows\`: Move toward another item with smoothing
- \`attached_to\`: Fixed offset from parent item
- \`points_at\`: Rotate to face another item
- \`maintains_distance\`: Keep fixed distance from target

**Verifying Animations:**
After adding a relation, use \`pinepaper_browser_screenshot\` to verify the animation is working. Check that:
1. Items are positioned correctly
2. Animation is visibly moving (take multiple screenshots at intervals)
3. The relation appears in \`pinepaper_query_relations\`

### Deleting Items
- Use \`pinepaper_delete_item\` with the item's registry ID
- Use \`pinepaper_get_items\` first to find item IDs
- If deletion fails, try \`pinepaper_clear_canvas\` to remove everything

### Generators
Procedural backgrounds like sunburst, waves, grid patterns.

## Example Workflow

\`\`\`
1. Connect: pinepaper_browser_connect
2. Clear canvas: pinepaper_clear_canvas (removes welcome template)
3. Verify empty: pinepaper_get_items (should return count: 0)
4. Create sun: pinepaper_create_item type=circle, color=#fbbf24, radius=60
5. Create earth: pinepaper_create_item type=circle, color=#3b82f6, radius=20
6. Add orbit: pinepaper_add_relation earth orbits sun, radius=150
7. Screenshot: pinepaper_browser_screenshot (verify animation)
\`\`\`
`,

  'pinepaper://docs/relations': `# Relations Guide

Relations are the PRIMARY way to add animation in PinePaper. They describe behavior, not keyframes.

## Why Relations?

1. **Natural Language**: "moon orbits earth" is easier than specifying every frame
2. **Compositional**: Multiple relations can work together
3. **Training Data**: Relations generate instruction/code pairs for LLM fine-tuning

## Available Relations

### orbits
Circular motion around target.
- \`radius\`: Orbit radius in pixels
- \`speed\`: Rotation speed (1 = normal)
- \`direction\`: 'clockwise' or 'counterclockwise'
- \`phase\`: Starting angle offset in degrees

### follows
Move toward target with smoothing.
- \`offset\`: [x, y] offset from target
- \`smoothing\`: 0-1 (lower = more responsive)
- \`delay\`: Seconds of lag

### attached_to
Fixed offset from target (parent-child).
- \`offset\`: [x, y] fixed offset
- \`inherit_rotation\`: Also rotate with parent

### maintains_distance
Stay at fixed distance from target.
- \`distance\`: Target distance in pixels
- \`strength\`: How strongly to maintain (0-1)

### points_at
Rotate to face target.
- \`offset_angle\`: Additional rotation
- \`smoothing\`: Rotation smoothing

### mirrors
Mirror position across axis.
- \`axis\`: 'vertical', 'horizontal', or 'both'
- \`center\`: [x, y] mirror center

### parallax
Move relative to target by depth.
- \`depth\`: 0-1 (0 = no movement, 1 = full movement)
- \`origin\`: [x, y] parallax origin

### bounds_to
Stay within target's bounds.
- \`padding\`: Inner padding
- \`bounce\`: Bounce off edges

## Verifying Animations Are Working

After adding a relation, **always verify** that the animation is actually running:

### Method 1: Take Multiple Screenshots
Take 2-3 screenshots with a small delay between them:
\`\`\`
1. pinepaper_browser_screenshot (save position)
2. Wait 1-2 seconds
3. pinepaper_browser_screenshot (compare position)
\`\`\`
If the orbiting item has moved, the animation is working.

### Method 2: Query Relations
Use \`pinepaper_query_relations\` to confirm the relation was added:
\`\`\`
pinepaper_query_relations itemId=earth direction=outgoing
\`\`\`
Should return the orbits relation.

### Method 3: Check Item Animation State
Use \`pinepaper_get_items\` with filter \`hasRelation: true\` to see animated items.

### Troubleshooting Animation Issues
If animations don't appear to be working:
1. Verify both source and target items exist with \`pinepaper_get_items\`
2. Check the relation was added with \`pinepaper_query_relations\`
3. Try refreshing the page with \`pinepaper_refresh_page\` and recreating
4. For keyframe animations, ensure \`pinepaper_play_timeline\` was called

## Composition Example

An item can have multiple relations:

\`\`\`
// Planet orbits star AND label stays attached
addRelation(planet, star, 'orbits', { radius: 200, speed: 0.5 })
addRelation(label, planet, 'attached_to', { offset: [0, -30] })
\`\`\`

The label will follow the planet as it orbits the star!
`,

  'pinepaper://docs/generators': `# Background Generators

Procedural backgrounds that create dynamic patterns.

## Available Generators

### drawSunburst
Radial rays from center.
- \`rayCount\`: Number of rays (default: 16)
- \`colors\`: Array of ray colors
- \`bgColor\`: Background color
- \`animated\`: Enable rotation

### drawSunsetScene
Animated sunset with clouds.
- \`sunColor\`: Sun fill color
- \`skyColors\`: Array for gradient
- \`cloudCount\`: Number of clouds

### drawGrid
Geometric grid patterns.
- \`gridType\`: 'lines', 'dots', or 'squares'
- \`spacing\`: Cell size
- \`lineColor\`: Grid color

### drawWaves
Layered wave pattern.
- \`waveCount\`: Number of layers
- \`colors\`: Wave colors
- \`amplitude\`: Wave height
- \`animated\`: Animate waves

### drawCircuit
Tech circuit board.
- \`lineColor\`: Circuit lines
- \`nodeColor\`: Junction color
- \`density\`: 0-1 complexity
- \`animated\`: Enable bolt effect
`,

  'pinepaper://docs/custom-paths': `# Custom Paths Guide

Every item in PinePaper is ultimately a Paper.js path. This guide covers advanced path creation techniques including SVG import, custom segments, and path animation.

## Understanding Paths in PinePaper

PinePaper uses Paper.js under the hood. All shapes (circles, stars, rectangles) are paths with specific segment configurations. You can create any shape by defining custom paths.

## Path Creation Methods

### Method 1: Segment-Based Paths (Polygons)

Use the \`path\` item type with \`segments\` to create polygons from coordinate points:

\`\`\`
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    segments: [[0, -50], [50, 50], [-50, 50]]  // Triangle
    closed: true
    fillColor: "#3b82f6"
    strokeColor: "#1e40af"
    strokeWidth: 2
\`\`\`

Each segment is an [x, y] coordinate relative to the item's position.

**Examples:**
- Triangle: \`[[0, -50], [50, 50], [-50, 50]]\`
- Diamond: \`[[0, -60], [40, 0], [0, 60], [-40, 0]]\`
- Arrow: \`[[0, -40], [30, 20], [10, 20], [10, 60], [-10, 60], [-10, 20], [-30, 20]]\`
- Hexagon: \`[[30, -52], [60, 0], [30, 52], [-30, 52], [-60, 0], [-30, -52]]\`

### Method 2: SVG Path Data (Bezier Curves)

Use \`pathData\` for complex curves using SVG path syntax:

\`\`\`
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    pathData: "M 0 -50 C 50 -50 50 50 0 50 C -50 50 -50 -50 0 -50"
    fillColor: "#ec4899"
    strokeWidth: 0
\`\`\`

**SVG Path Commands:**
- \`M x y\` - Move to (start point)
- \`L x y\` - Line to
- \`C x1 y1 x2 y2 x y\` - Cubic Bezier curve
- \`Q x1 y1 x y\` - Quadratic Bezier curve
- \`A rx ry rotation large-arc sweep x y\` - Arc
- \`Z\` - Close path

**Example Shapes with pathData:**
\`\`\`
// Heart shape
pathData: "M 0 -30 C -30 -60 -60 -30 -60 0 C -60 30 -30 60 0 80 C 30 60 60 30 60 0 C 60 -30 30 -60 0 -30"

// Smooth wave
pathData: "M -100 0 Q -50 -40 0 0 Q 50 40 100 0"

// Crescent moon
pathData: "M 0 -50 A 50 50 0 1 1 0 50 A 35 35 0 1 0 0 -50"
\`\`\`

### Method 3: Smooth Paths

Add \`smooth: true\` to automatically smooth segment connections:

\`\`\`
pinepaper_create_item
  itemType: "path"
  properties:
    segments: [[0, 0], [50, -30], [100, 0], [150, 30], [200, 0]]
    smooth: true
    closed: false
    strokeColor: "#10b981"
    strokeWidth: 3
    fillColor: null
\`\`\`

### Method 4: Lines and Arcs

**Simple Line:**
\`\`\`
pinepaper_create_item
  itemType: "line"
  properties:
    from: [100, 100]
    to: [300, 200]
    strokeColor: "#f59e0b"
    strokeWidth: 2
\`\`\`

**Arc (through 3 points):**
\`\`\`
pinepaper_create_item
  itemType: "arc"
  properties:
    from: [100, 300]
    through: [200, 200]
    to: [300, 300]
    strokeColor: "#8b5cf6"
    strokeWidth: 3
\`\`\`

## Importing SVGs

### Import SVG from String

\`\`\`
pinepaper_import_svg
  svgString: "<svg viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='#ff6b6b'/></svg>"
  position: {x: 400, y: 300}
  scale: 2.0
\`\`\`

### Import SVG from URL

\`\`\`
pinepaper_import_svg
  url: "https://example.com/icon.svg"
  position: {x: 400, y: 300}
  scale: 1.5
\`\`\`

**Tips for SVG Import:**
- Imported SVGs become Paper.js Group items
- Use \`scale\` to resize (1.0 = original size)
- Position is the center point of the imported SVG
- Complex SVGs with many paths work best when simplified first

## Animating Paths

### Relation-Based Animation (Recommended)

Paths can use all standard relations:

\`\`\`
// Make a custom arrow orbit around a center point
pinepaper_create_item itemType: "path" properties: {segments: [...], closed: true}
  → Returns item_1 (arrow)

pinepaper_create_item itemType: "circle" properties: {radius: 10}
  → Returns item_2 (center)

pinepaper_add_relation
  sourceId: "item_1"
  targetId: "item_2"
  relationType: "orbits"
  params: {radius: 100, speed: 0.5}
\`\`\`

### Keyframe Animation for Paths

Animate path properties over time:

\`\`\`
pinepaper_keyframe_animate
  itemId: "item_1"
  keyframes:
    - time: 0
      properties: {opacity: 1, scaling: 1}
    - time: 1
      properties: {opacity: 0.5, scaling: 1.2}
    - time: 2
      properties: {opacity: 1, scaling: 1}
  duration: 2
  loop: true
\`\`\`

**Animatable Path Properties:**
- \`opacity\` - Transparency (0-1)
- \`scaling\` - Size multiplier
- \`rotation\` - Rotation in degrees
- \`position.x\`, \`position.y\` - Position
- \`strokeWidth\` - Line thickness
- \`strokeColor\`, \`fillColor\` - Colors (as hex strings)

### Simple Loop Animations

\`\`\`
pinepaper_animate_item
  itemId: "item_1"
  animationType: "pulse"   // or: rotate, bounce, fade, wobble
  speed: 1.5
\`\`\`

## Drawing Orbital Rings

Create visible orbital path rings (not just invisible orbit relations):

\`\`\`
// Draw a dashed orbital ring
pinepaper_create_item
  itemType: "circle"
  position: {x: 400, y: 300}
  properties:
    radius: 150
    fillColor: null           // No fill - ring only
    strokeColor: "#374151"
    strokeWidth: 1
\`\`\`

For elliptical orbits, use an ellipse or path:

\`\`\`
pinepaper_create_item
  itemType: "ellipse"
  position: {x: 400, y: 300}
  properties:
    width: 300
    height: 150
    fillColor: null
    strokeColor: "#4b5563"
    strokeWidth: 1
\`\`\`

## Creating Complex Shapes

### Compound Paths (Multiple Subpaths)

For shapes with holes, use SVG path data with multiple subpaths:

\`\`\`
// Ring/donut shape (outer circle + inner circle cutout)
pathData: "M 0 -50 A 50 50 0 1 1 0 50 A 50 50 0 1 1 0 -50 M 0 -25 A 25 25 0 1 0 0 25 A 25 25 0 1 0 0 -25"
\`\`\`

### Planetary Surface Details

Create texture details with multiple paths:

\`\`\`
// Planet with crater
1. Main planet: circle with fillColor
2. Crater: smaller ellipse with darker fillColor, attached_to planet
3. Highlight: arc with light strokeColor, attached_to planet
\`\`\`

## Exporting Paths

### Export as Animated SVG

\`\`\`
pinepaper_export_svg
  animated: true
\`\`\`

Returns SVG with embedded \`<animate>\` elements for CSS/SMIL animation.

### Export Training Data

\`\`\`
pinepaper_export_training_data
  format: "jsonl"
  includeMetadata: true
\`\`\`

## Best Practices

1. **Use relative coordinates** in segments - they're relative to item position
2. **Start simple** - Begin with segments, graduate to pathData for curves
3. **Test with screenshots** - Use \`pinepaper_browser_screenshot\` after each path
4. **Combine with relations** - Custom paths animate beautifully with orbits/follows
5. **Layer paths** - Build complex visuals from multiple simple paths
6. **Use smooth: true** - For organic, flowing curves from point data
`,

  'pinepaper://examples/solar-system': `# Solar System Example (Advanced)

Create an animated solar system featuring custom paths, orbital rings, and planetary details.

## What You'll Learn

- Drawing orbital ring paths
- Creating planets with surface details using paths
- Using SVG path data for complex shapes
- Combining paths with relation-based animation
- Building layered visual compositions

## Step 1: Canvas Setup

\`\`\`
pinepaper_browser_connect
pinepaper_clear_canvas
pinepaper_set_background_color color: "#0a0a1a"
\`\`\`

## Step 2: Create the Sun with Corona Effect

First, create a glowing corona using a custom path:

\`\`\`
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    pathData: "M 0 -80 Q 20 -60 0 -40 Q -20 -60 0 -80 M 57 -57 Q 50 -35 28 -28 Q 35 -50 57 -57 M 80 0 Q 60 20 40 0 Q 60 -20 80 0 M 57 57 Q 35 50 28 28 Q 50 35 57 57 M 0 80 Q -20 60 0 40 Q 20 60 0 80 M -57 57 Q -50 35 -28 28 Q -35 50 -57 57 M -80 0 Q -60 -20 -40 0 Q -60 20 -80 0 M -57 -57 Q -35 -50 -28 -28 Q -50 -35 -57 -57"
    strokeColor: "#fbbf24"
    strokeWidth: 3
    fillColor: null
→ Returns item_1 (corona rays)
\`\`\`

Now create the sun body:

\`\`\`
pinepaper_create_item
  itemType: "circle"
  position: {x: 400, y: 300}
  properties:
    radius: 50
    color: "#f59e0b"
→ Returns item_2 (sun body)
\`\`\`

Animate the corona:

\`\`\`
pinepaper_animate_item
  itemId: "item_1"
  animationType: "rotate"
  speed: 0.2
\`\`\`

## Step 3: Draw Visible Orbital Rings

Create orbital path rings so users can see the orbits:

\`\`\`
// Mercury's orbit ring
pinepaper_create_item
  itemType: "circle"
  position: {x: 400, y: 300}
  properties:
    radius: 90
    fillColor: null
    strokeColor: "#374151"
    strokeWidth: 1
→ Returns item_3 (Mercury orbit ring)

// Earth's orbit ring
pinepaper_create_item
  itemType: "circle"
  position: {x: 400, y: 300}
  properties:
    radius: 150
    fillColor: null
    strokeColor: "#374151"
    strokeWidth: 1
→ Returns item_4 (Earth orbit ring)

// Mars's orbit ring
pinepaper_create_item
  itemType: "circle"
  position: {x: 400, y: 300}
  properties:
    radius: 210
    fillColor: null
    strokeColor: "#374151"
    strokeWidth: 1
→ Returns item_5 (Mars orbit ring)
\`\`\`

## Step 4: Create Mercury with Surface Detail

\`\`\`
// Mercury body
pinepaper_create_item
  itemType: "circle"
  position: {x: 490, y: 300}
  properties:
    radius: 8
    color: "#9ca3af"
→ Returns item_6 (Mercury)

// Mercury crater detail (small dark circle)
pinepaper_create_item
  itemType: "circle"
  position: {x: 492, y: 298}
  properties:
    radius: 2
    color: "#6b7280"
→ Returns item_7 (Mercury crater)

// Attach crater to Mercury
pinepaper_add_relation
  sourceId: "item_7"
  targetId: "item_6"
  relationType: "attached_to"
  params: {offset: [2, -2]}

// Mercury orbits the Sun
pinepaper_add_relation
  sourceId: "item_6"
  targetId: "item_2"
  relationType: "orbits"
  params: {radius: 90, speed: 1.5, direction: "counterclockwise"}
\`\`\`

## Step 5: Create Earth with Continent Path

\`\`\`
// Earth body
pinepaper_create_item
  itemType: "circle"
  position: {x: 550, y: 300}
  properties:
    radius: 15
    color: "#3b82f6"
→ Returns item_8 (Earth)

// Continent shape using custom path
pinepaper_create_item
  itemType: "path"
  position: {x: 550, y: 300}
  properties:
    segments: [[-5, -8], [3, -10], [8, -5], [6, 2], [0, 5], [-7, 3], [-8, -3]]
    closed: true
    smooth: true
    fillColor: "#22c55e"
    strokeWidth: 0
→ Returns item_9 (continent)

// Attach continent to Earth
pinepaper_add_relation
  sourceId: "item_9"
  targetId: "item_8"
  relationType: "attached_to"
  params: {offset: [0, 0], inherit_rotation: true}

// Earth orbits the Sun
pinepaper_add_relation
  sourceId: "item_8"
  targetId: "item_2"
  relationType: "orbits"
  params: {radius: 150, speed: 0.5, direction: "counterclockwise"}
\`\`\`

## Step 6: Create Moon Orbiting Earth

\`\`\`
pinepaper_create_item
  itemType: "circle"
  position: {x: 575, y: 300}
  properties:
    radius: 5
    color: "#d1d5db"
→ Returns item_10 (Moon)

// Moon orbits Earth (not the Sun!)
pinepaper_add_relation
  sourceId: "item_10"
  targetId: "item_8"
  relationType: "orbits"
  params: {radius: 25, speed: 2.0, direction: "counterclockwise"}
\`\`\`

## Step 7: Create Mars with Polar Ice Cap

\`\`\`
// Mars body
pinepaper_create_item
  itemType: "circle"
  position: {x: 610, y: 300}
  properties:
    radius: 12
    color: "#dc2626"
→ Returns item_11 (Mars)

// Polar ice cap using arc path
pinepaper_create_item
  itemType: "path"
  position: {x: 610, y: 300}
  properties:
    pathData: "M -8 -8 A 12 12 0 0 1 8 -8 L 4 -5 A 8 8 0 0 0 -4 -5 Z"
    fillColor: "#fef2f2"
    strokeWidth: 0
→ Returns item_12 (ice cap)

// Attach ice cap to Mars
pinepaper_add_relation
  sourceId: "item_12"
  targetId: "item_11"
  relationType: "attached_to"
  params: {offset: [0, 0]}

// Mars orbits the Sun
pinepaper_add_relation
  sourceId: "item_11"
  targetId: "item_2"
  relationType: "orbits"
  params: {radius: 210, speed: 0.3, direction: "counterclockwise", phase: 45}
\`\`\`

## Step 8: Add Asteroid Belt with Custom Paths

Create a few asteroid shapes:

\`\`\`
// Asteroid 1 - irregular polygon
pinepaper_create_item
  itemType: "path"
  position: {x: 280, y: 300}
  properties:
    segments: [[0, -4], [3, -2], [4, 2], [1, 4], [-3, 3], [-4, -1]]
    closed: true
    fillColor: "#78716c"
    strokeWidth: 0
→ Returns item_13

// Asteroid 2
pinepaper_create_item
  itemType: "path"
  position: {x: 520, y: 300}
  properties:
    segments: [[0, -3], [4, 0], [2, 4], [-2, 3], [-4, 0]]
    closed: true
    fillColor: "#a8a29e"
    strokeWidth: 0
→ Returns item_14

// Asteroids orbit at different speeds
pinepaper_add_relation sourceId: "item_13" targetId: "item_2" relationType: "orbits"
  params: {radius: 270, speed: 0.15, phase: 0}

pinepaper_add_relation sourceId: "item_14" targetId: "item_2" relationType: "orbits"
  params: {radius: 275, speed: 0.12, phase: 180}
\`\`\`

## Step 9: Add Comet with Tail Path

\`\`\`
// Comet head
pinepaper_create_item
  itemType: "circle"
  position: {x: 200, y: 200}
  properties:
    radius: 6
    color: "#67e8f9"
→ Returns item_15 (comet head)

// Comet tail using curved path
pinepaper_create_item
  itemType: "path"
  position: {x: 200, y: 200}
  properties:
    pathData: "M 6 0 Q 40 -10 80 -5 Q 120 0 150 10 Q 100 5 50 2 Q 20 0 6 0"
    fillColor: "#22d3ee"
    opacity: 0.6
    strokeWidth: 0
→ Returns item_16 (comet tail)

// Tail follows comet head
pinepaper_add_relation
  sourceId: "item_16"
  targetId: "item_15"
  relationType: "attached_to"
  params: {offset: [0, 0]}

// Comet on elliptical-like orbit (using orbits with high speed variation)
pinepaper_add_relation
  sourceId: "item_15"
  targetId: "item_2"
  relationType: "orbits"
  params: {radius: 320, speed: 0.8, direction: "clockwise"}

// Comet tail points away from sun
pinepaper_add_relation
  sourceId: "item_16"
  targetId: "item_2"
  relationType: "points_at"
  params: {offset_angle: 180}
\`\`\`

## Step 10: Verify and Screenshot

\`\`\`
pinepaper_browser_screenshot
\`\`\`

Take multiple screenshots to verify:
1. All orbital relations are animating
2. Attached items (craters, continents, ice caps) move with their planets
3. The comet tail points away from the sun

## Result

You now have a dynamic solar system featuring:
- **Custom corona rays** around the sun (rotating SVG path)
- **Visible orbital rings** showing each planet's path
- **Surface details** on planets using paths (craters, continents, ice caps)
- **Irregular asteroids** using polygon paths
- **A comet** with a curved tail path that points away from the sun

## Key Techniques Used

| Technique | Example |
|-----------|---------|
| SVG pathData | Corona rays, polar ice cap, comet tail |
| Segment arrays | Continents, asteroids |
| smooth: true | Organic continent shapes |
| attached_to | Details that move with planets |
| orbits | All celestial body motion |
| points_at | Comet tail direction |
| Layered composition | Planet + details as separate items |

## Training Data Generated

This scene produces rich training pairs:
- "Create a continent shape on Earth" → path with segments + attached_to relation
- "Draw the Sun's corona with ray shapes" → SVG pathData with rotate animation
- "Add visible orbit rings" → unfilled circles with stroke only
- "Make comet tail point away from sun" → points_at with offset_angle: 180
`,

  'pinepaper://docs/mathematical-patterns': `# Mathematical Patterns Guide

Create stunning visualizations using mathematical formulas. PinePaper excels at bringing math to life through animation.

## Coordinate Systems

PinePaper uses a standard canvas coordinate system:
- **Origin (0, 0)**: Top-left corner
- **X-axis**: Increases rightward
- **Y-axis**: Increases downward
- **Center of 800x600 canvas**: (400, 300)

## Spirals

### Archimedean Spiral
Points move outward at constant rate. Formula: r = a + b*θ

\`\`\`
// Create spiral with 8 points
// Each point: x = cx + r*cos(θ), y = cy + r*sin(θ)

pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 410, y: 295} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 405, y: 280} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 385, y: 275} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 365, y: 290} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 360, y: 320} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 380, y: 345} properties: {radius: 4, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 415, y: 355} properties: {radius: 4, color: "#3b82f6"}
\`\`\`

### Logarithmic Spiral (Golden Spiral)
Formula: r = a * e^(b*θ) - Found in nature (shells, galaxies)

\`\`\`
// Connect points with a smooth path
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    segments: [[0, 0], [10, -5], [8, -20], [-10, -28], [-35, -15], [-40, 20], [-20, 50], [25, 60]]
    smooth: true
    closed: false
    strokeColor: "#f59e0b"
    strokeWidth: 2
    fillColor: null
\`\`\`

## Waves and Oscillations

### Sine Wave
Formula: y = A * sin(ωx + φ)
- A = amplitude (wave height)
- ω = angular frequency (wave density)
- φ = phase shift

\`\`\`
// Create a sine wave using smooth path
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    segments: [
      [-200, 0], [-150, -40], [-100, 0], [-50, 40], [0, 0],
      [50, -40], [100, 0], [150, 40], [200, 0]
    ]
    smooth: true
    closed: false
    strokeColor: "#10b981"
    strokeWidth: 3
    fillColor: null
\`\`\`

### Standing Wave Animation
Two waves traveling in opposite directions:

\`\`\`
// Create two wave paths, animate in opposite directions
pinepaper_create_item itemType: "path" position: {x: 400, y: 280}
  properties: {segments: [[-200, 0], [-100, -30], [0, 0], [100, 30], [200, 0]], smooth: true, strokeColor: "#3b82f6", strokeWidth: 2}
→ item_1

pinepaper_create_item itemType: "path" position: {x: 400, y: 320}
  properties: {segments: [[-200, 0], [-100, 30], [0, 0], [100, -30], [200, 0]], smooth: true, strokeColor: "#ef4444", strokeWidth: 2}
→ item_2

pinepaper_animate_item itemId: "item_1" animationType: "slide" speed: 0.5
pinepaper_animate_item itemId: "item_2" animationType: "slide" speed: -0.5
\`\`\`

## Geometric Patterns

### Regular Polygons
Formula for vertices: x = r*cos(2πk/n), y = r*sin(2πk/n)

**Pentagon (5 sides):**
\`\`\`
pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 5, radius: 80, color: "#8b5cf6"}
\`\`\`

**Hexagon (6 sides):**
\`\`\`
pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 6, radius: 80, color: "#06b6d4"}
\`\`\`

**Octagon (8 sides):**
\`\`\`
pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 8, radius: 80, color: "#f43f5e"}
\`\`\`

### Nested Polygons (Mandala Pattern)
\`\`\`
// Create concentric rotating polygons
pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 6, radius: 120, color: null, strokeColor: "#3b82f6", strokeWidth: 2}
→ item_1

pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 6, radius: 90, color: null, strokeColor: "#8b5cf6", strokeWidth: 2}
→ item_2

pinepaper_create_item itemType: "polygon" position: {x: 400, y: 300}
  properties: {sides: 6, radius: 60, color: null, strokeColor: "#ec4899", strokeWidth: 2}
→ item_3

// Rotate at different speeds
pinepaper_animate_item itemId: "item_1" animationType: "rotate" speed: 0.2
pinepaper_animate_item itemId: "item_2" animationType: "rotate" speed: -0.3
pinepaper_animate_item itemId: "item_3" animationType: "rotate" speed: 0.5
\`\`\`

## Stars and Stellations

### Star Geometry
Stars are defined by two radii: outer (points) and inner (valleys)
- **Sharp stars**: inner radius << outer radius
- **Thick stars**: inner radius close to outer radius

\`\`\`
// Sharp 5-pointed star
pinepaper_create_item itemType: "star" position: {x: 300, y: 300}
  properties: {points: 5, radius1: 80, radius2: 30, color: "#fbbf24"}

// Thick 5-pointed star
pinepaper_create_item itemType: "star" position: {x: 500, y: 300}
  properties: {points: 5, radius1: 80, radius2: 55, color: "#f59e0b"}
\`\`\`

### Star Variations
\`\`\`
// 4-pointed star (diamond burst)
pinepaper_create_item itemType: "star" properties: {points: 4, radius1: 60, radius2: 15, color: "#ef4444"}

// 8-pointed star (compass rose)
pinepaper_create_item itemType: "star" properties: {points: 8, radius1: 70, radius2: 35, color: "#3b82f6"}

// 12-pointed star (sun burst)
pinepaper_create_item itemType: "star" properties: {points: 12, radius1: 80, radius2: 60, color: "#fbbf24"}
\`\`\`

## Lissajous Figures

Curves from parametric equations: x = A*sin(at + δ), y = B*sin(bt)

These create beautiful interlocking patterns based on frequency ratios:

\`\`\`
// 1:2 Lissajous (figure-8 pattern)
pinepaper_create_item
  itemType: "path"
  position: {x: 400, y: 300}
  properties:
    pathData: "M 0 -60 C 60 -60 60 0 0 0 C -60 0 -60 60 0 60 C 60 60 60 0 0 0 C -60 0 -60 -60 0 -60"
    strokeColor: "#10b981"
    strokeWidth: 2
    fillColor: null
\`\`\`

## Circular Arrangements

### Items Around a Circle
Place n items evenly around a circle of radius r:
- angle = 2π * i / n
- x = center_x + r * cos(angle)
- y = center_y + r * sin(angle)

\`\`\`
// 8 circles arranged in a ring
pinepaper_create_item itemType: "circle" position: {x: 480, y: 300} properties: {radius: 15, color: "#ef4444"}
pinepaper_create_item itemType: "circle" position: {x: 457, y: 357} properties: {radius: 15, color: "#f59e0b"}
pinepaper_create_item itemType: "circle" position: {x: 400, y: 380} properties: {radius: 15, color: "#eab308"}
pinepaper_create_item itemType: "circle" position: {x: 343, y: 357} properties: {radius: 15, color: "#22c55e"}
pinepaper_create_item itemType: "circle" position: {x: 320, y: 300} properties: {radius: 15, color: "#06b6d4"}
pinepaper_create_item itemType: "circle" position: {x: 343, y: 243} properties: {radius: 15, color: "#3b82f6"}
pinepaper_create_item itemType: "circle" position: {x: 400, y: 220} properties: {radius: 15, color: "#8b5cf6"}
pinepaper_create_item itemType: "circle" position: {x: 457, y: 243} properties: {radius: 15, color: "#ec4899"}
\`\`\`

### Animated Circular Arrangement
\`\`\`
// Create center anchor
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 5, color: "#ffffff"}
→ item_center

// Create orbiting items with different phases
pinepaper_create_item itemType: "circle" position: {x: 480, y: 300} properties: {radius: 12, color: "#ef4444"}
→ item_1
pinepaper_add_relation sourceId: "item_1" targetId: "item_center" relationType: "orbits"
  params: {radius: 80, speed: 0.5, phase: 0}

pinepaper_create_item itemType: "circle" position: {x: 400, y: 380} properties: {radius: 12, color: "#22c55e"}
→ item_2
pinepaper_add_relation sourceId: "item_2" targetId: "item_center" relationType: "orbits"
  params: {radius: 80, speed: 0.5, phase: 90}

pinepaper_create_item itemType: "circle" position: {x: 320, y: 300} properties: {radius: 12, color: "#3b82f6"}
→ item_3
pinepaper_add_relation sourceId: "item_3" targetId: "item_center" relationType: "orbits"
  params: {radius: 80, speed: 0.5, phase: 180}

pinepaper_create_item itemType: "circle" position: {x: 400, y: 220} properties: {radius: 12, color: "#f59e0b"}
→ item_4
pinepaper_add_relation sourceId: "item_4" targetId: "item_center" relationType: "orbits"
  params: {radius: 80, speed: 0.5, phase: 270}
\`\`\`

## Fractals and Self-Similarity

### Simple Fractal Tree (3 levels)
\`\`\`
// Trunk
pinepaper_create_item itemType: "line" properties: {from: [400, 400], to: [400, 300], strokeColor: "#78350f", strokeWidth: 8}

// Level 1 branches
pinepaper_create_item itemType: "line" properties: {from: [400, 300], to: [350, 230], strokeColor: "#78350f", strokeWidth: 5}
pinepaper_create_item itemType: "line" properties: {from: [400, 300], to: [450, 230], strokeColor: "#78350f", strokeWidth: 5}

// Level 2 branches (left)
pinepaper_create_item itemType: "line" properties: {from: [350, 230], to: [320, 180], strokeColor: "#166534", strokeWidth: 3}
pinepaper_create_item itemType: "line" properties: {from: [350, 230], to: [370, 175], strokeColor: "#166534", strokeWidth: 3}

// Level 2 branches (right)
pinepaper_create_item itemType: "line" properties: {from: [450, 230], to: [430, 175], strokeColor: "#166534", strokeWidth: 3}
pinepaper_create_item itemType: "line" properties: {from: [450, 230], to: [480, 180], strokeColor: "#166534", strokeWidth: 3}
\`\`\`

### Sierpinski Triangle Pattern
\`\`\`
// Main triangle
pinepaper_create_item itemType: "path" position: {x: 400, y: 320}
  properties: {segments: [[0, -100], [87, 50], [-87, 50]], closed: true, strokeColor: "#8b5cf6", strokeWidth: 2, fillColor: null}

// Inner inverted triangle (creates the hole)
pinepaper_create_item itemType: "path" position: {x: 400, y: 320}
  properties: {segments: [[0, 0], [43, -50], [-43, -50]], closed: true, fillColor: "#1a1a2e", strokeWidth: 0}
\`\`\`

## Physics Simulations

### Pendulum Motion
\`\`\`
// Fixed pivot point
pinepaper_create_item itemType: "circle" position: {x: 400, y: 150} properties: {radius: 8, color: "#6b7280"}
→ pivot

// Pendulum bob
pinepaper_create_item itemType: "circle" position: {x: 400, y: 350} properties: {radius: 25, color: "#3b82f6"}
→ bob

// Use wobble animation to simulate pendulum swing
pinepaper_animate_item itemId: "bob" animationType: "wobble" speed: 0.8
\`\`\`

### Orbital Mechanics (Kepler's Laws)
\`\`\`
// Central body (star)
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 40, color: "#fbbf24"}
→ star

// Inner planet (faster orbit - Kepler's 3rd law)
pinepaper_create_item itemType: "circle" position: {x: 480, y: 300} properties: {radius: 10, color: "#ef4444"}
→ inner
pinepaper_add_relation sourceId: "inner" targetId: "star" relationType: "orbits"
  params: {radius: 80, speed: 2.0}

// Outer planet (slower orbit)
pinepaper_create_item itemType: "circle" position: {x: 560, y: 300} properties: {radius: 15, color: "#3b82f6"}
→ outer
pinepaper_add_relation sourceId: "outer" targetId: "star" relationType: "orbits"
  params: {radius: 160, speed: 0.7}
\`\`\`

## Trigonometric Visualizations

### Unit Circle
\`\`\`
// Circle
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300}
  properties: {radius: 100, fillColor: null, strokeColor: "#4b5563", strokeWidth: 2}

// X-axis
pinepaper_create_item itemType: "line" properties: {from: [280, 300], to: [520, 300], strokeColor: "#6b7280", strokeWidth: 1}

// Y-axis
pinepaper_create_item itemType: "line" properties: {from: [400, 180], to: [400, 420], strokeColor: "#6b7280", strokeWidth: 1}

// Rotating radius line
pinepaper_create_item itemType: "line" properties: {from: [400, 300], to: [500, 300], strokeColor: "#ef4444", strokeWidth: 2}
→ radius
pinepaper_animate_item itemId: "radius" animationType: "rotate" speed: 0.3

// Point on circle
pinepaper_create_item itemType: "circle" position: {x: 500, y: 300} properties: {radius: 6, color: "#ef4444"}
→ point
pinepaper_add_relation sourceId: "point" targetId: "radius" relationType: "attached_to"
  params: {offset: [100, 0], inherit_rotation: true}
\`\`\`

## Color Mathematics

### Color Wheel
\`\`\`
// 12 hues arranged in a circle (30° apart)
// Hue values: 0°=red, 60°=yellow, 120°=green, 180°=cyan, 240°=blue, 300°=magenta

pinepaper_create_item itemType: "circle" position: {x: 480, y: 300} properties: {radius: 20, color: "#ef4444"} // 0° Red
pinepaper_create_item itemType: "circle" position: {x: 457, y: 357} properties: {radius: 20, color: "#f97316"} // 30° Orange
pinepaper_create_item itemType: "circle" position: {x: 400, y: 380} properties: {radius: 20, color: "#eab308"} // 60° Yellow
pinepaper_create_item itemType: "circle" position: {x: 343, y: 357} properties: {radius: 20, color: "#84cc16"} // 90° Yellow-Green
pinepaper_create_item itemType: "circle" position: {x: 320, y: 300} properties: {radius: 20, color: "#22c55e"} // 120° Green
pinepaper_create_item itemType: "circle" position: {x: 343, y: 243} properties: {radius: 20, color: "#14b8a6"} // 150° Teal
pinepaper_create_item itemType: "circle" position: {x: 400, y: 220} properties: {radius: 20, color: "#06b6d4"} // 180° Cyan
pinepaper_create_item itemType: "circle" position: {x: 457, y: 243} properties: {radius: 20, color: "#3b82f6"} // 210° Blue
\`\`\`

## Formulas Quick Reference

| Pattern | Formula | PinePaper Approach |
|---------|---------|-------------------|
| Circle point | (r*cos θ, r*sin θ) | Use orbits relation |
| Spiral | r = a + bθ | Create points, connect with smooth path |
| Sine wave | y = A*sin(ωx) | Path with smooth segments |
| Regular polygon | 2π/n angle between vertices | Use polygon itemType with sides param |
| Golden ratio | φ = 1.618... | radius2 = radius1 / 1.618 for stars |
| Fibonacci | 1, 1, 2, 3, 5, 8... | Size sequence for nested shapes |
`,

  'pinepaper://docs/effects-and-filters': `# Effects & Filters Guide

Complete reference for visual effects, particle effects, and post-processing filters in PinePaper.

## Particle Effects

### Sparkle Effect
Adds glittering particles around an item.

\`\`\`
pinepaper_apply_effect
  itemId: "item_1"
  effectType: "sparkle"
  params:
    color: "#fbbf24"    // Sparkle color (default: gold)
    speed: 1.5          // Animation speed multiplier
    size: 4             // Particle size in pixels
\`\`\`

**Use cases:**
- Magic wand effects
- Highlight important items
- Create fairy dust trails
- Award/achievement animations

### Blast Effect
Creates an explosion/burst of particles from an item.

\`\`\`
pinepaper_apply_effect
  itemId: "item_1"
  effectType: "blast"
  params:
    color: "#ef4444"    // Particle color (default: red)
    radius: 150         // How far particles travel
    count: 30           // Number of particles
\`\`\`

**Use cases:**
- Explosions
- Confetti celebrations
- Impact effects
- Dramatic reveals

## Canvas Filters

Filters apply to the entire canvas and can be stacked for combined effects.

### Color Adjustments

**Grayscale** - Remove color saturation
\`\`\`
pinepaper_add_filter filterType: "grayscale" params: {intensity: 1.0}
// intensity: 0 (no effect) to 1 (full grayscale)
\`\`\`

**Sepia** - Warm vintage brown tones
\`\`\`
pinepaper_add_filter filterType: "sepia" params: {intensity: 0.8}
\`\`\`

**Saturation** - Boost or reduce color intensity
\`\`\`
pinepaper_add_filter filterType: "saturate" params: {value: 50}
// value: -100 (desaturated) to 100 (oversaturated)
\`\`\`

**Brightness** - Lighten or darken
\`\`\`
pinepaper_add_filter filterType: "brightness" params: {value: 20}
// value: -100 (black) to 100 (white)
\`\`\`

**Contrast** - Increase or decrease contrast
\`\`\`
pinepaper_add_filter filterType: "contrast" params: {value: 30}
// value: -100 (flat gray) to 100 (high contrast)
\`\`\`

**Invert** - Invert all colors
\`\`\`
pinepaper_add_filter filterType: "invert" params: {intensity: 1.0}
\`\`\`

**Color Overlay** - Tint with a color
\`\`\`
pinepaper_add_filter filterType: "colorOverlay" params: {
  color: "#3b82f6",
  intensity: 0.3
}
\`\`\`

### Blur & Sharpness

**Blur** - Gaussian blur effect
\`\`\`
pinepaper_add_filter filterType: "blur" params: {radius: 5}
// radius: 0 (sharp) to 20 (very blurry)
\`\`\`

**Sharpen** - Increase edge definition
\`\`\`
pinepaper_add_filter filterType: "sharpen" params: {intensity: 50}
// intensity: 0 to 100
\`\`\`

### Artistic Effects

**Noise/Grain** - Film grain texture
\`\`\`
pinepaper_add_filter filterType: "noise" params: {
  intensity: 30,        // Grain amount (0-100)
  monochrome: true      // Black and white grain
}
\`\`\`

**Vignette** - Darken edges
\`\`\`
pinepaper_add_filter filterType: "vignette" params: {
  intensity: 0.5,       // Darkness (0-1)
  radius: 0.7           // How far from edge (0-1)
}
\`\`\`

**Emboss** - 3D relief effect
\`\`\`
pinepaper_add_filter filterType: "emboss" params: {}
\`\`\`

**Posterize** - Reduce color levels
\`\`\`
pinepaper_add_filter filterType: "posterize" params: {levels: 4}
// levels: 2 (extreme) to 32 (subtle)
\`\`\`

### Preset Combinations

**Vintage** - Classic old photo look
\`\`\`
pinepaper_add_filter filterType: "vintage" params: {intensity: 0.7}
// Combines sepia, vignette, and noise
\`\`\`

## Filter Stacking Examples

### Cinematic Look
\`\`\`
pinepaper_add_filter filterType: "contrast" params: {value: 15}
pinepaper_add_filter filterType: "vignette" params: {intensity: 0.4, radius: 0.8}
pinepaper_add_filter filterType: "colorOverlay" params: {color: "#1e3a5f", intensity: 0.15}
\`\`\`

### Dreamy/Soft
\`\`\`
pinepaper_add_filter filterType: "blur" params: {radius: 2}
pinepaper_add_filter filterType: "brightness" params: {value: 10}
pinepaper_add_filter filterType: "saturate" params: {value: -20}
\`\`\`

### Retro/80s
\`\`\`
pinepaper_add_filter filterType: "contrast" params: {value: 20}
pinepaper_add_filter filterType: "saturate" params: {value: 40}
pinepaper_add_filter filterType: "noise" params: {intensity: 15, monochrome: false}
\`\`\`

### Horror/Dark
\`\`\`
pinepaper_add_filter filterType: "contrast" params: {value: 40}
pinepaper_add_filter filterType: "saturate" params: {value: -50}
pinepaper_add_filter filterType: "vignette" params: {intensity: 0.8, radius: 0.5}
\`\`\`

### Old Film
\`\`\`
pinepaper_add_filter filterType: "sepia" params: {intensity: 0.6}
pinepaper_add_filter filterType: "noise" params: {intensity: 40, monochrome: true}
pinepaper_add_filter filterType: "vignette" params: {intensity: 0.5}
pinepaper_add_filter filterType: "contrast" params: {value: 10}
\`\`\`

## Combining Effects with Animation

### Glowing Orb
\`\`\`
// Create orb
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300}
  properties: {radius: 40, color: "#8b5cf6"}
→ item_1

// Add pulse animation
pinepaper_animate_item itemId: "item_1" animationType: "pulse" speed: 0.8

// Add sparkle effect
pinepaper_apply_effect itemId: "item_1" effectType: "sparkle"
  params: {color: "#c4b5fd", speed: 1.2, size: 3}
\`\`\`

### Explosion Sequence
\`\`\`
// Create target
pinepaper_create_item itemType: "star" position: {x: 400, y: 300}
  properties: {points: 5, radius1: 50, radius2: 20, color: "#ef4444"}
→ item_1

// Add blast effect
pinepaper_apply_effect itemId: "item_1" effectType: "blast"
  params: {color: "#fbbf24", radius: 200, count: 40}
\`\`\`

## Effect Parameters Reference

| Effect | Parameter | Range | Default | Description |
|--------|-----------|-------|---------|-------------|
| sparkle | color | hex/rgb | #fbbf24 | Particle color |
| sparkle | speed | 0.1-5 | 1 | Animation speed |
| sparkle | size | 1-20 | 3 | Particle size |
| blast | color | hex/rgb | #ef4444 | Particle color |
| blast | radius | 10-500 | 100 | Explosion radius |
| blast | count | 5-100 | 20 | Particle count |

## Filter Parameters Reference

| Filter | Parameter | Range | Default | Description |
|--------|-----------|-------|---------|-------------|
| grayscale | intensity | 0-1 | 1 | Effect strength |
| sepia | intensity | 0-1 | 1 | Effect strength |
| blur | radius | 0-20 | 5 | Blur amount |
| brightness | value | -100 to 100 | 0 | Brightness change |
| contrast | value | -100 to 100 | 0 | Contrast change |
| saturate | value | -100 to 100 | 0 | Saturation change |
| invert | intensity | 0-1 | 1 | Inversion amount |
| noise | intensity | 0-100 | 30 | Grain amount |
| noise | monochrome | boolean | false | B&W grain |
| vignette | intensity | 0-1 | 0.5 | Edge darkness |
| vignette | radius | 0-1 | 0.5 | Vignette size |
| posterize | levels | 2-32 | 4 | Color levels |
| colorOverlay | color | hex/rgb | - | Overlay color |
| colorOverlay | intensity | 0-1 | 0.5 | Overlay strength |
| sharpen | intensity | 0-100 | 50 | Sharpness |
| vintage | intensity | 0-1 | 0.5 | Overall effect |
`,

  'pinepaper://docs/interactive-animations': `# Interactive Animations Guide

Create dynamic, game-like behaviors using PinePaper's relation system. These patterns enable responsive animations that feel alive.

## The Follows Relation

The \`follows\` relation makes an item move toward a target with configurable smoothing and delay.

### Basic Following
\`\`\`
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 30, color: "#3b82f6"}
→ leader

pinepaper_create_item itemType: "circle" position: {x: 300, y: 300} properties: {radius: 20, color: "#ef4444"}
→ follower

pinepaper_add_relation
  sourceId: "follower"
  targetId: "leader"
  relationType: "follows"
  params: {
    smoothing: 0.1,     // Lower = snappier, higher = smoother
    delay: 0            // Seconds of lag
  }
\`\`\`

### Snake/Trail Effect
Create a chain of followers with increasing delay:

\`\`\`
// Leader
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 20, color: "#22c55e"}
→ head

// Segment 1
pinepaper_create_item itemType: "circle" position: {x: 380, y: 300} properties: {radius: 18, color: "#16a34a"}
→ seg1
pinepaper_add_relation sourceId: "seg1" targetId: "head" relationType: "follows"
  params: {smoothing: 0.15, delay: 0.1}

// Segment 2
pinepaper_create_item itemType: "circle" position: {x: 360, y: 300} properties: {radius: 16, color: "#15803d"}
→ seg2
pinepaper_add_relation sourceId: "seg2" targetId: "seg1" relationType: "follows"
  params: {smoothing: 0.15, delay: 0.1}

// Segment 3
pinepaper_create_item itemType: "circle" position: {x: 340, y: 300} properties: {radius: 14, color: "#166534"}
→ seg3
pinepaper_add_relation sourceId: "seg3" targetId: "seg2" relationType: "follows"
  params: {smoothing: 0.15, delay: 0.1}

// Animate the head
pinepaper_add_relation sourceId: "head" targetId: "head" relationType: "orbits"
  params: {radius: 100, speed: 0.5}
\`\`\`

### Elastic Following
Use low smoothing for a bouncy, elastic feel:

\`\`\`
pinepaper_add_relation
  sourceId: "follower"
  targetId: "leader"
  relationType: "follows"
  params: {smoothing: 0.02, delay: 0}  // Very low smoothing = elastic
\`\`\`

## Maintaining Distance

The \`maintains_distance\` relation keeps an item at a fixed distance from a target.

### Orbiting Guard
\`\`\`
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 30, color: "#fbbf24"}
→ core

pinepaper_create_item itemType: "circle" position: {x: 500, y: 300} properties: {radius: 15, color: "#ef4444"}
→ guard

pinepaper_add_relation
  sourceId: "guard"
  targetId: "core"
  relationType: "maintains_distance"
  params: {
    distance: 100,      // Stay 100 pixels away
    strength: 0.8       // How strongly to enforce (0-1)
  }
\`\`\`

### Magnetic Repulsion Effect
Multiple items maintaining distance creates a repulsion field:

\`\`\`
// Central attractor
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 25, color: "#8b5cf6"}
→ center

// Floating particles that stay away
pinepaper_create_item itemType: "circle" position: {x: 300, y: 250} properties: {radius: 10, color: "#c4b5fd"}
→ p1
pinepaper_add_relation sourceId: "p1" targetId: "center" relationType: "maintains_distance"
  params: {distance: 80, strength: 1}

pinepaper_create_item itemType: "circle" position: {x: 500, y: 350} properties: {radius: 10, color: "#c4b5fd"}
→ p2
pinepaper_add_relation sourceId: "p2" targetId: "center" relationType: "maintains_distance"
  params: {distance: 80, strength: 1}
\`\`\`

## Bounded Movement

The \`bounds_to\` relation constrains an item within a boundary.

### Bouncing Ball
\`\`\`
// Create boundary rectangle (invisible or visible)
pinepaper_create_item itemType: "rectangle" position: {x: 400, y: 300}
  properties: {width: 300, height: 200, fillColor: null, strokeColor: "#374151", strokeWidth: 2}
→ bounds

// Create bouncing ball
pinepaper_create_item itemType: "circle" position: {x: 350, y: 280} properties: {radius: 15, color: "#ef4444"}
→ ball

pinepaper_add_relation
  sourceId: "ball"
  targetId: "bounds"
  relationType: "bounds_to"
  params: {
    padding: 15,        // Stay this far from edges
    bounce: true        // Bounce off walls
  }

// Give the ball some motion
pinepaper_animate_item itemId: "ball" animationType: "slide" speed: 2
\`\`\`

### Contained Particles
\`\`\`
// Container
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300}
  properties: {radius: 120, fillColor: null, strokeColor: "#3b82f6", strokeWidth: 2}
→ container

// Particles inside
pinepaper_create_item itemType: "circle" position: {x: 380, y: 290} properties: {radius: 8, color: "#60a5fa"}
→ p1
pinepaper_add_relation sourceId: "p1" targetId: "container" relationType: "bounds_to"
  params: {padding: 10, bounce: true}
pinepaper_animate_item itemId: "p1" animationType: "bounce" speed: 1.5

pinepaper_create_item itemType: "circle" position: {x: 420, y: 310} properties: {radius: 8, color: "#60a5fa"}
→ p2
pinepaper_add_relation sourceId: "p2" targetId: "container" relationType: "bounds_to"
  params: {padding: 10, bounce: true}
pinepaper_animate_item itemId: "p2" animationType: "wobble" speed: 1.2
\`\`\`

## Points At (Rotation Tracking)

The \`points_at\` relation makes an item rotate to face a target.

### Compass Needle
\`\`\`
// North marker
pinepaper_create_item itemType: "circle" position: {x: 400, y: 200} properties: {radius: 10, color: "#ef4444"}
→ north

// Compass arrow
pinepaper_create_item itemType: "path" position: {x: 400, y: 300}
  properties: {
    segments: [[0, -40], [10, 20], [0, 10], [-10, 20]],
    closed: true,
    fillColor: "#1e40af"
  }
→ needle

pinepaper_add_relation
  sourceId: "needle"
  targetId: "north"
  relationType: "points_at"
  params: {
    offset_angle: 0,    // Additional rotation offset
    smoothing: 0.1      // Rotation smoothing
  }
\`\`\`

### Tracking Eyes
\`\`\`
// Create eye
pinepaper_create_item itemType: "circle" position: {x: 380, y: 300} properties: {radius: 30, color: "#ffffff"}
→ eye_white

pinepaper_create_item itemType: "circle" position: {x: 380, y: 300} properties: {radius: 12, color: "#1f2937"}
→ pupil

// Target to look at (could be animated)
pinepaper_create_item itemType: "circle" position: {x: 500, y: 250} properties: {radius: 8, color: "#ef4444"}
→ target

// Pupil points at target
pinepaper_add_relation sourceId: "pupil" targetId: "target" relationType: "points_at"
  params: {smoothing: 0.2}

// Animate target in circle
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 3, color: null}
→ orbit_center
pinepaper_add_relation sourceId: "target" targetId: "orbit_center" relationType: "orbits"
  params: {radius: 150, speed: 0.3}
\`\`\`

## Mirroring

The \`mirrors\` relation creates symmetrical movement.

### Horizontal Mirror
\`\`\`
// Original
pinepaper_create_item itemType: "star" position: {x: 300, y: 300}
  properties: {points: 5, radius1: 30, radius2: 15, color: "#fbbf24"}
→ original

// Mirror
pinepaper_create_item itemType: "star" position: {x: 500, y: 300}
  properties: {points: 5, radius1: 30, radius2: 15, color: "#f59e0b"}
→ mirror

pinepaper_add_relation
  sourceId: "mirror"
  targetId: "original"
  relationType: "mirrors"
  params: {
    axis: "vertical",           // Mirror across vertical axis
    center: [400, 300]          // Mirror center point
  }

// Animate original - mirror follows
pinepaper_animate_item itemId: "original" animationType: "bounce" speed: 1
\`\`\`

### Kaleidoscope Effect (4-way mirror)
\`\`\`
// Original in top-left quadrant
pinepaper_create_item itemType: "circle" position: {x: 350, y: 250} properties: {radius: 15, color: "#3b82f6"}
→ orig

// Horizontal mirror
pinepaper_create_item itemType: "circle" position: {x: 450, y: 250} properties: {radius: 15, color: "#8b5cf6"}
→ h_mirror
pinepaper_add_relation sourceId: "h_mirror" targetId: "orig" relationType: "mirrors"
  params: {axis: "vertical", center: [400, 300]}

// Vertical mirror
pinepaper_create_item itemType: "circle" position: {x: 350, y: 350} properties: {radius: 15, color: "#ec4899"}
→ v_mirror
pinepaper_add_relation sourceId: "v_mirror" targetId: "orig" relationType: "mirrors"
  params: {axis: "horizontal", center: [400, 300]}

// Both axes mirror
pinepaper_create_item itemType: "circle" position: {x: 450, y: 350} properties: {radius: 15, color: "#f43f5e"}
→ both_mirror
pinepaper_add_relation sourceId: "both_mirror" targetId: "orig" relationType: "mirrors"
  params: {axis: "both", center: [400, 300]}
\`\`\`

## Parallax Depth

The \`parallax\` relation creates depth illusion through differential movement.

### Layered Background
\`\`\`
// Far background (moves least)
pinepaper_create_item itemType: "circle" position: {x: 200, y: 400} properties: {radius: 80, color: "#1e3a5f"}
→ far
pinepaper_add_relation sourceId: "far" targetId: "player" relationType: "parallax"
  params: {depth: 0.2, origin: [400, 300]}

// Mid layer
pinepaper_create_item itemType: "circle" position: {x: 300, y: 350} properties: {radius: 50, color: "#3b82f6"}
→ mid
pinepaper_add_relation sourceId: "mid" targetId: "player" relationType: "parallax"
  params: {depth: 0.5, origin: [400, 300]}

// Near foreground (moves most)
pinepaper_create_item itemType: "circle" position: {x: 450, y: 300} properties: {radius: 30, color: "#60a5fa"}
→ near
pinepaper_add_relation sourceId: "near" targetId: "player" relationType: "parallax"
  params: {depth: 0.8, origin: [400, 300]}

// Player/camera reference
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 10, color: "#ffffff"}
→ player
\`\`\`

## Combining Relations

### Orbiting Follower Chain
\`\`\`
// Center
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 20, color: "#fbbf24"}
→ sun

// Orbiting planet
pinepaper_create_item itemType: "circle" position: {x: 500, y: 300} properties: {radius: 15, color: "#3b82f6"}
→ planet
pinepaper_add_relation sourceId: "planet" targetId: "sun" relationType: "orbits"
  params: {radius: 100, speed: 0.5}

// Moon follows planet with delay
pinepaper_create_item itemType: "circle" position: {x: 520, y: 300} properties: {radius: 8, color: "#9ca3af"}
→ moon
pinepaper_add_relation sourceId: "moon" targetId: "planet" relationType: "follows"
  params: {offset: [30, 0], smoothing: 0.1, delay: 0.2}

// Comet maintains distance but also follows
pinepaper_create_item itemType: "circle" position: {x: 300, y: 200} properties: {radius: 6, color: "#67e8f9"}
→ comet
pinepaper_add_relation sourceId: "comet" targetId: "planet" relationType: "maintains_distance"
  params: {distance: 60, strength: 0.5}
\`\`\`

### Game Character
\`\`\`
// Character body
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300} properties: {radius: 25, color: "#3b82f6"}
→ body

// Eyes that point at mouse/target
pinepaper_create_item itemType: "circle" position: {x: 395, y: 290} properties: {radius: 5, color: "#ffffff"}
→ eye1
pinepaper_add_relation sourceId: "eye1" targetId: "body" relationType: "attached_to"
  params: {offset: [-5, -10]}

pinepaper_create_item itemType: "circle" position: {x: 405, y: 290} properties: {radius: 5, color: "#ffffff"}
→ eye2
pinepaper_add_relation sourceId: "eye2" targetId: "body" relationType: "attached_to"
  params: {offset: [5, -10]}

// Shadow follows with offset
pinepaper_create_item itemType: "ellipse" position: {x: 400, y: 330}
  properties: {width: 40, height: 15, color: "#00000044"}
→ shadow
pinepaper_add_relation sourceId: "shadow" targetId: "body" relationType: "follows"
  params: {offset: [0, 30], smoothing: 0.05}
\`\`\`

## Relation Parameters Quick Reference

| Relation | Key Params | Effect |
|----------|-----------|--------|
| follows | smoothing: 0.01-1 | Lower = snappier movement |
| follows | delay: 0-2 | Seconds of lag |
| maintains_distance | strength: 0-1 | Enforcement rigidity |
| bounds_to | bounce: true | Bounce off edges |
| bounds_to | padding: 0+ | Inner margin |
| points_at | smoothing: 0-1 | Rotation smoothness |
| points_at | offset_angle: -180 to 180 | Rotation offset |
| mirrors | axis: vertical/horizontal/both | Mirror axis |
| parallax | depth: 0-1 | Movement factor |
`,

  'pinepaper://docs/paperjs-in-pinepaper': `# Paper.js in PinePaper

PinePaper is built on Paper.js - a powerful vector graphics library. You can write Paper.js code directly in PinePaper for maximum control and flexibility.

## Two Ways to Create Graphics

### 1. MCP Tools (Recommended for AI)
Natural language-friendly, declarative approach:
\`\`\`
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300}
  properties: {radius: 50, color: "#3b82f6"}
\`\`\`

### 2. Direct Paper.js Code (Full Control)
Write JavaScript using the Paper.js API:
\`\`\`javascript
var circle = new Path.Circle({
  center: new Point(400, 300),
  radius: 50,
  fillColor: '#3b82f6'
});
\`\`\`

Both approaches work in PinePaper - use whichever fits your needs!

## Paper.js Quick Reference

### The Global Objects

PinePaper provides these Paper.js globals:
- \`paper\` - The paper scope
- \`Path\` - Path constructors
- \`Point\` - Point constructor
- \`Size\` - Size constructor
- \`Color\` - Color constructor
- \`Group\` - Group constructor
- \`view\` - The canvas view
- \`project\` - The active project

### Creating Shapes

**Circle:**
\`\`\`javascript
var circle = new Path.Circle({
  center: new Point(400, 300),
  radius: 50,
  fillColor: '#3b82f6',
  strokeColor: '#1e40af',
  strokeWidth: 2
});
\`\`\`

**Rectangle:**
\`\`\`javascript
var rect = new Path.Rectangle({
  point: new Point(350, 250),
  size: new Size(100, 100),
  fillColor: '#22c55e',
  radius: 10  // Rounded corners
});
\`\`\`

**Star:**
\`\`\`javascript
var star = new Path.Star({
  center: new Point(400, 300),
  points: 5,
  radius1: 50,  // Outer radius
  radius2: 25,  // Inner radius
  fillColor: '#fbbf24'
});
\`\`\`

**Regular Polygon:**
\`\`\`javascript
var hexagon = new Path.RegularPolygon({
  center: new Point(400, 300),
  sides: 6,
  radius: 50,
  fillColor: '#8b5cf6'
});
\`\`\`

**Line:**
\`\`\`javascript
var line = new Path.Line({
  from: new Point(100, 100),
  to: new Point(300, 200),
  strokeColor: '#ef4444',
  strokeWidth: 3
});
\`\`\`

**Arc:**
\`\`\`javascript
var arc = new Path.Arc({
  from: new Point(100, 100),
  through: new Point(150, 50),
  to: new Point(200, 100),
  strokeColor: '#06b6d4',
  strokeWidth: 2
});
\`\`\`

### Creating Paths

**From Points:**
\`\`\`javascript
var path = new Path({
  segments: [
    new Point(100, 100),
    new Point(200, 50),
    new Point(300, 100),
    new Point(250, 200)
  ],
  strokeColor: '#10b981',
  strokeWidth: 2,
  closed: true
});
path.smooth();  // Smooth the curves
\`\`\`

**Using SVG Path Data:**
\`\`\`javascript
var path = new Path(
  'M 0 -50 C 50 -50 50 50 0 50 C -50 50 -50 -50 0 -50'
);
path.position = new Point(400, 300);
path.fillColor = '#ec4899';
\`\`\`

**Building Paths Segment by Segment:**
\`\`\`javascript
var path = new Path();
path.strokeColor = '#f59e0b';
path.strokeWidth = 3;

path.moveTo(new Point(100, 100));
path.lineTo(new Point(200, 100));
path.curveTo(new Point(250, 50), new Point(300, 100));
path.closePath();
\`\`\`

### Styling Properties

\`\`\`javascript
item.fillColor = '#3b82f6';           // Fill color
item.strokeColor = '#1e40af';         // Stroke color
item.strokeWidth = 2;                  // Stroke width
item.strokeCap = 'round';             // 'butt', 'round', 'square'
item.strokeJoin = 'round';            // 'miter', 'round', 'bevel'
item.dashArray = [10, 5];             // Dashed line
item.opacity = 0.8;                    // Transparency (0-1)
item.shadowColor = '#000000';         // Shadow color
item.shadowBlur = 10;                  // Shadow blur
item.shadowOffset = new Point(5, 5);  // Shadow offset
\`\`\`

### Transformations

\`\`\`javascript
// Position
item.position = new Point(400, 300);
item.position.x += 50;

// Rotation
item.rotation = 45;                    // Degrees
item.rotate(15);                       // Rotate by amount

// Scale
item.scaling = 1.5;                    // Uniform scale
item.scaling = new Point(2, 1);       // Non-uniform
item.scale(1.2);                       // Scale by amount

// Flip
item.scale(-1, 1);                     // Flip horizontal
item.scale(1, -1);                     // Flip vertical
\`\`\`

### Groups

\`\`\`javascript
var circle = new Path.Circle({
  center: new Point(0, 0),
  radius: 30,
  fillColor: '#3b82f6'
});

var square = new Path.Rectangle({
  point: new Point(-20, -20),
  size: new Size(40, 40),
  fillColor: '#ef4444'
});

var group = new Group([circle, square]);
group.position = new Point(400, 300);
group.rotate(45);  // Rotates entire group
\`\`\`

### Animation with onFrame

Paper.js provides frame-by-frame animation:

\`\`\`javascript
var circle = new Path.Circle({
  center: view.center,
  radius: 50,
  fillColor: '#3b82f6'
});

var angle = 0;

function onFrame(event) {
  // event.count - frame count
  // event.time - total time
  // event.delta - time since last frame

  angle += 2;
  circle.position.x = view.center.x + Math.cos(angle * Math.PI / 180) * 100;
  circle.position.y = view.center.y + Math.sin(angle * Math.PI / 180) * 100;
}
\`\`\`

### Event Handling

\`\`\`javascript
// Mouse events on items
circle.onMouseEnter = function(event) {
  this.fillColor = '#ef4444';
};

circle.onMouseLeave = function(event) {
  this.fillColor = '#3b82f6';
};

circle.onClick = function(event) {
  this.scale(1.2);
};

// Global tool events
function onMouseMove(event) {
  // event.point - mouse position
  circle.position = event.point;
}

function onMouseDown(event) {
  var path = new Path.Circle({
    center: event.point,
    radius: 20,
    fillColor: '#22c55e'
  });
}
\`\`\`

### Hit Testing

\`\`\`javascript
function onMouseDown(event) {
  var hitResult = project.hitTest(event.point, {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
  });

  if (hitResult) {
    hitResult.item.selected = true;
  }
}
\`\`\`

### Working with Text

\`\`\`javascript
var text = new PointText({
  point: new Point(400, 300),
  content: 'Hello PinePaper!',
  fillColor: '#ffffff',
  fontFamily: 'Arial',
  fontWeight: 'bold',
  fontSize: 48,
  justification: 'center'
});
\`\`\`

### Importing SVG

\`\`\`javascript
// From string
var svgString = '<svg>...</svg>';
project.importSVG(svgString, function(item) {
  item.position = view.center;
  item.scale(2);
});

// Imported items become Paper.js Groups
\`\`\`

### Exporting SVG

\`\`\`javascript
var svg = project.exportSVG({ asString: true });
// Returns SVG string
\`\`\`

## Combining Paper.js with PinePaper Features

### Register Paper.js Items with PinePaper

After creating items with Paper.js, register them to use PinePaper's relation system:

\`\`\`javascript
// Create with Paper.js
var planet = new Path.Circle({
  center: new Point(400, 300),
  radius: 20,
  fillColor: '#3b82f6'
});

// Register with PinePaper (enables relations, training data export)
var itemId = app.registerItem(planet, 'circle', { source: 'paperjs' });

// Now you can use relations
app.addRelation(itemId, 'item_1', 'orbits', { radius: 100, speed: 0.5 });
\`\`\`

### Access PinePaper's App Object

\`\`\`javascript
// app is the PinePaper application instance
app.setBackgroundColor('#0f172a');
app.getItemById('item_1');
app.addRelation(sourceId, targetId, 'follows', { smoothing: 0.1 });
app.exportAnimatedSVG();
\`\`\`

## Common Patterns

### Animated Background

\`\`\`javascript
var circles = [];
for (var i = 0; i < 20; i++) {
  var circle = new Path.Circle({
    center: new Point(
      Math.random() * view.size.width,
      Math.random() * view.size.height
    ),
    radius: Math.random() * 30 + 10,
    fillColor: new Color(Math.random(), Math.random(), Math.random(), 0.5)
  });
  circles.push({
    item: circle,
    speed: Math.random() * 2 + 0.5
  });
}

function onFrame(event) {
  for (var i = 0; i < circles.length; i++) {
    circles[i].item.position.y -= circles[i].speed;
    if (circles[i].item.position.y < -50) {
      circles[i].item.position.y = view.size.height + 50;
    }
  }
}
\`\`\`

### Interactive Drawing

\`\`\`javascript
var path;

function onMouseDown(event) {
  path = new Path({
    strokeColor: '#22c55e',
    strokeWidth: 3
  });
  path.add(event.point);
}

function onMouseDrag(event) {
  path.add(event.point);
}

function onMouseUp(event) {
  path.smooth();
}
\`\`\`

### Morphing Shapes

\`\`\`javascript
var shape1 = new Path.Circle({
  center: view.center,
  radius: 50,
  fillColor: '#3b82f6'
});

var shape2 = new Path.Star({
  center: view.center,
  points: 5,
  radius1: 80,
  radius2: 40,
  fillColor: '#ef4444',
  visible: false
});

var morphing = false;
var t = 0;

shape1.onClick = function() {
  morphing = !morphing;
};

function onFrame(event) {
  if (morphing) {
    t = Math.min(t + 0.02, 1);
  } else {
    t = Math.max(t - 0.02, 0);
  }

  // Interpolate between shapes
  for (var i = 0; i < shape1.segments.length; i++) {
    var seg1 = shape1.segments[i];
    var seg2 = shape2.segments[i % shape2.segments.length];
    seg1.point = seg1.point.add(
      seg2.point.subtract(seg1.point).multiply(t * 0.1)
    );
  }
}
\`\`\`

## Paper.js Resources

- **Official Docs**: http://paperjs.org/reference/
- **Tutorials**: http://paperjs.org/tutorials/
- **Examples**: http://paperjs.org/examples/

## When to Use Paper.js vs MCP Tools

| Use Paper.js When | Use MCP Tools When |
|-------------------|-------------------|
| Need frame-by-frame animation control | Want declarative animation (orbits, follows) |
| Complex procedural generation | Creating standard shapes |
| Interactive mouse/keyboard handling | AI-driven content creation |
| Custom path manipulation algorithms | Building compositions with relations |
| Porting existing Paper.js code | Generating training data |
| Need maximum performance | Want simpler, higher-level API |
`,

  'pinepaper://examples/logo-animation': `# Logo Animation Example

Create a professional animated logo with entrance effects and continuous motion.

## What You'll Build

An animated company logo featuring:
- Geometric shapes assembling together
- Text reveal with typewriter effect
- Continuous subtle animations
- Professional polish with effects

## Step 1: Canvas Setup

\`\`\`
pinepaper_browser_connect
pinepaper_clear_canvas
pinepaper_set_background_color color: "#0f172a"
pinepaper_set_canvas_size width: 800 height: 600
\`\`\`

## Step 2: Create Logo Mark (Geometric Icon)

Build an abstract logo from shapes:

\`\`\`
// Main hexagon
pinepaper_create_item
  itemType: "polygon"
  position: {x: 300, y: 280}
  properties:
    sides: 6
    radius: 70
    color: "#3b82f6"
→ hex_main

// Inner triangle pointing up
pinepaper_create_item
  itemType: "path"
  position: {x: 300, y: 280}
  properties:
    segments: [[0, -35], [30, 20], [-30, 20]]
    closed: true
    fillColor: "#1e40af"
    strokeWidth: 0
→ triangle_inner

// Accent circle
pinepaper_create_item
  itemType: "circle"
  position: {x: 300, y: 255}
  properties:
    radius: 12
    color: "#60a5fa"
→ accent_dot
\`\`\`

## Step 3: Animate Logo Assembly

Use keyframe animation to assemble the logo:

\`\`\`
// Hexagon scales in from nothing
pinepaper_keyframe_animate
  itemId: "hex_main"
  keyframes:
    - time: 0
      properties: {scale: 0, opacity: 0}
      easing: "easeOut"
    - time: 0.5
      properties: {scale: 1.1, opacity: 1}
      easing: "easeInOut"
    - time: 0.7
      properties: {scale: 1, opacity: 1}
  duration: 0.7

// Triangle fades in and slides up
pinepaper_keyframe_animate
  itemId: "triangle_inner"
  keyframes:
    - time: 0
      properties: {opacity: 0, y: 300}
    - time: 0.3
      properties: {opacity: 0, y: 300}
    - time: 0.6
      properties: {opacity: 1, y: 280}
      easing: "easeOut"
  duration: 0.6

// Accent dot pops in
pinepaper_keyframe_animate
  itemId: "accent_dot"
  keyframes:
    - time: 0
      properties: {scale: 0}
    - time: 0.5
      properties: {scale: 0}
    - time: 0.7
      properties: {scale: 1.3}
      easing: "elastic"
    - time: 0.9
      properties: {scale: 1}
  duration: 0.9
\`\`\`

## Step 4: Add Company Name

\`\`\`
// Company name with typewriter effect
pinepaper_create_item
  itemType: "text"
  position: {x: 480, y: 260}
  properties:
    content: "ACME"
    fontSize: 56
    fontFamily: "Arial Black, sans-serif"
    fontWeight: "bold"
    color: "#ffffff"
→ company_name

// Tagline
pinepaper_create_item
  itemType: "text"
  position: {x: 480, y: 310}
  properties:
    content: "Innovation Labs"
    fontSize: 20
    fontFamily: "Arial, sans-serif"
    color: "#94a3b8"
→ tagline

// Typewriter effect on company name
pinepaper_animate_item
  itemId: "company_name"
  animationType: "typewriter"
  speed: 3
\`\`\`

## Step 5: Add Continuous Motion

Subtle animations that loop forever:

\`\`\`
// Hexagon has gentle pulse
pinepaper_animate_item
  itemId: "hex_main"
  animationType: "pulse"
  speed: 0.3

// Accent dot orbits slightly
pinepaper_add_relation
  sourceId: "accent_dot"
  targetId: "hex_main"
  relationType: "orbits"
  params: {radius: 3, speed: 0.5}

// Triangle has subtle rotation
pinepaper_animate_item
  itemId: "triangle_inner"
  animationType: "wobble"
  speed: 0.2
\`\`\`

## Step 6: Add Sparkle Effect

\`\`\`
// Sparkle on accent dot
pinepaper_apply_effect
  itemId: "accent_dot"
  effectType: "sparkle"
  params:
    color: "#93c5fd"
    speed: 0.8
    size: 2
\`\`\`

## Step 7: Add Decorative Elements

\`\`\`
// Subtle line under text
pinepaper_create_item
  itemType: "line"
  properties:
    from: [400, 340]
    to: [560, 340]
    strokeColor: "#3b82f6"
    strokeWidth: 2
→ underline

// Animated line reveal
pinepaper_keyframe_animate
  itemId: "underline"
  keyframes:
    - time: 0
      properties: {opacity: 0, scaleX: 0}
    - time: 0.8
      properties: {opacity: 0, scaleX: 0}
    - time: 1.2
      properties: {opacity: 1, scaleX: 1}
      easing: "easeOut"
  duration: 1.2
\`\`\`

## Step 8: Apply Film Look (Optional)

\`\`\`
pinepaper_add_filter filterType: "vignette" params: {intensity: 0.3, radius: 0.8}
\`\`\`

## Step 9: Verify and Export

\`\`\`
pinepaper_browser_screenshot

pinepaper_export_svg animated: true
\`\`\`

## Result

A professional logo animation with:
- Shapes assembling from nothing
- Text typing in
- Continuous subtle motion
- Sparkle accents
- Cinematic vignette

## Variations

### Minimalist Version
Remove sparkle and reduce animation speeds by 50%.

### Energetic Version
Increase all speeds, add more orbiting elements, use blast effect.

### Corporate Version
Use grayscale filter, slower animations, no sparkle.

## Key Techniques

| Effect | Technique |
|--------|-----------|
| Assembly animation | Keyframes with scale 0→1 |
| Text reveal | typewriter animation type |
| Bounce overshoot | elastic easing |
| Subtle motion | Low speed pulse/wobble |
| Polish | sparkle effect, vignette filter |
`,

  'pinepaper://examples/data-visualization': `# Data Visualization Example

Create animated charts and infographics that bring data to life.

## Animated Bar Chart

### Step 1: Setup
\`\`\`
pinepaper_browser_connect
pinepaper_clear_canvas
pinepaper_set_background_color color: "#1f2937"
\`\`\`

### Step 2: Create Axes
\`\`\`
// Y-axis
pinepaper_create_item itemType: "line"
  properties: {from: [100, 450], to: [100, 100], strokeColor: "#6b7280", strokeWidth: 2}

// X-axis
pinepaper_create_item itemType: "line"
  properties: {from: [100, 450], to: [700, 450], strokeColor: "#6b7280", strokeWidth: 2}

// Y-axis labels
pinepaper_create_item itemType: "text" position: {x: 70, y: 450}
  properties: {content: "0", fontSize: 14, color: "#9ca3af"}
pinepaper_create_item itemType: "text" position: {x: 70, y: 350}
  properties: {content: "25", fontSize: 14, color: "#9ca3af"}
pinepaper_create_item itemType: "text" position: {x: 70, y: 250}
  properties: {content: "50", fontSize: 14, color: "#9ca3af"}
pinepaper_create_item itemType: "text" position: {x: 70, y: 150}
  properties: {content: "75", fontSize: 14, color: "#9ca3af"}
\`\`\`

### Step 3: Create Animated Bars
Data: Q1=45, Q2=62, Q3=38, Q4=71

\`\`\`
// Q1 Bar (height: 45% of 300px = 135px)
pinepaper_create_item itemType: "rectangle" position: {x: 200, y: 382}
  properties: {width: 60, height: 135, color: "#3b82f6"}
→ bar_q1

// Q2 Bar (height: 62% = 186px)
pinepaper_create_item itemType: "rectangle" position: {x: 320, y: 357}
  properties: {width: 60, height: 186, color: "#8b5cf6"}
→ bar_q2

// Q3 Bar (height: 38% = 114px)
pinepaper_create_item itemType: "rectangle" position: {x: 440, y: 393}
  properties: {width: 60, height: 114, color: "#ec4899"}
→ bar_q3

// Q4 Bar (height: 71% = 213px)
pinepaper_create_item itemType: "rectangle" position: {x: 560, y: 343}
  properties: {width: 60, height: 213, color: "#f59e0b"}
→ bar_q4

// X-axis labels
pinepaper_create_item itemType: "text" position: {x: 200, y: 480}
  properties: {content: "Q1", fontSize: 16, color: "#ffffff"}
pinepaper_create_item itemType: "text" position: {x: 320, y: 480}
  properties: {content: "Q2", fontSize: 16, color: "#ffffff"}
pinepaper_create_item itemType: "text" position: {x: 440, y: 480}
  properties: {content: "Q3", fontSize: 16, color: "#ffffff"}
pinepaper_create_item itemType: "text" position: {x: 560, y: 480}
  properties: {content: "Q4", fontSize: 16, color: "#ffffff"}
\`\`\`

### Step 4: Animate Bars Growing
\`\`\`
// Bars grow from bottom
pinepaper_keyframe_animate itemId: "bar_q1"
  keyframes:
    - time: 0
      properties: {scaleY: 0}
    - time: 0.5
      properties: {scaleY: 1}
      easing: "easeOut"
  duration: 0.5

pinepaper_keyframe_animate itemId: "bar_q2"
  keyframes:
    - time: 0
      properties: {scaleY: 0}
    - time: 0.2
      properties: {scaleY: 0}
    - time: 0.7
      properties: {scaleY: 1}
      easing: "easeOut"
  duration: 0.7

pinepaper_keyframe_animate itemId: "bar_q3"
  keyframes:
    - time: 0
      properties: {scaleY: 0}
    - time: 0.4
      properties: {scaleY: 0}
    - time: 0.9
      properties: {scaleY: 1}
      easing: "easeOut"
  duration: 0.9

pinepaper_keyframe_animate itemId: "bar_q4"
  keyframes:
    - time: 0
      properties: {scaleY: 0}
    - time: 0.6
      properties: {scaleY: 0}
    - time: 1.1
      properties: {scaleY: 1}
      easing: "easeOut"
  duration: 1.1
\`\`\`

---

## Animated Pie Chart

### Step 1: Create Pie Slices
Using arc paths for pie segments:

\`\`\`
pinepaper_set_background_color color: "#1e293b"

// Center point for reference
pinepaper_create_item itemType: "circle" position: {x: 400, y: 300}
  properties: {radius: 5, color: null}
→ center

// Slice 1: 40% (144 degrees) - Blue
pinepaper_create_item itemType: "path" position: {x: 400, y: 300}
  properties:
    pathData: "M 0 0 L 0 -100 A 100 100 0 0 1 95 31 Z"
    fillColor: "#3b82f6"
    strokeColor: "#1e293b"
    strokeWidth: 2
→ slice1

// Slice 2: 25% (90 degrees) - Purple
pinepaper_create_item itemType: "path" position: {x: 400, y: 300}
  properties:
    pathData: "M 0 0 L 95 31 A 100 100 0 0 1 0 100 Z"
    fillColor: "#8b5cf6"
    strokeColor: "#1e293b"
    strokeWidth: 2
→ slice2

// Slice 3: 20% (72 degrees) - Pink
pinepaper_create_item itemType: "path" position: {x: 400, y: 300}
  properties:
    pathData: "M 0 0 L 0 100 A 100 100 0 0 1 -95 31 Z"
    fillColor: "#ec4899"
    strokeColor: "#1e293b"
    strokeWidth: 2
→ slice3

// Slice 4: 15% (54 degrees) - Orange
pinepaper_create_item itemType: "path" position: {x: 400, y: 300}
  properties:
    pathData: "M 0 0 L -95 31 A 100 100 0 0 1 0 -100 Z"
    fillColor: "#f59e0b"
    strokeColor: "#1e293b"
    strokeWidth: 2
→ slice4
\`\`\`

### Step 2: Animate Pie Spinning In
\`\`\`
// Entire pie rotates in
pinepaper_animate_item itemId: "slice1" animationType: "rotate" speed: 0.1
pinepaper_keyframe_animate itemId: "slice1"
  keyframes:
    - time: 0
      properties: {scale: 0, rotation: -180}
    - time: 1
      properties: {scale: 1, rotation: 0}
      easing: "easeOut"
  duration: 1
\`\`\`

### Step 3: Add Labels
\`\`\`
pinepaper_create_item itemType: "text" position: {x: 440, y: 240}
  properties: {content: "40%", fontSize: 18, fontWeight: "bold", color: "#ffffff"}
→ label1
pinepaper_add_relation sourceId: "label1" targetId: "slice1" relationType: "attached_to"
  params: {offset: [40, -60]}
\`\`\`

---

## Animated Line Graph

### Create Data Points and Line
\`\`\`
// Data points: (100,350), (200,280), (300,320), (400,200), (500,180), (600,250)

// Line connecting points
pinepaper_create_item itemType: "path" position: {x: 350, y: 265}
  properties:
    segments: [[-250, 85], [-150, 15], [-50, 55], [50, -65], [150, -85], [250, -15]]
    smooth: true
    closed: false
    strokeColor: "#22c55e"
    strokeWidth: 3
    fillColor: null
→ data_line

// Data points as circles
pinepaper_create_item itemType: "circle" position: {x: 100, y: 350}
  properties: {radius: 6, color: "#22c55e"}
→ point1

pinepaper_create_item itemType: "circle" position: {x: 200, y: 280}
  properties: {radius: 6, color: "#22c55e"}
→ point2

pinepaper_create_item itemType: "circle" position: {x: 300, y: 320}
  properties: {radius: 6, color: "#22c55e"}
→ point3

pinepaper_create_item itemType: "circle" position: {x: 400, y: 200}
  properties: {radius: 6, color: "#22c55e"}
→ point4

pinepaper_create_item itemType: "circle" position: {x: 500, y: 180}
  properties: {radius: 6, color: "#22c55e"}
→ point5

pinepaper_create_item itemType: "circle" position: {x: 600, y: 250}
  properties: {radius: 6, color: "#22c55e"}
→ point6
\`\`\`

### Animate Points Appearing
\`\`\`
// Points pop in sequentially
pinepaper_keyframe_animate itemId: "point1"
  keyframes:
    - time: 0
      properties: {scale: 0}
    - time: 0.2
      properties: {scale: 1.3}
      easing: "easeOut"
    - time: 0.3
      properties: {scale: 1}
  duration: 0.3

pinepaper_keyframe_animate itemId: "point2"
  keyframes:
    - time: 0
      properties: {scale: 0}
    - time: 0.15
      properties: {scale: 0}
    - time: 0.35
      properties: {scale: 1.3}
    - time: 0.45
      properties: {scale: 1}
  duration: 0.45

// ... continue for remaining points with staggered delays
\`\`\`

---

## Gauge/Meter Chart

\`\`\`
// Gauge background arc
pinepaper_create_item itemType: "path" position: {x: 400, y: 350}
  properties:
    pathData: "M -120 0 A 120 120 0 0 1 120 0"
    strokeColor: "#374151"
    strokeWidth: 20
    fillColor: null
→ gauge_bg

// Gauge value arc (75% = 135 degrees)
pinepaper_create_item itemType: "path" position: {x: 400, y: 350}
  properties:
    pathData: "M -120 0 A 120 120 0 0 1 85 -85"
    strokeColor: "#22c55e"
    strokeWidth: 20
    fillColor: null
→ gauge_value

// Center label
pinepaper_create_item itemType: "text" position: {x: 400, y: 350}
  properties: {content: "75%", fontSize: 48, fontWeight: "bold", color: "#ffffff"}
→ gauge_label

// Needle
pinepaper_create_item itemType: "path" position: {x: 400, y: 350}
  properties:
    segments: [[0, 10], [-5, 0], [0, -90], [5, 0]]
    closed: true
    fillColor: "#ef4444"
→ needle

// Animate needle sweeping to value
pinepaper_keyframe_animate itemId: "needle"
  keyframes:
    - time: 0
      properties: {rotation: -90}
    - time: 1.5
      properties: {rotation: 45}
      easing: "easeOut"
  duration: 1.5
\`\`\`

## Key Techniques for Data Viz

| Visualization | Key Techniques |
|---------------|----------------|
| Bar Chart | Rectangles + scaleY keyframes |
| Pie Chart | Arc paths + rotation |
| Line Graph | Smooth path + point circles |
| Gauge | Arc paths + needle rotation |
| Animation | Staggered keyframes, easeOut |
| Labels | Text with attached_to relations |
`,

  'pinepaper://examples/particle-systems': `# Particle Systems Example

Build dynamic particle effects like fireworks, starfields, snow, and fire.

## Starfield / Space Background

### Step 1: Create Background
\`\`\`
pinepaper_browser_connect
pinepaper_clear_canvas
pinepaper_set_background_color color: "#000011"
\`\`\`

### Step 2: Create Star Layers (Parallax Depth)
\`\`\`
// Far stars (small, slow)
pinepaper_create_item itemType: "circle" position: {x: 100, y: 150} properties: {radius: 1, color: "#6b7280"}
pinepaper_create_item itemType: "circle" position: {x: 250, y: 80} properties: {radius: 1, color: "#6b7280"}
pinepaper_create_item itemType: "circle" position: {x: 450, y: 200} properties: {radius: 1, color: "#6b7280"}
pinepaper_create_item itemType: "circle" position: {x: 600, y: 120} properties: {radius: 1, color: "#6b7280"}
pinepaper_create_item itemType: "circle" position: {x: 700, y: 250} properties: {radius: 1, color: "#6b7280"}

// Mid stars (medium)
pinepaper_create_item itemType: "circle" position: {x: 150, y: 300} properties: {radius: 2, color: "#9ca3af"}
→ mid1
pinepaper_create_item itemType: "circle" position: {x: 350, y: 400} properties: {radius: 2, color: "#9ca3af"}
→ mid2
pinepaper_create_item itemType: "circle" position: {x: 550, y: 350} properties: {radius: 2, color: "#9ca3af"}
→ mid3

// Near stars (larger, twinkling)
pinepaper_create_item itemType: "circle" position: {x: 200, y: 250} properties: {radius: 3, color: "#e5e7eb"}
→ near1
pinepaper_create_item itemType: "circle" position: {x: 500, y: 180} properties: {radius: 3, color: "#e5e7eb"}
→ near2
pinepaper_create_item itemType: "circle" position: {x: 650, y: 400} properties: {radius: 3, color: "#e5e7eb"}
→ near3
\`\`\`

### Step 3: Add Twinkle Animation
\`\`\`
pinepaper_animate_item itemId: "near1" animationType: "fade" speed: 2
pinepaper_animate_item itemId: "near2" animationType: "fade" speed: 1.5
pinepaper_animate_item itemId: "near3" animationType: "fade" speed: 2.5

pinepaper_animate_item itemId: "mid1" animationType: "pulse" speed: 0.5
pinepaper_animate_item itemId: "mid2" animationType: "pulse" speed: 0.7
\`\`\`

### Step 4: Add Shooting Star
\`\`\`
// Shooting star head
pinepaper_create_item itemType: "circle" position: {x: 100, y: 100} properties: {radius: 4, color: "#fef3c7"}
→ shooting_star

// Shooting star tail
pinepaper_create_item itemType: "path" position: {x: 100, y: 100}
  properties:
    segments: [[0, 0], [-30, 15], [-80, 40], [-150, 75]]
    smooth: true
    strokeColor: "#fef3c7"
    strokeWidth: 2
    opacity: 0.5
    fillColor: null
→ star_tail

// Tail follows star
pinepaper_add_relation sourceId: "star_tail" targetId: "shooting_star" relationType: "attached_to"
  params: {offset: [0, 0]}

// Animate shooting star across screen
pinepaper_keyframe_animate itemId: "shooting_star"
  keyframes:
    - time: 0
      properties: {x: 100, y: 100, opacity: 1}
    - time: 2
      properties: {x: 700, y: 400, opacity: 0}
  duration: 2
  loop: true
\`\`\`

---

## Snowfall Effect

\`\`\`
pinepaper_set_background_color color: "#1e3a5f"

// Create snowflakes at different sizes and speeds
// Large, slow flakes (foreground)
pinepaper_create_item itemType: "circle" position: {x: 150, y: 50} properties: {radius: 5, color: "#ffffff"}
→ snow1
pinepaper_animate_item itemId: "snow1" animationType: "bounce" speed: 0.3
pinepaper_animate_item itemId: "snow1" animationType: "wobble" speed: 0.5

pinepaper_create_item itemType: "circle" position: {x: 400, y: 100} properties: {radius: 4, color: "#ffffff"}
→ snow2
pinepaper_animate_item itemId: "snow2" animationType: "bounce" speed: 0.35
pinepaper_animate_item itemId: "snow2" animationType: "wobble" speed: 0.6

pinepaper_create_item itemType: "circle" position: {x: 650, y: 30} properties: {radius: 5, color: "#ffffff"}
→ snow3
pinepaper_animate_item itemId: "snow3" animationType: "bounce" speed: 0.25
pinepaper_animate_item itemId: "snow3" animationType: "wobble" speed: 0.4

// Medium flakes
pinepaper_create_item itemType: "circle" position: {x: 250, y: 150} properties: {radius: 3, color: "#e5e7eb"}
→ snow4
pinepaper_animate_item itemId: "snow4" animationType: "bounce" speed: 0.4

pinepaper_create_item itemType: "circle" position: {x: 500, y: 80} properties: {radius: 3, color: "#e5e7eb"}
→ snow5
pinepaper_animate_item itemId: "snow5" animationType: "bounce" speed: 0.45

// Small, fast flakes (background)
pinepaper_create_item itemType: "circle" position: {x: 100, y: 200} properties: {radius: 2, color: "#d1d5db"}
→ snow6
pinepaper_animate_item itemId: "snow6" animationType: "bounce" speed: 0.6

pinepaper_create_item itemType: "circle" position: {x: 350, y: 250} properties: {radius: 2, color: "#d1d5db"}
→ snow7
pinepaper_animate_item itemId: "snow7" animationType: "bounce" speed: 0.55
\`\`\`

---

## Fireworks Display

\`\`\`
pinepaper_set_background_color color: "#0a0a1a"

// Firework 1: Red burst
pinepaper_create_item itemType: "circle" position: {x: 250, y: 200} properties: {radius: 8, color: "#ef4444"}
→ fw1_center

pinepaper_apply_effect itemId: "fw1_center" effectType: "blast"
  params: {color: "#fca5a5", radius: 120, count: 25}

// Animate burst
pinepaper_keyframe_animate itemId: "fw1_center"
  keyframes:
    - time: 0
      properties: {scale: 0, y: 500}
    - time: 0.5
      properties: {scale: 0.5, y: 200}
    - time: 0.7
      properties: {scale: 1, y: 200}
    - time: 1.5
      properties: {scale: 0, opacity: 0}
  duration: 1.5
  loop: true

// Firework 2: Gold burst
pinepaper_create_item itemType: "circle" position: {x: 500, y: 180} properties: {radius: 8, color: "#fbbf24"}
→ fw2_center

pinepaper_apply_effect itemId: "fw2_center" effectType: "blast"
  params: {color: "#fef3c7", radius: 100, count: 20}

// Sparkle on bursts
pinepaper_apply_effect itemId: "fw1_center" effectType: "sparkle"
  params: {color: "#fca5a5", speed: 2, size: 3}
pinepaper_apply_effect itemId: "fw2_center" effectType: "sparkle"
  params: {color: "#fef3c7", speed: 2, size: 3}
\`\`\`

---

## Fire/Flame Effect

\`\`\`
pinepaper_set_background_color color: "#1a1a2e"

// Fire base (log)
pinepaper_create_item itemType: "rectangle" position: {x: 400, y: 480}
  properties: {width: 120, height: 30, color: "#78350f", cornerRadius: 5}

// Flame layers (outer to inner)
// Outer red glow
pinepaper_create_item itemType: "path" position: {x: 400, y: 400}
  properties:
    pathData: "M 0 60 Q -50 30 -40 -20 Q -20 -60 0 -80 Q 20 -60 40 -20 Q 50 30 0 60"
    fillColor: "#dc2626"
    opacity: 0.6
→ flame_outer

// Middle orange
pinepaper_create_item itemType: "path" position: {x: 400, y: 410}
  properties:
    pathData: "M 0 45 Q -35 20 -28 -15 Q -14 -45 0 -60 Q 14 -45 28 -15 Q 35 20 0 45"
    fillColor: "#f59e0b"
    opacity: 0.8
→ flame_mid

// Inner yellow
pinepaper_create_item itemType: "path" position: {x: 400, y: 420}
  properties:
    pathData: "M 0 30 Q -20 10 -15 -10 Q -8 -30 0 -40 Q 8 -30 15 -10 Q 20 10 0 30"
    fillColor: "#fbbf24"
→ flame_inner

// Core white
pinepaper_create_item itemType: "path" position: {x: 400, y: 430}
  properties:
    pathData: "M 0 15 Q -8 5 -5 -5 Q -3 -15 0 -20 Q 3 -15 5 -5 Q 8 5 0 15"
    fillColor: "#fef3c7"
→ flame_core

// Animate flames
pinepaper_animate_item itemId: "flame_outer" animationType: "wobble" speed: 3
pinepaper_animate_item itemId: "flame_mid" animationType: "wobble" speed: 3.5
pinepaper_animate_item itemId: "flame_inner" animationType: "wobble" speed: 4
pinepaper_animate_item itemId: "flame_core" animationType: "wobble" speed: 4.5

// Add flickering
pinepaper_animate_item itemId: "flame_outer" animationType: "fade" speed: 5
pinepaper_animate_item itemId: "flame_mid" animationType: "fade" speed: 6

// Sparks rising
pinepaper_create_item itemType: "circle" position: {x: 390, y: 380} properties: {radius: 2, color: "#fbbf24"}
→ spark1
pinepaper_animate_item itemId: "spark1" animationType: "bounce" speed: 2
pinepaper_animate_item itemId: "spark1" animationType: "fade" speed: 3

pinepaper_create_item itemType: "circle" position: {x: 410, y: 370} properties: {radius: 2, color: "#f59e0b"}
→ spark2
pinepaper_animate_item itemId: "spark2" animationType: "bounce" speed: 2.2
pinepaper_animate_item itemId: "spark2" animationType: "fade" speed: 2.5
\`\`\`

---

## Bubble Float Effect

\`\`\`
pinepaper_set_background_color color: "#0ea5e9"

// Create bubbles with different sizes
pinepaper_create_item itemType: "circle" position: {x: 150, y: 500}
  properties: {radius: 20, fillColor: null, strokeColor: "#ffffff", strokeWidth: 2, opacity: 0.6}
→ bubble1

pinepaper_create_item itemType: "circle" position: {x: 300, y: 520}
  properties: {radius: 15, fillColor: null, strokeColor: "#ffffff", strokeWidth: 2, opacity: 0.5}
→ bubble2

pinepaper_create_item itemType: "circle" position: {x: 450, y: 480}
  properties: {radius: 25, fillColor: null, strokeColor: "#ffffff", strokeWidth: 2, opacity: 0.7}
→ bubble3

pinepaper_create_item itemType: "circle" position: {x: 600, y: 510}
  properties: {radius: 12, fillColor: null, strokeColor: "#ffffff", strokeWidth: 2, opacity: 0.5}
→ bubble4

// Add highlight to each bubble
pinepaper_create_item itemType: "circle" position: {x: 145, y: 490}
  properties: {radius: 4, color: "#ffffff", opacity: 0.8}
→ highlight1
pinepaper_add_relation sourceId: "highlight1" targetId: "bubble1" relationType: "attached_to"
  params: {offset: [-5, -10]}

// Animate bubbles floating up with wobble
pinepaper_animate_item itemId: "bubble1" animationType: "bounce" speed: 0.3
pinepaper_animate_item itemId: "bubble1" animationType: "wobble" speed: 0.5

pinepaper_animate_item itemId: "bubble2" animationType: "bounce" speed: 0.35
pinepaper_animate_item itemId: "bubble2" animationType: "wobble" speed: 0.6

pinepaper_animate_item itemId: "bubble3" animationType: "bounce" speed: 0.25
pinepaper_animate_item itemId: "bubble3" animationType: "wobble" speed: 0.4

pinepaper_animate_item itemId: "bubble4" animationType: "bounce" speed: 0.4
pinepaper_animate_item itemId: "bubble4" animationType: "wobble" speed: 0.7
\`\`\`

## Particle System Techniques

| Effect | Key Techniques |
|--------|----------------|
| Stars | Multiple sizes, fade animation, parallax layers |
| Snow | bounce + wobble, size variation, opacity variation |
| Fireworks | blast effect + sparkle, keyframe rise animation |
| Fire | Layered paths, wobble + fade, warm color gradient |
| Bubbles | Stroke-only circles, attached highlights, bounce |
| Rain | Lines at angle, fast bounce, blue tints |
| Dust | Tiny circles, slow fade, random positions |
| Confetti | Small rectangles, rotate + bounce, rainbow colors |
`,
};

// =============================================================================
// SERVER OPTIONS
// =============================================================================

export interface ServerOptions {
  locale?: SupportedLocale;
  /** Enable browser execution mode - executes code in real browser via Puppeteer */
  browserMode?: boolean;
}

// =============================================================================
// SERVER CREATION
// =============================================================================

export async function createServer(options: ServerOptions = {}): Promise<Server> {
  // Initialize i18n with specified locale
  const locale = options.locale || detectLocaleFromEnvironment();
  const i18n = await initI18n(locale);

  const server = new Server(SERVER_INFO, {
    capabilities: {
      tools: {},
      resources: {},
    },
  });

  // ---------------------------------------------------------------------------
  // TOOL HANDLERS
  // ---------------------------------------------------------------------------

  // List available tools (with optional localization)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Tool descriptions are kept in English for AI understanding
    // but can be localized if needed for UI display
    return {
      tools: PINEPAPER_TOOLS,
    };
  });

  // Handle tool calls with i18n support for errors and success messages
  // Browser mode enables live execution in PinePaper Studio
  const executeInBrowser = options.browserMode ?? true; // Default to browser mode
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args as Record<string, unknown>, {
      i18n,
      executeInBrowser,
    });
  });

  // ---------------------------------------------------------------------------
  // RESOURCE HANDLERS
  // ---------------------------------------------------------------------------

  // List available resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: RESOURCES,
    };
  });

  // Read resource content
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    const content = RESOURCE_CONTENTS[uri];

    if (!content) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  });

  return server;
}

// =============================================================================
// LOCALE DETECTION
// =============================================================================

/**
 * Detect locale from environment variables
 * Checks PINEPAPER_LOCALE, LANG, LC_ALL, LC_MESSAGES
 */
function detectLocaleFromEnvironment(): SupportedLocale {
  // Check explicit PinePaper locale setting
  const pinepaperLocale = process.env.PINEPAPER_LOCALE;
  if (pinepaperLocale && isValidLocale(pinepaperLocale)) {
    return pinepaperLocale as SupportedLocale;
  }

  // Check standard locale environment variables
  const envLocale =
    process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '';

  // Parse locale string (e.g., "en_US.UTF-8" -> "en")
  const localePart = envLocale.split('.')[0]; // Remove encoding
  const langPart = localePart.split('_')[0]; // Get language code

  if (isValidLocale(langPart)) {
    return langPart as SupportedLocale;
  }

  // Check for regional variants (e.g., "zh_CN" -> "zh-CN")
  const regionalLocale = localePart.replace('_', '-');
  if (isValidLocale(regionalLocale)) {
    return regionalLocale as SupportedLocale;
  }

  return DEFAULT_LOCALE;
}

/**
 * Check if a string is a valid supported locale
 */
function isValidLocale(locale: string): boolean {
  const SUPPORTED = [
    'en',
    'es',
    'fr',
    'de',
    'it',
    'pt',
    'pt-BR',
    'nl',
    'pl',
    'ru',
    'uk',
    'zh-CN',
    'zh-TW',
    'ja',
    'ko',
    'th',
    'vi',
    'id',
    'ms',
    'tl',
    'hi',
    'bn',
    'ta',
    'te',
    'mr',
    'gu',
    'kn',
    'ml',
    'pa',
    'ar',
    'he',
    'fa',
    'tr',
    'sv',
    'da',
    'no',
    'fi',
    'cs',
    'el',
    'hu',
    'ro',
  ];
  return SUPPORTED.includes(locale);
}

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

async function main(): Promise<void> {
  const locale = detectLocaleFromEnvironment();
  const server = await createServer({ locale });
  const transport = new StdioServerTransport();

  console.error('PinePaper MCP Server starting...');
  console.error(`Version: ${SERVER_INFO.version}`);
  console.error(`Locale: ${locale}`);
  console.error(`Tools: ${PINEPAPER_TOOLS.length}`);
  console.error(`Resources: ${RESOURCES.length}`);

  await server.connect(transport);

  console.error('PinePaper MCP Server running on stdio');
}

// Run if executed directly
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
