/**
 * Generated media through the PinePaper cloud (fal models behind one door):
 * pinepaper_generate_estimate (free) and pinepaper_generate (charged).
 *
 * This is the one place the local server calls the hosted API. It needs a
 * service-account key (PINEPAPER_API_KEY, `pp_sa_…`) with the render:create
 * scope, and the org must have the ai-media feature — an internal beta, so a
 * 403 is the ordinary answer for most keys and is said as such.
 *
 * The job shape is the cloud's (/v1/generate → 202 {job}, poll
 * /v1/generate/{id}), shared by stills now and video next; video only needs a
 * longer poll, so the timeout is a parameter, not a per-model constant.
 */
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { errorResult, handleToolCall, type HandlerOptions } from '../handlers.js';
import { ErrorCodes } from '../../types/schemas.js';
import { emitTextLayersPlacement } from '../../types/code-generator.js';

const GenerateInputSchema = z.object({
  prompt: z.string().min(1),
  aspect: z.enum(['16:9', '9:16', '1:1', '4:5']).optional(),
  n: z.number().int().min(1).max(4).optional(),
  seed: z.number().int().optional(),
  negativePrompt: z.string().optional(),
  imageUrls: z.array(z.string().url()).max(14).optional(),
  // WORDS ARE VECTOR: the plate comes back text-free and these come back as
  // textLayers, to be added as real text. allowText (words drawn BY the model)
  // is refused except on eval-tier models.
  text: z.array(z.object({
    content: z.string().min(1).max(500),
    role: z.enum(['headline', 'subhead', 'caption', 'cta', 'label']).optional(),
    font: z.string().max(80).optional(),
  })).max(12).optional(),
  allowText: z.boolean().optional(),
});

export const GenerateEstimateArgsSchema = z.object({
  model: z.string().min(1).optional(),
  useCase: z.string().min(1).optional(),
  input: GenerateInputSchema.optional(),
  listModels: z.boolean().optional(),
}).refine((v) => v.listModels || (v.input && (v.model || v.useCase)), { message: 'give input and a model or useCase — or listModels: true to see the models and their prices' });

export const GenerateArgsSchema = z.object({
  model: z.string().min(1).optional(),
  useCase: z.string().min(1).optional(),
  input: GenerateInputSchema,
  brief: z.string().max(2000).optional(),
  designRef: z.object({ kind: z.string().min(1), id: z.string().min(1) }).optional(),
  place: z.union([z.boolean(), z.enum(['cover', 'contain'])]).optional(),
  timeoutSec: z.number().int().min(10).max(1800).optional(),
}).refine((v) => !!(v.model || v.useCase), { message: 'give a model (see pinepaper_generate_estimate listModels) or a useCase' });

/** Injectable for tests: the network and the clock. */
export const generateDeps = {
  fetch: (url: string, init?: RequestInit) => fetch(url, init),
  sleep: (ms: number) => new Promise<void>((r) => setTimeout(r, ms)),
  now: () => Date.now(),
};

function cloudConfig(): { base: string; key: string } | { error: string } {
  const key = (process.env.PINEPAPER_API_KEY || '').trim();
  const base = (process.env.PINEPAPER_CLOUD_URL || 'https://cloud.pinepaper.studio').replace(/\/+$/, '');
  if (!key) {
    return { error: 'generation runs in the PinePaper cloud and needs a service-account key: set PINEPAPER_API_KEY (pp_sa_…, with the render:create scope) in this server\'s environment. Generation is an internal beta, enabled per organisation (the ai-media feature).' };
  }
  return { base, key };
}

type CloudResult = { ok: true; status: number; body: Record<string, any> } | { ok: false; message: string; status?: number; code?: string };

/** What a refusal means, in the caller's terms. Every one says whether anything was charged. */
function explain(status: number, body: Record<string, any>): string {
  const said = String(body?.error || body?.detail || body?.title || '').trim();
  const code = String(body?.code || body?.type || '').toUpperCase();
  if (status === 401) return 'the cloud did not accept PINEPAPER_API_KEY (invalid or revoked). Nothing was charged.';
  if (status === 403 && /INSUFFICIENT_SCOPE/.test(code)) return `this key lacks the render:create scope that generation needs. ${said} Nothing was charged.`;
  if (status === 403) return 'generation (ai-media) is not enabled for your organisation — it is an internal beta, granted per organisation. Ask the PinePaper team for access. Nothing was charged.';
  if (status === 402) return `${said || 'not enough credits, or a spend cap was reached'}. Nothing was charged.`;
  if (status === 422) return `the request was refused as invalid: ${said || 'check model, aspect, n and imageUrls'}.`;
  if (status === 503) return said || 'generation is unavailable on this deployment right now. Nothing was charged.';
  return `${said || 'the cloud refused the request'} (HTTP ${status}).`;
}

async function call(cfg: { base: string; key: string }, method: 'GET' | 'POST', path: string, body?: unknown): Promise<CloudResult> {
  let res: Response;
  try {
    res = await generateDeps.fetch(cfg.base + path, {
      method,
      headers: { Authorization: `Bearer ${cfg.key}`, ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), 'User-Agent': 'PinePaper-MCP' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (e) {
    return { ok: false, message: `could not reach ${cfg.base}: ${e instanceof Error ? e.message : String(e)}. Nothing was charged.` };
  }
  let json: Record<string, any> = {};
  try { json = await res.json() as Record<string, any>; } catch { /* a non-JSON body is described by its status */ }
  if (!res.ok) return { ok: false, status: res.status, code: json?.code, message: explain(res.status, json) };
  return { ok: true, status: res.status, body: json };
}

const text = (v: unknown): CallToolResult => ({ content: [{ type: 'text' as const, text: JSON.stringify(v, null, 2) }] });
const fail = (r: { message: string; status?: number; code?: string }): CallToolResult =>
  errorResult(r.status === 422 ? ErrorCodes.INVALID_PARAMS : ErrorCodes.EXECUTION_ERROR, r.message, { ...(r.status ? { status: r.status } : {}), ...(r.code ? { code: r.code } : {}) });

const jobBody = (a: z.infer<typeof GenerateArgsSchema> | z.infer<typeof GenerateEstimateArgsSchema>) => ({
  ...(a.model ? { model: a.model } : {}), ...(a.useCase ? { useCase: a.useCase } : {}), input: a.input,
});

type GenAsset = { assetId: string; ref?: string; width: number; height: number; durationSeconds?: number; fps?: number };

/**
 * Bring the first asset into the studio, fitted to the canvas: an image as an
 * image item, a video (it has a duration) as a video layer. The fit is
 * computed in the page from the placed item's own bounds, never from the
 * requested aspect: models deliver their own sizes (2752x1536 is 1.79, not
 * 16:9), and those are what fill the frame.
 */
async function placeAsset(cfg: { base: string; key: string }, asset: GenAsset, mode: 'cover' | 'contain', options: HandlerOptions): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await generateDeps.fetch(`${cfg.base}/v1/assets/${encodeURIComponent(asset.assetId)}`, { headers: { Authorization: `Bearer ${cfg.key}` } });
  } catch (e) {
    return { placed: false, error: `could not download the asset: ${e instanceof Error ? e.message : String(e)}` };
  }
  if (!res.ok) return { placed: false, error: `the cloud refused the asset download (HTTP ${res.status})` };
  const type = (res.headers.get('content-type') || '').split(';')[0].trim();
  const isVideo = typeof asset.durationSeconds === 'number' || type.startsWith('video/');
  const dataUrl = `data:${type || (isVideo ? 'video/mp4' : 'image/png')};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
  const placedRes = isVideo
    ? await handleToolCall('pinepaper_media', { action: 'upload_video', url: dataUrl }, options)
    : await handleToolCall('pinepaper_import_image', { url: dataUrl }, options);
  const placedText = (placedRes.content ?? []).map((c) => ('text' in c ? c.text : '')).join('\n');
  const ref = isVideo
    ? (/"registryId":\s*"([^"]+)"/.exec(placedText)?.[1] ?? /"id":\s*"([^"]+)"/.exec(placedText)?.[1])
    : /"itemId":\s*"([^"]+)"/.exec(placedText)?.[1];
  if (placedRes.isError || !ref) return { placed: false, kind: isVideo ? 'video' : 'image', error: `generated, but could not be placed: ${placedText.slice(0, 300)}` };
  // Cover fills the canvas (the overflow is outside the frame); contain fits
  // inside it. Centred either way. A video's media id resolves to its item.
  const fit = await handleToolCall('pinepaper_execute_custom_code', {
    code: `let it = app.getItemById(${JSON.stringify(ref)});
if (!it && window.PinePaperAgent && typeof window.PinePaperAgent.listMedia === 'function') {
  const m = window.PinePaperAgent.listMedia().find(function(x) { return x.id === ${JSON.stringify(ref)} || x.registryId === ${JSON.stringify(ref)}; });
  if (m) it = app.getItemById(m.registryId);
}
const cs = app.getCanvasSize(); const b = it && it.bounds;
if (!it || !b || !(b.width > 0)) return { fitted: false };
const s = ${mode === 'cover' ? 'Math.max' : 'Math.min'}(cs.width / b.width, cs.height / b.height);
it.scale(s); it.position = new paper.Point(cs.width / 2, cs.height / 2);
return { fitted: true, width: Math.round(it.bounds.width), height: Math.round(it.bounds.height) };`,
  }, options);
  return {
    placed: true, kind: isVideo ? 'video' : 'image', itemId: ref, fit: mode,
    ...(isVideo ? { durationSeconds: asset.durationSeconds, ...(asset.fps ? { fps: asset.fps } : {}) } : {}),
    ...(fit.isError ? { fitNote: 'placed at its own size; fitting it to the canvas failed' } : {}),
  };
}

export const generateHandlers: Record<string, (args: Record<string, unknown>, options: HandlerOptions) => Promise<CallToolResult>> = {
  'pinepaper_generate_estimate': async (args) => {
    const a = GenerateEstimateArgsSchema.parse(args);
    const cfg = cloudConfig();
    if ('error' in cfg) return errorResult(ErrorCodes.INVALID_PARAMS, cfg.error);
    const out: Record<string, unknown> = {};
    if (a.listModels) {
      const m = await call(cfg, 'GET', '/v1/generate/models');
      if (!m.ok) return fail(m);
      out.models = m.body.models; out.defaults = m.body.defaults; out.available = m.body.available;
    }
    if (a.input) {
      const e = await call(cfg, 'POST', '/v1/generate:estimate', jobBody(a));
      if (!e.ok) return fail(e);
      out.estimate = e.body.estimate;
    }
    return text({ success: true, free: true, ...out });
  },

  'pinepaper_generate': async (args, options) => {
    const a = GenerateArgsSchema.parse(args);
    const cfg = cloudConfig();
    if ('error' in cfg) return errorResult(ErrorCodes.INVALID_PARAMS, cfg.error);
    // brief and designRef always travel: the cloud records each generation as
    // a node in the design graph, and they are what tie it to the design.
    const submitted = await call(cfg, 'POST', '/v1/generate', { ...jobBody(a), ...(a.brief ? { brief: a.brief } : {}), ...(a.designRef ? { designRef: a.designRef } : {}) });
    if (!submitted.ok) return fail(submitted);
    const jobId = submitted.body?.job?.id as string | undefined;
    const est = submitted.body?.estimate;
    if (!jobId) return errorResult(ErrorCodes.EXECUTION_ERROR, 'the cloud accepted the job but returned no id to poll', { response: submitted.body });

    // Poll to a terminal state. Stills take seconds; video will take minutes,
    // so the budget is the caller's (timeoutSec), backing off 2 s → 10 s.
    const deadline = generateDeps.now() + (a.timeoutSec ?? 180) * 1000;
    let wait = 2000;
    let job: Record<string, any> = submitted.body.job;
    while (!['done', 'failed', 'refused'].includes(job.status)) {
      if (generateDeps.now() >= deadline) {
        return text({ success: false, pending: true, jobId, status: job.status, estimate: est,
          note: `still ${job.status} after ${a.timeoutSec ?? 180} s. It keeps running in the cloud and is charged only if it delivers; call pinepaper_generate_status {jobId: "${jobId}"} to collect it (or retry with a larger timeoutSec — video can take minutes).` });
      }
      await generateDeps.sleep(wait);
      wait = Math.min(10_000, Math.round(wait * 1.5));
      // Polling is a GET, safe to repeat: one retry on a 5xx or an unreachable
      // cloud before it is reported (a transient 500 mid-job failed a run
      // that the rerun passed).
      let polled = await call(cfg, 'GET', `/v1/generate/${encodeURIComponent(jobId)}`);
      if (!polled.ok && (polled.status === undefined || polled.status >= 500)) {
        await generateDeps.sleep(3000);
        polled = await call(cfg, 'GET', `/v1/generate/${encodeURIComponent(jobId)}`);
      }
      if (!polled.ok) return fail({ ...polled, message: `${polled.message} The job ${jobId} may still finish: collect it with pinepaper_generate_status.` });
      job = polled.body.job ?? job;
    }

    if (job.status !== 'done') {
      return errorResult(job.status === 'refused' ? ErrorCodes.INVALID_PARAMS : ErrorCodes.EXECUTION_ERROR,
        String(job.error || (job.status === 'refused' ? "the model's safety filter refused this. Nothing was charged." : 'the generation failed. Nothing was charged.')),
        { jobId, status: job.status });
    }
    const assets = (job.assets ?? []) as GenAsset[];
    const result: Record<string, unknown> = {
      success: true, jobId, model: job.model, assets, chargedUsd: job.chargedUsd,
      ...(job.filtered ? { filtered: job.filtered, filteredNote: `${job.filtered} output(s) were removed by the safety filter and not charged.` } : {}),
      // A model may choose its own size for an aspect (nano-banana-pro: 928x1152
      // for 4:5); the sizes above are the files', not the request's.
      ...(est?.notes ? { notes: est.notes } : {}),
      ...(Array.isArray(job.textLayers) && job.textLayers.length ? { textLayers: job.textLayers, hint: job.hint } : {}),
    };
    if (a.place && assets.length) {
      const placement = await placeAsset(cfg, assets[0], a.place === 'contain' ? 'contain' : 'cover', options);
      // The words, as real text over the plate (role layout, title-safe,
      // contrast-checked against the plate). Their ids come back to restyle.
      if (placement.placed && Array.isArray(job.textLayers) && job.textLayers.length) {
        const laid = await handleToolCall('pinepaper_execute_custom_code', { code: emitTextLayersPlacement(job.textLayers, String(placement.itemId)) }, options);
        // The first text block is the executed result as JSON: {success, result}.
        const first = laid.content?.[0];
        let body: { result?: { textItems?: unknown[]; fonts?: unknown[] } } | null = null;
        try { body = first && 'text' in first ? JSON.parse(first.text) : null; } catch { body = null; }
        const items = body?.result?.textItems;
        placement.text = laid.isError || !Array.isArray(items)
          ? { placed: false, error: (first && 'text' in first ? first.text : '').slice(0, 300) }
          : { placed: true, items, ...(body?.result?.fonts?.length ? { fonts: body.result.fonts } : {}) };
      }
      result.placement = placement;
    }
    return text(result);
  },

  'pinepaper_generate_status': async (args, options) => {
    const a = z.object({ jobId: z.string().min(1), place: z.union([z.boolean(), z.enum(['cover', 'contain'])]).optional() }).parse(args);
    const cfg = cloudConfig();
    if ('error' in cfg) return errorResult(ErrorCodes.INVALID_PARAMS, cfg.error);
    const polled = await call(cfg, 'GET', `/v1/generate/${encodeURIComponent(a.jobId)}`);
    if (!polled.ok) return fail(polled);
    const job = polled.body.job ?? {};
    const out: Record<string, unknown> = { success: job.status === 'done', jobId: a.jobId, status: job.status, ...(job.assets ? { assets: job.assets } : {}),
      ...(job.chargedUsd != null ? { chargedUsd: job.chargedUsd } : {}), ...(job.error ? { error: job.error } : {}) };
    if (job.status === 'done' && a.place && job.assets?.length) out.placement = await placeAsset(cfg, job.assets[0], a.place === 'contain' ? 'contain' : 'cover', options);
    return text(out);
  },
};
