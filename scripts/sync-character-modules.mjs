#!/usr/bin/env node
/**
 * Generate src/character/*.ts from mcp-cloud's originals.
 *
 * WHY THIS DID NOT EXIST AND HAD TO. These two files were hand-vendored: the
 * header says "Do NOT edit here — change it in mcp-cloud and re-vendor", a
 * parity test compares them byte for byte, and there was no re-vendoring tool.
 * So the only way to honour the instruction was to transcribe ~36KB of timing
 * logic by hand and hope, which is the failure mode the header itself
 * describes — "the two implementations drift and a figure performs differently
 * depending on which surface a caller reached".
 *
 * It drifted on 2026-09-18: upstream's character-perform.ts changed and the
 * parity test went red with no mechanical way to fix it. FxTool's
 * sync-stick-modules.mjs and this repo's sync-design-systems.mjs already solve
 * exactly this, for anatomy and for design tokens respectively. This is the
 * third instance of one pattern, which is the argument for it being a pattern.
 *
 * MECHANICAL. Three textual edits, each applied by rule, each the inverse of a
 * substitution the existing parity test already performs — so the test and the
 * generator agree by construction rather than by someone keeping them in step:
 *  1. the DURATION_SCALE_MS import points at ./duration-scale.js here, because
 *     the cloud reads it from its motion-design-tokens module;
 *  2. relative imports gain .js, which TypeScript omits and ESM requires;
 *  3. one reduce callback gains explicit parameter types, because this repo
 *     compiles under stricter settings than the cloud's.
 *
 *   node scripts/sync-character-modules.mjs [--check]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = join(REPO, 'src', 'character');

export const UPSTREAM = process.env.PP_MCP_CLOUD_DIR
  ? join(process.env.PP_MCP_CLOUD_DIR, 'src', 'services')
  : resolve(REPO, '..', 'mcp-cloud', 'src', 'services');

/** [our file, their file] — the pairs the parity test already declares. */
export const PAIRS = [
  ['perform.ts', 'character-perform.ts'],
  ['path-bbox.ts', 'path-bbox.ts'],
];

/** The three rule-applied edits, forward. The parity test reverses these. */
function localise(code) {
  return code
    .replace(/from "\.\/motion-design-tokens"/g, 'from "./duration-scale.js"')
    .replace(/from "\.\/path-bbox"/g, 'from "./path-bbox.js"')
    .replace(
      /DURATION_SCALE_MS\.reduce\(\(best, d\) =>/g,
      'DURATION_SCALE_MS.reduce((best: number, d: number) =>',
    );
}

function header(theirs, sha) {
  return `/* VENDORED from mcp-cloud/src/services/${theirs}.
 * sha256: ${sha}
 * Generator: scripts/sync-character-modules.mjs
 *
 * Do NOT edit here — change it in mcp-cloud and re-run the generator, or the
 * two implementations drift and a figure performs differently depending on
 * which surface a caller reached. Guarded by character.test.ts.
 */
`;
}

export function generate(ours, theirs) {
  const src = readFileSync(join(UPSTREAM, theirs), 'utf8');
  const sha = createHash('sha256').update(src).digest('hex');
  return header(theirs, sha) + localise(src);
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(UPSTREAM)) {
    console.error(`sync-character-modules: no upstream at ${UPSTREAM}`);
    console.error('Set PP_MCP_CLOUD_DIR, or check out mcp-cloud beside this repo.');
    // Absent sibling is not a failure: this package ships to npm without it.
    process.exit(0);
  }

  let drifted = 0;
  for (const [ours, theirs] of PAIRS) {
    const wanted = generate(ours, theirs);
    const dest = join(OUT_DIR, ours);
    const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
    if (current === wanted) continue;
    drifted++;
    if (check) {
      console.error(`DRIFT: src/character/${ours} differs from mcp-cloud/src/services/${theirs}`);
    } else {
      writeFileSync(dest, wanted);
      console.log(`${current === null ? 'wrote' : 'updated'}: src/character/${ours}`);
    }
  }

  if (check && drifted) {
    console.error(`\n${drifted} vendored file(s) differ. Run: bun run sync:character`);
    process.exit(1);
  }
  console.log(check ? '✅ vendored character modules match upstream' : `✅ ${PAIRS.length} file(s) in sync`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
