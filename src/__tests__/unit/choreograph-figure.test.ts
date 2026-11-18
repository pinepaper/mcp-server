/**
 * A rigged character is choreographed by its whole figure, not its root item (SQUASHRIG37 / CHOREOHEIGHT37, tester
 * 1.6.37): the root is the torso (165.5 px of a 480 px figure), so the default fly arc was a third of "2 x the actor's
 * height", and a squash kept the torso's bottom planted while the feet sank under the ground line.
 */
import { describe, it, expect } from 'bun:test';
import { compileChoreography } from '../../tools/choreograph.js';
import { PinePaperCodeGenerator as CodeGenerator } from '../../types/code-generator.js';

const frame = { x: 0, y: 0, width: 1920, height: 1080 };
const torso = { x: 400, y: 300, w: 120, h: 160, sx: 1, sy: 1, rot: 0, hasTrack: false };
// The torso's centre sits 120 px above the top of the 480 px figure's lower part: head 120 above, feet 360 below.
const figure = { ...torso, feetBelow: 360, headAbove: 120, leftOf: 80, rightOf: 80 };

describe('choreograph on a character figure', () => {
  it('sizes default heights and arcs on the figure', () => {
    const r = compileChoreography(figure as never, frame as never, [{ verb: 'hop', at: 0 }, { verb: 'fly', at: 1, to: [900, 300] }] as never);
    const d = Object.fromEntries((r.defaultsUsed || []).map((u) => [u.setting, u.value]));
    expect(d.height).toBe(480 * 1.2);
    expect(d.arc).toBe(480 * 2);
  });

  it('keeps the feet planted through a squash, not the torso bottom', () => {
    const r = compileChoreography(figure as never, frame as never, [{ verb: 'squash', at: 0, amount: 0.4 }] as never);
    const peak = (r.keyframes || []).find((k) => Math.abs(k.properties.scaleY - 0.6) < 1e-9)!;
    expect(peak).toBeDefined();
    // About the root's centre, the feet move by feetBelow * (1 - scale); the centre moves down by exactly that.
    expect(peak.properties.y).toBeCloseTo(300 + 360 * 0.4, 6);
  });

  it('leaves a plain item exactly as before', () => {
    const plain = compileChoreography(torso as never, frame as never, [{ verb: 'squash', at: 0, amount: 0.4 }, { verb: 'hop', at: 1 }] as never);
    const peak = (plain.keyframes || []).find((k) => Math.abs(k.properties.scaleY - 0.6) < 1e-9)!;
    expect(peak.properties.y).toBeCloseTo(300 + 80 * 0.4, 6);
    expect((plain.defaultsUsed || [])[0].value).toBe(160 * 1.2);
  });

  it('passes the studio figure extent through, and warns when a rigged actor has none', () => {
    const code = new CodeGenerator().generateChoreograph({ itemId: 'item_1', beats: [{ verb: 'hop', at: 0 }] } as never);
    expect(code).toContain('feetBelow: __pose.feetBelow');
    expect(code).toContain('characterRig');
    expect(code).toContain("sized on the root item (the torso)");
  });
});

describe('POPRIG37: pop never keys a scale of 0', () => {
  it('starts from 1%, invisible at opacity 0', () => {
    const r = compileChoreography(figure as never, frame as never, [{ verb: 'pop', at: 0 }] as never);
    for (const k of r.keyframes || []) { expect(k.properties.scaleX).toBeGreaterThan(0); expect(k.properties.scaleY).toBeGreaterThan(0); }
    expect(r.keyframes![0].properties).toMatchObject({ scaleX: 0.01, scaleY: 0.01, opacity: 0 });
  });
});
