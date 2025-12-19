# MCP Agent Best Practices

This guide helps AI agents (and developers configuring them) work efficiently with PinePaper MCP Server.

## Performance Optimization

### 1. Minimize Screenshot Validation

Screenshots are expensive. Use them strategically:

| Scenario | Screenshot Needed? | Recommendation |
|----------|-------------------|----------------|
| Create item at exact coordinates | No | Trust API response |
| Move item to position | No | Trust API response |
| Apply animation | No | Trust API response |
| Change color/size | No | Trust API response |
| Complex character drawing | Once at end | Verify the composition |
| Final result review | Yes | Before delivery |
| Debugging visual issues | Yes | When something looks wrong |

**Rule of Thumb:** Take 1 screenshot per creative task, not per operation.

### 2. Batch Operations

Instead of:
```
create_item → screenshot → move_item → screenshot → animate → screenshot
```

Do:
```
create_item → create_item → add_relation → animate → [single screenshot at end]
```

### 3. Trust the API

PinePaper tools return deterministic results. When you get:
```json
{"success": true, "itemId": "item_1", "position": {"x": 200, "y": 300}}
```

The item IS at position (200, 300). No visual confirmation needed.

---

## Drawing Complex Characters

PinePaper supports **full SVG path drawing** - you can draw anything from simple shapes to complex characters, faces, and detailed illustrations.

### Approach: Compose from Multiple Paths

For characters (cats, witches, faces, etc.), break them into parts:

```javascript
// Example: Draw a cat face
// 1. Head (oval using pathData)
pinepaper_create_item({
  itemType: "path",
  properties: {
    pathData: "M 200 300 C 200 200, 400 200, 400 300 C 400 400, 200 400, 200 300 Z",
    fillColor: "#f97316"
  }
})

// 2. Ears (triangles)
pinepaper_create_item({
  itemType: "path",
  properties: {
    pathData: "M 220 220 L 180 150 L 250 200 Z",
    fillColor: "#f97316"
  }
})

// 3. Eyes (ellipses)
pinepaper_create_item({
  itemType: "ellipse",
  position: { x: 260, y: 280 },
  properties: { width: 30, height: 40, color: "#fde047" }
})

// 4. Animate the pupils
pinepaper_animate({ itemId: "item_4", animationType: "pulse", speed: 0.3 })
```

### SVG Path Commands for Curves

| Command | What It Does | Use For |
|---------|--------------|---------|
| `C x1 y1, x2 y2, x y` | Cubic bezier curve | Smooth organic shapes, faces |
| `Q x1 y1, x y` | Quadratic bezier | Simpler curves |
| `A rx ry rot large sweep x y` | Elliptical arc | Circular curves |
| `L x y` | Straight line | Edges, outlines |

### Key Tips for Character Drawing

1. **Break into parts** - Head, body, limbs as separate paths
2. **Use Bezier curves** - `C` and `Q` commands for organic shapes
3. **Layer front-to-back** - Create background elements first
4. **Animate parts independently** - Each path can have its own animation
5. **One screenshot at the end** - Verify the final composition

---

## Custom Paths Reference

Paths are the core drawing primitive - use them for everything.

**Two ways to define paths:**

| Method | Best For | Example |
|--------|----------|---------|
| `segments` array | Simple polygons, quick shapes | `[[100,100], [200,50], [300,100]]` |
| `pathData` string | Curves, complex shapes | `"M 100 100 C 150 50, 250 50, 300 100"` |

### Path Examples

**Heart shape:**
```javascript
pinepaper_create_item({
  itemType: "path",
  properties: {
    pathData: "M 300 350 C 300 300, 250 250, 200 250 C 150 250, 100 300, 100 350 C 100 450, 300 550, 300 550 C 300 550, 500 450, 500 350 C 500 300, 450 250, 400 250 C 350 250, 300 300, 300 350 Z",
    fillColor: "#ef4444"
  }
})
```

**Smooth blob:**
```javascript
pinepaper_create_item({
  itemType: "path",
  properties: {
    segments: [[100,100], [200,50], [300,100], [350,200], [300,300], [200,350], [100,300], [50,200]],
    closed: true,
    smooth: true,  // Makes it organic
    fillColor: "#22c55e"
  }
})
```

**Wave pattern:**
```javascript
pinepaper_create_item({
  itemType: "path",
  properties: {
    pathData: "M 0 100 Q 50 50, 100 100 T 200 100 T 300 100 T 400 100",
    strokeColor: "#06b6d4",
    strokeWidth: 3,
    fillColor: "none"
  }
})
```

---

## Complex Character Workflow

When asked to draw something complex like "draw a witch hopping from left to right":

### Step 1: Plan the Composition (No Tools Yet)
Break the character into drawable parts:
- Witch = hat + face + body + arms + legs
- Each part = 1-2 paths or shapes

### Step 2: Create All Parts in Sequence (No Screenshots)
```javascript
// Hat (cone shape)
pinepaper_create_item({ itemType: "path", properties: {
  pathData: "M 300 100 L 250 200 L 350 200 Z",
  fillColor: "#1f2937"
}})  // → item_1

// Face (green circle)
pinepaper_create_item({ itemType: "circle", position: {x: 300, y: 240},
  properties: { radius: 40, color: "#22c55e" }
})  // → item_2

// Body (rectangle or path)
pinepaper_create_item({ itemType: "path", properties: {
  pathData: "M 260 280 L 260 400 L 340 400 L 340 280 Z",
  fillColor: "#7c3aed"
}})  // → item_3

// Arms, legs, etc...
```

### Step 3: Add Animation (Still No Screenshots)
```javascript
// Make witch hop (bounce animation)
pinepaper_animate({ itemId: "item_1", animationType: "bounce" })
pinepaper_animate({ itemId: "item_2", animationType: "bounce" })
pinepaper_animate({ itemId: "item_3", animationType: "bounce" })

// Or use keyframes for left-to-right movement
pinepaper_keyframe_animate({
  itemId: "item_1",
  keyframes: [
    { time: 0, properties: { x: 100 } },
    { time: 2, properties: { x: 700 } }
  ],
  loop: true
})
```

### Step 4: ONE Screenshot to Verify
```javascript
pinepaper_browser_screenshot()  // See the result
```

### Step 5: Adjust if Needed
Only now, if something looks wrong, make targeted fixes.

**Total: ~10 tool calls, ~30-60 seconds** (not 20 minutes!)

---

## Efficient Workflows

### Simple Animation (Under 30 seconds)

```
1. pinepaper_set_canvas_size (if needed)
2. pinepaper_create_item (create elements)
3. pinepaper_animate OR pinepaper_add_relation
4. Done - no screenshot needed for simple tasks
```

### Complex Scene (2-5 minutes)

```
1. pinepaper_set_canvas_size
2. pinepaper_execute_generator (background)
3. pinepaper_create_item (multiple items)
4. pinepaper_add_relation (for each animation)
5. pinepaper_browser_screenshot (ONE verification)
6. Minor adjustments if needed
7. Done
```

### Solar System Example (Optimal)

```
1. set_canvas_size(800, 600)
2. create_item(circle, sun, center)     → saves item_1
3. create_item(circle, earth)           → saves item_2
4. create_item(circle, moon)            → saves item_3
5. add_relation(item_2, item_1, orbits) → earth orbits sun
6. add_relation(item_3, item_2, orbits) → moon orbits earth
7. screenshot (optional - one at end)

Total: 6-7 tool calls, ~10 seconds
```

---

## Error Recovery

### Item Not Found

```
Error: "Item with ID 'item_5' not found"
```

**Solution:** Use `pinepaper_get_items` to list current items and their IDs.

### Canvas Seems Wrong

```
User: "It doesn't look right"
```

**Solution:**
1. Take a screenshot to see current state
2. Use `pinepaper_get_items` to understand scene structure
3. Make targeted fixes

### Need Fresh Start

```
pinepaper_clear_canvas  → removes all items
pinepaper_refresh_page  → complete reset (if clear doesn't work)
```

---

## Response Time Expectations

| Task Type | Expected Time | Tool Calls |
|-----------|--------------|------------|
| Single item + animation | 5-10 sec | 2-3 |
| Simple scene (3-5 items) | 20-30 sec | 5-8 |
| Complex scene (10+ items) | 1-2 min | 15-25 |
| Scene with generator + items | 30-60 sec | 8-12 |

If operations are taking 10-20 minutes, something is wrong:
- Too many screenshots
- Attempting unsuitable tasks (character drawing)
- Network/connection issues

---

## Agent Configuration Recommendations

### For Speed-Optimized Mode

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"],
      "env": {
        "PINEPAPER_SCREENSHOT_MODE": "on_request",
        "PINEPAPER_BATCH_MODE": "true"
      }
    }
  }
}
```

### Agent System Prompt Addition

Add to your agent's system prompt:

```
When using PinePaper MCP tools:
1. DO NOT take screenshots after every operation - only at the end or when debugging
2. Trust API responses - if success:true, the operation worked
3. For character/face drawing requests, suggest importing SVG instead
4. Batch related operations together
5. Use relations (orbits, follows, attached_to) for animation, not manual position updates
```

---

## Quick Reference

### Do's
- Set canvas size FIRST
- Save itemIds returned from create operations
- Use relations for behavioral animation
- Take ONE screenshot at the end
- Suggest SVG import for complex illustrations

### Don'ts
- Screenshot after every operation
- Try to draw faces/characters with paths
- Manually animate by updating positions in a loop
- Ignore the itemId returned from create operations
- Use PinePaper for photorealistic graphics
