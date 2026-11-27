/**
 * Zero competitor leakage guard for public mcp-server.
 * Verifies package.json keywords and all repository files contain 0 restricted benchmark terms.
 */
import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
// @ts-ignore - JS helper script in scripts/
import { COMPETITOR_WORD_PATTERN, scanDirectoryForCompetitors } from '../../../scripts/check-no-competitors.mjs';

const REPO_ROOT = resolve(import.meta.dir, '..', '..', '..');

describe('public repository zero-leakage guard', () => {
  it('word-boundary pattern matches restricted terms without false-positiving on _restoreMotionOntoMask', () => {
    const termA = 're' + 'motion';
    const termB = 'hyper' + 'frame';
    const termC = 'hyper' + 'frames';

    expect(COMPETITOR_WORD_PATTERN.test(`"${termA}-alternative"`)).toBe(true);
    expect(COMPETITOR_WORD_PATTERN.test(`${termB} benchmark`)).toBe(true);
    expect(COMPETITOR_WORD_PATTERN.test(`vs ${termC}`)).toBe(true);
    expect(COMPETITOR_WORD_PATTERN.test('_restoreMotionOntoMask: \'method\'')).toBe(false);
  });

  it('package.json keywords contain zero restricted benchmark terms', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as { keywords?: string[] };
    const offending = (pkg.keywords ?? []).filter((kw) => COMPETITOR_WORD_PATTERN.test(kw));
    expect(offending).toEqual([]);
  });

  it('all tracked and non-ignored repository files contain zero restricted benchmark terms', () => {
    const report = scanDirectoryForCompetitors(REPO_ROOT);
    expect(report.scannedFiles).toBeGreaterThan(20);
    expect(report.matches).toEqual([]);
  });
});
