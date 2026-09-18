/**
 * The README's design-system counts must match the vendored data.
 *
 * These numbers went stale within a day of being written: the note said
 * fifteen systems and twenty-eight styles, and upstream had grown to
 * twenty-one and thirty-one by the time anyone looked. They are on the README,
 * which is what npmjs.com renders — so a stale count there is a wrong claim on
 * the package page, not an internal note.
 *
 * The repo already pins its TOOL count this way (readme-tool-parity.test.ts).
 * The same argument applies to anything vendored: the data moves on someone
 * else's schedule, so a hand-written number about it is a claim waiting to rot.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listSystems, listEasings, listStyles } from '../../design/design-systems.js';

const README = readFileSync(join(import.meta.dir, '..', '..', '..', 'README.md'), 'utf-8');

/** Written-out numbers, because the note reads as prose rather than a table. */
const WORDS: Record<number, string> = {
  3: 'three', 15: 'Fifteen', 18: 'eighteen', 21: 'Twenty-one',
  28: 'Twenty-eight', 31: 'Thirty-one',
};

describe('README ↔ vendored design data', () => {
  it('states the real number of design systems', () => {
    const n = listSystems().length;
    expect(README).toContain(`${WORDS[n] ?? n} of them, as W3C DTCG tokens`);
  });

  it('states the real number of named and composable styles', () => {
    const named = listStyles().length;
    const composable = listStyles().filter((s) => s.composable).length;
    expect(README).toContain(`${WORDS[named] ?? named} named, ${WORDS[composable] ?? composable} of which \`compose\``);
  });

  it('states the real number of authored easing curves', () => {
    // The provenance claim is the one that must not drift: "the three we had to
    // fill in" is a statement about which curves are ours rather than a vendor's.
    const authored = listEasings(true).length;
    expect(README).toContain(`\`pinepaper:authored\` on the ${WORDS[authored] ?? authored} we had to fill in`);
  });

  it('every easing still carries a licence, whatever the count', () => {
    const all = listEasings();
    expect(all.length).toBeGreaterThan(0);
    for (const e of all) expect(e.license.length).toBeGreaterThan(0);
  });
});
