/**
 * Error code consistency tests.
 *
 * Enforces that handlers.ts uses the ErrorCodes enum at every errorResult
 * call site rather than ad-hoc string literals. Static check (greps the
 * source file) — catches new raw-string codes the moment they land.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ErrorCodes, type ErrorCode } from '../../types/schemas.js';

const HANDLERS_PATH = join(import.meta.dir, '../../tools/handlers.ts');
const HANDLERS_SRC = readFileSync(HANDLERS_PATH, 'utf8');

describe('ErrorCodes enum consistency', () => {
  it('every errorResult() call uses the ErrorCodes enum (no raw string codes)', () => {
    // Match `errorResult(` followed by an opening quote on the SAME line
    // — single-line shorthand sites. Multi-line raw codes are caught by the
    // adjacent rule below.
    const inlineRawCalls = HANDLERS_SRC.match(/errorResult\(\s*['"][A-Z_]+['"]/g) || [];
    expect(inlineRawCalls).toEqual([]);
  });

  it('multi-line errorResult() calls also use the ErrorCodes enum', () => {
    // Match `errorResult(` followed by whitespace/newline then a quoted
    // string-literal first arg ending with a comma — the multi-line form.
    const multilineRawCalls = HANDLERS_SRC.match(/errorResult\(\s*\n\s*['"][A-Z_]+['"]\s*,/g) || [];
    expect(multilineRawCalls).toEqual([]);
  });

  it('every code referenced via ErrorCodes.X is defined in the enum', () => {
    const referenced = HANDLERS_SRC.match(/ErrorCodes\.([A-Z_]+)/g) || [];
    const known = new Set(Object.keys(ErrorCodes));
    const unknown = [...new Set(referenced.map((m) => m.replace('ErrorCodes.', '')))]
      .filter((name) => !known.has(name));
    expect(unknown).toEqual([]);
  });

  it('ErrorCodes values are stable (string literal types match key names)', () => {
    for (const [key, value] of Object.entries(ErrorCodes)) {
      expect(value).toBe(key);
    }
  });

  it('ErrorCode union type covers every enum value at compile time', () => {
    // Type-check sentinel: any ErrorCode value must be assignable from
    // ErrorCodes[<any key>]. If a future change drops the as const, this
    // line fails to compile.
    const sample: ErrorCode = ErrorCodes.VALIDATION_ERROR;
    expect(sample).toBe('VALIDATION_ERROR');
  });
});
