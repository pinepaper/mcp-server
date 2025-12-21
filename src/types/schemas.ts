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

// =============================================================================
// GRADIENT SCHEMAS
// =============================================================================

export const GradientStopSchema = z.object({
  color: z.string().describe('Color at this stop (hex, rgb, or named color)'),
  offset: z.number().min(0).max(1).describe('Position along gradient (0-1)'),
});

export type GradientStop = z.infer<typeof GradientStopSchema>;

export const GradientSchema = z.object({
  type: z.enum(['linear', 'radial']).describe('Gradient type'),
  stops: z.array(GradientStopSchema).min(2).describe('Array of color stops (minimum 2)'),
  origin: PointArraySchema.optional().describe('Gradient start point [x, y] (relative to item or absolute)'),
  destination: PointArraySchema.optional().describe('Gradient end point [x, y] (relative to item or absolute)'),
});

export type Gradient = z.infer<typeof GradientSchema>;

// Color can be a simple string OR a gradient object
export const ColorSchema = z.union([
  z.string().describe('Solid color value (hex, rgb, or named color)'),
  GradientSchema,
]).describe('Color value - either a solid color string or a gradient object');

// Simple color schema for cases where only solid colors are allowed
export const SolidColorSchema = z.string().describe('Color value (hex, rgb, or named color)');

// =============================================================================
// SHADOW SCHEMAS
// =============================================================================

export const ShadowPropertiesSchema = z.object({
  shadowColor: z.string().optional().describe('Shadow color (hex, rgb, or named color)'),
  shadowBlur: z.number().optional().describe('Shadow blur radius in pixels'),
  shadowOffset: PointArraySchema.optional().describe('Shadow offset [x, y] in pixels'),
});

export type ShadowProperties = z.infer<typeof ShadowPropertiesSchema>;

// =============================================================================
// BLEND MODE SCHEMA
// =============================================================================

export const BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
]).describe('Blend mode for compositing with background');

export type BlendMode = z.infer<typeof BlendModeSchema>;

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

// Base visual properties shared by all shapes (shadow, blend mode, opacity)
export const BaseVisualPropertiesSchema = z.object({
  shadowColor: z.string().optional().describe('Shadow color (hex, rgb, or named color)'),
  shadowBlur: z.number().optional().describe('Shadow blur radius in pixels'),
  shadowOffset: PointArraySchema.optional().describe('Shadow offset [x, y] in pixels'),
  blendMode: BlendModeSchema.optional().describe('Blend mode for compositing'),
  opacity: z.number().min(0).max(1).optional().describe('Opacity (0-1)'),
});

// Circle properties
export const CirclePropertiesSchema = z.object({
  radius: z.number().describe('Circle radius in pixels'),
  color: ColorSchema.optional().describe('Fill color (solid or gradient)'),
  strokeColor: ColorSchema.optional().describe('Stroke color'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
}).merge(BaseVisualPropertiesSchema);

// Star properties
export const StarPropertiesSchema = z.object({
  radius1: z.number().describe('Outer radius of star'),
  radius2: z.number().describe('Inner radius of star'),
  points: z.number().optional().default(5).describe('Number of star points'),
  color: ColorSchema.optional().describe('Fill color (solid or gradient)'),
}).merge(BaseVisualPropertiesSchema);

// Rectangle properties
export const RectanglePropertiesSchema = z.object({
  width: z.number().describe('Rectangle width'),
  height: z.number().describe('Rectangle height'),
  color: ColorSchema.optional().describe('Fill color (solid or gradient)'),
  cornerRadius: z.number().optional().describe('Corner radius for rounded rectangles'),
}).merge(BaseVisualPropertiesSchema);

// Polygon properties
export const PolygonPropertiesSchema = z.object({
  sides: z.number().min(3).describe('Number of polygon sides'),
  radius: z.number().describe('Polygon radius'),
  color: ColorSchema.optional().describe('Fill color (solid or gradient)'),
}).merge(BaseVisualPropertiesSchema);

// Ellipse properties
export const EllipsePropertiesSchema = z.object({
  width: z.number().optional().describe('Ellipse width'),
  height: z.number().optional().describe('Ellipse height'),
  color: ColorSchema.optional().describe('Fill color (solid or gradient)'),
  strokeColor: ColorSchema.optional().describe('Stroke color'),
  strokeWidth: z.number().optional().describe('Stroke width in pixels'),
}).merge(BaseVisualPropertiesSchema);

// Path properties
export const PathPropertiesSchema = z.object({
  segments: z.array(PointArraySchema).optional().describe('Array of [x, y] points'),
  pathData: z.string().optional().describe('SVG path data string'),
  strokeColor: ColorSchema.optional().describe('Stroke color'),
  strokeWidth: z.number().optional().describe('Stroke width'),
  fillColor: ColorSchema.optional().describe('Fill color (solid or gradient)'),
  closed: z.boolean().optional().describe('Whether to close the path'),
  smooth: z.boolean().optional().describe('Whether to smooth the path'),
}).merge(BaseVisualPropertiesSchema);

// Line properties
export const LinePropertiesSchema = z.object({
  from: PointArraySchema.describe('Start point [x, y]'),
  to: PointArraySchema.describe('End point [x, y]'),
  strokeColor: ColorSchema.optional().describe('Line color'),
  strokeWidth: z.number().optional().describe('Line width'),
}).merge(BaseVisualPropertiesSchema);

// Arc properties
export const ArcPropertiesSchema = z.object({
  from: PointArraySchema.describe('Start point [x, y]'),
  through: PointArraySchema.describe('Point arc passes through [x, y]'),
  to: PointArraySchema.describe('End point [x, y]'),
  strokeColor: ColorSchema.optional().describe('Arc color'),
  strokeWidth: z.number().optional().describe('Arc width'),
}).merge(BaseVisualPropertiesSchema);

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

// Light direction for 3D effects
export const LightDirectionSchema = z.enum([
  'top-left',
  'top-right',
  'top',
  'left',
  'right',
  'bottom-left',
  'bottom-right',
  'bottom',
]).describe('Direction of the light source for 3D effects');

export type LightDirection = z.infer<typeof LightDirectionSchema>;

// Create Glossy Sphere - high-level tool for creating 3D-looking spheres
export const CreateGlossySphereInputSchema = z.object({
  position: PositionSchema.optional().default({ x: 400, y: 300 }).describe('Center position of the sphere'),
  radius: z.number().describe('Sphere radius in pixels'),
  baseColor: z.string().describe('Main sphere color (hex, rgb, or named color)'),
  lightDirection: LightDirectionSchema.optional().default('top-left').describe('Direction of the light source'),
  glossiness: z.number().min(0).max(1).optional().default(0.7).describe('Glossiness/shininess level (0-1)'),
  castShadow: z.boolean().optional().default(true).describe('Whether to cast a shadow underneath'),
  shadowIntensity: z.number().min(0).max(1).optional().default(0.3).describe('Shadow darkness (0-1)'),
});

export type CreateGlossySphereInput = z.infer<typeof CreateGlossySphereInputSchema>;

// Create Diagonal Stripes - high-level tool for creating diagonal stripe patterns
export const CreateDiagonalStripesInputSchema = z.object({
  position: PositionSchema.optional().default({ x: 400, y: 300 }).describe('Center position of the stripe area'),
  width: z.number().describe('Total width of the stripe area'),
  height: z.number().describe('Total height of the stripe area'),
  stripeWidth: z.number().optional().default(50).describe('Width of each stripe'),
  colors: z.array(z.string()).min(2).describe('Array of colors to alternate between'),
  angle: z.number().optional().default(-45).describe('Rotation angle in degrees (negative = top-right to bottom-left)'),
  gap: z.number().optional().default(0).describe('Gap between stripes in pixels'),
});

export type CreateDiagonalStripesInput = z.infer<typeof CreateDiagonalStripesInputSchema>;

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
  color: SolidColorSchema.describe('Background color to set (solid colors only)'),
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
// BATCH OPERATION SCHEMAS
// =============================================================================

// Single item specification for batch create
export const BatchCreateItemSchema = z.object({
  type: ItemTypeSchema.describe('Type of item to create'),
  params: z.record(z.unknown()).describe('Item-specific parameters (position, properties, etc.)'),
});

export type BatchCreateItem = z.infer<typeof BatchCreateItemSchema>;

// Batch Create Input
export const BatchCreateInputSchema = z.object({
  items: z.array(BatchCreateItemSchema).min(1).describe('Array of items to create'),
});

export type BatchCreateInput = z.infer<typeof BatchCreateInputSchema>;

// Single modification specification for batch modify
export const BatchModifyItemSchema = z.object({
  itemId: z.string().describe('Registry ID of the item to modify'),
  params: z.record(z.unknown()).describe('Properties to update on this item'),
});

export type BatchModifyItem = z.infer<typeof BatchModifyItemSchema>;

// Batch Modify Input
export const BatchModifyInputSchema = z.object({
  modifications: z.array(BatchModifyItemSchema).min(1).describe('Array of modifications to apply'),
});

export type BatchModifyInput = z.infer<typeof BatchModifyInputSchema>;

// Create Grid Input - convenience method for creating grids
export const CreateGridInputSchema = z.object({
  cols: z.number().optional().default(10).describe('Number of columns'),
  rows: z.number().optional().default(10).describe('Number of rows'),
  strokeColor: z.string().optional().default('#888888').describe('Line color'),
  strokeWidth: z.number().optional().default(1).describe('Line thickness'),
  animated: z.boolean().optional().default(false).describe('Enable wave animation'),
  waveSpeed: z.number().optional().default(2).describe('Animation speed'),
  waveAmplitude: z.number().optional().default(2).describe('Wave intensity in pixels'),
});

export type CreateGridInput = z.infer<typeof CreateGridInputSchema>;

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
// PERFORMANCE METRICS SCHEMAS
// =============================================================================

export const GetPerformanceMetricsInputSchema = z.object({
  toolName: z.string().optional().describe('Filter by tool name'),
  phase: z.enum(['validation', 'code_generation', 'browser_execution', 'screenshot', 'total']).optional().describe('Filter by execution phase'),
  since: z.number().optional().describe('Unix timestamp - metrics since this time'),
  limit: z.number().min(1).max(10000).optional().describe('Maximum number of results'),
  format: z.enum(['summary', 'detailed', 'csv']).optional().describe('Export format'),
});

export type GetPerformanceMetricsInput = z.infer<typeof GetPerformanceMetricsInputSchema>;

// =============================================================================
// ASSET SCHEMAS
// =============================================================================

export const SearchAssetsInputSchema = z.object({
  query: z.string().describe('Search term (e.g., "rocket", "heart", "user icon")'),
  repository: z.enum(['all', 'svgrepo', 'openclipart', 'iconify', 'fontawesome']).optional().describe('Which repository to search (default: all)'),
  limit: z.number().min(1).max(50).optional().describe('Max results to return (default: 10)'),
  includeSvgContent: z.boolean().optional().describe('Include actual SVG content for each result (default: false). When true, fetches and returns the SVG string for each asset, enabling AI to display or describe the icons.'),
});

export type SearchAssetsInput = z.infer<typeof SearchAssetsInputSchema>;

export const ImportAssetInputSchema = z.object({
  assetId: z.string().optional().describe('Asset ID from search results (e.g., "svgrepo_12345")'),
  url: z.string().optional().describe('Direct URL to SVG (alternative to assetId)'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe('Position on canvas'),
  scale: z.number().optional().describe('Scale factor (default: 1.0)'),
  color: z.string().optional().describe('Override color for monochrome icons'),
});

export type ImportAssetInput = z.infer<typeof ImportAssetInputSchema>;

// =============================================================================
// P5.JS COMPATIBILITY
// =============================================================================

export const P5DrawInputSchema = z.object({
  code: z.string().describe('p5.js-style drawing code to execute'),
});

export type P5DrawInput = z.infer<typeof P5DrawInputSchema>;

// =============================================================================
// COMPOSITE SCENE SCHEMA
// =============================================================================

/**
 * Composite scene creation - create multiple items, relations, and animations
 * in a single operation. This is the most efficient way to create complex scenes.
 */
export const SceneItemSchema = z.object({
  /** Temporary ID for referencing in relations (e.g., "sun", "earth") */
  name: z.string().describe('Reference name for this item (used in relations)'),
  /** Item type to create */
  itemType: z.enum(['text', 'circle', 'star', 'rectangle', 'triangle', 'polygon', 'ellipse', 'path', 'line', 'arc']),
  /** Position on canvas */
  position: PositionSchema.optional(),
  /** Item-specific properties */
  properties: z.record(z.unknown()).optional().describe('Type-specific properties (color, radius, content, etc.)'),
});

export const SceneRelationSchema = z.object({
  /** Reference name of the source item */
  source: z.string().describe('Name of the item that will be animated'),
  /** Reference name of the target item */
  target: z.string().describe('Name of the item to relate to'),
  /** Type of relation */
  type: z.enum(['orbits', 'follows', 'attached_to', 'maintains_distance', 'points_at', 'mirrors', 'parallax', 'bounds_to']),
  /** Relation-specific parameters */
  params: z.record(z.unknown()).optional().describe('Relation parameters (radius, speed, distance, etc.)'),
});

export const SceneAnimationSchema = z.object({
  /** Reference name of the item to animate */
  target: z.string().describe('Name of the item to animate'),
  /** Type of animation */
  type: z.enum(['pulse', 'rotate', 'bounce', 'fade', 'wobble', 'slide', 'typewriter']),
  /** Animation speed (default: 1.0) */
  speed: z.number().optional(),
  /** Animation parameters */
  params: z.record(z.unknown()).optional().describe('Animation-specific parameters'),
});

export const CreateSceneInputSchema = z.object({
  /** Items to create in the scene */
  items: z.array(SceneItemSchema).describe('Array of items to create'),
  /** Relations between items */
  relations: z.array(SceneRelationSchema).optional().describe('Array of relations to establish'),
  /** Animations to apply */
  animations: z.array(SceneAnimationSchema).optional().describe('Array of animations to apply'),
  /** Background color (hex, rgb, or named) */
  backgroundColor: z.string().optional().describe('Background color for the scene'),
  /** Background generator to use */
  backgroundGenerator: z.string().optional().describe('Name of generator to use for background'),
  /** Whether to clear canvas first (default: true) */
  clearFirst: z.boolean().optional().describe('Clear canvas before creating scene (default: true)'),
});

export type SceneItem = z.infer<typeof SceneItemSchema>;
export type SceneRelation = z.infer<typeof SceneRelationSchema>;
export type SceneAnimation = z.infer<typeof SceneAnimationSchema>;
export type CreateSceneInput = z.infer<typeof CreateSceneInputSchema>;

// =============================================================================
// DIAGRAM SCHEMAS
// =============================================================================

/**
 * Diagram shape types - available shapes for flowcharts, UML, network diagrams
 */
export const DiagramShapeTypeSchema = z.enum([
  // Flowchart shapes
  'process',
  'decision',
  'terminal',
  'data',
  'document',
  'database',
  'preparation',
  // UML shapes
  'uml-class',
  'uml-usecase',
  'uml-actor',
  // Network shapes
  'cloud',
  'server',
  // Basic shapes
  'rectangle',
  'circle',
  'triangle',
  'star',
]).describe('Type of diagram shape');

export type DiagramShapeType = z.infer<typeof DiagramShapeTypeSchema>;

/**
 * Connector routing styles
 */
export const ConnectorRoutingSchema = z.enum([
  'direct',
  'orthogonal',
  'curved',
]).describe('Connector path routing style');

export type ConnectorRouting = z.infer<typeof ConnectorRoutingSchema>;

/**
 * Connector line styles
 */
export const ConnectorLineStyleSchema = z.enum([
  'solid',
  'dashed',
  'dotted',
]).describe('Connector line style');

export type ConnectorLineStyle = z.infer<typeof ConnectorLineStyleSchema>;

/**
 * Arrow head styles
 */
export const ArrowHeadStyleSchema = z.enum([
  'classic',
  'stealth',
  'sharp',
  'open',
  'diamond',
  'circle',
  'none',
]).describe('Arrowhead style');

export type ArrowHeadStyle = z.infer<typeof ArrowHeadStyleSchema>;

/**
 * Port positions on items
 */
export const PortPositionSchema = z.enum([
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
  'center',
  'start',
  'end',
]).describe('Port position on item');

export type PortPosition = z.infer<typeof PortPositionSchema>;

/**
 * Port types for connection direction control
 */
export const PortTypeSchema = z.enum([
  'input',
  'output',
  'both',
]).describe('Port connection type');

export type PortType = z.infer<typeof PortTypeSchema>;

/**
 * Layout types for auto-layout
 */
export const LayoutTypeSchema = z.enum([
  'hierarchical',
  'force-directed',
  'tree',
  'radial',
  'grid',
]).describe('Layout algorithm type');

export type LayoutType = z.infer<typeof LayoutTypeSchema>;

/**
 * Layout direction for hierarchical/tree layouts
 */
export const LayoutDirectionSchema = z.enum([
  'TB',
  'BT',
  'LR',
  'RL',
]).describe('Layout direction: TB=Top-Bottom, BT=Bottom-Top, LR=Left-Right, RL=Right-Left');

export type LayoutDirection = z.infer<typeof LayoutDirectionSchema>;

/**
 * Diagram mode actions
 */
export const DiagramModeActionSchema = z.enum([
  'activate',
  'deactivate',
  'toggle',
  'setMode',
]).describe('Diagram mode action');

export type DiagramModeAction = z.infer<typeof DiagramModeActionSchema>;

/**
 * Diagram tool modes
 */
export const DiagramToolModeSchema = z.enum([
  'select',
  'connect',
  'shape',
  'pan',
]).describe('Diagram tool mode');

export type DiagramToolMode = z.infer<typeof DiagramToolModeSchema>;

// =============================================================================
// DIAGRAM TOOL INPUT SCHEMAS
// =============================================================================

/**
 * Create Diagram Shape input
 */
export const CreateDiagramShapeInputSchema = z.object({
  shapeType: DiagramShapeTypeSchema,
  position: PositionSchema.optional().default({ x: 400, y: 300 }),
  width: z.number().optional().describe('Shape width in pixels'),
  height: z.number().optional().describe('Shape height in pixels'),
  label: z.string().optional().describe('Text label inside the shape'),
  style: z.object({
    fillColor: z.string().optional().describe('Fill color'),
    strokeColor: z.string().optional().describe('Stroke color'),
    strokeWidth: z.number().optional().describe('Stroke width'),
  }).optional(),
});

export type CreateDiagramShapeInput = z.infer<typeof CreateDiagramShapeInputSchema>;

/**
 * Connect items input
 */
export const ConnectInputSchema = z.object({
  sourceItemId: z.string().describe('Registry ID of source item'),
  targetItemId: z.string().describe('Registry ID of target item'),
  routing: ConnectorRoutingSchema.optional().default('orthogonal'),
  lineColor: z.string().optional().describe('Connector line color'),
  lineWidth: z.number().optional().describe('Line width in pixels'),
  lineStyle: ConnectorLineStyleSchema.optional().default('solid'),
  headStyle: ArrowHeadStyleSchema.optional().default('classic'),
  tailStyle: ArrowHeadStyleSchema.optional().default('none'),
  label: z.string().optional().describe('Label text on connector'),
  curvature: z.number().min(0.1).max(1.0).optional().default(0.5).describe('Curve intensity for curved routing'),
  boltEnabled: z.boolean().optional().default(true).describe('Enable animated bolt effect'),
  boltColor: z.string().optional().default('#fbbf24').describe('Bolt animation color'),
});

export type ConnectInput = z.infer<typeof ConnectInputSchema>;

/**
 * Connect specific ports input
 */
export const ConnectPortsInputSchema = z.object({
  sourceItemId: z.string().describe('Registry ID of source item'),
  sourcePort: PortPositionSchema.describe('Port position on source'),
  targetItemId: z.string().describe('Registry ID of target item'),
  targetPort: PortPositionSchema.describe('Port position on target'),
  config: z.object({
    routing: ConnectorRoutingSchema.optional(),
    lineColor: z.string().optional(),
    lineWidth: z.number().optional(),
    lineStyle: ConnectorLineStyleSchema.optional(),
    headStyle: ArrowHeadStyleSchema.optional(),
    tailStyle: ArrowHeadStyleSchema.optional(),
    label: z.string().optional(),
    curvature: z.number().min(0.1).max(1.0).optional(),
    boltEnabled: z.boolean().optional(),
    boltColor: z.string().optional(),
  }).optional(),
});

export type ConnectPortsInput = z.infer<typeof ConnectPortsInputSchema>;

/**
 * Port configuration for custom ports
 */
export const PortConfigSchema = z.object({
  position: PortPositionSchema,
  type: PortTypeSchema.optional().default('both'),
});

export type PortConfig = z.infer<typeof PortConfigSchema>;

/**
 * Add ports input
 */
export const AddPortsInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  portType: z.enum(['standard', 'line', 'path', 'custom']).optional().default('standard'),
  ports: z.array(PortConfigSchema).optional().describe('Custom port definitions'),
  count: z.number().optional().describe('Number of ports for path type'),
});

export type AddPortsInput = z.infer<typeof AddPortsInputSchema>;

/**
 * Auto layout input
 */
export const AutoLayoutInputSchema = z.object({
  layoutType: LayoutTypeSchema,
  itemIds: z.array(z.string()).optional().describe('Items to include (default: all items with ports)'),
  options: z.object({
    direction: LayoutDirectionSchema.optional().default('TB'),
    levelSpacing: z.number().optional().default(100),
    nodeSpacing: z.number().optional().default(80),
    iterations: z.number().optional().default(100),
    attraction: z.number().optional().default(0.01),
    repulsion: z.number().optional().default(1000),
    columns: z.number().optional(),
    cellWidth: z.number().optional().default(150),
    cellHeight: z.number().optional().default(100),
    centerX: z.number().optional(),
    centerY: z.number().optional(),
    startRadius: z.number().optional().default(100),
    radiusStep: z.number().optional().default(80),
    animate: z.boolean().optional().default(true),
    animationDuration: z.number().optional().default(300),
  }).optional(),
});

export type AutoLayoutInput = z.infer<typeof AutoLayoutInputSchema>;

/**
 * Get diagram shapes input
 */
export const GetDiagramShapesInputSchema = z.object({
  category: z.enum(['flowchart', 'uml', 'network', 'basic']).optional().describe('Filter by category'),
});

export type GetDiagramShapesInput = z.infer<typeof GetDiagramShapesInputSchema>;

/**
 * Update connector input
 */
export const UpdateConnectorInputSchema = z.object({
  connectorId: z.string().describe('Connector ID to update'),
  style: z.object({
    lineColor: z.string().optional(),
    lineWidth: z.number().optional(),
    headStyle: ArrowHeadStyleSchema.optional(),
    tailStyle: ArrowHeadStyleSchema.optional(),
    routing: ConnectorRoutingSchema.optional(),
    lineStyle: ConnectorLineStyleSchema.optional(),
  }).optional(),
  label: z.string().optional().describe('Update connector label'),
  labelPosition: z.number().min(0).max(1).optional().describe('Label position along path (0-1)'),
});

export type UpdateConnectorInput = z.infer<typeof UpdateConnectorInputSchema>;

/**
 * Remove connector input
 */
export const RemoveConnectorInputSchema = z.object({
  connectorId: z.string().describe('Connector ID to remove'),
});

export type RemoveConnectorInput = z.infer<typeof RemoveConnectorInputSchema>;

/**
 * Diagram mode input
 */
export const DiagramModeInputSchema = z.object({
  action: DiagramModeActionSchema,
  mode: DiagramToolModeSchema.optional().describe('Tool mode for setMode action'),
  shapeType: DiagramShapeTypeSchema.optional().describe('Shape type for shape mode'),
});

export type DiagramModeInput = z.infer<typeof DiagramModeInputSchema>;

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
