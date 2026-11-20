/**
 * Shared browser session and scene-loading helpers for CLI commands
 * (check, render, snapshot, preview, benchmark).
 */

import { PinePaperBrowserController, resetBrowserController } from '../browser/puppeteer-controller.js';
import { handleToolCall, type HandlerOptions } from '../tools/handlers.js';
import { capabilityAllowed, setCapability } from '../utils/capabilities.js';
import { env } from '../utils/env.js';
import { extractToolJson, type ResolvedSceneInput } from './output.js';

export interface RunSessionOptions {
  studioUrl?: string;
  headless?: boolean;
  timeout?: number;
  allowCode?: boolean;
  allowLocalFiles?: boolean;
}

/** Temporarily enable capabilities only when not already enabled, restoring on exit. */
export async function withScopedCapabilities<T>(
  want: { code?: boolean; localFiles?: boolean },
  fn: () => Promise<T>,
): Promise<T> {
  const undo: Array<() => void> = [];
  if (want.localFiles && !capabilityAllowed('localFiles')) {
    setCapability('localFiles', true);
    undo.push(() => setCapability('localFiles', undefined));
  }
  if (want.code && !capabilityAllowed('code')) {
    setCapability('code', true);
    undo.push(() => setCapability('code', undefined));
  }
  try {
    return await fn();
  } finally {
    for (const restore of undo) restore();
  }
}

/** The capabilities a CLI browser session turns on: only what the command was explicitly given. */
export function cliCapabilities(opts: Pick<RunSessionOptions, 'allowLocalFiles' | 'allowCode'>): { localFiles: boolean; code: boolean } {
  // Local files are off unless asked for (--allow-local-files or PINEPAPER_ALLOW_LOCAL_FILES=1), as the help text says.
  return { localFiles: opts.allowLocalFiles === true, code: opts.allowCode === true };
}

/** Run `fn` against a dedicated browser controller and guarantee teardown. */
export async function withCliBrowser<T>(
  opts: RunSessionOptions,
  fn: (controller: PinePaperBrowserController, handlerOpts: HandlerOptions) => Promise<T>,
): Promise<T> {
  const studioUrl = opts.studioUrl || env('PINEPAPER_STUDIO_URL') || 'https://pinepaper.studio';
  const controller = new PinePaperBrowserController({
    studioUrl,
    headless: opts.headless ?? true,
    timeout: opts.timeout,
    waitUntil: 'domcontentloaded',
    governor: env('PINEPAPER_GOVERNOR')?.trim().toLowerCase() !== 'off',
  });

  return withScopedCapabilities(
    cliCapabilities(opts),
    async () => {
      try {
        await controller.connect();
        const handlerOpts: HandlerOptions = {
          executeInBrowser: true,
          browserController: controller,
          executionMode: 'puppeteer',
          screenshotMode: 'never',
        };
        return await fn(controller, handlerOpts);
      } finally {
        await controller.disconnect().catch(() => {});
        await resetBrowserController().catch(() => {});
      }
    },
  );
}

export function normalizeBatchPayload(parsed: unknown): Record<string, unknown> {
  if (Array.isArray(parsed)) return { operations: parsed };
  return { ...(parsed as Record<string, unknown>) };
}

/** The words that name the CLI flag, appended wherever the server refused a local-file read. */
export const LOCAL_FILES_HINT = 'Pass --allow-local-files (or set PINEPAPER_ALLOW_LOCAL_FILES=1) to let this command read local files.';

/** An error from a load that was refused for lack of the local-files capability, naming the CLI flag that turns it on. */
export function withLocalFilesHint(error: string): string {
  return /PINEPAPER_ALLOW_LOCAL_FILES/.test(error) && !/--allow-local-files/.test(error) ? `${error}\n${LOCAL_FILES_HINT}` : error;
}

export interface LoadSceneResult {
  ok: boolean;
  loadMs: number;
  summary: unknown;
  error?: string;
}

/** Reset the Studio canvas and load a saved project or batch operations file. */
export async function loadSceneIntoStudio(
  input: ResolvedSceneInput,
  handlerOpts: HandlerOptions,
  allowCode = false,
): Promise<LoadSceneResult> {
  const start = Date.now();
  await handleToolCall('pinepaper_agent_reset', { preserveBackground: false }, handlerOpts);

  if (input.kind === 'batch' && input.projectConfig?.canvas) {
    const c = input.projectConfig.canvas;
    if (c.preset) {
      await handleToolCall('pinepaper_set_canvas_size', { preset: c.preset }, handlerOpts);
    } else if (typeof c.width === 'number' && typeof c.height === 'number') {
      await handleToolCall('pinepaper_set_canvas_size', { width: c.width, height: c.height }, handlerOpts);
    }
    if (typeof c.backgroundColor === 'string' && c.backgroundColor.trim()) {
      await handleToolCall('pinepaper_set_background_color', { color: c.backgroundColor }, handlerOpts);
    }
  }

  let res;
  if (input.kind === 'project') {
    res = await handleToolCall(
      'pinepaper_import_scene',
      { path: input.filePath, registerCustomRelations: allowCode },
      handlerOpts,
    );
  } else {
    res = await handleToolCall(
      'pinepaper_agent_batch_execute',
      normalizeBatchPayload(input.parsed),
      handlerOpts,
    );
  }

  const extracted = extractToolJson(res);
  const loadMs = Date.now() - start;
  if (!extracted.ok) {
    return { ok: false, loadMs, summary: extracted.data, error: withLocalFilesHint(extracted.text || 'Failed to load scene.') };
  }
  return { ok: true, loadMs, summary: extracted.data };
}
