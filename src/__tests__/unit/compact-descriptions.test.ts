/**
 * Compact Descriptions Tests
 *
 * Validates the compact tool description system:
 * - All keys map to real tool names
 * - Exactly 13 entries
 * - Every compact description is shorter than its verbose counterpart
 * - getToolsForVerbosity returns correct tool sets
 */

import { describe, it, expect } from 'bun:test';
import { COMPACT_DESCRIPTIONS } from '../../tools/compact-descriptions.js';
import {
  PINEPAPER_TOOLS,
  getToolsForVerbosity,
} from '../../tools/definitions.js';

const EXPECTED_COUNT = 13;
const toolNameSet = new Set(PINEPAPER_TOOLS.map(t => t.name));

describe('Compact Descriptions', () => {
  const compactKeys = Object.keys(COMPACT_DESCRIPTIONS);

  it(`has exactly ${EXPECTED_COUNT} entries`, () => {
    expect(compactKeys.length).toBe(EXPECTED_COUNT);
  });

  it('every key is a real tool name', () => {
    for (const key of compactKeys) {
      expect(toolNameSet.has(key)).toBe(true);
    }
  });

  it('every compact description is non-empty (>100 chars)', () => {
    for (const [name, desc] of Object.entries(COMPACT_DESCRIPTIONS)) {
      expect(desc.length).toBeGreaterThan(100);
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
    expect(swappedCount).toBe(EXPECTED_COUNT);
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
});
