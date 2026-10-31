#!/usr/bin/env node
/**
 * The published dist/ must not refer to @modelcontextprotocol/sdk (1.6.25).
 *
 * The SDK is a devDependency: the tests drive this server with its client. An
 * installed copy of the package does not have it, so a .js import would crash
 * on start, and a .d.ts reference would break every consumer's typecheck.
 * Runs after the build in prepublishOnly.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
const hits = [];
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(js|d\.ts|mjs|cjs)$/.test(name) && /(from\s+|import\s*\(\s*|require\s*\(\s*)['"]@modelcontextprotocol\/sdk/.test(readFileSync(full, 'utf8'))) hits.push(relative(DIST, full));
  }
})(DIST);
if (hits.length) {
  console.error(`dist/ refers to @modelcontextprotocol/sdk, which an installed copy does not have:\n  ${hits.join('\n  ')}`);
  process.exit(1);
}
console.log('✅ dist/ does not refer to @modelcontextprotocol/sdk');
