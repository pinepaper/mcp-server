/**
 * html5-ad and playable exports (8.21 / 8.24): the widget page wrapped for a
 * display network (zip + ad.size + clickTag + backup) or as an MRAID playable.
 */
import { describe, it, expect } from 'bun:test';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { buildZip, crc32 } from '../../utils/zip.js';
import { buildHtml5Ad, buildPlayable, externalRequests } from '../../utils/ad-package.js';
import { codeGenerator } from '../../types/code-generator.js';
import { AgentExportInputSchema } from '../../types/schemas.js';

const PAGE = '<!doctype html><html lang="en"><head><title>w</title></head><body><div id="w"></div><script>/*widget*/</script></body></html>';

describe('zip writer', () => {
  it('crc32 matches the published check value', () => {
    // The CRC-32 check value for "123456789" (ISO-HDLC) is 0xCBF43926.
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
  });

  it('an independent reader opens it and gets the bytes back', () => {
    let python = true;
    try { execFileSync('python3', ['-c', 'import zipfile']); } catch { python = false; }
    if (!python) return; // no independent reader on this machine
    const html = PAGE.repeat(50);
    const zip = buildZip([{ name: 'index.html', data: html }, { name: 'a/b.bin', data: new Uint8Array([0, 1, 2, 255]) }]);
    const out = execFileSync('python3', ['-c', `
import zipfile, io, sys, json
z = zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()))
assert z.testzip() is None
print(json.dumps({i.filename: [i.compress_type, len(z.read(i.filename)), z.read(i.filename)[:15].decode('latin-1')] for i in z.infolist()}))
`], { input: zip }).toString();
    const r = JSON.parse(out);
    expect(r['index.html'][0]).toBe(8);               // deflated
    expect(r['index.html'][1]).toBe(Buffer.byteLength(html));
    expect(r['index.html'][2]).toBe('<!doctype html>');
    expect(r['a/b.bin'][0]).toBe(0);                  // too small to gain: stored
    expect(r['a/b.bin'][1]).toBe(4);
    expect(zip.length).toBeLessThan(Buffer.byteLength(html) / 5);
  });
});

describe('ad wrappers', () => {
  it('html5-ad: ad.size, clickTag, a full-area click target by default', () => {
    const h = buildHtml5Ad(PAGE, { width: 300, height: 250, clickUrl: 'https://example.com/?a=1&b=2' });
    expect(h).toContain('<meta name="ad.size" content="width=300,height=250">');
    expect(h).toContain('var clickTag = "https://example.com/?a=1&b=2";');
    expect(h).toContain('href="javascript:window.open(window.clickTag)"');
    expect(h).toContain('width:100%;height:100%');
    expect(h.indexOf('ad.size')).toBeLessThan(h.indexOf('</head>'));
    expect(h.indexOf('pp-clicktag')).toBeLessThan(h.indexOf('</body>'));
  });

  it('the click target sits inside the widget box, so a letterboxed ad keeps it on the CTA', () => {
    // The engine's page: div#w centred at the scene's aspect ratio, position: relative.
    const page = '<html><head></head><body><div id="w" role="img" aria-label="x">\n<div class="sr-only" id="w-desc">x</div></div><script>/*w*/</script></body></html>';
    const cta = { left: 10, top: 80, width: 80, height: 10 };
    for (const h of [buildHtml5Ad(page, { width: 300, height: 250, cta }), buildPlayable(page, { width: 320, height: 480, clickUrl: 'https://x.test', cta })]) {
      const inW = h.slice(h.indexOf('<div id="w"'), h.indexOf('id="w-desc"'));
      expect(inW).toMatch(/<a id="pp-(clicktag|cta)"[^>]*position:absolute;left:10\.000%;top:80\.000%/);
      expect(h).not.toContain('position:fixed');
    }
    // A page without #w falls back to the viewport.
    expect(buildHtml5Ad(PAGE.replace('<div id="w"></div>', ''), { width: 1, height: 1 })).toContain('position:fixed');
  });

  it('the scene background is pinned over the page\'s own (8.9, retest 01542e7)', () => {
    const h = buildHtml5Ad(PAGE, { width: 300, height: 250, background: 'rgb(12, 34, 56)' });
    expect(h).toContain('<style>html,body,#w{background:rgb(12, 34, 56) !important}</style>');
    expect(buildPlayable(PAGE, { width: 1, height: 1, clickUrl: 'https://x.test', background: '#0f0f1a' })).toContain('background:#0f0f1a !important');
    // Anything that is not a plain colour is not written into a stylesheet.
    expect(buildHtml5Ad(PAGE, { width: 1, height: 1, background: 'red}</style><script>x()</script>' })).not.toContain('x()');
  });

  it('a click URL cannot close the script tag', () => {
    const h = buildHtml5Ad(PAGE, { width: 1, height: 1, clickUrl: 'https://x.test/</script><script>alert(1)</script>' });
    expect(h).not.toContain('</script><script>alert(1)');
  });

  it('playable: mraid.js, a CTA box only, opened through mraid.open once ready', () => {
    const h = buildPlayable(PAGE, { width: 320, height: 480, clickUrl: 'https://apps.apple.com/app/id1', cta: { left: 10, top: 80, width: 80, height: 10 } });
    expect(h).toContain('<script src="mraid.js"></script>');
    expect(h).toContain("mraid.addEventListener('ready', wire)");
    expect(h).toContain('mraid.open(url)');
    expect(h).toContain('left:10.000%;top:80.000%;width:80.000%;height:10.000%');
    expect(h).not.toContain('width:100%;height:100%');
  });

  it('names the page\'s external requests', () => {
    const page = '<link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet"><style>@font-face{src:url(https://fonts.gstatic.com/x.woff2)}</style><img src="data:image/png;base64,AA">';
    expect(externalRequests(page).sort()).toEqual(['https://fonts.googleapis.com/css2?family=Inter', 'https://fonts.gstatic.com/x.woff2']);
  });
});

describe('the export emitter and the handler', () => {
  const body = (code: string) => code.replace('(async function()', 'return (async function()');
  const studio = (items: Record<string, unknown> = {}) => ({
    canvasSize: { width: 300, height: 250 },
    canvasEl: { style: { backgroundColor: '#fff' } },
    itemRegistry: { get: (id: string) => (items[id] ? { item: items[id] } : undefined) },
    captureFrameDataURL: () => 'data:image/png;base64,iVBORw0KGgo=',
    exportEngine: { exportFidelity: () => ({ warnings: [] }), exportWidgetHTML: async () => ({ html: PAGE }) },
  });
  const run = (app: object, args: Record<string, unknown>) =>
    new Function('app', 'document', body(codeGenerator.generateAgentExport({ ...args } as never)))(app, {});

  it('returns the page, the size, the CTA box in percent and a backup', async () => {
    const r = await run(studio({ cta: { bounds: { x: 30, y: 200, width: 240, height: 25 } } }), { format: 'html5-ad', ad: { ctaItemId: 'cta' } });
    expect(r).toMatchObject({ success: true, format: 'html5-ad', adSize: { width: 300, height: 250 }, cta: { left: 10, top: 80, width: 80, height: 10 } });
    expect(r.adPage).toBe(PAGE);
    expect(r.backupImage).toContain('data:image/png');
  });

  it('a CTA id that is not on the canvas is refused by name', async () => {
    const r = await run(studio(), { format: 'playable', ad: { ctaItemId: 'nope', clickUrl: 'https://x.test' } });
    expect(r).toMatchObject({ success: false, error: expect.stringContaining('"nope"') });
  });

  it('schema: a playable needs its CTA and URL; ad options only on ad formats', () => {
    expect(AgentExportInputSchema.safeParse({ format: 'playable', ad: { ctaItemId: 'c' } }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'playable', ad: { ctaItemId: 'c', clickUrl: 'https://x.test' } }).success).toBe(true);
    expect(AgentExportInputSchema.safeParse({ format: 'png', ad: {} }).success).toBe(false);
    expect(AgentExportInputSchema.safeParse({ format: 'html5-ad' }).success).toBe(true);
  });

  it('the handler zips the ad, saves the backup beside it, and checks the budget and requests', async () => {
    const { handleToolCall } = await import('../../tools/handlers.js');
    const page = PAGE.replace('<head>', '<head><link href="https://fonts.googleapis.com/css2?family=Inter" rel="stylesheet">');
    const controller = {
      connected: true,
      connect: async () => undefined,
      executeCode: async () => ({ success: true, result: { success: true, format: 'html5-ad', platform: 'auto', adPage: page, adSize: { width: 300, height: 250 }, cta: null, backupImage: 'data:image/png;base64,iVBORw0KGgo=', fidelity: { warnings: [] } } }),
    };
    const out = await handleToolCall('pinepaper_agent_export', { format: 'html5-ad', ad: { clickUrl: 'https://example.com', maxBytes: 100 } }, { executeInBrowser: true, browserController: controller, executionMode: 'puppeteer' } as never);
    const text = (out as { content: Array<{ text: string }> }).content[0].text;
    const zipPath = /zip: (\S+\.zip)/.exec(text)?.[1];
    const pngPath = /backupImage: (\S+\.png)/.exec(text)?.[1];
    expect(zipPath && existsSync(zipPath)).toBe(true);
    expect(pngPath && existsSync(pngPath)).toBe(true);
    expect(readFileSync(zipPath!).subarray(0, 4).toString('hex')).toBe('504b0304');
    expect(text).toContain('over_size_budget');
    expect(text).toContain('external_requests');
  });
});
