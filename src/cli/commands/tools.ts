/**
 * `pinepaper-mcp tools [list|search|show]` — Browse, search, and inspect
 * the MCP tool surface and input schemas from the terminal.
 */

import { getToolsForVerbosity, PINEPAPER_TOOLS, type ToolVerbosity } from '../../tools/definitions.js';
import { getToolsForToolkit, detectVerbosityFromEnvironment, TOOL_TAGS, TOOLKIT_PROFILES, TOOLKIT_PROFILES_LIST, type ToolkitProfile } from '../../tools/toolkits.js';

/**
 * Which tools a toolkit holds depends on the descriptions the SERVER sends: core also takes every tool its listed
 * tools name, and a longer description names more. So membership is computed at the server's verbosity
 * (PINEPAPER_VERBOSITY, compact by default), and --verbosity here changes only the text shown. It used to compute
 * it at the display verbosity, and `tools list --toolkit core` showed 57 tools where the server lists 71.
 */
const serverTools = () => getToolsForVerbosity(detectVerbosityFromEnvironment());
import { strFlag, suggestCommand } from '../args.js';
import { emitJson } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

const HELP = `PinePaper Tool Explorer

Inspect PinePaper's ${PINEPAPER_TOOLS.length} tools, toolkit profiles, tag groups, and input schemas.

USAGE:
  pinepaper-mcp tools [list|search|show] [query-or-name] [options]

SUBACTIONS:
  list                List tools filtered by --toolkit or --tag (default)
  search <query>      Search tools by name, tag, or description
  show <tool-name>    Show full description and input schema for one tool

OPTIONS:
  --toolkit <profile> Filter by toolkit (${TOOLKIT_PROFILES_LIST.join('|')}; default: full)
  --tag <group>       Filter by tag group (${Object.keys(TOOL_TAGS).slice(0, 6).join(', ')}, ...)
  --verbosity <level> Description detail for JSON/list (minimal|compact|verbose; default: minimal)
  --json              Emit machine-readable JSON output
  -h, --help          Show help`;

function tagsForTool(name: string): string[] {
  const tags: string[] = [];
  for (const [tag, list] of Object.entries(TOOL_TAGS)) {
    if (list.includes(name)) tags.push(tag);
  }
  return tags;
}

function firstLine(text: string | undefined): string {
  if (!text) return '';
  const line = text.split('\n').map((l) => l.trim()).find(Boolean) || '';
  return line.length > 88 ? line.slice(0, 85) + '...' : line;
}

function findTool(name: string) {
  const exact = PINEPAPER_TOOLS.find((t) => t.name === name);
  if (exact) return exact;
  if (!name.startsWith('pinepaper_')) {
    return PINEPAPER_TOOLS.find((t) => t.name === `pinepaper_${name}`) ?? null;
  }
  return null;
}

export const toolsCommand: CliCommand = {
  name: 'tools',
  category: 'Docs & Discovery',
  summary: `List, search, and inspect schemas across all ${PINEPAPER_TOOLS.length} tools`,
  usage: 'pinepaper-mcp tools [list|search|show] [query|name] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, toolsCommand, {
      toolkit: { type: 'string', short: 't' },
      tag: { type: 'string' },
      verbosity: { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const pos = parsed.parsed.positionals;
    const rawSub = (pos[0] || 'list').toLowerCase();
    const isExplicitSub = rawSub === 'list' || rawSub === 'search' || rawSub === 'show';
    const action = isExplicitSub ? rawSub : 'search';
    const queryOrName = isExplicitSub ? pos.slice(1).join(' ').trim() : pos.join(' ').trim();

    const toolkitArg = (strFlag(parsed.parsed.flags, 'toolkit') || 'full').toLowerCase();
    if (!TOOLKIT_PROFILES_LIST.includes(toolkitArg as ToolkitProfile)) {
      console.error(`Unknown toolkit "${toolkitArg}". Valid values: ${TOOLKIT_PROFILES_LIST.join(', ')}.`);
      return 2;
    }
    const toolkit = toolkitArg as ToolkitProfile;
    const tagArg = strFlag(parsed.parsed.flags, 'tag')?.toLowerCase();
    if (tagArg && !(tagArg in TOOL_TAGS)) {
      const hint = suggestCommand(tagArg, Object.keys(TOOL_TAGS));
      console.error(`Unknown tag "${tagArg}".${hint ? ` Did you mean "${hint}"?` : ''}`);
      return 2;
    }
    const verbosityArg = (strFlag(parsed.parsed.flags, 'verbosity') || 'minimal').toLowerCase();
    if (verbosityArg !== 'minimal' && verbosityArg !== 'compact' && verbosityArg !== 'verbose') {
      console.error(`Unknown verbosity "${verbosityArg}". Use minimal, compact, or verbose.`);
      return 2;
    }

    if (action === 'show') {
      if (!queryOrName) {
        console.error('Usage: pinepaper-mcp tools show <tool-name>');
        return 2;
      }
      const tool = findTool(queryOrName);
      if (!tool) {
        const hint = suggestCommand(queryOrName, PINEPAPER_TOOLS.map((t) => t.name));
        if (parsed.json) {
          emitJson('tools', { ok: false, error: `Unknown tool "${queryOrName}".`, ...(hint ? { suggestion: hint } : {}) });
        } else {
          console.error(`Unknown tool "${queryOrName}".${hint ? ` Did you mean "${hint}"?` : ''}`);
        }
        return 1;
      }
      const tags = tagsForTool(tool.name);
      const profiles = TOOLKIT_PROFILES_LIST.filter((p) =>
        p === 'full' || getToolsForToolkit(serverTools(), p).some((x) => x.name === tool.name),
      );
      if (parsed.json) {
        emitJson('tools', {
          action: 'show',
          tool: { name: tool.name, description: tool.description, annotations: tool.annotations, tags, toolkits: profiles, inputSchema: tool.inputSchema },
        });
        return 0;
      }
      console.log(`${tool.name}`);
      console.log(`Tags:     ${tags.join(', ') || 'none'}`);
      console.log(`Toolkits: ${profiles.join(', ')}`);
      if (tool.annotations) {
        console.log(`Hints:    readOnly=${Boolean(tool.annotations.readOnlyHint)}, destructive=${Boolean(tool.annotations.destructiveHint)}, idempotent=${Boolean(tool.annotations.idempotentHint)}`);
      }
      console.log('\nDescription:\n' + (tool.description || ''));
      const schema = tool.inputSchema as { properties?: Record<string, { type?: string; description?: string; enum?: unknown[] }>; required?: string[] };
      const props = schema?.properties || {};
      const required = new Set(schema?.required || []);
      const propNames = Object.keys(props);
      console.log('\nParameters:');
      if (!propNames.length) {
        console.log('  (none)');
      } else {
        for (const p of propNames) {
          const def = props[p] || {};
          const reqMark = required.has(p) ? '*' : ' ';
          const typeLabel = Array.isArray(def.enum) ? `enum(${def.enum.slice(0, 4).join('|')}${def.enum.length > 4 ? '|...' : ''})` : (def.type || 'any');
          console.log(`  ${reqMark} ${p.padEnd(22)} ${String(typeLabel).padEnd(18)} ${firstLine(def.description)}`);
        }
      }
      return 0;
    }

    const members = new Set(getToolsForToolkit(serverTools(), toolkit).map((t) => t.name));
    const baseTools = getToolsForVerbosity(verbosityArg as ToolVerbosity).filter((t) => members.has(t.name));
    const minimalMap = new Map(getToolsForVerbosity('minimal').map((t) => [t.name, t.description || '']));
    const fullMap = new Map(PINEPAPER_TOOLS.map((t) => [t.name, t.description || '']));

    let filtered = baseTools;
    if (tagArg) {
      const tagSet = new Set(TOOL_TAGS[tagArg]);
      filtered = filtered.filter((t) => tagSet.has(t.name));
    }

    if (action === 'search') {
      if (!queryOrName) {
        console.error('Usage: pinepaper-mcp tools search <query>');
        return 2;
      }
      const q = queryOrName.toLowerCase();
      filtered = filtered.filter((t) => {
        const tags = tagsForTool(t.name).join(' ').toLowerCase();
        const desc = (fullMap.get(t.name) || '').toLowerCase();
        return t.name.toLowerCase().includes(q) || tags.includes(q) || desc.includes(q);
      });
    }

    if (parsed.json) {
      emitJson('tools', {
        action,
        ...(queryOrName ? { query: queryOrName } : {}),
        toolkit,
        ...(tagArg ? { tag: tagArg } : {}),
        count: filtered.length,
        total: PINEPAPER_TOOLS.length,
        toolkits: Object.fromEntries(TOOLKIT_PROFILES_LIST.map((p) => [p, TOOLKIT_PROFILES[p].length])),
        tags: Object.keys(TOOL_TAGS),
        tools: filtered.map((t) => ({
          name: t.name,
          tags: tagsForTool(t.name),
          summary: firstLine(minimalMap.get(t.name)),
          ...(verbosityArg !== 'minimal' ? { description: t.description } : {}),
        })),
      });
      return 0;
    }

    console.log(
      action === 'search'
        ? `Found ${filtered.length} tool(s) matching "${queryOrName}" (toolkit=${toolkit}${tagArg ? `, tag=${tagArg}` : ''}):\n`
        : `PinePaper Tools (${filtered.length} shown, ${PINEPAPER_TOOLS.length} total; toolkit=${toolkit}${tagArg ? `, tag=${tagArg}` : ''}):\n`,
    );
    for (const t of filtered) {
      console.log(`  ${t.name.padEnd(34)} ${firstLine(minimalMap.get(t.name))}`);
    }
    console.log('\nInspect parameters: `pinepaper-mcp tools show <tool-name>`');
    return 0;
  },
};
