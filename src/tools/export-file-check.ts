/**
 * No export reports success without a file (owner, 2026-10-27): no exit-0-without-file, and no "undefined" in any
 * error path.
 *
 * An export could end with success and no file. Every path here that says "saved" now reads the
 * file back from disk first: it must exist and must not be empty. When it does not, the caller gets an error that
 * names the step (export, save or write), the path and the reason, never a success with a note inside it.
 *
 * - `export`: the studio said success but sent nothing to save (no data, an empty string).
 * - `save`:   the bytes could not be prepared for disk (a data URL with no payload, a decode that produced nothing).
 * - `write`:  the file system refused the write, or the file is missing or empty when read back.
 */
import { stat } from 'node:fs/promises';

export type ExportStep = 'export' | 'save' | 'write';

/** The words of an error, never "undefined": an Error's message, a string, or the caller's statement of what failed. */
export function errorText(e: unknown, fallback: string): string {
  if (e && typeof (e as { message?: unknown }).message === 'string' && (e as { message: string }).message.trim()) {
    return (e as { message: string }).message;
  }
  if (typeof e === 'string' && e.trim()) return e;
  const reason = e && (e as { reason?: unknown }).reason;
  if (typeof reason === 'string' && reason.trim()) return reason;
  return fallback;
}

/** An export that failed at a named step. `message` reads on its own; `step`, `path` and `reason` are the fields. */
export class ExportStepError extends Error {
  readonly step: ExportStep;
  readonly path: string | null;
  readonly reason: string;
  constructor(step: ExportStep, path: string | null, reason: string) {
    super(`export failed at the ${step} step${path ? ` (${path})` : ''}: ${reason}`);
    this.name = 'ExportStepError';
    this.step = step;
    this.path = path;
    this.reason = reason;
  }
  /** The fields an error result carries. */
  toData(): { step: ExportStep; path: string | null; reason: string } {
    return { step: this.step, path: this.path, reason: this.reason };
  }
}

/**
 * Read a written file back. Resolves to its size on disk; throws an ExportStepError at the `write` step when the file
 * does not exist, is not a file, is empty, or (when `expectedBytes` is given) is not the size that was written.
 */
export async function verifySavedFile(filePath: string, expectedBytes?: number): Promise<{ bytes: number }> {
  let size: number;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) throw new ExportStepError('write', filePath, 'the path is not a file after writing');
    size = s.size;
  } catch (e) {
    if (e instanceof ExportStepError) throw e;
    throw new ExportStepError('write', filePath, `the file does not exist after writing (${errorText(e, 'stat gave no reason')})`);
  }
  if (size === 0) throw new ExportStepError('write', filePath, 'the file is empty (0 bytes) after writing');
  if (typeof expectedBytes === 'number' && expectedBytes > 0 && size !== expectedBytes) {
    throw new ExportStepError('write', filePath, `the file is ${size} bytes on disk, but ${expectedBytes} were written`);
  }
  return { bytes: size };
}

/** Run a write and name the step if it throws (the file system's own reason, never "undefined"). */
export async function writeStep<T>(filePath: string, write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (e) {
    if (e instanceof ExportStepError) throw e;
    throw new ExportStepError('write', filePath, errorText(e, 'the file system refused the write with no reason given'));
  }
}

/**
 * The bytes of a data URL or a text payload, ready for disk. Throws at the `save` step for a data URL with no payload
 * and at the `export` step for nothing at all — both used to write a 0-byte file and report it saved.
 */
export function bytesForSave(data: unknown, what = 'the export'): Buffer {
  if (typeof data !== 'string' || data.length === 0) {
    throw new ExportStepError('export', null, `${what} reported success but returned no file data (${data === undefined ? 'no data field' : typeof data === 'string' ? 'an empty string' : `a ${data === null ? 'null' : typeof data}`})`);
  }
  if (data.startsWith('data:')) {
    const comma = data.indexOf(',');
    const meta = comma >= 0 ? data.slice(5, comma) : data.slice(5);
    const body = comma >= 0 ? data.slice(comma + 1) : '';
    let buf: Buffer;
    try {
      buf = /;base64$/i.test(meta) ? Buffer.from(body, 'base64') : Buffer.from(decodeURIComponent(body), 'utf-8');
    } catch (e) {
      throw new ExportStepError('save', null, `${what} is a data URL (${meta || 'no type'}) that could not be decoded: ${errorText(e, 'no reason given')}`);
    }
    if (buf.length === 0) {
      throw new ExportStepError('save', null, `${what} is a data URL (${meta || 'no type'}) with no payload, so there is nothing to write`);
    }
    return buf;
  }
  return Buffer.from(data, 'utf-8');
}
