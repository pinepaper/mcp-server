/**
 * The agent lane (PINEPAPER_TOOLKIT=lane, src/tools/lane.ts): five existing tools, shown with descriptions that carry
 * the lessons, under a 10k-token contract (HYPERFRAMES_SCORECARD_PLAN T-8, T-9).
 *
 * What this pins is what the lane PROMISES, not what is easy to assert:
 * - every call the lane shows (its schemas and every example it prints) is one the full server accepts, because the
 *   lane is the same handlers and an example that the handler refuses is a lesson that teaches a failure;
 * - it names no tool it does not list;
 * - the contract an agent must load stays under budget.
 * Whether a fresh model builds T1 from it is behaviour, proved by scripts/acceptance/agent-lane-t1.ts, not here.
 */
import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS, getToolsForVerbosity } from '../../tools/definitions.js';
import { getToolsForToolkit } from '../../tools/toolkits.js';
import { LANE_TOOL_NAMES, LANE_TOOLS, LANE_INSTRUCTIONS, laneContractText } from '../../tools/lane.js';
import {
  AgentBatchExecuteInputSchema, AgentBatchOperationSchema, KeyframeAnimateInputSchema, PatternInputSchema,
  AgentExportInputSchema, LintSceneInputSchema, SetToolkitInputSchema,
} from '../../types/schemas.js';
import { validateBatchVocabulary, detectBatchPropertyTypos } from '../../ontology/hints.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../index.js';

async function connect(toolkit: string): Promise<Client> {
  const server = await createServer({ browserMode: false, executionMode: 'code', toolkit } as never);
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: 'lane-test', version: '0' });
  await client.connect(b);
  return client;
}

type JsonSchema = { type?: unknown; properties?: Record<string, JsonSchema>; items?: JsonSchema; enum?: unknown[]; oneOf?: JsonSchema[] };

const lane = getToolsForToolkit(PINEPAPER_TOOLS as never, 'lane' as never) as unknown as Array<{ name: string; description: string; inputSchema: JsonSchema }>;
const full = new Map(PINEPAPER_TOOLS.map((t) => [t.name, t]));

/** Every property path (and enum value) in `sub` exists in `sup`. */
function subsetProblems(sub: JsonSchema, sup: JsonSchema, path: string): string[] {
  const out: string[] = [];
  if (sub.enum) {
    const allowed = new Set(sup.enum ?? []);
    if (sup.enum) for (const v of sub.enum) if (!allowed.has(v)) out.push(`${path}: enum value ${String(v)} is not in the full schema`);
  }
  if (sup.oneOf && !sub.oneOf) {
    // A lane field that picks one branch of a full-schema union: it must fit some branch.
    const fits = sup.oneOf.some((branch) => subsetProblems(sub, branch, path).length === 0);
    return fits ? out : [...out, `${path} fits no branch of the full schema's oneOf`];
  }
  if (sub.properties) {
    for (const [k, v] of Object.entries(sub.properties)) {
      const s = sup.properties?.[k];
      if (!s) { out.push(`${path}.${k} is not in the full schema`); continue; }
      out.push(...subsetProblems(v, s, `${path}.${k}`));
    }
  }
  if (sub.items && sup.items) out.push(...subsetProblems(sub.items, sup.items, `${path}[]`));
  return out;
}

/** The one-line JSON examples a description prints: lines that are a whole JSON object. */
function exampleLines(text: string): Array<Record<string, unknown>> {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('{') && l.endsWith('}')).map((l) => JSON.parse(l));
}
function inlineExample(text: string): Record<string, unknown> {
  const m = /EXAMPLE: (\{.*\})\s*$/m.exec(text);
  if (!m) throw new Error('no EXAMPLE line');
  return JSON.parse(m[1]);
}

describe('the agent lane', () => {
  it('lists exactly the five lane tools, in lane order', () => {
    expect(lane.map((t) => t.name)).toEqual([...LANE_TOOL_NAMES]);
    expect(lane.length).toBe(5);
  });

  it('is the same tools whatever the verbosity', () => {
    for (const v of ['verbose', 'compact', 'minimal'] as const) {
      const got = getToolsForToolkit(getToolsForVerbosity(v) as never, 'lane' as never) as unknown as typeof lane;
      expect(got.map((t) => [t.name, t.description])).toEqual(lane.map((t) => [t.name, t.description]));
    }
  });

  it('shows each tool its lane description and a schema that is a subset of the full one', () => {
    for (const t of lane) {
      expect(t.description).toBe(LANE_TOOLS[t.name as keyof typeof LANE_TOOLS].description);
      expect(subsetProblems(t.inputSchema, full.get(t.name)!.inputSchema as JsonSchema, t.name)).toEqual([]);
    }
  });

  it('names no tool it does not list — descriptions or instructions', () => {
    const listed = new Set(LANE_TOOL_NAMES as readonly string[]);
    const texts = [LANE_INSTRUCTIONS, ...lane.map((t) => JSON.stringify(t))];
    const dangling = PINEPAPER_TOOLS.map((t) => t.name).filter((n) => !listed.has(n) && texts.some((x) => x.includes(n)));
    expect(dangling).toEqual([]);
  });

  it('the contract an agent loads is ≤ 10k tokens (bytes / 4, the tier study convention)', () => {
    const bytes = Buffer.byteLength(laneContractText(PINEPAPER_TOOLS as never), 'utf8');
    expect(bytes / 4).toBeLessThanOrEqual(10_000);
  });

  it('every batch op the description prints passes the batch schema and the vocabulary preflight', () => {
    const ops = exampleLines(LANE_TOOLS.pinepaper_agent_batch_execute.description);
    expect(ops.length).toBeGreaterThanOrEqual(8);
    for (const op of ops) expect(AgentBatchOperationSchema.safeParse(op).success, JSON.stringify(op)).toBe(true);
    const input = AgentBatchExecuteInputSchema.parse({ operations: ops });
    expect(validateBatchVocabulary(input.operations as never)).toEqual([]);
    expect(detectBatchPropertyTypos(input.operations as never)).toEqual([]);
  });

  it('every other tool\'s example is accepted by that tool', () => {
    expect(KeyframeAnimateInputSchema.safeParse(inlineExample(LANE_TOOLS.pinepaper_keyframe_animate.description)).success).toBe(true);
    expect(PatternInputSchema.safeParse(inlineExample(LANE_TOOLS.pinepaper_pattern.description)).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'mp4', duration: 8, fps: 30 }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'png', time: 4 }).success).toBe(true);
    expect(LintSceneInputSchema.safeParse({ cap: 5 }).success).toBe(true);
  });

  it('the lessons live in the tool they belong to', () => {
    const batch = LANE_TOOLS.pinepaper_agent_batch_execute.description;
    // Keyframe shape: values inside properties, and the wrong shape named.
    expect(batch).toContain('{"time":1,"properties":{"opacity":1}}, not {"time":1,"opacity":1}');
    expect(LANE_TOOLS.pinepaper_keyframe_animate.description).toContain('{"time":1,"properties":{"opacity":1}}');
    // Content in properties; position at the top level, and it is the centre.
    expect(batch).toContain('"properties":{"content":"SIGNAL / NOISE"');
    expect(batch).toMatch(/position \{x,y\} goes at the op's top level/);
    expect(batch).toMatch(/position is the item's CENTRE/);
    expect(batch).toContain('"anchor":"top-left"');
    // Export: the 5 s default duration.
    expect(LANE_TOOLS.pinepaper_agent_export.description).toMatch(/duration defaults to 5 s/);
  });

  it('set_toolkit can switch to it', () => {
    expect(SetToolkitInputSchema.parse({ toolkit: 'lane' }).toolkit).toBe('lane');
  });

  it('a lane server lists the five with their lane descriptions, and its instructions are the lane\'s', async () => {
    const client = await connect('lane');
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual([...LANE_TOOL_NAMES]);
    expect(tools.map((t) => t.description)).toEqual(LANE_TOOL_NAMES.map((n) => LANE_TOOLS[n].description));
    expect(client.getInstructions()).toBe(LANE_INSTRUCTIONS);
    // The handler behind the lane is the full one: the description's own batch runs (code mode here).
    const ops = exampleLines(LANE_TOOLS.pinepaper_agent_batch_execute.description).filter((o) => o.type !== 'modify');
    const r = await client.callTool({ name: 'pinepaper_agent_batch_execute', arguments: { operations: ops } });
    expect(r.isError, JSON.stringify(r.content).slice(0, 400)).toBeFalsy();
    await client.close();
  });

  it('the default surface says the lane exists, in the instructions and in tool_guide', async () => {
    const client = await connect('agent');
    expect(client.getInstructions()).toContain('PINEPAPER_TOOLKIT=lane');
    const guide = await client.callTool({ name: 'pinepaper_tool_guide', arguments: {} });
    expect(JSON.stringify(guide.content)).toContain('PINEPAPER_TOOLKIT=lane');
    const { tools } = await client.listTools();
    expect(tools.find((t) => t.name === 'pinepaper_tool_guide')!.description).toContain('PINEPAPER_TOOLKIT=lane');
    await client.close();
  });
});
