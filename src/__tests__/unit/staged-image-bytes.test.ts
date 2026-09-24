/**
 * Large image bytes travel BESIDE the generated code, not inside it.
 *
 * The CSP fix moved image fetching into this process, which was right — the
 * page may not fetch a third-party host — but it inlined the result as a
 * data: URL, so a 3000x800 photo became ~630KB of generated JavaScript.
 *
 * The code reaches the page fine; it is an evaluate ARGUMENT, not a script
 * string. But app.runGenerated REWRITES what it runs, and its loop-guard
 * transform bails at that size ("Loop-guard transform bailed (unusual
 * syntax)"), after which the run reported itemsCreated: 0 and lost the return
 * value — so the import answered success with no itemId. Photos around
 * 200-300KB were fine, which is exactly what made it look like a registration
 * bug rather than a size one, and why my first reading of it was wrong.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const emit = (url: string): string => codeGenerator.generateImportImage({ url } as never);

describe('a big image does not bloat the generated code', () => {
  it('reads a staged key from the page instead of carrying bytes', () => {
    const code = emit('__ppStage:img_abc');
    expect(code).toContain('window.__ppStage');
    expect(code).toContain('img_abc');
    // The whole point: the code stays small.
    expect(code.length).toBeLessThan(20_000);
  });

  it('says so plainly when the staged bytes are missing', () => {
    // A staging bug is the MCP server's fault, and the message says that
    // rather than sending the caller to check their own url.
    expect(emit('__ppStage:img_abc')).toContain('bug in the MCP server');
  });

  it('still inlines a small data URL, which costs nothing', () => {
    const small = `data:image/png;base64,${'A'.repeat(200)}`;
    const code = emit(small);
    expect(code).toContain(small);
  });

  it('leaves an ordinary URL alone for the page to handle', () => {
    expect(emit('https://cdn.example/a.png')).toContain('https://cdn.example/a.png');
  });

  it('emits valid JavaScript either way', () => {
    for (const u of ['__ppStage:k', 'https://cdn.example/a.png']) {
      expect(() => new Function(`return (function(app, paper, window){ ${emit(u)} });`), u).not.toThrow();
    }
  });
});
