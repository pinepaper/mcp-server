/**
 * NESTED ARGUMENTS A TOOL DROPPED, NAMED AT THEIR PATH (AR-1 R2, docs/plans/RECEIPTS_AND_PATTERNS.md in FxTool).
 *
 * The top-level check (ignoredArgumentKeys in handlers.ts) caught `loop` beside agent_export's options, but not
 * `keyframes[0].ease` where the schema says `easing`, nor a key inside a batch entry: zod strips both, the call answers
 * success, and the caller believes the value was used.
 *
 * This walks the tool's PUBLISHED JSON schema beside the arguments. Inside an object the schema closes (it lists
 * `properties` and does not set `additionalProperties`), a key it does not list is reported with its full path.
 * Anywhere the schema is open, or ambiguous (a union whose branches disagree), nothing below is reported: a working
 * argument must never be called ignored. nested-ignored-coverage.test.ts holds every zod schema a handler parses to
 * the same rule, so a nested key a handler reads is published.
 */

type Json = Record<string, unknown>;

const MAX_REPORTED = 50;
const MAX_ARRAY_ITEMS = 200;

function isObj(v: unknown): v is Json {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

/** The object branches of a JSON-schema node: itself, or each branch of a oneOf/anyOf/allOf. */
function branches(node: Json): Json[] {
  const out: Json[] = [];
  for (const k of ['oneOf', 'anyOf', 'allOf'] as const) {
    const list = node[k];
    if (Array.isArray(list)) for (const b of list) if (isObj(b)) out.push(...branches(b));
  }
  if (!out.length) out.push(node);
  return out;
}

/** Keys a closed object node lists, or null when the node lets any key through. */
function closedKeys(node: Json): Set<string> | null {
  if (!isObj(node.properties)) return null;
  if (node.additionalProperties !== undefined && node.additionalProperties !== false) return null;
  if (node.patternProperties) return null;
  return new Set(Object.keys(node.properties as Json));
}

function walk(node: Json, value: unknown, path: string, out: string[]): void {
  if (out.length >= MAX_REPORTED) return;
  if (Array.isArray(value)) {
    const items = node.items;
    if (!isObj(items)) return;
    const n = Math.min(value.length, MAX_ARRAY_ITEMS);
    for (let i = 0; i < n; i++) walk(items, value[i], `${path}[${i}]`, out);
    return;
  }
  if (!isObj(value)) return;
  const objs = branches(node).filter((b) => isObj(b.properties) || b.additionalProperties !== undefined || b.type === 'object');
  if (!objs.length) return;
  // A union: report a key only when EVERY object branch closes and none lists it; recurse only when one branch does.
  const keySets = objs.map(closedKeys);
  const allClosed = keySets.every((s) => s !== null);
  for (const [k, v] of Object.entries(value)) {
    const p = path ? `${path}.${k}` : k;
    const listing = objs.filter((b) => isObj(b.properties) && (b.properties as Json)[k] !== undefined);
    if (!listing.length) {
      if (allClosed && path) out.push(p); // top level is ignoredArgumentKeys' job
      continue;
    }
    if (listing.length === 1) walk((listing[0]!.properties as Json)[k] as Json, v, p, out);
  }
}

/** Paths below the top level that the tool's published schema closes and does not list. */
export function nestedIgnoredPaths(inputSchema: unknown, args: Record<string, unknown>): string[] {
  if (!isObj(inputSchema) || !isObj(args)) return [];
  const out: string[] = [];
  walk(inputSchema, args, '', out);
  return out;
}
