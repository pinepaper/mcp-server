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
import { SERVER_INFO, RESOURCE_CONTENTS } from '../../index.js';
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
const servedText = (): Array<{ where: string; text: string }> => [
  { where: 'SERVER_INFO.description', text: SERVER_INFO.description },
  { where: 'pinepaper://docs/agent-guide', text: AI_AGENT_GUIDE },
  ...Object.entries(RESOURCE_CONTENTS).map(([uri, text]) => ({ where: uri, text })),
  ...PINEPAPER_TOOLS.map((t) => ({ where: t.name, text: String(t.description ?? '') })),
  ...PROMPTS.flatMap((p) => {
    // Built, not read from source: a prompt is assembled at request time, and
    // scanning the builder's source would miss what it interpolates.
    let msgs;
    try { msgs = getPromptMessages(p.name, {}).messages; } catch { return []; }
    return msgs.map((m, i) => ({ where: `prompt:${p.name}#${i}`, text: m.content.text }));
  }),
];

it('the sweep reaches every served surface', () => {
  // LIVENESS. Every assertion below is satisfied by finding nothing, so a
  // servedText() that silently returned less would read as a pass. These
  // floors are the difference between "no offence" and "no look".
  const seen = servedText();
  expect(seen.filter((s) => s.where.startsWith('pinepaper://')).length).toBeGreaterThan(15);
  expect(seen.filter((s) => s.where.startsWith('prompt:')).length).toBeGreaterThan(0);
  expect(seen.filter((s) => s.where === 'SERVER_INFO.description')[0]?.text.length).toBeGreaterThan(20);
  expect(seen.every((s) => typeof s.text === 'string')).toBe(true);
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
