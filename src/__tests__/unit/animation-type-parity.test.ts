/**
 * The loop-animation vocabulary must match the engine's driver.
 *
 * Third instance of one bug this week, after the relation enum and FxTool's own
 * relation reference: a hand-copied enum nothing checked against the engine.
 *
 * This one offered `slide`, which has NEVER existed — the real types are
 * `slideLeftRight` and `slideUpDown`. The engine accepted the value, wrote it to
 * `data.animationType`, and the driver's switch fell through, so the item sat
 * still while its own data claimed a slide. Nothing failed. An FxTool e2e test
 * asserted the SMIL export of one for years and read the empty result as "slide
 * does not export". The same enum also hid twelve types that do work.
 *
 * The fixture is `AnimationDriver.ANIMATION_TYPES` — the list the driver
 * switches on, which is the only list that decides whether anything moves.
 * (FxTool's own CodeValidator carries a DIFFERENT, shorter set; it is not the
 * runtime authority and must not be used here.)
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { SimpleAnimationTypeSchema } from '../../types/schemas.js';

const ENGINE = readFileSync(
  join(import.meta.dir, '..', 'fixtures', 'engine-animation-types.txt'), 'utf-8',
).split('\n').map((l) => l.trim()).filter(Boolean);

/**
 * Letter collages are a DIFFERENT namespace — animateCollage maps its own four
 * names (fadeIn, popIn, wave, typewriter) onto staggered effects. Not drift.
 */
const SEPARATE_NAMESPACE = new Set(['pinepaper_animate_letter_collage']);

function animationEnums(): Array<{ tool: string; values: string[] }> {
  const out: Array<{ tool: string; values: string[] }> = [];
  const walk = (tool: string, node: unknown, key: string) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (Array.isArray(n.enum) && key === 'animationType') {
      out.push({ tool, values: n.enum as string[] });
    }
    for (const [k, v] of Object.entries(n)) {
      walk(tool, v, k === 'properties' || k === 'items' ? key : k);
    }
  };
  for (const t of PINEPAPER_TOOLS as { name: string; inputSchema: unknown }[]) {
    if (!SEPARATE_NAMESPACE.has(t.name)) walk(t.name, t.inputSchema, '');
  }
  return out;
}

describe('loop animations ↔ the engine driver', () => {
  it('offers nothing the driver cannot run', () => {
    const invented = (SimpleAnimationTypeSchema.options as string[]).filter((a) => !ENGINE.includes(a));
    // 'slide' lived here. An unknown type is STORED and then ignored, so the
    // failure is a still item and a success return — never an error.
    expect(invented).toEqual([]);
  });

  it('hides nothing the driver can run', () => {
    const missing = ENGINE.filter((a) => !(SimpleAnimationTypeSchema.options as string[]).includes(a));
    expect(missing).toEqual([]);
  });

  it('every JSON-Schema copy agrees with the zod enum', () => {
    const zod = SimpleAnimationTypeSchema.options as string[];
    const copies = animationEnums();
    expect(copies.length).toBeGreaterThanOrEqual(2);
    for (const c of copies) {
      expect({ tool: c.tool, values: c.values }).toEqual({ tool: c.tool, values: zod });
    }
  });

  it("no description OFFERS a bare 'slide' as a type you can pass", () => {
    // The fiction outlived the enum in prose twice — a USE WHEN line and an
    // ANIMATION TYPES bullet. Matching the bare word is too blunt: 'slide' is a
    // real terminaltexteffects key on pinepaper_text_effect, and pinepaper_animate
    // now carries a sentence saying the type does NOT exist, which a word-match
    // would flag as the very thing it warns about. So match the shapes that
    // OFFER it: `animationType: slide` and a `- slide:` catalogue bullet.
    const OFFERS = [/animationType:\s*slide\b/, /^\s*-\s*slide:/m];
    for (const t of PINEPAPER_TOOLS as { name: string; description?: string }[]) {
      const d = t.description ?? '';
      expect({ tool: t.name, offers: OFFERS.some((re) => re.test(d)) })
        .toEqual({ tool: t.name, offers: false });
    }
  });
});
