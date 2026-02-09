# PinePaper MCP Tool Audit

> Comprehensive analysis of 119 MCP tools for reliability, clarity, and testability

## Executive Summary

| Metric | Count |
|--------|-------|
| Total Tools | 119 |
| Categories | 17 |
| High Priority Tests | 25 |
| Recommended for Removal/Merge | 15 |
| Needs Description Improvement | 30+ |

---

## Tool Categories

### 1. CORE ITEM TOOLS (6 tools)
**Purpose:** Create, modify, delete items on canvas

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_item` | Create text, shapes, images | Core tool - too many params, 30+ properties | HIGH |
| `modify_item` | Change item properties | Overlaps with create_item params | HIGH |
| `delete_item` | Remove item | Clear, simple | LOW |
| `batch_create` | Create multiple items | Good for efficiency | MEDIUM |
| `batch_modify` | Modify multiple items | Good for efficiency | MEDIUM |
| `create_grid` | Create items in grid layout | Specialized, clear | LOW |

**Issues:**
- `create_item` is overloaded with 30+ optional parameters
- Unclear when to use `create_item` vs specialized tools (glossy_sphere, diagonal_stripes)
- `modify_item` duplicates most of `create_item` params

**Recommendation:**
- Consider splitting `create_item` into `create_text`, `create_shape`, `create_image`
- Or: Add clearer "type" documentation showing which params apply to which item types

**Test Cases:**
1. "Create red text saying HELLO" → Should use create_item with type='text'
2. "Create a blue circle" → Should use create_item with type='circle'
3. "Change the text color to green" → Should use modify_item
4. "Create 5 stars in a row" → Should use batch_create OR create_grid

---

### 2. SPECIAL SHAPE TOOLS (2 tools)
**Purpose:** Create complex shapes that are hard to describe

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_glossy_sphere` | 3D-looking sphere | Specialized - when would LLM know to use this? | LOW |
| `create_diagonal_stripes` | Stripe pattern | Specialized - when would LLM know to use this? | LOW |

**Issues:**
- These exist because they're hard to create with `create_item`
- But LLM won't know they exist unless user specifically asks
- User says "create a shiny ball" - will LLM find `create_glossy_sphere`?

**Recommendation:**
- Keep but improve descriptions to include trigger phrases
- Add "USE WHEN: user asks for 3D sphere, shiny ball, glossy orb"

**Test Cases:**
1. "Create a 3D looking ball" → Should find create_glossy_sphere
2. "Add a striped background" → Should find create_diagonal_stripes

---

### 3. SCENE TOOLS (2 tools)
**Purpose:** High-level scene creation

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_scene` | Create complete scene from description | IMPORTANT - high-level tool | HIGH |
| `export_scene` | Export scene as JSON | Clear | LOW |

**Issues:**
- `create_scene` is potentially very powerful but underutilized
- Does it actually work? What scenes can it create?

**Recommendation:**
- This could be THE primary tool if it works well
- Needs thorough testing with various scene descriptions

**Test Cases:**
1. "Create a solar system" → Should create_scene handle this entirely?
2. "Create an infographic about climate change" → Can create_scene do this?
3. "Create a simple logo with text ABC" → create_scene or create_item?

---

### 4. RELATION TOOLS (4 tools)
**Purpose:** Create behavioral relationships between items

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `add_relation` | Create relation (orbit, follow, etc.) | Core animation tool | HIGH |
| `remove_relation` | Remove relation | Clear | LOW |
| `query_relations` | Get existing relations | Useful for debugging | LOW |
| `register_custom_relation` | Create custom relation type | Advanced - probably never used by LLM | LOW |

**Issues:**
- 15+ relation types - LLM must pick the right one
- Relation names aren't always intuitive: `circumscribes`? `wave_through`?
- Parameters vary by relation type

**Relation Types to Test:**
| Relation | Intuitive? | Test Phrase |
|----------|------------|-------------|
| `orbits` | Yes | "make earth orbit the sun" |
| `follows` | Yes | "make the label follow the player" |
| `attached_to` | Yes | "attach the hat to the character" |
| `maintains_distance` | Medium | "keep 100px away from X" |
| `points_at` | Yes | "make arrow point at target" |
| `mirrors` | Medium | "mirror the position" |
| `parallax` | No | How would user ask for this? |
| `bounds_to` | No | "keep item inside this area" |
| `circumscribes` | No | What does this even mean to users? |
| `wave_through` | No | Unclear |
| `camera_follows` | Yes | "camera follows player" |
| `morphs_to` | Medium | "morph into another shape" |

**Recommendation:**
- Remove or hide obscure relations: `circumscribes`, `wave_through`, `parallax`
- Better descriptions with examples for remaining relations

**Test Cases:**
1. "Make the moon orbit the earth" → add_relation with orbits
2. "The arrow should always point at the target" → add_relation with points_at
3. "Make the character bounce" → Is this a relation or animation?

---

### 5. ANIMATION TOOLS (3 tools)
**Purpose:** Animate items

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `animate` | Simple loop animation (pulse, rotate, bounce) | Core tool | HIGH |
| `keyframe_animate` | Complex keyframe animation | Advanced, many params | MEDIUM |
| `play_timeline` | Control playback | Utility | LOW |

**Issues:**
- `animate` vs `add_relation` - both can create animation
- When is "pulse" animation vs "scale" relation?
- `keyframe_animate` is complex - will LLM use it correctly?

**Animation Types:**
| Type | Clear? | Overlaps With |
|------|--------|---------------|
| `pulse` | Yes | - |
| `rotate` | Yes | - |
| `bounce` | Yes | `maintains_distance` relation? |
| `fade` | Yes | - |
| `wobble` | Yes | - |
| `slide` | Medium | Could be relation? |
| `typewriter` | Yes | Text-specific |

**Recommendation:**
- Clear documentation: "Use `animate` for simple loops, `add_relation` for behaviors"
- Maybe merge simpler animations into `create_item` with inline animation params (already done!)

**Test Cases:**
1. "Make the text pulse" → animate with type='pulse'
2. "Animate the logo spinning" → animate with type='rotate'
3. "Create a typewriter effect for the text" → animate with type='typewriter'
4. "Make the ball bounce up and down forever" → animate? or relation?

---

### 6. CAMERA TOOLS (7 tools)
**Purpose:** Control camera/viewport

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `camera_animate` | Keyframe camera animation | Complex | MEDIUM |
| `camera_zoom` | Zoom in/out | Simple | MEDIUM |
| `camera_pan` | Pan camera | Simple | MEDIUM |
| `camera_move_to` | Move to position | Simple | MEDIUM |
| `camera_reset` | Reset camera | Simple | LOW |
| `camera_stop` | Stop camera animation | Simple | LOW |
| `camera_state` | Get camera state | Query | LOW |

**Issues:**
- 7 tools for camera - could be 2-3
- `camera_zoom`, `camera_pan`, `camera_move_to` overlap significantly
- Most users probably just want zoom and pan

**Recommendation:**
- Consider merging: `camera_control` with action param (zoom/pan/move/reset)
- Keep `camera_animate` separate for complex sequences

**Test Cases:**
1. "Zoom in on the logo" → camera_zoom
2. "Pan to the left side" → camera_pan
3. "Create a cinematic zoom effect" → camera_animate?

---

### 7. MASK TOOLS (7 tools)
**Purpose:** Create reveal/mask effects

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `apply_animated_mask` | Apply preset mask animation | Main tool | MEDIUM |
| `apply_custom_mask` | Apply custom mask | Advanced | LOW |
| `remove_mask` | Remove mask | Clear | LOW |
| `get_animatable_properties` | Query helper | Utility | LOW |
| `get_available_easings` | Query helper | Utility | LOW |
| `get_mask_types` | Query helper | Utility | LOW |
| `get_mask_animations` | Query helper | Utility | LOW |

**Issues:**
- 4 query helpers that LLM probably won't use
- Main value is `apply_animated_mask`

**Recommendation:**
- Keep all but consider hiding query helpers from main tool list
- They're useful for the LLM to discover options, but clutter the list

**Test Cases:**
1. "Add a reveal effect to the text" → apply_animated_mask
2. "Make the image appear with a wipe from left" → apply_animated_mask with wipe type

---

### 8. FONT TOOLS (16 tools)
**Purpose:** Create custom fonts

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `font_show_studio` | Open font editor | - | LOW |
| `font_set_name` | Set font name | - | LOW |
| `font_get_required_chars` | Get char list | - | LOW |
| `font_get_status` | Get progress | - | LOW |
| `font_create_glyph` | Create letter | Core | LOW |
| `font_create_space` | Create space char | - | LOW |
| `font_remove_glyph` | Delete letter | - | LOW |
| `font_set_metrics` | Set font metrics | - | LOW |
| `font_export` | Export OTF | - | LOW |
| `font_load_into_document` | Use font | - | LOW |
| `font_export_data` | Export JSON | - | LOW |
| `font_import_data` | Import JSON | - | LOW |
| `font_clear` | Clear all | - | LOW |
| `font_remove_overlap` | Clean paths | - | LOW |
| `font_correct_direction` | Fix winding | - | LOW |
| `font_cleanup_path` | Clean paths | - | LOW |

**Issues:**
- 16 tools for a very niche feature (font creation)
- Will any user ask an LLM to create a font?
- These are highly specialized and technical

**Recommendation:**
- Consider moving to separate "font creation" mode/namespace
- Don't expose all 16 in main tool list
- Or: Create one `font_workflow` tool that handles the sequence

**Test Cases:**
- Probably not worth testing via natural language
- Font creation is too technical for conversational AI

---

### 9. GENERATOR/BACKGROUND TOOLS (2 tools)
**Purpose:** Create procedural backgrounds

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `execute_generator` | Run background generator | Main tool | MEDIUM |
| `list_generators` | List available generators | Query | LOW |

**Generators Available:**
- `drawSunburst` - Radial rays
- `drawSunsetScene` - Animated sunset
- `drawGrid` - Lines, dots, squares
- `drawWaves` - Layered waves
- `drawCircuit` - Tech circuit board

**Issues:**
- Names are code-like (`drawSunburst`), not natural language
- User says "add a sunburst background" - will it match?

**Recommendation:**
- Improve matching: "sunburst", "radial", "rays" → drawSunburst

**Test Cases:**
1. "Add a sunburst background" → execute_generator with drawSunburst
2. "Create a tech/circuit pattern" → execute_generator with drawCircuit
3. "Add animated waves at the bottom" → execute_generator with drawWaves

---

### 10. EFFECT TOOLS (2 tools)
**Purpose:** Apply visual effects

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `apply_effect` | Apply sparkle, blast effects | Limited | MEDIUM |
| `add_filter` | Add SVG filters | Advanced | LOW |

**Issues:**
- `apply_effect` only has sparkle and blast
- `add_filter` is very technical (SVG filter knowledge required)

**Test Cases:**
1. "Add sparkles to the text" → apply_effect with sparkle
2. "Make it look like an explosion" → apply_effect with blast?

---

### 11. DIAGRAM TOOLS (9 tools)
**Purpose:** Create flowcharts, UML, network diagrams

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_diagram_shape` | Create flowchart/UML shape | Core | HIGH |
| `connect` | Connect two items | Core | HIGH |
| `connect_ports` | Connect specific ports | Advanced | LOW |
| `add_ports` | Add connection ports | Advanced | LOW |
| `auto_layout` | Arrange items automatically | Useful | MEDIUM |
| `get_diagram_shapes` | List available shapes | Query | LOW |
| `update_connector` | Modify connector | Utility | LOW |
| `remove_connector` | Delete connector | Utility | LOW |
| `diagram_mode` | Toggle diagram mode | Utility | LOW |

**Issues:**
- Good set of tools for diagrams
- But user needs to know to use diagram-specific tools vs regular items
- "Create a flowchart" - does LLM know to use these?

**Test Cases:**
1. "Create a flowchart with Start → Process → End" → create_diagram_shape + connect
2. "Make a UML class diagram for User class" → create_diagram_shape (uml-class)
3. "Auto-arrange my diagram" → auto_layout

---

### 12. MAP TOOLS (21 tools) ⚠️ LARGEST CATEGORY
**Purpose:** Create geographic visualizations

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `load_map` | Load a map | Core | HIGH |
| `highlight_regions` | Highlight states/countries | Core | HIGH |
| `unhighlight_regions` | Remove highlight | Utility | LOW |
| `apply_data_colors` | Choropleth coloring | Core | MEDIUM |
| `add_marker` | Add map marker | Core | MEDIUM |
| `add_map_labels` | Add text labels | Utility | LOW |
| `pan_map` | Pan map view | Utility | LOW |
| `zoom_map` | Zoom map view | Utility | LOW |
| `export_map` | Export map | Utility | LOW |
| `import_custom_map` | Import GeoJSON | Advanced | LOW |
| `get_region_at_point` | Query region | Utility | LOW |
| `animate_map_regions` | Animate regions | MEDIUM | MEDIUM |
| `animate_map_wave` | Wave animation | Specialized | LOW |
| `stop_map_animations` | Stop animations | Utility | LOW |
| `get_animated_map_regions` | Query | Utility | LOW |
| `export_map_region_csv` | Export CSV | Utility | LOW |
| `import_map_region_csv` | Import CSV | Utility | LOW |
| `select_map_regions` | Select regions | Utility | LOW |
| `deselect_map_regions` | Deselect | Utility | LOW |
| `get_highlighted_map_regions` | Query | Utility | LOW |
| `export_map_geojson` | Export GeoJSON | Utility | LOW |
| `export_original_map_geojson` | Export original | Utility | LOW |
| `get_map_source_info` | Query source | Utility | LOW |

**Issues:**
- 21 tools for maps alone!
- Many are utility/query tools that LLM won't use
- Core workflow is only: load_map → highlight_regions → apply_data_colors

**Recommendation:**
- Hide 15+ utility tools from main list
- Keep visible: load_map, highlight_regions, apply_data_colors, add_marker, animate_map_regions
- Others available but not in main tool description

**Test Cases:**
1. "Create a USA map" → load_map('usa')
2. "Highlight California and Texas in red" → highlight_regions
3. "Color states by population data" → apply_data_colors
4. "Add a marker on New York" → add_marker

---

### 13. AGENT FLOW TOOLS (6 tools)
**Purpose:** Session management for batch operations

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `agent_start_job` | Start a job session | Required for agent mode | HIGH |
| `agent_end_job` | End job, get results | Required | HIGH |
| `agent_reset` | Reset session | Utility | LOW |
| `agent_batch_execute` | Execute multiple tools | Optimization | MEDIUM |
| `agent_export` | Export results | Utility | LOW |
| `agent_analyze` | Analyze canvas | Utility | LOW |

**Issues:**
- These are infrastructure tools, not creative tools
- LLM needs to know to start/end jobs
- Should this be automatic?

**Recommendation:**
- Consider making job start/end automatic
- Or: Very clear documentation that every session needs start→work→end

**Test Cases:**
1. Does LLM remember to call agent_start_job first?
2. Does LLM call agent_end_job when done?

---

### 14. TRIGGER TOOLS (3 tools)
**Purpose:** Add interactivity (click handlers, etc.)

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `add_trigger` | Add click/hover handler | Core | MEDIUM |
| `remove_trigger` | Remove trigger | Utility | LOW |
| `query_triggers` | List triggers | Query | LOW |

**Test Cases:**
1. "Make the button clickable" → add_trigger
2. "When clicked, show a message" → add_trigger with action

---

### 15. QUIZ TOOLS (3 tools)
**Purpose:** Create interactive quizzes

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_quiz` | Create quiz | Specialized | LOW |
| `get_quiz_state` | Get quiz state | Query | LOW |
| `reset_quiz` | Reset quiz | Utility | LOW |

**Issues:**
- Very specialized feature
- Complex parameters

**Test Cases:**
1. "Create a multiple choice quiz about capitals" → create_quiz

---

### 16. LETTER COLLAGE TOOLS (3 tools)
**Purpose:** Create text art

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `create_letter_collage` | Create text collage | Specialized | LOW |
| `animate_letter_collage` | Animate collage | Specialized | LOW |
| `get_letter_collage_options` | Query options | Query | LOW |

**Test Cases:**
1. "Create a word cloud with HELLO" → create_letter_collage?

---

### 17. UTILITY/QUERY TOOLS (15 tools)
**Purpose:** Various utilities

| Tool | Purpose | Issues | Priority |
|------|---------|--------|----------|
| `get_items` | List items | Query | LOW |
| `get_relation_stats` | Relation statistics | Query | LOW |
| `set_background_color` | Set background | Simple, clear | MEDIUM |
| `set_canvas_size` | Set dimensions | Simple, clear | MEDIUM |
| `get_canvas_size` | Get dimensions | Query | LOW |
| `get_canvas_presets` | Get presets | Query | LOW |
| `clear_canvas` | Clear all | Destructive | LOW |
| `refresh_page` | Reload | Utility | LOW |
| `import_svg` | Import SVG file | Utility | LOW |
| `export_svg` | Export SVG | Utility | LOW |
| `export_training_data` | Export LLM training | Internal | LOW |
| `browser_connect` | Connect browser | Infrastructure | HIGH |
| `browser_disconnect` | Disconnect | Infrastructure | LOW |
| `browser_screenshot` | Take screenshot | Utility | MEDIUM |
| `browser_status` | Check status | Query | LOW |
| `get_performance_metrics` | Timing data | Internal | LOW |
| `search_assets` | Search SVG repos | Utility | MEDIUM |
| `import_asset` | Import asset | Utility | MEDIUM |
| `p5_draw` | Execute p5.js code | Advanced | LOW |
| `execute_custom_code` | Run custom JS | Advanced/Dangerous | LOW |
| `register_item` | Register existing item | Internal | LOW |

---

## Summary: Tools by Priority

### CRITICAL - Must Test First (10 tools)
These are the core tools that will be used in 80% of requests:

1. `create_item` - Everything starts here
2. `modify_item` - Changing things
3. `add_relation` - Behavioral animation
4. `animate` - Simple animations
5. `load_map` - Map visualizations
6. `highlight_regions` - Map coloring
7. `create_diagram_shape` - Diagrams
8. `connect` - Diagram connections
9. `execute_generator` - Backgrounds
10. `set_background_color` - Basic setup

### IMPORTANT - Test Second (15 tools)
1. `batch_create` - Efficiency
2. `keyframe_animate` - Complex animation
3. `camera_zoom` / `camera_pan` - Viewport
4. `apply_animated_mask` - Reveal effects
5. `apply_data_colors` - Choropleth maps
6. `add_marker` - Map markers
7. `auto_layout` - Diagram arrangement
8. `apply_effect` - Sparkle/blast
9. `search_assets` / `import_asset` - Asset library
10. `browser_connect` - Infrastructure
11. `agent_start_job` / `agent_end_job` - Agent flow

### CONSIDER HIDING (30+ tools)
Query/utility tools that clutter the list:
- All `get_*` query tools (10+)
- All `font_*` tools (16) - move to separate namespace
- Map utilities (15+): export, import, select, deselect, etc.
- Camera utilities: reset, stop, state
- Mask query tools (4)

### CONSIDER REMOVING/MERGING (5-10 tools)
- `camera_zoom` + `camera_pan` + `camera_move_to` → `camera_control`
- `execute_custom_code` - dangerous, rarely needed
- Obscure relations: `circumscribes`, `wave_through`

---

## Recommended Test Plan

### Phase 1: Core Tools (Week 1)

| Test ID | User Prompt | Expected Tools | Success Criteria |
|---------|-------------|----------------|------------------|
| T001 | "Create red text saying HELLO" | create_item | Text appears, red color |
| T002 | "Create a blue circle in the center" | create_item | Circle appears, blue, centered |
| T003 | "Make the text bigger" | modify_item | Text size increases |
| T004 | "Delete the circle" | delete_item | Circle removed |
| T005 | "Create 5 stars in a row" | batch_create OR create_grid | 5 stars appear in row |
| T006 | "Make the text pulse" | animate | Text pulses |
| T007 | "Make the text spin" | animate | Text rotates |
| T008 | "Add a sunburst background" | execute_generator | Sunburst appears |
| T009 | "Set background to dark blue" | set_background_color | Background changes |
| T010 | "Make earth orbit the sun" | add_relation (orbits) | Orbital motion |

### Phase 2: Relations (Week 2)

| Test ID | User Prompt | Expected Tools | Success Criteria |
|---------|-------------|----------------|------------------|
| T011 | "Make the label follow the player" | add_relation (follows) | Label follows |
| T012 | "Attach the hat to the character" | add_relation (attached_to) | Hat moves with character |
| T013 | "Make the arrow point at the target" | add_relation (points_at) | Arrow rotates to face target |
| T014 | "Keep the player inside the box" | add_relation (bounds_to) | Player bounded |
| T015 | "Make the ball bounce" | animate OR add_relation? | Ball bounces |

### Phase 3: Maps (Week 3)

| Test ID | User Prompt | Expected Tools | Success Criteria |
|---------|-------------|----------------|------------------|
| T016 | "Create a USA map" | load_map | USA map appears |
| T017 | "Highlight California in red" | highlight_regions | CA highlighted |
| T018 | "Color states by this data" | apply_data_colors | Choropleth works |
| T019 | "Add a marker on New York City" | add_marker | Marker appears |
| T020 | "Create a world map" | load_map | World map appears |

### Phase 4: Diagrams (Week 4)

| Test ID | User Prompt | Expected Tools | Success Criteria |
|---------|-------------|----------------|------------------|
| T021 | "Create a flowchart: Start → Process → End" | create_diagram_shape + connect | Flowchart appears |
| T022 | "Create a decision diamond" | create_diagram_shape | Diamond shape |
| T023 | "Connect A to B with an arrow" | connect | Arrow connection |
| T024 | "Auto-arrange the diagram" | auto_layout | Items arranged |
| T025 | "Create a UML class diagram" | create_diagram_shape (uml-class) | Class box appears |

### Phase 5: Complex Scenarios (Week 5)

| Test ID | User Prompt | Expected Tools | Success Criteria |
|---------|-------------|----------------|------------------|
| T026 | "Create a solar system animation" | Multiple: create_item × 3, add_relation × 2 | Working solar system |
| T027 | "Create an infographic about climate" | create_scene OR multiple tools | Coherent infographic |
| T028 | "Create an animated logo" | create_item + animate + apply_effect | Animated logo |
| T029 | "Create a process flowchart with 5 steps" | Diagram tools | Complete flowchart |
| T030 | "Visualize US election results" | Map tools | Colored US map |

---

## Test Recording Template

For each test, record:

```markdown
## Test T00X: [User Prompt]

**Date:** YYYY-MM-DD
**Tester:** [Name]
**LLM:** Claude Desktop / GPT-4 / etc.

### Input
User prompt: "[exact prompt]"

### Expected
- Tools: [list expected tools]
- Outcome: [what should appear]

### Actual
- Tools called: [what LLM actually called]
- Outcome: [what actually happened]
- Errors: [any errors]

### Result
- [ ] SUCCESS
- [ ] PARTIAL (worked but not ideal)
- [ ] FAILURE

### Notes
[Any observations about why it worked/failed]

### Recommendations
[Suggested improvements to tool descriptions or design]
```

---

## Key Questions to Answer Through Testing

1. **Tool Discovery:** Does the LLM find the right tool for the user's intent?
2. **Parameter Accuracy:** Does the LLM pass correct parameters?
3. **Multi-Step Sequences:** Can the LLM chain tools correctly?
4. **Error Recovery:** What happens when a tool fails?
5. **Ambiguity Resolution:** When multiple tools could work, which does LLM pick?

---

## Appendix: Full Tool List by Category

### Core Items (6)
- pinepaper_create_item
- pinepaper_modify_item
- pinepaper_delete_item
- pinepaper_batch_create
- pinepaper_batch_modify
- pinepaper_create_grid

### Special Shapes (2)
- pinepaper_create_glossy_sphere
- pinepaper_create_diagonal_stripes

### Scene (2)
- pinepaper_create_scene
- pinepaper_export_scene

### Relations (4)
- pinepaper_add_relation
- pinepaper_remove_relation
- pinepaper_query_relations
- pinepaper_register_custom_relation

### Animation (3)
- pinepaper_animate
- pinepaper_keyframe_animate
- pinepaper_play_timeline

### Camera (7)
- pinepaper_camera_animate
- pinepaper_camera_zoom
- pinepaper_camera_pan
- pinepaper_camera_move_to
- pinepaper_camera_reset
- pinepaper_camera_stop
- pinepaper_camera_state

### Mask (7)
- pinepaper_apply_animated_mask
- pinepaper_apply_custom_mask
- pinepaper_remove_mask
- pinepaper_get_animatable_properties
- pinepaper_get_available_easings
- pinepaper_get_mask_types
- pinepaper_get_mask_animations

### Font (16)
- pinepaper_font_show_studio
- pinepaper_font_set_name
- pinepaper_font_get_required_chars
- pinepaper_font_get_status
- pinepaper_font_create_glyph
- pinepaper_font_create_space
- pinepaper_font_remove_glyph
- pinepaper_font_set_metrics
- pinepaper_font_export
- pinepaper_font_load_into_document
- pinepaper_font_export_data
- pinepaper_font_import_data
- pinepaper_font_clear
- pinepaper_font_remove_overlap
- pinepaper_font_correct_direction
- pinepaper_font_cleanup_path

### Generators (2)
- pinepaper_execute_generator
- pinepaper_list_generators

### Effects (2)
- pinepaper_apply_effect
- pinepaper_add_filter

### Diagrams (9)
- pinepaper_create_diagram_shape
- pinepaper_connect
- pinepaper_connect_ports
- pinepaper_add_ports
- pinepaper_auto_layout
- pinepaper_get_diagram_shapes
- pinepaper_update_connector
- pinepaper_remove_connector
- pinepaper_diagram_mode

### Maps (21)
- pinepaper_load_map
- pinepaper_highlight_regions
- pinepaper_unhighlight_regions
- pinepaper_apply_data_colors
- pinepaper_add_marker
- pinepaper_add_map_labels
- pinepaper_pan_map
- pinepaper_zoom_map
- pinepaper_export_map
- pinepaper_import_custom_map
- pinepaper_get_region_at_point
- pinepaper_animate_map_regions
- pinepaper_animate_map_wave
- pinepaper_stop_map_animations
- pinepaper_get_animated_map_regions
- pinepaper_export_map_region_csv
- pinepaper_import_map_region_csv
- pinepaper_select_map_regions
- pinepaper_deselect_map_regions
- pinepaper_get_highlighted_map_regions
- pinepaper_export_map_geojson
- pinepaper_export_original_map_geojson
- pinepaper_get_map_source_info

### Agent Flow (6)
- pinepaper_agent_start_job
- pinepaper_agent_end_job
- pinepaper_agent_reset
- pinepaper_agent_batch_execute
- pinepaper_agent_export
- pinepaper_agent_analyze

### Triggers (3)
- pinepaper_add_trigger
- pinepaper_remove_trigger
- pinepaper_query_triggers

### Quiz (3)
- pinepaper_create_quiz
- pinepaper_get_quiz_state
- pinepaper_reset_quiz

### Letter Collage (3)
- pinepaper_create_letter_collage
- pinepaper_animate_letter_collage
- pinepaper_get_letter_collage_options

### Canvas/Utility (8)
- pinepaper_get_items
- pinepaper_get_relation_stats
- pinepaper_set_background_color
- pinepaper_set_canvas_size
- pinepaper_get_canvas_size
- pinepaper_get_canvas_presets
- pinepaper_clear_canvas
- pinepaper_refresh_page

### Import/Export (5)
- pinepaper_import_svg
- pinepaper_export_svg
- pinepaper_export_training_data
- pinepaper_search_assets
- pinepaper_import_asset

### Browser (4)
- pinepaper_browser_connect
- pinepaper_browser_disconnect
- pinepaper_browser_screenshot
- pinepaper_browser_status

### Advanced (3)
- pinepaper_p5_draw
- pinepaper_execute_custom_code
- pinepaper_register_item

### Metrics (1)
- pinepaper_get_performance_metrics
