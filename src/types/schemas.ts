/**
 * PinePaper MCP Server - Type Definitions
 * 
 * This file contains all TypeScript types and Zod schemas for the MCP tools.
 * These schemas are used for:
 * 1. Input validation
 * 2. JSON Schema generation (for MCP tool definitions)
 * 3. TypeScript type inference
 */

import { z } from 'zod';

// =============================================================================
// COMMON SCHEMAS
// =============================================================================

export const PositionSchema = z.object({
  x: z.number().describe('X coordinate on canvas'),
  y: z.number().describe('Y coordinate on canvas'),
});

export const PointArraySchema = z.tuple([z.number(), z.number()]);

export const ColorSchema = z.string().describe('Color value (hex, rgb, or named color)');

export const EasingSchema = z.enum([
  'linear',
  'easeIn',
  'easeOut',
  'easeInOut',
  'bounce',
  'elastic',
]).describe('Easing function for animation');

// =============================================================================
// ITEM TYPES
// =============================================================================

export const ItemTypeSchema = z.enum([
  'text',
  'circle',
  'star',
  'rectangle',
  'triangle',
  'polygon',
  'ellipse',
  'path',
  'line',
  'arc',
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

// Text item properties
export const TextPropertiesSchema = z.object({
  content: z.string().describe('Text content to display'),
  fontSize: z.number().optional().default(48).describe('Font size in pixels'),
  fontFamily: z.string().optional().default('Arial, sans-serif').describe('Font family'),
  color: ColorSchema.optional().default('#ffffff').describe('Text color'),
  fontWeight: z.string().optional().describe('Font weight (normal, bold, etc.)'),
});

// Circle properties
export const CirclePropertiesSchema = z.object({
  radius: z.number().describe('Circle radius in pixels'),
  color: ColorSchema.optional().describe('Fill color'),
  strokeColor: ColorSchema.optional().describe('Stroke color'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
});

// Star properties
export const StarPropertiesSchema = z.object({
  radius1: z.number().describe('Outer radius of star'),
  radius2: z.number().describe('Inner radius of star'),
  points: z.number().optional().default(5).describe('Number of star points'),
  color: ColorSchema.optional().describe('Fill color'),
});

// Rectangle properties
export const RectanglePropertiesSchema = z.object({
  width: z.number().describe('Rectangle width'),
  height: z.number().describe('Rectangle height'),
  color: ColorSchema.optional().describe('Fill color'),
  cornerRadius: z.number().optional().describe('Corner radius for rounded rectangles'),
});

// Polygon properties
export const PolygonPropertiesSchema = z.object({
  sides: z.number().min(3).describe('Number of polygon sides'),
  radius: z.number().describe('Polygon radius'),
  color: ColorSchema.optional().describe('Fill color'),
});

// Path properties
export const PathPropertiesSchema = z.object({
  segments: z.array(PointArraySchema).optional().describe('Array of [x, y] points'),
  pathData: z.string().optional().describe('SVG path data string'),
  strokeColor: ColorSchema.optional().describe('Stroke color'),
  strokeWidth: z.number().optional().describe('Stroke width'),
  fillColor: ColorSchema.optional().describe('Fill color'),
  closed: z.boolean().optional().describe('Whether to close the path'),
  smooth: z.boolean().optional().describe('Whether to smooth the path'),
});

// Line properties
export const LinePropertiesSchema = z.object({
  from: PointArraySchema.describe('Start point [x, y]'),
  to: PointArraySchema.describe('End point [x, y]'),
  strokeColor: ColorSchema.optional().describe('Line color'),
  strokeWidth: z.number().optional().describe('Line width'),
});

// Arc properties
export const ArcPropertiesSchema = z.object({
  from: PointArraySchema.describe('Start point [x, y]'),
  through: PointArraySchema.describe('Point arc passes through [x, y]'),
  to: PointArraySchema.describe('End point [x, y]'),
  strokeColor: ColorSchema.optional().describe('Arc color'),
  strokeWidth: z.number().optional().describe('Arc width'),
});

// =============================================================================
// ANIMATION TYPES
// =============================================================================

export const SimpleAnimationTypeSchema = z.enum([
  'pulse',
  'rotate',
  'bounce',
  'fade',
  'wobble',
  'slide',
  'typewriter',
]).describe('Simple loop animation type');

export type SimpleAnimationType = z.infer<typeof SimpleAnimationTypeSchema>;

// Keyframe schema
export const KeyframeSchema = z.object({
  time: z.number().describe('Time in seconds for this keyframe'),
  properties: z.record(z.unknown()).describe('Property values at this keyframe'),
  easing: EasingSchema.optional().default('linear'),
});

export type Keyframe = z.infer<typeof KeyframeSchema>;

// =============================================================================
// RELATION TYPES
// =============================================================================

export const RelationTypeSchema = z.enum([
  'orbits',
  'follows',
  'attached_to',
  'maintains_distance',
  'points_at',
  'mirrors',
  'parallax',
  'bounds_to',
  'animates',
]).describe('Type of relationship between items');

export type RelationType = z.infer<typeof RelationTypeSchema>;

// Relation parameter schemas
export const OrbitsParamsSchema = z.object({
  radius: z.number().optional().default(100).describe('Orbit radius'),
  speed: z.number().optional().default(1).describe('Rotation speed'),
  direction: z.enum(['clockwise', 'counterclockwise']).optional().default('counterclockwise'),
  phase: z.number().optional().default(0).describe('Starting angle offset'),
});

export const FollowsParamsSchema = z.object({
  offset: PointArraySchema.optional().default([0, 0]).describe('Position offset from target'),
  smoothing: z.number().min(0).max(1).optional().default(0.1).describe('Movement smoothing'),
  delay: z.number().optional().default(0).describe('Follow delay in seconds'),
});

export const AttachedToParamsSchema = z.object({
  offset: PointArraySchema.optional().default([0, 0]).describe('Fixed offset from target'),
  inherit_rotation: z.boolean().optional().default(false).describe('Also rotate with target'),
});

export const MaintainsDistanceParamsSchema = z.object({
  distance: z.number().describe('Target distance in pixels'),
  strength: z.number().min(0).max(1).optional().default(1).describe('How strongly to maintain distance'),
});

export const PointsAtParamsSchema = z.object({
  offset_angle: z.number().optional().default(0).describe('Angle offset in degrees'),
  smoothing: z.number().min(0).max(1).optional().default(0).describe('Rotation smoothing'),
});

export const MirrorsParamsSchema = z.object({
  axis: z.enum(['vertical', 'horizontal', 'both']).optional().default('vertical'),
  center: PointArraySchema.optional().describe('Mirror center point'),
});

export const ParallaxParamsSchema = z.object({
  depth: z.number().min(0).max(1).optional().default(0.5).describe('Depth factor'),
  origin: PointArraySchema.optional().default([0, 0]).describe('Parallax origin point'),
});

export const BoundsToParamsSchema = z.object({
  padding: z.number().optional().default(0).describe('Inner padding'),
  bounce: z.boolean().optional().default(false).describe('Bounce off edges'),
});

export const AnimatesParamsSchema = z.object({
  keyframes: z.array(KeyframeSchema).describe('Animation keyframes'),
  duration: z.number().describe('Total animation duration in seconds'),
  loop: z.boolean().optional().default(false).describe('Whether to loop the animation'),
});

// =============================================================================
// GENERATOR TYPES
// =============================================================================

export const GeneratorNameSchema = z.enum([
  'drawSunburst',
  'drawSunsetScene',
  'drawGrid',
  'drawStackedCircles',
  'drawCircuit',
  'drawWaves',
  'drawPattern',
]).describe('Background generator name');

export type GeneratorName = z.infer<typeof GeneratorNameSchema>;

// Generator parameter schemas
export const SunburstParamsSchema = z.object({
  rayCount: z.number().optional().default(16).describe('Number of rays'),
  colors: z.array(ColorSchema).optional().default(['#FF6B6B', '#4ECDC4']).describe('Ray colors'),
  bgColor: ColorSchema.optional().default('#1a1a2e').describe('Background color'),
  animated: z.boolean().optional().default(true).describe('Enable rotation animation'),
});

export const GridParamsSchema = z.object({
  gridType: z.enum(['lines', 'dots', 'squares']).optional().default('lines'),
  spacing: z.number().optional().default(40).describe('Grid cell size'),
  lineColor: ColorSchema.optional().default('#374151').describe('Line/dot color'),
  bgColor: ColorSchema.optional().default('#1f2937').describe('Background color'),
  lineWidth: z.number().optional().default(1).describe('Line thickness'),
});

export const WavesParamsSchema = z.object({
  waveCount: z.number().optional().default(5).describe('Number of wave layers'),
  colors: z.array(ColorSchema).optional().describe('Wave colors'),
  amplitude: z.number().optional().default(50).describe('Wave height'),
  frequency: z.number().optional().default(2).describe('Wave frequency'),
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color'),
  animated: z.boolean().optional().default(true).describe('Animate waves'),
});

export const CircuitParamsSchema = z.object({
  lineColor: ColorSchema.optional().default('#60a5fa').describe('Circuit line color'),
  nodeColor: ColorSchema.optional().default('#3b82f6').describe('Node/junction color'),
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color'),
  density: z.number().min(0).max(1).optional().default(0.5).describe('Circuit complexity'),
  animated: z.boolean().optional().default(true).describe('Enable bolt animation'),
  boltColor: ColorSchema.optional().default('#fbbf24').describe('Animated bolt color'),
});

// =============================================================================
// EFFECT TYPES
// =============================================================================

export const EffectTypeSchema = z.enum([
  'sparkle',
  'blast',
]).describe('Visual effect type');

export const SparkleParamsSchema = z.object({
  color: ColorSchema.optional().default('#fbbf24').describe('Sparkle color'),
  speed: z.number().optional().default(1).describe('Animation speed'),
  size: z.number().optional().default(3).describe('Sparkle size'),
});

export const BlastParamsSchema = z.object({
  color: ColorSchema.optional().default('#ef4444').describe('Blast color'),
  radius: z.number().optional().default(100).describe('Blast radius'),
  count: z.number().optional().default(20).describe('Particle count'),
});

// =============================================================================
// FILTER TYPES
// =============================================================================

export const FilterTypeSchema = z.enum([
  'grayscale',
  'sepia',
  'blur',
  'brightness',
  'contrast',
  'saturation',
  'invert',
  'noise',
  'vignette',
  'vintage',
  'colorOverlay',
  'sharpen',
  'emboss',
  'posterize',
]).describe('Type of visual filter to apply');

export type FilterType = z.infer<typeof FilterTypeSchema>;

// =============================================================================
// TOOL INPUT SCHEMAS
// =============================================================================

// Import SVG
export const ImportSVGInputSchema = z.object({
  svgString: z.string().optional().describe('SVG markup string to import'),
  url: z.string().optional().describe('URL to fetch SVG from'),
  position: PositionSchema.optional().default({ x: 400, y: 300 }),
  scale: z.number().optional().default(1.0).describe('Scale factor'),
});

// Add Filter
export const AddFilterInputSchema = z.object({
  filterType: FilterTypeSchema,
  params: z.record(z.unknown()).optional().default({}),
});

// Create Item
export const CreateItemInputSchema = z.object({
  itemType: ItemTypeSchema,
  position: PositionSchema.optional().default({ x: 400, y: 300 }),
  properties: z.record(z.unknown()).optional().default({}),
});

// Modify Item
export const ModifyItemInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  properties: z.record(z.unknown()).describe('Properties to update'),
});

// Delete Item
export const DeleteItemInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item to delete'),
});

// Add Relation
export const AddRelationInputSchema = z.object({
  sourceId: z.string().describe('Registry ID of the source item'),
  targetId: z.string().describe('Registry ID of the target item'),
  relationType: RelationTypeSchema,
  params: z.record(z.unknown()).optional().default({}),
});

// Remove Relation
export const RemoveRelationInputSchema = z.object({
  sourceId: z.string().describe('Source item ID'),
  targetId: z.string().describe('Target item ID'),
  relationType: RelationTypeSchema.optional().describe('Specific relation type to remove'),
});

// Query Relations
export const QueryRelationsInputSchema = z.object({
  itemId: z.string().describe('Item to query relations for'),
  relationType: RelationTypeSchema.optional().describe('Filter by relation type'),
  direction: z.enum(['outgoing', 'incoming']).optional().default('outgoing'),
});

// Animate Item
export const AnimateItemInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  animationType: SimpleAnimationTypeSchema,
  speed: z.number().optional().default(1).describe('Animation speed multiplier'),
});

// Keyframe Animate
export const KeyframeAnimateInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  keyframes: z.array(KeyframeSchema),
  duration: z.number().optional().describe('Total animation duration'),
  loop: z.boolean().optional().default(false),
});

// Execute Generator
export const ExecuteGeneratorInputSchema = z.object({
  generatorName: GeneratorNameSchema,
  params: z.record(z.unknown()).optional().default({}),
});

// Apply Effect
export const ApplyEffectInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  effectType: EffectTypeSchema,
  params: z.record(z.unknown()).optional().default({}),
});

// Get Items
export const GetItemsInputSchema = z.object({
  filter: z.object({
    type: ItemTypeSchema.optional().describe('Filter by item type'),
    source: z.enum(['user', 'generator', 'import']).optional(),
    hasAnimation: z.boolean().optional(),
    hasRelation: z.boolean().optional(),
  }).optional(),
});

// Play Timeline
export const PlayTimelineInputSchema = z.object({
  action: z.enum(['play', 'stop', 'seek']),
  duration: z.number().optional().describe('Duration for play action'),
  loop: z.boolean().optional(),
  time: z.number().optional().describe('Time to seek to'),
});

// Canvas Control
export const SetBackgroundColorInputSchema = z.object({
  color: ColorSchema.describe('Background color to set'),
});

export const SetCanvasSizeInputSchema = z.object({
  width: z.number().describe('Canvas width'),
  height: z.number().describe('Canvas height'),
  preset: z.string().optional().describe('Optional preset name'),
});

// Export
export const ExportSVGInputSchema = z.object({
  animated: z.boolean().optional().default(true).describe('Include animations'),
});

export const ExportTrainingDataInputSchema = z.object({
  format: z.enum(['json', 'jsonl']).optional().default('json'),
  includeMetadata: z.boolean().optional().default(true),
});

// =============================================================================
// TOOL OUTPUT TYPES
// =============================================================================

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateItemResult {
  itemId: string;
  type: ItemType;
  position: { x: number; y: number };
}

export interface QueryItemsResult {
  items: Array<{
    id: string;
    type: ItemType;
    position?: { x: number; y: number };
    hasAnimation: boolean;
    relations: RelationType[];
  }>;
  count: number;
}

export interface ExportTrainingDataResult {
  trainingData: Array<{
    instruction: string;
    code: string;
    relation: string;
    params: Record<string, unknown>;
  }>;
  count: number;
}

// =============================================================================
// ERROR CODES
// =============================================================================

export const ErrorCodes = {
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INVALID_RELATION: 'INVALID_RELATION',
  INVALID_PARAMS: 'INVALID_PARAMS',
  GENERATOR_NOT_FOUND: 'GENERATOR_NOT_FOUND',
  EXPORT_FAILED: 'EXPORT_FAILED',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
