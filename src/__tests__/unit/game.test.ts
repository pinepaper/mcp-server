/**
 * pinepaper_game — pathfinding + tilemaps over the PinePaper.findPath /
 * createTilemap facades. Pure computation: the tool's value is the GLUE
 * documented in its results (path → moves_along_path, collisionRects →
 * physics), so the tests pin that the emitted code surfaces the right shapes.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { GameInputSchema } from '../../types/schemas.js';

describe('GameInputSchema validation', () => {
  it('pathfind requires grid + start + goal', () => {
    expect(GameInputSchema.safeParse({ action: 'pathfind' }).success).toBe(false);
    expect(GameInputSchema.safeParse({ action: 'pathfind', grid: { cols: 10, rows: 10 }, start: { x: 0, y: 0 } }).success).toBe(false);
    expect(GameInputSchema.safeParse({ action: 'pathfind', grid: { cols: 10, rows: 10 }, start: { x: 0, y: 0 }, goal: { x: 5, y: 5 } }).success).toBe(true);
  });

  it('create_tilemap requires cols + rows and caps the board', () => {
    expect(GameInputSchema.safeParse({ action: 'create_tilemap', cols: 10 }).success).toBe(false);
    expect(GameInputSchema.safeParse({ action: 'create_tilemap', cols: 10, rows: 10 }).success).toBe(true);
    expect(GameInputSchema.safeParse({ action: 'create_tilemap', cols: 10000, rows: 10 }).success).toBe(false);
  });

  it('obstacles are world rects on the grid object', () => {
    expect(GameInputSchema.safeParse({
      action: 'pathfind',
      grid: { cols: 10, rows: 10, cellSize: 32, obstacles: [{ x: 100, y: 0, width: 32, height: 200 }] },
      start: { x: 10, y: 10 }, goal: { x: 300, y: 10 },
    }).success).toBe(true);
  });
});

describe('generateGame codegen', () => {
  it('pathfind awaits the facade and forwards the board verbatim', () => {
    const c = codeGenerator.generateGame(GameInputSchema.parse({
      action: 'pathfind',
      grid: { cols: 10, rows: 10, cellSize: 32, obstacles: [{ x: 100, y: 0, width: 32, height: 200 }] },
      start: { x: 10, y: 10 }, goal: { x: 300, y: 10 }, diagonal: false,
    }));
    expect(c).toContain('await app.findPath(');
    expect(c).toContain('"obstacles":[{"x":100');
    expect(c).toContain('"diagonal":false');
    expect(c).toContain('moves_along_path'); // the glue comment survives into the emitted code
    expect(() => new Function(c)).not.toThrow();
  });

  it('create_tilemap forwards tileset/fills with the REAL spec keys', () => {
    // tileSize + tileset-as-array are the module's actual contract — cellSize /
    // tiles-as-map were plausible wrong guesses that silently produced a board
    // with nothing solid (defaults swallowed them). Pin the right keys.
    const c = codeGenerator.generateGame(GameInputSchema.parse({
      action: 'create_tilemap', cols: 20, rows: 15, tileSize: 32,
      tileset: [{ id: 1, solid: true, fill: '#333' }],
      fills: [{ x0: 0, y0: 14, x1: 19, y1: 14, tileId: 1 }],
    }));
    expect(c).toContain('await app.createTilemap(');
    expect(c).toContain('"tileSize":32');
    expect(c).toContain('"tileset":[{"id":1,"solid":true');
    expect(c).toContain('"fills":[{"x0":0');
    expect(c).not.toContain('cellSize');
    expect(c).toContain('rectCount'); // merged-rect count surfaces in the result
  });

  it('both actions guard on facade absence with an update-FxTool message', () => {
    for (const input of [
      { action: 'pathfind' as const, grid: { cols: 2, rows: 2 }, start: { x: 0, y: 0 }, goal: { x: 1, y: 1 } },
      { action: 'create_tilemap' as const, cols: 2, rows: 2 },
    ]) {
      const c = codeGenerator.generateGame(GameInputSchema.parse(input));
      expect(c).toContain('unavailable — update FxTool');
      expect(() => new Function(c)).not.toThrow();
    }
  });
});
