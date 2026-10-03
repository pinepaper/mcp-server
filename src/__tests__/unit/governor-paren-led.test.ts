/**
 * The governor (app.runGenerated) keeps only the value of a `(`-led snippet;
 * anything else runs and comes back undefined. Eighteen camera and font
 * emitters were bare expressions (`app.camera.getState()`) and so reported
 * nothing (1.6.19 gate). Every action here must emit a `(`-led snippet.
 * (font show_studio is a refusal, so it emits nothing.)
 */

import { describe, it, expect } from 'bun:test';
import { handleToolCall } from '../../tools/handlers.js';

const CASES: Array<[string, Record<string, unknown>]> = [
  ['pinepaper_camera', { action: 'zoom', direction: 'in', level: 2 }],
  ['pinepaper_camera', { action: 'pan', direction: 'left' }],
  ['pinepaper_camera', { action: 'move_to', x: 10, y: 20, zoom: 1 }],
  ['pinepaper_camera', { action: 'reset' }],
  ['pinepaper_camera', { action: 'stop' }],
  ['pinepaper_camera', { action: 'state' }],
  ['pinepaper_camera', { action: 'fit_view' }],
  ['pinepaper_font', { action: 'check', fontFamily: 'Inter' }],
  ['pinepaper_font', { action: 'load', fontFamily: 'Inter' }],
  ['pinepaper_font', { action: 'list_available' }],
  ['pinepaper_font', { action: 'set_name', name: 'Mine' }],
  ['pinepaper_font', { action: 'get_required_chars' }],
  ['pinepaper_font', { action: 'get_status' }],
];

function emitted(r: Awaited<ReturnType<typeof handleToolCall>>): string {
  return String((r._meta as Record<string, unknown> | undefined)?.['pinepaper.studio/code'] ?? '');
}

describe('emitters are (-led for the governor', () => {
  for (const [tool, args] of CASES) {
    it(`${tool} ${args.action}`, async () => {
      const r = await handleToolCall(tool, args);
      expect(r.isError).toBeFalsy();
      const code = emitted(r).replace(/^(\s*\/\/[^\n]*\n)+/, '').trimStart();
      expect(code.length).toBeGreaterThan(0);
      expect(code[0]).toBe('(');
    });
  }
});
