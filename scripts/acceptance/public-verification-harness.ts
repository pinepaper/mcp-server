/**
 * PinePaper Studio Public Verification Harness
 *
 * Competitor-free public verification CLI for external agents and CI:
 *   - `--offline` (fast, zero Chrome/ffmpeg):
 *       1. Competitor leakage gate (0 restricted terms in mcp-server; optional `--partner-fxtool <dir>`)
 *       2. Default `core` MCP toolkit preserved (`DEFAULT_TOOLKIT === 'core'`, MCP initialize + tools/list without `PINEPAPER_TOOLKIT`)
 *       3. `PINEPAPER_TOOLKIT=lane` contract size (`tools/list <= 21,500 B`, contract text `<= 10,000 tok`, 8 tools)
 *       4. `T2` (`<= 3,500 B` / `<= 875 tok`) and `N1–N4` (`< 150 tok` C_total) byte/token + codegen compilation
 *       5. 9-way `anchor` parity (`top-left`, `top`, `top-right`, `left`, `center`, `centre`, `right`, `bottom-left`, `bottom`, `bottom-right` accepted; invalid rejected listing all 9)
 *       6. Declarative `pattern` + GSAP-JSON `timeline` composition & atomic rollback
 *       7. Strict `relationOptions` validation (`orbits` + `angle: 45` rejected with `"did you mean"` -> `"phaseDegrees"`)
 *       8. CLI `init` (`create_many` + `timeline` + `pattern`), `setup` (`core` default + `--toolkit lane` + `cloud`), and `check --offline`
 *
 *   - `--studio-dist <dir>` (or `PINEPAPER_STUDIO_URL`) runs all offline checks PLUS serialized live Studio checks:
 *       1. `agent-lane-t1.ts --scripted` + `--scripted-naive` negative control
 *       2. `agent-lane-t2.ts --scripted` (including `N1–N4` delta edits & `ffprobe`/`ffmpeg` pixel checks)
 *       3. Live `pinepaper_lint_scene` & `pinepaper-mcp check` (`COLLAPSED_GROUP` + `UNINTENDED_OVERLAP` warnings)
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
// @ts-ignore - JS helper script in scripts/
import { scanDirectoryForCompetitors } from '../check-no-competitors.mjs';
import { runCliCommand } from '../../src/cli/index.js';
import { createServer } from '../../src/index.js';
import { PINEPAPER_TOOLS, getToolsForVerbosity } from '../../src/tools/definitions.js';
import { handleToolCall } from '../../src/tools/handlers.js';
import { LANE_INSTRUCTIONS, LANE_TOOL_NAMES, laneContractText } from '../../src/tools/lane.js';
import { DEFAULT_TOOLKIT, detectVerbosityFromEnvironment, getToolsForToolkit } from '../../src/tools/toolkits.js';
import { codeGenerator } from '../../src/types/code-generator.js';
import { CreateItemInputSchema } from '../../src/types/schemas.js';
import { serveStudio } from './serve-studio.js';
import {
  buildN1ToN4Deltas,
  buildT2Batch,
  callTool,
  type CheckResult,
  LINT_TEST_SCENES,
  measureBytesAndTokens,
  REPO_ROOT,
  startMcpSession,
} from './verify-helpers.js';

const CODE_OPTS = { executionMode: 'code' as const, isConnected: false };

export interface HarnessCheck extends CheckResult {
  phase: 'offline' | 'studio';
}

export interface HarnessReport {
  ok: boolean;
  mode: 'offline' | 'studio';
  passed: number;
  failed: number;
  checks: HarnessCheck[];
}

function extractJsBlock(res: { isError?: boolean; content: Array<{ type: string; text?: string }> }): string {
  if (res.isError) throw new Error(`Expected code-mode success, got error: ${JSON.stringify(res.content)}`);
  const text = res.content.map((c) => c.text ?? '').join('\n');
  const match = text.match(/```javascript\n([\s\S]*?)\n```/);
  if (!match) throw new Error(`No javascript code block returned: ${text.slice(0, 300)}`);
  return match[1];
}

async function captureCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const out: string[] = [];
  const err: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...a: unknown[]) => out.push(a.map(String).join(' '));
  console.error = (...a: unknown[]) => err.push(a.map(String).join(' '));
  try {
    const code = await runCliCommand(args);
    return { code, stdout: out.join('\n'), stderr: err.join('\n') };
  } finally {
    console.log = origLog;
    console.error = origErr;
  }
}

export async function runOfflineChecks(opts: { partnerFxtool?: string } = {}): Promise<HarnessCheck[]> {
  const checks: HarnessCheck[] = [];
  const record = (name: string, ok: boolean, detail: string) => checks.push({ phase: 'offline', name, ok, detail });

  // 1. Competitor leakage gate
  try {
    const repoScan = scanDirectoryForCompetitors(REPO_ROOT);
    record(
      'competitor leakage (mcp-server)',
      repoScan.matches.length === 0,
      repoScan.matches.length === 0
        ? `0 matches across ${repoScan.scannedFiles} files`
        : `${repoScan.matches.length} match(es): ${repoScan.matches.map((m: { file: string; line: number }) => `${m.file}:${m.line}`).slice(0, 5).join(', ')}`,
    );

    if (opts.partnerFxtool) {
      const fxScan = scanDirectoryForCompetitors(resolve(opts.partnerFxtool), { forceWalk: true });
      record(
        'competitor leakage (partner FxTool)',
        fxScan.matches.length === 0,
        fxScan.matches.length === 0
          ? `0 matches across ${fxScan.scannedFiles} files`
          : `${fxScan.matches.length} match(es): ${fxScan.matches.map((m: { file: string; line: number }) => `${m.file}:${m.line}`).slice(0, 5).join(', ')}`,
      );
    }
  } catch (e) {
    record('competitor leakage', false, e instanceof Error ? e.message : String(e));
  }

  // 2. Default `core` MCP toolkit preserved (initialize + tools/list without PINEPAPER_TOOLKIT)
  const prevToolkit = process.env.PINEPAPER_TOOLKIT;
  try {
    delete process.env.PINEPAPER_TOOLKIT;
    const server = await createServer({ browserMode: false, executionMode: 'code' } as never);
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    const client = new Client({ name: 'public-harness-core-check', version: '1.0.0' });
    await client.connect(b);
    const listed = await client.listTools();
    await client.close();

    const expectedCore = getToolsForToolkit(getToolsForVerbosity(detectVerbosityFromEnvironment()) as never, 'core');
    const listedNames = listed.tools.map((t) => t.name);
    const expectedNames = expectedCore.map((t) => t.name);
    const ok =
      DEFAULT_TOOLKIT === 'core' &&
      listedNames.length === expectedNames.length &&
      listedNames.every((n, idx) => n === expectedNames[idx]) &&
      listedNames.length > LANE_TOOL_NAMES.length &&
      client.getInstructions() !== LANE_INSTRUCTIONS;
    record(
      'core MCP default preserved',
      ok,
      `DEFAULT_TOOLKIT=${DEFAULT_TOOLKIT}, tools/list=${listed.tools.length} (expected ${expectedCore.length}, lane=${LANE_TOOL_NAMES.length})`,
    );
  } catch (e) {
    record('core MCP default preserved', false, e instanceof Error ? e.message : String(e));
  } finally {
    if (prevToolkit !== undefined) process.env.PINEPAPER_TOOLKIT = prevToolkit;
    else delete process.env.PINEPAPER_TOOLKIT;
  }

  // 3. PINEPAPER_TOOLKIT=lane contract size
  try {
    const server = await createServer({ browserMode: false, executionMode: 'code', toolkit: 'lane' } as never);
    const [a, b] = InMemoryTransport.createLinkedPair();
    await server.connect(a);
    const client = new Client({ name: 'public-harness-lane-check', version: '1.0.0' });
    await client.connect(b);
    const listed = await client.listTools();
    await client.close();

    const listBytes = Buffer.byteLength(JSON.stringify(listed), 'utf8');
    const contractText = LANE_INSTRUCTIONS + '\n' + JSON.stringify(listed.tools);
    const contractTok = Math.round(Buffer.byteLength(contractText, 'utf8') / 4);
    const helperContractTok = Math.round(Buffer.byteLength(laneContractText(PINEPAPER_TOOLS as never), 'utf8') / 4);
    const ok =
      listed.tools.length === LANE_TOOL_NAMES.length &&
      listBytes <= 21_500 &&
      contractTok <= 10_000 &&
      helperContractTok <= 10_000;
    record(
      'lane contract budget',
      ok,
      `${listed.tools.length} tools, tools/list=${listBytes} B (<=21,500), contract=~${contractTok} tok (<=10,000)`,
    );
  } catch (e) {
    record('lane contract budget', false, e instanceof Error ? e.message : String(e));
  }

  // 4. T2 (<= 3.5 KB / <= 875 tok) and N1–N4 (< 150 tok) byte/token + codegen compilation
  try {
    const t2 = buildT2Batch();
    const t2m = measureBytesAndTokens(t2);
    const t2Res = await handleToolCall('pinepaper_agent_batch_execute', t2, CODE_OPTS);
    extractJsBlock(t2Res as never);
    const t2Ok = t2m.bytes <= 3500 && t2m.tokens <= 875;
    record('T2 payload & codegen budget', t2Ok, `${t2m.bytes} B / ${t2m.tokens} tok (<= 3500 B / 875 tok)`);

    const deltas = buildN1ToN4Deltas();
    const deltaDetails: string[] = [];
    let deltasOk = true;
    for (const d of deltas) {
      const m = measureBytesAndTokens(d.args);
      const res = await handleToolCall(d.tool, d.args, CODE_OPTS);
      extractJsBlock(res as never);
      if (m.tokens >= 150) deltasOk = false;
      deltaDetails.push(`${d.id}:${m.bytes}B/${m.tokens}tok`);
    }
    record('N1-N4 delta payloads (< 150 tok each)', deltasOk, deltaDetails.join(', '));
  } catch (e) {
    record('T2 & N1-N4 token/codegen budgets', false, e instanceof Error ? e.message : String(e));
  }

  // 5. 9-way anchor parity
  try {
    const validAnchors = ['top-left', 'top', 'top-right', 'left', 'center', 'centre', 'right', 'bottom-left', 'bottom', 'bottom-right'];
    for (const anchor of validAnchors) {
      const parsed = CreateItemInputSchema.safeParse({ itemType: 'rectangle', position: { x: 100, y: 200 }, anchor });
      if (!parsed.success) throw new Error(`CreateItemInputSchema rejected anchor "${anchor}"`);
      const js = codeGenerator.generateCreateItem({
        itemType: 'rectangle',
        position: { x: 100, y: 200 },
        properties: { width: 80, height: 40 },
        anchor,
      });
      if (js.includes('success: false')) throw new Error(`codeGenerator rejected valid anchor "${anchor}"`);
    }
    const invalidJs = codeGenerator.generateCreateItem({
      itemType: 'rectangle',
      position: { x: 100, y: 200 },
      properties: {},
      anchor: 'north-east',
    });
    const hasAll9 = invalidJs.includes('top-left, top, top-right, left, center, right, bottom-left, bottom, bottom-right');
    const rejected = invalidJs.includes('success: false') && hasAll9;
    record('9-way anchor parity', rejected, `${validAnchors.length} accepted; unknown rejected listing all 9`);
  } catch (e) {
    record('9-way anchor parity', false, e instanceof Error ? e.message : String(e));
  }

  // 6. Declarative pattern + GSAP-JSON timeline composition & atomic rollback
  try {
    const composedBatch = {
      atomic: true,
      operations: [
        { type: 'create', itemType: 'circle', position: { x: 960, y: 430 }, properties: { name: 'hub', radius: 12 } },
        {
          type: 'create_many',
          itemType: 'rectangle',
          name: 'bar',
          properties: { width: 80, height: 200, anchor: 'bottom-left' },
          items: [[300, 900], [500, 900]],
        },
        {
          type: 'timeline',
          defaults: { ease: 'power2.out' },
          tweens: [{ to: 'bar-*', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 0.8, at: 0.2, stagger: 0.1 }],
        },
        {
          type: 'pattern',
          action: 'create',
          id: 'ring_ok',
          kind: 'ring',
          members: ['$1', '$2'],
          params: { target: '$0', radius: 220, period: 4 },
          window: { startTime: 0.5, endTime: 4.5 },
        },
      ],
    };
    const compJs = extractJsBlock(await handleToolCall('pinepaper_agent_batch_execute', composedBatch, CODE_OPTS) as never);

    const patterns = new Map<string, Record<string, unknown>>();
    const items = new Map<string, Record<string, unknown>>();
    const animations: Array<{ id: string; kfs: unknown[] }> = [];
    let seq = 0;
    const hm = { beginBatch() {}, endBatch() {}, saveState() {}, saveStateDebounced() {} };
    const makeApp = (removedPatterns: string[]) => ({
      historyManager: hm,
      getCanvasSize: () => ({ width: 1920, height: 1080 }),
      create: (_type: string, p: Record<string, unknown>) => {
        const id = `item_${++seq}`;
        const item = {
          position: { x: p.x ?? 0, y: p.y ?? 0 },
          scaling: { x: 1, y: 1 },
          rotation: 0,
          opacity: 1,
          bounds: { width: p.width ?? 80, height: p.height ?? 200 },
          data: { id, registryId: id, name: p.name, anchor: p.anchor },
          remove: () => items.delete(id),
        };
        items.set(id, item);
        return item;
      },
      getItemById: (id: string) => items.get(id) ?? null,
      resolveRef: (ref: string) => {
        for (const it of items.values()) {
          if ((it.data as { name?: string })?.name === ref) return it;
        }
        return items.get(ref) ?? null;
      },
      itemRegistry: {
        get: (id: string) => items.get(id) ?? null,
        getAll: () => [...items.entries()].map(([itemId, item]) => ({ itemId, item })),
        unregister: (id: string) => items.delete(id),
      },
      addAnimation: (id: string, kfs: unknown[]) => {
        animations.push({ id, kfs });
        return true;
      },
      addPattern: (spec: Record<string, unknown>) => {
        patterns.set(String(spec.id), spec);
        return { ok: true, id: spec.id, kind: spec.kind, members: 2 };
      },
      getPattern: (id: string) => (patterns.has(id) ? { spec: patterns.get(id) } : null),
      removePattern: (id: string) => {
        removedPatterns.push(id);
        return patterns.delete(id);
      },
      deleteItem: () => ({ success: false, error: 'not found' }),
    });

    const removedOk: string[] = [];
    const compOut = await new Function('app', `return (${compJs.replace(/;\s*$/, '')})`)(makeApp(removedOk));
    const patSpec = patterns.get('ring_ok') as { window?: { from?: number; to?: number } } | undefined;

    // Atomic rollback test
    const failBatch = {
      atomic: true,
      operations: [
        { type: 'create', itemType: 'circle', position: { x: 100, y: 100 }, properties: { name: 'rb0', radius: 10 } },
        { type: 'pattern', action: 'create', id: 'rb_pat', kind: 'phase_wave', members: ['$0'], params: { amplitude: 12 } },
        { type: 'delete', itemId: 'nonexistent_item' },
      ],
    };
    const failJs = extractJsBlock(await handleToolCall('pinepaper_agent_batch_execute', failBatch, CODE_OPTS) as never);
    const removedFail: string[] = [];
    const failOut = await new Function('app', `return (${failJs.replace(/;\s*$/, '')})`)(makeApp(removedFail));

    const ok =
      compOut?.success === true &&
      animations.length === 2 &&
      patSpec?.window?.from === 0.5 &&
      patSpec?.window?.to === 4.5 &&
      failOut?.success === false &&
      removedFail.includes('rb_pat');
    record(
      'pattern + timeline composition & atomic rollback',
      ok,
      `animations=${animations.length}, patternWindow=${JSON.stringify(patSpec?.window)}, rollbackRemoved=${JSON.stringify(removedFail)}`,
    );
  } catch (e) {
    record('pattern + timeline composition & atomic rollback', false, e instanceof Error ? e.message : String(e));
  }

  // 7. Strict relationOptions validation (orbits angle: 45 -> did you mean "phaseDegrees")
  try {
    const rBatch = await handleToolCall(
      'pinepaper_agent_batch_execute',
      {
        operations: [
          { type: 'create', itemType: 'circle', position: { x: 100, y: 100 }, properties: { radius: 10 } },
          { type: 'create', itemType: 'circle', position: { x: 200, y: 100 }, properties: { radius: 20 } },
          { type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'orbits', relationOptions: { angle: 45 } },
        ],
      },
      CODE_OPTS,
    );
    const rAdd = await handleToolCall(
      'pinepaper_add_relation',
      { sourceId: 'item_1', targetId: 'item_2', relationType: 'orbits', params: { angle: 45 } },
      CODE_OPTS,
    );
    const msgBatch = rBatch.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    const msgAdd = rAdd.content.map((c) => (c.type === 'text' ? c.text : '')).join('\n');
    const ok =
      rBatch.isError === true &&
      rAdd.isError === true &&
      msgBatch.includes('did you mean') &&
      msgBatch.includes('phaseDegrees') &&
      msgAdd.includes('did you mean') &&
      msgAdd.includes('phaseDegrees');
    record('strict relationOptions validation (angle -> phaseDegrees)', ok, 'batch + add_relation rejected with phaseDegrees hint');
  } catch (e) {
    record('strict relationOptions validation', false, e instanceof Error ? e.message : String(e));
  }

  // 8. CLI init / setup / check --offline
  const tmpDir = mkdtempSync(join(tmpdir(), 'pp-public-harness-cli-'));
  try {
    const initRes = await captureCli(['init', tmpDir, '--json']);
    const scene = JSON.parse(readFileSync(join(tmpDir, 'scene.batch.json'), 'utf8')) as { operations: Array<{ type: string }> };
    const opTypes = scene.operations.map((o) => o.type);
    const hasOps = opTypes.includes('create_many') && opTypes.includes('timeline') && opTypes.includes('pattern');

    const initHelp = await captureCli(['init', '--help']);
    const hasLaneNote = initHelp.stdout.includes('PINEPAPER_TOOLKIT=lane');

    const setupCore = await captureCli(['setup', 'claude-code', '--json']);
    const setupCoreJson = JSON.parse(setupCore.stdout) as { snippet: string; notes: string[] };
    const setupLane = await captureCli(['setup', 'claude-code', '--toolkit', 'lane', '--json']);
    const setupLaneJson = JSON.parse(setupLane.stdout) as { snippet: string };
    const setupCloud = await captureCli(['setup', 'cloud', '--json']);
    const setupCloudJson = JSON.parse(setupCloud.stdout) as { location: string };

    const chkValid = await captureCli(['check', tmpDir, '--offline', '--json']);
    const chkValidJson = JSON.parse(chkValid.stdout) as { errorCount: number };

    scene.operations.push({
      type: 'relation',
      sourceId: '$0',
      targetId: '$1',
      relationType: 'orbits',
      relationOptions: { angle: 45 },
    } as never);
    writeFileSync(join(tmpDir, 'scene.batch.json'), JSON.stringify(scene, null, 2));
    const chkBad = await captureCli(['check', tmpDir, '--offline', '--json']);
    const chkBadJson = JSON.parse(chkBad.stdout) as { findings: Array<{ message: string }> };
    const badCaught = chkBad.code === 1 && chkBadJson.findings.some((f) => f.message.includes('phaseDegrees'));

    const ok =
      initRes.code === 0 &&
      hasOps &&
      hasLaneNote &&
      setupCore.code === 0 &&
      !setupCoreJson.snippet.includes('PINEPAPER_TOOLKIT') &&
      setupLane.code === 0 &&
      setupLaneJson.snippet.includes('PINEPAPER_TOOLKIT=lane') &&
      setupCloud.code === 0 &&
      setupCloudJson.location.includes('cloud.pinepaper.studio/mcp') &&
      chkValid.code === 0 &&
      chkValidJson.errorCount === 0 &&
      badCaught;

    record(
      'CLI init / setup / check --offline',
      ok,
      `initOps=${opTypes.join(',')}, validCheckErrors=${chkValidJson.errorCount}, invalidRelationCaught=${badCaught}`,
    );
  } catch (e) {
    record('CLI init / setup / check --offline', false, e instanceof Error ? e.message : String(e));
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }

  return checks;
}

async function runSubScript(args: string[], envOverrides: Record<string, string> = {}): Promise<{ ok: boolean; output: string }> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) if (v !== undefined) env[k] = v;
  env.NODE_OPTIONS = env.NODE_OPTIONS || '--max-old-space-size=2048';
  Object.assign(env, envOverrides);
  return await new Promise((resolvePromise) => {
    const child = spawn('bun', args, { cwd: REPO_ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks: string[] = [];
    child.stdout?.on('data', (d) => chunks.push(String(d)));
    child.stderr?.on('data', (d) => chunks.push(String(d)));
    child.on('error', (err) => {
      chunks.push(err.message);
      resolvePromise({ ok: false, output: chunks.join('').trim() });
    });
    child.on('close', (code) => {
      resolvePromise({ ok: code === 0, output: chunks.join('').trim() });
    });
  });
}

export async function runLiveStudioChecks(studioUrl: string, outDir: string): Promise<HarnessCheck[]> {
  const checks: HarnessCheck[] = [];
  const record = (name: string, ok: boolean, detail: string) => checks.push({ phase: 'studio', name, ok, detail });

  // 1. Serialized T1 scripted + naive negative control
  const t1Pass = await runSubScript(
    ['scripts/acceptance/agent-lane-t1.ts', '--scripted', '--out', join(outDir, 't1-scripted')],
    { PINEPAPER_STUDIO_URL: studioUrl },
  );
  record('T1 scripted MP4 export & pixel checks', t1Pass.ok, t1Pass.output.split('\n').slice(-4).join(' | ').slice(0, 260));

  const t1Naive = await runSubScript(
    ['scripts/acceptance/agent-lane-t1.ts', '--scripted-naive', '--out', join(outDir, 't1-naive')],
    { PINEPAPER_STUDIO_URL: studioUrl },
  );
  record('T1 scripted-naive negative control', t1Naive.ok, t1Naive.output.split('\n').slice(-4).join(' | ').slice(0, 260));

  // 2. Serialized T2 + N1–N4 scripted run
  const t2Pass = await runSubScript(
    ['scripts/acceptance/agent-lane-t2.ts', '--scripted', '--out', join(outDir, 't2-scripted')],
    { PINEPAPER_STUDIO_URL: studioUrl },
  );
  record('T2 + N1-N4 scripted MP4 export & pixel checks', t2Pass.ok, t2Pass.output.split('\n').slice(-5).join(' | ').slice(0, 260));

  // 3. Live pinepaper_lint_scene & pinepaper-mcp check (COLLAPSED_GROUP & UNINTENDED_OVERLAP)
  try {
    const session = await startMcpSession({ toolkit: 'lane', studioUrl, clientName: 'public-harness-lint' });
    try {
      await callTool(session.client, 'pinepaper_clear_canvas', {});
      await callTool(session.client, 'pinepaper_agent_batch_execute', LINT_TEST_SCENES.collapsedGroup);
      const lintCollapsed = await callTool(session.client, 'pinepaper_lint_scene', {});
      const hasCollapsed = lintCollapsed.text.includes('COLLAPSED_GROUP');

      await callTool(session.client, 'pinepaper_clear_canvas', {});
      await callTool(session.client, 'pinepaper_agent_batch_execute', LINT_TEST_SCENES.unintendedOverlap);
      const lintOverlap = await callTool(session.client, 'pinepaper_lint_scene', {});
      const hasOverlap = lintOverlap.text.includes('UNINTENDED_OVERLAP');

      record(
        'live pinepaper_lint_scene (COLLAPSED_GROUP & UNINTENDED_OVERLAP)',
        hasCollapsed && hasOverlap,
        `COLLAPSED_GROUP=${hasCollapsed}, UNINTENDED_OVERLAP=${hasOverlap}`,
      );
    } finally {
      await session.close();
    }
  } catch (e) {
    record('live pinepaper_lint_scene (COLLAPSED_GROUP & UNINTENDED_OVERLAP)', false, e instanceof Error ? e.message : String(e));
  }

  // CLI `pinepaper-mcp check` live surfacing of COLLAPSED_GROUP + UNINTENDED_OVERLAP
  const lintDir = mkdtempSync(join(tmpdir(), 'pp-public-harness-lint-'));
  try {
    const collapsedDir = join(lintDir, 'collapsed');
    const overlapDir = join(lintDir, 'overlap');
    mkdirSync(collapsedDir, { recursive: true });
    mkdirSync(overlapDir, { recursive: true });
    writeFileSync(join(collapsedDir, 'scene.batch.json'), JSON.stringify(LINT_TEST_SCENES.collapsedGroup, null, 2));
    writeFileSync(join(overlapDir, 'scene.batch.json'), JSON.stringify(LINT_TEST_SCENES.unintendedOverlap, null, 2));

    const chkCollapsed = await captureCli(['check', collapsedDir, '--studio-url', studioUrl, '--json']);
    const collapsedJson = JSON.parse(chkCollapsed.stdout) as { findings?: Array<{ message: string }> };
    const cliCollapsed = (collapsedJson.findings ?? []).some((f) => f.message.includes('[COLLAPSED_GROUP]'));

    const chkOverlap = await captureCli(['check', overlapDir, '--studio-url', studioUrl, '--json']);
    const overlapJson = JSON.parse(chkOverlap.stdout) as { findings?: Array<{ message: string }> };
    const cliOverlap = (overlapJson.findings ?? []).some((f) => f.message.includes('[UNINTENDED_OVERLAP]'));

    record(
      'CLI check live warnings (COLLAPSED_GROUP & UNINTENDED_OVERLAP)',
      cliCollapsed && cliOverlap,
      `CLI collapsed=${cliCollapsed}, overlap=${cliOverlap}`,
    );
  } catch (e) {
    record('CLI check live warnings', false, e instanceof Error ? e.message : String(e));
  } finally {
    rmSync(lintDir, { recursive: true, force: true });
  }

  return checks;
}

async function main() {
  const argv = process.argv.slice(2);
  const opt = (name: string) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  if (argv.includes('-h') || argv.includes('--help')) {
    console.log(`PinePaper Public Verification Harness

USAGE:
  bun scripts/acceptance/public-verification-harness.ts --offline [options]
  bun scripts/acceptance/public-verification-harness.ts --studio-dist <FxTool dist> [options]

OPTIONS:
  --offline                Run fast offline checks only (no Chrome or ffmpeg)
  --studio-dist <dir>      Serve FxTool dist/ locally and run offline + serialized live Studio checks
  --partner-fxtool <dir>   Also scan a local FxTool directory for zero restricted terms
  --out <dir>              Directory for report.json and Studio run artifacts
  --json                   Print machine-readable JSON summary`);
    process.exit(0);
  }

  const offlineOnly = argv.includes('--offline');
  const dist = opt('--studio-dist');
  const partnerFxtool = opt('--partner-fxtool');
  const jsonOut = argv.includes('--json');
  const outDir = opt('--out');
  if (outDir) mkdirSync(outDir, { recursive: true });

  const checks: HarnessCheck[] = await runOfflineChecks({ partnerFxtool });
  let mode: 'offline' | 'studio' = 'offline';

  if (!offlineOnly && (dist || process.env.PINEPAPER_STUDIO_URL)) {
    mode = 'studio';
    const studioOut = outDir ?? mkdtempSync(join(tmpdir(), 'pp-public-harness-'));
    mkdirSync(studioOut, { recursive: true });
    if (dist && !existsSync(resolve(dist))) {
      throw new Error(`Studio dist directory does not exist: ${dist}`);
    }
    const served = dist ? serveStudio(resolve(dist), 0) : null;
    const studioUrl = served?.url ?? (process.env.PINEPAPER_STUDIO_URL as string);
    try {
      checks.push(...(await runLiveStudioChecks(studioUrl, studioOut)));
    } finally {
      served?.stop();
    }
  } else if (!offlineOnly && !dist && !process.env.PINEPAPER_STUDIO_URL) {
    console.error('BLOCKED: pass --offline, --studio-dist <FxTool dist>, or set PINEPAPER_STUDIO_URL.');
    process.exit(2);
  }

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.length - passed;
  const report: HarnessReport = { ok: failed === 0, mode, passed, failed, checks };

  if (outDir) {
    writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  }

  if (jsonOut) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\nPinePaper Public Verification Harness (${mode}): ${passed}/${checks.length} passed\n`);
    for (const c of checks) {
      console.log(`  ${c.ok ? 'PASS' : 'FAIL'}  [${c.phase}] ${c.name} — ${c.detail}`);
    }
  }

  process.exit(report.ok ? 0 : 1);
}

if (import.meta.main) await main();
