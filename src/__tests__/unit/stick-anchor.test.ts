import { describe, it, expect } from 'bun:test';
import { codeGenerator } from '../../types/code-generator.js';

describe('stick figure reply names its anchor', () => {
  it('figure reads app.stickFigureAnchorsFeet; set does not', () => {
    expect(codeGenerator.generateStick({ action: 'figure', at: { x: 1, y: 2 } } as never)).toContain("anchor: app.stickFigureAnchorsFeet === true ? 'feet' : 'hip'");
    expect(codeGenerator.generateStick({ action: 'set', kind: 'room' } as never)).not.toContain('stickFigureAnchorsFeet');
  });
});
