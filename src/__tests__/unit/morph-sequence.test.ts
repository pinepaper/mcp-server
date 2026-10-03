/** D73: one element through N states as a morphs_to chain, with the camera on the same timing. */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { MorphSequenceInputSchema } from '../../types/schemas.js';

function studio() {
  const items: Record<string, any> = { item_1: { bounds: { width: 200, height: 60, center: { x: 960, y: 540 } } } };
  let n = 1;
  const rels: Array<[string, string, string, any]> = [];
  const cam: any[] = [];
  const sounds: any[] = [];
  const app = {
    getItemById: (id: string) => items[id] || null,
    create: (_t: string, p: any) => { const id = 'item_' + (++n); items[id] = { bounds: { width: p.width || p.radius * 2 || 50, height: p.height || p.radius * 2 || 50, center: { x: p.x, y: p.y } } }; return { data: { registryId: id } }; },
    addRelation: (s: string, t: string, type: string, p: any) => { rels.push([s, t, type, p]); return true; },
    getRelations: (id: string, type: string) => rels.filter((r) => r[0] === id && r[2] === type),
    getCanvasSize: () => ({ width: 1920, height: 1080 }),
    camera: { animate: (k: any[]) => { cam.push(...k); } },
    sfxSpec: (nm: string) => (nm === 'whoosh' ? { duration: 0.8 } : null),
    createSound: (_s: any, o: any) => { sounds.push(o.startTime); return { data: { id: 's' + sounds.length } }; },
  };
  return { app, rels, cam, sounds };
}
const run = (input: unknown, app: unknown) => new Function('app', `return ${codeGenerator.generateMorphSequence(MorphSequenceInputSchema.parse(input)).replace(/^(\s*\/\/.*\n)+/, '')}`)(app);
const INPUT = { itemId: 'item_1', camera: true, sound: true, states: [
  { at: 3, shape: { itemType: 'circle', position: { x: 960, y: 540 }, properties: { radius: 18 } } },
  { at: 1, shape: { itemType: 'rectangle', position: { x: 960, y: 540 }, properties: { width: 640, height: 88 } } },
] };

describe('morph sequence', () => {
  it('chains morphs_to in time order, each with its delay', () => {
    const s = studio();
    const r = run(INPUT, s.app);
    expect(r.success).toBe(true);
    expect(s.rels.map((x) => [x[2], x[3].delay, x[3].duration])).toEqual([['morphs_to', 1, 0.8], ['morphs_to', 3, 0.8]]);
    expect(r.end).toBeCloseTo(3.8, 5);
  });
  it('the camera holds while a state rests and moves with each morph', () => {
    const s = studio();
    run(INPUT, s.app);
    expect(s.cam.map((k) => k.time)).toEqual([0, 1, 1.8, 3, 3.8]);
    expect(s.cam[4].zoom).toBeGreaterThan(s.cam[2].zoom);   // the small dot is framed closer than the wide field
  });
  it('a whoosh at each morph start', () => {
    const s = studio();
    run(INPUT, s.app);
    expect(s.sounds).toEqual([1, 3]);
  });
  it('refuses overlapping states and a state with both or neither of to / shape', () => {
    expect(() => MorphSequenceInputSchema.parse({ itemId: 'i', states: [{ at: 0, to: 'a' }, { at: 0.5, to: 'b' }] })).toThrow(/starts before/);
    expect(() => MorphSequenceInputSchema.parse({ itemId: 'i', states: [{ at: 0 }] })).toThrow(/exactly one/);
  });
});
