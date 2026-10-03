/**
 * cursive's pen reaches the engine (D31). cursiveOptions was a closed object,
 * so `nib` was stripped and a caller could not choose a monoline once the
 * engine made the broad nib its default. The engine reads nib as a boolean or
 * an object, so the words are translated: a string is truthy there, and
 * 'monoline' would have selected the broad nib.
 */
import { describe, it, expect } from 'bun:test';
import { cursiveEngineOptions } from '../../types/code-generator.js';
import { TextStyleInputSchema } from '../../types/schemas.js';
import { handleToolCall } from '../../tools/handlers.js';

const parse = (cursiveOptions: unknown) =>
  TextStyleInputSchema.parse({ action: 'cursive', text: 'The Ball', cursiveOptions }).cursiveOptions;

describe('cursive nib', () => {
  it("'monoline' and false reach the engine as false", () => {
    expect(cursiveEngineOptions(parse({ nib: 'monoline' }))).toEqual({ nib: false });
    expect(cursiveEngineOptions(parse({ nib: false }))).toEqual({ nib: false });
  });
  it("'broad' reaches it as true, and a tuning object as itself", () => {
    expect(cursiveEngineOptions(parse({ nib: 'broad' }))).toEqual({ nib: true });
    expect(cursiveEngineOptions(parse({ nib: { angle: 40, contrast: 0.9 } }))).toEqual({ nib: { angle: 40, contrast: 0.9 } });
  });
  it('no nib sends no nib, so the studio default applies', () => {
    expect(cursiveEngineOptions(parse({ scale: 2 }))).toEqual({ scale: 2 });
  });
  it('rejects a nib it would misread', () => {
    expect(() => parse({ nib: 'italic' })).toThrow();
    expect(() => parse({ nib: { thickness: 3 } })).toThrow();
  });
  it('the emitted call carries it', async () => {
    const r = await handleToolCall('pinepaper_text_style', { action: 'cursive', text: 'Hi', cursiveOptions: { nib: 'monoline' } }, { generateOnly: true } as never);
    const text = r.content.map((c: any) => c.text ?? '').join('');
    expect(text).toContain('"nib":false');
  });
  it('refuses cursive without text, by name', async () => {
    expect(() => TextStyleInputSchema.parse({ action: 'cursive', itemId: 'item_1' })).toThrow(/writes new text from `text`/);
    const r = await handleToolCall('pinepaper_text_style', { action: 'cursive', itemId: 'item_1' }, { generateOnly: true } as never);
    expect(r.isError).toBe(true);
    expect(r.content.map((c: any) => c.text ?? '').join('')).toContain('does not restyle an existing item');
  });
  it('passes the draw-on options to the engine (D41)', async () => {
    const opts = parse({ animate: true, duration: 2, easing: 'linear', timeOffset: 0.5, singleStroke: true, showGhost: true, tension: 0.4 });
    expect(cursiveEngineOptions(opts)).toEqual({ animate: true, duration: 2, easing: 'linear', timeOffset: 0.5, singleStroke: true, showGhost: true, tension: 0.4 });
    const r = await handleToolCall('pinepaper_text_style', { action: 'cursive', text: 'Hi', cursiveOptions: { animate: true, duration: 2 } }, { generateOnly: true } as never);
    expect(r.content.map((c: any) => c.text ?? '').join('')).toContain('"animate":true,"duration":2');
  });
  it('refuses an unknown cursiveOptions key instead of dropping it', () => {
    expect(() => parse({ animte: true })).toThrow();
    expect(() => parse({ easing: 'wobbly' })).toThrow();
  });
});
