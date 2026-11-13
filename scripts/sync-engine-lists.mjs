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
 * - LINEAGE_KINDS. The provenance kinds core/Provenance.js accepts. The tool
 *   defaulted to 'derived', which is not one, so every record without an
 *   explicit kind was refused, and the valid kinds were documented nowhere.
 * - STYLED_SCENE_STYLES. The six looks core/StyledScene.js draws a styled
 *   scene in (STYLES), with each one's own line (STYLE_INFO). The engine
 *   resolves aliases ('watercolour', 'papercut') itself; the tool offers the
 *   canonical names.
 * - PATTERN_KINDS. The kinds core/Patterns.js KINDS accepts. pinepaper_pattern
 *   hand-copied two of four (phase_wave, stagger) and refused ring and orbit,
 *   which the engine always had.
 * - EXPRESSION_FUNCTIONS / EXPRESSION_CONSTANTS / EXPRESSION_REJECTED. The
 *   grammar of a time_expression formula (relations/expr-to-ir.js: FN1, FN2,
 *   COMPOSITE_ARITY, FNN, CONSTS, REJECT). An expression outside it parses to
 *   nothing and the relation does nothing, with success reported: an agent
 *   wrote Math.sin(...) from JavaScript habit and got no motion (#39). The
 *   tool documents the grammar from these and refuses an unknown name.
 * - RELATION_PARAM_KEYS. For each rule RelationRegistry.js registers itself,
 *   the params it declares plus every params.X its own block reads (internal
 *   _state keys left out). A relationOptions key outside that set is one the
 *   rule never looks at; the tool says so instead of accepting it silently
 *   (benchmark: "warn on unknown relation options"). A rule whose block cannot
 *   be bounded cleanly, or that declares nothing (event reactions take opaque
 *   params), is left out: no list means no warning, never a wrong one.
 * - RELATION_LOOP_PARAMS. The params RelationRegistry.js's relation loop reads on
 *   every relation (assoc.params.X), before any rule runs: a time window and
 *   its relatives. No rule's own block reads them, so RELATION_PARAM_KEYS alone
 *   called params.window "ignored" on a relation it was gating.
 * - ANIMATION_TYPES / ANIMATION_WAVEFORMS / ANIMATION_ORIGINS. The loop
 *   animations core/AnimationDriver.js switches on, and the waveform and
 *   origin a field motion (ripple, undulate) reads. animationType was checked
 *   against a hand-refreshed fixture that nothing compared with the engine,
 *   so FxTool #255 added ripple and undulate and the enum refused both.
 * - ANIMATION_OPTION_KEYS. Every params.X that PinePaper.animate(item, params)
 *   and AnimationDriver's checkAnimationOptions read. A batch animate op hands
 *   animationOptions to app.animate as they are, so a key outside this set is
 *   dropped (pinepaper_animate's own intensity / speed were, until the batch
 *   translated them); the op now says so. If animate ever passes params on
 *   whole to something else, the list could not be trusted, so this fails
 *   instead of writing it.
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
const PROVENANCE_REL = 'js/core/Provenance.js';
const STYLED_REL = 'js/core/StyledScene.js';
const PATTERNS_REL = 'js/core/Patterns.js';
const EXPR_REL = 'js/relations/expr-to-ir.js';
const RELATIONS_REL = 'js/RelationRegistry.js';
const ANIM_REL = 'js/core/AnimationDriver.js';
const PINEPAPER_REL = 'js/PinePaper.js';
const AURA_REL = 'js/ItemAuraSystem.js';

/** The body of a method or function `head(...) {`, brace-matched; null when it cannot be found. */
function blockAfter(src, head) {
  const at = src.search(head);
  if (at < 0) return null;
  let i = src.indexOf('{', at) + 1, depth = 1;
  while (depth && i < src.length) { const c = src[i++]; if (c === '{') depth++; else if (c === '}') depth--; }
  return depth ? null : src.slice(at, i);
}

/**
 * EFFECT TYPES: what app.applyEffect can apply. The particle effects are the effectDefs that
 * RelationRegistry.registerEffectRelations binds; the shader auras are the keys of ItemAuraSystem's
 * AURA_REGISTRY. A hand list and a stored fixture both went stale: #362 renamed the particle swirl
 * to orbit_swirl and added aurora, glitch and petals, and the schema refused all four.
 */
function effectTypes(relSrc, auraSrc) {
  const block = blockAfter(relSrc, /registerEffectRelations\s*\(/);
  if (!block) throw new Error('sync-engine-lists: registerEffectRelations not found in RelationRegistry.js');
  const particles = [...block.matchAll(/\{\s*name:\s*'([a-z_]+)'/g)].map((m) => m[1]);
  const regAt = auraSrc.search(/^const AURA_REGISTRY = \{/m);
  if (regAt < 0) throw new Error('sync-engine-lists: AURA_REGISTRY not found in ItemAuraSystem.js');
  const reg = blockAfter(auraSrc.slice(regAt), /AURA_REGISTRY = /);
  const auras = [...reg.matchAll(/^  ([a-z_]+):\s*\{/gm)].map((m) => m[1]);
  if (particles.length < 10 || auras.length < 4) throw new Error(`sync-engine-lists: effect lists look wrong (${particles.length} particle, ${auras.length} aura)`);
  return { particles, auras };
}

function animationOptionKeys(ppSrc, animSrc) {
  const animate = blockAfter(ppSrc, /\n  animate\(item, params\)\s*\{/);
  const check = blockAfter(animSrc, /export function checkAnimationOptions\(params[^)]*\)\s*\{/);
  if (!animate || !check) throw new Error('sync-engine-lists: cannot find PinePaper.animate(item, params) or checkAnimationOptions');
  // params handed on whole would be read somewhere this scan cannot see.
  const handedOn = [...animate.matchAll(/\bparams\b(?!\??\.)/g)].map((m) => animate.slice(Math.max(0, m.index - 30), m.index + 30))
    .filter((ctx) => !/animate\(item, params\)|params &&|checkAnimationOptions\(params\)/.test(ctx));
  if (handedOn.length) throw new Error(`sync-engine-lists: PinePaper.animate passes params on whole (${handedOn[0].trim()}); ANIMATION_OPTION_KEYS cannot be read from it`);
  const keys = new Set();
  for (const src of [animate, check]) for (const m of src.matchAll(/\bparams\??\.(\w+)/g)) keys.add(m[1]);
  return [...keys].sort();
}

function resolveRef() {
  for (const ref of [ENGINE_REF, 'HEAD']) {
    try {
      return { ref, sha: execFileSync('git', ['-C', FXTOOL, 'rev-parse', ref], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim() };
    } catch { /* try the next */ }
  }
  return null;
}

function readCommitted(rel) {
  const resolved = resolveRef();
  if (resolved) {
    try {
      return execFileSync('git', ['-C', FXTOOL, 'show', `${resolved.ref}:${rel}`], {
        encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch { /* absent at that ref */ }
  }
  const abs = join(FXTOOL, rel);
  return existsSync(abs) ? readFileSync(abs, 'utf8') : null;
}

function engineRevision() {
  const resolved = resolveRef();
  if (resolved) return `${resolved.ref} ${resolved.sha}`;
  if (existsSync(OUT)) {
    const m = readFileSync(OUT, 'utf8').match(/\* Source: FxTool ([^\n\r]+)/);
    if (m && !m[1].includes('unknown')) return m[1];
  }
  return 'origin/main 7ffe15dd7150e680437660a578b4c9a9500cf6bc';
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

function lineageKinds(src) {
  const m = /export const LINEAGE_KINDS\s*=\s*Object\.freeze\(\[([^\]]*)\]\)/.exec(src);
  if (!m) throw new Error(`sync-engine-lists: LINEAGE_KINDS not found in ${PROVENANCE_REL}`);
  const kinds = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  if (kinds.length === 0) throw new Error(`sync-engine-lists: LINEAGE_KINDS is empty in ${PROVENANCE_REL}`);
  return kinds;
}

function patternKinds(src) {
  const m = /const KINDS\s*=\s*Object\.freeze\(\[([^\]]*)\]\)/.exec(src);
  if (!m) throw new Error(`sync-engine-lists: KINDS not found in ${PATTERNS_REL}`);
  const kinds = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  if (kinds.length === 0) throw new Error(`sync-engine-lists: KINDS is empty in ${PATTERNS_REL}`);
  return kinds;
}

/** A frozen string list `export const NAME = Object.freeze([...])` in AnimationDriver.js. */
function frozenList(src, name) {
  const m = new RegExp(`export const ${name}\\s*=\\s*Object\\.freeze\\(\\[([^\\]]*)\\]\\)`).exec(src);
  if (!m) throw new Error(`sync-engine-lists: ${name} not found in ${ANIM_REL}`);
  const names = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  if (names.length === 0) throw new Error(`sync-engine-lists: ${name} is empty in ${ANIM_REL}`);
  return names;
}

function styledStyles(src) {
  const m = /export const STYLES\s*=\s*\[([^\]]*)\]/.exec(src);
  if (!m) throw new Error(`sync-engine-lists: STYLES not found in ${STYLED_REL}`);
  const names = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  const info = {};
  const block = /export const STYLE_INFO\s*=\s*\{([\s\S]*?)\n\};/.exec(src);
  if (block) for (const e of block[1].matchAll(/^\s*(\w+):\s*'([^']*)'/gm)) info[e[1]] = e[2];
  if (names.length === 0) throw new Error(`sync-engine-lists: STYLES is empty in ${STYLED_REL}`);
  return names.map((n) => ({ name: n, info: info[n] || '' }));
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
    const ranges = {};
    for (const p of block.matchAll(/^\s*([A-Za-z]\w*):\s*\{\s*type:\s*'number'([^}]*)\}/gm)) {
      const mn = /min:\s*(-?[\d.]+)/.exec(p[2]); const mx = /max:\s*(-?[\d.]+)/.exec(p[2]);
      if (mn && mx) ranges[p[1]] = [Number(mn[1]), Number(mx[1])];
    }
    return { name: m[1], doc: `${desc}${params.length ? ` — ${params.join('; ')}` : ''}`, ranges };
  });
}

const list = (names) => names.map((n) => `  '${n}',`).join('\n');

function expressionGrammar(src) {
  const set = (name) => {
    const m = new RegExp(`const ${name}\\s*=\\s*new Set\\(\\[([^\\]]*)\\]\\)`).exec(src);
    if (!m) throw new Error(`sync-engine-lists: ${name} not found in ${EXPR_REL}`);
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };
  const keys = (name) => {
    const m = new RegExp(`const ${name}\\s*=\\s*\\{([^}]*)\\}`).exec(src);
    if (!m) throw new Error(`sync-engine-lists: ${name} not found in ${EXPR_REL}`);
    return [...m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:/g)].map((x) => x[1]);
  };
  const arities = (name) => {
    const m = new RegExp(`const ${name}\\s*=\\s*\\{([^}]*)\\}`).exec(src);
    if (!m) throw new Error(`sync-engine-lists: ${name} not found in ${EXPR_REL}`);
    return [...m[1].matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(\d+)/g)].map((x) => [x[1], Number(x[2])]);
  };
  const functions = [
    ...set('FN1').map((n) => [n, 1]), ...set('FN2').map((n) => [n, 2]),
    ...arities('COMPOSITE_ARITY'), ...arities('FNN'),
  ];
  const constants = keys('CONSTS');
  const rejected = set('REJECT');
  if (!functions.length || !constants.length) throw new Error(`sync-engine-lists: empty expression grammar in ${EXPR_REL}`);
  return { functions, constants, rejected };
}

function relationLoopParams(src) {
  const keys = [...src.matchAll(/\bassoc\.params(?:\s*&&\s*assoc\.params)?\??\.([A-Za-z][A-Za-z0-9_]*)/g)].map((m) => m[1]);
  return [...new Set(keys)].sort();
}

/** The keys a rule block declares under params, plus every params.X it reads; null when it declares none. */
function ruleParamKeys(block) {
    const at = /params:\s*\{/.exec(block);
    if (!at) return null;
    let depth = 1, i = at.index + at[0].length;
    const start = i;
    while (depth && i < block.length) { if (block[i] === '{') depth++; else if (block[i] === '}') depth--; i++; }
    const body = block.slice(start, i - 1);
    const declared = new Set();
    for (let d = 0, k = 0; k < body.length; k++) {
      const c = body[k];
      if (c === '{' || c === '[' || c === '(') d++;
      else if (c === '}' || c === ']' || c === ')') d--;
      else if (d === 0 && /[A-Za-z_]/.test(c) && (k === 0 || !/[A-Za-z0-9_'"]/.test(body[k - 1]))) {
        const key = /^([A-Za-z_][A-Za-z0-9_]*)\s*:/.exec(body.slice(k));
        if (key) { declared.add(key[1]); k += key[0].length - 1; }
      }
    }
    if (!declared.size) return null;
    const reads = [...block.matchAll(/params\??\.([A-Za-z][A-Za-z0-9_]*)/g)].map((x) => x[1]);
    return [...new Set([...declared, ...reads])].sort();
}

/**
 * A rule's params, by name. Two shapes: written inline, `this.registerRule('x', { params: {…} })`, and
 * registered by reference, `this.registerRule('x', xRule)` where xRule is `export const xRule = { params }`
 * in a js/relations module the registry imports. The second shape was not read, so phase_wave, ring_forming,
 * flock, on_complete, at_beat, camera_tracks, soundtrack_cue, then and after had no key list, and a param
 * they never read (flock duration) was stored with no warning (tester's 1.6.34 list).
 */
function relationParamKeys(src) {
  const out = [];
  const re = /\n(\s*)this\.registerRule\('([a-z_0-9]+)'/g;
  let m;
  while ((m = re.exec(src))) {
    const [, indent, name] = m;
    const close = src.indexOf(`\n${indent}});`, m.index + 1);
    if (close < 0 || close - m.index > 30000) continue;
    const keys = ruleParamKeys(src.slice(m.index, close));
    if (keys) out.push([name, keys]);
  }
  const have = new Set(out.map(([n]) => n));
  const modules = new Map();
  for (const im of src.matchAll(/import\s*\{([^}]*)\}\s*from\s*'\.\/(relations\/[A-Za-z0-9_/-]+\.js)'/g)) {
    for (const id of im[1].split(',').map((x) => x.trim().split(/\s+as\s+/).pop()).filter(Boolean)) modules.set(id, `js/${im[2]}`);
  }
  for (const r of src.matchAll(/this\.registerRule\('([a-z_0-9]+)',\s*(?:typeof\s+([A-Za-z_]\w*)\s*!==\s*'undefined'\s*\?\s*)?([A-Za-z_]\w*)\s*[,)]/g)) {
    const [, name, , ident] = r;
    if (have.has(name) || !modules.has(ident)) continue;
    const mod = readCommitted(modules.get(ident));
    if (!mod) throw new Error(`sync-engine-lists: cannot read ${modules.get(ident)} for ${name}`);
    const at = new RegExp(`export const ${ident}\\s*=\\s*\\{`).exec(mod);
    if (!at) throw new Error(`sync-engine-lists: ${ident} is not an object literal in ${modules.get(ident)}`);
    let depth = 1, i = at.index + at[0].length;
    while (depth && i < mod.length) { if (mod[i] === '{') depth++; else if (mod[i] === '}') depth--; i++; }
    const keys = ruleParamKeys(mod.slice(at.index, i));
    if (keys) { out.push([name, keys]); have.add(name); }
  }
  if (out.length < 20) throw new Error(`sync-engine-lists: only ${out.length} relation rules read from ${RELATIONS_REL}`);
  return out.sort((a, b) => a[0].localeCompare(b[0]));
}

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
  const provSrc = readCommitted(PROVENANCE_REL);
  if (!provSrc) throw new Error(`sync-engine-lists: cannot read ${PROVENANCE_REL}`);
  const lineage = lineageKinds(provSrc);
  const styledSrc = readCommitted(STYLED_REL);
  if (!styledSrc) throw new Error(`sync-engine-lists: cannot read ${STYLED_REL}`);
  const styled = styledStyles(styledSrc);
  const patternsSrc = readCommitted(PATTERNS_REL);
  if (!patternsSrc) throw new Error(`sync-engine-lists: cannot read ${PATTERNS_REL}`);
  const patterns = patternKinds(patternsSrc);
  const exprSrc = readCommitted(EXPR_REL);
  if (!exprSrc) throw new Error(`sync-engine-lists: cannot read ${EXPR_REL}`);
  const expr = expressionGrammar(exprSrc);
  const relSrc = readCommitted(RELATIONS_REL);
  if (!relSrc) throw new Error(`sync-engine-lists: cannot read ${RELATIONS_REL}`);
  const relKeys = relationParamKeys(relSrc);
  const animSrc = readCommitted(ANIM_REL);
  if (!animSrc) throw new Error(`sync-engine-lists: cannot read ${ANIM_REL}`);
  const anim = { types: frozenList(animSrc, 'ANIMATION_TYPES'), waveforms: frozenList(animSrc, 'ANIMATION_WAVEFORMS'), origins: frozenList(animSrc, 'ANIMATION_ORIGINS') };
  const ppSrc = readCommitted(PINEPAPER_REL);
  if (!ppSrc) throw new Error(`sync-engine-lists: cannot read ${PINEPAPER_REL}`);
  const animKeys = animationOptionKeys(ppSrc, animSrc);
  const auraSrc = readCommitted(AURA_REL);
  if (!auraSrc) throw new Error(`sync-engine-lists: cannot read ${AURA_REL}`);
  const effects = effectTypes(relSrc, auraSrc);

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
 *   ${PROVENANCE_REL}  sha256: ${digest(provSrc)}
 *   ${STYLED_REL}  sha256: ${digest(styledSrc)}
 *   ${PATTERNS_REL}  sha256: ${digest(patternsSrc)}
 *   ${EXPR_REL}  sha256: ${digest(exprSrc)}
 *   ${RELATIONS_REL}  sha256: ${digest(relSrc)}
 *   ${ANIM_REL}  sha256: ${digest(animSrc)}
 *   ${PINEPAPER_REL}  sha256: ${digest(ppSrc)}
 *   ${AURA_REL}  sha256: ${digest(auraSrc)}
 */

/** ${effects.particles.length} particle effects (RelationRegistry.registerEffectRelations) then ${effects.auras.length} shader auras (ItemAuraSystem AURA_REGISTRY): everything app.applyEffect applies. */
export const ENGINE_EFFECT_TYPES = [
${list([...effects.particles, ...effects.auras])}
] as const;

/** The shader auras alone. */
export const ENGINE_AURA_TYPES = [
${list(effects.auras)}
] as const;

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

/** Numeric parameter ranges per filter, [min, max], as the engine registers them. */
export const FILTER_PARAM_RANGES: Readonly<Record<string, Readonly<Record<string, readonly [number, number]>>>> = Object.freeze({
${filterList.map((f) => `  ${f.name}: { ${Object.entries(f.ranges).map(([k, [a, b]]) => `${k}: [${a}, ${b}]`).join(', ')} },`).join('\n')}
});

/** ${lineage.length} kinds: LINEAGE_KINDS, what provenance record accepts. */
export const LINEAGE_KINDS = [
${list(lineage)}
] as const;

/** ${styled.length} styles: STYLES, the looks a styled scene is drawn in. */
export const STYLED_SCENE_STYLES = [
${list(styled.map((x) => x.name))}
] as const;

/** One line per styled-scene style: the engine's STYLE_INFO. */
export const STYLED_SCENE_STYLE_INFO: Readonly<Record<string, string>> = Object.freeze({
${styled.map((x) => `  ${x.name}: ${JSON.stringify(x.info)},`).join('\n')}
});

/** ${patterns.length} kinds: Patterns.js KINDS, what pinepaper_pattern can create. */
export const PATTERN_KINDS = [
${list(patterns)}
] as const;

/** ${expr.functions.length} functions a time_expression formula may call, each with its argument count (expr-to-ir.js FN1 = 1, FN2 = 2, COMPOSITE_ARITY, FNN). */
export const EXPRESSION_FUNCTION_ARITY: Readonly<Record<string, number>> = Object.freeze({
${expr.functions.map(([n, a]) => `  ${n}: ${a},`).join('\n')}
});

/** ${expr.constants.length} constants a time_expression formula may name (expr-to-ir.js CONSTS); t and v are its variables. */
export const EXPRESSION_CONSTANTS = [
${list(expr.constants)}
] as const;

/** ${relKeys.length} relation rules: the params each declares or reads (RelationRegistry.js). A key outside its list is never read. */
export const RELATION_PARAM_KEYS: Readonly<Record<string, readonly string[]>> = Object.freeze({
${relKeys.map(([n, ks]) => `  ${n}: [${ks.map((k) => `'${k}'`).join(', ')}],`).join('\n')}
});

/** Read by RelationRegistry.js's relation loop on every relation, whatever its rule (assoc.params.X). */
export const RELATION_LOOP_PARAMS = [
${list(relationLoopParams(relSrc))}
] as const;

/** Names the grammar refuses outright (expr-to-ir.js REJECT): not deterministic. */
export const EXPRESSION_REJECTED = [
${list(expr.rejected)}
] as const;

/** ${anim.types.length} loop animations: AnimationDriver.js ANIMATION_TYPES, the types its switch draws. */
export const ANIMATION_TYPES = [
${list(anim.types)}
] as const;

/** ${anim.waveforms.length} cycle shapes a field motion (ripple, undulate) reads: ANIMATION_WAVEFORMS. */
export const ANIMATION_WAVEFORMS = [
${list(anim.waveforms)}
] as const;

/** ${anim.origins.length} points a field motion starts from on a group: ANIMATION_ORIGINS. */
export const ANIMATION_ORIGINS = [
${list(anim.origins)}
] as const;

/** ${animKeys.length} option keys app.animate reads (PinePaper.animate + checkAnimationOptions). */
export const ANIMATION_OPTION_KEYS: readonly string[] = Object.freeze([
${list(animKeys)}
]);

/** One line per filter: the engine's own description and parameter ranges. */
export const FILTER_DOCS: Readonly<Record<string, string>> = Object.freeze({
${filterList.map((f) => `  ${f.name}: ${JSON.stringify(f.doc)},`).join('\n')}
});
`;
}

async function main() {
  const check = process.argv.includes('--check');
  let fxtoolAccessible = false;
  try {
    if (existsSync(FXTOOL)) {
      readFileSync(join(FXTOOL, EASING_REL), 'utf8');
      fxtoolAccessible = true;
    }
  } catch {
    fxtoolAccessible = false;
  }
  if (!fxtoolAccessible) {
    console.warn(`[sync-engine-lists] no accessible FxTool checkout at ${FXTOOL} — skipping check`);
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
