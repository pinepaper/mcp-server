/**
 * Toolkit Profile Tests
 *
 * Validates the workflow-based tool filtering system:
 * - All tool names in tag groups exist in PINEPAPER_TOOLS
 * - No duplicate tool names within or across tags
 * - 'full' profile returns all tools unchanged
 * - Each profile includes agent + browser tags
 * - Profile tool counts are within expected ranges
 * - Composability: toolkit + verbosity both apply
 * - Detection functions: defaults, precedence, legacy compat
 * - Client profile auto-detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { PINEPAPER_TOOLS, getToolsForVerbosity } from '../../tools/definitions.js';
import {
  TOOL_TAGS,
  TOOLKIT_PROFILES,
  TOOLKIT_PROFILES_LIST,
  getToolsForToolkit,
  detectToolkitFromEnvironment,
  detectVerbosityFromEnvironment,
  isToolkitExplicitlySet,
  isVerbosityExplicitlySet,
  getClientProfile,
} from '../../tools/toolkits.js';
import type { ToolkitProfile } from '../../tools/toolkits.js';

const allToolNames = new Set(PINEPAPER_TOOLS.map(t => t.name));

describe('TOOL_TAGS', () => {
  it('every tool name in every tag exists in PINEPAPER_TOOLS', () => {
    const missing: string[] = [];
    for (const [tag, names] of Object.entries(TOOL_TAGS)) {
      for (const name of names) {
        if (!allToolNames.has(name)) {
          missing.push(`${tag}: ${name}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('no duplicate tool names within a single tag', () => {
    for (const [tag, names] of Object.entries(TOOL_TAGS)) {
      const seen = new Set<string>();
      for (const name of names) {
        expect(seen.has(name)).toBe(false);
        seen.add(name);
      }
    }
  });

  it('no tool name appears in multiple tags', () => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [tag, names] of Object.entries(TOOL_TAGS)) {
      for (const name of names) {
        if (seen.has(name)) {
          dupes.push(`${name} in both '${seen.get(name)}' and '${tag}'`);
        }
        seen.set(name, tag);
      }
    }
    expect(dupes).toEqual([]);
  });

  it('all tags combined cover every tool in PINEPAPER_TOOLS', () => {
    const tagged = new Set<string>();
    for (const names of Object.values(TOOL_TAGS)) {
      for (const name of names) {
        tagged.add(name);
      }
    }
    const untagged = PINEPAPER_TOOLS.map(t => t.name).filter(n => !tagged.has(n));
    expect(untagged).toEqual([]);
  });

  it('guide tag contains pinepaper_tool_guide', () => {
    expect(TOOL_TAGS.guide).toContain('pinepaper_tool_guide');
  });
});

describe('TOOLKIT_PROFILES', () => {
  it('every tag referenced in a profile exists in TOOL_TAGS', () => {
    const missing: string[] = [];
    for (const [profile, tags] of Object.entries(TOOLKIT_PROFILES)) {
      for (const tag of tags) {
        if (!TOOL_TAGS[tag]) {
          missing.push(`${profile}: unknown tag '${tag}'`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('full profile has empty tags array (no filtering)', () => {
    expect(TOOLKIT_PROFILES.full).toEqual([]);
  });

  const filteredProfiles: ToolkitProfile[] = ['agent', 'diagram', 'map', 'font', 'minimal'];
  for (const profile of filteredProfiles) {
    it(`${profile} profile includes agent and browser tags`, () => {
      const tags = TOOLKIT_PROFILES[profile];
      expect(tags).toContain('agent');
      expect(tags).toContain('browser');
    });

    it(`${profile} profile includes guide tag`, () => {
      const tags = TOOLKIT_PROFILES[profile];
      expect(tags).toContain('guide');
    });
  }

  it('TOOLKIT_PROFILES_LIST matches TOOLKIT_PROFILES keys', () => {
    expect(new Set(TOOLKIT_PROFILES_LIST)).toEqual(new Set(Object.keys(TOOLKIT_PROFILES)));
  });
});

describe('getToolsForToolkit', () => {
  it('full profile returns all tools', () => {
    const result = getToolsForToolkit(PINEPAPER_TOOLS, 'full');
    expect(result).toBe(PINEPAPER_TOOLS);
  });

  it('unknown profile returns all tools', () => {
    const result = getToolsForToolkit(PINEPAPER_TOOLS, 'nonexistent' as ToolkitProfile);
    expect(result).toBe(PINEPAPER_TOOLS);
  });

  it('minimal profile returns fewer tools than full', () => {
    const result = getToolsForToolkit(PINEPAPER_TOOLS, 'minimal');
    expect(result.length).toBeLessThan(PINEPAPER_TOOLS.length);
    expect(result.length).toBeGreaterThan(10);
  });

  it('agent profile returns a mid-range tool count', () => {
    const result = getToolsForToolkit(PINEPAPER_TOOLS, 'agent');
    expect(result.length).toBeGreaterThan(30);
    expect(result.length).toBeLessThan(80);
  });

  it('diagram profile returns fewer tools than agent', () => {
    const diagram = getToolsForToolkit(PINEPAPER_TOOLS, 'diagram');
    const agent = getToolsForToolkit(PINEPAPER_TOOLS, 'agent');
    expect(diagram.length).toBeLessThan(agent.length);
  });

  it('filtered profiles only contain tools from their tag groups', () => {
    const profiles: ToolkitProfile[] = ['agent', 'diagram', 'map', 'font', 'minimal'];
    for (const profile of profiles) {
      const tags = TOOLKIT_PROFILES[profile];
      const allowed = new Set<string>();
      for (const tag of tags) {
        for (const name of TOOL_TAGS[tag]) {
          allowed.add(name);
        }
      }
      const result = getToolsForToolkit(PINEPAPER_TOOLS, profile);
      for (const tool of result) {
        expect(allowed.has(tool.name)).toBe(true);
      }
    }
  });

  it('preserves tool order from PINEPAPER_TOOLS', () => {
    const result = getToolsForToolkit(PINEPAPER_TOOLS, 'agent');
    const originalIndices = result.map(t => PINEPAPER_TOOLS.findIndex(o => o.name === t.name));
    for (let i = 1; i < originalIndices.length; i++) {
      expect(originalIndices[i]).toBeGreaterThan(originalIndices[i - 1]);
    }
  });

  it('composes with verbosity filtering', () => {
    const compact = getToolsForVerbosity('compact');
    const filtered = getToolsForToolkit(compact, 'agent');

    // Should be fewer than full compact set
    expect(filtered.length).toBeLessThan(compact.length);
    // Should be same count as filtering verbose then applying toolkit
    const verboseFiltered = getToolsForToolkit(PINEPAPER_TOOLS, 'agent');
    expect(filtered.length).toBe(verboseFiltered.length);
  });

  it('pinepaper_tool_guide is included in all filtered profiles', () => {
    const profiles: ToolkitProfile[] = ['agent', 'diagram', 'map', 'font', 'minimal'];
    for (const profile of profiles) {
      const result = getToolsForToolkit(PINEPAPER_TOOLS, profile);
      const hasGuide = result.some(t => t.name === 'pinepaper_tool_guide');
      expect(hasGuide).toBe(true);
    }
  });
});

// =============================================================================
// DETECTION FUNCTIONS
// =============================================================================

describe('detectToolkitFromEnvironment', () => {
  const originalEnv = process.env.PINEPAPER_TOOLKIT;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.PINEPAPER_TOOLKIT;
    } else {
      process.env.PINEPAPER_TOOLKIT = originalEnv;
    }
  });

  it('defaults to agent when not set', () => {
    delete process.env.PINEPAPER_TOOLKIT;
    expect(detectToolkitFromEnvironment()).toBe('agent');
  });

  it('returns explicit value when set', () => {
    process.env.PINEPAPER_TOOLKIT = 'full';
    expect(detectToolkitFromEnvironment()).toBe('full');
  });

  it('returns agent for invalid value', () => {
    process.env.PINEPAPER_TOOLKIT = 'nonexistent';
    expect(detectToolkitFromEnvironment()).toBe('agent');
  });
});

describe('detectVerbosityFromEnvironment', () => {
  const origVerbosity = process.env.PINEPAPER_VERBOSITY;
  const origLegacy = process.env.PINEPAPER_TOOL_VERBOSITY;

  afterEach(() => {
    if (origVerbosity === undefined) delete process.env.PINEPAPER_VERBOSITY;
    else process.env.PINEPAPER_VERBOSITY = origVerbosity;
    if (origLegacy === undefined) delete process.env.PINEPAPER_TOOL_VERBOSITY;
    else process.env.PINEPAPER_TOOL_VERBOSITY = origLegacy;
  });

  it('defaults to compact when not set', () => {
    delete process.env.PINEPAPER_VERBOSITY;
    delete process.env.PINEPAPER_TOOL_VERBOSITY;
    expect(detectVerbosityFromEnvironment()).toBe('compact');
  });

  it('PINEPAPER_VERBOSITY takes precedence over legacy', () => {
    process.env.PINEPAPER_VERBOSITY = 'verbose';
    process.env.PINEPAPER_TOOL_VERBOSITY = 'compact';
    expect(detectVerbosityFromEnvironment()).toBe('verbose');
  });

  it('falls back to PINEPAPER_TOOL_VERBOSITY (legacy)', () => {
    delete process.env.PINEPAPER_VERBOSITY;
    process.env.PINEPAPER_TOOL_VERBOSITY = 'verbose';
    expect(detectVerbosityFromEnvironment()).toBe('verbose');
  });

  it('supports minimal value', () => {
    process.env.PINEPAPER_VERBOSITY = 'minimal';
    expect(detectVerbosityFromEnvironment()).toBe('minimal');
  });

  it('returns compact for invalid value', () => {
    process.env.PINEPAPER_VERBOSITY = 'invalid';
    delete process.env.PINEPAPER_TOOL_VERBOSITY;
    expect(detectVerbosityFromEnvironment()).toBe('compact');
  });
});

describe('isToolkitExplicitlySet', () => {
  const originalEnv = process.env.PINEPAPER_TOOLKIT;

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.PINEPAPER_TOOLKIT;
    else process.env.PINEPAPER_TOOLKIT = originalEnv;
  });

  it('returns false when not set', () => {
    delete process.env.PINEPAPER_TOOLKIT;
    expect(isToolkitExplicitlySet()).toBe(false);
  });

  it('returns true when set to valid value', () => {
    process.env.PINEPAPER_TOOLKIT = 'full';
    expect(isToolkitExplicitlySet()).toBe(true);
  });

  it('returns false for invalid value', () => {
    process.env.PINEPAPER_TOOLKIT = 'invalid';
    expect(isToolkitExplicitlySet()).toBe(false);
  });
});

describe('isVerbosityExplicitlySet', () => {
  const origVerbosity = process.env.PINEPAPER_VERBOSITY;
  const origLegacy = process.env.PINEPAPER_TOOL_VERBOSITY;

  afterEach(() => {
    if (origVerbosity === undefined) delete process.env.PINEPAPER_VERBOSITY;
    else process.env.PINEPAPER_VERBOSITY = origVerbosity;
    if (origLegacy === undefined) delete process.env.PINEPAPER_TOOL_VERBOSITY;
    else process.env.PINEPAPER_TOOL_VERBOSITY = origLegacy;
  });

  it('returns false when not set', () => {
    delete process.env.PINEPAPER_VERBOSITY;
    delete process.env.PINEPAPER_TOOL_VERBOSITY;
    expect(isVerbosityExplicitlySet()).toBe(false);
  });

  it('returns true when PINEPAPER_VERBOSITY is set', () => {
    process.env.PINEPAPER_VERBOSITY = 'compact';
    expect(isVerbosityExplicitlySet()).toBe(true);
  });

  it('returns true when legacy var is set', () => {
    delete process.env.PINEPAPER_VERBOSITY;
    process.env.PINEPAPER_TOOL_VERBOSITY = 'verbose';
    expect(isVerbosityExplicitlySet()).toBe(true);
  });
});

// =============================================================================
// CLIENT PROFILE AUTO-DETECTION
// =============================================================================

describe('getClientProfile', () => {
  it('returns profile for known clients', () => {
    expect(getClientProfile('claude-desktop')).toEqual({ toolkit: 'full', verbosity: 'compact' });
    expect(getClientProfile('claude-code')).toEqual({ toolkit: 'agent', verbosity: 'compact' });
    expect(getClientProfile('cursor')).toEqual({ toolkit: 'full', verbosity: 'compact' });
    expect(getClientProfile('windsurf')).toEqual({ toolkit: 'full', verbosity: 'compact' });
  });

  it('returns null for unknown clients', () => {
    expect(getClientProfile('unknown-client')).toBeNull();
    expect(getClientProfile('')).toBeNull();
  });

  it('case-insensitive matching', () => {
    expect(getClientProfile('Claude-Desktop')).toEqual({ toolkit: 'full', verbosity: 'compact' });
    expect(getClientProfile('CURSOR')).toEqual({ toolkit: 'full', verbosity: 'compact' });
  });

  it('prefix matching works', () => {
    expect(getClientProfile('claude-desktop-v2')).toEqual({ toolkit: 'full', verbosity: 'compact' });
    expect(getClientProfile('cursor-nightly')).toEqual({ toolkit: 'full', verbosity: 'compact' });
  });
});
