import { describe, it, expect } from 'bun:test';
import { getToolByName } from '../../tools/definitions.js';
import { HandDrawnInputSchema, CreateCharacterInputSchema, CharacterActionInputSchema, CharacterPoseInputSchema } from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

describe('pinepaper_hand_drawn', () => {
  it('is registered in PINEPAPER_TOOLS', () => {
    const tool = getToolByName('pinepaper_hand_drawn');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('pinepaper_hand_drawn');
    expect(tool?.description).toContain('hand-drawn look');
    expect(tool?.inputSchema?.type).toBe('object');
  });

  it('validates schema options correctly', () => {
    const parsedDefault = HandDrawnInputSchema.parse({});
    // No default on style or fps: with one, the mode / posterizeFps aliases were never read.
    expect(parsedDefault.style).toBeUndefined();
    expect(parsedDefault.fps).toBeUndefined();
    expect(parsedDefault.roughness).toBe(2);
    expect(parsedDefault.bowing).toBe(1);

    const parsedCustom = HandDrawnInputSchema.parse({
      itemId: 'item_123',
      mode: 'wobble',
      roughness: 3.5,
      bowing: 2,
      posterizeFps: 8,
      seed: 42,
      duration: 3,
    });
    expect(parsedCustom.itemId).toBe('item_123');
    expect(parsedCustom.mode).toBe('wobble');
    expect(parsedCustom.roughness).toBe(3.5);
    expect(parsedCustom.bowing).toBe(2);
    expect(parsedCustom.posterizeFps).toBe(8);
    expect(parsedCustom.seed).toBe(42);
    expect(parsedCustom.duration).toBe(3);
  });

  // Run the generated script against a stub app and read its result.
  const run = (code: string, app: Record<string, unknown>) =>
    new Function('app', 'HandDrawn', 'window', `return (\n${code.trim().replace(/;$/, '')}\n)`)(app, undefined, {});

  it('sketchy jitters through the engine and returns the registry id, not the Paper id', () => {
    const calls: unknown[] = [];
    const item = { id: 42, data: { registryId: 'item_1' }, segments: [] };
    const code = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'sketchy' } as never);
    expect(code).toContain('applyHandDrawnStyle');
    const out = run(code, { getItemById: () => ({ item }), applyHandDrawnJitter: (...a: unknown[]) => calls.push(a) });
    expect(out).toMatchObject({ success: true, itemId: 'item_1', style: 'sketchy' });
    expect(calls.length).toBe(1);
  });

  it('mode is read when style is absent', () => {
    const code = codeGenerator.generateHandDrawn(HandDrawnInputSchema.parse({ itemId: 'item_1', mode: 'wobble' }));
    expect(run(code, {}).success).toBe(false);
  });

  it('reveal and ink_reveal keyframe trimEnd 0 -> 1, merged, over duration', () => {
    for (const style of ['reveal', 'ink_reveal'] as const) {
      const calls: unknown[][] = [];
      const item = { segments: [{}], data: { keyframes: [] } };
      const code = codeGenerator.generateHandDrawn({ itemId: 'item_1', style, duration: 1.5 } as never);
      expect(code).not.toContain('onFrame');
      const out = run(code, { getItemById: () => ({ item }), addAnimation: (...a: unknown[]) => calls.push(a) });
      expect(out.success).toBe(true);
      expect(calls[0][0]).toBe('item_1');
      expect(calls[0][1]).toEqual([{ time: 0, properties: { trimEnd: 0 }, easing: 'linear' }, { time: 1.5, properties: { trimEnd: 1 }, easing: 'linear' }]);
      expect(calls[0][2]).toMatchObject({ duration: 1.5, mode: 'merge' });
    }
  });

  it('reveal on an item with no path (text, image) is refused, nothing keyframed', () => {
    const calls: unknown[] = [];
    const code = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'reveal' } as never);
    const out = run(code, { getItemById: () => ({ item: { className: 'PointText', data: {} } }), addAnimation: (...a: unknown[]) => calls.push(a) });
    expect(out.success).toBe(false);
    expect(out.error).toContain('PointText');
    expect(calls.length).toBe(0);
  });

  it('reveal on a group of paths keyframes it', () => {
    const calls: unknown[] = [];
    const item = { children: [{ segments: [{}] }], data: {} };
    const code = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'reveal' } as never);
    const out = run(code, { getItemById: () => ({ item }), addAnimation: (...a: unknown[]) => calls.push(a) });
    expect(out.success).toBe(true);
    expect(calls.length).toBe(1);
  });

  it('reveal without an itemId is refused', () => {
    const out = run(codeGenerator.generateHandDrawn({ style: 'reveal' } as never), {});
    expect(out.success).toBe(false);
    expect(out.error).toContain('itemId');
  });

  it('wobble and stop_motion are refused with the design_medium ink call, nothing run', () => {
    for (const style of ['wobble', 'stop_motion'] as const) {
      const code = codeGenerator.generateHandDrawn({ itemId: 'item_1', style, posterizeFps: 8, seed: 3, roughness: 4 } as never);
      expect(code).not.toContain('onFrame');
      const out = run(code, {});
      expect(out.success).toBe(false);
      expect(out.error).toContain('Nothing was changed');
      expect(out.use).toEqual({
        tool: 'pinepaper_design_medium',
        args: { action: 'apply', itemId: 'item_1', medium: 'ink', options: { keepColor: true, fps: 8, seed: 3, amplitude: 4 } },
      });
    }
  });

  it('sketchy on an item with no points is refused, not reported done', () => {
    const code = codeGenerator.generateHandDrawn({ itemId: 'item_1' } as never);
    const out = run(code, { getItemById: () => ({ item: { data: {} } }) });
    expect(out.success).toBe(false);
  });

  it('handler executes pinepaper_hand_drawn call', async () => {
    const result = await handleToolCall('pinepaper_hand_drawn', {
      itemId: 'item_1',
      style: 'sketchy',
      roughness: 2.5,
    }, { mode: 'code' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('applyHandDrawnStyle');
  });
});

describe('character tool aliases for local models', () => {
  it('validates schema schemas tolerance for open-source model calls', () => {
    const char = CreateCharacterInputSchema.parse({
      concept: 'cat',
      randomFieldFromLocalLLM: 'ignored_cleanly',
    });
    expect(char.concept).toBe('cat');

    const act = CharacterActionInputSchema.parse({
      characterId: 'char_1',
      action: 'walk',
      extraLocalModelProperty: true,
    });
    expect(act.characterId).toBe('char_1');
    expect(act.action).toBe('walk');

    const pose = CharacterPoseInputSchema.parse({
      characterId: 'char_1',
      expression: 'smile',
    });
    expect(pose.expression).toBe('smile');
  });

  it('handler dispatches pinepaper_create_character', async () => {
    const result = await handleToolCall('pinepaper_create_character', {
      name: 'Hero',
      base: 'stickman',
    }, { mode: 'code' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('createCharacter');
  });

  it('handler dispatches pinepaper_character_action with locomotion', async () => {
    const result = await handleToolCall('pinepaper_character_action', {
      characterId: 'char_1',
      action: 'walk',
      speed: 120,
    }, { mode: 'code' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('locomotion');
  });

  it('handler rejects facial expressions passed to pinepaper_character_action with helpful suggestion', async () => {
    const result = await handleToolCall('pinepaper_character_action', {
      characterId: 'char_1',
      action: 'smile',
    }, { mode: 'code' });

    expect(result.isError).toBe(true);
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('facial expression');
    expect(text).toContain('pinepaper_character_pose');
  });

  it('handler dispatches pinepaper_character_pose', async () => {
    const result = await handleToolCall('pinepaper_character_pose', {
      characterId: 'char_1',
      expression: 'talk',
    }, { mode: 'code' });

    expect(result.isError).toBeFalsy();
    const text = result.content[0]?.type === 'text' ? result.content[0].text : '';
    expect(text).toContain('expresses');
  });
});
