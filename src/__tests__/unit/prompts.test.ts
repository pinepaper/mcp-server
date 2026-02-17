/**
 * MCP Prompts — Test Suite
 *
 * Validates prompt metadata, message structure, argument substitution,
 * and error handling.
 *
 * Prompts are user-message-only (no assistant pre-fill).
 * Workflow rules are handled by start_job guidance and tool descriptions.
 */

import { describe, it, expect } from 'bun:test';
import { PROMPTS, getPromptMessages } from '../../prompts/index.js';

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
  it('every prompt returns exactly one user message', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      expect(result.messages.length).toBe(1);
      expect(result.messages[0].role).toBe('user');
      expect(result.messages[0].content.type).toBe('text');
      expect(result.messages[0].content.text.length).toBeGreaterThan(0);
    }
  });

  it('no assistant pre-fill messages', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      const assistantMsgs = result.messages.filter(m => m.role === 'assistant');
      expect(assistantMsgs.length).toBe(0);
    }
  });

  it('every prompt returns a description', () => {
    for (const prompt of PROMPTS) {
      const result = getPromptMessages(prompt.name, { description: 'test' });
      expect(result.description).toBeTruthy();
      expect(typeof result.description).toBe('string');
    }
  });

  it('no internal rules exposed in messages', () => {
    for (const prompt of PROMPTS) {
      const text = getAllMessageText(prompt.name, { description: 'test' });
      expect(text).not.toContain('RULES');
      expect(text).not.toContain('NEVER restart the pipeline');
      expect(text).not.toContain('CANVAS:');
      expect(text).not.toContain('ITEMS:');
      expect(text).not.toContain('Starting now.');
    }
  });
});

// =============================================================================
// 3. Argument Substitution
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
// 4. User Message Content
// =============================================================================

describe('User Message Content', () => {
  it('motivational-quote frames as animated poster request', () => {
    const text = getAllMessageText('motivational-quote');
    expect(text).toContain('animated motivational quote poster');
  });

  it('text-reveal-up frames as text reveal request', () => {
    const text = getAllMessageText('text-reveal-up');
    expect(text).toContain('text reveal animation');
  });

  it('simple-decision-flow frames as flowchart request', () => {
    const text = getAllMessageText('simple-decision-flow');
    expect(text).toContain('decision flowchart');
  });

  it('solar-system frames as animated solar system request', () => {
    const text = getAllMessageText('solar-system-education');
    expect(text).toContain('animated solar system');
  });

  it('cinema-titles frames as cinematic title request', () => {
    const text = getAllMessageText('cinema-titles');
    expect(text).toContain('cinematic title sequence');
  });
});

// =============================================================================
// 5. Error Handling
// =============================================================================

describe('Error Handling', () => {
  it('throws for unknown prompt name', () => {
    expect(() => getPromptMessages('nonexistent')).toThrow('Unknown prompt: nonexistent');
  });
});
