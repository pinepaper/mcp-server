/**
 * The mcp-server half of three engine items merged in FxTool #288–#290:
 *   - WORDSPC (#289): wordSpacing, textTransform, textDecoration and justify are drawn on text. They are on the
 *     engine's read list now, so create / modify stop calling them ignored; the reply's `typography` is read back
 *     from item.data, so a studio before #289 is still named instead of reported as done.
 *   - B45 (#288): `audioCodec: 'aac'` on an MP4 export reaches the studio, and is refused for other formats.
 *   - B31 (#290): the deterministic docs state the signed-off contract.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema, CreateItemInputSchema, ModifyItemInputSchema } from '../../types/schemas.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

function runCreate(input: Record<string, unknown>, app: Record<string, unknown>): Record<string, any> {
  const code = codeGenerator.generateCreateItem(CreateItemInputSchema.parse(input) as never);
  return new Function('app', 'window', code.replace(/\(\{ itemId[\s\S]*\}\);\s*$/, (m) => `return ${m.slice(0, -1)}`))(app, {});
}
function runModify(input: Record<string, unknown>, app: Record<string, unknown>): Record<string, any> {
  const code = codeGenerator.generateModifyItem(ModifyItemInputSchema.parse(input) as never);
  const body = code.split('\n').filter((l) => !l.startsWith('//')).join('\n');
  return new Function('app', 'window', `return ${body}`)(app, {});
}

/** A studio whose create / modifyItem store typography on data the way FxTool #289 does (or not at all). */
function studio(draws: boolean) {
  const item: Record<string, any> = { className: 'PointText', data: { registryId: 'item_1' }, bringToFront() {} };
  const take = (p: Record<string, unknown>) => {
    if (!draws) return;
    for (const k of ['wordSpacing', 'textTransform', 'textDecoration']) {
      if (p[k] === undefined) continue;
      if (p[k] === null || p[k] === 'none' || p[k] === 'normal' || p[k] === 0) delete item.data[k];
      else item.data[k] = p[k];
    }
    if (p.justification === 'justify' || p.textAlign === 'justify') item.data.justify = true;
  };
  const app: Record<string, unknown> = {
    create: (_t: string, p: Record<string, unknown>) => { take(p); return item; },
    modifyItem: (_id: string, ch: Record<string, unknown>) => { take(ch); return true; },
    getItemById: () => item, itemRegistry: { get: () => ({ item }) }, historyManager: { saveState() {} },
  };
  if (draws) app._applyTextTypography = () => true;
  return { app, item };
}

const TYPO = { content: 'one two three', wordSpacing: 12, textTransform: 'uppercase', textDecoration: 'underline', textAlign: 'justify' };

describe('WORDSPC: text typography on create and modify', () => {
  it('create no longer names the four keys as ignored', () => {
    const code = codeGenerator.generateCreateItem(CreateItemInputSchema.parse({ itemType: 'text', position: { x: 0, y: 0 }, properties: TYPO }) as never);
    expect(code).not.toContain('ignoredProperties');
  });

  it('a studio that draws them: typography reads back what the item holds', () => {
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: TYPO }, studio(true).app);
    expect(r.typography).toEqual({ applied: true, wordSpacing: 12, textTransform: 'uppercase', textDecoration: 'underline', justify: true });
    expect(r.ignoredProperties).toBeUndefined();
  });

  it('a studio before #289: applied false, the keys named, never reported as done', () => {
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: TYPO }, studio(false).app);
    expect(r.typography.applied).toBe(false);
    expect(r.typography.ignored).toEqual(['wordSpacing', 'textTransform', 'textDecoration', 'justify']);
    expect(r.typography.note).toContain('does not draw');
  });

  it('a value the item does not hold afterwards is null, with a note', () => {
    const { app } = studio(true);
    runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'x', textDecoration: 'underline' } }, app);
    const cleared = runModify({ itemId: 'item_1', properties: { textDecoration: 'none' } }, app);
    expect(cleared.typography.textDecoration).toBeNull();
    expect(cleared.typography.note).toContain('not set on the item now');
  });

  it('modify reports typography the same way', () => {
    const r = runModify({ itemId: 'item_1', properties: { wordSpacing: '0.5em' } }, studio(true).app);
    expect(r.typography).toEqual({ applied: true, wordSpacing: '0.5em' });
    expect(runModify({ itemId: 'item_1', properties: { wordSpacing: 8 } }, studio(false).app).typography.applied).toBe(false);
  });

  it('text without these keys carries no typography field', () => {
    const r = runCreate({ itemType: 'text', position: { x: 0, y: 0 }, properties: { content: 'plain', textAlign: 'left' } }, studio(true).app);
    expect(r.typography).toBeUndefined();
  });

  it('the text docs name the keys', () => {
    const d = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_create_item')!.description;
    for (const k of ['wordSpacing', 'textTransform', 'textDecoration', "textAlign: 'justify'"]) expect(d).toContain(k);
  });
});

describe('B45: audioCodec on an MP4 export', () => {
  it("'aac' reaches the studio's export options", () => {
    const code = codeGenerator.generateAgentExport(AgentExportInputSchema.parse({ format: 'mp4', audioCodec: 'aac' }) as never);
    expect(code).toContain('"audioCodec":"aac"');
  });

  it("'any' is the engine default, so nothing is sent", () => {
    const code = codeGenerator.generateAgentExport(AgentExportInputSchema.parse({ format: 'mp4', audioCodec: 'any' }) as never);
    expect(code).not.toContain('"audioCodec"');
  });

  it('is refused on any format but mp4', () => {
    const r = AgentExportInputSchema.safeParse({ format: 'webm', audioCodec: 'aac' });
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('audioCodec is an mp4 setting');
  });

  it('is published in the tool definition', () => {
    const t = PINEPAPER_TOOLS.find((d) => d.name === 'pinepaper_agent_export')!;
    const props = JSON.stringify(t.inputSchema);
    expect(props).toContain('audio_codec_unavailable');
  });
});

describe('B31: the deterministic docs state the signed-off contract', () => {
  it('names frameDigest, bitExact and WebM, and no longer claims only timestamps vary', () => {
    const t = PINEPAPER_TOOLS.find((d) => d.name === 'pinepaper_agent_export')!;
    const s = JSON.stringify(t.inputSchema);
    expect(s).toContain('bitExact: true');
    expect(s).toContain('frameDigest');
    expect(s).not.toContain('pins the container timestamps');
  });
});
