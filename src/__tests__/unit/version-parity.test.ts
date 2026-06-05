/**
 * Regression test for version drift across the codebase.
 *
 * Pre-1.5.6: package.json said 1.5.5, src/index.ts hardcoded 1.5.4,
 * diagnostic_report's serverSection hardcoded 1.5.1. Three sources, three
 * values. This test makes sure every version-emitting site stays pinned to
 * SERVER_VERSION (which itself reads package.json at runtime).
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SERVER_VERSION } from '../../version.js';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');

describe('SERVER_VERSION — single source of truth', () => {
  it('matches package.json version exactly', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf-8')) as { version: string };
    expect(SERVER_VERSION).toBe(pkg.version);
  });

  it('is a semver string', () => {
    expect(SERVER_VERSION).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });

  it('no source file hardcodes a different version string', () => {
    // Anti-regression: scan the version-emitting entry files for any quoted
    // semver literal that doesn't match SERVER_VERSION. These files MUST NOT
    // contain a quoted semver of their own — every version they emit has to
    // come from SERVER_VERSION (which reads package.json). cli.ts is included
    // because it surfaces a version via --version and the startup banner; it
    // was the site missed by the original 1.5.6 single-sourcing pass (it used
    // a bare `const VERSION = '1.5.1'`, which the old near-a-"version:"-key
    // heuristic never caught).
    const filesToScan = [
      'src/cli.ts',
      'src/index.ts',
      'src/tools/handlers.ts',
    ];
    const versionLiteralRe = /['"](\d+\.\d+\.\d+(?:-[\w.]+)?)['"]/g;
    for (const rel of filesToScan) {
      const content = readFileSync(join(REPO_ROOT, rel), 'utf-8');
      let match;
      while ((match = versionLiteralRe.exec(content)) !== null) {
        const literal = match[1];
        if (literal !== SERVER_VERSION) {
          throw new Error(`Hardcoded version literal "${literal}" in ${rel} drifts from SERVER_VERSION "${SERVER_VERSION}". Use SERVER_VERSION instead.`);
        }
      }
    }
  });
});
