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

/**
 * Position on canvas. Accepts either the object form {x, y} or the array
 * form [x, y] (matches FxTool's PinePaper.create() normalization, fix
 * 3574992). Both forms normalize to {x, y} after parse, so downstream code
 * that reads position.x / position.y is unaffected.
 */
export const PositionSchema = z.union([
  z.object({
    x: z.number().describe('X coordinate on canvas'),
    y: z.number().describe('Y coordinate on canvas'),
  }),
  z.tuple([z.number(), z.number()]).transform(([x, y]) => ({ x, y })),
]);

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
  // Named shape variants (regular polygons + paths) — createable directly by name
  'pentagon',
  'hexagon',
  'diamond',
  'arrow',
  'heart',
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

// Text item properties
export const TextPropertiesSchema = z.object({
  content: z.string().describe('Text content to display'),
  fontSize: z.number().optional().default(48).describe('Font size in pixels'),
  fontFamily: z.string().optional().default('Arial, sans-serif').describe('Font family'),
  color: ColorSchema.optional().default('#ffffff').describe('Text color'),
  fontWeight: z.string().optional().describe('Font weight (normal, bold, etc.)'),
  contentType: z.enum(['clock', 'timer', 'countdown', 'stopwatch']).optional().describe('Dynamic content type — makes text auto-update. clock: current time, timer: elapsed time, countdown: counts down from countdownTarget, stopwatch: pauseable timer'),
  contentFormat: z.string().optional().describe('Time format for dynamic content (HH:MM:SS, MM:SS, SS, SS.ms). Default: HH:MM:SS'),
  countdownTarget: z.number().optional().describe('Countdown duration in seconds (countdown contentType only). Default: 60'),
  countdownEndText: z.string().optional().describe('Text shown when countdown reaches zero. Default: 00:00'),
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
  // Pair-by-index group morph; same call shape works for any two paper.Groups
  'group_morphs_to',
  // Self-relation; item moves along a custom-drawn path stored in params
  'moves_along_path',
  // Geometric construction constraints (Layer 2) — the source is RE-DERIVED each
  // frame from its anchor item(s), so dragging an anchor updates it live
  // (GeoGebra-style). Anchor A is the relation target; extra anchors ride in params.
  'is_midpoint_of',      // source = midpoint(target, params.other)
  'lies_on_line',        // source on line target→params.other at fraction params.t
  'is_centroid_of',      // source = centroid(target, ...params.others)
  'is_circumcenter_of',  // source = circumcenter(target, params.other1, params.other2)
  'concentric_with',     // source shares the target's center
  'construction_reveal', // self-relation: opacity 0→1 at params.revealAt over params.fadeIn (timeline-driven)
  // Procedural / deterministic property binding (Expression IR — FxTool S10 G1).
  // params.signal:true routes through the pure, seed/frame-deterministic signal
  // interpreter (replay-stable), else the per-frame compute fallback runs.
  'driven_by',           // source property = target property * multiplier + offset (+clamp); drives color/stroke/opacity/scale/pos. Needs a target.
  'time_expression',     // self-relation: source property driven by a math expression f(t, v) — t=time, v=params.baseValue
  // Event-driven scene chains (FxTool S11). The source is a pp:event (make one
  // with pinepaper_event); firing it runs these reactions. on_event_fire_after
  // chains events over canvas/wall time; on_event_add_relation mutates the graph
  // (the scene evolves itself). Kick a chain off with pinepaper_event pulse.
  'on_event_fire_after',   // event→event: when source fires, pulse target after params.delay (timeline: wall|canvas)
  'on_event_add_relation', // event→item: add params.type relation from item to params.target when the event fires
  'on_event_remove_relation', // event→item: remove params.type relation from item to params.target
  'on_event_set_color',    // event→item: set fill/stroke to params.color
  'on_event_set_property', // event→item: set item[params.property] = params.value
  'on_event_set_visibility', // event→item: show/hide (params.visible, default true)
  // Structural layout relations (FxTool S12-E1) — STATIC composition as graph edges.
  // Placement is derived from the TARGET'S BOUNDS and re-derived each frame, so
  // dragging or resizing the target moves the dependent live. Use these instead of
  // hardcoding x/y when the intent is "on", "under", "next to", "inside".
  'on_top_of',    // source bottom edge rests on target top edge (params: gap, align, overhang)
  'below',        // source top edge rests on target bottom edge (params: gap, align, overhang)
  'beside',       // source flanks the target left/right (params: side, gap, align)
  'inside',       // source anchored inside the target's bounds (params: anchor, padding)
  'centered_on',  // source center = target center + (offsetX, offsetY)
  'aligned_with', // source matches target on ONE axis only — the other stays free (params: axis, offset)
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

export const CameraAnimatesParamsSchema = z.object({
  keyframes: z.array(z.object({
    time: z.number().describe('Time in seconds'),
    zoom: z.number().optional().describe('Zoom level (1=normal)'),
    center: PointArraySchema.optional().describe('View center [x, y]'),
    pitch: z.number().optional().describe('3D tilt in degrees (0=flat, positive=forward tilt)'),
    yaw: z.number().optional().describe('3D rotation in degrees'),
    easing: z.string().optional().describe('Easing function'),
  })).optional().describe('Camera keyframes'),
  duration: z.number().optional().default(2).describe('Total animation duration in seconds'),
  loop: z.boolean().optional().default(false).describe('Loop animation'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
  fov: z.number().optional().default(60).describe('Field of view in degrees for 3D perspective'),
});

export const MorphsToParamsSchema = z.object({
  duration: z.number().optional().default(1.5).describe('Morph duration in seconds'),
  delay: z.number().optional().default(0).describe('Delay before starting'),
  easing: z.string().optional().default('easeInOutCubic').describe('Easing function'),
  morphColor: z.boolean().optional().default(true).describe('Also morph color'),
  morphSize: z.boolean().optional().default(true).describe('Also morph size'),
});

// Pair-by-index group morph. Source paper.Group's children migrate into target
// Group's children's positions; Path.Line endpoints deform; excess children fade.
// Generic — any two groups (graph vertices+edges, letter collages, dashboard
// clusters, etc.) work with the same call shape.
export const GroupMorphsToParamsSchema = z.object({
  duration:    z.number().optional().default(1.5).describe('Morph duration each direction (seconds)'),
  hold:        z.number().optional().default(1.0).describe('Hold time on each end before reversing (seconds)'),
  loop:        z.boolean().optional().default(true).describe('Cycle source ↔ target indefinitely'),
  easing:      z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut']).optional().default('easeInOut').describe('Easing for the position interpolation'),
  deformLines: z.boolean().optional().default(true).describe('Path.Line children deform via segment endpoints instead of rigid translation'),
});

// =============================================================================
// EQUATION-DRIVEN PATHS (Expression IR — FxTool S10 B5)
// Deterministic: math strings are parsed via expr-to-ir (no eval), sampled on
// the Expression IR. Shared by pinepaper_equation_path (geometry) and the
// moves_along_path `equation` motion source.
// =============================================================================

// Curated curve library (curvePreset). Each is a parametric preset.
export const CurvePresetSchema = z.enum(['spiral', 'rose', 'lissajous', 'astroid', 'heart', 'spirograph'])
  .describe('Curated curve preset');

// One Fourier term for kind:"fourier".
export const HarmonicSchema = z.object({
  freq:  z.number().describe('Harmonic frequency'),
  amp:   z.number().describe('Amplitude'),
  phase: z.number().optional().describe('Phase offset (radians)'),
});

// Chained parametric warp — displaces each sampled point by (dx, dy),
// expressions of x, y (point coords) and t (0..1 along the path).
export const EquationWarpSchema = z.object({
  dx: z.string().optional().describe('x displacement expression of x, y, t (0..1)'),
  dy: z.string().optional().describe('y displacement expression of x, y, t (0..1)'),
});

// The math-source fields common to both equation surfaces (no placement).
const equationSpecShape = {
  kind:      z.enum(['function', 'parametric', 'fourier', 'preset']).optional().default('function').describe("'function' y=f(variable) · 'parametric' x=fx(param),y=fy(param) · 'fourier' harmonics · 'preset' curated curve"),
  expr:      z.string().optional().describe("y = f(variable) — kind 'function', e.g. 'sin(x)*80'"),
  xExpr:     z.string().optional().describe("x = fx(param) — kind 'parametric'"),
  yExpr:     z.string().optional().describe("y = fy(param) — kind 'parametric'"),
  harmonics: z.array(HarmonicSchema).optional().describe("Fourier terms — kind 'fourier'"),
  preset:    CurvePresetSchema.optional().describe("Curated curve — kind 'preset'"),
  variable:  z.string().optional().default('x').describe("Sample variable for kind 'function'"),
  param:     z.string().optional().default('t').describe("Sample variable for kind 'parametric'/'preset'"),
  min:       z.number().optional().describe('Sample range start'),
  max:       z.number().optional().describe('Sample range end'),
  samples:   z.number().optional().default(200).describe('Number of samples along the range'),
  scale:     z.number().optional().default(1).describe('Multiply equation coords before placing'),
  flipY:     z.boolean().optional().default(true).describe('Math y-up → screen y-down'),
  warp:      z.union([EquationWarpSchema, z.array(EquationWarpSchema)]).optional().describe('Chained parametric warp(s) applied to the sampled points'),
} as const;

// Self-relation: item is driven along a custom-drawn path stored in params.
// In the editor the Relations picker offers a drag-to-draw capture mode; via
// MCP / agent code, pass the points array explicitly.
// Equation motion source for moves_along_path (S10 B5): the item TRAVERSES a
// math curve instead of a drawn point list. Origin is cx/cy (default 0) —
// distinct from pinepaper_equation_path's x/y (canvas-center default).
// .passthrough(): preset tuning params (e.g. rose's k/r, spiral's turns) ride on
// the top-level object — FxTool does curvePreset(eq.preset, eq) — so they must
// survive validation instead of being stripped.
export const MovesAlongPathEquationSchema = z.object({
  ...equationSpecShape,
  cx: z.number().optional().describe('Canvas origin x for the sampled curve (default 0)'),
  cy: z.number().optional().describe('Canvas origin y for the sampled curve (default 0)'),
}).passthrough();

export const MovesAlongPathParamsSchema = z.object({
  // path OR equation — one is required. equation overrides path when both are set.
  path:   z.array(z.union([
            z.object({ x: z.number(), y: z.number() }),
            z.tuple([z.number(), z.number()]),
          ])).optional().describe('Path points: array of {x,y} objects or [x,y] tuples (omit when using `equation`)'),
  equation: MovesAlongPathEquationSchema.optional().describe('Equation motion source (S10 B5): traverse a math curve instead of a drawn path — deterministic, sampled on the Expression IR'),
  speed:  z.number().optional().default(1).describe('Speed multiplier (1 ≈ 150 px/s)'),
  closed: z.boolean().optional().default(true).describe('Loop back to start at end of path'),
  phase:  z.number().optional().default(0).describe('Starting position along path (0–1)'),
  easing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'sine', 'bounce', 'pingpong']).optional().default('linear').describe('Motion curve mapping normalized time → progress along path'),
});

// pinepaper_equation_path input — creates a path ITEM from a math equation.
// Placement is x/y (canvas center default) + style, on top of the shared spec.
// .passthrough(): preset tuning params (rose's k/r, spiral's turns, …) ride on
// the top-level object — FxTool does curvePreset(opts.preset, opts.presetParams
// || opts) — so they must survive validation.
export const EquationPathInputSchema = z.object({
  ...equationSpecShape,
  x:     z.number().optional().describe('Canvas origin x (default: canvas center)'),
  y:     z.number().optional().describe('Canvas origin y (default: canvas center)'),
  style: z.record(z.unknown()).optional().describe('Path style forwarded to create (strokeColor, strokeWidth, fillColor, …)'),
}).passthrough();
export type EquationPathInput = z.infer<typeof EquationPathInputSchema>;

// Procedural / deterministic property binding (Expression IR — FxTool S10 G1).
// driven_by: source's `sourceProperty` = target's `targetProperty` * multiplier
// + offset (optionally clamped). For fillColor/strokeColor the driven value
// (clamped 0..1) interpolates colorFrom→colorTo — a relation that drives COLOR.
// signal:true evaluates via the pure IR signal interpreter (frame-deterministic,
// x/y target props track a moving target); else the per-frame compute runs.
export const DrivenByParamsSchema = z.object({
  sourceProperty: z.enum(['x', 'y', 'rotation', 'opacity', 'scale', 'strokeWidth', 'fillColor', 'strokeColor']).optional().default('opacity').describe('Property on the SOURCE item to drive'),
  targetProperty: z.enum(['x', 'y', 'rotation', 'opacity', 'scale']).optional().default('x').describe('Property on the TARGET item to read'),
  multiplier: z.number().optional().default(1).describe('Scale factor applied to the target value'),
  offset: z.number().optional().default(0).describe('Offset added after the multiplier'),
  clamp: z.object({ min: z.number().optional(), max: z.number().optional() }).optional().describe('Optional {min, max} clamp on the result'),
  colorFrom: z.string().optional().default('#000000').describe('Color at driven value 0 (fillColor/strokeColor sourceProperty)'),
  colorTo: z.string().optional().default('#ffffff').describe('Color at driven value 1 (fillColor/strokeColor sourceProperty)'),
  signal: z.boolean().optional().default(false).describe('Deterministic IR-signal mode — replay-stable; x/y target props track a moving target'),
});

// time_expression: self-relation (targetId=null). The source's `property` is
// driven by a math expression of t (scene time) and v (baseValue). signal:true
// parses the expression into the Expression IR and evaluates a pure f(t)
// (replay-stable), falling back to per-frame if it uses random()/unknown symbols.
export const TimeExpressionParamsSchema = z.object({
  property: z.string().optional().default('y').describe('Property to drive: x, y, rotation, opacity, scale'),
  expression: z.string().optional().default('sin(t * 2) * 50 + 300').describe('Math expression of t (time) and v (baseValue), e.g. "sin(t*2)*50 + v"'),
  baseValue: z.number().optional().default(0).describe('Base value accessible as v in the expression'),
  signal: z.boolean().optional().default(false).describe('Deterministic IR mode — parse expression to IR, evaluate as pure f(t)'),
});

// =============================================================================
// EVENT-DRIVEN SCENE CHAINS (FxTool S11). Source of each is a pp:event.
// =============================================================================

// on_event_fire_after (event→event): chain a delayed pulse. timeline 'canvas'
// schedules on the animation clock (pauses/seeks/loops with the timeline) — use
// it for scene chains; 'wall' is real-world setTimeout ms.
export const OnEventFireAfterParamsSchema = z.object({
  delay:    z.number().min(0).optional().default(1000).describe('Delay before pulsing the target event (milliseconds)'),
  timeline: z.enum(['wall', 'canvas']).optional().default('wall').describe("'canvas' = animation-clock time (scrub/loop-stable) · 'wall' = real setTimeout ms"),
});

// on_event_add_relation (event→item): when the event fires, add a relation FROM
// the target item TO params.target of type params.type. The scene mutates itself.
export const OnEventAddRelationParamsSchema = z.object({
  type:   z.string().describe('Relation type to add (e.g. orbits, moves_along_path, driven_by)'),
  target: z.string().nullish().describe('Target item id for the added relation (null for self-relations)'),
  params: z.record(z.unknown()).optional().default({}).describe('Params for the added relation'),
});

// on_event_remove_relation (event→item): tear down a relation added earlier.
export const OnEventRemoveRelationParamsSchema = z.object({
  type:   z.string().describe('Relation type to remove'),
  target: z.string().nullish().describe('Target item id (null for self-relations)'),
});

// on_event_set_color (event→item).
export const OnEventSetColorParamsSchema = z.object({
  color: z.string().describe('Color to apply when the event fires'),
  which: z.enum(['fill', 'stroke']).optional().default('fill').describe('Which color channel to set'),
});

// on_event_set_property (event→item): set an arbitrary property.
export const OnEventSetPropertyParamsSchema = z.object({
  property: z.string().describe('Item property to set (e.g. opacity, rotation, strokeWidth)'),
  value:    z.unknown().describe('Value to assign'),
});

// on_event_set_visibility (event→item).
export const OnEventSetVisibilityParamsSchema = z.object({
  visible: z.boolean().optional().default(true).describe('Show (true) or hide (false) the item'),
});

// pinepaper_event tool — manage the pp:event channel.
//   create → app.createEvent(name, {payloadType,x,y}) → returns eventId
//   pulse  → app.pulseEvent(eventId, payload) → kicks off a chain
export const EventInputSchema = z.object({
  action:      z.enum(['create', 'pulse']).describe("'create' a pp:event · 'pulse' it to fire listeners/chains"),
  name:        z.string().optional().describe("Event name — required for action 'create'"),
  payloadType: z.string().optional().describe("Payload type label (default 'Pulse') — action 'create'"),
  x:           z.number().optional().describe('Canvas x for the event marker — action create'),
  y:           z.number().optional().describe('Canvas y for the event marker — action create'),
  eventId:     z.string().optional().describe("Event id to fire — required for action 'pulse'"),
  payload:     z.unknown().optional().describe("Optional value forwarded to listeners — action 'pulse'"),
}).refine((v) => v.action !== 'create' || !!v.name, { message: "action 'create' requires name", path: ['name'] })
  .refine((v) => v.action !== 'pulse' || !!v.eventId, { message: "action 'pulse' requires eventId", path: ['eventId'] });
export type EventInput = z.infer<typeof EventInputSchema>;

// =============================================================================
// STRUCTURAL LAYOUT RELATIONS (FxTool S12-E1)
// =============================================================================
// Placement expressed as a graph edge rather than baked-in coordinates. Every
// compute reads the TARGET'S bounds and the SOURCE'S own bounds, and re-runs each
// frame — move or resize the target and the dependent follows. All six need a
// target. `signal: true` routes through the pure Expression-IR port, which FxTool
// keeps bit-identical to the live compute.

// on_top_of: source bottom edge rests on the target's top edge.
//   y = T.y - target.height/2 - gap - source.height/2
export const OnTopOfParamsSchema = z.object({
  gap:      z.number().optional().default(0).describe('Pixels between the two edges'),
  align:    z.enum(['left', 'center', 'right']).optional().default('center').describe('Horizontal alignment relative to the target'),
  overhang: z.number().optional().default(0).describe('Extra signed x-offset in px'),
  signal:   z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
});

// below: the mirror of on_top_of — source top edge rests on the target's bottom edge.
export const BelowParamsSchema = z.object({
  gap:      z.number().optional().default(0).describe('Pixels between the two edges'),
  align:    z.enum(['left', 'center', 'right']).optional().default('center').describe('Horizontal alignment relative to the target'),
  overhang: z.number().optional().default(0).describe('Extra signed x-offset in px'),
  signal:   z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
});

// beside: source flanks the target horizontally, aligned vertically.
export const BesideParamsSchema = z.object({
  side:   z.enum(['left', 'right']).optional().default('right').describe('Which side of the target'),
  gap:    z.number().optional().default(0).describe('Pixels between the two edges'),
  align:  z.enum(['top', 'center', 'bottom']).optional().default('center').describe('Vertical alignment relative to the target'),
  signal: z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
});

// inside: source placed fully within the target's bounds at a 9-way anchor.
export const InsideParamsSchema = z.object({
  anchor:  z.enum(['center', 'top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'])
            .optional().default('center').describe('Where inside the target to anchor the source'),
  padding: z.number().optional().default(0).describe('Inset from the target edge in px'),
  signal:  z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
});

// centered_on: source center = target center + offset (concentric when offset is 0).
export const CenteredOnParamsSchema = z.object({
  offsetX: z.number().optional().default(0).describe('Signed x-offset from the target center'),
  offsetY: z.number().optional().default(0).describe('Signed y-offset from the target center'),
  signal:  z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
});

// aligned_with: ONE axis of the source center matches the target's; the other axis
// is left untouched (FxTool writes only the returned component). `axis` is required —
// FxTool's compute returns undefined (relation does nothing) without it.
export const AlignedWithParamsSchema = z.object({
  axis:   z.enum(['x', 'y']).describe('Which axis to align (required — the relation is inert without it)'),
  offset: z.number().optional().default(0).describe('Signed offset along that axis'),
  signal: z.boolean().optional().default(false).describe('Deterministic mode — route through the pure Expression-IR port'),
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
  // Classic generators
  'drawSunburst',
  'drawSunsetScene',
  'drawGrid',
  'drawStackedCircles',
  'drawCircuit',
  'drawWaves',
  'drawPattern',
  // Visual generators
  'drawBokeh',
  'drawGradientMesh',
  'drawGeometricAbstract',
  'drawWindField',
  'drawFluidFlow',
  'drawOrganicFlow',
  'drawNoiseTexture',
  'drawGlobeWireframe',
  // Scene generators
  'drawPerspectiveGrid',
  'drawPoissonDisk',
  'drawPoissonShapesAsync',
  'drawGoldenSpiral',
  'drawFibonacci',
  'createShape',
  'createGradientCircle',
  'drawStarfield',
  'drawSolarSystem',
  'drawDayNightCycle',
  'drawCosmosSpace',
  'drawTadpoles',
  'drawMetaballs',
  'drawKaleidoscope',
  'drawFlowField',
  'drawNeonGrid',
  'drawConstellation',
  'drawTessellation',
  // Decorative generators
  'drawSunburstLines',
  'drawGlowOrbs',
  'drawConcentricRings',
  'drawCornerAccents',
  'drawFlowCurves',
  'drawFallingPetals',
  'drawFireflies',
  'drawFloatingLeaves',
  'drawVoronoi',
  // Map generators
  'drawWorldMap',
  'drawUSAMap',
  'drawCountryMap',
  'drawChoroplethMap',
  // PineMath generators
  'drawFunctionPlot',
  'drawParametricCurve',
  'drawSimulation',
  'drawSpectrumAnalyzer',
  'draw3DSurface',
  // S6 seeded procedural generators (curated presets + Motion group)
  'drawTruchet',
  'drawHalftone',
  'drawRibbons',
  // GPU / GLSL math-art generators
  'drawFormulaArt',
  'drawParametricCollection',
  'drawShaderArt',
  'drawYeganehMountains',
  // OKLCH seeded backgrounds + 3D parametric curve
  'drawBlobs',
  'drawLowPoly',
  'drawPeaks',
  'drawScatter',
  'drawStackedWaves',
  'draw3DParametricCurve',
]).describe('Background generator name');

export type GeneratorName = z.infer<typeof GeneratorNameSchema>;

// ---------------------------------------------------------------------------
// Generator parameter schemas — Phase 1 (enhanced existing)
// ---------------------------------------------------------------------------

export const SunburstParamsSchema = z.object({
  rayCount: z.number().optional().default(16).describe('Number of rays'),
  colors: z.array(ColorSchema).optional().default(['#FF6B6B', '#4ECDC4']).describe('Ray colors'),
  bgColor: ColorSchema.optional().default('#1a1a2e').describe('Background color (use "none" or "transparent" for no background)'),
  animated: z.boolean().optional().default(true).describe('Enable rotation animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
  rayGap: z.number().optional().describe('Gap between rays in degrees'),
  gradientRays: z.boolean().optional().describe('Radial gradient per ray'),
});

export const GridParamsSchema = z.object({
  gridType: z.enum(['lines', 'dots', 'squares']).optional().default('lines'),
  spacing: z.number().optional().default(40).describe('Grid cell size'),
  lineColor: ColorSchema.optional().default('#374151').describe('Line/dot color'),
  bgColor: ColorSchema.optional().default('#1f2937').describe('Background color (use "none" or "transparent" for no background)'),
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
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color (use "none" or "transparent" for no background)'),
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
  bgColor: ColorSchema.optional().default('#0f172a').describe('Background color (use "none" or "transparent" for no background)'),
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
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
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
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  minRadius: z.number().optional().describe('Minimum circle radius'),
  maxRadius: z.number().optional().describe('Maximum circle radius'),
  shadowBlur: z.number().optional().describe('Soft-focus blur amount'),
  distribution: z.enum(['random', 'poisson']).optional().describe('Circle distribution'),
  driftAnimation: z.boolean().optional().describe('Enable slow drift animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const GradientMeshParamsSchema = z.object({
  colors: z.array(ColorSchema).optional().describe('Gradient blob colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  blobCount: z.number().optional().describe('Number of gradient blobs'),
  blendMode: z.string().optional().describe('CSS blend mode (default: screen)'),
  drift: z.boolean().optional().describe('Enable slow drift animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const GeometricAbstractParamsSchema = z.object({
  colors: z.array(ColorSchema).optional().describe('Shape colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  shapeCount: z.number().optional().describe('Number of shapes'),
  blendMode: z.string().optional().describe('CSS blend mode'),
  rotation: z.boolean().optional().describe('Enable rotation animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const WindFieldParamsSchema = z.object({
  particleCount: z.number().optional().describe('Number of wind particles'),
  colors: z.array(ColorSchema).optional().describe('Particle colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  direction: z.number().optional().describe('Wind direction in degrees'),
  turbulence: z.number().optional().describe('Noise turbulence amount'),
  trailLength: z.number().optional().describe('Particle trail length'),
  speed: z.number().optional().describe('Particle speed'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const FluidFlowParamsSchema = z.object({
  streamCount: z.number().optional().describe('Number of fluid streams'),
  colors: z.array(ColorSchema).optional().describe('Stream colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  depthLayers: z.number().optional().describe('Number of depth layers'),
  speed: z.number().optional().describe('Flow animation speed'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const OrganicFlowParamsSchema = z.object({
  layerCount: z.number().optional().describe('Number of aurora/silk layers'),
  colors: z.array(ColorSchema).optional().describe('Layer colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
  blendMode: z.string().optional().describe('CSS blend mode (default: screen)'),
  fillToBottom: z.boolean().optional().describe('Fill layers to bottom edge'),
  animated: z.boolean().optional().describe('Enable flow animation'),
  opacity: z.number().min(0).max(1).optional().describe('Overall opacity'),
});

export const NoiseTextureParamsSchema = z.object({
  noiseType: z.enum(['perlin', 'grain', 'stipple']).optional().describe('Noise algorithm'),
  colors: z.array(ColorSchema).optional().describe('Noise colors'),
  bgColor: ColorSchema.optional().describe('Background color (use "none" or "transparent" for no background)'),
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
  'smoke',
  'fire',
  'rain',
  'snow',
  'confetti',
  'ripple',
  'glow',
  'electric',
  'bubbles',
  'dust',
  'fireflies',
  'shockwave',
  'trail',
  // Shader auras (WebGL2 silhouette-clipped) — routed to ItemAuraSystem by
  // the same app.applyEffect entry point as the particle types.
  'heatmap',
  'liquid_metal',
  'gem_smoke',
]).describe('Visual effect type (particle effects + shader auras)');

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
  source: z.enum(['generic', 'figma']).optional()
    .describe("'figma' normalises Figma's Copy-as-SVG output first: strips the inherited root fill=\"none\" that makes everything invisible, adds a missing viewBox, and namespaces global ids like clip0 so a second import does not adopt the first one's clipPath"),
});

// Import Mermaid (flowchart, stateDiagram, sequenceDiagram, erDiagram, classDiagram)
export const ImportMermaidInputSchema = z.object({
  mermaidText: z.string().min(1).describe('Mermaid diagram source. First line determines type: "flowchart"/"graph", "stateDiagram(-v2)", "sequenceDiagram", "erDiagram", "classDiagram".'),
  autoLayout: z.boolean().optional().default(true).describe('Run auto-layout after import (default: true). Disable to keep nodes at parsed coordinates only.'),
  clearExisting: z.boolean().optional().default(false).describe('Remove existing canvas items before importing (default: false — additive).'),
});
export type ImportMermaidInput = z.infer<typeof ImportMermaidInputSchema>;

// Capture current canvas as pp: ontology — wraps FxTool's
// app.exportCanvasOntology() (PinePaper.js, post-promotion) so an LLM can
// reason about composition from a compact triples block + structured items
// list rather than a raw paper.js dump.
export const GetCanvasOntologyInputSchema = z.object({
  maxItems: z.number().int().positive().max(500).optional().default(50).describe('Cap on item summaries (default 50). Larger scenes are truncated, not paginated.'),
  maxChildren: z.number().int().positive().max(50).optional().default(10).describe('Cap on per-group child summaries (default 10).'),
  includeViewport: z.boolean().optional().default(false).describe('Include current view zoom/center + camera-animation flag (default false).'),
});
export type GetCanvasOntologyInput = z.infer<typeof GetCanvasOntologyInputSchema>;

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
  animationType: z.string().optional().describe('Inline animation to apply on creation. Loop presets (pulse, rotate, bounce, fade, wobble, slide, typewriter) or "keyframe" with keyframes array. Equivalent to a follow-up pinepaper_animate / pinepaper_keyframe_animate call.'),
  animationSpeed: z.number().optional().describe('Speed multiplier for loop animations (default: 1.0). Ignored when animationType is "keyframe".'),
  animationIntensity: z.number().optional().describe('Loop animation amplitude (0.1 = ±10%, default 0.15). Drives pulse/wobble/bounce/breathe amplitude; honored by SVG/SMIL/widget export.'),
  animationDelay: z.number().optional().describe('Loop animation start delay in seconds.'),
  keyframes: z.array(KeyframeSchema).optional().describe('Required when animationType is "keyframe". Inline keyframe array attached at creation.'),
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
  targetId: z.string().nullish().describe('Registry ID of the target item; null/omitted for self-relations (animates, moves_along_path, construction_reveal, time_expression)'),
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
  intensity: z.number().optional().describe('Animation amplitude (animationIntensity): 0.1 = ±10%, 0.2 = ±20% (default 0.15). Drives pulse/wobble/bounce/breathe amplitude and is now honored by SVG/SMIL/widget export.'),
  delay: z.number().optional().describe('Animation start delay in seconds (animationDelay).'),
});

// Keyframe Animate
export const KeyframeAnimateInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item'),
  keyframes: z.array(KeyframeSchema),
  duration: z.number().optional().describe('Total animation duration'),
  loop: z.boolean().optional().default(false),
  timeOffset: z.number().optional().describe('Shift the whole clip in canvas time (seconds). The animation only runs while canvas time is in [timeOffset, timeOffset + (clipOutPoint - clipInPoint)].'),
  timeUnits: z.enum(['seconds', 'ms']).optional().describe("Explicit units for keyframe times/duration. 'seconds' disables the legacy >100→ms auto-detect — REQUIRED for long-form timelines with second values over 100."),
  clipInPoint: z.number().optional().describe('Skip the first N seconds of keyframe data — clip head trim.'),
  clipOutPoint: z.number().optional().describe('Stop at N seconds into the keyframe data — clip tail trim. Default: lastKeyframeTime.'),
});

// Execute Generator
//
// Region (added FxTool c81781c): when set, the generator draws into a clipped
// sub-group translated to (x,y) sized (width × height). Region runs imply
// preserve (won't wipe the canvas) and re-running the same generator replaces
// its prior region. Different generators' regions coexist. Invalid/zero-size
// regions fall back to full-canvas FxTool-side.
export const GeneratorRegionSchema = z.object({
  x: z.number().describe('Region top-left X in canvas coords'),
  y: z.number().describe('Region top-left Y in canvas coords'),
  width: z.number().positive().describe('Region width in pixels'),
  height: z.number().positive().describe('Region height in pixels'),
}).describe('Optional sub-region {x, y, width, height} the generator draws into.');

export type GeneratorRegion = z.infer<typeof GeneratorRegionSchema>;

export const ExecuteGeneratorInputSchema = z.object({
  generatorName: GeneratorNameSchema,
  params: z.record(z.unknown()).optional().default({}),
  region: GeneratorRegionSchema.optional(),
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
  action: z.enum(['play', 'pause', 'stop', 'seek']),
  duration: z.number().optional().describe('Duration for play action'),
  loop: z.boolean().optional(),
  time: z.number().optional().describe('Time to seek to'),
  deterministic: z
    .boolean()
    .optional()
    .describe('For seek: evaluate the scene at the exact time via app.sceneAt(t) — ticks keyframes + relations + generators deterministically (same t → same frame), not just the keyframe state. Use before a screenshot for a reproducible frame.'),
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
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_PROPERTIES: 'INVALID_PROPERTIES',
  GENERATOR_NOT_FOUND: 'GENERATOR_NOT_FOUND',
  EXPORT_FAILED: 'EXPORT_FAILED',
  EXECUTION_ERROR: 'EXECUTION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AGENT_JOB_ERROR: 'AGENT_JOB_ERROR',
  BATCH_EXECUTION_ERROR: 'BATCH_EXECUTION_ERROR',
  UNKNOWN_TOOL: 'UNKNOWN_TOOL',
  BROWSER_NOT_CONNECTED: 'BROWSER_NOT_CONNECTED',
  REFRESH_FAILED: 'REFRESH_FAILED',
  SCREENSHOT_FAILED: 'SCREENSHOT_FAILED',
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
  description: z.string().optional().describe('User prompt or task description for creative direction'),
  headless: z.boolean().optional().default(true).describe('Run browser in headless mode'),
  screenshotPolicy: AgentScreenshotPolicySchema.optional().default('on_complete'),
  canvasPreset: AgentPlatformSchema.optional().describe('Canvas size preset to apply'),
  canvasSize: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional().describe('Custom canvas dimensions'),
  backgroundColor: z.string().optional().describe('Background color to set'),
  clearCanvas: z.boolean().optional().default(true).describe('Clear canvas when starting job'),
  includeOntology: z.boolean().optional().default(true).describe('Include canvas ontology snapshot in the result. Tiny payload when clearCanvas is true (empty canvas) — captures existing state when clearCanvas is false. Set false to skip; reset to true if rerunning against an older FxTool that lacks exportCanvasOntology.'),
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
  'create', 'modify', 'delete', 'group',
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
  // Group operation fields
  itemIds: z.array(z.string()).optional().describe('Item IDs or $N references to combine for a "group" operation (the parts of a composite object).'),
  groupName: z.string().optional().describe('Optional name for the group created by a "group" operation (e.g. "car").'),
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
  generatorRegion: GeneratorRegionSchema.optional().describe('Optional sub-region {x, y, width, height} for execute_generator'),
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

// Group / ungroup — combine the parts of a composite object into ONE draggable entity
// (a car's body + wheels + windows), or break a group back into loose items.
export const GroupInputSchema = z.object({
  action: z.enum(['group', 'ungroup', 'break_apart']).describe('group: combine itemIds into one entity. ungroup: dissolve a group back into loose items. break_apart: split an imported SVG / group / compound-path into individually movable parts (re-grouped as one).'),
  itemIds: z.array(z.string()).optional().describe('For group: registry IDs of the items to combine.'),
  itemId: z.string().optional().describe('For break_apart: registry ID of the imported SVG / group / compound-path to decompose into parts.'),
  groupName: z.string().optional().describe('For group: optional name (e.g. "car", "robot").'),
  groupId: z.string().optional().describe('For ungroup: registry ID of the group to dissolve.'),
});
export type GroupInput = z.infer<typeof GroupInputSchema>;

// Camera director — compile a high-level SHOT LIST into one camera_animates walkthrough
// (FxTool's DirectorCompiler). 'auto' derives a shot per item; 'shots' takes an explicit list.
export const CameraDirectorInputSchema = z.object({
  action: z.enum(['auto', 'shots']).describe("auto: generate a default walkthrough (one shot per item). shots: apply an explicit shot list."),
  shots: z
    .array(
      z.object({
        subjects: z.union([z.literal('everything'), z.array(z.string())]).describe("'everything' or item registry IDs the shot frames"),
        framing: z.union([z.enum(['tight', 'medium', 'wide']), z.number()]).optional().describe('Framing tightness (or an explicit zoom number). Default medium.'),
        hold: z.number().optional().describe('Seconds to dwell on the shot (default 1.2).'),
        moveIn: z.string().optional().describe("Move style, e.g. 'push-in' | 'pan'."),
        ease: z.enum(['smooth', 'linear', 'settle', 'snap']).optional().describe('Easing between shots (default smooth).'),
        transition: z.number().optional().describe('Seconds to travel into this shot (default 1.0).'),
      }),
    )
    .optional()
    .describe('For action "shots": ordered shot list. Each shot frames its subjects at the given tightness.'),
  order: z.enum(['reading', 'reverse', 'creation']).optional().describe('For action "auto": item visiting order (default reading).'),
  hold: z.number().optional().describe('For action "auto": per-shot dwell seconds.'),
  establishing: z.boolean().optional().describe('For action "auto": open with a wide establishing shot of everything.'),
  loop: z.boolean().optional().describe('Loop the camera walkthrough.'),
});
export type CameraDirectorInput = z.infer<typeof CameraDirectorInputSchema>;

// On-device object detection (FxTool ImageWorkflow / DETR·YOLO). Find objects in an
// imported image; optionally promote each detection to a typed, image-anchored design
// node (pp:Detected*, Wikidata-aliased) so relations can bind a shape to it.
export const DetectObjectsInputSchema = z.object({
  itemId: z.string().optional().describe('Registry ID of the image to scan (default: the most recent image on the canvas).'),
  threshold: z.number().min(0).max(1).optional().describe('Confidence threshold 0-1 (default ~0.35 for DETR, ~0.1 for open-vocabulary).'),
  asNodes: z.boolean().optional().describe('true → promote each detection to a typed, image-anchored design NODE (a relation target: pp:Detected* aliased to a Wikidata entity) instead of drawing a labeled box. Enables relational compositing (bind a shape on/around/at the object; it tracks the image).'),
  queries: z.union([z.array(z.string()), z.string()]).optional().describe('OPEN-VOCABULARY detection (OWL-ViT, zero-shot): a list (or comma-separated string) of things to find by description — e.g. ["red umbrella","traffic light"]. Finds whatever you describe instead of the fixed 80 COCO classes. Omit to use the default DETR detector. The OWL-ViT model is a large one-time on-device download.'),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

// Extract the best-matching detected region from an image as a NEW item.
export const ExtractObjectInputSchema = z.object({
  label: z.string().optional().describe('What to extract (e.g. "cat", "person"). Picks the best-matching detection; default = highest-confidence.'),
  itemId: z.string().optional().describe('Registry ID of the source image (default: most recent image).'),
  x: z.number().optional().describe('Optional hint X (canvas coords) to disambiguate which detection to extract.'),
  y: z.number().optional().describe('Optional hint Y (canvas coords).'),
  threshold: z.number().min(0).max(1).optional().describe('Confidence threshold 0-1.'),
});
export type ExtractObjectInput = z.infer<typeof ExtractObjectInputSchema>;

// Z-order / arrange — move an item up or down the stacking order.
export const ArrangeInputSchema = z.object({
  itemId: z.string().describe('Registry ID of the item to reorder.'),
  action: z.enum(['front', 'back', 'forward', 'backward']).describe('front: bring to top of the stack. back: send to bottom. forward: move up one. backward: move down one.'),
});
export type ArrangeInput = z.infer<typeof ArrangeInputSchema>;

/**
 * Batch execute input schema
 */
export const AgentBatchExecuteInputSchema = z.object({
  operations: z.array(AgentBatchOperationSchema).min(1).describe('Array of operations to execute'),
  atomic: z.boolean().optional().default(true).describe('Rollback all operations on any failure'),
  skipValidation: z.boolean().optional().default(false).describe('Skip the ontology preflight that catches typos in itemType/relationType/effectType/generatorName before browser execution. Use only when intentionally passing experimental vocabulary values.'),
}).describe('Batch execution input');

export type AgentBatchExecuteInput = z.infer<typeof AgentBatchExecuteInputSchema>;

/**
 * Max duration for GIF exports, in seconds.
 *
 * MP4/WebM are codec-bounded — the encoder is handed a target bitrate picked from
 * a resolution tier, so output size lands at roughly bitrate × duration and the
 * 60s ceiling is predictable. GIF has NO bitrate target (VideoExporter._exportGIF
 * hands gif.js a quality level, not a rate), so size scales with
 * frames × dimensions and a 60s export at a large canvas is pathological.
 *
 * The editor UI has always offered GIF duration presets only up to 15s while
 * video goes to 60 (ExportEngine: `isGif ? [3,5,10,15] : [3,5,10,15,30,60]`).
 * That divergence left the agent surface able to request durations a human
 * could not. This brings the two in line.
 */
export const GIF_MAX_DURATION_S = 15;

/**
 * Smart export input schema
 */
export const AgentExportInputSchema = z.object({
  platform: z.union([AgentPlatformSchema, z.literal('auto')]).optional().default('auto').describe('Target platform'),
  format: z.union([AgentExportFormatSchema, z.literal('auto')]).optional().default('auto').describe('Export format'),
  quality: z.enum(['draft', 'standard', 'high']).optional().default('standard').describe('Export quality level'),
  includeRecommendations: z.boolean().optional().default(true).describe('Include alternative format recommendations'),
  framing: z.enum(['canvas', 'camera']).optional().default('canvas').describe('Output framing: "canvas" (full canvas, default) or "camera" (camera_animates first-keyframe viewport — fails if no walkthrough exists). Camera animation still drives motion within the fixed output frame.'),
  duration: z.number().min(0.5).max(60).optional().default(5).describe(`Video duration in seconds for animated formats (mp4/webm/gif). Default 5. Max 60 for mp4/webm, max ${GIF_MAX_DURATION_S} for gif (GIF is not codec-bounded, so file size scales with frames × dimensions). Static formats (png/svg/pdf) ignore this.`),
  estimateOnly: z.boolean().optional().default(false).describe('Preflight only: return the estimated file size for these EXACT settings and render nothing. Use before a long or high-quality export to check the size first. Modeled for mp4/webm/gif; png/pdf/svg return confidence "none" because no dimension-based model exists for them.'),
}).describe('Smart export options')
  .superRefine((val, ctx) => {
    if (val.format === 'gif' && val.duration > GIF_MAX_DURATION_S) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['duration'],
        message: `GIF exports are capped at ${GIF_MAX_DURATION_S}s (got ${val.duration}s). GIF has no bitrate target, so file size scales with frames × dimensions rather than staying near a predictable ceiling. Use format "mp4" or "webm" for longer clips.`,
      });
    }
  });

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
  'particle',
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
  particleSpacing: z.number().optional().describe('Dot spacing for style="particle" (smaller = denser cloud; default ~fontSize*0.11)'),
  particleDotSize: z.number().optional().describe('Base dot radius for style="particle" (default ~particleSpacing*0.44)'),
}).describe('Create letter collage input');

export type CreateLetterCollageInput = z.infer<typeof CreateLetterCollageInputSchema>;

export const AnimateLetterCollageInputSchema = z.object({
  collageId: z.string().describe('Collage ID from create_letter_collage'),
  animationType: LetterCollageAnimationSchema.describe('Animation type to apply'),
  staggerDelay: z.number().optional().default(0.1).describe('Delay between each letter animation start (seconds)'),
  animationSpeed: z.number().optional().default(1).describe('Animation speed multiplier'),
}).describe('Animate letter collage input');

export type AnimateLetterCollageInput = z.infer<typeof AnimateLetterCollageInputSchema>;

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
// GLOBE + WORLD TOUR SCHEMAS
// =============================================================================

export const GlobeEnableInputSchema = z.object({
  rotation: z.tuple([z.number(), z.number(), z.number()]).optional().describe('Initial rotation angles [lambda, phi, gamma]'),
  momentum: z.boolean().optional().describe('Enable momentum/inertia on drag-spin'),
  showOcean: z.boolean().optional().describe('Render the ocean sphere backdrop'),
}).describe('Enable globe (orthographic) mode input');

export type GlobeEnableInput = z.infer<typeof GlobeEnableInputSchema>;

export const GlobeRotateToInputSchema = z.object({
  lon: z.number().describe('Target longitude to rotate to face the viewer'),
  lat: z.number().describe('Target latitude to rotate to face the viewer'),
  duration: z.number().optional().describe('Animation duration in seconds (versor slerp)'),
}).describe('Rotate globe to coordinate input');

export type GlobeRotateToInput = z.infer<typeof GlobeRotateToInputSchema>;

export const GlobeSpinInputSchema = z.object({
  speed: z.number().optional().describe('Rotation speed (degrees per second)'),
  axis: z.enum(['longitude', 'latitude']).optional().describe('Axis to spin around'),
  duration: z.number().optional().describe('Spin duration in seconds (omit for continuous)'),
}).describe('Continuous globe spin input');

export type GlobeSpinInput = z.infer<typeof GlobeSpinInputSchema>;

export const WorldTourInputSchema = z.object({
  regions: z.array(z.string()).optional().describe('Region IDs to visit in order'),
  coords: z.array(z.tuple([z.number(), z.number()])).optional().describe('Coordinate stops [lon, lat][] to visit in order'),
  dwell: z.number().optional().describe('Seconds to dwell at each stop'),
  travel: z.number().optional().describe('Seconds to travel between stops'),
  tilt: z.number().optional().describe('Camera tilt applied at each stop'),
  loop: z.boolean().optional().describe('Loop the tour continuously'),
  easing: z.string().optional().describe('Easing curve for the swing between stops'),
  highlightColors: z.array(z.string()).optional().describe('Highlight colors cycled per stop'),
  showLabels: z.boolean().optional().describe('Show a label at each stop'),
  labelColor: z.string().optional().describe('Label text color'),
}).describe('World tour input (requires regions or coords)');

export type WorldTourInput = z.infer<typeof WorldTourInputSchema>;

export const StopWorldTourInputSchema = z.object({
  id: z.string().optional().describe('Tour id to stop (omit to stop all tours)'),
}).describe('Stop world tour input');

export type StopWorldTourInput = z.infer<typeof StopWorldTourInputSchema>;

export const PinToGlobeInputSchema = z.object({
  itemId: z.string().describe('ID of the canvas item to pin to the globe surface'),
  lon: z.number().describe('Longitude to pin the item at'),
  lat: z.number().describe('Latitude to pin the item at'),
  hideOnFarSide: z.boolean().optional().describe('Hide the item when its coordinate rotates to the far side'),
}).describe('Pin item to globe input');

export type PinToGlobeInput = z.infer<typeof PinToGlobeInputSchema>;

export const TourItemInputSchema = z.object({
  itemId: z.string().describe('ID of the canvas item to move along the tour'),
  regions: z.array(z.string()).optional().describe('Region IDs to tour the item across'),
  coords: z.array(z.tuple([z.number(), z.number()])).optional().describe('Coordinate stops [lon, lat][] to move the item along'),
  dwell: z.number().optional().describe('Seconds to dwell at each stop'),
  travel: z.number().optional().describe('Seconds to travel between stops'),
  loop: z.boolean().optional().describe('Loop the item tour continuously'),
  orient: z.boolean().optional().describe('Orient the item along its direction of travel'),
}).describe('Tour item along coords/regions input (requires regions or coords)');

export type TourItemInput = z.infer<typeof TourItemInputSchema>;

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

// =============================================================================
// ONTOLOGY SCHEMAS
// =============================================================================

export const AnalyzeDesignInputSchema = z.object({
  definition: z.object({}).passthrough().describe('A template or scene definition object (same shape as batch_execute operations or template definitions with id, name, category, data: {items, relations})'),
}).describe('Analyze design input');

export type AnalyzeDesignInput = z.infer<typeof AnalyzeDesignInputSchema>;

export const ValidateDesignInputSchema = z.object({
  definition: z.object({}).passthrough().describe('A template or scene definition object to validate and score'),
}).describe('Validate design input');

export type ValidateDesignInput = z.infer<typeof ValidateDesignInputSchema>;

// Semantic scene/op validator (OntologyValidator in FxTool) — distinct from
// ValidateDesign (which scores a template definition server-side). Runs in the
// browser against the live scene and returns structured diagnostics.
export const ValidateInputSchema = z.object({
  mode: z.enum(['scene', 'op']).default('scene')
    .describe("'scene' audits the whole live canvas; 'op' validates a proposed mutation before applying it"),
  op: z.object({
    kind: z.enum(['addRelation', 'create', 'modify']).describe('The kind of mutation being validated'),
    from: z.string().optional().describe('Source item id (addRelation)'),
    to: z.string().optional().describe('Target item id (addRelation)'),
    relation: z.string().optional().describe('Relation type (addRelation)'),
    params: z.record(z.unknown()).optional().describe('Relation params (addRelation)'),
    type: z.string().optional().describe('Item type (create)'),
    id: z.string().optional().describe('Item id (modify)'),
    changes: z.record(z.unknown()).optional().describe('Property changes (modify)'),
  }).optional().describe("Required when mode='op': the proposed mutation to validate"),
}).describe('Semantic validation input');

export type ValidateInput = z.infer<typeof ValidateInputSchema>;

export const QueryOntologyInputSchema = z.object({
  query: z.enum([
    'list_types', 'list_edges', 'list_generators', 'list_effects',
    'list_patterns', 'list_math_functions',
    'type_hierarchy', 'type_children', 'type_properties', 'animatable_properties',
    'is_subtype', 'edge_info', 'node_type', 'edge_type',
  ]),
  ppType: z.string().optional(),
  itemType: z.string().optional(),
  relationName: z.string().optional(),
  typeA: z.string().optional(),
  typeB: z.string().optional(),
  category: z.string().optional(),
  includeAbstract: z.boolean().optional().default(false),
});

export type QueryOntologyInput = z.infer<typeof QueryOntologyInputSchema>;

// =============================================================================
// SCENE MANAGEMENT SCHEMAS
// =============================================================================

export const ManageScenesInputSchema = z.object({
  action: z.enum(['save', 'load', 'list', 'delete', 'rename', 'duplicate', 'reorder', 'info', 'export', 'import']),
  name: z.string().optional(),
  sceneId: z.string().optional(),
  transition: z.enum(['none', 'fade', 'zoom-in', 'zoom-out']).optional(),
  sceneIds: z.array(z.string()).optional(),
  scenesJson: z.string().optional(),
  merge: z.boolean().optional(),
});

export type ManageScenesInput = z.infer<typeof ManageScenesInputSchema>;

export const ScenePlaybackInputSchema = z.object({
  action: z.enum(['create_chain', 'play', 'pause', 'resume', 'stop', 'toggle_loop', 'jump']),
  sceneIds: z.array(z.string()).optional(),
  loop: z.boolean().optional(),
  autoPlay: z.boolean().optional(),
  defaultDuration: z.number().optional(),
  defaultTransition: z.enum(['none', 'fade', 'zoom-in', 'zoom-out']).optional(),
  transitionDuration: z.number().optional(),
  enabled: z.boolean().optional(),
  index: z.number().optional(),
});

export type ScenePlaybackInput = z.infer<typeof ScenePlaybackInputSchema>;

// =============================================================================
// SELECTION, TRANSFORM & HISTORY TOOLS
// =============================================================================

export const SelectionInputSchema = z.object({
  action: z.enum(['select', 'select_all', 'deselect_all', 'get', 'delete_selected']),
  itemIds: z.array(z.string()).optional(),
  mode: z.enum(['replace', 'add', 'remove']).optional(),
});
export type SelectionInput = z.infer<typeof SelectionInputSchema>;

export const TransformInputSchema = z.object({
  // 'fit' scales + centres an item to the EXPORT FRAME. It lives here rather
  // than on pinepaper_media because it is a transform and applies to any item —
  // but video is the case that forced it: an uploaded clip landed at native
  // size, so a 640x360 source filled one ninth of a 1920x1080 canvas and there
  // was no agent-reachable way to size it.
  action: z.enum(['nudge', 'flip', 'reorder', 'fit']),
  itemId: z.string().optional(),
  dx: z.number().optional(),
  dy: z.number().optional(),
  direction: z.enum(['horizontal', 'vertical']).optional(),
  order: z.enum(['bringToFront', 'sendToBack', 'moveUp', 'moveDown']).optional(),
  /** 'contain' (default) fits inside the frame; 'cover' fills it, cropping overflow. */
  mode: z.enum(['contain', 'cover']).optional(),
});
export type TransformInput = z.infer<typeof TransformInputSchema>;

// ─── 1.6.4: agent surface for the Tier-2 engine features ────────────────────
//
// Eleven modules landed in js/core/ with PinePaper facades and NO way for an
// agent to reach any of them. These are grouped by subject with an `action`
// discriminator rather than split into ~30 verb-per-tool entries: the tool
// count is already the thing the consolidation backlog complains about, and
// `pinepaper_media` / `pinepaper_transform` set the precedent.

export const BrandKitInputSchema = z.object({
  /** 'plan' reports what WOULD change without touching the scene. */
  action: z.enum(['plan', 'apply']),
  // Spelled out rather than a loose record. A first version typed this as
  // `z.record(...)` described as a "role → colour map", which is NOT the shape
  // the engine takes — every call was rejected with "name is required;
  // colors.primary is required". A permissive schema over a strict engine just
  // moves the failure to runtime and teaches the model the wrong shape.
  kit: z.object({
    name: z.string(),
    colors: z.object({
      primary: z.string(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
    }),
    // Missing roles are FILLED from what is present, not rejected — only
    // `name` and `colors.primary` are genuinely required.
    fonts: z.object({
      heading: z.string().optional(),
      body: z.string().optional(),
    }).optional(),
  }),
  selectionOnly: z.boolean().optional(),
});
export type BrandKitInput = z.infer<typeof BrandKitInputSchema>;

export const ComponentInputSchema = z.object({
  action: z.enum(['define', 'list', 'instantiate', 'set_override', 'sync', 'update_from_instance', 'detach']),
  itemIds: z.array(z.string()).optional(),
  componentId: z.string().optional(),
  instanceId: z.string().optional(),
  name: z.string().optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  /** Per-part override: which part of the component, which property, what value. */
  componentKey: z.string().optional(),
  prop: z.string().optional(),
  value: z.unknown().optional(),
  overrides: z.record(z.string(), z.unknown()).optional(),
});
export type ComponentInput = z.infer<typeof ComponentInputSchema>;

export const ArtboardInputSchema = z.object({
  action: z.enum(['list_presets', 'set', 'set_constraints']),
  preset: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  itemId: z.string().optional(),
  horizontal: z.string().optional(),
  vertical: z.string().optional(),
});
export type ArtboardInput = z.infer<typeof ArtboardInputSchema>;

export const CommentInputSchema = z.object({
  action: z.enum(['add', 'list', 'resolve', 'delete']),
  id: z.string().optional(),
  text: z.string().optional(),
  author: z.string().optional(),
  /** Anchor: an item, a point, a moment — at least one is required by the engine. */
  itemId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  time: z.number().optional(),
  resolved: z.boolean().optional(),
  includeResolved: z.boolean().optional(),
});
export type CommentInput = z.infer<typeof CommentInputSchema>;

export const ProvenanceInputSchema = z.object({
  action: z.enum(['get', 'lineage', 'dependents', 'record']),
  itemId: z.string(),
  kind: z.string().optional(),
  sourceRef: z.string().optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
export type ProvenanceInput = z.infer<typeof ProvenanceInputSchema>;

export const SceneDiffInputSchema = z.object({
  /** 'history' compares two undo states; 'version' compares live vs a saved version. */
  action: z.enum(['history', 'version']),
  indexA: z.number().optional(),
  indexB: z.number().optional(),
  versionId: z.string().optional(),
});
export type SceneDiffInput = z.infer<typeof SceneDiffInputSchema>;

export const ComposeInputSchema = z.object({
  action: z.enum(['list_patterns', 'list_treatments', 'list_reveals', 'list_styles', 'apply', 'set_treatment']),
  /** Pattern key from list_patterns. Each declares the slot count it accepts. */
  pattern: z.string().optional(),
  /** Items IN SLOT ORDER — the order is the composition, not a detail. */
  itemIds: z.array(z.string()).optional(),
  treatment: z.string().optional(),
  /** Composition root, returned by apply. Required for set_treatment. */
  rootId: z.string().optional(),
  /** Skip compiling the camera track; arrange only. */
  applyCamera: z.boolean().optional(),
  loop: z.boolean().optional(),
  /** Override individual craft ratios (gutter, margin, …). Fractions of the short canvas edge. */
  craft: z.record(z.string(), z.number()).optional(),
  /** Temporal reveal key from list_reveals — items arriving over time is what makes it a clip. */
  reveal: z.string().nullable().optional(),
  /** Reveal tuning: { duration, beat, fade, beats: number[] } — explicit beats sync cuts to audio. */
  revealOptions: z.record(z.string(), z.unknown()).optional(),
  /** Visual style bundle from list_styles (treatments + spacing + motion defaults). */
  style: z.string().optional(),
  /** Content for the pattern's own TEXT slots (headline, caption…), in slot order. */
  text: z.array(z.string()).optional(),
  /** SVG markup for the pattern's VECTOR slots (badge, logo mark), in slot order. */
  assets: z.array(z.string()).optional(),
  /** Audio source to beat-sync the reveal to; onsets are detected and recorded on the graph. */
  audio: z.string().optional(),
  /** With audio: snap to an even tempo grid instead of raw onsets. */
  grid: z.boolean().optional(),
});
export type ComposeInput = z.infer<typeof ComposeInputSchema>;

export const AudioBeatsInputSchema = z.object({
  action: z.enum(['analyze', 'animate_to_beat']),
  /** Asset id, data URL or URL. Required for analyze; optional if beats are supplied. */
  source: z.string().optional(),
  itemId: z.string().optional(),
  beats: z.array(z.number()).optional(),
  /** Even pulse from the detected tempo instead of the raw onsets. */
  grid: z.boolean().optional(),
  property: z.string().optional(),
  base: z.number().optional(),
  accent: z.number().optional(),
  decay: z.number().optional(),
  sensitivity: z.number().optional(),
  minGap: z.number().optional(),
});
export type AudioBeatsInput = z.infer<typeof AudioBeatsInputSchema>;

export const TemplateParamsInputSchema = z.object({
  action: z.enum(['get', 'apply']),
  templateId: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});
export type TemplateParamsInput = z.infer<typeof TemplateParamsInputSchema>;

export const HistoryInputSchema = z.object({
  action: z.enum(['undo', 'redo', 'get_state']),
});
export type HistoryInput = z.infer<typeof HistoryInputSchema>;

// =============================================================================
// IMAGE PROCESSING TOOLS
// =============================================================================

export const ImageFilterInputSchema = z.object({
  action: z.enum(['apply', 'chain', 'analyze_palette', 'recolor_palette']),
  itemId: z.string(),
  filterName: z.string().optional(),
  params: z.record(z.unknown()).optional(),
  filters: z.array(z.object({
    name: z.string(),
    params: z.record(z.unknown()).optional(),
  })).optional(),
  // analyze_palette / recolor_palette (GPU path)
  maxSwatches: z.number().int().positive().max(32).optional().describe('analyze_palette: swatch count cap (default 8).'),
  mapping: z.union([
    z.array(z.object({ from: z.string(), to: z.string() })),
    z.record(z.string(), z.string()),
  ]).optional().describe("recolor_palette: {from,to}[] or {'#old':'#new'} — colours swap, shading survives."),
  amount: z.number().min(0).max(1).optional().describe('recolor_palette: blend 0–1.'),
  preserveShading: z.number().min(0).max(1).optional().describe('recolor_palette: how much of the original luminance detail survives (default 1).'),
});
export type ImageFilterInput = z.infer<typeof ImageFilterInputSchema>;

export const LassoInputSchema = z.object({
  action: z.enum(['activate', 'apply']),
  itemId: z.string().optional(),
});
export type LassoInput = z.infer<typeof LassoInputSchema>;

export const CutoutStyleInputSchema = z.object({
  action: z.enum(['apply', 'list']),
  itemId: z.string().optional(),
  preset: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});
export type CutoutStyleInput = z.infer<typeof CutoutStyleInputSchema>;

// =============================================================================
// COMPOSITION & VIEW TOOLS
// =============================================================================

export const PrecompInputSchema = z.object({
  action: z.enum(['create', 'add', 'remove']),
  itemIds: z.array(z.string()).optional(),
  name: z.string().optional(),
  loop: z.boolean().optional(),
  duration: z.number().optional(),
  precompId: z.string().optional(),
  itemId: z.string().optional(),
});
export type PrecompInput = z.infer<typeof PrecompInputSchema>;

export const BackgroundInputSchema = z.object({
  action: z.enum(['set', 'clear', 'get']),
  mode: z.enum(['color', 'pattern', 'generator']).optional(),
  color: z.string().optional(),
  pattern: z.string().optional(),
  generator: z.string().optional(),
  generatorParams: z.record(z.unknown()).optional(),
});
export type BackgroundInput = z.infer<typeof BackgroundInputSchema>;

// =============================================================================
// CANVAS QUERY TOOLS
// =============================================================================

export const QueryInputSchema = z.object({
  action: z.enum(['get_by_id', 'hit_test', 'is_empty']),
  itemId: z.string().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  all: z.boolean().optional(),
  tolerance: z.number().optional(),
});
export type QueryInput = z.infer<typeof QueryInputSchema>;

// =============================================================================
// DEFORMATION TOOLS
// =============================================================================

export const DeformInputSchema = z.object({
  action: z.enum(['apply', 'trigger', 'remove']),
  itemId: z.string().optional(),
  preset: z.enum([
    'fold', 'squeeze', 'squash', 'pinch', 'bulge', 'twist',
    'ripple', 'wave', 'breathe', 'melt', 'shear', 'inflate', 'wobble',
  ]).optional(),
  frequency: z.number().optional(),
  amplitude: z.number().min(0).max(1).optional(),
  phase: z.enum(['sin', 'blink', 'linear', 'pingpong', 'once', 'elastic', 'heartbeat', 'stepped']).optional(),
  loop: z.boolean().optional(),
  axis: z.enum(['horizontal', 'vertical']).optional(),
  turns: z.number().optional(),
  waves: z.number().optional(),
  maxDisplacement: z.number().optional(),
  speed: z.number().optional(),
  steps: z.number().optional(),
});
export type DeformInput = z.infer<typeof DeformInputSchema>;

// =============================================================================
// SPRITE SHEET TOOLS
// =============================================================================

export const SpriteSheetInputSchema = z.object({
  action: z.enum(['generate', 'play', 'export']),
  skeletonId: z.string().optional(),
  spriteSheetId: z.string().optional(),
  name: z.string().optional(),
  poses: z.array(z.object({ name: z.string(), poseId: z.string() })).optional(),
  transition: z.object({
    poseIdA: z.string(),
    poseIdB: z.string(),
    frameCount: z.number(),
    name: z.string().optional(),
  }).optional(),
  bakedAnimation: z.object({
    duration: z.number(),
    fps: z.number().optional(),
    name: z.string().optional(),
  }).optional(),
  animations: z.record(z.object({
    frames: z.array(z.string()),
    fps: z.number().optional(),
    loop: z.boolean().optional(),
  })).optional(),
  padding: z.number().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  animation: z.string().optional(),
  fps: z.number().optional(),
  scale: z.number().optional(),
  format: z.enum(['png', 'webp']).optional(),
});
export type SpriteSheetInput = z.infer<typeof SpriteSheetInputSchema>;

// =============================================================================
// INTERACTION TOOLS
// =============================================================================

export const InteractionInputSchema = z.object({
  action: z.enum(['add_behavior', 'remove_behavior', 'trigger_action', 'get_state']),
  itemId: z.string().optional(),
  behaviorType: z.enum([
    'repel', 'attract', 'follow', 'orbit',
    'slingshot', 'physics_body', 'draggable_constrained',
  ]).optional(),
  behaviorId: z.string().optional(),
  actionType: z.enum([
    'navigate', 'show', 'hide', 'animate', 'stopAnimation',
    'setState', 'incrementScore', 'playTimeline', 'pauseTimeline',
    'seekTimeline', 'showFeedback', 'complete',
  ]).optional(),
  params: z.record(z.unknown()).optional(),
});
export type InteractionInput = z.infer<typeof InteractionInputSchema>;

// =============================================================================
// WIDGET EXPORT TOOLS
// =============================================================================

export const ExportWidgetInputSchema = z.object({
  download: z.boolean().optional(),
  filename: z.string().optional(),
  includeInteractions: z.boolean().optional(),
  minify: z.boolean().optional(),
});
export type ExportWidgetInput = z.infer<typeof ExportWidgetInputSchema>;

export const ExportWidgetHtmlInputSchema = z.object({
  title: z.string().optional(),
  download: z.boolean().optional(),
});
export type ExportWidgetHtmlInput = z.infer<typeof ExportWidgetHtmlInputSchema>;

// =============================================================================
// DATA VISUALIZATION (CHARTS)
// =============================================================================

export const CreateChartInputSchema = z.object({
  action: z.enum(['create', 'update', 'reconfigure', 'remove']),
  chartType: z.enum(['bar', 'line', 'scatter', 'area']).optional(),
  chartId: z.string().optional(),
  data: z.array(z.record(z.unknown())).optional(),
  options: z.record(z.unknown()).optional(),
});
export type CreateChartInput = z.infer<typeof CreateChartInputSchema>;

// =============================================================================
// MAGIC SYSTEM (AUTO-ANIMATE + REMIX)
// =============================================================================

export const MagicInputSchema = z.object({
  action: z.enum(['animate', 'remix']),
  mood: z.enum(['calm', 'professional', 'energetic', 'dramatic', 'whimsical']).optional(),
  selectionOnly: z.boolean().optional(),
});
export type MagicInput = z.infer<typeof MagicInputSchema>;

// =============================================================================
// PHYSICS (RIGID BODY SIMULATION)
// =============================================================================

export const PhysicsInputSchema = z.object({
  action: z.enum(['init', 'add_body', 'remove_body', 'apply_force', 'apply_impulse', 'set_velocity', 'get_state', 'create_ground', 'create_joint']),
  itemId: z.string().optional(),
  gravity: z.object({ x: z.number(), y: z.number() }).optional(),
  bodyType: z.enum(['static', 'dynamic', 'kinematic']).optional(),
  mass: z.number().optional(),
  friction: z.number().optional(),
  restitution: z.number().optional(),
  fixedRotation: z.boolean().optional(),
  shape: z.enum(['auto', 'circle', 'rect']).optional(),
  force: z.object({ x: z.number(), y: z.number() }).optional(),
  impulse: z.object({ x: z.number(), y: z.number() }).optional(),
  velocity: z.object({ x: z.number(), y: z.number() }).optional(),
  y: z.number().optional(),
  width: z.number().optional(),
  targetItemId: z.string().optional(),
  jointType: z.enum(['revolute', 'distance', 'weld', 'prismatic']).optional(),
  jointParams: z.record(z.unknown()).optional(),
});
export type PhysicsInput = z.infer<typeof PhysicsInputSchema>;

// =============================================================================
// MEASUREMENT SYSTEM (RULERS, GRID, DIMENSIONS)
// =============================================================================

export const MeasurementInputSchema = z.object({
  action: z.enum(['set_rulers', 'set_grid', 'get_dimensions', 'set_snap']),
  enabled: z.boolean().optional(),
  itemId: z.string().optional(),
});
export type MeasurementInput = z.infer<typeof MeasurementInputSchema>;

// Geometry construction helpers (Layer 1) — pure functions exposed by FxTool's
// app.geometry (GeometryConstruction). The server computes a construction and
// optionally creates an item from the result, mirroring:
//   app.create('polygon', { points: app.geometry.regularPolygon(cx, cy, r, 5) });
export const GEOMETRY_OPERATIONS = [
  // points
  'point', 'distance', 'midpoint', 'lerpPoint', 'centroid',
  'translatePoint', 'rotatePoint', 'scalePoint',
  // polygons
  'regularPolygon', 'star', 'polygonFromVertices',
  // lines
  'lineThrough', 'lineDirection', 'lineIntersection', 'projectPointToLine',
  'perpendicular', 'parallel', 'perpendicularBisector', 'reflectPoint',
  // angles
  'angle', 'angleBisector',
  // circles
  'circle', 'pointOnCircle', 'circumcenter', 'circleThrough', 'incenter',
  'tangentPointsFromExternal',
] as const;

export const GeometryInputSchema = z.object({
  operation: z.enum(GEOMETRY_OPERATIONS).describe('Which app.geometry.* construction helper to run'),
  args: z.array(z.any()).default([]).describe(
    'Positional arguments for the operation, in order. Points are {x,y} objects (or [x,y] arrays where a vertex list is accepted); lines are {p1,p2}; circles are {center,radius}. Angles are in radians. e.g. regularPolygon → [cx, cy, radius, sides, rotation?]'
  ),
  createAs: z
    .object({
      itemType: z.string().optional().describe('Override item type for point results (default "circle").'),
      color: z.string().optional(),
      fillColor: z.string().optional(),
      strokeColor: z.string().optional(),
      strokeWidth: z.number().optional(),
      radius: z.number().optional().describe('Marker radius for point results (default 6).'),
    })
    .passthrough()
    .optional()
    .describe(
      'When provided, also create a canvas item from the result: a vertex-list result → polygon, a circle result → circle, a point result → a small marker. Extra keys pass through to app.create. Omit for compute-only.'
    ),
});
export type GeometryInput = z.infer<typeof GeometryInputSchema>;

// Construction sequences (Layer 3) — step-by-step reveal of a geometric figure,
// wrapping FxTool's app.constructionSequence. Each step hides its items and attaches
// a timeline-driven construction_reveal relation, so playback reveals the figure one
// step at a time (replayable, scrubbable, editable as relation graph data).
export const ConstructionSequenceInputSchema = z.object({
  action: z.enum(['build', 'play', 'clear', 'list']).describe('build a sequence, play it on the timeline, clear (restore items), or list sequences'),
  steps: z
    .array(
      z.union([
        z.array(z.string()),
        z.object({ items: z.array(z.string()), label: z.string().optional() }),
      ])
    )
    .optional()
    .describe('For build: ordered steps; each step is an array of item ids (or {items, label}) revealed together. Step i reveals at i * stepDuration seconds.'),
  stepDuration: z.number().positive().optional().describe('For build: seconds between steps (default 1).'),
  fadeIn: z.number().min(0).optional().describe('For build: per-step fade-in duration in seconds (default 0.3).'),
  sequenceId: z.string().optional().describe('For play/clear: the cseq_ id returned by build. Defaults to the most recently built sequence.'),
  loop: z.boolean().optional().describe('For play: loop the timeline (default false).'),
  duration: z.number().positive().optional().describe('For play: override total play duration in seconds (default = sequence total).'),
});
export type ConstructionSequenceInput = z.infer<typeof ConstructionSequenceInputSchema>;

// Live-scene semantic validation (OntologyValidator / S2) — structured diagnostics
// over the actual canvas (dangling refs, unknown types/props, keyframe issues, cycles).
export const ValidateSceneInputSchema = z.object({
  ops: z
    .array(z.record(z.string(), z.any()))
    .optional()
    .describe('Optional: validate a batch of PROPOSED ops ({ kind: "addRelation"|"create"|"modify"|"delete", ... }) against the live scene before applying them, instead of auditing the current scene. Ids created earlier in the batch count as existing for later ops.'),
});
export type ValidateSceneInput = z.infer<typeof ValidateSceneInputSchema>;

// Deterministic headless frame capture (S3) — evaluate the scene at each time via
// sceneAt(t) with Math.random seeded once around the whole sequence, then snapshot.
export const CaptureFramesInputSchema = z.object({
  times: z.array(z.number()).min(1).describe('Capture times in seconds, rendered in order.'),
  seed: z.number().optional().describe('Seed Math.random once around the whole sequence so random generators/particles are reproducible (default 0).'),
  includeDataUrls: z.boolean().optional().describe('Include each frame as a PNG data URL (large — token-heavy). Default false → returns a cheap per-frame hash + byte size only.'),
});
export type CaptureFramesInput = z.infer<typeof CaptureFramesInputSchema>;

// Ontology→scene compiler (S12-E3). Compiles a pp:-namespaced JSON-LD design graph
// (typed nodes + structural edges like pp:onTopOf) into a real scene. Compilation
// runs server-side (deterministic, testable); only the resulting create/addRelation
// ops are emitted. Only ROOT nodes get coordinates — the rest are placed at runtime
// by their structural relations.
export const InstantiateOntologyInputSchema = z.object({
  doc: z.record(z.string(), z.unknown()).describe('The design graph: pp:nodes / pp:edges (DesignGraph.toJsonLd shape), or { nodes, edges }, or nodes carrying inline pp: relation properties.'),
  canvas: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }).optional().describe('Canvas size used to tile component roots (default 1080×1080).'),
  defaultGeometry: z.record(z.string(), z.object({
    width: z.number(),
    height: z.number(),
  })).optional().describe('Per-type default { width, height } overrides (e.g. { text: { width: 300, height: 60 } }).'),
});
export type InstantiateOntologyInput = z.infer<typeof InstantiateOntologyInputSchema>;

// Relational-density lint of the LIVE scene (S12-E2). Reports how much of the scene
// participates in the relation graph and suggests structural relations for unrelated
// items already sitting in a structural configuration. Advisory (nothing applied).
export const LintSceneInputSchema = z.object({
  eps: z.number().positive().optional().describe('Bounds-match tolerance in px for structural-configuration detection (default 4).'),
  cap: z.number().int().positive().optional().describe('Max number of suggestions to return, ranked by confidence (default 20).'),
});
export type LintSceneInput = z.infer<typeof LintSceneInputSchema>;

// Media (video/audio) via window.PinePaperAgent. Agent-facing surface is URL-based
// (the agent can't hand over a File). Uploaded media are first-class canvas items.
export const MediaInputSchema = z.object({
  action: z.enum(['upload_video', 'upload_audio', 'list', 'remove', 'set_playback_rate', 'set_clip', 'set_time_remap', 'speed_ramp', 'match_cut', 'apply_track_matte', 'stop_live_matte'])
    .describe("'upload_video' / 'upload_audio' (from a URL) · 'list' media · 'remove' by id · 'set_playback_rate' · 'set_clip' (re-trim) · 'set_time_remap' (canvas-time→source-time curve: ramps, freezes, reverse) · 'speed_ramp' ({duration, speed} segments — the human way to say a remap) · 'match_cut' (cut between two shots aligning the SUBJECT via on-device detection) · 'apply_track_matte' (an item's alpha driven by another item's luma/alpha — type-filled-with-footage; live:true keeps it tracking as the matte animates) · 'stop_live_matte'"),
  url: z.string().url().optional().describe('Media URL — required for upload_video / upload_audio (fetched then imported).'),
  id: z.string().optional().describe('Media id — required for remove / set_playback_rate / set_clip.'),
  rate: z.number().min(0.25).max(4).optional().describe('Playback rate 0.25–4 — required for set_playback_rate.'),
  inPoint: z.number().min(0).optional().describe('Clip in-point in media-time seconds — required for set_clip.'),
  outPoint: z.number().min(0).optional().describe('Clip out-point in media-time seconds — required for set_clip.'),
  // upload_video placement
  position: PositionSchema.optional().describe('Canvas position — upload_video.'),
  scale: z.number().positive().optional().describe('Scale factor — upload_video.'),
  timeOffset: z.number().optional().describe('Start offset on the timeline in seconds — upload_video / upload_audio.'),
  clipInPoint: z.number().optional().describe('Trim in-point in seconds — upload_video.'),
  clipOutPoint: z.number().optional().describe('Trim out-point in seconds — upload_video.'),
  // upload_audio
  volume: z.number().min(0).max(1).optional().describe('Volume 0–1 (default 1) — upload_audio.'),
  loop: z.boolean().optional().describe('Loop playback (default true) — upload_audio.'),
  muted: z.boolean().optional().describe('Start muted (default false) — upload_audio.'),
  // set_time_remap / speed_ramp — canvas seconds → SOURCE seconds
  remapTrack: z.array(z.object({
    time: z.number().describe('Canvas time, seconds'),
    value: z.number().describe('Source time, seconds'),
    easing: z.string().optional(),
  })).nullable().optional().describe('set_time_remap: the remap curve (≥2 points). Pass null to clear the remap and restore 1:1 playback.'),
  segments: z.array(z.object({
    duration: z.number().positive().describe('Segment length in canvas seconds'),
    speed: z.number().describe('Playback speed for the segment (0 = freeze frame, negative = reverse)'),
  })).optional().describe('speed_ramp: consecutive {duration, speed} segments, compiled into a remap curve.'),
  // match_cut
  fromItemId: z.string().optional().describe('match_cut: the outgoing shot (item id).'),
  toItemId: z.string().optional().describe('match_cut: the incoming shot (item id).'),
  subject: z.enum(['detect', 'bounds']).optional().describe("match_cut: how to find the subject — 'detect' (on-device DETR) or 'bounds' (item bounds). Default detect."),
  label: z.string().optional().describe('match_cut: narrow detection to a class ("person") when the biggest object is not the subject.'),
  at: z.number().optional().describe('match_cut: cut time in seconds (default 0).'),
  settle: z.number().optional().describe('match_cut: seconds to relax to natural framing (default 0.8).'),
  fade: z.number().optional().describe('match_cut: crossfade seconds; 0 for a hard cut (default 0.12).'),
  consent: z.boolean().optional().describe('match_cut: proceed with the detection model download. Without it, a first run returns {needsConsent} instead of downloading silently.'),
  // apply_track_matte / stop_live_matte
  matteItemId: z.string().optional().describe('apply_track_matte: the item whose pixels drive the alpha (text, gradient, any raster/vector).'),
  channel: z.enum(['luma', 'alpha', 'red']).optional().describe('apply_track_matte: which channel of the matte drives alpha (default luma).'),
  invert: z.boolean().optional().describe('apply_track_matte: invert the matte.'),
  strength: z.number().min(0).max(1).optional().describe('apply_track_matte: matte strength 0–1.'),
  hideMatte: z.boolean().optional().describe('apply_track_matte: hide the matte item after applying (default true behavior follows the facade).'),
  live: z.boolean().optional().describe('apply_track_matte: keep re-cutting as the matte moves/animates — the kinetic-mask-reveal mode. Without it the matte bakes once, destructively.'),
})
  .refine((v) => !(v.action === 'upload_video' || v.action === 'upload_audio') || !!v.url, { message: 'upload requires url', path: ['url'] })
  .refine((v) => !(v.action === 'remove' || v.action === 'set_playback_rate' || v.action === 'set_clip') || !!v.id, { message: 'this action requires id', path: ['id'] })
  .refine((v) => v.action !== 'set_playback_rate' || v.rate !== undefined, { message: 'set_playback_rate requires rate', path: ['rate'] })
  .refine((v) => v.action !== 'set_time_remap' || v.id !== undefined, { message: 'set_time_remap requires id (the video item / media id)', path: ['id'] })
  .refine((v) => v.action !== 'set_time_remap' || v.remapTrack !== undefined, { message: 'set_time_remap requires remapTrack (or null to clear)', path: ['remapTrack'] })
  .refine((v) => v.action !== 'speed_ramp' || (!!v.id && !!v.segments && v.segments.length > 0), { message: 'speed_ramp requires id and segments', path: ['segments'] })
  .refine((v) => v.action !== 'match_cut' || (!!v.fromItemId && !!v.toItemId), { message: 'match_cut requires fromItemId and toItemId', path: ['fromItemId'] })
  .refine((v) => v.action !== 'apply_track_matte' || (!!v.id && !!v.matteItemId), { message: 'apply_track_matte requires id (the matted item) and matteItemId', path: ['matteItemId'] })
  .refine((v) => v.action !== 'stop_live_matte' || !!v.id, { message: 'stop_live_matte requires id', path: ['id'] })
  .refine((v) => v.action !== 'set_clip' || (v.inPoint !== undefined && v.outPoint !== undefined && v.outPoint > v.inPoint), { message: 'set_clip requires inPoint and outPoint with outPoint > inPoint', path: ['outPoint'] });
export type MediaInput = z.infer<typeof MediaInputSchema>;

/**
 * pinepaper_text_style — display text styles + variable-font axes.
 *
 * A display style renders a text item as a STACKED-LAYER title group (offset
 * copies, outlines, fills) that a fill+stroke+shadow cannot make; the group
 * ADOPTS the text's registry id so relations/keyframes keep pointing at it.
 * Font axes are the standard variable-font trio only (weight/width/slant) —
 * Canvas 2D has no font-variation-settings, so custom foundry axes are a
 * platform impossibility, not an omission.
 */
export const TextStyleInputSchema = z.object({
  action: z.enum(['apply_style', 'set_font_axes', 'list_styles'])
    .describe("'apply_style' (stacked-layer display style) · 'set_font_axes' (variable-font weight/width/slant) · 'list_styles' (styles + palettes + axes, for pickers)"),
  itemId: z.string().optional().describe('Text item id — apply_style / set_font_axes.'),
  styleKey: z.string().optional().describe("apply_style: style name from list_styles (e.g. 'stacked', 'arcade' — the pixel/arcade styles suggest their own face)."),
  palette: z.union([z.string(), z.array(z.string())]).optional().describe('apply_style: a named colourway or an explicit color array.'),
  variant: z.number().optional().describe('apply_style: variation index within the style.'),
  content: z.string().optional().describe('apply_style: replace the text content while styling.'),
  fontFamily: z.string().optional().describe("apply_style: font override. 'suggested' opts into the face the style was designed around (arcade wants a pixel face) — never automatic."),
  fontSize: z.number().positive().optional().describe('apply_style: font size (defaults to the item\'s).'),
  axes: z.object({
    weight: z.number().optional().describe('wght 1–1000'),
    width: z.union([z.number(), z.string()]).optional().describe('wdth % or a keyword'),
    slant: z.number().optional().describe('slnt degrees'),
  }).optional().describe('set_font_axes: standard axes only. All three are animatable properties (addKeyframe with fontWeight interpolates).'),
})
  .refine((v) => v.action !== 'apply_style' || (!!v.itemId && !!v.styleKey), { message: 'apply_style requires itemId and styleKey', path: ['styleKey'] })
  .refine((v) => v.action !== 'set_font_axes' || (!!v.itemId && !!v.axes && Object.keys(v.axes).length > 0), { message: 'set_font_axes requires itemId and at least one axis', path: ['axes'] });
export type TextStyleInput = z.infer<typeof TextStyleInputSchema>;

/**
 * pinepaper_shatter_image — split a raster into a grid of per-tile rasters.
 * Deliberately INERT on its own: the pieces sit exactly where the picture was
 * until something animates them (blast relations, per-tile keyframes, physics).
 */
export const ShatterImageInputSchema = z.object({
  itemId: z.string().describe('The raster to shatter (or a group containing one).'),
  pieces: z.number().int().positive().max(2500).optional().describe('Approximate piece count (default 100); the grid solves for square-ish tiles at the source aspect, so 100 of a 3:2 photo lands as 12×8.'),
  rows: z.number().int().positive().max(50).optional().describe('Exact grid rows — overrides pieces.'),
  cols: z.number().int().positive().max(50).optional().describe('Exact grid cols — overrides pieces.'),
  keepSource: z.boolean().optional().describe('Leave the original in place, hidden, so the pieces can be dropped and the photo restored.'),
});
export type ShatterImageInput = z.infer<typeof ShatterImageInputSchema>;

/**
 * pinepaper_import_layered_character — land a decomposed character illustration
 * (See-through / PSD-style layer dump) as one Group of role-bound parts.
 *
 * The decomposition model does NOT run here (GPU, minutes/image) — the caller
 * runs it wherever it fits and imports the output. Roles are the exact tokens
 * the `expresses` presets read, so blink/smile work with zero further wiring.
 */
export const ImportLayeredCharacterInputSchema = z.object({
  info: z.record(z.string(), z.unknown()).describe('The decomposer manifest (See-through meta.json contents): layer tags, xyxy rects, depth_median, frame_size [h, w].'),
  images: z.record(z.string(), z.string()).describe('Layer tag → image source. PNG data URLs are the reliable path; https URLs work when CORS allows. ~20 layers of base64 is a large call — URLs when you can.'),
  position: PositionSchema.optional().describe('Where to place the character (default canvas center).'),
  scale: z.number().positive().optional().describe('Uniform scale applied after the shared frame→canvas fit.'),
  name: z.string().optional().describe('Group name.'),
})
  .refine((v) => Object.keys(v.images).length > 0, { message: 'images must contain at least one layer', path: ['images'] });
export type ImportLayeredCharacterInput = z.infer<typeof ImportLayeredCharacterInputSchema>;

/**
 * pinepaper_game — the game-logic primitives (A* pathfinding, tilemaps) as
 * PURE COMPUTATION over the canvas: paths feed moves_along_path, collision
 * rects feed the physics world, the map JSON persists in the project document.
 *
 * Multiplayer (EventSync) is deliberately absent: it is a client-runtime
 * protocol between live peers, not a canvas operation — an MCP call has no
 * peer to synchronize with.
 */
export const GameInputSchema = z.object({
  action: z.enum(['pathfind', 'create_tilemap'])
    .describe("'pathfind' (A* over a grid/obstacles → [{x,y}] waypoints for moves_along_path) · 'create_tilemap' (board data + pathfinding grid + merged collision rects)"),
  // pathfind
  grid: z.object({
    cols: z.number().int().positive(),
    rows: z.number().int().positive(),
    cellSize: z.number().positive().optional().describe('World units per cell (default 1).'),
    origin: PositionSchema.optional().describe('World position of cell (0,0).'),
    blocked: z.array(z.number()).optional().describe('Flat cols×rows array, 1 = blocked.'),
    obstacles: z.array(z.object({ x: z.number(), y: z.number(), width: z.number(), height: z.number() }))
      .optional().describe('World-space rects to block — pass item bounds and the walls block the board.'),
  }).optional().describe('pathfind: the board.'),
  start: PositionSchema.optional().describe('pathfind: start, WORLD coordinates.'),
  goal: PositionSchema.optional().describe('pathfind: goal, WORLD coordinates.'),
  diagonal: z.boolean().optional().describe('pathfind: 8-way movement (default true). Never cuts corners.'),
  // create_tilemap
  cols: z.number().int().positive().max(500).optional().describe('create_tilemap: board width in tiles.'),
  rows: z.number().int().positive().max(500).optional().describe('create_tilemap: board height in tiles.'),
  tileSize: z.number().positive().optional().describe('create_tilemap: world units per tile (default 32).'),
  origin: PositionSchema.optional().describe('create_tilemap: world position of tile (0,0).'),
  tileset: z.array(z.object({
    id: z.number().int().positive().describe('1-based; 0 is empty'),
    name: z.string().optional(),
    solid: z.boolean().optional().describe('Blocks movement — feeds the grid and collision rects.'),
    fill: z.string().optional().describe('Solid color for simple rendering.'),
  })).optional().describe('create_tilemap: tile definitions.'),
  fills: z.array(z.object({
    x0: z.number().int(), y0: z.number().int(), x1: z.number().int(), y1: z.number().int(),
    tileId: z.number().int(),
  })).optional().describe('create_tilemap: tile-space rects painted in order — walls, floors, platforms.'),
})
  .refine((v) => v.action !== 'pathfind' || (!!v.grid && !!v.start && !!v.goal), { message: 'pathfind requires grid, start, goal', path: ['grid'] })
  .refine((v) => v.action !== 'create_tilemap' || (v.cols !== undefined && v.rows !== undefined), { message: 'create_tilemap requires cols and rows', path: ['cols'] });
export type GameInput = z.infer<typeof GameInputSchema>;

/**
 * pinepaper_world3d — the additive 3D renderer layer under the Paper canvas:
 * terrain, sky, shadows, an addressable actor stage, and a directed camera.
 * Paper.js keeps every vector item and export path; the world composites
 * underneath. `describe` returns the full parameter schema from the engine
 * itself — the tool does not restate it, so it cannot drift.
 */
export const World3DInputSchema = z.object({
  action: z.enum(['create', 'describe', 'configure', 'add_actor', 'remove_actor', 'list_actors', 'set_actor_pose', 'set_camera', 'add_object', 'remove_object', 'remove_world'])
    .describe("'create' (a preset world) · 'describe' (every parameter with type/range — CALL THIS before configure) · 'configure' (live deep-merge patch, schema-validated) · actor ops · 'set_camera' (follow|fixed|orbit) · object ops · 'remove_world'"),
  spec: z.union([z.string(), z.record(z.string(), z.unknown())]).optional().describe("create: a preset id ('forest', 'snowMountain', …) or a full world spec object."),
  character: z.union([z.boolean(), z.record(z.string(), z.unknown())]).optional().describe('create: include the walkable character (true/config).'),
  patch: z.record(z.string(), z.unknown()).optional().describe('configure: partial world spec, deep-merged and validated — a wrong key errors naming the right one.'),
  actorId: z.string().optional().describe('Actor id — add_actor (optional, generated if omitted) / remove_actor / set_actor_pose / set_camera target.'),
  x: z.number().optional().describe('World-space x — add_actor / add_object.'),
  z: z.number().optional().describe('World-space z — add_actor / add_object.'),
  height: z.number().optional().describe('add_actor / add_object: size in world units.'),
  sprite: z.string().optional().describe('add_actor: a canvas item id to use as the sprite.'),
  live: z.boolean().optional().describe('add_actor: re-rasterize the item as it animates — a rigged character PERFORMS in the world instead of standing there as a photograph of itself.'),
  pose: z.record(z.string(), z.unknown()).optional().describe('set_actor_pose: { x?, z?, angle?, … } — the setter a timeline or agent drives.'),
  camera: z.record(z.string(), z.unknown()).optional().describe("set_camera: { mode: 'follow'|'fixed'|'orbit', target?, radius?, speed?, eye?, lookAt? }."),
  object: z.record(z.string(), z.unknown()).optional().describe('add_object: { x, z, height?, color?, y? (defaults to sitting on the terrain) }.'),
  objectId: z.string().optional().describe('remove_object: the object id.'),
})
  .refine((v) => v.action !== 'configure' || !!v.patch, { message: 'configure requires patch', path: ['patch'] })
  .refine((v) => !['remove_actor', 'set_actor_pose'].includes(v.action) || !!v.actorId, { message: 'this action requires actorId', path: ['actorId'] })
  .refine((v) => v.action !== 'set_actor_pose' || !!v.pose, { message: 'set_actor_pose requires pose', path: ['pose'] })
  .refine((v) => v.action !== 'set_camera' || !!v.camera, { message: 'set_camera requires camera', path: ['camera'] })
  .refine((v) => v.action !== 'add_object' || !!v.object, { message: 'add_object requires object', path: ['object'] })
  .refine((v) => v.action !== 'remove_object' || !!v.objectId, { message: 'remove_object requires objectId', path: ['objectId'] });
export type World3DInput = z.infer<typeof World3DInputSchema>;

// =============================================================================
// ONE-SHOT IMAGE OPS (crop / chroma key — Track A agent parity, 2026-07-31)
// =============================================================================

export const CropImageInputSchema = z.object({
  itemId: z.string().describe('Registry id of the raster item (or a group containing one).'),
  rect: z.object({
    x: z.number().describe('Left edge, canvas coordinates'),
    y: z.number().describe('Top edge, canvas coordinates'),
    width: z.number().positive().describe('Crop width in canvas units'),
    height: z.number().positive().describe('Crop height in canvas units'),
  }).describe('Crop rectangle in project (canvas) coordinates — clamped into the image bounds.'),
  aspectRatio: z.enum(['free', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3']).optional()
    .describe('Optional aspect-ratio constraint applied to the rect.'),
});
export type CropImageInput = z.infer<typeof CropImageInputSchema>;

export const ChromaKeyInputSchema = z.object({
  itemId: z.string().describe('Registry id of the raster item (or a group containing one).'),
  color: z.string().optional()
    .describe("Key color: '#rrggbb' or preset name (green, chromaGreen, blue, chromaBlue, magenta). Default: pure green."),
  threshold: z.number().min(0).max(255).optional()
    .describe('Color-distance threshold for full transparency. Omit to auto-estimate from the image.'),
  smoothing: z.number().min(0).max(100).optional()
    .describe('Edge-smoothing range past the threshold. Omit to auto-estimate.'),
});
export type ChromaKeyInput = z.infer<typeof ChromaKeyInputSchema>;

// Rigging (skeletons, bones, IK, breakdown-pose keyframes) via app.riggingSystem.
// One consolidated tool: build a skeleton, then pose/animate it. The S12 breakdown-pose
// options (favor/breakdown/curve/boneOffsets/movingHold/holdDrift) ride add_pose_keyframe.
export const RiggingInputSchema = z.object({
  action: z.enum([
    'create_skeleton', 'add_bone', 'attach_item', 'create_ik_chain',
    'add_pose_keyframe', 'set_target_path', 'save_pose', 'save_shape_key',
    'import_bvh', 'retarget_bvh', 'import_spine',
  ]).describe('Rigging operation'),
  // ── Mocap / rig import (import_bvh, retarget_bvh, import_spine) ──
  // The file CONTENTS travel in the call (MCP has no filesystem): .bvh text for
  // BVH, the exported .json for Spine. import_bvh builds a NEW stick-figure rig
  // driven by the clip; retarget_bvh drives an EXISTING rig by bone name and
  // needs skeletonId. Root translation comes back as rootTrack rather than being
  // baked into poses — a walk whose root motion was dropped is a march on the spot.
  bvhText: z.string().optional().describe('For import_bvh/retarget_bvh: the .bvh file contents (CMU and Mixamo clips both work).'),
  spineJson: z.string().optional().describe('For import_spine: the Spine editor JSON export, as a string.'),
  view: z.enum(['side', 'front']).optional().describe('For import_bvh: projection plane for the 3D→2D flatten. CMU walk cycles read best from the side (default).'),
  fps: z.number().optional().describe('For import_bvh/retarget_bvh: pose sampling rate (default 15 — CMU records at 120 and nobody wants 120 poses/sec in the pose list). 0 keeps every frame.'),
  height: z.number().optional().describe('For import_bvh: skeleton height on the canvas in px (default 320).'),
  // identifiers
  skeletonId: z.string().optional().describe('Skeleton id — required for every action except create_skeleton.'),
  boneId: z.string().optional().describe('Bone id — attach_item.'),
  itemId: z.string().optional().describe('Canvas item id — attach_item.'),
  chainId: z.string().optional().describe('IK chain id — set_target_path.'),
  name: z.string().optional().describe('Name — create_skeleton / add_bone / create_ik_chain / save_pose / save_shape_key.'),
  // create_skeleton
  rootPosition: PositionSchema.optional().describe('Skeleton root position (default {x:400,y:300}) — create_skeleton.'),
  // add_bone
  parentBoneId: z.string().optional().describe('Parent bone id (omit for root) — add_bone.'),
  length: z.number().positive().optional().describe('Bone length px (default 80) — add_bone.'),
  angle: z.number().optional().describe('Bone rest angle in degrees — add_bone.'),
  flexibility: z.number().min(0).max(1).optional().describe('0 rigid … 1 fully flexible — add_bone.'),
  segments: z.number().int().min(0).optional().describe('Curve segments (0 = auto) — add_bone.'),
  // attach_item
  attachPoint: z.number().min(0).max(1).optional().describe('Position along bone 0=joint…1=tip (default 0.5) — attach_item.'),
  // create_ik_chain
  boneIds: z.array(z.string()).min(2).optional().describe('Ordered bone ids (≥2) — create_ik_chain.'),
  solverType: z.enum(['fabrik', 'two_bone', 'ccd']).optional().describe('IK solver (default fabrik) — create_ik_chain.'),
  iterations: z.number().int().positive().optional().describe('Solver iterations (default 10) — create_ik_chain.'),
  tolerance: z.number().positive().optional().describe('Solver tolerance px (default 0.5) — create_ik_chain.'),
  strength: z.number().optional().describe('Chain strength 0..1 (default 1) — create_ik_chain.'),
  poleVector: PositionSchema.optional().describe('Pole vector hint — create_ik_chain.'),
  // add_pose_keyframe
  time: z.number().optional().describe('Keyframe time in seconds — add_pose_keyframe.'),
  pose: z.union([z.string(), z.record(z.string(), z.number())]).optional().describe('A saved pose id, or a { boneId: angleDeg } map — add_pose_keyframe.'),
  easing: z.string().optional().describe('Named easing (default linear) — add_pose_keyframe.'),
  favor: z.number().min(-1).max(1).optional().describe('Breakdown spacing bias −1..1 (− favors prev key, + favors next) — add_pose_keyframe.'),
  breakdown: z.boolean().optional().describe('Mark as a breakdown pose (vs a storytelling key) — add_pose_keyframe.'),
  curve: z.array(z.number()).optional().describe('Per-segment cubic-bezier ease [x1,y1,x2,y2] (overrides named easing) — add_pose_keyframe.'),
  boneOffsets: z.record(z.string(), z.number()).optional().describe('Per-bone lag { boneId: 0..0.95 } for overlap/follow-through — add_pose_keyframe.'),
  movingHold: z.boolean().optional().describe('Hold drifts toward the next key instead of dead-stopping — add_pose_keyframe.'),
  holdDrift: z.number().optional().describe('Fraction toward the next key the moving hold drifts (default 0.06) — add_pose_keyframe.'),
  // set_target_path
  waypoints: z.array(z.object({
    x: z.number(), y: z.number(),
    out: PositionSchema.optional(),
    in: PositionSchema.optional(),
  })).optional().describe('IK effector path waypoints with optional bezier tangents — set_target_path.'),
  duration: z.number().positive().optional().describe('Seconds to traverse the path (default 1) — set_target_path.'),
  loop: z.boolean().optional().describe('Cycle the path — set_target_path.'),
})
  .refine((v) => ['create_skeleton', 'import_bvh', 'import_spine'].includes(v.action) || !!v.skeletonId, { message: 'this action requires skeletonId', path: ['skeletonId'] })
  .refine((v) => v.action !== 'add_bone' || v.skeletonId != null, { message: 'add_bone requires skeletonId', path: ['skeletonId'] })
  .refine((v) => v.action !== 'attach_item' || (!!v.boneId && !!v.itemId), { message: 'attach_item requires boneId and itemId', path: ['boneId'] })
  .refine((v) => v.action !== 'create_ik_chain' || (!!v.boneIds && v.boneIds.length >= 2), { message: 'create_ik_chain requires boneIds (≥2)', path: ['boneIds'] })
  .refine((v) => v.action !== 'add_pose_keyframe' || (v.time !== undefined && v.pose !== undefined), { message: 'add_pose_keyframe requires time and pose', path: ['pose'] })
  .refine((v) => v.action !== 'set_target_path' || (!!v.chainId && !!v.waypoints), { message: 'set_target_path requires chainId and waypoints', path: ['waypoints'] })
  .refine((v) => !['import_bvh', 'retarget_bvh'].includes(v.action) || !!v.bvhText, { message: 'import_bvh/retarget_bvh require bvhText (the .bvh file contents)', path: ['bvhText'] })
  .refine((v) => v.action !== 'retarget_bvh' || v.skeletonId != null, { message: 'retarget_bvh requires skeletonId (the existing rig to drive)', path: ['skeletonId'] })
  .refine((v) => v.action !== 'import_spine' || !!v.spineJson, { message: 'import_spine requires spineJson', path: ['spineJson'] });
export type RiggingInput = z.infer<typeof RiggingInputSchema>;
