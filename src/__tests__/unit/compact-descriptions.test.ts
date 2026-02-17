/**
 * Compact & Minimal Descriptions Tests
 *
 * Validates the multi-tier tool description system:
 * - Compact: 13 manually written shorter descriptions
 * - Minimal: 1-line summaries for ALL tools
 * - getToolsForVerbosity returns correct tool sets for all tiers
 * - pinepaper_tool_guide tool definition exists
 * - AI_AGENT_GUIDE constant is exported
 */

import { describe, it, expect } from 'bun:test';
import { COMPACT_DESCRIPTIONS } from '../../tools/compact-descriptions.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';
import {
  PINEPAPER_TOOLS,
  AI_AGENT_GUIDE,
  getToolsForVerbosity,
} from '../../tools/definitions.js';

const EXPECTED_COMPACT_COUNT = 29;
const toolNameSet = new Set(PINEPAPER_TOOLS.map(t => t.name));

describe('Compact Descriptions', () => {
  const compactKeys = Object.keys(COMPACT_DESCRIPTIONS);

  it(`has exactly ${EXPECTED_COMPACT_COUNT} entries`, () => {
    expect(compactKeys.length).toBe(EXPECTED_COMPACT_COUNT);
  });

  it('every key is a real tool name', () => {
    for (const key of compactKeys) {
      expect(toolNameSet.has(key)).toBe(true);
    }
  });

  it('every compact description is non-empty (>20 chars)', () => {
    for (const [name, desc] of Object.entries(COMPACT_DESCRIPTIONS)) {
      expect(desc.length).toBeGreaterThan(20);
    }
  });

  it('every compact description is shorter than its verbose counterpart', () => {
    for (const [name, compactDesc] of Object.entries(COMPACT_DESCRIPTIONS)) {
      const verbose = PINEPAPER_TOOLS.find(t => t.name === name);
      expect(verbose).toBeDefined();
      const verboseLen = verbose!.description.length;
      const compactLen = compactDesc.length;
      expect(compactLen).toBeLessThan(verboseLen);
    }
  });

  it('compact mode saves at least 15K chars total', () => {
    let totalSaved = 0;
    for (const [name, compactDesc] of Object.entries(COMPACT_DESCRIPTIONS)) {
      const verbose = PINEPAPER_TOOLS.find(t => t.name === name)!;
      totalSaved += verbose.description.length - compactDesc.length;
    }
    expect(totalSaved).toBeGreaterThanOrEqual(15000);
  });
});

describe('Minimal Descriptions', () => {
  const minimalKeys = Object.keys(MINIMAL_DESCRIPTIONS);

  it('covers every tool in PINEPAPER_TOOLS', () => {
    const missing = PINEPAPER_TOOLS.map(t => t.name).filter(n => !MINIMAL_DESCRIPTIONS[n]);
    expect(missing).toEqual([]);
  });

  it('every key is a real tool name', () => {
    for (const key of minimalKeys) {
      expect(toolNameSet.has(key)).toBe(true);
    }
  });

  it('every minimal description is non-empty and concise (<200 chars)', () => {
    for (const [name, desc] of Object.entries(MINIMAL_DESCRIPTIONS)) {
      expect(desc.length).toBeGreaterThan(10);
      expect(desc.length).toBeLessThan(200);
    }
  });

  it('every minimal description is shorter than its verbose counterpart', () => {
    for (const [name, minimalDesc] of Object.entries(MINIMAL_DESCRIPTIONS)) {
      const verbose = PINEPAPER_TOOLS.find(t => t.name === name);
      if (!verbose) continue; // pinepaper_tool_guide self-reference
      expect(minimalDesc.length).toBeLessThan(verbose.description.length);
    }
  });
});

describe('getToolsForVerbosity', () => {
  it('verbose mode returns original PINEPAPER_TOOLS', () => {
    const tools = getToolsForVerbosity('verbose');
    expect(tools).toBe(PINEPAPER_TOOLS);
  });

  it('compact mode returns same tool count', () => {
    const tools = getToolsForVerbosity('compact');
    expect(tools.length).toBe(PINEPAPER_TOOLS.length);
  });

  it('compact mode swaps exactly 13 descriptions', () => {
    const tools = getToolsForVerbosity('compact');
    let swappedCount = 0;
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].description !== PINEPAPER_TOOLS[i].description) {
        swappedCount++;
      }
    }
    expect(swappedCount).toBe(EXPECTED_COMPACT_COUNT);
  });

  it('compact mode preserves tool names and inputSchema', () => {
    const tools = getToolsForVerbosity('compact');
    for (let i = 0; i < tools.length; i++) {
      expect(tools[i].name).toBe(PINEPAPER_TOOLS[i].name);
      expect(tools[i].inputSchema).toEqual(PINEPAPER_TOOLS[i].inputSchema);
    }
  });

  it('compact descriptions match COMPACT_DESCRIPTIONS map', () => {
    const tools = getToolsForVerbosity('compact');
    for (const tool of tools) {
      if (COMPACT_DESCRIPTIONS[tool.name]) {
        expect(tool.description).toBe(COMPACT_DESCRIPTIONS[tool.name]);
      }
    }
  });

  // --- Minimal tier tests ---

  it('minimal mode returns same tool count as verbose', () => {
    const tools = getToolsForVerbosity('minimal');
    expect(tools.length).toBe(PINEPAPER_TOOLS.length);
  });

  it('minimal mode swaps descriptions for all tools with minimal entries', () => {
    const tools = getToolsForVerbosity('minimal');
    for (const tool of tools) {
      if (MINIMAL_DESCRIPTIONS[tool.name]) {
        expect(tool.description).toBe(MINIMAL_DESCRIPTIONS[tool.name]);
      }
    }
  });

  it('minimal mode preserves tool names and inputSchema', () => {
    const tools = getToolsForVerbosity('minimal');
    for (let i = 0; i < tools.length; i++) {
      expect(tools[i].name).toBe(PINEPAPER_TOOLS[i].name);
      expect(tools[i].inputSchema).toEqual(PINEPAPER_TOOLS[i].inputSchema);
    }
  });

  it('minimal mode produces significantly less text than verbose', () => {
    const verboseTotal = PINEPAPER_TOOLS.reduce((s, t) => s + t.description.length, 0);
    const minimalTools = getToolsForVerbosity('minimal');
    const minimalTotal = minimalTools.reduce((s, t) => s + t.description.length, 0);
    // Minimal should be at most 30% of verbose
    expect(minimalTotal).toBeLessThan(verboseTotal * 0.3);
  });
});

// =============================================================================
// AI AGENT GUIDE & TOOL GUIDE
// =============================================================================

describe('AI_AGENT_GUIDE', () => {
  it('is a non-empty string', () => {
    expect(typeof AI_AGENT_GUIDE).toBe('string');
    expect(AI_AGENT_GUIDE.length).toBeGreaterThan(500);
  });

  it('contains key workflow sections', () => {
    expect(AI_AGENT_GUIDE).toContain('WORKFLOW');
    expect(AI_AGENT_GUIDE).toContain('BATCH OPERATIONS');
    expect(AI_AGENT_GUIDE).toContain('GENERATORS');
    expect(AI_AGENT_GUIDE).toContain('VISUAL COMPOSITION');
  });
});

describe('pinepaper_tool_guide tool definition', () => {
  const guideTool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_tool_guide');

  it('exists in PINEPAPER_TOOLS', () => {
    expect(guideTool).toBeDefined();
  });

  it('has readOnlyHint annotation', () => {
    expect(guideTool!.annotations?.readOnlyHint).toBe(true);
  });

  it('has optional tool and category input properties', () => {
    const schema = guideTool!.inputSchema as { properties: Record<string, unknown>; required?: string[] };
    expect(schema.properties.tool).toBeDefined();
    expect(schema.properties.category).toBeDefined();
    expect(schema.required).toBeUndefined();
  });
});
