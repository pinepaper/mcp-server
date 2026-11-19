/**
 * Zero-dependency CLI argument parser and command-suggestion helper.
 */

export interface FlagSpec {
  type: 'boolean' | 'string' | 'number';
  short?: string;
  multiple?: boolean;
}

export type FlagValue = string | boolean | number | Array<string | number>;

export interface ParsedArgs {
  positionals: string[];
  flags: Record<string, FlagValue>;
}

export type ParseResult =
  | { ok: true; data: ParsedArgs }
  | { ok: false; error: string };

const COMMON_FLAGS: Record<string, FlagSpec> = {
  help: { type: 'boolean', short: 'h' },
  json: { type: 'boolean' },
};

function findSpec(name: string, specs: Record<string, FlagSpec>): [string, FlagSpec] | null {
  if (name in specs) return [name, specs[name]];
  for (const [key, spec] of Object.entries(specs)) {
    if (spec.short === name) return [key, spec];
  }
  return null;
}

function coerceValue(flagName: string, raw: string, type: FlagSpec['type']): string | boolean | number {
  if (type === 'boolean') {
    const v = raw.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
    throw new Error(`Flag --${flagName} expects a boolean value, got "${raw}".`);
  }
  if (type === 'number') {
    const n = Number(raw);
    if (!Number.isFinite(n) || raw.trim() === '') {
      throw new Error(`Flag --${flagName} expects a number, got "${raw}".`);
    }
    return n;
  }
  return raw;
}

function storeFlag(flags: Record<string, FlagValue>, key: string, val: string | boolean | number, spec: FlagSpec): void {
  if (spec.multiple && typeof val !== 'boolean') {
    const existing = Array.isArray(flags[key]) ? (flags[key] as Array<string | number>) : [];
    existing.push(val);
    flags[key] = existing;
    return;
  }
  flags[key] = val;
}

/** Parse argv against declared flag specs (plus --help/-h and --json). */
export function parseArgs(argv: readonly string[], customSpecs: Record<string, FlagSpec> = {}): ParseResult {
  const specs: Record<string, FlagSpec> = { ...COMMON_FLAGS, ...customSpecs };
  const positionals: string[] = [];
  const flags: Record<string, FlagValue> = {};

  try {
    for (let i = 0; i < argv.length; i++) {
      const token = argv[i];
      if (token === '--') {
        positionals.push(...argv.slice(i + 1));
        break;
      }
      if (token.startsWith('--')) {
        const body = token.slice(2);
        const eq = body.indexOf('=');
        if (eq !== -1) {
          const name = body.slice(0, eq);
          const inlineVal = body.slice(eq + 1);
          const found = findSpec(name, specs);
          if (!found) return { ok: false, error: `Unknown flag --${name}.` };
          storeFlag(flags, found[0], coerceValue(found[0], inlineVal, found[1].type), found[1]);
          continue;
        }
        if (body.startsWith('no-') && !(body in specs)) {
          const posName = body.slice(3);
          const found = findSpec(posName, specs);
          if (found && found[1].type === 'boolean') {
            flags[found[0]] = false;
            continue;
          }
        }
        const found = findSpec(body, specs);
        if (!found) return { ok: false, error: `Unknown flag --${body}.` };
        const [canonical, spec] = found;
        if (spec.type === 'boolean') {
          flags[canonical] = true;
          continue;
        }
        const next = argv[i + 1];
        if (next === undefined) return { ok: false, error: `Flag --${canonical} requires a value.` };
        i++;
        storeFlag(flags, canonical, coerceValue(canonical, next, spec.type), spec);
        continue;
      }
      if (token.startsWith('-') && token.length > 1) {
        const short = token.slice(1);
        const found = findSpec(short, specs);
        if (!found) return { ok: false, error: `Unknown flag -${short}.` };
        const [canonical, spec] = found;
        if (spec.type === 'boolean') {
          flags[canonical] = true;
          continue;
        }
        const next = argv[i + 1];
        if (next === undefined) return { ok: false, error: `Flag -${short} requires a value.` };
        i++;
        storeFlag(flags, canonical, coerceValue(canonical, next, spec.type), spec);
        continue;
      }
      positionals.push(token);
    }
    return { ok: true, data: { positionals, flags } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function boolFlag(flags: Record<string, FlagValue>, name: string): boolean | undefined {
  const v = flags[name];
  return typeof v === 'boolean' ? v : undefined;
}

export function strFlag(flags: Record<string, FlagValue>, name: string): string | undefined {
  const v = flags[name];
  return typeof v === 'string' ? v : undefined;
}

export function numFlag(flags: Record<string, FlagValue>, name: string): number | undefined {
  const v = flags[name];
  return typeof v === 'number' ? v : undefined;
}

function editDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

/** Return the closest candidate within edit distance 2, or null when none is close. */
export function suggestCommand(input: string, candidates: readonly string[]): string | null {
  const needle = input.trim().toLowerCase();
  let best: string | null = null;
  let bestDist = 3;
  for (const c of candidates) {
    const d = editDistance(needle, c.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}
