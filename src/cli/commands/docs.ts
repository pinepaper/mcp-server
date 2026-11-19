/**
 * `pinepaper-mcp docs [topic]` — Browse and read built-in documentation guides,
 * examples, and official PinePaper web URLs.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESOURCE_CONTENTS, RESOURCES } from '../../index.js';
import { boolFlag, suggestCommand } from '../args.js';
import { emitJson, PACKAGE_ROOT } from '../output.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

interface DocEntry {
  slug: string;
  uri: string;
  kind: 'guide' | 'example' | 'readme';
  title: string;
  description: string;
  webUrl: string;
}

const README_LANGS: Readonly<Record<string, string>> = {
  'zh-CN': 'README.zh-CN.md',
  ja: 'README.ja.md',
  ko: 'README.ko.md',
  es: 'README.es.md',
  'pt-BR': 'README.pt-BR.md',
  fr: 'README.fr.md',
  de: 'README.de.md',
  hi: 'README.hi.md',
};

const WEB_DOC_URLS: Readonly<Record<string, string>> = {
  docs: 'https://pinepaper.studio/docs',
  api: 'https://pinepaper.studio/api/',
  guide: 'https://pinepaper.studio/guide/',
  mcp: 'https://pinepaper.studio/docs/mcp',
  'tools-spec': 'https://pinepaper.studio/api/mcp/tools-spec',
  install: 'https://pinepaper.studio/api/mcp/installation',
  skills: 'https://pinepaper.studio/api/guides/skills',
};

const HELP = `PinePaper Docs

List and print built-in PinePaper guides, workflow examples, and documentation URLs.

USAGE:
  pinepaper-mcp docs [topic] [options]

OPTIONS:
  --list      List all built-in doc topics and official URLs
  --url       Print the official web URL instead of markdown content
  --json      Emit machine-readable JSON output
  -h, --help  Show help

EXAMPLES:
  pinepaper-mcp docs --list
  pinepaper-mcp docs getting-started
  pinepaper-mcp docs relations
  pinepaper-mcp docs --url skills`;

function slugFromUri(uri: string): string {
  if (uri.startsWith('pinepaper://docs/')) return uri.slice('pinepaper://docs/'.length);
  if (uri.startsWith('pinepaper://examples/')) return uri.slice('pinepaper://examples/'.length);
  return uri;
}

function buildCatalog(): DocEntry[] {
  const bySlug = new Map<string, DocEntry>();
  for (const r of RESOURCES) {
    const slug = slugFromUri(r.uri);
    const kind: DocEntry['kind'] = r.uri.startsWith('pinepaper://examples/')
      ? 'example'
      : slug.startsWith('readme')
        ? 'readme'
        : 'guide';
    bySlug.set(slug, {
      slug,
      uri: r.uri,
      kind,
      title: r.name,
      description: r.description,
      webUrl: kind === 'readme' ? 'https://github.com/pinepaper/mcp-server#readme' : 'https://pinepaper.studio/docs',
    });
  }
  for (const uri of Object.keys(RESOURCE_CONTENTS)) {
    const slug = slugFromUri(uri);
    if (!bySlug.has(slug)) {
      const kind: DocEntry['kind'] = uri.startsWith('pinepaper://examples/') ? 'example' : 'guide';
      bySlug.set(slug, {
        slug,
        uri,
        kind,
        title: slug,
        description: `Built-in ${kind}: ${slug}`,
        webUrl: 'https://pinepaper.studio/docs',
      });
    }
  }
  return [...bySlug.values()];
}

function readTopicContent(entry: DocEntry): string {
  if (entry.slug === 'readme') return readFileSync(join(PACKAGE_ROOT, 'README.md'), 'utf-8');
  if (entry.slug.startsWith('readme/')) {
    const lang = entry.slug.slice('readme/'.length);
    const file = README_LANGS[lang];
    if (!file) throw new Error(`Unknown README locale: ${lang}`);
    return readFileSync(join(PACKAGE_ROOT, file), 'utf-8');
  }
  const text = RESOURCE_CONTENTS[entry.uri];
  if (!text) throw new Error(`No content found for ${entry.uri}`);
  return text;
}

export const docsCommand: CliCommand = {
  name: 'docs',
  category: 'Docs & Discovery',
  summary: 'Read built-in guides and examples or print official documentation URLs',
  usage: 'pinepaper-mcp docs [topic] [--list] [--url] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, docsCommand, {
      list: { type: 'boolean' },
      url: { type: 'boolean' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const topic = parsed.parsed.positionals[0]?.trim();
    const listOnly = boolFlag(parsed.parsed.flags, 'list') === true || (!topic && !boolFlag(parsed.parsed.flags, 'url'));
    const urlOnly = boolFlag(parsed.parsed.flags, 'url') === true;
    const catalog = buildCatalog();

    if (urlOnly) {
      const key = topic?.toLowerCase() || 'docs';
      const url = WEB_DOC_URLS[key] || catalog.find((d) => d.slug === topic)?.webUrl || WEB_DOC_URLS.docs;
      if (parsed.json) {
        emitJson('docs', { topic: key, url, urls: WEB_DOC_URLS });
      } else if (!topic) {
        console.log('PinePaper Official Documentation URLs:\n');
        for (const [k, v] of Object.entries(WEB_DOC_URLS)) {
          console.log(`  ${k.padEnd(12)} ${v}`);
        }
      } else {
        console.log(url);
      }
      return 0;
    }

    if (listOnly) {
      if (parsed.json) {
        emitJson('docs', {
          topics: catalog.map((d) => ({ slug: d.slug, kind: d.kind, uri: d.uri, title: d.title, description: d.description })),
          urls: WEB_DOC_URLS,
        });
        return 0;
      }
      console.log('PinePaper Built-in Documentation & Examples\n');
      for (const kind of ['guide', 'example', 'readme'] as const) {
        const items = catalog.filter((d) => d.kind === kind && !d.slug.startsWith('readme/'));
        if (!items.length) continue;
        const header = kind === 'guide' ? 'Guides:' : kind === 'example' ? 'Examples:' : 'README:';
        console.log(header);
        for (const item of items) {
          console.log(`  ${item.slug.padEnd(26)} ${item.description.slice(0, 72)}`);
        }
        console.log('');
      }
      console.log('Web Documentation:');
      for (const [k, v] of Object.entries(WEB_DOC_URLS)) {
        console.log(`  ${k.padEnd(14)} ${v}`);
      }
      console.log('\nRead any topic: `pinepaper-mcp docs <slug>` (e.g. `pinepaper-mcp docs getting-started`)');
      return 0;
    }

    const normalized = topic!.replace(/^pinepaper:\/\/(docs|examples)\//, '');
    const entry = catalog.find((d) => d.slug === normalized || d.slug.toLowerCase() === normalized.toLowerCase());
    if (!entry) {
      const hint = suggestCommand(normalized, catalog.map((d) => d.slug));
      if (parsed.json) {
        emitJson('docs', { ok: false, error: `Unknown documentation topic "${topic}".`, ...(hint ? { suggestion: hint } : {}) });
      } else {
        console.error(`Unknown documentation topic "${topic}".${hint ? ` Did you mean "${hint}"?` : ''}`);
        console.error('Run `pinepaper-mcp docs --list` to see all available topics.');
      }
      return 1;
    }

    const content = readTopicContent(entry);
    if (parsed.json) {
      emitJson('docs', { topic: entry.slug, uri: entry.uri, title: entry.title, webUrl: entry.webUrl, content });
      return 0;
    }
    console.log(content);
    return 0;
  },
};
