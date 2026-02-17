# PinePaper MCP Server Test Plan

## Overview

This document outlines the test plan for the PinePaper MCP Server (97 tools, 16 resources).

---

## 1. Automated Testing

### 1.1 Unit Tests (Current: 262 tests)

Run with: `bun test`

#### Tool Categories to Test

| Category | Tools | Test Focus |
|----------|-------|------------|
| **Item Tools** | create_item, modify_item, delete_item, batch_create, batch_modify, create_grid | Item creation, modification, deletion, batch operations |
| **Relation Tools** | add_relation, remove_relation, query_relations, register_custom_relation, execute_custom_code | All 16 relation types, compositional relations, custom compute functions |
| **Animation Tools** | animate, keyframe_animate, play_timeline | Animation types, keyframe validation, timeline control |
| **Generator Tools** | execute_generator, list_generators | All generator types, parameter validation |
| **Effect Tools** | apply_effect | Sparkle, blast effects with parameters |
| **Query Tools** | get_items, get_relation_stats, hit_test | Filtering, statistics, hit testing |
| **Export Tools** | export_svg, export_training_data | SVG generation, training data format |
| **Diagram Tools** | create_diagram_shape, connect, connect_ports, add_ports, auto_layout, etc. | All shape types, connector routing, layouts |
| **Agent Flow Tools** | agent_start_job, agent_end_job, agent_reset, agent_batch_execute, agent_export, agent_analyze | Job lifecycle, batch operations, analysis |
| **Interactive Tools** | add_trigger, remove_trigger, query_triggers | Event types, action types, conditions |
| **Quiz Tools** | create_quiz, get_quiz_state, reset_quiz | Quiz creation, state management |
| **Letter Collage** | create_letter_collage, animate_letter_collage, get_letter_collage_options | All styles, palettes, animations |
| **Canvas Presets** | get_canvas_presets | All platform presets |
| **Map Tools** | load_map, highlight_regions, apply_data_colors, add_marker, etc. | All maps, projections, choropleth |
| **Map Animation** | animate_map_regions, animate_map_wave, stop_map_animations, get_animated_map_regions | Keyframes, wave directions, stop/query |
| **Map CSV** | export_map_region_csv, import_map_region_csv | CSV format, import/export cycle |
| **Map Selection** | select_map_regions, deselect_map_regions, get_highlighted_map_regions | Selection state management |

#### Test Parameters for Each Tool

```typescript
// Example test matrix for pinepaper_create_item
const createItemTestCases = [
  // Basic types
  { type: 'circle', params: { x: 400, y: 300, radius: 50, color: '#ef4444' } },
  { type: 'rectangle', params: { x: 400, y: 300, width: 100, height: 80, color: '#3b82f6' } },
  { type: 'text', params: { x: 400, y: 300, content: 'Hello', fontSize: 24 } },
  { type: 'star', params: { x: 400, y: 300, points: 5, innerRadius: 20, outerRadius: 50 } },
  { type: 'triangle', params: { x: 400, y: 300, size: 60 } },
  { type: 'polygon', params: { x: 400, y: 300, sides: 6, radius: 40 } },
  { type: 'ellipse', params: { x: 400, y: 300, width: 80, height: 50 } },
  { type: 'line', params: { from: { x: 100, y: 100 }, to: { x: 300, y: 200 } } },
  { type: 'arc', params: { x: 400, y: 300, radius: 50, startAngle: 0, endAngle: 180 } },
  { type: 'path', params: { segments: [[100,100], [200,50], [300,100]], smooth: true } },

  // With optional parameters
  { type: 'circle', params: { x: 400, y: 300, radius: 50, color: '#ef4444', opacity: 0.5 } },
  { type: 'rectangle', params: { x: 400, y: 300, width: 100, height: 80, strokeColor: '#000', strokeWidth: 2 } },
  { type: 'text', params: { x: 400, y: 300, content: 'Test', fontFamily: 'Arial', fontWeight: 'bold' } },

  // Edge cases
  { type: 'circle', params: { x: 0, y: 0, radius: 1 } },  // Minimum values
  { type: 'circle', params: { x: 10000, y: 10000, radius: 1000 } },  // Large values

  // Error cases
  { type: 'invalid_type', params: {} },  // Should error
  { type: 'circle', params: {} },  // Missing required params
];
```

### 1.2 Integration Tests

```typescript
// Test complete workflows
describe('Integration: Solar System Workflow', () => {
  it('should create a complete solar system', async () => {
    // 1. Clear canvas
    await handleToolCall('pinepaper_clear_canvas', {});

    // 2. Set background
    await handleToolCall('pinepaper_set_background_color', { color: '#000000' });

    // 3. Create sun
    const sun = await handleToolCall('pinepaper_create_item', {
      type: 'circle', params: { x: 400, y: 300, radius: 50, color: '#fbbf24' }
    });

    // 4. Create earth
    const earth = await handleToolCall('pinepaper_create_item', {
      type: 'circle', params: { x: 550, y: 300, radius: 20, color: '#3b82f6' }
    });

    // 5. Add relation
    await handleToolCall('pinepaper_add_relation', {
      sourceId: 'item_2', targetId: 'item_1', relationType: 'orbits',
      params: { radius: 150, speed: 0.1 }
    });

    // 6. Verify state
    const items = await handleToolCall('pinepaper_get_items', {});
    expect(items.content).toContain('2 items');
  });
});
```

### 1.3 Schema Validation Tests

```typescript
// Test all schemas accept valid input and reject invalid input
describe('Schema Validation', () => {
  describe('LoadMapInputSchema', () => {
    it('should accept valid mapId', () => {
      expect(() => LoadMapInputSchema.parse({ mapId: 'world' })).not.toThrow();
      expect(() => LoadMapInputSchema.parse({ mapId: 'usa' })).not.toThrow();
      expect(() => LoadMapInputSchema.parse({ mapId: 'worldHighRes' })).not.toThrow();
    });

    it('should reject invalid mapId', () => {
      expect(() => LoadMapInputSchema.parse({ mapId: 'invalid' })).toThrow();
    });

    it('should accept valid projections', () => {
      const projections = ['mercator', 'equalEarth', 'naturalEarth', 'orthographic', 'albers', 'stereographic'];
      projections.forEach(projection => {
        expect(() => LoadMapInputSchema.parse({
          mapId: 'world',
          options: { projection }
        })).not.toThrow();
      });
    });
  });
});
```

### 1.4 Code Generation Tests

```typescript
// Verify generated code is syntactically correct
describe('Code Generation', () => {
  it('should generate valid JavaScript for all tools', async () => {
    const tools = [
      { name: 'pinepaper_create_item', args: { type: 'circle', params: { x: 100, y: 100, radius: 50 } } },
      { name: 'pinepaper_load_map', args: { mapId: 'world' } },
      // ... all 97 tools
    ];

    for (const tool of tools) {
      const result = await handleToolCall(tool.name, tool.args);
      const code = result.content[0].text;

      // Verify no syntax errors
      expect(() => new Function(code)).not.toThrow();

      // Verify structure
      expect(code).toContain('(function()');
      expect(code).toContain('return');
    }
  });
});
```

---

## 2. Manual Testing

### 2.1 Claude Desktop Testing

#### Setup
1. Install MCP server: `npm install -g @pinepaper.studio/mcp-server`
2. Configure Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "pinepaper-mcp",
      "args": ["--mode", "puppeteer"]
    }
  }
}
```
3. Restart Claude Desktop

#### Test Scenarios

| Scenario | Prompt | Expected Result |
|----------|--------|-----------------|
| **Basic Creation** | "Create a red circle in the center of the canvas" | Circle appears at center |
| **Animation** | "Make the circle pulse" | Pulse animation starts |
| **Relation** | "Create a sun and earth, make earth orbit the sun" | Orbital animation |
| **Map** | "Show a world map and highlight France" | World map with France highlighted |
| **Choropleth** | "Show US map with population data" | Colored states by population |
| **Diagram** | "Create a flowchart: Start -> Process -> Decision -> End" | Flowchart with connectors |
| **Letter Collage** | "Write 'HELLO' in Wordle style" | Tiled letter collage |
| **Export** | "Export as SVG" | SVG file generated |

### 2.2 PinePaper Studio Testing

#### Browser Console Testing
1. Open PinePaper Studio in browser
2. Open developer console (F12)
3. Test each tool's generated code directly:

```javascript
// Test create_item
(function() {
  const item = app.create('circle', { x: 400, y: 300, radius: 50, color: '#ef4444' });
  return { success: true, itemId: item.data.registryId };
})();

// Test relation
(function() {
  app.addRelation('item_1', 'item_2', 'orbits', { radius: 100, speed: 0.5 });
  return { success: true };
})();
```

### 2.3 Manual Test Checklist

#### Item Tools
- [ ] Create each item type (circle, rectangle, text, star, triangle, polygon, ellipse, line, arc, path)
- [ ] Modify item properties (position, size, color, opacity, rotation)
- [ ] Delete single item
- [ ] Batch create 10+ items
- [ ] Batch modify multiple items
- [ ] Create grid of items

#### Relation Tools
- [ ] Test `orbits` relation with different radius/speed
- [ ] Test `follows` relation with smoothing
- [ ] Test `attached_to` with offset
- [ ] Test `maintains_distance`
- [ ] Test `points_at`
- [ ] Test `mirrors` on both axes
- [ ] Test `parallax` with different depths
- [ ] Test `bounds_to`
- [ ] Test compositional relations (multiple on one item)
- [ ] Query relations by item
- [ ] Remove specific relation
- [ ] Remove all relations

#### Animation Tools
- [ ] Test all animation types: pulse, rotate, bounce, fade, wobble, slide, typewriter
- [ ] Test keyframe animation with multiple keyframes
- [ ] Test timeline play/stop
- [ ] Test animation speed variations

#### Map Tools
- [ ] Load world map with each projection
- [ ] Load USA map
- [ ] Highlight single region
- [ ] Highlight multiple regions
- [ ] Apply choropleth with different color scales
- [ ] Add markers with labels
- [ ] Add markers with pulse animation
- [ ] Pan map to coordinates
- [ ] Zoom map in/out
- [ ] Import custom GeoJSON
- [ ] Hit test regions

#### Map Animation Tools
- [ ] Animate single region with keyframes
- [ ] Animate multiple regions
- [ ] Wave animation horizontal
- [ ] Wave animation vertical
- [ ] Wave animation radial
- [ ] Stop specific animations
- [ ] Stop all animations
- [ ] Query animated regions

#### Map CSV Tools
- [ ] Export CSV with all columns
- [ ] Export CSV with selected columns only
- [ ] Download CSV file
- [ ] Import CSV to update colors
- [ ] Import CSV to update highlights
- [ ] Handle CSV with missing regions gracefully

#### Map Selection Tools
- [ ] Select single region
- [ ] Select multiple regions
- [ ] Deselect specific regions
- [ ] Deselect all regions
- [ ] Query highlighted regions

#### Diagram Tools
- [ ] Create each shape type
- [ ] Connect two shapes
- [ ] Auto-layout hierarchical
- [ ] Auto-layout force-directed
- [ ] Update connector style
- [ ] Remove connector

#### Letter Collage Tools
- [ ] Create tile style
- [ ] Create magazine style
- [ ] Create paperCut style
- [ ] Create fold style
- [ ] Create gradient style
- [ ] Test each palette
- [ ] Animate collage

---

## 3. Test Data Sets

### 3.1 Map Data

```javascript
// World population data (millions)
const worldPopulation = {
  "China": 1412,
  "India": 1408,
  "United States of America": 332,
  "Indonesia": 276,
  "Pakistan": 229,
  "Brazil": 215,
  "Nigeria": 218,
  "Bangladesh": 169,
  "Russia": 144,
  "Mexico": 130
};

// US state data
const usStateData = {
  "CA": 39538223,
  "TX": 29145505,
  "FL": 21538187,
  "NY": 20201249,
  "PA": 13002700,
  "IL": 12812508,
  "OH": 11799448,
  "GA": 10711908,
  "NC": 10439388,
  "MI": 10077331
};

// Election-style binary data
const electionData = {
  "CA": 1, "TX": 0, "FL": 0, "NY": 1, "PA": 1,
  "IL": 1, "OH": 0, "GA": 1, "NC": 0, "MI": 1
};
```

### 3.2 Animation Keyframes

```javascript
// Color transition
const colorTransition = [
  { time: 0, fillColor: "#ef4444" },
  { time: 2, fillColor: "#fbbf24" },
  { time: 4, fillColor: "#22c55e" },
  { time: 6, fillColor: "#3b82f6" },
  { time: 8, fillColor: "#ef4444" }
];

// Fade in/out
const fadeAnimation = [
  { time: 0, fillColor: "#3b82f6", opacity: 0 },
  { time: 1, fillColor: "#3b82f6", opacity: 1 },
  { time: 4, fillColor: "#3b82f6", opacity: 1 },
  { time: 5, fillColor: "#3b82f6", opacity: 0 }
];
```

### 3.3 CSV Test Data

```csv
regionId,name,highlighted,selected,fillColor,strokeColor
USA,United States of America,1,0,#22c55e,#16a34a
CAN,Canada,0,0,#e5e7eb,#9ca3af
MEX,Mexico,1,0,#3b82f6,#2563eb
FRA,France,0,1,#f59e0b,#d97706
```

---

## 4. Performance Testing

### 4.1 Benchmarks

```javascript
// Measure tool execution time
async function benchmark(toolName, args, iterations = 100) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await handleToolCall(toolName, args);
    times.push(performance.now() - start);
  }
  return {
    min: Math.min(...times),
    max: Math.max(...times),
    avg: times.reduce((a, b) => a + b) / times.length,
    p95: times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)]
  };
}

// Expected performance baselines
const baselines = {
  'pinepaper_create_item': { p95: 200 },    // 200ms
  'pinepaper_batch_create': { p95: 500 },   // 500ms for 10 items
  'pinepaper_load_map': { p95: 1000 },      // 1s for map load
  'pinepaper_add_relation': { p95: 150 },
  'pinepaper_animate': { p95: 100 }
};
```

### 4.2 Stress Tests

```javascript
// Large batch creation
await handleToolCall('pinepaper_batch_create', {
  items: Array(100).fill(null).map((_, i) => ({
    type: 'circle',
    params: { x: (i % 10) * 80, y: Math.floor(i / 10) * 80, radius: 20 }
  }))
});

// Many relations
for (let i = 1; i < 50; i++) {
  await handleToolCall('pinepaper_add_relation', {
    sourceId: `item_${i}`,
    targetId: `item_${i + 1}`,
    relationType: 'follows',
    params: { smoothing: 0.1 }
  });
}

// Map with all regions animated
await handleToolCall('pinepaper_animate_map_wave', {
  duration: 5,
  loop: true,
  colors: ['#ef4444', '#22c55e', '#3b82f6'],
  waveDirection: 'radial'
});
```

---

## 5. Error Handling Tests

### 5.1 Invalid Input

```javascript
// Missing required parameters
await handleToolCall('pinepaper_create_item', {});  // Missing type
await handleToolCall('pinepaper_load_map', {});     // Missing mapId
await handleToolCall('pinepaper_add_relation', { sourceId: 'item_1' });  // Missing relationType

// Invalid parameter values
await handleToolCall('pinepaper_create_item', { type: 'invalid' });
await handleToolCall('pinepaper_load_map', { mapId: 'invalid_map' });
await handleToolCall('pinepaper_add_relation', {
  sourceId: 'item_1',
  targetId: 'item_2',
  relationType: 'invalid_relation'
});

// Type mismatches
await handleToolCall('pinepaper_create_item', {
  type: 'circle',
  params: { x: 'not_a_number', y: 300, radius: 50 }
});
```

### 5.2 Runtime Errors

```javascript
// Non-existent items
await handleToolCall('pinepaper_modify_item', {
  itemId: 'non_existent_item_999'
});

await handleToolCall('pinepaper_add_relation', {
  sourceId: 'non_existent',
  targetId: 'also_non_existent',
  relationType: 'orbits'
});

// Map system not available
// (Test with map system disabled or not loaded)
await handleToolCall('pinepaper_load_map', { mapId: 'world' });
```

---

## 6. CI/CD Integration

### 6.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test MCP Server

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test

      - name: Run build
        run: bun run build

      - name: Check tool count
        run: |
          TOOLS=$(grep -c "name: 'pinepaper_" src/tools/definitions.ts)
          echo "Tool count: $TOOLS"
          if [ $TOOLS -lt 80 ]; then
            echo "Error: Expected at least 80 tools"
            exit 1
          fi
```

### 6.2 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit

# Run tests
bun test

# Check types
bun run build

# Verify all tools have handlers
DEFINED=$(grep -c "name: 'pinepaper_" src/tools/definitions.ts)
HANDLED=$(grep -c "case 'pinepaper_" src/tools/handlers.ts)

if [ $DEFINED -ne $HANDLED ]; then
  echo "Error: Tool definition count ($DEFINED) doesn't match handler count ($HANDLED)"
  exit 1
fi
```

---

## 7. Test Coverage Goals

| Area | Target Coverage | Notes |
|------|-----------------|-------|
| Tool handlers | 100% | Every tool must have at least one test |
| Schemas | 100% | Valid and invalid inputs tested |
| Code generators | 100% | Generated code must be syntactically valid |
| Error paths | 80% | Common error scenarios covered |
| Integration | Key workflows | Solar system, map visualizations, diagrams |

---

## 8. Testing Schedule

| Phase | Duration | Focus |
|-------|----------|-------|
| Unit Tests | Continuous | Run on every commit |
| Integration Tests | Daily | Full workflow tests |
| Manual Testing | Weekly | New features, edge cases |
| Performance Tests | Weekly | Benchmark comparisons |
| Stress Tests | Pre-release | Large data sets |

---

## 9. Bug Reporting Template

```markdown
## Bug Report

**Tool**: pinepaper_[tool_name]
**Version**: 1.5.1
**Mode**: Puppeteer / Code Generation

### Input
```json
{
  "param1": "value1"
}
```

### Expected Result
[Description of expected behavior]

### Actual Result
[Description of actual behavior]

### Error Message (if any)
```
[Error text]
```

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Environment
- OS: macOS / Windows / Linux
- Node version: x.x.x
- Browser: Chrome / Firefox / Safari
```
