/**
 * `pinepaper-mcp init [dir]` — Scaffold a runnable PinePaper project directory
 * (`pinepaper.json` + `scene.batch.json`).
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { boolFlag, strFlag, suggestCommand } from '../args.js';
import { emitJson, failWith, type ProjectConfig } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

interface TemplateDef {
  name: string;
  description: string;
  config: ProjectConfig;
  operations: Array<Record<string, unknown>>;
}

export const TEMPLATES: Readonly<Record<string, TemplateDef>> = {
  minimal: {
    name: 'minimal',
    description: 'Clean 1280x720 scene with animated headline and pulsing accent dot',
    config: {
      entry: 'scene.batch.json',
      canvas: { width: 1280, height: 720, backgroundColor: '#0f172a' },
      export: { format: 'mp4', fps: 30, duration: 4, quality: 'standard', output: 'renders/minimal.mp4' },
    },
    operations: [
      {
        type: 'create',
        itemType: 'circle',
        position: { x: 640, y: 290 },
        properties: { name: 'hero_dot', radius: 36, fillColor: '#38bdf8' },
      },
      {
        type: 'animate',
        itemId: '$0',
        animationType: 'pulse',
        // The Studio reads animationSpeed / animationIntensity (0.18 = +-18%); `speed` and `scale` are not keys it reads.
        animationOptions: { animationSpeed: 1.5, animationIntensity: 0.18 },
      },
      {
        type: 'create',
        itemType: 'text',
        position: { x: 640, y: 400 },
        properties: {
          name: 'title',
          content: 'Made with PinePaper',
          fontSize: 56,
          fontWeight: 'bold',
          fillColor: '#f8fafc',
        },
      },
      {
        type: 'keyframe_animate',
        // $N counts create and group ops in order: hero_dot is $0, title is $1.
        itemId: '$1',
        duration: 1.2,
        keyframes: [
          // Easing shapes the move ARRIVING at a key, so it goes on the second one.
          { time: 0, properties: { opacity: 0, y: 425 } },
          { time: 1.0, properties: { opacity: 1, y: 400 }, easing: 'easeOutCubic' },
        ],
      },
      {
        type: 'create_many',
        itemType: 'circle',
        name: 'accent',
        properties: { radius: 8, fillColor: '#a855f7', opacity: 0.9 },
        items: [[540, 500], [640, 500], [740, 500]],
      },
      {
        type: 'timeline',
        defaults: { ease: 'power2.out' },
        tweens: [
          { to: 'accent-*', from: { scale: 0.2, opacity: 0 }, vars: { scale: 1, opacity: 0.9 }, duration: 0.6, at: 0.6, stagger: 0.12 },
        ],
      },
      {
        type: 'pattern',
        action: 'create',
        id: 'accent_wave',
        kind: 'phase_wave',
        members: { names: 'accent-*' },
        params: { property: 'y', amplitude: 10, period: 2, wavelength: 3 },
      },
    ],
  },
  'social-post': {
    name: 'social-post',
    description: '1080x1080 editorial typography card framed with a geometric accent bar',
    config: {
      entry: 'scene.batch.json',
      canvas: { width: 1080, height: 1080, backgroundColor: '#fafaf9' },
      export: { format: 'mp4', fps: 30, duration: 5, quality: 'standard', output: 'renders/social-post.mp4' },
    },
    operations: [
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 540, y: 540 },
        properties: { name: 'card_bg', width: 880, height: 880, cornerRadius: 28, fillColor: '#ffffff', strokeColor: '#e2e8f0', strokeWidth: 2 },
      },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 540, y: 360 },
        properties: { name: 'accent_bar', width: 140, height: 10, cornerRadius: 5, fillColor: '#2563eb' },
      },
      {
        type: 'create',
        itemType: 'text',
        position: { x: 540, y: 510 },
        properties: { name: 'headline', content: 'Generate once.\nEdit whenever.', fontSize: 68, fontWeight: 'bold', fillColor: '#0f172a', maxWidth: 740 },
      },
      {
        type: 'keyframe_animate',
        itemId: '$2',
        duration: 1.4,
        keyframes: [
          { time: 0, properties: { opacity: 0, scale: 0.92 } },
          { time: 1.1, properties: { opacity: 1, scale: 1 }, easing: 'easeOutCubic' },
        ],
      },
    ],
  },
  chart: {
    name: 'chart',
    description: 'Animated 4-bar metric comparison with bottom-left anchored create_many and timeline stagger',
    config: {
      entry: 'scene.batch.json',
      canvas: { width: 1280, height: 720, backgroundColor: '#111827' },
      export: { format: 'mp4', fps: 30, duration: 4, quality: 'standard', output: 'renders/chart.mp4' },
    },
    operations: [
      {
        type: 'create',
        itemType: 'text',
        position: { x: 640, y: 110 },
        properties: { name: 'chart_title', content: 'Quarterly Growth', fontSize: 44, fontWeight: 'bold', fillColor: '#f9fafb' },
      },
      {
        type: 'create_many',
        itemType: 'rectangle',
        name: 'bar',
        properties: { width: 88, cornerRadius: 8, fillColor: '#10b981', anchor: 'bottom-left' },
        items: [150, 210, 260, 320].map((height, i) => ({ x: 326 + i * 180, y: 600, height })),
      },
      {
        type: 'timeline',
        defaults: { ease: 'power2.out' },
        tweens: [
          { to: 'bar-*', from: { scaleY: 0.05, opacity: 0.3 }, vars: { scaleY: 1, opacity: 1 }, duration: 0.9, at: 0.1, stagger: 0.15 },
        ],
      },
    ],
  },
  diagram: {
    name: 'diagram',
    description: 'Clean 3-stage pipeline with flow blocks and directional connectors',
    config: {
      entry: 'scene.batch.json',
      canvas: { width: 1280, height: 720, backgroundColor: '#f8fafc' },
      export: { format: 'svg', duration: 3, output: 'renders/diagram.svg' },
    },
    operations: [
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 280, y: 360 },
        properties: { name: 'stage_author', width: 220, height: 96, cornerRadius: 14, fillColor: '#e0f2fe', strokeColor: '#0284c7', strokeWidth: 2 },
      },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 640, y: 360 },
        properties: { name: 'stage_verify', width: 220, height: 96, cornerRadius: 14, fillColor: '#ede9fe', strokeColor: '#7c3aed', strokeWidth: 2 },
      },
      {
        type: 'create',
        itemType: 'rectangle',
        position: { x: 1000, y: 360 },
        properties: { name: 'stage_render', width: 220, height: 96, cornerRadius: 14, fillColor: '#dcfce7', strokeColor: '#16a34a', strokeWidth: 2 },
      },
      {
        type: 'create',
        itemType: 'text',
        position: { x: 280, y: 360 },
        properties: { name: 'lbl_author', content: '1. Author', fontSize: 24, fontWeight: 'bold', fillColor: '#0c4a6e' },
      },
      {
        type: 'create',
        itemType: 'text',
        position: { x: 640, y: 360 },
        properties: { name: 'lbl_verify', content: '2. Validate', fontSize: 24, fontWeight: 'bold', fillColor: '#4c1d95' },
      },
      {
        type: 'create',
        itemType: 'text',
        position: { x: 1000, y: 360 },
        properties: { name: 'lbl_render', content: '3. Export', fontSize: 24, fontWeight: 'bold', fillColor: '#14532d' },
      },
      {
        type: 'relation',
        sourceId: '$1',
        targetId: '$0',
        relationType: 'beside',
        relationOptions: { side: 'right', gap: 140 },
      },
      {
        type: 'relation',
        sourceId: '$2',
        targetId: '$1',
        relationType: 'beside',
        relationOptions: { side: 'right', gap: 140 },
      },
    ],
  },
  'solar-system': {
    name: 'solar-system',
    description: 'Sun + orbiting planets built declaratively via orbits relations',
    config: {
      entry: 'scene.batch.json',
      canvas: { width: 1280, height: 720, backgroundColor: '#020617' },
      export: { format: 'mp4', fps: 30, duration: 6, quality: 'standard', output: 'renders/solar-system.mp4' },
    },
    operations: [
      {
        type: 'create',
        itemType: 'circle',
        position: { x: 640, y: 360 },
        properties: { name: 'sun', radius: 52, fillColor: '#fbbf24' },
      },
      {
        type: 'animate',
        itemId: '$0',
        animationType: 'pulse',
        animationOptions: { animationSpeed: 1.2, animationIntensity: 0.08 },
      },
      {
        type: 'orbit',
        targetId: '$0',
        name: 'inner_planet',
        radius: 135,
        speed: 0.7,
        // Every orbit names its phase: the Studio stores an unset phaseDegrees as null and its live validator then
        // reports "orbits.phaseDegrees should be number, got object" for the whole scene.
        phaseDegrees: 0,
        itemType: 'circle',
        properties: { radius: 14, fillColor: '#38bdf8' },
      },
      {
        type: 'orbit',
        targetId: '$0',
        name: 'outer_planet',
        radius: 230,
        speed: 0.35,
        phaseDegrees: 120,
        itemType: 'circle',
        properties: { radius: 22, fillColor: '#f472b6' },
      },
    ],
  },
};

const HELP = `PinePaper Project Scaffolding

Create a runnable PinePaper project directory (pinepaper.json + scene.batch.json).

USAGE:
  pinepaper-mcp init [dir] [options]

OPTIONS:
  -t, --template <name>   Template: minimal (default), social-post, chart, diagram, solar-system
  --list-templates        List built-in templates and exit
  --force                 Overwrite existing pinepaper.json / scene.batch.json
  --json                  Emit machine-readable JSON output
  -h, --help              Show help

TIP:
  For token-efficient scripted/CI scenes using create_many, timeline, and pattern ops,
  configure your MCP client with PINEPAPER_TOOLKIT=lane (pinepaper-mcp setup <client> --toolkit lane).`;

export const initCommand: CliCommand = {
  name: 'init',
  category: 'Authoring & Preview',
  summary: 'Scaffold a new PinePaper project (pinepaper.json + scene.batch.json)',
  usage: 'pinepaper-mcp init [dir] [--template minimal|social-post|chart|diagram|solar-system]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, initCommand, {
      template: { type: 'string', short: 't' },
      'list-templates': { type: 'boolean' },
      force: { type: 'boolean' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    if (boolFlag(parsed.parsed.flags, 'list-templates')) {
      const list = Object.values(TEMPLATES).map((t) => ({ name: t.name, description: t.description }));
      if (parsed.json) {
        emitJson('init', { templates: list });
      } else {
        console.log('Available PinePaper Project Templates:\n');
        for (const t of list) console.log(`  ${t.name.padEnd(16)} ${t.description}`);
      }
      return 0;
    }

    const templateName = (strFlag(parsed.parsed.flags, 'template') || 'minimal').toLowerCase();
    const tpl = TEMPLATES[templateName];
    if (!tpl) {
      const hint = suggestCommand(templateName, Object.keys(TEMPLATES));
      return failWith(
        parsed.json, 'init',
        `Unknown template "${templateName}".${hint ? ` Did you mean "${hint}"?` : ''} Available templates: ${Object.keys(TEMPLATES).join(', ')}`,
        1,
      );
    }

    const targetDir = resolve(parsed.parsed.positionals[0] || '.');
    const force = boolFlag(parsed.parsed.flags, 'force') === true;
    const configPath = join(targetDir, 'pinepaper.json');
    const scenePath = join(targetDir, 'scene.batch.json');

    if (!force && (existsSync(configPath) || existsSync(scenePath))) {
      return failWith(parsed.json, 'init', `Target already has pinepaper.json or scene.batch.json in ${targetDir}. Pass --force to overwrite.`, 1);
    }

    const config: ProjectConfig = { name: basename(targetDir), ...tpl.config };
    try {
      mkdirSync(targetDir, { recursive: true });
      writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
      writeFileSync(scenePath, JSON.stringify({ atomic: true, operations: tpl.operations }, null, 2) + '\n', 'utf-8');
    } catch (e) {
      // A path that is a file, a read-only folder, a full disk: one line, not a stack trace.
      return failWith(parsed.json, 'init', `Could not write the project to ${targetDir}: ${e instanceof Error ? e.message : String(e)}`, 1);
    }

    const created = [configPath, scenePath];
    if (parsed.json) {
      emitJson('init', { ok: true, dir: targetDir, template: tpl.name, files: created });
      return 0;
    }

    console.log(`Initialized PinePaper project (${tpl.name}) in ${targetDir}\n`);
    for (const f of created) console.log(`  created ${f}`);
    console.log('\nNext steps:');
    console.log(`  pinepaper-mcp check ${targetDir} --offline`);
    console.log(`  pinepaper-mcp preview ${targetDir}`);
    console.log(`  pinepaper-mcp snapshot ${targetDir} --times 0,1,2`);
    console.log(`  pinepaper-mcp render ${targetDir}`);
    console.log('  Tip: PINEPAPER_TOOLKIT=lane enables the token-efficient 8-tool agent lane (create_many, timeline, pattern).');
    return 0;
  },
};
