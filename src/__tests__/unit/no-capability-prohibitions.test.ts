/**
 * A prohibition must not rule out a capability this server ships.
 *
 * mcp-cloud found the archetype: a system prompt opening with "Do NOT answer
 * in prose or code; issue tool calls." The code door had been closed by
 * instruction the entire time — not omitted, FORBIDDEN, in the one place the
 * model reads.
 *
 * This repo had the same shape one door over. `pinepaper_agent_start_job` —
 * the first call in every pipeline, so the first description a model reads —
 * said "Do NOT generate HTML or React", unqualified, while the server ships
 * `pinepaper_export_widget_html` to export the scene AS an HTML page. A model
 * that takes the instruction literally declines work this server can do, and
 * declines it using the server's own words.
 *
 * The distinction that matters is SUBSTITUTION versus CAPABILITY. "Do not
 * hand-write CSS instead of calling a tool" is correct steering. "Do not
 * generate HTML" is a ban on an output format the server exports. They read
 * almost identically and mean opposite things, which is why this is a test and
 * not a style note.
 *
 * NOT flagged, because they route rather than close: the several "DO NOT USE
 * FOR / WHEN" blocks each name a better tool for that case.
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS, AI_AGENT_GUIDE } from '../../tools/definitions.js';
import { SERVER_INFO, RESOURCE_CONTENTS, RESOURCES } from '../../index.js';
import { COMPACT_DESCRIPTIONS } from '../../tools/compact-descriptions.js';
import { MINIMAL_DESCRIPTIONS } from '../../tools/minimal-descriptions.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROMPTS, getPromptMessages } from '../../prompts/index.js';

/**
 * Capability → the tool that provides it.
 *
 * Deliberately keyed on the words a prohibition would use, not on tool names:
 * the failure is someone writing "no HTML" without knowing an HTML exporter
 * exists.
 */
const DOORS: Array<{ capability: string; forbidPattern: RegExp; tool: string }> = [
  { capability: 'HTML', forbidPattern: /\b(do not|don't|never)\s+(generate|create|write|produce)\s+(an?\s+)?HTML\b/i, tool: 'pinepaper_export_widget_html' },
  { capability: 'React', forbidPattern: /\b(do not|don't|never)\s+(generate|create|write|produce)\s+(an?\s+)?React\b/i, tool: 'pinepaper_export_widget' },
  { capability: 'code', forbidPattern: /\b(do not|don't|never)\s+(answer|reply|respond)\s+in\s+(prose\s+or\s+)?code\b/i, tool: 'pinepaper_execute_custom_code' },
];

/**
 * EVERY surface the server puts in front of a model — not the two I thought of.
 *
 * This started as the agent guide plus tool descriptions, a scope chosen by
 * what came to mind rather than by asking what a model actually reads.
 * Measuring the rest found the defect again in the worst place available:
 * SERVER_INFO.description said "NEVER generate HTML or React", and that string
 * is what a client shows BEFORE any tool, in every session, while the server
 * ships an HTML exporter and a React exporter.
 *
 * The other nineteen resources and every prompt were unguarded too. They
 * happened to be written correctly — getting-started qualifies each of its
 * bans with "as a substitute" / "instead of" / "fall back" — but nothing held
 * them that way, and "currently correct" is not a guard.
 */
const REPO = join(import.meta.dir, '..', '..', '..');

function manifestToolText(): Array<{ where: string; text: string }> {
  const m = JSON.parse(readFileSync(join(REPO, 'manifest.json'), 'utf-8')) as {
    long_description?: string; tools?: Array<{ name: string; description?: string }>;
  };
  return [
    { where: 'manifest.long_description', text: String(m.long_description ?? '') },
    ...(m.tools ?? []).map((t) => ({ where: `manifest:${t.name}`, text: String(t.description ?? '') })),
  ];
}

const servedText = (): Array<{ where: string; text: string }> => [
  { where: 'SERVER_INFO.description', text: SERVER_INFO.description },
  { where: 'pinepaper://docs/agent-guide', text: AI_AGENT_GUIDE },
  ...Object.entries(RESOURCE_CONTENTS).map(([uri, text]) => ({ where: uri, text })),
  ...PINEPAPER_TOOLS.map((t) => ({ where: t.name, text: String(t.description ?? '') })),
  // THE OTHER TWO VERBOSITY TIERS. A model on a compact client never sees the
  // full description — it reads these. A ban here would be invisible to a
  // sweep of `t.description` while reaching most of the users.
  ...Object.entries(COMPACT_DESCRIPTIONS).map(([n, text]) => ({ where: `compact:${n}`, text })),
  ...Object.entries(MINIMAL_DESCRIPTIONS).map(([n, text]) => ({ where: `minimal:${n}`, text })),
  // MANIFEST descriptions are a SEPARATE copy, not a projection: check-manifest
  // -tools.mjs preserves curated text rather than regenerating it, so it can
  // hold a ban the served description no longer does — and registries show it.
  ...manifestToolText(),
  // README is served as pinepaper://docs/readme, read from disk at request
  // time, so RESOURCE_CONTENTS never contains it. Translations are deliberately
  // OUT of scope: the door patterns are English regex, and running them over
  // README.zh-CN.md scans nothing while reading as a pass.
  { where: 'pinepaper://docs/readme', text: readFileSync(join(REPO, 'README.md'), 'utf-8') },
  ...PROMPTS.flatMap((p) => {
    // Built, not read from source: a prompt is assembled at request time, and
    // scanning the builder's source would miss what it interpolates.
    let msgs;
    try { msgs = getPromptMessages(p.name, {}).messages; } catch { return []; }
    return msgs.map((m, i) => ({ where: `prompt:${p.name}#${i}`, text: m.content.text }));
  }),
];

it('the sweep reaches every declared surface', () => {
  // LIVENESS, BY DERIVATION RATHER THAN THRESHOLD. Every assertion in this
  // file is satisfied by finding nothing, so a servedText() that quietly
  // returned less reads as a pass. My first version used floors — ">15
  // resources, >0 prompts" — which is the sentinel-over-cardinality hole this
  // repo has now hit three times: nineteen of twenty prompt builders could
  // throw and one scanned prompt would satisfy ">0".
  //
  // So the floor is the DECLARED list, compared name by name. It cannot be
  // satisfied by a survivor.
  const seen = servedText();
  const where = new Set(seen.map((s) => s.where));

  const declaredUris = RESOURCES.map((r) => String(r.uri)).filter((u) => !u.includes('/readme'));
  expect(declaredUris.filter((u) => !where.has(u)), 'declared resources the sweep never read').toEqual([]);
  expect(where.has('pinepaper://docs/readme')).toBe(true);

  expect(PROMPTS.map((p) => p.name).filter((n) => !where.has(`prompt:${n}#0`)),
    'prompts whose builder threw, so nothing was scanned').toEqual([]);

  for (const tier of ['compact', 'minimal'] as const) {
    const table = tier === 'compact' ? COMPACT_DESCRIPTIONS : MINIMAL_DESCRIPTIONS;
    expect(Object.keys(table).filter((n) => !where.has(`${tier}:${n}`)), `${tier} entries unscanned`).toEqual([]);
  }

  expect(seen.filter((s) => s.where.startsWith('manifest:')).length).toBe(
    (JSON.parse(readFileSync(join(REPO, 'manifest.json'), 'utf-8')).tools ?? []).length);

  // And nothing in the sweep is silently empty — a surface present by name but
  // carrying '' is scanned in form only.
  expect(seen.filter((s) => typeof s.text !== 'string' || s.text.length === 0).map((s) => s.where)).toEqual([]);
});

describe('no served instruction forbids a shipped capability', () => {
  for (const door of DOORS) {
    it(`does not ban ${door.capability}, which ${door.tool} provides`, () => {
      // The tool must actually exist, or this assertion is vacuous — the
      // failure mode that let four agreeing copies of a stale list pass.
      expect(
        PINEPAPER_TOOLS.some((t) => t.name === door.tool),
        `${door.tool} is not served, so this test proves nothing`,
      ).toBe(true);

      // THE QUALIFIER MUST ATTACH TO THE BAN, which took three attempts.
      //
      // v1 exempted any text naming the providing tool. That let the exact
      // banned sentence back in: a ban beside a mention is still a ban, and the
      // model reads the imperative.
      //
      // v2 required a qualifier in the same SENTENCE — and a sentence reading
      // "Do NOT generate HTML or React, but if the user wants one that is
      // export_widget_html, and they are the right answer rather than a
      // fallback" passed, because "rather than" appeared in it. The qualifier
      // was attached to the tools, not to the prohibition. Presence is not
      // attachment.
      //
      // v3: the qualifier must follow the ban CLOSELY. "Do not write HTML
      // instead of calling a tool" qualifies; a qualifier two clauses later
      // does not.
      const QUALIFIED = /\b(instead of|in place of|rather than calling|as a substitute|as a fallback|fall back)\b/i;
      const WINDOW = 60;
      const offenders = servedText()
        .filter(({ text }) => {
          const m = door.forbidPattern.exec(text);
          if (!m) return false;
          const after = text.slice(m.index + m[0].length, m.index + m[0].length + WINDOW);
          return !QUALIFIED.test(after);
        })
        .map(({ where }) => where);

      expect(offenders, `these forbid ${door.capability} without naming ${door.tool}`).toEqual([]);
    });
  }

  it('the guide names every door it spends lines forbidding the substitution of', () => {
    // Four lines of HTML prohibition and no mention of the HTML exporter reads
    // as a ban on the format. Naming the tool converts it into routing.
    for (const tool of ['pinepaper_export_widget_html', 'pinepaper_execute_custom_code']) {
      expect(AI_AGENT_GUIDE, `the guide never tells a model ${tool} exists`).toContain(tool);
    }
  });

  it('the guide says the rule is about substitution, not format', () => {
    expect(AI_AGENT_GUIDE.toUpperCase()).toContain('SUBSTITUTION');
  });

  it('the detector fires on the shape it is written for', () => {
    // Proving the guard rather than trusting it: mcp-cloud's exact sentence,
    // and the one this repo actually shipped.
    expect(DOORS[2]!.forbidPattern.test('Do NOT answer in prose or code; issue tool calls.')).toBe(true);
    expect(DOORS[0]!.forbidPattern.test('Do NOT generate HTML or React — use PinePaper tools instead.')).toBe(true);
    // And the qualifier, not a nearby tool name, is what makes it routing.
    // Attachment, not presence: a qualifier two clauses away belongs to
    // something else.
    const QUALIFIED = /\b(instead of|in place of|rather than calling|as a substitute|as a fallback|fall back)\b/i;
    const after = (t: string, re: RegExp) => { const m = re.exec(t)!; return t.slice(m.index + m[0].length, m.index + m[0].length + 60); };
    expect(QUALIFIED.test(after('Do NOT generate HTML instead of calling these tools', DOORS[0]!.forbidPattern))).toBe(true);
    expect(QUALIFIED.test(after('Do NOT generate HTML or React, and they are the right answer rather than a fallback', DOORS[0]!.forbidPattern))).toBe(false);
  });
});
