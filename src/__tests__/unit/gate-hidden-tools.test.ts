/**
 * 1.6.19 release gate, hidden-tool findings (PINEPAPER_TOOLKIT=full). Each was
 * reproduced and then verified fixed live against pinepaper.studio.
 */
import { describe, it, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PinePaperCodeGenerator } from '../../types/code-generator.js';

const gen = new PinePaperCodeGenerator() as any;
const src = (rel: string) => readFileSync(join(import.meta.dir, '..', '..', rel), 'utf-8');

describe('1.6.19 gate: hidden tools', () => {
  it('H1 register_item registers through the engine and refuses a non-item', () => {
    const code = gen.generateRegisterItem({ itemJson: ['Path', {}], itemType: 'circle' });
    expect(code).toContain('app.itemRegistry.register(item, "circle"');
    expect(code).not.toMatch(/^\s*app\.itemRegistry\.set\(/m);
    expect(code).not.toMatch(/textItemGroup\.addChild/);
    expect(code).toContain('!(item instanceof paper.Item)');
  });

  it('H2 a call whose own result failed is recorded as a failure', () => {
    const h = src('tools/handlers.ts');
    expect(h).toContain('success: result.success && !innerVerdict');
  });

  it('H3 canvas state reads the engine registry, not a window.pinepaper that does not exist', () => {
    const c = src('execution/canvas-state.ts');
    expect(c).toContain('app.itemRegistry.getAll()');
    expect(c).not.toMatch(/=\s*window\.pinepaper\.getItems\(\)/);
  });

  it('H5 a still item ("none") is not reported as animated', () => {
    const code = gen.generateGetItems ? gen.generateGetItems({}) : '';
    expect(code).toContain("animationType !== 'none'");
  });
});
