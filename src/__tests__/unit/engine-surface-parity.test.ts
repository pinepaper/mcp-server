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
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ENGINE_SURFACE, ENGINE_FACADES, LAZY_HEAVY_SUBSYSTEMS } from '../../tools/engine-surface.js';

const REPO = join(import.meta.dir, '..', '..', '..');
const SRC = join(REPO, 'src');

/**
 * EVERY file that emits engine calls, not just the big one.
 *
 * The first version of this guard scanned only code-generator.ts, and
 * src/tools/handlers/font.ts — six broken method names — was invisible to it.
 * That is the same opt-in failure one level up: a guard that checks the file
 * somebody remembered is a guard against the bugs somebody was already thinking
 * about. Walked, not listed, so a new emitter file is covered the day it lands.
 */
export function emitterFiles(dir = SRC): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '__tests__' || entry.name === 'vendor') continue;
      out.push(...emitterFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
      // The generated surface lists the engine's names; it does not call them.
      if (full.endsWith('engine-surface.ts') || full.endsWith('engine-methods.ts')) continue;
      if (/\bapp\.[A-Za-z_]/.test(readFileSync(full, 'utf8'))) out.push(full);
    }
  }
  return out.sort();
}

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
export function referencedAppNames(files = emitterFiles()): Map<string, number> {
  const counts = new Map<string, number>();
  for (const file of files) countInto(counts, readFileSync(file, 'utf8'));
  return counts;
}

function countInto(counts: Map<string, number>, src: string): void {
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*\/\//.test(line))
    .join('\n');

  for (const m of code.matchAll(/\bapp\.([A-Za-z_]\w*)/g)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  // An emitter may declare a deliberate exception:
  //   @engine-surface-exempt <name> — why
  for (const m of src.matchAll(/@engine-surface-exempt\s+([A-Za-z_]\w*)/g)) {
    counts.delete(m[1]);
  }
}

describe('the emitters only call what the engine has', () => {
  it('reads a real surface and a real set of call sites', () => {
    // Liveness. An extractor that silently matched nothing would make every
    // assertion below pass while checking precisely nothing — which is the
    // failure mode of the guard this one replaces.
    expect(Object.keys(ENGINE_SURFACE).length).toBeGreaterThan(500);
    expect(referencedAppNames().size).toBeGreaterThan(100);
    // More than one emitter file, or the walk has silently narrowed back to
    // the single file that let font.ts through.
    expect(emitterFiles().length).toBeGreaterThan(3);
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

/**
 * `app.<facade>.<method>` — the drift one dot deeper.
 *
 * Checking only the top-level name catches `app.diagramManager` and misses
 * `app.fontStudio.getRequiredChars`: six font actions whose facade is real and
 * whose methods are not, so every one returned "Cannot read properties of
 * undefined" and the tool looked like a missing feature.
 *
 * Only facades present in the snapshot are checked. An unmapped facade is
 * skipped rather than failed — an incomplete map must make a guard quieter,
 * never louder, or it starts failing working code and gets switched off.
 */
/**
 * Methods the emitters PROBE before calling: `typeof app.x.y === 'function'`.
 *
 * A guarded call to a method the snapshotted engine does not have is not drift
 * — it is forward compatibility, and it is the shape this repo already uses for
 * every capability that arrived after some studio build. Counting it as drift
 * would make the guard punish exactly the careful pattern it wants, and the
 * only way to satisfy it would be to snapshot an engine users do not have yet.
 */
export function probedFacadeMethods(files = emitterFiles()): Set<string> {
  const probed = new Set<string>();
  for (const file of files) {
    const src = readFileSync(file, 'utf8');
    for (const m of src.matchAll(/typeof\s+app\.([A-Za-z_]\w*)[?]?\.([A-Za-z_]\w*)\s*===?\s*'function'/g)) {
      probed.add(`${m[1]}.${m[2]}`);
    }
  }
  return probed;
}

export function referencedFacadeMethods(files = emitterFiles()): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  for (const file of files) {
    const code = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .filter((line) => !/^\s*\/\//.test(line))
      .join('\n');
    for (const m of code.matchAll(/\bapp\.([A-Za-z_]\w*)[?]?\.([A-Za-z_]\w*)/g)) {
      out.push([m[1], m[2]]);
    }
  }
  return out;
}

/**
 * Members every JavaScript object has, or that a Map/Set-backed facade has for
 * free. A registry that IS a Map answers `.size` and `.get` without declaring
 * them, and reporting those as drift would be the guard inventing bugs.
 */
const JS_BUILTINS = new Set([
  'constructor', 'toString', 'valueOf', 'hasOwnProperty', 'length', 'name',
  'size', 'get', 'set', 'has', 'delete', 'clear', 'forEach', 'keys', 'values', 'entries',
]);

/**
 * Facade methods the emitters name that their facade does not publish.
 *
 * Same ratchet as the top-level list, and the same meaning: every entry is a
 * call into undefined. They are listed rather than fixed in one pass because
 * each needs its own answer — a rename, a different facade, or an engine that
 * genuinely cannot do it — and the guard is worth more landed than perfect.
 *
 * The six `fontStudio.*` entries this guard first found are NOT here: they were
 * fixed in the same change (setName → setFontName, getRequiredChars →
 * getRequiredCharacters, getStatus → getCompletionStatus, createSpace →
 * createSpaceGlyph, export → exportAsOTF/downloadFont, and show_studio refused
 * by name because opening the panel has no engine entry point at all).
 */
const KNOWN_FACADE_DRIFT: readonly string[] = Object.freeze([
  'filterSystem.addFilter',
  'historyManager.getState',
  'interactionSystem.triggerAction',
  'magicSystem.autoAnimate',
  'magicSystem.remixStyle',
  'mapSystem.addLabels',
  'mapSystem.animateWave',
  'mapSystem.exportMap',
  'mapSystem.exportOriginalGeoJSON',
  'mapSystem.exportRegionCSV',
  'mapSystem.getRegionAtPoint',
  'mapSystem.getSourceInfo',
  'mapSystem.importRegionCSV',
  'mapSystem.panTo',
  'mapSystem.stopAnimations',
  'mapSystem.zoomTo',
  'measurementSystem.setGridVisible',
  'measurementSystem.setRulersVisible',
  'measurementSystem.setSnapToUnitEnabled',
  'relationRegistry.getAll',
  'sceneManager.setLoop',
]);

describe('facade methods exist too', () => {
  it('maps the facades the emitters actually reach through', () => {
    expect(Object.keys(ENGINE_FACADES).length).toBeGreaterThan(5);
    expect(ENGINE_FACADES.fontStudio?.length ?? 0).toBeGreaterThan(10);
    expect(referencedFacadeMethods().length).toBeGreaterThan(50);
  });

  it('every app.<facade>.<method> the emitters call exists on that facade', () => {
    const probed = probedFacadeMethods();
    const unknown = new Set<string>();
    for (const [facade, method] of referencedFacadeMethods()) {
      const known = ENGINE_FACADES[facade];
      if (!known) continue; // unmapped facade — not checked, by design
      if (JS_BUILTINS.has(method)) continue;
      if (known.includes(method)) continue;
      if (KNOWN_FACADE_DRIFT.includes(`${facade}.${method}`)) continue;
      if (probed.has(`${facade}.${method}`)) continue;
      unknown.add(`app.${facade}.${method}`);
    }
    expect([...unknown].sort()).toEqual([]);
  });

  it('a probe is only an excuse where the call is actually guarded', () => {
    // The exemption must not become a blanket one: a method that is probed
    // somewhere and called unguarded elsewhere is still drift in that second
    // place. Pinned by checking the probe set is small and specific rather
    // than swallowing the facade surface.
    const probed = probedFacadeMethods();
    expect(probed.size).toBeLessThan(20);
    for (const entry of probed) expect(entry).toContain('.');
  });

  it('the facade-drift list only ever shrinks', () => {
    const called = new Set(referencedFacadeMethods().map(([f, m]) => `${f}.${m}`));
    const stale = KNOWN_FACADE_DRIFT.filter((e) => !called.has(e));
    // An entry nothing calls any more is fixed — delete it, or the list stops
    // being a backlog and starts being decoration.
    expect(stale, 'these are no longer called — delete them from KNOWN_FACADE_DRIFT').toEqual([]);
  });

  it('nothing in the facade-drift list is secretly fine', () => {
    const wrong = KNOWN_FACADE_DRIFT.filter((e) => {
      const [facade, method] = e.split('.');
      return ENGINE_FACADES[facade]?.includes(method);
    });
    expect(wrong, 'these exist on their facade and are not drift').toEqual([]);
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
  const controller = readFileSync(join(SRC, 'browser', 'puppeteer-controller.ts'), 'utf8');

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
