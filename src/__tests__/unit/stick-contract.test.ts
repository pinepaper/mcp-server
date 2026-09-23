/**
 * The stick tool spread its whole input at the engine and agreed with it about
 * almost nothing.
 *
 * `generateStick` does `const { action, ...rest }` and passes everything to
 * app.stickFigure. That made every field look CONSUMED — a spread is a read,
 * and schema-fields-are-consumed says so correctly — while four of them meant
 * something the engine does not:
 *
 *   propSide   schema 'left' | 'right'      engine compares against 'L' | 'R'
 *   expressions  [{at, name}]               engine filters on b.expression
 *   walk       true | {…}                   engine iterates it as an array
 *   travel     {…}                          engine needs an array of >= 2
 *
 * None of them threw. The prop went to the left hand whichever side you asked
 * for, the expression beats were filtered out to the last one, and `walk: true`
 * — the form the schema itself called "the default" — walked nowhere. A guard
 * that asks "is this name read" cannot see any of it, which is why these are
 * pinned by behaviour instead.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { StickInputSchema } from '../../types/schemas.js';


/** The opts object literal the emitter hands to app.stickFigure / app.stickSet. */
function emittedOpts(input: unknown): Record<string, unknown> {
  const code = codeGenerator.generateStick(StickInputSchema.parse(input));
  const m = /app\.stick(?:Figure|Set)\((\{[\s\S]*?\})\);/.exec(code);
  if (!m) throw new Error(`no engine call in:\n${code}`);
  return JSON.parse(m[1]) as Record<string, unknown>;
}

describe('the stick tool speaks the engine contract', () => {
  it('normalises propSide to the L/R the engine tests against', () => {
    // `str(opts.propSide, 'L').toUpperCase() === 'R' ? 'R' : 'L'` — 'RIGHT'
    // equals neither, so the long spelling silently meant left.
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'right' }).propSide).toBe('R');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'left' }).propSide).toBe('L');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'R' }).propSide).toBe('R');
    expect(emittedOpts({ action: 'figure', prop: 'cup', propSide: 'L' }).propSide).toBe('L');
  });

  it('turns walk: true into a cycle the engine will iterate', () => {
    expect(emittedOpts({ action: 'figure', walk: true }).walk).toEqual([{ seconds: 1.2, from: 0 }]);
  });

  it('drops walk: false rather than sending a value the engine cannot read', () => {
    expect(emittedOpts({ action: 'figure', walk: false })).not.toHaveProperty('walk');
  });

  it('passes an explicit walk array through untouched', () => {
    const walk = [{ seconds: 2, from: 0 }, { seconds: 2, from: 4 }];
    expect(emittedOpts({ action: 'figure', walk }).walk).toEqual(walk);
  });

  it('refuses facing on a figure by name instead of dropping it', () => {
    const code = codeGenerator.generateStick(StickInputSchema.parse({ action: 'figure', facing: 'left' }));
    expect(code).not.toContain('await app.stickFigure(');
    expect(code).toContain('success: false');
    expect(code).toContain('never reads it');
    // The message names quoted values; emitting it unescaped was a syntax error.
    expect(() => new Function(`return ${code}`)).not.toThrow();
  });

  it('still takes facing on a set, where a chair reads it', () => {
    expect(emittedOpts({ action: 'set', kind: 'chair', facing: 'left' }).facing).toBe('left');
  });
});

describe('the stick schema types match what the engine coerces', () => {
  it('names expression beats the way the engine filters them', () => {
    // `opts.expressions.filter(b => EXPRESSIONS[b.expression])` — a beat keyed
    // `name` filtered to nothing, so expressions-over-time did nothing at all.
    const beats = [{ at: 0, expression: 'happy' }, { at: 2, expression: 'sad' }];
    expect(emittedOpts({ action: 'figure', expressions: beats }).expressions).toEqual(beats);
    expect(() => StickInputSchema.parse({ action: 'figure', expressions: [{ at: 0, name: 'happy' }] })).toThrow();
  });

  it('requires travel to be two or more waypoints', () => {
    // `Array.isArray(opts.travel) && opts.travel.length >= 2` — an object, or
    // a single point, was accepted by the schema and ignored by the engine.
    const travel = [{ t: 0, x: 0, y: 0 }, { t: 3, x: 400, y: 0 }];
    expect(emittedOpts({ action: 'figure', travel }).travel).toEqual(travel);
    expect(() => StickInputSchema.parse({ action: 'figure', travel: [{ t: 0, x: 0, y: 0 }] })).toThrow();
    expect(() => StickInputSchema.parse({ action: 'figure', travel: { to: 'right' } })).toThrow();
  });

  it('types the set fields as the engine reads them', () => {
    // items is num(opts.items, 3), object/floor/wall are str(...) — every one
    // of these was declared as a boolean or a spec object, so every one was
    // coerced away to nothing.
    expect(emittedOpts({ action: 'set', kind: 'shelf', items: 5 }).items).toBe(5);
    expect(emittedOpts({ action: 'set', kind: 'tabletop', object: 'cup' }).object).toBe('cup');
    expect(emittedOpts({ action: 'set', kind: 'room', floor: '#333', wall: '#eee' })).toMatchObject({
      floor: '#333',
      wall: '#eee',
    });
    expect(() => StickInputSchema.parse({ action: 'set', kind: 'room', floor: true })).toThrow();
    expect(() => StickInputSchema.parse({ action: 'set', kind: 'shelf', items: [{ a: 1 }] })).toThrow();
  });
});

/**
 * load_map and loadMap() shared almost no vocabulary.
 *
 * loadMap(source, options) destructures projection, center, scale, rotate,
 * fitBounds, parent, styles, style, interactive, selectable, showOcean,
 * oceanColor, quality, smoothPaths, simplifyTolerance. Seven of this tool's
 * twelve options were none of those — the style keys nest under `styles` and
 * are spelled differently there, the interactivity flags have other names —
 * so all seven were accepted, stringified into the call, and dropped.
 */
describe('load_map speaks the engine vocabulary', () => {
  const optsOf = (input: unknown): Record<string, unknown> => {
    const code = codeGenerator.generateLoadMap(input as never);
    const m = /loadMap\('[^']*',\s*(\{[\s\S]*?\})\)/.exec(code);
    if (!m) throw new Error(`no loadMap call in:\n${code}`);
    return JSON.parse(m[1]) as Record<string, unknown>;
  };

  it('nests the style keys under styles, spelled as the presets spell them', () => {
    expect(optsOf({ mapId: 'world', fillColor: '#eee', strokeColor: '#333', strokeWidth: 2, hoverFill: '#00f' }))
      .toMatchObject({ styles: { fill: '#eee', stroke: '#333', strokeWidth: 2, hoverFill: '#00f' } });
  });

  it('does not leave the flat spellings where the engine will ignore them', () => {
    const opts = optsOf({ mapId: 'world', fillColor: '#eee', strokeColor: '#333' });
    expect(opts).not.toHaveProperty('fillColor');
    expect(opts).not.toHaveProperty('strokeColor');
  });

  it('renames the interactivity flags to what loadMap destructures', () => {
    expect(optsOf({ mapId: 'world', enableHover: false, enableClick: false }))
      .toMatchObject({ interactive: false, selectable: false });
  });

  it('passes the options the engine really does destructure straight through', () => {
    expect(optsOf({ mapId: 'world', projection: 'mercator', quality: 'professional' }))
      .toMatchObject({ projection: 'mercator', quality: 'professional' });
  });

  it('sends no styles key when no styling was asked for', () => {
    expect(optsOf({ mapId: 'world', projection: 'mercator' })).not.toHaveProperty('styles');
  });

  it('puts hoverStroke where mergedStyles reads it, beside hoverFill', () => {
    // It was documented in two MCP specs long before any source file read it.
    // Now that _resolveRegionStyle takes it, it is a styles key like any
    // other — mapped rather than stripped, so it starts working on a studio
    // that has it without a change here.
    expect(optsOf({ mapId: 'world', hoverStroke: '#f00', hoverFill: '#00f' }))
      .toMatchObject({ styles: { hoverStroke: '#f00', hoverFill: '#00f' } });
  });

  it('never leaves hoverStroke at the top level, where nothing reads it', () => {
    expect(optsOf({ mapId: 'world', hoverStroke: '#f00' })).not.toHaveProperty('hoverStroke');
  });

  it('warns that an older studio will ignore hoverStroke', () => {
    // Silent degradation is the class this whole pass exists to remove, so a
    // caller on a studio without it learns why the outline did not move.
    const code = codeGenerator.generateLoadMap({ mapId: 'world', hoverStroke: '#f00' } as never);
    expect(code).toContain('conditional: ["hoverStroke"]');
    expect(code).toContain('recent enough to read it');
  });

  it('says nothing about hoverStroke when it was not passed', () => {
    const code = codeGenerator.generateLoadMap({ mapId: 'world' } as never);
    expect(code).not.toContain('conditional:');
    expect(code).not.toContain('hoverStroke');
  });
});

/**
 * anchor: the B1 fix, and the one parameter whose typo is invisible.
 *
 * (x, y) is the bounding-box CENTRE. Anything that computed a layout box
 * authored the TOP-LEFT, so passing those coordinates straight in displaces
 * every item by half its own size — which is what "design-system compose
 * mispositions everything" was. `anchor` states which corner was meant.
 *
 * The engine names an unknown anchor through console.warn and falls back to
 * the centre. Production strips console.warn, so over MCP that fallback is
 * silent and reproduces the exact displacement the option removes.
 */
describe('anchor is checked before it can be silently ignored', () => {
  const codeFor = (properties: Record<string, unknown>): string =>
    codeGenerator.generateCreateItem({
      itemType: 'rectangle', position: { x: 10, y: 20 }, properties,
    } as never);

  it('passes the anchors the engine implements', () => {
    for (const a of ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']) {
      const code = codeFor({ anchor: a, width: 100, height: 50 });
      expect(code).toContain('app.create(');
      expect(code).toContain(`"anchor": "${a}"`);
    }
  });

  it('normalises spacing and case the way the engine does', () => {
    expect(codeFor({ anchor: 'Top_Left' })).toContain('"anchor": "top-left"');
    expect(codeFor({ anchor: 'TOP LEFT' })).toContain('"anchor": "top-left"');
  });

  it('refuses an unknown anchor instead of letting it fall back to centre', () => {
    const code = codeFor({ anchor: 'topleft' });
    expect(code).not.toContain('app.create(');
    expect(code).toContain('success: false');
    expect(code).toContain('half its own size away');
  });

  it('treats origin as the alias the engine treats it as', () => {
    expect(codeFor({ origin: 'top-left' })).toContain('"origin": "top-left"');
    expect(codeFor({ origin: 'nonsense' })).toContain('success: false');
  });

  it('says nothing about anchors when none was given', () => {
    const code = codeFor({ width: 100, height: 50 });
    expect(code).toContain('app.create(');
    expect(code).not.toContain('anchor');
  });
});
