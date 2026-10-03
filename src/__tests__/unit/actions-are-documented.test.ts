/**
 * Every action a tool's enum offers is named in its verbose description.
 *
 * The enum is in the schema at every verbosity, so a model sees the action
 * name — but not its arguments, and the call fails (1.6.19 gate: world3d had
 * 33 of 44 actions undocumented, text_style 4, query_capabilities 2).
 */

import { describe, it, expect } from 'bun:test';
import { getToolsForVerbosity } from '../../tools/index.js';

// BOTH levels: compact is the DEFAULT, and a compact override is separate
// prose. Batch 2 fixed the verbose text only, and the default users kept the
// stale one (gate run 3).
for (const level of ['verbose', 'compact'] as const)
describe(`every enum action is documented (${level})`, () => {
  for (const tool of getToolsForVerbosity(level)) {
    const actions = (tool.inputSchema?.properties as Record<string, { enum?: string[] }> | undefined)?.action?.enum;
    if (!actions) continue;
    it(tool.name, () => {
      const missing = actions.filter((a) => !new RegExp(`\\b${a}\\b`).test(tool.description ?? ''));
      expect(missing).toEqual([]);
    });
  }
});

// A description that QUOTES a count must quote the enum's. Minimal said
// "16 actions" for a font tool with 20 (gate run 3, D6); a count nobody
// regenerates is the one that goes stale.
for (const level of ['verbose', 'compact', 'minimal'] as const)
describe(`a quoted action count matches the enum (${level})`, () => {
  for (const tool of getToolsForVerbosity(level)) {
    const actions = (tool.inputSchema?.properties as Record<string, { enum?: string[] }> | undefined)?.action?.enum;
    const quoted = [...(tool.description ?? '').matchAll(/\b(\d+) actions\b/g)].map((m) => Number(m[1]));
    if (!actions || !quoted.length) continue;
    it(tool.name, () => {
      expect(quoted.filter((n) => n !== actions.length)).toEqual([]);
    });
  }
});
