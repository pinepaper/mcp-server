/**
 * A debug scratch file must not reach the package.
 *
 * `src/__sweep.ts` — a throwaway written to sweep the generators for syntax
 * errors — was committed by a `git add -A` and compiled to `dist/__sweep.js`.
 * `files` ships only `dist`, and `dist` is built from `src`, so a scratch file
 * in `src` is a scratch file in the tarball. It was caught by reading the tree
 * before a release rather than by anything automatic.
 *
 * The convention this enforces: `__`-prefixed names under `src` are scratch,
 * except `__tests__`, which is the suite and is not shipped either.
 */
import { describe, it, expect } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const REPO = join(import.meta.dir, '..', '..', '..');

const tracked = (): string[] =>
  execFileSync('git', ['-C', REPO, 'ls-files', 'src'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

describe('no scratch files are tracked under src', () => {
  it('reads a real file list', () => {
    const files = tracked();
    expect(files.length).toBeGreaterThan(50);
    expect(files.some((f) => f.endsWith('.ts'))).toBe(true);
  });

  it('has no __-prefixed file outside __tests__', () => {
    const scratch = tracked().filter((f) => {
      const base = f.slice(f.lastIndexOf('/') + 1);
      return base.startsWith('__') && !f.includes('__tests__/');
    });
    expect(scratch, 'scratch files would be compiled into dist and published').toEqual([]);
  });
});
