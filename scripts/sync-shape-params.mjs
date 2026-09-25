#!/usr/bin/env node
/**
 * Generate src/tools/shape-params.ts — what each registry-backed SHAPE reads.
 *
 * WHY THIS EXISTS.
 *
 * sync-engine-surface.mjs answers "does `app.X` exist". It cannot answer "does
 * `app.create('triangle', {kind:'right'})` do anything", because `create` exists
 * and the call succeeds either way — an unread parameter is dropped in silence
 * and the caller gets a shape, just not the one they asked for.
 *
 * That is how B10 happened. `triangle` was documented as taking `color` and
 * nothing else while the engine read width, height, `angles` and `kind` and
 * built the triangle by the law of sines. Nothing was broken and no error was
 * ever raised; the capability was simply invisible, so every model that wanted
 * a right triangle hand-built one out of a path. `polygon` had the same gap —
 * `points` accepts an explicit vertex list — and ellipse and heart were both
 * documented `color`-only.
 *
 * So this snapshot records, per registered shape id, which `config.*` keys its
 * `create` actually reads, and which `params.*` each of those keys is fed from
 * in PinePaper.js's registryConfig block. The parity test then asserts that a
 * shape's documentation names a way to reach EVERY key its shape reads, and
 * names nothing `create()` would throw away.
 *
 * Both directions matter. Under-documenting hides a feature; over-documenting
 * promises a parameter that vanishes, which is worse, because the caller writes
 * it, sees success, and never learns it was ignored.
 *
 *   node scripts/sync-shape-params.mjs [--check]
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
const OUT = join(REPO, 'src', 'tools', 'shape-params.ts');

const FXTOOL = process.env.PP_FXTOOL_DIR ? process.env.PP_FXTOOL_DIR : resolve(REPO, '..', 'FxTool');
const ENGINE_REF = process.env.PP_FXTOOL_REF || 'origin/main';

const ENGINE_REL = 'js/PinePaper.js';
const SHAPE_FILES = [
  'js/shapes/basic.js',
  'js/shapes/comment.js',
  'js/shapes/flowchart.js',
  'js/shapes/network.js',
  'js/shapes/uml.js',
];

/** Same rule as sync-engine-surface: describe the engine USERS run, not a branch. */
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
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch { /* absent at that ref — fall through to the working tree */ }
  }
  const abs = join(FXTOOL, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function engineRevision() {
  const resolved = resolveRef();
  return resolved ? `${resolved.ref} ${resolved.sha}` : 'unknown (not a git checkout)';
}

/**
 * The brace-matched block starting at the first `{` at or after `from`.
 * Quote- and comment-naive on purpose: these are object literals and arrow
 * bodies in hand-written source, and a brace inside a string would have to be
 * unbalanced to fool it.
 */
function blockAfter(src, from) {
  const start = src.indexOf('{', from);
  if (start === -1) return '';
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return src.slice(start);
}

/** Split an object literal's body into top-level `key: value` pairs. */
function topLevelEntries(block) {
  const body = block.slice(1, -1);
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (c === ',' && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  out.push(body.slice(start));
  return out
    .map((chunk) => {
      const m = /^\s*(?:\/\/[^\n]*\n\s*)*([A-Za-z_]\w*)\s*:/.exec(chunk);
      return m ? { key: m[1], value: chunk.slice(chunk.indexOf(':', chunk.indexOf(m[1])) + 1) } : null;
    })
    .filter(Boolean);
}

/**
 * Comments out, before anything structural reads this source.
 *
 * Both parsers below were wrong without this. A comma inside
 * `// Star outer size: prefer radius1, but fall back to …` split the
 * registryConfig literal mid-comment and the `width` key vanished, taking the
 * star's outer-size mapping with it. And a `config.foo` NAMED in a comment
 * would otherwise count as a read the shape does not perform.
 *
 * The `[^:]` guard keeps `http://` intact.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function names(re, src) {
  return [...new Set([...src.matchAll(re)].map((m) => m[1]))].sort();
}

/**
 * registryConfig is the ONLY bridge between a caller's `params` and a shape's
 * `config`. A key absent from it can never be reached, whatever the shape reads.
 */
function configToParams(engineRaw) {
  const engine = stripComments(engineRaw);
  const at = engine.indexOf('const registryConfig = {');
  if (at === -1) throw new Error('sync-shape-params: registryConfig literal not found in PinePaper.js');
  const block = blockAfter(engine, at);
  const map = {};
  for (const { key, value } of topLevelEntries(block)) {
    map[key] = names(/\bparams\.([A-Za-z_]\w*)/g, value);
  }
  // `config.size` is assembled from the width and height keys, so a shape that
  // reads size is reachable by anything that feeds either one.
  map.size = [...new Set([...(map.width || []), ...(map.height || [])])].sort();
  return map;
}

/** Every `params.*` create() looks at — the widest set a caller may legally pass. */
function acceptedParams(engineRaw) {
  const engine = stripComments(engineRaw);
  const m = /^\s{2}create\(type, params = \{\}\) \{/m.exec(engine);
  if (!m) throw new Error('sync-shape-params: create(type, params) not found in PinePaper.js');
  // Anchor PAST the signature: `blockAfter` from the method's start matched the
  // `{}` default parameter and returned an empty body, so this list read as
  // "create() accepts nothing" — a guard that would have blessed every name.
  return names(/\bparams\.([A-Za-z_]\w*)/g, blockAfter(engine, m.index + m[0].length - 1));
}

/**
 * Every `params.*` normalizeParams() looks at. create() runs it first, so these
 * are aliases (fill, stroke, delay, radiusX…) a caller may pass even though
 * create()'s own body never names them. Without this list a guard built on
 * ACCEPTED_CREATE_PARAMS alone would call `fill` unknown — the one spelling
 * the engine went out of its way to accept.
 */
function normalizeParamReads(engineRaw) {
  const engine = stripComments(engineRaw);
  const m = /^function normalizeParams\(params, kind\) \{/m.exec(engine);
  if (!m) throw new Error('sync-shape-params: normalizeParams(params, kind) not found in PinePaper.js');
  return names(/\bparams\.([A-Za-z_]\w*)/g, blockAfter(engine, m.index + m[0].length - 1));
}

/**
 * Every `changes.*` the modify path reads: modifyItem(itemId, changes) and the
 * _applyChangesToItem(item, changes) it hands off to. modify_item reports any
 * other key as having had no effect, the way create_item does against create().
 */
function modifyChangeReads(engineRaw) {
  const engine = stripComments(engineRaw);
  const out = new Set();
  for (const sig of [/^\s{2}modifyItem\(itemId, changes\) \{/m, /^\s{2}_applyChangesToItem\(item, changes\) \{/m]) {
    const m = sig.exec(engine);
    if (!m) throw new Error(`sync-shape-params: ${sig} not found in PinePaper.js`);
    for (const n of names(/\bchanges\.([A-Za-z_]\w*)/g, blockAfter(engine, m.index + m[0].length - 1))) out.add(n);
  }
  return [...out].sort();
}

/**
 * Per registered shape id, the `config.*` keys its `create` reads.
 *
 * A registration whose definition is a shared identifier (`regularPolygon(4, …)`,
 * `arrowDef`) is followed to that identifier's own block — otherwise pentagon,
 * hexagon, diamond and both arrows would report reading NOTHING, and a guard
 * that demands nothing of four shapes is four shapes of false confidence.
 */
function shapeConfigReads(sources) {
  const reads = {};
  for (const raw of sources) {
    const src = stripComments(raw);
    const marks = [...src.matchAll(/registry\.register\(\s*'([A-Za-z0-9-]+)'\s*,\s*/g)];
    marks.forEach((m, i) => {
      const id = m[1];
      const from = m.index + m[0].length;
      const to = i + 1 < marks.length ? marks[i + 1].index : src.length;
      let chunk = src.slice(from, to);
      if (!chunk.trimStart().startsWith('{')) {
        const ident = /^\s*([A-Za-z_]\w*)/.exec(chunk)?.[1];
        const def = ident ? new RegExp(`\\bconst ${ident}\\s*=`).exec(src) : null;
        chunk = def ? blockAfter(src, def.index) : chunk;
      } else {
        chunk = blockAfter(src, from);
      }
      reads[id] = names(/\bconfig\.([A-Za-z_]\w*)/g, chunk);
    });
  }
  return reads;
}

function generate() {
  const engine = readCommitted(ENGINE_REL);
  if (!engine) throw new Error(`sync-shape-params: cannot read ${ENGINE_REL}`);
  const sources = SHAPE_FILES.map(readCommitted).filter(Boolean);
  if (sources.length === 0) throw new Error('sync-shape-params: no shape sources readable');

  const toParams = configToParams(engine);
  const accepted = acceptedParams(engine);
  const normalized = normalizeParamReads(engine);
  const modifyReads = modifyChangeReads(engine);
  const reads = shapeConfigReads(sources);

  const digest = createHash('sha256')
    .update(engine)
    .update(sources.join('\n'))
    .digest('hex')
    .slice(0, 16);

  const ids = Object.keys(reads).sort();
  const cfgKeys = Object.keys(toParams).sort();

  return `/**
 * GENERATED — DO NOT EDIT. Run \`bun run sync:shape-params\`.
 *
 * What each registry-backed shape reads, and how a caller reaches it.
 *
 * Source: FxTool ${engineRevision()}
 *   ${ENGINE_REL} + ${SHAPE_FILES.length} shape modules
 * sha256: ${digest}
 *
 * A shape's \`create\` receives a \`config\`, never the caller's \`params\`.
 * PinePaper.js's registryConfig literal is the only bridge between the two, so
 * a config key with no params behind it is unreachable by any caller and a
 * params name absent from create() is discarded before it gets near a shape.
 * shape-docs-parity.test.ts checks the documentation against both directions.
 */

/** Every \`params.*\` that \`create(type, params)\` reads. Anything else is dropped. */
export const ACCEPTED_CREATE_PARAMS: readonly string[] = Object.freeze([
${accepted.map((n) => `  '${n}',`).join('\n')}
]);

/**
 * Every \`params.*\` that normalizeParams() reads before create() sees them —
 * the aliases (fill → fillColor, delay → timeOffset, radiusX → width…).
 * Together with ACCEPTED_CREATE_PARAMS, the full set a caller may pass.
 */
export const NORMALIZE_PARAM_READS: readonly string[] = Object.freeze([
${normalized.map((n) => `  '${n}',`).join('\n')}
]);

/**
 * Every \`changes.*\` that modifyItem() / _applyChangesToItem() read. With
 * NORMALIZE_PARAM_READS (modify normalises too), the keys modify_item can act on.
 */
export const MODIFY_CHANGE_READS: readonly string[] = Object.freeze([
${modifyReads.map((n) => `  '${n}',`).join('\n')}
]);

/**
 * config key → the \`params.*\` names that feed it. Several names for one key
 * are ALTERNATIVES: a star's outer size arrives as radius1, radius, width or
 * height, and documenting any one of them makes the key reachable.
 */
export const CONFIG_KEY_SOURCES: Readonly<Record<string, readonly string[]>> = Object.freeze({
${cfgKeys.map((k) => `  ${JSON.stringify(k)}: Object.freeze([${toParams[k].map((n) => `'${n}'`).join(', ')}]),`).join('\n')}
});

/** Registered shape id → the \`config.*\` keys its \`create\` reads. */
export const SHAPE_CONFIG_READS: Readonly<Record<string, readonly string[]>> = Object.freeze({
${ids.map((id) => `  ${JSON.stringify(id)}: Object.freeze([${reads[id].map((n) => `'${n}'`).join(', ')}]),`).join('\n')}
});

/**
 * Keys every shape receives regardless of what the caller asked for. Reading
 * one says nothing about the shape's own parameters, so the guard ignores them.
 *
 * \`size\` is deliberately NOT here. Every shape reads it, but it is the only
 * route width / height / radius take, and a shape that documents none of them
 * has no stated size at all — which is exactly how ellipse and heart came to be
 * documented as taking nothing but \`color\`.
 */
export const UNIVERSAL_CONFIG_KEYS: readonly string[] = Object.freeze(['position', 'style']);
`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(join(FXTOOL, ENGINE_REL))) {
    console.error(`sync-shape-params: no FxTool engine at ${join(FXTOOL, ENGINE_REL)}`);
    console.error('Set PP_FXTOOL_DIR, or check out FxTool beside this repo.');
    process.exit(0);
  }
  const wanted = generate();
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  const count = (wanted.match(/^  "[A-Za-z0-9-]+": Object\.freeze/gm) || []).length;
  if (current === wanted) {
    console.log(`✅ shape params in sync (${count} entries)`);
    process.exit(0);
  }
  if (check) {
    console.error('DRIFT: src/tools/shape-params.ts differs from FxTool.');
    console.error('Run: bun run fix:shape-params');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  console.log(`✅ wrote shape params (${count} entries)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
