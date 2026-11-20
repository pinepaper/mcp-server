/**
 * Remove the `user:password@` part of any URL in a string, so a Studio URL that carries credentials is never printed.
 * Applies to every URL inside the text (a thrown message may quote one), not only to a bare URL.
 */
export function redactUrl(text: string): string {
  return text.replace(/([a-z][a-z0-9+.-]*:\/\/)[^/?#\s@]*@/gi, '$1');
}
