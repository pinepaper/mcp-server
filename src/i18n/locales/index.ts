/**
 * Locales Index
 *
 * Exports all 51 supported locale translations.
 */

// European Languages
export { en } from './en.js';
export { es } from './es.js';
export { fr } from './fr.js';
export { de } from './de.js';
export { it } from './it.js';
export { pt } from './pt.js';
export { ptBR } from './pt-BR.js';
export { nl } from './nl.js';
export { pl } from './pl.js';
export { ru } from './ru.js';
export { uk } from './uk.js';
export { sv } from './sv.js';
export { da } from './da.js';
export { no } from './no.js';
export { fi } from './fi.js';
export { cs } from './cs.js';
export { el } from './el.js';
export { hu } from './hu.js';
export { ro } from './ro.js';
export { tr } from './tr.js';
export { is } from './is.js';

// East Asian Languages
export { zhCN } from './zh-CN.js';
export { zhTW } from './zh-TW.js';
export { ja } from './ja.js';
export { ko } from './ko.js';

// Southeast Asian Languages
export { th } from './th.js';
export { vi } from './vi.js';
export { id } from './id.js';
export { ms } from './ms.js';
export { tl } from './tl.js';
export { fil } from './fil.js';

// South Asian Languages
export { hi } from './hi.js';
export { bn } from './bn.js';
export { ta } from './ta.js';
export { te } from './te.js';
export { mr } from './mr.js';
export { gu } from './gu.js';
export { kn } from './kn.js';
export { ml } from './ml.js';
export { pa } from './pa.js';
export { ur } from './ur.js';

// Middle Eastern Languages (RTL)
export { ar } from './ar.js';
export { he } from './he.js';
export { fa } from './fa.js';

// Indigenous Languages (Canada)
export { chp } from './chp.js';
export { cr } from './cr.js';
export { crg } from './crg.js';
export { iu } from './iu.js';
export { mic } from './mic.js';
export { moh } from './moh.js';
export { oj } from './oj.js';

// Locale map for dynamic imports
export const localeMap = {
  // European Languages
  en: () => import('./en.js'),
  es: () => import('./es.js'),
  fr: () => import('./fr.js'),
  de: () => import('./de.js'),
  it: () => import('./it.js'),
  pt: () => import('./pt.js'),
  'pt-BR': () => import('./pt-BR.js'),
  nl: () => import('./nl.js'),
  pl: () => import('./pl.js'),
  ru: () => import('./ru.js'),
  uk: () => import('./uk.js'),
  sv: () => import('./sv.js'),
  da: () => import('./da.js'),
  no: () => import('./no.js'),
  fi: () => import('./fi.js'),
  cs: () => import('./cs.js'),
  el: () => import('./el.js'),
  hu: () => import('./hu.js'),
  ro: () => import('./ro.js'),
  tr: () => import('./tr.js'),
  is: () => import('./is.js'),

  // East Asian Languages
  'zh-CN': () => import('./zh-CN.js'),
  'zh-TW': () => import('./zh-TW.js'),
  ja: () => import('./ja.js'),
  ko: () => import('./ko.js'),

  // Southeast Asian Languages
  th: () => import('./th.js'),
  vi: () => import('./vi.js'),
  id: () => import('./id.js'),
  ms: () => import('./ms.js'),
  tl: () => import('./tl.js'),
  fil: () => import('./fil.js'),

  // South Asian Languages
  hi: () => import('./hi.js'),
  bn: () => import('./bn.js'),
  ta: () => import('./ta.js'),
  te: () => import('./te.js'),
  mr: () => import('./mr.js'),
  gu: () => import('./gu.js'),
  kn: () => import('./kn.js'),
  ml: () => import('./ml.js'),
  pa: () => import('./pa.js'),
  ur: () => import('./ur.js'),

  // Middle Eastern Languages (RTL)
  ar: () => import('./ar.js'),
  he: () => import('./he.js'),
  fa: () => import('./fa.js'),

  // Indigenous Languages (Canada)
  chp: () => import('./chp.js'),
  cr: () => import('./cr.js'),
  crg: () => import('./crg.js'),
  iu: () => import('./iu.js'),
  mic: () => import('./mic.js'),
  moh: () => import('./moh.js'),
  oj: () => import('./oj.js'),
};
