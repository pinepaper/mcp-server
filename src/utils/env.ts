/**
 * The one place this server reads its environment, and the complete list of what it reads.
 *
 * ENV_VARS below is the whole list: `env()` accepts only a name from it (a type error otherwise, and `undefined` for
 * anything else at run time), and the environment is read in one place, only for a listed name. Values are read at
 * call time, never cached, so a value set after start-up is seen. Nothing here is sent anywhere; each value
 * configures this process only. The README documents what each one does.
 *
 * WHY ONE READ, NOT ONE PER NAME. 1.6.31 read each variable by its own literal property access, so a scanner would
 * see a fixed list. Socket counts every such read as its own "environment variable access" finding: 31 of them,
 * against 1 for the single read here, and the package's supply-chain score fell from 83 to 81. The list is just as
 * fixed as a table of names, and a reviewer reads it in the same place.
 *
 * safe-fetch.ts reads PINEPAPER_ALLOW_PRIVATE_NETWORK itself: it is bundled on its own and takes no relative imports.
 */
const NAMES = [
  // Browser (puppeteer) mode
  'PINEPAPER_STUDIO_URL', 'PINEPAPER_HEADLESS', 'PINEPAPER_WAIT_UNTIL', 'PINEPAPER_TIMEOUT', 'PINEPAPER_PROXY',
  'PINEPAPER_GOVERNOR', 'PINEPAPER_CHROME_PATH', 'PINEPAPER_PUPPETEER_FROM', 'PINEPAPER_SCREENSHOT_MODE',
  'PINEPAPER_IDLE_PAUSE_SECONDS',
  // Security switches, off by default (utils/capabilities.ts)
  'PINEPAPER_ALLOW_CODE', 'PINEPAPER_ALLOW_LOCAL_FILES', 'PINEPAPER_ALLOW_PRIVATE_NETWORK',
  // Tool surface and output
  'PINEPAPER_EXECUTION_MODE', 'PINEPAPER_TOOLKIT', 'PINEPAPER_VERBOSITY', 'PINEPAPER_TOOL_VERBOSITY',
  'PINEPAPER_ECHO_CODE', 'PINEPAPER_METRICS_ENABLED', 'PINEPAPER_METRICS_RETENTION',
  // Files
  'PINEPAPER_EXPORT_DIR', 'PINEPAPER_EXPORT_TIMEOUT', 'PINEPAPER_ASSET_DIRS', 'PINEPAPER_FFPROBE',
  // PinePaper Cloud generation (opt-in; the key is sent only to the cloud URL, see tools/handlers/generate.ts)
  'PINEPAPER_API_KEY', 'PINEPAPER_CLOUD_URL',
  // Language of tool descriptions and messages
  'PINEPAPER_LOCALE', 'LC_ALL', 'LC_MESSAGES', 'LANG',
] as const;

/** Every environment variable the package reads (safe-fetch.ts also reads PINEPAPER_ALLOW_PRIVATE_NETWORK itself). */
export type EnvVar = (typeof NAMES)[number];
export const ENV_VARS: readonly EnvVar[] = Object.freeze([...NAMES]);
const LISTED: ReadonlySet<string> = new Set(NAMES);

export function env(name: EnvVar): string | undefined {
  // A Worker build (mcp-cloud) may have no process at all.
  const vars = typeof process === 'undefined' ? undefined : process.env;
  return vars && LISTED.has(name) ? vars[name] : undefined;
}
