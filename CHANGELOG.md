# Changelog

<!-- Counts here are FROZEN at what was true for the release they sit under, and
     are deliberately NOT guarded against the current code. README counts are —
     see readme-design-parity.test.ts — because the README describes today. A
     changelog describes a day that has passed: after 1.6.9 adds a tool, the
     1.6.8 entry should still read 151. Do not extend the parity guard here. -->


## Version 1.6.8 (2026-09-18)

First release since 1.6.6. 1.6.7 was the accumulation version and was never
published, so everything below lands at once: 16 new tools (135 → 151), and a
set of parity guards that exist because most of these features drifted from the
engine at least once while being built.

### The headline: long-form export

Video exports used to cross the browser bridge as a single base64 string in one
`page.evaluate` return value. That ceiling — not the MCP response size, which is
what we assumed for a while — is why anything past about a minute failed.
Exports now land in the engine's export store and are read back in chunks.
`VIDEO_MAX_DURATION_S` goes 60 → **600**.

- `pinepaper_read_export_chunk` / `pinepaper_release_export` — paged retrieval.
- mp4/webm route through `app.exportEngine.exportToStore` and return
  `retained: true` with an `exportId`.
- A studio without `exportToStore` still works: it takes the buffered path and
  now says so **by name** rather than failing opaquely. Inline delivery is
  capped at 96MB.

### New tools

`pinepaper_character`, `pinepaper_design_medium`, `pinepaper_design_system`,
`pinepaper_flip`, `pinepaper_import_motion_capture`, `pinepaper_interchange`,
`pinepaper_motion`, `pinepaper_path`, `pinepaper_query_capabilities`,
`pinepaper_scene_graph`, `pinepaper_sequence`, `pinepaper_sound`,
`pinepaper_stick`, `pinepaper_stagger`, `pinepaper_story`,
`pinepaper_text_effect`.

- **Path ops** — booleans, simplify, outline-stroke: the destructive operations.
- **Interchange** — Lottie, GLB, BVH, PNG sequence. The formats other tools read.
- **Sound** — synthesis, where the waveform and the drawing are one object.
- **Design systems** — 21 systems, 31 styles (18 composable), 27 easings.
  Vendored from mcp-cloud by `scripts/sync-design-systems.mjs`; they live on the
  tool surface rather than in the engine because they are knowledge an LLM uses
  to compose a scene, not machinery the canvas needs to draw one.
- **World3D** — 44 actions now: mesh authoring from canvas paths, real-geometry
  import, navigation, physics, line of sight.
- **Capabilities** — `query_capabilities { action: 'studio' }` probes 192
  required and 13 optional engine methods in one call, instead of discovering a
  too-old studio one failing tool at a time. The list is *derived from the
  emitters' own guards* by `scripts/sync-engine-methods.mjs`, so it cannot drift
  from what the code actually checks.

### Fixes

- **Character animation was offset from the figure it animated.** Keyframe
  tracks were written in one coordinate convention and the placed item in
  another; measured jump 19.6px → 0.000000px.
- **Concept inheritance** took channels from the concept instead of its
  ancestry, and keyed ink on the wrong ancestor.
- **The preflight gate was narrower than the engine** — `generatorName`
  accepted 64 of 74, so replaying a recipe that used `drawGPUTunnel` was
  rejected by our own validator. Generators 64 → 74, effects 22 → 23.
- **Four enums had silently drifted** from the engine. Each is now diffed
  against the engine's *published* table in a fixture test, not a scrape — the
  stitch list was first built by scraping quoted strings, which invented eight
  names that error and dropped two that work.
- **Instruction bugs that closed shipped doors.** The server description said
  "NEVER generate HTML or React" while shipping an HTML exporter and a React
  exporter, and that string is the first text a client shows a model. Same shape
  in `agent_start_job`. The rule is substitution, not format, and a test now
  sweeps every served surface — resources, prompts, all three verbosity tiers,
  manifest, README — for prohibitions that rule out a capability.
- `pinepaper_create_stitchcraft` **removed**: all six presets were redundant
  with `design_medium { action: 'apply_thread' }`, which gained the six knobs
  they were hiding.
- Two production advisories resolved (fast-uri HIGH, hono MODERATE); both now 0.

### Known limits

- Long-form export needs a studio carrying `exportToStore`. Older studios take
  the buffered path and say so by name.
- Design systems and the two character modules are vendored from mcp-cloud, so
  they can drift. `check:design` and `check:character` catch it, but only where
  that repo is checked out — which in practice means at publish time.

<!-- Versions before 1.6.8 were recorded in an internal file that was not
     published. They are kept below verbatim rather than rewritten. -->

## Version 1.5.0 (2024-12-27)

### New Features

- **Agent Flow Mode** - Optimized for content automation pipelines
  - `pinepaper_agent_start_job` - Start content creation job session
  - `pinepaper_agent_end_job` - End job with summary and export recommendations
  - `pinepaper_agent_reset` - Quick canvas reset without page refresh (~10x faster)
  - `pinepaper_agent_batch_execute` - Execute multiple operations in single call
  - `pinepaper_agent_export` - Smart export with platform auto-detection
  - `pinepaper_agent_analyze` - Analyze content for export recommendations

- **Interactive Triggers** - Event-driven interactions
  - `pinepaper_add_trigger` - Add click, hover, drag triggers with actions
  - `pinepaper_remove_trigger` - Remove triggers from items
  - `pinepaper_query_triggers` - Query existing triggers

- **Quiz/LMS Integration** - Interactive assessments with SCORM/xAPI
  - `pinepaper_create_quiz` - Create quizzes with multiple question types
  - `pinepaper_get_quiz_state` - Get score, progress, answers
  - `pinepaper_reset_quiz` - Reset quiz to initial state
  - Question types: multiple-choice, drag-drop, matching, sequencing, hotspot

- **Widget Export** - Embeddable components for websites and LMS
  - `pinepaper_export_widget` - Export as web-component, iframe, React, Vue
  - LMS support with SCORM/xAPI tracking
  - Responsive and fixed sizing options

### Platform Presets

New smart export targets:
- Instagram (1080x1080, PNG/MP4)
- Instagram Story (1080x1920, PNG/MP4)
- TikTok (1080x1920, MP4 60fps)
- YouTube (1920x1080, MP4)
- YouTube Thumbnail (1280x720, PNG)
- Twitter (1200x675, PNG/GIF)
- LinkedIn (1200x627, PNG/GIF)
- Web (flexible, SVG)
- Print A4/Letter (300dpi, PDF)

### Improvements

- Single browser window enforcement in Puppeteer mode
- Batch operations ~10x faster than individual calls
- Smart content analysis for export recommendations
- Connection validation to detect stale browser sessions

---

## Version 0.2 (In Development)

### New Features

- **Scene Manager** - Multi-scene presentations with transitions
- **Decorative Registry** - Track non-interactive background elements
- **Image Tools Manager** - Multi-image library with cropping and masking
- **Filter System** - Scene-wide visual effects
- **Relation System** - Behavior-driven animations
- **Worker Pool** - Offload heavy computations

### Improvements

- Multi-image upload support
- Image library with thumbnails
- Docsify-based documentation
- Enhanced keyframe animation system
- Better canvas resize handling

### API Additions

```javascript
// Image Tools
app.imageTools.uploadImage(file)
app.imageTools.placeImage(id, options)
app.imageTools.getLibrary()

// Relations
app.addRelation(fromId, toId, type, params)
app.removeRelation(fromId, toId, type)
app.getRelations(itemId)

// Filters
app.filterSystem.addFilter('grayscale', { intensity: 1 })
app.filterSystem.removeFilter('grayscale')

// Scene Manager
app.sceneManager.createScene(name)
app.sceneManager.loadScene(id)
app.sceneManager.listScenes()
```

---

## Version 0.1

### Features

- Canvas-based animation editor
- Text and shape creation
- Basic animations (pulse, rotate, bounce, fade, wobble, slide)
- Background generators (sunburst, sunset, grid, waves, circuit)
- Freehand drawing tool
- Arrow system with animated bolts
- Video export (WebM)
- Animated SVG export
- Template system
- Undo/redo history

### API

```javascript
// Core
app.create({ type, ...options })
app.modify(item, options)
app.deleteSelected()  // Remove selected items
app.animate(item, { animationType, animationSpeed })

// Export
app.exportAnimatedSVG()
app.startRecording()
app.stopRecording()

// Generators
app.executeGenerator(name, params)

// Effects
app.applyEffect(item, type, config)
```
