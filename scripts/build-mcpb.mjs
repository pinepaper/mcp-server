#!/usr/bin/env node
/**
 * Build the Claude Desktop extension: pinepaper-mcp-server-<version>.mcpb.
 *
 * A .mcpb is a zip with manifest.json at its root and the server inside, its
 * node_modules included, so Desktop installs it in one click instead of a JSON
 * config edit and npx. Run after `bun run build`:
 *
 *   node scripts/build-mcpb.mjs        → mcpb/pinepaper-mcp-server-<version>.mcpb
 *
 * THE BROWSER: the bundle carries puppeteer-core, which drives the user's own
 * Chrome (or PINEPAPER_CHROME_PATH, the manifest's chrome_path setting), not
 * Puppeteer's Chrome download. puppeteer-core goes in the BUNDLE's
 * node_modules only. The npm package's dependencies stay zod and undici
 * (capability-footprint.test.ts), because the npm package is what supply-chain
 * scores read.
 *
 * THE FFMPEG RUNNER (packages/mcp-ffmpeg, never published) is copied into
 * the bundle's node_modules for the same reason: the npm package starts no
 * process, the bundle can.
 *
 * Installs with --ignore-scripts and --omit=dev into a staging folder, and
 * writes the zip with the system `zip`. Validate the result with the official
 * packer's validator before publishing it: `npx @anthropic-ai/mcpb validate manifest.json`.
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STAGE = join(ROOT, 'mcpb', 'stage');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(ROOT, 'manifest.json'), 'utf8'));
const OUT = join(ROOT, 'mcpb', `pinepaper-mcp-server-${pkg.version}.mcpb`);

if (manifest.version !== pkg.version) throw new Error(`manifest.json is ${manifest.version}, package.json ${pkg.version}`);
if (!existsSync(join(ROOT, 'dist', 'cli.js'))) throw new Error('dist/ is not built: run `bun run build` first');

// The puppeteer-core the tests run against (the dev puppeteer's own), pinned exactly.
const coreVersion = JSON.parse(readFileSync(join(ROOT, 'node_modules', 'puppeteer-core', 'package.json'), 'utf8')).version;

rmSync(STAGE, { recursive: true, force: true });
mkdirSync(STAGE, { recursive: true });
for (const f of ['dist', 'manifest.json', 'icon.png', 'icon.svg', 'README.md', 'LICENSE', 'SECURITY.md', 'assets']) {
  if (existsSync(join(ROOT, f))) cpSync(join(ROOT, f), join(STAGE, f), { recursive: true });
}
writeFileSync(join(STAGE, 'package.json'), JSON.stringify({
  name: pkg.name,
  version: pkg.version,
  type: pkg.type,
  private: true,
  dependencies: { ...pkg.dependencies, 'puppeteer-core': coreVersion },
}, null, 2) + '\n');

execFileSync('npm', ['install', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock'], { cwd: STAGE, stdio: 'inherit' });

// The ffmpeg add-on (packages/mcp-ffmpeg) rides in the bundle, from this repo, so a Desktop install has per-scene
// exports and the ffprobe read-back without a second package. The npm package never depends on it.
const ADDON = join(STAGE, 'node_modules', '@pinepaper.studio', 'mcp-ffmpeg');
mkdirSync(ADDON, { recursive: true });
for (const f of ['package.json', 'index.js', 'index.d.ts', 'README.md', 'LICENSE']) cpSync(join(ROOT, 'packages', 'mcp-ffmpeg', f), join(ADDON, f));

rmSync(OUT, { force: true });
execFileSync('zip', ['-q', '-r', '-X', OUT, '.'], { cwd: STAGE });
const mb = (statSync(OUT).size / 1048576).toFixed(1);
const packages = execFileSync('npm', ['ls', '--all', '--parseable', '--omit=dev'], { cwd: STAGE, encoding: 'utf8' }).trim().split('\n').length - 1;
console.log(`✅ ${OUT.replace(ROOT + '/', '')}: ${mb} MB, ${packages} packages (zod, undici, puppeteer-core ${coreVersion} and theirs, and the ffmpeg add-on)`);
