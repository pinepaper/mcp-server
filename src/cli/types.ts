/**
 * Shared command interface and flag-parsing wrapper for CLI subcommands.
 */

import { boolFlag, parseArgs, type FlagSpec, type ParsedArgs } from './args.js';

export type CliCategory =
  | 'Setup & Diagnostics'
  | 'Docs & Discovery'
  | 'Authoring & Preview'
  | 'Quality & Rendering'
  | 'MCP Server';

export interface CliCommand {
  name: string;
  aliases?: readonly string[];
  category: CliCategory;
  summary: string;
  usage: string;
  helpText: string;
  run: (argv: readonly string[]) => Promise<number>;
}

export type ParseCommandOutcome =
  | { kind: 'help'; code: 0 }
  | { kind: 'error'; code: 2 }
  | { kind: 'ok'; parsed: ParsedArgs; json: boolean };

/** Parse subcommand argv, printing help or usage errors uniformly. */
export function parseCommandArgs(
  argv: readonly string[],
  cmd: Pick<CliCommand, 'name' | 'helpText'>,
  specs: Record<string, FlagSpec> = {},
): ParseCommandOutcome {
  const res = parseArgs(argv, specs);
  if (!res.ok) {
    console.error(`pinepaper-mcp ${cmd.name}: ${res.error}`);
    console.error(`Run \`pinepaper-mcp ${cmd.name} --help\` for usage.`);
    return { kind: 'error', code: 2 };
  }
  if (boolFlag(res.data.flags, 'help')) {
    console.log(cmd.helpText);
    return { kind: 'help', code: 0 };
  }
  return { kind: 'ok', parsed: res.data, json: boolFlag(res.data.flags, 'json') === true };
}
