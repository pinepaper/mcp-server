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

describe('perScene with transitions: chain ranges (FxTool #250)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { rangeSegments } = require('../../tools/scene-cache-export.js');

  it('segments start at the cuts, snapped to frames, and cover the chain', () => {
    const segs = rangeSegments([{ sceneId: 'a', duration: 2000 }, { sceneId: 'b', duration: 1010 }, { sceneId: 'c', duration: 3000 }], 30);
    expect(segs.map((s: { start: number }) => s.start)).toEqual([0, 2, 3]);
    expect(segs.reduce((a: number, s: { duration: number }) => a + s.duration, 0)).toBeCloseTo(6, 6);
  });

  it('with a crossfade and a range-capable studio, each scene is a range of the chain, and an edit re-renders its range and the next', async () => {
    const chain = [{ sceneId: 's1' }, { sceneId: 's2', transition: 'fade' }, { sceneId: 's3', transition: 'fade' }];
    const h = harness(chain);
    const exec0 = h.deps.exec;
    let color2 = 'red';
    h.deps.exec = async (code: string) => {
      const r = await exec0(code);
      if (code.includes('sm.sceneChain.map')) {
        const v = r.result as Record<string, unknown>;
        v.ranges = true;
        v.scenes = JSON.stringify({ scenes: chain.map((e) => ({ id: e.sceneId, data: { color: e.sceneId === 's2' ? color2 : 'red' } })) });
      }
      return r;
    };
    const asked: Array<Record<string, unknown>> = [];
    const once = h.deps.exportOnce;
    h.deps.exportOnce = async (a: Record<string, unknown>) => { asked.push(a); return once(a); };
    const first = JSON.parse(text(await exportPerScene({ format: 'mp4', fps: 30 }, 'mp4', h.deps as never)).split('\n\n')[1]);
    expect(first.perScene.mode).toContain('chain ranges');
    expect(asked.map((a) => a.startTime)).toEqual([0, 2, 4]);
    expect(h.execs.some((c) => c.includes('sm.sceneChain = [];'))).toBe(false);
    color2 = 'blue';
    const second = JSON.parse(text(await exportPerScene({ format: 'mp4', fps: 30 }, 'mp4', h.deps as never)).split('\n\n')[1]);
    expect(second.perScene).toMatchObject({ rendered: 2, reused: 1 });
  });

  it('with a crossfade and a studio without ranges: whole, saying an update keeps them', async () => {
    const h = harness([{ sceneId: 's1' }, { sceneId: 's2', transition: 'fade' }]);
    expect(text(await exportPerScene({ format: 'mp4' }, 'mp4', h.deps as never))).toContain('a studio that renders time ranges keeps them');
  });
});

describe('agent_export startTime', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { codeGenerator } = require('../../types/code-generator.js');
  it('passes the range to the engine, mp4 / webm only, and only where the studio can render ranges', () => {
    const code = codeGenerator.generateAgentExport({ format: 'mp4', duration: 2, startTime: 4 });
    expect(code).toContain('"startTime":4');
    expect(code).toContain("app.exportEngine.supportsTimeRange === true");
    expect(code).toContain('only mp4 and webm can');
    expect(codeGenerator.generateAgentExport({ format: 'mp4', duration: 2 })).not.toContain('supportsTimeRange');
  });
});

describe('perScene with program audio (FxTool #251)', () => {
  it('segments render silent, the video joins alone, and the studio program audio goes on once, cut to length', async () => {
    const chain = [{ sceneId: 's1' }, { sceneId: 's2' }];
    const h = harness(chain);
    const exec0 = h.deps.exec;
    h.deps.exec = async (code: string) => {
      const r = await exec0(code);
      if (code.includes('sm.sceneChain.map')) (r.result as Record<string, unknown>).programAudio = true;
      return r;
    };
    const asked: Array<Record<string, unknown>> = [];
    const once = h.deps.exportOnce;
    h.deps.exportOnce = async (a: Record<string, unknown>) => { asked.push(a); return once(a); };
    const calls: string[] = [];
    (h.deps.ffmpeg as Record<string, unknown>).concat = async (_s: string[], _l: string, out: string, o: { videoOnly?: boolean }) => { calls.push(`concat videoOnly=${!!o?.videoOnly}`); writeFileSync(out, 'v'); return { ok: true }; };
    (h.deps.ffmpeg as Record<string, unknown>).mux = async (_v: string, _a: string, out: string, o: { seconds: number }) => { calls.push(`mux ${o.seconds}`); writeFileSync(out, 'va'); return { ok: true }; };
    (h.deps as Record<string, unknown>).programAudio = async (s: number) => { calls.push(`program ${s}`); return { file: '/tmp/x.wav' }; };
    const r = JSON.parse(text(await exportPerScene({ format: 'mp4' }, 'mp4', h.deps as never)).split('\n\n')[1]);
    expect(asked.every((a) => a.audio === false)).toBe(true);
    expect(calls).toEqual(['concat videoOnly=true', 'program 4', 'mux 4']);
    expect(r.audio).toContain('whole program');
  });
});
