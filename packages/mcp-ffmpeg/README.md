# packages/mcp-ffmpeg (internal, not published)

The only code that runs `ffmpeg` / `ffprobe`. It is **not on npm** and is not a dependency of
`@pinepaper.studio/mcp-server`: `scripts/build-mcpb.mjs` copies it into the Claude Desktop extension's
`node_modules`, so the extension can

- export a scene chain per scene (`pinepaper_agent_export { perScene: true }`), re-rendering only what changed;
- read a saved video back with ffprobe and compare it with what the studio encoded (the receipt's `probeCheck`).

The npm package runs no external programs: there, a per-scene export runs as one whole export, and the receipt says
the file was not read back. It runs only `ffmpeg` or `ffprobe`, through `execFile` (no shell), with arguments the
server writes. `private: true` keeps it from being published by accident.
