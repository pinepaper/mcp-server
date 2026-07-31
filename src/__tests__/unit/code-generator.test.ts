/**
 * Code Generator Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator, planKeyframeMerges } from '../../types/code-generator.js';
import { EquationPathInputSchema, EventInputSchema } from '../../types/schemas.js';
import {
  mockTextItem,
  mockCircleItem,
  mockStarItem,
  mockOrbitsRelation,
  mockFollowsRelation,
  mockAttachedToRelation,
  mockDrivenByRelation,
  mockTimeExpressionRelation,
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

    it('accepts position as [x, y] array and normalizes to {x, y}', () => {
      const code = codeGenerator.generateCreateItem({
        itemType: 'circle',
        position: [250, 350] as unknown as { x: number; y: number },
        properties: { radius: 25 },
      });
      expect(code).toContain('x: 250');
      expect(code).toContain('y: 350');
    });

    it('passes inline animationType + animationSpeed through to app.create params', () => {
      const code = codeGenerator.generateCreateItem({
        itemType: 'circle',
        position: { x: 200, y: 200 },
        properties: { radius: 30, color: '#3b82f6' },
        animationType: 'pulse',
        animationSpeed: 2,
      });
      expect(code).toContain('"animationType": "pulse"');
      expect(code).toContain('"animationSpeed": 2');
    });

    it('passes inline keyframe animation through to app.create params', () => {
      const code = codeGenerator.generateCreateItem({
        itemType: 'text',
        properties: { content: 'Hi', fontSize: 32 },
        animationType: 'keyframe',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } },
        ],
      });
      expect(code).toContain('"animationType": "keyframe"');
      expect(code).toContain('"keyframes"');
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

    it('should generate driven_by code preserving signal + color binding params', () => {
      const code = codeGenerator.generateAddRelation(mockDrivenByRelation);

      expect(code).toContain("app.addRelation('dot_1', 'planet_1', 'driven_by'");
      expect(code).toContain('fillColor');       // sourceProperty
      expect(code).toContain('#0055ff');          // colorFrom
      expect(code).toContain('#ff3300');          // colorTo
      expect(code).toContain('"signal": true');   // deterministic IR mode preserved
    });

    it('should generate time_expression self-relation preserving the expression', () => {
      const code = codeGenerator.generateAddRelation(mockTimeExpressionRelation);

      expect(code).toContain("'time_expression'");
      expect(code).toContain('sin(t * 2) * 50 + v'); // expression preserved verbatim
      expect(code).toContain('"signal": true');
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

    it('omits clip-window options when none are passed', () => {
      const code = codeGenerator.generateKeyframeAnimate({
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } },
        ],
      });
      expect(code).not.toContain('timeOffset');
      expect(code).not.toContain('clipInPoint');
      expect(code).not.toContain('clipOutPoint');
    });

    it('passes clip-window options through to app.addAnimation', () => {
      const code = codeGenerator.generateKeyframeAnimate({
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 4, properties: { opacity: 1 } },
        ],
        timeOffset: 2,
        clipInPoint: 1,
        clipOutPoint: 4,
      });
      expect(code).toContain('"timeOffset":2');
      expect(code).toContain('"clipInPoint":1');
      expect(code).toContain('"clipOutPoint":4');
    });

    it('emits clip params individually when only some are set', () => {
      const code = codeGenerator.generateKeyframeAnimate({
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } },
        ],
        timeOffset: 2,
      });
      expect(code).toContain('"timeOffset":2');
      expect(code).not.toContain('"clipInPoint"');
      expect(code).not.toContain('"clipOutPoint"');
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
      // 1.5.5: app.maskSystem was a phantom; calls app.applyAnimatedMask directly now.
      expect(code).toContain('app.applyAnimatedMask(item,');
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

  describe('generateAgentExport — framing', () => {
    it('emits framing="canvas" by default', () => {
      const code = codeGenerator.generateAgentExport({
        platform: 'youtube',
        format: 'mp4',
      });
      expect(code).toContain("const framing = 'canvas'");
      expect(code).toContain('cameraDims = null');
    });

    it('routes camera framing through videoExporter directly with computed dims', () => {
      const code = codeGenerator.generateAgentExport({
        platform: 'youtube',
        format: 'mp4',
        framing: 'camera',
      });
      expect(code).toContain("const framing = 'camera'");
      expect(code).toContain('hasCameraAnimation');
      expect(code).toContain('getCameraAnimationParams');
      expect(code).toContain('Math.round(');
      // Direct videoExporter path is taken when cameraDims is set
      expect(code).toContain('app.exportEngine.videoExporter.export({ ...baseVideoSettings, width: cameraDims.width, height: cameraDims.height })');
    });

    it('errors out when framing="camera" with a non-video format', () => {
      const code = codeGenerator.generateAgentExport({
        platform: 'instagram',
        format: 'png',
        framing: 'camera',
      });
      expect(code).toContain('framing: "camera" is only supported for video formats');
    });

    it('errors out when framing="camera" but no walkthrough exists', () => {
      const code = codeGenerator.generateAgentExport({
        platform: 'youtube',
        format: 'mp4',
        framing: 'camera',
      });
      expect(code).toContain('framing: "camera" requires a camera_animates walkthrough');
    });
  });

  describe('generateAgentStartJob — ontology pre-bundle', () => {
    it('bundles app.exportCanvasOntology() into the return by default', () => {
      const code = codeGenerator.generateAgentStartJob({});
      expect(code).toContain('app.exportCanvasOntology');
      expect(code).toContain('ontology: _ontology');
      expect(code).toContain('ontologyUnavailable');
    });

    it('marks ontologyUnavailable when the public method is missing', () => {
      const code = codeGenerator.generateAgentStartJob({});
      // The guard sets _ontologyUnavailable = true on missing method
      expect(code).toContain('if (app.exportCanvasOntology)');
      expect(code).toContain('_ontologyUnavailable = true');
    });

    it('skips the ontology block when includeOntology: false', () => {
      const code = codeGenerator.generateAgentStartJob({ includeOntology: false });
      expect(code).not.toContain('app.exportCanvasOntology');
      expect(code).not.toContain('ontology: _ontology');
    });

    it('captures ontology even when clearCanvas: false (resume case)', () => {
      const code = codeGenerator.generateAgentStartJob({ clearCanvas: false });
      // Clear-canvas block must be absent
      expect(code).not.toContain('app.clearCanvas()');
      // But ontology capture must still run
      expect(code).toContain('app.exportCanvasOntology');
    });
  });

  describe('generateGetCanvasOntology', () => {
    it('emits a guarded call to app.exportCanvasOntology', () => {
      const code = codeGenerator.generateGetCanvasOntology({});
      expect(code).toContain('app.exportCanvasOntology');
      expect(code).toContain('if (!app.exportCanvasOntology)');
      expect(code).toContain('requires FxTool with canvas-ontology promotion');
    });

    it('passes through maxItems / maxChildren / includeViewport options', () => {
      const code = codeGenerator.generateGetCanvasOntology({
        maxItems: 100,
        maxChildren: 5,
        includeViewport: true,
      });
      expect(code).toContain('"maxItems":100');
      expect(code).toContain('"maxChildren":5');
      expect(code).toContain('"includeViewport":true');
    });

    it('returns a result shape including triples + items + summary fields', () => {
      const code = codeGenerator.generateGetCanvasOntology({});
      // The mapped fields the LLM cares about must appear in the return:
      for (const field of [
        'canvasWidth', 'canvasHeight', 'canvasPreset',
        'itemCount', 'itemTypes', 'hasAnimations', 'relationCount',
        'items', 'triples', 'viewport',
      ]) {
        expect(code).toContain(field);
      }
    });

    it('omits options that are not provided', () => {
      const code = codeGenerator.generateGetCanvasOntology({});
      // No options means the JSON-stringified opts is "{}"
      expect(code).toContain('app.exportCanvasOntology({})');
    });
  });

  describe('generateImportMermaid', () => {
    it('emits app.importMermaid with the source text', () => {
      const code = codeGenerator.generateImportMermaid(
        'flowchart TD\n  A[Start] --> B[End]'
      );
      expect(code).toContain('app.importMermaid');
      expect(code).toContain('flowchart TD');
      expect(code).toContain('A[Start] --> B[End]');
    });

    it('passes options through (autoLayout, clearExisting)', () => {
      const code = codeGenerator.generateImportMermaid('graph LR\nA-->B', {
        autoLayout: false,
        clearExisting: true,
      });
      expect(code).toContain('"autoLayout":false');
      expect(code).toContain('"clearExisting":true');
    });

    it('escapes backticks and dollar signs to keep template-literal valid', () => {
      const code = codeGenerator.generateImportMermaid(
        'flowchart TD\n  A["a `quoted` ${expr} label"] --> B'
      );
      // Backticks must be escaped so the template literal terminates correctly
      expect(code).toContain('\\`quoted\\`');
      // Dollar signs must be escaped so the template literal does not interpolate
      expect(code).toContain('\\${expr}');
    });

    it('returns a result shape with success / counts / arrays / errors', () => {
      const code = codeGenerator.generateImportMermaid('flowchart TD\nA-->B');
      expect(code).toContain('nodeCount:');
      expect(code).toContain('edgeCount:');
      expect(code).toContain('errors:');
    });

    it('guards against missing diagramSystem', () => {
      const code = codeGenerator.generateImportMermaid('flowchart TD\nA-->B');
      expect(code).toContain('importMermaid not available');
    });
  });

  describe('generateGeometry', () => {
    it('invokes the named app.geometry helper with the given args', () => {
      const code = codeGenerator.generateGeometry({
        operation: 'regularPolygon',
        args: [400, 300, 120, 5],
      });
      expect(code).toContain('app.geometry');
      expect(code).toContain('"regularPolygon"');
      expect(code).toContain('[400,300,120,5]');
      expect(code).toContain('success: true');
    });

    it('guards against an FxTool without the geometry library', () => {
      const code = codeGenerator.generateGeometry({ operation: 'midpoint', args: [] });
      expect(code).toContain('unavailable');
    });

    it('returns an error shape for degenerate (null) constructions', () => {
      const code = codeGenerator.generateGeometry({ operation: 'lineIntersection', args: [] });
      expect(code).toContain('result == null');
      expect(code).toContain('Degenerate');
    });

    it('compute-only when createAs is omitted (create branch stays dead)', () => {
      const code = codeGenerator.generateGeometry({ operation: 'circumcenter', args: [] });
      expect(code).toContain('const createAs = null;');
      expect(code).toContain('if (createAs)');
    });

    it('creates a polygon from a vertex-list result when createAs is given', () => {
      const code = codeGenerator.generateGeometry({
        operation: 'regularPolygon',
        args: [0, 0, 100, 6],
        createAs: { fillColor: '#FF6B6B' },
      });
      expect(code).toContain("app.create('polygon'");
      expect(code).toContain("app.create('circle'"); // circle + point branches present
      expect(code).toContain('#FF6B6B');
      expect(code).toContain('registryId');
    });
  });

  describe('generateEquationPath', () => {
    it('emits app.createEquationPath with the opts and returns itemId', () => {
      const code = codeGenerator.generateEquationPath(
        EquationPathInputSchema.parse({ kind: 'function', expr: 'sin(x/40)*60', min: -300, max: 300 })
      );
      expect(code).toContain('app.createEquationPath(');
      expect(code).toContain('sin(x/40)*60');
      expect(code).toContain('registryId');
      expect(code).toContain('success: true');
    });

    it('guards against an FxTool without the equation-path API', () => {
      const code = codeGenerator.generateEquationPath(EquationPathInputSchema.parse({}));
      expect(code).toContain("typeof app.createEquationPath !== 'function'");
      expect(code).toContain('unavailable');
    });

    it('carries parametric + preset params through verbatim', () => {
      const para = codeGenerator.generateEquationPath(
        EquationPathInputSchema.parse({ kind: 'parametric', xExpr: 'cos(3*t)*120', yExpr: 'sin(2*t)*80' })
      );
      expect(para).toContain('cos(3*t)*120');
      expect(para).toContain('sin(2*t)*80');

      const preset = codeGenerator.generateEquationPath(
        EquationPathInputSchema.parse({ kind: 'preset', preset: 'rose', k: 5 } as any)
      );
      expect(preset).toContain('"preset":"rose"');
    });
  });

  describe('generateEvent (S11 scene chains)', () => {
    it('create emits app.createEvent and returns eventId', () => {
      const code = codeGenerator.generateEvent(EventInputSchema.parse({ action: 'create', name: 'e0' }));
      expect(code).toContain('app.createEvent("e0"');
      expect(code).toContain('eventId');
      expect(code).toContain("typeof app.createEvent !== 'function'"); // guard
    });

    it('pulse emits app.pulseEvent with the id and payload', () => {
      const code = codeGenerator.generateEvent(EventInputSchema.parse({ action: 'pulse', eventId: 'e0', payload: { n: 1 } }));
      expect(code).toContain('app.pulseEvent("e0"');
      expect(code).toContain('{"n":1}');
      expect(code).toContain("typeof app.pulseEvent !== 'function'"); // guard
    });

    it('pulse does not save history (runtime fire, not an edit)', () => {
      const code = codeGenerator.generateEvent(EventInputSchema.parse({ action: 'pulse', eventId: 'e0' }));
      expect(code).not.toContain('saveState');
    });
  });

  describe('generateConstructionSequence', () => {
    it('build embeds steps and options', () => {
      const code = codeGenerator.generateConstructionSequence({
        action: 'build',
        steps: [['a', 'b'], ['mid']],
        stepDuration: 2,
      });
      expect(code).toContain('cs.build(');
      expect(code).toContain('[["a","b"],["mid"]]');
      expect(code).toContain('"stepDuration":2');
      expect(code).toContain('sequenceId: rec.id');
    });

    it('play falls back to the most recent sequence when none given', () => {
      const code = codeGenerator.generateConstructionSequence({ action: 'play', loop: true });
      expect(code).toContain('cs.play(');
      expect(code).toContain('all[all.length - 1].id');
      expect(code).toContain('"loop":true');
    });

    it('clear restores the named sequence', () => {
      const code = codeGenerator.generateConstructionSequence({ action: 'clear', sequenceId: 'cseq_3' });
      expect(code).toContain('cs.clear(');
      expect(code).toContain('"cseq_3"');
    });

    it('list maps sequences and guards missing subsystem', () => {
      const code = codeGenerator.generateConstructionSequence({ action: 'list' });
      expect(code).toContain('cs.list()');
      expect(code).toContain('constructionSequence unavailable');
    });
  });

  describe('generateAnimate intensity/delay', () => {
    it('omits intensity/delay when not provided', () => {
      const code = codeGenerator.generateAnimate({ itemId: 'x1', animationType: 'pulse', speed: 1 });
      expect(code).toContain('animationSpeed: 1');
      expect(code).not.toContain('animationIntensity');
      expect(code).not.toContain('animationDelay');
    });

    it('passes animationIntensity and animationDelay through to app.animate', () => {
      const code = codeGenerator.generateAnimate({
        itemId: 'x1',
        animationType: 'wobble',
        speed: 2,
        intensity: 0.3,
        delay: 0.5,
      });
      expect(code).toContain('animationIntensity: 0.3');
      expect(code).toContain('animationDelay: 0.5');
    });

    it('create-time animationIntensity/animationDelay land on the item', () => {
      const code = codeGenerator.generateCreateItem({
        itemType: 'circle',
        position: { x: 0, y: 0 },
        properties: { radius: 20 },
        animationType: 'pulse',
        animationIntensity: 0.25,
        animationDelay: 1,
      } as any);
      expect(code).toContain('animationIntensity');
      expect(code).toContain('0.25');
      expect(code).toContain('animationDelay');
    });
  });

  describe('generateGroup', () => {
    it('groups items via the GroupManager and returns a groupId', () => {
      const code = codeGenerator.generateGroup({ action: 'group', itemIds: ['a', 'b', 'c'], groupName: 'car' });
      expect(code).toContain('app.groupManager.createGroup("car")');
      expect(code).toContain('addItemsToGroup');
      expect(code).toContain('["a","b","c"]');
      expect(code).toContain('groupId');
      expect(code).toContain('GroupManager not available'); // guard
    });

    it('group works without a name (undefined)', () => {
      const code = codeGenerator.generateGroup({ action: 'group', itemIds: ['a', 'b'] });
      expect(code).toContain('app.groupManager.createGroup(undefined)');
    });

    it('break_apart decomposes an imported item via app.breakApart', () => {
      const code = codeGenerator.generateGroup({ action: 'break_apart', itemId: 'svg_5' });
      expect(code).toContain('app.breakApart(');
      expect(code).toContain('"svg_5"');
      expect(code).toContain('partIds');
      expect(code).toContain('breakApart unavailable'); // guard
    });

    it('ungroup dissolves a group by id', () => {
      const code = codeGenerator.generateGroup({ action: 'ungroup', groupId: 'group_7' });
      expect(code).toContain('ungroupAll');
      expect(code).toContain('"group_7"');
      expect(code).toContain('ungrouped: true');
    });

    it('batch group op resolves $N refs against itemIds and returns no itemId', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [
          { type: 'create', itemType: 'circle', position: { x: 0, y: 0 } },
          { type: 'create', itemType: 'circle', position: { x: 50, y: 0 } },
          { type: 'group', itemIds: ['$0', '$1'], groupName: 'wheels' },
        ],
      } as any);
      expect(code).toContain('[itemIds[0], itemIds[1]]');
      expect(code).toContain('createGroup("wheels")');
      // group op returns groupId (no itemId) so it must not shift $N indices
      expect(code).toContain('groupId');
    });
  });

  describe('generateCameraDirector', () => {
    it('auto mode calls autoDirectStory with options', () => {
      const code = codeGenerator.generateCameraDirector({ action: 'auto', establishing: true, hold: 1.5, loop: true });
      expect(code).toContain('app.autoDirectStory(');
      expect(code).toContain('"establishing":true');
      expect(code).toContain("mode: 'auto'");
      expect(code).toContain('autoDirectStory unavailable'); // guard
    });

    it('shots mode applies an explicit shot list', () => {
      const code = codeGenerator.generateCameraDirector({
        action: 'shots',
        shots: [{ subjects: 'everything', framing: 'wide', hold: 1 }],
        loop: false,
      });
      expect(code).toContain('app.applyDirectorShots(');
      expect(code).toContain('"framing":"wide"');
      expect(code).toContain("mode: 'shots'");
    });
  });

  describe('generateArrange (z-order)', () => {
    it('maps each action to the right app stacking method', () => {
      const map: Record<string, string> = {
        front: 'bringToFront', back: 'sendToBack', forward: 'bringForward', backward: 'sendBackward',
      };
      for (const [action, method] of Object.entries(map)) {
        const code = codeGenerator.generateArrange({ itemId: 'c1', action: action as any });
        expect(code).toContain(`app.${method}()`);
        expect(code).toContain('app.select("c1")');
        expect(code).toContain('Item not found'); // guard
      }
    });
  });

  describe('object detection', () => {
    it('detect_objects (default) calls app.detectObjects, guarded + async', () => {
      const code = codeGenerator.generateDetectObjects({ threshold: 0.4 });
      expect(code).toContain('async function');
      expect(code).toContain('await app.detectObjects(');
      expect(code).toContain('"threshold":0.4');
      expect(code).toContain('detectObjects unavailable'); // guard
    });

    it('detect_objects asNodes is passed through', () => {
      const code = codeGenerator.generateDetectObjects({ asNodes: true, itemId: 'img_1' });
      expect(code).toContain('"asNodes":true');
      expect(code).toContain('"itemId":"img_1"');
    });

    it('detect_objects open-vocabulary queries are passed through (OWL-ViT)', () => {
      const code = codeGenerator.generateDetectObjects({ queries: ['red umbrella', 'logo'] });
      expect(code).toContain('"queries":["red umbrella","logo"]');
      expect(code).toContain('open-vocabulary');
    });

    it('extract_object calls app.extractObject with the label', () => {
      const code = codeGenerator.generateExtractObject({ label: 'cat' });
      expect(code).toContain('await app.extractObject(');
      expect(code).toContain('"label":"cat"');
      expect(code).toContain('extractObject unavailable'); // guard
    });
  });

  describe('determinism + validator surface', () => {
    it('deterministic seek uses app.sceneAt with a setPlaybackTime fallback', () => {
      const code = codeGenerator.generatePlayTimeline('seek', undefined, undefined, 1.5, true);
      expect(code).toContain('app.sceneAt(t)');
      expect(code).toContain('app.setPlaybackTime(t)'); // fallback for older builds
      expect(code).toContain('1.5');
    });

    it('plain seek stays on setPlaybackTime (no sceneAt)', () => {
      const code = codeGenerator.generatePlayTimeline('seek', undefined, undefined, 2);
      expect(code).toContain('app.setPlaybackTime(2)');
      expect(code).not.toContain('sceneAt');
    });

    it('validate_scene audits the live scene by default', () => {
      const code = codeGenerator.generateValidateScene({});
      expect(code).toContain('app.sceneValidator');
      expect(code).toContain('v.validateScene()');
      expect(code).toContain("mode: 'scene'");
    });

    it('validate_scene pre-validates proposed ops when given', () => {
      const code = codeGenerator.generateValidateScene({
        ops: [{ kind: 'create', id: 'c1', itemType: 'circle' }],
      });
      expect(code).toContain('v.validateOps(');
      expect(code).toContain('"kind":"create"');
      expect(code).toContain("mode: 'ops'");
    });

    it('capture_frames seeds, hashes frames, and guards missing entrypoint', () => {
      const code = codeGenerator.generateCaptureFrames({ times: [0, 1, 2], seed: 42 });
      expect(code).toContain('app.captureFramesAt([0,1,2]');
      expect(code).toContain('seed: 42');
      expect(code).toContain('allIdentical');
      expect(code).toContain('captureFramesAt unavailable');
      expect(code).toContain('const includeDataUrls = false;'); // defaults off
    });

    it('capture_frames includes data URLs only when asked', () => {
      const code = codeGenerator.generateCaptureFrames({ times: [0], includeDataUrls: true });
      expect(code).toContain('f.dataUrl = url');
    });

    it('capture_frames prefers app.captureFrameDataURL (used-region, no workspace margin) with a toDataURL fallback', () => {
      const code = codeGenerator.generateCaptureFrames({ times: [0] });
      expect(code).toContain('app.captureFrameDataURL()');
      expect(code).toContain('c.toDataURL()'); // fallback retained for old builds
    });
  });

  // The governor (app.runGenerated) captures a run's value only when the emitted
  // code ends in a `(`-led trailing expression (({...}) or an IIFE) — FxTool's
  // wrapTrailingReturn rewrites that to `return (…)`. Guard the MCP's half of the
  // contract: representative generators must end in such an expression, else the
  // agent silently loses itemId/eventId/query payloads under the governor.
  describe('governor value-capture contract — emitted code ends in a (-led trailing expression', () => {
    const endsInParenExpr = (code: string) => /\)\s*;?\s*$/.test(code.trim());
    const cases: Array<[string, string]> = [
      ['create_item', codeGenerator.generateCreateItem(mockCircleItem)],
      ['add_relation', codeGenerator.generateAddRelation({ sourceId: 'a', targetId: 'b', relationType: 'orbits', params: { radius: 50 } })],
      ['event create', codeGenerator.generateEvent({ action: 'create', name: 'e0' })],
      ['event pulse', codeGenerator.generateEvent({ action: 'pulse', eventId: 'e0' })],
      ['letter_collage', codeGenerator.generateCreateLetterCollage({ text: 'HI', style: 'particle' })],
    ];
    for (const [name, code] of cases) {
      it(`${name} ends in a capturable trailing expression`, () => {
        expect(endsInParenExpr(code)).toBe(true);
      });
    }
  });

  // $N references are documented as "items CREATED in earlier operations".
  // animate/keyframe_animate/modify/delete results also carry { itemId } (the
  // TARGET's id); pushing those into itemIds shifted every later $N reference —
  // a [create ×2, keyframe_animate ×2, create ×2, keyframe_animate($2) ×2]
  // batch silently re-animated the FIRST items and left the later creates
  // without keyframes (mis-animated vehicles, 2026-07-30).
  describe('generateAgentBatchExecute — only create ops claim $N slots', () => {
    it('emits itemIds.push only for create operations', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [
          { type: 'create', itemType: 'rectangle', position: { x: 100, y: 100 }, properties: { width: 120, height: 40, rotation: 90 } },
          { type: 'keyframe_animate', itemId: '$0', keyframes: [
            { time: 0, properties: { x: 100, y: 100 } },
            { time: 2, properties: { x: 100, y: 250 } },
          ] },
          { type: 'create', itemType: 'circle', position: { x: 300, y: 100 }, properties: { radius: 30 } },
          { type: 'keyframe_animate', itemId: '$1', keyframes: [
            { time: 0, properties: { x: 300, y: 100 } },
            { time: 2, properties: { x: 300, y: 250 } },
          ] },
        ],
      } as never);

      const pushes = code.match(/itemIds\.push\(/g) || [];
      expect(pushes.length).toBe(2); // exactly one per create op

      // $1 must resolve to the SECOND create (itemIds[1]) — with the old
      // unconditional push, itemIds[1] was the first keyframe op's target.
      expect(code).toContain('itemIds[1]');
    });

    it('modify/animate/delete results never extend the $N space', () => {
      const code = codeGenerator.generateAgentBatchExecute({
        operations: [
          { type: 'create', itemType: 'text', position: { x: 50, y: 50 }, properties: { content: 'hi' } },
          { type: 'modify', itemId: '$0', properties: { fontSize: 40 } },
          { type: 'animate', itemId: '$0', animationType: 'pulse' },
          { type: 'delete', itemId: '$0' },
        ],
      } as never);

      const pushes = code.match(/itemIds\.push\(/g) || [];
      expect(pushes.length).toBe(1);
    });
  });

  // Regression: agent-pipeline defects found while authoring the ICML GAUGE
  // reproduction poster/explainer (2026-07-31). Both failed SILENTLY — the
  // batch reported success while the scene was wrong.
  describe('agent batch — silent-failure regressions', () => {
    describe('explicit position on coordinate-built items', () => {
      // app.create('path', …) builds geometry from segments/pathData and never
      // reads params.position (PinePaper.js ~1425-1482), so a caller asking for
      // a path AT a point silently got it at its raw coordinates instead.
      it('applies an explicit position after creating a path', () => {
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [{
            type: 'create',
            itemType: 'path',
            position: { x: 620, y: 420 },
            properties: { pathData: 'M -34 0 L 34 0', strokeColor: '#fff' },
          }],
        } as never);

        expect(code).toContain('item.position');
        expect(code).toContain('620');
        expect(code).toContain('420');
      });

      it('does NOT reposition a path when no position was given', () => {
        // Absolute-coordinate paths (the common case) must stay where their
        // coordinates put them — never snapped to the injected default.
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [{
            type: 'create',
            itemType: 'path',
            properties: { segments: [[90, 252], [1350, 252]], strokeColor: '#000' },
          }],
        } as never);

        expect(code).not.toContain('item.position =');
      });

      it('leaves shape items alone — app.create already honours their position', () => {
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [{
            type: 'create',
            itemType: 'circle',
            position: { x: 100, y: 200 },
            properties: { radius: 50 },
          }],
        } as never);

        expect(code).not.toContain('item.position =');
      });
    });

    describe('duplicate keyframe_animate targets', () => {
      // app.addAnimation replaces data.keyframes wholesale, so a second op on
      // the same item silently discarded the first track.
      it('merges two keyframe ops on the same item into one addAnimation', () => {
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [
            {
              type: 'keyframe_animate',
              itemId: 'item_9',
              keyframes: [{ time: 0, properties: { rotation: 25 } }, { time: 4, properties: { rotation: 0 } }],
            },
            {
              type: 'keyframe_animate',
              itemId: 'item_9',
              keyframes: [{ time: 0, properties: { strokeColor: '#aaa' } }, { time: 4, properties: { strokeColor: '#0f0' } }],
            },
          ],
        } as never);

        const calls = code.match(/app\.addAnimation/g) || [];
        expect(calls.length).toBe(1);
        // both channels survive, merged per timestamp
        expect(code).toContain('rotation');
        expect(code).toContain('strokeColor');
      });

      it('keeps keyframe ops on different items separate', () => {
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [
            { type: 'keyframe_animate', itemId: 'item_1', keyframes: [{ time: 0, properties: { opacity: 0 } }] },
            { type: 'keyframe_animate', itemId: 'item_2', keyframes: [{ time: 0, properties: { opacity: 1 } }] },
          ],
        } as never);

        const calls = code.match(/app\.addAnimation/g) || [];
        expect(calls.length).toBe(2);
      });

      it('unions keyframes by timestamp, later op winning per-property', () => {
        const plan = planKeyframeMerges([
          {
            type: 'keyframe_animate', itemId: 'a', duration: 4,
            keyframes: [
              { time: 0, properties: { rotation: 25, opacity: 1 } },
              { time: 4, properties: { rotation: 0 } },
            ],
          },
          {
            type: 'keyframe_animate', itemId: 'a', loop: true, duration: 9,
            keyframes: [{ time: 0, properties: { rotation: 90, strokeColor: '#0f0' } }],
          },
        ]);

        expect([...plan.foldedInto.entries()]).toEqual([[1, 0]]);
        const merged = plan.merged.get(0)!;
        // t=0 keeps opacity from op-0, takes rotation from op-1, gains strokeColor
        expect(merged.keyframes[0].properties).toEqual({ rotation: 90, opacity: 1, strokeColor: '#0f0' });
        // t=4 only existed in op-0 and survives
        expect(merged.keyframes[1]).toEqual({ time: 4, properties: { rotation: 0 } });
        expect(merged.duration).toBe(9);
        expect(merged.loop).toBe(true);
      });

      it('plans nothing when every target is unique', () => {
        const plan = planKeyframeMerges([
          { type: 'keyframe_animate', itemId: 'a', keyframes: [{ time: 0, properties: { opacity: 0 } }] },
          { type: 'keyframe_animate', itemId: 'b', keyframes: [{ time: 0, properties: { opacity: 1 } }] },
          { type: 'create', itemType: 'circle' },
        ]);

        expect(plan.merged.size).toBe(0);
        expect(plan.foldedInto.size).toBe(0);
      });

      it('merges $N-referenced targets too', () => {
        const code = codeGenerator.generateAgentBatchExecute({
          operations: [
            { type: 'create', itemType: 'circle', position: { x: 0, y: 0 }, properties: {} },
            { type: 'keyframe_animate', itemId: '$0', keyframes: [{ time: 0, properties: { rotation: 10 } }] },
            { type: 'keyframe_animate', itemId: '$0', keyframes: [{ time: 1, properties: { opacity: 1 } }] },
          ],
        } as never);

        const calls = code.match(/app\.addAnimation/g) || [];
        expect(calls.length).toBe(1);
      });
    });
  });
});
