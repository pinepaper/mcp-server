/**
 * The README resource reads a file named from the request URI. The language
 * suffix went straight into that name, so pinepaper://docs/readme/../../x
 * read any .md file on disk and returned it (CWE-22). Only a locale code is
 * accepted now.
 */
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../index.js';

let client: Client;
let secretDir = '';
beforeAll(async () => {
  const server = await createServer({ browserMode: false, executionMode: 'code' } as never);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  client = new Client({ name: 'test', version: '0' });
  await client.connect(b);
  secretDir = mkdtempSync(join(tmpdir(), 'pp-secret-'));
  writeFileSync(join(secretDir, 'notes.md'), 'SECRET-MARKER');
});
afterAll(() => { rmSync(secretDir, { recursive: true, force: true }); });

const read = (uri: string) => client.readResource({ uri }).then(
  (r) => (r.contents[0] as { text?: string }).text ?? '',
  (e: Error) => `ERROR ${e.message}`,
);

describe('pinepaper://docs/readme', () => {
  it('serves the README and a translation', async () => {
    expect(await read('pinepaper://docs/readme')).toContain('PinePaper');
    expect(await read('pinepaper://docs/readme/ja')).not.toMatch(/^ERROR/);
  });

  it('refuses a path in place of a locale', async () => {
    // From the package root (where README.md lives) to the secret file, minus ".md".
    const rel = relative(resolve(import.meta.dir, '../../..'), join(secretDir, 'notes'));
    const got = await read(`pinepaper://docs/readme/${'/' + rel}`);
    const got2 = await read(`pinepaper://docs/readme/./../../../../../../../../..${join(secretDir, 'notes')}`);
    for (const g of [got, got2]) {
      expect(g).not.toContain('SECRET-MARKER');
      expect(g).toMatch(/^ERROR .*README not found/);
    }
  });
});
