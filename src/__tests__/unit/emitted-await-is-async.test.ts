/**
 * An emitted `await` inside a SYNCHRONOUS IIFE is a syntax error, and TypeScript
 * cannot see it.
 *
 * The emitted code lives in template literals, so `tsc` type-checks the string
 * and not the JavaScript inside it. A sync `(function(){ ... await ... })()`
 * compiles cleanly here and fails to parse in the browser — the whole block
 * does nothing, and the error names a syntax problem in code the caller never
 * wrote.
 *
 * It has happened twice: `pinepaper_execute_custom_code` wrapped the caller's
 * snippet in a sync IIFE so any awaiting snippet never parsed, and
 * `applyTextStyle` gained an `await app.ensureFontsLoaded()` inside one. Both
 * were found by reading rather than by a gate, which is what this replaces.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dir, '..', '..');

function emitterFiles(dir = SRC, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const f = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== '__tests__' && e.name !== 'vendor') emitterFiles(f, out);
    } else if (e.name.endsWith('.ts') && !e.name.endsWith('.test.ts')) out.push(f);
  }
  return out;
}

/** Emitted IIFEs that contain `await` but are not declared async. */
function syncIifesWithAwait(): string[] {
  const bad: string[] = [];
  for (const file of emitterFiles()) {
    const src = readFileSync(file, 'utf8');
    // Each emitted IIFE, with its own body up to the matching close.
    for (const m of src.matchAll(/\((async\s+)?function\s*\(\s*\)\s*\{/g)) {
      if (m[1]) continue; // async — fine
      // Bound the body at its OWN close, or at the next IIFE — whichever comes
      // first. Slicing to the next `})();` alone overshoots into unrelated code
      // and reports an await that belongs to somebody else, which is the false
      // positive that makes a guard get switched off.
      const rest = src.slice(m.index!);
      const close = rest.indexOf('})();');
      const nextIife = rest.slice(1).search(/\((async\s+)?function\s*\(\s*\)\s*\{/);
      const bound = [close, nextIife >= 0 ? nextIife + 1 : -1].filter((n) => n > 0);
      const body = bound.length ? rest.slice(0, Math.min(...bound)) : rest.slice(0, 4000);
      // `await` as a statement, not the word inside prose.
      if (/(^|[\s;{(=])await\s+[A-Za-z_(]/m.test(body)) {
        const label = /\/\/\s*(.+)/.exec(body)?.[1]?.slice(0, 60) ?? '(unlabelled)';
        bad.push(`${file.split('/src/')[1]}: "${label}"`);
      }
    }
  }
  return bad;
}

describe('emitted code that awaits is declared async', () => {
  it('scans a real set of emitters', () => {
    expect(emitterFiles().length).toBeGreaterThan(3);
  });

  it('no synchronous IIFE contains an await', () => {
    // tsc checks the template literal, not the JavaScript inside it — so this
    // is the only thing standing between a sync IIFE and a parse error in a
    // user's browser.
    expect(syncIifesWithAwait().sort()).toEqual([]);
  });
});
