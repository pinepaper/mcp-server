/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/brutalist-generator.ts
 * sha256:    256e363f74709c230319f29dc0dac403912dc27db2d734716e056abd6f2dd8d1
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface BrutalistElement {
  id: string;
  type: "text" | "shape" | "wireframe_box" | "highlight_tag";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  strokeHex?: string;
  strokeWidthPx?: number;
  borderRadiusPx?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign?: "left" | "center" | "right";
  hasBlur?: boolean;
}

export interface BrutalistPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
  darkVariant?: boolean;
}

export interface BrutalistDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: BrutalistElement[];
  metadata: {
    title: string;
    createdAt: string;
    compositionType: "brutalist_wireframe_raw";
    palette: string[];
  };
}

export const BRUTALIST_PALETTE = {
  white: "#ffffff",
  black: "#000000",
  neonYellow: "#ccff00",
  alertRed: "#ff3300",
  electricBlue: "#0022ff",
};

/**
 * Procedurally generates a Brutalist Raw Web poster layout with stark wireframe boxes, neon yellow highlights, and 0px border radius.
 */
export function generateBrutalistPoster(options: BrutalistPosterOptions): BrutalistDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = options.darkVariant ? BRUTALIST_PALETTE.black : BRUTALIST_PALETTE.white;
  const primaryTextColor = options.darkVariant ? BRUTALIST_PALETTE.white : BRUTALIST_PALETTE.black;

  const elements: BrutalistElement[] = [];

  // 1. Neon Yellow Highlight Box Header Tag
  elements.push({
    id: "brutalist-highlight-tag",
    type: "highlight_tag",
    fillHex: BRUTALIST_PALETTE.neonYellow,
    strokeHex: BRUTALIST_PALETTE.black,
    strokeWidthPx: 3,
    borderRadiusPx: 0,
    x: 40,
    y: 40,
    width: 220,
    height: 44,
  });

  elements.push({
    id: "brutalist-tag-text",
    type: "text",
    content: "RAW_UNSTYLED",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fillHex: BRUTALIST_PALETTE.black,
    x: 52,
    y: 52,
    width: 200,
    height: 30,
    textAlign: "left",
  });

  // 2. Heavy Wireframe Main Container Box (0px border radius)
  elements.push({
    id: "brutalist-main-box",
    type: "wireframe_box",
    fillHex: "transparent",
    strokeHex: primaryTextColor,
    strokeWidthPx: 4,
    borderRadiusPx: 0,
    x: 40,
    y: 104,
    width: width - 80,
    height: height - 164,
  });

  // 3. Stark Monospace Headline Text
  elements.push({
    id: "brutalist-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 58,
    fontWeight: "900",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fillHex: primaryTextColor,
    x: 64,
    y: 140,
    width: width - 128,
    height: 120,
    textAlign: "left",
  });

  // 4. Black Divider Line
  elements.push({
    id: "brutalist-divider-line",
    type: "shape",
    fillHex: primaryTextColor,
    borderRadiusPx: 0,
    x: 40,
    y: 280,
    width: width - 80,
    height: 4,
  });

  // 5. Subtitle Text Block
  elements.push({
    id: "brutalist-subtitle-text",
    type: "text",
    content: `// ${options.subtitle.toUpperCase()}`,
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "'JetBrains Mono', monospace",
    fillHex: options.darkVariant ? BRUTALIST_PALETTE.neonYellow : BRUTALIST_PALETTE.electricBlue,
    x: 64,
    y: 310,
    width: width - 128,
    height: 60,
    textAlign: "left",
  });

  // 6. Optional Body Copy Block inside secondary wireframe container
  if (options.body) {
    elements.push({
      id: "brutalist-body-box",
      type: "wireframe_box",
      fillHex: options.darkVariant ? "#111111" : "#f0f0f0",
      strokeHex: primaryTextColor,
      strokeWidthPx: 3,
      borderRadiusPx: 0,
      x: 64,
      y: 400,
      width: width - 128,
      height: 240,
    });

    elements.push({
      id: "brutalist-body-text",
      type: "text",
      content: options.body,
      fontSize: 16,
      fontWeight: "400",
      fontFamily: "'JetBrains Mono', monospace",
      fillHex: primaryTextColor,
      x: 80,
      y: 420,
      width: width - 160,
      height: 200,
      textAlign: "left",
    });
  }

  return {
    id: `brutalist-poster-${Date.now()}`,
    style: "brutalist_raw",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      compositionType: "brutalist_wireframe_raw",
      palette: [
        BRUTALIST_PALETTE.white,
        BRUTALIST_PALETTE.black,
        BRUTALIST_PALETTE.neonYellow,
        BRUTALIST_PALETTE.alertRed,
        BRUTALIST_PALETTE.electricBlue,
      ],
    },
  };
}
