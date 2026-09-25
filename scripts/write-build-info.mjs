#!/usr/bin/env node
/**
 * Write dist/build-info.json — which commit this build is.
 *
 * Several builds in a row reported the same package version (1.6.14 held for
 * accumulation), so a tester could only tell them apart by grepping the
 * bundle for content. version.ts reads this file and serverInfo reports
 * <version>+<sha>[.dirty], semver build metadata. A build from a tree with
 * uncommitted changes says so.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => {
  try { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' }).trim(); } catch { return null; }
};
// In order: an explicit BUILD_SHA (CI, or any build from an export); the
// repo's git; and for a `git archive` export — which has no .git — the SHA
// git itself wrote into scripts/archive-sha.txt (export-subst in
// .gitattributes replaces its $Format:%h$ placeholder at archive time).
const fromArchive = (() => {
  try {
    const v = readFileSync(join(REPO, 'scripts', 'archive-sha.txt'), 'utf8').trim();
    return /^[0-9a-f]{7,40}$/.test(v) ? v.slice(0, 7) : null;
  } catch { return null; }
})();
const envSha = process.env.BUILD_SHA && /^[0-9a-f]{7,40}$/i.test(process.env.BUILD_SHA) ? process.env.BUILD_SHA.slice(0, 7).toLowerCase() : null;
const gitSha = git('rev-parse', '--short=7', 'HEAD');
const sha = envSha || gitSha || fromArchive;
const dirty = !envSha && gitSha ? git('status', '--porcelain', '--untracked-files=no') !== '' : false;
mkdirSync(join(REPO, 'dist'), { recursive: true });
writeFileSync(join(REPO, 'dist', 'build-info.json'), JSON.stringify({ sha, dirty, builtAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`build-info: ${sha ?? 'unknown'}${dirty ? ' (dirty)' : ''}`);
