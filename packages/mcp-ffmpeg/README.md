# @pinepaper.studio/mcp-ffmpeg

An optional add-on for [`@pinepaper.studio/mcp-server`](https://www.npmjs.com/package/@pinepaper.studio/mcp-server).
It contains no FFmpeg: it starts the `ffmpeg` and `ffprobe` you installed on `PATH`.

The server package starts no external programs. This add-on is the only code that does, kept separate so that
installing it is the opt-in. With it (and ffmpeg on `PATH`), the server can:

- deliver an MP4 with AAC audio where the browser could only encode Opus (Chromium on Linux has no AAC encoder),
  so WhatsApp, Instagram and other players accept it, and meet `audioCodec: 'aac'`;
- read a saved video back with ffprobe and compare it with what the studio encoded (the receipt's `probeCheck`);
- export a scene chain per scene (`perScene: true`), re-rendering only what changed;
- hold a bitrate cap (`enforceBitrate: true`).

## Install

Beside the server, so the server finds it the way it finds its own dependencies:

```sh
npx -p @pinepaper.studio/mcp-server -p @pinepaper.studio/mcp-ffmpeg pinepaper-mcp
# or, where the server is installed:
npm install @pinepaper.studio/mcp-ffmpeg
```

The Claude Desktop extension already bundles it.

## What it runs

`run(cmd, args, timeout)` runs only `ffmpeg` or `ffprobe`, through `execFile` (no shell), with an argument array the
server writes (file paths made absolute first, so none can be read as an option or an ffmpeg protocol). Anything
else is refused before a process starts.
