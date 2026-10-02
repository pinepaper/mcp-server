#!/usr/bin/env node
/**
 * Generate src/tools/engine-lists.ts — name lists the engine owns, which the
 * tool surface must offer exactly.
 *
 * WHY GENERATED. Both lists were hand-copied first, and both copies were
 * wrong in the way every hand-copied engine list in this repo has been wrong:
 * silently.
 *
 * - EASING_NAMES. Six hand-maintained six-name enums rejected every easing
 *   the engine added (the springs, FxTool #39) and hid ten it always had, and
 *   FxTool's own validator carried a stale nine-name copy of the same table
 *   (#40). The names are the keys of `EASINGS` in core/KeyframeInterpolator.js,
 *   several of them arriving through spreads (`..._springs`, `..._standard`),
 *   so a text scrape misses them: the module is EVALUATED instead. It has no
 *   imports and runs standalone; if that ever stops being true, this fails
 *   loudly rather than guessing.
 * - WORLD3D_COLOR_PATHS. The world spec's colour fields, WORLD_SCHEMA entries
 *   of kind 'color' in world3d/worlds.js. None of them is named `color`, so a
 *   converter keyed on that name let a hex `env.zenith` through to a validator
 *   that refused it, and the refusal's reason was dropped too (W1).
 *
 * - DESIGN_MEDIA / DESIGN_MEDIA_APPLY. The media core/DesignMedia.js MEDIA
 *   knows, and the engine method that applies each one (its `apply` field), so
 *   design_medium's `apply` action offers exactly what the engine can do and
 *   names the rest so their refusal reaches the agent. MEDIA imports another
 *   module, so it is parsed (top-level keys, depth-tracked), not evaluated.
 *
 * - FILTER_TYPES / FILTER_DOCS. The filters FilterSystem.js registers
 *   (registerFilter('name', {description, params})), with each one's own
 *   description and parameter ranges. add_filter's hand-copied enum hid six
 *   of twenty (dither, halftoneCMYK, halftoneDots, edgeDetect, hsl,
 *   colorTint), and the marketing session asked for dither by name.
 *
 * Descriptions are NOT generated: they are prose, written here. The type of
 * EASING_DESCRIPTIONS is keyed on the generated union, so a new engine easing
 * fails the TYPECHECK until someone writes its line.
 *
 *   node scripts/sync-engine-lists.mjs [--check]
 *
 * Reads FxTool's COMMITTED origin/main (the tree is shared with other
 * sessions, so its working copy is not evidence). `--check` regenerates into
 * memory and exits non-zero on any difference. With no FxTool checkout it
 * exits 0 and says so: an absent sibling is not drift.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT = join(REPO, 'src', 'tools', 'engine-lists.ts');

const FXTOOL = process.env.PP_FXTOOL_DIR ? process.env.PP_FXTOOL_DIR : resolve(REPO, '..', 'FxTool');
const ENGINE_REF = process.env.PP_FXTOOL_REF || 'origin/main';
const EASING_REL = 'js/core/KeyframeInterpolator.js';
const WORLD_REL = 'js/world3d/worlds.js';
const MEDIA_REL = 'js/core/DesignMedia.js';
const FILTER_REL = 'js/FilterSystem.js';

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

const digest = (s) => createHash('sha256').update(s).digest('hex').slice(0, 16);

async function easingNames(src) {
  if (/^\s*import\s/m.test(src)) {
    throw new Error(`sync-engine-lists: ${EASING_REL} now has imports, so it cannot be evaluated standalone. Teach this script to resolve them.`);
  }
  const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`);
  const names = mod.EASING_NAMES;
  if (!Array.isArray(names) || names.length === 0 || !names.every((n) => typeof n === 'string')) {
    throw new Error(`sync-engine-lists: ${EASING_REL} did not export a non-empty EASING_NAMES string array`);
  }
  return names;
}

function worldColorPaths(src) {
  const start = src.indexOf('WORLD_SCHEMA');
  if (start === -1) throw new Error(`sync-engine-lists: WORLD_SCHEMA not found in ${WORLD_REL}`);
  const paths = [...src.slice(start).matchAll(/path:\s*'([^']+)',\s*kind:\s*'color'/g)].map((m) => m[1]);
  if (paths.length === 0) throw new Error(`sync-engine-lists: no kind:'color' entries in WORLD_SCHEMA (${WORLD_REL})`);
  return paths;
}

/** MEDIA's top-level keys, and each entry's `apply: '<method>'` when it has one. */
function designMedia(src) {
  const m = /export const MEDIA\s*=\s*Object\.freeze\(\{/.exec(src);
  if (!m) throw new Error(`sync-engine-lists: MEDIA not found in ${MEDIA_REL}`);
  const start = src.indexOf('{', m.index);
  const entries = [];
  let depth = 0;
  let current = null;
  for (const raw of src.slice(start + 1).split('\n')) {
    const line = raw.replace(/\/\/.*$/, '');
    if (depth === 0) {
      if (/^\s*\}\);?/.test(line)) break;
      const k = /^\s*([A-Za-z_]\w*)\s*:\s*\{/.exec(line);
      if (k) { current = { key: k[1], apply: null }; entries.push(current); }
    } else if (depth === 1 && current) {
      const a = /^\s*apply:\s*'([A-Za-z_]\w*)'/.exec(line);
      if (a) current.apply = a[1];
    }
    for (const ch of line.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '')) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
  }
  if (entries.length === 0) throw new Error(`sync-engine-lists: MEDIA came out empty (${MEDIA_REL})`);
  return entries;
}

/**
 * Every registerFilter('name', { description, params: { p: { type, min, max,
 * default, options } } }). Bounded per block (to the next registerFilter), so
 * one filter's params are never read as another's.
 */
function filters(src) {
  const starts = [...src.matchAll(/registerFilter\('([A-Za-z]\w*)'\s*,/g)];
  if (starts.length === 0) throw new Error(`sync-engine-lists: no registerFilter calls in ${FILTER_REL}`);
  return starts.map((m, i) => {
    const block = src.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : m.index + 4000);
    const desc = /description:\s*'((?:[^'\\]|\\.)*)'/.exec(block)?.[1] ?? '';
    const params = [...block.matchAll(/^\s*([A-Za-z]\w*):\s*\{\s*type:\s*'(\w+)'([^}]*)\}/gm)].map((p) => {
      const rest = p[3];
      const num = (k) => { const v = new RegExp(`${k}:\\s*(-?[\\d.]+)`).exec(rest); return v ? v[1] : null; };
      const def = /default:\s*('([^']*)'|-?[\d.]+|true|false)/.exec(rest);
      const opts = /options:\s*\[([^\]]*)\]/.exec(rest)?.[1]?.replace(/'/g, '').replace(/\s+/g, '');
      const range = num('min') !== null && num('max') !== null ? ` ${num('min')}..${num('max')}` : opts ? ` ${opts.split(',').join('|')}` : ` (${p[2]})`;
      const d = def ? `, default ${def[2] ?? def[1]}` : '';
      return `${p[1]}${range}${d}`;
    });
    return { name: m[1], doc: `${desc}${params.length ? ` — ${params.join('; ')}` : ''}` };
  });
}

const list = (names) => names.map((n) => `  '${n}',`).join('\n');

async function generate() {
  const easingSrc = readCommitted(EASING_REL);
  const worldSrc = readCommitted(WORLD_REL);
  if (!easingSrc) throw new Error(`sync-engine-lists: cannot read ${EASING_REL}`);
  if (!worldSrc) throw new Error(`sync-engine-lists: cannot read ${WORLD_REL}`);
  const mediaSrc = readCommitted(MEDIA_REL);
  if (!mediaSrc) throw new Error(`sync-engine-lists: cannot read ${MEDIA_REL}`);
  const easings = await easingNames(easingSrc);
  const colors = worldColorPaths(worldSrc);
  const media = designMedia(mediaSrc);
  const filterSrc = readCommitted(FILTER_REL);
  if (!filterSrc) throw new Error(`sync-engine-lists: cannot read ${FILTER_REL}`);
  const filterList = filters(filterSrc);

  return `/**
 * GENERATED — DO NOT EDIT. Run \`bun run sync:engine-lists\`.
 *
 * Name lists the engine owns and the tool surface must offer exactly. See
 * scripts/sync-engine-lists.mjs for why each is generated.
 *
 * Source: FxTool ${engineRevision()}
 *   ${EASING_REL}  sha256: ${digest(easingSrc)}
 *   ${WORLD_REL}  sha256: ${digest(worldSrc)}
 *   ${MEDIA_REL}  sha256: ${digest(mediaSrc)}
 *   ${FILTER_REL}  sha256: ${digest(filterSrc)}
 */

/** ${easings.length} names: EASING_NAMES, the keys of the engine's easing table. Keyframes, masks, relations and the camera all resolve through it. */
export const ENGINE_EASING_NAMES = [
${list(easings)}
] as const;

/** ${colors.length} paths: WORLD_SCHEMA entries of kind 'color' — the world spec's colour fields. */
export const WORLD3D_COLOR_PATHS = [
${list(colors)}
] as const;

/** ${media.length} media: the keys of DesignMedia MEDIA. */
export const DESIGN_MEDIA = [
${list(media.map((e) => e.key))}
] as const;

/** The engine method that applies each medium that has one (MEDIA[key].apply). The others are refused by the engine, by name. */
export const DESIGN_MEDIA_APPLY: Readonly<Record<string, string>> = Object.freeze({
${media.filter((e) => e.apply).map((e) => `  ${e.key}: '${e.apply}',`).join('\n')}
});

/** ${filterList.length} filters: everything FilterSystem.js registers. */
export const FILTER_TYPES = [
${list(filterList.map((f) => f.name))}
] as const;

/** One line per filter: the engine's own description and parameter ranges. */
export const FILTER_DOCS: Readonly<Record<string, string>> = Object.freeze({
${filterList.map((f) => `  ${f.name}: ${JSON.stringify(f.doc)},`).join('\n')}
});
`;
}

async function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(FXTOOL)) {
    console.error(`sync-engine-lists: no FxTool checkout at ${FXTOOL}`);
    console.error('Set PP_FXTOOL_DIR, or check out FxTool beside this repo.');
    process.exit(0);
  }
  const wanted = await generate();
  const current = existsSync(OUT) ? readFileSync(OUT, 'utf8') : null;
  const count = (wanted.match(/^  '/gm) || []).length;
  if (current === wanted) {
    console.log(`✅ engine lists in sync (${count} names)`);
    process.exit(0);
  }
  if (check) {
    console.error('DRIFT: src/tools/engine-lists.ts differs from FxTool.');
    console.error('Run: bun run fix:engine-lists');
    process.exit(1);
  }
  writeFileSync(OUT, wanted);
  console.log(`✅ wrote engine lists (${count} names)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
