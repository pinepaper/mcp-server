/**
 * A batch op takes the names its standalone tool takes.
 *
 * Each op type grew its own prefixed names (relationOptions, effectParams, generatorParams, maskPreset …) while the
 * standalone tools say params / options / preset / region, and pinepaper_animate takes intensity / speed / delay at
 * its top level. An agent that learned one tool wrote the other's names, and the value was dropped: reported as an
 * ignored argument at best, and in silence where the name happened to belong to another op type (`speed` on an
 * animate op, `preset` on a mask op). Measured live before this change:
 *   animate  animationOptions { intensity, speed, delay } → none applied, nothing reported
 *   relation params { radius }                            → not applied (reported)
 *   apply_mask preset 'iris'                              → not applied, nothing reported
 *
 * So the batch translates them before anything runs, and the reply lists each translation. The batch's own name
 * wins when both are given: the other one is left in place, where the ignored-argument check reports it.
 */

/** Op-level renames: the standalone tool's name → the batch op's name. */
export const BATCH_OP_RENAMES: Readonly<Record<string, Readonly<Record<string, string>>>> = Object.freeze({
  relation: Object.freeze({ params: 'relationOptions' }),
  apply_effect: Object.freeze({ params: 'effectParams' }),
  apply_mask: Object.freeze({ preset: 'maskPreset', options: 'maskOptions' }),
  execute_generator: Object.freeze({ params: 'generatorParams', region: 'generatorRegion' }),
});

/** pinepaper_animate's names → the engine's, which the batch hands to app.animate as they are. */
export const ANIMATION_OPTION_NAMES: Readonly<Record<string, string>> = Object.freeze({
  speed: 'animationSpeed',
  intensity: 'animationIntensity',
  delay: 'animationDelay',
  waveform: 'animationWaveform',
  origin: 'animationOrigin',
});

/**
 * Not folded into a modify op's properties: what the op reads at its top level, and pinepaper_modify_item's other
 * arguments, which the batch op does not support (folded, they would become property writes; left, the
 * ignored-argument check names them). Any other key is a change to the item, as on create.
 */
const MODIFY_NOT_PROPERTIES = new Set(['type', 'itemId', 'properties', 'position', '_step', 'id',
  'data', 'atTime', 'easing', 'screenSpace', 'stepTiming', 'counter']);

type Op = Record<string, unknown>;
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

export function normalizeBatchOperationNames(args: Record<string, unknown>): { args: Record<string, unknown>; renamed: string[]; dropped: string[] } {
  if (!Array.isArray(args.operations)) return { args, renamed: [], dropped: [] };
  const renamed: string[] = [];
  const dropped: string[] = [];
  const operations = (args.operations as unknown[]).map((raw, i) => {
    if (!isObj(raw)) return raw;
    const op: Op = { ...raw };
    const type = typeof op.type === 'string' ? op.type : 'create';
    const at = `operations[${i}]`;
    const move = (from: string, to: string) => {
      if (op[from] === undefined || op[to] !== undefined) return;
      op[to] = op[from];
      delete op[from];
      renamed.push(`${at}.${from} → ${to}`);
    };
    for (const [from, to] of Object.entries(BATCH_OP_RENAMES[type] ?? {})) move(from, to);

    // A `_` key in a relation's parameters is the studio's working state, never a parameter (the engine drops them all at
    // its own save boundary). An update op writes what it is given into the live relation, and the engine only fills an
    // empty slot, so a copied snapshot of its registry would replace the live one for good.
    if (type === 'relation' && isObj(op.relationOptions)) {
      const kept = Object.entries(op.relationOptions).filter(([k]) => {
        if (!k.startsWith('_')) return true;
        dropped.push(`${at}.relationOptions.${k}`);
        return false;
      });
      if (kept.length !== Object.keys(op.relationOptions).length) op.relationOptions = Object.fromEntries(kept);
    }

    if (type === 'animate') {
      const opts: Record<string, unknown> = isObj(op.animationOptions) ? { ...op.animationOptions } : {};
      let changed = false;
      for (const [short, long] of Object.entries(ANIMATION_OPTION_NAMES)) {
        if (opts[short] !== undefined && opts[long] === undefined) {
          opts[long] = opts[short];
          delete opts[short];
          renamed.push(`${at}.animationOptions.${short} → animationOptions.${long}`);
          changed = true;
        }
        if (op[short] !== undefined && opts[long] === undefined) {
          opts[long] = op[short];
          delete op[short];
          renamed.push(`${at}.${short} → animationOptions.${long}`);
          changed = true;
        }
      }
      if (changed) op.animationOptions = opts;
    }

    if (type === 'modify') {
      const props: Record<string, unknown> = isObj(op.properties) ? { ...op.properties } : {};
      let changed = false;
      for (const k of Object.keys(op)) {
        if (MODIFY_NOT_PROPERTIES.has(k) || op[k] === undefined || props[k] !== undefined) continue;
        props[k] = op[k];
        delete op[k];
        renamed.push(`${at}.${k} → properties.${k}`);
        changed = true;
      }
      if (changed) op.properties = props;
    }
    return op;
  });
  return renamed.length || dropped.length ? { args: { ...args, operations }, renamed, dropped } : { args, renamed, dropped };
}

export const RENAMED_ARGUMENTS_META_KEY = 'pinepaper.studio/renamedArguments';

/** The reply's line for what was translated, so a name that changed never changes in silence. */
export function renamedArgumentsNote(renamed: string[]): string {
  const shown = renamed.slice(0, 20);
  return `Read under the batch op's own names: ${shown.join(', ')}${renamed.length > shown.length ? ` (and ${renamed.length - shown.length} more)` : ''}.`;
}
