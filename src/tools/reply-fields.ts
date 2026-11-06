/**
 * What a client reading structured data gets from a reply: structuredContent is the reply's JSON, so a field that rides
 * only in a sentence or a later text block never reaches it.
 */

const STRUCTURED_CAP = 16_384;
const LONG_STRING = 1_024;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Copies `value` without its long strings (a widget's page, a file's base64), naming each one left out. */
function withoutLongStrings(value: unknown, at: string, left: string[]): unknown {
  if (typeof value === 'string' && value.length > LONG_STRING) { left.push(at); return undefined; }
  if (Array.isArray(value)) return value.map((v, i) => withoutLongStrings(v, `${at}[${i}]`, left));
  if (!isObj(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, withoutLongStrings(v, at ? `${at}.${k}` : k, left)]));
}

/** The object, under the cap: past it the long strings stay in the text alone, and past that there is no structured copy. */
export function boundedStructured(obj: Record<string, unknown>): Record<string, unknown> | undefined {
  const plain = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  if (JSON.stringify(plain).length <= STRUCTURED_CAP) return plain;
  const left: string[] = [];
  const slim = withoutLongStrings(plain, '', left) as Record<string, unknown>;
  const out = left.length ? { ...JSON.parse(JSON.stringify(slim)) as Record<string, unknown>, textOnly: left.slice(0, 20) } : null;
  return out && JSON.stringify(out).length <= STRUCTURED_CAP ? out : undefined;
}

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * How many expanded ops each written op became: a batch's results count expanded ops, its paths count written ones.
 * A macro's expansion is passed in so this file stays free of the batch code.
 */
function writtenIndexes(ops: unknown[], expandedLength: (op: Record<string, unknown>) => number): number[] {
  const out: number[] = [];
  ops.forEach((op, i) => { for (let n = isObj(op) ? expandedLength(op) : 1; n > 0; n--) out.push(i); });
  return out;
}

/** Where a property the run reported was written: inside `properties`, or flat on the call. */
const propertyPath = (at: string, holder: unknown, key: string): string =>
  (isObj(holder) && isObj(holder.properties) && holder.properties[key] !== undefined ? `${at}properties.${key}` : `${at}${key}`);

const OP_OPTIONS: Readonly<Record<string, string>> = { relation: 'relationOptions', animate: 'animationOptions' };

/**
 * The argument paths the run itself reported as unread: an op's ignoredProperties (the item's known keys) and
 * ignoredOptions (a relation's or an animation's, which for a custom relation only the page knows). Read from the reply
 * of a call that ran; a call that only generated code reports nothing.
 */
export function reportedIgnoredPaths(
  toolName: string,
  args: Record<string, unknown>,
  result: { content?: unknown[] },
  expandedLength: (op: Record<string, unknown>) => number = () => 1,
): string[] {
  const first = result.content?.[0] as { type?: string; text?: string } | undefined;
  if (first?.type !== 'text' || !first.text?.trimStart().startsWith('{')) return [];
  let body: unknown;
  try { body = JSON.parse(first.text); } catch { return []; }
  if (!isObj(body)) return [];
  const r = isObj(body.result) ? body.result : body;
  const out: string[] = [];

  if (toolName === 'pinepaper_agent_batch_execute') {
    const ops = Array.isArray(args.operations) ? args.operations : [];
    const written = writtenIndexes(ops, expandedLength);
    for (const entry of Array.isArray(r.results) ? r.results : []) {
      if (!isObj(entry) || !isObj(entry.result) || typeof entry.index !== 'number') continue;
      const i = written[entry.index] ?? entry.index;
      const op = ops[i];
      const at = `operations[${i}].`;
      for (const k of strings(entry.result.ignoredProperties)) out.push(propertyPath(at, op, k));
      const holder = isObj(op) ? OP_OPTIONS[String(op.type)] : undefined;
      for (const k of strings(entry.result.ignoredOptions)) out.push(holder ? `${at}${holder}.${k}` : `${at}${k}`);
    }
    return out;
  }
  if (toolName === 'pinepaper_batch_create') {
    for (const entry of Array.isArray(r.items) ? r.items : []) {
      if (isObj(entry) && typeof entry.index === 'number') for (const k of strings(entry.ignoredProperties)) out.push(`items[${entry.index}].params.${k}`);
    }
    return out;
  }
  if (toolName === 'pinepaper_batch_modify') {
    const mods = Array.isArray(args.modifications) ? args.modifications : [];
    for (const entry of Array.isArray(r.ignoredProperties) ? r.ignoredProperties : []) {
      if (!isObj(entry)) continue;
      const i = mods.findIndex((m) => isObj(m) && m.itemId === entry.itemId);
      for (const k of strings(entry.ignoredProperties)) out.push(`modifications[${i}].params.${k}`);
    }
    return out;
  }
  if (toolName === 'pinepaper_create_scene') return strings(r.ignoredOptions); // already full paths: only the run knows which relation
  for (const k of strings(r.ignoredProperties)) out.push(propertyPath('', args, k));
  for (const k of strings(r.ignoredOptions)) out.push(`params.${k}`);
  return out;
}
