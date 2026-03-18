/**
 * New Consolidated MCP Tools Tests
 *
 * Tests for the 10 new action-based tools plus the PlayTimeline pause enhancement.
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
} from '../../types/schemas.js';
import { codeGenerator } from '../../types/code-generator.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { TOOL_TAGS } from '../../tools/toolkits.js';
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
    const code = codeGenerator.generatePlayTimeline({ action: 'pause' });
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
    expect(code).toContain('app.getSelection()');
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

  it('get calls app.getBackground', () => {
    const code = codeGenerator.generateBackground({ action: 'get' });
    expect(code).toContain('app.getBackground()');
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
// INTEGRATION — All 10 tools in PINEPAPER_TOOLS, tag groups, minimal descs
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

  it('camera tag group contains pinepaper_view', () => {
    expect(TOOL_TAGS.camera).toContain('pinepaper_view');
  });

  it('canvas tag group contains pinepaper_background', () => {
    expect(TOOL_TAGS.canvas).toContain('pinepaper_background');
  });

  it('query tag group contains pinepaper_query', () => {
    expect(TOOL_TAGS.query).toContain('pinepaper_query');
  });
});
