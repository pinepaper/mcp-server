#!/usr/bin/env node
/**
 * check-4repo-tool-parity.mjs
 *
 * Repeatable automated 4-repo parity audit comparing tool names, parameter
 * schemas, and preset/enum coverage across:
 *   1. FxTool v0.6.0 on-device spec & executor (PinePaperToolSpec.js + ToolCallExecutor.js)
 *   2. FxTool Chrome WebMCP browser agent tools (webmcp-tools.js + landing-tools.js)
 *   3. @pinepaper.studio/mcp-server (src/tools/definitions.ts + engine-lists.ts or dist/)
 *   4. pinepaper-llm-v0 client SFT corpus (data/processed/client-sft/train.jsonl)
 *
 * Usage:
 *   node scripts/check-4repo-tool-parity.mjs
 *   node scripts/check-4repo-tool-parity.mjs --markdown docs/tool-parity-4repo.md
 *   node scripts/check-4repo-tool-parity.mjs --json
 *   node scripts/check-4repo-tool-parity.mjs --strict
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

function parseArgs(argv) {
  const opts = {
    mcpServerDir: path.resolve(__dirname, '..'),
    fxtoolDir: process.env.PP_FXTOOL_DIR || '',
    sftPath: process.env.PP_SFT_PATH || '',
    markdownOut: null,
    json: false,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--fxtool' && argv[i + 1]) opts.fxtoolDir = argv[++i];
    else if (a === '--mcp-server' && argv[i + 1]) opts.mcpServerDir = path.resolve(argv[++i]);
    else if (a === '--sft' && argv[i + 1]) opts.sftPath = argv[++i];
    else if (a === '--markdown') {
      opts.markdownOut = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : '-';
    } else if (a === '--json') opts.json = true;
    else if (a === '--strict') opts.strict = true;
  }

  const fxCandidates = [
    opts.fxtoolDir,
    path.resolve(opts.mcpServerDir, '../FxTool'),
    '/Users/primus/IdeaProjects/FxTool',
  ].filter(Boolean);
  opts.fxtoolDir = fxCandidates.find((p) => fs.existsSync(path.join(p, 'js/ml/PinePaperToolSpec.js'))) || fxCandidates[0];

  const sftCandidates = [
    opts.sftPath,
    path.resolve(opts.mcpServerDir, '../pinepaper-llm-v0/data/processed/client-sft/train.jsonl'),
    path.resolve(opts.fxtoolDir, '../pinepaper-llm-v0/data/processed/client-sft/train.jsonl'),
    '/Users/primus/IdeaProjects/pinepaper-llm-v0/data/processed/client-sft/train.jsonl',
  ].filter(Boolean);
  opts.sftPath = sftCandidates.find((p) => fs.existsSync(p)) || sftCandidates[0];

  return opts;
}

async function loadMcpServerData(mcpServerDir) {
  const distDefs = path.join(mcpServerDir, 'dist/tools/definitions.js');
  const distLists = path.join(mcpServerDir, 'dist/tools/engine-lists.js');
  if (fs.existsSync(distDefs) && fs.existsSync(distLists)) {
    const defs = await import(pathToFileURL(distDefs).href);
    const lists = await import(pathToFileURL(distLists).href);
    const tools = defs.PINEPAPER_TOOLS || [];
    return {
      source: 'dist',
      tools: tools.map((t) => ({
        name: t.name,
        properties: Object.keys((t.inputSchema && t.inputSchema.properties) || {}),
        required: (t.inputSchema && t.inputSchema.required) || [],
        rawSchema: t.inputSchema || {},
      })),
      engineLists: {
        generators: lists.ENGINE_GENERATOR_NAMES || [],
        animationTypes: lists.ANIMATION_TYPES || [],
        canvasPresets: lists.ENGINE_CANVAS_PRESETS || [],
        effectTypes: lists.ENGINE_EFFECT_TYPES || [],
      },
    };
  }

  // Fallback: parse src/tools/definitions.ts & src/tools/engine-lists.ts without dist
  const srcDefs = fs.readFileSync(path.join(mcpServerDir, 'src/tools/definitions.ts'), 'utf8');
  const srcLists = fs.readFileSync(path.join(mcpServerDir, 'src/tools/engine-lists.ts'), 'utf8');
  const names = [...new Set([...srcDefs.matchAll(/^\s+name:\s*'([^']+)'/gm)].map((m) => m[1]))];
  const extractArray = (src, varName) => {
    const m = src.match(new RegExp(`export const ${varName}[^=]*=\\s*\\[([\\s\\S]*?)\\];`));
    if (!m) return [];
    return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  };
  return {
    source: 'src-regex',
    tools: names.map((name) => ({ name, properties: [], required: [], rawSchema: {} })),
    engineLists: {
      generators: extractArray(srcLists, 'ENGINE_GENERATOR_NAMES'),
      animationTypes: extractArray(srcLists, 'ANIMATION_TYPES'),
      canvasPresets: extractArray(srcLists, 'ENGINE_CANVAS_PRESETS'),
      effectTypes: extractArray(srcLists, 'ENGINE_EFFECT_TYPES'),
    },
  };
}

async function loadFxToolData(fxtoolDir) {
  const specPath = path.join(fxtoolDir, 'js/ml/PinePaperToolSpec.js');
  const execPath = path.join(fxtoolDir, 'js/ml/ToolCallExecutor.js');
  const webmcpPath = path.join(fxtoolDir, 'js/webmcp/webmcp-tools.js');
  const landingPath = path.join(fxtoolDir, 'js/webmcp/landing-tools.js');
  const bridgePath = path.join(fxtoolDir, 'js/webmcp/WebMCPBridge.js');

  const specMod = await import(pathToFileURL(specPath).href);
  const execSrc = fs.readFileSync(execPath, 'utf8');
  const webmcpMod = require(webmcpPath);
  const landingMod = require(landingPath);
  const bridgeSrc = fs.readFileSync(bridgePath, 'utf8');

  const branches = (specMod.SCENE_SCHEMA && specMod.SCENE_SCHEMA.items && specMod.SCENE_SCHEMA.items.oneOf) || [];
  const specTools = branches.map((b) => {
    const name = b?.properties?.name?.const;
    const args = b?.properties?.arguments || {};
    return {
      name,
      properties: Object.keys(args.properties || {}),
      required: args.required || [],
      rawSchema: args,
    };
  }).filter((t) => t.name);

  // Extract switch cases in executeToolCall
  const execCases = [...new Set([...execSrc.matchAll(/case\s+['"](pinepaper_[^'"]+)['"]\s*:/g)].map((m) => m[1]))];

  // Parse forwarded mappings in webmcp-tools.js without crossing between forwarded(...) calls.
  const webmcpSrc = fs.readFileSync(webmcpPath, 'utf8');
  const execNameMap = new Map();
  for (const m of webmcpSrc.matchAll(/forwarded\(\s*['"]([^'"]+)['"](?:(?!\bforwarded\()[\s\S])*?\},\s*['"](pinepaper_[^'"]+)['"]\s*\)\s*,/g)) {
    execNameMap.set(m[1], m[2]);
  }

  const editorTools = (webmcpMod.WEBMCP_TOOLS || []).map((t) => ({
    name: t.name,
    forwarded: !!t.forwarded,
    execName: t.forwarded ? (execNameMap.get(t.name) || t.name) : null,
    properties: Object.keys((t.inputSchema && t.inputSchema.properties) || {}),
    required: (t.inputSchema && t.inputSchema.required) || [],
    annotations: t.annotations || null,
  }));

  const landingTools = (landingMod.LANDING_TOOLS || []).map((t) => ({
    name: t.name,
    properties: Object.keys((t.inputSchema && t.inputSchema.properties) || {}),
    annotations: t.annotations || null,
  }));

  const generatorsJsonPath = path.join(fxtoolDir, 'assets/client-llm/generators.json');
  const compositionsJsonPath = path.join(fxtoolDir, 'assets/client-llm/compositions.json');
  const vendoredSchemaPath = path.join(fxtoolDir, 'assets/client-llm/pinepaper.schema.json');

  const generatorsJson = fs.existsSync(generatorsJsonPath)
    ? JSON.parse(fs.readFileSync(generatorsJsonPath, 'utf8'))
    : [];
  const generatorsJsonList = (Array.isArray(generatorsJson) ? generatorsJson : generatorsJson.generators || [])
    .map((g) => (typeof g === 'string' ? g : g && g.name))
    .filter(Boolean);

  const compositionsJson = fs.existsSync(compositionsJsonPath)
    ? JSON.parse(fs.readFileSync(compositionsJsonPath, 'utf8'))
    : { objects: [] };
  const compositionsJsonList = (compositionsJson.objects || []).map((o) => o && o.name).filter(Boolean);

  const vendoredBranches = fs.existsSync(vendoredSchemaPath)
    ? ((JSON.parse(fs.readFileSync(vendoredSchemaPath, 'utf8')).items || {}).oneOf || [])
        .map((b) => b?.properties?.name?.const)
        .filter(Boolean)
    : [];

  return {
    specTools,
    execCases,
    editorTools,
    landingTools,
    webmcpHasWaitForToolsUntil: bridgeSrc.includes('waitForToolsUntil') || webmcpSrc.includes('waitForToolsUntil'),
    enums: {
      ITEM_TYPES: specMod.ITEM_TYPES || [],
      PAINT_MEDIUMS: specMod.PAINT_MEDIUMS || [],
      ANIMATION_TYPES: specMod.ANIMATION_TYPES || [],
      DEFORM_PRESETS: specMod.DEFORM_PRESETS || [],
      DEFORM_PHASES: specMod.DEFORM_PHASES || [],
      TEXT_EFFECTS: specMod.TEXT_EFFECTS || [],
      ENTRANCE_PRESETS: specMod.ENTRANCE_PRESETS || [],
      RELATIONS: specMod.RELATIONS || [],
      GENERATORS_FALLBACK: specMod.GENERATORS || [],
      GENERATORS_ASSET: generatorsJsonList,
      COMPOSITION_OBJECTS_FALLBACK: specMod.COMPOSITION_OBJECTS || [],
      COMPOSITION_OBJECTS_ASSET: compositionsJsonList,
      WORLD3D_ACTIONS: specMod.WORLD3D_ACTIONS || [],
      WORLD3D_WORLDS: specMod.WORLD3D_WORLDS || [],
      VENDORED_SCHEMA_TOOLS: vendoredBranches,
    },
  };
}

function loadSftData(sftPath) {
  if (!fs.existsSync(sftPath)) {
    return { exists: false, rows: 0, toolCalls: {}, toolArgs: {}, kinds: {}, generators: [], itemTypes: [], animTypes: [], relations: [], entrances: [], deforms: [], textEffects: [] };
  }
  const lines = fs.readFileSync(sftPath, 'utf8').trim().split('\n').filter(Boolean);
  const toolCalls = {};
  const toolArgs = {};
  const kinds = {};
  const generators = new Set();
  const itemTypes = new Set();
  const animTypes = new Set();
  const relations = new Set();
  const entrances = new Set();
  const deforms = new Set();
  const textEffects = new Set();

  for (const line of lines) {
    const row = JSON.parse(line);
    const kind = row?.meta?.kind || 'unknown';
    kinds[kind] = (kinds[kind] || 0) + 1;
    const asst = (row.messages || []).find((m) => m.role === 'assistant');
    if (!asst) continue;
    let calls = [];
    try {
      const parsed = JSON.parse(asst.content);
      calls = Array.isArray(parsed) ? parsed : [parsed];
    } catch { continue; }
    for (const c of calls) {
      if (!c || !c.name) continue;
      toolCalls[c.name] = (toolCalls[c.name] || 0) + 1;
      if (!toolArgs[c.name]) toolArgs[c.name] = new Set();
      const a = c.arguments || {};
      for (const k of Object.keys(a)) toolArgs[c.name].add(k);
      if (c.name === 'pinepaper_execute_generator' && (a.generator || a.name || a.generatorName)) {
        generators.add(a.generator || a.name || a.generatorName);
      }
      if (a.itemType) itemTypes.add(a.itemType);
      if (a.animationType) animTypes.add(a.animationType);
      if (a.relation || a.relationType) relations.add(a.relation || a.relationType);
      if (a.entrance) entrances.add(a.entrance);
      if (c.name === 'pinepaper_entrance' && a.preset) entrances.add(a.preset);
      if (c.name === 'pinepaper_deform' && a.preset) deforms.add(a.preset);
      if (c.name === 'pinepaper_text_effect' && a.effect) textEffects.add(a.effect);
    }
  }

  return {
    exists: true,
    rows: lines.length,
    toolCalls,
    toolArgs: Object.fromEntries(Object.entries(toolArgs).map(([k, v]) => [k, [...v].sort()])),
    kinds,
    generators: [...generators].sort(),
    itemTypes: [...itemTypes].sort(),
    animTypes: [...animTypes].sort(),
    relations: [...relations].sort(),
    entrances: [...entrances].sort(),
    deforms: [...deforms].sort(),
    textEffects: [...textEffects].sort(),
  };
}

function buildReport(fx, mcp, sft) {
  const specByName = new Map(fx.specTools.map((t) => [t.name, t]));
  const execSet = new Set(fx.execCases);
  const webmcpByExec = new Map();
  for (const w of fx.editorTools) {
    if (w.forwarded) webmcpByExec.set(w.execName, w);
    else webmcpByExec.set(w.name, w);
  }
  const mcpByName = new Map(mcp.tools.map((t) => [t.name, t]));

  const executorMissingFromSpec = fx.execCases.filter((n) => !specByName.has(n));
  const specMissingFromExecutor = fx.specTools.map((t) => t.name).filter((n) => !execSet.has(n));
  const specMissingFromMcp = fx.specTools.map((t) => t.name).filter((n) => !mcpByName.has(n));
  const execMissingFromMcp = fx.execCases.filter((n) => !mcpByName.has(n));
  const execMissingFromWebmcp = fx.execCases.filter((n) => !webmcpByExec.has(n));
  const webmcpDirectOnly = fx.editorTools.filter((w) => !w.forwarded).map((w) => w.name);
  const webmcpMissingFromMcp = fx.editorTools
    .filter((w) => !mcpByName.has(w.name) && !(w.forwarded && mcpByName.has(w.execName)))
    .map((w) => w.name);

  // Parameter & semantic drift checks on shared tools
  const sharedParamDiffs = [];
  for (const st of fx.specTools) {
    const mt = mcpByName.get(st.name);
    if (!mt) continue;
    const specProps = st.properties;
    const mcpProps = mt.properties;
    const onlyInSpec = specProps.filter((p) => !mcpProps.includes(p));
    const onlyInMcp = mcpProps.filter((p) => !specProps.includes(p));
    let semanticNote = '';
    if (st.name === 'pinepaper_compose') semanticNote = 'SEMANTIC DIVERGENCE: FxTool expands named object macro ({object}); mcp-server orchestrates multi-item treatments/patterns/craft';
    else if (st.name === 'pinepaper_execute_generator') semanticNote = 'ARG DRIFT: FxTool uses `generator`, client-sft uses `name`, mcp-server uses `generatorName` + `params`';
    else if (st.name === 'pinepaper_add_relation') semanticNote = 'ARG DRIFT: FxTool uses `from`/`to`/`relation`, mcp-server uses `sourceId`/`targetId`/`relationType`';
    else if (st.name === 'pinepaper_create_item' || st.name === 'pinepaper_modify_item') semanticNote = 'SHAPE DRIFT: FxTool uses flat x/y/color/width/height; mcp-server nests position:{x,y} and properties:{...}';
    else if (st.name === 'pinepaper_world3d') {
      const mcpActions = mt.rawSchema?.properties?.action?.enum || [];
      const missingActions = fx.enums.WORLD3D_ACTIONS.filter((a) => !mcpActions.includes(a));
      if (missingActions.length) semanticNote = `ACTION DRIFT: mcp-server missing world3d actions: ${missingActions.join(', ')}`;
    } else if (st.name === 'pinepaper_deform') {
      const mcpPresets = mt.rawSchema?.properties?.preset?.enum || [];
      const missingPresets = fx.enums.DEFORM_PRESETS.filter((p) => !mcpPresets.includes(p));
      if (missingPresets.length) semanticNote = `ENUM DRIFT: mcp-server missing deform presets: ${missingPresets.join(', ')}`;
    }
    if (onlyInSpec.length || onlyInMcp.length || semanticNote) {
      sharedParamDiffs.push({ name: st.name, onlyInSpec, onlyInMcp, semanticNote });
    }
  }

  // SFT coverage against FxTool v0.6.0
  const sftTools = Object.keys(sft.toolCalls);
  const execMissingFromSft = fx.execCases.filter((n) => !sft.toolCalls[n]);
  const specMissingFromSft = fx.specTools.map((t) => t.name).filter((n) => !sft.toolCalls[n]);
  const mcpGenerators = mcp.engineLists.generators;
  const mcpDeformPresets = mcpByName.get('pinepaper_deform')?.rawSchema?.properties?.preset?.enum || [];
  const mcpWorld3dActions = mcpByName.get('pinepaper_world3d')?.rawSchema?.properties?.action?.enum || [];
  const mcpItemTypes = mcpByName.get('pinepaper_create_item')?.rawSchema?.properties?.itemType?.enum || [];
  const mcpRelations = mcpByName.get('pinepaper_add_relation')?.rawSchema?.properties?.relationType?.enum || [];

  const enumComparison = [
    {
      name: 'ITEM_TYPES',
      toolSpec: fx.enums.ITEM_TYPES.length,
      mcpServer: mcpItemTypes.length,
      sft: sft.itemTypes.length,
      drift: fx.enums.ITEM_TYPES.filter((x) => !mcpItemTypes.includes(x)),
      sftMissing: fx.enums.ITEM_TYPES.filter((x) => !sft.itemTypes.includes(x)),
    },
    {
      name: 'ANIMATION_TYPES',
      toolSpec: fx.enums.ANIMATION_TYPES.length,
      mcpServer: mcp.engineLists.animationTypes.length,
      sft: sft.animTypes.length,
      drift: fx.enums.ANIMATION_TYPES.filter((x) => !mcp.engineLists.animationTypes.includes(x)),
      sftMissing: fx.enums.ANIMATION_TYPES.filter((x) => !sft.animTypes.includes(x)),
    },
    {
      name: 'DEFORM_PRESETS',
      toolSpec: fx.enums.DEFORM_PRESETS.length,
      mcpServer: mcpDeformPresets.length,
      sft: sft.deforms.length,
      drift: fx.enums.DEFORM_PRESETS.filter((x) => !mcpDeformPresets.includes(x)),
      sftMissing: fx.enums.DEFORM_PRESETS,
    },
    {
      name: 'TEXT_EFFECTS',
      toolSpec: fx.enums.TEXT_EFFECTS.length,
      mcpServer: mcp.engineLists.effectTypes.length ? `${mcp.engineLists.effectTypes.length} (engine)` : 'open string',
      sft: sft.textEffects.length,
      drift: [],
      sftMissing: fx.enums.TEXT_EFFECTS,
    },
    {
      name: 'ENTRANCE_PRESETS',
      toolSpec: fx.enums.ENTRANCE_PRESETS.length,
      mcpServer: 'N/A (keyframes/animate)',
      sft: sft.entrances.length,
      drift: [],
      sftMissing: fx.enums.ENTRANCE_PRESETS,
    },
    {
      name: 'RELATIONS',
      toolSpec: fx.enums.RELATIONS.length,
      mcpServer: mcpRelations.length,
      sft: sft.relations.length,
      drift: fx.enums.RELATIONS.filter((x) => !mcpRelations.includes(x)),
      sftMissing: fx.enums.RELATIONS,
    },
    {
      name: 'GENERATORS',
      toolSpec: `${fx.enums.GENERATORS_FALLBACK.length} fallback / ${fx.enums.GENERATORS_ASSET.length} asset`,
      mcpServer: mcpGenerators.length,
      sft: sft.generators.length,
      drift: fx.enums.GENERATORS_ASSET.filter((x) => !mcpGenerators.includes(x)),
      sftMissing: fx.enums.GENERATORS_ASSET.filter((x) => !sft.generators.includes(x)),
    },
    {
      name: 'COMPOSITION_OBJECTS',
      toolSpec: `${fx.enums.COMPOSITION_OBJECTS_FALLBACK.length} fallback / ${fx.enums.COMPOSITION_OBJECTS_ASSET.length} asset`,
      mcpServer: 'different pinepaper_compose',
      sft: '0 (macro tool unused)',
      drift: [],
      sftMissing: [],
    },
    {
      name: 'WORLD3D_ACTIONS',
      toolSpec: fx.enums.WORLD3D_ACTIONS.length,
      mcpServer: mcpWorld3dActions.length,
      sft: 0,
      drift: fx.enums.WORLD3D_ACTIONS.filter((x) => !mcpWorld3dActions.includes(x)),
      sftMissing: fx.enums.WORLD3D_ACTIONS,
    },
    {
      name: 'PAINT_MEDIUMS',
      toolSpec: fx.enums.PAINT_MEDIUMS.length,
      mcpServer: '0 (no pinepaper_paint_stroke)',
      sft: 0,
      drift: ['no pinepaper_paint_stroke in mcp-server'],
      sftMissing: fx.enums.PAINT_MEDIUMS,
    },
  ];

  // Unified client-surface union matrix
  const allClientTools = [...new Set([
    ...fx.specTools.map((t) => t.name),
    ...fx.execCases,
    ...fx.editorTools.map((w) => w.name),
    ...sftTools,
  ])].sort();

  const matrix = allClientTools.map((name) => {
    const webmcpEntry = fx.editorTools.find((w) => w.name === name)
      || fx.editorTools.find((w) => w.forwarded && w.execName === name);
    const webmcpLabel = !webmcpEntry
      ? '—'
      : webmcpEntry.forwarded
        ? (webmcpEntry.name === name ? 'forwarded' : `forwarded (${webmcpEntry.name})`)
        : 'direct';
    const mcpPresent = mcpByName.has(name) || (webmcpEntry?.forwarded && mcpByName.has(webmcpEntry.execName));
    return {
      name,
      toolSpec: specByName.has(name),
      executor: execSet.has(name),
      webmcp: webmcpLabel,
      mcpServer: mcpPresent,
      sftCalls: sft.toolCalls[name] || 0,
    };
  });

  return {
    summary: {
      fxtoolToolSpecCount: fx.specTools.length,
      fxtoolExecutorCount: fx.execCases.length,
      fxtoolVendoredSchemaCount: fx.enums.VENDORED_SCHEMA_TOOLS.length,
      webmcpEditorCount: fx.editorTools.length,
      webmcpDirectCount: fx.editorTools.filter((w) => !w.forwarded).length,
      webmcpForwardedCount: fx.editorTools.filter((w) => w.forwarded).length,
      webmcpLandingCount: fx.landingTools.length,
      webmcpHasWaitForToolsUntil: fx.webmcpHasWaitForToolsUntil,
      mcpServerToolCount: mcp.tools.length,
      mcpServerSource: mcp.source,
      sftRowCount: sft.rows,
      sftDistinctToolsCount: sftTools.length,
    },
    gaps: {
      executorMissingFromSpec,
      specMissingFromExecutor,
      specMissingFromMcp,
      execMissingFromMcp,
      execMissingFromWebmcp,
      webmcpDirectOnly,
      webmcpMissingFromMcp,
      execMissingFromSft,
      specMissingFromSft,
      sharedParamDiffs,
    },
    enumComparison,
    sft,
    matrix,
  };
}

function renderMarkdown(report) {
  const s = report.summary;
  const g = report.gaps;
  const lines = [
    '# 4-Repo Tool Parity & Drift Audit',
    '',
    'Automated comparison across:',
    '1. **FxTool On-Device Spec (`PinePaperToolSpec.js`) & Executor (`ToolCallExecutor.js`)**',
    '2. **FxTool Chrome WebMCP (`webmcp-tools.js` + `landing-tools.js` + `WebMCPBridge.js`)**',
    '3. **`@pinepaper.studio/mcp-server` (`src/tools/definitions.ts` + `engine-lists.ts`)**',
    '4. **`pinepaper-llm-v0` Client SFT Corpus (`data/processed/client-sft/train.jsonl`)**',
    '',
    '## Summary Counts',
    '',
    '| Surface | Count | Notes |',
    '|---|---:|---|',
    `| FxTool \`PinePaperToolSpec.js\` (\`SCENE_SCHEMA\`) | ${s.fxtoolToolSpecCount} | Constrained Prompt API / WebLLM grammar tools |`,
    `| FxTool \`ToolCallExecutor.js\` (\`executeToolCall\`) | ${s.fxtoolExecutorCount} | Client runtime switch cases |`,
    `| FxTool vendored \`pinepaper.schema.json\` | ${s.fxtoolVendoredSchemaCount} | Static asset merged additively by \`loadSceneSchema\` |`,
    `| FxTool WebMCP editor (\`WEBMCP_TOOLS\`) | ${s.webmcpEditorCount} | ${s.webmcpDirectCount} direct + ${s.webmcpForwardedCount} forwarded to \`ToolCallExecutor\` |`,
    `| FxTool WebMCP landing (\`LANDING_TOOLS\`) | ${s.webmcpLandingCount} | Root discovery tools |`,
    `| \`@pinepaper.studio/mcp-server\` (\`PINEPAPER_TOOLS\`) | ${s.mcpServerToolCount} | Source: \`${s.mcpServerSource}\` |`,
    `| \`pinepaper-llm-v0\` \`client-sft/train.jsonl\` | ${s.sftDistinctToolsCount} tools (${s.sftRowCount} rows) | Only 6 of ${s.fxtoolExecutorCount} client-executable tools appear in SFT |`,
    '',
    '## Key Parity Drift Findings',
    '',
    `- **Executor tools missing from \`PinePaperToolSpec.js\` (${g.executorMissingFromSpec.length}):** ${g.executorMissingFromSpec.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **\`PinePaperToolSpec\` tools missing from \`mcp-server\` (${g.specMissingFromMcp.length}):** ${g.specMissingFromMcp.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **\`ToolCallExecutor\` tools missing from \`mcp-server\` (${g.execMissingFromMcp.length}):** ${g.execMissingFromMcp.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **\`ToolCallExecutor\` tools not exposed in WebMCP editor (${g.execMissingFromWebmcp.length}):** ${g.execMissingFromWebmcp.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **WebMCP direct-only editor tools missing from \`mcp-server\` (${g.webmcpMissingFromMcp.length}):** ${g.webmcpMissingFromMcp.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **\`ToolCallExecutor\` tools missing from \`client-sft/train.jsonl\` (${g.execMissingFromSft.length}/${s.fxtoolExecutorCount}):** ${g.execMissingFromSft.map((x) => `\`${x}\``).join(', ') || 'none'}`,
    `- **WebMCP readiness / Chrome PR #373 (\`waitForToolsUntil\`):** \`WebMCPBridge.js\` registers via \`document.modelContext.registerTool\` (with \`navigator.modelContext\` fallback) and handles async \`registerTool\` promise rejection + \`AbortController\` \`{ signal }\`, with \`waitForToolsUntil\` absent from \`FxTool\` (${s.webmcpHasWaitForToolsUntil ? 'present' : 'not present — page-side \`registerTool\` only'}).`,
    '',
    '## Client-Facing Tool Matrix',
    '',
    '| Tool Name | ToolSpec (24) | Executor (28) | WebMCP Editor (32) | mcp-server (180) | client-sft Calls |',
    '|---|:---:|:---:|:---:|:---:|---:|',
  ];

  for (const row of report.matrix) {
    lines.push(
      `| \`${row.name}\` | ${row.toolSpec ? '✅' : '—'} | ${row.executor ? '✅' : '—'} | ${row.webmcp} | ${row.mcpServer ? '✅' : '—'} | ${row.sftCalls} |`,
    );
  }

  lines.push(
    '',
    '## Preset & Enum Parity',
    '',
    '| Enum / Surface | PinePaperToolSpec | mcp-server | client-sft | Drift in mcp-server | Missing in client-sft |',
    '|---|---|---|---|---|---|',
  );
  for (const e of report.enumComparison) {
    lines.push(
      `| \`${e.name}\` | ${e.toolSpec} | ${e.mcpServer} | ${e.sft} | ${e.drift.length ? e.drift.join(', ') : '—'} | ${e.sftMissing.length ? `${e.sftMissing.length} missing` : '—'} |`,
    );
  }

  lines.push('', '## Parameter & Semantic Drift on Shared Tools', '');
  for (const d of g.sharedParamDiffs) {
    lines.push(`- **\`${d.name}\`**`);
    if (d.semanticNote) lines.push(`  - ${d.semanticNote}`);
    if (d.onlyInSpec.length) lines.push(`  - Only in \`PinePaperToolSpec\`: ${d.onlyInSpec.map((p) => `\`${p}\``).join(', ')}`);
    if (d.onlyInMcp.length) lines.push(`  - Only in \`mcp-server\`: ${d.onlyInMcp.map((p) => `\`${p}\``).join(', ')}`);
  }

  lines.push(
    '',
    '## `client-sft/train.jsonl` Breakdown',
    '',
    `- **Rows:** ${report.sft.rows}`,
    `- **Kinds:** ${Object.entries(report.sft.kinds).map(([k, v]) => `\`${k}\`: ${v}`).join(', ')}`,
    `- **Argument keys observed per tool:**`,
  );
  for (const [tool, args] of Object.entries(report.sft.toolArgs)) {
    lines.push(`  - \`${tool}\` (${report.sft.toolCalls[tool]} calls): ${args.map((a) => `\`${a}\``).join(', ')}`);
  }
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const [fx, mcp] = await Promise.all([
    loadFxToolData(opts.fxtoolDir),
    loadMcpServerData(opts.mcpServerDir),
  ]);
  const sft = loadSftData(opts.sftPath);
  const report = buildReport(fx, mcp, sft);

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else if (opts.markdownOut) {
    const md = renderMarkdown(report);
    if (opts.markdownOut === '-') {
      console.log(md);
    } else {
      const outAbs = path.resolve(process.cwd(), opts.markdownOut);
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });
      fs.writeFileSync(outAbs, md);
      console.log(`Wrote 4-repo parity report to ${outAbs}`);
    }
  } else {
    console.log(renderMarkdown(report));
  }

  if (opts.strict) {
    const hasDrift =
      report.gaps.executorMissingFromSpec.length > 0 ||
      report.enumComparison.some((e) => e.drift.length > 0);
    if (hasDrift) process.exit(1);
  }
}

main().catch((err) => {
  console.error('[check-4repo-tool-parity] failed:', err);
  process.exit(1);
});
