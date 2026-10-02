/**
 * Canvas State Capture
 *
 * Captures canvas context for enhanced error messages and debugging.
 * Provides structured information about what was on the canvas when errors occurred.
 */

import { PinePaperBrowserController } from '../browser/puppeteer-controller.js';

/**
 * Canvas state snapshot for error context
 */
export interface CanvasState {
  /** Total number of items on canvas */
  itemCount: number;

  /** Breakdown by item type */
  itemTypes: Record<string, number>;

  /** Canvas dimensions */
  canvasSize: {
    width: number;
    height: number;
  };

  /** Relation statistics */
  relations: {
    total: number;
    byType: Record<string, number>;
  };

  /** Recently created items (last 5) */
  recentItems: Array<{
    id: string;
    type: string;
    timestamp?: number;
  }>;

  /** Whether canvas is empty */
  isEmpty: boolean;

  /** Timestamp when captured */
  capturedAt: number;
}

/**
 * Error context with canvas state
 */
export interface ErrorContext {
  /** Canvas state at time of error */
  canvasState?: CanvasState;

  /** Tool that caused the error */
  toolName?: string;

  /** Additional error metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Capture current canvas state for error reporting
 */
export async function captureCanvasState(
  browserController: PinePaperBrowserController
): Promise<CanvasState | null> {
  if (!browserController.connected) {
    return null;
  }

  try {
    // Query canvas state in a single browser execution
    // THE ENGINE'S OWN API (gate H3, 1.6.19). This read window.pinepaper.getItems()
    // and window.pinepaper.canvas; there is no lowercase window.pinepaper, so it
    // threw every time and returned null. diagnostic_report showed canvas: null
    // with items on screen, and every execution error went out without the
    // canvas context this function exists to attach.
    const stateCode = `
      (function() {
        const app = window.app || window.PinePaper;
        if (!app || !app.itemRegistry || typeof app.itemRegistry.getAll !== 'function') return null;
        const entries = app.itemRegistry.getAll();
        const itemTypes = {};
        entries.forEach(function (e) {
          const type = (e && e.type) || 'unknown';
          itemTypes[type] = (itemTypes[type] || 0) + 1;
        });
        const rels = (app.relationRegistry && typeof app.relationRegistry.exportForSave === 'function')
          ? app.relationRegistry.exportForSave() : [];
        const relationsByType = {};
        rels.forEach(function (r) { const t = (r && r.relation) || 'unknown'; relationsByType[t] = (relationsByType[t] || 0) + 1; });
        const size = typeof app.getCanvasSize === 'function' ? app.getCanvasSize() : null;
        return {
          itemCount: entries.length,
          itemTypes: itemTypes,
          canvasSize: { width: size ? size.width : null, height: size ? size.height : null },
          relations: { total: rels.length, byType: relationsByType },
          recentItems: entries.slice(-5).map(function (e) { return { id: e.itemId, type: (e && e.type) || 'unknown' }; }),
          isEmpty: entries.length === 0
        };
      })();
    `;

    const result = await browserController.executeCode(stateCode, false);

    if (result.success && result.result) {
      // Parse the result
      const state = typeof result.result === 'string'
        ? JSON.parse(result.result)
        : result.result;

      return {
        ...state,
        capturedAt: Date.now(),
      };
    }

    return null;
  } catch (error) {
    // Don't throw errors from state capture - just return null
    console.error('[CanvasState] Failed to capture state:', error);
    return null;
  }
}

/**
 * Format canvas state for human-readable error messages
 *
 * Every field is read DEFENSIVELY. captureCanvasState promises never to throw
 * and returns whatever the studio handed back, so a studio on an older shape —
 * or any probe that half-succeeds — produced a state missing `itemTypes` or
 * `canvasSize`, and this function then threw while formatting somebody else's
 * error. The real failure was lost and replaced with a TypeError from the error
 * path itself, which is the worst place to have one.
 */
export function formatCanvasState(state: CanvasState): string {
  const lines: string[] = [];
  const counts = (v: unknown): Array<[string, number]> =>
    (v && typeof v === 'object') ? Object.entries(v as Record<string, number>) : [];

  lines.push('Canvas State:');

  if (state.isEmpty) {
    lines.push('  - Canvas is EMPTY (no items)');
  } else {
    lines.push(`  - Total Items: ${state.itemCount ?? 'unknown'}`);

    // Item types
    const itemTypes = counts(state.itemTypes);
    if (itemTypes.length > 0) {
      lines.push('  - Item Types:');
      itemTypes
        .sort(([, a], [, b]) => b - a) // Sort by count descending
        .forEach(([type, count]) => {
          lines.push(`    • ${type}: ${count}`);
        });
    }

    // Relations
    if (state.relations && state.relations.total > 0) {
      lines.push(`  - Relations: ${state.relations.total}`);
      const byType = counts(state.relations.byType);
      if (byType.length > 0) {
        byType
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            lines.push(`    • ${type}: ${count}`);
          });
      }
    } else {
      lines.push('  - Relations: None');
    }

    // Recent items
    if (Array.isArray(state.recentItems) && state.recentItems.length > 0) {
      lines.push('  - Recent Items:');
      state.recentItems.forEach(item => {
        lines.push(`    • ${item.id} (${item.type})`);
      });
    }
  }

  if (state.canvasSize) {
    lines.push(`  - Canvas Size: ${state.canvasSize.width}x${state.canvasSize.height}`);
  }

  return lines.join('\n');
}

/**
 * Format error context for inclusion in error responses
 */
export function formatErrorContext(context: ErrorContext): string {
  const lines: string[] = [];

  if (context.toolName) {
    lines.push(`Tool: ${context.toolName}`);
  }

  if (context.canvasState) {
    lines.push('');
    lines.push(formatCanvasState(context.canvasState));
  }

  if (context.metadata && Object.keys(context.metadata).length > 0) {
    lines.push('');
    lines.push('Additional Context:');
    Object.entries(context.metadata).forEach(([key, value]) => {
      lines.push(`  - ${key}: ${JSON.stringify(value)}`);
    });
  }

  return lines.join('\n');
}

/**
 * Create minimal error context without canvas state
 * (for errors that occur before browser connection)
 */
export function createMinimalErrorContext(
  toolName?: string,
  metadata?: Record<string, unknown>
): ErrorContext {
  return {
    toolName,
    metadata,
  };
}
