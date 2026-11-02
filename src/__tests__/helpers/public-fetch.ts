/**
 * For tests that stub globalThis.fetch with a made-up host (cdn.example).
 *
 * Server-side fetches go through safeFetch, which resolves the host and pins
 * the connection (node:http with a pinned lookup), so a globalThis.fetch stub alone is never
 * reached. This resolves every host to a public address and sends the request
 * through globalThis.fetch, so those stubs keep testing what they test.
 * The address rules themselves are tested in safe-fetch.test.ts.
 */
import { beforeEach, afterEach } from 'bun:test';
import { safeFetchDeps } from '../../utils/safe-fetch.js';

export function routeSafeFetchThroughGlobalFetch(): void {
  const saved = { ...safeFetchDeps };
  beforeEach(() => {
    safeFetchDeps.lookup = async () => [{ address: '93.184.216.34', family: 4 }];
    safeFetchDeps.request = (url, _addresses, init) => globalThis.fetch(url, init);
    safeFetchDeps.trusted = (url, init) => globalThis.fetch(url, init);
  });
  afterEach(() => { Object.assign(safeFetchDeps, saved); });
}

/** Allow reads from a test's temp folder, for the duration of one test file. */
export function allowAssetDir(dir: string): () => void {
  const saved = process.env.PINEPAPER_ASSET_DIRS;
  process.env.PINEPAPER_ASSET_DIRS = dir;
  return () => {
    if (saved === undefined) delete process.env.PINEPAPER_ASSET_DIRS;
    else process.env.PINEPAPER_ASSET_DIRS = saved;
  };
}
