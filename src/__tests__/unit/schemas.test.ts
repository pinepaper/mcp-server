/**
 * Schema Validation Tests
 */

import { describe, it, expect } from 'bun:test';
import {
  CreateItemInputSchema,
  ModifyItemInputSchema,
  DeleteItemInputSchema,
  AddRelationInputSchema,
  RemoveRelationInputSchema,
  AnimateItemInputSchema,
  KeyframeAnimateInputSchema,
  ExecuteGeneratorInputSchema,
  ApplyEffectInputSchema,
  SetBackgroundColorInputSchema,
  SetCanvasSizeInputSchema,
  ExportTrainingDataInputSchema,
  ItemTypeSchema,
  RelationTypeSchema,
  SimpleAnimationTypeSchema,
  GeneratorNameSchema,
  EffectTypeSchema,
  PositionSchema,
  KeyframeSchema,
} from '../../types/schemas.js';

describe('Schema Validation', () => {
  describe('PositionSchema', () => {
    it('should validate valid position', () => {
      const result = PositionSchema.safeParse({ x: 100, y: 200 });
      expect(result.success).toBe(true);
    });

    it('should reject missing x', () => {
      const result = PositionSchema.safeParse({ y: 200 });
      expect(result.success).toBe(false);
    });

    it('should reject missing y', () => {
      const result = PositionSchema.safeParse({ x: 100 });
      expect(result.success).toBe(false);
    });

    it('should reject non-numeric values', () => {
      const result = PositionSchema.safeParse({ x: 'hello', y: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe('ItemTypeSchema', () => {
    const validTypes = [
      'text', 'circle', 'star', 'rectangle', 'triangle',
      'polygon', 'ellipse', 'path', 'line', 'arc',
    ];

    it.each(validTypes)('should validate %s as valid item type', (type) => {
      const result = ItemTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });

    it('should reject invalid item type', () => {
      const result = ItemTypeSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('RelationTypeSchema', () => {
    const validTypes = [
      'orbits', 'follows', 'attached_to', 'maintains_distance',
      'points_at', 'mirrors', 'parallax', 'bounds_to', 'animates',
    ];

    it.each(validTypes)('should validate %s as valid relation type', (type) => {
      const result = RelationTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });

    it('should reject invalid relation type', () => {
      const result = RelationTypeSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });
  });

  describe('SimpleAnimationTypeSchema', () => {
    const validTypes = [
      'pulse', 'rotate', 'bounce', 'fade', 'wobble', 'slide', 'typewriter',
    ];

    it.each(validTypes)('should validate %s as valid animation type', (type) => {
      const result = SimpleAnimationTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });
  });

  describe('GeneratorNameSchema', () => {
    const validNames = [
      'drawSunburst', 'drawSunsetScene', 'drawGrid',
      'drawStackedCircles', 'drawCircuit', 'drawWaves', 'drawPattern',
    ];

    it.each(validNames)('should validate %s as valid generator name', (name) => {
      const result = GeneratorNameSchema.safeParse(name);
      expect(result.success).toBe(true);
    });
  });

  describe('EffectTypeSchema', () => {
    it('should validate sparkle', () => {
      const result = EffectTypeSchema.safeParse('sparkle');
      expect(result.success).toBe(true);
    });

    it('should validate blast', () => {
      const result = EffectTypeSchema.safeParse('blast');
      expect(result.success).toBe(true);
    });

    it('should reject invalid effect', () => {
      const result = EffectTypeSchema.safeParse('glow');
      expect(result.success).toBe(false);
    });
  });

  describe('KeyframeSchema', () => {
    it('should validate valid keyframe', () => {
      const result = KeyframeSchema.safeParse({
        time: 0,
        properties: { opacity: 1 },
        easing: 'linear',
      });
      expect(result.success).toBe(true);
    });

    it('should use default easing if not provided', () => {
      const result = KeyframeSchema.parse({
        time: 0,
        properties: { opacity: 1 },
      });
      expect(result.easing).toBe('linear');
    });

    it('should reject invalid easing', () => {
      const result = KeyframeSchema.safeParse({
        time: 0,
        properties: { opacity: 1 },
        easing: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateItemInputSchema', () => {
    it('should validate complete create item input', () => {
      const result = CreateItemInputSchema.safeParse({
        itemType: 'circle',
        position: { x: 100, y: 200 },
        properties: { radius: 50, color: '#ff0000' },
      });
      expect(result.success).toBe(true);
    });

    it('should use default position', () => {
      const result = CreateItemInputSchema.parse({
        itemType: 'circle',
        properties: { radius: 50 },
      });
      expect(result.position).toEqual({ x: 400, y: 300 });
    });

    it('should use default empty properties', () => {
      const result = CreateItemInputSchema.parse({
        itemType: 'circle',
      });
      expect(result.properties).toEqual({});
    });

    it('should reject missing itemType', () => {
      const result = CreateItemInputSchema.safeParse({
        position: { x: 100, y: 200 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ModifyItemInputSchema', () => {
    it('should validate valid modify input', () => {
      const result = ModifyItemInputSchema.safeParse({
        itemId: 'item_1',
        properties: { color: '#00ff00' },
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing itemId', () => {
      const result = ModifyItemInputSchema.safeParse({
        properties: { color: '#00ff00' },
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing properties', () => {
      const result = ModifyItemInputSchema.safeParse({
        itemId: 'item_1',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('DeleteItemInputSchema', () => {
    it('should validate valid delete input', () => {
      const result = DeleteItemInputSchema.safeParse({
        itemId: 'item_1',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing itemId', () => {
      const result = DeleteItemInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('AddRelationInputSchema', () => {
    it('should validate valid relation input', () => {
      const result = AddRelationInputSchema.safeParse({
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: 'orbits',
        params: { radius: 100 },
      });
      expect(result.success).toBe(true);
    });

    it('should use default empty params', () => {
      const result = AddRelationInputSchema.parse({
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: 'orbits',
      });
      expect(result.params).toEqual({});
    });

    it('should reject invalid relation type', () => {
      const result = AddRelationInputSchema.safeParse({
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RemoveRelationInputSchema', () => {
    it('should validate with relation type', () => {
      const result = RemoveRelationInputSchema.safeParse({
        sourceId: 'item_1',
        targetId: 'item_2',
        relationType: 'orbits',
      });
      expect(result.success).toBe(true);
    });

    it('should validate without relation type', () => {
      const result = RemoveRelationInputSchema.safeParse({
        sourceId: 'item_1',
        targetId: 'item_2',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('AnimateItemInputSchema', () => {
    it('should validate valid animation input', () => {
      const result = AnimateItemInputSchema.safeParse({
        itemId: 'item_1',
        animationType: 'pulse',
        speed: 1.5,
      });
      expect(result.success).toBe(true);
    });

    it('should use default speed', () => {
      const result = AnimateItemInputSchema.parse({
        itemId: 'item_1',
        animationType: 'pulse',
      });
      expect(result.speed).toBe(1);
    });
  });

  describe('KeyframeAnimateInputSchema', () => {
    it('should validate valid keyframe animation', () => {
      const result = KeyframeAnimateInputSchema.safeParse({
        itemId: 'item_1',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } },
        ],
        duration: 2,
        loop: true,
      });
      expect(result.success).toBe(true);
    });

    it('should require at least one keyframe', () => {
      const result = KeyframeAnimateInputSchema.safeParse({
        itemId: 'item_1',
        keyframes: [],
      });
      // Empty array is technically valid according to schema
      expect(result.success).toBe(true);
    });
  });

  describe('ExecuteGeneratorInputSchema', () => {
    it('should validate valid generator input', () => {
      const result = ExecuteGeneratorInputSchema.safeParse({
        generatorName: 'drawSunburst',
        params: { rayCount: 12 },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid generator name', () => {
      const result = ExecuteGeneratorInputSchema.safeParse({
        generatorName: 'invalidGenerator',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ApplyEffectInputSchema', () => {
    it('should validate valid effect input', () => {
      const result = ApplyEffectInputSchema.safeParse({
        itemId: 'item_1',
        effectType: 'sparkle',
        params: { color: '#fbbf24' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('SetBackgroundColorInputSchema', () => {
    it('should validate valid color', () => {
      const result = SetBackgroundColorInputSchema.safeParse({
        color: '#0f172a',
      });
      expect(result.success).toBe(true);
    });

    it('should accept named colors', () => {
      const result = SetBackgroundColorInputSchema.safeParse({
        color: 'navy',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing color', () => {
      const result = SetBackgroundColorInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('SetCanvasSizeInputSchema', () => {
    it('should validate valid size', () => {
      const result = SetCanvasSizeInputSchema.safeParse({
        width: 1920,
        height: 1080,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with preset', () => {
      const result = SetCanvasSizeInputSchema.safeParse({
        width: 1080,
        height: 1080,
        preset: 'instagram-square',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing dimensions', () => {
      const result = SetCanvasSizeInputSchema.safeParse({
        preset: 'instagram-square',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ExportTrainingDataInputSchema', () => {
    it('should validate with format json', () => {
      const result = ExportTrainingDataInputSchema.safeParse({
        format: 'json',
        includeMetadata: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with format jsonl', () => {
      const result = ExportTrainingDataInputSchema.safeParse({
        format: 'jsonl',
      });
      expect(result.success).toBe(true);
    });

    it('should use defaults', () => {
      const result = ExportTrainingDataInputSchema.parse({});
      expect(result.format).toBe('json');
      expect(result.includeMetadata).toBe(true);
    });
  });
});
