/**
 * Keep a model-supplied local path inside the folders it may read (CWE-22).
 *
 * Image and media imports read a path from the user's disk and hand its bytes
 * to the page, where they can be exported again. Unbounded, that is a way to
 * lift any image- or media-named file off the machine the server runs on. A
 * path is allowed only when its REAL path (symlinks resolved, so a link inside
 * the working directory cannot point out of it) lies inside the server's
 * working directory, its export folder, or a folder named in
 * PINEPAPER_ASSET_DIRS (path.delimiter-separated; each entry is itself
 * resolved).
 *
 * The export folder is allowed because the server's own results point into
 * it: brand_kit from_url saves the logo there and says to import it with
 * pinepaper_import_image. Refusing that would break the tool's own advice.
 */
import { realpath } from 'node:fs/promises';
import { basename, delimiter, dirname, join, resolve, sep } from 'node:path';
import { env } from './env.js';
import { getExportDir } from './export-dir.js';

async function real(p: string): Promise<string | null> {
  try { return await realpath(p); } catch { return null; }
}

export async function allowedAssetRoots(): Promise<string[]> {
  const exportDir = getExportDir();
  const entries = [process.cwd(), exportDir, ...(env('PINEPAPER_ASSET_DIRS') ?? '').split(delimiter).filter(Boolean)];
  const roots = await Promise.all(entries.map((e) => real(resolve(e))));
  return [...new Set(roots.filter((r): r is string => r !== null))];
}

/**
 * The real path of `path` when it is inside an allowed folder, else an error
 * naming the folder to add. A missing file inside the folders gets the OS reason.
 */
export async function confineAssetPath(path: string): Promise<{ path: string } | { error: string }> {
  const roots = await allowedAssetRoots();
  const inside = (p: string) => roots.some((root) => p === root || p.startsWith(root.endsWith(sep) ? root : root + sep));
  const asked = resolve(path);
  let target: string;
  try {
    target = await realpath(asked);
  } catch (e) {
    // A missing file outside the folders gets the same answer as a present
    // one, so the error is not a way to probe what exists on disk. (The parent
    // is realpath'd for the comparison: on macOS tmpdir is a /var symlink.)
    const parent = await real(dirname(asked));
    if (!inside(parent ? join(parent, basename(asked)) : asked)) return outside(path, dirname(asked));
    const why = e instanceof Error ? e.message : 'unknown error';
    return { error: `could not read "${path}": ${why}. Paths are resolved from the server's working directory, so pass an absolute path if in doubt.` };
  }
  if (inside(target)) return { path: target };
  return outside(path, dirname(target));
}

function outside(path: string, folder: string): { error: string } {
  return {
    error: `"${path}" is outside the allowed folders (cwd, the export folder, PINEPAPER_ASSET_DIRS). `
      + `Add its folder (${folder}) to PINEPAPER_ASSET_DIRS to import it.`,
  };
}
