/**
 * pinepaper_media analyze_reference / remake_from_reference (G4, FxTool #52).
 * "Make one like this": measure a reference video's FORMAT and build on it,
 * never its content. Verified live against pinepaper.studio on a generated
 * 3-shot clip (cuts at 2 s and 4 s): cuts [2, 4], three 2 s shots, colours
 * within a unit of the encoded ones, and a remake of three cards in those
 * colours with the caller's words.
 */

import { describe, it, expect } from 'bun:test';
import { MediaInputSchema } from '../../types/schemas.js';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator();
const emit = (input: Record<string, unknown>) => gen.generateMedia(MediaInputSchema.parse(input) as never);

describe('media reference actions', () => {
  it('analyze_reference needs the clip id; remake needs your words', () => {
    expect(MediaInputSchema.safeParse({ action: 'analyze_reference' }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'analyze_reference', id: 'vraster_1' }).success).toBe(true);
    expect(MediaInputSchema.safeParse({ action: 'remake_from_reference', texts: [] }).success).toBe(false);
    expect(MediaInputSchema.safeParse({ action: 'remake_from_reference', texts: ['Hi'] }).success).toBe(true);
  });

  it('analysis keeps thumbnails off by default and stays in the page for the remake', () => {
    const code = emit({ action: 'analyze_reference', id: 'vraster_1' });
    expect(code).toContain("app.analyzeReferenceVideo(\"vraster_1\", { thumbnails: false })");
    expect(code).toContain('window.__ppLastReference = { analysis: r, id: "vraster_1" }');
  });

  it('the remake mutes the reference, so its sound is not exported under the cards', () => {
    const code = emit({ action: 'remake_from_reference', texts: ['One', 'Two'], clear: true });
    expect(code).toContain('{ reference: last.id }');
    expect(code).toContain('"texts":["One","Two"]');
    expect(code).toContain('call pinepaper_media analyze_reference first');
  });
});
