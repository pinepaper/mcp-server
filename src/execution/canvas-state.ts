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
    const stateCode = `
      (function() {
        const items = window.pinepaper.getItems();
        const canvas = window.pinepaper.canvas;

        // Count by type
        const itemTypes = {};
        items.forEach(item => {
          const type = item.type || 'unknown';
          itemTypes[type] = (itemTypes[type] || 0) + 1;
        });

        // Get relation stats
        const relations = [];
        items.forEach(item => {
          if (item.relations) {
            Object.keys(item.relations).forEach(targetId => {
              const relationTypes = item.relations[targetId];
              relationTypes.forEach(rel => {
                relations.push({ type: rel.type });
              });
            });
          }
        });

        const relationsByType = {};
        relations.forEach(rel => {
          relationsByType[rel.type] = (relationsByType[rel.type] || 0) + 1;
        });

        // Get recent items (last 5)
        const recentItems = items
          .slice(-5)
          .map(item => ({
            id: item.id,
            type: item.type || 'unknown'
          }));

        return {
          itemCount: items.length,
          itemTypes: itemTypes,
          canvasSize: {
            width: canvas.width,
            height: canvas.height
          },
          relations: {
            total: relations.length,
            byType: relationsByType
          },
          recentItems: recentItems,
          isEmpty: items.length === 0
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
 */
export function formatCanvasState(state: CanvasState): string {
  const lines: string[] = [];

  lines.push('Canvas State:');

  if (state.isEmpty) {
    lines.push('  - Canvas is EMPTY (no items)');
  } else {
    lines.push(`  - Total Items: ${state.itemCount}`);

    // Item types
    if (Object.keys(state.itemTypes).length > 0) {
      lines.push('  - Item Types:');
      Object.entries(state.itemTypes)
        .sort(([, a], [, b]) => b - a) // Sort by count descending
        .forEach(([type, count]) => {
          lines.push(`    • ${type}: ${count}`);
        });
    }

    // Relations
    if (state.relations.total > 0) {
      lines.push(`  - Relations: ${state.relations.total}`);
      if (Object.keys(state.relations.byType).length > 0) {
        Object.entries(state.relations.byType)
          .sort(([, a], [, b]) => b - a)
          .forEach(([type, count]) => {
            lines.push(`    • ${type}: ${count}`);
          });
      }
    } else {
      lines.push('  - Relations: None');
    }

    // Recent items
    if (state.recentItems.length > 0) {
      lines.push('  - Recent Items:');
      state.recentItems.forEach(item => {
        lines.push(`    • ${item.id} (${item.type})`);
      });
    }
  }

  lines.push(`  - Canvas Size: ${state.canvasSize.width}x${state.canvasSize.height}`);

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
