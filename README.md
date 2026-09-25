# PinePaper MCP Server

> Create animated vector graphics with AI using the Model Context Protocol

[![npm version](https://badge.fury.io/js/%40pinepaper.studio%2Fmcp-server.svg)](https://www.npmjs.com/package/@pinepaper.studio/mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**English** · [简体中文](README.zh-CN.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Português (BR)](README.pt-BR.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [हिन्दी](README.hi.md)

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="assets/brand/pinepaper-lockup-horizontal-white.svg">
    <img src="assets/brand/pinepaper-lockup-horizontal.svg" alt="PinePaper" width="360">
  </picture>
  <br>
  <img src="assets/edit-whenever.svg" alt="Generate once. Edit whenever. — animated PinePaper poster: the headline assembles from scatter, a color wave runs through every letter, and 'generate twice / thrice' get struck out before 'once' is highlighted" width="720">
</p>

<p align="center">
  <b>The animation engine agents can drive.</b><br>
  This poster is one 16&nbsp;KB SVG — 100+ animations, no scripts. View source on it.<br><br>
  <a href="https://pinepaper.studio/?utm_source=github&utm_medium=readme&utm_campaign=launch_pinned&utm_content=hero">Try PinePaper Studio</a> ·
  <a href="https://pinepaper.studio/docs?utm_source=github&utm_medium=readme&utm_campaign=launch_pinned&utm_content=docs">Docs</a> ·
  <a href="https://www.npmjs.com/package/@pinepaper.studio/mcp-server">npm</a>
</p>

*Everything above and below moves — these are animated SVGs exported straight from PinePaper tool calls, no video files, no GIFs. Open this README on GitHub and watch.*

## Overview

PinePaper MCP Server enables AI assistants to create and animate graphics in [PinePaper Studio](https://pinepaper.studio) via the Model Context Protocol (MCP). Works with any AI that supports MCP tool calling (Claude, GPT, Gemini, local models, etc.).

The server exposes **154 tools** across drawing, animation, diagrams, maps, typography, physics, image editing, data visualization, and export. Using natural language, you can:

- Create geometric shapes, text collages, diagrams, and data charts
- Apply 37+ character-level text effects and 28+ vertex deformation presets
- Wire behavioral relationships between objects (orbit, follow, point-at, mirror, parallax, morph)
- Animate with keyframes, timeline sequencing, and physics simulations
- Build interactive widgets with click/hover/drag event bindings
- Export to SVG, self-contained interactive HTML, MP4, and animated formats

## Running it: local or hosted

**Local is free and complete.** Every one of the 154 tools works when you run
this server yourself. There is no reduced tier and nothing held back.

What it needs:

| | |
|---|---|
| Node | 18 or newer |
| Disk | With Puppeteer (below), Chrome is downloaded on install — roughly **320 MB** per version |
| Memory | a Chrome process plus the Studio canvas, so budget ~1 GB while a job runs |

That is fine on a laptop and awkward on a small VPS, a locked-down work machine,
or a container you would rather keep thin.

**[cloud.pinepaper.studio](https://cloud.pinepaper.studio) runs the same server
for you** — same tools, same version, over HTTP with no install and no browser
on your machine. It exists for three cases: you have no MCP client, you cannot
install one, or your machine cannot spare the browser.

Hosting costs money, so the hosted option is paid — it runs on credits. See
[cloud.pinepaper.studio](https://cloud.pinepaper.studio) for current pricing. Run it
locally if you can, but it is not identical, and the differences run both ways.

The hosted service runs a tested set of LLMs, repairs generated code before it
reaches the canvas — which a local server structurally cannot do for itself —
and **encodes video server-side**, in an ffmpeg container that owns the job
durably. Locally, an export runs in your own browser: it needs Chrome and
Puppeteer, it is bounded by your machine, and a long render occupies that
browser for its duration.

What the local server has instead is the whole tool surface. Tools that need
the editor's UI — selection, drag-and-drop, mode toggles — work here against a
visible browser and are excluded from headless operation. Which model to trust is a
question you can answer yourself rather than take on trust: a benchmark runs one
prompt across several models and puts the results side by side, any run
shareable. It is in invite-only beta.

### Quick start

Puppeteer is an **optional** install, so a plain `npx @pinepaper.studio/mcp-server`
has no browser: every tool then returns the code it would run instead of running
it (the result says so). To execute in a real browser, install Puppeteer **in the
same `npx` call** — a separate `npm i puppeteer` in your project is not visible to
`npx`'s copy of the server:

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "-p", "puppeteer", "-p", "@pinepaper.studio/mcp-server", "pinepaper-mcp"]
    }
  }
}
```

For code-only use (no Chrome, no 320 MB download), use
`"args": ["-y", "@pinepaper.studio/mcp-server"]` and set
`"env": { "PINEPAPER_EXECUTION_MODE": "code" }`. A global install works too:
`npm i -g @pinepaper.studio/mcp-server puppeteer`, then `"command": "pinepaper-mcp"`.

## Made with tool calls

<p align="center"><img src="assets/hero.svg" width="720" alt="Animated vector graphics, made by tool calls — a tool call on the left runs and becomes a curve drawing itself on the right, composed with PinePaper Studio"></p>

Every graphic below is an animated SVG produced through this server's tool surface — the arguments shown with each result are what an AI agent passes to the named tool. They aren't shell commands; **[Run these yourself](#run-these-yourself)** below shows the three ways to execute them.

<!-- Stacked (image then code) rather than a two-column table so the SVGs render on
     mobile — GitHub keeps HTML tables two-column on narrow screens, which squeezes
     the image column to nothing. -->

<p align="center"><img src="assets/poster-sunburst.svg" width="360" alt="The graph is the animation — canvas view above, typed-edge graph below"></p>

```js
// The scene IS a graph: two items, two declared edges —
// the canvas view and the graph view are the same data.
{ "sourceId": "$dot",
  "relationType": "moves_along_path",
  "relationOptions": { "path": "$p1",   // an ellipse path
    "duration": 6, "easing": "easeInOut", "loop": true } }
{ "itemId": "$square", "animationType": "rotate",
  "options": { "speed": 0.18 } }
```

<p align="center"><img src="assets/easing-splashes.svg" width="420" alt="Five easing curves compared on vertical rails"></p>

```js
// Five rails, five named easings, one loop — each dot is
// a moves_along_path down its rail with a different easing
for (const easing of ['linear', 'easeIn', 'easeOut',
                      'easeInOut', 'pingpong']) {
  add_relation($dot, 'moves_along_path', {
    equation: { kind: 'parametric', xExpr: '0', yExpr: 't',
                min: -1, max: 1, scale: 58 },
    duration: 2.6, easing, loop: true });
}
```

<p align="center"><img src="assets/equation-path.svg" width="420" alt="A dot tracing the rose curve r = cos(2θ)"></p>

```js
// The engine solves the curve; the exporter bakes the
// motion to native SVG keyframes. pinepaper_add_relation:
{ "sourceId": "$dot", "relationType": "moves_along_path",
  "relationOptions": { "equation": {
    "kind": "parametric",
    "xExpr": "cos(2*t)*cos(t)",
    "yExpr": "cos(2*t)*sin(t)",
    "scale": 108, "cx": 280, "cy": 118 },
    "duration": 8, "loop": true } }
```

<p align="center"><img src="assets/live-badge.svg" width="300" alt="LIVE status chip with blinking green dot"></p>

```js
// Status chip: pale panel, slate bar, green dot blinking
{ "itemType": "rectangle", "properties": { "width": 264,
  "height": 72, "fillColor": "#e8eff5" } }
{ "itemType": "circle", "properties": { "radius": 9,
  "fillColor": "#2e9b4e" } }
{ "itemId": "$1", "animationType": "fade",
  "options": { "speed": 1.0 } }   // only the dot blinks
```

All five showcase files (including the banner) live in [`assets/`](assets/) — tiny (4–11 KB), dependency-free, loop forever, and render anywhere SVG renders: GitHub READMEs, docs sites, dashboards, emails that allow SVG. They follow one editorial design system (serif mastheads, hairline rules, slate ink on paper white, framed canvas stages, typed-edge graph diagrams) supplied to the agent as context — share a design guideline with your agent and the tool calls come out on-system.

### Try it interactive

GitHub can't run scripts inside a README, so the interactive demos live in the editor — one click, no install. Each is a shipped template where the **relation graph** does all the state handling (tabs, accordions, menus — no event-handler code):

- [Tabs from relations](https://pinepaper.studio/editor.html?template=tabs-from-relations) — `on_click_fire` + `exclusive_group` + `on_enter_set_visibility`
- [Accordion from relations](https://pinepaper.studio/editor.html?template=accordion-from-relations) — disclosure pairs via `on_event_toggle`
- [Solar system, 4-in-1 tabs](https://pinepaper.studio/editor.html?template=solar-system-tabs) — the state machine driving four scenes
- [Menubar from relations](https://pinepaper.studio/editor.html?template=menubar-from-relations) — WAI-ARIA menubar semantics from the same graph

The same graph drives visuals, keyboard access, and screen-reader roles (WCAG 2.1 AA) — see `pinepaper://docs/relations` from your MCP client.

## Run these yourself

The snippets above are MCP tool-call arguments — they execute when an AI agent invokes the tool. Three ways to make that happen:

**1 · Ask your agent (any MCP client).** With this server [configured](#quick-start), paste a prompt like:

> Create a blue circle and make it ride a diamond-shaped path with easeInOut, looping. Add an orange rotating square beside it. Then export the scene as animated SVG.

Your agent picks the tools (`pinepaper_create_item`, `pinepaper_add_relation`, `pinepaper_export_svg`) and runs them.

**2 · Hand your agent a complete batch.** This is a full, valid `pinepaper_agent_batch_execute` argument — an agent (or an MCP inspector) can execute it verbatim; `$0`/`$1` reference the created items in order:

```json
{
  "operations": [
    { "type": "create", "itemType": "circle",
      "properties": { "x": 300, "y": 260, "radius": 10, "fillColor": "#2e5e8f" } },
    { "type": "relation", "relationType": "moves_along_path", "sourceId": "$0",
      "relationOptions": { "path": [ { "x": 180, "y": 260 }, { "x": 300, "y": 180 },
                                     { "x": 420, "y": 260 }, { "x": 300, "y": 340 } ],
                           "duration": 6, "easing": "easeInOut", "loop": true } },
    { "type": "create", "itemType": "rectangle",
      "properties": { "x": 520, "y": 260, "width": 60, "height": 60, "fillColor": "#f0a030" } },
    { "type": "animate", "itemId": "$1", "animationType": "rotate" }
  ]
}
```

**3 · No MCP, no agent — just a browser.** Open [pinepaper.studio/editor](https://pinepaper.studio/editor.html), open the browser console, and paste (verified working as-is):

```js
const app = window.PinePaper;
const dot = app.create('circle', { x: 300, y: 260, radius: 10, fillColor: '#2e5e8f' });
app.addRelation(dot.data.id, null, 'moves_along_path', {
  path: [ {x:180,y:260}, {x:300,y:180}, {x:420,y:260}, {x:300,y:340} ],
  duration: 6, easing: 'easeInOut', loop: true,
});
const sq = app.create('rectangle', { x: 520, y: 260, width: 60, height: 60, fillColor: '#f0a030' });
app.animate(sq, { animationType: 'rotate' });
```

The same code an agent generates is the code you can paste — the canvas is yours either way, undo included.

## Security: yes, it executes code

**Supply-chain scanners flag this package, and they are not wrong about the mechanism.** Socket and tools like it mark it as malware-adjacent because it evaluates JavaScript at runtime. The detection is correct about the capability and wrong about the intent, so here is exactly what happens.

**Every tool emits JavaScript — that is the architecture, not an exception.** A tool call is compiled into a snippet written against the PinePaper and Paper.js APIs; the snippet is the product. `pinepaper_execute_custom_code` is simply the case where the *agent* writes the snippet instead of the server generating it, which is what lets a model draw something no other tool has a name for. Removing execution would not harden this package, it would delete it.

**Where the code runs.** In a browser page on your own machine, against your own canvas. It does not run in the server process, and nothing is sent anywhere else to be executed.

**Two modes, and one of them never executes anything:**

| Mode | What happens |
|---|---|
| `code` (`PINEPAPER_EXECUTION_MODE=code`) | The tool returns the JavaScript and stops. Nothing runs. You read it and paste it if you want it. |
| `puppeteer` (default) | The server launches Chrome and runs the snippet in the page via `page.evaluate()`. |

If you do not want an agent executing anything, `code` mode is a first-class path, not a degraded one — the same snippet, handed to you instead of run.

**What guards execution.** On current engine builds the snippet goes through `app.runGenerated(code, { source: 'agent' })` — a governor with seeded determinism, loop and item budgets, and a machine-readable report — rather than a bare `eval`. Older engine builds fall back to `eval`.

**What to weigh before running it.**

- Code an agent writes runs with whatever that browser page has. Give this server the same trust you would give anything else you let write and run code on your machine — which is the trust you already extend to an MCP client with tool access.
- Puppeteer mode launches Chrome with `--no-sandbox` and `--disable-setuid-sandbox`. That is routine for headless automation and it does weaken Chrome's own process sandbox. If that matters where you are running it, use `code` mode or put the server in a container.
- Puppeteer itself is an **optional** peer dependency, kept out of the default tree precisely because a headless browser plus an install script is what scanners flag hardest. Install it only if you want the executing mode.

## What's new in 1.6.15

### New: the PinePaper mark

The "origami pine" is the new PinePaper mark. The package now ships it as its
icon (`icon.svg`, `icon.png`), and MCP bundle hosts that read `manifest.json`
show it.

### New: transparent WebM

`pinepaper_agent_export` with `format: "webm"` takes `transparent: true` (and
`alphaQuantizer`, 0–63) for a video with a real alpha channel, where the studio
supports it. The result confirms the alpha stream; if none was written, the
result says so instead of handing back an opaque file.

### New: fonts in multi-page PDFs

A PDF deck (`pdf.pages`) embeds the scene's fonts for its searchable text layer
and reports them in `result.pdf.fonts`. On studios that support it, each page
gets its own scene's fonts. Text hidden at the moment of rendering (outside its
`bornAt` / `ttl` window, or invisible) is named in the result, since it is in
neither the picture nor the text layer.

### Fixed: `npx` setups could never execute in a browser

Puppeteer is an optional install, and under `npx` a separate `npm i puppeteer`
is not visible to the server. The README's new **Quick start** gives the `npx`
configuration that includes it; the error message leads with the same
advice.

### Fixed: text-only properties on shapes

`fontWeight`, `strokePosition` and other text-only properties passed to a
non-text item are reported as not applied again.

## What's new in 1.6.14

Many of the features below rely on newer studio capabilities. Where a studio
lacks one, the result says so — the call never quietly claims what it could
not do.

### New: ads, variants and broadcast deliverables

- **`html5-ad`** export: a display-network zip (`index.html` with the
  `ad.size` meta and a `clickTag` click target — the whole ad or a CTA's box)
  plus a backup PNG beside it. The result checks the zip against a size budget
  (`ad.maxBytes`, default 150 KB) and lists any external requests.
- **`playable`** export: a single-file MRAID playable whose CTA
  (`ad.ctaItemId`) opens the store link through `mraid.open`, leaving the rest
  of the ad interactive.
- **`pinepaper_render_batch`**: one creative per row of data — each row's item
  changes or template params, then an export — with per-row files, warnings and
  failures.
- **`scc`** captions: CEA-608 (broadcast) from the same timed text as SRT / VTT,
  with notes on anything cut, dropped or timed late.
- **`pinepaper_accessibility_check`**: text contrast (WCAG AA) and flashing
  (more than three flashes a second) as a quick screen before delivery.

### New: text that fits its box

- **`fit`** on text (`create_item`, `modify_item`, batch):
  `{maxWidth, maxHeight?, minFontSize?, maxFontSize?, wrap?, hold?}` sizes the
  text to the box, and later content changes refit it — the variant /
  translation workflow. It holds the anchored edge (`top-*` holds the top);
  `fit: null` stops fitting. The result's `textFit` gives the size, line count
  and whether it fits.
- **Overflow in every export.** `fidelity` lists `text_overflow` for text past
  its box or off the frame — the check to run before rendering a batch.
- **`direction`** (`auto` | `ltr` | `rtl`) for Arabic, Hebrew and other RTL
  paragraphs; `auto` is reported with the way it resolved.
- **`tabularFigures`** for counters and prices that should not jitter, and
  **`strokePosition: 'outside'`** for thick caption outlines that keep the
  letterform.
- Weight, italic, line spacing, and fonts from the catalogue or Google Fonts
  (`pinepaper_font` gained a `load` action) now reach the text, loaded before
  it is drawn.

### New: export formats and controls

- **`apng`** — animation with full transparency, for overlays and stickers.
- **`jpg` / `webp`** stills for byte-budgeted ad specs; **`srt` / `vtt`**
  captions from the scene's timed text; **multi-page PDF**, one page per saved
  scene, with a searchable text layer and print options (paper
  size, orientation, bleed, trim marks, dpi).
- **`region`** exports a part of the canvas — carousel slices, sheets of cards.
  A cell leaves out a neighbour's overflowing items and names the items that
  cross its edge.
- **`time`** renders a still at a chosen moment rather than wherever the
  playhead is.
- **GIF** `loop` play count and a `maxBytes` budget (re-encoded smaller, with
  each attempt reported).
- **Broadcast MP4** — `broadcast: true` (BT.709, limited range, constant
  bitrate), `bitrate` / `minBitrate`, and `broadcastHeadroom`. The result
  reports the achieved bitrate and the measured luma; when the file would fail
  broadcast QC, `fidelity` says so and gives the command that fixes it.
- **NTSC rates** (29.97, 59.94, …) with a note when a duration overruns at
  them, and a warning when H.264 rounds an odd side up by a pixel.
- New platform presets `print-a4-landscape` and `print-letter-landscape`.

### New: tools and parameters

- **`pinepaper_lasso`** gained `cut`: cut a subject out along a polygon, no custom code.
- **Generator regions** can be shaped (rounded rect, ellipse, circle, polygon,
  star, or an existing path) and named with `region.id`; the same generator in
  several boxes gives several instances.
- **`modify_item`** takes `skewX` / `skewY` and an affine `matrix` (mockups).
- **Pixel-art rasters** (`smoothing: 'off'`), a **globe `disable`** action,
  **keyed audio gain**, and **widget HTML** `lang`, `dir` and `alt`.
- `bornAt` / `ttl` now work as a visibility window in local renders, so shots
  hand over cleanly on the boundary.
- `serverInfo.version` names the exact build (`1.6.14+<sha>`).

### Fixed: properties that were silently ignored

`create_item` and `modify_item` now name any property they could not act on,
with a suggestion for common misspellings. Beyond that, these used to be
dropped and now work: no-fill (`null` / `'transparent'` / `'none'`), dashes,
caps and joins on every shape, `color` on closed paths, a top-level `anchor`,
path coordinates kept when no position is given, mesh colour on 3D shapes,
`template_params` naming undeclared params, chart data in the documented
shape, and gradients that cannot be read (now refused, not drawn as nothing).

### Fixed: tools that reported success for the wrong thing

- Batch create / modify / execute now behave exactly like their single-item
  tools, with one undo step per batch.
- `moves_along_path` follows the path you name (or refuses); relations to an
  id not on the canvas are refused.
- Uploaded media: the id you are given is the one other tools accept, audio
  levels reach the mix, `data:` and server-side URLs upload in production,
  and clearing the canvas removes uploaded media too.
- A platform preset no longer stretches a canvas of another aspect ratio.
- `camera_animate` no longer claims pitch / yaw as 3D perspective, and its
  `duration` is optional.
- Nine tools' published schemas disagreed with what they accepted; a guard
  now keeps them in step.

### New: a whole music bed in one call

`pinepaper_sound` gained a `sequence` action taking `[{t, spec|preset, note?,
duration?}]`. Every cue used to be its own call — a 112-cue bed cost 112 round
trips — and nothing about the work needed one each. Failures come back by
index, because a bed where three of a hundred cues didn't sound is neither a
success nor a failure.

### Fixed: create_scene drew the wrong shape for six of its ten types

It built shapes itself instead of asking the engine — a hand-written branch per
type covering circle, rectangle, star and text, and **a 30px circle for
everything else**. So `ellipse`, `triangle`, `polygon`, `path`, `line` and
`arc` silently came out as a small blue circle, and any property that branch
didn't name was dropped (which is why an ellipse ignored `width`/`height` while
the same values worked through `agent_batch_execute`).

It now creates items the same way every other tool does, so all 28 item types
work, along with every property they accept. Two related corrections: scene
relations accepted 8 types while the catalogue documented ~90 — following the
documentation failed validation — and scene animations gained `startTime`, so a
scene can be staggered instead of everything moving from frame zero.

### Fixed: layered-character import described the wrong manifest

The docs implied a `layers[]` array; the engine reads `info.parts` keyed by tag.
An array imports nothing. The description also implied `pinepaper_animate`
could blink — only an `expresses` relation drives blink/smile/talk, and asking
`animate` for it is a silent no-op.

### Fixed: PDF export failed on every scene

`pinepaper_agent_export` with `format: "pdf"` died with "parameter 1 is not of
type 'Blob'" — an error naming `FileReader` and nothing about PDFs. The engine
resolves a record `{blob, width, height, format}` and this passed the whole
record where a `Blob` was expected. It now accepts either shape, reports the
page geometry the record carries, and when something really is not a file it
says so about the PDF rather than about `FileReader`.

### Fixed: the validator's own findings were being swallowed

`pinepaper_validate` answers `{success: true, ok: false, diagnostics: [...]}` —
the call worked and the *scene* has problems, which is the whole point of the
tool. An internal guard treated `ok: false` as a tool failure, so the result
became "the studio reported failure without naming a reason" and the
diagnostics were discarded. A refusal that carries diagnostics now names them.

### Changed: export fidelity is always reported

It used to appear only when there was something to lose, so that an empty list
could not be misread as "this format is lossless". That traded one misreading
for a worse one — you could not tell "checked, nothing lost" from "never
checked". All three states are explicit now, and the caveat lives in a note
rather than in the absence.

`pinepaper_agent_export` also points at `pinepaper_capture_frames` as the cheap
way to confirm a scene is actually moving **before** committing to a render.

### Fixed: documentation that described the wrong contract

- **`solveOde` state variables are positional** — `t`, `y0`, `y1`, `y2` …
  matching `initialState`. There is no `x` or `y`, so the natural way to write
  a Lorenz system failed with "Undefined symbol y". The working form is now in
  the description.
- **`moves_along_path` with `params.equation`** only works on the relation's
  signal path. Easing `bounce` is piecewise and leaves that path, which
  silently discards the equation and leaves the item where it started.
- **`grid.blocked` in `pathfind`** is a **mask**, one entry per cell, not a
  list of blocked indices. Both are arrays of numbers, so the wrong one used to
  produce a plausible "no path" instead of an error; the length is now checked.

## What's new in 1.6.13

### Fixed: WebGL was switched off, so every shader feature silently did nothing

The browser was launched with `--disable-gpu`, carried in as a headless
convention. With it, `webgl1` and `webgl2` both report **false** in the page —
so `pinepaper_world3d`, `drawShaderArt`, `drawFormulaArt` and every shader aura
(`liquid_metal`, `caustics`, `heatmap`, `gem_smoke`, `electric_arc`, `vortex`)
could not run. Worse, some of them reported `success: true` and rendered
nothing.

The flag is gone, so Chrome uses the real GPU where there is one, and
`--enable-unsafe-swiftshader` covers machines without: Chrome no longer falls
back to software GL on its own, so without it a headless server gets no WebGL
at all rather than a slow one. Measured on the same machine, only the flags
differing: false/false before, WebGL 1 and 2 both available after.

### Fixed: sixteen parameters that were accepted and then ignored

A stress-test pass across six designs found the same failure repeatedly — a
parameter the schema takes, validates, and drops before it reaches the engine.
All of them now either work or say why not:

- **Choropleth maps** rendered near-black: `colorScale: "greens"` was sent
  where the engine indexes a two-stop `['#from', '#to']` ramp, so it indexed a
  string. `minValue`/`maxValue`/`showLegend` weren't mapped either.
- **Region highlights** came out default blue — the colour was stripped, and
  the engine reads `style.fill`.
- **`pinepaper_map load`** documented an `options` parameter the schema threw
  away, so `{style: "dark"}` never arrived.
- **Mask keyframe `time`** was capped at 0–1 while the engine reads **seconds**
  — a keyframe at 2.0s was a validation error.
- **Animated masks (mode 3)** passed the animation preset where the mask
  *shape* goes, so the keyframes drove the wrong geometry.
- **Sound cues** needed two calls each because `visual.startTime` was stripped;
  one call places a cue now.
- **`text_effect`** gained `startAt` and `hideAfter` — every effect played from
  t=0, so in a multi-shot video they all fired on the opening frame.
- **`import_asset` by URL** is implemented rather than refused.
- **`drawShaderArt`** documented `fragmentSource` without mentioning that it is
  ignored unless you pass `preset: "custom"`, and that the shader is GLSL ES
  3.00 (`in v_uv` / `out outColor`), not `gl_FragColor`.
- **Asset search** showed `[object Object]` as the author, and claimed
  "Various Licenses" for icons whose licence it had simply failed to read.

Where the engine genuinely cannot do the thing, the tool now refuses by name
instead of accepting the parameter and ignoring it: right-to-left text has no
engine support, and a connector id you supply is dropped by the engine, so the
result tells you which id you actually got.

### Fixed: one 3D colour broke every export in the session

`pinepaper_world3d add_object` with `color: "#ef4444"` reported success and
then made **every later MP4 export fail** with a WebGL error, because the
colour goes to a shader uniform that needs three floats. Hex is what every
other tool here takes, so the conversion happens for you now — as does
`[255, 0, 0]`, the other common form.

### Fixed: an unknown item id reported success

`pinepaper_keyframe_animate` on an id that doesn't exist returned success and
animated nothing — the engine warns through a console this tool cannot read.
It now refuses and names the id.

### Fixed: photos could not be imported from a URL at all

1.6.12 stopped an imported image from tainting the canvas, and in doing so made
URL imports impossible on pinepaper.studio. The studio sends
`connect-src 'self' …`, so the page may not fetch any third-party host — the
old code got around this by *loading* the image instead, which is exactly what
tainted the canvas.

The fetch now happens in the MCP server, which has no such restriction, and the
page is handed a `data:` URL. Nothing to fetch, nothing to taint, and the
picture actually arrives. `pinepaper_import_svg` resolves its document the same
way, so embedded remote images are kept rather than dropped.

Large photos are handed over **beside** the generated code rather than inside
it. A 3000×800 image inlined as a data URL made ~630KB of JavaScript, which the
engine's code governor could not rewrite — it gave up and took the return value
with it, so the import reported success with no item id while smaller photos
worked fine.

### Fixed: the caption system was invisible to the agents told to use it

`pinepaper_text_style` and `pinepaper_execute_custom_code` were callable but
absent from `tools/list` in the default toolkit — while `pinepaper_text_effect`,
`pinepaper_design_medium`, `pinepaper_keyframe_animate` and
`pinepaper_execute_generator` all tell an agent to use them. So the whole
15-style caption system was reachable only by someone who already knew the name.
Profiles filter by tag, so these fell out because of the group they belong to,
not because anyone decided they were unnecessary.

The default toolkit now lists everything its own descriptions point at, and
`pinepaper_text_style` accepts `list` as well as `list_styles`, because
`pinepaper_text_effect` spells the same action `list`.

Its description also now carries what a real render found: over photographs,
pass a palette — `chrome`, `cutout` and `glitch` are off-brief at the default
and `neon` needs one on dark images — and `glitch` at 80px monospace overflows
a 1920 canvas at 36 characters.

### Fixed: exports sized by the renderer instead of by your request

Three tools reported a pixel count that came from how the browser happened to
be rendering, not from what you asked for:

- `framing: "camera"` produced **2234×1472** whatever the canvas was — a
  1920×1080 board and a 3840×2160 board both landed there.
- `format: "png"` ignored `platform` completely: both `youtube-thumbnail`
  (1280×720) and `auto` on a 1920×1080 canvas returned **3000×1688**, which is
  the board scaled by 150/96 DPI.
- `pinepaper_agent_end_job` reported the canvas as 2233×1472.

None of those ratios is the device pixel ratio, so the number could not be
divided back out afterwards — which is why it forced ffmpeg and `sips`
workarounds rather than a quick correction. All three now read the canvas size
you set, and PNG reports the dimensions it actually produced.

### Fixed: `size` on an effect is a multiplier, not pixels

Every effect scales from the item's own bounds and `size` multiplies that, so
`size: 30` asks for a disc thousands of pixels across and gets one, reporting
success. Typical values are 1.5 to 3. The parameter was not in the tool's
schema at all, so "pixels" was the only natural reading; it is documented now.

### Fixed: cutout styles and the lasso called into nothing

`pinepaper_cutout_style` called `app.imageTools.applyCutoutStyle`, which has
never existed — so it reported success with the real error nested inside. It
now uses the engine's actual cutout API and resolves the item id first.

`pinepaper_lasso` has no headless form at all: the lasso is a mouse tool whose
extraction is driven by strokes a user draws. It now says so and points at
`pinepaper_extract_object`, instead of failing with
`undefined is not a function`.

### Fixed: results that were too big to read

An error carried the whole generated script in its details — ~12KB of
JavaScript in front of a one-line failure. It now carries the script's size and
a switch (`PINEPAPER_ECHO_CODE=1`) to get it back.

`pinepaper_agent_end_job` returned a 263,000-character screenshot inline, which
is over the tool-result limit of the clients reading it, so an agent could not
read its own verification step. The threshold for saving to a file instead was
set against the bridge's limits rather than the caller's, and is now low enough
that this cannot happen.

### Fixed: map tools that called into nothing

Nine tools called engine methods that have never existed on any studio —
`pan_map`, `zoom_map`, `export_map`, `add_map_labels`, `animate_map_wave`,
region-at-point, history `get_state`, `trigger_action`, and the relation lookup
used by scene analysis. The last one was the quiet one: it was guarded, so it
never threw — it just reported every scene as having **no relations**, always.

Where the engine has the same capability under another name, they now call it.
Where it has no such capability at all — there is no lat/lon pan, no numeric
zoom level, and no region hit test — the tool now says so by name and points at
what does work, instead of failing with `undefined is not a function`.

## What's new in 1.6.12

### Fixed: images could not be imported at all

Two separate bugs meant no photo could be placed into a scene over MCP.

`pinepaper_import_image` failed on **every** URL with a syntax error before it ran — an apostrophe in one of its own error messages closed a string early. And `pinepaper_import_svg` with an external `<image href>` reported success, created nothing, and then broke **every later export** in the session with "Tainted canvases may not be exported", including scenes that never touched the image; only a page reload recovered it.

SVGs now have their remote images fetched and inlined before importing. One that can't be fetched has its element removed and the removal named in `imageWarnings` — a missing picture is visible and recoverable, a tainted canvas is neither.

### Fixed: parameters that were accepted and then ignored

A tool that takes a parameter, validates it, and drops it is worse than one that refuses it, because the caller has no way to tell. This release removes every instance found:

- **Ellipses** took `radiusX`/`radiusY` — the pair documented in this package's own examples — and built the default size instead. They now map to the axes the engine reads.
- **`pinepaper_stick`** accepted eight: `propSide: 'right'` put the prop in the *left* hand (the engine compares against `'L'`/`'R'`), `walk: true` walked nowhere, expression beats keyed `name` were dropped entirely, and `facing` did nothing on a figure — it is now refused by name rather than ignored.
- **`pinepaper_load_map`** accepted seven the engine never reads. Style keys nest under `styles` and are spelled differently there; `enableHover`/`enableClick` are `interactive`/`selectable`.
- **`hoverStroke`** was documented by the engine and implemented nowhere; it now reaches the renderer.

`pinepaper_agent_end_job` also reported the canvas as **2233×1472** for a 1920×1080 artboard — it was reading the backing store, whose ratio to the artboard is not the device pixel ratio and so cannot be divided back out. It reports the artboard now.

### New: `anchor` — say which corner your x/y meant

Position has always been the bounding-box **centre**. Anything that computed a layout box authored the **top-left**, so passing those coordinates displaced every item by half its own size. `anchor: 'top-left'` (also `top-right`, `bottom-left`, `bottom-right`, `center`) states which corner you meant, applied after size and rotation so it uses the item's real box. A misspelled anchor is now refused rather than silently falling back to centre.

### New: figures that act, and exports that tell you what they cost

`pinepaper_stick` gained `gait` (9 named walks — `trudge` leans away from where it's going, `sneak` crouches), `poses` as a track over time, and named `sequence`s. Every valid name is read from the engine's own kit, so the list cannot drift.

Exports now report what **this scene** loses to the format you chose — a PNG of an animated scene is one frame, a GIF drops the soundtrack — on both `estimateOnly` and a real export. It appears only when there is something to lose: its absence is a statement about your scene, not a claim that the format is lossless.

### Fixed: discovery

`pinepaper_list_generators` reported **3 generators when the engine has 74**, and dropped the parameters it promised to list. The batch tool advertised 15 of those 74, so 59 working generators were invisible to anyone reading it. All lists now come from one source.

Loading a template that carries clipped character parts now warns when the studio dropped them, and says not to save over the template — the file is still intact until you do.

### Documentation: shapes described a fraction of what they accept

`triangle` was documented as taking `color` and nothing else, while the engine accepts width, height, and either `kind` (`'right'`, `'equilateral'`, `'obtuse'`…) or exact interior `angles` and builds the triangle by the law of sines. `polygon` accepts an explicit **vertex list** for irregular shapes. `ellipse` and `heart` were `color`-only. Six of the eight speech bubbles take `cornerRadius`. And **every** item type accepts a `label` — a string, or a full config with position, offset, font and colour — so captioning no longer needs a second call and hand-computed coordinates.

Two silent fallbacks are now stated: an angle set the engine rejects gives you the default isosceles with no error, and the vertex-list polygon uses absolute coordinates and ignores `position`.

### Fixed: exporting without naming a platform ignored your canvas

`platform` defaults to `auto`, but `auto` wasn't a real preset — the lookup fell through to the `web` preset, so an export that named no platform silently rendered **800×600** over whatever size your canvas actually was. Measured: three exports of a 960×540 canvas all came back 800×600, which reads from outside as a dimension mismatch with nothing saying the canvas had been replaced.

`auto` now means the canvas's own size, read at export time, with the preset kept only as a fallback for older studios. Naming a platform still uses its preset exactly as before — and `platform` is no longer required, so you can export at your canvas size without picking a preset that overrides it.

### Fixed: `fps` and `scale` were accepted but undiscoverable

Both parameters worked and were documented in the tool's own text, but were missing from the machine-readable schema — which is the only part a model actually reads. So callers were told to use them and had no way to find them. Published now, along with `quality`'s description admitting that it carries a **frame rate** (15/30/60) as well as compression.

### Three design generators are now included

`device-mockup`, `recursive-subdivision` and `textile-weave` existed upstream but had never been copied into the package.

## What's new in 1.6.11

### Fixed: modifying an item could edit a different one

`pinepaper_modify_item` selected an item by id and then edited *the selection*. When the id didn't resolve, the selection didn't change — so the edit landed on whatever was selected before, and the call reported success. It now addresses the item directly and tells you when the id isn't there. The same bug in `pinepaper_agent_batch_execute`'s modify operation is fixed with it.

### Fixed: display text styles drew in the wrong font

Decorative font files are fetched when you hover the style grid in the editor — a gesture no automated caller makes — so a style asking for one of those faces silently drew a fallback and reported success. Styles now load the faces first, and say so when a face still isn't ready instead of leaving it to be discovered in the export.

### Fixed: importing an SVG by URL

The generated code used a top-level `await` outside an async function, which some studio builds refuse to parse — so the import never ran at all on those. It also now reports why a URL failed: a refused connection, an HTTP status, or a response that's a web page rather than an SVG.

### Fixed: three operations that reported success without doing anything

`set_canvas_size` reported the size you asked for even when the studio refused it — an unknown preset or an out-of-range dimension left the canvas untouched. Scene chains' `toggle_loop` called a studio method that has never existed, so a chain built without looping went on not looping. And `pinepaper_get_items` and friends reported `rotation: 0` for items that are visibly rotated.

### Two styles were missing from the catalogue

`embroidery_tapestry` and `woven_textile` existed in the design vocabulary but not in the list the tools return. The list is now derived from the vocabulary itself, so it can't fall behind again.

### `get_animatable_properties` answers for an item

Pass an `itemId` and it reports what *that* item can animate, from the studio's own table — including which properties are **discrete**. `content` and `blendMode` hold their value until the next keyframe rather than blending toward it, and treating `content` as tweenable is what makes a word cascade land half a beat early. Without an `itemId` it still answers the older mask-type question.

### Custom generators, and what registering an item buys you

The tool descriptions now explain the draw contract: you can define a generator as an app method through `pinepaper_execute_custom_code` and invoke it with `app.executeGenerator`, with no registration step at all.

More importantly they explain the decision that registration *is*. `app.registerItem(item, type, props)` is what makes something editable — the person using the studio can click it and change its colour, and tools can modify, animate, keyframe and relate it. An unregistered path is pixels: it renders and exports identically and can never be touched again without redrawing. Built-in generators register some of what they paint and not the rest — `drawSunsetScene` 6 of its 27 objects, `drawPattern` none of 15 — which is a memory trade, and one you make yourself when you write your own generator.

### Corrections to earlier release notes

The 1.6.9 note said letter-collage animation needed a newer studio, and 1.6.10 said the same of the font `check` and `fallbacks` actions. Both studio updates have since shipped, so both work.

## What's new in 1.6.10

### Fixed: the nine diagram tools called an object that does not exist

Every diagram tool — shapes, connectors, ports, auto-layout, diagram mode — called `app.diagramManager`, which has never existed in the studio. All nine failed with "Cannot read properties of undefined", which read as "diagrams are broken" when the studio side was fine. Fixed, along with three argument bugs behind it: shape type is passed separately from its config, `add_ports` takes a port-type name, and auto-layout takes items rather than ids and is awaited.

`update_connector` now applies colour and width directly and **refuses the rest by name**, pointing you at remove-and-recreate. It previously reported success over a connector it had not changed.

### Fixed: six of sixteen font actions

`set_name`, `get_required_chars`, `get_status`, `create_space` and `export` all called renamed methods and failed. `show_studio` now says plainly that opening the panel has no engine entry point — the other fifteen actions work without it.

### Fixed: local image files, and errors that say why

`pinepaper_import_image` now accepts a **local file path** (absolute, relative, or `file://`) as well as http(s) and data URLs. A browser page cannot open `file://`, so the server reads the file and hands the page the data.

Remote failures now report the reason — HTTP status, refused connection, or a URL that returned a web page instead of an image — instead of a bare "Failed to load image from URL".

### Fixed: tools could report success when the work failed

Any tool whose underlying operation failed could return success with the error buried in the payload. A failed operation is now an error. This is the general form of the export fix in 1.6.9, and it covers every tool.

### Fixed: tools failed when called immediately after connecting

Map, physics, rigging, sprite-sheet and Lottie tools could report the studio as too old for a capability it has, if called within the first second or so of connecting. They now wait for the relevant subsystem to finish loading.

### Fixed: `pinepaper_batch_modify`

It passed item ids in the field meant for live items, so every modification was rejected, and then misread the result as a list. It now reports how many items changed and names any it skipped, with the reason.

### Fixed: rigging bone angles were read as radians

`add_bone` and inline poses document degrees, and the solver read the number as radians — so a documented 90° came out as 90 radians and characters came apart on the first pose. Angles are now converted.

Two things the tool never told you, now in its description: a bone angle is **relative to its parent**, and a bone has no position — it starts at its parent's tip, so length and angle are what place it.

### Fixed: `pinepaper_precomp` and `pinepaper_import_mermaid`

`precomp` passed ids where live items were required, and now names any id that does not resolve instead of quietly leaving it out. `import_mermaid` returned raw canvas objects that could not be serialised, so a working import reported a failure; it now returns ids, labels and bounds — and an import that creates nothing is no longer reported as a success.

### Letter-collage animation works again

The animation type was discarded on every call (fixed in 1.6.9) and the studio was skipping the relation that drives it. Both halves are in place. **Needs a studio build from 2026-09-20 or later.**

### Responses are ~90% smaller on batch work

A successful tool call no longer reads your own request back to you. On a 50-item batch create that was 8,740 characters of echoed source against 983 characters of actual result — and it grew with every item you spelled out, which is what made enumerating through tools far more expensive than writing the equivalent loop.

The generated code is still returned where it is the point: `PINEPAPER_EXECUTION_MODE=code`, and every error, which carries the code as evidence. `PINEPAPER_ECHO_CODE=1` restores it everywhere if you are debugging.

### `pinepaper_execute_custom_code` documents the traps

Writing JavaScript opts out of the schema protection tool callers get, and six engine behaviours fail silently when you do: `app.create` returns a numeric Paper.js id where everything else wants the `item.data.registryId` string, an unknown item type creates nothing, `addAnimation` ignores a JSON-string argument and an unresolvable id, keyframes live at `item.data.keyframes`, and `transformOrigin` is ignored so rotation always pivots on the item centre. All six are now in the tool description.

### Three routes you had to find by reading source

- **Text that changes over time.** `content` *is* keyframeable, and it holds rather than tweening — `pinepaper_keyframe_animate` now says so, and points at the cheaper route for a cascade. For a word cascade it points at `app.textSequence(item, words, { interval })`: one item cycling its words in one call, instead of one item per word with opacity tracks faking the cut.
- **Does this survive export?** Answered once, as a rule rather than a per-tool label: if it ticks inside the engine's update loop, it exports — loop animations, relations, keyframes, generators and camera moves all do. Anything driven by the wall clock outside that loop does not. And if exported frames look frozen, check the sampling first: a loop at speed 1 has a one-second period, so frames a whole second apart are identical by design.
- **Bone angles** are sent as degrees *and* radians, so the studio reads the units you meant rather than inferring them.

### Fixed: tools called just after connecting could find a subsystem missing

Two different races wore the same symptom, and only one of them was already handled.

Some subsystems are code-split and arrive about a second after boot; those are now waited for **by name**, which matters because the studio's bulk loader deliberately never fails — waiting on it meant "the prefetch finished", not "the thing I need is here". Others, like Font Studio, are built during startup itself, so no amount of module loading helps them; those now wait for the editor to finish initialising. Both waits are bounded and apply only to calls that actually touch such a subsystem.

### Fixed: unknown font axes were dropped before the studio saw them

`set_font_axes` declared the three standard axes and silently discarded anything else, so asking for an axis the tool didn't name reached the studio as an empty request — which then reported nothing rejected, and the tool reported success over axes that were never applied. Axes are passed through as written now; the studio says which it took and which it did not, including OpenType tags like `wght`. And nothing applied while something was rejected is an error rather than a success.

### `quality` no longer hides what it changes

`quality` sets three things: draft = 15fps/72dpi, standard = 30fps/150dpi, high = 60fps/300dpi. So asking for high doubled your frame count and render time against standard, with nothing saying so. That's now in the tool description, and `fps` is a parameter — as `scale` already was for resolution — so you can raise compression quality without also doubling the frames.

### Fixed: a batch could report success when an operation failed

`pinepaper_agent_batch_execute` wrapped each operation in try/catch and treated *not throwing* as succeeding. Most failures here do not throw — a missing preset, an unloaded subsystem, an unmet precondition all come back as a returned error — so the operation reported the problem correctly and the batch said the scene was built.

A failed operation now fails the batch, and the result **names which one and why**, so a failure in a sixty-operation batch does not mean reading sixty entries. `apply_effect` also discarded the engine's verdict entirely and returned its own; it passes failures through now.

### New: find out which fonts you can use

`pinepaper_font` gains three actions that answer questions the tool could not answer before:

- `list_available` — every font family the studio can render, optionally filtered by category, each marked with whether its file has loaded yet.
- `check` — is a family really there, and **can it draw your string**? Those are different questions: a font with four glyphs is installed and will still render most characters in a fallback face, and the second answer is the one that decides the pixels. Pass the text you mean to draw.
- `fallbacks` — which text items on the canvas are silently rendering in something other than the family they asked for.

The rest of that tool authors a typeface. These three are about using one, which previously had no answer short of reading the server's source.

`check` and `fallbacks` **need a studio build from 2026-09-20 or later** and say so plainly if yours is older; `list_available` works today.

### Fixed: `pinepaper_execute_custom_code` could not do anything asynchronous

Your snippet was wrapped in a synchronous function. A top-level `await` is a syntax error inside one, so any snippet that awaited something failed to parse — and async work started without `await` was simply dropped, with the tool reporting success before it happened.

That is the whole async half of the engine — export, image import, rigging bake, layout — unreachable from the one tool that exists for reaching what the other tools do not cover. Snippets now run in an async wrapper, so `await` works and the result is the resolved value.

### Fixed: rotation read back as 0 on a rotated item

`pinepaper_get_items`, `get_by_id` and `get_dimensions` reported `rotation: 0` for items that are visibly rotated. Creating an item with a rotation bakes the angle into its geometry, so the property really is 0 — and reporting that is why rotation got filed as broken against an engine that rotates correctly. All three now report the true angle.

### Under the hood

Every engine call this server emits is now checked against the studio's actual API before release, including calls made through sub-objects. That check found and fixed nine more dead calls beyond the ones reported, including one in the agent guide that was teaching a method that does not exist.

## What's new in 1.6.9

### New: `pinepaper_export_store`

Recover an export the studio is still holding, instead of re-rendering it.

- `list` — what is held: `{id, format, size, createdAt}`, newest first. IDs survive a page reload.
- `save` — page it out to a file and release it. Returns a `filePath`, and is safe to repeat.
- `release` — drop it without saving.

Reach for it when an export fails with `Failed to write data to data pipe` — that is the browser's transport, not the encoder, so the bytes are often already stored — or when an error names an `exportId`.

**Retention:** held exports last until released, or until a later export needs the space, and eviction drops the oldest first. Save or release each export before starting the next one.

### New: `scale` on `pinepaper_agent_export`

Render video at a fraction of the platform preset (`0.1`–`1`).

- `scale: 0.5` with `quality: "draft"` is a fast look-check before committing to a full render.
- Smaller frames also mean smaller files: the encoder derives its target from resolution, so this is the size control. There is no bitrate option.
- Video only (`mp4`/`webm`/`gif`) — passing it to `png`/`svg`/`pdf`/`wav` is rejected rather than ignored. Omitting it leaves exports exactly as before.

### New: `list_motion` on `pinepaper_design_system`

Returns each licensed design system's motion curves **and** its durations; previously only the curves were reachable. Durations come back in milliseconds and in seconds.

These are the design systems' motion scales — Material's duration ladder, and so on. Aesthetic styles such as `bauhaus_geometric` carry no motion data of their own, so pair a system's motion with a style.

### `list_styles` now returns style tokens

`pinepaper_design_system` `list_styles` returns each style's palette, background, font stacks, type sizes and variants, not just its name. Building in a style by hand no longer means reading the generator source to find its colours.

### Fixed: `compose` placed everything off-centre

`compose` positioned items by their top-left corner while the canvas positions by centre, so every composed scene was displaced and left-aligned headlines ran off the edge of the canvas. Composed scenes now land where the layout intends.

### Fixed: exports could report success while failing

`pinepaper_agent_export` could return success when the export itself had failed, so a failed render passed silently and a batch could lose chunks without saying so. A failed export is now an error, and names a recovery path when the failure looks like a transport problem.

### Fixed: long exports timed out at ten seconds

Video exports running longer than about ten seconds failed with a `PP_TIMEOUT` that looked like a problem with the scene.

- `PINEPAPER_EXPORT_TIMEOUT` sets the budget (default `300000` ms). For exports over five minutes, raise `PINEPAPER_TIMEOUT` to match.
- `PINEPAPER_GOVERNOR=off` is an escape hatch for older studio builds.

### Fixed: exports failed on a fresh session

Exporting immediately after connecting failed with a message blaming the studio's version. The export now waits for the studio's export subsystem to finish loading.

### Fixed: large exports could be left undeliverable

A read failure partway through paging a large export left the file unrecoverable. Reads now retry at a smaller size, and anything still held can be recovered with `pinepaper_export_store`.

### Fixed: connection failures behind proxies, and a false "ready"

Connecting could burn the full timeout against a studio that was already usable, and the connection had no configuration.

- `PINEPAPER_WAIT_UNTIL` — what a navigation waits for (default `domcontentloaded`; set `networkidle2` for the previous behaviour).
- `PINEPAPER_TIMEOUT` — navigation and readiness timeout in ms (default `30000`).
- `PINEPAPER_PROXY` — routes Chrome through a proxy, for origins that reject headless Chrome. Setting it also relaxes certificate checking, which an intercepting proxy requires.

Connections now wait for the studio's API rather than for its canvas library, so "connected" means tool calls will work.

### Fixed: `pinepaper_animate_letter_collage` ignored its animation type

The requested animation type was discarded on every call. **This fix also needs a studio update** — the other half is an engine change that has not shipped yet, so collage animation stays static until it does.

### Documentation

- **Rotation** — `pinepaper_create_item` documents `properties: { rotation: 45 }`, and that rotation is baked into the geometry, so reading `item.rotation` back returns `0`. Verify a rotation by geometry or pixels, not by re-reading the property.
- **Dense motion** — `pinepaper_keyframe_animate` points at cheaper routes before you author hundreds of keyframes: the `time_expression` relation for motion that is a function of time, `staggered_with` / `wave_through` for a whole group, and `pinepaper_execute_custom_code` for procedural scenes.

## What's new in 1.6.8

**Long-form export stops crossing the bridge as one string.** `pinepaper_agent_export` handed the bytes back as a base64 data URL. Two things were wrong with that and only one of them was a bug.

- The bug: a **streamed** export returns a `{streamed:true}` marker rather than a Blob, and `FileReader.readAsDataURL` throws on it — so any export that streamed *broke* this path instead of extending it.
- The ceiling: base64 of a ten-minute 1080p video is a ~1.6 GB string before JSON transport. No memory fix reaches that.
- But the ceiling was never the MCP response. This server already wrote video and PDF to a file above 500 KB and handed back a `filePath` — the only real limit was the single `page.evaluate` return value. So the paging belongs *inside* the tool: the studio holds the encoded file in its export store and returns an id, and the server pages it into the file it was going to write anyway. One tool call, one `filePath`, at any size, with at most one 4 MB chunk in memory on either side. An agent-facing pager would only have exposed a transport limit the agent cannot act on.
- `duration` goes from a 60-second cap to **600**. Ten minutes was unreachable regardless of how the bytes came back, so the cap was the other half of the ceiling. GIF keeps its own 15-second cap: it has a different encoder and does not stream.
- Failure leaves the export **held**. The store is the only copy, so the error names the id and the bytes reached, deletes the partial file, and does not release. An eviction mid-read is reported as an eviction, never as a missing file, and re-exporting stays the caller's decision.
- **This needs a studio with the export store** — `exportToStore` / `readExport` / `releaseExport`, which are live in the engine. An older studio takes the buffered path exactly as before, and both of its failures are now *named* instead of fatal: the marker says it streamed and there is nothing to page it from, and an export past a 96 MB inline ceiling gives its size, the ceiling and what to do. That ceiling sits above what the buffered path could already deliver, so nothing that worked before starts refusing.

**`pinepaper_instantiate_ontology` builds through the studio's own compiler.** The server-side port placed items as boxes — no paint, no text, no keyframes, no masks. The engine's compiler reads every node facet and builds through the template loader's own paths, which is the round trip the studio's pixel tests verify. The box loop survives only as the fallback for studios that predate the facade, and says what it lost.

- **A failed image reported success.** The door returned three of the counts the compiler gives it and dropped nine, `imagesFailed` among them — so a raster that never decoded read back as `success: true` with a full `itemIds` array. All the counts are surfaced now, and `imagesFailed` alone is enough to make the call unsuccessful, whether or not the compiler also logged an error diagnostic.

**The design graph keeps the recipes for everything code drew.** Three kinds of node have no geometry to round-trip, because code drew them and the code's inputs *are* their geometry. The graph kept a generator's name and not its parameters — enough to name a generator, not enough to re-run one.

- Nodes now carry `generator`, `generatorParams` and `generatorRole`; a mesh carries `meshProvenance` (`op`, the node it was derived from, and the options); the 3D stage rides at document level as `world`. All of it reaches the JSON-LD.
- The parameters have to be the **merged** set. What a generator hands its registry is empty, or two keys of thirty for the GPU generators, and a recipe built from that names a generator it cannot reproduce — which is indistinguishable from a working one until someone re-runs it.
- `pp:world` is a **sibling** of `pp:generator`, never nested inside it. A World3D scene has no generator, so a stage read inside `if (generator)` is dropped from exactly the scenes that cannot rebuild without it.

**Relation presets are adoptable.** `pinepaper_add_relation` takes a `presetId` — a community motion someone already tuned, with its symbols exposed as knobs — instead of making a caller name a type and guess at params. The preset decides the relation type, and any symbol you omit takes the midpoint of its declared range, so a preset applies sensibly with no values at all. List them through the new `catalogue`, which also returns what this build **rejected**: a preset for a relation type this engine does not have is a named absence, where dropping it silently would read as the catalogue simply being smaller.

**`pinepaper_query_capabilities` gains `catalogue`** — the eight registries the engine's own aggregate does not gather: rig presets, shader effects, stroke decorations, the precomp list, the image library, segment-edit kinds, shatter orders and world meshes. Each was a capability an agent had to guess at, which by this project's rule is the same as its not existing. A missing facade is named rather than answered with an empty list, because an empty list reads as "none exist" and that is a different, worse answer.

**Four more reachable things, and a note on the ones that turned out not to be gaps.** `pinepaper_text_style` gains `cursive` (text written as a **stroked path** rather than set in a glyph, so draw-on animation and `outline_stroke` both apply to it), `wrap`/`unwrap` (break a text item to a width, reversibly), and `to_collage` (convert an *existing* text item in place). `pinepaper_equation_path` gains `solveOde` — integrate an ODE and get the **trajectory back as data** rather than a drawn path, to inspect, feed to a path, or drive keyframes with.

What was *not* a gap is worth saying too, because it was on the list: `createFoldedText`, `createGradientText`, `createMagazineText`, `createPaperCutText` and `createTileText` are one-line wrappers over the letter-collage styles this server already offers, and `plotFunction`/`plotParametric`/`plotSurface` wrap three generators it already exposes. A method-name diff cannot tell "no tool reaches this" from "a tool reaches it under another name."

**Animated character parts no longer jump the moment they start moving.** `pinepaper_character` places each part at its path's bounding-box centre — the point PinePaper's `position` names — while the keyframe tracks were anchored on the depiction's declared anchor. The two are not the same point, so every animated part snapped between them as soon as its t=0 keyframe evaluated: measured at 19.6px for a pigeon's beak, which detaches it from the head. A track is relative motion around a base, so re-basing it on the centre the part was actually placed at preserves every displacement and removes the snap — now 0.000000px, with a test that also checks the performance did not flatten into a constant in the process.

**A concept that inherits performs and inks like the one it inherits from.** Two defects in the same resolver, both measured. Channels were read off the concept alone, so `pp:Bus` — which composes `pp:Vehicle`'s parts and inherits its `jounce` and `travel` — returned **zero tracks** with every beat reported ignored, while claiming success. And ink was keyed on the concept *requested* rather than the depiction actually composed, so `pp:Bus` drew 0 stroked parts where `pp:Vehicle`, the same geometry, drew 3 — the "flat art dropped into an inked scene reads as pasted in" failure the ink exists to avoid, hitting exactly the concepts that inherit rather than declare. Both now match their parent measure for measure, `pp:House` included.

**`pinepaper_character` stops silently ignoring four arguments it documents.** `position`, `scale`, `palette` and `ink` were all handled by the resolver and absent from the schema, so zod stripped them and a call written the way the rest of this vocabulary reads landed dead-centre at the default size — the precise outcome the resolver's own comment says must not happen.

**Two production advisories cleared, both found by validating the release rather than by anything failing.** `fast-uri` (HIGH — host confusion via skipped IDN canonicalization, SSRF via malformed IPv6 normalization, SSRF via repeated hostname percent-decoding, host confusion via percent-encoded scheme normalization) and `hono` (MODERATE — `toSSG()` writing outside its output directory, unbounded dot-notation nesting in `parseBody()`, a query parser reading past the URL fragment). Both arrive transitively and are pinned to floors in `overrides`, so neither resolver can drift back; both lockfiles re-resolved and `npm audit --omit=dev` reports zero.

**`pinepaper_design_medium`'s thread surface is now the whole engine's, and the second tool over it is gone.** `pinepaper_create_stitchcraft` was removed: **all six** of its presets dispatched into the same `ThreadPainting` module `apply_thread` already reaches — `embroidery_satin` → satinBetween/fillRegion, `running_seam` → runningStitchContour, `cross_stitch` → crossStitchFill, `stem_outline` → stemAlong, `seed_texture` → seedFill, `needlepainting` → fillRegion. Two tools over one engine is exactly the drift this surface keeps paying to remove.

- `apply_thread` now offers **all six stitches the engine publishes**, not four: `runningSeam` and `crossStitch` were missing, and they are what a caller reaching for stitchcraft wanted. It also gained the per-stitch parameters `STITCH_OPS` declares and nothing named — `slant`, `overlap`, `stagger`, `gapLen`, `gridSize`. `slant` is the one that matters most: a satin fill laid at a slant is what separates embroidery from ruling.
- `roughness` is hand wobble, applied by the tool *after* the engine lays the stitches, since the engine has no such option. Every point of every stitch takes its own phase off the seed, so a long contour wobbles along its whole length rather than shearing at one end, and a given seed sews the same irregularities every run.
- `pp:Stitchcraft` points at `pinepaper_design_medium` now.
- **And the list has one definition.** It had four copies here — two Zod enums and their two JSON mirrors — so correcting one left `pinepaper_compose` unable to ask for two stitches `apply_thread` could. The engine had the identical split for the identical reason on the same day: `MEDIA.thread.stitches` was hardcoded to the same stale four while `STITCH_OPS` published six. Two repos, four copies, one list, drifted the same direction — because neither read the published table. It is `THREAD_STITCHES`, declared once and spread, with a test asserting every served copy matches.

*Two corrections to this note, made in place rather than quietly edited.*

The removal was first justified as a tool "built on a phantom", because `app.applyStitchcraftToItem` had zero hits in the engine. The grep was accurate and the inference was not, twice over: the capability is real — it lives in `js/core/StitchcraftPresets.js`, imported as a module by the code runner and never exposed as an `app.*` method — and it returned zero hits only because that file was unpushed when the search ran. A missing method and an unpushed commit look identical to a grep and call for opposite responses. The redundancy was always the real reason, and it is the better one.

The replacement enum was then built by scraping quoted strings out of `ThreadPainting.js`, which is not the same thing as reading what it publishes. `STITCH_OPS` is the vocabulary, and it holds exactly six names. The scrape added eight that are planner functions and field kinds — `satinBetween`, `fillRegion`, `radial`, `spine` and the rest, every one of which `applyThreadPainting` refuses — and it dropped `runningSeam` and `crossStitch`, which are real. For one commit this surface advertised eight stitches that error and hid two that work, while removing the tool that had offered them. Enum parity means diffing against the published vocabulary, not against the file.

**New tool: `pinepaper_design_system`** — the design vocabulary as data, and eighteen styles that build a scene. Two different things, kept apart because they are not the same claim:

- A **design system** is a real, licensed, versioned product — Material Design 3, IBM Carbon, Polaris, Fluent 2, Spectrum, Primer, USWDS, GOV.UK and more. Twenty-one of them, as W3C DTCG tokens. `list_easings` returns every motion curve across all of them as a named easing with its licence — and with `pinepaper:authored` on the three we had to fill in, so a vendor's published curve and one of ours are never mistaken for each other.
- An **aesthetic style** is a look: Bauhaus, Art Deco, Swiss, De Stijl, vaporwave, risograph, brutalist, Memphis, claymorphism, op art, pixel art. Thirty-three named, eighteen of which `compose` a titled scene. `draw: false` returns the scene and the ops as data and draws nothing — read the composition before committing to it, the way `pinepaper_story`'s `distill` works.

This runs in the server, not the browser: a design decision does not need the canvas to be open. The data is **vendored** from mcp-cloud by `scripts/sync-design-systems.mjs`, the same shape as the engine's stick-figure sync — one authored copy upstream, a mechanical mirror here, a sha256 in every header, and a provenance test that fails on a hand edit. A partial composition reports as a failure naming the elements that did not create, rather than as a success with half a poster.

**New tools: `pinepaper_stick` and `pinepaper_story`.**

- `pinepaper_stick` is the vendored stick-figure kit — a rigged figure posed, walking, travelling, holding a prop, with a garment and hair and a timeline of expressions, plus the floor and wall it stands on. Distinct from `pinepaper_character`, which places a figure from the *design graph* by concept. Its options were discoverable only by reading the engine's source. The geometry is vendored from mcp-cloud, which makes it a three-repo artifact, and the failure message says so — the fix for a missing kit is in another repository.
- `pinepaper_story` turns prose into a scene. `distill` reduces an article to its beats and **draws nothing**, which is the half worth having on its own: read what the distiller made of the text, edit the beats, and only then assemble. Discovering that reading by looking at a finished scene is the expensive way round.

**New tool: `pinepaper_interchange`** — Lottie, dotLottie, GLB, BVH and PNG sequence. `pinepaper_agent_export` covers the *platform* formats sized for Instagram or YouTube; these are the ones another tool reads, and they had no tool at all. Import is here too, because a format you can only write is half a bridge.

- `exportGLB` and `exportBVH` refuse through `console.warn` and a falsy return, and the production build strips the console — over MCP that is a silent nothing. Both preconditions are checked before the call and named: "no perspective objects to export — create one with `createObject3D` first", "no rig to export — create a skeleton first".

**New tool: `pinepaper_sound`** — synthesis, and the drawing that is the same object. The engine carries a whole audio graph and nothing reached it; `pinepaper_audio_beats` *analyses* audio that already exists, and this *makes* audio.

- Tones, chords (by name, with the Hz readable without playing), named percussion and SFX, and plain-language descriptions — `from_text` resolves "a soft warm bell on A4" to a spec **without** playing it, so a caller can inspect or edit before committing.
- **Sound and drawing are one object, both ways.** `create` draws a sound *as* a waveform path: edit the path and the timbre changes with it. `timbre_from_path` reads any drawn path back as harmonic content — a curve someone drew by hand becomes the partials of a note.
- `timbreFromPath` answers a flat single-partial timbre for anything that is not a path with length, which is a legitimate timbre *and* the refusal, indistinguishable once returned. So the item is checked before the call and a non-path is refused by name.

**New tool: `pinepaper_motion`** — the generators' Animation knob, pointed at anything. The motion engine every generator's own animation runs on was reachable from the code console and from custom generators, and from no tool call.

- A **group** motion (drift, sway, rotate, pulse, wave, bounce) moves the target as one. A **field** motion (ripple, breathe, undulate) sweeps a crest *through* the children from an origin, with a chosen waveform — a wave passing through a crowd rather than a crowd moving together. Nothing else on this surface could do the second kind: `pinepaper_animate` applies a loop preset to one item.
- `action: 'list'` returns the engine's own catalogue. `motion` is deliberately a free string rather than an enum: pinning the names here is exactly how `add_relation` came to list 39 of the engine's 134 relations.
- Origins include `random` (every element on its own phase — a twinkle, not a wave) and `roam` (hopping between the corners and the centre); pass a `seed` to make `random` reproducible.
- The waveform `spike` is a narrow bump. It was called `pulse` until the engine noticed one word was naming both a waveform and an animation; saved scenes still carry the old spelling and it is still accepted, but it is not offered as a choice.

**New tool: `pinepaper_path`** — the destructive path operations Paper.js has always had and nothing here could reach. Booleans (`unite`, `subtract`, `intersect`, `exclude`, `divide`), `simplify`, `outline_stroke`, `toggle_closed`, repeat `pattern`s (concentric, radial, grid, extrude), `get_geometry`, and a lock.

- They live apart from `pinepaper_modify_item` on purpose: modify restyles an item and keeps its id, while every action here changes what items *exist*. A boolean **consumes its operands** — they stop existing, and their relations and keyframes go with them. The tool description says so, because a caller who reads a boolean as a restyle loses work.
- `outline_stroke` is the one worth knowing about: it turns a stroked line into a filled shape of the same width, which is what you do before exporting to a format with no stroke model, or before a boolean against a line.
- Each refusal is the engine's own — "a boolean needs at least two paths", "that path has no stroke to outline", "simplify needs a path" — passed through rather than reworded, because two wordings for one condition is the defect this project keeps fixing. The single exception is `get_geometry`, whose facade returns a bare `null`; that one place supplies a wording.

**`pinepaper_world3d` gains the mesh half, the import half and the physics half — 33 actions.** The graph learned to record `meshProvenance` above, and nothing could author a mesh: it could describe a thing the tool surface could not make.

- `extrude_path` sweeps a canvas path along a depth; `lathe_path` revolves its profile. The path itself is untouched — the mesh is new, and the engine records the op, the source path and the options as the mesh's provenance, so a captured scene can rebuild it rather than merely recognise it. **The option names on this action are exactly the names in that record**, pinned by a test, so `meshProvenance.opts` spreads straight back in.
- Lights (`add_light` / `set_light` / `remove_light` / `list_lights`) and shared materials (`add_material` / `set_material` / `remove_material` / `list_materials`), plus `list_meshes` and `remove_mesh`. At most 8 point lights exist at once: the shader array is fixed-size, so a ninth is refused by name rather than ignored.
- **`rotY` is radians, and says so.** It is stored raw and handed to `cos()`/`sin()` in the shader with no conversion anywhere on the path — an exception to the degrees convention the rest of this surface follows, and the sort of thing that silently produces a scene rotated by a factor of 57. `rotYDegrees` is the convenience spelling and is folded in before the engine sees it. (`arc` on `lathe_path` *is* degrees; the engine converts that one.)
- **Import and navigation.** `import_obj` and `import_gltf` bring real geometry in; `list_mesh_clips` and `set_mesh_clip` play what a skinned model arrived with. `set_nav_target` decides whether the pointer drives the 2D canvas or the 3D world, `ground_height` and `canvas_to_ground` and `world_to_canvas` convert between them, `raycast` picks, and `dolly_camera` / `pan_camera` move the view.
- **Physics in the world**, distinct from `pinepaper_physics` (which is the 2D `physicsWorld`) and deliberately narrower: a sphere or capsule under gravity, colliding with terrain, objects, actors and imported meshes. No stacking solver and no joints. `step_physics` reports the contacts made and the bodies removed — and returns `{contacts: [], removed: []}` with *no world*, which is exactly what a quiet step returns, so the guard is what separates them.
- **Several of those facades answer `null` — or `0` — when there is no world**, which is indistinguishable from a real answer: ground really can be at height 0, and a ray really can hit nothing. Each is guarded ahead of the call, so "there is no world" never arrives disguised as a measurement. Once past the guard, a null from `raycast` can only mean a miss, and is reported as one.
- **`add_object` stops advertising knobs that reach no pixel.** It offered `metalness`, `roughness` and `emissiveIntensity` — but a plain object is drawn by the prop shader, which declares no such uniform, so those were stored, listed and ignored. They render on the mesh path only, and the description now says which is which instead of letting a caller set one and see nothing.

**`attracts` was live in the engine and unnameable here.** The relation-parity guard compares the tool enum against a fixture of the engine's relation map — but the fixture is copied by hand, so the guard passed while the engine moved. The fixture is refreshed and `attracts` is callable. The exclusion list that keeps tool-emitted families (`deform_*`, `effect_*`, `geo_*`, the rigging set) out of `add_relation` is unchanged, and still written down with its reason.

**`pinepaper_character` was defined and dispatched nowhere.** It shipped in 1.6.7 as a schema with no handler behind it — the worst version of the problem this project keeps naming, because the tool *listed*. It is wired now, and a test fails the build if any defined tool has nothing dispatching it.

**Four chart types classified as `pp:Group`.** The graph's type lookup lowercased the item type before consulting its map, so every camelCase key in that map was unreachable — `barChart`, `lineChart`, `scatterPlot` and `areaChart` answered `pp:Group` instead of their own types. Nothing errored; a caller got a readable graph of the wrong thing. The lookup tries the key as spelled before folding case, and a test now asserts every key in the map is reachable, so the next camelCase key the engine adds fails a test instead of quietly answering `pp:Group`.

**The error path could throw while reporting an error.** Canvas-state capture promises never to throw and returns whatever the studio handed back, but the formatter read its fields unguarded — so a partial state replaced a real failure with a `TypeError` from the error path itself. Every field is read defensively now.

**The instrument catalogue stopped being a ceiling, and the soundtrack can be rendered.** Five audio facade methods landed in the engine after `pinepaper_sound` was written, and the tool could list and play the seventeen built-in sounds and nothing else — so a rhodes, a koto or a taiko was unreachable, while the engine's own comment calls those tables "a curated starting set, not a claim that music contains six instruments."

- `define_instrument`, `define_percussion` and `define_sfx` register a sound at runtime. It is first-class from then on: `listInstruments()` reads the live table, so it appears in the `list_*` catalogues and plays by name like a built-in. The response returns the **canonical** name — registration normalises to `[a-z][a-z0-9_-]`, so a model that registers `Rhodes` and plays `Rhodes` is naming something that does not exist.
- The engine's rules are mirrored rather than tightened. A melodic instrument needs a partial table because one without renders silence; percussion and SFX may be **pure noise**, because a hat and a whoosh are, and tightening that would refuse exactly the sounds the relaxation exists for. `pitch: {from, tau}` is carried through — the glide *is* the drum, and without it a defined kick comes out a beep.
- `pinepaper_agent_export` takes **format: `wav`** — the soundtrack on its own, off the visual path. No platform preset resolves to it, so a request for a picture can never come back as audio; it has to be asked for by name. `framing: camera` and the audio knobs on a visual format are *rejected* rather than ignored, because silently dropping them leaves a caller believing something untrue about the output, and `estimateOnly` reports confidence `exact` — uncompressed PCM size is arithmetic, and a model would only be less true. The empty case distinguishes two things the engine distinguishes: a scene with **uploaded** audio renders to nothing here (the offline renderer bakes only what it can synthesize) and is routed to mp4/webm, which mux it — telling that caller "no audio" would be false.
- `render_soundtrack` mixes every placed sound to a WAV **offline** — no Web Audio, no playback, which is what makes it work in a headless studio — and writes it to a file through the same path video and PDF take. An empty scene is refused by name instead of producing a silent file, and any sound that could not be mixed is reported as `dropped`: a soundtrack missing a track otherwise looks exactly like a complete one.

**Eleven shapes the engine draws were reachable from nothing.** FxTool's `ShapeRegistry` registers 34 shapes and `create()` delegates any of them. Flowchart, UML and network route through `pinepaper_create_diagram_shape`, so 23 were callable — and the other eleven appeared in no tool enum anywhere: `disk`, `circle-outline`, `arrow-right`, and the **entire** annotation set (`speech-bubble`, `speech-bubble-square`, `speech-bubble-pointed`, `thought-bubble`, `comment-box`, `callout-box`, `double-bubble`, `quote-bubble`). The renderer was never the limit: `create()` already forwards `tailDirection` and `tailSize`, parameters that exist only for bubbles. So an agent asked for a comic panel or an annotated diagram had to hand-build the outline or decline, for a shape the engine had the whole time. `itemType` goes 17 → 28, each one documented with the engine's own description rather than a guess, and the emitted code is *executed* against a stub in the suite — reading a spread operator and inferring the rest is how a widened enum ships a dead door.

**The media list advertised seven of nine.** `hatch` and `watercolor` — both native fidelity, and `hatch` has its own `apply_hatch` action in the same tool — were missing from the served JSON description while the Zod copy beside it and the agent guide both listed them. Three copies, and the stale one was the copy a model reads. `pinepaper_compose`'s two-medium enum was checked against the engine for the same reason and is correct: `COMPOSABLE_MEDIA` is frozen at `['vector','thread']`, and both tables are fixtures now.

**A scene read could be 500 items of 800 and say nothing.** `exportCanvasOntology` returns the true `itemCount` beside an item list capped at `maxItems`, and `childCount` beside a capped children array — so a partial answer was indistinguishable from a complete one unless the caller thought to compare two fields that look like they agree. Truncation is now reported when, and only when, something was clipped: both numbers, the knob to raise, and what to do past 500 where the cap truncates rather than paginates. An older studio that omits `itemCount` is reported as unknown, never as partial.

**The server's own identity string banned two tools it ships.** `SERVER_INFO.description` carried a flat prohibition on producing HTML or React — no qualifier, no tool named — while this server ships `pinepaper_export_widget_html` and `pinepaper_export_widget`, which produce exactly those. That string is the first text a client shows a model, before any tool, every session. Same defect as the `agent_start_job` description fixed above, in the widest-read place available. The rule is substitution, not format — and the prohibition is described here rather than quoted, because the guard flags a banned imperative in this README too, and it is right to: a model reads the sentence, not the quotation marks around it. The guard that catches it had been reading two surfaces out of four; it now sweeps all 19 resources, every prompt, all three verbosity tiers, the manifest and this README, and its liveness floor compares against the declared lists name by name rather than counting.

## What's new in 1.6.7

**Four more item-stage shader effects** — `electric_arc`, `vortex`, `rain_veil`, `caustics` (ABYSSAL's noise library). The `item` shader stage went from four built-ins to eight and nothing here named the new half.

**`on_key_fire` now matches a chord exactly.** Its modifier tests were one-way — they required a modifier that was asked for but never rejected one that was not — so `{ key: 'Enter' }` fired on Ctrl+Enter, Shift+Enter and Cmd+Enter alike, and `{ key: 's' }` fired on the browser's own Ctrl+S. Those are different intents. The relation's documentation says so now, along with the focus gate that keeps it from taking keys from the rest of the page. (Reported from this repo during the relation audit; fixed engine-side.)

**Three appliers that failed in silence now report.** The engine's `animate`, `applyAnimatedMask` and `applyCutoutStyle` refused an unknown key only through `console.warn`, and the production build strips the console — while returning values identical between success and failure (`undefined` either way, a Paper Group either way, and the very item it was given). Over MCP, where there is no console to read, an unknown key left the canvas unchanged and told every caller it had worked.

The engine now records the refusal on the item it already hands back, and these tools read it: a refused animation type, a mask that applied but will never animate, and a cutout preset that returned the item untouched are all reported as failures, each carrying the requested value **and the known list**, so a caller can correct itself without a second round trip.

**New tool: `pinepaper_character`** — place a figure from the graph and direct it. The character layer was reachable from the cloud's build script and nowhere else, which by this project's own rule means it did not exist: an MCP client, a cloud caller and a small on-device model all see these schemas and nothing behind them.

- It replaces roughly thirty exactly-right calls — create the skeleton, add each bone with the right parent and angle, create each shape, attach each to the right bone, then author poses — where one mistake anywhere leaves a broken figure. That volume of exactly-right output is the reported reason characters do not work for smaller models.
- Direction is declarative beats: `{ concept: "pp:Pigeon", at: {...}, height: 300, beats: [{ at: 0, channel: "bob", until: 8 }, { at: 1.4, channel: "blink" }] }`.

**`create_item` gains `shader` and `field` item types.** The cloud renderer has drawn shaders and parametric fields for months, reachable only by hand-writing a scene document — so the capability existed for whoever writes the build script and for nobody else.

- The description names the parameters and the expression variables a field is written in: a parameter nobody can discover is the same as a parameter that is not there.
- `bornAt`/`ttl` are documented on `properties`. They always passed through (`properties` is a free record) and nothing mentioned them, so no caller could build a piece that cuts between shots — which is why the only multi-shot pieces that exist had their shots inferred from a naming convention in a build script.
- **A surface is not a shape**, and the ontology now says so instead of filing these under Path because they also end up as pixels: `pp:CanvasSurface`, with `pp:ShaderSurface` and `pp:ParametricField` under it. A shape is built as an item and drawn from its geometry; a surface is evaluated as the frame is drawn.


**New tool: `pinepaper_import_motion_capture`** — BVH import and retarget. The engine has had `importBVH`/`retargetBVH` for releases and nothing exposed them; a model cannot use a capability no tool call reaches.

- `mode: 'import'` builds a new skeleton shaped like the capture file. `mode: 'retarget'` drives an **existing** rig, so proportions stay the character's and only the motion comes from the clip — that distinction is the reason the tool exists.
- Angles transfer as bind-pose deltas, so a T-posed CMU rest is not slammed onto a rig with a relaxed stance. Bones the alias table cannot place come back as `unmatchedSource`/`unmatchedTarget` instead of silently driving half a rig, so a caller can build `boneMap` from the failure. `fps` defaults to 15 — CMU records at 120, and nobody wants 120 poses a second on a canvas timeline.

**`pinepaper_rigging` gains the pose-motion half — 18 actions.** The engine had 26 pose methods; the tool exposed two. The pose library (`list_poses`, `load_pose`, `interpolate_poses`, `list_skeletons`), playback (`play_pose_sequence`, `stop_pose_sequence`, `apply_pose_transition`), procedural layers (`auto_walk`, `auto_breath`, `auto_idle`, `auto_jump`), root locomotion (`move_root`, `stop_root_track`), and the export/deform edges (`bake_animation`, `add_secondary_motion`, `skin_path`, `list_shape_keys`, `load_shape_key`). Each was checked against the engine source rather than its docs, which name tools that were never registered.

- **New capability: `stitch_poses`** — join clips into one continuous performance, entering a cyclic clip at the phase closest to where the previous one ended so the legs do not teleport mid-stride.

**New tool: `pinepaper_design_medium`** — the third design axis: what physically makes the marks. Every medium declares a *fidelity*, and `resolve` refuses the ones it cannot honestly render rather than producing flat shapes in their colours. `apply_thread` renders an item as needlepainting; the direction field is what separates that from hatching.

**New tool: `pinepaper_text_effect`** — 37 character-level text animations (terminaltexteffects' vocabulary, reimplemented in the engine from source). `list` returns the effects; `apply` explodes a text item into one animated item per character.

- The planner is pure and emits **keyframes**, so the result is ordinary animated items: it scrubs on the timeline, survives undo and session restore, and exports through the existing MP4 / SMIL / Lottie paths. Every effect ends at rest.
- **It replaces the text item.** Unlike `pinepaper_text_style` (which adopts the text's registry id), this removes the original and returns the new per-character ids — so relations and keyframes on the source id do not survive. `keepSource: true` is the escape hatch. The tool is marked `destructiveHint` and says so in its description, because it inverts the id-preservation convention every neighbouring tool follows.
- Resting characters are painted with a gradient across the text block by default (what the upstream effects actually do); `gradient: false` keeps the authored fill. `seed` defaults to 1, so a given text + effect + seed animates identically every run.

**Two more enums that named things the engine does not have.** Both were the same shape as the relation gap, found by diffing every validated enum against the engine rather than by anything failing.

- **`canvasPreset` on the agent-flow tools** passed an export *platform* name (`instagram`, `youtube`, `web`) straight to `setCanvasSize`, which keys on `instagram-post` and `full-hd-1080p`. Seven of ten matched nothing: the engine fell through to its default, resized the artboard to 800×600, and recorded the preset as applied — so asking for an Instagram canvas got neither the size nor an error. Now mapped, and pinned by a test against the engine's preset list. The platform vocabulary is unchanged, because `instagram` is the right word for an export target and only the canvas-size use was wrong.
- **`pinepaper_modify_item` now documents `pathData`** — reshaping the geometry itself, not just its styling, so a traced or hand-drawn outline can be corrected without deleting and recreating the item (which would lose its id and every relation and keyframe pointing at it).

**`pinepaper_animate` offered an animation that does not exist.** `slide` was in the enum, in three JSON schemas and in two prose lists. The engine has no such type — the real ones are `slideLeftRight` and `slideUpDown`. It accepted the value, wrote it to the item, and the driver's switch fell through: the item sat still while its own data claimed a slide, and the call reported success. The same enum hid twelve types that do work (`breathe`, `glow`, `jelly`, `path`, `shake`, `swing`, `scrollUp/Down/Left/Right`, and the two real slides), so the surface both invented one animation and concealed a dozen.

All 18 driver types are now offered, and a parity test pins the enum, every JSON-Schema copy of it, and the prose against a fixture of the engine's `ANIMATION_TYPES`. A unit test that asserted `slide` parses — pinning the bug in place — was corrected. Letter collages keep their own separate four-name vocabulary, which is not drift.

**95 live relations were not callable.** `pinepaper_add_relation` offered 39 of the engine's 134, and the enum is a hard gate — a name missing from it is rejected at validation. The missing set was not a random 95: it was essentially the entire **interactive** vocabulary, every event-channel relation included, so the state-machine-via-relations capability was undiscoverable and unusable. `pinepaper_scene_graph` was emitting `on_click_fire` and `on_event_set_active` relations that an agent could not then create, inspect or recreate by hand.

Nothing was broken at runtime, which is why it survived: the engine could do it and nothing could *name* it. For a model those are the same condition.

- **42 relations are now callable** — the input triggers (`on_click_fire`, `on_pointer_enter_fire`, `on_pointer_exit_fire`, `on_key_fire`), the full `on_event_*` reaction set including template-interpolated property writes and the persistent-store pair, the `on_enter_*`/`on_exit_*` proximity families, `exclusive_group` / `menubar_group`, and the behavioural relations `repels`, `wiggle`, `spring_follow`, `syncs_with`, `triggers_animation`, `connects_to`, `part_of`, `attached_to_tail`, `head_points_to`, `anchored_in_world`, `tours`, `synced_to_audio`, and `expresses` — which `pinepaper_import_layered_character` already promised would make an imported character blink, while the enum made it unnameable.
- **Relations a dedicated tool emits stay out** — `deform_*`, `effect_*`, `geo_*`, `bone_*` and friends. The agent authors those *through* that tool, and a second name here would be a worse way to do the same thing. That exclusion list is written down with its reason, so the next engine diff doesn't re-litigate all 95.
- **The map behind the validator was the same bug one layer down.** `RELATION_TYPE_MAP` gates "is this a known relation", so a relation callable but unmapped makes the validator report a perfectly valid scene as using an unknown one. 40 entries and 42 `pp:` edge definitions were backfilled from the engine's own descriptions.
- **The real fix is the parity test.** The enum is duplicated across five tool schemas plus the zod schema, and nothing checked any copy against the engine or against each other. It's now pinned to a fixture of the engine's registry map, asserting in both directions — nothing offered that the engine cannot run, nothing runnable that the surface hides — and that all six copies agree. The additions are just this week's payload.

The relation catalogue in the tool description now names families rather than all 80 members, and points at `pinepaper_query_capabilities { kind: 'relation' }` for the live list, which reads the registry instead of a list written down in prose.

**Hatching reaches the tool surface** — `pinepaper_design_medium` gains `apply_hatch`, `list_flow_fields` and `list_hatch_options`. PinePaper could fill and it could stitch, and it could not hatch; the gap was already named in the thread-painting code, which notes that a constant stitch field "looks like hatching, which is a different medium."

- **Hatching states value through line density, not colour.** The same shape at 6px spacing and at 3px reads as light and dark with nothing else changed. `gradient` makes the density fall off across the shape — a shaded ramp rather than a flat tone.
- The straight ruling is what a printer makes; `flowField` is what makes it read as *drawn* — `hand` is the small correlated wander of a hand-drawn line, `waves` for water and hair, `spiral` for wood grain around a knot. `continuous` joins the whole set into one serpentine path.
- Reimplemented from [p5.brush](https://github.com/acamposuribe/p5.brush)'s source (MIT, Alejandro Campos Uribe), **not vendored**: p5.brush is WebGL2-only and its output is raster, so vendoring it would put a second renderer in front of Paper's vector geometry and forfeit infinite-resolution scaling, SVG export and the relation graph. The maths is renderer-agnostic and is the part worth having.
- Every refusal names its fix. The engine reports all five of its distinct failures as `console.warn`, which production strips — so the tool checks the shape first and answers "text has no outline, convert it with `pinepaper_text_style` first" or "distance is 400px against bounds 150x150" instead of a bare null. A group is hatched up to 40 paths and says so when there were more.

**GSAP's vocabulary, PinePaper's engine.** An audit of GSAP's concept set against the 49 relations found most of it already present under other names — MotionPath is `moves_along_path`, MorphSVG is `morphs_to`, DrawSVG is trim paths, Physics2D is `spring_follow`, SplitText is the 37 text effects, nested timelines are precomps, and `wiggle` is richer than CustomWiggle. Five concepts were genuinely missing. They are adopted as **vocabulary, not as a dependency**: a second animation runtime is one that none of the SMIL, Lottie or MP4 exporters would understand, so the grammar is GSAP's and the implementations are independent.

**New tool: `pinepaper_sequence`** (`pp:TimelinePosition`) — say WHEN relative to something else instead of in absolute seconds. `"<"`, `">"`, `"+=1"`, `"-=25%"`, labels and `"intro+=0.5"` resolve to seconds, and `place` threads a whole run so each clip resolves against the ones before it. A pure planner; it touches nothing.

- The one thing to get right: **a percentage means different things in different forms.** `"-=25%"` is a quarter of the clip *being inserted*; `"<25%"` is a quarter of the *previous* one. They agree only when the two clips are the same length, and getting it backwards yields timings that look almost right.

**New tool: `pinepaper_stagger`** (`pp:Stagger`) — the shape of a delay across many items: a grid lighting up outward from the centre, a row converging from both edges. `each` fixes the gap between neighbours; `amount` fixes the total. Delays are written to the channel the engine and the SMIL exporter already read, so a staggered scene scrubs and exports — nothing here is playback-only. `staggered_with` gains the same shape parameters (`count`, `from`, `amount`, `grid`, `axis`, `distributeEase`).

**New tool: `pinepaper_flip`** (`pp:Flip`) — animate a layout change *without describing the motion*. Record where things are, rearrange them however you like, and the transition is derived from the difference: the one animation an author never has to specify, which is what makes it usable for re-sorts, auto-layout passes and filters nobody could enumerate in advance. It writes ordinary keyframes, so the transition scrubs and exports. Rotation is compared on the shortest arc — 359° to 1° is a two-degree move, not a near-full spin the wrong way.

**`pinepaper_play_timeline` gains rate, progress and scroll** (`pp:TimeScale`, `pp:InputDrivenPlayback`) — `set_time_scale` / `get_time_scale`, `get_progress` / `set_progress`, `bind_scroll` / `unbind_scroll` / `list_scrub_anchors`.

- Rate is deliberately unclamped: 0 freezes the clock without stopping playback, and a negative rate runs the scene backwards. Changing it rebases the clock, so the playhead does not jump. **Export is unaffected** — a scene watched at 0.5x still exports its real duration rather than a file twice as long.
- Scroll binding always releases a previous binding first: the listener holds the scene alive, so a rebind without an unbind is a leak *and* leaves two bindings scrubbing one timeline.

**`orbits` gains `phaseDegrees`.** `phase` was the single parameter in the whole relation vocabulary measured in radians, against this engine's own stated convention that angles are degrees. `phaseDegrees` now takes precedence; `phase` is kept, and documented as the exception, because changing it outright would silently re-time every scene that already sets it — a 57× error of exactly the kind the convention exists to prevent.

**`pinepaper_design_medium` was served but unlisted.** It had been missing from `manifest.json`'s tool list since it shipped — introduced above, but invisible to the marketplace listing. Caught by the prepublish guard while regenerating the manifest for the tools above.

**New tool: `pinepaper_scene_graph`** — compiles an interactive story or quiz into native items and relations: cards, answer buttons, click→event routing, exclusive-group mutex visibility, and score tracking.

- `action: 'validate'` runs the same structural check **without drawing anything** — errors, warnings, reachable nodes, cycles. Check a generated graph before committing a canvas full of cards to it.
- The schema refuses a graph the engine would refuse, and one it would silently mangle: a dangling `to`, a `start` naming no node, a non-terminal card with no way out, and **duplicate node ids** — the engine keys its node index by id, so a repeated id quietly replaces the earlier node rather than erroring.
- Two ways out of a card: `answers` waits for a click, `next` (+ `duration`) auto-advances for a linear story beat.
- The result forwards `failed`, `wired` and `cycles`. A graph can render completely and still leave relations unwired — it looks built and is inert, and that count is the only thing that says so.

**New tool: `pinepaper_query_capabilities`** — asks the engine what it can do (text styles, character effects, generators, deforms, relations) and recommends one: `list`, `find`, `coverage`, and a mood/subject-weighted `choose`.

- It reads `app.getCapabilities()`, which **warms the lazy registries first**. Generators do not exist until the heavy modules land (~1.2s after boot) and the rigging/blending/deform relation rules only register once their subsystem is touched — answered cold, the engine reports zero generators and roughly 77 of ~100 relations. `warm: false` opts out when a cheap re-read of what is already resident is enough.
- `coverage` names its own blind spots: kinds with no source wired, and entries that can be applied but not *ranked* because they carry no description. A chooser that scores on description can never recommend those, so it says so.
- `seed` gives a stable tiebreak among equal-scoring candidates; with no seed the order is stable by key. Either way a repeated call answers the same way.

**Every tool property now declares a type.** Ten inputs across `pinepaper_event`, `pinepaper_component`, `pinepaper_world3d`, `pinepaper_rigging`, `pinepaper_text_style`, `pinepaper_equation_path` and the new capabilities tool were published with a description and no `type` — valid JSON Schema, but strict function-calling clients reject a typeless property, and this server claims to work with any MCP-capable model. They are `anyOf` unions now.

**`pinepaper_connect` / `connect_ports` accept an `id`.** `update_connector` and `remove_connector` address a connector by `connectorId`, and there was previously no value a caller could correctly pass — creation returns code rather than a result, and the engine's fallback is timestamp-based. Assign your own and reuse it.

**`pinepaper_world3d` `add_object` forwards PBR material fields** — `metalness`, `roughness`, `emissiveIntensity`. *(Corrected in 1.6.8: `metalness` and `roughness` are accepted and ignored on a plain object — the prop shader declares no such uniform. They render on the mesh path. Left here rather than quietly edited, because a drifted claim is worse than a missing one.)*

Follows 1.6.6, whose dependency-security work is described below.

**Dependency security.** `puppeteer` moves to ^25, clearing GHSA-jmr9-qjv8-65gv (`extract-zip` symlink path traversal) — `@puppeteer/browsers` 3.2.1 drops `extract-zip` entirely. The published package was never exposed (puppeteer is an optional peer), but the browser tools need one, and the path was re-verified against real Chrome rather than a green unit suite that never launches a browser.

`qs` is pinned to ^6.16.0, clearing GHSA-4mjr-xmp4-gh2g — a denial of service on the **production** chain, via `@modelcontextprotocol/sdk` → `express`. `npm audit` reported zero against it, as it did through the 1.6.6 work: its registry feed lags GitHub's. Verified instead with an OSV sweep of all 82 production packages, which is clean.

**Engine requirement.** Several capabilities this server has always emitted correct calls for did nothing until recent FxTool builds: **physics** (the step callback was never registered, so nothing moved), scene-wide **GPU filters** on the WebGPU tier, **map region colour animation** (which reported success while animating nothing), and `modify_item`'s `pathData`. No change was needed here — the calls were right — but run an FxTool from 2026-08-29 or later to get them.

## What's new in 1.6.6

Dependency security, no new tools and no API changes:

- **10 vulnerable transitive pins cleared** (21 advisories: 1 critical, 13 high, 6 moderate, 1 low) across `basic-ftp`, `fast-uri`, `js-yaml`, `path-to-regexp`, `ws`, `ip-address`, `qs`, `flatted`, `body-parser` and `ajv`. Each is pinned to a floor in `overrides` so neither resolver can drift back.
- **Root cause was a stale committed `bun.lock`.** It pinned the vulnerable versions while `package-lock.json` had already re-resolved most of them — and `bun test`/`bun run build` install from `bun.lock`, so that was the tree in use. Both lockfiles now agree.
- **`npm audit` reported zero** against all of this; its registry advisory feed lags GitHub's. Verified instead with an OSV.dev sweep of both lockfiles, red-tested against the previous commit.
- **`manifest.json` version parity is now tested.** It had silently sat at 1.6.4 through the 1.6.5 release.

Exposure note: `puppeteer` has been an optional peer since 1.6.5, so its chain (`basic-ftp`, `ws`, `ip-address`, `js-yaml`) never reached installs of this package. The `@modelcontextprotocol/sdk` chain (`fast-uri`, `path-to-regexp`, `qs`, `body-parser`, `ajv`) is the production surface.

## What's new in 1.6.5

Security hardening, no new tools:

- **Generated code is breakout-proof.** Three emitters wrapped user text in hand-escaped quotes without escaping backslashes (CodeQL `js/incomplete-sanitization`, High ×3) — an input like ``x\'; evil()`` could land outside the string in emitted code. All string literals now emit via `JSON.stringify`; regression tests pin the class.
- **Puppeteer is now an optional peer.** The 4 browser tools lazy-load it and explain the one-line install (`npm i puppeteer`) when absent. The default dependency tree drops the headless-browser download, its install script, and its large transitive tree (`tar-fs`/`bare-*` — the usual "obfuscated code" scanner alerts). Default deps: `@modelcontextprotocol/sdk` + `zod`.
- **Slimmer tarball.** Compiled test fixtures no longer ship in `dist/`.

## What's new in 1.6.4

Fourteen new tools (121 → 135) and new actions across the surface — the release that catches the agent surface up with the engine.

**3D worlds.** `pinepaper_world3d` — a real depth-buffered 3D world under the canvas: terrain presets (`forest`, `snowMountain`, `field`, `jungle`), sun shadows, an addressable actor stage and a directed camera (`follow`/`fixed`/`orbit`). `add_actor` with `live: true` puts a rigged canvas character INTO the world, performing — walk cycle, expressions and all. `describe` returns the engine's own parameter schema, so the docs cannot drift.

**Motion capture & characters.** `pinepaper_rigging` gains `import_bvh` (CMU/Mixamo mocap → a new rig, stick figure included), `retarget_bvh` (drive an *existing* rig by bone name — the result reports matched/unmatched bones) and `import_spine` (Spine JSON). New `pinepaper_import_layered_character` lands a layer-decomposed illustration as role-bound parts — blink and smile work with zero wiring (check `rolesWired` in the result).

**Video editing.** `pinepaper_media` gains `set_time_remap` (speed ramps, freeze frames, reverse), `speed_ramp`, `match_cut` (subject-aligned cuts via on-device detection), `apply_track_matte` (a headline filled with footage; `live: true` tracks an animating matte) and `stop_live_matte`.

**Design systems.** `pinepaper_brand_kit` (plan with WCAG contrast audit, then apply), `pinepaper_component` (master/instance with overrides that survive master updates), `pinepaper_artboard` (retarget a finished design to a new format), `pinepaper_comment`, `pinepaper_provenance`, `pinepaper_scene_diff` — plus `pinepaper_transform` `fit` (contain/cover).

**Typography & imagery.** `pinepaper_text_style` (stacked-layer display titles + variable-font weight/width/slant as animatable properties), `pinepaper_shatter_image` (raster → tile grid, inert until animated), `pinepaper_compose` (the collage patterns), and `pinepaper_image_filter` now documents the full GPU registry — grain, scanlines, duotone, bloom, halation, lightShafts, paletteMap, and the second-input set (displace, refract, trackMatte, datamosh) — plus `analyze_palette`/`recolor_palette` (read an image's palette, recolor another to match, shading preserved).

**Games & data.** `pinepaper_game` (deterministic A* pathfinding that feeds `moves_along_path`, tilemaps with merged collision rects), `pinepaper_audio_beats` (beat detection → `animate_to_beat`), `pinepaper_template_params`, and Figma import via `pinepaper_import_asset`.

**Agent economics.** `pinepaper_agent_export` gains `estimateOnly` — preflight an export's size without rendering it; GIF exports are capped at 15s with a clear message instead of an OOM.

<details>
<summary>What's new in 1.6.0</summary>

- **Image editing tools**: `pinepaper_crop_image` (one-shot crop, keeps the item's id and relations) and `pinepaper_chroma_key` (green-screen background removal with auto-estimated thresholds)
- **`pinepaper_media` gains `set_clip`** — re-trim an already-uploaded video/audio clip
- **Shader auras** in `pinepaper_apply_effect`: `heatmap`, `liquid_metal`, `gem_smoke` (WebGL2, silhouette-clipped)
- **`pinepaper_image_filter` fixed and expanded** — routed to the real GPU filter engine
- **README as an MCP resource** — clients can read `pinepaper://docs/readme` (and per-language variants) without leaving the protocol
- This README, in 9 languages, with live animated examples

</details>


## Toolkits & Token Budget

154 tools is a lot of context. The server ships a **toolkit** system that serves only the tools a given client needs, plus a **verbosity** system that controls how long each tool description is.

**Toolkit profiles** (`PINEPAPER_TOOLKIT`):

| Profile | Contents |
|---------|----------|
| `full` | Every tool, no filtering (default) |
| `agent` | Broad authoring surface, minus niche/low-level groups |
| `diagram` | Canvas + diagram + query/export |
| `map` | Canvas + map + query/export |
| `font` | Canvas + font + letter collage + export |
| `minimal` | Agent, browser, canvas, and guide only |

**Verbosity tiers** (`PINEPAPER_VERBOSITY`): `verbose`, `compact` (default), `minimal`.

**Client auto-detection.** When neither env var is set explicitly, the server picks a profile from the MCP `initialize` handshake:

| Client | Toolkit | Verbosity |
|--------|---------|-----------|
| `claude-ai` | `minimal` | `compact` |
| `claude-desktop` | `full` | `compact` |
| `claude-code` | `agent` | `compact` |
| `cursor` | `full` | `compact` |
| `windsurf` | `full` | `compact` |

Explicit env vars always win. You can also hand-pick tools with `PINEPAPER_TOOLS` (comma-separated names), or switch profiles at runtime with the `pinepaper_set_toolkit` tool. Start with `pinepaper_tool_guide` to have the server explain its own surface.

## Features

### 🤖 Agent Flow Mode (enforced by default)

- **Auto-Connection**: Browser connects automatically on first tool call (headless mode)
- **Auto-Session**: Agent sessions start automatically — just start creating
- **Batch Operations**: Execute multiple operations in one call (~10x faster)
- **Smart Exports**: Auto-detect optimal format for Instagram, TikTok, YouTube, etc.

```
"Create a red pulsing text that says HELLO"  # Browser auto-connects
"Create 5 items in batch, then export for TikTok"
"Analyze the scene and recommend export format"
```

**No manual setup required** — just start making tool calls.

### 🔄 Relations (Behavior-Driven Animation)

The **key feature** — describe HOW items should behave, and the engine solves the motion every frame. 39 relation types are available via `pinepaper_add_relation`. Relations are compositional: one item can carry several at once.

**Spatial & motion**

| Relation | Description |
|----------|-------------|
| `orbits` | Circular motion around a target |
| `follows` | Move toward target (with offset) |
| `attached_to` | Fixed offset from target |
| `maintains_distance` | Hold a set distance |
| `points_at` | Rotate to face target |
| `mirrors` | Mirror target's position |
| `parallax` | Depth-scaled movement |
| `bounds_to` | Stay within an area |
| `wave_through` | Wave propagation across items |
| `moves_along_path` | Travel along a path or equation |

**Structural layout**

Static composition expressed as edges instead of hardcoded coordinates. Placement is derived from the target's bounds and re-derived each frame, so moving or resizing the target brings the dependent along — and the layout stays editable as graph data.

| Relation | Description |
|----------|-------------|
| `on_top_of` | Source's bottom edge rests on the target's top edge — stacking (`gap`, `align`, `overhang`) |
| `below` | Mirror of `on_top_of` — source's top edge on the target's bottom edge |
| `beside` | Flank the target left or right (`side`, `gap`, `align`) |
| `inside` | Place within the target's bounds at a 9-way `anchor`, inset by `padding` |
| `centered_on` | Source center = target center + (`offsetX`, `offsetY`); concentric at zero |
| `aligned_with` | Match the target on one `axis` only, leaving the other free (`axis` is required) |

**Structure & construction**

| Relation | Description |
|----------|-------------|
| `is_midpoint_of` | Sit at the midpoint of two items |
| `lies_on_line` | Constrain onto a line |
| `is_centroid_of` | Sit at the centroid of a set |
| `is_circumcenter_of` | Sit at the circumcenter |
| `concentric_with` | Share a center |
| `circumscribes` | Enclose a target |
| `indicates` | Point out / annotate |
| `construction_reveal` | Staged geometric reveal |

**Animation & camera**

| Relation | Description |
|----------|-------------|
| `animates` | Drive a property over time |
| `grows_from` | Scale in from an origin |
| `staggered_with` | Offset timing across a set |
| `morphs_to` / `group_morphs_to` | Shape morphing |
| `camera_follows` / `camera_animates` | Camera behavior |

**Deterministic binding (Expression IR)**

| Relation | Description |
|----------|-------------|
| `driven_by` | Bind one property to another: `source.p = target.p * multiplier + offset`, optionally clamped. For `fillColor`/`strokeColor` the driven value interpolates `colorFrom`→`colorTo`, so a relation can drive color. |
| `time_expression` | Self-relation: drive a property by a math expression of `t` (scene time) and `v` (base value), e.g. `sin(t*2)*50 + v`. |

With `signal: true` these compile to a pure `f(t)` Expression IR, making them scrub-, loop-, and replay-stable. Expressions using `random()` or unknown symbols fall back to per-frame evaluation.

**Event-driven scene chains**

| Relation | Description |
|----------|-------------|
| `on_event_fire_after` | When source event fires, pulse the target event after a delay (chaining primitive) |
| `on_event_add_relation` | On fire, add a relation to an item — the scene evolves itself |
| `on_event_remove_relation` | On fire, tear a relation down |
| `on_event_set_color` | On fire, set fill/stroke color |
| `on_event_set_property` | On fire, set any item property |
| `on_event_set_visibility` | On fire, show/hide |

Create channels with `pinepaper_event` (`create` → `eventId`, `pulse` → fire it). Chain beats with `on_event_fire_after` on the `canvas` timeline to author a long scene as a graph of timed beats instead of a keyframe track.

**Extras**: relations can target the live pointer via the reserved `targetId` `'cursor'`, and any relation can carry `params.window = { start, end?, repeat? }` to gate when it is active (`repeat`: `once` | `loop` | `pingpong`).

### 🎨 Item Creation & Geometry

```
"Create a blue circle at position 200, 300 with radius 50"
"Create text saying 'Welcome' with font size 72"
"Draw the perpendicular bisector of AB"
```

Beyond basic shapes, `pinepaper_geometry` provides construction primitives, `pinepaper_group` handles group/ungroup/break-apart, and `pinepaper_arrange` controls z-order (bring forward/back/front/back).

### 🎬 Simple Animations

For quick looping effects: `pulse`, `rotate`, `bounce`, `fade`, `wobble`, `slide`, `typewriter`. For timed work use `pinepaper_keyframe_animate`; query the valid targets with `pinepaper_get_animatable_properties` and `pinepaper_get_available_easings`.

### 🖼️ Background Generators

31 procedural generators via `pinepaper_execute_generator` (list them with `pinepaper_list_generators`):

`drawBlobs`, `drawBokeh`, `drawCircuit`, `drawFluidFlow`, `drawFormulaArt`, `drawFunctionPlot`, `drawGeometricAbstract`, `drawGlobeWireframe`, `drawGradientMesh`, `drawGrid`, `drawHalftone`, `drawLowPoly`, `drawNoiseTexture`, `drawOrganicFlow`, `drawParametricCollection`, `drawParametricCurve`, `drawPattern`, `drawPeaks`, `drawRibbons`, `drawScatter`, `drawShaderArt`, `drawSimulation`, `drawSpectrumAnalyzer`, `drawStackedCircles`, `drawStackedWaves`, `drawSunburst`, `drawSunsetScene`, `drawTruchet`, `drawWaves`, `drawWindField`, `drawYeganehMountains`

### 📐 Diagram Tools

Create flowcharts, UML diagrams, network diagrams, and more:

```
"Create a flowchart for user login process"
"Make a UML class diagram for the User class"
"Design a network topology with 3 servers connected to a cloud"
```

- **Shape types** — Flowchart: process, decision, terminal, data, document, database, preparation · UML: uml-class, uml-usecase, uml-actor · Network: cloud, server · Basic: rectangle, circle, triangle, star
- **Connectors** — smart routing (orthogonal, direct, curved), arrow styles (classic, stealth, diamond, circle, none), animated bolt effect, labels
- **Auto-layout** — hierarchical, force-directed, tree, radial, grid
- **Mermaid** — import existing diagrams with `pinepaper_import_mermaid`

### 🗺️ Maps

Choropleths, region styling, and data-driven map animation via `pinepaper_map`, `pinepaper_map_regions`, `pinepaper_map_animation`, and `pinepaper_map_data`.

### 🔤 Typography

`pinepaper_font` covers font loading and text-to-path work; `pinepaper_create_letter_collage` and `pinepaper_animate_letter_collage` build and animate letterform collages.

### 🔍 Asset Search & Import

Search and import free SVG assets from multiple repositories:

- **SVGRepo**: 500,000+ icons with various licenses
- **OpenClipart**: 151,000+ public domain clipart (CC0)
- **Iconify**: 200,000+ icons from multiple icon sets
- **Font Awesome**: 2,000+ free icons (CC BY 4.0)

### 🖼️ Image Processing & Object Detection

Import images, then use `pinepaper_image_filter`, `pinepaper_lasso`, and `pinepaper_cutout_style` to process them. `pinepaper_detect_objects` runs object detection (with text queries) and can composite results as nodes; `pinepaper_extract_object` pulls a single object out.

### 🧠 Ontology & Validation

The server keeps a design graph of the canvas, so an AI can inspect and critique its own work: `pinepaper_get_canvas_ontology`, `pinepaper_query_ontology`, `pinepaper_analyze_design`, `pinepaper_validate_design`, `pinepaper_validate`, and `pinepaper_validate_scene`.

### 📊 Performance Metrics

Built-in performance tracking helps AI assistants optimize workflows:

- Automatic timing for all tool operations
- Phase breakdown (validation, code generation, execution, screenshots)
- Export formats: summary, detailed JSON, CSV
- Self-optimization through `pinepaper_get_performance_metrics`

### 📊 Training Data Export

Generate instruction/code pairs for LLM fine-tuning:

```json
{
  "instruction": "moon orbits earth at radius 100",
  "code": "app.addRelation('item_1', 'item_2', 'orbits', {radius: 100})"
}
```

## Tools Reference

All 154 tools, grouped by the tag used for toolkit filtering.

### Canvas (`canvas`)
| Tool | Description |
|------|-------------|
| `pinepaper_set_background_color` | Set background color |
| `pinepaper_set_canvas_size` | Set canvas dimensions |
| `pinepaper_get_canvas_size` | Read canvas dimensions |
| `pinepaper_clear_canvas` | Clear the canvas |
| `pinepaper_refresh_page` | Reload the studio page |
| `pinepaper_background` | Manage background layers |

### Item Creation (`core`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_item` | Create text, shapes, graphics |
| `pinepaper_modify_item` | Change item properties |
| `pinepaper_delete_item` | Remove an item |
| `pinepaper_create_grid` | Create items in a grid layout |
| `pinepaper_create_glossy_sphere` | Create 3D glossy sphere effect |
| `pinepaper_create_diagonal_stripes` | Create diagonal stripe pattern |
| `pinepaper_geometry` | Geometric construction primitives |
| `pinepaper_group` | Group / ungroup / break apart |
| `pinepaper_arrange` | Z-order: bring forward/back/front/back |
| `pinepaper_path` | Booleans, simplify, outline stroke, repeat patterns, lock |

### Batch (`batch`)
| Tool | Description |
|------|-------------|
| `pinepaper_batch_create` | Create multiple items at once |
| `pinepaper_batch_modify` | Modify multiple items at once |

### Import (`import`)
| Tool | Description |
|------|-------------|
| `pinepaper_import_motion_capture` | Import or retarget a BVH motion-capture clip |
| `pinepaper_import_svg` | Import SVG markup |
| `pinepaper_import_image` | Import a raster image |
| `pinepaper_detect_objects` | Detect objects in an image (text queries, composite as nodes) |
| `pinepaper_extract_object` | Extract a detected object |

### Assets (`assets`)
| Tool | Description |
|------|-------------|
| `pinepaper_search_assets` | Search SVG assets across repositories |
| `pinepaper_import_asset` | Import asset from search results |

### Relations (`relations`)
| Tool | Description |
|------|-------------|
| `pinepaper_add_relation` | Create a behavioral relationship |
| `pinepaper_remove_relation` | Remove a relationship |
| `pinepaper_query_relations` | Find existing relations |
| `pinepaper_register_custom_relation` | Register a custom relation type |

### Animation (`animation`)
| Tool | Description |
|------|-------------|
| `pinepaper_sound` | Synthesis: tones, chords, SFX, sound-as-waveform-path |
| `pinepaper_motion` | Generator motion engine: group and field motions |
| `pinepaper_animate` | Apply a simple loop animation |
| `pinepaper_keyframe_animate` | Timed keyframe animation |
| `pinepaper_play_timeline` | Control playback, rate, progress, scroll-driven scrubbing |
| `pinepaper_stagger` | Shape a delay across many items |
| `pinepaper_flip` | Animate a layout change without describing the motion |
| `pinepaper_get_animatable_properties` | List animatable properties |
| `pinepaper_get_available_easings` | List easing functions |
| `pinepaper_construction_sequence` | Staged construction animation |

### Masks (`masks`)
| Tool | Description |
|------|-------------|
| `pinepaper_apply_animated_mask` | Apply an animated mask |
| `pinepaper_apply_custom_mask` | Apply a custom mask |
| `pinepaper_remove_mask` | Remove a mask |
| `pinepaper_get_mask_types` | List mask types |
| `pinepaper_get_mask_animations` | List mask animations |

### Camera (`camera`)
| Tool | Description |
|------|-------------|
| `pinepaper_camera` | Camera state control |
| `pinepaper_camera_animate` | Animate the camera |
| `pinepaper_camera_director` | Shot-level camera direction |

### Scene & Events (`scene`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_scene` | Create a scene |
| `pinepaper_manage_scenes` | Manage scenes |
| `pinepaper_scene_playback` | Scene playback control |
| `pinepaper_scene_graph` | Interactive story / quiz card scene graph |
| `pinepaper_sequence` | Relative timeline positions for a run of clips |
| `pinepaper_sequence` | Relative timeline positions for a run of clips |
| `pinepaper_event` | Create / pulse event channels for scene chains |

### Generators, Effects & Filters
| Tool | Description |
|------|-------------|
| `pinepaper_execute_generator` | Run a background generator |
| `pinepaper_list_generators` | List available generators |
| `pinepaper_apply_effect` | Apply sparkle, blast, and other effects |
| `pinepaper_text_effect` | 37 character-level text animations; replaces the text with one keyframed item per character |
| `pinepaper_add_filter` | Add an image filter |

### Editing (`selection`, `transform`, `history`)
| Tool | Description |
|------|-------------|
| `pinepaper_selection` | Selection management |
| `pinepaper_transform` | Transform items — fit to frame, nudge, flip, reorder |
| `pinepaper_history` | Undo / redo |
| `pinepaper_compose` | Arrange items into a named collage pattern and film it |
| `pinepaper_design_medium` | What makes the marks — media with honest fidelity, and needlepainting |
| `pinepaper_brand_kit` | Apply brand colours / fonts by role, with a contrast audit |
| `pinepaper_component` | Reusable master + instances, with per-instance overrides |
| `pinepaper_artboard` | Resize the artboard; per-item reflow constraints |
| `pinepaper_comment` | Notes pinned to an item, a point and/or a moment |
| `pinepaper_provenance` | Where an item came from; what depends on it |
| `pinepaper_scene_diff` | What changed between two scene states |
| `pinepaper_audio_beats` | Detect beats; bake an item's animation onto them |
| `pinepaper_template_params` | Templates with typed, coerced inputs |
| `pinepaper_render_batch` | One creative per data row: apply the row, export it |

### Image Processing (`image_processing`)
| Tool | Description |
|------|-------------|
| `pinepaper_image_filter` | Apply image filters |
| `pinepaper_crop_image` | Crop an image to a rect (optional aspect ratio) |
| `pinepaper_chroma_key` | Key out a background color (auto-estimates threshold) |
| `pinepaper_shatter_image` | Split a raster into a tile grid (inert until animated; group adopts the original id) |
| `pinepaper_lasso` | Lasso selection on images |
| `pinepaper_cutout_style` | Cutout styling |

### Composition (`precomp`, `deform`, `sprite`, `interaction`)
| Tool | Description |
|------|-------------|
| `pinepaper_precomp` | Pre-composition management |
| `pinepaper_deform` | Deformation tools |
| `pinepaper_sprite_sheet` | Sprite sheet handling |
| `pinepaper_interaction` | Click, hover, and drag interactions |

### Data Visualization (`dataviz`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_chart` | Create a chart |
| `pinepaper_equation_path` | Function / parametric / Fourier equation paths |

### Diagram (`diagram`)
| Tool | Description |
|------|-------------|
| `pinepaper_create_diagram_shape` | Create flowchart/UML/network shapes with ports |
| `pinepaper_connect` | Connect items with smart connectors |
| `pinepaper_connect_ports` | Connect specific ports on items |
| `pinepaper_add_ports` | Add connection ports to items |
| `pinepaper_auto_layout` | Auto-arrange items using layout algorithms |
| `pinepaper_get_diagram_shapes` | List available diagram shapes |
| `pinepaper_update_connector` | Update connector style/label |
| `pinepaper_remove_connector` | Remove a connector |
| `pinepaper_diagram_mode` | Control diagram editing mode |
| `pinepaper_import_mermaid` | Import a Mermaid diagram |

### Map (`map`)
| Tool | Description |
|------|-------------|
| `pinepaper_map` | Create / configure a map |
| `pinepaper_map_regions` | Region styling and selection |
| `pinepaper_map_animation` | Animate a map |
| `pinepaper_map_data` | Bind data to a map |
| `pinepaper_globe` | Globe mode + world tour |

### Media (`media`)
| Tool | Description |
|------|-------------|
| `pinepaper_media` | Video/audio + editing: upload, trim, time remap / speed ramps, match cut, track matte (live) |

### Rigging (`rigging`)
| Tool | Description |
|------|-------------|
| `pinepaper_rigging` | Skeletons, bones, IK, breakdown poses; BVH mocap import/retarget, Spine import |
| `pinepaper_import_layered_character` | Decomposed character layers → role-bound parts (blink/smile work immediately) |
| `pinepaper_design_system` | DTCG design systems + 18 composable aesthetic styles |
| `pinepaper_stick` | The vendored stick-figure kit: figure and set |
| `pinepaper_story` | Prose becomes a scene: distill, assemble, plan a book |
| `pinepaper_character` | Place a figure from the design graph and direct it with beats — no geometry, no bones, no poses |

### Typography (`font`, `letter_collage`)
| Tool | Description |
|------|-------------|
| `pinepaper_font` | Font loading and text-to-path |
| `pinepaper_text_style` | Display text styles (stacked-layer titles) + variable-font axes |
| `pinepaper_create_letter_collage` | Create a letterform collage |
| `pinepaper_animate_letter_collage` | Animate a letterform collage |

### Simulation & Utilities (`magic`, `physics`, `measurement`, `template`)
| Tool | Description |
|------|-------------|
| `pinepaper_magic` | High-level "make it look good" helpers |
| `pinepaper_physics` | Physics simulation |
| `pinepaper_game` | Game logic: A* pathfinding (feeds moves_along_path) + tilemaps with collision rects |
| `pinepaper_world3d` | 3D world under the canvas: terrain presets, live-sprite actors, follow/orbit camera |
| `pinepaper_measurement` | Measurement and annotation |
| `pinepaper_apply_template` | Apply a scene template |

### Query (`query`)
| Tool | Description |
|------|-------------|
| `pinepaper_get_items` | Get canvas items |
| `pinepaper_get_relation_stats` | Relation statistics |
| `pinepaper_query` | General canvas query |
| `pinepaper_query_capabilities` | Query and recommend capabilities |

### Ontology (`ontology`)
| Tool | Description |
|------|-------------|
| `pinepaper_get_canvas_ontology` | Get the canvas design graph |
| `pinepaper_query_ontology` | Query the design graph |
| `pinepaper_analyze_design` | Analyze design quality |
| `pinepaper_validate_design` | Validate against design rules |
| `pinepaper_validate` | General validation |
| `pinepaper_accessibility_check` | Text contrast and flashing (WCAG), as a heuristic screen |
| `pinepaper_validate_scene` | Validate scene integrity |
| `pinepaper_instantiate_ontology` | Compile a pp: design graph into a scene |
| `pinepaper_lint_scene` | Relational-density audit + structural-relation suggestions |

### Export (`export`)
| Tool | Description |
|------|-------------|
| `pinepaper_export_svg` | Export animated SVG |
| `pinepaper_export_scene` | Export the scene |
| `pinepaper_export_training_data` | Export LLM training pairs |
| `pinepaper_export_widget` | Export an embeddable widget |
| `pinepaper_export_widget_html` | Export widget HTML |
| `pinepaper_capture_frames` | Capture deterministic frames |

### Agent Flow (`agent`)
| Tool | Description |
|------|-------------|
| `pinepaper_agent_start_job` | Start a content creation job session |
| `pinepaper_agent_end_job` | End job with summary and recommendations |
| `pinepaper_agent_reset` | Quick canvas reset without page refresh |
| `pinepaper_agent_batch_execute` | Execute multiple operations in batch |
| `pinepaper_interchange` | Lottie, dotLottie, GLB, BVH, PNG sequence |
| `pinepaper_agent_export` | Smart export with platform auto-detection |
| `pinepaper_export_store` | Recover an export the studio is still holding — list, save to a file, or release |
| `pinepaper_agent_analyze` | Analyze content for export recommendations |

### Browser (`browser`)
| Tool | Description |
|------|-------------|
| `pinepaper_browser_connect` | Connect to the studio |
| `pinepaper_browser_disconnect` | Disconnect |
| `pinepaper_browser_screenshot` | Take a screenshot |
| `pinepaper_browser_status` | Connection status |

### Guide & Diagnostics
| Tool | Description |
|------|-------------|
| `pinepaper_tool_guide` | Server-side guide to the tool surface |
| `pinepaper_set_toolkit` | Switch toolkit profile at runtime |
| `pinepaper_get_performance_metrics` | Get execution timing metrics |
| `pinepaper_diagnostic_report` | Diagnostic report |

### Escape Hatches (`custom_code`, `p5`, `register`)
| Tool | Description |
|------|-------------|
| `pinepaper_execute_custom_code` | Run custom code against the app |
| `pinepaper_p5_draw` | p5.js-style drawing |
| `pinepaper_register_item` | Register an externally created item |

## Examples

### Solar System

```
1. Create a yellow circle as the sun (radius 60) at center
2. Create a blue circle as Earth (radius 20)
3. Create a gray circle as the Moon (radius 8)
4. Add relation: Earth orbits Sun at radius 151, speed 0.3
5. Add relation: Moon orbits Earth at radius 40, speed 0.8
```

### Animated Logo

```
1. Create text "BRAND" with font size 96
2. Apply pulse animation with speed 0.5
3. Apply sparkle effect with gold color
4. Add sunburst background
```

### Following Labels

```
1. Create a circle as "player"
2. Create text "Player 1" as the label
3. Add relation: label follows player with offset [0, -50]
```

### Event-Driven Scene Chain

```
1. Create events e0, e1, e2 (one per beat)
2. Chain them: on_event_fire_after e0 → e1 (delay 2000, timeline: canvas)
3. Chain: on_event_fire_after e1 → e2 (delay 2000, timeline: canvas)
4. Give beat 1 a reaction: on_event_add_relation e1 → planet (type: orbits)
5. Give beat 2 a reaction: on_event_set_color e2 → planet (color: #ff3300)
6. Pulse e0 to start — the whole chain is scrub- and replay-stable
```

### Flowchart Diagram

```
1. Create a terminal shape with label "Start"
2. Create a process shape with label "Get Input"
3. Create a decision shape with label "Valid?"
4. Create a terminal shape with label "End"
5. Connect Start → Get Input
6. Connect Get Input → Valid?
7. Connect Valid? → End (label: "Yes")
8. Connect Valid? → Get Input (label: "No", routing: curved)
9. Apply hierarchical auto-layout
```

### Network Diagram

```
1. Create a cloud shape with label "Internet"
2. Create 3 server shapes with labels "Web", "API", "DB"
3. Connect Internet → Web (label: "HTTPS")
4. Connect Web → API (label: "REST")
5. Connect API → DB (label: "SQL")
6. Apply force-directed auto-layout
```

## Architecture

The server does not draw anything itself. It validates a tool call, generates JavaScript that calls PinePaper Studio's `app.*` API, and executes it in the browser — so the studio app stays the single source of truth for behavior.

```
┌─────────────────────────────────────────────────────────────┐
│                 AI Client (Claude, etc.)                    │
│                          │                                  │
│                    MCP Protocol                             │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │  PinePaper MCP Server │                      │
│              │  ┌─────────────────┐  │                      │
│              │  │  Tool Handlers  │  │  validate + route    │
│              │  └────────┬────────┘  │                      │
│              │           │           │                      │
│              │  ┌────────▼────────┐  │                      │
│              │  │ Code Generator  │  │  emit app.* calls    │
│              │  └────────┬────────┘  │                      │
│              └───────────┼───────────┘                      │
│                          │                                  │
│              ┌───────────▼───────────┐                      │
│              │   PinePaper Studio    │  execute in browser  │
│              │   (Browser/App)       │                      │
│              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

## Development

### Setup

> Installing pulls Chrome down through Puppeteer (~320 MB). If that is more than
> the machine can spare, [cloud.pinepaper.studio](https://cloud.pinepaper.studio)
> runs the same server over HTTP with nothing to install.

```bash
git clone https://github.com/pinepaper/mcp-server.git
cd mcp-server

# Using npm
npm install
npm run build

# Using bun (recommended)
bun install
bun run build
```

### Test with MCP Client (Local)

1. Build the server:
   ```bash
   bun run build
   ```

2. Add to your MCP client config (example for Claude Desktop on macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "pinepaper": {
         "command": "node",
         "args": ["/full/path/to/mcp-server/dist/cli.js"]
       }
     }
   }
   ```

3. Restart your MCP client

4. Test with: "What PinePaper tools do you have available?"

### Run Tests

Tests run on the Bun test runner.

```bash
bun test

# With coverage
bun test --coverage

# Typecheck
bun run typecheck
```

### Manifest Check

`manifest.json`'s `tools[]` must stay in sync with the served tool surface. This is enforced on publish (`prepublishOnly`), and you can run it directly:

```bash
bun run check:manifest   # verify
bun run fix:manifest     # rewrite manifest to match source
```

### Development Watch Mode

```bash
bun run dev
```

## Internationalization (i18n)

PinePaper MCP Server supports 51 languages, providing localized tool descriptions and messages for AI agents.

### Supported Languages

| Category | Languages |
|----------|-----------|
| **European** | English, Spanish, French, German, Italian, Portuguese (+ Brazilian), Dutch, Polish, Russian, Ukrainian, Swedish, Danish, Norwegian, Finnish, Czech, Greek, Hungarian, Romanian, Turkish, Icelandic |
| **East Asian** | Chinese (Simplified & Traditional), Japanese, Korean |
| **Southeast Asian** | Thai, Vietnamese, Indonesian, Malay, Tagalog, Filipino |
| **South Asian** | Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Urdu |
| **Middle Eastern** | Arabic, Hebrew, Persian (RTL support) |
| **Indigenous (Canada)** | Chipewyan, Cree, Michif, Inuktitut, Mi'kmaq, Mohawk, Ojibwe |

### Setting Language

Set the `PINEPAPER_LOCALE` environment variable:

```json
{
  "mcpServers": {
    "pinepaper": {
      "command": "npx",
      "args": ["-y", "@pinepaper.studio/mcp-server"],
      "env": {
        "PINEPAPER_LOCALE": "ja"
      }
    }
  }
}
```

Or programmatically:

```typescript
import { setLocale, t } from '@pinepaper.studio/mcp-server';

setLocale('fr');
const description = t('tools.pinepaper_create_item.description');
```

### Adding New Languages

1. Create a new locale file in `src/i18n/locales/` (e.g., `xx.ts`)
2. Copy the structure from `en.ts`
3. Translate all strings
4. Export from `src/i18n/locales/index.ts`
5. Add to the `localeMap`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PINEPAPER_STUDIO_URL` | PinePaper Studio URL to connect to (`/editor` is appended automatically) | `https://pinepaper.studio` |
| `PINEPAPER_HEADLESS` | Run the browser headless (set `false` to watch it work) | `true` |
| `PINEPAPER_EXECUTION_MODE` | `puppeteer` (execute in a real browser) or `code` (return generated code only) | `puppeteer` |
| `PINEPAPER_EXPORT_DIR` | Directory for exported files | `<tmpdir>/pinepaper-exports` |
| `PINEPAPER_LOCALE` | Language locale code | `en` |
| `PINEPAPER_TOOLKIT` | Toolkit profile (`full`/`agent`/`diagram`/`map`/`font`/`minimal`) | auto-detected |
| `PINEPAPER_TOOLS` | Explicit comma-separated tool allowlist | unset |
| `PINEPAPER_VERBOSITY` | Description verbosity (`verbose`/`compact`/`minimal`) | `compact` |
| `PINEPAPER_TOOL_VERBOSITY` | Deprecated alias for `PINEPAPER_VERBOSITY` | unset |
| `PINEPAPER_METRICS_ENABLED` | Enable performance metrics tracking | `true` |
| `PINEPAPER_METRICS_RETENTION` | Max metrics to retain in memory | `1000` |
| `PINEPAPER_SCREENSHOT_MODE` | Screenshot mode (`on_request`/`always`/`never`) | `on_request` |
| `PINEPAPER_WAIT_UNTIL` | What a navigation waits for (`load`/`domcontentloaded`/`networkidle0`/`networkidle2`) | `domcontentloaded` |
| `PINEPAPER_TIMEOUT` | Navigation and readiness timeout, in ms | `30000` |
| `PINEPAPER_PROXY` | Chrome `--proxy-server` value; also ignores certificate errors, for an intercepting proxy | unset |
| `PINEPAPER_EXPORT_TIMEOUT` | Governor budget for an export run, in ms (raise `PINEPAPER_TIMEOUT` alongside it) | `300000` |
| `PINEPAPER_GOVERNOR` | `off` runs code by raw eval — no governor report, no error codes, no seeded determinism | on |

Behind a proxy, or against a Studio with analytics or polling connections open,
`networkidle2` may never settle: set `PINEPAPER_WAIT_UNTIL` only if you need the
old behaviour back. Readiness does not depend on it — the connection waits for
Studio's `app.create` either way.

### Performance Metrics

**Key Features:**
- ⚡ Automatic timing for all tool operations
- 📊 Phase breakdown (validation, code generation, browser execution, screenshots)
- 🎯 Real-time query via `pinepaper_get_performance_metrics` tool
- 📈 Export formats: summary, JSON, CSV
- 💾 In-memory storage (resets on restart)
- 🚀 Minimal overhead (~1ms per operation)

**Quick Example:**

```
AI: "Let me check if batch operations are faster"
→ pinepaper_get_performance_metrics(format: 'summary')

Result:
  - pinepaper_create_item: avg 145ms
  - pinepaper_batch_create (10 items): avg 298ms (~30ms per item)

AI: "I'll use batch_create for the next 20 items"
```

**Configuration:**

```bash
# Disable metrics if not needed
export PINEPAPER_METRICS_ENABLED=false

# Increase retention for long sessions
export PINEPAPER_METRICS_RETENTION=5000
```

**Learn More:** See [docs/PERFORMANCE_METRICS.md](docs/PERFORMANCE_METRICS.md) for complete documentation.

## Documentation

### Guides

- **[Workflow Guide](docs/WORKFLOW_GUIDE.md)** — Decision trees, multi-step patterns, performance optimization, and troubleshooting
- **[Performance Metrics](docs/PERFORMANCE_METRICS.md)** — In-memory metrics system for AI self-optimization
- **[Testing Guide](TESTING_GUIDE.md)** — Test layout and conventions
- **[PinePaper Reference](https://pinepaper.studio/api/)** — Complete PinePaper Studio API reference

### External Documentation

- [PinePaper API Docs](https://pinepaper.studio/api/)
- [MCP Tools Specification](https://pinepaper.studio/api/mcp/tools-spec)
- [MCP Server Installation](https://pinepaper.studio/api/mcp/installation)
- [User Guide](https://pinepaper.studio/guide/)

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun test`
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [PinePaper Studio](https://pinepaper.studio)
- [Documentation](https://pinepaper.studio/guide/)
- [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)
- [MCP Specification](https://modelcontextprotocol.io)

## Support

- 📧 Email: support@pinepaper.studio
- 🐛 Issues: [GitHub Issues](https://github.com/pinepaper/mcp-server/issues)

---

Made with ❤️ by the PinePaper team
