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
    uri: 'pinepaper://examples/solar-system',
    name: 'Solar System Example',
    description: 'Create an animated solar system with orbiting planets',
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

  'pinepaper://examples/solar-system': `# Solar System Example

Create an animated solar system with orbiting planets.

## Step by Step

### 1. Set up the canvas
\`\`\`
Set background color to #0f172a (dark blue)
\`\`\`

### 2. Create the sun
\`\`\`
Create a yellow circle at position (400, 300) with radius 60
→ This creates item_1 (the sun)
\`\`\`

### 3. Create Earth
\`\`\`
Create a blue circle at position (550, 300) with radius 20
→ This creates item_2 (Earth)
\`\`\`

### 4. Create the Moon
\`\`\`
Create a gray circle at position (590, 300) with radius 8
→ This creates item_3 (Moon)
\`\`\`

### 5. Add orbital relations
\`\`\`
Add relation: item_2 (Earth) orbits item_1 (Sun) at radius 150, speed 0.3
Add relation: item_3 (Moon) orbits item_2 (Earth) at radius 40, speed 0.8
\`\`\`

### 6. Add labels (optional)
\`\`\`
Create text "Sun" at (400, 250)
Add relation: text attached_to item_1 with offset [0, -70]
\`\`\`

## Result

The Earth orbits the Sun, and the Moon orbits the Earth, all with smooth automatic animation!

## Training Data

This scene generates training pairs like:
- "Earth orbits Sun at radius 150" → \`app.addRelation('item_2', 'item_1', 'orbits', {radius: 150})\`
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
