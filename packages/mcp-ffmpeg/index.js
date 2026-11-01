/**
 * The only child processes @pinepaper.studio/mcp-server can start, kept in this
 * separate, optional package so the server itself starts none.
 *
 * execFile, never exec or spawn with a shell. The binary is one of two literal
 * names, `ffmpeg` or `ffprobe`; anything else is refused before a process
 * starts. The arguments are an array the server writes, with file paths made
 * absolute first, so none can be read as an option or an ffmpeg protocol.
 */
import { execFile } from 'node:child_process';

const BINARIES = new Set(['ffmpeg', 'ffprobe']);

/**
 * @param {'ffmpeg' | 'ffprobe'} cmd
 * @param {string[]} args
 * @param {number} [timeout]
 * @returns {Promise<{ ok: boolean, stdout: string, stderr: string }>}
 */
export function run(cmd, args, timeout = 30_000) {
  if (!BINARIES.has(cmd)) return Promise.resolve({ ok: false, stdout: '', stderr: `refused: ${String(cmd)} is not ffmpeg or ffprobe` });
  if (!Array.isArray(args) || args.some((a) => typeof a !== 'string')) return Promise.resolve({ ok: false, stdout: '', stderr: 'refused: arguments must be an array of strings' });
  return new Promise((resolve) => {
    execFile(cmd, args, { timeout, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: String(stdout ?? ''), stderr: String(stderr ?? '') || (err ? err.message : '') });
    });
  });
}
