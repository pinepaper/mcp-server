#!/usr/bin/env node
/**
 * Generate src/tools/engine-surface.ts — every `app.*` the ENGINE actually has.
 *
 * WHY THIS EXISTS, and why sync-engine-methods.mjs was not enough.
 *
 * That script extracts the names this repo GUARDS: `typeof app.X !== 'function'`.
 * It answers "which methods does a studio need", and it answers it well. What it
 * cannot see is a call site with no guard in front of it — and those are exactly
 * the ones that drift, because nobody was thinking about the engine when they
 * wrote them.
 *
 * Nine diagram tools emitted `app.diagramManager.createShape(...)` with no
 * typeof guard. `app.diagramManager` has never existed in FxTool — the object is
 * `app.diagramSystem`. Twelve references, every release, past a repo that has a
 * drift guard. A beta tester found it by running the tools; the guard could not,
 * because the guard was opt-in and those emitters never opted in.
 *
 * So this one is OPT-OUT. It snapshots the engine's surface, and the parity test
 * checks EVERY `app.X` this repo emits against it. An emitter that legitimately
 * names something outside the snapshot says so in the source, with a reason.
 *
 * WHY A SNAPSHOT rather than reading FxTool at test time: FxTool is a sibling
 * checkout, not a dependency, and this package ships to npm without it. Same
 * shape as sync-design-systems.mjs and sync-character-modules.mjs — generated,
 * committed, provenance-stamped, and re-checked whenever the sibling is present.
 *
 *   node scripts/sync-engine-surface.mjs [--check]
 *
 * `--check` regenerates into memory and exits non-zero on any difference. With
 * no FxTool checkout it exits 0 and says so: an absent sibling is not drift.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT = join(REPO, 'src', 'tools', 'engine-surface.ts');

export const FXTOOL = process.env.PP_FXTOOL_DIR
  ? process.env.PP_FXTOOL_DIR
  : resolve(REPO, '..', 'FxTool');

/**
 * TWO files define what `window.app` is, and reading only the first is a
 * FALSE-POSITIVE FACTORY.
 *
 * `js/PinePaper.js` is the class. `js/app.js` is the editor bootstrap, and it
 * attaches ~65 more names to the instance afterwards — `app.magicSystem`,
 * `app.groupManager`, `app.templateManager`, `app.fontStudio`, `app.batchModify`.
 * The first draft of this generator read only the class, and three working
 * subsystems were reported as drift. A guard that cries wolf over working code
 * is worse than no guard, because the next person switches it off.
 */
const ENGINE = join(FXTOOL, 'js', 'PinePaper.js');
const BOOTSTRAP = join(FXTOOL, 'js', 'app.js');

/**
 * Read the engine's own surface out of its source.
 *
 * Four ways a name lands on `app`, and missing any one of them produces a FALSE
 * POSITIVE — a guard that cries drift over a working call is worse than no
 * guard, because the next person turns it off.
 *
 *  - `name(args) {`        an instance method
 *  - `get name() {`        an accessor
 *  - `this.name =`         a plain property, assigned in the constructor
 *  - `_defineLazy('name')` / `_defineLazyHeavy('name')`  a lazy subsystem
 *
 * The lazy KIND is carried through rather than flattened, because the two
 * behave differently and one of them is a bug factory: `_defineLazy` constructs
 * on first access and is always safe to touch, while `_defineLazyHeavy` returns
 * undefined until `ensureHeavyModules()` has run. Every tool that reaches a
 * heavy one without awaiting that has a cold-start race — which is precisely
 * the `app.exportEngine` bug fixed in 1.6.9, and there are eight of these.
 */
export function readEngineSurface(src = readFileSync(ENGINE, 'utf8'), bootstrap = readBootstrap()) {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  /** @type {Map<string, string>} name → kind */
  const surface = new Map();
  const put = (name, kind) => {
    if (!name || surface.has(name)) return;
    surface.set(name, kind);
  };

  // Lazy definitions first: they are the most specific claim about a name.
  for (const m of code.matchAll(/_defineLazyHeavy\(\s*['"]([A-Za-z_]\w*)['"]/g)) put(m[1], 'lazyHeavy');
  for (const m of code.matchAll(/_defineLazy\(\s*['"]([A-Za-z_]\w*)['"]/g)) put(m[1], 'lazy');
  // Class members at two-space indent — the PinePaper class body.
  for (const m of code.matchAll(/^ {2}get\s+([A-Za-z_]\w*)\s*\(/gm)) put(m[1], 'accessor');
  for (const m of code.matchAll(/^ {2}(?:async\s+|\*\s*)?([A-Za-z_]\w*)\s*\(/gm)) put(m[1], 'method');
  // Constructor-assigned properties.
  for (const m of code.matchAll(/\bthis\.([A-Za-z_]\w*)\s*=(?!=)/g)) put(m[1], 'property');

  // Names the bootstrap bolts on after construction. Kind 'bootstrap' because
  // they are neither class members nor lazy — they exist only once app.js has
  // run, which is true for every studio this server talks to.
  for (const name of bootstrap) put(name, 'bootstrap');

  // Keywords the member regex picks up from control flow inside the class body.
  for (const kw of ['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'constructor']) {
    surface.delete(kw);
  }
  return surface;
}

/** `app.X = …` / `window.app.X = …` from the editor bootstrap. */
export function readBootstrap(src = existsSync(BOOTSTRAP) ? readFileSync(BOOTSTRAP, 'utf8') : '') {
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const names = new Set();
  for (const m of code.matchAll(/(?:window\.)?\bapp\.([A-Za-z_]\w*)\s*=(?!=)/g)) names.add(m[1]);
  return names;
}

/**
 * Sub-facade surfaces: what `app.<facade>.<method>` may name.
 *
 * Checking only the top-level name catches `app.diagramManager` and misses
 * `app.fontStudio.getRequiredChars` — six broken font actions whose FACADE is
 * real and whose methods are not. The drift lives one dot deeper than the first
 * version of this guard looked.
 *
 * Resolved by convention: a camelCase facade maps to a PascalCase class of the
 * same name (`fontStudio` → `class FontStudio`). A facade with no such class is
 * simply not snapshotted rather than guessed at — an incomplete map must make
 * the guard quieter, never louder, or it starts failing working code.
 */
export function readFacades(names) {
  const out = {};
  for (const name of names) {
    const cls = name.charAt(0).toUpperCase() + name.slice(1);
    for (const rel of [`js/${cls}.js`, `js/diagram/${cls}.js`, `js/export/${cls}.js`]) {
      const file = join(FXTOOL, rel);
      if (!existsSync(file)) continue;
      const body = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      if (!new RegExp(`class\\s+${cls}\\b`).test(body)) continue;
      const methods = new Set();
      for (const m of body.matchAll(/^ {2}(?:async\s+|\*\s*|get\s+)?([A-Za-z_]\w*)\s*\(/gm)) methods.add(m[1]);
      for (const m of body.matchAll(/\bthis\.([A-Za-z_]\w*)\s*=(?!=)/g)) methods.add(m[1]);
      for (const kw of ['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'constructor']) methods.delete(kw);
      if (methods.size) out[name] = [...methods].sort();
      break;
    }
  }
  return out;
}

/** Facades the emitters actually reach through, so the snapshot stays relevant. */
function facadesInUse() {
  const names = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== '__tests__' && entry.name !== 'vendor') walk(full);
      } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
        for (const m of readFileSync(full, 'utf8').matchAll(/\bapp\.([A-Za-z_]\w*)\.([A-Za-z_]\w*)/g)) names.add(m[1]);
      }
    }
  };
  walk(join(REPO, 'src'));
  return [...names].sort();
}

function generate() {
  const src = readFileSync(ENGINE, 'utf8');
  const sha = createHash('sha256').update(src).digest('hex');
  const surface = readEngineSurface(src);
  const rows = [...surface.entries()].sort(([a], [b]) => a.localeCompare(b));
  const heavy = rows.filter(([, k]) => k === 'lazyHeavy').map(([n]) => n);
  const facades = readFacades(facadesInUse());

  return `/* GENERATED — DO NOT EDIT.
 *
 * Source:    FxTool/js/PinePaper.js
 * sha256:    ${sha}
 * Generator: scripts/sync-engine-surface.mjs
 *
 * Every name reachable on \`window.app\`, with how it gets there. The parity
 * test checks every \`app.X\` this repo emits against this list, so a call to a
 * method the engine does not have fails here instead of failing silently in a
 * user's browser.
 *
 * Re-run the generator against an FxTool checkout. A hand edit is a second
 * copy of the engine's surface, which is the drift this file exists to catch.
 */

/** How a name lands on \`app\`. */
export type EngineMemberKind = 'method' | 'accessor' | 'property' | 'lazy' | 'lazyHeavy' | 'bootstrap';

/** ${rows.length} names, from FxTool/js/PinePaper.js. */
export const ENGINE_SURFACE: Readonly<Record<string, EngineMemberKind>> = Object.freeze({
${rows.map(([n, k]) => `  ${/^[A-Za-z_]\w*$/.test(n) ? n : JSON.stringify(n)}: '${k}',`).join('\n')}
});

/**
 * Subsystems that are UNDEFINED until \`app.ensureHeavyModules()\` has run —
 * idle-prefetched roughly 1.2s after boot.
 *
 * An agent that connects and immediately calls a tool beats that prefetch, and
 * the tool reports the studio as too old for a capability it has. That was the
 * \`app.exportEngine\` bug fixed in 1.6.9; these are the others with the same
 * shape. Any emitter touching one must await ensureHeavyModules() first.
 */
export const LAZY_HEAVY_SUBSYSTEMS: readonly string[] = Object.freeze([
${heavy.map((n) => `  '${n}',`).join('\n')}
]);

/**
 * What \`app.<facade>.<method>\` may name, for the facades the emitters reach
 * through. A facade absent from this map is not checked — an incomplete map
 * must make the guard quieter, never louder.
 */
export const ENGINE_FACADES: Readonly<Record<string, readonly string[]>> = Object.freeze({
${Object.entries(facades).map(([f, ms]) => `  ${f}: Object.freeze([${ms.map((m) => `'${m}'`).join(', ')}]),`).join('\n')}
});
`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(ENGINE)) {
    console.error(`sync-engine-surface: no FxTool engine at ${ENGINE}`);
    console.error('Set PP_FXTOOL_DIR, or check out FxTool beside this repo.');
    // Absent sibling is not drift: this package ships to npm without it.
    process.exit(0);
  }

  const wanted = generate();
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  if (current === wanted) {
    console.log(`✅ engine surface in sync (${(wanted.match(/^  \w+: '/gm) || []).length} names)`);
    process.exit(0);
  }
  if (check) {
    console.error('DRIFT: src/tools/engine-surface.ts differs from FxTool/js/PinePaper.js.');
    console.error('Run: bun run fix:engine-surface');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  console.log(`✅ wrote engine surface: ${(wanted.match(/^  \w+: '/gm) || []).length} names`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
