/**
 * Unit tests for the competitor-free public verification harness, shared helpers,
 * and agent-lane-t1 toolkit alignment.
 */
import { describe, expect, it } from 'bun:test';
import { expectedToolCountForToolkit } from '../../../scripts/acceptance/agent-lane-t1.js';
import { DELTA_MAX_TOKENS, T2_MAX_BYTES, T2_MAX_TOKENS } from '../../../scripts/acceptance/agent-lane-t2.js';
import { runOfflineChecks } from '../../../scripts/acceptance/public-verification-harness.js';
import {
  buildN1ToN4Deltas,
  buildT2Batch,
  isCyan,
  isSkyBlue,
  LINT_TEST_SCENES,
  measureBytesAndTokens,
} from '../../../scripts/acceptance/verify-helpers.js';
import { LANE_TOOL_NAMES, STARTER_TOOL_NAMES } from '../../tools/lane.js';
import { AgentBatchExecuteInputSchema } from '../../types/schemas.js';

describe('public verification harness helpers & T1/T2 alignment', () => {
  it('aligns agent-lane-t1 tool count expectation with LANE_TOOL_NAMES (8) and STARTER_TOOL_NAMES (5)', () => {
    expect(expectedToolCountForToolkit('lane')).toBe(LANE_TOOL_NAMES.length);
    expect(expectedToolCountForToolkit('lane')).toBe(8);
    expect(expectedToolCountForToolkit('starter')).toBe(STARTER_TOOL_NAMES.length);
    expect(expectedToolCountForToolkit('starter')).toBe(5);
  });

  it('measureBytesAndTokens computes UTF-8 bytes and ceil(bytes/4) tokens', () => {
    expect(measureBytesAndTokens('abcd')).toEqual({ bytes: 4, tokens: 1 });
    expect(measureBytesAndTokens('abcde')).toEqual({ bytes: 5, tokens: 2 });
    expect(measureBytesAndTokens({ a: 'é' })).toEqual({ bytes: 10, tokens: 3 });
  });

  it('canonical T2 and N1-N4 payloads pass schema validation within token budgets', () => {
    const t2 = buildT2Batch();
    const t2m = measureBytesAndTokens(t2);
    expect(t2m.bytes).toBeLessThanOrEqual(T2_MAX_BYTES);
    expect(t2m.tokens).toBeLessThanOrEqual(T2_MAX_TOKENS);
    expect(AgentBatchExecuteInputSchema.safeParse(t2).success).toBe(true);

    const naive = buildT2Batch({ naive: true });
    expect(JSON.stringify(naive)).not.toContain('"anchor":"top-left"');
    expect(JSON.stringify(naive)).not.toContain('"anchor":"bottom-left"');

    const deltas = buildN1ToN4Deltas();
    expect(deltas.map((d) => d.id)).toEqual(['N1', 'N2', 'N3', 'N4']);
    for (const d of deltas) {
      const m = measureBytesAndTokens(d.args);
      expect(m.tokens).toBeLessThanOrEqual(DELTA_MAX_TOKENS);
    }
  });

  it('LINT_TEST_SCENES collapsedGroup and unintendedOverlap pass AgentBatchExecuteInputSchema', () => {
    expect(AgentBatchExecuteInputSchema.safeParse(LINT_TEST_SCENES.collapsedGroup).success).toBe(true);
    expect(AgentBatchExecuteInputSchema.safeParse(LINT_TEST_SCENES.unintendedOverlap).success).toBe(true);
  });

  it('isCyan and isSkyBlue cleanly distinguish #22d3ee dots from #38bdf8 bars', () => {
    // #22d3ee -> rgb(34, 211, 238) and typical H.264 encoded sample rgb(35, 211, 234)
    expect(isCyan(34, 211, 238)).toBe(true);
    expect(isSkyBlue(34, 211, 238)).toBe(false);
    expect(isCyan(35, 211, 234)).toBe(true);
    expect(isSkyBlue(35, 211, 234)).toBe(false);

    // #38bdf8 -> rgb(56, 189, 248) and typical H.264 encoded sample rgb(55, 189, 247)
    expect(isSkyBlue(56, 189, 248)).toBe(true);
    expect(isCyan(56, 189, 248)).toBe(false);
    expect(isSkyBlue(55, 189, 247)).toBe(true);
    expect(isCyan(55, 189, 247)).toBe(false);
  });

  it('runOfflineChecks completes cleanly with all offline checks passing', async () => {
    const checks = await runOfflineChecks();
    expect(checks.length).toBeGreaterThanOrEqual(8);
    const failed = checks.filter((c) => !c.ok);
    expect(failed).toEqual([]);
  });
});
