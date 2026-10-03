#!/usr/bin/env node
/**
 * Every relation the engine registers STATICALLY must be in the fixture the
 * relation-parity test reads (src/__tests__/fixtures/engine-relations.txt).
 *
 * WHY. relationType is mirrored by hand, and the fixture is refreshed by hand,
 * so a new engine relation was invisible until someone noticed: FxTool #101
 * added on_event_play_sound and nothing here said so (D85). The parity test
 * then makes the schema, every JSON enum copy and RELATION_TYPE_MAP follow the
 * fixture — this closes the step before it.
 *
 * AGAINST THE ENGINE'S OWN LIST. Whole families are registered dynamically
 * (on_event_*, on_enter_*, deform_*, effect_* built from name tables), so the
 * first version scraped `registerRule('name'` and saw 61 of 140. FxTool #104
 * exports the registry's full list, claude-docs/relation-names.json; this
 * compares both ways. WHICH names the tools expose, and which are deliberately
 * left to the tool that creates them, is decided in relation-parity.test.ts
 * (EMITTED_BY_A_TOOL) — not here.
 *
 *   node scripts/check-relation-names.mjs [--fix]   (--fix rewrites the fixture)
 *
 * Reads FxTool's committed origin/main. With no FxTool checkout it exits 0 and
 * says so: an absent sibling is not drift.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const FIXTURE = join(REPO, 'src', '__tests__', 'fixtures', 'engine-relations.txt');
const FXTOOL = process.env.PP_FXTOOL_DIR ? process.env.PP_FXTOOL_DIR : resolve(REPO, '..', 'FxTool');
const REF = process.env.PP_FXTOOL_REF || 'origin/main';

if (!existsSync(FXTOOL)) {
  console.error(`no FxTool checkout at ${FXTOOL} — relation names not checked.`);
  console.error('Set PP_FXTOOL_DIR, or check out FxTool beside this repo.');
  process.exit(0);
}

const FIX = process.argv.includes('--fix');
// Fixture-only entries that are deliberately not engine relations.
const FIXTURE_ONLY = new Set([
  'unknown',                                   // the escape hatch for an unrecognised edge
  // TEMPORARY: registered lazily by the character system (FxTool #105, D66) and
  // missing from relation-names.json until fxtool's export captures lazy
  // registrations. Remove when it does — the guard then checks them normally.
  'looks_at', 'reacts_to', 'drag_to_turn',
]);

let raw;
try {
  raw = execFileSync('git', ['-C', FXTOOL, 'show', `${REF}:claude-docs/relation-names.json`], { encoding: 'utf8' });
} catch (e) {
  console.error(`could not read claude-docs/relation-names.json at FxTool ${REF}: ${e.message}`);
  process.exit(1);
}
const engine = JSON.parse(raw);
if (!Array.isArray(engine) || engine.some((n) => typeof n !== 'string')) {
  console.error('relation-names.json is not a flat list of names — its shape changed; update this script.');
  process.exit(1);
}
const fixtureLines = readFileSync(FIXTURE, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);
const fixture = new Set(fixtureLines);
const missing = engine.filter((n) => !fixture.has(n)).sort();
const gone = fixtureLines.filter((n) => !engine.includes(n) && !FIXTURE_ONLY.has(n)).sort();

if (FIX) {
  const next = [...new Set([...engine, ...[...fixture].filter((n) => FIXTURE_ONLY.has(n))])].sort();
  writeFileSync(FIXTURE, next.join('\n') + '\n');
  console.log(`✅ wrote ${next.length} relation names to the fixture (${missing.length} added, ${gone.length} removed)`);
  process.exit(0);
}
if (missing.length || gone.length) {
  if (missing.length) console.error(`DRIFT: FxTool ${REF} registers relation(s) the fixture does not list: ${missing.join(', ')}`);
  if (gone.length) console.error(`DRIFT: the fixture lists relation(s) FxTool ${REF} no longer registers: ${gone.join(', ')}`);
  console.error('Run: node scripts/check-relation-names.mjs --fix — then relation-parity.test.ts names every copy to update, or EMITTED_BY_A_TOOL to extend.');
  process.exit(1);
}
console.log(`✅ relation names: the fixture matches all ${engine.length} relations FxTool ${REF} registers`);
