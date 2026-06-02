/**
 * New Consolidated MCP Tools Tests
 *
 * Tests for the 14 action-based tools plus the PlayTimeline pause enhancement.
 * Covers schema validation, code generation, and integration checks.
 */

import { describe, it, expect } from 'bun:test';
import {
  SelectionInputSchema,
  TransformInputSchema,
  HistoryInputSchema,
  ImageFilterInputSchema,
  LassoInputSchema,
  CutoutStyleInputSchema,
  PrecompInputSchema,
  ViewInputSchema,
  BackgroundInputSchema,
  QueryInputSchema,
  PlayTimelineInputSchema,
  DeformInputSchema,
  SpriteSheetInputSchema,
  StorageInputSchema,
  InteractionInputSchema,
  TextPropertiesSchema,
  ExportWidgetInputSchema,
  ExportWidgetHtmlInputSchema,
  CreateChartInputSchema,
  MagicInputSchema,
  PhysicsInputSchema,
  MeasurementInputSchema,
  EffectTypeSchema,
} from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { TOOL_TAGS, getToolsForToolkit } from '../../tools/toolkits.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';

// =============================================================================
// PLAY TIMELINE ENHANCEMENT
// =============================================================================

describe('PlayTimelineInputSchema — pause enhancement', () => {
  it('accepts pause action', () => {
    const result = PlayTimelineInputSchema.parse({ action: 'pause' });
    expect(result.action).toBe('pause');
  });

  it('generates pauseKeyframeTimeline code', () => {
    const code = codeGenerator.generatePlayTimeline('pause');
    expect(code).toContain('app.pauseKeyframeTimeline()');
    expect(code).toContain("action: 'pause'");
  });
});

// =============================================================================
// SELECTION
// =============================================================================

describe('SelectionInputSchema', () => {
  it('accepts select with itemIds', () => {
    const result = SelectionInputSchema.parse({ action: 'select', itemIds: ['item_1', 'item_2'] });
    expect(result.action).toBe('select');
    expect(result.itemIds).toEqual(['item_1', 'item_2']);
  });

  it('accepts select with mode', () => {
    const result = SelectionInputSchema.parse({ action: 'select', itemIds: ['item_1'], mode: 'add' });
    expect(result.mode).toBe('add');
  });

  it('accepts all 5 actions', () => {
    const actions = ['select', 'select_all', 'deselect_all', 'get', 'delete_selected'] as const;
    for (const action of actions) {
      expect(() => SelectionInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('rejects invalid action', () => {
    expect(() => SelectionInputSchema.parse({ action: 'toggle' })).toThrow();
  });

  it('rejects invalid mode', () => {
    expect(() => SelectionInputSchema.parse({ action: 'select', itemIds: ['a'], mode: 'toggle' })).toThrow();
  });
});

describe('Selection code generation', () => {
  it('select generates deselectAll + select loop', () => {
    const code = codeGenerator.generateSelection({ action: 'select', itemIds: ['item_1'], mode: 'replace' });
    expect(code).toContain('app.deselectAll()');
    expect(code).toContain('app.select(entry.item)');
    expect(code).toContain('item_1');
  });

  it('select with add mode does not deselect', () => {
    const code = codeGenerator.generateSelection({ action: 'select', itemIds: ['item_1'], mode: 'add' });
    expect(code).not.toContain('app.deselectAll()');
    expect(code).toContain('app.select(entry.item)');
  });

  it('select_all generates selectAll call', () => {
    const code = codeGenerator.generateSelection({ action: 'select_all' });
    expect(code).toContain('app.selectAll()');
  });

  it('deselect_all generates deselectAll call', () => {
    const code = codeGenerator.generateSelection({ action: 'deselect_all' });
    expect(code).toContain('app.deselectAll()');
  });

  it('get returns selection with bounds', () => {
    const code = codeGenerator.generateSelection({ action: 'get' });
    // 1.5.5: FxTool exposes getSelectedItems (no getSelection).
    expect(code).toContain('app.getSelectedItems()');
    expect(code).toContain('bounds');
  });

  it('delete_selected generates deleteSelected', () => {
    const code = codeGenerator.generateSelection({ action: 'delete_selected' });
    expect(code).toContain('app.deleteSelected()');
  });

  it('is sync IIFE (not async)', () => {
    const code = codeGenerator.generateSelection({ action: 'get' });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// TRANSFORM
// =============================================================================

describe('TransformInputSchema', () => {
  it('accepts nudge with dx/dy', () => {
    const result = TransformInputSchema.parse({ action: 'nudge', itemId: 'item_1', dx: 10, dy: -5 });
    expect(result.dx).toBe(10);
    expect(result.dy).toBe(-5);
  });

  it('accepts flip with direction', () => {
    const result = TransformInputSchema.parse({ action: 'flip', itemId: 'item_1', direction: 'horizontal' });
    expect(result.direction).toBe('horizontal');
  });

  it('accepts reorder with order', () => {
    const result = TransformInputSchema.parse({ action: 'reorder', itemId: 'item_1', order: 'bringToFront' });
    expect(result.order).toBe('bringToFront');
  });

  it('rejects invalid action', () => {
    expect(() => TransformInputSchema.parse({ action: 'rotate' })).toThrow();
  });

  it('rejects invalid direction', () => {
    expect(() => TransformInputSchema.parse({ action: 'flip', direction: 'diagonal' })).toThrow();
  });

  it('rejects invalid order', () => {
    expect(() => TransformInputSchema.parse({ action: 'reorder', order: 'bringForward' })).toThrow();
  });
});

describe('Transform code generation', () => {
  it('nudge modifies position', () => {
    const code = codeGenerator.generateTransform({ action: 'nudge', itemId: 'item_1', dx: 10, dy: 5 });
    expect(code).toContain('position.x += 10');
    expect(code).toContain('position.y += 5');
    expect(code).toContain('app.itemRegistry.get');
  });

  it('flip horizontal uses scale(-1, 1)', () => {
    const code = codeGenerator.generateTransform({ action: 'flip', itemId: 'item_1', direction: 'horizontal' });
    expect(code).toContain('entry.item.scale(-1, 1)');
  });

  it('flip vertical uses scale(1, -1)', () => {
    const code = codeGenerator.generateTransform({ action: 'flip', itemId: 'item_1', direction: 'vertical' });
    expect(code).toContain('entry.item.scale(1, -1)');
  });

  it('reorder bringToFront calls bringToFront()', () => {
    const code = codeGenerator.generateTransform({ action: 'reorder', itemId: 'item_1', order: 'bringToFront' });
    expect(code).toContain('entry.item.bringToFront()');
  });

  it('reorder sendToBack calls sendToBack()', () => {
    const code = codeGenerator.generateTransform({ action: 'reorder', itemId: 'item_1', order: 'sendToBack' });
    expect(code).toContain('entry.item.sendToBack()');
  });

  it('reorder moveUp resolves sibling at codegen time', () => {
    const code = codeGenerator.generateTransform({ action: 'reorder', itemId: 'item_1', order: 'moveUp' });
    expect(code).toContain('entry.item.nextSibling');
    expect(code).toContain('entry.item.moveAbove(sibling)');
    expect(code).not.toContain("order === 'moveUp'");
  });

  it('reorder moveDown resolves sibling at codegen time', () => {
    const code = codeGenerator.generateTransform({ action: 'reorder', itemId: 'item_1', order: 'moveDown' });
    expect(code).toContain('entry.item.previousSibling');
    expect(code).toContain('entry.item.moveBelow(sibling)');
    expect(code).not.toContain("order === 'moveUp'");
  });
});

// =============================================================================
// HISTORY
// =============================================================================

describe('HistoryInputSchema', () => {
  it('accepts all 3 actions', () => {
    const actions = ['undo', 'redo', 'get_state'] as const;
    for (const action of actions) {
      expect(() => HistoryInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('rejects invalid action', () => {
    expect(() => HistoryInputSchema.parse({ action: 'clear' })).toThrow();
  });
});

describe('History code generation', () => {
  it('undo includes guard and calls undo()', () => {
    const code = codeGenerator.generateHistory({ action: 'undo' });
    expect(code).toContain('app.historyManager');
    expect(code).toContain('app.historyManager.undo()');
  });

  it('redo calls redo()', () => {
    const code = codeGenerator.generateHistory({ action: 'redo' });
    expect(code).toContain('app.historyManager.redo()');
  });

  it('get_state calls getState()', () => {
    const code = codeGenerator.generateHistory({ action: 'get_state' });
    expect(code).toContain('app.historyManager.getState()');
  });

  it('includes historyManager guard', () => {
    const code = codeGenerator.generateHistory({ action: 'undo' });
    expect(code).toContain("if (!app.historyManager) return { error: 'HistoryManager not available' }");
  });
});

// =============================================================================
// IMAGE FILTER
// =============================================================================

describe('ImageFilterInputSchema', () => {
  it('accepts apply with filterName', () => {
    const result = ImageFilterInputSchema.parse({ action: 'apply', itemId: 'item_1', filterName: 'blur', params: { amount: 5 } });
    expect(result.filterName).toBe('blur');
  });

  it('accepts chain with filters array', () => {
    const result = ImageFilterInputSchema.parse({
      action: 'chain',
      itemId: 'item_1',
      filters: [{ name: 'blur', params: { amount: 5 } }, { name: 'grayscale' }],
    });
    expect(result.filters).toHaveLength(2);
  });

  it('requires itemId', () => {
    expect(() => ImageFilterInputSchema.parse({ action: 'apply' })).toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => ImageFilterInputSchema.parse({ action: 'remove', itemId: 'i' })).toThrow();
  });
});

describe('ImageFilter code generation', () => {
  it('apply is async with imageTools guard', () => {
    const code = codeGenerator.generateImageFilter({ action: 'apply', itemId: 'item_1', filterName: 'blur', params: { amount: 5 } });
    expect(code).toContain('async function');
    expect(code).toContain("if (!app.imageTools) return { error: 'ImageTools not available' }");
    expect(code).toContain('app.imageTools.applyFilter');
  });

  it('chain calls applyFilterChain', () => {
    const code = codeGenerator.generateImageFilter({
      action: 'chain',
      itemId: 'item_1',
      filters: [{ name: 'blur' }, { name: 'grayscale' }],
    });
    expect(code).toContain('app.imageTools.applyFilterChain');
  });
});

// =============================================================================
// LASSO
// =============================================================================

describe('LassoInputSchema', () => {
  it('accepts activate with itemId', () => {
    const result = LassoInputSchema.parse({ action: 'activate', itemId: 'item_1' });
    expect(result.action).toBe('activate');
  });

  it('accepts apply', () => {
    expect(() => LassoInputSchema.parse({ action: 'apply' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => LassoInputSchema.parse({ action: 'draw' })).toThrow();
  });
});

describe('Lasso code generation', () => {
  it('activate is async with guard', () => {
    const code = codeGenerator.generateLasso({ action: 'activate', itemId: 'item_1' });
    expect(code).toContain('async function');
    expect(code).toContain('app.imageTools.activateLasso');
    expect(code).toContain("if (!app.imageTools)");
  });

  it('apply calls applyLasso', () => {
    const code = codeGenerator.generateLasso({ action: 'apply' });
    expect(code).toContain('app.imageTools.applyLasso()');
  });
});

// =============================================================================
// CUTOUT STYLE
// =============================================================================

describe('CutoutStyleInputSchema', () => {
  it('accepts apply with preset', () => {
    const result = CutoutStyleInputSchema.parse({ action: 'apply', itemId: 'item_1', preset: 'sticker' });
    expect(result.preset).toBe('sticker');
  });

  it('accepts list', () => {
    expect(() => CutoutStyleInputSchema.parse({ action: 'list' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => CutoutStyleInputSchema.parse({ action: 'remove' })).toThrow();
  });
});

describe('CutoutStyle code generation', () => {
  it('apply is async with guard', () => {
    const code = codeGenerator.generateCutoutStyle({ action: 'apply', itemId: 'item_1', preset: 'sticker' });
    expect(code).toContain('async function');
    expect(code).toContain('app.imageTools.applyCutoutStyle');
  });

  it('list is sync', () => {
    const code = codeGenerator.generateCutoutStyle({ action: 'list' });
    expect(code).toContain('app.imageTools.getCutoutStyles()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// PRECOMP
// =============================================================================

describe('PrecompInputSchema', () => {
  it('accepts create with itemIds and options', () => {
    const result = PrecompInputSchema.parse({ action: 'create', itemIds: ['i1', 'i2'], name: 'Comp1', loop: true, duration: 5 });
    expect(result.itemIds).toEqual(['i1', 'i2']);
    expect(result.loop).toBe(true);
  });

  it('accepts add with precompId and itemId', () => {
    const result = PrecompInputSchema.parse({ action: 'add', precompId: 'comp_1', itemId: 'item_1' });
    expect(result.precompId).toBe('comp_1');
  });

  it('accepts remove', () => {
    expect(() => PrecompInputSchema.parse({ action: 'remove', precompId: 'c', itemId: 'i' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => PrecompInputSchema.parse({ action: 'delete' })).toThrow();
  });
});

describe('Precomp code generation', () => {
  it('create calls app.createPrecomp', () => {
    const code = codeGenerator.generatePrecomp({ action: 'create', itemIds: ['i1'], name: 'Comp' });
    expect(code).toContain('app.createPrecomp');
    expect(code).toContain('"i1"');
  });

  it('add calls app.addToPrecomp', () => {
    const code = codeGenerator.generatePrecomp({ action: 'add', precompId: 'comp_1', itemId: 'item_1' });
    expect(code).toContain('app.addToPrecomp');
  });

  it('remove calls app.removeFromPrecomp', () => {
    const code = codeGenerator.generatePrecomp({ action: 'remove', precompId: 'comp_1', itemId: 'item_1' });
    expect(code).toContain('app.removeFromPrecomp');
  });

  it('is sync IIFE', () => {
    const code = codeGenerator.generatePrecomp({ action: 'create', itemIds: [] });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// VIEW
// =============================================================================

describe('ViewInputSchema', () => {
  it('accepts fit with mode and padding', () => {
    const result = ViewInputSchema.parse({ action: 'fit', mode: 'content', padding: 30 });
    expect(result.mode).toBe('content');
    expect(result.padding).toBe(30);
  });

  it('accepts get_state', () => {
    expect(() => ViewInputSchema.parse({ action: 'get_state' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => ViewInputSchema.parse({ action: 'zoom' })).toThrow();
  });

  it('rejects invalid mode', () => {
    expect(() => ViewInputSchema.parse({ action: 'fit', mode: 'all' })).toThrow();
  });
});

describe('View code generation', () => {
  it('fit calls app.fitView', () => {
    const code = codeGenerator.generateView({ action: 'fit', mode: 'content', padding: 30 });
    expect(code).toContain("app.fitView('content', 30)");
  });

  it('fit defaults to content mode with 20px padding', () => {
    const code = codeGenerator.generateView({ action: 'fit' });
    expect(code).toContain("app.fitView('content', 20)");
  });

  it('get_state calls app.getViewState', () => {
    const code = codeGenerator.generateView({ action: 'get_state' });
    expect(code).toContain('app.getViewState()');
  });
});

// =============================================================================
// BACKGROUND
// =============================================================================

describe('BackgroundInputSchema', () => {
  it('accepts set with color', () => {
    const result = BackgroundInputSchema.parse({ action: 'set', mode: 'color', color: '#ff0000' });
    expect(result.color).toBe('#ff0000');
  });

  it('accepts set with generator', () => {
    const result = BackgroundInputSchema.parse({ action: 'set', mode: 'generator', generator: 'drawBokeh', generatorParams: { colors: ['#f00'] } });
    expect(result.generator).toBe('drawBokeh');
  });

  it('accepts clear and get', () => {
    expect(() => BackgroundInputSchema.parse({ action: 'clear' })).not.toThrow();
    expect(() => BackgroundInputSchema.parse({ action: 'get' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => BackgroundInputSchema.parse({ action: 'reset' })).toThrow();
  });
});

describe('Background code generation', () => {
  it('set color calls app.setBackgroundColor', () => {
    const code = codeGenerator.generateBackground({ action: 'set', mode: 'color', color: '#0f172a' });
    expect(code).toContain('app.setBackgroundColor');
    expect(code).toContain('#0f172a');
  });

  it('set pattern calls app.setBackgroundPattern', () => {
    const code = codeGenerator.generateBackground({ action: 'set', mode: 'pattern', pattern: 'dots' });
    expect(code).toContain('app.setBackgroundPattern');
  });

  it('set generator is async and calls executeGenerator', () => {
    const code = codeGenerator.generateBackground({ action: 'set', mode: 'generator', generator: 'drawBokeh' });
    expect(code).toContain('async function');
    expect(code).toContain('app.executeGenerator');
  });

  it('set defaults to color mode', () => {
    const code = codeGenerator.generateBackground({ action: 'set', color: '#000' });
    expect(code).toContain('app.setBackgroundColor');
  });

  it('clear calls app.clearBackground', () => {
    const code = codeGenerator.generateBackground({ action: 'clear' });
    expect(code).toContain('app.clearBackground()');
  });

  it('get calls app.getBackgroundMode (1.5.5: FxTool has no getBackground)', () => {
    const code = codeGenerator.generateBackground({ action: 'get' });
    expect(code).toContain('app.getBackgroundMode');
  });
});

// =============================================================================
// QUERY
// =============================================================================

describe('QueryInputSchema', () => {
  it('accepts get_by_id', () => {
    const result = QueryInputSchema.parse({ action: 'get_by_id', itemId: 'item_1' });
    expect(result.itemId).toBe('item_1');
  });

  it('accepts hit_test with coordinates', () => {
    const result = QueryInputSchema.parse({ action: 'hit_test', x: 100, y: 200, tolerance: 10, all: true });
    expect(result.x).toBe(100);
    expect(result.all).toBe(true);
  });

  it('accepts is_empty', () => {
    expect(() => QueryInputSchema.parse({ action: 'is_empty' })).not.toThrow();
  });

  it('rejects invalid action', () => {
    expect(() => QueryInputSchema.parse({ action: 'count' })).toThrow();
  });
});

describe('Query code generation', () => {
  it('get_by_id uses app.itemRegistry.get', () => {
    const code = codeGenerator.generateQuery({ action: 'get_by_id', itemId: 'item_1' });
    expect(code).toContain('app.itemRegistry.get');
    expect(code).toContain('item_1');
  });

  it('hit_test creates paper.Point', () => {
    const code = codeGenerator.generateQuery({ action: 'hit_test', x: 100, y: 200 });
    expect(code).toContain('new paper.Point(100, 200)');
    expect(code).toContain('app.hitTest');
  });

  it('hit_test with all uses hitTestAll', () => {
    const code = codeGenerator.generateQuery({ action: 'hit_test', x: 0, y: 0, all: true });
    expect(code).toContain('app.hitTestAll');
  });

  it('is_empty checks itemRegistry.getAll()', () => {
    const code = codeGenerator.generateQuery({ action: 'is_empty' });
    expect(code).toContain('app.itemRegistry.getAll()');
    expect(code).toContain('empty');
  });

  it('is sync IIFE', () => {
    const code = codeGenerator.generateQuery({ action: 'is_empty' });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// DYNAMIC CONTENT (create_item / modify_item enhancement)
// =============================================================================

describe('TextPropertiesSchema — dynamic content', () => {
  it('accepts contentType field', () => {
    const result = TextPropertiesSchema.parse({ content: 'Hello', contentType: 'clock' });
    expect(result.contentType).toBe('clock');
  });

  it('accepts all 4 content types', () => {
    for (const ct of ['clock', 'timer', 'countdown', 'stopwatch'] as const) {
      expect(() => TextPropertiesSchema.parse({ content: 'x', contentType: ct })).not.toThrow();
    }
  });

  it('rejects invalid contentType', () => {
    expect(() => TextPropertiesSchema.parse({ content: 'x', contentType: 'invalid' })).toThrow();
  });

  it('contentType is optional', () => {
    const result = TextPropertiesSchema.parse({ content: 'Hello' });
    expect(result.contentType).toBeUndefined();
  });

  it('accepts countdown options', () => {
    const result = TextPropertiesSchema.parse({
      content: '60', contentType: 'countdown',
      countdownTarget: 60, countdownEndText: 'Done!', contentFormat: 'MM:SS',
    });
    expect(result.countdownTarget).toBe(60);
    expect(result.countdownEndText).toBe('Done!');
    expect(result.contentFormat).toBe('MM:SS');
  });
});

describe('Dynamic content code generation', () => {
  it('create_item with contentType generates setDynamicContent call', () => {
    const code = codeGenerator.generateCreateItem({
      itemType: 'text', position: { x: 100, y: 100 },
      properties: { content: '00:00', contentType: 'clock' },
    });
    expect(code).toContain('app.setDynamicContent');
    expect(code).toContain("'clock'");
  });

  it('create_item without contentType skips setDynamicContent', () => {
    const code = codeGenerator.generateCreateItem({
      itemType: 'text', position: { x: 100, y: 100 },
      properties: { content: 'Hello' },
    });
    expect(code).not.toContain('setDynamicContent');
  });

  it('modify_item with contentType generates setDynamicContent', () => {
    const code = codeGenerator.generateModifyItem({
      itemId: 'item_1', properties: { contentType: 'timer' },
    });
    expect(code).toContain('app.setDynamicContent');
    expect(code).toContain("'timer'");
  });

  it('modify_item with contentType null generates removeDynamicContent', () => {
    // contentType: null is the internal sentinel for removal — callers use 'none' or '' via properties
    const code = codeGenerator.generateModifyItem({
      itemId: 'item_1', properties: { contentType: null },
    });
    expect(code).toContain('app.removeDynamicContent');
  });

  it('modify_item with contentType "none" generates removeDynamicContent', () => {
    const code = codeGenerator.generateModifyItem({
      itemId: 'item_1', properties: { contentType: 'none' },
    });
    expect(code).toContain('app.removeDynamicContent');
  });

  it('modify_item with contentType "" generates removeDynamicContent', () => {
    const code = codeGenerator.generateModifyItem({
      itemId: 'item_1', properties: { contentType: '' },
    });
    expect(code).toContain('app.removeDynamicContent');
  });
});

// =============================================================================
// DEFORMATION
// =============================================================================

describe('DeformInputSchema', () => {
  it('accepts apply with preset', () => {
    const result = DeformInputSchema.parse({ action: 'apply', itemId: 'item_1', preset: 'twist' });
    expect(result.action).toBe('apply');
    expect(result.preset).toBe('twist');
  });

  it('accepts all 3 actions', () => {
    for (const action of ['apply', 'trigger', 'remove'] as const) {
      expect(() => DeformInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('accepts all 13 presets', () => {
    const presets = ['fold', 'squeeze', 'squash', 'pinch', 'bulge', 'twist', 'ripple', 'wave', 'breathe', 'melt', 'shear', 'inflate', 'wobble'];
    for (const preset of presets) {
      expect(() => DeformInputSchema.parse({ action: 'apply', preset })).not.toThrow();
    }
  });

  it('accepts all 8 phases', () => {
    const phases = ['sin', 'blink', 'linear', 'pingpong', 'once', 'elastic', 'heartbeat', 'stepped'];
    for (const phase of phases) {
      expect(() => DeformInputSchema.parse({ action: 'apply', phase })).not.toThrow();
    }
  });

  it('rejects invalid preset', () => {
    expect(() => DeformInputSchema.parse({ action: 'apply', preset: 'stretch' })).toThrow();
  });
});

describe('Deform code generation', () => {
  it('apply generates deformPresets.apply call', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', itemId: 'item_1', preset: 'ripple', amplitude: 0.5, phase: 'elastic' });
    expect(code).toContain("app.deformPresets.apply");
    expect(code).toContain("'ripple'");
    expect(code).toContain('"amplitude":0.5');
    expect(code).toContain('"phase":"elastic"');
  });

  it('trigger generates deformPresets.trigger call', () => {
    const code = codeGenerator.generateDeform({ action: 'trigger', itemId: 'item_1', preset: 'squeeze' });
    expect(code).toContain('app.deformPresets.trigger');
    expect(code).toContain("'squeeze'");
  });

  it('remove generates deformPresets.remove call', () => {
    const code = codeGenerator.generateDeform({ action: 'remove', itemId: 'item_1' });
    expect(code).toContain('app.deformPresets.remove');
  });

  it('includes deformPresets guard', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', itemId: 'x', preset: 'fold' });
    expect(code).toContain("if (!app.deformPresets) return { error: 'DeformPresets not available' }");
  });

  it('is sync IIFE', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', itemId: 'x', preset: 'fold' });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });

  it('apply without preset returns error', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', itemId: 'item_1' });
    expect(code).toContain('preset is required');
    expect(code).not.toContain("'undefined'");
  });

  it('apply without itemId returns error', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', preset: 'fold' });
    expect(code).toContain('itemId is required');
  });

  it('return values use safe string embedding', () => {
    const code = codeGenerator.generateDeform({ action: 'apply', itemId: "test'inject", preset: 'fold' });
    expect(code).not.toContain("itemId: 'test'inject'");
    expect(code).toContain(JSON.stringify("test'inject"));
  });
});

// =============================================================================
// SPRITE SHEET
// =============================================================================

describe('SpriteSheetInputSchema', () => {
  it('accepts generate with skeletonId', () => {
    const result = SpriteSheetInputSchema.parse({ action: 'generate', skeletonId: 'skel_1' });
    expect(result.action).toBe('generate');
    expect(result.skeletonId).toBe('skel_1');
  });

  it('accepts all 3 actions', () => {
    for (const action of ['generate', 'play', 'export'] as const) {
      expect(() => SpriteSheetInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('accepts generate with poses', () => {
    const result = SpriteSheetInputSchema.parse({
      action: 'generate', skeletonId: 'skel_1',
      poses: [{ name: 'idle', poseId: 'pose_1' }],
    });
    expect(result.poses).toHaveLength(1);
  });
});

describe('Sprite sheet code generation', () => {
  it('generate is async IIFE with spriteSheetSystem guard', () => {
    const code = codeGenerator.generateSpriteSheet({ action: 'generate', skeletonId: 'skel_1' });
    expect(code).toContain('async function');
    expect(code).toContain("if (!app.spriteSheetSystem) return { error: 'SpriteSheetSystem not available' }");
    expect(code).toContain('app.spriteSheetSystem.generateSpriteSheet');
  });

  it('play generates playSpriteSheet call', () => {
    const code = codeGenerator.generateSpriteSheet({ action: 'play', spriteSheetId: 'sheet_1', x: 50, y: 50 });
    expect(code).toContain('app.spriteSheetSystem.playSpriteSheet');
    expect(code).toContain('sheet_1');
  });

  it('export generates exportSpriteSheet call', () => {
    const code = codeGenerator.generateSpriteSheet({ action: 'export', spriteSheetId: 'sheet_1', format: 'webp' });
    expect(code).toContain('app.spriteSheetSystem.exportSpriteSheet');
    expect(code).toContain("'webp'");
  });
});

// =============================================================================
// STORAGE
// =============================================================================

describe('StorageInputSchema', () => {
  it('accepts save with name', () => {
    const result = StorageInputSchema.parse({ action: 'save', name: 'My Project' });
    expect(result.action).toBe('save');
    expect(result.name).toBe('My Project');
  });

  it('accepts all 4 actions', () => {
    for (const action of ['save', 'load', 'list', 'delete'] as const) {
      expect(() => StorageInputSchema.parse({ action })).not.toThrow();
    }
  });
});

describe('Storage code generation', () => {
  it('save is async IIFE with storageManager guard', () => {
    const code = codeGenerator.generateStorage({ action: 'save', name: 'Test' });
    expect(code).toContain('async function');
    expect(code).toContain("if (!app.storageManager) return { error: 'StorageManager not available' }");
    expect(code).toContain('app.storageManager.saveProject');
  });

  it('load generates loadProject call', () => {
    const code = codeGenerator.generateStorage({ action: 'load', projectId: 'proj_1' });
    expect(code).toContain('app.storageManager.loadProject');
    expect(code).toContain('proj_1');
  });

  it('list generates listProjects call', () => {
    const code = codeGenerator.generateStorage({ action: 'list' });
    expect(code).toContain('app.storageManager.listProjects');
  });

  it('delete generates deleteProject call', () => {
    const code = codeGenerator.generateStorage({ action: 'delete', projectId: 'proj_1' });
    expect(code).toContain('app.storageManager.deleteProject');
    expect(code).toContain('proj_1');
  });

  it('load with special chars in projectId uses safe embedding', () => {
    const code = codeGenerator.generateStorage({ action: 'load', projectId: "proj'inject" });
    expect(code).not.toContain("projectId: 'proj'inject'");
    expect(code).toContain(JSON.stringify("proj'inject"));
  });
});

// =============================================================================
// INTERACTION
// =============================================================================

describe('InteractionInputSchema', () => {
  it('accepts add_behavior', () => {
    const result = InteractionInputSchema.parse({ action: 'add_behavior', itemId: 'item_1', behaviorType: 'repel' });
    expect(result.action).toBe('add_behavior');
    expect(result.behaviorType).toBe('repel');
  });

  it('accepts all 4 actions', () => {
    for (const action of ['add_behavior', 'remove_behavior', 'trigger_action', 'get_state'] as const) {
      expect(() => InteractionInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('accepts all 7 behavior types', () => {
    const types = ['repel', 'attract', 'follow', 'orbit', 'slingshot', 'physics_body', 'draggable_constrained'];
    for (const bt of types) {
      expect(() => InteractionInputSchema.parse({ action: 'add_behavior', behaviorType: bt })).not.toThrow();
    }
  });

  it('rejects invalid behavior type', () => {
    expect(() => InteractionInputSchema.parse({ action: 'add_behavior', behaviorType: 'teleport' })).toThrow();
  });
});

describe('Interaction code generation', () => {
  it('add_behavior generates addContinuousBehavior call', () => {
    const code = codeGenerator.generateInteraction({ action: 'add_behavior', itemId: 'item_1', behaviorType: 'orbit', params: { radius: 50 } });
    expect(code).toContain('app.interactionSystem.addContinuousBehavior');
    expect(code).toContain("'orbit'");
  });

  it('remove_behavior generates removeContinuousBehavior call', () => {
    const code = codeGenerator.generateInteraction({ action: 'remove_behavior', itemId: 'item_1', behaviorId: 'beh_1' });
    expect(code).toContain('app.interactionSystem.removeContinuousBehavior');
    expect(code).toContain('beh_1');
  });

  it('trigger_action generates triggerAction call', () => {
    const code = codeGenerator.generateInteraction({ action: 'trigger_action', actionType: 'incrementScore', params: { points: 10 } });
    expect(code).toContain('app.interactionSystem.triggerAction');
    expect(code).toContain("'incrementScore'");
  });

  it('get_state returns interaction state', () => {
    const code = codeGenerator.generateInteraction({ action: 'get_state' });
    expect(code).toContain('app.interactionSystem.getState');
  });

  it('includes interactionSystem guard', () => {
    const code = codeGenerator.generateInteraction({ action: 'get_state' });
    expect(code).toContain("if (!app.interactionSystem) return { error: 'InteractionSystem not available' }");
  });

  it('is sync IIFE (not async)', () => {
    const code = codeGenerator.generateInteraction({ action: 'get_state' });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// WIDGET EXPORT
// =============================================================================

describe('ExportWidgetInputSchema', () => {
  it('accepts empty input (all optional)', () => {
    const result = ExportWidgetInputSchema.parse({});
    expect(result).toBeDefined();
  });

  it('accepts all options', () => {
    const result = ExportWidgetInputSchema.parse({
      download: true, filename: 'my-widget.json', includeInteractions: false, minify: true,
    });
    expect(result.download).toBe(true);
    expect(result.filename).toBe('my-widget.json');
    expect(result.minify).toBe(true);
  });
});

describe('ExportWidgetHtmlInputSchema', () => {
  it('accepts empty input (all optional)', () => {
    const result = ExportWidgetHtmlInputSchema.parse({});
    expect(result).toBeDefined();
  });

  it('accepts title and download', () => {
    const result = ExportWidgetHtmlInputSchema.parse({ title: 'My Animation', download: true });
    expect(result.title).toBe('My Animation');
  });
});

describe('Widget export code generation', () => {
  it('export_widget generates async IIFE that calls app.exportEngine.exportWidget', () => {
    const code = codeGenerator.generateExportWidget({});
    expect(code).toContain('async function');
    // 1.5.5: route through app.exportEngine.
    expect(code).toContain("if (!app.exportEngine || !app.exportEngine.exportWidget)");
    expect(code).toContain('app.exportEngine.exportWidget(');
  });

  it('export_widget passes options through', () => {
    const code = codeGenerator.generateExportWidget({ minify: true, filename: 'test.json' });
    expect(code).toContain('"minify":true');
    expect(code).toContain('"filename":"test.json"');
  });

  it('export_widget_html generates async IIFE that calls app.exportEngine.exportWidgetHTML', () => {
    const code = codeGenerator.generateExportWidgetHtml({});
    expect(code).toContain('async function');
    // 1.5.5: route through app.exportEngine.
    expect(code).toContain("if (!app.exportEngine || !app.exportEngine.exportWidgetHTML)");
    expect(code).toContain('app.exportEngine.exportWidgetHTML(');
  });

  it('export_widget_html passes title option', () => {
    const code = codeGenerator.generateExportWidgetHtml({ title: 'My Page' });
    expect(code).toContain('"title":"My Page"');
  });
});

// =============================================================================
// EFFECTS — 5 new particle effects
// =============================================================================

describe('EffectTypeSchema — 15 effects', () => {
  it('accepts all 15 effect types', () => {
    const effects = ['sparkle', 'blast', 'smoke', 'fire', 'rain', 'snow', 'confetti', 'ripple', 'glow', 'electric', 'bubbles', 'dust', 'fireflies', 'shockwave', 'trail'];
    for (const e of effects) {
      expect(() => EffectTypeSchema.parse(e)).not.toThrow();
    }
  });

  it('rejects invalid effect', () => {
    expect(() => EffectTypeSchema.parse('laser')).toThrow();
  });
});

// =============================================================================
// DATA VISUALIZATION (CHARTS)
// =============================================================================

describe('CreateChartInputSchema', () => {
  it('accepts create with chart type and data', () => {
    const result = CreateChartInputSchema.parse({
      action: 'create',
      chartType: 'bar',
      data: [{ category: 'A', value: 10 }],
    });
    expect(result.action).toBe('create');
    expect(result.chartType).toBe('bar');
  });

  it('accepts all 4 actions', () => {
    for (const action of ['create', 'update', 'reconfigure', 'remove'] as const) {
      expect(() => CreateChartInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('accepts all 4 chart types', () => {
    for (const chartType of ['bar', 'line', 'scatter', 'area'] as const) {
      expect(() => CreateChartInputSchema.parse({ action: 'create', chartType })).not.toThrow();
    }
  });

  it('rejects invalid chart type', () => {
    expect(() => CreateChartInputSchema.parse({ action: 'create', chartType: 'pie' })).toThrow();
  });
});

describe('Chart code generation', () => {
  it('create generates createChart call', () => {
    const code = codeGenerator.generateChart({
      action: 'create',
      chartType: 'bar',
      data: [{ x: 'A', y: 10 }],
    });
    expect(code).toContain('app.createChart("bar"');
    expect(code).toContain('app.chartSystem.getLastChartId');
  });

  it('update generates chartSystem.update call', () => {
    const code = codeGenerator.generateChart({
      action: 'update',
      chartId: 'chart_1',
      data: [{ x: 'B', y: 20 }],
    });
    expect(code).toContain('app.chartSystem.update');
    expect(code).toContain('"chart_1"');
  });

  it('reconfigure generates chartSystem.reconfigure call', () => {
    const code = codeGenerator.generateChart({
      action: 'reconfigure',
      chartId: 'chart_1',
      options: { colors: ['#f00'] },
    });
    expect(code).toContain('app.chartSystem.reconfigure');
  });

  it('remove generates chartSystem.remove call', () => {
    const code = codeGenerator.generateChart({ action: 'remove', chartId: 'chart_1' });
    expect(code).toContain('app.chartSystem.remove');
  });

  it('includes chartSystem guard', () => {
    const code = codeGenerator.generateChart({ action: 'create', chartType: 'line', data: [] });
    expect(code).toContain("if (!app.chartSystem) return { error: 'ChartSystem not available' }");
  });

  it('create without chartType returns error', () => {
    const code = codeGenerator.generateChart({ action: 'create' });
    expect(code).toContain('chartType is required');
  });

  it('create without data returns error', () => {
    const code = codeGenerator.generateChart({ action: 'create', chartType: 'bar' });
    expect(code).toContain('data is required');
  });
});

// =============================================================================
// MAGIC SYSTEM
// =============================================================================

describe('MagicInputSchema', () => {
  it('accepts animate with mood', () => {
    const result = MagicInputSchema.parse({ action: 'animate', mood: 'energetic' });
    expect(result.action).toBe('animate');
    expect(result.mood).toBe('energetic');
  });

  it('accepts all 5 moods', () => {
    for (const mood of ['calm', 'professional', 'energetic', 'dramatic', 'whimsical'] as const) {
      expect(() => MagicInputSchema.parse({ action: 'animate', mood })).not.toThrow();
    }
  });

  it('accepts remix action', () => {
    expect(() => MagicInputSchema.parse({ action: 'remix' })).not.toThrow();
  });

  it('rejects invalid mood', () => {
    expect(() => MagicInputSchema.parse({ action: 'animate', mood: 'angry' })).toThrow();
  });
});

describe('Magic code generation', () => {
  it('animate generates magicSystem.autoAnimate call', () => {
    const code = codeGenerator.generateMagic({ action: 'animate', mood: 'dramatic' });
    expect(code).toContain('app.magicSystem.autoAnimate');
    expect(code).toContain('"energy":"dramatic"');
  });

  it('remix generates magicSystem.remixStyle call', () => {
    const code = codeGenerator.generateMagic({ action: 'remix' });
    expect(code).toContain('app.magicSystem.remixStyle');
  });

  it('remix with selectionOnly passes the option', () => {
    const code = codeGenerator.generateMagic({ action: 'remix', selectionOnly: true });
    expect(code).toContain('"selectionOnly":true');
  });

  it('includes magicSystem guard', () => {
    const code = codeGenerator.generateMagic({ action: 'animate' });
    expect(code).toContain("if (!app.magicSystem) return { error: 'MagicSystem not available' }");
  });

  it('is async IIFE', () => {
    const code = codeGenerator.generateMagic({ action: 'animate' });
    expect(code).toContain('(async function()');
  });
});

// =============================================================================
// PHYSICS
// =============================================================================

describe('PhysicsInputSchema', () => {
  it('accepts init with gravity', () => {
    const result = PhysicsInputSchema.parse({ action: 'init', gravity: { x: 0, y: 500 } });
    expect(result.action).toBe('init');
    expect(result.gravity?.y).toBe(500);
  });

  it('accepts all 9 actions', () => {
    for (const action of ['init', 'add_body', 'remove_body', 'apply_force', 'apply_impulse', 'set_velocity', 'get_state', 'create_ground', 'create_joint'] as const) {
      expect(() => PhysicsInputSchema.parse({ action })).not.toThrow();
    }
  });

  it('accepts all 3 body types', () => {
    for (const bodyType of ['static', 'dynamic', 'kinematic'] as const) {
      expect(() => PhysicsInputSchema.parse({ action: 'add_body', bodyType })).not.toThrow();
    }
  });

  it('accepts all 4 joint types', () => {
    for (const jointType of ['revolute', 'distance', 'weld', 'prismatic'] as const) {
      expect(() => PhysicsInputSchema.parse({ action: 'create_joint', jointType })).not.toThrow();
    }
  });
});

describe('Physics code generation', () => {
  it('init generates physicsWorld.init call', () => {
    const code = codeGenerator.generatePhysics({ action: 'init', gravity: { x: 0, y: 980 } });
    expect(code).toContain('app.physicsWorld.init');
    expect(code).toContain('"y":980');
  });

  it('add_body generates physicsWorld.addBody call', () => {
    const code = codeGenerator.generatePhysics({ action: 'add_body', itemId: 'item_1', bodyType: 'dynamic', mass: 2 });
    expect(code).toContain('app.physicsWorld.addBody');
    expect(code).toContain('"item_1"');
    expect(code).toContain('"mass":2');
  });

  it('apply_force generates physicsWorld.applyForce call', () => {
    const code = codeGenerator.generatePhysics({ action: 'apply_force', itemId: 'item_1', force: { x: 100, y: 0 } });
    expect(code).toContain('app.physicsWorld.applyForce');
  });

  it('create_joint generates physicsWorld.createJoint call', () => {
    const code = codeGenerator.generatePhysics({ action: 'create_joint', itemId: 'a', targetItemId: 'b', jointType: 'revolute' });
    expect(code).toContain('app.physicsWorld.createJoint');
    expect(code).toContain('"revolute"');
  });

  it('includes physicsWorld guard', () => {
    const code = codeGenerator.generatePhysics({ action: 'init' });
    expect(code).toContain("if (!app.physicsWorld) return { error: 'PhysicsWorld not available' }");
  });

  it('add_body without itemId returns error', () => {
    const code = codeGenerator.generatePhysics({ action: 'add_body' });
    expect(code).toContain('itemId is required');
  });

  it('apply_force without itemId returns error', () => {
    const code = codeGenerator.generatePhysics({ action: 'apply_force', force: { x: 1, y: 0 } });
    expect(code).toContain('itemId is required');
  });

  it('apply_impulse without itemId returns error', () => {
    const code = codeGenerator.generatePhysics({ action: 'apply_impulse', impulse: { x: 0, y: -100 } });
    expect(code).toContain('itemId is required');
  });

  it('set_velocity without itemId returns error', () => {
    const code = codeGenerator.generatePhysics({ action: 'set_velocity', velocity: { x: 0, y: 0 } });
    expect(code).toContain('itemId is required');
  });

  it('create_joint without targetItemId returns error', () => {
    const code = codeGenerator.generatePhysics({ action: 'create_joint', itemId: 'a', jointType: 'weld' });
    expect(code).toContain('targetItemId is required');
  });

  it('create_ground uses default y and width', () => {
    const code = codeGenerator.generatePhysics({ action: 'create_ground' });
    expect(code).toContain('app.physicsWorld.createGround(500, 2000)');
  });

  it('is sync IIFE', () => {
    const code = codeGenerator.generatePhysics({ action: 'init' });
    expect(code).toContain('(function()');
    expect(code).not.toContain('async');
  });
});

// =============================================================================
// MEASUREMENT SYSTEM
// =============================================================================

describe('MeasurementInputSchema', () => {
  it('accepts set_rulers with enabled', () => {
    const result = MeasurementInputSchema.parse({ action: 'set_rulers', enabled: true });
    expect(result.action).toBe('set_rulers');
    expect(result.enabled).toBe(true);
  });

  it('accepts all 4 actions', () => {
    for (const action of ['set_rulers', 'set_grid', 'get_dimensions', 'set_snap'] as const) {
      expect(() => MeasurementInputSchema.parse({ action })).not.toThrow();
    }
  });

});

describe('Measurement code generation', () => {
  it('set_rulers generates setRulersVisible call', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_rulers', enabled: true });
    expect(code).toContain('app.measurementSystem.setRulersVisible(true)');
  });

  it('set_grid generates setGridVisible call', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_grid', enabled: false });
    expect(code).toContain('app.measurementSystem.setGridVisible(false)');
  });

  it('get_dimensions returns bounds info', () => {
    const code = codeGenerator.generateMeasurement({ action: 'get_dimensions', itemId: 'item_1' });
    expect(code).toContain('entry.item.bounds');
    expect(code).toContain('"item_1"');
  });

  it('set_snap generates setSnapToUnitEnabled call', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_snap', enabled: true });
    expect(code).toContain('app.measurementSystem.setSnapToUnitEnabled(true)');
  });

  it('includes measurementSystem guard', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_rulers' });
    expect(code).toContain("if (!app.measurementSystem) return { error: 'MeasurementSystem not available' }");
  });

  it('get_dimensions without itemId returns error', () => {
    const code = codeGenerator.generateMeasurement({ action: 'get_dimensions' });
    expect(code).toContain('itemId is required');
  });

  it('get_dimensions does not need measurementSystem guard', () => {
    const code = codeGenerator.generateMeasurement({ action: 'get_dimensions', itemId: 'item_1' });
    expect(code).not.toContain('measurementSystem');
  });

  it('set_rulers with enabled: false generates false', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_rulers', enabled: false });
    expect(code).toContain('setRulersVisible(false)');
  });

  it('set_grid with enabled: false generates false', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_grid', enabled: false });
    expect(code).toContain('setGridVisible(false)');
  });

  it('set_snap with enabled: false generates false', () => {
    const code = codeGenerator.generateMeasurement({ action: 'set_snap', enabled: false });
    expect(code).toContain('setSnapToUnitEnabled(false)');
  });
});

// =============================================================================
// INTEGRATION — All 20 tools in PINEPAPER_TOOLS, tag groups, minimal descs
// =============================================================================

const NEW_TOOL_NAMES = [
  'pinepaper_selection',
  'pinepaper_transform',
  'pinepaper_history',
  'pinepaper_image_filter',
  'pinepaper_lasso',
  'pinepaper_cutout_style',
  'pinepaper_precomp',
  'pinepaper_view',
  'pinepaper_background',
  'pinepaper_query',
  'pinepaper_deform',
  'pinepaper_sprite_sheet',
  'pinepaper_storage',
  'pinepaper_interaction',
  'pinepaper_export_widget',
  'pinepaper_export_widget_html',
  'pinepaper_create_chart',
  'pinepaper_magic',
  'pinepaper_physics',
  'pinepaper_measurement',
];

describe('Integration — tool definitions', () => {
  const toolNames = PINEPAPER_TOOLS.map(t => t.name);

  for (const name of NEW_TOOL_NAMES) {
    it(`${name} exists in PINEPAPER_TOOLS`, () => {
      expect(toolNames).toContain(name);
    });
  }

  it('pinepaper_query has readOnlyHint: true', () => {
    const tool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_query');
    expect(tool?.annotations?.readOnlyHint).toBe(true);
  });

  it('pinepaper_play_timeline accepts pause in enum', () => {
    const tool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_play_timeline');
    const actionEnum = (tool?.inputSchema as any)?.properties?.action?.enum;
    expect(actionEnum).toContain('pause');
  });
});

describe('Integration — minimal descriptions', () => {
  for (const name of NEW_TOOL_NAMES) {
    it(`${name} has minimal description`, () => {
      expect(MINIMAL_DESCRIPTIONS[name]).toBeDefined();
      expect(MINIMAL_DESCRIPTIONS[name].length).toBeGreaterThan(10);
    });
  }
});

describe('Integration — tag groups', () => {
  it('selection tag group contains pinepaper_selection', () => {
    expect(TOOL_TAGS.selection).toContain('pinepaper_selection');
  });

  it('transform tag group contains pinepaper_transform', () => {
    expect(TOOL_TAGS.transform).toContain('pinepaper_transform');
  });

  it('history tag group contains pinepaper_history', () => {
    expect(TOOL_TAGS.history).toContain('pinepaper_history');
  });

  it('image_processing tag group contains image tools', () => {
    expect(TOOL_TAGS.image_processing).toContain('pinepaper_image_filter');
    expect(TOOL_TAGS.image_processing).toContain('pinepaper_lasso');
    expect(TOOL_TAGS.image_processing).toContain('pinepaper_cutout_style');
  });

  it('precomp tag group contains pinepaper_precomp', () => {
    expect(TOOL_TAGS.precomp).toContain('pinepaper_precomp');
  });

  it('canvas tag group contains pinepaper_view', () => {
    expect(TOOL_TAGS.canvas).toContain('pinepaper_view');
  });

  it('canvas tag group contains pinepaper_background', () => {
    expect(TOOL_TAGS.canvas).toContain('pinepaper_background');
  });

  it('query tag group contains pinepaper_query', () => {
    expect(TOOL_TAGS.query).toContain('pinepaper_query');
  });

  it('deform tag group contains pinepaper_deform', () => {
    expect(TOOL_TAGS.deform).toContain('pinepaper_deform');
  });

  it('sprite tag group contains pinepaper_sprite_sheet', () => {
    expect(TOOL_TAGS.sprite).toContain('pinepaper_sprite_sheet');
  });

  it('storage tag group contains pinepaper_storage', () => {
    expect(TOOL_TAGS.storage).toContain('pinepaper_storage');
  });

  it('interaction tag group contains pinepaper_interaction', () => {
    expect(TOOL_TAGS.interaction).toContain('pinepaper_interaction');
  });

  it('export tag group contains widget export tools', () => {
    expect(TOOL_TAGS.export).toContain('pinepaper_export_widget');
    expect(TOOL_TAGS.export).toContain('pinepaper_export_widget_html');
  });

  it('dataviz tag group contains pinepaper_create_chart', () => {
    expect(TOOL_TAGS.dataviz).toContain('pinepaper_create_chart');
  });

  it('magic tag group contains pinepaper_magic', () => {
    expect(TOOL_TAGS.magic).toContain('pinepaper_magic');
  });

  it('physics tag group contains pinepaper_physics', () => {
    expect(TOOL_TAGS.physics).toContain('pinepaper_physics');
  });

  it('measurement tag group contains pinepaper_measurement', () => {
    expect(TOOL_TAGS.measurement).toContain('pinepaper_measurement');
  });

  it('all 20 new tools are reachable via agent profile', () => {
    const agentTools = getToolsForToolkit(PINEPAPER_TOOLS, 'agent');
    const agentNames = agentTools.map(t => t.name);
    for (const name of NEW_TOOL_NAMES) {
      expect(agentNames).toContain(name);
    }
  });
});
