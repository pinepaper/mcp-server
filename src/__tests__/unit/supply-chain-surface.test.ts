/**
 * What a supply-chain scanner sees in the published package, held where a PR can break it.
 *
 * - The install tree is zod, nothing else (undici went in 1.6.29: safe-fetch pins node:http itself). Puppeteer was an OPTIONAL peer up to 1.6.25 and a scanner
 *   still counted its tree (a Chrome download behind an install script, shell access, eval, network): it is now
 *   loaded only if the user installed it, by a name held in a variable.
 * - It is never resolved from process.cwd(): an MCP client starts the server in whatever folder is open, which can
 *   be an untrusted checkout with a planted node_modules/puppeteer.
 * - The package starts no process. ffprobe and ffmpeg run through packages/mcp-ffmpeg, which is never published
 *   (private) and only the .mcpb bundles; it is loaded by a name held in a variable and is never a dependency. The add-on runs those two binaries only, via execFile (no shell).
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
  test('the install tree is zod; puppeteer is neither a dependency nor a peer', () => {
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(['zod']);
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

  test('the add-on refuses any other binary before a process starts', async () => {
    const { run } = await import('../../../packages/mcp-ffmpeg/index.js');
    expect(await run('sh' as never, ['-c', 'echo hi'])).toMatchObject({ ok: false, stderr: expect.stringContaining('refused') });
    expect(await run('ffmpeg', [1 as never])).toMatchObject({ ok: false });
  });

  test('no eval and no new Function in the source', () => {
    for (const p of SRC) {
      const c = code(p);
      expect(c).not.toMatch(/(^|[^.\w])eval\s*\(/);
      expect(c).not.toMatch(/new\s+Function\s*\(/);
    }
  });
});
