/**
 * pinepaper_stick and pinepaper_story.
 *
 * The stick kit's options — pose, walk, travel, prop, garment, trouser, hair,
 * a timeline of expressions — were discoverable only by reading the engine's
 * source. The story assembler's `distill` half was not reachable at all, which
 * mattered more than the rest: without it the only way to learn what the
 * distiller made of a text was to look at a finished scene.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { StickInputSchema, StoryInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const stick = (i: Record<string, unknown>) => codeGenerator.generateStick(StickInputSchema.parse(i));
const story = (i: Record<string, unknown>) => codeGenerator.generateStory(StoryInputSchema.parse(i));

describe('stick', () => {
  it('routes to the right facade and drops the action from the options bag', () => {
    const fig = stick({ action: 'figure', pose: 'wave', walk: true });
    expect(fig).toContain('app.stickFigure(');
    expect(fig).toContain('"pose":"wave"');
    expect(fig).toContain('"walk":true');
    // `action` is this tool's routing, not the kit's option.
    expect(fig).not.toContain('"action"');

    expect(stick({ action: 'set', floor: true })).toContain('app.stickSet(');
  });

  it('omits fields that were not given, rather than sending nulls', () => {
    const code = stick({ action: 'figure', pose: 'idle' });
    for (const absent of ['"walk"', '"prop"', '"garment"', '"hair"', '"travel"']) {
      expect(code).not.toContain(absent);
    }
  });

  it('carries the whole option surface the engine reads', () => {
    const code = stick({
      action: 'figure', pose: 'wave', poseAt: 1.5, expression: 'smile',
      expressions: [{ at: 0.5, name: 'blink' }], walk: true, travel: { to: 400 },
      prop: 'umbrella', propSide: 'left', garment: 'coat', trouser: 'jeans',
      hair: 'bob', withHair: true, facing: 'left', scale: 1.4,
      groundY: 500, durationSeconds: 6, id: 'walker',
    });
    for (const frag of ['"poseAt":1.5', '"expressions"', '"travel"', '"propSide":"left"', '"trouser":"jeans"', '"withHair":true', '"groundY":500']) {
      expect(code).toContain(frag);
    }
    expect(() => new Function(code)).not.toThrow();
  });

  it('names the vendoring in the failure, because the fix is in another repo', () => {
    expect(stick({ action: 'figure' })).toContain('vendored from mcp-cloud');
  });

  it('says it is not pinepaper_character', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_stick')!;
    expect(tool.description).toContain('DESIGN GRAPH');
    expect(tool.description).toContain('three-repo artifact');
  });
});

describe('story', () => {
  it('distill draws nothing, and says so', () => {
    const code = story({ action: 'distill', text: 'Once upon a time.' });
    expect(code).toContain('app.distillArticle(');
    expect(code).toContain('drawing NOTHING');
    expect(code).not.toContain('storyFromText');
    expect(code).not.toContain('applyStorySpec');
  });

  it('each other action reaches its own facade', () => {
    expect(story({ action: 'from_text', text: 'x' })).toContain('app.storyFromText(');
    expect(story({ action: 'apply_spec', spec: { beats: [] } })).toContain('app.applyStorySpec(');
    expect(story({ action: 'plan_book', images: ['a', 'b'] })).toContain('app.planBook(["a","b"]');
  });

  it('an empty result is a failure, not a quiet success', () => {
    expect(story({ action: 'distill', text: 'x' })).toContain('made nothing of that text');
    expect(story({ action: 'plan_book', images: ['a'] })).toContain('no plan came back');
  });

  it('every variant parses', () => {
    for (const i of [
      { action: 'distill', text: 'x' }, { action: 'from_text', text: 'x' },
      { action: 'apply_spec', spec: {} }, { action: 'plan_book', images: ['a'] },
    ]) expect(() => new Function(story(i))).not.toThrow();
  });

  it('refuses an incomplete call by naming the field', () => {
    for (const [input, field] of [
      [{ action: 'distill' }, 'text'],
      [{ action: 'from_text' }, 'text'],
      [{ action: 'apply_spec' }, 'spec'],
      [{ action: 'plan_book' }, 'images'],
      [{ action: 'plan_book', images: [] }, 'images'],
    ] as Array<[Record<string, unknown>, string]>) {
      const r = StoryInputSchema.safeParse(input);
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain(field);
    }
  });

  it('explains why distill is worth having on its own', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_story')!;
    expect(tool.description).toContain('draw NOTHING');
    expect(tool.description).toContain('edit the beats');
  });
});
