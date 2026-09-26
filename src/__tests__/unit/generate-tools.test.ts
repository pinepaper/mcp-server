/**
 * pinepaper_generate / _estimate / _status against a fake PinePaper cloud.
 * Shapes are the cloud's (mcp-cloud src/handlers/generate.ts,
 * services/generate/jobs.ts at c5ef8521).
 */
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { generateDeps } from '../../tools/handlers/generate.js';
import { handleToolCall } from '../../tools/handlers.js';

const saved = { ...generateDeps };
const env = { key: process.env.PINEPAPER_API_KEY, url: process.env.PINEPAPER_CLOUD_URL };
let calls: Array<{ method: string; url: string; body?: any; auth?: string }> = [];
let clock = 0;

function cloud(routes: Record<string, (body: any) => { status: number; json: any } | Array<{ status: number; json: any }>>) {
  const queues: Record<string, Array<{ status: number; json: any }>> = {};
  generateDeps.fetch = (async (url: string, init?: RequestInit) => {
    const method = init?.method ?? 'GET';
    const path = url.replace('https://cloud.test', '');
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url: path, body, auth: (init?.headers as Record<string, string> | undefined)?.Authorization });
    const key = `${method} ${path}`;
    const h = routes[key];
    if (!h) return new Response(JSON.stringify({ error: 'no route ' + key }), { status: 404 });
    let r = h(body);
    if (Array.isArray(r)) { queues[key] = queues[key] ?? r.slice(); r = queues[key].length > 1 ? queues[key].shift()! : queues[key][0]; }
    return new Response(JSON.stringify(r.json), { status: r.status, headers: { 'content-type': 'application/json' } });
  }) as typeof generateDeps.fetch;
}
const out = (r: { content?: Array<{ type: string; text?: string }>; isError?: boolean }) => (r.content ?? []).map((c) => c.text ?? '').join('\n');

beforeEach(() => {
  calls = []; clock = 0;
  process.env.PINEPAPER_API_KEY = 'pp_sa_test'; process.env.PINEPAPER_CLOUD_URL = 'https://cloud.test';
  generateDeps.sleep = async (ms: number) => { clock += ms; };
  generateDeps.now = () => clock;
});
afterEach(() => {
  Object.assign(generateDeps, saved);
  if (env.key === undefined) delete process.env.PINEPAPER_API_KEY; else process.env.PINEPAPER_API_KEY = env.key;
  if (env.url === undefined) delete process.env.PINEPAPER_CLOUD_URL; else process.env.PINEPAPER_CLOUD_URL = env.url;
});

const req = { model: 'flux-pro-1.1', input: { prompt: 'a lighthouse at dusk', aspect: '16:9', n: 1 } };

describe('pinepaper_generate', () => {
  it('without a key: says how to configure it, calls nothing', async () => {
    delete process.env.PINEPAPER_API_KEY;
    const r = await handleToolCall('pinepaper_generate', req, {});
    expect(r.isError).toBe(true);
    expect(out(r)).toContain('PINEPAPER_API_KEY');
  });

  it('403: not enabled for the organisation, nothing charged', async () => {
    cloud({ 'POST /v1/generate': () => ({ status: 403, json: { type: 'waitlist_pending', detail: 'waitlisted' } }) });
    const r = await handleToolCall('pinepaper_generate', req, {});
    expect(out(r)).toContain('not enabled for your organisation');
    expect(out(r)).toContain('Nothing was charged');
  });

  it('submits with the key and brief / designRef, polls to done, returns assets, charge and notes', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 'g1', status: 'queued' }, estimate: { priceUsd: 0.45, notes: 'SynthID watermark; processed by Google' }, poll: '/v1/generate/g1' } }),
      'GET /v1/generate/g1': () => [
        { status: 200, json: { ok: true, job: { id: 'g1', status: 'running' } } },
        { status: 200, json: { ok: true, job: { id: 'g1', status: 'done', model: 'nano-banana-pro', assets: [{ assetId: 'a1', ref: '/scene-assets/a1', width: 928, height: 1152 }], chargedUsd: 0.45 } } },
      ],
    });
    const r = await handleToolCall('pinepaper_generate', { ...req, brief: 'launch hero', designRef: { kind: 'design', id: 'd9' } }, {});
    const o = JSON.parse(out(r));
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/v1/generate', auth: 'Bearer pp_sa_test' });
    expect(calls[0].body).toMatchObject({ model: 'flux-pro-1.1', brief: 'launch hero', designRef: { kind: 'design', id: 'd9' } });
    expect(o).toMatchObject({ success: true, jobId: 'g1', chargedUsd: 0.45, notes: 'SynthID watermark; processed by Google' });
    expect(o.assets[0]).toMatchObject({ width: 928, height: 1152 });
  });

  it('a safety refusal is an error that says nothing was charged', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 'g2', status: 'queued' }, estimate: {} } }),
      'GET /v1/generate/g2': () => ({ status: 200, json: { ok: true, job: { id: 'g2', status: 'refused', error: "The model's safety filter refused this. Nothing was charged." } } }),
    });
    const r = await handleToolCall('pinepaper_generate', req, {});
    expect(r.isError).toBe(true);
    expect(out(r)).toContain('Nothing was charged');
  });

  it('a job that outlives timeoutSec is handed back to collect, not claimed', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 'g3', status: 'queued' }, estimate: {} } }),
      'GET /v1/generate/g3': () => ({ status: 200, json: { ok: true, job: { id: 'g3', status: 'running' } } }),
    });
    const o = JSON.parse(out(await handleToolCall('pinepaper_generate', { ...req, timeoutSec: 10 }, {})));
    expect(o).toMatchObject({ success: false, pending: true, jobId: 'g3' });
    expect(o.note).toContain('pinepaper_generate_status');
  });
});

describe('pinepaper_generate_estimate', () => {
  it('lists models and prices one request, free', async () => {
    cloud({
      'GET /v1/generate/models': () => ({ status: 200, json: { available: true, defaults: { hero: 'nano-banana-pro' }, models: [{ id: 'flux-pro-1.1', perOutput: { priceUsd: 0.12 } }] } }),
      'POST /v1/generate:estimate': () => ({ status: 200, json: { ok: true, estimate: { priceUsd: 0.12 } } }),
    });
    const o = JSON.parse(out(await handleToolCall('pinepaper_generate_estimate', { ...req, listModels: true }, {})));
    expect(o).toMatchObject({ success: true, free: true, estimate: { priceUsd: 0.12 }, defaults: { hero: 'nano-banana-pro' } });
    expect(o.models[0].id).toBe('flux-pro-1.1');
  });
});

describe('place', () => {
  it('downloads the first asset with the key, imports it, and fits it to the canvas', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 'g4', status: 'queued' }, estimate: {} } }),
      'GET /v1/generate/g4': () => ({ status: 200, json: { ok: true, job: { id: 'g4', status: 'done', assets: [{ assetId: 'a9', ref: '/scene-assets/a9', width: 1024, height: 576 }], chargedUsd: 0.12 } } }),
    });
    const base = generateDeps.fetch;
    generateDeps.fetch = (async (url: string, init?: RequestInit) => url.endsWith('/v1/assets/a9')
      ? (calls.push({ method: 'GET', url: '/v1/assets/a9', auth: (init?.headers as Record<string, string>)?.Authorization }), new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png' } }))
      : base(url, init)) as typeof generateDeps.fetch;
    const ran: string[] = [];
    const controller = { connected: true, connect: async () => undefined,
      executeCode: async (code: string) => { ran.push(code); return { success: true, result: code.includes('it.scale(') ? { fitted: true, width: 1920, height: 1080 } : { success: true, itemId: 'item_7' } }; } };
    const o = JSON.parse(out(await handleToolCall('pinepaper_generate', { ...req, place: 'cover' }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' })));
    expect(calls.find((c) => c.url === '/v1/assets/a9')?.auth).toBe('Bearer pp_sa_test');
    expect(o.placement).toMatchObject({ placed: true, itemId: 'item_7', fit: 'cover' });
    expect(ran.some((c) => c.includes('Math.max(cs.width / b.width'))).toBe(true);
  });
});

describe('place a video asset', () => {
  it('goes in as a video layer, fitted from its own bounds, with its duration', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 'v1', status: 'queued' }, estimate: {} } }),
      'GET /v1/generate/v1': () => ({ status: 200, json: { ok: true, job: { id: 'v1', status: 'done', assets: [{ assetId: 'av', ref: '/scene-assets/av', width: 1280, height: 720, durationSeconds: 8, fps: 24 }], chargedUsd: 1.2 } } }),
    });
    const base = generateDeps.fetch;
    generateDeps.fetch = (async (url: string, init?: RequestInit) => url.endsWith('/v1/assets/av')
      ? new Response(new Uint8Array([0, 0, 0, 24]), { headers: { 'content-type': 'video/mp4' } })
      : base(url, init)) as typeof generateDeps.fetch;
    const ran: string[] = [];
    const controller = { connected: true, connect: async () => undefined,
      executeCode: async (code: string) => { ran.push(code); return { success: true, result: code.includes('it.scale(') ? { fitted: true } : { success: true, action: 'upload_video', media: { id: 'vraster_1', registryId: 'item_9' } } }; } };
    const o = JSON.parse(out(await handleToolCall('pinepaper_generate', { ...req, place: 'contain' }, { executeInBrowser: true, browserController: controller as never, executionMode: 'puppeteer' })));
    expect(ran.some((c) => c.includes('uploadVideo'))).toBe(true);
    expect(ran.some((c) => c.includes('uploadImage') || c.includes('importImage'))).toBe(false);
    expect(o.placement).toMatchObject({ placed: true, kind: 'video', itemId: 'item_9', fit: 'contain', durationSeconds: 8, fps: 24 });
    // The fit reads the placed item's bounds — never the requested aspect.
    const fitCode = ran.find((c) => c.includes('it.scale('))!;
    expect(fitCode).toContain('Math.min(cs.width / b.width, cs.height / b.height)');
    expect(fitCode).not.toContain('16:9');
  });
});

describe('words are vector (cloud fef660ae)', () => {
  it('input.text reaches the cloud, and textLayers + hint come back', async () => {
    cloud({
      'POST /v1/generate': () => ({ status: 202, json: { ok: true, job: { id: 't1', status: 'queued' }, estimate: {} } }),
      'GET /v1/generate/t1': () => ({ status: 200, json: { ok: true, job: { id: 't1', status: 'done', assets: [{ assetId: 'p', ref: '/scene-assets/p', width: 1856, height: 2304 }], chargedUsd: 0.18,
        textLayers: [{ content: 'SUMMER SALE', role: 'headline' }, { content: 'Ends Sunday', role: 'caption' }], hint: 'The plate is text-free: add these words as PinePaper text layers.' } } }),
    });
    const o = JSON.parse(out(await handleToolCall('pinepaper_generate', { useCase: 'posters', input: { prompt: 'beach poster', aspect: '4:5', text: [{ content: 'SUMMER SALE', role: 'headline' }, { content: 'Ends Sunday', role: 'caption' }] } }, {})));
    expect(calls[0].body.input.text).toEqual([{ content: 'SUMMER SALE', role: 'headline' }, { content: 'Ends Sunday', role: 'caption' }]);
    expect(o.textLayers).toHaveLength(2);
    expect(o.hint).toContain('text-free');
  });
});

describe('text layer layout in the page', () => {
  it('title-safe, role-placed, and a scrim only where the plate is too bright', async () => {
    const { emitTextLayersPlacement } = await import('../../types/code-generator.js');
    const W = 1080, H = 1350;
    let n = 0;
    const made: Array<Record<string, any>> = [];
    const mk = (p: Record<string, any>) => {
      const w = p.fontSize ? Math.min(p.content.length * p.fontSize * 0.5, W) : p.width, h = p.fontSize ? p.fontSize * 1.2 : p.height;
      const a = String(p.anchor || 'top-left');
      const left = a.endsWith('right') ? p.x - w : p.x, top = a.startsWith('bottom') ? p.y - h : p.y;
      const it: Record<string, any> = { ...p, data: { registryId: 'item_' + (++n) }, bounds: { left, top, width: w, height: h, bottom: top + h, right: left + w, center: { x: left + w / 2, y: top + h / 2 } }, insertBelow() { this.below = true; } };
      made.push(it);
      return it;
    };
    // The plate: dark at the top, bright at the bottom.
    const plate = { getAverageColor: (b: { top: number }) => (b.top > H / 2 ? { red: 0.95, green: 0.95, blue: 0.9 } : { red: 0.05, green: 0.05, blue: 0.1 }) };
    const app = { getItemById: (id: string) => (id === 'plate_1' ? plate : null), getCanvasSize: () => ({ width: W, height: H }), create: (_t: string, p: Record<string, any>) => mk(p) };
    const code = emitTextLayersPlacement([{ content: 'SUMMER SALE', role: 'headline' }, { content: 'Ends Sunday', role: 'caption' }], 'plate_1');
    const r = await new Function('app', 'window', 'document', `return (async function() {${code}})()`)(app, {}, undefined);
    const [cap, head] = [r.textItems.find((t: any) => t.role === 'caption'), r.textItems.find((t: any) => t.role === 'headline')];
    const headItem = made.find((m) => m.content === 'SUMMER SALE')!, capItem = made.find((m) => m.content === 'Ends Sunday')!;
    expect(headItem).toMatchObject({ x: 54, y: 68, anchor: 'top-left', fontFamily: 'Anton', color: '#ffffff' });   // 5% of 1080 / 1350
    expect(capItem).toMatchObject({ x: 54, y: H - 68, anchor: 'bottom-left', fontFamily: 'Inter' });
    expect(head.contrast).toMatchObject({ checked: true });
    expect(head.contrast.scrim).toBeUndefined();                    // white on dark: passes
    expect(cap.contrast.scrim.opacity).toBeGreaterThan(0.2);          // white on bright: scrim
    expect(cap.contrast.ratioAfter).toBeGreaterThanOrEqual(cap.contrast.required);
  });
});
