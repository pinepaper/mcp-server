/** Anthropic Messages API: no oneOf/anyOf/allOf/not/enum/$ref at the top level of an input_schema; names match ^[a-zA-Z0-9_-]{1,64}$ (field report 2026-11-21, #3). */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

describe('every listed tool has a top-level object schema', () => {
  it('holds', () => {
    const bad: string[] = [];
    for (const t of PINEPAPER_TOOLS as Array<{ name: string; description?: string; inputSchema: Record<string, any> }>) {
      if (!/^[a-zA-Z0-9_-]{1,64}$/.test(t.name)) bad.push(`${t.name}: name`);
      const s = t.inputSchema;
      if (!s || s.type !== 'object') bad.push(`${t.name}: type ${s?.type}`);
      for (const k of ['oneOf', 'anyOf', 'allOf', 'not', 'enum', '$ref']) if (s && k in s) bad.push(`${t.name}: top-level ${k}`);
      if (!t.description) bad.push(`${t.name}: no description`);
    }
    expect(bad).toEqual([]);
  });
});
