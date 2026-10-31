/**
 * Batch macros: ring, grid, orbit, stagger and patch, expanded into the
 * batch's own ops before any code is generated.
 *
 * A macro is shorthand, not a second implementation. A ring of twelve is twelve
 * `create` ops (create_item's emitter: its property check, brand defaults and
 * font loading) and, when it animates, twelve `keyframe_animate` ops. So every
 * element fills a `$N` slot like any create, the atomic rollback removes it,
 * and a failure names the element. The first version of this called
 * app.create(type, {x, y}, props): the engine takes (type, params), so every
 * property was dropped and the ring still reported success.
 *
 * `$N` is the Nth item the batch has CREATED (only `create` claims a slot; see
 * generateAgentBatchExecute), so the slot of each element is known here.
 */

type Op = Record<string, unknown>;
type Pt = { x: number; y: number };

const MAX_ELEMENTS = 200;

function point(v: unknown, fallback: Pt): Pt {
  if (Array.isArray(v) && v.length >= 2) return { x: Number(v[0]), y: Number(v[1]) };
  if (v && typeof v === 'object') {
    const p = v as { x?: unknown; y?: unknown };
    return { x: Number(p.x ?? fallback.x), y: Number(p.y ?? fallback.y) };
  }
  return fallback;
}

function num(v: unknown, fallback: number): number {
  const n = Number(v);
  return v !== undefined && Number.isFinite(n) ? n : fallback;
}

const round = (n: number, d = 2) => Number(n.toFixed(d));

export class BatchMacroError extends Error {}

/** Keyframes a macro was given, under any of the names the batch takes. */
function keyframesOf(op: Op): unknown[] | null {
  const k = op.keyframes;
  return Array.isArray(k) && k.length ? k : null;
}

/** One element: a create, and a keyframe_animate on its slot when the macro animates. */
function element(
  out: Op[], slots: { n: number }, macro: string, label: string,
  itemType: string, at: Pt, props: Record<string, unknown>, name: string,
  anim: { keyframes: unknown[] | null; duration?: number; loop: boolean; timeOffset: number },
): void {
  out.push({ type: 'create', itemType, position: { x: round(at.x), y: round(at.y) }, properties: { ...props, name }, _step: `${macro} ${label}` });
  const slot = slots.n++;
  if (anim.keyframes) {
    out.push({
      type: 'keyframe_animate', itemId: `$${slot}`, keyframes: anim.keyframes,
      ...(anim.duration !== undefined ? { duration: anim.duration } : {}),
      loop: anim.loop, timeOffset: round(anim.timeOffset, 3), _step: `${macro} ${label} keyframes`,
    });
  }
}

/**
 * The ops with every macro expanded. Ops that are not macros pass through
 * untouched; a malformed macro throws BatchMacroError naming the op.
 */
export function expandBatchMacros(ops: readonly Op[]): Op[] {
  const out: Op[] = [];
  const slots = { n: 0 };
  ops.forEach((op, index) => {
    const tag = `op ${index} (${String(op.type)})`;
    const props = (op.properties && typeof op.properties === 'object' ? op.properties : {}) as Record<string, unknown>;
    switch (op.type) {
      case 'ring': {
        const count = Math.trunc(num(op.count, 12));
        if (count < 1 || count > MAX_ELEMENTS) throw new BatchMacroError(`${tag}: count is ${count}; a ring takes 1 to ${MAX_ELEMENTS} items.`);
        const c = point(op.center, { x: 400, y: 300 });
        const r = num(op.radius, 150);
        const startDeg = num(op.startAngle, -90); // the first item at 12 o'clock
        const prefix = String(op.name ?? `ring${index}`);
        const kfs = keyframesOf(op);
        const period = num(op.period, 0);
        const stagger = num(op.stagger, period > 0 ? period / count : 0.05);
        for (let i = 0; i < count; i++) {
          const deg = startDeg + (360 * i) / count;
          const rad = (deg * Math.PI) / 180;
          // orient: true turns each item to face out from the centre (its rotation is the angle + 90).
          const p = op.orient === true ? { ...props, rotation: num(props.rotation, 0) + round(deg + 90) } : props;
          element(out, slots, tag, `item ${i}`, String(op.itemType ?? 'circle'),
            { x: c.x + r * Math.cos(rad), y: c.y + r * Math.sin(rad) }, p, `${prefix}_${i}`,
            { keyframes: kfs, duration: op.duration !== undefined ? num(op.duration, 2) : (period > 0 ? period : undefined), loop: op.loop !== false, timeOffset: i * stagger });
        }
        return;
      }
      case 'grid': {
        const rows = Math.trunc(num(op.rows, 1));
        const cols = Math.trunc(num(op.cols, 1));
        if (rows < 1 || cols < 1 || rows * cols > MAX_ELEMENTS) throw new BatchMacroError(`${tag}: ${rows} × ${cols}; a grid takes 1 to ${MAX_ELEMENTS} items.`);
        const o = point(op.origin, { x: 100, y: 100 });
        const [dx, dy] = Array.isArray(op.spacing) ? [num(op.spacing[0], 50), num(op.spacing[1], 50)] : [num(op.spacing, 50), num(op.spacing, 50)];
        const prefix = String(op.name ?? `grid${index}`);
        const kfs = keyframesOf(op);
        const stagger = num(op.stagger, 0.05);
        let i = 0;
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++, i++) {
            element(out, slots, tag, `row ${row} col ${col}`, String(op.itemType ?? 'rectangle'),
              { x: o.x + col * dx, y: o.y + row * dy }, props, `${prefix}_${row}_${col}`,
              { keyframes: kfs, duration: op.duration !== undefined ? num(op.duration, 2) : undefined, loop: op.loop !== false, timeOffset: i * stagger });
          }
        }
        return;
      }
      case 'orbit': {
        const target = op.targetId;
        if (typeof target !== 'string' || !target) throw new BatchMacroError(`${tag}: name the item to orbit with targetId (an id, a name or $N).`);
        let source = op.sourceId;
        if (op.itemType !== undefined) {
          // Made here and placed by the relation, which sets its position from frame 0.
          out.push({ type: 'create', itemType: String(op.itemType), position: { x: 400, y: 300 }, properties: { ...props, ...(op.name ? { name: String(op.name) } : {}) }, _step: `${tag} item` });
          source = `$${slots.n++}`;
        }
        if (typeof source !== 'string' || !source) throw new BatchMacroError(`${tag}: name the orbiting item with sourceId, or pass itemType to make one.`);
        // phaseDegrees only: the relation's own `phase` is in RADIANS.
        const relationOptions: Record<string, number> = {};
        if (op.radius !== undefined) relationOptions.radius = num(op.radius, 0);
        if (op.speed !== undefined) relationOptions.speed = num(op.speed, 0);
        if (op.phaseDegrees !== undefined) relationOptions.phaseDegrees = num(op.phaseDegrees, 0);
        out.push({ type: 'relation', sourceId: source, targetId: target, relationType: 'orbits', relationOptions, _step: `${tag} relation` });
        return;
      }
      case 'stagger': {
        const ids = op.itemIds;
        if (!Array.isArray(ids) || !ids.length) throw new BatchMacroError(`${tag}: itemIds lists the items to stagger (ids, names or $N).`);
        const kfs = keyframesOf(op);
        if (!kfs) throw new BatchMacroError(`${tag}: keyframes is the animation each item plays, offset by stagger seconds.`);
        const stagger = num(op.stagger, 0.1);
        ids.forEach((id, i) => out.push({
          type: 'keyframe_animate', itemId: String(id), keyframes: kfs,
          ...(op.duration !== undefined ? { duration: num(op.duration, 2) } : {}),
          loop: op.loop === true, timeOffset: round(i * stagger, 3), _step: `${tag} item ${i}`,
        }));
        return;
      }
      case 'patch': {
        // modify, addressed by name: the engine resolves a name, and the modify op refuses one held by several items.
        const target = op.itemId ?? op.name;
        if (typeof target !== 'string' || !target) throw new BatchMacroError(`${tag}: name the item to change with name (or itemId).`);
        out.push({ type: 'modify', itemId: target, properties: props, _step: tag });
        return;
      }
      default:
        // A group makes an item, so it takes a $N slot as a create does (O2).
        if (op.type === 'create' || op.type === 'group') slots.n++;
        out.push(op);
    }
  });
  return out;
}

/** True when any op is a macro, so the handler can say the batch was expanded. */
export function hasBatchMacros(ops: readonly Op[]): boolean {
  return ops.some((op) => ['ring', 'grid', 'orbit', 'stagger', 'patch'].includes(String(op.type)));
}
