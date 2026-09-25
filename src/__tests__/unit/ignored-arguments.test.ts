/**
 * Top-level arguments a tool drops are reported (round 7 Y, 1.47):
 * agent_export {loop, seamless} answered success and did nothing.
 */
import { describe, it, expect } from 'bun:test';
import { ignoredArgumentsNote } from '../../tools/handlers.js';

describe('ignoredArgumentsNote', () => {
  it('names loop / seamless on agent_export, with the recipe that works', () => {
    const note = ignoredArgumentsNote('pinepaper_agent_export', { format: 'mp4', loop: true, seamless: true });
    expect(note).toContain('loop, seamless are not a parameter');
    expect(note).toContain('SAME state at t = 0 and at t = duration');
  });

  it('says nothing for real parameters, including superRefine-wrapped ones', () => {
    expect(ignoredArgumentsNote('pinepaper_agent_export', { format: 'pdf', pdf: { bleed: 3 }, duration: 5 })).toBeNull();
  });

  it('is silent for tools not in the table', () => {
    expect(ignoredArgumentsNote('pinepaper_add_relation', { anything: 1 })).toBeNull();
  });

  it('create_item names shape properties passed beside properties, and accepts a top-level anchor', () => {
    const note = ignoredArgumentsNote('pinepaper_create_item', { itemType: 'rectangle', anchor: 'top-left', width: 615, properties: {} });
    expect(note).toContain('width is not a parameter');
    expect(note).toContain('INSIDE properties');
    expect(note).toMatch(/^IGNORED ARGUMENTS: width is not/);
  });
});
