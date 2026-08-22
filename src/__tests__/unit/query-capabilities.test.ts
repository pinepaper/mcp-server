/**
 * pinepaper_query_capabilities — the tool whose entire job is "what can this
 * engine do", so a silently PARTIAL answer is its one unacceptable failure.
 *
 * It used to rebuild the capability index itself, walking app.generatorRegistry
 * and app.relationRegistry directly. Both are lazy: generatorRegistry is null
 * until ensureHeavyModules() lands (~1.2s after boot), and the rigging /
 * blending / deform relation rules only register when their subsystem is first
 * touched. So an early `coverage` call reported ZERO generators and roughly 77
 * of ~100 relations, with nothing in the result admitting it was a fraction.
 *
 * It now reads app.getCapabilities(), which warms first and returns a coverage
 * report describing what it read from. These tests pin that it delegates rather
 * than re-deriving, and that `seed` — documented as giving reproducible
 * selection — actually affects the outcome.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { QueryCapabilitiesInputSchema } from '../../types/schemas.js';

const gen = (input: unknown) =>
  codeGenerator.generateQueryCapabilities(QueryCapabilitiesInputSchema.parse(input));

/**
 * Make the emitted snippet return its own result.
 *
 * The snippet is a leading comment block followed by `(async function(){…})();`.
 * Prefixing the whole thing with `return` puts a comment between the keyword and
 * the expression, and ASI then ends the statement — the function returns
 * undefined and every assertion below reads a property of nothing. Attach the
 * keyword to the IIFE itself instead.
 */
const runnable = (code: string) => code.replace('(async function()', 'return (async function()');

describe('generateQueryCapabilities — delegate, do not re-derive', () => {
  it('calls app.getCapabilities() rather than walking the registries itself', () => {
    const code = gen({ action: 'list' });
    expect(code).toContain('await app.getCapabilities()');
    // The old fallback read these directly and got a cold-boot subset.
    expect(code).not.toContain('app.generatorRegistry');
    expect(code).not.toContain('app.relationRegistry');
    expect(code).not.toContain('app.listTextStyles');
  });

  it('guards on the method existing, with an actionable message', () => {
    const code = gen({ action: 'list' });
    expect(code).toContain("typeof app.getCapabilities !== 'function'");
    expect(code).toContain('update FxTool');
  });

  it('every action is syntactically valid JavaScript', () => {
    for (const action of ['list', 'choose', 'coverage', 'find'] as const) {
      const code = gen({ action, key: 'scattered', mood: 'triumphant', subject: 'a win' });
      expect(() => new Function(code)).not.toThrow();
    }
  });

  it('coverage forwards the ENGINE report instead of recomputing one', () => {
    const code = gen({ action: 'coverage' });
    expect(code).toContain('...(report || {})');
  });

  it('list and choose surface the blind spots the report names', () => {
    expect(gen({ action: 'list' })).toContain('unwiredKinds');
    expect(gen({ action: 'choose', mood: 'calm' })).toContain('unrankable');
  });
});

describe('generateQueryCapabilities — seed is no longer inert', () => {
  it('a seed reaches the tiebreak, so equal scores do not fall out in array order', () => {
    const code = gen({ action: 'choose', mood: 'calm', seed: 'quiz_q1' });
    expect(code).toContain('"quiz_q1"');
    expect(code).toContain('const tiebreak =');
    expect(code).toMatch(/if \(ha !== null && ha !== hb\) return ha - hb;/);
  });

  it('with no seed the order is still stable, not array order', () => {
    const code = gen({ action: 'choose', mood: 'calm' });
    expect(code).toContain('a.item.key.localeCompare(b.item.key)');
  });

  it('the same seed ranks equal-scoring candidates the same way, twice', () => {
    // Exercise the emitted comparator on candidates that all score zero.
    const code = gen({ action: 'choose', seed: 's1' });
    const run = () => {
      const fn = new Function('app', runnable(code));
      return fn({
        getCapabilities: async () => ({
          capabilities: ['delta', 'alpha', 'charlie', 'bravo'].map((key) => ({
            key, kind: 'effect', label: key, definition: '', text: key, describable: true,
          })),
          coverage: { unrankable: [], unwiredKinds: [] },
        }),
      });
    };
    return Promise.all([run(), run()]).then(([a, b]) => {
      expect(a.topCandidates.map((c: { key: string }) => c.key))
        .toEqual(b.topCandidates.map((c: { key: string }) => c.key));
      // A seeded shuffle, not alphabetical — otherwise the seed is decoration.
      expect(a.topCandidates.map((c: { key: string }) => c.key))
        .not.toEqual(['alpha', 'bravo', 'charlie', 'delta']);
    });
  });

  it('an empty capability list is an answer, not a crash', async () => {
    const code = gen({ action: 'choose', mood: 'calm' });
    const fn = new Function('app', runnable(code));
    const res = await fn({ getCapabilities: async () => ({ capabilities: [], coverage: {} }) });
    expect(res.success).toBe(true);
    expect(res.recommendation).toBeNull();
  });

  it('a missing getCapabilities reports rather than throwing', async () => {
    const code = gen({ action: 'list' });
    const fn = new Function('app', runnable(code));
    const res = await fn({});
    expect(res.success).toBe(false);
    expect(res.error).toContain('update FxTool');
  });
});
