/**
 * MCP over stdio: one JSON-RPC message per line, in and out.
 *
 * The SDK's StdioServerTransport (1.32.1), rule for rule. A line that is not
 * JSON, or not a JSON-RPC message, is reported to onerror and dropped; no
 * -32700 reply, because the SDK sent none and clients were built against it.
 * Input is buffered up to 10 MB, and a longer unterminated line closes the
 * transport. send() waits for 'drain' when stdout is backed up.
 */
import process from 'node:process';
import type { Readable, Writable } from 'node:stream';
import { JSONRPCMessageSchema, type JSONRPCMessage } from './types.js';
import type { Transport } from './server.js';

const MAX_BUFFER_BYTES = 10 * 1024 * 1024;

export class StdioServerTransport implements Transport {
  onmessage?: (message: JSONRPCMessage) => void;
  onclose?: () => void;
  onerror?: (error: Error) => void;

  private buffer?: Buffer;
  private started = false;

  constructor(private readonly stdin: Readable = process.stdin, private readonly stdout: Writable = process.stdout) {}

  private readonly ondata = (chunk: Buffer): void => {
    try {
      const size = (this.buffer?.length ?? 0) + chunk.length;
      if (size > MAX_BUFFER_BYTES) {
        this.buffer = undefined;
        throw new Error(`ReadBuffer exceeded maximum size of ${MAX_BUFFER_BYTES} bytes`);
      }
      this.buffer = this.buffer ? Buffer.concat([this.buffer, chunk]) : chunk;
      this.drainLines();
    } catch (error) {
      this.onerror?.(error as Error);
      this.close().catch(() => {});
    }
  };

  private readonly onstreamerror = (error: Error): void => { this.onerror?.(error); };

  async start(): Promise<void> {
    if (this.started) throw new Error('StdioServerTransport already started');
    this.started = true;
    this.stdin.on('data', this.ondata);
    this.stdin.on('error', this.onstreamerror);
  }

  private drainLines(): void {
    for (;;) {
      if (!this.buffer) return;
      const index = this.buffer.indexOf('\n');
      if (index === -1) return;
      const line = this.buffer.toString('utf8', 0, index).replace(/\r$/, '');
      this.buffer = this.buffer.subarray(index + 1);
      try {
        this.onmessage?.(JSONRPCMessageSchema.parse(JSON.parse(line)) as JSONRPCMessage);
      } catch (error) {
        this.onerror?.(error as Error);
      }
    }
  }

  async close(): Promise<void> {
    this.stdin.off('data', this.ondata);
    this.stdin.off('error', this.onstreamerror);
    if (this.stdin.listenerCount('data') === 0) this.stdin.pause();
    this.buffer = undefined;
    this.onclose?.();
  }

  send(message: JSONRPCMessage): Promise<void> {
    return new Promise((resolve) => {
      if (this.stdout.write(JSON.stringify(message) + '\n')) resolve();
      else this.stdout.once('drain', resolve);
    });
  }
}
