/**
 * `pinepaper-mcp check [file-or-dir]` (aliases: `validate`, `lint`) —
 * Run offline schema/macro/vocabulary validation and live Studio scene + lint checks.
 */

import { detectBatchPropertyTypos, validateBatchVocabulary } from '../../ontology/hints.js';
import { BatchMacroError, batchPreflightView, expandBatchMacros } from '../../tools/batch-macros.js';
import { batchOpIgnoredPaths, CUSTOM_RELATION_NAMES, handleToolCall } from '../../tools/handlers.js';
import { AgentBatchExecuteInputSchema } from '../../types/schemas.js';
import { boolFlag, strFlag } from '../args.js';
import { findBadItemRefs } from '../batch-refs.js';
import { emitJson, extractToolJson, formatCheckLine, resolveSceneInput, type ResolvedSceneInput } from '../output.js';
import { loadSceneIntoStudio, normalizeBatchPayload, withCliBrowser } from '../scene-runner.js';
import { parseCommandArgs, type CliCommand } from '../types.js';

export interface CheckFinding {
  stage: 'offline' | 'validate' | 'lint';
  /** suggestion: the studio's lint proposes a relation; nothing is wrong with the scene. */
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  path?: string;
}

const HELP = `PinePaper Scene Checker

Validate a PinePaper project folder, .batch.json, or .pinepaper.json file.
Aliases: validate, lint

USAGE:
  pinepaper-mcp check [file-or-dir] [options]

OPTIONS:
  --offline             Run schema, macro, and ontology checks without launching Chrome
  --allow-code          Allow custom relations/hooks in loaded scene
  --allow-local-files   Let the live check read local files (a saved .pinepaper.json project, image paths); off by default
  --studio-url <url>    Override Studio URL
  --json                Emit machine-readable JSON output
  -h, --help            Show help`;

function runOfflineChecks(input: ResolvedSceneInput): CheckFinding[] {
  const findings: CheckFinding[] = [];
  if (input.kind === 'project') {
    const doc = input.parsed as { kind?: unknown; formatVersion?: unknown };
    if (doc.kind !== 'pinepaper.project' || typeof doc.formatVersion !== 'string') {
      findings.push({
        stage: 'offline',
        severity: 'error',
        message: 'Project document must declare "kind": "pinepaper.project" and string "formatVersion".',
      });
    }
    return findings;
  }

  const payload = normalizeBatchPayload(input.parsed);
  const parsedBatch = AgentBatchExecuteInputSchema.safeParse(payload);
  if (!parsedBatch.success) {
    for (const issue of parsedBatch.error.issues) {
      findings.push({
        stage: 'offline',
        severity: 'error',
        path: issue.path.join('.'),
        message: issue.message,
      });
    }
    return findings;
  }

  if (!parsedBatch.data.skipValidation) {
    const { ops, paths } = batchPreflightView(parsedBatch.data.operations as ReadonlyArray<Record<string, unknown>>);
    for (const v of validateBatchVocabulary(ops, { relationType: CUSTOM_RELATION_NAMES })) {
      const hint = v.hint;
      findings.push({
        stage: 'offline',
        severity: 'error',
        path: `${paths[v.opIndex]}.${v.field}`,
        message: `Unknown ${hint.label} "${String(hint.received)}"${hint.suggestion ? ` (did you mean "${hint.suggestion}"?)` : ''}`,
      });
    }
    for (const t of detectBatchPropertyTypos(ops)) {
      findings.push({
        stage: 'offline',
        severity: 'error',
        path: `${paths[t.opIndex]}.properties.${t.property}`,
        message: `Likely property typo "${t.property}" on ${t.itemType} (did you mean "${t.suggestion}"?)`,
      });
    }
  }

  // $N must name an item this batch has already made, whether or not vocabulary checks were skipped.
  for (const ref of findBadItemRefs(parsedBatch.data.operations as ReadonlyArray<Record<string, unknown>>)) {
    findings.push({ stage: 'offline', severity: 'error', path: ref.path, message: ref.message });
  }

  try {
    expandBatchMacros(parsedBatch.data.operations as Array<Record<string, unknown>>);
  } catch (e) {
    findings.push({
      stage: 'offline',
      severity: 'error',
      message: e instanceof BatchMacroError ? e.message : (e instanceof Error ? e.message : String(e)),
    });
  }

  for (const ignored of batchOpIgnoredPaths(payload)) {
    findings.push({
      stage: 'offline',
      severity: 'warning',
      path: ignored,
      message: `Unrecognized batch field "${ignored}" will be ignored.`,
    });
  }
  return findings;
}

/** What the Studio ignored or rewrote while loading the scene, as warnings (ignoredOptions, translated arguments). */
export type LintSuggestion = { message?: string; relation?: string; type?: string; from?: string; to?: string; params?: Record<string, unknown> };

/** One relation the studio's lint proposes, as a finding: a suggestion, with what it relates to what. */
export function lintSuggestionFinding(s: LintSuggestion): CheckFinding {
  const rel = s.type || s.relation || 'relation';
  const params = s.params && Object.keys(s.params).length ? ` ${JSON.stringify(s.params)}` : '';
  return {
    stage: 'lint',
    severity: 'suggestion',
    message: s.message || `consider ${rel}${s.from ? ` ${s.from}` : ''}${s.to ? ` -> ${s.to}` : ''}${params}`,
  };
}

export function collectLoadNotes(summary: unknown): string[] {
  const notes: string[] = [];
  const seen = new Set<unknown>();
  const walk = (v: unknown, depth: number): void => {
    if (!v || typeof v !== 'object' || depth > 4 || seen.has(v)) return;
    seen.add(v);
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.translatedArguments)) {
      for (const t of o.translatedArguments) if (typeof t === 'string') notes.push(`The Studio rewrote ${t}`);
    }
    if (Array.isArray(o.results)) {
      o.results.forEach((r, i) => {
        const rec = r && typeof r === 'object' ? (r as { index?: unknown; result?: { warning?: unknown } }) : undefined;
        const inner = rec?.result;
        const at = typeof rec?.index === 'number' ? rec.index : i;
        if (inner && typeof inner.warning === 'string' && inner.warning) notes.push(`op ${at}: ${inner.warning}`);
      });
    }
    for (const child of Object.values(o)) walk(child, depth + 1);
  };
  walk(summary, 0);
  return [...new Set(notes)];
}

export const checkCommand: CliCommand = {
  name: 'check',
  aliases: ['validate', 'lint'],
  category: 'Quality & Rendering',
  summary: 'Validate scene schema/ontology offline and lint live in Studio',
  usage: 'pinepaper-mcp check [file-or-dir] [--offline] [--json]',
  helpText: HELP,
  async run(argv) {
    const parsed = parseCommandArgs(argv, checkCommand, {
      offline: { type: 'boolean' },
      'allow-code': { type: 'boolean' },
      'allow-local-files': { type: 'boolean' },
      'studio-url': { type: 'string' },
    });
    if (parsed.kind !== 'ok') return parsed.code;

    const offline = boolFlag(parsed.parsed.flags, 'offline') === true;
    const allowCode = boolFlag(parsed.parsed.flags, 'allow-code') === true;
    const allowLocalFiles = boolFlag(parsed.parsed.flags, 'allow-local-files') === true;
    const studioUrl = strFlag(parsed.parsed.flags, 'studio-url');

    let input: ResolvedSceneInput;
    try {
      input = resolveSceneInput(parsed.parsed.positionals[0] || '.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (parsed.json) emitJson('check', { ok: false, errors: [{ stage: 'offline', severity: 'error', message: msg }] });
      else console.error(`pinepaper-mcp check: ${msg}`);
      return 1;
    }

    const findings: CheckFinding[] = runOfflineChecks(input);
    const offlineErrors = findings.filter((f) => f.severity === 'error');
    let liveValidate: unknown = null;
    let liveLint: unknown = null;

    if (!offline && offlineErrors.length === 0) {
      try {
        await withCliBrowser({ studioUrl, headless: true, allowCode, allowLocalFiles }, async (_ctl, handlerOpts) => {
          const loaded = await loadSceneIntoStudio(input, handlerOpts, allowCode);
          if (!loaded.ok) {
            findings.push({ stage: 'validate', severity: 'error', message: loaded.error || 'Scene failed to load in Studio' });
            return;
          }

          for (const note of collectLoadNotes(loaded.summary)) {
            findings.push({ stage: 'validate', severity: 'warning', message: note });
          }

          const valRes = extractToolJson(await handleToolCall('pinepaper_validate_scene', {}, handlerOpts));
          const valInner = (valRes.data as { result?: { diagnostics?: Array<{ severity?: string; code?: string; message?: string }> } } | null)?.result;
          liveValidate = valInner ?? valRes.data;
          if (!valRes.ok) {
            findings.push({ stage: 'validate', severity: 'error', message: valRes.text || 'validate_scene failed' });
          } else if (Array.isArray(valInner?.diagnostics)) {
            for (const d of valInner.diagnostics) {
              findings.push({
                stage: 'validate',
                severity: d.severity === 'warning' || d.severity === 'info' ? 'warning' : 'error',
                message: d.code ? `[${d.code}] ${d.message || ''}` : (d.message || 'Validation issue'),
              });
            }
          }

          const lintRes = extractToolJson(await handleToolCall('pinepaper_lint_scene', {}, handlerOpts));
          const lintInner = (lintRes.data as { result?: { suggestions?: LintSuggestion[] } } | null)?.result;
          liveLint = lintInner ?? lintRes.data;
          if (Array.isArray(lintInner?.suggestions)) {
            // The studio's lint proposes relations ({ from, to, type, params }): suggestions, not problems. They were
            // read as { message, relation }, which the studio does not send, so each printed as a bare
            // "Consider relation constraint" WARN.
            for (const s of lintInner.suggestions) findings.push(lintSuggestionFinding(s));
          }
        });
      } catch (e) {
        findings.push({ stage: 'validate', severity: 'error', message: e instanceof Error ? e.message : String(e) });
      }
    }

    const errors = findings.filter((f) => f.severity === 'error');
    const warnings = findings.filter((f) => f.severity === 'warning');
    const suggestions = findings.filter((f) => f.severity === 'suggestion');
    const ok = errors.length === 0;

    if (parsed.json) {
      emitJson('check', {
        ok,
        file: input.filePath,
        kind: input.kind,
        offline,
        errorCount: errors.length,
        warningCount: warnings.length,
        suggestionCount: suggestions.length,
        findings,
        ...(liveValidate ? { validate: liveValidate } : {}),
        ...(liveLint ? { lint: liveLint } : {}),
      });
      return ok ? 0 : 1;
    }

    console.log(`PinePaper Check: ${input.filePath} (${input.kind}${offline ? ', offline' : ''})\n`);
    console.log(formatCheckLine(ok ? 'PASS' : 'FAIL', 'Offline check', offlineErrors.length ? `${offlineErrors.length} error(s)` : 'valid schema, macros, and vocabulary'));
    if (!offline && offlineErrors.length === 0) {
      console.log(formatCheckLine(ok ? 'PASS' : 'FAIL', 'Studio audit', `${errors.length} error(s), ${warnings.length} warning(s)${suggestions.length ? `, ${suggestions.length} relation suggestion(s)` : ''}`));
    }
    for (const f of findings) {
      const loc = f.path ? `${f.path}: ` : '';
      console.log(formatCheckLine(f.severity === 'error' ? 'FAIL' : f.severity === 'suggestion' ? 'INFO' : 'WARN', f.stage, `${loc}${f.message}`));
    }
    return ok ? 0 : 1;
  },
};
