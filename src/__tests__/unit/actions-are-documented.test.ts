/**
 * Every action a tool's enum offers is named in its verbose description.
 *
 * The enum is in the schema at every verbosity, so a model sees the action
 * name — but not its arguments, and the call fails (1.6.19 gate: world3d had
 * 33 of 44 actions undocumented, text_style 4, query_capabilities 2).
 */

import { describe, it, expect } from 'bun:test';
import { getToolsForVerbosity } from '../../tools/index.js';
import { AgentBatchOperationTypeSchema } from '../../types/schemas.js';

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

for (const level of ['verbose', 'compact', 'minimal'] as const)
it(`agent_batch_execute's quoted op count matches the enum (${level})`, () => {
  const d = getToolsForVerbosity(level).find((t) => t.name === 'pinepaper_agent_batch_execute')?.description ?? '';
  const quoted = [...d.matchAll(/OPERATION TYPES \((\d+)\)/g)].map((m) => Number(m[1]));
  expect(quoted.filter((n) => n !== AgentBatchOperationTypeSchema.options.length)).toEqual([]);
});

// Minimal is one line, so it may abbreviate — but a list that stops short must
// say so with "…", or it reads as the whole enum (gate D6 follow-up: 14 tools).
describe('a partial action list is marked (minimal)', () => {
  for (const tool of getToolsForVerbosity('minimal')) {
    const actions = (tool.inputSchema?.properties as Record<string, { enum?: string[] }> | undefined)?.action?.enum;
    if (!actions) continue;
    it(tool.name, () => {
      const d = tool.description ?? '';
      const missing = actions.filter((a) => !new RegExp(`\\b${a}\\b`).test(d));
      expect(missing.length === 0 || d.includes('…')).toBe(true);
    });
  }
});
