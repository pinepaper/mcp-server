/**
 * Keep a path written by a manifest inside the project directory.
 *
 * `pinepaper.json` is data that arrives with a project someone else may have made, so the file it says to write
 * (`export.output`) must land inside that project. An explicit `-o` typed on the command line is the person's own
 * choice and is not checked here.
 */

import { lstatSync, realpathSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';

function realOrSelf(p: string): string {
  try { return realpathSync(p); } catch { return p; }
}

function present(p: string): boolean {
  try { lstatSync(p); return true; } catch { return false; }
}

/**
 * The path with its deepest existing ancestor resolved through symlinks, so a linked folder cannot hide an escape.
 * Null when that ancestor is a symlink that goes nowhere (writing through it would create its target).
 */
function realWithMissingTail(p: string): string | null {
  let existing = resolve(p);
  const tail: string[] = [];
  while (!present(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(basename(existing));
    existing = parent;
  }
  let real: string;
  try { real = realpathSync(existing); } catch { return present(existing) ? null : join(existing, ...tail); }
  return join(real, ...tail);
}

export type ConfinedPath = { ok: true; path: string } | { ok: false; error: string };

/**
 * `configured` (as written in the manifest) resolved against `projectDir`, or an error when it names a place outside
 * it: `..` that climbs out, an absolute path elsewhere, or a path that leaves through a symlinked directory.
 */
export function confineManifestPath(projectDir: string, configured: string, what = 'export.output'): ConfinedPath {
  const lexical = resolve(projectDir, configured);
  const root = realOrSelf(resolve(projectDir));
  const target = realWithMissingTail(lexical);
  const rel = target === null ? '..' : relative(root, target);
  const outside = rel === '' || rel === '..' || rel.startsWith('..' + sep) || isAbsolute(rel);
  if (outside) {
    return {
      ok: false,
      error: `${what} "${configured}" in pinepaper.json resolves outside the project directory (${projectDir}). Use a path inside the project, or pass -o to choose a destination yourself.`,
    };
  }
  return { ok: true, path: lexical };
}
