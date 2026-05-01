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
  ImportMermaidInputSchema,
  AddFilterInputSchema,
  CreateGlossySphereInputSchema,
  CreateDiagonalStripesInputSchema,
  BatchCreateInputSchema,
  BatchModifyInputSchema,
  CreateGridInputSchema,
  CreateSceneInputSchema,
  GetPerformanceMetricsInputSchema,
  DiagnosticReportInputSchema,
  SearchAssetsInputSchema,
  ImportAssetInputSchema,
  P5DrawInputSchema,
  // Diagram schemas
  CreateDiagramShapeInputSchema,
  ConnectInputSchema,
  ConnectPortsInputSchema,
  AddPortsInputSchema,
  AutoLayoutInputSchema,
  GetDiagramShapesInputSchema,
  UpdateConnectorInputSchema,
  RemoveConnectorInputSchema,
  DiagramModeInputSchema,
  // Agent flow mode schemas
  AgentStartJobInputSchema,
  AgentEndJobInputSchema,
  AgentResetInputSchema,
  AgentBatchExecuteInputSchema,
  AgentExportInputSchema,
  AgentAnalyzeInputSchema,
  // Interactive/Trigger schemas
  AddTriggerInputSchema,
  RemoveTriggerInputSchema,
  QueryTriggersInputSchema,
  // Quiz schemas
  CreateQuizInputSchema,
  GetQuizStateInputSchema,
  ResetQuizInputSchema,
  // Letter collage schemas
  CreateLetterCollageInputSchema,
  AnimateLetterCollageInputSchema,
  GetLetterCollageOptionsInputSchema,
  // Canvas presets schemas
  GetCanvasPresetsInputSchema,
  // Map schemas
  LoadMapInputSchema,
  HighlightRegionsInputSchema,
  UnhighlightRegionsInputSchema,
  ApplyDataColorsInputSchema,
  AddMarkerInputSchema,
  AddMapLabelsInputSchema,
  PanMapInputSchema,
  ZoomMapInputSchema,
  ExportMapInputSchema,
  ImportCustomMapInputSchema,
  GetRegionAtPointInputSchema,
  // Map animation/CSV schemas
  AnimateMapRegionsInputSchema,
  AnimateMapWaveInputSchema,
  StopMapAnimationsInputSchema,
  GetAnimatedMapRegionsInputSchema,
  ExportMapRegionCSVInputSchema,
  ImportMapRegionCSVInputSchema,
  SelectMapRegionsInputSchema,
  DeselectMapRegionsInputSchema,
  GetHighlightedMapRegionsInputSchema,
  // Custom relation/code schemas
  RegisterCustomRelationInputSchema,
  ExecuteCustomCodeInputSchema,
  // Mask schemas
  ApplyAnimatedMaskInputSchema,
  ApplyCustomMaskInputSchema,
  RemoveMaskInputSchema,
  // Template schemas
  ApplyTemplateInputSchema,
  // Image import schemas
  ImportImageInputSchema,
  // Tool guide schema
  ToolGuideInputSchema,
  // Ontology schemas
  AnalyzeDesignInputSchema,
  ValidateDesignInputSchema,
  QueryOntologyInputSchema,
  // Scene management schemas
  ManageScenesInputSchema,
  ScenePlaybackInputSchema,
  // New consolidated tool schemas
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
  DeformInputSchema,
  SpriteSheetInputSchema,
  StorageInputSchema,
  InteractionInputSchema,
  ExportWidgetInputSchema,
  ExportWidgetHtmlInputSchema,
  CreateChartInputSchema,
  MagicInputSchema,
  PhysicsInputSchema,
  MeasurementInputSchema,
  ErrorCodes,
  RelationType,
  ItemType,
} from '../types/schemas.js';
import { ZodError } from 'zod';
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { I18nManager, getI18n } from '../i18n/index.js';
import {
  PinePaperBrowserController,
  getBrowserController,
  resetBrowserController,
  type BrowserControllerConfig,
} from '../browser/puppeteer-controller.js';
import { getPerformanceTracker, TimingMetric, MetricsExportFormat } from '../metrics/index.js';
import { ErrorContext, formatErrorContext, captureCanvasState } from '../execution/index.js';
import { getSessionManager } from '../agent/session-manager.js';
import { vocabularyHintForPath } from '../ontology/hints.js';

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
// EXPORT FILE SAVE HELPERS
// =============================================================================

function getExportDir(): string {
  return process.env.PINEPAPER_EXPORT_DIR || join(tmpdir(), 'pinepaper-exports');
}

const ALWAYS_SAVE_FORMATS = new Set(['mp4', 'webm', 'gif', 'pdf']);
const SAVE_THRESHOLD_BYTES = 500_000; // ~500KB base64 ≈ 375KB decoded

function getFileExtension(format: string): string {
  const extMap: Record<string, string> = { mp4: 'mp4', webm: 'webm', gif: 'gif', pdf: 'pdf', png: 'png', svg: 'svg' };
  return extMap[format] || format;
}

async function saveExportToFile(
  data: string,
  format: string,
  platform: string
): Promise<{ filePath: string; fileSize: number }> {
  const exportDir = getExportDir();
  await mkdir(exportDir, { recursive: true });

  const ext = getFileExtension(format);
  const timestamp = Date.now();
  const fileName = `pinepaper_${platform}_${timestamp}.${ext}`;
  const filePath = join(exportDir, fileName);

  if (data.startsWith('data:')) {
    const base64Data = data.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(filePath, buffer);
    return { filePath, fileSize: buffer.length };
  } else {
    // Plain text (SVG)
    await writeFile(filePath, data, 'utf-8');
    return { filePath, fileSize: Buffer.byteLength(data, 'utf-8') };
  }
}

// =============================================================================
// EXECUTION MODE CONFIGURATION
// =============================================================================

/**
 * Execution modes for tool behavior.
 *
 * - 'puppeteer': Execute code in browser via Puppeteer (default, opens browser window)
 * - 'code': Generate code only - user copies and pastes code into PinePaper console
 *
 * 'code' mode is useful when:
 * - Multiple browser instances are being opened unnecessarily
 * - User wants to test/verify generated code before execution
 * - Running in environments where Puppeteer browser windows are problematic
 * - User prefers manual control over execution
 */
export type ExecutionMode = 'puppeteer' | 'code';

/**
 * Get execution mode from environment variable.
 * Defaults to 'puppeteer' for live execution.
 */
export function getExecutionMode(): ExecutionMode {
  const mode = process.env.PINEPAPER_EXECUTION_MODE?.toLowerCase();
  if (mode === 'puppeteer' || mode === 'code') {
    return mode;
  }
  // Default to 'puppeteer' for live browser execution
  return 'puppeteer';
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
  /** Execution mode: 'puppeteer' (default) or 'code' (generate only) */
  executionMode?: ExecutionMode;
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
  const resultObj: Record<string, unknown> = { success: true, result };
  if (description) resultObj.description = description;

  const content: (TextContent | ImageContent)[] = [
    { type: 'text', text: JSON.stringify(resultObj, null, 2) },
    { type: 'text', text: `Generated code:\n\`\`\`javascript\n${code}\n\`\`\`` },
  ];

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

  const details = error.errors.map((e) => {
    const path = e.path.join('.');
    const detail: {
      path: string;
      message: string;
      vocabulary?: ReturnType<typeof vocabularyHintForPath>;
    } = { path, message: e.message };
    if (e.code === 'invalid_enum_value') {
      const received = (e as unknown as { received?: unknown }).received;
      const hint = vocabularyHintForPath(path, received);
      if (hint) detail.vocabulary = hint;
    }
    return detail;
  });

  return errorResult(ErrorCodes.VALIDATION_ERROR, message, details);
}

/**
 * Execute code in browser if connected, otherwise return generated code.
 *
 * Execution mode is controlled by PINEPAPER_EXECUTION_MODE environment variable:
 * - 'puppeteer': Execute code in browser via Puppeteer (default)
 * - 'code': Generate code only - user copies/pastes into PinePaper console
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
  const { executeInBrowser, browserController, screenshotMode, executionMode } = options;
  const effectiveExecutionMode = executionMode ?? getExecutionMode();
  const effectiveScreenshotMode = screenshotMode ?? getScreenshotMode();
  const tracker = getPerformanceTracker();

  // Start total timer
  const timerId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  tracker.startTimer(`${timerId}_total`);

  // In 'code' mode, always return generated code without browser execution
  if (effectiveExecutionMode === 'code') {
    const totalDuration = tracker.endTimer(`${timerId}_total`);
    tracker.recordMetric({
      toolName,
      phase: 'total',
      duration: totalDuration,
      timestamp: Date.now(),
      success: true,
      metadata: { executionMode: 'code' },
    });
    return {
      content: [
        {
          type: 'text',
          text: `✅ **Code Generated Successfully**

**Tool:** ${toolName}
**Action:** ${description}

## Generated Code

\`\`\`javascript
${code}
\`\`\`

## How to Execute

1. Open **PinePaper Studio**: https://pinepaper.studio/editor?agent=1&mode=agent
2. Click the **Code Console** button (</> icon) in the toolbar
3. Paste the code above into the console
4. Click **Run** to execute

The code is ready to use. Each subsequent tool call will also generate code you can paste.`,
        },
      ],
    };
  }

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

  // Auto-connect in agent mode if not connected
  if (!controller.connected) {
    console.error('[PinePaper] Auto-connecting browser in agent mode...');
    try {
      await controller.connect(); // Will use connectAgent() due to enforced agentMode
      console.error('[PinePaper] Browser auto-connected successfully');
    } catch (connectError) {
      const totalDuration = tracker.endTimer(`${timerId}_total`);
      tracker.recordMetric({
        toolName,
        phase: 'total',
        duration: totalDuration,
        timestamp: Date.now(),
        success: false,
        metadata: { browserConnected: false, autoConnectFailed: true, fallbackToCode: true },
      });

      // FALLBACK: Return code for manual paste instead of failing
      const errorMessage = connectError instanceof Error ? connectError.message : 'Unknown error';
      console.error(`[PinePaper] Browser connection failed: ${errorMessage}. Falling back to code-only mode.`);

      return {
        content: [
          {
            type: 'text',
            text: `⚠️ **Browser Connection Failed** - Falling back to code mode

**Error:** ${errorMessage}

**Don't worry!** You can still use PinePaper by copying the code below and pasting it into the PinePaper Code Console.

## How to use the code manually:

1. Open **PinePaper Studio**: https://pinepaper.studio/editor?agent=1&mode=agent
2. Click the **Code Console** button (</> icon) in the toolbar
3. Paste the code below into the console
4. Click **Run** to execute

---

## Generated Code for: ${toolName}

\`\`\`javascript
${code}
\`\`\`

---

**${description}**

💡 **Tip:** If browser connection keeps failing, check:
- Is Chrome/Chromium installed?
- Are there firewall restrictions?
- Try setting \`headless: false\` in browser_connect to see the browser window`,
          },
        ],
      };
    }
  }

  // Auto-start agent session if not already active (enforced agent mode)
  const sessionManager = getSessionManager();
  if (!sessionManager.hasActiveJob()) {
    sessionManager.startJob({
      name: 'auto_session',
      screenshotPolicy: 'on_complete',
    });
    console.error('[PinePaper] Auto-started agent session for enforced agent mode');
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

/**
 * Measure the approximate byte size of a CallToolResult payload.
 * Text content is measured directly; image content estimates base64 overhead.
 */
function measureResponseBytes(result: CallToolResult): number {
  let bytes = 0;
  if (result.content) {
    for (const item of result.content) {
      if (item.type === 'text') {
        bytes += Buffer.byteLength((item as TextContent).text, 'utf-8');
      } else if (item.type === 'image') {
        // Base64 image data
        bytes += ((item as ImageContent).data?.length ?? 0);
      }
    }
  }
  return bytes;
}

export async function handleToolCall(
  toolName: string,
  args: Record<string, unknown>,
  options: HandlerOptions = {}
): Promise<CallToolResult> {
  const tracker = getPerformanceTracker();
  const baseTimerId = `${toolName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await handleToolCallInner(toolName, args, options, tracker, baseTimerId);

  // Record response payload size for token estimation
  const responseBytes = measureResponseBytes(result);
  tracker.recordMetric({
    toolName,
    phase: 'response_size',
    duration: 0,
    timestamp: Date.now(),
    success: !result.isError,
    responseBytes,
  });

  return result;
}

async function handleToolCallInner(
  toolName: string,
  args: Record<string, unknown>,
  options: HandlerOptions,
  tracker: ReturnType<typeof getPerformanceTracker>,
  baseTimerId: string
): Promise<CallToolResult> {
  const { i18n } = options;

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

        // Guard: reject animation properties — they don't work via modify
        const animProps = ['animationType', 'animationSpeed', 'keyframes', 'animation'];
        const passedAnimProps = animProps.filter(p => p in (input.properties || {}));
        if (passedAnimProps.length > 0) {
          return errorResult(ErrorCodes.INVALID_PROPERTIES,
            `Animation properties (${passedAnimProps.join(', ')}) cannot be set via pinepaper_modify_item — they will be silently ignored. ` +
            `Use pinepaper_animate for loop animations (pulse, rotate, bounce, fade, wobble, slide) ` +
            `or pinepaper_keyframe_animate for timed/sequenced animations with precise control.`
          );
        }

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

      case 'pinepaper_create_scene': {
        const input = CreateSceneInputSchema.parse(args);
        const code = codeGenerator.generateCreateScene(input);
        const itemCount = input.items.length;
        const relationCount = input.relations?.length || 0;
        const animationCount = input.animations?.length || 0;
        const description = `Creates complete scene with ${itemCount} items, ${relationCount} relations, ${animationCount} animations`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_scene');
      }

      case 'pinepaper_manage_scenes': {
        const input = ManageScenesInputSchema.parse(args);
        const code = codeGenerator.generateManageScenes(input);
        return executeOrGenerate(code, `Scene: ${input.action}`, options, 'pinepaper_manage_scenes');
      }

      case 'pinepaper_scene_playback': {
        const input = ScenePlaybackInputSchema.parse(args);
        const code = codeGenerator.generateScenePlayback(input);
        return executeOrGenerate(code, `Scene playback: ${input.action}`, options, 'pinepaper_scene_playback');
      }

      // -----------------------------------------------------------------------
      // SELECTION, TRANSFORM & HISTORY TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_selection': {
        const input = SelectionInputSchema.parse(args);
        const code = codeGenerator.generateSelection(input);
        return executeOrGenerate(code, `Selection: ${input.action}`, options, 'pinepaper_selection');
      }

      case 'pinepaper_transform': {
        const input = TransformInputSchema.parse(args);
        const code = codeGenerator.generateTransform(input);
        return executeOrGenerate(code, `Transform: ${input.action}`, options, 'pinepaper_transform');
      }

      case 'pinepaper_history': {
        const input = HistoryInputSchema.parse(args);
        const code = codeGenerator.generateHistory(input);
        return executeOrGenerate(code, `History: ${input.action}`, options, 'pinepaper_history');
      }

      // -----------------------------------------------------------------------
      // IMAGE PROCESSING TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_image_filter': {
        const input = ImageFilterInputSchema.parse(args);
        const code = codeGenerator.generateImageFilter(input);
        return executeOrGenerate(code, `Image filter: ${input.action}`, options, 'pinepaper_image_filter');
      }

      case 'pinepaper_lasso': {
        const input = LassoInputSchema.parse(args);
        const code = codeGenerator.generateLasso(input);
        return executeOrGenerate(code, `Lasso: ${input.action}`, options, 'pinepaper_lasso');
      }

      case 'pinepaper_cutout_style': {
        const input = CutoutStyleInputSchema.parse(args);
        const code = codeGenerator.generateCutoutStyle(input);
        return executeOrGenerate(code, `Cutout style: ${input.action}`, options, 'pinepaper_cutout_style');
      }

      // -----------------------------------------------------------------------
      // COMPOSITION & VIEW TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_precomp': {
        const input = PrecompInputSchema.parse(args);
        const code = codeGenerator.generatePrecomp(input);
        return executeOrGenerate(code, `Precomp: ${input.action}`, options, 'pinepaper_precomp');
      }

      case 'pinepaper_view': {
        const input = ViewInputSchema.parse(args);
        const code = codeGenerator.generateView(input);
        return executeOrGenerate(code, `View: ${input.action}`, options, 'pinepaper_view');
      }

      case 'pinepaper_background': {
        const input = BackgroundInputSchema.parse(args);
        const code = codeGenerator.generateBackground(input);
        return executeOrGenerate(code, `Background: ${input.action}`, options, 'pinepaper_background');
      }

      // -----------------------------------------------------------------------
      // CANVAS QUERY TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_query': {
        const input = QueryInputSchema.parse(args);
        const code = codeGenerator.generateQuery(input);
        return executeOrGenerate(code, `Query: ${input.action}`, options, 'pinepaper_query');
      }

      // -----------------------------------------------------------------------
      // DEFORMATION, SPRITE SHEETS, STORAGE, INTERACTION
      // -----------------------------------------------------------------------
      case 'pinepaper_deform': {
        const input = DeformInputSchema.parse(args);
        const code = codeGenerator.generateDeform(input);
        return executeOrGenerate(code, `Deform: ${input.action}`, options, 'pinepaper_deform');
      }

      case 'pinepaper_sprite_sheet': {
        const input = SpriteSheetInputSchema.parse(args);
        const code = codeGenerator.generateSpriteSheet(input);
        return executeOrGenerate(code, `Sprite sheet: ${input.action}`, options, 'pinepaper_sprite_sheet');
      }

      case 'pinepaper_storage': {
        const input = StorageInputSchema.parse(args);
        const code = codeGenerator.generateStorage(input);
        return executeOrGenerate(code, `Storage: ${input.action}`, options, 'pinepaper_storage');
      }

      case 'pinepaper_interaction': {
        const input = InteractionInputSchema.parse(args);
        const code = codeGenerator.generateInteraction(input);
        return executeOrGenerate(code, `Interaction: ${input.action}`, options, 'pinepaper_interaction');
      }

      case 'pinepaper_export_widget': {
        const input = ExportWidgetInputSchema.parse(args);
        const code = codeGenerator.generateExportWidget(input);
        return executeOrGenerate(code, 'Export widget JSON', options, 'pinepaper_export_widget');
      }

      case 'pinepaper_export_widget_html': {
        const input = ExportWidgetHtmlInputSchema.parse(args);
        const code = codeGenerator.generateExportWidgetHtml(input);
        return executeOrGenerate(code, 'Export widget HTML', options, 'pinepaper_export_widget_html');
      }

      // -----------------------------------------------------------------------
      // DATA VISUALIZATION, MAGIC, PHYSICS, MEASUREMENT
      // -----------------------------------------------------------------------
      case 'pinepaper_create_chart': {
        const input = CreateChartInputSchema.parse(args);
        const code = codeGenerator.generateChart(input);
        return executeOrGenerate(code, `Chart: ${input.action}`, options, 'pinepaper_create_chart');
      }

      case 'pinepaper_magic': {
        const input = MagicInputSchema.parse(args);
        const code = codeGenerator.generateMagic(input);
        return executeOrGenerate(code, `Magic: ${input.action}`, options, 'pinepaper_magic');
      }

      case 'pinepaper_physics': {
        const input = PhysicsInputSchema.parse(args);
        const code = codeGenerator.generatePhysics(input);
        return executeOrGenerate(code, `Physics: ${input.action}`, options, 'pinepaper_physics');
      }

      case 'pinepaper_measurement': {
        const input = MeasurementInputSchema.parse(args);
        const code = codeGenerator.generateMeasurement(input);
        return executeOrGenerate(code, `Measurement: ${input.action}`, options, 'pinepaper_measurement');
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
          targetId: input.targetId || 'self',
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

      case 'pinepaper_register_custom_relation': {
        const input = RegisterCustomRelationInputSchema.parse(args);
        const code = codeGenerator.generateRegisterCustomRelation(input);
        return executeOrGenerate(
          code,
          `Registers custom relation type: ${input.name}`,
          options,
          'pinepaper_register_custom_relation'
        );
      }

      case 'pinepaper_execute_custom_code': {
        const input = ExecuteCustomCodeInputSchema.parse(args);
        const code = codeGenerator.generateExecuteCustomCode(input);
        return executeOrGenerate(
          code,
          input.description || 'Executes custom JavaScript code',
          options,
          'pinepaper_execute_custom_code'
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
      // MASK TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_apply_animated_mask': {
        const input = ApplyAnimatedMaskInputSchema.parse(args);
        const code = codeGenerator.generateApplyAnimatedMask(input);
        const mode = input.preset && input.keyframes ? 'hybrid' : input.preset ? 'preset' : 'custom';
        return executeOrGenerate(
          code,
          `Applies ${mode} animated mask to ${input.itemId}`,
          options,
          'pinepaper_apply_animated_mask'
        );
      }

      case 'pinepaper_apply_custom_mask': {
        const input = ApplyCustomMaskInputSchema.parse(args);
        const code = codeGenerator.generateApplyCustomMask(input);
        return executeOrGenerate(
          code,
          `Applies custom ${input.maskType} mask with ${input.keyframes.length} keyframes to ${input.itemId}`,
          options,
          'pinepaper_apply_custom_mask'
        );
      }

      case 'pinepaper_remove_mask': {
        const input = RemoveMaskInputSchema.parse(args);
        const code = codeGenerator.generateRemoveMask(input);
        return executeOrGenerate(code, `Removes mask from ${input.itemId}`, options, 'pinepaper_remove_mask');
      }

      case 'pinepaper_get_animatable_properties': {
        const code = codeGenerator.generateGetAnimatableProperties();
        return executeOrGenerate(code, 'Gets animatable properties for mask types', options, 'pinepaper_get_animatable_properties');
      }

      case 'pinepaper_get_available_easings': {
        const code = codeGenerator.generateGetAvailableEasings();
        return executeOrGenerate(code, 'Gets available easing functions', options, 'pinepaper_get_available_easings');
      }

      case 'pinepaper_get_mask_types': {
        const code = codeGenerator.generateGetMaskTypes();
        return executeOrGenerate(code, 'Gets available mask types', options, 'pinepaper_get_mask_types');
      }

      case 'pinepaper_get_mask_animations': {
        const code = codeGenerator.generateGetMaskAnimations();
        return executeOrGenerate(code, 'Gets available mask animation presets', options, 'pinepaper_get_mask_animations');
      }

      // -----------------------------------------------------------------------
      // CAMERA TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_camera_animate': {
        const keyframes = args.keyframes as Array<{
          time: number;
          zoom?: number;
          center?: [number, number];
          pitch?: number;
          yaw?: number;
          easing?: string;
        }>;
        const duration = args.duration as number;
        const loop = (args.loop as boolean) ?? false;
        const delay = (args.delay as number) ?? 0;
        const fov = (args.fov as number) ?? 60;
        const mode = (args.mode as string) ?? 'keyframes';
        const target = args.target as { x: number; y: number } | undefined;

        const keyframesStr = JSON.stringify(keyframes);
        const relParams: Record<string, unknown> = { keyframes: JSON.parse(keyframesStr), duration, loop, delay, fov, mode };
        if (target) relParams.target = target;
        const relParamsStr = JSON.stringify(relParams);
        const code = `app.camera && app.camera.animate ? app.camera.animate(${keyframesStr}, ${duration}, ${loop}, ${delay}, { fov: ${fov}, mode: '${mode}'${target ? `, target: ${JSON.stringify(target)}` : ''} }) : app.addRelation('camera', 'camera', 'camera_animates', ${relParamsStr});`;
        return executeOrGenerate(code, `Animates camera with ${keyframes.length} keyframes over ${duration}s`, options, 'pinepaper_camera_animate');
      }

      case 'pinepaper_camera_zoom': {
        const direction = args.direction as 'in' | 'out';
        const level = (args.level as number) ?? (direction === 'in' ? 2 : 0.5);
        const duration = (args.duration as number) ?? 0.5;

        const method = direction === 'in' ? 'zoomIn' : 'zoomOut';
        const code = `app.camera && app.camera.${method} ? app.camera.${method}(${level}, ${duration}) : null;`;
        return executeOrGenerate(code, `Camera zoom ${direction} to ${level}x`, options, 'pinepaper_camera_zoom');
      }

      case 'pinepaper_camera_pan': {
        const direction = args.direction as 'left' | 'right' | 'up' | 'down' | undefined;
        const amount = (args.amount as number) ?? 100;
        const x = args.x as number | undefined;
        const y = args.y as number | undefined;
        const duration = (args.duration as number) ?? 0.5;

        let code: string;
        let description: string;

        if (x !== undefined && y !== undefined) {
          code = `app.camera && app.camera.panTo ? app.camera.panTo(${x}, ${y}, ${duration}) : null;`;
          description = `Camera pan to (${x}, ${y})`;
        } else if (direction) {
          const methodMap = { left: 'panLeft', right: 'panRight', up: 'panUp', down: 'panDown' };
          const method = methodMap[direction];
          code = `app.camera && app.camera.${method} ? app.camera.${method}(${amount}, ${duration}) : null;`;
          description = `Camera pan ${direction} by ${amount}px`;
        } else {
          code = `// No direction or coordinates specified`;
          description = 'Camera pan (no parameters)';
        }

        return executeOrGenerate(code, description, options, 'pinepaper_camera_pan');
      }

      case 'pinepaper_camera_move_to': {
        const x = args.x as number;
        const y = args.y as number;
        const zoom = args.zoom as number;
        const duration = (args.duration as number) ?? 0.5;

        const code = `app.camera && app.camera.moveTo ? app.camera.moveTo(${x}, ${y}, ${zoom}, ${duration}) : null;`;
        return executeOrGenerate(code, `Camera move to (${x}, ${y}) at ${zoom}x zoom`, options, 'pinepaper_camera_move_to');
      }

      case 'pinepaper_camera_reset': {
        const duration = (args.duration as number) ?? 0.5;

        const code = `app.camera && app.camera.reset ? app.camera.reset(${duration}) : null;`;
        return executeOrGenerate(code, 'Reset camera to default state', options, 'pinepaper_camera_reset');
      }

      case 'pinepaper_camera_stop': {
        const code = `app.camera && app.camera.stop ? app.camera.stop() : null;`;
        return executeOrGenerate(code, 'Stop camera animation', options, 'pinepaper_camera_stop');
      }

      case 'pinepaper_camera_state': {
        const code = `app.camera && app.camera.getState ? app.camera.getState() : { zoom: 1, center: [400, 300], isAnimating: false };`;
        return executeOrGenerate(code, 'Get current camera state', options, 'pinepaper_camera_state');
      }

      // -----------------------------------------------------------------------
      // FONT TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_font_show_studio': {
        const code = `app.fontStudio && app.fontStudio.show ? app.fontStudio.show() : null;`;
        return executeOrGenerate(code, 'Opens Font Studio UI', options, 'pinepaper_font_show_studio');
      }

      case 'pinepaper_font_set_name': {
        const { name } = args as { name: string };
        const code = `app.fontStudio.setName(${JSON.stringify(name)});`;
        return executeOrGenerate(code, `Set font name to "${name}"`, options, 'pinepaper_font_set_name');
      }

      case 'pinepaper_font_get_required_chars': {
        const { set } = args as { set?: string };
        const setArg = set ? JSON.stringify(set) : '"minimum"';
        const code = `app.fontStudio.getRequiredChars(${setArg});`;
        return executeOrGenerate(code, `Get required characters (${set || 'minimum'} set)`, options, 'pinepaper_font_get_required_chars');
      }

      case 'pinepaper_font_get_status': {
        const code = `app.fontStudio.getStatus();`;
        return executeOrGenerate(code, 'Get font completion status', options, 'pinepaper_font_get_status');
      }

      case 'pinepaper_font_create_glyph': {
        const { character, pathId } = args as { character: string; pathId: string };
        const code = `app.fontStudio.createGlyph(${JSON.stringify(character)}, ${JSON.stringify(pathId)});`;
        return executeOrGenerate(code, `Create glyph for "${character}" from path ${pathId}`, options, 'pinepaper_font_create_glyph');
      }

      case 'pinepaper_font_create_space': {
        const { width } = args as { width?: number };
        const code = width !== undefined
          ? `app.fontStudio.createSpace(${width});`
          : `app.fontStudio.createSpace();`;
        return executeOrGenerate(code, `Create space glyph${width ? ` (width: ${width})` : ''}`, options, 'pinepaper_font_create_space');
      }

      case 'pinepaper_font_remove_glyph': {
        const { character } = args as { character: string };
        const code = `app.fontStudio.removeGlyph(${JSON.stringify(character)});`;
        return executeOrGenerate(code, `Remove glyph for "${character}"`, options, 'pinepaper_font_remove_glyph');
      }

      case 'pinepaper_font_set_metrics': {
        const metrics = args as { unitsPerEm?: number; ascender?: number; descender?: number; xHeight?: number; capHeight?: number };
        const code = `app.fontStudio.setMetrics(${JSON.stringify(metrics)});`;
        return executeOrGenerate(code, 'Set font metrics', options, 'pinepaper_font_set_metrics');
      }

      case 'pinepaper_font_export': {
        const { download } = args as { download?: boolean };
        const code = download === false
          ? `app.fontStudio.export({ download: false });`
          : `app.fontStudio.export();`;
        return executeOrGenerate(code, 'Export font as OTF', options, 'pinepaper_font_export');
      }

      case 'pinepaper_font_load_into_document': {
        const code = `app.fontStudio.loadIntoDocument();`;
        return executeOrGenerate(code, 'Load font into document', options, 'pinepaper_font_load_into_document');
      }

      case 'pinepaper_font_export_data': {
        const { download } = args as { download?: boolean };
        const code = download === false
          ? `app.fontStudio.exportData({ download: false });`
          : `app.fontStudio.exportData();`;
        return executeOrGenerate(code, 'Export font data as JSON', options, 'pinepaper_font_export_data');
      }

      case 'pinepaper_font_import_data': {
        const { data } = args as { data: object };
        const code = `app.fontStudio.importData(${JSON.stringify(data)});`;
        return executeOrGenerate(code, 'Import font data from JSON', options, 'pinepaper_font_import_data');
      }

      case 'pinepaper_font_clear': {
        const code = `app.fontStudio.clear();`;
        return executeOrGenerate(code, 'Clear all glyphs and reset font', options, 'pinepaper_font_clear');
      }

      case 'pinepaper_font_remove_overlap': {
        const { pathId } = args as { pathId: string };
        const code = `app.fontStudio.removeOverlap(${JSON.stringify(pathId)});`;
        return executeOrGenerate(code, `Remove overlaps from path ${pathId}`, options, 'pinepaper_font_remove_overlap');
      }

      case 'pinepaper_font_correct_direction': {
        const { pathId } = args as { pathId: string };
        const code = `app.fontStudio.correctDirection(${JSON.stringify(pathId)});`;
        return executeOrGenerate(code, `Correct path direction for ${pathId}`, options, 'pinepaper_font_correct_direction');
      }

      case 'pinepaper_font_cleanup_path': {
        const { pathId, removeOverlap, correctDirection, smooth, smoothTolerance } = args as {
          pathId: string;
          removeOverlap?: boolean;
          correctDirection?: boolean;
          smooth?: boolean;
          smoothTolerance?: number;
        };
        const optsObj: Record<string, unknown> = {};
        if (removeOverlap !== undefined) optsObj.removeOverlap = removeOverlap;
        if (correctDirection !== undefined) optsObj.correctDirection = correctDirection;
        if (smooth !== undefined) optsObj.smooth = smooth;
        if (smoothTolerance !== undefined) optsObj.smoothTolerance = smoothTolerance;
        const hasOpts = Object.keys(optsObj).length > 0;
        const code = hasOpts
          ? `app.fontStudio.cleanupPath(${JSON.stringify(pathId)}, ${JSON.stringify(optsObj)});`
          : `app.fontStudio.cleanupPath(${JSON.stringify(pathId)});`;
        return executeOrGenerate(code, `Cleanup path ${pathId}`, options, 'pinepaper_font_cleanup_path');
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
            ErrorCodes.BROWSER_NOT_CONNECTED,
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
            ErrorCodes.REFRESH_FAILED,
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

      case 'pinepaper_import_mermaid': {
        const input = ImportMermaidInputSchema.parse(args);
        const code = codeGenerator.generateImportMermaid(input.mermaidText, {
          autoLayout: input.autoLayout,
          clearExisting: input.clearExisting,
        });
        const description = 'Imports a Mermaid diagram onto the canvas';
        return executeOrGenerate(code, description, options, 'pinepaper_import_mermaid');
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

      case 'pinepaper_export_scene': {
        const code = codeGenerator.generateExportScene();
        return executeOrGenerate(code, 'Exports complete scene state', options, 'pinepaper_export_scene');
      }

      // -----------------------------------------------------------------------
      // BROWSER CONTROL TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_browser_connect': {
        // Default to headless: false — if you explicitly call browser_connect, you likely want to see it
        const headless = (args.headless as boolean) ?? false;

        const controller = getBrowserController({ headless });

        // Already connected with same headless mode → nothing to do
        if (controller.connected && controller.isHeadless === headless) {
          return {
            content: [{ type: 'text', text: `Already connected to PinePaper Studio (headless: ${headless}).` }],
          };
        }

        // Already connected but different headless mode → reconnect
        if (controller.connected && controller.isHeadless !== headless) {
          await resetBrowserController();
        }

        try {
          const newController = controller.connected ? controller : getBrowserController({ headless });
          if (!newController.connected) await newController.connect();

          const canvasSizeResult = await newController.executeCode(
            `const size = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 }; ({ width: size.width || 800, height: size.height || 600 });`,
            false
          );
          const canvasSize = canvasSizeResult.success
            ? (canvasSizeResult.result as { width: number; height: number })
            : { width: 800, height: 600 };

          return {
            content: [{ type: 'text', text: `Connected to PinePaper Studio (headless: ${headless}, canvas: ${canvasSize.width}x${canvasSize.height}).` }],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to connect';
          return {
            content: [{ type: 'text', text: `Browser connection failed: ${errorMessage}` }],
          };
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
            ErrorCodes.BROWSER_NOT_CONNECTED,
            'Not connected to PinePaper Studio. Call pinepaper_browser_connect first.'
          );
        }

        const screenshot = await controller.takeScreenshot();

        if (!screenshot) {
          // Capture canvas state for debugging
          const canvasState = await captureCanvasState(controller);

          return errorResult(
            ErrorCodes.SCREENSHOT_FAILED,
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
                  studioUrl: controller.actualUrl,
                  agentMode: controller.agentMode,
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
      // DIAGNOSTIC REPORT
      // -----------------------------------------------------------------------
      case 'pinepaper_diagnostic_report': {
        const input = DiagnosticReportInputSchema.parse(args);
        const includeMetrics = input.includeMetrics !== false;
        const includeCanvas = input.includeCanvas !== false;
        const metricsLimit = input.metricsLimit ?? 100;

        // --- Server info ---
        const { detectToolkitFromEnvironment: detectToolkit, detectVerbosityFromEnvironment: detectVerbosity } = await import('./toolkits.js');
        const serverSection = {
          version: '1.5.1',
          toolkit: detectToolkit(),
          verbosity: detectVerbosity(),
          locale: process.env.PINEPAPER_LOCALE || 'en',
          executionMode: options.executionMode || getExecutionMode(),
          screenshotMode: options.screenshotMode || getScreenshotMode(),
        };

        // --- Browser state ---
        let browserSection: Record<string, unknown> = { connected: false };
        try {
          const ctrl = options.browserController || getBrowserController();
          browserSection = {
            connected: ctrl.connected,
            agentMode: ctrl.agentMode,
            studioUrl: ctrl.studioUrl,
          };
        } catch { /* browser not initialized */ }

        // --- Session state ---
        let sessionSection: Record<string, unknown> = {};
        try {
          const session = getSessionManager();
          sessionSection = session.getStats();
        } catch { /* session not initialized */ }

        // --- Canvas state ---
        let canvasSection: Record<string, unknown> | null = null;
        if (includeCanvas) {
          try {
            const ctrl = options.browserController || getBrowserController();
            if (ctrl.connected) {
              canvasSection = await captureCanvasState(ctrl) as Record<string, unknown> | null;
            }
          } catch { /* canvas capture failed */ }
        }

        // --- Performance metrics ---
        let metricsSection: Record<string, unknown> | null = null;
        if (includeMetrics) {
          try {
            const perfTracker = getPerformanceTracker();
            const recentMetrics = perfTracker.exportMetrics('json' as MetricsExportFormat, { limit: metricsLimit });
            const stats = perfTracker.getStats();
            metricsSection = { entries: recentMetrics, stats };
          } catch { /* metrics not available */ }
        }

        // --- Tool definitions overhead (fixed cost per API turn) ---
        let toolDefsSection: Record<string, unknown> | null = null;
        try {
          const { PINEPAPER_TOOLS, getToolsForVerbosity } = await import('./definitions.js');
          const { getToolsForToolkit } = await import('./toolkits.js');

          const toolkit = detectToolkit();
          const verbosity = detectVerbosity();

          // Measure what actually gets sent to the LLM
          const activeTools = getToolsForToolkit(getToolsForVerbosity(verbosity), toolkit);

          const activeJson = JSON.stringify(activeTools);
          const activeBytes = Buffer.byteLength(activeJson, 'utf-8');
          const activeTokens = Math.ceil(activeBytes / 4);

          // Also measure full set for comparison
          const fullJson = JSON.stringify(PINEPAPER_TOOLS);
          const fullBytes = Buffer.byteLength(fullJson, 'utf-8');
          const fullTokens = Math.ceil(fullBytes / 4);

          // Measure other profiles for comparison recommendations
          const agentCompactTools = getToolsForToolkit(getToolsForVerbosity('compact'), 'agent');
          const agentCompactTokens = Math.ceil(Buffer.byteLength(JSON.stringify(agentCompactTools), 'utf-8') / 4);

          const agentMinimalTools = getToolsForToolkit(getToolsForVerbosity('minimal'), 'agent');
          const agentMinimalTokens = Math.ceil(Buffer.byteLength(JSON.stringify(agentMinimalTools), 'utf-8') / 4);

          // Per-tool breakdown of active set (top 10 heaviest)
          const perToolDef = activeTools.map((t: { name: string; description?: string; inputSchema?: unknown }) => ({
            tool: t.name,
            bytes: Buffer.byteLength(JSON.stringify(t), 'utf-8'),
            descBytes: Buffer.byteLength(t.description || '', 'utf-8'),
          })).sort((a: { bytes: number }, b: { bytes: number }) => b.bytes - a.bytes);

          const totalDescBytes = perToolDef.reduce((s: number, t: { descBytes: number }) => s + t.descBytes, 0);

          toolDefsSection = {
            toolkit,
            verbosity,
            activeToolCount: activeTools.length,
            activeBytes,
            activeTokens,
            fullToolCount: PINEPAPER_TOOLS.length,
            fullBytes,
            fullTokens,
            descriptionBytes: totalDescBytes,
            descriptionPct: ((totalDescBytes / activeBytes) * 100).toFixed(1) + '%',
            top10: perToolDef.slice(0, 10).map((t: { tool: string; bytes: number }) => ({
              tool: t.tool,
              bytes: t.bytes,
              tokens: Math.ceil(t.bytes / 4),
            })),
            profiles: {
              'full+verbose': fullTokens,
              'agent+compact': agentCompactTokens,
              'agent+minimal': agentMinimalTokens,
            },
            recommendations: [] as string[],
          };

          // Add actionable recommendations
          const recs = toolDefsSection.recommendations as string[];
          if (toolkit === 'full') {
            recs.push(`Switch to PINEPAPER_TOOLKIT=agent to reduce to ~${agentCompactTokens.toLocaleString()} tokens/turn (agent+compact)`);
          }
          if (verbosity === 'verbose') {
            recs.push(`Set PINEPAPER_VERBOSITY=compact to reduce tool definitions overhead`);
          }
          if (verbosity !== 'minimal') {
            recs.push(`Set PINEPAPER_VERBOSITY=minimal for maximum savings (~${agentMinimalTokens.toLocaleString()} tokens with agent toolkit) — use pinepaper_tool_guide for on-demand docs`);
          }
          if (activeTokens > 20000) {
            recs.push(`Tool definitions alone consume ~${activeTokens.toLocaleString()} tokens per API turn — this is a major context budget item`);
          }
        } catch { /* definitions not available */ }

        // --- Token usage estimate (response payloads) ---
        let tokenSection: Record<string, unknown> | null = null;
        try {
          const perfTracker = getPerformanceTracker();
          const responseSizeMetrics = perfTracker.getMetrics({ phase: 'response_size' as any });

          // Aggregate per-tool response sizes
          const perTool = new Map<string, { calls: number; totalBytes: number }>();
          let totalResponseBytes = 0;

          for (const m of responseSizeMetrics) {
            const bytes = m.responseBytes ?? 0;
            totalResponseBytes += bytes;
            const entry = perTool.get(m.toolName) ?? { calls: 0, totalBytes: 0 };
            entry.calls++;
            entry.totalBytes += bytes;
            perTool.set(m.toolName, entry);
          }

          // ~4 chars per token is a common estimate for English text
          const estimatedTokens = Math.ceil(totalResponseBytes / 4);

          // Sort by totalBytes descending
          const perToolSorted = [...perTool.entries()]
            .sort((a, b) => b[1].totalBytes - a[1].totalBytes)
            .map(([tool, data]) => ({
              tool,
              calls: data.calls,
              totalBytes: data.totalBytes,
              estimatedTokens: Math.ceil(data.totalBytes / 4),
              avgBytesPerCall: Math.round(data.totalBytes / data.calls),
            }));

          tokenSection = {
            totalToolCalls: responseSizeMetrics.length,
            totalResponseBytes,
            estimatedResponseTokens: estimatedTokens,
            perTool: perToolSorted,
          };
        } catch { /* metrics not available */ }

        // --- Assemble report ---
        const report = {
          timestamp: new Date().toISOString(),
          server: serverSection,
          browser: browserSection,
          session: sessionSection,
          canvas: canvasSection,
          metrics: metricsSection,
          toolDefinitions: toolDefsSection,
          tokenUsage: tokenSection,
        };

        // --- Save to disk ---
        const exportDir = getExportDir();
        await mkdir(exportDir, { recursive: true });
        const fileName = `pinepaper_diagnostic_${Date.now()}.json`;
        const filePath = join(exportDir, fileName);
        const jsonContent = JSON.stringify(report, null, 2);
        await writeFile(filePath, jsonContent, 'utf-8');

        // --- Build summary (token budget first — it's what matters most) ---
        const lines: string[] = [
          `Diagnostic report saved to: ${filePath}`,
          ``,
        ];

        // Token budget section — prominent at top
        if (toolDefsSection) {
          const td = toolDefsSection as {
            toolkit: string; verbosity: string; activeToolCount: number;
            activeTokens: number; activeBytes: number; fullTokens: number;
            descriptionPct: string;
            top10: { tool: string; tokens: number }[];
            recommendations: string[];
          };
          lines.push(`TOKEN BUDGET`);
          lines.push(`  Tool definitions: ~${td.activeTokens.toLocaleString()} tokens/turn (${td.activeToolCount} tools, ${(td.activeBytes / 1024).toFixed(0)} KB)`);
          lines.push(`  Descriptions are ${td.descriptionPct} of that overhead`);
          lines.push(`  Config: toolkit=${td.toolkit}, verbosity=${td.verbosity}`);

          if (tokenSection) {
            const tk = tokenSection as { totalToolCalls: number; totalResponseBytes: number; estimatedResponseTokens: number };
            lines.push(`  Response payloads: ~${tk.estimatedResponseTokens.toLocaleString()} tokens across ${tk.totalToolCalls} tool calls (${(tk.totalResponseBytes / 1024).toFixed(1)} KB)`);
            const totalPerTurn = td.activeTokens + Math.ceil(tk.estimatedResponseTokens / Math.max(tk.totalToolCalls, 1));
            lines.push(`  Estimated per-turn cost: ~${totalPerTurn.toLocaleString()} tokens (definitions + avg response)`);
          }

          // Top 3 heaviest tool definitions
          const topDefs = td.top10.slice(0, 3);
          if (topDefs.length > 0) {
            lines.push(`  Heaviest definitions: ${topDefs.map(t => `${t.tool} (~${t.tokens.toLocaleString()}t)`).join(', ')}`);
          }

          // Top 3 heaviest response consumers
          if (tokenSection) {
            const tk = tokenSection as { perTool: { tool: string; calls: number; estimatedTokens: number }[] };
            const topResp = tk.perTool.slice(0, 3);
            if (topResp.length > 0) {
              lines.push(`  Heaviest responses: ${topResp.map(t => `${t.tool} (${t.calls}x, ~${t.estimatedTokens.toLocaleString()}t)`).join(', ')}`);
            }
          }

          if (td.recommendations.length > 0) {
            lines.push(``);
            lines.push(`RECOMMENDATIONS`);
            for (const rec of td.recommendations) {
              lines.push(`  - ${rec}`);
            }
          }
          lines.push(``);
        }

        // Brief state summary
        lines.push(`Server: v${serverSection.version} | toolkit=${serverSection.toolkit} | mode=${serverSection.executionMode}`);
        lines.push(`Browser: ${browserSection.connected ? 'connected' : 'disconnected'}`);
        lines.push(`Session: ${sessionSection.activeJob ? `active job (${sessionSection.currentJobId})` : 'no active job'} | ${sessionSection.completedJobs ?? 0} completed | ${sessionSection.totalItemsCreated ?? 0} items total`);
        if (canvasSection) {
          const cs = canvasSection as Record<string, unknown>;
          lines.push(`Canvas: ${cs.itemCount ?? 0} items | ${JSON.stringify(cs.canvasSize ?? {})}`);
        }

        return {
          content: [{ type: 'text', text: lines.join('\n') }],
        };
      }

      // -----------------------------------------------------------------------
      // TOOL GUIDE (on-demand documentation)
      // -----------------------------------------------------------------------
      case 'pinepaper_tool_guide': {
        const input = ToolGuideInputSchema.parse(args);
        const { PINEPAPER_TOOLS, AI_AGENT_GUIDE } = await import('./definitions.js');
        const { TOOL_TAGS } = await import('./toolkits.js');

        // No args → full AI Agent Guide
        if (!input.tool && !input.category) {
          return {
            content: [{ type: 'text', text: AI_AGENT_GUIDE }],
          };
        }

        // Specific tool → full verbose description
        if (input.tool) {
          const tool = PINEPAPER_TOOLS.find((t: { name: string }) => t.name === input.tool);
          if (!tool) {
            return {
              content: [{ type: 'text', text: `Unknown tool: ${input.tool}. Use pinepaper_tool_guide with no args to see the AI Agent Guide.` }],
              isError: true,
            };
          }
          return {
            content: [{ type: 'text', text: `# ${tool.name}\n\n${tool.description}` }],
          };
        }

        // Category → all tools in that tag with descriptions
        if (input.category) {
          const toolNames = TOOL_TAGS[input.category];
          if (!toolNames) {
            const available = Object.keys(TOOL_TAGS).join(', ');
            return {
              content: [{ type: 'text', text: `Unknown category: ${input.category}. Available: ${available}` }],
              isError: true,
            };
          }
          const lines: string[] = [`# Category: ${input.category}\n`];
          for (const name of toolNames) {
            const tool = PINEPAPER_TOOLS.find((t: { name: string }) => t.name === name);
            if (tool) {
              lines.push(`## ${tool.name}\n${tool.description}\n`);
            }
          }
          return {
            content: [{ type: 'text', text: lines.join('\n') }],
          };
        }

        return { content: [{ type: 'text', text: AI_AGENT_GUIDE }] };
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

          // If includeSvgContent is true, fetch SVG content for each result
          let resultsWithContent: Array<{
            id: string;
            repository: string;
            title: string;
            description?: string;
            previewUrl?: string;
            license: unknown;
            tags?: string[];
            author?: string;
            svgContent?: string;
          }> = [];

          if (input.includeSvgContent) {
            // Fetch SVG content for each result in parallel
            const svgPromises = results.map(async (r) => {
              try {
                const svgContent = await assetManager.download(r.id);
                return {
                  id: r.id,
                  repository: r.repository,
                  title: r.title,
                  description: r.description,
                  previewUrl: r.previewUrl,
                  license: r.license,
                  tags: r.tags,
                  author: r.author,
                  svgContent: svgContent.svg,
                };
              } catch (downloadError) {
                // If download fails, return result without SVG content
                console.error(`[search_assets] Failed to download SVG for ${r.id}:`, downloadError);
                return {
                  id: r.id,
                  repository: r.repository,
                  title: r.title,
                  description: r.description,
                  previewUrl: r.previewUrl,
                  license: r.license,
                  tags: r.tags,
                  author: r.author,
                  svgContent: undefined,
                };
              }
            });

            resultsWithContent = await Promise.all(svgPromises);
          } else {
            // Without includeSvgContent, just map the results without SVG content
            resultsWithContent = results.map((r) => ({
              id: r.id,
              repository: r.repository,
              title: r.title,
              description: r.description,
              previewUrl: r.previewUrl,
              license: r.license,
              tags: r.tags,
              author: r.author,
            }));
          }

          // Check which results require attribution
          const requiresAttribution = resultsWithContent.filter(
            (r) => (r.license as { requiresAttribution?: boolean })?.requiresAttribution
          );

          // Build attribution notice if needed
          let attributionNotice: string | undefined;
          if (requiresAttribution.length > 0) {
            const attributionItems = requiresAttribution.map((r) => {
              const license = r.license as { type?: string; name?: string; url?: string };
              const authorInfo = r.author ? ` by ${r.author}` : '';
              return `- "${r.title}"${authorInfo} (${license.type || 'Unknown'}) from ${r.repository}`;
            });
            attributionNotice = `⚠️ ATTRIBUTION REQUIRED for ${requiresAttribution.length} asset(s):\n${attributionItems.join('\n')}\n\nPlease provide proper attribution when using these assets.`;
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: true,
                    query: input.query,
                    repository: input.repository || 'all',
                    count: resultsWithContent.length,
                    includeSvgContent: input.includeSvgContent || false,
                    attributionRequired: requiresAttribution.length > 0,
                    attributionNotice,
                    results: resultsWithContent,
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
      // DIAGRAM TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_create_diagram_shape': {
        const input = CreateDiagramShapeInputSchema.parse(args);
        const code = codeGenerator.generateCreateDiagramShape(input);
        const description = `Creates ${input.shapeType} diagram shape${input.label ? ` with label "${input.label}"` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_diagram_shape');
      }

      case 'pinepaper_connect': {
        const input = ConnectInputSchema.parse(args);
        const code = codeGenerator.generateConnect(input);
        const description = `Connects ${input.sourceItemId} → ${input.targetItemId} with ${input.routing || 'orthogonal'} routing`;
        return executeOrGenerate(code, description, options, 'pinepaper_connect');
      }

      case 'pinepaper_connect_ports': {
        const input = ConnectPortsInputSchema.parse(args);
        const code = codeGenerator.generateConnectPorts(input);
        const description = `Connects ${input.sourceItemId}:${input.sourcePort} → ${input.targetItemId}:${input.targetPort}`;
        return executeOrGenerate(code, description, options, 'pinepaper_connect_ports');
      }

      case 'pinepaper_add_ports': {
        const input = AddPortsInputSchema.parse(args);
        const code = codeGenerator.generateAddPorts(input);
        const description = `Adds ${input.portType || 'standard'} ports to ${input.itemId}`;
        return executeOrGenerate(code, description, options, 'pinepaper_add_ports');
      }

      case 'pinepaper_auto_layout': {
        const input = AutoLayoutInputSchema.parse(args);
        const code = codeGenerator.generateAutoLayout(input);
        const description = `Applies ${input.layoutType} auto-layout to diagram items`;
        return executeOrGenerate(code, description, options, 'pinepaper_auto_layout');
      }

      case 'pinepaper_get_diagram_shapes': {
        const input = GetDiagramShapesInputSchema.parse(args);
        const code = codeGenerator.generateGetDiagramShapes(input);
        const description = `Gets available diagram shapes${input.category ? ` in category "${input.category}"` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_get_diagram_shapes');
      }

      case 'pinepaper_update_connector': {
        const input = UpdateConnectorInputSchema.parse(args);
        const code = codeGenerator.generateUpdateConnector(input);
        const description = `Updates connector ${input.connectorId}`;
        return executeOrGenerate(code, description, options, 'pinepaper_update_connector');
      }

      case 'pinepaper_remove_connector': {
        const input = RemoveConnectorInputSchema.parse(args);
        const code = codeGenerator.generateRemoveConnector(input);
        const description = `Removes connector ${input.connectorId}`;
        return executeOrGenerate(code, description, options, 'pinepaper_remove_connector');
      }

      case 'pinepaper_diagram_mode': {
        const input = DiagramModeInputSchema.parse(args);
        const code = codeGenerator.generateDiagramMode(input);
        const description = `Diagram mode: ${input.action}${input.mode ? ` (${input.mode})` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_diagram_mode');
      }

      // -----------------------------------------------------------------------
      // AGENT FLOW MODE TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_agent_start_job': {
        const input = AgentStartJobInputSchema.parse(args);

        // Guard against pipeline restarts — warn loudly if a job is already active
        const session = getSessionManager();
        if (session.hasActiveJob()) {
          const currentJob = session.getCurrentJob();
          const itemCount = currentJob?.itemsCreated.length ?? 0;
          if (itemCount > 0) {
            // Job has items — this is almost certainly a pipeline restart bug
            console.error(`[PinePaper] WARNING: Starting new job while ${itemCount} items exist from active job ${currentJob?.jobId}`);
            const code = codeGenerator.generateAgentStartJob(input);
            const result = await executeOrGenerate(code, `Restarted job (previous had ${itemCount} items)`, options, 'pinepaper_agent_start_job');
            // Prepend a strong warning to the result text
            if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
              result.content[0].text = `⚠️ WARNING: A job was already active with ${itemCount} items created. Starting a new job will create DUPLICATE items on the canvas. If you already created items, do NOT recreate them — continue from where you left off or call pinepaper_agent_end_job instead.\n\n${result.content[0].text}`;
            }
            return result;
          }
        }

        const code = codeGenerator.generateAgentStartJob(input);
        const descriptionText = `Started agent job${input.name ? ` "${input.name}"` : ''} with ${input.screenshotPolicy || 'on_complete'} screenshot policy`;
        const result = await executeOrGenerate(code, descriptionText, options, 'pinepaper_agent_start_job');

        // Append a 1-line workflow hint
        if (result.content && result.content.length > 0 && result.content[0].type === 'text') {
          result.content[0].text += `\n\nNEXT: Call batch_execute with all operations, then end_job.`;
        }
        return result;
      }

      case 'pinepaper_agent_end_job': {
        const input = AgentEndJobInputSchema.parse(args);
        const code = codeGenerator.generateAgentEndJob(input);
        const description = 'Ended agent job with summary and recommendations';

        // In code mode or non-browser mode, return as usual
        const endJobExecMode = options.executionMode ?? getExecutionMode();
        if (endJobExecMode === 'code' || !options.executeInBrowser) {
          return executeOrGenerate(code, description, options, 'pinepaper_agent_end_job');
        }

        // Execute in browser and intercept result to save large screenshots to disk
        const endJobController = options.browserController || getBrowserController();
        if (!endJobController.connected) {
          return executeOrGenerate(code, description, options, 'pinepaper_agent_end_job');
        }

        // Auto-start agent session if not active
        const endJobSessionMgr = getSessionManager();
        if (!endJobSessionMgr.hasActiveJob()) {
          endJobSessionMgr.startJob({ name: 'auto_session', screenshotPolicy: 'on_complete' });
        }

        const endJobBrowserResult = await endJobController.executeCode(code, false);

        if (!endJobBrowserResult.success) {
          const canvasState = await captureCanvasState(endJobController);
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            endJobBrowserResult.error || 'End job failed',
            { code },
            { toolName: 'pinepaper_agent_end_job', canvasState: canvasState || undefined }
          );
        }

        const endJobResult = endJobBrowserResult.result as Record<string, any>;

        // Check if result contains a large screenshot data URL
        if (endJobResult?.screenshot && typeof endJobResult.screenshot === 'string' && endJobResult.screenshot.length > SAVE_THRESHOLD_BYTES) {
          try {
            const { filePath, fileSize } = await saveExportToFile(endJobResult.screenshot, 'png', 'screenshot');
            const cleanResult = { ...endJobResult, screenshot: undefined, screenshotPath: filePath, screenshotSize: fileSize };

            // Take a smaller Puppeteer viewport screenshot to show the user inline
            const previewScreenshot = await endJobController.takeScreenshot();

            const content: (TextContent | ImageContent)[] = [{
              type: 'text' as const,
              text: `Executed PinePaper code:\n\n\`\`\`javascript\n${code}\n\`\`\`\n\nFull screenshot saved to: ${filePath} (${(fileSize / 1024).toFixed(1)} KB)\n\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
            }];

            if (previewScreenshot) {
              content.push({
                type: 'image' as const,
                data: previewScreenshot,
                mimeType: 'image/png',
              } as ImageContent);
            }

            return { content };
          } catch (saveError) {
            console.error('[PinePaper] Failed to save end_job screenshot to file:', saveError);
            // Fall through to inline result but strip the screenshot to avoid oversized response
            const strippedResult = { ...endJobResult, screenshot: '[screenshot too large for inline — save failed]' };
            return executedResult(code, strippedResult, undefined, description);
          }
        }

        return executedResult(code, endJobResult, endJobBrowserResult.screenshot, description);
      }

      case 'pinepaper_agent_reset': {
        const input = AgentResetInputSchema.parse(args);
        const code = codeGenerator.generateAgentReset(input);
        const description = `Fast canvas reset${input.canvasPreset ? ` to ${input.canvasPreset} preset` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_agent_reset');
      }

      case 'pinepaper_agent_batch_execute': {
        const input = AgentBatchExecuteInputSchema.parse(args);
        const code = codeGenerator.generateAgentBatchExecute(input);
        const description = `Batch executed ${input.operations.length} operations${input.atomic !== false ? ' (atomic)' : ''}`;

        // Check for out-of-bounds items before execution
        let boundsWarning = '';
        const sizeOp = input.operations.find((op: any) => op.type === 'set_canvas_size');
        if (sizeOp) {
          const cw = (sizeOp as any).width || 1920;
          const ch = (sizeOp as any).height || 1080;
          const oobItems: string[] = [];
          input.operations.forEach((op: any, idx: number) => {
            if (op.type === 'create' && op.position) {
              const { x, y } = op.position;
              if (x < 0 || y < 0 || x > cw || y > ch) {
                oobItems.push(`op[${idx}] ${op.itemType || 'item'} at (${x},${y})`);
              }
            }
          });
          if (oobItems.length > 0) {
            boundsWarning = `\n\nWARNING: ${oobItems.length} item(s) positioned outside canvas bounds (${cw}x${ch}): ${oobItems.join(', ')}. Items may be clipped or invisible.`;
          }
        }

        const batchResult = await executeOrGenerate(code, description, options, 'pinepaper_agent_batch_execute');

        // Append bounds warning if any
        if (boundsWarning && batchResult.content && batchResult.content.length > 0) {
          const firstContent = batchResult.content[0] as TextContent;
          if (firstContent.type === 'text') {
            firstContent.text += boundsWarning;
          }
        }

        return batchResult;
      }

      case 'pinepaper_agent_export': {
        const input = AgentExportInputSchema.parse(args);
        const code = codeGenerator.generateAgentExport(input);
        const description = `Smart export for ${input.platform} as ${input.format || 'auto'}`;

        // In code mode, return generated code as usual
        const effectiveExecMode = options.executionMode ?? getExecutionMode();
        if (effectiveExecMode === 'code' || !options.executeInBrowser) {
          return executeOrGenerate(code, description, options, 'pinepaper_agent_export');
        }

        // Execute in browser and intercept result for file saving
        const controller = options.browserController || getBrowserController();

        // Auto-connect if needed
        if (!controller.connected) {
          console.error('[PinePaper] Auto-connecting browser for export...');
          try {
            await controller.connect();
          } catch (connectError) {
            // Fall back to executeOrGenerate which handles the fallback gracefully
            return executeOrGenerate(code, description, options, 'pinepaper_agent_export');
          }
        }

        // Auto-start agent session if not active
        const exportSessionManager = getSessionManager();
        if (!exportSessionManager.hasActiveJob()) {
          exportSessionManager.startJob({ name: 'auto_session', screenshotPolicy: 'on_complete' });
        }

        const exportBrowserResult = await controller.executeCode(code, false);

        if (!exportBrowserResult.success) {
          const canvasState = await captureCanvasState(controller);
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            exportBrowserResult.error || 'Export failed',
            { code },
            { toolName: 'pinepaper_agent_export', canvasState: canvasState || undefined }
          );
        }

        const exportResult = exportBrowserResult.result as Record<string, any>;
        const format = exportResult?.format || input.format || 'png';
        const data = exportResult?.data;

        const shouldSaveToFile = data && typeof data === 'string' && (
          ALWAYS_SAVE_FORMATS.has(format) ||
          data.length > SAVE_THRESHOLD_BYTES
        );

        if (shouldSaveToFile) {
          try {
            const { filePath, fileSize } = await saveExportToFile(data, format, input.platform || 'auto');
            const cleanResult = { ...exportResult, data: undefined, filePath, fileSize };
            return {
              content: [{
                type: 'text' as const,
                text: `Export saved to file:\n\nFile: ${filePath}\nFormat: ${format}\nSize: ${(fileSize / 1024).toFixed(1)} KB\nPlatform: ${input.platform}\n\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
              }],
            };
          } catch (saveError) {
            console.error('[PinePaper] Failed to save export to file:', saveError);
            // Strip the massive data to prevent oversized response
            const strippedResult = { ...exportResult, data: `[${format} export data — file save failed: ${saveError instanceof Error ? saveError.message : 'unknown error'}]` };
            return executedResult(code, strippedResult, exportBrowserResult.screenshot, description);
          }
        }

        // Small export — return inline (existing behavior)
        return executedResult(code, exportResult, exportBrowserResult.screenshot, description);
      }

      case 'pinepaper_agent_analyze': {
        const input = AgentAnalyzeInputSchema.parse(args);
        const code = codeGenerator.generateAgentAnalyze(input);
        const description = 'Analyzed canvas content for export recommendations';
        return executeOrGenerate(code, description, options, 'pinepaper_agent_analyze');
      }

      // -----------------------------------------------------------------------
      // INTERACTIVE TRIGGER TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_add_trigger': {
        const input = AddTriggerInputSchema.parse(args);
        const code = codeGenerator.generateAddTrigger(input);
        const description = `Added ${input.event} trigger to ${input.itemId} with ${input.actions.length} actions`;
        return executeOrGenerate(code, description, options, 'pinepaper_add_trigger');
      }

      case 'pinepaper_remove_trigger': {
        const input = RemoveTriggerInputSchema.parse(args);
        const code = codeGenerator.generateRemoveTrigger(input);
        const description = input.removeAll
          ? `Removed all triggers from ${input.itemId}`
          : `Removed ${input.event} trigger from ${input.itemId}`;
        return executeOrGenerate(code, description, options, 'pinepaper_remove_trigger');
      }

      case 'pinepaper_query_triggers': {
        const input = QueryTriggersInputSchema.parse(args);
        const code = codeGenerator.generateQueryTriggers(input);
        const description = input.itemId
          ? `Queried triggers for ${input.itemId}`
          : 'Queried all triggers on canvas';
        return executeOrGenerate(code, description, options, 'pinepaper_query_triggers');
      }

      // -----------------------------------------------------------------------
      // QUIZ/LMS TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_create_quiz': {
        const input = CreateQuizInputSchema.parse(args);
        const code = codeGenerator.generateCreateQuiz(input);
        const description = `Created quiz${input.title ? ` "${input.title}"` : ''} with ${input.questions.length} questions`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_quiz');
      }

      case 'pinepaper_get_quiz_state': {
        const input = GetQuizStateInputSchema.parse(args);
        const code = codeGenerator.generateGetQuizState(input);
        const description = input.quizId
          ? `Got state for quiz ${input.quizId}`
          : 'Got state for active quiz';
        return executeOrGenerate(code, description, options, 'pinepaper_get_quiz_state');
      }

      case 'pinepaper_reset_quiz': {
        const input = ResetQuizInputSchema.parse(args);
        const code = codeGenerator.generateResetQuiz(input);
        const description = input.quizId
          ? `Reset quiz ${input.quizId}`
          : 'Reset active quiz';
        return executeOrGenerate(code, description, options, 'pinepaper_reset_quiz');
      }

      // -----------------------------------------------------------------------
      // LETTER COLLAGE TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_create_letter_collage': {
        const input = CreateLetterCollageInputSchema.parse(args);
        const code = codeGenerator.generateCreateLetterCollage(input);
        const description = `Created ${input.style || 'tile'} letter collage: "${input.text}"`;
        return executeOrGenerate(code, description, options, 'pinepaper_create_letter_collage');
      }

      case 'pinepaper_animate_letter_collage': {
        const input = AnimateLetterCollageInputSchema.parse(args);
        const code = codeGenerator.generateAnimateLetterCollage(input);
        const description = `Animated collage ${input.collageId} with ${input.animationType}`;
        return executeOrGenerate(code, description, options, 'pinepaper_animate_letter_collage');
      }

      case 'pinepaper_get_letter_collage_options': {
        const code = codeGenerator.generateGetLetterCollageOptions();
        return executeOrGenerate(code, 'Gets available letter collage styles and palettes', options, 'pinepaper_get_letter_collage_options');
      }

      // -----------------------------------------------------------------------
      // CANVAS PRESETS TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_get_canvas_presets': {
        const code = codeGenerator.generateGetCanvasPresets();
        return executeOrGenerate(code, 'Gets all available canvas presets', options, 'pinepaper_get_canvas_presets');
      }

      // -----------------------------------------------------------------------
      // MAP TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_load_map': {
        const input = LoadMapInputSchema.parse(args);
        const code = codeGenerator.generateLoadMap(input);
        const description = `Loads ${input.mapId} map with ${input.projection || 'default'} projection`;
        return executeOrGenerate(code, description, options, 'pinepaper_load_map');
      }

      case 'pinepaper_highlight_regions': {
        const input = HighlightRegionsInputSchema.parse(args);
        const code = codeGenerator.generateHighlightRegions(input);
        const description = `Highlights ${input.regionIds.length} region(s) on the map`;
        return executeOrGenerate(code, description, options, 'pinepaper_highlight_regions');
      }

      case 'pinepaper_unhighlight_regions': {
        const input = UnhighlightRegionsInputSchema.parse(args);
        const code = codeGenerator.generateUnhighlightRegions(input);
        return executeOrGenerate(code, 'Removes region highlights', options, 'pinepaper_unhighlight_regions');
      }

      case 'pinepaper_apply_data_colors': {
        const input = ApplyDataColorsInputSchema.parse(args);
        const code = codeGenerator.generateApplyDataColors(input);
        const regionCount = Object.keys(input.data).length;
        const description = `Applies choropleth coloring to ${regionCount} region(s)`;
        return executeOrGenerate(code, description, options, 'pinepaper_apply_data_colors');
      }

      case 'pinepaper_add_marker': {
        const input = AddMarkerInputSchema.parse(args);
        const code = codeGenerator.generateAddMarker(input);
        const description = `Adds marker at [${input.lat}, ${input.lon}]${input.label ? `: ${input.label}` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_add_marker');
      }

      case 'pinepaper_add_map_labels': {
        const input = AddMapLabelsInputSchema.parse(args);
        const code = codeGenerator.generateAddMapLabels(input);
        return executeOrGenerate(code, 'Adds labels to map regions', options, 'pinepaper_add_map_labels');
      }

      case 'pinepaper_pan_map': {
        const input = PanMapInputSchema.parse(args);
        const code = codeGenerator.generatePanMap(input);
        const description = `Pans map to [${input.lat}, ${input.lon}]`;
        return executeOrGenerate(code, description, options, 'pinepaper_pan_map');
      }

      case 'pinepaper_zoom_map': {
        const input = ZoomMapInputSchema.parse(args);
        const code = codeGenerator.generateZoomMap(input);
        const description = `Sets map zoom level to ${input.level}`;
        return executeOrGenerate(code, description, options, 'pinepaper_zoom_map');
      }

      case 'pinepaper_export_map': {
        const code = codeGenerator.generateExportMap();
        return executeOrGenerate(code, 'Exports map configuration', options, 'pinepaper_export_map');
      }

      case 'pinepaper_import_custom_map': {
        const input = ImportCustomMapInputSchema.parse(args);
        const code = codeGenerator.generateImportCustomMap(input);
        const description = input.url ? `Imports custom map from URL` : 'Imports custom GeoJSON map';
        return executeOrGenerate(code, description, options, 'pinepaper_import_custom_map');
      }

      case 'pinepaper_get_region_at_point': {
        const input = GetRegionAtPointInputSchema.parse(args);
        const code = codeGenerator.generateGetRegionAtPoint(input);
        const description = `Gets region at point [${input.x}, ${input.y}]`;
        return executeOrGenerate(code, description, options, 'pinepaper_get_region_at_point');
      }

      // -----------------------------------------------------------------------
      // MAP ANIMATION/CSV TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_animate_map_regions': {
        const input = AnimateMapRegionsInputSchema.parse(args);
        const code = codeGenerator.generateAnimateMapRegions(input);
        const regionCount = Object.keys(input.regions).length;
        const description = `Animates ${regionCount} map region(s) over ${input.duration || 5}s`;
        return executeOrGenerate(code, description, options, 'pinepaper_animate_map_regions');
      }

      case 'pinepaper_animate_map_wave': {
        const input = AnimateMapWaveInputSchema.parse(args);
        const code = codeGenerator.generateAnimateMapWave(input);
        const description = `Creates ${input.waveDirection || 'horizontal'} wave animation`;
        return executeOrGenerate(code, description, options, 'pinepaper_animate_map_wave');
      }

      case 'pinepaper_stop_map_animations': {
        const input = StopMapAnimationsInputSchema.parse(args);
        const code = codeGenerator.generateStopMapAnimations(input);
        return executeOrGenerate(code, 'Stops map region animations', options, 'pinepaper_stop_map_animations');
      }

      case 'pinepaper_get_animated_map_regions': {
        const code = codeGenerator.generateGetAnimatedMapRegions();
        return executeOrGenerate(code, 'Gets list of animated map regions', options, 'pinepaper_get_animated_map_regions');
      }

      case 'pinepaper_export_map_region_csv': {
        const input = ExportMapRegionCSVInputSchema.parse(args);
        const code = codeGenerator.generateExportMapRegionCSV(input);
        return executeOrGenerate(code, 'Exports map region data as CSV', options, 'pinepaper_export_map_region_csv');
      }

      case 'pinepaper_import_map_region_csv': {
        const input = ImportMapRegionCSVInputSchema.parse(args);
        const code = codeGenerator.generateImportMapRegionCSV(input);
        return executeOrGenerate(code, 'Imports CSV data to update map regions', options, 'pinepaper_import_map_region_csv');
      }

      case 'pinepaper_select_map_regions': {
        const input = SelectMapRegionsInputSchema.parse(args);
        const code = codeGenerator.generateSelectMapRegions(input);
        const description = `Selects ${input.regionIds.length} map region(s)`;
        return executeOrGenerate(code, description, options, 'pinepaper_select_map_regions');
      }

      case 'pinepaper_deselect_map_regions': {
        const input = DeselectMapRegionsInputSchema.parse(args);
        const code = codeGenerator.generateDeselectMapRegions(input);
        return executeOrGenerate(code, 'Deselects map regions', options, 'pinepaper_deselect_map_regions');
      }

      case 'pinepaper_get_highlighted_map_regions': {
        const code = codeGenerator.generateGetHighlightedMapRegions();
        return executeOrGenerate(code, 'Gets list of highlighted map regions', options, 'pinepaper_get_highlighted_map_regions');
      }

      case 'pinepaper_export_map_geojson': {
        const code = codeGenerator.generateExportMapGeoJson({
          includeStyles: args.includeStyles as boolean | undefined,
          includeMetadata: args.includeMetadata as boolean | undefined,
          selectedOnly: args.selectedOnly as boolean | undefined,
          download: args.download as boolean | undefined,
          filename: args.filename as string | undefined,
        });
        return executeOrGenerate(code, 'Exports map as GeoJSON', options, 'pinepaper_export_map_geojson');
      }

      case 'pinepaper_export_original_map_geojson': {
        const code = codeGenerator.generateExportOriginalMapGeoJson({
          download: args.download as boolean | undefined,
          filename: args.filename as string | undefined,
        });
        return executeOrGenerate(code, 'Exports original map GeoJSON', options, 'pinepaper_export_original_map_geojson');
      }

      case 'pinepaper_get_map_source_info': {
        const code = codeGenerator.generateGetMapSourceInfo();
        return executeOrGenerate(code, 'Gets map source information', options, 'pinepaper_get_map_source_info');
      }

      case 'pinepaper_register_item': {
        const code = codeGenerator.generateRegisterItem({
          itemJson: args.itemJson as object,
          itemType: args.itemType as string,
          properties: args.properties as Record<string, unknown> | undefined,
        });
        return executeOrGenerate(code, 'Registers Paper.js item', options, 'pinepaper_register_item');
      }

      // -----------------------------------------------------------------------
      // TEMPLATE TOOLS
      // -----------------------------------------------------------------------

      case 'pinepaper_apply_template': {
        const parsed = ApplyTemplateInputSchema.parse(args);
        const code = codeGenerator.generateApplyTemplate(parsed);
        return executeOrGenerate(code, 'Applies template', options, 'pinepaper_apply_template');
      }

      // -----------------------------------------------------------------------
      // IMAGE IMPORT TOOLS
      // -----------------------------------------------------------------------

      case 'pinepaper_import_image': {
        const parsed = ImportImageInputSchema.parse(args);
        const code = codeGenerator.generateImportImage(parsed);
        return executeOrGenerate(code, 'Imports image', options, 'pinepaper_import_image');
      }

      // -----------------------------------------------------------------------
      // ONTOLOGY TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_analyze_design': {
        const input = AnalyzeDesignInputSchema.parse(args);
        const { DesignGraph } = await import('../ontology/index.js');
        const dg = new DesignGraph();
        const graph = dg.extractFromDefinition(input.definition as any);
        const jsonLd = dg.toJsonLd(graph);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              templateId: graph.templateId,
              templateName: graph.templateName,
              category: graph.category,
              dimensions: graph.dimensions,
              duration: graph.duration,
              nodeCount: graph.nodes.length,
              edgeCount: graph.edges.length,
              nodeTypes: Object.fromEntries(
                Object.entries(graph.fingerprint?.nodeTypeCounts || {}).sort((a, b) => b[1] - a[1])
              ),
              edgeTypes: Object.fromEntries(
                Object.entries(graph.fingerprint?.edgeTypeCounts || {}).sort((a, b) => b[1] - a[1])
              ),
              patterns: graph.patterns,
              mathFunctions: graph.mathFunctions,
              generator: graph.generator,
              semantics: graph.semantics,
              fingerprint: graph.fingerprint,
              jsonLd,
            }, null, 2),
          }],
        };
      }

      case 'pinepaper_validate_design': {
        const input = ValidateDesignInputSchema.parse(args);
        const { DesignGraph, KnowledgeGraphValidator } = await import('../ontology/index.js');
        const dg = new DesignGraph();
        const validator = new KnowledgeGraphValidator();
        const definition = input.definition as any;
        const validation = validator.validateTemplate(definition);
        let quality = null;
        if (validation.valid) {
          const graph = dg.extractFromDefinition(definition);
          quality = validator.scoreQuality(definition, graph);
        }
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              validation,
              quality,
            }, null, 2),
          }],
        };
      }

      // -----------------------------------------------------------------------
      // ONTOLOGY QUERY (read-only graph navigation)
      // -----------------------------------------------------------------------
      case 'pinepaper_query_ontology': {
        const input = QueryOntologyInputSchema.parse(args);
        const { PP_VOCABULARY, ITEM_TYPE_MAP, RELATION_TYPE_MAP } = await import('../ontology/vocabulary.js');
        const { DesignGraph } = await import('../ontology/design-graph.js');
        const dg = new DesignGraph();

        let result: unknown;
        switch (input.query) {
          case 'list_types': {
            const entries = Object.entries(PP_VOCABULARY.types);
            const filtered = entries.filter(([key, def]) => {
              if (input.category && (def as any).category !== input.category) return false;
              if (!input.includeAbstract && (def as any).abstract) return false;
              return true;
            });
            result = Object.fromEntries(filtered);
            break;
          }
          case 'list_edges': {
            const entries = Object.entries(PP_VOCABULARY.edges);
            const filtered = input.category
              ? entries.filter(([, def]) => (def as any).category === input.category)
              : entries;
            result = Object.fromEntries(filtered);
            break;
          }
          case 'list_generators': {
            const entries = Object.entries(PP_VOCABULARY.generators);
            const filtered = input.category
              ? entries.filter(([, def]) => (def as any).category === input.category)
              : entries;
            result = Object.fromEntries(filtered);
            break;
          }
          case 'list_effects': {
            result = ['sparkle', 'blast', 'smoke', 'fire', 'rain', 'snow', 'confetti', 'ripple', 'glow', 'electric'];
            break;
          }
          case 'list_patterns': {
            result = PP_VOCABULARY.patterns;
            break;
          }
          case 'list_math_functions': {
            result = PP_VOCABULARY.mathFunctions;
            break;
          }
          case 'type_hierarchy': {
            if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_hierarchy');
            result = dg.getTypeHierarchy(input.ppType);
            break;
          }
          case 'type_children': {
            if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_children');
            result = dg.getTypeChildren(input.ppType);
            break;
          }
          case 'type_properties': {
            if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for type_properties');
            result = dg.getPropertiesFor(input.ppType);
            break;
          }
          case 'animatable_properties': {
            if (!input.ppType) return errorResult(ErrorCodes.INVALID_INPUT, 'ppType is required for animatable_properties');
            result = dg.getAnimatableProperties(input.ppType);
            break;
          }
          case 'is_subtype': {
            if (!input.typeA || !input.typeB) return errorResult(ErrorCodes.INVALID_INPUT, 'typeA and typeB are required for is_subtype');
            result = { isSubtype: dg.isSubtypeOf(input.typeA, input.typeB) };
            break;
          }
          case 'edge_info': {
            const edgeName = input.relationName || input.ppType;
            if (!edgeName) return errorResult(ErrorCodes.INVALID_INPUT, 'relationName or ppType is required for edge_info');
            const ppEdge = PP_VOCABULARY.edges[edgeName] || PP_VOCABULARY.edges[RELATION_TYPE_MAP[edgeName] || ''];
            result = ppEdge || { error: `Unknown edge: ${edgeName}` };
            break;
          }
          case 'node_type': {
            if (!input.itemType) return errorResult(ErrorCodes.INVALID_INPUT, 'itemType is required for node_type');
            result = { ppType: dg.getNodeType(input.itemType) };
            break;
          }
          case 'edge_type': {
            if (!input.relationName) return errorResult(ErrorCodes.INVALID_INPUT, 'relationName is required for edge_type');
            result = { ppEdge: dg.getEdgeType(input.relationName) };
            break;
          }
          default:
            return errorResult(ErrorCodes.INVALID_INPUT, `Unknown query: ${input.query}`);
        }

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          }],
        };
      }

      // -----------------------------------------------------------------------
      // UNKNOWN TOOL
      // -----------------------------------------------------------------------
      default: {
        const message = i18n
          ? i18n.getError('unknownTool', { toolName })
          : `Unknown tool: ${toolName}`;

        return errorResult(ErrorCodes.UNKNOWN_TOOL, message, {
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
            'pinepaper_register_custom_relation',
            'pinepaper_execute_custom_code',
            'pinepaper_animate',
            'pinepaper_keyframe_animate',
            'pinepaper_play_timeline',
            'pinepaper_execute_generator',
            'pinepaper_list_generators',
            'pinepaper_apply_effect',
            'pinepaper_apply_animated_mask',
            'pinepaper_apply_custom_mask',
            'pinepaper_remove_mask',
            'pinepaper_get_animatable_properties',
            'pinepaper_get_available_easings',
            'pinepaper_get_mask_types',
            'pinepaper_get_mask_animations',
            'pinepaper_camera_animate',
            'pinepaper_camera_zoom',
            'pinepaper_camera_pan',
            'pinepaper_camera_move_to',
            'pinepaper_camera_reset',
            'pinepaper_camera_stop',
            'pinepaper_camera_state',
            'pinepaper_get_items',
            'pinepaper_get_relation_stats',
            'pinepaper_set_background_color',
            'pinepaper_set_canvas_size',
            'pinepaper_get_canvas_size',
            'pinepaper_clear_canvas',
            'pinepaper_refresh_page',
            'pinepaper_import_svg',
            'pinepaper_import_mermaid',
            'pinepaper_add_filter',
            'pinepaper_export_svg',
            'pinepaper_export_training_data',
            'pinepaper_export_scene',
            'pinepaper_browser_connect',
            'pinepaper_browser_disconnect',
            'pinepaper_browser_screenshot',
            'pinepaper_browser_status',
            'pinepaper_get_performance_metrics',
            'pinepaper_diagnostic_report',
            'pinepaper_search_assets',
            'pinepaper_import_asset',
            'pinepaper_p5_draw',
            // Diagram tools
            'pinepaper_create_diagram_shape',
            'pinepaper_connect',
            'pinepaper_connect_ports',
            'pinepaper_add_ports',
            'pinepaper_auto_layout',
            'pinepaper_get_diagram_shapes',
            'pinepaper_update_connector',
            'pinepaper_remove_connector',
            'pinepaper_diagram_mode',
            // Scene tools
            'pinepaper_create_scene',
            'pinepaper_manage_scenes',
            'pinepaper_scene_playback',
            // Agent flow mode tools
            'pinepaper_agent_start_job',
            'pinepaper_agent_end_job',
            'pinepaper_agent_reset',
            'pinepaper_agent_batch_execute',
            'pinepaper_agent_export',
            'pinepaper_agent_analyze',
            // Interactive trigger tools
            'pinepaper_add_trigger',
            'pinepaper_remove_trigger',
            'pinepaper_query_triggers',
            // Quiz/LMS tools
            'pinepaper_create_quiz',
            'pinepaper_get_quiz_state',
            'pinepaper_reset_quiz',
            // Letter collage tools
            'pinepaper_create_letter_collage',
            'pinepaper_animate_letter_collage',
            'pinepaper_get_letter_collage_options',
            // Canvas presets tools
            'pinepaper_get_canvas_presets',
            // Map tools
            'pinepaper_load_map',
            'pinepaper_highlight_regions',
            'pinepaper_unhighlight_regions',
            'pinepaper_apply_data_colors',
            'pinepaper_add_marker',
            'pinepaper_add_map_labels',
            'pinepaper_pan_map',
            'pinepaper_zoom_map',
            'pinepaper_export_map',
            'pinepaper_import_custom_map',
            'pinepaper_get_region_at_point',
            // Map animation/CSV tools
            'pinepaper_animate_map_regions',
            'pinepaper_animate_map_wave',
            'pinepaper_stop_map_animations',
            'pinepaper_get_animated_map_regions',
            'pinepaper_export_map_region_csv',
            'pinepaper_import_map_region_csv',
            'pinepaper_select_map_regions',
            'pinepaper_deselect_map_regions',
            'pinepaper_get_highlighted_map_regions',
            'pinepaper_export_map_geojson',
            'pinepaper_export_original_map_geojson',
            'pinepaper_get_map_source_info',
            // Font tools
            'pinepaper_font_show_studio',
            'pinepaper_font_set_name',
            'pinepaper_font_get_required_chars',
            'pinepaper_font_get_status',
            'pinepaper_font_create_glyph',
            'pinepaper_font_create_space',
            'pinepaper_font_remove_glyph',
            'pinepaper_font_set_metrics',
            'pinepaper_font_export',
            'pinepaper_font_load_into_document',
            'pinepaper_font_export_data',
            'pinepaper_font_import_data',
            'pinepaper_font_clear',
            'pinepaper_font_remove_overlap',
            'pinepaper_font_correct_direction',
            'pinepaper_font_cleanup_path',
            // Template tools
            'pinepaper_apply_template',
            // Image import tools
            'pinepaper_import_image',
            // Paper.js direct access tools
            'pinepaper_register_item',
            // On-demand guide & runtime config
            'pinepaper_tool_guide',
            'pinepaper_set_toolkit',
            // Ontology tools
            'pinepaper_analyze_design',
            'pinepaper_validate_design',
            'pinepaper_query_ontology',
            // Selection, transform & history tools
            'pinepaper_selection',
            'pinepaper_transform',
            'pinepaper_history',
            // Image processing tools
            'pinepaper_image_filter',
            'pinepaper_lasso',
            'pinepaper_cutout_style',
            // Composition & view tools
            'pinepaper_precomp',
            'pinepaper_view',
            'pinepaper_background',
            // Canvas query tools
            'pinepaper_query',
            // Deformation, sprite sheets, storage, interaction
            'pinepaper_deform',
            'pinepaper_sprite_sheet',
            'pinepaper_storage',
            'pinepaper_interaction',
            // Widget export
            'pinepaper_export_widget',
            'pinepaper_export_widget_html',
            // Data visualization, magic, physics, measurement
            'pinepaper_create_chart',
            'pinepaper_magic',
            'pinepaper_physics',
            'pinepaper_measurement',
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
