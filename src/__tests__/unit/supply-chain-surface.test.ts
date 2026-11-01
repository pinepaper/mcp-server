/**
 * What a supply-chain scanner sees in the published package, held where a PR can break it.
 *
 * - The install tree is zod and undici, nothing else. Puppeteer was an OPTIONAL peer up to 1.6.25 and a scanner
 *   still counted its tree (a Chrome download behind an install script, shell access, eval, network): it is now
 *   loaded only if the user installed it, by a name held in a variable.
 * - It is never resolved from process.cwd(): an MCP client starts the server in whatever folder is open, which can
 *   be an untrusted checkout with a planted node_modules/puppeteer.
 * - The one child process is ffprobe, via execFile (no shell), from one file.
 * - No eval and no new Function in the source.
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
const SRC = sourceFiles(join(ROOT, 'src'));

describe('supply-chain surface', () => {
  test('the install tree is zod and undici; puppeteer is neither a dependency nor a peer', () => {
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(['undici', 'zod']);
    expect(pkg.peerDependencies).toBeUndefined();
    expect(pkg.peerDependenciesMeta).toBeUndefined();
    expect(pkg.optionalDependencies).toBeUndefined();
    for (const s of ['preinstall', 'install', 'postinstall']) expect(pkg.scripts?.[s]).toBeUndefined();
  });

  test('puppeteer is imported only by a name in a variable, and never resolved from process.cwd()', () => {
    for (const p of SRC) {
      const raw = readFileSync(p, 'utf8');
      // `import('puppeteer').Page` in a type position is erased by the build; a call is not.
      expect(raw).not.toMatch(/import\(\s*['"]puppeteer(-core)?['"]\s*\)(?!\.)/);
      expect(raw).not.toMatch(/^import\s+(?!type\b)[^;]*from\s+['"]puppeteer(-core)?['"]/m);
    }
    const controller = code(join(ROOT, 'src', 'browser', 'puppeteer-controller.ts'));
    expect(controller).not.toMatch(/createRequire\(\s*process\.cwd/);
    expect(controller).not.toMatch(/process\.cwd\(\)/);
  });

  test('the only child process is ffprobe through execFile, in export-file-receipt', () => {
    const users = SRC.filter((p) => /(from|import\(|require\()\s*['"](node:)?child_process['"]/.test(readFileSync(p, 'utf8')));
    expect(users.map((p) => p.slice(ROOT.length + 1))).toEqual(['src/tools/export-file-receipt.ts']);
    const receipt = readFileSync(users[0], 'utf8');
    expect(receipt).toMatch(/import \{ execFile \} from 'node:child_process'/);
    const body = code(users[0]);
    expect(body).not.toMatch(/\b(exec|execSync|spawn|spawnSync|fork)\b\s*\(/);
    expect(body).not.toMatch(/\bshell\s*:/);
    expect(body).toMatch(/execFile\(cmd, args, \{/);
  });

  test('no eval and no new Function in the source', () => {
    for (const p of SRC) {
      const c = code(p);
      expect(c).not.toMatch(/(^|[^.\w])eval\s*\(/);
      expect(c).not.toMatch(/new\s+Function\s*\(/);
    }
  });
});
