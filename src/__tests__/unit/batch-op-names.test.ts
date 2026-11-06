/**
 * A batch op takes the names its standalone tool takes, and the reply says what was translated.
 *
 * Measured live before the change: animate's animationOptions { intensity, speed, delay } applied none of them and
 * reported nothing; relation params, effect params, generator params / region and mask options / preset were dropped.
 */
import { describe, it, expect } from 'bun:test';
import { normalizeBatchOperationNames, renamedArgumentsNote } from '../../tools/batch-op-names.js';
import { batchOpIgnoredPaths } from '../../tools/handlers.js';

const norm = (operations: unknown[]) => normalizeBatchOperationNames({ operations });
const ops = (r: { args: Record<string, unknown> }) => r.args.operations as Array<Record<string, unknown>>;

describe('standalone names are read on batch ops', () => {
  it('relation params → relationOptions; effect params → effectParams; generator params / region; mask preset / options', () => {
    const r = norm([
      { type: 'relation', sourceId: 'a', targetId: 'b', relationType: 'orbits', params: { radius: 3 } },
      { type: 'apply_effect', itemId: 'a', effectType: 'sparkle', params: { count: 7 } },
      { type: 'execute_generator', generatorName: 'drawSunburst', params: { rays: 9 }, region: { x: 0, y: 0, width: 9, height: 9 } },
      { type: 'apply_mask', itemId: 'a', preset: 'iris', options: { duration: 1.5 } },
    ]);
    const [rel, fx, gen, mask] = ops(r);
    expect(rel.relationOptions).toEqual({ radius: 3 });
    expect(fx.effectParams).toEqual({ count: 7 });
    expect(gen.generatorParams).toEqual({ rays: 9 });
    expect(gen.generatorRegion).toEqual({ x: 0, y: 0, width: 9, height: 9 });
    expect(mask.maskPreset).toBe('iris');
    expect(mask.maskOptions).toEqual({ duration: 1.5 });
    expect(r.renamed).toContain('operations[0].params → relationOptions');
    expect(r.renamed).toContain('operations[3].preset → maskPreset');
    // Nothing is left for the ignored check to report.
    expect(batchOpIgnoredPaths(r.args)).toEqual([]);
  });

  it("animate: pinepaper_animate's names, at the top or inside animationOptions, become the engine's", () => {
    const r = norm([
      { type: 'animate', itemId: 'a', animationType: 'pulse', intensity: 0.5, speed: 2 },
      { type: 'animate', itemId: 'b', animationType: 'pulse', animationOptions: { intensity: 0.5, delay: 0.4, waveform: 'square' } },
    ]);
    const [top, inner] = ops(r);
    expect(top.animationOptions).toEqual({ animationIntensity: 0.5, animationSpeed: 2 });
    expect(top.intensity).toBeUndefined();
    expect(inner.animationOptions).toEqual({ animationIntensity: 0.5, animationDelay: 0.4, animationWaveform: 'square' });
    expect(batchOpIgnoredPaths(r.args)).toEqual([]);
  });

  it('modify: flat changes go into properties; modify_item arguments the batch op lacks stay and are reported', () => {
    const r = norm([{ type: 'modify', itemId: 'a', opacity: 0.3, color: '#0f0', atTime: 2 }]);
    const [m] = ops(r);
    expect(m.properties).toEqual({ opacity: 0.3, color: '#0f0' });
    expect(m.atTime).toBe(2);
    expect(batchOpIgnoredPaths(r.args)).toEqual(['operations[0].atTime']);
  });

  it("the batch's own name wins; the other stays where the ignored check names it", () => {
    const r = norm([
      { type: 'relation', sourceId: 'a', relationType: 'orbits', relationOptions: { radius: 5 }, params: { radius: 3 } },
      { type: 'animate', itemId: 'a', animationType: 'pulse', animationOptions: { animationSpeed: 3 }, speed: 2 },
      { type: 'modify', itemId: 'a', properties: { opacity: 1 }, opacity: 0.3 },
    ]);
    const [rel, anim, mod] = ops(r);
    expect(rel.relationOptions).toEqual({ radius: 5 });
    expect(anim.animationOptions).toEqual({ animationSpeed: 3 });
    expect(mod.properties).toEqual({ opacity: 1 });
    expect(r.renamed).toEqual([]);
    expect(batchOpIgnoredPaths(r.args)).toEqual([
      'operations[0].params (a relation op takes its parameters as relationOptions)', 'operations[1].speed', 'operations[2].opacity',
    ]);
  });

  it('leaves the caller\'s args alone and changes nothing when there is nothing to translate', () => {
    const input = { operations: [{ type: 'relation', sourceId: 'a', relationType: 'orbits', params: { radius: 3 } }] };
    normalizeBatchOperationNames(input);
    expect(input.operations[0]).toHaveProperty('params');
    const clean = { operations: [{ type: 'create', itemType: 'circle' }] };
    expect(normalizeBatchOperationNames(clean)).toEqual({ args: clean, renamed: [], dropped: [] });
  });

  // An op copied from an older lint reply carried a snapshot of the studio's registry, and an update op writes what it is
  // given into the live relation: the snapshot then replaced the live registry for good, because the engine only fills an
  // empty slot. A rule that resolves items through it (the collection family) was left reading a dead object.
  it('studio-private keys in relationOptions do not reach the studio, and the reply says so', () => {
    const r = norm([{ type: 'relation', sourceId: 'a', relationType: 'orbits', update: true, relationOptions: { radius: 5, _itemRegistry: { app: '[deep]' } } },
      { type: 'relation', sourceId: 'b', relationType: 'orbits', params: { speed: 1, _startTime: 2 } }]);
    const [first, second] = ops(r);
    expect(first.relationOptions).toEqual({ radius: 5 });
    expect(second.relationOptions).toEqual({ speed: 1 });
    expect(r.dropped).toEqual(['operations[0].relationOptions._itemRegistry', 'operations[1].relationOptions._startTime']);
  });

  it('the reply line names each translation', () => {
    expect(renamedArgumentsNote(['operations[0].params → relationOptions'])).toBe("Read under the batch op's own names: operations[0].params → relationOptions.");
  });
});

describe('an animationOptions key app.animate never reads is named', () => {
  it('a misspelt key gets a "did you mean"; a read key passes; the reply carries it on the op', async () => {
    const { animationOptionWarning, codeGenerator } = await import('../../types/code-generator.js');
    expect(animationOptionWarning({ animationIntensity: 0.4 })).toBeNull();
    const w = animationOptionWarning({ animationIntensty: 0.4, glow: true });
    expect(w).toContain('does not read animationIntensty, glow');
    expect(w).toContain('animationIntensty → animationIntensity?');
    const code = codeGenerator.generateAgentBatchExecute({ operations: [{ type: 'animate', itemId: 'a', animationType: 'pulse', animationOptions: { glow: true } }] } as never);
    expect(code).toContain('warning:');
  });
});

// A client that has structuredContent reads that and not the trailing text blocks, so a list that only rides in a later
// block never reached it. The reply's own JSON is the one place every client reads.
describe('the reply carries what was changed or ignored in its own JSON', () => {
  const body = async (operations: unknown[]) => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations }, opts);
    return { r, json: JSON.parse((r.content[0] as { text: string }).text) };
  };
  const controller = { connected: true, connect: async () => undefined, executeCode: async () => ({ success: true, result: { success: true, itemIds: [], results: [] } }) };
  const opts = { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' as const };
  const translated = [{ type: 'relation', sourceId: 'a', targetId: 'b', relationType: 'orbits', params: { radius: 5 } }];

  it('a relation op given params', async () => {
    const { json, r } = await body(translated);
    expect(json.translatedArguments).toEqual(['operations[0].params → relationOptions']);
    // Once: the same list as a second text block would only cost the reader tokens.
    expect(r.content.filter((c) => (c as { text?: string }).text?.includes('Read under'))).toHaveLength(0);
  });

  it('an animate op given a top-level intensity and speed', async () => {
    const { json } = await body([{ type: 'animate', itemId: 'a', animationType: 'pulse', intensity: 0.4, speed: 2 }]);
    expect(json.translatedArguments).toEqual(['operations[0].speed → animationOptions.animationSpeed', 'operations[0].intensity → animationOptions.animationIntensity']);
  });

  it('a dropped private key and an ignored argument', async () => {
    const { json } = await body([{ type: 'relation', sourceId: 'a', relationType: 'orbits', relationOptions: { _itemRegistry: {} }, wibble: 1 }]);
    expect(json.droppedArguments).toEqual(['operations[0].relationOptions._itemRegistry']);
    expect(json.ignoredArguments).toEqual(expect.arrayContaining(['operations[0].wibble']));
  });

  it('a reply that is not JSON keeps the list as a line of text', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const r = await handleToolCall('pinepaper_agent_batch_execute', { operations: translated });
    expect(r.content.map((c) => (c as { text?: string }).text ?? '').join('\n')).toContain('operations[0].params → relationOptions');
  });

  it('adds nothing when there is nothing to say', async () => {
    const { json } = await body([{ type: 'create', itemType: 'circle' }]);
    expect(Object.keys(json)).not.toEqual(expect.arrayContaining(['translatedArguments']));
    expect(json.droppedArguments).toBeUndefined();
    expect(json.ignoredArguments).toBeUndefined();
  });
});
