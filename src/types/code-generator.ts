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
} from './schemas.js';
import { z } from 'zod';

// =============================================================================
// CODE TEMPLATES
// =============================================================================

/**
 * Template for creating items
 */
function generateCreateItemCode(
  itemType: ItemType,
  position: { x: number; y: number },
  properties: Record<string, unknown>
): string {
  const params: Record<string, unknown> = {
    x: position.x,
    y: position.y,
    ...properties,
  };

  // Map generic properties to PinePaper-specific ones
  if (itemType === 'text') {
    if (params.color) {
      params.color = params.color;  // PinePaper uses 'color' for text
    }
  }

  return `
// Create ${itemType} item
const item = app.create('${itemType}', ${JSON.stringify(params, null, 2)});
const itemId = item.data.registryId;
app.historyManager.saveState();

// Return item info
({ itemId, type: '${itemType}', position: { x: ${position.x}, y: ${position.y} } });
`.trim();
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
}

// Export singleton instance
export const codeGenerator = new PinePaperCodeGenerator();
