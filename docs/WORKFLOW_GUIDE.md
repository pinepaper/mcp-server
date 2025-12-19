# PinePaper MCP Workflow Guide

## Overview

This guide provides comprehensive workflow patterns, decision trees, and best practices for using PinePaper MCP tools effectively. Use this as a reference when planning complex scenes or debugging issues.

---

## Table of Contents

1. [Decision Trees](#decision-trees)
2. [Multi-Step Workflow Patterns](#multi-step-workflow-patterns)
3. [Performance Optimization](#performance-optimization)
4. [Common Scenarios](#common-scenarios)
5. [Troubleshooting](#troubleshooting)

---

## Decision Trees

### Choosing the Right Animation Tool

```
START: "I want to animate an item"
│
├─→ Q: Is it a simple looping effect?
│   ├─→ YES: Use pinepaper_animate
│   │   • pulse (scale up/down)
│   │   • rotate (continuous spin)
│   │   • bounce (vertical bounce)
│   │   • fade (opacity cycle)
│   │   • wobble (side-to-side)
│   │   • slide (horizontal slide)
│   │   • typewriter (text reveal)
│   │
│   └─→ NO: Continue ↓
│
├─→ Q: Does it involve behavior relative to another item?
│   ├─→ YES: Use pinepaper_add_relation
│   │   • Moon orbits Earth → relationType: "orbits"
│   │   • Label follows player → relationType: "follows"
│   │   • Hat attached to head → relationType: "attached_to"
│   │   • Arrow points at target → relationType: "points_at"
│   │   • Reflection mirrors original → relationType: "mirrors"
│   │   • Background parallax effect → relationType: "parallax"
│   │   • Keep item within bounds → relationType: "bounds_to"
│   │   • Maintain fixed distance → relationType: "maintains_distance"
│   │
│   └→ NO: Continue ↓
│
└─→ Q: Do you need precise timing control?
    ├─→ YES: Use pinepaper_keyframe_animate
    │   • "Fade in over 3 seconds" → keyframes at time 0 and 3
    │   • "Move from A to B, then to C" → keyframes for each position
    │   • "Scale up, pause, scale down" → keyframes with delays
    │
    └─→ NO: Combine multiple approaches or use keyframe for custom timing
```

### Choosing Between Batch vs Individual Operations

```
START: "I need to create/modify multiple items"
│
├─→ Q: How many items?
│   ├─→ 1-3 items: Individual operations OK
│   └─→ 4+ items: Consider batch ↓
│
├─→ Q: Are all items similar (same type/properties)?
│   ├─→ YES: Definitely use batch operations
│   │   • pinepaper_batch_create
│   │   • pinepaper_batch_modify
│   │
│   └─→ NO: Continue ↓
│
└─→ Q: Do you need different properties for each?
    ├─→ YES but small variations: Use batch with item-specific properties
    └─→ YES with complex logic: Individual operations

PERFORMANCE COMPARISON:
• Individual: 10 creates × 145ms = 1450ms
• Batch: 1 batch_create (10 items) = 320ms
• Speedup: 4.5x faster with batch!
```

### Choosing Background Generation Method

```
START: "I want a background"
│
├─→ Q: Is it a solid color?
│   ├─→ YES: Use pinepaper_set_background_color
│   └─→ NO: Continue ↓
│
├─→ Q: Do you want a procedural pattern?
│   ├─→ YES: Use pinepaper_execute_generator
│   │   • drawSunburst → Radial rays
│   │   • drawSunsetScene → Animated sunset
│   │   • drawGrid → Lines, dots, or squares
│   │   • drawWaves → Layered waves
│   │   • drawCircuit → Tech circuit board
│   │   • drawStars → Starfield
│   │
│   └─→ NO: Continue ↓
│
└─→ Manual approach:
    • Create shapes in background layer
    • Use pinepaper_create_item with simple shapes
    • Use pinepaper_batch_create for patterns
```

### Choosing Item Creation Method

```
START: "I want to add something to the canvas"
│
├─→ Q: Is it text?
│   ├─→ YES: pinepaper_create_item (type: "text")
│   └─→ NO: Continue ↓
│
├─→ Q: Is it a basic shape?
│   ├─→ YES: pinepaper_create_item
│   │   • circle, star, rectangle, triangle, polygon, ellipse
│   └─→ NO: Continue ↓
│
├─→ Q: Is it a glossy 3D sphere?
│   ├─→ YES: pinepaper_create_glossy_sphere
│   │   • Automatically adds gradients, highlights, shadows
│   └─→ NO: Continue ↓
│
├─→ Q: Is it diagonal stripes pattern?
│   ├─→ YES: pinepaper_create_diagonal_stripes
│   └─→ NO: Continue ↓
│
├─→ Q: Do you need a custom shape?
│   ├─→ Simple polygon: pinepaper_create_item (type: "path", segments: [[x,y], ...])
│   ├─→ Complex curves: pinepaper_create_item (type: "path", pathData: "SVG path string")
│   └─→ Import SVG: pinepaper_import_svg
│
└─→ Q: Is it a complex illustration (person, animal, detailed scene)?
    ├─→ YES: pinepaper_import_svg
    │   • Search for SVG online (user provides URL or SVG string)
    │   • Much faster than drawing with paths
    └─→ Last resort: Compose from simple shapes
```

---

## Multi-Step Workflow Patterns

### Pattern 1: Solar System Animation

**Goal**: Create an animated solar system with orbiting planets

```typescript
// STEP 1: Set up canvas
pinepaper_clear_canvas()
pinepaper_set_canvas_size({width: 1080, height: 1080})
pinepaper_set_background_color({color: '#000011'})

// STEP 2: Create sun (center)
sun_id = pinepaper_create_glossy_sphere({
  position: {x: 540, y: 540},
  radius: 80,
  baseColor: '#FFA500',
  lightDirection: 'top-left',
  glossiness: 0.9
}) // Returns: "item_1"

// STEP 3: Create planets (batch for efficiency)
planets = pinepaper_batch_create({
  items: [
    {
      itemType: 'circle',
      position: {x: 540, y: 540}, // Start at sun position
      properties: {radius: 15, color: '#808080'} // Mercury
    },
    {
      itemType: 'circle',
      position: {x: 540, y: 540},
      properties: {radius: 25, color: '#FFA500'} // Venus
    },
    {
      itemType: 'circle',
      position: {x: 540, y: 540},
      properties: {radius: 28, color: '#4169E1'} // Earth
    },
    {
      itemType: 'circle',
      position: {x: 540, y: 540},
      properties: {radius: 22, color: '#CD5C5C'} // Mars
    }
  ]
}) // Returns: ["item_2", "item_3", "item_4", "item_5"]

// STEP 4: Add orbital relations
pinepaper_add_relation({
  sourceId: 'item_2', // Mercury
  targetId: 'item_1', // Sun
  relationType: 'orbits',
  params: {radius: 120, speed: 0.5, direction: 'clockwise'}
})

pinepaper_add_relation({
  sourceId: 'item_3', // Venus
  targetId: 'item_1',
  relationType: 'orbits',
  params: {radius: 180, speed: 0.4}
})

pinepaper_add_relation({
  sourceId: 'item_4', // Earth
  targetId: 'item_1',
  relationType: 'orbits',
  params: {radius: 250, speed: 0.3}
})

pinepaper_add_relation({
  sourceId: 'item_5', // Mars
  targetId: 'item_1',
  relationType: 'orbits',
  params: {radius: 320, speed: 0.25}
})

// STEP 5: Take screenshot to verify
pinepaper_browser_screenshot()
```

**Timing**: ~2 seconds total
- Canvas setup: ~200ms
- Sun creation: ~180ms
- Batch planet creation: ~320ms
- 4 relation additions: 4 × 150ms = ~600ms
- Screenshot: ~150ms

**Key Decisions**:
- Used `pinepaper_create_glossy_sphere` for sun (realistic look)
- Used `pinepaper_batch_create` for planets (4.5x faster than individual)
- Planets start at sun position (orbits will move them)
- Different orbital speeds and radii for realistic motion

---

### Pattern 2: Animated Logo with Effects

**Goal**: Create a pulsing, sparkling logo with decorative background

```typescript
// STEP 1: Setup
pinepaper_clear_canvas()
pinepaper_set_canvas_size({width: 1080, height: 1080})

// STEP 2: Add sunburst background
pinepaper_execute_generator({
  generatorName: 'drawSunburst',
  params: {
    colors: ['#4F46E5', '#7C3AED', '#DB2777'],
    rayCount: 24,
    rotation: 0
  }
})

// STEP 3: Create main logo text
logo_id = pinepaper_create_item({
  itemType: 'text',
  position: {x: 540, y: 540},
  properties: {
    content: 'BRAND',
    fontSize: 120,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowBlur: 20,
    shadowOffset: [0, 10]
  }
}) // Returns: "item_1"

// STEP 4: Apply pulse animation
pinepaper_animate({
  itemId: logo_id,
  animationType: 'pulse',
  animationSpeed: 0.5 // Slow pulse
})

// STEP 5: Add sparkle effect
pinepaper_apply_effect({
  effectType: 'sparkle',
  itemId: logo_id,
  params: {
    count: 15,
    color: '#FFD700', // Gold
    minSize: 2,
    maxSize: 8,
    speed: 2
  }
})

// STEP 6: Take screenshot
pinepaper_browser_screenshot()
```

**Timing**: ~1.5 seconds
- Background generator: ~300ms
- Text creation: ~180ms
- Animation application: ~150ms
- Effect application: ~180ms
- Screenshot: ~150ms

**Key Decisions**:
- Generator for background (procedural, consistent)
- Shadow on text (depth, readability)
- Slow pulse speed (elegant, not distracting)
- Gold sparkles (luxury feel)

---

### Pattern 3: Following Label System

**Goal**: Create a player character with a label that follows it

```typescript
// STEP 1: Create player character
player_id = pinepaper_create_glossy_sphere({
  position: {x: 400, y: 300},
  radius: 30,
  baseColor: '#4F46E5',
  lightDirection: 'top-left'
}) // Returns: "item_1"

// STEP 2: Create label text
label_id = pinepaper_create_item({
  itemType: 'text',
  position: {x: 400, y: 250}, // Start above player
  properties: {
    content: 'Player 1',
    fontSize: 18,
    color: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowBlur: 4,
    shadowOffset: [0, 2]
  }
}) // Returns: "item_2"

// STEP 3: Add follow relation with offset
pinepaper_add_relation({
  sourceId: label_id,
  targetId: player_id,
  relationType: 'follows',
  params: {
    offset: [0, -50], // 50 pixels above player
    smoothing: 0.1 // Smooth following
  }
})

// STEP 4: Make player draggable (for testing)
pinepaper_modify_item({
  itemId: player_id,
  properties: {
    data: {isDraggable: true, selectable: true}
  }
})

// STEP 5: Take screenshot
pinepaper_browser_screenshot()
```

**Usage**: User can drag player, label follows smoothly above it

**Timing**: ~800ms
**Key Decisions**:
- Glossy sphere for player (professional look)
- Shadow on text (readability over any background)
- `follows` relation with offset (stays above)
- Low smoothing value (responsive following)

---

### Pattern 4: Data Visualization with Bars

**Goal**: Create a bar chart with animated bars and labels

```typescript
// STEP 1: Setup
pinepaper_clear_canvas()
pinepaper_set_canvas_size({width: 1200, height: 800})
pinepaper_set_background_color({color: '#F3F4F6'})

// Data
const data = [
  {label: 'Q1', value: 45},
  {label: 'Q2', value: 68},
  {label: 'Q3', value: 82},
  {label: 'Q4', value: 95}
]

// STEP 2: Create bars (batch operation)
const barWidth = 80
const barSpacing = 150
const startX = 300
const baseY = 650
const maxHeight = 400

const bars = []
const barHeights = []

for (let i = 0; i < data.length; i++) {
  const height = (data[i].value / 100) * maxHeight
  barHeights.push(height)

  bars.push({
    itemType: 'rectangle',
    position: {
      x: startX + (i * barSpacing),
      y: baseY - (height / 2) // Center the bar vertically
    },
    properties: {
      width: barWidth,
      height: height,
      color: {
        type: 'linear',
        stops: [
          {color: '#8B5CF6', offset: 0},
          {color: '#6366F1', offset: 1}
        ],
        origin: [0, baseY - height],
        destination: [0, baseY]
      },
      cornerRadius: 8
    }
  })
}

bar_ids = pinepaper_batch_create({items: bars})
// Returns: ["item_1", "item_2", "item_3", "item_4"]

// STEP 3: Create labels (batch operation)
const labels = []

for (let i = 0; i < data.length; i++) {
  labels.push({
    itemType: 'text',
    position: {
      x: startX + (i * barSpacing),
      y: baseY + 40
    },
    properties: {
      content: data[i].label,
      fontSize: 24,
      color: '#374151',
      fontFamily: 'Inter'
    }
  })

  labels.push({
    itemType: 'text',
    position: {
      x: startX + (i * barSpacing),
      y: baseY - barHeights[i] - 30
    },
    properties: {
      content: String(data[i].value),
      fontSize: 20,
      color: '#6366F1',
      fontFamily: 'Inter'
    }
  })
}

label_ids = pinepaper_batch_create({items: labels})
// Returns: ["item_5", "item_6", "item_7", ...]

// STEP 4: Animate bars with stagger
// Animate bars entering from bottom (scale effect)
for (let i = 0; i < bar_ids.length; i++) {
  pinepaper_keyframe_animate({
    itemId: bar_ids[i],
    keyframes: [
      {time: 0, scaleY: 0, y: baseY},
      {time: 0.5 + (i * 0.2), scaleY: 1, y: baseY - (barHeights[i] / 2)}
    ],
    easing: 'easeOutBack'
  })
}

// STEP 5: Take screenshot
pinepaper_browser_screenshot()
```

**Timing**: ~1.2 seconds
- 4 bars (batch): ~320ms
- 8 labels (batch): ~350ms
- 4 keyframe animations: 4 × 150ms = ~600ms
- Screenshot: ~150ms

**Key Decisions**:
- Batch operations for all bars and labels (efficiency)
- Gradient fill on bars (visual appeal)
- Keyframe animation with stagger (professional reveal)
- Value labels above bars (data clarity)
- Custom preset canvas size (widescreen)

---

### Pattern 5: Complex Scene with Grid and Multiple Elements

**Goal**: Create a technical diagram with grid background, connected nodes, and labels

```typescript
// STEP 1: Setup with grid
pinepaper_clear_canvas()
pinepaper_set_canvas_size({width: 1200, height: 900})
pinepaper_set_background_color({color: '#0F172A'})

pinepaper_create_grid({
  cols: 40,
  rows: 30,
  strokeColor: '#1E293B',
  strokeWidth: 1,
  animated: false
})

// STEP 2: Create nodes (batch)
nodes = pinepaper_batch_create({
  items: [
    {
      itemType: 'circle',
      position: {x: 300, y: 300},
      properties: {
        radius: 40,
        color: '#3B82F6',
        shadowColor: 'rgba(59, 130, 246, 0.5)',
        shadowBlur: 20
      }
    },
    {
      itemType: 'circle',
      position: {x: 600, y: 300},
      properties: {
        radius: 40,
        color: '#10B981',
        shadowColor: 'rgba(16, 185, 129, 0.5)',
        shadowBlur: 20
      }
    },
    {
      itemType: 'circle',
      position: {x: 900, y: 300},
      properties: {
        radius: 40,
        color: '#F59E0B',
        shadowColor: 'rgba(245, 158, 11, 0.5)',
        shadowBlur: 20
      }
    }
  ]
})
// Returns: ["item_1", "item_2", "item_3"]

// STEP 3: Create connecting lines
pinepaper_batch_create({
  items: [
    {
      itemType: 'line',
      properties: {
        from: [300, 300],
        to: [600, 300],
        strokeColor: '#475569',
        strokeWidth: 2
      }
    },
    {
      itemType: 'line',
      properties: {
        from: [600, 300],
        to: [900, 300],
        strokeColor: '#475569',
        strokeWidth: 2
      }
    }
  ]
})

// STEP 4: Add labels
pinepaper_batch_create({
  items: [
    {
      itemType: 'text',
      position: {x: 300, y: 380},
      properties: {
        content: 'Input',
        fontSize: 18,
        color: '#E2E8F0',
        fontFamily: 'monospace'
      }
    },
    {
      itemType: 'text',
      position: {x: 600, y: 380},
      properties: {
        content: 'Process',
        fontSize: 18,
        color: '#E2E8F0',
        fontFamily: 'monospace'
      }
    },
    {
      itemType: 'text',
      position: {x: 900, y: 380},
      properties: {
        content: 'Output',
        fontSize: 18,
        color: '#E2E8F0',
        fontFamily: 'monospace'
      }
    }
  ]
})

// STEP 5: Add pulse animations
for (const nodeId of nodes) {
  pinepaper_animate({
    itemId: nodeId,
    animationType: 'pulse',
    animationSpeed: 0.3
  })
}

// STEP 6: Take screenshot
pinepaper_browser_screenshot()
```

**Timing**: ~1.5 seconds
**Key Decisions**:
- Dark background with subtle grid (technical aesthetic)
- Glowing nodes with shadows (depth and focus)
- Batch operations throughout (efficiency)
- Monospace font for labels (technical feel)
- Slow pulse on all nodes (synchronized, subtle)

---

## Performance Optimization

### Use Batch Operations for 4+ Items

**Problem**: Creating many items individually is slow

**Solution**:
```typescript
// ❌ SLOW: Individual creates
for (let i = 0; i < 20; i++) {
  pinepaper_create_item({...})
}
// Total: 20 × 145ms = 2900ms

// ✅ FAST: Batch create
pinepaper_batch_create({
  items: [...20 items...]
})
// Total: ~350ms (8.3x faster!)
```

### Minimize Screenshot Calls

**Problem**: Screenshots are expensive (~150ms each)

**Solution**:
```typescript
// ❌ SLOW: Screenshot after every operation
pinepaper_create_item({...})
pinepaper_browser_screenshot() // 150ms
pinepaper_animate({...})
pinepaper_browser_screenshot() // 150ms
// Total screenshot time: 300ms

// ✅ FAST: One screenshot at end
pinepaper_create_item({...})
pinepaper_animate({...})
pinepaper_browser_screenshot() // 150ms
// Total screenshot time: 150ms (2x faster)
```

### Use Screenshot Mode "on_request"

**Default behavior**: `PINEPAPER_SCREENSHOT_MODE=on_request`

This means:
- No automatic screenshots after operations
- Only capture when explicitly requested via `pinepaper_browser_screenshot`
- **Saves ~100-150ms per operation**

### Check Metrics to Identify Bottlenecks

```typescript
// After a workflow, check performance
pinepaper_get_performance_metrics({
  format: 'summary'
})

// Analyze results:
// - If screenshot phase is slow: Reduce screenshot frequency
// - If browser_execution is slow: Too many items or complex canvas
// - If individual operations are slow: Use batch alternatives
```

### Optimize Relation-Based Animations

**Tip**: Relations are efficient - they compute on every frame but are highly optimized

Multiple relations on same item:
```typescript
// This is OK! Relations compose efficiently
pinepaper_add_relation({sourceId: 'moon', targetId: 'earth', relationType: 'orbits'})
pinepaper_add_relation({sourceId: 'moon', targetId: 'earth', relationType: 'attached_to'})
```

---

## Common Scenarios

### Scenario: "Create a scene from scratch"

**Checklist**:
1. ✅ Clear canvas first: `pinepaper_clear_canvas()`
2. ✅ Set canvas size if needed: `pinepaper_set_canvas_size()`
3. ✅ Set background color: `pinepaper_set_background_color()` OR use generator
4. ✅ Create items (use batch for 4+)
5. ✅ Add relations for animations
6. ✅ Take screenshot to verify: `pinepaper_browser_screenshot()`

### Scenario: "Items not animating"

**Debugging steps**:
1. Query relations to verify they were added:
   ```typescript
   pinepaper_query_relations({itemId: 'item_1'})
   ```

2. Take two screenshots with delay to see if items moved:
   ```typescript
   pinepaper_browser_screenshot()
   // Wait 2 seconds
   pinepaper_browser_screenshot()
   ```

3. Check that:
   - Source and target IDs are correct
   - Relation parameters are valid (e.g., radius > 0 for orbits)
   - Items exist on canvas

### Scenario: "Canvas is too small for content"

**Solution**:
```typescript
// Check if content extends beyond bounds
pinepaper_get_canvas_size()

// Option 1: Expand to include all content
pinepaper_set_canvas_size({width: 1920, height: 1080})

// Option 2: Use preset
pinepaper_set_canvas_size('full-hd') // 1920x1080
```

### Scenario: "Performance is slow"

**Debugging**:
```typescript
// Check metrics
pinepaper_get_performance_metrics({format: 'summary'})

// Common issues:
// - Screenshot mode is 'always': Change to 'on_request'
// - Too many items: Clear unnecessary items
// - Individual operations: Switch to batch
// - Many screenshots: Reduce to one at end
```

---

## Troubleshooting

### Error: "Item not found"

**Cause**: Item ID doesn't exist or was deleted

**Solutions**:
1. Check that you saved the itemId from create operations:
   ```typescript
   const result = pinepaper_create_item({...})
   const itemId = result.itemId // SAVE THIS!
   ```

2. Query items to see what's on canvas:
   ```typescript
   pinepaper_get_items()
   ```

3. Verify item wasn't accidentally deleted

### Error: "Browser not connected"

**Cause**: MCP server not connected to PinePaper Studio

**Solutions**:
1. Connect to browser:
   ```typescript
   pinepaper_browser_connect({url: 'https://pinepaper.studio'})
   ```

2. Check status:
   ```typescript
   pinepaper_browser_status()
   ```

3. Ensure PinePaper Studio is open in browser

### Error: "Relation not visible"

**Cause**: Relation added but animation not showing

**Solutions**:
1. Verify relation was added:
   ```typescript
   pinepaper_query_relations({itemId: 'item_1'})
   ```

2. Check parameters:
   - `orbits`: radius must be > 0
   - `follows`: offset may be [0, 0] (not visible)
   - `attached_to`: offset may exactly overlap

3. Take two screenshots with delay:
   ```typescript
   pinepaper_browser_screenshot()
   // Wait 2-3 seconds
   pinepaper_browser_screenshot()
   // Items should have moved between screenshots
   ```

### Canvas State in Error Messages

When errors occur, the MCP server now captures canvas state for context:
- Total item count
- Item types breakdown
- Relation statistics
- Recent items created
- Canvas dimensions

Use this information to understand what was on the canvas when the error occurred.

---

## Summary

**Key Takeaways**:

1. **Use Decision Trees** to choose the right tool for the job
2. **Follow Multi-Step Patterns** for common scenarios
3. **Optimize Performance** with batch operations and minimal screenshots
4. **Check Metrics** regularly to identify bottlenecks
5. **Debug Systematically** using the troubleshooting checklist

**Most Impactful Optimizations**:
- Batch operations: 4-8x faster for multiple items
- Screenshot mode 'on_request': Saves ~100ms per operation
- One screenshot at end: Reduces overhead by 50-80%
- Relations for animation: More efficient than keyframes for behaviors

**When in Doubt**:
- Use `pinepaper_get_performance_metrics` to measure
- Use `pinepaper_get_items` to inspect canvas
- Use `pinepaper_query_relations` to verify relations
- Take screenshots only at verification points
