/**
 * Every canvas preset the agent tools emit must be a key the engine has.
 *
 * `AgentPlatformSchema` is an export-TARGET vocabulary — 'instagram',
 * 'youtube', 'web' — and it was also being passed straight to
 * `app.setCanvasSize()`, which keys on 'instagram-post' and 'full-hd-1080p'.
 * Seven of its ten names matched nothing. The engine fell through to its
 * default, resized the artboard to 800x600, and recorded the preset as applied,
 * so an agent that asked for an Instagram canvas got neither the size it asked
 * for nor an error saying so.
 *
 * FxTool 496d3910 now refuses an unknown key rather than resizing — which is
 * right, but it warns to a console the production build strips, so the agent
 * still learns nothing. The name has to be correct on the way out.
 */

import { describe, it, expect } from 'bun:test';
import { ENGINE_CANVAS_PRESETS } from '../../tools/engine-lists.js';
import { canvasPresetFor } from '../../types/code-generator.js';
import { AgentPlatformSchema } from '../../types/schemas.js';

// Generated from canvasPresets.js's presets table (scripts/sync-engine-lists.mjs), checked in prepublish.
const ENGINE = new Set<string>(ENGINE_CANVAS_PRESETS);

describe('platform → canvas preset', () => {
  it('every platform maps to a preset the engine actually has', () => {
    const unmapped = (AgentPlatformSchema.options as string[])
      .filter((p) => !ENGINE.has(canvasPresetFor(p)));
    expect(unmapped).toEqual([]);
  });

  it('maps the seven that matched nothing', () => {
    expect(canvasPresetFor('instagram')).toBe('instagram-post');
    expect(canvasPresetFor('youtube')).toBe('full-hd-1080p');
    expect(canvasPresetFor('twitter')).toBe('twitter-post');
    expect(canvasPresetFor('linkedin')).toBe('linkedin-post');
    expect(canvasPresetFor('web')).toBe('hd-720p');
    expect(canvasPresetFor('print-a4')).toBe('a4-portrait');
    expect(canvasPresetFor('print-letter')).toBe('letter-portrait');
  });

  it('leaves the three that were already engine keys alone', () => {
    for (const p of ['instagram-story', 'tiktok', 'youtube-thumbnail']) {
      expect(canvasPresetFor(p)).toBe(p);
    }
  });

  it('the emitted code carries the mapped key, not the platform name', async () => {
    const { codeGenerator } = await import('../../types/code-generator.js');
    const code = codeGenerator.generateAgentStartJob({
      name: 'job', canvasPreset: 'instagram',
    } as never);
    expect(code).toContain('app.setCanvasSize("instagram-post")');
    expect(code).not.toContain("app.setCanvasSize('instagram')");
  });
});

describe('the presets the docs name', () => {
  it('are all presets the studio has', async () => {
    const { PINEPAPER_TOOLS } = await import('../../tools/definitions.js');
    const text = JSON.stringify(PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_set_canvas_size'));
    const named = ['instagram-post', 'instagram-story', 'youtube-thumbnail', 'tiktok', 'full-hd-1080p', 'hd-720p', 'a4-portrait', 'a4-landscape'].filter((p) => text.includes(p));
    expect(named.length).toBeGreaterThan(3);
    expect(named.filter((p) => !ENGINE.has(p))).toEqual([]);
  });
});
