/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/design-systems-dtcg.ts
 * sha256:    f4d96a7983595af5396007eec2cd5ef9a12c4555501894a2c0760f132e87d9e2
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
/**
 * W3C DTCG DESIGN TOKENS ENGINE & DESIGN SYSTEM INGESTION STORE
 *
 * Implements machine-readable ingestion of commercially-safe open design systems
 * according to the W3C Design Tokens Community Group (DTCG) specification ($value, $type, $description).
 *
 * Distinguishes concrete Design Systems (Material 3, IBM Carbon, Polaris, Fluent 2, USWDS, etc.)
 * from visual Aesthetic Styles. Any gap fills in motion tokens are explicitly marked with
 * "pinepaper:authored": true provenance metadata.
 */

export type DTCGTokenType =
  | "dimension"
  | "duration"
  | "cubicBezier"
  | "color"
  | "fontFamily"
  | "fontWeight"
  | "number"
  | "shadow"
  | "grid";

export interface DTCGTokenExtensions {
  "pinepaper:authored"?: boolean;
  "pinepaper:source"?: string;
  [key: string]: unknown;
}

export interface DTCGToken<T = any> {
  $value: T;
  $type: DTCGTokenType;
  $description?: string;
  $extensions?: DTCGTokenExtensions;
}

export interface DTCGDesignSystem {
  id: string;
  name: string;
  license: string;
  version: string;
  vendor: string;
  category: "corporate" | "government";
  tokens: Record<string, DTCGToken>;
  motion: {
    easings: Record<string, string>;
    durations: Record<string, number>;
    staggers: Record<string, number>;
  };
  typography: {
    basePx: number;
    ratio: number;
    scalePx: number[];
  };
  space: {
    gridPx: number;
    scalePx: number[];
  };
}

export const OPEN_DESIGN_SYSTEMS: Record<string, DTCGDesignSystem> = {
  material_3: {
    id: "material_3",
    name: "Material Design 3",
    license: "Apache-2.0",
    version: "3.0",
    vendor: "Google",
    category: "corporate",
    tokens: {
      "motion.easing.emphasized": {
        $value: [0.2, 0.0, 0.0, 1.0],
        $type: "cubicBezier",
        $description: "Material 3 primary emphasized easing curve for major transitions",
      },
      "motion.easing.emphasized_accelerate": {
        $value: [0.3, 0.0, 0.8, 0.15],
        $type: "cubicBezier",
        $description: "Material 3 exit acceleration curve",
      },
      "motion.easing.emphasized_decelerate": {
        $value: [0.05, 0.7, 0.1, 1.0],
        $type: "cubicBezier",
        $description: "Material 3 entrance deceleration curve",
      },
      "motion.easing.standard": {
        $value: [0.2, 0.0, 0.0, 1.0],
        $type: "cubicBezier",
        $description: "Material 3 standard utility motion curve",
      },
      "motion.duration.short_1": { $value: "50ms", $type: "duration" },
      "motion.duration.short_2": { $value: "100ms", $type: "duration" },
      "motion.duration.medium_1": { $value: "250ms", $type: "duration" },
      "motion.duration.medium_2": { $value: "300ms", $type: "duration" },
      "motion.duration.long_1": { $value: "450ms", $type: "duration" },
      "motion.duration.long_2": { $value: "500ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
      "type.base": { $value: "16px", $type: "dimension" },
    },
    motion: {
      easings: {
        emphasized: "cubic-bezier(0.2, 0.0, 0.0, 1.0)",
        emphasizedAccelerate: "cubic-bezier(0.3, 0.0, 0.8, 0.15)",
        emphasizedDecelerate: "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
        standard: "cubic-bezier(0.2, 0.0, 0.0, 1.0)",
      },
      durations: { short1: 50, short2: 100, medium1: 250, medium2: 300, long1: 450, long2: 500 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [12, 14, 16, 20, 24, 32, 45, 57] },
    space: { gridPx: 8, scalePx: [4, 8, 12, 16, 24, 32, 48, 64] },
  },

  ibm_carbon: {
    id: "ibm_carbon",
    name: "IBM Carbon Design System",
    license: "Apache-2.0",
    version: "11.0",
    vendor: "IBM",
    category: "corporate",
    tokens: {
      "motion.easing.standard_expressive": {
        $value: [0.4, 0.14, 0.3, 1.0],
        $type: "cubicBezier",
        $description: "Carbon expressive standard motion curve",
      },
      "motion.easing.entrance_expressive": {
        $value: [0.0, 0.0, 0.3, 1.0],
        $type: "cubicBezier",
        $description: "Carbon expressive entrance motion curve",
      },
      "motion.easing.exit_expressive": {
        $value: [0.4, 0.14, 1.0, 1.0],
        $type: "cubicBezier",
        $description: "Carbon expressive exit motion curve",
      },
      "motion.easing.standard_productive": {
        $value: [0.2, 0.0, 0.38, 0.9],
        $type: "cubicBezier",
        $description: "Carbon productive motion curve for dense UI tasks",
      },
      "motion.duration.fast_1": { $value: "70ms", $type: "duration" },
      "motion.duration.fast_2": { $value: "110ms", $type: "duration" },
      "motion.duration.moderate_1": { $value: "160ms", $type: "duration" },
      "motion.duration.moderate_2": { $value: "240ms", $type: "duration" },
      "motion.duration.slow_1": { $value: "400ms", $type: "duration" },
      "motion.duration.slow_2": { $value: "700ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
    },
    motion: {
      easings: {
        standardExpressive: "cubic-bezier(0.4, 0.14, 0.3, 1.0)",
        entranceExpressive: "cubic-bezier(0.0, 0.0, 0.3, 1.0)",
        exitExpressive: "cubic-bezier(0.4, 0.14, 1.0, 1.0)",
        standardProductive: "cubic-bezier(0.2, 0.0, 0.38, 0.9)",
      },
      durations: { fast1: 70, fast2: 110, moderate1: 160, moderate2: 240, slow1: 400, slow2: 700 },
      staggers: { tight: 30, base: 60, relaxed: 100 },
    },
    typography: { basePx: 16, ratio: 1.2, scalePx: [12, 14, 16, 20, 24, 28, 32, 42, 54] },
    space: { gridPx: 8, scalePx: [2, 4, 8, 12, 16, 24, 32, 48, 64] },
  },

  shopify_polaris: {
    id: "shopify_polaris",
    name: "Shopify Polaris",
    license: "MIT",
    version: "12.0",
    vendor: "Shopify",
    category: "corporate",
    tokens: {
      "motion.easing.ease": { $value: [0.25, 0.1, 0.25, 1.0], $type: "cubicBezier" },
      "motion.duration.100": { $value: "100ms", $type: "duration" },
      "motion.duration.200": { $value: "200ms", $type: "duration" },
      "motion.duration.300": { $value: "300ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { ease: "cubic-bezier(0.25, 0.1, 0.25, 1.0)" },
      durations: { fast: 100, base: 200, slow: 300, extraSlow: 400 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 14, ratio: 1.25, scalePx: [12, 13, 14, 16, 20, 24, 28, 32] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 20, 24, 32, 40, 48] },
  },

  microsoft_fluent_2: {
    id: "microsoft_fluent_2",
    name: "Microsoft Fluent 2",
    license: "MIT",
    version: "2.0",
    vendor: "Microsoft",
    category: "corporate",
    tokens: {
      "motion.easing.standard": { $value: [0.33, 0.0, 0.67, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "100ms", $type: "duration" },
      "motion.duration.normal": { $value: "200ms", $type: "duration" },
      "motion.duration.slow": { $value: "300ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.33, 0.0, 0.67, 1.0)" },
      durations: { ultraFast: 50, fast: 100, normal: 200, slow: 300, ultraSlow: 500 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 14, ratio: 1.2, scalePx: [10, 12, 14, 16, 20, 24, 28, 36, 44] },
    space: { gridPx: 4, scalePx: [2, 4, 8, 12, 16, 20, 24, 32, 40] },
  },

  atlassian: {
    id: "atlassian",
    name: "Atlassian Design System",
    license: "Apache-2.0",
    version: "1.0",
    vendor: "Atlassian",
    category: "corporate",
    tokens: {
      "motion.easing.ease_in_out": { $value: [0.15, 1.0, 0.3, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "100ms", $type: "duration" },
      "motion.duration.medium": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
    },
    motion: {
      easings: { easeInOut: "cubic-bezier(0.15, 1.0, 0.3, 1.0)" },
      durations: { fast: 100, medium: 200, slow: 350 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 14, ratio: 1.25, scalePx: [11, 12, 14, 16, 20, 24, 29, 35] },
    space: { gridPx: 8, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  adobe_spectrum: {
    id: "adobe_spectrum",
    name: "Adobe Spectrum",
    license: "Apache-2.0",
    version: "2.0",
    vendor: "Adobe",
    category: "corporate",
    tokens: {
      "motion.easing.standard": { $value: [0.0, 0.0, 0.4, 1.0], $type: "cubicBezier" },
      "motion.duration.100": { $value: "100ms", $type: "duration" },
      "motion.duration.200": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.0, 0.0, 0.4, 1.0)" },
      durations: { d100: 100, d130: 130, d160: 160, d190: 190, d220: 220, d250: 250, d300: 300 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 14, ratio: 1.2, scalePx: [11, 12, 14, 16, 18, 22, 28, 36] },
    space: { gridPx: 8, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  github_primer: {
    id: "github_primer",
    name: "GitHub Primer",
    license: "MIT",
    version: "2.0",
    vendor: "GitHub",
    category: "corporate",
    tokens: {
      "motion.easing.normal": { $value: [0.3, 0.0, 0.2, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "80ms", $type: "duration" },
      "motion.duration.normal": { $value: "160ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { normal: "cubic-bezier(0.3, 0.0, 0.2, 1.0)" },
      durations: { fast: 80, normal: 160, slow: 240, extraSlow: 320 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 14, ratio: 1.25, scalePx: [12, 14, 16, 20, 24, 32, 40, 48] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  salesforce_lightning: {
    id: "salesforce_lightning",
    name: "Salesforce Lightning Design System",
    license: "BSD-3-Clause",
    version: "2.0",
    vendor: "Salesforce",
    category: "corporate",
    tokens: {
      "motion.easing.base": { $value: [0.1, 0.9, 0.2, 1.0], $type: "cubicBezier" },
      "motion.duration.100": { $value: "100ms", $type: "duration" },
      "motion.duration.200": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { base: "cubic-bezier(0.1, 0.9, 0.2, 1.0)" },
      durations: { fast: 100, medium: 200, slow: 300, extraSlow: 500 },
      staggers: { tight: 30, base: 60, relaxed: 100 },
    },
    typography: { basePx: 13, ratio: 1.2, scalePx: [11, 13, 14, 16, 18, 20, 24, 32] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 20, 24, 32, 48] },
  },

  ant_design: {
    id: "ant_design",
    name: "Ant Design",
    license: "MIT",
    version: "5.0",
    vendor: "Ant Financial",
    category: "corporate",
    tokens: {
      "motion.easing.ease_in_out": { $value: [0.645, 0.045, 0.355, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "100ms", $type: "duration" },
      "motion.duration.mid": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
    },
    motion: {
      easings: { easeInOut: "cubic-bezier(0.645, 0.045, 0.355, 1.0)" },
      durations: { fast: 100, mid: 200, slow: 300 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 14, ratio: 1.15, scalePx: [12, 14, 16, 20, 24, 30, 38, 46] },
    space: { gridPx: 8, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  pinterest_gestalt: {
    id: "pinterest_gestalt",
    name: "Pinterest Gestalt",
    license: "Apache-2.0",
    version: "1.0",
    vendor: "Pinterest",
    category: "corporate",
    tokens: {
      "motion.easing.basic": { $value: [0.5, 0.0, 0.5, 1.0], $type: "cubicBezier" },
      "motion.duration.150": { $value: "150ms", $type: "duration" },
      "motion.duration.300": { $value: "300ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { basic: "cubic-bezier(0.5, 0.0, 0.5, 1.0)" },
      durations: { fast: 150, base: 200, slow: 300, extraSlow: 400 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 14, ratio: 1.2, scalePx: [12, 14, 16, 20, 24, 28, 36, 48] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  uber_base_web: {
    id: "uber_base_web",
    name: "Uber Base Web",
    license: "MIT",
    version: "11.0",
    vendor: "Uber",
    category: "corporate",
    tokens: {
      "motion.easing.standard": { $value: [0.2, 0.8, 0.4, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "100ms", $type: "duration" },
      "motion.duration.medium": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.2, 0.8, 0.4, 1.0)" },
      durations: { fast: 100, medium: 200, slow: 300, extraSlow: 400 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 14, ratio: 1.25, scalePx: [12, 14, 16, 18, 20, 24, 32, 40] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  seek_braid: {
    id: "seek_braid",
    name: "SEEK Braid",
    license: "MIT",
    version: "1.0",
    vendor: "SEEK",
    category: "corporate",
    tokens: {
      "motion.easing.standard": { $value: [0.4, 0.0, 0.2, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "100ms", $type: "duration" },
      "motion.duration.standard": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.4, 0.0, 0.2, 1.0)" },
      durations: { fast: 100, standard: 200, slow: 300 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 14, ratio: 1.2, scalePx: [12, 14, 16, 18, 21, 24, 28, 32] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 20, 24, 32, 40] },
  },

  // ── GOVERNMENT DESIGN SYSTEMS (Clean CC0 / MIT Accessibility Standards) ────

  uswds: {
    id: "uswds",
    name: "U.S. Web Design System",
    license: "CC0-1.0",
    version: "3.0",
    vendor: "U.S. General Services Administration",
    category: "government",
    tokens: {
      "space.grid": { $value: "8px", $type: "dimension" },
      "type.base": { $value: "16px", $type: "dimension" },
      "motion.easing.standard": {
        $value: [0.4, 0.0, 0.2, 1.0],
        $type: "cubicBezier",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
      "motion.duration.standard": {
        $value: "200ms",
        $type: "duration",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.4, 0.0, 0.2, 1.0)" },
      durations: { fast: 100, standard: 200, slow: 300 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [13, 14, 16, 20, 24, 32, 40, 48] },
    space: { gridPx: 8, scalePx: [4, 8, 16, 24, 32, 40, 48, 64] },
  },

  govuk: {
    id: "govuk",
    name: "GOV.UK Design System",
    license: "MIT",
    version: "4.0",
    vendor: "UK Government Digital Service",
    category: "government",
    tokens: {
      "space.grid": { $value: "5px", $type: "dimension" },
      "type.base": { $value: "19px", $type: "dimension" },
      "motion.easing.standard": {
        $value: [0.25, 0.1, 0.25, 1.0],
        $type: "cubicBezier",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
      "motion.duration.standard": {
        $value: "200ms",
        $type: "duration",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.25, 0.1, 0.25, 1.0)" },
      durations: { fast: 100, standard: 200, slow: 300 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 19, ratio: 1.25, scalePx: [14, 16, 19, 24, 27, 36, 48] },
    space: { gridPx: 5, scalePx: [5, 10, 15, 20, 30, 40, 50, 60] },
  },

  gc_design_system: {
    id: "gc_design_system",
    name: "GC Design System (Canada)",
    license: "MIT",
    version: "1.0",
    vendor: "Government of Canada",
    category: "government",
    tokens: {
      "space.grid": { $value: "8px", $type: "dimension" },
      "type.base": { $value: "16px", $type: "dimension" },
      "motion.easing.standard": {
        $value: [0.4, 0.0, 0.2, 1.0],
        $type: "cubicBezier",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
      "motion.duration.standard": {
        $value: "200ms",
        $type: "duration",
        $extensions: { "pinepaper:authored": true, "pinepaper:source": "synthetic_fill_for_government_system" },
      },
    },
    motion: {
      easings: { standard: "cubic-bezier(0.4, 0.0, 0.2, 1.0)" },
      durations: { fast: 100, standard: 200, slow: 300 },
      staggers: { tight: 40, base: 80, relaxed: 120 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [13, 14, 16, 20, 24, 32, 40, 48] },
    space: { gridPx: 8, scalePx: [4, 8, 16, 24, 32, 40, 48, 64] },
  },

  radix_shadcn: {
    id: "radix_shadcn",
    name: "Shadcn UI / Radix UI Tokens",
    license: "MIT",
    version: "1.0",
    vendor: "Shadcn / WorkOS",
    category: "corporate",
    tokens: {
      "motion.easing.default": { $value: [0.16, 1.0, 0.3, 1.0], $type: "cubicBezier", $description: "Radix UI spring/ease default curve" },
      "motion.duration.fast": { $value: "150ms", $type: "duration" },
      "motion.duration.normal": { $value: "250ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { default: "cubic-bezier(0.16, 1.0, 0.3, 1.0)" },
      durations: { fast: 150, normal: 250, slow: 400 },
      staggers: { tight: 35, base: 70, relaxed: 110 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [12, 14, 16, 18, 20, 24, 30, 36] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 24, 32, 40, 48] },
  },

  salesforce_slds2: {
    id: "salesforce_slds2",
    name: "Salesforce Lightning Design System 2",
    license: "BSD-3-Clause",
    version: "2.5",
    vendor: "Salesforce",
    category: "corporate",
    tokens: {
      "motion.easing.spring": { $value: [0.2, 0.9, 0.3, 1.0], $type: "cubicBezier", $description: "SLDS 2 spring transition curve" },
      "motion.duration.prompt": { $value: "120ms", $type: "duration" },
      "motion.duration.expressive": { $value: "280ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { spring: "cubic-bezier(0.2, 0.9, 0.3, 1.0)" },
      durations: { prompt: 120, standard: 200, expressive: 280 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 14, ratio: 1.2, scalePx: [11, 13, 14, 16, 18, 20, 24, 32] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 24, 32, 48, 64] },
  },

  adobe_spectrum2: {
    id: "adobe_spectrum2",
    name: "Adobe Spectrum 2",
    license: "Apache-2.0",
    version: "2.0",
    vendor: "Adobe",
    category: "corporate",
    tokens: {
      "motion.easing.fluid": { $value: [0.25, 0.0, 0.15, 1.0], $type: "cubicBezier", $description: "Spectrum 2 fluid responsive motion curve" },
      "motion.duration.responsive": { $value: "180ms", $type: "duration" },
      "space.grid": { $value: "8px", $type: "dimension" },
    },
    motion: {
      easings: { fluid: "cubic-bezier(0.25, 0.0, 0.15, 1.0)" },
      durations: { fast: 100, responsive: 180, slow: 320 },
      staggers: { tight: 25, base: 50, relaxed: 80 },
    },
    typography: { basePx: 15, ratio: 1.22, scalePx: [11, 13, 15, 18, 22, 28, 36, 46] },
    space: { gridPx: 8, scalePx: [4, 8, 16, 24, 32, 40, 48, 64] },
  },

  ant_design_mobile: {
    id: "ant_design_mobile",
    name: "Ant Design Mobile",
    license: "MIT",
    version: "5.0",
    vendor: "Ant Group",
    category: "corporate",
    tokens: {
      "motion.easing.touch": { $value: [0.1, 0.8, 0.2, 1.0], $type: "cubicBezier", $description: "Ant Design Mobile responsive touch curve" },
      "motion.duration.fast": { $value: "120ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { touch: "cubic-bezier(0.1, 0.8, 0.2, 1.0)" },
      durations: { fast: 120, base: 220, slow: 350 },
      staggers: { tight: 30, base: 60, relaxed: 90 },
    },
    typography: { basePx: 15, ratio: 1.2, scalePx: [12, 13, 15, 17, 20, 24, 30] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 20, 24, 32, 40] },
  },

  tailwind_tokens: {
    id: "tailwind_tokens",
    name: "Tailwind CSS Token System",
    license: "MIT",
    version: "3.4",
    vendor: "Tailwind Labs",
    category: "corporate",
    tokens: {
      "motion.easing.in_out": { $value: [0.4, 0.0, 0.2, 1.0], $type: "cubicBezier" },
      "motion.duration.150": { $value: "150ms", $type: "duration" },
      "motion.duration.300": { $value: "300ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { inOut: "cubic-bezier(0.4, 0.0, 0.2, 1.0)", out: "cubic-bezier(0.0, 0.0, 0.2, 1.0)", in: "cubic-bezier(0.4, 0.0, 1.0, 1.0)" },
      durations: { d75: 75, d100: 100, d150: 150, d200: 200, d300: 300, d500: 500, d700: 700, d1000: 1000 },
      staggers: { tight: 30, base: 75, relaxed: 150 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 96] },
    space: { gridPx: 4, scalePx: [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96] },
  },

  chakra_ui: {
    id: "chakra_ui",
    name: "Chakra UI Tokens",
    license: "MIT",
    version: "2.8",
    vendor: "Chakra Systems",
    category: "corporate",
    tokens: {
      "motion.easing.ease_in_out": { $value: [0.4, 0.0, 0.2, 1.0], $type: "cubicBezier" },
      "motion.duration.fast": { $value: "150ms", $type: "duration" },
      "motion.duration.normal": { $value: "200ms", $type: "duration" },
      "space.grid": { $value: "4px", $type: "dimension" },
    },
    motion: {
      easings: { easeInOut: "cubic-bezier(0.4, 0.0, 0.2, 1.0)" },
      durations: { ultraFast: 50, faster: 100, fast: 150, normal: 200, slow: 300, slower: 400 },
      staggers: { tight: 30, base: 60, relaxed: 100 },
    },
    typography: { basePx: 16, ratio: 1.25, scalePx: [12, 14, 16, 18, 20, 24, 30, 36, 48] },
    space: { gridPx: 4, scalePx: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64] },
  },
};

/**
 * Returns full DTCG Design System definition by ID.
 */
export function getDTCGDesignSystem(systemId: string): DTCGDesignSystem | undefined {
  if (OPEN_DESIGN_SYSTEMS[systemId]) {
    return OPEN_DESIGN_SYSTEMS[systemId];
  }
  const norm = systemId.toLowerCase().replace(/[-_ ]/g, "");
  return Object.values(OPEN_DESIGN_SYSTEMS).find(
    (sys) => sys.id.toLowerCase().replace(/[-_ ]/g, "") === norm || sys.name.toLowerCase().replace(/[-_ ]/g, "") === norm
  );
}

/**
 * Returns all ingested DTCG open design systems.
 */
export function getAllDTCGDesignSystems(): DTCGDesignSystem[] {
  return Object.values(OPEN_DESIGN_SYSTEMS);
}

/**
 * Parses W3C DTCG token value into a CSS cubic-bezier string if applicable.
 */
export function tokenToCubicBezier(token: DTCGToken): string | null {
  if (token.$type === "cubicBezier" && Array.isArray(token.$value) && token.$value.length === 4) {
    return `cubic-bezier(${token.$value.join(", ")})`;
  }
  return null;
}

/**
 * THE CATEGORY FILTER THE TOOL ALREADY ADVERTISED.
 *
 * `pinepaper_design_systems` took `tokenCategory` ("color" | "motion" |
 * "spacing" | "typography" | "all"), echoed it back in the query, and returned
 * every token regardless — a filter that reports success without filtering.
 * The keys carry their own category as the first segment, so this is that
 * segment and nothing more.
 *
 * COLOUR IS NOT ONE OF THEM, and this is where that becomes visible instead of
 * silently returning everything: these fifteen systems were captured for their
 * motion ladders, spacing grids and type scales. `colourAvailable: false` is
 * the honest answer, and the caller is pointed at the styles tool, which does
 * carry palettes.
 */
const CATEGORY_PREFIX: Record<string, string> = {
  motion: "motion.",
  spacing: "space.",
  typography: "type.",
};

export function categoryPrefixes(): Record<string, string> {
  return { ...CATEGORY_PREFIX };
}

/** A copy of the system carrying only the tokens of one category. `all` returns it unchanged. */
export function filterSystemTokens(system: DTCGDesignSystem, category: string): DTCGDesignSystem {
  if (!category || category === "all") return system;
  const prefix = CATEGORY_PREFIX[category];
  // An unknown category (including "color", which these systems do not carry)
  // yields NO tokens rather than all of them.
  const tokens: Record<string, DTCGToken> = {};
  if (prefix) {
    for (const [k, v] of Object.entries(system.tokens)) if (k.startsWith(prefix)) tokens[k] = v;
  }
  return { ...system, tokens };
}

/**
 * Every cubic-bezier token as the CSS string it stands for, keyed by token
 * name. `convertToCss` used to call tokenToCubicBezier on the SYSTEM object,
 * whose $type is undefined, so it always produced null.
 */
export function cssEasingsOf(system: DTCGDesignSystem): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(system.tokens)) {
    const css = tokenToCubicBezier(v);
    if (css) out[k] = css;
  }
  return out;
}
