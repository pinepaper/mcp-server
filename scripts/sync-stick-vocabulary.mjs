#!/usr/bin/env node
/**
 * Generate src/tools/stick-vocabulary.ts — the stick kit's own name lists.
 *
 * WHY GENERATED. `gait`, `pose`, `sequence`, `expression` and `prop` are all
 * validated by the engine against lists defined in the vendored kit. Copying
 * those names into a schema by hand is the drift this repo has been bitten by
 * before (relationType, animationType, canvasPreset — every one of them failed
 * SILENTLY), and there are fifty-odd of them across five lists.
 *
 * The engine is forgiving about a miss: it warns and NAMES the valid set. So
 * these lists are for DISCOVERY — a model reading the tool description should
 * see what it can ask for instead of guessing and being corrected. That makes
 * being out of date a real cost, and hand-maintenance the wrong mechanism.
 *
 *   node scripts/sync-stick-vocabulary.mjs [--check]
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
const OUT = join(REPO, 'src', 'tools', 'stick-vocabulary.ts');

const FXTOOL = process.env.PP_FXTOOL_DIR ? process.env.PP_FXTOOL_DIR : resolve(REPO, '..', 'FxTool');
const ENGINE_REF = process.env.PP_FXTOOL_REF || 'origin/main';
const KIT_REL = 'js/vendor/stick/figure-rigged.js';

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

function engineRevision() {
  const resolved = resolveRef();
  return resolved ? `${resolved.ref} ${resolved.sha}` : 'unknown (not a git checkout)';
}

/**
 * The top-level keys of `const NAME = { … }`.
 *
 * Depth-tracked, so a nested object's keys are not mistaken for the outer
 * list's — every one of these definitions has objects inside it. Comments are
 * stripped first: a `//` line mentioning a name would otherwise become one.
 */
function topLevelKeys(src, constName) {
  const m = new RegExp(`^const ${constName}\\s*=\\s*\\{`, 'm').exec(src);
  if (!m) throw new Error(`sync-stick-vocabulary: ${constName} not found in ${KIT_REL}`);
  const start = src.indexOf('{', m.index);
  let depth = 0;
  let end = -1;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) { end = i; break; }
  }
  if (end === -1) throw new Error(`sync-stick-vocabulary: ${constName} never closes`);
  const body = src.slice(start + 1, end);

  const keys = [];
  depth = 0;
  for (const rawLine of body.split('\n')) {
    const line = rawLine.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/, '$1');
    if (depth === 0) {
      const k = /^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w-]*))\s*:/.exec(line);
      if (k) keys.push(k[1] ?? k[2] ?? k[3]);
    }
    for (const ch of line) {
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
    }
  }
  return keys;
}

const LISTS = [
  ['STICK_GAITS', 'GAITS', 'how a figure walks — gait'],
  ['STICK_POSES', 'POSES', 'a single pose, and the entries of a `poses` track'],
  ['STICK_SEQUENCES', 'SEQUENCES', 'a named pose track — sequence'],
  ['STICK_EXPRESSIONS', 'EXPRESSIONS', 'a face — expression, and the entries of `expressions`'],
  ['STICK_PROPS', 'PROPS', 'something held in hand — prop'],
];

function generate() {
  const kit = readCommitted(KIT_REL);
  if (!kit) throw new Error(`sync-stick-vocabulary: cannot read ${KIT_REL}`);
  const digest = createHash('sha256').update(kit).digest('hex').slice(0, 16);

  const blocks = LISTS.map(([exportName, constName, what]) => {
    const keys = topLevelKeys(kit, constName);
    if (keys.length === 0) throw new Error(`sync-stick-vocabulary: ${constName} came out empty`);
    return `/** ${keys.length} names — ${what}. */\nexport const ${exportName}: readonly string[] = Object.freeze([\n${keys.map((k) => `  '${k}',`).join('\n')}\n]);`;
  });

  return `/**
 * GENERATED — DO NOT EDIT. Run \`bun run sync:stick-vocabulary\`.
 *
 * The stick kit's own name lists, for DISCOVERY.
 *
 * The engine validates gait / pose / sequence against these and warns naming
 * the valid set on a miss, so being wrong here costs a caller a round trip
 * rather than a silent failure. They are generated anyway: fifty-odd names
 * across five lists is exactly the shape that drifts, and every enum this repo
 * hand-maintained against FxTool drifted silently.
 *
 * Source: FxTool ${engineRevision()}
 *   ${KIT_REL}
 * sha256: ${digest}
 */

${blocks.join('\n\n')}
`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(join(FXTOOL, KIT_REL))) {
    console.error(`sync-stick-vocabulary: no stick kit at ${join(FXTOOL, KIT_REL)}`);
    console.error('Set PP_FXTOOL_DIR, or check out FxTool beside this repo.');
    process.exit(0);
  }
  const wanted = generate();
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  const count = (wanted.match(/^  '/gm) || []).length;
  if (current === wanted) {
    console.log(`✅ stick vocabulary in sync (${count} names)`);
    process.exit(0);
  }
  if (check) {
    console.error('DRIFT: src/tools/stick-vocabulary.ts differs from FxTool.');
    console.error('Run: bun run fix:stick-vocabulary');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  console.log(`✅ wrote stick vocabulary (${count} names)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
