/**
 * Regression test for tool-count / tool-table drift in the docs.
 *
 * The README advertises a tool count in prose ("The server exposes **N
 * tools**") AND enumerates every tool in a table. Both drift silently as
 * tools are added: 1.6.1 shipped claiming "All 121 tools" above a table
 * that listed 119 — pinepaper_crop_image and pinepaper_chroma_key were
 * added to definitions/handlers/toolkits but never to the table. The two
 * now-removed internal docs had drifted further apart still (one said 97
 * tools, another 119).
 *
 * This pins the README to PINEPAPER_TOOLS: the prose count, the table
 * length, and the exact set of names all have to agree with the code.
 * The 8 translated READMEs state the count but delegate the table to the
 * English one, so only their prose number is checked.
 */

import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

const REPO_ROOT = join(import.meta.dir, '..', '..', '..');
const README = readFileSync(join(REPO_ROOT, 'README.md'), 'utf-8');

const TOOL_COUNT = PINEPAPER_TOOLS.length;
const CODE_TOOL_NAMES = new Set(PINEPAPER_TOOLS.map((t) => t.name));

/** Tool names listed as rows in the README's full tool table. */
function readmeTableToolNames(): Set<string> {
  const start = README.indexOf('All ');
  const tableSection = start === -1 ? README : README.slice(start);
  const names = new Set<string>();
  for (const line of tableSection.split('\n')) {
    // Table rows look like: | `pinepaper_foo` | Description |
    const m = /^\|\s*`?(pinepaper_[a-z0-9_]+)`?\s*\|/.exec(line);
    if (m) names.add(m[1]);
  }
  return names;
}

describe('README ↔ PINEPAPER_TOOLS parity', () => {
  it('every prose tool-count claim matches the real tool count', () => {
    const claims = [...README.matchAll(/\b(\d{2,3})\s+tools\b/g)].map((m) => Number(m[1]));
    expect(claims.length).toBeGreaterThan(0); // the README must state a count somewhere
    for (const claimed of claims) {
      expect(claimed).toBe(TOOL_COUNT);
    }
  });

  it('the tool table lists exactly the tools the server exposes', () => {
    const table = readmeTableToolNames();

    const missing = [...CODE_TOOL_NAMES].filter((n) => !table.has(n)).sort();
    const stale = [...table].filter((n) => !CODE_TOOL_NAMES.has(n)).sort();

    expect({ missing, stale }).toEqual({ missing: [], stale: [] });
    expect(table.size).toBe(TOOL_COUNT);
  });

  it('translated READMEs state the same count as the English one', () => {
    const translations = [
      'README.zh-CN.md', 'README.ja.md', 'README.ko.md', 'README.es.md',
      'README.pt-BR.md', 'README.fr.md', 'README.de.md', 'README.hi.md',
    ];
    for (const file of translations) {
      const text = readFileSync(join(REPO_ROOT, file), 'utf-8');
      // Every 2-3 digit number adjacent to a bolded count marker must be the
      // tool count; translations wrap it as **121 <localized word>**.
      const bolded = [...text.matchAll(/\*\*(\d{2,3})\s*[^*\d]{0,20}\*\*/g)].map((m) => Number(m[1]));
      const counts = bolded.filter((n) => n >= 50 && n <= 999);
      expect(counts.length, `${file} states no tool count`).toBeGreaterThan(0);
      for (const n of counts) {
        expect(n, `${file} claims ${n} tools, code has ${TOOL_COUNT}`).toBe(TOOL_COUNT);
      }
    }
  });
});
