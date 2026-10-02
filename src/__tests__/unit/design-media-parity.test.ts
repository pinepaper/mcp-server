/**
 * The media this server advertises must be the media the engine publishes.
 *
 * Two tables, two different jobs, and conflating them is how the bug got in:
 *   - DesignMedia.MEDIA — the nine media that exist, each with a fidelity.
 *   - CollagePatterns.COMPOSABLE_MEDIA — the two a WHOLE composition can be
 *     rendered in. Smaller on purpose: ink, watercolor, hatch and cutPaper have
 *     mark-makers but apply per item, and the engine refuses them from compose
 *     with exactly that advice.
 *
 * The served JSON description for design_medium listed seven, omitting `hatch`
 * and `watercolor` — both NATIVE fidelity, both shipped, one of them with its
 * own apply_hatch action in this very tool. The Zod description beside it
 * listed all nine and the agent guide called them "recent additions", so three
 * copies disagreed and the stale one was the copy a model reads.
 *
 * This is the fifth enum in this release to drift from the engine, and the
 * fourth to do it silently. Diff against the engine's PUBLISHED table.
 *
 * The media list is now GENERATED from DesignMedia MEDIA
 * (scripts/sync-engine-lists.mjs; check:engine-lists in prepublishOnly), and
 * the served `medium` field is an enum of it. The hand fixture it replaced
 * was one more copy to keep in step.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { DesignMediumInputSchema, ComposeInputSchema } from '../../types/schemas.js';
import { DESIGN_MEDIA, DESIGN_MEDIA_APPLY } from '../../tools/engine-lists.js';

const fixture = (name: string) =>
  readFileSync(join(import.meta.dir, '..', 'fixtures', name), 'utf-8')
    .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));

const MEDIA = DESIGN_MEDIA.map((key) => ({ key }));
const COMPOSABLE = fixture('engine-composable-media.txt');

const served = (tool: string, prop: string) => {
  const t = PINEPAPER_TOOLS.find((x) => x.name === tool);
  return (t?.inputSchema as any)?.properties?.[prop];
};

describe('design media parity with the engine', () => {
  it('the fixtures are not empty', () => {
    // An empty derivation satisfies every containment assertion below.
    expect(MEDIA.length).toBeGreaterThan(1);
    expect(COMPOSABLE.length).toBe(2);
  });

  it('the served medium field is exactly the engine\'s media, as an enum', () => {
    const served_ = served('pinepaper_design_medium', 'medium');
    expect([...(served_?.enum ?? [])]).toEqual([...DESIGN_MEDIA]);
  });

  it('apply offers exactly the media the engine has an apply method for', () => {
    const desc = String(served('pinepaper_design_medium', 'medium')?.description ?? '');
    for (const k of Object.keys(DESIGN_MEDIA_APPLY)) expect(desc).toContain(k);
    expect(Object.keys(DESIGN_MEDIA_APPLY).every((k) => (DESIGN_MEDIA as readonly string[]).includes(k))).toBe(true);
  });

  it('the Zod description agrees with the served one', () => {
    // NOT CONDITIONAL. The first version guarded this with `if (zod)` and the
    // branch never ran: DesignMediumInputSchema is wrapped in three ZodEffects
    // layers by its refinements, so a fixed-depth `.shape` lookup found
    // nothing and the test reported green having asserted nothing. Unwrap by
    // walking, and fail if the walk does not arrive.
    let node: any = DesignMediumInputSchema;
    for (let i = 0; i < 8 && node && !node.shape; i++) node = node._def?.schema ?? node._def?.innerType;
    expect(node?.shape?.medium, 'could not reach DesignMediumInputSchema.shape.medium').toBeTruthy();

    let field: any = node.shape.medium;
    let zod = '';
    for (let i = 0; i < 6 && field && !zod; i++) { zod = field._def?.description ?? ''; field = field._def?.innerType; }
    expect(zod, 'the Zod medium field carries no description to compare').toBeTruthy();

    // They are separate copies — schemas.ts feeds anyone reading the source,
    // the JSON feeds the model. Disagreeing copies are how this shipped.
    expect(MEDIA.map((m) => m.key).filter((k) => !zod.includes(k)),
      'media absent from the Zod description').toEqual([]);
  });

  it('compose accepts exactly the engine COMPOSABLE_MEDIA — no wider, no narrower', () => {
    const enumVals: string[] = served('pinepaper_compose', 'medium')?.enum
      ?? (ComposeInputSchema as any)?.shape?.medium?._def?.values ?? [];
    expect(enumVals.length, 'compose exposes no medium enum to compare').toBeGreaterThan(0);
    expect([...enumVals].sort()).toEqual([...COMPOSABLE].sort());
  });

  it('every composable medium is one the engine actually has', () => {
    const known = new Set(MEDIA.map((m) => m.key));
    expect(COMPOSABLE.filter((k) => !known.has(k))).toEqual([]);
  });
});
