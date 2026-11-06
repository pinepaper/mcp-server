/**
 * pinepaper_keyframe_animate and the batch keyframe_animate op give the same warnings.
 *
 * The batch op had its own copy of the keyframe emitter and none of the tool's warnings: SIZEKEY-PAIR (beta) warned
 * through the tool and not through the batch with identical keys. Both now call keyframeResultNotes.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator as gen } from '../../types/code-generator.js';

const KEYS = [
  { time: 0, properties: { x: 100, fontSize: 20 }, easing: 'easeOut' },
  { time: 1, properties: { x: 300 } },
];

describe('keyframe warnings on both routes', () => {
  const tool = gen.generateKeyframeAnimate({ itemId: 'item_1', keyframes: KEYS, loop: true } as never);
  const batch = gen.generateAgentBatchExecute({ operations: [{ type: 'keyframe_animate', itemId: 'item_1', keyframes: KEYS, loop: true }] } as never);
  for (const [field, why] of [
    ['sizekeyPairWarning', 'x beside fontSize on an older studio'],
    
    ['gapWarning', 'a key that leaves out fontSize'],
    ['note:', 'easing on the first key'],
  ]) {
    it(`${field}: ${why}`, () => {
      expect(tool).toContain(field);
      expect(batch).toContain(field);
    });
  }
});
