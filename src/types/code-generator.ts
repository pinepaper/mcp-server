/**
 * PinePaper Code Generator
 * 
 * Converts MCP tool inputs to executable PinePaper JavaScript code.
 * This code is designed to run in the browser context where window.PinePaper is available.
 */

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
  InstantiateOntologyInput,
  LintSceneInput,
  MediaInput, TextStyleInput, TextEffectInput, ShatterImageInput, ImportLayeredCharacterInput, GameInput, World3DInput,
  CropImageInput,
  ChromaKeyInput,
  RiggingInput,
  GroupInput,
  CameraDirectorInput,
  DetectObjectsInput,
  ExtractObjectInput,
  ArrangeInput,
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
  properties: Record<string, unknown>
): string {
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

  const params: Record<string, unknown> = {
    x: position.x,
    y: position.y,
    ...baseProperties,
  };

  // Handle simple solid colors in params
  if (color && !isGradient(color)) {
    params.color = color;
  }
  if (fillColor && !isGradient(fillColor)) {
    params.fillColor = fillColor;
  }
  if (strokeColor && !isGradient(strokeColor)) {
    params.strokeColor = strokeColor;
  }

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

  // Add opacity support
  if (opacity !== undefined) {
    code += `\nitem.opacity = ${opacity};`;
  }

  // Ensure item is visible above backgrounds/generators
  code += `\nif (item.bringToFront) item.bringToFront();`;

  // Add dynamic content support for text items
  if (contentType && itemType === 'text') {
    const opts: Record<string, unknown> = {};
    if (contentFormat) opts.format = contentFormat;
    if (countdownTarget !== undefined) opts.countdownTarget = countdownTarget;
    if (countdownEndText) opts.countdownEndText = countdownEndText;
    code += `\nif (app.setDynamicContent) app.setDynamicContent(item, '${contentType}', ${JSON.stringify(opts)});`;
  }

  code += `
const itemId = item.data.registryId;
app.historyManager.saveState();

// Return item info
({ itemId, type: '${itemType}', position: { x: ${position.x}, y: ${position.y} } });`;

  return code.trim();
}

/**
 * Template for modifying items
 */
function generateModifyItemCode(
  itemId: string,
  properties: Record<string, unknown>
): string {
  const { contentType, contentFormat, countdownTarget, countdownEndText, ...restProperties } = properties;

  let code = `
// Modify item ${itemId}
app.select('${itemId}');`;

  // Pass non-dynamic-content properties to app.modify
  if (Object.keys(restProperties).length > 0) {
    code += `\napp.modify(${JSON.stringify(restProperties, null, 2)});`;
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

  code += `
app.historyManager.saveState();

// Return success
({ success: true, itemId: '${itemId}' });`;

  return code.trim();
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
  return `
// Add ${relationType} relation: ${sourceId} -> ${targetId}
const success = app.addRelation('${sourceId}', '${targetId}', '${relationType}', ${JSON.stringify(params, null, 2)});
if (!success) {
  throw new Error('Failed to add relation');
}
app.historyManager.saveState();

// Return success
({ success: true, sourceId: '${sourceId}', targetId: '${targetId}', relationType: '${relationType}' });
`.trim();
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

({ success: true, itemId: '${itemId}', animationType: '${animationType}' });
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

  return `
// Apply keyframe animation to ${itemId}
app.addAnimation('${itemId}', ${keyframesJson}, ${JSON.stringify(opts)});

({ success: true, itemId: '${itemId}', duration: ${calculatedDuration}, loop: ${loop}${timeOffset !== undefined ? `, timeOffset: ${timeOffset}` : ''}${clipInPoint !== undefined ? `, clipInPoint: ${clipInPoint}` : ''}${clipOutPoint !== undefined ? `, clipOutPoint: ${clipOutPoint}` : ''} });
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
  region?: { x: number; y: number; width: number; height: number }
): string {
  // FxTool signature: app.executeGenerator(name, params, options).
  // region lives in options (added in FxTool c81781c).
  const options = region ? { region } : {};
  return `
// Execute ${generatorName} generator${region ? ` in region ${region.width}×${region.height} @ (${region.x},${region.y})` : ''}
(async function() {
  await app.executeGenerator('${generatorName}', ${JSON.stringify(params, null, 2)}, ${JSON.stringify(options)});
  return { success: true, generator: '${generatorName}'${region ? ', region: ' + JSON.stringify(region) : ''} };
})();
`.trim();
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
function generateGetItemsCode(filter?: {
  type?: ItemType;
  source?: string;
  hasAnimation?: boolean;
  hasRelation?: boolean;
}): string {
  if (!filter || Object.keys(filter).length === 0) {
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

  const conditions: string[] = [];
  if (filter.type) {
    conditions.push(`entry.type === '${filter.type}'`);
  }
  if (filter.source) {
    conditions.push(`entry.source === '${filter.source}'`);
  }
  if (filter.hasAnimation !== undefined) {
    conditions.push(`!!entry.item.data?.animationType === ${filter.hasAnimation}`);
  }
  if (filter.hasRelation !== undefined) {
    conditions.push(`(app.getRelations(entry.id || entry.itemId).length > 0) === ${filter.hasRelation}`);
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
function generatePlayTimelineCode(
  action: 'play' | 'pause' | 'stop' | 'seek',
  duration?: number,
  loop?: boolean,
  time?: number,
  deterministic?: boolean
): string {
  switch (action) {
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
app.setCanvasSize(${sizeArg});
app.historyManager.saveState();
({ success: true, width: ${width}, height: ${height} });
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

({ success: true, removedCount: Math.max(0, before - remaining), remainingItems: remaining });
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
const generators = app.getAvailableBackgroundGenerators();
const formatted = generators.map(g => ({
  name: g.name,
  displayName: g.displayName || g.name,
  category: g.category || 'background',
  description: g.description || ''
}));

({ generators: formatted });
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
 * Template for batch create - creates multiple items with single history save
 */
function generateBatchCreateCode(items: BatchCreateItem[]): string {
  const itemsJson = JSON.stringify(items, null, 2);
  return `
// Batch create ${items.length} items
const itemSpecs = ${itemsJson};
const createdItems = app.batchCreate(itemSpecs);

// Return created item IDs and info
const results = createdItems.map(item => ({
  itemId: item.data?.registryId || item.id,
  type: item.className || 'unknown',
  position: item.position ? { x: item.position.x, y: item.position.y } : null
}));

({ success: true, items: results, count: results.length });
`.trim();
}

/**
 * Template for batch modify - modifies multiple items with single history save
 */
function generateBatchModifyCode(modifications: BatchModifyItem[]): string {
  const modsJson = JSON.stringify(modifications, null, 2);
  return `
// Batch modify ${modifications.length} items
const modifications = ${modsJson};
const results = app.batchModify(modifications.map(mod => ({
  item: mod.itemId,
  params: mod.params
})));

// Return modification results
const formatted = results.map(r => ({
  itemId: r.item?.data?.registryId || r.itemId,
  success: r.success,
  error: r.error || null
}));

({ success: formatted.every(r => r.success), results: formatted, count: formatted.length });
`.trim();
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

export class PinePaperCodeGenerator {
  /**
   * Generate code for creating an item
   */
  generateCreateItem(input: z.infer<typeof CreateItemInputSchema>): string {
    const validated = CreateItemInputSchema.parse(input);
    const properties = { ...(validated.properties as Record<string, unknown>) };
    if (validated.animationType !== undefined) properties.animationType = validated.animationType;
    if (validated.animationSpeed !== undefined) properties.animationSpeed = validated.animationSpeed;
    if (validated.animationIntensity !== undefined) properties.animationIntensity = validated.animationIntensity;
    if (validated.animationDelay !== undefined) properties.animationDelay = validated.animationDelay;
    if (validated.keyframes !== undefined) properties.keyframes = validated.keyframes;
    return generateCreateItemCode(
      validated.itemType,
      validated.position,
      properties
    );
  }

  /**
   * Generate code for modifying an item
   */
  generateModifyItem(input: z.infer<typeof ModifyItemInputSchema>): string {
    const validated = ModifyItemInputSchema.parse(input);
    return generateModifyItemCode(
      validated.itemId,
      validated.properties as Record<string, unknown>
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
    return generateAddRelationCode(
      validated.sourceId,
      validated.targetId || validated.sourceId,
      validated.relationType,
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
      validated.params as Record<string, unknown>,
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
    action: 'play' | 'pause' | 'stop' | 'seek',
    duration?: number,
    loop?: boolean,
    time?: number,
    deterministic?: boolean
  ): string {
    return generatePlayTimelineCode(action, duration, loop, time, deterministic);
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
const response = await fetch('${url}');
const svgText = await response.text();
const _r = ${importExpr('svgText')};
const imported = _r.item;
if (imported) {
  imported.position = new paper.Point(${position.x}, ${position.y});
  imported.scale(${scale});
  const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
  app.historyManager.saveState();
  ({ success: true, itemId, changes: _r.changes, position: { x: ${position.x}, y: ${position.y} } });
} else {
  throw new Error('Failed to import SVG from URL');
}
`.trim();
    }

    if (svgString) {
      // Escape the SVG string for embedding in code
      const escapedSvg = svgString.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `
// Import SVG string${source === 'figma' ? ' (Figma-normalised)' : ''}
const svgString = \`${escapedSvg}\`;
const _r = ${importExpr('svgString')};
const imported = _r.item;
if (imported) {
  imported.position = new paper.Point(${position.x}, ${position.y});
  imported.scale(${scale});
  const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
  app.historyManager.saveState();
  ({ success: true, itemId, changes: _r.changes, position: { x: ${position.x}, y: ${position.y} } });
} else {
  throw new Error('Failed to import SVG');
}
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
  return {
    success: !!result.success,
    nodeCount: result.nodes ? result.nodes.length : 0,
    edgeCount: result.edges ? result.edges.length : 0,
    nodes: result.nodes || [],
    edges: result.edges || [],
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
  return {
    success: true,
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
if (typeof app.generators !== 'undefined' && app.generators['${backgroundGenerator}']) {
  app.generators['${backgroundGenerator}']();
}
`);
    }

    // Create all items
    for (const item of items) {
      const { name, itemType, position = { x: 400, y: 300 }, properties = {} } = item;

      // Build properties string
      const propsEntries = Object.entries(properties)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join(', ');

      const propsStr = propsEntries ? `, ${propsEntries}` : '';

      codeParts.push(`
// Create item: ${name}
(function() {
  const itemParams = {
    type: '${itemType}',
    position: { x: ${position.x}, y: ${position.y} }${propsStr}
  };

  let item;
  switch ('${itemType}') {
    case 'circle':
      item = new paper.Path.Circle({
        center: [${position.x}, ${position.y}],
        radius: ${properties.radius || 50},
        fillColor: '${properties.color || properties.fillColor || '#3b82f6'}',
        parent: app.textItemGroup
      });
      break;
    case 'rectangle':
      item = new paper.Path.Rectangle({
        point: [${position.x - ((properties.width as number) || 100) / 2}, ${position.y - ((properties.height as number) || 60) / 2}],
        size: [${properties.width || 100}, ${properties.height || 60}],
        fillColor: '${properties.color || properties.fillColor || '#3b82f6'}',
        parent: app.textItemGroup
      });
      break;
    case 'star':
      item = new paper.Path.Star({
        center: [${position.x}, ${position.y}],
        points: ${properties.points || 5},
        radius1: ${properties.radius1 || 40},
        radius2: ${properties.radius2 || 20},
        fillColor: '${properties.color || properties.fillColor || '#fbbf24'}',
        parent: app.textItemGroup
      });
      break;
    case 'text':
      item = new paper.PointText({
        point: [${position.x}, ${position.y}],
        content: '${properties.content || 'Text'}',
        fontSize: ${properties.fontSize || 24},
        fillColor: '${properties.color || properties.fillColor || '#ffffff'}',
        fontFamily: '${properties.fontFamily || 'Inter'}',
        justification: 'center',
        parent: app.textItemGroup
      });
      break;
    default:
      item = new paper.Path.Circle({
        center: [${position.x}, ${position.y}],
        radius: 30,
        fillColor: '${properties.color || properties.fillColor || '#3b82f6'}',
        parent: app.textItemGroup
      });
  }

  const itemId = app.registerItem(item, '${name}', { source: 'mcp-scene' });
  if (item.bringToFront) item.bringToFront();
  nameToId['${name}'] = itemId;
  results.items.push({ name: '${name}', itemId, type: '${itemType}' });
})();
`);
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
      const { target, type, speed = 1.0, params = {} } = animation;
      const paramsStr = JSON.stringify({ ...params, speed });

      codeParts.push(`
// Apply animation: ${type} to ${target}
(function() {
  const targetId = nameToId['${target}'];
  if (targetId) {
    const targetItem = app.itemRegistry.get(targetId);
    if (targetItem) {
      const params = ${paramsStr};
      app.animate(targetItem, { animationType: '${type}', ...params });
      results.animations.push({ target: '${target}', type: '${type}' });
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
const shapeConfig = {
  shapeType: '${shapeType}',
  position: { x: ${position.x}, y: ${position.y} },
  width: ${widthVal},
  height: ${heightVal},
  label: ${labelStr},
  style: ${styleStr}
};

const shape = app.diagramManager.createShape(shapeConfig);
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
const connector = app.diagramManager.connect(sourceItem, targetItem, config);
const connectorId = connector.data?.registryId || connector.id;
app.historyManager.saveState();

({ connectorId, sourceItemId: '${sourceItemId}', targetItemId: '${targetItemId}' });
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
const connector = app.diagramManager.connectPorts(
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

    const portsStr = ports ? JSON.stringify(ports, null, 2) : 'undefined';
    const countVal = count !== undefined ? count : 'undefined';

    return `
// Add ports to item: ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

const result = app.diagramManager.addPorts(item, {
  portType: '${portType}',
  ports: ${portsStr},
  count: ${countVal}
});
app.historyManager.saveState();

({ itemId: '${itemId}', portsAdded: result.portsAdded || 0, portType: '${portType}' });
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
const itemIds = ${itemIdsStr};
const options = ${optionsStr};

const result = app.diagramManager.autoLayout('${layoutType}', itemIds, options);
app.historyManager.saveState();

({ layoutType: '${layoutType}', itemsAffected: result.itemsAffected || 0, success: result.success });
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
const shapes = app.diagramManager.getAvailableShapes(category);

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
app.diagramManager.updateConnector(connector, updates);
app.historyManager.saveState();

({ connectorId: '${connectorId}', updated: true });
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

app.diagramManager.removeConnector(connector);
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
app.diagramManager.activate();
({ action: 'activate', active: true });
`.trim();

      case 'deactivate':
        return `
// Deactivate diagram mode
app.diagramManager.deactivate();
({ action: 'deactivate', active: false });
`.trim();

      case 'toggle':
        return `
// Toggle diagram mode
const isActive = app.diagramManager.toggle();
({ action: 'toggle', active: isActive });
`.trim();

      case 'setMode':
        const modeStr = mode ? `'${mode}'` : "'select'";
        const shapeStr = shapeType ? `, '${shapeType}'` : '';
        return `
// Set diagram tool mode
app.diagramManager.setMode(${modeStr}${shapeStr});
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
  // Clear canvas
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
  // Set canvas size to preset
  app.setCanvasSize('${canvasPreset}');
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
    const { takeScreenshot, analyzeContent } = validated;

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

  // Get canvas size
  if (app.canvasEl) {
    analysis.canvasSize = { width: app.canvasEl.width, height: app.canvasEl.height };
  } else if (paper.view) {
    analysis.canvasSize = { width: paper.view.size.width, height: paper.view.size.height };
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
  if (app.timeline && (app.timeline.isPlaying || app.timeline.animations?.length > 0)) {
    analysis.hasAnimations = true;
    animationSet.add('timeline');
  }

  analysis.animationTypes = Array.from(animationSet);

  // Check relations
  if (app.relationRegistry) {
    const relations = app.relationRegistry.getAll ? app.relationRegistry.getAll() : [];
    analysis.hasRelations = relations.length > 0;
    relations.forEach(rel => {
      if (rel.relationType) relationSet.add(rel.relationType);
    });
    analysis.relationTypes = Array.from(relationSet);
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
  // Set canvas to preset
  app.setCanvasSize('${canvasPreset}');
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
      results.push({ index: ${index}, success: true, result: result${index} });
      ${claimsItemSlot ? `if (result${index} && result${index}.itemId) {
        itemIds.push(result${index}.itemId);
      }` : ''}
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
    return { success, itemIds, results, operationCount: ${operations.length}, canvasSize: { width: _cs.width || 800, height: _cs.height || 600 } };
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
        const pos = op.position || { x: 400, y: 300 };
        const createProps = (op.properties || {}) as Record<string, unknown>;
        const props = JSON.stringify(createProps);
        let createCode = `
const item = app.create('${op.itemType}', { position: { x: ${pos.x}, y: ${pos.y} }, ...${props} });
const itemId = item.data && item.data.id ? item.data.id : app.registerItem(item, '${op.itemType}', { source: 'mcp-batch' });`;
        // app.create() does not read blendMode/opacity from its params, but the
        // underlying Paper.js item supports them directly — apply post-create so
        // callers can pass them inline in `properties` and have them take effect.
        if (createProps.blendMode !== undefined) {
          createCode += `\nif ('blendMode' in item) item.blendMode = ${JSON.stringify(createProps.blendMode)};`;
        }
        if (createProps.opacity !== undefined) {
          createCode += `\nif ('opacity' in item) item.opacity = ${JSON.stringify(createProps.opacity)};`;
        }
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
if (item.position) item.position = new paper.Point(${pos.x}, ${pos.y});`;
        }
        createCode += `
// Ensure item is visible above backgrounds/generators
if (item.bringToFront) item.bringToFront();
return { itemId };
`;
        return createCode;
      }

      case 'modify':
        const itemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const modifyProps = JSON.stringify(op.properties || {});
        return `
const targetId = ${itemRef};
app.select(targetId);
app.modify(${modifyProps});
return { itemId: targetId, modified: true };
`;

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
        const genParams = JSON.stringify(op.generatorParams || {});
        const genOptions = JSON.stringify(op.generatorRegion ? { region: op.generatorRegion } : {});
        return `
await app.executeGenerator('${genName}', ${genParams}, ${genOptions});
return { success: true, generator: '${genName}'${op.generatorRegion ? ', region: ' + JSON.stringify(op.generatorRegion) : ''} };
`;

      case 'set_canvas_size': {
        const w = op.width || 1080;
        const h = op.height || 1080;
        const sizeArg = op.preset ? `'${op.preset}'` : `{ width: ${w}, height: ${h} }`;
        return `
app.setCanvasSize(${sizeArg});
await new Promise(r => setTimeout(r, 50));
return { success: true, width: ${w}, height: ${h} };
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
app.applyEffect(item, '${op.effectType || 'sparkle'}', ${effParams});
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
  generateAgentExport(input: AgentExportInput): string {
    const validated = AgentExportInputSchema.parse(input);
    const { platform, format, quality, framing, duration, estimateOnly } = validated;
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
    };

    const preset = platformPresets[platform] || platformPresets['web'];
    // Resolve "auto" format to the platform's recommended format
    const exportFormat = (!format || format === 'auto') ? preset.staticFormat : format;

    return `
// Smart export for ${platform}
(async function() {
  const platform = '${platform}';
  const format = '${exportFormat}';
  const quality = '${qualityLevel}';
  const framing = '${framing}';
  const settings = ${JSON.stringify(qualitySettings)};
  const dimensions = ${JSON.stringify({ width: preset.width, height: preset.height })};

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
    };
  }

  // Resolve camera-view framing dims when requested. Reads the first
  // camera_animates keyframe's zoom and divides the canvas dims by it
  // (mirrors FxTool ExportEngine.js:466-485). Camera animation still
  // drives motion during export — framing only fixes the output frame.
  let cameraDims = null;
  if (framing === 'camera') {
    if (!['gif', 'mp4', 'webm'].includes(format)) {
      return { success: false, platform, format, framing, error: 'framing: "camera" is only supported for video formats (gif, mp4, webm). Use format: "mp4" / "gif" / "webm" or omit framing.' };
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
    const firstKf = params.keyframes[0];
    const firstZoom = firstKf && firstKf.zoom > 0 ? firstKf.zoom : 1;
    const canvasEl = document.querySelector('canvas');
    cameraDims = {
      width: Math.round((canvasEl ? canvasEl.width : dimensions.width) / firstZoom),
      height: Math.round((canvasEl ? canvasEl.height : dimensions.height) / firstZoom),
    };
  }

  let result = { success: false, platform, format, quality, framing };

  try {
    switch (format) {
      case 'svg':
        const svgString = app.exportAnimatedSVG ? app.exportAnimatedSVG() : app.exportSVG();
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
        if (app.exportEngine && app.exportEngine.exportPNG) {
          const dataUrl = await app.exportEngine.exportPNG({ dpi: settings.dpi });
          result = {
            success: true,
            platform,
            format: 'png',
            data: dataUrl,
            mimeType: 'image/png',
            size: Math.round(dataUrl.length * 0.75)
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

      case 'gif':
      case 'mp4':
      case 'webm': {
        const videoMimeType = { mp4: 'video/mp4', webm: 'video/webm', gif: 'image/gif' }[format];
        // FxTool VideoExporter._calculateBitrate multiplies a per-resolution
        // base by settings.quality (0.5-1.0). Our existing per-tier compression
        // values (0.6 / 0.85 / 0.95) map directly to that scale. Without this,
        // ExportEngine._quickExportVideo overrides quality with undefined for
        // mp4/webm, _calculateBitrate yields NaN, and VideoEncoder.configure
        // rejects with 'malformed bitrate value'.
        const baseVideoSettings = { format, fps: settings.fps, quality: settings.compression, duration: ${videoDuration} };
        const blobToDataUrl = (b) => new Promise(resolve => {
          const r = new FileReader();
          r.onloadend = () => resolve(r.result);
          r.readAsDataURL(b);
        });
        // Camera framing requires going direct to videoExporter so width/height
        // pass through — _quickExportVideo strips dim fields.
        if (cameraDims && app.exportEngine && app.exportEngine.videoExporter) {
          const blob = await app.exportEngine.videoExporter.export({ ...baseVideoSettings, width: cameraDims.width, height: cameraDims.height });
          const dataUrl = await blobToDataUrl(blob);
          result = { success: true, platform, format, framing, data: dataUrl, mimeType: videoMimeType, size: blob.size, dimensions: cameraDims };
        } else if ((format === 'mp4' || format === 'webm') && app.exportEngine && app.exportEngine.videoExporter) {
          // Bypass _quickExportVideo for mp4/webm — it hardcodes
          // quality:undefined for these formats and produces a NaN bitrate.
          const blob = await app.exportEngine.videoExporter.export(baseVideoSettings);
          const dataUrl = await blobToDataUrl(blob);
          result = { success: true, platform, format, framing, data: dataUrl, mimeType: videoMimeType, size: blob.size };
        } else if (app.exportEngine && app.exportEngine._quickExportVideo) {
          // GIF path (working): _quickExportVideo forwards gifQuality to
          // gif.js. Also serves as the fallback if videoExporter is absent.
          const videoResult = await app.exportEngine._quickExportVideo(format, baseVideoSettings, false);
          if (videoResult && videoResult.blob) {
            const dataUrl = await blobToDataUrl(videoResult.blob);
            result = { success: true, platform, format, framing, data: dataUrl, mimeType: videoMimeType, size: videoResult.blob.size };
          } else {
            result = { success: false, error: format.toUpperCase() + ' export returned no data' };
          }
        } else if (app.exportEngine && app.exportEngine.videoExporter) {
          const blob = await app.exportEngine.videoExporter.export(baseVideoSettings);
          const dataUrl = await blobToDataUrl(blob);
          result = { success: true, platform, format, framing, data: dataUrl, mimeType: videoMimeType, size: blob.size };
        } else {
          result = { success: false, error: format.toUpperCase() + ' export not available' };
        }
        break;
      }

      case 'pdf':
        if (app.exportEngine && app.exportEngine.exportPDF) {
          const blob = await app.exportEngine.exportPDF({ dpi: settings.dpi });
          const reader = new FileReader();
          const dataUrl = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          result = { success: true, platform, format: 'pdf', data: dataUrl, mimeType: 'application/pdf', size: blob.size, dpi: settings.dpi };
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

  // Get canvas size
  if (app.canvasEl) {
    analysis.canvasSize = { width: app.canvasEl.width, height: app.canvasEl.height };
  } else if (paper.view) {
    analysis.canvasSize = { width: paper.view.size.width, height: paper.view.size.height };
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
  if (app.timeline && (app.timeline.isPlaying || app.timeline.animations?.length > 0)) {
    analysis.hasAnimations = true;
    animationSet.add('timeline');
  }

  analysis.animationTypes = Array.from(animationSet);
  analysis.hasGradients = hasGradient;
  analysis.hasShadows = hasShadow;

  // Check relations
  if (app.relationRegistry) {
    const relations = app.relationRegistry.getAll ? app.relationRegistry.getAll() : [];
    analysis.hasRelations = relations.length > 0;
    relations.forEach(rel => {
      if (rel.relationType) relationSet.add(rel.relationType);
    });
    analysis.relationTypes = Array.from(relationSet);
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

  const result = app.animateLetterCollage(collageId, {
    animationType,
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
    const { mapId, ...mapOptions } = validated;
    const optionsStr = Object.keys(mapOptions).length > 0 ? JSON.stringify(mapOptions) : '{}';

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
      center: result.center
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
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';

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
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';

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
    app.mapSystem.addLabels({ regions: ${regionsStr}, ...${optionsStr} });
    return { success: true };
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
    app.mapSystem.panTo(${validated.lat}, ${validated.lon}${Object.keys(options).length > 0 ? ', ' + JSON.stringify(options) : ''});
    return { success: true, panTo: [${validated.lat}, ${validated.lon}] };
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
    app.mapSystem.zoomTo(${validated.level}${Object.keys(options).length > 0 ? ', ' + JSON.stringify(options) : ''});
    return { success: true, zoomLevel: ${validated.level} };
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
    const mapData = app.mapSystem.exportMap();
    return { success: true, ...mapData };
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
    const region = app.mapSystem.getRegionAtPoint({ x: ${validated.x}, y: ${validated.y} });
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
    const result = app.mapSystem.animateWave({
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
    app.mapSystem.stopAnimations({
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
    const result = app.mapSystem.exportRegionCSV({
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
    const result = app.mapSystem.importRegionCSV({
      csvText: \`${escapedCsv}\`,
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
        if (item.rotation) itemData.properties.rotation = item.rotation;
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
    const backgroundColor = app.getBackgroundColor ? app.getBackgroundColor() : null;
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
    const result = app.mapSystem.exportOriginalGeoJSON({
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
    const result = app.mapSystem.getSourceInfo();
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

    return `
// ${description}
(function() {
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
      maskedGroup = app.maskingSystem.applyCustomMask(item, '${preset}', ${keyframesStr}, mergedOpts);
    } else {
      maskedGroup = app.applyAnimatedMask(item, '${preset}', mergedOpts);
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
    return { success: true, templateId: '${templateId}', message: 'Template applied successfully. Canvas has been replaced with template content.' };
  } catch (e) {
    return { error: 'Failed to apply template: ' + e.message };
  }
})();
`.trim();
  }

  generateImportImage(input: ImportImageInput): string {
    const { url, position, maxWidth, maxHeight, mask } = input;

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
    const entry = await app.imageTools.uploadFromURL('${url}');
    const opts = ${optsLiteral};
    const raster = await app.imageTools.placeImage(entry.id, Object.keys(opts).length > 0 ? opts : undefined);
${mask ? `    app.imageTools.applyMask(raster, '${mask}');\n` : ''}    // The REGISTRY id is \`data.id\`. \`data.itemId\` has never existed, so this
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
    return {
      success: true,
      itemId: itemId,
      message: 'Image imported and placed on canvas.',
      bounds: { x: raster.bounds.x, y: raster.bounds.y, width: raster.bounds.width, height: raster.bounds.height }${mask ? `,\n      mask: '${mask}'` : ''}
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
  app.sceneManager.setLoop(${input.enabled ?? true});
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
    return this._facadeCall(method, `${JSON.stringify(input.kit)}, ${opts}`,
      `Brand kit: ${input.action}`);
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
      case 'list':
        return this._facadeCall('listComponents', '', 'Component: list');
      case 'instantiate':
        return this._facadeCall('instantiateComponent',
          `${JSON.stringify(input.componentId || '')}, ${JSON.stringify({
            ...(input.position ? { position: input.position } : {}),
            ...(input.overrides ? { overrides: input.overrides } : {}),
          })}`, 'Component: instantiate');
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
          })}`, 'Compose: apply pattern');
    }
  }

  generateAudioBeats(input: AudioBeatsInput): string {
    if (input.action === 'analyze') {
      return this._facadeCall('analyzeAudio',
        `${JSON.stringify(input.source || '')}, ${JSON.stringify({
          ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
          ...(input.minGap !== undefined ? { minGap: input.minGap } : {}),
        })}`, 'Audio: analyze beats');
    }
    return this._facadeCall('animateToBeat',
      `${JSON.stringify(input.itemId || '')}, ${JSON.stringify({
        ...(input.source ? { source: input.source } : {}),
        ...(input.beats ? { beats: input.beats } : {}),
        ...(input.grid ? { grid: true } : {}),
        ...(input.property ? { property: input.property } : {}),
        ...(input.base !== undefined ? { base: input.base } : {}),
        ...(input.accent !== undefined ? { accent: input.accent } : {}),
        ...(input.decay !== undefined ? { decay: input.decay } : {}),
        ...(input.sensitivity !== undefined ? { sensitivity: input.sensitivity } : {}),
      })}`, 'Audio: animate to beat');
  }

  generateTemplateParams(input: TemplateParamsInput): string {
    if (input.action === 'get') {
      return this._facadeCall('getTemplateParams', JSON.stringify(input.templateId), 'Template params: get');
    }
    return this._facadeCall('applyTemplateWithParams',
      `${JSON.stringify(input.templateId)}, ${JSON.stringify(input.params || {})}`,
      'Template params: apply');
  }

  generateSceneDiff(input: SceneDiffInput): string {
    if (input.action === 'version') {
      return this._facadeCall('diffAgainstVersion', JSON.stringify(input.versionId || ''), 'Scene diff: vs version');
    }
    return this._facadeCall('diffHistoryStates', `${input.indexA ?? 0}, ${input.indexB ?? 0}`, 'Scene diff: history');
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
  const state = app.historyManager.getState();
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
    await app.applyImageFilter(item, ${JSON.stringify(input.filterName || '')}, ${JSON.stringify(input.params || {})});
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
    const filters = ${JSON.stringify(input.filters || [])};
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
    const guard = `if (!app.imageTools) return { error: 'ImageTools not available' };`;
    switch (input.action) {
      case 'activate':
        return `
// Activate lasso selection
(async function() {
  ${guard}
  try {
    await app.imageTools.activateLasso(${JSON.stringify(input.itemId || '')});
    return { success: true, action: 'activate', itemId: ${JSON.stringify(input.itemId || '')} };
  } catch (e) {
    return { error: 'Failed to activate lasso: ' + e.message };
  }
})();`.trim();
      case 'apply':
        return `
// Apply lasso selection
(async function() {
  ${guard}
  try {
    const result = await app.imageTools.applyLasso();
    return { success: true, action: 'apply' };
  } catch (e) {
    return { error: 'Failed to apply lasso: ' + e.message };
  }
})();`.trim();
      default:
        return `(function() { return { error: 'Unknown lasso action: ${(input as any).action}' }; })();`;
    }
  }

  generateCutoutStyle(input: CutoutStyleInput): string {
    const guard = `if (!app.imageTools) return { error: 'ImageTools not available' };`;
    switch (input.action) {
      case 'apply':
        return `
// Apply cutout style
(async function() {
  ${guard}
  try {
    const result = await app.imageTools.applyCutoutStyle(${JSON.stringify(input.itemId || '')}, ${JSON.stringify(input.preset || '')}, ${JSON.stringify(input.options || {})});
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
  const styles = app.imageTools.getCutoutStyles();
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
  const precomp = app.createPrecomp(itemIds, opts);
  return { success: true, action: 'create', precompId: precomp?.id || precomp, name: ${JSON.stringify(input.name || '')} };
})();`.trim();
      }
      case 'add':
        return `
// Add item to precomp
(function() {
  app.addToPrecomp(${JSON.stringify(input.precompId || '')}, ${JSON.stringify(input.itemId || '')});
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
    rotation: item.rotation,
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
    const guard = `if (!app.spriteSheetSystem) return { error: 'SpriteSheetSystem not available' };`;
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
  const sheet = await app.spriteSheetSystem.generateSpriteSheet(${JSON.stringify(input.skeletonId || '')}, ${JSON.stringify(opts)});
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
  const player = await app.spriteSheetSystem.playSpriteSheet(${JSON.stringify(input.spriteSheetId || '')}, ${JSON.stringify(opts)});
  return { success: true, action: 'play', playerId: player.id };
})();`.trim();
      }
      case 'export':
        return `
// Export sprite sheet
(async function() {
  ${guard}
  const result = await app.spriteSheetSystem.exportSpriteSheet(${JSON.stringify(input.spriteSheetId || '')}, { format: '${input.format || 'png'}', download: true, includeMetadata: true });
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
  app.interactionSystem.triggerAction('${input.actionType}', ${params});
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
  return { success: true, json: result.json, filename: result.filename, embedCode: result.embedCode, metadata: result.data?.metadata };
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
  return { success: true, html: result.html, estimatedSize: result.estimatedSize, analysis: { itemTypes: [...result.analysis.itemTypes], relationTypes: [...result.analysis.relationTypes], hasSimpleAnimations: result.analysis.hasSimpleAnimations, hasKeyframeAnimations: result.analysis.hasKeyframeAnimations, hasMasks: result.analysis.hasMasks } };
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
        const dataStr = JSON.stringify(input.data);
        const optsStr = JSON.stringify(input.options || {});
        return `
// Create chart
(function() {
  ${guard}
  const group = app.createChart(${JSON.stringify(input.chartType)}, ${dataStr}, ${optsStr});
  if (!group) return { error: 'Failed to create chart' };
  const chartId = app.chartSystem.getLastChartId();
  return { success: true, action: 'create', chartType: ${JSON.stringify(input.chartType)}, chartId, dataPoints: ${input.data.length} };
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
  app.measurementSystem.setRulersVisible(${enabled});
  return { success: true, action: 'set_rulers', enabled: ${enabled} };
})();`.trim();
      }
      case 'set_grid': {
        const enabled = input.enabled !== false;
        return `
// Toggle grid
(function() {
  ${guard}
  app.measurementSystem.setGridVisible(${enabled});
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
  return { success: true, action: 'get_dimensions', itemId: ${itemIdStr}, x: b.x, y: b.y, width: b.width, height: b.height, rotation: entry.item.rotation || 0 };
})();`.trim();
      }
      case 'set_snap': {
        const enabled = input.enabled !== false;
        return `
// Toggle snap to grid
(function() {
  ${guard}
  app.measurementSystem.setSnapToUnitEnabled(${enabled});
  return { success: true, action: 'set_snap', enabled: ${enabled} };
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
    return Object.assign({ success: !!(res && res.ok) }, res || {});
  } catch (e) { return { success: false, error: String((e && e.message) || e) }; }
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
    return Object.assign({ success: !!(res && res.ok) }, res || {});
  } catch (e) { return { success: false, error: String((e && e.message) || e) }; }
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
  return { success: true, groupId: groupId, groupName: group.data && group.data.groupName, itemCount: items.length };`;
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
  return { success: true, action: 'break_apart', groupId: groupId, partIds: partIds, partCount: partIds.length };
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
  const hashStr = function(s) { let h = 5381; for (let i = 0; i < s.length; i++) { h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0; } return h.toString(16); };
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
    return `
// Instantiate ontology → scene (${ops.filter((o) => o.op === 'create').length} items, ${ops.filter((o) => o.op === 'addRelation').length} relations)
(function() {
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
  return { success: errors.length === 0, itemIds: itemIds, itemCount: itemIds.length, diagnostics: diagnostics, errors: errors };
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
  const info = await A.uploadVideo(${JSON.stringify(input.url)}, ${opts});
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
  const info = await A.uploadAudio(${JSON.stringify(input.url)}, ${opts});
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
  const removed = A.removeMedia(${JSON.stringify(input.id)});
  return { success: removed, action: 'remove', id: ${JSON.stringify(input.id)}, removed: removed };
})();`.trim();
      case 'set_playback_rate':
        return `
// Set media playback rate
(function() {
${guard}
  const ok = A.setMediaPlaybackRate(${JSON.stringify(input.id)}, ${input.rate});
  return { success: ok, action: 'set_playback_rate', id: ${JSON.stringify(input.id)}, rate: ${input.rate} };
})();`.trim();
      case 'set_clip':
        return `
// Re-trim an existing media clip (media-time seconds)
(function() {
${guard}
  if (typeof A.setMediaClip !== 'function') { return { success: false, error: 'setMediaClip unavailable — update FxTool' }; }
  const ok = A.setMediaClip(${JSON.stringify(input.id)}, ${input.inPoint}, ${input.outPoint});
  return { success: ok, action: 'set_clip', id: ${JSON.stringify(input.id)}, inPoint: ${input.inPoint}, outPoint: ${input.outPoint} };
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
  return r && r.ok ? { success: true, action: 'set_time_remap', points: r.points } : { success: false, error: (r && r.error) || 'remap failed' };
})();`.trim();
      }
      case 'speed_ramp': {
        const S = (v: unknown) => JSON.stringify(v);
        return `
// Speed ramp: consecutive {duration, speed} segments compiled to a remap curve
(function() {
  if (typeof app.speedRamp !== 'function') { return { success: false, error: 'app.speedRamp unavailable — update FxTool to a time-remap-capable build' }; }
  const r = app.speedRamp(${S(input.id)}, ${S(input.segments)});
  return r && r.ok ? { success: true, action: 'speed_ramp', points: r.points } : { success: false, error: (r && r.error) || 'speed ramp failed' };
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
(function() {
  if (typeof app.applyTextStyle !== 'function') { return { success: false, error: 'app.applyTextStyle unavailable — update FxTool to a text-styles build' }; }
  const r = app.applyTextStyle(${S(input.itemId)}, ${S(input.styleKey)}, ${opts});
  if (!r || !r.ok) { return { success: false, error: (r && r.error) || 'style failed' }; }
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
  // mode this surface exists to prevent.
  return { success: true, action: 'set_font_axes', applied: r.applied, rejected: r.rejected || [] };
})();`.trim();
      }
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
  return {
    success: true, action: 'apply', effect: r.effect, ids: r.ids, count: r.count,
    duration: r.duration, sourceRemoved: ${S(input.keepSource !== true)},
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
  await app.createWorld3D(${S(input.spec ?? 'forest')}, ${opts});
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
  const r = app.configureWorld3D(${S(input.patch)});
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
  const id = app.addWorldObject(${S(input.object)});
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
  return { success: !!skeletonId, action: 'create_skeleton', skeletonId: skeletonId };`);
      }
      case 'add_bone': {
        const config = S({
          ...(input.name !== undefined ? { name: input.name } : {}),
          ...(input.parentBoneId !== undefined ? { parentBoneId: input.parentBoneId } : {}),
          ...(input.length !== undefined ? { length: input.length } : {}),
          ...(input.angle !== undefined ? { angle: input.angle } : {}),
          ...(input.flexibility !== undefined ? { flexibility: input.flexibility } : {}),
          ...(input.segments !== undefined ? { segments: input.segments } : {}),
        });
        return wrap('Rigging: add bone',
          `  const boneId = R.addBone(${S(input.skeletonId)}, ${config});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!boneId, action: 'add_bone', boneId: boneId };`);
      }
      case 'attach_item': {
        const opts = S(input.attachPoint !== undefined ? { attachPoint: input.attachPoint } : {});
        return wrap('Rigging: attach item to bone',
          `  const ok = R.attachItem(${S(input.skeletonId)}, ${S(input.boneId)}, ${S(input.itemId)}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!ok, action: 'attach_item', itemId: ${S(input.itemId)}, boneId: ${S(input.boneId)} };`);
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
  return { success: !!chainId, action: 'create_ik_chain', chainId: chainId };`);
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
        return wrap('Rigging: add pose keyframe',
          `  const ok = R.addPoseKeyframe(${S(input.skeletonId)}, ${input.time}, ${S(input.pose)}, ${S(input.easing ?? 'linear')}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!ok, action: 'add_pose_keyframe', time: ${input.time} };`);
      }
      case 'set_target_path': {
        const opts = S({
          ...(input.duration !== undefined ? { duration: input.duration } : {}),
          ...(input.loop !== undefined ? { loop: input.loop } : {}),
        });
        return wrap('Rigging: set IK target path',
          `  const ok = R.setTargetPath(${S(input.skeletonId)}, ${S(input.chainId)}, ${S(input.waypoints)}, ${opts});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!ok, action: 'set_target_path', chainId: ${S(input.chainId)} };`);
      }
      case 'save_pose':
        return wrap('Rigging: save pose',
          `  const poseId = R.savePose(${S(input.skeletonId)}, ${S(input.name ?? null)});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!poseId, action: 'save_pose', poseId: poseId };`);
      case 'save_shape_key':
        return wrap('Rigging: save shape key',
          `  const shapeKeyId = R.saveShapeKey(${S(input.skeletonId)}, ${S(input.name ?? null)});
  if (app.historyManager) app.historyManager.saveState();
  return { success: !!shapeKeyId, action: 'save_shape_key', shapeKeyId: shapeKeyId };`);

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
