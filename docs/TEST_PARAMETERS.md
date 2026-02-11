# MCP Server Test Parameters

Quick reference for testing all 97 tools with sample parameters.

---

## Item Tools (10 tools)

### pinepaper_create_item
```json
{"type": "circle", "params": {"x": 400, "y": 300, "radius": 50, "color": "#ef4444"}}
{"type": "rectangle", "params": {"x": 400, "y": 300, "width": 100, "height": 80, "color": "#3b82f6"}}
{"type": "text", "params": {"x": 400, "y": 300, "content": "Hello", "fontSize": 24, "color": "#000"}}
{"type": "star", "params": {"x": 400, "y": 300, "points": 5, "innerRadius": 20, "outerRadius": 50}}
{"type": "triangle", "params": {"x": 400, "y": 300, "size": 60, "color": "#22c55e"}}
{"type": "polygon", "params": {"x": 400, "y": 300, "sides": 6, "radius": 40}}
{"type": "ellipse", "params": {"x": 400, "y": 300, "width": 80, "height": 50}}
{"type": "line", "params": {"from": {"x": 100, "y": 100}, "to": {"x": 300, "y": 200}, "strokeWidth": 2}}
{"type": "arc", "params": {"x": 400, "y": 300, "radius": 50, "startAngle": 0, "endAngle": 180}}
{"type": "path", "params": {"segments": [[100,100], [200,50], [300,100]], "smooth": true}}
```

### pinepaper_modify_item
```json
{"itemId": "item_1", "properties": {"x": 500, "y": 400}}
{"itemId": "item_1", "properties": {"color": "#fbbf24", "opacity": 0.8}}
{"itemId": "item_1", "properties": {"width": 200, "height": 150}}
{"itemId": "item_1", "properties": {"rotation": 45}}
{"itemId": "item_1", "properties": {"scale": 1.5}}
```

### pinepaper_delete_item
```json
{"itemId": "item_1"}
```

### pinepaper_batch_create
```json
{
  "items": [
    {"type": "circle", "params": {"x": 100, "y": 100, "radius": 30, "color": "#ef4444"}},
    {"type": "circle", "params": {"x": 200, "y": 100, "radius": 30, "color": "#fbbf24"}},
    {"type": "circle", "params": {"x": 300, "y": 100, "radius": 30, "color": "#22c55e"}}
  ]
}
```

### pinepaper_batch_modify
```json
{
  "modifications": [
    {"itemId": "item_1", "properties": {"color": "#ff0000"}},
    {"itemId": "item_2", "properties": {"color": "#00ff00"}},
    {"itemId": "item_3", "properties": {"color": "#0000ff"}}
  ]
}
```

### pinepaper_create_grid
```json
{"rows": 5, "cols": 5, "itemType": "circle", "spacing": 60, "itemParams": {"radius": 20, "color": "#3b82f6"}}
```

### pinepaper_create_glossy_sphere
```json
{"x": 400, "y": 300, "radius": 80, "color": "#3b82f6", "lightDirection": "top-left"}
```

### pinepaper_create_diagonal_stripes
```json
{"x": 400, "y": 300, "width": 200, "height": 150, "stripeWidth": 10, "colors": ["#ef4444", "#ffffff"]}
```

---

## Relation Tools (6 tools)

### pinepaper_add_relation
```json
{"sourceId": "item_1", "targetId": "item_2", "relationType": "orbits", "params": {"radius": 100, "speed": 0.5}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "follows", "params": {"smoothing": 0.1, "offset": [0, -30]}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "attached_to", "params": {"offset": [20, 0]}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "maintains_distance", "params": {"distance": 100}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "points_at", "params": {"smoothing": 0.1}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "mirrors", "params": {"axis": "vertical"}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "parallax", "params": {"depth": 0.5}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "bounds_to", "params": {"padding": 20}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "grows_from", "params": {"duration": 1}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "staggered_with", "params": {"index": 0, "stagger": 0.1}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "indicates", "params": {"scale": 1.3, "duration": 0.5}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "circumscribes", "params": {"shape": "circle"}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "wave_through", "params": {"amplitude": 20}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "camera_follows", "params": {"smoothing": 0.1}}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "morphs_to", "params": {"duration": 1.5}}
{"sourceId": "item_1", "targetId": null, "relationType": "animates", "params": {}}
```

### pinepaper_remove_relation
```json
{"sourceId": "item_1", "targetId": "item_2"}
{"sourceId": "item_1", "targetId": "item_2", "relationType": "orbits"}
```

### pinepaper_query_relations
```json
{"itemId": "item_1"}
{"itemId": "item_1", "direction": "outgoing"}
{"itemId": "item_1", "relationType": "orbits"}
```

### pinepaper_get_relation_stats
```json
{}
```

### pinepaper_register_custom_relation
```json
{
  "name": "repels",
  "description": "Item moves away from target",
  "params": {
    "force": {"type": "number", "default": 50, "description": "Repulsion strength"},
    "maxDistance": {"type": "number", "default": 200, "description": "Max effect range"}
  },
  "computeFunction": "const dx = fromPosition.x - toPosition.x; const dy = fromPosition.y - toPosition.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist > params.maxDistance) return fromPosition; const force = (params.maxDistance - dist) / params.maxDistance * params.force; return { x: fromPosition.x + (dx/dist) * force * delta, y: fromPosition.y + (dy/dist) * force * delta };",
  "applyFunction": "if (computed) { item.position.x = computed.x; item.position.y = computed.y; }",
  "templates": ["{item} repels from {target}", "push {item} away from {target}"]
}
{
  "name": "attracts",
  "description": "Item is attracted toward target",
  "params": {
    "strength": {"type": "number", "default": 50},
    "minDistance": {"type": "number", "default": 20},
    "maxDistance": {"type": "number", "default": 300}
  },
  "computeFunction": "const dx = toPosition.x - fromPosition.x; const dy = toPosition.y - fromPosition.y; const dist = Math.sqrt(dx * dx + dy * dy); if (dist < params.minDistance || dist > params.maxDistance) return fromPosition; const force = params.strength / (dist * dist) * 1000; return { x: fromPosition.x + (dx/dist) * force * delta, y: fromPosition.y + (dy/dist) * force * delta };",
  "applyFunction": "if (computed) { item.position.x = computed.x; item.position.y = computed.y; }"
}
{
  "name": "wobbles_with",
  "description": "Item wobbles in sync with time",
  "params": {
    "amplitude": {"type": "number", "default": 10},
    "frequency": {"type": "number", "default": 2}
  },
  "computeFunction": "const angle = time * params.frequency * Math.PI * 2; return { offsetX: Math.sin(angle) * params.amplitude, offsetY: Math.cos(angle) * params.amplitude * 0.5 };",
  "applyFunction": "if (computed) { item.position.x += computed.offsetX; item.position.y += computed.offsetY; }",
  "continuous": true
}
{
  "name": "spring_to",
  "description": "Spring physics connection to target",
  "params": {
    "stiffness": {"type": "number", "default": 0.1},
    "damping": {"type": "number", "default": 0.8},
    "restLength": {"type": "number", "default": 100}
  },
  "computeFunction": "const dx = toPosition.x - fromPosition.x; const dy = toPosition.y - fromPosition.y; const dist = Math.sqrt(dx * dx + dy * dy); const displacement = dist - params.restLength; const fx = (dx / dist) * displacement * params.stiffness; const fy = (dy / dist) * displacement * params.stiffness; return { vx: fx * params.damping, vy: fy * params.damping };",
  "applyFunction": "if (computed) { item.position.x += computed.vx; item.position.y += computed.vy; }",
  "priority": 10
}
```

### pinepaper_execute_custom_code
```json
{
  "code": "const outer = new paper.Path.Circle({ center: [400, 300], radius: 80 }); const inner = new paper.Path.Circle({ center: [400, 300], radius: 40 }); const ring = outer.subtract(inner); ring.fillColor = '#8b5cf6'; const id = app.registerItem(ring, 'ring'); outer.remove(); inner.remove(); return { success: true, itemId: id };",
  "description": "Create a ring using boolean subtraction"
}
{
  "code": "const items = app.itemRegistry.getAll(); return { count: items.length, types: items.map(i => i.type) };",
  "description": "Get all registered items info"
}
{
  "code": "const path = new paper.Path(); path.add([100, 100]); path.arcTo([200, 50], [300, 100]); path.closePath(); path.fillColor = '#3b82f6'; const id = app.registerItem(path, 'customArc'); return { itemId: id };",
  "description": "Create custom arc path"
}
{
  "code": "const group = new paper.Group(); for (let i = 0; i < 5; i++) { const c = new paper.Path.Circle({ center: [100 + i*50, 200], radius: 20 - i*3 }); c.fillColor = `hsl(${i*60}, 70%, 50%)`; group.addChild(c); } const id = app.registerItem(group, 'circleGroup'); return { itemId: id, childCount: 5 };",
  "description": "Create a group of circles with gradient colors"
}
{
  "code": "return { canvasSize: { width: paper.view.size.width, height: paper.view.size.height }, zoom: paper.view.zoom, center: { x: paper.view.center.x, y: paper.view.center.y } };",
  "description": "Get canvas/view information"
}
{
  "code": "const trainingData = app.exportRelationTrainingData(); return { count: trainingData.length, sample: trainingData.slice(0, 3) };",
  "description": "Export relation training data for LLM fine-tuning"
}
```

---

## Animation Tools (3 tools)

### pinepaper_animate
```json
{"itemId": "item_1", "animationType": "pulse", "speed": 1}
{"itemId": "item_1", "animationType": "rotate", "speed": 0.5}
{"itemId": "item_1", "animationType": "bounce", "speed": 1}
{"itemId": "item_1", "animationType": "fade", "speed": 1}
{"itemId": "item_1", "animationType": "wobble", "speed": 1}
{"itemId": "item_1", "animationType": "slide", "speed": 1}
{"itemId": "item_1", "animationType": "typewriter", "speed": 1}
```

### pinepaper_keyframe_animate
```json
{
  "itemId": "item_1",
  "keyframes": [
    {"time": 0, "properties": {"x": 100, "opacity": 0}},
    {"time": 1, "properties": {"x": 400, "opacity": 1}},
    {"time": 2, "properties": {"x": 700, "opacity": 0}}
  ],
  "duration": 2,
  "loop": true
}
```

### pinepaper_play_timeline
```json
{"duration": 5, "loop": true}
{"action": "stop"}
{"action": "pause"}
{"action": "resume"}
```

---

## Generator Tools (2 tools)

### pinepaper_execute_generator
```json
{"name": "drawSunburst", "params": {"colors": ["#fbbf24", "#f59e0b"], "rays": 12}}
{"name": "drawGrid", "params": {"gridType": "dots", "spacing": 40}}
{"name": "drawWaves", "params": {"waveCount": 5, "amplitude": 30}}
{"name": "drawCircuit", "params": {"nodeCount": 20}}
{"name": "drawStackedCircles", "params": {"count": 50, "distribution": "poisson"}}
{"name": "drawSunsetScene", "params": {}}
{"name": "drawPattern", "params": {"patternType": "chevron"}}
```

### pinepaper_list_generators
```json
{}
```

---

## Effect Tools (1 tool)

### pinepaper_apply_effect
```json
{"itemId": "item_1", "effectType": "sparkle", "params": {"color": "#fbbf24", "speed": 1, "size": 3}}
{"itemId": "item_1", "effectType": "blast", "params": {"color": "#ef4444", "radius": 100, "count": 20}}
```

---

## Query Tools (3 tools)

### pinepaper_get_items
```json
{}
{"filter": {"type": "circle"}}
{"filter": {"hasAnimation": true}}
```

### pinepaper_hit_test
```json
{"point": {"x": 400, "y": 300}}
```

### pinepaper_get_performance_metrics
```json
{}
```

---

## Canvas Tools (5 tools)

### pinepaper_set_background_color
```json
{"color": "#1a1a2e"}
{"color": "linear-gradient(#000000, #1a1a2e)"}
```

### pinepaper_set_canvas_size
```json
{"preset": "youtube-thumbnail"}
{"preset": "instagram-story"}
{"width": 1920, "height": 1080}
```

### pinepaper_get_canvas_size
```json
{}
```

### pinepaper_clear_canvas
```json
{}
```

### pinepaper_refresh_page
```json
{}
```

---

## Export Tools (3 tools)

### pinepaper_export_svg
```json
{}
{"animated": true}
```

### pinepaper_export_training_data
```json
{}
{"format": "jsonl"}
```

### pinepaper_browser_screenshot
```json
{}
{"fullPage": true}
```

---

## Browser Tools (4 tools)

### pinepaper_browser_connect
```json
{}
{"headless": true}
{"url": "https://pinepaper.studio"}
```

### pinepaper_browser_disconnect
```json
{}
```

### pinepaper_browser_status
```json
{}
```

---

## Import Tools (3 tools)

### pinepaper_import_svg
```json
{"svgContent": "<svg>...</svg>", "position": {"x": 400, "y": 300}}
{"url": "https://example.com/icon.svg"}
```

### pinepaper_search_assets
```json
{"query": "rocket"}
{"query": "cat", "limit": 10}
```

### pinepaper_import_asset
```json
{"assetId": "svgrepo_12345", "position": {"x": 400, "y": 300}}
```

---

## Filter Tools (1 tool)

### pinepaper_add_filter
```json
{"itemId": "item_1", "filterType": "blur", "params": {"radius": 5}}
{"itemId": "item_1", "filterType": "shadow", "params": {"offsetX": 5, "offsetY": 5, "blur": 10}}
```

---

## p5.js Tools (1 tool)

### pinepaper_p5_draw
```json
{
  "code": "background(30); fill(255, 0, 0); circle(width/2, height/2, 100);"
}
```

---

## Diagram Tools (9 tools)

### pinepaper_create_diagram_shape
```json
{"shapeType": "process", "position": {"x": 400, "y": 200}, "label": "Process Step"}
{"shapeType": "decision", "position": {"x": 400, "y": 300}, "label": "Is Valid?"}
{"shapeType": "terminal", "position": {"x": 400, "y": 100}, "label": "Start"}
{"shapeType": "database", "position": {"x": 600, "y": 200}, "label": "Users DB"}
{"shapeType": "uml-class", "position": {"x": 400, "y": 200}, "label": "User"}
{"shapeType": "cloud", "position": {"x": 400, "y": 200}, "label": "AWS"}
```

### pinepaper_connect
```json
{"fromId": "shape_1", "toId": "shape_2"}
{"fromId": "shape_1", "toId": "shape_2", "style": {"routing": "orthogonal", "headStyle": "classic"}}
```

### pinepaper_connect_ports
```json
{"fromId": "shape_1", "fromPort": "bottom", "toId": "shape_2", "toPort": "top"}
```

### pinepaper_add_ports
```json
{"itemId": "item_1", "ports": ["top", "bottom", "left", "right"]}
```

### pinepaper_auto_layout
```json
{"layout": "hierarchical", "direction": "TB"}
{"layout": "force-directed"}
{"layout": "tree"}
```

### pinepaper_get_diagram_shapes
```json
{}
```

### pinepaper_update_connector
```json
{"connectorId": "connector_1", "style": {"lineColor": "#ef4444", "lineWidth": 3}}
```

### pinepaper_remove_connector
```json
{"connectorId": "connector_1"}
```

### pinepaper_diagram_mode
```json
{"enabled": true}
{"enabled": false}
```

---

## Agent Flow Tools (6 tools)

### pinepaper_agent_start_job
```json
{"jobName": "Logo Animation", "description": "Create animated logo"}
```

### pinepaper_agent_end_job
```json
{}
{"export": true, "format": "svg"}
```

### pinepaper_agent_reset
```json
{}
{"preserveBackground": true}
```

### pinepaper_agent_batch_execute
```json
{
  "operations": [
    {"tool": "create_item", "args": {"type": "circle", "params": {"x": 100, "y": 100, "radius": 30}}},
    {"tool": "create_item", "args": {"type": "circle", "params": {"x": 200, "y": 100, "radius": 30}}},
    {"tool": "add_relation", "args": {"sourceId": "$0", "targetId": "$1", "relationType": "follows"}}
  ]
}
```

### pinepaper_agent_export
```json
{"format": "svg"}
{"format": "png", "scale": 2}
```

### pinepaper_agent_analyze
```json
{}
```

---

## Interactive/Trigger Tools (3 tools)

### pinepaper_add_trigger
```json
{
  "itemId": "item_1",
  "event": "click",
  "actions": [{"type": "play_animation", "targetItemId": "item_1", "animationType": "pulse"}]
}
{"itemId": "item_1", "event": "hover_enter", "actions": [{"type": "show", "targetItemId": "tooltip_1"}]}
{"itemId": "item_1", "event": "hover_leave", "actions": [{"type": "hide", "targetItemId": "tooltip_1"}]}
```

### pinepaper_remove_trigger
```json
{"triggerId": "trigger_1"}
{"itemId": "item_1", "event": "click"}
```

### pinepaper_query_triggers
```json
{}
{"itemId": "item_1"}
```

---

## Quiz/LMS Tools (3 tools)

### pinepaper_create_quiz
```json
{
  "quizId": "quiz_1",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "What is 2+2?",
      "choices": [
        {"id": "a", "text": "3", "correct": false},
        {"id": "b", "text": "4", "correct": true},
        {"id": "c", "text": "5", "correct": false}
      ]
    }
  ],
  "settings": {"showFeedback": true, "allowRetry": true}
}
```

### pinepaper_get_quiz_state
```json
{"quizId": "quiz_1"}
```

### pinepaper_reset_quiz
```json
{"quizId": "quiz_1"}
```

---

## Letter Collage Tools (3 tools)

### pinepaper_create_letter_collage
```json
{"text": "HELLO", "style": "tile", "palette": "wordle"}
{"text": "WORLD", "style": "magazine", "palette": "newspaper"}
{"text": "PINEPAPER", "style": "gradient", "gradientPalette": "rainbow", "gradientDirection": "horizontal"}
{"text": "ART", "style": "paperCut"}
{"text": "FOLD", "style": "fold"}
```

### pinepaper_animate_letter_collage
```json
{"collageId": "collage_1", "animationType": "pulse", "staggerDelay": 0.1}
{"collageId": "collage_1", "animationType": "bounce", "staggerDelay": 0.15, "animationSpeed": 1.5}
{"collageId": "collage_1", "animationType": "fade", "staggerDelay": 0.2}
```

### pinepaper_get_letter_collage_options
```json
{}
```

---

## Canvas Presets Tools (1 tool)

### pinepaper_get_canvas_presets
```json
{}
```

---

## Map Tools (11 tools)

### pinepaper_load_map
```json
{"mapId": "world"}
{"mapId": "world", "options": {"projection": "naturalEarth", "quality": "professional"}}
{"mapId": "worldHighRes", "options": {"projection": "orthographic", "rotate": [0, -30, 0]}}
{"mapId": "usa", "options": {"projection": "albers", "fillColor": "#e5e7eb"}}
```

### pinepaper_highlight_regions
```json
{"regionIds": ["United States of America", "Canada", "Mexico"]}
{"regionIds": ["CA", "TX", "NY"], "options": {"fillColor": "#22c55e", "animate": true}}
{"regionIds": ["France", "Germany"], "options": {"fillColor": "#3b82f6", "strokeColor": "#2563eb", "strokeWidth": 2}}
```

### pinepaper_unhighlight_regions
```json
{"regionIds": "all"}
{"regionIds": ["USA", "France"]}
```

### pinepaper_apply_data_colors
```json
{
  "data": {"CA": 39538223, "TX": 29145505, "FL": 21538187, "NY": 20201249},
  "options": {"colorScale": "blues", "showLegend": true}
}
{
  "data": {"United States of America": 330, "China": 1400, "India": 1380},
  "options": {"colorScale": "heat", "legendPosition": "bottom-right", "legendTitle": "Population (millions)"}
}
```

### pinepaper_add_marker
```json
{"lat": 37.7749, "lon": -122.4194, "label": "San Francisco", "color": "#ef4444", "pulse": true}
{"lat": 40.7128, "lon": -74.0060, "label": "New York", "shape": "pin", "size": 10}
{"lat": 51.5074, "lon": -0.1278, "label": "London", "shape": "star"}
```

### pinepaper_add_map_labels
```json
{}
{"options": {"fontSize": 10, "fontColor": "#374151", "labelType": "name"}}
{"regions": ["CA", "TX"], "options": {"labelType": "code"}}
```

### pinepaper_pan_map
```json
{"lat": 40.7128, "lon": -74.0060}
{"lat": 48, "lon": 10, "animate": true, "duration": 1}
```

### pinepaper_zoom_map
```json
{"level": 2}
{"level": 3, "animate": true, "duration": 1}
```

### pinepaper_export_map
```json
{}
```

### pinepaper_import_custom_map
```json
{"url": "https://example.com/custom.geojson", "options": {"projection": "mercator"}}
```

### pinepaper_get_region_at_point
```json
{"x": 400, "y": 300}
```

---

## Map Animation Tools (4 tools)

### pinepaper_animate_map_regions
```json
{
  "duration": 8,
  "loop": true,
  "regions": {
    "USA": [
      {"time": 0, "fillColor": "#ef4444"},
      {"time": 4, "fillColor": "#22c55e"},
      {"time": 8, "fillColor": "#ef4444"}
    ],
    "France": [
      {"time": 0, "fillColor": "#3b82f6"},
      {"time": 8, "fillColor": "#fbbf24"}
    ]
  }
}
```

### pinepaper_animate_map_wave
```json
{"duration": 10, "loop": true, "waveDirection": "horizontal"}
{"duration": 5, "colors": ["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"], "waveDirection": "radial"}
{"waveDirection": "vertical", "colors": ["#ffffff", "#3b82f6"]}
```

### pinepaper_stop_map_animations
```json
{}
{"regions": ["USA", "France"], "resetColors": true}
{"resetColors": false}
```

### pinepaper_get_animated_map_regions
```json
{}
```

---

## Map CSV Tools (2 tools)

### pinepaper_export_map_region_csv
```json
{}
{"includeHighlighted": true, "includeColors": true, "download": true, "filename": "map-data.csv"}
{"includeSelected": false, "includeHighlighted": false}
```

### pinepaper_import_map_region_csv
```json
{"csvText": "regionId,fillColor,highlighted\nUSA,#22c55e,1\nFrance,#3b82f6,0\nJapan,#fbbf24,1"}
{"csvText": "regionId,fillColor\nCA,#ef4444\nTX,#3b82f6", "applyHighlight": false}
```

---

## Map Selection Tools (3 tools)

### pinepaper_select_map_regions
```json
{"regionIds": ["USA", "Canada", "Mexico"]}
{"regionIds": ["CA", "TX", "NY", "FL"]}
```

### pinepaper_deselect_map_regions
```json
{}
{"regionIds": ["USA", "France"]}
```

### pinepaper_get_highlighted_map_regions
```json
{}
```

---

## Map Export Tools (3 tools)

### pinepaper_export_map_geojson
```json
{}
{"includeStyles": true, "includeMetadata": true}
{"selectedOnly": true, "download": true, "filename": "my-map.geojson"}
```

### pinepaper_export_original_map_geojson
```json
{}
{"download": true, "filename": "source-map.geojson"}
```

### pinepaper_get_map_source_info
```json
{}
```

---

## Paper.js Direct Access (1 tool)

### pinepaper_register_item
```json
{"itemJson": ["Path", {"segments": [[100, 100], [200, 50], [300, 100]], "closed": true}], "itemType": "customTriangle"}
{"itemJson": ["Shape", {"type": "circle", "center": [200, 200], "radius": 50}], "itemType": "customCircle", "properties": {"source": "mcp"}}
```

---

## Mask Tools (7 tools)

### pinepaper_apply_animated_mask
```json
{"itemId": "item_1", "preset": "wipeLeft", "options": {"duration": 0.5, "easing": "easeOut"}}
{"itemId": "item_1", "preset": "iris", "options": {"startTime": 0.5, "duration": 1, "loop": true}}
{"itemId": "item_1", "preset": "curtainHorizontal", "options": {"reversed": true}}
{"itemId": "item_1", "preset": "star", "maskOptions": {"points": 6, "innerRadius": 0.4}}
{"itemId": "item_1", "maskType": "rectangle", "keyframes": [{"time": 0, "properties": {"x": 200, "y": 250, "width": 0, "height": 100}}, {"time": 1, "properties": {"x": 200, "y": 250, "width": 200, "height": 100}}]}
{"itemId": "item_1", "preset": "iris", "keyframes": [{"time": 0, "properties": {"scale": 0}, "easing": "linear"}, {"time": 0.5, "properties": {"scale": 0.5}, "easing": "easeIn"}, {"time": 1, "properties": {"scale": 1}, "easing": "bounce"}]}
```

### pinepaper_apply_custom_mask
```json
{"itemId": "item_1", "maskType": "circle", "keyframes": [{"time": 0, "properties": {"radius": 0}}, {"time": 1, "properties": {"radius": 100}}]}
{"itemId": "item_1", "maskType": "star", "keyframes": [{"time": 0, "properties": {"scale": 0}}, {"time": 0.5, "properties": {"scale": 0.5}}, {"time": 1, "properties": {"scale": 1}}], "maskOptions": {"points": 5, "innerRadius": 0.5}}
{"itemId": "item_1", "maskType": "heart", "keyframes": [{"time": 0, "properties": {"scale": 0, "opacity": 0}}, {"time": 1, "properties": {"scale": 1, "opacity": 1}}]}
```

### pinepaper_remove_mask
```json
{"itemId": "item_1"}
```

### pinepaper_get_animatable_properties
```json
{}
```

### pinepaper_get_available_easings
```json
{}
```

### pinepaper_get_mask_types
```json
{}
```

### pinepaper_get_mask_animations
```json
{}
```

---

## Quick Test Commands

### Test All Map Tools (Claude Desktop)

```
1. "Load a world map with Natural Earth projection"
2. "Highlight the United States, Canada, and Mexico in blue"
3. "Show population data for US states as a choropleth"
4. "Add a marker for San Francisco with a pulse animation"
5. "Create a wave animation across the map going left to right"
6. "Export the map region data as CSV"
7. "Stop all map animations"
```

### Test All Diagram Tools

```
1. "Create a flowchart: Start (terminal) -> Process -> Decision (is valid?) -> End (terminal)"
2. "Connect all the shapes with orthogonal connectors"
3. "Apply hierarchical auto-layout"
```

### Test Animation Workflow

```
1. "Create a sun in the center"
2. "Create an earth to the right of the sun"
3. "Create a moon near the earth"
4. "Make earth orbit the sun"
5. "Make moon orbit the earth"
6. "Make the sun pulse"
```
