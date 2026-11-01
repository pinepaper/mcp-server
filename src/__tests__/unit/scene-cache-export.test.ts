/** agent_export { perScene: true }: cache per scene, join, and the honest fallbacks. Studio and ffmpeg are faked. */
import { describe, it, expect } from 'bun:test';
import { mkdtempSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exportPerScene, perSceneRefusal, segmentKey } from '../../tools/scene-cache-export.js';

function harness(chain: Array<Record<string, unknown>>, opts: { ffmpeg?: boolean; sig?: (f: string) => string } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pp-scenecache-'));
  const scenes = JSON.stringify({ scenes: chain.map((e) => ({ id: e.sceneId, data: { color: e.color ?? 'red' } })) });
  const execs: string[] = [];
  let exports = 0;
  const deps = {
    exportDir: dir,
    exec: async (code: string) => {
      execs.push(code);
      if (code.includes('sm.sceneChain.map')) return { success: true, result: { ok: true, chain: chain.map((e) => ({ sceneId: e.sceneId, duration: e.duration ?? 2000, transition: e.transition ?? 'none', cutSound: !!e.cutSound })), current: 's1', scenes, buildId: 'b1' } };
      return { success: true, result: { success: true } };
    },
    exportOnce: async (a: Record<string, unknown>) => {
      exports++;
      const f = join(dir, `seg_${exports}.mp4`); writeFileSync(f, 'x');
      return { content: [{ type: 'text' as const, text: `Export saved to file:\nFile: ${f}\n\n${JSON.stringify({ duration: a.duration })}` }] };
    },
    ffmpeg: {
      available: async () => opts.ffmpeg !== false,
      streams: async (f: string) => ({ ok: true, signature: opts.sig ? opts.sig(f) : '[["video","h264"]]' }),
      concat: async (_s: string[], _l: string, out: string) => { writeFileSync(out, 'joined'); return { ok: true }; },
    },
  };
  return { deps, execs, exportsMade: () => exports };
}
const text = (r: { content?: Array<{ text?: string }> }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');

describe('perScene export', () => {
  const chain = [{ sceneId: 's1' }, { sceneId: 's2' }, { sceneId: 's3' }];

  it('renders every scene once, then reuses all of them', async () => {
    const h = harness(chain);
    const first = JSON.parse(text(await exportPerScene({ format: 'mp4', perScene: true }, 'mp4', h.deps as never)).split('\n\n')[1]);
    expect(first.perScene).toMatchObject({ segments: 3, rendered: 3, reused: 0 });
    const second = JSON.parse(text(await exportPerScene({ format: 'mp4', perScene: true }, 'mp4', h.deps as never)).split('\n\n')[1]);
    expect(second.perScene).toMatchObject({ rendered: 0, reused: 3 });
    expect(h.exportsMade()).toBe(3);
    expect(existsSync(second.filePath)).toBe(true);
  });

  it('always puts the chain back, and renders each scene alone at its own length', async () => {
    const h = harness([{ sceneId: 's1', duration: 1500 }, { sceneId: 's2' }]);
    await exportPerScene({ format: 'mp4' }, 'mp4', h.deps as never);
    expect(h.execs.some((c) => c.includes('sm.sceneChain = [];'))).toBe(true);
    expect(h.execs[h.execs.length - 1]).toContain('window.__ppSceneCacheChain');
  });

  it('a transition, a cut sound, one scene, a still format: exported whole, with the reason', () => {
    expect(perSceneRefusal([{ sceneId: 'a', duration: 1, transition: 'cut', cutSound: false }, { sceneId: 'b', duration: 1, transition: 'fade', cutSound: false }], 'mp4')).toContain('transitions (fade)');
    expect(perSceneRefusal([{ sceneId: 'a', duration: 1, transition: 'cut', cutSound: true }, { sceneId: 'b', duration: 1, transition: 'none', cutSound: true }], 'mp4')).toContain('cut sounds');
    expect(perSceneRefusal([{ sceneId: 'a', duration: 1, transition: 'cut', cutSound: false }], 'mp4')).toContain('two or more');
    expect(perSceneRefusal([], 'png')).toContain('not mp4 or webm');
  });

  it('without ffmpeg, or with segments whose streams differ, the chain is exported whole and says why', async () => {
    const noFf = harness(chain, { ffmpeg: false });
    expect(text(await exportPerScene({ format: 'mp4' }, 'mp4', noFf.deps as never))).toContain('ffmpeg is not on PATH');
    let n = 0;
    const mixed = harness(chain, { sig: () => (++n === 2 ? '[["video","h264"],["audio","aac"]]' : '[["video","h264"]]') });
    expect(text(await exportPerScene({ format: 'mp4' }, 'mp4', mixed.deps as never))).toContain("does not match the first one's streams");
  });

  it('the key changes with the scene, its length, a setting or the build', () => {
    const k = segmentKey({ a: 1 }, 2000, { fps: 30 }, 'b1');
    expect(segmentKey({ a: 2 }, 2000, { fps: 30 }, 'b1')).not.toBe(k);
    expect(segmentKey({ a: 1 }, 2500, { fps: 30 }, 'b1')).not.toBe(k);
    expect(segmentKey({ a: 1 }, 2000, { fps: 60 }, 'b1')).not.toBe(k);
    expect(segmentKey({ a: 1 }, 2000, { fps: 30 }, 'b2')).not.toBe(k);
    expect(segmentKey({ a: 1 }, 2000, { fps: 30 }, 'b1')).toBe(k);
  });
});
