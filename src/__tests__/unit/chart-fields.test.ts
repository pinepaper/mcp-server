/**
 * create_chart plots the tool's own documented data shape (round 7 Z, 1.53):
 * [{category, value}] drew no bars because the engine defaults to x / y.
 */
import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

const optsOf = (code: string) => JSON.parse(/app\.createChart\("\w+", \[[\s\S]*?\], ({[\s\S]*?})\);/.exec(code)![1]!);

describe('create_chart field inference', () => {
  it('maps the documented {category, value} example', () => {
    const code = codeGenerator.generateChart({ action: 'create', chartType: 'bar', data: [{ category: 'A', value: 10 }, { category: 'B', value: 20 }] });
    expect(optsOf(code)).toMatchObject({ xField: 'category', yField: 'value' });
    expect(code).toContain('fields: {"xField":"category","yField":"value"}');
  });

  it('never overrides explicit fields, and leaves x / y data alone', () => {
    const explicit = codeGenerator.generateChart({ action: 'create', chartType: 'line', data: [{ m: 'Jan', a: 1, b: 2 }], options: { xField: 'm', yField: 'b' } });
    expect(optsOf(explicit)).toEqual({ xField: 'm', yField: 'b' });
    const xy = codeGenerator.generateChart({ action: 'create', chartType: 'scatter', data: [{ x: 1, y: 2 }] });
    expect(optsOf(xy)).toEqual({});
  });

  it('picks the first numeric key when nothing is value-like', () => {
    const code = codeGenerator.generateChart({ action: 'create', chartType: 'bar', data: [{ region: 'EU', revenue: 5 }] });
    expect(optsOf(code)).toMatchObject({ xField: 'region', yField: 'revenue' });
  });

  it('refuses by name when no numeric field exists', () => {
    const code = codeGenerator.generateChart({ action: 'create', chartType: 'bar', data: [{ a: 'x', b: 'y' }] });
    expect(code).toContain('no numeric field to plot');
    expect(code).toContain('success: false');
  });
});
