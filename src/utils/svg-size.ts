/**
 * An SVG sized in relative units renders as a speck.
 *
 * Icon sets (Iconify, and most "copy SVG" buttons) write the root as
 * width="1em" height="1em" viewBox="0 0 24 24": sized to the surrounding
 * font. There is no surrounding font on a canvas, and Paper.js reads "1em" as
 * the number 1, so the icon came in about 5 px across while import reported
 * success. When the root's size is relative (em / ex / rem / %) or missing,
 * it is taken from the viewBox — and an icon-scale viewBox (under 64 px) is
 * brought up to a usable size, since nobody places a 24 px glyph on a 1080 px
 * canvas on purpose.
 */

export interface SvgSizeFix { from: string; to: string; reason: string }

const ICON_TARGET = 200;
const ICON_MAX = 64;

export function normalizeSvgSize(svg: string): { svg: string; fix: SvgSizeFix | null } {
  const m = /<svg\b[^>]*>/i.exec(svg);
  if (!m) return { svg, fix: null };
  const tag = m[0];
  const attr = (name: string) => new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'i').exec(tag)?.[1];
  const w = attr('width'), h = attr('height'), vb = attr('viewBox');
  const relative = (v?: string) => v === undefined || v.trim() === '' || /(em|ex|rem|%)\s*$/i.test(v.trim());
  if (!relative(w) && !relative(h)) return { svg, fix: null };
  const nums = vb?.trim().split(/[\s,]+/).map(Number);
  if (!nums || nums.length !== 4 || !nums.every(Number.isFinite) || !(nums[2] > 0) || !(nums[3] > 0)) return { svg, fix: null };
  let [vw, vh] = [nums[2], nums[3]];
  const long = Math.max(vw, vh);
  if (long < ICON_MAX) { const k = ICON_TARGET / long; vw *= k; vh *= k; }
  const W = Math.round(vw * 100) / 100, H = Math.round(vh * 100) / 100;
  let out = tag.replace(/\s(width|height)\s*=\s*["'][^"']*["']/gi, '');
  out = out.replace(/^<svg\b/i, `<svg width="${W}" height="${H}"`);
  return {
    svg: svg.replace(tag, out),
    fix: { from: `${w ?? '(none)'} x ${h ?? '(none)'}`, to: `${W} x ${H}`, reason: long < ICON_MAX ? `relative size; icon viewBox ${nums[2]}x${nums[3]} scaled to ${ICON_TARGET} px` : 'relative size; taken from the viewBox' },
  };
}
