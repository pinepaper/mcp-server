/**
 * WALKING A ZOD SCHEMA IN A TEST, IN ONE PLACE (zod 3 → 4, 2026-10-30).
 *
 * Tests that compare a schema with what is served read its internals. Zod 4 moved them: refinements no longer wrap (no
 * ZodEffects), a preprocess or transform is a ZodPipe (in → out), an object's shape is an object, an enum's values are
 * `.options`, a number's bound is `.maxValue`, and a description set before `.optional()` sits on the inner schema.
 * Each test had its own walker and broke on the first of these — `instanceof z.ZodEffects` throws when the class is
 * gone. One walker, so the next move is fixed once.
 */
import { z } from 'zod';

type AnyZod = z.ZodTypeAny;
const Z = z as unknown as Record<string, (new (...a: never[]) => unknown) | undefined>;
const is = (v: unknown, name: string) => typeof Z[name] === 'function' && v instanceof (Z[name] as new (...a: never[]) => unknown);

/** One wrapper off: optional, nullable, default, readonly, catch, lazy, a pipe (towards its object side), zod 3 effects. */
export function unwrapOnce(t: unknown): unknown {
  const d = (t as { _def?: Record<string, unknown> } | undefined)?._def;
  if (!d) return undefined;
  if (is(t, 'ZodOptional') || is(t, 'ZodNullable') || is(t, 'ZodDefault') || is(t, 'ZodReadonly') || is(t, 'ZodCatch')) return d.innerType;
  if (is(t, 'ZodLazy')) return (d.getter as () => unknown)();
  if (is(t, 'ZodPipe') || is(t, 'ZodPipeline')) {
    const side = (x: unknown) => !!x && !is(x, 'ZodTransform');
    return side(d.in) && !(is(d.out, 'ZodObject') && !is(d.in, 'ZodObject')) ? d.in : d.out;
  }
  if (is(t, 'ZodEffects')) return d.schema;
  return undefined;
}

/** Every wrapper off. */
export function unwrap<T = AnyZod>(t: unknown): T | undefined {
  let cur = t;
  for (let i = 0; i < 64 && cur; i++) {
    const next = unwrapOnce(cur);
    if (next === undefined) return cur as T;
    cur = next;
  }
  return cur as T | undefined;
}

/** An object schema's fields, under any wrappers. */
export function shapeOf(t: unknown): Record<string, unknown> | undefined {
  const o = unwrap<{ shape?: unknown }>(t);
  const s = o?.shape;
  return typeof s === 'function' ? (s as () => Record<string, unknown>)() : (s as Record<string, unknown> | undefined);
}

/** The values an enum, a literal, or a union of them accepts. */
export function enumValues(t: unknown): unknown[] {
  const u = unwrap<{ options?: unknown; _def?: Record<string, unknown>; value?: unknown }>(t);
  if (!u) return [];
  if (is(u, 'ZodUnion')) return (u._def!.options as unknown[]).flatMap(enumValues);
  if (Array.isArray(u.options)) return u.options;
  if (is(u, 'ZodLiteral')) return Array.isArray(u._def?.values) ? (u._def!.values as unknown[]) : [u.value];
  const v = u._def?.values;
  return Array.isArray(v) ? v : v && typeof v === 'object' ? Object.values(v) : [];
}

/** A number's upper bound, under any wrappers. */
export function maxOf(t: unknown): number | null {
  const n = unwrap<{ maxValue?: number | null }>(t);
  return typeof n?.maxValue === 'number' && Number.isFinite(n.maxValue) ? n.maxValue : null;
}

/** The first description from the outside in. */
export function descriptionOf(t: unknown): string {
  let cur = t;
  for (let i = 0; i < 64 && cur; i++) {
    const d = (cur as { description?: string }).description;
    if (d) return d;
    cur = unwrapOnce(cur);
  }
  return '';
}

/** True when an object schema keeps unknown keys: zod 3 `unknownKeys`, zod 4 an unknown catchall. */
export function isPassthrough(t: unknown): boolean {
  const d = (t as { _def?: { unknownKeys?: string; catchall?: { _def?: { type?: string; typeName?: string } } } })?._def;
  if (!d) return false;
  if (d.unknownKeys === 'passthrough') return true;
  const c = d.catchall?._def;
  return c?.type === 'unknown' || c?.type === 'any';
}
