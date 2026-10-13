import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS, getToolByName } from '../../tools/definitions.js';
import { HandDrawnInputSchema, CreateCharacterInputSchema, CharacterActionInputSchema, CharacterPoseInputSchema } from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { handleToolCall } from '../../tools/handlers.js';

describe('pinepaper_hand_drawn', () => {
  it('is registered in PINEPAPER_TOOLS', () => {
    const tool = getToolByName('pinepaper_hand_drawn');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('pinepaper_hand_drawn');
    expect(tool?.description).toContain('procedural hand-drawn sketchy strokes');
    expect(tool?.inputSchema?.type).toBe('object');
  });

  it('validates schema options correctly', () => {
    const parsedDefault = HandDrawnInputSchema.parse({});
    expect(parsedDefault.style).toBe('sketchy');
    expect(parsedDefault.roughness).toBe(2);
    expect(parsedDefault.bowing).toBe(1);
    expect(parsedDefault.fps).toBe(12);

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

  it('generateHandDrawn emits parseable JavaScript code for all styles', () => {
    const sketchyCode = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'sketchy' });
    expect(sketchyCode).toContain('applyHandDrawnStyle');
    expect(() => new Function(sketchyCode)).not.toThrow();

    const wobbleCode = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'wobble', fps: 10 });
    expect(wobbleCode).toContain('onFrame');
    expect(wobbleCode).toContain('posterizeFps');
    expect(() => new Function(wobbleCode)).not.toThrow();

    const revealCode = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'reveal', duration: 1.5 });
    expect(revealCode).toContain('reveal');
    expect(() => new Function(revealCode)).not.toThrow();

    const stopMotionCode = codeGenerator.generateHandDrawn({ itemId: 'item_1', style: 'stop_motion', posterizeFps: 8 });
    expect(stopMotionCode).toContain('posterizeFps');
    expect(() => new Function(stopMotionCode)).not.toThrow();
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
