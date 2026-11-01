/**
 * pinepaper_pattern (AR-2 P2) delegates to the engine's pattern node
 * (FxTool app.addPattern / modifyPattern / removePattern / listPatterns / getPattern)
 * and hands its answer back, refusals included.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { PatternInputSchema } from '../../types/schemas.js';

function run(code: string, app: Record<string, unknown>): any {
  return new Function('app', `return ${code}`)(app);
}

describe('pinepaper_pattern', () => {
  it('create passes the whole declaration to addPattern and returns its answer', () => {
    let got: any;
    const code = codeGenerator.generatePattern(PatternInputSchema.parse({
      action: 'create', id: 'wave', kind: 'phase_wave', members: { names: 'letter-*' },
      params: { amplitude: 12, period: 1.2 }, window: { from: 1 },
    }));
    const res = run(code, { addPattern: (s: any) => { got = s; return { ok: true, id: s.id, members: 5 }; } });
    expect(got).toEqual({ id: 'wave', kind: 'phase_wave', members: { names: 'letter-*' }, params: { amplitude: 12, period: 1.2 }, window: { from: 1 } });
    expect(res.success).toBe(true);
    expect(res.members).toBe(5);
  });

  it('ring and orbit, the engine\'s other kinds, are accepted and passed through', () => {
    for (const kind of ['ring', 'orbit'] as const) {
      let got: any;
      const spec = PatternInputSchema.parse({ action: 'create', id: kind, kind, members: ['a', 'b', 'c'], params: { target: 'sun', radius: 120, period: 4 } });
      const res = run(codeGenerator.generatePattern(spec), { addPattern: (s: any) => { got = s; return { ok: true, id: s.id, members: 3 }; } });
      expect(res.success).toBe(true);
      expect(got.kind).toBe(kind);
      expect(got.params).toEqual({ target: 'sun', radius: 120, period: 4 });
    }
    expect(() => PatternInputSchema.parse({ action: 'create', id: 'x', kind: 'spiral', members: ['a'] })).toThrow();
  });

  it('a params-only modify of an array-membered pattern keeps its members (PATIMG24)', () => {
    let got: any;
    // The engine stores an array as { refs } and its own re-check refuses that shape.
    const app = {
      getPattern: () => ({ spec: { id: 'w', kind: 'phase_wave', members: { refs: ['item_1', 'item_2'] }, params: {} } }),
      modifyPattern: (_id: string, ch: any) => { got = ch; return { ok: true }; },
    };
    const res = run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'modify', id: 'w', params: { amplitude: 40 } })), app);
    expect(res.success).toBe(true);
    expect(got).toEqual({ params: { amplitude: 40 }, members: ['item_1', 'item_2'] });
    // Members the engine re-accepts ({ names }, { ids }) are left to it.
    app.getPattern = () => ({ spec: { id: 'w', kind: 'phase_wave', members: { names: ['dot-*'] } as any, params: {} } });
    run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'modify', id: 'w', params: { amplitude: 41 } })), app);
    expect(got).toEqual({ params: { amplitude: 41 } });
  });

  it('an engine refusal is a failure with the engine\'s reason', () => {
    const code = codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'create', id: 'w', kind: 'stagger', members: ['a'] }));
    const res = run(code, { addPattern: () => ({ ok: false, error: "addPattern: a pattern 'w' exists", code: 'PATTERN_ID_TAKEN' }) });
    expect(res.success).toBe(false);
    expect(res.code).toBe('PATTERN_ID_TAKEN');
  });

  it('create without kind or members says what is missing instead of calling the engine', () => {
    let called = false;
    const app = { addPattern: () => { called = true; return { ok: true }; } };
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'create', id: 'w', members: ['a'] })), app).error).toContain('kind');
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'create', id: 'w', kind: 'stagger' })), app).error).toContain('members');
    expect(called).toBe(false);
  });

  it('modify sends only what changed', () => {
    let args: any[] = [];
    const code = codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'modify', id: 'wave', params: { amplitude: 40 } }));
    run(code, { modifyPattern: (...a: any[]) => { args = a; return { ok: true }; } });
    expect(args).toEqual(['wave', { params: { amplitude: 40 } }]);
  });

  it('remove, get and list', () => {
    const app = {
      removePattern: (id: string) => id === 'wave',
      getPattern: (id: string) => (id === 'wave' ? { spec: { id }, members: [{ id: 'item_1' }] } : null),
      listPatterns: () => [{ id: 'wave' }],
    };
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'remove', id: 'wave' })), app).success).toBe(true);
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'remove', id: 'nope' })), app).success).toBe(false);
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'get', id: 'wave' })), app).members).toHaveLength(1);
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'list' })), app).count).toBe(1);
  });

  it('every action but list needs the id; an engine without patterns says so', () => {
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'get' })), { getPattern: () => null }).error).toContain('id');
    expect(run(codeGenerator.generatePattern(PatternInputSchema.parse({ action: 'list' })), {}).error).toContain('unavailable');
  });
});
