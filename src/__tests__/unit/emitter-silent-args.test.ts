/**
 * Emitter arguments the studio does not read are said (tester list 2026-11-27: SIZEENDLIST170, SIZEENDDISC170,
 * SIZELIST170, SPEED3EL170, SIZELONG170, TRAILBURST170, EMITSIZE170). The drawing is the studio's; these are the words.
 */
import { describe, it, expect } from 'bun:test';
import { normalizeEmitterSpec } from '../../types/code-generator.js';

const warn = (spec: Record<string, unknown>) => normalizeEmitterSpec(spec).warnings;

describe('a range is two numbers', () => {
  it('names the unused elements of a longer array, for the spec and for a burst', () => {
    const w = warn({ speed: [100, 300, 500], sizeEnd: [4, 8, 12, 16], bursts: [{ t: 0, size: [10, 25, 40] }] });
    expect(w.find((x) => x.startsWith('spec.speed'))).toContain('only [100,300] is used and the other 1 has no effect');
    expect(w.find((x) => x.startsWith('spec.sizeEnd'))).toContain('the other 2 have no effect');
    expect(w.find((x) => x.startsWith('bursts[0].size'))).toContain('use sizes');
  });
  it('says nothing for a two-number range, a scalar, or a colour list', () => {
    expect(warn({ speed: [100, 300], sizeEnd: 4, size: [10, 30], colorEnd: ['#f00', '#0f0', '#00f'], bursts: [{ t: 0 }] })).toEqual([]);
  });
});

describe('size beside sizes', () => {
  it('says size is not read', () => {
    const w = warn({ count: 4, size: [10, 30], sizes: [16, 16, 16, 16], bursts: [{ t: 0 }] });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain('size [10,30] is not read beside sizes');
  });
  it('says it once when a burst only inherits both', () => {
    expect(warn({ count: 2, size: 8, sizes: [4, 6], bursts: [{ t: 0 }, { t: 1 }] })).toHaveLength(1);
  });
});

describe('a sizes list against the count', () => {
  it('longer than the count: the extras are named', () => {
    const w = warn({ count: 6, sizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], bursts: [{ t: 0 }] });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain('only the first 6 sizes are used, so the last 6 draw nothing');
  });
  it('shorter than the count: names the key for a range', () => {
    const w = warn({ count: 12, sizes: [4, 8, 12, 16], bursts: [{ t: 0 }] });
    expect(w[0]).toContain('size: [min, max]');
    expect(w[0]).toContain('not sizes');
  });
  it('equal to the count: nothing', () => {
    expect(warn({ count: 3, sizes: [4, 8, 12], bursts: [{ t: 0 }] })).toEqual([]);
  });
});

describe('emitWindows on a burst emitter', () => {
  it('is said to be unread, like rate, start and end', () => {
    const w = warn({ emitWindows: [[0, 0.5]], bursts: [{ t: 1, count: 60 }] });
    expect(w).toHaveLength(1);
    expect(w[0]).toContain('emitWindows is not read by a burst emitter');
  });
  it('is not warned on a trail', () => {
    expect(warn({ mode: 'trail', target: 'item_1', emitWindows: [[0, 0.5]] })).toEqual([]);
  });
});
