/**
 * `pinepaper_character` — a symbol and some beats become a figure that performs.
 *
 * This clears a PHANTOM. The tool was defined here and dispatched nowhere
 * (b06fcde): advertised in tools/list, counted in the manifest, offered by a
 * toolkit, and answering every call with UNKNOWN_TOOL. A missing tool is
 * invisible; a phantom is a capability the model is told it has and plans
 * around, and only discovers is absent at call time.
 *
 * NOTHING HERE REIMPLEMENTS THE PERFORMANCE. `resolveCharacter` composes the
 * drawing across the concept's ancestry and hands it to the vendored
 * `performCharacter`, which returns ops naming exactly two tools this package
 * already emits. Those ops go through the EXISTING `generateCreateItem` and
 * `generateKeyframeAnimate`, so there is no second code path to drift: a figure
 * is created and keyframed by the same generators as everything else.
 *
 * ── THE ONE ADAPTATION, AND WHY IT IS NOT OPTIONAL ──────────────────────────
 *
 * The cloud's ops are written for the cloud's rasterizer, and the two renderers
 * disagree about what `position` means next to `pathData`.
 *
 * `performCharacter` emits geometry ALREADY SHIFTED to canvas coordinates — a
 * pigeon asked for at (470, 250) comes back with `pathData` in the 400-700
 * range — and pairs it with `position: {x: 0, y: 0}`, which its own renderer
 * ignores. PinePaper does not ignore it. `create('path', …)` treats pathData as
 * the OTHER convention — a shape authored around its own origin and placed by
 * (x, y) — and its guard is `params.x !== undefined`, which `0` satisfies. So
 * the ops as the cloud writes them would move every part's centre to (0, 0) and
 * stack the whole figure on the canvas origin.
 *
 * That is not hypothetical: PinePaper's own comment at that line records it,
 * "measured on a rigged figure whose 27 parts all drew correctly and all landed
 * on the canvas origin, stacked, while every other signal (item count,
 * registry, attachments) said the scene was fine."
 *
 * So each part is converted to PinePaper's convention here: the pathData is
 * shifted to sit around its own bbox centre, and that centre is passed as the
 * position. Same pixels, stated the way this engine reads them. Converting
 * rather than re-authoring keeps `performCharacter` the single source of the
 * performance — the adaptation is a coordinate convention, not a second
 * implementation.
 */
import { resolveCharacter, type CharacterArgs } from '../../character/resolve.js';
import { pathBBox, shiftPath } from '../../character/path-bbox.js';

export interface CharacterOp { tool: string; args: Record<string, unknown> }

/**
 * Restate one create op in PinePaper's pathData convention.
 *
 * A part whose pathData cannot be measured is passed through UNCHANGED rather
 * than guessed at: it will be misplaced, which is visible, instead of being
 * silently dropped, which is not.
 */
export function toEngineConvention(op: CharacterOp): CharacterOp {
  if (op.tool === 'pinepaper_keyframe_animate') {
    // TWO CHANGES, BOTH REQUIRED FOR THE OP TO VALIDATE OR BEHAVE.
    //
    // (1) SHAPE. The cloud writes FLAT keyframes — `{time, x, opacity, easing}`
    // — because its own reader (`extractKfProps`) accepts either form. This
    // package's `KeyframeSchema` does not: it requires `{time, properties}`,
    // and a flat keyframe is rejected at validation. Copied verbatim, every
    // character call would have failed zod with "properties: Required".
    //
    // (2) UNITS. Beats are seconds. The keyframe path carries a legacy
    // heuristic that reads a time over 100 as milliseconds and divides, which
    // is right for old scenes and would collapse a two-minute performance into
    // its first tenth of a second. `timeUnits` is the documented way off it.
    const kfs = (op.args.keyframes ?? []) as Array<Record<string, unknown>>;
    return {
      ...op,
      args: {
        ...op.args,
        timeUnits: 'seconds',
        keyframes: kfs.map((k) => {
          const { time, easing, properties, ...rest } = k;
          return {
            time,
            ...(typeof easing === 'string' ? { easing } : {}),
            properties: { ...((properties as Record<string, unknown>) ?? {}), ...rest },
          };
        }),
      },
    };
  }
  if (op.tool !== 'pinepaper_create_item') return op;
  const props = (op.args.properties ?? {}) as Record<string, unknown>;
  const d = props.pathData;
  if (typeof d !== 'string' || !d) return op;
  const box = pathBBox(d);
  if (!box) return op;
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  // `groupId` IS DROPPED, NOT PASSED THROUGH. The cloud sets it so its own
  // composition gate does not count a rigged figure as N competing elements —
  // a cloud concern with a cloud reader. PinePaper's `create()` builds a path's
  // `item.data` fresh (`{ shapeType: 'path' }`), so the field never arrives;
  // and `item.data.groupId` means something else here — the engine mints it for
  // real Paper groups and reads it as a COLLAGE id. Emitting a field that this
  // engine either ignores or would misread is the phantom in miniature.
  //
  // The honest consequence: nothing in the emitted program says these thirteen
  // parts are ONE figure. Wrapping them in a Paper group would say it and would
  // also put one transform over all of them, which is the wrong trade for a
  // performance keyed per part — the same reason text-effect glyphs are
  // siblings joined by edges rather than a group. Filed, not faked.
  const { groupId: _dropped, ...rest } = props;
  return {
    ...op,
    args: {
      ...op.args,
      position: { x: cx, y: cy },
      properties: { ...rest, pathData: shiftPath(d, -cx, -cy) },
    },
  };
}

/**
 * Plan a character call: ops in PinePaper's convention, or a refusal.
 *
 * Separated from the handler so it can be tested WITHOUT `handleToolCall`,
 * which tries to reach a browser and times out at 5001ms.
 */
export function planCharacter(args: CharacterArgs):
  | { ok: true; ops: CharacterOp[]; parts: string[]; tracks: number; notes: string[]; concept: string; root: string | null }
  | { ok: false; reason: string } {
  const r = resolveCharacter(args);
  if (!r.ok) return r;
  return {
    ...r,
    ops: r.ops.map(toEngineConvention),
    concept: String(args.concept ?? ''),
    root: figureRoot(r.parts),
  };
}

/**
 * The part the others hang off.
 *
 * `part_of_figure` points at a SIBLING, exactly as `glyph_of` points at the
 * root glyph — there is no wrapper item, and inventing one would be the Paper
 * group this design deliberately avoids. The body is the natural root because
 * it is the part every other one is drawn against; failing that, the first in
 * z-order, which is stable for a given concept.
 */
export function figureRoot(parts: string[]): string | null {
  if (!parts.length) return null;
  // The ink copies are duplicates of a source part and must never be the root.
  const real = parts.filter((p) => !p.endsWith('__ink'));
  const pool = real.length ? real : parts;
  return pool.find((p) => p.endsWith('_body')) ?? pool[0] ?? null;
}

/**
 * The whole performance as one program.
 *
 * Emitted as a single block with one history save at the end, like
 * `batch_create`: thirteen parts and eight tracks are ONE authoring act, and
 * thirteen undo steps to remove one pigeon is not what anybody means by undo.
 *
 * Every interpolated value goes through `JSON.stringify`. Prose is DATA — an
 * apostrophe in a refusal message, interpolated into a single-quoted literal,
 * once made every generated `auto_walk` program a SyntaxError.
 */
export function generateCharacterCode(
  plan: { ops: CharacterOp[]; parts: string[]; tracks: number; notes: string[]; concept?: string; root?: string | null },
  gen: {
    generateCreateItem: (input: unknown) => string;
    generateKeyframeAnimate: (input: unknown) => string;
  },
  parse: { createItem: (a: unknown) => unknown; keyframeAnimate: (a: unknown) => unknown },
): string {
  const out: string[] = [];
  for (const note of plan.notes) out.push(`// ${note.replace(/\r?\n/g, ' ')}`);

  // ── THE PART IDS THE PERFORMANCE NAMES ARE NOT THE IDS THE ENGINE MINTS ────
  //
  // `performCharacter` names its parts `pigeon_eye`, `pigeon_head` … and keys
  // every keyframe track on those names. PinePaper does not accept a
  // caller-supplied id: `create()` never forwards `params.id` to
  // `itemRegistry.register`, which mints `item_1`, `item_2` … of its own. So
  // `addAnimation('pigeon_eye', …)` finds nothing — and it does not throw, it
  // `console.warn`s, and production strips console.
  //
  // MEASURED, because the unit tests could not see it: thirteen parts rendered
  // correctly at the right place and ZERO of them carried a keyframe. The
  // figure appears, and simply never moves. Every signal short of reading the
  // items said the call had succeeded.
  //
  // So the program binds each part to the id the engine actually assigned and
  // the tracks reference that, which is what makes the performance run.
  // On a CURRENT studio this map is the identity — FxTool's `create()` now
  // honours a caller-supplied `id` (and suffixes rather than steals a taken
  // one). It is kept because an MCP server talks to whatever studio is open,
  // and on an older one the minted ids are all that exist. Reading the id back
  // from the item is correct on both.
  out.push('const __ppChar = {};');

  // ONE AUTHORING ACT, ONE UNDO. Each generated op ends with its own
  // `saveState()`, which for a thirteen-part figure is thirteen undo steps to
  // remove one pigeon. The optional call means an older studio without
  // batching still runs — it just undoes in pieces.
  out.push('app.historyManager?.beginBatch?.();');

  for (const op of plan.ops) {
    // BLOCK-SCOPED, BECAUSE EVERY GENERATED CREATE DECLARES `const item`.
    // Concatenated, thirteen parts are thirteen redeclarations in one scope and
    // the whole program is a SyntaxError before a single shape is drawn — it
    // does not draw twelve parts and fail on the last, it draws nothing.
    if (op.tool === 'pinepaper_create_item') {
      const partId = String((op.args.properties as Record<string, unknown>)?.id ?? '');
      const body = gen.generateCreateItem(parse.createItem(op.args));
      // `itemId` is declared by the generated code inside this same block.
      const bind = partId ? `\n__ppChar[${JSON.stringify(partId)}] = itemId;` : '';
      out.push(`{\n${body}${bind}\n}`);
    } else if (op.tool === 'pinepaper_keyframe_animate') {
      const partId = String(op.args.itemId ?? '');
      // Generated against a placeholder, then the placeholder LITERAL is
      // swapped for the lookup. A placeholder rather than the part id itself
      // because the id also appears in the op's trailing result object, and a
      // blanket string replace there would be a silent rewrite of something
      // else — this way the only thing that can match is the token this
      // function put in.
      const token = `__PP_REF_${partId}__`;
      const body = gen
        .generateKeyframeAnimate(parse.keyframeAnimate({ ...op.args, itemId: token }))
        .split(JSON.stringify(token)).join(`__ppChar[${JSON.stringify(partId)}]`)
        .split(`'${token}'`).join(`__ppChar[${JSON.stringify(partId)}]`);
      out.push(`{\n${body}\n}`);
    }
  }

  // ── THE PARTS ARE ONE FIGURE, AND ONLY THE GRAPH CAN SAY SO ───────────────
  //
  // Nothing else in the program does. They are thirteen sibling paths; a Paper
  // group would bind them and would also put ONE transform over all of them,
  // which is wrong for a performance keyed per part — the same trade text
  // effects make by joining glyphs with edges instead of grouping them.
  //
  // `part_of_figure` is an ANNOTATION: inert at frame time. It is deliberately
  // not `part_of`, which cascades the parent's position — every carried part
  // already has that motion baked into its own track by `carriedBy`, so the two
  // together would move it twice.
  if (plan.root) {
    const bindings = plan.parts
      .filter((p) => p !== plan.root)
      .map((p) => ({ part: p, role: p.replace(/^[^_]+_/, '').replace(/__ink$/, '') }));
    if (bindings.length) {
      out.push(
        [
          `// ${bindings.length} parts bound into one figure, rooted on ${plan.root}`,
          'if (app.addRelation) {',
          ...bindings.map(
            (b) =>
              `  app.addRelation(__ppChar[${JSON.stringify(b.part)}], __ppChar[${JSON.stringify(plan.root)}],` +
              ` 'part_of_figure', { role: ${JSON.stringify(b.role)}, concept: ${JSON.stringify(plan.concept)} });`,
          ),
          '}',
        ].join('\n'),
      );
    }
  }

  out.push('app.historyManager?.endBatch?.(true);');
  out.push(`// ${plan.parts.length} parts, ${plan.tracks} keyframe tracks`);
  out.push(`return ${JSON.stringify({ parts: plan.parts, tracks: plan.tracks, notes: plan.notes })};`);
  return out.join('\n\n');
}
