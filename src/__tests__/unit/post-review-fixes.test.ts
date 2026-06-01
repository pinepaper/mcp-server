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
});
