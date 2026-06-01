/**
 * Studio URL helpers shared between the browser_connect handler and tests.
 *
 * Centralized to avoid the substring/indexOf comparison that incorrectly
 * matched port-prefixes (e.g. stored ":30000" swallowing requested ":3000")
 * and to enforce the http(s)-only scheme guard in a single place.
 */

export type StudioUrlValidation =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function validateStudioUrl(raw: string): StudioUrlValidation {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: `Invalid Studio URL: ${raw}` };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      error: `Studio URL must use http:// or https:// (got ${parsed.protocol}).`,
    };
  }
  return { ok: true, url: raw };
}

/**
 * Returns true if `requested` points to the same Studio target as `stored`.
 *
 * Compares URL.origin (scheme + host + port) so different ports never
 * substring-match each other, and pathname only when the caller supplied one
 * (the PuppeteerController appends "/editor" + agent query params after
 * connect, which would otherwise look like a path mismatch on an idempotent
 * reconnect).
 */
export function sameStudioTarget(stored: string | undefined, requested: string | undefined): boolean {
  if (!stored || !requested) return !stored && !requested;
  let storedUrl: URL;
  let requestedUrl: URL;
  try {
    storedUrl = new URL(stored);
    requestedUrl = new URL(requested);
  } catch {
    return stored === requested;
  }
  const path = (u: URL) => u.pathname.replace(/\/+$/, '') || '/';
  const userHasPath = path(requestedUrl) !== '/';
  return (
    storedUrl.origin === requestedUrl.origin &&
    (!userHasPath || path(storedUrl) === path(requestedUrl))
  );
}
