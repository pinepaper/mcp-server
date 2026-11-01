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

/** The refusal for a call that needs a capability that is off: what was refused, and the switch that allows it. */
export function capabilityRefusal(capability: Capability, what: string): string {
  const name = CAPABILITY_SWITCH[capability];
  return capability === 'code'
    ? `${what} runs JavaScript in the studio, which this server does not do unless it is started with ${name}=1 (set it in the MCP client's env for this server, or the extension's "Allow custom code" setting). Nothing was run.`
    : `${what} reads a file from this machine's disk, which this server does not do unless it is started with ${name}=1 (set it in the MCP client's env for this server, or the extension's "Allow local files" setting). Pass an http(s) URL instead, or turn it on.`;
}
