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
      expect(text).toContain("app.getItemById('item_1')");
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
      expect(text).toContain('keyframes');
      expect(text).toContain('app.playKeyframeTimeline');
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
      expect(text).toContain('app.setCanvasSize(1920, 1080)');
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
  // WIDGET EXPORT TOOL
  // -------------------------------------------------------------------------

  describe('pinepaper_export_widget', () => {
    it('should generate code for web component export', async () => {
      const result = await handleToolCall('pinepaper_export_widget', {
        format: 'web-component',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('web-component');
    });

    it('should support standalone HTML export', async () => {
      const result = await handleToolCall('pinepaper_export_widget', {
        format: 'standalone-html',
        sizing: 'responsive',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('standalone-html');
    });

    it('should support iframe embed export', async () => {
      const result = await handleToolCall('pinepaper_export_widget', {
        format: 'iframe-embed',
        autoplay: true,
        loop: true,
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('iframe-embed');
    });

    it('should support LMS integration', async () => {
      const result = await handleToolCall('pinepaper_export_widget', {
        format: 'web-component',
        lmsEnabled: true,
        lmsType: 'scorm',
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('lmsEnabled = true');
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

  describe('unknown tool', () => {
    it('should return error for unknown tool', async () => {
      const result = await handleToolCall('unknown_tool', {});

      expect(result.isError).toBe(true);
      const text = (result.content[0] as { type: string; text: string }).text;
      expect(text).toContain('UNKNOWN_TOOL');
    });
  });
});
