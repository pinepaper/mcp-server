/**
 * i18n Manager
 *
 * Handles internationalization for the PinePaper MCP Server.
 * Supports all 41 locales from PinePaper Studio.
 */

import {
  SupportedLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  RTL_LOCALES,
  TranslationKeys,
  TranslationFunction,
} from './types.js';

// =============================================================================
// TYPES
// =============================================================================

export interface I18nConfig {
  defaultLocale?: SupportedLocale;
  fallbackLocale?: SupportedLocale;
  loadPath?: string;
}

// =============================================================================
// LOCALE MODULES
// =============================================================================

/**
 * One literal import per supported locale. A locale file is loaded only from this table, so a locale name (it can
 * come from PINEPAPER_LOCALE or LANG) never becomes part of a module path: an unknown name finds no entry and falls
 * back to English rather than importing whatever file a crafted name points at. Literal specifiers also let a
 * reader or a bundler see exactly which files can be loaded.
 */
const LOCALE_MODULES: Record<SupportedLocale, () => Promise<Record<string, unknown>>> = {
  'en': () => import('./locales/en.js'),
  'es': () => import('./locales/es.js'),
  'fr': () => import('./locales/fr.js'),
  'de': () => import('./locales/de.js'),
  'it': () => import('./locales/it.js'),
  'pt': () => import('./locales/pt.js'),
  'pt-BR': () => import('./locales/pt-BR.js'),
  'nl': () => import('./locales/nl.js'),
  'pl': () => import('./locales/pl.js'),
  'ru': () => import('./locales/ru.js'),
  'uk': () => import('./locales/uk.js'),
  'zh-CN': () => import('./locales/zh-CN.js'),
  'zh-TW': () => import('./locales/zh-TW.js'),
  'ja': () => import('./locales/ja.js'),
  'ko': () => import('./locales/ko.js'),
  'th': () => import('./locales/th.js'),
  'vi': () => import('./locales/vi.js'),
  'id': () => import('./locales/id.js'),
  'ms': () => import('./locales/ms.js'),
  'tl': () => import('./locales/tl.js'),
  'hi': () => import('./locales/hi.js'),
  'bn': () => import('./locales/bn.js'),
  'ta': () => import('./locales/ta.js'),
  'te': () => import('./locales/te.js'),
  'mr': () => import('./locales/mr.js'),
  'gu': () => import('./locales/gu.js'),
  'kn': () => import('./locales/kn.js'),
  'ml': () => import('./locales/ml.js'),
  'pa': () => import('./locales/pa.js'),
  'ar': () => import('./locales/ar.js'),
  'he': () => import('./locales/he.js'),
  'fa': () => import('./locales/fa.js'),
  'tr': () => import('./locales/tr.js'),
  'sv': () => import('./locales/sv.js'),
  'da': () => import('./locales/da.js'),
  'no': () => import('./locales/no.js'),
  'fi': () => import('./locales/fi.js'),
  'cs': () => import('./locales/cs.js'),
  'el': () => import('./locales/el.js'),
  'hu': () => import('./locales/hu.js'),
  'ro': () => import('./locales/ro.js'),
};

// =============================================================================
// I18N MANAGER
// =============================================================================

export class I18nManager {
  private currentLocale: SupportedLocale;
  private fallbackLocale: SupportedLocale;
  private translations: Map<SupportedLocale, TranslationKeys> = new Map();
  private loadedLocales: Set<SupportedLocale> = new Set();

  constructor(config: I18nConfig = {}) {
    this.currentLocale = config.defaultLocale || DEFAULT_LOCALE;
    this.fallbackLocale = config.fallbackLocale || DEFAULT_LOCALE;
  }

  /**
   * Load translations for a locale
   */
  async loadLocale(locale: SupportedLocale): Promise<void> {
    if (this.loadedLocales.has(locale)) {
      return;
    }

    try {
      const load = Object.prototype.hasOwnProperty.call(LOCALE_MODULES, locale) ? LOCALE_MODULES[locale] : undefined;
      if (!load) throw new Error(`not a supported locale`);
      const module = await load();
      this.translations.set(locale, (module.default || module[locale]) as TranslationKeys);
      this.loadedLocales.add(locale);
    } catch (error) {
      console.error(`Failed to load locale ${locale}:`, error);
      // Fall back to English if locale not found
      if (locale !== 'en') {
        await this.loadLocale('en');
      }
    }
  }

  /**
   * Set the current locale
   */
  async setLocale(locale: SupportedLocale): Promise<void> {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Unsupported locale: ${locale}, falling back to ${this.fallbackLocale}`);
      locale = this.fallbackLocale;
    }

    await this.loadLocale(locale);
    this.currentLocale = locale;
  }

  /**
   * Get the current locale
   */
  getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Check if current locale is RTL
   */
  isRTL(): boolean {
    return RTL_LOCALES.includes(this.currentLocale);
  }

  /**
   * Get translation for a key
   */
  t(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let translation = this.getNestedValue(
      this.translations.get(this.currentLocale),
      keys
    );

    // Fallback to default locale
    if (!translation && this.currentLocale !== this.fallbackLocale) {
      translation = this.getNestedValue(
        this.translations.get(this.fallbackLocale),
        keys
      );
    }

    // Return key if no translation found
    if (!translation) {
      return key;
    }

    // Replace parameters
    if (params) {
      return this.interpolate(translation, params);
    }

    return translation;
  }

  /**
   * Get a translation function bound to current locale
   */
  getTranslationFunction(): TranslationFunction {
    return (key: string, params?: Record<string, string | number>) =>
      this.t(key, params);
  }

  /**
   * Get all translations for current locale
   */
  getTranslations(): TranslationKeys | undefined {
    return this.translations.get(this.currentLocale);
  }

  /**
   * Get tool description in current locale
   */
  getToolDescription(toolName: string): string {
    return this.t(`tools.${toolName}.description`);
  }

  /**
   * Get tool name in current locale
   */
  getToolName(toolName: string): string {
    return this.t(`tools.${toolName}.name`);
  }

  /**
   * Get error message in current locale
   */
  getError(errorKey: string, params?: Record<string, string | number>): string {
    return this.t(`errors.${errorKey}`, params);
  }

  /**
   * Get success message in current locale
   */
  getSuccess(successKey: string, params?: Record<string, string | number>): string {
    return this.t(`success.${successKey}`, params);
  }

  /**
   * Detect locale from Accept-Language header
   */
  static detectLocale(acceptLanguage?: string): SupportedLocale {
    if (!acceptLanguage) {
      return DEFAULT_LOCALE;
    }

    // Parse Accept-Language header
    const locales = acceptLanguage
      .split(',')
      .map((lang) => {
        const [locale, quality = 'q=1'] = lang.trim().split(';');
        const q = parseFloat(quality.replace('q=', '')) || 1;
        return { locale: locale.trim(), quality: q };
      })
      .sort((a, b) => b.quality - a.quality);

    // Find first supported locale
    for (const { locale } of locales) {
      // Exact match
      if (SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
        return locale as SupportedLocale;
      }

      // Language-only match (e.g., 'en-US' -> 'en')
      const lang = locale.split('-')[0];
      if (SUPPORTED_LOCALES.includes(lang as SupportedLocale)) {
        return lang as SupportedLocale;
      }

      // Regional variant match (e.g., 'zh' -> 'zh-CN')
      const variant = SUPPORTED_LOCALES.find((l) => l.startsWith(lang + '-'));
      if (variant) {
        return variant;
      }
    }

    return DEFAULT_LOCALE;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: unknown, keys: string[]): string | undefined {
    let current = obj;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = (current as Record<string, unknown>)[key];
      } else {
        return undefined;
      }
    }
    return typeof current === 'string' ? current : undefined;
  }

  /**
   * Interpolate parameters into translation string
   */
  private interpolate(
    template: string,
    params: Record<string, string | number>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return key in params ? String(params[key]) : match;
    });
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let instance: I18nManager | null = null;

/**
 * Get the singleton i18n manager instance
 */
export function getI18n(): I18nManager {
  if (!instance) {
    instance = new I18nManager();
  }
  return instance;
}

/**
 * Initialize i18n with a specific locale
 */
export async function initI18n(locale?: SupportedLocale): Promise<I18nManager> {
  const i18n = getI18n();
  await i18n.loadLocale('en'); // Always load English as fallback
  if (locale && locale !== 'en') {
    await i18n.setLocale(locale);
  }
  return i18n;
}

/**
 * Shorthand translation function
 */
export function t(key: string, params?: Record<string, string | number>): string {
  return getI18n().t(key, params);
}
