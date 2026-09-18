#!/usr/bin/env node
/**
 * Generate src/tools/engine-methods.ts from the emitters that guard on them.
 *
 * WHY THIS EXISTS. Every tool that needs an engine method guards it — `if
 * (typeof app.X !== 'function') return { success: false, error: 'app.X
 * unavailable — update FxTool' }`. That is correct per call and useless in
 * advance: an agent discovers a studio is too old only by trying, one tool at a
 * time, and `app.getCapabilities()` cannot help because it reports the engine's
 * VOCABULARY (styles, palettes, relations) rather than which of its methods
 * exist. So "long-form export needs a studio carrying exportToStore" was a fact
 * with nowhere to live except a release note.
 *
 * This extracts the list from the emitted code itself so the answer cannot
 * drift from the guards. A hand-written list of 123 method names beside 111
 * guard sites is the copy-drift defect this repo has spent a week removing —
 * five copies of a six-item stitch list, four of them stale. Derived, or not at
 * all.
 *
 * TWO KINDS, and the distinction is the useful part:
 *  - REQUIRED: guarded with `!==`, so the tool refuses without it.
 *  - OPTIONAL: probed with `===`, so the tool degrades rather than refusing —
 *    a canvas that cannot be resized is not a failed compose.
 * Reporting them as one list would tell an agent that a studio is unusable
 * when it is merely older.
 *
 *   node scripts/sync-engine-methods.mjs [--check]
 *
 * `--check` regenerates into memory and exits non-zero on any difference,
 * which is how the test and prepublishOnly gate it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const SOURCE = join(REPO, 'src', 'types', 'code-generator.ts');
const OUT = join(REPO, 'src', 'tools', 'engine-methods.ts');

/**
 * Pull the guarded method names out of the emitter source.
 *
 * Comments are stripped first. A comment explaining a guard reads exactly like
 * a guard — the collision that has bitten both this repo and FxTool repeatedly
 * — and a method named only in prose is not a method anything checks.
 */
export function extract(src = readFileSync(SOURCE, 'utf8')) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/(?!\s*@engine-methods).*$/gm, '');
  const required = new Set();
  const optional = new Set();

  // DOTTED PATHS, not just `app.X`. Thirteen methods live behind a sub-facade —
  // app.exportEngine.exportToStore, app.mapSystem.worldTour — and a regex for
  // `app.([a-zA-Z0-9_]+)` matches `exportEngine` and reports the FACADE as the
  // method. The first version of this extractor did exactly that and silently
  // omitted exportToStore: the one method anybody had asked about.
  for (const m of code.matchAll(/typeof\s+app\.([a-zA-Z0-9_.]+)\s*(!==|===)\s*'function'/g)) {
    (m[2] === '!==' ? required : optional).add(m[1]);
  }

  // HELPER CALL SITES. Three generators route their guard through a local
  // helper — guard('exportLottie'), simple('listInstruments', …),
  // _facadeCall('bringToFront', …) — so the guard text is interpolated but the
  // NAME is a literal one line away. Reading those recovers most of what the
  // interpolation hid without asking anyone to maintain a list.
  for (const m of code.matchAll(/(?:_facadeCall|guard|simple)\(\s*'([a-zA-Z0-9_]+)'/g)) {
    required.add(m[1]);
  }

  // INTERPOLATED GUARDS cannot be read textually: eight sites emit
  // `typeof app.${fn}` where fn is chosen at generate time. Extracting nothing
  // for them is the silent gap this whole file exists to prevent — it would
  // report a studio as complete while never checking the method the caller
  // needs. So each such guard must carry an annotation naming its candidates,
  // ON the guard rather than in a list elsewhere, and a missing one FAILS.
  const interpolated = [...code.matchAll(/typeof\s+app\.\$\{[^}]+\}\s*(!==|===)\s*'function'/g)];
  // END-OF-LINE, not `\s+`. A character class including whitespace crosses
  // newlines, so the first version swallowed the next line of code and reported
  // `generateInterchange`, `method` and `if` as engine methods — a probe naming
  // methods that do not exist tells an agent a studio is broken when it is not,
  // which is the false positive that teaches people to ignore the guard.
  const annotations = [...code.matchAll(/@engine-methods[ \t]+([^\n]+)/g)]
    .flatMap((m) => m[1].trim().split(/[ \t]+/))
    .filter((n) => /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)*$/.test(n));
  if (interpolated.length && annotations.length === 0) {
    throw new Error(
      `sync-engine-methods: ${interpolated.length} interpolated guard(s) and no @engine-methods annotation. ` +
      'Annotate each `typeof app.${...}` guard with `// @engine-methods nameA nameB` so the probe can reach it.'
    );
  }
  for (const name of annotations) required.add(name);

  // A method refused on somewhere and merely probed elsewhere is REQUIRED: the
  // strictest use is what an agent needs to know about.
  for (const name of required) optional.delete(name);
  return {
    required: [...required].sort(),
    optional: [...optional].sort(),
    interpolatedSites: interpolated.length,
    annotated: annotations.length,
  };
}

function render({ required, optional }) {
  const list = (xs) => xs.map((x) => `  '${x}',`).join('\n');
  return `/* GENERATED — DO NOT EDIT.
 *
 * Source:    src/types/code-generator.ts (its own \`typeof app.X\` guards)
 * Generator: scripts/sync-engine-methods.mjs
 *
 * Re-run the generator after adding or removing a guard. A hand edit here is a
 * second copy of a list that already exists in the emitters, which is the
 * drift this file was created to prevent.
 */

/**
 * Engine methods a tool REFUSES without — guarded with \`!==\` in the emitters.
 *
 * A studio missing one of these cannot serve the tools that need it, and will
 * say so by name when called. Probe them all at once with
 * \`pinepaper_query_capabilities { action: 'studio' }\` instead of discovering
 * it one call at a time.
 */
export const REQUIRED_ENGINE_METHODS: readonly string[] = [
${list(required)}
];

/**
 * Engine methods a tool DEGRADES without — probed with \`===\` in the emitters.
 *
 * Their absence narrows an answer rather than failing it: a canvas that cannot
 * be resized is not a failed compose. Reported separately so an older studio
 * does not read as an unusable one.
 */
export const OPTIONAL_ENGINE_METHODS: readonly string[] = [
${list(optional)}
];
`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(SOURCE)) {
    console.error(`sync-engine-methods: no emitter source at ${SOURCE}`);
    process.exit(1);
  }
  const wanted = render(extract());
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  if (current === wanted) {
    console.log('✅ engine-methods in sync with the emitters');
    return;
  }
  if (check) {
    console.error('DRIFT: src/tools/engine-methods.ts differs from the emitters.');
    console.error('Run: bun run fix:engine-methods');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  const { required, optional } = extract();
  console.log(`✅ wrote engine-methods: ${required.length} required, ${optional.length} optional`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
