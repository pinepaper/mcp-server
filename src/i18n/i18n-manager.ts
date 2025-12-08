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
      // Dynamic import of locale file
      const module = await import(`./locales/${locale}.js`);
      this.translations.set(locale, module.default || module[locale]);
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
