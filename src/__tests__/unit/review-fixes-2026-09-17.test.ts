/**
 * The ten findings from the v1.6.7..HEAD review, pinned.
 *
 * Each of these was measured before it was fixed, and the measurement is the
 * test: a comment saying "this used to jump 19.6px" rots, an assertion that
 * the jump is zero does not.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { planCharacter } from '../../tools/handlers/character.js';
import { channelsOf } from '../../character/resolve.js';
import { codeGenerator } from '../../types/code-generator.js';
import { AddRelationInputSchema, CharacterInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

type Op = { tool: string; args: Record<string, unknown> };
const plan = (args: Record<string, unknown>) => planCharacter(args as never);

describe('a character part no longer jumps when its track starts', () => {
  /**
   * The create ops re-place each part at its path's BBOX CENTRE; the cloud's
   * tracks were anchored on the depiction's DECLARED anchor. Every animated
   * part snapped between the two the instant the t=0 keyframe evaluated —
   * measured at 19.6px for a pigeon's beak, which detaches it from the head.
   */
  const measureWorstJump = (concept: string, channel: string) => {
    const r = plan({ concept, at: { x: 470, y: 250 }, height: 300, beats: [{ at: 0, channel, until: 4 }] });
    if (!r.ok) return { refused: r.reason, worst: 0, tracks: 0 };
    const placed = new Map<string, { x: number; y: number }>();
    for (const o of r.ops as Op[]) {
      if (o.tool !== 'pinepaper_create_item') continue;
      const id = (o.args.properties as Record<string, unknown>).id;
      if (typeof id === 'string') placed.set(id, o.args.position as { x: number; y: number });
    }
    let worst = 0;
    let tracks = 0;
    for (const o of r.ops as Op[]) {
      if (o.tool !== 'pinepaper_keyframe_animate') continue;
      tracks++;
      const at = placed.get(String(o.args.itemId));
      if (!at) continue;
      const kfs = o.args.keyframes as Array<{ time: number; properties: Record<string, unknown> }>;
      const first = kfs.reduce((a, b) => (a.time <= b.time ? a : b));
      const fx = typeof first.properties.x === 'number' ? first.properties.x : at.x;
      const fy = typeof first.properties.y === 'number' ? first.properties.y : at.y;
      worst = Math.max(worst, Math.hypot(fx - at.x, fy - at.y));
    }
    return { worst, tracks, refused: null as string | null };
  };

  it('the pigeon is placed where its first keyframe puts it', () => {
    const m = measureWorstJump('pp:Pigeon', 'bob');
    expect(m.refused).toBeNull();
    expect(m.tracks).toBeGreaterThan(0);
    expect(m.worst).toBeLessThan(0.001);
  });

  it('holds for every concept that both draws and performs', () => {
    for (const [concept, channel] of [['pp:Vehicle', 'jounce'], ['pp:Building', 'lightUpper']] as Array<[string, string]>) {
      const m = measureWorstJump(concept, channel);
      if (m.refused) continue;
      expect(m.worst, `${concept} jumps ${m.worst.toFixed(2)}px at t=0`).toBeLessThan(0.001);
    }
  });

  it('the relative motion survives the re-base — a track still moves', () => {
    const r = plan({ concept: 'pp:Pigeon', at: { x: 470, y: 250 }, height: 300, beats: [{ at: 0, channel: 'bob', until: 4 }] });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const track = (r.ops as Op[]).find((o) => o.tool === 'pinepaper_keyframe_animate')!;
    const xs = (track.args.keyframes as Array<{ properties: Record<string, unknown> }>)
      .map((k) => k.properties.x).filter((v): v is number => typeof v === 'number');
    // Re-basing must not flatten the performance into a constant.
    expect(new Set(xs).size).toBeGreaterThan(1);
  });
});

describe('an inherited concept performs and inks like the one it inherits from', () => {
  const shape = (concept: string, channel: string) => {
    const r = plan({ concept, at: { x: 400, y: 300 }, height: 300, beats: [{ at: 0.5, channel }] });
    if (!r.ok) return null;
    const creates = (r.ops as Op[]).filter((o) => o.tool === 'pinepaper_create_item');
    const props = (o: Op) => o.args.properties as Record<string, unknown>;
    return {
      tracks: r.tracks,
      inkCopies: creates.filter((o) => String(props(o).id).endsWith('__ink')).length,
      ignored: r.notes.filter((n) => n.includes('declares no channel')).length,
    };
  };

  it('channels are inherited — pp:Bus performs what pp:Vehicle declares', () => {
    // channelsOf() walked the ancestry all along and only a test called it.
    expect(channelsOf('pp:Bus').map((c) => c.name)).toContain('jounce');
    const bus = shape('pp:Bus', 'jounce');
    const vehicle = shape('pp:Vehicle', 'jounce');
    expect(bus).not.toBeNull();
    expect(bus!.tracks).toBeGreaterThan(0);
    expect(bus!.ignored).toBe(0);
    if (vehicle) expect(bus!.tracks).toBe(vehicle.tracks);
  });

  it('ink follows the depiction actually composed, not the concept asked for', () => {
    const bus = shape('pp:Bus', 'jounce');
    const vehicle = shape('pp:Vehicle', 'jounce');
    expect(bus!.inkCopies).toBeGreaterThan(0);
    if (vehicle) expect(bus!.inkCopies).toBe(vehicle.inkCopies);
  });

  it('the same holds for pp:House against pp:Building', () => {
    const house = shape('pp:House', 'lightUpper');
    const building = shape('pp:Building', 'lightUpper');
    expect(house).not.toBeNull();
    expect(house!.ignored).toBe(0);
    expect(house!.inkCopies).toBeGreaterThan(0);
    if (building) {
      expect(house!.tracks).toBe(building.tracks);
      expect(house!.inkCopies).toBe(building.inkCopies);
    }
  });
});

describe('stitchcraft stops guessing at its target', () => {
  const gen = (input: Record<string, unknown>) =>
    (codeGenerator as unknown as { generateStitchcraft(i: unknown): string }).generateStitchcraft(input);

  it('an explicit itemId that misses is refused, not replaced', () => {
    // It used to fall through to selection → last registered → last Paper
    // child, so stitching a deleted id embroidered whatever was newest and
    // returned success:true.
    const code = gen({ preset: 'cross_stitch', itemId: 'item_99' });
    expect(code).toContain('no such item: ');
    const idx = code.indexOf('no such item: ');
    const fallbackIdx = code.indexOf('getAll');
    expect(idx).toBeGreaterThan(0);
    expect(idx).toBeLessThan(fallbackIdx);
  });

  it('reads the selection through the facade that exists', () => {
    const code = gen({ preset: 'cross_stitch' });
    expect(code).toContain('app.getSelectedItems()');
    // The dead property may still be NAMED in the comment explaining why it is
    // dead; what must not survive is a branch reading it.
    expect(code).not.toMatch(/app\.selection\s*(&&|\.|\[)/);
  });

  it('the lossy fallback refuses and names the tool that can do it', () => {
    // It forwarded colour, width and count only, dropping preset, roughness,
    // bowing, sheen and seed — then echoed the preset back with success:true.
    const code = gen({ preset: 'satin_fill' });
    expect(code).toContain('cannot carry a preset');
    expect(code).toContain('apply_thread');
    expect(code).toContain('equivalentStitch');
  });

  it('roughness jitters every segment, not the first two', () => {
    const code = gen({ preset: 'stem_outline', roughness: 0.5, seed: 2 });
    expect(code).toContain('for (let j = 0; j < line.segments.length; j++)');
    expect(code).not.toContain('line.segments[1].point.x -=');
  });

  it('every preset still emits parseable code', () => {
    for (const preset of ['cross_stitch', 'satin_fill', 'long_and_short', 'stem_outline', 'seed_fill', 'running_seam']) {
      expect(() => new Function(gen({ preset, itemId: 'i', roughness: 0.4, seed: 1 }))).not.toThrow();
    }
  });

  it('the fidelity controls are reachable from tools/list', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_stitchcraft')!;
    const props = (tool.inputSchema as { properties: Record<string, unknown> }).properties;
    for (const k of ['roughness', 'bowing', 'sheen', 'seed']) expect(props[k]).toBeTruthy();
    expect(tool.description).toContain('roughness');
  });
});

describe('a relation preset cannot be combined with a target it has no slot for', () => {
  it('refuses presetId + targetId rather than dropping the target', () => {
    const r = AddRelationInputSchema.safeParse({ sourceId: 'a', targetId: 'b', presetId: 'p1' });
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('applies to one item');
  });

  it('refuses presetId + relationType, since the preset decides the type', () => {
    expect(AddRelationInputSchema.safeParse({ sourceId: 'a', relationType: 'orbits', presetId: 'p1' }).success).toBe(false);
  });

  it('still accepts each on its own', () => {
    expect(AddRelationInputSchema.safeParse({ sourceId: 'a', presetId: 'p1' }).success).toBe(true);
    expect(AddRelationInputSchema.safeParse({ sourceId: 'a', targetId: 'b', relationType: 'orbits' }).success).toBe(true);
  });
});

describe('the character fields that were handled but undeclared', () => {
  it('position, scale, palette and ink survive validation', () => {
    const parsed = CharacterInputSchema.parse({
      concept: 'pp:Pigeon', position: { x: 120, y: 80 }, scale: 2,
      palette: { pigeon_body: '#ff0000' }, ink: '#111111',
    });
    expect(parsed.position).toEqual({ x: 120, y: 80 });
    expect(parsed.scale).toBe(2);
    expect(parsed.palette).toEqual({ pigeon_body: '#ff0000' });
    expect(parsed.ink).toBe('#111111');
  });

  it('and they reach the plan rather than defaulting to dead centre', () => {
    const r = plan({ concept: 'pp:Pigeon', position: { x: 120, y: 80 }, scale: 2 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const creates = (r.ops as Op[]).filter((o) => o.tool === 'pinepaper_create_item');
    const xs = creates.map((o) => (o.args.position as { x: number }).x);
    // Centred on 400 would be the default; 120 was asked for.
    expect(Math.min(...xs)).toBeLessThan(400);
  });

  it('tools/list advertises all four', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_character')!;
    const props = (tool.inputSchema as { properties: Record<string, unknown> }).properties;
    for (const k of ['position', 'scale', 'palette', 'ink']) expect(props[k]).toBeTruthy();
  });
});

describe('the vendored-design guard is wired into something that runs', () => {
  it('check:design runs before publish, like check:manifest', () => {
    // check:manifest was in prepublishOnly and check:design was not, so
    // vendored drift could ship — the same shape as manifest.json sitting at
    // 1.6.4 through the whole 1.6.5 release with nothing to catch it.
    const pkg = JSON.parse(readFileSync(join(import.meta.dir, '..', '..', '..', 'package.json'), 'utf-8'));
    expect(pkg.scripts.prepublishOnly).toContain('check:design');
    expect(pkg.scripts.prepublishOnly).toContain('check:manifest');
  });

  it('the sync script points at a test that exists', () => {
    const src = readFileSync(join(import.meta.dir, '..', '..', '..', 'scripts', 'sync-design-systems.mjs'), 'utf-8');
    expect(src).not.toContain('design-vendor-provenance.test.ts');
    expect(src).toContain('design-systems.test.ts');
  });
});
