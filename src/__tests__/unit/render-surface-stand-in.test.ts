/**
 * 'shader' and 'field' are created as a plate tagged data.renderAs (round 5 R, 5.31).
 *
 * Create used to answer with the plate's renderParams and no itemId. Since
 * FxTool D19 the studio draws the surface over that plate in the live view and
 * every export, so the old "a local export shows the plate" note and the
 * render_time_surface_stand_in export warning became false and were removed.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

function plateApp() {
  const item = { data: { registryId: 'item_9' } as Record<string, unknown> };
  return { item, app: { create: () => item } };
}

describe('shader / field create', () => {
  it('answers with an itemId and tags the plate, claiming no local gap', () => {
    const code = gen.generateCreateItem({ itemType: 'shader', position: { x: 10, y: 20 }, properties: { shader: 'water', width: 800, height: 400 } });
    const { app, item } = plateApp();
    // Same evaluation the browser controller uses: the snippet's completion value.
    // eslint-disable-next-line no-eval
    const r = (0, eval)(`(function(app){ return eval(${JSON.stringify(code)}); })`)(app);
    expect(r.itemId).toBe('item_9');
    expect(item.data.renderAs).toBe('shader');
    expect((item.data.renderParams as Record<string, unknown>).shader).toBe('water');
    expect(r.localStandIn).toBeUndefined();
    expect(code).not.toContain('only in a cloud render');
  });
});

describe('agent_export no longer calls a surface a stand-in', () => {
  it('emits no stand-in warning', () => {
    const code = gen.generateAgentExport({ platform: 'youtube', format: 'mp4' } as never);
    expect(code).not.toContain('render_time_surface_stand_in');
    expect(code).not.toContain('standIns');
  });
});

describe('fidelity names alpha a format drops (8.12)', () => {
  const code = gen.generateAgentExport({ platform: 'youtube', format: 'webm' } as never);
  const src = /function alphaLoss\(fmt\) \{[\s\S]*?\n  \}\n/.exec(code)?.[0];
  const alphaLoss = new Function('app', 'fmt', `${src}; return alphaLoss(fmt);`);

  it('warns for webm / mp4 / jpg on a transparent scene', () => {
    const app = { canvasEl: { style: { backgroundColor: '' } }, patternGroup: { children: [] } };
    expect(alphaLoss(app, 'webm')[0].code).toBe('alpha_dropped');
    expect(alphaLoss(app, 'mp4')[0].message).toContain('BLACK');
    expect(alphaLoss(app, 'jpg')[0].message).toContain('white');
    expect(alphaLoss(app, 'png')).toEqual([]);
  });

  it('is silent when there is a background colour or backdrop items', () => {
    expect(alphaLoss({ canvasEl: { style: { backgroundColor: 'rgb(0, 0, 0)' } } }, 'webm')).toEqual([]);
    expect(alphaLoss({ canvasEl: { style: {} }, patternGroup: { children: [{}] } }, 'webm')).toEqual([]);
    expect(alphaLoss({ canvasEl: { style: { backgroundColor: 'rgba(0, 0, 0, 0)' } }, patternGroup: { children: [] } }, 'webm')).toHaveLength(1);
  });
});
