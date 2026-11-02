/**
 * The high-impact capabilities, OFF unless the person running the server turns them on.
 *
 * - code: run JavaScript the caller wrote, in the studio page. pinepaper_execute_custom_code, pinepaper_p5_draw,
 *   pinepaper_render_hook (register), pinepaper_register_custom_relation (its compute / apply are JS), and
 *   pinepaper_import_scene's registerCustomRelations (a file's saved compute / apply). PINEPAPER_ALLOW_CODE=1.
 * - localFiles: read a file from this machine's disk for an import (image, audio / video, a saved scene), inside
 *   the allowed folders (cwd, the export folder, PINEPAPER_ASSET_DIRS). PINEPAPER_ALLOW_LOCAL_FILES=1. The server's
 *   own exports stay readable without it, and URL imports are not affected (they go through safe-fetch).
 *
 * WHY OFF. An MCP server takes its arguments from a model, and a model takes its instructions from whatever it reads:
 * a web page, a document, a scene file. Each of these turns such text into code running in the studio, or into the
 * contents of a file on disk. The person who starts the server decides whether that is wanted; a refusal names the
 * switch, so it is one step to turn on. An embedder (a Worker with no environment) sets them with setCapability.
 */
import { env } from './env.js';

export type Capability = 'code' | 'localFiles';

export const CAPABILITY_SWITCH: Readonly<Record<Capability, string>> = Object.freeze({
  code: 'PINEPAPER_ALLOW_CODE',
  localFiles: 'PINEPAPER_ALLOW_LOCAL_FILES',
});

const overrides: Partial<Record<Capability, boolean>> = {};

/** Turn a capability on or off for this process; undefined goes back to the environment. */
export function setCapability(capability: Capability, on: boolean | undefined): void {
  if (on === undefined) delete overrides[capability];
  else overrides[capability] = on;
}

export function capabilityAllowed(capability: Capability): boolean {
  const set = overrides[capability];
  if (set !== undefined) return set;
  const v = (env(CAPABILITY_SWITCH[capability]) ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

/** The tools behind PINEPAPER_ALLOW_CODE, as the notice and the docs name them. */
export const CODE_GATED_TOOLS = Object.freeze([
  'pinepaper_execute_custom_code',
  'pinepaper_p5_draw',
  'pinepaper_render_hook (register)',
  'pinepaper_register_custom_relation',
  'pinepaper_import_scene (registerCustomRelations)',
]);

const HOW_TO_ENABLE = 'The person running the server enables it: add it to this server\'s "env" in their MCP client config, or tick the setting in the Claude Desktop extension, then restart the server. No tool call can change it.';

/** The refusal for a call that needs a capability that is off: what was refused, and the switch that allows it. */
export function capabilityRefusal(capability: Capability, what: string): string {
  const name = CAPABILITY_SWITCH[capability];
  return capability === 'code'
    ? `SECURITY BOUNDARY: ${what} runs JavaScript in the studio, which is off unless the server is started with ${name}=1. Nothing was run. ${HOW_TO_ENABLE} Until then, use the built-in tools (shapes, keyframes, relations such as time_expression, generators, patterns).`
    : `SECURITY BOUNDARY: ${what} reads a file from this machine's disk, which is off unless the server is started with ${name}=1. ${HOW_TO_ENABLE} Until then, pass an http(s) URL, or a file in the export folder.`;
}

/**
 * What an agent reads on connect (the server's instructions), so it knows before its first call which tools are
 * behind a switch, whether this server has them on, and that turning them on is the user's decision, not a tool's.
 */
export function securityBoundaryNotice(): string {
  const on = (c: Capability) => (capabilityAllowed(c) ? 'ON' : 'OFF');
  return `SECURITY BOUNDARY (set by the person running this server; no tool call can change it):
- Running JavaScript you write is ${on('code')} on this server (${CAPABILITY_SWITCH.code}=1 turns it on): ${CODE_GATED_TOOLS.join(', ')}.
- Reading files from disk outside the export folder is ${on('localFiles')} (${CAPABILITY_SWITCH.localFiles}=1 turns it on). URLs and the export folder always work.
When a switch is OFF, build with the other tools. If the user needs one of these, tell them which switch to set in their MCP client config (or the Claude Desktop extension's settings) and to restart the server; do not retry the call.`;
}
