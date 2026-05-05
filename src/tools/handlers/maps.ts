/**
 * Map tool handlers — four action-dispatched tools (was 23 thin wrappers,
 * per the v1.5.4 critical-review consolidation).
 *
 *   pinepaper_map           — load + viewport control
 *   pinepaper_map_regions   — highlight / select / color / label / marker
 *   pinepaper_map_animation — animate regions / wave / stop
 *   pinepaper_map_data      — CSV + GeoJSON import/export, source info
 *
 * Splitting along these seams (instead of collapsing all 23 into one
 * tool) keeps each action-enum small enough that the LLM can pick
 * confidently, while still trimming 19 entries from the tool listing.
 * Each handler parses its Zod schema, dispatches to codeGenerator.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { errorResult, executeOrGenerate, type HandlerOptions } from '../handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import {
  LoadMapInputSchema,
  HighlightRegionsInputSchema,
  UnhighlightRegionsInputSchema,
  ApplyDataColorsInputSchema,
  AddMarkerInputSchema,
  AddMapLabelsInputSchema,
  PanMapInputSchema,
  ZoomMapInputSchema,
  ImportCustomMapInputSchema,
  GetRegionAtPointInputSchema,
  AnimateMapRegionsInputSchema,
  AnimateMapWaveInputSchema,
  StopMapAnimationsInputSchema,
  ExportMapRegionCSVInputSchema,
  ImportMapRegionCSVInputSchema,
  SelectMapRegionsInputSchema,
  DeselectMapRegionsInputSchema,
  ErrorCodes,
} from '../../types/schemas.js';

export type MapHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

// ---------------------------------------------------------------------------
// pinepaper_map — load + viewport control
// ---------------------------------------------------------------------------

async function dispatchMap(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'load': {
      const input = LoadMapInputSchema.parse(args);
      const code = codeGenerator.generateLoadMap(input);
      return executeOrGenerate(code, `Loads ${input.mapId} map with ${input.projection || 'default'} projection`, options, 'pinepaper_map');
    }
    case 'pan': {
      const input = PanMapInputSchema.parse(args);
      const code = codeGenerator.generatePanMap(input);
      return executeOrGenerate(code, `Pans map to [${input.lat}, ${input.lon}]`, options, 'pinepaper_map');
    }
    case 'zoom': {
      const input = ZoomMapInputSchema.parse(args);
      const code = codeGenerator.generateZoomMap(input);
      return executeOrGenerate(code, `Sets map zoom level to ${input.level}`, options, 'pinepaper_map');
    }
    case 'export_config': {
      const code = codeGenerator.generateExportMap();
      return executeOrGenerate(code, 'Exports map configuration', options, 'pinepaper_map');
    }
    case 'import_custom': {
      const input = ImportCustomMapInputSchema.parse(args);
      const code = codeGenerator.generateImportCustomMap(input);
      return executeOrGenerate(code, input.url ? 'Imports custom map from URL' : 'Imports custom GeoJSON map', options, 'pinepaper_map');
    }
    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown pinepaper_map action "${action}". Valid: load, pan, zoom, export_config, import_custom.`,
      );
  }
}

// ---------------------------------------------------------------------------
// pinepaper_map_regions — region styling + selection
// ---------------------------------------------------------------------------

async function dispatchMapRegions(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'highlight': {
      const input = HighlightRegionsInputSchema.parse(args);
      const code = codeGenerator.generateHighlightRegions(input);
      return executeOrGenerate(code, `Highlights ${input.regionIds.length} region(s) on the map`, options, 'pinepaper_map_regions');
    }
    case 'unhighlight': {
      const input = UnhighlightRegionsInputSchema.parse(args);
      const code = codeGenerator.generateUnhighlightRegions(input);
      return executeOrGenerate(code, 'Removes region highlights', options, 'pinepaper_map_regions');
    }
    case 'apply_colors': {
      const input = ApplyDataColorsInputSchema.parse(args);
      const code = codeGenerator.generateApplyDataColors(input);
      const regionCount = Object.keys(input.data).length;
      return executeOrGenerate(code, `Applies choropleth coloring to ${regionCount} region(s)`, options, 'pinepaper_map_regions');
    }
    case 'add_marker': {
      const input = AddMarkerInputSchema.parse(args);
      const code = codeGenerator.generateAddMarker(input);
      return executeOrGenerate(code, `Adds marker at [${input.lat}, ${input.lon}]${input.label ? `: ${input.label}` : ''}`, options, 'pinepaper_map_regions');
    }
    case 'add_labels': {
      const input = AddMapLabelsInputSchema.parse(args);
      const code = codeGenerator.generateAddMapLabels(input);
      return executeOrGenerate(code, 'Adds labels to map regions', options, 'pinepaper_map_regions');
    }
    case 'get_at_point': {
      const input = GetRegionAtPointInputSchema.parse(args);
      const code = codeGenerator.generateGetRegionAtPoint(input);
      return executeOrGenerate(code, `Gets region at point [${input.x}, ${input.y}]`, options, 'pinepaper_map_regions');
    }
    case 'select': {
      const input = SelectMapRegionsInputSchema.parse(args);
      const code = codeGenerator.generateSelectMapRegions(input);
      return executeOrGenerate(code, `Selects ${input.regionIds.length} map region(s)`, options, 'pinepaper_map_regions');
    }
    case 'deselect': {
      const input = DeselectMapRegionsInputSchema.parse(args);
      const code = codeGenerator.generateDeselectMapRegions(input);
      return executeOrGenerate(code, 'Deselects map regions', options, 'pinepaper_map_regions');
    }
    case 'get_highlighted': {
      const code = codeGenerator.generateGetHighlightedMapRegions();
      return executeOrGenerate(code, 'Gets list of highlighted map regions', options, 'pinepaper_map_regions');
    }
    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown pinepaper_map_regions action "${action}". Valid: highlight, unhighlight, apply_colors, add_marker, add_labels, get_at_point, select, deselect, get_highlighted.`,
      );
  }
}

// ---------------------------------------------------------------------------
// pinepaper_map_animation — region animations
// ---------------------------------------------------------------------------

async function dispatchMapAnimation(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'animate_regions': {
      const input = AnimateMapRegionsInputSchema.parse(args);
      const code = codeGenerator.generateAnimateMapRegions(input);
      const regionCount = Object.keys(input.regions).length;
      return executeOrGenerate(code, `Animates ${regionCount} map region(s) over ${input.duration || 5}s`, options, 'pinepaper_map_animation');
    }
    case 'animate_wave': {
      const input = AnimateMapWaveInputSchema.parse(args);
      const code = codeGenerator.generateAnimateMapWave(input);
      return executeOrGenerate(code, `Creates ${input.waveDirection || 'horizontal'} wave animation`, options, 'pinepaper_map_animation');
    }
    case 'stop': {
      const input = StopMapAnimationsInputSchema.parse(args);
      const code = codeGenerator.generateStopMapAnimations(input);
      return executeOrGenerate(code, 'Stops map region animations', options, 'pinepaper_map_animation');
    }
    case 'get_animated': {
      const code = codeGenerator.generateGetAnimatedMapRegions();
      return executeOrGenerate(code, 'Gets list of animated map regions', options, 'pinepaper_map_animation');
    }
    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown pinepaper_map_animation action "${action}". Valid: animate_regions, animate_wave, stop, get_animated.`,
      );
  }
}

// ---------------------------------------------------------------------------
// pinepaper_map_data — CSV / GeoJSON import-export + source info
// ---------------------------------------------------------------------------

async function dispatchMapData(args: Record<string, unknown>, options: HandlerOptions): Promise<CallToolResult> {
  const action = args.action as string;
  switch (action) {
    case 'export_csv': {
      const input = ExportMapRegionCSVInputSchema.parse(args);
      const code = codeGenerator.generateExportMapRegionCSV(input);
      return executeOrGenerate(code, 'Exports map region data as CSV', options, 'pinepaper_map_data');
    }
    case 'import_csv': {
      const input = ImportMapRegionCSVInputSchema.parse(args);
      const code = codeGenerator.generateImportMapRegionCSV(input);
      return executeOrGenerate(code, 'Imports CSV data to update map regions', options, 'pinepaper_map_data');
    }
    case 'export_geojson': {
      const code = codeGenerator.generateExportMapGeoJson({
        includeStyles: args.includeStyles as boolean | undefined,
        includeMetadata: args.includeMetadata as boolean | undefined,
        selectedOnly: args.selectedOnly as boolean | undefined,
        download: args.download as boolean | undefined,
        filename: args.filename as string | undefined,
      });
      return executeOrGenerate(code, 'Exports map as GeoJSON', options, 'pinepaper_map_data');
    }
    case 'export_original_geojson': {
      const code = codeGenerator.generateExportOriginalMapGeoJson({
        download: args.download as boolean | undefined,
        filename: args.filename as string | undefined,
      });
      return executeOrGenerate(code, 'Exports original map GeoJSON', options, 'pinepaper_map_data');
    }
    case 'source_info': {
      const code = codeGenerator.generateGetMapSourceInfo();
      return executeOrGenerate(code, 'Gets map source information', options, 'pinepaper_map_data');
    }
    default:
      return errorResult(
        ErrorCodes.INVALID_INPUT,
        `Unknown pinepaper_map_data action "${action}". Valid: export_csv, import_csv, export_geojson, export_original_geojson, source_info.`,
      );
  }
}

export const mapHandlers: Record<string, MapHandler> = {
  pinepaper_map: dispatchMap,
  pinepaper_map_regions: dispatchMapRegions,
  pinepaper_map_animation: dispatchMapAnimation,
  pinepaper_map_data: dispatchMapData,
};
