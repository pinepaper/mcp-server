/**
 * Every image a README shows must exist AND ship.
 *
 * The English README's top hero lived in `docs/assets/`, and `docs` is not in
 * package.json's `files` — so the first thing anyone saw on the npm page was a
 * broken image, in a package whose whole pitch is "these are animated SVGs, open
 * this README and watch". It rendered on GitHub, which is why it survived.
 *
 * A path that resolves in the repo says nothing about whether it resolves in the
 * tarball; those are different roots.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..', '..');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8')) as {
  files: string[];
};

const READMES = [
  'README.md', 'README.de.md', 'README.es.md', 'README.fr.md', 'README.hi.md',
  'README.ja.md', 'README.ko.md', 'README.pt-BR.md', 'README.zh-CN.md',
];

/** Local (non-http) image sources referenced by a README. */
function localImages(file: string): string[] {
  const text = readFileSync(join(ROOT, file), 'utf-8');
  const html = [...text.matchAll(/<img\s+[^>]*src="([^"]+)"/g)].map((m) => m[1]);
  const md = [...text.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
  return [...html, ...md].filter((s) => !/^https?:/.test(s));
}

/** Would `files` include this path in the published tarball? */
const isShipped = (p: string) =>
  PKG.files.some((entry) => p === entry || p.startsWith(entry.replace(/\/$/, '') + '/'));

describe('README images', () => {
  it('every referenced image exists on disk', () => {
    const missing: string[] = [];
    for (const f of READMES) {
      for (const src of localImages(f)) {
        if (!existsSync(join(ROOT, src))) missing.push(`${f} → ${src}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('every referenced image is inside a shipped path', () => {
    // Renders on GitHub, missing on npm — the failure this test exists for.
    const unshipped: string[] = [];
    for (const f of READMES) {
      for (const src of localImages(f)) {
        if (!isShipped(src)) unshipped.push(`${f} → ${src} (not covered by package.json files)`);
      }
    }
    expect(unshipped).toEqual([]);
  });

  it('the hero every localized README shows is one of the shipped assets', () => {
    // All eight localized READMEs open with assets/hero.svg; the English one
    // opens with edit-whenever.svg and shows hero.svg further down. Both must
    // travel with the package.
    for (const f of READMES.filter((r) => r !== 'README.md')) {
      expect({ file: f, hero: localImages(f)[0] }).toEqual({ file: f, hero: 'assets/hero.svg' });
    }
    expect(localImages('README.md')).toContain('assets/edit-whenever.svg');
    expect(localImages('README.md')).toContain('assets/hero.svg');
  });
});
