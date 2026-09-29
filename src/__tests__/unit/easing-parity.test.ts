/**
 * The easing vocabulary must match the engine's easing table.
 *
 * Every keyframe, mask, relation and camera easing resolves through ONE table
 * in FxTool (core/KeyframeInterpolator.js, `EASINGS`; `EASING_NAMES` is its
 * keys). This repo carried six hand-copied six-name lists instead, so when the
 * engine added the damped springs (spring, springSnappy, springPlayful —
 * FxTool PR #39) no agent could name one: the schema rejected them before any
 * code ran. The same lists had hidden ten names the engine always had
 * (easeInOutCubic, easeOutBack…).
 *
 * The fixture is `EASING_NAMES` from FxTool origin/main. When the engine adds
 * an easing, "hides nothing" fails here: refresh the fixture and add the name
 * (with a description line) to KEYFRAME_EASINGS in src/types/schemas.ts.
 *
 * Out of scope on purpose: pinepaper_stagger / pinepaper_flip `ease` and
 * `distributeEase` feed the engine's Stagger distribution, and path-follow
 * `easing` (sine, pingpong) feeds moves_along_path. Different namespaces.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import {
  KEYFRAME_EASINGS, EASING_DESCRIPTIONS, EasingSchema, MaskEasingSchema, KeyframeSchema,
} from '../../types/schemas.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const ENGINE = readFileSync(
  join(import.meta.dir, '..', 'fixtures', 'engine-easings.txt'), 'utf-8',
).split('\n').map((l) => l.trim()).filter(Boolean);

const OURS = [...KEYFRAME_EASINGS] as string[];

/** Tools whose `easing` resolves through the engine's easing table. */
const TABLE_TOOLS = new Set([
  'pinepaper_keyframe_animate',
  'pinepaper_apply_animated_mask',
  'pinepaper_camera_animate',
]);

function easingEnums(): Array<{ tool: string; values: string[] }> {
  const out: Array<{ tool: string; values: string[] }> = [];
  const walk = (tool: string, node: unknown, key: string) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (Array.isArray(n.enum) && key === 'easing') out.push({ tool, values: n.enum as string[] });
    // oneOf/anyOf branches (and their array indices) belong to the parent key:
    // a keyframe easing is oneOf [name enum, Bézier array].
    const passThrough = (k: string) => k === 'properties' || k === 'items' || k === 'oneOf' || k === 'anyOf' || /^\d+$/.test(k);
    for (const [k, v] of Object.entries(n)) {
      walk(tool, v, passThrough(k) ? key : k);
    }
  };
  for (const t of PINEPAPER_TOOLS as { name: string; inputSchema: unknown }[]) {
    if (TABLE_TOOLS.has(t.name)) walk(t.name, t.inputSchema, '');
  }
  return out;
}

describe('easings ↔ the engine easing table', () => {
  it('offers nothing the engine cannot ease with', () => {
    expect(OURS.filter((e) => !ENGINE.includes(e))).toEqual([]);
  });

  it('hides nothing the engine can ease with', () => {
    expect(ENGINE.filter((e) => !OURS.includes(e))).toEqual([]);
  });

  it('includes the three springs', () => {
    for (const s of ['spring', 'springSnappy', 'springPlayful']) expect(OURS).toContain(s);
  });

  it('the zod schemas are the shared list', () => {
    expect(EasingSchema.options as string[]).toEqual(OURS);
    expect(MaskEasingSchema.options as string[]).toEqual(OURS);
  });

  it('every JSON-Schema easing enum on a table-backed tool is the shared list', () => {
    const copies = easingEnums();
    // keyframe_animate, the mask's per-keyframe and overall easing, camera_animate
    expect(copies.length).toBeGreaterThanOrEqual(4);
    for (const c of copies) expect({ tool: c.tool, values: c.values }).toEqual({ tool: c.tool, values: OURS });
  });

  it('every easing has a description line', () => {
    for (const e of OURS) expect(EASING_DESCRIPTIONS[e as keyof typeof EASING_DESCRIPTIONS]).toBeTruthy();
  });

  it('get_available_easings prefers the live engine list and falls back to the shared one', () => {
    const code = new PinePaperCodeGenerator().generateGetAvailableEasings();
    expect(code).toContain('app.listAnimatableProperties');
    for (const e of OURS) expect(code).toContain(`"${e}"`);
  });

  it('keyframe easing takes a custom cubic-bezier; x must be in 0..1, y may overshoot', () => {
    const kf = (easing: unknown) => KeyframeSchema.safeParse({ time: 1, properties: {}, easing });
    expect(kf('springSnappy').success).toBe(true);
    expect(kf([0.2, 1.6, 0.3, -0.4]).success).toBe(true);
    expect(kf([1.2, 0, 0.3, 1]).success).toBe(false);
    expect(kf([0.2, 0.8, 0.2]).success).toBe(false);
    expect(kf('sprng').success).toBe(false);
  });

  it('keyframe_animate and camera_animate offer the Bézier form; masks do not', () => {
    const easingNodes = (name: string) => {
      const found: any[] = [];
      const walk = (node: any, key: string) => {
        if (!node || typeof node !== 'object') return;
        if (key === 'easing' && !Array.isArray(node)) found.push(node);
        for (const [k, v] of Object.entries(node)) walk(v, k);
      };
      walk((PINEPAPER_TOOLS as any[]).find((t) => t.name === name).inputSchema, '');
      return found;
    };
    for (const name of ['pinepaper_keyframe_animate', 'pinepaper_camera_animate']) {
      const nodes = easingNodes(name);
      expect(nodes.length).toBeGreaterThan(0);
      for (const n of nodes) expect(n.oneOf?.[1]).toMatchObject({ type: 'array', minItems: 4, maxItems: 4 });
    }
    for (const n of easingNodes('pinepaper_apply_animated_mask')) expect(n.oneOf).toBeUndefined();
  });
});
