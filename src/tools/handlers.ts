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
  ImportMotionCaptureInputSchema,
  KeyframeAnimateInputSchema,
  ExecuteGeneratorInputSchema,
  ApplyEffectInputSchema,
  GetItemsInputSchema,
  PlayTimelineInputSchema,
  SetBackgroundColorInputSchema,
  SetCanvasSizeInputSchema,
  ImportSVGInputSchema,
  ImportMermaidInputSchema,
  AddFilterInputSchema,
  CreateGlossySphereInputSchema,
  CreateDiagonalStripesInputSchema,
  BatchCreateInputSchema,
  BatchModifyInputSchema,
  CreateGridInputSchema,
  GeometryInputSchema,
  EquationPathInputSchema,
  EventInputSchema,
  ConstructionSequenceInputSchema,
  ValidateSceneInputSchema,
  CaptureFramesInputSchema,
  InstantiateOntologyInputSchema,
  LintSceneInputSchema,
  MediaInputSchema,
  TextStyleInputSchema,
  TextEffectInputSchema,
  DesignMediumInputSchema,
  ShatterImageInputSchema,
  ImportLayeredCharacterInputSchema,
  CharacterInputSchema,
  GameInputSchema,
  World3DInputSchema,
  BrandKitInputSchema,
  ComponentInputSchema,
  ArtboardInputSchema,
  CommentInputSchema,
  ProvenanceInputSchema,
  SceneDiffInputSchema,
  AudioBeatsInputSchema,
  TemplateParamsInputSchema,
  ComposeInputSchema,
  CropImageInputSchema,
  PathOpInputSchema,
  MotionInputSchema,
  SoundInputSchema,
  InterchangeInputSchema,
  StickInputSchema,
  DesignSystemInputSchema,
  StoryInputSchema,
  ChromaKeyInputSchema,
  RiggingInputSchema,
  GroupInputSchema,
  CameraDirectorInputSchema,
  DetectObjectsInputSchema,
  ExtractObjectInputSchema,
  ArrangeInputSchema,
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
  ExportStoreInputSchema,
  AgentAnalyzeInputSchema,
  // Letter collage schemas
  CreateLetterCollageInputSchema,
  AnimateLetterCollageInputSchema,
  // Map schemas
  ApplyTemplateInputSchema,
  // Map animation/CSV schemas
  // Custom relation/code schemas
  RegisterCustomRelationInputSchema,
  ExecuteCustomCodeInputSchema,
  // Mask schemas
  ApplyAnimatedMaskInputSchema,
  ApplyCustomMaskInputSchema,
  RemoveMaskInputSchema,
  // Image import schemas
  ImportImageInputSchema,
  // Tool guide schema
  // Ontology schemas
  // Scene management schemas
  ManageScenesInputSchema,
  ScenePlaybackInputSchema,
  SceneGraphInputSchema,
  SequenceInputSchema,
  StaggerInputSchema,
  FlipInputSchema,
  // New consolidated tool schemas
  SelectionInputSchema,
  TransformInputSchema,
  HistoryInputSchema,
  ImageFilterInputSchema,
  LassoInputSchema,
  CutoutStyleInputSchema,
  PrecompInputSchema,
  BackgroundInputSchema,
  QueryInputSchema,
  QueryCapabilitiesInputSchema,
  DeformInputSchema,
  SpriteSheetInputSchema,
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
import { writeFile, mkdir, appendFile, unlink, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { I18nManager } from '../i18n/index.js';
import {
  PinePaperBrowserController,
  getBrowserController,
  resetBrowserController,
} from '../browser/puppeteer-controller.js';
import { sameStudioTarget, validateStudioUrl } from '../browser/url-target.js';
import { getPerformanceTracker, MetricsExportFormat } from '../metrics/index.js';
import { ErrorContext, formatErrorContext, captureCanvasState } from '../execution/index.js';
import { getSessionManager } from '../agent/session-manager.js';
import { vocabularyHintForPath, validateBatchVocabulary, detectBatchPropertyTypos } from '../ontology/hints.js';
import { cameraHandlers } from './handlers/camera.js';
import { fontHandlers } from './handlers/font.js';
import { toolGuideHandlers } from './handlers/tool-guide.js';
import { mapHandlers } from './handlers/maps.js';
import { ontologyHandlers } from './handlers/ontology.js';
import * as designSystems from '../design/design-systems.js';
import { exportHandlers } from './handlers/export.js';
import { planCharacter, generateCharacterCode } from './handlers/character.js';

/**
 * Registry of per-domain handler maps. Tools listed here short-circuit the
 * main switch at dispatch time (see handleToolCallInner). New domains are
 * folded in incrementally as they are migrated out of the monolithic switch.
 */
function getDomainHandlers(): Array<Record<string, (args: Record<string, unknown>, options: HandlerOptions) => Promise<CallToolResult>>> {
  return [
    cameraHandlers,
    fontHandlers,
    toolGuideHandlers,
    mapHandlers,
    ontologyHandlers,
    exportHandlers,
  ];
}

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

// wav joins them: a minute of 48kHz 16-bit is ~5.8 MB of base64 and the ten
// minutes the schema allows is ~77 MB. Deliverable across the bridge, useless
// pasted into a response.
export const ALWAYS_SAVE_FORMATS = new Set(['mp4', 'webm', 'gif', 'pdf', 'wav']);
// 500_000 was chosen against the bridge's limits, not the CALLER's. A pilot
// session hit a 263K-character end_job result — comfortably under this, so it
// was returned inline, and over the tool-result limit of the client reading
// it, so the agent could not read its own verification step. A value that
// lets a result through to be rejected downstream is the wrong value; saving
// to a file and naming the path costs one line of text and always works.
const SAVE_THRESHOLD_BYTES = 180_000; // ~180KB base64 ≈ 135KB decoded

/**
 * Governor budget for the export run itself.
 *
 * FxTool's runGenerated defaults to a 10s async-tail timeout — right for a
 * scene-building script that has no business running longer, and fatal for an
 * export, which renders frame by frame and is capped at 600s of footage. The
 * export died at ten seconds with a PP_TIMEOUT that read like a bug in the
 * scene. This raises the budget rather than bypassing the governor, so the
 * report, the item budget and the seeded PRNG all survive.
 *
 * PINEPAPER_EXPORT_TIMEOUT overrides it. The default matches the floor put on
 * CDP's own per-call timeout (MIN_PROTOCOL_TIMEOUT_MS in
 * puppeteer-controller.ts), so raising this past the default without also
 * raising PINEPAPER_TIMEOUT just moves the execution to a protocol error —
 * which is why that case says so out loud rather than failing obscurely later.
 */
const EXPORT_GOVERNOR_DEFAULT_MS = 300_000;

function exportGovernorTimeoutMs(): number {
  const raw = Number(process.env.PINEPAPER_EXPORT_TIMEOUT);
  if (!Number.isFinite(raw) || raw <= 0) return EXPORT_GOVERNOR_DEFAULT_MS;
  const protocolFloor = Math.max(Number(process.env.PINEPAPER_TIMEOUT) || 0, EXPORT_GOVERNOR_DEFAULT_MS);
  if (raw > protocolFloor) {
    console.error(
      `[PinePaper] PINEPAPER_EXPORT_TIMEOUT=${raw}ms is above the browser's protocol timeout (${protocolFloor}ms) — ` +
      'raise PINEPAPER_TIMEOUT to match, or an export past that point fails as a protocol error rather than a governor timeout.',
    );
  }
  return raw;
}

/**
 * Turn whatever the caller named into something the page can load.
 *
 * http(s) and data URLs pass straight through — the page fetches those itself,
 * and it reports the reason when it cannot. A LOCAL PATH is read here, because
 * a browser page cannot open file:// and refusing it outright left an agent
 * holding images it could not import with nothing to try instead.
 *
 * Bounded deliberately: an image extension, an existing regular file, and a
 * size cap. This reads the user's disk on their instruction, the same as the
 * export side writes to it, and neither should be a wildcard.
 */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.avif']);
const MAX_LOCAL_IMAGE_BYTES = 32 * 1024 * 1024;
const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.bmp': 'image/bmp', '.avif': 'image/avif',
};

/**
 * THE PAGE CANNOT FETCH A THIRD-PARTY IMAGE. THIS PROCESS CAN.
 *
 * pinepaper.studio serves `connect-src 'self' https://cloud.pinepaper.studio`,
 * so an in-page fetch() of ANY other host fails outright. `img-src` still
 * allows https:, which is why the old path could LOAD a remote image — and
 * tainted the canvas doing it, killing every later export. The taint fix
 * replaced that load with a fetch, which is safe and, under this CSP, can
 * never succeed: import by URL stopped being broken-and-dangerous and became
 * simply impossible.
 *
 * Node has no CSP. Fetching here and handing the page a data: URL is the only
 * shape that both works and cannot taint, so a URL is resolved BEFORE it
 * reaches the browser. Verified end to end by the session that found it: a
 * 157KB data: URL imports and exports cleanly.
 */
const MAX_REMOTE_IMAGE_BYTES = 32 * 1024 * 1024;

export async function fetchImageAsDataUrl(url: string): Promise<{ src: string } | { error: string }> {
  let res: Response;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (e) {
    const why = e instanceof Error ? e.message : 'network request failed';
    return { error: `could not reach ${url} — ${why}. This fetch runs in the MCP server, not the page, so it is not a CSP problem: check the host resolves and any proxy is reachable.` };
  }
  if (!res.ok) {
    return { error: `the server refused ${url} — HTTP ${res.status} ${res.statusText || ''}`.trim() };
  }
  const type = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!type.startsWith('image/')) {
    return { error: `${url} served "${type || 'no content-type'}", not an image. A URL that returns an HTML page around the image will do this — link the file itself.` };
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_REMOTE_IMAGE_BYTES) {
    return { error: `${url} is ${(buf.length / 1024 / 1024).toFixed(1)} MB, above the ${MAX_REMOTE_IMAGE_BYTES / 1024 / 1024} MB import cap.` };
  }
  return { src: `data:${type};base64,${buf.toString('base64')}` };
}

/**
 * Resolve an SVG to a string with every remote <image> already inlined.
 *
 * The emitted code does this in the page as a backstop, and under
 * pinepaper.studio's CSP that backstop can only ever DROP images — the page
 * may not fetch a third-party host. Doing it here means the page receives a
 * document with no remote references at all: nothing to fetch, nothing to
 * taint, and the pictures actually arrive.
 *
 * An href that cannot be fetched is still removed rather than left in, on the
 * same reasoning as the in-page pass: a missing picture is visible and
 * recoverable, a tainted canvas is neither.
 */
async function inlineSvgImages(svg: string): Promise<{ svg: string; warnings: Array<Record<string, string>> }> {
  const warnings: Array<Record<string, string>> = [];
  const hrefs = [...new Set(
    [...svg.matchAll(/(?:xlink:)?href\s*=\s*("|')(https?:\/\/[^"']+)\1/gi)].map((m) => m[2]),
  )];
  let out = svg;
  for (const href of hrefs) {
    const got = await fetchImageAsDataUrl(href);
    if ('src' in got) {
      out = out.split(href).join(got.src);
      continue;
    }
    const esc = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out
      .replace(new RegExp(`<image\\b[^>]*${esc}[^>]*\\/?>`, 'gi'), '')
      .replace(new RegExp(`<image\\b[^>]*${esc}[\\s\\S]*?<\\/image>`, 'gi'), '');
    warnings.push({ url: href, action: 'removed', reason: 'unfetchable', message: got.error });
  }
  return { svg: out, warnings };
}

export async function resolveImageSource(input: string): Promise<{ src: string } | { error: string }> {
  const raw = input.trim();
  if (/^data:/i.test(raw)) return { src: raw };
  if (/^https?:/i.test(raw)) return fetchImageAsDataUrl(raw);

  const path = raw.startsWith('file://') ? fileURLToPath(raw) : raw;
  const ext = extname(path).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(ext)) {
    return {
      error: `"${input}" is neither an http(s) URL nor a path to an image file. `
        + `Recognised image extensions: ${[...IMAGE_EXTENSIONS].join(', ')}.`,
    };
  }
  let bytes: Buffer;
  try {
    const info = await stat(path);
    if (!info.isFile()) return { error: `"${path}" is not a file.` };
    if (info.size > MAX_LOCAL_IMAGE_BYTES) {
      return { error: `"${path}" is ${(info.size / 1024 / 1024).toFixed(1)} MB, above the ${MAX_LOCAL_IMAGE_BYTES / 1024 / 1024} MB import cap. Resize it, or serve it over http.` };
    }
    bytes = await readFile(path);
  } catch (e) {
    const why = e instanceof Error ? e.message : 'unknown error';
    return { error: `could not read "${path}": ${why}. Paths are resolved from the server's working directory, so pass an absolute path if in doubt.` };
  }
  return { src: `data:${IMAGE_MIME[ext] ?? 'application/octet-stream'};base64,${bytes.toString('base64')}` };
}

export function getFileExtension(format: string): string {
  const extMap: Record<string, string> = { mp4: 'mp4', webm: 'webm', gif: 'gif', pdf: 'pdf', png: 'png', svg: 'svg', wav: 'wav' };
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

/**
 * Page a RETAINED export out of the studio's export store into a local file.
 *
 * The bytes never cross the bridge as one string. The studio holds the encoded
 * file in its origin-private store and hands back an id; this reads it a chunk
 * at a time and appends each one, so at most one chunk (4 MB by default) is in
 * memory on either side. The agent still made one tool call and still gets one
 * filePath — the paging is entirely inside the tool, because an agent-facing
 * pager would only expose a transport limit the agent cannot act on.
 *
 * On failure the export is deliberately LEFT HELD: the store is the only copy,
 * so the id and the byte count reached go back in the error and the bytes stay
 * recoverable. `releaseExport` runs only once the whole file is written.
 */
async function streamRetainedExportToFile(
  controller: { executeCode: (code: string, screenshot: boolean) => Promise<{ success: boolean; error?: string; result?: unknown }> },
  retained: { exportId: string; size: number; format: string; chunkBytes?: number },
  platform: string
): Promise<{ filePath: string; fileSize: number; chunks: number }> {
  // Reassigned once if the store corrects the size below.
  let corrected = false;
  const exportDir = getExportDir();
  await mkdir(exportDir, { recursive: true });

  const ext = getFileExtension(retained.format);
  const fileName = `pinepaper_${platform}_${Date.now()}.${ext}`;
  const filePath = join(exportDir, fileName);

  const chunkBytes = retained.chunkBytes && retained.chunkBytes > 0 ? retained.chunkBytes : 4 * 1024 * 1024;
  let offset = 0;
  let chunks = 0;

  // Start from empty: appendFile would otherwise extend a same-millisecond file.
  await writeFile(filePath, Buffer.alloc(0));

  // Returns the error rather than throwing it, so `throw await abandon(...)`
  // reads as a throw to the type checker and narrows what follows.
  const abandon = async (why: string): Promise<Error> => {
    try { await unlink(filePath); } catch { /* nothing written yet */ }
    return new Error(
      // The promise now names the call that keeps it. It was true before and
      // unreachable: reading a held export mutates nothing, so "it can be paged
      // again" was always correct and there was no door to page it through.
      `${why} (export "${retained.exportId}" is still held in the studio, ${offset} of ${retained.size} bytes read; ` +
      `page it out with pinepaper_export_store action 'save', exportId "${retained.exportId}" — reading is idempotent, ` +
      'so retrying costs nothing and the export is released only once a whole file is written. Do it BEFORE the next ' +
      'export: a new one evicts the oldest held bytes to make room)'
    );
  };

  // A READ THAT FAILS ON SIZE IS NOT A READ THAT FAILS.
  //
  // A 17 MB memphis chunk died on its FOURTH 4 MB read — three had already
  // landed — with "Failed to write data to data pipe". That is CDP refusing to
  // carry one oversized value across the bridge, not the store refusing to
  // serve it: the render had succeeded and the bytes were sitting right there.
  // The loop abandoned the whole export anyway, and the caller was left with an
  // error that explained the bytes were still held and no way to go get them.
  //
  // So a transport failure halves the request and asks again, down to a floor,
  // before giving up. The offset does not move, so a retry costs one re-read,
  // never a corrupt file. A refusal from the STORE (evicted, out of range) is
  // NOT retried — that answer will not change with a smaller window, and
  // retrying it would only spend the caller's time to reach the same place.
  const MIN_CHUNK_BYTES = 256 * 1024;
  let window = chunkBytes;

  for (;;) {
    const want = Math.min(window, retained.size - offset);
    const code = codeGenerator.generateReadExportChunk(retained.exportId, offset, want);
    // Deliberately governed at the default budget: a chunk read is a slice of a
    // string already in memory. If one of these ever needs ten seconds, the
    // store is wedged and a timeout is the correct answer, not a longer wait.
    const run = await controller.executeCode(code, false);
    if (!run.success) {
      if (want > MIN_CHUNK_BYTES) {
        window = Math.max(MIN_CHUNK_BYTES, Math.floor(want / 2));
        console.error(
          `[PinePaper] a ${want}-byte read of "${retained.exportId}" failed (${run.error || 'unknown error'}); `
          + `retrying the same offset at ${window} bytes`,
        );
        continue;
      }
      throw await abandon(
        `reading the export failed even at the ${MIN_CHUNK_BYTES}-byte floor: ${run.error || 'unknown error'}`,
      );
    }

    const chunk = run.result as { ok?: boolean; reason?: string; evicted?: boolean; data?: string; length?: number; eof?: boolean } | undefined;
    if (!chunk || chunk.ok !== true) {
      // A RANGE REFUSAL IS A CORRECTION, and it carries the real size.
      //
      // readExport refuses an out-of-range read by name rather than clamping —
      // deliberately, so a miscounting caller is told instead of handed a short
      // chunk it treats as the tail, which surfaces later as a truncated video
      // with nothing pointing back at the cause. The size this loop is working
      // from came from the export result, and `save` works from a listing; when
      // either disagrees with the file, the refusal is the authority. Take it
      // ONCE — a second disagreement is not a miscount, it is a moving target.
      // Only when it DISAGREES. Every range refusal quotes the real size,
      // including the ones that are refusing for some other reason — so
      // matching the number alone treated an eviction as a miscount, spent the
      // one correction on a no-op re-read, and hid the actual reason for an
      // iteration.
      const stated = /\(size (\d+)\)/.exec(chunk?.reason ?? '');
      if (stated && !corrected && Number(stated[1]) !== retained.size) {
        corrected = true;
        const was = retained.size;
        retained = { ...retained, size: Number(stated[1]) };
        console.error(
          `[PinePaper] the store reports "${retained.exportId}" as ${retained.size} bytes, not ${was}; `
          + "taking the store's number and continuing",
        );
        continue;
      }
      // An evicted id is its own failure: a later export reclaimed the space.
      // Re-exporting is the caller's decision, never this loop's. The engine
      // records an eviction in browser storage so it survives a reload, but
      // that storage is best-effort — a private window, cleared site data or
      // storage switched off all fall back to memory-only. So `evicted` being
      // ABSENT means unknown, never that the export was not there.
      throw await abandon(chunk?.evicted
        ? `the export was evicted mid-read: ${chunk.reason}`
        : `the studio refused the read: ${chunk?.reason || 'no reason given'}`);
    }

    const buf = Buffer.from(chunk.data || '', 'base64');
    if (buf.length === 0 && chunk.eof !== true) throw await abandon('the studio returned an empty chunk before the end of the file');
    await appendFile(filePath, buf);
    offset += buf.length;
    chunks++;

    if (chunk.eof === true) break;
    if (offset >= retained.size) break;
  }

  if (offset !== retained.size) {
    throw await abandon(`reassembled ${offset} bytes but the studio reported ${retained.size}`);
  }

  // Only now is it safe to drop the studio's copy.
  try {
    await controller.executeCode(codeGenerator.generateReleaseExport(retained.exportId), false);
  } catch (releaseError) {
    // A held export costs quota, not correctness — the file is already whole.
    console.error('[PinePaper] Export written but releaseExport failed:', releaseError);
  }

  return { filePath, fileSize: offset, chunks };
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

/**
 * A plain data answer.
 *
 * successResult() fences its payload as "Generated PinePaper code", which is
 * right for an emitter and wrong for a tool that computes its answer here —
 * a caller reading design tokens should not be handed something that looks
 * like a script to paste.
 */
function dataResult(value: unknown): CallToolResult {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] };
}

function executedResult(
  code: string,
  result: unknown,
  screenshot?: string,
  description?: string,
  report?: Record<string, unknown>
): CallToolResult {
  const resultObj: Record<string, unknown> = { success: true, result };
  if (description) resultObj.description = description;

  // Surface the governor's model-actionable feedback (app.runGenerated report):
  // warnings (e.g. "500 items created one-by-one — prefer a pattern"), item count,
  // and guard trips. Omitted entirely on pre-governor FxTool builds (no report).
  if (report) {
    const warnings = Array.isArray(report.warnings) ? report.warnings : [];
    const items = report.items as { created?: number } | undefined;
    const governor: Record<string, unknown> = {};
    if (warnings.length) governor.warnings = warnings;
    if (items && typeof items.created === 'number') governor.itemsCreated = items.created;
    if ((report.guard as { tripped?: boolean } | undefined)?.tripped) governor.loopGuardTripped = true;
    if (Object.keys(governor).length) resultObj.governor = governor;
  }

  // THE CODE ECHO WAS 90% OF THE RESPONSE, AND THE AGENT WROTE THE REQUEST.
  //
  // Measured on a 50-item batch create: 8,740 characters of echoed source
  // against 983 characters of actual result. A tester's cost study found the
  // same thing from outside — response verbosity alone was 86% of the native
  // path's token cost, and it is what makes enumerating 50 creates through
  // tools 33x more expensive than a loop that produces the same picture.
  //
  // On a SUCCESSFUL browser run the code has already done its job and the
  // caller knows what it asked for. It is still returned where it is the
  // deliverable — 'code' execution mode — and where it is the evidence: every
  // error path passes it in `details`. PINEPAPER_ECHO_CODE=1 brings it back
  // for anyone debugging a generator.
  const content: (TextContent | ImageContent)[] = [
    { type: 'text', text: JSON.stringify(resultObj, null, 2) },
  ];
  if (process.env.PINEPAPER_ECHO_CODE === '1') {
    content.push({ type: 'text', text: `Generated code:\n\`\`\`javascript\n${code}\n\`\`\`` });
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

/**
 * Swap a `code` field carrying the emitted script for a description of it.
 *
 * Only a long string is touched: a short `code` is usually a status or an
 * error code, not a program, and stripping those would take information away.
 */
function redactGeneratedCode(details: unknown): unknown {
  if (process.env.PINEPAPER_ECHO_CODE === '1') return details;
  if (!details || typeof details !== 'object' || Array.isArray(details)) return details;
  const d = details as Record<string, unknown>;
  const script = d.code;
  if (typeof script !== 'string' || script.length < 400) return details;
  const { code: _dropped, ...rest } = d;
  return {
    ...rest,
    generatedCode: {
      bytes: script.length,
      lines: script.split('\n').length,
      firstLine: script.split('\n').find((l) => l.trim()) ?? '',
      hint: 'omitted — set PINEPAPER_ECHO_CODE=1 to return the generated script with the error',
    },
  };
}

export function errorResult(
  code: string,
  message: string,
  rawDetails?: unknown,
  context?: ErrorContext
): CallToolResult {
  // THE GENERATED SCRIPT IS NOT THE ERROR.
  //
  // Most error paths pass the emitted code in `details` as evidence, and for a
  // long script that is ~12KB of JavaScript in front of a one-line failure —
  // measured from a pilot session. An agent reading the result pays for all of
  // it and learns nothing the message does not already say, and on a big
  // export it can crowd out the result entirely.
  //
  // Replaced with its shape and a way to get it back. PINEPAPER_ECHO_CODE=1
  // returns the script in full, the same switch that governs it on success.
  const details = redactGeneratedCode(rawDetails);

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
export async function executeOrGenerate(
  code: string,
  description: string,
  options: HandlerOptions,
  toolName: string,
  /**
   * Values too large to live inside the generated code. Written to
   * window.__ppStage before the run and read back by key — see
   * ExecuteCodeOptions.stage for why inlining them breaks the governor.
   */
  stage?: Record<string, string>,
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

  const result = await controller.executeCode(code, shouldTakeScreenshot, stage ? { stage } : {});

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
      // errorCode surfaces the governor's structured code (PP_ITEM_BUDGET,
      // PP_LOOP_BUDGET, PP_TIMEOUT) so the model can correct on the next turn.
      { code, errorCode: result.errorCode, governorReport: result.report },
      {
        toolName,
        canvasState: canvasState || undefined,
      }
    );
  }

  // TWO VERDICTS. `result.success` says the CODE RAN. The emitted code has its
  // own verdict, and almost every emitter in this repo returns
  // `{ success: false, error }` when it cannot do the thing — a guard that
  // found a subsystem missing, an engine call that refused, a precondition that
  // was not met. Nothing here read it, so every one of those came back to the
  // agent as a success with an error buried in the payload.
  //
  // Measured twice by a beta tester: two of five video chunks silently lost,
  // and a rigging session where "app.riggingSystem unavailable" rode inside an
  // outer success and the agent kept building on a rig that did not exist.
  // pinepaper_agent_export got this check in 1.6.9; it belongs HERE, where
  // every tool inherits it.
  const inner = innerFailure(result.result);
  if (inner) {
    const canvasState = await captureCanvasState(controller);
    return errorResult(
      ErrorCodes.EXECUTION_ERROR,
      inner,
      { code, result: result.result, governorReport: result.report },
      { toolName, canvasState: canvasState || undefined }
    );
  }

  return executedResult(code, result.result, result.screenshot, description, result.report);
}

/**
 * The emitted code's own verdict, when it reported one and it was a failure.
 *
 * Deliberately narrow. `success: false` is the shape this repo's emitters use
 * and the only one treated as a failure — a result merely LACKING `success` is
 * not a failure, because plenty of emitters return a bare value (an id, a
 * count, a list) and reading absence as refusal would turn every one of those
 * into an error. `ok: false` is included because the export-store emitters use
 * it, and it carries a `reason` rather than an `error`. A non-empty `error`
 * string with no `success: true` beside it is a failure too — it is what the
 * emitters' catch blocks return.
 */
export function innerFailure(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as {
    success?: unknown; ok?: unknown; error?: unknown; reason?: unknown;
    diagnostics?: unknown; errors?: unknown;
  };

  // `ok` IS A DOMAIN VERDICT, NOT A TRANSPORT ONE — when `success` disagrees.
  //
  // pinepaper_validate answers {success: true, ok: false, diagnostics: [...]}:
  // the call worked and the SCENE has problems, which is the entire point of
  // the tool. Treating ok:false as a failure turned that into "the studio
  // reported failure without naming a reason" and dropped the diagnostics —
  // this guard, built to stop silent failures, silencing the one tool whose
  // job is to report them. An explicit success:true wins; ok is only consulted
  // when nothing else says.
  // A PAYLOAD CARRYING AN `error` IS A FAILURE, even with no success flag.
  //
  // 89 emitted returns in code-generator.ts are `{ error: '…' }` with no
  // success:false beside them — the shape a try/catch naturally produces. This
  // guard only looked at success and ok, so those reached the caller wrapped
  // in a successful tool result with the error nested inside it. Reported for
  // image_filter on a vector item, where applyImageFilter throws and the catch
  // returns exactly that shape.
  //
  // An explicit success:true still wins, so a tool that legitimately reports a
  // domain error alongside a successful call is unaffected.
  const hasError = typeof r.error === 'string' && r.error.length > 0;
  const failed = r.success === false
    || (r.success !== true && (r.ok === false || hasError));
  if (!failed) return null;

  if (typeof r.error === 'string') return r.error;
  if (typeof r.reason === 'string') return r.reason;

  // A refusal that carries diagnostics is not reasonless — say what they were
  // rather than reporting that nothing was said.
  const detail = Array.isArray(r.diagnostics) ? r.diagnostics
    : Array.isArray(r.errors) ? r.errors
    : null;
  if (detail && detail.length > 0) {
    const first = detail.slice(0, 3).map((d) => {
      if (typeof d === 'string') return d;
      const o = d as { message?: unknown; reason?: unknown; code?: unknown; field?: unknown };
      return String(o.message ?? o.reason ?? o.code ?? JSON.stringify(o));
    });
    return `${detail.length} problem${detail.length > 1 ? 's' : ''}: ${first.join('; ')}`
      + (detail.length > first.length ? ` (+${detail.length - first.length} more)` : '');
  }
  return 'the studio reported failure without naming a reason';
}

// =============================================================================
// I18N HELPER FUNCTIONS
// =============================================================================

export function getLocalizedSuccessMessage(
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
 *
 * NOT CALLED ANYWHERE. Kept rather than deleted because it is a complete,
 * working helper and nothing equivalent replaced it — the performance tracking
 * it implements was written and never wired, which is a gap worth closing
 * rather than a dead symbol worth removing. Deleting it would erase the intent
 * along with the code; wiring it is a behaviour change and belongs in its own
 * commit.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- written, never wired; see above
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
    // Domain-module dispatch: tools migrated to per-domain handler files
    // short-circuit before the main switch. See DOMAIN_HANDLERS for the
    // current registry.
    for (const domainMap of getDomainHandlers()) {
      const handler = domainMap[toolName];
      if (handler) return await handler(args, options);
    }

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

      case 'pinepaper_sequence': {
        const input = SequenceInputSchema.parse(args);
        const code = codeGenerator.generateSequence(input);
        return executeOrGenerate(code, `Sequence: ${input.action}`, options, 'pinepaper_sequence');
      }

      case 'pinepaper_stagger': {
        const input = StaggerInputSchema.parse(args);
        const code = codeGenerator.generateStagger(input);
        return executeOrGenerate(code, `Stagger: ${input.action}`, options, 'pinepaper_stagger');
      }

      case 'pinepaper_flip': {
        const input = FlipInputSchema.parse(args);
        const code = codeGenerator.generateFlip(input);
        return executeOrGenerate(code, `Flip: ${input.action}`, options, 'pinepaper_flip');
      }

      case 'pinepaper_scene_graph': {
        const input = SceneGraphInputSchema.parse(args);
        const code = codeGenerator.generateSceneGraph(input);
        const summary = input.action === 'validate'
          ? `Scene graph: validating ${input.graph.nodes.length} node(s)`
          : `Scene graph: ${input.graph.nodes.length} node(s)`;
        return executeOrGenerate(code, summary, options, 'pinepaper_scene_graph');
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

      case 'pinepaper_query_capabilities': {
        const input = QueryCapabilitiesInputSchema.parse(args);
        // `query` is what callers reach for on an action named 'find'; `key`
        // is what the emitter reads. Accepted as an alias rather than left as
        // a validation dead end.
        if (!input.key && input.query) input.key = input.query;
        const code = codeGenerator.generateQueryCapabilities(input);
        return executeOrGenerate(code, `Capabilities: ${input.action || 'list'}`, options, 'pinepaper_query_capabilities');
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
      case 'pinepaper_character': {
        const input = CharacterInputSchema.parse(args);
        const plan = planCharacter(input);
        if (!plan.ok) {
          // A refusal that names what WOULD have worked. The caller cannot see
          // the design graph, and a bare "no" is how a model came to ask for a
          // concept that has never had a drawing.
          return {
            content: [{ type: 'text', text: `pinepaper_character: ${plan.reason}` }],
            isError: true,
          };
        }
        const code = generateCharacterCode(
          plan,
          {
            generateCreateItem: (i: unknown) => codeGenerator.generateCreateItem(i as never),
            generateKeyframeAnimate: (i: unknown) => codeGenerator.generateKeyframeAnimate(i as never),
          },
          {
            createItem: (a: unknown) => CreateItemInputSchema.parse(a),
            keyframeAnimate: (a: unknown) => KeyframeAnimateInputSchema.parse(a),
          },
        );
        const description =
          `Places ${input.concept} as ${plan.parts.length} parts with ${plan.tracks} keyframe tracks`;
        return executeOrGenerate(code, description, options, 'pinepaper_character');
      }

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

      case 'pinepaper_geometry': {
        const input = GeometryInputSchema.parse(args);
        const code = codeGenerator.generateGeometry(input);
        const description = `Geometry construction: ${input.operation}${input.createAs ? ' (+ create item)' : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_geometry');
      }

      case 'pinepaper_equation_path': {
        const input = EquationPathInputSchema.parse(args);
        const code = codeGenerator.generateEquationPath(input);
        const description = `Equation-driven path: ${input.kind}${input.preset ? ` (${input.preset})` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_equation_path');
      }

      case 'pinepaper_event': {
        const input = EventInputSchema.parse(args);
        const code = codeGenerator.generateEvent(input);
        const description = input.action === 'create'
          ? `Create event "${input.name}"`
          : `Pulse event ${input.eventId}`;
        return executeOrGenerate(code, description, options, 'pinepaper_event');
      }

      case 'pinepaper_construction_sequence': {
        const input = ConstructionSequenceInputSchema.parse(args);
        const code = codeGenerator.generateConstructionSequence(input);
        const description = `Construction sequence: ${input.action}`;
        return executeOrGenerate(code, description, options, 'pinepaper_construction_sequence');
      }

      case 'pinepaper_group': {
        const input = GroupInputSchema.parse(args);
        const code = codeGenerator.generateGroup(input);
        const description =
          input.action === 'ungroup' ? `Ungroup ${input.groupId ?? ''}`
          : input.action === 'break_apart' ? `Break apart ${input.itemId ?? ''} into movable parts`
          : `Group ${(input.itemIds ?? []).length} item(s)${input.groupName ? ` as "${input.groupName}"` : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_group');
      }

      case 'pinepaper_camera_director': {
        const input = CameraDirectorInputSchema.parse(args);
        const code = codeGenerator.generateCameraDirector(input);
        const description = input.action === 'shots'
          ? `Camera director: ${(input.shots ?? []).length} shot(s)`
          : 'Camera director: auto-direct walkthrough';
        return executeOrGenerate(code, description, options, 'pinepaper_camera_director');
      }

      case 'pinepaper_detect_objects': {
        const input = DetectObjectsInputSchema.parse(args);
        const code = codeGenerator.generateDetectObjects(input);
        const description = `Detect objects${input.asNodes ? ' (as design nodes)' : ''}`;
        return executeOrGenerate(code, description, options, 'pinepaper_detect_objects');
      }

      case 'pinepaper_extract_object': {
        const input = ExtractObjectInputSchema.parse(args);
        const code = codeGenerator.generateExtractObject(input);
        const description = `Extract object${input.label ? ` "${input.label}"` : ''} from image`;
        return executeOrGenerate(code, description, options, 'pinepaper_extract_object');
      }

      case 'pinepaper_arrange': {
        const input = ArrangeInputSchema.parse(args);
        const code = codeGenerator.generateArrange(input);
        const description = `Arrange ${input.itemId}: ${input.action}`;
        return executeOrGenerate(code, description, options, 'pinepaper_arrange');
      }

      case 'pinepaper_validate_scene': {
        const input = ValidateSceneInputSchema.parse(args);
        const code = codeGenerator.generateValidateScene(input);
        const description = input.ops ? `Pre-validate ${input.ops.length} proposed op(s)` : 'Audit the live scene';
        return executeOrGenerate(code, description, options, 'pinepaper_validate_scene');
      }

      case 'pinepaper_capture_frames': {
        const input = CaptureFramesInputSchema.parse(args);
        const code = codeGenerator.generateCaptureFrames(input);
        const description = `Deterministic capture of ${input.times.length} frame(s)`;
        return executeOrGenerate(code, description, options, 'pinepaper_capture_frames');
      }

      case 'pinepaper_instantiate_ontology': {
        const input = InstantiateOntologyInputSchema.parse(args);
        const code = codeGenerator.generateInstantiateOntology(input);
        return executeOrGenerate(code, 'Instantiate ontology → scene', options, 'pinepaper_instantiate_ontology');
      }

      case 'pinepaper_lint_scene': {
        const input = LintSceneInputSchema.parse(args);
        const code = codeGenerator.generateLintScene(input);
        return executeOrGenerate(code, 'Lint scene (relational density)', options, 'pinepaper_lint_scene');
      }

      case 'pinepaper_media': {
        const input = MediaInputSchema.parse(args);
        const code = codeGenerator.generateMedia(input);
        return executeOrGenerate(code, `Media: ${input.action}`, options, 'pinepaper_media');
      }

      case 'pinepaper_text_style': {
        // 'list' is an alias for 'list_styles'. pinepaper_text_effect spells
        // the same action 'list', so an agent moving between the two guesses
        // wrong — and a rejected enum value is a dead end rather than a hint.
        const input = TextStyleInputSchema.parse(args);
        if (input.action === 'list') input.action = 'list_styles';
        const code = codeGenerator.generateTextStyle(input);
        return executeOrGenerate(code, `Text style: ${input.action}`, options, 'pinepaper_text_style');
      }

      case 'pinepaper_design_medium': {
        const input = DesignMediumInputSchema.parse(args);
        const code = codeGenerator.generateDesignMedium(input);
        return executeOrGenerate(code, `Medium: ${input.action}`, options, 'pinepaper_design_medium');
      }


      case 'pinepaper_text_effect': {
        const input = TextEffectInputSchema.parse(args);
        const code = codeGenerator.generateTextEffect(input);
        return executeOrGenerate(code, `Text effect: ${input.action}`, options, 'pinepaper_text_effect');
      }

      // ─── 1.6.4: agent surface for the Tier-2 engine features ───
      case 'pinepaper_brand_kit': {
        const input = BrandKitInputSchema.parse(args);
        const code = codeGenerator.generateBrandKit(input);
        return executeOrGenerate(code, `Brand kit: ${input.action}`, options, 'pinepaper_brand_kit');
      }

      case 'pinepaper_component': {
        const input = ComponentInputSchema.parse(args);
        const code = codeGenerator.generateComponent(input);
        return executeOrGenerate(code, `Component: ${input.action}`, options, 'pinepaper_component');
      }

      case 'pinepaper_artboard': {
        const input = ArtboardInputSchema.parse(args);
        const code = codeGenerator.generateArtboard(input);
        return executeOrGenerate(code, `Artboard: ${input.action}`, options, 'pinepaper_artboard');
      }

      case 'pinepaper_comment': {
        const input = CommentInputSchema.parse(args);
        const code = codeGenerator.generateComment(input);
        return executeOrGenerate(code, `Comment: ${input.action}`, options, 'pinepaper_comment');
      }

      case 'pinepaper_provenance': {
        const input = ProvenanceInputSchema.parse(args);
        const code = codeGenerator.generateProvenance(input);
        return executeOrGenerate(code, `Provenance: ${input.action}`, options, 'pinepaper_provenance');
      }

      case 'pinepaper_scene_diff': {
        const input = SceneDiffInputSchema.parse(args);
        const code = codeGenerator.generateSceneDiff(input);
        return executeOrGenerate(code, `Scene diff: ${input.action}`, options, 'pinepaper_scene_diff');
      }

      case 'pinepaper_compose': {
        const input = ComposeInputSchema.parse(args);
        const code = codeGenerator.generateCompose(input);
        return executeOrGenerate(code, `Compose: ${input.action}`, options, 'pinepaper_compose');
      }

      case 'pinepaper_audio_beats': {
        const input = AudioBeatsInputSchema.parse(args);
        const code = codeGenerator.generateAudioBeats(input);
        return executeOrGenerate(code, `Audio: ${input.action}`, options, 'pinepaper_audio_beats');
      }

      case 'pinepaper_template_params': {
        const input = TemplateParamsInputSchema.parse(args);
        const code = codeGenerator.generateTemplateParams(input);
        return executeOrGenerate(code, `Template params: ${input.action}`, options, 'pinepaper_template_params');
      }

      case 'pinepaper_crop_image': {
        const input = CropImageInputSchema.parse(args);
        const code = codeGenerator.generateCropImage(input);
        return executeOrGenerate(code, `Crop image ${input.itemId}`, options, 'pinepaper_crop_image');
      }

      case 'pinepaper_chroma_key': {
        const input = ChromaKeyInputSchema.parse(args);
        const code = codeGenerator.generateChromaKey(input);
        return executeOrGenerate(code, `Chroma-key image ${input.itemId}`, options, 'pinepaper_chroma_key');
      }

      case 'pinepaper_shatter_image': {
        const input = ShatterImageInputSchema.parse(args);
        const code = codeGenerator.generateShatterImage(input);
        return executeOrGenerate(code, `Shatter image ${input.itemId}`, options, 'pinepaper_shatter_image');
      }

      case 'pinepaper_import_layered_character': {
        const input = ImportLayeredCharacterInputSchema.parse(args);
        const code = codeGenerator.generateImportLayeredCharacter(input);
        return executeOrGenerate(code, 'Import layered character', options, 'pinepaper_import_layered_character');
      }

      case 'pinepaper_game': {
        const input = GameInputSchema.parse(args);
        const code = codeGenerator.generateGame(input);
        return executeOrGenerate(code, `Game: ${input.action}`, options, 'pinepaper_game');
      }

      case 'pinepaper_world3d': {
        const input = World3DInputSchema.parse(args);
        const code = codeGenerator.generateWorld3D(input);
        return executeOrGenerate(code, `World3D: ${input.action}`, options, 'pinepaper_world3d');
      }

      case 'pinepaper_rigging': {
        const input = RiggingInputSchema.parse(args);
        const code = codeGenerator.generateRigging(input);
        return executeOrGenerate(code, `Rigging: ${input.action}`, options, 'pinepaper_rigging');
      }

      // -----------------------------------------------------------------------
      // RELATION TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_add_relation': {
        const input = AddRelationInputSchema.parse(args);
        const code = codeGenerator.generateAddRelation(input);
        const description = getLocalizedSuccessMessage(i18n, 'relationAdded', {
          relationType: input.relationType ?? `preset:${input.presetId}`,
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

      case 'pinepaper_import_motion_capture': {
        const input = ImportMotionCaptureInputSchema.parse(args);
        const code = codeGenerator.generateImportMotionCapture(input);
        const what =
          input.mode === 'retarget'
            ? `Retargets a BVH clip onto rig ${input.skeletonId}`
            : 'Imports a BVH clip as a new animated skeleton';
        return executeOrGenerate(code, what, options, 'pinepaper_import_motion_capture');
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
          input.time,
          input.deterministic,
          { rate: input.rate, progress: input.progress, scroll: input.scroll }
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
        // WITH an itemId this finally answers the question its NAME asks.
        // Without one it keeps its old job — the mask-type table — because that
        // is what existing callers get today.
        const itemId = typeof (args as { itemId?: unknown }).itemId === 'string'
          ? (args as { itemId: string }).itemId : undefined;
        if (itemId) {
          const code = codeGenerator.generateListItemAnimatableProperties(itemId);
          return executeOrGenerate(code, `Animatable properties of ${itemId}`, options, 'pinepaper_get_animatable_properties');
        }
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
      // CAMERA TOOLS — extracted to src/tools/handlers/camera.ts
      // -----------------------------------------------------------------------

      // -----------------------------------------------------------------------
      // FONT TOOLS — extracted to src/tools/handlers/font.ts
      // -----------------------------------------------------------------------

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
        // Resolve the document HERE, so the page never has to fetch anything.
        //
        // Under pinepaper.studio's CSP (connect-src 'self' + the cloud origin)
        // the page cannot fetch a third-party host at all, so the in-page
        // inlining could only ever DROP remote images. Fetching the SVG and
        // its images in this process means the browser receives a document
        // with no remote references: nothing to fetch, nothing to taint, and
        // the pictures arrive. The in-page pass stays as a backstop for an
        // svgString handed straight to the generator elsewhere.
        let svgText = input.svgString;
        let svgWarnings: Array<Record<string, string>> = [];
        if (input.url) {
          try {
            const res = await fetch(input.url, { redirect: 'follow' });
            if (!res.ok) {
              return errorResult(
                ErrorCodes.EXECUTION_ERROR,
                `the server refused ${input.url} — HTTP ${res.status} ${res.statusText || ''}`.trim(),
              );
            }
            svgText = await res.text();
          } catch (e) {
            const why = e instanceof Error ? e.message : 'network request failed';
            return errorResult(
              ErrorCodes.EXECUTION_ERROR,
              `could not reach ${input.url} — ${why}. This fetch runs in the MCP server rather than the page, so it is not a CSP problem.`,
            );
          }
        }
        if (svgText && /(?:xlink:)?href\s*=\s*["']https?:/i.test(svgText)) {
          const inlined = await inlineSvgImages(svgText);
          svgText = inlined.svg;
          svgWarnings = inlined.warnings;
        }

        const code = codeGenerator.generateImportSVG(
          svgText,
          svgText ? undefined : input.url,
          input.position,
          input.scale,
          input.source
        );
        const description = svgWarnings.length
          ? `Imports SVG onto the canvas (${svgWarnings.length} unreachable image(s) removed)`
          : 'Imports SVG onto the canvas';
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
      // EXPORT TOOLS — extracted to src/tools/handlers/export.ts
      // -----------------------------------------------------------------------

      // -----------------------------------------------------------------------
      // BROWSER CONTROL TOOLS
      // -----------------------------------------------------------------------
      case 'pinepaper_browser_connect': {
        // Default to headless: false — if you explicitly call browser_connect, you likely want to see it
        const headless = (args.headless as boolean) ?? false;
        // Target a custom Studio instance (e.g. local dev at http://localhost:3000).
        // Falls back to the PINEPAPER_STUDIO_URL env var, else PuppeteerController's
        // built-in prod default. "/editor" + agent params are appended by the controller.
        const rawUrl = typeof args.url === 'string' ? args.url.trim() : '';
        const studioUrl = (rawUrl || (process.env.PINEPAPER_STUDIO_URL || '').trim()) || undefined;

        // Only http(s) is supported — reject file://, data://, javascript:, etc.
        if (studioUrl) {
          const v = validateStudioUrl(studioUrl);
          if (!v.ok) return errorResult(ErrorCodes.INVALID_INPUT, v.error);
        }

        const cfg = studioUrl ? { headless, studioUrl } : { headless };

        let controller = getBrowserController(cfg);

        // NOT gated on controller.connected. getBrowserController() ignores cfg
        // once the singleton exists, AND the singleton survives disconnect()
        // (pinepaper_browser_disconnect doesn't null it) carrying its old
        // studioUrl. So a stale/disconnected controller pointing at the prod
        // default — which any prior browser_status() or connect() creates —
        // would otherwise silently swallow an explicit url= (e.g. localhost for
        // a dev build). Treat a different requested target as a change even when
        // not currently connected.
        const urlChanged = !!studioUrl &&
          !sameStudioTarget(controller.studioUrl, studioUrl);

        // Already connected, same headless mode, same URL → nothing to do
        if (controller.connected && controller.isHeadless === headless && !urlChanged) {
          return {
            content: [{ type: 'text', text: `Already connected to PinePaper Studio (${controller.studioUrl || 'default'}, headless: ${headless}).` }],
          };
        }

        // Headless mode or target URL differs from the existing singleton → tear
        // it down so the new config takes effect. Runs even when disconnected,
        // because getBrowserController() reuses the stale singleton (and its old
        // config) on the next call otherwise.
        if (urlChanged || (controller.connected && controller.isHeadless !== headless)) {
          await resetBrowserController();
          controller = getBrowserController(cfg);
        }

        try {
          const newController = controller;
          if (!newController.connected) await newController.connect();

          const canvasSizeResult = await newController.executeCode(
            `const size = app.getCanvasSize ? app.getCanvasSize() : { width: 800, height: 600 }; ({ width: size.width || 800, height: size.height || 600 });`,
            false
          );
          const canvasSize = canvasSizeResult.success
            ? (canvasSizeResult.result as { width: number; height: number })
            : { width: 800, height: 600 };

          return {
            content: [{ type: 'text', text: `Connected to PinePaper Studio (${newController.studioUrl || 'default'}, headless: ${headless}, canvas: ${canvasSize.width}x${canvasSize.height}).` }],
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
        const { SERVER_VERSION } = await import('../version.js');
        const serverSection = {
          version: SERVER_VERSION,
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
      // TOOL GUIDE — extracted to src/tools/handlers/tool-guide.ts
      // -----------------------------------------------------------------------

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
            // IMPLEMENTED NOW, rather than redirected.
            //
            // This used to refuse with "URL imports not yet implemented" while
            // the agent guide documented the url parameter — the redirect
            // named a working alternative, which made it a good refusal, but
            // it was still a documented parameter that did nothing. The reason
            // it could not be done here was that fetching belonged to the
            // page; it does not any more, because the page cannot fetch a
            // third-party host under the studio's CSP and this process can.
            let res: Response;
            try {
              res = await fetch(input.url, { redirect: 'follow' });
            } catch (e) {
              const why = e instanceof Error ? e.message : 'network request failed';
              return errorResult(
                ErrorCodes.EXECUTION_ERROR,
                `could not reach ${input.url} — ${why}. This fetch runs in the MCP server rather than the page, so it is not a CSP problem.`,
              );
            }
            if (!res.ok) {
              return errorResult(
                ErrorCodes.EXECUTION_ERROR,
                `the server refused ${input.url} — HTTP ${res.status} ${res.statusText || ''}`.trim(),
              );
            }
            const body = await res.text();
            if (!/<svg[\s>]/i.test(body)) {
              const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
              return errorResult(
                ErrorCodes.INVALID_PARAMS,
                `${input.url} served "${type || 'no content-type'}" and its body is not SVG. `
                + 'For a raster image use pinepaper_import_image, which accepts a url and inlines it.',
              );
            }
            svg = body;
            metadata = { source: 'url', url: input.url };
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
              // The script is not part of the answer here either — same reason
              // errors no longer carry it. PINEPAPER_ECHO_CODE=1 brings it back.
              text: (process.env.PINEPAPER_ECHO_CODE === '1'
                ? `Executed PinePaper code:\n\n\`\`\`javascript\n${code}\n\`\`\`\n\n`
                : '')
                + `Full screenshot saved to: ${filePath} (${(fileSize / 1024).toFixed(1)} KB)\n\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
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

        // Ontology preflight — catch typos in itemType/relationType/
        // effectType/generatorName before generating JS, so the LLM gets a
        // structured hint instead of a silent failure inside the browser.
        // Opt-out via skipValidation: true when the caller knows what they're
        // doing (e.g. experimental vocabulary).
        if (!input.skipValidation) {
          const ops = input.operations as ReadonlyArray<Record<string, unknown>>;
          const violations = validateBatchVocabulary(ops);
          if (violations.length > 0) {
            return errorResult(
              ErrorCodes.VALIDATION_ERROR,
              `Batch preflight rejected ${violations.length} operation${violations.length > 1 ? 's' : ''} with unknown vocabulary value${violations.length > 1 ? 's' : ''}. Fix the offending fields and retry, or pass skipValidation: true to bypass.`,
              violations.map((v) => ({
                path: `operations[${v.opIndex}].${v.field}`,
                opType: v.opType,
                vocabulary: v.hint,
              })),
            );
          }
          // Property-key typo detection — narrow scope (Levenshtein ≤2) so
          // legitimate extras like `gradient` pass through. Catches the
          // common typo class (radiues vs radius, fontSiz vs fontSize)
          // before browser execution silently drops them.
          const typos = detectBatchPropertyTypos(ops);
          if (typos.length > 0) {
            return errorResult(
              ErrorCodes.VALIDATION_ERROR,
              `Batch preflight detected ${typos.length} likely property-key typo${typos.length > 1 ? 's' : ''}. Each suggestion is a Levenshtein-≤2 match against the schema for that itemType — fix and retry, or pass skipValidation: true to bypass.`,
              typos.map((t) => ({
                path: `operations[${t.opIndex}].properties.${t.property}`,
                opType: t.opType,
                itemType: t.itemType,
                received: t.property,
                suggestion: t.suggestion,
                validKeys: t.validKeys,
              })),
            );
          }
        }

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

      case 'pinepaper_export_store': {
        const input = ExportStoreInputSchema.parse(args);
        const controller = options.browserController || getBrowserController();
        if (!controller.connected) {
          try {
            await controller.connect();
          } catch (connectError) {
            return errorResult(
              ErrorCodes.EXECUTION_ERROR,
              `the export store lives in the studio, and connecting to it failed: ${connectError instanceof Error ? connectError.message : 'unknown error'}`,
              {},
              { toolName: 'pinepaper_export_store' }
            );
          }
        }

        const held = await controller.executeCode(codeGenerator.generateListExports(), false);
        if (!held.success) {
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            `listing the export store failed: ${held.error || 'unknown error'}`,
            {},
            { toolName: 'pinepaper_export_store' }
          );
        }
        const listing = held.result as { ok?: boolean; reason?: string; exports?: Array<{ id: string; format: string; size: number; createdAt: number }> };
        if (!listing || listing.ok !== true) {
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            listing?.reason || 'the studio did not answer with a listing',
            {},
            { toolName: 'pinepaper_export_store' }
          );
        }
        const exports = listing.exports ?? [];

        if (input.action === 'list') {
          return dataResult({
            exports,
            held: exports.length,
            heldBytes: exports.reduce((n, e) => n + (e.size || 0), 0),
            note: exports.length > 1
              ? 'A later export evicts the OLDEST held ones to make room. Save or release each before starting the next.'
              : undefined,
          });
        }

        // Both remaining actions name an id, and an id the store does not have
        // is the one thing worth saying carefully. The engine records an
        // eviction durably enough to survive a reload, so a read of that id
        // will usually say "evicted" — but the record is best-effort browser
        // storage and a listing cannot consult it at all. Absence of the id
        // here is therefore "gone, cause unknown", and stating one cause as
        // fact would be inventing the more interesting half of the answer.
        const entry = exports.find((e) => e.id === input.exportId);
        if (!entry) {
          return errorResult(
            ErrorCodes.INVALID_PARAMS,
            `the studio is not holding "${input.exportId}". It was released, evicted to make room for a later export, `
            + `or never existed here — a listing cannot tell which. `
            + `${exports.length ? `Held right now: ${exports.map((e) => e.id).join(', ')}.` : 'The store is empty.'}`,
            { exportId: input.exportId, held: exports.map((e) => e.id) },
            { toolName: 'pinepaper_export_store' }
          );
        }

        if (input.action === 'release') {
          const dropped = await controller.executeCode(codeGenerator.generateReleaseExport(entry.id), false);
          const outcome = dropped.result as { ok?: boolean; reason?: string } | undefined;
          if (!dropped.success || outcome?.ok !== true) {
            return errorResult(
              ErrorCodes.EXECUTION_ERROR,
              `releasing "${entry.id}" failed: ${dropped.error || outcome?.reason || 'unknown error'}`,
              { exportId: entry.id },
              { toolName: 'pinepaper_export_store' }
            );
          }
          return dataResult({ released: entry.id, freedBytes: entry.size });
        }

        // save: the same pager agent_export uses, pointed at an id instead of a
        // fresh render. Reading is idempotent, so a save that failed halfway
        // can simply be run again — there is no partial state to clean up here.
        try {
          const { filePath, fileSize, chunks } = await streamRetainedExportToFile(
            controller,
            { exportId: entry.id, size: entry.size, format: entry.format },
            input.platform || 'recovered'
          );
          return {
            content: [{
              type: 'text' as const,
              text: `Export recovered from the studio's store:\n\nFile: ${filePath}\nFormat: ${entry.format}\n`
                + `Size: ${(fileSize / 1024).toFixed(1)} KB\nPaged out in ${chunks} chunk${chunks === 1 ? '' : 's'}, then released\n`,
            }],
          };
        } catch (streamError) {
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            streamError instanceof Error ? streamError.message : 'paging the export out of the store failed',
            { exportId: entry.id, size: entry.size },
            { toolName: 'pinepaper_export_store' }
          );
        }
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
          } catch (_connectError) {
            // Fall back to executeOrGenerate which handles the fallback gracefully
            return executeOrGenerate(code, description, options, 'pinepaper_agent_export');
          }
        }

        // Auto-start agent session if not active
        const exportSessionManager = getSessionManager();
        if (!exportSessionManager.hasActiveJob()) {
          exportSessionManager.startJob({ name: 'auto_session', screenshotPolicy: 'on_complete' });
        }

        const exportBrowserResult = await controller.executeCode(code, false, {
          governorTimeoutMs: exportGovernorTimeoutMs(),
        });

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

        // TWO VERDICTS, and only one of them was being read.
        //
        // `exportBrowserResult.success` says the CODE RAN. The export's own
        // verdict is `exportResult.success`, and every emitted branch that
        // cannot deliver returns `{ success: false, error }` — a studio without
        // the renderer, an encoder that died, a blob past the inline ceiling.
        // None of that was checked: the value fell through to the inline return
        // below, which reports a success and hands back a result object nobody
        // reads past the first line.
        //
        // Measured cost: a five-chunk video where two chunks came back
        // `success: false, error: "export failed: Failed to write data to data
        // pipe"` under an outer `"success": true`. The caller shipped a
        // three-chunk video believing it had five. A silent success is the one
        // failure mode this surface can never afford, because nothing
        // downstream has any reason to look again.
        if (exportResult && exportResult.success === false) {
          const canvasState = await captureCanvasState(controller);
          // A "data pipe" failure is the BROWSER TRANSPORT refusing to carry
          // the result back, not the encoder refusing to make it — the string
          // exists nowhere in the engine. So the render may well have finished
          // and the bytes may be sitting in the export store right now. Saying
          // so is the difference between recovering an export and re-rendering
          // one, and re-rendering is what evicts an earlier chunk's bytes.
          const looksLikeTransport = /data pipe/i.test(String(exportResult.error ?? ''));
          return errorResult(
            ErrorCodes.EXECUTION_ERROR,
            `export failed: ${exportResult.error || 'the studio reported failure without naming a reason'}`
            + (looksLikeTransport
              ? ' — that is the browser transport failing to carry the result back, not necessarily the render failing.'
                + " Call pinepaper_export_store action 'list' BEFORE re-rendering: the bytes may already be held, and a"
                + ' fresh export can evict an earlier one to make room.'
              : ''),
            { code, format: exportResult.format ?? input.format, result: exportResult },
            { toolName: 'pinepaper_agent_export', canvasState: canvasState || undefined }
          );
        }

        const format = exportResult?.format || input.format || 'png';
        const data = exportResult?.data;

        // RETAINED: the studio held the encoded file in its export store rather
        // than returning bytes, because base64 of a long video is a bigger
        // string than the video and it would cross the bridge as one value.
        // Page it into a file here. mp4/webm were always going to be written to
        // a file anyway (ALWAYS_SAVE_FORMATS), so the agent's result is the
        // same shape it has always been — a filePath — just reachable at sizes
        // that used to run out of memory.
        if (exportResult?.retained === true && typeof exportResult.exportId === 'string') {
          try {
            const { filePath, fileSize, chunks } = await streamRetainedExportToFile(
              controller,
              {
                exportId: exportResult.exportId,
                size: Number(exportResult.size) || 0,
                format,
                chunkBytes: Number(exportResult.chunkBytes) || undefined,
              },
              input.platform || 'auto'
            );
            const cleanResult = { ...exportResult, data: undefined, filePath, fileSize, chunks };
            return {
              content: [{
                type: 'text' as const,
                text: `Export saved to file:\n\nFile: ${filePath}\nFormat: ${format}\nSize: ${(fileSize / 1024).toFixed(1)} KB\nPlatform: ${input.platform}\nPaged out of the studio's export store in ${chunks} chunk${chunks === 1 ? '' : 's'}\n\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
              }],
            };
          } catch (streamError) {
            // The export is still held — the message says so and names the id,
            // because the bytes are recoverable and re-exporting is not free.
            const canvasState = await captureCanvasState(controller);
            return errorResult(
              ErrorCodes.EXECUTION_ERROR,
              streamError instanceof Error ? streamError.message : 'Paging the export out of the store failed',
              { code, exportId: exportResult.exportId, size: exportResult.size },
              { toolName: 'pinepaper_agent_export', canvasState: canvasState || undefined }
            );
          }
        }

        const shouldSaveToFile = data && typeof data === 'string' && (
          ALWAYS_SAVE_FORMATS.has(format) ||
          data.length > SAVE_THRESHOLD_BYTES
        );

        if (shouldSaveToFile) {
          try {
            const { filePath, fileSize } = await saveExportToFile(data, format, input.platform || 'auto');
            const cleanResult = { ...exportResult, data: undefined, filePath, fileSize };
            // A mix that dropped sounds wrote a perfectly good file that is
            // missing tracks. It rides the SUCCESS path, which is exactly why
            // it has to be said out loud here rather than left in the JSON.
            const dropNote = (exportResult as { incomplete?: string }).incomplete;
            return {
              content: [{
                type: 'text' as const,
                text: `Export saved to file:\n\nFile: ${filePath}\nFormat: ${format}\nSize: ${(fileSize / 1024).toFixed(1)} KB\nPlatform: ${input.platform}\n`
                  + (dropNote ? `DROPPED: ${dropNote}\n` : '')
                  + `\nResult: ${JSON.stringify(cleanResult, null, 2)}`,
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

      case 'pinepaper_design_styles':
        return dataResult({ styles: designSystems.listStyles() });

      case 'pinepaper_design_systems':
      case 'pinepaper_design_system': {
        const rawArgs = { ...args } as Record<string, unknown>;
        if (!rawArgs.action && rawArgs.systemName) {
          if (rawArgs.systemName === 'all') {
            rawArgs.action = 'list_systems';
          } else {
            rawArgs.action = 'get_system';
            rawArgs.systemId = String(rawArgs.systemName);
          }
        }
        if (!rawArgs.action && rawArgs.style && !rawArgs.title) {
          rawArgs.action = 'list_styles';
        }
        const input = DesignSystemInputSchema.parse(rawArgs);
        // Answered HERE, not in the browser — these are decisions over
        // vendored data, and only `compose` with draw:true needs the canvas.
        switch (input.action) {
          case 'list_systems':
            return dataResult({ systems: designSystems.listSystems() });
          case 'get_system': {
            const sys = designSystems.getSystem(input.systemId!, input.tokenType);
            if (!sys) {
              return errorResult(
                ErrorCodes.INVALID_PARAMS,
                `no design system "${input.systemId}" — call action 'list_systems' for the ids`,
                { systemId: input.systemId },
                { toolName: 'pinepaper_design_system' }
              );
            }
            return dataResult(sys);
          }
          case 'list_motion': {
            // Curves and durations together, because a motion token is a shape
            // AND a length. The curves were published and the durations beside
            // them in the same store were not, so a caller could match a
            // system's easing and had to invent its timing.
            const easings = designSystems.listEasings(input.authoredOnly);
            const durations = designSystems.listDurations(input.authoredOnly);
            return dataResult({
              easings, durations,
              note: 'These are the licensed SYSTEMS\' motion scales. An aesthetic style (bauhaus_geometric, memphis_group) carries no upstream motion data — pair one of these with a style rather than expecting the style to name its own.',
            });
          }
          case 'list_easings':
            return dataResult({ easings: designSystems.listEasings(input.authoredOnly) });
          case 'list_styles':
            return dataResult({ styles: designSystems.listStyles() });
          case 'compose': {
            let scene;
            try {
              scene = designSystems.compose(input.style!, {
                title: input.title!, subtitle: input.subtitle, body: input.body,
                width: input.width, height: input.height, variant: input.variant,
              });
            } catch (composeError) {
              return errorResult(
                ErrorCodes.EXECUTION_ERROR,
                composeError instanceof Error ? composeError.message : 'the style could not compose',
                { style: input.style },
                { toolName: 'pinepaper_design_system' }
              );
            }
            if (!scene) {
              return errorResult(
                ErrorCodes.INVALID_PARAMS,
                `"${input.style}" cannot compose — it is a style this surface can name but not build. ` +
                `Call action 'list_styles' and use one marked composable.`,
                { style: input.style },
                { toolName: 'pinepaper_design_system' }
              );
            }
            const ops = designSystems.sceneToOps(scene);
            if (input.draw === false) {
              return dataResult({ scene, ops, drawn: false });
            }
            const code = codeGenerator.generateDesignCompose(scene, ops, scene.style);
            return executeOrGenerate(code, `Composed a ${scene.style} scene (${ops.length} items)`, options, 'pinepaper_design_system');
          }
        }
        break;
      }

      case 'pinepaper_stick_figure':
      case 'pinepaper_stick': {
        const input = StickInputSchema.parse(args);
        return executeOrGenerate(codeGenerator.generateStick(input), `Stick ${input.action}`, options, 'pinepaper_stick');
      }

      case 'pinepaper_story': {
        const input = StoryInputSchema.parse(args);
        return executeOrGenerate(codeGenerator.generateStory(input), `Story: ${input.action}`, options, 'pinepaper_story');
      }

      case 'pinepaper_interchange': {
        const input = InterchangeInputSchema.parse(args);
        const code = codeGenerator.generateInterchange(input);
        return executeOrGenerate(code, `Interchange: ${input.action}`, options, 'pinepaper_interchange');
      }

      case 'pinepaper_sound': {
        const input = SoundInputSchema.parse(args);
        const code = codeGenerator.generateSound(input);
        const soundDescription = `Sound: ${input.action}`;

        // A RENDERED SOUNDTRACK IS A FILE, not a response field. 48kHz 16-bit
        // mono is ~96 KB/s, so a minute is ~5.8 MB of base64 and the ten
        // minutes the schema allows is ~77 MB — deliverable across the bridge,
        // useless pasted into a conversation. This mirrors what agent_export
        // already does for video and PDF, and reuses the same helper rather
        // than growing a second copy of the save path.
        if (input.action === 'render_soundtrack') {
          const execMode = options.executionMode ?? getExecutionMode();
          if (execMode === 'code' || !options.executeInBrowser) {
            return executeOrGenerate(code, soundDescription, options, 'pinepaper_sound');
          }
          const soundController = options.browserController || getBrowserController();
          if (!soundController.connected) {
            try { await soundController.connect(); }
            catch { return executeOrGenerate(code, soundDescription, options, 'pinepaper_sound'); }
          }
          const wavResult = await soundController.executeCode(code, false);
          if (!wavResult.success) {
            const canvasState = await captureCanvasState(soundController);
            return errorResult(
              ErrorCodes.EXECUTION_ERROR,
              wavResult.error || 'Rendering the soundtrack failed',
              { code },
              { toolName: 'pinepaper_sound', canvasState: canvasState || undefined }
            );
          }
          const soundtrack = wavResult.result as {
            success?: boolean; wavBase64?: string; byteLength?: number; duration?: number;
            sampleRate?: number; placed?: number; dropped?: number; incomplete?: string;
          } | undefined;

          // A refusal is a real answer — "no sounds are placed" travels intact
          // rather than becoming an empty file.
          if (!soundtrack?.success || !soundtrack.wavBase64) {
            return executedResult(code, soundtrack, wavResult.screenshot, soundDescription);
          }
          try {
            const { filePath, fileSize } = await saveExportToFile(
              `data:audio/wav;base64,${soundtrack.wavBase64}`, 'wav', 'soundtrack');
            const clean = { ...soundtrack, wavBase64: undefined, filePath, fileSize };
            return {
              content: [{
                type: 'text' as const,
                text: `Soundtrack rendered to file:\n\nFile: ${filePath}\n`
                  + `Size: ${(fileSize / 1024).toFixed(1)} KB\n`
                  + `Duration: ${soundtrack.duration}s at ${soundtrack.sampleRate} Hz\n`
                  + `Mixed: ${soundtrack.placed} sound(s)\n`
                  // The drop count rides on the success path, because a file
                  // that wrote fine while missing sounds is the case nobody
                  // goes looking for.
                  + (soundtrack.dropped ? `DROPPED: ${soundtrack.incomplete}\n` : '')
                  + `\nResult: ${JSON.stringify(clean, null, 2)}`,
              }],
            };
          } catch (saveError) {
            const stripped = {
              ...soundtrack,
              wavBase64: `[${soundtrack.byteLength} bytes of WAV — file save failed: ${saveError instanceof Error ? saveError.message : 'unknown error'}]`,
            };
            return executedResult(code, stripped, wavResult.screenshot, soundDescription);
          }
        }

        return executeOrGenerate(code, soundDescription, options, 'pinepaper_sound');
      }

      case 'pinepaper_motion': {
        const input = MotionInputSchema.parse(args);
        const code = codeGenerator.generateMotion(input);
        const described = input.action === 'list'
          ? 'Listed the generator motion catalogue'
          : `Applied motion ${input.motion}`;
        return executeOrGenerate(code, described, options, 'pinepaper_motion');
      }

      case 'pinepaper_path': {
        const input = PathOpInputSchema.parse(args);
        const code = codeGenerator.generatePathOp(input);
        const described = input.action === 'boolean'
          ? `Path boolean (${input.op}) over ${input.itemIds?.length ?? 0} items`
          : `Path ${input.action}${input.itemId ? ` on ${input.itemId}` : ''}`;
        return executeOrGenerate(code, described, options, 'pinepaper_path');
      }

      case 'pinepaper_agent_analyze': {
        const input = AgentAnalyzeInputSchema.parse(args);
        const code = codeGenerator.generateAgentAnalyze(input);
        const description = 'Analyzed canvas content for export recommendations';
        return executeOrGenerate(code, description, options, 'pinepaper_agent_analyze');
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

      // -----------------------------------------------------------------------
      // MAP TOOLS — extracted to src/tools/handlers/maps.ts
      // -----------------------------------------------------------------------

      case 'pinepaper_register_item': {
        const code = codeGenerator.generateRegisterItem({
          itemJson: args.itemJson as object,
          itemType: args.itemType as string,
          properties: args.properties as Record<string, unknown> | undefined,
        });
        return executeOrGenerate(code, 'Registers Paper.js item', options, 'pinepaper_register_item');
      }

      // -----------------------------------------------------------------------
      // TEMPLATE TOOL
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
        // A LOCAL PATH IS THE COMMON CASE AND WAS THE REJECTED ONE.
        //
        // The browser cannot open file:// from a page, so this tool took URLs
        // only — which leaves an agent that has just generated or downloaded
        // ten images with no way in, and no alternative named. The server CAN
        // read the file, so it reads it and hands the page a data URL. Nothing
        // about the page changes; the bytes simply arrive by a route the
        // browser is allowed to use.
        const resolved = await resolveImageSource(parsed.url);
        if ('error' in resolved) {
          return errorResult(ErrorCodes.INVALID_PARAMS, resolved.error, { url: parsed.url }, { toolName: 'pinepaper_import_image' });
        }
        // THE BYTES GO BESIDE THE CODE, NOT INSIDE IT.
        //
        // Inlining the data: URL turned a 3000x800 photo into ~630KB of
        // generated JavaScript. app.runGenerated rewrites what it runs, and its
        // loop-guard transform bails at that size — "Loop-guard transform
        // bailed (unusual syntax)" — after which the run reported
        // itemsCreated: 0 and lost the return value, so the import answered
        // success with no itemId. Smaller photos were fine, which is exactly
        // what made it look like a registration bug rather than a size one.
        const staged = resolved.src.startsWith('data:') && resolved.src.length > 64_000;
        const stageKey = staged ? `img_${Date.now().toString(36)}` : undefined;
        const code = codeGenerator.generateImportImage({
          ...parsed,
          url: staged ? `__ppStage:${stageKey}` : resolved.src,
        });
        return executeOrGenerate(
          code, 'Imports image', options, 'pinepaper_import_image',
          staged ? { [stageKey!]: resolved.src } : undefined,
        );
      }

      // -----------------------------------------------------------------------
      // ONTOLOGY TOOLS — extracted to src/tools/handlers/ontology.ts
      // -----------------------------------------------------------------------

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
            'pinepaper_geometry',
            'pinepaper_construction_sequence',
            'pinepaper_group',
            'pinepaper_camera_director',
            'pinepaper_detect_objects',
            'pinepaper_extract_object',
            'pinepaper_arrange',
            'pinepaper_validate_scene',
            'pinepaper_capture_frames',
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
            'pinepaper_camera',
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
            'pinepaper_scene_graph',
            'pinepaper_sequence',
            'pinepaper_stagger',
            'pinepaper_flip',
            // Agent flow mode tools
            'pinepaper_agent_start_job',
            'pinepaper_agent_end_job',
            'pinepaper_agent_reset',
            'pinepaper_agent_batch_execute',
            'pinepaper_agent_export',
            'pinepaper_agent_analyze',
            // Letter collage tools
            'pinepaper_create_letter_collage',
            'pinepaper_animate_letter_collage',
            // Map tools (5 action-dispatched)
            'pinepaper_map',
            'pinepaper_map_regions',
            'pinepaper_map_animation',
            'pinepaper_map_data',
            'pinepaper_globe',
            // Font tools
            'pinepaper_font',
            // Image import tools
            'pinepaper_import_image',
            // Paper.js direct access tools
            'pinepaper_register_item',
            // On-demand guide & runtime config
            'pinepaper_tool_guide',
            'pinepaper_set_toolkit',
            // Ontology tools
            'pinepaper_get_canvas_ontology',
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
            'pinepaper_background',
            // Canvas query tools
            'pinepaper_query',
            'pinepaper_query_capabilities',
            // Deformation, sprite sheets, interaction
            'pinepaper_deform',
            'pinepaper_sprite_sheet',
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
    } catch (_stateError) {
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
