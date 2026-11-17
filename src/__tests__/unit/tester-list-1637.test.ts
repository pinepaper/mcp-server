/**
 * Server-side fixes from the tester's 1.6.37 list (2026-11-16): each one a plausible request accepted with success
 * and then not done, or a receipt that said nothing was lost when something was.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator, normalizeEmitterSpec } from '../../types/code-generator.js';
import { CreateItemInputSchema, ModifyItemInputSchema, KeyframeAnimateInputSchema, SetBackgroundColorInputSchema } from '../../types/schemas.js';
import { isCssColor } from '../../types/css-color.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const run = (code: string, app: Record<string, unknown>, extra: Record<string, unknown> = {}) => {
  const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').trim().replace(/;\s*$/, '');
  const names = Object.keys(extra);
  return new Function('app', ...names, `return ${body}`)(app, ...names.map((n) => extra[n]));
};

describe('COLORBAD37: a string that is not a colour is refused, not drawn black', () => {
  it('knows colours', () => {
    for (const c of ['#fff', '#ffcc00', '#ffcc0080', 'rgb(1, 2, 3)', 'rgba(1,2,3,0.5)', 'hsl(10 50% 50%)', 'tomato', 'Transparent', 'none']) expect(isCssColor(c)).toBe(true);
    for (const c of ['#notacolor', '#12', 'reddish', 'rgb(1,2,3', '', 'blue;']) expect(isCssColor(c)).toBe(false);
  });
  it('on create, modify, keyframes and the background', () => {
    expect(() => CreateItemInputSchema.parse({ itemType: 'circle', properties: { color: '#notacolor' } })).toThrow(/is not a colour/);
    expect(() => ModifyItemInputSchema.parse({ itemId: 'i', properties: { fillColor: 'nope' } })).toThrow(/is not a colour/);
    expect(() => KeyframeAnimateInputSchema.parse({ itemId: 'i', keyframes: [{ time: 0, properties: { color: '#notacolor' } }] })).toThrow(/is not a colour/);
    expect(() => SetBackgroundColorInputSchema.parse({ color: '#zzz' })).toThrow(/is not a colour/);
    expect(CreateItemInputSchema.parse({ itemType: 'circle', properties: { color: '#ff0000', strokeColor: 'navy' } })).toBeTruthy();
  });
});

describe('STROKEPOSKEY37: a keyframed strokePosition that is not outside / center is refused', () => {
  it('"inside" on a keyframe', () => {
    expect(() => KeyframeAnimateInputSchema.parse({ itemId: 'i', keyframes: [{ time: 0, properties: { strokePosition: 'inside' } }] })).toThrow(/not 'outside' or 'center'/);
    expect(KeyframeAnimateInputSchema.parse({ itemId: 'i', keyframes: [{ time: 0, properties: { strokePosition: 'outside' } }] })).toBeTruthy();
  });
});

describe('SHADOFFX37 / SHADOFFY37: create takes shadowOffsetX / shadowOffsetY', () => {
  it('applies them and does not call them ignored, negative and zero included', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'text', position: { x: 1, y: 1 }, properties: { content: 'hi', shadowColor: '#000', shadowOffsetX: -6, shadowOffsetY: 0 } } as never);
    expect(code).toContain('item.shadowOffset = new paper.Point(-6, 0)');
    expect(code).not.toMatch(/ignoredProperties[^\n]*shadowOffset/);
  });
  it('one axis keeps the other', () => {
    const code = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 1, y: 1 }, properties: { width: 9, height: 9, shadowOffsetY: 4 } } as never);
    expect(code).toContain('new paper.Point(__so.x, 4)');
  });
});

describe('SIZESWARN37: a sizes list shorter than count says it cycles', () => {
  it('warns when it cycles, not when there is one size per particle', () => {
    expect(normalizeEmitterSpec({ bursts: [{ t: 0, x: 0, y: 0, count: 10, sizes: [2, 8, 16] }] }).warnings.join(' ')).toContain('bursts[0]: count 10 with 3 sizes: particle i takes sizes[i % 3]');
    expect(normalizeEmitterSpec({ bursts: [{ t: 0, x: 0, y: 0, count: 3, sizes: [2, 8, 16] }] }).warnings).toEqual([]);
  });
});

describe('LOOPZERO37: loop 0 plays once on gif and apng', () => {
  it('is sent as false', () => {
    const code = codeGenerator.generateAgentExport({ format: 'apng', loop: 0 } as never);
    expect(code).toContain('loop: false');
    expect(code).not.toContain('loop: 0');
  });
});

describe('ESTGIF37 / ESTSUB37: an estimate says what it does not model', () => {
  it('the GIF budget, and encoder support for video', () => {
    expect(codeGenerator.generateAgentExport({ format: 'gif', maxBytes: 20000, estimateOnly: true } as never)).toContain('the 20000-byte GIF budget');
    expect(codeGenerator.generateAgentExport({ format: 'mp4', estimateOnly: true } as never)).toContain('encoder support: if this browser cannot encode');
  });
});

describe('AUDFALSE37: a format with no audio track says the soundtrack is missing', () => {
  const fidelityOf = (fmt: string, hasAudio: boolean, engineWarnings: Array<{ code: string }> = []) => {
    const code = codeGenerator.generateAgentExport({ format: fmt, estimateOnly: true } as never);
    const app = {
      estimateExportSize: async () => ({ bytes: 1 }),
      getCanvasSize: () => ({ width: 100, height: 100 }),
      exportEngine: { exportFidelity: () => ({ warnings: engineWarnings, checked: [] }), sceneHasAudio: () => hasAudio },
      canvasEl: { style: { backgroundColor: '#fff' } },
    };
    return run(code, app).then((r: any) => r.fidelity);
  };
  it('apng and webp with a soundtrack: warned, no "loses nothing"', async () => {
    for (const fmt of ['apng', 'webp']) {
      const f = await fidelityOf(fmt, true);
      expect(f.warnings.map((w: any) => w.code)).toContain('audio');
      expect(f.note).toBeUndefined();
    }
  });
  it('said once when the studio already said it, and not at all without audio', async () => {
    expect((await fidelityOf('gif', true, [{ code: 'audio' }])).warnings.filter((w: any) => w.code === 'audio')).toHaveLength(1);
    expect((await fidelityOf('apng', false)).warnings.map((w: any) => w.code)).not.toContain('audio');
  });
});

describe('docs', () => {
  const desc = (t: string) => JSON.stringify(PINEPAPER_TOOLS.find((x) => x.name === t));
  it('ROLLTO37: roll and fly need to', () => expect(desc('pinepaper_choreograph')).toContain('to is required for roll and fly'));
  it('SNDGAIN37: cue gain is relative', () => expect(PINEPAPER_TOOLS.map((t) => t.description).join(' ')).toContain('gain is RELATIVE'));
});

describe('CHECKCOVER37: a loaded font that draws none of the text is not "not loaded"', () => {
  it('re-checks without the text and says it is loaded', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    let code = '';
    const controller = { connected: true, connect: async () => undefined, executeCode: async (c: string) => { code = c; return { success: true, result: { success: true } }; } };
    await handleToolCall('pinepaper_font', { action: 'check', name: 'Anton', text: '中文' }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' });
    const app = {
      checkFont: (_f: string, text?: string) => (text ? { family: 'Anton', available: false, covered: '', missing: '中文', reason: 'fell back' } : { family: 'Anton', available: true }),
    };
    const r = await run(code, app);
    expect(r.available).toBe(true);
    expect(r.drawsText).toBe(false);
    expect(r.note).toContain('Anton is loaded, but has no glyph for any of these characters');
    expect(r.hint).toBeUndefined();
  });
});
