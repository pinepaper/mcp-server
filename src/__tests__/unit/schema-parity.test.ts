/**
 * A tool's published JSON schema and the zod schema its handler parses with
 * must describe the same inputs.
 *
 * They are written by hand, separately, and drift in three ways — each found
 * in the field before this test existed:
 *
 *   - zod accepts a key or enum value the JSON schema never advertises, so a
 *     working capability is invisible (image_filter's analyze_palette and
 *     recolor_palette, and their four parameters).
 *   - the JSON schema advertises a value zod REJECTS, so a caller who follows
 *     the docs gets a validation error (add_filter 'saturate',
 *     agent_start_job screenshotPolicy 'never').
 *   - the JSON schema advertises a key zod STRIPS, so the call succeeds and
 *     the argument does nothing (create_item / modify_item `data`,
 *     agent_end_job `includeScreenshot`). The worst of the three: silent.
 *
 * The pairing is read from handlers.ts — each `case 'pinepaper_x':` to the
 * first `XInputSchema.parse(args)` before the next case — so a new tool is
 * checked without being registered here.
 *
 * KNOWN_DRIFT is a shrink-only ratchet: what was already wrong when the guard
 * landed. A new entry fails; fixing one fails until it is deleted from here.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import * as schemas from '../../types/schemas.js';

const KNOWN_DRIFT: readonly string[] = [
  'pinepaper_agent_end_job: zod-only key takeScreenshot',
  'pinepaper_agent_export: zod-only key includeRecommendations',
  'pinepaper_agent_reset: zod-only key preserveCanvasSize',
  'pinepaper_agent_start_job: zod-only key backgroundColor',
  'pinepaper_agent_start_job: zod-only key canvasSize',
  'pinepaper_agent_start_job: zod-only key headless',
  'pinepaper_compose.action: unadvertised value list_reveals',
  'pinepaper_compose.action: unadvertised value list_styles',
  'pinepaper_compose: zod-only key assets',
  'pinepaper_compose: zod-only key audio',
  'pinepaper_compose: zod-only key grid',
  'pinepaper_compose: zod-only key reveal',
  'pinepaper_compose: zod-only key revealOptions',
  'pinepaper_compose: zod-only key style',
  'pinepaper_compose: zod-only key text',
  'pinepaper_import_svg: zod-only key source',
  'pinepaper_query_capabilities: zod-only key query',
  'pinepaper_stick.propSide: unadvertised value left',
  'pinepaper_stick.propSide: unadvertised value right',
  'pinepaper_text_effect: zod-only key hideAfter',
  'pinepaper_text_effect: zod-only key startAt',
];

type AnyZod = z.ZodTypeAny;

function unwrap(t: AnyZod | undefined): AnyZod | undefined {
  let cur = t;
  for (;;) {
    if (cur instanceof z.ZodOptional || cur instanceof z.ZodNullable) cur = cur._def.innerType;
    else if (cur instanceof z.ZodDefault) cur = cur._def.innerType;
    else if (cur instanceof z.ZodEffects) cur = cur._def.schema;
    else return cur;
  }
}

function pairs(): Map<string, string> {
  const src = readFileSync(join(import.meta.dir, '../../tools/handlers.ts'), 'utf8');
  const out = new Map<string, string>();
  const re = /case '(pinepaper_\w+)':((?:(?!case ')[\s\S]){0,2000}?)(\w+InputSchema)\.parse\(args\)/g;
  for (const m of src.matchAll(re)) if (!out.has(m[1]!)) out.set(m[1]!, m[3]!);
  return out;
}

function drift(): { found: string[]; checked: number } {
  const found: string[] = [];
  let checked = 0;
  const paired = pairs();
  for (const tool of PINEPAPER_TOOLS) {
    const schemaName = paired.get(tool.name);
    if (!schemaName) continue;
    const obj = unwrap((schemas as Record<string, unknown>)[schemaName] as AnyZod);
    if (!(obj instanceof z.ZodObject)) continue;
    checked++;
    const shape = obj.shape as Record<string, AnyZod>;
    const props = ((tool.inputSchema as { properties?: Record<string, { enum?: unknown[] }> }).properties) ?? {};
    const passthrough = obj._def.unknownKeys === 'passthrough';

    for (const k of Object.keys(props)) {
      if (!(k in shape) && !passthrough) found.push(`${tool.name}: stripped key ${k}`);
    }
    for (const [k, field] of Object.entries(shape)) {
      if (!(k in props)) { found.push(`${tool.name}: zod-only key ${k}`); continue; }
      const inner = unwrap(field);
      const advertised = props[k]!.enum;
      if (!(inner instanceof z.ZodEnum) || !Array.isArray(advertised)) continue;
      for (const v of inner.options as string[]) {
        if (!advertised.includes(v)) found.push(`${tool.name}.${k}: unadvertised value ${v}`);
      }
      // Checked through the FIELD, not the enum, so a deliberate alias the
      // field maps (a preprocess) counts as accepted.
      for (const v of advertised) {
        if (!field.safeParse(v).success) found.push(`${tool.name}.${k}: advertised value ${String(v)} is rejected`);
      }
    }
  }
  return { found: found.sort(), checked };
}

describe('JSON schema ↔ zod schema parity', () => {
  const { found, checked } = drift();

  it('pairs essentially every tool with the schema its handler parses', () => {
    // A regex over handlers.ts can go quiet; this says it did not.
    expect(checked).toBeGreaterThan(100);
  });

  it('no advertised key is stripped, and no advertised value is rejected', () => {
    // Never allowlisted: these are the silent and the loud contradictions.
    expect(found.filter((f) => f.includes('stripped key') || f.includes('is rejected'))).toEqual([]);
  });

  it('introduces no new drift', () => {
    expect(found.filter((f) => !KNOWN_DRIFT.includes(f))).toEqual([]);
  });

  it('KNOWN_DRIFT only shrinks — delete entries that are fixed', () => {
    expect(KNOWN_DRIFT.filter((f) => !found.includes(f))).toEqual([]);
  });
});

describe('the contradictions this guard found, fixed behaviourally', () => {
  it('create_item / modify_item carry data flags onto item.data', () => {
    const { codeGenerator } = require('../../types/code-generator.js');
    const created = codeGenerator.generateCreateItem({ itemType: 'circle', position: { x: 0, y: 0 }, properties: {}, data: { selectable: false } });
    expect(created).toContain('Object.assign(item.data, {"selectable":false})');
    const modified = codeGenerator.generateModifyItem({ itemId: 'item_1', properties: { opacity: 1 }, data: { isDecorative: true } });
    expect(modified).toContain('Object.assign(_flagged.item.data, {"isDecorative":true})');
  });

  it('agent_end_job reads the published includeScreenshot', () => {
    const { codeGenerator } = require('../../types/code-generator.js');
    const off = codeGenerator.generateAgentEndJob({ includeScreenshot: false });
    const on = codeGenerator.generateAgentEndJob({});
    expect(off).not.toEqual(on);
    expect(codeGenerator.generateAgentEndJob({ takeScreenshot: false })).toEqual(off);
  });

  it('published aliases map to the engine names', () => {
    expect(schemas.AddFilterInputSchema.parse({ filterType: 'saturate' }).filterType).toBe('saturation');
    expect(schemas.AgentStartJobInputSchema.parse({ screenshotPolicy: 'never' }).screenshotPolicy).toBe('none');
  });
});
