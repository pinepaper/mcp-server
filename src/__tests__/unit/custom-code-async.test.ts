/**
 * The one tool for reaching what the tool surface does not cover could not
 * reach anything asynchronous.
 *
 * `pinepaper_execute_custom_code` wrapped the caller's snippet in a SYNC IIFE.
 * That does two different bad things to async work:
 *
 *  - A top-level `await` is a SYNTAX ERROR inside a non-async function, so a
 *    snippet that awaits anything never parsed. Nothing ran, and the failure
 *    came back as a parse error about code the caller had written correctly.
 *  - Async work started WITHOUT await returns a promise nobody holds. The IIFE
 *    returns at once, the tool reports success, and the next call reads a
 *    canvas where the work has not happened.
 *
 * Which is the whole async half of the engine — export, image import, rigging
 * bake, layout — unreachable from the escape hatch that exists for exactly
 * that kind of reach.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

/** Parse the emitted snippet the way the page would, without running it. */
function parses(code: string): boolean {
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  try { new Function(`return ${body}`); return true; } catch { return false; }
}

describe('execute_custom_code carries async work', () => {
  it('a snippet with a top-level await PARSES', () => {
    const code = codeGenerator.generateExecuteCustomCode({
      code: 'const blob = await app.exportEngine.exportPNG({ dpi: 150 }); return { ok: !!blob };',
    });
    expect(parses(code)).toBe(true);
    expect(code).toContain('async function');
  });

  it('the wrapper is an async IIFE, so both execution paths await it', () => {
    // The governor captures a trailing `(`-led expression and awaits it, and
    // executeCode's eval fallback resolves a returned promise. An async IIFE
    // satisfies both; a sync one satisfies neither for async work.
    const code = codeGenerator.generateExecuteCustomCode({ code: 'return 1;' });
    expect(code.trimStart().startsWith('//')).toBe(true);
    expect(code).toContain('(async function() {');
    expect(code.trimEnd().endsWith('})();')).toBe(true);
  });

  it('a purely synchronous snippet is unaffected', () => {
    const code = codeGenerator.generateExecuteCustomCode({
      code: "const item = app.create('circle', { radius: 20 }); return item.data.registryId;",
    });
    expect(parses(code)).toBe(true);
  });

  it('the caller\'s own error handling still wraps their code', () => {
    const code = codeGenerator.generateExecuteCustomCode({ code: 'throw new Error("boom");' });
    expect(code).toContain('catch (error)');
    expect(code).toContain('success: false');
  });

  it('actually resolves the awaited value rather than handing back a pending promise', async () => {
    const code = codeGenerator.generateExecuteCustomCode({
      code: 'const v = await Promise.resolve(42); return { v };',
    });
    const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
    const result = await new Function(`return ${body}`)();
    expect(result).toEqual({ v: 42 });
  });
});
