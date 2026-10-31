/**
 * The timeline op (src/tools/timeline.ts): GSAP-shaped tweens compiled onto the engine's keyframe tracks.
 *
 * What this pins is what an agent relies on, not what is easy to assert:
 * - each GSAP semantic lands on the keys the engine will play (times, values, eases), checked key by key;
 * - a thing the engine cannot carry is refused BY NAME, with the reason, and never quietly approximated;
 * - every track is as long as the timeline, so no key outruns its clip;
 * - the batch the server sends writes those tracks (end to end through the MCP handler, and run against a stand-in
 *   studio, so the runtime half — names, rest values, the baseline — is exercised, not just the compiler).
 */
import { describe, it, expect } from 'bun:test';
import { compileTimeline, compileBatchTimelines, mapGsapEase, type TimelinePlan, type CompiledTrack } from '../../tools/timeline.js';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentBatchExecuteInputSchema } from '../../types/schemas.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../../index.js';

const plan = (op: Record<string, unknown>, creates: Array<{ name?: string; anchor?: string }> = []): TimelinePlan => {
  const r = compileTimeline({ type: 'timeline', ...op }, { creates });
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r.plan;
};
const refused = (op: Record<string, unknown>, creates: Array<{ name?: string; anchor?: string }> = []) => {
  const r = compileTimeline({ type: 'timeline', ...op }, { creates });
  if (r.ok) throw new Error('expected a refusal, got ' + JSON.stringify(r.plan.tracks));
  return r.errors;
};
const track = (p: TimelinePlan, ref: string): CompiledTrack => {
  const t = p.tracks.find((x) => x.ref === ref || x.target === ref);
  if (!t) throw new Error(`no track for ${ref}: ${p.tracks.map((x) => x.ref).join(', ')}`);
  return t;
};
/** [time, value, easing] for one property of a track. */
const keysOf = (t: CompiledTrack, prop: string) =>
  t.keyframes.filter((k) => k.properties[prop] !== undefined).map((k) => [k.time, k.properties[prop], k.easing]);

describe('timeline: eases', () => {
  it('maps GSAP names, old syntax and engine names onto the engine table', () => {
    const cases: Record<string, string> = {
      none: 'linear', linear: 'linear', power0: 'linear', 'Linear.easeNone': 'linear',
      'power1.out': 'easeOutQuad', power1: 'easeOutQuad', 'power1.in': 'easeInQuad', 'power1.inOut': 'easeInOutQuad',
      'power2.out': 'easeOutCubic', 'Power2.easeOut': 'easeOutCubic', 'power3.inOut': 'easeInOutQuart', 'power4.in': 'easeInQuint',
      'sine.inOut': 'easeInOutSine', 'expo.out': 'easeOutExpo', 'circ.in': 'easeInCirc',
      'back.out': 'easeOutBack', 'back.out(1.7)': 'easeOutBack', 'back.inOut': 'easeInOutBack',
      'elastic.out': 'easeOutElastic', 'elastic.out(1, 0.3)': 'easeOutElastic', 'bounce.out': 'easeOutBounce', 'bounce.in': 'easeInBounce',
      easeInOutCubic: 'easeInOutCubic', spring: 'spring',
    };
    for (const [gsap, engine] of Object.entries(cases)) expect(mapGsapEase(gsap), gsap).toEqual({ engine });
  });

  it('refuses a name with no equivalent, listing the accepted names — never linear', () => {
    for (const bad of ['elastic.inOut', 'bounce.inOut', 'steps(5)', 'rough', 'back.out(3)', 'elastic.out(1.2, 0.4)', 'power9.out']) {
      const r = mapGsapEase(bad);
      expect('error' in r, bad).toBe(true);
      expect((r as { error: string }).error).toContain('power2.inOut');
    }
    const errs = refused({ tweens: [{ to: 'item_1', vars: { x: 10 }, ease: 'elastic.inOut' }] });
    expect(errs[0].path).toBe('tweens[0].ease');
    expect(errs[0].message).toContain('elastic.in and elastic.out only');
  });

  it("uses GSAP's default ease (power1.out) when none is given, and says so", () => {
    const p = plan({ tweens: [{ to: 'item_1', vars: { opacity: 0 }, duration: 1 }] });
    expect(keysOf(track(p, 'item_1'), 'opacity')[1]).toEqual([1, 0, 'easeOutQuad']);
    expect(p.tweens[0].converted.join(' ')).toContain('power1.out');
    // defaults.ease wins over GSAP's default, a tween's own ease over defaults.
    const q = plan({ defaults: { ease: 'expo.out' }, tweens: [{ to: 'a', vars: { x: 1 }, duration: 1 }, { to: 'b', vars: { x: 1 }, duration: 1, ease: 'none' }] });
    expect(keysOf(track(q, 'a'), 'x')[1][2]).toBe('easeOutExpo');
    expect(keysOf(track(q, 'b'), 'x')[1][2]).toBe('linear');
  });
});

describe('timeline: to, from, fromTo', () => {
  it('to: starts from the value the item has (its rest value, read in the studio)', () => {
    const t = track(plan({ tweens: [{ to: 'ring', vars: { rotation: 480 }, duration: 8, ease: 'none', at: 0 }] }), 'ring');
    expect(keysOf(t, 'rotation')).toEqual([[0, { $rest: 'rotation' }, 'linear'], [8, 480, 'linear']]);
  });

  it('from: ends at the value the item has', () => {
    const t = track(plan({ tweens: [{ to: 'title', from: { opacity: 0 }, duration: 1, ease: 'none' }] }), 'title');
    expect(keysOf(t, 'opacity')).toEqual([[0, 0, 'linear'], [1, { $rest: 'opacity' }, 'linear']]);
  });

  it('fromTo: from + vars', () => {
    const t = track(plan({ tweens: [{ to: 'dot', from: { scale: 0.5 }, vars: { scale: 2 }, duration: 2, at: 1, ease: 'none' }] }), 'dot');
    expect(keysOf(t, 'scale')).toEqual([[1, 0.5, 'linear'], [3, 2, 'linear']]);
  });

  it('x and y are offsets from home, as in GSAP; "+=" is relative to the value at the tween\'s start', () => {
    const t = track(plan({ tweens: [
      { to: 'dot', from: { x: -200 }, duration: 1, ease: 'none' },
      { to: 'dot', vars: { x: '+=50', rotation: '+=90' }, duration: 1, ease: 'none' },
    ] }), 'dot');
    expect(keysOf(t, 'x')).toEqual([[0, { $rest: 'x', add: -200 }, 'linear'], [1, { $rest: 'x' }, 'linear'], [2, { $rest: 'x', add: 50 }, 'linear']]);
    expect(keysOf(t, 'rotation').at(-1)).toEqual([2, { $rest: 'rotation', add: 90 }, 'linear']);
  });

  it('a later tween starts where the earlier one ended on that property', () => {
    const t = track(plan({ tweens: [
      { to: 'a', vars: { opacity: 0.2 }, duration: 1, ease: 'none' },
      { to: 'a', vars: { opacity: 0.9 }, duration: 1, at: 3, ease: 'none' },
    ] }), 'a');
    // held at 0.2 from 1 s to 3 s: the 3 s key is there so the engine does not drift from 1 s.
    expect(keysOf(t, 'opacity')).toEqual([[0, { $rest: 'opacity' }, 'linear'], [1, 0.2, 'linear'], [3, 0.2, 'linear'], [4, 0.9, 'linear']]);
  });

  it('a fromTo that starts away from the current value jumps at its start (a hold key), not before', () => {
    const t = track(plan({ tweens: [
      { to: 'a', vars: { x: 100 }, duration: 1, ease: 'none' },
      { to: 'a', from: { x: 0 }, vars: { x: 50 }, duration: 1, at: 2, ease: 'none' },
    ] }), 'a');
    expect(keysOf(t, 'x').slice(2)).toEqual([[2, { $rest: 'x' }, 'hold'], [3, { $rest: 'x', add: 50 }, 'linear']]);
  });
});

let twN = 0;
describe('timeline: positions', () => {
  const starts = (tweens: unknown[], extra: Record<string, unknown> = {}) =>
    plan({ tweens, ...extra }).tweens.map((r) => r.start);
  const tw = (at?: unknown, more: Record<string, unknown> = {}) => ({ to: 'a' + (++twN), vars: { x: 1 }, duration: 1, ...(at !== undefined ? { at } : {}), ...more });

  it('omitted: the timeline\'s end; a number: absolute', () => {
    expect(starts([tw(), tw(), tw(5), tw()])).toEqual([0, 1, 5, 6]);
  });
  it('"<" and ">" with offsets', () => {
    expect(starts([tw(2), tw('<'), tw('>'), tw('<0.5'), tw('>-0.25'), tw('<+=1')])).toEqual([2, 2, 3, 3.5, 4.25, 5.25]);
  });
  it('"+=" / "-=" from the timeline\'s end, and labels', () => {
    expect(starts([tw(), tw('+=0.5'), tw('-=1')])).toEqual([0, 1.5, 1.5]);
    expect(starts([tw('intro'), tw('intro+=0.5')], { labels: { intro: 2 } })).toEqual([2, 2.5]);
  });
  it('delay adds to the position', () => {
    const p = plan({ tweens: [{ to: 'a', vars: { x: 1 }, duration: 1, at: 1, delay: 0.5 }] });
    expect(keysOf(track(p, 'a'), 'x')[0][0]).toBe(1.5);
  });
  it('refuses a position it cannot read', () => {
    expect(refused({ tweens: [tw('nolabel')] })[0].message).toContain('no label "nolabel"');
    expect(refused({ tweens: [tw('<25%')] })[0].path).toBe('tweens[0].at');
  });
});

describe('timeline: stagger', () => {
  const firstKeys = (stagger: unknown, n = 5) => {
    const names = [...Array(n)].map((_, i) => `b${i}`);
    const p = plan({ tweens: [{ to: names, vars: { opacity: 0 }, duration: 1, at: 1, stagger }] });
    return names.map((nm) => keysOf(track(p, nm), 'opacity')[0][0]);
  };
  it('a number: seconds between targets, in order', () => expect(firstKeys(0.1)).toEqual([1, 1.1, 1.2, 1.3, 1.4]));
  it('from end / center / edges / an index', () => {
    expect(firstKeys({ each: 0.1, from: 'end' })).toEqual([1.4, 1.3, 1.2, 1.1, 1]);
    expect(firstKeys({ each: 0.1, from: 'center' })).toEqual([1.2, 1.1, 1, 1.1, 1.2]);
    expect(firstKeys({ each: 0.1, from: 'edges' })).toEqual([1, 1.1, 1.2, 1.1, 1]);
    expect(firstKeys({ each: 0.1, from: 1 })).toEqual([1.1, 1, 1.1, 1.2, 1.3]);
  });
  it('amount: the whole spread', () => expect(firstKeys({ amount: 1 })).toEqual([1, 1.25, 1.5, 1.75, 2]));
  it('the tween ends when its last target does (for ">")', () => {
    const p = plan({ tweens: [{ to: ['a', 'b', 'c'], vars: { x: 1 }, duration: 1, stagger: 0.5 }, { to: 'd', vars: { x: 1 }, duration: 1, at: '>' }] });
    expect(p.tweens[0].end).toBe(2);
    expect(p.tweens[1].start).toBe(2);
  });
  it('refuses random and grid staggers by name', () => {
    expect(refused({ tweens: [{ to: ['a', 'b'], vars: { x: 1 }, stagger: { each: 0.1, from: 'random' } }] })[0].message).toContain('random');
    expect(refused({ tweens: [{ to: ['a', 'b'], vars: { x: 1 }, stagger: { each: 0.1, grid: [2, 1] } }] })[0].message).toContain('stagger.grid');
  });
});

describe('timeline: repeat and yoyo', () => {
  it('repeat -1 on an item with nothing else is the engine\'s loop, one cycle long', () => {
    const t = track(plan({ tweens: [{ to: 'spin', vars: { rotation: 360 }, duration: 2, ease: 'none', repeat: -1, at: 0 }] }), 'spin');
    expect(t.loop).toBe(true);
    expect(t.duration).toBe(2);
    expect(keysOf(t, 'rotation')).toEqual([[0, { $rest: 'rotation' }, 'linear'], [2, 360, 'linear']]);
  });

  it('repeat -1 with yoyo loops there and back, the return on the reversed ease', () => {
    const t = track(plan({ tweens: [{ to: 'p', from: { scale: 1 }, vars: { scale: 1.2 }, duration: 0.5, ease: 'power2.out', repeat: -1, yoyo: true, at: 0 }] }), 'p');
    expect(t.loop).toBe(true);
    expect(t.duration).toBe(1);
    expect(keysOf(t, 'scale')).toEqual([[0, 1, 'linear'], [0.5, 1.2, 'easeOutCubic'], [1, 1, 'easeInCubic']]);
  });

  it('a finite repeat is expanded; without yoyo each cycle jumps back (1 ms hold), with repeatDelay held', () => {
    const t = track(plan({ tweens: [{ to: 'a', from: { x: 0 }, vars: { x: 100 }, duration: 1, ease: 'none', repeat: 1, repeatDelay: 0.5 }] }), 'a');
    expect(keysOf(t, 'x')).toEqual([
      [0, { $rest: 'x' }, 'linear'], [1, { $rest: 'x', add: 100 }, 'linear'], [1.5, { $rest: 'x', add: 100 }, 'linear'],
      [1.501, { $rest: 'x' }, 'hold'], [2.5, { $rest: 'x', add: 100 }, 'linear'],
    ]);
    expect(t.duration).toBe(2.5);
  });

  it('repeat -1 beside other tweens needs the timeline\'s duration, and is expanded up to it', () => {
    const tweens = [{ to: 'a', vars: { opacity: 0 }, duration: 1 }, { to: 'a', from: { x: 0 }, vars: { x: 10 }, duration: 1, at: 1, repeat: -1, yoyo: true, ease: 'none' }];
    expect(refused({ tweens })[0].message).toContain('Give the timeline duration');
    const t = track(plan({ tweens, duration: 4 }), 'a');
    expect(keysOf(t, 'x').map((k) => k[0])).toEqual([0, 1, 2, 3, 4]);
    expect(t.duration).toBe(4);
    expect(t.loop).toBe(false);
  });

  it('a whole-timeline repeat -1 loops every track at the timeline\'s length', () => {
    const p = plan({ repeat: -1, tweens: [{ to: 'a', vars: { x: 1 }, duration: 1 }, { to: 'b', vars: { x: 1 }, duration: 3, at: 0 }] });
    for (const t of p.tracks) { expect(t.loop).toBe(true); expect(t.duration).toBe(3); }
  });
});

describe('timeline: duration — no key outruns its clip', () => {
  it('every track lasts to the timeline\'s end, not its own last key and never a 2 s default', () => {
    const p = plan({ tweens: [{ to: 'a', vars: { x: 1 }, duration: 0.5 }, { to: 'b', vars: { x: 1 }, duration: 1, at: 6 }] });
    expect(p.duration).toBe(7);
    expect(p.tracks.map((t) => t.duration)).toEqual([7, 7]);
    for (const t of p.tracks) expect(Math.max(...t.keyframes.map((k) => k.time))).toBeLessThanOrEqual(t.duration);
  });
  it('a declared duration longer than the tweens is the clip; shorter is refused', () => {
    expect(plan({ duration: 10, tweens: [{ to: 'a', vars: { x: 1 }, duration: 1 }] }).tracks[0].duration).toBe(10);
    expect(refused({ duration: 2, tweens: [{ to: 'a', vars: { x: 1 }, duration: 3 }] })[0].message).toContain('never played');
  });
});

describe('timeline: properties', () => {
  it('maps the GSAP names and says what it converted', () => {
    const p = plan({ tweens: [{ to: 'a', vars: { fill: '#ff0000', autoAlpha: 1, rotate: 90, strokeDashoffset: 0, stroke: '#00ff00' }, from: { strokeDashoffset: 300 }, duration: 1 }] });
    const last = track(p, 'a').keyframes.at(-1)!.properties;
    expect(last).toMatchObject({ fillColor: '#ff0000', opacity: 1, rotation: 90, dashOffset: 0, strokeColor: '#00ff00' });
    const conv = p.tweens[0].converted.join(' | ');
    for (const s of ['fill → fillColor', 'autoAlpha → opacity', 'rotate → rotation', 'strokeDashoffset → dashOffset']) expect(conv).toContain(s);
  });
  it('drawSVG is the engine\'s trim draw-on', () => {
    const t = track(plan({ tweens: [{ to: 'wave', from: { drawSVG: '0%' }, vars: { drawSVG: '100%' }, duration: 3, at: 4, ease: 'sine.inOut' }] }), 'wave');
    expect(keysOf(t, 'trimEnd')).toEqual([[4, 0, 'linear'], [7, 1, 'easeInOutSine']]);
    expect(keysOf(t, 'trimStart')).toEqual([]);
    const both = track(plan({ tweens: [{ to: 'w', from: { drawSVG: '50% 50%' }, vars: { drawSVG: '0% 100%' }, duration: 1 }] }), 'w');
    expect(keysOf(both, 'trimStart').map((k) => k[1])).toEqual([0.5, 0]);
  });
  it('refuses an unknown property BY NAME, and the known-impossible ones with the reason', () => {
    const e1 = refused({ tweens: [{ to: 'a', vars: { blurriness: 3 } }] });
    expect(e1[0]).toMatchObject({ path: 'tweens[0].vars.blurriness' });
    expect(e1[0].message).toContain('"blurriness" is not a property');
    expect(refused({ tweens: [{ to: 'a', vars: { xPercent: -50 } }] })[0].message).toContain('xPercent is refused');
    expect(refused({ tweens: [{ to: 'a', vars: { x: '50%' } }] })[0].message).toContain('percentage');
    expect(refused({ tweens: [{ to: 'a', vars: { x: 1 }, onComplete: 'f' }] })[0].message).toContain('callbacks');
    expect(refused({ tweens: [{ to: 'a', vars: { scale: 2, transformOrigin: 'left top' } }] })[0].message).toContain('centre only');
  });
  it('refuses two tweens on one property that overlap in time', () => {
    const e = refused({ tweens: [{ to: 'a', vars: { x: 1 }, duration: 2 }, { to: 'a', vars: { x: 5 }, duration: 1, at: 1 }] });
    expect(e[0].message).toContain('cannot overlap');
  });
  it('two properties arriving at one time on different eases are kept apart by 1 ms, and that is said', () => {
    const p = plan({ tweens: [{ to: 'a', vars: { x: 10 }, duration: 1, ease: 'none' }, { to: 'a', vars: { opacity: 0 }, duration: 0.5, at: 0.5, ease: 'expo.in' }] });
    const t = track(p, 'a');
    expect(keysOf(t, 'x').at(-1)![0]).toBe(1);
    expect(keysOf(t, 'opacity').at(-1)![0]).toBe(1.001);
    expect(p.notes.join(' ')).toContain('one key carries one ease');
  });
});

describe('timeline: targets and the baseline', () => {
  const creates = [{ name: 'bar-1', anchor: 'bottom-left' }, { name: 'bar-2', anchor: 'bottom-left' }, { name: 'title', anchor: 'top-left' }, { name: 'dot' }];
  it('a name this batch creates is its $N; a pattern expands in create order; others go to the studio as written', () => {
    const p = plan({ tweens: [{ to: 'bar-*', vars: { opacity: 1 } }, { to: ['dot', 'item_9', 'logo'], vars: { opacity: 1 } }] }, creates);
    expect(p.tracks.map((t) => t.target)).toEqual(['$0', '$1', '$3', 'item_9', 'logo']);
  });
  it('refuses an ambiguous name, a class selector, a pattern with no match, and $N past the creates', () => {
    expect(refused({ tweens: [{ to: 'x', vars: { x: 1 } }] }, [{ name: 'x' }, { name: 'x' }])[0].message).toContain('2 items');
    expect(refused({ tweens: [{ to: '.bar', vars: { x: 1 } }] })[0].message).toContain('CSS class');
    expect(refused({ tweens: [{ to: 'nope-*', vars: { x: 1 } }] }, creates)[0].message).toContain('matches no item');
    expect(refused({ tweens: [{ to: '$7', vars: { x: 1 } }] }, creates)[0].message).toContain('creates 4');
  });
  it('scaleY on a bottom-anchored item holds its baseline with matching y keys', () => {
    const t = track(plan({ tweens: [{ to: 'bar-1', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 1, ease: 'none' }] }, creates), '$0');
    expect(keysOf(t, 'y')).toEqual([[0, { $rest: 'y', pivot: 1, s: 0 }, 'linear'], [1, { $rest: 'y', pivot: 1, s: 1 }, 'linear']]);
    // top anchor pivots the other way; transformOrigin overrides the anchor
    // gsap.from: the end is the rest scale, resolved in the studio
    const top = track(plan({ tweens: [{ to: 'title', from: { scale: 0 }, duration: 1, ease: 'none' }] }, creates), '$2');
    expect(keysOf(top, 'y')).toEqual([[0, { $rest: 'y', pivot: -1, s: 0 }, 'linear'], [1, { $rest: 'y', pivot: -1 }, 'linear']]);
    // an item this batch does not create: its anchor is read in the studio, unless it also tweens y
    const later = plan({ tweens: [{ to: 'item_7', from: { scaleY: 0 }, duration: 1 }, { to: 'item_8', from: { scaleY: 0, y: 10 }, duration: 1 }] });
    expect((keysOf(track(later, 'item_7'), 'y')[0][1] as { pivot: string }).pivot).toBe('anchor');
    expect(keysOf(track(later, 'item_8'), 'y')[0][1]).toEqual({ $rest: 'y', add: 10 });
    expect(later.notes.join(' ')).toContain('scales about its centre');
    const centre = track(plan({ tweens: [{ to: 'bar-2', from: { scaleY: 0 }, vars: { transformOrigin: '50% 50%' }, duration: 1 }] }, creates), '$1');
    expect(keysOf(centre, 'y')).toEqual([]);
  });
  it('refuses a y tween on an item whose scale holds its edge', () => {
    expect(refused({ tweens: [{ to: 'bar-1', from: { scaleY: 0 }, vars: { scaleY: 1 } }, { to: 'bar-1', vars: { y: -20 } }] }, creates)[0].message).toContain('also tweens y');
  });
  it('in a batch, a timeline item cannot also take a keyframe_animate op, nor a second timeline', () => {
    const ops = [
      { type: 'create', itemType: 'circle', properties: { name: 'dot' } },
      { type: 'timeline', tweens: [{ to: 'dot', vars: { x: 10 } }] },
      { type: 'keyframe_animate', itemId: '$0', keyframes: [{ time: 0, properties: { opacity: 0 } }] },
      { type: 'timeline', tweens: [{ to: '$0', vars: { y: 10 } }] },
    ];
    const msgs = compileBatchTimelines(ops).errors.map((e) => e.path + ': ' + e.message);
    expect(msgs.some((m) => m.startsWith('operations[2].itemId') && m.includes('replace that track'))).toBe(true);
    expect(msgs.some((m) => m.startsWith('operations[3]') && m.includes('one timeline'))).toBe(true);
  });
  it('a receipt per tween: what it compiled to, when, and what was converted', () => {
    const p = plan({ tweens: [{ to: 'bar-*', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 0.8, at: 1, stagger: 0.2, ease: 'back.out' }] }, creates);
    expect(p.tweens[0]).toMatchObject({
      tween: 0, compiledTo: 'track', start: 1, end: 2, ease: { asked: 'back.out', engine: 'easeOutBack' },
      targets: [{ ref: 'bar-1', item: '$0', start: 1, end: 1.8 }, { ref: 'bar-2', item: '$1', start: 1.2, end: 2 }],
      properties: [{ asked: 'scaleY', engine: 'scaleY', from: '0', to: '1' }],
      dropped: [],
    });
    expect(p.tweens[0].converted.join(' ')).toContain('bottom edge');
  });
});

// ---------------------------------------------------------------------------------------------------------------
// End to end

/** Run an emitted batch against a stand-in studio, recording addAnimation. */
async function runAgainstStudio(code: string, items: Record<string, Record<string, unknown>>, names: Record<string, string> = {}) {
  const calls: Array<[string, Array<{ time: number; properties: Record<string, unknown>; easing: string }>, Record<string, unknown>]> = [];
  const app = {
    getItemById: (id: string) => items[id],
    resolveRef: (r: string) => (names[r] ? items[names[r]] : null),
    addAnimation: (...a: never[]) => { calls.push(a as never); },
    getCanvasSize: () => ({ width: 1920, height: 1080 }),
    historyManager: { saveState() {} },
  };
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  const result = await new Function('app', `return ${body}`)(app);
  return { result, calls };
}
const studioItem = (id: string, x: number, y: number, h = 100, anchor?: string) => ({
  data: { registryId: id, ...(anchor ? { anchor } : {}) }, position: { x, y }, scaling: { x: 1, y: 1 }, bounds: { width: 40, height: h }, opacity: 1, rotation: 0,
});

describe('timeline: end to end', () => {
  it('the batch writes one addAnimation per item, the rest values read from the item, names resolved by the studio', async () => {
    const code = codeGenerator.generateAgentBatchExecute(AgentBatchExecuteInputSchema.parse({ operations: [
      { type: 'timeline', tweens: [
        { to: 'item_1', from: { scaleY: 0 }, vars: { scaleY: 1, transformOrigin: 'bottom' }, duration: 1, ease: 'none' },
        { to: 'headline', from: { x: -100, opacity: 0 }, duration: 0.5, at: '<' },
      ] },
    ] }));
    const { result, calls } = await runAgainstStudio(code, { item_1: studioItem('item_1', 300, 500, 200), item_2: studioItem('item_2', 960, 100) }, { headline: 'item_2' });
    expect(result.success).toBe(true);
    expect(calls.map((c) => c[0])).toEqual(['item_1', 'item_2']);
    // The bar's centre goes from its bottom edge (500 + 200/2) to rest as it grows: the baseline holds.
    expect(calls[0][1]).toEqual([
      { time: 0, properties: { scaleY: 0, y: 600 }, easing: 'linear' },
      { time: 1, properties: { scaleY: 1, y: 500 }, easing: 'linear' },
    ]);
    expect(calls[0][2]).toEqual({ duration: 1, loop: false, timeUnits: 'seconds' });
    expect(calls[1][1][0].properties).toEqual({ x: 860, opacity: 0 });
    expect(calls[1][1][1].properties).toEqual({ x: 960, opacity: 1 });
    const tl = result.results[0].result.timeline;
    expect(tl.tracks.map((t: { ref: string; itemId: string }) => [t.ref, t.itemId])).toEqual([['item_1', 'item_1'], ['headline', 'item_2']]);
    expect(tl.tweens.length).toBe(2);
  });

  it('a bottom anchor the engine holds itself gets no y keys from here; bottom-left does', async () => {
    const code = codeGenerator.generateAgentBatchExecute(AgentBatchExecuteInputSchema.parse({ operations: [
      { type: 'timeline', tweens: [{ to: ['item_1', 'item_2'], from: { scaleY: 0 }, duration: 1 }] },
    ] }));
    const { calls } = await runAgainstStudio(code, { item_1: studioItem('item_1', 0, 500, 200, 'bottom'), item_2: studioItem('item_2', 0, 500, 200, 'bottom-left') });
    expect(calls[0][1].map((k) => k.properties.y)).toEqual([500, 500]);
    expect(calls[1][1].map((k) => k.properties.y)).toEqual([600, 500]);
  });

  it('a name the studio does not know fails the op, naming it', async () => {
    const code = codeGenerator.generateAgentBatchExecute(AgentBatchExecuteInputSchema.parse({ operations: [{ type: 'timeline', tweens: [{ to: 'ghost', vars: { x: 1 } }] }] }));
    const { result } = await runAgainstStudio(code, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('"ghost"');
  });

  it('through the MCP handler: a timeline batch returns code that writes the tracks; a bad tween is refused before anything runs', async () => {
    const server = await createServer({ browserMode: false, executionMode: 'code', toolkit: 'lane' } as never);
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    const client = new Client({ name: 'timeline-test', version: '0' });
    await client.connect(b);
    const ok = await client.callTool({ name: 'pinepaper_agent_batch_execute', arguments: { operations: [
      { type: 'create', itemType: 'circle', position: { x: 300, y: 300 }, properties: { radius: 40, color: '#22d3ee', name: 'dot' } },
      { type: 'timeline', tweens: [{ to: 'dot', from: { opacity: 0 }, vars: { x: 400 }, duration: 2, ease: 'power2.inOut' }] },
    ] } });
    expect(ok.isError, JSON.stringify(ok.content).slice(0, 400)).toBeFalsy();
    const text = JSON.stringify(ok.content);
    expect(text).toContain('app.addAnimation(__id');
    expect(text).toContain('easeInOutCubic');
    const bad = await client.callTool({ name: 'pinepaper_agent_batch_execute', arguments: { operations: [
      { type: 'create', itemType: 'circle', position: { x: 300, y: 300 }, properties: { radius: 40, name: 'dot' } },
      { type: 'timeline', tweens: [{ to: 'dot', vars: { x: 400, wobbliness: 2 } }] },
    ] } });
    expect(bad.isError).toBe(true);
    expect(JSON.stringify(bad.content)).toContain('operations[1].tweens[0].vars.wobbliness');
    await client.close();
  });
});

// ---------------------------------------------------------------------------------------------------------------
// The bar chart: one timeline op against today's create + keyframe_animate ops

const BASE = 900;
const bars = [280, 420, 360, 520, 300];
const sine = [...Array(25)].map((_, i) => [1100 + i * 30, 540 - Math.round(Math.sin(i / 3) * 80)]);
const createOps = [
  { type: 'set_canvas_size', width: 1920, height: 1080 },
  { type: 'set_background', backgroundColor: '#0b1026' },
  ...bars.map((h, i) => ({ type: 'create', itemType: 'rectangle', position: { x: 160 + i * 150, y: BASE }, properties: { width: 100, height: h, color: '#38bdf8', anchor: 'bottom-left', name: `bar-${i + 1}` } })),
  ...bars.map((h, i) => ({ type: 'create', itemType: 'text', position: { x: 210 + i * 150, y: BASE - h - 40 }, properties: { content: String(h), fontSize: 36, color: '#ffffff', name: `label-${i + 1}` } })),
  { type: 'create', itemType: 'circle', position: { x: 1500, y: 260 }, properties: { radius: 120, color: 'transparent', strokeColor: '#f472b6', strokeWidth: 14, name: 'ring' } },
  { type: 'create', itemType: 'path', position: { x: 1460, y: 540 }, properties: { points: sine, strokeColor: '#a3e635', strokeWidth: 6, name: 'wave' } },
];
const timelineOp = {
  type: 'timeline', defaults: { ease: 'power2.out' }, tweens: [
    { to: 'bar-*', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 0.8, at: 0.5, stagger: 0.15 },
    { to: 'label-*', from: { opacity: 0 }, duration: 0.4, at: '<0.6', stagger: 0.15 },
    { to: 'ring', vars: { rotation: 480 }, duration: 8, ease: 'none', at: 0 },
    { to: 'wave', from: { drawSVG: '0%' }, vars: { drawSVG: '100%' }, duration: 3, ease: 'sine.inOut', at: 4 },
  ],
};
/** The same motion as today's ops: a keyframe_animate per item, every key absolute, the bars keyed on height. */
const todayOps = [
  ...bars.map((h, i) => ({ type: 'keyframe_animate', itemId: `$${i}`, duration: 8, keyframes: [
    { time: 0, properties: { height: 0 } }, { time: 0.5 + i * 0.15, properties: { height: 0 } }, { time: 1.3 + i * 0.15, properties: { height: h }, easing: 'easeOutCubic' }] })),
  ...bars.map((_, i) => ({ type: 'keyframe_animate', itemId: `$${5 + i}`, duration: 8, keyframes: [
    { time: 0, properties: { opacity: 0 } }, { time: 1.1 + i * 0.15, properties: { opacity: 0 } }, { time: 1.5 + i * 0.15, properties: { opacity: 1 }, easing: 'easeOutCubic' }] })),
  { type: 'keyframe_animate', itemId: '$10', duration: 8, keyframes: [{ time: 0, properties: { rotation: 0 } }, { time: 8, properties: { rotation: 480 } }] },
  { type: 'keyframe_animate', itemId: '$11', duration: 8, keyframes: [{ time: 0, properties: { trimEnd: 0 } }, { time: 4, properties: { trimEnd: 0 } }, { time: 7, properties: { trimEnd: 1 }, easing: 'easeInOutSine' }] },
];

describe('timeline: the bar chart as ONE op', () => {
  const ops = [...createOps, timelineOp];
  const compiled = compileBatchTimelines(ops);
  const p = compiled.plans.get(ops.length - 1)!;

  it('compiles with no errors to 12 tracks, every one an 8 s clip', () => {
    expect(compiled.errors).toEqual([]);
    expect(p.duration).toBe(8);
    expect(p.tracks.length).toBe(12);
    for (const t of p.tracks) { expect(t.duration).toBe(8); expect(t.loop).toBe(false); }
  });

  it('bars grow from the baseline, staggered 0.15 s, on power2.out', () => {
    bars.forEach((_, i) => {
      const t = track(p, `$${i}`);
      const s = round(0.5 + i * 0.15);
      expect(keysOf(t, 'scaleY')).toEqual([[s, 0, 'linear'], [round(s + 0.8), 1, 'easeOutCubic']]);
      expect(keysOf(t, 'y')).toEqual([[s, { $rest: 'y', pivot: 1, s: 0 }, 'linear'], [round(s + 0.8), { $rest: 'y', pivot: 1, s: 1 }, 'easeOutCubic']]);
    });
  });

  it('labels fade in, staggered, starting 0.6 s after the bars begin', () => {
    bars.forEach((_, i) => {
      const s = round(1.1 + i * 0.15);
      expect(keysOf(track(p, `$${5 + i}`), 'opacity')).toEqual([[s, 0, 'linear'], [round(s + 0.4), { $rest: 'opacity' }, 'easeOutCubic']]);
    });
  });

  it('the ring turns 480° over 8 s, linear; the sine draws on from 4 s to 7 s', () => {
    expect(keysOf(track(p, '$10'), 'rotation')).toEqual([[0, { $rest: 'rotation' }, 'linear'], [8, 480, 'linear']]);
    expect(keysOf(track(p, '$11'), 'trimEnd')).toEqual([[4, 0, 'linear'], [7, 1, 'easeInOutSine']]);
  });

  it('the emitted batch writes those tracks with an 8 s clip, the bar baseline resolved against the item', async () => {
    const code = codeGenerator.generateAgentBatchExecute(AgentBatchExecuteInputSchema.parse({ operations: [timelineOp].map((o) => ({ ...o, tweens: o.tweens.map((t) => ({ ...t, to: t.to.replace('-*', '-1') })) })) }));
    const items = { 'bar-1': studioItem('item_1', 210, BASE - 140, 280, 'bottom-left'), 'label-1': studioItem('item_2', 210, 580), ring: studioItem('item_3', 1500, 260), wave: studioItem('item_4', 1460, 540) };
    const byId = Object.fromEntries(Object.values(items).map((it) => [it.data.registryId, it]));
    const { result, calls } = await runAgainstStudio(code, byId, Object.fromEntries(Object.entries(items).map(([n, it]) => [n, it.data.registryId])));
    expect(result.success).toBe(true);
    expect(calls.length).toBe(4);
    for (const c of calls) expect(c[2]).toEqual({ duration: 8, loop: false, timeUnits: 'seconds' });
    // bar-1: centre 760 at rest, 280 tall → at scale 0 the centre is on the baseline (900).
    expect(calls[0][1].map((k) => k.properties.y)).toEqual([BASE, BASE - 140]);
  });

  it('measures the payload against today\'s create + keyframe_animate ops', () => {
    const bytes = (v: unknown) => Buffer.byteLength(JSON.stringify(v), 'utf8');
    const tl = bytes(timelineOp), today = bytes(todayOps);
    const wholeTl = bytes({ operations: ops }), wholeToday = bytes({ operations: [...createOps, ...todayOps] });
    console.log(`[timeline payload] animation: timeline op ${tl} B vs ${todayOps.length} keyframe_animate ops ${today} B (${(100 * tl / today).toFixed(0)}%); whole batch ${wholeTl} B vs ${wholeToday} B (${(100 * wholeTl / wholeToday).toFixed(0)}%)`);
    expect(tl).toBeLessThan(today / 2);
    expect(wholeTl).toBeLessThan(wholeToday);
    // today's form is valid batch input, so the comparison is between two things the server takes
    expect(AgentBatchExecuteInputSchema.safeParse({ operations: [...createOps, ...todayOps] }).success).toBe(true);
    expect(AgentBatchExecuteInputSchema.safeParse({ operations: ops }).success).toBe(true);
  });
});

function round(t: number) { return Math.round(t * 1e4) / 1e4; }
