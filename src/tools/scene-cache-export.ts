/**
 * agent_export { perScene: true }: a long scene chain exported as segments, each cached by what it depends on, and
 * joined: the video without re-encoding, the audio re-encoded so the seams are seamless.
 *
 * WHY. Editing one scene of a ten-minute piece re-rendered all ten minutes. Agents on the local server learned to
 * export scene by scene and join the files themselves, and that alone made local edits 2–2.5x faster in the
 * benchmark (mcp-server#37's run). This builds it in: a segment whose inputs did not change comes from the cache.
 *
 * WHAT A SEGMENT DEPENDS ON is hashed: the scene's own saved data (sceneManager.exportScenes), its length, every
 * export setting, and the studio build. A change to any of them is a new hash and a new render; nothing is
 * invalidated by hand.
 *
 * HARD CUTS ONLY, for now: each scene is rendered alone (the chain set aside, then put back), so a crossfade or a
 * cut sound, which spans two scenes, would be lost. A chain with either is exported whole, as before, and the
 * result says why. The join needs ffmpeg on PATH; without it the chain is exported whole too. When the engine
 * can render a time range of the chain (app.exportEngine.supportsTimeRange, FxTool branch claude/export-time-range),
 * segments become ranges of the chain timeline and transitions stay in.
 */
import { createHash } from 'node:crypto';
import { mkdir, stat, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { CallToolResult } from '../mcp/index.js';
import { hasFfmpeg, segmentStreams, concatSegments } from './export-file-receipt.js';
import { exportFileLink } from '../utils/export-dir.js';

interface ChainEntry { sceneId: string; duration: number; transition: string | null; cutSound: boolean }
interface ChainInfo { ok: boolean; reason?: string; chain?: ChainEntry[]; entries?: unknown[]; loop?: boolean; ranges?: boolean; current?: string | null; scenes?: string; buildId?: string | null }

/** What the export needs from the studio and the server, injected so the flow is testable without either. */
export interface SceneCacheDeps {
  exec: (code: string) => Promise<{ success: boolean; result?: unknown; error?: string }>;
  exportOnce: (args: Record<string, unknown>) => Promise<CallToolResult>;
  exportDir: string;
  ffmpeg?: { available: () => Promise<boolean>; streams: typeof segmentStreams; concat: typeof concatSegments };
}

const READ_CHAIN = `(function () {
  const sm = app.sceneManager;
  if (!sm || !Array.isArray(sm.sceneChain)) return { ok: false, reason: 'this studio has no scene manager' };
  return {
    ok: true,
    chain: sm.sceneChain.map((e) => ({ sceneId: e.sceneId, duration: e.duration, transition: e.transition || null, cutSound: !!e.cutSound })),
    entries: JSON.parse(JSON.stringify(sm.sceneChain)),
    loop: sm.chainLoop === true,
    ranges: !!(app.exportEngine && app.exportEngine.supportsTimeRange === true),
    current: sm.currentSceneId || null,
    scenes: typeof sm.exportScenes === 'function' ? sm.exportScenes() : '',
    buildId: app.buildId || null,
  };
})();`;

/** Set the chain aside and load one scene, so a plain export renders that scene alone. */
const LOAD_ALONE = (sceneId: string) => `(async function () {
  const sm = app.sceneManager;
  if (window.__ppSceneCacheChain === undefined) window.__ppSceneCacheChain = sm.sceneChain;
  sm.sceneChain = [];
  const ok = await sm.loadSceneForRender(${JSON.stringify(sceneId)});
  return { success: ok !== false };
})();`;

/** Put the chain back and the scene that was showing. */
const RESTORE = (current: string | null) => `(async function () {
  const sm = app.sceneManager;
  if (window.__ppSceneCacheChain !== undefined) { sm.sceneChain = window.__ppSceneCacheChain; delete window.__ppSceneCacheChain; }
  ${current ? `try { await sm.loadSceneForRender(${JSON.stringify(current)}); } catch (e) { /* the chain is back; the scene shown is the last rendered */ }` : ''}
  return { success: true };
})();`;

function textOf(r: CallToolResult): string {
  return (r.content ?? []).map((c) => ('text' in c ? String((c as { text?: unknown }).text ?? '') : '')).join('\n');
}

/** True when the only obstacle is something a time-range render keeps (a transition or a cut sound spans a cut). */
export function needsRanges(chain: ChainEntry[] | undefined): boolean {
  return !!chain && chain.length >= 2 && (chain.slice(1).some((e) => e.transition && e.transition !== 'cut' && e.transition !== 'none') || chain.some((e) => e.cutSound));
}

/**
 * Segment boundaries for a range render: the cut instants (the sum of the entry durations before each, as the
 * engine's chainCutTimes defines them), snapped to frames. Segment k is [cut k, cut k+1): the transition into
 * scene k (scene k-1's last frame held under it) and scene k itself, so it depends on scenes k-1 and k.
 */
export function rangeSegments(chain: ChainEntry[], fps: number): Array<{ index: number; start: number; duration: number }> {
  const snap = (t: number) => Math.round(t * fps) / fps;
  const cuts: number[] = [0];
  for (let k = 1; k <= chain.length; k++) cuts.push(cuts[k - 1] + Math.max(0, chain[k - 1].duration) / 1000);
  return chain.map((_, k) => ({ index: k, start: snap(cuts[k]), duration: snap(cuts[k + 1]) - snap(cuts[k]) })).filter((x) => x.duration > 0);
}

/** Why this chain cannot be exported per scene, or null when it can. */
export function perSceneRefusal(chain: ChainEntry[] | undefined, format: string): string | null {
  if (format !== 'mp4' && format !== 'webm') return `perScene joins video segments, and ${format} is not mp4 or webm`;
  if (!chain || chain.length < 2) return 'perScene needs a scene chain of two or more scenes (pinepaper_scene_playback create_chain)';
  const crossed = chain.slice(1).filter((e) => e.transition && e.transition !== 'cut' && e.transition !== 'none');
  if (crossed.length) return `${crossed.length} cut(s) in the chain are transitions (${[...new Set(crossed.map((e) => e.transition))].join(', ')}), which span two scenes; per-scene segments are rendered one scene at a time, so it is exported whole. create_chain with transition 'cut' makes it cacheable`;
  if (chain.some((e) => e.cutSound)) return 'the chain has cut sounds, which play across a cut; it is exported whole';
  return null;
}

/** The cache key of one segment: everything its pixels and sound depend on. */
export function segmentKey(sceneData: unknown, durationMs: number, settings: Record<string, unknown>, buildId: string | null): string {
  return createHash('sha256').update(JSON.stringify({ sceneData, durationMs, settings, buildId })).digest('hex').slice(0, 32);
}

export async function exportPerScene(args: Record<string, unknown>, format: string, deps: SceneCacheDeps): Promise<CallToolResult> {
  const ff = deps.ffmpeg ?? { available: hasFfmpeg, streams: segmentStreams, concat: concatSegments };
  const { perScene: _p, ...settings } = args;
  const whole = async (why: string): Promise<CallToolResult> => {
    const r = await deps.exportOnce(settings);
    const note = `perScene was not used: ${why}.`;
    return { ...r, content: [{ type: 'text' as const, text: note }, ...(r.content ?? [])] };
  };

  const info = (await deps.exec(READ_CHAIN)).result as ChainInfo | undefined;
  if (!info || !info.ok) return whole(info?.reason ?? 'the studio did not report its scene chain');
  if (info.loop) return whole('the chain loops, and a per-scene export joins one pass; export it whole');
  const refusal = perSceneRefusal(info.chain, format);
  const ranges = !!refusal && needsRanges(info.chain) && info.ranges === true && (format === 'mp4' || format === 'webm');
  if (refusal && !ranges) return whole(refusal + (needsRanges(info.chain) && !info.ranges ? ' (a studio that renders time ranges keeps them: update PinePaper Studio)' : ''));
  if (!(await ff.available())) return whole('ffmpeg is not on PATH, and the segments are joined with it (install ffmpeg to cache per scene)');

  let scenesById = new Map<string, unknown>();
  try {
    const parsed = JSON.parse(info.scenes || '{}') as { scenes?: Array<{ id?: string }> };
    scenesById = new Map((parsed.scenes ?? []).filter((s) => s && typeof s.id === 'string').map((s) => [s.id as string, s]));
  } catch { return whole('the studio\'s scene export did not parse'); }

  const cacheDir = join(deps.exportDir, '.scene-cache');
  await mkdir(cacheDir, { recursive: true });
  const segments: Array<{ sceneId: string; file: string; cached: boolean; seconds: number }> = [];
  if (ranges) {
    // RANGES of the chain timeline (FxTool #250): transitions and cut sounds render as in a whole export. Each range
    // still renders the frames before its start (unencoded), so this path is for chains a hard cut cannot carry.
    const fps = Number(settings.fps) > 0 ? Number(settings.fps) : 30;
    const chain = info.chain!;
    for (const seg of rangeSegments(chain, fps)) {
      const inputs = [seg.index - 1, seg.index].filter((k) => k >= 0).map((k) => ({ scene: scenesById.get(chain[k].sceneId) ?? null, entry: (info.entries ?? [])[k] ?? null }));
      const file = join(cacheDir, `${segmentKey({ range: seg, inputs }, Math.round(seg.duration * 1000), settings, info.buildId ?? null)}.${format}`);
      const sceneId = chain[seg.index].sceneId;
      if (existsSync(file)) { segments.push({ sceneId, file, cached: true, seconds: seg.duration }); continue; }
      const r = await deps.exportOnce({ ...settings, startTime: seg.start, duration: seg.duration });
      const made = /File: (\S+)/.exec(textOf(r))?.[1];
      if (r.isError || !made) return whole(`the range from ${seg.start} s (scene ${JSON.stringify(sceneId)}) did not export: ${textOf(r).slice(0, 200)}`);
      await copyFile(made, file);
      segments.push({ sceneId, file, cached: false, seconds: seg.duration });
    }
  } else try {
    for (const entry of info.chain!) {
      const scene = scenesById.get(entry.sceneId);
      if (!scene) return whole(`scene ${JSON.stringify(entry.sceneId)} is in the chain but not in the studio's scene list`);
      const seconds = entry.duration / 1000;
      const file = join(cacheDir, `${segmentKey(scene, entry.duration, settings, info.buildId ?? null)}.${format}`);
      if (existsSync(file)) { segments.push({ sceneId: entry.sceneId, file, cached: true, seconds }); continue; }
      const loaded = await deps.exec(LOAD_ALONE(entry.sceneId));
      if (!loaded.success || (loaded.result as { success?: boolean } | undefined)?.success === false) {
        return whole(`scene ${JSON.stringify(entry.sceneId)} could not be loaded on its own`);
      }
      const r = await deps.exportOnce({ ...settings, duration: seconds });
      const made = /File: (\S+)/.exec(textOf(r))?.[1];
      if (r.isError || !made) return whole(`scene ${JSON.stringify(entry.sceneId)} did not export: ${textOf(r).slice(0, 200)}`);
      await copyFile(made, file);
      segments.push({ sceneId: entry.sceneId, file, cached: false, seconds });
    }
  } finally {
    await deps.exec(RESTORE(info.current ?? null)).catch(() => undefined);
  }

  // Every segment must carry the same streams, or a stream copy cannot join them.
  const sigs = await Promise.all(segments.map((s) => ff.streams(s.file)));
  const bad = sigs.findIndex((s) => !s.ok || s.signature !== sigs[0].signature);
  if (bad >= 0) return whole(`segment ${bad + 1} (${segments[bad].sceneId}) does not match the first one's streams${sigs[bad].reason ? ': ' + sigs[bad].reason : ''} (a scene with sound beside one without, for instance)`);

  const out = join(deps.exportDir, `pinepaper_scenes_${Date.now()}.${format}`);
  const hasAudio = /"audio"/.test(sigs[0].signature ?? '');
  const joined = await ff.concat(segments.map((s) => s.file), join(cacheDir, `join_${Date.now()}.txt`), out, { audio: hasAudio, format });
  if (!joined.ok) return whole(`ffmpeg could not join the segments: ${joined.reason}`);
  const bytes = (await stat(out)).size;
  const reused = segments.filter((s) => s.cached).length;
  const result = {
    success: true, format, filePath: out, bytes,
    duration: Math.round(segments.reduce((a, s) => a + s.seconds, 0) * 1000) / 1000,
    perScene: { mode: ranges ? 'chain ranges (transitions kept)' : 'scene by scene (hard cuts)', segments: segments.length, rendered: segments.length - reused, reused, cache: cacheDir },
    scenes: segments.map((s) => ({ sceneId: s.sceneId, seconds: s.seconds, cached: s.cached })),
    note: reused ? `${reused} of ${segments.length} scenes came from the cache: only what changed was rendered.` : 'every scene was rendered and cached; an export after editing one scene renders only that one.',
  };
  return { content: [{ type: 'text' as const, text: `Export saved to file:\nFile: ${out}\n\n${JSON.stringify(result, null, 2)}` }, exportFileLink(out, bytes)] };
}
