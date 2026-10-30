/**
 * A nested argument a tool dropped is named at its path (AR-1 R2), and a nested argument a handler reads is never
 * called ignored.
 *
 * nestedIgnoredPaths judges by the published JSON schema. This test walks every zod schema a handler parses `args` with
 * beside that JSON schema: wherever the JSON schema closes an object, every key zod accepts there must be listed, or
 * the note would tell a caller a working argument had no effect. KNOWN_UNPUBLISHED is the shrink-only list of nested
 * keys that are accepted and not yet published (each one is suppressed at runtime: see NESTED_HIDDEN in handlers.ts).
 */
import { describe, it, expect } from 'bun:test';
import { z } from 'zod';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import * as schemas from '../../types/schemas.js';
import { handlerBodies, LOCAL_SCHEMAS } from './_handler-bodies.js';
import { nestedIgnoredPaths } from '../../tools/nested-ignored.js';
import { handleToolCall, NESTED_HIDDEN, IGNORED_ARGUMENTS_META_KEY } from '../../tools/handlers.js';
import { unwrap as walkUnwrap } from '../zod-walk';

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

// zod 3 and 4 alike (../zod-walk).
function unwrap(t: unknown): any {
  return walkUnwrap(t);
}

/** The zod object branches of a node (a union contributes each branch). */
function zodObjects(t: z.ZodTypeAny | undefined): z.ZodObject<z.ZodRawShape>[] {
  const u = unwrap(t);
  if (u instanceof z.ZodObject) return [u];
  if (u instanceof z.ZodUnion || u instanceof z.ZodDiscriminatedUnion) return [...u._def.options].flatMap((o: z.ZodTypeAny) => zodObjects(o));
  if (u instanceof z.ZodIntersection) return [...zodObjects(u._def.left), ...zodObjects(u._def.right)];
  return [];
}
function zodElement(t: z.ZodTypeAny | undefined): z.ZodTypeAny | undefined {
  const u = unwrap(t);
  if (u instanceof z.ZodArray) return u._def.element ?? u._def.type;
  if (u instanceof z.ZodUnion) for (const o of u._def.options) { const e = zodElement(o); if (e) return e; }
  return undefined;
}

/** Witness args: for every nested object zod accepts, one instance carrying every key it accepts there. */
function witness(t: z.ZodTypeAny | undefined, depth = 0): unknown {
  if (depth > 8) return undefined;
  const el = zodElement(t);
  if (el) { const w = witness(el, depth + 1); return w === undefined ? undefined : [w]; }
  const objs = zodObjects(t);
  if (!objs.length) return undefined;
  const out: Json = {};
  for (const o of objs) for (const [k, v] of Object.entries(o.shape)) {
    const w = witness(v as z.ZodTypeAny, depth + 1);
    if (!(k in out) || (out[k] === 1 && w !== undefined)) out[k] = w === undefined ? 1 : w;
  }
  return out;
}

function survey() {
  const bodies = handlerBodies();
  const unpublished: string[] = [];
  for (const tool of PINEPAPER_TOOLS) {
    const body = bodies.get(tool.name);
    if (!body) continue;
    for (const m of body.matchAll(/(\w+Schema)\.(?:safeParse|parse)\(\s*args\b/g)) {
      const schema = ((schemas as Record<string, unknown>)[m[1]!] ?? LOCAL_SCHEMAS[m[1]!]) as z.ZodTypeAny | undefined;
      const w = witness(schema);
      if (!isObj(w)) continue;
      for (const p of nestedIgnoredPaths(tool.inputSchema, w)) unpublished.push(`${tool.name}: ${p.replace(/\[\d+\]/g, '[]')}`);
    }
  }
  return [...new Set(unpublished)].sort();
}

describe('nested dropped arguments (AR-1 R2)', () => {
  it('every nested key a handler accepts is published, or listed in NESTED_HIDDEN', () => {
    const declared = Object.entries(NESTED_HIDDEN).flatMap(([t, ps]) => ps.map((p) => `${t}: ${p}`)).sort();
    expect(survey()).toEqual(declared);
  });

  const code = { executionMode: 'code' as const, executeInBrowser: false };
  const noteOf = (r: Awaited<ReturnType<typeof handleToolCall>>) => (r.content ?? []).map((c) => (c.type === 'text' ? c.text : '')).join('\n');

  it('`ease` where the schema says `easing` is named at keyframes[0].ease', async () => {
    const r = await handleToolCall('pinepaper_keyframe_animate', {
      itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 100 }, ease: 'easeIn' }],
    }, code);
    expect(noteOf(r)).toContain('IGNORED ARGUMENTS: keyframes[1].ease is not a parameter of pinepaper_keyframe_animate');
    expect(r._meta?.[IGNORED_ARGUMENTS_META_KEY]).toEqual(['keyframes[1].ease']);
  });

  it('says nothing when every nested key is published', async () => {
    const r = await handleToolCall('pinepaper_keyframe_animate', {
      itemId: 'item_1', keyframes: [{ time: 0, properties: { x: 0 } }, { time: 1, properties: { x: 100 }, easing: 'easeIn' }],
    }, code);
    expect(noteOf(r)).not.toContain('IGNORED ARGUMENTS');
  });

  it('an open object (batch params) is never judged', () => {
    const bc = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_batch_create')!;
    expect(nestedIgnoredPaths(bc.inputSchema, { items: [{ type: 'circle', params: { anything: 1 } }] })).toEqual([]);
    expect(nestedIgnoredPaths(bc.inputSchema, { items: [{ type: 'circle', params: {}, colour: 'red' }] })).toEqual(['items[0].colour']);
  });
});
