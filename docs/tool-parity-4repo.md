# 4-Repo Tool Parity & Drift Audit

Automated comparison across:
1. **FxTool On-Device Spec (`PinePaperToolSpec.js`) & Executor (`ToolCallExecutor.js`)**
2. **FxTool Chrome WebMCP (`webmcp-tools.js` + `landing-tools.js` + `WebMCPBridge.js`)**
3. **`@pinepaper.studio/mcp-server` (`src/tools/definitions.ts` + `engine-lists.ts`)**
4. **`pinepaper-llm-v0` Client SFT Corpus (`data/processed/client-sft/train.jsonl`)**

## Summary Counts

| Surface | Count | Notes |
|---|---:|---|
| FxTool `PinePaperToolSpec.js` (`SCENE_SCHEMA`) | 24 | Constrained Prompt API / WebLLM grammar tools |
| FxTool `ToolCallExecutor.js` (`executeToolCall`) | 28 | Client runtime switch cases |
| FxTool vendored `pinepaper.schema.json` | 11 | Static asset merged additively by `loadSceneSchema` |
| FxTool WebMCP editor (`WEBMCP_TOOLS`) | 32 | 16 direct + 16 forwarded to `ToolCallExecutor` |
| FxTool WebMCP landing (`LANDING_TOOLS`) | 3 | Root discovery tools |
| `@pinepaper.studio/mcp-server` (`PINEPAPER_TOOLS`) | 180 | Source: `dist` |
| `pinepaper-llm-v0` `client-sft/train.jsonl` | 6 tools (2062 rows) | Only 6 of 28 client-executable tools appear in SFT |

## Key Parity Drift Findings

- **Executor tools missing from `PinePaperToolSpec.js` (4):** `pinepaper_create_grid`, `pinepaper_play_timeline`, `pinepaper_import_layered_character`, `pinepaper_estimate_export`
- **`PinePaperToolSpec` tools missing from `mcp-server` (9):** `pinepaper_nudge`, `pinepaper_entrance`, `pinepaper_add_interaction`, `pinepaper_add_tour`, `pinepaper_select`, `pinepaper_create_character`, `pinepaper_character_action`, `pinepaper_character_pose`, `pinepaper_paint_stroke`
- **`ToolCallExecutor` tools missing from `mcp-server` (10):** `pinepaper_select`, `pinepaper_add_interaction`, `pinepaper_add_tour`, `pinepaper_entrance`, `pinepaper_nudge`, `pinepaper_create_character`, `pinepaper_character_action`, `pinepaper_character_pose`, `pinepaper_paint_stroke`, `pinepaper_estimate_export`
- **`ToolCallExecutor` tools not exposed in WebMCP editor (11):** `pinepaper_media`, `pinepaper_add_interaction`, `pinepaper_add_tour`, `pinepaper_set_background_color`, `pinepaper_animate`, `pinepaper_text_effect`, `pinepaper_create_character`, `pinepaper_character_action`, `pinepaper_character_pose`, `pinepaper_world3d`, `pinepaper_paint_stroke`
- **WebMCP direct-only editor tools missing from `mcp-server` (16):** `pinepaper_add_text`, `pinepaper_add_shape`, `pinepaper_animate_selection`, `pinepaper_set_background`, `pinepaper_play_chord`, `pinepaper_play_drum`, `pinepaper_play_sound`, `pinepaper_run_generator`, `pinepaper_fit_view`, `pinepaper_undo`, `pinepaper_redo`, `pinepaper_describe_canvas`, `pinepaper_estimate_export`, `pinepaper_nudge`, `pinepaper_select`, `pinepaper_entrance`
- **`ToolCallExecutor` tools missing from `client-sft/train.jsonl` (22/28):** `pinepaper_import_image`, `pinepaper_detect_objects`, `pinepaper_extract_object`, `pinepaper_select`, `pinepaper_media`, `pinepaper_compose`, `pinepaper_create_grid`, `pinepaper_add_relation`, `pinepaper_add_interaction`, `pinepaper_add_tour`, `pinepaper_text_effect`, `pinepaper_deform`, `pinepaper_entrance`, `pinepaper_play_timeline`, `pinepaper_nudge`, `pinepaper_import_layered_character`, `pinepaper_create_character`, `pinepaper_character_action`, `pinepaper_character_pose`, `pinepaper_world3d`, `pinepaper_paint_stroke`, `pinepaper_estimate_export`
- **WebMCP readiness / Chrome PR #373 (`waitForToolsUntil`):** `WebMCPBridge.js` registers via `document.modelContext.registerTool` (with `navigator.modelContext` fallback) and handles async `registerTool` promise rejection + `AbortController` `{ signal }`; `waitForToolsUntil` is present in `FxTool` (`WebMCPBridge`, `app.js`, `landing-tools.js`).

## Client-Facing Tool Matrix

| Tool Name | ToolSpec (24) | Executor (28) | WebMCP Editor (32) | mcp-server (180) | client-sft Calls |
|---|:---:|:---:|:---:|:---:|---:|
| `pinepaper_add_interaction` | ✅ | ✅ | — | — | 0 |
| `pinepaper_add_relation` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_add_shape` | — | — | direct | — | 0 |
| `pinepaper_add_text` | — | — | direct | — | 0 |
| `pinepaper_add_tour` | ✅ | ✅ | — | — | 0 |
| `pinepaper_animate` | ✅ | ✅ | — | ✅ | 7 |
| `pinepaper_animate_selection` | — | — | direct | — | 0 |
| `pinepaper_character_action` | ✅ | ✅ | — | — | 0 |
| `pinepaper_character_pose` | ✅ | ✅ | — | — | 0 |
| `pinepaper_clear_canvas` | — | — | direct | ✅ | 0 |
| `pinepaper_compose` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_create_character` | ✅ | ✅ | — | — | 0 |
| `pinepaper_create_grid` | — | ✅ | forwarded | ✅ | 0 |
| `pinepaper_create_item` | ✅ | ✅ | forwarded | ✅ | 1261 |
| `pinepaper_deform` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_describe_canvas` | — | — | direct | — | 0 |
| `pinepaper_detect_objects` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_entrance` | ✅ | ✅ | forwarded | — | 0 |
| `pinepaper_estimate_export` | — | ✅ | direct | — | 0 |
| `pinepaper_execute_custom_code` | ✅ | ✅ | forwarded | ✅ | 1602 |
| `pinepaper_execute_generator` | ✅ | ✅ | forwarded | ✅ | 239 |
| `pinepaper_extract_object` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_fit_view` | — | — | direct | — | 0 |
| `pinepaper_import_image` | ✅ | ✅ | forwarded | ✅ | 0 |
| `pinepaper_import_layered_char` | — | — | forwarded | ✅ | 0 |
| `pinepaper_import_layered_character` | — | ✅ | forwarded (pinepaper_import_layered_char) | ✅ | 0 |
| `pinepaper_list_generators` | — | — | direct | ✅ | 0 |
| `pinepaper_media` | ✅ | ✅ | — | ✅ | 0 |
| `pinepaper_modify_item` | ✅ | ✅ | forwarded | ✅ | 7 |
| `pinepaper_nudge` | ✅ | ✅ | forwarded | — | 0 |
| `pinepaper_paint_stroke` | ✅ | ✅ | — | — | 0 |
| `pinepaper_play_chord` | — | — | direct | — | 0 |
| `pinepaper_play_drum` | — | — | direct | — | 0 |
| `pinepaper_play_sound` | — | — | direct | — | 0 |
| `pinepaper_play_timeline` | — | ✅ | forwarded | ✅ | 0 |
| `pinepaper_redo` | — | — | direct | — | 0 |
| `pinepaper_run_generator` | — | — | direct | — | 0 |
| `pinepaper_select` | ✅ | ✅ | forwarded | — | 0 |
| `pinepaper_set_background` | — | — | direct | — | 0 |
| `pinepaper_set_background_color` | ✅ | ✅ | — | ✅ | 116 |
| `pinepaper_set_canvas_size` | — | — | direct | ✅ | 0 |
| `pinepaper_text_effect` | ✅ | ✅ | — | ✅ | 0 |
| `pinepaper_undo` | — | — | direct | — | 0 |
| `pinepaper_world3d` | ✅ | ✅ | — | ✅ | 0 |

## Preset & Enum Parity

| Enum / Surface | PinePaperToolSpec | mcp-server | client-sft | Drift in mcp-server | Missing in client-sft |
|---|---|---|---|---|---|
| `ITEM_TYPES` | 9 | 28 | 11 | — | 1 missing |
| `ANIMATION_TYPES` | 19 | 20 | 5 | — | 15 missing |
| `DEFORM_PRESETS` | 14 | 14 | 0 | — | 14 missing |
| `TEXT_EFFECTS` | 37 | 27 (engine) | 0 | — | 37 missing |
| `ENTRANCE_PRESETS` | 13 | N/A (keyframes/animate) | 0 | — | 13 missing |
| `RELATIONS` | 9 | 97 | 0 | — | 9 missing |
| `GENERATORS` | 22 fallback / 95 asset | 97 | 56 | — | 39 missing |
| `COMPOSITION_OBJECTS` | 16 fallback / 36 asset | different pinepaper_compose | 0 (macro tool unused) | — | — |
| `WORLD3D_ACTIONS` | 4 | 44 | 0 | cube_field, animate_mesh_instances | 4 missing |
| `PAINT_MEDIUMS` | 10 | 0 (no pinepaper_paint_stroke) | 0 | no pinepaper_paint_stroke in mcp-server | 10 missing |

## Parameter & Semantic Drift on Shared Tools

- **`pinepaper_create_item`**
  - SHAPE DRIFT: FxTool uses flat x/y/color/width/height; mcp-server nests position:{x,y} and properties:{...}
  - Only in `PinePaperToolSpec`: `x`, `y`, `from`, `to`, `through`, `radius`, `width`, `height`, `sides`, `points`, `angles`, `content`, `fontSize`, `color`, `strokeColor`, `strokeWidth`, `opacity`, `entrance`
  - Only in `mcp-server`: `screenSpace`, `stepTiming`, `position`, `properties`, `anchor`, `data`, `animationSpeed`, `animationIntensity`, `animationDelay`, `keyframes`
- **`pinepaper_compose`**
  - SEMANTIC DIVERGENCE: FxTool expands named object macro ({object}); mcp-server orchestrates multi-item treatments/patterns/craft
  - Only in `PinePaperToolSpec`: `object`, `x`, `y`, `scale`, `color`, `pose`, `mood`, `accessory`, `setting`, `build`, `headSize`, `seed`
  - Only in `mcp-server`: `register`, `level`, `medium`, `stitch`, `stitchBudget`, `action`, `pattern`, `itemIds`, `treatment`, `rootId`, `applyCamera`, `loop`, `craft`, `reveal`, `revealOptions`, `text`, `assets`, `audio`, `grid`
- **`pinepaper_execute_generator`**
  - ARG DRIFT: FxTool uses `generator`, client-sft uses `name`, mcp-server uses `generatorName` + `params`
  - Only in `PinePaperToolSpec`: `generator`, `colors`, `bgColor`, `mode`, `customText`, `repeatCount`, `rowsCount`, `guidelineType`, `title`, `grade`, `topic`, `exerciseCount`, `includeAnswerKey`, `theme`, `customWords`, `size`, `difficulty`, `shape`, `step`, `showSolution`, `showAnswers`, `complexity`
  - Only in `mcp-server`: `generatorName`, `params`, `region`
- **`pinepaper_modify_item`**
  - SHAPE DRIFT: FxTool uses flat x/y/color/width/height; mcp-server nests position:{x,y} and properties:{...}
  - Only in `PinePaperToolSpec`: `color`, `strokeColor`, `strokeWidth`, `opacity`, `content`, `fontSize`, `itemType`, `sides`, `points`, `animationType`, `x`, `y`
  - Only in `mcp-server`: `screenSpace`, `stepTiming`, `properties`, `data`, `atTime`, `easing`
- **`pinepaper_animate`**
  - Only in `mcp-server`: `delay`
- **`pinepaper_deform`**
  - Only in `mcp-server`: `action`, `loop`, `axis`, `turns`, `waves`, `maxDisplacement`, `speed`, `steps`
- **`pinepaper_text_effect`**
  - Only in `mcp-server`: `action`, `gradient`, `gradientStops`, `gradientDirection`, `gradientSteps`, `keepSource`, `options`
- **`pinepaper_add_relation`**
  - ARG DRIFT: FxTool uses `from`/`to`/`relation`, mcp-server uses `sourceId`/`targetId`/`relationType`
  - Only in `PinePaperToolSpec`: `from`, `to`, `relation`
  - Only in `mcp-server`: `sourceId`, `targetId`, `relationType`, `presetId`, `presetValues`
- **`pinepaper_import_image`**
  - Only in `PinePaperToolSpec`: `imageId`, `x`, `y`
  - Only in `mcp-server`: `opacity`, `blendMode`, `scale`, `loop`, `imageStart`, `position`, `maxEdge`, `nativeSize`, `name`, `mask`, `smoothing`, `shadowColor`, `shadowBlur`, `shadowOffset`
- **`pinepaper_detect_objects`**
  - Only in `mcp-server`: `queries`
- **`pinepaper_media`**
  - Only in `PinePaperToolSpec`: `ids`, `reference`, `type`, `imageSeconds`
  - Only in `mcp-server`: `transition`, `atPlayhead`, `remapTrack`, `segments`, `fromItemId`, `toItemId`, `subject`, `label`, `settle`, `fade`, `consent`, `matteItemId`, `channel`, `invert`, `strength`, `hideMatte`, `live`, `url`, `duration`, `clear`, `thumbnails`, `rate`, `position`, `scale`, `fit`, `timeOffset`, `clipInPoint`, `clipOutPoint`, `volume`, `loop`, `muted`
- **`pinepaper_world3d`**
  - ACTION DRIFT: mcp-server missing world3d actions: cube_field, animate_mesh_instances
  - Only in `PinePaperToolSpec`: `id`, `world`, `cols`, `rows`, `spacing`, `size`, `color`, `motion`, `keyframes`, `loop`
  - Only in `mcp-server`: `spec`, `character`, `control`, `patch`, `actorId`, `sprite`, `live`, `pose`, `camera`, `object`, `pathId`, `mesh`, `meshId`, `light`, `lightId`, `material`, `materialId`, `source`, `importOptions`, `clip`, `crossfade`, `navTarget`, `point`, `origin`, `direction`, `multiplier`, `dx`, `dy`, `body`, `bodyId`, `vector`, `dt`, `from`, `to`, `objectId`

## `client-sft/train.jsonl` Breakdown

- **Rows:** 2062
- **Kinds:** `templated`: 1602, `template-scene`: 126, `typed`: 39, `generator`: 207, `composition`: 88
- **Argument keys observed per tool:**
  - `pinepaper_execute_custom_code` (1602 calls): `code`
  - `pinepaper_set_background_color` (116 calls): `color`
  - `pinepaper_create_item` (1261 calls): `alignment`, `animationSpeed`, `animationType`, `blendMode`, `boltColor`, `boltEnabled`, `boltSpeed`, `color`, `content`, `cornerRadius`, `fillColor`, `fontColor`, `fontFamily`, `fontSize`, `fontStyle`, `fontWeight`, `headStyle`, `height`, `itemType`, `label`, `letterSpacing`, `lineColor`, `lineWidth`, `opacity`, `points`, `radius`, `radius1`, `radius2`, `rotation`, `routing`, `shadowBlur`, `shadowColor`, `shapeType`, `sides`, `sourceId`, `strokeColor`, `strokeWidth`, `targetId`, `width`, `x`, `y`
  - `pinepaper_animate` (7 calls): `animationType`, `itemId`
  - `pinepaper_execute_generator` (239 calls): `bgColor`, `color1`, `color2`, `colors`, `name`
  - `pinepaper_modify_item` (7 calls): `color`, `itemId`, `opacity`
