/**
 * Concept id → a composed drawing and its channels, so `pinepaper_character`
 * can turn a symbol and some beats into ops.
 *
 * PORTED from mcp-cloud/src/services/replay-handlers/character.ts @ a3557b7.
 * The cloud's copy ends by pushing ops into its replay context; this one just
 * returns them, because this package's job is to EMIT CODE rather than to
 * replay. Everything above that — ancestry, the variant fallback, the z-order,
 * the palette override — is the same logic and must stay the same, or a figure
 * drawn through the MCP server and the same figure drawn in the cloud are two
 * different figures with one name.
 *
 * WHY THIS EXPANDS HERE AT ALL. The knowledge of how a pigeon is built is data
 * in the graph, and the graph is shipped in this package. `pinepaper_character`
 * was DEFINED here and dispatched nowhere (b06fcde) — advertised in tools/list,
 * counted in the manifest, and answering every call with UNKNOWN_TOOL. That is
 * a phantom, which is worse than a missing tool: the model plans around it.
 *
 * WHAT THIS PACKAGE CARRIES, AND WHAT IT DOES NOT. The vendored depiction set
 * is the compact concepts plus pp:Character. The pp:Doodle and pp:Peep variant
 * libraries are 1.46 MB of a 1.48 MB source file and stay in the cloud, which
 * is the higher-fidelity path by design. They are refused BY NAME here — never
 * substituted with a different drawing, because a figure that silently is not
 * the one you asked for is the failure this layer exists to end.
 */
import CONCEPTS from './data/concepts.json' with { type: 'json' };
import DEPICTIONS from './data/depictions.json' with { type: 'json' };
import STYLES from './data/styles.json' with { type: 'json' };
import { performCharacter, type Beat, type Channel, type CharacterDepiction } from './perform.js';

interface ConceptSeed {
  id: string;
  'pp:isA'?: string;
  'pp:hasPart'?: Array<{ id: string; z: number }>;
  channels?: Channel[];
}
interface DepictionSeed {
  concept: string; style: string; variant: string; height: number;
  palette: Record<string, string>;
  parts: Record<string, { at: [number, number]; path: string; fill?: string | null; carriedBy?: string; inkWeight?: number }>;
  omits?: string[];
}
type Ink = { color: string; width: number; join?: string; cap?: string; union?: boolean };

const concepts = (CONCEPTS as unknown as { concepts: ConceptSeed[] }).concepts;
const depictions = (DEPICTIONS as unknown as { depictions: DepictionSeed[] }).depictions;
const styles = (STYLES as unknown as { styles: Array<{ id: string; ink?: Ink }> }).styles;

/**
 * Concepts the CLOUD can draw that this package deliberately does not carry.
 * Named so a refusal can say "in the cloud" instead of "unknown", which are
 * very different facts to act on.
 */
const CLOUD_ONLY = ['pp:Doodle', 'pp:Peep'];

/** Nearest first: the concept, then what it is a kind of, and so on up. */
function ancestry(id: string): string[] {
  const out: string[] = [];
  let cur: string | undefined = id;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    cur = concepts.find((c) => c.id === cur)?.['pp:isA'];
  }
  return out;
}

/** Every concept with a drawing here, for a refusal that names the alternatives. */
export function drawableConcepts(): string[] {
  return [...new Set(depictions.map((d) => d.concept))].sort();
}

/** The variants that exist for one concept, in the style asked for. */
export function variantsOf(conceptId: string, style?: string): string[] {
  return depictions
    .filter((d) => d.concept === conceptId && (!style || d.style === style))
    .map((d) => d.variant)
    .sort();
}

/**
 * The drawing, composed across the ancestry — farthest ancestor first, so a
 * nearer concept's parts and colours overwrite. A pigeon is a bird: the tail,
 * wing, beak, legs and eye are declared on pp:Bird and only the body, head and
 * collar on pp:Pigeon, so a figure assembled from the nearest one alone is a
 * bird with no wings.
 */
function composeDepiction(
  conceptId: string,
  style: string | undefined,
  variant: string,
  notes: string[],
): CharacterDepiction | null {
  const line = ancestry(conceptId);
  let height = 0;
  const palette: Record<string, string> = {};
  const parts: CharacterDepiction['parts'] = {};

  for (const cid of [...line].reverse()) {
    const want = cid === conceptId ? variant : 'default';
    // A CONCEPT NEED NOT HAVE A VARIANT CALLED "default" — pp:Character ships
    // only named drawings. So for the concept ITSELF the fallback is: the
    // variant asked for, else "default", else the first that exists,
    // alphabetically, which is stable across repeat calls. Ancestors still take
    // only "default": a named pose is a statement about the concept, not about
    // the class it belongs to. The fallback NEVER crosses styles.
    const own = (v: string) =>
      depictions.find((x) => x.concept === cid && (!style || x.style === style) && x.variant === v);
    let d = own(want) ?? own('default');
    if (!d && cid === conceptId) {
      const first = variantsOf(cid, style)[0];
      if (first) {
        d = own(first);
        // An advisory, not a refusal: the caller got a figure and is being told
        // which one, because it did not choose.
        notes.push(
          `note: ${cid} has no variant "${variant}" — drew "${first}". Available: ${variantsOf(cid, style).join(', ')}.`,
        );
      }
    }
    if (!d) continue;
    height = d.height || height;
    Object.assign(palette, d.palette);
    for (const [pid, p] of Object.entries(d.parts)) {
      parts[pid] = {
        at: p.at,
        path: p.path,
        ...(p.fill != null ? { fill: p.fill } : {}),
        ...(p.carriedBy ? { carriedBy: p.carriedBy } : {}),
        ...(typeof p.inkWeight === 'number' ? { inkWeight: p.inkWeight } : {}),
      };
    }
    // A drawing may SUPERSEDE an ancestor's anatomy, not only override it — a
    // floating body has no legs, and the inherited ones stand under it
    // belonging to nothing.
    for (const pid of d.omits ?? []) delete parts[pid];
  }
  if (!Object.keys(parts).length) return null;

  // DRAW ORDER IS THE GRAPH'S, NOT THE FILE'S. `z` is declared on the concept's
  // parts; composing ancestors in file order loses it and the body paints over
  // the wing, the legs and the eye.
  const z = new Map<string, number>();
  for (const cid of line) {
    for (const p of concepts.find((c) => c.id === cid)?.['pp:hasPart'] ?? []) {
      if (!z.has(p.id)) z.set(p.id, p.z);
    }
  }
  const ordered: CharacterDepiction['parts'] = {};
  for (const pid of Object.keys(parts).sort((a, b) => (z.get(a) ?? 0) - (z.get(b) ?? 0))) {
    ordered[pid] = parts[pid]!;
  }

  // The ink comes from the STYLE the drawing names, not from the drawing — and
  // the drawing is whichever ANCESTOR actually supplied the parts, not the
  // concept that was asked for. Keyed on the request, an inherited depiction
  // found no style row, so `pp:Bus` drew 0 stroked parts where `pp:Vehicle` —
  // the same geometry — drew 3. That is the "flat art dropped into an inked
  // scene reads as pasted in from somewhere else" failure this ink exists to
  // avoid, and it hit exactly the concepts that inherit rather than declare.
  const composedFrom = ancestry(conceptId).find((cid) => depictions.some((x) => x.concept === cid));
  const styleId = String(
    depictions.find((x) => x.concept === conceptId)?.style
    ?? (composedFrom ? depictions.find((x) => x.concept === composedFrom)?.style : undefined)
    ?? style
    ?? '',
  );
  const st = styles.find((x) => x.id === styleId);
  return { concept: conceptId, height: height || 100, palette, parts: ordered, ...(st?.ink ? { ink: st.ink } : {}) };
}

export interface CharacterArgs {
  concept: string;
  at?: { x?: number; y?: number };
  position?: { x?: number; y?: number };
  height?: number;
  scale?: number;
  id?: string;
  style?: string;
  variant?: string;
  durationSeconds?: number;
  beats?: Beat[];
  timings?: Array<{ at: number; until?: number }>;
  palette?: Record<string, string>;
  ink?: string;
}

export type CharacterResult =
  | { ok: true; ops: Array<{ tool: string; args: Record<string, unknown> }>; parts: string[]; tracks: number; notes: string[] }
  | { ok: false; reason: string };

/**
 * Resolve and perform. Every failure names what WOULD have worked, because the
 * caller cannot see the graph and a bare refusal leaves it guessing — which is
 * how a model came to ask for a concept that has never had a drawing.
 */
export function resolveCharacter(args: CharacterArgs): CharacterResult {
  const conceptId = String(args.concept ?? '');
  const concept = concepts.find((c) => c.id === conceptId);
  if (!concept) {
    const cloudOnly = CLOUD_ONLY.includes(conceptId);
    return {
      ok: false,
      reason: cloudOnly
        ? `${conceptId} is drawn by the cloud, not by this package: its variant library is 1.46 MB and is not vendored here. Drawable locally: ${drawableConcepts().join(', ')}.`
        : `no concept "${conceptId}" in the design graph. Drawable: ${drawableConcepts().join(', ')}.`,
    };
  }
  if (CLOUD_ONLY.includes(conceptId)) {
    return {
      ok: false,
      reason: `${conceptId} is declared here but its drawings live in the cloud (a 1.46 MB variant library, deliberately not vendored). Drawable locally: ${drawableConcepts().join(', ')}.`,
    };
  }

  const notes: string[] = [];
  const style = args.style ? String(args.style) : undefined;
  const dep = composeDepiction(conceptId, style, args.variant ? String(args.variant) : 'default', notes);
  if (!dep) {
    const has = variantsOf(conceptId, style);
    return {
      ok: false,
      reason: has.length
        ? `${conceptId} has no drawing composed from variants [${has.join(', ')}] in style "${style ?? 'any'}".`
        : `${conceptId} is declared but has no drawing${style ? ` in style "${style}"` : ''}. Drawable: ${drawableConcepts().join(', ')}.`,
    };
  }

  // A part's `fill` is a palette ROLE, so a piece with its own colours can take
  // the figure in without minting a second depiction — the GEOMETRY stays the
  // graph's, which is what keeps it the same character in every shot.
  if (args.palette && typeof args.palette === 'object') {
    for (const [role, colour] of Object.entries(args.palette)) {
      if (typeof colour === 'string' && colour) dep.palette[role] = colour;
    }
  }
  if (typeof args.ink === 'string' && args.ink && dep.ink) dep.ink = { ...dep.ink, color: args.ink };

  // `at` OR `position`, and `scale` as well as `height`: every other placing
  // tool in this surface takes `position` and sizes with `scale`, so a call
  // written the way the rest of the vocabulary reads must not land dead-centre
  // at the default size.
  const pos = args.at ?? args.position ?? {};
  const beats: Beat[] = Array.isArray(args.beats) ? [...args.beats] : [];
  // WORD TIMINGS ARE BEATS — a voice track's timings are exactly a list of
  // instants a mouth should open, so they become `say` beats rather than a
  // second mechanism.
  for (const t of Array.isArray(args.timings) ? args.timings : []) {
    if (typeof t?.at !== 'number') continue;
    beats.push({ at: t.at, channel: 'say', ...(typeof t.until === 'number' ? { until: t.until } : {}) });
  }

  // CHANNELS ARE INHERITED, and reading them off the concept alone is how a
  // drawable figure came to perform nothing. `pp:Bus` composes `pp:Vehicle`'s
  // parts and inherits its `jounce` and `travel`; keyed on the concept itself
  // it declared none, so every beat was reported ignored and the call returned
  // ZERO tracks while claiming success. `channelsOf` already walks the chain —
  // it existed and only a test was calling it.
  const inherited = channelsOf(conceptId);
  const declared = new Set(inherited.map((c) => c.name));
  for (const b of beats) {
    if (b?.channel && !declared.has(b.channel)) {
      notes.push(
        `note: ${conceptId} declares no channel "${b.channel}" — that beat is ignored. Declared: ${[...declared].join(', ') || '(none)'}.`,
      );
    }
  }

  const charId = String(args.id ?? conceptId.replace(/^pp:/, '').toLowerCase());
  const r = performCharacter({
    id: charId,
    depiction: dep,
    at: { x: Number(pos.x ?? 400), y: Number(pos.y ?? 300) },
    height: Number(args.height ?? (args.scale != null ? 300 * Number(args.scale) : 300)),
    channels: inherited,
    beats,
    durationSeconds: Number(args.durationSeconds ?? 5),
  });
  return { ok: true, ops: r.ops, parts: r.parts, tracks: r.tracks, notes };
}

/** The channels a concept declares — what `beats` may name. */
export function channelsOf(conceptId: string): Channel[] {
  const out: Channel[] = [];
  for (const cid of ancestry(conceptId)) {
    for (const ch of concepts.find((c) => c.id === cid)?.channels ?? []) {
      if (!out.some((x) => x.name === ch.name)) out.push(ch);
    }
  }
  return out;
}
