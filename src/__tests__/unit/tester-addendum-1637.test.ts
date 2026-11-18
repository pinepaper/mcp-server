/**
 * Server-side fixes from the tester's 1.6.37 addendum #2 (2026-11-17): WEBPFID37, GIFDRAFT37 / GIFMAXLAD37,
 * GRADTRAIL37 / GRADRIM36, and the estimate's notModelled once the studio models the budget and the encoder.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const run = (code: string, app: Record<string, unknown>) => {
  const body = code.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n').trim().replace(/;\s*$/, '');
  return new Function('app', `return ${body}`)(app);
};
const estimateOf = (input: Record<string, unknown>, est: Record<string, unknown>, fidelity: Record<string, unknown> = { warnings: [], checked: {} }) =>
  run(codeGenerator.generateAgentExport({ estimateOnly: true, ...input } as never), {
    estimateExportSize: async () => est,
    getCanvasSize: () => ({ width: 100, height: 100 }),
    exportEngine: { exportFidelity: () => fidelity, sceneHasAudio: () => false },
    canvasEl: { style: { backgroundColor: '#fff' } },
  }) as Promise<Record<string, any>>;

describe('WEBPFID37: a still of a moving scene says the motion is lost', () => {
  it('webp, jpg and png of an animated scene: warned, no "loses nothing"', async () => {
    for (const format of ['webp', 'jpg', 'png']) {
      const r = await estimateOf({ format }, { bytes: 1 }, { warnings: [], checked: { animated: true } });
      expect(r.fidelity.warnings.map((w: any) => w.code)).toContain('animation');
      expect(r.fidelity.note).toBeUndefined();
    }
  });
  it('said once when the studio said it, and not for a still scene', async () => {
    const said = await estimateOf({ format: 'webp' }, { bytes: 1 }, { warnings: [{ code: 'animation', message: 'x' }], checked: { animated: true } });
    expect(said.fidelity.warnings.filter((w: any) => w.code === 'animation')).toHaveLength(1);
    const still = await estimateOf({ format: 'webp' }, { bytes: 1 }, { warnings: [], checked: { animated: false } });
    expect(still.fidelity.warnings).toHaveLength(0);
  });
});

describe('ESTGIF37 / ESTSUB37: notModelled lists only what the studio did not run', () => {
  it('passes the budget to the studio, and drops the notes it answered', async () => {
    expect(codeGenerator.generateAgentExport({ format: 'gif', maxBytes: 60000, estimateOnly: true } as never)).toContain('maxBytes: 60000,');
    expect((await estimateOf({ format: 'gif', maxBytes: 60000 }, { bytes: 1, budget: { met: true } })).notModelled).toBeUndefined();
    expect((await estimateOf({ format: 'gif', maxBytes: 60000 }, { bytes: 1 })).notModelled[0]).toContain('GIF budget');
    expect((await estimateOf({ format: 'mp4' }, { bytes: 1, delivery: { format: 'webm' } })).notModelled).toBeUndefined();
    expect((await estimateOf({ format: 'mp4' }, { bytes: 1 })).notModelled[0]).toContain('encoder support');
  });
});

describe('GIFDRAFT37 / GIFMAXLAD37: the GIF budget loop', () => {
  const code = codeGenerator.generateAgentExport({ format: 'gif', maxBytes: 60000 } as never);
  it('does not prescribe quality draft, which does not shrink a GIF', () => {
    expect(code).not.toContain('use quality "draft"');
    expect(code).toContain('then fewer frames per second');
  });
  it('takes a third retry', () => expect(code).toContain('k < 3 && best.size > 60000'));
});

describe('GRADTRAIL37 / GRADRIM36: a gradient fill gets no stroke it was not given', () => {
  const grad = { type: 'linear', stops: [{ color: '#f00', offset: 0 }, { color: '#00f', offset: 1 }] };
  const create = (itemType: string, properties: Record<string, unknown>) => codeGenerator.generateCreateItem({ itemType, properties } as never);
  it('clears the default stroke on a closed path and a shape', () => {
    expect(create('path', { pathData: 'M0 0 L10 0 L10 10 Z', fillColor: grad })).toContain('item.strokeColor = null');
    expect(create('circle', { radius: 20, color: grad })).toContain('item.strokeColor = null');
  });
  it('keeps an asked-for stroke, and an open line', () => {
    expect(create('circle', { radius: 20, color: grad, strokeColor: '#000' })).not.toContain('item.strokeColor = null');
    expect(create('circle', { radius: 20, color: grad, strokeWidth: 3 })).not.toContain('item.strokeColor = null');
    expect(create('path', { pathData: 'M0 0 L10 0', color: grad })).not.toContain('item.strokeColor = null');
  });
});

describe('GIFMAX34: after smaller frames, fewer frames per second', () => {
  const code = codeGenerator.generateAgentExport({ format: 'gif', maxBytes: 60000, fps: 30 } as never);
  it('tries 20 and 15 fps at the best size, and says when the rate came down', () => {
    expect(code).toContain('Math.round(__fps0 * 2 / 3), Math.round(__fps0 / 2)');
    expect(code).toContain("fpsReduced = { from: __fps0, to: bestFps, reason: 'maxBytes' }");
  });
});
