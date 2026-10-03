/**
 * Every emitter changed in the 1.6.19 gate PARSES as JavaScript.
 *
 * Emitted code is a template literal, and an escape written for the page
 * (\( \s \') loses its backslash there. remove_behavior shipped a message
 * with "studio\'s" that reached the page as a broken string literal and
 * failed every call with "Unexpected identifier" (gate run 3). Only parsing
 * the EMITTED text sees it.
 */
import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';

const CASES: Array<[string, Record<string, unknown>]> = [
  ['pinepaper_interaction', { action: 'remove_behavior', itemId: 'a' }],
  ['pinepaper_interaction', { action: 'remove_behavior', itemId: 'a', behaviorId: 'repel_1' }],
  ['pinepaper_rigging', { action: 'bake_animation', skeletonId: 's' }],
  ['pinepaper_map_regions', { action: 'highlight', regionIds: ['France'] }],
  ['pinepaper_map', { action: 'load', mapId: 'world' }],
  ['pinepaper_map', { action: 'import_custom', geojson: { type: 'FeatureCollection', features: [] } }],
  ['pinepaper_map', { action: 'pan', lat: 1, lon: 1 }],
  ['pinepaper_instantiate_ontology', { doc: { nodes: [{ id: 'a', type: 'pp:Disk' }], edges: [] } }],
  ['pinepaper_compose', { action: 'apply', pattern: 'grid', itemIds: ['a'], reveal: 'stagger' }],
  ['pinepaper_path', { action: 'boolean', op: 'unite', itemIds: ['a', 'b'] }],
  ['pinepaper_text_style', { action: 'to_collage', itemId: 'a' }],
  ['pinepaper_styled_scene', { style: 'ink' }],
  ['pinepaper_agent_export', { format: 'mp4', framing: 'camera', scale: 0.5 }],
  ['pinepaper_update_connector', { connectorId: 'c', style: { lineColor: '#f00' }, label: "it's" }],
  ['pinepaper_measurement', { action: 'set_snap', enabled: true }],
  ['pinepaper_sound', { action: 'play_tone', note: 'A4' }],
  ['pinepaper_sound', { action: 'play_from_text', text: 'a bell', options: { gain: 0.5 } }],
  ['pinepaper_interchange', { action: 'import_lottie', data: { v: '5' } }],
  ['pinepaper_extract_object', { label: 'cat' }],
  ['pinepaper_background', { action: 'get' }],
  ['pinepaper_set_canvas_size', { preset: 'instagram-post' }],
  ['pinepaper_import_layered_character', { info: { parts: { eyel: { xyxy: [0, 0, 1, 1] } }, frame_size: [10, 10] }, images: { eyel: 'data:image/png;base64,AA' } }],
];

describe('emitted code parses', () => {
  for (const [tool, args] of CASES) {
    it(`${tool} ${String(args.action ?? '')}`, async () => {
      const r = await handleToolCall(tool, args);
      const code = String((r._meta as Record<string, unknown> | undefined)?.['pinepaper.studio/code'] ?? '');
      expect(code.length).toBeGreaterThan(0);
      expect(() => new Function(code)).not.toThrow();
    });
  }
});
