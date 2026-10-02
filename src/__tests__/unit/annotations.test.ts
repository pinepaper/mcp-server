/**
 * Annotations parity test.
 *
 * MCPA Gap 3: Every tool served by mcp-server MUST declare annotations
 * containing:
 *   - title (non-empty string)
 *   - readOnlyHint (boolean)
 *   - idempotentHint (boolean)
 *   - destructiveHint (boolean)
 *   - openWorldHint (boolean)
 *
 * MCPA Gap 2: Code execution and destructive tools must explicitly
 * declare destructiveHint: true so hosts can prompt user consent.
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

describe('Tool annotations completeness', () => {
  it('every tool has annotations with title and all four hints', () => {
    const missing: string[] = [];
    const malformed: Array<{ tool: string; problem: string }> = [];

    for (const tool of PINEPAPER_TOOLS) {
      const ann = (tool as any).annotations;
      if (!ann || typeof ann !== 'object') {
        missing.push(tool.name);
        continue;
      }

      if (typeof ann.title !== 'string' || !ann.title.trim()) {
        malformed.push({ tool: tool.name, problem: 'missing or empty title' });
      }
      if (typeof ann.readOnlyHint !== 'boolean') {
        malformed.push({ tool: tool.name, problem: 'readOnlyHint is not boolean' });
      }
      if (typeof ann.idempotentHint !== 'boolean') {
        malformed.push({ tool: tool.name, problem: 'idempotentHint is not boolean' });
      }
      if (typeof ann.destructiveHint !== 'boolean') {
        malformed.push({ tool: tool.name, problem: 'destructiveHint is not boolean' });
      }
      if (typeof ann.openWorldHint !== 'boolean') {
        malformed.push({ tool: tool.name, problem: 'openWorldHint is not boolean' });
      }
    }

    expect(missing).toEqual([]);
    expect(malformed).toEqual([]);
  });

  it('destructive and arbitrary code execution tools declare destructiveHint: true', () => {
    const destructiveNames = [
      'pinepaper_execute_custom_code',
      'pinepaper_execute_generator',
      'pinepaper_agent_batch_execute',
      'pinepaper_clear_canvas',
      'pinepaper_delete_item',
      'pinepaper_path',
    ];

    for (const name of destructiveNames) {
      const tool = PINEPAPER_TOOLS.find((t) => t.name === name);
      expect(tool).toBeDefined();
      expect((tool as any).annotations?.destructiveHint).toBe(true);
    }
  });
});
