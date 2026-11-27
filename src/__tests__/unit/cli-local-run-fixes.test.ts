/**
 * Found by running every CLI command against pinepaper.studio (2026-11-20), not by the unit suite:
 *  - the chart starter's bars grew from their centres, were all one height, and the video ended with them collapsed;
 *  - minimal and social-post put their easing on the first keyframe, where it does nothing;
 *  - `render -f png` / `-f pdf` failed on every starter: the manifest's video fps was sent with a still;
 *  - `tools list --toolkit core` showed 57 tools where the server lists 71;
 *  - `check` printed each lint suggestion as a bare "Consider relation constraint" WARN.
 */
import { describe, it, expect } from 'bun:test';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { TEMPLATES } from '../../cli/commands/init.js';
import { expandBatchMacros } from '../../tools/batch-macros.js';
import { compileBatchTimelines } from '../../tools/timeline.js';
import { timingFor } from '../../cli/commands/render.js';
import { lintSuggestionFinding } from '../../cli/commands/check.js';
import { getToolsForToolkit, detectVerbosityFromEnvironment } from '../../tools/toolkits.js';
import { getToolsForVerbosity } from '../../tools/definitions.js';
import { firstKeyEasingNoEffect } from '../../types/code-generator.js';

type Op = { type: string; itemType?: string; position?: { x: number; y: number }; properties?: Record<string, any>; itemId?: string; keyframes?: Array<{ time: number; properties: Record<string, number>; easing?: string }> };

describe('chart starter', () => {
  const expanded = expandBatchMacros(TEMPLATES.chart.operations as Array<Record<string, unknown>>) as unknown as Op[];
  const bars = expanded.filter((o) => o.type === 'create' && o.itemType === 'rectangle');
  it('has four bars of different heights', () => {
    expect(bars.length).toBe(4);
    expect(new Set(bars.map((b) => b.properties!.height)).size).toBe(4);
  });
  it('every bar keeps its bottom edge on one baseline at every key', () => {
    const tl = compileBatchTimelines(expanded as never);
    expect(tl.errors).toEqual([]);
    const bottoms = new Set(bars.map((b) => b.position!.y));
    expect(bottoms).toEqual(new Set([600]));
    for (const b of bars) {
      expect(b.properties!.anchor).toBe('bottom-left');
    }
    const plan = tl.plans.get(expanded.findIndex((o) => o.type === 'timeline'))!;
    expect(plan.tracks.length).toBe(4);
    const bottomSet = new Set<number>();
    plan.tracks.forEach((track, idx) => {
      const h = bars[idx].properties!.height as number;
      const yCenter = 600 - h / 2;
      for (const k of track.keyframes) {
        const ySpec = k.properties.y as { pivot?: number; s?: number } | undefined;
        expect(ySpec?.pivot).toBe(1);
        const s = ySpec!.s!;
        const yAtKey = yCenter + (ySpec!.pivot! * (h / 2) * (1 - s));
        bottomSet.add(Math.round((yAtKey + (s * h) / 2) * 1000) / 1000);
      }
    });
    expect(bottomSet).toEqual(new Set([600]));
  });
});

describe('starters', () => {
  it('no starter puts its easing on a first keyframe, where it has no effect', () => {
    for (const [name, t] of Object.entries(TEMPLATES)) {
      for (const op of t.operations as unknown as Op[]) {
        if (op.type !== 'keyframe_animate' || !op.keyframes) continue;
        expect([name, firstKeyEasingNoEffect(op.keyframes as never)]).toEqual([name, null]);
      }
    }
  });
});

describe('render timing', () => {
  const cfg = { fps: 30, duration: 4 };
  it("a still does not inherit the manifest's video fps or duration", () => {
    expect(timingFor('png', {}, cfg)).toEqual({ fps: undefined, duration: undefined });
    expect(timingFor('pdf', {}, cfg)).toEqual({ fps: undefined, duration: undefined });
  });
  it('a video does, and a typed flag always wins', () => {
    expect(timingFor('mp4', {}, cfg)).toEqual(cfg);
    expect(timingFor('mp4', { fps: 60 }, cfg)).toEqual({ fps: 60, duration: 4 });
    expect(timingFor('png', { fps: 12 }, cfg).fps).toBe(12);
  });
});

describe('tools list membership', () => {
  it('the built CLI lists as many core tools as the server does, at its default --verbosity', () => {
    const server = getToolsForToolkit(getToolsForVerbosity(detectVerbosityFromEnvironment()), 'core').length;
    const cli = resolve(import.meta.dir, '../../../dist/cli.js');
    const r = spawnSync(process.execPath.includes('bun') ? 'node' : process.execPath, [cli, 'tools', 'list', '--toolkit', 'core', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const out = JSON.parse(r.stdout);
    expect(out.tools.length).toBe(server);
  });
});

describe('check lint suggestions', () => {
  it('say what they relate, as a suggestion', () => {
    const f = lintSuggestionFinding({ from: 'item_1', to: 'item_3', type: 'aligned_with', params: { axis: 'y', offset: 0 } });
    expect(f.severity).toBe('suggestion');
    expect(f.message).toBe('consider aligned_with item_1 -> item_3 {"axis":"y","offset":0}');
  });
});
