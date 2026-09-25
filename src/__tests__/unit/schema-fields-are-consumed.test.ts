/**
 * A parameter the schema accepts and nothing reads is a lie the tool tells.
 *
 * `pinepaper_add_ports` advertised `ports` and `count`; the engine takes a type
 * string and has no per-port placement, so both were parsed, validated,
 * described in the tool schema — and dropped. A caller who set them believed
 * something about the result that was not true, and nothing said otherwise.
 *
 * That one was found by a tester hitting it. This finds the rest mechanically:
 * every field declared on an *InputSchema must be READ by something other than
 * the schema that declares it and the description that advertises it.
 *
 * Spread counts as a read — several emitters do `const { action, ...rest }` and
 * pass everything through, so a field can be consumed without ever being named.
 * That is why this walks real consumer files rather than pattern-matching the
 * emitter: a narrower check reported fifteen false positives on one schema.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dir, '..', '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== '__tests__' && e.name !== 'vendor') walk(f, out);
    } else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) out.push(f);
  }
  return out;
}

/**
 * Every field declared on an input schema, by schema name.
 *
 * Brace-matched, not `[\s\S]*?\n\}\)`. That pattern could not match an
 * EMPTY object — `z.object({})` on one line has no newline before its close —
 * so it ran past the schema it was reading and swallowed the next one:
 * GetHighlightedMapRegionsInputSchema, which declares nothing at all, was
 * credited with GlobeEnableInputSchema's `momentum` and `showOcean`, and both
 * sat in the allowance below under a schema that does not have them. A parser
 * that mis-attributes fields makes every verdict about them meaningless.
 */
export function declaredFields(
  src = readFileSync(join(SRC, 'types', 'schemas.ts'), 'utf8'),
): Array<{ schema: string; fields: string[] }> {
  const out: Array<{ schema: string; fields: string[] }> = [];
  for (const m of src.matchAll(/export const (\w*InputSchema)\s*=\s*z\.object\(/g)) {
    const open = src.indexOf('{', m.index + m[0].length - 1);
    if (open === -1) continue;
    let depth = 0;
    let close = -1;
    for (let i = open; i < src.length; i++) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}' && --depth === 0) { close = i; break; }
    }
    if (close === -1) continue;
    const body = src.slice(open + 1, close);
    out.push({ schema: m[1], fields: [...body.matchAll(/^\s{2}(\w+):\s*z\./gm)].map((x) => x[1]) });
  }
  return out;
}

/**
 * Everything that could READ a field — not the declaration, not the advert,
 * and NOT A COMMENT.
 *
 * Comments are stripped because a text search cannot tell mention from use. A
 * comment added here listing loadMap's own destructured options — showOcean
 * among them — was enough to mark `showOcean` consumed, which is the guard
 * marking a field safe because someone wrote its name in prose about it.
 *
 * The `[^:]` guard keeps `http://` intact.
 */
function consumerSource(): string {
  return walk(SRC)
    .filter((f) => !f.endsWith(join('types', 'schemas.ts')) && !f.endsWith(join('tools', 'definitions.ts')))
    // Generated DATA, not code: the engine vocabulary's description prose
    // mentions words like "gait", which would read here as a field consumed.
    .filter((f) => !f.endsWith(join('ontology', 'upstream-vocabulary.ts')))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Fields this guard cannot SEE, because an emitter spreads the whole input.
 *
 * `generateStick`, `generateWorldTour`, `generateGlobeEnable` and
 * `generateTourItem` all JSON.stringify their validated input straight into an
 * engine call, so the field names never appear on this side. That is the limit
 * of a text search, not evidence of a bug — and calling it one was the mistake
 * this list used to make.
 *
 * Every entry below was checked against FxTool origin/main and IS read:
 *   stick     opts.poseAt (2 sites), opts.trouser, opts.withHair,
 *             opts.groundY, opts.surfaceY, and the vocabulary added when
 *             export/long-form-streaming landed: opts.gait (checked against
 *             GAIT_NAMES), opts.gaitSeconds, opts.gaitFrom, opts.sequenceFrom
 *             and opts.sequenceSeconds, all read in stickFigure's gait and
 *             sequence blocks
 *   worldTour options.dwell, options.highlightColors, options.showLabels,
 *             options.labelColor
 *   globe     enableGlobeMode destructures { momentum, showOcean } and uses
 *             both — _globeMomentum and _reRenderGlobe(showOcean)
 *   tourItem  options.dwell, in the shared waypoint timing
 *
 * These are exemptions with provenance, not debt. What a text search genuinely
 * cannot catch is worse, and is not fixed by a list: four stick fields were
 * spread through and MEANT something the engine does not — 'right' tested
 * equal to neither arm of an 'L'|'R' comparison, so every prop went to the
 * left hand. A name appearing is not a name agreeing. See
 * stick-contract.test.ts, and prefer a behavioural pin to an entry here.
 */
const SPREAD_THROUGH_VERIFIED: Readonly<Record<string, readonly string[]>> = Object.freeze({
  StickInputSchema: ['poseAt', 'trouser', 'withHair', 'groundY', 'surfaceY', 'gait', 'gaitSeconds', 'gaitFrom', 'sequenceFrom', 'sequenceSeconds'],
  WorldTourInputSchema: ['dwell', 'highlightColors', 'showLabels', 'labelColor'],
  GlobeEnableInputSchema: ['momentum', 'showOcean'],
  TourItemInputSchema: ['dwell'],
});

/**
 * Fields accepted and read by nothing at all.
 *
 * EMPTY, and that is the point — it is not decoration. It held
 * LoadMapInputSchema.hoverStroke, which FxTool documents in two spec files and
 * implements in none; loadMap now strips it and names it in the result instead
 * of passing it to something that ignores it.
 *
 * A RATCHET: entries may be deleted, never added. Fixing one means wiring it
 * through, refusing it by name, or reporting it in the result — adding it here
 * is not a fix.
 */
const KNOWN_UNCONSUMED: Readonly<Record<string, readonly string[]>> = Object.freeze({});

describe('every parameter a tool accepts is read by something', () => {
  const consumers = consumerSource();
  const schemas = declaredFields();

  it('scans a real surface', () => {
    expect(schemas.length).toBeGreaterThan(100);
    expect(schemas.reduce((n, s) => n + s.fields.length, 0)).toBeGreaterThan(400);
  });

  it('no field is accepted and then read by nothing', () => {
    const unconsumed: string[] = [];
    for (const { schema, fields } of schemas) {
      const allowed = [...(KNOWN_UNCONSUMED[schema] ?? []), ...(SPREAD_THROUGH_VERIFIED[schema] ?? [])];
      for (const f of fields) {
        if (allowed.includes(f)) continue;
        if (new RegExp(`\\b${f}\\b`).test(consumers)) continue;
        unconsumed.push(`${schema}.${f}`);
      }
    }
    expect(unconsumed.sort()).toEqual([]);
  });

  it('an empty z.object({}) does not swallow the next schema', () => {
    // The regression that mis-filed momentum/showOcean. `z.object({})` has no
    // newline before its close, so the old non-greedy pattern ran past it and
    // credited the NEXT schema's fields to the empty one.
    const src = [
      'export const EmptyInputSchema = z.object({}).describe(\'nothing\');',
      '',
      'export const NextInputSchema = z.object({',
      '  momentum: z.boolean().optional(),',
      '  showOcean: z.boolean().optional(),',
      '});',
    ].join('\n');
    const parsed = declaredFields(src);
    expect(parsed.find((p) => p.schema === 'EmptyInputSchema')?.fields).toEqual([]);
    expect(parsed.find((p) => p.schema === 'NextInputSchema')?.fields).toEqual(['momentum', 'showOcean']);
  });

  it('reads nested objects without ending the schema early', () => {
    const src = [
      'export const NestedInputSchema = z.object({',
      '  at: z.object({ x: z.number() }).optional(),',
      '  after: z.string().optional(),',
      '});',
    ].join('\n');
    expect(declaredFields(src)[0].fields).toEqual(['at', 'after']);
  });

  it('the allowance only ever shrinks', () => {
    const stale: string[] = [];
    for (const [schema, fields] of Object.entries({ ...KNOWN_UNCONSUMED, ...SPREAD_THROUGH_VERIFIED })) {
      const declared = schemas.find((s) => s.schema === schema)?.fields ?? [];
      for (const f of fields) {
        // Either it is now read, or it is gone from the schema: both are fixes,
        // and both mean the entry should be deleted rather than left sitting.
        if (!declared.includes(f) || new RegExp(`\\b${f}\\b`).test(consumers)) stale.push(`${schema}.${f}`);
      }
    }
    expect(stale, 'these are resolved — delete them from the list that names them').toEqual([]);
  });
});
