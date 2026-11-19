/**
 * `pinepaper-mcp browser [status|verify]` — Inspect browser drivers,
 * local Chrome/Chromium installations, and verify live headless Studio launch.
 */

import { PinePaperBrowserController, probeBrowserEnvironment } from '../../browser/puppeteer-controller.js';
import { env } from '../../utils/env.js';
import { strFlag } from '../args.js';
import { emitJson } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Browser Diagnostics

Inspect installed Puppeteer drivers and Chrome/Chromium binaries, or test-launch Studio.

USAGE:
  pinepaper-mcp browser [status|verify] [options]

SUBACTIONS:
  status    Show Puppeteer driver, detected browsers, and install commands (default)
  verify    Launch headless Chrome against Studio and probe VideoEncoder / WebGL2

OPTIONS:
  --studio-url <url>    Override Studio URL (default: PINEPAPER_STUDIO_URL or https://pinepaper.studio)
  --json                Emit machine-readable JSON output
  -h, --help            Show help`;

const INSTALL_HINTS = {
  npx: 'npx -y -p puppeteer -p @pinepaper.studio/mcp-server pinepaper-mcp',
  global: 'npm install -g @pinepaper.studio/mcp-server puppeteer',
  project: 'npm install puppeteer @pinepaper.studio/mcp-server',
  strictLayout: 'PINEPAPER_PUPPETEER_FROM=/path/to/your/project',
  customBrowser: 'PINEPAPER_CHROME_PATH=/path/to/chrome-or-chromium',
  codeOnly: 'PINEPAPER_EXECUTION_MODE=code',
};

export const browserCommand: CliCommand = {
  name: 'browser',
  category: 'Setup & Diagnostics',
  summary: 'Inspect Puppeteer / Chrome setup or verify live headless Studio launch',
  usage: 'pinepaper-mcp browser [status|verify] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, browserCommand, {
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const action = (parsed.parsed.positionals[0] || 'status').toLowerCase();
    if (action !== 'status' && action !== 'verify') {
      console.error(`pinepaper-mcp browser: unknown subaction "${action}". Use "status" or "verify".`);
      return 2;
    }

    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url') || env('PINEPAPER_STUDIO_URL') || 'https://pinepaper.studio';
    const probe = await probeBrowserEnvironment();

    if (action === 'status') {
      if (parsed.json) {
        emitJson('browser', { action: 'status', studioUrl, probe, install: INSTALL_HINTS });
        return 0;
      }
      console.log('PinePaper Browser Environment\n');
      console.log(`Driver:            ${probe.driver ? `${probe.driver}${probe.version ? ` v${probe.version}` : ''} (${probe.source})` : 'none installed'}`);
      console.log(`Minimum version:   >= ${probe.minMajor} (${probe.driver ? (probe.meetsMinVersion ? 'OK' : 'TOO OLD') : 'N/A'})`);
      console.log(`PINEPAPER_CHROME_PATH:      ${probe.chromePathEnv ? `${probe.chromePathEnv} (${probe.chromePathExists ? 'exists' : 'MISSING'})` : 'unset'}`);
      console.log(`PINEPAPER_PUPPETEER_FROM:   ${probe.puppeteerFromEnv || 'unset'}`);
      console.log(`Detected browsers: ${probe.detectedBrowsers.length ? probe.detectedBrowsers.map((b) => `${b.name} (${b.path})`).join('\n                   ') : 'none in standard paths'}`);
      console.log('\nInstall / Setup Options:');
      console.log(`  npx with Puppeteer:   ${INSTALL_HINTS.npx}`);
      console.log(`  Global install:       ${INSTALL_HINTS.global}`);
      console.log(`  pnpm/Yarn strict:     ${INSTALL_HINTS.strictLayout}`);
      console.log(`  Custom browser:       ${INSTALL_HINTS.customBrowser}`);
      console.log(`  Code-only (no Chrome): ${INSTALL_HINTS.codeOnly}`);
      return 0;
    }

    const controller = new PinePaperBrowserController({ studioUrl, headless: true });
    const start = Date.now();
    try {
      await controller.connect();
      const evalRes = await controller.executeCode(
        `(function() {
          var gl = false;
          try { var c = document.createElement('canvas'); gl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) {}
          return {
            ready: typeof app !== 'undefined' && typeof app.create === 'function',
            buildId: (typeof app !== 'undefined' && app.buildId) ? app.buildId : null,
            webCodecs: typeof VideoEncoder === 'function',
            webGL: gl
          };
        })();`,
        false,
        { bypassGovernor: true },
      );
      const elapsedMs = Date.now() - start;
      const details = (evalRes.result ?? {}) as { ready?: boolean; buildId?: string | null; webCodecs?: boolean; webGL?: boolean };
      const ok = evalRes.success && details.ready === true;

      if (parsed.json) {
        emitJson('browser', { action: 'verify', ok, studioUrl, elapsedMs, probe, capabilities: details, error: evalRes.error });
        return ok ? 0 : 1;
      }
      if (!ok) {
        console.error(`Browser verification failed: ${evalRes.error || 'Studio app.create unavailable'}`);
        return 1;
      }
      console.log([
        `Browser verification succeeded (${elapsedMs} ms)`,
        `  Studio URL:   ${studioUrl}`,
        `  Studio Build: ${details.buildId || 'unknown'}`,
        `  WebCodecs:    ${details.webCodecs ? 'available (MP4/WebM export ready)' : 'unavailable (SVG/GIF/PNG work; MP4 needs WebCodecs)'}`,
        `  WebGL:        ${details.webGL ? 'available' : 'unavailable'}`,
      ].join('\n'));
      return 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) {
        emitJson('browser', { action: 'verify', ok: false, studioUrl, probe, error: msg });
      } else {
        console.error(`Browser launch failed: ${msg}`);
      }
      return 1;
    } finally {
      await controller.disconnect().catch(() => {});
    }
  },
};
