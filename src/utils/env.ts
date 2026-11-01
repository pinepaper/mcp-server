/**
 * The one place this server reads its environment, and the complete list of what it reads.
 *
 * Every variable is a literal `process.env.NAME` below, so the list a reviewer reads IS the code that runs: there is
 * no lookup by a computed name, and `env()` accepts only a name from this table (a type error otherwise, and
 * `undefined` for anything else at run time). Values are read at call time, never cached, so a value set after
 * start-up is seen. Nothing here is sent anywhere; each value configures this process only. The README documents
 * what each one does.
 *
 * safe-fetch.ts reads PINEPAPER_ALLOW_PRIVATE_NETWORK itself, also as a literal: it is bundled on its own and takes
 * no relative imports.
 */
const READERS = {
  // Browser (puppeteer) mode
  PINEPAPER_STUDIO_URL: () => process.env.PINEPAPER_STUDIO_URL,
  PINEPAPER_HEADLESS: () => process.env.PINEPAPER_HEADLESS,
  PINEPAPER_WAIT_UNTIL: () => process.env.PINEPAPER_WAIT_UNTIL,
  PINEPAPER_TIMEOUT: () => process.env.PINEPAPER_TIMEOUT,
  PINEPAPER_PROXY: () => process.env.PINEPAPER_PROXY,
  PINEPAPER_GOVERNOR: () => process.env.PINEPAPER_GOVERNOR,
  PINEPAPER_CHROME_PATH: () => process.env.PINEPAPER_CHROME_PATH,
  PINEPAPER_PUPPETEER_FROM: () => process.env.PINEPAPER_PUPPETEER_FROM,
  PINEPAPER_SCREENSHOT_MODE: () => process.env.PINEPAPER_SCREENSHOT_MODE,
  PINEPAPER_IDLE_PAUSE_SECONDS: () => process.env.PINEPAPER_IDLE_PAUSE_SECONDS,
  // Security switches, off by default (utils/capabilities.ts)
  PINEPAPER_ALLOW_CODE: () => process.env.PINEPAPER_ALLOW_CODE,
  PINEPAPER_ALLOW_LOCAL_FILES: () => process.env.PINEPAPER_ALLOW_LOCAL_FILES,
  PINEPAPER_ALLOW_PRIVATE_NETWORK: () => process.env.PINEPAPER_ALLOW_PRIVATE_NETWORK,
  // Tool surface and output
  PINEPAPER_EXECUTION_MODE: () => process.env.PINEPAPER_EXECUTION_MODE,
  PINEPAPER_TOOLKIT: () => process.env.PINEPAPER_TOOLKIT,
  PINEPAPER_VERBOSITY: () => process.env.PINEPAPER_VERBOSITY,
  PINEPAPER_TOOL_VERBOSITY: () => process.env.PINEPAPER_TOOL_VERBOSITY,
  PINEPAPER_ECHO_CODE: () => process.env.PINEPAPER_ECHO_CODE,
  PINEPAPER_METRICS_ENABLED: () => process.env.PINEPAPER_METRICS_ENABLED,
  PINEPAPER_METRICS_RETENTION: () => process.env.PINEPAPER_METRICS_RETENTION,
  // Files
  PINEPAPER_EXPORT_DIR: () => process.env.PINEPAPER_EXPORT_DIR,
  PINEPAPER_EXPORT_TIMEOUT: () => process.env.PINEPAPER_EXPORT_TIMEOUT,
  PINEPAPER_ASSET_DIRS: () => process.env.PINEPAPER_ASSET_DIRS,
  PINEPAPER_FFPROBE: () => process.env.PINEPAPER_FFPROBE,
  // PinePaper Cloud generation (opt-in; the key is sent only to the cloud URL, see tools/handlers/generate.ts)
  PINEPAPER_API_KEY: () => process.env.PINEPAPER_API_KEY,
  PINEPAPER_CLOUD_URL: () => process.env.PINEPAPER_CLOUD_URL,
  // Language of tool descriptions and messages
  PINEPAPER_LOCALE: () => process.env.PINEPAPER_LOCALE,
  LC_ALL: () => process.env.LC_ALL,
  LC_MESSAGES: () => process.env.LC_MESSAGES,
  LANG: () => process.env.LANG,
} as const;

/** Every environment variable the package reads (safe-fetch.ts also reads PINEPAPER_ALLOW_PRIVATE_NETWORK itself). */
export type EnvVar = keyof typeof READERS;
export const ENV_VARS = Object.freeze(Object.keys(READERS) as EnvVar[]);

export function env(name: EnvVar): string | undefined {
  // A Worker build (mcp-cloud) may have no process at all.
  if (typeof process === 'undefined' || !process.env) return undefined;
  return Object.prototype.hasOwnProperty.call(READERS, name) ? READERS[name]() : undefined;
}
