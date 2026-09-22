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

/** Every field declared on an input schema, by schema name. */
function declaredFields(): Array<{ schema: string; fields: string[] }> {
  const src = readFileSync(join(SRC, 'types', 'schemas.ts'), 'utf8');
  const out: Array<{ schema: string; fields: string[] }> = [];
  for (const m of src.matchAll(/export const (\w*InputSchema)\s*=\s*z\.object\(\{([\s\S]*?)\n\}\)/g)) {
    out.push({ schema: m[1], fields: [...m[2].matchAll(/^\s{2}(\w+):\s*z\./gm)].map((x) => x[1]) });
  }
  return out;
}

/** Everything that could READ a field — not the declaration, not the advert. */
function consumerSource(): string {
  return walk(SRC)
    .filter((f) => !f.endsWith(join('types', 'schemas.ts')) && !f.endsWith(join('tools', 'definitions.ts')))
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
}

/**
 * Fields accepted and read by nothing, at the time this guard was written.
 *
 * Every entry is a parameter a caller can set and be quietly ignored on. Same
 * ratchet as the engine-surface lists: it may only shrink, a fixed entry must
 * be DELETED rather than left, and a new one fails outright. Fixing one means
 * either wiring it through or refusing it by name the way add_ports now does —
 * adding it here is not a fix.
 */
const KNOWN_UNCONSUMED: Readonly<Record<string, readonly string[]>> = Object.freeze({
  // SPREAD-THROUGH, AND VERIFIED AT THE FAR END. generateStick does
  // `const { action, ...rest }`, so these never appear by name on this side —
  // which is the limit of what this guard can see, not evidence of a bug. Each
  // was checked against FxTool origin/main and IS read: opts.poseAt (2 sites),
  // opts.trouser, opts.withHair, opts.groundY, opts.surfaceY. `propSide` left
  // this list by being named in the emitter, which it now is because 'right'
  // had to be normalised to the 'R' the engine tests against.
  //
  // They sit here because the guard cannot prove it mechanically, not because
  // they are broken. What the guard genuinely could not see is worse and is
  // fixed elsewhere: four stick fields were spread through and MEANT something
  // the engine does not — see stick-contract.test.ts. A name appearing is not
  // the same as a name agreeing.
  StickInputSchema: ['poseAt', 'trouser', 'withHair', 'groundY', 'surfaceY'],
  WorldTourInputSchema: ['dwell', 'highlightColors', 'showLabels', 'labelColor'],
  GetHighlightedMapRegionsInputSchema: ['momentum', 'showOcean'],
  LoadMapInputSchema: ['hoverStroke'],
  TourItemInputSchema: ['dwell'],
});

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
      const allowed = KNOWN_UNCONSUMED[schema] ?? [];
      for (const f of fields) {
        if (allowed.includes(f)) continue;
        if (new RegExp(`\\b${f}\\b`).test(consumers)) continue;
        unconsumed.push(`${schema}.${f}`);
      }
    }
    expect(unconsumed.sort()).toEqual([]);
  });

  it('the allowance only ever shrinks', () => {
    const stale: string[] = [];
    for (const [schema, fields] of Object.entries(KNOWN_UNCONSUMED)) {
      const declared = schemas.find((s) => s.schema === schema)?.fields ?? [];
      for (const f of fields) {
        // Either it is now read, or it is gone from the schema: both are fixes,
        // and both mean the entry should be deleted rather than left sitting.
        if (!declared.includes(f) || new RegExp(`\\b${f}\\b`).test(consumers)) stale.push(`${schema}.${f}`);
      }
    }
    expect(stale, 'these are resolved — delete them from KNOWN_UNCONSUMED').toEqual([]);
  });
});
