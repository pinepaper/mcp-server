/**
 * REFUSE TO START AN EXPORT WHILE THE STUDIO PAGE IS ON A STALE BUILD (owner's decision, 2026-11-20).
 *
 * This server opens pinepaper.studio in its own browser and keeps one page for the whole session. A deploy leaves that
 * page on the old build, and a service worker that claims it can then load late parts of the new build into it: a
 * benchmark saw one export fail its frame check during exactly such a deploy. The editor never reloads itself in agent
 * mode (a reload wipes the scene), so before a tool that renders or exports starts, the server asks the page whether it
 * is behind, with a fresh check, and refuses when the page says it is. The two ways forward are in the refusal.
 *
 * ONLY A POSITIVE ANSWER REFUSES. A page with no `checkBuild`, a check that throws or hangs, a /build.json that cannot
 * be read, a studio URL that has none and a locally served studio all mean "cannot tell", and the export goes ahead
 * exactly as it did before this guard existed (the existing `stale_build` warning still rides on its result).
 */
import type { CallToolResult } from '../mcp/index.js';
import { env } from '../utils/env.js';

/**
 * The tools that hand back something the studio rendered. Render behaviour follows the live studio, not this package,
 * so a result is traced by the build that made it (handlers.ts renderingBuildField) and each of them is guarded here.
 * `pinepaper_export_store` only pages out bytes an earlier export already made, and `pinepaper_browser_screenshot`
 * looks at the page; neither renders anything, so neither is in the list.
 */
export const RENDERING_TOOLS: ReadonlySet<string> = new Set([
  'pinepaper_agent_export', 'pinepaper_capture_frames', 'pinepaper_export_scene', 'pinepaper_export_svg',
  'pinepaper_export_training_data', 'pinepaper_export_widget', 'pinepaper_export_widget_html', 'pinepaper_render_batch',
  'pinepaper_sprite_sheet',
]);

/**
 * Tools that take an `action` and export from the page only for the `export_*` actions (Lottie, dotLottie, GLB, BVH, PNG
 * sequence); their `import_*` actions are not exports and are never checked.
 */
export const EXPORT_ACTION_TOOLS: ReadonlySet<string> = new Set(['pinepaper_interchange']);

/** Every tool that publishes `allowStaleBuild`. */
export const GUARDED_TOOLS: ReadonlySet<string> = new Set([...RENDERING_TOOLS, ...EXPORT_ACTION_TOOLS]);

export function startsAnExport(toolName: string, args: Record<string, unknown>): boolean {
  if (RENDERING_TOOLS.has(toolName)) return true;
  return EXPORT_ACTION_TOOLS.has(toolName) && typeof args.action === 'string' && args.action.startsWith('export_');
}

export const STALE_BUILD_CODE = 'STALE_BUILD';

/** The most an export waits for the freshness check. The editor's own /build.json fetch gives up after 4 s. */
export const STALE_CHECK_TIMEOUT_MS = 6000;

/** The optional argument every rendering tool publishes. */
export const ALLOW_STALE_BUILD_PROPERTY = {
  type: 'boolean',
  description: 'Export even if the studio page is on an old build (default: refused, nothing exported). The result then carries a stale_build warning.',
} as const;

/** One page round trip: the editor's own fresh check (app.checkBuild() → { buildId, liveBuildId, stale }). */
export const STALE_BUILD_PROBE = `(async function () {
  try {
    var a = typeof app !== 'undefined' ? app : (typeof window !== 'undefined' ? window.app : null);
    if (!a || typeof a.checkBuild !== 'function') return { state: 'unknown' };
    var s = await a.checkBuild();
    if (!s || typeof s !== 'object') return { state: 'unknown' };
    if (s.stale === true && typeof s.buildId === 'string' && s.buildId && typeof s.liveBuildId === 'string' && s.liveBuildId && s.buildId !== s.liveBuildId) {
      return { state: 'stale', buildId: s.buildId, liveBuildId: s.liveBuildId };
    }
    return { state: 'current' };
  } catch (e) { return { state: 'unknown' }; }
})()`;

type ProbeController = {
  connected?: boolean;
  executeCode?: (c: string, s: boolean, o: { bypassGovernor: boolean }) => Promise<{ success: boolean; result?: unknown }>;
};

/** What the guard reads from the handler options (kept structural so this file imports nothing from handlers.ts). */
export interface StaleGuardOptions {
  executeInBrowser?: boolean;
  executionMode?: string;
  browserController?: unknown;
  /** Internal: this call is one export inside a call the guard already judged (a batch row, a per-scene segment). */
  staleBuildChecked?: boolean;
  /** Test hook: the bound on the check, in ms. */
  staleCheckTimeoutMs?: number;
}

export function staleBuildMessage(buildId: string, liveBuildId: string): string {
  return `The studio page is on build ${buildId}, and the live build is ${liveBuildId}. Nothing was exported and nothing was changed: `
    + 'a file made now would come from the old build, which can differ from what the live editor makes. Two ways forward. '
    + '(a) Rebuild the canvas on the new build: call pinepaper_clear_canvas (or start a new job with pinepaper_agent_start_job), '
    + 'which loads the live build and empties the canvas, then recreate the scene and export again. '
    + '(b) Export anyway on the old build: pass allowStaleBuild: true on this call (--allow-stale-build on the command line); '
    + 'PINEPAPER_STALE_EXPORT=allow does that for every export. This server never reloads the page by itself, because that would wipe the scene.';
}

/** Asks the page. Returns the two builds when it positively says it is stale, otherwise null (cannot tell, or current). */
export async function probeStaleBuild(controller: ProbeController, timeoutMs: number): Promise<{ buildId: string; liveBuildId: string } | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), timeoutMs); });
    const ask = (async () => {
      const r = await controller.executeCode!(STALE_BUILD_PROBE, false, { bypassGovernor: true });
      const v = r?.success ? (r.result as { state?: string; buildId?: unknown; liveBuildId?: unknown } | null) : null;
      if (v && v.state === 'stale' && typeof v.buildId === 'string' && typeof v.liveBuildId === 'string' && v.buildId !== v.liveBuildId) {
        return { buildId: v.buildId, liveBuildId: v.liveBuildId };
      }
      return null;
    })().catch(() => null);
    return await Promise.race([ask, timeout]);
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * The refusal for a rendering tool whose page is positively on a stale build; null when the call may go ahead.
 * `errorResult` is passed in (it lives in handlers.ts, which imports this file).
 */
export async function staleBuildRefusal(
  toolName: string,
  args: Record<string, unknown>,
  options: StaleGuardOptions,
  getController: () => unknown,
  errorResult: (code: string, message: string, details?: unknown) => CallToolResult,
): Promise<CallToolResult | null> {
  if (!startsAnExport(toolName, args)) return null;
  if (args.estimateOnly === true || args.allowStaleBuild === true || options.staleBuildChecked) return null;
  if ((env('PINEPAPER_STALE_EXPORT') ?? '').trim().toLowerCase() === 'allow') return null;
  if (!options.executeInBrowser || options.executionMode === 'code') return null;
  const controller = (options.browserController ?? getController()) as ProbeController | null;
  if (!controller?.connected || typeof controller.executeCode !== 'function') return null;
  const stale = await probeStaleBuild(controller, options.staleCheckTimeoutMs ?? STALE_CHECK_TIMEOUT_MS);
  if (!stale) return null;
  const message = staleBuildMessage(stale.buildId, stale.liveBuildId);
  const res = errorResult(STALE_BUILD_CODE, message, {
    code: STALE_BUILD_CODE, buildId: stale.buildId, liveBuildId: stale.liveBuildId, exported: false, changed: false,
    nextSteps: ['pinepaper_clear_canvas', 'allowStaleBuild: true'],
  });
  res.structuredContent = { success: false, error: { code: STALE_BUILD_CODE, message, details: { code: STALE_BUILD_CODE, buildId: stale.buildId, liveBuildId: stale.liveBuildId, exported: false, changed: false } } };
  return res;
}
