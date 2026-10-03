/**
 * Every tool and action has an effect class (no-silent-success sweep, half 1).
 * A new tool must be named in the table; a new action of an action tool is
 * classed by rule, and the mutating ones are listed here so a reviewer sees
 * every addition.
 */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { effectClass, TOOL_CLASS, UNCHECKED_TOOLS, SIDE_EFFECT_TOOLS, ACTION_CLASS } from '../../tools/effect-class.js';

const actionsOf = (t: (typeof PINEPAPER_TOOLS)[number]) => ((t.inputSchema?.properties as any)?.action?.enum ?? null) as string[] | null;

describe('effect classes', () => {
  it('every tool without actions or a readOnlyHint is named in TOOL_CLASS', () => {
    const missing = PINEPAPER_TOOLS.filter((t) => !t.annotations?.readOnlyHint && !actionsOf(t) && !TOOL_CLASS[t.name]).map((t) => t.name);
    expect(missing).toEqual([]);
  });

  it('the tables name only real tools and actions', () => {
    const names = new Set(PINEPAPER_TOOLS.map((t) => t.name));
    const stale = [...Object.keys(TOOL_CLASS), ...UNCHECKED_TOOLS, ...SIDE_EFFECT_TOOLS].filter((n) => !names.has(n));
    const badActions = Object.keys(ACTION_CLASS).filter((k) => {
      const [tool, action] = k.split(':');
      const t = PINEPAPER_TOOLS.find((x) => x.name === tool);
      return !t || !(actionsOf(t) ?? []).includes(action);
    });
    expect(stale).toEqual([]);
    expect(badActions).toEqual([]);
  });

  it('readOnlyHint tools are read-only unless an action says otherwise', () => {
    for (const t of PINEPAPER_TOOLS.filter((x) => x.annotations?.readOnlyHint)) {
      for (const a of actionsOf(t) ?? [undefined]) {
        const c = effectClass(t.name, a, true);
        if (!ACTION_CLASS[`${t.name}:${a}`]) expect(c).toBe('read-only');
      }
    }
  });

  it('spot checks', () => {
    expect(effectClass('pinepaper_map_regions', 'highlight', false)).toBe('mutates');     // D59
    expect(effectClass('pinepaper_map_regions', 'get_highlighted', false)).toBe('read-only');
    expect(effectClass('pinepaper_sound', 'play_sfx', false)).toBe('side-effect');
    expect(effectClass('pinepaper_sound', 'create', false)).toBe('mutates');
    expect(effectClass('pinepaper_history', 'undo', false)).toBe('mutates');
    expect(effectClass('pinepaper_world3d', 'add_actor', false)).toBe('unchecked');
    expect(effectClass('pinepaper_interchange', 'export_lottie', false)).toBe('side-effect');
  });

  it('prints the mutating actions (for review when this changes)', () => {
    const mut = PINEPAPER_TOOLS.flatMap((t) => (actionsOf(t) ?? []).filter((a) => effectClass(t.name, a, t.annotations?.readOnlyHint) === 'mutates').map((a) => `${t.name.replace('pinepaper_', '')}:${a}`));
    expect(mut.length).toBeGreaterThan(50);
  });
});
