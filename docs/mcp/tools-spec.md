# PinePaper MCP Tools Specification

This document defines the MCP tools for PinePaper integration. These tools enable AI agents to create animated graphics and generate training data.

## Tool Categories

1. **Canvas Tools** - Set and get canvas dimensions (REQUIRED before creating items)
2. **Item Tools** - Create, modify, delete canvas items
3. **Relation Tools** - Define behavior relationships (key for animation)
4. **Animation Tools** - Apply and control animations
5. **Generator Tools** - Create procedural backgrounds
6. **Query Tools** - Find and inspect items
7. **Export Tools** - Export graphics and training data

---

## Canvas Tools

**IMPORTANT:** AI agents MUST set the canvas size before creating items. The canvas defines the output dimensions and items should be positioned within these bounds.

### pinepaper_get_canvas_size

Get the current canvas dimensions.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {}
}
```

**Output:**

```json
{
  "success": true,
  "width": 800,
  "height": 600,
  "preset": "default"
}
```

### pinepaper_set_canvas_size

Set the canvas output dimensions. Agents SHOULD call this before creating items to ensure proper positioning.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "preset": {
      "type": "string",
      "enum": [
        "youtube-thumbnail", "youtube-short", "tiktok",
        "instagram-story", "instagram-post", "instagram-landscape", "instagram-portrait",
        "facebook-post", "facebook-cover", "facebook-story",
        "twitter-post", "twitter-header",
        "linkedin-post", "linkedin-banner",
        "pinterest-pin",
        "presentation-16x9", "presentation-4x3",
        "hd-720p", "full-hd-1080p",
        "default"
      ],
      "description": "Predefined canvas size preset"
    },
    "width": {
      "type": "number",
      "description": "Custom canvas width in pixels (use with height for custom size)",
      "minimum": 100,
      "maximum": 7680
    },
    "height": {
      "type": "number",
      "description": "Custom canvas height in pixels (use with width for custom size)",
      "minimum": 100,
      "maximum": 4320
    }
  },
  "oneOf": [
    {"required": ["preset"]},
    {"required": ["width", "height"]}
  ]
}
```

**Preset Dimensions:**

| Preset | Dimensions | Use Case |
|--------|------------|----------|
| `youtube-thumbnail` | 1280×720 | YouTube video thumbnails |
| `youtube-short` | 1080×1920 | YouTube Shorts |
| `tiktok` | 1080×1920 | TikTok videos |
| `instagram-story` | 1080×1920 | Instagram Stories & Reels |
| `instagram-post` | 1080×1080 | Square Instagram posts |
| `instagram-landscape` | 1080×566 | Landscape Instagram posts |
| `instagram-portrait` | 1080×1350 | Portrait Instagram posts |
| `facebook-post` | 1200×630 | Facebook feed posts |
| `facebook-cover` | 820×312 | Facebook cover photos |
| `facebook-story` | 1080×1920 | Facebook Stories |
| `twitter-post` | 1200×675 | Twitter/X images |
| `twitter-header` | 1500×500 | Twitter/X profile headers |
| `linkedin-post` | 1200×627 | LinkedIn posts |
| `linkedin-banner` | 1584×396 | LinkedIn banners |
| `pinterest-pin` | 1000×1500 | Pinterest pins |
| `presentation-16x9` | 1920×1080 | 16:9 presentations |
| `presentation-4x3` | 1024×768 | 4:3 presentations |
| `hd-720p` | 1280×720 | HD video |
| `full-hd-1080p` | 1920×1080 | Full HD video |
| `default` | 800×600 | Default canvas |

**Output:**

```json
{
  "success": true,
  "width": 1080,
  "height": 1080,
  "preset": "instagram-post"
}
```

### pinepaper_get_canvas_presets

List all available canvas presets with their dimensions.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {}
}
```

**Output:**

```json
{
  "presets": [
    {
      "key": "instagram-post",
      "name": "Instagram Post (Square)",
      "width": 1080,
      "height": 1080,
      "aspectRatio": "1:1",
      "category": "social"
    }
  ]
}
```

---

## Item Tools

### pinepaper_create_item

Create an item on the canvas.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemType": {
      "type": "string",
      "enum": ["text", "circle", "star", "rectangle", "triangle", "polygon", "ellipse", "path", "line", "arc"],
      "description": "Type of item to create"
    },
    "position": {
      "type": "object",
      "properties": {
        "x": { "type": "number" },
        "y": { "type": "number" }
      },
      "description": "Position on canvas"
    },
    "properties": {
      "type": "object",
      "description": "Type-specific properties"
    }
  },
  "required": ["itemType"]
}
```

**Type-Specific Properties:**

| Type | Properties |
|------|------------|
| `text` | `content`, `fontSize`, `fontFamily`, `color` |
| `circle` | `radius`, `color`, `strokeColor`, `strokeWidth` |
| `star` | `radius1`, `radius2`, `color` |
| `rectangle` | `width`, `height`, `color` |
| `polygon` | `sides`, `radius`, `color` |
| `path` | `segments` or `pathData`, `strokeColor`, `strokeWidth`, `closed`, `smooth` |
| `line` | `from`, `to`, `strokeColor`, `strokeWidth` |
| `arc` | `from`, `through`, `to`, `strokeColor` |

**Output:**

```json
{
  "success": true,
  "itemId": "item_1",
  "type": "circle",
  "position": { "x": 400, "y": 300 }
}
```

### pinepaper_modify_item

Modify an existing item.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string",
      "description": "Registry ID of the item"
    },
    "properties": {
      "type": "object",
      "description": "Properties to update"
    }
  },
  "required": ["itemId", "properties"]
}
```

### pinepaper_delete_item

Delete an item from the canvas.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string",
      "description": "Registry ID of the item to delete"
    }
  },
  "required": ["itemId"]
}
```

---

## Relation Tools

Relations are the primary mechanism for creating declarative animations.

### pinepaper_add_relation

Create a behavior relationship between two items.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "sourceId": {
      "type": "string",
      "description": "Registry ID of the source item (the item that will be affected)"
    },
    "targetId": {
      "type": "string",
      "description": "Registry ID of the target item (the item being related to)"
    },
    "relationType": {
      "type": "string",
      "enum": ["orbits", "follows", "attached_to", "maintains_distance", "points_at", "mirrors", "parallax", "bounds_to", "animates"],
      "description": "Type of relationship"
    },
    "params": {
      "type": "object",
      "description": "Relation-specific parameters"
    }
  },
  "required": ["sourceId", "targetId", "relationType"]
}
```

**Relation Parameters:**

| Relation | Parameters |
|----------|------------|
| `orbits` | `radius` (number), `speed` (number), `direction` ('clockwise'/'counterclockwise'), `phase` (number) |
| `follows` | `offset` ([x, y]), `smoothing` (0-1), `delay` (seconds) |
| `attached_to` | `offset` ([x, y]), `inherit_rotation` (boolean) |
| `maintains_distance` | `distance` (pixels), `strength` (0-1) |
| `points_at` | `offset_angle` (degrees), `smoothing` (0-1) |
| `mirrors` | `axis` ('vertical'/'horizontal'/'both'), `center` ([x, y]) |
| `parallax` | `depth` (0-1), `origin` ([x, y]) |
| `bounds_to` | `padding` (pixels), `bounce` (boolean) |
| `animates` | `keyframes` (array), `duration` (seconds), `loop` (boolean) |

**Output:**

```json
{
  "success": true,
  "sourceId": "item_1",
  "targetId": "item_2",
  "relationType": "orbits"
}
```

### pinepaper_remove_relation

Remove a relationship between items.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "sourceId": {
      "type": "string"
    },
    "targetId": {
      "type": "string"
    },
    "relationType": {
      "type": "string",
      "description": "Optional: specific relation type to remove"
    }
  },
  "required": ["sourceId", "targetId"]
}
```

### pinepaper_query_relations

Query relationships for an item.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string",
      "description": "Item to query relations for"
    },
    "relationType": {
      "type": "string",
      "description": "Optional: filter by relation type"
    },
    "direction": {
      "type": "string",
      "enum": ["outgoing", "incoming"],
      "description": "outgoing = from item, incoming = to item"
    }
  },
  "required": ["itemId"]
}
```

**Output:**

```json
{
  "relations": [
    {
      "sourceId": "item_1",
      "targetId": "item_2",
      "relationType": "orbits",
      "params": { "radius": 100, "speed": 0.5 }
    }
  ]
}
```

---

## Animation Tools

### pinepaper_animate

Apply a simple animation to an item.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string"
    },
    "animationType": {
      "type": "string",
      "enum": ["pulse", "rotate", "bounce", "fade", "wobble", "slide", "typewriter"]
    },
    "speed": {
      "type": "number",
      "description": "Animation speed multiplier (default: 1.0)"
    }
  },
  "required": ["itemId", "animationType"]
}
```

### pinepaper_keyframe_animate

Apply keyframe-based animation.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string"
    },
    "keyframes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "time": { "type": "number", "description": "Time in seconds" },
          "properties": { "type": "object", "description": "Property values at this keyframe" },
          "easing": { "type": "string", "enum": ["linear", "easeIn", "easeOut", "easeInOut", "bounce", "elastic"] }
        }
      }
    },
    "duration": {
      "type": "number",
      "description": "Total animation duration in seconds"
    },
    "loop": {
      "type": "boolean"
    }
  },
  "required": ["itemId", "keyframes"]
}
```

**Keyframe Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `position` | [x, y] | Item position |
| `x`, `y` | number | Individual coordinates |
| `scale` | number | Uniform scale |
| `scaleX`, `scaleY` | number | Separate axis scaling |
| `rotation` | number | Rotation in degrees |
| `opacity` | number | Transparency (0-1) |
| `fillColor` | string | Fill color |
| `strokeColor` | string | Stroke color |
| `fontSize` | number | Text size |

### pinepaper_play_timeline

Control keyframe playback.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "action": {
      "type": "string",
      "enum": ["play", "stop", "seek"]
    },
    "duration": {
      "type": "number",
      "description": "Duration for play action"
    },
    "loop": {
      "type": "boolean"
    },
    "time": {
      "type": "number",
      "description": "Time to seek to"
    }
  },
  "required": ["action"]
}
```

---

## Generator Tools

### pinepaper_execute_generator

Execute a background generator.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "generatorName": {
      "type": "string",
      "enum": ["drawSunburst", "drawSunsetScene", "drawGrid", "drawStackedCircles", "drawCircuit", "drawWaves", "drawPattern"]
    },
    "params": {
      "type": "object",
      "description": "Generator-specific parameters"
    }
  },
  "required": ["generatorName"]
}
```

**Generator Parameters:**

| Generator | Key Parameters |
|-----------|---------------|
| `drawSunburst` | `rayCount`, `colors` (array), `bgColor` |
| `drawSunsetScene` | `skyColors` (array), `cloudCount` |
| `drawGrid` | `gridType` ('lines'/'dots'/'squares'), `spacing`, `lineColor`, `bgColor` |
| `drawStackedCircles` | `count`, `colors`, `distribution` ('poisson'/'golden'/'random') |
| `drawWaves` | `waveCount`, `colors` |

### pinepaper_list_generators

Get available generators and their parameter schemas.

**Output:**

```json
{
  "generators": [
    {
      "name": "drawSunburst",
      "displayName": "Sunburst",
      "category": "patterns",
      "params": {
        "rayCount": { "type": "number", "default": 16 },
        "colors": { "type": "array", "default": ["#FF6B6B", "#4ECDC4"] }
      }
    }
  ]
}
```

---

## Query Tools

### pinepaper_get_items

Get all or filtered items.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "filter": {
      "type": "object",
      "properties": {
        "type": { "type": "string", "description": "Filter by item type" },
        "source": { "type": "string", "enum": ["user", "generator", "import"] },
        "hasAnimation": { "type": "boolean" },
        "hasRelation": { "type": "boolean" }
      }
    }
  }
}
```

**Output:**

```json
{
  "items": [
    {
      "id": "item_1",
      "type": "circle",
      "position": { "x": 400, "y": 300 },
      "hasAnimation": true,
      "relations": ["orbits"]
    }
  ],
  "count": 1
}
```

### pinepaper_get_relation_stats

Get statistics about active relations.

**Output:**

```json
{
  "activeItems": 5,
  "ruleCount": 8,
  "associationsByType": {
    "orbits": 2,
    "follows": 3,
    "attached_to": 1
  }
}
```

---

## Export Tools

### pinepaper_export_svg

Export the scene as animated SVG.

**Output:**

```json
{
  "success": true,
  "svgString": "<svg>...</svg>",
  "hasAnimations": true
}
```

### pinepaper_export_training_data

Export relations as training data for LLM fine-tuning.

**Output:**

```json
{
  "trainingData": [
    {
      "instruction": "moon orbits earth at radius 100",
      "code": "app.addRelation('item_1', 'item_2', 'orbits', {\"radius\":100})",
      "relation": "orbits",
      "params": { "radius": 100 }
    }
  ],
  "count": 5
}
```

### pinepaper_export_scene

Export the complete scene state.

**Output:**

```json
{
  "items": [...],
  "relations": [...],
  "decorative": [...],
  "backgroundColor": "#1e293b"
}
```

---

## Effect Tools

### pinepaper_apply_effect

Apply a visual effect to an item.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemId": {
      "type": "string"
    },
    "effectType": {
      "type": "string",
      "enum": ["sparkle", "blast"]
    },
    "params": {
      "type": "object",
      "properties": {
        "color": { "type": "string" },
        "speed": { "type": "number" },
        "size": { "type": "number" }
      }
    }
  },
  "required": ["itemId", "effectType"]
}
```

---

## Paper.js Direct Access

### pinepaper_register_item

Register a Paper.js item created externally.

**Input Schema:**

```json
{
  "type": "object",
  "properties": {
    "itemJson": {
      "type": "object",
      "description": "Paper.js item JSON (from item.exportJSON())"
    },
    "itemType": {
      "type": "string",
      "description": "Type name for registry"
    },
    "properties": {
      "type": "object",
      "description": "Custom properties to store"
    }
  },
  "required": ["itemJson", "itemType"]
}
```

---

## Error Handling

All tools return errors in a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with ID 'item_99' not found",
    "details": {}
  }
}
```

**Error Codes:**

| Code | Description |
|------|-------------|
| `ITEM_NOT_FOUND` | Item ID doesn't exist |
| `INVALID_RELATION` | Unknown relation type |
| `INVALID_PARAMS` | Missing or invalid parameters |
| `GENERATOR_NOT_FOUND` | Unknown generator name |
| `EXPORT_FAILED` | Export operation failed |

---

## Implementation Notes

1. **Item IDs**: All items are referenced by `item.data.registryId` (e.g., "item_1")
2. **Positions**: Canvas coordinates, (0,0) is top-left
3. **Colors**: Hex (#RRGGBB), RGB, or named colors
4. **Async Operations**: Generators may be async, return promises
5. **State Management**: Call `historyManager.saveState()` after batches
6. **Relations**: Process automatically each frame, no manual updates needed
