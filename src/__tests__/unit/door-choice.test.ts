/**
 * Models are steered to the highest-level tool, not to the stock look
 * (tracker D72). The guide, the server instructions and start_job said
 * "everything in ONE batch_execute" and "use generators for rich backgrounds",
 * which is the procedural-backdrop + primitive-shapes + pulse result the
 * quality bar rejects.
 */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS, AI_AGENT_GUIDE, CHOOSE_THE_DOOR, getToolsForVerbosity } from '../../tools/definitions.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const INDEX = readFileSync(join(import.meta.dir, '..', '..', 'index.ts'), 'utf-8');
const FUNNEL = [
  /ALL operations go in batch_execute/i,
  /batch_execute \(everything/i,
  /everything in ONE call/i,
  /prefer these for backgrounds/i,
  /generators create much better visuals/i,
  /ALL ops in one call/i,
  /ONE call with ALL/i,
  /Execute ALL operations/i,
  /This is the ONLY workflow/i,
];

describe('the door choice (D72)', () => {
  it('every tool the door block names exists', () => {
    const names = new Set(PINEPAPER_TOOLS.map((t) => t.name));
    const named = [...CHOOSE_THE_DOOR.matchAll(/pinepaper_[a-z0-9_]+/g)].map((m) => m[0]);
    expect(named.length).toBeGreaterThan(10);
    expect(named.filter((n) => !names.has(n))).toEqual([]);
  });
  it('the guide and the server instructions both carry it', () => {
    expect(AI_AGENT_GUIDE).toContain('CHOOSE THE HIGHEST-LEVEL TOOL FIRST');
    expect(INDEX).toContain('${CHOOSE_THE_DOOR}');
  });
  it('nothing a model reads funnels everything into the batch or a generator backdrop', () => {
    const texts = [AI_AGENT_GUIDE, INDEX, ...(['verbose', 'compact', 'minimal'] as const).flatMap((l) => getToolsForVerbosity(l).map((t) => t.description ?? ''))];
    const hits = FUNNEL.flatMap((re) => texts.filter((t) => re.test(t)).map(() => String(re)));
    expect(hits).toEqual([]);
  });
});
