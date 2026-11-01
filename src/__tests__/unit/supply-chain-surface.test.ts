/**
 * What a supply-chain scanner sees in the published package, held where a PR can break it.
 *
 * - The install tree is zod and undici, nothing else. Puppeteer was an OPTIONAL peer up to 1.6.25 and a scanner
 *   still counted its tree (a Chrome download behind an install script, shell access, eval, network): it is now
 *   loaded only if the user installed it.
 * - Every module specifier is a literal. puppeteer and puppeteer-core are imported as `import('puppeteer')`, which
 *   Node resolves from the importing file's own node_modules chain — never from process.cwd(), where an MCP client
 *   may have opened an untrusted checkout with a planted node_modules/puppeteer. The one import of a computed path is
 *   the file PINEPAPER_PUPPETEER_FROM points at, resolved from that literal name.
 * - Locale files load from a table of literal imports, so a locale name never becomes a module path.
 * - The environment is read only in utils/env.ts (and one literal read in safe-fetch.ts), each variable by its
 *   literal name: no `process.env[name]`.
 * - The only child processes are ffprobe and ffmpeg, via execFile (no shell), from one file.
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
  test('the install tree is zod and undici; puppeteer is neither a dependency nor a peer', () => {
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(['undici', 'zod']);
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
    expect(raw).toMatch(/req\.resolve\('puppeteer'\)/);
    expect(raw).toMatch(/req\.resolve\('puppeteer-core'\)/);
    const controller = code(join(ROOT, 'src', 'browser', 'puppeteer-controller.ts'));
    expect(controller).not.toMatch(/createRequire\(\s*process\.cwd/);
    expect(controller).not.toMatch(/process\.cwd\(\)/);
  });

  test('every import() names a literal module, except the PINEPAPER_PUPPETEER_FROM file URL', () => {
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
    expect(computed).toEqual(['src/browser/puppeteer-controller.ts: import(pathToFileURL(entry)']);
  });

  test('locale files load from a table of literal imports', () => {
    const raw = readFileSync(join(ROOT, 'src', 'i18n', 'i18n-manager.ts'), 'utf8');
    expect(raw).toMatch(/'en': \(\) => import\('\.\/locales\/en\.js'\),/);
    expect(raw).not.toMatch(/import\(\s*`/);
  });

  test('the environment is read by literal names, in utils/env.ts and one line of safe-fetch.ts', () => {
    const readers = SRC.filter((p) => /process\.env/.test(code(p))).map((p) => p.slice(ROOT.length + 1)).sort();
    expect(readers).toEqual(['src/utils/env.ts', 'src/utils/safe-fetch.ts']);
    for (const p of SRC) expect(code(p)).not.toMatch(/process\.env\s*(\?\.)?\s*\[/);
    const fetchReads = [...code(join(ROOT, 'src', 'utils', 'safe-fetch.ts')).matchAll(/process\.env\??\.(\w+)/g)].map((m) => m[1]);
    expect([...new Set(fetchReads)]).toEqual(['PINEPAPER_ALLOW_PRIVATE_NETWORK']);
    // Every env('NAME') call names a variable in the table, so the table is the whole list.
    const table = readFileSync(join(ROOT, 'src', 'utils', 'env.ts'), 'utf8');
    const listed = new Set([...table.matchAll(/^\s+(\w+): \(\) => process\.env\.(\w+),$/gm)].map((m) => { expect(m[1]).toBe(m[2]); return m[1]; }));
    for (const p of SRC) {
      for (const m of noComments(p).matchAll(/(?<![\w.])env\(\s*([^)]*)\)/g)) {
        if (/function env\(/.test(m[0]) || m[1].startsWith('name')) continue;
        const name = m[1].match(/^'([A-Z_]+)'$/)?.[1];
        expect(name && listed.has(name) ? name : `${p.slice(ROOT.length + 1)}: env(${m[1]})`).toBe(name as string);
      }
    }
  });

  test('the only child processes are ffprobe and ffmpeg through execFile, in export-file-receipt', () => {
    const users = SRC.filter((p) => /(from|import\(|require\()\s*['"](node:)?child_process['"]/.test(readFileSync(p, 'utf8')));
    expect(users.map((p) => p.slice(ROOT.length + 1))).toEqual(['src/tools/export-file-receipt.ts']);
    const receipt = readFileSync(users[0], 'utf8');
    expect(receipt).toMatch(/import \{ execFile \} from 'node:child_process'/);
    const body = code(users[0]);
    expect(body).not.toMatch(/\b(exec|execSync|spawn|spawnSync|fork)\b\s*\(/);
    expect(body).not.toMatch(/\bshell\s*:/);
    expect(body).toMatch(/execFile\(cmd, args, \{/);
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
