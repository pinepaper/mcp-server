#!/usr/bin/env node
/**
 * Repository-wide zero-leakage gate for public PinePaper repositories.
 *
 * Scans tracked/non-ignored files in the current repository (or any directory
 * passed via `--dir <path>` / `--partner <path>`) for restricted benchmark
 * terms using explicit ASCII word boundaries (avoiding macOS BSD `\b` quirks
 * and avoiding false positives on internal identifiers like `_restoreMotionOntoMask`).
 *
 * Usage:
 *   node scripts/check-no-competitors.mjs
 *   node scripts/check-no-competitors.mjs --partner /path/to/FxTool
 *   node scripts/check-no-competitors.mjs --dir /path/to/dir [--json]
 */

import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('.', import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

const RESTRICTED_TERMS = ['hyper' + 'frames?', 're' + 'motion'];
export const COMPETITOR_WORD_PATTERN = new RegExp(
  '(^|[^a-z0-9_])(' + RESTRICTED_TERMS.join('|') + ')([^a-z0-9_]|$)',
  'i',
);

const EXCLUDED_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', 'mcpb']);
const EXCLUDED_PREFIXES = ['node_modules/', '.git/', 'dist/', 'coverage/', 'mcpb/', 'js/vendor/'];
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.bmp', '.tiff',
  '.mp4', '.webm', '.mov', '.avi', '.mkv', '.mp3', '.wav', '.ogg',
  '.wasm', '.ttf', '.otf', '.woff', '.woff2', '.eot',
  '.pdf', '.zip', '.gz', '.tgz', '.tar', '.mcpb', '.node', '.bin',
]);

function isExcludedRelPath(relPath) {
  const norm = relPath.replace(/\\/g, '/');
  if (EXCLUDED_DIRS.has(norm)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => norm.startsWith(prefix));
}

function isLikelyBinary(filePath, buf) {
  if (BINARY_EXTENSIONS.has(extname(filePath).toLowerCase())) return true;
  const sampleLen = Math.min(buf.length, 8192);
  for (let i = 0; i < sampleLen; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

function listFilesViaGit(rootDir) {
  try {
    const trackedRaw = execFileSync('git', ['-C', rootDir, 'ls-files', '-z'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const untrackedRaw = execFileSync('git', ['-C', rootDir, 'ls-files', '-z', '--others', '--exclude-standard'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const files = new Set();
    for (const entry of (trackedRaw + '\0' + untrackedRaw).split('\0')) {
      if (!entry || isExcludedRelPath(entry)) continue;
      const abs = join(rootDir, entry);
      if (!existsSync(abs)) continue;
      const st = lstatSync(abs);
      if (st.isSymbolicLink() || !st.isFile()) continue;
      files.add(entry);
    }
    return [...files].sort();
  } catch {
    return null;
  }
}

function listFilesViaWalk(rootDir) {
  const files = [];
  function walk(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      const abs = join(currentDir, entry);
      const rel = relative(rootDir, abs).replace(/\\/g, '/');
      if (!rel || isExcludedRelPath(rel)) continue;
      const st = lstatSync(abs);
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry)) continue;
        walk(abs);
      } else if (st.isFile()) {
        files.push(rel);
      }
    }
  }
  walk(rootDir);
  return files.sort();
}

export function scanDirectoryForCompetitors(targetDir, opts = {}) {
  const rootDir = resolve(targetDir);
  if (!existsSync(rootDir)) {
    throw new Error(`Directory does not exist: ${rootDir}`);
  }
  const files = opts.forceWalk ? listFilesViaWalk(rootDir) : (listFilesViaGit(rootDir) ?? listFilesViaWalk(rootDir));
  const matches = [];

  for (const relPath of files) {
    if (COMPETITOR_WORD_PATTERN.test(relPath)) {
      matches.push({
        file: relPath,
        line: 0,
        snippet: `[filename] ${relPath}`,
      });
    }
    const abs = join(rootDir, relPath);
    const buf = readFileSync(abs);
    if (isLikelyBinary(abs, buf)) continue;
    const lines = buf.toString('utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (COMPETITOR_WORD_PATTERN.test(lines[i])) {
        matches.push({
          file: relPath,
          line: i + 1,
          snippet: lines[i].trim().slice(0, 160),
        });
      }
    }
  }

  return { rootDir, scannedFiles: files.length, matches };
}

function parseArgs(argv) {
  const targets = [];
  let json = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--json') {
      json = true;
    } else if (arg === '--dir' || arg === '--partner') {
      const val = argv[i + 1];
      if (!val) {
        console.error(`Missing path argument after ${arg}`);
        process.exit(2);
      }
      targets.push({ dir: resolve(val), forceWalk: true });
      i++;
    } else if (arg === '-h' || arg === '--help') {
      console.log('Usage: node scripts/check-no-competitors.mjs [--dir <path>] [--partner <path>] [--json]');
      process.exit(0);
    }
  }
  if (!targets.length) {
    targets.push({ dir: REPO_ROOT, forceWalk: false });
  }
  return { targets, json };
}

if (import.meta.main || process.argv[1] === fileURLToPath(import.meta.url)) {
  const { targets, json } = parseArgs(process.argv.slice(2));
  const reports = targets.map((t) => scanDirectoryForCompetitors(t.dir, { forceWalk: t.forceWalk }));
  const totalMatches = reports.reduce((acc, r) => acc + r.matches.length, 0);

  if (json) {
    console.log(JSON.stringify({ ok: totalMatches === 0, totalMatches, reports }, null, 2));
    process.exit(totalMatches === 0 ? 0 : 1);
  }

  for (const r of reports) {
    if (r.matches.length === 0) {
      console.log(`✅ check-no-competitors: 0 matches across ${r.scannedFiles} file(s) in ${r.rootDir}`);
    } else {
      console.error(`❌ check-no-competitors: ${r.matches.length} match(es) in ${r.rootDir}:`);
      for (const m of r.matches) {
        console.error(`${m.file}:${m.line}: ${m.snippet}`);
      }
    }
  }

  process.exit(totalMatches === 0 ? 0 : 1);
}
