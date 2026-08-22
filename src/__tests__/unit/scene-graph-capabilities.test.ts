import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import {
  SceneGraphInputSchema,
  QueryCapabilitiesInputSchema,
} from '../../types/schemas.js';
import { handleToolCall } from '../../tools/handlers.js';

describe('pinepaper_scene_graph tool', () => {
  it('validates a correct interactive quiz scene graph', () => {
    const valid = {
      graph: {
        start: 'q1',
        nodes: [
          {
            id: 'q1',
            prompt: 'Which planet is the Red Planet?',
            answers: [
              { text: 'Mars', correct: true, to: 'win' },
              { text: 'Venus', to: 'lose' },
            ],
          },
          { id: 'win', kind: 'end', text: 'Correct!' },
          { id: 'lose', kind: 'end', text: 'Try again.' },
        ],
      },
      opts: {
        style: { panelColor: '#1E1B4B', textColor: '#F8FAFC' },
        scoreItemId: 'score_display',
      },
    };
    const parsed = SceneGraphInputSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
  });

  it('generates valid executable code for scene graph creation', () => {
    const input = SceneGraphInputSchema.parse({
      graph: {
        start: 'q1',
        nodes: [
          {
            id: 'q1',
            prompt: 'Question 1',
            answers: [{ text: 'Option A', to: 'q2' }],
          },
          { id: 'q2', kind: 'end', text: 'Finished' },
        ],
      },
    });
    const code = codeGenerator.generateSceneGraph(input);
    expect(code).toContain('app.createSceneGraph');
    expect(code).toContain('"q1"');
    expect(code).toContain('"q2"');
    expect(() => new Function(code)).not.toThrow();
  });

  it('handleToolCall executes pinepaper_scene_graph in code mode', async () => {
    const result = await handleToolCall('pinepaper_scene_graph', {
      graph: {
        nodes: [
          // kind: 'end' matters — a card that is not terminal and has no way out
          // is a dead end, and the engine refuses the whole graph over it.
          { id: 'intro', kind: 'end', text: 'Welcome to the interactive story.' },
        ],
      },
    });
    expect(result.content).toBeDefined();
    expect(JSON.stringify(result.content)).toContain('app.createSceneGraph');
  });
});

describe('pinepaper_query_capabilities tool', () => {
  it('validates list / choose / coverage / find inputs', () => {
    expect(QueryCapabilitiesInputSchema.safeParse({ action: 'list', kind: 'effect' }).success).toBe(true);
    expect(QueryCapabilitiesInputSchema.safeParse({
      action: 'choose',
      mood: 'triumphant',
      subject: 'victory celebration',
      seed: 'card_win',
    }).success).toBe(true);
    expect(QueryCapabilitiesInputSchema.safeParse({ action: 'coverage' }).success).toBe(true);
    expect(QueryCapabilitiesInputSchema.safeParse({ action: 'find', key: 'decrypt' }).success).toBe(true);
  });

  it('generates executable code for querying capabilities', () => {
    const input = QueryCapabilitiesInputSchema.parse({
      action: 'choose',
      kind: 'effect',
      mood: 'triumphant',
      subject: 'celebration win',
      seed: 'seed123',
    });
    const code = codeGenerator.generateQueryCapabilities(input);
    expect(code).toContain('app.getCapabilities');
    expect(code).toContain('"choose"');
    expect(code).toContain('"triumphant"');
    expect(() => new Function(code)).not.toThrow();
  });

  it('handleToolCall executes pinepaper_query_capabilities in code mode', async () => {
    const result = await handleToolCall('pinepaper_query_capabilities', {
      action: 'list',
      kind: 'style',
    });
    expect(result.content).toBeDefined();
    expect(JSON.stringify(result.content)).toContain('Query capabilities');
  });
});

describe('pinepaper_scene_graph — structural integrity is checked HERE', () => {
  // In code mode nothing executes: the snippet is handed to the caller and the
  // engine never sees the graph. A dangling edge that is only caught at runtime
  // is caught by nobody.
  const parse = (graph: unknown) => SceneGraphInputSchema.safeParse({ graph });

  it('rejects an answer pointing at a node that does not exist', () => {
    const r = parse({
      nodes: [
        { id: 'q1', prompt: 'Q', answers: [{ text: 'A', to: 'nowhere' }] },
        { id: 'win', kind: 'end', text: 'Done' },
      ],
    });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('does not exist');
  });

  it('rejects a start that names no node', () => {
    const r = parse({ start: 'nope', nodes: [{ id: 'a', kind: 'end', text: 'x' }] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('start node');
  });

  it('rejects duplicate ids — the engine keys a Map, so the second one wins silently', () => {
    const r = parse({ nodes: [
      { id: 'a', kind: 'end', text: 'first' },
      { id: 'a', kind: 'end', text: 'second' },
    ] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('duplicate node id');
  });

  it('rejects a non-terminal card with no answers and no next', () => {
    const r = parse({ nodes: [{ id: 'stuck', prompt: 'now what?' }] });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('no way out');
  });

  it('accepts `next` — a linear story beat, which the schema used to drop', () => {
    const r = parse({
      nodes: [
        { id: 'beat1', text: 'Once upon a time', next: 'beat2', duration: 4 },
        { id: 'beat2', kind: 'end', text: 'The end', outcome: 'win' },
      ],
    });
    expect(r.success).toBe(true);
    // zod strips unknown keys, so a field the schema omits never reaches the
    // engine at all — this asserts it survives the parse.
    const code = codeGenerator.generateSceneGraph(r.data!);
    expect(code).toContain('"next":"beat2"');
    expect(code).toContain('"duration":4');
    expect(code).toContain('"outcome":"win"');
  });

  it("accepts the engine's own word for a card, 'card'", () => {
    expect(parse({ nodes: [{ id: 'a', kind: 'card', prompt: 'Q', next: 'b' }, { id: 'b', kind: 'end', text: 'x' }] }).success).toBe(true);
  });
});

describe('pinepaper_scene_graph — the result reports what actually wired', () => {
  const graph = {
    start: 'q1',
    nodes: [
      { id: 'q1', prompt: 'Q', answers: [{ text: 'A', correct: true, to: 'win' }] },
      { id: 'win', kind: 'end' as const, text: 'Done' },
    ],
  };

  it('forwards failed / cycles / wired / start, not just ids', async () => {
    const code = codeGenerator.generateSceneGraph(SceneGraphInputSchema.parse({ graph }));
    const fn = new Function('app', code.replace('(async function()', 'return (async function()'));
    const res = await fn({
      createSceneGraph: async () => ({
        ok: true, errors: [], warnings: [], cycles: [['q1', 'q1']],
        wired: 3, failed: 2, entranced: 1, start: 'q1', ids: { q1: 'item_1' },
      }),
    });
    // A graph that renders completely and wires nothing still looks like a
    // success. `failed` is the only thing in the result that says otherwise.
    expect(res.failed).toBe(2);
    expect(res.wired).toBe(3);
    expect(res.cycles).toEqual([['q1', 'q1']]);
    expect(res.start).toBe('q1');
  });

  it('a refused plan returns early without those fields and still parses', async () => {
    const code = codeGenerator.generateSceneGraph(SceneGraphInputSchema.parse({ graph }));
    const fn = new Function('app', code.replace('(async function()', 'return (async function()'));
    const res = await fn({
      createSceneGraph: async () => ({ ok: false, errors: ['refused'], warnings: [], ids: {} }),
    });
    expect(res.success).toBe(false);
    expect(res.errors).toEqual(['refused']);
    expect(res.cycles).toEqual([]);
  });
});

describe('pinepaper_scene_graph — validate action', () => {
  it('calls validateSceneGraph and draws nothing', () => {
    const code = codeGenerator.generateSceneGraph(SceneGraphInputSchema.parse({
      action: 'validate',
      graph: { nodes: [{ id: 'a', kind: 'end', text: 'x' }] },
    }));
    expect(code).toContain('app.validateSceneGraph');
    expect(code).not.toContain('app.createSceneGraph');
    expect(() => new Function(code)).not.toThrow();
  });

  it('surfaces reachability and cycles from the engine', async () => {
    const code = codeGenerator.generateSceneGraph(SceneGraphInputSchema.parse({
      action: 'validate',
      graph: { nodes: [{ id: 'a', kind: 'end', text: 'x' }] },
    }));
    const fn = new Function('app', code.replace('(function()', 'return (function()'));
    const res = fn({
      validateSceneGraph: () => ({ ok: true, errors: [], warnings: ['unreachable'], reachable: ['a'], cycles: [] }),
    });
    expect(res.ok).toBe(true);
    expect(res.reachable).toEqual(['a']);
    expect(res.warnings).toEqual(['unreachable']);
  });

  it('missing validateSceneGraph reports rather than throwing', () => {
    const code = codeGenerator.generateSceneGraph(SceneGraphInputSchema.parse({
      action: 'validate',
      graph: { nodes: [{ id: 'a', kind: 'end', text: 'x' }] },
    }));
    const res = new Function('app', code.replace('(function()', 'return (function()'))({});
    expect(res.success).toBe(false);
    expect(res.error).toContain('update FxTool');
  });
});

describe('pinepaper_query_capabilities — warm', () => {
  it('omits the argument by default, since warming IS the default', () => {
    expect(codeGenerator.generateQueryCapabilities(
      QueryCapabilitiesInputSchema.parse({ action: 'list' }),
    )).toContain('app.getCapabilities()');
  });

  it('forwards an explicit opt-out', () => {
    const code = codeGenerator.generateQueryCapabilities(
      QueryCapabilitiesInputSchema.parse({ action: 'list', warm: false }),
    );
    expect(code).toContain('app.getCapabilities({"warm":false})');
    expect(() => new Function(code)).not.toThrow();
  });
});
