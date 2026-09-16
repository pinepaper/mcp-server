/**
 * pinepaper_path — the destructive path operations.
 *
 * Paper.js has had booleans, simplify and outline-stroke since forever, and
 * FxTool exposed them on the facade (booleanOp, simplifyPath, outlineStroke,
 * togglePathClosed, patternFrom, getPathGeometry, setItemLocked,
 * unlockAllItems). Nothing here could reach any of them, which by this
 * project's own rule means they did not exist: the engine could do it and no
 * tool call could name it.
 *
 * Verified against FxTool origin/main.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { PathOpInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const gen = (input: Record<string, unknown>) =>
  codeGenerator.generatePathOp(PathOpInputSchema.parse(input));

describe('each action reaches its own facade', () => {
  const cases: Array<[Record<string, unknown>, string]> = [
    [{ action: 'boolean', itemIds: ['a', 'b'] }, 'app.booleanOp(["a","b"], "unite")'],
    [{ action: 'boolean', itemIds: ['a', 'b', 'c'], op: 'subtract' }, 'app.booleanOp(["a","b","c"], "subtract")'],
    [{ action: 'simplify', itemId: 'a' }, 'app.simplifyPath("a")'],
    [{ action: 'simplify', itemId: 'a', tolerance: 5 }, 'app.simplifyPath("a", 5)'],
    [{ action: 'outline_stroke', itemId: 'a' }, 'app.outlineStroke("a", {})'],
    [{ action: 'toggle_closed', itemId: 'a' }, 'app.togglePathClosed("a")'],
    [{ action: 'pattern', itemId: 'a' }, 'app.patternFrom("a", "radial", {})'],
    [{ action: 'get_geometry', itemId: 'a' }, 'app.getPathGeometry("a"'],
    [{ action: 'set_locked', itemId: 'a' }, 'app.setItemLocked("a", true)'],
    [{ action: 'set_locked', itemId: 'a', locked: false }, 'app.setItemLocked("a", false)'],
    [{ action: 'unlock_all' }, 'app.unlockAllItems()'],
  ];

  for (const [input, call] of cases) {
    it(`${input.action}${input.op ? ` (${input.op})` : ''} → ${call.split('(')[0]}`, () => {
      const code = gen(input);
      expect(code).toContain(call);
      // Every facade is guarded: a studio without it is a different fault from
      // a path that cannot be operated on, and must not read the same.
      expect(code).toContain('update FxTool');
      expect(() => new Function(code)).not.toThrow();
    });
  }
});

describe('the engine\'s own refusal is passed through, not reworded', () => {
  it('reads r.reason rather than supplying a second wording', () => {
    // "a boolean needs at least two paths — select two items", "that path has
    // no stroke to outline", "simplify needs a path". Each is more specific
    // than anything this layer could say, and two wordings for one condition
    // is the defect.
    for (const a of ['boolean', 'simplify', 'outline_stroke', 'toggle_closed', 'pattern', 'set_locked', 'unlock_all']) {
      const input: Record<string, unknown> = a === 'boolean'
        ? { action: a, itemIds: ['x', 'y'] }
        : a === 'unlock_all' ? { action: a } : { action: a, itemId: 'x' };
      expect(gen(input)).toContain('r.reason');
    }
  });

  it('supplies a wording ONLY where the engine returns a bare null', () => {
    // getPathGeometry returns null for "no such item" and says nothing — the
    // one facade in this group that does not name its refusal.
    const code = gen({ action: 'get_geometry', itemId: 'ghost' });
    expect(code).toContain('no such item');
    expect(code).not.toContain('r.reason');
  });
});

describe('pattern options', () => {
  it('passes the option bag through untouched', () => {
    const code = gen({
      action: 'pattern', itemId: 'a', kind: 'grid',
      pattern: { rows: 3, cols: 4, gapX: 20, gapY: 20 },
    });
    expect(code).toContain('app.patternFrom("a", "grid", {"rows":3,"cols":4,"gapX":20,"gapY":20})');
  });

  it('offers every kind the engine accepts, and no others', () => {
    // The engine refuses an unknown kind by name; the enum means a caller
    // never gets that far. Both lists are ['concentric','radial','grid','extrude'].
    for (const kind of ['concentric', 'radial', 'grid', 'extrude']) {
      expect(PathOpInputSchema.safeParse({ action: 'pattern', itemId: 'a', kind }).success).toBe(true);
    }
    expect(PathOpInputSchema.safeParse({ action: 'pattern', itemId: 'a', kind: 'spiral' }).success).toBe(false);
  });

  it('offers every boolean op the engine accepts, and no others', () => {
    for (const op of ['unite', 'subtract', 'intersect', 'exclude', 'divide']) {
      expect(PathOpInputSchema.safeParse({ action: 'boolean', itemIds: ['a', 'b'], op }).success).toBe(true);
    }
    expect(PathOpInputSchema.safeParse({ action: 'boolean', itemIds: ['a', 'b'], op: 'merge' }).success).toBe(false);
  });
});

describe('the schema refuses an incomplete call', () => {
  it('a boolean needs two ids, not one', () => {
    expect(PathOpInputSchema.safeParse({ action: 'boolean', itemIds: ['a'] }).success).toBe(false);
    expect(PathOpInputSchema.safeParse({ action: 'boolean' }).success).toBe(false);
  });

  it('every other action except unlock_all needs an itemId', () => {
    for (const action of ['simplify', 'outline_stroke', 'toggle_closed', 'pattern', 'get_geometry', 'set_locked']) {
      const r = PathOpInputSchema.safeParse({ action });
      expect(r.success).toBe(false);
      if (!r.success) expect(JSON.stringify(r.error.issues)).toContain('itemId');
    }
    expect(PathOpInputSchema.safeParse({ action: 'unlock_all' }).success).toBe(true);
  });
});

describe('the tool says what it destroys', () => {
  it('warns that a boolean consumes its operands', () => {
    // These actions change what items EXIST — a boolean's operands are gone
    // afterwards and their relations and keyframes go with them. A caller who
    // reads this as "restyle" loses work.
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_path')!;
    expect(tool.description).toContain('CONSUMES its operands');
    expect(tool.description).toContain('relations and keyframes');
    expect(tool.description).toContain('outline_stroke');
  });
});
