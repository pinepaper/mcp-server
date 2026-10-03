/** D109: a story's form — 'scenes' (video, a scene chain) or 'panels' (widget). */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { StoryInputSchema } from '../../types/schemas.js';

const run = async (input: unknown, app: unknown) => new Function('app', `return ${codeGenerator.generateStory(StoryInputSchema.parse(input)).replace(/^(\s*\/\/.*\n)+/, '')}`)(app);

describe('story nav', () => {
  it("from_text nav:'scenes' passes nav to storyFromText and returns the cut times", async () => {
    let opts: any = null;
    const r = await run({ action: 'from_text', text: 'One. Two. Three.', nav: 'scenes' }, {
      storyFromText: async (_t: string, o: any) => { opts = o; return { spec: { nav: 'scenes' }, partIds: ['a', 'b', 'c'], partCount: 3 }; },
      sceneManager: { getChainCuts: () => [{ index: 0, time: 2.5 }, { index: 1, time: 5.5 }] },
    });
    expect(opts.nav).toBe('scenes');
    expect(r).toMatchObject({ success: true, nav: 'scenes', partCount: 3, cuts: [{ time: 2.5 }, { time: 5.5 }] });
  });
  it('apply_spec fills in a nav the spec does not carry, and keeps one it does', async () => {
    let got: any = null;
    const app = { applyStorySpec: async (s: any) => { got = s; return { parts: 2 }; } };
    await run({ action: 'apply_spec', spec: { title: 'x' }, nav: 'scenes' }, app);
    expect(got.nav).toBe('scenes');
    await run({ action: 'apply_spec', spec: { title: 'x', nav: 'panels' }, nav: 'scenes' }, app);
    expect(got.nav).toBe('panels');
  });
  it('default is panels, with no cuts read', async () => {
    const r = await run({ action: 'from_text', text: 'One.' }, { storyFromText: async () => ({ spec: {}, partIds: [], partCount: 1 }) });
    expect(r.nav).toBe('panels');
    expect(r.cuts).toBeUndefined();
  });
});
