# PinePaper Studio Public Verification Harness

Self-contained, reproducible verification scripts under `scripts/acceptance/` so external agents, contributors, and CI pipelines can independently verify PinePaper Studio's MCP server (`core` default + `PINEPAPER_TOOLKIT=lane`), token budgets, schema/ontology checks, and live MP4 rendering.

## Quick Start

### 1. Fast Offline Verification (No Browser / FFmpeg Required)
```bash
bun scripts/acceptance/public-verification-harness.ts --offline
# or via package.json script:
bun run verify:public:offline
```

Optionally check a local `FxTool` checkout at the same time:
```bash
bun scripts/acceptance/public-verification-harness.ts --offline --partner-fxtool ../FxTool
```

### 2. Full End-to-End Studio Verification (Serialized Browser + FFmpeg)
Build `FxTool` (`dist/`), then run the full harness against that static build:
```bash
bun scripts/acceptance/public-verification-harness.ts --studio-dist ../FxTool/dist --out /tmp/pp-verify-report
```

> **Concurrency & Resource Discipline:** Headless Chromium / WebCodecs MP4 exports are CPU- and memory-intensive. All live Studio checks in `public-verification-harness.ts` run **serially** (one MCP session and one headless Chrome instance at a time, with `PINEPAPER_HEADLESS=true` and `NODE_OPTIONS=--max-old-space-size=2048`). When invoking Playwright alongside Studio tests, always pass `--workers=1`.

---

## Scripts Reference

### `public-verification-harness.ts`
Unified public verification entrypoint.

- **Offline checks (`--offline`)**:
  1. **Zero-leakage gate**: Verifies `package.json` and tracked repository files pass `scripts/check-no-competitors.mjs`.
  2. **`core` MCP default preserved**: Confirms `DEFAULT_TOOLKIT === 'core'` and MCP `initialize` + `tools/list` without `PINEPAPER_TOOLKIT` returns the `core` toolset.
  3. **`lane` contract size**: Confirms `PINEPAPER_TOOLKIT=lane` exposes 8 tools (`LANE_TOOL_NAMES`), `tools/list <= 21,500 B`, and instructions + schemas `<= 10,000 tok`.
  4. **`T2` & `N1–N4` budgets + codegen**: Confirms the 36-item `T2` batch (`1920x1080`, 30fps, 8.0s) is `<= 3,500 B` (`<= 875 tok`) and incremental edits `N1–N4` are each `< 150 tok` (`C_total`) and compile cleanly.
  5. **9-way `anchor` parity**: Confirms all 9 anchors (`top-left`, `top`, `top-right`, `left`, `center`, `right`, `bottom-left`, `bottom`, `bottom-right`, plus `centre`) compile and invalid anchors fail listing all 9.
  6. **Declarative `pattern` + GSAP-JSON `timeline` + atomic rollback**: Confirms batch composition emits `addPattern` + `addAnimation` and rolls back created patterns on atomic failure.
  7. **Strict `relationOptions` validation**: Confirms invalid keys such as `orbits` with `angle: 45` are rejected with `"did you mean \"phaseDegrees\"?"`.
  8. **CLI `init` / `setup` / `check --offline`**: Confirms `init` scaffolds `create_many` + `timeline` + `pattern`, `setup` keeps `core` default while exposing `--toolkit lane` and `cloud`, and `check --offline` catches `relationOptions` errors.
- **Live Studio checks (`--studio-dist <dir>` or `PINEPAPER_STUDIO_URL`)**:
  1. `agent-lane-t1.ts --scripted` + `--scripted-naive` negative control.
  2. `agent-lane-t2.ts --scripted` (full `T2` MP4 export + `N1–N4` sequential edits + re-export + `ffprobe`/`ffmpeg` pixel checks).
  3. Live `pinepaper_lint_scene` and `pinepaper-mcp check` verification for `COLLAPSED_GROUP` and `UNINTENDED_OVERLAP` warnings.

Flags:
- `--offline`: Run offline checks only.
- `--studio-dist <dir>`: Serve a built `FxTool` `dist/` on an ephemeral `127.0.0.1` port and run offline + serialized live Studio checks.
- `--partner-fxtool <dir>`: Scan a sibling `FxTool` directory during the offline leakage gate.
- `--out <dir>`: Write `report.json` and Studio run artifacts.
- `--json`: Emit machine-readable JSON to stdout.

### `agent-lane-t1.ts`
Verifies `T1` (`1920x1080`, 30fps, 8.0s, `#0b1026` background, `top-left` title `"SIGNAL / NOISE"`, moving cyan circle) against `PINEPAPER_TOOLKIT=lane` (8 tools) or `--toolkit starter` (5 tools).

```bash
bun scripts/acceptance/agent-lane-t1.ts --scripted --studio-dist ../FxTool/dist
bun scripts/acceptance/agent-lane-t1.ts --scripted-naive --studio-dist ../FxTool/dist
bun scripts/acceptance/agent-lane-t1.ts --verify path/to/t1.mp4
```

### `agent-lane-t2.ts`
Verifies `T2` (`1920x1080`, 30fps, 8.0s, 36-item infographic with `bottom-left` bars, `ring1` 24-dot pattern, `trimEnd` wave) and sequential `N1–N4` delta edits (`< 150 tok` each).

```bash
bun scripts/acceptance/agent-lane-t2.ts --scripted --studio-dist ../FxTool/dist
bun scripts/acceptance/agent-lane-t2.ts --scripted-naive --studio-dist ../FxTool/dist
bun scripts/acceptance/agent-lane-t2.ts --verify path/to/t2.mp4
bun scripts/acceptance/agent-lane-t2.ts --verify-delta path/to/t2-after-n4.mp4
```

### `lane-contract-size.ts`
Reports exact UTF-8 byte and estimated token sizes for `PINEPAPER_TOOLKIT=lane` tools and instructions:
```bash
bun scripts/acceptance/lane-contract-size.ts [--write /tmp/lane-contract.txt]
```

### `serve-studio.ts`
Serves a built `FxTool` `dist/` directory on `127.0.0.1` with clean Cloudflare-Pages-style URLs (`/editor` -> `editor.html`):
```bash
bun scripts/acceptance/serve-studio.ts ../FxTool/dist 8091
```

---

## Acceptance Criteria Summary

| Check | Target |
|---|---|
| Public repo leakage gate | `0` restricted terms (`node scripts/check-no-competitors.mjs`) |
| `core` default toolkit | `DEFAULT_TOOLKIT === 'core'` |
| `lane` `tools/list` size | `<= 21,500 B` (`8` tools) |
| `lane` contract size | `<= 10,000 tok` (`bytes / 4`) |
| `T2` batch source size | `<= 3,500 B` (`<= 875 tok`) |
| `N1–N4` delta edits (`C_total`) | `< 150 tok` each |
| `T1` / `T2` MP4 output | `1920x1080`, `30 fps`, `8.000 s` (`240` frames), clean `ffmpeg` decode + pixel assertions |
| Negative controls (`--scripted-naive`) | Must fail frame/alignment verification |
