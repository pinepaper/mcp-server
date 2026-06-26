/**
 * Grouping capability + orchestration guidance.
 *
 * Two behaviors the MCP server must steer models toward:
 *  1. Group the parts of a specific named composite object (a car) so it drags/animates
 *     as one entity.
 *  2. Disambiguate a one-shot reposition (modify) vs an animated A→B move (keyframe)
 *     vs following a multi-point path (moves_along_path).
 */

import { describe, it, expect } from 'bun:test';
import { AI_AGENT_GUIDE, PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { AgentBatchOperationTypeSchema, GroupInputSchema } from '../../types/schemas.js';

describe('grouping capability', () => {
  it('pinepaper_group is a registered tool with group/ungroup actions', () => {
    const tool = PINEPAPER_TOOLS.find((t) => t.name === 'pinepaper_group');
    expect(tool).toBeDefined();
    const actionEnum = (tool!.inputSchema as any).properties.action.enum;
    expect(actionEnum).toEqual(['group', 'ungroup', 'break_apart']);
  });

  it('break_apart decomposes an imported SVG into movable parts', () => {
    expect(GroupInputSchema.safeParse({ action: 'break_apart', itemId: 'svg_5' }).success).toBe(true);
  });

  it('the batch op set includes "group"', () => {
    expect(AgentBatchOperationTypeSchema.options).toContain('group');
  });

  it('GroupInputSchema accepts a group op and an ungroup op', () => {
    expect(GroupInputSchema.safeParse({ action: 'group', itemIds: ['a', 'b'], groupName: 'car' }).success).toBe(true);
    expect(GroupInputSchema.safeParse({ action: 'ungroup', groupId: 'group_1' }).success).toBe(true);
    expect(GroupInputSchema.safeParse({ action: 'rotate' }).success).toBe(false);
  });
});

describe('AI agent guidance', () => {
  it('tells models to group the parts of a composite object', () => {
    expect(AI_AGENT_GUIDE).toContain('COMPOSITE OBJECTS');
    expect(AI_AGENT_GUIDE).toMatch(/group/i);
    expect(AI_AGENT_GUIDE).toContain('ungroup'); // grouping is reversible / safe
  });

  it('distinguishes reposition vs animated move vs path-follow', () => {
    expect(AI_AGENT_GUIDE).toContain('MOVE vs ANIMATE');
    expect(AI_AGENT_GUIDE).toContain('moves_along_path');
    expect(AI_AGENT_GUIDE).toContain('keyframe_animate');
    expect(AI_AGENT_GUIDE).toMatch(/modify/);
  });
});
