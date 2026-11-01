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
- the server loading `puppeteer` (or any module) from somewhere other than where its own dependencies resolve or `PINEPAPER_PUPPETEER_FROM`, or running a child process other than the `ffprobe` read-back and the `ffmpeg` join described below.

The server's own defences, `PINEPAPER_ALLOW_PRIVATE_NETWORK` and `PINEPAPER_ASSET_DIRS`, are documented in the README. Bypassing either one is in scope.

## Dependencies

The package installs two runtime dependencies and nothing else:

- `zod`, for tool input schemas;
- `undici`, used only by the guarded fetch (`src/utils/safe-fetch.ts`) to pin each connection to the addresses that passed the private-network check, which closes DNS rebinding. Node's built-in `fetch` cannot be given that pinned resolver, so undici stays.

**Puppeteer is not a dependency**, not even an optional peer (it was one up to 1.6.25). It brings a browser download with an install script, shell access and a large network tree, and the browser tools are a minority of what the server does. Install it yourself to use them (`npm i puppeteer`, or `-p puppeteer` in the `npx` call; see the README). The server imports it by name only from where its own dependencies resolve, or from an absolute folder you set in `PINEPAPER_PUPPETEER_FROM`; never from its working directory, which can be an untrusted checkout. puppeteer 22 or newer is required and an older one is refused.

**Two binaries, one place.** Both run through `execFile` (no shell) from one file, `src/tools/export-file-receipt.ts`, with argument lists that file writes and absolute file paths. When an exported video is saved, `ffprobe` compares the file with what the studio encoded; it is skipped when `ffprobe` is not on `PATH`, and `PINEPAPER_FFPROBE=off` turns it off. When an export asks for `perScene`, `ffmpeg` joins the cached per-scene segments (`-f concat`, video copied, audio re-encoded); without `ffmpeg` on `PATH` the chain is exported whole instead.

The source contains no `eval` or `new Function`.

## What this package does and why

Supply-chain scanners list the capabilities a package's own code uses. This is each one, where it is in `src/`, and why it is there. `src/__tests__/unit/supply-chain-surface.test.ts` and `capability-footprint.test.ts` fail if any of it spreads to another file.

| Capability | Where | Why |
|---|---|---|
| **Network access** | `src/utils/safe-fetch.ts` (the guarded fetch); `src/assets/repositories/` (fixed icon hosts); `src/tools/handlers/generate.ts` (PinePaper Cloud, opt-in) | Importing an image, SVG or font by URL, and searching the free icon repositories. Every user-supplied URL goes through the guarded fetch: private, loopback and link-local addresses and cloud metadata endpoints are refused, and each connection is pinned to the address that passed the check (no DNS rebinding). Generation calls the PinePaper Cloud only when you set `PINEPAPER_API_KEY`; the key is sent only to the cloud URL (`https://cloud.pinepaper.studio`, or `PINEPAPER_CLOUD_URL` if you set it). |
| **Shell access** | `src/tools/export-file-receipt.ts`, only | `ffprobe` reads a saved video back to confirm it is what the studio encoded, and `ffmpeg` joins per-scene segments for a `perScene` export. Both run through `execFile` with argument lists the file writes: no shell, nothing from a tool call is interpreted as a command. Skipped when the binary is not on `PATH`; `PINEPAPER_FFPROBE=off` turns the read-back off. |
| **Environment variables** | `src/utils/env.ts` (the complete list, each read by its literal name); one literal read of `PINEPAPER_ALLOW_PRIVATE_NETWORK` in `safe-fetch.ts` | Configuration only: `PINEPAPER_*` settings (browser, tool surface, export folder, asset folders, timeouts, the opt-in cloud key) and the locale (`PINEPAPER_LOCALE`, `LC_ALL`, `LC_MESSAGES`, `LANG`). No value is sent anywhere except `PINEPAPER_API_KEY`, to the PinePaper Cloud, as above. |
| **Browser code** | `src/types/code-generator.ts` writes it; `src/browser/puppeteer-controller.ts` sends it | Each tool compiles to JavaScript that runs in PinePaper Studio, in a Chrome that puppeteer drives on your machine (or that you paste, in `code` mode). It is sent to that page over the DevTools protocol. Nothing is evaluated in the Node process: the source has no `eval`, `new Function`, `vm` or `inspector`. |
| **Dynamic import** | `src/browser/puppeteer-controller.ts`; `src/i18n/i18n-manager.ts` | Optional modules load on first use. `puppeteer` and `puppeteer-core` are imported by literal name, resolved from this package's own location (never the working directory, which can be an untrusted checkout). The one computed import is the file `PINEPAPER_PUPPETEER_FROM` points at, for strict pnpm/Yarn layouts, and only when you set it. Locale files load from a fixed table, so a locale name never becomes a file path. |
| **Async context** | `src/tools/handlers.ts` (`AsyncLocalStorage`) | Carries which tool is running to the check that a mutating call changed something, across concurrent calls. |

The package has no install scripts and two runtime dependencies (`zod`, `undici`).
