/**
 * pinepaper_styled_scene (FxTool K2): app.styledScene answers {ok:false, error}
 * instead of rejecting, so the verdict is read; and the styles are the
 * engine's generated list.
 */
import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { StyledSceneInputSchema } from '../../types/schemas.js';
import { STYLED_SCENE_STYLES } from '../../tools/engine-lists.js';

const gen = new PinePaperCodeGenerator();
const run = async (app: Record<string, unknown>, input: Record<string, unknown>) =>
  new Function('app', 'code', 'return eval(code)')(app, gen.generateStyledScene(StyledSceneInputSchema.parse(input)));

describe('styled_scene', () => {
  it('offers the engine\'s six styles', () => {
    expect([...STYLED_SCENE_STYLES]).toEqual(['cut', 'ink', 'watercolor', 'dither', 'flow', 'ascii']);
  });

  it('passes spec and options, and returns the id and the duration to export for', async () => {
    let seen: unknown[] = [];
    const app = { styledScene: async (...a: unknown[]) => { seen = a; return { ok: true, id: 'item_9', style: 'ink', width: 1920, height: 1080, duration: 6, firstFrameMs: 12 }; } };
    const r = await run(app, { style: 'ink', duration: 6, spec: { hud: { label: 'x' } } });
    expect(seen).toEqual([{ hud: { label: 'x' } }, { style: 'ink', duration: 6 }]);
    expect(r).toMatchObject({ success: true, itemId: 'item_9', duration: 6 });
    expect(r.notes[0]).toContain('agent_export duration: 6');
  });

  it('an engine refusal is a failure, with the engine\'s reason', async () => {
    const app = { styledScene: async () => ({ ok: false, error: "styledScene: unknown style 'neon' (known: cut, ink)" }) };
    const r = await run(app, { style: 'neon' });
    expect(r).toEqual({ success: false, error: "styledScene: unknown style 'neon' (known: cut, ink)" });
  });

  it('dither and ascii say they need Chrome', async () => {
    const app = { styledScene: async () => ({ ok: true, id: 'i', style: 'dither', width: 1, height: 1, duration: 8 }) };
    expect((await run(app, { style: 'dither' })).notes.join(' ')).toContain('Chrome');
  });
});
