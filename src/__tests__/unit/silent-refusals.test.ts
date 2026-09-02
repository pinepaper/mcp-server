/**
 * Three engine appliers used to refuse ONLY to a console the production build
 * strips, returning values identical between success and failure:
 *
 *   animate            returned undefined either way
 *   applyAnimatedMask  returned a Paper Group either way
 *   applyCutoutStyle   returned the very item it was given
 *
 * So over MCP — an agent with no console — an unknown key left the canvas
 * unchanged and every caller told it had worked. FxTool 52c4a72b records the
 * refusal on the item it already hands back instead. These pin that we READ it:
 * the engine writing a record nobody reads is the same silence in a new place.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import {
  ApplyAnimatedMaskInputSchema,
  CutoutStyleInputSchema,
  AnimateItemInputSchema,
} from '../../types/schemas.js';

/**
 * Mimic the engine's `wrapTrailingReturn`: at runtime a generated snippet's
 * final `(`-led expression statement is REPL-transformed into a return, which is
 * how its value reaches the caller. Without that the emitted code evaluates
 * correctly and hands back undefined, so a test would read nothing.
 */
const runnable = (code: string) =>
  code
    .replace('(function()', 'return (function()')
    .replace('(async function()', 'return (async function()')
    .replace(/\n\(\(\) =>/, '\nreturn (() =>');

describe('animate surfaces a refused animationType', () => {
  const code = codeGenerator.generateAnimate(
    AnimateItemInputSchema.parse({ itemId: 'item_1', animationType: 'pulse' }),
  );

  it('reports the refusal, the requested value and the known list', () => {
    const item = { data: { animationRejected: { requested: 'slide', known: ['pulse', 'rotate'] } } };
    const res = new Function('app', runnable(code))({ getItemById: () => item, animate: () => {} });
    expect(res.success).toBe(false);
    expect(res.requested).toBe('slide');
    // `known` rides along so a caller can correct itself without a second call.
    expect(res.known).toEqual(['pulse', 'rotate']);
  });

  it('still reports success when the engine records nothing', () => {
    const item = { data: {} };
    const res = new Function('app', runnable(code))({ getItemById: () => item, animate: () => {} });
    expect(res).toMatchObject({ success: true, animationType: 'pulse' });
  });
});

describe('applyAnimatedMask surfaces a refused animation preset', () => {
  const code = codeGenerator.generateApplyAnimatedMask(
    ApplyAnimatedMaskInputSchema.parse({ itemId: 'item_1', preset: 'wipeLeft' }),
  );

  it('a masked-but-inert result is a failure, not a success', () => {
    // The item IS masked, so the group is truthy — !!group was always true.
    const group = { data: { maskAnimationRejected: { requested: 'nope', known: ['wipeLeft'] } } };
    const res = new Function('app', runnable(code))({
      getItemById: () => ({ data: {} }),
      applyAnimatedMask: () => group,
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('will NOT animate');
    expect(res.known).toEqual(['wipeLeft']);
  });

  it('a clean mask still succeeds', () => {
    const res = new Function('app', runnable(code))({
      getItemById: () => ({ data: {} }),
      applyAnimatedMask: () => ({ data: {} }),
    });
    expect(res.success).toBe(true);
  });
});

describe('applyCutoutStyle surfaces a refused preset', () => {
  const code = codeGenerator.generateCutoutStyle(
    CutoutStyleInputSchema.parse({ action: 'apply', itemId: 'item_1', preset: 'nope' }),
  );

  it('an unchanged item is a failure, not a success', async () => {
    // The applier returns the very item it was given, so a truthy result
    // proves nothing at all about whether anything happened.
    const item = { data: { cutoutStyleRejected: { requested: 'nope', known: ['sticker'] } } };
    const res = await new Function('app', runnable(code))({
      imageTools: { applyCutoutStyle: async () => item },
    });
    expect(res.success).toBe(false);
    expect(res.error).toContain('UNCHANGED');
    expect(res.requested).toBe('nope');
  });
});
