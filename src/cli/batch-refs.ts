/**
 * Offline check of `$N` item references in a batch.
 *
 * `$N` is the Nth item THIS batch made: create and group ops are numbered in op order from $0, and the macros that
 * make items (ring, grid, create_many, and orbit with itemType) take one slot per item. An op that names `$N`
 * before N items exist fails in the Studio at run time; this finds it without a browser, in the Studio's words.
 */

export interface BadItemRef {
  /** Path of the field, e.g. `operations[3].itemId`. */
  path: string;
  message: string;
}

const REF = /^\$(\d+)$/;

function whole(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : fallback;
}

/** How many items one op makes (each takes the next $N slot). */
function slotsMade(op: Record<string, unknown>): number {
  switch (op.type) {
    case 'create':
    case 'group':
      return 1;
    case 'ring':
      return Math.max(0, whole(op.count, 12));
    case 'grid':
      return Math.max(0, whole(op.rows, 1)) * Math.max(0, whole(op.cols, 1));
    case 'create_many':
      return Array.isArray(op.items) ? op.items.length : 0;
    case 'orbit':
      return op.itemType !== undefined ? 1 : 0;
    default:
      return 0;
  }
}

/** [path suffix, value] of every field of an op that names an item, so a `$N` in it can be checked. */
function itemRefFields(op: Record<string, unknown>): Array<[string, unknown]> {
  const out: Array<[string, unknown]> = [];
  for (const key of ['itemId', 'sourceId', 'targetId']) {
    if (op[key] !== undefined) out.push([key, op[key]]);
  }
  if (Array.isArray(op.itemIds)) op.itemIds.forEach((v, i) => out.push([`itemIds[${i}]`, v]));
  if (op.type === 'timeline' && Array.isArray(op.tweens)) {
    op.tweens.forEach((tw, ti) => {
      const to = tw && typeof tw === 'object' ? (tw as { to?: unknown }).to : undefined;
      if (Array.isArray(to)) to.forEach((v, i) => out.push([`tweens[${ti}].to[${i}]`, v]));
      else if (to !== undefined) out.push([`tweens[${ti}].to`, to]);
    });
  }
  return out;
}

export function findBadItemRefs(ops: ReadonlyArray<Record<string, unknown>>): BadItemRef[] {
  const bad: BadItemRef[] = [];
  let made = 0;
  ops.forEach((op, index) => {
    if (!op || typeof op !== 'object') return;
    for (const [suffix, value] of itemRefFields(op)) {
      const m = typeof value === 'string' ? REF.exec(value) : null;
      if (!m) continue;
      const n = Number(m[1]);
      if (n >= made) {
        bad.push({
          path: `operations[${index}].${suffix}`,
          message:
            `$${n} is item number ${n} THIS batch made (create and group ops are numbered, in op order, from $0), and it has made ${made} so far. `
            + 'Put the ops that make it first, or pass the item id.',
        });
      }
    }
    made += slotsMade(op);
  });
  return bad;
}
