/**
 * A DEFINED tool that nothing dispatches is a phantom: it is advertised in
 * `tools/list`, counted in manifest.json, offered by a toolkit — and every call
 * to it returns UNKNOWN_TOOL.
 *
 * That is strictly worse than a missing tool. A missing one is invisible; a
 * phantom is a capability the model is told it has, plans around, and only
 * discovers is absent at call time, with an error that reads like the tool
 * broke rather than like it was never wired.
 *
 * `pinepaper_character` shipped in this state (b06fcde, 2026-09-02): the
 * definition, the toolkit entry, the minimal description, the manifest count
 * and nine READMEs all landed; the handler case, the zod schema and the emitter
 * did not. The irony is on the record — that commit's own message says the
 * character layer "was reachable from the cloud's build script and from nowhere
 * else, which by this project's own rule means it did not exist."
 *
 * This guard is a RATCHET, like __tests__/relations-contract.js in FxTool:
 * KNOWN_ORPHANS may only shrink. Deleting a name from it means the tool was
 * wired; adding one means a second phantom shipped, and that needs a reason in
 * writing next to it, not a silent append.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(import.meta.dir, '..', '..');
const read = (p: string) => readFileSync(join(SRC, p), 'utf-8');

/**
 * Tools defined but not reachable. Each needs the reason it is here.
 *
 * EMPTY as of 2026-09-11. `pinepaper_character` was the last entry and is now
 * wired: `src/character/` carries the concept graph, the composed depictions
 * and `performCharacter` vendored from mcp-cloud, and the handler routes its
 * ops through the EXISTING create_item and keyframe_animate emitters. Adding a
 * name back means a second phantom shipped, and that needs a reason in writing
 * here, not a silent append.
 */
const KNOWN_ORPHANS: string[] = [];

function definedTools(): string[] {
  const defs = read('tools/definitions.ts');
  return [...new Set([...defs.matchAll(/^\s*name: '(pinepaper_\w+)'/gm)].map((m) => m[1]))];
}

/** Every place a tool name can actually be routed from. */
function dispatchedTools(): Set<string> {
  const sources = [read('tools/handlers.ts'), read('index.ts'), read('tools/index.ts')];
  const dir = join(SRC, 'tools', 'handlers');
  for (const f of readdirSync(dir)) sources.push(readFileSync(join(dir, f), 'utf-8'));

  const names = new Set<string>();
  for (const s of sources) {
    // `case 'pinepaper_x'` in the main switch, and `name === 'pinepaper_x'` /
    // membership lists in the sub-handlers and index.
    for (const m of s.matchAll(/case '(pinepaper_\w+)'/g)) names.add(m[1]);
    for (const m of s.matchAll(/=== '(pinepaper_\w+)'/g)) names.add(m[1]);
    for (const m of s.matchAll(/'(pinepaper_\w+)'\s*[,:\]]/g)) names.add(m[1]);
  }
  return names;
}

describe('every defined tool is reachable', () => {
  const defined = definedTools();

  it('the definitions file still parses into a tool list', () => {
    // If this drops to nothing the two checks below pass vacuously.
    expect(defined.length).toBeGreaterThan(100);
  });

  it('no tool is defined-but-undispatched, except the recorded orphans', () => {
    const dispatched = dispatchedTools();
    const orphans = defined.filter((n) => !dispatched.has(n)).sort();
    expect(orphans).toEqual([...KNOWN_ORPHANS].sort());
  });

  it('the orphan list is a ratchet — every entry is still a real defined tool', () => {
    // A stale entry would silently re-allow a phantom under that name.
    const stale = KNOWN_ORPHANS.filter((n) => !defined.includes(n));
    expect(stale).toEqual([]);
  });
});
