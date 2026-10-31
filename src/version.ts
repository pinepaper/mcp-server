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
 * written at build time. null when it is absent (running from source) —
 * never a guess. This asked git when running from source until 1.6.25; that
 * put a child_process call in the published package for a path no installed
 * copy ever takes, so the build step is now the only place that asks git.
 */
function readBuild(): string | null {
  try {
    const info = join(here, 'build-info.json');
    if (existsSync(info)) {
      const b = JSON.parse(readFileSync(info, 'utf-8')) as { sha?: string | null; dirty?: boolean };
      if (b.sha) return b.sha + (b.dirty ? '.dirty' : '');
    }
  } catch { /* fall through */ }
  return null;
}

export const SERVER_BUILD: string | null = readBuild();

/** What serverInfo reports: semver with build metadata, e.g. 1.6.14+7b7cdf8. */
export const SERVER_VERSION_WITH_BUILD: string = SERVER_BUILD ? `${SERVER_VERSION}+${SERVER_BUILD}` : SERVER_VERSION;
