/**
 * A tool that is listed must not tell you to use one that is not.
 *
 * Toolkit profiles exist to cut token cost, and they cut by TAG — so a tool
 * lands outside a profile because of the group it belongs to, not because
 * anyone decided it was unnecessary there. Meanwhile descriptions name each
 * other freely.
 *
 * The result, found by a session driving production: pinepaper_text_effect and
 * pinepaper_design_medium both tell an agent to use pinepaper_text_style, which
 * the default profile did not list and the client therefore could not call.
 * The entire 15-style caption system was reachable only by someone who already
 * knew the name. Two more had the same shape — execute_custom_code (pointed at
 * by keyframe_animate and execute_generator) and add_filter (by image_filter).
 *
 * The rule is referential: if a profile lists a tool, it lists everything that
 * tool's schema names. Silence is the failure mode — nothing errors, the agent
 * simply cannot follow the instruction it was given.
 */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS, CHOOSE_THE_DOOR, DOOR_TOOLS, getToolsForVerbosity } from '../../tools/definitions.js';
import { getToolsForToolkit, referencedToolNames, CRAFT_TOOLS, TOOLKIT_PROFILES_LIST, DEFAULT_TOOLKIT } from '../../tools/toolkits.js';

const ALL = PINEPAPER_TOOLS.map((t) => t.name);

/** Tools named by a listed tool's schema that the same profile does not list. */
function danglingIn(profile: string): Array<{ missing: string; referencedBy: string[] }> {
  const listedTools = getToolsForToolkit(PINEPAPER_TOOLS as never, profile as never);
  const listed = new Set(listedTools.map((t) => t.name));
  const out = new Map<string, string[]>();
  const known = new Set(ALL);
  // WHOLE names (referencedToolNames): pinepaper_camera is not named inside pinepaper_camera_director.
  for (const tool of listedTools) {
    for (const name of referencedToolNames(tool, known)) {
      if (listed.has(name)) continue;
      out.set(name, [...(out.get(name) ?? []), tool.name]);
    }
  }
  return [...out].map(([missing, referencedBy]) => ({ missing, referencedBy })).sort((a, b) => a.missing.localeCompare(b.missing));
}

describe('every tool a profile points at, that profile lists', () => {
  it('reads real profiles', () => {
    // Liveness: a profile that returned nothing would pass every check below.
    expect(ALL.length).toBeGreaterThan(100);
    expect(getToolsForToolkit(PINEPAPER_TOOLS as never, 'agent' as never).length).toBeGreaterThan(100);
    expect(TOOLKIT_PROFILES_LIST).toContain('agent');
  });

  it('the agent profile has no dangling reference', () => {
    expect(danglingIn('agent')).toEqual([]);
  });

  // THE DEFAULT since 1.6.25. Closed by construction (getToolsForToolkit follows references), and checked here so
  // the construction is proved rather than assumed — at every verbosity, since descriptions differ by verbosity.
  it('core — the default — has no dangling reference at any verbosity', () => {
    expect(DEFAULT_TOOLKIT).toBe('core');
    for (const v of ['minimal', 'compact', 'verbose'] as const) {
      const tools = getToolsForVerbosity(v);
      const listed = getToolsForToolkit(tools, 'core');
      const names = new Set(listed.map((t) => t.name));
      const known = new Set(tools.map((t) => t.name));
      const dangling = listed.flatMap((t) => referencedToolNames(t, known).filter((r) => !names.has(r)).map((r) => `${t.name} -> ${r}`));
      expect(dangling, v).toEqual([]);
    }
  });

  it('core lists every tool the server instructions send a model to', () => {
    // The craft seed is exactly what the door block names: its structured doors and the tools its text mentions.
    const named = [...new Set(CHOOSE_THE_DOOR.match(/\bpinepaper_[a-z0-9_]+\b/g) ?? [])].filter((n) => ALL.includes(n));
    expect([...CRAFT_TOOLS].sort()).toEqual([...new Set([...DOOR_TOOLS, ...named])].sort());
    const core = new Set(getToolsForToolkit(PINEPAPER_TOOLS as never, 'core' as never).map((t: { name: string }) => t.name));
    expect(named.filter((n) => !core.has(n))).toEqual([]);
  });

  it('core is the lean default: well under the agent profile', () => {
    const size = (p: string) => Buffer.byteLength(JSON.stringify(getToolsForToolkit(getToolsForVerbosity('compact'), p as never)));
    expect(size('core')).toBeLessThan(size('agent') * 0.6);
  });

  /**
   * The DOMAIN profiles are a different case and are not held to the same rule.
   * Someone who asks for `diagram` has narrowed the surface on purpose, and a
   * description that mentions a tool outside that domain is informative rather
   * than broken — they can widen with set_toolkit. The counts are pinned so
   * the number cannot grow unnoticed, which is what would signal a description
   * quietly acquiring a dependency.
   */
  const DOMAIN_DANGLING: Readonly<Record<string, number>> = {
    diagram: 7,
    // 4 rather than 3: agent_export now says keyframe loop:true has been
    // measured playing once in export and names pinepaper_animate's loop
    // presets as the route that does cycle. The map profile does not carry
    // animate; the pointer is worth more than the reference costs.
    map: 4,
    // 11 rather than 10 deliberately: pinepaper_text_style's action list now
    // names pinepaper_text_effect, to explain why 'list' is accepted as an
    // alias for 'list_styles'. Someone in the font profile reading that is
    // being told where the other spelling comes from, which is worth more than
    // the reference costs.
    font: 11,
    // 7 rather than 6: the export tool now tells you to verify motion with
    // pinepaper_capture_frames before committing to a long render, and minimal
    // does not carry it. Kept because the advice is worth more than the
    // reference costs — minimal also renders trimmed descriptions, and anyone
    // who wants the tool can widen with set_toolkit.
    // 8: the same pinepaper_animate pointer as map (keyframe loop:true
    // measured playing once in export; the loop presets do cycle).
    minimal: 8,
    // 3: the batch's lane description names pinepaper_pattern, pinepaper_clear_canvas and pinepaper_event, which
    // build a scene; the edit profile (#43) changes one, and set_toolkit {load} widens it when an edit needs them.
  };

  // The lane is read WHOLE by a model that has nothing else (agent-lane.test.ts), so it is held to zero.
  it('the lane has no dangling reference', () => {
    expect(danglingIn('lane')).toEqual([]);
  });

  it('the domain profiles dangle only as much as they are known to', () => {
    const counts: Record<string, number> = {};
    for (const profile of TOOLKIT_PROFILES_LIST) {
      if (profile === 'agent' || profile === 'full' || profile === 'lane' || profile === 'core') continue;
      const n = danglingIn(profile).length;
      if (n) counts[profile] = n;
    }
    // A RATCHET: a number may fall, and a rise means a listed description
    // started naming something the profile does not carry.
    for (const [profile, n] of Object.entries(counts)) {
      expect(n, `${profile} gained a dangling reference`).toBeLessThanOrEqual(DOMAIN_DANGLING[profile] ?? 0);
    }
    expect(Object.keys(counts).sort()).toEqual(Object.keys(DOMAIN_DANGLING).sort());
  });

  it('full lists everything, so it can never dangle', () => {
    expect(getToolsForToolkit(PINEPAPER_TOOLS as never, 'full' as never).length).toBe(ALL.length);
  });
});
