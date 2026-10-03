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
}
export interface ChoreoFrame { x: number; y: number; width: number; height: number }
export interface ChoreoEvent { time: number; kind: 'pop' | 'whoosh' | 'contact' | 'shake'; strength: number }
export interface ChoreoResult {
  keyframes?: Array<{ time: number; properties: Record<string, number>; easing: string }>;
  /** The moments a sound belongs on (D68): pops, launches, contacts with their strength, shakes. */
  events?: ChoreoEvent[];
  end?: number;
  final?: { x: number; y: number; onScreen: boolean };
  warnings?: string[];
  error?: string;
}

export function compileChoreography(actor: ChoreoActor, frame: ChoreoFrame, beats: Array<Record<string, any>>): ChoreoResult {
  const VERBS = ['pop', 'drop', 'hop', 'bounce', 'roll', 'fly', 'peek', 'shake', 'squash', 'enter', 'exit'];
  const h = actor.h, w = actor.w;
  const warnings: string[] = [];
  const keys: Array<{ time: number; properties: Record<string, number>; easing: string }> = [];
  const events: Array<{ time: number; kind: string; strength: number }> = [];
  const ev = (time: number, kind: string, strength: number) => { events.push({ time: Math.round(time * 1000) / 1000, kind, strength: Math.round(Math.max(0.05, Math.min(1, strength)) * 100) / 100 }); };
  const r3 = (v: number) => Math.round(v * 1000) / 1000;
  // Live state: centre, scale factors, rotation delta, opacity.
  const s = { x: actor.x, y: actor.y, fx: 1, fy: 1, rot: 0, op: 1 };
  const key = (t: number, easing: string) => {
    keys.push({
      time: r3(t),
      easing,
      properties: {
        x: r3(s.x),
        // Keep the BOTTOM where it is while the body squashes or stretches.
        y: r3(s.y + (h / 2) * (1 - s.fy)),
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
    if (edge === 'left') return { x: frame.x - w / 2 - 2, y: at.y };
    if (edge === 'right') return { x: frame.x + frame.width + w / 2 + 2, y: at.y };
    if (edge === 'top') return { x: at.x, y: frame.y - h / 2 - 2 };
    if (edge === 'bottom') return { x: at.x, y: frame.y + frame.height + h / 2 + 2 };
    throw new Error('edge must be left, right, top or bottom (got ' + JSON.stringify(edge) + ')');
  };
  const squashTo = (fy: number) => { s.fy = fy; s.fx = 1 / Math.sqrt(Math.max(fy, 0.05)); };

  const sorted = beats.map((b, i) => ({ b, i })).sort((a, z) => (+a.b.at || 0) - (+z.b.at || 0));
  let t = 0;
  let started = false;
  try {
    for (const { b, i } of sorted) {
      const at = +b.at || 0;
      const verb = b.verb;
      if (VERBS.indexOf(verb) < 0) throw new Error('beat ' + i + ': unknown verb ' + JSON.stringify(verb) + ' — one of ' + VERBS.join(', '));
      if (started && at < t - 1e-6) throw new Error('beat ' + i + ' (' + verb + ' at ' + at + ' s) starts before the previous beat ends at ' + r3(t) + ' s; beats run one after another');
      const to = pt(b.to, 'beat ' + i + ' to');
      if (to && (to.x < frame.x || to.x > frame.x + frame.width || to.y < frame.y || to.y > frame.y + frame.height)) {
        warnings.push('beat ' + i + ' (' + verb + '): to [' + to.x + ', ' + to.y + '] is outside the frame, so the actor ends off screen there');
      }
      t = at;
      started = true;
      if (verb === 'pop') {
        const d = +b.duration || 0.5;
        squashTo(1); s.fx = 0; s.fy = 0; s.op = 0; key(t, 'linear');
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
        const airborne = s.y < land.y - h / 4;
        if (!airborne) { s.x = land.x; s.y = frame.y - h; }
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
        const height = b.height !== undefined ? +b.height : h * 1.2;
        squashTo(1); key(t, 'linear');
        squashTo(0.8); key(t + d * 0.15, 'easeOut');                         // anticipation
        ev(t + d * 0.2, 'whoosh', 0.35);
        s.x = from.x + (dest.x - from.x) * 0.2; s.y = from.y - height * 0.45; squashTo(1.15); key(t + d * 0.3, 'easeOut'); // launch
        s.x = (from.x + dest.x) / 2; s.y = Math.min(from.y, dest.y) - height; squashTo(1); key(t + d * 0.5, 'easeOut');  // apex
        s.x = from.x + (dest.x - from.x) * 0.8; s.y = dest.y - height * 0.45; squashTo(1.12); key(t + d * 0.7, 'easeIn');
        s.x = dest.x; s.y = dest.y; squashTo(0.75); key(t + d * 0.82, 'easeIn');   // contact
        ev(t + d * 0.82, 'contact', Math.min(1, height / Math.max(1, h * 1.5)));
        squashTo(1.06); key(t + d * 0.92, 'easeOut');
        squashTo(1); key(t + d, 'easeInOut');                                 // settle
        t += d;
      } else if (verb === 'bounce') {
        const times = Math.max(1, Math.round(+b.times || 3));
        const decay = b.decay !== undefined ? Math.min(0.95, Math.max(0.1, +b.decay)) : 0.6;
        let height = b.height !== undefined ? +b.height : h * 1.5;
        const per = (+b.duration || times * 0.5) / times;
        const from = { x: s.x, y: s.y };
        const dest = to || from;
        squashTo(1); key(t, 'linear');
        for (let k = 0; k < times; k++) {
          const f0 = k / times, f1 = (k + 1) / times;
          const gx = (f: number) => from.x + (dest.x - from.x) * f;
          const gy = (f: number) => from.y + (dest.y - from.y) * f;
          s.x = gx(f0); s.y = gy(f0); squashTo(0.78); key(t + per * 0.08, 'easeOut');
          s.x = gx((f0 + f1) / 2); s.y = gy((f0 + f1) / 2) - height; squashTo(1.08); key(t + per * 0.5, 'easeOut');
          s.x = gx(f1); s.y = gy(f1); squashTo(1.1); key(t + per * 0.95, 'easeIn');
          ev(t + per * 0.95, 'contact', Math.min(1, height / Math.max(1, h * 1.5)));
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
        s.rot += (dist / Math.max(1, h / 2)) * (180 / Math.PI);
        key(t + d, 'easeInOut');
        t += d;
      } else if (verb === 'fly') {
        const d = +b.duration || 1.2;
        if (!to) throw new Error('beat ' + i + ': fly needs to: [x, y]');
        const from = { x: s.x, y: s.y };
        const arc = b.arc !== undefined ? +b.arc : h * 2;
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
        const amount = b.amount !== undefined ? Math.min(1, Math.max(0.1, +b.amount)) : 0.5;
        const hold = b.hold !== undefined ? +b.hold : 1;
        const d = +b.duration || 0.5;
        const anchor = to || { x: s.x, y: s.y };
        const off = offEdge(edge, anchor);
        const showX = edge === 'left' ? off.x + w * amount : edge === 'right' ? off.x - w * amount : off.x;
        const showY = edge === 'top' ? off.y + h * amount : edge === 'bottom' ? off.y - h * amount : off.y;
        s.x = off.x; s.y = off.y; squashTo(1); s.op = 1; key(t, 'linear');
        s.x = showX; s.y = showY; key(t + d, 'easeOut');
        key(t + d + hold, 'linear');
        s.x = off.x; s.y = off.y; key(t + d * 2 + hold, 'easeIn');
        t += d * 2 + hold;
      } else if (verb === 'shake') {
        const d = +b.duration || 0.4;
        const amp = b.intensity !== undefined ? +b.intensity : Math.max(2, w * 0.08);
        const x0 = s.x;
        key(t, 'linear');
        ev(t, 'shake', 0.6);
        for (let k = 1; k <= 6; k++) { s.x = x0 + amp * (k % 2 ? 1 : -1) * (1 - k / 7); key(t + d * k / 7, 'easeInOut'); }
        s.x = x0; key(t + d, 'easeOut');
        t += d;
      } else if (verb === 'squash') {
        const d = +b.duration || 0.3;
        const a = b.amount !== undefined ? Math.min(0.8, Math.max(0.05, +b.amount)) : 0.25;
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
  const onScreen = s.x >= frame.x && s.x <= frame.x + frame.width && s.y >= frame.y && s.y <= frame.y + frame.height;
  return { keyframes: keys, events: events as ChoreoEvent[], end: r3(t), final: { x: r3(s.x), y: r3(s.y), onScreen }, warnings };
}
