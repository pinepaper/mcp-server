/**
 * Map tool handlers — extracted from src/tools/handlers.ts.
 *
 * 22 tools spanning load + region styling + markers + labels + pan/zoom +
 * import/export + animation + CSV. Each handler parses its Zod schema,
 * dispatches to codeGenerator.generate*, and emits via executeOrGenerate.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { executeOrGenerate, type HandlerOptions } from '../handlers.js';
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
} from '../../types/schemas.js';

export type MapHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const mapHandlers: Record<string, MapHandler> = {
  pinepaper_load_map: async (args, options) => {
    const input = LoadMapInputSchema.parse(args);
    const code = codeGenerator.generateLoadMap(input);
    const description = `Loads ${input.mapId} map with ${input.projection || 'default'} projection`;
    return executeOrGenerate(code, description, options, 'pinepaper_load_map');
  },

  pinepaper_highlight_regions: async (args, options) => {
    const input = HighlightRegionsInputSchema.parse(args);
    const code = codeGenerator.generateHighlightRegions(input);
    const description = `Highlights ${input.regionIds.length} region(s) on the map`;
    return executeOrGenerate(code, description, options, 'pinepaper_highlight_regions');
  },

  pinepaper_unhighlight_regions: async (args, options) => {
    const input = UnhighlightRegionsInputSchema.parse(args);
    const code = codeGenerator.generateUnhighlightRegions(input);
    return executeOrGenerate(code, 'Removes region highlights', options, 'pinepaper_unhighlight_regions');
  },

  pinepaper_apply_data_colors: async (args, options) => {
    const input = ApplyDataColorsInputSchema.parse(args);
    const code = codeGenerator.generateApplyDataColors(input);
    const regionCount = Object.keys(input.data).length;
    const description = `Applies choropleth coloring to ${regionCount} region(s)`;
    return executeOrGenerate(code, description, options, 'pinepaper_apply_data_colors');
  },

  pinepaper_add_marker: async (args, options) => {
    const input = AddMarkerInputSchema.parse(args);
    const code = codeGenerator.generateAddMarker(input);
    const description = `Adds marker at [${input.lat}, ${input.lon}]${input.label ? `: ${input.label}` : ''}`;
    return executeOrGenerate(code, description, options, 'pinepaper_add_marker');
  },

  pinepaper_add_map_labels: async (args, options) => {
    const input = AddMapLabelsInputSchema.parse(args);
    const code = codeGenerator.generateAddMapLabels(input);
    return executeOrGenerate(code, 'Adds labels to map regions', options, 'pinepaper_add_map_labels');
  },

  pinepaper_pan_map: async (args, options) => {
    const input = PanMapInputSchema.parse(args);
    const code = codeGenerator.generatePanMap(input);
    const description = `Pans map to [${input.lat}, ${input.lon}]`;
    return executeOrGenerate(code, description, options, 'pinepaper_pan_map');
  },

  pinepaper_zoom_map: async (args, options) => {
    const input = ZoomMapInputSchema.parse(args);
    const code = codeGenerator.generateZoomMap(input);
    const description = `Sets map zoom level to ${input.level}`;
    return executeOrGenerate(code, description, options, 'pinepaper_zoom_map');
  },

  pinepaper_export_map: async (_args, options) => {
    const code = codeGenerator.generateExportMap();
    return executeOrGenerate(code, 'Exports map configuration', options, 'pinepaper_export_map');
  },

  pinepaper_import_custom_map: async (args, options) => {
    const input = ImportCustomMapInputSchema.parse(args);
    const code = codeGenerator.generateImportCustomMap(input);
    const description = input.url ? `Imports custom map from URL` : 'Imports custom GeoJSON map';
    return executeOrGenerate(code, description, options, 'pinepaper_import_custom_map');
  },

  pinepaper_get_region_at_point: async (args, options) => {
    const input = GetRegionAtPointInputSchema.parse(args);
    const code = codeGenerator.generateGetRegionAtPoint(input);
    const description = `Gets region at point [${input.x}, ${input.y}]`;
    return executeOrGenerate(code, description, options, 'pinepaper_get_region_at_point');
  },

  pinepaper_animate_map_regions: async (args, options) => {
    const input = AnimateMapRegionsInputSchema.parse(args);
    const code = codeGenerator.generateAnimateMapRegions(input);
    const regionCount = Object.keys(input.regions).length;
    const description = `Animates ${regionCount} map region(s) over ${input.duration || 5}s`;
    return executeOrGenerate(code, description, options, 'pinepaper_animate_map_regions');
  },

  pinepaper_animate_map_wave: async (args, options) => {
    const input = AnimateMapWaveInputSchema.parse(args);
    const code = codeGenerator.generateAnimateMapWave(input);
    const description = `Creates ${input.waveDirection || 'horizontal'} wave animation`;
    return executeOrGenerate(code, description, options, 'pinepaper_animate_map_wave');
  },

  pinepaper_stop_map_animations: async (args, options) => {
    const input = StopMapAnimationsInputSchema.parse(args);
    const code = codeGenerator.generateStopMapAnimations(input);
    return executeOrGenerate(code, 'Stops map region animations', options, 'pinepaper_stop_map_animations');
  },

  pinepaper_get_animated_map_regions: async (_args, options) => {
    const code = codeGenerator.generateGetAnimatedMapRegions();
    return executeOrGenerate(code, 'Gets list of animated map regions', options, 'pinepaper_get_animated_map_regions');
  },

  pinepaper_export_map_region_csv: async (args, options) => {
    const input = ExportMapRegionCSVInputSchema.parse(args);
    const code = codeGenerator.generateExportMapRegionCSV(input);
    return executeOrGenerate(code, 'Exports map region data as CSV', options, 'pinepaper_export_map_region_csv');
  },

  pinepaper_import_map_region_csv: async (args, options) => {
    const input = ImportMapRegionCSVInputSchema.parse(args);
    const code = codeGenerator.generateImportMapRegionCSV(input);
    return executeOrGenerate(code, 'Imports CSV data to update map regions', options, 'pinepaper_import_map_region_csv');
  },

  pinepaper_select_map_regions: async (args, options) => {
    const input = SelectMapRegionsInputSchema.parse(args);
    const code = codeGenerator.generateSelectMapRegions(input);
    const description = `Selects ${input.regionIds.length} map region(s)`;
    return executeOrGenerate(code, description, options, 'pinepaper_select_map_regions');
  },

  pinepaper_deselect_map_regions: async (args, options) => {
    const input = DeselectMapRegionsInputSchema.parse(args);
    const code = codeGenerator.generateDeselectMapRegions(input);
    return executeOrGenerate(code, 'Deselects map regions', options, 'pinepaper_deselect_map_regions');
  },

  pinepaper_get_highlighted_map_regions: async (_args, options) => {
    const code = codeGenerator.generateGetHighlightedMapRegions();
    return executeOrGenerate(code, 'Gets list of highlighted map regions', options, 'pinepaper_get_highlighted_map_regions');
  },

  pinepaper_export_map_geojson: async (args, options) => {
    const code = codeGenerator.generateExportMapGeoJson({
      includeStyles: args.includeStyles as boolean | undefined,
      includeMetadata: args.includeMetadata as boolean | undefined,
      selectedOnly: args.selectedOnly as boolean | undefined,
      download: args.download as boolean | undefined,
      filename: args.filename as string | undefined,
    });
    return executeOrGenerate(code, 'Exports map as GeoJSON', options, 'pinepaper_export_map_geojson');
  },

  pinepaper_export_original_map_geojson: async (args, options) => {
    const code = codeGenerator.generateExportOriginalMapGeoJson({
      download: args.download as boolean | undefined,
      filename: args.filename as string | undefined,
    });
    return executeOrGenerate(code, 'Exports original map GeoJSON', options, 'pinepaper_export_original_map_geojson');
  },

  pinepaper_get_map_source_info: async (_args, options) => {
    const code = codeGenerator.generateGetMapSourceInfo();
    return executeOrGenerate(code, 'Gets map source information', options, 'pinepaper_get_map_source_info');
  },
};
