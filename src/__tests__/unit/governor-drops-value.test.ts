/**
 * Code past FxTool's governor scan limit runs ungoverned, because the governor
 * would drop its value.
 *
 * GeneratedCodeRunner does not rewrite a trailing `(async function () { … })();`
 * into `return (…)` once the code is longer than 400,000 characters, so the run
 * answered success with no result straight away while the batch carried on in
 * the page. Measured: a 403-op batch replied in 83 ms, and the export sent after
 * it started before the batch's set_background had run.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { GOVERNOR_MAX_CODE_CHARS, governorDropsValue } from '../../browser/puppeteer-controller.js';

const batch = (creates: number): string => {
  const ops: Array<Record<string, unknown>> = [{ type: 'set_canvas_size', width: 1280, height: 720 }, { type: 'set_background', color: '#0b1020' }];
  for (let i = 0; i < creates; i++) ops.push({ type: 'create', itemType: 'circle', position: { x: 640, y: 360 }, properties: { radius: 3, color: '#ffd54f', name: 'dot-' + i } });
  return codeGenerator.generateAgentBatchExecute({ operations: ops } as never);
};

describe('code the governor would lose the value of runs ungoverned', () => {
  it('matches the governor limit (GeneratedCodeRunner injectLoopGuards / wrapTrailingReturn)', () => {
    expect(GOVERNOR_MAX_CODE_CHARS).toBe(400_000);
  });

  it('a batch past the limit is detected (400 creates were, before the shared op wrapper shrank each op)', () => {
    const code = batch(1500);
    expect(code.length).toBeGreaterThan(GOVERNOR_MAX_CODE_CHARS);
    expect(governorDropsValue(code)).toBe(true);
  });

  it('an ordinary batch stays governed', () => {
    expect(governorDropsValue(batch(12))).toBe(false);
  });
});
