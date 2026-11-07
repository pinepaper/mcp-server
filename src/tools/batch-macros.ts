/**
 * Batch macros: ring, grid, orbit, stagger, patch and create_many (and keys on any of them that animate), expanded into the
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

const MAX_KEYS = 100000;
const KEY_COLUMNS_EXAMPLE = '{"time":[0,1],"x":[100,400],"easing":"easeOut"}';

/**
 * keys: the same keyframes by column, one list per property under one header. A dense track pays for its numbers
 * and nothing else. A null in a column means that key does not set that property, as a key object leaving it out.
 */
export function expandKeyColumns(keys: unknown, tag: string): Array<{ time: number; properties: Record<string, unknown>; easing?: string }> {
  const refuse = (why: string): never => { throw new BatchMacroError(`${tag}: keys ${why} keys is one list per property under a time list: ${KEY_COLUMNS_EXAMPLE}.`); };
  if (!keys || typeof keys !== 'object' || Array.isArray(keys)) return refuse('must be an object of columns.');
  const { time, easing, ...columns } = keys as Record<string, unknown>;
  // An evenly spaced track (anything baked at a frame rate) needs no time column at all.
  let times: unknown[];
  if (time && typeof time === 'object' && !Array.isArray(time)) {
    const { step, count, from = 0 } = time as Record<string, unknown>;
    if (typeof step !== 'number' || !(step > 0) || !Number.isFinite(step)) return refuse('time.step must be the seconds between keys.');
    if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > MAX_KEYS) return refuse(`time.count must be a whole number of keys, 1 to ${MAX_KEYS}.`);
    if (typeof from !== 'number' || !Number.isFinite(from)) return refuse('time.from must be the first key\'s seconds.');
    times = Array.from({ length: count }, (_, i) => Number((from + i * step).toFixed(6)));
  } else if (!Array.isArray(time) || !time.length) {
    return refuse('needs a non-empty time list, or {step, count}.');
  } else {
    times = time;
  }
  times.forEach((t, i) => { if (typeof t !== 'number' || !Number.isFinite(t)) refuse(`time[${i}] is not a number of seconds.`); });
  // A key's own options have no column: a column is a property, so these would be set on the item.
  for (const reserved of ['properties', 'interpolation', 'hold']) {
    if (reserved in columns) refuse(`has a ${reserved} column, and every column but time and easing is a property. Use keyframes for that key.`);
  }
  for (const [name, col] of Object.entries(columns)) {
    if (!Array.isArray(col)) refuse(`${name} must be a list, one value per time.`);
    else if (col.length !== times.length) refuse(`${name} has ${col.length} value${col.length === 1 ? '' : 's'}, and time has ${times.length}.`);
  }
  if (easing !== undefined && typeof easing !== 'string') {
    if (!Array.isArray(easing)) refuse('easing must be a name, or a list with one name or null per time.');
    else if (easing.length !== times.length) refuse(`easing has ${easing.length} value${easing.length === 1 ? '' : 's'}, and time has ${times.length}.`);
  }
  return times.map((t, i) => {
    const properties: Record<string, unknown> = {};
    for (const [name, col] of Object.entries(columns)) {
      const v = (col as unknown[])[i];
      if (v !== null && v !== undefined) properties[name] = v;
    }
    if (!Object.keys(properties).length) refuse(`has no value for the key at time ${String(t)}.`);
    const e = Array.isArray(easing) ? easing[i] : easing;
    return { time: t as number, properties, ...(typeof e === 'string' ? { easing: e } : {}) };
  });
}

/** An op or tool call with keys turned into the keyframes they stand for; one without keys comes back as it was. */
export function withKeyColumns<T extends Record<string, unknown>>(op: T, tag: string): T {
  if (op.keys === undefined) return op;
  if (op.keyframes !== undefined) throw new BatchMacroError(`${tag}: pass keys or keyframes, not both.`);
  const { keys, ...rest } = op;
  return { ...rest, keyframes: expandKeyColumns(keys, tag) } as unknown as T;
}

/** Keyframes a macro was given, under any of the names the batch takes. */
function keyframesOf(op: Op, tag: string): unknown[] | null {
  const k = withKeyColumns(op, tag).keyframes;
  return Array.isArray(k) && k.length ? k : null;
}

const CREATE_MANY_KEYS = new Set(['type', 'itemType', 'name', 'properties', 'items', '_step']);

/** One entry of create_many as a create's parts, or null when it is not an item at all. */
function manyItemParts(op: Op, item: unknown): { itemType: unknown; position: unknown; properties: Record<string, unknown> } | null {
  const shared = (op.properties && typeof op.properties === 'object' ? op.properties : {}) as Record<string, unknown>;
  if (Array.isArray(item)) return { itemType: op.itemType, position: item, properties: { ...shared } };
  if (!item || typeof item !== 'object') return null;
  const { x, y, position, itemType, properties, ...rest } = item as Record<string, unknown>;
  const own = (properties && typeof properties === 'object' ? properties : {}) as Record<string, unknown>;
  return {
    itemType: itemType ?? op.itemType,
    position: position ?? (x !== undefined || y !== undefined ? { x, y } : undefined),
    properties: { ...shared, ...own, ...rest },
  };
}

function finitePoint(v: unknown): Pt | null {
  const [x, y] = Array.isArray(v) ? v : v && typeof v === 'object' ? [(v as Pt).x, (v as Pt).y] : [];
  return typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y) ? { x, y } : null;
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
        const kfs = keyframesOf(op, tag);
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
        const kfs = keyframesOf(op, tag);
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
        const kfs = keyframesOf(op, tag);
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
      case 'create_many': {
        // A key the op would drop is refused here: BATCH_OP_READS lists generated-code ops, and this one has no code.
        const extra = Object.keys(op).filter((k) => !CREATE_MANY_KEYS.has(k));
        if (extra.length) throw new BatchMacroError(`${tag}: ${extra.join(', ')} is not read here. What every item shares goes in properties; what one item has goes on that item.`);
        const items = op.items;
        if (!Array.isArray(items) || !items.length) throw new BatchMacroError(`${tag}: items lists the items: [x, y], or {x, y, …what differs}.`);
        items.forEach((item, i) => {
          const parts = manyItemParts(op, item);
          if (!parts) throw new BatchMacroError(`${tag}: items[${i}] must be [x, y] or {x, y, …what differs}.`);
          const at = finitePoint(parts.position);
          if (!at) throw new BatchMacroError(`${tag}: items[${i}] has no position: give [x, y], x and y, or position.`);
          if (typeof parts.itemType !== 'string' || !parts.itemType) throw new BatchMacroError(`${tag}: items[${i}] has no type: give itemType on the op or on the item.`);
          const named = parts.properties.name === undefined && op.name !== undefined ? { ...parts.properties, name: `${String(op.name)}-${i}` } : parts.properties;
          out.push({ type: 'create', itemType: parts.itemType, position: at, properties: named, _step: `${tag} items[${i}]` });
          slots.n++;
        });
        return;
      }
      case 'keyframe_animate':
        out.push(withKeyColumns(op, tag));
        return;
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
  return ops.some((op) => ['ring', 'grid', 'orbit', 'stagger', 'patch', 'create_many'].includes(String(op.type)));
}

/**
 * What the vocabulary and typo preflights read: every create_many item as the create it will be, so an item gets the
 * check a create gets, and the path each entry came from. A malformed item is left for the expansion to refuse.
 */
export function batchPreflightView(ops: readonly Op[]): { ops: Op[]; paths: string[] } {
  const view: Op[] = [];
  const paths: string[] = [];
  ops.forEach((op, i) => {
    if (op.type !== 'create_many' || !Array.isArray(op.items)) { view.push(op); paths.push(`operations[${i}]`); return; }
    op.items.forEach((item, j) => {
      const parts = manyItemParts(op, item);
      if (!parts) return;
      view.push({ type: 'create', itemType: parts.itemType, properties: parts.properties });
      paths.push(`operations[${i}].items[${j}]`);
    });
  });
  return { ops: view, paths };
}
