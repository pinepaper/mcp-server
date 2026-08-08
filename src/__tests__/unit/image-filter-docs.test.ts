/**
 * The pinepaper_image_filter description IS the constraint surface: filterName
 * is a free string, so the documented list is the only thing telling an agent
 * what exists. It went stale once already — the registry grew from 15 to ~29
 * filters (grain, bloom, displace, datamosh, lightShafts…) while the docs still
 * listed the original 15, so agents never used half the engine.
 *
 * This test pins the documented names. It cannot see FxTool's registry from
 * this repo, so it can't prove completeness — what it CAN do is make removing
 * or renaming a documented filter a conscious act, and keep the second-input
 * story (params.map) from silently vanishing in a rewrite.
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/index.js';

const DOCUMENTED = [
  // color
  'grayscale', 'sepia', 'brightness', 'contrast', 'saturation', 'invert',
  'posterize', 'hsl', 'colorTint', 'colorMatrix', 'duotone', 'paletteMap',
  // stylize
  'vignette', 'edgeDetect', 'halftoneDots', 'halftoneCMYK', 'dither',
  'grain', 'scanlines', 'chromaticAberration', 'blur',
  // light
  'bloom', 'glow', 'halation', 'lightShafts',
  // keying
  'lumaKey',
  // second-input
  'displace', 'refract', 'trackMatte', 'datamosh',
];

describe('pinepaper_image_filter documentation', () => {
  const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_image_filter')!;

  it('documents every filter in the pinned set', () => {
    const missing = DOCUMENTED.filter((f) => !tool.description!.includes(f));
    expect(missing).toEqual([]);
  });

  it('explains the second-input contract — params.map is an item id', () => {
    expect(tool.description).toContain('params.map');
    expect(tool.description).toContain("another item's id");
  });

  it('points live track-matting at the media tool instead of duplicating it', () => {
    expect(tool.description).toContain('apply_track_matte');
  });
});
