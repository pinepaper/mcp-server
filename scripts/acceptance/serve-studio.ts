/**
 * Serve a built PinePaper Studio (FxTool `npm run build` → dist/) on localhost, so an
 * acceptance run drives a studio this machine has, not production.
 *
 *   bun scripts/acceptance/serve-studio.ts <dist-dir> [port]
 *
 * Clean URLs as Cloudflare Pages serves them: /editor → editor.html.
 */
import { existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';

export function serveStudio(dist: string, port = 0): { url: string; stop: () => void } {
  const root = normalize(dist);
  const server = Bun.serve({
    port,
    hostname: '127.0.0.1',
    fetch(req) {
      const path = decodeURIComponent(new URL(req.url).pathname);
      const candidates = [path, `${path}.html`, join(path, 'index.html')];
      for (const c of candidates) {
        const file = normalize(join(root, c));
        if (!file.startsWith(root)) return new Response('forbidden', { status: 403 });
        if (existsSync(file) && statSync(file).isFile()) return new Response(Bun.file(file));
      }
      return new Response('not found', { status: 404 });
    },
  });
  return { url: `http://127.0.0.1:${server.port}`, stop: () => server.stop(true) };
}

if (import.meta.main) {
  const [dist, port] = process.argv.slice(2);
  if (!dist) { console.error('usage: bun scripts/acceptance/serve-studio.ts <dist-dir> [port]'); process.exit(2); }
  const s = serveStudio(dist, Number(port) || 8091);
  console.error(`studio: ${s.url}/editor`);
}
