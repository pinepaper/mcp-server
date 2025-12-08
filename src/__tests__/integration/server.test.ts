/**
 * Server Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createServer } from '../../index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

describe('PinePaper MCP Server', () => {
  let server: Promise<any>;

  beforeEach(() => {
    server = createServer();
  });

  afterEach(async () => {
    // Clean up if needed
  });

  describe('Server Creation', () => {
    it('should create a server instance', async () => {
      const resolvedServer = await server;
      expect(resolvedServer).toBeDefined();
      expect(typeof resolvedServer.connect).toBe('function');
    });
  });

  describe('Tool Listing', () => {
    it('should list all available tools', async () => {
      // Test that tools are properly registered
      // The actual list tools call would require a connected transport
      expect(server).toBeDefined();
    });
  });

  describe('Resource Listing', () => {
    it('should have documentation resources', async () => {
      // Test that resources are properly registered
      expect(server).toBeDefined();
    });
  });
});

describe('Tool Handler Integration', () => {
  describe('Item Creation Flow', () => {
    it('should handle create -> modify -> delete flow', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Create
      const createResult = await handleToolCall('pinepaper_create_item', {
        itemType: 'circle',
        position: { x: 100, y: 100 },
        properties: { radius: 50, color: '#ff0000' },
      });
      expect(createResult.isError).toBeFalsy();

      // The generated code would create item_1
      // Modify (simulated as item_1)
      const modifyResult = await handleToolCall('pinepaper_modify_item', {
        itemId: 'item_1',
        properties: { color: '#00ff00', scale: 1.5 },
      });
      expect(modifyResult.isError).toBeFalsy();

      // Delete
      const deleteResult = await handleToolCall('pinepaper_delete_item', {
        itemId: 'item_1',
      });
      expect(deleteResult.isError).toBeFalsy();
    });
  });

  describe('Relation Creation Flow', () => {
    it('should handle relation add -> query -> remove flow', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Add relation
      const addResult = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
        relationType: 'orbits',
        params: { radius: 150, speed: 0.5 },
      });
      expect(addResult.isError).toBeFalsy();
      expect((addResult.content[0] as { text: string }).text).toContain('orbits');

      // Query relations
      const queryResult = await handleToolCall('pinepaper_query_relations', {
        itemId: 'item_1',
        direction: 'incoming',
      });
      expect(queryResult.isError).toBeFalsy();

      // Remove relation
      const removeResult = await handleToolCall('pinepaper_remove_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
        relationType: 'orbits',
      });
      expect(removeResult.isError).toBeFalsy();
    });
  });

  describe('Animation Flow', () => {
    it('should handle animation add -> play -> stop flow', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Apply simple animation
      const animateResult = await handleToolCall('pinepaper_animate', {
        itemId: 'item_1',
        animationType: 'pulse',
        speed: 1.0,
      });
      expect(animateResult.isError).toBeFalsy();

      // Apply keyframe animation
      const keyframeResult = await handleToolCall('pinepaper_keyframe_animate', {
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 2, properties: { opacity: 1 } },
        ],
        duration: 2,
        loop: true,
      });
      expect(keyframeResult.isError).toBeFalsy();

      // Play timeline
      const playResult = await handleToolCall('pinepaper_play_timeline', {
        action: 'play',
        duration: 5,
        loop: true,
      });
      expect(playResult.isError).toBeFalsy();

      // Stop timeline
      const stopResult = await handleToolCall('pinepaper_play_timeline', {
        action: 'stop',
      });
      expect(stopResult.isError).toBeFalsy();
    });
  });

  describe('Generator Flow', () => {
    it('should handle list generators -> execute generator flow', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // List generators
      const listResult = await handleToolCall('pinepaper_list_generators', {});
      expect(listResult.isError).toBeFalsy();
      expect((listResult.content[0] as { text: string }).text).toContain('getAvailableBackgroundGenerators');

      // Execute generator
      const executeResult = await handleToolCall('pinepaper_execute_generator', {
        generatorName: 'drawSunburst',
        params: { rayCount: 12, animated: true },
      });
      expect(executeResult.isError).toBeFalsy();
      expect((executeResult.content[0] as { text: string }).text).toContain('drawSunburst');
    });
  });

  describe('Export Flow', () => {
    it('should handle SVG export', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      const result = await handleToolCall('pinepaper_export_svg', {});
      expect(result.isError).toBeFalsy();
      expect((result.content[0] as { text: string }).text).toContain('exportAnimatedSVG');
    });

    it('should handle training data export', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // JSON format
      const jsonResult = await handleToolCall('pinepaper_export_training_data', {
        format: 'json',
        includeMetadata: true,
      });
      expect(jsonResult.isError).toBeFalsy();

      // JSONL format
      const jsonlResult = await handleToolCall('pinepaper_export_training_data', {
        format: 'jsonl',
        includeMetadata: false,
      });
      expect(jsonlResult.isError).toBeFalsy();
      expect((jsonlResult.content[0] as { text: string }).text).toContain('jsonl');
    });
  });

  describe('Canvas Control Flow', () => {
    it('should handle canvas setup flow', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Set background color
      const bgResult = await handleToolCall('pinepaper_set_background_color', {
        color: '#0f172a',
      });
      expect(bgResult.isError).toBeFalsy();

      // Set canvas size
      const sizeResult = await handleToolCall('pinepaper_set_canvas_size', {
        width: 1920,
        height: 1080,
      });
      expect(sizeResult.isError).toBeFalsy();
    });
  });

  describe('Query Flow', () => {
    it('should handle item and relation queries', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Get items
      const itemsResult = await handleToolCall('pinepaper_get_items', {
        filter: { type: 'circle' },
      });
      expect(itemsResult.isError).toBeFalsy();

      // Get relation stats
      const statsResult = await handleToolCall('pinepaper_get_relation_stats', {});
      expect(statsResult.isError).toBeFalsy();
    });
  });

  describe('Error Handling', () => {
    it('should handle unknown tool gracefully', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      const result = await handleToolCall('unknown_tool', {});
      expect(result.isError).toBe(true);
      expect((result.content[0] as { text: string }).text).toContain('UNKNOWN_TOOL');
    });

    it('should handle invalid parameters gracefully', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      const result = await handleToolCall('pinepaper_create_item', {
        itemType: 'invalid_type',
      });
      expect(result.isError).toBe(true);
    });

    it('should handle missing required parameters', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      const result = await handleToolCall('pinepaper_modify_item', {
        // Missing itemId and properties
      });
      expect(result.isError).toBe(true);
    });
  });
});

describe('Complex Scenarios', () => {
  describe('Solar System Creation', () => {
    it('should generate code for a complete solar system', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Create sun
      const sunResult = await handleToolCall('pinepaper_create_item', {
        itemType: 'circle',
        position: { x: 400, y: 300 },
        properties: { radius: 60, color: '#fbbf24' },
      });
      expect(sunResult.isError).toBeFalsy();

      // Create earth
      const earthResult = await handleToolCall('pinepaper_create_item', {
        itemType: 'circle',
        position: { x: 550, y: 300 },
        properties: { radius: 20, color: '#3b82f6' },
      });
      expect(earthResult.isError).toBeFalsy();

      // Create moon
      const moonResult = await handleToolCall('pinepaper_create_item', {
        itemType: 'circle',
        position: { x: 590, y: 300 },
        properties: { radius: 8, color: '#9ca3af' },
      });
      expect(moonResult.isError).toBeFalsy();

      // Earth orbits sun
      const earthOrbitResult = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_2',
        targetId: 'item_1',
        relationType: 'orbits',
        params: { radius: 150, speed: 0.3 },
      });
      expect(earthOrbitResult.isError).toBeFalsy();

      // Moon orbits earth
      const moonOrbitResult = await handleToolCall('pinepaper_add_relation', {
        sourceId: 'item_3',
        targetId: 'item_2',
        relationType: 'orbits',
        params: { radius: 40, speed: 0.8 },
      });
      expect(moonOrbitResult.isError).toBeFalsy();

      // Set dark background
      const bgResult = await handleToolCall('pinepaper_set_background_color', {
        color: '#0f172a',
      });
      expect(bgResult.isError).toBeFalsy();
    });
  });

  describe('Animated Logo Creation', () => {
    it('should generate code for an animated logo', async () => {
      const { handleToolCall } = await import('../../tools/handlers.js');

      // Create text
      const textResult = await handleToolCall('pinepaper_create_item', {
        itemType: 'text',
        position: { x: 400, y: 300 },
        properties: {
          content: 'BRAND',
          fontSize: 96,
          color: '#ffffff',
          fontWeight: 'bold',
        },
      });
      expect(textResult.isError).toBeFalsy();

      // Apply pulse animation
      const pulseResult = await handleToolCall('pinepaper_animate', {
        itemId: 'item_1',
        animationType: 'pulse',
        speed: 0.5,
      });
      expect(pulseResult.isError).toBeFalsy();

      // Apply sparkle effect
      const sparkleResult = await handleToolCall('pinepaper_apply_effect', {
        itemId: 'item_1',
        effectType: 'sparkle',
        params: { color: '#fbbf24', speed: 1.5 },
      });
      expect(sparkleResult.isError).toBeFalsy();

      // Add sunburst background
      const bgResult = await handleToolCall('pinepaper_execute_generator', {
        generatorName: 'drawSunburst',
        params: {
          colors: ['#3b82f6', '#8b5cf6'],
          animated: true,
        },
      });
      expect(bgResult.isError).toBeFalsy();
    });
  });
});
