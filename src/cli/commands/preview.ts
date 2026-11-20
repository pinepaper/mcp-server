/**
 * `pinepaper-mcp preview [file-or-dir]` — Open a visible PinePaper Studio browser,
 * load a scene or batch onto the canvas, and optionally watch for file edits.
 */

import { watch, type FSWatcher } from 'node:fs';
import { PinePaperBrowserController } from '../../browser/puppeteer-controller.js';
import { handleToolCall, type HandlerOptions } from '../../tools/handlers.js';
import { env } from '../../utils/env.js';
import { boolFlag, strFlag } from '../args.js';
import { emitJson, failWith, redactUrl, resolveSceneInput, type ResolvedSceneInput } from '../output.js';
import { loadSceneIntoStudio, withScopedCapabilities } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Interactive Preview

Open PinePaper Studio in a visible browser window and load your scene.

USAGE:
  pinepaper-mcp preview [file-or-dir] [options]

OPTIONS:
  --watch               Reload automatically whenever the scene file changes
  --play                Start timeline playback immediately after loading
  --allow-code          Allow custom relations/hooks in loaded scene
  --allow-local-files   Let the preview read local files (a saved .pinepaper.json project, image paths); off by default
  --studio-url <url>    Override Studio URL
  --json                Emit initial load status as JSON (with --watch, stays open)
  -h, --help            Show help`;

export const previewCommand: CliCommand = {
  name: 'preview',
  category: 'Authoring & Preview',
  summary: 'Open visible PinePaper Studio with the scene loaded and optional --watch reload',
  usage: 'pinepaper-mcp preview [file-or-dir] [--watch] [--play]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, previewCommand, {
      watch: { type: 'boolean', short: 'w' },
      play: { type: 'boolean' },
      'allow-code': { type: 'boolean' },
      'allow-local-files': { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    let input: ResolvedSceneInput;
    try {
      input = resolveSceneInput(parsed.parsed.positionals[0] || '.');
    } catch (e) {
      return failWith(parsed.json, 'preview', e instanceof Error ? e.message : String(e), 1);
    }

    const doWatch = boolFlag(parsed.parsed.flags, 'watch') === true;
    const autoPlay = boolFlag(parsed.parsed.flags, 'play') === true;
    const allowCode = boolFlag(parsed.parsed.flags, 'allow-code') === true;
    const allowLocalFiles = boolFlag(parsed.parsed.flags, 'allow-local-files') === true;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url') || env('PINEPAPER_STUDIO_URL') || 'https://pinepaper.studio';

    const controller = new PinePaperBrowserController({
      studioUrl,
      headless: false,
      waitUntil: 'domcontentloaded',
      governor: env('PINEPAPER_GOVERNOR')?.trim().toLowerCase() !== 'off',
    });

    let watcher: FSWatcher | null = null;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = async () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (pollTimer) clearInterval(pollTimer);
      watcher?.close();
      await controller.disconnect().catch(() => {});
    };

    return withScopedCapabilities({ localFiles: allowLocalFiles, code: allowCode }, async () => {
      try {
        await controller.connect();
        const handlerOpts: HandlerOptions = {
          executeInBrowser: true,
          browserController: controller,
          executionMode: 'puppeteer',
          screenshotMode: 'never',
        };

        const initial = await loadSceneIntoStudio(input, handlerOpts, allowCode);
        if (!initial.ok) {
          if (parsed.json) emitJson('preview', { ok: false, error: initial.error });
          else console.error(`Failed to load scene: ${initial.error}`);
          await cleanup();
          return 1;
        }

        if (autoPlay) {
          await handleToolCall('pinepaper_play_timeline', { action: 'play' }, handlerOpts);
        }

        if (parsed.json) {
          emitJson('preview', { ok: true, file: input.filePath, studioUrl: redactUrl(studioUrl), loadMs: initial.loadMs, watching: doWatch });
        } else {
          console.log(`Preview open in PinePaper Studio: ${input.filePath} (loaded in ${initial.loadMs} ms)`);
          if (doWatch) console.log(`Watching ${input.filePath} for changes...`);
          console.log('Press Ctrl+C or close the browser window to exit.');
        }

        let reloading = false;
        const triggerReload = () => {
          if (reloading || !controller.connected) return;
          reloading = true;
          void (async () => {
            try {
              const latest = resolveSceneInput(input.filePath);
              const res = await loadSceneIntoStudio(latest, handlerOpts, allowCode);
              if (!res.ok) {
                console.error(`[preview] reload error: ${res.error}`);
              } else {
                if (autoPlay) await handleToolCall('pinepaper_play_timeline', { action: 'play' }, handlerOpts);
                console.error(`[preview] reloaded ${latest.filePath} in ${res.loadMs} ms`);
              }
            } catch (e) {
              console.error(`[preview] skipped reload: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
              reloading = false;
            }
          })();
        };

        if (doWatch) {
          watcher = watch(input.filePath, () => {
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(triggerReload, 250);
          });
        }

        await new Promise<void>((resolveWait) => {
          const onSignal = () => {
            process.off('SIGINT', onSignal);
            process.off('SIGTERM', onSignal);
            resolveWait();
          };
          process.on('SIGINT', onSignal);
          process.on('SIGTERM', onSignal);
          pollTimer = setInterval(() => {
            if (!controller.connected) {
              process.off('SIGINT', onSignal);
              process.off('SIGTERM', onSignal);
              resolveWait();
            }
          }, 1000);
        });

        await cleanup();
        return 0;
      } catch (e) {
        console.error(`pinepaper-mcp preview: ${e instanceof Error ? e.message : String(e)}`);
        await cleanup();
        return 1;
      }
    });
  },
};
