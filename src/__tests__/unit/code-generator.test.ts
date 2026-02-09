/**
 * Code Generator Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import {
  mockTextItem,
  mockCircleItem,
  mockStarItem,
  mockOrbitsRelation,
  mockFollowsRelation,
  mockAttachedToRelation,
  mockPulseAnimation,
  mockFadeInKeyframes,
  mockSunburstGenerator,
  mockGridGenerator,
} from '../fixtures/index.js';

describe('PinePaperCodeGenerator', () => {
  describe('generateCreateItem', () => {
    it('should generate code for text item', () => {
      const code = codeGenerator.generateCreateItem(mockTextItem);

      expect(code).toContain("app.create('text'");
      expect(code).toContain('Hello World');
      expect(code).toContain('400');
      expect(code).toContain('300');
      expect(code).toContain('48'); // fontSize
      expect(code).toContain('registryId');
    });

    it('should generate code for circle item', () => {
      const code = codeGenerator.generateCreateItem(mockCircleItem);

      expect(code).toContain("app.create('circle'");
      expect(code).toContain('50'); // radius
      expect(code).toContain('#3b82f6'); // color
    });

    it('should generate code for star item', () => {
      const code = codeGenerator.generateCreateItem(mockStarItem);

      expect(code).toContain("app.create('star'");
      expect(code).toContain('60'); // radius1
      expect(code).toContain('30'); // radius2
    });

    it('should use default position when not provided', () => {
      const code = codeGenerator.generateCreateItem({
        itemType: 'circle',
        properties: { radius: 25 },
      });

      expect(code).toContain('x: 400');
      expect(code).toContain('y: 300');
    });

    it('should include historyManager.saveState', () => {
      const code = codeGenerator.generateCreateItem(mockTextItem);
      expect(code).toContain('app.historyManager.saveState()');
    });
  });

  describe('generateModifyItem', () => {
    it('should generate modify code with properties', () => {
      const code = codeGenerator.generateModifyItem({
        itemId: 'item_1',
        properties: { color: '#ff0000', opacity: 0.5 },
      });

      expect(code).toContain("app.select('item_1')");
      expect(code).toContain('app.modify(');
      expect(code).toContain('#ff0000');
      expect(code).toContain('0.5');
    });

    it('should use select then modify pattern', () => {
      const code = codeGenerator.generateModifyItem({
        itemId: 'item_1',
        properties: { color: '#ff0000' },
      });

      expect(code).toContain("app.select('item_1')");
      expect(code).toContain('app.modify(');
    });
  });

  describe('generateDeleteItem', () => {
    it('should generate delete code', () => {
      const code = codeGenerator.generateDeleteItem('item_5');

      expect(code).toContain("app.getItemById('item_5')");
      expect(code).toContain('item.remove()');
      expect(code).toContain("app.itemRegistry.remove('item_5')");
    });
  });

  describe('generateAddRelation', () => {
    it('should generate orbits relation code', () => {
      const code = codeGenerator.generateAddRelation(mockOrbitsRelation);

      expect(code).toContain("app.addRelation('item_2', 'item_1', 'orbits'");
      expect(code).toContain('150'); // radius
      expect(code).toContain('0.5'); // speed
    });

    it('should generate follows relation code', () => {
      const code = codeGenerator.generateAddRelation(mockFollowsRelation);

      expect(code).toContain("app.addRelation('item_3', 'item_1', 'follows'");
      expect(code).toContain('smoothing');
    });

    it('should generate attached_to relation code', () => {
      const code = codeGenerator.generateAddRelation(mockAttachedToRelation);

      expect(code).toContain("'attached_to'");
      expect(code).toContain('offset');
    });

    it('should include error handling for failed relation', () => {
      const code = codeGenerator.generateAddRelation(mockOrbitsRelation);
      expect(code).toContain('if (!success)');
    });
  });

  describe('generateRemoveRelation', () => {
    it('should generate remove relation code with type', () => {
      const code = codeGenerator.generateRemoveRelation('item_2', 'item_1', 'orbits');

      expect(code).toContain("app.removeRelation('item_2', 'item_1', 'orbits'");
    });

    it('should generate remove relation code without type', () => {
      const code = codeGenerator.generateRemoveRelation('item_2', 'item_1');

      expect(code).toContain("app.removeRelation('item_2', 'item_1', undefined");
    });
  });

  describe('generateQueryRelations', () => {
    it('should generate outgoing relations query', () => {
      const code = codeGenerator.generateQueryRelations('item_1', undefined, 'outgoing');

      expect(code).toContain("app.getRelations('item_1'");
    });

    it('should generate incoming relations query', () => {
      const code = codeGenerator.generateQueryRelations('item_1', undefined, 'incoming');

      expect(code).toContain("app.queryByRelationTarget('item_1'");
    });

    it('should filter by relation type', () => {
      const code = codeGenerator.generateQueryRelations('item_1', 'orbits', 'outgoing');

      expect(code).toContain("'orbits'");
    });
  });

  describe('generateAnimate', () => {
    it('should generate simple animation code', () => {
      const code = codeGenerator.generateAnimate(mockPulseAnimation);

      expect(code).toContain("app.getItemById('item_1')");
      expect(code).toContain('app.animate(item');
      expect(code).toContain("animationType: 'pulse'");
      expect(code).toContain('animationSpeed: 1');
    });
  });

  describe('generateKeyframeAnimate', () => {
    it('should generate keyframe animation code', () => {
      const code = codeGenerator.generateKeyframeAnimate(mockFadeInKeyframes);

      expect(code).toContain('app.addAnimation');
      expect(code).toContain("'item_1'");
      expect(code).toContain('opacity');
      expect(code).toContain('duration:');
      expect(code).toContain('loop:');
    });

    it('should calculate duration from keyframes if not provided', () => {
      const code = codeGenerator.generateKeyframeAnimate({
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 5, properties: { opacity: 1 } },
        ],
      });

      expect(code).toContain('5'); // Max time from keyframes
    });
  });

  describe('generateExecuteGenerator', () => {
    it('should generate sunburst generator code', () => {
      const code = codeGenerator.generateExecuteGenerator(mockSunburstGenerator);

      expect(code).toContain("app.executeGenerator('drawSunburst'");
      expect(code).toContain('rayCount');
      expect(code).toContain('16');
    });

    it('should generate grid generator code', () => {
      const code = codeGenerator.generateExecuteGenerator(mockGridGenerator);

      expect(code).toContain("'drawGrid'");
      expect(code).toContain('spacing');
    });

    it('should use await for async generator call', () => {
      const code = codeGenerator.generateExecuteGenerator(mockSunburstGenerator);
      expect(code).toContain('await app.executeGenerator');
    });
  });

  describe('generateApplyEffect', () => {
    it('should generate sparkle effect code', () => {
      const code = codeGenerator.generateApplyEffect({
        itemId: 'item_1',
        effectType: 'sparkle',
        params: { color: '#fbbf24', speed: 2 },
      });

      expect(code).toContain("app.applyEffect(item, 'sparkle'");
      expect(code).toContain('#fbbf24');
    });

    it('should generate blast effect code', () => {
      const code = codeGenerator.generateApplyEffect({
        itemId: 'item_1',
        effectType: 'blast',
        params: { radius: 100, count: 20 },
      });

      expect(code).toContain("'blast'");
      expect(code).toContain('100');
    });
  });

  describe('generateGetItems', () => {
    it('should generate get all items code', () => {
      const code = codeGenerator.generateGetItems();

      expect(code).toContain('app.itemRegistry.getAll()');
    });

    it('should generate filtered items code', () => {
      const code = codeGenerator.generateGetItems({
        type: 'circle',
        hasAnimation: true,
      });

      expect(code).toContain('filter');
      expect(code).toContain("'circle'");
    });
  });

  describe('generatePlayTimeline', () => {
    it('should generate play command', () => {
      const code = codeGenerator.generatePlayTimeline('play', 5, true);

      expect(code).toContain('app.playKeyframeTimeline(5, true)');
    });

    it('should generate stop command', () => {
      const code = codeGenerator.generatePlayTimeline('stop');

      expect(code).toContain('app.stopKeyframeTimeline()');
    });

    it('should generate seek command', () => {
      const code = codeGenerator.generatePlayTimeline('seek', undefined, undefined, 2.5);

      expect(code).toContain('app.setPlaybackTime(2.5)');
    });
  });

  describe('generateSetBackgroundColor', () => {
    it('should generate background color code', () => {
      const code = codeGenerator.generateSetBackgroundColor({ color: '#0f172a' });

      expect(code).toContain("app.setBackgroundColor('#0f172a')");
    });
  });

  describe('generateSetCanvasSize', () => {
    it('should generate canvas size code', () => {
      const code = codeGenerator.generateSetCanvasSize({
        width: 1920,
        height: 1080,
      });

      expect(code).toContain('app.setCanvasSize({ width: 1920, height: 1080 })');
    });

    it('should include preset if provided', () => {
      const code = codeGenerator.generateSetCanvasSize({
        width: 1080,
        height: 1080,
        preset: 'instagram-square',
      });

      expect(code).toContain('instagram-square');
    });
  });

  describe('generateExportSVG', () => {
    it('should generate SVG export code', () => {
      const code = codeGenerator.generateExportSVG();

      expect(code).toContain('app.exportAnimatedSVG()');
      expect(code).toContain('svgString');
    });
  });

  describe('generateExportTrainingData', () => {
    it('should generate JSON training data export', () => {
      const code = codeGenerator.generateExportTrainingData('json', true);

      expect(code).toContain('app.exportRelationTrainingData()');
      expect(code).toContain("format: 'json'");
    });

    it('should generate JSONL training data export', () => {
      const code = codeGenerator.generateExportTrainingData('jsonl', true);

      expect(code).toContain('jsonl');
      expect(code).toContain('messages');
    });
  });

  describe('generateGetRelationStats', () => {
    it('should generate relation stats code', () => {
      const code = codeGenerator.generateGetRelationStats();

      expect(code).toContain('app.getRelationStats()');
    });
  });

  describe('generateListGenerators', () => {
    it('should generate list generators code', () => {
      const code = codeGenerator.generateListGenerators();

      expect(code).toContain('app.getAvailableBackgroundGenerators()');
    });
  });

  describe('generateAgentBatchExecute', () => {
    it('should generate code for create operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'create', itemType: 'circle', position: { x: 100, y: 200 }, properties: { radius: 50, color: '#ff0000' } }],
      });
      expect(code).toContain("app.create('circle'");
      expect(code).toContain('100');
      expect(code).toContain('200');
      expect(code).toContain('#ff0000');
    });

    it('should generate code for modify operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'modify', itemId: 'item_1', properties: { color: '#00ff00' } }],
      });
      expect(code).toContain("'item_1'");
      expect(code).toContain('app.select(targetId)');
      expect(code).toContain('app.modify(');
      expect(code).toContain('#00ff00');
    });

    it('should generate code for delete operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'delete', itemId: 'item_5' }],
      });
      expect(code).toContain("'item_5'");
      expect(code).toContain('app.getItemById(targetId)');
      expect(code).toContain('item.remove()');
    });

    it('should generate code for animate operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'animate', itemId: '$0', animationType: 'pulse', animationOptions: { speed: 0.5 } }],
      });
      expect(code).toContain('itemIds[0]');
      expect(code).toContain("animationType: 'pulse'");
      expect(code).toContain('0.5');
    });

    it('should generate code for keyframe_animate operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{
          type: 'keyframe_animate',
          itemId: 'item_1',
          keyframes: [{ time: 0, properties: { opacity: 0 } }, { time: 2, properties: { opacity: 1 } }],
          duration: 3,
          loop: true,
        }],
      });
      expect(code).toContain('app.addAnimation');
      expect(code).toContain('opacity');
      expect(code).toContain('duration: 3');
      expect(code).toContain('loop: true');
    });

    it('should generate code for relation operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'relation', sourceId: '$1', targetId: '$0', relationType: 'orbits', relationOptions: { radius: 150 } }],
      });
      expect(code).toContain('itemIds[1]');
      expect(code).toContain('itemIds[0]');
      expect(code).toContain("app.addRelation(source, target, 'orbits'");
      expect(code).toContain('150');
    });

    it('should generate code for set_background operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'set_background', backgroundColor: '#0f172a' }],
      });
      expect(code).toContain("app.setBackgroundColor('#0f172a')");
    });

    it('should generate code for execute_generator operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'execute_generator', generatorName: 'drawBokeh', generatorParams: { count: 30 } }],
      });
      expect(code).toContain("app.executeGenerator('drawBokeh'");
      expect(code).toContain('30');
    });

    it('should generate code for set_canvas_size with dimensions', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'set_canvas_size', width: 1920, height: 1080 }],
      });
      expect(code).toContain('app.setCanvasSize({ width: 1920, height: 1080 })');
    });

    it('should generate code for set_canvas_size with preset', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'set_canvas_size', preset: 'youtube' }],
      });
      expect(code).toContain("app.setCanvasSize('youtube')");
    });

    it('should generate code for apply_mask operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'apply_mask', itemId: '$0', maskPreset: 'wipeLeft', maskOptions: { duration: 0.5 } }],
      });
      expect(code).toContain('app.maskSystem.applyAnimatedMask');
      expect(code).toContain("'wipeLeft'");
    });

    it('should generate code for apply_effect operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'apply_effect', itemId: 'item_1', effectType: 'sparkle', effectParams: { color: '#fbbf24' } }],
      });
      expect(code).toContain("app.applyEffect(item, 'sparkle'");
      expect(code).toContain('#fbbf24');
    });

    it('should generate code for play_timeline operation', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'play_timeline', action: 'play', duration: 5, loop: true }],
      });
      expect(code).toContain('app.playKeyframeTimeline(5, true)');
    });

    it('should resolve $N variable references to itemIds array', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [
          { type: 'create', itemType: 'circle', position: { x: 100, y: 100 }, properties: { radius: 50 } },
          { type: 'animate', itemId: '$0', animationType: 'pulse' },
        ],
      });
      expect(code).toContain('itemIds[0]');
    });

    it('should use literal ID when not a $N reference', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'modify', itemId: 'item_42', properties: { opacity: 0.5 } }],
      });
      expect(code).toContain("'item_42'");
      expect(code).not.toContain('itemIds[');
    });

    it('should preserve operation order in generated code', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [
          { type: 'set_canvas_size', width: 1080, height: 1080 },
          { type: 'set_background', backgroundColor: '#000000' },
          { type: 'create', itemType: 'text', position: { x: 400, y: 300 }, properties: { content: 'Hi' } },
        ],
      });
      const canvasIdx = code.indexOf('Operation 0: set_canvas_size');
      const bgIdx = code.indexOf('Operation 1: set_background');
      const createIdx = code.indexOf('Operation 2: create');
      expect(canvasIdx).toBeLessThan(bgIdx);
      expect(bgIdx).toBeLessThan(createIdx);
    });

    it('should throw on atomic failure (default)', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'create', itemType: 'circle', position: { x: 0, y: 0 }, properties: {} }],
      });
      expect(code).toContain('throw opError');
    });

    it('should not throw on non-atomic failure', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'create', itemType: 'circle', position: { x: 0, y: 0 }, properties: {} }],
        atomic: false,
      });
      expect(code).toContain('success = false');
      expect(code).not.toContain('throw opError');
    });

    it('should generate stop timeline code', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [{ type: 'play_timeline', action: 'stop' }],
      });
      expect(code).toContain('app.stopKeyframeTimeline()');
    });
  });
});
