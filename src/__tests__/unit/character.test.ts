/**
 * `pinepaper_character`, which until 2026-09-11 was a phantom.
 *
 * Two things are worth testing here and one of them is not obvious.
 *
 * The obvious half is that a concept resolves to a figure and that a concept
 * which does not is refused BY NAME. The other half is the COORDINATE
 * CONVENTION: `performCharacter` writes ops for the cloud's rasterizer, which
 * ignores `position` next to `pathData`, and PinePaper does not — it treats
 * pathData as origin-authored and places it by (x, y), guarding on
 * `x !== undefined`, which `0` satisfies. Copied verbatim, every part of every
 * figure would land stacked on the canvas origin while item counts, the
 * registry and the attachments all reported a healthy scene. So the test that
 * matters asserts the PIXELS ARE WHERE THEY WERE, not that ops exist.
 */
import { describe, it, expect } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { planCharacter, toEngineConvention, generateCharacterCode } from '../../tools/handlers/character.js';
import { resolveCharacter, drawableConcepts, channelsOf } from '../../character/resolve.js';
import { pathBBox } from '../../character/path-bbox.js';
import { CharacterInputSchema, CreateItemInputSchema, KeyframeAnimateInputSchema } from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';

const centre = (d: string) => {
  const b = pathBBox(d)!;
  return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
};

describe('character resolution', () => {
  it('composes a figure from the concept ancestry', () => {
    const r = planCharacter({ concept: 'pp:Pigeon', at: { x: 470, y: 250 }, height: 300, durationSeconds: 6 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // A pigeon is a bird: wing, beak, tail and legs are declared on pp:Bird and
    // only the body, head and collar on pp:Pigeon. A figure assembled from the
    // nearest concept alone is a bird with no wings.
    expect(r.parts.length).toBeGreaterThan(5);
    expect(r.ops.some((o) => o.tool === 'pinepaper_create_item')).toBe(true);
  });

  it('refuses an unknown concept by naming the ones that would work', () => {
    const r = resolveCharacter({ concept: 'pp:GraphDomain' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain('pp:Pigeon');
  });

  it('refuses a cloud-only concept as CLOUD-ONLY, not as unknown', () => {
    // These are very different facts to act on: one means "you invented a
    // name", the other means "ask the cloud". A single "unknown" for both
    // sends a caller looking for a typo that is not there.
    const r = resolveCharacter({ concept: 'pp:Doodle' });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reason).toContain('cloud');
    expect(drawableConcepts()).not.toContain('pp:Doodle');
  });

  it('says so when a beat names a channel the concept does not declare', () => {
    const r = planCharacter({ concept: 'pp:Pigeon', beats: [{ at: 1, channel: 'moonwalk' }] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.notes.join(' ')).toContain('moonwalk');
    // and it still names the real ones, so the caller can fix it in one step
    expect(r.notes.join(' ')).toContain('blink');
  });

  it('a concept with no "default" variant still draws', () => {
    // pp:Character ships only named drawings. Before the fallback, asking for
    // it composed nothing, drew nothing and said nothing.
    const r = planCharacter({ concept: 'pp:Character' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.parts.length).toBeGreaterThan(0);
    expect(r.notes.join(' ')).toContain('drew');
  });

  it('declares channels a caller can discover', () => {
    expect(channelsOf('pp:Pigeon').map((c) => c.name)).toContain('blink');
  });
});

describe('the coordinate convention is converted, not copied', () => {
  const raw = resolveCharacter({ concept: 'pp:Pigeon', at: { x: 470, y: 250 }, height: 300 });

  it('the cloud ops really do pair absolute geometry with position 0,0', () => {
    // Pins the PREMISE. If the cloud ever changes to origin-authored paths this
    // test fails first, and the conversion below becomes wrong rather than
    // merely unnecessary — which is the failure worth being told about.
    expect(raw.ok).toBe(true);
    if (!raw.ok) return;
    const op = raw.ops.find((o) => o.tool === 'pinepaper_create_item')!;
    expect(op.args.position).toEqual({ x: 0, y: 0 });
    const d = (op.args.properties as Record<string, unknown>).pathData as string;
    expect(Math.abs(centre(d).x)).toBeGreaterThan(100);
  });

  it('conversion preserves each part\'s absolute centre exactly', () => {
    if (!raw.ok) return;
    for (const op of raw.ops.filter((o) => o.tool === 'pinepaper_create_item')) {
      const before = centre((op.args.properties as Record<string, unknown>).pathData as string);
      const after = toEngineConvention(op);
      const pos = after.args.position as { x: number; y: number };
      const local = centre((after.args.properties as Record<string, unknown>).pathData as string);
      // PinePaper sets the path's bounds centre to (x, y), so the rendered
      // centre is position + the local centre, which must be the original.
      expect(pos.x + local.x).toBeCloseTo(before.x, 2);
      expect(pos.y + local.y).toBeCloseTo(before.y, 2);
      // …and the local geometry is genuinely origin-centred now
      expect(Math.abs(local.x)).toBeLessThan(0.01);
    }
  });

  it('keyframe ops declare seconds, so the legacy ms heuristic cannot fire', () => {
    const r = planCharacter({ concept: 'pp:Pigeon', durationSeconds: 120, beats: [{ at: 110, channel: 'blink' }] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const kfs = r.ops.filter((o) => o.tool === 'pinepaper_keyframe_animate');
    expect(kfs.length).toBeGreaterThan(0);
    for (const k of kfs) expect(k.args.timeUnits).toBe('seconds');
  });

  it('a part whose path cannot be measured is passed through, not dropped', () => {
    const op = { tool: 'pinepaper_create_item', args: { itemType: 'path', position: { x: 0, y: 0 }, properties: { pathData: '' } } };
    expect(toEngineConvention(op)).toEqual(op);
  });
});

describe('the emitted program', () => {
  it('parses as JavaScript, refusal prose included', () => {
    // Prose is DATA: an apostrophe in a message, interpolated into a quoted
    // literal, once made every generated auto_walk program a SyntaxError.
    // pp:Pigeon with a REAL beat, so the keyframe ops are actually in the
    // program — an undeclared channel yields zero tracks and would leave the
    // half of the generator this test exists for unexercised. The bogus beat
    // rides along to put a refusal note in the emitted comments too.
    const r = planCharacter({
      concept: 'pp:Pigeon', at: { x: 470, y: 250 }, durationSeconds: 6,
      beats: [{ at: 1, channel: 'blink' }, { at: 2, channel: 'bob' }, { at: 3, channel: "don't-exist" }],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.ops.filter((o) => o.tool === 'pinepaper_keyframe_animate').length).toBeGreaterThan(0);
    expect(r.ops.filter((o) => o.tool === 'pinepaper_create_item').length).toBeGreaterThan(5);
    const code = generateCharacterCode(
      r,
      {
        generateCreateItem: (i) => codeGenerator.generateCreateItem(i as never),
        generateKeyframeAnimate: (i) => codeGenerator.generateKeyframeAnimate(i as never),
      },
      { createItem: (a) => CreateItemInputSchema.parse(a), keyframeAnimate: (a) => KeyframeAnimateInputSchema.parse(a) },
    );
    expect(() => new Function(code)).not.toThrow();
    expect(code).toContain("app.create('path'");
    expect(code).toContain('addAnimation');
    // one authoring act, one undo
    expect(code).toContain('beginBatch');
    expect((code.match(/endBatch/g) ?? []).length).toBe(1);
  });


  it('binds the ENGINE\'s item ids, because the part names are not registry ids', () => {
    // MEASURED IN A REAL BUNDLE, and invisible to every other test here.
    // `performCharacter` keys its tracks on `pigeon_eye`; PinePaper's
    // `create()` never forwards `params.id` to the registry, which mints
    // `item_1`, `item_2` … So `addAnimation('pigeon_eye', …)` finds nothing —
    // and it does not throw, it console.warns, and production strips console.
    // First run: 13 parts drew correctly at the right place and ZERO carried a
    // keyframe. The figure appears and never moves.
    const r = planCharacter({ concept: 'pp:Pigeon', at: { x: 470, y: 250 }, height: 300, durationSeconds: 6, beats: [{ at: 1, channel: 'blink' }] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const code = generateCharacterCode(
      r,
      {
        generateCreateItem: (i) => codeGenerator.generateCreateItem(i as never),
        generateKeyframeAnimate: (i) => codeGenerator.generateKeyframeAnimate(i as never),
      },
      { createItem: (a) => CreateItemInputSchema.parse(a), keyframeAnimate: (a) => KeyframeAnimateInputSchema.parse(a) },
    );
    // every track resolves through the map, never through a literal part name
    expect(code).toContain('app.addAnimation(__ppChar["pigeon_eye"]');
    expect(code).not.toContain("app.addAnimation('pigeon_eye'");
    // and every part records the id the engine actually gave it
    expect(code).toContain('__ppChar["pigeon_eye"] = itemId;');
    expect(() => new Function(code)).not.toThrow();
  });


  it('drops groupId, which this engine ignores and could misread', () => {
    // PinePaper builds a path's item.data fresh, so the field never lands; and
    // item.data.groupId means COLLAGE id here. A field that does nothing is the
    // phantom in miniature.
    const r = planCharacter({ concept: 'pp:Pigeon' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const op of r.ops.filter((o) => o.tool === 'pinepaper_create_item')) {
      expect(Object.keys(op.args.properties as object)).not.toContain('groupId');
    }
  });

  it('the zod schema accepts the documented example', () => {
    expect(() =>
      CharacterInputSchema.parse({
        concept: 'pp:Character',
        at: { x: 470, y: 250 },
        height: 300,
        beats: [{ at: 1.0, channel: 'blink' }, { at: 1.8, channel: 'say', until: 4.2 }, { at: 5.0, channel: 'headTurn', value: -0.8 }],
      }),
    ).not.toThrow();
  });
});

describe('vendor parity with mcp-cloud', () => {
  // A vendored copy is a fork the moment it is written. This fails when the
  // cloud's implementation moves and ours has not — skipped, with a reason,
  // when the sibling checkout is not present.
  const CLOUD = join(homedir(), 'IdeaProjects', 'mcp-cloud');
  const pairs: Array<[string, string]> = [
    ['src/character/perform.ts', 'src/services/character-perform.ts'],
    ['src/character/path-bbox.ts', 'src/services/path-bbox.ts'],
  ];

  it('the vendored modules match their cloud originals', () => {
    if (!existsSync(CLOUD)) {
      console.warn('[character] mcp-cloud not checked out — vendor parity not verified');
      return;
    }
    for (const [ours, theirs] of pairs) {
      const mine = readFileSync(join(import.meta.dir, '..', '..', '..', ours), 'utf-8')
        .replace(/^\/\* VENDORED[\s\S]*?\*\/\n/, '')
        .replace(/from "\.\/duration-scale\.js"/, 'from "./motion-design-tokens"')
        .replace(/from "\.\/path-bbox\.js"/, 'from "./path-bbox"')
        .replace(/DURATION_SCALE_MS\.reduce\(\(best: number, d: number\) =>/, 'DURATION_SCALE_MS.reduce((best, d) =>');
      const cloud = readFileSync(join(CLOUD, theirs), 'utf-8');
      expect(`${ours}: ${mine.length}`).toBe(`${ours}: ${cloud.length}`);
      expect(ours + '\n' + mine).toBe(ours + '\n' + cloud);
    }
  });

  it('the duration scale still matches the cloud tokens', () => {
    if (!existsSync(CLOUD)) return;
    const tokens = JSON.parse(readFileSync(join(CLOUD, 'src/data/motion-design-tokens.json'), 'utf-8'));
    const expected = Object.values(tokens.duration as Record<string, unknown>)
      .flatMap((v) => (v && typeof v === 'object' && 'ms' in v ? [(v as { ms: number }).ms] : []))
      .sort((a, b) => a - b);
    expect(expected).toEqual([100, 150, 200, 300, 400, 500, 800]);
  });
});
