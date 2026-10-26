/**
 * What an export wrote, as facts a caller checks instead of re-auditing frames (owner, 2026-10-26: "hash first";
 * docs in FxTool's HYPERFRAMES_SCORECARD_PLAN, T-4 and T-7).
 *
 * - `sha256` and `bytes` of the file ON DISK, read back after it was written: the agent compares two renders in one
 *   field, and a file that came out empty or truncated cannot report the size it was meant to have.
 * - `frameDigest`, `frames` and `unreadFrames` from the studio's own per-frame hashes (lastVideoReport.frameHashes): two
 *   H.264 files whose bytes differ still prove the same pictures when their frame digests agree.
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';

export interface ExportFileReceipt {
  sha256: string;
  bytes: number;
  frameDigest?: string;
  frames?: number;
  unreadFrames?: number;
}

/** Hash a written file (streamed: a long video is never held in memory twice). */
export async function sha256OfFile(filePath: string): Promise<{ sha256: string; bytes: number }> {
  const h = createHash('sha256');
  let bytes = 0;
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on('data', (chunk) => { h.update(chunk as Buffer); bytes += (chunk as Buffer).length; })
      .on('end', () => resolve())
      .on('error', reject);
  });
  return { sha256: h.digest('hex'), bytes };
}

/** The receipt for an export result: the file's hash, plus the studio's frame hashes when it reported them. */
export async function exportFileReceipt(filePath: string, exportResult: unknown): Promise<ExportFileReceipt> {
  const { sha256, bytes } = await sha256OfFile(filePath);
  const out: ExportFileReceipt = { sha256, bytes };
  const r = exportResult as { video?: { frameHashes?: { digest?: unknown; count?: unknown; unread?: unknown } } } | null;
  const fh = r && r.video && r.video.frameHashes;
  if (fh && typeof fh.digest === 'string') {
    out.frameDigest = fh.digest;
    if (typeof fh.count === 'number') out.frames = fh.count;
    if (typeof fh.unread === 'number') out.unreadFrames = fh.unread;
  }
  return out;
}
