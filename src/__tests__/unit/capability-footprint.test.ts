/**
 * What the published package's own code is able to do, held to a list.
 *
 * Supply-chain scanners (Socket) score a package partly by the capabilities its
 * files use: running commands, eval, reading the environment. The score slid
 * 74 → 71 over 1.6.16–1.6.24 as each new feature added one more file doing one
 * of these. This holds each capability to the files that need it, so a new one
 * is a decision made here, not drift. Comments are not code: they are stripped
 * before matching.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(import.meta.dir, '..', '..');

function shipped(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (name === '__tests__' || name.endsWith('.test.ts')) continue;
    if (statSync(full).isDirectory()) shipped(full, out);
    else if (name.endsWith('.ts') && !name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
const files = shipped(SRC).map((f) => ({ rel: relative(SRC, f), code: stripComments(readFileSync(f, 'utf8')) }));
const using = (re: RegExp) => files.filter((f) => re.test(f.code)).map((f) => f.rel).sort();

describe('capability footprint of the published code', () => {
  it('reads the environment in env.ts only (safe-fetch is bundled alone and keeps its own reader)', () => {
    expect(using(/process\.env/)).toEqual(['utils/env.ts', 'utils/safe-fetch.ts']);
  });

  it('runs a command only to read an export back with ffprobe', () => {
    expect(using(/child_process/)).toEqual(['tools/export-file-receipt.ts']);
  });

  it('has no eval or new Function: page code runs through CDP Runtime.evaluate', () => {
    expect(using(/\beval\s*\(|new\s+Function\s*\(/)).toEqual([]);
  });
});

describe('runtime dependencies', () => {
  it('ships with zod and undici only; the MCP layer is the server\'s own (src/mcp)', () => {
    const pkg = JSON.parse(readFileSync(join(SRC, '..', 'package.json'), 'utf8')) as { dependencies: Record<string, string> };
    expect(Object.keys(pkg.dependencies).sort()).toEqual(['undici', 'zod']);
  });

  it('no shipped file imports @modelcontextprotocol/sdk (a devDependency, for the tests)', () => {
    expect(using(/from\s+['"]@modelcontextprotocol\/sdk/)).toEqual([]);
  });
});
