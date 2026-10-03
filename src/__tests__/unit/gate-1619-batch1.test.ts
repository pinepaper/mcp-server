/**
 * 1.6.19 gate, batch 1: two fixes the first live re-run caught.
 *
 * C6 `background {action:'get'}` answered "#NaN293b" for #1e293b. The page
 *    regex lived in a template literal, where `\(` and `\s` lose their
 *    backslash, so the page ran a different regex. Only evaluating the EMITTED
 *    code sees that; reading the TypeScript source does not.
 * D2 add_relation refused a name register_custom_relation had just accepted:
 *    the handler allowed it, then the code generator re-parsed against the enum.
 */

import { describe, it, expect } from 'bun:test';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

const gen = new PinePaperCodeGenerator();

function backgroundGet(css: string): unknown {
  const app = { canvasEl: { style: { backgroundColor: css } } };
  // eval, not `return <code>`: the emitted code opens with a // comment.
  return new Function('app', 'code', 'return eval(code)')(app, gen.generateBackground({ action: 'get' } as never));
}

describe('background get (C6)', () => {
  it('reads the canvas colour as hex', () => {
    expect((backgroundGet('rgb(30, 41, 59)') as { color: string }).color).toBe('#1e293b');
    expect((backgroundGet('rgb(30 41 59 / 1)') as { color: string }).color).toBe('#1e293b');
  });

  it('a zero-alpha colour reads as transparent', () => {
    expect((backgroundGet('rgba(0, 0, 0, 0)') as { color: string }).color).toBe('transparent');
  });
});

describe('custom relation names (D2)', () => {
  it('a registered name is accepted by add_relation; an unregistered one is not', async () => {
    const reg = await handleToolCall('pinepaper_register_custom_relation', {
      name: 'hover_near_test', computeFunction: 'return {};', applyFunction: '',
    });
    expect(reg.isError).toBeFalsy();
    const ok = await handleToolCall('pinepaper_add_relation', { sourceId: 'a', targetId: 'b', relationType: 'hover_near_test' });
    expect(ok.isError).toBeFalsy();
    const text = ok.content.map((c) => ('text' in c ? c.text : '')).join('');
    expect(text).toContain('hover_near_test');
    const bad = await handleToolCall('pinepaper_add_relation', { sourceId: 'a', targetId: 'b', relationType: 'never_registered' });
    expect(bad.isError).toBe(true);
  });
});
