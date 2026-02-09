# MCP Tool Testing Checklist

> Simple checklist for testing PinePaper MCP tools with Claude Desktop

## Setup

1. Open Claude Desktop with PinePaper MCP server configured
2. Open PinePaper Studio in browser: https://pinepaper.studio/editor
3. For each test, start fresh (clear canvas or refresh)

---

## Phase 1: Basic Creation (10 tests)

### T01: Create Text
**Say:** "Create red text saying HELLO"

- [ ] Tool called: `create_item`
- [ ] Text appears on canvas
- [ ] Text is red
- [ ] Text says "HELLO"

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T02: Create Shape
**Say:** "Create a blue circle in the center"

- [ ] Tool called: `create_item`
- [ ] Circle appears
- [ ] Circle is blue
- [ ] Circle is centered

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T03: Modify Item
**Say:** "Make the text bigger" (after T01)

- [ ] Tool called: `modify_item`
- [ ] Text size increased

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T04: Delete Item
**Say:** "Delete the circle" (after T02)

- [ ] Tool called: `delete_item`
- [ ] Circle removed

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T05: Multiple Items
**Say:** "Create 5 yellow stars in a row"

- [ ] Tool called: `batch_create` or `create_grid` or multiple `create_item`
- [ ] 5 stars appear
- [ ] Stars are yellow
- [ ] Stars are in a row

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T06: Simple Animation
**Say:** "Make the text pulse"

- [ ] Tool called: `animate`
- [ ] Text pulses (scales up/down)

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T07: Rotation Animation
**Say:** "Make the circle spin"

- [ ] Tool called: `animate`
- [ ] Circle rotates continuously

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T08: Background Generator
**Say:** "Add a sunburst background"

- [ ] Tool called: `execute_generator`
- [ ] Sunburst pattern appears

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T09: Background Color
**Say:** "Set the background to dark blue"

- [ ] Tool called: `set_background_color`
- [ ] Background changes to dark blue

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T10: Canvas Size
**Say:** "Make the canvas 1920 by 1080"

- [ ] Tool called: `set_canvas_size`
- [ ] Canvas resizes to 1920x1080

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

## Phase 2: Relations & Behavior (5 tests)

### T11: Orbit Relation
**Say:** "Create a yellow circle as the sun, and a blue circle as earth. Make earth orbit the sun."

- [ ] Both circles created
- [ ] Tool called: `add_relation` with type `orbits`
- [ ] Earth moves in circular path around sun

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T12: Follow Relation
**Say:** "Create a red square called 'player' and a small text label. Make the label follow the player."

- [ ] Both items created
- [ ] Tool called: `add_relation` with type `follows`
- [ ] Label moves toward player position

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T13: Attached Relation
**Say:** "Create a character (circle) and a hat (triangle above it). Attach the hat to the character."

- [ ] Both items created
- [ ] Tool called: `add_relation` with type `attached_to`
- [ ] Hat maintains fixed offset from character

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T14: Points At Relation
**Say:** "Create an arrow and a target. Make the arrow always point at the target."

- [ ] Both items created
- [ ] Tool called: `add_relation` with type `points_at`
- [ ] Arrow rotates to face target

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T15: Bounce Animation
**Say:** "Make the ball bounce up and down"

- [ ] Tool called: `animate` with type `bounce` OR `add_relation`
- [ ] Ball bounces vertically

**Result:** PASS / PARTIAL / FAIL

**Which tool did it use?** _____________________

**Notes:** _____________________

---

## Phase 3: Maps (5 tests)

### T16: Load USA Map
**Say:** "Create a map of the United States"

- [ ] Tool called: `load_map`
- [ ] USA map appears with all states

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T17: Highlight States
**Say:** "Highlight California and Texas in red"

- [ ] Tool called: `highlight_regions`
- [ ] CA and TX are highlighted red

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T18: World Map
**Say:** "Create a world map"

- [ ] Tool called: `load_map` with mapId `world`
- [ ] World map appears

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T19: Add Map Marker
**Say:** "Add a red marker on New York City"

- [ ] Tool called: `add_marker`
- [ ] Marker appears at NYC location

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T20: Color by Data
**Say:** "Color the states: California=blue, Texas=red, Florida=green"

- [ ] Tool called: `apply_data_colors` or `highlight_regions`
- [ ] States colored correctly

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

## Phase 4: Diagrams (5 tests)

### T21: Create Flowchart Shape
**Say:** "Create a flowchart with a Start terminal, then a Process box, then an End terminal"

- [ ] Tool called: `create_diagram_shape` (multiple times)
- [ ] Start terminal appears (rounded rectangle)
- [ ] Process box appears (rectangle)
- [ ] End terminal appears

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T22: Connect Shapes
**Say:** "Connect Start to Process, then Process to End with arrows"

- [ ] Tool called: `connect`
- [ ] Arrows connect the shapes

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T23: Decision Diamond
**Say:** "Add a decision diamond with the question 'Is it valid?'"

- [ ] Tool called: `create_diagram_shape` with type `decision`
- [ ] Diamond shape appears with text

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T24: Auto Layout
**Say:** "Automatically arrange the diagram"

- [ ] Tool called: `auto_layout`
- [ ] Shapes rearranged neatly

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T25: UML Class
**Say:** "Create a UML class diagram for a User class with name and email properties"

- [ ] Tool called: `create_diagram_shape` with type `uml-class`
- [ ] Class box appears with properties

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

## Phase 5: Complex Scenarios (5 tests)

### T26: Solar System
**Say:** "Create an animated solar system with the sun in the center, earth orbiting it, and the moon orbiting earth"

- [ ] Sun created (yellow circle)
- [ ] Earth created (blue circle)
- [ ] Moon created (gray circle)
- [ ] Earth orbits sun
- [ ] Moon orbits earth
- [ ] Animation works

**Tools called:** _____________________

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T27: Animated Logo
**Say:** "Create an animated logo with the text 'BRAND' that pulses and has sparkles"

- [ ] Text created
- [ ] Pulse animation applied
- [ ] Sparkle effect applied

**Tools called:** _____________________

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T28: Infographic
**Say:** "Create a simple infographic showing 3 steps: Research, Design, Build - as a horizontal process flow"

- [ ] 3 items/shapes created
- [ ] Connected or arranged horizontally
- [ ] Labels visible

**Tools called:** _____________________

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T29: USA Election Map
**Say:** "Create a USA map and color it for an election: make California, New York, and Illinois blue; Texas, Florida, and Ohio red"

- [ ] USA map loaded
- [ ] States colored correctly

**Tools called:** _____________________

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

### T30: Reveal Effect
**Say:** "Create text saying 'WELCOME' and add a reveal effect that wipes from left to right"

- [ ] Text created
- [ ] Mask/reveal effect applied
- [ ] Wipe animation works

**Tools called:** _____________________

**Result:** PASS / PARTIAL / FAIL

**Notes:** _____________________

---

## Summary

### Results Tally

| Phase | Pass | Partial | Fail |
|-------|------|---------|------|
| Phase 1: Basic | /10 | /10 | /10 |
| Phase 2: Relations | /5 | /5 | /5 |
| Phase 3: Maps | /5 | /5 | /5 |
| Phase 4: Diagrams | /5 | /5 | /5 |
| Phase 5: Complex | /5 | /5 | /5 |
| **TOTAL** | /30 | /30 | /30 |

### Common Issues Observed

_List any patterns you noticed:_

1. _____________________
2. _____________________
3. _____________________

### Tools That Failed Most Often

1. _____________________
2. _____________________
3. _____________________

### Recommendations

_Based on testing, what should be fixed?_

1. _____________________
2. _____________________
3. _____________________

---

## Quick Reference: Expected Tools

| Action | Expected Tool |
|--------|---------------|
| Create text/shape | `create_item` |
| Change properties | `modify_item` |
| Remove item | `delete_item` |
| Create many items | `batch_create` |
| Simple animation | `animate` |
| Orbit/follow behavior | `add_relation` |
| Load map | `load_map` |
| Color map regions | `highlight_regions` or `apply_data_colors` |
| Create flowchart shape | `create_diagram_shape` |
| Connect diagram items | `connect` |
| Arrange diagram | `auto_layout` |
| Background pattern | `execute_generator` |
| Background color | `set_background_color` |
| Add reveal/mask | `apply_animated_mask` |
| Add sparkles | `apply_effect` |
