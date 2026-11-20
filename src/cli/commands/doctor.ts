/**
 * `pinepaper-mcp doctor` — Diagnose Node runtime, browser driver, Chrome binary,
 * Studio connectivity, export folder, and optional FFmpeg add-on.
 */

import { accessSync, constants, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { PinePaperBrowserController, probeBrowserEnvironment } from '../../browser/puppeteer-controller.js';
import { hasFfmpegAddon } from '../../tools/export-file-receipt.js';
import { env } from '../../utils/env.js';
import { getExportDir } from '../../utils/export-dir.js';
import { trustedFetch } from '../../utils/safe-fetch.js';
import { boolFlag, strFlag } from '../args.js';
import { emitJson, formatCheckLine, redactUrl, type CheckStatus } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

export interface DoctorCheck {
  id: string;
  status: CheckStatus;
  label: string;
  detail: string;
  fix?: string;
}

const HELP = `PinePaper Doctor

Diagnose your local environment for PinePaper CLI & MCP usage without modifying files.

USAGE:
  pinepaper-mcp doctor [options]

OPTIONS:
  --offline             Skip network probe against Studio /build.json
  --launch              Also test-launch Chrome and verify live Studio readiness
  --studio-url <url>    Override Studio URL (default: PINEPAPER_STUDIO_URL or https://pinepaper.studio)
  --json                Emit machine-readable JSON output
  -h, --help            Show help`;

function checkNodeRuntime(): DoctorCheck {
  const [maj, min] = process.versions.node.split('.').map(Number);
  const ok = maj > 22 || (maj === 22 && min >= 13);
  return {
    id: 'node',
    status: ok ? 'PASS' : 'FAIL',
    label: 'Node.js runtime',
    detail: ok ? `${process.version} (>= 22.13.0)` : `${process.version} is below the required >= 22.13.0`,
    ...(ok ? {} : { fix: 'Install Node.js 22.13 or newer (e.g. `nvm install 22`).' }),
  };
}

function checkExportFolder(): DoctorCheck {
  const dir = resolve(getExportDir());
  try {
    const target = existsSync(dir) ? dir : dirname(dir);
    accessSync(target, constants.W_OK);
    return {
      id: 'exportDir',
      status: 'PASS',
      label: 'Export folder',
      detail: `${dir} (writable)`,
    };
  } catch (e) {
    return {
      id: 'exportDir',
      status: 'FAIL',
      label: 'Export folder',
      detail: `${dir} is not writable (${e instanceof Error ? e.message : String(e)})`,
      fix: 'Set PINEPAPER_EXPORT_DIR to a writable folder.',
    };
  }
}

async function checkStudioConnectivity(studioUrlRaw: string): Promise<DoctorCheck> {
  // Fetched as given, printed without credentials (a thrown message may quote the URL too).
  const studioUrl = redactUrl(studioUrlRaw);
  const buildUrl = studioUrlRaw.replace(/\/$/, '') + '/build.json';
  const start = Date.now();
  try {
    const res = await trustedFetch(buildUrl, { signal: AbortSignal.timeout(5000) });
    const latencyMs = Date.now() - start;
    if (!res.ok) {
      return {
        id: 'studio',
        status: 'WARN',
        label: 'PinePaper Studio',
        detail: `${studioUrl} answered HTTP ${res.status} (${latencyMs} ms)`,
        fix: 'Check network/proxy (PINEPAPER_PROXY) or try --offline / PINEPAPER_EXECUTION_MODE=code.',
      };
    }
    const info = (await res.json().catch(() => ({}))) as { buildId?: string };
    return {
      id: 'studio',
      status: 'PASS',
      label: 'PinePaper Studio',
      detail: `${studioUrl} reachable in ${latencyMs} ms${info.buildId ? ` (build ${info.buildId})` : ''}`,
    };
  } catch (e) {
    return {
      id: 'studio',
      status: 'WARN',
      label: 'PinePaper Studio',
      detail: `Could not reach ${redactUrl(buildUrl)}: ${redactUrl(e instanceof Error ? e.message : String(e))}`,
      fix: 'Check internet access or proxy, or run in code mode (PINEPAPER_EXECUTION_MODE=code).',
    };
  }
}

export const doctorCommand: CliCommand = {
  name: 'doctor',
  category: 'Setup & Diagnostics',
  summary: 'Check Node.js, Puppeteer, Chrome/Chromium, Studio reachability, and export dir',
  usage: 'pinepaper-mcp doctor [--offline] [--launch] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, doctorCommand, {
      offline: { type: 'boolean' },
      launch: { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const offline = boolFlag(parsed.parsed.flags, 'offline') === true;
    const launch = boolFlag(parsed.parsed.flags, 'launch') === true;
    const studioUrlRaw = strFlag(parsed.parsed.flags, 'studio-url') || env('PINEPAPER_STUDIO_URL') || 'https://pinepaper.studio';
    // The URL is only ever printed without credentials (user:token@host); studioUrlRaw is what is fetched.
    const studioUrl = redactUrl(studioUrlRaw);

    const probe = await probeBrowserEnvironment();
    const checks: DoctorCheck[] = [checkNodeRuntime()];

    if (!probe.driver) {
      checks.push({
        id: 'driver',
        status: 'WARN',
        label: 'Browser driver',
        detail: 'Neither `puppeteer` nor `puppeteer-core` is visible (code mode still works).',
        fix: 'Run `npx -y -p puppeteer -p @pinepaper.studio/mcp-server pinepaper-mcp ...` or `npm i puppeteer`.',
      });
    } else if (!probe.meetsMinVersion) {
      checks.push({
        id: 'driver',
        status: 'FAIL',
        label: 'Browser driver',
        detail: `${probe.driver} v${probe.version} is older than required >= v${probe.minMajor}.`,
        fix: `Upgrade with \`npm i ${probe.driver}@latest\`.`,
      });
    } else {
      checks.push({
        id: 'driver',
        status: 'PASS',
        label: 'Browser driver',
        detail: `${probe.driver}${probe.version ? ` v${probe.version}` : ''} (${probe.source})`,
      });
    }

    if (probe.chromePathEnv) {
      checks.push({
        id: 'browser',
        status: probe.chromePathExists ? 'PASS' : 'FAIL',
        label: 'Browser binary',
        detail: probe.chromePathExists
          ? `PINEPAPER_CHROME_PATH=${probe.chromePathEnv}`
          : `PINEPAPER_CHROME_PATH does not exist: ${probe.chromePathEnv}`,
        ...(probe.chromePathExists ? {} : { fix: 'Point PINEPAPER_CHROME_PATH to a valid Chromium/Chrome executable or unset it.' }),
      });
    } else if (probe.driver === 'puppeteer') {
      checks.push({
        id: 'browser',
        status: 'PASS',
        label: 'Browser binary',
        detail: probe.detectedBrowsers.length
          ? `Puppeteer managed Chrome + detected ${[...new Set(probe.detectedBrowsers.map((b) => b.name))].join(', ')}`
          : 'Puppeteer managed Chrome',
      });
    } else if (probe.detectedBrowsers.length > 0) {
      checks.push({
        id: 'browser',
        status: 'PASS',
        label: 'Browser binary',
        detail: `${probe.detectedBrowsers[0].name} at ${probe.detectedBrowsers[0].path}`,
      });
    } else {
      checks.push({
        id: 'browser',
        status: 'WARN',
        label: 'Browser binary',
        detail: 'No Chrome/Chromium binary detected in standard OS locations.',
        fix: 'Install Google Chrome or set PINEPAPER_CHROME_PATH to Chromium/Edge/Brave.',
      });
    }

    if (offline) {
      checks.push({
        id: 'studio',
        status: 'INFO',
        label: 'PinePaper Studio',
        detail: `Skipped offline check (${studioUrl})`,
      });
    } else {
      checks.push(await checkStudioConnectivity(studioUrlRaw));
    }

    checks.push(checkExportFolder());

    const ffmpeg = await hasFfmpegAddon();
    checks.push({
      id: 'ffmpeg',
      status: ffmpeg ? 'PASS' : 'INFO',
      label: 'FFmpeg add-on',
      detail: ffmpeg
        ? 'Desktop extension runner bundled (.mcpb)'
        : 'Not bundled (npm package starts no child processes by design; Desktop .mcpb bundles ffprobe/ffmpeg helpers)',
    });

    if (launch) {
      const controller = new PinePaperBrowserController({ studioUrl: studioUrlRaw, headless: true });
      const start = Date.now();
      try {
        await controller.connect();
        const probeRes = await controller.executeCode(
          `(function() { return { buildId: app && app.buildId ? app.buildId : null, webCodecs: typeof VideoEncoder === 'function' }; })();`,
          false,
          { bypassGovernor: true },
        );
        const ms = Date.now() - start;
        const val = (probeRes.result ?? {}) as { buildId?: string | null; webCodecs?: boolean };
        checks.push({
          id: 'launch',
          status: probeRes.success ? 'PASS' : 'FAIL',
          label: 'Live launch',
          detail: probeRes.success
            ? `Chrome connected to Studio in ${ms} ms (webCodecs=${val.webCodecs === true}${val.buildId ? `, build=${val.buildId}` : ''})`
            : `Studio probe failed: ${probeRes.error || 'unknown error'}`,
        });
      } catch (e) {
        checks.push({
          id: 'launch',
          status: 'FAIL',
          label: 'Live launch',
          detail: e instanceof Error ? e.message : String(e),
          fix: 'Verify `browser` and `driver` checks above and retry.',
        });
      } finally {
        await controller.disconnect().catch(() => {});
      }
    }

    const ok = !checks.some((c) => c.status === 'FAIL');
    if (parsed.json) {
      emitJson('doctor', { ok, studioUrl, checks });
      return ok ? 0 : 1;
    }

    console.log(`PinePaper Doctor (${studioUrl})\n`);
    for (const c of checks) {
      console.log(formatCheckLine(c.status, c.label, c.detail, c.fix));
    }
    console.log('');
    console.log(ok ? 'Environment is healthy.' : 'One or more required checks failed.');
    return ok ? 0 : 1;
  },
};
