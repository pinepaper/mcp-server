/**
 * Diagnostic Report Tool Tests
 *
 * Validates:
 * - Tool exists in PINEPAPER_TOOLS
 * - Schema validates correctly
 * - Tool registered in toolkit tag group
 */

import { describe, it, expect } from 'bun:test';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { DiagnosticReportInputSchema } from '../../types/schemas.js';
import { TOOL_TAGS } from '../../tools/toolkits.js';

describe('pinepaper_diagnostic_report', () => {
  it('exists in PINEPAPER_TOOLS', () => {
    const tool = PINEPAPER_TOOLS.find(t => t.name === 'pinepaper_diagnostic_report');
    expect(tool).toBeDefined();
    expect(tool!.annotations?.readOnlyHint).toBe(true);
  });

  it('schema accepts empty input (all optional)', () => {
    const result = DiagnosticReportInputSchema.parse({});
    expect(result).toEqual({});
  });

  it('schema accepts all options', () => {
    const result = DiagnosticReportInputSchema.parse({
      includeMetrics: false,
      includeCanvas: true,
      metricsLimit: 50,
    });
    expect(result.includeMetrics).toBe(false);
    expect(result.includeCanvas).toBe(true);
    expect(result.metricsLimit).toBe(50);
  });

  it('schema rejects invalid metricsLimit', () => {
    expect(() => DiagnosticReportInputSchema.parse({ metricsLimit: 0 })).toThrow();
    expect(() => DiagnosticReportInputSchema.parse({ metricsLimit: 2000 })).toThrow();
  });

  it('is registered in the performance toolkit tag', () => {
    expect(TOOL_TAGS.performance).toContain('pinepaper_diagnostic_report');
  });
});
