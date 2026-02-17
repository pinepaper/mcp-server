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
  // Manim-inspired animation relations
  'grows_from',
  'staggered_with',
  'indicates',
  'circumscribes',
  'wave_through',
  'camera_follows',
  'camera_animates',
  'morphs_to',
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

// Manim-inspired relation parameter schemas
export const GrowsFromParamsSchema = z.object({
  origin: z.enum(['center', 'top', 'bottom', 'left', 'right', 'topLeft', 'topRight', 'bottomLeft', 'bottomRight']).optional().default('center').describe('Growth origin point'),
  duration: z.number().optional().default(1).describe('Growth duration in seconds'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
  easing: z.string().optional().default('easeOutCubic').describe('Easing function'),
});

export const StaggeredWithParamsSchema = z.object({
  index: z.number().describe('0-based position in the stagger sequence'),
  stagger: z.number().optional().default(0.1).describe('Delay between items in seconds'),
  effect: z.enum(['fadeIn', 'fadeOut', 'growIn', 'slideIn', 'popIn']).optional().default('fadeIn').describe('Stagger effect type'),
});

export const IndicatesParamsSchema = z.object({
  scale: z.number().optional().default(1.3).describe('Max scale during indication'),
  color: ColorSchema.optional().describe('Highlight color'),
  duration: z.number().optional().default(0.5).describe('Indication duration in seconds'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
  repeat: z.number().optional().default(1).describe('Number of indication cycles'),
});

export const CircumscribesParamsSchema = z.object({
  shape: z.enum(['rectangle', 'circle', 'ellipse']).optional().default('rectangle').describe('Circumscribe shape'),
  color: ColorSchema.optional().default('#ef4444').describe('Stroke color'),
  strokeWidth: z.number().optional().default(2).describe('Stroke width'),
  padding: z.number().optional().default(10).describe('Padding around target'),
  duration: z.number().optional().default(1).describe('Draw duration in seconds'),
  fadeOut: z.boolean().optional().default(true).describe('Fade out after drawing'),
});

export const WaveThroughParamsSchema = z.object({
  amplitude: z.number().optional().default(20).describe('Wave amplitude in pixels'),
  frequency: z.number().optional().default(2).describe('Number of wave cycles'),
  direction: z.enum(['horizontal', 'vertical']).optional().default('horizontal').describe('Wave direction'),
  duration: z.number().optional().default(1).describe('Wave duration in seconds'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
});

export const CameraFollowsParamsSchema = z.object({
  smoothing: z.number().min(0).max(1).optional().default(0.1).describe('Camera movement smoothing'),
  offset: PointArraySchema.optional().default([0, 0]).describe('Camera offset from target'),
  zoom: z.number().optional().default(1).describe('Zoom level'),
  deadzone: z.number().optional().default(50).describe('Deadzone radius in pixels'),
  bounds: z.object({
    minX: z.number().optional(),
    maxX: z.number().optional(),
    minY: z.number().optional(),
    maxY: z.number().optional(),
  }).optional().describe('Camera bounds'),
});

export const MorphsToParamsSchema = z.object({
  duration: z.number().optional().default(1.5).describe('Morph duration in seconds'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
  easing: z.string().optional().default('easeInOutCubic').describe('Easing function'),
  morphColor: z.boolean().optional().default(true).describe('Also morph color'),
  morphSize: z.boolean().optional().default(true).describe('Also morph size'),
});

// =============================================================================
// CUSTOM RELATION REGISTRATION
// =============================================================================

export const CustomRelationParamDefSchema = z.object({
  type: z.enum(['number', 'string', 'boolean', 'array', 'object']).describe('Parameter type'),
  default: z.any().optional().describe('Default value'),
  description: z.string().optional().describe('Parameter description'),
  options: z.array(z.string()).optional().describe('Valid options for string type'),
  min: z.number().optional().describe('Minimum value for number type'),
  max: z.number().optional().describe('Maximum value for number type'),
});

export const RegisterCustomRelationInputSchema = z.object({
  name: z.string().describe('Unique relation type name'),
  description: z.string().optional().describe('Human-readable description'),
  params: z.record(z.string(), CustomRelationParamDefSchema).optional().describe('Parameter schema'),
  computeFunction: z.string().describe('Compute function body (pure JS, receives ctx with fromPosition, toPosition, params, delta, time)'),
  applyFunction: z.string().describe('Apply function body (can use Paper.js, receives item, target, computed, params)'),
  templates: z.array(z.string()).optional().describe('Natural language templates for training data'),
  continuous: z.boolean().optional().default(true).describe('Update every frame'),
  priority: z.number().optional().default(0).describe('Execution order (lower = first)'),
}).describe('Register a custom relation type');

export type RegisterCustomRelationInput = z.infer<typeof RegisterCustomRelationInputSchema>;

// =============================================================================
// EXECUTE CUSTOM CODE
// =============================================================================

export const ExecuteCustomCodeInputSchema = z.object({
  code: z.string().describe('JavaScript code to execute in PinePaper context'),
  description: z.string().optional().describe('Description of what the code does'),
}).describe('Execute custom JavaScript code');

export type ExecuteCustomCodeInput = z.infer<typeof ExecuteCustomCodeInputSchema>;

// =============================================================================
// GENERATOR TYPES
// =============================================================================

export const GeneratorNameSchema = z.enum([
  // Original generators (Phase 1 — enhanced)
  'drawSunburst',
  'drawSunsetScene',
  'drawGrid',
  'drawStackedCircles',
  'drawCircuit',
  'drawWaves',
  'drawPattern',
  // New generators (Phase 2)
  'drawBokeh',
  'drawGradientMesh',
  'drawGeometricAbstract',
  'drawWindField',
  'drawFluidFlow',
  'drawOrganicFlow',
  'drawNoiseTexture',
]).describe('Background generator name');

export type GeneratorName = z.infer<typeof GeneratorNameSchema>;

// ---------------------------------------------------------------------------
// Generator parameter schemas — Phase 1 (enhanced existing)
// ---------------------------------------------------------------------------

export const SunburstParamsSchema = z.object({
  rayCount: z.number().optional().default(16).describe('Number of rays'),
  colors: z.array(ColorSchema).optional().default(['#FF6B6B', '#4ECDC4']).describe('Ray colors'),
  bgColor: ColorSchema.optional().default('#1a1a2e').describe('Background color'),
  animated: z.boolean().optional().default(true).describe('Enable rotation animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
  rayGap: z.number().optional().describe('Gap between rays in degrees'),
  gradientRays: z.boolean().optional().describe('Radial gradient per ray'),
});

export const GridParamsSchema = z.object({
  gridType: z.enum(['lines', 'dots', 'squares']).optional().default('lines'),
  spacing: z.number().optional().default(40).describe('Grid cell size'),
  lineColor: ColorSchema.optional().default('#374151').describe('Line/dot color'),
  bgColor: ColorSchema.optional().default('#1f2937').describe('Background color'),
  lineWidth: z.number().optional().default(1).describe('Line thickness'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
  gap: z.number().optional().describe('Pixel gap between cells'),
  randomRotation: z.boolean().optional().describe('Random rotation per cell'),
  colorMode: z.enum(['checkerboard', 'gradient', 'random', 'rows', 'columns']).optional().describe('Cell coloring mode'),
  strokeColor: ColorSchema.optional().describe('Cell stroke color'),
  strokeWidth: z.number().optional().describe('Cell stroke width'),
});

export const WavesParamsSchema = z.object({
  waveCount: z.number().optional().default(5).describe('Number of wave layers'),
  colors: z.array(ColorSchema).optional().describe('Wave colors'),
  amplitude: z.number().optional().default(50).describe('Wave height'),
  frequency: z.number().optional().default(2).describe('Wave frequency'),
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color'),
  animated: z.boolean().optional().default(true).describe('Animate waves'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
  fill: z.boolean().optional().describe('Fill between adjacent waves'),
  fillOpacity: z.number().min(0).max(1).optional().describe('Fill opacity between waves'),
  amplitudeVariation: z.number().optional().describe('Amplitude variation between waves'),
  blendMode: z.string().optional().describe('CSS blend mode (e.g. screen, multiply)'),
});

export const CircuitParamsSchema = z.object({
  lineColor: ColorSchema.optional().default('#60a5fa').describe('Circuit line color'),
  nodeColor: ColorSchema.optional().default('#3b82f6').describe('Node/junction color'),
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color'),
  density: z.number().min(0).max(1).optional().default(0.5).describe('Circuit complexity'),
  animated: z.boolean().optional().default(true).describe('Enable bolt animation'),
  boltColor: ColorSchema.optional().default('#fbbf24').describe('Animated bolt color'),
  traceOpacity: z.number().min(0).max(1).optional().describe('Trace line opacity'),
  nodeOpacity: z.number().min(0).max(1).optional().describe('Node opacity'),
  diagonalPaths: z.boolean().optional().describe('Allow 45-degree trace paths'),
  chipDensity: z.enum(['auto', 'none', 'low', 'medium', 'high']).optional().describe('IC chip density'),
});

export const StackedCirclesParamsSchema = z.object({
  count: z.number().optional().default(8).describe('Number of circles'),
  colors: z.array(ColorSchema).optional().describe('Circle colors'),
  distribution: z.enum(['random', 'poisson', 'golden']).optional().default('random').describe('Circle distribution algorithm'),
  opacityMin: z.number().min(0).max(1).optional().describe('Minimum per-circle opacity'),
  opacityMax: z.number().min(0).max(1).optional().describe('Maximum per-circle opacity'),
  blendMode: z.string().optional().describe('CSS blend mode (e.g. screen, multiply)'),
  strokeWidth: z.number().optional().describe('Circle stroke width'),
  strokeColor: ColorSchema.optional().describe('Circle stroke color'),
  sizeGradient: z.boolean().optional().describe('Gradually decrease circle size'),
  animationType: z.enum(['pulse', 'float', 'none']).optional().describe('Circle animation type'),
});

export const SunsetSceneParamsSchema = z.object({
  sunColor: ColorSchema.optional().describe('Sun color'),
  skyColors: z.array(ColorSchema).optional().describe('Sky gradient colors'),
  cloudCount: z.number().optional().describe('Number of clouds'),
  skyOpacity: z.number().min(0).max(1).optional().describe('Sky layer opacity'),
  starCount: z.number().optional().describe('Number of stars'),
  starColor: ColorSchema.optional().describe('Star color'),
  reflectionEnabled: z.boolean().optional().describe('Enable water reflection'),
  reflectionOpacity: z.number().min(0).max(1).optional().describe('Reflection opacity'),
});

export const PatternParamsSchema = z.object({
  patternType: z.string().optional().describe('Pattern type (e.g. hexagon)'),
  size: z.number().optional().describe('Pattern element size'),
  color: ColorSchema.optional().describe('Pattern color'),
  bgColor: ColorSchema.optional().describe('Background color'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
  blendMode: z.string().optional().describe('CSS blend mode'),
  layers: z.number().min(1).max(5).optional().describe('Concentric orbit ring count (1-5)'),
  layerScaleDecay: z.number().optional().describe('Scale decay factor between layers'),
});

// ---------------------------------------------------------------------------
// Generator parameter schemas — Phase 2 (new generators)
// ---------------------------------------------------------------------------

export const BokehParamsSchema = z.object({
  count: z.number().optional().describe('Number of bokeh circles'),
  colors: z.array(ColorSchema).optional().describe('Circle colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  minRadius: z.number().optional().describe('Minimum circle radius'),
  maxRadius: z.number().optional().describe('Maximum circle radius'),
  shadowBlur: z.number().optional().describe('Soft-focus blur amount'),
  distribution: z.enum(['random', 'poisson']).optional().describe('Circle distribution'),
  driftAnimation: z.boolean().optional().describe('Enable slow drift animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const GradientMeshParamsSchema = z.object({
  colors: z.array(ColorSchema).optional().describe('Gradient blob colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  blobCount: z.number().optional().describe('Number of gradient blobs'),
  blendMode: z.string().optional().describe('CSS blend mode (default: screen)'),
  drift: z.boolean().optional().describe('Enable slow drift animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const GeometricAbstractParamsSchema = z.object({
  colors: z.array(ColorSchema).optional().describe('Shape colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  shapeCount: z.number().optional().describe('Number of shapes'),
  blendMode: z.string().optional().describe('CSS blend mode'),
  rotation: z.boolean().optional().describe('Enable rotation animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const WindFieldParamsSchema = z.object({
  particleCount: z.number().optional().describe('Number of wind particles'),
  colors: z.array(ColorSchema).optional().describe('Particle colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  direction: z.number().optional().describe('Wind direction in degrees'),
  turbulence: z.number().optional().describe('Noise turbulence amount'),
  trailLength: z.number().optional().describe('Particle trail length'),
  speed: z.number().optional().describe('Particle speed'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const FluidFlowParamsSchema = z.object({
  streamCount: z.number().optional().describe('Number of fluid streams'),
  colors: z.array(ColorSchema).optional().describe('Stream colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  depthLayers: z.number().optional().describe('Number of depth layers'),
  speed: z.number().optional().describe('Flow animation speed'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const OrganicFlowParamsSchema = z.object({
  layerCount: z.number().optional().describe('Number of aurora/silk layers'),
  colors: z.array(ColorSchema).optional().describe('Layer colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  blendMode: z.string().optional().describe('CSS blend mode (default: screen)'),
  fillToBottom: z.boolean().optional().describe('Fill layers to bottom edge'),
  animated: z.boolean().optional().describe('Enable flow animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const NoiseTextureParamsSchema = z.object({
  noiseType: z.enum(['perlin', 'grain', 'stipple']).optional().describe('Noise algorithm'),
  colors: z.array(ColorSchema).optional().describe('Noise colors'),
  bgColor: ColorSchema.optional().describe('Background color'),
  scale: z.number().optional().describe('Noise scale'),
  density: z.number().optional().describe('Noise density'),
  animated: z.boolean().optional().describe('Enable animated opacity shift'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
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
  targetId: z.string().optional().describe('Registry ID of the target item (can be null for self-animations)'),
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
  width: z.number().min(100).max(4096).describe('Canvas width (100-4096)'),
  height: z.number().min(100).max(4096).describe('Canvas height (100-4096)'),
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
  phase: z.enum(['validation', 'code_generation', 'browser_execution', 'screenshot', 'total', 'response_size']).optional().describe('Filter by execution phase'),
  since: z.number().optional().describe('Unix timestamp - metrics since this time'),
  limit: z.number().min(1).max(10000).optional().describe('Maximum number of results'),
  format: z.enum(['summary', 'detailed', 'csv']).optional().describe('Export format'),
});

export type GetPerformanceMetricsInput = z.infer<typeof GetPerformanceMetricsInputSchema>;

// =============================================================================
// DIAGNOSTIC REPORT SCHEMA
// =============================================================================

export const DiagnosticReportInputSchema = z.object({
  includeMetrics: z.boolean().optional().describe('Include performance metrics (default: true)'),
  includeCanvas: z.boolean().optional().describe('Include canvas state snapshot (default: true)'),
  metricsLimit: z.number().min(1).max(1000).optional().describe('Max metrics entries to include (default: 100)'),
});

export type DiagnosticReportInput = z.infer<typeof DiagnosticReportInputSchema>;

// =============================================================================
// TOOL GUIDE SCHEMA
// =============================================================================

export const ToolGuideInputSchema = z.object({
  tool: z.string().optional().describe('Tool name to get detailed description for'),
  category: z.string().optional().describe('Category/tag name to list all tools with descriptions'),
});

export type ToolGuideInput = z.infer<typeof ToolGuideInputSchema>;

// =============================================================================
// SET TOOLKIT SCHEMA
// =============================================================================

export const SetToolkitInputSchema = z.object({
  toolkit: z.enum(['full', 'agent', 'diagram', 'map', 'font', 'minimal']).optional().describe('Toolkit profile to switch to'),
  verbosity: z.enum(['verbose', 'compact', 'minimal']).optional().describe('Verbosity level to switch to'),
});

export type SetToolkitInput = z.infer<typeof SetToolkitInputSchema>;

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
  AGENT_JOB_ERROR: 'AGENT_JOB_ERROR',
  BATCH_EXECUTION_ERROR: 'BATCH_EXECUTION_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// =============================================================================
// MASK TOOL SCHEMAS
// =============================================================================

export const MaskPresetSchema = z.enum([
  'wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown',
  'iris', 'irisOut',
  'star', 'heart',
  'curtainHorizontal', 'curtainVertical', 'cinematic',
  'diagonalWipe',
  'revealUp', 'revealDown',
]).describe('Mask animation preset');

export type MaskPreset = z.infer<typeof MaskPresetSchema>;

export const MaskTypeSchema = z.enum([
  'rectangle', 'circle', 'ellipse', 'star', 'triangle', 'hexagon', 'heart', 'rounded',
]).describe('Mask shape type');

export type MaskType = z.infer<typeof MaskTypeSchema>;

export const MaskEasingSchema = z.enum([
  'linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic',
]).describe('Mask animation easing function');

export type MaskEasing = z.infer<typeof MaskEasingSchema>;

export const MaskKeyframePropertiesSchema = z.object({
  x: z.number().optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().optional(),
  radiusX: z.number().optional(),
  radiusY: z.number().optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
}).describe('Mask keyframe properties');

export const MaskKeyframeSchema = z.object({
  time: z.number().min(0).max(1).describe('Normalized time (0-1)'),
  properties: MaskKeyframePropertiesSchema.describe('Mask properties at this keyframe'),
  easing: MaskEasingSchema.optional().describe('Easing function for this keyframe'),
}).describe('Mask animation keyframe');

export type MaskKeyframe = z.infer<typeof MaskKeyframeSchema>;

export const MaskOptionsSchema = z.object({
  startTime: z.number().optional().default(0).describe('Start time in seconds'),
  duration: z.number().optional().default(0.8).describe('Duration in seconds'),
  easing: MaskEasingSchema.optional().default('easeOut').describe('Overall easing'),
  reversed: z.boolean().optional().default(false).describe('Reverse animation (hide instead of reveal)'),
  loop: z.boolean().optional().default(false).describe('Loop the animation'),
}).describe('Mask animation options');

export const MaskShapeOptionsSchema = z.object({
  points: z.number().optional().describe('Number of points (star mask)'),
  innerRadius: z.number().optional().describe('Inner radius ratio (star mask)'),
}).describe('Mask shape-specific options');

export const ApplyAnimatedMaskInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item to mask'),
  preset: MaskPresetSchema.optional().describe('Animation preset (Mode 1 & 3)'),
  maskType: MaskTypeSchema.optional().describe('Mask shape type (Mode 2)'),
  keyframes: z.array(MaskKeyframeSchema).optional().describe('Custom keyframes (Mode 2 & 3)'),
  options: MaskOptionsSchema.optional().describe('Animation options (Mode 1)'),
  maskOptions: MaskShapeOptionsSchema.optional().describe('Mask shape options'),
}).describe('Apply animated mask input');

export type ApplyAnimatedMaskInput = z.infer<typeof ApplyAnimatedMaskInputSchema>;

export const ApplyCustomMaskInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item to mask'),
  maskType: MaskTypeSchema.describe('Mask shape type'),
  keyframes: z.array(MaskKeyframeSchema).describe('Keyframes defining the animation'),
  maskOptions: MaskShapeOptionsSchema.optional().describe('Mask shape options'),
}).describe('Apply custom mask input');

export type ApplyCustomMaskInput = z.infer<typeof ApplyCustomMaskInputSchema>;

export const RemoveMaskInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the masked item'),
}).describe('Remove mask input');

export type RemoveMaskInput = z.infer<typeof RemoveMaskInputSchema>;

// =============================================================================
// AGENT FLOW MODE SCHEMAS
// =============================================================================

/**
 * Platform presets for export
 */
export const AgentPlatformSchema = z.enum([
  'instagram',
  'instagram-story',
  'tiktok',
  'youtube',
  'youtube-thumbnail',
  'twitter',
  'linkedin',
  'web',
  'print-a4',
  'print-letter',
]).describe('Target platform for export');

export type AgentPlatform = z.infer<typeof AgentPlatformSchema>;

/**
 * Export format types
 */
export const AgentExportFormatSchema = z.enum([
  'svg', 'png', 'gif', 'mp4', 'webm', 'pdf',
]).describe('Export file format');

export type AgentExportFormat = z.infer<typeof AgentExportFormatSchema>;

/**
 * Screenshot policy for agent jobs
 */
export const AgentScreenshotPolicySchema = z.enum([
  'none', 'on_error', 'on_complete', 'on_request',
]).describe('When to take screenshots during agent job');

export type AgentScreenshotPolicy = z.infer<typeof AgentScreenshotPolicySchema>;

/**
 * Start job input schema
 */
export const AgentStartJobInputSchema = z.object({
  name: z.string().optional().describe('Optional job name for tracking'),
  description: z.string().optional().describe('User prompt or task description — pass the user request here for contextual design guidance'),
  headless: z.boolean().optional().default(true).describe('Run browser in headless mode'),
  screenshotPolicy: AgentScreenshotPolicySchema.optional().default('on_complete'),
  canvasPreset: AgentPlatformSchema.optional().describe('Canvas size preset to apply'),
  canvasSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional().describe('Custom canvas dimensions'),
  backgroundColor: z.string().optional().describe('Background color to set'),
  clearCanvas: z.boolean().optional().default(true).describe('Clear canvas when starting job'),
}).describe('Options for starting an agent job');

export type AgentStartJobInput = z.infer<typeof AgentStartJobInputSchema>;

/**
 * End job input schema
 */
export const AgentEndJobInputSchema = z.object({
  takeScreenshot: z.boolean().optional().default(true).describe('Take final screenshot'),
  analyzeContent: z.boolean().optional().default(true).describe('Analyze content for export recommendations'),
}).describe('Options for ending an agent job');

export type AgentEndJobInput = z.infer<typeof AgentEndJobInputSchema>;

/**
 * Reset input schema
 */
export const AgentResetInputSchema = z.object({
  preserveCanvasSize: z.boolean().optional().default(true).describe('Keep current canvas dimensions'),
  preserveBackground: z.boolean().optional().default(false).describe('Keep current background color'),
  canvasPreset: AgentPlatformSchema.optional().describe('New canvas preset to apply'),
  backgroundColor: z.string().optional().describe('New background color'),
}).describe('Options for resetting canvas between jobs');

export type AgentResetInput = z.infer<typeof AgentResetInputSchema>;

/**
 * Batch operation type
 */
export const AgentBatchOperationTypeSchema = z.enum([
  'set_canvas_size', 'set_background', 'execute_generator',
  'create', 'modify', 'delete',
  'animate', 'keyframe_animate', 'relation',
  'apply_mask', 'apply_effect',
  'play_timeline',
]).describe('Type of batch operation');

/**
 * Single batch operation — all fields optional, used per operation type
 */
export const AgentBatchOperationSchema = z.object({
  type: AgentBatchOperationTypeSchema,
  // Create operation fields
  itemType: z.string().optional().describe('Item type for create operations'),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional().describe('Position for create operations'),
  properties: z.record(z.unknown()).optional().describe('Properties for create/modify operations'),
  // Modify/Animate/Delete/Keyframe/Mask/Effect target
  itemId: z.string().optional().describe('Target item ID or $N reference'),
  // Animate operation fields
  animationType: z.string().optional().describe('Animation type for animate operations'),
  animationOptions: z.record(z.unknown()).optional().describe('Animation options'),
  // Relation operation fields
  sourceId: z.string().optional().describe('Source item ID for relations'),
  targetId: z.string().optional().describe('Target item ID for relations'),
  relationType: z.string().optional().describe('Relation type'),
  relationOptions: z.record(z.unknown()).optional().describe('Relation options'),
  // Set background fields
  backgroundColor: z.string().optional().describe('Background color for set_background'),
  // Execute generator fields
  generatorName: z.string().optional().describe('Generator name for execute_generator'),
  generatorParams: z.record(z.unknown()).optional().describe('Generator parameters'),
  // Set canvas size fields
  width: z.number().min(100).max(4096).optional().describe('Canvas width for set_canvas_size (100-4096)'),
  height: z.number().min(100).max(4096).optional().describe('Canvas height for set_canvas_size (100-4096)'),
  preset: z.string().optional().describe('Canvas preset for set_canvas_size (e.g. instagram, youtube)'),
  // Keyframe animate fields
  keyframes: z.array(z.object({
    time: z.number(),
    properties: z.record(z.unknown()),
    easing: z.string().optional(),
  })).optional().describe('Keyframes for keyframe_animate [{time, properties, easing}]'),
  duration: z.number().optional().describe('Duration in seconds for keyframe_animate or play_timeline'),
  loop: z.boolean().optional().describe('Loop for keyframe_animate or play_timeline'),
  // Apply mask fields
  maskPreset: z.string().optional().describe('Mask preset for apply_mask (wipeLeft, wipeRight, wipeUp, wipeDown, iris, irisOut, star, heart, curtainHorizontal, curtainVertical, cinematic, diagonalWipe, revealUp, revealDown)'),
  maskType: z.string().optional().describe('Mask shape for apply_mask (rectangle, circle, ellipse, star, triangle, hexagon, heart, rounded)'),
  maskOptions: z.record(z.unknown()).optional().describe('Mask options'),
  // Apply effect fields
  effectType: z.string().optional().describe('Effect type for apply_effect (sparkle, blast)'),
  effectParams: z.record(z.unknown()).optional().describe('Effect parameters'),
  // Play timeline fields
  action: z.string().optional().describe('Timeline action for play_timeline (play, stop, seek)'),
  time: z.number().optional().describe('Seek time for play_timeline'),
}).describe('Single batch operation');

export type AgentBatchOperation = z.infer<typeof AgentBatchOperationSchema>;

/**
 * Batch execute input schema
 */
export const AgentBatchExecuteInputSchema = z.object({
  operations: z.array(AgentBatchOperationSchema).min(1).describe('Array of operations to execute'),
  atomic: z.boolean().optional().default(true).describe('Rollback all operations on any failure'),
}).describe('Batch execution input');

export type AgentBatchExecuteInput = z.infer<typeof AgentBatchExecuteInputSchema>;

/**
 * Smart export input schema
 */
export const AgentExportInputSchema = z.object({
  platform: z.union([AgentPlatformSchema, z.literal('auto')]).optional().default('auto').describe('Target platform'),
  format: z.union([AgentExportFormatSchema, z.literal('auto')]).optional().default('auto').describe('Export format'),
  quality: z.enum(['draft', 'standard', 'high']).optional().default('standard').describe('Export quality level'),
  includeRecommendations: z.boolean().optional().default(true).describe('Include alternative format recommendations'),
}).describe('Smart export options');

export type AgentExportInput = z.infer<typeof AgentExportInputSchema>;

/**
 * Analyze content input schema
 */
export const AgentAnalyzeInputSchema = z.object({}).describe('Analyze current canvas content');

export type AgentAnalyzeInput = z.infer<typeof AgentAnalyzeInputSchema>;

// =============================================================================
// INTERACTIVE / TRIGGER SCHEMAS
// =============================================================================

/**
 * Trigger event types
 */
export const TriggerEventSchema = z.enum([
  'click',
  'hover_enter',
  'hover_exit',
  'drag_start',
  'drag_move',
  'drag_end',
  'timeline',
  'scene_enter',
  'scene_exit',
  'animation_end',
  'quiz_answer',
  'score_change',
]).describe('Event type that triggers an action');

export type TriggerEvent = z.infer<typeof TriggerEventSchema>;

/**
 * Action types
 */
export const ActionTypeSchema = z.enum([
  'show',
  'hide',
  'toggle_visibility',
  'play_animation',
  'stop_animation',
  'navigate',
  'update_property',
  'set_variable',
  'play_sound',
  'emit_event',
  'add_class',
  'remove_class',
  'submit_answer',
  'increment_score',
  'reset_quiz',
  'call_function',
]).describe('Type of action to perform');

export type ActionType = z.infer<typeof ActionTypeSchema>;

/**
 * Trigger condition
 */
export const TriggerConditionSchema = z.object({
  property: z.string().describe('Property to check'),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains']),
  value: z.unknown().describe('Value to compare against'),
}).describe('Condition for trigger');

export type TriggerCondition = z.infer<typeof TriggerConditionSchema>;

/**
 * Action definition
 */
export const TriggerActionSchema = z.object({
  type: ActionTypeSchema,
  targetItemId: z.string().optional().describe('Item to act upon'),
  property: z.string().optional().describe('Property to update'),
  value: z.unknown().optional().describe('New value'),
  animationType: z.string().optional().describe('Animation type to play'),
  duration: z.number().optional().describe('Action duration in ms'),
  easing: EasingSchema.optional(),
  sceneId: z.string().optional().describe('Scene to navigate to'),
  variableName: z.string().optional().describe('Variable name'),
  soundUrl: z.string().optional().describe('Audio URL'),
  answerId: z.string().optional().describe('Answer ID for quiz'),
  points: z.number().optional().describe('Points to add'),
  delay: z.number().optional().default(0).describe('Delay before action in ms'),
}).describe('Action to execute');

export type TriggerAction = z.infer<typeof TriggerActionSchema>;

/**
 * Add trigger input
 */
export const AddTriggerInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  event: TriggerEventSchema,
  time: z.number().optional().describe('Time in seconds for timeline triggers'),
  timelineOffset: z.number().optional().describe('Time offset in ms for timeline triggers'),
  conditions: z.array(TriggerConditionSchema).optional().describe('Conditions that must be met'),
  condition: z.string().optional().describe('Optional condition expression (e.g., "$score > 10")'),
  actions: z.array(TriggerActionSchema).min(1).describe('Actions to execute'),
  once: z.boolean().optional().default(false).describe('Fire only once'),
}).describe('Add trigger to item');

export type AddTriggerInput = z.infer<typeof AddTriggerInputSchema>;

/**
 * Remove trigger input
 */
export const RemoveTriggerInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  triggerId: z.string().optional().describe('Specific trigger ID to remove'),
  event: TriggerEventSchema.optional().describe('Remove all triggers of this event type'),
  removeAll: z.boolean().optional().describe('Remove all triggers from item'),
}).describe('Remove triggers from item');

export type RemoveTriggerInput = z.infer<typeof RemoveTriggerInputSchema>;

/**
 * Query triggers input
 */
export const QueryTriggersInputSchema = z.object({
  itemId: z.string().optional().describe('Filter by item ID'),
  event: TriggerEventSchema.optional().describe('Filter by event type'),
}).describe('Query triggers');

export type QueryTriggersInput = z.infer<typeof QueryTriggersInputSchema>;

// =============================================================================
// QUIZ / LMS SCHEMAS
// =============================================================================

/**
 * Quiz question types
 */
export const QuizQuestionTypeSchema = z.enum([
  'multiple-choice',
  'multiple-select',
  'drag-drop',
  'matching',
  'sequencing',
  'hotspot',
  'fill-blank',
  'true-false',
]).describe('Type of quiz question');

export type QuizQuestionType = z.infer<typeof QuizQuestionTypeSchema>;

/**
 * Quiz answer option
 */
export const QuizAnswerOptionSchema = z.object({
  id: z.string().describe('Unique answer ID'),
  itemId: z.string().optional().describe('Associated canvas item ID'),
  label: z.string().describe('Answer text'),
  isCorrect: z.boolean().describe('Is this the correct answer'),
  feedback: z.string().optional().describe('Feedback when selected'),
  points: z.number().optional().default(1).describe('Points for this answer'),
}).describe('Quiz answer option');

export type QuizAnswerOption = z.infer<typeof QuizAnswerOptionSchema>;

/**
 * Drop zone for drag-drop
 */
export const DropZoneSchema = z.object({
  id: z.string().describe('Zone ID'),
  itemId: z.string().describe('Canvas item that is the drop zone'),
  acceptsItems: z.array(z.string()).describe('Item IDs that can be dropped here'),
  label: z.string().optional(),
}).describe('Drag-drop zone');

export type DropZone = z.infer<typeof DropZoneSchema>;

/**
 * Quiz question definition
 */
export const QuizQuestionSchema = z.object({
  id: z.string().describe('Question ID'),
  type: QuizQuestionTypeSchema,
  prompt: z.string().describe('Question text'),
  promptItemId: z.string().optional().describe('Canvas item showing prompt'),
  options: z.array(QuizAnswerOptionSchema).optional(),
  maxSelections: z.number().optional().describe('Max selections for multi-select'),
  draggableItems: z.array(z.string()).optional().describe('Draggable item IDs'),
  dropZones: z.array(DropZoneSchema).optional(),
  correctSequence: z.array(z.string()).optional().describe('Correct order for sequencing'),
  points: z.number().optional().default(1).describe('Points for question'),
  partialCredit: z.boolean().optional().default(false),
  attempts: z.number().optional().describe('Max attempts'),
  correctFeedback: z.string().optional(),
  incorrectFeedback: z.string().optional(),
  onCorrectActions: z.array(TriggerActionSchema).optional(),
  onIncorrectActions: z.array(TriggerActionSchema).optional(),
}).describe('Quiz question');

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

/**
 * Create quiz input
 */
export const CreateQuizInputSchema = z.object({
  id: z.string().optional().describe('Quiz ID'),
  title: z.string().optional().describe('Quiz title'),
  questions: z.array(QuizQuestionSchema).min(1),
  shuffleQuestions: z.boolean().optional().default(false),
  shuffleOptions: z.boolean().optional().default(false),
  showFeedback: z.enum(['immediate', 'after-submit', 'never']).optional().default('immediate'),
  showScore: z.boolean().optional().default(true).describe('Display score during quiz'),
  passingScore: z.number().optional().describe('Minimum score to pass (percentage)'),
  allowRetry: z.boolean().optional().default(true),
  trackProgress: z.boolean().optional().default(true),
}).describe('Create quiz input');

export type CreateQuizInput = z.infer<typeof CreateQuizInputSchema>;

/**
 * Get quiz state input
 */
export const GetQuizStateInputSchema = z.object({
  quizId: z.string().optional().describe('Quiz ID (uses active quiz if not specified)'),
}).describe('Get quiz state');

export type GetQuizStateInput = z.infer<typeof GetQuizStateInputSchema>;

/**
 * Reset quiz input
 */
export const ResetQuizInputSchema = z.object({
  quizId: z.string().optional().describe('Quiz ID to reset (uses active quiz if not specified)'),
}).describe('Reset quiz');

export type ResetQuizInput = z.infer<typeof ResetQuizInputSchema>;

// =============================================================================
// LETTER COLLAGE SCHEMAS
// =============================================================================

export const LetterCollageStyleSchema = z.enum([
  'tile',
  'magazine',
  'paperCut',
  'fold',
  'gradient',
  'image',
]).describe('Style type for letter collage');

export type LetterCollageStyle = z.infer<typeof LetterCollageStyleSchema>;

export const TilePaletteSchema = z.enum([
  // Game
  'wordle', 'scrabble',
  // Vibrant
  'candy', 'neon', 'rainbow',
  // Soft
  'pastel', 'cotton',
  // Natural
  'earth', 'ocean', 'forest', 'sunset',
  // Professional
  'corporate', 'minimal', 'slate',
  // Seasonal
  'christmas', 'halloween', 'spring',
  // Magazine
  'magazine', 'newspaper', 'vintage',
  // Paper Craft
  'paperCraft', 'origami', 'craftPaper',
]).describe('Color palette for tile style');

export type TilePalette = z.infer<typeof TilePaletteSchema>;

export const GradientPaletteSchema = z.enum([
  'rainbow', 'sunset', 'ocean', 'fire', 'gold', 'rose', 'ice', 'cyberpunk', 'neonGlow', 'purplePink',
]).describe('Gradient palette for gradient style');

export type GradientPalette = z.infer<typeof GradientPaletteSchema>;

export const GradientDirectionSchema = z.enum([
  'vertical', 'horizontal', 'diagonal', 'radial',
]).describe('Direction for gradient style');

export type GradientDirection = z.infer<typeof GradientDirectionSchema>;

export const LetterCollageAnimationSchema = z.enum([
  'pulse', 'bounce', 'fade', 'wobble', 'rotate',
]).describe('Animation type for letter collage');

export type LetterCollageAnimation = z.infer<typeof LetterCollageAnimationSchema>;

export const CreateLetterCollageInputSchema = z.object({
  text: z.string().min(1).describe('The text to stylize'),
  style: LetterCollageStyleSchema.optional().default('tile').describe('Style type for the letter collage'),
  palette: TilePaletteSchema.optional().describe('Color palette name for tile/magazine styles'),
  position: PositionSchema.optional().describe('Position on canvas (defaults to center)'),
  fontSize: z.number().optional().default(48).describe('Base font size in pixels'),
  fontFamily: z.string().optional().default('Inter, sans-serif').describe('Font family to use'),
  spacing: z.number().optional().default(1.1).describe('Letter spacing multiplier'),
  gradientPalette: GradientPaletteSchema.optional().describe('Gradient palette name (for style="gradient")'),
  gradientDirection: GradientDirectionSchema.optional().default('vertical').describe('Gradient direction (for style="gradient")'),
  cornerRadius: z.number().optional().default(4).describe('Corner radius for tile backgrounds'),
  shadowEnabled: z.boolean().optional().default(true).describe('Enable drop shadows'),
}).describe('Create letter collage input');

export type CreateLetterCollageInput = z.infer<typeof CreateLetterCollageInputSchema>;

export const AnimateLetterCollageInputSchema = z.object({
  collageId: z.string().describe('Collage ID from create_letter_collage'),
  animationType: LetterCollageAnimationSchema.describe('Animation type to apply'),
  staggerDelay: z.number().optional().default(0.1).describe('Delay between each letter animation start (seconds)'),
  animationSpeed: z.number().optional().default(1).describe('Animation speed multiplier'),
}).describe('Animate letter collage input');

export type AnimateLetterCollageInput = z.infer<typeof AnimateLetterCollageInputSchema>;

export const GetLetterCollageOptionsInputSchema = z.object({}).describe('Get letter collage options input (no parameters)');

export type GetLetterCollageOptionsInput = z.infer<typeof GetLetterCollageOptionsInputSchema>;

// =============================================================================
// CANVAS PRESETS SCHEMA
// =============================================================================

export const GetCanvasPresetsInputSchema = z.object({}).describe('Get canvas presets input (no parameters)');

export type GetCanvasPresetsInput = z.infer<typeof GetCanvasPresetsInputSchema>;

// =============================================================================
// MAP SCHEMAS
// =============================================================================

export const MapIdSchema = z.enum(['world', 'worldHighRes', 'usa']).describe('Available map types');

export type MapId = z.infer<typeof MapIdSchema>;

export const MapProjectionSchema = z.enum([
  'mercator', 'equalEarth', 'naturalEarth', 'orthographic', 'albers', 'stereographic',
]).describe('Map projection types');

export type MapProjection = z.infer<typeof MapProjectionSchema>;

export const MapQualitySchema = z.enum(['fast', 'balanced', 'professional']).describe('Map rendering quality');

export type MapQuality = z.infer<typeof MapQualitySchema>;

export const ColorScaleSchema = z.enum([
  'blues', 'greens', 'reds', 'oranges', 'purples', 'heat',
]).describe('Color scale for choropleth maps');

export type ColorScale = z.infer<typeof ColorScaleSchema>;

export const LegendPositionSchema = z.enum([
  'top-left', 'top-right', 'bottom-left', 'bottom-right',
]).describe('Legend position on map');

export type LegendPosition = z.infer<typeof LegendPositionSchema>;

export const MarkerShapeSchema = z.enum(['circle', 'pin', 'star']).describe('Marker shape types');

export type MarkerShape = z.infer<typeof MarkerShapeSchema>;

export const LabelTypeSchema = z.enum(['name', 'code', 'value']).describe('Label content type');

export type LabelType = z.infer<typeof LabelTypeSchema>;

export const LoadMapInputSchema = z.object({
  mapId: MapIdSchema.describe('Map to load'),
  projection: MapProjectionSchema.optional().describe('Map projection type'),
  quality: MapQualitySchema.optional().describe('Rendering quality'),
  fillColor: z.string().optional().describe('Default fill color for regions'),
  strokeColor: z.string().optional().describe('Border color'),
  strokeWidth: z.number().optional().describe('Border width'),
  scale: z.number().optional().describe('Scale multiplier'),
  center: z.tuple([z.number(), z.number()]).optional().describe('Center coordinates [lon, lat]'),
  rotate: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Rotation angles [x, y, z]'),
  enableHover: z.boolean().optional().describe('Enable hover effects'),
  enableClick: z.boolean().optional().describe('Enable click events'),
  hoverFill: z.string().optional().describe('Hover fill color'),
  hoverStroke: z.string().optional().describe('Hover stroke color'),
}).describe('Load map input');

export type LoadMapInput = z.infer<typeof LoadMapInputSchema>;

export const HighlightRegionsInputSchema = z.object({
  regionIds: z.array(z.string()).describe('Array of region IDs to highlight'),
  options: z.object({
    fillColor: z.string().optional().describe('Highlight fill color'),
    strokeColor: z.string().optional().describe('Highlight stroke color'),
    strokeWidth: z.number().optional().describe('Highlight stroke width'),
    animate: z.boolean().optional().describe('Animate the highlight'),
  }).optional().describe('Highlight options'),
}).describe('Highlight regions input');

export type HighlightRegionsInput = z.infer<typeof HighlightRegionsInputSchema>;

export const UnhighlightRegionsInputSchema = z.object({
  regionIds: z.union([
    z.array(z.string()),
    z.literal('all'),
  ]).describe('Region IDs to unhighlight, or "all"'),
}).describe('Unhighlight regions input');

export type UnhighlightRegionsInput = z.infer<typeof UnhighlightRegionsInputSchema>;

export const ApplyDataColorsInputSchema = z.object({
  data: z.record(z.string(), z.number()).describe('Object mapping region IDs to values'),
  options: z.object({
    colorScale: ColorScaleSchema.optional().describe('Color scale to use'),
    minValue: z.number().optional().describe('Minimum value for scale'),
    maxValue: z.number().optional().describe('Maximum value for scale'),
    showLegend: z.boolean().optional().describe('Display color legend'),
    legendPosition: LegendPositionSchema.optional().describe('Legend position'),
    legendTitle: z.string().optional().describe('Title for the legend'),
  }).optional().describe('Choropleth options'),
}).describe('Apply data colors input');

export type ApplyDataColorsInput = z.infer<typeof ApplyDataColorsInputSchema>;

export const AddMarkerInputSchema = z.object({
  lat: z.number().describe('Latitude'),
  lon: z.number().describe('Longitude'),
  label: z.string().optional().describe('Marker label text'),
  color: z.string().optional().describe('Marker color'),
  size: z.number().optional().describe('Marker size in pixels'),
  pulse: z.boolean().optional().describe('Enable pulse animation'),
  shape: MarkerShapeSchema.optional().describe('Marker shape'),
}).describe('Add marker input');

export type AddMarkerInput = z.infer<typeof AddMarkerInputSchema>;

export const AddMapLabelsInputSchema = z.object({
  regions: z.array(z.string()).optional().describe('Specific regions to label (null for all)'),
  options: z.object({
    fontSize: z.number().optional().describe('Label font size'),
    fontColor: z.string().optional().describe('Label text color'),
    labelType: LabelTypeSchema.optional().describe('Type of label content'),
    backgroundColor: z.string().optional().describe('Label background color'),
  }).optional().describe('Label options'),
}).describe('Add map labels input');

export type AddMapLabelsInput = z.infer<typeof AddMapLabelsInputSchema>;

export const PanMapInputSchema = z.object({
  lat: z.number().describe('Target latitude'),
  lon: z.number().describe('Target longitude'),
  animate: z.boolean().optional().describe('Animate the pan'),
  duration: z.number().optional().describe('Animation duration in seconds'),
}).describe('Pan map input');

export type PanMapInput = z.infer<typeof PanMapInputSchema>;

export const ZoomMapInputSchema = z.object({
  level: z.number().describe('Zoom level (1 = full view)'),
  animate: z.boolean().optional().describe('Animate the zoom'),
  duration: z.number().optional().describe('Animation duration in seconds'),
}).describe('Zoom map input');

export type ZoomMapInput = z.infer<typeof ZoomMapInputSchema>;

export const ExportMapInputSchema = z.object({}).describe('Export map input (no parameters)');

export type ExportMapInput = z.infer<typeof ExportMapInputSchema>;

export const ImportCustomMapInputSchema = z.object({
  url: z.string().optional().describe('URL to GeoJSON/TopoJSON file'),
  geoJson: z.object({}).passthrough().optional().describe('GeoJSON object to import'),
  options: z.object({
    projection: MapProjectionSchema.optional().describe('Projection to use'),
    fillColor: z.string().optional().describe('Default fill color'),
    strokeColor: z.string().optional().describe('Default stroke color'),
    strokeWidth: z.number().optional().describe('Default stroke width'),
  }).optional().describe('Import options'),
}).describe('Import custom map input');

export type ImportCustomMapInput = z.infer<typeof ImportCustomMapInputSchema>;

export const GetRegionAtPointInputSchema = z.object({
  x: z.number().describe('Canvas X coordinate'),
  y: z.number().describe('Canvas Y coordinate'),
}).describe('Get region at point input');

export type GetRegionAtPointInput = z.infer<typeof GetRegionAtPointInputSchema>;

// Map Animation Schemas
export const MapRegionKeyframeSchema = z.object({
  time: z.number().describe('Time in seconds'),
  fillColor: z.string().describe('Fill color at this keyframe'),
  strokeColor: z.string().optional().describe('Stroke color (optional)'),
  opacity: z.number().optional().describe('Opacity 0-1 (optional)'),
}).describe('Map region keyframe');

export type MapRegionKeyframe = z.infer<typeof MapRegionKeyframeSchema>;

export const WaveDirectionSchema = z.enum(['horizontal', 'vertical', 'radial']).describe('Wave animation direction');

export type WaveDirection = z.infer<typeof WaveDirectionSchema>;

export const AnimateMapRegionsInputSchema = z.object({
  duration: z.number().optional().default(5).describe('Total animation duration in seconds'),
  loop: z.boolean().optional().default(true).describe('Loop the animation'),
  regions: z.record(z.string(), z.array(MapRegionKeyframeSchema)).describe('Map of region IDs to keyframe arrays'),
}).describe('Animate map regions input');

export type AnimateMapRegionsInput = z.infer<typeof AnimateMapRegionsInputSchema>;

export const AnimateMapWaveInputSchema = z.object({
  duration: z.number().optional().default(10).describe('Total wave duration in seconds'),
  loop: z.boolean().optional().default(true).describe('Loop the animation'),
  colors: z.array(z.string()).optional().describe('Array of colors for the wave'),
  waveDirection: WaveDirectionSchema.optional().default('horizontal').describe('Direction of wave effect'),
}).describe('Animate map wave input');

export type AnimateMapWaveInput = z.infer<typeof AnimateMapWaveInputSchema>;

export const StopMapAnimationsInputSchema = z.object({
  regions: z.array(z.string()).optional().describe('Specific region IDs to stop (omit for all)'),
  resetColors: z.boolean().optional().default(true).describe('Reset regions to default colors'),
}).describe('Stop map animations input');

export type StopMapAnimationsInput = z.infer<typeof StopMapAnimationsInputSchema>;

export const GetAnimatedMapRegionsInputSchema = z.object({}).describe('Get animated map regions input (no parameters)');

export type GetAnimatedMapRegionsInput = z.infer<typeof GetAnimatedMapRegionsInputSchema>;

// Map CSV Schemas
export const ExportMapRegionCSVInputSchema = z.object({
  includeHighlighted: z.boolean().optional().default(true).describe('Include highlight status column'),
  includeSelected: z.boolean().optional().default(true).describe('Include selection status column'),
  includeColors: z.boolean().optional().default(true).describe('Include fill/stroke color columns'),
  download: z.boolean().optional().default(false).describe('Auto-download the CSV file'),
  filename: z.string().optional().default('map-regions.csv').describe('Filename for download'),
}).describe('Export map region CSV input');

export type ExportMapRegionCSVInput = z.infer<typeof ExportMapRegionCSVInputSchema>;

export const ImportMapRegionCSVInputSchema = z.object({
  csvText: z.string().describe('CSV text content to import'),
  applyColors: z.boolean().optional().default(true).describe('Apply fill/stroke colors from CSV'),
  applyHighlight: z.boolean().optional().default(true).describe('Update highlight status from CSV'),
  applySelection: z.boolean().optional().default(true).describe('Update selection status from CSV'),
}).describe('Import map region CSV input');

export type ImportMapRegionCSVInput = z.infer<typeof ImportMapRegionCSVInputSchema>;

// Map Selection Schemas
export const SelectMapRegionsInputSchema = z.object({
  regionIds: z.array(z.string()).describe('Array of region IDs to select'),
}).describe('Select map regions input');

export type SelectMapRegionsInput = z.infer<typeof SelectMapRegionsInputSchema>;

export const DeselectMapRegionsInputSchema = z.object({
  regionIds: z.array(z.string()).optional().describe('Array of region IDs to deselect (omit for all)'),
}).describe('Deselect map regions input');

export type DeselectMapRegionsInput = z.infer<typeof DeselectMapRegionsInputSchema>;

export const GetHighlightedMapRegionsInputSchema = z.object({}).describe('Get highlighted map regions input (no parameters)');

export type GetHighlightedMapRegionsInput = z.infer<typeof GetHighlightedMapRegionsInputSchema>;

// =============================================================================
// TEMPLATE SCHEMAS
// =============================================================================

export const TemplateCategorySchema = z.enum([
  'social-media', 'meme', 'business', 'education', 'creative',
  'tech', 'global', 'indigenous', 'seasonal', 'masking',
  'scenes', 'diagrams', 'maps',
]).describe('Template category');

export type TemplateCategory = z.infer<typeof TemplateCategorySchema>;

export const ApplyTemplateInputSchema = z.object({
  templateId: z.string().optional().describe('Template ID to load (omit to list templates)'),
  category: TemplateCategorySchema.optional().describe('Filter templates by category'),
  listOnly: z.boolean().optional().default(false).describe('If true, only list available templates without loading'),
}).describe('Apply template input');

export type ApplyTemplateInput = z.infer<typeof ApplyTemplateInputSchema>;

// =============================================================================
// IMAGE IMPORT SCHEMAS
// =============================================================================

export const ImageMaskSchema = z.enum(['circle', 'rounded', 'hexagon', 'star']).describe('Mask shape to apply to imported image');

export type ImageMask = z.infer<typeof ImageMaskSchema>;

export const ImportImageInputSchema = z.object({
  url: z.string().describe('URL of the image to import'),
  position: PositionSchema.optional().describe('Position on canvas (defaults to center)'),
  maxWidth: z.number().optional().describe('Maximum width constraint in pixels'),
  maxHeight: z.number().optional().describe('Maximum height constraint in pixels'),
  mask: ImageMaskSchema.optional().describe('Optional mask shape to apply to the image'),
}).describe('Import image input');

export type ImportImageInput = z.infer<typeof ImportImageInputSchema>;
