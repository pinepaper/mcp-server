/**
 * The shape documentation is the only schema a model ever sees.
 *
 * `pinepaper_create_item` takes `properties` as a free-form object. Nothing
 * validates it against the shape, nothing strips an unknown key, and
 * `app.create` returns an item whatever you passed — so a parameter the engine
 * does not read is dropped in total silence, and a parameter the engine DOES
 * read is unusable if nobody wrote it down. The prose in definitions.ts is
 * load-bearing in both directions, and until this guard existed it was checked
 * by nobody.
 *
 * B10 is what that costs. `triangle` was documented as taking `color` alone
 * while the engine read width, height, `angles` and `kind` and built the shape
 * by the law of sines; `polygon`'s `points` accepted an explicit vertex list;
 * ellipse and heart were `color`-only. Four shapes, no bug report possible —
 * every call succeeded — just models hand-building triangles out of paths.
 *
 * So: for every registered shape, each `config.*` key its `create` reads must
 * be reachable from something the docs name, and every property the docs name
 * must survive `create()`. The snapshot is generated from FxTool `origin/main`
 * by scripts/sync-shape-params.mjs, so this tracks the engine users run.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ACCEPTED_CREATE_PARAMS,
  CONFIG_KEY_SOURCES,
  SHAPE_CONFIG_READS,
  UNIVERSAL_CONFIG_KEYS,
} from '../../tools/shape-params.js';

const DEFINITIONS = join(import.meta.dir, '..', '..', 'tools', 'definitions.ts');

/**
 * Shapes whose documented entry still does not reach every key they read.
 *
 * A RATCHET: entries may be deleted, never added. Fixing one means REMOVING
 * its line, not setting it to an empty list — a zero that stays behind is how
 * a list like this quietly stops meaning anything.
 */
const KNOWN_DOC_GAPS: Readonly<Record<string, readonly string[]>> = {};

/**
 * Config keys no caller can reach: registryConfig never forwards a `params.*`
 * into them AND no other branch of `create()` reads that name either.
 *
 * That second clause is what keeps this list honest. Twenty-two shapes read
 * `config.label`, which registryConfig does not forward — but `create()` does
 * read `params.label`, one branch up, and hands it to `_createLabeledItem`,
 * which wraps the shape in its own text item. Labels work; the shapes' own
 * label path is simply not the route taken. Reporting those as broken would be
 * the guard crying wolf over working code, so membership in
 * ACCEPTED_CREATE_PARAMS excuses a key — mechanically, not by assertion.
 *
 * What survives that test is genuinely dead: `labelPosition` is read by these
 * shapes and written by nothing. An ENGINE gap, not a doc gap — documenting it
 * would promise something that cannot work. Raised with FxTool; listed so the
 * set cannot grow unnoticed.
 *
 * A RATCHET, on the same terms as above: delete, never zero out.
 */
const KNOWN_UNREACHABLE: Readonly<Record<string, readonly string[]>> = {
  data: ['labelPosition'],
  database: ['labelPosition'],
  decision: ['labelPosition'],
  document: ['labelPosition'],
  preparation: ['labelPosition'],
  process: ['labelPosition'],
  'speech-bubble': ['labelPosition'],
  'speech-bubble-square': ['labelPosition'],
  terminal: ['labelPosition'],
  'uml-usecase': ['labelPosition'],
};

/**
 * Registered shapes with no ITEM TYPES entry, because they belong to
 * pinepaper_create_diagram_shape's vocabulary instead. Listed so that a NEW
 * registered shape landing undocumented fails rather than being skipped.
 */
const KNOWN_UNDOCUMENTED: readonly string[] = [
  'cloud',
  'data',
  'database',
  'decision',
  'document',
  'preparation',
  'process',
  'server',
  'terminal',
  'uml-actor',
  'uml-class',
  'uml-usecase',
];

interface Entry {
  id: string;
  /** The entry's own lines PLUS the preamble of the block it sits in. */
  doc: string;
}

/**
 * Parse the ITEM TYPES region into one entry per documented shape.
 *
 * A shape's documentation is its own `- id: …` line and any indented
 * continuation, plus the prose paragraph introducing its block — the speech
 * bubbles state "All take width, height and color" once above the list rather
 * than repeating it eight times, and a parser that ignored that would report
 * eight false gaps.
 */
export function parseItemTypeEntries(src = readFileSync(DEFINITIONS, 'utf8')): Entry[] {
  const start = src.indexOf('ITEM TYPES:');
  const end = src.indexOf('PATH FOR CUSTOM SHAPES:', start);
  if (start === -1 || end === -1) throw new Error('ITEM TYPES region not found in definitions.ts');

  const lines = src.slice(start, end).split('\n');
  const entries: Entry[] = [];
  let preamble: string[] = [];
  let inList = false;
  let current: { id: string; lines: string[]; preamble: string } | null = null;

  const flush = (): void => {
    if (current) entries.push({ id: current.id, doc: `${current.preamble}\n${current.lines.join('\n')}` });
    current = null;
  };

  for (const line of lines) {
    const item = /^-\s+([A-Za-z0-9-]+):/.exec(line);
    if (item) {
      flush();
      inList = true;
      current = { id: item[1], lines: [line], preamble: preamble.join('\n') };
      continue;
    }
    if (/^\s+\S/.test(line) && current) {
      current.lines.push(line);
      continue;
    }
    // A non-indented, non-list line after a list closes the block and starts
    // the next one's preamble.
    if (line.trim() !== '') {
      if (inList) {
        flush();
        preamble = [];
        inList = false;
      }
      preamble.push(line);
    }
  }
  flush();
  return entries;
}

/** Does this documentation name `param` as something the caller can pass? */
function mentions(doc: string, param: string): boolean {
  return new RegExp(`\\b${param}\\b`).test(doc);
}

const entries = parseItemTypeEntries();
const documented = new Map(entries.map((e) => [e.id, e.doc]));

describe('shape docs match what the engine reads', () => {
  it('reads a real snapshot and a real set of documented shapes', () => {
    // Liveness. Every assertion below is vacuously true against an empty
    // parse, which is the failure mode of the guard this one replaces.
    expect(Object.keys(SHAPE_CONFIG_READS).length).toBeGreaterThan(20);
    expect(ACCEPTED_CREATE_PARAMS.length).toBeGreaterThan(20);
    expect(entries.length).toBeGreaterThan(20);
    expect(documented.has('triangle')).toBe(true);
    expect(SHAPE_CONFIG_READS.triangle).toContain('kind');
  });

  it('every key a shape reads is reachable from its documentation', () => {
    const gaps: Record<string, string[]> = {};
    for (const [id, keys] of Object.entries(SHAPE_CONFIG_READS)) {
      const doc = documented.get(id);
      if (doc === undefined) continue; // no entry at all — KNOWN_UNDOCUMENTED below
      const missing: string[] = [];
      for (const key of keys) {
        if (UNIVERSAL_CONFIG_KEYS.includes(key)) continue;
        const sources = CONFIG_KEY_SOURCES[key];
        // No params feed this key at all — an engine gap, asserted separately.
        if (!sources || sources.length === 0) continue;
        if (!sources.some((p) => mentions(doc, p))) missing.push(key);
      }
      const allowed = KNOWN_DOC_GAPS[id] ?? [];
      const unexcused = missing.filter((k) => !allowed.includes(k));
      if (unexcused.length > 0) gaps[id] = unexcused;
    }
    expect(gaps).toEqual({});
  });

  it('every documented property survives create()', () => {
    // The other direction: a property named in a `(properties: …)` list that
    // create() never reads is worse than an omission, because the caller
    // writes it, sees success, and never learns it was thrown away.
    //
    // SCOPE, so nobody trusts this further than it goes: only `(properties: …)`
    // lists are checked. A claim made in a block's PREAMBLE prose is on the
    // honour system — "all of them also accept cornerRadius" was written here
    // and was wrong for two of the eight bubbles, and this test was silent.
    // Preamble claims that name specific shapes have to be checked by hand
    // against SHAPE_CONFIG_READS.
    const invented: Record<string, string[]> = {};
    for (const { id, doc } of entries) {
      if (!(id in SHAPE_CONFIG_READS)) continue; // not a registry-backed shape
      const listed = /\(properties:\s*([^)]*)\)/s.exec(doc);
      if (!listed) continue;
      const bad = listed[1]
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^[A-Za-z_]\w*$/.test(s))
        .filter((s) => !ACCEPTED_CREATE_PARAMS.includes(s));
      if (bad.length > 0) invented[id] = bad;
    }
    expect(invented).toEqual({});
  });

  it('the unreachable-key list is exactly what the engine cannot wire', () => {
    // Keys a shape reads that registryConfig has no `params.*` for. Nothing
    // the docs can do about these; the point is that the set cannot GROW
    // without someone noticing.
    const unreachable: Record<string, string[]> = {};
    for (const [id, keys] of Object.entries(SHAPE_CONFIG_READS)) {
      const dead = keys.filter(
        (k) =>
          !UNIVERSAL_CONFIG_KEYS.includes(k) &&
          (CONFIG_KEY_SOURCES[k]?.length ?? 0) === 0 &&
          // …and no other branch of create() reads the name either.
          !ACCEPTED_CREATE_PARAMS.includes(k),
      );
      if (dead.length > 0) unreachable[id] = dead;
    }
    expect(unreachable).toEqual(KNOWN_UNREACHABLE as Record<string, string[]>);
  });

  it('every registered shape has an entry, or is on the list', () => {
    // Without this, a shape FxTool registers tomorrow that nobody documents is
    // B10 again and the guard above says nothing — it skips what it cannot
    // find. The flowchart / UML / network ids are reached through
    // pinepaper_create_diagram_shape, which documents its own shapeType
    // vocabulary, so they are absent from ITEM TYPES by design rather than by
    // omission. A RATCHET: delete, never extend.
    const undocumented = Object.keys(SHAPE_CONFIG_READS)
      .filter((id) => !documented.has(id))
      .sort();
    expect(undocumented).toEqual([...KNOWN_UNDOCUMENTED].sort());
  });

  it('the ratchets only shrink', () => {
    // A fixed entry must be DELETED. Leaving it behind as an empty list turns
    // the ratchet into decoration.
    for (const [id, keys] of Object.entries(KNOWN_DOC_GAPS)) {
      expect(keys.length, `KNOWN_DOC_GAPS.${id} is empty — delete the entry`).toBeGreaterThan(0);
      expect(SHAPE_CONFIG_READS[id], `KNOWN_DOC_GAPS.${id} names no registered shape`).toBeDefined();
    }
    for (const [id, keys] of Object.entries(KNOWN_UNREACHABLE)) {
      expect(keys.length, `KNOWN_UNREACHABLE.${id} is empty — delete the entry`).toBeGreaterThan(0);
    }
  });
});

describe('the parser itself', () => {
  it('attaches a block preamble to every entry in that block', () => {
    const src = [
      'ITEM TYPES:',
      '- circle: Circular shape (properties: radius, color)',
      '',
      'SPEECH SHAPES — all take width, height and color:',
      '- speech-bubble: Classic bubble.',
      '- thought-bubble: Cloud-like bubble.',
      '',
      'PATH FOR CUSTOM SHAPES:',
    ].join('\n');
    const parsed = parseItemTypeEntries(src);
    expect(parsed.map((e) => e.id)).toEqual(['circle', 'speech-bubble', 'thought-bubble']);
    // The preamble reaches BOTH bubbles and does not leak onto the circle.
    expect(parsed[1].doc).toContain('width');
    expect(parsed[2].doc).toContain('width');
    expect(parsed[0].doc).not.toContain('SPEECH SHAPES');
  });

  it('keeps indented continuation lines with their entry', () => {
    const src = [
      'ITEM TYPES:',
      '- triangle: Triangular shape (properties: width, height, color)',
      "  Also takes kind: 'right' or exact interior angles.",
      '- circle: Circular shape (properties: radius, color)',
      'PATH FOR CUSTOM SHAPES:',
    ].join('\n');
    const parsed = parseItemTypeEntries(src);
    expect(parsed[0].doc).toContain('kind');
    expect(parsed[1].doc).not.toContain('kind');
  });
});
