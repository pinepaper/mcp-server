/**
 * The generated script is not the error.
 *
 * Most error paths passed the emitted code in `details` as evidence. For a long
 * script that is ~12KB of JavaScript in front of a one-line failure — measured
 * in a pilot session — which an agent pays for and learns nothing from, and
 * which on a big export can crowd out the result itself.
 *
 * Replaced with its shape plus the switch that returns it, so nothing is
 * hidden from anyone debugging a generator.
 */
import { describe, it, expect, afterEach } from 'bun:test';
import { errorResult } from '../../tools/handlers.js';
import { ErrorCodes } from '../../types/schemas.js';

const longScript = `// generated\n${'app.create("circle", {});\n'.repeat(400)}`;

const detailsOf = (r: { content: Array<{ type: string; text?: string }> }): Record<string, unknown> =>
  JSON.parse(r.content[0].text!).error.details;

afterEach(() => { delete process.env.PINEPAPER_ECHO_CODE; });

describe('an error does not carry the whole script', () => {
  it('replaces a long code field with its shape', () => {
    const d = detailsOf(errorResult(ErrorCodes.EXECUTION_ERROR, 'it broke', { code: longScript }) as never);
    expect(d).not.toHaveProperty('code');
    expect(d.generatedCode).toMatchObject({ bytes: longScript.length });
    expect((d.generatedCode as { hint: string }).hint).toContain('PINEPAPER_ECHO_CODE=1');
    expect(JSON.stringify(d).length).toBeLessThan(600);
  });

  it('keeps the other details intact', () => {
    const d = detailsOf(errorResult(ErrorCodes.EXECUTION_ERROR, 'x', {
      code: longScript, exportId: 'exp_1', size: 12,
    }) as never);
    expect(d).toMatchObject({ exportId: 'exp_1', size: 12 });
  });

  it('returns the script in full when asked', () => {
    process.env.PINEPAPER_ECHO_CODE = '1';
    const d = detailsOf(errorResult(ErrorCodes.EXECUTION_ERROR, 'x', { code: longScript }) as never);
    expect(d.code).toBe(longScript);
  });

  it('leaves a SHORT code field alone', () => {
    // A short `code` is usually a status or an error code, not a program;
    // stripping those would take information away rather than noise.
    const d = detailsOf(errorResult(ErrorCodes.VALIDATION_ERROR, 'x', { code: 'PP_ITEM_BUDGET' }) as never);
    expect(d.code).toBe('PP_ITEM_BUDGET');
  });

  it('passes through details that are not objects', () => {
    const d = detailsOf(errorResult(ErrorCodes.VALIDATION_ERROR, 'x', ['a', 'b']) as never);
    expect(d).toEqual(['a', 'b'] as never);
  });
});
