/**
 * GENERATED — DO NOT EDIT. Run `bun run sync:shape-params`.
 *
 * What each registry-backed shape reads, and how a caller reaches it.
 *
 * Source: FxTool origin/main 7661a67e4822fc20bc4644551cf2c86451f2b151
 *   js/PinePaper.js + 5 shape modules
 * sha256: 199eb6de376bed14
 *
 * A shape's `create` receives a `config`, never the caller's `params`.
 * PinePaper.js's registryConfig literal is the only bridge between the two, so
 * a config key with no params behind it is unreachable by any caller and a
 * params name absent from create() is discarded before it gets near a shape.
 * shape-docs-parity.test.ts checks the documentation against both directions.
 */

/** Every `params.*` that `create(type, params)` reads. Anything else is dropped. */
export const ACCEPTED_CREATE_PARAMS: readonly string[] = Object.freeze([
  '_bulkCreate',
  'alignment',
  'anchor',
  'angle',
  'angles',
  'animationDelay',
  'animationDuration',
  'animationEasing',
  'animationIntensity',
  'animationSpeed',
  'animationType',
  'area',
  'blendMode',
  'closed',
  'color',
  'content',
  'cornerRadius',
  'crossOrigin',
  'dashArray',
  'dataURL',
  'fillColor',
  'fontFamily',
  'fontSize',
  'from',
  'height',
  'id',
  'innerRadiusRatio',
  'justification',
  'keyframes',
  'kind',
  'label',
  'labelPosition',
  'layer',
  'name',
  'opacity',
  'origin',
  'pathData',
  'payloadType',
  'points',
  'radius',
  'radius1',
  'radius2',
  'relationBehavior',
  'rotation',
  'secondaryColor',
  'segments',
  'shadowBlur',
  'shadowColor',
  'shadowOffset',
  'showGhost',
  'sides',
  'simplify',
  'singleStroke',
  'size',
  'smooth',
  'soundSpec',
  'spacing',
  'src',
  'strokeCap',
  'strokeColor',
  'strokeJoin',
  'strokeWidth',
  'tailDirection',
  'tailSize',
  'tension',
  'through',
  'timeOffset',
  'to',
  'visible',
  'width',
  'x',
  'y',
]);

/**
 * config key → the `params.*` names that feed it. Several names for one key
 * are ALTERNATIVES: a star's outer size arrives as radius1, radius, width or
 * height, and documenting any one of them makes the key reachable.
 */
export const CONFIG_KEY_SOURCES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "angles": Object.freeze(['angles']),
  "cornerRadius": Object.freeze(['cornerRadius']),
  "height": Object.freeze(['height', 'radius', 'radius1']),
  "innerRadiusRatio": Object.freeze(['innerRadiusRatio', 'radius1', 'radius2']),
  "kind": Object.freeze(['kind']),
  "points": Object.freeze(['points']),
  "position": Object.freeze([]),
  "secondaryColor": Object.freeze(['secondaryColor']),
  "sides": Object.freeze(['sides']),
  "size": Object.freeze(['height', 'radius', 'radius1', 'width']),
  "style": Object.freeze([]),
  "tailDirection": Object.freeze(['tailDirection']),
  "tailSize": Object.freeze(['tailSize']),
  "width": Object.freeze(['radius', 'radius1', 'width']),
});

/** Registered shape id → the `config.*` keys its `create` reads. */
export const SHAPE_CONFIG_READS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  "arrow": Object.freeze(['position', 'size', 'style']),
  "arrow-right": Object.freeze(['position', 'size', 'style']),
  "callout-box": Object.freeze(['cornerRadius', 'label', 'position', 'size', 'style', 'tailDirection', 'tailSize']),
  "circle": Object.freeze(['position', 'size', 'style']),
  "circle-outline": Object.freeze(['position', 'size', 'style']),
  "cloud": Object.freeze(['label', 'position', 'size', 'style']),
  "comment-box": Object.freeze(['cornerRadius', 'label', 'position', 'size', 'style', 'tailDirection', 'tailSize']),
  "data": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "database": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "decision": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "diamond": Object.freeze(['position', 'size', 'style']),
  "disk": Object.freeze(['position', 'size', 'style']),
  "document": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "double-bubble": Object.freeze(['cornerRadius', 'label', 'position', 'secondaryColor', 'size', 'style', 'tailSize']),
  "ellipse": Object.freeze(['position', 'size', 'style']),
  "heart": Object.freeze(['position', 'size', 'style']),
  "hexagon": Object.freeze(['position', 'size', 'style']),
  "pentagon": Object.freeze(['position', 'size', 'style']),
  "polygon": Object.freeze(['points', 'position', 'sides', 'size', 'style']),
  "preparation": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "process": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "quote-bubble": Object.freeze(['cornerRadius', 'label', 'position', 'size', 'style']),
  "rectangle": Object.freeze(['cornerRadius', 'position', 'size', 'style']),
  "server": Object.freeze(['label', 'position', 'size', 'style']),
  "speech-bubble": Object.freeze(['cornerRadius', 'label', 'labelPosition', 'position', 'size', 'style', 'tailDirection', 'tailSize']),
  "speech-bubble-pointed": Object.freeze(['cornerRadius', 'label', 'position', 'size', 'style', 'tailDirection', 'tailSize']),
  "speech-bubble-square": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style', 'tailDirection', 'tailSize']),
  "star": Object.freeze(['innerRadiusRatio', 'points', 'position', 'size', 'style']),
  "terminal": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
  "thought-bubble": Object.freeze(['label', 'position', 'size', 'style', 'tailDirection']),
  "triangle": Object.freeze(['angles', 'kind', 'position', 'size', 'style']),
  "uml-actor": Object.freeze(['label', 'position', 'size', 'style']),
  "uml-class": Object.freeze(['label', 'position', 'size', 'style']),
  "uml-usecase": Object.freeze(['label', 'labelPosition', 'position', 'size', 'style']),
});

/**
 * Keys every shape receives regardless of what the caller asked for. Reading
 * one says nothing about the shape's own parameters, so the guard ignores them.
 *
 * `size` is deliberately NOT here. Every shape reads it, but it is the only
 * route width / height / radius take, and a shape that documents none of them
 * has no stated size at all — which is exactly how ellipse and heart came to be
 * documented as taking nothing but `color`.
 */
export const UNIVERSAL_CONFIG_KEYS: readonly string[] = Object.freeze(['position', 'style']);
