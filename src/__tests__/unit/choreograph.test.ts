/**
 * Beat verbs (D67). Two layers: the compiler's math, against the engine's
 * transform semantics (x/y = centre, scale absolute about the centre,
 * rotation absolute degrees); and the EMITTED code run against a fake studio,
 * which is what catches the serialised compiler reaching for a name outside
 * its own body.
 */
import { describe, it, expect } from 'bun:test';
import { compileChoreography } from '../../tools/choreograph.js';
import { codeGenerator } from '../../types/code-generator.js';
import { ChoreographInputSchema } from '../../types/schemas.js';

const FRAME = { x: 0, y: 0, width: 1920, height: 1080 };
const BALL = { x: 200, y: 760, w: 80, h: 80, sx: 1, sy: 1, rot: 0 };
const bottomOf = (k: { properties: Record<string, number> }, h: number) => k.properties.y + (h * k.properties.scaleY) / 2;

describe('compileChoreography', () => {
  it('a squash keeps the bottom on the ground', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'squash', amount: 0.3 }]);
    for (const k of r.keyframes!) expect(bottomOf(k, BALL.h)).toBeCloseTo(BALL.y + BALL.h / 2, 3);
    expect(Math.min(...r.keyframes!.map((k) => k.properties.scaleY))).toBeCloseTo(0.7, 3);
  });

  it('hop lands at its destination, at rest, after squashing on contact', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 1, verb: 'hop', to: [600, 760] }]);
    const last = r.keyframes!.at(-1)!;
    expect(last.properties).toMatchObject({ x: 600, y: 760, scaleX: 1, scaleY: 1 });
    expect(r.keyframes![0].time).toBe(1);
    expect(r.keyframes!.some((k) => k.properties.scaleY < 0.8)).toBe(true);   // contact squash
    expect(Math.min(...r.keyframes!.map((k) => k.properties.y))).toBeLessThan(760 - 80);  // it left the ground
  });

  it('roll turns by distance over radius, clockwise to the right', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'roll', to: [200 + Math.PI * 40, 760] }]);
    expect(r.keyframes!.at(-1)!.properties.rotation).toBeCloseTo(180, 1);
    const left = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'roll', to: [100, 760] }]);
    expect(left.keyframes!.at(-1)!.properties.rotation).toBeLessThan(0);
  });

  it("keeps the actor's own scale and rotation as the rest pose", () => {
    const r = compileChoreography({ ...BALL, sx: 2, sy: 2, rot: 30 }, FRAME, [{ at: 0, verb: 'bounce', times: 2 }]);
    const last = r.keyframes!.at(-1)!.properties;
    expect(last.scaleX).toBe(2);
    expect(last.rotation).toBe(30);
  });

  it('peek ends off screen and says so', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'peek', edge: 'right', amount: 0.5 }]);
    expect(r.final!.onScreen).toBe(false);
    expect(Math.max(...r.keyframes!.map((k) => k.properties.x))).toBeGreaterThan(1920);
  });

  it('drop after fly falls from where the actor is, never up and off screen first', () => {
    const r = compileChoreography({ ...BALL, x: 300, y: 820, w: 100, h: 100 }, FRAME,
      [{ at: 3.5, verb: 'fly', to: [1600, 300] }, { at: 4.8, verb: 'drop', to: [1600, 820] }]);
    const atDrop = r.keyframes!.filter((k) => k.time >= 4.7);
    const ys = atDrop.map((k) => k.properties.y);
    // From the fly's end (300) the centre only goes DOWN until the landing squash.
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(300 - 1);
    expect(r.keyframes!.at(-1)!.properties.y).toBe(820);
  });

  it('a drop from the ground still comes in from above the frame', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'drop' }]);
    expect(r.keyframes![0].properties.y).toBeLessThan(0);
  });

  it('refuses overlapping beats and unknown verbs by name', () => {
    expect(compileChoreography(BALL, FRAME, [{ at: 0, verb: 'hop' }, { at: 0.2, verb: 'pop' }]).error).toContain('starts before the previous beat ends');
    expect(compileChoreography(BALL, FRAME, [{ at: 0, verb: 'moonwalk' }]).error).toContain('unknown verb');
  });

  it('every key carries the full property set (no merge gaps)', () => {
    const r = compileChoreography(BALL, FRAME, [{ at: 0, verb: 'pop' }, { at: 0.6, verb: 'fly', to: [1500, 300] }, { at: 2, verb: 'drop', to: [1500, 800] }]);
    for (const k of r.keyframes!) expect(Object.keys(k.properties).sort()).toEqual(['opacity', 'rotation', 'scaleX', 'scaleY', 'x', 'y']);
  });
});

describe('pinepaper_choreograph emitted code', () => {
  function fakeApp(prev: Array<Record<string, any>> = []) {
    const item: Record<string, any> = { position: { x: 200, y: 760 }, bounds: { width: 80, height: 80 }, scaling: { x: 1, y: 1 }, rotation: 0, data: { keyframes: prev.slice() } };
    return {
      item,
      getItemById: (id: string) => (id === 'item_1' ? item : null),
      getCanvasSize: () => ({ width: 1920, height: 1080 }),
      addAnimation: (_id: string, keys: Array<Record<string, any>>) => { item.data.keyframes = item.data.keyframes.concat(keys); },
    };
  }
  const run = (input: unknown, app: Record<string, any>) => {
    const code = codeGenerator.generateChoreograph(ChoreographInputSchema.parse(input));
    return new Function('app', `return ${code.replace(/^(\s*\/\/.*\n)+/, '')}`)(app) as Record<string, any>;
  };

  it('runs the serialised compiler in the studio and writes the track', () => {
    const app = fakeApp();
    const r = run({ itemId: 'item_1', beats: [{ at: 0, verb: 'pop' }, { at: 0.6, verb: 'bounce', times: 3, to: [700, 760] }, { at: 2.4, verb: 'roll', to: [1200, 760] }] }, app);
    expect(r).toMatchObject({ success: true, itemId: 'item_1', beats: 3 });
    expect(r.keyframes).toBe(app.item.data.keyframes.length);
    expect(r.final).toMatchObject({ x: 1200, y: 760, onScreen: true });
  });

  it('warns when the actor already animates a property the beats leave out', () => {
    const r = run({ itemId: 'item_1', beats: [{ at: 0, verb: 'squash' }] }, fakeApp([{ time: 0, properties: { fillColor: '#f00' } }]));
    expect(r.warnings.join(' ')).toContain('fillColor');
  });

  it('refuses a missing actor and an invalid beat', () => {
    expect(run({ itemId: 'item_9', beats: [{ at: 0, verb: 'pop' }] }, fakeApp()).success).toBe(false);
    expect(() => ChoreographInputSchema.parse({ itemId: 'item_1', beats: [{ at: 0, verb: 'roll' }] })).toThrow(/roll needs to/);
  });
});
