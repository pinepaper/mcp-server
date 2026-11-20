/**
 * `pinepaper-mcp info` — Print version, build SHA, environment, tools, and driver status.
 */

import { probeBrowserEnvironment } from '../../browser/puppeteer-controller.js';
import { hasFfmpegAddon } from '../../tools/export-file-receipt.js';
import { getToolsForToolkit, getToolsForVerbosity, PINEPAPER_TOOLS } from '../../tools/index.js';
import { TOOLKIT_PROFILES_LIST, type ToolkitProfile } from '../../tools/toolkits.js';
import { capabilityAllowed } from '../../utils/capabilities.js';
import { env } from '../../utils/env.js';
import { getExportDir } from '../../utils/export-dir.js';
import { privateNetworkAllowed } from '../../utils/safe-fetch.js';
import { SERVER_BUILD, SERVER_VERSION, SERVER_VERSION_WITH_BUILD } from '../../version.js';
import { emitJson, redactUrl } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Info

USAGE:
  pinepaper-mcp info [--json]

OPTIONS:
  --json    Emit machine-readable JSON output
  -h, --help  Show help`;

export const infoCommand: CliCommand = {
  name: 'info',
  category: 'Setup & Diagnostics',
  summary: 'Print version, build SHA, tool counts, drivers, and active config',
  usage: 'pinepaper-mcp info [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, infoCommand);
    if (parsed.kind !== 'ok') return parsed.code;

    const compact = getToolsForVerbosity('compact');
    const toolkitCounts: Record<string, number> = {};
    for (const profile of TOOLKIT_PROFILES_LIST) {
      toolkitCounts[profile] = getToolsForToolkit(compact, profile as ToolkitProfile).length;
    }

    const browser = await probeBrowserEnvironment();
    const ffmpegAddon = await hasFfmpegAddon();
    const payload = {
      package: '@pinepaper.studio/mcp-server',
      version: SERVER_VERSION,
      build: SERVER_BUILD,
      versionWithBuild: SERVER_VERSION_WITH_BUILD,
      runtime: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      tools: {
        total: PINEPAPER_TOOLS.length,
        toolkits: toolkitCounts,
      },
      config: {
        executionMode: env('PINEPAPER_EXECUTION_MODE') || 'puppeteer',
        toolkit: env('PINEPAPER_TOOLKIT') || 'core',
        verbosity: env('PINEPAPER_VERBOSITY') || env('PINEPAPER_TOOL_VERBOSITY') || 'compact',
        // Never print credentials a URL may carry (https://user:token@host).
        studioUrl: redactUrl(env('PINEPAPER_STUDIO_URL') || 'https://pinepaper.studio'),
        cloudUrl: env('PINEPAPER_CLOUD_URL') || 'https://cloud.pinepaper.studio',
        exportDir: getExportDir(),
      },
      security: {
        allowCode: capabilityAllowed('code'),
        allowLocalFiles: capabilityAllowed('localFiles'),
        allowPrivateNetwork: privateNetworkAllowed(),
      },
      browser,
      ffmpegAddon,
    };

    if (parsed.json) {
      emitJson('info', payload);
      return 0;
    }

    const driverText = browser.driver
      ? `${browser.driver}${browser.version ? ` v${browser.version}` : ''} (${browser.source})`
      : 'not installed (code mode or install puppeteer)';
    console.log([
      `PinePaper CLI & MCP Server v${SERVER_VERSION_WITH_BUILD}`,
      '',
      `Node.js:         ${payload.runtime.node} (${payload.runtime.platform}/${payload.runtime.arch})`,
      `Tools:           ${payload.tools.total} total (core: ${toolkitCounts.core}, agent: ${toolkitCounts.agent}, minimal: ${toolkitCounts.minimal})`,
      `Execution mode:  ${payload.config.executionMode}`,
      `Toolkit / Detail:${' '}${payload.config.toolkit} / ${payload.config.verbosity}`,
      `Studio URL:      ${payload.config.studioUrl}`,
      `Export folder:   ${payload.config.exportDir}`,
      `Browser driver:  ${driverText}`,
      `Local browsers:  ${browser.detectedBrowsers.length ? [...new Set(browser.detectedBrowsers.map((b) => b.name))].join(', ') : 'none detected in standard paths'}`,
      `FFmpeg runner:   ${ffmpegAddon ? 'bundled (.mcpb)' : 'not bundled (npm package starts no child processes)'}`,
      `Security flags:  allowCode=${payload.security.allowCode}, allowLocalFiles=${payload.security.allowLocalFiles}, allowPrivateNetwork=${payload.security.allowPrivateNetwork}`,
    ].join('\n'));
    return 0;
  },
};
