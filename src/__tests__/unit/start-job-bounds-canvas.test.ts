/**
 * start_job fixes an unbounded canvas at the size it reports (gate D57).
 *
 * An unbounded canvas answers getCanvasSize with a 1920x1080 fallback, so the
 * job reported 1920x1080; but its stills export the artwork's bounds plus a
 * margin (a 400x200 rectangle came out 432x232) while video exports the board.
 * setCanvasSize({width, height}) is the engine call that clears `unbounded`.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function fakeApp(unbounded: boolean) {
  const calls: unknown[] = [];
  const app: Record<string, any> = {
    canvasSize: { width: 1920, height: 1080, unbounded },
    getCanvasSize() { return { width: this.canvasSize.width, height: this.canvasSize.height }; },
    setCanvasSize(arg: any) {
      calls.push(arg);
      if (typeof arg === 'object') this.canvasSize = { width: arg.width, height: arg.height, unbounded: false };
      return { ok: true, width: arg.width, height: arg.height };
    },
    clearCanvas() {},
  };
  return { app, calls };
}

async function run(code: string, app: Record<string, any>) {
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return (await new Function('app', `return ${body}`)(app)) as Record<string, any>;
}

describe('start_job bounds an unbounded canvas (D57)', () => {
  it('fixes it at the reported size and says so', async () => {
    const { app, calls } = fakeApp(true);
    const r = await run(codeGenerator.generateAgentStartJob({ includeOntology: false } as never), app);
    expect(calls).toEqual([{ width: 1920, height: 1080 }]);
    expect(app.canvasSize.unbounded).toBe(false);
    expect(r.canvasSize).toEqual({ width: 1920, height: 1080 });
    expect(r.note).toContain('unbounded');
  });

  it('leaves a bounded canvas alone', async () => {
    const { app, calls } = fakeApp(false);
    const r = await run(codeGenerator.generateAgentStartJob({ includeOntology: false } as never), app);
    expect(calls).toEqual([]);
    expect(r.note).toBeUndefined();
  });

  it('a preset sets the size itself', async () => {
    const { app, calls } = fakeApp(true);
    await run(codeGenerator.generateAgentStartJob({ includeOntology: false, canvasPreset: 'youtube' } as never), app);
    expect(calls.length).toBe(1);
    expect(typeof calls[0]).toBe('string');
  });
});
