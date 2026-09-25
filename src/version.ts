/**
 * Single source of truth for the MCP server version.
 *
 * Reads from package.json at runtime — every site that emits a version
 * (SERVER_INFO in index.ts, diagnostic_report in handlers.ts, future
 * version-handshake envelopes) imports SERVER_VERSION from here.
 *
 * Don't hardcode version strings anywhere else.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// Walk up: src/version.ts → src/ → repo root; dist/version.js → dist/ → repo root.
const pkgPath = join(here, '..', 'package.json');

interface PackageJson { version: string }

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;

export const SERVER_VERSION: string = pkg.version;

/**
 * WHICH BUILD, not which release (tester request, round 9: several builds in
 * a row all reported 1.6.14). A built package reads dist/build-info.json,
 * written at build time; running from source asks git. null when neither
 * knows — never a guess.
 */
function readBuild(): string | null {
  try {
    const info = join(here, 'build-info.json');
    if (existsSync(info)) {
      const b = JSON.parse(readFileSync(info, 'utf-8')) as { sha?: string | null; dirty?: boolean };
      if (b.sha) return b.sha + (b.dirty ? '.dirty' : '');
    }
  } catch { /* fall through */ }
  try {
    const repo = join(here, '..');
    const sha = execFileSync('git', ['-C', repo, 'rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const dirty = execFileSync('git', ['-C', repo, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() !== '';
    return sha ? sha + (dirty ? '.dirty' : '') : null;
  } catch { return null; }
}

export const SERVER_BUILD: string | null = readBuild();

/** What serverInfo reports: semver with build metadata, e.g. 1.6.14+7b7cdf8. */
export const SERVER_VERSION_WITH_BUILD: string = SERVER_BUILD ? `${SERVER_VERSION}+${SERVER_BUILD}` : SERVER_VERSION;
