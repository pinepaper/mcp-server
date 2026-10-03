/**
 * Map region tools report what the engine did, not what was asked (gate D51).
 *
 * The fake below copies MapSystem's contract as FxTool ships it: highlight and
 * applyDataColors write ONE override channel keyed on feature._mapId, resolve
 * ids exactly then lower-case, and skip an unknown id with a console.warn that
 * production strips. A rasterised map has no regionPaths, so
 * getHighlightedRegions — an ARRAY of {regionId, name, path} — sees nothing.
 * addMarker takes (longitude, latitude, options) and returns null off-map.
 */

import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

function fakeMap() {
  const features = [
    { _mapId: 'FRA', _mapName: 'France' },
    { _mapId: 'DEU', _mapName: 'Germany' },
    { _mapId: 'JPN', _mapName: 'Japan' },
  ];
  const regionNameMappings = new Map<unknown, typeof features[0]>();
  for (const f of features) { regionNameMappings.set(f._mapId, f); regionNameMappings.set(f._mapName.toLowerCase(), f); }
  const overrides = new Map<unknown, { fill?: string }>();
  const resolve = (id: unknown) => regionNameMappings.get(id) || regionNameMappings.get(String(id).toLowerCase());
  return {
    regionNameMappings,
    regionPaths: new Map(),
    highlightRegions(ids: string[], style: { fill?: string } = {}) {
      for (const id of ids) { const f = resolve(id); if (f) overrides.set(f._mapId, { fill: style.fill || '#3b82f6' }); }
    },
    applyDataColors(data: Record<string, number>) {
      for (const k of Object.keys(data)) { const f = resolve(k); if (f) overrides.set(f._mapId, { fill: '#08519c' }); }
    },
    getRegionOverride: (id: unknown) => overrides.get(id) || null,
    getHighlightedRegions: () => [] as unknown[],
    canvasToGeo: (xy: unknown) => (Array.isArray(xy) ? [2.35, 48.85] : null),
    _findFeatureAtCanvasPoint: (x: number) => (x < 100 ? features[0] : null),
    addMarker(lon: unknown, lat: unknown) {
      if (typeof lon !== 'number' || typeof lat !== 'number') return null;
      return { id: 42, position: { x: 10, y: 20 } };
    },
  };
}

function run(code: string, mapSystem = fakeMap()) {
  // Emitted code opens with a // comment line; `return` would stop at it.
  const body = code.replace(/^(\s*\/\/.*\n)+/, '');
  return new Function('app', `return ${body}`)({ mapSystem }) as Record<string, any>;
}

describe('map region readback (D51)', () => {
  it('highlight reports the resolved regions and their colour', () => {
    const r = run(codeGenerator.generateHighlightRegions({ regionIds: ['France', 'DEU'], options: { color: '#ff0000' } } as never));
    expect(r.success).toBe(true);
    expect(r.highlighted.map((h: any) => h.regionId)).toEqual(['FRA', 'DEU']);
    expect(r.highlighted[0].fill).toBe('#ff0000');
  });

  it('highlight of an unknown id fails by name and lists real ids', () => {
    const r = run(codeGenerator.generateHighlightRegions({ regionIds: ['Atlantis'] } as never));
    expect(r.success).toBe(false);
    expect(r.notFound).toEqual(['Atlantis']);
    expect(r.error).toContain('FRA (France)');
  });

  it('highlight with some unknown ids succeeds for the rest and names the misses', () => {
    const r = run(codeGenerator.generateHighlightRegions({ regionIds: ['Japan', 'Atlantis'] } as never));
    expect(r.success).toBe(true);
    expect(r.notFound).toEqual(['Atlantis']);
  });

  it('apply_colors reports unmatched keys instead of counting them as coloured', () => {
    const r = run(codeGenerator.generateApplyDataColors({ data: { France: 1, Narnia: 2 } } as never));
    expect(r.success).toBe(true);
    expect(r.regionsColored).toBe(1);
    expect(r.unmatched).toEqual(['Narnia']);
  });

  it('apply_colors with no matching key fails', () => {
    const r = run(codeGenerator.generateApplyDataColors({ data: { Narnia: 2 } } as never));
    expect(r.success).toBe(false);
  });

  it('get_highlighted lists what highlight and apply_colors coloured on a raster map', () => {
    const ms = fakeMap();
    run(codeGenerator.generateHighlightRegions({ regionIds: ['France'] } as never), ms);
    run(codeGenerator.generateApplyDataColors({ data: { Japan: 3 } } as never), ms);
    const r = run(codeGenerator.generateGetHighlightedMapRegions(), ms);
    expect(r.highlighted.map((h: any) => h.regionId).sort()).toEqual(['FRA', 'JPN']);
    expect(r.count).toBe(2);
  });

  it('get_at_point hit-tests to a region id', () => {
    const r = run(codeGenerator.generateGetRegionAtPoint({ x: 50, y: 50 } as never));
    expect(r).toMatchObject({ success: true, regionId: 'FRA', regionName: 'France', coordinate: [2.35, 48.85] });
    expect(run(codeGenerator.generateGetRegionAtPoint({ x: 500, y: 50 } as never)).regionId).toBeNull();
  });

  it('add_marker passes (lon, lat) and fails when the engine adds nothing', () => {
    const ok = run(codeGenerator.generateAddMarker({ lat: 48.85, lon: 2.35 } as never));
    expect(ok).toMatchObject({ success: true, markerId: 42 });
    const ms = fakeMap();
    ms.addMarker = () => null;
    expect(run(codeGenerator.generateAddMarker({ lat: 0, lon: 0 } as never), ms).success).toBe(false);
  });
});
