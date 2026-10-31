/**
 * The one place this server reads its environment (PINEPAPER_*, and the locale
 * variables). Read at call time, never cached, so a value set after start-up is
 * seen. Kept in one module so the package's environment access is one
 * reviewable file rather than one per feature. safe-fetch.ts keeps its own
 * reader: it is bundled on its own and takes no relative imports.
 */
export function env(name: string): string | undefined {
  return process.env[name];
}
