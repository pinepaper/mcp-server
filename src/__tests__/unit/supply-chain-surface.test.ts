/**
 * What a supply-chain scanner sees in the published package, held where a PR can break it.
 *
 * - The install tree is zod, nothing else (undici went in 1.6.29: safe-fetch pins node:http itself). Puppeteer was an OPTIONAL peer up to 1.6.25 and a scanner
 *   still counted its tree (a Chrome download behind an install script, shell access, eval, network): it is now
 *   loaded only if the user installed it.
 * - Every module specifier is a literal, with one named exception. puppeteer and puppeteer-core are imported as
 *   `import('puppeteer')`, which Node resolves from the importing file's own node_modules chain — never from
 *   process.cwd(), where an MCP client may have opened an untrusted checkout with a planted node_modules/puppeteer.
 *   PINEPAPER_PUPPETEER_FROM requires the same literal names from the folder the user named (createRequire; require()
 *   of ESM needs Node ≥ 22.12, and engines says ≥ 22.13). The exception is the ffmpeg add-on, whose name is held in a
 *   variable so the published package never names a package it does not ship.
 * - Locale files load from a table of literal imports, so a locale name never becomes a module path.
 * - The environment is read only in utils/env.ts, once, for a name on its list (and one literal read in
 *   safe-fetch.ts). Not one literal read per name: Socket counts each read as a finding.
 * - The package starts no process. ffprobe and ffmpeg run through packages/mcp-ffmpeg, which is never published
 *   (private) and only the .mcpb bundles; it is never a dependency. The add-on runs those two binaries only, via
 *   execFile (no shell).
 * - No eval, new Function, Function(), vm, inspector, debugger, Reflect, or require() in the source.
 */
import { describe, expect, test } from 'bun:test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dir, '..', '..', '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === '__tests__') continue;
    if (statSync(p).isDirectory()) out.push(...sourceFiles(p));
    else if (name.endsWith('.ts')) out.push(p);
  }
  return out;
}
/** Source with comments and string literals blanked, so a sentence ABOUT eval is not an eval. */
function code(p: string): string {
  return readFileSync(p, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`/g, "''");
}
/** Source with comments removed and strings kept, for checks that read a literal's contents. */
function noComments(p: string): string {
  return readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}
const SRC = sourceFiles(join(ROOT, 'src'));

describe('supply-chain surface', () => {
  test('the install tree is zod; puppeteer is neither a dependency nor a peer', () => {
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(['zod']);
    expect(pkg.peerDependencies).toBeUndefined();
    expect(pkg.peerDependenciesMeta).toBeUndefined();
    expect(pkg.optionalDependencies).toBeUndefined();
    for (const s of ['preinstall', 'install', 'postinstall']) expect(pkg.scripts?.[s]).toBeUndefined();
  });

  test('puppeteer is imported by literal specifiers from this package, and never resolved from process.cwd()', () => {
    for (const p of SRC) {
      // A static import would load puppeteer at start-up and make it required; `import type` is erased by the build.
      expect(readFileSync(p, 'utf8')).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+['"]puppeteer(-core)?['"]/m);
    }
    const raw = readFileSync(join(ROOT, 'src', 'browser', 'puppeteer-controller.ts'), 'utf8');
    expect(raw).toMatch(/importHere: \(\): Promise<unknown> => import\('puppeteer'\),/);
    expect(raw).toMatch(/importHere: \(\): Promise<unknown> => import\('puppeteer-core'\),/);
    // PINEPAPER_PUPPETEER_FROM: the same literal names, required from the folder the user named (Node ≥ 22.13).
    expect(raw).toMatch(/requireFrom: \(req: NodeRequire\): unknown => req\('puppeteer'\),/);
    expect(raw).toMatch(/requireFrom: \(req: NodeRequire\): unknown => req\('puppeteer-core'\),/);
    const controller = code(join(ROOT, 'src', 'browser', 'puppeteer-controller.ts'));
    expect(controller).not.toMatch(/createRequire\(\s*process\.cwd/);
    expect(controller).not.toMatch(/process\.cwd\(\)/);
  });

  test('every import() names a literal module, except the ffmpeg add-on', () => {
    const computed: string[] = [];
    for (const p of SRC) {
      const raw = noComments(p);
      // A template literal with a substitution is a computed name, even though it is quoted.
      if (/\bimport\(\s*`[^`]*\$\{/.test(raw)) computed.push(`${p.slice(ROOT.length + 1)}: template import`);
      // With strings blanked, a literal import reads import('') ; anything else is computed.
      for (const m of code(p).matchAll(/(?<![\w.])import\(\s*([^'\s)][^)]*)\)/g)) {
        computed.push(`${p.slice(ROOT.length + 1)}: import(${m[1]})`);
      }
    }
    expect(computed).toEqual(['src/tools/export-file-receipt.ts: import(spec)']);
  });

  test('locale files load from a table of literal imports', () => {
    const raw = readFileSync(join(ROOT, 'src', 'i18n', 'i18n-manager.ts'), 'utf8');
    expect(raw).toMatch(/'en': \(\) => import\('\.\/locales\/en\.js'\),/);
    expect(raw).not.toMatch(/import\(\s*`/);
  });

  test('the environment is read once, in utils/env.ts, only for a listed name; and one literal line of safe-fetch.ts', () => {
    const readers = SRC.filter((p) => /process\.env/.test(code(p))).map((p) => p.slice(ROOT.length + 1)).sort();
    expect(readers).toEqual(['src/utils/env.ts', 'src/utils/safe-fetch.ts']);
    // One read, not one per name: Socket counts each read as a finding (31 on 1.6.31, the 83 → 81 drop).
    const envSrc = code(join(ROOT, 'src', 'utils', 'env.ts'));
    expect(envSrc.match(/process\.env/g)?.length).toBe(1);
    expect(envSrc).toMatch(/vars && LISTED\.has\(name\) \? vars\[name\] : undefined/);
    for (const p of SRC) expect(code(p)).not.toMatch(/process\.env\s*(\?\.)?\s*\[/);
    const fetchReads = [...code(join(ROOT, 'src', 'utils', 'safe-fetch.ts')).matchAll(/process\.env\??\.(\w+)/g)].map((m) => m[1]);
    expect([...new Set(fetchReads)]).toEqual(['PINEPAPER_ALLOW_PRIVATE_NETWORK']);
    // Every env('NAME') call names a variable in the list, so the list is the whole list.
    const table = readFileSync(join(ROOT, 'src', 'utils', 'env.ts'), 'utf8');
    const list = table.slice(table.indexOf('const NAMES = ['), table.indexOf('] as const;'));
    const listed = new Set([...list.matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]));
    expect(listed.size).toBeGreaterThan(25);
    for (const p of SRC) {
      for (const m of noComments(p).matchAll(/(?<![\w.])env\(\s*([^)]*)\)/g)) {
        if (/function env\(/.test(m[0]) || m[1].startsWith('name')) continue;
        const name = m[1].match(/^'([A-Z_]+)'$/)?.[1];
        expect(name && listed.has(name) ? name : `${p.slice(ROOT.length + 1)}: env(${m[1]})`).toBe(name as string);
      }
    }
  });

  test('no child process in the package; the add-on runs only ffmpeg / ffprobe through execFile', () => {
    const users = SRC.filter((p) => /(from|import\(|require\()\s*['"](node:)?child_process['"]/.test(readFileSync(p, 'utf8')));
    expect(users).toEqual([]);
    expect(Object.keys(pkg.dependencies ?? {})).not.toContain('@pinepaper.studio/mcp-ffmpeg');
    expect(Object.keys(pkg.optionalDependencies ?? {})).not.toContain('@pinepaper.studio/mcp-ffmpeg');
    const receipt = readFileSync(join(ROOT, 'src', 'tools', 'export-file-receipt.ts'), 'utf8');
    expect(receipt).toMatch(/const spec = FFMPEG_ADDON;[\s\S]*await import\(spec\)/);
    expect(JSON.parse(readFileSync(join(ROOT, 'packages', 'mcp-ffmpeg', 'package.json'), 'utf8')).private).toBe(true);
    const addon = readFileSync(join(ROOT, 'packages', 'mcp-ffmpeg', 'index.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(addon).toMatch(/import \{ execFile \} from 'node:child_process'/);
    expect(addon).not.toMatch(/\b(exec|execSync|spawn|spawnSync|fork)\b\s*\(/);
    expect(addon).not.toMatch(/\bshell\s*:/);
    expect(addon).toMatch(/new Set\(\['ffmpeg', 'ffprobe'\]\)/);
  });

  test('no package carries FFmpeg or an encoder, as the README tells users', () => {
    const addonDir = join(ROOT, 'packages', 'mcp-ffmpeg');
    const addonPkg = JSON.parse(readFileSync(join(addonDir, 'package.json'), 'utf8'));
    const names = [pkg, addonPkg].flatMap((p) => Object.keys({ ...p.dependencies, ...p.optionalDependencies, ...p.peerDependencies }));
    expect(names.filter((n) => /ffmpeg|ffprobe|x264|openh264|h\.?264/i.test(n))).toEqual([]);
    expect(Object.keys(addonPkg.dependencies ?? {})).toEqual([]);
    expect(readdirSync(addonDir).sort()).toEqual(['LICENSE', 'README.md', 'index.d.ts', 'index.js', 'package.json']);
    expect(readFileSync(join(ROOT, 'README.md'), 'utf8')).toContain('PinePaper does not\nprovide an FFmpeg build');
  });

  test('the add-on refuses any other binary before a process starts', async () => {
    const { run } = await import('../../../packages/mcp-ffmpeg/index.js');
    expect(await run('sh' as never, ['-c', 'echo hi'])).toMatchObject({ ok: false, stderr: expect.stringContaining('refused') });
    expect(await run('ffmpeg', [1 as never])).toMatchObject({ ok: false });
  });

  test('no eval, Function(), vm, inspector, debugger, Reflect or require() in the source', () => {
    for (const p of SRC) {
      const c = code(p);
      const where = p.slice(ROOT.length + 1);
      expect([where, c]).not.toEqual([where, expect.stringMatching(/(^|[^.\w])eval\s*\(/)]);
      expect([where, c]).not.toEqual([where, expect.stringMatching(/(^|[^.\w])(new\s+)?Function\s*\(/)]);
      expect([where, c]).not.toEqual([where, expect.stringMatching(/\bReflect\s*\.|\bdebugger\b|(^|[^.\w])require\s*\(/)]);
      expect([where, c]).not.toEqual([where, expect.stringMatching(/\bglobalThis\s*\[/)]);
      const raw = noComments(p);
      expect([where, raw]).not.toEqual([where, expect.stringMatching(/['"](node:)?(vm|inspector|v8)['"]/)]);
    }
  });
});
