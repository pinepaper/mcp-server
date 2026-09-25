#!/usr/bin/env node
/**
 * Generate src/ontology/upstream-vocabulary.ts — FxTool's item-type map and
 * type classes, snapshotted from the engine.
 *
 * WHY GENERATED. src/ontology/vocabulary.ts was a one-time hand port of
 * FxTool/js/ontology/Vocabulary.js, and it drifted: the engine's 2026-09-09
 * audit mapped video, audio, sound, precomp, event, the world-3d and field
 * types and more, and the port never heard of them — so validate_design
 * called the product's own "audio" item an unknown type (round 8 EE, 1.72),
 * 41 map entries and 28 classes behind. Hand-maintenance is the mechanism
 * that failed; this file is regenerated instead, and vocabulary.ts merges it.
 *
 * Upstream Vocabulary.js has no imports, so it is loaded as a module and the
 * real exported objects are read — no parsing of object literals.
 *
 *   node scripts/sync-ontology-vocabulary.mjs [--check]
 *
 * `--check` regenerates into memory and exits non-zero on any difference. With
 * no FxTool checkout it exits 0 and says so: an absent sibling is not drift.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT = join(REPO, 'src', 'ontology', 'upstream-vocabulary.ts');
const FXTOOL = process.env.PP_FXTOOL_DIR ? process.env.PP_FXTOOL_DIR : resolve(REPO, '..', 'FxTool');
const ENGINE_REF = process.env.PP_FXTOOL_REF || 'origin/main';
const VOCAB_REL = 'js/ontology/Vocabulary.js';

function resolveRef() {
  for (const ref of [ENGINE_REF, 'HEAD']) {
    try {
      return { ref, sha: execFileSync('git', ['-C', FXTOOL, 'rev-parse', ref], { encoding: 'utf8' }).trim() };
    } catch { /* try the next */ }
  }
  return null;
}

function readCommitted(rel) {
  const resolved = resolveRef();
  if (resolved) {
    try {
      return execFileSync('git', ['-C', FXTOOL, 'show', `${resolved.ref}:${rel}`], {
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024,
      });
    } catch { /* absent at that ref */ }
  }
  const abs = join(FXTOOL, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

const KEPT = ['anchor', 'description', 'parentType', 'mcpTool', 'mcpAction'];

async function generate() {
  const src = readCommitted(VOCAB_REL);
  if (!src) throw new Error(`sync-ontology-vocabulary: cannot read ${VOCAB_REL}`);
  if (/^\s*import\s/m.test(src)) {
    throw new Error('sync-ontology-vocabulary: Vocabulary.js now has imports — load it another way before trusting this snapshot');
  }
  const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const map = mod.ITEM_TYPE_MAP;
  const types = mod.PP_VOCABULARY && mod.PP_VOCABULARY.types;
  if (!map || !types) throw new Error('sync-ontology-vocabulary: ITEM_TYPE_MAP / PP_VOCABULARY.types not exported');

  const outTypes = {};
  for (const k of Object.keys(types).sort()) {
    const t = types[k] || {};
    // null means "none" upstream; kept only for anchor, where it is the value.
    outTypes[k] = Object.fromEntries(KEPT.filter((f) => t[f] !== undefined && (t[f] !== null || f === 'anchor')).map((f) => [f, t[f]]));
  }
  const outMap = Object.fromEntries(Object.keys(map).sort().map((k) => [k, map[k]]));
  const resolved = resolveRef();
  const digest = createHash('sha256').update(src).digest('hex').slice(0, 16);

  return `/**
 * GENERATED — DO NOT EDIT. Run \`bun run sync:ontology-vocabulary\`.
 *
 * FxTool's ITEM_TYPE_MAP and type classes (anchor, description, parentType,
 * mcpTool, mcpAction), read from the loaded module.
 *
 * Source: FxTool ${resolved ? `${resolved.ref} ${resolved.sha}` : 'unknown (not a git checkout)'}
 *   ${VOCAB_REL}
 * sha256: ${digest}
 *
 * vocabulary.ts merges these over its hand-written port: the engine's map
 * wins where the two disagree, and a class the port lacks is added.
 */

export interface UpstreamTypeDef {
  anchor?: string | null;
  description?: string;
  parentType?: string;
  mcpTool?: string;
  mcpAction?: string;
}

export const UPSTREAM_ITEM_TYPE_MAP: Readonly<Record<string, string>> = Object.freeze(${JSON.stringify(outMap, null, 2)});

export const UPSTREAM_TYPES: Readonly<Record<string, UpstreamTypeDef>> = Object.freeze(${JSON.stringify(outTypes, null, 2)});
`;
}

async function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(join(FXTOOL, VOCAB_REL)) && !resolveRef()) {
    console.error(`sync-ontology-vocabulary: no FxTool checkout at ${FXTOOL}`);
    process.exit(0);
  }
  const wanted = await generate();
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  const count = (wanted.match(/"pp:[A-Za-z]+": \{/g) || []).length;
  if (current === wanted) {
    console.log(`✅ ontology vocabulary in sync (${count} types)`);
    process.exit(0);
  }
  if (check) {
    console.error('DRIFT: src/ontology/upstream-vocabulary.ts differs from FxTool.');
    console.error('Run: bun run sync:ontology-vocabulary');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  console.log(`✅ wrote ontology vocabulary (${count} types)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
