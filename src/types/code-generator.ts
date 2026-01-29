/**
 * PinePaper Code Generator
 * 
 * Converts MCP tool inputs to executable PinePaper JavaScript code.
 * This code is designed to run in the browser context where window.PinePaper is available.
 */

import {
  ItemType,
  SimpleAnimationType,
  RelationType,
  GeneratorName,
  CreateItemInputSchema,
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
  // Interactive/Trigger types
  AddTriggerInputSchema,
  AddTriggerInput,
  RemoveTriggerInputSchema,
  RemoveTriggerInput,
  QueryTriggersInputSchema,
  QueryTriggersInput,
  // Quiz types
  CreateQuizInputSchema,
  CreateQuizInput,
  GetQuizStateInputSchema,
  GetQuizStateInput,
  ResetQuizInputSchema,
  ResetQuizInput,
  // Widget export types
  ExportWidgetInputSchema,
  ExportWidgetInput,
  // Letter collage types
  CreateLetterCollageInputSchema,
  CreateLetterCollageInput,
  AnimateLetterCollageInputSchema,
  AnimateLetterCollageInput,
  GetLetterCollageOptionsInputSchema,
  GetLetterCollageOptionsInput,
  // Canvas presets types
  GetCanvasPresetsInputSchema,
  GetCanvasPresetsInput,
  // Map types
  LoadMapInputSchema,
  LoadMapInput,
  HighlightRegionsInputSchema,
  HighlightRegionsInput,
  UnhighlightRegionsInputSchema,
  UnhighlightRegionsInput,
  ApplyDataColorsInputSchema,
  ApplyDataColorsInput,
  AddMarkerInputSchema,
  AddMarkerInput,
  AddMapLabelsInputSchema,
  AddMapLabelsInput,
  PanMapInputSchema,
  PanMapInput,
  ZoomMapInputSchema,
  ZoomMapInput,
  ExportMapInputSchema,
  ExportMapInput,
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
  GetAnimatedMapRegionsInputSchema,
  GetAnimatedMapRegionsInput,
  ExportMapRegionCSVInputSchema,
  ExportMapRegionCSVInput,
  ImportMapRegionCSVInputSchema,
  ImportMapRegionCSVInput,
  SelectMapRegionsInputSchema,
  SelectMapRegionsInput,
  DeselectMapRegionsInputSchema,
  DeselectMapRegionsInput,
  GetHighlightedMapRegionsInputSchema,
  GetHighlightedMapRegionsInput,
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
} from './schemas.js';
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
  return `
// Modify item ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}
app.modify(item, ${JSON.stringify(properties, null, 2)});
app.historyManager.saveState();

// Return success
({ success: true, itemId: '${itemId}' });
`.trim();
}

/**
 * Template for deleting items
 */
function generateDeleteItemCode(itemId: string): string {
  return `
// Delete item ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}
item.remove();
app.itemRegistry.remove('${itemId}');
app.historyManager.saveState();

// Return success
({ success: true, itemId: '${itemId}' });
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
  targetId: r.targetId,
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
  relationType: '${relationType || 'unknown'}',
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
  speed: number
): string {
  return `
// Apply ${animationType} animation to ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}
app.animate(item, {
  animationType: '${animationType}',
  animationSpeed: ${speed}
});

({ success: true, itemId: '${itemId}', animationType: '${animationType}' });
`.trim();
}

/**
 * Template for keyframe animation
 */
function generateKeyframeAnimateCode(
  itemId: string,
  keyframes: Keyframe[],
  duration?: number,
  loop: boolean = false
): string {
  const keyframesJson = JSON.stringify(keyframes, null, 2);
  const calculatedDuration = duration || Math.max(...keyframes.map(k => k.time));
  
  return `
// Apply keyframe animation to ${itemId}
const item = app.getItemById('${itemId}');
if (!item) {
  throw new Error('Item not found: ${itemId}');
}

app.modify(item, {
  animationType: 'keyframe',
  keyframes: ${keyframesJson}
});

// Start playback
app.playKeyframeTimeline(${calculatedDuration}, ${loop});

({ success: true, itemId: '${itemId}', duration: ${calculatedDuration}, loop: ${loop} });
`.trim();
}

/**
 * Template for executing generators
 */
function generateExecuteGeneratorCode(
  generatorName: GeneratorName,
  params: Record<string, unknown>
): string {
  return `
// Execute ${generatorName} generator
await app.executeGenerator('${generatorName}', ${JSON.stringify(params, null, 2)});

({ success: true, generator: '${generatorName}' });
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
  action: 'play' | 'stop' | 'seek',
  duration?: number,
  loop?: boolean,
  time?: number
): string {
  switch (action) {
    case 'play':
      return `
// Play keyframe timeline
app.playKeyframeTimeline(${duration || 5}, ${loop ?? false});
({ success: true, action: 'play', duration: ${duration || 5}, loop: ${loop ?? false} });
`.trim();
    case 'stop':
      return `
// Stop keyframe timeline
app.stopKeyframeTimeline();
({ success: true, action: 'stop' });
`.trim();
    case 'seek':
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
  return `
// Set canvas size
app.setCanvasSize(${width}, ${height}${preset ? `, '${preset}'` : ''});
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
// Clear all items from canvas
const entries = app.itemRegistry.getAll();
const itemIds = entries.map(entry => entry.id || entry.itemId);
let removedCount = 0;

for (const itemId of itemIds) {
  try {
    const item = app.getItemById(itemId);
    if (item) {
      item.remove();
      app.itemRegistry.remove(itemId);
      removedCount++;
    }
  } catch (e) {
    console.warn('Failed to remove item:', itemId, e);
  }
}

// Also clear any relations
if (app.clearAllRelations) {
  app.clearAllRelations();
}

app.historyManager.saveState();

// Verify canvas is empty
const remaining = app.itemRegistry.getAll().length;

({ success: true, removedCount, remainingItems: remaining });
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
    return generateCreateItemCode(
      validated.itemType,
      validated.position,
      validated.properties as Record<string, unknown>
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
      validated.targetId,
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
      validated.speed
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
      validated.loop
    );
  }

  /**
   * Generate code for executing a generator
   */
  generateExecuteGenerator(input: z.infer<typeof ExecuteGeneratorInputSchema>): string {
    const validated = ExecuteGeneratorInputSchema.parse(input);
    return generateExecuteGeneratorCode(
      validated.generatorName,
      validated.params as Record<string, unknown>
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
    action: 'play' | 'stop' | 'seek',
    duration?: number,
    loop?: boolean,
    time?: number
  ): string {
    return generatePlayTimelineCode(action, duration, loop, time);
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
    scale: number = 1.0
  ): string {
    if (url) {
      return `
// Import SVG from URL
const response = await fetch('${url}');
const svgText = await response.text();
const imported = app.importSVG(svgText);
if (imported) {
  imported.position = new paper.Point(${position.x}, ${position.y});
  imported.scale(${scale});
  const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
  app.historyManager.saveState();
  ({ success: true, itemId, position: { x: ${position.x}, y: ${position.y} } });
} else {
  throw new Error('Failed to import SVG from URL');
}
`.trim();
    }

    if (svgString) {
      // Escape the SVG string for embedding in code
      const escapedSvg = svgString.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
      return `
// Import SVG string
const svgString = \`${escapedSvg}\`;
const imported = app.importSVG(svgString);
if (imported) {
  imported.position = new paper.Point(${position.x}, ${position.y});
  imported.scale(${scale});
  const itemId = app.registerItem(imported, 'svg-import', { source: 'mcp' });
  app.historyManager.saveState();
  ({ success: true, itemId, position: { x: ${position.x}, y: ${position.y} } });
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
    // Import the p5 helpers generator
    const { generateP5DrawCode } = require('../tools/p5-compat/p5-helpers.js');
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
    const sourceItem = app.itemRegistry.get(sourceId);
    const targetItem = app.itemRegistry.get(targetId);
    if (sourceItem && targetItem) {
      const params = ${paramsStr};
      app.relationManager.addRelation(sourceItem, targetItem, '${type}', params);
      results.relations.push({ source: '${source}', target: '${target}', type: '${type}' });
    }
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
      app.animationManager.addAnimation(targetItem, '${type}', params);
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
    const labelStr = label ? `'${label.replace(/'/g, "\\'")}'` : 'null';

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
    const { sourceItemId, sourcePort, targetItemId, targetPort, config } = validated;

    const configStr = config ? JSON.stringify(config, null, 2) : '{}';

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
      updates.push(`label: '${label.replace(/'/g, "\\'")}'`);
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
    const { name, screenshotPolicy, canvasPreset, clearCanvas } = validated;

    const nameStr = name ? `'${name.replace(/'/g, "\\'")}'` : 'null';
    const policyStr = screenshotPolicy || 'on_complete';
    const shouldClear = clearCanvas !== false;

    let code = `
// Start agent job
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
`;
    }

    code += `
// Return job context
({
  success: true,
  jobStarted: true,
  name: ${nameStr},
  screenshotPolicy: '${policyStr}',
  canvasPreset: ${canvasPreset ? `'${canvasPreset}'` : 'null'},
  canvasCleared: ${shouldClear}
});
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
    if (item.fillColor && item.fillColor.gradient) analysis.hasGradients = true;
    if (item.shadowColor || item.shadowBlur) analysis.hasShadows = true;
  });

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
({ success: true, reset: true, canvasPreset: ${canvasPreset ? `'${canvasPreset}'` : 'null'} });
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

    let code = `
// Batch execute ${operations.length} operations
(async function() {
  const results = [];
  const itemIds = [];
  let success = true;

  try {
`;

    operations.forEach((op, index) => {
      const opCode = this.generateBatchOperationCode(op, index);
      code += `
    // Operation ${index}: ${op.type}
    try {
      const result${index} = await (async () => {
        ${opCode}
      })();
      results.push({ index: ${index}, success: true, result: result${index} });
      if (result${index} && result${index}.itemId) {
        itemIds.push(result${index}.itemId);
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

    return { success, itemIds, results, operationCount: ${operations.length} };
  } catch (e) {
    return { success: false, error: e.message, itemIds, results, operationCount: ${operations.length} };
  }
})();
`;

    return code.trim();
  }

  /**
   * Generate code for a single batch operation
   */
  private generateBatchOperationCode(op: z.infer<typeof AgentBatchExecuteInputSchema>['operations'][0], index: number): string {
    switch (op.type) {
      case 'create':
        const pos = op.position || { x: 400, y: 300 };
        const props = JSON.stringify(op.properties || {});
        return `
const item = app.createItem('${op.itemType}', { x: ${pos.x}, y: ${pos.y} }, ${props});
const itemId = app.itemRegistry.register(item, '${op.itemType}');
return { itemId };
`;

      case 'modify':
        const itemRef = op.itemId?.startsWith('$')
          ? `itemIds[${op.itemId.substring(1)}]`
          : `'${op.itemId}'`;
        const modifyProps = JSON.stringify(op.properties || {});
        return `
const targetId = ${itemRef};
const item = app.getItemById(targetId);
if (!item) throw new Error('Item not found: ' + targetId);
Object.assign(item, ${modifyProps});
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
app.animateItem(item, '${op.animationType}', ${animOpts});
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

      default:
        return `throw new Error('Unknown operation type');`;
    }
  }

  /**
   * Generate code for smart export
   */
  generateAgentExport(input: AgentExportInput): string {
    const validated = AgentExportInputSchema.parse(input);
    const { platform, format, quality } = validated;
    const qualityLevel = quality || 'standard';

    // Quality settings
    const qualitySettings = {
      draft: { compression: 0.6, fps: 15, dpi: 72 },
      standard: { compression: 0.85, fps: 30, dpi: 150 },
      high: { compression: 0.95, fps: 60, dpi: 300 },
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
    const exportFormat = format || preset.staticFormat;

    return `
// Smart export for ${platform}
(async function() {
  const platform = '${platform}';
  const format = '${exportFormat}';
  const quality = '${qualityLevel}';
  const settings = ${JSON.stringify(qualitySettings)};
  const dimensions = ${JSON.stringify({ width: preset.width, height: preset.height })};

  let result = { success: false, platform, format, quality };

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
        break;

      case 'gif':
        if (app.exportGIF) {
          const blob = await app.exportGIF({ fps: settings.fps, quality: settings.compression, duration: 5 });
          const reader = new FileReader();
          const dataUrl = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          result = { success: true, platform, format: 'gif', data: dataUrl, mimeType: 'image/gif', size: blob.size };
        } else {
          result = { success: false, error: 'GIF export not available' };
        }
        break;

      case 'mp4':
      case 'webm':
        const exportMethod = format === 'mp4' ? 'exportMP4' : 'exportWebM';
        const mimeType = format === 'mp4' ? 'video/mp4' : 'video/webm';
        if (app[exportMethod]) {
          const blob = await app[exportMethod]({ fps: settings.fps, duration: 5, ...dimensions });
          const reader = new FileReader();
          const dataUrl = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          result = { success: true, platform, format, data: dataUrl, mimeType, size: blob.size };
        } else {
          result = { success: false, error: format.toUpperCase() + ' export not available' };
        }
        break;

      case 'pdf':
        if (app.exportPDF) {
          const blob = await app.exportPDF({ dpi: settings.dpi });
          const reader = new FileReader();
          const dataUrl = await new Promise(resolve => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          result = { success: true, platform, format: 'pdf', data: dataUrl, mimeType: 'application/pdf', size: blob.size, dpi: settings.dpi };
        } else {
          result = { success: false, error: 'PDF export not available' };
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

    if (item.fillColor && item.fillColor.gradient) hasGradient = true;
    if (item.strokeColor && item.strokeColor.gradient) hasGradient = true;
    if (item.shadowColor || item.shadowBlur) hasShadow = true;
  });

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
  // INTERACTIVE TRIGGER CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code for adding a trigger
   */
  generateAddTrigger(input: AddTriggerInput): string {
    const validated = AddTriggerInputSchema.parse(input);
    const { itemId, event, actions, condition, timelineOffset } = validated;

    const actionsStr = JSON.stringify(actions);
    const conditionStr = condition ? `'${condition.replace(/'/g, "\\'")}'` : 'null';
    const offsetStr = timelineOffset !== undefined ? timelineOffset : 'null';

    return `
// Add trigger to ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

const trigger = {
  event: '${event}',
  actions: ${actionsStr},
  condition: ${conditionStr},
  timelineOffset: ${offsetStr}
};

// Initialize triggers array if needed
if (!item.data) item.data = {};
if (!item.data.triggers) item.data.triggers = [];

// Add trigger
item.data.triggers.push(trigger);

// Register event handler
if (app.triggerManager) {
  app.triggerManager.registerTrigger(item, trigger);
}

app.historyManager.saveState();
({ success: true, itemId: '${itemId}', event: '${event}', triggerId: item.data.triggers.length - 1 });
`.trim();
  }

  /**
   * Generate code for removing a trigger
   */
  generateRemoveTrigger(input: RemoveTriggerInput): string {
    const validated = RemoveTriggerInputSchema.parse(input);
    const { itemId, event, removeAll } = validated;

    if (removeAll) {
      return `
// Remove all triggers from ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

const removedCount = item.data?.triggers?.length || 0;
if (item.data) item.data.triggers = [];

if (app.triggerManager) {
  app.triggerManager.unregisterAll(item);
}

app.historyManager.saveState();
({ success: true, itemId: '${itemId}', removedCount, removeAll: true });
`.trim();
    }

    return `
// Remove ${event} trigger from ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

let removedCount = 0;
if (item.data?.triggers) {
  const before = item.data.triggers.length;
  item.data.triggers = item.data.triggers.filter(t => t.event !== '${event}');
  removedCount = before - item.data.triggers.length;
}

if (app.triggerManager) {
  app.triggerManager.unregisterEvent(item, '${event}');
}

app.historyManager.saveState();
({ success: true, itemId: '${itemId}', event: '${event}', removedCount });
`.trim();
  }

  /**
   * Generate code for querying triggers
   */
  generateQueryTriggers(input: QueryTriggersInput): string {
    const validated = QueryTriggersInputSchema.parse(input);
    const { itemId, event } = validated;

    if (itemId) {
      return `
// Query triggers for ${itemId}
const item = app.getItemById('${itemId}');
if (!item) throw new Error('Item not found: ${itemId}');

let triggers = item.data?.triggers || [];
${event ? `triggers = triggers.filter(t => t.event === '${event}');` : ''}

({ success: true, itemId: '${itemId}', triggers, count: triggers.length });
`.trim();
    }

    return `
// Query all triggers
const allTriggers = [];
const items = app.itemRegistry ? app.itemRegistry.getAll() : [];

items.forEach(entry => {
  const item = entry.item;
  if (item.data?.triggers?.length > 0) {
    let triggers = item.data.triggers;
    ${event ? `triggers = triggers.filter(t => t.event === '${event}');` : ''}
    triggers.forEach((trigger, idx) => {
      allTriggers.push({
        itemId: entry.id,
        triggerId: idx,
        ...trigger
      });
    });
  }
});

({ success: true, triggers: allTriggers, count: allTriggers.length${event ? `, event: '${event}'` : ''} });
`.trim();
  }

  // ===========================================================================
  // QUIZ CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code for creating a quiz
   */
  generateCreateQuiz(input: CreateQuizInput): string {
    const validated = CreateQuizInputSchema.parse(input);
    const { title, questions, passingScore, showScore, allowRetry, shuffleQuestions, shuffleOptions } = validated;

    const quizConfig = JSON.stringify({
      title: title || 'Untitled Quiz',
      questions,
      passingScore: passingScore || 70,
      showScore: showScore !== false,
      allowRetry: allowRetry !== false,
      shuffleQuestions: shuffleQuestions || false,
      shuffleOptions: shuffleOptions || false,
    }, null, 2);

    return `
// Create quiz
const quizConfig = ${quizConfig};

// Initialize quiz manager if needed
if (!app.quizManager) {
  app.quizManager = {
    quizzes: [],
    activeQuiz: null,
    createQuiz: function(config) {
      const quiz = {
        id: 'quiz_' + Date.now(),
        ...config,
        state: {
          currentQuestion: 0,
          answers: [],
          score: 0,
          maxScore: config.questions.reduce((sum, q) => sum + q.points, 0),
          complete: false
        }
      };
      this.quizzes.push(quiz);
      this.activeQuiz = quiz;
      return quiz;
    }
  };
}

const quiz = app.quizManager.createQuiz(quizConfig);
app.historyManager.saveState();

({
  success: true,
  quizId: quiz.id,
  title: quiz.title,
  questionCount: quiz.questions.length,
  maxScore: quiz.state.maxScore,
  passingScore: quiz.passingScore
});
`.trim();
  }

  /**
   * Generate code for getting quiz state
   */
  generateGetQuizState(input: GetQuizStateInput): string {
    const validated = GetQuizStateInputSchema.parse(input);
    const { quizId } = validated;

    const quizRef = quizId
      ? `app.quizManager.quizzes.find(q => q.id === '${quizId}')`
      : 'app.quizManager?.activeQuiz';

    return `
// Get quiz state
if (!app.quizManager) {
  return { success: false, error: 'No quiz manager initialized' };
}

const quiz = ${quizRef};
if (!quiz) {
  return { success: false, error: 'Quiz not found' };
}

({
  success: true,
  quizId: quiz.id,
  title: quiz.title,
  currentQuestion: quiz.state.currentQuestion,
  totalQuestions: quiz.questions.length,
  score: quiz.state.score,
  maxScore: quiz.state.maxScore,
  answers: quiz.state.answers,
  complete: quiz.state.complete,
  passed: quiz.state.complete ? (quiz.state.score / quiz.state.maxScore * 100) >= quiz.passingScore : null
});
`.trim();
  }

  /**
   * Generate code for resetting a quiz
   */
  generateResetQuiz(input: ResetQuizInput): string {
    const validated = ResetQuizInputSchema.parse(input);
    const { quizId } = validated;

    const quizRef = quizId
      ? `app.quizManager.quizzes.find(q => q.id === '${quizId}')`
      : 'app.quizManager?.activeQuiz';

    return `
// Reset quiz
if (!app.quizManager) {
  return { success: false, error: 'No quiz manager initialized' };
}

const quiz = ${quizRef};
if (!quiz) {
  return { success: false, error: 'Quiz not found' };
}

// Reset state
quiz.state = {
  currentQuestion: 0,
  answers: [],
  score: 0,
  maxScore: quiz.questions.reduce((sum, q) => sum + q.points, 0),
  complete: false
};

app.historyManager.saveState();

({ success: true, quizId: quiz.id, reset: true });
`.trim();
  }

  // ===========================================================================
  // WIDGET EXPORT CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code for exporting widget
   */
  generateExportWidget(input: ExportWidgetInput): string {
    const validated = ExportWidgetInputSchema.parse(input);
    const { format, sizing, interactivity, autoplay, loop, lmsEnabled, width, height } = validated;

    const sizingMode = sizing || 'responsive';
    const interactivityLevel = interactivity || 'view';
    const shouldAutoplay = autoplay !== false;
    const shouldLoop = loop !== false;
    const hasLms = lmsEnabled || false;

    return `
// Export widget as ${format}
(async function() {
  const format = '${format}';
  const sizing = '${sizingMode}';
  const interactivity = '${interactivityLevel}';
  const autoplay = ${shouldAutoplay};
  const loop = ${shouldLoop};
  const lmsEnabled = ${hasLms};
  const fixedWidth = ${width || 'null'};
  const fixedHeight = ${height || 'null'};

  // Capture scene data
  const sceneData = app.exportSceneData ? JSON.stringify(app.exportSceneData()) : '{}';

  // Get canvas dimensions
  let canvasWidth = fixedWidth || (app.canvasEl ? app.canvasEl.width : 800);
  let canvasHeight = fixedHeight || (app.canvasEl ? app.canvasEl.height : 600);

  // Check for animations
  const items = app.itemRegistry ? app.itemRegistry.getAll() : [];
  const hasAnimations = items.some(e => e.item.data?.animationType);
  const hasRelations = app.relationRegistry && app.relationRegistry.getAll().length > 0;
  const hasQuiz = app.quizManager && app.quizManager.quizzes.length > 0;
  const hasTriggers = items.some(e => e.item.data?.triggers?.length > 0);

  const metadata = {
    hasInteractivity: hasTriggers || interactivity === 'full',
    hasAnimations: hasAnimations || hasRelations,
    hasQuiz,
    width: canvasWidth,
    height: canvasHeight,
    sizing,
    interactivity
  };

  let code = '';
  let embedCode = '';

  switch (format) {
    case 'web-component':
      code = \`<script src="https://cdn.pinepaper.io/widget.js"></script>
<pinepaper-widget
  data-scene='\${sceneData}'
  data-sizing="\${sizing}"
  data-interactivity="\${interactivity}"
  data-autoplay="\${autoplay}"
  data-loop="\${loop}"
  \${fixedWidth ? 'width="' + canvasWidth + '"' : ''}
  \${fixedHeight ? 'height="' + canvasHeight + '"' : ''}
></pinepaper-widget>\`;
      embedCode = code;
      break;

    case 'standalone-html':
      code = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PinePaper Widget</title>
  <script src="https://cdn.pinepaper.io/runtime.js"></script>
  <style>
    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .pinepaper-container { \${sizing === 'responsive' ? 'width: 100%; max-width: ' + canvasWidth + 'px;' : sizing === 'fluid' ? 'width: 100%; height: 100%;' : 'width: ' + canvasWidth + 'px; height: ' + canvasHeight + 'px;'} }
  </style>
</head>
<body>
  <div class="pinepaper-container" id="pinepaper-widget"></div>
  <script>
    PinePaper.init('#pinepaper-widget', {
      scene: \${sceneData},
      autoplay: \${autoplay},
      loop: \${loop},
      interactivity: '\${interactivity}'\${hasLms ? ',\\n      lms: true' : ''}
    });
  </script>
</body>
</html>\`;
      embedCode = \`<iframe src="[URL_TO_HOSTED_FILE]" width="\${canvasWidth}" height="\${canvasHeight}" frameborder="0"></iframe>\`;
      break;

    case 'iframe-embed':
      const dataUri = 'data:text/html;base64,' + btoa(\`<!DOCTYPE html><html><head><script src="https://cdn.pinepaper.io/runtime.js"></script></head><body><div id="w"></div><script>PinePaper.init('#w',{scene:\${sceneData},autoplay:\${autoplay},loop:\${loop}});</script></body></html>\`);
      code = dataUri;
      embedCode = \`<iframe src="\${dataUri}" width="\${canvasWidth}" height="\${canvasHeight}" frameborder="0" allowfullscreen></iframe>\`;
      break;

    case 'react-component':
      code = \`import { useEffect, useRef } from 'react';

export function PinepaperWidget({ className }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && window.PinePaper) {
      window.PinePaper.init(containerRef.current, {
        scene: \${sceneData},
        autoplay: \${autoplay},
        loop: \${loop},
        interactivity: '\${interactivity}'
      });
    }
  }, []);

  return <div ref={containerRef} className={className} style={{ width: '\${sizing === 'fixed' ? canvasWidth + 'px' : '100%'}', height: '\${sizing === 'fixed' ? canvasHeight + 'px' : 'auto'}' }} />;
}

// Usage: <PinepaperWidget className="my-widget" />\`;
      embedCode = '<PinepaperWidget />';
      break;

    case 'vue-component':
      code = \`<template>
  <div ref="container" :class="className" :style="containerStyle"></div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const props = defineProps({ className: String });
const container = ref(null);

const containerStyle = computed(() => ({
  width: '\${sizing === 'fixed' ? canvasWidth + 'px' : '100%'}',
  height: '\${sizing === 'fixed' ? canvasHeight + 'px' : 'auto'}'
}));

onMounted(() => {
  if (container.value && window.PinePaper) {
    window.PinePaper.init(container.value, {
      scene: \${sceneData},
      autoplay: \${autoplay},
      loop: \${loop},
      interactivity: '\${interactivity}'
    });
  }
});
</script>

<!-- Usage: <PinepaperWidget class="my-widget" /> -->\`;
      embedCode = '<PinepaperWidget />';
      break;
  }

  return {
    success: true,
    format,
    code,
    embedCode,
    sceneData,
    metadata
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

    return `
// Create letter collage: "${text}"
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

  return result;
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

  /**
   * Generate code to get letter collage options
   */
  generateGetLetterCollageOptions(): string {
    return `
// Get letter collage options
(function() {
  if (!app.getLetterCollageOptions) {
    // Return static options if function not available
    return {
      success: true,
      styles: ['tile', 'magazine', 'paperCut', 'fold', 'gradient', 'image'],
      tilePalettes: {
        game: ['wordle', 'scrabble'],
        vibrant: ['candy', 'neon', 'rainbow'],
        soft: ['pastel', 'cotton'],
        natural: ['earth', 'ocean', 'forest', 'sunset'],
        professional: ['corporate', 'minimal', 'slate'],
        seasonal: ['christmas', 'halloween', 'spring'],
        magazine: ['magazine', 'newspaper', 'vintage'],
        paperCraft: ['paperCraft', 'origami', 'craftPaper']
      },
      gradientPalettes: ['rainbow', 'sunset', 'ocean', 'fire', 'gold', 'rose', 'ice', 'cyberpunk', 'neonGlow', 'purplePink'],
      gradientDirections: ['vertical', 'horizontal', 'diagonal', 'radial']
    };
  }

  return app.getLetterCollageOptions();
})();
`.trim();
  }

  // ===========================================================================
  // CANVAS PRESETS CODE GENERATORS
  // ===========================================================================

  /**
   * Generate code to get canvas presets
   */
  generateGetCanvasPresets(): string {
    return `
// Get canvas presets
(function() {
  if (app.getCanvasPresets) {
    return app.getCanvasPresets();
  }

  // Return static presets if function not available
  return {
    success: true,
    presets: [
      { key: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720, aspectRatio: '16:9', category: 'video' },
      { key: 'youtube-short', name: 'YouTube Shorts', width: 1080, height: 1920, aspectRatio: '9:16', category: 'video' },
      { key: 'tiktok', name: 'TikTok', width: 1080, height: 1920, aspectRatio: '9:16', category: 'video' },
      { key: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social' },
      { key: 'instagram-post', name: 'Instagram Post (Square)', width: 1080, height: 1080, aspectRatio: '1:1', category: 'social' },
      { key: 'instagram-landscape', name: 'Instagram Landscape', width: 1080, height: 566, aspectRatio: '1.91:1', category: 'social' },
      { key: 'instagram-portrait', name: 'Instagram Portrait', width: 1080, height: 1350, aspectRatio: '4:5', category: 'social' },
      { key: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630, aspectRatio: '1.91:1', category: 'social' },
      { key: 'facebook-cover', name: 'Facebook Cover', width: 820, height: 312, aspectRatio: '2.63:1', category: 'social' },
      { key: 'facebook-story', name: 'Facebook Story', width: 1080, height: 1920, aspectRatio: '9:16', category: 'social' },
      { key: 'twitter-post', name: 'Twitter/X Post', width: 1200, height: 675, aspectRatio: '16:9', category: 'social' },
      { key: 'twitter-header', name: 'Twitter/X Header', width: 1500, height: 500, aspectRatio: '3:1', category: 'social' },
      { key: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627, aspectRatio: '1.91:1', category: 'social' },
      { key: 'linkedin-banner', name: 'LinkedIn Banner', width: 1584, height: 396, aspectRatio: '4:1', category: 'social' },
      { key: 'pinterest-pin', name: 'Pinterest Pin', width: 1000, height: 1500, aspectRatio: '2:3', category: 'social' },
      { key: 'presentation-16x9', name: 'Presentation 16:9', width: 1920, height: 1080, aspectRatio: '16:9', category: 'presentation' },
      { key: 'presentation-4x3', name: 'Presentation 4:3', width: 1024, height: 768, aspectRatio: '4:3', category: 'presentation' },
      { key: 'hd-720p', name: 'HD 720p', width: 1280, height: 720, aspectRatio: '16:9', category: 'video' },
      { key: 'full-hd-1080p', name: 'Full HD 1080p', width: 1920, height: 1080, aspectRatio: '16:9', category: 'video' },
      { key: 'default', name: 'Default', width: 800, height: 600, aspectRatio: '4:3', category: 'general' }
    ]
  };
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
    const optionsStr = validated.options ? JSON.stringify(validated.options) : '{}';

    return `
// Load geographic map
(async function() {
  if (!app.mapSystem) {
    return { success: false, error: 'Map system not available' };
  }

  try {
    const result = await app.mapSystem.loadMap('${validated.mapId}', ${optionsStr});
    return {
      success: true,
      mapId: result.mapId || '${validated.mapId}',
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

    // Collect items from registry
    if (app.itemRegistry) {
      for (const [id, item] of app.itemRegistry.entries()) {
        const itemData = {
          id: id,
          type: item.data?.type || item.className?.toLowerCase() || 'unknown',
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

        if (item.data?.isDecorative) {
          decorative.push(itemData);
        } else {
          items.push(itemData);
        }
      }
    }

    // Collect relations
    if (app.getRelations) {
      const activeRelations = app.getRelations();
      for (const rel of activeRelations) {
        relations.push({
          sourceId: rel.sourceId,
          targetId: rel.targetId,
          type: rel.type,
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

    return `
// Apply animated mask to ${validated.itemId}
(function() {
  if (!app.maskSystem) {
    return { success: false, error: 'Mask system not available' };
  }

  try {
    const result = app.maskSystem.applyAnimatedMask('${validated.itemId}', {
      preset: ${validated.preset ? `'${validated.preset}'` : 'null'},
      maskType: ${validated.maskType ? `'${validated.maskType}'` : 'null'},
      keyframes: ${keyframesStr},
      options: ${optionsStr},
      maskOptions: ${maskOptionsStr}
    });
    return result;
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
  if (!app.maskSystem) {
    return { success: false, error: 'Mask system not available' };
  }

  try {
    const result = app.maskSystem.applyCustomMask('${validated.itemId}', {
      maskType: '${validated.maskType}',
      keyframes: ${keyframesStr},
      maskOptions: ${maskOptionsStr}
    });
    return result;
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
  if (!app.maskSystem) {
    return { success: false, error: 'Mask system not available' };
  }

  try {
    const result = app.maskSystem.removeMask('${validated.itemId}');
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
}

// Export singleton instance
export const codeGenerator = new PinePaperCodeGenerator();
