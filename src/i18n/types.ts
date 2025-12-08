/**
 * i18n Type Definitions
 *
 * Supports all 41 locales from PinePaper Studio
 */

export type SupportedLocale =
  // Major Languages
  | 'en'      // English
  | 'es'      // Spanish
  | 'fr'      // French
  | 'de'      // German
  | 'it'      // Italian
  | 'pt'      // Portuguese
  | 'pt-BR'   // Portuguese (Brazil)
  | 'nl'      // Dutch
  | 'pl'      // Polish
  | 'ru'      // Russian
  | 'uk'      // Ukrainian

  // Asian Languages
  | 'zh-CN'   // Chinese (Simplified)
  | 'zh-TW'   // Chinese (Traditional)
  | 'ja'      // Japanese
  | 'ko'      // Korean
  | 'th'      // Thai
  | 'vi'      // Vietnamese
  | 'id'      // Indonesian
  | 'ms'      // Malay
  | 'tl'      // Filipino/Tagalog

  // South Asian Languages
  | 'hi'      // Hindi
  | 'bn'      // Bengali
  | 'ta'      // Tamil
  | 'te'      // Telugu
  | 'mr'      // Marathi
  | 'gu'      // Gujarati
  | 'kn'      // Kannada
  | 'ml'      // Malayalam
  | 'pa'      // Punjabi

  // Middle Eastern Languages
  | 'ar'      // Arabic
  | 'he'      // Hebrew
  | 'fa'      // Persian/Farsi
  | 'tr'      // Turkish

  // European Languages
  | 'sv'      // Swedish
  | 'da'      // Danish
  | 'no'      // Norwegian
  | 'fi'      // Finnish
  | 'cs'      // Czech
  | 'el'      // Greek
  | 'hu'      // Hungarian
  | 'ro';     // Romanian

export const DEFAULT_LOCALE: SupportedLocale = 'en';

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  // Major Languages
  'en', 'es', 'fr', 'de', 'it', 'pt', 'pt-BR', 'nl', 'pl', 'ru', 'uk',
  // Asian Languages
  'zh-CN', 'zh-TW', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl',
  // South Asian Languages
  'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa',
  // Middle Eastern Languages
  'ar', 'he', 'fa', 'tr',
  // European Languages
  'sv', 'da', 'no', 'fi', 'cs', 'el', 'hu', 'ro'
];

// RTL languages
export const RTL_LOCALES: SupportedLocale[] = ['ar', 'he', 'fa'];

// Locale display names (in their native script)
export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'en': 'English',
  'es': 'Español',
  'fr': 'Français',
  'de': 'Deutsch',
  'it': 'Italiano',
  'pt': 'Português',
  'pt-BR': 'Português (Brasil)',
  'nl': 'Nederlands',
  'pl': 'Polski',
  'ru': 'Русский',
  'uk': 'Українська',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'ko': '한국어',
  'th': 'ไทย',
  'vi': 'Tiếng Việt',
  'id': 'Bahasa Indonesia',
  'ms': 'Bahasa Melayu',
  'tl': 'Filipino',
  'hi': 'हिन्दी',
  'bn': 'বাংলা',
  'ta': 'தமிழ்',
  'te': 'తెలుగు',
  'mr': 'मराठी',
  'gu': 'ગુજરાતી',
  'kn': 'ಕನ್ನಡ',
  'ml': 'മലയാളം',
  'pa': 'ਪੰਜਾਬੀ',
  'ar': 'العربية',
  'he': 'עברית',
  'fa': 'فارسی',
  'tr': 'Türkçe',
  'sv': 'Svenska',
  'da': 'Dansk',
  'no': 'Norsk',
  'fi': 'Suomi',
  'cs': 'Čeština',
  'el': 'Ελληνικά',
  'hu': 'Magyar',
  'ro': 'Română',
};

// Translation key structure
export interface TranslationKeys {
  // Tool names and descriptions
  tools: {
    [toolName: string]: {
      name: string;
      description: string;
      params?: {
        [paramName: string]: string;
      };
    };
  };

  // Error messages
  errors: {
    itemNotFound: string;
    invalidRelation: string;
    invalidParams: string;
    generatorNotFound: string;
    exportFailed: string;
    executionError: string;
    validationError: string;
    unknownTool: string;
    apiKeyRequired: string;
    apiKeyInvalid: string;
    apiKeyExpired: string;
    rateLimitExceeded: string;
  };

  // Success messages
  success: {
    itemCreated: string;
    itemModified: string;
    itemDeleted: string;
    relationAdded: string;
    relationRemoved: string;
    animationApplied: string;
    generatorExecuted: string;
    effectApplied: string;
    backgroundSet: string;
    canvasSizeSet: string;
    exported: string;
  };

  // Item types
  itemTypes: {
    text: string;
    circle: string;
    star: string;
    rectangle: string;
    triangle: string;
    polygon: string;
    ellipse: string;
    path: string;
    line: string;
    arc: string;
  };

  // Relation types
  relationTypes: {
    orbits: string;
    follows: string;
    attached_to: string;
    maintains_distance: string;
    points_at: string;
    mirrors: string;
    parallax: string;
    bounds_to: string;
  };

  // Animation types
  animationTypes: {
    pulse: string;
    rotate: string;
    bounce: string;
    fade: string;
    wobble: string;
    slide: string;
    typewriter: string;
  };

  // Generator names
  generators: {
    drawSunburst: string;
    drawSunsetScene: string;
    drawGrid: string;
    drawStackedCircles: string;
    drawCircuit: string;
    drawWaves: string;
    drawPattern: string;
  };

  // Common phrases
  common: {
    at: string;
    with: string;
    to: string;
    from: string;
    position: string;
    radius: string;
    color: string;
    speed: string;
    duration: string;
  };
}

export type TranslationFunction = (key: string, params?: Record<string, string | number>) => string;
