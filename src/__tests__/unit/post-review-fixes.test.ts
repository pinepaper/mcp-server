/**
 * Regression tests for the 5 public-MCP review fixes shipped in 726fea4.
 *
 * One describe-block per finding so a future regression points at the right
 * blocker by name.
 */

import { describe, it, expect } from 'bun:test';
import { sameStudioTarget, validateStudioUrl } from '../../browser/url-target.js';
import { CameraAnimatesParamsSchema, RelationTypeSchema } from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';

// =============================================================================
// #1 — browser_connect URL change-detection (port-prefix bug)
// =============================================================================

describe('sameStudioTarget — review fix #1 (port-prefix bug)', () => {
  // The original failing case: substring indexOf treated ":30000" as
  // containing ":3000" and silently skipped reconnection.
  it('detects port-prefix mismatch as a different target', () => {
    expect(
      sameStudioTarget(
        'http://localhost:30000/editor?agent=1&mode=agent',
        'http://localhost:3000'
      )
    ).toBe(false);
  });

  it('detects the reverse port-prefix mismatch', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'http://localhost:30000'
      )
    ).toBe(false);
  });

  it('treats stored "/editor?agent=…" as same target when caller passes bare origin (idempotent reconnect)', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'http://localhost:3000'
      )
    ).toBe(true);
  });

  it('matches when caller supplies /editor explicitly', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'http://localhost:3000/editor'
      )
    ).toBe(true);
  });

  it('ignores a single trailing slash on user input', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'http://localhost:3000/'
      )
    ).toBe(true);
  });

  it('detects scheme mismatch (http vs https)', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'https://localhost:3000'
      )
    ).toBe(false);
  });

  it('detects host mismatch', () => {
    expect(
      sameStudioTarget(
        'http://localhost:3000/editor?agent=1&mode=agent',
        'http://staging:3000'
      )
    ).toBe(false);
  });

  it('detects prod vs local mismatch', () => {
    expect(
      sameStudioTarget(
        'https://pinepaper.studio/editor?agent=1&mode=agent',
        'http://localhost:3000'
      )
    ).toBe(false);
  });

  it('returns true when both inputs are undefined (nothing to compare)', () => {
    expect(sameStudioTarget(undefined, undefined)).toBe(true);
  });

  it('returns false when only one side is defined', () => {
    expect(sameStudioTarget('http://localhost:3000/editor', undefined)).toBe(false);
    expect(sameStudioTarget(undefined, 'http://localhost:3000')).toBe(false);
  });

  it('falls back to string equality on unparseable URL', () => {
    expect(sameStudioTarget('not-a-url', 'not-a-url')).toBe(true);
    expect(sameStudioTarget('not-a-url', 'also-bad')).toBe(false);
  });
});

// =============================================================================
// #5 — Studio URL scheme allow-list
// =============================================================================

describe('validateStudioUrl — review fix #5 (scheme allow-list)', () => {
  it('accepts http://', () => {
    const v = validateStudioUrl('http://localhost:3000');
    expect(v.ok).toBe(true);
  });

  it('accepts https://', () => {
    const v = validateStudioUrl('https://pinepaper.studio');
    expect(v.ok).toBe(true);
  });

  it('rejects file://', () => {
    const v = validateStudioUrl('file:///etc/passwd');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain('file:');
  });

  it('rejects javascript:', () => {
    const v = validateStudioUrl('javascript:alert(1)');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain('javascript:');
  });

  it('rejects data:', () => {
    const v = validateStudioUrl('data:text/html,<script>alert(1)</script>');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain('data:');
  });

  it('rejects malformed URLs', () => {
    const v = validateStudioUrl('not a url at all');
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.error).toContain('Invalid');
  });
});

// =============================================================================
// #2 + #4 — letter_collage codegen (success:true masking, comment injection)
// =============================================================================

describe('letter_collage codegen — review fixes #2 and #4', () => {
  const code = codeGenerator.generateCreateLetterCollage({
    text: 'hello',
    fontSize: 48,
    fontFamily: 'Arial',
    spacing: 0.5,
    cornerRadius: 4,
    shadowEnabled: false,
  });

  it('returns success: false when collageId cannot be resolved (fix #2)', () => {
    // The new failure branch must exist; previously the IIFE returned
    // { success: true, collageId: null } unconditionally.
    expect(code).toContain('if (!collageId)');
    expect(code).toContain("success: false");
    expect(code).toContain('createLetterCollage returned no id');
  });

  it('does not interpolate raw text into the leading // comment (fix #4)', () => {
    // The comment is now static. The first non-whitespace line of the
    // generated code must NOT contain the user-supplied text — otherwise
    // a newline in text could break out and inject code.
    const leadingComment = code.split('\n').find((l) => l.startsWith('//')) || '';
    expect(leadingComment).not.toContain('hello');
  });

  it('keeps text safely JSON.stringify-escaped in the runtime value', () => {
    // The actual text usage on line `const text = ${JSON.stringify(text)}`
    // must remain — it's the safe interpolation point.
    expect(code).toContain('const text = "hello"');
  });

  it('survives a text containing a newline + injection attempt without breaking out of the comment', () => {
    const evil = 'hi\n  app.deleteAll(); //';
    const code = codeGenerator.generateCreateLetterCollage({
      text: evil,
      fontSize: 48,
      fontFamily: 'Arial',
      spacing: 0.5,
      cornerRadius: 4,
      shadowEnabled: false,
    });
    // The newline in `text` must be JSON-escaped to "\n" so the const text =
    // "..." line stays on one line — no real newline can break out of the
    // string literal into executable code.
    expect(code).toContain('const text = "hi\\n  app.deleteAll(); //";');
    // The dangerous substring must NEVER appear in the leading comment
    // (which is now static — that's the actual fix).
    const leadingComment = code.split('\n').find((l) => l.startsWith('//')) || '';
    expect(leadingComment).not.toContain('app.deleteAll');
    // Round-trip sanity: the generated code parses as valid JS.
    expect(() => new Function('app', code)).not.toThrow();
  });
});

// =============================================================================
// #3 — camera_animate schema sync
// =============================================================================

describe('CameraAnimatesParamsSchema — review fix #3 (mode/target dropped)', () => {
  it('does not include mode or target in its shape', () => {
    // Zod's .shape exposes the declared keys.
    const keys = Object.keys(CameraAnimatesParamsSchema.shape);
    expect(keys).not.toContain('mode');
    expect(keys).not.toContain('target');
  });

  it('strips mode/target when present in input (graceful for old clients)', () => {
    const parsed = CameraAnimatesParamsSchema.parse({
      keyframes: [],
      duration: 2,
      mode: 'fly_to',
      target: { x: 100, y: 200 },
    });
    // Default Zod parsing strips unknown keys silently — confirm that's what
    // happens here, so a stale client sending old fields does not error.
    expect((parsed as Record<string, unknown>).mode).toBeUndefined();
    expect((parsed as Record<string, unknown>).target).toBeUndefined();
  });
});

// =============================================================================
// FxTool alignment regression — new relations are wired everywhere
// =============================================================================

describe('Relation alignment — group_morphs_to + moves_along_path', () => {
  it('includes both new relations in RelationTypeSchema', () => {
    expect(RelationTypeSchema.options).toContain('group_morphs_to');
    expect(RelationTypeSchema.options).toContain('moves_along_path');
  });
});

// =============================================================================
// agent_export MP4/WebM bitrate fix
// =============================================================================

// =============================================================================
// 1.5.5 — MCP→FxTool symbol mismatches
// =============================================================================

describe('Mask codegen — FxTool symbol mismatches (1.5.5)', () => {
  // FxTool exposes app.applyMask/applyAnimatedMask/removeMask as convenience
  // wrappers (PinePaper.js:6822-6859), plus app.maskingSystem.applyCustomMask
  // for keyframe-based masks. Pre-1.5.5 the codegen called the non-existent
  // app.maskSystem.* — "Masks aren't available in this build" was always thrown.

  it('batch_execute apply_mask: resolves item from id and calls app.applyAnimatedMask(item, preset, options)', () => {
    const code = codeGenerator.generateAgentBatchExecute({
      operations: [{ type: 'apply_mask', itemId: '$0', maskPreset: 'iris', maskOptions: { duration: 1.2 } }],
    });
    expect(code).not.toContain('app.maskSystem');
    expect(code).toContain('app.getItemById(targetId)');
    expect(code).toContain("app.applyAnimatedMask(item, 'iris'");
    expect(code).toContain('"duration":1.2');
  });

  it('pinepaper_apply_mask: uses app.applyAnimatedMask with positional preset', () => {
    const code = codeGenerator.generateApplyAnimatedMask({
      itemId: 'item_5',
      preset: 'wipeLeft',
      options: { duration: 0.8 },
    });
    expect(code).not.toContain('app.maskSystem');
    expect(code).toContain("app.applyAnimatedMask(item, 'wipeLeft'");
    expect(code).toContain('app.getItemById');
  });

  it('pinepaper_apply_mask (custom keyframes): routes to app.maskingSystem.applyCustomMask with positional args', () => {
    const code = codeGenerator.generateApplyAnimatedMask({
      itemId: 'item_5',
      maskType: 'star',
      keyframes: [{ time: 0, properties: {} }, { time: 1, properties: {} }],
    });
    expect(code).toContain('app.maskingSystem.applyCustomMask(item,');
  });

  it('pinepaper_apply_custom_mask: uses maskingSystem.applyCustomMask with positional args (item, type, keyframes, opts)', () => {
    const code = codeGenerator.generateApplyCustomMask({
      itemId: 'item_5',
      maskType: 'star',
      keyframes: [{ time: 0, properties: {} } as any, { time: 1, properties: {} } as any],
      maskOptions: { repeat: 2 },
    } as any);
    expect(code).not.toContain('app.maskSystem');
    expect(code).toContain('app.maskingSystem.applyCustomMask(item,');
    expect(code).toContain("'star'");
    expect(code).toContain('app.getItemById');
  });

  it('pinepaper_remove_mask: resolves item and passes the masked group to app.removeMask', () => {
    const code = codeGenerator.generateRemoveMask({ itemId: 'item_5' });
    expect(code).not.toContain('app.maskSystem');
    expect(code).toContain('app.removeMask(maskedGroup)');
    expect(code).toContain('app.getItemById');
  });
});

describe('Widget export codegen — route through app.exportEngine (1.5.5)', () => {
  // Pre-1.5.5 the codegen called app.exportWidget(opts) / app.exportWidgetHTML(opts)
  // directly on the app object, but FxTool only exposes these on app.exportEngine
  // (ExportEngine.js:4351, 4747). Result: every export_widget* call returned
  // "Widget export not available".

  it('pinepaper_export_widget: calls app.exportEngine.exportWidget', () => {
    const code = codeGenerator.generateExportWidget({ download: false } as any);
    expect(code).not.toMatch(/app\.exportWidget\(/);
    expect(code).toContain('app.exportEngine.exportWidget(');
  });

  it('pinepaper_export_widget_html: calls app.exportEngine.exportWidgetHTML', () => {
    const code = codeGenerator.generateExportWidgetHtml({ download: false } as any);
    expect(code).not.toMatch(/app\.exportWidgetHTML\(/);
    expect(code).toContain('app.exportEngine.exportWidgetHTML(');
  });
});

describe('Other FxTool symbol mismatches (1.5.5)', () => {
  // Three smaller renames discovered alongside the masks/widget audit.

  it('create_scene relations: calls app.addRelation(srcId, tgtId, …), not app.relationManager.addRelation(item, item, …)', () => {
    // The relations-in-scene codegen lives in generateCreateScene.
    const code = codeGenerator.generateCreateScene({
      items: [
        { name: 'a', itemType: 'circle', position: { x: 0, y: 0 } },
        { name: 'b', itemType: 'circle', position: { x: 100, y: 0 } },
      ],
      relations: [{ source: 'a', target: 'b', type: 'orbits' }],
    } as any);
    expect(code).not.toContain('app.relationManager');
    expect(code).toMatch(/app\.addRelation\(\s*sourceId,\s*targetId,\s*'orbits'/);
  });

  it('selection codegen: uses app.getSelectedItems() (FxTool has no getSelection)', () => {
    const selectAll = codeGenerator.generateSelection({ action: 'select_all' } as any);
    const get = codeGenerator.generateSelection({ action: 'get' } as any);
    const deleteSel = codeGenerator.generateSelection({ action: 'delete_selected' } as any);
    for (const code of [selectAll, get, deleteSel]) {
      expect(code).not.toMatch(/app\.getSelection\(/);
      expect(code).toContain('app.getSelectedItems()');
    }
  });

  it('background get codegen: uses app.getBackgroundMode() and returns {mode}', () => {
    const code = codeGenerator.generateBackground({ action: 'get' } as any);
    expect(code).not.toMatch(/app\.getBackground\(\)/);
    expect(code).toContain('app.getBackgroundMode');
    expect(code).toContain('mode');
  });
});

// =============================================================================
// 1.5.6 — pinepaper_camera fit_view action
// =============================================================================

describe('pinepaper_camera fit_view action (1.5.6)', () => {
  // FxTool added app.fitView() in commit f97fc60 specifically so this action
  // and mobile gestures both work. The MCP needed to surface it as an action
  // on the camera umbrella (replacing the wrongly-removed pinepaper_view).
  it('is documented in the pinepaper_camera tool description', async () => {
    const { PINEPAPER_TOOLS } = await import('../../tools/definitions.js');
    const camera = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_camera');
    expect(camera).toBeDefined();
    expect(camera!.description).toContain('fit_view');
  });

  it('dispatcher emits app.fitView() and rejects on unknown action lists fit_view as valid', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const result = await handleToolCall('pinepaper_camera', { action: 'fit_view' });
    expect(result.isError).toBeFalsy();
    const text = (result.content[0] as { type: string; text: string }).text;
    expect(text).toContain('app.fitView');
  });
});

describe('generateAgentExport — VideoEncoder NaN-bitrate fix', () => {
  // Repro from a live MCP session:
  //   "Failed to read the 'bitrate' property from 'VideoEncoderConfig':
  //    Value is not of type 'unsigned long long'."
  // Root cause: FxTool's ExportEngine._quickExportVideo hardcodes
  // quality:undefined for mp4/webm, then _calculateBitrate(w, h, undefined)
  // → Math.round(base * undefined) → NaN. The MCP must (1) pass a numeric
  // `quality` (not just `bitrate`, which FxTool ignores) and (2) skip
  // _quickExportVideo for mp4/webm so the quality reaches the encoder.

  const baseInput = {
    platform: 'instagram' as const,
    quality: 'high' as const,
    framing: 'canvas' as const,
  };

  it('mp4: emits numeric `quality` in baseVideoSettings, not just `bitrate`', () => {
    const code = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4' });
    expect(code).toMatch(/baseVideoSettings\s*=\s*\{[^}]*quality:\s*settings\.compression/);
    // Compression preset for 'high' is 0.95 — must appear in the settings literal.
    expect(code).toContain('"compression":0.95');
  });

  it('mp4: prefers videoExporter.export over _quickExportVideo (bypasses the undefined-quality clobber)', () => {
    const code = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4' });
    // The mp4/webm branch must run before the _quickExportVideo branch.
    // Compare the *call sites*, not bare mentions — comments contain the symbol.
    const mp4Branch = code.indexOf("(format === 'mp4' || format === 'webm')");
    const quickCall = code.indexOf('app.exportEngine._quickExportVideo(');
    expect(mp4Branch).toBeGreaterThan(-1);
    expect(quickCall).toBeGreaterThan(-1);
    expect(mp4Branch).toBeLessThan(quickCall);
  });

  it('webm: same direct-path bypass as mp4', () => {
    const code = codeGenerator.generateAgentExport({ ...baseInput, format: 'webm' });
    expect(code).toMatch(/baseVideoSettings\s*=\s*\{[^}]*quality:\s*settings\.compression/);
    expect(code).toContain("(format === 'mp4' || format === 'webm')");
  });

  it('gif: still routes through _quickExportVideo (which handles gifQuality correctly)', () => {
    const code = codeGenerator.generateAgentExport({ ...baseInput, format: 'gif' });
    // GIF should NOT take the mp4/webm-only branch — gif uses _quickExportVideo
    // because that path forwards gifQuality to gif.js.
    expect(code).toContain('_quickExportVideo');
  });

  it('uses each quality tier\'s compression value (draft/standard/high)', () => {
    const draft = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4', quality: 'draft' });
    const standard = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4', quality: 'standard' });
    const high = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4', quality: 'high' });
    expect(draft).toContain('"compression":0.6');
    expect(standard).toContain('"compression":0.85');
    expect(high).toContain('"compression":0.95');
  });

  // 1.5.5 — duration was hardcoded to 5s; any longer play_timeline was
  // silently truncated. Real bug surfaced live by an agent trying to render
  // a 9-second mp4. baseVideoSettings.duration must respect the request.
  it('respects requested duration for animated formats (no more 5s cap)', () => {
    const nineSec = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4', duration: 9 });
    // baseVideoSettings is a JS object literal in the generated IIFE — unquoted key.
    expect(nineSec).toMatch(/baseVideoSettings\s*=\s*\{[^}]*duration:\s*9\b/);

    const twentySec = codeGenerator.generateAgentExport({ ...baseInput, format: 'webm', duration: 20 });
    expect(twentySec).toMatch(/baseVideoSettings\s*=\s*\{[^}]*duration:\s*20\b/);

    const gifTwelve = codeGenerator.generateAgentExport({ ...baseInput, format: 'gif', duration: 12 });
    expect(gifTwelve).toMatch(/baseVideoSettings\s*=\s*\{[^}]*duration:\s*12\b/);
  });

  it('falls back to 5s default when duration is omitted', () => {
    const code = codeGenerator.generateAgentExport({ ...baseInput, format: 'mp4' });
    expect(code).toMatch(/baseVideoSettings\s*=\s*\{[^}]*duration:\s*5\b/);
  });

  it('Zod rejects out-of-range duration (must be 0.5–60)', async () => {
    const { AgentExportInputSchema } = await import('../../types/schemas.js');
    expect(() => AgentExportInputSchema.parse({ platform: 'instagram', duration: 0 })).toThrow();
    expect(() => AgentExportInputSchema.parse({ platform: 'instagram', duration: 75 })).toThrow();
    expect(() => AgentExportInputSchema.parse({ platform: 'instagram', duration: 30 })).not.toThrow();
  });
});
