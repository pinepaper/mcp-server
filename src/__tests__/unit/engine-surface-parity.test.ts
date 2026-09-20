/**
 * Every `app.X` this repo emits must exist on the engine.
 *
 * THE BUG THAT MADE THIS NECESSARY. Nine diagram tools emitted
 * `app.diagramManager.createShape(...)`. `app.diagramManager` has never existed
 * in FxTool — the object is `app.diagramSystem`. Twelve references shipped in
 * every release, and a beta tester found them by running the tools.
 *
 * This repo already HAD a drift guard, and it could not see them. `check:engine-
 * methods` extracts the names the emitters GUARD — `typeof app.X !== 'function'`
 * — which is opt-in by construction: a call site with no guard in front of it is
 * invisible to it, and an unguarded call is exactly the kind nobody was thinking
 * about the engine when they wrote. The guard covered the careful code and
 * missed the careless code.
 *
 * So this one is OPT-OUT. It reads every `app.X` in the emitters and checks all
 * of them. An emitter that means to name something outside the engine's surface
 * declares it with `@engine-surface-exempt`, with a reason, in the source.
 *
 * THE RATCHET. Inverting the guard found 10 drifted names across 43 references,
 * not the 1 the tester hit — the other nine were simply never exercised by their
 * demo. Fixing all of them is a release's worth of work, and leaving the guard
 * off until then is how it never lands. So the known drift is listed here with
 * its reference count, and the test asserts the list only ever SHRINKS: new
 * drift fails immediately, old drift cannot grow, and the list is the fix
 * backlog. A number that can only go down is a guard.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_SURFACE, LAZY_HEAVY_SUBSYSTEMS } from '../../tools/engine-surface.js';

const REPO = join(import.meta.dir, '..', '..', '..');
const EMITTER = join(REPO, 'src', 'types', 'code-generator.ts');

/**
 * Names the emitters reference that the engine does not have.
 *
 * EVERY ENTRY IS A BUG. They are listed rather than fixed in one pass because
 * they are not one fix — `diagramManager` is a rename to `diagramSystem`, while
 * `timeline`, `groupManager` and `magicSystem` are not present in FxTool under
 * any name, so the tools reaching for them are wholly broken and need a
 * different answer. The count beside each is the reference count at the time
 * the guard was inverted (2026-09-20, FxTool eb786a3a). `clearAllRelations`
 * was on the first draft of this list and is NOT here: it appears only inside
 * an emitted comment, which the extractor below strips. A guard that counted
 * prose would have sent someone to fix a call that does not exist. Three more
 * — groupManager, templateManager and magicSystem — came off when the surface
 * learned to read js/app.js, which bolts ~65 names onto the instance after
 * construction. All three are real and working. The "nothing in the list is
 * secretly fine" check below is what caught them.
 *
 * To fix one: correct the references, drop the entry, watch the total fall.
 * Adding an entry here is not a fix and the reviewer should say so.
 */
const KNOWN_DRIFT: Readonly<Record<string, number>> = Object.freeze({
  // EMPTY, and that is the point of the shape. All six were fixed in the same
  // change that inverted the guard: diagramManager → diagramSystem (with three
  // signature corrections behind it), timeline → timelineState / animatedItems,
  // spriteSheetSystem → the methods that live on app itself, generators →
  // generatorRegistry.get, getBackgroundColor → the canvas element's own style,
  // exportSVG → exportSVGWithCSS.
  //
  // An entry here is a bug with a name. Zero entries is the only correct
  // resting state, and the tests below make an empty list mean something: a new
  // drifted name fails outright rather than being added here.
});

/**
 * Pull every `app.<name>` out of the emitter source.
 *
 * Comments are stripped FIRST, at two levels, and both matter. A TypeScript
 * comment explaining a call reads exactly like a call — the collision that has
 * bitten this repo before — and the emitted code carries its OWN `//` comments
 * inside template literals, which the TypeScript pass does not reach. Only
 * lines whose first non-space characters are `//` are removed, so a `//` inside
 * a URL or a string survives.
 */
export function referencedAppNames(src = readFileSync(EMITTER, 'utf8')): Map<string, number> {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

  const counts = new Map<string, number>();
  for (const m of code.matchAll(/\bapp\.([A-Za-z_]\w*)/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  // An emitter may declare a deliberate exception:
  //   @engine-surface-exempt <name> — why
  for (const m of src.matchAll(/@engine-surface-exempt\s+([A-Za-z_]\w*)/g)) {
    counts.delete(m[1]);
  }
  return counts;
}

describe('the emitters only call what the engine has', () => {
  it('reads a real surface and a real set of call sites', () => {
    // Liveness. An extractor that silently matched nothing would make every
    // assertion below pass while checking precisely nothing — which is the
    // failure mode of the guard this one replaces.
    expect(Object.keys(ENGINE_SURFACE).length).toBeGreaterThan(500);
    expect(referencedAppNames().size).toBeGreaterThan(100);
  });

  it('every `app.X` exists on the engine, or is known drift', () => {
    const unknown: string[] = [];
    for (const [name] of referencedAppNames()) {
      if (name in ENGINE_SURFACE) continue;
      if (name in KNOWN_DRIFT) continue;
      unknown.push(name);
    }
    // A name here is a call into nothing: it fails silently in the browser and
    // the tool reports whatever the surrounding code reports.
    expect(unknown.sort()).toEqual([]);
  });

  it('the known-drift list only ever shrinks', () => {
    const refs = referencedAppNames();
    for (const [name, wasCount] of Object.entries(KNOWN_DRIFT)) {
      const now = refs.get(name) ?? 0;
      expect(now, `app.${name} gained references — drift may only be removed`).toBeLessThanOrEqual(wasCount);
    }
  });

  it('a fixed name is removed from the list rather than left at zero', () => {
    // Otherwise the backlog stops meaning anything: an entry at 0 reads as
    // outstanding work that is already done, and the total stops falling.
    const refs = referencedAppNames();
    const done = Object.keys(KNOWN_DRIFT).filter((n) => (refs.get(n) ?? 0) === 0);
    expect(done, 'these are fixed — delete them from KNOWN_DRIFT').toEqual([]);
  });

  it('nothing in the known-drift list is secretly fine', () => {
    // If a name turns up on the engine, it was never drift and the entry is
    // hiding a different bug — a wrong signature, say, rather than a wrong name.
    const wrong = Object.keys(KNOWN_DRIFT).filter((n) => n in ENGINE_SURFACE);
    expect(wrong, 'these exist on the engine and are not drift').toEqual([]);
  });
});

describe('lazy-heavy subsystems are awaited before they are touched', () => {
  /**
   * `_defineLazyHeavy` members are UNDEFINED until `ensureHeavyModules()` has
   * run — idle-prefetched about 1.2s after boot. An agent that connects and
   * immediately calls a tool beats that prefetch, and the emitted guard then
   * reports the studio as too old for a capability it has.
   *
   * That was the `app.exportEngine` bug fixed in 1.6.9 inside one emitter. When
   * this guard was inverted it found FORTY-EIGHT more emitted blocks with the
   * same race, across map, physics and rigging.
   *
   * Forty-eight awaits would be forty-eight chances to miss the forty-ninth, so
   * the wait lives at the single place every emitted string passes through —
   * `executeCode` — and reads the list from the GENERATED surface. A subsystem
   * FxTool makes lazy tomorrow is covered by re-running the generator, not by
   * anybody remembering. These tests pin that arrangement, because it is load
   * bearing and invisible: nothing in an emitter says it is being waited for.
   */
  const controller = readFileSync(join(REPO, 'src', 'browser', 'puppeteer-controller.ts'), 'utf8');

  it('the engine really does have several, so this is not a vacuous check', () => {
    expect(LAZY_HEAVY_SUBSYSTEMS.length).toBeGreaterThan(1);
    expect(LAZY_HEAVY_SUBSYSTEMS).toContain('exportEngine');
  });

  it('the controller awaits ensureHeavyModules before running emitted code', () => {
    expect(controller).toContain('ensureHeavyModules');
    expect(controller).toContain('needsHeavy');
  });

  it('it decides from the GENERATED list, not a hand-written copy', () => {
    // A second copy of the eight names is the drift this whole file exists to
    // stop. The controller must import the generated constant.
    expect(controller).toContain('LAZY_HEAVY_SUBSYSTEMS');
    expect(controller).toMatch(/import\s*\{[^}]*LAZY_HEAVY_SUBSYSTEMS[^}]*\}\s*from\s*'\.\.\/tools\/engine-surface\.js'/);
    for (const name of LAZY_HEAVY_SUBSYSTEMS) {
      expect(controller, `${name} must not be hand-listed in the controller`).not.toContain(`'${name}'`);
    }
  });

  it('the await is gated on the code actually reaching one', () => {
    // ensureHeavyModules memoises, so this costs nothing after the first call —
    // but an unrelated create has no reason to wait for the first one either.
    expect(controller).toMatch(/LAZY_HEAVY_SUBSYSTEMS\.some\(/);
  });

  it('a failed load falls through to the emitted guard rather than throwing', () => {
    // The emitter's own guard gives a better message than this layer can, and
    // one unparseable chunk must not take every tool down with it.
    const around = controller.slice(controller.indexOf('opts.needsHeavy'), controller.indexOf('opts.needsHeavy') + 400);
    expect(around).toContain('catch');
  });
});
