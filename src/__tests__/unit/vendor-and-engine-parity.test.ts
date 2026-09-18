/**
 * The two capability facts that used to be discovered late.
 *
 * Both caveats on the 1.6.8 release had the same shape — a fact about what the
 * environment supports, learned at the worst moment:
 *
 *  1. "Long-form export needs a studio carrying exportToStore" was discovered
 *     per call, one tool at a time, because each emitter guards its own methods
 *     and nothing reported the set. Now derived from those guards and probed in
 *     one call.
 *  2. "The vendored design systems will drift" was caught only by
 *     `prepublishOnly`. A guard that fires at publish is better than none, but
 *     it fires when the cost of a fix is highest.
 *
 * FxTool's provenance test is the model for the second: regenerate and compare
 * WHENEVER the sibling repo is present, skip cleanly when it is not — because
 * this package ships to npm without mcp-cloud beside it and a suite that fails
 * for a missing sibling is a suite people learn to ignore.
 */

import { describe, it, expect } from 'bun:test';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { REQUIRED_ENGINE_METHODS, OPTIONAL_ENGINE_METHODS } from '../../tools/engine-methods.js';

const REPO = resolve(import.meta.dir, '..', '..', '..');
const run = (script: string) =>
  spawnSync('node', [join(REPO, 'scripts', script), '--check'], { cwd: REPO, encoding: 'utf-8' });

describe('the derived engine-method list stays derived', () => {
  it('matches the guards in the emitters', () => {
    // Runs everywhere: the source it derives from ships with this repo.
    const r = run('sync-engine-methods.mjs');
    expect(r.stdout + r.stderr).not.toContain('DRIFT');
    expect(r.status).toBe(0);
  });

  it('covers the methods the release notes promise', () => {
    // A probe that omits the method someone asked about is worse than none.
    // These four were each named in a caveat or a release note.
    for (const m of ['exportEngine.exportToStore', 'exportEngine.readExport', 'extrudeToMesh', 'stickFigure']) {
      expect(REQUIRED_ENGINE_METHODS, `${m} is not probed`).toContain(m);
    }
  });

  it('keeps required and optional apart', () => {
    // An older studio that DEGRADES is not an unusable one, and reporting both
    // as one list would say it is.
    expect(OPTIONAL_ENGINE_METHODS.length).toBeGreaterThan(0);
    for (const m of OPTIONAL_ENGINE_METHODS) expect(REQUIRED_ENGINE_METHODS).not.toContain(m);
  });

  it('names nothing that is not an engine method', () => {
    // A false "missing" tells an agent a studio is broken when it is not — the
    // false positive that teaches people to ignore a guard. The first version
    // of the extractor reported `generateInterchange`, `method` and `if`,
    // because its annotation regex crossed newlines and swallowed the next line
    // of code.
    //
    // The premise has to allow for interpolation: a method reached through
    // `app.${fn}` never appears as `app.extrudeToMesh` in source, only as a
    // quoted literal one line away. So each name must appear EITHER as a call
    // or as a literal — junk like `if` satisfies neither.
    return Bun.file(join(REPO, 'src', 'types', 'code-generator.ts')).text().then((text) => {
      const bogus = [...REQUIRED_ENGINE_METHODS, ...OPTIONAL_ENGINE_METHODS]
        .filter((m) => !text.includes(`app.${m}`) && !text.includes(`'${m}'`));
      expect(bogus).toEqual([]);
    });
  });

  it('no name is a TypeScript identifier from this file rather than an engine method', () => {
    // The specific junk the newline bug produced, pinned so it cannot return.
    for (const junk of ['if', 'method', 'fn', 'generateInterchange', 'generateSound', 'generatePathOp']) {
      expect(REQUIRED_ENGINE_METHODS, `${junk} is not an engine method`).not.toContain(junk);
      expect(OPTIONAL_ENGINE_METHODS).not.toContain(junk);
    }
  });

});

describe('the vendored design data is checked in the suite, not only at publish', () => {
  const UPSTREAM = process.env.PP_MCP_CLOUD_DIR
    ? join(process.env.PP_MCP_CLOUD_DIR, 'src', 'services')
    : resolve(REPO, '..', 'mcp-cloud', 'src', 'services');
  const present = existsSync(UPSTREAM);

  it(present ? 'matches upstream' : 'skips cleanly with mcp-cloud absent', () => {
    const r = run('sync-design-systems.mjs');
    if (!present) {
      // The skip is asserted rather than assumed: this package ships to npm
      // without the sibling, and a suite that fails for a missing sibling is
      // one people learn to ignore.
      expect(r.status).toBe(0);
      expect(r.stderr).toContain('no upstream at');
      return;
    }
    expect(r.stdout + r.stderr).not.toContain('DRIFT');
    expect(r.status).toBe(0);
  });
});
