/**
 * Single source of truth for the MCP server version.
 *
 * Reads from package.json at runtime — every site that emits a version
 * (SERVER_INFO in index.ts, diagnostic_report in handlers.ts, future
 * version-handshake envelopes) imports SERVER_VERSION from here.
 *
 * Don't hardcode version strings anywhere else.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
// Walk up: src/version.ts → src/ → repo root; dist/version.js → dist/ → repo root.
const pkgPath = join(here, '..', 'package.json');

interface PackageJson { version: string }

const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;

export const SERVER_VERSION: string = pkg.version;
