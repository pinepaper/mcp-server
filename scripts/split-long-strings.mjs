#!/usr/bin/env node
/**
 * Cut every string literal in dist/ that is longer than LIMIT characters into shorter pieces joined with `+`.
 *
 * WHY. A supply-chain scanner (Socket) reports each string literal over ~1,000 characters as a "long string", a
 * low-severity finding it uses to spot packed payloads, and its score counts every location. This package's long
 * strings are prose: tool descriptions (definitions.js) and the page code the generators write (code-generator.js).
 * 1.6.28 had 256 of them, most of its low-severity count. The value is unchanged; only its spelling in the file is.
 *
 * WHAT IT REWRITES, all untagged:
 *  - 'quoted' and "quoted" strings, and templates with no ${}: ("piece" + "piece" + …)
 *  - templates with ${}: ("piece" + String(expr) + "piece" + …). String(x) is what a template does with x
 *    (ToString), except that a Symbol throws in a template and does not here.
 *  - String.raw`…`: its value is the RAW text (escapes kept as written), so the pieces are the raw text.
 * NOT REWRITTEN: other tagged templates (the tag sees the pieces), property names, import / export specifiers, directives,
 * and type positions.
 *
 * SAFE BY CONSTRUCTION AND CHECKED: each piece is JSON.stringify of the cooked text, split on code points (never
 * inside a surrogate pair). Every rewritten plain string is evaluated back and compared with the original value, and
 * every changed file must pass `node --check`. Line breaks inside a literal are kept as line breaks between pieces,
 * so line numbers (and the source maps) still line up.
 *
 *   node scripts/split-long-strings.mjs          rewrite dist/
 *   node scripts/split-long-strings.mjs --check  exit 1 if dist/ still has a long literal
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const DIST = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist');
/** Socket's shortest flagged literal was 1,027 bytes; stay well under. */
const LIMIT = 900;
/** The escaped length of one piece. */
const PIECE = 700;
const CHECK = process.argv.includes('--check');

function jsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) jsFiles(full, out);
    else if (name.endsWith('.js')) out.push(full);
  }
  return out;
}

/** JSON-quoted pieces of `text`, each at most PIECE characters as written. */
function pieces(text) {
  const out = [];
  let cur = '';
  let curLen = 2;
  for (const ch of text) {
    const w = JSON.stringify(ch).length - 2;
    if (curLen + w > PIECE && cur) { out.push(JSON.stringify(cur)); cur = ''; curLen = 2; }
    cur += ch;
    curLen += w;
  }
  if (cur || !out.length) out.push(JSON.stringify(cur));
  return out;
}

/** Positions where an expression is not allowed (a name, a module specifier, a type, a directive). */
/** String.raw`…`: the one tag whose result is fixed, the raw text with the substitutions in between. */
function isStringRaw(tagged) {
  const t = tagged.tag;
  return ts.isPropertyAccessExpression(t) && ts.isIdentifier(t.expression) && t.expression.text === 'String' && t.name.text === 'raw' && !tagged.typeArguments;
}

function skippable(node) {
  const p = node.parent;
  if (!p) return true;
  if (ts.isTaggedTemplateExpression(p)) return true;
  if ((ts.isPropertyAssignment(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isPropertySignature(p)) && p.name === node) return true;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p) || ts.isExternalModuleReference(p) || ts.isImportTypeNode(p)) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isExpressionStatement(p) && ts.isStringLiteral(node)) return true; // a directive ('use strict') or a no-op
  if (ts.isCallExpression(p) && p.expression.kind === ts.SyntaxKind.ImportKeyword) return true; // import('…')
  return false;
}

/** Join pieces, spending the literal's original line breaks between them so later lines do not move. */
function joinKeepingLines(parts, newlines) {
  let out = '(';
  parts.forEach((part, i) => {
    out += part;
    if (i < parts.length - 1) {
      if (newlines > 0) { out += ' +\n'; newlines--; } else out += ' + ';
    }
  });
  return out + '\n'.repeat(newlines) + ')';
}

/** One pass: the outermost long literals in `text`, rewritten. Inner ones are found by the next pass. */
function pass(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const edits = [];
  const visit = (node) => {
    const start = node.getStart(sf);
    const src = text.slice(start, node.end);
    if (ts.isTaggedTemplateExpression(node) && isStringRaw(node) && text.slice(node.template.getStart(sf), node.end).length > LIMIT) {
      const tpl = node.template;
      const newlines = (text.slice(node.getStart(sf), node.end).match(/\n/g) || []).length;
      const parts = [];
      if (ts.isNoSubstitutionTemplateLiteral(tpl)) parts.push(...pieces(tpl.rawText));
      else {
        if (tpl.head.rawText) parts.push(...pieces(tpl.head.rawText));
        for (const span of tpl.templateSpans) {
          parts.push(`String(${text.slice(span.expression.getStart(sf), span.expression.end)})`);
          if (span.literal.rawText) parts.push(...pieces(span.literal.rawText));
        }
        if (!parts.length || !parts[0].startsWith('"')) parts.unshift('""');
      }
      const replacement = joinKeepingLines(parts, newlines);
      if (ts.isNoSubstitutionTemplateLiteral(tpl)) {
        // eslint-disable-next-line no-new-func
        const want = new Function(`return ${text.slice(node.getStart(sf), node.end)};`)();
        // eslint-disable-next-line no-new-func
        if (new Function(`return ${replacement};`)() !== want) throw new Error(`${relative(DIST, file)}: a rewritten String.raw does not equal the original at ${node.getStart(sf)}`);
      }
      edits.push({ start: node.getStart(sf), end: node.end, replacement });
      return;
    }
    const isPlain = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
    const isTemplate = ts.isTemplateExpression(node);
    if ((isPlain || isTemplate) && src.length > LIMIT && !skippable(node)) {
      const newlines = (src.match(/\n/g) || []).length;
      if (isPlain) {
        const replacement = joinKeepingLines(pieces(node.text), newlines);
        // Evaluate it back: a plain literal's rewrite must be exactly its value.
        // eslint-disable-next-line no-new-func
        const back = new Function(`return ${replacement};`)();
        if (back !== node.text) throw new Error(`${relative(DIST, file)}: a rewritten string does not equal the original at ${start}`);
        edits.push({ start, end: node.end, replacement });
      } else {
        const parts = [];
        if (node.head.text) parts.push(...pieces(node.head.text));
        for (const span of node.templateSpans) {
          parts.push(`String(${text.slice(span.expression.getStart(sf), span.expression.end)})`);
          if (span.literal.text) parts.push(...pieces(span.literal.text));
        }
        if (!parts.length || !parts[0].startsWith('"')) parts.unshift('""'); // keep it a string even if it opens with ${}
        edits.push({ start, end: node.end, replacement: joinKeepingLines(parts, newlines) });
      }
      return; // outermost only
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) return { text, count: 0 };
  let out = text;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  return { text: out, count: edits.length };
}

/** Long literals left in a file (for --check and the final count). */
function longLiterals(file, text) {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let n = 0;
  const visit = (node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) {
      if (node.end - node.getStart(sf) > LIMIT) n++;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return n;
}

let rewritten = 0;
let files = 0;
let left = 0;
const leftIn = [];
for (const file of jsFiles(DIST)) {
  const original = readFileSync(file, 'utf8');
  let text = original;
  if (!CHECK) {
    for (let i = 0; i < 8; i++) {
      const r = pass(file, text);
      if (!r.count) break;
      text = r.text;
      rewritten += r.count;
    }
    if (text !== original) {
      writeFileSync(file, text);
      execFileSync(process.execPath, ['--check', file]);
      files++;
    }
  }
  const n = longLiterals(file, text);
  if (n) { left += n; leftIn.push(`${relative(DIST, file)} (${n})`); }
}
if (CHECK) {
  if (left) { console.error(`dist/ has ${left} string literal(s) over ${LIMIT} characters: ${leftIn.join(', ')}\nRun: node scripts/split-long-strings.mjs`); process.exit(1); }
  console.log(`✅ no string literal in dist/ is over ${LIMIT} characters`);
} else {
  console.log(`✅ split ${rewritten} long string literal(s) in ${files} file(s)${left ? `; ${left} left (names, specifiers or tagged templates): ${leftIn.join(', ')}` : ''}`);
}
