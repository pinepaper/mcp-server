#!/usr/bin/env node
/**
 * Generate src/vendor/design/*.ts from mcp-cloud's TypeScript sources.
 *
 * WHY THESE LIVE HERE AND NOT IN THE ENGINE. The style generators and the DTCG
 * token store are knowledge an LLM uses to compose a scene, not machinery the
 * canvas needs to draw one. Putting them in FxTool would bulk up the editor
 * with a design vocabulary its users never see or ask for. They belong on the
 * tool surface, and because the hosted service RUNS this server, a copy here
 * is the copy the cloud ends up using too — which is what makes the cloud's
 * own runtime copy redundant rather than a second authority.
 *
 * MECHANICAL, NOT A PORT — deliberately the same shape as FxTool's
 * scripts/sync-stick-modules.mjs, which generates js/vendor/stick/*.js from the
 * same sibling repo. That one runs esbuild's `ts` loader because the engine
 * bundle cannot consume TypeScript. This one does not need to: mcp-server IS
 * TypeScript, so the transform is a copy plus a header, and the only textual
 * edit is repointing the single type-only import at the extracted union below.
 * Every edit is applied by rule, described here, and asserted by the test.
 *
 * Each output carries a sha256 of the source it came from. Two guards read it:
 * src/__tests__/unit/design-systems.test.ts asserts every vendored file still
 * carries a header and a hash, and `bun run check:design` — wired into
 * prepublishOnly — regenerates and byte-compares whenever the sibling repo is
 * present. Drift becomes a failing build rather than a style that renders
 * slightly wrong in one of two places.
 *
 * Those are different checks and both are needed: the test runs everywhere and
 * proves the files are generated, while only check:design can prove they match
 * TODAY'S upstream, and it can only do that where mcp-cloud is checked out.
 *
 *   node scripts/sync-design-systems.mjs [--check]
 *
 * `--check` regenerates into memory and exits non-zero on any difference,
 * without writing.
 *
 * The cleaner long-term answer is the authored copy moving HERE and the cloud
 * importing this package, at which point this script is deleted rather than
 * unpicked. It exists so the work is not blocked on that move, and so nobody
 * transcribes three thousand lines of geometry by hand in the meantime.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const OUT_DIR = join(REPO, 'src', 'vendor', 'design');

/** Where the authored TypeScript lives. Overridable for CI or a checkout elsewhere. */
export const UPSTREAM_DIR = process.env.PP_MCP_CLOUD_DIR
  ? join(process.env.PP_MCP_CLOUD_DIR, 'src', 'services')
  : resolve(REPO, '..', 'mcp-cloud', 'src', 'services');

/** Self-contained modules, copied whole. */
export const MODULES = ['design-systems-dtcg'];

/**
 * The upstream repo root, for reading COMMITTED state rather than the tree.
 *
 * mcp-cloud is a live checkout with its own sessions editing it. Vendoring from
 * the working tree means a file being written right now can land here — and an
 * UNTRACKED file, which is work in progress by definition, would be mirrored as
 * though it were published. It also makes this sync non-reproducible: two runs
 * minutes apart can differ for reasons that have nothing to do with this repo.
 *
 * Same fix as scripts/sync-engine-surface.mjs, which hit this against FxTool.
 */
const UPSTREAM_REPO = resolve(UPSTREAM_DIR, '..', '..');

/** Is this path committed upstream? An untracked file is not ready to vendor. */
export function isTracked(relPath) {
  try {
    execFileSync('git', ['-C', UPSTREAM_REPO, 'ls-files', '--error-unmatch', relPath],
      { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/** Every *-generator.ts upstream, discovered rather than listed — a new style
 *  should arrive by being written, not by someone remembering to edit an array.
 *  Untracked files are skipped: unpublished work is not a style this ships. */
export function discoverGenerators() {
  if (!existsSync(UPSTREAM_DIR)) return [];
  return readdirSync(UPSTREAM_DIR)
    .filter((f) => f.endsWith('-generator.ts') && !f.startsWith('typesafe-'))
    .filter((f) => isTracked(join('src', 'services', f)))
    .map((f) => basename(f, '.ts'))
    .sort();
}

/**
 * The ONE textual edit: the generators import `DesignStyle` as a type from
 * content-recipes, a 900-line module of unrelated cloud concerns. Repointed at
 * the union extracted below, so the vendored set stays the design systems and
 * not the cloud's service layer.
 */
function repointStyleImport(code) {
  return code.replace(
    /import type \{ DesignStyle \} from ["']\.\/content-recipes["'];?/g,
    'import type { DesignStyle } from "./design-style.js";'
  );
}

function header(sourceName, sha) {
  return `/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/${sourceName}
 * sha256:    ${sha}
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
`;
}

const sha256 = (s) => createHash('sha256').update(s).digest('hex');

export function generate(name) {
  const src = readFileSync(join(UPSTREAM_DIR, name + '.ts'), 'utf8');
  return header(name + '.ts', sha256(src)) + repointStyleImport(src);
}

/**
 * The DesignStyle union, sliced out of content-recipes by rule.
 *
 * Extracted rather than copied whole because the rest of that module is cloud
 * service plumbing. The slice is a regex over an exported type alias — if the
 * declaration is ever reshaped so this cannot find it, the generator fails
 * loudly instead of emitting a stale union.
 */
export function generateStyleUnion() {
  const path = join(UPSTREAM_DIR, 'content-recipes.ts');
  const src = readFileSync(path, 'utf8');
  const m = /export type DesignStyle =[\s\S]*?;\n/.exec(src);
  if (!m) {
    throw new Error(
      'sync-design-systems: could not find `export type DesignStyle` in content-recipes.ts. ' +
      'The declaration moved or changed shape — fix the slice rather than letting a stale union ship.'
    );
  }
  // A RUNTIME COPY OF THE UNION, emitted beside the type.
  //
  // ALL_STYLES in src/design/design-systems.ts used to be hand-written, and
  // when the upstream union gained embroidery_tapestry and woven_textile the
  // list did not — so two styles the vocabulary declares were invisible to
  // list_styles, and nothing failed, because a TYPE cannot be checked against a
  // hand-written array at runtime. Emitting the members as data means the
  // surface is derived from the same slice as the type.
  const members = [...m[0].matchAll(/"([a-z0-9_]+)"/g)].map((x) => x[1]);
  return header('content-recipes.ts (DesignStyle union only)', sha256(src))
    + '\n/** Every aesthetic style the generators speak. Sliced from the upstream union. */\n'
    + m[0]
    + `\n\n/** The same ${members.length} styles as DATA, so a runtime list cannot drift from the type. */\n`
    + `export const DESIGN_STYLES: readonly DesignStyle[] = Object.freeze([\n`
    + members.map((v) => `  '${v}',`).join('\n')
    + `\n]);\n`;
}

function main() {
  const check = process.argv.includes('--check');
  if (!existsSync(UPSTREAM_DIR)) {
    console.error(`sync-design-systems: no upstream at ${UPSTREAM_DIR}`);
    console.error('Set PP_MCP_CLOUD_DIR, or check out mcp-cloud beside this repo.');
    process.exit(check ? 0 : 1); // --check is a no-op without the sibling, not a failure
  }

  const outputs = new Map();
  outputs.set('design-style.ts', generateStyleUnion());
  for (const name of [...MODULES, ...discoverGenerators()]) {
    outputs.set(name + '.ts', generate(name));
  }

  if (!check) mkdirSync(OUT_DIR, { recursive: true });

  let drifted = 0;
  for (const [file, content] of outputs) {
    const dest = join(OUT_DIR, file);
    const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
    if (current === content) continue;
    drifted++;
    if (check) {
      console.error(`DRIFT: ${file} differs from its upstream`);
    } else {
      writeFileSync(dest, content);
      console.log(`${current === null ? 'wrote' : 'updated'}: src/vendor/design/${file}`);
    }
  }

  if (check && drifted) {
    console.error(`\n${drifted} vendored file(s) differ. Run: bun run sync:design`);
    process.exit(1);
  }
  console.log(check ? '✅ vendored design systems match upstream' : `✅ ${outputs.size} file(s) in sync`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
