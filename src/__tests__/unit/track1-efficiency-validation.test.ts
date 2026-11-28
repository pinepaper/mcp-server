/**
 * Track 1 Contract & Efficiency Tests:
 * - core default preserved + lane pattern/9-way anchor parity
 * - declarative pattern batch op (create/modify/remove, $N refs, window normalization, rollback, timeline composition)
 * - 9-way anchor codegen & schema parity
 * - strict relationOptions validation (semantic aliases + Levenshtein + glob/loop params)
 * - init / setup / check upgrades (PINEPAPER_TOOLKIT=lane, lintInner.warnings)
 * - T2 (<= 3.5 KB / <= 875 tok) and N1-N4 (< 150 tok C_total) compiled in code mode
 */
import { describe, it, expect } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_TOOLKIT, getToolsForToolkit } from '../../tools/toolkits.js';
import { PINEPAPER_TOOLS } from '../../tools/definitions.js';
import { LANE_TOOLS } from '../../tools/lane.js';
import { handleToolCall } from '../../tools/handlers.js';
import { codeGenerator } from '../../types/code-generator.js';
import { validateRelationOptionKeys, detectBatchRelationOptionViolations } from '../../ontology/hints.js';
import { findBadItemRefs } from '../../cli/batch-refs.js';
import { runCliCommand } from '../../cli/index.js';
import { lintWarningFindings } from '../../cli/commands/check.js';

const CODE_OPTS = { executionMode: 'code' as const, isConnected: false };

async function captureCli(args: string[]) {
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

function parseCodeModeJs(res: { isError?: boolean; content: Array<{ type: string; text?: string }> }): string {
  expect(res.isError).toBeFalsy();
  const txt = res.content.map((c) => c.text ?? '').join('\n');
  const m = txt.match(/```javascript\n([\s\S]*?)\n```/);
  expect(m).toBeTruthy();
  return m![1];
}

describe('Track 1: core default & lane parity', () => {
  it('preserves core as DEFAULT_TOOLKIT while lane exposes pattern + 9-way anchors', () => {
    expect(DEFAULT_TOOLKIT).toBe('core');
    const laneNames = getToolsForToolkit(PINEPAPER_TOOLS as never, 'lane').map((t) => t.name);
    expect(laneNames).toContain('pinepaper_pattern');
    expect(laneNames).toContain('pinepaper_agent_batch_execute');
    const patProps = (LANE_TOOLS.pinepaper_pattern.inputSchema as { properties: { kind: { enum: string[] } } }).properties;
    expect(patProps.kind.enum).toEqual(['phase_wave', 'stagger', 'ring', 'orbit']);
  });
});

describe('Track 1: declarative pattern batch op & runtime rollback', () => {
  it('executes pattern create/modify/remove, resolves $N refs, normalizes window startTime/endTime, and rolls back on atomic failure', async () => {
    const batch = {
      atomic: true,
      operations: [
        { type: 'create', itemType: 'circle', position: { x: 960, y: 430 }, properties: { name: 'hub', radius: 12 } },
        { type: 'create_many', itemType: 'circle', name: 'dot', properties: { radius: 6 }, items: [[100, 100], [200, 100]] },
        {
          type: 'pattern',
          action: 'create',
          id: 'orb',
          kind: 'ring',
          members: ['$1', '$2'],
          params: { target: '$0', radius: 260, period: 6 },
          window: { startTime: 0.5, endTime: 7.5 },
        },
        {
          type: 'pattern',
          action: 'modify',
          id: 'orb',
          params: { radius: 320 },
          window: { startTime: 1, endTime: 6 },
        },
        {
          type: 'pattern',
          action: 'remove',
          id: 'orb',
        },
      ],
    };

    const res = await handleToolCall('pinepaper_agent_batch_execute', batch, CODE_OPTS);
    const js = parseCodeModeJs(res as never);

    // Run generated batch JS against an in-memory PinePaper stub
    const patterns = new Map<string, Record<string, unknown>>();
    const recordedAdds: Array<Record<string, unknown>> = [];
    const removedPatterns: string[] = [];
    let seq = 0;
    const hm = { beginBatch() {}, endBatch() {}, saveState() {}, saveStateDebounced() {} };
    const app = {
      historyManager: hm,
      create: (_type: string, p: Record<string, unknown>) => {
        const id = `item_${++seq}`;
        return { data: { id, registryId: id, name: p.name } };
      },
      getCanvasSize: () => ({ width: 1920, height: 1080 }),
      addPattern: (spec: Record<string, unknown>) => {
        recordedAdds.push(JSON.parse(JSON.stringify(spec)));
        patterns.set(String(spec.id), spec);
        return { ok: true, id: spec.id, kind: spec.kind, members: 2 };
      },
      getPattern: (id: string) => (patterns.has(id) ? { spec: { ...(patterns.get(id) as object), members: { refs: ['item_2', 'item_3'] } } } : null),
      modifyPattern: (id: string, ch: Record<string, unknown>) => {
        const cur = patterns.get(id);
        if (!cur) return { ok: false, error: 'missing' };
        patterns.set(id, { ...cur, ...ch });
        return { ok: true, id, kind: cur.kind, members: 2 };
      },
      removePattern: (id: string) => {
        removedPatterns.push(id);
        return patterns.delete(id);
      },
    };
    const out = await new Function('app', `return (${js.replace(/;\s*$/, '')})`)(app);
    expect(out.success).toBe(true);
    expect(out.itemIds).toEqual(['item_1', 'item_2', 'item_3']);
    expect(recordedAdds[0]).toMatchObject({
      id: 'orb',
      kind: 'ring',
      members: ['item_2', 'item_3'],
      params: { target: 'item_1', radius: 260, period: 6 },
      window: { from: 0.5, to: 7.5 },
    });
    expect(removedPatterns).toEqual(['orb']);

    // Atomic rollback test: create pattern, then fail on next op -> removePattern called
    const failingBatch = {
      atomic: true,
      operations: [
        { type: 'create', itemType: 'circle', position: { x: 100, y: 100 }, properties: { name: 'p0', radius: 10 } },
        { type: 'pattern', action: 'create', id: 'rb_pat', kind: 'phase_wave', members: ['$0'], params: { amplitude: 10 } },
        { type: 'delete', itemId: 'nonexistent_id' },
      ],
    };
    const failJs = parseCodeModeJs(await handleToolCall('pinepaper_agent_batch_execute', failingBatch, CODE_OPTS) as never);
    const rbPatterns = new Map<string, Record<string, unknown>>();
    const rbRemoved: string[] = [];
    let seq2 = 0;
    const failApp = {
      historyManager: hm,
      create: () => {
        const id = `item_${++seq2}`;
        return { data: { id, registryId: id } };
      },
      deleteItem: () => ({ success: false, error: 'not found' }),
      getCanvasSize: () => ({ width: 800, height: 600 }),
      addPattern: (spec: Record<string, unknown>) => {
        rbPatterns.set(String(spec.id), spec);
        return { ok: true, id: spec.id, kind: spec.kind, members: 1 };
      },
      removePattern: (id: string) => {
        rbRemoved.push(id);
        return rbPatterns.delete(id);
      },
    };
    const failOut = await new Function('app', `return (${failJs.replace(/;\s*$/, '')})`)(failApp);
    expect(failOut.success).toBe(false);
    expect(rbRemoved).toEqual(['rb_pat']);
    expect(rbPatterns.size).toBe(0);
  });

  it('catches invalid $N refs in pattern members and params.target', () => {
    const bad = findBadItemRefs([
      { type: 'create', itemType: 'circle', position: { x: 10, y: 10 } },
      { type: 'pattern', action: 'create', id: 'w', kind: 'ring', members: ['$0', '$3'], params: { target: '$2' } },
    ]);
    expect(bad.map((b) => b.path)).toEqual(['operations[1].members[1]', 'operations[1].params.target']);
  });
});

describe('Track 1: 9-way anchor parity', () => {
  it('accepts all 9 anchors + centre and rejects unknown anchors with all 9 listed', () => {
    for (const anchor of ['top-left', 'top', 'top-right', 'left', 'center', 'centre', 'right', 'bottom-left', 'bottom', 'bottom-right']) {
      const js = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 100, y: 200 }, properties: { width: 80, height: 40 }, anchor });
      expect(js).not.toContain('success: false');
    }
    const bad = codeGenerator.generateCreateItem({ itemType: 'rectangle', position: { x: 100, y: 200 }, anchor: 'north-east' });
    expect(bad).toContain('success: false');
    expect(bad).toContain('top-left, top, top-right, left, center, right, bottom-left, bottom, bottom-right');
  });
});

describe('Track 1: strict relationOptions validation', () => {
  it('suggests semantic aliases (angle -> phaseDegrees, expr -> expression) and Levenshtein typos', () => {
    const vOrbit = validateRelationOptionKeys('orbits', { radius: 200, angle: 90, radiuss: 10 });
    expect(vOrbit.map((v) => [v.key, v.suggestion])).toEqual([
      ['angle', 'phaseDegrees'],
      ['radiuss', 'radius'],
    ]);

    const vExpr = validateRelationOptionKeys('time_expression', { property: 'y', expr: 'sin(t)' });
    expect(vExpr[0]?.suggestion).toBe('expression');

    const vLoopAndGlob = validateRelationOptionKeys(
      'orbits',
      { radius: 100, speed: 0.5, startTime: 1, endTime: 5, index: 0, count: 12 },
      { isGlob: true },
    );
    expect(vLoopAndGlob).toEqual([]);

    const batchViolations = detectBatchRelationOptionViolations([
      { type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'orbits', relationOptions: { radius: 100, angle: 45 } },
    ]);
    expect(batchViolations).toHaveLength(1);
    expect(batchViolations[0]?.suggestion).toBe('phaseDegrees');
  });

  it('rejects invalid relationOptions in batch_execute and pinepaper_add_relation preflight', async () => {
    const rBatch = await handleToolCall('pinepaper_agent_batch_execute', {
      operations: [
        { type: 'create', itemType: 'circle', position: { x: 100, y: 100 }, properties: { radius: 10 } },
        { type: 'create', itemType: 'circle', position: { x: 200, y: 100 }, properties: { radius: 20 } },
        { type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'orbits', relationOptions: { angle: 45 } },
      ],
    }, CODE_OPTS);
    expect(rBatch.isError).toBe(true);
    expect(JSON.parse(rBatch.content[0]!.text!).error.message).toContain('did you mean "phaseDegrees"');

    const rAdd = await handleToolCall('pinepaper_add_relation', {
      sourceId: 'item_1',
      targetId: 'item_2',
      relationType: 'orbits',
      params: { angle: 45 },
    }, CODE_OPTS);
    expect(rAdd.isError).toBe(true);
    expect(JSON.parse(rAdd.content[0]!.text!).error.message).toContain('did you mean "phaseDegrees"');
  });
});

describe('Track 1: CLI init / setup / check upgrades', () => {
  it('init minimal includes create_many + timeline + pattern and check --offline validates them', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'pp-track1-init-'));
    try {
      const initRes = await captureCli(['init', dir, '--json']);
      expect(initRes.code).toBe(0);
      const scene = JSON.parse(readFileSync(join(dir, 'scene.batch.json'), 'utf-8'));
      const types = scene.operations.map((o: { type: string }) => o.type);
      expect(types).toEqual(expect.arrayContaining(['create_many', 'timeline', 'pattern']));

      const chkRes = await captureCli(['check', dir, '--offline', '--json']);
      expect(chkRes.code).toBe(0);
      expect(JSON.parse(chkRes.stdout).errorCount).toBe(0);

      // Inject bad relationOptions and verify check --offline catches it
      scene.operations.push({ type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'orbits', relationOptions: { angle: 90 } });
      writeFileSync(join(dir, 'scene.batch.json'), JSON.stringify(scene, null, 2));
      const badChk = await captureCli(['check', dir, '--offline', '--json']);
      expect(badChk.code).toBe(1);
      const parsed = JSON.parse(badChk.stdout);
      expect(parsed.findings.some((f: { message: string }) => f.message.includes('phaseDegrees'))).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('setup preserves core default and cloud target while surfacing --toolkit lane', async () => {
    const defRes = await captureCli(['setup', 'claude-code', '--json']);
    expect(defRes.code).toBe(0);
    const defJson = JSON.parse(defRes.stdout);
    expect(defJson.snippet).not.toContain('PINEPAPER_TOOLKIT');
    expect(defJson.notes.join('\n')).toContain('--toolkit lane');

    const cloudRes = await captureCli(['setup', 'cloud', '--json']);
    expect(cloudRes.code).toBe(0);
    expect(JSON.parse(cloudRes.stdout).location).toContain('cloud.pinepaper.studio/mcp');
  });

  it('check surfaces lintInner.warnings (COLLAPSED_GROUP, UNINTENDED_OVERLAP)', () => {
    const mapped = lintWarningFindings([
      { code: 'COLLAPSED_GROUP', severity: 'warning', itemId: 'g_1', message: 'Group empty' },
      { code: 'UNINTENDED_OVERLAP', severity: 'warning', itemId: 'item_2', message: 'Overlaps item_3' },
    ]);
    expect(mapped).toEqual([
      { stage: 'lint', severity: 'warning', path: 'g_1', message: '[COLLAPSED_GROUP] Group empty' },
      { stage: 'lint', severity: 'warning', path: 'item_2', message: '[UNINTENDED_OVERLAP] Overlaps item_3' },
    ]);
  });
});

describe('Track 1: T2 & N1-N4 token efficiency budgets', () => {
  it('T2 (1920x1080, 30fps, 8.0s, 36 items) is <= 3.5 KB (<= 875 tok) and compiles in code mode', async () => {
    const t2 = {
      operations: [
        { type: 'set_canvas_size', width: 1920, height: 1080 },
        { type: 'set_background', backgroundColor: '#0b1026' },
        { type: 'create', itemType: 'text', position: [200, 130], properties: { name: 'title', content: 'SIGNAL / NOISE', fontSize: 72, color: '#f8fafc', anchor: 'top-left' } },
        { type: 'create_many', itemType: 'rectangle', name: 'bar', properties: { width: 120, color: '#38bdf8', anchor: 'bottom-left' }, items: [[260, 900, 280], [560, 900, 455], [860, 900, 364], [1160, 900, 560], [1460, 900, 497]].map(([x, y, height]) => ({ x, y, height })) },
        { type: 'create_many', itemType: 'text', name: 'lbl', properties: { fontSize: 24, color: '#94a3b8', anchor: 'bottom' }, items: ['40', '65', '52', '80', '71'].map((content, i) => ({ x: 320 + i * 300, y: 940, content })) },
        { type: 'create', itemType: 'circle', position: [960, 430], properties: { name: 'hub', radius: 18, color: '#fbbf24' } },
        { type: 'create_many', itemType: 'circle', name: 'dot', properties: { radius: 6, color: '#22d3ee' }, items: Array.from({ length: 24 }, () => [960, 430]) },
        { type: 'create', itemType: 'path', position: [960, 430], properties: { name: 'wave', strokeColor: '#a855f7', strokeWidth: 3, points: Array.from({ length: 9 }, (_, i) => [260 + i * 165, Math.round(430 + 60 * Math.sin(i * 0.9))]) } },
        {
          type: 'timeline',
          defaults: { ease: 'power2.out' },
          tweens: [
            { to: 'title', from: { opacity: 0 }, vars: { opacity: 1 }, duration: 0.8, at: 0 },
            { to: 'bar-*', from: { scaleY: 0 }, vars: { scaleY: 1 }, duration: 0.9, at: 2.8, stagger: 0.15 },
            { to: 'lbl-*', from: { opacity: 0 }, vars: { opacity: 1 }, duration: 0.4, at: 3.4, stagger: 0.15 },
            { to: 'wave', from: { trimEnd: 0 }, vars: { trimEnd: 1 }, duration: 3, at: 4, ease: 'none' },
          ],
        },
        { type: 'pattern', action: 'create', id: 'ring1', kind: 'ring', members: { names: 'dot-*' }, params: { center: [960, 430], radius: 260, period: 6 } },
      ],
    };

    const json = JSON.stringify(t2);
    const bytes = Buffer.byteLength(json, 'utf8');
    const tok = Math.ceil(bytes / 4);
    expect(bytes).toBeLessThanOrEqual(3500);
    expect(tok).toBeLessThanOrEqual(875);

    const res = await handleToolCall('pinepaper_agent_batch_execute', t2, CODE_OPTS);
    expect(res.isError).toBeFalsy();
  });

  it('N1-N4 delta edits are each < 150 tok C_total and compile in code mode', async () => {
    const n1 = {
      operations: [
        { type: 'modify', itemId: 'title', properties: { content: 'SIGNAL / PROOF' } },
        { type: 'modify', itemId: 'bar-2', properties: { height: 616 } },
      ],
    };
    const n2 = {
      operations: [
        { type: 'create_many', itemType: 'rectangle', name: 'bar_ext', properties: { width: 100, color: '#38bdf8', anchor: 'bottom-left' }, items: [{ x: 1460, y: 900, height: 231 }, { x: 1660, y: 900, height: 406 }] },
      ],
    };
    const n3 = {
      action: 'modify' as const,
      id: 'ring1',
      params: { radius: 360, period: 4 },
    };
    const n4 = {
      operations: [
        { type: 'create_many', itemType: 'circle', name: 'dot_extra', properties: { radius: 6, color: '#22d3ee' }, items: Array.from({ length: 8 }, () => [960, 430]) },
        { type: 'pattern', action: 'modify', id: 'ring1', members: { names: ['dot-*', 'dot_extra-*'] } },
      ],
    };

    for (const [name, payload, tool] of [
      ['N1', n1, 'pinepaper_agent_batch_execute'],
      ['N2', n2, 'pinepaper_agent_batch_execute'],
      ['N3', n3, 'pinepaper_pattern'],
      ['N4', n4, 'pinepaper_agent_batch_execute'],
    ] as const) {
      const bytes = Buffer.byteLength(JSON.stringify(payload), 'utf8');
      const tok = Math.ceil(bytes / 4);
      expect(tok, `${name}: ${bytes} B (${tok} tok)`).toBeLessThan(150);
      const res = await handleToolCall(tool, payload as Record<string, unknown>, CODE_OPTS);
      expect(res.isError).toBeFalsy();
    }
  });
});

describe('batch relation: a null targetId is a self-relation (B64E170 detour)', () => {
  it('parses null as omitted, the way pinepaper_add_relation takes it', async () => {
    const { AgentBatchOperationSchema, AddRelationInputSchema } = await import('../../types/schemas.js');
    const op = AgentBatchOperationSchema.parse({ type: 'relation', sourceId: '$0', targetId: null, relationType: 'time_expression', relationOptions: { property: 'y', expression: '100' } });
    expect(op.targetId).toBeUndefined();
    expect(AgentBatchOperationSchema.parse({ type: 'relation', sourceId: '$0', targetId: '$1', relationType: 'orbits' }).targetId).toBe('$1');
    expect(AddRelationInputSchema.safeParse({ sourceId: 'item_1', targetId: null, relationType: 'time_expression', params: { property: 'y', expression: '100' } }).success).toBe(true);
  });
});
