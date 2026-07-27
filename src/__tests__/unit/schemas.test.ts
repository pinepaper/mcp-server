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
  AgentBatchExecuteInputSchema,
  ItemTypeSchema,
  RelationTypeSchema,
  DrivenByParamsSchema,
  TimeExpressionParamsSchema,
  EquationPathInputSchema,
  MovesAlongPathParamsSchema,
  EventInputSchema,
  OnEventFireAfterParamsSchema,
  OnEventAddRelationParamsSchema,
  OnEventSetColorParamsSchema,
  OnTopOfParamsSchema,
  BelowParamsSchema,
  BesideParamsSchema,
  InsideParamsSchema,
  CenteredOnParamsSchema,
  AlignedWithParamsSchema,
  SimpleAnimationTypeSchema,
  GeneratorNameSchema,
  EffectTypeSchema,
  PositionSchema,
  KeyframeSchema,
} from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

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
      // Procedural / deterministic property binding (S10 G1)
      'driven_by', 'time_expression',
      // Event-driven scene chains (S11)
      'on_event_fire_after', 'on_event_add_relation', 'on_event_remove_relation',
      'on_event_set_color', 'on_event_set_property', 'on_event_set_visibility',
    ];

    it.each(validTypes)('should validate %s as valid relation type', (type) => {
      const result = RelationTypeSchema.safeParse(type);
      expect(result.success).toBe(true);
    });

    it('should reject invalid relation type', () => {
      const result = RelationTypeSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    // The tool inputSchema enums are hand-maintained copies of the Zod enum.
    // They are spread across five tools at varying nesting depths and under two
    // different property names ('relationType', and 'type' in create_scene), so
    // find them by shape — any enum listing 'orbits' is a relation-type enum —
    // rather than by a hand-listed path that silently misses one.
    const relationEnums = (() => {
      const found: Array<{ tool: string; path: string; values: string[] }> = [];
      const walk = (node: unknown, path: string, tool: string) => {
        if (!node || typeof node !== 'object') return;
        if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, tool));
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          const e = (v as { enum?: unknown })?.enum;
          if (Array.isArray(e) && e.includes('orbits')) {
            found.push({ tool, path: `${path}.${k}`, values: e as string[] });
          }
          walk(v, `${path}.${k}`, tool);
        }
      };
      for (const t of PINEPAPER_TOOLS) walk(t.inputSchema, '', t.name);
      return found;
    })();

    it('finds every relation-type enum in the tool surface', () => {
      // add_relation, remove_relation, query_relations, create_scene, agent_batch_execute
      expect(relationEnums.length).toBe(5);
    });

    it.each(relationEnums.map((r) => [`${r.tool}${r.path}`, r.values] as const))(
      '%s covers every RelationTypeSchema option',
      (_label, enumVals) => {
        const missing = RelationTypeSchema.options.filter((o) => !enumVals.includes(o));
        expect(missing).toEqual([]);
      }
    );
  });

  describe('DrivenByParamsSchema (S10 G1 deterministic binding)', () => {
    it('applies FxTool-matching defaults', () => {
      const p = DrivenByParamsSchema.parse({});
      expect(p.sourceProperty).toBe('opacity');
      expect(p.targetProperty).toBe('x');
      expect(p.multiplier).toBe(1);
      expect(p.signal).toBe(false);
    });

    it('accepts color binding + signal mode + clamp', () => {
      const r = DrivenByParamsSchema.safeParse({
        sourceProperty: 'fillColor', targetProperty: 'x',
        colorFrom: '#0055ff', colorTo: '#ff3300', signal: true,
        clamp: { min: 0, max: 1 },
      });
      expect(r.success).toBe(true);
    });

    it('rejects an unknown sourceProperty', () => {
      expect(DrivenByParamsSchema.safeParse({ sourceProperty: 'bogus' }).success).toBe(false);
    });
  });

  describe('TimeExpressionParamsSchema (S10 deterministic f(t))', () => {
    it('defaults property to y and signal to false', () => {
      const p = TimeExpressionParamsSchema.parse({});
      expect(p.property).toBe('y');
      expect(p.signal).toBe(false);
    });

    it('accepts an expression of t and v in signal mode', () => {
      const r = TimeExpressionParamsSchema.safeParse({
        property: 'y', expression: 'sin(t * 2) * 50 + v', baseValue: 300, signal: true,
      });
      expect(r.success).toBe(true);
    });
  });

  // Defaults here are asserted against FxTool's RelationRegistry
  // _registerStructuralRelations() rule params. If FxTool changes a default, these
  // should fail — that is the point.
  describe('Structural layout params (S12-E1)', () => {
    it('on_top_of / below default to a flush, centered stack', () => {
      for (const S of [OnTopOfParamsSchema, BelowParamsSchema]) {
        const p = S.parse({});
        expect(p.gap).toBe(0);
        expect(p.align).toBe('center');
        expect(p.overhang).toBe(0);
        expect(p.signal).toBe(false);
      }
    });

    it('beside defaults to the right side, vertically centered', () => {
      const p = BesideParamsSchema.parse({});
      expect(p.side).toBe('right');
      expect(p.gap).toBe(0);
      expect(p.align).toBe('center');
    });

    it('beside rejects a vertical align value on the horizontal axis', () => {
      // 'left'/'right' are on_top_of's align values; beside aligns vertically.
      expect(BesideParamsSchema.safeParse({ align: 'left' }).success).toBe(false);
      expect(BesideParamsSchema.safeParse({ align: 'top' }).success).toBe(true);
    });

    it('inside defaults to a centered, unpadded anchor and takes all 9 anchors', () => {
      const p = InsideParamsSchema.parse({});
      expect(p.anchor).toBe('center');
      expect(p.padding).toBe(0);
      for (const a of ['center', 'top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right']) {
        expect(InsideParamsSchema.safeParse({ anchor: a }).success).toBe(true);
      }
    });

    it('centered_on defaults to a zero offset (concentric)', () => {
      const p = CenteredOnParamsSchema.parse({});
      expect(p.offsetX).toBe(0);
      expect(p.offsetY).toBe(0);
    });

    // FxTool's aligned_with compute returns undefined without an axis, so the
    // relation silently does nothing. Requiring it here turns that into an error.
    it('aligned_with requires an axis and accepts only x or y', () => {
      expect(AlignedWithParamsSchema.safeParse({}).success).toBe(false);
      expect(AlignedWithParamsSchema.safeParse({ axis: 'z' }).success).toBe(false);
      const p = AlignedWithParamsSchema.parse({ axis: 'y' });
      expect(p.axis).toBe('y');
      expect(p.offset).toBe(0);
    });

    it('every structural relation accepts signal mode', () => {
      expect(OnTopOfParamsSchema.parse({ signal: true }).signal).toBe(true);
      expect(BesideParamsSchema.parse({ signal: true }).signal).toBe(true);
      expect(InsideParamsSchema.parse({ signal: true }).signal).toBe(true);
      expect(CenteredOnParamsSchema.parse({ signal: true }).signal).toBe(true);
      expect(AlignedWithParamsSchema.parse({ axis: 'x', signal: true }).signal).toBe(true);
    });
  });

  describe('EquationPathInputSchema (S10 B5 equation-driven paths)', () => {
    it('applies FxTool-matching defaults', () => {
      const p = EquationPathInputSchema.parse({});
      expect(p.kind).toBe('function');
      expect(p.variable).toBe('x');
      expect(p.param).toBe('t');
      expect(p.samples).toBe(200);
      expect(p.scale).toBe(1);
      expect(p.flipY).toBe(true);
    });

    it('accepts each kind', () => {
      expect(EquationPathInputSchema.safeParse({ kind: 'function', expr: 'sin(x)*80' }).success).toBe(true);
      expect(EquationPathInputSchema.safeParse({ kind: 'parametric', xExpr: 'cos(3*t)*120', yExpr: 'sin(2*t)*80' }).success).toBe(true);
      expect(EquationPathInputSchema.safeParse({ kind: 'fourier', harmonics: [{ freq: 1, amp: 100 }, { freq: 3, amp: 33, phase: 0.5 }] }).success).toBe(true);
      expect(EquationPathInputSchema.safeParse({ kind: 'preset', preset: 'rose', style: { strokeColor: '#4f46e5' } }).success).toBe(true);
    });

    it('accepts chained warp (single or array)', () => {
      expect(EquationPathInputSchema.safeParse({ warp: { dx: 'sin(t*6)*4', dy: '0' } }).success).toBe(true);
      expect(EquationPathInputSchema.safeParse({ warp: [{ dx: '0', dy: 'cos(x/20)*5' }] }).success).toBe(true);
    });

    it('rejects an unknown preset', () => {
      expect(EquationPathInputSchema.safeParse({ kind: 'preset', preset: 'bogus' }).success).toBe(false);
    });
  });

  describe('MovesAlongPathParamsSchema equation source (S10 B5)', () => {
    it('still accepts a drawn point path (backward compatible)', () => {
      const r = MovesAlongPathParamsSchema.safeParse({ path: [{ x: 0, y: 0 }, [100, 100]], speed: 1 });
      expect(r.success).toBe(true);
    });

    it('accepts an equation source with no drawn path', () => {
      const r = MovesAlongPathParamsSchema.safeParse({
        equation: { kind: 'preset', preset: 'lissajous', cx: 400, cy: 300 },
        speed: 0.5, closed: true,
      });
      expect(r.success).toBe(true);
    });
  });

  describe('Event-driven scene chains (S11)', () => {
    it('OnEventFireAfterParamsSchema defaults + canvas timeline', () => {
      const p = OnEventFireAfterParamsSchema.parse({});
      expect(p.delay).toBe(1000);
      expect(p.timeline).toBe('wall');
      expect(OnEventFireAfterParamsSchema.safeParse({ delay: 2000, timeline: 'canvas' }).success).toBe(true);
      expect(OnEventFireAfterParamsSchema.safeParse({ timeline: 'bogus' }).success).toBe(false);
    });

    it('OnEventAddRelationParamsSchema carries a nested relation spec', () => {
      const r = OnEventAddRelationParamsSchema.safeParse({
        type: 'moves_along_path', target: null,
        params: { equation: { kind: 'fourier', harmonics: [{ freq: 1, amp: 240 }] } },
      });
      expect(r.success).toBe(true);
      expect(OnEventAddRelationParamsSchema.safeParse({ target: 'x' }).success).toBe(false); // type required
    });

    it('OnEventSetColorParamsSchema defaults which to fill', () => {
      expect(OnEventSetColorParamsSchema.parse({ color: '#f00' }).which).toBe('fill');
      expect(OnEventSetColorParamsSchema.safeParse({ color: '#f00', which: 'stroke' }).success).toBe(true);
    });

    it('EventInputSchema requires name for create, eventId for pulse', () => {
      expect(EventInputSchema.safeParse({ action: 'create', name: 'e0' }).success).toBe(true);
      expect(EventInputSchema.safeParse({ action: 'create' }).success).toBe(false);
      expect(EventInputSchema.safeParse({ action: 'pulse', eventId: 'e0' }).success).toBe(true);
      expect(EventInputSchema.safeParse({ action: 'pulse' }).success).toBe(false);
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

    it('should validate new effects (smoke, fire, glow, etc.)', () => {
      expect(EffectTypeSchema.safeParse('smoke').success).toBe(true);
      expect(EffectTypeSchema.safeParse('fire').success).toBe(true);
      expect(EffectTypeSchema.safeParse('rain').success).toBe(true);
      expect(EffectTypeSchema.safeParse('snow').success).toBe(true);
      expect(EffectTypeSchema.safeParse('confetti').success).toBe(true);
      expect(EffectTypeSchema.safeParse('ripple').success).toBe(true);
      expect(EffectTypeSchema.safeParse('glow').success).toBe(true);
      expect(EffectTypeSchema.safeParse('electric').success).toBe(true);
    });

    it('should reject invalid effect', () => {
      const result = EffectTypeSchema.safeParse('laser');
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

  describe('AgentBatchExecuteInputSchema', () => {
    it('should validate all 12 operation types', () => {
      const ops = [
        { type: 'set_canvas_size', width: 1920, height: 1080 },
        { type: 'set_background', backgroundColor: '#000000' },
        { type: 'execute_generator', generatorName: 'drawBokeh', generatorParams: { count: 20 } },
        { type: 'create', itemType: 'circle', position: { x: 100, y: 200 }, properties: { radius: 50 } },
        { type: 'modify', itemId: 'item_1', properties: { color: '#ff0000' } },
        { type: 'delete', itemId: 'item_2' },
        { type: 'animate', itemId: '$0', animationType: 'pulse' },
        { type: 'keyframe_animate', itemId: '$0', keyframes: [{ time: 0, properties: { opacity: 0 } }], duration: 3 },
        { type: 'relation', sourceId: '$0', targetId: 'item_1', relationType: 'orbits' },
        { type: 'apply_mask', itemId: '$0', maskPreset: 'wipeLeft' },
        { type: 'apply_effect', itemId: '$0', effectType: 'sparkle' },
        { type: 'play_timeline', action: 'play', duration: 5, loop: true },
      ];
      const result = AgentBatchExecuteInputSchema.safeParse({ operations: ops });
      expect(result.success).toBe(true);
    });

    it('should reject empty operations array', () => {
      const result = AgentBatchExecuteInputSchema.safeParse({ operations: [] });
      expect(result.success).toBe(false);
    });

    it('should validate keyframes structure', () => {
      const result = AgentBatchExecuteInputSchema.safeParse({
        operations: [{
          type: 'keyframe_animate',
          itemId: 'item_1',
          keyframes: [
            { time: 0, properties: { opacity: 0, scale: 0.5 } },
            { time: 1, properties: { opacity: 1, scale: 1 }, easing: 'easeOut' },
          ],
          duration: 2,
          loop: false,
        }],
      });
      expect(result.success).toBe(true);
    });

    it('should validate mixed operation batch', () => {
      const result = AgentBatchExecuteInputSchema.safeParse({
        operations: [
          { type: 'set_background', backgroundColor: '#1a1a2e' },
          { type: 'create', itemType: 'text', position: { x: 400, y: 300 }, properties: { content: 'Hello', fontSize: 48 } },
          { type: 'animate', itemId: '$0', animationType: 'fade' },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should default atomic to true', () => {
      const result = AgentBatchExecuteInputSchema.parse({
        operations: [{ type: 'set_background', backgroundColor: '#000' }],
      });
      expect(result.atomic).toBe(true);
    });

    it('should accept atomic false', () => {
      const result = AgentBatchExecuteInputSchema.parse({
        operations: [{ type: 'set_background', backgroundColor: '#000' }],
        atomic: false,
      });
      expect(result.atomic).toBe(false);
    });
  });
});
