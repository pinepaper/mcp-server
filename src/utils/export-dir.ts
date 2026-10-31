/**
 * Where exports are saved: PINEPAPER_EXPORT_DIR, else ~/Downloads/PinePaper,
 * else the temp folder.
 *
 * WHY DOWNLOADS (1.6.25): the default was <tmp>/pinepaper-exports. A Claude
 * Desktop user never sees that folder and the model cannot open it for them, so
 * a finished export was a path in a reply and nothing the user could find. A
 * machine without a Downloads folder (a server, CI) keeps the temp folder.
 *
 * ONE function, used by the writers (handlers.ts) and by path confinement
 * (asset-paths.ts): two copies of the default would refuse the server's own
 * exports the day they disagreed.
 */
import { existsSync } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { basename, extname, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { env } from './env.js';

export function getExportDir(): string {
  const configured = env('PINEPAPER_EXPORT_DIR');
  if (configured) return configured;
  try {
    const downloads = join(homedir(), 'Downloads');
    if (existsSync(downloads)) return join(downloads, 'PinePaper');
  } catch { /* no home directory */ }
  return join(tmpdir(), 'pinepaper-exports');
}

const MIME: Readonly<Record<string, string>> = {
  mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf', wav: 'audio/wav', zip: 'application/zip',
  html: 'text/html', json: 'application/json', srt: 'application/x-subrip', vtt: 'text/vtt', scc: 'text/plain',
};

export function mimeTypeFor(filePath: string): string | undefined {
  return MIME[extname(filePath).slice(1).toLowerCase()];
}

/**
 * A saved export as an MCP resource_link: a client can offer it to open or save,
 * where the path in the text was something only a terminal user could act on.
 * The URI is a file:// URL (pathToFileURL: spaces, Windows drives), and
 * resources/read serves it while it is inside the export folder.
 */
export function exportFileLink(filePath: string, size?: number) {
  const mimeType = mimeTypeFor(filePath);
  return {
    type: 'resource_link' as const,
    uri: pathToFileURL(filePath).href,
    name: basename(filePath),
    ...(mimeType ? { mimeType } : {}),
    ...(typeof size === 'number' ? { size } : {}),
  };
}

/** Largest export resources/read returns inline; above it the reply gives the path (base64 grows it by a third). */
export const EXPORT_READ_MAX_BYTES = 10 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['svg', 'json', 'html', 'srt', 'vtt', 'scc']);

/**
 * resources/read for an export's file:// link. Served only from inside the export folder (real paths, so a
 * symlink out of it is refused), and only up to EXPORT_READ_MAX_BYTES; a bigger file is named, not sent.
 */
export async function readExportFile(uri: string): Promise<
  { ok: true; contents: { uri: string; mimeType?: string; text?: string; blob?: string } } | { ok: false; reason: string; path?: string; size?: number }
> {
  let path: string;
  try { path = fileURLToPath(uri); } catch { return { ok: false, reason: 'not a file URL' }; }
  const [file, root] = await Promise.all([realpath(path).catch(() => null), realpath(getExportDir()).catch(() => null)]);
  if (!file) return { ok: false, reason: 'no such file', path };
  if (!root || !(file === root || file.startsWith(root.endsWith(sep) ? root : root + sep))) {
    return { ok: false, reason: `only files in the export folder (${getExportDir()}) can be read this way`, path };
  }
  const { size } = await stat(file);
  if (size > EXPORT_READ_MAX_BYTES) {
    return { ok: false, reason: `the file is ${(size / 1048576).toFixed(1)} MB, over the ${EXPORT_READ_MAX_BYTES / 1048576} MB that is sent inline; open it at ${file}`, path: file, size };
  }
  const bytes = await readFile(file);
  const mimeType = mimeTypeFor(file);
  const text = TEXT_EXTENSIONS.has(extname(file).slice(1).toLowerCase());
  return { ok: true, contents: { uri, ...(mimeType ? { mimeType } : {}), ...(text ? { text: bytes.toString('utf8') } : { blob: bytes.toString('base64') }) } };
}
