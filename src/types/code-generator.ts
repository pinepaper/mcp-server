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
}

// Export singleton instance
export const codeGenerator = new PinePaperCodeGenerator();
