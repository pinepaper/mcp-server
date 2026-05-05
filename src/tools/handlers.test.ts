/**
 * PinePaper Tool Handlers Unit Tests
 */

import { describe, it, expect } from 'bun:test';
import { handleToolCall } from './handlers';

describe('handleToolCall', () => {
  describe('pinepaper_create_item', () => {
    it('should generate code for creating a text item', async () => {
      const result = await handleToolCall('pinepaper_create_item', {
        itemType: 'text',
        position: { x: 100, y: 200 },
        properties: { content: 'Hello World', fontSize: 24, color: '#ff0000' },
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].type).toBe('text');
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.create('text'");
      expect(text).toContain('Hello World');
      expect(text).toContain('100');
      expect(text).toContain('200');
    });

    it('should generate code for creating a circle', async () => {
      const result = await handleToolCall('pinepaper_create_item', {
        itemType: 'circle',
        position: { x: 400, y: 300 },
        properties: { radius: 50, color: '#3b82f6' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.create('circle'");
      expect(text).toContain('50');
    });

    it('should use default position when not provided', async () => {
      const result = await handleToolCall('pinepaper_create_item', {
        itemType: 'star',
        properties: { radius1: 60, radius2: 30 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('400'); // default x
      expect(text).toContain('300'); // default y
    });

    it('should reject invalid item types', async () => {
      const result = await handleToolCall('pinepaper_create_item', {
        itemType: 'invalid_type',
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_modify_item', () => {
    it('should generate code for modifying an item', async () => {
      const result = await handleToolCall('pinepaper_modify_item', {
        itemId: 'item_1',
        properties: { color: '#00ff00', opacity: 0.8 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.select('item_1')");
      expect(text).toContain('app.modify');
      expect(text).toContain('#00ff00');
    });

    it('should require itemId', async () => {
      const result = await handleToolCall('pinepaper_modify_item', {
        properties: { color: '#00ff00' },
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_delete_item', () => {
    it('should generate code for deleting an item', async () => {
      const result = await handleToolCall('pinepaper_delete_item', {
        itemId: 'item_5',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.getItemById('item_5')");
      expect(text).toContain('item.remove()');
    });
  });

  describe('pinepaper_add_relation', () => {
    it('should generate code for orbits relation', async () => {
      const result = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
        relationType: 'orbits',
        params: { radius: 150, speed: 0.5 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.addRelation('item_2', 'item_1', 'orbits'");
      expect(text).toContain('150');
      expect(text).toContain('0.5');
    });

    it('should generate code for follows relation', async () => {
      const result = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_3',
        targetId: 'item_1',
        relationType: 'follows',
        params: { smoothing: 0.2, delay: 0.5 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("'follows'");
    });

    it('should generate code for attached_to relation', async () => {
      const result = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'label_1',
        targetId: 'item_1',
        relationType: 'attached_to',
        params: { offset: [0, -50], inherit_rotation: true },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("'attached_to'");
    });

    it('should reject invalid relation types', async () => {
      const result = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: 'invalid_relation',
      });

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_remove_relation', () => {
    it('should generate code for removing a relation', async () => {
      const result = await handleToolCall('pinepaper_remove_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
        relationType: 'orbits',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.removeRelation('item_2', 'item_1'");
    });

    it('should generate code for removing all relations between items', async () => {
      const result = await handleToolCall('pinepaper_remove_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
      });

      expect(result.isError).toBeFalsy();
    });
  });

  describe('pinepaper_query_relations', () => {
    it('should generate code for querying outgoing relations', async () => {
      const result = await handleToolCall('pinepaper_query_relations', {
        itemId: 'item_1',
        direction: 'outgoing',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.getRelations('item_1'");
    });

    it('should generate code for querying incoming relations', async () => {
      const result = await handleToolCall('pinepaper_query_relations', {
        itemId: 'item_1',
        direction: 'incoming',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.queryByRelationTarget('item_1'");
    });
  });

  describe('pinepaper_register_custom_relation', () => {
    it('should generate code for registering a repels relation', async () => {
      const result = await handleToolCall('pinepaper_register_custom_relation', {
        name: 'repels',
        description: 'Item moves away from target',
        params: {
          force: { type: 'number', default: 50 },
          maxDistance: { type: 'number', default: 200 },
        },
        computeFunction: `
          const dx = fromPosition.x - toPosition.x;
          const dy = fromPosition.y - toPosition.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > params.maxDistance) return fromPosition;
          const force = (params.maxDistance - dist) / params.maxDistance * params.force;
          return { x: fromPosition.x + (dx/dist) * force * delta, y: fromPosition.y + (dy/dist) * force * delta };
        `,
        applyFunction: `
          if (computed) { item.position.x = computed.x; item.position.y = computed.y; }
        `,
        templates: ['{item} repels from {target}'],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("registerRelationRule('repels'");
      expect(text).toContain('compute');
      expect(text).toContain('apply');
    });

    it('should generate code for a simple wobble relation', async () => {
      const result = await handleToolCall('pinepaper_register_custom_relation', {
        name: 'wobbles_with',
        computeFunction: `
          const angle = time * params.frequency * Math.PI * 2;
          return { offsetX: Math.sin(angle) * params.amplitude, offsetY: Math.cos(angle) * params.amplitude * 0.5 };
        `,
        applyFunction: `
          if (computed) { item.position.x += computed.offsetX; item.position.y += computed.offsetY; }
        `,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("registerRelationRule('wobbles_with'");
    });
  });

  describe('pinepaper_execute_custom_code', () => {
    it('should generate code for executing custom JavaScript', async () => {
      const result = await handleToolCall('pinepaper_execute_custom_code', {
        code: `
          const outer = new paper.Path.Circle({ center: [400, 300], radius: 80 });
          const inner = new paper.Path.Circle({ center: [400, 300], radius: 40 });
          const ring = outer.subtract(inner);
          ring.fillColor = '#8b5cf6';
          const id = app.registerItem(ring, 'ring');
          outer.remove();
          inner.remove();
          return { success: true, itemId: id };
        `,
        description: 'Create a ring shape using boolean subtraction',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('paper.Path.Circle');
      expect(text).toContain('subtract');
      expect(text).toContain('registerItem');
    });

    it('should generate code for simple custom code', async () => {
      const result = await handleToolCall('pinepaper_execute_custom_code', {
        code: `return { canvasSize: paper.view.size, itemCount: app.itemRegistry.getAll().length };`,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('paper.view.size');
      expect(text).toContain('itemRegistry');
    });
  });

  describe('pinepaper_animate', () => {
    it('should generate code for pulse animation', async () => {
      const result = await handleToolCall('pinepaper_animate', {
        itemId: 'item_1',
        animationType: 'pulse',
        speed: 1.5,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.animate');
      expect(text).toContain("'pulse'");
      expect(text).toContain('1.5');
    });

    it('should generate code for rotate animation', async () => {
      const result = await handleToolCall('pinepaper_animate', {
        itemId: 'item_1',
        animationType: 'rotate',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("'rotate'");
    });
  });

  describe('pinepaper_keyframe_animate', () => {
    it('should generate code for keyframe animation', async () => {
      const result = await handleToolCall('pinepaper_keyframe_animate', {
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } },
        ],
        duration: 2,
        loop: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.addAnimation');
      expect(text).toContain('opacity');
    });
  });

  describe('pinepaper_execute_generator', () => {
    it('should generate code for sunburst generator', async () => {
      const result = await handleToolCall('pinepaper_execute_generator', {
        generatorName: 'drawSunburst',
        params: { rayCount: 12, animated: true },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.executeGenerator('drawSunburst'");
      expect(text).toContain('12');
    });

    it('should generate code for grid generator', async () => {
      const result = await handleToolCall('pinepaper_execute_generator', {
        generatorName: 'drawGrid',
        params: { gridType: 'dots', spacing: 30 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("'drawGrid'");
    });
  });

  describe('pinepaper_list_generators', () => {
    it('should generate code for listing generators', async () => {
      const result = await handleToolCall('pinepaper_list_generators', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.getAvailableBackgroundGenerators');
    });
  });

  describe('pinepaper_apply_effect', () => {
    it('should generate code for sparkle effect', async () => {
      const result = await handleToolCall('pinepaper_apply_effect', {
        itemId: 'item_1',
        effectType: 'sparkle',
        params: { color: '#fbbf24', speed: 2 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.applyEffect(item, 'sparkle'");
    });

    it('should generate code for blast effect', async () => {
      const result = await handleToolCall('pinepaper_apply_effect', {
        itemId: 'item_1',
        effectType: 'blast',
        params: { radius: 150, count: 30 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("'blast'");
    });
  });

  describe('pinepaper_get_items', () => {
    it('should generate code for getting all items', async () => {
      const result = await handleToolCall('pinepaper_get_items', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.itemRegistry.getAll()');
    });

    it('should generate code with filters', async () => {
      const result = await handleToolCall('pinepaper_get_items', {
        filter: { type: 'circle', hasAnimation: true },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('filter');
      expect(text).toContain("'circle'");
    });
  });

  describe('pinepaper_get_relation_stats', () => {
    it('should generate code for relation stats', async () => {
      const result = await handleToolCall('pinepaper_get_relation_stats', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.getRelationStats()');
    });
  });

  describe('pinepaper_play_timeline', () => {
    it('should generate code for playing timeline', async () => {
      const result = await handleToolCall('pinepaper_play_timeline', {
        action: 'play',
        duration: 5,
        loop: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.playKeyframeTimeline');
    });

    it('should generate code for stopping timeline', async () => {
      const result = await handleToolCall('pinepaper_play_timeline', {
        action: 'stop',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.stopKeyframeTimeline');
    });

    it('should generate code for seeking in timeline', async () => {
      const result = await handleToolCall('pinepaper_play_timeline', {
        action: 'seek',
        time: 2.5,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.setPlaybackTime');
      expect(text).toContain('2.5');
    });
  });

  describe('pinepaper_set_background_color', () => {
    it('should generate code for setting background color', async () => {
      const result = await handleToolCall('pinepaper_set_background_color', {
        color: '#0f172a',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain("app.setBackgroundColor('#0f172a')");
    });
  });

  describe('pinepaper_set_canvas_size', () => {
    it('should generate code for setting canvas size', async () => {
      const result = await handleToolCall('pinepaper_set_canvas_size', {
        width: 1920,
        height: 1080,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.setCanvasSize({ width: 1920, height: 1080 })');
    });

    it('should include preset when provided', async () => {
      const result = await handleToolCall('pinepaper_set_canvas_size', {
        width: 1080,
        height: 1080,
        preset: 'instagram-square',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('instagram-square');
    });
  });

  describe('pinepaper_export_svg', () => {
    it('should generate code for SVG export', async () => {
      const result = await handleToolCall('pinepaper_export_svg', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.exportAnimatedSVG()');
    });
  });

  describe('pinepaper_export_training_data', () => {
    it('should generate code for JSON export', async () => {
      const result = await handleToolCall('pinepaper_export_training_data', {
        format: 'json',
        includeMetadata: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.exportRelationTrainingData()');
    });

    it('should generate code for JSONL export', async () => {
      const result = await handleToolCall('pinepaper_export_training_data', {
        format: 'jsonl',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('jsonl');
      expect(text).toContain('messages');
    });
  });

  // -------------------------------------------------------------------------
  // AGENT FLOW MODE TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_agent_start_job', () => {
    it('should generate code for starting an agent job', async () => {
      const result = await handleToolCall('pinepaper_agent_start_job', {
        name: 'test_job',
        screenshotPolicy: 'on_complete',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('agent job');
      expect(text).toContain('test_job');
    });

    it('should use default screenshot policy when not provided', async () => {
      const result = await handleToolCall('pinepaper_agent_start_job', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('on_complete');
    });

    it('should accept canvas preset', async () => {
      const result = await handleToolCall('pinepaper_agent_start_job', {
        name: 'instagram_job',
        canvasPreset: 'instagram',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('instagram');
    });
  });

  describe('pinepaper_agent_end_job', () => {
    it('should generate code for ending an agent job', async () => {
      const result = await handleToolCall('pinepaper_agent_end_job', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('job');
    });

    it('should include screenshot when requested', async () => {
      const result = await handleToolCall('pinepaper_agent_end_job', {
        takeScreenshot: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('screenshot');
    });

    it('should include recommendations when requested', async () => {
      const result = await handleToolCall('pinepaper_agent_end_job', {
        includeRecommendations: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('recommendations');
    });
  });

  describe('pinepaper_agent_reset', () => {
    it('should generate code for resetting canvas', async () => {
      const result = await handleToolCall('pinepaper_agent_reset', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('clearCanvas');
    });

    it('should preserve background when requested', async () => {
      const result = await handleToolCall('pinepaper_agent_reset', {
        preserveBackground: true,
      });

      expect(result.isError).toBeFalsy();
    });

    it('should set new background color', async () => {
      const result = await handleToolCall('pinepaper_agent_reset', {
        backgroundColor: '#ff0000',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('#ff0000');
    });
  });

  describe('pinepaper_agent_batch_execute', () => {
    it('should generate code for batch operations', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circle', position: { x: 100, y: 100 } },
          { type: 'create', itemType: 'rectangle', position: { x: 200, y: 200 } },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('circle');
      expect(text).toContain('rectangle');
    });

    it('should support atomic mode', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'text' },
        ],
        atomic: true,
      });

      expect(result.isError).toBeFalsy();
    });

    it('rejects vocabulary typos at preflight with VALIDATION_ERROR + suggestion', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circle' },
          { type: 'create', itemType: 'circel' }, // typo
        ],
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.message).toContain('preflight');
      // Detail must point at op index 1 and suggest 'circle'
      const detail = parsed.error.details[0];
      expect(detail.path).toBe('operations[1].itemType');
      expect(detail.opType).toBe('create');
      expect(detail.vocabulary.suggestion).toBe('circle');
      expect(detail.vocabulary.ppType).toBe('pp:Circle');
    });

    it('skipValidation:true bypasses the preflight even with a typo', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circel' }, // would normally fail
        ],
        skipValidation: true,
      });

      // Codegen still runs — typo gets stringified into the JS, no preflight
      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('circel');
    });

    it('rejects property-key typos with Levenshtein suggestion (#4)', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circle', properties: { radiues: 50, color: '#ff0000' } },
        ],
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
      expect(parsed.error.message).toContain('property-key typo');
      const detail = parsed.error.details[0];
      expect(detail.path).toBe('operations[0].properties.radiues');
      expect(detail.itemType).toBe('circle');
      expect(detail.suggestion).toBe('radius');
    });

    it('property-key preflight passes legitimate extras like "gradient"', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circle', properties: {
            radius: 50,
            gradient: { type: 'linear', stops: [] },
          }},
        ],
      });
      expect(result.isError).toBeFalsy();
    });

    it('catches relationType + effectType + generatorName typos in one preflight', async () => {
      const result = await handleToolCall('pinepaper_agent_batch_execute', {
        operations: [
          { type: 'create', itemType: 'circle' },
          { type: 'relation', relationType: 'oribits' },
          { type: 'apply_effect', effectType: 'sparkl' },
          { type: 'execute_generator', generatorName: 'drawBokh' },
        ],
      });

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.error.details.length).toBe(3);
      const fields = parsed.error.details.map((d: { path: string }) => d.path);
      expect(fields).toEqual([
        'operations[1].relationType',
        'operations[2].effectType',
        'operations[3].generatorName',
      ]);
    });
  });

  describe('pinepaper_agent_export', () => {
    it('should generate code for smart export', async () => {
      const result = await handleToolCall('pinepaper_agent_export', {
        platform: 'instagram',
        format: 'png',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('export');
    });

    it('should use auto platform detection', async () => {
      const result = await handleToolCall('pinepaper_agent_export', {
        platform: 'auto',
      });

      expect(result.isError).toBeFalsy();
    });

    it('should support quality settings', async () => {
      const result = await handleToolCall('pinepaper_agent_export', {
        platform: 'web',
        quality: 'high',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('high');
    });
  });

  describe('pinepaper_agent_analyze', () => {
    it('should generate code for content analysis', async () => {
      const result = await handleToolCall('pinepaper_agent_analyze', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('analysis');
    });

    it('should include recommendations when requested', async () => {
      const result = await handleToolCall('pinepaper_agent_analyze', {
        includeRecommendations: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('recommendations');
    });
  });

  // -------------------------------------------------------------------------
  // INTERACTIVE TRIGGER TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_add_trigger', () => {
    it('should generate code for adding a click trigger', async () => {
      const result = await handleToolCall('pinepaper_add_trigger', {
        itemId: 'button_1',
        event: 'click',
        actions: [
          { type: 'show', targetItemId: 'panel_1' },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('button_1');
      expect(text).toContain('click');
      expect(text).toContain('show');
    });

    it('should support hover triggers', async () => {
      const result = await handleToolCall('pinepaper_add_trigger', {
        itemId: 'item_1',
        event: 'hover_enter',
        actions: [
          { type: 'play_animation', targetItemId: 'item_1', animationType: 'pulse' },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('hover_enter');
    });

    it('should support multiple actions', async () => {
      const result = await handleToolCall('pinepaper_add_trigger', {
        itemId: 'item_1',
        event: 'click',
        actions: [
          { type: 'show', targetItemId: 'panel_1' },
          { type: 'play_animation', targetItemId: 'panel_1', animationType: 'fadeIn' },
        ],
      });

      expect(result.isError).toBeFalsy();
    });
  });

  describe('pinepaper_remove_trigger', () => {
    it('should generate code for removing triggers from an item', async () => {
      const result = await handleToolCall('pinepaper_remove_trigger', {
        itemId: 'button_1',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('button_1');
    });

    it('should remove specific event type', async () => {
      const result = await handleToolCall('pinepaper_remove_trigger', {
        itemId: 'button_1',
        event: 'click',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('click');
    });
  });

  describe('pinepaper_query_triggers', () => {
    it('should generate code for querying triggers', async () => {
      const result = await handleToolCall('pinepaper_query_triggers', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('trigger');
    });

    it('should filter by item', async () => {
      const result = await handleToolCall('pinepaper_query_triggers', {
        itemId: 'button_1',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('button_1');
    });
  });

  // -------------------------------------------------------------------------
  // QUIZ/LMS TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_create_quiz', () => {
    it('should generate code for creating a quiz', async () => {
      const result = await handleToolCall('pinepaper_create_quiz', {
        title: 'Test Quiz',
        questions: [
          {
            id: 'q1',
            type: 'multiple-choice',
            prompt: 'What is 2+2?',
            points: 10,
            options: [
              { id: 'a', label: '3', isCorrect: false },
              { id: 'b', label: '4', isCorrect: true },
            ],
          },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('Test Quiz');
      expect(text).toContain('multiple-choice');
    });

    it('should support drag-drop questions', async () => {
      const result = await handleToolCall('pinepaper_create_quiz', {
        title: 'Drag Drop Quiz',
        questions: [
          {
            id: 'q1',
            type: 'drag-drop',
            prompt: 'Match the items',
            points: 20,
          },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('drag-drop');
    });
  });

  describe('pinepaper_get_quiz_state', () => {
    it('should generate code for getting quiz state', async () => {
      const result = await handleToolCall('pinepaper_get_quiz_state', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('quiz');
    });

    it('should get state for specific quiz', async () => {
      const result = await handleToolCall('pinepaper_get_quiz_state', {
        quizId: 'quiz_1',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('quiz_1');
    });
  });

  describe('pinepaper_reset_quiz', () => {
    it('should generate code for resetting quiz', async () => {
      const result = await handleToolCall('pinepaper_reset_quiz', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('reset');
    });

    it('should reset specific quiz', async () => {
      const result = await handleToolCall('pinepaper_reset_quiz', {
        quizId: 'quiz_1',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('quiz_1');
    });
  });

  // -------------------------------------------------------------------------
  // LETTER COLLAGE TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_create_letter_collage', () => {
    it('should generate code for creating a tile-style letter collage', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {
        text: 'HELLO',
        style: 'tile',
        palette: 'wordle',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('HELLO');
      expect(text).toContain('tile');
    });

    it('should generate code for magazine-style letter collage', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {
        text: 'RANSOM',
        style: 'magazine',
        palette: 'newspaper',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('RANSOM');
      expect(text).toContain('magazine');
    });

    it('should generate code for gradient-style letter collage', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {
        text: 'GRADIENT',
        style: 'gradient',
        gradientPalette: 'sunset',
        gradientDirection: 'diagonal',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('GRADIENT');
      expect(text).toContain('gradient');
    });

    it('should use default style when not provided', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {
        text: 'DEFAULT',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('DEFAULT');
    });

    it('should support custom position and font settings', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {
        text: 'CUSTOM',
        position: { x: 200, y: 300 },
        fontSize: 64,
        fontFamily: 'Arial',
        spacing: 1.5,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('CUSTOM');
    });

    it('should require text parameter', async () => {
      const result = await handleToolCall('pinepaper_create_letter_collage', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_animate_letter_collage', () => {
    it('should generate code for pulse animation', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {
        collageId: 'collage_1',
        animationType: 'pulse',
        staggerDelay: 0.15,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('collage_1');
      expect(text).toContain('pulse');
    });

    it('should generate code for fade animation', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {
        collageId: 'collage_2',
        animationType: 'fade',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('fade');
    });

    it('should generate code for bounce animation', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {
        collageId: 'collage_3',
        animationType: 'bounce',
        animationSpeed: 2,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('bounce');
    });

    it('should generate code for wobble animation', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {
        collageId: 'collage_4',
        animationType: 'wobble',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('wobble');
    });

    it('should generate code for rotate animation', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {
        collageId: 'collage_5',
        animationType: 'rotate',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('rotate');
    });

    it('should require collageId and animationType', async () => {
      const result = await handleToolCall('pinepaper_animate_letter_collage', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_get_letter_collage_options', () => {
    it('should generate code for getting collage options', async () => {
      const result = await handleToolCall('pinepaper_get_letter_collage_options', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getLetterCollageOptions');
    });
  });

  // -------------------------------------------------------------------------
  // CANVAS PRESETS TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_get_canvas_presets', () => {
    it('should generate code for getting canvas presets', async () => {
      const result = await handleToolCall('pinepaper_get_canvas_presets', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getCanvasPresets');
    });
  });

  // -------------------------------------------------------------------------
  // MAP TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_load_map', () => {
    it('should generate code for loading world map', async () => {
      const result = await handleToolCall('pinepaper_load_map', {
        mapId: 'world',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('loadMap');
      expect(text).toContain('world');
    });

    it('should generate code with projection options', async () => {
      const result = await handleToolCall('pinepaper_load_map', {
        mapId: 'usa',
        projection: 'albers',
        quality: 'professional',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('loadMap');
      expect(text).toContain('usa');
      expect(text).toContain('albers');
    });

    it('should require mapId', async () => {
      const result = await handleToolCall('pinepaper_load_map', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_highlight_regions', () => {
    it('should generate code for highlighting regions', async () => {
      const result = await handleToolCall('pinepaper_highlight_regions', {
        regionIds: ['CA', 'TX', 'NY'],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('highlightRegions');
      expect(text).toContain('CA');
    });

    it('should generate code with styling options', async () => {
      const result = await handleToolCall('pinepaper_highlight_regions', {
        regionIds: ['United States of America'],
        options: {
          fillColor: '#3b82f6',
          animate: true,
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('highlightRegions');
      expect(text).toContain('#3b82f6');
    });
  });

  describe('pinepaper_unhighlight_regions', () => {
    it('should generate code to unhighlight all regions', async () => {
      const result = await handleToolCall('pinepaper_unhighlight_regions', {
        regionIds: 'all',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('unhighlightRegions');
      expect(text).toContain('all');
    });
  });

  describe('pinepaper_apply_data_colors', () => {
    it('should generate code for choropleth coloring', async () => {
      const result = await handleToolCall('pinepaper_apply_data_colors', {
        data: { CA: 85, TX: 72, NY: 90 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('applyDataColors');
    });

    it('should generate code with color scale options', async () => {
      const result = await handleToolCall('pinepaper_apply_data_colors', {
        data: { 'United States of America': 330 },
        options: {
          colorScale: 'blues',
          showLegend: true,
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('applyDataColors');
      expect(text).toContain('blues');
    });
  });

  describe('pinepaper_add_marker', () => {
    it('should generate code to add a marker', async () => {
      const result = await handleToolCall('pinepaper_add_marker', {
        lat: 37.7749,
        lon: -122.4194,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('addMarker');
      expect(text).toContain('37.7749');
    });

    it('should generate code with label and pulse', async () => {
      const result = await handleToolCall('pinepaper_add_marker', {
        lat: 40.7128,
        lon: -74.006,
        label: 'New York',
        pulse: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('addMarker');
      expect(text).toContain('New York');
      expect(text).toContain('pulse');
    });
  });

  describe('pinepaper_add_map_labels', () => {
    it('should generate code to add map labels', async () => {
      const result = await handleToolCall('pinepaper_add_map_labels', {
        options: {
          fontSize: 12,
          labelType: 'name',
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('addLabels');
    });
  });

  describe('pinepaper_pan_map', () => {
    it('should generate code to pan the map', async () => {
      const result = await handleToolCall('pinepaper_pan_map', {
        lat: 50,
        lon: 10,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('panTo');
    });
  });

  describe('pinepaper_zoom_map', () => {
    it('should generate code to zoom the map', async () => {
      const result = await handleToolCall('pinepaper_zoom_map', {
        level: 2,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('zoomTo');
      expect(text).toContain('2');
    });
  });

  describe('pinepaper_export_map', () => {
    it('should generate code to export map', async () => {
      const result = await handleToolCall('pinepaper_export_map', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('exportMap');
    });
  });

  describe('pinepaper_import_custom_map', () => {
    it('should generate code to import from URL', async () => {
      const result = await handleToolCall('pinepaper_import_custom_map', {
        url: 'https://example.com/custom.geojson',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('importCustomMap');
      expect(text).toContain('example.com');
    });
  });

  describe('pinepaper_get_region_at_point', () => {
    it('should generate code for hit testing', async () => {
      const result = await handleToolCall('pinepaper_get_region_at_point', {
        x: 400,
        y: 300,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getRegionAtPoint');
    });
  });

  // -------------------------------------------------------------------------
  // MAP ANIMATION/CSV TOOLS
  // -------------------------------------------------------------------------

  describe('pinepaper_animate_map_regions', () => {
    it('should generate code for region keyframe animation', async () => {
      const result = await handleToolCall('pinepaper_animate_map_regions', {
        duration: 5,
        loop: true,
        regions: {
          USA: [
            { time: 0, fillColor: '#ef4444' },
            { time: 5, fillColor: '#22c55e' },
          ],
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('animateRegions');
      expect(text).toContain('USA');
    });

    it('should require regions parameter', async () => {
      const result = await handleToolCall('pinepaper_animate_map_regions', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_animate_map_wave', () => {
    it('should generate code for wave animation', async () => {
      const result = await handleToolCall('pinepaper_animate_map_wave', {
        duration: 10,
        waveDirection: 'horizontal',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('animateWave');
      expect(text).toContain('horizontal');
    });

    it('should work with custom colors', async () => {
      const result = await handleToolCall('pinepaper_animate_map_wave', {
        colors: ['#ff0000', '#00ff00', '#0000ff'],
        waveDirection: 'radial',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('radial');
    });
  });

  describe('pinepaper_stop_map_animations', () => {
    it('should generate code to stop all animations', async () => {
      const result = await handleToolCall('pinepaper_stop_map_animations', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('stopAnimations');
    });

    it('should generate code to stop specific regions', async () => {
      const result = await handleToolCall('pinepaper_stop_map_animations', {
        regions: ['USA', 'France'],
        resetColors: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('stopAnimations');
      expect(text).toContain('USA');
    });
  });

  describe('pinepaper_get_animated_map_regions', () => {
    it('should generate code to get animated regions', async () => {
      const result = await handleToolCall('pinepaper_get_animated_map_regions', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getAnimatedRegions');
    });
  });

  describe('pinepaper_export_map_region_csv', () => {
    it('should generate code to export CSV', async () => {
      const result = await handleToolCall('pinepaper_export_map_region_csv', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('exportRegionCSV');
    });

    it('should generate code with options', async () => {
      const result = await handleToolCall('pinepaper_export_map_region_csv', {
        includeHighlighted: true,
        download: true,
        filename: 'my-map.csv',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('my-map.csv');
    });
  });

  describe('pinepaper_import_map_region_csv', () => {
    it('should generate code to import CSV', async () => {
      const result = await handleToolCall('pinepaper_import_map_region_csv', {
        csvText: 'regionId,fillColor\nUSA,#22c55e',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('importRegionCSV');
    });

    it('should require csvText', async () => {
      const result = await handleToolCall('pinepaper_import_map_region_csv', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_select_map_regions', () => {
    it('should generate code to select regions', async () => {
      const result = await handleToolCall('pinepaper_select_map_regions', {
        regionIds: ['USA', 'Canada', 'Mexico'],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('selectRegions');
      expect(text).toContain('USA');
    });

    it('should require regionIds', async () => {
      const result = await handleToolCall('pinepaper_select_map_regions', {});

      expect(result.isError).toBe(true);
    });
  });

  describe('pinepaper_deselect_map_regions', () => {
    it('should generate code to deselect all regions', async () => {
      const result = await handleToolCall('pinepaper_deselect_map_regions', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('deselectRegions');
    });

    it('should generate code to deselect specific regions', async () => {
      const result = await handleToolCall('pinepaper_deselect_map_regions', {
        regionIds: ['USA', 'France'],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('deselectRegions');
    });
  });

  describe('pinepaper_get_highlighted_map_regions', () => {
    it('should generate code to get highlighted regions', async () => {
      const result = await handleToolCall('pinepaper_get_highlighted_map_regions', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getHighlightedRegions');
    });
  });

  describe('pinepaper_export_map_geojson', () => {
    it('should generate code to export map as GeoJSON', async () => {
      const result = await handleToolCall('pinepaper_export_map_geojson', {
        includeStyles: true,
        includeMetadata: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('exportGeoJSON');
    });

    it('should support download option', async () => {
      const result = await handleToolCall('pinepaper_export_map_geojson', {
        download: true,
        filename: 'my-map.geojson',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('download: true');
      expect(text).toContain('my-map.geojson');
    });
  });

  describe('pinepaper_export_original_map_geojson', () => {
    it('should generate code to export original map GeoJSON', async () => {
      const result = await handleToolCall('pinepaper_export_original_map_geojson', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('exportOriginalGeoJSON');
    });
  });

  describe('pinepaper_get_map_source_info', () => {
    it('should generate code to get map source info', async () => {
      const result = await handleToolCall('pinepaper_get_map_source_info', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('getSourceInfo');
    });
  });

  describe('pinepaper_register_item', () => {
    it('should generate code to register a Paper.js item', async () => {
      const result = await handleToolCall('pinepaper_register_item', {
        itemJson: { type: 'Path', data: {} },
        itemType: 'customShape',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('importJSON');
      expect(text).toContain('customShape');
    });
  });

  // -------------------------------------------------------------------------
  // MASK TOOL TESTS
  // -------------------------------------------------------------------------
  describe('pinepaper_apply_animated_mask', () => {
    it('should generate code for preset mode mask', async () => {
      const result = await handleToolCall('pinepaper_apply_animated_mask', {
        itemId: 'item_1',
        preset: 'wipeLeft',
        options: { duration: 0.5, easing: 'easeOut' },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('applyAnimatedMask');
      expect(text).toContain('wipeLeft');
    });

    it('should generate code for custom keyframe mode', async () => {
      const result = await handleToolCall('pinepaper_apply_animated_mask', {
        itemId: 'item_1',
        maskType: 'rectangle',
        keyframes: [
          { time: 0, properties: { width: 0 } },
          { time: 1, properties: { width: 200 } },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('rectangle');
      expect(text).toContain('keyframes');
    });

    it('should generate code for hybrid mode', async () => {
      const result = await handleToolCall('pinepaper_apply_animated_mask', {
        itemId: 'item_1',
        preset: 'iris',
        keyframes: [
          { time: 0, properties: { scale: 0 }, easing: 'linear' },
          { time: 1, properties: { scale: 1 }, easing: 'bounce' },
        ],
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('iris');
      expect(text).toContain('keyframes');
    });
  });

  describe('pinepaper_apply_custom_mask', () => {
    it('should generate code for custom mask with star shape', async () => {
      const result = await handleToolCall('pinepaper_apply_custom_mask', {
        itemId: 'item_1',
        maskType: 'star',
        keyframes: [
          { time: 0, properties: { scale: 0 } },
          { time: 1, properties: { scale: 1 } },
        ],
        maskOptions: { points: 6, innerRadius: 0.4 },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('applyCustomMask');
      expect(text).toContain('star');
      expect(text).toContain('points');
    });
  });

  describe('pinepaper_remove_mask', () => {
    it('should generate code to remove mask', async () => {
      const result = await handleToolCall('pinepaper_remove_mask', {
        itemId: 'item_1',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('removeMask');
      expect(text).toContain('item_1');
    });
  });

  describe('pinepaper_get_animatable_properties', () => {
    it('should return animatable properties for all mask types', async () => {
      const result = await handleToolCall('pinepaper_get_animatable_properties', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('rectangle');
      expect(text).toContain('circle');
      expect(text).toContain('properties');
    });
  });

  describe('pinepaper_get_available_easings', () => {
    it('should return available easing functions', async () => {
      const result = await handleToolCall('pinepaper_get_available_easings', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('easings');
      expect(text).toContain('linear');
      expect(text).toContain('easeInOut');
    });
  });

  describe('pinepaper_get_mask_types', () => {
    it('should return available mask types', async () => {
      const result = await handleToolCall('pinepaper_get_mask_types', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('maskTypes');
      expect(text).toContain('rectangle');
      expect(text).toContain('circle');
    });
  });

  describe('pinepaper_get_mask_animations', () => {
    it('should return available mask animation presets', async () => {
      const result = await handleToolCall('pinepaper_get_mask_animations', {});

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('animations');
      expect(text).toContain('wipeLeft');
      expect(text).toContain('iris');
    });
  });

  describe('pinepaper_get_canvas_ontology', () => {
    it('generates a guarded call to app.exportCanvasOntology', async () => {
      const result = await handleToolCall('pinepaper_get_canvas_ontology', {});
      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('app.exportCanvasOntology');
      expect(text).toContain('triples');
    });

    it('passes maxItems / maxChildren / includeViewport through to the call', async () => {
      const result = await handleToolCall('pinepaper_get_canvas_ontology', {
        maxItems: 25,
        maxChildren: 5,
        includeViewport: true,
      });
      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('"maxItems":25');
      expect(text).toContain('"maxChildren":5');
      expect(text).toContain('"includeViewport":true');
    });

    it('rejects out-of-range maxItems (>500) at Zod validation', async () => {
      const result = await handleToolCall('pinepaper_get_canvas_ontology', {
        maxItems: 5000,
      });
      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      const parsed = JSON.parse(text);
      expect(parsed.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('unknown tool', () => {
    it('should return error for unknown tool', async () => {
      const result = await handleToolCall('unknown_tool', {});

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('UNKNOWN_TOOL');
    });
  });
});
