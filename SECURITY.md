# Security policy

## Reporting a vulnerability

Please report security issues privately, through GitHub's private vulnerability reporting:

**[Report a vulnerability](https://github.com/pinepaper/mcp-server/security/advisories/new)**

Please don't open a public issue, pull request or discussion for a security problem. A private report reaches the maintainers without exposing users before a fix is out.

A useful report includes:

- the version of `@pinepaper.studio/mcp-server` (`npx @pinepaper.studio/mcp-server --version`, or the version in your MCP client's config);
- the tool call or input that triggers it, and what happens as a result;
- the execution mode (`puppeteer` or `code`) and any `PINEPAPER_*` environment variables you set;
- what an attacker gains, and what they need to control to get it (for example, a URL in a tool call, a file on disk, or a web page the server visits).

You don't need a working exploit. If you aren't sure whether something counts, report it anyway.

## What happens next

The report becomes a draft security advisory that only you and the maintainers can see. We follow up in that thread: to confirm the issue, ask questions, and tell you which release fixes it. Once a fixed version is published to npm, we publish the advisory with the affected and fixed versions, and request a CVE for it. With your agreement, we credit you by name.

## Supported versions

Fixes ship in a new patch release of the latest version. Older versions do not get backported fixes, so upgrade to the latest release to pick one up:

```
npm install @pinepaper.studio/mcp-server@latest
```

## Scope

This package is an MCP server that runs on your machine and drives PinePaper Studio in a browser page.

**Executing JavaScript in the studio page is the design, not a vulnerability.** Every tool compiles to a snippet that runs against your canvas, and `pinepaper_execute_custom_code` runs a snippet the agent writes. The README's [security section](README.md#security-yes-it-executes-code) explains what runs where, and how `code` mode avoids executing anything.

Examples of what is in scope:

- the server process fetching what it should not, such as private or loopback addresses or cloud metadata endpoints (server-side request forgery);
- reading or writing files outside the folders the server is allowed to use (path traversal);
- tool input that escapes the generated snippet and runs in the server process instead of the page;
- exposing a credential such as `PINEPAPER_API_KEY`, or sending it somewhere it should not go;
- a crash or hang of the server caused by a single crafted tool call;
- the server loading `puppeteer` (or any module) from somewhere other than where its own dependencies resolve or `PINEPAPER_PUPPETEER_FROM`, or starting a child process (it starts none; the optional add-on runs only the `ffprobe` read-back and the `ffmpeg` join described below);
- running caller-written JavaScript, or reading a local file outside the export folder, on a server started without `PINEPAPER_ALLOW_CODE=1` / `PINEPAPER_ALLOW_LOCAL_FILES=1`.

The server's own defences, `PINEPAPER_ALLOW_CODE`, `PINEPAPER_ALLOW_LOCAL_FILES`, `PINEPAPER_ALLOW_PRIVATE_NETWORK` and `PINEPAPER_ASSET_DIRS`, are documented in the README. Bypassing any of them is in scope.

## Dependencies

The package installs two runtime dependencies and nothing else:

- `zod`, for tool input schemas;
- `undici`, used only by the guarded fetch (`src/utils/safe-fetch.ts`) to pin each connection to the addresses that passed the private-network check, which closes DNS rebinding. Node's built-in `fetch` cannot be given that pinned resolver, so undici stays.

**Puppeteer is not a dependency**, not even an optional peer (it was one up to 1.6.25). It brings a browser download with an install script, shell access and a large network tree, and the browser tools are a minority of what the server does. Install it yourself to use them (`npm i puppeteer`, or `-p puppeteer` in the `npx` call; see the README). The server imports it by name only from where its own dependencies resolve, or from an absolute folder you set in `PINEPAPER_PUPPETEER_FROM`; never from its working directory, which can be an untrusted checkout. puppeteer 22 or newer is required and an older one is refused.

**No child process in the package.** `ffprobe` and `ffmpeg` run through the optional add-on `@pinepaper.studio/mcp-ffmpeg` (`packages/mcp-ffmpeg` in this repo), which is not a dependency: the server loads it by name only if it is installed. The add-on runs those two binaries and nothing else, through `execFile` (no shell), with argument lists `src/tools/export-file-receipt.ts` writes and absolute file paths. Without the add-on both features are unavailable and the server says so. When an exported video is saved, `ffprobe` compares the file with what the studio encoded; it is skipped when the add-on or `ffprobe` is missing, and `PINEPAPER_FFPROBE=off` turns it off. When an export asks for `perScene`, `ffmpeg` joins the cached per-scene segments (`-f concat`, video copied, audio re-encoded); without the add-on or `ffmpeg` the chain is exported whole instead.

The source contains no `eval` or `new Function`.
