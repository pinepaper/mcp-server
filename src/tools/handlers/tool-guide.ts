/**
 * Tool guide handler — extracted from src/tools/handlers.ts.
 *
 * Returns the full AI Agent Guide when called with no args, the verbose
 * description for a specific tool when given a tool name, or every tool in
 * a category when given a category. Uses dynamic imports for the tool list
 * + tag map so the module load cost only hits when the guide is actually
 * requested.
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { type HandlerOptions } from '../handlers.js';
import { ToolGuideInputSchema } from '../../types/schemas.js';

export type ToolGuideHandler = (
  args: Record<string, unknown>,
  options: HandlerOptions,
) => Promise<CallToolResult>;

export const toolGuideHandlers: Record<string, ToolGuideHandler> = {
  pinepaper_tool_guide: async (args, _options) => {
    const input = ToolGuideInputSchema.parse(args);
    const { PINEPAPER_TOOLS, AI_AGENT_GUIDE } = await import('../definitions.js');
    const { TOOL_TAGS } = await import('../toolkits.js');

    // No args → full AI Agent Guide
    if (!input.tool && !input.category) {
      return { content: [{ type: 'text', text: AI_AGENT_GUIDE }] };
    }

    // Specific tool → full verbose description
    if (input.tool) {
      const tool = PINEPAPER_TOOLS.find((t: { name: string }) => t.name === input.tool);
      if (!tool) {
        return {
          content: [{ type: 'text', text: `Unknown tool: ${input.tool}. Use pinepaper_tool_guide with no args to see the AI Agent Guide.` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: `# ${tool.name}\n\n${tool.description}` }] };
    }

    // Category → all tools in that tag with descriptions
    if (input.category) {
      const toolNames = TOOL_TAGS[input.category];
      if (!toolNames) {
        const available = Object.keys(TOOL_TAGS).join(', ');
        return {
          content: [{ type: 'text', text: `Unknown category: ${input.category}. Available: ${available}` }],
          isError: true,
        };
      }
      const lines: string[] = [`# Category: ${input.category}\n`];
      for (const name of toolNames) {
        const tool = PINEPAPER_TOOLS.find((t: { name: string }) => t.name === name);
        if (tool) lines.push(`## ${tool.name}\n${tool.description}\n`);
      }
      return { content: [{ type: 'text', text: lines.join('\n') }] };
    }

    return { content: [{ type: 'text', text: AI_AGENT_GUIDE }] };
  },
};
