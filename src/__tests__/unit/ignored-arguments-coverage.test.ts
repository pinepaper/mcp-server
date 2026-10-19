/**
 * Every tool reports the top-level arguments it dropped (issue #14), and never
 * reports one it reads.
 *
 * The runtime check trusts each tool's published JSON schema plus
 * HIDDEN_ARGUMENTS. This test is what makes that safe: it pairs every tool with
 * its handler body — a `case 'pinepaper_x':` in handlers.ts, or a
 * `pinepaper_x:` entry (inline or a named dispatch function) in
 * tools/handlers/*.ts — and collects what that body accepts: the keys of every
 * zod schema it parses `args` with, and every `args.x` it reads directly. Any
 * accepted key that is not published must be in HIDDEN_ARGUMENTS, or the note
 * would tell a caller a working argument "had no effect".
 *
 * HIDDEN_ARGUMENTS is shrink-only: an entry that is no longer needed fails too.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import * as schemas from '../../types/schemas.js';
import { BeatCutsArgsSchema } from '../../tools/handlers/beats.js';
import { GenerateArgsSchema, GenerateEstimateArgsSchema } from '../../tools/handlers/generate.js';
import {
  handleToolCall, HIDDEN_ARGUMENTS, PASSTHROUGH_ARGUMENT_TOOLS, IGNORED_ARGUMENTS_META_KEY,
} from '../../tools/handlers.js';

const TOOLS_DIR = join(import.meta.dir, '../../tools');
const LOCAL_SCHEMAS: Record<string, z.ZodTypeAny> = { BeatCutsArgsSchema, GenerateArgsSchema, GenerateEstimateArgsSchema };
/** Dispatched by the server (index.ts) before handleToolCall, so never noted. */
const NOT_THROUGH_HANDLE_TOOL_CALL = new Set(['pinepaper_set_toolkit']);

function handlerBodies(): Map<string, string> {
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

function unwrap(t: z.ZodTypeAny | undefined): z.ZodTypeAny | undefined {
  let cur = t;
  for (;;) {
    if (cur instanceof z.ZodEffects) cur = cur._def.schema;
    else if (cur instanceof z.ZodOptional || cur instanceof z.ZodDefault) cur = cur._def.innerType;
    else return cur;
  }
}

function survey() {
  const bodies = handlerBodies();
  const unlocated: string[] = [];
  const unreadable: string[] = [];
  const passthrough = new Set<string>();
  const hidden: Record<string, string[]> = {};
  for (const tool of PINEPAPER_TOOLS) {
    if (NOT_THROUGH_HANDLE_TOOL_CALL.has(tool.name)) continue;
    const body = bodies.get(tool.name);
    if (!body) { unlocated.push(tool.name); continue; }
    const published = new Set(Object.keys((tool.inputSchema as { properties?: object }).properties ?? {}));
    const accepted = new Set<string>();
    for (const m of body.matchAll(/(\w+Schema)\.(?:safeParse|parse)\(\s*args\b/g)) {
      const obj = unwrap(((schemas as Record<string, unknown>)[m[1]!] ?? LOCAL_SCHEMAS[m[1]!]) as z.ZodTypeAny | undefined);
      if (!(obj instanceof z.ZodObject)) { unreadable.push(`${tool.name}: ${m[1]}`); continue; }
      if (obj._def.unknownKeys === 'passthrough') passthrough.add(tool.name);
      for (const k of Object.keys(obj.shape)) accepted.add(k);
    }
    for (const m of body.matchAll(/\bargs\??\.(\w+)/g)) accepted.add(m[1]!);
    for (const m of body.matchAll(/\bargs\[['"](\w+)['"]\]/g)) accepted.add(m[1]!);
    const extra = [...accepted].filter((k) => !published.has(k)).sort();
    if (extra.length) hidden[tool.name] = extra;
  }
  return { bodies, unlocated, unreadable, passthrough, hidden };
}

describe('every tool reports dropped top-level arguments (issue #14)', () => {
  const s = survey();

  it('finds a handler body for every tool', () => {
    expect(s.unlocated).toEqual([]);
    expect(s.bodies.size).toBeGreaterThan(150);
  });

  it('can read every schema a handler parses args with', () => {
    expect(s.unreadable).toEqual([]);
  });

  it('HIDDEN_ARGUMENTS is exactly the keys handlers accept without publishing them', () => {
    const declared = Object.fromEntries(Object.entries(HIDDEN_ARGUMENTS).map(([k, v]) => [k, [...v].sort()]));
    for (const t of PASSTHROUGH_ARGUMENT_TOOLS) delete s.hidden[t];
    expect(declared).toEqual(s.hidden);
  });

  it('PASSTHROUGH_ARGUMENT_TOOLS is exactly the tools whose schema keeps every key', () => {
    expect([...PASSTHROUGH_ARGUMENT_TOOLS].sort()).toEqual([...s.passthrough].sort());
  });
});

describe('the note on a real call', () => {
  const code = { executionMode: 'code' as const, executeInBrowser: false };
  const noteOf = (r: Awaited<ReturnType<typeof handleToolCall>>) => (r.content ?? []).map((c) => (c.type === 'text' ? c.text : '')).join('\n');

  it('a tool outside the old four-tool table now names a dropped key, in text and in _meta', async () => {
    const r = await handleToolCall('pinepaper_add_relation', { sourceId: 'a', targetId: 'b', relationType: 'follows', strength: 0.5 }, code);
    expect(noteOf(r)).toContain('IGNORED ARGUMENTS: strength is not a parameter of pinepaper_add_relation');
    expect(r._meta?.[IGNORED_ARGUMENTS_META_KEY]).toEqual(['strength']);
  });

  it('says nothing when every key is published', async () => {
    const r = await handleToolCall('pinepaper_add_relation', { sourceId: 'a', targetId: 'b', relationType: 'follows' }, code);
    expect(noteOf(r)).not.toContain('IGNORED ARGUMENTS');
    expect(r._meta?.[IGNORED_ARGUMENTS_META_KEY]).toBeUndefined();
  });

  it('a hidden key the handler reads is not called ignored', async () => {
    const r = await handleToolCall('pinepaper_map', { action: 'load', mapId: 'world', fillColor: '#ccc' }, code);
    expect(noteOf(r)).not.toContain('IGNORED ARGUMENTS');
  });

  it('a passthrough tool is never noted', async () => {
    const r = await handleToolCall('pinepaper_ui_kit', { component: 'toggle', anythingAtAll: 1 }, code);
    expect(noteOf(r)).not.toContain('IGNORED ARGUMENTS');
  });
});
