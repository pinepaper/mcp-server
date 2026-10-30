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
import { z } from 'zod';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import * as schemas from '../../types/schemas.js';
import { handlerBodies, LOCAL_SCHEMAS } from './_handler-bodies.js';
import {
  handleToolCall, HIDDEN_ARGUMENTS, PASSTHROUGH_ARGUMENT_TOOLS, IGNORED_ARGUMENTS_META_KEY,
} from '../../tools/handlers.js';
import { unwrap as walkUnwrap, isPassthrough } from '../zod-walk';

/** Dispatched by the server (index.ts) before handleToolCall, so never noted. */
const NOT_THROUGH_HANDLE_TOOL_CALL = new Set(['pinepaper_set_toolkit']);

// zod 3 and 4 alike (../zod-walk).
function unwrap(t: unknown): any {
  return walkUnwrap(t);
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
      if (isPassthrough(obj)) passthrough.add(tool.name);
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
