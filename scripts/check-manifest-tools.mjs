#!/usr/bin/env bun
/**
 * check-manifest-tools.mjs — keep manifest.json's `tools[]` in sync with the
 * tools the server actually serves (PINEPAPER_TOOLS in src/tools/definitions.ts).
 *
 * The manifest tool list is hand-adjacent metadata used for the DXT / marketplace
 * listing; it drifts silently as tools are added/removed. Runs in prepublishOnly
 * so a stale listing can never ship.
 *
 *   bun scripts/check-manifest-tools.mjs        # verify (exit 1 on drift) — used by prepublish
 *   bun scripts/check-manifest-tools.mjs --fix  # regenerate the tools array in place
 *
 * Descriptions: existing curated manifest text is preserved; new tools get the
 * single-line summary from minimal-descriptions.ts. Tools are written in the
 * canonical PINEPAPER_TOOLS order so drift shows up as a clean diff.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'manifest.json');
const FIX = process.argv.includes('--fix');

const { PINEPAPER_TOOLS } = await import(path.join(ROOT, 'src/tools/definitions.ts'));
const { MINIMAL_DESCRIPTIONS: MIN } = await import(path.join(ROOT, 'src/tools/minimal-descriptions.ts'));

const raw = fs.readFileSync(MANIFEST, 'utf8');
const manifest = JSON.parse(raw);
const source = PINEPAPER_TOOLS.map((t) => t.name);
const listed = manifest.tools.map((t) => t.name);

const missing = source.filter((n) => !listed.includes(n));           // served but not listed
const extra = listed.filter((n) => !source.includes(n));             // listed but not served
const empty = manifest.tools.filter((t) => !t.description || !t.description.trim()).map((t) => t.name);
const outOfOrder = JSON.stringify(source) !== JSON.stringify(listed) && !missing.length && !extra.length;
const inSync = !missing.length && !extra.length && !empty.length && !outOfOrder;

if (!FIX) {
  if (inSync) {
    console.log(`✅ manifest tools[] in sync with source (${source.length} tools)`);
    process.exit(0);
  }
  console.error('❌ manifest.json tools[] is out of sync with PINEPAPER_TOOLS:');
  if (missing.length) console.error(`   missing (served, not listed): ${missing.join(', ')}`);
  if (extra.length) console.error(`   stale   (listed, not served): ${extra.join(', ')}`);
  if (empty.length) console.error(`   empty descriptions: ${empty.join(', ')}`);
  if (outOfOrder) console.error('   listed in non-canonical order');
  console.error('\n   Fix: bun scripts/check-manifest-tools.mjs --fix');
  process.exit(1);
}

// --fix: regenerate the tools array, preserving curated descriptions and non-tools content.
const curated = new Map(manifest.tools.map((t) => [t.name, t.description]));
const tools = PINEPAPER_TOOLS.map((t) => ({
  name: t.name,
  description: curated.get(t.name) || MIN[t.name] || (t.description || '').split('\n')[0].slice(0, 140),
}));
const body = tools
  .map((t) => `    {\n      "name": ${JSON.stringify(t.name)},\n      "description": ${JSON.stringify(t.description)}\n    }`)
  .join(',\n');
const replacement = `"tools": [\n${body}\n  ]`;

const startKey = raw.indexOf('"tools": [');
if (startKey < 0) throw new Error('"tools": [ not found in manifest.json');
const openBracket = raw.indexOf('[', startKey);
let depth = 0, end = -1;
for (let i = openBracket; i < raw.length; i++) {
  if (raw[i] === '[') depth++;
  else if (raw[i] === ']' && --depth === 0) { end = i; break; }
}
if (end < 0) throw new Error('unbalanced tools array');

const next = raw.slice(0, startKey) + replacement + raw.slice(end + 1);
const before = JSON.parse(raw), after = JSON.parse(next);
delete before.tools; delete after.tools;
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('refusing to write: non-tools content would change');

fs.writeFileSync(MANIFEST, next);
console.log(`✅ regenerated manifest tools[]: ${manifest.tools.length} → ${tools.length} (${source.length} in source)`);
