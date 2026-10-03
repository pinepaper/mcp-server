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
 * WHY A SUBSET CHECK, NOT A GENERATOR. Whole families are registered
 * dynamically (on_event_*, on_enter_*, deform_*, effect_* built in loops from
 * name tables), so a scrape of `registerRule('name'` sees 63 of ~140. The
 * fixture stays the full list (taken from the live registry); this only proves
 * nothing STATIC is missing from it. A dynamic family growing is not caught —
 * that needs the engine's own relation listing, which is fxtool's to export.
 *
 *   node scripts/check-relation-names.mjs
 *
 * Reads FxTool's committed origin/main. With no FxTool checkout it exits 0 and
 * says so: an absent sibling is not drift.
 */
import { readFileSync, existsSync } from 'node:fs';
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

let grep;
try {
  grep = execFileSync('git', ['-C', FXTOOL, 'grep', '-hoE', "registerRule\\(\\s*'[a-z_0-9]+'", REF, '--', 'js'], { encoding: 'utf8' });
} catch (e) {
  console.error(`could not read FxTool ${REF}: ${e.message}`);
  process.exit(1);
}
const engine = [...new Set(grep.split('\n').map((l) => (/'([a-z_0-9]+)'/.exec(l) || [])[1]).filter(Boolean))]
  .filter((n) => !n.endsWith('_'));          // a template prefix (deform_${x}), not a name
const fixture = new Set(readFileSync(FIXTURE, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean));
const missing = engine.filter((n) => !fixture.has(n)).sort();

if (missing.length) {
  console.error(`DRIFT: FxTool ${REF} registers relation(s) the fixture does not list: ${missing.join(', ')}`);
  console.error(`Add them to ${FIXTURE.replace(REPO + '/', '')}; relation-parity.test.ts then names every copy to update.`);
  process.exit(1);
}
console.log(`✅ relation names: all ${engine.length} statically registered engine relations are in the fixture`);
