import { describe, it, expect } from 'bun:test';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { exportFileReceipt, sha256OfFile } from '../../tools/export-file-receipt.js';

describe('export file receipt (hash first)', () => {
  const dir = mkdtempSync(join(tmpdir(), 'pp-receipt-'));
  const bytes = Buffer.from(Array.from({ length: 5000 }, (_, i) => i % 251));
  const file = join(dir, 'x.mp4');
  writeFileSync(file, bytes);

  it('hashes the file as written on disk', async () => {
    const r = await sha256OfFile(file);
    expect(r.bytes).toBe(5000);
    expect(r.sha256).toBe(createHash('sha256').update(bytes).digest('hex'));
  });

  it("carries the studio's frame digest when the export reported one", async () => {
    const r = await exportFileReceipt(file, { video: { frameHashes: { digest: 'abc12345:12', count: 12, unread: 0, hashes: [] } } });
    expect(r).toMatchObject({ bytes: 5000, frameDigest: 'abc12345:12', frames: 12, unreadFrames: 0 });
  });

  it('is only the file hash for an export with no frames (an older studio, a PNG)', async () => {
    const r = await exportFileReceipt(file, { success: true });
    expect(Object.keys(r).sort()).toEqual(['bytes', 'sha256']);
  });
});

describe('a receipt that fails after a good save', () => {
  it('is its own failure, not the save\'s', async () => {
    const { exportFileReceiptOrReason, receiptErrorLine } = await import('../../tools/export-file-receipt.js');
    const r = await exportFileReceiptOrReason('/nonexistent/dir/x.mp4', null);
    expect('receiptError' in r).toBe(true);
    expect(receiptErrorLine(r)).toContain('the file was saved');
  });
});
