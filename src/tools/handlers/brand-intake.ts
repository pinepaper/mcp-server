/**
 * pinepaper_brand_kit `from_url` — a product's real brand, read from its own
 * site, before anything is animated (G4, the brand half).
 *
 * An agent asked for "a promo for <product>" used to invent the brand: a
 * plausible blue, a default font, no logo. This reads the live site instead:
 * screenshots, the logo, and the colours and fonts the site's CSS actually
 * computes, and proposes a kit in the exact shape `plan` / `apply` take, so
 * the agent reviews it and applies it with one more call.
 *
 * The engine has nothing for this, so it runs here, in the MCP server's
 * browser, in an ISOLATED context (controller.withIsolatedPage): the studio
 * tab is never navigated away, and the site's cookies never meet the studio's.
 * The page only measures; choosing which colour is "primary" is a pure
 * function below, so it is unit-tested without a browser.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Page } from 'puppeteer';

/** One colour seen on the page, weighted by how much of the page it covers and how it is used. */
export interface SeenColor {
  hex: string;
  rgb: [number, number, number];
  weight: number;
  /** Weight per use: 'action-bg' (button/link fill), 'action' (button/link text), 'heading', 'text', 'bg'. */
  roles: Record<string, number>;
}

export interface PageMeasure {
  title: string;
  background: [number, number, number];
  text: [number, number, number] | null;
  colors: SeenColor[];
  headingFont: string | null;
  bodyFont: string | null;
  logo: { kind: 'img'; src: string } | { kind: 'svg'; markup: string } | null;
  icons: string[];
  ogImage: string | null;
  pageHeight: number;
}

export interface BrandKitProposal {
  name: string;
  colors: { primary: string; secondary?: string; accent?: string; background?: string; text?: string };
  fonts?: { heading?: string; body?: string };
}

const hex = ([r, g, b]: number[]) => '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const dist = (a: number[], b: number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** HSL saturation, 0..1. Greys, near-black and near-white are not brand colours. */
function saturation([r, g, b]: number[]): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  if (max === min) return 0;
  return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

const GENERIC_FONTS = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'helvetica', 'arial', 'times new roman', 'times']);

/** The first family in a CSS font-family list that is a real face, not a generic or OS fallback. */
export function firstRealFont(stack: string | null): string | undefined {
  if (!stack) return undefined;
  for (const raw of stack.split(',')) {
    const f = raw.trim().replace(/^["']|["']$/g, '');
    if (f && !GENERIC_FONTS.has(f.toLowerCase()) && !f.startsWith('var(')) return f;
  }
  return undefined;
}

/**
 * Pick the kit's roles from what the page measured.
 *
 * primary: the most-used SATURATED colour, with buttons and links counting
 * extra (a brand colour is the one on the call to action, not the one on the
 * largest panel). secondary / accent: the next ones distinct from it. A page
 * with no saturated colour at all is a monochrome brand, and its primary is
 * its text colour. background / text: what body computes.
 */
export function chooseKit(m: PageMeasure): BrandKitProposal {
  const bg = m.background;
  const text = m.text;
  const scored = m.colors
    .filter((c) => saturation(c.rgb) >= 0.25)
    .filter((c) => dist(c.rgb, bg) > 40 && (!text || dist(c.rgb, text) > 40))
    .map((c) => ({ c, score: c.weight + 3 * ((c.roles['action-bg'] ?? 0) + (c.roles['action'] ?? 0)) + 2 * (c.roles['heading'] ?? 0) }))
    .sort((a, b) => b.score - a.score);
  const picked: SeenColor[] = [];
  // THE CALL TO ACTION DECIDES. Measured on pinepaper.studio: a light indigo
  // used as link and heading TEXT across the page outscored the indigo that
  // fills the "Open Editor" buttons, so the kit's primary was a text tint.
  // When any saturated colour fills a button or link, the one filling the most
  // of them is primary; the rest are ranked as before.
  const cta = scored
    .filter(({ c }) => (c.roles['action-bg'] ?? 0) > 0)
    .sort((a, b) => (b.c.roles['action-bg'] ?? 0) - (a.c.roles['action-bg'] ?? 0))[0];
  if (cta) picked.push(cta.c);
  for (const { c } of scored) {
    if (picked.every((p) => dist(p.rgb, c.rgb) > 60)) picked.push(c);
    if (picked.length === 3) break;
  }
  const primary = picked[0]?.hex ?? (text ? hex(text) : '#000000');
  const fonts: BrandKitProposal['fonts'] = {};
  const heading = firstRealFont(m.headingFont);
  const body = firstRealFont(m.bodyFont);
  if (heading) fonts.heading = heading;
  if (body) fonts.body = body;
  return {
    name: m.title.trim().slice(0, 60) || 'Brand',
    colors: {
      primary,
      ...(picked[1] ? { secondary: picked[1].hex } : {}),
      ...(picked[2] ? { accent: picked[2].hex } : {}),
      background: hex(bg),
      ...(text ? { text: hex(text) } : {}),
    },
    ...(Object.keys(fonts).length ? { fonts } : {}),
  };
}

/** Runs IN the site's page. Measures only; decides nothing. */
function measurePage(): PageMeasure {
  const parse = (c: string | null): [number, number, number] | null => {
    const m = c && c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    if (p.length >= 4 && p[3] < 0.5) return null;
    return [p[0], p[1], p[2]];
  };
  const toHex = (rgb: number[]) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  const tally: Record<string, SeenColor> = {};
  const add = (rgb: [number, number, number] | null, w: number, role: string) => {
    if (!rgb || !(w > 0)) return;
    const h = toHex(rgb);
    const t = tally[h] || (tally[h] = { hex: h, rgb, weight: 0, roles: {} });
    t.weight += w;
    t.roles[role] = (t.roles[role] || 0) + w;
  };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const els = Array.from(document.querySelectorAll('body *')).slice(0, 5000) as HTMLElement[];
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const area = Math.min(r.width * r.height, vw * vh);
    const tag = el.tagName;
    const interactive = tag === 'A' || tag === 'BUTTON' || el.getAttribute('role') === 'button';
    add(parse(cs.backgroundColor), area, interactive ? 'action-bg' : 'bg');
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent || '').trim() !== '');
    if (hasText) add(parse(cs.color), Math.min(area, 20000), /^H[1-3]$/.test(tag) ? 'heading' : interactive ? 'action' : 'text');
  }
  const body = getComputedStyle(document.body);
  const background = parse(body.backgroundColor) || parse(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255];
  const heading = document.querySelector('h1') || document.querySelector('h2');
  const para = document.querySelector('main p, article p, p') || document.body;
  const abs = (u: string | null) => { try { return u ? new URL(u, location.href).href : null; } catch { return null; } };
  const meta = (sel: string) => (document.querySelector(sel) as HTMLMetaElement | null)?.content || null;

  let logo: PageMeasure['logo'] = null;
  const img = document.querySelector('header img, nav img, [class*="logo" i] img, img[alt*="logo" i], img[src*="logo" i], img[class*="logo" i]') as HTMLImageElement | null;
  const svg = document.querySelector('header svg, [class*="logo" i] svg, a[href="/"] svg, nav svg') as SVGElement | null;
  if (img && (img.currentSrc || img.src)) logo = { kind: 'img', src: abs(img.currentSrc || img.src) as string };
  else if (svg && svg.outerHTML.length < 200_000) logo = { kind: 'svg', markup: svg.outerHTML };

  const icons = Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]'))
    .map((l) => ({ href: abs((l as HTMLLinkElement).getAttribute('href')), size: parseInt(((l as HTMLLinkElement).getAttribute('sizes') || '0').split('x')[0], 10) || 0 }))
    .filter((i) => !!i.href)
    .sort((a, b) => b.size - a.size)
    .map((i) => i.href as string);

  return {
    title: meta('meta[property="og:site_name"]') || document.title || location.hostname,
    background,
    text: parse(body.color),
    colors: Object.values(tally).sort((a, b) => b.weight - a.weight).slice(0, 40),
    headingFont: heading ? getComputedStyle(heading).fontFamily : null,
    bodyFont: getComputedStyle(para).fontFamily,
    logo,
    icons,
    ogImage: abs(meta('meta[property="og:image"]')),
    pageHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  };
}

const EXT_BY_TYPE: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'image/gif': 'gif', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico' };

export interface BrandIntakeResult {
  url: string;
  kit: BrandKitProposal;
  screenshots: string[];
  logo: { file: string; source: string } | null;
  icon: string | null;
  ogImage: string | null;
  measured: { colors: Array<{ hex: string; weight: number; roles: string[] }>; headingFont: string | null; bodyFont: string | null };
}

/**
 * Read a site into a folder: screenshots down the page, the logo, and a kit.
 * `page` is an isolated page the caller owns.
 */
export async function intakeBrand(page: Page, url: string, outDir: string, shots = 3): Promise<BrandIntakeResult> {
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 45_000 });
  const m = await page.evaluate(measurePage);
  await mkdir(outDir, { recursive: true });

  const screenshots: string[] = [];
  const maxY = Math.max(0, m.pageHeight - 900);
  for (let i = 0; i < shots; i++) {
    const y = shots === 1 ? 0 : Math.round((maxY * i) / (shots - 1));
    await page.evaluate((top: number) => window.scrollTo(0, top), y);
    await new Promise((r) => setTimeout(r, 400));
    const file = join(outDir, `screenshot-${i + 1}.png`);
    await writeFile(file, await page.screenshot({ type: 'png' }));
    screenshots.push(file);
  }

  // The logo: the header's own image or SVG, else the largest icon, else og:image.
  let logo: BrandIntakeResult['logo'] = null;
  const fetchTo = async (src: string, base: string) => {
    const res = await fetch(src);
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    const ext = EXT_BY_TYPE[type] || (src.match(/\.(png|jpe?g|webp|svg|gif|ico)(\?|$)/i)?.[1]?.toLowerCase().replace('jpeg', 'jpg')) || 'img';
    const file = join(outDir, `${base}.${ext}`);
    await writeFile(file, Buffer.from(await res.arrayBuffer()));
    return file;
  };
  try {
    if (m.logo?.kind === 'svg') {
      const file = join(outDir, 'logo.svg');
      const markup = m.logo.markup.includes('xmlns=') ? m.logo.markup : m.logo.markup.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      await writeFile(file, markup);
      logo = { file, source: 'inline svg in the page header' };
    } else if (m.logo?.kind === 'img') {
      const file = await fetchTo(m.logo.src, 'logo');
      if (file) logo = { file, source: m.logo.src };
    }
  } catch { /* fall through to the icon */ }
  let icon: string | null = null;
  if (m.icons[0]) {
    try { icon = await fetchTo(m.icons[0], 'icon'); } catch { icon = null; }
  }
  if (!logo && icon) logo = { file: icon, source: `${m.icons[0]} (site icon: no header logo found)` };

  return {
    url,
    kit: chooseKit(m),
    screenshots,
    logo,
    icon,
    ogImage: m.ogImage,
    measured: {
      colors: m.colors.slice(0, 8).map((c) => ({ hex: c.hex, weight: Math.round(c.weight), roles: Object.keys(c.roles) })),
      headingFont: m.headingFont,
      bodyFont: m.bodyFont,
    },
  };
}
