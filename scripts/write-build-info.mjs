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
import { writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const git = (...args) => {
  try { return execFileSync('git', ['-C', REPO, ...args], { encoding: 'utf8' }).trim(); } catch { return null; }
};
const sha = git('rev-parse', '--short=7', 'HEAD');
const dirty = sha ? git('status', '--porcelain', '--untracked-files=no') !== '' : false;
mkdirSync(join(REPO, 'dist'), { recursive: true });
writeFileSync(join(REPO, 'dist', 'build-info.json'), JSON.stringify({ sha, dirty, builtAt: new Date().toISOString() }, null, 2) + '\n');
console.log(`build-info: ${sha ?? 'unknown'}${dirty ? ' (dirty)' : ''}`);
