/**
 * Each tool's handler body, read from source: a `case 'pinepaper_x':` in handlers.ts, or a `pinepaper_x:` entry
 * (inline or a named dispatch function) in tools/handlers/*.ts. Shared by the top-level and nested ignored-argument
 * coverage tests.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';
import { BeatCutsArgsSchema } from '../../tools/handlers/beats.js';
import { GenerateArgsSchema, GenerateEstimateArgsSchema } from '../../tools/handlers/generate.js';

const TOOLS_DIR = join(import.meta.dir, '../../tools');
export const LOCAL_SCHEMAS: Record<string, z.ZodTypeAny> = { BeatCutsArgsSchema, GenerateArgsSchema, GenerateEstimateArgsSchema };

export function handlerBodies(): Map<string, string> {
  const bodies = new Map<string, string>();
  // handlers.ts: consecutive case labels share the body that follows them.
  let labels: string[] = [];
  let buf: string[] = [];
  let inBody = false;
  const flush = () => { for (const l of labels) bodies.set(l, (bodies.get(l) ?? '') + buf.join('\n')); labels = []; buf = []; inBody = false; };
  for (const line of readFileSync(join(TOOLS_DIR, 'handlers.ts'), 'utf8').split('\n')) {
    const m = line.match(/^\s{6}case '(pinepaper_\w+)':/);
    if (m) { if (inBody) flush(); labels.push(m[1]!); continue; }
    if (/^\s{6}default:/.test(line)) { flush(); continue; }
    if (labels.length) { inBody = true; buf.push(line); }
  }
  flush();
  // Domain modules: `pinepaper_x: async (args, …) => {…}` or `pinepaper_x: dispatchX`.
  const fnBody = (src: string, name: string) => {
    const i = src.search(new RegExp(`(?:^|\\n)(?:export )?(?:async )?(?:function ${name}\\b|const ${name}\\b)`));
    if (i < 0) return '';
    const rest = src.slice(i + 1);
    const j = rest.slice(1).search(/\n(?:export |async function |function |const [A-Za-z_]+\s*[:=])/);
    return j < 0 ? rest : rest.slice(0, j + 1);
  };
  for (const f of readdirSync(join(TOOLS_DIR, 'handlers')).filter((n) => n.endsWith('.ts'))) {
    const src = readFileSync(join(TOOLS_DIR, 'handlers', f), 'utf8');
    for (const m of src.matchAll(/\n\s+'?(pinepaper_\w+)'?:\s*(async\b|[A-Za-z_]\w*)/g)) {
      if (bodies.has(m[1]!)) continue;
      if (m[2] === 'async') {
        const start = m.index! + 1;
        const next = src.slice(start + 1).search(/\n\s+'?pinepaper_\w+'?:\s*(?:async\b|[A-Za-z_]\w*[,\n])/);
        bodies.set(m[1]!, next < 0 ? src.slice(start) : src.slice(start, start + 1 + next));
      } else {
        const b = fnBody(src, m[2]!);
        if (b) bodies.set(m[1]!, b);
      }
    }
  }
  return bodies;
}

