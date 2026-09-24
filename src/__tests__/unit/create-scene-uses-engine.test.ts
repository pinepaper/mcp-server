/**
 * create_scene hand-built its own shapes, and most of them were wrong.
 *
 * It emitted a per-type switch of raw Paper constructors — a parallel
 * implementation of app.create covering circle, rectangle, star and text —
 * whose DEFAULT branch made a 30px circle. So ellipse, triangle, polygon,
 * path, line and arc (six of the ten types it declared) silently rendered as a
 * small blue circle, and every property the switch did not name was dropped.
 *
 * A pilot reported ellipse width/height being ignored. The same values work
 * through agent_batch_execute, because batch calls app.create — which is the
 * tell that this was a second implementation, not a missing parameter.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { SceneItemSchema, SceneRelationSchema, ItemTypeSchema, RelationTypeSchema } from '../../types/schemas.js';

const scene = (extra: Record<string, unknown>): string =>
  codeGenerator.generateCreateScene({ items: [], ...extra } as never);

describe('create_scene builds through the engine, not beside it', () => {
  it('calls app.create for every type', () => {
    for (const t of ['ellipse', 'triangle', 'polygon', 'heart', 'speech-bubble']) {
      const code = scene({ items: [{ name: 'x', itemType: t, position: { x: 1, y: 2 } }] });
      expect(code, t).toContain(`app.create('${t}'`);
    }
  });

  it('emits no hand-rolled Paper constructors', () => {
    const code = scene({ items: [{ name: 'x', itemType: 'ellipse', position: { x: 1, y: 2 } }] });
    expect(code).not.toContain('new paper.Path.Circle');
    expect(code).not.toContain('new paper.Path.Rectangle({');
  });

  it('carries the properties the switch used to drop', () => {
    const code = scene({
      items: [{ name: 'e', itemType: 'ellipse', position: { x: 10, y: 20 }, properties: { width: 300, height: 90 } }],
    });
    expect(code).toContain('"width":300');
    expect(code).toContain('"height":90');
  });

  it('names a type the engine refuses instead of drawing something else', () => {
    // The old default branch made a circle for anything unrecognised, so a
    // wrong type produced a plausible picture and reported success.
    const code = scene({ items: [{ name: 'x', itemType: 'circle', position: { x: 1, y: 2 } }] });
    expect(code).toContain('app.create returned nothing for type');
  });

  it('takes the registry id create already minted', () => {
    const code = scene({ items: [{ name: 'x', itemType: 'circle', position: { x: 1, y: 2 } }] });
    expect(code).toContain('item.data && item.data.id');
  });
});

describe('create_scene accepts what the engine accepts', () => {
  it('takes every item type, not a subset of ten', () => {
    expect(SceneItemSchema.shape.itemType.options.length).toBe(ItemTypeSchema.options.length);
    expect(() => SceneItemSchema.parse({ name: 'a', itemType: 'heart' })).not.toThrow();
  });

  it('takes every relation type the catalogue documents', () => {
    // The docs listed ~90 and this accepted 8, so following the catalogue —
    // grows_from, say — failed validation before the call was made.
    expect(SceneRelationSchema.shape.type.options.length).toBe(RelationTypeSchema.options.length);
    expect(() => SceneRelationSchema.parse({ source: 'a', target: 'b', type: 'grows_from' })).not.toThrow();
  });
});

describe('a scene animation can start late', () => {
  it('maps startTime to the animationDelay the engine reads', () => {
    const code = codeGenerator.generateCreateScene({
      items: [{ name: 'e', itemType: 'circle', position: { x: 1, y: 2 } }],
      animations: [{ target: 'e', type: 'pulse', startTime: 2.5 }],
    } as never);
    expect(code).toContain('"animationDelay":2.5');
  });

  it('says nothing about delay when none was asked for', () => {
    const code = codeGenerator.generateCreateScene({
      items: [{ name: 'e', itemType: 'circle', position: { x: 1, y: 2 } }],
      animations: [{ target: 'e', type: 'pulse' }],
    } as never);
    // Comments stripped: the emitted code EXPLAINS the startTime mapping and
    // names animationDelay in prose, which satisfies a naive search.
    const executable = code.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
    expect(executable).not.toContain('animationDelay');
  });
});
