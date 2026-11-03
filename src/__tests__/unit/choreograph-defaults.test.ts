/**
 * A choreograph beat that leaves its size out says what the default came to (CHOREOINT29: passing intensity to a
 * non-shake verb warned, but leaving a sized verb's size out entirely said nothing, so an undersized or oversized beat
 * failed silently).
 */
import { describe, it, expect } from 'bun:test';
import { compileChoreography } from '../../tools/choreograph.js';

const actor = { x: 400, y: 300, w: 80, h: 60, hasTrack: false };
const frame = { x: 0, y: 0, width: 1920, height: 1080 };

describe('choreograph defaultsUsed', () => {
  it('names each beat whose size was left out, with the value used', () => {
    const r = compileChoreography(actor as never, frame as never, [
      { verb: 'hop', at: 0 }, { verb: 'shake', at: 1 }, { verb: 'hop', at: 2, height: 40 },
    ] as never) as { defaultsUsed?: Array<Record<string, unknown>> };
    expect(r.defaultsUsed).toEqual([
      { beat: 0, verb: 'hop', setting: 'height', value: 72, rule: "1.2 x the actor's height, in px" },
      { beat: 1, verb: 'shake', setting: 'intensity', value: 6.4, rule: "8% of the actor's width, in px (at least 2)" },
    ]);
  });

  it('says nothing when every size is given', () => {
    const r = compileChoreography(actor as never, frame as never, [{ verb: 'hop', at: 0, height: 40 }] as never) as { defaultsUsed?: unknown };
    expect(r.defaultsUsed).toBeUndefined();
  });

  it('still runs as one self-contained function in the page', () => {
    const inPage = new Function(`return (${compileChoreography.toString()});`)();
    expect(inPage(actor, frame, [{ verb: 'hop', at: 0 }]).defaultsUsed[0].setting).toBe('height');
  });
});
