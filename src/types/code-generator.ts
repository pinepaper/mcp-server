/**
 * PinePaper Code Generator
 * 
 * Converts MCP tool inputs to executable PinePaper JavaScript code.
 * This code is designed to run in the browser context where window.PinePaper is available.
 */

import { REQUIRED_ENGINE_METHODS, OPTIONAL_ENGINE_METHODS } from '../tools/engine-methods.js';
import { ACCEPTED_CREATE_PARAMS, NORMALIZE_PARAM_READS, MODIFY_CHANGE_READS } from '../tools/shape-params.js';
import { generateP5DrawCode } from '../tools/p5-compat/p5-helpers.js';
import {
  ItemType,
  SimpleAnimationType,
  RelationType,
  GeneratorName,
  CreateItemInputSchema,
  ImportMotionCaptureInputSchema,
  ModifyItemInputSchema,
  AddRelationInputSchema,
  AnimateItemInputSchema,
  KeyframeAnimateInputSchema,
  ExecuteGeneratorInputSchema,
  ApplyEffectInputSchema,
  SetBackgroundColorInputSchema,
  SetCanvasSizeInputSchema,
  Keyframe,
  CreateGlossySphereInputSchema,
  CreateDiagonalStripesInputSchema,
  LightDirection,
  Gradient,
  BatchCreateInputSchema,
  BatchModifyInputSchema,
  CreateGridInputSchema,
  BatchCreateItem,
  BatchModifyItem,
  CreateSceneInputSchema,
  CreateSceneInput,
  // Diagram types
  CreateDiagramShapeInputSchema,
  CreateDiagramShapeInput,
  ConnectInputSchema,
  ConnectInput,
  ConnectPortsInputSchema,
  ConnectPortsInput,
  AddPortsInputSchema,
  AddPortsInput,
  AutoLayoutInputSchema,
  AutoLayoutInput,
  GetDiagramShapesInputSchema,
  GetDiagramShapesInput,
  UpdateConnectorInputSchema,
  UpdateConnectorInput,
  RemoveConnectorInputSchema,
  RemoveConnectorInput,
  DiagramModeInputSchema,
  DiagramModeInput,
  // Agent flow mode types
  AgentStartJobInputSchema,
  AgentStartJobInput,
  AgentEndJobInputSchema,
  AgentEndJobInput,
  AgentResetInputSchema,
  AgentResetInput,
  AgentBatchExecuteInputSchema,
  AgentBatchExecuteInput,
  AgentExportInputSchema,
  AgentExportInput,
  AgentAnalyzeInputSchema,
  AgentAnalyzeInput,
  // Letter collage types
  CreateLetterCollageInputSchema,
  CreateLetterCollageInput,
  AnimateLetterCollageInputSchema,
  AnimateLetterCollageInput,
  // Map types
  LoadMapInputSchema,
  LoadMapInput,
  HighlightRegionsInputSchema,
  HighlightRegionsInput,
  UnhighlightRegionsInputSchema,
  UnhighlightRegionsInput,
  ApplyDataColorsInputSchema,
  ApplyDataColorsInput,
  ApplyTemplateInput,
  AddMarkerInputSchema,
  AddMarkerInput,
  AddMapLabelsInputSchema,
  AddMapLabelsInput,
  PanMapInputSchema,
  PanMapInput,
  ZoomMapInputSchema,
  ZoomMapInput,
  ImportCustomMapInputSchema,
  ImportCustomMapInput,
  GetRegionAtPointInputSchema,
  GetRegionAtPointInput,
  // Map animation/CSV types
  AnimateMapRegionsInputSchema,
  AnimateMapRegionsInput,
  AnimateMapWaveInputSchema,
  AnimateMapWaveInput,
  StopMapAnimationsInputSchema,
  StopMapAnimationsInput,
  ExportMapRegionCSVInputSchema,
  ExportMapRegionCSVInput,
  ImportMapRegionCSVInputSchema,
  ImportMapRegionCSVInput,
  SelectMapRegionsInputSchema,
  SelectMapRegionsInput,
  DeselectMapRegionsInputSchema,
  DeselectMapRegionsInput,
  // Globe + world tour types
  GlobeEnableInputSchema,
  GlobeEnableInput,
  GlobeRotateToInputSchema,
  GlobeRotateToInput,
  GlobeSpinInputSchema,
  GlobeSpinInput,
  WorldTourInputSchema,
  WorldTourInput,
  StopWorldTourInputSchema,
  StopWorldTourInput,
  PinToGlobeInputSchema,
  PinToGlobeInput,
  TourItemInputSchema,
  TourItemInput,
  // Custom relation/code types
  RegisterCustomRelationInputSchema,
  RegisterCustomRelationInput,
  ExecuteCustomCodeInputSchema,
  ExecuteCustomCodeInput,
  // Mask types
  ApplyAnimatedMaskInputSchema,
  ApplyAnimatedMaskInput,
  ApplyCustomMaskInputSchema,
  ApplyCustomMaskInput,
  RemoveMaskInputSchema,
  RemoveMaskInput,
  // Image import types
  ImportImageInput,
  // Scene management types
  ManageScenesInput,
  ScenePlaybackInput,
  SceneGraphInput,
  SceneGraphInputSchema,
  SequenceInput,
  SequenceInputSchema,
  StaggerInput,
  StaggerInputSchema,
  FlipInput,
  FlipInputSchema,
  // New consolidated tool types
  SelectionInput,
  TransformInput,
  BrandKitInput,
  ComponentInput,
  ArtboardInput,
  CommentInput,
  ProvenanceInput,
  SceneDiffInput,
  AudioBeatsInput,
  TemplateParamsInput,
  ComposeInput,
  HistoryInput,
  ImageFilterInput,
  LassoInput,
  CutoutStyleInput,
  PrecompInput,
  BackgroundInput,
  QueryInput,
  QueryCapabilitiesInput,
  QueryCapabilitiesInputSchema,
  // New parity tools
  DeformInput,
  SpriteSheetInput,
  InteractionInput,
  ExportWidgetInput,
  ExportWidgetHtmlInput,
  CreateChartInput,
  MagicInput,
  PhysicsInput,
  MeasurementInput,
  GeometryInput,
  EquationPathInput,
  EventInput,
  ConstructionSequenceInput,
  ValidateSceneInput,
  CaptureFramesInput,
  AccessibilityCheckInput,
  InstantiateOntologyInput,
  LintSceneInput,
  MediaInput, TextStyleInput, TextEffectInput, DesignMediumInput, ShatterImageInput, ImportLayeredCharacterInput, GameInput, World3DInput,
  CropImageInput,
  PathOpInput,
  MotionInput,
  SoundInput,
  InterchangeInput,
  StickInput,
  StoryInput,
  ChromaKeyInput,
  RiggingInput,
  GroupInput,
  CameraDirectorInput,
  DetectObjectsInput,
  ExtractObjectInput,
  ArrangeInput,
  GeneratorRegion,
} from './schemas.js';
import { OntologyCompiler } from '../ontology/ontology-compiler.js';
import { z } from 'zod';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check if a color value is a gradient object
 */
function isGradient(color: unknown): color is Gradient {
  return typeof color === 'object' && color !== null && 'type' in color && 'stops' in color;
}

/**
 * A colour OBJECT is a gradient spec, checked before it reaches the engine.
 *
 * {gradient: true, stops: ['#a', '#b']} — no type, bare-string stops, invalid
 * hex — went to the engine as a plain colour and drew NOTHING, with success
 * (round 9 ads, 1.82). The shape the tools document is {type: 'linear' |
 * 'radial', stops: [{color, offset}], origin?, destination?}. Near-misses are
 * normalised (a missing type is linear; bare stops get even offsets); what
 * cannot be read is refused by name, with the shape.
 */
function normalizeGradientSpec(v: unknown, key: string): { gradient: Gradient } | { error: string } {
  const o = v as Record<string, unknown>;
  const rawStops = Array.isArray(o.stops) ? o.stops : null;
  const shape = `${key} as a gradient is {type: 'linear' | 'radial', stops: [{color: '#rrggbb', offset: 0..1}, …], origin?: [x, y], destination?: [x, y]}.`;
  if (!rawStops || rawStops.length < 2) return { error: `${key} is an object but not a gradient with at least 2 stops, so nothing would be drawn. ${shape}` };
  const hexOk = (c: string) => !c.startsWith('#') || /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(c);
  const n = rawStops.length;
  const stops: Array<{ color: string; offset: number }> = [];
  for (let i = 0; i < n; i++) {
    const st = rawStops[i] as unknown;
    const color = typeof st === 'string' ? st : (st && typeof (st as { color?: unknown }).color === 'string' ? (st as { color: string }).color : null);
    const offset = typeof st === 'string' ? i / (n - 1) : Number((st as { offset?: unknown }).offset ?? i / (n - 1));
    if (!color || !hexOk(color.trim())) return { error: `${key} stop ${i} has colour ${JSON.stringify(color)}, which is not a colour (a hex needs 3, 4, 6 or 8 digits). ${shape}` };
    if (!(offset >= 0 && offset <= 1)) return { error: `${key} stop ${i} has offset ${JSON.stringify((st as { offset?: unknown }).offset)}; offsets run 0 to 1. ${shape}` };
    stops.push({ color: color.trim(), offset });
  }
  const type = o.type === 'radial' ? 'radial' : 'linear';
  return { gradient: { ...(o as object), type, stops } as unknown as Gradient };
}

/**
 * Generate Paper.js gradient code for a fill color
 */
function generateGradientCode(
  gradient: Gradient,
  itemVarName: string,
  position: { x: number; y: number },
  propertyName: 'fillColor' | 'strokeColor' = 'fillColor'
): string {
  const { type, stops, origin, destination } = gradient;

  // Calculate default origin/destination based on item position
  const defaultOrigin = origin || [position.x - 50, position.y - 50];
  const defaultDestination = destination || [position.x + 50, position.y + 50];

  const stopsCode = stops.map(s => `['${s.color}', ${s.offset}]`).join(', ');

  return `
${itemVarName}.${propertyName} = {
  gradient: {
    stops: [${stopsCode}],
    radial: ${type === 'radial'}
  },
  origin: [${defaultOrigin[0]}, ${defaultOrigin[1]}],
  destination: [${defaultDestination[0]}, ${defaultDestination[1]}]
};`;
}

/**
 * Generate shadow code for an item
 */
function generateShadowCode(
  itemVarName: string,
  shadowColor?: string,
  shadowBlur?: number,
  shadowOffset?: [number, number]
): string {
  const lines: string[] = [];

  if (shadowColor) {
    lines.push(`${itemVarName}.shadowColor = '${shadowColor}';`);
  }
  if (shadowBlur !== undefined) {
    lines.push(`${itemVarName}.shadowBlur = ${shadowBlur};`);
  }
  if (shadowOffset) {
    lines.push(`${itemVarName}.shadowOffset = new paper.Point(${shadowOffset[0]}, ${shadowOffset[1]});`);
  }

  return lines.join('\n');
}

/**
 * Generate blend mode code for an item
 */
function generateBlendModeCode(itemVarName: string, blendMode: string): string {
  return `${itemVarName}.blendMode = '${blendMode}';`;
}

// =============================================================================
// CODE TEMPLATES
// =============================================================================

/**
 * Template for creating items with support for gradients, shadows, and blend modes
 */
function generateCreateItemCode(
  itemType: ItemType,
  position: { x: number; y: number },
  properties: Record<string, unknown>,
  dataFlags?: Record<string, unknown>,
  positionGiven = true,
): string {
  // Colour objects are gradient specs: normalised, or refused by name.
  for (const key of ['color', 'fillColor', 'strokeColor']) {
    const v = properties[key];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const g = normalizeGradientSpec(v, key);
      if ('error' in g) {
        return `
// Create ${itemType} — refused: an unreadable gradient would draw nothing
({ success: false, error: ${JSON.stringify(g.error)} });`.trim();
      }
      properties = { ...properties, [key]: g.gradient };
    }
  }

  // Extract special properties that need separate handling
  const {
    color,
    fillColor,
    strokeColor,
    shadowColor,
    shadowBlur,
    shadowOffset,
    blendMode,
    opacity,
    contentType,
    contentFormat,
    countdownTarget,
    countdownEndText,
    ...baseProperties
  } = properties;

  // A PATH KEEPS ITS OWN COORDINATES WHEN NO POSITION WAS ASKED FOR (round 9
  // HH, 1.81). The schema defaults position to (400, 300), and the engine
  // places pathData AT x / y (so origin-centred data can be positioned) — so a
  // pathData path authored in canvas coordinates was moved to the default,
  // off by (+99.5, -170). The segments form was untouched only by accident of
  // the engine's branch. With no position from the caller, a coordinate-built
  // item (path from pathData / segments, line, arc) gets no x / y at all.
  const omitXY = !positionGiven && isCoordinateBuilt(itemType, properties);
  // `fit` is applied through app.fitText after creation (below), not sent to
  // create(), so a studio without it cannot half-read it.
  const textFit = itemType === 'text' && baseProperties.fit && typeof baseProperties.fit === 'object' ? baseProperties.fit as Record<string, unknown> : null;
  const { fit: _fitDropped, ...createProps } = baseProperties;
  void _fitDropped;
  let textDirection = itemType === 'text' ? takeDirection(createProps) : null;
  // RIGHT-TO-LEFT TEXT WITH NO DIRECTION GIVEN. The engine's default is auto,
  // but it records nothing, so nothing could confirm it. For content with any
  // RTL script, auto is sent explicitly — recorded, so checkable — and the
  // result says which way it resolved.
  if (itemType === 'text' && !textDirection && typeof createProps.content === 'string' && RTL_SCRIPT.test(createProps.content)) {
    createProps.direction = 'auto';
    textDirection = { value: 'auto' };
  }
  if (textDirection && 'value' in textDirection && textDirection.value === 'auto' && typeof createProps.content === 'string') {
    textDirection.resolved = baseDirection(createProps.content);
  }
  const textTabular = itemType === 'text' && wantsTabular(createProps) === true;
  const textStrokePos = itemType === 'text' ? takeStrokePosition(createProps, false) : null;
  const params: Record<string, unknown> = {
    ...(omitXY ? {} : { x: position.x, y: position.y }),
    ...withRadiusAxes(createProps),
  };

  // "NO FILL" HAS THREE SPELLINGS, AND NONE OF THEM WORKED (round 7 AA, 1.50).
  // fillColor:null was dropped by a truthiness check, so the engine's default
  // blue applied; 'transparent' reached Paper, which read it as black. A
  // stroke-only rectangle — whiteboard line art — could not be made at create.
  // All three now mean no fill, applied after the item exists.
  const noFill = (v: unknown) => v === null || (typeof v === 'string' && /^(transparent|none)$/i.test(v.trim()));
  const clearFill = (fillColor !== undefined && noFill(fillColor)) || (fillColor === undefined && color !== undefined && noFill(color));

  // `color` ON A CLOSED PATH IS ITS FILL.
  //
  // The engine's path branch paints `color` as the STROKE whenever no fillColor
  // is given — right for an open line, and the opposite of every shape, where
  // color is the fill. So a closed blob or hand-drawn badge passed {color} came
  // out as a hollow outline (round 6 U, 1.41). A closed path (closed:true, or
  // pathData ending in Z) now takes color as its fill; an open one keeps the
  // stroke it always had, so existing line drawings are unchanged.
  const pathData = typeof baseProperties.pathData === 'string' ? baseProperties.pathData.trim() : '';
  const closedPath = itemType === 'path'
    && (baseProperties.closed === true || /z$/i.test(pathData));
  if (closedPath && color && !isGradient(color) && fillColor === undefined && strokeColor === undefined) {
    params.fillColor = color;
  }

  // Handle simple solid colors in params
  if (color && !isGradient(color) && !noFill(color)) {
    params.color = color;
  }
  if (fillColor && !isGradient(fillColor) && !noFill(fillColor)) {
    params.fillColor = fillColor;
  }
  if (strokeColor && !isGradient(strokeColor)) {
    params.strokeColor = strokeColor;
  }

  // RENDER-TIME SURFACES DEGRADE, THEY DO NOT FAIL.
  //
  // `shader` and `field` are drawn per pixel by the cloud rasterizer from the
  // scene document; the browser engine has no such item type and answers
  // `create('shader')` with "unknown type — nothing was created". Emitting that
  // call would hand every local user a silent hole where their backdrop was.
  //
  // So locally they become a plate: a rectangle carrying the same id, position,
  // size and colour, which keeps the composition readable and the item
  // addressable by every later call. The scene document still says `shader`, so
  // a cloud render draws the real surface. The divergence is declared here
  // rather than discovered in a frame.
  if (itemType === 'shader' || itemType === 'field') {
    const plate: Record<string, unknown> = {
      x: position.x,
      y: position.y,
      width: (params.width as number) ?? 200,
      height: (params.height as number) ?? 200,
      fillColor: (params.fillColor as string) ?? (params.fill as string) ?? '#334155',
    };
    if (params.id) plate.id = params.id;
    if (params.opacity != null) plate.opacity = params.opacity;
    return `
// ${itemType} — a render-time surface. Drawn per pixel by the cloud renderer;
// stood in for locally by a flat plate so the layout still reads.
const item = app.create('rectangle', ${JSON.stringify(plate, null, 2)});
if (item && item.data) { item.data.renderAs = ${JSON.stringify(itemType)}; item.data.renderParams = ${JSON.stringify(params)}; }
// The snippet's value is its last statement's, which was the assignment above:
// the caller got renderParams back and no itemId to address the item by.
// ONE outer paren pair: the governor's wrapTrailingReturn reads a top-level
// \`}\` as a statement end, so a bare ternary of object literals is not wrapped
// and its value is lost.
((item && item.data)
  ? { itemId: item.data.registryId, type: ${JSON.stringify(itemType)}, position: { x: ${position.x}, y: ${position.y} },
      localStandIn: true,
      note: 'drawn here as a flat plate; the ${itemType} itself appears only in a cloud render. A local export shows the plate.' }
  : { success: false, error: 'the stand-in plate for this ${itemType} was not created.' });`;
  }

  // AN UNKNOWN ANCHOR IS INVISIBLE OVER MCP.
  //
  // The engine names a bad anchor through console.warn and leaves (x, y) as
  // the centre — good behaviour in the editor, and nothing at all here, since
  // the production build strips console.warn. A typo would therefore displace
  // the item by half its own size, which is the exact bug `anchor` exists to
  // remove, arriving silently. Checked before it is sent instead.
  const ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center', 'centre'];
  const anchorGiven = params.anchor ?? params.origin;
  if (anchorGiven !== undefined) {
    const normalized = String(anchorGiven).toLowerCase().replace(/[\s_]+/g, '-');
    if (!ANCHORS.includes(normalized)) {
      return `
// Create ${itemType} — refused, rather than silently centred
({ success: false, error: ${JSON.stringify(
        `anchor ${JSON.stringify(String(anchorGiven))} is not one of ${ANCHORS.slice(0, 5).join(', ')}. `
        + 'The engine would leave x/y as the CENTRE and say so only in a console this tool cannot read, '
        + 'so the item would land half its own size away with nothing to explain it.',
      )} });`.trim();
    }
    if (params.anchor !== undefined) params.anchor = normalized;
    if (params.origin !== undefined) params.origin = normalized;
  }

  // AN UNREAD PROPERTY IS DROPPED WITHOUT A WORD — SO SAY THE WORD HERE.
  //
  // `properties` is free-form and create() returns an item whatever it is
  // given, so {blur: 12, backdropFilter: 'blur(8px)'} produced a crisp shape and
  // a successful call; the caller learned only by rendering. The allowlist is
  // generated from the engine (what create() and normalizeParams() read), and
  // the handful this emitter consumes itself are added. Reported back, not
  // refused: the item is still what the caller asked for in every other way,
  // and a refusal would cost a re-issue over one typo.
  //
  // The generated allowlist says what create() READS, for any type; the text
  // keys it reads apply only to text (the engine gates them on PointText). So
  // on another type they are reported whatever the list says. `direction` is
  // not among them: an arc reads it as its sweep.
  const textOnly = (k: string) => (TEXT_STYLE_KEYS as readonly string[]).includes(k) || k === 'fit' || k === 'textDirection' || k === 'dir'
    || (TABULAR_KEYS as readonly string[]).includes(k) || k === 'strokePosition';
  const ignored = Object.keys(properties).filter((k) => itemType === 'text'
    ? !CREATE_KNOWN_KEYS.has(k) && !textOnly(k) && !(DIRECTION_KEYS as readonly string[]).includes(k)
    : !CREATE_KNOWN_KEYS.has(k) || textOnly(k));

  // Build the code
  let code = `
// Create ${itemType} item
const item = app.create('${itemType}', ${JSON.stringify(params, null, 2)});`;

  // Add gradient support for colors
  if (color && isGradient(color)) {
    code += generateGradientCode(color, 'item', position, 'fillColor');
  }
  if (fillColor && isGradient(fillColor)) {
    code += generateGradientCode(fillColor as Gradient, 'item', position, 'fillColor');
  }
  if (strokeColor && isGradient(strokeColor)) {
    code += generateGradientCode(strokeColor as Gradient, 'item', position, 'strokeColor');
  }

  // Add shadow support
  const shadowCode = generateShadowCode(
    'item',
    shadowColor as string | undefined,
    shadowBlur as number | undefined,
    shadowOffset as [number, number] | undefined
  );
  if (shadowCode) {
    code += '\n' + shadowCode;
  }

  // Add blend mode support
  if (blendMode) {
    code += '\n' + generateBlendModeCode('item', blendMode as string);
  }

  if (clearFill) code += `\nitem.fillColor = null;`;

  // DASHES, CAPS AND JOINS FOR EVERY SHAPE (round 7 Z, 1.54). create() applies
  // them only in its path / line / pattern branches; the shared tail sets a
  // stroke's colour and width for every type but not these, so a dashed circle
  // rendered solid and nothing said so (the key is on create()'s read list, so
  // the unread-property report could not catch it). Re-applied here for every
  // type; on a path it repeats the engine's own value.
  const strokeStyle: string[] = [];
  if (Array.isArray(properties.dashArray)) strokeStyle.push(`item.dashArray = ${JSON.stringify(properties.dashArray)};`);
  if (typeof properties.strokeCap === 'string') strokeStyle.push(`item.strokeCap = ${JSON.stringify(properties.strokeCap)};`);
  if (typeof properties.strokeJoin === 'string') strokeStyle.push(`item.strokeJoin = ${JSON.stringify(properties.strokeJoin)};`);
  if (strokeStyle.length) code += `\n${strokeStyle.join('\n')}`;

  // Add opacity support
  if (opacity !== undefined) {
    code += `\nitem.opacity = ${opacity};`;
  }

  if (itemType === 'text') code += emitTextStyle('item', properties);
  // The vertical hold follows the anchor, as the engine's own create step
  // derives it (1.90): without it the fit held the centre, and a top-left
  // anchored headline's top edge drifted on every refit.
  if (textDirection) code += emitDirectionCheck('item', textDirection);
  if (textTabular) code += emitTabularCheck('item');
  if (textStrokePos) code += emitStrokePositionCheck('item', textStrokePos);
  if (textFit) code += `\nlet __textFit = null;${emitTextFit('item', textFit, JSON.stringify(anchorHold(properties.anchor ?? properties.origin) ?? null))}`;

  // After opacity, so the "on" level of the lifetime is the item's own.
  const hasLifetime = properties.bornAt !== undefined || properties.ttl !== undefined;
  if (hasLifetime) {
    code += `\nlet __lifetime = null;${emitLifetime('item', properties.bornAt, properties.ttl)}`;
  }

  // Ensure item is visible above backgrounds/generators
  code += `\nif (item.bringToFront) item.bringToFront();`;

  // selectable / isDraggable / isDecorative live on item.data, not in params.
  if (dataFlags && Object.keys(dataFlags).length > 0) {
    code += `\nif (item.data) Object.assign(item.data, ${JSON.stringify(dataFlags)});`;
  }

  // Add dynamic content support for text items
  if (contentType && itemType === 'text') {
    const opts: Record<string, unknown> = {};
    if (contentFormat) opts.format = contentFormat;
    if (countdownTarget !== undefined) opts.countdownTarget = countdownTarget;
    if (countdownEndText) opts.countdownEndText = countdownEndText;
    code += `\nif (app.setDynamicContent) app.setDynamicContent(item, '${contentType}', ${JSON.stringify(opts)});`;
  }

  const loadsFont = itemType === 'text' && typeof properties.fontFamily === 'string' && properties.fontFamily.trim() !== '';

  code += `
const itemId = item.data.registryId;
app.historyManager.saveState();

// Return item info
({ itemId, type: '${itemType}'${textFit ? ', textFit: __textFit' : ''}${textDirection ? ', direction: __direction' : ''}${textTabular ? ', tabularFigures: __tabular' : ''}${textStrokePos ? ', strokePosition: __strokePos' : ''}, position: ${omitXY ? `(item.position ? { x: item.position.x, y: item.position.y } : null)` : `{ x: ${position.x}, y: ${position.y} }`}${hasLifetime ? ', lifetime: __lifetime' : ''}${loadsFont ? ', ...(__font ? { font: __font } : {})' : ''}${ignored.length > 0
    ? `, ignoredProperties: ${JSON.stringify(ignored)}, warning: ${JSON.stringify(
      `${ignored.join(', ')} ${ignored.length > 1 ? 'are' : 'is'} not read when creating an item, so ${ignored.length > 1 ? 'they had' : 'it had'} no effect. `
      + 'Check the spelling against this item type\'s documented properties.',
    )}`
    : ''} });`;

  // Loading a font is async, and it has to happen BEFORE create() measures the
  // text — so only this case becomes an async IIFE; every other create stays a
  // plain snippet ending in its (-led result.
  if (loadsFont) {
    const body = code.trim().replace(/\(\{ itemId([\s\S]*)\}\);$/, 'return { itemId$1 };');
    return `(async function() {${emitEnsureFont(properties.fontFamily as string)}\n${body}\n})();`;
  }

  return code.trim();
}

/**
 * Every `properties` key modify_item can act on: what the engine's modify path
 * and normalizeParams() read (generated), plus what generateModifyItemCode
 * applies itself (dynamic content, audio level, lifetime, raster smoothing,
 * the text properties modifyItem does not pass on).
 */
const MODIFY_KNOWN_KEYS: ReadonlySet<string> = new Set([
  ...MODIFY_CHANGE_READS,
  ...NORMALIZE_PARAM_READS,
  'contentType', 'contentFormat', 'countdownTarget', 'countdownEndText',
  'audioGain', 'volume', 'gain', 'bornAt', 'ttl', 'smoothing',
  'fontStyle', 'leading', 'lineHeight', 'skewX', 'skewY', 'matrix', 'fit', 'direction', 'textDirection', 'dir', 'tabularFigures', 'fontVariantNumeric', 'fontFeatures', 'strokePosition',
]);

/** Spellings callers reach for, and the key the engine actually reads. */
const MODIFY_DID_YOU_MEAN: Readonly<Record<string, string>> = {
  scaling: 'scale', size: 'width / height', rotate: 'rotation', angle: 'rotation', shear: 'skewX / skewY', skew: 'skewX / skewY',
  alpha: 'opacity', text: 'content', stroke_width: 'strokeWidth', lineWidth: 'strokeWidth',
};

/**
 * Every `properties` key create_item can act on: what the engine's create()
 * and normalizeParams() read (generated — see shape-params.ts), plus the keys
 * generateCreateItemCode consumes itself before the engine sees them.
 */
const CREATE_KNOWN_KEYS: ReadonlySet<string> = new Set([
  ...ACCEPTED_CREATE_PARAMS,
  ...NORMALIZE_PARAM_READS,
  // withRadiusAxes, gradients / shadow / blend / opacity emitted here, and
  // setDynamicContent for text.
  'radiusX', 'radiusY', 'contentType', 'contentFormat', 'countdownTarget', 'countdownEndText',
  // Lifetimes. The editor's create() does not read them, but they are
  // documented on ANY item and the scene renderer schedules by them — calling
  // them "no effect" would steer a caller off the only way to cut between shots.
  'bornAt', 'ttl',
]);

/**
 * Load a font family before text is drawn with it, and say if it still is not there.
 *
 * `font list_available` names ~60 families, and drawing with one (Anton,
 * Playfair Display) came out in a serif fallback with a console warning
 * nobody over MCP can read. They are real — the studio's decorative Google
 * Fonts sheet carries them — but it is fetched only when the editor's own UI
 * asks, and text measures its bounds at creation, so a face arriving later
 * leaves the layout measured in the fallback.
 *
 * So: ask checkFont; if missing, ensureFontsLoaded('all') and force the fetch
 * with document.fonts.load (a registered @font-face is not a fetched one),
 * then ask again. `__font` is set only when the first answer was "missing",
 * so an available font adds nothing to the result. Needs an async context.
 */
export function emitEnsureFont(family: string): string {
  const primary = family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return `
let __font = null;
if (typeof app.checkFont === 'function') {
  const __v0 = app.checkFont(${JSON.stringify(family)});
  if (__v0 && __v0.available === false) {
    if (typeof app.ensureFontsLoaded === 'function') { try { await app.ensureFontsLoaded('all'); } catch (_) { /* reported below */ } }
    try { if (typeof document !== 'undefined' && document.fonts) await document.fonts.load('16px ' + ${JSON.stringify(JSON.stringify(primary))}); } catch (_) { /* reported below */ }
    let __v1 = app.checkFont(${JSON.stringify(family)});
    let __via = 'studio';
    // Not in the studio's own sheets (Monoton, a common neon face, is not):
    // the page's CSP allows fonts.googleapis.com stylesheets and
    // fonts.gstatic.com files, so ask Google Fonts for the family directly.
    if (!(__v1 && __v1.available === true) && typeof document !== 'undefined' && document.head) {
      __via = 'google-fonts';
      await new Promise(function(res) {
        const id = 'pp-gf-' + ${JSON.stringify(primary)}.replace(/[^a-z0-9]+/gi, '-');
        if (document.getElementById(id)) return res();
        const l = document.createElement('link');
        l.id = id; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(${JSON.stringify(primary)}).replace(/%20/g, '+') + '&display=swap';
        l.onload = res; l.onerror = res; setTimeout(res, 5000);
        document.head.appendChild(l);
      });
      try { if (document.fonts) await document.fonts.load('16px ' + ${JSON.stringify(JSON.stringify(primary))}); } catch (_) { /* reported below */ }
      __v1 = app.checkFont(${JSON.stringify(family)});
    }
    __font = (__v1 && __v1.available === true)
      ? { family: ${JSON.stringify(primary)}, available: true, loadedNow: true, via: __via }
      : { family: ${JSON.stringify(primary)}, available: false,
          warning: ${JSON.stringify(primary)} + ' could not be loaded, so this text is drawn in a fallback face. '
            + ((__v1 && __v1.reason) || '') + ' font list_available names the families this studio can load.' };
  }
}`;
}

/**
 * Auto-fit a text item to a box (FxTool 661224ef: app.fitText). Text that
 * overran its slot — a German translation, a long name on a certificate, a
 * feed value in a variant matrix — was the #1 blocker in rounds 6–9. The box
 * is remembered by the engine, so later content changes refit. On a studio
 * without fitText the result says so rather than leaving the text as it was
 * in silence. `__textFit` must be declared by the caller.
 */
/**
 * A text paragraph's base direction (FxTool a3b4e7c3, gap 1.16): 'auto' (the
 * first strong character decides), 'ltr' or 'rtl', under three spellings.
 *
 * Pulled out of the changes and normalised to `direction`, the one spelling
 * the engine reads on both create and modify (modify does not read `dir`). A
 * value that is not a direction is refused here: the engine only console.warns
 * it, which production strips.
 */
const DIRECTION_KEYS = ['direction', 'textDirection', 'dir'] as const;
type DirectionRequest = { value: 'auto' | 'ltr' | 'rtl'; resolved?: 'ltr' | 'rtl' } | { error: string };

// The engine's rule (FxTool js/core/TextDirection.js, UAX #9 P2/P3): the
// first STRONG character decides. Mirrored so a result can say which way
// 'auto' went.
const RTL_SCRIPT = /[\p{Script=Hebrew}\p{Script=Arabic}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}]/u;
function baseDirection(text: string): 'ltr' | 'rtl' {
  for (const ch of text) {
    if (RTL_SCRIPT.test(ch)) return 'rtl';
    if (/\p{L}/u.test(ch)) return 'ltr';
  }
  return 'ltr';
}
function takeDirection(props: Record<string, unknown>): DirectionRequest | null {
  const key = DIRECTION_KEYS.find((k) => props[k] !== undefined && props[k] !== null && props[k] !== '');
  const raw = key ? props[key] : undefined;
  for (const k of DIRECTION_KEYS) delete props[k];
  if (raw === undefined) return null;
  const v = String(raw).trim().toLowerCase();
  if (v === 'auto' || v === 'ltr' || v === 'rtl') {
    props.direction = v;
    return { value: v };
  }
  return { error: `direction ${JSON.stringify(String(raw))} is not one of auto, ltr, rtl — the text keeps its current direction.` };
}

/**
 * Sets `__direction` (declared here) to whether the studio took the direction:
 * an engine without RTL support accepts the key and draws left-to-right, so
 * the only evidence is the value it records on the item.
 */
function emitDirectionCheck(itemExpr: string, req: DirectionRequest): string {
  if ('error' in req) return `
const __direction = ${JSON.stringify({ applied: false, error: req.error })};`;
  const v = JSON.stringify(req.value);
  return `
const __direction = (function(it) {
  if (!it || it.className !== 'PointText') return { applied: false, note: 'direction applies to text items only.' };
  return it.data && it.data.direction === ${v}
    ? { applied: true, value: ${v}${req.resolved ? `, resolved: ${JSON.stringify(req.resolved)}` : ''} }
    : { applied: false, note: 'this studio does not set a paragraph direction (it needs an engine with RTL text support): the text is laid out left-to-right.' };
})(${itemExpr});`;
}

/**
 * Tabular (fixed-width) figures (FxTool 3354d51c): a counter or price column
 * that does not jitter as its digits change. The engine reads all three
 * spellings on create and modify itself; this only reports whether it took
 * them, because an engine without them accepts the key and draws
 * proportional digits.
 */
const TABULAR_KEYS = ['tabularFigures', 'fontVariantNumeric', 'fontFeatures'] as const;
function wantsTabular(p: Record<string, unknown>): boolean | null {
  if (!TABULAR_KEYS.some((k) => p[k] !== undefined)) return null;
  if (p.tabularFigures === true) return true;
  if (typeof p.fontVariantNumeric === 'string' && /tabular-nums/.test(p.fontVariantNumeric)) return true;
  const f = p.fontFeatures;
  const list = Array.isArray(f) ? f.map(String) : typeof f === 'string' ? [f] : f && typeof f === 'object' ? Object.keys(f).filter((k) => (f as Record<string, unknown>)[k]) : [];
  return list.some((x) => /\btnum\b/.test(x));
}
function emitTabularCheck(itemExpr: string): string {
  return `
const __tabular = (function(it) {
  if (!it || it.className !== 'PointText') return { applied: false, note: 'tabular figures apply to text items only.' };
  return it.data && it.data.tabularFigures === true
    ? { applied: true }
    : { applied: false, note: 'this studio does not lay out tabular figures (it needs an engine with them): digits keep their proportional widths. A monospaced font is the fallback.' };
})(${itemExpr});`;
}

/**
 * Text stroke OUTSIDE the glyph (FxTool 3e22c0df): the stroke is drawn under
 * the fill at twice the width, so a thick outline (captions, memes) no longer
 * eats the letterform. 'center' is the ordinary stroke. A bad value is
 * refused here — the engine only console.warns it — and 'outside' is
 * confirmed from what the engine records, since an older one ignores it.
 */
type StrokePositionRequest = { value: 'outside' | 'center' } | { error: string };
function takeStrokePosition(props: Record<string, unknown>, allowNull: boolean): StrokePositionRequest | null {
  if (!('strokePosition' in props)) return null;
  const raw = props.strokePosition;
  if (raw === null && allowNull) { props.strokePosition = 'center'; return { value: 'center' }; }
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'outside') { props.strokePosition = 'outside'; return { value: 'outside' }; }
  if (v === 'center' || v === 'centre') { props.strokePosition = 'center'; return { value: 'center' }; }
  delete props.strokePosition;
  return { error: `strokePosition ${JSON.stringify(raw)} is not 'outside' or 'center' — the stroke is unchanged.` };
}
function emitStrokePositionCheck(itemExpr: string, req: StrokePositionRequest): string {
  if ('error' in req) return `\nconst __strokePos = ${JSON.stringify({ applied: false, error: req.error })};`;
  if (req.value === 'center') return `\nconst __strokePos = { applied: true, value: 'center' };`;
  return `
const __strokePos = (function(it) {
  if (!it || it.className !== 'PointText') return { applied: false, note: 'strokePosition applies to text items only.' };
  if (!(it.data && it.data.strokePosition === 'outside')) return { applied: false, note: 'this studio does not draw text strokes outside the glyph (it needs an engine with strokePosition): the stroke is centred on the outline, so a thick stroke thins the letters.' };
  return (it.strokeColor && it.strokeWidth > 0) ? { applied: true, value: 'outside' } : { applied: true, value: 'outside', note: 'the text has no stroke yet: set strokeColor and strokeWidth to see it.' };
})(${itemExpr});`;
}

/** 'top' / 'bottom' from a top-* / bottom-* anchor, as the engine derives it. */
function anchorHold(anchor: unknown): 'top' | 'bottom' | undefined {
  const a = String(anchor ?? '').toLowerCase();
  return /^top/.test(a) ? 'top' : /^bottom/.test(a) ? 'bottom' : undefined;
}

function emitTextFit(itemExpr: string, box: Record<string, unknown>, holdFallback = 'undefined'): string {
  return `
if (typeof app.fitText === 'function') {
  const __fbox = ${JSON.stringify(box)};
  if (__fbox.hold === undefined) { const __h = ${holdFallback}; if (__h) __fbox.hold = __h; }
  const __fr = app.fitText(${itemExpr}, __fbox);
  __textFit = __fr && __fr.ok !== false
    ? Object.assign({ applied: true }, __fr, __fr.fits === false ? { warning: 'the text does not fit its box even at the minimum font size — shorten it or widen the box.' } : {})
    : { applied: false, error: (__fr && __fr.error) || 'the studio refused the fit box' };
} else {
  __textFit = { applied: false, note: 'this studio cannot auto-fit text (no app.fitText): the text keeps its font size and may overrun the box.' };
}`;
}

/**
 * Paper text properties the engine's create() and modifyItem() never pass on.
 *
 * Line spacing, weight and italic are what editorial, Swiss and zine layouts
 * are made of, and all three were dropped without a word: create('text')
 * builds a PointText from content / fontFamily / fontSize / justification
 * only. PointText itself supports them (`leading`, and `fontWeight`, which
 * Paper writes into the canvas font shorthand — so italic rides in it as
 * "italic 700"). Set after the fact, then re-anchored to the edge the engine
 * anchored to, because a heavier weight or taller leading moves the bounds.
 *
 * lineHeight is the CSS habit: <= 4 is a multiple of fontSize, above that px.
 */
const TEXT_STYLE_KEYS = ['fontWeight', 'fontStyle', 'leading', 'lineHeight'] as const;
function emitTextStyle(itemExpr: string, props: Record<string, unknown>): string {
  const weight = props.fontWeight;
  const italic = props.fontStyle === 'italic' || props.fontStyle === 'oblique';
  const lh = typeof props.lineHeight === 'number' ? props.lineHeight : undefined;
  const leading = typeof props.leading === 'number' ? props.leading : undefined;
  if (weight === undefined && props.fontStyle === undefined && leading === undefined && lh === undefined) return '';
  return `
(function(it) {
  if (!it || it.className !== 'PointText') return;
  const j = it.justification;
  const edge = function(b) { return j === 'left' ? b.left : j === 'right' ? b.right : b.center.x; };
  const b0 = it.bounds, ax = edge(b0), ay = b0.center.y;
  ${weight !== undefined || props.fontStyle !== undefined
    ? `it.fontWeight = ${JSON.stringify(`${italic ? 'italic ' : ''}${weight ?? 'normal'}`)};`
    : ''}
  ${leading !== undefined ? `it.leading = ${leading};` : ''}
  ${lh !== undefined ? `it.leading = ${lh} <= 4 ? ${lh} * it.fontSize : ${lh};` : ''}
  const b1 = it.bounds;
  it.position = it.position.add([ax - edge(b1), ay - b1.center.y]);
})(${itemExpr});`;
}

/**
 * Which data keys a chart plots, when the caller did not say.
 *
 * ChartSystem defaults to fields named `x` and `y`. The tool's own documented
 * example is [{category, value}], so that example drew NO bars — index labels
 * "0 1 2 3 4" and success:true, dataPoints:5 (round 7 Z, 1.53). Inferred here
 * from the data instead: x is a label-like key (category/label/name/…, else
 * the first text key), y is value-like (value/count/…, else the first number
 * key other than x). stackedBar picks its own series from every numeric key,
 * so only x is inferred for it. A y that cannot be found is refused by name,
 * listing the keys that were there, rather than drawn as nothing.
 */
function resolveChartFields(
  chartType: string,
  data: Array<Record<string, unknown>>,
  options: Record<string, unknown>,
): { options: Record<string, unknown>; inferred?: { xField?: string; yField?: string } } | { error: string } {
  // No rows yet (a chart created empty and filled by update): nothing to infer.
  if (data.length === 0) return { options };
  const row = data.find((d) => d && typeof d === 'object') ?? {};
  const keys = Object.keys(row);
  const out = { ...options };
  const inferred: { xField?: string; yField?: string } = {};
  const has = (k: string) => keys.includes(k);
  if (out.xField === undefined && !has('x')) {
    const x = ['category', 'label', 'name', 'date', 'month', 'year', 'key'].find(has)
      ?? keys.find((k) => typeof row[k] === 'string') ?? keys[0];
    if (x !== undefined) { out.xField = x; inferred.xField = x; }
  }
  const xf = (out.xField as string | undefined) ?? 'x';
  if (chartType !== 'stackedBar' && out.yField === undefined && !has('y')) {
    const numeric = keys.filter((k) => k !== xf && typeof row[k] === 'number');
    const y = ['value', 'count', 'amount', 'total', 'score'].find((k) => numeric.includes(k)) ?? numeric[0];
    if (y === undefined) {
      return { error: `no numeric field to plot: the data rows have ${keys.length ? keys.join(', ') : 'no keys'}, and none but ${xf} is a number. Pass options.yField naming the numeric key.` };
    }
    out.yField = y; inferred.yField = y;
  }
  return Object.keys(inferred).length ? { options: out, inferred } : { options: out };
}

/**
 * A lifetime (bornAt / ttl, seconds) as a VISIBILITY WINDOW, [bornAt, bornAt + ttl).
 *
 * THE ENGINE HAS NO LIFETIME, and the first answer here (5bfc480) wrote one as
 * hard-cut opacity keys merged into the item's own track. That failed four
 * ways once items also had keyframes (ads production): keyframe_animate
 * replaced the track and the ttl cut was lost (1.83); opacity-only cut keys
 * broke the position track through the engine's missing-property rule (2.30 →
 * 1.84); authored opacity and the cuts blended instead of multiplying (1.85);
 * and exact-time hand-offs left a blank frame (1.86).
 *
 * So it is no longer keys. ONE frame callback ('pp_lifetimes') sets
 * item.visible from the window for every item with a lifetime, reading each
 * item's live data.bornAt / ttl, from the frame's own time: event.sceneTime,
 * which both the export's step and sceneAt supply, else app.playbackTime. The
 * export runs frame callbacks inside app.update() before it draws each step
 * (VideoExporter._advanceToTime), so exports honour it. visible, not opacity,
 * so it composes with any keyframes — the engine's own clip window hides the
 * same way for the same reason. A 1-microsecond tolerance makes a hand-off at
 * an exact frame time show exactly one item.
 *
 * Runtime-only: a scene saved and reopened keeps data.bornAt / ttl (the cloud
 * renderer reads those) but not the callback, until the studio reads the
 * fields itself — the result says so. Lifetimes applied the old way are
 * migrated: their tagged opacity keys are removed.
 */
function emitLifetime(itemExpr: string, bornAt: unknown, ttl: unknown): string {
  const b = Number(bornAt);
  const t = Number(ttl);
  const born = Number.isFinite(b) && b > 0 ? b : 0;
  const span = Number.isFinite(t) && t > 0 ? t : null;
  return `
(function(it) {
  if (!it || !it.data) return;
  it.data.bornAt = ${born};
  ${span === null ? 'delete it.data.ttl;' : `it.data.ttl = ${span};`}
  if (Array.isArray(it.data.keyframes) && it.data.keyframes.some(function(k) { return k && k._lifetime; })) {
    it.data.keyframes = it.data.keyframes.filter(function(k) { return !(k && k._lifetime); });
  }
  // THE STUDIO'S OWN LIFETIME, WHEN IT HAS ONE (FxTool bf1a656b): same window,
  // same tolerance, applied in the frame loop, on scrub and in export — and it
  // PERSISTS through save / reload, which the callback below cannot. Passed
  // straight through; the callback is only the fallback for older studios.
  if (typeof app.setLifetime === 'function') {
    const __r = app.setLifetime(it, ${born}, ${span === null ? 'null' : span});
    if (!__r || __r.ok === false) {
      __lifetime = { bornAt: ${born}, ttl: ${span}, applied: false, error: (__r && __r.error) || 'the studio refused the lifetime' };
      return;
    }
    const __G = globalThis.__ppMcp;
    if (__G && __G.lifetimeApp === app && __G.lifetimeIds) __G.lifetimeIds.delete(it.data.registryId || it.data.id);
    __lifetime = { bornAt: ${born}, ttl: ${span}, applied: true, via: 'engine', persists: true };
    return;
  }
  const rid = it.data.registryId || it.data.id;
  // MCP-owned page state lives on globalThis, not on app: it is not an engine
  // member, and the engine-surface guard reads app.X as a claim that it is.
  const __pp = globalThis.__ppMcp = globalThis.__ppMcp || {};
  // Keyed to THIS studio: a re-initialised app has none of the old one's
  // callbacks, so the registration and the id set start again with it.
  if (__pp.lifetimeApp !== app) { __pp.lifetimeApp = app; __pp.lifetimeIds = new Set(); }
  if (typeof app.addOnFrameCallback !== 'function' || !rid) {
    __lifetime = { bornAt: ${born}, ttl: ${span}, applied: false, note: 'stored on the item, but this studio has no frame callbacks, so it shows for the whole local render (a cloud render honours it).' };
    return;
  }
  __pp.lifetimeIds = __pp.lifetimeIds || new Set();
  __pp.lifetimeIds.add(rid);
  const within = function(x, now) {
    const b0 = x.data.bornAt, t0 = x.data.ttl;
    return now >= b0 - 1e-6 && (typeof t0 !== 'number' || now < b0 + t0 - 1e-6);
  };
  // The visibility pass itself, kept where a still export can call it too
  // (a seek alone does not run frame callbacks).
  __pp.applyLifetimes = function(now) {
    __pp.lifetimeIds.forEach(function(id) {
      const e = app.itemRegistry && app.itemRegistry.get(id);
      const x = e && e.item;
      if (!x || !x.data || typeof x.data.bornAt !== 'number') { __pp.lifetimeIds.delete(id); return; }
      const vis = within(x, now);
      if (x.visible !== vis) x.visible = vis;
    });
  };
  // Registered EVERY time, not once behind a flag: clearCanvas / start_job
  // remove frame callbacks, and a stale "already registered" flag left every
  // later scene's lifetimes doing nothing (retest of 28a4a0e). Re-adding the
  // same id replaces it.
  app.addOnFrameCallback('pp_lifetimes', function(ev) {
    const now = ev && typeof ev.sceneTime === 'number' ? ev.sceneTime : (typeof app.playbackTime === 'number' ? app.playbackTime : 0);
    __pp.applyLifetimes(now);
  });
  it.visible = within(it, typeof app.playbackTime === 'number' ? app.playbackTime : 0);
  __lifetime = { bornAt: ${born}, ttl: ${span}, applied: true, via: 'visibility',
    note: 'applied as visibility, so it composes with keyframes. Runtime-only until the studio reads bornAt / ttl itself: a scene reopened in the editor keeps the fields (and a cloud render honours them) but must be re-timed to play locally.' };
  if (it.data.clipInPoint !== undefined || it.data.clipOutPoint !== undefined) {
    __lifetime.warning = 'this item also has a clip window (clipInPoint / clipOutPoint), which hides it by the same means — the two can fight. Use one.';
  }
})(${itemExpr});`;
}

/**
 * Template for modifying items
 */
function generateModifyItemCode(
  itemId: string,
  properties: Record<string, unknown>,
  dataFlags?: Record<string, unknown>
): string {
  const { contentType, contentFormat, countdownTarget, countdownEndText, ...restProperties } = properties;
  // A new fit box is applied here (emitTextFit, with the hold carried over),
  // not by modifyItem: the engine's modify fits it with no hold, overwriting
  // the one this reads back. fit: null still goes through — that is the
  // engine's "stop fitting".
  if (restProperties.fit && typeof restProperties.fit === 'object') delete restProperties.fit;
  const modDirection = takeDirection(restProperties);
  const modTabular = wantsTabular(restProperties) === true;
  const modStrokePos = takeStrokePosition(restProperties, true);

  // modifyItem(id, changes), NOT select() + modify().
  //
  // modify() operates on the SELECTION, so this selected an id and then edited
  // whatever was selected — on an id that does not resolve, select changes
  // nothing and modify edits the PREVIOUS selection instead. modifyItem takes
  // the reference and returns false when it cannot resolve it, which is the
  // answer this emitter needs and never asked for.
  //
  // The warning the engine logs on that path is console.warn, which production
  // strips, so the failure was invisible twice over.
  let code = `
// Modify item ${itemId}
let _modified = true;`;

  if (Object.keys(restProperties).length > 0) {
    code += `
_modified = app.modifyItem('${itemId}', ${JSON.stringify(restProperties, null, 2)}) !== false;
if (!_modified) { return { success: false, error: 'no item ${itemId} — nothing was modified' }; }`;
  } else {
    code += `
if (!app.getItemById('${itemId}')) { return { success: false, error: 'no item ${itemId}' }; }`;
  }

  // Handle dynamic content type changes
  if (contentType !== undefined) {
    if (contentType === null || contentType === 'none' || contentType === '') {
      // Remove dynamic content
      code += `
const entry = app.itemRegistry.get('${itemId}');
if (entry && entry.item && app.removeDynamicContent) app.removeDynamicContent(entry.item);`;
    } else {
      // Set dynamic content
      const opts: Record<string, unknown> = {};
      if (contentFormat) opts.format = contentFormat;
      if (countdownTarget !== undefined) opts.countdownTarget = countdownTarget;
      if (countdownEndText) opts.countdownEndText = countdownEndText;
      code += `
const entry = app.itemRegistry.get('${itemId}');
if (entry && entry.item && app.setDynamicContent) app.setDynamicContent(entry.item, '${contentType}', ${JSON.stringify(opts)});`;
    }
  }

  // AN AUDIO ITEM'S LEVEL IS NOT AN ITEM PROPERTY. modifyItem applies changes
  // to the Paper item (an audio item's is an invisible sentinel), so
  // {audioGain} / {volume} answered success and moved nothing (measured 0.0 dB).
  // The mix reads registry properties.audioGain; the live player has its own
  // volume. Both are set, and gain is kept in step for the editor.
  const levelKey = ['audioGain', 'volume', 'gain'].find((k) => typeof properties[k] === 'number');
  if (levelKey) {
    const level = Math.max(0, Math.min(1, properties[levelKey] as number));
    code += `
const _ae = app.itemRegistry.get('${itemId}');
if (_ae && _ae.type === 'audio') {
  _ae.properties = _ae.properties || {};
  _ae.properties.audioGain = ${level};
  _ae.properties.gain = ${level};
  const _A = (typeof window !== 'undefined') && window.PinePaperAgent;
  const _m = _A && typeof _A.listMedia === 'function' ? _A.listMedia().find(function(x) { return x.registryId === '${itemId}'; }) : null;
  if (_m && app.audioLayer && typeof app.audioLayer.setVolume === 'function') app.audioLayer.setVolume(${level}, _m.id);
}`;
  }

  // Raster resampling (pixel art: 'off'). A Paper Raster property modifyItem
  // does not pass on; applied to a raster, or to the raster an image group holds.
  if (typeof properties.smoothing === 'string') {
    code += `
const _sm = app.itemRegistry.get('${itemId}');
const _smR = _sm && _sm.item && (_sm.item.className === 'Raster' ? _sm.item
  : (typeof _sm.item.getItem === 'function' ? _sm.item.getItem({ className: 'Raster' }) : null));
if (_smR) _smR.smoothing = ${JSON.stringify(properties.smoothing)};`;
  }

  // No fill on modify too: null / 'transparent' / 'none' clear it outright,
  // after modifyItem, which would otherwise read 'transparent' as black.
  const fillNone = (v: unknown) => v === null || (typeof v === 'string' && /^(transparent|none)$/i.test(v.trim()));
  if (fillNone(properties.fillColor) || (properties.fillColor === undefined && properties.color !== undefined && fillNone(properties.color))) {
    code += `
const _nf = app.itemRegistry.get('${itemId}');
if (_nf && _nf.item) _nf.item.fillColor = null;`;
  }

  // SKEW AND AFFINE, FOR MOCKUPS (round 9 HH). A box face or a phone screen in
  // perspective-ish mockups is a shear / affine map; modify_item reported
  // skewX / shear / matrix as ignored and the only route was custom code.
  // Paper does both: item.shear(tan x, tan y) about the centre, and
  // item.transform(Matrix). They are APPLIED to the current shape — a second
  // call compounds — not stored as settable properties; the result says so.
  const skewX = typeof properties.skewX === 'number' ? properties.skewX : 0;
  const skewY = typeof properties.skewY === 'number' ? properties.skewY : 0;
  const matrix = Array.isArray(properties.matrix) && properties.matrix.length === 6 && properties.matrix.every((n) => typeof n === 'number')
    ? properties.matrix as number[] : null;
  const affine = skewX !== 0 || skewY !== 0 || matrix !== null;
  if (affine) {
    code += `
const _af = app.itemRegistry.get('${itemId}');
const _afi = _af && _af.item;
if (_afi) {
  ${skewX !== 0 || skewY !== 0 ? `_afi.shear(Math.tan(${skewX} * Math.PI / 180), Math.tan(${skewY} * Math.PI / 180), _afi.bounds.center);` : ''}
  ${matrix ? `_afi.transform(new paper.Matrix(${matrix.join(', ')}));` : ''}
}`;
  }

  const modFit = properties.fit && typeof properties.fit === 'object' ? properties.fit as Record<string, unknown> : null;
  if (modFit) {
    code += `
let __textFit = null;
const _tf = app.itemRegistry.get('${itemId}');${emitTextFit('_tf && _tf.item', modFit, JSON.stringify(anchorHold(properties.anchor ?? properties.origin) ?? null) + " || (_tf && _tf.item && _tf.item.data && _tf.item.data.fitBox && _tf.item.data.fitBox.hold)")}`;
  }

  const textStyle = emitTextStyle('_ts && _ts.item', properties);
  if (textStyle) {
    code += `
const _ts = app.itemRegistry.get('${itemId}');${textStyle}`;
  }

  const modLifetime = properties.bornAt !== undefined || properties.ttl !== undefined;
  if (modLifetime) {
    code += `
let __lifetime = null;
const _lt = app.itemRegistry.get('${itemId}');${emitLifetime('_lt && _lt.item', properties.bornAt, properties.ttl)}`;
  }

  if (dataFlags && Object.keys(dataFlags).length > 0) {
    code += `
const _flagged = app.itemRegistry.get('${itemId}');
if (_flagged && _flagged.item && _flagged.item.data) Object.assign(_flagged.item.data, ${JSON.stringify(dataFlags)});`;
  }

  const modFont = typeof properties.fontFamily === 'string' && properties.fontFamily.trim() !== '';

  // AN UNREAD KEY HAD NO EFFECT, AND THE CALL SAID SUCCESS. {scaling: 8} on a
  // raster answered success and left it 16 px; the engine reads `scale`. Same
  // report create_item gives, against the engine's modify path (generated).
  const modIgnored = Object.keys(properties).filter((k) => !MODIFY_KNOWN_KEYS.has(k));
  const modWarning = modIgnored.length === 0 ? '' : `, ignoredProperties: ${JSON.stringify(modIgnored)}, warning: ${JSON.stringify(
    `${modIgnored.join(', ')} ${modIgnored.length > 1 ? 'are' : 'is'} not read when modifying an item, so ${modIgnored.length > 1 ? 'they had' : 'it had'} no effect.`
    + modIgnored.filter((k) => MODIFY_DID_YOU_MEAN[k]).map((k) => ` Did you mean ${MODIFY_DID_YOU_MEAN[k]} (not ${k})?`).join(''),
  )}`;
  code += `
app.historyManager.saveState();
${modDirection ? emitDirectionCheck(`app.getItemById('${itemId}')`, modDirection) : ''}${modTabular ? emitTabularCheck(`app.getItemById('${itemId}')`) : ''}${modStrokePos ? emitStrokePositionCheck(`app.getItemById('${itemId}')`, modStrokePos) : ''}
return { success: true, itemId: '${itemId}'${modFit ? ', textFit: __textFit' : ''}${modDirection ? ', direction: __direction' : ''}${modTabular ? ', tabularFigures: __tabular' : ''}${modStrokePos ? ', strokePosition: __strokePos' : ''}${affine ? `, affine: ${JSON.stringify({ skewX, skewY, matrix, note: 'applied to the current shape: calling again compounds it. To undo, apply the inverse (negative skew, or the inverse matrix).' })}` : ''}${modLifetime ? ', lifetime: __lifetime' : ''}${modFont ? ', ...(__font ? { font: __font } : {})' : ''}${modWarning} };`;

  // Wrapped, because the body now RETURNS early on a miss rather than falling
  // through to an unconditional success. Async only when a font must load
  // before modifyItem re-measures the text.
  if (modFont) {
    return `(async function() {${emitEnsureFont(properties.fontFamily as string)}\n${code.trim()}\n})();`;
  }
  return `(function() {\n${code.trim()}\n})();`;
}

/**
 * Template for deleting items
 */
function generateDeleteItemCode(itemId: string): string {
  return `
// Delete item ${itemId}
//
// Delegate to app.deleteItem rather than hand-rolling the removal. The old
// inline version called \`app.itemRegistry.remove(...)\`, which does not exist —
// the method is \`unregister\` — so the Paper item left the canvas while its
// REGISTRY ROW SURVIVED, pointing at a detached object. The scene then reported
// nodes that were not on screen, agents could still address them, and relations
// to them looked alive. It also skipped the identity-keyed trackers
// (animatedItems / keyframeItems / selectedItems), so a deleted item that was
// animating kept being ticked every frame.
//
// app.deleteItem does all of that, plus the redraw, the history snapshot and
// the collaboration mutation event, and it resolves any ref form.
(function () {
  if (typeof app.deleteItem !== 'function') {
    return { success: false, error: 'app.deleteItem unavailable — update FxTool' };
  }
  const ok = app.deleteItem('${itemId}');
  if (!ok) {
    return { success: false, error: 'Item not found: ${itemId}' };
  }
  return { success: true, itemId: '${itemId}' };
})();
`.trim();
}

/**
 * Template for adding relations
 */
function generateAddRelationCode(
  sourceId: string,
  targetId: string,
  relationType: RelationType,
  params: Record<string, unknown>
): string {
  // AN UNKNOWN ENDPOINT IS REFUSED, NOT STORED (round 9 GG, 1.74). The engine
  // stores a relation to an id it cannot resolve, returns true, and says "it
  // will be skipped every frame and nothing will move" only in a warning this
  // tool never sees. Its own test for that warning — _isKnownRelationEndpoint:
  // an item, the camera, a cursor target — is asked first here, after the same
  // '#id' forgiveness the engine applies.
  return `
// Add ${relationType} relation: ${sourceId} -> ${targetId}
(function() {
  const norm = function(id) { return typeof app._resolveRelationEndpoint === 'function' ? app._resolveRelationEndpoint(id) : id; };
  if (typeof app._isKnownRelationEndpoint === 'function') {
    const bad = [${JSON.stringify(sourceId)}, ${JSON.stringify(targetId)}].filter(function(id) { return !app._isKnownRelationEndpoint(norm(id)); });
    if (bad.length) {
      return { success: false, relationType: '${relationType}', error: bad.map(function(id) { return JSON.stringify(id); }).join(' and ')
        + ' ' + (bad.length > 1 ? 'are not items' : 'is not an item') + ' on the canvas, so the relation would be stored and skipped every frame. Check the id (pinepaper_get_items lists them).' };
    }
  }
  const success = app.addRelation('${sourceId}', '${targetId}', '${relationType}', ${JSON.stringify(params, null, 2)});
  if (!success) {
    return { success: false, relationType: '${relationType}', error: 'the studio refused the ${relationType} relation between ${sourceId} and ${targetId}.' };
  }
  app.historyManager.saveState();
  return { success: true, sourceId: '${sourceId}', targetId: '${targetId}', relationType: '${relationType}' };
})();
`.trim();
}

/**
 * moves_along_path, from the parameters a caller actually writes.
 *
 * The rule is a SELF relation reading params.path as a point array, with speed
 * (1 = 150 px/s), closed, phase, easing, signal, equation. The natural call —
 * targetId: <a path item>, params {pathId, duration, delay} — named none of
 * those, so the relation had no path, returned success:true, and the whiteboard
 * hand never moved (round 7 AA, 2.25). Here:
 *   - a path ITEM (targetId other than the source, or params.pathId) is
 *     sampled into points in the page, closed taken from the item;
 *   - duration (seconds for one traversal) becomes speed;
 *   - delay becomes the relation's window start (relation time is
 *     window-relative, so the ride starts at `delay`);
 *   - with neither points, a path item nor an equation, it is refused by name.
 */
function generateMovesAlongPathCode(sourceId: string, targetId: string | undefined, raw: Record<string, unknown>): string {
  const { pathId, duration, delay, offset, ...params } = raw;
  const ref = (typeof pathId === 'string' && pathId) || (targetId && targetId !== sourceId ? targetId : null);
  const off = Array.isArray(offset) && offset.length >= 2 ? [Number(offset[0]) || 0, Number(offset[1]) || 0] : null;
  const hasDuration = typeof duration === 'number' && duration > 0;
  const hasDelay = typeof delay === 'number' && delay > 0;
  return `
// moves_along_path: ${sourceId}${ref ? ` along ${ref}` : ''}
(function() {
  const params = ${JSON.stringify(params)};
  const hasPoints = Array.isArray(params.path) && params.path.length >= 2;
  // A STUDIO THAT RIDES THE PATH ITSELF. From FxTool c16c9dd3 the rule
  // declares duration / delay / offset and, with a path item as its target and
  // no points, follows that path's LIVE geometry on the playhead. Sampling it
  // into static points here would shadow that, so on such a build everything
  // is passed straight through and the target is the route.
  const rule = app.relationRegistry && typeof app.relationRegistry.getRule === 'function'
    ? app.relationRegistry.getRule('moves_along_path') : null;
  const native = !!(rule && rule.params && rule.params.duration);
  if (native && !hasPoints && !params.equation ${ref ? '' : '&& false'}) {
    ${hasDuration ? `params.duration = ${duration};` : ''}
    ${hasDelay ? `params.delay = ${delay};` : ''}
    ${off ? `params.offset = ${JSON.stringify(off)};` : ''}
    const okN = app.addRelation(${JSON.stringify(sourceId)}, ${JSON.stringify(ref ?? sourceId)}, 'moves_along_path', params);
    if (!okN) return { success: false, error: 'the studio refused the moves_along_path relation.' };
    app.historyManager.saveState();
    return { success: true, sourceId: ${JSON.stringify(sourceId)}, relationType: 'moves_along_path', route: 'live-path', target: ${JSON.stringify(ref)}, params: params };
  }
  if (!hasPoints && !params.equation) {
    ${ref ? `const e = app.itemRegistry && app.itemRegistry.get(${JSON.stringify(ref)});
    let p = e && e.item;
    if (p && p.className !== 'Path' && p.className !== 'CompoundPath' && typeof p.getItem === 'function') {
      p = p.getItem({ className: 'Path' });
    }
    if (!p || typeof p.getPointAt !== 'function' || !(p.length > 0)) {
      return { success: false, error: ${JSON.stringify(ref)} + ' is not a path with length — moves_along_path needs a path item, or params.path as points [[x, y], …].' };
    }
    const N = Math.min(240, Math.max(16, Math.ceil(p.length / 6)));
    params.path = Array.from({ length: N + 1 }, function(_, i) { const q = p.getPointAt(Math.min(p.length, p.length * i / N)); return [q.x, q.y]; });
    if (params.closed === undefined) params.closed = !!p.closed;` : `return { success: false, error: 'moves_along_path needs a path: pass targetId (or params.pathId) naming a path item, or params.path as points [[x, y], …], or params.equation. With none, the item would not move.' };`}
  }
  ${off ? `// offset, with the ENGINE's meaning (c16c9dd3): [dx, dy] is added to the
  // point on the path to place the item — so a hand whose pen tip sits
  // (-dx, -dy) from its centre keeps the tip on the stroke. The same value
  // therefore behaves the same on a build that reads offset natively.
  if (Array.isArray(params.path)) params.path = params.path.map(function(q) {
    const x = Array.isArray(q) ? q[0] : q.x, y = Array.isArray(q) ? q[1] : q.y;
    return [x + ${off[0]}, y + ${off[1]}];
  });` : ''}
  ${hasDuration ? `if (params.speed === undefined && Array.isArray(params.path)) {
    const pts = params.path.map(function(q) { return Array.isArray(q) ? { x: q[0], y: q[1] } : q; });
    const len = pts.slice(1).reduce(function(acc, q, i) { return acc + Math.hypot(q.x - pts[i].x, q.y - pts[i].y); }, 0);
    if (len > 0) params.speed = len / (150 * ${duration});
    if (params.closed === undefined) params.closed = false;
  }` : ''}
  ${hasDelay ? `if (!params.window) params.window = { start: ${delay} };` : ''}
  // Before its window opens the relation does not run, so the item stays where
  // it was left — the retest saw it parked at the path END. Put it at the start.
  if (Array.isArray(params.path) && params.path.length) {
    const src = app.itemRegistry && app.itemRegistry.get(${JSON.stringify(sourceId)});
    const q0 = params.path[0];
    if (src && src.item && src.item.position) { src.item.position.x = Array.isArray(q0) ? q0[0] : q0.x; src.item.position.y = Array.isArray(q0) ? q0[1] : q0.y; }
  }
  const ok = app.addRelation(${JSON.stringify(sourceId)}, ${JSON.stringify(sourceId)}, 'moves_along_path', params);
  if (!ok) return { success: false, error: 'the studio refused the moves_along_path relation.' };
  app.historyManager.saveState();
  return { success: true, sourceId: ${JSON.stringify(sourceId)}, relationType: 'moves_along_path', route: 'sampled-points',
    points: Array.isArray(params.path) ? params.path.length : 0, speed: params.speed, closed: params.closed,
    ${ref ? `pathFrom: ${JSON.stringify(ref)},` : ''} window: params.window };
})();`.trim();
}

/**
 * Parameter names a generator's docs used that the engine does not read.
 *
 * drawWindField was documented with `direction` and `speed`; the engine reads
 * windDirection and windSpeed, so the documented call drew wind blowing the
 * default way (round 8 BB, 5.56). The docs are corrected, and the published
 * spellings are mapped because callers followed them. An explicit engine name
 * always wins.
 */
const GENERATOR_PARAM_ALIASES: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  drawWindField: { direction: 'windDirection', speed: 'windSpeed' },
};
function aliasGeneratorParams(name: string, params: Record<string, unknown>): Record<string, unknown> {
  const map = GENERATOR_PARAM_ALIASES[name];
  if (!map) return params;
  const out = { ...params };
  for (const [from, to] of Object.entries(map)) {
    if (out[from] !== undefined && out[to] === undefined) { out[to] = out[from]; delete out[from]; }
  }
  return out;
}

/**
 * Template for removing relations
 */
function generateRemoveRelationCode(
  sourceId: string,
  targetId: string,
  relationType?: RelationType
): string {
  const relationArg = relationType ? `'${relationType}'` : 'undefined';
  return `
// Remove relation: ${sourceId} -> ${targetId}${relationType ? ` (${relationType})` : ''}
app.removeRelation('${sourceId}', '${targetId}', ${relationArg});
app.historyManager.saveState();

// Return success
({ success: true, sourceId: '${sourceId}', targetId: '${targetId}' });
`.trim();
}

/**
 * Template for querying relations
 */
function generateQueryRelationsCode(
  itemId: string,
  relationType?: RelationType,
  direction: 'outgoing' | 'incoming' = 'outgoing'
): string {
  if (direction === 'outgoing') {
    const typeArg = relationType ? `'${relationType}'` : 'undefined';
    return `
// Query outgoing relations for ${itemId}
const relations = app.getRelations('${itemId}', ${typeArg});

// Format results
const formatted = relations.map(r => ({
  sourceId: r.sourceId || '${itemId}',
  // RelationRegistry.getAssociations returns { relation, target, params } —
  // there is no \`targetId\` on it. Reading the wrong field made EVERY edge come
  // back with an undefined destination, so the graph was unreadable through
  // this tool even though it was wired correctly on the canvas.
  targetId: r.target ?? r.targetId ?? null,
  relationType: r.relation || r.type,
  params: r.params || {}
}));

({ relations: formatted });
`.trim();
  } else {
    const typeArg = relationType ? `'${relationType}'` : 'undefined';
    return `
// Query incoming relations for ${itemId}
const results = app.queryByRelationTarget('${itemId}', ${typeArg});

// Format results
const relations = results.map(r => ({
  sourceId: r.itemId,
  targetId: '${itemId}',
  // queryByTarget returns the real relation name on each result. Hardcoding
  // the filter string labelled every edge 'unknown' on an unfiltered query —
  // which is exactly the query you make when exploring an unfamiliar graph.
  relationType: r.relation || ${relationType ? `'${relationType}'` : "'unknown'"},
  params: r.params || {}
}));

({ relations });
`.trim();
  }
}

/**
 * Template for simple animation
 */
function generateAnimateCode(
  itemId: string,
  animationType: SimpleAnimationType,
  speed: number,
  intensity?: number,
  delay?: number
): string {
  const extra =
    (intensity !== undefined ? `,\n  animationIntensity: ${intensity}` : '') +
    (delay !== undefined ? `,\n  animationDelay: ${delay}` : '');
  return `
// Apply ${animationType} animation to ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}
app.animate(item, {
  animationType: '${animationType}',
  animationSpeed: ${speed}${extra}
});

// The engine records a refused type on the item rather than throwing, because
// animate() is on too many paths for a throw to be safe. It used to warn only
// to a console the production build strips, so an unknown type left the item
// still and every caller told it had worked. Read the record back.
(() => {
  const r = item.data && item.data.animationRejected;
  if (r) {
    return {
      success: false,
      itemId: '${itemId}',
      error: 'Unknown animationType "' + r.requested + '" — nothing will move.',
      requested: r.requested,
      known: r.known,
    };
  }
  return { success: true, itemId: '${itemId}', animationType: '${animationType}' };
})();
`.trim();
}

/**
 * PinePaper's keyframe interpolator only tweens `position` when it is an [x, y]
 * ARRAY. Callers (and other agents) routinely pass a { x, y } object, which is
 * silently ignored — the item then stays frozen for the whole animation. Accept
 * both shapes by normalizing { x, y } -> [x, y] before the keyframes are emitted.
 */
function normalizeKeyframePositions<T extends { properties?: Record<string, unknown> }>(keyframes: T[]): T[] {
  return (keyframes || []).map((kf) => {
    const props = (kf as any)?.properties;
    const p = props?.position;
    if (p && !Array.isArray(p) && typeof p === 'object' && 'x' in p && 'y' in p) {
      return { ...kf, properties: { ...props, position: [p.x, p.y] } } as T;
    }
    return kf;
  });
}

/**
 * Template for keyframe animation
 */
/**
 * AN UNKNOWN itemId IS A SILENT SUCCESS, ACROSS A WHOLE FAMILY OF TOOLS.
 *
 * `app.addAnimation('c0', …)` on an id that does not exist calls
 * console.warn and returns undefined — and production strips console.warn, so
 * over MCP nothing is said at all. The emitter then returned
 * `{success: true}` because the call did not throw. A pilot animated a
 * connector id that was never registered and got success for every keyframe.
 *
 * Emitted as a shared preamble so the check reads the same everywhere and a
 * new tool taking an itemId can adopt it in one line. It resolves through the
 * registry the way the engine does, and names the id it could not find —
 * "item_7 is not on the canvas" is actionable, silence is not.
 */
function requireItem(itemId: string, what: string): string {
  return `
const _target = (app.getItemById && app.getItemById(${JSON.stringify(itemId)}))
  || (app.itemRegistry && app.itemRegistry.get && app.itemRegistry.get(${JSON.stringify(itemId)}));
if (!_target) {
  return { success: false, error: ${JSON.stringify(itemId)} + ' is not on the canvas, so ' + ${JSON.stringify(what)} + ' would have done nothing. Check the id with pinepaper_get_items — create returns the registry id, not the Paper id.' };
}`.trim();
}

function generateKeyframeAnimateCode(
  itemId: string,
  keyframes: Keyframe[],
  duration?: number,
  loop: boolean = false,
  timeOffset?: number,
  clipInPoint?: number,
  clipOutPoint?: number,
  timeUnits?: 'seconds' | 'ms'
): string {
  const keyframesJson = JSON.stringify(normalizeKeyframePositions(keyframes), null, 2);
  const calculatedDuration = duration || Math.max(...keyframes.map(k => k.time));

  const opts: Record<string, unknown> = { duration: calculatedDuration, loop };
  if (timeOffset !== undefined) opts.timeOffset = timeOffset;
  if (clipInPoint !== undefined) opts.clipInPoint = clipInPoint;
  if (clipOutPoint !== undefined) opts.clipOutPoint = clipOutPoint;
  if (timeUnits !== undefined) opts.timeUnits = timeUnits;

  // A FADE ON AN AUDIO ITEM WAS ACCEPTED AND NEVER HEARD. addAnimation keyframes
  // the audio item's sentinel, and the mix reads one static audioGain per clip,
  // so {audioGain: 0→1} answered success, duration 15, and exported at a flat
  // level (measured). Refused by name, before anything is added, and only for
  // audio items — a `volume` key on a shape is some other thing.
  const levelKeys = [...new Set(keyframes.flatMap((k) => Object.keys((k as { properties?: object }).properties ?? {})))]
    .filter((k) => k === 'audioGain' || k === 'volume' || k === 'gain');
  // UNLESS THE STUDIO ANIMATES IT. From FxTool fcec0194 keyed gain / volume
  // are real — fades and ducks bake into the export at the measured level —
  // and listAnimatableProperties lists them with appliesTo 'audio'. That list
  // is the feature check: a key it names for audio passes through, anything
  // else on an audio item is still refused (prod, until that build ships).
  const audioLevelGuard = levelKeys.length === 0 ? '' : `
  const __ae = app.itemRegistry && app.itemRegistry.get('${itemId}');
  let __audioKeyed = [];
  try {
    const __l = typeof app.listAnimatableProperties === 'function' ? app.listAnimatableProperties() : null;
    __audioKeyed = ((__l && __l.properties) || []).filter(function(p) { return p && p.appliesTo === 'audio'; }).map(function(p) { return p.name; });
  } catch (_) { /* treat as unsupported */ }
  const __unsupported = ${JSON.stringify(levelKeys)}.filter(function(k) { return __audioKeyed.indexOf(k) === -1; });
  if (__ae && __ae.type === 'audio' && __unsupported.length) {
    return { success: false, itemId: '${itemId}', error: __unsupported.join(', ') + ' cannot be keyframed on an audio item in this studio: it mixes each audio clip at one fixed level, so a fade would be accepted and not heard. Nothing was added. '
      + (__audioKeyed.length ? 'Keyable on audio here: ' + __audioKeyed.join(', ') + '. ' : '')
      + 'Set a static level with pinepaper_modify_item {audioGain: 0..1}.' };
  }`;

  // Easing is read from the DESTINATION keyframe, so easing on the first one
  // never applies — a Ken Burns eased only there rendered linear. Said in the
  // result rather than silently moved: moving it would change what the other
  // keys the caller wrote mean.
  // A KEY THAT LEAVES A PROPERTY OUT (round 9 HH, engine 2.30): the engine
  // treats the gap as a break in that property's track rather than holding or
  // interpolating across it, silently. Named here — which keys lack which
  // properties — with the fix a caller can make now: give every key the full set.
  const propSets = keyframes.map((k) => Object.keys((k as { properties?: object }).properties ?? {}));
  const allProps = [...new Set(propSets.flat())];
  const gaps = keyframes
    .map((k, i) => ({ time: k.time, missing: allProps.filter((p) => !propSets[i].includes(p)) }))
    .filter((g) => g.missing.length);
  const gapNote = gaps.length && keyframes.length > 1
    ? `, propertyGaps: ${JSON.stringify(gaps.slice(0, 10))}, gapWarning: ${JSON.stringify(`${gaps.length} keyframe(s) leave out a property other keys animate (${[...new Set(gaps.flatMap((g) => g.missing))].join(', ')}). The engine can break that property's track at such a key; repeat the value on every key — hold it by repeating the previous value.`)}`
    : '';
  const first = [...keyframes].sort((a, b) => a.time - b.time)[0] as { easing?: string } | undefined;
  // loop:true repeats in the editor; an export of the measured build played
  // the keyframes ONCE and held (round 7, 2.24). Said where it is set, with
  // the two ways that do export, until the engine's export clock wraps them.
  const loopNote = loop
    ? `, loopNote: ${JSON.stringify('loop:true repeats in the editor, but has been measured playing ONCE in an exported video and then holding the last keyframe. For an export longer than one cycle, check a frame in the second cycle — if it holds, write the keyframes out per cycle, or use a loop preset (pinepaper_animate), which does cycle in export.')}`
    : '';
  const easingNote = first?.easing && first.easing !== 'linear'
    ? `, note: ${JSON.stringify(`easing '${first.easing}' is on the first keyframe, where it has no effect: easing shapes the segment ARRIVING at a keyframe. Put it on the keyframe you are moving to.`)}`
    : '';

  return `
// Apply keyframe animation to ${itemId}
(function() {
  ${requireItem(itemId, 'the animation')}${audioLevelGuard}
  app.addAnimation('${itemId}', ${keyframesJson}, ${JSON.stringify(opts)});
  return { success: true, itemId: '${itemId}', duration: ${calculatedDuration}, loop: ${loop}${timeOffset !== undefined ? `, timeOffset: ${timeOffset}` : ''}${clipInPoint !== undefined ? `, clipInPoint: ${clipInPoint}` : ''}${clipOutPoint !== undefined ? `, clipOutPoint: ${clipOutPoint}` : ''}${easingNote}${loopNote}${gapNote} };
})();
`.trim();
}

/**
 * Template for executing generators
 */
function generateImportMotionCaptureCode(
  bvh: string,
  mode: 'import' | 'retarget',
  skeletonId?: string,
  opts: Record<string, unknown> = {}
): string {
  // Both FxTool entry points are async and return {ok, ...} rather than throwing, so the failure
  // path is a value the model can read (unmatchedSource/unmatchedTarget tell it exactly which bone
  // names to put in boneMap) instead of an opaque exception.
  const bvhLiteral = JSON.stringify(bvh);
  const optsLiteral = JSON.stringify(opts);
  if (mode === 'retarget') {
    return `
// Retarget a BVH clip onto an existing rig — proportions from the rig, motion from the capture
(async function() {
  const res = await app.retargetBVH(${bvhLiteral}, ${JSON.stringify(skeletonId ?? '')}, ${optsLiteral});
  if (!res || res.ok === false) {
    return { success: false, error: (res && res.error) || 'retarget failed',
             unmatchedSource: res && res.unmatchedSource, unmatchedTarget: res && res.unmatchedTarget };
  }
  return { success: true, skeletonId: res.skeletonId, matched: res.matched,
           unmatchedSource: res.unmatchedSource, unmatchedTarget: res.unmatchedTarget };
})()`;
  }
  return `
// Import a BVH clip as a NEW skeleton
(async function() {
  const res = await app.importBVH(${bvhLiteral}, ${optsLiteral});
  if (!res || res.ok === false) {
    return { success: false, error: (res && res.error) || 'import failed' };
  }
  return { success: true, skeletonId: res.skeletonId, bones: res.bones, poses: res.poses,
           duration: res.duration };
})()`;
}

function generateExecuteGeneratorCode(
  generatorName: GeneratorName,
  params: Record<string, unknown>,
  region?: GeneratorRegion
): string {
  const where = !region ? '' : region.width !== undefined
    ? ` in region ${region.width}×${region.height} @ (${region.x},${region.y})`
    : ` in the shape of ${(region.shape as { itemId: string }).itemId}`;
  return `
// Execute ${generatorName} generator${where}
(async function() {${emitGeneratorRun(generatorName, JSON.stringify(params, null, 2), region)}
})();
`.trim();
}

/**
 * Run a generator, optionally into a region, and return its result. Shared by
 * execute_generator and the batch op. FxTool signature:
 * app.executeGenerator(name, params, options), region in options (c81781c).
 *
 * A SHAPED REGION (c68524a2) falls back to a plain rectangle with only a
 * console.warn — for a missing item, or one that is not a path — and an older
 * engine drops the shape without a word (and, given only {itemId}, has no box
 * at all and draws full-canvas). So the item is checked first and refused by
 * name, and the result says whether this studio clips to shapes.
 */
function emitGeneratorRun(generatorName: string, paramsJson: string, region?: GeneratorRegion): string {
  const options = JSON.stringify(region ? { region } : {});
  const itemId = region && typeof region.shape === 'object' ? region.shape.itemId : null;
  const shaped = !!region && region.shape !== undefined && region.shape !== 'rect';
  return `${itemId ? `
  {
    const __se = app.itemRegistry && app.itemRegistry.get(${JSON.stringify(itemId)});
    const __si = __se && __se.item;
    if (!__si) return { success: false, error: ${JSON.stringify(`region.shape names no item "${itemId}" — nothing was drawn. List items with pinepaper_get_items.`)} };
    if (__si.className !== 'Path' && __si.className !== 'CompoundPath') return { success: false, error: ${JSON.stringify(`region.shape item "${itemId}" is a `)} + __si.className + ', and a clip needs a path (a shape, not text, a group or an image) — nothing was drawn.' };
  }` : ''}
  await app.executeGenerator('${generatorName}', ${paramsJson}, ${options});${shaped ? `
  const __shapes = !!(app.generatorRegistry && typeof app.generatorRegistry._regionClipPath === 'function');` : ''}
  return { success: true, generator: '${generatorName}'${region ? `, region: ${JSON.stringify(region)}` : ''}${shaped ? `, ...(__shapes ? {} : { regionShapeApplied: false, warning: ${JSON.stringify(`this studio does not clip generator regions to a shape, so ${typeof region!.shape === 'object' ? 'the region had no box and the generator drew across the whole canvas' : `the ${region!.shape} was drawn as a rectangle`}. It needs an engine with region shapes.`)} })` : ''} };`;
}

/**
 * Template for applying effects
 */
function generateApplyEffectCode(
  itemId: string,
  effectType: string,
  params: Record<string, unknown>
): string {
  return `
// Apply ${effectType} effect to ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}
app.applyEffect(item, '${effectType}', ${JSON.stringify(params, null, 2)});

({ success: true, itemId: '${itemId}', effectType: '${effectType}' });
`.trim();
}

/**
 * Template for getting items
 */
/**
 * radiusX / radiusY REACH NOTHING.
 *
 * The engine's create() feeds a shape's config from width, height and radius.
 * radiusX and radiusY are not among them, so an ellipse asked for
 * `{radiusX: 250, radiusY: 72}` was built at the DEFAULT 100x60 and reported
 * success — measured from production as "about 90x50". This package documented
 * that exact pair as the ellipse's properties and used it in two worked
 * examples, so a model following the guide got the wrong size every time and
 * nothing anywhere said why.
 *
 * Mapped rather than merely re-documented: the radii are the natural way to
 * describe an ellipse, the conversion is unambiguous (a radius is half its
 * axis), and a caller who already wrote radiusX should not have to rewrite it.
 * An explicit width/height wins, so nothing that works today changes.
 *
 * A COMPATIBILITY SHIM WITH A REMOVAL CONDITION. FxTool aaaf98ae aliases the
 * same pair in the engine's shared param normaliser, which is the better place
 * — it fixes every door at once, not just this one. This stays until that
 * reaches the studios this package is pointed at, which is not the same moment
 * it reaches origin/main: mcp-server ships independently and drives whatever
 * studio it is given. The two cannot fight, because this deletes radiusX
 * before the call, so the engine's alias never sees it.
 *
 * Delete this when a studio without aaaf98ae is no longer worth supporting.
 */
function withRadiusAxes(props: Record<string, unknown>): Record<string, unknown> {
  const { radiusX, radiusY, ...rest } = props;
  if (radiusX === undefined && radiusY === undefined) return props;
  const out: Record<string, unknown> = { ...rest };
  if (typeof radiusX === 'number' && out.width === undefined) out.width = radiusX * 2;
  if (typeof radiusY === 'number' && out.height === undefined) out.height = radiusY * 2;
  return out;
}

function generateGetItemsCode(filter?: {
  type?: ItemType;
  source?: string;
  hasAnimation?: boolean;
  hasRelation?: boolean;
}): string {
  // A filter OBJECT is not the same as a filter. `{}` is already handled, but
  // so is `{ type: undefined }` and anything whose keys this function does not
  // recognise: those have a non-zero key count and contribute no conditions,
  // and the emitted `entries.filter(entry => )` is a SYNTAX ERROR rather than
  // a wrong answer — the whole call dies before it runs. Decide on the
  // conditions, not on the keys.
  const conditions: string[] = [];
  if (filter?.type) conditions.push(`entry.type === '${filter.type}'`);
  if (filter?.source) conditions.push(`entry.source === '${filter.source}'`);
  if (filter?.hasAnimation !== undefined) {
    conditions.push(`!!entry.item.data?.animationType === ${filter.hasAnimation}`);
  }
  if (filter?.hasRelation !== undefined) {
    conditions.push(`(app.getRelations(entry.id || entry.itemId).length > 0) === ${filter.hasRelation}`);
  }

  if (conditions.length === 0) {
    return `
// Get all items
const entries = app.itemRegistry.getAll();
const items = entries.map(entry => ({
  id: entry.id || entry.itemId,
  type: entry.type,
  position: entry.item.position ? { x: entry.item.position.x, y: entry.item.position.y } : null,
  hasAnimation: !!entry.item.data?.animationType,
  relations: app.getRelations(entry.id || entry.itemId).map(r => r.relation || r.type)
}));

({ items, count: items.length });
`.trim();
  }

  return `
// Get items with filter
const entries = app.itemRegistry.getAll();
const filtered = entries.filter(entry => ${conditions.join(' && ')});
const items = filtered.map(entry => ({
  id: entry.id || entry.itemId,
  type: entry.type,
  position: entry.item.position ? { x: entry.item.position.x, y: entry.item.position.y } : null,
  hasAnimation: !!entry.item.data?.animationType,
  relations: app.getRelations(entry.id || entry.itemId).map(r => r.relation || r.type)
}));

({ items, count: items.length });
`.trim();
}

/**
 * Template for timeline control
 */
/** Options for the playback-rate and input-driven actions. */
export interface PlayTimelineExtra {
  rate?: number;
  progress?: number;
  scroll?: {
    elementId?: string;
    start?: string;
    end?: string;
    scrub?: number;
    range?: number[];
  };
}

// Where a scroll binding parks its unbind function. `bindTimelineToScroll`
// returns a FUNCTION, which cannot cross the tool boundary — so it lives on the
// page, where a later unbind_scroll call can still reach it.
const SCRUB_UNBIND_KEY = '__ppScrubUnbind';

function generatePlayTimelineCode(
  action: 'play' | 'pause' | 'stop' | 'seek' | 'set_time_scale' | 'get_time_scale'
  | 'get_progress' | 'set_progress' | 'bind_scroll' | 'unbind_scroll' | 'list_scrub_anchors',
  duration?: number,
  loop?: boolean,
  time?: number,
  deterministic?: boolean,
  extra?: PlayTimelineExtra
): string {
  const S = (v: unknown) => JSON.stringify(v);
  switch (action) {
    case 'set_time_scale': {
      // Deliberately not clamped: 0 freezes the clock without stopping, and a
      // negative rate runs the scene backwards.
      const rate = extra?.rate ?? 1;
      return `
// pp:TimeScale — the rate the scene clock runs at.
(function() {
  if (typeof app.setTimeScale !== 'function') {
    return { success: false, error: 'app.setTimeScale unavailable — update FxTool' };
  }
  // Changing the rate rebases the clock so the CURRENT position is preserved;
  // without that, doubling the rate mid-play jumps the playhead to twice its
  // elapsed time, which reads as a glitch rather than a speed change.
  const rate = app.setTimeScale(${S(rate)});
  // Export drives time itself, so a scene watched at 0.5x still exports its
  // real duration rather than a file twice as long.
  return { success: true, action: 'set_time_scale', rate, affectsExport: false };
})();
`.trim();
    }
    case 'get_time_scale':
      return `
(function() {
  if (typeof app.getTimeScale !== 'function') {
    return { success: false, error: 'app.getTimeScale unavailable — update FxTool' };
  }
  return { success: true, action: 'get_time_scale', rate: app.getTimeScale() };
})();
`.trim();
    case 'get_progress':
      return `
(function() {
  if (typeof app.getProgress !== 'function') {
    return { success: false, error: 'app.getProgress unavailable — update FxTool' };
  }
  return { success: true, action: 'get_progress', progress: app.getProgress() };
})();
`.trim();
    case 'set_progress':
      return `
// Seek by proportion rather than by seconds — the unit a scrubber has.
(function() {
  if (typeof app.setProgress !== 'function') {
    return { success: false, error: 'app.setProgress unavailable — update FxTool' };
  }
  const time = app.setProgress(${S(extra?.progress ?? 0)});
  return { success: true, action: 'set_progress', progress: ${S(extra?.progress ?? 0)}, time };
})();
`.trim();
    case 'list_scrub_anchors':
      return `
(function() {
  if (typeof app.listScrubAnchors !== 'function') {
    return { success: false, error: 'app.listScrubAnchors unavailable — update FxTool' };
  }
  const anchors = app.listScrubAnchors();
  return { success: true, action: 'list_scrub_anchors', count: anchors.length, anchors };
})();
`.trim();
    case 'bind_scroll': {
      const scroll = extra?.scroll || {};
      return `
// pp:InputDrivenPlayback — drive the timeline from scroll instead of a clock.
(function() {
  if (typeof app.bindTimelineToScroll !== 'function') {
    return { success: false, error: 'app.bindTimelineToScroll unavailable — update FxTool' };
  }
  const cfg = ${S(scroll)};
  // The listener holds the app instance, so rebinding without unbinding leaks
  // the old binding AND leaves two of them scrubbing the same timeline. Always
  // release the previous one first.
  let replaced = false;
  if (typeof window !== 'undefined' && typeof window.${SCRUB_UNBIND_KEY} === 'function') {
    try { window.${SCRUB_UNBIND_KEY}(); replaced = true; } catch (e) { /* already gone */ }
    window.${SCRUB_UNBIND_KEY} = null;
  }
  const el = cfg.elementId && typeof document !== 'undefined'
    ? document.getElementById(cfg.elementId)
    : undefined;
  if (cfg.elementId && !el) {
    return { success: false, error: 'No element with id "' + cfg.elementId + '" — bind_scroll tracks a real DOM element' };
  }
  const unbind = app.bindTimelineToScroll({
    ...(el ? { element: el } : {}),
    ...(cfg.start !== undefined ? { start: cfg.start } : {}),
    ...(cfg.end !== undefined ? { end: cfg.end } : {}),
    ...(cfg.scrub !== undefined ? { scrub: cfg.scrub } : {}),
    ...(cfg.range !== undefined ? { range: cfg.range } : {}),
  });
  if (typeof window !== 'undefined') window.${SCRUB_UNBIND_KEY} = unbind;
  return { success: true, action: 'bind_scroll', bound: true, replaced, config: cfg };
})();
`.trim();
    }
    case 'unbind_scroll':
      return `
(function() {
  // Nothing bound is an answer, not an error — an agent tidying up should not
  // have to know whether it bound anything.
  if (typeof window === 'undefined' || typeof window.${SCRUB_UNBIND_KEY} !== 'function') {
    return { success: true, action: 'unbind_scroll', bound: false };
  }
  window.${SCRUB_UNBIND_KEY}();
  window.${SCRUB_UNBIND_KEY} = null;
  return { success: true, action: 'unbind_scroll', bound: true };
})();
`.trim();
    case 'play':
      return `
// Play keyframe timeline
app.playKeyframeTimeline(${duration || 5}, ${loop ?? false}, { timeUnits: 'seconds' });
({ success: true, action: 'play', duration: ${duration || 5}, loop: ${loop ?? false} });
`.trim();
    case 'pause':
      return `
// Pause keyframe timeline
app.pauseKeyframeTimeline();
({ success: true, action: 'pause' });
`.trim();
    case 'stop':
      return `
// Stop keyframe timeline
app.stopKeyframeTimeline();
({ success: true, action: 'stop' });
`.trim();
    case 'seek':
      if (deterministic) {
        return `
// Deterministic seek — evaluate the whole scene at the exact time (keyframes + relations + generators)
(function() {
  const t = ${time || 0};
  if (typeof app.sceneAt === 'function') { app.sceneAt(t); return { success: true, action: 'seek', time: t, deterministic: true }; }
  // Fallback for older FxTool builds without sceneAt
  app.setPlaybackTime(t);
  return { success: true, action: 'seek', time: t, deterministic: false, note: 'app.sceneAt unavailable — used setPlaybackTime (keyframe state only); update FxTool for deterministic relations/generators' };
})();
`.trim();
      }
      return `
// Seek to time
app.setPlaybackTime(${time || 0});
({ success: true, action: 'seek', time: ${time || 0} });
`.trim();
  }
}

/**
 * Template for setting background color
 */
function generateSetBackgroundColorCode(color: string): string {
  return `
// Set background color
app.setBackgroundColor('${color}');
({ success: true, color: '${color}' });
`.trim();
}

/**
 * Template for canvas size
 */
function generateSetCanvasSizeCode(
  width: number,
  height: number,
  preset?: string
): string {
  const sizeArg = preset
    ? `'${preset}'`
    : `{ width: ${width}, height: ${height} }`;
  return `
// Set canvas size
(function() {
  // READ THE VERDICT. This called setCanvasSize and then declared success with
  // the dimensions it had ASKED for — so an unknown preset, or a width of -5,
  // came back as a successful resize while the canvas was left exactly as it
  // was. The engine now refuses by name; older builds return undefined, which
  // is not a refusal and must not be read as one.
  const r = app.setCanvasSize(${sizeArg});
  if (r && r.ok === false) {
    return { success: false, error: r.reason || 'the canvas size was refused',
      ...(r.known ? { knownPresets: r.known } : {}) };
  }
  app.historyManager.saveState();
  // Report what the canvas ACTUALLY took where the engine says so, rather than
  // echoing the request back.
  return { success: true, width: (r && r.width) || ${width}, height: (r && r.height) || ${height},
    ...(r && r.preset ? { preset: r.preset } : {}),
    ...(r && r.unbounded !== undefined ? { unbounded: r.unbounded } : {}) };
})();
`.trim();
}

/**
 * Template for getting canvas size
 */
function generateGetCanvasSizeCode(): string {
  return `
// Get current canvas size
const size = app.getCanvasSize();
({ width: size.width, height: size.height });
`.trim();
}

/**
 * Uploaded audio / video, removed through the media pipeline.
 *
 * clearCanvas empties the item groups and registries, but an uploaded clip
 * also lives in the audio / video layers — so a video from the previous job
 * survived agent_start_job {clearCanvas:true} and played in the next scene
 * (round 8 retest, 1.66). removeMedia is the full removal (registry entry,
 * stored blob, layer). Run before clearCanvas; forEach, not a generated loop.
 */
const MEDIA_PURGE = `
  let __mediaRemoved = 0;
  const __PA = (typeof window !== 'undefined') && window.PinePaperAgent;
  if (__PA && typeof __PA.listMedia === 'function' && typeof __PA.removeMedia === 'function') {
    __PA.listMedia().forEach(function(m) { try { if (__PA.removeMedia(m.id)) __mediaRemoved++; } catch (_) { /* keep clearing */ } });
  }`;

/**
 * Template for clearing all items from canvas
 */
function generateClearCanvasCode(): string {
  return `
// Clear all items from canvas. Prefer app.clearCanvas() — the canonical
// reset that also tears down relations, the (virtual) camera animation,
// generators, effects and background. The old manual loop here was broken:
// it keyed item lookups on entry.id/entry.itemId (the registry getAll()
// entries don't expose those — getItemById wants the registry id), so it
// removed 0 items, and it called the non-existent app.clearAllRelations.
const before = app.itemRegistry ? app.itemRegistry.getAll().length : 0;
${MEDIA_PURGE}

if (typeof app.clearCanvas === 'function') {
  app.clearCanvas();
} else {
  // Fallback for older builds without clearCanvas().
  if (app.textItemGroup) app.textItemGroup.removeChildren();
  if (app.patternGroup) app.patternGroup.removeChildren();
  if (app.itemRegistry) app.itemRegistry.clear();
  if (app.relationRegistry) app.relationRegistry.clear();
}

if (app.historyManager) app.historyManager.saveState();

const remaining = app.itemRegistry ? app.itemRegistry.getAll().length : 0;

({ success: true, removedCount: Math.max(0, before - remaining), remainingItems: remaining, mediaRemoved: __mediaRemoved });
`.trim();
}

/**
 * Template for SVG export
 */
function generateExportSVGCode(): string {
  return `
// Export animated SVG
const svgString = app.exportAnimatedSVG();
({ success: true, svgString, hasAnimations: svgString.includes('<animate') });
`.trim();
}

/**
 * Template for training data export
 */
function generateExportTrainingDataCode(
  format: 'json' | 'jsonl' = 'json',
  includeMetadata: boolean = true
): string {
  if (format === 'jsonl') {
    return `
// Export training data as JSONL
const data = app.exportRelationTrainingData();
const jsonl = data.map(entry => JSON.stringify({
  messages: [
    { role: 'user', content: entry.instruction },
    { role: 'assistant', content: entry.code }
  ]${includeMetadata ? `,
  metadata: { relation: entry.relation, params: entry.params }` : ''}
})).join('\\n');

({ trainingData: jsonl, count: data.length, format: 'jsonl' });
`.trim();
  }

  return `
// Export training data as JSON
const trainingData = app.exportRelationTrainingData();
({ trainingData, count: trainingData.length, format: 'json' });
`.trim();
}

/**
 * Template for relation stats
 */
function generateGetRelationStatsCode(): string {
  return `
// Get relation statistics
const stats = app.getRelationStats();
({ stats });
`.trim();
}

/**
 * Template for list generators
 */
function generateListGeneratorsCode(): string {
  return `
// List available generators
//
// THREE OF SEVENTY-FOUR. getAvailableBackgroundGenerators() returned a
// hand-written literal of three names while the registry held 74 — nothing was
// broken, the other seventy-one executed fine BY NAME, they were simply
// invisible to anyone asking what exists. listGenerators() merges the registry
// and awaits it; it is newer than some studios, so the old call stays as the
// fallback and the result says which answer you got.
//
// Wrapped in an async IIFE deliberately: a bare top-level await parses under
// the governor and is a syntax error on the eval path.
(async function() {
  let generators;
  let complete = true;
  if (typeof app.listGenerators === 'function') {
    generators = await app.listGenerators();
  } else {
    generators = app.getAvailableBackgroundGenerators();
    // The merged array carries a non-enumerable pending flag when the registry
    // chunk has not landed, so a cold page honestly answers three.
    complete = !generators || generators.pending !== true;
  }
  // PARAMS ARE THE WHOLE POINT OF ASKING.
  //
  // The tool says it lists generators "with their parameters" and this mapper
  // dropped the params key, so every answer was a name and a sentence. A
  // caller who wanted to know what drawGradientMesh accepts had to guess, and
  // an unknown generatorParams key is accepted in silence — so a guess that
  // was wrong looked exactly like one that was right.
  const formatted = (generators || []).map(g => ({
    name: g.name,
    displayName: g.displayName || g.name,
    category: g.category || 'background',
    description: g.description || '',
    ...(g.params ? { params: g.params } : {})
  }));

  return {
    generators: formatted,
    count: formatted.length,
    ...(complete ? {} : {
      partial: true,
      note: 'the generator registry had not finished loading, so this is a partial list — the built-ins only. Retry for the full set.',
    }),
  };
})();
`.trim();
}

/**
 * True when app.create() derives this item's geometry from explicit coordinates
 * and therefore ignores params.position:
 *   - path  built from `segments` or `pathData`
 *   - line  built from `from`/`to`
 *   - arc   built from `from`/`through`/`to`
 * Without those coordinate props these types fall back to the position-derived
 * point, so create() already places them correctly and we must not interfere.
 */
export function isCoordinateBuilt(
  itemType: string | undefined,
  props: Record<string, unknown>,
): boolean {
  switch (itemType) {
    case 'path':
      return props.segments !== undefined || props.pathData !== undefined;
    case 'line':
      return props.from !== undefined || props.to !== undefined;
    case 'arc':
      return props.from !== undefined || props.through !== undefined || props.to !== undefined;
    default:
      return false;
  }
}

interface KeyframeLike { time: number; properties?: Record<string, unknown>; easing?: string }

export interface KeyframeMergePlan {
  /** index → merged keyframe payload to emit in place of the op's own */
  merged: Map<number, { keyframes: KeyframeLike[]; duration: number; loop: boolean }>;
  /** index → index of the op its keyframes were folded into (emit a no-op) */
  foldedInto: Map<number, number>;
}

/**
 * app.addAnimation() REPLACES data.keyframes wholesale, so two
 * keyframe_animate ops targeting one item meant the first track was silently
 * discarded — the batch still reported success while (e.g.) a rotation channel
 * vanished because a later op set a colour channel on the same item.
 *
 * Plan a merge: fold every duplicate target's keyframes into its FIRST op
 * (keeping author order), union by timestamp with later ops winning on a
 * per-property conflict. Op slots are preserved so `results` stays 1:1 with
 * `operations` and `$N` indices are untouched; the folded slots emit an
 * explicit `{ merged: true }` marker so the merge is visible to the caller
 * rather than being another silent rewrite.
 */
export function planKeyframeMerges(
  operations: ReadonlyArray<{ type: string; itemId?: string; keyframes?: KeyframeLike[]; duration?: number; loop?: boolean }>,
): KeyframeMergePlan {
  const byTarget = new Map<string, number[]>();
  operations.forEach((op, i) => {
    if (op.type !== 'keyframe_animate' || !op.itemId) return;
    const list = byTarget.get(op.itemId) || [];
    list.push(i);
    byTarget.set(op.itemId, list);
  });

  const plan: KeyframeMergePlan = { merged: new Map(), foldedInto: new Map() };

  for (const indices of byTarget.values()) {
    if (indices.length < 2) continue;
    const first = indices[0];

    // Union keyframes by time; later ops shallow-merge over earlier ones.
    const byTime = new Map<number, KeyframeLike>();
    let duration = 0;
    let loop = false;
    for (const i of indices) {
      const op = operations[i];
      for (const kf of op.keyframes || []) {
        const prev = byTime.get(kf.time);
        byTime.set(kf.time, {
          time: kf.time,
          properties: { ...(prev?.properties || {}), ...(kf.properties || {}) },
          ...((kf.easing ?? prev?.easing) !== undefined ? { easing: kf.easing ?? prev?.easing } : {}),
        });
      }
      const opMax = op.keyframes?.length ? Math.max(...op.keyframes.map(k => k.time)) : 0;
      duration = Math.max(duration, op.duration || opMax);
      loop = loop || op.loop === true;
      if (i !== first) plan.foldedInto.set(i, first);
    }

    plan.merged.set(first, {
      keyframes: [...byTime.values()].sort((a, b) => a.time - b.time),
      duration: duration || 5,
      loop,
    });
  }

  return plan;
}

/**
 * A create / modify snippet as the body of a function that RETURNS its value.
 * Such a snippet's value is its last top-level (-led statement; the
 * font-loading form is an async IIFE, which is awaited instead.
 */
function asReturningBody(snippet: string): string {
  const single = snippet.trim();
  if (single.startsWith('(async function()')) return `return await ${single.replace(/;\s*$/, '')};`;
  const lines = single.split('\n');
  let at = -1;
  lines.forEach((l, i) => { if (l.startsWith('(')) at = i; });
  if (at >= 0) lines[at] = 'return ' + lines[at];
  return lines.join('\n');
}

/**
 * Template for batch create — create_item for each item, one history save.
 *
 * This called app.batchCreate, a third create path, and dropped fontWeight
 * (and every other create_item fix) with no ignoredProperties (round 9 II,
 * 1.79) — the same drift f1d0b05 removed from agent_batch_execute. Each item
 * now runs create_item's own emitter with its per-item history save taken
 * out, and the batch saves once at the end, which is what batchCreate was
 * for. An item that fails is reported by index; the rest are still created.
 */
function generateBatchCreateCode(items: BatchCreateItem[]): string {
  const blocks = items.map((it, i) => {
    const { x, y, position, ...props } = (it.params || {}) as Record<string, unknown>;
    const p = Array.isArray(position) ? { x: Number(position[0]), y: Number(position[1]) }
      : (position && typeof position === 'object') ? { x: Number((position as { x: unknown }).x), y: Number((position as { y: unknown }).y) }
        : { x: typeof x === 'number' ? x : 400, y: typeof y === 'number' ? y : 300 };
    const given = position !== undefined || typeof x === 'number' || typeof y === 'number';
    const body = asReturningBody(generateCreateItemCode(it.type as ItemType, p, props, undefined, given))
      .replace(/app\.historyManager\.saveState\(\);/g, '');
    return `
  try {
    const r${i} = await (async function() {
${body}
    })();
    if (r${i} && r${i}.success === false) errors.push({ index: ${i}, error: r${i}.error });
    else results.push(Object.assign({ index: ${i} }, r${i}));
  } catch (e) { errors.push({ index: ${i}, error: (e && e.message) || String(e) }); }`;
  });
  return `
// Batch create ${items.length} items — create_item for each, one history save
(async function() {
  const results = [];
  const errors = [];
${blocks.join('\n')}
  if (app.historyManager) app.historyManager.saveState();
  return { success: errors.length === 0, items: results, count: results.length, errors: errors };
})();`.trim();
}

/**
 * Template for batch modify — modify_item for each item, one history save.
 *
 * This called app.batchModify, which applies raw params and so missed every
 * modify_item fix (text weight / leading, font loading, audio level, no-fill,
 * lifetimes, smoothing, the unread-property report) — the drift f1d0b05 and
 * 8f9b075 removed from the other batch paths. Each item now runs modify_item's
 * own emitter with its history save removed; the batch saves once. The
 * result keeps the old shape (count, requested, skipped with reasons, and an
 * error naming the skipped when any were).
 */
function generateBatchModifyCode(modifications: BatchModifyItem[]): string {
  const blocks = modifications.map((m, i) => {
    const snippet = generateModifyItemCode(m.itemId, (m.params || {}) as Record<string, unknown>).trim()
      .replace(/app\.historyManager\.saveState\(\);/g, '')
      .replace(/;\s*$/, '');
    return `
  try {
    const r${i} = await ${snippet};
    if (r${i} && r${i}.success === false) skipped.push({ itemId: ${JSON.stringify(m.itemId)}, reason: r${i}.error || 'not modified' });
    else { count++; if (r${i} && r${i}.ignoredProperties) ignored.push({ itemId: ${JSON.stringify(m.itemId)}, ignoredProperties: r${i}.ignoredProperties }); }
  } catch (e) { skipped.push({ itemId: ${JSON.stringify(m.itemId)}, reason: (e && e.message) || String(e) }); }`;
  });
  return `
// Batch modify ${modifications.length} items — modify_item for each, one history save
(async function() {
  let count = 0;
  const skipped = [];
  const ignored = [];
${blocks.join('\n')}
  if (app.historyManager) app.historyManager.saveState();
  return {
    success: skipped.length === 0 && count === ${modifications.length},
    count: count,
    requested: ${modifications.length},
    skipped: skipped,
    ...(ignored.length ? { ignoredProperties: ignored } : {}),
    ...(skipped.length ? { error: 'batch_modify changed ' + count + ' of ${modifications.length} items; skipped: ' + skipped.map(function(s) { return s.itemId + ' (' + s.reason + ')'; }).join(', ') } : {}),
  };
})();`.trim();
}

/**
 * Template for create grid - convenience method for creating line grids
 */
function generateCreateGridCode(
  cols: number,
  rows: number,
  strokeColor: string,
  strokeWidth: number,
  animated: boolean,
  waveSpeed: number,
  waveAmplitude: number
): string {
  return `
// Create grid with ${cols} columns and ${rows} rows
const grid = app.createGrid({
  cols: ${cols},
  rows: ${rows},
  strokeColor: '${strokeColor}',
  strokeWidth: ${strokeWidth},
  animated: ${animated},
  waveSpeed: ${waveSpeed},
  waveAmplitude: ${waveAmplitude}
});

// Return grid info
({
  success: true,
  lineCount: grid.lines?.length || 0,
  groupId: grid.group?.data?.registryId || null,
  callbackId: grid.callbackId || null,
  animated: ${animated}
});
`.trim();
}

// =============================================================================
// CODE GENERATOR CLASS
// =============================================================================

/**
 * Agent PLATFORM name → the engine's canvas-preset key.
 *
 * AgentPlatformSchema is an export-target vocabulary ('instagram', 'youtube')
 * that was also being handed straight to app.setCanvasSize(), which keys on
 * 'instagram-post' and 'full-hd-1080p'. Seven of the ten names matched nothing:
 * the engine fell through to its default and resized the artboard to 800x600
 * while recording the preset as applied, so an agent asking for an Instagram
 * canvas silently got neither the size nor an error. (FxTool 496d3910 now
 * refuses an unknown key instead — better, but it warns to a console the
 * production build strips, so the agent still learns nothing.)
 *
 * Mapping rather than renaming: 'instagram' is the right word for an export
 * TARGET and a poor one for a canvas SIZE, and only the second use was wrong.
 */
const PLATFORM_TO_CANVAS_PRESET: Record<string, string> = {
  instagram: 'instagram-post',       // 1080x1080
  'instagram-story': 'instagram-story',
  tiktok: 'tiktok',
  youtube: 'full-hd-1080p',          // the video frame, 1920x1080
  'youtube-thumbnail': 'youtube-thumbnail',
  twitter: 'twitter-post',
  linkedin: 'linkedin-post',
  web: 'hd-720p',                    // 1280x720
  'print-a4': 'a4-portrait',
  'print-letter': 'letter-portrait',
  'print-a4-landscape': 'a4-landscape',
  'print-letter-landscape': 'letter-landscape',
};

/** The engine key for a platform, falling back to the value itself. */
export function canvasPresetFor(platform: string): string {
  return PLATFORM_TO_CANVAS_PRESET[platform] || platform;
}

/**
 * Largest export the emitted code will hand back as an inline base64 data URL.
 *
 * Only reached on a studio with no `app.exportEngine.exportToStore` — with the
 * store, mp4/webm never base64 in the page at all. Set above what that legacy
 * path could already deliver (60 s at 8 Mbps is roughly 60 MB, ~80 MB once
 * base64'd) so raising the duration cap cannot make a previously working
 * export start refusing; past it the code names the ceiling instead of dying
 * inside the encode.
 */
export const INLINE_MAX_BYTES = 96 * 1024 * 1024;

/**
 * Wait for the export subsystem before reading it.
 *
 * `app.exportEngine` is a LAZY getter over a code-split chunk: it returns
 * undefined until `ensureHeavyModules()` has run, which the engine idle-prefetches
 * roughly 1.2s after boot. An agent connecting and exporting immediately —
 * which is the whole shape of an automated session — beats that prefetch, so
 * every `app.exportEngine.*` read below found undefined and the generated code
 * reported the studio as too old to export. The build was fine; the chunk had
 * not landed yet. Awaiting it is the difference between a check and a race.
 *
 * The guards that follow this are left exactly as they are: after the await,
 * an absent exportEngine really does mean a studio that cannot export.
 *
 * Emitted only into the two doors an agent can reach cold. `readExport` and
 * `releaseExport` are only reachable after an export has already succeeded, by
 * which point the chunk is resident by construction.
 */
const ENSURE_EXPORT_ENGINE = `
  if (!app.exportEngine && typeof app.ensureHeavyModules === 'function') {
    try { await app.ensureHeavyModules(); } catch (_) { /* the guards below still speak */ }
  }`;

/**
 * A REMOTE <image> INSIDE AN SVG TAINTS THE CANVAS, PERMANENTLY.
 *
 * paper.importSVG draws a cross-origin raster straight onto the canvas. The
 * canvas then has an origin-dirty flag, and every export afterwards throws
 * "Tainted canvases may not be exported" — not just the one containing the
 * image. Nothing recovers it but a page reload, so ONE import poisons the
 * whole session, long after the call that did it returned success.
 *
 * Reported from production: import_svg with a picsum href answered
 * success/itemsCreated:0 and then broke every later export.
 *
 * So each remote href is fetched and inlined as a data: URL before the SVG
 * goes anywhere near the importer — the same thing import_image does, for the
 * same reason. An href that CANNOT be inlined has its element removed: a
 * missing picture is a visible, local, recoverable problem, and leaving it in
 * is an unrecoverable one that surfaces somewhere else entirely.
 */
const INLINE_REMOTE_IMAGES = `
  async function inlineRemoteImages(svgText) {
    const notes = [];
    const hrefs = [];
    const re = /(?:xlink:)?href\\s*=\\s*("|')(https?:\\/\\/[^"']+)\\1/gi;
    let m;
    while ((m = re.exec(svgText)) !== null) if (hrefs.indexOf(m[2]) === -1) hrefs.push(m[2]);
    if (hrefs.length === 0) return { svg: svgText, notes: notes };
    for (const href of hrefs) {
      let dataUrl = null;
      try {
        const r = await fetch(href, { mode: 'cors' });
        if (r.ok) {
          const blob = await r.blob();
          dataUrl = await new Promise(function(res, rej) {
            const fr = new FileReader();
            fr.onload = function() { res(fr.result); };
            fr.onerror = function() { rej(new Error('could not read ' + href)); };
            fr.readAsDataURL(blob);
          });
        }
      } catch (e) { /* fall through to removal */ }
      if (dataUrl) {
        svgText = svgText.split(href).join(dataUrl);
      } else {
        // Drop the element rather than let it taint the canvas.
        const esc = href.replace(/[.*+?^\\\${}()|[\\]\\\\]/g, '\\\\$&');
        svgText = svgText.replace(new RegExp('<image\\\\b[^>]*' + esc + '[^>]*\\\\/?>', 'gi'), '');
        svgText = svgText.replace(new RegExp('<image\\\\b[^>]*' + esc + '[\\\\s\\\\S]*?<\\\\/image>', 'gi'), '');
        notes.push({
          url: href,
          action: 'removed',
          reason: 'unfetchable',
          message: 'removed an embedded image this page could not fetch (' + href + '). It was dropped rather than imported, because a cross-origin raster taints the canvas and every later export would have failed with "Tainted canvases may not be exported" until a reload.',
        });
      }
    }
    return { svg: svgText, notes: notes };
  }
`;

/**
 * A HEX COLOUR IN THE 3D WORLD POISONS EVERY LATER EXPORT.
 *
 * addWorldObject hands `color` to a WebGL uniform — its own example is
 * `color: [0.9, 0.3, 0.2]`, three floats in 0..1. Give it '#ef4444' and
 * uniform3fv throws "cannot be converted to a sequence"; the object is
 * reported as added, and then EVERY subsequent MP4 export fails, because the
 * broken uniform is in the scene from then on. Same shape as the tainted
 * canvas: one bad value, success reported, and the damage surfaces somewhere
 * else entirely.
 *
 * Converted here. A caller writing '#ef4444' is not wrong — it is the colour
 * spelling every other tool in this package takes — so the emitter absorbs the
 * difference rather than the caller learning a second convention.
 */
function world3dColor(value: unknown): unknown {
  if (Array.isArray(value)) {
    // Already a triple. Accept 0-255 too, since that is the other common form.
    const nums = value.filter((v): v is number => typeof v === 'number');
    if (nums.length < 3) return value;
    return nums.slice(0, 3).map((n) => (n > 1 ? n / 255 : n));
  }
  if (typeof value !== 'string') return value;
  const hex = value.trim().replace(/^#/, '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
}

/** Recursively convert every `color` field in a world3d payload. */
function world3dColors<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => world3dColors(v)) as unknown as T;
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = k === 'color' ? world3dColor(v) : world3dColors(v);
  }
  return out as unknown as T;
}

export class PinePaperCodeGenerator {
  /**
   * Generate code for creating an item
   */
  generateCreateItem(input: z.infer<typeof CreateItemInputSchema>): string {
    const validated = CreateItemInputSchema.parse(input);
    const positionGiven = (input as { position?: unknown }).position !== undefined;
    const properties = { ...(validated.properties as Record<string, unknown>) };
    if (validated.animationType !== undefined) properties.animationType = validated.animationType;
    if (validated.animationSpeed !== undefined) properties.animationSpeed = validated.animationSpeed;
    if (validated.animationIntensity !== undefined) properties.animationIntensity = validated.animationIntensity;
    if (validated.animationDelay !== undefined) properties.animationDelay = validated.animationDelay;
    if (validated.keyframes !== undefined) properties.keyframes = validated.keyframes;
    if (validated.anchor !== undefined && properties.anchor === undefined && properties.origin === undefined) properties.anchor = validated.anchor;
    return generateCreateItemCode(
      validated.itemType,
      validated.position,
      properties,
      validated.data,
      positionGiven,
    );
  }

  /**
   * Generate code for modifying an item
   */
  generateModifyItem(input: z.infer<typeof ModifyItemInputSchema>): string {
    const validated = ModifyItemInputSchema.parse(input);
    return generateModifyItemCode(
      validated.itemId,
      validated.properties as Record<string, unknown>,
      validated.data
    );
  }

  /**
   * Generate code for deleting an item
   */
  generateDeleteItem(itemId: string): string {
    return generateDeleteItemCode(itemId);
  }

  /**
   * Generate code for adding a relation
   */
  generateAddRelation(input: z.infer<typeof AddRelationInputSchema>): string {
    const validated = AddRelationInputSchema.parse(input);

    // A PRESET decides its own relationType and params, so this is a different
    // call, not a defaulted one. applyRelationPreset refuses with
    // `{ok:false, errors:[{field, reason}]}` — a third refusal shape on this
    // surface, after {ok, reason} and {error} — so the errors are joined rather
    // than read as a single string, which would render "[object Object]".
    if (validated.presetId) {
      return `
// Adopt relation preset "${validated.presetId}" on ${validated.sourceId}
(async function() {
  if (typeof app.applyRelationPreset !== 'function') { return { success: false, error: 'app.applyRelationPreset unavailable — update FxTool' }; }
  const r = await app.applyRelationPreset(${JSON.stringify(validated.sourceId)}, ${JSON.stringify(validated.presetId)}, ${JSON.stringify(validated.presetValues ?? {})});
  if (!r || r.ok === false) {
    const why = (r && Array.isArray(r.errors))
      ? r.errors.map(function(e) { return e.field + ': ' + e.reason; }).join('; ')
      : 'the preset did not apply';
    return { success: false, error: why };
  }
  // The preset's own type and resolved values come back, so the caller learns
  // what it actually adopted rather than only that something worked.
  return { success: true, presetId: ${JSON.stringify(validated.presetId)}, relationType: r.relationType, params: r.params, values: r.values };
})();`.trim();
    }

    if (validated.relationType === 'moves_along_path') {
      return generateMovesAlongPathCode(validated.sourceId, validated.targetId ?? undefined, (validated.params ?? {}) as Record<string, unknown>);
    }

    return generateAddRelationCode(
      validated.sourceId,
      validated.targetId || validated.sourceId,
      validated.relationType as RelationType,
      validated.params as Record<string, unknown>
    );
  }

  /**
   * Generate code for removing a relation
   */
  generateRemoveRelation(
    sourceId: string,
    targetId: string,
    relationType?: RelationType
  ): string {
    return generateRemoveRelationCode(sourceId, targetId, relationType);
  }

  /**
   * Generate code for querying relations
   */
  generateQueryRelations(
    itemId: string,
    relationType?: RelationType,
    direction: 'outgoing' | 'incoming' = 'outgoing'
  ): string {
    return generateQueryRelationsCode(itemId, relationType, direction);
  }

  /**
   * Generate code for simple animation
   */
  generateAnimate(input: z.infer<typeof AnimateItemInputSchema>): string {
    const validated = AnimateItemInputSchema.parse(input);
    return generateAnimateCode(
      validated.itemId,
      validated.animationType,
      validated.speed,
      validated.intensity,
      validated.delay
    );
  }

  /**
   * Generate code for keyframe animation
   */
  generateKeyframeAnimate(input: z.infer<typeof KeyframeAnimateInputSchema>): string {
    const validated = KeyframeAnimateInputSchema.parse(input);
    return generateKeyframeAnimateCode(
      validated.itemId,
      validated.keyframes,
      validated.duration,
      validated.loop,
      validated.timeOffset,
      validated.clipInPoint,
      validated.clipOutPoint,
      validated.timeUnits
    );
  }

  /**
   * Generate code for importing / retargeting a motion-capture clip
   */
  generateImportMotionCapture(input: z.infer<typeof ImportMotionCaptureInputSchema>): string {
    const v = ImportMotionCaptureInputSchema.parse(input);
    if (v.mode === 'retarget' && !v.skeletonId) {
      throw new Error("pinepaper_import_motion_capture: mode='retarget' requires skeletonId (the rig to drive)");
    }
    const opts: Record<string, unknown> = {};
    if (v.fps !== undefined) opts.fps = v.fps;
    if (v.height !== undefined) opts.height = v.height;
    if (v.position !== undefined) opts.position = v.position;
    if (v.name !== undefined) opts.name = v.name;
    if (v.boneMap !== undefined) opts.boneMap = v.boneMap;
    return generateImportMotionCaptureCode(v.bvh, v.mode, v.skeletonId, opts);
  }

  /**
   * Generate code for executing a generator
   */
  generateExecuteGenerator(input: z.infer<typeof ExecuteGeneratorInputSchema>): string {
    const validated = ExecuteGeneratorInputSchema.parse(input);
    return generateExecuteGeneratorCode(
      validated.generatorName,
      aliasGeneratorParams(validated.generatorName, (validated.params ?? {}) as Record<string, unknown>),
      validated.region
    );
  }

  /**
   * Generate code for applying an effect
   */
  generateApplyEffect(input: z.infer<typeof ApplyEffectInputSchema>): string {
    const validated = ApplyEffectInputSchema.parse(input);
    return generateApplyEffectCode(
      validated.itemId,
      validated.effectType,
      validated.params as Record<string, unknown>
    );
  }

  /**
   * Generate code for getting items
   */
  generateGetItems(filter?: {
    type?: ItemType;
    source?: string;
    hasAnimation?: boolean;
    hasRelation?: boolean;
  }): string {
    return generateGetItemsCode(filter);
  }

  /**
   * Generate code for timeline control
   */
  generatePlayTimeline(
    action: 'play' | 'pause' | 'stop' | 'seek' | 'set_time_scale' | 'get_time_scale'
  | 'get_progress' | 'set_progress' | 'bind_scroll' | 'unbind_scroll' | 'list_scrub_anchors',
    duration?: number,
    loop?: boolean,
    time?: number,
    deterministic?: boolean,
    extra?: PlayTimelineExtra
  ): string {
    return generatePlayTimelineCode(action, duration, loop, time, deterministic, extra);
  }

  /**
   * Generate code for setting background color
   */
  generateSetBackgroundColor(input: z.infer<typeof SetBackgroundColorInputSchema>): string {
    const validated = SetBackgroundColorInputSchema.parse(input);
    return generateSetBackgroundColorCode(validated.color);
  }

  /**
   * Generate code for setting canvas size
   */
  generateSetCanvasSize(input: z.infer<typeof SetCanvasSizeInputSchema>): string {
    const validated = SetCanvasSizeInputSchema.parse(input);
    return generateSetCanvasSizeCode(
      validated.width,
      validated.height,
      validated.preset
    );
  }

  /**
   * Generate code for SVG export
   */
  generateExportSVG(): string {
    return generateExportSVGCode();
  }

  /**
   * Generate code for training data export
   */
  generateExportTrainingData(
    format: 'json' | 'jsonl' = 'json',
    includeMetadata: boolean = true
  ): string {
    return generateExportTrainingDataCode(format, includeMetadata);
  }

  /**
   * Generate code for relation stats
   */
  generateGetRelationStats(): string {
    return generateGetRelationStatsCode();
  }

  /**
   * Generate code for listing generators
   */
  generateListGenerators(): string {
    return generateListGeneratorsCode();
  }

  /**
   * Generate code for getting canvas size
   */
  generateGetCanvasSize(): string {
    return generateGetCanvasSizeCode();
  }

  /**
   * Generate code for clearing all items from canvas
   */
  generateClearCanvas(): string {
    return generateClearCanvasCode();
  }

  /**
   * Generate code for importing SVG
   */
  generateImportSVG(
    svgString?: string,
    url?: string,
    position: { x: number; y: number } = { x: 400, y: 300 },
    scale: number = 1.0,
    source?: 'generic' | 'figma'
  ): string {
    // Figma is an OPTION on this tool rather than a tool of its own: it is the
    // same import with a normalisation pass in front, and the tool count is
    // already the thing the consolidation backlog objects to.
    //
    // The pass is not cosmetic. Figma's "Copy as SVG" carries a root
    // fill="none" that INHERITS (everything renders invisible — the classic "I
    // pasted my icon and got nothing"), frequently no viewBox, and global ids
    // like `clip0` that make a second import silently adopt the first one's
    // clipPath.
    const importExpr = (varName: string) => source === 'figma'
      ? `(function () {
  if (typeof app.importFigmaSVG !== 'function') {
    return { item: app.importSVG(${varName}), changes: ['figma normalisation unavailable — update PinePaper Studio'] };
  }
  const r = app.importFigmaSVG(${varName});
  return { item: r.item || null, changes: r.changes || [] };
})()`
      : `{ item: app.importSVG(${varName}), changes: [] }`;

    if (url) {
      return `
// Import SVG from URL${source === 'figma' ? ' (Figma-normalised)' : ''}
// WRAPPED, because these were bare top-level statements with an await. That
// parses under the governor, which builds an AsyncFunction, and is a SYNTAX
// ERROR on the eval fallback — so importing an SVG by URL never ran at all on
// a studio without runGenerated. A paren-led async IIFE parses on both and
// still gives the governor a trailing expression to capture.
(async function() {
  let response;
  try {
    response = await fetch('${url}');
  } catch (netErr) {
    return { success: false, error: 'could not reach ${url} — ' + ((netErr && netErr.message) || 'network request failed') };
  }
  if (!response.ok) {
    return { success: false, error: 'the server refused ${url} — HTTP ' + response.status + ' ' + (response.statusText || ''), status: response.status };
  }
  let svgText = await response.text();
${INLINE_REMOTE_IMAGES}
  const _inl = await inlineRemoteImages(svgText);
  svgText = _inl.svg;
  const _r = ${importExpr('svgText')};
  const imported = _r.item;
  if (!imported) {
    return { success: false, error: 'the response from ${url} did not parse as SVG. Check the URL serves the file itself rather than a page around it.' };
  }
  imported.position = new paper.Point(${position.x}, ${position.y});
  imported.scale(${scale});
  const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
  app.historyManager.saveState();
  return { success: true, itemId, changes: _r.changes, position: { x: ${position.x}, y: ${position.y} },
    ...(_inl.notes.length ? { imageWarnings: _inl.notes } : {}) };
})();
`.trim();
    }

    if (svgString) {
      // Escape the SVG string for embedding in code
      const escapedSvg = svgString.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `
// Import SVG string${source === 'figma' ? ' (Figma-normalised)' : ''}
(async function() {
let svgString = \`${escapedSvg}\`;
${INLINE_REMOTE_IMAGES}
const _inl = await inlineRemoteImages(svgString);
svgString = _inl.svg;
const _r = ${importExpr('svgString')};
const imported = _r.item;
if (!imported) {
  throw new Error('Failed to import SVG');
}
imported.position = new paper.Point(${position.x}, ${position.y});
imported.scale(${scale});
const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
app.historyManager.saveState();
return { success: true, itemId, changes: _r.changes, position: { x: ${position.x}, y: ${position.y} },
  ...(_inl.notes.length ? { imageWarnings: _inl.notes } : {}) };
})();
`.trim();
    }

    return `
// Error: No SVG source provided
throw new Error('Either svgString or url must be provided');
`.trim();
  }

  /**
   * Generate code for importing a Mermaid diagram (flowchart, stateDiagram,
   * sequenceDiagram, erDiagram, classDiagram).
   */
  generateImportMermaid(
    mermaidText: string,
    options: { autoLayout?: boolean; clearExisting?: boolean } = {}
  ): string {
    const escaped = mermaidText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const optsJson = JSON.stringify(options);
    return `
// Import Mermaid diagram
(function() {
  if (!app.importMermaid) return { success: false, error: 'importMermaid not available — diagramSystem missing' };
  const mermaidText = \`${escaped}\`;
  const result = app.importMermaid(mermaidText, ${optsJson});

  // NEVER RETURN THE RAW NODES. They are Paper.js items, and a Paper item
  // refers to its project, which refers back — JSON.stringify dies on the cycle
  // with "property '_scope' closes the circle", and the tool reported "Failed
  // to execute code in browser" for an import that had worked. Summarised to
  // ids, labels and bounds, which is what a caller can act on anyway.
  const safeNode = (n) => {
    const item = n && (n.item || n);
    const b = item && item.bounds;
    return {
      id: (item && item.data && item.data.registryId) || (n && n.id) || null,
      label: (n && (n.label ?? n.text)) ?? null,
      bounds: b ? { x: Math.round(b.x), y: Math.round(b.y), width: Math.round(b.width), height: Math.round(b.height) } : null,
    };
  };
  const nodes = (result.nodes || []).map(safeNode);
  const edges = (result.edges || []).map((e) => ({ from: e?.from ?? e?.source ?? null, to: e?.to ?? e?.target ?? null, label: e?.label ?? null }));

  // A zero-item import is NOT a success. The engine reported success:true with
  // itemsCreated:0 and the tool passed it on, so a diagram that drew nothing
  // read as a diagram that drew.
  if (!nodes.length) {
    return {
      success: false,
      error: 'the mermaid import created no items. The text parsed but produced nothing to draw — check the diagram type is one this build supports, and that the body is not empty.',
      nodeCount: 0, edgeCount: edges.length, errors: result.errors || [],
    };
  }

  return {
    success: !!result.success,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    nodes,
    edges,
    errors: result.errors || [],
  };
})();
`.trim();
  }

  /**
   * Generate code for capturing the canvas as pp: ontology. Wraps FxTool's
   * app.exportCanvasOntology() — defined in PinePaper.js after the
   * canvas-state-to-ontology promotion. Output mirrors the cloud-sync
   * postMessage contract: { canvasWidth, canvasHeight, itemCount,
   * itemTypes, hasAnimations, relationCount, items, triples, [viewport] }.
   *
   * Failure modes: app missing the method → return { success: false, error }
   * with a clear FxTool-version hint. Internal exceptions propagate from
   * the browser-side function (TripleLanguage warns to console; we don't
   * fail the tool call on triple-only failures).
   */
  generateGetCanvasOntology(
    options: { maxItems?: number; maxChildren?: number; includeViewport?: boolean } = {},
  ): string {
    const optsJson = JSON.stringify(options);
    return `
// Capture canvas as pp: ontology
(function() {
  if (!app.exportCanvasOntology) {
    return {
      success: false,
      error: 'app.exportCanvasOntology not available — requires FxTool with canvas-ontology promotion. Falling back to pinepaper_get_items is acceptable but loses the triples representation.',
    };
  }
  const ctx = app.exportCanvasOntology(${optsJson});
  // SAY WHEN THE ANSWER IS PARTIAL. The engine returns itemCount =
  // allItems.length (the TRUE total) beside items = allItems.slice(0,
  // maxItems), and childCount beside a children array capped at maxChildren.
  // So a caller receives itemCount 800 with 500 items and nothing marking the
  // gap — an answer indistinguishable from a complete one unless the reader
  // thinks to compare two fields. That is the silent-refusal shape this repo
  // has fixed elsewhere; the marker below is the same idiom generateHatching
  // uses for its 40-path cap.
  var _shown = Array.isArray(ctx.items) ? ctx.items.length : 0;
  var _total = typeof ctx.itemCount === 'number' ? ctx.itemCount : _shown;
  var _clipped = (Array.isArray(ctx.items) ? ctx.items : []).filter(function (i) {
    return i && typeof i.childCount === 'number' && Array.isArray(i.children)
      && i.children.length < i.childCount;
  });
  return {
    success: true,
    ...(_total > _shown ? { truncated:
      'showing ' + _shown + ' of ' + _total + ' items. Raise maxItems (up to 500) '
      + 'to see more; past 500 the scene is truncated rather than paginated, so '
      + 'narrow with pinepaper_get_items or read a group at a time.' } : {}),
    ...(_clipped.length ? { childrenTruncated: _clipped.map(function (i) {
      return i.id + ': ' + i.children.length + ' of ' + i.childCount + ' children';
    }) } : {}),
    canvasWidth: ctx.canvasWidth,
    canvasHeight: ctx.canvasHeight,
    canvasPreset: ctx.canvasPreset,
    itemCount: ctx.itemCount,
    itemTypes: ctx.itemTypes,
    hasAnimations: ctx.hasAnimations,
    relationCount: ctx.relationCount,
    items: ctx.items,
    triples: ctx.triples,
    viewport: ctx.viewport,
  };
})();
`.trim();
  }

  /**
   * Generate code for semantic validation (FxTool OntologyValidator) — runs in the
   * browser against the live scene and returns structured diagnostics.
   */
  generateValidate(input: { mode?: 'scene' | 'op'; op?: Record<string, unknown> }): string {
    const mode = input.mode || 'scene';
    const opJson = JSON.stringify(input.op ?? null);
    return `
// Semantic validation — structured diagnostics
(function() {
  if (typeof app.validateScene !== 'function' || typeof app.validateOp !== 'function') {
    return {
      success: false,
      error: 'app.validateScene/validateOp not available — requires FxTool with OntologyValidator v1 (commit 7f151f4 or later).',
    };
  }
  var mode = ${JSON.stringify(mode)};
  var result = (mode === 'op') ? app.validateOp(${opJson}) : app.validateScene();
  return { success: true, mode: mode, ok: result.ok, diagnostics: result.diagnostics };
})();
`.trim();
  }

  /**
   * Generate code for adding a filter
   */
  generateAddFilter(
    filterType: string,
    params: Record<string, unknown> = {}
  ): string {
    return `
// Add ${filterType} filter
const filterId = app.filterSystem.addFilter('${filterType}', ${JSON.stringify(params, null, 2)});
({ success: true, filterId, filterType: '${filterType}' });
`.trim();
  }

  /**
   * Generate code for creating a glossy 3D sphere effect
   */
  generateCreateGlossySphere(input: z.infer<typeof CreateGlossySphereInputSchema>): string {
    const validated = CreateGlossySphereInputSchema.parse(input);
    const { position, radius, baseColor, lightDirection, glossiness, castShadow, shadowIntensity } = validated;

    // Calculate light offset based on direction
    const lightOffsets: Record<LightDirection, { x: number; y: number }> = {
      'top-left': { x: -0.3, y: -0.3 },
      'top-right': { x: 0.3, y: -0.3 },
      'top': { x: 0, y: -0.4 },
      'left': { x: -0.4, y: 0 },
      'right': { x: 0.4, y: 0 },
      'bottom-left': { x: -0.3, y: 0.3 },
      'bottom-right': { x: 0.3, y: 0.3 },
      'bottom': { x: 0, y: 0.4 },
    };

    const lightOffset = lightOffsets[lightDirection];
    const lightX = position.x + radius * lightOffset.x;
    const lightY = position.y + radius * lightOffset.y;

    // Specular highlight position (opposite of shadow direction)
    const highlightX = position.x + radius * lightOffset.x * 0.6;
    const highlightY = position.y + radius * lightOffset.y * 0.6;

    return `
// Create glossy 3D sphere effect
const sphereGroup = new paper.Group({ parent: app.textItemGroup });
const baseColor = new paper.Color('${baseColor}');

${castShadow ? `// Shadow underneath
const shadow = new paper.Path.Ellipse({
  center: [${position.x + 10}, ${position.y + radius + 8}],
  size: [${radius * 1.6}, ${radius * 0.4}],
  fillColor: 'rgba(0, 0, 0, ${shadowIntensity})',
  parent: sphereGroup
});
shadow.shadowBlur = 15;
shadow.shadowColor = 'rgba(0, 0, 0, ${shadowIntensity * 0.5})';` : '// Shadow disabled'}

// Base sphere with radial gradient
const sphere = new paper.Path.Circle({
  center: [${position.x}, ${position.y}],
  radius: ${radius},
  parent: sphereGroup
});

// Create radial gradient for 3D effect
const lightColor = baseColor.clone();
lightColor.lightness = Math.min(1, lightColor.lightness + 0.3);
const darkColor = baseColor.clone();
darkColor.lightness = Math.max(0, darkColor.lightness - 0.3);

sphere.fillColor = {
  gradient: {
    stops: [
      [lightColor.toCSS(true), 0.0],
      [baseColor.toCSS(true), 0.5],
      [darkColor.toCSS(true), 1.0]
    ],
    radial: true
  },
  origin: [${lightX}, ${lightY}],
  destination: [${position.x + radius * 0.8}, ${position.y + radius * 0.8}]
};

// Specular highlight (glossy shine)
const highlight = new paper.Path.Ellipse({
  center: [${highlightX}, ${highlightY}],
  size: [${radius * 0.5 * glossiness}, ${radius * 0.25 * glossiness}],
  fillColor: 'rgba(255, 255, 255, ${glossiness * 0.8})',
  parent: sphereGroup
});
highlight.rotate(${lightDirection === 'top-left' ? -30 : lightDirection === 'top-right' ? 30 : 0});

// Secondary highlight for extra realism
const secondaryHighlight = new paper.Path.Ellipse({
  center: [${highlightX - radius * 0.1}, ${highlightY + radius * 0.05}],
  size: [${radius * 0.2 * glossiness}, ${radius * 0.1 * glossiness}],
  fillColor: 'rgba(255, 255, 255, ${glossiness * 0.4})',
  parent: sphereGroup
});

// Register the group
const itemId = app.registerItem(sphereGroup, 'glossy-sphere', { source: 'mcp' });
app.historyManager.saveState();

({ itemId, type: 'glossy-sphere', position: { x: ${position.x}, y: ${position.y} }, radius: ${radius} });
`.trim();
  }

  /**
   * Generate code for creating diagonal stripes pattern
   */
  generateCreateDiagonalStripes(input: z.infer<typeof CreateDiagonalStripesInputSchema>): string {
    const validated = CreateDiagonalStripesInputSchema.parse(input);
    const { position, width, height, stripeWidth, colors, angle, gap } = validated;

    const colorsJson = JSON.stringify(colors);

    return `
// Create diagonal stripes pattern
const stripesGroup = new paper.Group({ parent: app.textItemGroup });
const colors = ${colorsJson};
const stripeWidth = ${stripeWidth};
const gap = ${gap};
const totalStripeWidth = stripeWidth + gap;
const angle = ${angle};

// Calculate the diagonal length needed to cover the area
const diagonalLength = Math.sqrt(${width} * ${width} + ${height} * ${height}) * 1.5;
const numStripes = Math.ceil(diagonalLength / totalStripeWidth) + 2;

// Create a clipping mask for the stripe area
const clipRect = new paper.Path.Rectangle({
  point: [${position.x - width / 2}, ${position.y - height / 2}],
  size: [${width}, ${height}]
});

// Create stripes
for (let i = -numStripes; i < numStripes; i++) {
  const color = colors[((i % colors.length) + colors.length) % colors.length];
  const stripe = new paper.Path.Rectangle({
    point: [${position.x} - diagonalLength / 2 + i * totalStripeWidth, ${position.y} - diagonalLength / 2],
    size: [stripeWidth, diagonalLength],
    fillColor: color,
    parent: stripesGroup
  });
}

// Rotate the entire group
stripesGroup.rotate(angle, [${position.x}, ${position.y}]);

// Apply clipping mask
const clippedGroup = new paper.Group({
  children: [clipRect, stripesGroup],
  clipped: true,
  parent: app.textItemGroup
});

// Remove the original group since it's now in the clipped group
// stripesGroup is already a child of clippedGroup

// Register the clipped group
const itemId = app.registerItem(clippedGroup, 'diagonal-stripes', { source: 'mcp' });
app.historyManager.saveState();

({ itemId, type: 'diagonal-stripes', position: { x: ${position.x}, y: ${position.y} }, stripeCount: numStripes * 2 });
`.trim();
  }

  /**
   * Generate code for batch creating multiple items
   */
  generateBatchCreate(input: z.infer<typeof BatchCreateInputSchema>): string {
    const validated = BatchCreateInputSchema.parse(input);
    return generateBatchCreateCode(validated.items);
  }

  /**
   * Generate code for batch modifying multiple items
   */
  generateBatchModify(input: z.infer<typeof BatchModifyInputSchema>): string {
    const validated = BatchModifyInputSchema.parse(input);
    return generateBatchModifyCode(validated.modifications);
  }

  /**
   * Generate code for creating a grid
   */
  generateCreateGrid(input: z.infer<typeof CreateGridInputSchema>): string {
    const validated = CreateGridInputSchema.parse(input);
    return generateCreateGridCode(
      validated.cols,
      validated.rows,
      validated.strokeColor,
      validated.strokeWidth,
      validated.animated,
      validated.waveSpeed,
      validated.waveAmplitude
    );
  }

  /**
   * Generate code for executing p5.js-style drawing code
   */
  generateP5Draw(code: string): string {
    return generateP5DrawCode(code);
  }

  /**
   * Generate code for creating a complete scene with items, relations, and animations
   */
  generateCreateScene(input: CreateSceneInput): string {
    const validated = CreateSceneInputSchema.parse(input);
    const {
      items,
      relations = [],
      animations = [],
      backgroundColor,
      backgroundGenerator,
      clearFirst = true,
    } = validated;

    const codeParts: string[] = [];

    // Start with a comment
    codeParts.push('// Create complete scene');
    codeParts.push('const nameToId = {};');
    codeParts.push('const results = { items: [], relations: [], animations: [] };');

    // Clear canvas if requested
    if (clearFirst) {
      codeParts.push(`
// Clear canvas
(function() {
  const items = app.itemRegistry.getAll();
  items.forEach(item => {
    try { item.remove(); } catch(e) {}
  });
  app.itemRegistry.clear();
})();
`);
    }

    // Set background color if provided
    if (backgroundColor) {
      codeParts.push(`
// Set background color
paper.project.activeLayer.children.forEach(c => {
  if (c.name === 'background') c.remove();
});
const bg = new paper.Path.Rectangle({
  point: [0, 0],
  size: [paper.view.size.width, paper.view.size.height],
  fillColor: '${backgroundColor}',
  name: 'background'
});
bg.sendToBack();
`);
    }

    // Execute background generator if provided
    if (backgroundGenerator) {
      codeParts.push(`
// Execute background generator
const _gen = app.generatorRegistry?.get('${backgroundGenerator}');
if (typeof _gen === 'function') {
  _gen();
} else if (_gen && typeof _gen.generate === 'function') {
  _gen.generate();
}
`);
    }

    // Create all items
    for (const item of items) {
      const { name, itemType, position = { x: 400, y: 300 }, properties = {} } = item;

      // Build properties string
      // CREATE_SCENE HAND-BUILT ITS OWN SHAPES, AND MOST OF THEM WERE WRONG.
      //
      // This emitted a per-type switch of raw Paper constructors — a parallel
      // implementation of app.create covering four cases, whose DEFAULT branch
      // made a 30px circle. So ellipse, triangle, polygon, path, line and arc —
      // six of the ten types this schema declares — silently rendered as a
      // small blue circle, and every property the switch did not name was
      // dropped. A pilot reported ellipse width/height being ignored; the same
      // values work through batch because batch calls app.create.
      //
      // Routed through app.create now, which is the only thing that knows all
      // 28 item types, the shape registry's own parameters, anchor, label,
      // rotation and the registry id. Deleting the copy is the fix: a second
      // implementation of "make a shape" could only ever drift from the first.
      const sceneParams: Record<string, unknown> = {
        x: position.x,
        y: position.y,
        ...properties,
      };

      codeParts.push(`
// Create item: ${name}
(function() {
  const item = app.create('${itemType}', ${JSON.stringify(sceneParams)});
  if (!item) {
    results.items.push({ name: '${name}', error: 'app.create returned nothing for type ${itemType} — check the type and its properties.' });
    return;
  }
  // create() registers and mints the id; only fall back for an older studio.
  const itemId = (item.data && item.data.id)
    ? item.data.id
    : app.registerItem(item, '${itemType}', { source: 'mcp-scene' });
  if (item.bringToFront) item.bringToFront();
  nameToId['${name}'] = itemId;
  results.items.push({ name: '${name}', itemId, type: '${itemType}' });
})();`);
    }

    // Establish relations
    for (const relation of relations) {
      const { source, target, type, params = {} } = relation;
      const paramsStr = JSON.stringify(params);

      codeParts.push(`
// Add relation: ${source} ${type} ${target}
(function() {
  const sourceId = nameToId['${source}'];
  const targetId = nameToId['${target}'];
  if (sourceId && targetId) {
    const params = ${paramsStr};
    app.addRelation(sourceId, targetId, '${type}', params);
    results.relations.push({ source: '${source}', target: '${target}', type: '${type}' });
  }
})();
`);
    }

    // Apply animations
    for (const animation of animations) {
      const { target, type, speed = 1.0, startTime, params = {} } = animation;
      const paramsStr = JSON.stringify({
        ...params,
        speed,
        ...(startTime !== undefined ? { animationDelay: startTime } : {}),
      });

      codeParts.push(`
// Apply animation: ${type} to ${target}
(function() {
  const targetId = nameToId['${target}'];
  if (targetId) {
    const targetItem = app.itemRegistry.get(targetId);
    if (targetItem) {
      const params = ${paramsStr};
      // startTime becomes animationDelay, which is what the engine reads
      // (PinePaper.js stores it on item.data.animationDelay). These are ambient
      // loops with no end, so there is no duration to map and none is invented
      // — staggering the STARTS is what makes a scene read as choreographed
      // rather than everything moving at once from frame zero.
      app.animate(targetItem, { animationType: '${type}', ...params });
      results.animations.push({ target: '${target}', type: '${type}'${startTime !== undefined ? `, startTime: ${startTime}` : ''} });
    }
  }
})();
`);
    }

    // Save history and return results
    codeParts.push(`
// Save history and return results
app.historyManager.saveState();
results;
`);

    return codeParts.join('\n');
  }

  // =============================================================================
  // DIAGRAM TOOLS
  // =============================================================================

  /**
   * Generate code for creating a diagram shape
   */
  generateCreateDiagramShape(input: CreateDiagramShapeInput): string {
    const validated = CreateDiagramShapeInputSchema.parse(input);
    const { shapeType, position, width, height, label, style } = validated;

    const styleStr = style ? JSON.stringify(style) : '{}';
    const widthVal = width || 120;
    const heightVal = height || 60;
    // JSON.stringify emits a complete escaped literal — hand-rolled quote
    // escaping missed backslashes (CodeQL js/incomplete-sanitization: an input
    // ending in \ escapes the closing quote; 'x\\'; evil()' breaks out).
    const labelStr = label ? JSON.stringify(label) : 'null';

    return `
// Create diagram shape: ${shapeType}
// POSITIONAL: createShape(shapeType, config). The type was being passed
// INSIDE the config object, where nothing reads it.
const shapeConfig = {
  position: { x: ${position.x}, y: ${position.y} },
  width: ${widthVal},
  height: ${heightVal},
  label: ${labelStr},
  style: ${styleStr}
};

const shape = app.diagramSystem.createShape('${shapeType}', shapeConfig);
if (!shape) throw new Error('createShape returned nothing for shapeType "${shapeType}" — call pinepaper_get_diagram_shapes for the registered types.');
const itemId = shape.data?.registryId || shape.id;
app.historyManager.saveState();

({ itemId, shapeType: '${shapeType}', position: { x: ${position.x}, y: ${position.y} } });
`.trim();
  }

  /**
   * Generate code for connecting two items
   */
  generateConnect(input: ConnectInput): string {
    const validated = ConnectInputSchema.parse(input);
    const {
      id,
      sourceItemId,
      targetItemId,
      routing,
      lineColor,
      lineWidth,
      lineStyle,
      headStyle,
      tailStyle,
      label,
      curvature,
      boltEnabled,
      boltColor,
    } = validated;

    const config: Record<string, unknown> = {
      routing,
      lineStyle,
      headStyle,
      tailStyle,
      curvature,
      boltEnabled,
      boltColor,
    };

    // A caller-supplied id is honoured by Connector (`config.id || <generated>`),
    // and it is the ONLY way a caller can address this connector afterwards:
    // update/remove take a connectorId, and the fallback the engine mints is
    // `connector_${Date.now()}_${random}` — unpredictable, and different on
    // every run of the same scene.
    if (id) config.id = id;

    if (lineColor) config.lineColor = lineColor;
    if (lineWidth) config.lineWidth = lineWidth;
    if (label) config.label = label;

    return `
// Connect items: ${sourceItemId} -> ${targetItemId}
const sourceItem = app.getItemById('${sourceItemId}');
const targetItem = app.getItemById('${targetItemId}');

if (!sourceItem) throw new Error('Source item not found: ${sourceItemId}');
if (!targetItem) throw new Error('Target item not found: ${targetItemId}');

const config = ${JSON.stringify(config, null, 2)};
const connector = app.diagramSystem.connect(sourceItem, targetItem, config);
const connectorId = connector.data?.registryId || connector.id;
app.historyManager.saveState();

// A REQUESTED id IS NOT NECESSARILY THE id YOU GOT.
//
// Connector itself honours 'config.id || <generated>', but DiagramSystem.connect
// rebuilds the config from an allowlist — routing, lineColor, lineWidth,
// headStyle, headSize, boltEnabled — and 'id' is not on it. So a caller's id is
// dropped before the Connector sees it and a timestamp id is minted instead,
// which then makes update_connector / remove_connector say "not found" for the
// id the caller chose. Engine-side, raised with fxtool; until it lands, the
// mismatch is REPORTED rather than left for a later call to trip over.
({
  connectorId,
  sourceItemId: '${sourceItemId}',
  targetItemId: '${targetItemId}',
  ...(${JSON.stringify(id ?? null)} && connectorId !== ${JSON.stringify(id ?? null)}
    ? { requestedId: ${JSON.stringify(id ?? null)},
        idHonoured: false,
        note: 'this studio dropped the id you asked for and minted its own — use connectorId above for update_connector and remove_connector, not the one you passed.' }
    : {}),
});
`.trim();
  }

  /**
   * Generate code for connecting specific ports
   */
  generateConnectPorts(input: ConnectPortsInput): string {
    const validated = ConnectPortsInputSchema.parse(input);
    const { id, sourceItemId, sourcePort, targetItemId, targetPort, config } = validated;

    // `id` sits at the TOP level of the tool's input but belongs inside the
    // engine's config object, which is where Connector reads it from. Merged
    // here rather than asking callers to nest it, since every other style
    // option they pass is nested and the id is not a style.
    const merged = id ? { ...(config ?? {}), id } : config;
    const configStr = merged ? JSON.stringify(merged, null, 2) : '{}';

    return `
// Connect ports: ${sourceItemId}:${sourcePort} -> ${targetItemId}:${targetPort}
const sourceItem = app.getItemById('${sourceItemId}');
const targetItem = app.getItemById('${targetItemId}');

if (!sourceItem) throw new Error('Source item not found: ${sourceItemId}');
if (!targetItem) throw new Error('Target item not found: ${targetItemId}');

const config = ${configStr};
const connector = app.diagramSystem.connectPorts(
  sourceItem, '${sourcePort}',
  targetItem, '${targetPort}',
  config
);
const connectorId = connector.data?.registryId || connector.id;
app.historyManager.saveState();

({ connectorId, sourceItemId: '${sourceItemId}', sourcePort: '${sourcePort}', targetItemId: '${targetItemId}', targetPort: '${targetPort}' });
`.trim();
  }

  /**
   * Generate code for adding ports to an item
   */
  generateAddPorts(input: AddPortsInput): string {
    const validated = AddPortsInputSchema.parse(input);
    const { itemId, portType, ports, count } = validated;

    // THE SCHEMA PROMISES MORE THAN THE ENGINE HAS. `addPorts(item, type)` takes
    // a type string and lays out that type's port set; there is no per-port
    // placement and no count. The old emitter passed {portType, ports, count}
    // as the second argument, which the engine tried to iterate — "t.forEach is
    // not a function" — so every call failed and the two extra fields looked
    // like they might have worked. Refused by name instead of dropped.
    if (ports !== undefined || count !== undefined) {
      const named = [ports !== undefined && 'ports', count !== undefined && 'count'].filter(Boolean).join(' and ');
      throw new Error(
        `add_ports cannot honour ${named}: this engine lays out a whole port SET by type `
        + `(portType '${portType}'), with no per-port placement or count. Drop ${named}, or place `
        + 'individual connection points as items and join them with pinepaper_connect.',
      );
    }

    return `
// Add ports to item: ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

// The second argument is a TYPE STRING, not a config object. Passing an
// object made the engine iterate it as a list — "t.forEach is not a function".
const result = app.diagramSystem.addPorts(item, '${portType}');
app.historyManager.saveState();

// addPorts returns the ports it made; older builds returned a count object.
const _added = Array.isArray(result) ? result.length : (result?.portsAdded ?? 0);
({ itemId: '${itemId}', portsAdded: _added, portType: '${portType}' });
`.trim();
  }

  /**
   * Generate code for auto-layout
   */
  generateAutoLayout(input: AutoLayoutInput): string {
    const validated = AutoLayoutInputSchema.parse(input);
    const { layoutType, itemIds, options } = validated;

    const itemIdsStr = itemIds ? JSON.stringify(itemIds) : 'null';
    const optionsStr = options ? JSON.stringify(options, null, 2) : '{}';

    return `
// Apply auto-layout: ${layoutType}
// Wrapped: applyLayout is async, and a bare top-level await only works on the
// governed path. A paren-led IIFE also keeps the trailing-expression capture.
(async function() {
const itemIds = ${itemIdsStr};
const options = ${optionsStr};

// applyLayout(items, type, options) — ITEMS first, and it takes live items
// rather than ids. It is async, and it resolves to undefined: reading
// result.itemsAffected off that throws, which is how a layout that worked
// reported as a crash.
const items = itemIds
  ? itemIds.map((id) => app.getItemById(id)).filter(Boolean)
  : (app.itemRegistry?.getAll?.() ?? []);
if (!items.length) throw new Error('auto_layout found no items to lay out' + (itemIds ? ' for the given itemIds' : ' on the canvas'));

await app.diagramSystem.applyLayout(items, '${layoutType}', options);
app.historyManager.saveState();

return { layoutType: '${layoutType}', itemsAffected: items.length, success: true };
})();
`.trim();
  }

  /**
   * Generate code for getting available diagram shapes
   */
  generateGetDiagramShapes(input: GetDiagramShapesInput): string {
    const validated = GetDiagramShapesInputSchema.parse(input);
    const { category } = validated;

    const categoryFilter = category ? `'${category}'` : 'null';

    return `
// Get available diagram shapes
const category = ${categoryFilter};
// The library is the registry; diagramSystem has no getAvailableShapes.
const _lib = app.diagramSystem?.shapeLibrary;
if (!_lib) throw new Error('app.diagramSystem.shapeLibrary unavailable — update FxTool');
const shapes = category ? _lib.getByCategory(category) : _lib.getAll();

({ shapes, count: shapes.length, category: ${categoryFilter} || 'all' });
`.trim();
  }

  /**
   * Generate code for updating a connector
   */
  generateUpdateConnector(input: UpdateConnectorInput): string {
    const validated = UpdateConnectorInputSchema.parse(input);
    const { connectorId, style, label, labelPosition } = validated;

    const updates: string[] = [];

    if (style) {
      updates.push(`style: ${JSON.stringify(style)}`);
    }
    if (label !== undefined) {
      updates.push(`label: ${JSON.stringify(label)}`);
    }
    if (labelPosition !== undefined) {
      updates.push(`labelPosition: ${labelPosition}`);
    }

    const updatesStr = updates.length > 0 ? `{ ${updates.join(', ')} }` : '{}';

    return `
// Update connector: ${connectorId}
const connector = app.getItemById('${connectorId}');
if (!connector) throw new Error('Connector not found: ${connectorId}');

const updates = ${updatesStr};

// THERE IS NO updateConnector. ConnectorManager publishes removeConnector,
// findConnector and updateSelectedStyle — nothing that edits one connector's
// properties in place. The old emitter called app.diagramSystem.updateConnector
// and reported updated:true, so a caller changing a connector's colour got a
// success and an unchanged connector.
//
// Applied directly where the property is a plain Paper.js one, and refused by
// name where it is not, rather than claiming a change that did not happen.
// The engine gained getConnector(id) / updateConnector(id, style), which is
// the call this tool always wanted: addressable by the id a connector is
// created and serialised with. Guarded, because a studio predating that still
// has to do something sensible rather than throw.
if (typeof app.diagramSystem?.updateConnector === 'function') {
  const res = app.diagramSystem.updateConnector('${connectorId}', updates);
  if (res && res.ok === false) { return { success: false, error: res.reason || 'the connector could not be updated' }; }
  app.historyManager.saveState();
  return { connectorId: '${connectorId}', updated: true, applied: Object.keys(updates) };
}

const _applied = [];
const _unsupported = [];
for (const [k, v] of Object.entries(updates)) {
  if (k === 'lineColor' && connector.strokeColor !== undefined) { connector.strokeColor = v; _applied.push(k); }
  else if (k === 'lineWidth' && connector.strokeWidth !== undefined) { connector.strokeWidth = v; _applied.push(k); }
  else _unsupported.push(k);
}
if (_applied.length) { app.historyManager.saveState(); app._scheduleRepaint?.(); }
if (_unsupported.length && !_applied.length) {
  throw new Error(
    'this build cannot update ' + _unsupported.join(', ') + ' on an existing connector — '
    + 'this build has no per-connector update — app.diagramSystem.updateConnector arrived later. '
    + 'Update the studio for it. Removing and recreating the connector works, but mints a NEW id '
    + 'and orphans anything holding the old one, so it is a last resort rather than the fix.'
  );
}

({ connectorId: '${connectorId}', updated: _applied.length > 0, applied: _applied, unsupported: _unsupported });
`.trim();
  }

  /**
   * Generate code for removing a connector
   */
  generateRemoveConnector(input: RemoveConnectorInput): string {
    const validated = RemoveConnectorInputSchema.parse(input);
    const { connectorId } = validated;

    return `
// Remove connector: ${connectorId}
const connector = app.getItemById('${connectorId}');
if (!connector) throw new Error('Connector not found: ${connectorId}');

app.diagramSystem.connectorManager.removeConnector(connector);
app.historyManager.saveState();

({ connectorId: '${connectorId}', removed: true });
`.trim();
  }

  /**
   * Generate code for diagram mode control
   */
  generateDiagramMode(input: DiagramModeInput): string {
    const validated = DiagramModeInputSchema.parse(input);
    const { action, mode, shapeType } = validated;

    switch (action) {
      case 'activate':
        return `
// Activate diagram mode
app.diagramSystem.activate();
({ action: 'activate', active: true });
`.trim();

      case 'deactivate':
        return `
// Deactivate diagram mode
app.diagramSystem.deactivate();
({ action: 'deactivate', active: false });
`.trim();

      case 'toggle':
        return `
// Toggle diagram mode
const isActive = app.diagramSystem.toggle();
({ action: 'toggle', active: isActive });
`.trim();

      case 'setMode':
        const modeStr = mode ? `'${mode}'` : "'select'";
        const shapeStr = shapeType ? `, '${shapeType}'` : '';
        return `
// Set diagram tool mode
app.diagramSystem.setMode(${modeStr}${shapeStr});
({ action: 'setMode', mode: ${modeStr}${shapeType ? `, shapeType: '${shapeType}'` : ''} });
`.trim();

      default:
        return `
// Unknown diagram mode action
throw new Error('Unknown diagram mode action: ${action}');
`.trim();
    }
  }

  // ===========================================================================
  // AGENT FLOW MODE CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code for starting an agent job
   */
  generateAgentStartJob(input: AgentStartJobInput): string {
    const validated = AgentStartJobInputSchema.parse(input);
    const { name, screenshotPolicy, canvasPreset, clearCanvas, includeOntology } = validated;

    const nameStr = name ? JSON.stringify(name) : 'null';
    const policyStr = screenshotPolicy || 'on_complete';
    const shouldClear = clearCanvas !== false;
    const wantOntology = includeOntology !== false;

    let code = `
// Start agent job
(async function() {
  const jobOptions = {
    name: ${nameStr},
    screenshotPolicy: '${policyStr}',
    agentMode: true
  };
`;

    if (shouldClear) {
      code += `
  // Clear canvas — uploaded media first (it lives outside the item groups)${MEDIA_PURGE}
  if (app.clearCanvas) {
    app.clearCanvas();
  } else {
    if (app.textItemGroup) app.textItemGroup.removeChildren();
    if (app.patternGroup) app.patternGroup.removeChildren();
    if (app.itemRegistry) app.itemRegistry.clear();
    if (app.relationRegistry) app.relationRegistry.clear();
  }
`;
    }

    if (canvasPreset) {
      code += `
  // Set canvas size to preset (platform name → engine preset key)
  app.setCanvasSize('${canvasPresetFor(canvasPreset)}');
  // Allow canvas resize to take effect
  await new Promise(r => setTimeout(r, 50));
`;
    }

    if (wantOntology) {
      code += `
  // Capture initial canvas ontology so the agent has baseline context
  // without a follow-up pinepaper_get_canvas_ontology call. After
  // clearCanvas this is a tiny empty-state payload; with clearCanvas:false
  // it captures whatever's already on the canvas. Older FxTool builds
  // without exportCanvasOntology produce an _ontologyUnavailable: true
  // marker so the agent knows to fall back to pinepaper_get_items.
  let _ontology = null;
  let _ontologyUnavailable = false;
  try {
    if (app.exportCanvasOntology) {
      _ontology = app.exportCanvasOntology();
    } else {
      _ontologyUnavailable = true;
    }
  } catch (e) {
    _ontologyUnavailable = true;
  }
`;
    }

    code += `
  // Return job context with canvas size${wantOntology ? ' + initial ontology' : ''}
  const _cs = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 };
  return {
    success: true,
    jobStarted: true,
    name: ${nameStr},
    screenshotPolicy: '${policyStr}',
    canvasPreset: ${canvasPreset ? `'${canvasPreset}'` : 'null'},
    canvasCleared: ${shouldClear},
    canvasSize: { width: _cs.width || 800, height: _cs.height || 600 }${wantOntology ? `,
    ontology: _ontology,
    ontologyUnavailable: _ontologyUnavailable || undefined` : ''}
  };
})();
`;

    return code.trim();
  }

  /**
   * Generate code for ending an agent job
   */
  generateAgentEndJob(input: AgentEndJobInput): string {
    const validated = AgentEndJobInputSchema.parse(input);
    const { analyzeContent } = validated;
    // includeScreenshot is the published name; takeScreenshot the older one.
    const takeScreenshot = validated.includeScreenshot ?? validated.takeScreenshot;

    const shouldAnalyze = analyzeContent !== false;

    let code = `
// End agent job
(async function() {
  const result = {
    success: true,
    jobEnded: true
  };
`;

    if (shouldAnalyze) {
      code += `
  // Analyze content
  const analysis = {
    hasAnimations: false,
    animationTypes: [],
    colorComplexity: 'simple',
    itemCount: 0,
    canvasSize: { width: 0, height: 0 },
    hasRelations: false,
    relationTypes: [],
    hasGradients: false,
    hasShadows: false,
    hasText: false,
    hasImages: false,
  };

  // THE ARTBOARD, NOT THE BACKING STORE.
  //
  // canvasEl.width and paper.view.size are both in device pixels, so a
  // 1920x1080 artboard was reported as 2233x1472 — measured from production.
  // That is not even the device pixel ratio (a 2233px store in a 924px box is
  // 2.4166), so a caller cannot divide it back out. Anything derived from it
  // is wrong by an unknown factor, and synthetic clicks computed from it miss
  // in silence. getCanvasSize() is the artboard the caller set.
  if (typeof app.getCanvasSize === 'function') {
    const cs = app.getCanvasSize();
    if (cs && cs.width) analysis.canvasSize = { width: cs.width, height: cs.height };
  }
  if (!analysis.canvasSize.width) {
    if (app.canvasSize && app.canvasSize.width) {
      analysis.canvasSize = { width: app.canvasSize.width, height: app.canvasSize.height };
    } else if (app.canvasEl) {
      // Last resort on a studio with neither: a backing-store size is better
      // than zero, and it is flagged so nobody treats it as the artboard.
      analysis.canvasSize = { width: app.canvasEl.width, height: app.canvasEl.height, backingStore: true };
    } else if (paper.view) {
      analysis.canvasSize = { width: paper.view.size.width, height: paper.view.size.height, backingStore: true };
    }
  }

  // Count items and analyze
  const items = app.itemRegistry ? app.itemRegistry.getAll() : [];
  analysis.itemCount = items.length;

  const animationSet = new Set();
  const relationSet = new Set();

  items.forEach(entry => {
    const item = entry.item;
    const data = item.data || {};

    if (entry.type === 'text' || item.className === 'PointText') analysis.hasText = true;
    if (item.className === 'Raster') analysis.hasImages = true;
    if (data.animationType) {
      analysis.hasAnimations = true;
      animationSet.add(data.animationType);
    }
    // Detect keyframe animations (added via app.addAnimation with keyframes array)
    if (data.keyframes || data.animation || data.keyframeAnimation) {
      analysis.hasAnimations = true;
      animationSet.add('keyframe');
    }
    if (item.fillColor && item.fillColor.gradient) analysis.hasGradients = true;
    if (item.shadowColor || item.shadowBlur) analysis.hasShadows = true;
  });

  // FxTool has no animationManager — animations are detected via item.data.animationType walk above
  // Check timeline for active animations
  if (app.timelineState?.isPlaying || app.animatedItems?.size > 0) {
    analysis.hasAnimations = true;
    animationSet.add('timeline');
  }

  analysis.animationTypes = Array.from(animationSet);

  // Check relations
  if (app.relationRegistry) {
    // getAll() has never existed on the registry, so this branch always took
    // the empty fallback and every analysis reported NO relations. getStats()
    // is the real accessor and answers both questions directly:
    // associationsByType is keyed by relation type.
    const relStats = typeof app.relationRegistry.getStats === 'function'
      ? app.relationRegistry.getStats()
      : null;
    (Object.keys((relStats && relStats.associationsByType) || {})).forEach(t => relationSet.add(t));
    analysis.relationTypes = Array.from(relationSet);
    analysis.hasRelations = !!relStats && (relStats.activeItems > 0 || analysis.relationTypes.length > 0);
    if (analysis.hasRelations) analysis.hasAnimations = true;
  }

  // Determine color complexity
  if (analysis.hasGradients) {
    analysis.colorComplexity = 'gradient';
  } else if (analysis.itemCount > 20 || analysis.hasShadows) {
    analysis.colorComplexity = 'complex';
  }

  result.analysis = analysis;

  // Generate recommendations
  const recommendations = [];
  if (analysis.hasAnimations) {
    if (analysis.hasGradients || analysis.colorComplexity === 'complex') {
      recommendations.push({ platform: 'web', format: 'webm', confidence: 0.9, reason: 'Animated content with gradients' });
      recommendations.push({ platform: 'instagram', format: 'mp4', confidence: 0.85, reason: 'Social media video' });
    } else {
      recommendations.push({ platform: 'web', format: 'svg', confidence: 0.95, reason: 'Simple animations as SVG' });
      recommendations.push({ platform: 'twitter', format: 'gif', confidence: 0.8, reason: 'Social media GIF' });
    }
  } else {
    if (analysis.colorComplexity === 'simple' && !analysis.hasImages) {
      recommendations.push({ platform: 'web', format: 'svg', confidence: 0.95, reason: 'Vector graphics' });
    } else {
      recommendations.push({ platform: 'instagram', format: 'png', confidence: 0.9, reason: 'High quality static' });
    }
  }
  result.recommendations = recommendations;
`;
    }

    if (takeScreenshot) {
      code += `
  // Capture screenshot
  const canvas = document.querySelector('canvas');
  if (canvas) {
    result.screenshot = canvas.toDataURL('image/png');
  }
`;
    }

    code += `
  return result;
})();
`;

    return code.trim();
  }

  /**
   * Generate code for fast canvas reset
   */
  generateAgentReset(input: AgentResetInput): string {
    const validated = AgentResetInputSchema.parse(input);
    const { canvasPreset, backgroundColor, preserveBackground } = validated;

    let code = `
// Fast canvas reset
(async function() {
`;

    if (!preserveBackground) {
      code += `
  // Clear canvas completely
  if (app.clearCanvas) {
    app.clearCanvas();
  } else {
    if (app.textItemGroup) app.textItemGroup.removeChildren();
    if (app.patternGroup) app.patternGroup.removeChildren();
    if (app.itemRegistry) app.itemRegistry.clear();
    if (app.relationRegistry) app.relationRegistry.clear();
  }
`;
    } else {
      code += `
  // Clear items but preserve background
  if (app.textItemGroup) app.textItemGroup.removeChildren();
  if (app.itemRegistry) app.itemRegistry.clear();
  if (app.relationRegistry) app.relationRegistry.clear();
`;
    }

    if (canvasPreset) {
      code += `
  // Set canvas to preset (platform name → engine preset key)
  app.setCanvasSize('${canvasPresetFor(canvasPreset)}');
  // Allow canvas resize to take effect
  await new Promise(r => setTimeout(r, 50));
`;
    }

    if (backgroundColor && !preserveBackground) {
      code += `
  // Set background color
  app.setBackgroundColor('${backgroundColor}');
`;
    }

    code += `
  // Save state
  if (app.historyManager) app.historyManager.saveState();
  const _cs = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 };
  return { success: true, reset: true, canvasPreset: ${canvasPreset ? `'${canvasPreset}'` : 'null'}, canvasSize: { width: _cs.width || 800, height: _cs.height || 600 } };
})();
`;

    return code.trim();
  }

  /**
   * Generate code for batch execute
   */
  generateAgentBatchExecute(input: AgentBatchExecuteInput): string {
    const validated = AgentBatchExecuteInputSchema.parse(input);
    const { operations, atomic } = validated;
    const isAtomic = atomic !== false;
    // Fold duplicate keyframe_animate targets so a later op can't silently
    // clobber an earlier track (app.addAnimation replaces, never merges).
    const mergePlan = planKeyframeMerges(operations as never);

    let code = `
// Batch execute ${operations.length} operations
(async function() {
  // An op's own verdict. Deliberately narrow, matching the server-side rule:
  // only an explicit success:false or ok:false is a failure, because most ops
  // return a bare value (an id, a count) and treating a missing field as
  // refusal would fail every one of them.
  const _opFailure = (v) => {
    if (!v || typeof v !== 'object') return null;
    if (v.success !== false && v.ok !== false) return null;
    return (typeof v.error === 'string' && v.error)
      || (typeof v.reason === 'string' && v.reason)
      || 'the operation reported failure without naming a reason';
  };
  const results = [];
  const itemIds = [];
  let success = true;

  try {
`;

    operations.forEach((op, index) => {
      const opCode = this.generateBatchOperationCode(op, index, mergePlan);
      // $N variable references are documented as "items CREATED in earlier
      // operations" — only `create` results may extend the itemIds array.
      // animate/keyframe_animate/modify/delete also return { itemId } (the
      // TARGET's id), and unconditionally pushing those shifted every later
      // $N reference: a batch of [create ×5, keyframe_animate ×5, create ×5,
      // keyframe_animate ×5] silently re-animated the FIRST five items and
      // left the second five without keyframes (mis-oriented/mis-animated
      // vehicles, 2026-07-30). `group` already follows this rule by
      // returning groupId instead of itemId.
      const claimsItemSlot = op.type === 'create';
      code += `
    // Operation ${index}: ${op.type}
    try {
      const result${index} = await (async () => {
        ${opCode}
      })();
      // NOT THROWING IS NOT SUCCEEDING. An op that RETURNS { success: false }
      // — a guard that found a facade missing, a preset the engine does not
      // have, a precondition unmet — raises nothing, so this recorded it as a
      // success and the batch reported success over it. Measured on
      // applyAnimatedMask(item, 'star'): the per-op error was perfectly good
      // and the batch still said everything worked.
      const failed${index} = _opFailure(result${index});
      if (failed${index}) {
        // ATOMIC: throw WITHOUT recording, and let the catch below record it
        // once. Doing both put two entries in for one failed op.
        ${isAtomic ? `throw new Error(failed${index});` : `results.push({ index: ${index}, success: false, error: failed${index}, result: result${index} });
        success = false;`}
      } else {
        results.push({ index: ${index}, success: true, result: result${index} });
        ${claimsItemSlot ? `if (result${index} && result${index}.itemId) {
          itemIds.push(result${index}.itemId);
        }` : ''}
      }
    } catch (opError) {
      results.push({ index: ${index}, success: false, error: opError.message });
      ${isAtomic ? 'throw opError;' : 'success = false;'}
    }
`;
    });

    code += `
    // Save state
    if (app.historyManager) app.historyManager.saveState();

    const _cs = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 };
    // Name WHICH ops failed on the result itself. A caller reading a failed
    // 60-op batch should not have to scan sixty entries to learn that op 41
    // could not find a preset.
    const _failed = results.filter((r) => !r.success);
    return { success, itemIds, results, operationCount: ${operations.length},
      failedCount: _failed.length,
      ...(_failed.length ? { error: _failed.map((r) => 'op ' + r.index + ': ' + r.error).join('; ') } : {}),
      canvasSize: { width: _cs.width || 800, height: _cs.height || 600 } };
  } catch (e) {
    const _cs = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 };
    return { success: false, error: e.message, itemIds, results, operationCount: ${operations.length}, canvasSize: { width: _cs.width || 800, height: _cs.height || 600 } };
  }
})();
`;

    return code.trim();
  }

  /**
   * Generate code for a single batch operation
   */
  private generateBatchOperationCode(op: z.infer<typeof AgentBatchExecuteInputSchema>['operations'][0], index: number, mergePlan?: KeyframeMergePlan): string {
    switch (op.type) {
      case 'create': {
        // THE SAME CREATE AS create_item, NOT A SECOND ONE.
        //
        // This case was its own app.create call, and every create_item fix since
        // — fontWeight / leading, font loading, countdown content, no-fill,
        // dashes, lifetimes, the unread-property report — passed it by: a batch
        // read fontWeight 700 back as normal and a countdown stayed at 00:10
        // for a 12 s MP4 (round 8 DD, 1.67). It now runs generateCreateItemCode,
        // the exact emitter create_item uses, adapted to return its result
        // inside this op's function.
        const pos = op.position || { x: 400, y: 300 };
        const createProps = withRadiusAxes((op.properties || {}) as Record<string, unknown>);
        const returning = asReturningBody(generateCreateItemCode(op.itemType as ItemType, pos, { ...(op.properties || {}) } as Record<string, unknown>, undefined, op.position !== undefined));
        let createCode = `
const __created = await (async function() {
${returning}
})();`;
        // Coordinate-built items (path from segments/pathData, line/arc from
        // from/through/to) derive their geometry from those coordinates and
        // IGNORE params.position — so `create` at a point silently produced an
        // item at its raw coordinates instead. Re-seat it after create when the
        // caller explicitly asked for a position. Guarded on an explicit
        // op.position so absolute-coordinate geometry (the common case, which
        // passes no position) is never snapped to the injected default.
        if (op.position && isCoordinateBuilt(op.itemType, createProps)) {
          createCode += `
// create() builds this item type from its own coordinates and ignores
// params.position — apply the caller's explicit position after the fact.
const __it = __created && __created.itemId ? app.getItemById(__created.itemId) : null;
if (__it && __it.position) __it.position = new paper.Point(${pos.x}, ${pos.y});`;
        }
        createCode += `
return __created;
`;
        return createCode;
      }

      case 'modify': {
        const itemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        // modify_item's own emitter, as create is create_item's (see above):
        // the batch's modifyItem call missed text styles, font loading, audio
        // level, no-fill, lifetimes, smoothing and the unread-property report.
        // The emitter embeds the id as a literal; a batch ref ($N) is only known
        // at run time, so it is generated with a placeholder and the runtime
        // variable put in its place.
        const single = generateModifyItemCode('__MID__', (op.properties || {}) as Record<string, unknown>).trim()
          .replace(/'__MID__'/g, '__mid')
          .replace(/__MID__/g, "' + __mid + '")
          .replace(/;\s*$/, '');
        return `
const __mid = ${itemRef};
const __r = await ${single};
if (__r && __r.success !== false) __r.modified = true;
return __r;
`;
      }

      case 'animate':
        const animItemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const animOpts = JSON.stringify(op.animationOptions || {});
        return `
const targetId = ${animItemRef};
const item = app.getItemById(targetId);
if (!item) throw new Error('Item not found: ' + targetId);
app.animate(item, { animationType: '${op.animationType}', ...${animOpts} });
return { itemId: targetId, animationType: '${op.animationType}' };
`;

      case 'relation':
        const srcRef = op.sourceId?.startsWith('$')
          ? `itemIds[${op.sourceId.substring(1)}]`
          : `'${op.sourceId}'`;
        const tgtRef = op.targetId?.startsWith('$')
          ? `itemIds[${op.targetId.substring(1)}]`
          : `'${op.targetId}'`;
        const relOpts = JSON.stringify(op.relationOptions || {});
        return `
const sourceId = ${srcRef};
const targetId = ${tgtRef};
const source = app.getItemById(sourceId);
const target = app.getItemById(targetId);
if (!source) throw new Error('Source not found: ' + sourceId);
if (!target) throw new Error('Target not found: ' + targetId);
const relationId = app.addRelation(source, target, '${op.relationType}', ${relOpts});
return { relationId, sourceId, targetId, relationType: '${op.relationType}' };
`;

      case 'delete':
        const delRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        return `
const targetId = ${delRef};
const item = app.getItemById(targetId);
if (!item) throw new Error('Item not found: ' + targetId);
item.remove();
if (app.itemRegistry) app.itemRegistry.unregister(targetId);
return { itemId: targetId, deleted: true };
`;

      case 'group': {
        // Resolve each ref ($N → itemIds[N]; literal → quoted id) into a JS array.
        const refs = (op.itemIds || []).map((ref) =>
          ref?.startsWith('$') ? `itemIds[${ref.substring(1)}]` : `'${ref}'`,
        );
        const idsArrayExpr = `[${refs.join(', ')}]`;
        const nameExpr = op.groupName !== undefined ? JSON.stringify(op.groupName) : 'undefined';
        // Returns { groupId, ... } (no itemId) so it does NOT shift $N indices — like relation.
        return `
return (function() {${this.groupCodeBody(idsArrayExpr, nameExpr)}
})();
`;
      }

      case 'set_background':
        const bgColor = op.backgroundColor || (op.properties as any)?.color || '#000000';
        return `
app.setBackgroundColor('${bgColor}');
return { success: true, backgroundColor: '${bgColor}' };
`;

      case 'execute_generator':
        const genName = op.generatorName || 'drawSunburst';
        const genParams = JSON.stringify(aliasGeneratorParams(genName, (op.generatorParams || {}) as Record<string, unknown>));
        return `${emitGeneratorRun(genName, genParams, op.generatorRegion as GeneratorRegion | undefined)}
`;

      case 'set_canvas_size': {
        const w = op.width || 1080;
        const h = op.height || 1080;
        const sizeArg = op.preset ? `'${op.preset}'` : `{ width: ${w}, height: ${h} }`;
        return `
// Read the verdict, as the standalone tool now does: an unknown preset or an
// out-of-range dimension is refused by name, and reporting the size we ASKED
// for left the batch claiming a resize that never happened.
const _cs = app.setCanvasSize(${sizeArg});
if (_cs && _cs.ok === false) {
  return { success: false, error: _cs.reason || 'the canvas size was refused',
    ...(_cs.known ? { knownPresets: _cs.known } : {}) };
}
await new Promise(r => setTimeout(r, 50));
return { success: true, width: (_cs && _cs.width) || ${w}, height: (_cs && _cs.height) || ${h} };
`;
      }

      case 'keyframe_animate': {
        // Folded into an earlier op on the same target (see planKeyframeMerges).
        const foldTarget = mergePlan?.foldedInto.get(index);
        if (foldTarget !== undefined) {
          return `
// Keyframes merged into operation ${foldTarget} (same target). A keyframe track
// is replaced wholesale, so emitting both here would silently drop one.
return { itemId: ${op.itemId?.startsWith('$') ? `itemIds[${op.itemId.substring(1)}]` : `'${op.itemId}'`}, merged: true, mergedInto: ${foldTarget} };
`;
        }
        const mergedPayload = mergePlan?.merged.get(index);
        const kfItemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const kfSource = mergedPayload ? mergedPayload.keyframes : (op.keyframes || []);
        const kfJson = JSON.stringify(normalizeKeyframePositions(kfSource as never));
        const kfDuration = mergedPayload
          ? mergedPayload.duration
          : (op.duration || (op.keyframes?.length ? Math.max(...op.keyframes.map(k => k.time)) : 5));
        const kfLoop = mergedPayload ? mergedPayload.loop : (op.loop ?? false);
        return `
const targetId = ${kfItemRef};
app.addAnimation(targetId, ${kfJson}, { duration: ${kfDuration}, loop: ${kfLoop} });
return { itemId: targetId, duration: ${kfDuration}, loop: ${kfLoop} };
`;
      }

      case 'apply_mask': {
        const maskItemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const maskOpts = JSON.stringify(op.maskOptions || {});
        const preset = op.maskPreset || op.maskType || 'wipeLeft';
        return `
const targetId = ${maskItemRef};
const item = app.getItemById(targetId);
if (!item) throw new Error('Item not found: ' + targetId);
if (!app.applyAnimatedMask) throw new Error('Mask system not available');
const maskedGroup = app.applyAnimatedMask(item, '${preset}', ${maskOpts});
const maskRej = maskedGroup && maskedGroup.data && maskedGroup.data.maskAnimationRejected;
if (maskRej) {
  return { success: false, itemId: targetId, error: 'Masked, but animation preset "' + maskRej.requested + '" is unknown — it will NOT animate.', requested: maskRej.requested, known: maskRej.known };
}
return { success: !!maskedGroup, itemId: targetId, preset: '${preset}' };
`;
      }

      case 'apply_effect': {
        const effItemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const effParams = JSON.stringify(op.effectParams || {});
        return `
const targetId = ${effItemRef};
const item = app.getItemById(targetId);
if (!item) throw new Error('Item not found: ' + targetId);
// PROPAGATE the engine's verdict. This discarded it and returned its own
// shape, so an effect the engine refused — an unknown preset, a facade that
// is not loaded — was recorded as applied. The batch cannot report what the
// op never tells it.
const _eff = app.applyEffect(item, '${op.effectType || 'sparkle'}', ${effParams});
if (_eff && (_eff.success === false || _eff.ok === false)) {
  return { success: false, itemId: targetId, effectType: '${op.effectType || 'sparkle'}',
    error: _eff.error || _eff.reason || 'the effect was refused without a reason' };
}
return { itemId: targetId, effectType: '${op.effectType || 'sparkle'}' };
`;
      }

      case 'play_timeline': {
        const ptAction = op.action || 'play';
        const ptDuration = op.duration || 5;
        const ptLoop = op.loop ?? false;
        if (ptAction === 'play') {
          return `
app.playKeyframeTimeline(${ptDuration}, ${ptLoop}, { timeUnits: 'seconds' });
return { success: true, action: 'play', duration: ${ptDuration}, loop: ${ptLoop} };
`;
        } else if (ptAction === 'stop') {
          return `
app.stopKeyframeTimeline();
return { success: true, action: 'stop' };
`;
        } else {
          return `
app.setPlaybackTime(${op.time || 0});
return { success: true, action: 'seek', time: ${op.time || 0} };
`;
        }
      }

      default:
        return `throw new Error('Unknown operation type: ${(op as any).type}');`;
    }
  }

  /**
   * Generate code for smart export
   */
  /**
   * Read one slice of a held export, base64-encoded.
   *
   * The handler calls this in a loop and appends each chunk to the file it was
   * going to write anyway, so no more than one chunk is ever in memory on
   * either side of the bridge. Every refusal the engine can give is passed
   * through untouched — a bad range names the real size, and an id that was
   * EVICTED to make room says so rather than reporting not-found, because
   * those are different bugs from the caller's side.
   */
  generateReadExportChunk(exportId: string, offset: number, length?: number): string {
    const range: Record<string, number> = { offset };
    if (typeof length === 'number') range.length = length;
    return `
// Read export chunk at ${offset}
(async function() {
  if (!app.exportEngine || typeof app.exportEngine.readExport !== 'function') {
    return { ok: false, reason: 'app.exportEngine.readExport unavailable — update FxTool' };
  }
  return await app.exportEngine.readExport(${JSON.stringify(exportId)}, ${JSON.stringify(range)});
})();`.trim();
  }

  /**
   * What the studio is still holding.
   *
   * `id` IS the OPFS filename and OPFS is origin-persistent, so this survives a
   * page reload: an export whose id was lost — to a dropped tool result, a
   * crashed session, a reload — is recoverable from here rather than only by
   * rendering it again. Newest first, which is the order a caller looking for
   * "the one I just made" wants.
   */
  generateListExports(): string {
    return `
// What the export store is holding
(async function() {${ENSURE_EXPORT_ENGINE}
  if (!app.exportEngine || typeof app.exportEngine.listExports !== 'function') {
    return { ok: false, reason: 'app.exportEngine.listExports unavailable — update FxTool' };
  }
  return { ok: true, exports: await app.exportEngine.listExports() };
})();`.trim();
  }

  /**
   * Drop a held export once its bytes are safely on disk here.
   *
   * Called only after the whole file has been written. A release before that
   * would be unrecoverable: the store is the only copy.
   */
  generateReleaseExport(exportId: string): string {
    return `
// Release held export
(async function() {
  if (!app.exportEngine || typeof app.exportEngine.releaseExport !== 'function') {
    return { ok: false, reason: 'app.exportEngine.releaseExport unavailable — update FxTool' };
  }
  return await app.exportEngine.releaseExport(${JSON.stringify(exportId)});
})();`.trim();
  }

  generateAgentExport(input: AgentExportInput): string {
    const validated = AgentExportInputSchema.parse(input);
    const { platform, format, quality, framing, duration, estimateOnly, scale, fps, pdf: pdfOpts, region, time: stillTime, maxBytes, loop: gifLoop, broadcast, broadcastHeadroom, bitrate, minBitrate, bitrateMode, transparent, alphaQuantizer, ad: adOpts } = validated;
  // Encoder options (FxTool 16719759); the schema keeps them to mp4 / webm.
  const videoEncodeOpts: Record<string, unknown> = {};
  if (broadcast) videoEncodeOpts.broadcast = true;
  // Headroom defaults to 12 with broadcast (retest of caa9560): on a
  // hard-edged white-on-black scene it measured 17-233 with nothing out of
  // range, where 0 left 0.34% out and a post-hoc clip made it worse. 0 is
  // still available by asking for it.
  const headroomDefaulted = !!broadcast && broadcastHeadroom === undefined;
  if (broadcast) videoEncodeOpts.broadcastHeadroom = broadcastHeadroom ?? 12;
  if (bitrate !== undefined) videoEncodeOpts.bitrate = bitrate;
  if (minBitrate !== undefined) videoEncodeOpts.minBitrate = minBitrate;
  if (bitrateMode !== undefined) videoEncodeOpts.bitrateMode = bitrateMode;
  // A transparent WebM (FxTool 1833b397) rides the store route too.
  const webmAlpha = format === 'webm' && transparent === true;
  if (webmAlpha) { videoEncodeOpts.transparent = true; if (alphaQuantizer !== undefined) videoEncodeOpts.alphaQuantizer = alphaQuantizer; }
  const encodeOptsJs = Object.keys(videoEncodeOpts).length ? `, ...${JSON.stringify(videoEncodeOpts)}` : '';
    const qualityLevel = quality || 'standard';
    const videoDuration = duration ?? 5;

    // Quality settings (bitrate in bps for VideoEncoder)
    const qualitySettings = {
      draft: { compression: 0.6, fps: 15, dpi: 72, bitrate: 2_000_000 },
      standard: { compression: 0.85, fps: 30, dpi: 150, bitrate: 5_000_000 },
      high: { compression: 0.95, fps: 60, dpi: 300, bitrate: 8_000_000 },
    }[qualityLevel];

    // Platform presets
    const platformPresets: Record<string, { width: number; height: number; staticFormat: string; animatedFormat: string }> = {
      'instagram': { width: 1080, height: 1080, staticFormat: 'png', animatedFormat: 'mp4' },
      'instagram-story': { width: 1080, height: 1920, staticFormat: 'png', animatedFormat: 'mp4' },
      'tiktok': { width: 1080, height: 1920, staticFormat: 'png', animatedFormat: 'mp4' },
      'youtube': { width: 1920, height: 1080, staticFormat: 'png', animatedFormat: 'mp4' },
      'youtube-thumbnail': { width: 1280, height: 720, staticFormat: 'png', animatedFormat: 'png' },
      'twitter': { width: 1200, height: 675, staticFormat: 'png', animatedFormat: 'gif' },
      'linkedin': { width: 1200, height: 627, staticFormat: 'png', animatedFormat: 'gif' },
      'web': { width: 800, height: 600, staticFormat: 'svg', animatedFormat: 'svg' },
      'print-a4': { width: 2480, height: 3508, staticFormat: 'pdf', animatedFormat: 'pdf' },
      'print-letter': { width: 2550, height: 3300, staticFormat: 'pdf', animatedFormat: 'pdf' },
      'print-a4-landscape': { width: 3508, height: 2480, staticFormat: 'pdf', animatedFormat: 'pdf' },
      'print-letter-landscape': { width: 3300, height: 2550, staticFormat: 'pdf', animatedFormat: 'pdf' },
    };

    const preset = platformPresets[platform] || platformPresets['web'];

    // SCALE is the only honest size control this surface has.
    //
    // A caller who wants a smaller file reaches for a bitrate, and there is
    // nowhere to put one: VideoExporter computes its own target from
    // resolution, quality and fps via _calculateBitrate and never reads a
    // caller-supplied value — passing one would be a knob that silently does
    // nothing. Resolution is an INPUT to that calculation, so halving the
    // frame genuinely halves the encode target, and it is also what makes a
    // preview render fast. One number, both jobs, and it is real.
    //
    // Rounded to EVEN: H.264 chroma subsampling is 4:2:0, and an odd dimension
    // is rejected by the encoder rather than rounded for you.
    const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);
    const scaled = scale !== undefined && scale !== 1
      ? { width: even(preset.width * scale), height: even(preset.height * scale) }
      : { width: preset.width, height: preset.height };
    // 'auto' MEANS THE CANVAS, NOT A PRESET THAT HAPPENS TO BE FIRST.
    //
    // `platform` defaults to 'auto', 'auto' is not a key in platformPresets,
    // and the lookup falls through to `web` — so an export that named no
    // platform silently rendered 800x600. A beta probe measured exactly that:
    // three exports of a 960x540 canvas all came back 800x600, reported as a
    // dimension mismatch because from outside it is one. Nothing said the
    // canvas had been replaced by a preset.
    //
    // Resolved in the generated code rather than here, because the canvas size
    // is only known in the page. The preset stays the fallback for a studio
    // too old to report one, and `scale` still applies either way.
    const usesCanvasSize = !platformPresets[platform];
    // Resolve "auto" format to the platform's recommended format
    const exportFormat = (!format || format === 'auto') ? preset.staticFormat : format;

    // AUDIO-ONLY EXPORT, off the visual path entirely.
    //
    // It takes the OFFLINE renderer, not exportEngine.exportAudio. The latter
    // is async, needs the videoExporter's Web Audio path, hands back a Blob
    // that cannot cross page.evaluate, and downloads unless told not to.
    // renderSoundtrackWav is synchronous, returns bytes, and needs no audio
    // context — the engine commit that added it is titled "the soundtrack
    // without Web Audio", and this is the context it was written for.
    //
    // No platform preset resolves to wav, so reaching here means it was asked
    // for by name. Dimensions, framing, fps and bitrate are all absent rather
    // than passed and ignored.
    // @engine-methods renderSoundtrackWav exportEngine.sceneHasAudio ensureHeavyModules
    // CAPTIONS AS A FILE (round 8 EE, 8.19). format 'srt' was "Invalid input",
    // yet caption text staged with bornAt / ttl already carries frame-exact
    // times on item.data — the cues are in the scene. Every text item with a
    // lifetime becomes one cue, in start order; a text item without one is
    // on screen for the whole piece and is not a caption, so it is left out
    // and counted.
    // scc (CEA-608, 8.37) takes the same cues; the server encodes them
    // (src/utils/scc.ts), where the byte work is testable.
    if (exportFormat === 'srt' || exportFormat === 'vtt' || exportFormat === 'scc') {
      const fmt = exportFormat;
      return `
// Export: captions (${fmt}) from text items with a lifetime
(function() {
  if (!app.itemRegistry || typeof app.itemRegistry.getAll !== 'function') {
    return { success: false, format: '${fmt}', error: 'this studio cannot list items (app.itemRegistry.getAll) — update PinePaper Studio.' };
  }
  const texts = app.itemRegistry.getAll().filter(function(e) {
    const it = e && e.item;
    return it && it.className === 'PointText' && typeof it.content === 'string' && it.content.trim() !== '';
  });
  const timed = texts.filter(function(e) { return e.item.data && typeof e.item.data.bornAt === 'number'; });
  if (!timed.length) {
    return { success: false, format: '${fmt}', error: 'no captions to export: no text item has a lifetime. Stage each caption with properties.bornAt / ttl (seconds) on create_item or modify_item, then export ${fmt}.', untimedText: texts.length };
  }
  const end = ${videoDuration};
  const ts = function(t, sep) {
    const ms = Math.max(0, Math.round(t * 1000));
    const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
    const p = function(n, w) { return String(n).padStart(w, '0'); };
    return p(h, 2) + ':' + p(m, 2) + ':' + p(s, 2) + sep + p(r, 3);
  };
  const cues = timed.map(function(e) {
    const d = e.item.data;
    const start = d.bornAt;
    const stop = typeof d.ttl === 'number' ? start + d.ttl : end;
    return { start: start, stop: Math.max(start, stop), text: e.item.content.trim() };
  }).sort(function(a, b) { return a.start - b.start; });
${fmt === 'scc' ? `  return { success: true, format: 'scc', sccCues: cues, cues: cues.length, untimedText: texts.length - timed.length };
` : ''}  const body = cues.map(function(c, i) {
    return ${fmt === 'srt' ? `(i + 1) + '\\n' + ts(c.start, ',') + ' --> ' + ts(c.stop, ',')` : `ts(c.start, '.') + ' --> ' + ts(c.stop, '.')`} + '\\n' + c.text;
  }).join('\\n\\n') + '\\n';
  const text = ${fmt === 'vtt' ? `'WEBVTT\\n\\n' + body` : 'body'};
  return { success: true, format: '${fmt}', data: text, mimeType: '${fmt === 'srt' ? 'application/x-subrip' : 'text/vtt'}', size: text.length, cues: cues.length, untimedText: texts.length - timed.length };
})();`.trim();
    }

    if (exportFormat === 'wav') {
      const sr = (validated as { sampleRate?: number }).sampleRate ?? 48000;
      const bd = (validated as { bitDepth?: number }).bitDepth ?? 16;
      return `
// Export: the soundtrack on its own, rendered offline
(async function() {${ENSURE_EXPORT_ENGINE}
  if (typeof app.renderSoundtrackWav !== 'function') {
    return { success: false, format: 'wav', error: 'app.renderSoundtrackWav unavailable — update FxTool. This build cannot export audio on its own; mp4/webm still mux the soundtrack into the video.' };
  }
  // EXACT, not estimated. Uncompressed PCM is header + rate x bytes x channels
  // x seconds, so a model is not needed and would only be less true. The mix
  // is mono — the engine encodes a single channel.
  var exact = 44 + Math.round(${sr} * (${bd} / 8) * 1 * ${videoDuration});
  if (${estimateOnly ? 'true' : 'false'}) {
    return { success: true, estimateOnly: true, format: 'wav', bytes: exact,
      expected: exact, confidence: 'exact',
      note: 'uncompressed PCM: ' + ${videoDuration} + 's at ' + ${sr} + ' Hz, ' + ${bd} + '-bit mono' };
  }
  var r = app.renderSoundtrackWav({ duration: ${videoDuration}, sampleRate: ${sr}, bitDepth: ${bd} });
  if (!r || !r.wav) {
    // WHY IT IS EMPTY, NOT JUST THAT IT IS. The offline renderer bakes
    // SYNTHESIZED sounds only, while the engine's sceneHasAudio() counts
    // uploaded audio files too. A scene carrying an uploaded track would
    // otherwise be told it has no audio, which is false and sends the caller
    // to add a sound they already have.
    var anyAudio = null;
    try {
      if (app.exportEngine && typeof app.exportEngine.sceneHasAudio === 'function') {
        anyAudio = app.exportEngine.sceneHasAudio();
      }
    } catch (_) { /* predicate absent — fall back to the generic answer */ }
    return {
      success: false, format: 'wav',
      error: anyAudio === true
        ? 'this scene has audio, but it is uploaded file(s) rather than synthesized sounds, and the offline renderer bakes only what it can synthesize. Export mp4 or webm to get that audio muxed with the picture.'
        : 'no synthesized sounds are placed on this scene, so there is no soundtrack to render. Create one with pinepaper_sound action "create", or place an existing one with "set_placement".',
      sceneHasAudio: anyAudio,
    };
  }
  var bytes = r.wav;
  // Chunked: String.fromCharCode.apply over a multi-megabyte array blows the
  // stack, and a ten-minute soundtrack is tens of megabytes.
  var bin = '';
  for (var i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return {
    success: true, format: 'wav', platform: '${platform}',
    data: 'data:audio/wav;base64,' + btoa(bin),
    size: bytes.length,
    duration: r.duration, sampleRate: r.sampleRate, sounds: r.sounds, placed: r.placed,
    // A mix that dropped sounds is a valid file quietly missing tracks.
    ...(r.dropped > 0 ? { dropped: r.dropped, incomplete:
      'mixed ' + r.placed + ' sound(s); ' + r.dropped + ' could not be rendered and are absent from this file' } : {}),
  };
})();`.trim();
    }

    return `
// Smart export for ${platform}
(async function() {${ENSURE_EXPORT_ENGINE}
  const platform = '${platform}';
  const format = '${exportFormat}';
  const quality = '${qualityLevel}';
  const framing = '${framing}';
  // An explicit fps wins over the tier's. The tiers bundle frame rate with
  // compression (draft 15 / standard 30 / high 60), so "higher quality" also
  // doubled the frame count and the render time — a surprise the schema used
  // to hide because there was no way to ask for one without the other.
  const settings = ${JSON.stringify(fps !== undefined ? { ...qualitySettings, fps } : qualitySettings)};
${usesCanvasSize ? `  // 'auto': the canvas's own size, with the preset only as a fallback for a
  // studio too old to report one. Named platforms emit a plain object literal
  // just below, so what they render stays readable in the code itself.
  const __presetDims = ${JSON.stringify(scaled)};
  const __canvasDims = app.canvasSize || (app.view && app.view.viewSize) || null;
  const __even = (n) => Math.max(2, Math.round((n * ${scale !== undefined ? scale : 1}) / 2) * 2);
  const dimensions = (__canvasDims && __canvasDims.width && __canvasDims.height)
    ? { width: __even(__canvasDims.width), height: __even(__canvasDims.height) }
    : __presetDims;
  const __fit = null;` : `  // A PRESET IS A SIZE, NOT PERMISSION TO STRETCH.
  //
  // 'instagram' is 1080x1080, and a 4:5 (1080x1350) canvas exported under it
  // came out squashed to 0.8 vertically, text distorted, with nothing said —
  // 4:5 is itself a valid Instagram feed size. When the canvas aspect differs
  // from the preset's, the canvas aspect is kept and its SHORT edge takes the
  // preset's short edge: 4:5 on instagram is 1080x1350, a square canvas on
  // youtube is 1080x1080. The result says so in platformFit.
  const __presetBox = ${JSON.stringify(scaled)};
  const __cv = app.canvasSize || (app.view && app.view.viewSize) || null;
  let dimensions = __presetBox;
  let __fit = null;
  if (__cv && __cv.width > 0 && __cv.height > 0) {
    const ca = __cv.width / __cv.height, pa = __presetBox.width / __presetBox.height;
    if (Math.abs(ca / pa - 1) > 0.01) {
      const short = Math.min(__presetBox.width, __presetBox.height);
      const ev = (n) => Math.max(2, Math.round(n / 2) * 2);
      dimensions = ca >= 1 ? { width: ev(short * ca), height: ev(short) } : { width: ev(short), height: ev(short / ca) };
      __fit = { preset: __presetBox.width + 'x' + __presetBox.height, used: dimensions.width + 'x' + dimensions.height,
        canvas: __cv.width + 'x' + __cv.height,
        note: 'the canvas aspect differs from the ' + platform + ' preset, so the canvas aspect was kept rather than stretched. Resize the canvas to the preset to get exactly ' + __presetBox.width + 'x' + __presetBox.height + '.' };
    }
  }`}

  // WHAT THIS SCENE LOSES TO THIS FORMAT, asked at the moment you would care.
  //
  // exportFidelity walks the actual scene: a PNG of an animated scene is one
  // frame, a GIF with a soundtrack drops it, a wav of a silent scene is
  // silence. The engine derived it so that 117 tool descriptions would not
  // have to answer "does this survive export?" by hand and drift.
  //
  // THREE STATES, ALL DISTINGUISHABLE. This used to be reported only when
  // there was something to report, so that an empty list could not be misread
  // as "this format is lossless". That solved one misreading and created a
  // worse one: a caller could not tell "checked, nothing lost" from "never
  // checked", and a pilot reported fidelity as null in EVERY scene with no way
  // to know whether that was good news or a broken check.
  //
  // So it is always present: available:false when the studio cannot check,
  // warnings:[] plus a note when it checked and found nothing, and the
  // warnings themselves otherwise. The note carries the caveat that absence
  // was standing in for.
  //
  // STAND-INS ARE THIS TOOL'S OWN DOING, SO THIS TOOL REPORTS THEM. create_item
  // draws 'shader' and 'field' locally as a flat plate tagged data.renderAs; the
  // engine's check sees an ordinary rectangle and cannot know a surface was
  // meant. So a local export of a sea came out a flat blue slab with nothing
  // said. Reported whatever the engine check can or cannot do.
  function standIns() {
    try {
      // Probed with === : a studio without it degrades to "no stand-ins".
      const canList = app.itemRegistry && typeof app.itemRegistry.getAll === 'function';
      if (!canList) return [];
      const found = {};
      for (const entry of app.itemRegistry.getAll()) {
        const kind = entry && entry.item && entry.item.data && entry.item.data.renderAs;
        if (kind === 'shader' || kind === 'field') (found[kind] = found[kind] || []).push(entry.itemId);
      }
      return Object.keys(found).map(function(kind) {
        const ids = found[kind];
        return {
          code: 'render_time_surface_stand_in',
          message: ids.length + ' ' + kind + ' item' + (ids.length > 1 ? 's are' : ' is')
            + ' exported as the flat plate that stands in for ' + (ids.length > 1 ? 'them' : 'it')
            + ' on a local canvas. The surface itself is drawn only by a cloud render.',
          items: ids.slice(0, 6),
        };
      });
    } catch (e) { return []; }
  }
  // TRANSPARENCY THE FORMAT CANNOT CARRY. A scene with no background exported
  // to webm came out on BLACK while the engine's check said it lost nothing
  // (round 7, 8.12). Only said when the scene is evidently transparent — no
  // solid CSS background colour AND nothing in the background layer — so a
  // generator or pattern backdrop never trips it.
  function alphaLoss(fmt) {
    try {
      if (['mp4', 'jpg'${format === 'webm' && transparent === true ? '' : ", 'webm'"}${format === 'apng' && transparent === false ? ", 'apng'" : ''}].indexOf(fmt) === -1) return [];
      const bg = app.canvasEl && app.canvasEl.style && app.canvasEl.style.backgroundColor;
      const hasColor = !!bg && !/^(transparent|rgba\\([^)]*,\\s*0\\))$/i.test(bg);
      const hasBgItems = !!(app.patternGroup && app.patternGroup.children && app.patternGroup.children.length);
      if (hasColor || hasBgItems) return [];
      return [{ code: 'alpha_dropped', message: fmt === 'apng'
        ? 'apng with transparent: false and no background colour: the frames are filled BLACK. Set a background colour, or drop transparent: false to keep the alpha.'
        : fmt === 'jpg'
        ? 'jpg has no transparency and this scene has no background, so transparent areas are filled white. Use png or webp to keep them.'
        : fmt + ' is exported without transparency and this scene has no background, so transparent areas come out BLACK. Set a background colour, or export apng (animated, full alpha) or png to keep it.' }];
    } catch (e) { return []; }
  }
  // TEXT THAT DOES NOT FIT (FxTool 661224ef: textOverflowReport) — text past
  // its fit box at the minimum size, or off the frame. The pre-batch check for
  // certificates, speaker cards and localised variants, on every export.
  function textOverflow() {
    try {
      const rep = (typeof app.textOverflowReport === 'function' && app.textOverflowReport()) || [];
      return rep.slice(0, 10).map(function(o) {
        return { code: 'text_overflow', message: (o.id || 'a text item') + ' (' + JSON.stringify(String(o.content || '').slice(0, 40)) + '): ' + (o.reason || 'overflows'), items: [o.id] };
      });
    } catch (e) { return []; }
  }
  function fidelity(fmt) {
    const own = standIns().concat(alphaLoss(fmt), textOverflow());
    try {
      if (!app.exportEngine || typeof app.exportEngine.exportFidelity !== 'function') {
        return { fidelity: { available: false, reason: 'this studio cannot check export fidelity — update PinePaper Studio.', ...(own.length ? { warnings: own } : {}) } };
      }
      const r = app.exportEngine.exportFidelity(fmt);
      if (!r) { return { fidelity: { available: false, reason: 'the fidelity check returned nothing.', ...(own.length ? { warnings: own } : {}) } }; }
      const warnings = (r.warnings || []).concat(own);
      return {
        fidelity: {
          available: true,
          warnings: warnings,
          checked: r.checked,
          ...(warnings.length === 0
            ? { note: 'this scene loses nothing to ' + fmt + '. That is a statement about THIS SCENE, not a claim that the format is lossless.' }
            : {}),
        },
      };
    } catch (e) {
      return { fidelity: { available: false, reason: (e && e.message) || 'the fidelity check threw.', ...(own.length ? { warnings: own } : {}) } };
    }
  }

  // Preflight: same resolved settings as the real export, but render nothing.
  // Branching HERE rather than in a separate tool is deliberate — the estimate
  // has to see the same platform dimensions, fps and quality the export would
  // use, and a parallel tool would re-derive them and drift.
  if (${estimateOnly ? 'true' : 'false'}) {
    if (typeof app.estimateExportSize !== 'function') {
      return { success: false, estimateOnly: true, error: 'This PinePaper build has no estimateExportSize() — update the editor to preflight export size.' };
    }
    const est = await app.estimateExportSize({
      format,
      duration: ${videoDuration},
      fps: settings.fps,
      quality,
      width: dimensions.width,
      height: dimensions.height,
    });
    return {
      success: true,
      estimateOnly: true,
      platform, format, quality,
      duration: ${videoDuration},
      fps: settings.fps,
      dimensions: dimensions.width + 'x' + dimensions.height,
      estimate: est,
      ...fidelity(format),
    };
  }

  // Resolve camera-view framing dims when requested. Reads the first
  // camera_animates keyframe's zoom and divides the canvas dims by it
  // (mirrors the camera-view framing block in FxTool's
  // ExportEngine.showVideoExportOptions). Cited by METHOD, not by line: the
  // previous citation named a line range that had rotted to point at
  // DPI/canvas-size code in a file nobody here edits. A cross-file line range
  // cannot be kept accurate — it breaks on any edit above it — so this repo
  // does not use them. Camera animation still
  // drives motion during export — framing only fixes the output frame.
  let cameraDims = null;
  if (framing === 'camera') {
    if (!['gif', 'apng', 'mp4', 'webm'].includes(format)) {
      return { success: false, platform, format, framing, error: 'framing: "camera" is only supported for animated formats (gif, apng, mp4, webm). Use format: "mp4" / "gif" / "webm" or omit framing.' };
    }
    const rr = app.relationRegistry;
    const hasWalkthrough = rr && typeof rr.hasCameraAnimation === 'function' && rr.hasCameraAnimation();
    if (!hasWalkthrough) {
      return { success: false, platform, format, framing, error: 'framing: "camera" requires a camera_animates walkthrough on the canvas. Add one or omit framing.' };
    }
    const params = rr.getCameraAnimationParams ? rr.getCameraAnimationParams() : null;
    if (!params || (params.mode || 'keyframes') !== 'keyframes' || !params.keyframes || !params.keyframes.length) {
      return { success: false, platform, format, framing, error: 'framing: "camera" requires a keyframe-mode camera walkthrough with at least one keyframe.' };
    }
    // MATCH THE ENGINE'S FRAME EXACTLY, AND DO NOT SECOND-GUESS THE ZOOM.
    //
    // This divided canvasEl.width — device pixels — so a camera export came
    // out 2234x1472 whatever the board was. That is fixed by reading the
    // artboard, and the chain below is deliberately the same one the engine's
    // own _exportFrameSize() uses: getCanvasSize(), then app.canvasSize, then
    // a known frame. Two places computing one number is how they drift.
    //
    // The zoom divide is gone too, and that is the part worth explaining.
    // VideoExporter._frameCropRect returns the WHOLE canvas element whenever a
    // camera animation exists — the camera owns the view, so it captures
    // everything the camera frames. Dividing by the first keyframe's zoom
    // therefore never reframed anything; it only shrank the output, so a
    // zoom-2 export produced a half-size video of the same content. Asking for
    // the artboard's own size is both simpler and right.
    //
    // NOTE: the engine currently scales that whole-canvas crop into the output
    // frame without preserving aspect, so the picture is squashed by the ratio
    // between the workspace canvas and the board (measured: 1.17 landscape,
    // 0.37 portrait). That is VideoExporter._frameCropRect, not this — raised
    // with fxtool-f2. Matching frames here means that when it is fixed, these
    // two cannot disagree about the aspect on top of it.
    let camBase = null;
    if (typeof app.getCanvasSize === 'function') {
      const cs = app.getCanvasSize();
      if (cs && cs.width > 0) camBase = { width: cs.width, height: cs.height };
    }
    if (!camBase && app.canvasSize && app.canvasSize.width > 0) {
      camBase = { width: app.canvasSize.width, height: app.canvasSize.height };
    }
    if (!camBase) camBase = { width: dimensions.width, height: dimensions.height };
    cameraDims = { width: camBase.width, height: camBase.height };
  }

  // AN EXPORTER ANSWERS A BLOB OR A RECORD AROUND ONE.
  //
  // Declared ABOVE the switch. They used to be consts inside the video case's
  // block, so the pdf case — which 04ea8d2 pointed at asBlob — threw
  // "asBlob is not defined" on every PDF export.
  //
  // exportPDF resolves to {blob, width, height, format}, and this passed
  // the whole record to FileReader.readAsDataURL — "parameter 1 is not of
  // type 'Blob'", every PDF export, with an error naming FileReader and
  // nothing about PDFs. The engine has the same normaliser for the same
  // reason (AgentMode._asBlob), so this matches its behaviour rather than
  // inventing a second convention.
  const asBlob = (r) => {
    if (typeof Blob !== 'undefined' && r instanceof Blob) return r;
    if (r && typeof Blob !== 'undefined' && r.blob instanceof Blob) return r.blob;
    // Duck-typed last resort: a studio may hand back something Blob-like
    // that fails instanceof across a realm boundary.
    if (r && typeof r.size === 'number' && typeof r.slice === 'function') return r;
    if (r && r.blob && typeof r.blob.size === 'number') return r.blob;
    return null;
  };
  const blobToDataUrl = (b) => new Promise(resolve => {
    const r = new FileReader();
    r.onloadend = () => resolve(r.result);
    r.readAsDataURL(b);
  });

  let result = { success: false, platform, format, quality, framing };
  // A STILL SHOWS WHAT IS ALIVE AT ITS MOMENT. Lifetimes that fall back to the
  // MCP's frame callback are applied by the frame loop, and a seek does not run
  // it — so a png at time 0.8 s drew nothing staged at 0.8 s, and an item past
  // its ttl still showed (retest). The visibility pass runs here for stills.
  if (['png', 'jpg', 'webp', 'svg', 'pdf'].indexOf(format) !== -1) {
    const __L = globalThis.__ppMcp;
    if (__L && __L.lifetimeApp === app && typeof __L.applyLifetimes === 'function') {
      try { __L.applyLifetimes(${stillTime !== undefined ? stillTime : "typeof app.playbackTime === 'number' ? app.playbackTime : 0"}); } catch (_) { /* the still renders either way */ }
    }
  }
  // The engine's report on the audio track of THIS export (FxTool b41860aa:
  // encoder delay compensated, padding past the picture dropped). Cleared
  // first so a report left by an earlier export is never read as this one's.
  const __vx = app.exportEngine && app.exportEngine.videoExporter;
  if (__vx && 'lastAudioReport' in __vx) __vx.lastAudioReport = null;
  if (__vx && 'lastVideoReport' in __vx) __vx.lastVideoReport = null;
${stillTime !== undefined ? `
  // A STILL AT A CHOSEN MOMENT (round 7 X, 1.57). Without this a png is
  // whatever frame the playhead is on — two identical builds gave PNGs that
  // differed in the animated streak while their MP4s were byte-identical.
  // Seek, render, and put the playhead back afterwards.
  const __prevT = typeof app.playbackTime === 'number' ? app.playbackTime : 0;
  if (typeof app.setPlaybackTime !== 'function') {
    return { success: false, platform, format, error: 'app.setPlaybackTime unavailable — this studio cannot render a still at a chosen time.' };
  }
  app.setPlaybackTime(${stillTime});
  if (typeof paper !== 'undefined' && paper.view && typeof paper.view.update === 'function') paper.view.update();
` : ''}
  try {
    // jpg / webp render as png, then re-encode below.
    switch ((format === 'jpg' || format === 'webp') ? 'png' : format) {
      case 'svg':
        const svgString = app.exportAnimatedSVG ? app.exportAnimatedSVG() : app.exportSVGWithCSS();
        result = {
          success: true,
          platform,
          format: 'svg',
          data: svgString,
          mimeType: 'image/svg+xml',
          size: new Blob([svgString]).size,
          hasAnimations: svgString.includes('<animate') || svgString.includes('@keyframes')
        };
        break;

      case 'png':
        ${region ? `// A REGION, not the whole board — carousel slices, crops. renderRegionToDataURL
        // re-renders that world rect offscreen without touching the live view;
        // it was reachable only from custom code. A differing output aspect is
        // covered by the engine, not stretched.
        if (typeof app.renderRegionToDataURL !== 'function') {
          result = { success: false, platform, format: 'png', error: 'app.renderRegionToDataURL unavailable — update PinePaper Studio to export a region.' };
          break;
        }
        {
          const rw = ${region.outputWidth ?? Math.round(region.width)}, rh = ${region.outputHeight ?? Math.round(region.height)};
          // OWNERSHIP BY CENTRE (1.78, FxTool 78ec5916): excludeForeign hides, for
          // this render, a top-level item that reaches in but is centred outside —
          // a neighbouring card's overflowing headline. Older studios ignore the
          // fourth argument, and leave lastRegionExcluded unset.
          if ('lastRegionExcluded' in app) app.lastRegionExcluded = null;
          const regionUrl = app.renderRegionToDataURL(new paper.Rectangle(${region.x}, ${region.y}, ${region.width}, ${region.height}), rw, rh${region.excludeForeign === false ? '' : ', { excludeForeign: true }'});
          const __excluded = Array.isArray(app.lastRegionExcluded) ? app.lastRegionExcluded.filter(function(id) { return id; }) : null;
          // ITEMS THAT CROSS THE REGION'S EDGE (round 9 II, 1.78). In the sheet
          // recipe — one big canvas, one region per card — text that overflows
          // its cell spills into the next card's export (up to 5,826 foreign px),
          // silently. A region cannot know which card an item belongs to, so it
          // cannot clip per card; it can name every item that is only partly
          // inside it, which is exactly the overflow in either direction.
          const __rx = ${region.x}, __ry = ${region.y}, __rr = ${region.x + region.width}, __rb = ${region.y + region.height};
          const crossing = [], coveringExcluded = [];
          if (app.itemRegistry && typeof app.itemRegistry.getAll === 'function') {
            app.itemRegistry.getAll().forEach(function(e) {
              const b = e && e.item && e.item.visible !== false && e.item.bounds;
              if (!b || !(b.width > 0)) return;
              const r = b.x + b.width, bt = b.y + b.height;
              const intersects = b.x < __rr && r > __rx && b.y < __rb && bt > __ry;
              const inside = b.x >= __rx - 0.5 && r <= __rr + 0.5 && b.y >= __ry - 0.5 && bt <= __rb + 0.5;
              const covers = b.x <= __rx && r >= __rr && b.y <= __ry && bt >= __rb; // a full-bleed backdrop is not overflow
              if (intersects && !inside && !covers && crossing.length < 20) crossing.push(e.itemId);
              if (covers && __excluded && (__excluded.indexOf(e.itemId) >= 0 || (e.item.data && __excluded.indexOf(e.item.data.id) >= 0))) coveringExcluded.push(e.itemId);
            });
          }
          result = { success: true, platform, format: 'png', data: regionUrl, mimeType: 'image/png',
            size: Math.round(String(regionUrl).length * 0.75), dimensions: { width: rw, height: rh },
            region: ${JSON.stringify({ x: region.x, y: region.y, width: region.width, height: region.height })} };
          if (__excluded && __excluded.length) {
            result.excludedItems = __excluded;
            result.excludedNote = 'centred outside this region, so treated as belonging to a neighbouring region and left out of this image.';
          }
          if (coveringExcluded.length) {
            result.warning = 'backdrop item(s) ' + coveringExcluded.join(', ') + ' cover this whole region but are centred outside it, so they were left out as foreign — this image has no background from them. Re-export with region.excludeForeign: false, or give each card its own backdrop.';
          }
          if (crossing.length) {
            result.crossingItems = crossing;
            result.warning = (result.warning ? result.warning + ' ' : '') + crossing.length + ' item(s) are only partly inside this region, so part of them is cut off here or spills into a neighbouring region: ' + crossing.join(', ') + '. In a sheet of cards this is text overflowing its card — shorten it, shrink it, or wrap it.';
          }
        }
        break;` : ''}
        if (app.exportEngine && app.exportEngine.exportPNG) {
          // PNG IGNORED THE PLATFORM ENTIRELY.
          //
          // exportPNG takes dpi or scale and no dimensions, so passing only
          // dpi scaled the CANVAS by dpi/96 and the preset was never applied:
          // platform 'youtube-thumbnail' (1280x720) and platform 'auto' on a
          // 1920x1080 board both returned 3000x1688, which is 1920 x 150/96.
          // Third member of the same family as the camera dims and analyze —
          // a pixel count that came from the rendering scale rather than from
          // what the caller asked for.
          //
          // dimensions is already resolved: the preset for a named platform,
          // the board itself for auto. Turning it into a scale is the only
          // lever exportPNG offers, so that is what it gets.
          const pngBoard = (typeof app.getCanvasSize === 'function' && app.getCanvasSize())
            || app.canvasSize
            || { width: dimensions.width, height: dimensions.height };
          const pngScale = pngBoard.width > 0 ? dimensions.width / pngBoard.width : 1;
          const png = await app.exportEngine.exportPNG({ scale: pngScale });
          const dataUrl = (png && png.dataUrl) ? png.dataUrl : png;
          result = {
            success: true,
            platform,
            format: 'png',
            data: dataUrl,
            mimeType: 'image/png',
            size: Math.round(String(dataUrl).length * 0.75),
            dimensions: (png && png.width)
              ? { width: png.width, height: png.height }
              : { width: dimensions.width, height: dimensions.height },
          };
        } else {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            result = {
              success: true,
              platform,
              format: 'png',
              data: dataUrl,
              mimeType: 'image/png',
              size: Math.round(dataUrl.length * 0.75)
            };
          }
        }
        break;

      case 'html5-ad':
      case 'playable': {
        // AN AD FROM THE WIDGET PAGE (8.21 / 8.24). The page is the studio's
        // standalone widget; the server adds the network's wrapper and builds
        // the zip (src/utils/ad-package.ts). Here: the page, its size, the CTA
        // box in percent of the canvas, and a backup image for html5-ad.
        if (!app.exportEngine || typeof app.exportEngine.exportWidgetHTML !== 'function') {
          result = { success: false, platform, format, error: 'this studio cannot export its standalone widget page (no exportWidgetHTML), which an ad is built from.' };
          break;
        }
        // The artboard, never the canvas element: its backing store is scaled
        // by the renderer, and an ad's size is what was asked for.
        const __as = (typeof app.getCanvasSize === 'function' && app.getCanvasSize()) || app.canvasSize || { width: 0, height: 0 };
        const __cw = __as.width, __ch = __as.height;
        let __cta = null;
        ${adOpts?.ctaItemId ? `{
          const __ce = app.itemRegistry && app.itemRegistry.get(${JSON.stringify(adOpts.ctaItemId)});
          const __cb = __ce && __ce.item && __ce.item.bounds;
          if (!__cb || !(__cb.width > 0) || !(__cw > 0)) {
            result = { success: false, platform, format, error: ${JSON.stringify(`ad.ctaItemId "${adOpts.ctaItemId}" is not an item on the canvas with a size — nothing was exported. List items with pinepaper_get_items.`)} };
            break;
          }
          __cta = { left: __cb.x / __cw * 100, top: __cb.y / __ch * 100, width: __cb.width / __cw * 100, height: __cb.height / __ch * 100 };
        }` : ''}
        const __w = await app.exportEngine.exportWidgetHTML({ download: false });
        if (!__w || typeof __w.html !== 'string' || !__w.html) {
          result = { success: false, platform, format, error: 'the studio returned no widget page to build the ad from.' };
          break;
        }
        let __backup = null;
        if (format === 'html5-ad' && typeof app.captureFrameDataURL === 'function') {
          try { __backup = app.captureFrameDataURL(1); } catch (_) { __backup = null; }
        }
        // The background the PNG export uses (the canvas element's). The widget
        // page prefers another record that can be stale, which served a white
        // page under white text (8.9 again); the server pins this one.
        const __bgc = (app.canvasEl && app.canvasEl.style && app.canvasEl.style.backgroundColor) || null;
        result = { success: true, platform, format, adPage: __w.html, adSize: { width: __cw, height: __ch }, cta: __cta, backupImage: __backup, background: __bgc };
        break;
      }

      case 'gif':
      case 'apng':
      case 'mp4':
      case 'webm': {
        const videoMimeType = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif', apng: 'image/apng' }[format];
        // FxTool VideoExporter._calculateBitrate multiplies a per-resolution
        // base by settings.quality (0.5-1.0). Our existing per-tier compression
        // values (0.6 / 0.85 / 0.95) map directly to that scale. Without this,
        // ExportEngine._quickExportVideo overrides quality with undefined for
        // mp4/webm, _calculateBitrate yields NaN, and VideoEncoder.configure
        // rejects with 'malformed bitrate value'.
        // width/height ride along ONLY when a scale was asked for. The buffered
        // fallback paths otherwise export at canvas size, and quietly changing
        // that for every existing caller is not what a new optional knob does.
        // loop rides in the BASE settings for a gif, so every route carries it:
        // the direct one below, and also camera framing and a studio without
        // _quickExportVideo, which build from these and used to drop it.
        const baseVideoSettings = { format, fps: settings.fps, quality: settings.compression, duration: ${videoDuration}${scale !== undefined && scale !== 1 ? ', width: dimensions.width, height: dimensions.height' : ''}${gifLoop !== undefined ? `, ...(format === 'gif' || format === 'apng' ? { loop: ${JSON.stringify(gifLoop)} } : {})` : ''}${encodeOptsJs}${transparent !== undefined ? `, transparent: ${transparent}` : ''} };

        // THE EXPORT STORE. A long export cannot come back as one base64
        // string: base64 of a gigabyte is larger than the gigabyte, and it
        // crosses the browser→server bridge as a single page.evaluate return
        // value. exportToStore() streams the encode straight to the studio's
        // origin-private store and hands back an id, so the bytes stay on disk
        // and the handler pages them into the file it was going to write
        // anyway. mp4/webm ALWAYS land in a file on the server side, so there
        // is no size at which building a data URL for them is worth doing —
        // the id goes back at every size and nothing is base64'd in the page.
        // gif is refused by name by the store (it has its own encoder and
        // never streams), so gif keeps the buffered path below.
        const store = (app.exportEngine
          && typeof app.exportEngine.exportToStore === 'function'
          && typeof app.exportEngine.readExport === 'function')
          ? app.exportEngine : null;

        if (store && format !== 'gif' && format !== 'apng') {
          const stored = await store.exportToStore({
            format,
            duration: baseVideoSettings.duration,
            fps: settings.fps,
            // A NUMBER, not the quality tier's name. _calculateBitrate
            // multiplies by it, and a non-finite value used to survive its
            // Math.max(100000, NaN) "floor" all the way to
            // VideoEncoder.configure.
            quality: settings.compression,
            width: cameraDims ? cameraDims.width : dimensions.width,
            height: cameraDims ? cameraDims.height : dimensions.height,${encodeOptsJs ? `
            // Broadcast / bitrate. A store that rebuilds its options without
            // them is caught by the video report below, not assumed.
            ${encodeOptsJs.slice(2)},` : ''}
          });
          if (!stored || stored.ok === false) {
            result = { success: false, platform, format, error: (stored && stored.reason) || 'the export store refused the export without saying why' };
          } else {
            let chunkBytes = 4 * 1024 * 1024;
            try {
              const declared = app.exportEngine.constructor && app.exportEngine.constructor.EXPORT_CHUNK_BYTES;
              if (typeof declared === 'number' && declared > 0) chunkBytes = declared;
            } catch (_) { /* keep the default */ }
            result = {
              success: true, platform, framing,
              // Trust the container the store reports over the one asked for:
              // mp4 falls back to WebM without WebCodecs, and WebM bytes named
              // .mp4 fail in container-validating players.
              format: stored.format || format,
              retained: true,
              exportId: stored.exportId,
              mimeType: stored.mimeType || videoMimeType,
              size: stored.size,
              chunkBytes: chunkBytes,
              dimensions: cameraDims || dimensions,
            };
          }
          break;
        }

        // NO EXPORT STORE ON THIS STUDIO, or gif. Both remaining failures are
        // named rather than left to blow up: a streamed export hands back a
        // marker instead of a Blob and FileReader throws on it, and an export
        // past the inline ceiling used to die somewhere in the base64 rather
        // than say so. The ceiling sits above what this path could already do
        // (60 s at 8 Mbps is roughly 60 MB) so nothing that works today starts
        // refusing.
        const INLINE_MAX_BYTES = ${INLINE_MAX_BYTES};
        const mb = (n) => (n / (1024 * 1024)).toFixed(1);
        const deliver = async (raw) => {
          // Normalise first: a {blob, …} record would otherwise be reported as
          // "streamed to a file instead of returning bytes", which is a true
          // sentence about the wrong problem.
          const blob = asBlob(raw) || raw;
          if (!blob || typeof blob.size !== 'number' || typeof blob.slice !== 'function') {
            return {
              success: false, platform, format,
              error: 'this export streamed to a file instead of returning bytes, and this studio has no app.exportEngine.exportToStore to page it back from — update FxTool for long-form export',
            };
          }
          if (blob.size > INLINE_MAX_BYTES) {
            return {
              success: false, platform, format, size: blob.size,
              error: 'export is ' + mb(blob.size) + ' MB, over the ' + mb(INLINE_MAX_BYTES)
                + ' MB inline ceiling, and this studio has no app.exportEngine.exportToStore to page it out of — update FxTool, or lower duration/quality',
            };
          }
          return { success: true, platform, format, framing, data: await blobToDataUrl(blob), mimeType: videoMimeType, size: blob.size };
        };

        // Camera framing requires going direct to videoExporter so width/height
        // pass through — _quickExportVideo strips dim fields.
        // ANIMATED PNG (8.12, FxTool 76312a55): stepped PNG frames with full
        // alpha, transparent unless transparent: false. Asked of the exporter
        // directly; a studio that lacks it says so in its capability table, and
        // is refused by name rather than handed a format it would reject.
        const __apngVx = format === 'apng' ? (app.exportEngine && app.exportEngine.videoExporter) : null;
        if (format === 'apng' && !(__apngVx && typeof __apngVx.export === 'function' && __apngVx.constructor
            && typeof __apngVx.constructor.getCapabilities === 'function' && __apngVx.constructor.getCapabilities().apng)) {
          result = { success: false, platform, format, error: 'this studio cannot export APNG (it needs an engine with animated PNG). For animation with alpha, export a png sequence (pinepaper_interchange export_png_sequence with options.transparent: true); gif keeps only 1-bit transparency.' };
        } else if (format === 'apng') {
          const blob = await __apngVx.export(cameraDims ? { ...baseVideoSettings, width: cameraDims.width, height: cameraDims.height } : baseVideoSettings);
          result = await deliver(blob);
          if (result.success) result.transparent = ${transparent !== false};
          if (result.success && cameraDims) result.dimensions = cameraDims;
        } else if (cameraDims && app.exportEngine && app.exportEngine.videoExporter) {
          const blob = await app.exportEngine.videoExporter.export({ ...baseVideoSettings, width: cameraDims.width, height: cameraDims.height });
          result = await deliver(blob);
          if (result.success) result.dimensions = cameraDims;
        } else if ((format === 'mp4' || format === 'webm') && app.exportEngine && app.exportEngine.videoExporter) {
          // Bypass _quickExportVideo for mp4/webm — it hardcodes
          // quality:undefined for these formats and produces a NaN bitrate.
          const blob = await app.exportEngine.videoExporter.export(baseVideoSettings);
          result = await deliver(blob);
        } else if (app.exportEngine && app.exportEngine._quickExportVideo) {
          // GIF path (working): _quickExportVideo forwards gifQuality to
          // gif.js. Also serves as the fallback if videoExporter is absent.
          ${gifLoop !== undefined ? `// A LOOP COUNT (8.30): _quickExportVideo rebuilds its settings without
          // it, so a GIF with loop set goes straight to videoExporter.export.
          // true = forever, false / 0 / 1 = once, n = n plays (engine 952d6d35).
          const videoResult = (format === 'gif' && app.exportEngine.videoExporter && typeof app.exportEngine.videoExporter.export === 'function')
            ? { blob: await app.exportEngine.videoExporter.export(Object.assign({}, baseVideoSettings, { format: 'gif', loop: ${JSON.stringify(gifLoop)} })) }
            : await app.exportEngine._quickExportVideo(format, baseVideoSettings, false);` : `const videoResult = await app.exportEngine._quickExportVideo(format, baseVideoSettings, false);`}
          if (videoResult && videoResult.blob) {
            result = await deliver(videoResult.blob);
          } else {
            result = { success: false, error: format.toUpperCase() + ' export returned no data' };
          }
          ${maxBytes !== undefined ? `// A BYTE BUDGET (round 9 GG, 8.31 — email wants <= 1 MB). gif.js has no
          // colour-count knob, so size is the lever: GIF bytes scale roughly with
          // pixel count, so the frame is shrunk by sqrt(budget / size) with a
          // margin and re-encoded, at most twice. Every attempt is reported.
          if (format === 'gif' && result && result.success && result.size > ${maxBytes}) {
            const attempts = [{ width: dimensions.width, height: dimensions.height, bytes: result.size }];
            let w = dimensions.width, h = dimensions.height;
            for (let k = 0; k < 2 && result.success && result.size > ${maxBytes}; k++) {
              const f = Math.sqrt(${maxBytes} / result.size) * 0.9;
              w = Math.max(16, Math.round(w * f / 2) * 2); h = Math.max(16, Math.round(h * f / 2) * 2);
              // videoExporter.export, not _quickExportVideo: the latter rebuilds
              // its settings without width / height, so a "smaller" retry
              // through it came out the same size.
              if (!app.exportEngine.videoExporter || typeof app.exportEngine.videoExporter.export !== 'function') break;
              const again = await app.exportEngine.videoExporter.export(Object.assign({}, baseVideoSettings, { format: 'gif', width: w, height: h }${gifLoop !== undefined ? `, { loop: ${JSON.stringify(gifLoop)} }` : ''}));
              if (!again) break;
              result = await deliver(again);
              attempts.push({ width: w, height: h, bytes: result.size });
            }
            result.budget = { maxBytes: ${maxBytes}, met: !!(result.success && result.size <= ${maxBytes}), attempts: attempts };
            if (result.success && result.size > ${maxBytes}) {
              result.warning = 'still ' + result.size + ' bytes after shrinking to ' + w + 'x' + h + ' — over the ' + ${maxBytes} + '-byte budget. Lower fps, shorten duration, or use quality "draft".';
            } else if (result.success) {
              result.dimensions = { width: w, height: h };
            }
          }` : ''}
        } else if (app.exportEngine && app.exportEngine.videoExporter) {
          const blob = await app.exportEngine.videoExporter.export(baseVideoSettings);
          result = await deliver(blob);
        } else {
          result = { success: false, error: format.toUpperCase() + ' export not available' };
        }
        break;
      }

      case 'pdf':
        ${pdfOpts?.pages ? `// ONE PAGE PER SCENE (round 7 Z, 8.16). exportPDF renders the current
        // canvas only, so a deck of 8 saved scenes exported 1 page. Built here
        // the way exportPDF builds its one page — the engine's jsPDF, a frame
        // from captureFrameDataURL, the scene's own size at the canvas DPI —
        // one scene at a time, and the scene the user was on is put back.
        {
          const SM = app.sceneManager;
          if (!SM || typeof SM.listScenes !== 'function' || typeof SM.loadScene !== 'function') {
            result = { success: false, platform, format: 'pdf', error: 'scenes are unavailable on this studio (app.sceneManager) — a multi-page PDF needs saved scenes.' }; break;
          }
          if (!app.exportEngine || typeof app.exportEngine._loadPDFLibraries !== 'function' || typeof app.captureFrameDataURL !== 'function') {
            result = { success: false, platform, format: 'pdf', error: 'this studio cannot build a multi-page PDF (no PDF library loader or frame capture) — update PinePaper Studio.' }; break;
          }
          const all = SM.listScenes();
          const wanted = ${JSON.stringify(pdfOpts.pages)};
          // A page is { id, size? }. Scenes do not record their canvas size —
          // their "dimensions" is the browser viewport and loadScene does not
          // resize the canvas — so without a size every page is the current
          // canvas (the retest: three pages, all square).
          const pageSpecs = wanted === 'scenes'
            ? all.map(function(sc) { return { id: sc.id }; })
            : wanted.map(function(w) { return typeof w === 'string' ? { id: w } : { id: w.sceneId, size: { width: w.width, height: w.height } }; });
          const ids = pageSpecs.map(function(p) { return p.id; });
          const sized = pageSpecs.some(function(p) { return p.size; });
          const missing = ids.filter(function(id) { return !all.some(function(sc) { return sc.id === id; }); });
          if (!ids.length || missing.length) {
            result = { success: false, platform, format: 'pdf', error: ids.length ? 'no saved scene ' + missing.join(', ') + '. Saved: ' + all.map(function(sc) { return sc.id; }).join(', ') : 'there are no saved scenes — save each page with pinepaper_manage_scenes first.' }; break;
          }
          const back = SM.currentSceneId;
          const backSize = app.canvasSize ? { width: app.canvasSize.width, height: app.canvasSize.height } : null;
          const lib = await app.exportEngine._loadPDFLibraries();
          const targetDpi = ${pdfOpts.dpi ?? 'settings.dpi'};
          // JPEG pages: a PNG per page made a 3-slide deck 34 MB.
          const toJpeg = function(url) {
            return new Promise(function(resolve) {
              const img = new Image();
              img.onload = function() {
                const c = document.createElement('canvas');
                c.width = img.naturalWidth; c.height = img.naturalHeight;
                const x = c.getContext('2d');
                x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
                x.drawImage(img, 0, 0);
                resolve(c.toDataURL('image/jpeg', settings.compression));
              };
              img.onerror = function() { resolve(null); };
              img.src = url;
            });
          };
          let doc = null;
          const pagesOut = [];
          // A SEARCHABLE TEXT LAYER PER PAGE (8.10, FxTool 3e22c0df): the
          // engine lays the loaded scene's text invisibly over the page box;
          // the per-page reports are summed into result.pdf.
          const __wantLayer = ${pdfOpts.searchableText !== false};
          const __layer = __wantLayer && typeof app.exportEngine.addTextLayer === 'function';
          const __tl = { written: 0, skipped: 0, reasons: [] };
          try {
            for (const spec of pageSpecs) {
              const id = spec.id;
              await SM.loadScene(id);
              if (spec.size && typeof app.setCanvasSize === 'function') app.setCanvasSize({ width: spec.size.width, height: spec.size.height });
              const cs = app.canvasSize || { width: app.canvasEl.width, height: app.canvasEl.height };
              const dpi = (typeof app.getDPI === 'function' && app.getDPI()) || 96;
              const wMM = cs.width / dpi * 25.4, hMM = cs.height / dpi * 25.4;
              const orient = wMM > hMM ? 'landscape' : 'portrait';
              const png = app.captureFrameDataURL(Math.max(1, targetDpi / dpi));
              const jpg = await toJpeg(png);
              if (!doc) doc = new lib.jsPDF({ orientation: orient, unit: 'mm', format: [wMM, hMM] });
              else doc.addPage([wMM, hMM], orient);
              if (jpg) doc.addImage(jpg, 'JPEG', 0, 0, wMM, hMM); else doc.addImage(png, 'PNG', 0, 0, wMM, hMM);
              if (__layer) {
                try {
                  const tr = await app.exportEngine.addTextLayer(doc, { x: 0, y: 0, width: wMM, height: hMM });
                  if (tr && tr.ok !== false) { __tl.written += tr.linesWritten || 0; __tl.skipped += tr.linesSkipped || 0; }
                  else __tl.reasons.push(id + ': ' + ((tr && tr.reason) || 'refused'));
                } catch (e) { __tl.reasons.push(id + ': ' + e.message); }
              }
              pagesOut.push({ sceneId: id, widthMM: Math.round(wMM * 10) / 10, heightMM: Math.round(hMM * 10) / 10 });
            }
          } finally {
            if (sized && backSize && typeof app.setCanvasSize === 'function') { try { app.setCanvasSize(backSize); } catch (_) { /* best effort */ } }
            if (back && typeof SM.loadScene === 'function') { try { await SM.loadScene(back); } catch (_) { /* reported by the page count */ } }
          }
          const blob = doc.output('blob');
          const dataUrl = await blobToDataUrl(blob);
          result = { success: true, platform, format: 'pdf', data: dataUrl, mimeType: 'application/pdf', size: blob.size, pages: pagesOut.length, pageList: pagesOut,
            pdf: !__wantLayer ? { searchableText: false, reason: 'off' }
              : !__layer ? { searchableText: false, reason: 'this studio adds no text layer to multi-page PDFs' }
              : Object.assign({ searchableText: __tl.written > 0 || __tl.reasons.length < pagesOut.length, linesWritten: __tl.written, linesSkipped: __tl.skipped },
                  __tl.reasons.length ? { pagesWithoutLayer: __tl.reasons } : {},
                  __tl.written === 0 && __tl.reasons.length === pagesOut.length ? { reason: __tl.reasons.join('; ') } : {}) };
          if (!sized) result.warning = 'every page used the current canvas size: saved scenes do not record theirs. To give a page its own size, pass pages as [{sceneId, width, height}, …].';
        }
        break;` : ''}
        if (app.exportEngine && app.exportEngine.exportPDF) {
          // Print options reach the engine (they were engine-only before), and
          // download:false, because the tool delivers the bytes itself.
          // lastPdfReport is a report PROPERTY (9917cfa5), read through the
          // engine object like the exporter's audio / video reports, and only
          // when present.
          const __pee = app.exportEngine;
          if ('lastPdfReport' in __pee) __pee.lastPdfReport = null;
          const pdfOut = await app.exportEngine.exportPDF({
            dpi: ${pdfOpts?.dpi ?? 'settings.dpi'},
            download: false,${pdfOpts?.searchableText === false ? '\n            searchableText: false,' : ''}${pdfOpts?.paperFormat ? `\n            format: ${JSON.stringify(pdfOpts.paperFormat)},` : ''}${pdfOpts?.orientation ? `\n            orientation: ${JSON.stringify(pdfOpts.orientation)},` : ''}${pdfOpts?.bleed !== undefined ? `\n            includeBleed: ${pdfOpts.bleed > 0}, bleed: ${pdfOpts.bleed},` : ''}${pdfOpts?.trimMarks !== undefined ? `\n            trimMarks: ${pdfOpts.trimMarks},` : ''}
          });
          const blob = asBlob(pdfOut);
          if (!blob) {
            const got = pdfOut === null ? 'null'
              : typeof pdfOut === 'object' ? 'an object with keys [' + Object.keys(pdfOut).join(', ') + ']'
                : typeof pdfOut;
            result = { success: false, platform, format: 'pdf',
              error: 'the PDF export did not produce a file: expected a Blob, got ' + got + '.' };
            break;
          }
          const dataUrl = await blobToDataUrl(blob);
          result = {
            success: true, platform, format: 'pdf', data: dataUrl,
            mimeType: 'application/pdf', size: blob.size, dpi: settings.dpi,
            // The record carries the page geometry the engine chose; it is the
            // only place a caller can learn it.
            ...(pdfOut && pdfOut.width ? { dimensions: { width: pdfOut.width, height: pdfOut.height } } : {}),
            ...(pdfOut && pdfOut.format ? { paperFormat: pdfOut.format } : {}),${pdfOpts?.paperFormat && pdfOpts.paperFormat !== 'custom' && ((pdfOpts.bleed ?? 0) > 0 || pdfOpts.trimMarks) ? `
            // Bleed and trim marks on a NAMED paper size: the studio keeps the
            // page at that size and centres the art, so neither appears (prod
            // retest: MediaBox = TrimBox = A4, no marks). Said, not silent.
            warnings: [${JSON.stringify(`bleed / trimMarks were passed with paperFormat '${pdfOpts.paperFormat}', and this studio applies them only to paperFormat 'custom' (page = canvas + bleed): the page stayed ${pdfOpts.paperFormat} with no bleed and no marks. For print with bleed, size the canvas with a PRINT preset (agent_start_job canvasPreset 'print-a4' / 'print-letter' / 'print-a4-landscape' / 'print-letter-landscape', which carry 300 dpi — a plain 2480x3508 canvas is read at 96 dpi and comes out ~656 mm wide) and pass paperFormat 'custom'.`)}],` : ''}
          };
        } else {
          result = { success: false, error: 'PDF export failed' };
        }
        break;

      default:
        result = { success: false, error: 'Unknown format: ' + format };
    }
  } catch (e) {
    result = { success: false, error: e.message, platform, format };
  }

  // One site, after every branch has set its result: a successful export says
  // what this scene lost to this format, rather than the caller finding out by
  // opening the file. Only when there is something to say — see fidelity().
  // RE-ENCODE A STILL FOR A BYTE BUDGET. The png path rendered it (whole board
  // or region); the browser's own encoder makes jpg / webp at the tier's
  // compression. jpg has no alpha, so it is flattened onto the scene background
  // (white when there is none) rather than left to the encoder's black.
  if (result && result.success && (format === 'jpg' || format === 'webp') && typeof result.data === 'string') {
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/webp';
    try {
      const encoded = await new Promise(function(resolve, reject) {
        const img = new Image();
        img.onload = function() {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth; c.height = img.naturalHeight;
          const x = c.getContext('2d');
          // The scene's own background when one is set — white text on a
          // transparent board vanished into a white flatten. White otherwise.
          if (mime === 'image/jpeg') {
            const bg = app.canvasEl && app.canvasEl.style && app.canvasEl.style.backgroundColor;
            x.fillStyle = (bg && !/^(transparent|rgba\\([^)]*,\\s*0\\))$/i.test(bg)) ? bg : '#ffffff';
            x.fillRect(0, 0, c.width, c.height);
          }
          x.drawImage(img, 0, 0);
          resolve(c.toDataURL(mime, settings.compression));
        };
        img.onerror = function() { reject(new Error('the rendered frame could not be decoded for re-encoding')); };
        img.src = result.data;
      });
      if (String(encoded).indexOf('data:' + mime) !== 0) {
        result = { success: false, platform, format, error: 'this browser cannot encode ' + format + ' (it returned ' + String(encoded).slice(5, 20) + '…).' };
      } else {
        result = Object.assign({}, result, { format, data: encoded, mimeType: mime, size: Math.round(String(encoded).length * 0.75), encodeQuality: settings.compression });
      }
    } catch (e) {
      result = { success: false, platform, format, error: (e && e.message) || String(e) };
    }
  }

  if (result && result.success) Object.assign(result, fidelity(format));
  if (result && result.success && __fit) result.platformFit = __fit;
  // AUDIO TIMING, WHERE THE STUDIO REPORTS IT (6.27). An MP4's AAC track used
  // to start ~44 ms late and run past the picture — a 6.000 s bumper with sound
  // then failed its cap. The engine now reports the track; it is surfaced as
  // result.audio, and its warning (sound in the trimmed lead-in) and any audio
  // longer than the picture go into fidelity.warnings, where a caller looks.
  // WHAT THE ENCODER WAS GIVEN AND WHAT IT MADE (FxTool 16719759, 8.34-8.36).
  // The browser's H.264 treats a bitrate as a ceiling, so an 8 Mbps broadcast
  // request can come out at 1.8 — the engine measures it and warns. A request
  // the report does not reflect (an engine without the options, or a route
  // that rebuilt its settings without them) is named, not assumed.
  // A PDF'S TEXT LAYER (8.10, FxTool 9917cfa5): invisible text at each line's
  // drawn position, so the PDF is searchable and screen-readable. The built-in
  // font is WinAnsi only, so Arabic / Hebrew / CJK lines are left out of the
  // layer (drawn, but not selectable) — counted by the engine, said here.
  const __ee = app.exportEngine;
  const __pr = format === 'pdf' && ((result && result.pdf) || (__ee && __ee.lastPdfReport));
  if (result && result.success && __pr && typeof __pr === 'object') {
    result.pdf = __pr;
    const __pw = [];
    // Which scripts a PDF can carry depends on the studio: older ones have
    // only the built-in Latin font, newer ones embed the scene's fonts. So the
    // cause is the engine's report (fonts it could not embed), not a claim here.
    const __ff = (__pr.fonts && Array.isArray(__pr.fonts.families)) ? __pr.fonts.families.filter(function(f) { return f && f.reason; }) : [];
    const __fnames = __ff.slice(0, 4).map(function(f) { return f.family + ' (' + f.reason + ')'; }).join('; ');
    if (__pr.searchableText && __pr.linesSkipped > 0) __pw.push({ code: 'pdf_text_lines_skipped', message: __pr.linesSkipped + ' text line(s) are not in the searchable layer — no font in the PDF covers their characters — so they are drawn but cannot be selected, searched or read by a screen reader.' + (__fnames ? ' Fonts that could not be embedded: ' + __fnames + '.' : '') });
    if (__ff.length && !(__pr.linesSkipped > 0)) __pw.push({ code: 'pdf_font_not_embedded', message: 'these fonts could not be embedded, so their text uses a fallback font in the searchable layer: ' + __fnames + '.' });
    if (__pr.searchableText && __pr.pagesWithoutLayer) __pw.push({ code: 'pdf_no_text_layer', message: 'some pages have no searchable text layer — ' + __pr.pagesWithoutLayer.join('; ') });
    if (!__pr.searchableText && __pr.reason && __pr.reason !== 'off') __pw.push({ code: 'pdf_no_text_layer', message: 'no searchable text layer was written (' + __pr.reason + '): the text is drawn but cannot be selected, searched or read by a screen reader.' });
    if (__pw.length) {
      result.fidelity = result.fidelity || { warnings: [] };
      result.fidelity.warnings = (result.fidelity.warnings || []).concat(__pw);
      if (result.fidelity.note) delete result.fidelity.note;
    }
  }
  const __vr = __vx && __vx.lastVideoReport;
  if (result && result.success && __vr && typeof __vr === 'object') result.video = __vr;${webmAlpha ? `
  // A TRANSPARENT WEBM is confirmed from the encoder's own record: an alpha
  // stream with frames in it. A studio without WebM alpha writes an opaque
  // file that looks like it worked.
  if (result && result.success) {
    const __al = __vr && __vr.alpha;
    const __aw = [];
    if (!(__al && __al.frames > 0)) __aw.push({ code: 'alpha_not_applied', message: 'transparent was asked for, but this studio wrote no alpha stream: the WebM is opaque (transparent areas black). Export apng, or a png sequence, for transparency here.' });
    else if (__al.keyframeMismatches > 0) __aw.push({ code: 'alpha_keyframe_mismatch', message: __al.keyframeMismatches + ' frame(s) had colour and alpha keyframes out of step; some players may show those frames without transparency.' });
    if (__aw.length) {
      result.fidelity = result.fidelity || { warnings: [] };
      result.fidelity.warnings = (result.fidelity.warnings || []).concat(__aw);
      if (result.fidelity.note) delete result.fidelity.note;
    }
  }` : ''}${headroomDefaulted ? `
  // The applied value is the engine's own report where it gives one
  // (5adfcf1c: lastVideoReport.headroom), so the result and the report agree.
  if (result && result.success) result.broadcastHeadroom = { value: (__vr && typeof __vr.headroom === 'number') ? __vr.headroom : 12, defaulted: true, note: 'broadcast defaults to 12 luma codes of headroom, which keeps encoder ringing legal; pass broadcastHeadroom: 0 for the full range.' };` : ''}
  // AN ODD SIDE ROUNDED UP (FxTool e64a5260). H.264 needs even dimensions, so
  // 1200x675 came out 1200x676 — and platform specs are exact-pixel. The
  // result's dimensions become what the file IS, and fidelity says why.
  const __vd = __vr && __vr.dimensions;
  if (result && result.success && __vd && Array.isArray(__vd.requested) && Array.isArray(__vd.output)
      && (__vd.requested[0] !== __vd.output[0] || __vd.requested[1] !== __vd.output[1])) {
    result.dimensions = { width: __vd.output[0], height: __vd.output[1] };
    result.fidelity = result.fidelity || { warnings: [] };
    result.fidelity.warnings = (result.fidelity.warnings || []).concat([{ code: 'dimensions_rounded',
      message: 'the file is ' + __vd.output[0] + 'x' + __vd.output[1] + ', not the requested ' + __vd.requested[0] + 'x' + __vd.requested[1] + ': H.264 needs even dimensions, so an odd side was rounded up by 1 px (the extra row / column is background). For an exact-pixel spec, use an even canvas size, or crop the extra line when re-encoding (ffmpeg -vf crop=' + __vd.requested[0] + ':' + __vd.requested[1] + ':0:0).' }]);
    if (result.fidelity.note) delete result.fidelity.note;
  }
  // LUMA OUTSIDE 16-235 (8.35, FxTool 4f1ec3ae). The broadcast encode is
  // decoded back and measured: H.264 ringing at hard edges puts a fraction of
  // a percent of samples out of range, which QC rejects. broadcastHeadroom
  // cuts it but never to zero, so a legaliser pass is the requirement.
  if (result && result.success && __vr && __vr.luma && __vr.luma.outOfRange > 0 && result.fidelity) {
    result.fidelity.warnings = (result.fidelity.warnings || []).concat([{ code: 'luma_out_of_range',
      message: 'broadcast QC will reject this as delivered: ' + ((__vr.luma.outOfRangeFraction || 0) * 100).toFixed(3) + '% of decoded luma is outside 16-235 (min ' + __vr.luma.min + ', max ' + __vr.luma.max + ', broadcastHeadroom ' + (typeof __vr.headroom === 'number' ? __vr.headroom : ${JSON.stringify(broadcastHeadroom ?? 12)}) + '). First re-export with a larger broadcastHeadroom (12 measured clean on hard white-on-black edges; up to 40). Otherwise a legaliser pass is REQUIRED before delivery — clip into a NARROWER band and re-encode at high quality, because a plain 16-235 clip followed by a re-encode brings the edge overshoot back: ffmpeg -i in.mp4 -vf "lutyuv=y=clip(val\\\\,28\\\\,223):u=clip(val\\\\,16\\\\,240):v=clip(val\\\\,16\\\\,240)" -c:v libx264 -crf 18 -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a copy out.mp4 (measured 20-229). Verify the luma range after re-encoding.' }]);
    if (result.fidelity.note) delete result.fidelity.note;
  }
${Object.keys(videoEncodeOpts).length ? `  if (result && result.success) {
    const __asked = ${JSON.stringify(videoEncodeOpts)};
    const __vw = [];
    // The engine joins its warnings into one string (bitrate floor, then
    // luma), so each is raised from its own numbers, not from that text.
    if (__vr && typeof __vr.achievedBitrate === 'number' && typeof __vr.bitrateFloor === 'number' && __vr.achievedBitrate < __vr.bitrateFloor * 0.95) {
      __vw.push({ code: 'bitrate_below_floor', message: 'achieved ' + (__vr.achievedBitrate / 1e6).toFixed(2) + ' Mbps against a ' + (__vr.bitrateFloor / 1e6).toFixed(1) + ' Mbps floor: the browser encoder treats the bitrate as a ceiling and does not pad simple content. Re-encode for delivery (e.g. ffmpeg -b:v with -minrate / -bufsize) if the spec requires the floor.' });
    }
    if (!__vr || typeof __vr !== 'object') {
      __vw.push({ code: 'encode_options_not_applied', message: 'this studio did not report its encode, so ' + Object.keys(__asked).join(', ') + ' cannot be confirmed — it likely has no broadcast / bitrate support, and the file is an ordinary web encode.' });
    } else {
      if (__asked.broadcast && __vr.broadcast !== true) __vw.push({ code: 'broadcast_not_applied', message: 'broadcast was asked for but the encode was not broadcast-safe (the export route dropped the option): full-range, untagged colour.' });
      if (__asked.bitrate !== undefined && typeof __vr.bitrate === 'number' && __vr.bitrate < __asked.bitrate * 0.99) __vw.push({ code: 'bitrate_not_applied', message: 'bitrate ' + __asked.bitrate + ' was asked for; the encoder was given ' + __vr.bitrate + '.' });
    }
    if (__vw.length && result.fidelity) {
      result.fidelity.warnings = (result.fidelity.warnings || []).concat(__vw);
      if (result.fidelity.note) delete result.fidelity.note;
    }
  }
` : ''}  const __ar = __vx && __vx.lastAudioReport;
  if (result && result.success && __ar && typeof __ar === 'object') {
    result.audio = __ar;
    const __aw = [];
    if (__ar.warning) __aw.push({ code: 'audio_lead_trimmed', message: String(__ar.warning) });
    if (typeof __ar.audioDurationS === 'number' && typeof __ar.videoDurationS === 'number' && __ar.audioDurationS > __ar.videoDurationS + 0.0105) {
      __aw.push({ code: 'audio_longer_than_video', message: 'the audio track is ' + __ar.audioDurationS.toFixed(4) + ' s against ' + __ar.videoDurationS.toFixed(4) + ' s of picture — a platform with a hard length cap may read the longer one.' });
    }
    if (__aw.length && result.fidelity) {
      result.fidelity.warnings = (result.fidelity.warnings || []).concat(__aw);
      if (result.fidelity.note) delete result.fidelity.note;
    }
  }
${(() => {
    // A DURATION THAT OVERRUNS AT AN NTSC RATE (round 9 FF, 1.76): 6 s at
    // 29.97 is round(6 x 30000/1001) = 180 frames = 6.006 s, over a 6.000 s
    // bumper cap, silently. Said, with the longest duration that fits.
    if (fps === undefined || Number.isInteger(fps)) return '';
    const frames = Math.round(videoDuration * fps);
    const actual = frames / fps;
    if (actual <= videoDuration + 1e-9) return '';
    const fit = Math.floor(videoDuration * fps) / fps;
    return `  if (result && result.success && ['mp4', 'webm', 'gif', 'apng'].indexOf(format) !== -1) result.timing = ${JSON.stringify({
      frames, seconds: Math.round(actual * 1e6) / 1e6, requested: videoDuration,
      warning: `${frames} frames at ${Math.round(fps * 1000) / 1000} fps is ${actual.toFixed(3)} s — ${((actual - videoDuration) * 1000).toFixed(1)} ms over the ${videoDuration} s asked for. For a hard cap (e.g. a 6 s bumper) use duration ${fit.toFixed(4)} (${Math.floor(videoDuration * fps)} frames).`,
    })};\n`;
  })()}
${stillTime !== undefined ? `  try { app.setPlaybackTime(__prevT); } catch (_) { /* the still is already rendered */ }
  if (result && result.success) result.time = ${stillTime};` : ''}

  return result;
})();
`.trim();
  }

  /**
   * Generate code for content analysis
   */
  generateAgentAnalyze(input: AgentAnalyzeInput): string {
    AgentAnalyzeInputSchema.parse(input);

    return `
// Analyze canvas content
(function() {
  const analysis = {
    hasAnimations: false,
    animationTypes: [],
    colorComplexity: 'simple',
    itemCount: 0,
    canvasSize: { width: 0, height: 0 },
    hasRelations: false,
    relationTypes: [],
    hasGradients: false,
    hasShadows: false,
    hasText: false,
    hasImages: false,
  };

  // THE ARTBOARD, NOT THE BACKING STORE.
  //
  // canvasEl.width and paper.view.size are both in device pixels, so a
  // 1920x1080 artboard was reported as 2233x1472 — measured from production.
  // That is not even the device pixel ratio (a 2233px store in a 924px box is
  // 2.4166), so a caller cannot divide it back out. Anything derived from it
  // is wrong by an unknown factor, and synthetic clicks computed from it miss
  // in silence. getCanvasSize() is the artboard the caller set.
  if (typeof app.getCanvasSize === 'function') {
    const cs = app.getCanvasSize();
    if (cs && cs.width) analysis.canvasSize = { width: cs.width, height: cs.height };
  }
  if (!analysis.canvasSize.width) {
    if (app.canvasSize && app.canvasSize.width) {
      analysis.canvasSize = { width: app.canvasSize.width, height: app.canvasSize.height };
    } else if (app.canvasEl) {
      // Last resort on a studio with neither: a backing-store size is better
      // than zero, and it is flagged so nobody treats it as the artboard.
      analysis.canvasSize = { width: app.canvasEl.width, height: app.canvasEl.height, backingStore: true };
    } else if (paper.view) {
      analysis.canvasSize = { width: paper.view.size.width, height: paper.view.size.height, backingStore: true };
    }
  }

  // Count items and analyze types
  const items = app.itemRegistry ? app.itemRegistry.getAll() : [];
  analysis.itemCount = items.length;

  const animationSet = new Set();
  const relationSet = new Set();
  let hasGradient = false;
  let hasShadow = false;

  items.forEach(entry => {
    const item = entry.item;
    const data = item.data || {};

    if (entry.type === 'text' || item.className === 'PointText') analysis.hasText = true;
    if (item.className === 'Raster') analysis.hasImages = true;

    if (data.animationType) {
      analysis.hasAnimations = true;
      animationSet.add(data.animationType);
    }
    // Detect keyframe animations (added via app.addAnimation with keyframes array)
    if (data.keyframes || data.animation || data.keyframeAnimation) {
      analysis.hasAnimations = true;
      animationSet.add('keyframe');
    }

    if (item.fillColor && item.fillColor.gradient) hasGradient = true;
    if (item.strokeColor && item.strokeColor.gradient) hasGradient = true;
    if (item.shadowColor || item.shadowBlur) hasShadow = true;
  });

  // FxTool has no animationManager — animations are detected via item.data.animationType walk above
  // Check timeline for active animations
  if (app.timelineState?.isPlaying || app.animatedItems?.size > 0) {
    analysis.hasAnimations = true;
    animationSet.add('timeline');
  }

  analysis.animationTypes = Array.from(animationSet);
  analysis.hasGradients = hasGradient;
  analysis.hasShadows = hasShadow;

  // Check relations
  if (app.relationRegistry) {
    // getAll() has never existed on the registry, so this branch always took
    // the empty fallback and every analysis reported NO relations. getStats()
    // is the real accessor and answers both questions directly:
    // associationsByType is keyed by relation type.
    const relStats = typeof app.relationRegistry.getStats === 'function'
      ? app.relationRegistry.getStats()
      : null;
    (Object.keys((relStats && relStats.associationsByType) || {})).forEach(t => relationSet.add(t));
    analysis.relationTypes = Array.from(relationSet);
    analysis.hasRelations = !!relStats && (relStats.activeItems > 0 || analysis.relationTypes.length > 0);
    if (analysis.hasRelations) analysis.hasAnimations = true;
  }

  // Determine color complexity
  if (hasGradient) {
    analysis.colorComplexity = 'gradient';
  } else if (analysis.itemCount > 20 || hasShadow) {
    analysis.colorComplexity = 'complex';
  }

  // Generate recommendations
  const recommendations = [];
  const { width, height } = analysis.canvasSize;
  const aspectRatio = width / height;

  if (analysis.hasAnimations) {
    if (analysis.hasGradients || analysis.colorComplexity === 'complex') {
      recommendations.push({ platform: 'web', format: 'webm', confidence: 0.9, reason: 'Animated content with gradients renders best as WebM' });
      recommendations.push({ platform: 'instagram', format: 'mp4', confidence: 0.85, reason: 'MP4 for social media compatibility' });
    } else {
      recommendations.push({ platform: 'web', format: 'svg', confidence: 0.95, reason: 'Simple animations export well as animated SVG' });
      recommendations.push({ platform: 'twitter', format: 'gif', confidence: 0.8, reason: 'GIF for social media', warnings: ['Limited to 256 colors'] });
    }
  } else {
    if (analysis.colorComplexity === 'simple' && !analysis.hasImages) {
      recommendations.push({ platform: 'web', format: 'svg', confidence: 0.95, reason: 'Vector graphics best as SVG for scalability' });
    } else {
      recommendations.push({ platform: 'instagram', format: 'png', confidence: 0.9, reason: 'High quality static export as PNG' });
    }
  }

  // Platform suggestions based on aspect ratio
  const suggestedPlatforms = [];
  if (Math.abs(aspectRatio - 1) < 0.1) suggestedPlatforms.push('instagram');
  if (aspectRatio < 0.7) suggestedPlatforms.push('instagram-story', 'tiktok');
  if (aspectRatio > 1.5) suggestedPlatforms.push('youtube', 'twitter', 'linkedin');
  suggestedPlatforms.push('web');

  return {
    success: true,
    analysis,
    recommendations,
    suggestedPlatforms
  };
})();
`.trim();
  }

  // ===========================================================================
  // LETTER COLLAGE CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code to create a letter collage
   */
  generateCreateLetterCollage(input: CreateLetterCollageInput): string {
    const validated = CreateLetterCollageInputSchema.parse(input);
    const {
      text,
      style = 'tile',
      palette,
      position,
      fontSize = 48,
      fontFamily = 'Inter, sans-serif',
      spacing = 1.1,
      gradientPalette,
      gradientDirection = 'vertical',
      cornerRadius = 4,
      shadowEnabled = true,
      particleSpacing,
      particleDotSize,
    } = validated;

    // Build options object
    const options: Record<string, unknown> = {
      style,
      fontSize,
      fontFamily,
      spacing,
      cornerRadius,
      shadowEnabled,
    };

    if (palette) options.palette = palette;
    if (position) options.position = position;
    if (gradientPalette) options.gradientPalette = gradientPalette;
    if (gradientDirection) options.gradientDirection = gradientDirection;
    if (particleSpacing !== undefined) options.particleSpacing = particleSpacing;
    if (particleDotSize !== undefined) options.particleDotSize = particleDotSize;

    return `
// Create letter collage
(function() {
  const text = ${JSON.stringify(text)};
  const options = ${JSON.stringify(options, null, 2)};

  if (!app.createLetterCollage) {
    return { success: false, error: 'Letter collage feature not available' };
  }

  const result = app.createLetterCollage(text, options);

  if (app.historyManager) {
    app.historyManager.saveState('create_letter_collage');
  }

  // Return a SERIALIZABLE summary — never the raw result. result.group and
  // result.letters are live Paper.js objects (circular parent/children refs,
  // methods, canvas handles); the browser round-trip (page.evaluate / CDP
  // return-by-value) can't serialize them, so returning result throws
  // "Failed to execute code in browser" even though the collage was already
  // created — a false negative. Surface registry ids instead.
  const collageId = (result && (result.collageId
    || (result.group && result.group.data && (result.group.data.id || result.group.data.registryId)))) || null;
  const letterIds = (result && Array.isArray(result.letters))
    ? result.letters.map(function(l){ return (l && l.data && (l.data.id || l.data.registryId)) || null; }).filter(Boolean)
    : [];
  if (!collageId) {
    return { success: false, error: 'createLetterCollage returned no id', letterCount: letterIds.length, letterIds: letterIds };
  }
  return { success: true, collageId: collageId, itemId: collageId, letterCount: letterIds.length, letterIds: letterIds };
})();
`.trim();
  }

  /**
   * Generate code to animate a letter collage
   */
  generateAnimateLetterCollage(input: AnimateLetterCollageInput): string {
    const validated = AnimateLetterCollageInputSchema.parse(input);
    const {
      collageId,
      animationType,
      staggerDelay = 0.1,
      animationSpeed = 1,
    } = validated;

    return `
// Animate letter collage: ${collageId}
(function() {
  const collageId = ${JSON.stringify(collageId)};
  const animationType = ${JSON.stringify(animationType)};
  const staggerDelay = ${staggerDelay};
  const animationSpeed = ${animationSpeed};

  if (!app.animateLetterCollage) {
    return { success: false, error: 'Letter collage animation not available' };
  }

  // POSITIONAL, and it was not: the engine signature is
  // animateLetterCollage(collageId, animationType, options), in PinePaper.js.
  // Passing one object put it in the animationType slot, so the type the caller
  // asked for was discarded on EVERY call and the collage animated as whatever
  // the engine falls back to. Silent: the call still returned, still reported
  // success, and the collage still moved a little, which is why it read as
  // "the flagship text effect doesn't survive export" rather than as a
  // dropped argument.
  const result = app.animateLetterCollage(collageId, animationType, {
    staggerDelay,
    animationSpeed
  });

  return result;
})();
`.trim();
  }

  // ===========================================================================
  // MAP CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code to load a geographic map
   */
  generateLoadMap(input: LoadMapInput): string {
    const validated = LoadMapInputSchema.parse(input);
    const { mapId, ...raw } = validated;

    // THIS SCHEMA AND loadMap() SHARED ALMOST NO VOCABULARY.
    //
    // loadMap(source, options) destructures projection, center, scale, rotate,
    // fitBounds, parent, styles, style, interactive, selectable, showOcean,
    // oceanColor, quality, smoothPaths and simplifyTolerance. Of the twelve
    // options this tool offered, SEVEN were none of those: the styling keys
    // live nested under `styles` and are spelled differently there, and the two
    // interactivity flags have other names entirely. Every one was accepted,
    // JSON-stringified into the call and dropped — a caller who set fillColor
    // got the default grey with no indication why.
    const { fillColor, strokeColor, strokeWidth, hoverFill, hoverStroke, enableHover, enableClick, options: extraOptions, ...passthrough } = raw;

    // The engine's own style vocabulary — see stylePresets in MapSystem.js.
    const styles: Record<string, unknown> = {};
    if (fillColor !== undefined) styles.fill = fillColor;
    if (strokeColor !== undefined) styles.stroke = strokeColor;
    // strokeWidth only survives inside `styles`; the merge overwrites a
    // top-level one with the quality preset's value.
    if (strokeWidth !== undefined) styles.strokeWidth = strokeWidth;
    if (hoverFill !== undefined) styles.hoverFill = hoverFill;
    // hoverStroke reads from mergedStyles beside hoverFill, so it belongs in
    // the same place. It landed late — the two MCP specs documented it for a
    // long time before any source file did — and an older studio merges it,
    // finds nothing that reads it, and leaves the outline at the base stroke.
    // Mapped rather than stripped so it simply starts working on such a studio
    // without a change here, and reported below so a caller on an older one
    // learns why their outline did not move.
    if (hoverStroke !== undefined) styles.hoverStroke = hoverStroke;

    // `options` was declared by the tool's description and stripped by the
    // schema, so `{style: 'dark'}` never reached loadMap. It carries the
    // options not named individually above — style presets, showOcean,
    // fitBounds, preserve — and is spread FIRST so an explicitly named field
    // still wins over the same key inside it.
    const engineOptions: Record<string, unknown> = {
      ...(extraOptions && typeof extraOptions === 'object' ? extraOptions as Record<string, unknown> : {}),
      ...passthrough,
    };
    if (Object.keys(styles).length > 0) engineOptions.styles = styles;
    if (enableHover !== undefined) engineOptions.interactive = enableHover;
    if (enableClick !== undefined) engineOptions.selectable = enableClick;

    const ignored = hoverStroke !== undefined ? ['hoverStroke'] : [];
    const optionsStr = Object.keys(engineOptions).length > 0 ? JSON.stringify(engineOptions) : '{}';
    const warn = ignored.length
      ? `\n      conditional: ${JSON.stringify(ignored)},\n      note: 'hoverStroke needs a studio recent enough to read it; an older one ignores it and the hover outline stays the base stroke.',`
      : '';

    return `
// Load geographic map
(async function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = await app.mapSystem.loadMap('${mapId}', ${optionsStr});
    return {
      success: true,
      mapId: result.mapId || '${mapId}',
      regions: result.regions?.length || 0,
      bounds: result.bounds,
      center: result.center,${warn}
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to highlight map regions
   */
  generateHighlightRegions(input: HighlightRegionsInput): string {
    const validated = HighlightRegionsInputSchema.parse(input);
    const regionIds = JSON.stringify(validated.regionIds);

    // highlightRegions(ids, style) reads style.fill / .stroke / .strokeWidth.
    // This passed fillColor / strokeColor / strokeWidth, so the first two were
    // dropped and every highlight came out the default blue. A caller reaching
    // for `color` — the obvious name, and the one a pilot actually used — was
    // rejected by the schema before it got this far; it is accepted now and
    // means the fill.
    const ho = (validated.options ?? {}) as Record<string, unknown>;
    const style: Record<string, unknown> = {};
    const fill = ho.color ?? ho.fillColor ?? ho.fill;
    if (fill !== undefined) style.fill = fill;
    const stroke = ho.strokeColor ?? ho.stroke;
    if (stroke !== undefined) style.stroke = stroke;
    if (ho.strokeWidth !== undefined) style.strokeWidth = ho.strokeWidth;
    for (const [k, v] of Object.entries(ho)) {
      if (!['color', 'fillColor', 'fill', 'strokeColor', 'stroke', 'strokeWidth'].includes(k) && v !== undefined) {
        style[k] = v;
      }
    }
    const optionsStr = JSON.stringify(style);

    return `
// Highlight map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.highlightRegions(${regionIds}, ${optionsStr});
    return { success: true, highlighted: ${regionIds} };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to unhighlight map regions
   */
  generateUnhighlightRegions(input: UnhighlightRegionsInput): string {
    const validated = UnhighlightRegionsInputSchema.parse(input);
    const regionIds = validated.regionIds === 'all' ? "'all'" : JSON.stringify(validated.regionIds);

    return `
// Unhighlight map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.unhighlightRegions(${regionIds});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to apply data-driven colors (choropleth)
   */
  generateApplyDataColors(input: ApplyDataColorsInput): string {
    const validated = ApplyDataColorsInputSchema.parse(input);
    const dataStr = JSON.stringify(validated.data);

    // THE ENGINE TAKES A COLOUR RAMP, NOT THE NAME OF ONE.
    //
    // applyDataColors destructures `colorScale = ['#f7fbff', '#08519c']` — two
    // endpoints it interpolates between — plus `domain` and `legend`. This tool
    // published a preset NAME ('greens'), which the engine then indexed as an
    // array: colorScale[0] of a string is 'g', and every region came out
    // near-black. It also published minValue/maxValue/showLegend, none of which
    // the engine reads.
    //
    // Translated here rather than in the schema: the names are the friendlier
    // surface and this is ordinary cross-repo vocabulary drift, which is what
    // the emitter exists to absorb.
    const RAMPS: Record<string, [string, string]> = {
      blues: ['#f7fbff', '#08519c'],
      greens: ['#f7fcf5', '#006d2c'],
      reds: ['#fff5f0', '#a50f15'],
      oranges: ['#fff5eb', '#a63603'],
      purples: ['#fcfbfd', '#54278f'],
      heat: ['#ffffb2', '#bd0026'],
    };
    const o = validated.options ?? {};
    const engineOptions: Record<string, unknown> = {};
    if (o.colorScale) engineOptions.colorScale = RAMPS[o.colorScale] ?? RAMPS.blues;
    if (o.minValue !== undefined || o.maxValue !== undefined) {
      const values = Object.values(validated.data);
      engineOptions.domain = [
        o.minValue ?? Math.min(...values),
        o.maxValue ?? Math.max(...values),
      ];
    }
    if (o.showLegend !== undefined) engineOptions.legend = o.showLegend;
    for (const [k, v] of Object.entries(o)) {
      if (!['colorScale', 'minValue', 'maxValue', 'showLegend'].includes(k) && v !== undefined) {
        engineOptions[k] = v;
      }
    }
    const optionsStr = JSON.stringify(engineOptions);

    return `
// Apply choropleth data colors
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.applyDataColors(${dataStr}, ${optionsStr});
    return { success: true, regionsColored: ${Object.keys(validated.data).length} };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to add a map marker
   */
  generateAddMarker(input: AddMarkerInput): string {
    const validated = AddMarkerInputSchema.parse(input);
    const options: Record<string, unknown> = {
      lat: validated.lat,
      lon: validated.lon,
    };
    if (validated.label) options.label = validated.label;
    if (validated.color) options.color = validated.color;
    if (validated.size) options.size = validated.size;
    if (validated.pulse !== undefined) options.pulse = validated.pulse;
    if (validated.shape) options.shape = validated.shape;

    return `
// Add map marker
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const marker = app.mapSystem.addMarker(${JSON.stringify(options)});
    return { success: true, markerId: marker?.id || 'marker_added' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to add map labels
   */
  generateAddMapLabels(input: AddMapLabelsInput): string {
    const validated = AddMapLabelsInputSchema.parse(input);
    const regionsStr = validated.regions ? JSON.stringify(validated.regions) : 'null';
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';

    return `
// Add map labels
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // addLabels() has never existed. addRegionLabel(regionId, options) is the
    // engine's own per-region call, and this tool's input is a list of regions,
    // so the loop IS the mapping — applyCustomLabels takes a
    // {regionId: text} map instead, which is a different question.
    const _labelled = [];
    const _missed = [];
    for (const _r of ${regionsStr}) {
      const _item = app.mapSystem.addRegionLabel(_r, ${optionsStr});
      (_item ? _labelled : _missed).push(_r);
    }
    return { success: _labelled.length > 0, labelled: _labelled, count: _labelled.length,
      ...(_missed.length ? { notLabelled: _missed, note: 'no region on this map matched these ids — check get_highlighted_map_regions or the map you loaded.' } : {}) };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to pan the map
   */
  generatePanMap(input: PanMapInput): string {
    const validated = PanMapInputSchema.parse(input);
    const options: Record<string, unknown> = {};
    if (validated.animate !== undefined) options.animate = validated.animate;
    if (validated.duration !== undefined) options.duration = validated.duration;

    return `
// Pan map to coordinates
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // panTo() has never existed on any studio, and there is no lat/lon pan for
    // a flat map to route this to. Refused by NAME with the calls that do work,
    // rather than letting the caller take an undefined-is-not-a-function.
    return { success: false, error: 'pan_map is not supported: the engine has no lat/lon pan. '
      + 'On a globe, rotateGlobeTo brings a coordinate to the front; on a flat map, zoom to a REGION '
      + '(zoomToRegion) or call resetView for the whole view. This tool accepted coordinates and did '
      + 'nothing for as long as it existed.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to zoom the map
   */
  generateZoomMap(input: ZoomMapInput): string {
    const validated = ZoomMapInputSchema.parse(input);
    const options: Record<string, unknown> = {};
    if (validated.animate !== undefined) options.animate = validated.animate;
    if (validated.duration !== undefined) options.duration = validated.duration;

    return `
// Set map zoom level
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // zoomTo(level) has never existed. The engine zooms to a REGION, not to a
    // numeric level, so there is nothing to convert a level into.
    return { success: false, error: 'zoom_map takes a numeric level and the engine has no such call: it zooms to a REGION. '
      + 'Use zoomToRegion with a region id, or resetView for the full view. A level was accepted here and did '
      + 'nothing for as long as this tool existed.' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to export map configuration
   */
  generateExportMap(): string {
    return `
// Export map configuration
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // exportMap() has never existed. exportGeoJSON() is the real one, and it
    // returns the geometry rather than a "configuration" — named accordingly
    // instead of being spread into a shape the caller cannot rely on.
    if (typeof app.mapSystem.exportGeoJSON !== 'function') {
      return { success: false, error: 'this studio cannot export map data — app.mapSystem.exportGeoJSON is unavailable.' };
    }
    const geojson = app.mapSystem.exportGeoJSON();
    const info = typeof app.mapSystem.getMapSourceInfo === 'function' ? app.mapSystem.getMapSourceInfo() : null;
    return { success: true, geojson, ...(info ? { source: info } : {}) };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to import a custom map
   */
  generateImportCustomMap(input: ImportCustomMapInput): string {
    const validated = ImportCustomMapInputSchema.parse(input);
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';

    if (validated.url) {
      return `
// Import custom map from URL
(async function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = await app.mapSystem.importCustomMap('${validated.url}', ${optionsStr});
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
    } else if (validated.geoJson) {
      return `
// Import custom GeoJSON map
(async function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = await app.mapSystem.importCustomMap(${JSON.stringify(validated.geoJson)}, ${optionsStr});
    return { success: true, ...result };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
    }

    return `
// Import custom map - no source provided
(function() {
  return { success: false, error: 'Either url or geoJson must be provided' };
})();
`.trim();
  }

  /**
   * Generate code to get region at a point (hit testing)
   */
  generateGetRegionAtPoint(input: GetRegionAtPointInput): string {
    const validated = GetRegionAtPointInputSchema.parse(input);

    return `
// Get region at canvas point
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // getRegionAtPoint() has never existed; the engine exposes no hit test.
    // canvasToGeo turns a point into COORDINATES, which is a different answer,
    // so it is offered rather than quietly substituted.
    if (typeof app.mapSystem.canvasToGeo === 'function') {
      const coord = app.mapSystem.canvasToGeo(${validated.x}, ${validated.y});
      return { success: false, coordinate: coord,
        error: 'the engine has no region hit test. That point is at ' + JSON.stringify(coord)
          + ' — find regions by id with get_highlighted_map_regions or getSelectedRegions.' };
    }
    const region = null;
    if (region) {
      return { success: true, regionId: region.id, regionName: region.name, properties: region.properties };
    }
    return { success: true, regionId: null, message: 'No region at this point' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  // ===========================================================================
  // MAP ANIMATION/CSV CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code to animate map regions with keyframes
   */
  generateAnimateMapRegions(input: AnimateMapRegionsInput): string {
    const validated = AnimateMapRegionsInputSchema.parse(input);
    const regionsStr = JSON.stringify(validated.regions);

    return `
// Animate map regions with keyframes
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.animateRegions({
      duration: ${validated.duration || 5},
      loop: ${validated.loop !== false},
      regions: ${regionsStr}
    });
    return { success: true, animatedRegions: Object.keys(${regionsStr}), duration: ${validated.duration || 5}, errors: result?.errors || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to create wave animation across map regions
   */
  generateAnimateMapWave(input: AnimateMapWaveInput): string {
    const validated = AnimateMapWaveInputSchema.parse(input);
    const colorsStr = validated.colors ? JSON.stringify(validated.colors) : '["#ef4444", "#fbbf24", "#22c55e", "#3b82f6"]';

    return `
// Create wave animation across map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.animateRegionsWave({
      duration: ${validated.duration || 10},
      loop: ${validated.loop !== false},
      colors: ${colorsStr},
      waveDirection: '${validated.waveDirection || 'horizontal'}'
    });
    return { success: true, animatedRegions: result?.animatedRegions || [], totalRegions: result?.totalRegions || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to stop map animations
   */
  generateStopMapAnimations(input: StopMapAnimationsInput): string {
    const validated = StopMapAnimationsInputSchema.parse(input);
    const regionsStr = validated.regions ? JSON.stringify(validated.regions) : 'null';

    return `
// Stop map region animations
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.stopRegionAnimations({
      regions: ${regionsStr},
      resetColors: ${validated.resetColors !== false}
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to get animated map regions
   */
  generateGetAnimatedMapRegions(): string {
    return `
// Get animated map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.getAnimatedRegions();
    return { animatedRegions: result?.animatedRegions || [], count: result?.count || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to export map region data as CSV
   */
  generateExportMapRegionCSV(input: ExportMapRegionCSVInput): string {
    const validated = ExportMapRegionCSVInputSchema.parse(input);

    return `
// Export map region data as CSV
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.exportRegionDataCSV({
      includeHighlighted: ${validated.includeHighlighted !== false},
      includeSelected: ${validated.includeSelected !== false},
      includeColors: ${validated.includeColors !== false},
      download: ${validated.download === true},
      filename: '${validated.filename || 'map-regions.csv'}'
    });
    return { success: true, csv: result?.csv || '', regionCount: result?.regionCount || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to import CSV data to update map regions
   */
  generateImportMapRegionCSV(input: ImportMapRegionCSVInput): string {
    const validated = ImportMapRegionCSVInputSchema.parse(input);
    // Escape the CSV text for JavaScript string
    const escapedCsv = validated.csvText.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');

    return `
// Import CSV data to update map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // importRegionDataCSV(csvText, options) — the TEXT is positional, and it
    // was being passed inside the options bag where nothing read it.
    const result = app.mapSystem.importRegionDataCSV(\`${escapedCsv}\`, {
      applyColors: ${validated.applyColors !== false},
      applyHighlight: ${validated.applyHighlight !== false},
      applySelection: ${validated.applySelection !== false}
    });
    return { success: true, updatedRegions: result?.updatedRegions || 0, notFound: result?.notFound || [], errors: result?.errors || [] };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to select map regions
   */
  generateSelectMapRegions(input: SelectMapRegionsInput): string {
    const validated = SelectMapRegionsInputSchema.parse(input);
    const regionIds = JSON.stringify(validated.regionIds);

    return `
// Select map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.selectRegions(${regionIds});
    return { success: true, selected: ${regionIds} };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to deselect map regions
   */
  generateDeselectMapRegions(input: DeselectMapRegionsInput): string {
    const validated = DeselectMapRegionsInputSchema.parse(input);
    const regionIds = validated.regionIds ? JSON.stringify(validated.regionIds) : 'null';

    return `
// Deselect map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    app.mapSystem.deselectRegions(${regionIds});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to get highlighted map regions
   */
  generateGetHighlightedMapRegions(): string {
    return `
// Get highlighted map regions
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.getHighlightedRegions();
    return { highlighted: result?.highlighted || [], count: result?.count || 0 };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  // -------------------------------------------------------------------------
  // Globe + World Tour
  // -------------------------------------------------------------------------

  /**
   * Generate code to enable globe (orthographic) mode
   */
  generateGlobeEnable(input: GlobeEnableInput): string {
    const validated = GlobeEnableInputSchema.parse(input);
    const optionsStr = JSON.stringify(validated);

    return `
// Enable globe mode
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.enableGlobeMode !== 'function') {
    return { success: false, error: 'enableGlobeMode unavailable on this build (update the canvas)' };
  }

  try {
    app.mapSystem.enableGlobeMode(${optionsStr});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to rotate the globe to a coordinate (versor slerp)
   */
  generateGlobeRotateTo(input: GlobeRotateToInput): string {
    const validated = GlobeRotateToInputSchema.parse(input);
    const durationArg = validated.duration !== undefined ? `, ${validated.duration}` : '';

    return `
// Rotate globe to coordinate
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.rotateGlobeTo !== 'function') {
    return { success: false, error: 'rotateGlobeTo unavailable on this build (update the canvas)' };
  }

  try {
    app.mapSystem.rotateGlobeTo(${validated.lon}, ${validated.lat}${durationArg});
    return { success: true, rotateTo: [${validated.lon}, ${validated.lat}] };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to continuously spin the globe
   */
  generateGlobeSpin(input: GlobeSpinInput): string {
    const validated = GlobeSpinInputSchema.parse(input);
    const optionsStr = JSON.stringify(validated);

    return `
// Spin globe continuously
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.animateGlobeRotation !== 'function') {
    return { success: false, error: 'animateGlobeRotation unavailable on this build (update the canvas)' };
  }

  try {
    const callbackId = app.mapSystem.animateGlobeRotation(${optionsStr});
    return { success: true, callbackId: callbackId || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to run a world tour across regions or coordinates
   */
  generateWorldTour(input: WorldTourInput): string {
    const validated = WorldTourInputSchema.parse(input);
    const optionsStr = JSON.stringify(validated);

    return `
// World tour across regions / coordinates
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.worldTour !== 'function') {
    return { success: false, error: 'worldTour unavailable on this build (update the canvas)' };
  }

  try {
    const tourId = app.mapSystem.worldTour(${optionsStr});
    return { success: true, tourId: tourId || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to stop a running world tour
   */
  generateStopWorldTour(input: StopWorldTourInput): string {
    const validated = StopWorldTourInputSchema.parse(input);
    const idArg = validated.id !== undefined ? JSON.stringify(validated.id) : '';

    return `
// Stop world tour
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.stopWorldTour !== 'function') {
    return { success: false, error: 'stopWorldTour unavailable on this build (update the canvas)' };
  }

  try {
    app.mapSystem.stopWorldTour(${idArg});
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to pin a canvas item to a globe surface coordinate
   */
  generatePinToGlobe(input: PinToGlobeInput): string {
    const validated = PinToGlobeInputSchema.parse(input);
    const itemId = validated.itemId;
    const opts = JSON.stringify({ hideOnFarSide: validated.hideOnFarSide });

    return `
// Pin item to globe coordinate
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }
  if (typeof app.mapSystem.pinItemToGlobe !== 'function') {
    return { success: false, error: 'pinItemToGlobe unavailable on this build (update the canvas)' };
  }

  const item = (app.getItemById && app.getItemById(${JSON.stringify(itemId)})) || (app.itemRegistry && app.itemRegistry.get && app.itemRegistry.get(${JSON.stringify(itemId)}) && (app.itemRegistry.get(${JSON.stringify(itemId)}).item || app.itemRegistry.get(${JSON.stringify(itemId)})));
  if (!item) {
    return { success: false, error: 'Item ${itemId} not found' };
  }

  try {
    const pinned = app.mapSystem.pinItemToGlobe(item, ${validated.lon}, ${validated.lat}, ${opts});
    return { success: !!pinned, pinned: !!pinned };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to tour a canvas item along regions or coordinates
   */
  generateTourItem(input: TourItemInput): string {
    const validated = TourItemInputSchema.parse(input);
    const itemId = validated.itemId;
    const { itemId: _omit, regions, coords, ...rest } = validated;
    const optsStr = JSON.stringify(rest);

    return `
// Tour item along regions / coordinates
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  const item = (app.getItemById && app.getItemById(${JSON.stringify(itemId)})) || (app.itemRegistry && app.itemRegistry.get && app.itemRegistry.get(${JSON.stringify(itemId)}) && (app.itemRegistry.get(${JSON.stringify(itemId)}).item || app.itemRegistry.get(${JSON.stringify(itemId)})));
  if (!item) {
    return { success: false, error: 'Item ${itemId} not found' };
  }

  try {
    ${regions
      ? `if (typeof app.mapSystem.tourRegions !== 'function') { return { success: false, error: 'tourRegions unavailable on this build (update the canvas)' }; }
    const tourId = app.mapSystem.tourRegions(item, ${JSON.stringify(regions)}, ${optsStr});`
      : `if (typeof app.mapSystem.tourItemAlongCoords !== 'function') { return { success: false, error: 'tourItemAlongCoords unavailable on this build (update the canvas)' }; }
    const tourId = app.mapSystem.tourItemAlongCoords(item, ${JSON.stringify(coords || [])}, ${optsStr});`}
    return { success: true, tourId: tourId || null };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to export the complete scene state
   */
  generateExportScene(): string {
    return `
// Export complete scene state
(function() {
  try {
    const items = [];
    const relations = [];
    const decorative = [];

    // Collect items from registry.
    //
    // ItemRegistry exposes get/getAll — never \`entries()\`. Iterating a
    // non-existent method threw on EVERY call, so this tool has never once
    // returned a scene. getAll() yields registry ENTRIES
    // ({ itemId, item, type, properties }), not bare Paper items, so the
    // geometry has to be read off entry.item.
    if (app.itemRegistry && typeof app.itemRegistry.getAll === 'function') {
      for (const entry of app.itemRegistry.getAll()) {
        const item = entry.item;
        if (!item) continue;
        const itemData = {
          id: entry.itemId,
          type: entry.type || item.data?.type || item.className?.toLowerCase() || 'unknown',
          position: item.position ? { x: item.position.x, y: item.position.y } : null,
          bounds: item.bounds ? {
            x: item.bounds.x,
            y: item.bounds.y,
            width: item.bounds.width,
            height: item.bounds.height
          } : null,
          properties: {}
        };

        // Collect common properties
        if (item.fillColor) itemData.properties.fillColor = item.fillColor.toCSS ? item.fillColor.toCSS() : item.fillColor;
        if (item.strokeColor) itemData.properties.strokeColor = item.strokeColor.toCSS ? item.strokeColor.toCSS() : item.strokeColor;
        if (item.strokeWidth) itemData.properties.strokeWidth = item.strokeWidth;
        if (item.opacity !== undefined) itemData.properties.opacity = item.opacity;
        // TRUE ROTATION, not the property. create() BAKES an angle into the path
        // segments under Paper's applyMatrix default, so item.rotation reads back 0 on
        // an item that is visibly rotated. Reporting that 0 is why "I could not rotate
        // a rectangle" was filed against an engine that rotates correctly. The engine
        // records the baked offset at item.data._bakedRotation and sums the two itself
        // (PinePaper.js does exactly this); read the same sum rather than the half of
        // it that happens to be zero.
        const _rot = typeof app.authoredRotation === 'function' ? app.authoredRotation(item) : ((item.data?._bakedRotation || 0) + (item.rotation || 0));
        if (_rot) itemData.properties.rotation = _rot;
        if (item.data?.content) itemData.properties.content = item.data.content;
        if (item.visible === false) itemData.properties.visible = false;

        // THE SECOND TIMELINE. A video/audio item carries its own clip window
        // (media-time in/out) plus where that window sits on the project
        // timeline. Without it a consumer sees "there is a video here" and has
        // no idea which 5 seconds of it play, or when.
        const p = entry.properties || {};
        if (p.inPoint !== undefined || p.outPoint !== undefined || p.clipStartTime !== undefined) {
          itemData.clip = {
            clipStartTime: p.clipStartTime ?? 0,   // project-timeline start, s
            inPoint: p.inPoint ?? 0,               // media-time in, s
            outPoint: p.outPoint ?? null           // media-time out, s
          };
        }

        // When this item is on screen at all, merged across keyframe clip
        // window / loop / mask / relation windows / effects / media clip.
        // null end = open-ended. Static items report null.
        if (typeof app.activeWindowOf === 'function') {
          try {
            const w = app.activeWindowOf(entry.itemId);
            if (w) itemData.activeWindow = w;
          } catch (_) { /* non-fatal — an item without a window is just static */ }
        }

        if (item.data?.isDecorative) {
          decorative.push(itemData);
        } else {
          items.push(itemData);
        }
      }
    }

    // Collect relations — the EDGE LIST, which with the items above is the
    // scene DAG.
    //
    // \`app.getRelations()\` takes an itemId; called bare it returns [], so the
    // old code emitted an empty edge list for every scene. exportForSave() is
    // the canonical whole-graph dump (the same one history persistence uses)
    // and returns { fromId, toId, relation, params }.
    if (app.relationRegistry && typeof app.relationRegistry.exportForSave === 'function') {
      for (const rel of app.relationRegistry.exportForSave()) {
        relations.push({
          sourceId: rel.fromId,
          targetId: rel.toId ?? null,   // null = self-relation, not a missing edge
          type: rel.relation,
          params: rel.params
        });
      }
    }

    // Get background color and canvas size
    const backgroundColor = app.canvasEl?.style?.backgroundColor || null;
    const canvasSize = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 };

    return {
      success: true,
      items: items,
      relations: relations,
      decorative: decorative,
      backgroundColor: backgroundColor,
      canvasSize: canvasSize,
      itemCount: items.length,
      relationCount: relations.length
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to export map as GeoJSON with current styling
   */
  generateExportMapGeoJson(options: {
    includeStyles?: boolean;
    includeMetadata?: boolean;
    selectedOnly?: boolean;
    download?: boolean;
    filename?: string;
  } = {}): string {
    const includeStyles = options.includeStyles !== false;
    const includeMetadata = options.includeMetadata !== false;
    const selectedOnly = options.selectedOnly || false;
    const download = options.download || false;
    const filename = options.filename || 'map-export.geojson';

    return `
// Export map as GeoJSON
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.exportGeoJSON({
      includeStyles: ${includeStyles},
      includeMetadata: ${includeMetadata},
      selectedOnly: ${selectedOnly},
      download: ${download},
      filename: ${JSON.stringify(filename)}
    });
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to export original map GeoJSON (unmodified boundaries)
   */
  generateExportOriginalMapGeoJson(options: {
    download?: boolean;
    filename?: string;
  } = {}): string {
    const download = options.download || false;
    const filename = options.filename || 'map-source.geojson';

    return `
// Export original map GeoJSON
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    // Two methods, not one with a flag: getOriginalGeoJSON() returns the data,
    // downloadOriginalGeoJSON(filename) hands it to the browser.
    // exportOriginalGeoJSON has never existed.
    const result = ${download}
      ? app.mapSystem.downloadOriginalGeoJSON(${JSON.stringify(filename)})
      : app.mapSystem.getOriginalGeoJSON();
    if (result === null || result === undefined) {
      return { success: false, error: 'no map is loaded, so there is no source GeoJSON to return' };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to get map source info
   */
  generateGetMapSourceInfo(): string {
    return `
// Get map source info
(function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = app.mapSystem.getMapSourceInfo();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * Generate code to register a Paper.js item
   */
  generateRegisterItem(input: {
    itemJson: object;
    itemType: string;
    properties?: Record<string, unknown>;
  }): string {
    const itemJsonStr = JSON.stringify(input.itemJson);
    const propertiesStr = input.properties ? JSON.stringify(input.properties) : '{}';

    return `
// Register Paper.js item
(function() {
  try {
    // Import the Paper.js item from JSON
    const item = paper.project.importJSON(${itemJsonStr});
    if (!item) {
      return { success: false, error: 'Failed to import item from JSON' };
    }

    // Register in item registry
    const itemId = app.itemRegistry ? 'item_' + (app.itemRegistry.size + 1) : 'item_1';
    item.data = item.data || {};
    item.data.registryId = itemId;
    item.data.type = ${JSON.stringify(input.itemType)};

    // Merge custom properties
    const customProps = ${propertiesStr};
    Object.assign(item.data, customProps);

    // Add to registry
    if (app.itemRegistry) {
      app.itemRegistry.set(itemId, item);
    }

    // Add to appropriate group
    if (app.textItemGroup) {
      app.textItemGroup.addChild(item);
    }

    return {
      success: true,
      itemId: itemId,
      type: ${JSON.stringify(input.itemType)},
      position: item.position ? { x: item.position.x, y: item.position.y } : null,
      bounds: item.bounds ? {
        x: item.bounds.x,
        y: item.bounds.y,
        width: item.bounds.width,
        height: item.bounds.height
      } : null
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  // =============================================================================
  // CUSTOM RELATION & CODE GENERATORS
  // =============================================================================

  generateRegisterCustomRelation(input: RegisterCustomRelationInput): string {
    const validated = RegisterCustomRelationInputSchema.parse(input);
    const paramsStr = validated.params ? JSON.stringify(validated.params) : '{}';
    const templatesStr = validated.templates ? JSON.stringify(validated.templates) : '[]';

    return `
// Register custom relation: ${validated.name}
(function() {
  try {
    app.registerRelationRule('${validated.name}', {
      description: ${JSON.stringify(validated.description || '')},
      params: ${paramsStr},
      compute: (ctx) => {
        const { fromPosition, toPosition, params, delta, time } = ctx;
        ${validated.computeFunction}
      },
      apply: (item, target, computed, params) => {
        ${validated.applyFunction}
      },
      templates: ${templatesStr},
      continuous: ${validated.continuous !== false},
      priority: ${validated.priority || 0}
    });
    return { success: true, relationName: '${validated.name}', message: 'Custom relation registered successfully' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  generateExecuteCustomCode(input: ExecuteCustomCodeInput): string {
    const validated = ExecuteCustomCodeInputSchema.parse(input);
    const description = validated.description || 'Execute custom code';

    // ASYNC, because the code inside is not ours.
    //
    // This wrapped the caller's snippet in a SYNC IIFE, which does two things
    // to async work. A top-level `await` is a syntax error inside a
    // non-async function, so a snippet that awaits anything fails to parse at
    // all. And async work started without await returns a promise nobody
    // holds: the IIFE returns immediately, the tool reports success, and the
    // next call reads a canvas where the work has not happened yet.
    //
    // That is the whole async half of the engine — export, image import,
    // rigging bake, layout — unreachable from the one tool whose entire
    // purpose is reaching things the tool surface does not cover.
    //
    // An async IIFE is still a `(`-led expression statement, so the governor
    // captures its value, and executeCode's eval fallback already resolves a
    // returned promise. Both paths await it; neither needed changing.
    return `
// ${description}
(async function() {
  try {
    ${validated.code}
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  // =============================================================================
  // MASK GENERATORS
  // =============================================================================

  generateApplyAnimatedMask(input: ApplyAnimatedMaskInput): string {
    const validated = ApplyAnimatedMaskInputSchema.parse(input);
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';
    const keyframesStr = validated.keyframes ? JSON.stringify(validated.keyframes) : 'null';
    const maskOptionsStr = validated.maskOptions ? JSON.stringify(validated.maskOptions) : '{}';

    const preset = validated.preset || validated.maskType || 'wipeLeft';

    // MODE 3 PASSED AN ANIMATION PRESET WHERE A MASK SHAPE GOES.
    //
    // applyCustomMask(item, maskType, keyframes, options) wants a SHAPE —
    // 'rectangle', 'circle', 'star'. With preset + keyframes this handed it
    // 'iris' or 'wipeLeft', which is an animation name, so the shape was
    // whatever the engine falls back to and the keyframes drove the wrong
    // geometry. maskType is the field that carries the shape, and it is only
    // used as the preset above when no preset was given at all.
    const customShape = validated.maskType && validated.maskType !== preset
      ? validated.maskType
      : 'rectangle';
    // Per-preset options. Custom keyframes are an animated-mask extension —
    // when supplied, fall through to maskingSystem.applyCustomMask instead.
    return `
// Apply animated mask to ${validated.itemId}
(function() {
  if (!app.applyAnimatedMask) {
    return { success: false, error: 'Mask system not available' };
  }
  const item = app.getItemById('${validated.itemId}');
  if (!item) return { success: false, error: 'Item not found: ${validated.itemId}' };

  try {
    const mergedOpts = Object.assign({}, ${optionsStr}, ${maskOptionsStr});
    let maskedGroup;
    if (${keyframesStr} && app.maskingSystem && app.maskingSystem.applyCustomMask) {
      maskedGroup = app.maskingSystem.applyCustomMask(item, '${customShape}', ${keyframesStr}, mergedOpts);
    } else {
      maskedGroup = app.applyAnimatedMask(item, '${preset}', mergedOpts);
    }
    // A mask with an unknown ANIMATION preset still masks — the item just never
    // animates — so !!maskedGroup is true either way. The engine records which.
    const rej = maskedGroup && maskedGroup.data && maskedGroup.data.maskAnimationRejected;
    if (rej) {
      return {
        success: false,
        itemId: '${validated.itemId}',
        error: 'Masked, but the animation preset "' + rej.requested + '" is unknown — it will NOT animate.',
        requested: rej.requested,
        known: rej.known,
      };
    }
    return { success: !!maskedGroup, itemId: '${validated.itemId}', preset: '${preset}' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  generateApplyCustomMask(input: ApplyCustomMaskInput): string {
    const validated = ApplyCustomMaskInputSchema.parse(input);
    const keyframesStr = JSON.stringify(validated.keyframes);
    const maskOptionsStr = validated.maskOptions ? JSON.stringify(validated.maskOptions) : '{}';

    return `
// Apply custom mask to ${validated.itemId}
(function() {
  if (!app.maskingSystem || !app.maskingSystem.applyCustomMask) {
    return { success: false, error: 'Mask system not available' };
  }
  const item = app.getItemById('${validated.itemId}');
  if (!item) return { success: false, error: 'Item not found: ${validated.itemId}' };

  try {
    const maskedGroup = app.maskingSystem.applyCustomMask(item, '${validated.maskType}', ${keyframesStr}, ${maskOptionsStr});
    return { success: !!maskedGroup, itemId: '${validated.itemId}', maskType: '${validated.maskType}' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  generateRemoveMask(input: RemoveMaskInput): string {
    const validated = RemoveMaskInputSchema.parse(input);

    return `
// Remove mask from ${validated.itemId}
(function() {
  if (!app.removeMask) {
    return { success: false, error: 'Mask system not available' };
  }
  // The item id may point at either the masked group OR the original item;
  // app.removeMask expects the masked group, so resolve and walk up if needed.
  const item = app.getItemById('${validated.itemId}');
  if (!item) return { success: false, error: 'Item not found: ${validated.itemId}' };
  const maskedGroup = (item.data && item.data.isMaskedGroup) ? item : (item.parent && item.parent.data && item.parent.data.isMaskedGroup ? item.parent : item);

  try {
    app.removeMask(maskedGroup);
    return { success: true, itemId: '${validated.itemId}', message: 'Mask removed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
})();
`.trim();
  }

  /**
   * What THIS item can animate, from the engine's own table.
   *
   * The table is derived from the applier rather than written beside it, so it
   * cannot drift from what actually gets applied — and it is filtered by item
   * type, because the trim/dash four only exist on a path and a rectangle has
   * no fontSize.
   *
   * `interpolates: false` is passed through VERBATIM and never flattened away.
   * `content` and `blendMode` are DISCRETE — they hold their value until the
   * next keyframe rather than blending toward it — and treating content as
   * tweenable is what made every word in a cycler appear half a beat early.
   * A list that says only "animatable" rebuilds that bug in the next agent.
   */
  generateListItemAnimatableProperties(itemId: string): string {
    return `
// Animatable properties of ${JSON.stringify(itemId)}
(function() {
  if (typeof app.listAnimatableProperties !== 'function') {
    return { success: false, error: 'app.listAnimatableProperties unavailable — update the studio. The keyframe tool lists the properties it accepts in its own description meanwhile.' };
  }
  const item = app.getItemById(${JSON.stringify(itemId)});
  if (!item) { return { success: false, error: 'no item ${itemId}' }; }
  const r = app.listAnimatableProperties(item);
  return { success: true, ...r };
})();`.trim();
  }

  generateGetAnimatableProperties(): string {
    return `
// Get animatable properties for mask types
(function() {
  return {
    rectangle: {
      properties: ['x', 'y', 'width', 'height', 'rotation', 'opacity'],
      description: 'Rectangular mask with position and size'
    },
    circle: {
      properties: ['x', 'y', 'radius', 'scale', 'opacity'],
      description: 'Circular mask with center and radius'
    },
    ellipse: {
      properties: ['x', 'y', 'radiusX', 'radiusY', 'rotation', 'scale', 'opacity'],
      description: 'Elliptical mask with separate radii'
    },
    star: {
      properties: ['x', 'y', 'radius', 'scale', 'rotation', 'opacity'],
      description: 'Star mask with configurable points'
    },
    triangle: {
      properties: ['x', 'y', 'scale', 'rotation', 'opacity'],
      description: 'Triangular mask'
    },
    hexagon: {
      properties: ['x', 'y', 'scale', 'rotation', 'opacity'],
      description: 'Hexagonal mask'
    },
    heart: {
      properties: ['x', 'y', 'scale', 'rotation', 'opacity'],
      description: 'Heart-shaped mask'
    },
    rounded: {
      properties: ['x', 'y', 'width', 'height', 'cornerRadius', 'rotation', 'opacity'],
      description: 'Rounded rectangle mask'
    }
  };
})();
`.trim();
  }

  generateGetAvailableEasings(): string {
    return `
// Get available easing functions
(function() {
  return {
    easings: ['linear', 'easeIn', 'easeOut', 'easeInOut', 'bounce', 'elastic'],
    descriptions: {
      linear: 'Constant speed',
      easeIn: 'Slow start, fast end',
      easeOut: 'Fast start, slow end',
      easeInOut: 'Slow start and end',
      bounce: 'Bouncing effect at end',
      elastic: 'Spring-like overshoot'
    }
  };
})();
`.trim();
  }

  generateGetMaskTypes(): string {
    return `
// Get available mask types
(function() {
  return {
    maskTypes: ['rectangle', 'circle', 'ellipse', 'star', 'triangle', 'hexagon', 'heart', 'rounded', 'custom']
  };
})();
`.trim();
  }

  generateGetMaskAnimations(): string {
    return `
// Get available mask animation presets
(function() {
  return {
    animations: [
      'wipeLeft', 'wipeRight', 'wipeUp', 'wipeDown',
      'iris', 'irisOut',
      'star', 'heart',
      'curtainHorizontal', 'curtainVertical', 'cinematic',
      'diagonalWipe',
      'revealUp', 'revealDown'
    ]
  };
})();
`.trim();
  }

  // =============================================================================
  // TEMPLATE
  // =============================================================================

  generateApplyTemplate(input: ApplyTemplateInput): string {
    const { templateId, category, listOnly } = input;

    if (listOnly || !templateId) {
      const categoryFilter = category ? `'${category}'` : 'null';
      return `
// List available templates
(function() {
  if (!app.templateManager) {
    return { error: 'Template manager not available. Make sure PinePaper Studio is loaded.' };
  }
  const allTemplates = app.templateManager.getAllTemplates();
  const category = ${categoryFilter};
  const filtered = category
    ? allTemplates.filter(t => t.category === category)
    : allTemplates;
  return {
    templates: filtered.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description || ''
    })),
    count: filtered.length,
    categories: [...new Set(allTemplates.map(t => t.category))]
  };
})();
`.trim();
    }

    return `
// Apply template: ${templateId}
(async function() {
  if (!app.templateManager) {
    return { error: 'Template manager not available. Make sure PinePaper Studio is loaded.' };
  }
  try {
    await app.templateManager.loadTemplate('${templateId}', true);

    // DID THE CLIPPED CHARACTER PARTS SURVIVE?
    //
    // A clipped character group is saved with its nested texture and mask in
    // paperJSON. A studio whose restore predates the reader for that key
    // rebuilds it through the generic group branch instead — an empty,
    // unclipped group — so the part is written to the template correctly and
    // dropped on the way back in, with nothing raised.
    //
    // Checked by BEHAVIOUR, not by version: the template says how many clipped
    // groups it carries, the canvas says how many came back. An engine that
    // restores them makes this condition unreachable, so it needs no removing
    // later; an older studio is exactly where it still matters, and this
    // package ships independently of the studio it drives.
    //
    // THE WARNING MATTERS MORE THAN THE LOAD. Loading is harmless and
    // reversible — the file on disk still holds the paperJSON, so the same
    // template reloads intact on a studio that can read it. Re-SAVING from
    // this canvas is not: the exporter would serialise the empty group it can
    // see, and the texture and mask would leave the file for good.
    let fidelity = {};
    try {
      const tpl = (app.templateManager.getAllTemplates() || [])
        .find(function(t) { return t && (t.id === '${templateId}' || t.templateId === '${templateId}'); });
      const items = tpl && tpl.data && Array.isArray(tpl.data.items) ? tpl.data.items : null;
      const declared = items ? items.filter(function(i) { return i && i.type === 'group' && i.paperJSON; }).length : 0;
      if (declared > 0 && app.itemRegistry && typeof app.itemRegistry.getAll === 'function') {
        const clipped = (app.itemRegistry.getAll() || []).filter(function(e) {
          const it = e && (e.item || e);
          return it && it.className === 'Group' && it.clipped === true;
        }).length;
        if (clipped === 0) {
          fidelity = {
            clippedPartsLost: declared,
            warning: 'This template carries ' + declared + ' clipped character part(s) with a nested texture and mask, '
              + 'and this studio restored none of them — they are on the canvas as empty groups. '
              + 'DO NOT SAVE THIS CANVAS BACK OVER THE TEMPLATE: the export would write the empty groups and the '
              + 'texture would be lost from the file permanently. The template itself is still intact; update the '
              + 'studio and load it again.',
          };
        }
      }
    } catch (e) { /* a check that cannot run must not fail the load */ }

    return { success: true, templateId: '${templateId}', message: 'Template applied successfully. Canvas has been replaced with template content.', ...fidelity };
  } catch (e) {
    return { error: 'Failed to apply template: ' + e.message };
  }
})();
`.trim();
  }

  generateImportImage(input: ImportImageInput): string {
    const { url, position, maxWidth, maxHeight, mask, smoothing } = input;

    // Each fragment used to be written with a LEADING comma, as if it followed
    // an entry that no longer exists — so the first one opened the object with
    // `{, position: …}` and the emitted code was a syntax error. Passing any
    // option at all therefore failed 100% of the time, which is why imported
    // images could never be positioned, sized or masked. Join instead, so the
    // separators come from the number of options rather than from each one.
    const optParts = [
      position ? `position: { x: ${position.x}, y: ${position.y} }` : '',
      maxWidth !== undefined ? `maxWidth: ${maxWidth}` : '',
      maxHeight !== undefined ? `maxHeight: ${maxHeight}` : '',
    ].filter(Boolean);
    const optsLiteral = optParts.length ? `{ ${optParts.join(', ')} }` : '{}';

    return `
// Import image from URL
(async function() {
  if (!app.imageTools) {
    return { error: 'Image tools not available. Make sure PinePaper Studio is loaded.' };
  }
  try {
    // FETCH IT OURSELVES FIRST, to find out WHY when it fails.
    //
    // uploadFromURL sets img.src and rejects with a bare "Failed to load image
    // from URL" — an <img> onerror genuinely carries no reason, so that message
    // is the browser's limit rather than the engine being unhelpful. fetch()
    // has the reason: a status code, a CORS rejection, a refused connection, a
    // DNS failure. A caller cannot debug what the tool will not show them.
    //
    // The bytes then go in as a DATA URL, which img.src loads without touching
    // the network again — so a host that allows fetch but blocks the image
    // load (CORS on <img>, a tainted-canvas refusal) now works too.
    let src = '${url}';
    // A STAGED KEY, not the bytes. The handler writes anything over ~64KB to
    // window.__ppStage and passes the key instead, because the governor's
    // loop-guard transform bails on a code string that large and takes the
    // run's return value with it. See ExecuteCodeOptions.stage.
    if (src.indexOf('__ppStage:') === 0) {
      const _key = src.slice('__ppStage:'.length);
      const _staged = window.__ppStage && window.__ppStage[_key];
      if (!_staged) {
        return { success: false, error: 'the image bytes were staged as ' + _key + ' and are not on the page — this is a bug in the MCP server, not your call.' };
      }
      src = _staged;
    }
    if (!src.startsWith('data:')) {
      let res;
      try {
        res = await fetch(src);
      } catch (netErr) {
        return { success: false, error: 'could not reach ' + src + ' — ' + (netErr && netErr.message ? netErr.message : 'network request failed')
          + '. The failure is in the browser network stack: check the host resolves, the port is open, and that any proxy passes plain HTTP as well as HTTPS CONNECT.' };
      }
      if (!res.ok) {
        return { success: false, error: 'the server refused ' + src + ' — HTTP ' + res.status + ' ' + (res.statusText || ''), status: res.status };
      }
      const blob = await res.blob();
      if (!blob.type.startsWith('image/')) {
        return { success: false, error: src + ' returned ' + (blob.type || 'an unknown content type') + ', not an image. Check the URL serves the file itself rather than a web page around it.', contentType: blob.type };
      }
      src = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result);
        fr.onerror = () => reject(new Error('could not read the downloaded image'));
        fr.readAsDataURL(blob);
      });
    }
    const entry = await app.imageTools.uploadFromURL(src);
    const opts = ${optsLiteral};
    const raster = await app.imageTools.placeImage(entry.id, Object.keys(opts).length > 0 ? opts : undefined);
${smoothing ? `    // Pixel art wants 'off': Paper's Raster draws with smoothing 'low' by
    // default, which blurs every scaled-up pixel edge. Read at every draw,
    // export frames included. Set before a mask, which clones the raster.
    if (raster && 'smoothing' in raster) raster.smoothing = ${JSON.stringify(smoothing)};\n` : ''}    // The REGISTRY id is \`data.id\`. \`data.itemId\` has never existed, so this
    // fell through to \`raster.id\` — a Paper.js NUMBER — and the handle the tool
    // returned could not be used as a relation endpoint or with modify/animate.
    // Register the raster if placeImage somehow left it unregistered, so the
    // caller always gets a usable id rather than a number that looks like one.
    let itemId = raster.data?.id;
    if (!itemId && typeof app.registerItem === 'function') {
      itemId = app.registerItem(raster, 'image', { source: 'mcp-import' });
    }
    if (!itemId) {
      return { error: 'Image placed but not registered — no usable item id. This is a bug; report the scene.' };
    }
    let placed = raster;
${mask ? `    // A MASK REPLACES THE RASTER (round 8 DD, 4.10). applyMask builds a
    // clipping group from a CLONE and removes the original, so the id and bounds
    // read off \`raster\` afterwards described an item no longer on the canvas.
    // The group is what is drawn: the registry id is rebound to it (the
    // registry's own method for exactly this), and a mask that did not apply is
    // refused instead of answered with the raster's bounds.
    const masked = app.imageTools.applyMask(raster, ${JSON.stringify(mask)});
    if (!masked) {
      return { success: false, itemId: itemId, error: 'the ${mask} mask was not applied — the image may not be a raster yet. The unmasked image is on the canvas as ' + itemId + '.' };
    }
    if (app.itemRegistry && typeof app.itemRegistry.rebind === 'function') app.itemRegistry.rebind(itemId, masked);
    placed = masked;
` : ''}    const b = placed.bounds;
    if (!b || !(b.width > 0) || !(b.height > 0)) {
      return { success: false, itemId: itemId, error: 'the image was placed with no size (' + (b ? b.width + 'x' + b.height : 'no bounds') + ') — it may not have loaded. Nothing visible was drawn.' };
    }
    return {
      success: true,
      itemId: itemId,
      message: 'Image imported and placed on canvas.',
      bounds: { x: b.x, y: b.y, width: b.width, height: b.height }${mask ? `,\n      mask: '${mask}'` : ''}
    };
  } catch (e) {
    return { error: 'Failed to import image: ' + e.message };
  }
})();
`.trim();
  }
  generateManageScenes(input: ManageScenesInput): string {
    const guard = `if (!app.sceneManager) return { error: 'SceneManager not available' };`;

    switch (input.action) {
      case 'save':
        return `
// Save current canvas as scene
(async function() {
  ${guard}
  try {
    const result = await app.sceneManager.saveCurrentAsScene(${JSON.stringify(input.name || 'Untitled Scene')});
    return { success: true, action: 'save', sceneId: result?.id || result, name: ${JSON.stringify(input.name || 'Untitled Scene')} };
  } catch (e) {
    return { error: 'Failed to save scene: ' + e.message };
  }
})();
`.trim();

      case 'load':
        return `
// Load scene
(async function() {
  ${guard}
  try {
    await app.sceneManager.loadScene(${JSON.stringify(input.sceneId)}${input.transition ? `, { transition: ${JSON.stringify(input.transition)} }` : ''});
    return { success: true, action: 'load', sceneId: ${JSON.stringify(input.sceneId)}${input.transition ? `, transition: ${JSON.stringify(input.transition)}` : ''} };
  } catch (e) {
    return { error: 'Failed to load scene: ' + e.message };
  }
})();
`.trim();

      case 'list':
        return `
// List all scenes
(function() {
  ${guard}
  const scenes = app.sceneManager.listScenes();
  return { success: true, action: 'list', scenes: scenes, count: scenes.length };
})();
`.trim();

      case 'delete':
        return `
// Delete scene
(function() {
  ${guard}
  app.sceneManager.deleteScene(${JSON.stringify(input.sceneId)});
  return { success: true, action: 'delete', sceneId: ${JSON.stringify(input.sceneId)} };
})();
`.trim();

      case 'rename':
        return `
// Rename scene
(function() {
  ${guard}
  app.sceneManager.renameScene(${JSON.stringify(input.sceneId)}, ${JSON.stringify(input.name)});
  return { success: true, action: 'rename', sceneId: ${JSON.stringify(input.sceneId)}, name: ${JSON.stringify(input.name)} };
})();
`.trim();

      case 'duplicate':
        return `
// Duplicate scene
(function() {
  ${guard}
  const result = app.sceneManager.duplicateScene(${JSON.stringify(input.sceneId)});
  return { success: true, action: 'duplicate', originalId: ${JSON.stringify(input.sceneId)}, newScene: result };
})();
`.trim();

      case 'reorder':
        return `
// Reorder scenes
(function() {
  ${guard}
  app.sceneManager.reorderScenes(${JSON.stringify(input.sceneIds)});
  return { success: true, action: 'reorder', order: ${JSON.stringify(input.sceneIds)} };
})();
`.trim();

      case 'info':
        return `
// Get scene info
(function() {
  ${guard}
  const scene = app.sceneManager.getScene(${JSON.stringify(input.sceneId)});
  if (!scene) return { error: 'Scene not found: ${input.sceneId}' };
  return { success: true, action: 'info', scene: scene };
})();
`.trim();

      case 'export':
        return `
// Export all scenes
(function() {
  ${guard}
  const data = app.sceneManager.exportScenes();
  return { success: true, action: 'export', data: data };
})();
`.trim();

      case 'import':
        return `
// Import scenes
(function() {
  ${guard}
  try {
    const json = ${JSON.stringify(input.scenesJson)};
    app.sceneManager.importScenes(json${input.merge !== undefined ? `, { merge: ${input.merge} }` : ''});
    return { success: true, action: 'import'${input.merge !== undefined ? `, merge: ${input.merge}` : ''} };
  } catch (e) {
    return { error: 'Failed to import scenes: ' + e.message };
  }
})();
`.trim();

      default:
        return `(function() { return { error: 'Unknown manage_scenes action: ${(input as any).action}' }; })();`;
    }
  }

  generateScenePlayback(input: ScenePlaybackInput): string {
    const guard = `if (!app.sceneManager) return { error: 'SceneManager not available' };`;

    switch (input.action) {
      case 'create_chain': {
        const opts: string[] = [];
        if (input.loop !== undefined) opts.push(`loop: ${input.loop}`);
        if (input.autoPlay !== undefined) opts.push(`autoPlay: ${input.autoPlay}`);
        if (input.defaultDuration !== undefined) opts.push(`defaultDuration: ${input.defaultDuration * 1000}`);
        if (input.defaultTransition !== undefined) opts.push(`defaultTransition: ${JSON.stringify(input.defaultTransition)}`);
        if (input.transitionDuration !== undefined) opts.push(`transitionDuration: ${input.transitionDuration * 1000}`);
        const optsStr = opts.length > 0 ? `, { ${opts.join(', ')} }` : '';
        return `
// Create scene chain for sequential playback
(function() {
  ${guard}
  app.sceneManager.createChain(${JSON.stringify(input.sceneIds)}${optsStr});
  return { success: true, action: 'create_chain', sceneIds: ${JSON.stringify(input.sceneIds)}${input.loop !== undefined ? `, loop: ${input.loop}` : ''}${input.defaultDuration !== undefined ? `, defaultDuration: ${input.defaultDuration}` : ''} };
})();
`.trim();
      }

      case 'play':
        return `
// Play scene chain
(async function() {
  ${guard}
  try {
    await app.sceneManager.playChain();
    return { success: true, action: 'play' };
  } catch (e) {
    return { error: 'Failed to play chain: ' + e.message };
  }
})();
`.trim();

      case 'pause':
        return `
// Pause scene chain
(function() {
  ${guard}
  app.sceneManager.pauseChain();
  return { success: true, action: 'pause' };
})();
`.trim();

      case 'resume':
        return `
// Resume scene chain
(function() {
  ${guard}
  app.sceneManager.resumeChain();
  return { success: true, action: 'resume' };
})();
`.trim();

      case 'stop':
        return `
// Stop scene chain
(function() {
  ${guard}
  app.sceneManager.stopChain();
  return { success: true, action: 'stop' };
})();
`.trim();

      case 'toggle_loop':
        return `
// Toggle loop mode
(function() {
  ${guard}
  // chainLoop is a PROPERTY, set by createChain({loop}) and read by the chain
  // advance. setLoop has never existed, so this reported a toggle it had not
  // performed — and a chain built without loop went on not looping.
  if (typeof app.sceneManager.setLoop === 'function') {
    app.sceneManager.setLoop(${input.enabled ?? true});
  } else if ('chainLoop' in app.sceneManager) {
    app.sceneManager.chainLoop = ${input.enabled ?? true};
  } else {
    return { success: false, action: 'toggle_loop',
      error: 'this build has no chain-loop control to set. Pass loop:true to create_chain instead, which is where the setting is read from.' };
  }
  if (!app.sceneManager.sceneChain || !app.sceneManager.sceneChain.length) {
    return { success: true, action: 'toggle_loop', enabled: ${input.enabled ?? true},
      note: 'no chain exists yet — this setting applies to the next one created, and create_chain takes loop directly.' };
  }
  return { success: true, action: 'toggle_loop', enabled: ${input.enabled ?? true} };
})();
`.trim();

      case 'jump':
        return `
// Jump to scene index
(async function() {
  ${guard}
  try {
    await app.sceneManager.jumpToChainIndex(${input.index ?? 0});
    return { success: true, action: 'jump', index: ${input.index ?? 0} };
  } catch (e) {
    return { error: 'Failed to jump to index: ' + e.message };
  }
})();
`.trim();

      default:
        return `(function() { return { error: 'Unknown scene_playback action: ${(input as any).action}' }; })();`;
    }
  }

  generateSceneGraph(input: SceneGraphInput): string {
    const validated = SceneGraphInputSchema.parse(input);
    const S = (v: unknown) => JSON.stringify(v);

    if (validated.action === 'validate') {
      return `
// Check a scene graph WITHOUT drawing it — the same check createSceneGraph runs,
// so an author can fix the graph before committing to a canvas full of cards.
(function() {
  if (typeof app.validateSceneGraph !== 'function') {
    return { success: false, error: 'app.validateSceneGraph unavailable — update FxTool' };
  }
  const r = app.validateSceneGraph(${S(validated.graph)});
  return {
    success: true,
    action: 'validate',
    ok: r ? r.ok : false,
    errors: (r && r.errors) || [],
    // Cycles are legitimate (a retry loop) but reported: an accidental one
    // looks exactly like a game that never ends.
    warnings: (r && r.warnings) || [],
    reachable: (r && r.reachable) || [],
    cycles: (r && r.cycles) || [],
  };
})();
`.trim();
    }

    return `
// Create interactive scene graph (story / quiz cards)
(async function() {
  if (typeof app.createSceneGraph !== 'function') {
    return { success: false, error: 'app.createSceneGraph unavailable — update FxTool' };
  }
  const result = await app.createSceneGraph(${S(validated.graph)}, ${S(validated.opts || {})});
  if (!result) return { success: false, error: 'No result returned' };
  return {
    success: result.ok !== false,
    ok: result.ok,
    errors: result.errors || [],
    warnings: result.warnings || [],
    // The engine reports these and this tool used to drop them. \`failed\` is the
    // one that matters: a graph can compile, render, and still leave N click
    // relations unwired — it looks built and is inert, and nothing else in the
    // result says so. A refused plan returns early without them, hence the
    // defaults.
    wired: result.wired,
    failed: result.failed,
    cycles: result.cycles || [],
    entranced: result.entranced,
    start: result.start,
    ids: result.ids || {},
  };
})();
`.trim();
  }

  // ===========================================================================
  // RELATIVE TIMING, STAGGERS, FLIP
  // ===========================================================================

  generateSequence(input: SequenceInput): string {
    const validated = SequenceInputSchema.parse(input);
    const S = (v: unknown) => JSON.stringify(v);

    if (validated.action === 'list_forms') {
      return `
(function() {
  if (typeof app.listPositionForms !== 'function') {
    return { success: false, error: 'app.listPositionForms unavailable — update FxTool' };
  }
  const forms = app.listPositionForms();
  return { success: true, action: 'list_forms', count: forms.length, forms };
})();
`.trim();
    }

    if (validated.action === 'resolve') {
      return `
// Resolve ONE relative position to absolute seconds.
(function() {
  if (typeof app.resolveTimelinePosition !== 'function') {
    return { success: false, error: 'app.resolveTimelinePosition unavailable — update FxTool' };
  }
  const ctx = { ...${S(validated.context || {})}, labels: ${S(validated.labels || {})} };
  const seconds = app.resolveTimelinePosition(${S(validated.position ?? null)}, ctx);
  return { success: true, action: 'resolve', position: ${S(validated.position ?? null)}, seconds, context: ctx };
})();
`.trim();
    }

    return `
// Place a run of clips in order, each resolved against the ones before it.
(function() {
  if (typeof app.placeSequence !== 'function') {
    return { success: false, error: 'app.placeSequence unavailable — update FxTool' };
  }
  const clips = ${S(validated.clips || [])};
  const result = app.placeSequence(clips, {
    startAt: ${S(validated.startAt ?? 0)},
    labels: ${S(validated.labels || {})},
  });
  // Echo the caller's own clip ids back onto the placements — placeSequence
  // answers positionally, and an agent that named its clips should get the
  // names back rather than having to re-zip two arrays by index.
  const placed = (result.placed || []).map((p, i) => (
    clips[i] && clips[i].id ? { id: clips[i].id, ...p } : p
  ));
  return {
    success: true,
    action: 'place',
    placed,
    labels: result.labels,
    // The timeline only ever grows: a clip placed early with "-=" must not pull
    // the end back and silently truncate everything after it.
    duration: result.duration,
  };
})();
`.trim();
  }

  generateStagger(input: StaggerInput): string {
    const validated = StaggerInputSchema.parse(input);
    const S = (v: unknown) => JSON.stringify(v);

    if (validated.action === 'list_origins') {
      return `
(function() {
  if (typeof app.listStaggerOrigins !== 'function') {
    return { success: false, error: 'app.listStaggerOrigins unavailable — update FxTool' };
  }
  const origins = app.listStaggerOrigins();
  return { success: true, action: 'list_origins', count: origins.length, origins };
})();
`.trim();
    }

    if (validated.action === 'preview') {
      return `
// Delays for a count, without touching the canvas — plan before committing.
(function() {
  if (typeof app.staggerDelays !== 'function') {
    return { success: false, error: 'app.staggerDelays unavailable — update FxTool' };
  }
  const delays = app.staggerDelays(${S(validated.count ?? 0)}, ${S(validated.opts || {})});
  return {
    success: true,
    action: 'preview',
    count: ${S(validated.count ?? 0)},
    delays,
    span: delays.length ? Math.max(...delays) : 0,
  };
})();
`.trim();
    }

    return `
// Apply a stagger to real items, in the order given.
(function() {
  if (typeof app.staggerItems !== 'function') {
    return { success: false, error: 'app.staggerItems unavailable — update FxTool' };
  }
  const ids = ${S(validated.itemIds || [])};
  if (!ids.length) {
    return { success: false, error: 'apply needs itemIds, in the order the stagger should follow (row-major for a grid)' };
  }
  const r = app.staggerItems(ids, ${S(validated.opts || {})});
  // KEYFRAME TRACKS DO NOT READ animationDelay (round 7 X, 2.2). staggerItems
  // writes the delay to data.animationDelay, which the loop presets honour;
  // a tile that already had a keyframe fly-in ignored it, and all 64 tiles of
  // a shatter mosaic arrived on the same frames. A keyframed item's clock is
  // its clip offset, data.timeOffset, so the delay goes there too — on top of
  // the offset it had before the first stagger (remembered), so re-staggering
  // replaces rather than stacks.
  let shiftedTracks = 0;
  if (r && r.ok && Array.isArray(r.delays)) {
    const items = ids.map(function(id) { const e = app.itemRegistry && app.itemRegistry.get(id); return e && e.item; }).filter(Boolean);
    items.forEach(function(item, i) {
      if (!item.data || !Array.isArray(item.data.keyframes) || !item.data.keyframes.length) return;
      if (item.data._staggerBaseOffset === undefined) item.data._staggerBaseOffset = Number(item.data.timeOffset) || 0;
      item.data.timeOffset = item.data._staggerBaseOffset + (Number(r.delays[i]) || 0);
      shiftedTracks++;
    });
  }
  return {
    success: r && r.ok === true,
    action: 'apply',
    shiftedKeyframeTracks: shiftedTracks,
    // 'applied' can be lower than the ids given — an id that resolves to
    // nothing is skipped, and a stagger that silently covered fewer items than
    // asked for is the failure worth seeing.
    requested: ids.length,
    applied: r ? r.applied : 0,
    delays: r ? r.delays : [],
    span: r ? r.span : 0,
  };
})();
`.trim();
  }

  generateFlip(input: FlipInput): string {
    const validated = FlipInputSchema.parse(input);
    const S = (v: unknown) => JSON.stringify(v);

    if (validated.action === 'record') {
      return `
// pp:Flip step one — record where things are NOW, before the change.
//
// The record stays ON THE PAGE rather than travelling back through the tool
// result: it is one snapshot per item of raw geometry, useless to read and
// expensive to carry, and \`apply\` is the only thing that ever wants it.
(function() {
  if (typeof app.recordFlipState !== 'function') {
    return { success: false, error: 'app.recordFlipState unavailable — update FxTool' };
  }
  const ids = ${S(validated.itemIds || null)};
  const record = ids && ids.length ? app.recordFlipState(ids) : app.recordFlipState();
  if (typeof window !== 'undefined') window.__ppFlipRecord = record;
  return {
    success: true,
    action: 'record',
    recorded: (record.snapshots || []).length,
    takenAt: record.takenAt,
    ids: (record.snapshots || []).map(s => s.id),
  };
})();
`.trim();
    }

    const opts: Record<string, unknown> = {};
    if (validated.duration !== undefined) opts.duration = validated.duration;
    if (validated.easing !== undefined) opts.easing = validated.easing;
    if (validated.enter !== undefined) opts.enter = validated.enter;
    if (validated.stagger !== undefined) opts.stagger = validated.stagger;

    return `
// pp:Flip step two — animate from the recorded state to wherever things are now.
// Writes ordinary keyframes, so the transition scrubs, exports to SMIL and
// Lottie, and survives a reload.
(function() {
  if (typeof app.flipItems !== 'function') {
    return { success: false, error: 'app.flipItems unavailable — update FxTool' };
  }
  const record = typeof window !== 'undefined' ? window.__ppFlipRecord : null;
  if (!record || !(record.snapshots || []).length) {
    return { success: false, error: 'Nothing was recorded — run pinepaper_flip { action: "record" } BEFORE the change, then rearrange, then apply' };
  }
  const r = app.flipItems(record, ${S(opts)});
  return {
    success: r && r.ok === true,
    action: 'apply',
    moved: r ? r.moved : 0,
    entered: r ? r.entered : [],
    // Items that LEFT during the change cannot be animated out — they are gone
    // already. Remove them after the flip, not before.
    left: r ? r.left : [],
    duration: r ? r.duration : 0,
  };
})();
`.trim();
  }

  // ===========================================================================
  // SELECTION, TRANSFORM & HISTORY
  // ===========================================================================

  generateSelection(input: SelectionInput): string {
    switch (input.action) {
      case 'select': {
        const ids = JSON.stringify(input.itemIds || []);
        const mode = input.mode || 'replace';
        return `
// Select items
(function() {
  const ids = ${ids};
  if (ids.length === 0) return { error: 'No itemIds provided' };
  ${mode === 'replace' ? 'app.deselectAll();' : ''}
  const selected = [];
  for (const id of ids) {
    const entry = app.itemRegistry.get(id);
    if (entry && entry.item) {
      ${mode === 'remove' ? 'entry.item.selected = false;' : 'app.select(entry.item);'}
      selected.push(id);
    }
  }
  return { success: true, action: 'select', mode: '${mode}', selected };
})();`.trim();
      }
      case 'select_all':
        return `
// Select all items
(function() {
  app.selectAll();
  const items = app.getSelectedItems().map(i => i.data?.itemId || i.name || i.id);
  return { success: true, action: 'select_all', count: items.length, items };
})();`.trim();
      case 'deselect_all':
        return `
// Deselect all items
(function() {
  app.deselectAll();
  return { success: true, action: 'deselect_all' };
})();`.trim();
      case 'get':
        return `
// Get current selection
(function() {
  const items = app.getSelectedItems().map(i => ({
    itemId: i.data?.itemId || i.name || i.id,
    type: i.data?.itemType || i.className,
    bounds: i.bounds ? { x: i.bounds.x, y: i.bounds.y, width: i.bounds.width, height: i.bounds.height } : null
  }));
  return { success: true, action: 'get', count: items.length, items };
})();`.trim();
      case 'delete_selected':
        return `
// Delete selected items
(function() {
  const selection = app.getSelectedItems();
  const deleted = selection.map(i => i.data?.itemId || i.name || i.id);
  app.deleteSelected();
  return { success: true, action: 'delete_selected', deleted, count: deleted.length };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown selection action: ${(input as any).action}' }; })();`;
    }
  }

  /**
   * @private Guard + call one PinePaper facade, uniformly.
   *
   * Every one of the 1.6.4 tools wraps a facade that a given editor build may
   * not have yet — the server ships independently of the app. A missing method
   * has to come back as a NAMED error, not a TypeError inside runGenerated:
   * this repo has shipped three emitters that called methods which never
   * existed (`imageTools.applyFilter`, `itemRegistry.entries`,
   * `itemRegistry.remove`) and each reported success or an opaque throw.
   */
  private _facadeCall(method: string, args: string, label: string): string {
    return `
// ${label}
(async function() {
  if (typeof app.${method} !== 'function') {
    return { success: false, error: 'app.${method}() unavailable — update PinePaper Studio to a build that has it.' };
  }
  const r = await app.${method}(${args});
  // Facades report { ok } — normalise to { success } so every tool result reads
  // the same way, while keeping the original payload intact.
  if (r && typeof r === 'object' && 'ok' in r) {
    return { success: r.ok !== false, ...r };
  }
  return { success: true, result: r };
})();`.trim();
  }

  generateBrandKit(input: BrandKitInput): string {
    const opts = JSON.stringify({ ...(input.selectionOnly ? { selectionOnly: true } : {}) });
    const method = input.action === 'plan' ? 'planBrandKit' : 'applyBrandKit';
    const facade = this._facadeCall(method, `${JSON.stringify(input.kit)}, ${opts}`,
      `Brand kit: ${input.action}`);
    // A KIT'S FONTS ARE LOADED BEFORE IT RESTYLES TEXT — the same fallback as
    // create_item (see emitEnsureFont): the kit named Anton, the headings were
    // re-measured in Times. Each family is checked, loaded if missing, and the
    // outcome for any that needed it rides on the facade's own result.
    const fonts = (input.kit as { fonts?: Record<string, unknown> }).fonts;
    const families = [...new Set(Object.values(fonts ?? {}).filter((f): f is string => typeof f === 'string' && f.trim() !== ''))];
    if (input.action !== 'apply' || families.length === 0) return facade;
    const loads = families.map((f) => `  r = await (async function() {${emitEnsureFont(f).replace(/\n/g, '\n  ')}\n    return __font;\n  })();\n  if (r) __fonts.push(r);`).join('\n');
    return `
// Brand kit: load the kit's fonts, then apply
(async function() {
  const __fonts = [];
  let r;
${loads}
  const out = await ${facade.replace(/^\/\/[^\n]*\n/, '').replace(/;\s*$/, '')};
  return __fonts.length && out && typeof out === 'object' ? { ...out, fonts: __fonts } : out;
})();`.trim();
  }

  generateComponent(input: ComponentInput): string {
    const ids = JSON.stringify(input.itemIds || []);
    switch (input.action) {
      case 'define':
        // defineComponent takes ITEMS, not ids — resolve through the registry
        // here so the tool can speak the id space every other tool speaks.
        return `
// Component: define
(function() {
  if (typeof app.defineComponent !== 'function') {
    return { success: false, error: 'app.defineComponent() unavailable — update PinePaper Studio.' };
  }
  const items = ${ids}.map((id) => app.itemRegistry.get(id)?.item).filter(Boolean);
  if (!items.length) return { success: false, error: 'no live items for the given ids' };
  const r = app.defineComponent(items, ${JSON.stringify({ name: input.name })});
  return { success: r.ok !== false, ...r };
})();`.trim();
      // A COMPONENT'S PARTS, BY THE KEY AN OVERRIDE NEEDS (round 9 II, 1.80).
      // Overrides are {componentKey: {prop: value}}, and the keys are generated
      // names (ck_12) — list gave only a count and instantiate returned a raw
      // Paper item with no id, so the component route to batch creative was
      // unusable. Both now return parts: each key with its part's type, name and
      // text, which is how a caller finds the headline's key.
      case 'list':
        return `
// Component: list, with each definition's parts
(function() {
  if (typeof app.listComponents !== 'function') return { success: false, error: 'app.listComponents() unavailable — update PinePaper Studio.' };
  const partsOf = function(root) {
    const out = [];
    const walk = function(n) { if (!n) return; if (n.data && n.data.componentKey) out.push(Object.assign({ key: n.data.componentKey, type: n.className }, typeof n.content === 'string' ? { content: n.content } : {}, n.name ? { name: n.name } : {})); (n.children || []).forEach(walk); };
    (root && root.children || []).forEach(walk);
    return out;
  };
  const defs = app._components;
  const components = app.listComponents().map(function(c) {
    let parts = null;
    try {
      const d = defs && typeof defs.get === 'function' ? defs.get(c.id) : null;
      if (d && d.json && typeof paper !== 'undefined') {
        const g = new paper.Group({ insert: false });
        g.importJSON(d.json);
        parts = partsOf(g.children.length === 1 && g.children[0].children ? g.children[0] : g);
        g.remove();
      }
    } catch (_) { /* parts unknown on this build */ }
    return Object.assign({}, c, parts ? { parts: parts } : {});
  });
  return { success: true, components: components, count: components.length };
})();`.trim();
      case 'instantiate':
        return `
// Component: instantiate — the instance id, and the keys its overrides use
(function() {
  if (typeof app.instantiateComponent !== 'function') return { success: false, error: 'app.instantiateComponent() unavailable — update PinePaper Studio.' };
  const r = app.instantiateComponent(${JSON.stringify(input.componentId || '')}, ${JSON.stringify({
    ...(input.position ? { position: input.position } : {}),
    ...(input.overrides ? { overrides: input.overrides } : {}),
  })});
  if (!r || r.ok === false) return { success: false, error: (r && r.error) || 'the component was not placed' };
  const parts = [];
  const walk = function(n) { if (!n) return; if (n.data && n.data.componentKey) parts.push(Object.assign({ key: n.data.componentKey, type: n.className }, typeof n.content === 'string' ? { content: n.content } : {}, n.name ? { name: n.name } : {})); (n.children || []).forEach(walk); };
  walk(r.item);
  return { success: true, instanceId: r.id, itemId: r.id, parts: parts, orphaned: r.orphaned || [],
    ...(r.orphaned && r.orphaned.length ? { warning: 'overrides for ' + r.orphaned.map(function(o) { return o.key; }).join(', ') + ' matched no part of this component and were not applied. parts lists the keys it has.' } : {}) };
})();`.trim();
      case 'set_override':
        return this._facadeCall('setComponentOverride',
          `${JSON.stringify(input.instanceId || '')}, ${JSON.stringify(input.componentKey || '')}, ${JSON.stringify(input.prop || '')}, ${JSON.stringify(input.value ?? null)}`,
          'Component: set override');
      case 'sync':
        return this._facadeCall('syncComponent', JSON.stringify(input.componentId || ''), 'Component: sync');
      case 'update_from_instance':
        return this._facadeCall('updateComponentFromInstance', JSON.stringify(input.instanceId || ''), 'Component: update from instance');
      case 'detach':
        return this._facadeCall('detachComponentInstance', JSON.stringify(input.instanceId || ''), 'Component: detach');
    }
  }

  generateArtboard(input: ArtboardInput): string {
    switch (input.action) {
      case 'list_presets':
        return this._facadeCall('listArtboardPresets', '', 'Artboard: list presets');
      case 'set': {
        const target = input.preset
          ? JSON.stringify(input.preset)
          : JSON.stringify({ width: input.width, height: input.height });
        return this._facadeCall('setArtboard', target, 'Artboard: set');
      }
      case 'set_constraints':
        return this._facadeCall('setItemConstraints',
          `${JSON.stringify(input.itemId || '')}, ${JSON.stringify({
            ...(input.horizontal ? { horizontal: input.horizontal } : {}),
            ...(input.vertical ? { vertical: input.vertical } : {}),
          })}`, 'Artboard: set constraints');
    }
  }

  generateComment(input: CommentInput): string {
    switch (input.action) {
      case 'add':
        return this._facadeCall('addComment', JSON.stringify({
          text: input.text,
          ...(input.author ? { author: input.author } : {}),
          ...(input.itemId ? { itemId: input.itemId } : {}),
          ...(input.x !== undefined ? { x: input.x } : {}),
          ...(input.y !== undefined ? { y: input.y } : {}),
          ...(input.time !== undefined ? { time: input.time } : {}),
        }), 'Comment: add');
      case 'list':
        return this._facadeCall('listComments', JSON.stringify({
          ...(input.time !== undefined ? { time: input.time } : {}),
          ...(input.includeResolved ? { includeResolved: true } : {}),
        }), 'Comment: list');
      case 'resolve':
        return this._facadeCall('resolveComment',
          `${JSON.stringify(input.id || '')}, ${input.resolved === false ? 'false' : 'true'}`, 'Comment: resolve');
      case 'delete':
        return this._facadeCall('deleteComment', JSON.stringify(input.id || ''), 'Comment: delete');
    }
  }

  generateProvenance(input: ProvenanceInput): string {
    const id = JSON.stringify(input.itemId);
    switch (input.action) {
      case 'get': return this._facadeCall('getItemProvenance', id, 'Provenance: get');
      case 'lineage': return this._facadeCall('getLineage', id, 'Provenance: lineage');
      case 'dependents': return this._facadeCall('getDependents', id, 'Provenance: dependents');
      case 'record':
        return this._facadeCall('recordLineage',
          `${id}, ${JSON.stringify(input.kind || 'derived')}, ${JSON.stringify(input.sourceRef || '')}, ${JSON.stringify(input.meta || {})}`,
          'Provenance: record lineage');
    }
  }

  generateCompose(input: ComposeInput): string {
    switch (input.action) {
      case 'list_patterns':
        return this._facadeCall('listCollagePatterns', '', 'Compose: list patterns');
      case 'list_treatments':
        return this._facadeCall('listCameraTreatments', '', 'Compose: list treatments');
      case 'list_reveals':
        return this._facadeCall('listReveals', '', 'Compose: list reveals');
      case 'list_styles':
        return this._facadeCall('listStyles', '', 'Compose: list styles');
      case 'set_treatment':
        return this._facadeCall('setCollageTreatment',
          `${JSON.stringify(input.rootId || '')}, ${JSON.stringify(input.treatment || '')}, ${JSON.stringify({ ...(input.loop ? { loop: true } : {}) })}`,
          'Compose: set treatment');
      case 'apply':
      default:
        // Forward the WHOLE surface. The first version forwarded only
        // treatment/camera/loop/craft — the temporal (reveal), style, text,
        // vector and audio halves of composeCollage were unreachable through
        // MCP, so agents converged on the four static patterns the description
        // happened to name. A capability gap reads as model bias from outside.
        return this._facadeCall('composeCollage',
          `${JSON.stringify(input.pattern || '')}, ${JSON.stringify(input.itemIds || [])}, ${JSON.stringify({
            ...(input.treatment ? { treatment: input.treatment } : {}),
            ...(input.applyCamera === false ? { applyCamera: false } : {}),
            ...(input.loop ? { loop: true } : {}),
            ...(input.craft ? { craft: input.craft } : {}),
            ...(input.reveal !== undefined ? { reveal: input.reveal } : {}),
            ...(input.revealOptions ? { revealOptions: input.revealOptions } : {}),
            ...(input.style ? { style: input.style } : {}),
            ...(input.text ? { text: input.text } : {}),
            ...(input.assets ? { assets: input.assets } : {}),
            ...(input.audio ? { audio: input.audio } : {}),
            ...(input.grid ? { grid: true } : {}),
            // The design axes. A register resolves the craft (gutter, margin,
            // hue budget, type scale); a medium says what makes the marks and
            // is REFUSED when a composition cannot be rendered in it.
            ...(input.register ? { register: input.register } : {}),
            ...(input.level !== undefined ? { level: input.level } : {}),
            ...(input.medium ? { medium: input.medium } : {}),
            ...(input.stitch ? { stitch: input.stitch } : {}),
            ...(input.stitchBudget !== undefined ? { stitchBudget: input.stitchBudget } : {}),
          })}`, 'Compose: apply pattern');
    }
  }

  generateAudioBeats(input: AudioBeatsInput): string {
    // UPLOADED MEDIA IS THE AUDIO A CALLER HAS, AND IT WAS NOT A SOURCE.
    //
    // analyzeAudio treats a bare id as a storage asset and wants its data as a
    // string, so the id or registryId that upload_audio returned gave "could not
    // decode audio" — while the detector itself is accurate (3.4 ms mean error,
    // measured). An uploaded clip's player already holds its bytes at a blob:
    // URL, which analyzeAudio does accept; either id resolves to that here.
    // Anything else (asset id, data:, URL) passes through untouched.
    // @engine-methods analyzeAudio animateToBeat
    const resolveSource = `  let __src = ${JSON.stringify(input.source || '')};
  const __A = (typeof window !== 'undefined') && window.PinePaperAgent;
  const __m = (__src && __A && typeof __A.listMedia === 'function')
    ? __A.listMedia().find(function(x) { return x.id === __src || x.registryId === __src; })
    : null;
  if (__m) {
    const layer = __m.kind === 'video' ? app.videoLayer && app.videoLayer.videos : app.audioLayer && app.audioLayer.audios;
    const raster = layer && typeof layer.get === 'function' ? layer.get(__m.id) : null;
    if (!raster || !raster.url) {
      return { success: false, error: 'uploaded media ' + JSON.stringify(__src) + ' has no playable source to analyse in this studio.' };
    }
    __src = raster.url;
  }`;
    const call = (method: string, args: string, label: string) => `
// ${label}
(async function() {
  if (typeof app.${method} !== 'function') {
    return { success: false, error: 'app.${method}() unavailable — update PinePaper Studio to a build that has it.' };
  }
${resolveSource}
  const r = await app.${method}(${args});
  if (r && typeof r === 'object' && 'ok' in r) {
    return { success: r.ok !== false, ...r };
  }
  return { success: true, result: r };
})();`.trim();

    if (input.action === 'analyze') {
      return call('analyzeAudio',
        `__src, ${JSON.stringify({
          ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
          ...(input.minGap !== undefined ? { minGap: input.minGap } : {}),
        })}`, 'Audio: analyze beats');
    }
    const opts = JSON.stringify({
      ...(input.beats ? { beats: input.beats } : {}),
      ...(input.grid ? { grid: true } : {}),
      ...(input.property ? { property: input.property } : {}),
      ...(input.base !== undefined ? { base: input.base } : {}),
      ...(input.accent !== undefined ? { accent: input.accent } : {}),
      ...(input.decay !== undefined ? { decay: input.decay } : {}),
      ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
    });
    return call('animateToBeat',
      `${JSON.stringify(input.itemId || '')}, Object.assign(${opts}, __src ? { source: __src } : {})`,
      'Audio: animate to beat');
  }

  generateTemplateParams(input: TemplateParamsInput): string {
    if (input.action === 'get') {
      return this._facadeCall('getTemplateParams', JSON.stringify(input.templateId), 'Template params: get');
    }
    // AN UNDECLARED PARAM CHANGED NOTHING, AND THE CALL SAID SUCCESS.
    // apply {templateId:'sale-announcement', params:{headline, date}} loaded
    // the template, left its text untouched, and answered success:true — and 0
    // of 195 templates declare any params (round 7 Z, 1.52). The template's own
    // declaration is read first and anything outside it is named in the result;
    // the template still loads, because the caller did ask for it.
    // @engine-methods getTemplateParams applyTemplateWithParams
    const params = input.params || {};
    return `
// Template params: apply, naming params the template does not declare
(async function() {
  if (typeof app.applyTemplateWithParams !== 'function') {
    return { success: false, error: 'app.applyTemplateWithParams() unavailable — update PinePaper Studio to a build that has it.' };
  }
  const given = ${JSON.stringify(Object.keys(params))};
  let declared = null;
  if (typeof app.getTemplateParams === 'function') {
    try {
      const d = await app.getTemplateParams(${JSON.stringify(input.templateId)});
      if (d && Array.isArray(d.params)) declared = d.params.map(function(p) { return p && (p.name || p.key || p.id); }).filter(Boolean);
    } catch (_) { /* reported as unknown below */ }
  }
  const r = await app.applyTemplateWithParams(${JSON.stringify(input.templateId)}, ${JSON.stringify(params)});
  const out = (r && typeof r === 'object' && 'ok' in r) ? Object.assign({ success: r.ok !== false }, r)
    : { success: r !== false, templateId: ${JSON.stringify(input.templateId)} };
  if (given.length && declared) {
    const ignored = given.filter(function(k) { return declared.indexOf(k) === -1; });
    if (ignored.length) {
      out.ignoredParams = ignored;
      out.declaredParams = declared;
      out.warning = declared.length === 0
        ? 'this template declares no parameters, so ' + ignored.join(', ') + ' changed nothing — the template loaded as designed. Edit its text items with pinepaper_modify_item instead.'
        : ignored.join(', ') + ' ' + (ignored.length > 1 ? 'are' : 'is') + ' not declared by this template and changed nothing. It declares: ' + declared.join(', ') + '.';
    }
  } else if (given.length && !declared) {
    out.warning = 'could not read which parameters this template declares, so whether ' + given.join(', ') + ' applied is unverified.';
  }
  return out;
})();`.trim();
  }

  generateSceneDiff(input: SceneDiffInput): string {
    if (input.action === 'version') {
      return this._facadeCall('diffAgainstVersion', JSON.stringify(input.versionId || ''), 'Scene diff: vs version');
    }

    // "NO CHANGES" AND "THE SNAPSHOTS DO NOT REFLECT THE CANVAS" ARE DIFFERENT
    // ANSWERS.
    //
    // A pilot added six items and six tracks and was told nothing had changed,
    // with unchanged:0 — the tell, since a real "no changes" compares items and
    // finds them equal, so it can never report zero of everything.
    //
    // I FIRST DIAGNOSED THIS WRONG, and the wrong cause was in this file's
    // emitted error for one commit. I read that HistoryManager stores entries
    // as JSON strings and concluded diffScenes never parsed them. It does:
    // SceneDiff's asObject() JSON.parses a string at the extraction entry, and
    // fxtool-f2 verified it two ways — a stringified Paper tree diffs correctly,
    // and a live browser run on string-stored history returned real added ids.
    //
    // The actual cause was GeneratedCodeRunner writing its single history entry
    // only when items were CREATED, so a run that merely applied an effect, a
    // style or a keyframe track wrote none. The two entries in those histories
    // were both empty scenes, and two empty snapshots honestly diffed ARE "no
    // changes". Fixed in FxTool c95c1d72.
    //
    // The backstop stays, for a reason that outlives that fix: a snapshot pair
    // that does not reflect the canvas must never present as an affirmative
    // nothing-changed. HistoryManager's own _itemIdsOf states the rule —
    // "null means could not tell, never empty" — and this is the same rule at
    // the tool boundary. It no longer guesses WHY, because guessing why is
    // exactly what went wrong.
    return `
// Scene diff: what changed between two history states
(function() {
  if (typeof app.diffHistoryStates !== 'function') {
    return { success: false, error: 'app.diffHistoryStates unavailable — update PinePaper Studio.' };
  }
  const d = app.diffHistoryStates(${input.indexA ?? 0}, ${input.indexB ?? 0});
  if (!d || d.ok === false) {
    return { success: false, error: (d && (d.error || d.reason)) || 'the diff refused without saying why' };
  }
  const saw = (d.added || []).length + (d.removed || []).length + (d.changed || []).length + (d.unchanged || 0);
  const live = (app.itemRegistry && typeof app.itemRegistry.getAll === 'function')
    ? (app.itemRegistry.getAll() || []).length
    : 0;
  if (saw === 0 && live > 0) {
    return {
      success: false,
      error: 'the diff read NO items from either history state while the canvas holds ' + live
        + ' — so those snapshots do not reflect this canvas, which is not the same as "nothing changed". '
        + 'The usual cause is that no history entry was written for the changes you made: some studio builds '
        + 'snapshot only when items are CREATED, so applying an effect, a style or a keyframe track records nothing. '
        + 'Compare with pinepaper_get_items before and after instead, or use action "version".',
      liveItems: live,
      raw: d,
    };
  }
  return { success: true, ...d };
})();`.trim();
  }

  generateTransform(input: TransformInput): string {
    switch (input.action) {
      case 'fit': {
        const mode = input.mode || 'contain';
        return `
// Fit item to the export frame (${mode})
(function() {
  // Route through the agent facade, not app.fitToFrame directly: an agent that
  // just called upload_video holds a MEDIA id (vraster_…), which is a different
  // id space from canvas item ids. PinePaperAgent.fitToFrame resolves either.
  const A = (typeof window !== 'undefined') && window.PinePaperAgent;
  if (A && typeof A.fitToFrame === 'function') {
    const ok = A.fitToFrame(${JSON.stringify(input.itemId || '')}, '${mode}');
    return ok
      ? { success: true, action: 'fit', itemId: '${input.itemId}', mode: '${mode}' }
      : { success: false, error: 'Item not found or not fittable: ${input.itemId}' };
  }
  if (typeof app.fitToFrame !== 'function') {
    return { success: false, error: 'fitToFrame unavailable — update FxTool' };
  }
  const ok = app.fitToFrame(${JSON.stringify(input.itemId || '')}, '${mode}');
  return ok
    ? { success: true, action: 'fit', itemId: '${input.itemId}', mode: '${mode}' }
    : { success: false, error: 'Item not found: ${input.itemId}' };
})();`.trim();
      }
      case 'nudge': {
        const dx = input.dx ?? 0;
        const dy = input.dy ?? 0;
        return `
// Nudge item position
(function() {
  const entry = app.itemRegistry.get(${JSON.stringify(input.itemId || '')});
  if (!entry || !entry.item) return { error: 'Item not found: ${input.itemId}' };
  entry.item.position.x += ${dx};
  entry.item.position.y += ${dy};
  return { success: true, action: 'nudge', itemId: '${input.itemId}', dx: ${dx}, dy: ${dy}, position: { x: entry.item.position.x, y: entry.item.position.y } };
})();`.trim();
      }
      case 'flip': {
        const dir = input.direction || 'horizontal';
        return `
// Flip item ${dir}ly
(function() {
  const entry = app.itemRegistry.get(${JSON.stringify(input.itemId || '')});
  if (!entry || !entry.item) return { error: 'Item not found: ${input.itemId}' };
  ${dir === 'horizontal' ? 'entry.item.scale(-1, 1);' : 'entry.item.scale(1, -1);'}
  return { success: true, action: 'flip', itemId: '${input.itemId}', direction: '${dir}' };
})();`.trim();
      }
      case 'reorder': {
        const order = input.order || 'bringToFront';
        const methodMap: Record<string, string> = {
          bringToFront: 'bringToFront',
          sendToBack: 'sendToBack',
          moveUp: 'moveAbove',
          moveDown: 'moveBelow',
        };
        const method = methodMap[order] || 'bringToFront';
        const needsSibling = order === 'moveUp' || order === 'moveDown';
        if (needsSibling) {
          const siblingExpr = order === 'moveUp' ? 'entry.item.nextSibling' : 'entry.item.previousSibling';
          return `
// Reorder item: ${order}
(function() {
  const entry = app.itemRegistry.get(${JSON.stringify(input.itemId || '')});
  if (!entry || !entry.item) return { error: 'Item not found: ${input.itemId}' };
  const sibling = ${siblingExpr};
  if (sibling) entry.item.${method}(sibling);
  return { success: true, action: 'reorder', itemId: '${input.itemId}', order: '${order}' };
})();`.trim();
        }
        return `
// Reorder item: ${order}
(function() {
  const entry = app.itemRegistry.get(${JSON.stringify(input.itemId || '')});
  if (!entry || !entry.item) return { error: 'Item not found: ${input.itemId}' };
  entry.item.${method}();
  return { success: true, action: 'reorder', itemId: '${input.itemId}', order: '${order}' };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown transform action: ${(input as any).action}' }; })();`;
    }
  }

  generateHistory(input: HistoryInput): string {
    const guard = `if (!app.historyManager) return { error: 'HistoryManager not available' };`;
    switch (input.action) {
      case 'undo':
        return `
// Undo last action
(function() {
  ${guard}
  app.historyManager.undo();
  return { success: true, action: 'undo' };
})();`.trim();
      case 'redo':
        return `
// Redo last undone action
(function() {
  ${guard}
  app.historyManager.redo();
  return { success: true, action: 'redo' };
})();`.trim();
      case 'get_state':
        return `
// Get history state
(function() {
  ${guard}
  const state = app.historyManager.getInfo();
  return { success: true, action: 'get_state', ...state };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown history action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // IMAGE PROCESSING
  // ===========================================================================

  generateImageFilter(input: ImageFilterInput): string {
    // BLUR TAKES `radius`, AND THIS TOOL'S OWN EXAMPLE SAID `amount`.
    //
    // FilterSystem's blur reads params.radius and does Math.floor(undefined) =
    // NaN, which passes its own `radius <= 0` guard and then blurs by nothing.
    // So {amount: 18} was accepted, ran, and changed no pixels — while the
    // schema example told callers to write exactly that. The example is fixed;
    // the alias stays because the wrong spelling was documented and anyone who
    // followed it should not have to discover the difference twice.
    //
    // BLUR ONLY. grain, bloom, chromaticAberration, displace, datamosh and
    // paletteMap all read a real `amount`; renaming it for them would turn a
    // working call into the same silent no-op this alias exists to prevent.
    const blurAlias = (name: string | undefined, params: Record<string, unknown> | undefined) => {
      const out: Record<string, unknown> = { ...(params ?? {}) };
      if (name === 'blur' && out.amount !== undefined && out.radius === undefined) {
        out.radius = out.amount;
        delete out.amount;
      }
      return out;
    };
    const filterParams = blurAlias(input.filterName, input.params as Record<string, unknown> | undefined);
    const chainFilters = (input.filters || []).map((f) => ({ ...f, params: blurAlias(f.name, f.params as Record<string, unknown> | undefined) }));
    // Resolve the raster from the registry id (unwrapping groups when the
    // build has the _resolveRaster helper), then use the real GPU-filter
    // facades. The previous emitter called app.imageTools.applyFilter, a
    // method that never existed — the tool errored on every use.
    const resolve = `  const item = (typeof app._resolveRaster === 'function')
    ? app._resolveRaster(${JSON.stringify(input.itemId)})
    : (app.itemRegistry ? app.itemRegistry.getItem(${JSON.stringify(input.itemId)}) : null);
  if (!item) return { error: 'Item not found or not a raster: ' + ${JSON.stringify(input.itemId)} };
  if (typeof app.applyImageFilter !== 'function') return { error: 'GPU image filters unavailable — update FxTool' };`;
    switch (input.action) {
      case 'apply':
        return `
// Apply image filter
(async function() {
${resolve}
  try {
    const r = await app.applyImageFilter(item, ${JSON.stringify(input.filterName || '')}, ${JSON.stringify(filterParams)});
    // applyImageFilter THROWS for a missing raster and answers the item
    // otherwise; a falsy answer is a refusal it did not raise.
    if (r === false || r === null) {
      return { success: false, action: 'apply', itemId: ${JSON.stringify(input.itemId)},
        error: 'the filter did not apply — ${input.filterName || ''} may not be available on this studio.' };
    }
    return { success: true, action: 'apply', itemId: ${JSON.stringify(input.itemId)}, filter: ${JSON.stringify(input.filterName || '')} };
  } catch (e) {
    return { error: 'Failed to apply filter: ' + e.message };
  }
})();`.trim();
      case 'chain':
        return `
// Apply filter chain
(async function() {
${resolve}
  try {
    const filters = ${JSON.stringify(chainFilters)};
    await app.applyImageFilterChain(item, filters);
    return { success: true, action: 'chain', itemId: ${JSON.stringify(input.itemId)}, filterCount: filters.length };
  } catch (e) {
    return { error: 'Failed to apply filter chain: ' + e.message };
  }
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown image_filter action: ${(input as any).action}' }; })();`;
case 'analyze_palette':
        return `
// Analyze palette: the dominant colours, largest area first (GPU path)
(async function() {
  if (typeof app.analyzePalette !== 'function') { return { success: false, error: 'app.analyzePalette unavailable — update FxTool to a palette-capable build' }; }
  try {
    const r = await app.analyzePalette(${JSON.stringify(input.itemId)}, ${JSON.stringify({ ...(input.maxSwatches !== undefined ? { maxSwatches: input.maxSwatches } : {}) })});
    // swatches: [{hex, share, …}] largest-first — feed hex values straight into
    // recolor_palette mapping or the paletteMap filter's swatches[].
    return { success: true, width: r.width, height: r.height, opaquePixels: r.opaquePixels, swatches: r.swatches };
  } catch (e) {
    return { success: false, error: e && e.message ? e.message : String(e) };
  }
})();`.trim();
      case 'recolor_palette':
        return `
// Recolor palette: swap colours, keep the shading (GPU path)
(async function() {
  if (typeof app.recolorPalette !== 'function') { return { success: false, error: 'app.recolorPalette unavailable — update FxTool to a palette-capable build' }; }
  try {
    await app.recolorPalette(${JSON.stringify(input.itemId)}, ${JSON.stringify(input.mapping)}, ${JSON.stringify({ ...(input.amount !== undefined ? { amount: input.amount } : {}), ...(input.preserveShading !== undefined ? { preserveShading: input.preserveShading } : {}) })});
    return { success: true, action: 'recolor_palette', itemId: ${JSON.stringify(input.itemId)} };
  } catch (e) {
    return { success: false, error: e && e.message ? e.message : String(e) };
  }
})();`.trim();
    }
  }

  generateLasso(input: LassoInput): string {
    // LASSO IS A MOUSE TOOL. IT HAS NO HEADLESS FORM.
    //
    // These called app.imageTools.activateLasso and .applyLasso, neither of
    // which exists — imageTools is an ImageToolsManager and the lasso lives on
    // app.lassoTool. `activate` is real there, but the extraction is driven by
    // startStroke / continueStroke / endStroke: a freehand path the USER draws.
    // There is no applyLasso to finish it, so wiring activate alone would leave
    // a caller in a mode it cannot get out of or complete.
    //
    // Refused by name, with the tools that do the same job without a pointer.
    const why = 'activate / apply drive the interactive, mouse-based lasso. Use action "cut" with itemId and points (a polygon in canvas coordinates) — it drives the same lasso headlessly. '
      + 'To cut a region without a pointer, use pinepaper_extract_object (detects and extracts by description), '
      + 'or pinepaper_cutout_style / the mask actions on pinepaper_image_tools to shape an existing raster.';
    switch (input.action) {
      case 'cut': {
        // A POLYGON CUT, DRIVEN THROUGH THE LASSO'S OWN CLICK PATH (round 7 X,
        // 1.55). The interactive tool has no headless form, but its polygon
        // mode is click-by-click: startStroke/endStroke at a point adds a vertex,
        // and a click within 12 px of the first vertex closes the shape. That is
        // public API, so this drives it exactly as a user would, then applies.
        //
        // applyLasso DELETES the image it cut from ("chosen behaviour" in the
        // editor). Over MCP that removed the photo a parallax needs underneath,
        // silently. keepOriginal (default) cuts from a temporary clone, which is
        // what gets consumed; the result says which happened.
        const pts = (input.points ?? []).map((p) => (Array.isArray(p) ? { x: p[0], y: p[1] } : p));
        if (!input.itemId) return `({ success: false, action: 'cut', error: 'cut needs itemId — the image to cut from.' });`;
        if (pts.length < 3) return `({ success: false, action: 'cut', error: 'cut needs at least 3 points (canvas coordinates) around the region.' });`;
        const keep = input.keepOriginal !== false;
        return `
// Lasso cut along a polygon
(async function() {
  const L = app.lassoTool;
  if (!L || typeof L.activate !== 'function' || typeof L.applyLasso !== 'function') {
    return { success: false, action: 'cut', error: 'app.lassoTool unavailable — update PinePaper Studio.' };
  }
  const entry = app.itemRegistry && app.itemRegistry.get(${JSON.stringify(input.itemId)});
  const original = entry && entry.item;
  if (!original) return { success: false, action: 'cut', error: 'no item ' + ${JSON.stringify(input.itemId)} };
  const target = ${keep} ? original.clone() : original;
  // A clone carries a COPY of data — including the registry id — and
  // applyLasso deletes by that id, which would take the original anyway.
  if (${keep} && target.data) {
    target.data = Object.assign({}, target.data);
    delete target.data.registryId; delete target.data.id;
  }
  const pts = ${JSON.stringify(pts)}.map(function(p) { return new paper.Point(p.x, p.y); });
  const first = pts[0];
  let skipped = 0;
  L.activate(target);
  // POLYGON MODE, SET — not assumed. On production the lasso's remembered mode
  // was 'freehand', where a click adds no vertex, so every cut was refused as
  // "did not close". The user's own mode is put back afterwards.
  const __prevMode = L._forcedMode;
  if (typeof L.setMode === 'function') L.setMode('polygon');
  try {
    L.startStroke(first); L.endStroke(first);
    for (let i = 1; i < pts.length; i++) {
      if (pts[i].getDistance(first) < 12) { skipped++; continue; }
      L.startStroke(pts[i]); L.endStroke(pts[i]);
    }
    L.startStroke(first); L.endStroke(first); // a click at the first vertex closes it
    if (!L.isDrawn()) {
      L.cancel();
      if (${keep}) target.remove();
      return { success: false, action: 'cut', error: 'the polygon did not close — it needs at least 3 vertices at least 12 px from the first one.', skipped: skipped };
    }
    const cutout = await L.applyLasso();
    if (!cutout) {
      if (${keep} && target.parent) target.remove();
      return { success: false, action: 'cut', error: 'the lasso produced no cutout — the item may not be an image.' };
    }
    let cutoutId = cutout.data && (cutout.data.registryId || cutout.data.id);
    if (!cutoutId && typeof app.registerItem === 'function') cutoutId = app.registerItem(cutout, 'image', { source: 'mcp-lasso' });
    return { success: true, action: 'cut', cutoutId: cutoutId, originalId: ${JSON.stringify(input.itemId)},
      originalKept: ${keep}, vertices: pts.length - skipped, skipped: skipped,
      bounds: { x: cutout.bounds.x, y: cutout.bounds.y, width: cutout.bounds.width, height: cutout.bounds.height } };
  } catch (e) {
    try { L.cancel(); } catch (_) { /* already down */ }
    if (${keep} && target && target.parent) target.remove();
    return { success: false, action: 'cut', error: (e && e.message) || String(e) };
  } finally {
    if (typeof L.setMode === 'function' && __prevMode) { try { L.setMode(__prevMode); } catch (_) { /* cosmetic */ } }
  }
})();`.trim();
      }
      case 'activate':
      case 'apply':
        return `
// Lasso — refused, rather than calling into a method that does not exist
({ success: false, action: ${JSON.stringify(input.action)}, error: ${JSON.stringify(why)} });`.trim();
      default:
        return `(function() { return { error: 'Unknown lasso action: ${(input as any).action}' }; })();`;
    }
  }

  generateCutoutStyle(input: CutoutStyleInput): string {
    // THE FACADE WAS THE WRONG ONE ENTIRELY.
    //
    // These called app.imageTools.applyCutoutStyle / .getCutoutStyles, and
    // neither exists anywhere in the engine — imageTools is an
    // ImageToolsManager and knows nothing about cutout presets. Reported from
    // production as "apply returns success:true with the error nested inside",
    // which is what awaiting a call on undefined inside a try looks like.
    //
    // The real surface is app.cutoutStyles (a CutoutStylePresets), with
    // applyPreset(item, name, options) and getPresets(). The parity guard
    // could not see this: readFacades resolved a class by CONVENTION —
    // imageTools -> ImageTools, which is not the class's name — so the facade
    // was never mapped, and an unmapped facade is not checked.
    const guard = `if (!app.cutoutStyles) return { success: false, error: 'cutout styles are unavailable on this studio (app.cutoutStyles is absent) — update PinePaper Studio.' };`;
    switch (input.action) {
      case 'apply':
        return `
// Apply cutout style
(async function() {
  ${guard}
  try {
    const target = app.getItemById && app.getItemById(${JSON.stringify(input.itemId || '')});
    if (!target) {
      return { success: false, action: 'apply', error: 'no item ' + ${JSON.stringify(input.itemId || '')} + ' — applyPreset takes a live item, so the id has to resolve first.' };
    }
    const result = await app.cutoutStyles.applyPreset(target, ${JSON.stringify(input.preset || '')}, ${JSON.stringify(input.options || {})});
    // An unknown preset returns the very item it was given, unchanged — so a
    // truthy result proves nothing. The engine records the refusal on it.
    const cutRej = result && result.data && result.data.cutoutStyleRejected;
    if (cutRej) {
      return { success: false, action: 'apply', itemId: ${JSON.stringify(input.itemId || '')}, error: 'Unknown cutout preset "' + cutRej.requested + '" — the item is UNCHANGED.', requested: cutRej.requested, known: cutRej.known };
    }
    return { success: true, action: 'apply', itemId: ${JSON.stringify(input.itemId || '')}, preset: ${JSON.stringify(input.preset || '')} };
  } catch (e) {
    return { error: 'Failed to apply cutout style: ' + e.message };
  }
})();`.trim();
      case 'list':
        return `
// List available cutout styles
(function() {
  ${guard}
  const styles = typeof app.getCutoutStylePresets === 'function'
    ? app.getCutoutStylePresets()
    : app.cutoutStyles.getPresets();
  return { success: true, action: 'list', styles };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown cutout_style action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // COMPOSITION & VIEW
  // ===========================================================================

  generatePrecomp(input: PrecompInput): string {
    switch (input.action) {
      case 'create': {
        const opts: Record<string, unknown> = {};
        if (input.name) opts.name = input.name;
        if (input.loop !== undefined) opts.loop = input.loop;
        if (input.duration !== undefined) opts.duration = input.duration;
        return `
// Create precomp from items
(function() {
  const itemIds = ${JSON.stringify(input.itemIds || [])};
  const opts = ${JSON.stringify(opts)};

  // createPrecomp wants LIVE ITEMS. Handing it registry ids put strings into
  // Paper.js's insertChildren, which fails as "l._remove is not a function" —
  // a minified internal, from a schema that promises ids work. Resolved here,
  // and a missing one is named rather than silently dropped from the group.
  const items = [];
  const missing = [];
  for (const id of itemIds) {
    const item = app.getItemById(id);
    if (item) items.push(item); else missing.push(id);
  }
  if (missing.length) return { success: false, error: 'precomp: no such item(s): ' + missing.join(', ') };
  if (!items.length) return { success: false, error: 'precomp needs at least one item' };

  const precomp = app.createPrecomp(items, opts);
  if (!precomp) return { success: false, error: 'createPrecomp returned nothing' };
  // STRINGIFIED, because the schema declares precompId as a string and the
  // engine mints a NUMBER. Returning the number meant the id could not be
  // round-tripped: pass it back to add/remove and zod rejects it before the
  // call is made.
  const _pid = precomp && precomp.id !== undefined ? precomp.id : precomp;
  return { success: true, action: 'create', precompId: String(_pid), itemCount: items.length, name: ${JSON.stringify(input.name || '')} };
})();`.trim();
      }
      case 'add':
        return `
// Add item to precomp
(function() {
  // addToPrecomp answers falsy when the precomp or the item is not found, and
  // this reported success regardless — the same silent-success shape as an
  // unknown itemId elsewhere.
  const _ok = app.addToPrecomp(${JSON.stringify(input.precompId || '')}, ${JSON.stringify(input.itemId || '')});
  if (_ok === false || _ok === null || _ok === undefined) {
    return { success: false, action: 'add', error: 'nothing was added — check the precompId (create returns it as a string) and the itemId with pinepaper_get_items.' };
  }
  return { success: true, action: 'add', precompId: ${JSON.stringify(input.precompId || '')}, itemId: ${JSON.stringify(input.itemId || '')} };
})();`.trim();
      case 'remove':
        return `
// Remove item from precomp
(function() {
  app.removeFromPrecomp(${JSON.stringify(input.precompId || '')}, ${JSON.stringify(input.itemId || '')});
  return { success: true, action: 'remove', precompId: ${JSON.stringify(input.precompId || '')}, itemId: ${JSON.stringify(input.itemId || '')} };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown precomp action: ${(input as any).action}' }; })();`;
    }
  }

  generateBackground(input: BackgroundInput): string {
    switch (input.action) {
      case 'set': {
        const mode = input.mode || 'color';
        if (mode === 'generator') {
          return `
// Set background via generator
(async function() {
  try {
    await app.executeGenerator(${JSON.stringify(input.generator || '')}, ${JSON.stringify(input.generatorParams || {})});
    return { success: true, action: 'set', mode: 'generator', generator: ${JSON.stringify(input.generator || '')} };
  } catch (e) {
    return { error: 'Failed to set generator background: ' + e.message };
  }
})();`.trim();
        }
        if (mode === 'pattern') {
          return `
// Set background pattern
(function() {
  app.setBackgroundPattern(${JSON.stringify(input.pattern || '')});
  return { success: true, action: 'set', mode: 'pattern', pattern: ${JSON.stringify(input.pattern || '')} };
})();`.trim();
        }
        // default: color
        return `
// Set background color
(function() {
  app.setBackgroundColor(${JSON.stringify(input.color || '#ffffff')});
  return { success: true, action: 'set', mode: 'color', color: ${JSON.stringify(input.color || '#ffffff')} };
})();`.trim();
      }
      case 'clear':
        return `
// Clear background
(function() {
  app.clearBackground();
  return { success: true, action: 'clear' };
})();`.trim();
      case 'get':
        return `
// Get background info
(function() {
  // FxTool exposes getBackgroundMode() returning the mode string only.
  const mode = app.getBackgroundMode ? app.getBackgroundMode() : null;
  return { success: true, action: 'get', mode };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown background action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // CANVAS QUERIES
  // ===========================================================================

  generateQuery(input: QueryInput): string {
    switch (input.action) {
      case 'get_by_id':
        return `
// Get item details by ID
(function() {
  const entry = app.itemRegistry.get(${JSON.stringify(input.itemId || '')});
  if (!entry || !entry.item) return { error: 'Item not found: ${input.itemId}' };
  const item = entry.item;
  return {
    success: true, action: 'get_by_id',
    itemId: ${JSON.stringify(input.itemId || '')},
    type: item.data?.itemType || item.className,
    position: { x: item.position.x, y: item.position.y },
    bounds: item.bounds ? { x: item.bounds.x, y: item.bounds.y, width: item.bounds.width, height: item.bounds.height } : null,
    visible: item.visible,
    opacity: item.opacity,
    rotation: typeof app.authoredRotation === 'function' ? app.authoredRotation(item) : ((item.data?._bakedRotation || 0) + (item.rotation || 0)),
    selected: item.selected,
  };
})();`.trim();
      case 'hit_test': {
        const tolerance = input.tolerance ?? 5;
        const all = input.all ?? false;
        return `
// Hit test at point
(function() {
  const point = new paper.Point(${input.x ?? 0}, ${input.y ?? 0});
  ${all
    ? `const results = app.hitTestAll(point, { tolerance: ${tolerance} });
  const hits = results.map(r => ({
    itemId: r.item?.data?.itemId || r.item?.name || r.item?.id,
    type: r.item?.data?.itemType || r.item?.className,
    point: { x: r.point?.x, y: r.point?.y }
  }));
  return { success: true, action: 'hit_test', x: ${input.x ?? 0}, y: ${input.y ?? 0}, hits, count: hits.length };`
    : `const result = app.hitTest(point, { tolerance: ${tolerance} });
  if (!result) return { success: true, action: 'hit_test', x: ${input.x ?? 0}, y: ${input.y ?? 0}, hit: null };
  return {
    success: true, action: 'hit_test',
    x: ${input.x ?? 0}, y: ${input.y ?? 0},
    hit: { itemId: result.item?.data?.itemId || result.item?.name || result.item?.id, type: result.item?.data?.itemType || result.item?.className }
  };`}
})();`.trim();
      }
      case 'is_empty':
        return `
// Check if canvas is empty
(function() {
  const items = app.itemRegistry.getAll();
  return { success: true, action: 'is_empty', empty: items.length === 0, count: items.length };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown query action: ${(input as any).action}' }; })();`;
    }
  }

  generateQueryCapabilities(input: QueryCapabilitiesInput): string {
    const validated = QueryCapabilitiesInputSchema.parse(input);
    const S = (v: unknown) => JSON.stringify(v);
    // Warming is the engine's default and the honest answer, so the argument is
    // omitted unless the caller explicitly opted out — no reason to spend bytes
    // restating a default.
    const warmArg = validated.warm === undefined ? '' : S({ warm: validated.warm });
    return `
// Query capabilities / recommend treatments from the engine's LIVE registries.
//
// Reads app.getCapabilities(), which warms the lazily-constructed registries
// before answering and returns a coverage report saying what it read from.
// \`warm: false\` skips that and answers from whatever is already resident —
// cheaper, and the coverage report labels itself \`warmed: false\` when it does.
// This tool previously rebuilt that index itself, and because generatorRegistry
// is null until ensureHeavyModules() lands (~1.2s after boot) and the rigging /
// blending / deform relation rules only register when their subsystem is first
// touched, an early call reported ZERO generators and ~77 of ~100 relations as
// if that were the whole engine.
(async function() {
  const action = ${S(validated.action || 'list')};
  const kind = ${S(validated.kind)};
  const mood = ${S(validated.mood)};
  const subject = ${S(validated.subject)};
  const avoid = ${S(validated.avoid)};
  const seed = ${S(validated.seed)};
  const key = ${S(validated.key)};
  const exclude = ${S(validated.exclude)};

  // WHICH ENGINE METHODS THIS STUDIO HAS.
  //
  // Every tool guards the methods it needs and refuses by name without them,
  // which is right per call and useless in advance: an agent otherwise learns a
  // studio is too old one tool at a time. getCapabilities cannot answer this —
  // it reports the engine's VOCABULARY (styles, palettes, relations), not which
  // of its methods exist.
  //
  // The list is DERIVED from the emitters' own guards by
  // scripts/sync-engine-methods.mjs, so it cannot drift from what the tools
  // actually check. Required and optional are kept apart because an older
  // studio that degrades is not an unusable one.
  if (action === 'studio') {
    const required = ${S(REQUIRED_ENGINE_METHODS)};
    const optional = ${S(OPTIONAL_ENGINE_METHODS)};
    const has = (path) => {
      // Dotted paths: thirteen methods live behind a sub-facade
      // (exportEngine.exportToStore, mapSystem.worldTour).
      let node = app;
      for (const part of path.split('.')) {
        if (!node) return false;
        node = node[part];
      }
      return typeof node === 'function';
    };
    const missingRequired = required.filter((m) => !has(m));
    const missingOptional = optional.filter((m) => !has(m));
    return {
      success: true,
      studio: {
        requiredTotal: required.length,
        requiredPresent: required.length - missingRequired.length,
        missingRequired: missingRequired,
        optionalTotal: optional.length,
        missingOptional: missingOptional,
        // A studio missing nothing required can serve every tool this server
        // publishes. Missing something optional only narrows an answer.
        complete: missingRequired.length === 0,
      },
    };
  }

  // The registries getCapabilities does NOT aggregate. Each is a capability an
  // agent otherwise has to guess at, which by this project's rule is the same
  // as its not existing. Read one at a time and name a missing facade rather
  // than answering with an empty list, which would read as "none exist".
  if (action === 'catalogue') {
    const READERS = {
      rig_presets: 'listRigPresets', shader_effects: 'listShaderEffects',
      stroke_decorations: 'listStrokeDecorations', precomps: 'listPrecomps',
      images: 'listImages', segment_edit_kinds: 'listSegmentEditKinds',
      shatter_orders: 'listShatterOrders', world_meshes: 'listWorldMeshes',
      relation_presets: 'loadRelationPresets',
    };
    const want = ${S(validated.catalogue)};
    const fn = READERS[want];
    if (!fn) { return { success: false, error: 'unknown catalogue ' + JSON.stringify(want) + ' — try ' + Object.keys(READERS).join(', ') }; }
    if (typeof app[fn] !== 'function') { return { success: false, error: 'app.' + fn + ' unavailable — update FxTool' }; }
    const entries = await app[fn]();
    // loadRelationPresets answers {presets, rejected, source} rather than a bare
    // array, and REJECTED is the half worth surfacing: a preset this build
    // cannot use is a named absence, where dropping it silently would read as
    // the catalogue simply being smaller.
    if (entries && !Array.isArray(entries) && Array.isArray(entries.presets)) {
      return {
        success: true, catalogue: want, reader: 'app.' + fn,
        count: entries.presets.length, entries: entries.presets,
        rejected: entries.rejected || [], source: entries.source || null,
      };
    }
    return { success: true, catalogue: want, reader: 'app.' + fn, count: Array.isArray(entries) ? entries.length : undefined, entries: entries };
  }

  if (typeof app.getCapabilities !== 'function') {
    return { success: false, error: 'app.getCapabilities unavailable — update FxTool' };
  }

  let caps = [], report = null;
  try {
    const res = await app.getCapabilities(${warmArg});
    caps = (res && res.capabilities) || [];
    report = (res && res.coverage) || null;
  } catch (e) {
    return { success: false, error: 'Failed to inspect capabilities: ' + e.message };
  }

  if (action === 'coverage') {
    // The engine's own report: totals per kind, the entries that can be applied
    // but not RANKED (no label, no definition), the kinds with no source wired,
    // and which lazy registries were live when it answered.
    return { success: true, action: 'coverage', ...(report || {}), total: caps.length };
  }

  if (action === 'find') {
    if (!key) return { success: false, error: 'find action requires key' };
    const found = caps.find(c => c.key === String(key));
    return found ? { success: true, action: 'find', capability: found } : { success: false, error: 'Capability not found: ' + key };
  }

  let filtered = caps;
  if (kind) {
    const kinds = new Set(Array.isArray(kind) ? kind : [kind]);
    filtered = caps.filter(c => kinds.has(c.kind));
  }

  if (action === 'list') {
    return {
      success: true,
      action: 'list',
      count: filtered.length,
      total: caps.length,
      unwiredKinds: report ? report.unwiredKinds : undefined,
      capabilities: filtered.map(c => ({
        key: c.key, kind: c.kind, label: c.label,
        definition: c.definition, applyWith: c.applyWith, describable: c.describable
      }))
    };
  }

  if (action === 'choose') {
    const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'into', 'at', 'on', 'as', 'is', 'are', 'then', 'their', 'they', 'it', 'its', 'each', 'from', 'with', 'that', 'characters', 'character', 'letters', 'letter', 'text', 'frame', 'real']);
    const tokenize = (t) => String(t || '').toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
    const MOOD_TERMS = {
      reveal: ['resolve', 'resolves', 'reveal', 'appear', 'emerge', 'decode', 'decrypt', 'unscramble', 'form', 'assemble', 'converge'],
      triumphant: ['burst', 'launch', 'firework', 'bloom', 'spark', 'explode', 'shine', 'glow', 'celebrate', 'rise'],
      failure: ['crumble', 'fall', 'collapse', 'burn', 'decay', 'dissolve', 'break', 'shatter', 'sink', 'error', 'corrupt'],
      calm: ['drift', 'float', 'gentle', 'slow', 'settle', 'fade', 'wave', 'ripple', 'pour'],
      technical: ['binary', 'matrix', 'grid', 'scan', 'code', 'digital', 'circuit', 'data', 'print', 'terminal'],
      energetic: ['bounce', 'swarm', 'spray', 'shoot', 'fast', 'rapid', 'scatter', 'slam', 'volley']
    };

    // Deterministic tiebreak. Equal-scoring candidates used to fall out in
    // array order, which made \`seed\` — documented as giving reproducible
    // selection — do nothing at all. FNV-1a over seed+key gives a stable
    // shuffle per seed; with no seed the order is stable by key, so a repeated
    // call still answers the same way.
    const tiebreak = (k) => {
      if (!seed) return null;
      let h = 2166136261;
      const s = String(seed) + '|' + k;
      for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
      return h >>> 0;
    };

    const exSet = new Set(Array.isArray(exclude) ? exclude : []);
    const scored = filtered.filter(c => !exSet.has(c.key)).map(c => {
      const words = new Set(tokenize(c.text || (c.label + ' ' + c.definition)));
      if (!words.size) return { item: c, score: 0 };
      let score = 0;
      const moods = Array.isArray(mood) ? mood : (mood ? [mood] : []);
      for (const m of moods) {
        for (const term of (MOOD_TERMS[m] || [])) { if (words.has(term)) score += 12; }
      }
      for (const w of tokenize(subject)) { if (words.has(w)) score += 7; }
      for (const av of (Array.isArray(avoid) ? avoid : (avoid ? [avoid] : []))) {
        for (const term of (MOOD_TERMS[av] || [])) { if (words.has(term)) score -= 10; }
      }
      return { item: c, score };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const ha = tiebreak(a.item.key), hb = tiebreak(b.item.key);
      if (ha !== null && ha !== hb) return ha - hb;
      return a.item.key.localeCompare(b.item.key);
    });
    const top = scored.slice(0, 5).map(s => ({ ...s.item, score: s.score }));
    return {
      success: true,
      action: 'choose',
      recommendation: top[0] || null,
      topCandidates: top,
      // A chooser scores on description, so entries without one can never be
      // recommended. Saying so beats silently never offering them.
      unrankable: report ? report.unrankable : undefined
    };
  }

  return { success: false, error: 'Unknown capabilities action: ' + action };
})();
`.trim();
  }

  // ===========================================================================
  // DEFORMATION
  // ===========================================================================

  generateDeform(input: DeformInput): string {
    const guard = `if (!app.deformPresets) return { error: 'DeformPresets not available' };`;
    switch (input.action) {
      case 'apply': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for deform apply' }; })();`;
        if (!input.preset) return `(function() { return { error: 'preset is required for deform apply' }; })();`;
        const params: Record<string, unknown> = {};
        if (input.frequency !== undefined) params.frequency = input.frequency;
        if (input.amplitude !== undefined) params.amplitude = input.amplitude;
        if (input.phase) params.phase = input.phase;
        if (input.loop !== undefined) params.loop = input.loop;
        if (input.axis) params.axis = input.axis;
        if (input.turns !== undefined) params.turns = input.turns;
        if (input.waves !== undefined) params.waves = input.waves;
        if (input.maxDisplacement !== undefined) params.maxDisplacement = input.maxDisplacement;
        if (input.speed !== undefined) params.speed = input.speed;
        if (input.steps !== undefined) params.steps = input.steps;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Apply deformation preset
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  app.deformPresets.apply(entry.item, '${input.preset}', ${JSON.stringify(params)});
  return { success: true, action: 'apply', itemId: ${itemIdStr}, preset: '${input.preset}' };
})();`.trim();
      }
      case 'trigger': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for deform trigger' }; })();`;
        if (!input.preset) return `(function() { return { error: 'preset is required for deform trigger' }; })();`;
        const params: Record<string, unknown> = {};
        if (input.amplitude !== undefined) params.amplitude = input.amplitude;
        if (input.speed !== undefined) params.speed = input.speed;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Trigger one-shot deformation
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  app.deformPresets.trigger(entry.item, '${input.preset}', ${JSON.stringify(params)});
  return { success: true, action: 'trigger', itemId: ${itemIdStr}, preset: '${input.preset}' };
})();`.trim();
      }
      case 'remove': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for deform remove' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Remove deformation and restore geometry
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  app.deformPresets.remove(entry.item);
  return { success: true, action: 'remove', itemId: ${itemIdStr} };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown deform action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // SPRITE SHEETS
  // ===========================================================================

  generateSpriteSheet(input: SpriteSheetInput): string {
    // spriteSystem is _defineLazyHeavy: undefined until ensureHeavyModules()
    // lands, so the bare guard reported "not available" on a fresh session for
    // a studio that has it. Same bug as app.exportEngine in 1.6.9.
    const guard = `if (!app.spriteSystem && typeof app.ensureHeavyModules === 'function') { try { await app.ensureHeavyModules(); } catch (_) {} }
if (!app.spriteSystem) return { error: 'SpriteSheetSystem not available' };`;
    switch (input.action) {
      case 'generate': {
        const opts: Record<string, unknown> = {};
        if (input.poses) opts.poses = input.poses;
        if (input.transition) opts.transition = input.transition;
        if (input.bakedAnimation) opts.bakedAnimation = input.bakedAnimation;
        if (input.animations) opts.animations = input.animations;
        if (input.padding !== undefined) opts.padding = input.padding;
        if (input.name) opts.name = input.name;
        return `
// Generate sprite sheet from skeleton
(async function() {
  ${guard}
  const sheet = await app.generateSpriteSheet(${JSON.stringify(input.skeletonId || '')}, ${JSON.stringify(opts)});
  return { success: true, action: 'generate', spriteSheetId: sheet.id, name: sheet.name, width: sheet.atlasWidth, height: sheet.atlasHeight, frameCount: sheet.frames?.size ?? sheet.frames?.length ?? 0 };
})();`.trim();
      }
      case 'play': {
        const opts: Record<string, unknown> = {};
        if (input.x !== undefined) opts.x = input.x;
        if (input.y !== undefined) opts.y = input.y;
        if (input.animation) opts.animation = input.animation;
        if (input.fps !== undefined) opts.fps = input.fps;
        if (input.scale !== undefined) opts.scale = input.scale;
        return `
// Play sprite sheet animation
(async function() {
  ${guard}
  const player = await app.playSpriteSheet(${JSON.stringify(input.spriteSheetId || '')}, ${JSON.stringify(opts)});
  return { success: true, action: 'play', playerId: player.id };
})();`.trim();
      }
      case 'export':
        return `
// Export sprite sheet
(async function() {
  ${guard}
  const result = await app.exportSpriteSheet(${JSON.stringify(input.spriteSheetId || '')}, { format: '${input.format || 'png'}', download: true, includeMetadata: true });
  return { success: true, action: 'export', format: '${input.format || 'png'}' };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown sprite sheet action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // INTERACTION
  // ===========================================================================

  generateInteraction(input: InteractionInput): string {
    const guard = `if (!app.interactionSystem) return { error: 'InteractionSystem not available' };`;
    switch (input.action) {
      case 'add_behavior': {
        const itemIdStr = JSON.stringify(input.itemId || '');
        const params = JSON.stringify(input.params || {});
        return `
// Add behavior to item
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  const behaviorId = app.interactionSystem.addContinuousBehavior(entry.item, '${input.behaviorType}', ${params});
  return { success: true, action: 'add_behavior', itemId: ${itemIdStr}, behaviorType: '${input.behaviorType}', behaviorId };
})();`.trim();
      }
      case 'remove_behavior': {
        const itemIdStr = JSON.stringify(input.itemId || '');
        const behaviorIdStr = JSON.stringify(input.behaviorId || '');
        return `
// Remove behavior from item
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  app.interactionSystem.removeContinuousBehavior(entry.item, ${behaviorIdStr});
  return { success: true, action: 'remove_behavior', itemId: ${itemIdStr}, behaviorId: ${behaviorIdStr} };
})();`.trim();
      }
      case 'trigger_action': {
        const params = JSON.stringify(input.params || {});
        return `
// Trigger interaction action
(function() {
  ${guard}
  app.interactionSystem.executeAction('${input.actionType}', ${params});
  return { success: true, action: 'trigger_action', actionType: '${input.actionType}' };
})();`.trim();
      }
      case 'get_state':
        return `
// Get interaction state
(function() {
  ${guard}
  const state = app.interactionSystem.getState ? app.interactionSystem.getState() : {};
  return { success: true, action: 'get_state', ...state };
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown interaction action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // WIDGET EXPORT
  // ===========================================================================

  generateExportWidget(input: ExportWidgetInput): string {
    const opts: Record<string, unknown> = {};
    if (input.download !== undefined) opts.download = input.download;
    if (input.filename) opts.filename = input.filename;
    if (input.includeInteractions !== undefined) opts.includeInteractions = input.includeInteractions;
    if (input.minify !== undefined) opts.minify = input.minify;
    return `
// Export widget (pp:PinePaper ontology JSON)
(async function() {
  if (!app.exportEngine || !app.exportEngine.exportWidget) return { error: 'Widget export not available' };
  const result = await app.exportEngine.exportWidget(${JSON.stringify(opts)});
  // THE EMBED BOX WAS ALWAYS 16:9, AND IT IS NOT SELF-CONTAINED (round 9 GG,
  // 8.32). The engine writes aspect-ratio: 16/9 and max-width: 800px whatever
  // the scene, so a 300x250 ad sat letterboxed in a wide box. The box is sized
  // from the canvas here. The embed also loads PineWidget.js from
  // pinepaper.studio and fetches the scene JSON at runtime — said, with the
  // zero-dependency alternative.
  const cs = (typeof app.getCanvasSize === 'function' && app.getCanvasSize()) || app.canvasSize || null;
  let embedCode = String(result.embedCode || '');
  if (cs && cs.width > 0 && cs.height > 0) {
    // RegExp from strings with no backslashes — a template literal eats them.
    embedCode = embedCode
      .replace(new RegExp('aspect-ratio:[ ]*[0-9.]+[ ]*/[ ]*[0-9.]+'), 'aspect-ratio: ' + cs.width + '/' + cs.height)
      .replace(new RegExp('max-width:[ ]*[0-9.]+px'), 'max-width: ' + cs.width + 'px');
  }
  const deps = [];
  const scriptSrc = /<script[^>]+src="([^"]+)"/.exec(embedCode);
  if (scriptSrc) deps.push({ kind: 'script', url: scriptSrc[1] });
  if (result.filename) deps.push({ kind: 'scene-json', url: result.filename, note: 'fetched at runtime — host it beside the page' });
  return { success: true, json: result.json, filename: result.filename, embedCode: embedCode, metadata: result.data?.metadata,
    size: cs ? { width: cs.width, height: cs.height } : null,
    dependencies: deps,
    note: 'this embed needs the files in dependencies at runtime. For a single self-contained file with no network calls (ads, email-safe hosting), use pinepaper_export_widget_html.' };
})();`.trim();
  }

  generateExportWidgetHtml(input: ExportWidgetHtmlInput): string {
    const opts: Record<string, unknown> = {};
    if (input.title) opts.title = input.title;
    if (input.download !== undefined) opts.download = input.download;
    return `
// Export widget as self-contained HTML
(async function() {
  if (!app.exportEngine || !app.exportEngine.exportWidgetHTML) return { error: 'Widget HTML export not available' };
  const result = await app.exportEngine.exportWidgetHTML(${JSON.stringify(opts)});
  ${input.lang || input.dir || input.alt ? `// lang / dir / alt on the engine's page (it writes <html lang="en"> and no
  // text alternative). Applied as string edits on the one <html> tag and the
  // first <canvas>; the result says which landed.
  const __esc = function(v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); };
  let __html = String(result.html || '');
  const __applied = [];
  ${input.lang || input.dir ? `__html = __html.replace(/<html\\b[^>]*>/i, function() { __applied.push('html'); return '<html lang="' + __esc(${JSON.stringify(input.lang ?? 'en')}) + '"' + ${JSON.stringify(input.dir ? ` dir="${input.dir}"` : '')} + '>'; });` : ''}
  ${input.alt ? `// The engine's widget draws its canvas from script, so there is no <canvas>
  // tag to label (prod retest): its accessible name is div#w's aria-label,
  // mirrored in the screen-reader text #w-desc. Both carry the alt; a literal
  // <canvas> is labelled too when a page has one. RegExp from strings, so no
  // backslash escapes pass through this template.
  const __alt = __esc(${JSON.stringify(input.alt)});
  __html = __html.replace(new RegExp('<div id="w"([^>]*?)aria-label="[^"]*"', 'i'), function(m, mid) { __applied.push('widget-label'); return '<div id="w"' + mid + 'aria-label="' + __alt + '"'; });
  __html = __html.replace(new RegExp('(<div[^>]*id="w-desc"[^>]*>)[^<]*(</div>)', 'i'), function(m, open, close) { __applied.push('widget-desc'); return open + __alt + close; });
  __html = __html.replace(new RegExp('<canvas(?=[\\\\s>])', 'i'), function(m) { __applied.push('canvas'); return m + ' role="img" aria-label="' + __alt + '"'; });
  __html = __html.replace(/<head>/i, function(m) { __applied.push('meta'); return m + '<meta name="description" content="' + __esc(${JSON.stringify(input.alt)}) + '">'; });` : ''}
  result.html = __html;
  result.a11y = __applied;` : ''}
  return { success: true, html: result.html,${input.lang || input.dir || input.alt ? ' a11y: result.a11y,' : ''} estimatedSize: result.estimatedSize, analysis: { itemTypes: [...result.analysis.itemTypes], relationTypes: [...result.analysis.relationTypes], hasSimpleAnimations: result.analysis.hasSimpleAnimations, hasKeyframeAnimations: result.analysis.hasKeyframeAnimations, hasMasks: result.analysis.hasMasks } };
})();`.trim();
  }
  // ===========================================================================
  // DATA VISUALIZATION (CHARTS)
  // ===========================================================================

  generateChart(input: CreateChartInput): string {
    const guard = `if (!app.chartSystem) return { error: 'ChartSystem not available' };`;
    switch (input.action) {
      case 'create': {
        if (!input.chartType) return `(function() { return { error: 'chartType is required for create' }; })();`;
        if (!input.data) return `(function() { return { error: 'data is required for create' }; })();`;
        const fields = resolveChartFields(input.chartType, input.data, input.options || {});
        if ('error' in fields) return `(function() { return { success: false, error: ${JSON.stringify(fields.error)} }; })();`;
        const dataStr = JSON.stringify(input.data);
        const optsStr = JSON.stringify(fields.options);
        return `
// Create chart
(function() {
  ${guard}
  const group = app.createChart(${JSON.stringify(input.chartType)}, ${dataStr}, ${optsStr});
  if (!group) return { error: 'Failed to create chart' };
  const chartId = app.chartSystem.getLastChartId();
  return { success: true, action: 'create', chartType: ${JSON.stringify(input.chartType)}, chartId, dataPoints: ${input.data.length}${fields.inferred ? `, fields: ${JSON.stringify(fields.inferred)}` : ''} };
})();`.trim();
      }
      case 'update': {
        if (!input.chartId) return `(function() { return { error: 'chartId is required for update' }; })();`;
        const chartIdStr = JSON.stringify(input.chartId);
        const dataStr = JSON.stringify(input.data || []);
        const optsStr = JSON.stringify(input.options || {});
        return `
// Update chart data
(function() {
  ${guard}
  const chart = app.chartSystem.getChart(${chartIdStr});
  if (!chart) return { error: 'Chart not found: ' + ${chartIdStr} };
  app.chartSystem.update(${chartIdStr}, ${dataStr}, ${optsStr});
  return { success: true, action: 'update', chartId: ${chartIdStr} };
})();`.trim();
      }
      case 'reconfigure': {
        if (!input.chartId) return `(function() { return { error: 'chartId is required for reconfigure' }; })();`;
        const chartIdStr = JSON.stringify(input.chartId);
        const optsStr = JSON.stringify(input.options || {});
        return `
// Reconfigure chart styling
(function() {
  ${guard}
  const chart = app.chartSystem.getChart(${chartIdStr});
  if (!chart) return { error: 'Chart not found: ' + ${chartIdStr} };
  app.chartSystem.reconfigure(${chartIdStr}, ${optsStr});
  return { success: true, action: 'reconfigure', chartId: ${chartIdStr} };
})();`.trim();
      }
      case 'remove': {
        if (!input.chartId) return `(function() { return { error: 'chartId is required for remove' }; })();`;
        const chartIdStr = JSON.stringify(input.chartId);
        return `
// Remove chart
(function() {
  ${guard}
  app.chartSystem.remove(${chartIdStr});
  return { success: true, action: 'remove', chartId: ${chartIdStr} };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown chart action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // MAGIC SYSTEM
  // ===========================================================================

  generateMagic(input: MagicInput): string {
    const guard = `if (!app.magicSystem) return { error: 'MagicSystem not available' };`;
    switch (input.action) {
      case 'animate': {
        const opts: Record<string, unknown> = {};
        if (input.mood) opts.energy = input.mood;
        if (input.selectionOnly !== undefined) opts.selectionOnly = input.selectionOnly;
        return `
// Magic auto-animate
(async function() {
  ${guard}
  const result = await app.magicSystem.autoAnimate(${JSON.stringify(opts)});
  return { success: true, action: 'animate', itemsAnimated: result.count, mood: result.energy, type: result.type };
})();`.trim();
      }
      case 'remix': {
        const opts: Record<string, unknown> = {};
        if (input.selectionOnly !== undefined) opts.selectionOnly = input.selectionOnly;
        return `
// Magic style remix
(async function() {
  ${guard}
  const result = await app.magicSystem.remixStyle(${JSON.stringify(opts)});
  return { success: true, action: 'remix', itemsRemixed: result.count, palette: result.palette };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown magic action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // PHYSICS (RIGID BODY SIMULATION)
  // ===========================================================================

  generatePhysics(input: PhysicsInput): string {
    const guard = `if (!app.physicsWorld) return { error: 'PhysicsWorld not available' };`;
    switch (input.action) {
      case 'init': {
        const gravity = JSON.stringify(input.gravity || { x: 0, y: 980 });
        return `
// Initialize physics world
(function() {
  ${guard}
  app.physicsWorld.init({ gravity: ${gravity} });
  return { success: true, action: 'init', gravity: ${gravity} };
})();`.trim();
      }
      case 'add_body': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for add_body' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        const config: Record<string, unknown> = {};
        if (input.bodyType) config.type = input.bodyType;
        if (input.mass !== undefined) config.mass = input.mass;
        if (input.friction !== undefined) config.friction = input.friction;
        if (input.restitution !== undefined) config.restitution = input.restitution;
        if (input.fixedRotation !== undefined) config.fixedRotation = input.fixedRotation;
        if (input.shape) config.shape = input.shape;
        return `
// Add physics body
(function() {
  ${guard}
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  const ok = app.physicsWorld.addBody(${itemIdStr}, ${JSON.stringify(config)});
  return { success: ok, action: 'add_body', itemId: ${itemIdStr}, bodyType: ${JSON.stringify(input.bodyType || 'dynamic')} };
})();`.trim();
      }
      case 'remove_body': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for remove_body' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Remove physics body
(function() {
  ${guard}
  app.physicsWorld.removeBody(${itemIdStr});
  return { success: true, action: 'remove_body', itemId: ${itemIdStr} };
})();`.trim();
      }
      case 'apply_force': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for apply_force' }; })();`;
        if (!input.force) return `(function() { return { error: 'force is required for apply_force' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Apply continuous force
(function() {
  ${guard}
  app.physicsWorld.applyForce(${itemIdStr}, ${JSON.stringify(input.force)});
  return { success: true, action: 'apply_force', itemId: ${itemIdStr}, force: ${JSON.stringify(input.force)} };
})();`.trim();
      }
      case 'apply_impulse': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for apply_impulse' }; })();`;
        if (!input.impulse) return `(function() { return { error: 'impulse is required for apply_impulse' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Apply instant impulse
(function() {
  ${guard}
  app.physicsWorld.applyImpulse(${itemIdStr}, ${JSON.stringify(input.impulse)});
  return { success: true, action: 'apply_impulse', itemId: ${itemIdStr}, impulse: ${JSON.stringify(input.impulse)} };
})();`.trim();
      }
      case 'set_velocity': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for set_velocity' }; })();`;
        if (!input.velocity) return `(function() { return { error: 'velocity is required for set_velocity' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Set body velocity
(function() {
  ${guard}
  app.physicsWorld.setVelocity(${itemIdStr}, ${JSON.stringify(input.velocity)});
  return { success: true, action: 'set_velocity', itemId: ${itemIdStr}, velocity: ${JSON.stringify(input.velocity)} };
})();`.trim();
      }
      case 'get_state': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for get_state' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Get physics body state
(function() {
  ${guard}
  const state = app.physicsWorld.getBodyState(${itemIdStr});
  if (!state) return { error: 'No physics body for item: ' + ${itemIdStr} };
  return { success: true, action: 'get_state', itemId: ${itemIdStr}, ...state };
})();`.trim();
      }
      case 'create_ground': {
        const y = input.y !== undefined ? input.y : 500;
        const w = input.width !== undefined ? input.width : 2000;
        return `
// Create ground plane
(function() {
  ${guard}
  const groundId = app.physicsWorld.createGround(${y}, ${w});
  return { success: true, action: 'create_ground', groundId, y: ${y}, width: ${w} };
})();`.trim();
      }
      case 'create_joint': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for create_joint' }; })();`;
        if (!input.targetItemId) return `(function() { return { error: 'targetItemId is required for create_joint' }; })();`;
        if (!input.jointType) return `(function() { return { error: 'jointType is required for create_joint' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        const targetStr = JSON.stringify(input.targetItemId);
        const params = JSON.stringify({ type: input.jointType, ...(input.jointParams || {}) });
        return `
// Create physics joint
(function() {
  ${guard}
  const joint = app.physicsWorld.createJoint(${itemIdStr}, ${targetStr}, ${params});
  if (!joint) return { error: 'Failed to create joint between ' + ${itemIdStr} + ' and ' + ${targetStr} };
  return { success: true, action: 'create_joint', itemId: ${itemIdStr}, targetItemId: ${targetStr}, jointType: ${JSON.stringify(input.jointType)} };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown physics action: ${(input as any).action}' }; })();`;
    }
  }

  // ===========================================================================
  // MEASUREMENT SYSTEM
  // ===========================================================================

  generateMeasurement(input: MeasurementInput): string {
    const guard = `if (!app.measurementSystem) return { error: 'MeasurementSystem not available' };`;
    switch (input.action) {
      case 'set_rulers': {
        const enabled = input.enabled !== false;
        return `
// Toggle rulers
(function() {
  ${guard}
  // showRulers()/hideRulers(), not a boolean setter — setRulersVisible never existed.
  app.measurementSystem[${enabled} ? 'showRulers' : 'hideRulers']();
  return { success: true, action: 'set_rulers', enabled: ${enabled} };
})();`.trim();
      }
      case 'set_grid': {
        const enabled = input.enabled !== false;
        return `
// Toggle grid
(function() {
  ${guard}
  // showGrid()/hideGrid(), not a boolean setter — setGridVisible never existed.
  app.measurementSystem[${enabled} ? 'showGrid' : 'hideGrid']();
  return { success: true, action: 'set_grid', enabled: ${enabled} };
})();`.trim();
      }
      // No measurementSystem guard — reads from itemRegistry directly
      case 'get_dimensions': {
        if (!input.itemId) return `(function() { return { error: 'itemId is required for get_dimensions' }; })();`;
        const itemIdStr = JSON.stringify(input.itemId);
        return `
// Get item dimensions
(function() {
  const entry = app.itemRegistry.get(${itemIdStr});
  if (!entry || !entry.item) return { error: 'Item not found: ' + ${itemIdStr} };
  const b = entry.item.bounds;
  return { success: true, action: 'get_dimensions', itemId: ${itemIdStr}, x: b.x, y: b.y, width: b.width, height: b.height, rotation: typeof app.authoredRotation === 'function' ? app.authoredRotation(entry.item) : ((entry.item.data?._bakedRotation || 0) + (entry.item.rotation || 0)) };
})();`.trim();
      }
      case 'set_snap': {
        // `enabled` is deliberately unread: there is no mode to set either way.
        return `
// Snap to grid — refused, see below
(function() {
  ${guard}
  // NO EQUIVALENT. MeasurementSystem publishes snapCoordinate(), which snaps a
  // coordinate you hand it, and nothing that turns snapping on as a mode —
  // setSnapToUnitEnabled has never existed, so this reported success over a
  // setting that was never changed. Refused by name, with the thing that works.
  return { success: false, action: 'set_snap',
    error: 'this build has no snap-to-unit MODE to switch: the measurement system snaps a coordinate on request rather than holding a setting. Snap positions yourself before creating or moving items, or set a grid with the grid action and place on its multiples.' };
})();`.trim();
      }
      default:
        return `(function() { return { error: 'Unknown measurement action: ${(input as any).action}' }; })();`;
    }
  }

  /**
   * Z-order: select the item, then call the matching app stacking method
   * (bringToFront / sendToBack / bringForward / sendBackward).
   */
  generateArrange(input: ArrangeInput): string {
    // @engine-methods bringToFront sendToBack bringForward sendBackward
    const method = {
      front: 'bringToFront',
      back: 'sendToBack',
      forward: 'bringForward',
      backward: 'sendBackward',
    }[input.action];
    const id = JSON.stringify(input.itemId);
    return `
// Arrange ${input.itemId} → ${input.action}
(function() {
  const item = app.getItemById(${id});
  if (!item) return { success: false, error: 'Item not found: ' + ${id} };
  if (typeof app.${method} !== 'function') return { success: false, error: 'app.${method} unavailable — update FxTool' };
  app.select(${id});
  app.${method}();
  return { success: true, itemId: ${id}, action: '${input.action}' };
})();`.trim();
  }

  /**
   * On-device object detection (FxTool ImageWorkflow). Finds objects in an image;
   * with asNodes promotes each detection to a typed, image-anchored design node
   * (pp:Detected*) instead of a labeled box. Async (runs an on-device ML model).
   */
  // THE MODEL CANNOT BE DOWNLOADED, AND THE ERROR SAID ONLY "Failed to fetch".
  //
  // Detection runs transformers.js in the page, which pulls the model weights
  // from huggingface.co. pinepaper.studio's connect-src lists neither that host
  // nor its CDN (checked against the served header), so the download is refused
  // for every page on production — an agent read "Failed to fetch
  // (huggingface.co)" and could not tell whether to retry, pass another image,
  // or give up. It is a deployment fix (allow the host, or serve the weights
  // from the studio's own origin), and the error now says so.
  private static readonly MODEL_FETCH_HINT = `function(msg) {
    if (/fail(ed)? to fetch|networkerror|load failed/i.test(msg) && /huggingface|hf\\.co/i.test(msg)) {
      return 'the detection model could not be downloaded: the page could not fetch its weights from huggingface.co. '
        + 'The studio has to allow that host in its content-security policy, or serve the weights itself — no argument to this call works around it, and retrying will not help. '
        + 'Other image tools are unaffected. (' + msg + ')';
    }
    return msg;
  }`;

  generateDetectObjects(input: DetectObjectsInput): string {
    const args = JSON.stringify({
      ...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
      ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
      ...(input.asNodes !== undefined ? { asNodes: input.asNodes } : {}),
      ...(input.queries !== undefined ? { queries: input.queries } : {}),
    });
    return `
// Detect objects${input.queries !== undefined ? ' (open-vocabulary / OWL-ViT)' : ''}${input.asNodes ? ' (asNodes — relational compositing)' : ''}
(async function() {
  if (typeof app.detectObjects !== 'function') {
    return { success: false, error: 'app.detectObjects unavailable — update FxTool to a build that exposes on-device object detection on app' };
  }
  try {
    const res = await app.detectObjects(${args});
    const out = Object.assign({ success: !!(res && res.ok) }, res || {});
    if (!out.success && typeof out.error === 'string') out.error = (${PinePaperCodeGenerator.MODEL_FETCH_HINT})(out.error);
    return out;
  } catch (e) { return { success: false, error: (${PinePaperCodeGenerator.MODEL_FETCH_HINT})(String((e && e.message) || e)) }; }
})();`.trim();
  }

  /**
   * Extract the best-matching detected region from an image as a NEW item (FxTool
   * ImageWorkflow.extractObject). Async (runs detection first).
   */
  generateExtractObject(input: ExtractObjectInput): string {
    const args = JSON.stringify({
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.itemId !== undefined ? { itemId: input.itemId } : {}),
      ...(input.x !== undefined ? { x: input.x } : {}),
      ...(input.y !== undefined ? { y: input.y } : {}),
      ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
    });
    return `
// Extract object${input.label ? ` "${input.label}"` : ''} from the image
(async function() {
  if (typeof app.extractObject !== 'function') {
    return { success: false, error: 'app.extractObject unavailable — update FxTool to a build that exposes on-device object detection on app' };
  }
  try {
    const res = await app.extractObject(${args});
    const out = Object.assign({ success: !!(res && res.ok) }, res || {});
    if (!out.success && typeof out.error === 'string') out.error = (${PinePaperCodeGenerator.MODEL_FETCH_HINT})(out.error);
    return out;
  } catch (e) { return { success: false, error: (${PinePaperCodeGenerator.MODEL_FETCH_HINT})(String((e && e.message) || e)) }; }
})();`.trim();
  }

  /**
   * Camera director (FxTool DirectorCompiler): compile a shot list into ONE
   * camera_animates walkthrough. 'auto' derives a shot per item; 'shots' applies
   * an explicit list. WYSIWYG between editor and any export size (one camera).
   */
  generateCameraDirector(input: CameraDirectorInput): string {
    if (input.action === 'shots') {
      const shotsJson = JSON.stringify(input.shots ?? []);
      const opts = JSON.stringify({ loop: !!input.loop });
      return `
// Camera director — apply explicit shot list
(function() {
  if (typeof app.applyDirectorShots !== 'function') {
    return { success: false, error: 'app.applyDirectorShots unavailable — update FxTool to a build with the camera director' };
  }
  const shots = ${shotsJson};
  const ok = app.applyDirectorShots(shots, ${opts});
  return { success: !!ok, mode: 'shots', shotCount: shots.length, loop: ${!!input.loop} };
})();`.trim();
    }
    const opts = JSON.stringify({
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.hold !== undefined ? { hold: input.hold } : {}),
      ...(input.establishing !== undefined ? { establishing: input.establishing } : {}),
      loop: !!input.loop,
    });
    return `
// Camera director — auto-direct a walkthrough of the scene
(function() {
  if (typeof app.autoDirectStory !== 'function') {
    return { success: false, error: 'app.autoDirectStory unavailable — update FxTool to a build with the camera director' };
  }
  const shots = app.autoDirectStory(${opts});
  if (!shots) return { success: false, mode: 'auto', error: 'No items to direct — add content first' };
  return { success: true, mode: 'auto', shotCount: shots.length, shots: shots };
})();`.trim();
  }

  /**
   * Inner JS that groups resolved item ids into ONE draggable entity via the
   * GroupManager (createGroup → addItemsToGroup). idsArrayExpr is a JS expression
   * evaluating to an array of id strings; nameExpr is a JS string expression or 'undefined'.
   * Shared by the standalone pinepaper_group tool and the batch "group" operation.
   */
  private groupCodeBody(idsArrayExpr: string, nameExpr: string): string {
    return `
  if (!app.groupManager) return { success: false, error: 'GroupManager not available — update FxTool' };
  const ids = (${idsArrayExpr}).filter(function(x) { return x != null; });
  const items = ids.map(function(id) { return app.getItemById(id); }).filter(Boolean);
  if (!items.length) return { success: false, error: 'No valid items to group (check the ids / $N refs)' };
  const group = app.groupManager.createGroup(${nameExpr});
  if (!group) return { success: false, error: 'Failed to create group' };
  app.groupManager.addItemsToGroup(items, group);
  if (app.historyManager) app.historyManager.saveState();
  const groupId = (group.data && (group.data.registryId || group.data.groupId)) || null;
  // itemId too (round 8 BB, 1.70): every other create answers itemId, and a
  // group is an item every other tool addresses by that id. In a batch this
  // does not claim a $N slot — only create ops do.
  return { success: true, groupId: groupId, itemId: groupId, groupName: group.data && group.data.groupName, itemCount: items.length };`;
  }

  /**
   * Group a set of items into one draggable entity, or ungroup one back into loose
   * items. Grouping is non-destructive — ungroup restores the individual items.
   */
  generateGroup(input: GroupInput): string {
    if (input.action === 'break_apart') {
      const idExpr = JSON.stringify(input.itemId || '');
      return `
// Break apart ${input.itemId || ''} into movable parts
(function() {
  if (typeof app.breakApart !== 'function') return { success: false, error: 'app.breakApart unavailable — update FxTool to a build with SVG/group segmentation' };
  const target = app.getItemById(${idExpr});
  if (!target) return { success: false, error: 'Item not found: ' + ${idExpr} };
  const result = app.breakApart(target);
  if (!result || !result.parts || !result.parts.length) return { success: false, error: 'Nothing to break apart (no sub-parts found)' };
  const partIds = result.parts.map(function(p) { return p && p.data && (p.data.registryId || p.data.id); }).filter(Boolean);
  const groupId = (result.group && result.group.data && (result.group.data.registryId || result.group.data.groupId)) || null;
  return { success: true, action: 'break_apart', groupId: groupId, itemId: groupId, partIds: partIds, partCount: partIds.length };
})();`.trim();
    }
    if (input.action === 'ungroup') {
      const idExpr = JSON.stringify(input.groupId || '');
      return `
// Ungroup ${input.groupId || ''}
(function() {
  if (!app.groupManager) return { success: false, error: 'GroupManager not available — update FxTool' };
  const gid = ${idExpr};
  const group = app.getItemById(gid) || (app.groupManager.getGroupById ? app.groupManager.getGroupById(gid) : null);
  if (!group) return { success: false, error: 'Group not found: ' + gid };
  app.groupManager.ungroupAll(group);
  if (app.historyManager) app.historyManager.saveState();
  return { success: true, ungrouped: true, groupId: gid };
})();`.trim();
    }
    const idsArrayExpr = JSON.stringify(input.itemIds ?? []);
    const nameExpr = input.groupName !== undefined ? JSON.stringify(input.groupName) : 'undefined';
    return `
// Group ${(input.itemIds || []).length} items${input.groupName ? ` as "${input.groupName}"` : ''}
(function() {${this.groupCodeBody(idsArrayExpr, nameExpr)}
})();`.trim();
  }

  /**
   * Audit the live scene (or pre-validate a batch of proposed ops) with FxTool's
   * OntologyValidator — structured { ok, diagnostics } feedback instead of console warnings.
   */
  generateValidateScene(input: ValidateSceneInput): string {
    const guard = `const v = app.sceneValidator;
  if (!v) return { success: false, error: 'app.sceneValidator unavailable — update FxTool to a build with the OntologyValidator' };`;
    if (input.ops) {
      const opsJson = JSON.stringify(input.ops);
      return `
// Pre-validate proposed ops against the live scene
(function() {
  ${guard}
  if (typeof v.validateOps !== 'function') return { success: false, error: 'validateOps unavailable in this FxTool build' };
  const r = v.validateOps(${opsJson});
  return { success: true, mode: 'ops', ok: r.ok, diagnosticCount: r.diagnostics.length, diagnostics: r.diagnostics };
})();`.trim();
    }
    return `
// Audit the current scene
(function() {
  ${guard}
  const r = v.validateScene();
  return { success: true, mode: 'scene', ok: r.ok, diagnosticCount: r.diagnostics.length, diagnostics: r.diagnostics };
})();`.trim();
  }

  /**
   * Deterministic headless frame capture (S3): app.captureFramesAt(times, { seed })
   * seeds Math.random once around the sequence and evaluates the scene at each time via
   * sceneAt(t). Returns a cheap per-frame hash by default (token-light) so an agent can
   * verify determinism (re-run → identical hashes) and whether frames actually change.
   */
  /**
   * Measurements for pinepaper_accessibility_check; the verdicts are made on
   * the server (src/utils/a11y.ts). Text: fill, size, weight, and the solid
   * fill of the topmost item under its centre. Flash: mean relative luminance
   * of a 3 x 3 grid per sampled frame, through captureFramesAt (deterministic
   * seek). Pixel work is native reduce / Array.from, not generated loops, so
   * the loop budget does not count it.
   */
  generateAccessibilityCheck(input: AccessibilityCheckInput): string {
    const checks = input.checks ?? ['contrast', 'flash'];
    const fps = input.fps ?? 20;
    const duration = input.duration ?? 5;
    const n = Math.min(1200, Math.max(3, Math.round(duration * fps)));
    return `
// Accessibility measurements (${checks.join(', ')})
(function() {
  const out = { success: true, fps: ${fps}, duration: ${duration} };
  const rgba = function(c) {
    if (!c || c.gradient || typeof c.red !== 'number') return null;
    return { r: Math.round(c.red * 255), g: Math.round(c.green * 255), b: Math.round(c.blue * 255), a: typeof c.alpha === 'number' ? c.alpha : 1 };
  };
  out.page = (app.canvasEl && app.canvasEl.style && app.canvasEl.style.backgroundColor) || null;
${checks.includes('contrast') ? `  const all = (app.itemRegistry && typeof app.itemRegistry.getAll === 'function') ? app.itemRegistry.getAll() : [];
  const texts = all.filter(function(e) { return e && e.item && e.item.className === 'PointText' && e.item.visible !== false && String(e.item.content || '').trim() !== ''; });
  const solids = all.filter(function(e) { return e && e.item && e.item.className !== 'PointText' && e.item.visible !== false && rgba(e.item.fillColor) && e.item.bounds; });
  out.texts = texts.map(function(e) {
    const it = e.item, c = it.bounds.center;
    const under = solids.filter(function(s) { return s.item.bounds.contains(c) && typeof s.item.isBelow === 'function' && s.item.isBelow(it); });
    const top = under.reduce(function(best, s) { return (!best || (typeof s.item.isAbove === 'function' && s.item.isAbove(best.item))) ? s : best; }, null);
    const w = String(it.fontWeight || '');
    return { id: e.itemId, content: String(it.content), fill: rgba(it.fillColor), fontSize: it.fontSize || 0,
      bold: w === 'bold' || Number(w) >= 700, behind: top ? rgba(top.item.fillColor) : null, behindId: top ? top.itemId : undefined };
  });
` : ''}${checks.includes('flash') ? `  if (typeof app.captureFramesAt !== 'function') {
    out.flashUnavailable = 'this studio has no deterministic frame capture (app.captureFramesAt), so flashing was not checked.';
  } else {
    const W = 48, H = 27;
    const small = document.createElement('canvas');
    small.width = W; small.height = H;
    const ctx = small.getContext('2d', { willReadFrequently: true });
    const lut = Array.from({ length: 256 }, function(_, v) { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    const times = Array.from({ length: ${n} }, function(_, i) { return i / ${fps}; });
    out.series = app.captureFramesAt(times, { capture: function(c) {
      // Transparent canvas shows the page's CSS background, so composite on it.
      ctx.fillStyle = out.page || '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(c, 0, 0, W, H);
      const px = ctx.getImageData(0, 0, W, H).data;
      const acc = Array.prototype.reduce.call(px, function(a, v, k) {
        if (k % 4 !== 3) return a;
        const p = (k - 3) / 4, x = p % W, y = (p - x) / W;
        const cell = Math.min(2, Math.floor(y * 3 / H)) * 3 + Math.min(2, Math.floor(x * 3 / W));
        a.sum[cell] += 0.2126 * lut[px[k - 3]] + 0.7152 * lut[px[k - 2]] + 0.0722 * lut[px[k - 1]];
        a.n[cell] += 1;
        return a;
      }, { sum: [0, 0, 0, 0, 0, 0, 0, 0, 0], n: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
      return acc.sum.map(function(s, i) { return acc.n[i] ? s / acc.n[i] : 0; });
    } });
  }
` : ''}  return out;
})();`.trim();
  }

  generateCaptureFrames(input: CaptureFramesInput): string {
    const timesJson = JSON.stringify(input.times);
    const seed = input.seed !== undefined ? input.seed : 0;
    const includeDataUrls = !!input.includeDataUrls;
    return `
// Deterministic frame capture
(function() {
  if (typeof app.captureFramesAt !== 'function') {
    return { success: false, error: 'app.captureFramesAt unavailable — update FxTool to a build with the deterministic capture entrypoint' };
  }
  const includeDataUrls = ${includeDataUrls};
  // THE HASH LOOP RAN ONCE PER CHARACTER OF A DATA URL, inside generated code,
  // where every loop site is budgeted at 2,000,000 iterations — so any frame
  // over ~2 MB (three photos, a shader backdrop) died "Loop budget exceeded".
  // app.hashFrame is the same djb2-xor in engine code, outside the budget, so
  // hashes stay comparable with builds that only have the fallback.
  const hashStr = (typeof app.hashFrame === 'function')
    ? function(s) { return app.hashFrame(s); }
    // The fallback must not be a for loop either: the budget is per loop SITE
    // across the whole run, so 50 frames of ~40 KB data URLs exhausted it on a
    // plain 9-text scene (round 7 X, #7) on studios without hashFrame. A native
    // reduce is not a generated loop and is not counted; same djb2-xor.
    : function(s) { return Array.prototype.reduce.call(s, function(h, c) { return (((h << 5) + h) ^ c.charCodeAt(0)) >>> 0; }, 5381).toString(16); };
  const frames = app.captureFramesAt(${timesJson}, {
    seed: ${seed},
    capture: function(c, t, i) {
      // Prefer app.captureFrameDataURL(): it renders only the used region, so an
      // unbounded canvas's fill-workspace margin is never baked into the frame.
      // Fall back to the raw canvas toDataURL on pre-capture-region FxTool builds.
      const url = (typeof app.captureFrameDataURL === 'function')
        ? app.captureFrameDataURL()
        : ((c && c.toDataURL) ? c.toDataURL() : '');
      const f = { index: i, time: t, hash: hashStr(url), bytes: url.length };
      if (includeDataUrls) f.dataUrl = url;
      return f;
    }
  });
  const uniqueHashes = new Set(frames.map(function(f) { return f.hash; })).size;
  return { success: true, seed: ${seed}, frameCount: frames.length, uniqueHashes: uniqueHashes, allIdentical: uniqueHashes <= 1, frames: frames };
})();`.trim();
  }

  /**
   * Ontology→scene compiler (S12-E3). Compiles the JSON-LD design graph SERVER-SIDE
   * (deterministic, unit-tested) into create/addRelation ops, then emits code that
   * applies them. Only root nodes carry coordinates; structural relations place the
   * rest at runtime. Compile diagnostics are baked into the emitted result.
   */
  generateInstantiateOntology(input: InstantiateOntologyInput): string {
    const { ops, diagnostics } = new OntologyCompiler({
      canvas: input.canvas,
      defaultGeometry: input.defaultGeometry,
    }).compile(input.doc);
    const opsJson = JSON.stringify(ops, null, 2);
    const diagJson = JSON.stringify(diagnostics);
    const docJson = JSON.stringify(input.doc);
    // awaitImages: the studio decorates a raster (fit, keyframes, mask) on its
    // 'load' event and re-runs its finalize steps when the last one lands; a
    // tool call that screenshots next wants that to have happened.
    const engineOptsJson = JSON.stringify({ canvas: input.canvas, defaultGeometry: input.defaultGeometry, awaitImages: true });
    return `
// Instantiate ontology → scene (${ops.filter((o) => o.op === 'create').length} items, ${ops.filter((o) => o.op === 'addRelation').length} relations)
(async function() {
  // Engine door first: the studio's own OntologyCompiler reads every node facet
  // (geometry, paint, text, the keyframe track, masks) and builds through the
  // template loader's paths — the round trip the studio's pixel tests verify
  // (e2e/graph-instantiate-parity.spec.js). The server-side compile above is
  // kept for the diagnostics preview and for studios that predate the facade,
  // which get the box loop below and a note saying so.
  const doc = ${docJson};
  if (typeof app.instantiateOntology === 'function') {
    const r = await app.instantiateOntology(doc, ${engineOptsJson});
    const diags = r.diagnostics || [];
    return {
      success: !diags.some(function(d) { return d && d.level === 'error'; }) && !r.imagesFailed,
      engine: 'studio',
      itemIds: r.itemIds, itemCount: r.itemIds.length,
      // Every count the engine returns, not a chosen three. imagesFailed is the
      // one that matters most: a raster that never decoded leaves a scene that
      // looks built and is not, and dropping the count is how that becomes
      // invisible. relationsApplied and connectorsApplied are the only way to
      // tell "the doc declared no edges" from "the edges did not bind".
      keyframesApplied: r.keyframesApplied, masksApplied: r.masksApplied, deferred: r.deferred,
      relationsApplied: r.relationsApplied, connectorsApplied: r.connectorsApplied,
      interactionsApplied: r.interactionsApplied, effectsApplied: r.effectsApplied,
      groupsCreated: r.groupsCreated, nested: r.nested,
      imagesFailed: r.imagesFailed, backgroundApplied: r.backgroundApplied, duration: r.duration,
      diagnostics: diags, errors: [],
    };
  }
  if (typeof app.create !== 'function' || typeof app.addRelation !== 'function') {
    return { success: false, error: 'app.create / app.addRelation unavailable' };
  }
  const ops = ${opsJson};
  const diagnostics = ${diagJson};
  const itemIds = [];
  const errors = [];
  for (const op of ops) {
    try {
      if (op.op === 'create') {
        app.create(op.type, { id: op.id, x: op.x, y: op.y, width: op.width, height: op.height });
        itemIds.push(op.id);
      } else if (op.op === 'addRelation') {
        app.addRelation(op.from, op.to, op.relation, op.params || {});
      }
    } catch (e) {
      errors.push({ op: op.op, id: op.id || (op.from + '->' + op.to), error: e && e.message });
    }
  }
  if (app.historyManager) app.historyManager.saveState();
  return { success: errors.length === 0, engine: 'server-box', note: 'this studio predates app.instantiateOntology: items were placed as boxes without paint, text, keyframes or masks', itemIds: itemIds, itemCount: itemIds.length, diagnostics: diagnostics, errors: errors };
})();`.trim();
  }

  /**
   * Relational-density lint of the live scene (S12-E2) via app.lintScene(). Reports
   * relationalDensity + edge/component counts and suggests structural relations for
   * unrelated item pairs already in a structural configuration. Read-only/advisory.
   */
  generateLintScene(input: LintSceneInput): string {
    const optsJson = JSON.stringify({
      ...(input.eps !== undefined ? { eps: input.eps } : {}),
      ...(input.cap !== undefined ? { cap: input.cap } : {}),
    });
    return `
// Relational-density lint (advisory)
(function() {
  if (typeof app.lintScene !== 'function') {
    return { success: false, error: 'app.lintScene unavailable — update FxTool to a build with the relational linter (S12-E2)' };
  }
  const result = app.lintScene(${optsJson});
  return { success: true, density: result.density, suggestions: result.suggestions };
})();`.trim();
  }

  /**
   * Media (video/audio) via window.PinePaperAgent. Upload is URL-based (the agent
   * hands a URL, FxTool fetches → File). Async IIFE so uploads resolve before the
   * value is returned (the governor awaits it).
   */
  generateMedia(input: MediaInput): string {
    const guard = `  const A = (typeof window !== 'undefined') && window.PinePaperAgent;
  if (!A || typeof A.uploadVideo !== 'function') { return { success: false, error: 'window.PinePaperAgent media API unavailable — update FxTool to a media-capable build' }; }`;
    // The URL to upload from: the staged bytes when the handler put a large
    // data: URL on window.__ppStage (see pinepaper_media in handlers.ts).
    //
    // A data: URL IS DECODED HERE INTO A File, NOT HANDED OVER AS A URL. The
    // engine's upload fetch()es a string, and production's CSP refuses fetch()
    // of data: — so every data: upload failed on prod with "Failed to fetch ()"
    // at every size (a local engine without the CSP accepted small ones, which
    // is what made it look like a size limit). uploadAudio/uploadVideo take a
    // File directly. Uint8Array.from with a map, not a for loop: a generated
    // loop is budgeted per iteration and a few MB of audio would exhaust it.
    const srcExpr = (url: string | undefined, kind: 'audio' | 'video') => `(function(u) {
    if (u.indexOf('__ppStage:') === 0) {
      const k = u.slice('__ppStage:'.length);
      const v = window.__ppStage && window.__ppStage[k];
      if (!v) throw new Error('the media bytes were staged as ' + k + ' and are not on the page — a bug in the MCP server, not your call.');
      u = v;
    }
    if (u.indexOf('data:') !== 0) return u;
    const comma = u.indexOf(',');
    const meta = u.slice(5, comma);
    const mime = meta.split(';')[0] || '${kind === 'audio' ? 'audio/mpeg' : 'video/mp4'}';
    const body = u.slice(comma + 1);
    const bin = /;base64/i.test(meta) ? atob(body) : decodeURIComponent(body);
    const bytes = Uint8Array.from(bin, function(c) { return c.charCodeAt(0); });
    const ext = (mime.split('/')[1] || '${kind === 'audio' ? 'mp3' : 'mp4'}').replace(/[^a-z0-9]/gi, '');
    return new File([bytes], '${kind}.' + ext, { type: mime });
  })(${JSON.stringify(url ?? '')})`;
    // TWO ID SPACES, AND THE CALLER HOLDS THE WRONG ONE.
    //
    // upload answers {id, registryId}; every other tool on this surface speaks
    // registry ids (item_N), so that is the one callers keep. But remove,
    // setMediaPlaybackRate and setMediaClip look the id up in the audio/video
    // layers, which are keyed by MEDIA id — so set_playback_rate with the
    // registryId returned false, reported as a failure with no reason. Either
    // form is resolved here; a miss names the id and what was looked for.
    const resolveMedia = `  const __ref = ${JSON.stringify(input.id ?? '')};
  const __m = (typeof A.listMedia === 'function')
    ? A.listMedia().find(function(x) { return x.id === __ref || x.registryId === __ref; })
    : null;
  const __mid = __m ? __m.id : __ref;
  const __miss = { success: false, error: 'no uploaded audio or video matches ' + JSON.stringify(__ref) + ' — pass the id or registryId that upload returned (media list shows both).' };`;
    switch (input.action) {
      case 'upload_video': {
        const opts = JSON.stringify({
          ...(input.position ? { position: input.position } : {}),
          ...(input.scale !== undefined ? { scale: input.scale } : {}),
          ...(input.timeOffset !== undefined ? { timeOffset: input.timeOffset } : {}),
          ...(input.clipInPoint !== undefined ? { clipInPoint: input.clipInPoint } : {}),
          ...(input.clipOutPoint !== undefined ? { clipOutPoint: input.clipOutPoint } : {}),
        });
        return `
// Upload video from URL
(async function() {
${guard}
  const info = await A.uploadVideo(${srcExpr(input.url, 'video')}, ${opts});
  return { success: true, action: 'upload_video', media: info };
})();`.trim();
      }
      case 'upload_audio': {
        const opts = JSON.stringify({
          ...(input.volume !== undefined ? { volume: input.volume } : {}),
          ...(input.loop !== undefined ? { loop: input.loop } : {}),
          ...(input.muted !== undefined ? { muted: input.muted } : {}),
          ...(input.timeOffset !== undefined ? { timeOffset: input.timeOffset } : {}),
        });
        return `
// Upload audio from URL
(async function() {
${guard}
  const info = await A.uploadAudio(${srcExpr(input.url, 'audio')}, ${opts});${input.volume !== undefined ? `
  // THE LEVEL IS STORED UNDER ONE KEY AND EXPORTED FROM ANOTHER. The upload
  // records volume as \`gain\` on the registry entry; the video exporter's mix
  // reads \`audioGain\`. So a bed uploaded at 0.25 exported at unity (measured:
  // 0.0 dB change). Written to both until the engine reads one.
  const __ae = info && info.registryId && app.itemRegistry ? app.itemRegistry.get(info.registryId) : null;
  if (__ae) { __ae.properties = __ae.properties || {}; __ae.properties.audioGain = ${input.volume}; }` : ''}
  return { success: true, action: 'upload_audio', media: info };
})();`.trim();
      }
      case 'list':
        return `
// List media
(function() {
${guard}
  return { success: true, action: 'list', media: A.listMedia() };
})();`.trim();
      case 'remove':
        return `
// Remove media
(function() {
${guard}
${resolveMedia}
  if (!__m) return __miss;
  const removed = A.removeMedia(__mid);
  return removed
    ? { success: true, action: 'remove', id: __mid, registryId: __m.registryId, removed: true }
    : { success: false, action: 'remove', id: __mid, error: 'the studio did not remove ' + __mid + '.' };
})();`.trim();
      case 'set_playback_rate':
        return `
// Set media playback rate
(function() {
${guard}
${resolveMedia}
  if (!__m) return __miss;
  const ok = A.setMediaPlaybackRate(__mid, ${input.rate});
  return ok
    ? { success: true, action: 'set_playback_rate', id: __mid, registryId: __m.registryId, rate: ${input.rate} }
    : { success: false, action: 'set_playback_rate', id: __mid, error: 'the studio refused rate ${input.rate} for ' + __mid + '.' };
})();`.trim();
      case 'set_clip':
        return `
// Re-trim an existing media clip (media-time seconds)
(function() {
${guard}
  if (typeof A.setMediaClip !== 'function') { return { success: false, error: 'setMediaClip unavailable — update FxTool' }; }
${resolveMedia}
  if (!__m) return __miss;
  const ok = A.setMediaClip(__mid, ${input.inPoint}, ${input.outPoint});
  return ok
    ? { success: true, action: 'set_clip', id: __mid, registryId: __m.registryId, inPoint: ${input.inPoint}, outPoint: ${input.outPoint} }
    : { success: false, action: 'set_clip', id: __mid, error: 'the studio refused the clip window ${input.inPoint}–${input.outPoint} for ' + __mid + '.' };
})();`.trim();

      // ── Video-editing actions (v1.6.4) — these live on `app` (PinePaper
      // facades), not the agent media API, so they carry their own guards.
      // The facades snapshot history themselves; no saveState here.
      case 'set_time_remap': {
        const S = (v: unknown) => JSON.stringify(v);
        return `
// Remap a clip's time — speed ramps, freeze frames, reverse (null clears)
(function() {
  if (typeof app.setTimeRemap !== 'function') { return { success: false, error: 'app.setTimeRemap unavailable — update FxTool to a time-remap-capable build' }; }
  const r = app.setTimeRemap(${S(input.id)}, ${S(input.remapTrack ?? null)});
  if (!(r && r.ok)) return { success: false, error: (r && r.error) || 'remap failed' };
  // WHAT THE REMAP CANNOT DO, READ BACK FROM WHAT WAS STORED. The clip is on
  // the timeline only for its trimmed window, and past that it is HIDDEN
  // whatever the curve says — a remap to 6.5 s on a 5 s clip cut to black at
  // 5.0 s. Source values outside [inPoint, outPoint] are clamped, so that part
  // of the curve is a hold. Both answered success before.
  const __rid = typeof app._resolveId === 'function' ? app._resolveId(${S(input.id)}) : ${S(input.id)};
  const __e = __rid && app.itemRegistry && app.itemRegistry.get(__rid);
  const __p = (__e && __e.properties) || {};
  const __tr = Array.isArray(__p.timeRemap) ? __p.timeRemap : [];
  const __warnings = [];
  const __out = typeof __p.outPoint === 'number' ? __p.outPoint : __p.duration;
  if (__tr.length > 1 && Number.isFinite(__out)) {
    const __in = typeof __p.inPoint === 'number' ? __p.inPoint : 0;
    const __start = typeof __p.clipStartTime === 'number' ? __p.clipStartTime : 0;
    const __end = __start + Math.max(0.001, __out - __in);
    const __last = __tr[__tr.length - 1].time;
    if (__last > __end + 0.001) {
      __warnings.push('the remap runs to ' + __last + ' s but the clip is on the timeline only until ' + __end.toFixed(3) + ' s (start + trimmed length); after that it is hidden, not extended. Lengthen the clip window first.');
    }
    const __vals = __tr.map(function(k) { return k.value; });
    const __hi = Math.max.apply(null, __vals), __lo = Math.min.apply(null, __vals);
    if (__hi > __out + 0.001 || __lo < __in - 0.001) {
      __warnings.push('remap source times run ' + __lo.toFixed(3) + '–' + __hi.toFixed(3) + ' s but the clip only has ' + __in.toFixed(3) + '–' + __out.toFixed(3) + ' s; the part outside is clamped, which plays as a hold.');
    }
  }
  return Object.assign({ success: true, action: 'set_time_remap', points: r.points }, __warnings.length ? { warnings: __warnings } : {});
})();`.trim();
      }
      case 'speed_ramp': {
        const S = (v: unknown) => JSON.stringify(v);
        return `
// Speed ramp: consecutive {duration, speed} segments compiled to a remap curve
(function() {
  if (typeof app.speedRamp !== 'function') { return { success: false, error: 'app.speedRamp unavailable — update FxTool to a time-remap-capable build' }; }
  const r = app.speedRamp(${S(input.id)}, ${S(input.segments)});
  if (!(r && r.ok)) return { success: false, error: (r && r.error) || 'speed ramp failed' };
  // WHAT THE REMAP CANNOT DO, READ BACK FROM WHAT WAS STORED. The clip is on
  // the timeline only for its trimmed window, and past that it is HIDDEN
  // whatever the curve says — a remap to 6.5 s on a 5 s clip cut to black at
  // 5.0 s. Source values outside [inPoint, outPoint] are clamped, so that part
  // of the curve is a hold. Both answered success before.
  const __rid = typeof app._resolveId === 'function' ? app._resolveId(${S(input.id)}) : ${S(input.id)};
  const __e = __rid && app.itemRegistry && app.itemRegistry.get(__rid);
  const __p = (__e && __e.properties) || {};
  const __tr = Array.isArray(__p.timeRemap) ? __p.timeRemap : [];
  const __warnings = [];
  const __out = typeof __p.outPoint === 'number' ? __p.outPoint : __p.duration;
  if (__tr.length > 1 && Number.isFinite(__out)) {
    const __in = typeof __p.inPoint === 'number' ? __p.inPoint : 0;
    const __start = typeof __p.clipStartTime === 'number' ? __p.clipStartTime : 0;
    const __end = __start + Math.max(0.001, __out - __in);
    const __last = __tr[__tr.length - 1].time;
    if (__last > __end + 0.001) {
      __warnings.push('the remap runs to ' + __last + ' s but the clip is on the timeline only until ' + __end.toFixed(3) + ' s (start + trimmed length); after that it is hidden, not extended. Lengthen the clip window first.');
    }
    const __vals = __tr.map(function(k) { return k.value; });
    const __hi = Math.max.apply(null, __vals), __lo = Math.min.apply(null, __vals);
    if (__hi > __out + 0.001 || __lo < __in - 0.001) {
      __warnings.push('remap source times run ' + __lo.toFixed(3) + '–' + __hi.toFixed(3) + ' s but the clip only has ' + __in.toFixed(3) + '–' + __out.toFixed(3) + ' s; the part outside is clamped, which plays as a hold.');
    }
  }
  return Object.assign({ success: true, action: 'speed_ramp', points: r.points }, __warnings.length ? { warnings: __warnings } : {});
})();`.trim();
      }
      case 'match_cut': {
        const S = (v: unknown) => JSON.stringify(v);
        const opts = S({
          ...(input.subject !== undefined ? { subject: input.subject } : {}),
          ...(input.label !== undefined ? { label: input.label } : {}),
          ...(input.at !== undefined ? { at: input.at } : {}),
          ...(input.settle !== undefined ? { settle: input.settle } : {}),
          ...(input.fade !== undefined ? { fade: input.fade } : {}),
          ...(input.consent !== undefined ? { consent: input.consent } : {}),
        });
        return `
// Match cut: align the SUBJECT across the cut (on-device detection)
(async function() {
  if (typeof app.matchCut !== 'function') { return { success: false, error: 'app.matchCut unavailable — update FxTool to a match-cut-capable build' }; }
  const r = await app.matchCut(${S(input.fromItemId)}, ${S(input.toItemId)}, ${opts});
  if (r && r.needsConsent) { return { success: false, needsConsent: true, cost: r.cost, error: 'Detection model download needs consent — re-call with consent: true' }; }
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'match cut failed' }; }
  return { success: true, action: 'match_cut', aspectMismatch: r.aspectMismatch || false };
})();`.trim();
      }
      case 'apply_track_matte': {
        const S = (v: unknown) => JSON.stringify(v);
        const opts = S({
          ...(input.channel !== undefined ? { channel: input.channel } : {}),
          ...(input.invert !== undefined ? { invert: input.invert } : {}),
          ...(input.strength !== undefined ? { strength: input.strength } : {}),
          ...(input.hideMatte !== undefined ? { hideMatte: input.hideMatte } : {}),
          ...(input.live !== undefined ? { live: input.live } : {}),
        });
        return `
// Track matte: the matte item's ${input.channel || 'luma'} drives the target's alpha${input.live ? ' (LIVE — re-cuts as the matte animates)' : ''}
(async function() {
  if (typeof app.applyTrackMatte !== 'function') { return { success: false, error: 'app.applyTrackMatte unavailable — update FxTool to a track-matte-capable build' }; }
  try {
    await app.applyTrackMatte(${S(input.id)}, ${S(input.matteItemId)}, ${opts});
    return { success: true, action: 'apply_track_matte', id: ${S(input.id)}, matte: ${S(input.matteItemId)}, live: ${S(!!input.live)} };
  } catch (e) {
    // The facade throws on a missing raster/matte rather than returning {ok:false}.
    return { success: false, error: e && e.message ? e.message : String(e) };
  }
})();`.trim();
      }
      case 'stop_live_matte': {
        const S = (v: unknown) => JSON.stringify(v);
        return `
// Stop a live matte, leaving the last cut in place
(function() {
  if (typeof app.stopLiveMatte !== 'function') { return { success: false, error: 'app.stopLiveMatte unavailable — update FxTool' }; }
  const r = app.stopLiveMatte(${S(input.id)});
  return r && r.ok ? { success: true, action: 'stop_live_matte' } : { success: false, error: (r && r.error) || 'no live matte on that item' };
})();`.trim();
      }
    }
  }

  /**
   * pinepaper_text_style — display styles + variable-font axes.
   * All three facades return their own {ok, …} envelopes; forwarded as-is.
   */
  generateTextStyle(input: TextStyleInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    switch (input.action) {
      case 'apply_style': {
        const opts = S({
          ...(input.palette !== undefined ? { palette: input.palette } : {}),
          ...(input.variant !== undefined ? { variant: input.variant } : {}),
          ...(input.content !== undefined ? { content: input.content } : {}),
          ...(input.fontFamily !== undefined ? { fontFamily: input.fontFamily } : {}),
          ...(input.fontSize !== undefined ? { fontSize: input.fontSize } : {}),
        });
        return `
// Display text style: ${input.styleKey} — stacked-layer title, id adopted from the text
(async function() {
  if (typeof app.applyTextStyle !== 'function') { return { success: false, error: 'app.applyTextStyle unavailable — update FxTool to a text-styles build' }; }
  // LOAD THE FACES FIRST. The decorative stylesheet is fetched on pointerenter
  // over the style grid — a gesture no agent ever makes — so every decorative
  // family was missing in production and a style asking for one silently drew
  // the fallback and reported success. ensureFontsLoaded is the fix; guarded,
  // because a studio without it behaves as it always did.
  if (typeof app.ensureFontsLoaded === 'function') {
    try { await app.ensureFontsLoaded('decorative'); } catch (_) { /* the pending flag below still reports it */ }
  }
  const r = app.applyTextStyle(${S(input.itemId)}, ${S(input.styleKey)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'style failed' }; }
  // fontPending: the face is not there YET, so this drew in the fallback. Said
  // out loud rather than left to be discovered in the export.
  if (r.fontPending) {
    return { success: true, action: 'apply_style', id: r.id, style: r.style, layers: r.layers,
      palette: r.palette, bounds: r.bounds, fontPending: true,
      warning: 'the face for this style had not loaded, so it drew in a FALLBACK font. Re-apply the style, or call pinepaper_font check with the family and your text to see what is really being used.' };
  }
  // The styled group ADOPTS the text item's registry id — r.id is the SAME id
  // the caller passed, so their handle keeps working. Say so in the result.
  return { success: true, action: 'apply_style', id: r.id, style: r.style, layers: r.layers, palette: r.palette, bounds: r.bounds };
})();`.trim();
      }
      case 'set_font_axes': {
        return `
// Variable-font axes (standard trio: weight/width/slant — Canvas 2D has no custom axes)
(function() {
  if (typeof app.setFontAxes !== 'function') { return { success: false, error: 'app.setFontAxes unavailable — update FxTool to a variable-font build' }; }
  const r = app.setFontAxes(${S(input.itemId)}, ${S(input.axes)});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'axes failed' }; }
  // rejected is the interesting half: an axis silently ignored is the failure
  // mode this surface exists to prevent. And NOTHING applied while something
  // was rejected is not a success — it is the call doing nothing under a
  // success, which is the same shape as an empty batch reporting ok.
  const _applied = r.applied || {};
  const _rejected = r.rejected || [];
  const _appliedCount = Array.isArray(_applied) ? _applied.length : Object.keys(_applied).length;
  if (_appliedCount === 0 && _rejected.length) {
    return { success: false, action: 'set_font_axes', applied: _applied, rejected: _rejected,
      error: 'no axis was applied. The font does not have: ' + _rejected.join(', ')
        + (r.note ? '. ' + r.note : '') };
  }
  return { success: true, action: 'set_font_axes', applied: _applied, rejected: _rejected,
    ...(r.note ? { note: r.note } : {}) };
})();`.trim();
      }
      // 'list' is the spelling pinepaper_text_effect uses for the same action,
      // accepted here so moving between the two tools does not dead-end.
      case 'list':
      case 'list_styles': {
        return `
// Text styles + palettes + font axes — the picker surface
(function() {
  if (typeof app.listTextStyles !== 'function') { return { success: false, error: 'app.listTextStyles unavailable — update FxTool to a text-styles build' }; }
  return {
    success: true,
    styles: app.listTextStyles(),
    palettes: typeof app.listTextPalettes === 'function' ? app.listTextPalettes() : [],
    fontAxes: typeof app.listFontAxes === 'function' ? app.listFontAxes() : null,
  };
})();`.trim();
      }

      case 'cursive':
        return `
// Text: write it as STROKED handwriting — a path, not a glyph
(function() {
  if (typeof app.createCursiveText !== 'function') { return { success: false, error: 'app.createCursiveText unavailable — update FxTool' }; }
  // createCursiveText answers { items, group, totalWidth, bounds } — not an
  // item — so reading .data.id off the answer returned no id, every time. The
  // group is registered only on one of its two branches; the other is
  // registered here so the caller always gets an addressable id.
  const r = app.createCursiveText(${S(input.text)}, ${S(input.cursiveOptions ?? {})});
  const g = r && (r.group || (r.data ? r : null));
  if (!g) { return { success: false, error: 'the cursive text produced no path' }; }
  let itemId = g.data && (g.data.id || g.data.registryId);
  if (!itemId && app.itemRegistry && typeof app.itemRegistry.register === 'function') {
    itemId = app.itemRegistry.register(g, 'cursiveText', { content: ${S(input.text)} }, 'user');
  }
  if (!itemId) { return { success: false, error: 'the cursive text was drawn but not registered — no usable item id.' }; }
  return { success: true, itemId: itemId, strokes: (r.items || []).length, width: r.totalWidth };
})();`.trim();

      case 'wrap':
        return `
// Text: break to a width — reversibly
(function() {
  if (typeof app.wrapText !== 'function') { return { success: false, error: 'app.wrapText unavailable — update FxTool' }; }
  const r = app.wrapText(${S(input.itemId)}, ${S(input.maxWidth)});
  if (!r || r.ok === false) { return { success: false, error: (r && r.error) || 'that item could not be wrapped' }; }
  return { success: true, ...r };
})();`.trim();

      case 'unwrap':
        return `
// Text: restore the single line wrap replaced
(function() {
  if (typeof app.unwrapText !== 'function') { return { success: false, error: 'app.unwrapText unavailable — update FxTool' }; }
  // 'not wrapped' is the engine's own refusal and is more useful than
  // anything this layer could infer, so it is passed through.
  const r = app.unwrapText(${S(input.itemId)});
  if (!r || r.ok === false) { return { success: false, error: (r && r.error) || 'that item is not wrapped' }; }
  return { success: true, ...r };
})();`.trim();

      case 'to_collage':
        return `
// Text: turn an EXISTING text item into a letter collage, in place
(function() {
  if (typeof app.convertTextToCollage !== 'function') { return { success: false, error: 'app.convertTextToCollage unavailable — update FxTool' }; }
  const item = app.getItemById ? app.getItemById(${S(input.itemId)}) : null;
  if (!item) { return { success: false, error: 'no such item: ' + ${S(input.itemId)} }; }
  // Returns null when there is no letterCollage subsystem — a bare null that
  // would otherwise read as "the conversion did nothing to your text".
  const r = app.convertTextToCollage(item, ${S(input.text ?? null)} || item.content, ${S(input.collageOptions ?? {})});
  if (!r) { return { success: false, error: 'the collage system is unavailable in this build, so the text was left as it was' }; }
  return { success: true, collage: r };
})();`.trim();
    }
  }

  /**
   * pinepaper_text_effect — the 37 character-level text effects.
   *
   * `applyTextEffect` is ASYNC (it lazy-`import()`s the effects chunk), so this
   * emits an async IIFE — a sync wrapper would hand the bridge a pending
   * Promise instead of the result.
   *
   * The returned `items` are live Paper objects and cannot cross the bridge;
   * only ids/count/duration are forwarded. `ids` is the whole handle set the
   * caller now has, since the source item is gone.
   */
  /**
   * The medium axis. `list_media` and `resolve` are READS — they exist so an
   * agent can find out what this build can honestly make before it promises a
   * medium in prose, which is the failure the axis was built to prevent.
   */
  generateDesignMedium(input: DesignMediumInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const wrap = (comment: string, body: string) => `\n// ${comment}\n(function() {\n${body}\n})();`.trim();
    switch (input.action) {
      case 'list_media':
        return wrap('Medium: list',
          `  if (typeof app.listDesignMedia !== 'function') { return { success: false, error: 'medium axis unavailable — update FxTool' }; }
  const media = app.listDesignMedia();
  return { success: true, action: 'list_media', media: media, native: media.filter(function(m) { return m.fidelity === 'native'; }).map(function(m) { return m.key; }) };`);
      case 'resolve':
        return wrap('Medium: resolve',
          `  if (typeof app.resolveDesignMedium !== 'function') { return { success: false, error: 'medium axis unavailable — update FxTool' }; }
  const v = app.resolveDesignMedium(${S(input.medium)});
  return Object.assign({ success: true, action: 'resolve' }, v);`);
      case 'list_stitches':
        return wrap('Medium: list stitches',
          `  if (typeof app.listStitches !== 'function') { return { success: false, error: 'thread medium unavailable — update FxTool' }; }
  const stitches = app.listStitches();
  return { success: true, action: 'list_stitches', stitches: stitches, count: stitches.length };`);
      case 'apply_thread': {
        const opts = S({
          ...(input.stitch !== undefined ? { stitch: input.stitch } : {}),
          ...(input.field !== undefined ? { field: input.field } : {}),
          ...(input.stitchLen !== undefined ? { stitchLen: input.stitchLen } : {}),
          ...(input.rowGap !== undefined ? { rowGap: input.rowGap } : {}),
          ...(input.variance !== undefined ? { variance: input.variance } : {}),
          ...(input.width !== undefined ? { width: input.width } : {}),
          ...(input.sheen !== undefined ? { sheen: input.sheen } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
          ...(input.count !== undefined ? { count: input.count } : {}),
          ...(input.slant !== undefined ? { slant: input.slant } : {}),
          ...(input.overlap !== undefined ? { overlap: input.overlap } : {}),
          ...(input.stagger !== undefined ? { stagger: input.stagger } : {}),
          ...(input.gapLen !== undefined ? { gapLen: input.gapLen } : {}),
          ...(input.gridSize !== undefined ? { gridSize: input.gridSize } : {}),
        });
        const roughStr = JSON.stringify(input.roughness ?? 0);
        const seedStr = JSON.stringify(input.seed ?? 1);
        return wrap('Medium: render in thread',
          `  if (typeof app.applyThreadPainting !== 'function') { return { success: false, error: 'thread medium unavailable — update FxTool' }; }
  const entry = app.itemRegistry && app.itemRegistry.get(${S(input.itemId)});
  const src = entry && entry.item;
  if (!src) { return { success: false, action: 'apply_thread', error: 'no item ' + ${S(input.itemId)} }; }
  // Check the shape BEFORE calling, so the refusal can name the fix. The
  // engine warns to a console production strips, which an agent never sees.
  if (src.content !== undefined && typeof src.getPointAt !== 'function') {
    return { success: false, action: 'apply_thread', error: 'a text item has no outline to stitch. Convert it to glyph paths first (pinepaper_text_style), then stitch the result — the collage it produces is a group of closed paths, which this accepts.' };
  }
  const g = app.applyThreadPainting(${S(input.itemId)}, ${opts});
  if (!g) { return { success: false, action: 'apply_thread', error: 'nothing stitchable here — thread needs a CLOSED path, a compound path, or a group containing them. An open stroke, a raster and an empty group all land here. (If you passed a stitch name, check it against list_stitches.)' }; }
  // HAND WOBBLE, applied here rather than in the engine, which has no such
  // option. Every point of every stitch gets its own phase off the seed, so a
  // long contour wobbles along its whole length instead of shearing at one end,
  // and the same seed sews the same irregularities every run.
  const rough = ${roughStr};
  if (rough > 0 && g.children) {
    const rseed = ${seedStr};
    for (let i = 0; i < g.children.length; i++) {
      const line = g.children[i];
      if (!line || !line.segments) continue;
      for (let j = 0; j < line.segments.length; j++) {
        line.segments[j].point.x += Math.sin(rseed + i * 2.13 + j * 1.71) * rough * 0.4;
        line.segments[j].point.y += Math.cos(rseed + i * 3.47 + j * 2.29) * rough * 0.4;
      }
    }
  }
  return { success: true, action: 'apply_thread', groupId: (g.data && g.data.id) || null, stitches: g.children.length, roughness: rough };`);
      }
      case 'list_flow_fields':
        return wrap('Medium: list flow fields',
          `  if (typeof app.listFlowFields !== 'function') { return { success: false, error: 'hatch medium unavailable — update FxTool' }; }
  const fields = app.listFlowFields();
  return { success: true, action: 'list_flow_fields', fields: fields, count: fields.length };`);
      case 'list_hatch_options':
        return wrap('Medium: hatch defaults',
          `  if (typeof app.listHatchOptions !== 'function') { return { success: false, error: 'hatch medium unavailable — update FxTool' }; }
  return { success: true, action: 'list_hatch_options', defaults: app.listHatchOptions() };`);
      case 'apply_hatch': {
        const opts = S({
          ...(input.distance !== undefined ? { distance: input.distance } : {}),
          ...(input.angle !== undefined ? { angle: input.angle } : {}),
          ...(input.gradient !== undefined ? { gradient: input.gradient } : {}),
          ...(input.rand !== undefined ? { rand: input.rand } : {}),
          ...(input.continuous !== undefined ? { continuous: input.continuous } : {}),
          ...(input.flowField !== undefined ? { field: input.flowField } : {}),
          ...(input.t !== undefined ? { t: input.t } : {}),
          ...(input.width !== undefined ? { width: input.width } : {}),
          ...(input.color !== undefined ? { color: input.color } : {}),
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
        });
        return wrap('Medium: rule an item with hatching',
          `  if (typeof app.applyHatching !== 'function') { return { success: false, error: 'hatch medium unavailable — update FxTool' }; }
  const entry = app.itemRegistry && app.itemRegistry.get(${S(input.itemId)});
  const src = entry && entry.item;
  if (!src) { return { success: false, action: 'apply_hatch', error: 'no item ' + ${S(input.itemId)} }; }
  // Every refusal below is one the engine only console.warns, and production
  // strips the console — so an agent would otherwise get a bare null and no
  // idea which of five different things went wrong.
  if (src.content !== undefined && typeof src.getPointAt !== 'function') {
    return { success: false, action: 'apply_hatch', error: 'a text item has no outline to hatch. Convert it to glyph paths first (pinepaper_text_style), then hatch the result — the collage it produces is a group of closed paths, which this accepts.' };
  }
  // Count the closed paths BEFORE the call, so a truncated group can be
  // reported as truncated rather than looking complete.
  let closed = 0;
  const isGroup = src.children && !(typeof src.getPointAt === 'function' && src.closed);
  if (isGroup) {
    const walk = function(n) {
      for (const c of (n.children || [])) {
        if (c.children && typeof c.getPointAt !== 'function') walk(c);
        else if (typeof c.getPointAt === 'function' && c.closed && c.length > 0) closed++;
      }
    };
    walk(src);
    if (!closed) { return { success: false, action: 'apply_hatch', error: 'that group contains no closed paths to hatch — hatching needs a closed outline, and open strokes, rasters and empty groups all land here.' }; }
  }
  const b = src.bounds;
  const g = app.applyHatching(${S(input.itemId)}, ${opts});
  if (!g) {
    // Spacing wider than the shape is the usual cause and is otherwise a
    // silent no-op: the item just vanishes behind an empty group.
    return { success: false, action: 'apply_hatch', error: 'nothing was ruled. Most often the spacing exceeds the shape — distance is ' + ${S(input.distance ?? 6)} + 'px against bounds ' + Math.round(b.width) + 'x' + Math.round(b.height) + '. Otherwise the item has no closed outline: hatching needs a closed path, a compound path, or a group of them.' };
  }
  const parts = (g.data && g.data.parts) || null;
  return {
    success: true,
    action: 'apply_hatch',
    groupId: (g.data && g.data.id) || null,
    lines: g.children ? g.children.length : 0,
    angle: (g.data && g.data.angle) !== undefined ? g.data.angle : null,
    spacing: (g.data && g.data.spacing) !== undefined ? g.data.spacing : null,
    // The engine hatches at most 40 paths from a group and warns about the rest.
    ...(parts !== null ? { parts: parts } : {}),
    ...(closed > 40 ? { truncated: 'hatched the first 40 of ' + closed + ' closed paths' } : {}),
    // Re-hatching REPLACES: a second set of lines over the first is
    // indistinguishable from nothing having happened, so trying spacings in
    // turn is safe and is the flow this exists for.
    note: 'the source item is now hidden behind the hatching; re-hatching replaces rather than stacks',
  };`);
      }
      default:
        return wrap('Medium: unknown action', `  return { success: false, error: 'unknown action' };`);
    }
  }

  generateTextEffect(input: TextEffectInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    switch (input.action) {
      case 'apply': {
        // options spreads FIRST so the named fields win on collision — the
        // schema advertises that precedence, so it has to be real here.
        const opts = S({
          ...(input.options ?? {}),
          ...(input.duration !== undefined ? { duration: input.duration } : {}),
          ...(input.seed !== undefined ? { seed: input.seed } : {}),
          ...(input.gradient !== undefined ? { gradient: input.gradient } : {}),
          ...(input.gradientStops !== undefined ? { gradientStops: input.gradientStops } : {}),
          ...(input.gradientDirection !== undefined ? { gradientDirection: input.gradientDirection } : {}),
          ...(input.gradientSteps !== undefined ? { gradientSteps: input.gradientSteps } : {}),
          ...(input.keepSource !== undefined ? { keepSource: input.keepSource } : {}),
        });
        return `
// Text effect: ${input.effect} — the text becomes one animated item PER CHARACTER
(async function() {
  if (typeof app.applyTextEffect !== 'function') { return { success: false, error: 'app.applyTextEffect unavailable — update FxTool to a text-effects build' }; }
  const r = await app.applyTextEffect(${S(input.itemId)}, ${S(input.effect)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'text effect failed' }; }
  // r.items are live Paper objects — NOT serializable, deliberately dropped.
  // The source item id is GONE unless keepSource was set, so r.ids is now the
  // caller's entire handle set; returning it is what makes the tool usable.
  // EVERY EFFECT PLAYS FROM t=0, so in a multi-shot video they all fire on the
  // opening frame and only the first title reads. The engine has no start
  // delay, so the keyframes it just wrote are shifted here — the same thing a
  // caller was doing by hand through execute_custom_code.
  //
  // Shifted, then held: without an explicit invisible keyframe at 0 the
  // characters sit in their FIRST pose until the effect starts, which for most
  // of the 37 is a scatter that looks like a bug. hideAfter closes the other
  // end, because they otherwise survive to the end of the clip.
  const _startAt = ${S(input.startAt ?? 0)};
  const _hideAfter = ${S(input.hideAfter ?? null)};
  let _shifted = 0;
  if ((_startAt > 0 || _hideAfter) && Array.isArray(r.ids)) {
    for (const _id of r.ids) {
      const _it = app.getItemById && app.getItemById(_id);
      const _kfs = _it && _it.data && _it.data.keyframes;
      if (!Array.isArray(_kfs) || _kfs.length === 0) continue;
      if (_startAt > 0) {
        for (const _k of _kfs) _k.time += _startAt;
        _kfs.unshift({ time: 0, properties: { opacity: 0 }, easing: 'linear' });
        _kfs.splice(1, 0, { time: Math.max(0, _startAt - 0.001), properties: { opacity: 0 }, easing: 'linear' });
      }
      if (_hideAfter) {
        _kfs.push({ time: Math.max(0, _hideAfter - 0.001), properties: { opacity: 1 }, easing: 'linear' });
        _kfs.push({ time: _hideAfter, properties: { opacity: 0 }, easing: 'linear' });
      }
      _kfs.sort((a, b) => a.time - b.time);
      _shifted++;
    }
  }
  return {
    success: true, action: 'apply', effect: r.effect, ids: r.ids, count: r.count,
    duration: (r.duration || 0) + _startAt, sourceRemoved: ${S(input.keepSource !== true)},
    ...(_startAt > 0 ? { startAt: _startAt } : {}),
    ...(_hideAfter ? { hideAfter: _hideAfter } : {}),
    ...((_startAt > 0 || _hideAfter) ? { retimed: _shifted } : {}),
  };
})();`.trim();
      }
      case 'list': {
        return `
// The 37 character-level text effects — the picker surface
(async function() {
  if (typeof app.listTextEffects !== 'function') { return { success: false, error: 'app.listTextEffects unavailable — update FxTool to a text-effects build' }; }
  const effects = await app.listTextEffects();
  return { success: true, effects, count: effects.length };
})();`.trim();
      }
    }
  }

  /**
   * Shatter a raster into a grid of tiles. The group INHERITS the original's
   * registry id (relations/handles keep pointing at the thing in its place),
   * and the result is deliberately inert until something animates the pieces.
   */
  generateShatterImage(input: ShatterImageInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const opts = S({
      ...(input.pieces !== undefined ? { pieces: input.pieces } : {}),
      ...(input.rows !== undefined ? { rows: input.rows } : {}),
      ...(input.cols !== undefined ? { cols: input.cols } : {}),
      ...(input.keepSource !== undefined ? { keepSource: input.keepSource } : {}),
    });
    return `
// Shatter ${input.itemId} into tiles (inert until animated — that is the point)
(function() {
  if (typeof app.shatterImage !== 'function') { return { success: false, error: 'app.shatterImage unavailable — update FxTool to a shatter-capable build' }; }
  const r = app.shatterImage(${S(input.itemId)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'shatter failed' }; }
  // groupId === the original item's id (adopted). tiles/rows/cols tell the
  // caller what grid they actually got — 100 pieces of a 3:2 photo is 12x8=96.
  return { success: true, groupId: r.groupId, tiles: r.tiles, rows: r.rows, cols: r.cols };
})();`.trim();
  }

  /**
   * Import a decomposed character (layer manifest + per-layer images) as a
   * role-bound Group. The facade is async and does its own heavy-module
   * loading (the cold-boot rigging-rules trap is handled inside it).
   */
  generateImportLayeredCharacter(input: ImportLayeredCharacterInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const opts = S({
      ...(input.position !== undefined ? { position: input.position } : {}),
      ...(input.scale !== undefined ? { scale: input.scale } : {}),
      ...(input.name !== undefined ? { name: input.name } : {}),
    });
    return `
// Import a layered character (decomposer output → role-bound parts; blink works out of the box)
(async function() {
  if (typeof app.importLayeredCharacter !== 'function') { return { success: false, error: 'app.importLayeredCharacter unavailable — update FxTool to a layered-character build' }; }
  // The importer's contract is a Map (it calls images.get) — the wire format is
  // a plain object, so rebuild the Map here.
  const bundle = { info: ${S(input.info)}, images: new Map(Object.entries(${S(input.images)})) };
  const r = await app.importLayeredCharacter(bundle, ${opts});
  if (!r || !r.groupId) { return { success: false, error: (r && r.error) || 'layered character import failed' }; }
  // roles maps part roles → item ids; zero roles wired means the character
  // renders but will NOT animate — surface the count so that cannot hide.
  return { success: true, groupId: r.groupId, parts: (r.parts || []).length, roles: r.roles || {}, rolesWired: Object.keys(r.roles || {}).length, warnings: r.warnings || [] };
})();`.trim();
  }

  /**
   * pinepaper_game — pathfinding + tilemaps via the PinePaper facades.
   * Both are pure data ops; the interesting glue is in the doc: paths feed
   * moves_along_path, collisionRects feed pinepaper_physics.
   */
  generateGame(input: GameInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    switch (input.action) {
      case 'pathfind': {
        const opts = S({ ...(input.diagonal !== undefined ? { diagonal: input.diagonal } : {}) });
        return `
// A* pathfind — waypoints for moves_along_path
(async function() {
  if (typeof app.findPath !== 'function') { return { success: false, error: 'app.findPath unavailable — update FxTool to a games-capable build' }; }
  const r = await app.findPath(${S(input.grid)}, ${S(input.start)}, ${S(input.goal)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'pathfind failed' }; }
  // path is world-space [{x,y}] — feed it DIRECTLY to pinepaper_add_relation
  // moves_along_path params.path, or to a keyframe track.
  return { success: true, path: r.path, waypoints: r.path.length };
})();`.trim();
      }
      case 'create_tilemap': {
        const spec = S({
          cols: input.cols, rows: input.rows,
          ...(input.tileSize !== undefined ? { tileSize: input.tileSize } : {}),
          ...(input.origin !== undefined ? { origin: input.origin } : {}),
          ...(input.tileset !== undefined ? { tileset: input.tileset } : {}),
          ...(input.fills !== undefined ? { fills: input.fills } : {}),
        });
        return `
// Tilemap: board data + pathfinding grid + merged collision rects
(async function() {
  if (typeof app.createTilemap !== 'function') { return { success: false, error: 'app.createTilemap unavailable — update FxTool to a games-capable build' }; }
  const r = await app.createTilemap(${spec});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'tilemap failed' }; }
  // map: persist it (item.data / project document) — it is DATA, not items;
  // grid: pass straight back into pathfind; collisionRects: pinepaper_physics
  // bodies (greedy-merged, so a 60x1 wall is ONE rect, not 60).
  return { success: true, map: r.map, grid: r.grid, collisionRects: r.collisionRects, rectCount: r.collisionRects.length };
})();`.trim();
      }
    }
  }

  /**
   * pinepaper_world3d — every action rides the PinePaper world facades. The
   * world is lazily created by createWorld3D; every other action guards on the
   * facade AND on a world existing, with the create hint in the error.
   */
  generateWorld3D(input: World3DInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const needWorld = `  if (!app._world3d) { return { success: false, error: "no 3D world — call pinepaper_world3d create first" }; }`;
    switch (input.action) {
      case 'create': {
        const opts = S({ ...(input.character !== undefined ? { character: input.character } : {}) });
        return `
// World3D: create — terrain, sky, shadows, walkable character, under the Paper canvas
(async function() {
  if (typeof app.createWorld3D !== 'function') { return { success: false, error: 'app.createWorld3D unavailable — update FxTool to a world3d-capable build' }; }
  await app.createWorld3D(${S(world3dColors(input.spec ?? 'forest'))}, ${opts});
  // describe() is the world's own parameter schema — return the preset list +
  // top-level keys so the agent knows what configure can touch, without the
  // full multi-KB schema on every create.
  const d = typeof app.describeWorld3D === 'function' ? await app.describeWorld3D() : null;
  return { success: true, action: 'create', spec: ${S(input.spec ?? 'forest')}, configurableKeys: d ? Object.keys(d.params || d) : [] };
})();`.trim();
      }
      case 'describe':
        return `
// World3D: the engine's own parameter schema — types, ranges, descriptions
(async function() {
  if (typeof app.describeWorld3D !== 'function') { return { success: false, error: 'app.describeWorld3D unavailable — update FxTool' }; }
  return { success: true, schema: await app.describeWorld3D() };
})();`.trim();
      case 'configure':
        return `
// World3D: live configure (deep-merged, schema-validated)
(function() {
  if (typeof app.configureWorld3D !== 'function') { return { success: false, error: 'app.configureWorld3D unavailable — update FxTool' }; }
${needWorld}
  const r = app.configureWorld3D(${S(world3dColors(input.patch))});
  // The validator names the right key on a wrong one — forward it verbatim.
  return r && r.ok ? { success: true, action: 'configure' } : { success: false, error: (r && r.error) || 'configure failed' };
})();`.trim();
      case 'add_actor': {
        const actor = S({
          ...(input.actorId !== undefined ? { id: input.actorId } : {}),
          ...(input.x !== undefined ? { x: input.x } : {}),
          ...(input.z !== undefined ? { z: input.z } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          ...(input.sprite !== undefined ? { sprite: input.sprite } : {}),
          ...(input.live !== undefined ? { live: input.live } : {}),
        });
        return `
// World3D: put an actor on the stage${input.live ? ' (live sprite — a rigged character PERFORMS, not a photograph of itself)' : ''}
(function() {
  if (typeof app.addWorldActor !== 'function') { return { success: false, error: 'app.addWorldActor unavailable — update FxTool' }; }
${needWorld}
  const id = app.addWorldActor(${actor});
  return id ? { success: true, actorId: id } : { success: false, error: 'actor not added — is the sprite id a canvas item?' };
})();`.trim();
      }
      case 'remove_actor':
        return `
// World3D: remove actor
(function() {
${needWorld}
  return { success: !!app.removeWorldActor(${S(input.actorId)}), actorId: ${S(input.actorId)} };
})();`.trim();
      case 'list_actors':
        return `
// World3D: the addressable stage
(function() {
${needWorld}
  return { success: true, actors: app.listWorldActors() };
})();`.trim();
      case 'set_actor_pose':
        return `
// World3D: pose an actor — the setter a timeline, sequencer or agent drives
(function() {
${needWorld}
  return { success: !!app.setWorldActorPose(${S(input.actorId)}, ${S(input.pose)}), actorId: ${S(input.actorId)} };
})();`.trim();
      case 'set_camera':
        return `
// World3D: direct the camera (follow | fixed | orbit)
(function() {
${needWorld}
  const r = app.setWorldCamera(${S(input.camera)});
  return r === false ? { success: false, error: 'camera config rejected' } : { success: true };
})();`.trim();
      case 'add_object':
        return `
// World3D: place an object (y defaults to sitting on the terrain)
(function() {
${needWorld}
  const id = app.addWorldObject(${S(world3dColors(input.object))});
  return id ? { success: true, objectId: id } : { success: false, error: 'object not added' };
})();`.trim();
      case 'remove_object':
        return `
// World3D: remove object
(function() {
${needWorld}
  return { success: !!app.removeWorldObject(${S(input.objectId)}), objectId: ${S(input.objectId)} };
})();`.trim();
      case 'remove_world':
        return `
// World3D: tear the world down — Paper's canvas is untouched (it was always its own layer)
(function() {
  if (typeof app.removeWorld3D !== 'function') { return { success: false, error: 'app.removeWorld3D unavailable — update FxTool' }; }
  return { success: !!app.removeWorld3D() };
})();`.trim();

      // --- Mesh authoring ---------------------------------------------------
      // extrudeToMesh / latheToMesh REFUSE by name when there is no world
      // ({ok:false, reason}), so their reason is passed through rather than
      // pre-empted with a second wording for the same condition. The facade
      // check stays, because a studio without the method is a different fault.
      case 'extrude_path':
      case 'lathe_path': {
        const fn = input.action === 'extrude_path' ? 'extrudeToMesh' : 'latheToMesh';
        const mesh = { ...(input.mesh ?? {}) } as Record<string, unknown>;
        // rotY is RADIANS on this path — stored raw and handed to cos()/sin()
        // in the shader. rotYDegrees is the convenience spelling and is folded
        // in here so only one of them ever reaches the engine.
        if (typeof mesh.rotYDegrees === 'number') {
          if (mesh.rotY === undefined) mesh.rotY = (mesh.rotYDegrees as number) * Math.PI / 180;
          delete mesh.rotYDegrees;
        }
        // A COLOUR, NOT A BLACK MESH (round 9 HH, 5.64). The default mesh
        // shader reads `uniform vec3 diffuse` (0..1) plus metalness / roughness,
        // and extrude / lathe passed no uniforms — so every authored mesh
        // rendered black and there was no parameter to change it. color (hex,
        // [r,g,b] 0..255 or 0..1) becomes diffuse; with none given it is a
        // neutral light grey, which lights readably. Explicit uniforms win.
        {
          const uniforms = { ...((mesh.uniforms as Record<string, unknown>) ?? {}) };
          if (uniforms.diffuse === undefined) uniforms.diffuse = mesh.color !== undefined ? world3dColor(mesh.color) : [0.8, 0.8, 0.8];
          if (uniforms.metalness === undefined && typeof mesh.metalness === 'number') uniforms.metalness = mesh.metalness;
          if (uniforms.roughness === undefined) uniforms.roughness = typeof mesh.roughness === 'number' ? mesh.roughness : 0.6;
          delete mesh.color; delete mesh.metalness; delete mesh.roughness;
          mesh.uniforms = uniforms;
        }
        return `
// World3D: ${input.action} — a canvas path becomes real geometry
(async function() {
  // @engine-methods extrudeToMesh latheToMesh importOBJToWorld importGLTFToWorld
  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool to a world3d-capable build' }; }
  const r = await app.${fn}(${S(input.pathId)}, ${S(mesh)});
  if (!r || r.ok === false) { return { success: false, error: (r && r.reason) || 'the world refused the mesh' }; }
  return { success: true, meshId: r.id, op: ${S(input.action === 'extrude_path' ? 'extrude' : 'lathe')}, sourceId: ${S(input.pathId)} };
})();`.trim();
      }

      case 'list_meshes':
        return `
// World3D: every authored mesh on the stage
(function() {
  if (typeof app.listWorldMeshes !== 'function') { return { success: false, error: 'app.listWorldMeshes unavailable — update FxTool' }; }
  return { success: true, meshes: app.listWorldMeshes() };
})();`.trim();

      case 'remove_mesh':
        return `
// World3D: drop a mesh
(function() {
  if (typeof app.removeWorldMesh !== 'function') { return { success: false, error: 'app.removeWorldMesh unavailable — update FxTool' }; }
  return { success: !!app.removeWorldMesh(${S(input.meshId)}) };
})();`.trim();

      // --- Lights -----------------------------------------------------------
      // addWorldLight THROWS when there is no world, so this one is guarded
      // ahead of the call rather than reading a refusal back.
      case 'add_light':
        return `
// World3D: add a point light — at most 8, and the ninth is refused by name
(function() {
  if (typeof app.addWorldLight !== 'function') { return { success: false, error: 'app.addWorldLight unavailable — update FxTool' }; }
${needWorld}
  const r = app.addWorldLight(${S(input.light ?? {})});
  if (!r || r.ok === false) { return { success: false, error: (r && r.error) || 'the world refused the light' }; }
  return { success: true, lightId: r.id, light: r.light };
})();`.trim();

      case 'set_light':
        return `
// World3D: edit a light in place
(function() {
  if (typeof app.setWorldLight !== 'function') { return { success: false, error: 'app.setWorldLight unavailable — update FxTool' }; }
  return { success: !!app.setWorldLight(${S(input.lightId)}, ${S(input.light ?? {})}) };
})();`.trim();

      case 'remove_light':
        return `
// World3D: drop a light
(function() {
  if (typeof app.removeWorldLight !== 'function') { return { success: false, error: 'app.removeWorldLight unavailable — update FxTool' }; }
  return { success: !!app.removeWorldLight(${S(input.lightId)}) };
})();`.trim();

      case 'list_lights':
        return `
// World3D: every light, with position, colour, intensity and range
(function() {
  if (typeof app.listWorldLights !== 'function') { return { success: false, error: 'app.listWorldLights unavailable — update FxTool' }; }
  return { success: true, lights: app.listWorldLights() };
})();`.trim();

      // --- Materials --------------------------------------------------------
      case 'add_material':
        return `
// World3D: a named, SHARED surface — one edit restyles every object using it
(function() {
  if (typeof app.addWorldMaterial !== 'function') { return { success: false, error: 'app.addWorldMaterial unavailable — update FxTool' }; }
${needWorld}
  const r = app.addWorldMaterial(${S(input.material ?? {})});
  if (!r || r.ok === false) { return { success: false, error: (r && r.error) || 'the world refused the material' }; }
  return { success: true, materialId: r.id, material: r.material };
})();`.trim();

      case 'set_material':
        return `
// World3D: patch a material — every object referencing it changes next frame
(function() {
  if (typeof app.setWorldMaterial !== 'function') { return { success: false, error: 'app.setWorldMaterial unavailable — update FxTool' }; }
  return { success: !!app.setWorldMaterial(${S(input.materialId)}, ${S(input.material ?? {})}) };
})();`.trim();

      case 'remove_material':
        return `
// World3D: drop a material
(function() {
  if (typeof app.removeWorldMaterial !== 'function') { return { success: false, error: 'app.removeWorldMaterial unavailable — update FxTool' }; }
  return { success: !!app.removeWorldMaterial(${S(input.materialId)}) };
})();`.trim();

      case 'list_materials':
        return `
// World3D: every material, with the knobs that actually render
(function() {
  if (typeof app.listWorldMaterials !== 'function') { return { success: false, error: 'app.listWorldMaterials unavailable — update FxTool' }; }
  return { success: true, materials: app.listWorldMaterials() };
})();`.trim();

      // --- Import -----------------------------------------------------------
      // Both importers THROW when there is no world, so both are guarded ahead.
      case 'import_obj':
      case 'import_gltf': {
        const fn = input.action === 'import_obj' ? 'importOBJToWorld' : 'importGLTFToWorld';
        return `
// World3D: ${input.action}
(async function() {
  // @engine-methods extrudeToMesh latheToMesh importOBJToWorld importGLTFToWorld
  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool to a world3d-capable build' }; }
${needWorld}
  const r = await app.${fn}(${S(input.source)}, ${S(input.importOptions ?? {})});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.error || r.reason)) || 'the world refused the import' }; }
  return { success: true, meshIds: r.ids, ...r };
})();`.trim();
      }

      case 'list_mesh_clips':
        return `
// World3D: the animation clips an imported skinned mesh carries
(function() {
  if (typeof app.listWorldMeshClips !== 'function') { return { success: false, error: 'app.listWorldMeshClips unavailable — update FxTool' }; }
${needWorld}
  return { success: true, clips: app.listWorldMeshClips(${S(input.meshId)}) };
})();`.trim();

      case 'set_mesh_clip':
        return `
// World3D: choose which clip a skinned mesh plays
(function() {
  if (typeof app.setWorldMeshClip !== 'function') { return { success: false, error: 'app.setWorldMeshClip unavailable — update FxTool' }; }
${needWorld}
  return { success: !!app.setWorldMeshClip(${S(input.meshId)}, ${S(input.clip)}${input.crossfade !== undefined ? `, { crossfade: ${S(input.crossfade)} }` : ''}) };
})();`.trim();

      // --- Navigation, picking, camera --------------------------------------
      // These facades answer `null` — or 0, for groundHeightAt — when there is
      // NO WORLD, which is indistinguishable from a real answer: ground really
      // can be at height 0, and a ray really can hit nothing. Guarded ahead so
      // "there is no world" never arrives disguised as a measurement.
      case 'set_nav_target':
        return `
// World3D: point the pointer at the 2D canvas or the 3D world
(function() {
  if (typeof app.setWorldNavTarget !== 'function') { return { success: false, error: 'app.setWorldNavTarget unavailable — update FxTool' }; }
  const r = app.setWorldNavTarget(${S(input.navTarget)});
  if (!r || r.ok === false) { return { success: false, error: (r && r.error) || 'the nav target was refused' }; }
  return { success: true, navTarget: ${S(input.navTarget)} };
})();`.trim();

      case 'get_nav_target':
        return `
// World3D: which layer the pointer currently drives
(function() {
  if (typeof app.getWorldNavTarget !== 'function') { return { success: false, error: 'app.getWorldNavTarget unavailable — update FxTool' }; }
  return { success: true, navTarget: app.getWorldNavTarget() };
})();`.trim();

      case 'ground_height':
        return `
// World3D: the terrain height under a world (x, z)
(function() {
  if (typeof app.groundHeightAt !== 'function') { return { success: false, error: 'app.groundHeightAt unavailable — update FxTool' }; }
${needWorld}
  const p = ${S(input.point)};
  return { success: true, height: app.groundHeightAt(p.x, p.z !== undefined ? p.z : p.y) };
})();`.trim();

      case 'raycast':
        return `
// World3D: cast a ray and report what it hits
(function() {
  if (typeof app.raycastWorld !== 'function') { return { success: false, error: 'app.raycastWorld unavailable — update FxTool' }; }
${needWorld}
  const hit = app.raycastWorld(${S(input.origin)}, ${S(input.direction)}, {});
  // A null here means MISSED, not "no world" — the guard above already
  // separated those two, which is the whole reason it is there.
  return { success: true, hit: hit || null, missed: !hit };
})();`.trim();

      case 'dolly_camera':
        return `
// World3D: dolly the camera — >1 away, <1 closer
(function() {
  if (typeof app.dollyWorldCamera !== 'function') { return { success: false, error: 'app.dollyWorldCamera unavailable — update FxTool' }; }
${needWorld}
  return { success: true, camera: app.dollyWorldCamera(${S(input.multiplier)}) };
})();`.trim();

      case 'pan_camera':
        return `
// World3D: pan the camera across the ground, in SCREEN pixels
(function() {
  if (typeof app.panWorldCamera !== 'function') { return { success: false, error: 'app.panWorldCamera unavailable — update FxTool' }; }
${needWorld}
  return { success: true, camera: app.panWorldCamera(${S(input.dx)}, ${S(input.dy)}) };
})();`.trim();

      case 'world_to_canvas':
        return `
// World3D: project a world point onto the Paper canvas
(function() {
  if (typeof app.worldToCanvas !== 'function') { return { success: false, error: 'app.worldToCanvas unavailable — update FxTool' }; }
${needWorld}
  return { success: true, point: app.worldToCanvas(${S(input.point)}) };
})();`.trim();

      case 'canvas_to_ground':
        return `
// World3D: where a canvas (x, y) lands on the world's ground
(function() {
  if (typeof app.canvasToGround !== 'function') { return { success: false, error: 'app.canvasToGround unavailable — update FxTool' }; }
${needWorld}
  const p = ${S(input.point)};
  return { success: true, ground: app.canvasToGround(p.x, p.y) };
})();`.trim();

      // --- Physics in the world ---------------------------------------------
      // addPhysicsBody3D and fireProjectile3D THROW without a world; the rest
      // return false, [] or a hollow {contacts:[],removed:[]} — each of which
      // is a plausible real answer. Both shapes are guarded the same way here.
      case 'add_body':
        return `
// World3D: a body under gravity, colliding with the world
(function() {
  if (typeof app.addPhysicsBody3D !== 'function') { return { success: false, error: 'app.addPhysicsBody3D unavailable — update FxTool' }; }
${needWorld}
  const r = app.addPhysicsBody3D(${S(input.body)});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.error || r.reason)) || 'the world refused the body' }; }
  return { success: true, bodyId: r.id, ...r };
})();`.trim();

      case 'fire_projectile':
        return `
// World3D: fire a projectile
(function() {
  if (typeof app.fireProjectile3D !== 'function') { return { success: false, error: 'app.fireProjectile3D unavailable — update FxTool' }; }
${needWorld}
  const r = app.fireProjectile3D(${S(input.body)});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.error || r.reason)) || 'the projectile was refused' }; }
  return { success: true, ...r };
})();`.trim();

      case 'remove_body':
        return `
// World3D: drop a body
(function() {
  if (typeof app.removePhysicsBody3D !== 'function') { return { success: false, error: 'app.removePhysicsBody3D unavailable — update FxTool' }; }
${needWorld}
  return { success: !!app.removePhysicsBody3D(${S(input.bodyId)}) };
})();`.trim();

      case 'list_bodies':
        return `
// World3D: every physics body
(function() {
  if (typeof app.listPhysicsBodies3D !== 'function') { return { success: false, error: 'app.listPhysicsBodies3D unavailable — update FxTool' }; }
${needWorld}
  return { success: true, bodies: app.listPhysicsBodies3D() };
})();`.trim();

      case 'step_physics':
        return `
// World3D: advance the simulation, and report what touched what
(function() {
  if (typeof app.stepPhysics3D !== 'function') { return { success: false, error: 'app.stepPhysics3D unavailable — update FxTool' }; }
${needWorld}
  // Without a world this answers {contacts:[],removed:[]} — a perfectly
  // ordinary quiet step. The guard above is what keeps those apart.
  const r = app.stepPhysics3D(${S(input.dt)});
  return { success: true, contacts: r && r.contacts, removed: r && r.removed };
})();`.trim();

      case 'impulse':
        return `
// World3D: apply an impulse
(function() {
  if (typeof app.applyPhysicsImpulse3D !== 'function') { return { success: false, error: 'app.applyPhysicsImpulse3D unavailable — update FxTool' }; }
${needWorld}
  return { success: !!app.applyPhysicsImpulse3D(${S(input.bodyId)}, ${S(input.vector)}) };
})();`.trim();

      case 'set_velocity':
        return `
// World3D: set a body's velocity outright
(function() {
  if (typeof app.setPhysicsVelocity3D !== 'function') { return { success: false, error: 'app.setPhysicsVelocity3D unavailable — update FxTool' }; }
${needWorld}
  return { success: !!app.setPhysicsVelocity3D(${S(input.bodyId)}, ${S(input.vector)}) };
})();`.trim();

      case 'line_of_sight':
        return `
// World3D: can one point see another
(function() {
  if (typeof app.worldLineOfSight !== 'function') { return { success: false, error: 'app.worldLineOfSight unavailable — update FxTool' }; }
${needWorld}
  return { success: true, clear: app.worldLineOfSight(${S(input.from)}, ${S(input.to)}) };
})();`.trim();

      case 'set_mesh_instances':
        return `
// World3D: replace a mesh's instance data — six floats each
(function() {
  if (typeof app.setWorldMeshInstances !== 'function') { return { success: false, error: 'app.setWorldMeshInstances unavailable — update FxTool' }; }
${needWorld}
  // x, y, z, scale, rotY (RADIANS, as everywhere on this path), variant.
  return { success: !!app.setWorldMeshInstances(${S(input.meshId)}, ${S(input.instances)}) };
})();`.trim();
    }
  }

  /**
   * pinepaper_design_system — answered in this server, not in the browser.
   *
   * Only `compose` with `draw` produces code at all: the tokens, the easings
   * and the style list are computed here and returned by the handler, because
   * a design decision does not need the canvas to be open. When a scene IS
   * drawn, it arrives as a finished list of create calls — the layout was
   * already decided by a pure function, so nothing is left for the page to
   * work out.
   */
  generateDesignCompose(scene: { width: number; height: number; backgroundHex?: string }, ops: Array<Record<string, unknown>>, style: string): string {
    const S = (v: unknown) => JSON.stringify(v);
    return `
// Design: compose a ${style} scene — ${ops.length} items, laid out server-side
(function() {
  if (typeof app.create !== 'function') { return { success: false, error: 'app.create unavailable — update FxTool' }; }
  const size = ${S({ width: scene.width, height: scene.height })};
  if (typeof app.setCanvasSize === 'function') { try { app.setCanvasSize(size.width, size.height); } catch (_) { /* a fixed canvas is not a failure */ } }
  ${scene.backgroundHex ? `if (typeof app.setBackgroundColor === 'function') { try { app.setBackgroundColor(${S(scene.backgroundHex)}); } catch (_) { /* ditto */ } }` : '// this style paints no background of its own'}
  const ops = ${S(ops)};
  const ids = [];
  const failed = [];
  for (const op of ops) {
    const { type, note, name, ...props } = op;
    try {
      const item = app.create(type, props);
      if (item) { ids.push(item.data && item.data.id); } else { failed.push({ name: name, type: type, reason: 'create returned nothing' }); }
    } catch (e) { failed.push({ name: name, type: type, reason: (e && e.message) || String(e) }); }
  }
  if (app.historyManager) app.historyManager.saveState();
  // A partial composition is reported as one. Half a poster that claims
  // success is worse than a poster that says which four elements are missing.
  return { success: failed.length === 0, style: ${S(style)}, itemIds: ids, itemCount: ids.length, failed: failed };
})();`.trim();
  }

  /**
   * pinepaper_stick — the vendored stick-figure kit.
   *
   * Both facades take one options bag, so the schema's named fields are
   * reassembled into it. Naming them individually is the point: the kit's
   * options were discoverable only by reading FxTool's source.
   */
  generateStick(input: StickInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const { action, ...rest } = input;
    const opts: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(rest)) if (v !== undefined) opts[k] = v;

    // SPREAD-THROUGH IS NOT THE SAME AS AGREEING.
    //
    // Everything above this line reaches app.stickFigure verbatim, which made
    // the schema look consumed to every guard we have while four fields meant
    // something the engine does not. The engine compares propSide against
    // 'L' | 'R', so 'right' — which the schema declared and advertised —
    // matched neither arm of that test and every prop went to the LEFT hand.
    // Nothing failed; the figure just held it in the wrong hand, forever.
    if (action === 'figure') {
      const side = typeof opts.propSide === 'string' ? opts.propSide : undefined;
      if (side) opts.propSide = side.toUpperCase().startsWith('R') ? 'R' : 'L';

      // The engine iterates opts.walk, so `true` — the form the schema itself
      // advertised as "the default" — walked exactly nowhere.
      if (opts.walk === true) opts.walk = [{ seconds: 1.2, from: 0 }];
      else if (opts.walk === false) delete opts.walk;

      // `facing` is read for chairs and for nothing else. Passing it here
      // would be accepted and ignored, which is the thing being fixed, so it
      // is refused by name instead — the add_ports precedent.
      if (opts.facing !== undefined) {
        // Built through S() rather than interpolated: the message names two
        // quoted values, and hand-escaping them into a single-quoted emitted
        // string produced a syntax error the first time.
        const msg =
          `facing is a property of a chair, not of a figure — app.stickFigure `
          + `never reads it, so ${String(opts.facing)} would have been accepted and ignored. `
          + `A figure faces the way it travels, so give it travel, or a pose that turns it. `
          + `facing belongs on action "set" with kind "chair".`;
        return `
// Stick: figure — refused, rather than accepted and ignored
({ success: false, error: ${S(msg)} });`.trim();
      }
    }

    const fn = action === 'figure' ? 'stickFigure' : 'stickSet';
    return `
// Stick: ${action}
(async function() {
  // @engine-methods stickFigure stickSet
  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool (the stick kit is vendored from mcp-cloud)' }; }
  const r = await app.${fn}(${S(opts)});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.reason || r.error)) || 'the stick kit produced nothing' }; }
  return { success: true, ...r };
})();`.trim();
  }

  /**
   * pinepaper_story — prose becomes a scene.
   *
   * `distill` deliberately draws nothing. A caller should be able to read what
   * the distiller made of the text and edit it before a scene is assembled
   * from it, rather than discovering the reading by looking at the result.
   */
  generateStory(input: StoryInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const opts = S(input.options ?? {});
    switch (input.action) {
      case 'distill':
        return `
// Story: reduce prose to beats, drawing NOTHING
(async function() {
  if (typeof app.distillArticle !== 'function') { return { success: false, error: 'app.distillArticle unavailable — update FxTool' }; }
  const beats = await app.distillArticle(${S(input.text)});
  if (!beats) { return { success: false, error: 'the distiller made nothing of that text' }; }
  return { success: true, beats: beats };
})();`.trim();

      case 'from_text':
        return `
// Story: distill and assemble in one call
(async function() {
  if (typeof app.storyFromText !== 'function') { return { success: false, error: 'app.storyFromText unavailable — update FxTool' }; }
  const r = await app.storyFromText(${S(input.text)}, ${opts});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.reason || r.error)) || 'the story did not assemble' }; }
  // NAMED FIELDS, not a spread. assembleStory returns its parts as live Paper
  // Groups, and a Paper item's graph reaches the editor's EVENT HANDLERS.
  // Structured clone — which is what the bridge uses — refuses to carry a
  // function, so the whole result threw DataCloneError and the message did not
  // survive the wrapping: an empty error string for a story that assembled
  // fine in-page. Not a cycle; JSON.stringify succeeded on this the whole time.
  // The groups have to stay for in-page callers, so the wrapper takes what
  // travels: the spec, the ids, the count.
  return { success: true, spec: r.spec, partIds: r.partIds, partCount: r.partCount, beats: r.beats };
})();`.trim();

      case 'apply_spec':
        return `
// Story: assemble a spec you already have
(async function() {
  if (typeof app.applyStorySpec !== 'function') { return { success: false, error: 'app.applyStorySpec unavailable — update FxTool' }; }
  const r = await app.applyStorySpec(${S(input.spec)}, ${opts});
  if (!r || r.ok === false) { return { success: false, error: (r && (r.reason || r.error)) || 'the spec did not assemble' }; }
  return { success: true, ...r };
})();`.trim();

      case 'plan_book':
        return `
// Story: lay images out as pages
(function() {
  if (typeof app.planBook !== 'function') { return { success: false, error: 'app.planBook unavailable — update FxTool' }; }
  const plan = app.planBook(${S(input.images)}, ${opts});
  if (!plan) { return { success: false, error: 'no plan came back for those images' }; }
  return { success: true, plan: plan };
})();`.trim();
    }
  }

  /**
   * pinepaper_interchange — Lottie, dotLottie, GLB, BVH, PNG sequence.
   *
   * Three of these refuse through `console.warn` and a falsy return, which the
   * production build strips — exportGLB with no perspective objects and
   * exportBVH with no rigging system both do exactly that. Over MCP there is no
   * console to read, so the PRECONDITION is checked here and named, rather than
   * letting a caller receive nothing and guess why.
   */
  // @engine-methods exportLottie exportDotLottie exportEngine.exportToStore exportEngine.readExport exportEngine.releaseExport
  generateInterchange(input: InterchangeInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const guard = (fn: string) =>
      `  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool' }; }`;
    const opts = S(input.options ?? {});

    switch (input.action) {
      case 'export_lottie':
      case 'export_dotlottie': {
        const fn = input.action === 'export_lottie' ? 'exportLottie' : 'exportDotLottie';
        return `
// Interchange: ${fn}
(async function() {
${guard(fn)}
  const out = await app.${fn}(${opts});
  if (!out) { return { success: false, error: '${fn} produced nothing — the scene may have no animatable content' }; }
  return { success: true, format: ${S(input.action === 'export_lottie' ? 'lottie' : 'dotlottie')}, data: out };
})();`.trim();
      }

      case 'import_lottie':
        return `
// Interchange: a Lottie back onto the canvas
(async function() {
${guard('importLottie')}
  // importLottie logs and returns falsy when the importer is absent — a
  // stripped console makes that indistinguishable from an empty animation.
  const r = await app.importLottie(${S(input.data)}, ${opts});
  if (!r) { return { success: false, error: 'the Lottie did not import — it may be malformed, or this build has no Lottie importer' }; }
  return { success: true, imported: r };
})();`.trim();

      case 'export_glb':
        return `
// Interchange: GLB of the perspective 3D objects
(async function() {
${guard('exportGLB')}
  // exportGLB warns and bails when nothing perspective exists. The warning is
  // stripped in production, so the precondition is checked here instead.
  const has3d = app._initialized && app._initialized.has && app._initialized.has('threeD');
  if (!has3d) { return { success: false, error: 'no perspective objects to export — create one with createObject3D first' }; }
  const out = await app.exportGLB(${opts});
  if (!out) { return { success: false, error: 'GLB export produced nothing' }; }
  return { success: true, format: 'glb', data: out };
})();`.trim();

      case 'export_bvh':
        return `
// Interchange: BVH of one skeleton's motion
(async function() {
${guard('exportBVH')}
  // Same shape as GLB: exportBVH warns and bails without a RiggingSystem.
  const rigged = app._initialized && app._initialized.has && app._initialized.has('riggingSystem');
  if (!rigged) { return { success: false, error: 'no rig to export — create a skeleton first (pinepaper_rigging)' }; }
  const out = await app.exportBVH(${S(input.skeletonId)}, ${opts});
  if (!out) { return { success: false, error: 'BVH export produced nothing for skeleton ' + ${S(input.skeletonId)} }; }
  return { success: true, format: 'bvh', skeletonId: ${S(input.skeletonId)}, data: out };
})();`.trim();

      case 'export_png_sequence':
        return `
// Interchange: one PNG per frame
(async function() {
${guard('exportPNGSequence')}
  // The studio does not size a sequence to the scene: without duration / fps
  // it writes its own default (measured 45 frames = 3 s at 15 fps for a 1 s
  // scene, 29 of them duplicates). Said in the result when that happened.
  const __pngSeqDefaults = ${JSON.stringify((() => {
    const o = (input.options ?? {}) as Record<string, unknown>;
    const missing = ['duration', 'fps'].filter((k) => o[k] === undefined);
    return missing.length ? { defaultsUsed: missing, note: `${missing.join(' and ')} not given, so the studio's own default length was used — it does not follow the scene (runs have measured 45 and 90 frames). Pass options.duration and options.fps to match the scene.` } : {};
  })())};
  const out = await app.exportPNGSequence(${opts});
  if (!out) { return { success: false, error: 'PNG sequence produced nothing' }; }
  // A BLOB SERIALISES TO {}. exporter.export() answers a Blob, and returning it
  // raw produced a success whose result was an empty object — which reads as
  // "it worked and gave me nothing" rather than "the bytes could not cross
  // the bridge". Structured clone drops a Blob's
  // contents; only a string survives.
  if (typeof Blob !== 'undefined' && out instanceof Blob) {
    const dataUrl = await new Promise(function(res, rej) {
      const fr = new FileReader();
      fr.onload = function() { res(fr.result); };
      fr.onerror = function() { rej(new Error('could not read the PNG sequence')); };
      fr.readAsDataURL(out);
    });
    return Object.assign({ success: true, format: 'png-sequence', data: dataUrl, mimeType: out.type || 'application/zip', size: out.size }, __pngSeqDefaults);
  }
  if (Array.isArray(out)) {
    return { success: true, format: 'png-sequence', frames: out.length,
      note: 'the frames stayed in the page — pass download: true to write them out.' };
  }
  return { success: true, format: 'png-sequence', result: out };
})();`.trim();
    }
  }

  /**
   * pinepaper_sound — synthesis, and the drawing that is the same object.
   *
   * Every facade here rides `app.audioGraph`, which is lazily built, so each
   * action guards the METHOD rather than assuming the graph. The canvas half
   * (`create`, `timbre_from_path`) goes through PinePaper directly.
   */
  generateSound(input: SoundInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const guard = (fn: string) =>
      `  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool' }; }`;
    const simple = (fn: string, args: string, key: string, label: string) => `
// Sound: ${label}
(function() {
${guard(fn)}
  return { success: true, ${key}: app.${fn}(${args}) };
})();`.trim();

    switch (input.action) {
      case 'list_instruments': return simple('listInstruments', '', 'instruments', 'the instrument catalogue');
      case 'list_percussion': return simple('listPercussion', '', 'percussion', 'the percussion catalogue');
      case 'list_sfx': return simple('listSfx', '', 'sfx', 'the SFX catalogue');

      case 'play_tone': return simple('playTone', `${S(input.note)}, ${S(input.options ?? {})}`, 'played', `tone ${input.note}`);
      case 'play_chord': return simple('playChord', `${S(input.root)}, ${S(input.chord)}, ${S(input.options ?? {})}`, 'played', `${input.chord} chord on ${input.root}`);
      case 'chord_frequencies': return simple('chordFrequencies', `${S(input.root)}, ${S(input.chord)}, ${S(input.options ?? {})}`, 'frequencies', `the Hz of ${input.chord} on ${input.root}`);
      case 'play_percussion': return simple('playPercussion', `${S(input.name)}, ${S(input.options ?? {})}`, 'played', `percussion ${input.name}`);
      case 'play_sfx': return simple('playSfx', `${S(input.name)}, ${S(input.options ?? {})}`, 'played', `sfx ${input.name}`);
      case 'play_spec': return simple('playSound', S(input.spec), 'played', 'a raw spec');
      case 'play_from_text': return simple('playSoundFromText', S(input.text), 'played', `"${input.text}"`);

      case 'from_text':
        return `
// Sound: resolve "${input.text}" to a spec WITHOUT playing it
(function() {
${guard('buildSoundFromText')}
  const spec = app.buildSoundFromText(${S(input.text)});
  // A description the resolver cannot read comes back empty rather than
  // throwing. Saying so beats handing back a spec that plays silence.
  if (!spec) { return { success: false, error: 'could not resolve ' + ${S(input.text)} + ' into a sound' }; }
  return { success: true, spec: spec };
})();`.trim();

      // DEFINING A SOUND. The engine's three tables are "a curated starting set,
      // not a claim that music contains six instruments" — its words. Anything
      // it does not model can be registered at runtime and is then first-class:
      // listInstruments() reads the LIVE table, so a defined instrument shows
      // up in list_instruments and plays by name like any built-in.
      //
      // The canonical name is RETURNED rather than assumed. Registration
      // normalises to [a-z][a-z0-9_-]{0,31}, so a model that registers
      // 'Rhodes' and then plays 'Rhodes' is playing something that does not
      // exist — the name it actually got is 'rhodes', and it needs to be told.
      case 'define_instrument':
      case 'define_percussion':
      case 'define_sfx': {
        const fn = input.action === 'define_instrument' ? 'registerInstrument'
          : input.action === 'define_percussion' ? 'registerPercussion' : 'registerSfx';
        const listFn = input.action === 'define_instrument' ? 'listInstruments'
          : input.action === 'define_percussion' ? 'listPercussion' : 'listSfx';
        const spec = {
          ...(input.partials ? { partials: input.partials } : {}),
          ...(input.envelope ? { envelope: input.envelope } : {}),
          ...(input.gain !== undefined ? { gain: input.gain } : {}),
          ...(input.aliases ? { aliases: input.aliases } : {}),
          ...(input.noise !== undefined ? { noise: input.noise } : {}),
          ...(input.noiseFreq !== undefined ? { noiseFreq: input.noiseFreq } : {}),
          ...(input.hz !== undefined ? { hz: input.hz } : {}),
          ...(input.pitch ? { pitch: input.pitch } : {}),
        };
        // @engine-methods registerInstrument registerPercussion registerSfx
        // The guard below is INTERPOLATED — `guard(fn)` takes a variable, not a
        // literal — so sync-engine-methods.mjs cannot read the names out of it
        // and the studio probe would report a studio as complete while never
        // checking the method a caller needs. It extracted only
        // renderSoundtrackWav until this line existed.
        return `
// Sound: define ${input.name} at runtime
(function() {
${guard(fn)}
  var name;
  // The engine THROWS on an unusable name or a silent spec, with a message
  // naming what was wrong. That is the useful answer, so it is caught and
  // returned rather than allowed to surface as a bridge error with no subject.
  try { name = app.${fn}(${S(input.name)}, ${S(spec)}); }
  catch (e) { return { success: false, error: (e && e.message) || String(e) }; }
  var listed = typeof app.${listFn} === 'function' ? app.${listFn}() : null;
  var found = Array.isArray(listed)
    ? listed.some(function (x) { return (x && x.name) === name; })
    : null;
  return {
    success: true,
    // The name the engine CHOSE, which is what plays. Registering 'Rhodes'
    // returns 'rhodes'.
    canonicalName: name,
    requestedName: ${S(input.name)},
    normalised: name !== ${S(input.name)},
    // Defined but unlistable would be a capability nobody can name. Proven per
    // call rather than assumed, because it is one table lookup.
    listed: found,
  };
})();`.trim();
      }

      case 'render_soundtrack': {
        const opts = {
          ...(typeof input.options?.duration === 'number' ? { duration: input.options.duration } : {}),
          ...(input.sampleRate !== undefined ? { sampleRate: input.sampleRate } : {}),
          ...(input.bitDepth !== undefined ? { bitDepth: input.bitDepth } : {}),
        };
        return `
// Sound: mix every placed sound to a WAV, offline
(function() {
${guard('renderSoundtrackWav')}
  var r = app.renderSoundtrackWav(${S(opts)});
  // BARE NULL MEANS "NO SOUNDS PLACED". Returned for an empty scene and for a
  // scene whose sounds all failed to mix — indistinguishable from a malfunction
  // unless it is named, and "the export produced nothing" is the report that
  // sends someone debugging the exporter instead of placing a sound.
  if (!r || !r.wav) {
    return { success: false, error: 'no sounds are placed on this scene, so there is no soundtrack to render. Create one with action "create", or place an existing sound with "set_placement".' };
  }
  var bytes = r.wav;
  // Uint8Array cannot cross the bridge; base64 in chunks, because
  // String.fromCharCode.apply over a multi-megabyte array blows the stack.
  var bin = '';
  for (var i = 0; i < bytes.length; i += 8192) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return {
    success: true,
    wavBase64: btoa(bin),
    byteLength: bytes.length,
    duration: r.duration,
    sampleRate: r.sampleRate,
    sounds: r.sounds,
    placed: r.placed,
    // DROPPED IS THE SECOND SILENT REFUSAL. A mix with placed > 0 and dropped
    // > 0 is a valid WAV that is quietly missing sounds — the same shape as an
    // item list capped below its own itemCount. Reported only when it happened,
    // so the marker stays meaningful.
    ...(r.dropped > 0 ? { dropped: r.dropped, incomplete:
      'mixed ' + r.placed + ' sound(s); ' + r.dropped + ' could not be rendered and are absent from this file' } : {}),
  };
})();`.trim();
      }

      case 'create': {
        const v = (input.visual ?? {}) as Record<string, unknown>;
        const { startTime, duration, ...visualOnly } = v;
        const placement = (startTime !== undefined || duration !== undefined)
          ? { ...(startTime !== undefined ? { startTime } : {}), ...(duration !== undefined ? { duration } : {}) }
          : null;
        return `
// Sound: draw it AS a waveform path — the item and the sound are one thing
(function() {
${guard('createSound')}
  const item = app.createSound(${S(input.spec ?? {})}, ${S(visualOnly)});
  if (!item) { return { success: false, error: 'the sound produced no waveform path' }; }
  const _sid = item.data && item.data.id;
  // ONE CALL PER CUE, NOT TWO. startTime/duration were stripped from visual,
  // so placing a cue meant create + set_placement every time — a pilot made
  // 160 calls where 80 would do. Applied here when given, using the same
  // setSoundPlacement the separate action calls.
  ${placement ? `if (_sid && app.setSoundPlacement) { app.setSoundPlacement(_sid, ${S(placement)}); }` : ''}
  return { success: true, itemId: _sid, itemType: 'sound'${placement ? `, placement: ${S(placement)}` : ''} };
})();`.trim();
      }

      case 'sequence': {
        // ONE CALL FOR A WHOLE BED.
        //
        // Every cue was create + set_placement, so a 112-cue music bed cost 112
        // round trips once visual.startTime landed and 224 before it. Nothing
        // about the work needs a trip each: the cues are independent, they
        // differ only in time and spec, and the page can loop.
        //
        // Each cue is reported individually. A bed where three cues failed and
        // 109 worked is not a failure, and it is not a success either — the
        // caller needs to know WHICH, so placed/failed come back by index.
        const cues = (input.cues ?? []) as Array<Record<string, unknown>>;
        return `
// Sound: a whole sequence of cues, created and placed in one pass
(function() {
${guard('createSound')}
  const cues = ${S(cues)};
  const placed = [];
  const failed = [];
  for (let i = 0; i < cues.length; i++) {
    const c = cues[i];
    try {
      const spec = c.spec || (c.preset ? { preset: c.preset, note: c.note } : null);
      if (!spec) { failed.push({ index: i, t: c.t, error: 'neither spec nor preset' }); continue; }
      const item = app.createSound(spec, c.visual || {});
      if (!item) { failed.push({ index: i, t: c.t, error: 'the cue produced no waveform path' }); continue; }
      const id = item.data && item.data.id;
      if (id && app.setSoundPlacement) {
        app.setSoundPlacement(id, { startTime: c.t, ...(c.duration ? { duration: c.duration } : {}) });
      }
      placed.push({ index: i, itemId: id, t: c.t });
    } catch (e) {
      failed.push({ index: i, t: c.t, error: (e && e.message) || 'cue failed' });
    }
  }
  return {
    success: failed.length === 0,
    action: 'sequence',
    placed: placed.length,
    itemIds: placed.map(function(p) { return p.itemId; }),
    cues: placed,
    ...(failed.length ? { failed: failed, error: failed.length + ' of ' + cues.length + ' cues did not sound — see failed[] for which.' } : {}),
  };
})();`.trim();
      }

      case 'timbre_from_path':
        return `
// Sound: read a drawn path's shape as harmonic content
(function() {
${guard('timbreFromPath')}
  const item = app.getItemById ? app.getItemById(${S(input.itemId)}) : null;
  // timbreFromPath answers a flat {partials:[{h:1,amp:1}]} for anything that is
  // not a path with length — a real timbre and a refusal look identical, so the
  // item is checked HERE instead of reading that back as an answer.
  if (!item) { return { success: false, error: 'no such item: ' + ${S(input.itemId)} }; }
  if (typeof item.getPointAt !== 'function' || !(item.length > 0)) {
    return { success: false, error: 'timbre needs a path with length — ' + ${S(input.itemId)} + ' is not one' };
  }
  return { success: true, timbre: app.timbreFromPath(item, ${S(input.samples ?? 256)}) };
})();`.trim();

      case 'set_placement': return simple('setSoundPlacement', `${S(input.itemId)}, ${S(input.placement ?? {})}`, 'placed', 'placement');
      case 'remove': return simple('removeSound', S(input.itemId), 'removed', 'remove');
      case 'stop_all': return simple('stopSounds', '', 'stopped', 'stop everything');
    }
  }

  /**
   * pinepaper_motion — the generators' Animation knob for any group.
   *
   * animateItems returns `{error}` on failure, NOT `{ok:false, reason}` like
   * the path facades — reading the wrong key here turns "could not attach
   * \"ripple\" (frame-callback limit reached?)" into undefined.
   */
  generateMotion(input: MotionInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    if (input.action === 'list') {
      return `
// The engine's own motion catalogue — motions, waveforms, origins, knobs
(async function() {
  if (typeof app.listGeneratorMotions !== 'function') { return { success: false, error: 'app.listGeneratorMotions unavailable — update FxTool' }; }
  const c = await app.listGeneratorMotions();
  return { success: true, ...c };
})();`.trim();
    }

    const target = input.itemIds && input.itemIds.length ? S(input.itemIds) : S(input.itemId);
    const opts: Record<string, unknown> = { animation: input.motion };
    for (const k of ['speed', 'intensity', 'waveform', 'origin', 'seed'] as const) {
      if (input[k] !== undefined) opts[k] = input[k];
    }
    return `
// Motion: ${input.motion} on ${input.itemIds?.length ? `${input.itemIds.length} items` : input.itemId}
(async function() {
  if (typeof app.animateItems !== 'function') { return { success: false, error: 'app.animateItems unavailable — update FxTool' }; }
  const r = await app.animateItems(${target}, ${S(opts)});
  // An unknown motion comes back with the known list attached, so a caller can
  // correct itself without a second round trip.
  if (!r || r.error) { return { success: false, error: (r && r.error) || 'the motion did not attach', motions: r && r.motions }; }
  return { success: true, motion: ${S(input.motion)} };
})();`.trim();
  }

  /**
   * pinepaper_path — the destructive path operations.
   *
   * Every facade here returns `{ok:false, reason}` and names its own refusal
   * ("a boolean needs at least two paths", "that path has no stroke to
   * outline"), so the reason is passed through rather than reworded. A second
   * wording for one condition is the thing to avoid, not the guard.
   */
  generatePathOp(input: PathOpInput): string {
    const S = (v: unknown) => JSON.stringify(v);
    const guard = (fn: string) =>
      `  if (typeof app.${fn} !== 'function') { return { success: false, error: 'app.${fn} unavailable — update FxTool' }; }`;
    const pass = (expr: string) => `
  const r = ${expr};
  if (!r || r.ok === false) { return { success: false, error: (r && r.reason) || 'the engine refused the operation' }; }
  return { success: true, ...r };`;

    switch (input.action) {
      case 'boolean':
        return `
// Path boolean: ${input.op} — CONSUMES its operands and leaves one result
(function() {
${guard('booleanOp')}${pass(`app.booleanOp(${S(input.itemIds)}, ${S(input.op)})`)}
})();`.trim();

      case 'simplify':
        return `
// Simplify: fewer segments, same shape
(function() {
${guard('simplifyPath')}${pass(`app.simplifyPath(${S(input.itemId)}${input.tolerance !== undefined ? `, ${S(input.tolerance)}` : ''})`)}
})();`.trim();

      case 'outline_stroke':
        return `
// Outline stroke: a stroked line becomes a filled shape of the same width
(function() {
${guard('outlineStroke')}${pass(`app.outlineStroke(${S(input.itemId)}, ${S(input.tolerance !== undefined ? { tolerance: input.tolerance } : {})})`)}
})();`.trim();

      case 'toggle_closed':
        return `
// Open or close the path
(function() {
${guard('togglePathClosed')}${pass(`app.togglePathClosed(${S(input.itemId)})`)}
})();`.trim();

      case 'pattern':
        return `
// Pattern: repeat the item — ${input.kind}
(function() {
${guard('patternFrom')}${pass(`app.patternFrom(${S(input.itemId)}, ${S(input.kind)}, ${S(input.pattern ?? {})})`)}
})();`.trim();

      case 'get_geometry':
        return `
// Read the path's segments back
(function() {
${guard('getPathGeometry')}
  const g = app.getPathGeometry(${S(input.itemId)}, {});
  // null means no such item — the one facade here that does NOT name its
  // refusal, so this is the one place a wording is supplied rather than passed.
  if (!g) { return { success: false, error: 'no such item: ' + ${S(input.itemId)} }; }
  return { success: true, geometry: g };
})();`.trim();

      case 'set_locked':
        return `
// Lock or unlock — a locked item is also unselectable and undraggable
(function() {
${guard('setItemLocked')}${pass(`app.setItemLocked(${S(input.itemId)}, ${S(input.locked)})`)}
})();`.trim();

      case 'unlock_all':
        return `
// Unlock everything on the canvas
(function() {
${guard('unlockAllItems')}${pass('app.unlockAllItems()')}
})();`.trim();
    }
  }

  /**
   * One-shot image crop via the PinePaper.cropImage facade (Track A parity).
   * The replacement raster keeps the item's registry id.
   */
  generateCropImage(input: CropImageInput): string {
    const opts = input.aspectRatio ? JSON.stringify({ aspectRatio: input.aspectRatio }) : '{}';
    return `
// Crop image ${input.itemId}
(async function() {
  if (typeof app.cropImage !== 'function') { return { success: false, error: 'app.cropImage unavailable — update FxTool to a build with one-shot image ops' }; }
  const result = await app.cropImage(${JSON.stringify(input.itemId)}, ${JSON.stringify(input.rect)}, ${opts});
  if (!result) { return { success: false, error: 'crop failed — item is not a raster or rect does not intersect it' }; }
  return { success: true, itemId: result.data.id, width: Math.round(result.width), height: Math.round(result.height) };
})();`.trim();
  }

  /**
   * One-shot chroma key (background removal) via PinePaper.applyChromaKey.
   * Threshold/smoothing auto-estimate when omitted.
   */
  generateChromaKey(input: ChromaKeyInput): string {
    const opts = JSON.stringify({
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.threshold !== undefined ? { threshold: input.threshold } : {}),
      ...(input.smoothing !== undefined ? { smoothing: input.smoothing } : {}),
    });
    return `
// Chroma-key image ${input.itemId}
(async function() {
  if (typeof app.applyChromaKey !== 'function') { return { success: false, error: 'app.applyChromaKey unavailable — update FxTool to a build with one-shot image ops' }; }
  const result = await app.applyChromaKey(${JSON.stringify(input.itemId)}, ${opts});
  if (!result) { return { success: false, error: 'chroma key failed — item is not a raster or the color is invalid' }; }
  return { success: true, itemId: result.data.id, params: result.data.chromaKeyParams };
})();`.trim();
  }

  /**
   * Rigging (skeletons/bones/IK/breakdown-pose keyframes) via app.riggingSystem.
   * One consolidated emitter; each action maps 1:1 to a riggingSystem method with
   * FxTool's exact param contract. Guarded on app.riggingSystem.
   */
  generateRigging(input: RiggingInput): string {
    const g = `  const R = app.riggingSystem;
  if (!R) { return { success: false, error: 'app.riggingSystem unavailable — update FxTool to a rigging-capable build' }; }`;
    const wrap = (comment: string, body: string) => `\n// ${comment}\n(function() {\n${g}\n${body}\n})();`.trim();
    const S = (v: unknown) => JSON.stringify(v);
    switch (input.action) {
      case 'create_skeleton': {
        const root = input.rootPosition ? S(input.rootPosition) : S({ x: 400, y: 300 });
        return wrap('Rigging: create skeleton',
          `  const skeletonId = R.createSkeleton(${S(input.name ?? null)}, ${root});
  if (app.historyManager) app.historyManager.saveState();
  if (!skeletonId) { return { success: false, action: 'create_skeleton', error: "the engine returned no skeleton id — createSkeleton does not normally fail, so treat this as a broken rigging subsystem rather than bad input" }; }
  return { success: true, action: 'create_skeleton', skeletonId: skeletonId };`);
      }
      case 'add_bone': {
        // DEGREES IN, RADIANS OUT. The schema says degrees and every other
        // angle on this surface is degrees, but RiggingSystem stores what it is
        // given and _solveFKRecursive feeds it straight to Math.cos/Math.sin.
        // So a documented 90 was read as 90 radians and the character exploded
        // on the first pose — silently, because a wrong pose is not an error.
        // Converted here so the tool keeps the vocabulary it advertises.
        // BOTH SPELLINGS, deliberately. The engine's _angleRad prefers
        // `angleDegrees` and converts it, so the new build reads the caller's
        // intent verbatim instead of trusting arithmetic done out here. `angle`
        // carries the same value already in radians, which is what an older
        // build reads — it has no angleDegrees and would see 0. Identical
        // result on both, and the units are stated rather than implied.
        const config = S({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.parentBoneId !== undefined ? { parentBoneId: input.parentBoneId } : {}),
          ...(input.length !== undefined ? { length: input.length } : {}),
          ...(input.angle !== undefined ? { angleDegrees: input.angle, angle: (input.angle * Math.PI) / 180 } : {}),
          ...(input.flexibility !== undefined ? { flexibility: input.flexibility } : {}),
          ...(input.segments !== undefined ? { segments: input.segments } : {}),
        });
        return wrap('Rigging: add bone',
          `  const boneId = R.addBone(${S(input.skeletonId)}, ${config});
  if (app.historyManager) app.historyManager.saveState();
  if (!boneId) { return { success: false, action: 'add_bone', error: "no such skeleton. Call list_skeletons for the ids that exist" }; }
  return { success: true, action: 'add_bone', boneId: boneId };`);
      }
      case 'attach_item': {
        const opts = S(input.attachPoint !== undefined ? { attachPoint: input.attachPoint } : {});
        return wrap('Rigging: attach item to bone',
          `  const ok = R.attachItem(${S(input.skeletonId)}, ${S(input.boneId)}, ${S(input.itemId)}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  if (!ok) { return { success: false, action: 'attach_item', error: "no such skeleton, or no such bone on it. list_bones gives the bone ids for a skeleton" }; }
  return { success: true, action: 'attach_item', itemId: ${S(input.itemId)}, boneId: ${S(input.boneId)} };`);
      }
      case 'create_ik_chain': {
        const config = S({
          boneIds: input.boneIds,
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.solverType !== undefined ? { solverType: input.solverType } : {}),
          ...(input.iterations !== undefined ? { iterations: input.iterations } : {}),
          ...(input.tolerance !== undefined ? { tolerance: input.tolerance } : {}),
          ...(input.strength !== undefined ? { strength: input.strength } : {}),
          ...(input.poleVector !== undefined ? { poleVector: input.poleVector } : {}),
        });
        return wrap('Rigging: create IK chain',
          `  const chainId = R.createIKChain(${S(input.skeletonId)}, ${config});
  if (app.historyManager) app.historyManager.saveState();
  if (!chainId) { return { success: false, action: 'create_ik_chain', error: "no such skeleton, or fewer than 2 boneIds — a chain needs at least two bones to solve. Call list_bones for the ids on this rig" }; }
  return { success: true, action: 'create_ik_chain', chainId: chainId };`);
      }
      case 'add_pose_keyframe': {
        const opts = S({
          ...(input.favor !== undefined ? { favor: input.favor } : {}),
          ...(input.breakdown !== undefined ? { breakdown: input.breakdown } : {}),
          ...(input.curve !== undefined ? { curve: input.curve } : {}),
          ...(input.boneOffsets !== undefined ? { boneOffsets: input.boneOffsets } : {}),
          ...(input.movingHold !== undefined ? { movingHold: input.movingHold } : {}),
          ...(input.holdDrift !== undefined ? { holdDrift: input.holdDrift } : {}),
        });
        // Same unit conversion as add_bone: an inline pose is { boneId: angleDeg }
        // by the schema, and the solver reads radians. A SAVED pose is a string
        // id and is passed through untouched — those angles are already in the
        // engine's own units.
        const poseArg = (input.pose !== null && typeof input.pose === 'object')
          ? S(Object.fromEntries(Object.entries(input.pose as Record<string, number>)
              .map(([bone, deg]) => [bone, (deg * Math.PI) / 180])))
          : S(input.pose);
        return wrap('Rigging: add pose keyframe',
          `  const ok = R.addPoseKeyframe(${S(input.skeletonId)}, ${input.time}, ${poseArg}, ${S(input.easing ?? 'linear')}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  if (!ok) { return { success: false, action: 'add_pose_keyframe', error: "no such skeleton, or 'pose' named a saved pose that does not exist. Pass an inline { boneId: angleDeg } map instead, or list_poses for the saved ones" }; }
  return { success: true, action: 'add_pose_keyframe', time: ${input.time} };`);
      }
      case 'set_target_path': {
        const opts = S({
          ...(input.duration !== undefined ? { duration: input.duration } : {}),
          ...(input.loop !== undefined ? { loop: input.loop } : {}),
        });
        return wrap('Rigging: set IK target path',
          `  const ok = R.setTargetPath(${S(input.skeletonId)}, ${S(input.chainId)}, ${S(input.waypoints)}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  if (!ok) { return { success: false, action: 'set_target_path', error: "no such skeleton, no such IK chain on it, or waypoints was not an array. create_ik_chain returns the chainId to use here" }; }
  return { success: true, action: 'set_target_path', chainId: ${S(input.chainId)} };`);
      }
      case 'save_pose':
        return wrap('Rigging: save pose',
          `  const poseId = R.savePose(${S(input.skeletonId)}, ${S(input.name ?? null)});
  if (app.historyManager) app.historyManager.saveState();
  if (!poseId) { return { success: false, action: 'save_pose', error: "no such skeleton. A pose is a snapshot of ITS bone angles, so the skeleton has to exist first — call list_skeletons" }; }
  return { success: true, action: 'save_pose', poseId: poseId };`);
      case 'save_shape_key':
        return wrap('Rigging: save shape key',
          `  const shapeKeyId = R.saveShapeKey(${S(input.skeletonId)}, ${S(input.name ?? null)});
  if (app.historyManager) app.historyManager.saveState();
  if (!shapeKeyId) { return { success: false, action: 'save_shape_key', error: "no such skeleton, or nothing is attached to its bones — a shape key snapshots the attached items, so a bare skeleton has nothing to capture" }; }
  return { success: true, action: 'save_shape_key', shapeKeyId: shapeKeyId };`);

      // ── Pose motion. Every case below maps 1:1 to a method that exists on
      // riggingSystem (or, for stitch_poses, a PinePaper facade) — checked
      // against the engine source, not against the docs, because the docs have
      // named tools that were never registered before now.
      case 'list_skeletons':
        return wrap('Rigging: list skeletons',
          `  const skeletons = R.listSkeletons();
  return { success: true, action: 'list_skeletons', skeletons: skeletons, count: skeletons.length };`);
      case 'list_bones':
        // Without this an inline pose is unwritable: a pose is
        // { boneId: angleDeg } and nothing else returns a bone id.
        return wrap('Rigging: list bones',
          `  if (typeof R.listBones !== 'function') { return { success: false, error: 'listBones unavailable — update FxTool' }; }
  const bones = R.listBones(${S(input.skeletonId)});
  return { success: true, action: 'list_bones', bones: bones, count: bones.length };`);
      case 'list_pose_libraries':
        return wrap('Rigging: list pose libraries',
          `  return (async function() {
    if (typeof R.ensurePoseLibraries !== 'function') { return { success: false, error: 'pose libraries unavailable — update FxTool' }; }
    const names = await R.ensurePoseLibraries();
    return { success: true, action: 'list_pose_libraries', libraries: names.libraries, transitions: names.transitions };
  })();`);
      case 'load_pose_library': {
        // The libraries used to load only from an editor button, so every
        // agent ran with none and got null from every preset name. Awaited
        // here so the guarantee is real rather than dependent on whether a
        // human happened to click something earlier in the session.
        const map = input.boneMap ? S(input.boneMap) : 'null';
        return wrap('Rigging: load a stock pose library',
          `  return (async function() {
    if (typeof R.ensurePoseLibraries !== 'function') { return { success: false, error: 'pose libraries unavailable — update FxTool' }; }
    const avail = await R.ensurePoseLibraries();
    let boneMap = ${map};
    if (!boneMap) {
      boneMap = {};
      for (const b of (R.listBones ? R.listBones(${S(input.skeletonId)}) : [])) { if (b.name) boneMap[b.name] = b.id; }
    }
    const res = R.loadPoseLibrary(${S(input.skeletonId)}, ${S(input.libraryName)}, boneMap);
    if (!res) { return { success: false, action: 'load_pose_library', error: 'no such library, or none of its bone names matched this rig. Available: ' + avail.libraries.join(', '), available: avail.libraries }; }
    if (app.historyManager) app.historyManager.saveState();
    return { success: true, action: 'load_pose_library', library: ${S(input.libraryName)}, poses: res };
  })();`);
      }
      case 'list_poses':
        return wrap('Rigging: list poses',
          `  const poses = R.listPoses(${S(input.skeletonId ?? null)});
  return { success: true, action: 'list_poses', poses: poses, count: poses.length };`);
      case 'load_pose':
        return wrap('Rigging: load pose',
          `  const ok = R.loadPose(${S(input.poseId)});
  if (app.historyManager) app.historyManager.saveState();
  if (!ok) { return { success: false, action: 'load_pose', error: "no such pose, or the skeleton it was saved against is gone. list_poses for what is still loadable" }; }
  return { success: true, action: 'load_pose', poseId: ${S(input.poseId)} };`);
      case 'interpolate_poses':
        return wrap('Rigging: interpolate poses',
          `  const ok = R.interpolatePoses(${S(input.poseIdA)}, ${S(input.poseIdB)}, ${input.t ?? 0.5});
  if (!ok) { return { success: false, action: 'interpolate_poses', error: "one of the two poses does not exist, or they belong to DIFFERENT skeletons — blending across rigs is not defined. Call list_poses to see which skeleton each belongs to" }; }
  return { success: true, action: 'interpolate_poses', t: ${input.t ?? 0.5} };`);
      case 'play_pose_sequence': {
        const opts = S({
          ...(input.loop !== undefined ? { loop: input.loop } : {}),
          ...(input.options ?? {}),
        });
        return wrap('Rigging: play pose sequence',
          `  const ok = R.playPoseSequence(${S(input.skeletonId)}, ${S(input.sequence ?? [])}, ${opts});
  if (!ok) { return { success: false, action: 'play_pose_sequence', error: "no such skeleton, or the sequence was empty. Each key needs a 'pose' id or an inline 'angles' map — call list_poses for the saved ids" }; }
  return { success: true, action: 'play_pose_sequence', keys: ${(input.sequence ?? []).length} };`);
      }
      case 'stop_pose_sequence':
        return wrap('Rigging: stop pose sequence',
          `  const ok = R.stopPoseSequence(${S(input.skeletonId)});
  if (!ok) { return { success: false, action: 'stop_pose_sequence', error: "nothing was playing on that skeleton — this is a no-op rather than a failure" }; }
  return { success: true, action: 'stop_pose_sequence' };`);
      case 'stitch_poses': {
        // The one action on `app` rather than riggingSystem: stitching resolves
        // saved pose ids and then installs the merged sequence through the
        // ordinary player, so there is one code path and one thing to scrub.
        const opts = S({
          ...(input.blend !== undefined ? { blend: input.blend } : {}),
          ...(input.blendSteps !== undefined ? { blendSteps: input.blendSteps } : {}),
          ...(input.matchPhase !== undefined ? { matchPhase: input.matchPhase } : {}),
          ...(input.loop !== undefined ? { loop: input.loop } : {}),
          ...(input.plan !== undefined ? { plan: input.plan } : {}),
          ...(input.options ?? {}),
        });
        return wrap('Rigging: stitch pose clips',
          `  if (typeof app.stitchPoses !== 'function') { return { success: false, error: 'app.stitchPoses unavailable — update FxTool' }; }
  const res = app.stitchPoses(${S(input.skeletonId)}, ${S(input.clips ?? [])}, ${opts});
  return Object.assign({ success: !!res.ok, action: 'stitch_poses' }, res);`);
      }
      case 'apply_pose_transition':
        return wrap('Rigging: apply pose transition',
          `  return (async function() {
    if (typeof R.ensurePoseLibraries === 'function') { await R.ensurePoseLibraries(); }
    // A transition names POSES BY NAME, so it needs name → id. Requiring the
    // caller to build that by hand from list_poses is busywork with one
    // correct answer, and getting it wrong returns a bare null. Build it here
    // when it is omitted, exactly as load_pose_library builds its bone map.
    let poseIdMap = ${input.poseIdMap ? S(input.poseIdMap) : 'null'};
    if (!poseIdMap || !Object.keys(poseIdMap).length) {
      poseIdMap = {};
      for (const pose of (R.listPoses ? R.listPoses(${S(input.skeletonId)}) : [])) { if (pose.name) poseIdMap[pose.name] = pose.id; }
    }
    const res = R.applyPoseTransition(${S(input.skeletonId)}, ${S(input.transitionName)}, poseIdMap);
    if (!res) { return { success: false, action: 'apply_pose_transition', error: "no such transition, or none of its pose names are saved on this skeleton. Load the matching library first (load_pose_library), then retry — the transition plays poses BY NAME." }; }
    if (app.historyManager) app.historyManager.saveState();
    return { success: true, action: 'apply_pose_transition', transition: ${S(input.transitionName)} };
  })();`);
      case 'auto_walk':
      case 'auto_breath':
      case 'auto_idle':
      case 'auto_jump': {
        const method = { auto_walk: 'autoWalk', auto_breath: 'autoBreath', auto_idle: 'autoIdle', auto_jump: 'autoJump' }[input.action];
        // These return null when the rig has no bone the preset recognises BY
        // NAME, which is a real refusal and not an error — but `result: null`
        // tells an agent nothing, and a silent nothing is what sends it into a
        // retry loop. Say which names each one looks for.
        const needs: Record<string, string> = {
          // autoWalk cycles through SAVED poses named walk_00…walk_07 or
          // walk_contact_L/walk_passing_L/… — the ones the `humanoid` library
          // saves. It is not a procedural generator, it is a pose player, and
          // saying "needs a skeleton" when the skeleton is right there sends an
          // agent looking in the wrong place.
          auto_walk: "at least 2 saved walk poses (walk_00…, or walk_contact_L / walk_passing_L / walk_contact_R / walk_passing_R). Run load_pose_library with libraryName 'humanoid' (or 'quadruped') first — it saves exactly those",
          auto_breath: 'a bone named spine, chest, upper_spine or body',
          auto_idle: 'a bone named head, hip, upper_hub or spine',
          auto_jump: 'a skeleton, and saved jump poses if you want a posed jump rather than a root arc',
        };
        return wrap(`Rigging: ${input.action}`,
          `  const res = R.${method}(${S(input.skeletonId)}, ${S(input.options ?? {})});
  if (res && app.historyManager) app.historyManager.saveState();
  if (!res) { return { success: false, action: ${S(input.action)}, error: ${S(`refused — needs ${needs[input.action]}.`)} }; }
  return { success: true, action: ${S(input.action)}, result: res };`);
      }
      case 'move_root':
        return wrap('Rigging: root locomotion track',
          `  const ok = R.moveRoot(${S(input.skeletonId)}, ${S(input.keyframes ?? [])}, ${S(input.options ?? {})});
  if (!ok) { return { success: false, action: 'move_root', error: "no such skeleton, or keyframes was empty. Each key is { t, x, y } with t in SCENE SECONDS" }; }
  return { success: true, action: 'move_root', keys: ${(input.keyframes ?? []).length} };`);
      case 'stop_root_track':
        return wrap('Rigging: stop root track',
          `  const ok = R.stopRootTrack(${S(input.skeletonId)});
  if (!ok) { return { success: false, action: 'stop_root_track', error: "no root track was running on that skeleton — this is a no-op rather than a failure" }; }
  return { success: true, action: 'stop_root_track' };`);
      case 'add_secondary_motion':
        return wrap('Rigging: secondary motion',
          `  const res = R.addSecondaryMotion(${S(input.skeletonId)}, ${S(input.boneNames ?? [])}, ${S(input.options ?? {})});
  if (!res) { return { success: false, action: 'add_secondary_motion', error: "no such skeleton, or fewer than 2 of the given bone NAMES resolve on it. A spring chain needs at least two; list_bones for the names this rig uses" }; }
  return { success: true, action: 'add_secondary_motion', bones: ${(input.boneNames ?? []).length} };`);
      case 'skin_path':
        return wrap('Rigging: skin path to bones',
          `  const res = R.skinPath(${S(input.skeletonId)}, ${S(input.itemId)}, ${S(input.options ?? {})});
  if (app.historyManager) app.historyManager.saveState();
  if (!res) { return { success: false, action: 'skin_path', error: "no such skeleton or item, the item is not a path, or no bone is close enough to influence it. Skinning binds vertices to nearby bones, so the path has to overlap the rig — call list_bones to see where they are" }; }
  return { success: true, action: 'skin_path', itemId: ${S(input.itemId)} };`);
      case 'bake_animation':
        return wrap('Rigging: bake animation to keyframes',
          `  const res = R.bakeAnimation(${S(input.skeletonId)}, ${S(input.options ?? {})});
  if (res && app.historyManager) app.historyManager.saveState();
  if (!res) { return { success: false, action: 'bake_animation', error: "nothing to bake — no such skeleton, or no items are ATTACHED to its bones. Baking writes keyframes onto the attached items, so a bare skeleton has no output." }; }
  return { success: true, action: 'bake_animation', result: res };`);
      case 'list_shape_keys':
        return wrap('Rigging: list shape keys',
          `  const keys = R.listShapeKeys(${S(input.skeletonId)});
  return { success: true, action: 'list_shape_keys', shapeKeys: keys, count: keys.length };`);
      case 'load_shape_key':
        return wrap('Rigging: load shape key',
          `  const ok = R.loadShapeKey(${S(input.skeletonId)}, ${S(input.shapeKeyId)}, ${input.weight ?? 1});
  if (!ok) { return { success: false, action: 'load_shape_key', error: "no such skeleton, or no such shape key on it. list_shape_keys for what is saved" }; }
  return { success: true, action: 'load_shape_key', weight: ${input.weight ?? 1} };`);

      // ── Mocap / rig import — these live on `app` (PinePaper facades), not
      // riggingSystem, and they are async, so they get their own async IIFE
      // instead of the sync `wrap` above. Each returns the facade's own result
      // object: it already carries {ok, error, warnings…} and inventing a
      // second envelope here would just hide the interesting fields.
      case 'import_bvh': {
        const opts = S({
          ...(input.view !== undefined ? { view: input.view } : {}),
          ...(input.fps !== undefined ? { fps: input.fps } : {}),
          ...(input.height !== undefined ? { height: input.height } : {}),
          ...(input.rootPosition !== undefined ? { position: input.rootPosition } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
        });
        return `
// Rigging: import BVH mocap as a new rig (stick figure included)
(async function() {
  if (typeof app.importBVH !== 'function') { return { success: false, error: 'app.importBVH unavailable — update FxTool to a BVH-capable build' }; }
  const r = await app.importBVH(${S(input.bvhText ?? '')}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'BVH import failed' }; }
  // (facade snapshots history itself — a second saveState here would cost an extra undo step)
  return { success: true, action: 'import_bvh', skeletonId: r.skeletonId, poses: r.poses, duration: r.duration, warnings: r.warnings || [] };
})();`.trim();
      }
      case 'retarget_bvh': {
        const opts = S({
          ...(input.fps !== undefined ? { fps: input.fps } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
        });
        return `
// Rigging: retarget a BVH clip onto an EXISTING rig (matched by bone name)
(async function() {
  if (typeof app.retargetBVH !== 'function') { return { success: false, error: 'app.retargetBVH unavailable — update FxTool to a BVH-capable build' }; }
  const r = await app.retargetBVH(${S(input.bvhText ?? '')}, ${S(input.skeletonId)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'BVH retarget failed' }; }
  // (facade snapshots history itself — a second saveState here would cost an extra undo step)
  // matched/unmatched matter: a retarget that matched 2 of 15 bones "succeeded"
  // and looks broken — the caller needs the numbers to know which happened.
  return { success: true, action: 'retarget_bvh', skeletonId: r.skeletonId, matched: r.matched, unmatchedSource: r.unmatchedSource, unmatchedTarget: r.unmatchedTarget, poses: r.poses, duration: r.duration, warnings: r.warnings || [] };
})();`.trim();
      }
      case 'import_spine': {
        const opts = S({
          ...(input.rootPosition !== undefined ? { position: input.rootPosition } : {}),
          ...(input.name !== undefined ? { name: input.name } : {}),
        });
        return `
// Rigging: import a Spine JSON export (bones, poses, attachment placeholders)
(async function() {
  if (typeof app.importSpine !== 'function') { return { success: false, error: 'app.importSpine unavailable — update FxTool to a Spine-capable build' }; }
  const r = await app.importSpine(${S(input.spineJson ?? '')}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'Spine import failed' }; }
  // (facade snapshots history itself — a second saveState here would cost an extra undo step)
  return { success: true, action: 'import_spine', skeletonId: r.skeletonId, bones: r.bones, placeholders: r.placeholders, animations: (r.animations || []).map(function(a) { return a.name; }), warnings: r.warnings || [] };
})();`.trim();
      }
    }
  }

  /**
   * Drive app.constructionSequence (Layer 3): build a step-by-step reveal of a
   * figure, play it on the timeline, clear it, or list sequences. Item refs are
   * registryId strings — build resolves them via app.getItemById.
   */
  generateConstructionSequence(input: ConstructionSequenceInput): string {
    const guard = `const cs = app.constructionSequence;
  if (!cs) return { success: false, error: 'app.constructionSequence unavailable — update FxTool to a build with the construction-sequence library' };`;
    switch (input.action) {
      case 'build': {
        const stepsJson = JSON.stringify(input.steps ?? []);
        const opts = JSON.stringify({
          ...(input.stepDuration !== undefined ? { stepDuration: input.stepDuration } : {}),
          ...(input.fadeIn !== undefined ? { fadeIn: input.fadeIn } : {}),
        });
        return `
// Build construction sequence
(function() {
  ${guard}
  const rec = cs.build(${stepsJson}, ${opts});
  return {
    success: true,
    action: 'build',
    sequenceId: rec.id,
    stepCount: rec.steps.length,
    stepDuration: rec.stepDuration,
    fadeIn: rec.fadeIn,
    totalDuration: rec.totalDuration,
  };
})();`.trim();
      }
      case 'play': {
        const seqArg = input.sequenceId ? JSON.stringify(input.sequenceId) : 'null';
        const opts = JSON.stringify({
          loop: !!input.loop,
          ...(input.duration !== undefined ? { duration: input.duration } : {}),
        });
        return `
// Play construction sequence
(function() {
  ${guard}
  let seqId = ${seqArg};
  if (!seqId) { const all = cs.list(); seqId = all.length ? all[all.length - 1].id : null; }
  if (!seqId) return { success: false, error: 'No sequence to play — build one first' };
  const duration = cs.play(seqId, ${opts});
  return { success: true, action: 'play', sequenceId: seqId, duration: duration, loop: ${!!input.loop} };
})();`.trim();
      }
      case 'clear': {
        const seqArg = input.sequenceId ? JSON.stringify(input.sequenceId) : 'null';
        return `
// Clear construction sequence
(function() {
  ${guard}
  let seqId = ${seqArg};
  if (!seqId) { const all = cs.list(); seqId = all.length ? all[all.length - 1].id : null; }
  if (!seqId) return { success: false, error: 'No sequence to clear' };
  const ok = cs.clear(seqId);
  return { success: ok, action: 'clear', sequenceId: seqId };
})();`.trim();
      }
      case 'list':
      default:
        return `
// List construction sequences
(function() {
  ${guard}
  const sequences = cs.list().map(function(r) {
    return { id: r.id, stepCount: r.steps.length, stepDuration: r.stepDuration, totalDuration: r.totalDuration };
  });
  return { success: true, action: 'list', sequences: sequences };
})();`.trim();
    }
  }

  /**
   * Run an app.geometry.* construction helper (Layer 1) and, when createAs is
   * given, build a canvas item from the result. The op name is whitelisted by the
   * Zod enum, so it is safe to index app.geometry[op] directly. Mirrors FxTool's
   * documented composition: app.create('polygon', { points: app.geometry.regularPolygon(...) }).
   */
  generateGeometry(input: GeometryInput): string {
    const op = JSON.stringify(input.operation);
    const argsJson = JSON.stringify(input.args ?? []);
    const createAsJson = input.createAs ? JSON.stringify(input.createAs) : 'null';
    return `
// Geometry construction: ${input.operation}
(function() {
  const g = app.geometry;
  if (!g || typeof g[${op}] !== 'function') {
    return { success: false, error: 'app.geometry.' + ${op} + ' unavailable — update FxTool to a build with the geometry construction library' };
  }
  const result = g[${op}](...${argsJson});
  if (result == null) {
    return { success: false, operation: ${op}, result: null, error: 'Degenerate construction (parallel lines, collinear points, or a point inside the circle) — returned null' };
  }

  let itemId = null;
  const createAs = ${createAsJson};
  if (createAs) {
    const { itemType, radius, ...style } = createAs;
    let item = null;
    if (Array.isArray(result)) {
      // Vertex list (regularPolygon / star / polygonFromVertices / tangent points)
      item = app.create('polygon', { points: result, ...style });
    } else if (result.center && typeof result.radius === 'number') {
      // Circle / circumcircle
      item = app.create('circle', { x: result.center.x, y: result.center.y, radius: result.radius, ...style });
    } else if (typeof result.x === 'number' && typeof result.y === 'number') {
      // Point → small marker
      item = app.create(itemType || 'circle', { x: result.x, y: result.y, radius: (radius != null ? radius : 6), ...style });
    } else {
      return { success: true, operation: ${op}, result, itemId: null, note: 'Result is not directly creatable (line/scalar) — use the returned geometry as input to other tools' };
    }
    if (item) {
      if (item.bringToFront) item.bringToFront();
      itemId = item.data && item.data.registryId;
      if (app.historyManager) app.historyManager.saveState();
    }
  }

  return { success: true, operation: ${op}, result, itemId };
})();`.trim();
  }

  /**
   * Generate code for an equation-driven path (Expression IR — S10 B5).
   * Emits app.createEquationPath(opts); the whole validated input IS the opts
   * object. Guards on the app method so old FxTool builds degrade gracefully.
   */
  generateEquationPath(input: EquationPathInput): string {
    // An ODE is INTEGRATED, not plotted: the caller gets the trajectory back as
    // data rather than a drawn path, so it can be inspected, fed to a path, or
    // used to drive keyframes. Branching here rather than in a separate tool
    // keeps one place that knows the equation vocabulary.
    if (input.solveOde) {
      const ode = input.solveOde;
      return `
// Integrate an ODE and return the SOLUTION — nothing is drawn
(async function() {
  if (typeof app.solveODE !== 'function') { return { success: false, error: 'app.solveODE unavailable — update FxTool' }; }
  const sol = await app.solveODE(${JSON.stringify({ equations: ode.equations, initialState: ode.initialState, tEnd: ode.tEnd, dt: ode.dt })}, ${JSON.stringify(ode.method ?? 'rk4')});
  if (!sol) { return { success: false, error: 'the solver returned nothing — check the equations and the initial state length' }; }
  return { success: true, method: ${JSON.stringify(ode.method ?? 'rk4')}, solution: sol };
})();`.trim();
    }

    const optsJson = JSON.stringify(input);
    const kindJson = JSON.stringify(input.kind);
    return `
// Equation-driven path: ${input.kind}${input.preset ? ' ' + input.preset : ''}
(function() {
  if (typeof app.createEquationPath !== 'function') {
    return { success: false, error: 'app.createEquationPath unavailable — update FxTool to a build with the Expression IR equation-path API (S10 B5)' };
  }
  const path = app.createEquationPath(${optsJson});
  if (!path) {
    return { success: false, error: 'Equation path produced no points — check expr/xExpr/yExpr, the sample range, or the preset name' };
  }
  const itemId = path.data && path.data.registryId;
  if (app.historyManager) app.historyManager.saveState();
  return { success: true, kind: ${kindJson}, itemId };
})();`.trim();
  }

  /**
   * Generate code for the pp:event channel (S11 event-driven scene chains).
   * create → app.createEvent(name, opts) → eventId; pulse → app.pulseEvent.
   * Guards on the app methods so old FxTool builds degrade gracefully.
   */
  generateEvent(input: EventInput): string {
    if (input.action === 'create') {
      const nameJson = JSON.stringify(input.name);
      const optsJson = JSON.stringify({ payloadType: input.payloadType, x: input.x, y: input.y });
      return `
// Create event: ${input.name}
(function() {
  if (typeof app.createEvent !== 'function') {
    return { success: false, error: 'app.createEvent unavailable — update FxTool to a build with the event system (S11)' };
  }
  const eventId = app.createEvent(${nameJson}, ${optsJson});
  if (!eventId) { return { success: false, error: 'Event creation failed' }; }
  if (app.historyManager) app.historyManager.saveState();
  return { success: true, action: 'create', eventId };
})();`.trim();
    }
    // pulse — a runtime fire, not a scene edit (no history save)
    const eventIdJson = JSON.stringify(input.eventId);
    const payloadJson = JSON.stringify(input.payload ?? null);
    return `
// Pulse event: ${input.eventId}
(function() {
  if (typeof app.pulseEvent !== 'function') {
    return { success: false, error: 'app.pulseEvent unavailable — update FxTool to a build with the event system (S11)' };
  }
  app.pulseEvent(${eventIdJson}, ${payloadJson});
  return { success: true, action: 'pulse', eventId: ${eventIdJson} };
})();`.trim();
  }
}

// Export singleton instance
export const codeGenerator = new PinePaperCodeGenerator();
