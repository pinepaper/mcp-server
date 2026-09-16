/* GENERATED — DO NOT EDIT.
 *
 * Source:    mcp-cloud/src/services/de-stijl-generator.ts
 * sha256:    5d10004e97d7256af489c58d154c35a38e1d68d316631a6d7d9077d403e78c9f
 * Generator: scripts/sync-design-systems.mjs
 *
 * Edit the TypeScript upstream and re-run the generator. A hand edit here is
 * the second copy of the same design vocabulary that the generator exists to
 * prevent, and the provenance test will fail on it.
 */
import type { DesignStyle } from "./design-style.js";

export interface DeStijlElement {
  id: string;
  type: "text" | "shape" | "grid_line" | "color_block";
  content?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  fillHex: string;
  strokeHex?: string;
  strokeWidthPx?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign?: "left" | "center" | "right";
}

export interface DeStijlPosterOptions {
  title: string;
  subtitle: string;
  body?: string;
  width?: number;
  height?: number;
}

export interface DeStijlDesignScene {
  id: string;
  style: DesignStyle;
  width: number;
  height: number;
  backgroundHex: string;
  elements: DeStijlElement[];
  metadata: {
    title: string;
    createdAt: string;
    compositionType: "de_stijl_orthogonal_mondrian";
    palette: string[];
  };
}

export const DE_STIJL_PALETTE = {
  white: "#ffffff",
  black: "#000000",
  primaryRed: "#ff0000",
  primaryBlue: "#0000ff",
  primaryYellow: "#ffff00",
};

/**
 * Procedurally generates a De Stijl Neoplasticism Mondrian-inspired orthogonal poster layout.
 */
export function generateDeStijlPoster(options: DeStijlPosterOptions): DeStijlDesignScene {
  const width = options.width ?? 1080;
  const height = options.height ?? 1350;
  const backgroundHex = DE_STIJL_PALETTE.white;

  const elements: DeStijlElement[] = [];

  // 1. Top-Right Red Primary Block
  elements.push({
    id: "de-stijl-red-block",
    type: "color_block",
    fillHex: DE_STIJL_PALETTE.primaryRed,
    x: Math.round(width * 0.42),
    y: 0,
    width: Math.round(width * 0.58),
    height: Math.round(height * 0.42),
  });

  // 2. Bottom-Left Blue Primary Block
  elements.push({
    id: "de-stijl-blue-block",
    type: "color_block",
    fillHex: DE_STIJL_PALETTE.primaryBlue,
    x: 0,
    y: Math.round(height * 0.75),
    width: Math.round(width * 0.35),
    height: Math.round(height * 0.25),
  });

  // 3. Bottom-Right Yellow Primary Block
  elements.push({
    id: "de-stijl-yellow-block",
    type: "color_block",
    fillHex: DE_STIJL_PALETTE.primaryYellow,
    x: Math.round(width * 0.82),
    y: Math.round(height * 0.82),
    width: Math.round(width * 0.18),
    height: Math.round(height * 0.18),
  });

  // 4. Heavy Black Orthogonal Vertical Grid Line 1
  elements.push({
    id: "de-stijl-vert-line-1",
    type: "grid_line",
    fillHex: DE_STIJL_PALETTE.black,
    x: Math.round(width * 0.42),
    y: 0,
    width: 8,
    height,
  });

  // 5. Heavy Black Orthogonal Vertical Grid Line 2
  elements.push({
    id: "de-stijl-vert-line-2",
    type: "grid_line",
    fillHex: DE_STIJL_PALETTE.black,
    x: Math.round(width * 0.82),
    y: Math.round(height * 0.42),
    width: 8,
    height: Math.round(height * 0.58),
  });

  // 6. Heavy Black Orthogonal Horizontal Grid Line 1
  elements.push({
    id: "de-stijl-horiz-line-1",
    type: "grid_line",
    fillHex: DE_STIJL_PALETTE.black,
    x: 0,
    y: Math.round(height * 0.42),
    width,
    height: 8,
  });

  // 7. Heavy Black Orthogonal Horizontal Grid Line 2
  elements.push({
    id: "de-stijl-horiz-line-2",
    type: "grid_line",
    fillHex: DE_STIJL_PALETTE.black,
    x: 0,
    y: Math.round(height * 0.75),
    width: Math.round(width * 0.42),
    height: 8,
  });

  // 8. Headline Typography Block (Top-Left White Block)
  elements.push({
    id: "de-stijl-title-text",
    type: "text",
    content: options.title.toUpperCase(),
    fontSize: 64,
    fontWeight: "900",
    fontFamily: "Helvetica, Futura, sans-serif",
    fillHex: DE_STIJL_PALETTE.black,
    x: 40,
    y: Math.round(height * 0.08),
    width: Math.round(width * 0.36),
    height: 140,
    textAlign: "left",
  });

  // 9. Subtitle Text Block
  elements.push({
    id: "de-stijl-subtitle-text",
    type: "text",
    content: options.subtitle.toUpperCase(),
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Helvetica, sans-serif",
    fillHex: DE_STIJL_PALETTE.black,
    x: Math.round(width * 0.46),
    y: Math.round(height * 0.46),
    width: Math.round(width * 0.32),
    height: 80,
    textAlign: "left",
  });

  // 10. Optional Body Copy Block
  if (options.body) {
    elements.push({
      id: "de-stijl-body-text",
      type: "text",
      content: options.body,
      fontSize: 16,
      fontWeight: "400",
      fontFamily: "Helvetica, sans-serif",
      fillHex: DE_STIJL_PALETTE.black,
      x: Math.round(width * 0.46),
      y: Math.round(height * 0.58),
      width: Math.round(width * 0.32),
      height: 180,
      textAlign: "left",
    });
  }

  return {
    id: `de-stijl-poster-${Date.now()}`,
    style: "de_stijl_neoplasticism",
    width,
    height,
    backgroundHex,
    elements,
    metadata: {
      title: options.title,
      createdAt: new Date().toISOString(),
      compositionType: "de_stijl_orthogonal_mondrian",
      palette: [
        DE_STIJL_PALETTE.white,
        DE_STIJL_PALETTE.black,
        DE_STIJL_PALETTE.primaryRed,
        DE_STIJL_PALETTE.primaryBlue,
        DE_STIJL_PALETTE.primaryYellow,
      ],
    },
  };
}
