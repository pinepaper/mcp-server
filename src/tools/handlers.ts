/**
 * PinePaper Tool Handlers
 *
 * Process MCP tool calls and generate executable PinePaper code.
 * Supports i18n for localized error and success messages.
 * Supports browser execution via Puppeteer.
 */

import { CallToolResult, TextContent, ImageContent } from '@modelcontextprotocol/sdk/types.js';
import { codeGenerator } from '../types/code-generator.js';
import {
  CreateItemInputSchema,
  ModifyItemInputSchema,
  DeleteItemInputSchema,
  AddRelationInputSchema,
  RemoveRelationInputSchema,
  QueryRelationsInputSchema,
  AnimateItemInputSchema,
  KeyframeAnimateInputSchema,
  ExecuteGeneratorInputSchema,
  ApplyEffectInputSchema,
  GetItemsInputSchema,
  PlayTimelineInputSchema,
  SetBackgroundColorInputSchema,
  SetCanvasSizeInputSchema,
  ExportTrainingDataInputSchema,
  ImportSVGInputSchema,
  AddFilterInputSchema,
  CreateGlossySphereInputSchema,
  CreateDiagonalStripesInputSchema,
  BatchCreateInputSchema,
  BatchModifyInputSchema,
  CreateGridInputSchema,
  GetPerformanceMetricsInputSchema,
  SearchAssetsInputSchema,
  ImportAssetInputSchema,
  P5DrawInputSchema,
  ErrorCodes,
  RelationType,
  ItemType,
} from '../types/schemas.js';
import { ZodError } from 'zod';
import { I18nManager, getI18n } from '../i18n/index.js';
import {
  PinePaperBrowserController,
  getBrowserController,
  type BrowserControllerConfig,
} from '../browser/puppeteer-controller.js';
import { getPerformanceTracker, TimingMetric, MetricsExportFormat } from '../metrics/index.js';
import { ErrorContext, formatErrorContext, captureCanvasState } from '../execution/index.js';

// =============================================================================
// SCREENSHOT MODE CONFIGURATION
// =============================================================================

/**
 * Screenshot modes for performance optimization.
 * Based on best practices: "Take 1 screenshot per creative task, not per operation"
 *
 * - 'on_request': Only take screenshots when explicitly requested via pinepaper_browser_screenshot (RECOMMENDED)
 * - 'always': Take screenshot after every tool execution (legacy behavior, slower)
 * - 'never': Never take screenshots automatically
 */
export type ScreenshotMode = 'on_request' | 'always' | 'never';

/**
 * Get screenshot mode from environment variable.
 * Defaults to 'on_request' for optimal performance.
 */
export function getScreenshotMode(): ScreenshotMode {
  const mode = process.env.PINEPAPER_SCREENSHOT_MODE?.toLowerCase();
  if (mode === 'always' || mode === 'never' || mode === 'on_request') {
    return mode;
  }
  // Default to 'on_request' for better performance (best practice)
  return 'on_request';
}

// =============================================================================
// HANDLER OPTIONS
// =============================================================================

export interface HandlerOptions {
  i18n?: I18nManager;
  /** If true, execute code in browser instead of just generating it */
  executeInBrowser?: boolean;
  /** Browser controller instance (uses singleton if not provided) */
  browserController?: PinePaperBrowserController;
  /** Screenshot mode: 'on_request' (default), 'always', or 'never' */
  screenshotMode?: ScreenshotMode;
}

// =============================================================================
// RESULT HELPERS
// =============================================================================

function successResult(code: string, description?: string): CallToolResult {
  const content: TextContent[] = [
    {
      type: 'text',
      text: `Generated PinePaper code:\n\n\`\`\`javascript\n${code}\n\`\`\``,
    },
  ];

  if (description) {
    content.push({
      type: 'text',
      text: `\n${description}`,
    });
  }

  return { content };
}

function executedResult(
  code: string,
  result: unknown,
  screenshot?: string,
  description?: string
): CallToolResult {
  const content: (TextContent | ImageContent)[] = [
    {
      type: 'text',
      text: `Executed PinePaper code:\n\n\`\`\`javascript\n${code}\n\`\`\`\n\nResult: ${JSON.stringify(result, null, 2)}`,
    },
  ];

  if (description) {
    content.push({
      type: 'text',
      text: `\n${description}`,
    });
  }

  if (screenshot) {
    content.push({
      type: 'image',
      data: screenshot,
      mimeType: 'image/png',
    });
  }

  return { content };
}

function screenshotResult(screenshot: string): CallToolResult {
  return {
    content: [
      {
        type: 'image',
        data: screenshot,
        mimeType: 'image/png',
      } as ImageContent,
    ],
  };
}

function errorResult(
  code: string,
  message: string,
  details?: unknown,
  context?: ErrorContext
): CallToolResult {
  // Build error object
  const errorObj: any = {
    success: false,
    error: { code, message, details },
  };

  // Add formatted context if available
  if (context) {
    const contextText = formatErrorContext(context);
    if (contextText) {
      errorObj.context = contextText;
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(errorObj, null, 2),
      },
    ],
    isError: true,
  };
}

function handleValidationError(error: ZodError, i18n?: I18nManager): CallToolResult {
  const message = i18n
    ? i18n.getError('validationError', { message: 'Invalid input parameters' })
    : 'Invalid input parameters';

  return errorResult(
    ErrorCodes.VALIDATION_ERROR,
    message,
    error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }))
  );
}

/**
 * Execute code in browser if connected, otherwise return generated code.
 *
 * Screenshot behavior is controlled by PINEPAPER_SCREENSHOT_MODE environment variable:
 * - 'on_request': No automatic screenshots (use pinepaper_browser_screenshot explicitly)
 * - 'always': Take screenshot after every execution (legacy, slower)
 * - 'never': Never take screenshots
 *
 * Default is 'on_request' for optimal performance per best practices.
 */
async function executeOrGenerate(
  code: string,
  description: string,
  options: HandlerOptions,
  toolName: string
): Promise<CallToolResult> {
  const { executeInBrowser, browserController, screenshotMode } = options;
  const effectiveScreenshotMode = screenshotMode ?? getScreenshotMode();
  const tracker = getPerformanceTracker();

  // Start total timer
  const timerId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  tracker.startTimer(`${timerId}_total`);

  if (!executeInBrowser) {
    const totalDuration = tracker.endTimer(`${timerId}_total`);
    tracker.recordMetric({
      toolName,
      phase: 'total',
      duration: totalDuration,
      timestamp: Date.now(),
      success: true,
    });
    return successResult(code, description);
  }

  const controller = browserController || getBrowserController();

  if (!controller.connected) {
    const totalDuration = tracker.endTimer(`${timerId}_total`);
    tracker.recordMetric({
      toolName,
      phase: 'total',
      duration: totalDuration,
      timestamp: Date.now(),
      success: true,
      metadata: { browserConnected: false },
    });
    return successResult(
      code,
      `${description}\n\n⚠️ Browser not connected. Call pinepaper_browser_connect first to execute code live.`
    );
  }

  // Track browser execution time
  tracker.startTimer(`${timerId}_browser_execution`);

  // Only take screenshot if mode is 'always'
  // 'on_request' mode means screenshots only via pinepaper_browser_screenshot
  const shouldTakeScreenshot = effectiveScreenshotMode === 'always';

  // Track screenshot time separately if taking screenshot
  if (shouldTakeScreenshot) {
    tracker.startTimer(`${timerId}_screenshot`);
  }

  const result = await controller.executeCode(code, shouldTakeScreenshot);

  const browserDuration = tracker.endTimer(`${timerId}_browser_execution`);
  tracker.recordMetric({
    toolName,
    phase: 'browser_execution',
    duration: browserDuration,
    timestamp: Date.now(),
    success: result.success,
    error: result.error,
  });

  if (shouldTakeScreenshot) {
    const screenshotDuration = tracker.endTimer(`${timerId}_screenshot`);
    tracker.recordMetric({
      toolName,
      phase: 'screenshot',
      duration: screenshotDuration,
      timestamp: Date.now(),
      success: !!result.screenshot,
    });
  }

  // Record total duration
  const totalDuration = tracker.endTimer(`${timerId}_total`);
  tracker.recordMetric({
    toolName,
    phase: 'total',
    duration: totalDuration,
    timestamp: Date.now(),
    success: result.success,
    error: result.error,
  });

  if (!result.success) {
    // Capture canvas state for error context
    const canvasState = await captureCanvasState(controller);

    return errorResult(
      ErrorCodes.EXECUTION_ERROR,
      result.error || 'Failed to execute code in browser',
      { code },
      {
        toolName,
        canvasState: canvasState || undefined,
      }
    );
  }

  return executedResult(code, result.result, result.screenshot, description);
}

// =============================================================================
// I18N HELPER FUNCTIONS
// =============================================================================

function getLocalizedSuccessMessage(
  i18n: I18nManager | undefined,
  key: string,
  params: Record<string, string | number>
): string {
  if (!i18n) {
    // Fallback to English template
    return Object.entries(params).reduce(
      (msg, [k, v]) => msg.replace(`{{${k}}}`, String(v)),
      key
    );
  }
  return i18n.getSuccess(key, params);
}

// =============================================================================
// PERFORMANCE TRACKING HELPER
// =============================================================================

/**
 * Execute a tool handler with automatic performance tracking for validation and code generation
 */
async function executeToolWithTracking<T>(
  toolName: string,
  args: Record<string, unknown>,
  options: HandlerOptions,
  validator: () => T,
  codeGenerator: (input: T) => string,
  description: string | ((input: T) => string)
): Promise<CallToolResult> {
  const tracker = getPerformanceTracker();
  const baseTimerId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Track validation
  tracker.startTimer(`${baseTimerId}_validation`);
  const input = validator();
  const validationDuration = tracker.endTimer(`${baseTimerId}_validation`);
  tracker.recordMetric({
    toolName,
    phase: 'validation',
    duration: validationDuration,
    timestamp: Date.now(),
    success: true,
  });

  // Track code generation
  tracker.startTimer(`${baseTimerId}_code_generation`);
  const code = codeGenerator(input);
  const codeGenDuration = tracker.endTimer(`${baseTimerId}_code_generation`);
  tracker.recordMetric({
    toolName,
    phase: 'code_generation',
    duration: codeGenDuration,
    timestamp: Date.now(),
    success: true,
  });

  // Get final description
  const finalDescription = typeof description === 'function' ? description(input) : description;

  // Execute (will handle browser execution and screenshot timing)
  return executeOrGenerate(code, finalDescription, options, toolName);
}

// =============================================================================
// TOOL HANDLERS
// =============================================================================

export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  options: HandlerOptions = {}
): Promise<CallToolResult> {
  const { i18n } = options;
  const tracker = getPerformanceTracker();
  const baseTimerId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    switch (toolName) {
      // -----------------------------------------------------------------------
      // ITEM TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_create_item': {
        // Track validation phase
        tracker.startTimer(`${baseTimerId}_validation`);
        const input = CreateItemInputSchema.parse(args);
        const validationDuration = tracker.endTimer(`${baseTimerId}_validation`);
        tracker.recordMetric({
          toolName,
          phase: 'validation',
          duration: validationDuration,
          timestamp: Date.now(),
          success: true,
        });

        // Track code generation phase
        tracker.startTimer(`${baseTimerId}_code_generation`);
        const code = codeGenerator.generateCreateItem(input);
        const codeGenDuration = tracker.endTimer(`${baseTimerId}_code_generation`);
        tracker.recordMetric({
          toolName,
          phase: 'code_generation',
          duration: codeGenDuration,
          timestamp: Date.now(),
          success: true,
        });

        const description = getLocalizedSuccessMessage(i18n, 'itemCreated', {
          itemType: input.itemType,
          x: input.position.x,
          y: input.position.y,
        });
        return executeOrGenerate(code, description, options, toolName);
      }

      case 'pinepaper_modify_item': {
        const input = ModifyItemInputSchema.parse(args);
        const code = codeGenerator.generateModifyItem(input);
        const description = getLocalizedSuccessMessage(i18n, 'itemModified', {
          itemId: input.itemId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_modify_item');
      }

      case 'pinepaper_delete_item': {
        const input = DeleteItemInputSchema.parse(args);
        const code = codeGenerator.generateDeleteItem(input.itemId);
        const description = getLocalizedSuccessMessage(i18n, 'itemDeleted', {
          itemId: input.itemId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_delete_item');
      }

      // -----------------------------------------------------------------------
      // HIGH-LEVEL DESIGN TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_create_glossy_sphere': {
        const input = CreateGlossySphereInputSchema.parse(args);
        const code = codeGenerator.generateCreateGlossySphere(input);
        const description = `Creates a 3D glossy sphere with ${input.baseColor} color at (${input.position.x}, ${input.position.y})`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_glossy_sphere');
      }

      case 'pinepaper_create_diagonal_stripes': {
        const input = CreateDiagonalStripesInputSchema.parse(args);
        const code = codeGenerator.generateCreateDiagonalStripes(input);
        const description = `Creates diagonal stripes pattern at (${input.position.x}, ${input.position.y}) with ${input.colors.length} colors`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_diagonal_stripes');
      }

      // -----------------------------------------------------------------------
      // BATCH OPERATION TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_batch_create': {
        const input = BatchCreateInputSchema.parse(args);
        const code = codeGenerator.generateBatchCreate(input);
        const description = `Batch creates ${input.items.length} items with single history save`;
        return executeOrGenerate(code, description, options, 'pinepaper_batch_create');
      }

      case 'pinepaper_batch_modify': {
        const input = BatchModifyInputSchema.parse(args);
        const code = codeGenerator.generateBatchModify(input);
        const description = `Batch modifies ${input.modifications.length} items with single history save`;
        return executeOrGenerate(code, description, options, 'pinepaper_batch_modify');
      }

      case 'pinepaper_create_grid': {
        const input = CreateGridInputSchema.parse(args);
        const code = codeGenerator.generateCreateGrid(input);
        const description = `Creates a ${input.cols}x${input.rows} grid${input.animated ? ' with wave animation' : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_grid');
      }

      // -----------------------------------------------------------------------
      // RELATION TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_add_relation': {
        const input = AddRelationInputSchema.parse(args);
        const code = codeGenerator.generateAddRelation(input);
        const description = getLocalizedSuccessMessage(i18n, 'relationAdded', {
          relationType: input.relationType,
          sourceId: input.sourceId,
          targetId: input.targetId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_add_relation');
      }

      case 'pinepaper_remove_relation': {
        const input = RemoveRelationInputSchema.parse(args);
        const code = codeGenerator.generateRemoveRelation(
          input.sourceId,
          input.targetId,
          input.relationType as RelationType | undefined
        );
        const description = getLocalizedSuccessMessage(i18n, 'relationRemoved', {
          sourceId: input.sourceId,
          targetId: input.targetId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_remove_relation');
      }

      case 'pinepaper_query_relations': {
        const input = QueryRelationsInputSchema.parse(args);
        const code = codeGenerator.generateQueryRelations(
          input.itemId,
          input.relationType as RelationType | undefined,
          input.direction
        );
        return executeOrGenerate(
          code,
          `Queries ${input.direction || 'all'} relations for ${input.itemId}`,
          options,
          'pinepaper_query_relations'
        );
      }

      // -----------------------------------------------------------------------
      // ANIMATION TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_animate': {
        const input = AnimateItemInputSchema.parse(args);
        const code = codeGenerator.generateAnimate(input);
        const description = getLocalizedSuccessMessage(i18n, 'animationApplied', {
          animationType: input.animationType,
          itemId: input.itemId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_animate');
      }

      case 'pinepaper_keyframe_animate': {
        const input = KeyframeAnimateInputSchema.parse(args);
        const code = codeGenerator.generateKeyframeAnimate(input);
        return executeOrGenerate(
          code,
          `Applies keyframe animation with ${input.keyframes.length} keyframes to ${input.itemId}`,
          options,
          'pinepaper_keyframe_animate'
        );
      }

      case 'pinepaper_play_timeline': {
        const input = PlayTimelineInputSchema.parse(args);
        const code = codeGenerator.generatePlayTimeline(
          input.action,
          input.duration,
          input.loop,
          input.time
        );
        return executeOrGenerate(code, `Timeline action: ${input.action}`, options, 'pinepaper_play_timeline');
      }

      // -----------------------------------------------------------------------
      // GENERATOR TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_execute_generator': {
        const input = ExecuteGeneratorInputSchema.parse(args);
        const code = codeGenerator.generateExecuteGenerator(input);
        const description = getLocalizedSuccessMessage(i18n, 'generatorExecuted', {
          generatorName: input.generatorName,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_execute_generator');
      }

      case 'pinepaper_list_generators': {
        const code = codeGenerator.generateListGenerators();
        return executeOrGenerate(code, 'Lists all available generators', options, 'pinepaper_list_generators');
      }

      // -----------------------------------------------------------------------
      // EFFECT TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_apply_effect': {
        const input = ApplyEffectInputSchema.parse(args);
        const code = codeGenerator.generateApplyEffect(input);
        const description = getLocalizedSuccessMessage(i18n, 'effectApplied', {
          effectType: input.effectType,
          itemId: input.itemId,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_apply_effect');
      }

      // -----------------------------------------------------------------------
      // QUERY TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_get_items': {
        const input = GetItemsInputSchema.parse(args);
        const code = codeGenerator.generateGetItems(
          input.filter as
            | {
                type?: ItemType;
                source?: string;
                hasAnimation?: boolean;
                hasRelation?: boolean;
              }
            | undefined
        );
        return executeOrGenerate(code, 'Gets items from canvas', options, 'pinepaper_get_items');
      }

      case 'pinepaper_get_relation_stats': {
        const code = codeGenerator.generateGetRelationStats();
        return executeOrGenerate(code, 'Gets relation statistics', options, 'pinepaper_get_relation_stats');
      }

      // -----------------------------------------------------------------------
      // CANVAS TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_set_background_color': {
        const input = SetBackgroundColorInputSchema.parse(args);
        const code = codeGenerator.generateSetBackgroundColor(input);
        const description = getLocalizedSuccessMessage(i18n, 'backgroundSet', {
          color: input.color,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_set_background_color');
      }

      case 'pinepaper_set_canvas_size': {
        const input = SetCanvasSizeInputSchema.parse(args);
        const code = codeGenerator.generateSetCanvasSize(input);
        const description = getLocalizedSuccessMessage(i18n, 'canvasSizeSet', {
          width: input.width,
          height: input.height,
        });
        return executeOrGenerate(code, description, options, 'pinepaper_set_canvas_size');
      }

      case 'pinepaper_get_canvas_size': {
        const code = codeGenerator.generateGetCanvasSize();
        return executeOrGenerate(code, 'Gets current canvas dimensions', options, 'pinepaper_get_canvas_size');
      }

      case 'pinepaper_clear_canvas': {
        const code = codeGenerator.generateClearCanvas();
        const description = 'Clears all items from the canvas, including any welcome template items';
        return executeOrGenerate(code, description, options, 'pinepaper_clear_canvas');
      }

      case 'pinepaper_refresh_page': {
        const controller = options.browserController || getBrowserController();

        if (!controller.connected) {
          return errorResult(
            'BROWSER_NOT_CONNECTED',
            'Not connected to PinePaper Studio. Call pinepaper_browser_connect first.'
          );
        }

        try {
          // Refresh the page
          await controller.refreshPage();

          // Wait a moment for the page to stabilize
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Take a screenshot to show the result
          const screenshot = await controller.takeScreenshot();

          const content: (TextContent | ImageContent)[] = [
            {
              type: 'text',
              text: `✅ Page refreshed successfully.

The canvas is now completely empty. The welcome template will not appear (it only shows for first-time visitors).

You can now start creating new items on a clean canvas.`,
            },
          ];

          if (screenshot) {
            content.push({
              type: 'image',
              data: screenshot,
              mimeType: 'image/png',
            });
          }

          return { content };
        } catch (error) {
          return errorResult(
            'REFRESH_FAILED',
            error instanceof Error ? error.message : 'Failed to refresh page'
          );
        }
      }

      // -----------------------------------------------------------------------
      // IMPORT TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_import_svg': {
        const input = ImportSVGInputSchema.parse(args);
        const code = codeGenerator.generateImportSVG(
          input.svgString,
          input.url,
          input.position,
          input.scale
        );
        const description = 'Imports SVG onto the canvas';
        return executeOrGenerate(code, description, options, 'pinepaper_import_svg');
      }

      // -----------------------------------------------------------------------
      // FILTER TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_add_filter': {
        const input = AddFilterInputSchema.parse(args);
        const code = codeGenerator.generateAddFilter(
          input.filterType,
          input.params as Record<string, unknown>
        );
        const description = `Adds ${input.filterType} filter to the canvas`;
        return executeOrGenerate(code, description, options, 'pinepaper_add_filter');
      }

      // -----------------------------------------------------------------------
      // EXPORT TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_export_svg': {
        const code = codeGenerator.generateExportSVG();
        const description = getLocalizedSuccessMessage(i18n, 'exported', {
          format: 'SVG',
        });
        return executeOrGenerate(code, description, options, 'pinepaper_export_svg');
      }

      case 'pinepaper_export_training_data': {
        const input = ExportTrainingDataInputSchema.parse(args);
        const code = codeGenerator.generateExportTrainingData(
          input.format,
          input.includeMetadata
        );
        const description = getLocalizedSuccessMessage(i18n, 'exported', {
          format: input.format?.toUpperCase() || 'JSON',
        });
        return executeOrGenerate(code, description, options, 'pinepaper_export_training_data');
      }

      // -----------------------------------------------------------------------
      // BROWSER CONTROL TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_browser_connect': {
        const url = (args.url as string) || 'https://pinepaper.studio';
        const headless = (args.headless as boolean) ?? false;

        const controller = getBrowserController({ studioUrl: url, headless });

        if (controller.connected) {
          return {
            content: [
              {
                type: 'text',
                text: `Already connected to PinePaper Studio at ${controller.studioUrl}`,
              },
            ],
          };
        }

        try {
          await controller.connect();

          // Get canvas size info to help agent understand the workspace
          const canvasSizeResult = await controller.executeCode(
            `const size = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 }; ({ width: size.width || 800, height: size.height || 600 });`,
            false
          );
          const canvasSize = canvasSizeResult.success
            ? (canvasSizeResult.result as { width: number; height: number })
            : { width: 800, height: 600 };

          const screenshot = await controller.takeScreenshot();

          const content: (TextContent | ImageContent)[] = [
            {
              type: 'text',
              text: `✅ Connected to PinePaper Studio at ${url}

**Current canvas size: ${canvasSize.width}x${canvasSize.height}**

⚠️ IMPORTANT NOTES:
1. **Welcome Template**: First-time visitors see a welcome template with example items. Use \`pinepaper_clear_canvas\` or \`pinepaper_refresh_page\` to start with an empty canvas.
2. **Canvas Size**: For complex designs (cards, invitations, detailed graphics), call \`pinepaper_set_canvas_size\` FIRST to set an appropriate size like 1080x1080 or larger. The default 800x600 may be too small.
3. **Verify with Screenshots**: After making changes, use \`pinepaper_browser_screenshot\` to confirm your work.

Browser is ready. You can now use other pinepaper tools to create and animate graphics.`,
            },
          ];

          if (screenshot) {
            content.push({
              type: 'image',
              data: screenshot,
              mimeType: 'image/png',
            });
          }

          return { content };
        } catch (error) {
          return errorResult(
            'BROWSER_CONNECTION_ERROR',
            error instanceof Error ? error.message : 'Failed to connect to browser',
            { url }
          );
        }
      }

      case 'pinepaper_browser_disconnect': {
        const controller = getBrowserController();

        if (!controller.connected) {
          return {
            content: [
              {
                type: 'text',
                text: 'Not connected to any browser.',
              },
            ],
          };
        }

        await controller.disconnect();

        return {
          content: [
            {
              type: 'text',
              text: '✅ Disconnected from PinePaper Studio. Browser closed.',
            },
          ],
        };
      }

      case 'pinepaper_browser_screenshot': {
        const controller = getBrowserController();

        if (!controller.connected) {
          return errorResult(
            'BROWSER_NOT_CONNECTED',
            'Not connected to PinePaper Studio. Call pinepaper_browser_connect first.'
          );
        }

        const screenshot = await controller.takeScreenshot();

        if (!screenshot) {
          // Capture canvas state for debugging
          const canvasState = await captureCanvasState(controller);

          return errorResult(
            'SCREENSHOT_FAILED',
            'Failed to capture screenshot',
            undefined,
            {
              toolName: 'pinepaper_browser_screenshot',
              canvasState: canvasState || undefined,
            }
          );
        }

        return screenshotResult(screenshot);
      }

      case 'pinepaper_browser_status': {
        const controller = getBrowserController();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  connected: controller.connected,
                  studioUrl: controller.studioUrl,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      // PERFORMANCE TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_get_performance_metrics': {
        const input = GetPerformanceMetricsInputSchema.parse(args);
        const perfTracker = getPerformanceTracker();

        // Build filter
        const filter = {
          toolName: input.toolName,
          phase: input.phase,
          since: input.since,
          limit: input.limit ?? 100,
        };

        // Get format (default to 'summary')
        const format = input.format ?? 'summary';

        // Export metrics in requested format
        const output = perfTracker.exportMetrics(format as MetricsExportFormat, filter);

        // Get tracker stats
        const trackerStats = perfTracker.getStats();

        return {
          content: [
            {
              type: 'text',
              text: format === 'csv' || format === 'summary'
                ? output
                : JSON.stringify({
                    metrics: output,
                    trackerInfo: trackerStats,
                  }, null, 2),
            },
          ],
        };
      }

      // -----------------------------------------------------------------------
      // ASSET TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_search_assets': {
        const input = SearchAssetsInputSchema.parse(args);
        const { getAssetManager } = await import('../assets/index.js');
        const assetManager = getAssetManager();

        try {
          const results = await assetManager.search(
            input.query,
            input.repository || 'all',
            input.limit || 10
          );

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    query: input.query,
                    repository: input.repository || 'all',
                    count: results.length,
                    results: results.map((r) => ({
                      id: r.id,
                      repository: r.repository,
                      title: r.title,
                      description: r.description,
                      previewUrl: r.previewUrl,
                      license: r.license,
                      tags: r.tags,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } catch (error) {
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            error instanceof Error ? error.message : 'Failed to search assets',
            { query: input.query }
          );
        }
      }

      case 'pinepaper_import_asset': {
        const input = ImportAssetInputSchema.parse(args);
        const { getAssetManager } = await import('../assets/index.js');
        const assetManager = getAssetManager();

        try {
          // Validate that either assetId or url is provided
          if (!input.assetId && !input.url) {
            return errorResult(
              ErrorCodes.INVALID_PARAMS,
              'Either assetId or url must be provided'
            );
          }

          let svg: string;
          let metadata: any;

          if (input.assetId) {
            // Download from asset manager
            const result = await assetManager.download(input.assetId);
            svg = result.svg;
            metadata = result.metadata;
          } else if (input.url) {
            // For URL imports, we'd need to fetch the SVG
            // For now, delegate to pinepaper_import_svg
            return errorResult(
              ErrorCodes.INVALID_PARAMS,
              'URL imports not yet implemented - use pinepaper_import_svg with url parameter instead',
              { url: input.url }
            );
          }

          // Import the SVG onto canvas using existing import_svg tool
          const code = codeGenerator.generateImportSVG(
            svg!,
            undefined,
            input.position,
            input.scale
          );

          const description = `Imported asset: ${metadata.title} (${metadata.license.name})`;

          return executeOrGenerate(code, description, options, 'pinepaper_import_asset');
        } catch (error) {
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            error instanceof Error ? error.message : 'Failed to import asset',
            { assetId: input.assetId, url: input.url }
          );
        }
      }

      // -----------------------------------------------------------------------
      // P5.JS COMPATIBILITY
      // -----------------------------------------------------------------------
      case 'pinepaper_p5_draw': {
        const input = P5DrawInputSchema.parse(args);
        const code = codeGenerator.generateP5Draw(input.code);
        const description = 'Executed p5.js-style drawing code';
        return executeOrGenerate(code, description, options, 'pinepaper_p5_draw');
      }

      // -----------------------------------------------------------------------
      // UNKNOWN TOOL
      // -----------------------------------------------------------------------
      default: {
        const message = i18n
          ? i18n.getError('unknownTool', { toolName })
          : `Unknown tool: ${toolName}`;

        return errorResult('UNKNOWN_TOOL', message, {
          availableTools: [
            'pinepaper_create_item',
            'pinepaper_modify_item',
            'pinepaper_delete_item',
            'pinepaper_create_glossy_sphere',
            'pinepaper_create_diagonal_stripes',
            'pinepaper_batch_create',
            'pinepaper_batch_modify',
            'pinepaper_create_grid',
            'pinepaper_add_relation',
            'pinepaper_remove_relation',
            'pinepaper_query_relations',
            'pinepaper_animate',
            'pinepaper_keyframe_animate',
            'pinepaper_play_timeline',
            'pinepaper_execute_generator',
            'pinepaper_list_generators',
            'pinepaper_apply_effect',
            'pinepaper_get_items',
            'pinepaper_get_relation_stats',
            'pinepaper_set_background_color',
            'pinepaper_set_canvas_size',
            'pinepaper_get_canvas_size',
            'pinepaper_clear_canvas',
            'pinepaper_refresh_page',
            'pinepaper_import_svg',
            'pinepaper_add_filter',
            'pinepaper_export_svg',
            'pinepaper_export_training_data',
            'pinepaper_browser_connect',
            'pinepaper_browser_disconnect',
            'pinepaper_browser_screenshot',
            'pinepaper_browser_status',
            'pinepaper_get_performance_metrics',
            'pinepaper_search_assets',
            'pinepaper_import_asset',
          ],
        });
      }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error, i18n);
    }

    // Try to capture canvas state for error context (if browser is connected)
    let canvasState = null;
    try {
      const controller = options.browserController || getBrowserController();
      if (controller.connected) {
        canvasState = await captureCanvasState(controller);
      }
    } catch (stateError) {
      // Ignore errors from canvas state capture
    }

    if (error instanceof Error) {
      const message = i18n
        ? i18n.getError('executionError', { message: error.message })
        : error.message;

      return errorResult(
        ErrorCodes.EXECUTION_ERROR,
        message,
        {
          stack: error.stack,
        },
        {
          toolName,
          canvasState: canvasState || undefined,
        }
      );
    }

    const message = i18n
      ? i18n.getError('executionError', { message: 'Unknown error occurred' })
      : 'Unknown error occurred';

    return errorResult(
      ErrorCodes.EXECUTION_ERROR,
      message,
      { error },
      {
        toolName,
        canvasState: canvasState || undefined,
      }
    );
  }
}
