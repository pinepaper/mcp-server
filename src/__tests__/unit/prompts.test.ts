/**
 * MCP Prompts — Test Suite
 *
 * Validates prompt metadata, message structure, tool name correctness,
 * argument substitution, and per-prompt tool call sequences.
 */

import { describe, it, expect } from 'bun:test';
import { PROMPTS, getPromptMessages } from '../../prompts/index.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';

// All valid tool names from the definitions
const VALID_TOOLS = new Set(PINEPAPER_TOOLS.map(t => t.name));

// Visual templates use batch_execute with layer labels
const VISUAL_PROMPTS = ['motivational-quote', 'text-reveal-up', 'solar-system-education', 'cinema-titles'];

// Diagram templates use dedicated diagram tools
const DIAGRAM_PROMPTS = ['simple-decision-flow'];

// Helper: extract all pinepaper_\w+ references from message text
function extractToolNames(text: string): string[] {
  const matches = text.match(/pinepaper_\w+/g) || [];
  return [...new Set(matches)];
}

// Helper: get all message text from a prompt result
function getAllMessageText(name: string, args?: Record<string, string>): string {
  const result = getPromptMessages(name, args);
  return result.messages.map(m => m.content.text).join('\n');
}

// =============================================================================
// 1. Metadata Validation
// =============================================================================

describe('Prompt Metadata', () => {
  it('every prompt has name and description', () => {
    for (const prompt of PROMPTS) {
      expect(prompt.name).toBeTruthy();
      expect(typeof prompt.name).toBe('string');
      expect(prompt.description).toBeTruthy();
      expect(typeof prompt.description).toBe('string');
    }
  });

  it('prompt names are unique', () => {
    const names = PROMPTS.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has exactly 5 prompts', () => {
    expect(PROMPTS.length).toBe(5);
  });

  it('every prompt has a single declarative description argument', () => {
    for (const prompt of PROMPTS) {
      expect(prompt.arguments).toBeTruthy();
      expect(prompt.arguments!.length).toBe(1);
      expect(prompt.arguments![0].name).toBe('description');
      expect(typeof prompt.arguments![0].description).toBe('string');
    }
  });
});

// =============================================================================
// 2. Message Structure
// =============================================================================

describe('Message Structure', () => {
  it('every prompt returns valid messages with role + text content', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      expect(result.messages.length).toBeGreaterThanOrEqual(2);
      for (const msg of result.messages) {
        expect(['user', 'assistant']).toContain(msg.role);
        expect(msg.content.type).toBe('text');
        expect(typeof msg.content.text).toBe('string');
        expect(msg.content.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('every prompt starts with a user message', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      expect(result.messages[0].role).toBe('user');
    }
  });

  it('visual prompts have batch_execute workflow', () => {
    for (const name of VISUAL_PROMPTS) {
      const result = getPromptMessages(name, { description: 'test' });
      const assistantMsgs = result.messages.filter(m => m.role === 'assistant');
      expect(assistantMsgs.length).toBeGreaterThanOrEqual(1);
      const text = assistantMsgs.map(m => m.content.text).join('\n');
      expect(text).toContain('batch_execute');
    }
  });

  it('diagram prompts have diagram tool workflow', () => {
    for (const name of DIAGRAM_PROMPTS) {
      const result = getPromptMessages(name, { description: 'test' });
      const assistantMsgs = result.messages.filter(m => m.role === 'assistant');
      expect(assistantMsgs.length).toBeGreaterThanOrEqual(1);
      const text = assistantMsgs.map(m => m.content.text).join('\n');
      expect(text).toContain('create_diagram_shape');
      expect(text).toContain('connect');
      expect(text).toContain('auto_layout');
    }
  });

  it('every prompt returns a description', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      expect(result.description).toBeTruthy();
      expect(typeof result.description).toBe('string');
    }
  });
});

// =============================================================================
// 3. CRITICAL: Tool Name Validation
// =============================================================================

describe('Tool Name Validation', () => {
  it('every pinepaper_* reference in message text is a real tool', () => {
    for (const prompt of PROMPTS) {
      const text = getAllMessageText(prompt.name, { description: 'test' });
      const toolNames = extractToolNames(text);

      for (const toolName of toolNames) {
        expect(VALID_TOOLS.has(toolName)).toBe(true);
      }
    }
  });

  it('visual prompts reference batch pipeline workflow', () => {
    for (const name of VISUAL_PROMPTS) {
      const text = getAllMessageText(name, { description: 'test' });
      expect(text).toContain('start_job');
      expect(text).toContain('batch_execute');
      expect(text).toContain('end_job');
    }
  });

  it('diagram prompts reference diagram tool workflow', () => {
    for (const name of DIAGRAM_PROMPTS) {
      const text = getAllMessageText(name, { description: 'test' });
      expect(text).toContain('start_job');
      expect(text).toContain('create_diagram_shape');
      expect(text).toContain('connect');
      expect(text).toContain('auto_layout');
      expect(text).toContain('end_job');
    }
  });
});

// =============================================================================
// 4. Argument Substitution
// =============================================================================

describe('Argument Substitution', () => {
  it('user description appears in generated messages', () => {
    const text = getAllMessageText('motivational-quote', {
      description: 'Stay hungry, stay foolish — warm sunset vibes',
    });
    expect(text).toContain('Stay hungry, stay foolish');
  });

  it('defaults are used when description omitted', () => {
    const text = getAllMessageText('motivational-quote');
    expect(text).toContain('Dream big');
  });

  it('text-reveal-up passes description through', () => {
    const text = getAllMessageText('text-reveal-up', {
      description: 'Hello World — neon glow style',
    });
    expect(text).toContain('Hello World');
  });

  it('simple-decision-flow passes description through', () => {
    const text = getAllMessageText('simple-decision-flow', {
      description: 'User login: enter credentials → validate → success or retry',
    });
    expect(text).toContain('enter credentials');
  });

  it('cinema-titles passes description through', () => {
    const text = getAllMessageText('cinema-titles', {
      description: 'ARRIVAL — sci-fi mood, slow fade',
    });
    expect(text).toContain('ARRIVAL');
  });

  it('solar-system passes description through', () => {
    const text = getAllMessageText('solar-system-education', {
      description: 'Show all 8 planets with rings on Saturn',
    });
    expect(text).toContain('all 8 planets');
  });
});

// =============================================================================
// 5. Per-Prompt Pipeline Verification
// =============================================================================

describe('Visual Template Layer Labels', () => {
  it('every visual prompt has layer labels (CANVAS, ITEMS, ANIMATE, PLAY)', () => {
    for (const name of VISUAL_PROMPTS) {
      const text = getAllMessageText(name, { description: 'test' });
      expect(text).toContain('CANVAS:');
      expect(text).toContain('ITEMS:');
      expect(text).toContain('ANIMATE:');
      expect(text).toContain('PLAY:');
    }
  });

  it('every visual prompt includes NEVER restart rule', () => {
    for (const name of VISUAL_PROMPTS) {
      const text = getAllMessageText(name, { description: 'test' });
      expect(text).toContain('NEVER restart the pipeline');
    }
  });

  it('motivational-quote: layer-labeled operations for quote workflow', () => {
    const text = getAllMessageText('motivational-quote');
    expect(text).toContain('CANVAS: execute_generator');
    expect(text).toContain('ITEMS: create text');
    expect(text).toContain('ANIMATE: keyframe_animate');
    expect(text).toContain('EFFECTS: apply_mask');
    expect(text).toContain('PLAY: play_timeline');
  });

  it('text-reveal-up: layer-labeled operations for text reveal', () => {
    const text = getAllMessageText('text-reveal-up');
    expect(text).toContain('CANVAS: execute_generator');
    expect(text).toContain('ITEMS: create text');
    expect(text).toContain('EFFECTS: apply_mask');
    expect(text).toContain('wipeUp');
    expect(text).toContain('PLAY: play_timeline');
  });

  it('solar-system-education: layer-labeled operations for solar system', () => {
    const text = getAllMessageText('solar-system-education');
    expect(text).toContain('CANVAS: set_background');
    expect(text).toContain('execute_generator');
    expect(text).toContain('ITEMS: create');
    expect(text).toContain('ANIMATE: animate');
    expect(text).toContain('relation');
    expect(text).toContain('PLAY: play_timeline');
  });

  it('cinema-titles: layer-labeled operations for cinematic sequence', () => {
    const text = getAllMessageText('cinema-titles');
    expect(text).toContain('CANVAS: set_background');
    expect(text).toContain('ITEMS: create text');
    expect(text).toContain('ANIMATE: keyframe_animate');
    expect(text).toContain('EFFECTS: apply_mask');
    expect(text).toContain('PLAY: play_timeline');
  });
});

describe('Diagram Template Workflow', () => {
  it('simple-decision-flow: uses diagram tools, not batch_execute', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('create_diagram_shape');
    expect(text).toContain('connect');
    expect(text).toContain('auto_layout');
    expect(text).not.toContain('batch_execute');
  });

  it('simple-decision-flow: includes NEVER restart rule', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('NEVER restart the pipeline');
  });

  it('simple-decision-flow: references shape types', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('terminal');
    expect(text).toContain('process');
    expect(text).toContain('decision');
  });

  it('simple-decision-flow: auto_layout is optional, not mandatory', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('optionally auto_layout');
    expect(text).toContain('Position shapes explicitly');
  });

  it('simple-decision-flow: includes show/review step', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('SHOW the screenshot');
  });
});

// =============================================================================
// 6. Error Handling
// =============================================================================

describe('Error Handling', () => {
  it('throws for unknown prompt name', () => {
    expect(() => getPromptMessages('nonexistent')).toThrow('Unknown prompt: nonexistent');
  });
});
