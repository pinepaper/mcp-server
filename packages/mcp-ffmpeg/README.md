# @pinepaper.studio/mcp-ffmpeg

Optional add-on for [`@pinepaper.studio/mcp-server`](https://www.npmjs.com/package/@pinepaper.studio/mcp-server).

With it installed beside the server, and `ffmpeg` / `ffprobe` on your PATH, the server can:

- export a scene chain per scene (`pinepaper_agent_export { perScene: true }`), re-rendering only the scenes that changed;
- read a saved video back with ffprobe and compare it with what the studio encoded (the export receipt's `probeCheck`).

Without it the server starts no processes at all: a per-scene export runs as one whole export, and the receipt says the file was not read back.

```bash
npx -y -p @pinepaper.studio/mcp-server -p @pinepaper.studio/mcp-ffmpeg pinepaper-mcp
```

The Claude Desktop extension (`.mcpb`) already includes it.

It runs only `ffmpeg` or `ffprobe`, through `execFile` (no shell), with arguments the server writes.
