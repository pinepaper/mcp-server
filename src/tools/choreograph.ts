/**
 * Beat verbs (tracker D67): an actor's acting as a list of beats — pop, hop,
 * bounce, roll, fly, drop, peek, shake, squash, enter, exit — compiled to one
 * keyframe track with squash and stretch.
 *
 * The primitives existed (keyframes, scale, rotation); what a model could not
 * do from a one-line brief was the CHOREOGRAPHY: anticipation, stretch on the
 * way up, squash on contact, a settle, a bottom that stays on the ground while
 * the body squashes. A bounce was six hand-timed keyframe calls, and a model
 * wrote a pulse instead.
 *
 * THIS FUNCTION IS SERIALISED INTO THE EMITTED CODE (Function#toString) and
 * runs in the studio, where it reads the actor's live size, scale and frame.
 * So it must stay CLOSED: no imports, no module constants, no helpers outside
 * its body, no `this`. A captured name would be a ReferenceError in the
 * browser that no typecheck sees; choreograph.test.ts runs the emitted code
 * to catch it.
 *
 * ENGINE SEMANTICS it is written against (FxTool js/KeyframeEngine.js):
 * x / y set item.position, the CENTRE; scaleX / scaleY are ABSOLUTE
 * (item.scaling = …), applied about that centre; rotation is an absolute
 * authored angle in degrees. So every scale is base × factor, every rotation
 * base + delta, and a squash moves the centre down by h/2·(1 − sy) to keep the
 * bottom on the ground.
 */

export interface ChoreoActor {
  x: number; y: number;          // centre
  w: number; h: number;          // unscaled size
  sx: number; sy: number;        // base scale
  rot: number;                   // base authored rotation, degrees
  /** The actor already has a track keying the beat properties (x, y, scale, rotation, opacity) that these beats MERGE into (B154). */
  hasTrack?: boolean;
  /** The radius a roll turns on: the DRAWN radius of a picture, not its box (ROLLSLIP). */
  rollRadius?: number;
  /**
   * A CHARACTER's whole figure, from the root's centre (SQUASHRIG37 / CHOREOHEIGHT37): w/h are the root item's box
   * (the torso), so a squash kept the torso's bottom planted and the feet sank, and "the actor's height" was a third
   * of the figure. Absent for a plain item, where each defaults to half its box.
   */
  feetBelow?: number; headAbove?: number; leftOf?: number; rightOf?: number;
}
export interface ChoreoFrame { x: number; y: number; width: number; height: number }
export interface ChoreoEvent { time: number; kind: 'pop' | 'whoosh' | 'contact' | 'shake'; strength: number }
export interface ChoreoResult {
  keyframes?: Array<{ time: number; properties: Record<string, number>; easing: string }>;
  /** The moments a sound belongs on (D68): pops, launches, contacts with their strength, shakes. */
  events?: ChoreoEvent[];
  end?: number;
  /** onScreen: the whole figure is inside the frame at the end. centreOnScreen: its centre point is. */
  final?: { x: number; y: number; onScreen: boolean; centreOnScreen?: boolean };
  warnings?: string[];
  /** Beats whose size was left out: the setting and the value the default came to, so a default is never silent. */
  defaultsUsed?: Array<{ beat: number; verb: string; setting: string; value: number; rule: string }>;
  error?: string;
}

export function compileChoreography(actor: ChoreoActor, frame: ChoreoFrame, beats: Array<Record<string, any>>): ChoreoResult {
  const VERBS = ['pop', 'drop', 'hop', 'bounce', 'roll', 'fly', 'peek', 'shake', 'squash', 'enter', 'exit'];
  const h = actor.h, w = actor.w;
  // How far the actor reaches from its centre: its box, or a character's whole figure.
  const ext = (v: number | undefined, d: number) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : d);
  const below = ext(actor.feetBelow, h / 2), above = ext(actor.headAbove, h / 2);
  const leftOf = ext(actor.leftOf, w / 2), rightOf = ext(actor.rightOf, w / 2);
  const H = above + below, W = leftOf + rightOf;
  const warnings: string[] = [];
  const defaultsUsed: Array<{ beat: number; verb: string; setting: string; value: number; rule: string }> = [];
  const dflt = function (beat: number, verb: string, setting: string, value: number, rule: string) { defaultsUsed.push({ beat: beat, verb: verb, setting: setting, value: Math.round(value * 1000) / 1000, rule: rule }); return value; };
  const keys: Array<{ time: number; properties: Record<string, number>; easing: string }> = [];
  const events: Array<{ time: number; kind: string; strength: number }> = [];
  const ev = (time: number, kind: string, strength: number) => { events.push({ time: Math.round(time * 1000) / 1000, kind, strength: Math.round(Math.max(0.05, Math.min(1, strength)) * 100) / 100 }); };
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  // Live state: centre, scale factors, rotation delta, opacity.
  const s = { x: actor.x, y: actor.y, fx: 1, fy: 1, rot: 0, op: 1 };
  // How far the figure's box reached past each frame edge during each beat, so a beat that leaves the frame can be
  // named (the checks used to look at the centre point only: FLYTO40 landed a figure with its legs cut off and
  // answered onScreen: true).
  let beatNow = -1;
  const overflow = new Map<number, { top: number; bottom: number; left: number; right: number }>();
  const boxOver = () => ({
    top: Math.max(0, frame.y - (s.y - above * s.fy)),
    bottom: Math.max(0, s.y + below - (frame.y + frame.height)),
    left: Math.max(0, frame.x - (s.x - leftOf * s.fx)),
    right: Math.max(0, s.x + rightOf * s.fx - (frame.x + frame.width)),
  });
  const key = (t: number, easing: string) => {
    if (beatNow >= 0) {
      const o = boxOver(), m = overflow.get(beatNow) || { top: 0, bottom: 0, left: 0, right: 0 };
      overflow.set(beatNow, { top: Math.max(m.top, o.top), bottom: Math.max(m.bottom, o.bottom), left: Math.max(m.left, o.left), right: Math.max(m.right, o.right) });
    }
    keys.push({
      time: r3(t),
      easing,
      properties: {
        x: r3(s.x),
        // Keep the BOTTOM where it is while the body squashes or stretches.
        y: r3(s.y + below * (1 - s.fy)),
        scaleX: r3(actor.sx * s.fx),
        scaleY: r3(actor.sy * s.fy),
        rotation: r3(actor.rot + s.rot),
        opacity: r3(s.op),
      },
    });
  };
  const pt = (v: any, name: string): { x: number; y: number } | null => {
    if (v === undefined || v === null) return null;
    if (Array.isArray(v) && v.length >= 2 && isFinite(v[0]) && isFinite(v[1])) return { x: +v[0], y: +v[1] };
    if (typeof v === 'object' && isFinite(v.x) && isFinite(v.y)) return { x: +v.x, y: +v.y };
    throw new Error(name + ' must be [x, y] or {x, y}');
  };
  const offEdge = (edge: string, at: { x: number; y: number }) => {
    if (edge === 'left') return { x: frame.x - rightOf - 2, y: at.y };
    if (edge === 'right') return { x: frame.x + frame.width + leftOf + 2, y: at.y };
    if (edge === 'top') return { x: at.x, y: frame.y - below - 2 };
    if (edge === 'bottom') return { x: at.x, y: frame.y + frame.height + above + 2 };
    throw new Error('edge must be left, right, top or bottom (got ' + JSON.stringify(edge) + ')');
  };
  const squashTo = (fy: number) => { s.fy = fy; s.fx = 1 / Math.sqrt(Math.max(fy, 0.05)); };

  const sorted = beats.map((b, i) => ({ b, i })).sort((a, z) => (+a.b.at || 0) - (+z.b.at || 0));
  let t = 0;
  let started = false;
  if (sorted.length > 0) {
    const firstAt = +sorted[0].b.at || 0;
    if (firstAt > 0) {
      const firstVerb = sorted[0].b.verb;
      const isEntrance = firstVerb === 'enter' || firstVerb === 'pop' || firstVerb === 'peek';
      // A hold key at 0 pins the actor where it starts. Merged into a track
      // the actor already has, that key OVERWRITES the existing track's key
      // at 0 (B154 / HOOKCLOCK3: the first move jumped to the second call's
      // start), so it is only written when no track keys those properties
      // (a colour-only track still gets it, B109).
      if (!isEntrance && !actor.hasTrack) {
        key(0, 'linear');
      }
    }
  }
  try {
    for (const { b, i } of sorted) {
      const at = +b.at || 0;
      const verb = b.verb;
      beatNow = i;
      if (VERBS.indexOf(verb) < 0) throw new Error('beat ' + i + ': unknown verb ' + JSON.stringify(verb) + ' — one of ' + VERBS.join(', '));
      if (started && at < t - 1e-6) throw new Error('beat ' + i + ' (' + verb + ' at ' + at + ' s) starts before the previous beat ends at ' + r3(t) + ' s; beats run one after another');
      const to = pt(b.to, 'beat ' + i + ' to');
      if (to && (to.x < frame.x || to.x > frame.x + frame.width || to.y < frame.y || to.y > frame.y + frame.height)) {
        warnings.push('beat ' + i + ' (' + verb + '): to [' + to.x + ', ' + to.y + '] is outside the frame, so the actor ends off screen there');
      } else if (to && verb !== 'exit') {
        // to is where the CENTRE goes. A ground height passed as to.y sank the figure by its lower half (FLYTO40).
        const lowBy = to.y + below - (frame.y + frame.height), highBy = frame.y - (to.y - above);
        const leftBy = frame.x - (to.x - leftOf), rightBy = to.x + rightOf - (frame.x + frame.width);
        const cut = lowBy > 1 ? Math.round(lowBy) + ' px of it below the frame' : highBy > 1 ? Math.round(highBy) + ' px of it above the frame' : leftBy > 1 ? Math.round(leftBy) + ' px of it past the left edge' : rightBy > 1 ? Math.round(rightBy) + ' px of it past the right edge' : '';
        if (cut) {
          warnings.push('beat ' + i + ' (' + verb + '): to [' + to.x + ', ' + to.y + "] is where the actor's CENTRE ends, and the actor reaches " + Math.round(above) + ' px above and ' + Math.round(below) + ' px below its centre, so it ends with ' + cut + '.'
            + (lowBy > 1 ? ' To stand it on y = ' + to.y + ', pass to.y = ' + Math.round(to.y - below) + '.' : ''));
        }
      }
      // intensity is shake's amplitude in px and nothing else reads it: on the
      // other ten verbs it was accepted and ignored (11/11 probed). Said, with
      // the verb's own size where it has one.
      if (b.intensity !== undefined && verb !== 'shake') {
        const own = verb === 'hop' || verb === 'bounce' || verb === 'drop' ? 'height' : verb === 'fly' ? 'arc' : verb === 'squash' || verb === 'peek' ? 'amount' : '';
        warnings.push('beat ' + i + ' (' + verb + '): intensity is read only by shake (its amplitude in px), so it changed nothing here' + (own ? '; size this beat with ' + own : ''));
      }
      t = at;
      started = true;
      if (verb === 'pop') {
        const d = +b.duration || 0.5;
        // From 1%, not 0 (POPRIG37): the studio passes a character root's scale on to its parts, and a part scaled to 0
        // cannot be scaled back (its matrix is singular), so the head and limbs never came back. At opacity 0 the 1%
        // start is invisible either way.
        squashTo(1); s.fx = 0.01; s.fy = 0.01; s.op = 0; key(t, 'linear');
        ev(t, 'pop', 0.8);
        s.fx = 1.15; s.fy = 1.15; s.op = 1; key(t + d * 0.6, 'easeOut');
        s.fx = 1; s.fy = 1; key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'drop') {
        const d = +b.duration || 0.7;
        const land = to || { x: s.x, y: s.y };
        // ALREADY IN THE AIR (after a fly, say): fall from where it is. Only an
        // actor at or below its landing line comes in from above the frame —
        // snapping an airborne actor up and off screen first was a visible jump
        // (prod retest, fly → drop).
        const airborne = s.y < land.y - H / 4;
        if (!airborne) { s.x = land.x; s.y = frame.y - below - H / 2; }
        squashTo(airborne ? 1 : 1.15); s.op = 1; key(t, 'linear');
        s.x = land.x; s.y = land.y; squashTo(1.15); key(t + d * 0.7, 'easeIn');
        ev(t + d * 0.72, 'contact', 1);
        squashTo(0.7); key(t + d * 0.78, 'easeOut');
        squashTo(1.08); key(t + d * 0.9, 'easeOut');
        squashTo(1); key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'hop') {
        const d = +b.duration || 0.7;
        const from = { x: s.x, y: s.y };
        const dest = to || from;
        const height = b.height !== undefined ? +b.height : dflt(i, verb, 'height', H * 1.2, "1.2 x the actor's height, in px");
        squashTo(1); key(t, 'linear');
        squashTo(0.8); key(t + d * 0.15, 'easeOut');                         // anticipation
        ev(t + d * 0.2, 'whoosh', 0.35);
        s.x = from.x + (dest.x - from.x) * 0.2; s.y = from.y - height * 0.45; squashTo(1.15); key(t + d * 0.3, 'easeOut'); // launch
        s.x = (from.x + dest.x) / 2; s.y = Math.min(from.y, dest.y) - height; squashTo(1); key(t + d * 0.5, 'easeOut');  // apex
        s.x = from.x + (dest.x - from.x) * 0.8; s.y = dest.y - height * 0.45; squashTo(1.12); key(t + d * 0.7, 'easeIn');
        s.x = dest.x; s.y = dest.y; squashTo(0.75); key(t + d * 0.82, 'easeIn');   // contact
        ev(t + d * 0.82, 'contact', Math.min(1, height / Math.max(1, H * 1.5)));
        squashTo(1.06); key(t + d * 0.92, 'easeOut');
        squashTo(1); key(t + d, 'easeInOut');                                 // settle
        t += d;
      } else if (verb === 'bounce') {
        const times = Math.max(1, Math.round(+b.times || 3));
        const decay = b.decay !== undefined ? Math.min(0.95, Math.max(0.1, +b.decay)) : 0.6;
        let height = b.height !== undefined ? +b.height : dflt(i, verb, 'height', H * 1.5, "1.5 x the actor's height, in px");
        const per = (+b.duration || times * 0.5) / times;
        const from = { x: s.x, y: s.y };
        const dest = to || from;
        squashTo(1); key(t, 'linear');
        // The push-off sounds like a hop's; every later rebound is a contact (CHORSND23).
        ev(t + per * 0.1, 'whoosh', 0.35);
        for (let k = 0; k < times; k++) {
          const f0 = k / times, f1 = (k + 1) / times;
          const gx = (f: number) => from.x + (dest.x - from.x) * f;
          const gy = (f: number) => from.y + (dest.y - from.y) * f;
          s.x = gx(f0); s.y = gy(f0); squashTo(0.78); key(t + per * 0.08, 'easeOut');
          s.x = gx((f0 + f1) / 2); s.y = gy((f0 + f1) / 2) - height; squashTo(1.08); key(t + per * 0.5, 'easeOut');
          s.x = gx(f1); s.y = gy(f1); squashTo(1.1); key(t + per * 0.95, 'easeIn');
          ev(t + per * 0.95, 'contact', Math.min(1, height / Math.max(1, H * 1.5)));
          t += per;
          height *= decay;
        }
        squashTo(0.82); key(t + 0.06, 'easeOut');
        squashTo(1); key(t + 0.22, 'easeInOut');
        t += 0.22;
      } else if (verb === 'roll') {
        const d = +b.duration || 1;
        if (!to) throw new Error('beat ' + i + ': roll needs to: [x, y]');
        const dist = to.x - s.x;
        squashTo(1); key(t, 'linear');
        s.x = to.x; s.y = to.y;
        // Rolling without slipping: angle = distance / radius; y-down, so rolling right turns clockwise (+).
        // The drawn radius when the studio measured one (a disc on a PNG with a
        // margin rolled by its half-box and slid 9.1%, ROLLSLIP); else the box.
        const rr = actor.rollRadius && actor.rollRadius > 0 ? actor.rollRadius : below;
        s.rot += (dist / Math.max(1, rr)) * (180 / Math.PI);
        key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'fly') {
        const d = +b.duration || 1.2;
        if (!to) throw new Error('beat ' + i + ': fly needs to: [x, y]');
        const from = { x: s.x, y: s.y };
        const arc = b.arc !== undefined ? +b.arc : dflt(i, verb, 'arc', H * 2, "2 x the actor's height, in px");
        const cx = (from.x + to.x) / 2, cy = Math.min(from.y, to.y) - arc;
        const tilt = Math.max(-18, Math.min(18, (to.x - from.x) / Math.max(1, frame.width) * 40));
        const r0 = s.rot;
        squashTo(1); key(t, 'linear');
        squashTo(0.85); key(t + d * 0.08, 'easeOut');
        ev(t + d * 0.08, 'whoosh', 0.8);
        const N = 6;
        for (let k = 1; k <= N; k++) {
          const u = k / N;
          s.x = (1 - u) * (1 - u) * from.x + 2 * (1 - u) * u * cx + u * u * to.x;
          s.y = (1 - u) * (1 - u) * from.y + 2 * (1 - u) * u * cy + u * u * to.y;
          s.rot = r0 + (k < N ? tilt * (1 - 2 * u) : 0);  // nose up on the rise, down on the fall
          squashTo(k < N ? 1.1 : 1);
          key(t + d * (0.08 + 0.92 * u), k === N ? 'easeOut' : 'linear');
        }
        t += d;
      } else if (verb === 'peek') {
        const edge = b.edge || 'left';
        const amount = b.amount !== undefined ? Math.min(1, Math.max(0.1, +b.amount)) : dflt(i, verb, 'amount', 0.5, 'half the actor shows');
        const hold = b.hold !== undefined ? +b.hold : 1;
        const d = +b.duration || 0.5;
        const anchor = to || { x: s.x, y: s.y };
        const off = offEdge(edge, anchor);
        const showX = edge === 'left' ? off.x + W * amount : edge === 'right' ? off.x - W * amount : off.x;
        const showY = edge === 'top' ? off.y + H * amount : edge === 'bottom' ? off.y - H * amount : off.y;
        s.x = off.x; s.y = off.y; squashTo(1); s.op = 1; key(t, 'linear');
        s.x = showX; s.y = showY; key(t + d, 'easeOut');
        key(t + d + hold, 'linear');
        s.x = off.x; s.y = off.y; key(t + d * 2 + hold, 'easeIn');
        t += d * 2 + hold;
      } else if (verb === 'shake') {
        const d = +b.duration || 0.4;
        const amp = b.intensity !== undefined ? +b.intensity : dflt(i, verb, 'intensity', Math.max(2, W * 0.08), "8% of the actor's width, in px (at least 2)");
        const x0 = s.x;
        key(t, 'linear');
        ev(t, 'shake', 0.6);
        for (let k = 1; k <= 6; k++) { s.x = x0 + amp * (k % 2 ? 1 : -1) * (1 - k / 7); key(t + d * k / 7, 'easeInOut'); }
        s.x = x0; key(t + d, 'easeOut');
        t += d;
      } else if (verb === 'squash') {
        const d = +b.duration || 0.3;
        const a = b.amount !== undefined ? Math.min(0.8, Math.max(0.05, +b.amount)) : dflt(i, verb, 'amount', 0.25, 'a 25% squash');
        key(t, 'linear');
        squashTo(1 - a); key(t + d * 0.35, 'easeOut');
        ev(t + d * 0.3, 'contact', a * 2);
        squashTo(1 + a * 0.3); key(t + d * 0.7, 'easeOut');
        squashTo(1); key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'enter') {
        const d = +b.duration || 0.8;
        const dest = to || { x: s.x, y: s.y };
        const off = offEdge(b.from || 'left', dest);
        s.x = off.x; s.y = off.y; squashTo(1); s.op = 1; key(t, 'linear');
        ev(t, 'whoosh', 0.6);
        const ox = (dest.x - off.x) * 0.06, oy = (dest.y - off.y) * 0.06;
        s.x = dest.x + ox; s.y = dest.y + oy; key(t + d * 0.75, 'easeOut');    // overshoot
        s.x = dest.x; s.y = dest.y; key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'exit') {
        const d = +b.duration || 0.6;
        const off = offEdge(b.edge || 'right', { x: s.x, y: s.y });
        const ax = (s.x - off.x) * 0.04, ay = (s.y - off.y) * 0.04;
        key(t, 'linear');
        s.x += ax; s.y += ay; squashTo(0.9); key(t + d * 0.2, 'easeOut');     // anticipation
        ev(t + d * 0.2, 'whoosh', 0.6);
        s.x = off.x; s.y = off.y; squashTo(1); key(t + d, 'easeIn');
        t += d;
      }
    }
  } catch (e: any) {
    return { error: String(e && e.message || e) };
  }
  if (!keys.length) return { error: 'no beats' };
  // onScreen is the whole figure inside the frame, not its centre point; centreOnScreen keeps the old reading.
  const centreOnScreen = s.x >= frame.x && s.x <= frame.x + frame.width && s.y >= frame.y && s.y <= frame.y + frame.height;
  const fin = boxOver();
  const onScreen = centreOnScreen && fin.top <= 1 && fin.bottom <= 1 && fin.left <= 1 && fin.right <= 1;
  // A DEFAULT THAT TAKES THE ACTOR OUT OF THE FRAME is said, with the setting to pass (a wrong knob warned, an
  // omitted one did not, so an oversized default beat failed in silence).
  const seenBeat = new Set<number>();
  for (const d of defaultsUsed) {
    const o = overflow.get(d.beat);
    if (!o || seenBeat.has(d.beat) || d.verb === 'exit' || d.verb === 'enter' || d.verb === 'peek') continue;
    const worst = ([['top', o.top], ['bottom', o.bottom], ['left', o.left], ['right', o.right]] as Array<[string, number]>).sort((a, z) => z[1] - a[1])[0];
    if (worst[1] <= 1) continue;
    seenBeat.add(d.beat);
    const mine = defaultsUsed.filter((x) => x.beat === d.beat).map((x) => x.setting + ' ' + x.value).join(', ');
    warnings.push('beat ' + d.beat + ' (' + d.verb + '): with the default ' + mine + ' the actor goes ' + Math.round(worst[1]) + ' px past the ' + worst[0] + ' of the frame during this beat. Pass ' + defaultsUsed.filter((x) => x.beat === d.beat).map((x) => x.setting).join(' / ') + ' to size it.');
  }
  return { keyframes: keys, events: events as ChoreoEvent[], end: r3(t), final: { x: r3(s.x), y: r3(s.y), onScreen, centreOnScreen }, warnings, ...(defaultsUsed.length ? { defaultsUsed } : {}) };
}
