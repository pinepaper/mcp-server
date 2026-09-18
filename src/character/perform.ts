/* VENDORED from mcp-cloud/src/services/character-perform.ts.
 * sha256: 91737fa6410fbe24e7b969c9d1a97ca4c6694c117854ce3182606efa41e98db7
 * Generator: scripts/sync-character-modules.mjs
 *
 * Do NOT edit here — change it in mcp-cloud and re-run the generator, or the
 * two implementations drift and a figure performs differently depending on
 * which surface a caller reached. Guarded by character.test.ts.
 */
/**
 * A CHARACTER IS DIRECTED, NOT DRAWN.
 *
 * This is the translation step the declarative graph exists for. A model says
 * WHAT happens — this character, here, this tall, blinks at 1.2s and speaks
 * from 2.0 to 4.5 — and the knowledge of HOW lives in the graph: which parts
 * the figure has, which of them are alternates of one another, how long a blink
 * lasts, how fast a mouth moves. Nothing here asks a model for geometry.
 *
 * WHY IT HAS TO BE THIS WAY. The alternative is what exists today: a model
 * writes thirty-odd correct calls — create the skeleton, add each bone with the
 * right parent and angle, create each shape, attach each to the right bone,
 * then author poses — and one mistake anywhere leaves a broken figure. That is
 * a lot of exactly-right output to ask of a language model, and it is the
 * reported reason characters do not work. A symbol and a list of beats is
 * something a small model can get right, and a small model getting it right is
 * the difference between this running in the cloud and running on someone's
 * laptop.
 *
 * THE THREE MOTIONS ARE THE ONES STORYTELLERS ASKED FOR — blink, speak, turn
 * the head — and each is expressed with machinery both renderers were measured
 * on this week: opacity keyframes and position keyframes. No shape keys, no IK,
 * no deformers. A channel that needs a subsystem the container cannot draw is a
 * channel that works in a preview and fails in the delivered video, which is
 * the failure this whole layer is a response to.
 *
 * NOT LIP SYNC. `say` opens and closes the mouth for the length of a line; it
 * does not match phonemes, because matching phonemes needs the word timings a
 * voice track carries and no voice track exists yet. Called `say` rather than
 * `lipSync` so nobody reads more into it than it does.
 */
import { DURATION_SCALE_MS } from "./duration-scale.js";
import { pathBBox, scalePath, shiftPath } from "./path-bbox.js";

/** Nearest duration token to `ms` — the same rounding the token repair uses. */
const nearestOnScale = (ms: number): number =>
  DURATION_SCALE_MS.reduce((best: number, d: number) => (Math.abs(d - ms) < Math.abs(best - ms) ? d : best), DURATION_SCALE_MS[0]!);

export interface CharacterPart {
  at: [number, number];
  path: string;
  fill?: string;
  /**
   * HOW MUCH OF THE STYLE'S INK THIS PART TAKES. 1 (default) is the full
   * silhouette weight; a fraction is interior linework; 0 is unlined.
   *
   * ONE WEIGHT FOR EVERYTHING IS WHAT MAKES A FIGURE READ AS STICKERS. The ink
   * rule already refuses to outline a part that is itself ink, which stopped
   * faces smearing — but every other part got the identical silhouette stroke,
   * so a wing lying ON a body was drawn with exactly the line that separates
   * the body from the sky. Rendered at 0.6s and 0.9s of `ledge-at-dusk`, the
   * pigeon reads as a circle-with-an-outline sitting on an ellipse-with-an-
   * outline: the seams between primitives are drawn at full strength, which is
   * the "the head is not connected" complaint in one sentence.
   *
   * Flat illustration has a hierarchy — a heavy contour where form meets
   * background, a lighter line where form meets form. This is that, as a
   * property of the drawing rather than a constant in the renderer.
   */
  inkWeight?: number;
  /**
   * THE BONE. Which part carries this one.
   *
   * Everything Rive and Lottie do to keep a figure whole, this one field does:
   * a carried part has NO motion of its own, it inherits its carrier's, so the
   * beak cannot lag the skull because the beak is not animated at all.
   *
   * What it replaces is coordination by duplication. `pp:Pigeon` kept the head
   * together with FOUR channels — bob, bobCollar, bobBeak, bobEye — each
   * independently declaring amplitude 0.62, 800ms, easeInOut and spanPart
   * "head", and each computing its own keyframes from those numbers. Agreement
   * was a coincidence maintained by hand, and the concept file records what it
   * cost: the neck tore open at the shoulder, was "fixed" by cutting the
   * amplitude to 0.22 — which fixed the tear by deleting the motion, measured
   * at SSIM 0.9824, a still with a tremor — and the verdict on that was
   * "nothing believable". The amplitude went back to 0.62 and the tear came
   * back with it, because five copies of a number is not a rig.
   *
   * We have shipped, separately, every divergence needed to tear it: easings
   * resolving to linear, clocks wrapping at the last keyframe, a rest scale
   * applied twice. Any one of them hits one channel and not its siblings.
   *
   * With a carrier the question cannot arise. One track is computed, for the
   * carrier, and every part bound to it is displaced by that same track.
   */
  carriedBy?: string;
}
export interface CharacterDepiction {
  concept: string;
  height: number;
  palette: Record<string, string>;
  parts: Record<string, CharacterPart>;
  /**
   * The style's ink, applied to every part as it is drawn.
   *
   * A STYLE IS NOT A PROPERTY OF THE DRAWING. `explainer-ink` declares a 4px
   * #1b1b1b outline and no depiction part has ever carried a stroke role, so
   * the ink was never applied to anything. It showed as soon as corpus art
   * arrived: a flat-filled bird dropped into a scene whose brief says
   * "everything outlined in one dark ink" reads as pasted in from somewhere
   * else, because it was.
   *
   * Inking here rather than baking it into the geometry is what lets one
   * drawing serve several styles — which is the entire reason depiction and
   * style are separate rows.
   */
  ink?: { color: string; width: number; join?: string; cap?: string; union?: boolean };
}
/** A named channel on the concept — how a symbol becomes a change on a part. */
export interface Channel {
  name: string;
  kind: "alternate" | "alternate-cycle" | "speak" | "shift" | "transform" | "cycle";
  base?: string;
  alternate?: string;
  /** For `speak`: the mouth shapes, closed first, most open last. */
  states?: string[];
  holdMs?: number;
  rateHz?: number;
  /** For `speak`: syllables per second, before the rhythm varies it. */
  syllablesPerSecond?: number;
  unitsPerValue?: number;
  /** The part(s) a channel acts on. A list means "these move as one thing". */
  part?: string | string[];
  property?: "scaleX" | "scaleY" | "rotation" | "x" | "y" | "opacity";
  /** Resting value, and the value at the peak of the gesture. */
  rest?: number;
  peak?: number;
  /** Time to reach the peak and to come back, in ms. */
  attackMs?: number;
  releaseMs?: number;
  easing?: string;
  /** For `cycle`: how far, as a FRACTION of the part for x/y, degrees for rotation. */
  amplitude?: number;
  /**
   * For `cycle`: measure the amplitude against ANOTHER part's size.
   *
   * A beak and an eye sit ON a head. When the head is thrown forward they
   * travel exactly as far as it does — they are carried, not independently
   * animated. Reading the fraction off each part's own span made a small part
   * move a small distance, so a pigeon's beak lagged its head by tens of
   * pixels mid-bob and the face came apart, which is the same failure as
   * rotating each part about its own centre instead of shifting the figure.
   */
  spanPart?: string;
  /** For `cycle`: one throw and recovery, in ms. */
  durationMs?: number;
}
/** One instruction: at this instant, on this channel. */
export interface Beat {
  at: number;
  channel: string;
  /** For `shift` channels: how far, in channel units (negative is left). */
  value?: number;
  /** For channels that occupy a span rather than an instant. */
  until?: number;
}
export interface PerformInput {
  id: string;
  depiction: CharacterDepiction;
  at: { x: number; y: number };
  height: number;
  channels: Channel[];
  beats: Beat[];
  /** Total scene duration, so tracks can be written across it. */
  durationSeconds: number;
}

type Op = { tool: string; args: Record<string, unknown> };
type KF = { time: number; [k: string]: unknown };

/** Sorted, deduplicated keyframes — a track with two values at one instant is
 *  ambiguous and the renderers resolve it differently. */
function tidy(kfs: KF[]): KF[] {
  const byTime = new Map<number, KF>();
  // LATER WINS AT THE SAME INSTANT, and the zero anchor is pushed last — so it
  // is merged in first here, letting a real beat at t=0 override it.
  for (const k of [...kfs].reverse()) {
    const t = Math.round(k.time * 1000) / 1000;
    byTime.set(t, { ...(byTime.get(t) ?? {}), ...k, time: t });
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}

/** Relative luminance of a #rgb/#rrggbb colour, 0..1. Unknown formats read as
 *  light, so an unrecognised colour keeps the old stroked behaviour. */
function luminance(colour: string): number {
  const h = colour.trim().replace(/^#/, "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-f]{6}$/i.test(full)) return 1;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Is this fill already the drawing's own ink? Such a part must not be
 *  outlined — see the note at the stroke below. */
function isInkFill(colour: string): boolean {
  return luminance(colour) < 0.22;
}

export function performCharacter(input: PerformInput): { ops: Op[]; parts: string[]; tracks: number; unknownChannels: string[] } {
  const { id, depiction: dep, at, height, channels, beats, durationSeconds } = input;
  const k = height / dep.height;
  const byName = new Map(channels.map((c) => [c.name, c]));
  /** Beats naming a channel this concept has no definition for — reported, not hidden. */
  const unknownChannels: string[] = [];
  const ops: Op[] = [];
  /**
   * ONE CONTINUOUS CONTOUR, WHICH IS WHAT MAKES A FIGURE READ AS ONE OBJECT.
   *
   * Stroking each part separately draws the seams between primitives at exactly
   * the weight that separates the figure from the sky. Rendered at 0.9s of
   * `ledge-at-dusk`, the pigeon is a circle-with-an-outline sitting on an
   * ellipse-with-an-outline and the head's contour cuts straight across the
   * body — which is the "the head is not connected" complaint, drawn.
   *
   * The fix is the one flat-vector artwork has always used, and both Rive and
   * Lottie files are built this way: lay the ink down FIRST, as an unfilled
   * double-width stroke of every silhouette part, then paint the fills over it.
   * A stroke is centred on its path, so each fill covers the inner half of its
   * own ink and the inner half of every ink it overlaps. What survives is the
   * outer boundary of the UNION — one contour, no internal seams — without any
   * boolean path arithmetic.
   *
   * The ink copy is `carriedBy` its source, so it inherits that part's motion by
   * construction. There is no second track to drift.
   *
   * Opt-in per style: a style that wants separate outlines keeps them.
   */
  const UNION_INK = dep.ink?.union === true;
  if (UNION_INK) {
    for (const [pid, part] of Object.entries({ ...dep.parts })) {
      // Only the silhouette. Parts that are already ink, or carry reduced
      // interior linework, are detail drawn ON the form and are not part of
      // its boundary.
      if ((part.inkWeight ?? 1) < 1) continue;
      if (dep.palette[part.fill ?? ""] ?? part.fill) {
        const fill = dep.palette[part.fill ?? ""] ?? part.fill ?? "";
        if (isInkFill(fill)) continue;
      }
      dep.parts[`${pid}__ink`] = { at: part.at, path: part.path, carriedBy: pid, inkWeight: 2 };
    }
  }
  /** Ink copies first: everything painted after them covers their inner half. */
  const partIds = Object.keys(dep.parts).sort((a, b) =>
    (a.endsWith("__ink") ? 0 : 1) - (b.endsWith("__ink") ? 0 : 1));
  /**
   * Every part this one carries, at any depth. A chain (skull → beak → nostril)
   * has to propagate the whole way down or the deepest part is the one that
   * tears off, which is the hardest kind to notice.
   *
   * Cycles in the data are ignored rather than thrown on: a malformed depiction
   * should draw a stiff figure, not fail the render.
   */
  /**
   * A BONE'S MOTION, EXPRESSED FOR THE PART IT CARRIES.
   *
   * Translation is the easy half and the only half the first version did: the
   * carrier's dx is the child's dx, so the same offsets are handed straight on.
   *
   * ROTATION IS NOT. A bone that turns swings everything on it AROUND ITS OWN
   * PIVOT — that is what distinguishes a head turning from a head being slid
   * sideways, and it is the difference the eye reads as a figure being solid.
   * Copying the carrier's rotation onto the child instead makes the child spin
   * about its own centre: the beak would rotate on the spot while the skull
   * turns beneath it, which is a worse artefact than the one the bone was
   * built to remove.
   *
   * So a carried part gets BOTH — the same angle, and the displacement its rest
   * position travels along the arc:
   *
   *     v  = childRest - pivot
   *     v' = R(theta) * v
   *     offset = v' - v
   *
   * Positions here are the part's placed centre in scene units, which is what
   * `at` resolves to at the emission below, so the arc is computed in the same
   * space it will be drawn in.
   */
  const carry = (acc: KF[], carrier: string, child: string, property: string): KF[] => {
    if (property !== "rotation") return acc;
    const cp = dep.parts[carrier], ch = dep.parts[child];
    if (!cp || !ch) return acc;
    const vx = (ch.at[0] - cp.at[0]) * k;
    const vy = (ch.at[1] - cp.at[1]) * k;
    return acc.map((kf) => {
      const deg = typeof kf.rotation === "number" ? kf.rotation : 0;
      const r = (deg * Math.PI) / 180;
      const cos = Math.cos(r), sin = Math.sin(r);
      return {
        ...kf,
        rotation: deg,
        x: vx * cos - vy * sin - vx,
        y: vx * sin + vy * cos - vy,
      };
    });
  };

  const carriedTransitively = (carrier: string): string[] => {
    const out: string[] = [];
    const seen = new Set<string>([carrier]);
    let front = [carrier];
    while (front.length) {
      const next: string[] = [];
      for (const id of front) {
        for (const pid of partIds) {
          if (dep.parts[pid]?.carriedBy !== id || seen.has(pid)) continue;
          seen.add(pid);
          out.push(pid);
          next.push(pid);
        }
      }
      front = next;
    }
    return out;
  };

  // Which drawn parts belong to which alternate group. A part named as the
  // `alternate` of any channel starts hidden; the base starts visible.
  const alternates = new Set<string>();
  for (const c of channels) {
    if (c.alternate) alternates.add(c.alternate);
    // Every speech state except the first is an alternate of it: the closed
    // mouth is what the face wears at rest.
    for (const st of (c.states ?? []).slice(1)) alternates.add(st);
  }
  const partFill = (pid: string): string => {
    const part = dep.parts[pid];
    return dep.palette[part?.fill ?? ""] ?? part?.fill ?? "#1f2937";
  };
  const hidden = (p: string) => [...alternates].some((a) => p === a || p.startsWith(`${a}_`));
  /**
   * A CONTOUR CANNOT BE WIDER THAN THE THING IT CONTAINS.
   *
   * The union layer strokes at double weight so that each fill covers the inner
   * half and the outer half survives as the silhouette. On a large part that is
   * exactly right. On a SMALL one the two halves meet in the middle and the
   * stroke floods the shape: the pigeon's tail rendered as a black smear, having
   * been a clean wedge before.
   *
   * So the weight is capped by the part's own short side. Half of the smaller
   * dimension is the most that can be drawn before the strokes from opposite
   * edges overlap, and a third leaves the shape still legible as a shape.
   */
  const inkWidthFor = (pid: string): number => {
    const nominal = dep.ink!.width * k * 0.6 * (dep.parts[pid]?.inkWeight ?? 1);
    const b = pathBBox(dep.parts[pid]?.path ?? "");
    if (!b) return Math.max(0.6, nominal);
    const short = Math.min(b.maxX - b.minX, b.maxY - b.minY) * k;
    if (!Number.isFinite(short) || short <= 0) return Math.max(0.6, nominal);
    return Math.max(0.6, Math.min(nominal, short / 3));
  };

  // A CHANNEL MAY NAME SEVERAL PARTS. A vehicle's suspension lifts the body,
  // the glazing and the trim as one thing; declaring that as three identical
  // channels (the pigeon's four bob channels) says the same thing three times
  // and lets them drift apart. A bare string still works and means what it
  // always did.
  const matching = (spec: string | readonly string[]) => {
    const wanted = Array.isArray(spec) ? spec : [spec as string];
    return partIds.filter((p) => wanted.some((w) => p === w || p.startsWith(`${w}_`)));
  };

  /** The value each transform channel says this part sits at when idle. */
  const restingOf = (pid: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const c of channels) {
      if (c.kind !== "transform" || !c.part || !c.property) continue;
      if (!matching(c.part).includes(pid)) continue;
      const rest = c.rest ?? 1;
      if (rest !== 1) out[c.property] = rest;
    }
    return out;
  };

  // ── THE FIGURE ────────────────────────────────────────────────────────────
  // Every part is a path placed in the frame's space. `at` is the part's centre
  // in the figure's own space, so the figure moves as one by construction.
  for (const pid of partIds) {
    const p = dep.parts[pid]!;
    ops.push({
      tool: "pinepaper_create_item",
      args: {
        itemType: "path",
        position: { x: 0, y: 0 },
        properties: {
          id: `${id}_${pid}`,
          // ONE FIGURE, NOT EIGHT SHAPES. The parts are a single thing that
          // moves and reads together — that is what a rig IS — and saying so
          // is the graph's job, not the caller's. Without it every gate that
          // counts units sees eight competing elements, and
          // `compositionVerdict` (whose own comment says a rigged figure must
          // not be punished for being properly assembled) fails the very
          // piece the rig exists to make.
          groupId: id,
          pathData: shiftPath(scalePath(p.path, k), at.x + p.at[0] * k, at.y + p.at[1] * k),
          closed: true,
          fillColor: partFill(pid),
          // Scaled with the figure: an outline that stays 4px while the drawing
          // grows is a hairline on a large one and a smear on a small one.
          //
          // BUT INK IS NOT OUTLINED. The corpus is FLAT art: its linework is
          // already drawn, as filled dark shapes. A face arrives as ONE
          // compound path of six subpaths — two eyes, brows, nose, mouth — and
          // stroking it adds a 6px outline around every one of those features
          // at a 250px figure height, which merges them into dark smears. The
          // figure has no eyes and its face reads as damage.
          //
          // Invisible at contact-sheet scale, unmissable at full size, which is
          // how it survived review: the eyes were four pixels wide there.
          //
          // So the stroke goes on the SILHOUETTE — the skin and garment shapes
          // an inked scene needs to sit around — and never on a part that is
          // already ink.
          // An ink copy carries NO fill — it exists to be half-covered. Its
          // source loses its own stroke, because the union layer is now the
          // only thing that draws the contour.
          ...(pid.endsWith("__ink") ? { fillColor: "transparent" } : {}),
          // An ink copy is ALWAYS stroked. It declares no fill, so partFill
          // falls back to the dark default and isInkFill reads it as linework
          // and refuses to outline it — which left the union layer invisible
          // and the bird with no contour at all.
          ...(dep.ink
            && (pid.endsWith("__ink") || !isInkFill(partFill(pid)))
            && (dep.parts[pid]?.inkWeight ?? 1) > 0
            && !(UNION_INK && !pid.endsWith("__ink")) ? {
            strokeColor: dep.ink.color,
            // The part's own share of the style's ink — see `inkWeight`. The
            // floor stays, so a light interior line is thin and never absent.
            strokeWidth: inkWidthFor(pid),
            ...(dep.ink.join ? { strokeJoin: dep.ink.join } : {}),
            ...(dep.ink.cap ? { strokeCap: dep.ink.cap } : {}),
          } : {}),
          ...(hidden(pid) ? { opacity: 0 } : {}),
          // A PART STARTS AT ITS RESTING VALUE WHETHER OR NOT IT IS ANIMATED.
          //
          // The resting transform was written only into the keyframe track, and
          // a part with no beats gets no track — so a channel declaring a rest
          // other than 1 was ignored entirely for any figure nobody asked to
          // move. Measured on the Open Peeps cast: an eyelid whose rest is
          // scaleY 0.02 rendered at full height and sat over the eye, so twelve
          // characters had their eyes shut until someone thought to blink them.
          ...restingOf(pid),
        },
      },
    });
  }

  // ── THE PERFORMANCE ───────────────────────────────────────────────────────
  // One track per part, built from every beat that touches it, then written
  // once. Writing a track per beat would leave the last one winning and the
  // rest silently discarded.
  const opacity = new Map<string, KF[]>();
  const shiftX = new Map<string, KF[]>();
  const transform = new Map<string, KF[]>();
  const cycle = new Map<string, KF[]>();
  /** A part's drawn extent, so a rig amplitude given as a fraction means the
   *  same thing at every size the figure is drawn. */
  const partSize = (pid: string) => {
    const b = pathBBox(dep.parts[pid]?.path ?? "");
    return b ? { w: (b.maxX - b.minX) * k, h: (b.maxY - b.minY) * k } : { w: 10 * k, h: 10 * k };
  };

  const swap = (base: string, alt: string, from: number, to: number) => {
    // A hard cut, not a dissolve: two drawings of one face cross-fading reads
    // as a double exposure, not as a mouth opening.
    const e = 0.001;
    for (const p of matching(base)) opacity.set(p, [...(opacity.get(p) ?? []), { time: Math.max(0, from - e), opacity: 1 }, { time: from, opacity: 0 }, { time: to, opacity: 0 }, { time: to + e, opacity: 1 }]);
    for (const p of matching(alt)) opacity.set(p, [...(opacity.get(p) ?? []), { time: Math.max(0, from - e), opacity: 0 }, { time: from, opacity: 1 }, { time: to, opacity: 1 }, { time: to + e, opacity: 0 }]);
  };

  for (const b of beats) {
    const c = byName.get(b.channel);
    /**
     * A BEAT ON A CHANNEL THIS CONCEPT DOES NOT DECLARE WAS DROPPED IN SILENCE.
     *
     * `continue` alone, with no record. Measured across the shipped corpus
     * 2026-09-18 by mutation — changing the channel name left the scene
     * byte-identical — 28 beats were discarded this way: 14 `blink`,
     * 10 `headTurn`, 4 `say`. The SAME channel names work on other characters,
     * which is what makes it so easy to miss: an author writes `blink` for a
     * cast of four, it animates on three, and the fourth just never blinks.
     *
     * Still dropped, because a beat cannot drive a channel that does not
     * exist — only the silence is removed. The available names go with it,
     * since "blink is not a channel here" is useless without "these are".
     */
    if (!c) {
      unknownChannels.push(
        `character "${id}": beat at ${b.at}s names channel "${b.channel}", which this concept does not declare. ` +
        `Available: ${channels.map((x) => x.name).join(", ") || "(none)"}.`,
      );
      continue;
    }
    if (c.kind === "alternate" && c.base && c.alternate) {
      swap(c.base, c.alternate, b.at, b.at + (c.holdMs ?? 120) / 1000);
    } else if (c.kind === "speak" && c.states && c.states.length >= 2) {
      /**
       * SPEECH IS NOT A METRONOME, AND IT IS NOT TWO FACES.
       *
       * The first version alternated two WHOLE expressions six times a second.
       * Both of those are wrong and the result was reported, correctly, as
       * flashing: swapping whole faces changes the eyes and brows on every
       * syllable, so the character strobes between two people, and an even 6Hz
       * toggle is a machine rather than a mouth.
       *
       * So the states share their eyes — only the mouth differs between them —
       * and a syllable OPENS AND CLOSES THROUGH THE MIDDLE STATE rather than
       * cutting between extremes. That middle is the transition that was
       * missing; with two states there is nowhere for the mouth to be on the
       * way.
       *
       * The rhythm varies because real speech does. The golden ratio spreads
       * the variation evenly without repeating, and it is deterministic, which
       * the content-addressed render cache requires.
       */
      const until = b.until ?? b.at + 1;
      const closed = c.states[0]!, open = c.states[c.states.length - 1]!;
      const mid = c.states.length > 2 ? c.states[1]! : open;
      const rate = c.syllablesPerSecond ?? 3.6;
      let t = b.at, k = 0;
      while (t < until) {
        // 0.72x to 1.28x of the nominal syllable, never the same twice running.
        const jitter = 0.72 + 0.56 * (((k + 1) * 0.6180339887) % 1);
        const dur = Math.min((1 / rate) * jitter, until - t);
        if (dur < 0.05) break;
        // open on the way up, hold, close on the way down, then a beat shut.
        swap(closed, mid, t, t + dur * 0.18);
        swap(closed, open, t + dur * 0.18, t + dur * 0.58);
        swap(closed, mid, t + dur * 0.58, t + dur * 0.76);
        t += dur; k++;
      }
    } else if (c.kind === "alternate-cycle" && c.base && c.alternate) {
      const until = b.until ?? b.at + 1;
      const period = 1 / (c.rateHz ?? 6);
      // Open on the first half of each period, closed on the second — the
      // mouth has to CLOSE between syllables or the character gapes.
      for (let t = b.at; t < until; t += period) swap(c.base, c.alternate, t, Math.min(until, t + period / 2));
    } else if (c.kind === "transform" && c.part && c.property) {
      /**
       * A GESTURE IS A DEFORMATION, NOT A DIFFERENT DRAWING.
       *
       * The swap kinds above cut between two shapes, which is right when the
       * shapes genuinely differ — an open eye and a closed lid are drawn, not
       * squashed. It is wrong for everything that merely MOVES: a mouth
       * opening is one mouth changing, and expressing it as a cut throws away
       * the whole middle of the gesture. That missing middle is what reads as
       * flashing however well the two ends are chosen.
       *
       * As a transform it has an attack, a peak and a release, it eases, and
       * the same channel works on any part of any concept — a wing, a sail, a
       * lid. Nothing here is specific to a face.
       */
      const rest = c.rest ?? 1, peak = c.peak ?? 1.6;
      const attack = (c.attackMs ?? 90) / 1000, release = (c.releaseMs ?? 130) / 1000;
      const hold = Math.max(0, (b.until ?? b.at + attack + release) - b.at - attack - release);
      const ease = c.easing ?? "easeInOut";
      const key = (t: number, v: number) => ({ time: Math.max(0, t), [c.property!]: v, easing: ease });
      for (const p of matching(c.part)) {
        transform.set(p, [...(transform.get(p) ?? []),
          key(b.at, rest), key(b.at + attack, peak),
          key(b.at + attack + hold, peak), key(b.at + attack + hold + release, rest)]);
      }
    } else if (c.kind === "cycle" && c.part && c.property) {
      /**
       * A CYCLE IS THE GRAPH'S OWN RIG, FINALLY CONSUMED.
       *
       * `concept_rig` has described exactly this since the class layer was
       * built — a part, a property, an amplitude and a duration — and nothing
       * has ever read it. It is not a gesture with an end: a pigeon bobs while
       * it walks, a tail flicks the whole time it is on screen, so this repeats
       * for as long as the beat asks rather than resolving.
       *
       * THE THROW IS ASYMMETRIC. A sine reads as a metronome and a pigeon does
       * not bob like one: the head goes forward fast and the body catches up
       * slowly. Forward in the first third, recover across the rest.
       *
       * Amplitude is a FRACTION OF THE PART for x and y, degrees for rotation,
       * which is how the graph states it — a pixel amplitude would mean
       * something different at every size the figure is drawn.
       */
      const until = b.until ?? durationSeconds;
      const period = (c.durationMs ?? 800) / 1000;
      const ease = c.easing ?? "easeInOut";
      /**
       * THE THROW, STATED IN THE SYSTEM'S VOCABULARY.
       *
       * A cycle is asymmetric on purpose — a pigeon throws its head forward
       * and the body catches up — and the asymmetry used to be a bare 0.33 of
       * the period. That produced intervals belonging to no scale: an 800ms
       * bob split into 264 and 536, and a piece made mostly of cycles came out
       * at 20% on the duration scale, which is the definition of not having a
       * timing system.
       *
       * Rounding the ATTACK onto the scale and giving the remainder to the
       * release keeps the shape and puts both halves on it: 800 becomes
       * 300/500, 1200 becomes 400/800. The asymmetry survives; the arbitrary
       * number does not.
       */
      const attack = nearestOnScale(period * 0.33 * 1000) / 1000;
      for (const pid of matching(c.part)) {
        // A carried part measures against what carries it — see `spanPart`.
        const ref = c.spanPart ? (matching(c.spanPart)[0] ?? pid) : pid;
        const span = partSize(ref);
        const amp = c.property === "rotation" ? (c.amplitude ?? 10)
          : (c.amplitude ?? 0.3) * (c.property === "x" ? span.w : span.h);
        const acc: KF[] = [];
        for (let t = b.at; t < until; t += period) {
          acc.push({ time: t, [c.property]: 0, easing: ease });
          acc.push({ time: Math.min(until, t + attack), [c.property]: amp, easing: ease });
        }
        acc.push({ time: until, [c.property]: 0, easing: ease });
        cycle.set(pid, [...(cycle.get(pid) ?? []), ...acc]);
        /**
         * CARRIED PARTS MOVE WITH THEIR CARRIER, not alongside it.
         *
         * The same offsets, the same object, propagated down the carrier chain
         * — so there is no second computation that could round differently,
         * ease differently, or start a beat a frame late. This is the whole
         * fix: a figure cannot come apart at a joint it has no independent
         * motion across.
         */
        for (const child of carriedTransitively(pid)) {
          cycle.set(child, [...(cycle.get(child) ?? []), ...carry(acc, pid, child, c.property)]);
        }
      }
    } else if (c.kind === "shift") {
      /**
       * A SHIFT MOVES WHAT IT NAMES — and this moved everything.
       *
       * `part` was read for every other kind of channel and ignored here, so a
       * shift always displaced the ENTIRE figure. `pp:Character.headTurn` got
       * away with it because that depiction is a portrait: head, face and
       * features, no body, so "every part" and "the head" are the same set.
       * `pp:Peep` has body_0..2, and the same channel would slide the whole
       * person sideways to turn their head.
       *
       * Declaring a part now narrows it, and carried parts come along — so a
       * head turn takes the face, the hair and the eyelids with it, which is
       * the entire reason the bone exists. A channel that names nothing still
       * moves everything, because that is what the portrait relies on.
       */
      const dx = (b.value ?? 0) * (c.unitsPerValue ?? 9) * k;
      const settle = b.until ?? b.at + 0.6;
      const named = c.part ? matching(c.part) : partIds;
      const moved = new Set(named);
      for (const pid of named) for (const child of carriedTransitively(pid)) moved.add(child);
      for (const p of moved) {
        shiftX.set(p, [...(shiftX.get(p) ?? []), { time: Math.max(0, b.at - 0.001), dx: 0 }, { time: settle, dx }]);
      }
    }
  }

  // Position tracks need ABSOLUTE x, and a part's x is its own placed centre.
  let tracks = 0;
  for (const pid of partIds) {
    const p = dep.parts[pid]!;
    const baseX = at.x + p.at[0] * k;
    const kfs: KF[] = [];
    for (const s of shiftX.get(pid) ?? []) kfs.push({ time: s.time, x: baseX + (s.dx as number) });
    for (const o of opacity.get(pid) ?? []) kfs.push(o);
    for (const tr of transform.get(pid) ?? []) kfs.push(tr);
    // A cycle's x/y are OFFSETS from where the part sits; everything else in a
    // keyframe track is absolute, so they are added here rather than earlier.
    for (const cy of cycle.get(pid) ?? []) {
      const out: KF = { time: cy.time, ...(cy.easing ? { easing: cy.easing } : {}) };
      if (typeof cy.x === "number") out.x = baseX + cy.x;
      if (typeof cy.y === "number") out.y = at.y + p.at[1] * k + cy.y;
      if (typeof cy.rotation === "number") out.rotation = cy.rotation;
      if (typeof cy.scaleY === "number") out.scaleY = cy.scaleY;
      kfs.push(out);
    }
    if (!kfs.length) continue;
    // EVERY TRACK STARTS AT ZERO.
    //
    // An item whose first keyframe is at t=5 is INVISIBLE for the five seconds
    // before it — measured: the head appeared exactly when its shift track
    // began and the face exactly when its blink track began, and the first
    // second of the film was an empty frame. The engine's own player treats
    // "before the track" as "not yet", and this clock runs before it, so the
    // player has the last word.
    //
    // Anchoring at zero with the baseline removes the state entirely rather
    // than arguing with it: there is no "before the track" if the track covers
    // the whole piece.
    const restingTransform: Record<string, number> = {};
    for (const c of channels) {
      if (c.kind !== "transform" || !c.part || !c.property) continue;
      if (matching(c.part).includes(pid)) restingTransform[c.property] = c.rest ?? 1;
    }
    kfs.push({ time: 0, x: baseX, opacity: hidden(pid) ? 0 : 1, ...restingTransform });
    // NOTHING ORGANIC MOVES AT A CONSTANT SPEED, and a rig is organic by
    // definition. The transform and cycle channels set their own easing; the
    // head-turn shift, the resting anchor and the closing hold did not, so a
    // turn slid across the frame at a dead constant rate — the one tell that
    // reads as "animated by a machine" no matter how good the drawing is.
    // An explicit easing always wins; this only fills the silence.
    const track = tidy(kfs).map((kf) => (kf.easing ? kf : { ...kf, easing: "easeInOut" }));
    /**
     * A track that never returns leaves the figure mid-gesture at the cut — and
     * the hold must carry EVERY property the track animates, not whichever one
     * the last keyframe happened to set.
     *
     * Cloning the final keyframe looked right and was not: the eye's last
     * keyframe is a blink, which sets scaleY alone, so the closing hold dropped
     * x. Every other part of the head ended with an explicit x at the duration
     * and the eye did not — one keyframe's difference between a bound part and
     * its carrier, which is exactly the kind of divergence the bone exists to
     * make impossible. It was harmless here only because the held value and the
     * last value agreed; that is luck, not a guarantee.
     */
    const last = track[track.length - 1]!;
    if (last.time < durationSeconds) {
      const held: KF = { time: durationSeconds };
      for (const kf of track) {
        for (const [k, v] of Object.entries(kf)) {
          if (k === "time" || k === "easing") continue;
          held[k] = v as number;
        }
      }
      if (last.easing) held.easing = last.easing;
      track.push(held);
    }
    ops.push({
      tool: "pinepaper_keyframe_animate",
      args: { itemId: `${id}_${pid}`, duration: durationSeconds, keyframes: track },
    });
    tracks++;
  }

  return { ops, parts: partIds.map((p) => `${id}_${p}`), tracks, unknownChannels };
}
